import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, Check, ArrowLeft, AlertTriangle,
  Home, Activity, Printer, FileText, Send, Mail, Code
} from "lucide-react";
import { toast } from "sonner";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#050f1e", surface: "#0b1d35", panel: "#0e2340",
  edge: "#162d4f", border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299",
  text: "#c8ddf0", bright: "#e8f4ff",
  teal: "#00d4bc", teal2: "#00a896", teal_dim: "#002e28",
  amber: "#f5a623", amber_dim: "#2a1500",
  red: "#ff5c6c", red_dim: "#2a0a0f",
  green: "#2ecc71", green_dim: "#001a10",
  purple: "#9b6dff", purple_dim: "#140a2a",
  rose: "#f472b6", rose_dim: "#2a0a1a",
  gold: "#fbbf24", gold_dim: "#2a1a00",
  blue: "#3b82f6", blue_dim: "#0d1e3a",
};

// ─── Disposition Tiles Config ────────────────────────────────────────────────
const DISP_TILES = [
  { id: "discharge_home",   label: "Discharge Home",    icon: "🏠", color: T.green,  rgb: "46,204,113",  desc: "Patient may safely return home" },
  { id: "admit_floor",      label: "Admit — Floor",     icon: "🏥", color: T.teal,   rgb: "0,212,188",   desc: "General medical/surgical floor" },
  { id: "admit_telemetry",  label: "Admit — Telemetry", icon: "📡", color: T.amber,  rgb: "245,166,35",  desc: "Continuous cardiac monitoring" },
  { id: "admit_icu",        label: "Admit — ICU",       icon: "🚨", color: T.red,    rgb: "255,92,108",  desc: "Critical care — high acuity" },
  { id: "observation",      label: "Observation",       icon: "🔭", color: T.purple, rgb: "155,109,255", desc: "Hospital outpatient status <48h" },
  { id: "transfer",         label: "Transfer",          icon: "🚑", color: T.rose,   rgb: "244,114,182", desc: "Higher level / specialty facility" },
  { id: "ama",              label: "AMA",               icon: "⚠️", color: T.gold,   rgb: "251,191,36",  desc: "Against Medical Advice" },
  { id: "expired",          label: "Expired",           icon: "🕯️",  color: T.dim,   rgb: "74,114,153",  desc: "Patient expired in ED" },
];

// ─── MDM Levels ──────────────────────────────────────────────────────────────
const MDM_LEVELS = [
  { code: "99281", label: "Straightforward" },
  { code: "99282", label: "Low Complexity" },
  { code: "99283", label: "Moderate Complexity" },
  { code: "99284", label: "High Complexity" },
  { code: "99285", label: "High + Threat to Life" },
];

