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
      required: ["working_dx_line","clinical_rationale","cannot_exclude","differentials"],
      properties: {
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

const DISP_SCHEMA = {
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
working_dx_line: concise label, format: "[Primary Dx] in the setting of [context]"
clinical_rationale: 1–3 sentences using "consistent with" language
cannot_exclude: array of sentences opening with "[Dx] cannot be excluded given [reason]." or "[Dx] must be ruled out in any [descriptor] presenting with [symptom]." Always include life threats and ectopic pregnancy for reproductive-age females with abdominal pain.
differentials: ranked array, most likely first. Each: rank (int), diagnosis (string with parenthetical context), rationale (3–8 words).

SECTION 2 — initial_management:
immediate_interventions: brief bedside orders, each under 10 words
diagnostics: ordered by urgency, each has test (specific name) and rationale (one clause). Include imaging modality and conditional escalation (e.g. CT if ultrasound non-diagnostic).
pending_data_summary: one sentence: "[results pending] will refine working diagnosis and guide further management."

Also output: mdm_level (99281-99285), mdm_label, problem_complexity, data_complexity, risk_tier, acep_policy_ref, mdm_confidence (Strong|Borderline-up|Borderline-down), mdm_confidence_note.

Clinical rules: always address life threats before anchoring. Use "cannot be excluded" not "ruled out" until definitive testing complete. For reproductive-age females with abdominal pain, ectopic must appear in cannot_exclude.

Respond ONLY in valid JSON. No markdown fences.`;
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
function buildMDMBlock(mdm) {
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
  if (mdm.red_flags?.length)
    lines.push(`\nRed Flags: ${mdm.red_flags.join("; ")}`);
  if (mdm.critical_actions?.length) {
    lines.push("\nCRITICAL ACTIONS (Do Now):");
    mdm.critical_actions.forEach((a, i) => lines.push(`  ${i+1}. ${a}`));
  }
  if (mdm.treatment_recommendations?.length) {
    lines.push("\nTREATMENT RECOMMENDATIONS:");
    mdm.treatment_recommendations.forEach((t, i) => {
      lines.push(`  ${i+1}. [${t.evidence_level}] ${t.intervention}`);
      lines.push(`     Indication: ${t.indication}`);
      if (t.guideline_ref) lines.push(`     Ref: ${t.guideline_ref}`);
      if (t.notes) lines.push(`     Note: ${t.notes}`);
    });
  }
  if (mdm.recommended_actions?.length) {
    lines.push("\nRECOMMENDED ACTIONS (This Visit):");
    mdm.recommended_actions.forEach((a, i) => lines.push(`  ${i+1}. ${a}`));
  }
  if (mdm.data_reviewed) lines.push(`\nData Reviewed: ${mdm.data_reviewed}`);
  if (mdm.risk_rationale)  lines.push(`Risk Rationale: ${mdm.risk_rationale}`);
  if (mdm.mdm_narrative)   lines.push(`\nMDM NARRATIVE:\n${mdm.mdm_narrative}`);
  if (mdm.acep_policy_ref) lines.push(`\nACEP Policy: ${mdm.acep_policy_ref}`);
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
function buildPhase1Copy(p1, mdm, extras = {}, mode = "plain") {
  const ts = new Date().toLocaleString("en-US", {
    month:"short", day:"numeric", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
  const provider = extras.providerName ? ` — ${extras.providerName}` : "";
  const sep  = mode === "epic" ? "\n" : "\n";
  const hdr  = (label) => mode === "epic" ? label : label;

  // Demographics header
  const demog = extras.demographics || {};
  const nameStr  = [demog.firstName, demog.lastName].filter(Boolean).join(" ") || "_______________";
  const dobStr   = demog.dob        || "_______________";
  const mrnStr   = demog.mrn        || "_______________";
  const encStr   = demog.encounter  || "_______________";
  const locStr   = demog.location   || "ED";

  const lines = [
    `${ts}${provider} — Emergency Department Note`,
    "",
    `Patient: ${nameStr}    DOB: ${dobStr}    MRN: ${mrnStr}`,
    `Encounter: ${encStr}    Location: ${locStr}`,
    "",
    hdr("CHIEF COMPLAINT:"),
    p1.cc || "—",
    "",
  ];

  if (p1.vitals) {
    lines.push(hdr("VITAL SIGNS:")); lines.push(p1.vitals); lines.push("");
  }

  if (p1.hpi) {
    lines.push(hdr("HISTORY OF PRESENT ILLNESS:"));
    lines.push(extras.hpiSummary?.trim() || p1.hpi);
    lines.push("");
  }

  // Medications & allergies
  if (extras.parsedMeds?.length || extras.parsedAllergies?.length) {
    if (extras.parsedMeds?.length) {
      lines.push(hdr("CURRENT MEDICATIONS:"));
      extras.parsedMeds.forEach(m => {
        const parts = [m.name, m.dose, m.route, m.frequency].filter(Boolean);
        lines.push(`  ${parts.join("  ")}`);
      });
      lines.push("");
    }
    if (extras.parsedAllergies?.length) {
      lines.push(hdr("ALLERGIES:"));
      extras.parsedAllergies.forEach(a => lines.push(`  ${a.allergen}: ${a.reaction}`));
      lines.push("");
    }
  }

  if (p1.ros) {
    lines.push(hdr("REVIEW OF SYSTEMS:")); lines.push(p1.ros); lines.push("");
  }

  if (p1.exam) {
    lines.push(hdr("PHYSICAL EXAMINATION:")); lines.push(p1.exam); lines.push("");
  }

  // Assessment & Plan — EHR-ready format
  if (mdm) {
    lines.push(hdr("ASSESSMENT AND PLAN:"));
    if (mdm.working_diagnosis) lines.push(`Working Impression: ${mdm.working_diagnosis}`);
    if (mdm.mdm_level) lines.push(`MDM Complexity: ${mdm.mdm_level}`);
    lines.push("");
    const mdmCopyText = formatMDMForCopy(mdm);
    if (mdmCopyText) { lines.push(mdmCopyText); lines.push(""); }
    // Numbered plan from recommended actions
    const actions = (mdm.recommended_actions || []).filter(Boolean);
    if (actions.length) {
      lines.push("Plan:");
      actions.forEach((a, i) => lines.push(`  ${i+1}. ${typeof a === "string" ? a : a.action || a}`));
      lines.push("");
    }
    // Critical actions
    if (mdm.critical_actions?.length) {
      lines.push("Immediate Actions:");
      mdm.critical_actions.forEach(a => lines.push(`  • ${a}`));
      lines.push("");
    }
  }

  if (extras.sigBlock) { lines.push(""); lines.push(extras.sigBlock); }
  return lines.join(sep);
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
  DISP_SCHEMA,
  buildMDMPrompt,
  buildDispPrompt,
  buildMDMBlock,
  buildSOAPNote,
  buildFullNote,
  buildPhase1Copy,
  buildPhase2Copy,
};