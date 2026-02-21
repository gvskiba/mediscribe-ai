import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await req.json();

    if (!noteId) {
      return Response.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Fetch the note directly by ID
    const note = await base44.entities.ClinicalNote.get(noteId);

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    // Build structured ROS text from object (includes ALL systems, normal and abnormal)
    let rosText = null;
    if (note.review_of_systems && typeof note.review_of_systems === 'object' && !Array.isArray(note.review_of_systems)) {
      const rosLines = Object.entries(note.review_of_systems)
        .map(([system, finding]) => `  ${system.replace(/_/g, ' ').toUpperCase()}: ${finding}`)
        .join('\n');
      rosText = rosLines ? `REVIEW OF SYSTEMS (all documented systems):\n${rosLines}` : null;
    } else if (typeof note.review_of_systems === 'string' && note.review_of_systems) {
      rosText = `REVIEW OF SYSTEMS:\n${note.review_of_systems}`;
    }

    // Build content from whatever is available
    const availableContent = [
      note.raw_note ? `RAW NOTE:\n${note.raw_note}` : null,
      note.chief_complaint ? `CHIEF COMPLAINT: ${note.chief_complaint}` : null,
      note.history_of_present_illness ? `HPI: ${note.history_of_present_illness}` : null,
      rosText,
      note.assessment ? `ASSESSMENT: ${note.assessment}` : null,
      note.plan ? `PLAN: ${note.plan}` : null,
    ].filter(Boolean).join('\n\n');

    if (!availableContent) {
      return Response.json({ error: 'No note content to analyze' }, { status: 400 });
    }

    // Invoke LLM to extract and structure all fields
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert clinical documentation specialist. Analyze this clinical content and extract ALL relevant structured medical information. Be thorough and accurate.

CLINICAL CONTENT:
${availableContent}

CRITICAL REQUIREMENTS:
1. For DIAGNOSES: Extract ALL diagnoses, suspected conditions, impressions, and clinical findings. MUST include at least one item. If none explicitly stated, infer from chief complaint and assessment.
2. For SUMMARY: Create a concise 2-3 sentence overview of the visit
3. For MEDICATIONS: Extract ALL medications with dosages and frequency
4. For LAB FINDINGS: If mentioned, extract as separate items with test name, result, unit, status
5. For IMAGING FINDINGS: If mentioned, extract study type, location, findings, and impression
6. For ALLERGIES: Extract all drug and environmental allergies
7. For other fields: Extract only if present in the note

Return comprehensive structured data with no placeholders or "[Not documented]" values - only actual extracted content.`,
      response_json_schema: {
        type: "object",
        properties: {
          chief_complaint: { type: "string", description: "Primary reason for visit" },
          summary: { type: "string", description: "Concise overview of the visit" },
          history_of_present_illness: { type: "string", description: "Detailed HPI" },
          review_of_systems: { type: "string", description: "Review of systems findings" },
          physical_exam: { type: "string", description: "Physical exam findings" },
          assessment: { type: "string", description: "Clinical assessment" },
          plan: { type: "string", description: "Treatment plan" },
          medical_history: { type: "string", description: "Past medical history" },
          diagnoses: {
            type: "array",
            items: { type: "string" },
            description: "All diagnoses and clinical impressions"
          },
          medications: {
            type: "array",
            items: { type: "string" },
            description: "All medications with dosages and frequency"
          },
          allergies: {
            type: "array",
            items: { type: "string" },
            description: "All known allergies"
          },
          lab_findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                test_name: { type: "string" },
                result: { type: "string" },
                unit: { type: "string" },
                reference_range: { type: "string" },
                status: { type: "string", enum: ["normal", "abnormal", "critical"] }
              }
            },
            description: "Laboratory findings if mentioned"
          },
          imaging_findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                study_type: { type: "string" },
                location: { type: "string" },
                findings: { type: "string" },
                impression: { type: "string" }
              }
            },
            description: "Imaging findings if mentioned"
          }
        },
        required: ["chief_complaint", "diagnoses"]
      }
    });

    // Build update object with only non-empty fields
    const updateData = {};

    if (result.chief_complaint) updateData.chief_complaint = result.chief_complaint;
    if (result.summary) updateData.summary = result.summary;
    if (result.history_of_present_illness) updateData.history_of_present_illness = result.history_of_present_illness;
    if (result.review_of_systems) updateData.review_of_systems = result.review_of_systems;
    if (result.physical_exam) updateData.physical_exam = result.physical_exam;
    if (result.assessment) updateData.assessment = result.assessment;
    if (result.plan) updateData.plan = result.plan;
    if (result.medical_history) updateData.medical_history = result.medical_history;

    // Only include non-empty arrays
    if (result.diagnoses && Array.isArray(result.diagnoses) && result.diagnoses.length > 0) {
      updateData.diagnoses = result.diagnoses;
    }
    if (result.medications && Array.isArray(result.medications) && result.medications.length > 0) {
      // Normalize medications: LLM sometimes returns objects instead of strings
      updateData.medications = result.medications.map(med => {
        if (typeof med === 'string') return med;
        if (typeof med === 'object' && med !== null) {
          const parts = [med.name, med.dosage, med.frequency].filter(Boolean);
          return parts.join(' - ');
        }
        return String(med);
      });
    }
    if (result.allergies && Array.isArray(result.allergies) && result.allergies.length > 0) {
      updateData.allergies = result.allergies;
    }
    if (result.lab_findings && Array.isArray(result.lab_findings) && result.lab_findings.length > 0) {
      updateData.lab_findings = result.lab_findings;
    }
    if (result.imaging_findings && Array.isArray(result.imaging_findings) && result.imaging_findings.length > 0) {
      updateData.imaging_findings = result.imaging_findings;
    }

    // Update the note with extracted data
    await base44.entities.ClinicalNote.update(noteId, updateData);

    return Response.json({
      success: true,
      message: 'Note analyzed and structured successfully',
      structured: updateData,
      extracted: {
        fields_populated: Object.keys(updateData).length,
        diagnoses_found: updateData.diagnoses?.length || 0,
        medications_found: updateData.medications?.length || 0,
        lab_findings_found: updateData.lab_findings?.length || 0,
        imaging_findings_found: updateData.imaging_findings?.length || 0
      }
    });
  } catch (error) {
    console.error('Error analyzing note:', error);
    return Response.json(
      { error: error.message || 'Failed to analyze note' },
      { status: 500 }
    );
  }
});