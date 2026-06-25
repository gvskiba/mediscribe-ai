// QuickNotePrompts.js
// Pure builder functions — no React dependencies
// Extracted from QuickNote.jsx for file size management
// Exports: buildMDMPrompt, buildDispPrompt, buildMDMBlock,
//          buildFullNote, buildPhase1Copy, buildPhase2Copy

const SYS_BIAS = `COGNITIVE BIAS PREVENTION — apply before generating output:
1. ANCHORING BIAS: Do not anchor your MDM level to the triage impression or chief complaint. Derive complexity independently from the clinical data.
2. PREMATURE CLOSURE: After identifying the leading diagnosis, conduct a mandatory differential pass for at least 2 alternative or co-existing diagnoses.
3. FRAMING BIAS: Evaluate severity based on the objective findings, not the narrative framing of the presenting complaint.
4. AVAILABILITY BIAS: Do not over-weight dramatic diagnoses. Apply pre-test probability and base rates.`;

export const MDM_SCHEMA = {
  type: "object",
  required: ["working_diagnosis","initial_impression","initial_management","mdm_level","problem_complexity","data_complexity","risk_tier"],
  properties: {
    working_diagnosis: { type: "string" },
    initial_impression: {
      type: "object",
      required: ["vital_analysis","hpi_synthesis","working_dx_line","clinical_rationale","cannot_exclude","differentials"],
      properties: {
        vital_analysis: {
          type: "object",
          properties: {
            summary: { type: "string" },
            abnormalities: { type: "array", items: { type: "object", properties: { vital: { type: "string" }, value: { type: "string" }, interpretation: { type: "string" }, severity: { type: "string" } } } },
            overall_stability: { type: "string" }
          }
        },
        hpi_synthesis: {
          type: "object",
          properties: {
            onset_and_timeline: { type: "string" },
            character_and_severity: { type: "string" },
            associated_symptoms: { type: "string" },
            modifying_factors: { type: "string" },
            pertinent_negatives: { type: "string" },
            clinical_concern_level: { type: "string" }
          }
        },
        working_dx_line: { type: "string" },
        clinical_rationale: { type: "string" },
        cannot_exclude: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
        differentials: { type: "array", minItems: 2, maxItems: 8, items: { type: "object", required: ["rank","diagnosis","rationale"], properties: { rank: { type: "integer" }, diagnosis: { type: "string" }, rationale: { type: "string" } } } },
      },
    },
    initial_management: {
      type: "object",
      required: ["immediate_interventions","diagnostics","pending_data_summary"],
      properties: {
        immediate_interventions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
        diagnostics: { type: "array", minItems: 1, maxItems: 10, items: { type: "object", required: ["test","rationale"], properties: { test: { type: "string" }, rationale: { type: "string" } } } },
        pending_data_summary: { type: "string" },
      },
    },
    mdm_level: { type: "string" },
    mdm_label: { type: "string" },
    problem_complexity: { type: "string" },
    data_complexity: { type: "string" },
    risk_tier: { type: "string" },
    acep_policy_ref: { type: "string" },
    mdm_confidence: { type: "string" },
    mdm_confidence_note: { type: "string" },
  },
};

export const DISP_SCHEMA = {
  type: "object",
  required: ["disposition", "reevaluation_note", "final_diagnosis", "updated_impression", "plan_summary"],
  properties: {
    reevaluation_note:       { type: "string" },
    treatment_response:      { type: "string" },
    updated_impression:      { type: "string" },
    final_diagnosis:         { type: "string" },
    disposition:             { type: "string" },
    disposition_rationale:   { type: "string" },
    admission_service:       { type: "string" },
    plan_summary:            { type: "string" },
    orders:                  { type: "array", items: { type: "string" }, maxItems: 12 },
    result_flags: {
      type: "array",
      maxItems: 16,
      items: {
        type: "object",
        required: ["parameter", "value", "status", "clinical_significance", "recommendation"],
        properties: {
          parameter:            { type: "string" },
          value:                { type: "string" },
          status:               { type: "string" },
          clinical_significance:{ type: "string" },
          recommendation:       { type: "string" },
          guideline_citation:   { type: "string" },
        },
      },
    },
    discharge_instructions: {
      type: "object",
      required: ["diagnosis_explanation", "return_precautions", "followup"],
      properties: {
        diagnosis_explanation: { type: "string" },
        medications:           { type: "array", items: { type: "string" }, maxItems: 8 },
        activity:              { type: "string" },
        diet:                  { type: "string" },
        return_precautions:    { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
        followup:              { type: "string" },
        home_care_instructions:{ type: "array", items: { type: "string" }, maxItems: 8 },
        acep_policy_ref:       { type: "string" },
      },
    },
  },
};

function buildMDMPrompt(cc, vitals, hpi, ros, exam, vhAnalysis, parsedMeds, parsedAllergies, encounterType) {
  const SPECIALTY_CONTEXT = {
    peds:"\nSPECIALTY CONTEXT — PEDIATRIC ED: Weight-based dosing required. Vital sign interpretation must use age-appropriate norms. Fever in infants under 3 months is a critical action. Consider NAT (non-accidental trauma) for unexplained injuries. Parental concern is a legitimate factor in MDM complexity. Social determinants and caregiver reliability affect disposition.",
    psych:`\nSPECIALTY CONTEXT — PSYCHIATRIC EMERGENCY: Medical clearance is required before psychiatric disposition. Assess for organic causes of AMS (glucose, electrolytes, toxicology, head CT if indicated). Document SI/HI with plan, means, intent, and prior attempts. Collateral history is high-value data. Involuntary hold criteria vary by state — document capacity assessment. Safety to self and others drives disposition.`,
    trauma:`\nSPECIALTY CONTEXT — TRAUMA: ATLS primary survey (ABCDE) governs MDM sequence. Document mechanism of injury. GCS and neurologic exam are mandatory. Hemorrhage control and hemodynamic stability drive immediate critical actions. Consider FAST exam and CXR as first-line imaging. Trauma surgery and orthopedics consult thresholds are lower than general ED.`,
    obs:`\nSPECIALTY CONTEXT — OBSERVATION UNIT: Focus on protocol-driven workup and time-defined endpoints. Chest pain obs: serial troponins, stress testing pathway. Syncope obs: telemetry, orthostatics, echo if indicated. Document medical necessity for observation vs inpatient admission. Expected LOS 8-48 hours. Discharge planning begins at admission.`,
    adult:"",
  };
  const specContext = SPECIALTY_CONTEXT[encounterType || "adult"] || "";
  const vhContext = vhAnalysis?.trend_narrative
    ? `\nVITAL SIGNS TREND ANALYSIS (from VitalsHub — use in MDM complexity assessment):\n${vhAnalysis.trend_narrative}${vhAnalysis.clinical_flags?.length ? "\nKey observations: " + vhAnalysis.clinical_flags.join(" | ") : ""}\n`
    : "";
  const medsContext = parsedMeds?.length
    ? `\nCURRENT MEDICATIONS:\n${parsedMeds.map(m => `  ${m.name} ${m.dose} ${m.route} ${m.frequency}`.trim()).join("\n")}`
    : "";
  const allergiesContext = parsedAllergies?.length
    ? `\nKNOWN ALLERGIES:\n${parsedAllergies.map(a => `  ${a.allergen}: ${a.reaction}`).join("\n")}`
    : "";
  return `${SYS_BIAS}

You are a board-certified emergency physician generating a Medical Decision Making (MDM) assessment. Apply the AMA/CMS 2023 E&M MDM table for Emergency Medicine (99281-99285 + 99291).

MDM COMPLEXITY TABLE (2023 E&M):
- STRAIGHTFORWARD: 1 self-limited/minor problem | Minimal/none data | Minimal risk
- LOW: 1 stable chronic illness or 2+ self-limited | Limited data (order/review tests) | Low risk
- MODERATE: 1 or more chronic illness with exacerbation, undiagnosed new problem, 1 acute illness with systemic symptoms | Moderate data (independent interpretation of test, discussion with other provider) | Moderate risk (Rx drug management, minor surgery)
- HIGH: 1 or more chronic illness with severe exacerbation, acute/chronic illness posing threat to life/function | Extensive data | High risk (drug therapy requiring intensive monitoring, decision for emergency major surgery, hospitalization)

ACEP GUIDANCE: In the ED, MDM complexity is driven primarily by the HIGHEST level achieved across any one of the three columns (problem, data, risk) — not an average.

PATIENT PRESENTATION:
Chief Complaint: ${cc || "Not provided"}
Triage Vitals: ${vitals || "Not provided"}
HPI: ${hpi || "Not provided"}
ROS: ${ros || "Not provided"}
Physical Exam: ${exam || "Not provided"}${vhContext}${medsContext}${allergiesContext}${specContext}

Generate the MDM assessment. Use ONLY the following exact values for each field:

problem_complexity — pick the single best match:
"1 self-limited or minor problem" | "1 stable chronic illness" | "2+ self-limited problems" | "1+ chronic illness with exacerbation" | "Undiagnosed new problem with uncertain prognosis" | "Acute illness with systemic symptoms" | "Acute or chronic illness posing threat to life or function"

data_complexity — pick the single best match:
"Minimal or none" | "Limited — ordering or reviewing tests" | "Moderate — independent interpretation of results" | "Moderate — discussion with treating provider" | "Extensive — independent interpretation and provider discussion"

For mdm_narrative write a single clinically complete paragraph suitable for direct EMR charting (3-5 sentences). For differential provide 2-5 alternative diagnoses as structured objects — each with: diagnosis (name), probability (exactly "high" | "moderate" | "low"), supporting_evidence (1 sentence from THIS case's specific findings), against (1 sentence — what argues against it in this case), must_not_miss (true if this diagnosis would be immediately life-threatening if missed — PE, dissection, STEMI, SAH, etc.). Rank high probability first. For critical_actions list only interventions required in the next 15-30 minutes — return an empty array if none are needed. For recommended_actions return an array of plain-text strings ONLY — each item must be a single complete sentence, NOT a JSON object or structured data. For lab/test recommendations use this exact format: "Test name in Xh — if [result], then [action]". Example: "Repeat troponin at 3h — if delta >0.04 ng/mL, initiate ACS protocol and cardiology consult." Example: "Urinalysis with reflex culture — if positive, initiate antibiotic therapy." Each string must stand alone as readable chart text. Return an empty array if none. Do NOT return objects, do NOT use keys like test_name or indication. For treatment_recommendations provide evidence-based in-ED treatment interventions for the working diagnosis. For each item: intervention = specific treatment with dose/route/frequency where applicable; indication = clinical indication or threshold; evidence_level = exactly one of "Class I" / "Class IIa" / "Class IIb" / "Class III" / "Expert consensus" per ACC/AHA classification — use "Expert consensus" if unsure; guideline_ref = cite ONLY if highly confident (ACEP Clinical Policy, ACC/AHA, SSC, etc.) — return empty string if uncertain, never fabricate; notes = cautions or contraindications (optional). Prioritize highest-evidence interventions. Do NOT duplicate items already in critical_actions. For acep_policy_ref, reference the most applicable ACEP Clinical Policy by name only if one directly applies — otherwise return an empty string.

OUTPUT STRUCTURE — produce exactly two clinical sections:

SECTION 1 — initial_impression:
vital_analysis:
  summary: 1-2 sentence synthesis of the vital signs as a whole. e.g. "Vitals demonstrate compensated tachycardia with low-grade fever, consistent with an inflammatory or infectious process."
  abnormalities: For EACH abnormal vital sign: vital (name), value (actual value with units), interpretation (clinical meaning in this context), severity ("Critical" | "Concerning" | "Mild" | "Borderline"). Only include vitals that are abnormal or borderline. If all vitals are normal, return empty array.
  overall_stability: "Stable" | "Borderline stable" | "Unstable" | "Critical"

hpi_synthesis:
  onset_and_timeline: Extract and synthesize onset, duration, and temporal progression from the HPI. Include exact timeframes when documented.
  character_and_severity: Quality, character, and severity of the primary complaint with exact values (e.g. pain scale scores, severity descriptors).
  associated_symptoms: Key associated symptoms from HPI and ROS that are clinically relevant to the differential.
  modifying_factors: What makes it better or worse. Include positional, activity-related, or treatment-related factors documented in the HPI.
  pertinent_negatives: Clinically important negatives from HPI and ROS that help narrow the differential — specifically those that argue against high-risk diagnoses.
  clinical_concern_level: "High" | "Moderate" | "Low" — your overall clinical concern level based solely on HPI and vital signs, before considering exam findings.

working_dx_line: concise label, format: "[Primary Dx] in the setting of [context]"
clinical_rationale: 1–3 sentences using "consistent with" language
cannot_exclude: array of sentences opening with "[Dx] cannot be excluded given [reason]." or "[Dx] must be ruled out in any [descriptor] presenting with [symptom]." Always include life threats and ectopic pregnancy for reproductive-age females with abdominal pain.
differentials: ranked array, most likely first. Each: rank (int), diagnosis (string with parenthetical context), rationale (3–8 words).

SECTION 2 — initial_management:
immediate_interventions: brief bedside orders, each under 10 words
diagnostics: ordered by urgency, each has test (specific name) and rationale (one clause). Include imaging modality and conditional escalation (e.g. CT if ultrasound non-diagnostic).
pending_data_summary: one sentence: "[results pending] will refine working diagnosis and guide further management."

Also output: mdm_level (99281-99285), mdm_label, problem_complexity, data_complexity, risk_tier, acep_policy_ref, mdm_confidence (Strong|Borderline-up|Borderline-down), mdm_confidence_note.

Clinical rules: always address life threats before anchoring. Use "cannot be excluded" not "ruled out" until definitive testing complete. Ectopic pregnancy: include in cannot_exclude ONLY when ALL of the following are true: (1) patient is documented as female or sex is unknown, AND (2) chief complaint involves abdominal pain, pelvic pain, vaginal bleeding, or syncope, AND (3) patient age is consistent with reproductive age (approximately 12-55) or age is unknown. Do NOT include ectopic pregnancy for male patients, chest pain, neurologic complaints, extremity complaints, or any presentation where abdominal/pelvic pathology is not part of the differential.

Respond ONLY in valid JSON. No markdown fences.`;
}


export const TREATMENT_SCHEMA = {
  type: "object",
  required: ["triage_acuity","triage_rationale","immediate_interventions","medications","diagnostics_ref","monitoring_safety","attestation_required"],
  properties: {
    triage_acuity: { type: "string" },
    triage_rationale: { type: "string" },
    immediate_interventions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    medications: { type: "array", minItems: 0, maxItems: 10, items: { type: "object", required: ["category","agent","dosing","indication"], properties: { category: { type: "string" }, agent: { type: "string" }, dosing: { type: "string" }, indication: { type: "string" }, caveats: { type: "array", items: { type: "string" } }, is_note: { type: "boolean" } } } },
    diagnostics_ref: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 },
    monitoring_safety: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    attestation_required: { type: "boolean" },
  },
};