// ─── Location Panel Fields by Disposition ────────────────────────────────────
const LOCATION_FIELDS = {
  discharge_home: [
    { section: "Follow-Up", color: T.teal, fields: [
      { id: "followUpWith",    label: "Follow-Up With",  type: "select",   options: ["Primary Care Physician","Cardiologist","Pulmonologist","Neurologist","Orthopedics","ED Return PRN","None — Asymptomatic"] },
      { id: "followUpTime",    label: "Timeframe",       type: "select",   options: ["24 hours","48–72 hours","1 week","2 weeks","4–6 weeks","PRN","None"] },
    ]},
    { section: "Return Precautions", color: T.red, fields: [
      { id: "returnPrecautions", label: "Return if any of the following:", type: "textarea", placeholder: "Worsening symptoms, fever >101°F, chest pain, difficulty breathing..." },
    ]},
    { section: "Discharge Instructions", color: T.purple, fields: [
      { id: "activity",     label: "Activity",    type: "select",   options: ["No restrictions","Light activity only","No lifting >10 lbs","Non-weight bearing","Bedrest"] },
      { id: "diet",         label: "Diet",        type: "select",   options: ["Regular","Low sodium","Low fat","Cardiac","Diabetic","Clear liquids","NPO until follow-up"] },
      { id: "workStatus",   label: "Work Status", type: "select",   options: ["May return to work today","Off work 24–48 hrs","Off work 1 week","Off work — per follow-up","Light duty only"] },
      { id: "newMeds",      label: "New Medications",  type: "textarea", placeholder: "List new prescriptions and instructions" },
    ]},
  ],
  admit_floor: [
    { section: "Admission Details", color: T.teal, fields: [
      { id: "admittingService",   label: "Admitting Service",   type: "select",   options: ["Internal Medicine","Cardiology","Pulmonology","Neurology","Surgery — General","Surgery — Orthopedic","Nephrology","Hematology","Oncology"] },
      { id: "acceptingPhysician", label: "Accepting Physician", type: "text",     placeholder: "Dr. Last Name, First Name" },
      { id: "admitDiagnosis",     label: "Admitting Diagnosis", type: "text",     placeholder: "Primary diagnosis driving admission" },
      { id: "bedRequest",         label: "Bed Request",         type: "select",   options: ["General Medical","Private","Semi-Private","Isolation — Airborne","Isolation — Contact","Isolation — Droplet","Bariatric"] },
    ]},
    { section: "Admission Orders", color: T.purple, fields: [
      { id: "admitCondition",  label: "Admit Condition",  type: "select", options: ["Stable","Guarded","Critical"] },
      { id: "codeStatus",      label: "Code Status",      type: "select", options: ["Full Code","DNR","DNI","DNR/DNI","Comfort Care Only"] },
      { id: "diet2",           label: "Diet",             type: "select", options: ["Regular","Cardiac","Diabetic","Renal","Low sodium","NPO","Clear liquids"] },
      { id: "dvt",             label: "DVT Prophylaxis",  type: "select", options: ["Enoxaparin 40 mg SC qDay","Heparin 5000 units SC TID","Sequential compression devices only","None — anticoagulated","Contraindicated"] },
      { id: "oxygen",          label: "Oxygen",           type: "select", options: ["Room air","NC 2 L/min","NC — titrate SpO2 ≥94%","HFNC","Venti-mask","BiPAP","Mechanical ventilation"] },
    ]},
    { section: "Pending / Follow-Up", color: T.amber, fields: [
      { id: "pendingLabs",     label: "Pending Labs",    type: "textarea", placeholder: "Cultures, serial troponins, coags..." },
      { id: "pendingImaging",  label: "Pending Imaging", type: "textarea", placeholder: "CTA, MRI, echo ordered..." },
      { id: "consults",        label: "Consults",        type: "textarea", placeholder: "Cardiology, Surgery, etc." },
    ]},
  ],
  admit_telemetry: [
    { section: "Telemetry Admission", color: T.amber, fields: [
      { id: "admittingService",   label: "Admitting Service",          type: "select", options: ["Cardiology","Internal Medicine","Pulmonology","Neurology"] },
      { id: "acceptingPhysician", label: "Accepting Physician",        type: "text",   placeholder: "Dr. Last Name, First Name" },
      { id: "admitDiagnosis",     label: "Admitting Diagnosis",        type: "text",   placeholder: "Primary cardiac diagnosis" },
      { id: "monitorIndication",  label: "Monitoring Indication",      type: "select", options: ["ACS rule-out","Arrhythmia","Syncope","Post-cardioversion","CHF monitoring","Electrolyte abnormality"] },
      { id: "codeStatus",         label: "Code Status",                type: "select", options: ["Full Code","DNR","DNI","DNR/DNI","Comfort Care Only"] },
    ]},
  ],
  admit_icu: [
    { section: "ICU Admission", color: T.red, fields: [
      { id: "criticalIndication",  label: "Critical Care Indication", type: "textarea", placeholder: "Mechanical ventilation, vasopressor support, septic shock..." },
      { id: "admittingService",    label: "ICU Service",              type: "select",   options: ["Medical ICU (MICU)","Surgical ICU (SICU)","Cardiac ICU (CICU)","Neuroscience ICU (NSICU)","Trauma ICU"] },
      { id: "acceptingPhysician",  label: "Accepting Intensivist",    type: "text",     placeholder: "Dr. Last Name, First Name" },
      { id: "admitDiagnosis",      label: "Primary ICU Diagnosis",    type: "text" },
      { id: "codeStatus",          label: "Code Status",              type: "select",   options: ["Full Code","DNR","DNI","DNR/DNI","Comfort Care Only"] },
    ]},
    { section: "Active Interventions", color: T.amber, fields: [
      { id: "activeDrips",  label: "Active Drips",            type: "textarea", placeholder: "Norepinephrine 0.2 mcg/kg/min, Propofol 10 mcg/kg/min..." },
      { id: "ventSettings", label: "Vent Settings",           type: "textarea", placeholder: "TV 400 mL, RR 14, FiO2 0.5, PEEP 8, Mode: AC/VC" },
      { id: "procedures",   label: "ED Procedures Performed", type: "textarea", placeholder: "Intubation, central line, arterial line, chest tube..." },
    ]},
  ],
  observation: [
    { section: "Observation Details", color: T.purple, fields: [
      { id: "obsDiagnosis",        label: "Observation Diagnosis",  type: "text",     placeholder: "Primary reason for observation" },
      { id: "acceptingPhysician",  label: "Accepting Physician",    type: "text",     placeholder: "Dr. Last Name, First Name" },
      { id: "expectedDuration",    label: "Expected Duration",      type: "select",   options: ["<12 hours","12–24 hours","24–48 hours",">48 hrs — convert to inpatient"] },
      { id: "obsIndication",       label: "Indication",             type: "select",   options: ["Chest pain — rule out ACS","Syncope workup","TIA — ABCD2 scoring","Asthma/COPD — monitoring","Abdominal pain — observation","Arrhythmia — rate control","Cellulitis — IV antibiotics","Other"] },
      { id: "cmsJustification",    label: "CMS Justification Note", type: "textarea", placeholder: "Describe medical uncertainty requiring observation..." },
    ]},
  ],
  transfer: [
    { section: "Transfer Details", color: T.rose, fields: [
      { id: "transferFacility",   label: "Receiving Facility",   type: "text",   placeholder: "Hospital name, city, state" },
      { id: "transferReason",     label: "Reason for Transfer",  type: "select", options: ["Higher level of care","Specialty not available","Burn center","Trauma center","Cardiac cath lab","Pediatric facility","Psychiatric facility","Patient preference","Rehabilitation"] },
      { id: "acceptingPhysician", label: "Accepting Physician",  type: "text",   placeholder: "Name, specialty, direct phone" },
      { id: "transportMode",      label: "Transport Mode",       type: "select", options: ["BLS ambulance","ALS ambulance","Air — helicopter","Air — fixed wing","Private vehicle"] },
      { id: "transferCondition",  label: "Transfer Condition",   type: "select", options: ["Stable","Guarded — stable for transfer","Critical — transfer with flight medic","Critical — ICU to ICU"] },
    ]},
    { section: "EMTALA Compliance", color: T.amber, fields: [
      { id: "emtalaStatus",     label: "Patient Status",       type: "select",   options: ["Stabilized for transfer","Unstable — transfer for higher care (document consent)"] },
      { id: "recordsSent",      label: "Records Sent",         type: "textarea", placeholder: "ED note, labs, imaging, medication reconciliation, EKG..." },
      { id: "acceptingConfirm", label: "Accepting Confirmation", type: "textarea", placeholder: "Spoken directly with Dr. ___ at ___ who verbally accepted the patient at ___" },
    ]},
  ],
  ama: [
    { section: "AMA Documentation", color: T.gold, fields: [
      { id: "capacity",      label: "Decision-Making Capacity", type: "select",   options: ["Patient has capacity — competent adult","Patient lacks capacity — guardian/proxy decision","Patient has capacity — minor (special circumstances)"] },
      { id: "risksExplained", label: "Risks of Leaving",       type: "textarea", placeholder: "Describe specific risks explained (e.g., risk of MI, stroke, rupture...)" },
      { id: "alternatives",   label: "Alternatives Offered",   type: "textarea", placeholder: "Describe alternatives discussed..." },
      { id: "amaForm",        label: "AMA Form",               type: "select",   options: ["Signed by patient","Patient refused to sign — documented","Witness present"] },
      { id: "witness",        label: "Witness Name",           type: "text",     placeholder: "Nurse or staff present" },
      { id: "returnInstruct", label: "Return Instructions",    type: "textarea", placeholder: "Patient instructed to return to ED if any concern..." },
    ]},
  ],
  expired: [
    { section: "Death Documentation", color: T.dim, fields: [
      { id: "timeOfDeath",          label: "Time of Death",            type: "text",   placeholder: "HH:MM" },
      { id: "pronouncingPhysician", label: "Pronouncing Physician",    type: "text",   placeholder: "Full name, MD/DO" },
      { id: "causeOfDeath",         label: "Immediate Cause of Death", type: "text",   placeholder: "e.g., Cardiac arrest secondary to..." },
      { id: "resuscitation",        label: "Resuscitation",            type: "select", options: ["Yes — ACLS protocol performed","No — DNR on file","No — Obvious death on arrival"] },
      { id: "familyNotified",       label: "Family Notified",          type: "select", options: ["Yes — family notified","Notification pending","No family / unable to reach"] },
      { id: "medicalExaminer",      label: "Medical Examiner",         type: "select", options: ["Yes — ME accepted","Yes — ME declined","Not required","Pending"] },
      { id: "organDonation",        label: "Organ Donation",           type: "select", options: ["OPO notified","Not eligible","Patient card — donor","Declined by family","Per ME restriction"] },
    ]},
  ],
};

