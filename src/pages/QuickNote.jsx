// QuickNote.jsx  v10
// Two-phase ED documentation: Phase 1 -> MDM | Phase 2 -> Reevaluation, Plan, Disposition, Discharge Rx
// Grounded in AMA/CMS 2023 E&M MDM table + ACEP Clinical Policy guidelines
// Keyboard: Tab advances | Cmd+Enter submit | Ctrl+T template/CC picker | 1-9 select | Esc close
//           Alt+H/R/E/L field jump | C copy full note | Cmd+Shift+C copy section | P print
//
// v10 new feature:
//   Treatment Recommendations — evidence-based in-ED treatment plan under MDM,
//   grounded in ACC/AHA Class I–III evidence levels + ACEP Clinical Policies.
//   Each item: intervention, indication, evidence level (color-coded), guideline ref, notes.
//   Included in Copy MDM block and Copy Full Note output.

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { dispColor, StepProgress, InputZone, MDMResult, DispositionResult } from "./QuickNoteComponents";

// ─── STYLE INJECTION ─────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("qn-css")) return;
  const s = document.createElement("style"); s.id = "qn-css";
  s.textContent = `
    :root{
      --qn-bg:#050f1e;--qn-panel:#081628;--qn-card:#0b1e36;
      --qn-txt:#f2f7ff;--qn-txt2:#b8d4f0;--qn-txt3:#82aece;--qn-txt4:#6b9ec8;
      --qn-teal:#00e5c0;--qn-gold:#f5c842;--qn-coral:#ff6b6b;
      --qn-blue:#3b9eff;--qn-purple:#9b6dff;--qn-green:#3dffa0;
      --qn-red:#ff4444;--qn-orange:#ff9f43;
      --qn-bd:rgba(42,79,122,0.4);--qn-up:rgba(14,37,68,0.75);
    }
    @keyframes qnfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .qn-fade{animation:qnfade .2s ease both}
    @keyframes qnshim{0%{background-position:-200% center}100%{background-position:200% center}}
    .qn-shim{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 25%,#00e5c0 50%,#3b9eff 75%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:qnshim 6s linear infinite
    }
    @keyframes qnpulse{0%,100%{opacity:.5}50%{opacity:1}}
    .qn-busy-dot{animation:qnpulse 1.2s ease-in-out infinite}
    .qn-ta{
      background:var(--qn-up);border:1px solid var(--qn-bd);border-radius:10px;
      padding:10px 12px;color:var(--qn-txt);font-family:'JetBrains Mono',monospace;
      font-size:11px;outline:none;width:100%;box-sizing:border-box;
      transition:border-color .15s;resize:vertical;line-height:1.65;
    }
    .qn-ta:focus{border-color:rgba(0,229,192,.5);box-shadow:0 0 0 2px rgba(0,229,192,.08)}
    .qn-ta::placeholder{color:rgba(130,174,206,.35)}
    .qn-ta.active-phase{border-color:rgba(0,229,192,.35)}
    .qn-ta.p2-active{border-color:rgba(59,158,255,.35)}
    .qn-btn{
      padding:10px 0;border-radius:10px;cursor:pointer;transition:all .15s;
      font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;
      display:flex;align-items:center;justify-content:center;gap:8px
    }
    .qn-btn:disabled{cursor:not-allowed;opacity:.45}
    .qn-section-lbl{
      font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
      color:var(--qn-txt4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px
    }
    .qn-card{
      background:rgba(8,22,40,.6);border:1px solid var(--qn-bd);
      border-radius:12px;padding:14px 16px
    }
    @media print{
      .no-print{display:none!important}
      body{background:#fff!important}
      .print-body{color:#111!important;background:#fff!important;padding:20px}
      .print-body *{color:#111!important;background:transparent!important;border-color:#ccc!important}
    }
  `;
  document.head.appendChild(s);
  if (!document.getElementById("qn-fonts")) {
    const l = document.createElement("link"); l.id = "qn-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────
const SYS_BIAS = `COGNITIVE BIAS PREVENTION — apply before generating output:
1. ANCHORING BIAS: Do not anchor your MDM level to the triage impression or chief complaint. Derive complexity independently from the clinical data.
2. PREMATURE CLOSURE: After identifying the leading diagnosis, conduct a mandatory differential pass for at least 2 alternative or co-existing diagnoses.
3. FRAMING BIAS: Evaluate severity based on the objective findings, not the narrative framing of the presenting complaint.
4. AVAILABILITY BIAS: Do not over-weight dramatic diagnoses. Apply pre-test probability and base rates.`;

const MDM_SCHEMA = {
  type: "object",
  required: ["mdm_level", "mdm_narrative", "working_diagnosis", "differential", "risk_tier"],
  properties: {
    problem_complexity:    { type: "string" },
    data_complexity:       { type: "string" },
    risk_tier:             { type: "string" },
    mdm_level:             { type: "string" },
    mdm_narrative:         { type: "string" },
    working_diagnosis:     { type: "string" },
    differential:          { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
    red_flags:             { type: "array", items: { type: "string" }, maxItems: 6 },
    critical_actions:      { type: "array", items: { type: "string" }, maxItems: 5 },
    recommended_actions:   { type: "array", items: { type: "string" }, maxItems: 6 },
    treatment_recommendations: {
      type: "array", maxItems: 8,
      items: {
        type: "object",
        required: ["intervention", "indication", "evidence_level"],
        properties: {
          intervention:   { type: "string" },
          indication:     { type: "string" },
          evidence_level: { type: "string" },
          guideline_ref:  { type: "string" },
          notes:          { type: "string" },
        },
      },
    },
    data_reviewed:         { type: "string" },
    risk_rationale:        { type: "string" },
    acep_policy_ref:       { type: "string" },
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
        acep_policy_ref:       { type: "string" },
      },
    },
  },
};

