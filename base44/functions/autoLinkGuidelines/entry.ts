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

    // Fetch the note
    const notes = await base44.entities.ClinicalNote.list();
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    // Extract diagnoses from note
    const diagnoses = note.diagnoses || [];
    if (diagnoses.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No diagnoses found to link guidelines',
        linked_guidelines: []
      });
    }

    // Fetch guidelines for top diagnoses
    const guidelinePromises = diagnoses.slice(0, 3).map(async (diagnosis) => {
      try {
        const cleanDiagnosis = diagnosis.replace(/\(.*?\)/g, '').trim();
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Provide a brief evidence-based guideline recommendation for: ${cleanDiagnosis}
          
Include:
1. Key diagnostic criteria and workup
2. First-line treatment recommendations
3. When to refer or escalate care

Be concise and actionable.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              key_recommendations: { 
                type: "array", 
                items: { type: "string" }
              },
              diagnostic_approach: { type: "string" },
              first_line_treatments: { 
                type: "array",
                items: { type: "string" }
              },
              referral_criteria: { type: "string" }
            }
          }
        });

        return {
          condition: cleanDiagnosis,
          guideline_query_id: `guideline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          summary: result.summary,
          recommendations: result.key_recommendations || [],
          diagnostic_approach: result.diagnostic_approach,
          first_line_treatments: result.first_line_treatments || [],
          referral_criteria: result.referral_criteria,
          incorporated: false,
          adherence_notes: "Awaiting review and incorporation"
        };
      } catch (error) {
        console.error(`Failed to fetch guideline for ${diagnosis}:`, error);
        return null;
      }
    });

    const fetchedGuidelines = await Promise.all(guidelinePromises);
    const linkedGuidelines = fetchedGuidelines.filter(g => g !== null);

    // Update note with linked guidelines
    if (linkedGuidelines.length > 0) {
      await base44.entities.ClinicalNote.update(noteId, {
        linked_guidelines: linkedGuidelines
      });
    }

    return Response.json({
      success: true,
      linked_guidelines: linkedGuidelines,
      message: `Successfully linked ${linkedGuidelines.length} evidence-based guidelines`
    });
  } catch (error) {
    console.error('Auto-link guidelines error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});