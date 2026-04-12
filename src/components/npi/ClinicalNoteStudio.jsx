import { useState, useRef, useEffect, useCallback } from "react";

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

// AMA 2023 MDM complexity levels — matches CPT E/M table exactly (4 levels, not 5)
const COMPLEXITY = [
  { n: 1, label: "Straightforward", sub: "Self-limited / minor",               color: "#00e5c0" },
  { n: 2, label: "Low",             sub: "Stable chronic / uncomplicated acute",color: "#3b9eff" },
  { n: 3, label: "Moderate",        sub: "Exacerbation / systemic symptoms",    color: "#ffd93d" },
  { n: 4, label: "High",            sub: "Threat to life / severe exacerbation",color: "#ff6b6b" },
];

const DISP_OPTS = [
  { id: "discharge", label: "Discharge",   icon: "🏠" },
  { id: "admit",     label: "Admit",        icon: "🏥" },
  { id: "obs",       label: "Observation",  icon: "👁️" },
  { id: "transfer",  label: "Transfer",     icon: "🚑" },
  { id: "lwbs",      label: "LWBS / AMA",   icon: "⚠️" },
];

// ─── SYSTEM LABEL MAPS ────────────────────────────────────────────────────────
// Mirror the IDs in ROSTab.jsx / PETab.jsx — used for prose note generation.
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

// ─── TOAST HELPER ────────────────────────────────────────────────────────────
// Module-scope so it can be used inside useCallback without re-render issues.
// Components call: showToast(setToasts, "msg", "success"|"error")
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
    // All systems reviewed negative — single aggregate sentence
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
    const findings = sf
      ? Object.entries(sf.findings || {})
          .filter(([, v]) => v === "abnormal")
          .map(([k]) => k.replace(/-/g, " "))
          .join(", ")
      : "";
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

