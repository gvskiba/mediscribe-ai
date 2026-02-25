import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPECIALTY_GUIDELINES = {
  emergency_medicine: "Provide immediate, life-saving interventions and stabilization measures. Emphasize rapid assessment and acute care protocols.",
  internal_medicine: "Provide comprehensive, evidence-based management for systemic conditions. Include diagnostic workup and long-term management.",
  family_medicine: "Provide practical, patient-centered care emphasizing prevention and continuity. Consider whole-person approach.",
  pediatrics: "Provide age-appropriate treatments with pediatric dosing. Consider growth, development, and family involvement.",
  cardiology: "Provide cardiac-specific management including medications, monitoring, and intervention. Emphasize cardiovascular risk reduction.",
  pulmonology: "Provide respiratory-specific management including medications, oxygen therapy, and monitoring. Emphasize lung function.",
  neurology: "Provide neurological-specific management with focus on symptom control and disease progression. Include specialist referrals.",
  psychiatry: "Provide psychiatric medications and therapies with psychosocial support. Emphasize mental health and safety.",
  surgery: "Provide operative and perioperative recommendations. Include indication for surgery and post-operative care.",
  orthopedics: "Provide musculoskeletal-specific treatment including immobilization, PT, and when surgery is indicated."
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { diagnoses, assessment, specialty = "internal_medicine" } = await req.json();

    if (!diagnoses || diagnoses.length === 0) {
      return Response.json({ error: 'At least one diagnosis required' }, { status: 400 });
    }

    const guideline = SPECIALTY_GUIDELINES[specialty] || SPECIALTY_GUIDELINES.internal_medicine;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive treatment plan for the following diagnoses, specifically tailored to ${specialty.replace(/_/g, " ").toUpperCase()}.

SPECIALTY GUIDELINES: ${guideline}

DIAGNOSES:
${diagnoses.join('\n')}

CLINICAL ASSESSMENT:
${assessment || "N/A"}

IMPORTANT: The treatment plan must be appropriate and practical for ${specialty.replace(/_/g, " ")}. Include:

1. IMMEDIATE ACTIONS: Urgent interventions or assessments needed
2. MEDICATIONS: Specific drugs, dosing, frequency, and duration for this specialty
3. NON-PHARMACOLOGICAL INTERVENTIONS: Procedures, monitoring, lifestyle changes, therapies
4. FOLLOW-UP PLAN: Next steps, timing, and specialty follow-ups needed (include referrals specific to this specialty)
5. PATIENT EDUCATION: Key points to discuss with patient
6. RED FLAGS: Warning signs requiring urgent evaluation

Format as clear, actionable recommendations.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          immediate_actions: { type: "array", items: { type: "string" } },
          medications: { type: "array", items: { type: "string" } },
          interventions: { type: "array", items: { type: "string" } },
          follow_up: { type: "array", items: { type: "string" } },
          education: { type: "array", items: { type: "string" } },
          red_flags: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});