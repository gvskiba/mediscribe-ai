import { useState, useRef, useEffect, useCallback } from "react";
import { useEncounterSummary } from "@/components/npi/useEncounterSummary";

// ─── SECTION CONFIG ────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "ddx",     label: "01  Impression / DDx",          icon: "🎯", priority: true  },
  { id: "mdm",     label: "02  Medical Decision Making",    icon: "⚖️", priority: true  },
  { id: "plan",    label: "03  Disposition + Plan",         icon: "📋", priority: true  },
  { id: "hpi",     label: "04  HPI",                        icon: "📝", priority: false },
  { id: "ros",     label: "05  ROS",                        icon: "🔍", priority: false },
  { id: "pe",      label: "06  Physical Exam",              icon: "🩺", priority: false },
  { id: "results", label: "07  Results",                    icon: "🧪", priority: false },
  { id: "meta",    label: "08  Encounter Metadata",         icon: "📊", priority: false },
];

// AMA 2023 MDM complexity levels
const COMPLEXITY = [
  { n: 1, label: "Straightforward", sub: "Self-limited / minor",               color: "#00e5c0" },
  { n: 2, label: "Low",             sub: "Stable chronic / uncomplicated acute",color: "#3b9eff" },
  { n: 3, label: "Moderate",        sub: "Exacerbation / systemic symptoms",    color: "#ffd93d" },
  { n: 4, label: "High",            sub: "Threat to life / severe exacerbation",color: "#ff6b6b" },
];

const DISP_OPTS = [
  { id: "discharge", label: "Discharge",  icon: "🏠" },
  { id: "admit",     label: "Admit",       icon: "🏥" },
  { id: "obs",       label: "Observation", icon: "👁️" },
  { id: "transfer",  label: "Transfer",    icon: "🚑" },
  { id: "lwbs",      label: "LWBS / AMA",  icon: "⚠️" },
];

// ─── SYSTEM LABEL MAPS ─────────────────────────────────────────────────────────
const ROS_SYS_LABELS = {
  const:   "Constitutional", heent:  "HEENT",          cv:    "Cardiovascular",
  resp:    "Respiratory",    gi:     "GI/Abdomen",      gu:    "Genitourinary",
  msk:     "MSK",            neuro:  "Neurological",    psych: "Psychiatric",
  skin:    "Skin",           endo:   "Endocrine",       heme:  "Heme/Lymph",
  allergy: "Allergic/Immunologic",
};
const PE_SYS_LABELS = {
  gen:   "General",        heent: "HEENT",         neck: "Neck",
  cv:    "Cardiovascular", resp:  "Respiratory",   abd:  "Abdomen",
  msk:   "MSK",            neuro: "Neurological",  skin: "Skin",
  psych: "Psychiatric",
};
const META_KEYS = ["_remainderNeg", "_remainderNormal", "_mode", "_visual"];

// ─── TOAST HELPER ─────────────────────────────────────────────────────────────
function showToast(setter, msg, type) {
  const id = Date.now();
  setter(p => [...p, { id, msg, type }]);
  setTimeout(() => setter(p => p.filter(t => t.id !== id)), 3000);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function buildRosText(rosState) {
  if (!rosState || !Object.keys(rosState).length) return "";
  const pos = [], neg = [];
  let remainderNeg = false;
  Object.entries(rosState).forEach(([sys, val]) => {
    if (sys === "_remainderNeg") { if (val) remainderNeg = true; return; }
    if (META_KEYS.includes(sys)) return;
    const label = ROS_SYS_LABELS[sys] || sys;
    if (val === "has-positives") pos.push(label);
    else if (val === "reviewed") neg.push(label);
  });
  if (!pos.length && !neg.length && !remainderNeg) return "";
  const parts = [];
  if (pos.length) parts.push(`Positive for: ${pos.join(", ")}.`);
  if (!pos.length && neg.length >= 5 && remainderNeg) {
    parts.push("All systems reviewed and negative.");
  } else if (!pos.length && neg.length >= 5) {
    parts.push(`All ${neg.length} reviewed systems negative.`);
  } else {
    if (neg.length) parts.push(`Reviewed and negative: ${neg.join(", ")}.`);
    if (remainderNeg) parts.push("All remaining systems reviewed and negative.");
  }
  return parts.join(" ");
}

function buildPeText(peState, peFindings) {
  if (!peState || !Object.keys(peState).length) return "";
  const abn = [], normal = [];
  let remainderNormal = false;
  let visualData = null;
  Object.entries(peState).forEach(([sys, val]) => {
    if (sys === "_remainderNormal") { if (val) remainderNormal = true; return; }
    if (sys === "_visual") { visualData = val; return; }
    if (META_KEYS.includes(sys)) return;
    const label = PE_SYS_LABELS[sys] || sys;
    if (val === "abnormal" || val === "mixed") abn.push({ id: sys, label });
    else if (val === "normal") normal.push(label);
  });
  if (!abn.length && !normal.length && !remainderNormal && !visualData) return "";
  const lines = [];
  if (visualData) {
    const vParts = [];
    if (visualData.appearance) vParts.push(visualData.appearance);
    if (visualData.notes) vParts.push(visualData.notes);
    if (vParts.length) lines.push(vParts.join(". ") + ".");
  }
  abn.forEach(({ id, label }) => {
    const sf = peFindings?.[id];
    const findings = sf ? Object.entries(sf.findings || {}).filter(([, v]) => v === "abnormal").map(([k]) => k.replace(/-/g, " ")).join(", ") : "";
    const note = sf?.note?.trim();
    let line = `${label}: ${findings || "abnormal findings noted"}`;
    if (note) line += ` — ${note}`;
    lines.push(line + ".");
  });
  if (normal.length) {
    if (!abn.length && normal.length >= 4 && remainderNormal) {
      lines.push("Exam within normal limits.");
    } else {
      lines.push(`Normal: ${normal.join(", ")}.`);
    }
  }
  if (remainderNormal && !(normal.length >= 4 && !abn.length)) {
    lines.push("Remaining exam within normal limits.");
  }
  return lines.join(" ");
}

const FL = { fontSize: 10, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 };
const TA = { width: "100%", padding: "10px 14px", boxSizing: "border-box", background: "rgba(255,255,255,.04)", border: "1px solid rgba(59,130,246,.18)", borderRadius: 8, color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.65, resize: "vertical", outline: "none" };

function KK({ ch }) {
  return <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--npi-blue)", background: "rgba(59,158,255,.12)", border: "1px solid rgba(59,158,255,.25)", borderRadius: 3, padding: "0 5px" }}>{ch}</kbd>;
}

