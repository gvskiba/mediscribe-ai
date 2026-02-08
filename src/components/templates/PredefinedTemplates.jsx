// Predefined clinical note templates following medical best practices

export const PREDEFINED_TEMPLATES = {
  soap_note: {
    name: "SOAP Note",
    description: "Subjective, Objective, Assessment, Plan format",
    note_type: "progress_note",
    category: "general",
    sections: [
      {
        id: "subjective",
        name: "Subjective",
        description: "Patient's reported symptoms and history",
        order: 1,
        enabled: true,
        ai_instructions: "Extract all subjective information: chief complaint, history of present illness, patient-reported symptoms, and relevant past medical/social/family history. Use patient's own words when possible.",
        ai_instructions_detailed: {
          global_instructions: "Focus on what the patient reports, not what you observe. Include OLDCARTS elements for HPI.",
          field_instructions: [
            { field_name: "chief_complaint", instructions: "Extract primary reason for visit in patient's words" },
            { field_name: "hpi", instructions: "Detailed narrative using OLDCARTS: Onset, Location, Duration, Character, Alleviating/Aggravating factors, Radiation, Temporal patterns, Severity" },
            { field_name: "review_of_systems", instructions: "Systematic review by body system of what patient reports" }
          ]
        }
      },
      {
        id: "objective",
        name: "Objective",
        description: "Physical exam findings and objective data",
        order: 2,
        enabled: true,
        ai_instructions: "Extract all objective findings: vital signs, physical examination findings by system, and any test results mentioned. Be specific and measurable.",
        ai_instructions_detailed: {
          global_instructions: "Document only observable, measurable findings. Include normal findings and pertinent negatives.",
          field_instructions: [
            { field_name: "vitals", instructions: "Extract BP, HR, RR, Temp, O2 sat, height, weight if mentioned" },
            { field_name: "physical_exam", instructions: "Organize by system: General, HEENT, Cardiovascular, Respiratory, Abdomen, Extremities, Neurological, Skin" }
          ]
        }
      },
      {
        id: "assessment",
        name: "Assessment",
        description: "Clinical impression and differential diagnosis",
        order: 3,
        enabled: true,
        ai_instructions: "Synthesize subjective and objective data into clinical assessment. Include primary diagnosis and differential diagnoses with supporting evidence.",
        ai_instructions_detailed: {
          global_instructions: "Demonstrate clinical reasoning. Explain why certain diagnoses are more or less likely based on findings.",
          field_instructions: [
            { field_name: "primary_diagnosis", instructions: "Most likely diagnosis with supporting evidence" },
            { field_name: "differential", instructions: "Alternative diagnoses to consider" },
            { field_name: "clinical_reasoning", instructions: "Brief explanation of diagnostic thought process" }
          ]
        }
      },
      {
        id: "plan",
        name: "Plan",
        description: "Treatment plan and follow-up",
        order: 4,
        enabled: true,
        ai_instructions: "Create comprehensive evidence-based treatment plan including medications, interventions, tests, follow-up, and patient education.",
        ai_instructions_detailed: {
          global_instructions: "Be specific with medications (drug, dose, frequency, duration), tests ordered, and follow-up timing.",
          field_instructions: [
            { field_name: "medications", instructions: "List with specific dosing: drug name, dose, route, frequency, duration" },
            { field_name: "diagnostic_tests", instructions: "Specific tests ordered with rationale" },
            { field_name: "follow_up", instructions: "Timing and conditions for return visit" },
            { field_name: "patient_education", instructions: "What to monitor, when to seek care, lifestyle modifications" }
          ]
        }
      }
    ],
    ai_instructions: "Generate a structured SOAP note following best practices. Each section should be clearly delineated and comprehensive. Use professional medical language while maintaining clarity."
  },

  history_and_physical: {
    name: "History & Physical",
    description: "Comprehensive admission H&P",
    note_type: "h_and_p",
    category: "general",
    sections: [
      {
        id: "chief_complaint",
        name: "Chief Complaint",
        order: 1,
        enabled: true,
        ai_instructions: "Brief statement of primary reason for admission in patient's words or clinical terms."
      },
      {
        id: "hpi",
        name: "History of Present Illness",
        order: 2,
        enabled: true,
        ai_instructions: "Detailed chronological narrative of current illness using OLDCARTS framework. Include relevant context and timeline.",
        ai_instructions_detailed: {
          global_instructions: "Tell the complete story of this illness episode from onset to presentation.",
          field_instructions: [
            { field_name: "onset", instructions: "When symptoms began, sudden vs gradual" },
            { field_name: "location", instructions: "Where symptoms are located" },
            { field_name: "duration", instructions: "How long symptoms have persisted" },
            { field_name: "character", instructions: "Quality and nature of symptoms" },
            { field_name: "alleviating_aggravating", instructions: "What makes it better or worse" },
            { field_name: "radiation", instructions: "Does pain/symptom spread elsewhere" },
            { field_name: "temporal", instructions: "Pattern over time: constant, intermittent, progressive" },
            { field_name: "severity", instructions: "Impact on function, pain scale if applicable" }
          ]
        }
      },
      {
        id: "pmh",
        name: "Past Medical History",
        order: 3,
        enabled: true,
        ai_instructions: "List chronic conditions, previous hospitalizations, surgeries, and significant illnesses."
      },
      {
        id: "medications",
        name: "Current Medications",
        order: 4,
        enabled: true,
        ai_instructions: "Complete medication list with dosages, frequencies, and indication if known."
      },
      {
        id: "allergies",
        name: "Allergies",
        order: 5,
        enabled: true,
        ai_instructions: "Drug allergies and reactions. Specify type of reaction (rash, anaphylaxis, etc.)."
      },
      {
        id: "social_history",
        name: "Social History",
        order: 6,
        enabled: true,
        ai_instructions: "Tobacco, alcohol, drug use; occupation; living situation; functional status."
      },
      {
        id: "family_history",
        name: "Family History",
        order: 7,
        enabled: true,
        ai_instructions: "Significant family medical history relevant to current presentation."
      },
      {
        id: "ros",
        name: "Review of Systems",
        order: 8,
        enabled: true,
        ai_instructions: "Comprehensive systematic review by organ system. Document both positive and pertinent negative findings.",
        ai_instructions_detailed: {
          global_instructions: "Organize by system: Constitutional, HEENT, Cardiovascular, Respiratory, GI, GU, Musculoskeletal, Skin, Neurologic, Psychiatric, Endocrine, Hematologic.",
          field_instructions: []
        }
      },
      {
        id: "physical_exam",
        name: "Physical Examination",
        order: 9,
        enabled: true,
        ai_instructions: "Complete physical examination findings organized by system. Include vital signs first, then general appearance, then system-by-system examination.",
        ai_instructions_detailed: {
          global_instructions: "Be specific and measurable. Document normal findings and abnormalities.",
          field_instructions: [
            { field_name: "vitals", instructions: "BP, HR, RR, Temp, O2 sat, pain score" },
            { field_name: "general", instructions: "Overall appearance, distress level, mental status" }
          ]
        }
      },
      {
        id: "labs_imaging",
        name: "Pertinent Labs/Imaging",
        order: 10,
        enabled: true,
        ai_instructions: "Relevant laboratory and imaging results with interpretation."
      },
      {
        id: "assessment_plan",
        name: "Assessment & Plan",
        order: 11,
        enabled: true,
        ai_instructions: "Problem-based assessment and plan. For each active problem, provide assessment and specific plan.",
        ai_instructions_detailed: {
          global_instructions: "List problems in order of acuity/importance. For each: brief assessment, plan for diagnostics, therapeutics, and monitoring.",
          field_instructions: []
        }
      }
    ],
    ai_instructions: "Generate comprehensive admission History & Physical following standard medical format. Be thorough and organized. Use appropriate medical terminology."
  },

  discharge_summary: {
    name: "Discharge Summary",
    description: "Hospital discharge documentation",
    note_type: "discharge_summary",
    category: "general",
    sections: [
      {
        id: "admission_info",
        name: "Admission Information",
        order: 1,
        enabled: true,
        ai_instructions: "Admission date, discharge date, attending physician, principal diagnosis."
      },
      {
        id: "chief_complaint",
        name: "Chief Complaint / Reason for Admission",
        order: 2,
        enabled: true,
        ai_instructions: "Brief statement of why patient was admitted."
      },
      {
        id: "hospital_course",
        name: "Hospital Course",
        order: 3,
        enabled: true,
        ai_instructions: "Narrative summary of patient's hospitalization organized chronologically or by problem. Include significant events, treatments, and patient response.",
        ai_instructions_detailed: {
          global_instructions: "Tell the story of the hospitalization. Include key diagnostic findings, treatments initiated, complications, and clinical trajectory.",
          field_instructions: []
        }
      },
      {
        id: "procedures",
        name: "Procedures Performed",
        order: 4,
        enabled: true,
        ai_instructions: "List all procedures, surgeries, or interventions performed during admission with dates."
      },
      {
        id: "discharge_diagnoses",
        name: "Discharge Diagnoses",
        order: 5,
        enabled: true,
        ai_instructions: "List final diagnoses in order of importance. Include primary diagnosis first, then secondary diagnoses.",
        ai_instructions_detailed: {
          global_instructions: "Use specific terminology. Include complications if any.",
          field_instructions: []
        }
      },
      {
        id: "discharge_medications",
        name: "Discharge Medications",
        order: 6,
        enabled: true,
        ai_instructions: "Complete medication list with drug name, dose, route, frequency, and indication. Note any new medications or changes from admission.",
        ai_instructions_detailed: {
          global_instructions: "Be explicit about which medications are new, continued, or discontinued.",
          field_instructions: []
        }
      },
      {
        id: "discharge_condition",
        name: "Condition at Discharge",
        order: 7,
        enabled: true,
        ai_instructions: "Patient's clinical status at discharge (stable, improved, etc.) and functional status."
      },
      {
        id: "discharge_instructions",
        name: "Discharge Instructions",
        order: 8,
        enabled: true,
        ai_instructions: "Detailed instructions for patient including activity level, diet, wound care, medication instructions, when to seek medical attention.",
        ai_instructions_detailed: {
          global_instructions: "Be specific and patient-friendly. Include warning signs that require immediate medical attention.",
          field_instructions: [
            { field_name: "activity", instructions: "Activity restrictions or recommendations" },
            { field_name: "diet", instructions: "Dietary instructions" },
            { field_name: "medications", instructions: "How to take medications, what to avoid" },
            { field_name: "warning_signs", instructions: "When to call doctor or go to ED" }
          ]
        }
      },
      {
        id: "follow_up",
        name: "Follow-up Appointments",
        order: 9,
        enabled: true,
        ai_instructions: "Specific follow-up appointments scheduled or recommended with timing and provider."
      }
    ],
    ai_instructions: "Generate comprehensive discharge summary documenting entire hospitalization. Ensure continuity of care by providing clear follow-up plan and patient instructions."
  }
};

export const createPredefinedTemplate = async (templateKey, base44Client) => {
  const template = PREDEFINED_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }

  return await base44Client.entities.NoteTemplate.create(template);
};