// ─── Field Renderer ───────────────────────────────────────────────────────────
function FieldRow({ field, value, onChange }) {
  const inputStyle = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.text, fontSize: 12, outline: "none",
    padding: "6px 10px", width: "100%", fontFamily: "inherit",
  };
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>{field.label}</label>
      {field.type === "select" ? (
        <select style={{ ...inputStyle, height: 32 }} value={value || ""} onChange={e => onChange(field.id, e.target.value)}>
          <option value="">— Select —</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={value || ""} onChange={e => onChange(field.id, e.target.value)} placeholder={field.placeholder} />
      ) : (
        <input type="text" style={{ ...inputStyle, height: 32 }} value={value || ""} onChange={e => onChange(field.id, e.target.value)} placeholder={field.placeholder} />
      )}
    </div>
  );
}

// ─── AI Recommendation Panel ──────────────────────────────────────────────────
function AIRecommendationPanel({ note, selectedDisp, onAutoFill }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine physician AI. Based on the following clinical note, recommend the most appropriate ED disposition and provide evidence-based rationale.

Chief Complaint: ${note.chief_complaint || "N/A"}
Assessment: ${note.assessment || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Vital Signs: ${note.vital_signs ? JSON.stringify(note.vital_signs) : "N/A"}
Plan: ${note.plan || "N/A"}
Medications: ${note.medications?.join(", ") || "N/A"}

Provide:
1. Recommended disposition (one of: discharge_home, admit_floor, admit_telemetry, admit_icu, observation, transfer)
2. Confidence level (High/Moderate/Low)
3. Primary rationale (1-2 sentences)
4. Relevant risk score name and interpretation if applicable
5. Key guideline reference (ACEP, AHA, SSC, etc.)
6. 3-5 return precautions appropriate for this patient if discharge is recommended
7. Any safety flags or warnings (red-flag override conditions)`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_disposition: { type: "string" },
            confidence: { type: "string" },
            rationale: { type: "string" },
            risk_score: { type: "object", properties: { name: { type: "string" }, value: { type: "string" }, interpretation: { type: "string" } } },
            guideline: { type: "string" },
            return_precautions: { type: "array", items: { type: "string" } },
            safety_flags: { type: "array", items: { type: "object", properties: { severity: { type: "string" }, message: { type: "string" } } } },
          }
        }
      });
      setResult(res);
    } catch(e) { toast.error("AI recommendation failed"); } finally { setLoading(false); }
  };

  const confColor = { High: T.green, Moderate: T.amber, Low: T.red };
  const flagColor = { critical: { bg: T.red_dim, border: T.red, text: "#fca5a5", icon: "🚨" }, warning: { bg: T.amber_dim, border: T.amber, text: "#fcd34d", icon: "⚠️" }, info: { bg: T.teal_dim, border: T.teal, text: T.teal, icon: "ℹ️" } };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles style={{ width: 16, height: 16, color: T.teal }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Disposition Advisor</span>
      </div>

      {!result && !loading && (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🩺</div>
          <p style={{ fontSize: 12, color: T.dim, marginBottom: 16, lineHeight: 1.6 }}>Generate an AI-powered disposition recommendation based on clinical note data, risk scores, and ACEP guidelines.</p>
          <button onClick={generate} style={{ background: T.teal, color: T.bg, border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Analyze & Recommend
          </button>
        </div>
      )}

      {loading && (
        <div style={{ background: T.panel, border: `1px solid ${T.teal}40`, borderRadius: 12, padding: 24, textAlign: "center", background: `linear-gradient(90deg, ${T.panel}, rgba(0,212,188,0.05), ${T.panel})` }}>
          <Loader2 style={{ width: 28, height: 28, color: T.teal, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 12, color: T.teal }}>AI analyzing clinical data…</p>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto", flex: 1 }}>
          {/* Main Recommendation */}
          <div style={{ background: T.panel, border: `2px solid ${T.teal}50`, borderRadius: 12, padding: 14, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.teal}, ${T.purple})`, borderRadius: "12px 12px 0 0" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>
                  {DISP_TILES.find(t => t.id === result.recommended_disposition)?.icon} {DISP_TILES.find(t => t.id === result.recommended_disposition)?.label || result.recommended_disposition}
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: confColor[result.confidence] || T.dim, background: `${confColor[result.confidence] || T.dim}20`, border: `1px solid ${confColor[result.confidence] || T.dim}40`, borderRadius: 6, padding: "2px 8px" }}>
                {result.confidence} Confidence
              </span>
            </div>
            <p style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 10 }}>{result.rationale}</p>

            {result.risk_score?.name && (
              <div style={{ background: T.surface, borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Risk Score: </span>
                <span style={{ fontSize: 12, color: T.amber, fontWeight: 700 }}>{result.risk_score.name} {result.risk_score.value && `— ${result.risk_score.value}`}</span>
                {result.risk_score.interpretation && <p style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{result.risk_score.interpretation}</p>}
              </div>
            )}

            {result.guideline && (
              <div style={{ fontSize: 11, color: T.teal2, display: "flex", alignItems: "center", gap: 4 }}>
                <span>📚</span> <span>{result.guideline}</span>
              </div>
            )}
          </div>

          {/* Safety Flags */}
          {result.safety_flags?.length > 0 && result.safety_flags.map((flag, i) => {
            const s = flagColor[flag.severity] || flagColor.info;
            return (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}50`, borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: s.text }}>{s.icon} <strong>{flag.severity?.toUpperCase()}:</strong> {flag.message}</p>
              </div>
            );
          })}

          {/* Return Precautions */}
          {result.return_precautions?.length > 0 && (
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
              <p style={{ fontSize: 10, color: T.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>⚠️ Return Precautions</p>
              {result.return_precautions.map((p, i) => (
                <p key={i} style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>• {p}</p>
              ))}
              <button onClick={() => onAutoFill(result.return_precautions)} style={{ marginTop: 8, background: T.teal_dim, color: T.teal, border: `1px solid ${T.teal}40`, borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                Auto-fill Return Precautions →
              </button>
            </div>
          )}

          <button onClick={generate} style={{ background: "transparent", color: T.dim, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            ↻ Re-analyze
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Note Completion Ring ────────────────────────────────────────────────────
function CompletionRing({ note }) {
  const sections = [
    { label: "Chief Complaint", done: !!note.chief_complaint },
    { label: "HPI", done: !!note.history_of_present_illness },
    { label: "Physical Exam", done: !!note.physical_exam },
    { label: "Assessment", done: !!note.assessment },
    { label: "Plan", done: !!note.plan },
    { label: "Diagnoses", done: (note.diagnoses?.length || 0) > 0 },
    { label: "Medications", done: (note.medications?.length || 0) > 0 },
  ];
  const pct = sections.filter(s => s.done).length / sections.length;
  const circ = 2 * Math.PI * 32;
  const dash = circ * pct;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke={T.border} strokeWidth="7" />
          <circle cx="40" cy="40" r="32" fill="none" stroke={T.teal} strokeWidth="7"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
            strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.bright }}>{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 5 }}>
        {sections.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: s.done ? T.teal : T.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.done && <Check style={{ width: 10, height: 10, color: T.bg }} />}
            </div>
            <span style={{ fontSize: 11, color: s.done ? T.text : T.muted }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ERDispositionTab({ note, noteId, queryClient, finalizeMutation, exportNote, exportingFormat, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [selectedDisp, setSelectedDisp] = useState(null);
  const [fields, setFields] = useState({});
  const [mdmLevel, setMdmLevel] = useState("");
  const [attendingName, setAttendingName] = useState("");
  const [attestation, setAttestation] = useState("I have reviewed the history, examination, assessment, and plan documented in this note. I agree with the noted findings and this represents my independent evaluation of this patient.");
  const [saving, setSaving] = useState(false);

  const handleFieldChange = useCallback((id, val) => {
    setFields(f => ({ ...f, [id]: val }));
  }, []);

  const handleAutoFill = useCallback((precautions) => {
    setFields(f => ({ ...f, returnPrecautions: precautions.join("\n") }));
    toast.success("Return precautions auto-filled");
  }, []);

  const handleSaveAndFinalize = async () => {
    setSaving(true);
    try {
      const tile = DISP_TILES.find(t => t.id === selectedDisp);
      const dispositionText = [
        `DISPOSITION: ${tile?.label || selectedDisp || "Not selected"}`,
        mdmLevel ? `MDM LEVEL: ${MDM_LEVELS.find(m => m.code === mdmLevel)?.label} (${mdmLevel})` : "",
        "",
        ...Object.entries(fields).filter(([,v]) => v).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${v}`),
        attendingName ? `\nATTENDING: ${attendingName}` : "",
        attestation ? `\nATTESTATION: ${attestation}` : "",
      ].filter(Boolean).join("\n");

      await base44.entities.ClinicalNote.update(noteId, {
        disposition_plan: dispositionText,
        status: "finalized"
      });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      toast.success("Note signed and finalized");
    } catch(e) { toast.error("Failed to finalize note"); } finally { setSaving(false); }
  };

  const sectionDefs = selectedDisp ? (LOCATION_FIELDS[selectedDisp] || []) : [];

  return (
    <div style={{ background: T.bg, minHeight: "100%", fontFamily: "DM Sans, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ── Disposition Tiles ── */}
      <div style={{ padding: "14px 16px 0", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <p style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 10 }}>Select Disposition</p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
          {DISP_TILES.map(tile => {
            const isSelected = selectedDisp === tile.id;
            return (
              <motion.button key={tile.id} onClick={() => setSelectedDisp(tile.id)}
                whileTap={{ scale: 0.97 }}
                style={{
                  flexShrink: 0, minWidth: 110, padding: "12px 10px", borderRadius: 12,
                  border: `2px solid ${isSelected ? tile.color : T.border}`,
                  background: isSelected ? `rgba(${tile.rgb}, 0.07)` : T.panel,
                  boxShadow: isSelected ? `0 4px 20px rgba(${tile.rgb}, 0.18)` : "none",
                  transform: isSelected ? "translateY(-2px)" : "none",
                  cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5
                }}
              >
                <span style={{ fontSize: 22 }}>{tile.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? tile.color : T.text, lineHeight: 1.2 }}>{tile.label}</span>
                <span style={{ fontSize: 9, color: T.dim, lineHeight: 1.3 }}>{tile.desc}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Three-Column Content ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 12, padding: "12px 16px 16px", overflow: "hidden" }}>

        {/* LEFT: Location Panel */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {selectedDisp ? `${DISP_TILES.find(t => t.id === selectedDisp)?.icon} ${DISP_TILES.find(t => t.id === selectedDisp)?.label} Details` : "Disposition Details"}
            </p>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {!selectedDisp ? (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>☝️</div>
                <p style={{ fontSize: 12, color: T.dim }}>Select a disposition above to see relevant fields</p>
              </div>
            ) : (
              <div>
                {sectionDefs.map(sec => (
                  <div key={sec.section} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: sec.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${sec.color}30` }}>
                      {sec.section}
                    </p>
                    {sec.fields.map(f => (
                      <FieldRow key={f.id} field={f} value={fields[f.id]} onChange={handleFieldChange} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER: AI Panel */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.teal}, ${T.purple}, ${T.amber})` }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Recommendation</p>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            <AIRecommendationPanel note={note} selectedDisp={selectedDisp} onAutoFill={handleAutoFill} />
          </div>
        </div>

        {/* RIGHT: Actions Panel */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sign & Finalize</p>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

            {/* Completion Ring */}
            <CompletionRing note={note} />

            {/* MDM Level */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>MDM / E&M Level</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {MDM_LEVELS.map(m => (
                  <button key={m.code} onClick={() => setMdmLevel(m.code)}
                    style={{ textAlign: "left", padding: "6px 10px", borderRadius: 8, border: `1px solid ${mdmLevel === m.code ? T.teal : T.border}`, background: mdmLevel === m.code ? T.teal_dim : T.surface, color: mdmLevel === m.code ? T.teal : T.dim, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    <span style={{ fontWeight: 700, marginRight: 6, fontFamily: "monospace" }}>{m.code}</span>{m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Provider Signature</p>
              <input type="text" placeholder="Attending Physician — Full Name, MD/DO/NP/PA" value={attendingName} onChange={e => setAttendingName(e.target.value)}
                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11, padding: "7px 10px", outline: "none", fontFamily: "inherit", marginBottom: 8 }} />
              <textarea value={attestation} onChange={e => setAttestation(e.target.value)}
                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 10, padding: "7px 10px", outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 72, lineHeight: 1.5 }} />
            </div>

            {/* Sign Button */}
            <button onClick={handleSaveAndFinalize} disabled={saving}
              style={{ width: "100%", background: saving ? T.teal2 : T.teal, color: T.bg, border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12, transition: "all 0.2s", boxShadow: `0 0 20px rgba(0,212,188,0.2)` }}>
              {saving ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Check style={{ width: 16, height: 16 }} />}
              {saving ? "Signing…" : "Sign & Finalize Note"}
            </button>

            {/* Quick Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Quick Actions</p>
              {[
                { label: "🖨️  Print Discharge Instructions", action: () => window.print() },
                { label: "📄  Export Full Note (PDF)", action: () => exportNote?.("pdf") },
                { label: "📄  Export Full Note (Text)", action: () => exportNote?.("text") },
              ].map(a => (
                <button key={a.label} onClick={a.action}
                  style={{ textAlign: "left", padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.teal}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", gap: 8 }}>
          <TabDataPreview tabId="disposition_plan" note={note} />
          <ClinicalNotePreviewButton note={note} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isFirstTab() && (
            <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              <ArrowLeft style={{ width: 13, height: 13 }} /> Back
            </button>
          )}
          {!isLastTab() && (
            <button onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.teal}40`, background: T.teal_dim, color: T.teal, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              Next <ArrowLeft style={{ width: 13, height: 13, transform: "rotate(180deg)" }} />
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}