export function buildTreatmentPrompt(cc, vitals, hpi, ros, exam, mdmResult) {
  const workingDx = mdmResult?.initial_impression?.working_dx_line || mdmResult?.working_diagnosis || "unknown";
  const differentials = mdmResult?.initial_impression?.differentials?.map(d => d.diagnosis).join(", ") || "not provided";
  const cannotExclude = mdmResult?.initial_impression?.cannot_exclude?.join(" ") || "";
  const immediateInterventions = mdmResult?.initial_management?.immediate_interventions?.join(", ") || "not provided";
  const diagnostics = mdmResult?.initial_management?.diagnostics?.map(d => d.test).join(", ") || "not provided";

  return `${SYS_BIAS}

You are a board-certified emergency physician generating the TREATMENT section of an ED note.

PATIENT DATA:
Chief Complaint: ${cc || "not provided"}
Triage Vitals: ${vitals || "not provided"}
HPI: ${hpi || "not provided"}
Review of Systems: ${ros || "not provided"}
Physical Exam: ${exam || "not provided"}

WORKING FROM MDM:
Working Diagnosis: ${workingDx}
Differentials: ${differentials}
Cannot Exclude: ${cannotExclude}
MDM Immediate Interventions: ${immediateInterventions}
MDM Diagnostics: ${diagnostics}

Produce exactly five subsections:

TRIAGE AND ACUITY: triage_acuity = ESI label ("Emergent"|"Urgent"|"Less Urgent"|"Non-Urgent"). triage_rationale = one sentence: "[Acuity] — [clinical justification citing key surgical or emergent differentials]."

IMMEDIATE INTERVENTIONS: immediate_interventions = array of 1–5 concise bedside orders (no medications). Always include IV access and monitoring. Add NPO only if surgical differential present.

MEDICATIONS: medications array. Each item: category (drug class label), agent (specific drug name, use OR for alternatives), dosing (dose/route/frequency), indication (one clause), caveats (array of safety warnings, especially when cannot-exclude diagnoses create medication contraindications), is_note (true for advisory lines not actual drug orders). Medication caveats for ectopic pregnancy: add ectopic-related caveats (e.g. withhold NSAIDs) ONLY when ectopic pregnancy is already listed in the MDM cannot_exclude list for this specific patient. Do not add ectopic caveats for patients where ectopic is not clinically relevant.

DIAGNOSTICS REF: diagnostics_ref = restate the test list from MDM (max 8). Include conditional escalation items (e.g. CT if US non-diagnostic). Do not add new diagnostics.

MONITORING AND SAFETY: monitoring_safety = 2–5 items: vital sign reassessment interval, hemodynamic escalation trigger, specialty consult threshold (triggered by specific finding), any other monitoring parameters.

attestation_required: always true.

Clinical rules: triage acuity reflects highest-risk differential, not most likely Dx. All meds contextualized to cannot-exclude diagnoses.

Respond ONLY in valid JSON. No markdown fences.`;
}

export function formatTreatmentForCopy(treatmentResult) {
  if (!treatmentResult) return "";
  const t = treatmentResult;
  const lines = [];
  if (t.triage_acuity || t.triage_rationale) {
    lines.push("TRIAGE AND ACUITY:");
    lines.push(t.triage_rationale || t.triage_acuity);
    lines.push("");
  }
  if (t.immediate_interventions?.length) {
    lines.push("IMMEDIATE INTERVENTIONS:");
    t.immediate_interventions.forEach(i => lines.push("- " + i));
    lines.push("");
  }
  if (t.medications?.length) {
    lines.push("MEDICATIONS:");
    t.medications.forEach(m => {
      if (m.is_note) { lines.push("- Note: " + m.agent); }
      else {
        const cavStr = m.caveats?.length ? " (" + m.caveats.join("; ") + ")" : "";
        lines.push("- " + m.category + ": " + m.agent + " " + m.dosing + cavStr);
      }
    });
    lines.push("");
  }
  if (t.diagnostics_ref?.length) {
    lines.push("DIAGNOSTICS (see MDM):");
    t.diagnostics_ref.forEach(d => lines.push("- " + d));
    lines.push("");
  }
  if (t.monitoring_safety?.length) {
    lines.push("MONITORING AND SAFETY:");
    t.monitoring_safety.forEach(m => lines.push("- " + m));
    lines.push("");
  }
  lines.push("AI-generated recommendations. Physician attestation and clinical correlation required.");
  return lines.join("\n");
}

export const ED_MEDICATIONS_SCHEMA = {
  type: "object",
  required: ["indication","safety_context","recommended_agents","alternative_agents","interactions_contraindications","monitoring","guideline_sources"],
  properties: {
    indication: { type: "string" },
    safety_context: { type: "object", required: ["note","flags"], properties: { note: { type: "string" }, flags: { type: "array", items: { type: "object", required: ["system","finding","clinical_implication"], properties: { system: { type: "string" }, finding: { type: "string" }, clinical_implication: { type: "string" }, severity: { type: "string" } } } } } },
    recommended_agents: { type: "array", minItems: 1, maxItems: 4, items: { type: "object", required: ["label","agent","dose","route","frequency","duration"], properties: { label: { type: "string" }, agent: { type: "string" }, dose: { type: "string" }, route: { type: "string" }, frequency: { type: "string" }, duration: { type: "string" }, notes: { type: "string" }, renal_note: { type: "string" }, guideline_source: { type: "string" } } } },
    alternative_agents: { type: "array", minItems: 0, maxItems: 4, items: { type: "object", required: ["label","agent","dose","route","frequency","duration"], properties: { label: { type: "string" }, agent: { type: "string" }, dose: { type: "string" }, route: { type: "string" }, frequency: { type: "string" }, duration: { type: "string" }, notes: { type: "string" }, caution: { type: "string" }, guideline_source: { type: "string" } } } },
    interactions_contraindications: { type: "array", items: { type: "object", required: ["agent","interaction_or_contraindication","severity","action"], properties: { agent: { type: "string" }, interaction_or_contraindication: { type: "string" }, severity: { type: "string" }, action: { type: "string" } } } },
    monitoring: { type: "array", minItems: 1, items: { type: "object", required: ["parameter","interval","rationale"], properties: { parameter: { type: "string" }, interval: { type: "string" }, rationale: { type: "string" } } } },
    guideline_sources: { type: "array", minItems: 1, items: { type: "object", required: ["source","title"], properties: { source: { type: "string" }, title: { type: "string" }, year: { type: "string" }, citation: { type: "string" } } } },
  },
};

