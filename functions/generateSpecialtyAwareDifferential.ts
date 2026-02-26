import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPECIALTY_CONTEXTS = {
  emergency_medicine: "Focus on acute, life-threatening conditions and emergency-specific presentations. Prioritize rapid diagnosis and stabilization.",
  internal_medicine: "Focus on systemic diseases and chronic conditions in adults. Consider metabolic and endocrine causes.",
  family_medicine: "Focus on common presentations seen in primary care. Consider preventive aspects and family history implications.",
  pediatrics: "Focus on pediatric-specific conditions and age-appropriate differential. Consider developmental factors.",
  cardiology: "Focus on cardiac and cardiovascular etiologies. Prioritize cardiac conditions in the differential.",
  pulmonology: "Focus on respiratory and pulmonary etiologies. Prioritize lung and airway conditions.",
  neurology: "Focus on neurological and neuropsychiatric conditions. Prioritize neurological etiologies.",
  psychiatry: "Focus on psychiatric and behavioral conditions. Consider substance use and psychosocial factors.",
  surgery: "Focus on surgical conditions and considerations. Evaluate need for surgical intervention.",
  orthopedics: "Focus on musculoskeletal and orthopedic conditions. Consider biomechanical factors."
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chiefComplaint, hpi, physicalExam, assessment, specialty = "internal_medicine", symptoms, patientHistory } = await req.json();

    if (!chiefComplaint && !symptoms) {
      return Response.json({ error: 'Chief complaint or symptoms required' }, { status: 400 });
    }

    const specialtyContext = SPECIALTY_CONTEXTS[specialty] || SPECIALTY_CONTEXTS.internal_medicine;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive differential diagnosis list based on this clinical presentation, specifically tailored to ${specialty.replace(/_/g, " ").toUpperCase()}.

SPECIALTY CONTEXT: ${specialtyContext}

CHIEF COMPLAINT:
${chiefComplaint || "Not specified"}

${symptoms ? `SYMPTOMS:\n${symptoms}\n` : ""}
${patientHistory ? `PATIENT HISTORY (PMH, medications, allergies, social/family history):\n${patientHistory}\n` : ""}

HISTORY OF PRESENT ILLNESS:
${hpi || "N/A"}

PHYSICAL EXAM:
${physicalExam || "N/A"}

VITAL SIGNS & ASSESSMENT:
${assessment || "N/A"}

IMPORTANT: Use ALL available clinical information above to generate the most accurate differentials. Generate differentials that are relevant and commonly seen in ${specialty.replace(/_/g, " ")}. Rank by likelihood within this specialty context and provide reasoning for each.

Provide results with: diagnosis, likelihood_rank (1-5, 5 being most likely), clinical_reasoning, red_flags_to_monitor.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          differentials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                diagnosis: { type: "string" },
                likelihood_rank: { type: "number", minimum: 1, maximum: 5 },
                clinical_reasoning: { type: "string" },
                red_flags_to_monitor: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    const sorted = (result.differentials || []).sort((a, b) => b.likelihood_rank - a.likelihood_rank);
    return Response.json({ differentials: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});