function buildMDMPrompt(cc, vitals, hpi, ros, exam) {
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
Physical Exam: ${exam || "Not provided"}

Generate the MDM assessment. Use ONLY the following exact values for each field:

problem_complexity — pick the single best match:
"1 self-limited or minor problem" | "1 stable chronic illness" | "2+ self-limited problems" | "1+ chronic illness with exacerbation" | "Undiagnosed new problem with uncertain prognosis" | "Acute illness with systemic symptoms" | "Acute or chronic illness posing threat to life or function"

data_complexity — pick the single best match:
"Minimal or none" | "Limited — ordering or reviewing tests" | "Moderate — independent interpretation of results" | "Moderate — discussion with treating provider" | "Extensive — independent interpretation and provider discussion"

For mdm_narrative write a single clinically complete paragraph suitable for direct EMR charting (3-5 sentences). For differential provide 2-4 alternative diagnoses ranked by clinical probability. For critical_actions list only interventions required in the next 15-30 minutes — return an empty array if none are needed. For recommended_actions return an array of plain-text strings ONLY — each item must be a single complete sentence, NOT a JSON object or structured data. For lab/test recommendations use this exact format: "Test name in Xh — if [result], then [action]". Example: "Repeat troponin at 3h — if delta >0.04 ng/mL, initiate ACS protocol and cardiology consult." Example: "Urinalysis with reflex culture — if positive, initiate antibiotic therapy." Each string must stand alone as readable chart text. Return an empty array if none. Do NOT return objects, do NOT use keys like test_name or indication. For treatment_recommendations provide evidence-based in-ED treatment interventions for the working diagnosis. For each item: intervention = specific treatment with dose/route/frequency where applicable; indication = clinical indication or threshold; evidence_level = exactly one of "Class I" / "Class IIa" / "Class IIb" / "Class III" / "Expert consensus" per ACC/AHA classification — use "Expert consensus" if unsure; guideline_ref = cite ONLY if highly confident (ACEP Clinical Policy, ACC/AHA, SSC, etc.) — return empty string if uncertain, never fabricate; notes = cautions or contraindications (optional). Prioritize highest-evidence interventions. Do NOT duplicate items already in critical_actions. For acep_policy_ref, reference the most applicable ACEP Clinical Policy by name only if one directly applies — otherwise return an empty string.

Respond ONLY in valid JSON, no markdown fences.`;
}

function buildDispPrompt(mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam) {
  const mdmSummary = mdmResult
    ? `Working Dx: ${mdmResult.working_diagnosis || "?"}  |  MDM Level: ${mdmResult.mdm_level || "?"}  |  Risk: ${mdmResult.risk_tier || "?"}`
    : "Not available";
  const redFlags = mdmResult?.red_flags?.length
    ? `Red Flags: ${mdmResult.red_flags.join("; ")}`
    : "";
  const critActions = mdmResult?.critical_actions?.length
    ? `Critical Actions: ${mdmResult.critical_actions.join("; ")}`
    : "";
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
Physical Exam: ${exam || "Not provided"}

PHASE 1 MDM SUMMARY:
${mdmSummary}${redFlags ? "\n" + redFlags : ""}${critActions ? "\n" + critActions : ""}

WORKUP RESULTS:
Labs: ${labs || "Not provided / not ordered"}
Imaging: ${imaging || "Not provided / not ordered"}
Re-check Vitals: ${newVitals || "Not documented"}

INSTRUCTIONS:
- reevaluation_note: 2-3 sentence clinical reevaluation note suitable for EMR charting. MUST explicitly incorporate imaging findings if imaging was provided — state the specific study, key finding, and how it affects the clinical picture. Describe interval change and response to treatment.
- updated_impression: one concise sentence updating the clinical impression based on ALL workup findings including imaging.
- treatment_response: brief phrase (e.g. "Improved with IVF and antiemetics", "No significant change", "Worsening")
- disposition: one of "Discharge" / "Discharge with precautions" / "Observation" / "Admit" / "Admit to ICU" / "Transfer"
- disposition_rationale: 1-2 sentences clinical justification referencing specific lab AND imaging findings by name
- plan_summary: 2-3 sentence overall plan narrative that incorporates imaging results — if imaging was provided, the plan must reference the specific study and finding
- orders: array of specific discharge or admission orders as brief action items (max 12)
- result_flags: review ALL Labs AND Imaging/Radiology results provided. For EACH abnormal lab value AND for EACH significant imaging finding, create one entry. For imaging: parameter = study type (e.g. "CXR", "CT Head"), value = key finding, status based on urgency. For labs: parameter = test name with units. status = one of "critical" / "high" / "low" / "borderline" / "notable". clinical_significance: 1 sentence why it matters in this clinical context. recommendation: specific actionable next step. guideline_citation: specific guideline name + year if confident, else empty string. Only flag values and findings that warrant clinical attention — do NOT list normal results.
- discharge_instructions.diagnosis_explanation: plain-language explanation for patient (2-3 sentences)
- discharge_instructions.return_precautions: exactly 5 specific, actionable return precautions per ACEP standard (fever, worsening, new symptoms, medication issues, follow-up failure)
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
  if (mdm.working_diagnosis) lines.push(`\nWorking Diagnosis: ${mdm.working_diagnosis}`);
  if (mdm.differential?.length)
    lines.push(`Differential: ${mdm.differential.map((d,i) => `(${i+1}) ${d}`).join(", ")}`);
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
function buildFullNote(p1, mdm, p2, disp) {
  const ts = new Date().toLocaleString();
  const cc = p1.cc || "";
  const lines = [`ED QUICK NOTE — ${ts}`, `Chief Complaint: ${cc || "—"}`, ""];

  // ── Raw clinical inputs ──
  if (p1.vitals) lines.push(`Vitals: ${p1.vitals}`);
  if (p1.hpi)    { lines.push(""); lines.push("HPI:"); lines.push(p1.hpi); }
  if (p1.ros)    { lines.push(""); lines.push("ROS:"); lines.push(p1.ros); }
  if (p1.exam)   { lines.push(""); lines.push("Physical Exam:"); lines.push(p1.exam); }
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
    if (mdm.data_reviewed) lines.push(`Data Reviewed: ${mdm.data_reviewed}`);
    if (mdm.risk_rationale) lines.push(`Risk Rationale: ${mdm.risk_rationale}`);
    if (mdm.mdm_narrative) lines.push(`\nMDM NARRATIVE:\n${mdm.mdm_narrative}`);
    if (mdm.acep_policy_ref) lines.push(`ACEP Policy: ${mdm.acep_policy_ref}`);
    lines.push("");
  }

  if (disp) {
    lines.push(`=== ED REEVALUATION ===`);
    if (disp.reevaluation_note) lines.push(disp.reevaluation_note);
    lines.push("");
    lines.push(`=== PLAN & DISPOSITION ===`);
    if (disp.final_diagnosis) lines.push(`Final Impression: ${disp.final_diagnosis}`);
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

  lines.push(`\n---\nGenerated by Notrya QuickNote. Always verify AI-generated content before charting.`);
  return lines.join("\n");
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function QuickNote({ embedded = false, demo, vitals: initVitals, cc: initCC }) {
  // Phase 1 inputs
  const [cc,     setCC]     = useState(initCC?.text || "");
  const [vitals, setVitals] = useState(() => {
    if (!initVitals) return "";
    const parts = [
      initVitals.hr   ? `HR ${initVitals.hr}`          : null,
      initVitals.bp   ? `BP ${initVitals.bp}`          : null,
      initVitals.rr   ? `RR ${initVitals.rr}`          : null,
      initVitals.spo2 ? `SpO2 ${initVitals.spo2}%`     : null,
      initVitals.temp ? `T ${initVitals.temp}`          : null,
    ].filter(Boolean);
    return parts.join("  ");
  });
  const [hpi,    setHpi]    = useState("");
  const [ros,    setRos]    = useState("");
  const [exam,   setExam]   = useState("");

  // Phase 2 inputs
  const [labs,      setLabs]      = useState("");
  const [imaging,   setImaging]   = useState("");
  const [newVitals, setNewVitals] = useState("");

  // AI results
  const [mdmResult,  setMdmResult]  = useState(null);
  const [dispResult, setDispResult] = useState(null);

  // UI state
  const [p1Busy,   setP1Busy]   = useState(false);
  const [p2Busy,   setP2Busy]   = useState(false);
  const [p1Error,  setP1Error]  = useState(null);
  const [p2Error,  setP2Error]  = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [p2Open,   setP2Open]   = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedMDM,    setCopiedMDM]    = useState(false);
  const [copiedDisch,  setCopiedDisch]  = useState(false);
  const [copiedMDMFull, setCopiedMDMFull] = useState(false);
  const [savedNote,     setSavedNote]     = useState(false);
  const [saving,        setSaving]        = useState(false);

  const phase1Ready = Boolean(cc.trim() || hpi.trim() || exam.trim());
  const phase2Ready = Boolean(mdmResult && (labs.trim() || imaging.trim() || newVitals.trim()));

  // Refs for Tab navigation
  const fieldRefs = useRef([]);
  const setRef = useCallback((idx) => (ref) => { fieldRefs.current[idx] = ref; }, []);

  const advanceFocus = useCallback((idx) => {
    const next = fieldRefs.current[idx + 1];
    if (next?.current) next.current.focus();
  }, []);

  // Phase 1 — MDM
  const runMDM = useCallback(async () => {
    if (!phase1Ready || p1Busy) return;
    setP1Busy(true);
    setP1Error(null);
    setMdmResult(null);
    setDispResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc, vitals, hpi, ros, exam),
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res);
      setP2Open(true);
    } catch (e) {
      setP1Error("MDM generation failed: " + (e.message || "Check API connectivity"));
    } finally {
      setP1Busy(false);
    }
  }, [cc, vitals, hpi, ros, exam, phase1Ready, p1Busy]);

  // Phase 2 — Disposition
  const runDisposition = useCallback(async () => {
    if (!mdmResult || p2Busy) return;
    setP2Busy(true);
    setP2Error(null);
    setDispResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildDispPrompt(mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam),
        response_json_schema: DISP_SCHEMA,
      });
      setDispResult(res);
    } catch (e) {
      setP2Error("Disposition generation failed: " + (e.message || "Check API connectivity"));
    } finally {
      setP2Busy(false);
    }
  }, [mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam, p2Busy]);

  // Copy full note
  const copyNote = useCallback(() => {
    const text = buildFullNote(
      { cc, vitals, hpi, ros, exam },
      mdmResult,
      { labs, imaging, newVitals },
      dispResult
    );
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [cc, vitals, hpi, ros, exam, mdmResult, labs, imaging, newVitals, dispResult]);

  const hasAnyResult = Boolean(mdmResult || dispResult);

  // Save note to ClinicalNote entity
  const saveNote = useCallback(async () => {
    if (saving || !hasAnyResult) return;
    setSaving(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      const fullText = buildFullNote(
        { cc, vitals, hpi, ros, exam },
        mdmResult,
        { labs, imaging, newVitals },
        dispResult
      );
      await base44.entities.ClinicalNote.create({
        source:             "QuickNote",
        encounter_date:     new Date().toISOString().split("T")[0],
        cc:                 cc || "",
        chief_complaint:    cc || "",
        raw_note:           fullText,
        full_note_text:     fullText,
        working_diagnosis:  mdmResult?.working_diagnosis || dispResult?.final_diagnosis || "",
        mdm_level:          mdmResult?.mdm_level || "",
        mdm_narrative:      mdmResult?.mdm_narrative || "",
        mdm:                mdmResult?.mdm_narrative || "",
        disposition:        dispResult?.disposition || "",
        disposition_plan:   dispResult?.disposition || "",
        provider_name:      user?.full_name || user?.email || "",
        patient_identifier: demo?.mrn || "",
        patient_id:         demo?.mrn || "",
        status:             "finalized",
      });
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 3000);
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  }, [saving, hasAnyResult, cc, vitals, hpi, ros, exam, labs, imaging,
      newVitals, mdmResult, dispResult, demo]);
  useEffect(() => {
    const fn = e => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = tag === "textarea" || tag === "input";

      // Cmd/Ctrl+Shift+C — copy focused result section
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        const active = document.activeElement;
        if (active?.dataset?.copySection) {
          const txt = active.dataset.copySection;
          navigator.clipboard.writeText(txt);
        } else {
          copyNote();
        }
        return;
      }

      // Cmd/Ctrl+Enter — fire correct phase based on which textarea has focus
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const activePhase = parseInt(document.activeElement?.dataset?.phase || "1");
        if (p2Open && activePhase === 2) {
          runDisposition();
        } else {
          runMDM();
        }
        return;
      }

      // Alt+H/R/E/L — jump to field
      if (e.altKey && !e.metaKey) {
        const jumpMap = { h:2, r:3, e:4, l:5 };
        const idx = jumpMap[e.key.toLowerCase()];
        if (idx !== undefined) {
          e.preventDefault();
          fieldRefs.current[idx]?.current?.focus();
          return;
        }
      }

      if (inInput) return;

      // C — copy full note
      if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && (mdmResult || dispResult)) {
        e.preventDefault();
        copyNote();
      }
      // P — print
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [p2Open, mdmResult, dispResult, runMDM, runDisposition, copyNote]);

  const makeKeyDown = useCallback((idx, isLast, onEnterSubmit) => (e) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (!isLast) advanceFocus(idx);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (onEnterSubmit) onEnterSubmit();
    }
  }, [advanceFocus]);

  // Auto-focus Labs when Phase 2 opens
  useEffect(() => {
    if (p2Open) {
      setTimeout(() => { fieldRefs.current[5]?.current?.focus(); }, 80);
    }
  }, [p2Open]);

  const isFatigueRisk = useMemo(() => { const h = new Date().getHours(); return h >= 17 || h <= 7; }, []);
  const [fatigueDismissed, setFatigueDismissed] = useState(false);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : "var(--qn-bg)",
      minHeight: embedded ? "auto" : "100vh",
      color: "var(--qn-txt)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto",
        padding: embedded ? "0" : "0 16px 40px" }}>

        {/* Standalone header */}
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }} className="no-print">
            <button onClick={() => window.history.back()}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                borderRadius:8, padding:"5px 14px", color:"var(--qn-txt3)", cursor:"pointer" }}>
              ← Back
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,.9)", border:"1px solid rgba(42,79,122,.6)",
                borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:"var(--qn-purple)", letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:"var(--qn-txt3)", letterSpacing:2 }}>QUICKNOTE</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,229,192,.5),transparent)" }} />
            </div>
            <h1 className="qn-shim" style={{ fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
              letterSpacing:-.5, lineHeight:1.1, margin:"0 0 4px" }}>
              QuickNote
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--qn-txt4)", margin:0 }}>
              Paste · Cmd+Enter generate MDM · Complete workup · Cmd+Enter disposition · C copy · Ctrl+T template · Alt+H/R/E/L jump
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}
            className="no-print">
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:15, color:"var(--qn-teal)" }}>QuickNote</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--qn-txt4)", letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.25)",
              borderRadius:4, padding:"2px 7px" }}>
              MDM · Disposition · Discharge Rx · v10
            </span>
          </div>
        )}

        {/* Patient banner — shown when demo context passed from NPI */}
        {demo && (demo.firstName || demo.lastName || demo.age) && (
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10,
            padding:"8px 13px", borderRadius:9,
            background:"rgba(22,45,79,.5)", border:"1px solid rgba(42,79,122,.45)" }}
            className="no-print">
            <span style={{ fontSize:13, flexShrink:0 }}>👤</span>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flex:1 }}>
              {(demo.firstName || demo.lastName) && (
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                  fontSize:13, color:"var(--qn-txt)" }}>
                  {[demo.firstName, demo.lastName].filter(Boolean).join(" ")}
                </span>
              )}
              {demo.age && (
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--qn-txt3)" }}>
                  {demo.age}yo{demo.sex ? " " + demo.sex : ""}
                </span>
              )}
              {demo.dob && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-txt4)", letterSpacing:.3 }}>DOB {demo.dob}</span>
              )}
              {demo.mrn && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-txt4)", letterSpacing:.3 }}>MRN {demo.mrn}</span>
              )}
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
              background:"rgba(0,229,192,.08)", border:"1px solid rgba(0,229,192,.2)",
              borderRadius:4, padding:"2px 7px", flexShrink:0 }}>From NPI</span>
          </div>
        )}

        {/* Fatigue flag */}
        {isFatigueRisk && !fatigueDismissed && (
          <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12,
            background:"rgba(245,200,66,.08)", border:"1px solid rgba(245,200,66,.35)",
            display:"flex", alignItems:"center", gap:9 }} className="no-print">
            <span style={{ fontSize:13, flexShrink:0 }}>⚠</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-gold)", flex:1, lineHeight:1.5 }}>
              <b>Late-shift alert (5 pm – 7 am).</b> Diagnostic error rates increase overnight. Apply extra systematic review before acting on AI-generated MDM.
            </span>
            <button onClick={() => setFatigueDismissed(true)}
              style={{ background:"transparent", border:"none", cursor:"pointer",
                color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, padding:"0 4px" }}>✕</button>
          </div>
        )}

        {/* Step progress */}
        <StepProgress
          phase1Done={Boolean(mdmResult)}
          phase2Done={Boolean(dispResult)}
          p2Open={p2Open}
        />

        {/* ── PHASE 1 ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom:14,
          background:"rgba(8,22,40,.5)", border:"1px solid rgba(42,79,122,.4)",
          borderRadius:14, padding:"16px" }}>

          {/* Phase header */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ width:24, height:24, borderRadius:"50%",
              background:"rgba(0,229,192,.15)", border:"1px solid rgba(0,229,192,.4)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'JetBrains Mono',monospace", fontSize:11,
              fontWeight:700, color:"var(--qn-teal)", flexShrink:0 }}>1</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:15, color:"var(--qn-teal)" }}>
                Initial Assessment
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-txt4)", letterSpacing:.8 }}>
                Paste nurse note fields → AI generates MDM
              </div>
            </div>
            {mdmResult && (
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
                padding:"4px 10px", borderRadius:7,
                background:"rgba(61,255,160,.08)", border:"1px solid rgba(61,255,160,.3)" }}>
                <div style={{ width:7, height:7, borderRadius:"50%",
                  background:"var(--qn-green)", flexShrink:0 }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-green)", letterSpacing:.5 }}>
                  MDM · {mdmResult.mdm_level}
                </span>
              </div>
            )}
          </div>

          {/* CC + Vitals row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <InputZone label="Chief Complaint" value={cc} onChange={setCC} phase={1}
              rows={2} templateType="cc" smartfill
              placeholder="e.g. Chest pain, sharp, onset 2h ago — or press T to select"
              onRef={setRef(0)}
              onKeyDown={makeKeyDown(0, false, runMDM)} />
            <InputZone label="Triage Vitals" value={vitals} onChange={setVitals} phase={1}
              rows={2}
              placeholder="e.g. HR 102 BP 148/92 RR 18 SpO2 96% T 37.4°C"
              onRef={setRef(1)}
              onKeyDown={makeKeyDown(1, false, runMDM)} />
          </div>

          {/* HPI */}
          <div style={{ marginBottom:12 }}>
            <InputZone label="HPI" value={hpi} onChange={setHpi} phase={1}
              rows={5} copyable
              placeholder="Paste HPI from nurse note or EHR — onset, location, quality, severity, duration, modifying factors, associated symptoms..."
              onRef={setRef(2)}
              onKeyDown={makeKeyDown(2, false, runMDM)} />
          </div>

          {/* ROS + Exam row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <InputZone label="Review of Systems" value={ros} onChange={setRos} phase={1}
              rows={4} copyable templateType="ros" smartfill
              placeholder="Paste ROS, or press T to insert a template..."
              onRef={setRef(3)}
              onKeyDown={makeKeyDown(3, false, runMDM)} />
            <InputZone label="Physical Exam" value={exam} onChange={setExam} phase={1}
              rows={4} copyable templateType="pe" smartfill
              placeholder="Paste physical exam, or press T to insert a template..."
              onRef={setRef(4)}
              onKeyDown={makeKeyDown(4, true, runMDM)} />
          </div>

          {/* Generate MDM button */}
          <button className="qn-btn" onClick={runMDM}
            disabled={p1Busy || !phase1Ready}
            style={{ width:"100%",
              border:`1px solid ${!phase1Ready || p1Busy ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.5)"}`,
              background:!phase1Ready || p1Busy
                ? "rgba(14,37,68,.5)"
                : "linear-gradient(135deg,rgba(0,229,192,.15),rgba(0,229,192,.04))",
              color:!phase1Ready || p1Busy ? "var(--qn-txt4)" : "var(--qn-teal)" }}>
            {p1Busy ? (
              <>
                <span className="qn-busy-dot">●</span>
                Generating MDM...
              </>
            ) : (
              <>✦ Generate MDM  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, opacity:.6 }}>[Cmd+Enter]</span></>
            )}
          </button>

          {p1Error && (
            <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
              background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
              {p1Error}
            </div>
          )}
        </div>

        {/* ── MDM RESULT ──────────────────────────────────────────────────── */}
        {mdmResult && (
          <div style={{ marginBottom:14, padding:"16px",
            background:"rgba(8,22,40,.5)", border:"1px solid rgba(0,229,192,.2)",
            borderRadius:14 }} className="print-body">
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:15, color:"var(--qn-teal)" }}>Medical Decision Making</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.2)",
                borderRadius:4, padding:"2px 7px" }}>AMA/CMS 2023 · ACEP</span>
              <div style={{ flex:1 }} />
              <button onClick={() => {
                navigator.clipboard.writeText(buildMDMBlock(mdmResult)).then(() => {
                  setCopiedMDMFull(true);
                  setTimeout(() => setCopiedMDMFull(false), 2000);
                });
              }}
                style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${copiedMDMFull ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
                  background:copiedMDMFull ? "rgba(61,255,160,.1)" : "rgba(0,229,192,.07)",
                  color:copiedMDMFull ? "var(--qn-green)" : "var(--qn-teal)",
                  transition:"all .15s" }}>
                {copiedMDMFull ? "✓ MDM Copied" : "Copy MDM"}
              </button>
              <button onClick={() => { setMdmResult(null); setDispResult(null); setP2Open(false); setConfirmClear(false); }}
                style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:"1px solid rgba(245,200,66,.35)",
                  background:"rgba(245,200,66,.07)", color:"var(--qn-gold)",
                  transition:"all .15s" }}>
                ↩ Re-run MDM
              </button>
            </div>
            <MDMResult result={mdmResult} copiedMDM={copiedMDM} setCopiedMDM={setCopiedMDM} />
          </div>
        )}

        {/* ── PHASE 2 ─────────────────────────────────────────────────────── */}
        {p2Open && (
          <div className="qn-fade" style={{ marginBottom:14,
            background:"rgba(8,22,40,.5)", border:"1px solid rgba(59,158,255,.35)",
            borderRadius:14, padding:"16px" }}>

            {/* Phase header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:24, height:24, borderRadius:"50%",
                background:"rgba(59,158,255,.15)", border:"1px solid rgba(59,158,255,.4)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                fontWeight:700, color:"var(--qn-blue)", flexShrink:0 }}>2</div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                  fontSize:15, color:"var(--qn-blue)" }}>
                  Workup & Disposition
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-txt4)", letterSpacing:.8 }}>
                  Enter results → AI generates reevaluation, plan, and discharge Rx
                </div>
              </div>
              {dispResult && (
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
                  padding:"4px 10px", borderRadius:7,
                  background:`${dispColor(dispResult.disposition)}12`,
                  border:`1px solid ${dispColor(dispResult.disposition)}40` }}>
                  <div style={{ width:7, height:7, borderRadius:"50%",
                    background:dispColor(dispResult.disposition), flexShrink:0 }} />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:dispColor(dispResult.disposition), letterSpacing:.5 }}>
                    {dispResult.disposition}
                  </span>
                </div>
              )}
            </div>

            {/* Labs + Imaging row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <InputZone label="Labs" value={labs} onChange={setLabs} phase={2}
                rows={4}
                placeholder="Paste lab results — CBC, BMP, troponin, lactate, UA, coags..."
                onRef={setRef(5)}
                onKeyDown={makeKeyDown(5, false, runDisposition)} />
              <InputZone label="Imaging / Studies" value={imaging} onChange={setImaging} phase={2}
                rows={4}
                placeholder="Paste imaging results — CXR, CT, ECG interpretation, POCUS findings..."
                onRef={setRef(6)}
                onKeyDown={makeKeyDown(6, false, runDisposition)} />
            </div>

            {/* Recheck vitals */}
            <div style={{ marginBottom:14 }}>
              <InputZone label="Re-check Vitals / Response to Treatment" value={newVitals}
                onChange={setNewVitals} phase={2}
                rows={2}
                placeholder="e.g. After IVF 1L: HR 88 BP 128/76 SpO2 99% — pain improved to 3/10"
                onRef={setRef(7)}
                onKeyDown={makeKeyDown(7, true, runDisposition)} />
            </div>

            {/* Workup warning — shown when MDM done but no workup data yet */}
            {!phase2Ready && mdmResult && (
              <div style={{ marginBottom:12, padding:"7px 11px", borderRadius:8,
                background:"rgba(245,200,66,.07)", border:"1px solid rgba(245,200,66,.3)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-gold)",
                display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ flexShrink:0 }}>⚠</span>
                No workup data entered. Enter at least one result above for a workup-informed disposition, or generate now for a clinical-impression-only assessment.
              </div>
            )}

            {/* Generate disposition button */}
            <button className="qn-btn" onClick={runDisposition}
              disabled={p2Busy || !mdmResult || p1Busy}
              style={{ width:"100%",
                border:`1px solid ${p2Busy || p1Busy ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.5)"}`,
                background:p2Busy || p1Busy
                  ? "rgba(14,37,68,.5)"
                  : "linear-gradient(135deg,rgba(59,158,255,.15),rgba(59,158,255,.04))",
                color:p2Busy || p1Busy ? "var(--qn-txt4)" : "var(--qn-blue)" }}>
              {p2Busy ? (
                <>
                  <span className="qn-busy-dot">●</span>
                  Generating Reevaluation &amp; Disposition...
                </>
              ) : (
                <>✦ Generate Reevaluation + Disposition  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, opacity:.6 }}>[Cmd+Enter]</span></>
              )}
            </button>

            {p2Error && (
              <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
                background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
                {p2Error}
              </div>
            )}
          </div>
        )}

        {/* ── DISPOSITION RESULT ───────────────────────────────────────────── */}
        {dispResult && (
          <div style={{ marginBottom:14, padding:"16px",
            background:"rgba(8,22,40,.5)",
            border:`1px solid ${dispColor(dispResult.disposition)}30`,
            borderRadius:14 }} className="print-body">
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:15, color:dispColor(dispResult.disposition) }}>
                Reevaluation &amp; Disposition
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.2)",
                borderRadius:4, padding:"2px 7px" }}>ACEP Guidelines</span>
            </div>
            <DispositionResult result={dispResult} copiedDisch={copiedDisch} setCopiedDisch={setCopiedDisch} />
          </div>
        )}

        {/* ── ACTION BAR ───────────────────────────────────────────────────── */}
        {hasAnyResult && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap",
            padding:"10px 14px", borderRadius:10,
            background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}
            className="no-print">
            <button onClick={copyNote}
              style={{ padding:"7px 16px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                transition:"all .15s",
                border:copied ? "1px solid rgba(61,255,160,.5)" : "1px solid var(--qn-bd)",
                background:copied ? "rgba(61,255,160,.1)" : "rgba(14,37,68,.6)",
                color:copied ? "var(--qn-green)" : "var(--qn-txt3)" }}>
              {copied ? "✓ Copied to clipboard" : "Copy Full Note"}
            </button>
            <button onClick={saveNote} disabled={saving || !hasAnyResult}
              style={{ padding:"7px 16px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:`1px solid ${savedNote ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
                background:savedNote ? "rgba(61,255,160,.1)" : "rgba(14,37,68,.6)",
                color:savedNote ? "var(--qn-green)" : "var(--qn-teal)",
                opacity: saving ? .6 : 1, transition:"all .15s" }}>
              {saving ? "Saving…" : savedNote ? "✓ Note Saved" : "Save Note"}
            </button>
            <button onClick={() => window.location.href = "/NoteHistory"}
              style={{ padding:"7px 16px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.6)",
                color:"var(--qn-txt3)", transition:"all .15s" }}>
              Note History →
            </button>
            <button onClick={() => window.print()}
              style={{ padding:"7px 16px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:"1px solid var(--qn-bd)", background:"rgba(14,37,68,.6)",
                color:"var(--qn-txt3)", transition:"all .15s" }}>
              Print / Export
            </button>
            {!confirmClear ? (
              <button onClick={() => setConfirmClear(true)}
                style={{ padding:"7px 16px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:"1px solid rgba(255,107,107,.3)", background:"rgba(14,37,68,.6)",
                  color:"var(--qn-coral)", transition:"all .15s" }}>
                New Encounter
              </button>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                padding:"5px 10px", borderRadius:7,
                background:"rgba(255,68,68,.1)", border:"1px solid rgba(255,68,68,.4)" }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-coral)" }}>Clear all data?</span>
                <button onClick={() => {
                  setCC(""); setVitals(""); setHpi(""); setRos(""); setExam("");
                  setLabs(""); setImaging(""); setNewVitals("");
                  setMdmResult(null); setDispResult(null);
                  setP1Error(null); setP2Error(null); setP2Open(false);
                  setConfirmClear(false);
                }}
                  style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:11,
                    border:"1px solid rgba(255,68,68,.5)", background:"rgba(255,68,68,.2)",
                    color:"var(--qn-red)" }}>Yes, clear</button>
                <button onClick={() => setConfirmClear(false)}
                  style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.6)",
                    color:"var(--qn-txt4)" }}>Cancel</button>
              </div>
            )}
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"flex-end",
              gap:8 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:.5 }}>
                C copy · P print
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 8px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-txt4)", letterSpacing:1.5 }} className="no-print">
            NOTRYA QUICKNOTE v10 · AMA/CMS 2023 E&M · ACEP CLINICAL POLICY ALIGNED ·
            AI OUTPUT REQUIRES PHYSICIAN REVIEW BEFORE CHARTING
          </div>
        )}
      </div>
    </div>
  );
}