export function buildEDMedicationsPrompt(cc, hpi, exam, mdmResult, labSummaryResult, treatmentResult, parsedMeds, parsedAllergies, pmh) {
  const workingDx = mdmResult?.initial_impression?.working_dx_line || mdmResult?.working_diagnosis || "not provided";
  const differentials = mdmResult?.initial_impression?.differentials?.map(d => d.rank + ". " + d.diagnosis).join("; ") || "not provided";
  const abnormalLabs = labSummaryResult?.panels?.flatMap(p => p.results.filter(r => r.direction && r.direction !== "normal"))?.map(r => r.test + ": " + r.value + " (" + r.direction + ") -- " + r.interpretation)?.join("; ") || "none";
  const criticalFlags = labSummaryResult?.critical_flags?.length ? labSummaryResult.critical_flags.map(f => "CRITICAL: " + f.test + " " + f.value).join("; ") : "None";
  const medsCtx = parsedMeds?.length ? parsedMeds.map(m => m.name || m).join(", ") : "not provided";
  const allergyCtx = parsedAllergies?.length ? parsedAllergies.map(a => a.name || a).join(", ") : "none documented";
  const treatmentMeds = treatmentResult?.medications?.filter(m => !m.is_note)?.map(m => m.agent).join(", ") || "none";

  return `${SYS_BIAS}

You are a board-certified emergency physician generating the ED MEDICATIONS section. This is a full clinical pharmacology block — indication, safety context, recommended and alternative agents with complete dosing, interactions, monitoring, and guideline citations tailored to this specific patient.

PATIENT PROFILE:
Chief Complaint: ${cc || "not provided"}
Working Diagnosis: ${workingDx}
Differentials: ${differentials}
PMH: ${pmh || "not provided"}
Current Medications: ${medsCtx}
Allergies: ${allergyCtx}

LAB SAFETY CONTEXT:
Abnormal Labs: ${abnormalLabs}
Critical Flags: ${criticalFlags}

Already in Treatment section (do not duplicate): ${treatmentMeds}

indication: One phrase — the primary clinical indication. e.g. "Left lower leg cellulitis with wound drainage"

safety_context.note: "Full medication recommendations require confirmation of current active medications, allergies, weight, and hepatic function."
safety_context.flags: Patient-specific safety flags from lab data and PMH. Required: Renal flag if GFR <60 (include specific GFR and which drug classes need adjustment). Required: Electrolyte flag if any abnormal electrolytes that could be affected by medications. Each flag: system, finding (specific value), clinical_implication, severity (Critical/Moderate/Mild/Informational).

recommended_agents: 1-3 first-line agents based on IDSA/ACEP/society guidelines AND this patient's safety profile. Each: label (indication label with guideline class), agent (generic name), dose, route, frequency, duration, notes (clinical adjustments), renal_note (REQUIRED if GFR <60 — specific GFR-based dosing adjustment), guideline_source (specific citation: "[Society] [Policy Name] ([Year])").

alternative_agents: 1-2 alternatives for allergy, MRSA concern, or intolerance. Each: label (state why this is the alternative), agent, dose, route, frequency, duration, notes, caution (REQUIRED patient-specific warning based on THIS patient's labs — e.g. "TMP-SMX can raise potassium; monitor closely given K+ 5.4").

interactions_contraindications: For EACH agent, evaluate against allergies, current meds, and lab abnormalities. Only include if an actual concern exists. Each: agent, interaction_or_contraindication (specific), severity (Absolute contraindication/Relative contraindication/Caution/Monitor), action (specific guidance). Never leave empty if patient has renal impairment or electrolyte abnormalities.

monitoring: 2-4 parameters. Each: parameter (what), interval (specific timeframe), rationale (why for THIS patient). Always include renal monitoring if GFR <60 and electrolyte monitoring if agents affect potassium.

guideline_sources: 2-4 real, current (2020+) sources. Include: primary society guideline (IDSA/ACEP/AHA), clinical reference (UpToDate/Lexicomp for renal dosing). Each: source, title (full name), year, citation (journal if applicable).

Rules: All agents must be appropriate for this patient's GFR. All alternatives must have patient-specific caution. Interactions must be specific to this patient. Monitoring intervals must be specific.

Respond ONLY in valid JSON. No markdown fences.`;
}

export function formatEDMedicationsForCopy(result) {
  if (!result) return "";
  const lines = [];
  lines.push("ED MEDICATIONS");
  lines.push("");
  if (result.indication) lines.push("Indication: " + result.indication);
  if (result.safety_context) {
    if (result.safety_context.note) lines.push("Note: " + result.safety_context.note);
    result.safety_context.flags?.forEach(f => lines.push(f.system + ": " + f.finding + " -- " + f.clinical_implication));
  }
  lines.push("");
  result.recommended_agents?.forEach(a => {
    lines.push(a.label + ":"); lines.push(a.agent + " | " + a.dose + " | " + a.route + " | " + a.frequency + " | " + a.duration);
    if (a.notes) lines.push("(" + a.notes + ")");
    if (a.renal_note) lines.push("Renal: " + a.renal_note);
    lines.push("");
  });
  result.alternative_agents?.forEach(a => {
    lines.push(a.label + ":"); lines.push(a.agent + " | " + a.dose + " | " + a.route + " | " + a.frequency + " | " + a.duration);
    if (a.notes) lines.push("(" + a.notes + ")");
    if (a.caution) lines.push("Caution: " + a.caution);
    lines.push("");
  });
  if (result.interactions_contraindications?.length) { lines.push("Interactions/Contraindications:"); result.interactions_contraindications.forEach(ic => lines.push(ic.agent + ": " + ic.interaction_or_contraindication + " [" + ic.severity + "] -- " + ic.action)); lines.push(""); }
  if (result.monitoring?.length) { lines.push("Monitoring:"); result.monitoring.forEach(m => lines.push("- " + m.parameter + ": " + m.interval + " -- " + m.rationale)); lines.push(""); }
  if (result.guideline_sources?.length) { lines.push("Guideline Source:"); result.guideline_sources.forEach(g => lines.push(g.source + " -- " + g.title + (g.year ? " (" + g.year + ")" : "") + (g.citation ? "; " + g.citation : ""))); }
  return lines.join("\n");
}

// ─── LAB SUMMARY ─────────────────────────────────────────────────────────────
export const LAB_SUMMARY_SCHEMA = {
  type: "object",
  required: ["critical_flags","panels","clinical_correlations","recommended_actions"],
  properties: {
    critical_flags: { type: "array", items: { type: "object", required: ["test","value","threshold","action"], properties: { test: { type: "string" }, value: { type: "string" }, threshold: { type: "string" }, action: { type: "string" } } } },
    panels: { type: "array", minItems: 1, items: { type: "object", required: ["panel_name","results"], properties: { panel_name: { type: "string" }, results: { type: "array", minItems: 1, items: { type: "object", required: ["test","value","direction","interpretation"], properties: { test: { type: "string" }, value: { type: "string" }, unit: { type: "string" }, direction: { type: "string" }, tier: { type: "string" }, interpretation: { type: "string" }, threshold_note: { type: "string" }, grouped_with: { type: "array", items: { type: "object", properties: { test: { type: "string" }, value: { type: "string" }, unit: { type: "string" }, direction: { type: "string" } } } } } } } } } },
    clinical_correlations: { type: "array", minItems: 1, maxItems: 6, items: { type: "object", required: ["number","correlation"], properties: { number: { type: "integer" }, topic: { type: "string" }, correlation: { type: "string" } } } },
    recommended_actions: { type: "object", required: ["immediate","short_term"], properties: { immediate: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 }, short_term: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 } } },
  },
};

export function buildLabSummaryPrompt(labs, cc, mdmResult, parsedMeds, parsedAllergies) {
  const workingDx = mdmResult?.initial_impression?.working_dx_line || mdmResult?.working_diagnosis || "not provided";
  const differentials = mdmResult?.initial_impression?.differentials?.map(d => d.diagnosis).join(", ") || "not provided";
  const cannotExclude = mdmResult?.initial_impression?.cannot_exclude?.join(" ") || "";
  const medsCtx = parsedMeds?.length ? parsedMeds.map(m => m.name || m).join(", ") : "not provided";
  const allergyCtx = parsedAllergies?.length ? parsedAllergies.map(a => a.name || a).join(", ") : "none documented";

  return `${SYS_BIAS}

You are a board-certified emergency physician interpreting lab results for an ED encounter.

ENCOUNTER CONTEXT:
Chief Complaint: ${cc || "not provided"}
Working Diagnosis: ${workingDx}
Active Differentials: ${differentials}
Cannot Exclude: ${cannotExclude}
Medications: ${medsCtx}
Allergies: ${allergyCtx}

LAB DATA:
${labs || "No labs provided"}

SEVERITY TIER DEFINITIONS:
NORMAL: within reference range. MILD: mildly abnormal, monitor. MODERATE: warrants clinical attention. SEVERE: requires prompt intervention. CRITICAL: panic value, immediate action.

DIRECTION MARKERS: H = above upper limit. L = below lower limit. C = critical panic value. normal = within range.

OUTPUT RULES:

critical_flags: scan all results for panic values. If any: list test, value with (C) marker, threshold crossed, required immediate action. If none: empty array.

panels: group by panel (CBC, CMP, Inflammatory Markers, Lactate, Microbiology, Coagulation, Cardiac Markers, LFTs, UA — only include panels present in lab data). Per result: test (abbreviation), value (string), unit, direction (H/L/C/normal), tier (NORMAL/MILD/MODERATE/SEVERE/CRITICAL), interpretation (concise clinical clause using "consistent with"/"cannot exclude"/"argues against" language — never "rules out"), threshold_note (only for near-critical or critical values), grouped_with (bundle closely related values: RBC+Hgb+Hct, BUN+Cr).

clinical_correlations: 3–5 numbered items. Each synthesizes multiple lab findings into unified clinical interpretation tied to working Dx and differentials. Connect to bedside findings from CC/MDM where relevant.

recommended_actions.immediate: 1–3 actions needed now.
recommended_actions.short_term: 2–5 actions for next 1–8 hours.

Respond ONLY in valid JSON. No markdown fences.`;
}

