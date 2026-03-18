import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { noteId } = await req.json();
    if (!noteId) return Response.json({ error: 'noteId is required' }, { status: 400 });

    // Fetch the note
    const notes = await base44.entities.ClinicalNote.filter({ id: noteId });
    const note = notes?.[0];
    if (!note) return Response.json({ error: 'Note not found' }, { status: 404 });

    if (note.status !== 'finalized') {
      return Response.json({ error: 'Note must be finalized before billing analysis' }, { status: 400 });
    }

    // Build a comprehensive prompt for E&M analysis
    const prompt = `You are an expert medical billing coder specializing in Evaluation and Management (E&M) coding based on the 2021 AMA/CMS guidelines.

Analyze this clinical note and determine the appropriate E&M level. Use the MDM-based approach (problems, data reviewed, and risk of complications).

CLINICAL NOTE DATA:
- Chief Complaint: ${note.chief_complaint || 'NOT DOCUMENTED'}
- History of Present Illness: ${note.history_of_present_illness ? note.history_of_present_illness.substring(0, 500) : 'NOT DOCUMENTED'}
- Medical History: ${note.medical_history || 'NOT DOCUMENTED'}
- Review of Systems: ${note.review_of_systems ? note.review_of_systems.substring(0, 300) : 'NOT DOCUMENTED'}
- Physical Exam: ${note.physical_exam ? note.physical_exam.substring(0, 400) : 'NOT DOCUMENTED'}
- Assessment: ${note.assessment || 'NOT DOCUMENTED'}
- Plan: ${note.plan || 'NOT DOCUMENTED'}
- MDM Section: ${note.mdm || 'NOT DOCUMENTED'}
- Diagnoses: ${note.diagnoses?.join(', ') || 'NOT DOCUMENTED'}
- Medications: ${note.medications?.join(', ') || 'none'}
- Lab Findings: ${note.lab_findings?.length > 0 ? `${note.lab_findings.length} lab results documented` : 'none'}
- Imaging Findings: ${note.imaging_findings?.length > 0 ? `${note.imaging_findings.length} imaging studies documented` : 'none'}
- Note Type: ${note.note_type || 'progress_note'}

MDM SCORING CRITERIA (2021 AMA Guidelines):
- STRAIGHTFORWARD (99202/99212): 1 self-limited problem, minimal data, minimal risk
- LOW (99203/99213): 2+ self-limited OR 1 stable chronic illness, limited data, low risk
- MODERATE (99204/99214): 1+ chronic illness w/ exacerbation OR new problem, moderate data, moderate risk (prescription drugs)
- HIGH (99205/99215): 1+ chronic illness w/ severe exacerbation OR new problem threatening life, extensive data, high risk (drug therapy requiring monitoring, hospitalization)

Evaluate each MDM component and return a detailed billing analysis. Be specific about what is documented vs missing.`;

    const schema = {
      type: "object",
      properties: {
        em_level: { type: "string", description: "Recommended CPT code (e.g., 99214)" },
        em_level_label: { type: "string", description: "Label like 'Level 4 - Moderate Complexity'" },
        complexity: { type: "string", enum: ["straightforward", "low", "moderate", "high"] },
        score: { type: "number", description: "Overall documentation quality score 0-100" },
        mdm_score: {
          type: "object",
          properties: {
            problems: { type: "number", description: "Problems score 0-3" },
            data: { type: "number", description: "Data reviewed score 0-3" },
            risk: { type: "number", description: "Risk score 0-3" }
          }
        },
        documentation_gaps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              severity: { type: "string", enum: ["critical", "warning", "info"] },
              message: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        },
        upgrade_opportunities: {
          type: "array",
          items: { type: "string" },
          description: "Specific documentation improvements that could support a higher level"
        },
        compliant: { type: "boolean" },
        time_based_eligible: { type: "boolean" },
        estimated_time_minutes: { type: "number" },
        ai_reasoning: { type: "string", description: "Detailed explanation of the billing determination" }
      }
    };

    // Call AI - using fetch to OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert E&M billing coder. Always return valid JSON matching the requested schema." },
          { role: "user", content: prompt + "\n\nReturn a JSON object matching this schema:\n" + JSON.stringify(schema, null, 2) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const openaiData = await openaiRes.json();
    const analysis = JSON.parse(openaiData.choices[0].message.content);

    // Save or update analysis in DB
    const existing = await base44.entities.BillingAnalysis.filter({ note_id: noteId });

    const payload = {
      note_id: noteId,
      patient_name: note.patient_name || '',
      patient_id: note.patient_id || '',
      date_of_visit: note.date_of_visit || '',
      note_type: note.note_type || 'progress_note',
      ...analysis,
      analyzed_at: new Date().toISOString()
    };

    let saved;
    if (existing.length > 0) {
      saved = await base44.entities.BillingAnalysis.update(existing[0].id, payload);
    } else {
      saved = await base44.entities.BillingAnalysis.create(payload);
    }

    return Response.json({ success: true, analysis: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});