function SectionHeader({ section, expanded, onToggle, complete, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${expanded ? "rgba(59,130,246,.2)" : "transparent"}`, marginBottom: expanded ? 16 : 0 }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", cursor: "pointer", userSelect: "none" }}>
        <span style={{ fontSize: 14 }}>{section.icon}</span>
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, color: section.priority ? "#fff" : "var(--npi-txt2)", flex: 1 }}>
          {section.label}
        </span>
        {complete && !expanded && (
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "var(--npi-teal)", background: "rgba(0,229,192,.1)", border: "1px solid rgba(0,229,192,.25)", borderRadius: 20, padding: "1px 8px" }}>✓</span>
        )}
        {children && !expanded && <span style={{ fontSize: 11, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>}
        <span style={{ color: "var(--npi-txt4)", fontSize: 12, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ClinicalNoteStudio({
  demo: demoProp, cc: ccProp, vitals: vitalsProp, medications: medicationsProp, allergies: allergiesProp,
  pmhSelected, pmhExtra, surgHx, famHx, socHx,
  rosState, peState, peFindings,
  esiLevel, registration: registrationProp, sdoh,
  consultsProp,
  patientData,
  onSave,
}) {
  const demo         = demoProp         || patientData?.demo         || {};
  const cc           = ccProp           || patientData?.cc           || {};
  const vitals       = vitalsProp       || patientData?.vitals       || {};
  const medications  = medicationsProp  || patientData?.medications  || [];
  const allergies    = allergiesProp    || patientData?.allergies    || [];
  const registration = registrationProp || patientData?.registration || {};
  const patientName  = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";

  // ── Shared encounter preamble — prepended to every AI call ────────────────
  const { buildPreamble } = useEncounterSummary({
    demo, cc, vitals, medications, allergies,
    pmhSelected, rosState, peState, peFindings,
    sdoh, esiLevel, registration,
  });

  // ── Section expand/collapse ─────────────────────────────────────────────
  const [expanded, setExpanded] = useState({ ddx: true, mdm: true, plan: true, hpi: false, ros: false, pe: false, results: false, meta: false });
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // ── DDx state ───────────────────────────────────────────────────────────
  const [primaryDx, setPrimaryDx] = useState(cc.text || "");
  const [icd10, setIcd10]         = useState("");
  const [differential, setDiff]   = useState([]);
  const [diffInput, setDiffInput] = useState("");
  const [icdLoading, setIcdLoading] = useState(false);
  const [toasts, setToasts]         = useState([]);

  // ── MDM state ───────────────────────────────────────────────────────────
  const [complexity,  setComplexity]  = useState(0);
  const [mdmProblems, setMdmProblems] = useState("");
  const [mdmData,     setMdmData]     = useState("");
  const [mdmRisk,     setMdmRisk]     = useState("");
  const [mdmLoading,  setMdmLoading]  = useState(false);

  // ── ALL-SECTIONS loading state ───────────────────────────────────────────
  const [allLoading, setAllLoading] = useState(false);

  // ── Plan state ──────────────────────────────────────────────────────────
  const [dispType, setDispType]     = useState("");
  const [planItems, setPlanItems]   = useState([]);
  const [planInput, setPlanInput]   = useState("");
  const [returnPrec, setReturnPrec] = useState("");
  const [followUp, setFollowUp]     = useState("");
  const [consults, setConsults]     = useState(() => {
    if (!consultsProp || !consultsProp.length) return "";
    return consultsProp.filter(c => c.service).map(c =>
      `${c.service}${c.question ? " — " + c.question.slice(0, 80) : ""}`
    ).join("\n");
  });
  const [consultsDirty, setConsultsDirty] = useState(false);

  useEffect(() => {
    if (consultsDirty || !consultsProp || !consultsProp.length) return;
    setConsults(consultsProp.filter(c => c.service).map(c =>
      `${c.service}${c.question ? " — " + c.question.slice(0, 80) : ""}`
    ).join("\n"));
  }, [consultsProp]); // eslint-disable-line

  // ── Supporting section content ───────────────────────────────────────────
  const [hpiText, setHpiText]         = useState(cc.hpi || "");
  const [listening, setListening]     = useState(false);
  const speechRef                     = useRef(null);
  const [rosText, setRosText]         = useState(() => buildRosText(rosState));
  const [peText, setPeText]           = useState(() => buildPeText(peState, peFindings));
  const [resultsText, setResultsText] = useState("");
  const [rosDirty, setRosDirty]       = useState(false);
  const [peDirty, setPeDirty]         = useState(false);

  useEffect(() => {
    if (!rosDirty) setRosText(buildRosText(rosState));
  }, [rosState]); // eslint-disable-line

  useEffect(() => {
    if (!peDirty) setPeText(buildPeText(peState, peFindings));
  }, [peState, peFindings]); // eslint-disable-line

  // ── Refs ─────────────────────────────────────────────────────────────────
  const refs = {
    ddx: useRef(null), mdm: useRef(null), plan: useRef(null), hpi: useRef(null),
    ros: useRef(null), pe: useRef(null), results: useRef(null), meta: useRef(null),
  };
  const scrollTo = useCallback((id) => {
    setExpanded(p => ({ ...p, [id]: true }));
    setTimeout(() => refs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }, []); // eslint-disable-line

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "d") { e.preventDefault(); scrollTo("ddx"); }
      if (e.key === "m") { e.preventDefault(); scrollTo("mdm"); }
      if (e.key === "g" && !e.shiftKey) { e.preventDefault(); generateMDM(); }
      if (e.key === "G" && e.shiftKey)  { e.preventDefault(); generateAllSections(); } // eslint-disable-line
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [scrollTo]); // eslint-disable-line

  const onMdmKeyDown = (e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !["INPUT","TEXTAREA"].includes(e.target.tagName)) setComplexity(n);
    if (e.metaKey && e.key === "Enter") { e.preventDefault(); generateMDM(); }
  };

  // ── AI: ICD-10 suggestion ────────────────────────────────────────────────
  const suggestICD = async () => {
    if (!primaryDx.trim()) return;
    setIcdLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          system: `You are an emergency medicine clinical documentation expert specializing in ICD-10-CM coding. Return ONLY valid JSON, no markdown.
For the given ED diagnosis, provide:
- icd10: most specific ICD-10-CM code with full description. Target maximum specificity:
  * Include 7th character where applicable (A = initial encounter, D = subsequent, S = sequela; default A for ED visits)
  * Include laterality (1=right, 2=left, 9=unspecified) for paired structures
  * Include displaced/non-displaced for fractures
  * Include type specificity (e.g. type 1 vs type 2, open vs closed)
  * Example: "S52.501A Unspecified fracture of lower end of right radius, initial encounter" not just "S52.5"
- differentials: array of 3 ED-relevant differential diagnoses
- mdm_problem: 1 sentence for AMA 2023 MDM Domain 1 (number/complexity of problems)
- plan_items: array of 3-4 key ED management steps
- return_precautions: 1 sentence listing condition-specific return-to-ED warning signs
Format: {"icd10":"...","differentials":["..."],"mdm_problem":"...","plan_items":["..."],"return_precautions":"..."}`,
          messages: [{ role: "user", content:
`${buildPreamble()}

ED Diagnosis: ${primaryDx}
Encode to maximum ICD-10-CM specificity. Use encounter type A (initial) unless the preamble indicates a subsequent encounter.` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      if (parsed.icd10)          setIcd10(parsed.icd10);
      if (parsed.differentials)  setDiff(parsed.differentials);
      if (parsed.mdm_problem && !mdmProblems) setMdmProblems(parsed.mdm_problem);
      if (parsed.plan_items?.length && planItems.length === 0) setPlanItems(parsed.plan_items);
      if (parsed.return_precautions && !returnPrec) setReturnPrec(parsed.return_precautions);
      showToast(setToasts, "Diagnosis applied — ICD-10, MDM, plan, and return precautions populated.", "success");
    } catch { showToast(setToasts, "ICD-10 lookup failed.", "error"); }
    finally  { setIcdLoading(false); }
  };
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      if (parsed.icd10)          setIcd10(parsed.icd10);
      if (parsed.differentials)  setDiff(parsed.differentials);
      if (parsed.mdm_problem && !mdmProblems) setMdmProblems(parsed.mdm_problem);
      if (parsed.plan_items?.length && planItems.length === 0) setPlanItems(parsed.plan_items);
      if (parsed.return_precautions && !returnPrec) setReturnPrec(parsed.return_precautions);
      showToast(setToasts, "Diagnosis applied — ICD-10, MDM, plan, and return precautions populated.", "success");
    } catch { showToast(setToasts, "ICD-10 lookup failed.", "error"); }
    finally  { setIcdLoading(false); }
  };

  // ── AI: MDM generation ───────────────────────────────────────────────────
  const generateMDM = useCallback(async () => {
    if (mdmLoading) return;
    setMdmLoading(true);
    const pmhList = Object.keys(pmhSelected||{}).filter(k => pmhSelected[k]).slice(0,5).join(", ") || "none";
    const vStr = vitals.bp ? `BP ${vitals.bp} HR ${vitals.hr||"—"} SpO2 ${vitals.spo2||"—"} T ${vitals.temp||"—"}` : "not documented";
    const META_SKIP = ["_remainderNeg","_remainderNormal","_mode","_visual"];
    const rosPos = Object.entries(rosState||{}).filter(([k,v])=>!META_SKIP.includes(k)&&v==="has-positives").map(([k])=>k).join(", ") || "none documented";
    const peAbnLines = Object.entries(peState||{}).filter(([k,v])=>!META_SKIP.includes(k)&&(v==="abnormal"||v==="mixed")).map(([k]) => {
      const sf = peFindings?.[k];
      const findings = sf ? Object.entries(sf.findings||{}).filter(([,v])=>v==="abnormal").map(([f])=>f.replace(/-/g," ")).join(", ") : "";
      const note = sf?.note?.trim() || "";
      return `${k}: ${findings||"abnormal"}${note?" ("+note+")":""}`;
    }).join("; ") || "none documented";
    const sdohFlags = Object.entries(sdoh||{}).filter(([,v])=>v&&v!=="unknown"&&v!==false).map(([k])=>k).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: `Generate AMA 2023 MDM documentation for an ED encounter. Return ONLY valid JSON with exactly three fields: {"problems":"...","data":"...","risk":"..."}
- problems (1-2 sentences): Number and complexity of problems addressed. Reference specific ROS positives and PE abnormals.
- data (1-2 sentences): Data reviewed and ordered — labs, imaging, ECG, external records. State what was interpreted independently by this provider.
- risk (1-2 sentences): Complexity of management and risk of complications, morbidity, or mortality. Name specific interventions and SDOH factors if present.`,
          messages: [{ role: "user", content:
`${buildPreamble()}

Primary DX: ${primaryDx||cc.text||"pending"}
HPI: ${cc.hpi?.slice(0,200)||"not documented"}
ROS positives: ${rosPos}
PE abnormals: ${peAbnLines}${sdohFlags ? "\nSDOH factors: " + sdohFlags : ""}` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      if (parsed.problems) setMdmProblems(parsed.problems);
      if (parsed.data)     setMdmData(parsed.data);
      if (parsed.risk)     setMdmRisk(parsed.risk);
      showToast(setToasts, "MDM domains generated", "success");
    } catch { showToast(setToasts, "MDM generation failed.", "error"); }
    finally  { setMdmLoading(false); }
  }, [mdmLoading, patientName, demo, cc, primaryDx, vitals, pmhSelected, medications, allergies, rosState, peState, peFindings, surgHx, sdoh]);

  // ── AI: Generate all empty sections in one pass ──────────────────────────
  // Fills HPI, all 3 MDM domains, and return precautions if they are currently empty.
  // ROS and PE are already auto-built from structured data — skipped here.
  // Does not overwrite any field the provider has already typed.
  const generateAllSections = useCallback(async () => {
    if (allLoading || mdmLoading) return;

    // Determine which outputs are actually needed
    const needsHpi  = !hpiText.trim();
    const needsMdm  = !mdmProblems.trim() || !mdmData.trim() || !mdmRisk.trim();
    const needsPrec = !returnPrec.trim();
    const needsIcd  = primaryDx.trim() && !icd10.trim();

    if (!needsHpi && !needsMdm && !needsPrec && !needsIcd) {
      showToast(setToasts, "All sections already filled — nothing to generate.", "success");
      return;
    }

    setAllLoading(true);

    // Expand sections that will be populated so the user sees the results
    setExpanded(p => ({
      ...p,
      hpi: needsHpi  ? true : p.hpi,
      mdm: needsMdm  ? true : p.mdm,
      plan: needsPrec ? true : p.plan,
    }));

    const META_SKIP = ["_remainderNeg","_remainderNormal","_mode","_visual"];
    const pmhList    = Object.keys(pmhSelected||{}).filter(k => pmhSelected[k]).slice(0,6).join(", ") || "none";
    const vStr       = vitals.bp ? `BP ${vitals.bp} HR ${vitals.hr||"—"} SpO2 ${vitals.spo2||"—"} T ${vitals.temp||"—"}` : "not documented";
    const rosPos     = Object.entries(rosState||{}).filter(([k,v])=>!META_SKIP.includes(k)&&v==="has-positives").map(([k])=>ROS_SYS_LABELS[k]||k).join(", ") || "none";
    const rosNeg     = Object.entries(rosState||{}).filter(([k,v])=>!META_SKIP.includes(k)&&v==="reviewed").map(([k])=>ROS_SYS_LABELS[k]||k).join(", ") || "";
    const peAbnLines = Object.entries(peState||{}).filter(([k,v])=>!META_SKIP.includes(k)&&(v==="abnormal"||v==="mixed")).map(([k]) => {
      const sf = peFindings?.[k];
      const findings = sf ? Object.entries(sf.findings||{}).filter(([,v])=>v==="abnormal").map(([f])=>f.replace(/-/g," ")).join(", ") : "";
      return `${PE_SYS_LABELS[k]||k}: ${findings||"abnormal"}`;
    }).join("; ") || "none";
    const sdohFlags  = Object.entries(sdoh||{}).filter(([,v])=>v&&v!=="unknown"&&v!==false).map(([k])=>k).join(", ");

    // Build a list of what to generate so the system prompt is precise
    const targets = [
      needsHpi  && "hpi",
      needsMdm  && !mdmProblems.trim() && "mdm_problems",
      needsMdm  && !mdmData.trim()     && "mdm_data",
      needsMdm  && !mdmRisk.trim()     && "mdm_risk",
      needsPrec && "return_precautions",
      needsIcd  && "icd10",
    ].filter(Boolean);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1400,
          system: `You are an emergency medicine documentation AI. Generate only the requested fields for an ED clinical note.
Return ONLY valid JSON with these keys (include only the keys listed in GENERATE):
- hpi: 2-4 sentence HPI using OLDCARTS structure, written in third person
- mdm_problems: 1-2 sentences, AMA 2023 Domain 1 — number and complexity of problems addressed
- mdm_data: 1-2 sentences, AMA 2023 Domain 2 — data reviewed, ordered, and independently interpreted
- mdm_risk: 1-2 sentences, AMA 2023 Domain 3 — risk of complications, management complexity
- return_precautions: 1 sentence, condition-specific ED return warning signs
- icd10: most specific ICD-10-CM code with full description — include 7th character (A=initial, D=subsequent, S=sequela), laterality, and displacement status where applicable

Do not include keys not in GENERATE. Return only the JSON object, no markdown, no commentary.`,
          messages: [{ role: "user", content:
`GENERATE: ${targets.join(", ")}

${buildPreamble()}

Diagnosis: ${primaryDx || cc.text || "pending"}
Onset / duration: ${cc.onset||"unknown"} / ${cc.duration||"unknown"}
Severity: ${cc.severity||"not documented"}
Quality: ${cc.quality||"not documented"}
Associated: ${cc.assoc||"not documented"}
Aggravating / relieving: ${cc.aggravate||"—"} / ${cc.relieve||"—"}
Surgical Hx: ${surgHx||"none"}
ROS positives: ${rosPos}
ROS negatives: ${rosNeg||"not documented"}
PE abnormals: ${peAbnLines}${sdohFlags ? "\nSDOH: " + sdohFlags : ""}` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);

      // Apply only to fields that were empty — never overwrite provider edits
      let count = 0;
      if (parsed.hpi                && needsHpi)                { setHpiText(parsed.hpi);               count++; }
      if (parsed.mdm_problems       && !mdmProblems.trim())     { setMdmProblems(parsed.mdm_problems);  count++; }
      if (parsed.mdm_data           && !mdmData.trim())         { setMdmData(parsed.mdm_data);          count++; }
      if (parsed.mdm_risk           && !mdmRisk.trim())         { setMdmRisk(parsed.mdm_risk);          count++; }
      if (parsed.return_precautions && needsPrec)               { setReturnPrec(parsed.return_precautions); count++; }
      if (parsed.icd10              && needsIcd)                { setIcd10(parsed.icd10);               count++; }

      showToast(setToasts, `${count} section${count !== 1 ? "s" : ""} generated — review before signing.`, "success");
    } catch {
      showToast(setToasts, "Full note generation failed — check connection.", "error");
    } finally {
      setAllLoading(false);
    }
  }, [
    allLoading, mdmLoading, hpiText, mdmProblems, mdmData, mdmRisk, returnPrec, icd10,
    primaryDx, patientName, demo, cc, vitals, registration,
    pmhSelected, medications, allergies, surgHx,
    rosState, peState, peFindings, sdoh,
  ]);

  // ── Completion checks ────────────────────────────────────────────────────
  const complete = {
    ddx:     !!primaryDx,
    mdm:     complexity > 0 && [mdmProblems, mdmData, mdmRisk].filter(Boolean).length >= 2,
    plan:    !!dispType,
    hpi:     !!hpiText,
    ros:     !!rosText,
    pe:      !!peText,
    results: !!resultsText,
    meta:    true,
  };
  const allDone = SECTIONS.slice(0, 3).every(s => complete[s.id]);

  // ── Derived: how many sections need generation ───────────────────────────
  const emptySectionCount = [
    !hpiText.trim(),
    !mdmProblems.trim() || !mdmData.trim() || !mdmRisk.trim(),
    !returnPrec.trim() && !!primaryDx.trim(),
  ].filter(Boolean).length;

  const addPlanItem = () => {
    const t = planInput.trim();
    if (!t) return;
    setPlanItems(p => [...p, t]);
    setPlanInput("");
  };

  // ── Voice dictation ──────────────────────────────────────────────────────
  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast(setToasts, "Speech recognition not supported in this browser.", "error"); return; }
    const rec = new SpeechRecognition();
    rec.continuous = true; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setHpiText(p => p ? p.trimEnd() + " " + transcript : transcript);
    };
    rec.onerror = () => { setListening(false); showToast(setToasts, "Dictation stopped — microphone error.", "error"); };
    rec.onend = () => setListening(false);
    speechRef.current = rec;
    rec.start();
    setListening(true);
  };
  const stopDictation = () => { speechRef.current?.stop(); setListening(false); };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 20, fontFamily: "'DM Sans',sans-serif", maxWidth: 1100, minHeight: "60vh" }}>

      {/* ── LEFT RAIL ──────────────────────────────────────────────────── */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--npi-txt4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Note sections</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, background: expanded[s.id] ? "rgba(59,158,255,.1)" : "transparent", border: `1px solid ${expanded[s.id] ? "rgba(59,158,255,.25)" : "transparent"}`, cursor: "pointer", textAlign: "left", transition: "all .12s" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: complete[s.id] ? "var(--npi-teal)" : "transparent", border: `1.5px solid ${complete[s.id] ? "var(--npi-teal)" : "var(--npi-bd)"}` }} />
              <span style={{ fontSize: 11, color: expanded[s.id] ? "var(--npi-blue)" : "var(--npi-txt3)", fontWeight: s.priority ? 600 : 400, flex: 1, lineHeight: 1.3 }}>{s.label.replace(/^\d+ /, "")}</span>
            </button>
          ))}

          {/* ── Keyboard shortcuts ── */}
          <div style={{ marginTop: 12, borderTop: "1px solid var(--npi-bd)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Keyboard</div>
            {[
              ["⌘D", "→ Impression"],
              ["⌘M", "→ MDM"],
              ["⌘G", "Generate MDM"],
              ["⌘⇧G", "Generate all"],
              ["1–4", "Set complexity"],
            ].map(([k, d]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--npi-txt4)" }}>
                <KK ch={k} />{d}
              </div>
            ))}
          </div>

          {/* ── Generate all button ── */}
          {emptySectionCount > 0 && (
            <button
              onClick={generateAllSections}
              disabled={allLoading || mdmLoading}
              style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(155,109,255,.4)", background: allLoading ? "rgba(155,109,255,.06)" : "rgba(155,109,255,.12)", color: allLoading ? "rgba(155,109,255,.45)" : "var(--npi-purple)", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, cursor: allLoading || mdmLoading ? "not-allowed" : "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              {allLoading
                ? <><span style={{ display: "inline-block", animation: "cns-spin .7s linear infinite" }}>⟳</span> Generating…</>
                : <>✦ Generate All <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, opacity: .7 }}>({emptySectionCount})</span></>
              }
              <style>{`@keyframes cns-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </button>
          )}
          {emptySectionCount === 0 && (
            <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 7, background: "rgba(0,229,192,.07)", border: "1px solid rgba(0,229,192,.2)", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--npi-teal)", textAlign: "center", letterSpacing: "0.05em" }}>
              ✓ All sections filled
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN NOTE BODY ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Patient header strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "rgba(13,31,60,.7)", border: "1px solid rgba(59,130,246,.15)", borderRadius: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, color: "#fff" }}>{patientName}</span>
          {demo.age && <span style={{ fontSize: 12, color: "var(--npi-txt3)" }}>{demo.age}y · {demo.sex||"—"}</span>}
          {cc.text && <span style={{ fontSize: 12, color: "var(--npi-teal)", background: "rgba(0,229,192,.1)", border: "1px solid rgba(0,229,192,.25)", borderRadius: 20, padding: "1px 10px" }}>CC: {cc.text}</span>}
          {esiLevel && <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: esiLevel<=2?"var(--npi-coral)":esiLevel===3?"var(--npi-orange)":"var(--npi-teal)", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "1px 8px" }}>ESI {esiLevel}</span>}
          {registration.room && <span style={{ fontSize: 11, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>Room {registration.room}</span>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {/* Generate All — compact header version */}
            {emptySectionCount > 0 && (
              <button
                onClick={generateAllSections}
                disabled={allLoading || mdmLoading}
                title={`Generate ${emptySectionCount} empty section${emptySectionCount > 1 ? "s" : ""} (⌘⇧G)`}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(155,109,255,.35)", background: allLoading ? "rgba(155,109,255,.05)" : "rgba(155,109,255,.12)", color: allLoading ? "rgba(155,109,255,.4)" : "var(--npi-purple)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: allLoading ? "not-allowed" : "pointer", transition: "all .15s" }}>
                {allLoading
                  ? <><span style={{ display: "inline-block", animation: "cns-spin .7s linear infinite" }}>⟳</span> Generating…</>
                  : <>✦ Generate All <KK ch="⌘⇧G" /></>
                }
              </button>
            )}
            {allDone && onSave && (
              <button onClick={onSave} style={{ padding: "5px 16px", borderRadius: 7, background: "var(--npi-teal)", color: "#050f1e", border: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Sign & Save ⌘⇧S
              </button>
            )}
          </div>
        </div>

        {/* ── 01 IMPRESSION / DDx ──────────────────────────────────────── */}
        <div ref={refs.ddx} style={{ background: "rgba(13,31,60,.5)", border: `1px solid ${expanded.ddx ? "rgba(255,107,107,.25)" : "rgba(59,130,246,.12)"}`, borderRadius: 10, padding: "0 16px", marginBottom: 8, transition: "border-color .2s" }}>
          <SectionHeader section={SECTIONS[0]} expanded={expanded.ddx} onToggle={() => toggle("ddx")} complete={complete.ddx}>
            {primaryDx && `${primaryDx}${icd10 ? "  ·  " + icd10 : ""}`}
          </SectionHeader>
          {expanded.ddx && (
            <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={FL}>Primary diagnosis</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={primaryDx} onChange={e => setPrimaryDx(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); suggestICD(); } }} placeholder="Enter working diagnosis…" style={{ ...TA, flex: 1, resize: "none", padding: "9px 12px" }} />
                  <button onClick={suggestICD} disabled={icdLoading || !primaryDx.trim()}
                    style={{ padding: "9px 16px", borderRadius: 7, background: icdLoading || !primaryDx.trim() ? "rgba(255,255,255,.04)" : "rgba(59,158,255,.15)", border: "1px solid rgba(59,158,255,.3)", color: "var(--npi-blue)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {icdLoading ? "⏳" : "✦ Apply Dx"}
                  </button>
                </div>
                {icd10 && <div style={{ marginTop: 5, fontSize: 11, color: "var(--npi-teal)", fontFamily: "'JetBrains Mono',monospace" }}>{icd10}</div>}
              </div>
              {differential.length > 0 && (
                <div>
                  <div style={FL}>Differential</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {differential.map((dx, i) => (
                      <div key={dx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--npi-txt4)", width: 16 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, color: "var(--npi-txt2)" }}>{dx}</span>
                        <button onClick={() => setPrimaryDx(dx)} style={{ marginLeft: "auto", fontSize: 10, color: "var(--npi-txt4)", background: "none", border: "none", cursor: "pointer" }}>↑ promote</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div style={FL}>Add to differential</div>
                <input value={diffInput} onChange={e => setDiffInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (diffInput.trim()) { setDiff(p => [...p, diffInput.trim()]); setDiffInput(""); } } }} placeholder="Add diagnosis to differential…" style={{ ...TA, resize: "none", padding: "9px 12px" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── 02 MDM ─────────────────────────────────────────────────────── */}
        <div ref={refs.mdm} tabIndex={-1} onKeyDown={onMdmKeyDown} style={{ background: "rgba(13,31,60,.5)", border: `1px solid ${expanded.mdm ? "rgba(255,107,107,.25)" : "rgba(59,130,246,.12)"}`, borderRadius: 10, padding: "0 16px", marginBottom: 8, outline: "none", transition: "border-color .2s" }}>
          <SectionHeader section={SECTIONS[1]} expanded={expanded.mdm} onToggle={() => toggle("mdm")} complete={complete.mdm}>
            {complexity > 0 && `${COMPLEXITY[complexity-1].label} — ${[mdmProblems, mdmData, mdmRisk].filter(Boolean).length}/3 domains`}
          </SectionHeader>
          {expanded.mdm && (
            <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={FL}>MDM complexity level <span style={{ textTransform: "none", letterSpacing: 0, color: "#64748b", marginLeft: 6 }}>(press 1–4 · AMA 2023)</span></div>
                <div style={{ display: "flex", gap: 6 }}>
                  {COMPLEXITY.map(c => (
                    <button key={c.n} onClick={() => setComplexity(prev => prev === c.n ? 0 : c.n)}
                      style={{ flex: 1, padding: "8px 6px", borderRadius: 7, border: `1px solid ${complexity === c.n ? c.color : "rgba(255,255,255,.1)"}`, background: complexity === c.n ? c.color + "22" : "rgba(255,255,255,.04)", color: complexity === c.n ? c.color : "var(--npi-txt4)", fontFamily: "'DM Sans',sans-serif", fontSize: 11, cursor: "pointer", transition: "all .12s", textAlign: "center" }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13 }}>{c.label}</div>
                      <div style={{ fontSize: 9, marginTop: 2, lineHeight: 1.25, opacity: .75 }}>{c.sub}</div>
                    </button>
                  ))}
                </div>
                {complexity > 0 && (
                  <div style={{ marginTop: 5, fontSize: 10, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>
                    To bill this level, document 2 of the 3 domains below.{" "}
                    <span style={{ color: [mdmProblems, mdmData, mdmRisk].filter(Boolean).length >= 2 ? "var(--npi-teal)" : "var(--npi-orange)" }}>
                      {[mdmProblems, mdmData, mdmRisk].filter(Boolean).length}/3 documented
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={generateMDM} disabled={mdmLoading}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 6, background: mdmLoading ? "transparent" : "rgba(0,229,192,.1)", border: "1px solid rgba(0,229,192,.3)", color: "var(--npi-teal)", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {mdmLoading ? "⏳ Generating…" : <><span>✦</span> AI Generate All 3 Domains <KK ch="⌘G" /></>}
                </button>
              </div>
              {[
                { key: "mdmProblems", set: setMdmProblems, label: "Domain 1 — Problems", sub: "Number and complexity of problems addressed", val: mdmProblems, ph: "e.g., One acute problem with systemic symptoms — new-onset chest pain, dyspnea on exertion, hemodynamically stable." },
                { key: "mdmData",     set: setMdmData,     label: "Domain 2 — Data",     sub: "Data reviewed, ordered, and independently interpreted", val: mdmData, ph: "e.g., ECG reviewed and interpreted by this provider — NSR, no ischemic changes. Troponin and BMP ordered and reviewed." },
                { key: "mdmRisk",     set: setMdmRisk,     label: "Domain 3 — Risk",     sub: "Complexity of management, risk of complications", val: mdmRisk, ph: "e.g., Moderate risk — prescription drug therapy, hospital admission for further evaluation and monitoring." },
              ].map(({ key, set, label, sub, val, ph }) => (
                <div key={key}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
                    <div style={FL}>{label}</div>
                    <span style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>{sub}</span>
                  </div>
                  <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={2} style={TA} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 03 DISPOSITION + PLAN ─────────────────────────────────────── */}
        <div ref={refs.plan} style={{ background: "rgba(13,31,60,.5)", border: `1px solid ${expanded.plan ? "rgba(0,229,192,.25)" : "rgba(59,130,246,.12)"}`, borderRadius: 10, padding: "0 16px", marginBottom: 8, transition: "border-color .2s" }}>
          <SectionHeader section={SECTIONS[2]} expanded={expanded.plan} onToggle={() => toggle("plan")} complete={complete.plan}>
            {dispType && DISP_OPTS.find(d => d.id === dispType)?.label}
          </SectionHeader>
          {expanded.plan && (
            <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={FL}>Disposition</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DISP_OPTS.map(d => (
                    <button key={d.id} onClick={() => setDispType(prev => prev === d.id ? "" : d.id)}
                      style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${dispType === d.id ? "var(--npi-teal)" : "rgba(255,255,255,.1)"}`, background: dispType === d.id ? "rgba(0,229,192,.12)" : "rgba(255,255,255,.04)", color: dispType === d.id ? "var(--npi-teal)" : "var(--npi-txt3)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: dispType === d.id ? 600 : 400, cursor: "pointer" }}>
                      {d.icon} {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={FL}>Plan items</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input value={planInput} onChange={e => setPlanInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPlanItem(); } }} placeholder="Add plan item and press Enter…" style={{ ...TA, flex: 1, resize: "none", padding: "9px 12px" }} />
                  <button onClick={addPlanItem} disabled={!planInput.trim()} style={{ padding: "9px 14px", borderRadius: 7, background: planInput.trim() ? "rgba(59,158,255,.15)" : "rgba(255,255,255,.04)", border: "1px solid rgba(59,158,255,.3)", color: "var(--npi-blue)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer" }}>+ Add</button>
                </div>
                {planItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", marginBottom: 3 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--npi-txt4)", width: 16 }}>{i+1}.</span>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--npi-txt2)" }}>{item}</span>
                    <button onClick={() => setPlanItems(p => p.filter((_,j) => j!==i))} style={{ background: "none", border: "none", color: "var(--npi-txt4)", cursor: "pointer", fontSize: 13 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={FL}>Consults</div>
                  <input value={consults} onChange={e => { setConsults(e.target.value); setConsultsDirty(true); }} placeholder="Consulting services…" style={{ ...TA, resize: "none", padding: "9px 12px" }} />
                </div>
                <div>
                  <div style={FL}>Follow-up</div>
                  <input value={followUp} onChange={e => setFollowUp(e.target.value)} placeholder="With PCP in 3 days…" style={{ ...TA, resize: "none", padding: "9px 12px" }} />
                </div>
              </div>
              <div>
                <div style={FL}>Return precautions</div>
                <textarea value={returnPrec} onChange={e => setReturnPrec(e.target.value)} placeholder="Return to ED for: worsening symptoms, fever >101°F, inability to tolerate PO…" rows={2} style={TA} />
              </div>
            </div>
          )}
        </div>

        {/* ── 04 HPI ───────────────────────────────────────────────────── */}
        <div ref={refs.hpi} style={{ background: "rgba(13,31,60,.4)", border: "1px solid rgba(59,130,246,.1)", borderRadius: 10, padding: "0 16px", marginBottom: 6 }}>
          <SectionHeader section={SECTIONS[3]} expanded={expanded.hpi} onToggle={() => toggle("hpi")} complete={complete.hpi}>
            {hpiText?.slice(0,80)}
          </SectionHeader>
          {expanded.hpi && (
            <div style={{ paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 6, gap: 8 }}>
                <span style={{ fontSize: 10, color: listening ? "var(--npi-coral)" : "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>{listening ? "● REC" : "voice input"}</span>
                <button onClick={listening ? stopDictation : startDictation}
                  style={{ padding: "4px 12px", borderRadius: 7, cursor: "pointer", background: listening ? "rgba(255,107,107,.15)" : "rgba(59,158,255,.1)", border: `1px solid ${listening ? "rgba(255,107,107,.4)" : "rgba(59,158,255,.3)"}`, color: listening ? "var(--npi-coral)" : "var(--npi-blue)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600 }}>
                  {listening ? "⏹ Stop" : "🎙 Dictate"}
                </button>
              </div>
              <textarea value={hpiText} onChange={e => setHpiText(e.target.value)} placeholder="History of present illness… or press Dictate to speak" rows={5} style={TA} />
            </div>
          )}
        </div>

        {/* ── 05 ROS ───────────────────────────────────────────────────── */}
        <div ref={refs.ros} style={{ background: "rgba(13,31,60,.4)", border: "1px solid rgba(59,130,246,.1)", borderRadius: 10, padding: "0 16px", marginBottom: 6 }}>
          <SectionHeader section={SECTIONS[4]} expanded={expanded.ros} onToggle={() => toggle("ros")} complete={complete.ros}>
            {rosText?.slice(0,80)}
          </SectionHeader>
          {expanded.ros && (
            <div style={{ paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                {!rosText ? <div style={{ fontSize: 11, color: "var(--npi-txt4)", fontStyle: "italic" }}>Auto-populated from ROS tab — pertinent findings only</div>
                  : <div style={{ fontSize: 10, color: rosDirty ? "rgba(239,159,39,.7)" : "rgba(0,229,192,.5)", fontFamily: "'JetBrains Mono',monospace" }}>{rosDirty ? "✎ manually edited" : "✓ auto-generated"}</div>}
                {rosDirty && <button onClick={() => { setRosText(buildRosText(rosState)); setRosDirty(false); }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "transparent", border: "1px solid var(--npi-bd)", color: "var(--npi-txt4)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>↺ Reset</button>}
              </div>
              <textarea value={rosText} onChange={e => { setRosText(e.target.value); setRosDirty(true); }} placeholder="Complete ROS in the ROS tab first, or enter pertinent findings here…" rows={3} style={TA} />
            </div>
          )}
        </div>

        {/* ── 06 PE ────────────────────────────────────────────────────── */}
        <div ref={refs.pe} style={{ background: "rgba(13,31,60,.4)", border: "1px solid rgba(59,130,246,.1)", borderRadius: 10, padding: "0 16px", marginBottom: 6 }}>
          <SectionHeader section={SECTIONS[5]} expanded={expanded.pe} onToggle={() => toggle("pe")} complete={complete.pe}>
            {peText?.slice(0,80)}
          </SectionHeader>
          {expanded.pe && (
            <div style={{ paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                {!peText ? <div style={{ fontSize: 11, color: "var(--npi-txt4)", fontStyle: "italic" }}>Auto-populated from PE tab — abnormals prominent, normals abbreviated</div>
                  : <div style={{ fontSize: 10, color: peDirty ? "rgba(239,159,39,.7)" : "rgba(0,229,192,.5)", fontFamily: "'JetBrains Mono',monospace" }}>{peDirty ? "✎ manually edited" : "✓ auto-generated"}</div>}
                {peDirty && <button onClick={() => { setPeText(buildPeText(peState, peFindings)); setPeDirty(false); }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "transparent", border: "1px solid var(--npi-bd)", color: "var(--npi-txt4)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>↺ Reset</button>}
              </div>
              <textarea value={peText} onChange={e => { setPeText(e.target.value); setPeDirty(true); }} placeholder="Complete PE in the Physical Exam tab first, or enter findings here…" rows={4} style={TA} />
            </div>
          )}
        </div>

        {/* ── 07 RESULTS ───────────────────────────────────────────────── */}
        <div ref={refs.results} style={{ background: "rgba(13,31,60,.4)", border: "1px solid rgba(59,130,246,.1)", borderRadius: 10, padding: "0 16px", marginBottom: 6 }}>
          <SectionHeader section={SECTIONS[6]} expanded={expanded.results} onToggle={() => toggle("results")} complete={complete.results}>
            {resultsText?.slice(0,80)}
          </SectionHeader>
          {expanded.results && (
            <div style={{ paddingBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--npi-txt4)", marginBottom: 8, fontStyle: "italic" }}>Reference labs and imaging by result name — do not paste raw values</div>
              <textarea value={resultsText} onChange={e => setResultsText(e.target.value)} placeholder="ECG: NSR, no ischemic changes. Troponin ×2 negative. CXR: no acute cardiopulmonary process. BMP: Na 138, K 4.1, Cr 0.9…" rows={4} style={TA} />
            </div>
          )}
        </div>

        {/* ── 08 METADATA ──────────────────────────────────────────────── */}
        <div ref={refs.meta} style={{ background: "rgba(13,31,60,.35)", border: "1px solid rgba(59,130,246,.08)", borderRadius: 10, padding: "0 16px", marginBottom: 6 }}>
          <SectionHeader section={SECTIONS[7]} expanded={expanded.meta} onToggle={() => toggle("meta")} complete={complete.meta} />
          {expanded.meta && (
            <div style={{ paddingBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {[
                  ["Patient", patientName], ["DOB", demo.dob || "—"], ["MRN", registration.mrn || "—"],
                  ["Room", registration.room || "—"], ["Allergies", allergies.length ? allergies.join(", ") : "NKDA"],
                  ["Meds", medications.length ? `${medications.length} listed` : "none"],
                  ["BP", vitals.bp || "—"], ["HR", vitals.hr || "—"],
                  ["SpO\u2082", vitals.spo2 ? vitals.spo2 + "%" : "—"], ["Temp", vitals.temp || "—"],
                  ["ESI", esiLevel || "—"], ["Encounter", new Date().toLocaleDateString()],
                ].map(([label, val]) => (
                  <div key={label} style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--npi-txt2)", fontFamily: "'DM Sans',sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
              {(pmhExtra || surgHx || famHx || socHx) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(59,130,246,.1)" }}>
                  {[["Additional PMH", pmhExtra], ["Surgical Hx", surgHx], ["Family Hx", famHx], ["Social Hx", socHx]].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "var(--npi-txt2)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
              {sdoh && Object.entries(sdoh).some(([, v]) => v && v !== "unknown" && v !== false) && (
                <div style={{ paddingTop: 8, borderTop: "1px solid rgba(59,130,246,.1)" }}>
                  <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>SDOH Factors</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(sdoh).filter(([, v]) => v && v !== "unknown" && v !== false).map(([k, v]) => (
                      <span key={k} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(245,200,66,.1)", border: "1px solid rgba(245,200,66,.25)", color: "var(--npi-gold)", fontFamily: "'DM Sans',sans-serif" }}>
                        {k.replace(/_/g, " ")}{typeof v === "string" && v !== "true" ? ": " + v : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sign bar ─────────────────────────────────────────────────── */}
        {onSave && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderTop: "1px solid rgba(59,130,246,.15)", marginTop: 4 }}>
            <button onClick={onSave} style={{ padding: "9px 22px", borderRadius: 8, background: "var(--npi-teal)", color: "#050f1e", border: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Sign &amp; Save Chart
            </button>
            <div style={{ fontSize: 11, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}><KK ch="⌘⇧S" /> sign</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SECTIONS.slice(0, 3).map(s => (
                <span key={s.id} style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: complete[s.id] ? "var(--npi-teal)" : "var(--npi-coral)", background: complete[s.id] ? "rgba(0,229,192,.08)" : "rgba(255,107,107,.08)", border: `1px solid ${complete[s.id] ? "rgba(0,229,192,.25)" : "rgba(255,107,107,.25)"}`, borderRadius: 5, padding: "2px 8px" }}>
                  {complete[s.id] ? "✓" : "○"} {s.label.replace(/^\d+ /, "")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Toasts ─────────────────────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", flexDirection: "column", gap: 6, zIndex: 300 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", background: "rgba(13,31,60,.95)", backdropFilter: "blur(16px)", border: `1px solid ${t.type === "success" ? "rgba(0,229,192,.4)" : "rgba(255,107,107,.4)"}`, color: t.type === "success" ? "var(--npi-teal)" : "var(--npi-coral)", boxShadow: "0 4px 20px rgba(0,0,0,.5)" }}>
              {t.type === "success" ? "\u2713" : "\u2715"} {t.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}