export function formatLabSummaryForCopy(labResult) {
  if (!labResult) return "";
  const lines = [];
  lines.push("CRITICAL FLAGS:");
  if (!labResult.critical_flags?.length) { lines.push("None identified."); }
  else { labResult.critical_flags.forEach(f => lines.push("CRITICAL -- " + f.test + ": " + f.value + " [" + f.threshold + "] -- " + f.action)); }
  lines.push("");
  lines.push("LAB SUMMARY:");
  (labResult.panels || []).forEach(panel => {
    lines.push(panel.panel_name + ":");
    (panel.results || []).forEach(r => {
      const dirStr = r.direction && r.direction !== "normal" ? " (" + r.direction + ")" : "";
      const grouped = r.grouped_with?.length ? ", " + r.grouped_with.map(g => g.test + " " + g.value + (g.direction && g.direction !== "normal" ? " (" + g.direction + ")" : "")).join(", ") : "";
      const tierStr = r.tier && r.tier !== "NORMAL" ? "; " + r.tier + " tier" : "";
      const threshStr = r.threshold_note ? "; " + r.threshold_note : "";
      lines.push("- " + r.test + " " + r.value + dirStr + grouped + " -- " + r.interpretation + tierStr + threshStr);
    });
    lines.push("");
  });
  lines.push("CLINICAL CORRELATIONS:");
  (labResult.clinical_correlations || []).forEach(c => { const t = c.topic ? c.topic + " -- " : ""; lines.push(c.number + ". " + t + c.correlation); });
  lines.push("");
  lines.push("RECOMMENDED ACTIONS:");
  if (labResult.recommended_actions?.immediate?.length) lines.push("Immediate: " + labResult.recommended_actions.immediate.join("; ") + ".");
  if (labResult.recommended_actions?.short_term?.length) lines.push("Short-term: " + labResult.recommended_actions.short_term.join("; ") + ".");
  return lines.join("\n");
}

export const IMAGING_ANALYSIS_SCHEMA = {
  type: "object",
  required: ["studies","synthesis","next_steps","critical_findings"],
  properties: {
    studies: { type: "array", minItems: 1, items: { type: "object", required: ["study","modality","body_region","key_findings","interpretation","physician_attestation"], properties: { study: { type: "string" }, modality: { type: "string" }, body_region: { type: "string" }, key_findings: { type: "array", minItems: 1, items: { type: "object", required: ["finding","significance"], properties: { finding: { type: "string" }, significance: { type: "string" }, is_critical: { type: "boolean" } } } }, interpretation: { type: "string" }, diagnoses_addressed: { type: "array", items: { type: "object", required: ["diagnosis","status"], properties: { diagnosis: { type: "string" }, status: { type: "string" } } } }, physician_attestation: { type: "string" }, incidental_findings: { type: "array", items: { type: "string" } } } } },
    synthesis: { type: "string" },
    next_steps: { type: "array", minItems: 1, items: { type: "object", required: ["action","urgency","rationale"], properties: { action: { type: "string" }, urgency: { type: "string" }, rationale: { type: "string" } } } },
    critical_findings: { type: "array", items: { type: "object", required: ["finding","study","action_required"], properties: { finding: { type: "string" }, study: { type: "string" }, action_required: { type: "string" } } } },
    final_impression_summary: { type: "string" },
  },
};

export function buildImagingAnalysisPrompt(imaging, cc, mdmResult, labSummaryResult) {
  const workingDx = mdmResult?.initial_impression?.working_dx_line || mdmResult?.working_diagnosis || "not provided";
  const differentials = mdmResult?.initial_impression?.differentials?.map(d => d.rank + ". " + d.diagnosis).join("; ") || "not provided";
  const cannotExclude = mdmResult?.initial_impression?.cannot_exclude?.join(" ") || "";
  const labContext = labSummaryResult?.clinical_correlations?.map(c => (c.topic ? c.topic + ": " : "") + c.correlation).join(" | ") || "";
  const criticalLabs = labSummaryResult?.critical_flags?.length ? labSummaryResult.critical_flags.map(f => "CRITICAL: " + f.test + " " + f.value).join("; ") : "None";

  return `${SYS_BIAS}

You are a board-certified emergency physician interpreting imaging results for an ED encounter.

ENCOUNTER CONTEXT:
Chief Complaint: ${cc || "not provided"}
Working Diagnosis: ${workingDx}
Active Differentials: ${differentials}
Cannot Exclude: ${cannotExclude}
Lab Correlations: ${labContext || "not provided"}
Critical Lab Flags: ${criticalLabs}

IMAGING REPORTS (interpret ALL studies):
${imaging || "No imaging provided"}

OUTPUT RULES:

studies: One entry per imaging study. For each:
- study: full name (e.g. "CT abdomen/pelvis with contrast")
- modality: CT | X-ray | MRI | Ultrasound | Nuclear | Fluoroscopy | Other
- body_region: Chest | Abdomen/Pelvis | Head/Brain | Spine | Extremity | Pelvis | Neck | Other
- key_findings: specific findings from the report. Each: finding (exact clinical language), significance (Critical/Actionable/Incidental/Normal/Reassuring), is_critical (true only for findings requiring immediate action). ALWAYS include relevant negative findings as "Reassuring" items when they address the differential (e.g. "No pneumothorax" | "No free air" | "No acute hemorrhage").
- interpretation: 2-4 sentence clinical synthesis in attending physician voice. What findings mean clinically, what dangerous diagnoses are excluded, what remains uncertain.
- diagnoses_addressed: for each diagnosis from cannot-exclude list or differential that this study addresses. status: "Confirmed" | "Excluded" | "Cannot exclude" | "Incidental finding"
- physician_attestation: always "I personally reviewed the [study name] and agree with the preliminary read." OR note specific observation.
- incidental_findings: unrelated findings requiring separate follow-up.

synthesis: One paragraph integrating all studies with clinical presentation and labs. How does imaging change or confirm the initial assessment?

next_steps: 2-5 recommended actions based on imaging. Each: action (specific), urgency (Immediate/Urgent/Routine/Outpatient), rationale (why indicated by imaging).

critical_findings: findings with is_critical: true, with required action. Empty array if none.

final_impression_summary: 2-3 sentences MAX for injection into Final Impression. Specific values. What was found, what was excluded, any uncertainty. Example: "CT left lower leg demonstrates skin thickening and subcutaneous edema consistent with cellulitis; no abscess or necrotizing infection identified. CT effectively excludes necrotizing fasciitis and deep space infection."

Rules: Never use "rules out" — use "excluded by imaging". Always address life threats

Respond ONLY in valid JSON. No markdown fences.`;
}

export function formatImagingAnalysisForCopy(result) {
  if (!result) return "";
  const lines = [];
  if (result.critical_findings?.length) {
    lines.push("CRITICAL IMAGING FINDINGS:");
    result.critical_findings.forEach(f => lines.push("CRITICAL -- " + f.study + ": " + f.finding + " -- ACTION: " + f.action_required));
    lines.push("");
  }
  (result.studies || []).forEach(s => {
    lines.push(s.study + " (" + s.modality + " — " + s.body_region + "):");
    (s.key_findings || []).forEach(f => {
      const critStr = f.is_critical ? " [CRITICAL]" : "";
      lines.push("  - " + f.finding + " (" + f.significance + ")" + critStr);
    });
    if (s.interpretation) lines.push("  Interpretation: " + s.interpretation);
    if (s.physician_attestation) lines.push("  " + s.physician_attestation);
    if (s.diagnoses_addressed?.length) {
      lines.push("  Diagnoses addressed:");
      s.diagnoses_addressed.forEach(d => lines.push("    " + d.diagnosis + ": " + d.status));
    }
    if (s.incidental_findings?.length) lines.push("  Incidental: " + s.incidental_findings.join("; "));
    lines.push("");
  });
  if (result.synthesis) { lines.push("IMAGING SYNTHESIS:"); lines.push(result.synthesis); lines.push(""); }
  if (result.next_steps?.length) {
    lines.push("NEXT STEPS:");
    result.next_steps.forEach(n => lines.push("- [" + n.urgency + "] " + n.action + " — " + n.rationale));
    lines.push("");
  }
  if (result.final_impression_summary) { lines.push("FINAL IMPRESSION (imaging):"); lines.push(result.final_impression_summary); }
  return lines.join("\n");
}

export const FINAL_IMPRESSION_SCHEMA = {
  type: "object",
  required: ["diagnoses","excluded_diagnoses","closing_statement"],
  properties: {
    diagnoses: { type: "array", minItems: 1, maxItems: 8, items: { type: "object", required: ["rank","diagnosis","icd10_code","icd10_label","supporting_evidence"], properties: { rank: { type: "integer" }, diagnosis: { type: "string" }, icd10_code: { type: "string" }, icd10_label: { type: "string" }, supporting_evidence: { type: "string" }, qualifier: { type: "string" } } } },
    excluded_diagnoses: { type: "array", minItems: 0, maxItems: 5, items: { type: "string" } },
    closing_statement: { type: "string" },
  },
};