const FL = { fontSize: 10, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 };
const TA = { width: "100%", padding: "10px 14px", boxSizing: "border-box", background: "rgba(255,255,255,.04)", border: "1px solid rgba(59,130,246,.18)", borderRadius: 8, color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.65, resize: "vertical", outline: "none" };
function KK({ ch }) {
  return <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--npi-blue)", background: "rgba(59,158,255,.12)", border: "1px solid rgba(59,158,255,.25)", borderRadius: 3, padding: "0 5px" }}>{ch}</kbd>;
}
function SectionHeader({ section, expanded, onToggle, complete, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${expanded ? "rgba(59,130,246,.2)" : "transparent"}`, marginBottom: expanded ? 16 : 0 }}>
      <div
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", cursor: "pointer", userSelect: "none" }}
      >
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
  demo, cc, vitals, medications, allergies,
  pmhSelected, pmhExtra, surgHx, famHx, socHx,
  rosState, peState, peFindings,
  esiLevel, registration, sdoh,
  consultsProp,
  onSave,
}) {
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";

  // ── Section expand/collapse ─────────────────────────────────────────────
  const [expanded, setExpanded] = useState({ ddx: true, mdm: true, plan: true, hpi: false, ros: false, pe: false, results: false, meta: false });
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // ── DDx state ───────────────────────────────────────────────────────────
  const [primaryDx, setPrimaryDx]   = useState(cc.text || "");
  const [icd10, setIcd10]           = useState("");
  const [differential, setDiff]     = useState([]);
  const [diffInput, setDiffInput]   = useState("");
  const [icdLoading, setIcdLoading] = useState(false);
  const [toasts,     setToasts]     = useState([]);

  // ── MDM state — AMA 2023 three domains ──────────────────────────────────────
  // AMA requires documentation of 2 of 3 domains to support the selected level.
  const [complexity,  setComplexity]  = useState(0);
  const [mdmProblems, setMdmProblems] = useState(""); // Domain 1: Number & complexity of problems
  const [mdmData,     setMdmData]     = useState(""); // Domain 2: Amount/complexity of data reviewed
  const [mdmRisk,     setMdmRisk]     = useState(""); // Domain 3: Risk of complications / management
  const [mdmLoading,  setMdmLoading]  = useState(false);

  // ── Plan state ──────────────────────────────────────────────────────────
  const [dispType, setDispType]         = useState("");
  const [planItems, setPlanItems]       = useState([]);
  const [planInput, setPlanInput]       = useState("");
  const [returnPrec, setReturnPrec]     = useState("");
  const [followUp, setFollowUp]         = useState("");
  const [consults, setConsults]         = useState(() => {
    if (!consultsProp || !consultsProp.length) return "";
    return consultsProp.filter(c => c.service).map(c =>
      `${c.service}${c.question ? " — " + c.question.slice(0, 80) : ""}`
    ).join("\n");
  });
  const [consultsDirty, setConsultsDirty] = useState(false);

  // Re-sync consults when new consults are added upstream, unless manually edited
  useEffect(() => {
    if (consultsDirty || !consultsProp || !consultsProp.length) return;
    setConsults(consultsProp.filter(c => c.service).map(c =>
      `${c.service}${c.question ? " — " + c.question.slice(0, 80) : ""}`
    ).join("\n"));
  }, [consultsProp]); // eslint-disable-line

  // ── Supporting section content (auto + editable) ─────────────────────────
  const [hpiText, setHpiText]           = useState(cc.hpi || "");
  const [listening,  setListening]      = useState(false);
  const speechRef                       = useRef(null);
  const [rosText, setRosText]           = useState(() => buildRosText(rosState));
  const [peText, setPeText]             = useState(() => buildPeText(peState, peFindings));
  const [resultsText, setResultsText]   = useState("");
  // Dirty flags — prevent auto-sync from overwriting manual edits
  const [rosDirty, setRosDirty] = useState(false);
  const [peDirty,  setPeDirty]  = useState(false);

  // Re-sync when source data changes (e.g. doctor goes back to ROS/PE tab)
  // Only fires if the provider hasn't manually edited the text in the note.
  useEffect(() => {
    if (!rosDirty) setRosText(buildRosText(rosState));
  }, [rosState]); // eslint-disable-line
  useEffect(() => {
    if (!peDirty) setPeText(buildPeText(peState, peFindings));
  }, [peState, peFindings]); // eslint-disable-line

  // ── Refs for keyboard scroll-to ─────────────────────────────────────────
  const refs = { ddx: useRef(null), mdm: useRef(null), plan: useRef(null), hpi: useRef(null), ros: useRef(null), pe: useRef(null), results: useRef(null), meta: useRef(null) };
  const scrollTo = useCallback((id) => {
    setExpanded(p => ({ ...p, [id]: true }));
    setTimeout(() => refs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "d") { e.preventDefault(); scrollTo("ddx"); }
      if (e.key === "m") { e.preventDefault(); scrollTo("mdm"); }
      if (e.key === "g") { e.preventDefault(); generateMDM(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [scrollTo]);

  // 1–4 keys set complexity when MDM section is focused
  const onMdmKeyDown = (e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !["INPUT","TEXTAREA"].includes(e.target.tagName)) {
      setComplexity(n);
    }
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
          system: `You are an emergency medicine clinical documentation expert. Return ONLY valid JSON, no markdown.
For the given ED diagnosis, provide:
- icd10: most specific ICD-10-CM code with description (e.g. "I21.9 Acute MI, unspecified")
- differentials: array of 3 ED-relevant differential diagnoses
- mdm_problem: 1 sentence for AMA 2023 MDM Domain 1 (number/complexity of problems)
- plan_items: array of 3-4 key ED management steps
- return_precautions: 1 sentence listing condition-specific return-to-ED warning signs
Format: {"icd10":"...","differentials":["..."],"mdm_problem":"...","plan_items":["..."],"return_precautions":"..."}`,
          messages: [{ role: "user", content: `ED Diagnosis: ${primaryDx}\nPatient: ${demo.age||"?"}y ${demo.sex||""}, CC: ${cc.text||primaryDx}` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      if (parsed.icd10)        setIcd10(parsed.icd10);
      if (parsed.differentials) setDiff(parsed.differentials);
      // Downstream population — only pre-fill if field is currently empty
      if (parsed.mdm_problem && !mdmProblems) setMdmProblems(parsed.mdm_problem);
      if (parsed.plan_items?.length && planItems.length === 0) setPlanItems(parsed.plan_items);
      if (parsed.return_precautions && !returnPrec) setReturnPrec(parsed.return_precautions);
      showToast(setToasts, "Diagnosis applied — ICD-10, MDM, plan, and return precautions populated.", "success");
    } catch { showToast(setToasts, "ICD-10 lookup failed.", "error"); }
    finally  { setIcdLoading(false); }
  };

  // ── AI: MDM generation — three AMA 2023 domains ──────────────────────────────
  const generateMDM = useCallback(async () => {
    if (mdmLoading) return;
    setMdmLoading(true);
    const pmhList = Object.keys(pmhSelected||{}).filter(k => pmhSelected[k]).slice(0,5).join(", ") || "none";
    const vStr = vitals.bp ? `BP ${vitals.bp} HR ${vitals.hr||"—"} SpO2 ${vitals.spo2||"—"} T ${vitals.temp||"—"}` : "not documented";
    // ROS positives — relevant to Domain 1 (problem complexity)
    const META_SKIP = ["_remainderNeg","_remainderNormal","_mode","_visual"];
    const rosPos = Object.entries(rosState||{})
      .filter(([k,v])=>!META_SKIP.includes(k)&&v==="has-positives")
      .map(([k])=>k).join(", ") || "none documented";
    // PE abnormals with finding text — relevant to Domain 1 and 2
    const peAbnLines = Object.entries(peState||{})
      .filter(([k,v])=>!META_SKIP.includes(k)&&(v==="abnormal"||v==="mixed"))
      .map(([k]) => {
        const sf = peFindings?.[k];
        const findings = sf ? Object.entries(sf.findings||{}).filter(([,v])=>v==="abnormal").map(([f])=>f.replace(/-/g," ")).join(", ") : "";
        const note = sf?.note?.trim() || "";
        return `${k}: ${findings||"abnormal"}${note?" ("+note+")":""}`;
      }).join("; ") || "none documented";
    // SDOH complexity factors — can elevate MDM risk domain
    const sdohFlags = Object.entries(sdoh||{}).filter(([,v])=>v&&v!=="unknown"&&v!==false).map(([k])=>k).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: `Generate AMA 2023 MDM documentation for an ED encounter. Return ONLY valid JSON with exactly three fields: {"problems":"...","data":"...","risk":"..."}
- problems (1-2 sentences): Number and complexity of problems addressed. Reference specific ROS positives and PE abnormals. State acute vs chronic, stable vs exacerbation.
- data (1-2 sentences): Data reviewed and ordered — labs, imaging, ECG, external records. State what was interpreted independently by this provider.
- risk (1-2 sentences): Complexity of management and risk of complications, morbidity, or mortality. Name specific interventions and their risk level. Include SDOH factors that elevate complexity if present.`,
          messages: [{ role: "user", content:
`Patient: ${patientName}, ${demo.age||"?"}y ${demo.sex||""}
CC: ${cc.text||"unspecified"}
Primary DX: ${primaryDx||cc.text||"pending"}
HPI: ${cc.hpi?.slice(0,200)||"not documented"}
Vitals: ${vStr}
PMH: ${pmhList}
Surgical Hx: ${surgHx||"none"}
Meds: ${(medications||[]).slice(0,5).join(", ")||"none"}
Allergies: ${(allergies||[]).join(", ")||"NKDA"}
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

  // ── Section dots for left rail ───────────────────────────────────────────
  const allDone = SECTIONS.slice(0,3).every(s => complete[s.id]);

  const addPlanItem = () => {
    const t = planInput.trim();
    if (!t) return;
    setPlanItems(p => [...p, t]);
    setPlanInput("");
  };

  // ── Voice dictation (Web Speech API) — HPI only ──────────────────────────
  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(setToasts, "Speech recognition not supported in this browser.", "error");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript).join(" ");
      setHpiText(p => p ? p.trimEnd() + " " + transcript : transcript);
    };
    rec.onerror = () => {
      setListening(false);
      showToast(setToasts, "Dictation stopped — microphone error.", "error");
    };
    rec.onend = () => setListening(false);
    speechRef.current = rec;
    rec.start();
    setListening(true);
  };
  const stopDictation = () => {
    speechRef.current?.stop();
    setListening(false);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 20, fontFamily: "'DM Sans',sans-serif", maxWidth: 1100, minHeight: "60vh" }}>

      {/* ── LEFT RAIL ──────────────────────────────────────────────────── */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--npi-txt4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Note sections</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, background: expanded[s.id] ? "rgba(59,158,255,.1)" : "transparent", border: `1px solid ${expanded[s.id] ? "rgba(59,158,255,.25)" : "transparent"}`, cursor: "pointer", textAlign: "left", transition: "all .12s" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: complete[s.id] ? "var(--npi-teal)" : "transparent", border: `1.5px solid ${complete[s.id] ? "var(--npi-teal)" : "var(--npi-bd)"}` }} />
              <span style={{ fontSize: 11, color: expanded[s.id] ? "var(--npi-blue)" : "var(--npi-txt3)", fontWeight: s.priority ? 600 : 400, flex: 1, lineHeight: 1.3 }}>{s.label.replace(/^\d+ /, "")}</span>
            </button>
          ))}
          <div style={{ marginTop: 12, borderTop: "1px solid var(--npi-bd)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Keyboard</div>
            {[["⌘D","→ Impression"],["⌘M","→ MDM"],["⌘G","Generate MDM"],["1–4","Set complexity"]].map(([k,d]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--npi-txt4)" }}>
                <KK ch={k} />{d}
              </div>
            ))}
          </div>
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
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
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
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={diffInput} onChange={e => setDiffInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (diffInput.trim()) { setDiff(p => [...p, diffInput.trim()]); setDiffInput(""); } } }} placeholder="Add diagnosis to differential…" style={{ ...TA, flex: 1, resize: "none", padding: "9px 12px" }} />
                </div>
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

              {/* Complexity level */}
              <div>
                <div style={FL}>
                  MDM complexity level
                  <span style={{ textTransform: "none", letterSpacing: 0, color: "#64748b", marginLeft: 6 }}>
                    (press 1–4 · AMA 2023 Table)
                  </span>
                </div>
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
                    To bill this level, document 2 of the 3 domains below.
                    {" "}<span style={{ color: [mdmProblems, mdmData, mdmRisk].filter(Boolean).length >= 2 ? "var(--npi-teal)" : "var(--npi-orange)" }}>
                      {[mdmProblems, mdmData, mdmRisk].filter(Boolean).length}/3 documented
                    </span>
                  </div>
                )}
              </div>

              {/* AI generate row */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={generateMDM} disabled={mdmLoading}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 6, background: mdmLoading ? "transparent" : "rgba(0,229,192,.1)", border: "1px solid rgba(0,229,192,.3)", color: "var(--npi-teal)", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {mdmLoading ? "⏳ Generating…" : <><span>✦</span> AI Generate All 3 Domains <KK ch="⌘G" /></>}
                </button>
              </div>

              {/* Domain 1 — Problems */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
                  <div style={FL}>Domain 1 — Problems</div>
                  <span style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>Number and complexity of problems addressed</span>
                </div>
                <textarea value={mdmProblems} onChange={e => setMdmProblems(e.target.value)}
                  placeholder="e.g., One acute problem with systemic symptoms — new-onset chest pain, dyspnea on exertion, hemodynamically stable. No prior cardiac history."
                  rows={2} style={TA} />
              </div>

              {/* Domain 2 — Data */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
                  <div style={FL}>Domain 2 — Data</div>
                  <span style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>Data reviewed, ordered, and independently interpreted</span>
                </div>
                <textarea value={mdmData} onChange={e => setMdmData(e.target.value)}
                  placeholder="e.g., ECG reviewed and interpreted by this provider — NSR, no ischemic changes. Troponin and BMP ordered and reviewed. CXR interpreted — no acute cardiopulmonary process."
                  rows={2} style={TA} />
              </div>

              {/* Domain 3 — Risk */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
                  <div style={FL}>Domain 3 — Risk</div>
                  <span style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>Complexity of management, risk of complications or mortality</span>
                </div>
                <textarea value={mdmRisk} onChange={e => setMdmRisk(e.target.value)}
                  placeholder="e.g., Moderate risk — prescription drug therapy (anticoagulation), hospital admission for further evaluation and monitoring. Risk of major adverse cardiac event without timely intervention."
                  rows={2} style={TA} />
              </div>
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
                <span style={{ fontSize: 10, color: listening ? "var(--npi-coral)" : "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>
                  {listening ? "● REC" : "voice input"}
                </span>
                <button onClick={listening ? stopDictation : startDictation}
                  title={listening ? "Stop dictation" : "Start voice dictation"}
                  style={{ padding: "4px 12px", borderRadius: 7, cursor: "pointer",
                    background: listening ? "rgba(255,107,107,.15)" : "rgba(59,158,255,.1)",
                    border: `1px solid ${listening ? "rgba(255,107,107,.4)" : "rgba(59,158,255,.3)"}`,
                    color: listening ? "var(--npi-coral)" : "var(--npi-blue)",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
                    animation: listening ? "pulse 1.5s ease-in-out infinite" : "none" }}>
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
                {!rosText
                  ? <div style={{ fontSize: 11, color: "var(--npi-txt4)", fontStyle: "italic" }}>Auto-populated from ROS tab — pertinent findings only</div>
                  : <div style={{ fontSize: 10, color: rosDirty ? "rgba(239,159,39,.7)" : "rgba(0,229,192,.5)", fontFamily: "'JetBrains Mono',monospace" }}>{rosDirty ? "✎ manually edited" : "✓ auto-generated"}</div>
                }
                {rosDirty && (
                  <button onClick={() => { setRosText(buildRosText(rosState)); setRosDirty(false); }}
                    style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "transparent", border: "1px solid var(--npi-bd)", color: "var(--npi-txt4)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    ↺ Reset
                  </button>
                )}
              </div>
              <textarea value={rosText} onChange={e => { setRosText(e.target.value); setRosDirty(true); }}
                placeholder="Complete ROS in the ROS tab first, or enter pertinent findings here…" rows={3} style={TA} />
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
                {!peText
                  ? <div style={{ fontSize: 11, color: "var(--npi-txt4)", fontStyle: "italic" }}>Auto-populated from PE tab — abnormals prominent, normals abbreviated</div>
                  : <div style={{ fontSize: 10, color: peDirty ? "rgba(239,159,39,.7)" : "rgba(0,229,192,.5)", fontFamily: "'JetBrains Mono',monospace" }}>{peDirty ? "✎ manually edited" : "✓ auto-generated"}</div>
                }
                {peDirty && (
                  <button onClick={() => { setPeText(buildPeText(peState, peFindings)); setPeDirty(false); }}
                    style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "transparent", border: "1px solid var(--npi-bd)", color: "var(--npi-txt4)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    ↺ Reset
                  </button>
                )}
              </div>
              <textarea value={peText} onChange={e => { setPeText(e.target.value); setPeDirty(true); }}
                placeholder="Complete PE in the Physical Exam tab first, or enter findings here…" rows={4} style={TA} />
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
              {/* Core encounter fields */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {[
                  ["Patient", patientName],
                  ["DOB", demo.dob || "—"],
                  ["MRN", registration.mrn || "—"],
                  ["Room", registration.room || "—"],
                  ["Allergies", allergies.length ? allergies.join(", ") : "NKDA"],
                  ["Meds", medications.length ? `${medications.length} listed` : "none"],
                  ["BP", vitals.bp || "—"],
                  ["HR", vitals.hr || "—"],
                  ["SpO\u2082", vitals.spo2 ? vitals.spo2 + "%" : "—"],
                  ["Temp", vitals.temp || "—"],
                  ["ESI", esiLevel || "—"],
                  ["Encounter", new Date().toLocaleDateString()],
                ].map(([label, val]) => (
                  <div key={label} style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--npi-txt2)", fontFamily: "'DM Sans',sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
              {/* Extended history */}
              {(pmhExtra || surgHx || famHx || socHx) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(59,130,246,.1)" }}>
                  {[
                    ["Additional PMH", pmhExtra],
                    ["Surgical Hx", surgHx],
                    ["Family Hx", famHx],
                    ["Social Hx", socHx],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "var(--npi-txt2)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* SDOH flags */}
              {sdoh && Object.entries(sdoh).some(([, v]) => v && v !== "unknown" && v !== false) && (
                <div style={{ paddingTop: 8, borderTop: "1px solid rgba(59,130,246,.1)" }}>
                  <div style={{ fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>SDOH Factors</div>
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
            <div style={{ fontSize: 11, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace" }}>
              <KK ch="⌘⇧S" /> sign
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SECTIONS.slice(0,3).map(s => (
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
            <div key={t.id} style={{
              padding: "9px 16px", borderRadius: 10, fontSize: 12,
              fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap",
              background: "rgba(13,31,60,.95)", backdropFilter: "blur(16px)",
              border: `1px solid ${t.type === "success" ? "rgba(0,229,192,.4)" : "rgba(255,107,107,.4)"}`,
              color: t.type === "success" ? "var(--npi-teal)" : "var(--npi-coral)",
              boxShadow: "0 4px 20px rgba(0,0,0,.5)",
            }}>{t.type === "success" ? "\u2713" : "\u2715"} {t.msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}