export function buildFinalImpressionPrompt(cc, hpi, exam, mdmResult, labSummaryResult, imaging, dispResult) {
  const workingDx = mdmResult?.initial_impression?.working_dx_line || mdmResult?.working_diagnosis || "not provided";
  const differentials = mdmResult?.initial_impression?.differentials?.map(d => d.rank + ". " + d.diagnosis).join("; ") || "not provided";
  const cannotExclude = mdmResult?.initial_impression?.cannot_exclude?.join(" ") || "";
  const labCorr = labSummaryResult?.clinical_correlations?.map(c => (c.topic ? c.topic + ": " : "") + c.correlation).join(" | ") || "";
  const critFlags = labSummaryResult?.critical_flags?.length ? labSummaryResult.critical_flags.map(f => "CRITICAL: " + f.test + " " + f.value).join("; ") : "None";
  const finalDx = dispResult?.final_diagnosis || "";
  const dispDispo = dispResult?.disposition || "";

  return `${SYS_BIAS}

You are a board-certified emergency physician generating the FINAL CLINICAL IMPRESSION section of an ED note after all results have returned.

ENCOUNTER CONTEXT:
Chief Complaint: ${cc || "not provided"}
HPI: ${hpi || "not provided"}
Physical Exam: ${exam || "not provided"}

PHASE 1 MDM:
Working Diagnosis: ${workingDx}
Differentials: ${differentials}
Cannot Exclude: ${cannotExclude}
E/M Level: ${mdmResult?.mdm_label || ""} | Risk: ${mdmResult?.risk_tier || ""}

PHASE 2 RESULTS:
Lab Correlations: ${labCorr || "not provided"}
Critical Flags: ${critFlags}
Imaging: ${imaging || "not provided"}
Disposition: ${dispDispo || "not provided"}
Final Dx from Disposition: ${finalDx || "not provided"}

OUTPUT RULES:

diagnoses: ranked list of confirmed/working diagnoses. Each item:
- rank: integer, 1 = primary (the chief complaint diagnosis)
- diagnosis: plain clinical English (not ICD-10 label language). Include laterality, acuity, and specific descriptor where applicable.
- icd10_code: most specific valid ICD-10-CM code. Use laterality specifiers (L/R). For CKD use N18.1–N18.5 based on GFR stage. For anemia specify type from lab data. Never fabricate codes.
- icd10_label: official ICD-10-CM code description
- supporting_evidence: semicolon-separated clause of specific findings (lab values, imaging findings, exam findings) that confirm this diagnosis
- qualifier: optional — add only if clinically important caveat must accompany the code (e.g. "AKI cannot be excluded", "no abscess identified", "baseline unavailable for KDIGO comparison")

Ranking: 1 = chief complaint diagnosis. Secondary diagnoses = comorbidities confirmed this encounter. Incidentals = last. Do NOT include diagnoses excluded by testing.

excluded_diagnoses: dangerous/time-sensitive diagnoses addressed by workup that are not supported. Draw from cannot_exclude list. Plain name only, no codes. Omit any that are still pending (e.g. cultures pending → do not exclude sepsis).

closing_statement: output exactly this string: "Although other conditions were also considered, they were deemed unlikely based on the clinical information available."

ICD-10 RULES: specificity first. Laterality always when available. Acute over chronic when both present. Use combination codes when available. Never use manifestation codes as primary.

Respond ONLY in valid JSON. No markdown fences.`;
}

export function formatFinalImpressionForCopy(finalResult, confirmedRanks) {
  if (!finalResult) return "";
  const lines = [];
  lines.push("Based on all of the above, my clinical impression is most compatible with:");
  lines.push("");
  const toInclude = (finalResult.diagnoses || []).filter(d => !confirmedRanks?.size || confirmedRanks.has(d.rank));
  toInclude.forEach(d => {
    const qualStr = d.qualifier ? " -- " + d.qualifier : "";
    lines.push(d.rank + ". " + d.diagnosis + " (ICD-10: " + d.icd10_code + ")" + qualStr + " -- " + d.supporting_evidence);
  });
  if (finalResult.excluded_diagnoses?.length) {
    lines.push("");
    lines.push("The clinical picture is not currently suggestive of " + finalResult.excluded_diagnoses.join(", ") + ".");
  }
  if (finalResult.closing_statement) {
    lines.push("");
    lines.push(finalResult.closing_statement);
  }
  return lines.join("\n");
}

const SPECIALTY_DISP_CONTEXT = {
  peds: "\nPEDIATRIC DISPOSITION: Weight-based dosing in all Rx. Instructions addressed to caregiver. Fever return precautions include age-specific thresholds (under 3 months any fever = return immediately). Document caregiver verbalized understanding.",
  psych: `\nPSYCHIATRIC DISPOSITION: Document safety plan, means restriction counseling, crisis line (988), psychiatric follow-up within 72h. If admitting: document capacity assessment and involuntary hold status. Return precautions include psychiatric crisis symptoms.`,
  trauma: `\nTRAUMA DISPOSITION: Reference completion of primary and secondary survey. Discharge instructions include trauma-specific return precautions: compartment syndrome, delayed intracranial hemorrhage, vascular injury. Document tetanus status. Specific follow-up timeframes required.`,
  obs: `\nOBSERVATION DISPOSITION: Document specific obs protocol and endpoint criteria. Plan must include monitoring period, pending result triggers. Chest pain obs discharge: document HEART score, troponin deltas, stress test plan, cardiology follow-up within 72h.`,
  adult: "",
};

function buildDispPrompt(mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam, parsedMeds, parsedAllergies, ekg, encounterType) {
  const mdmSummary = mdmResult
    ? `Working Dx: ${mdmResult.working_diagnosis || "?"}  |  MDM Level: ${mdmResult.mdm_level || "?"}  |  Risk: ${mdmResult.risk_tier || "?"}`
    : "Not available";
  const redFlags = mdmResult?.red_flags?.length
    ? `Red Flags: ${mdmResult.red_flags.join("; ")}`
    : "";
  const critActions = mdmResult?.critical_actions?.length
    ? `Critical Actions: ${mdmResult.critical_actions.join("; ")}`
    : "";
  const medsContext = parsedMeds?.length
    ? `\nCurrent Medications: ${parsedMeds.map(m => `${m.name} ${m.dose} ${m.route} ${m.frequency}`.trim()).join(", ")}`
    : "";
  const allergiesContext = parsedAllergies?.length
    ? `\nAllergies: ${parsedAllergies.map(a => `${a.allergen} (${a.reaction})`).join(", ")}`
    : "";
  const specDispContext = SPECIALTY_DISP_CONTEXT[encounterType || "adult"] || "";
  return `${SYS_BIAS}

You are a board-certified emergency physician generating the ED reevaluation, disposition decision, and discharge instructions for a patient after workup is complete.

ACEP GUIDANCE ON DISPOSITION:
- Discharge: Safe with adequate follow-up, no high-risk features on workup, symptoms improving, return precautions understood
- Observation: Borderline disposition, requires further monitoring, serial exams, or result-dependent decision
- Admit: Ongoing acute process requiring inpatient management, high-risk labs/imaging, or significant comorbidities
- Transfer: Requires higher level of care or specialty not available at current facility

ORIGINAL PRESENTATION:
Chief Complaint: ${cc || "Not provided"}
Triage Vitals: ${vitals || "Not provided"}
HPI: ${hpi || "Not provided"}
ROS: ${ros || "Not provided"}
Physical Exam: ${exam || "Not provided"}${medsContext}${allergiesContext}

PHASE 1 MDM SUMMARY:
${mdmSummary}${redFlags ? "\n" + redFlags : ""}${critActions ? "\n" + critActions : ""}

WORKUP RESULTS:
Labs: ${labs || "Not provided / not ordered"}
Imaging: ${imaging || "Not provided / not ordered"}
EKG/ECG: ${ekg || "Not performed / not provided"}
Re-check Vitals: ${newVitals || "Not documented"}
${specDispContext}

INSTRUCTIONS:
- reevaluation_note: 2-3 sentence clinical reevaluation note suitable for EMR charting. MUST explicitly incorporate imaging findings if imaging was provided — state the specific study, key finding, and how it affects the clinical picture. Describe interval change and response to treatment.
- updated_impression: one concise sentence updating the clinical impression based on ALL workup findings including imaging.
- treatment_response: brief phrase (e.g. "Improved with IVF and antiemetics", "No significant change", "Worsening")
- disposition: one of "Discharge" / "Discharge with precautions" / "Observation" / "Admit" / "Admit to ICU" / "Transfer"
- disposition_rationale: 1-2 sentences clinical justification referencing specific lab AND imaging findings by name
- plan_summary: 2-3 sentence overall plan narrative that incorporates imaging results — if imaging was provided, the plan must reference the specific study and finding
- orders: array of specific discharge or admission orders as brief action items (max 12)
- result_flags: review ALL Labs AND Imaging/Radiology results provided. For EACH abnormal lab value AND for EACH significant imaging finding, create one entry. For imaging: parameter = study type (e.g. "CXR", "CT Head"), value = key finding, status based on urgency. For labs: parameter = test name with units. status = one of "critical" / "high" / "low" / "borderline" / "notable". clinical_significance: 1 sentence why it matters in this clinical context. recommendation: specific actionable next step. guideline_citation: specific guideline name + year if confident, else empty string. Only flag values and findings that warrant clinical attention — do NOT list normal results.
- discharge_instructions.diagnosis_explanation: Write a 2-3 sentence plain-language explanation for the PATIENT — not for a clinician. STRICT rules: (1) 6th-8th grade reading level only — use everyday words a patient would understand; (2) any medical term must be immediately followed by a plain explanation in parentheses, e.g. "pneumonia (a lung infection)"; (3) reference the patient's ACTUAL experience this visit — mention specific improvements observed (pain improvement, vital sign normalization, fever resolution) from the recheck vitals and treatment response; (4) make it personal to this encounter, not generic to the diagnosis. Example style: "You came in today with chest pain and we found your heart looks healthy. Your pain improved with medication and your heart tracing (ECG) was normal."
- discharge_instructions.return_precautions: exactly 5 specific, actionable return precautions per ACEP standard — write each as a complete instruction the patient can act on, not a vague symptom list
- discharge_instructions.acep_policy_ref: reference applicable ACEP Clinical Policy if one exists, else empty string
- For Admit, Admit to ICU, Observation, and Transfer dispositions: populate admission_service and return discharge_instructions with all fields as empty strings or empty arrays

Respond ONLY in valid JSON, no markdown fences.`;
}

// ─── MDM BLOCK BUILDER ───────────────────────────────────────────────────────
function buildMDMBlock(mdm, extras = {}) {
  if (!mdm) return "";
  const lines = [
    `MEDICAL DECISION MAKING — ${new Date().toLocaleString()}`, "",
    `MDM Level: ${mdm.mdm_level || "—"}`,
    `Problem Complexity: ${mdm.problem_complexity || "—"}`,
    `Data Complexity: ${mdm.data_complexity || "—"}`,
    `Risk: ${mdm.risk_tier || "—"}`,
  ];
  if (mdm.mdm_confidence) lines.push(`MDM Confidence: ${mdm.mdm_confidence}${mdm.mdm_confidence_note ? ' — ' + mdm.mdm_confidence_note : ''}`);
  if (mdm.working_diagnosis) lines.push(`\nWorking Diagnosis: ${mdm.working_diagnosis}`);

  // ── New schema: initial_impression ──
  const imp = mdm.initial_impression;
  if (imp) {
    lines.push("");
    lines.push("INITIAL IMPRESSION:");
    if (imp.working_dx_line)     lines.push(`  ${imp.working_dx_line}`);
    if (imp.clinical_rationale)  lines.push(`\n  ${imp.clinical_rationale}`);
    if (imp.cannot_exclude?.length) {
      lines.push("\n  Cannot Exclude:");
      imp.cannot_exclude.forEach(s => lines.push(`    • ${s}`));
    }
    if (imp.differentials?.length) {
      lines.push("\n  Differentials (ranked):");
      imp.differentials.forEach(d => lines.push(`    ${d.rank}. ${d.diagnosis} — ${d.rationale}`));
    }
  }

  // ── New schema: initial_management ──
  const mgmt = mdm.initial_management;
  if (mgmt) {
    lines.push("");
    lines.push("INITIAL MANAGEMENT:");
    if (mgmt.immediate_interventions?.length) {
      lines.push("  Immediate Interventions:");
      mgmt.immediate_interventions.forEach(a => lines.push(`    • ${a}`));
    }
    if (mgmt.diagnostics?.length) {
      lines.push("  Diagnostics:");
      mgmt.diagnostics.forEach(d => lines.push(`    • ${d.test}: ${d.rationale}`));
    }
    if (mgmt.pending_data_summary) lines.push(`\n  ${mgmt.pending_data_summary}`);
  }

  // ── Legacy flat fields (backward compat) ──
  if (mdm.differential?.length) {
    lines.push("\nDIFFERENTIAL DIAGNOSIS:");
    mdm.differential.forEach((d, i) => {
      if (!d || typeof d !== "object") return;
      const mnm = d.must_not_miss ? " ⚠ MUST NOT MISS" : "";
      lines.push(`  ${i+1}. ${d.diagnosis} [${d.probability}]${mnm}`);
      if (d.supporting_evidence) lines.push(`     For: ${d.supporting_evidence}`);
      if (d.against)             lines.push(`     Against: ${d.against}`);
    });
  }
  if (mdm.critical_actions?.length) {
    lines.push("\nCRITICAL ACTIONS (Do Now):");
    mdm.critical_actions.forEach((a, i) => lines.push(`  ${i+1}. ${a}`));
  }
  if (mdm.recommended_actions?.length) {
    lines.push("\nRECOMMENDED ACTIONS (This Visit):");
    mdm.recommended_actions.forEach((a, i) => lines.push(`  ${i+1}. ${a}`));
  }
  if (mdm.risk_rationale)  lines.push(`\nRisk Rationale: ${mdm.risk_rationale}`);
  if (mdm.mdm_narrative)   lines.push(`\nMDM NARRATIVE:\n${mdm.mdm_narrative}`);
  if (mdm.acep_policy_ref) lines.push(`\nACEP Policy: ${mdm.acep_policy_ref}`);

  // ── Treatment plan extras ──
  if (extras.treatmentPlan) lines.push(`\nTREATMENT PLAN:\n${extras.treatmentPlan}`);
  if (extras.actionPlan)    lines.push(`\nACTION ITEMS:\n${extras.actionPlan}`);

  return lines.join("\n");
}

// ─── COPY-TO-CHART BUILDER ────────────────────────────────────────────────────
function buildFullNote(p1, mdm, p2, disp, extras = {}) {
  const ts = new Date().toLocaleString();
  const cc = p1.cc || "";
  const lines = [`ED QUICK NOTE — ${ts}`, `Chief Complaint: ${cc || "—"}`, ""];

  // ── Raw clinical inputs ──
  if (p1.vitals) lines.push(`Vitals: ${p1.vitals}`);
  if (p1.hpi)    { lines.push(""); lines.push("HPI:"); lines.push(p1.hpi); }
  if (p1.ros)    { lines.push(""); lines.push("ROS:"); lines.push(p1.ros); }
  if (p1.exam)   { lines.push(""); lines.push("Physical Exam:"); lines.push(p1.exam); }

  // Medications & allergies
  if (extras.parsedMeds?.length || extras.parsedAllergies?.length) {
    lines.push("");
    lines.push("=== MEDICATIONS & ALLERGIES ===");
    if (extras.parsedMeds?.length) {
      lines.push("Current Medications:");
      extras.parsedMeds.forEach(m => {
        const parts = [m.name, m.dose, m.route, m.frequency].filter(Boolean);
        lines.push(`  ${parts.join("  ")}`);
      });
    }
    if (extras.parsedAllergies?.length) {
      lines.push("Allergies:");
      extras.parsedAllergies.forEach(a => lines.push(`  ${a.allergen}: ${a.reaction}`));
    }
  }

  if (p2?.labs)      { lines.push(""); lines.push(`Labs: ${p2.labs}`); }
  if (p2?.imaging)   { lines.push(`Imaging: ${p2.imaging}`); }
  if (p2?.newVitals) { lines.push(`Recheck Vitals: ${p2.newVitals}`); }
  lines.push("");

  if (mdm) {
    lines.push(`=== MEDICAL DECISION MAKING ===`);
    lines.push(`MDM Level: ${mdm.mdm_level || "—"}`);
    lines.push(`Problem Complexity: ${mdm.problem_complexity || "—"}`);
    lines.push(`Data Complexity: ${mdm.data_complexity || "—"}`);
    lines.push(`Risk: ${mdm.risk_tier || "—"}`);
    if (mdm.working_diagnosis) lines.push(`Working Dx: ${mdm.working_diagnosis}`);
    if (mdm.differential?.length) lines.push(`Differential: ${mdm.differential.join(", ")}`);
    if (mdm.red_flags?.length) lines.push(`Red Flags: ${mdm.red_flags.join("; ")}`);
    if (mdm.critical_actions?.length) {
      lines.push(`Critical Actions:`);
      mdm.critical_actions.forEach((a, i) => lines.push(`  ${i+1}. ${a}`));
    }
    if (mdm.treatment_recommendations?.length) {
      lines.push(`Treatment Recommendations:`);
      mdm.treatment_recommendations.forEach((t, i) => {
        lines.push(`  ${i+1}. [${t.evidence_level}] ${t.intervention}`);
        if (t.guideline_ref) lines.push(`     Ref: ${t.guideline_ref}`);
        if (t.notes) lines.push(`     Note: ${t.notes}`);
      });
    }
    if (mdm.recommended_actions?.length) {
      lines.push(`Recommended Actions:`);
      mdm.recommended_actions.forEach((a, i) => lines.push(`  ${i+1}. ${a}`));
    }
    if (mdm.acep_policy_ref) lines.push(`ACEP Policy: ${mdm.acep_policy_ref}`);
    const mdmFullCopyText = formatMDMForCopy(mdm);
    if (mdmFullCopyText) lines.push(`\n${mdmFullCopyText}`);
    lines.push("");
  }

  if (disp) {
    lines.push(`=== ED REEVALUATION ===`);
    if (disp.reevaluation_note) lines.push(disp.reevaluation_note);
    lines.push("");
    lines.push(`=== PLAN & DISPOSITION ===`);
    if (disp.final_diagnosis) lines.push(`Final Impression: ${disp.final_diagnosis}`);
    // ICD-10 codes
    if (extras.icdSelected?.length) {
      lines.push(`ICD-10 Codes:`);
      extras.icdSelected.forEach(c => lines.push(`  ${c.code} — ${c.description} (${c.type})`));
    }
    if (disp.disposition) lines.push(`Disposition: ${disp.disposition}`);
    if (disp.admission_service) lines.push(`Admission Service: ${disp.admission_service}`);
    if (disp.disposition_rationale) lines.push(`Rationale: ${disp.disposition_rationale}`);
    if (disp.plan_summary) lines.push(`\nPLAN:\n${disp.plan_summary}`);
    if (disp.orders?.length) {
      lines.push(`\nOrders:`);
      disp.orders.forEach(o => lines.push(`  - ${o}`));
    }
    if (disp.result_flags?.length) {
      lines.push(`\nLAB & IMAGING FLAGS:`);
      disp.result_flags.forEach(f => {
        lines.push(`  [${(f.status||"").toUpperCase()}] ${f.parameter}: ${f.value}`);
        if (f.clinical_significance) lines.push(`    → ${f.clinical_significance}`);
        if (f.recommendation)        lines.push(`    Rec: ${f.recommendation}`);
        if (f.guideline_citation)    lines.push(`    Ref: ${f.guideline_citation}`);
      });
    }
    const di = disp.discharge_instructions;
    const dispLower = disp.disposition?.toLowerCase() || "";
    const isDischargedNote = !["admit", "icu", "obs", "transfer"].some(w => dispLower.includes(w));
    if (di && isDischargedNote) {
      lines.push(`\n=== DISCHARGE INSTRUCTIONS ===`);
      if (di.diagnosis_explanation) lines.push(di.diagnosis_explanation);
      if (di.medications?.length) {
        lines.push(`\nMedications:`);
        di.medications.forEach(m => lines.push(`  - ${m}`));
      }
      if (di.activity) lines.push(`Activity: ${di.activity}`);
      if (di.diet) lines.push(`Diet: ${di.diet}`);
      if (di.return_precautions?.length) {
        lines.push(`\nReturn to ED if:`);
        di.return_precautions.forEach(r => lines.push(`  ! ${r}`));
      }
      if (di.followup) lines.push(`Follow-up: ${di.followup}`);
      if (di.acep_policy_ref) lines.push(`ACEP Ref: ${di.acep_policy_ref}`);
    }
  }

  // Interventions section
  const confirmedInts = (extras.interventions || []).filter(i => i.confirmed !== false);
  if (confirmedInts.length) {
    lines.push(`\n=== ED INTERVENTIONS ===`);
    confirmedInts.forEach(i => {
      let line = `[${(i.type || "other").toUpperCase()}] ${i.name}`;
      if (i.dose_route) line += ` — ${i.dose_route}`;
      if (i.time_given) line += ` (${i.time_given})`;
      if (i.response)   line += ` · ${i.response}`;
      lines.push(`  ${line}`);
    });
  }

  lines.push(`\n---\nGenerated by Notrya QuickNote. Always verify AI-generated content before charting.`);
  return lines.join("\n");
}

function formatMDMForCopy(mdmResult) {
  if (!mdmResult) return "";
  const imp = mdmResult.initial_impression || {};
  const mgmt = mdmResult.initial_management || {};
  const lines = [];
  lines.push("INITIAL IMPRESSION");
  if (imp.working_dx_line) lines.push("Working diagnosis: " + imp.working_dx_line);
  if (imp.clinical_rationale) lines.push(imp.clinical_rationale);
  (imp.cannot_exclude || []).forEach(s => lines.push(s));
  if (imp.differentials?.length) {
    lines.push("Differentials (ranked):");
    imp.differentials.forEach(d => lines.push(d.rank + ". " + d.diagnosis));
  }
  lines.push("");
  lines.push("INITIAL MANAGEMENT");
  if (mgmt.immediate_interventions?.length) lines.push("Immediate interventions: " + mgmt.immediate_interventions.join(". ") + ".");
  if (mgmt.diagnostics?.length) {
    lines.push("Diagnostics:");
    mgmt.diagnostics.forEach(d => lines.push("- " + d.test + ": " + d.rationale));
  }
  if (mgmt.pending_data_summary) lines.push("Pending data: " + mgmt.pending_data_summary);
  return lines.join("\n");
}

// ─── PHASE 1 COPY — Initial note for EHR paste ───────────────────────────────
export function buildPhase1Copy({ fields = {}, mdmResult, treatmentResult, selectedPlanIds, providerName = "", facilityName = "", timestamp = "" }) {
  const sections = [];
  const divider = "\u2500".repeat(64);
  if (facilityName || timestamp) {
    sections.push([facilityName ? "FACILITY: " + facilityName : "", timestamp ? "DATE/TIME: " + timestamp : ""].filter(Boolean).join("  |  "));
    sections.push(divider);
  }
  if (fields.cc)     sections.push("CHIEF COMPLAINT: " + fields.cc);
  if (fields.vitals) sections.push("\nVITAL SIGNS:\n" + fields.vitals);
  if (fields.hpi)    sections.push("\nHISTORY OF PRESENT ILLNESS:\n" + fields.hpi);
  if (fields.ros)    sections.push("\nREVIEW OF SYSTEMS:\n" + fields.ros);
  if (fields.exam)   sections.push("\nPHYSICAL EXAMINATION:\n" + fields.exam);
  sections.push("\n" + divider);
  sections.push("ASSESSMENT AND PLAN\n");
  const impText = formatMDMForCopy(mdmResult);
  if (impText) { sections.push(impText); sections.push(""); }
  const txText = formatTreatmentForCopy(treatmentResult);
  if (txText) { sections.push(txText); sections.push(""); }
  if (mdmResult?.mdm_level || mdmResult?.mdm_label) {
    const level = mdmResult.mdm_label || "";
    const code  = mdmResult.mdm_level || "";
    const conf  = mdmResult.mdm_confidence ? " (" + mdmResult.mdm_confidence + ")" : "";
    sections.push("MDM COMPLEXITY: " + level + (code ? " \u2014 " + code : "") + conf);
    if (mdmResult.mdm_confidence_note) sections.push(mdmResult.mdm_confidence_note);
    sections.push("");
  }
  const planLines = buildClinicalPlanText(selectedPlanIds);
  if (planLines) { sections.push("CLINICAL PLAN:"); sections.push(planLines); sections.push(""); }
  sections.push(divider);
  sections.push(providerName ? "Electronically signed: " + providerName + "  |  " + (timestamp || "") : "Documentation time: " + (timestamp || ""));
  return sections.filter(s => s !== null && s !== undefined).join("\n");
}

// ─── PHASE 2 COPY — Reevaluation addendum for EHR paste ──────────────────────
function buildPhase2Copy(p2, disp, extras = {}, mode = "plain") {
  const ts = new Date().toLocaleString("en-US", {
    month:"short", day:"numeric", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
  const provider = extras.providerName ? ` — ${extras.providerName}` : "";
  const sep = mode === "epic" ? "\n" : "\n";

  // Demographics header
  const demog2 = extras.demographics || {};
  const p2name = [demog2.firstName, demog2.lastName].filter(Boolean).join(" ") || "_______________";

  const lines = [
    `${ts}${provider} — ED Reevaluation & Disposition`,
    `Patient: ${p2name}    MRN: ${demog2.mrn || "_______________"}`,
    "",
  ];

  if (p2.newVitals) {
    lines.push("UPDATED VITAL SIGNS:"); lines.push(p2.newVitals); lines.push("");
  }

  if (p2.labs) {
    lines.push("LAB RESULTS:"); lines.push(p2.labs); lines.push("");
  }

  if (p2.imaging) {
    lines.push("IMAGING RESULTS:"); lines.push(p2.imaging); lines.push("");
  }

  if (p2.ekg) {
    lines.push("EKG/ECG RESULTS:"); lines.push(p2.ekg); lines.push("");
  }

  if (disp) {
    if (disp.reevaluation_note) {
      lines.push("REEVALUATION:"); lines.push(disp.reevaluation_note); lines.push("");
    }

    if (disp.result_flags?.length) {
      lines.push("CRITICAL/ABNORMAL VALUES:");
      disp.result_flags.forEach(f => {
        lines.push(`  ${f.parameter}: ${f.value} — ${f.status?.toUpperCase()}`);
        if (f.recommendation) lines.push(`    → ${f.recommendation}`);
      });
      lines.push("");
    }

    if (disp.final_diagnosis) {
      lines.push("FINAL IMPRESSION:");
      lines.push(disp.final_diagnosis);
      // ICD-10 codes
      if (extras.icdSelected?.length) {
        extras.icdSelected.forEach(c => lines.push(`  ${c.code} — ${c.description}`));
      }
      lines.push("");
    }

    lines.push(`DISPOSITION: ${disp.disposition || "—"}`);
    if (disp.disposition_plan) { lines.push(disp.disposition_plan); }
    lines.push("");

    // Interventions
    const confirmedInts = (extras.interventions || []).filter(i => i.confirmed !== false);
    if (confirmedInts.length) {
      lines.push("ED INTERVENTIONS:");
      confirmedInts.forEach(i => {
        let line = `  [${(i.type||"OTHER").toUpperCase()}] ${i.name}`;
        if (i.dose_route) line += ` — ${i.dose_route}`;
        if (i.time_given) line += ` (${i.time_given})`;
        if (i.response)   line += ` · ${i.response}`;
        lines.push(line);
      });
      lines.push("");
    }

    // Discharge instructions — only when discharging
    const di = disp.discharge_instructions;
    if (di && disp.disposition && !disp.disposition.toLowerCase().includes("admit") &&
        !disp.disposition.toLowerCase().includes("icu")) {
      lines.push("DISCHARGE INSTRUCTIONS:");
      if (di.diagnosis_explanation) { lines.push(di.diagnosis_explanation); lines.push(""); }
      if (di.medications?.length) {
        lines.push("Discharge Medications:");
        di.medications.forEach(m => lines.push(`  • ${typeof m === "string" ? m : m.medication || m}`));
        lines.push("");
      }
      if (di.activity) { lines.push(`Activity: ${di.activity}`); }
      if (di.diet)     { lines.push(`Diet: ${di.diet}`); }
      if (di.return_precautions?.length) {
        lines.push(""); lines.push("Return to ED if:");
        di.return_precautions.forEach(r => lines.push(`  • ${typeof r === "string" ? r : r}`));
      }
      if (di.followup) { lines.push(""); lines.push(`Follow-up: ${di.followup}`); }
    }
  }

  if (extras.sigBlock) { lines.push(""); lines.push(extras.sigBlock); }
  return lines.join(sep);
}



// ─── SOAP NOTE BUILDER (v11.5) ────────────────────────────────────────────────
function buildSOAPNote(p1, mdm, p2, disp) {
  const lines = [];
  lines.push("SUBJECTIVE:");
  if (p1.cc)  lines.push(`Chief Complaint: ${p1.cc}`);
  if (p1.hpi) { lines.push("History of Present Illness:"); lines.push(p1.hpi); }
  if (p1.ros) { lines.push("Review of Systems:"); lines.push(p1.ros); }
  lines.push("");
  lines.push("OBJECTIVE:");
  if (p1.vitals)  lines.push(`Vital Signs: ${p1.vitals}`);
  if (p1.exam)    { lines.push("Physical Examination:"); lines.push(p1.exam); }
  if (p2?.labs)   { lines.push("Laboratory Results:"); lines.push(p2.labs); }
  if (p2?.imaging){ lines.push("Imaging Results:"); lines.push(p2.imaging); }
  if (p2?.ekg)    lines.push(`EKG: ${p2.ekg}`);
  lines.push("");
  lines.push("ASSESSMENT:");
  if (mdm?.working_diagnosis) lines.push(`Working Diagnosis: ${mdm.working_diagnosis}`);
  if (mdm?.mdm_level)         lines.push(`MDM Level: ${mdm.mdm_level}${mdm.mdm_confidence ? " [" + mdm.mdm_confidence + "]" : ""}`);
  if (mdm?.differential?.length) {
    lines.push("Differential Diagnosis:");
    mdm.differential.forEach((d, i) => {
      if (!d || typeof d !== "object") return;
      lines.push(`  ${i+1}. ${d.diagnosis} (${d.probability})${d.must_not_miss ? " [MUST NOT MISS]" : ""}`);
    });
  }
  if (mdm?.mdm_narrative) { lines.push(""); lines.push(mdm.mdm_narrative); }
  if (mdm?.red_flags?.length) lines.push(`Red Flags: ${mdm.red_flags.join("; ")}`);
  lines.push("");
  lines.push("PLAN:");
  if (disp?.plan_summary)      lines.push(disp.plan_summary);
  if (disp?.disposition)       lines.push(`Disposition: ${disp.disposition}`);
  if (disp?.admission_service) lines.push(`Admission Service: ${disp.admission_service}`);
  if (disp?.disposition_rationale) lines.push(`Rationale: ${disp.disposition_rationale}`);
  if (disp?.orders?.length) {
    lines.push("Orders:");
    disp.orders.forEach((o, i) => lines.push(`  ${i+1}. ${o}`));
  }
  const di = disp?.discharge_instructions;
  if (di && disp?.disposition && !disp.disposition.toLowerCase().includes("admit")) {
    if (di.return_precautions?.length) {
      lines.push("Return Precautions:");
      di.return_precautions.forEach(r => lines.push(`  • ${r}`));
    }
    if (di.followup) lines.push(`Follow-up: ${di.followup}`);
  }
  return lines.join("\n");
}

export {
  formatMDMForCopy,
  buildMDMPrompt,
  buildDispPrompt,
  buildMDMBlock,
  buildSOAPNote,
  buildFullNote,
  buildPhase2Copy,
};

export const INITIAL_MDM_SCHEMA = {
  type: "object",
  required: ["clinical_presentation_summary","initial_differential","acute_threats","risk_factors","workup","decision_tools","initial_clinical_reasoning","initial_management"],
  properties: {
    clinical_presentation_summary: { type: "string" },
    initial_differential: { type: "array", minItems: 2, maxItems: 6, items: { type: "object", required: ["rank","diagnosis","reasoning"], properties: { rank: { type: "integer" }, diagnosis: { type: "string" }, reasoning: { type: "string" } } } },
    acute_threats: { type: "array", items: { type: "string" }, minItems: 1 },
    risk_factors: { type: "array", items: { type: "string" }, minItems: 1 },
    workup: { type: "object", required: ["labs","imaging","ecg"], properties: { labs: { type: "array", items: { type: "object", required: ["test","rationale"], properties: { test: { type: "string" }, rationale: { type: "string" } } } }, imaging: { type: "array", items: { type: "object", required: ["study","rationale"], properties: { study: { type: "string" }, rationale: { type: "string" } } } }, ecg: { type: "object", required: ["ordered","rationale"], properties: { ordered: { type: "string" }, rationale: { type: "string" } } }, other: { type: "array", items: { type: "string" } } } },
    decision_tools: { type: "array", items: { type: "object", required: ["tool","result","interpretation"], properties: { tool: { type: "string" }, result: { type: "string" }, interpretation: { type: "string" } } } },
    initial_clinical_reasoning: { type: "string" },
    initial_management: { type: "object", required: ["interventions","consultations","reassessment_plan"], properties: { interventions: { type: "array", items: { type: "string" }, minItems: 1 }, consultations: { type: "array", items: { type: "string" } }, reassessment_plan: { type: "array", items: { type: "string" }, minItems: 1 } } },
  },
};

export function buildInitialMDMPrompt(cc, vitals, hpi, ros, exam, pmh, meds, allergies) {
  return `${SYS_BIAS}

You are a board-certified emergency physician generating the INITIAL MEDICAL DECISION MAKING section of an ED note for Meditech. This captures reasoning AT TIME OF INITIAL EVALUATION — before results return.

PATIENT DATA:
Chief Complaint: ${cc || "not provided"}
Triage Vitals: ${vitals || "not provided"}
HPI: ${hpi || "not provided"}
Review of Systems: ${ros || "not provided"}
Physical Exam: ${exam || "not provided"}
PMH / Comorbidities: ${pmh || "not provided"}
Medications: ${meds || "not provided"}
Allergies: ${allergies || "none documented"}

Generate all eight sections:

clinical_presentation_summary: 2–4 sentence synthesis of CC, key history, pertinent positives/negatives. Clinical and specific, not generic.

initial_differential: ranked by danger (most dangerous first, not most likely). 2–5 diagnoses. Each: rank (int), diagnosis (string), reasoning (one sentence with key supporting finding).

acute_threats: life threats actively being evaluated (ACS, PE, aortic dissection, sepsis, stroke, surgical abdomen, ectopic pregnancy, ICH, etc.). If none: ["None identified at this time"].

risk_factors: patient-specific risk factors for this presentation. Age, sex, comorbidities, relevant medications (anticoagulation, immunosuppression), social factors. Be specific.

workup.labs: ordered labs with rationale. Group related tests if ordered for same reason.
workup.imaging: imaging studies with modality, region, contrast specification, rationale.
workup.ecg: ordered ("Yes"/"No"/"Not indicated") + rationale.
workup.other: POC glucose, cultures, LP planned, urine pregnancy, etc.

decision_tools: validated clinical scores APPLIED to this presentation with actual score/result and how it influenced the workup. Only include tools actually applicable. If none: [].

initial_clinical_reasoning: full narrative paragraph in first-person attending voice, present tense. Minimum 4 sentences. Include pre-test probability, dangerous diagnoses to exclude, how risk factors influence workup, key decision points. Use: "This [age]-year-old [sex] presents with [symptom]. Given [risk factors], [dangerous Dx] must be excluded. [Score/finding] suggests [risk level]. Initial workup is directed at [goal]."

initial_management.interventions: immediate management steps (IV access, fluids, meds given, NPO, monitoring, O2).
initial_management.consultations: "[Specialty] — [reason]" or ["None at this time"].
initial_management.reassessment_plan: "Will reassess [what] after [trigger]" statements.

Rules: This is initial MDM ONLY — do not reference results not yet returned. Dangerous diagnoses come before likely ones in differential. Reasoning must be specific to THIS patient.

Respond ONLY in valid JSON. No markdown fences.`;
}

export function formatInitialMDMForCopy(result) {
  if (!result) return "";
  const lines = [];
  lines.push("=====================================================================");
  lines.push("SECTION 1: INITIAL MEDICAL DECISION MAKING (at time of evaluation)");
  lines.push("=====================================================================");
  lines.push("");
  lines.push("CLINICAL PRESENTATION SUMMARY:");
  lines.push(result.clinical_presentation_summary || "");
  lines.push("");
  lines.push("INITIAL DIFFERENTIAL DIAGNOSIS (in order of clinical concern):");
  lines.push("");
  (result.initial_differential || []).forEach(d => lines.push(d.rank + ". " + d.diagnosis + " — " + d.reasoning));
  lines.push("");
  lines.push("ACUTE THREATS TO LIFE CONSIDERED:");
  lines.push("");
  (result.acute_threats || []).forEach(t => lines.push("* " + t));
  lines.push("");
  lines.push("RISK FACTORS CONSIDERED:");
  lines.push("");
  (result.risk_factors || []).forEach(r => lines.push("* " + r));
  lines.push("");
  lines.push("INITIAL WORKUP ORDERED & RATIONALE:");
  lines.push("");
  if (result.workup?.labs?.length) { lines.push("Labs Ordered:"); result.workup.labs.forEach(l => lines.push("* " + l.test + " — " + l.rationale)); lines.push(""); }
  if (result.workup?.imaging?.length) { lines.push("Imaging Ordered:"); result.workup.imaging.forEach(i => lines.push("* " + i.study + " — " + i.rationale)); lines.push(""); }
  if (result.workup?.ecg) { lines.push("ECG:"); lines.push("* Ordered: " + result.workup.ecg.ordered + (result.workup.ecg.rationale ? " — " + result.workup.ecg.rationale : "")); lines.push(""); }
  if (result.workup?.other?.length) { lines.push("Other:"); result.workup.other.forEach(o => lines.push("* " + o)); lines.push(""); }
  if (result.decision_tools?.length) { lines.push("DECISION TOOLS / CLINICAL SCORES APPLIED:"); lines.push(""); result.decision_tools.forEach(dt => { lines.push("* " + dt.tool + " " + dt.result); lines.push("  " + dt.interpretation); }); lines.push(""); }
  lines.push("INITIAL CLINICAL REASONING:");
  lines.push(result.initial_clinical_reasoning || "");
  lines.push("");
  lines.push("INITIAL MANAGEMENT INITIATED:");
  lines.push("");
  (result.initial_management?.interventions || []).forEach(i => lines.push("* " + i));
  if (result.initial_management?.consultations?.length) { lines.push(""); lines.push("Consultations Requested:"); result.initial_management.consultations.forEach(c => lines.push("* " + c)); }
  if (result.initial_management?.reassessment_plan?.length) { lines.push(""); lines.push("Reassessment Plan:"); result.initial_management.reassessment_plan.forEach(r => lines.push("* " + r)); }
  return lines.join("\n");
}

export const PLAN_CATEGORIES = [
  { id: "workup", label: "Workup", icon: "🔬", items: [
    { id: "labs", label: "Laboratory studies ordered" },
    { id: "imaging", label: "Imaging ordered" },
    { id: "ecg", label: "ECG ordered" },
    { id: "cultures", label: "Blood / urine cultures ordered" },
    { id: "poc", label: "Point-of-care testing" },
  ]},
  { id: "treatment", label: "Treatment", icon: "💊", items: [
    { id: "iv_access", label: "IV access established" },
    { id: "fluids", label: "IV fluids initiated" },
    { id: "analgesia", label: "Analgesia administered" },
    { id: "antiemetic", label: "Antiemetic administered" },
    { id: "antibiotics", label: "Antibiotics initiated" },
    { id: "anticoag", label: "Anticoagulation initiated" },
    { id: "cardiac_meds", label: "Cardiac medications initiated" },
    { id: "neuro_meds", label: "Neurologic medications initiated" },
    { id: "resp_tx", label: "Respiratory therapy / bronchodilators" },
    { id: "wound", label: "Wound care / procedure performed" },
    { id: "npo", label: "NPO status maintained" },
    { id: "monitoring", label: "Continuous monitoring initiated" },
    { id: "o2", label: "Supplemental oxygen initiated" },
  ]},
  { id: "consults", label: "Consultations", icon: "📞", items: [
    { id: "surgery", label: "Surgery consulted" },
    { id: "cardiology", label: "Cardiology consulted" },
    { id: "neurology", label: "Neurology consulted" },
    { id: "ob_gyn", label: "OB/GYN consulted" },
    { id: "ortho", label: "Orthopedics consulted" },
    { id: "urology", label: "Urology consulted" },
    { id: "nephrology", label: "Nephrology consulted" },
    { id: "pulm", label: "Pulmonology consulted" },
    { id: "id_consult", label: "Infectious Disease consulted" },
    { id: "psych", label: "Psychiatry consulted" },
    { id: "sw", label: "Social Work consulted" },
    { id: "pcp", label: "Primary care / admitting physician notified" },
  ]},
  { id: "monitoring_safety", label: "Monitoring & Safety", icon: "📊", items: [
    { id: "vitals_q30", label: "Vital signs every 30 minutes" },
    { id: "vitals_q60", label: "Vital signs every 60 minutes" },
    { id: "reassess_pain", label: "Reassess pain control in 30-60 minutes" },
    { id: "reassess_resp", label: "Reassess respiratory status" },
    { id: "neuro_checks", label: "Neurologic checks every 1 hour" },
    { id: "tele", label: "Continuous telemetry monitoring" },
    { id: "spo2", label: "Continuous pulse oximetry" },
    { id: "foley", label: "Foley / strict urine output monitoring" },
    { id: "fall_precautions", label: "Fall precautions in place" },
  ]},
  { id: "disposition_plan", label: "Disposition Plan", icon: "🏥", items: [
    { id: "admit_plan", label: "Admission anticipated pending results" },
    { id: "obs_plan", label: "Observation status anticipated" },
    { id: "dc_plan", label: "Discharge anticipated if workup negative" },
    { id: "transfer_plan", label: "Transfer being arranged" },
    { id: "family_notified", label: "Family / representative notified" },
    { id: "reassess_dispo", label: "Disposition pending result review" },
  ]},
];

export function buildClinicalPlanText(selectedPlanIds) {
  if (selectedPlanIds !== null && selectedPlanIds !== undefined && selectedPlanIds.size === 0) return "";
  const lines = [];
  PLAN_CATEGORIES.forEach(cat => {
    const catItems = cat.items.filter(item => !selectedPlanIds || selectedPlanIds.has(item.id));
    if (!catItems.length) return;
    lines.push(cat.label.toUpperCase() + ":");
    catItems.forEach(item => lines.push("  \u2022 " + item.label));
    lines.push("");
  });
  return lines.join("\n").trimEnd();
}