// ================================================================
//  ClinicalNoteStudio.jsx
// ================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ── Styles (injected once) ────────────────────────────────────────────
(() => {
  if (document.getElementById("cns-css")) return;
  const s = document.createElement("style");
  s.id = "cns-css";
  s.textContent = `
    .cns-wrap { position:fixed; inset:0; display:flex; flex-direction:column;
      background:var(--npi-bg,#050f1e); font-family:'DM Sans',sans-serif; color:var(--npi-txt,#fff); }
    .cns-wrap.embedded { position:relative; inset:auto; height:100%; }

    .cns-top { height:52px; flex-shrink:0; background:var(--npi-panel,#081628);
      border-bottom:1px solid var(--npi-bd,#1a3555); display:flex; align-items:center;
      padding:0 16px; gap:10px; z-index:10; overflow:hidden; }
    .cns-top-badge { font-family:'JetBrains Mono',monospace; font-size:9px; flex-shrink:0;
      background:rgba(0,229,192,.08); border:1px solid rgba(0,229,192,.3);
      color:var(--npi-teal,#00e5c0); border-radius:20px; padding:2px 10px; letter-spacing:2px; }
    .cns-top-patient { font-family:'Playfair Display',serif; font-size:15px; font-weight:600;
      color:var(--npi-txt,#fff); white-space:nowrap; }
    .cns-top-meta { font-size:11px; color:var(--npi-txt3,#a8c8e8); white-space:nowrap; }
    .cns-top-acts { margin-left:auto; display:flex; gap:6px; align-items:center; flex-shrink:0; }

    .cns-btn { padding:5px 13px; border-radius:7px; font-size:11px; font-weight:600;
      cursor:pointer; display:inline-flex; align-items:center; gap:5px;
      font-family:'DM Sans',sans-serif; transition:all .15s; white-space:nowrap; border:none; }
    .cns-btn:disabled { opacity:.45; cursor:not-allowed; }
    .cns-btn-ghost { background:var(--npi-up,#0e2544);
      border:1px solid var(--npi-bd,#1a3555)!important; color:var(--npi-txt2,#d0e8ff); }
    .cns-btn-ghost:hover { border-color:var(--npi-bhi,#2a4f7a)!important; color:var(--npi-txt,#fff); }
    .cns-btn-teal  { background:var(--npi-teal,#00e5c0); color:#050f1e; }
    .cns-btn-teal:hover  { filter:brightness(1.12); }
    .cns-btn-gold  { background:rgba(245,200,66,.12); color:var(--npi-gold,#f5c842);
      border:1px solid rgba(245,200,66,.3)!important; }
    .cns-btn-gold:hover  { background:rgba(245,200,66,.2); }

    .cns-body { flex:1; display:flex; min-height:0; }

    .cns-sidebar { width:240px; flex-shrink:0; background:var(--npi-panel,#081628);
      border-right:1px solid var(--npi-bd,#1a3555); display:flex; flex-direction:column; overflow-y:auto; }
    .cns-sidebar::-webkit-scrollbar { width:3px; }
    .cns-sidebar::-webkit-scrollbar-thumb { background:var(--npi-bhi,#2a4f7a); border-radius:2px; }

    .cns-sb-head { padding:12px 14px 8px; flex-shrink:0; border-bottom:1px solid rgba(26,53,85,.5); }
    .cns-sb-title { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--npi-txt4,#7aa0c0);
      letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; }
    .cns-progress-bar { height:3px; background:var(--npi-up,#0e2544); border-radius:2px; overflow:hidden; }
    .cns-progress-fill { height:100%;
      background:linear-gradient(90deg,var(--npi-teal,#00e5c0),var(--npi-blue,#3b9eff));
      border-radius:2px; transition:width .4s ease; }
    .cns-progress-label { font-family:'JetBrains Mono',monospace; font-size:9px;
      color:var(--npi-txt3,#a8c8e8); margin-top:4px; }

    .cns-sb-items { padding:8px; flex:1; display:flex; flex-direction:column; gap:2px; }
    .cns-sb-item { display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:8px;
      cursor:pointer; transition:all .15s; border:1px solid transparent; }
    .cns-sb-item:hover { background:var(--npi-up,#0e2544); border-color:var(--npi-bd,#1a3555); }
    .cns-sb-item.active { background:rgba(59,158,255,.08); border-color:rgba(59,158,255,.3); }
    .cns-sb-item-icon { font-size:14px; flex-shrink:0; }
    .cns-sb-item-info { flex:1; min-width:0; }
    .cns-sb-item-name { font-size:12px; font-weight:500; color:var(--npi-txt2,#d0e8ff);
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cns-sb-item.active .cns-sb-item-name { color:var(--npi-txt,#fff); font-weight:600; }
    .cns-sb-key { font-family:'JetBrains Mono',monospace; font-size:8px;
      color:var(--npi-txt4,#7aa0c0); background:var(--npi-up,#0e2544);
      border:1px solid var(--npi-bd,#1a3555); border-radius:4px; padding:1px 5px; flex-shrink:0; }

    .cns-sb-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
    .cns-sb-dot.empty    { background:var(--npi-txt4,#7aa0c0); opacity:.4; }
    .cns-sb-dot.draft    { background:var(--npi-orange,#ff9f43); box-shadow:0 0 4px rgba(255,159,67,.5); }
    .cns-sb-dot.complete { background:var(--npi-teal,#00e5c0);  box-shadow:0 0 4px rgba(0,229,192,.5); }
    .cns-sb-dot.locked   { background:var(--npi-blue,#3b9eff);  box-shadow:0 0 4px rgba(59,158,255,.5); }

    .cns-sb-legend { padding:10px 14px 14px; border-top:1px solid rgba(26,53,85,.4); flex-shrink:0; }
    .cns-sb-legend-title { font-family:'JetBrains Mono',monospace; font-size:8px;
      color:var(--npi-txt4,#7aa0c0); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:7px; }
    .cns-sc-row { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
    .cns-sc-key { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--npi-txt2,#d0e8ff);
      background:var(--npi-up,#0e2544); border:1px solid var(--npi-bd,#1a3555);
      border-radius:4px; padding:1px 6px; flex-shrink:0; }
    .cns-sc-desc { font-size:10px; color:var(--npi-txt3,#a8c8e8); }

    .cns-note-area { flex:1; overflow-y:auto; padding:20px 24px 40px;
      display:flex; flex-direction:column; gap:14px; }
    .cns-note-area::-webkit-scrollbar { width:4px; }
    .cns-note-area::-webkit-scrollbar-thumb { background:var(--npi-bhi,#2a4f7a); border-radius:2px; }

    .cns-section { background:rgba(8,22,40,.78); border:1px solid rgba(26,53,85,.5);
      border-radius:12px; overflow:hidden; transition:border-color .2s; backdrop-filter:blur(12px); }
    .cns-section:focus-within { border-color:var(--npi-bhi,#2a4f7a); }
    .cns-section.active-section { border-color:rgba(59,158,255,.4); box-shadow:0 0 20px rgba(59,158,255,.08); }

    .cns-section-header { display:flex; align-items:center; gap:9px; padding:10px 14px;
      background:rgba(14,37,68,.4); border-bottom:1px solid rgba(26,53,85,.4); cursor:pointer; }
    .cns-section-icon  { font-size:15px; }
    .cns-section-title { font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700;
      color:var(--npi-txt,#fff); flex:1; }
    .cns-section-shortcut { font-family:'JetBrains Mono',monospace; font-size:8px;
      color:var(--npi-txt4,#7aa0c0); background:var(--npi-up,#0e2544);
      border:1px solid var(--npi-bd,#1a3555); border-radius:4px; padding:1px 6px; }
    .cns-section-acts { display:flex; gap:5px; align-items:center; }

    .cns-section-status { font-family:'JetBrains Mono',monospace; font-size:8px;
      font-weight:700; padding:2px 8px; border-radius:20px; }
    .cns-section-status.empty    { background:rgba(90,130,168,.12); color:var(--npi-txt4,#7aa0c0);
      border:1px solid rgba(90,130,168,.2); }
    .cns-section-status.draft    { background:rgba(255,159,67,.1);  color:var(--npi-orange,#ff9f43);
      border:1px solid rgba(255,159,67,.3); }
    .cns-section-status.complete { background:rgba(0,229,192,.1);   color:var(--npi-teal,#00e5c0);
      border:1px solid rgba(0,229,192,.3); }
    .cns-section-status.locked   { background:rgba(59,158,255,.1);  color:var(--npi-blue,#3b9eff);
      border:1px solid rgba(59,158,255,.3); }

    .cns-icon-btn { width:28px; height:28px; border-radius:6px;
      border:1px solid var(--npi-bd,#1a3555); background:var(--npi-up,#0e2544);
      color:var(--npi-txt3,#a8c8e8); font-size:13px; cursor:pointer;
      display:flex; align-items:center; justify-content:center; transition:all .15s; }
    .cns-icon-btn:hover   { border-color:var(--npi-bhi,#2a4f7a); color:var(--npi-txt2,#d0e8ff); }
    .cns-icon-btn:disabled { opacity:.4; cursor:not-allowed; }
    .cns-icon-btn.spin    { animation:cns-spin .8s linear infinite; }
    @keyframes cns-spin   { to { transform:rotate(360deg); } }

    .cns-ta { width:100%; padding:13px 14px; background:transparent; border:none;
      color:var(--npi-txt,#fff); font-family:'JetBrains Mono',monospace; font-size:12px;
      line-height:1.75; resize:none; outline:none; min-height:80px; display:block; box-sizing:border-box; }
    .cns-ta::placeholder { color:var(--npi-txt4,#7aa0c0); font-style:italic; font-size:11px; }
    .cns-ta:disabled { opacity:.5; cursor:default; }
    .cns-ta.locked { background:rgba(59,158,255,.03); color:var(--npi-txt2,#d0e8ff); }

    .cns-section-footer { display:flex; align-items:center; padding:5px 14px 8px; gap:10px; }
    .cns-char-count { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--npi-txt4,#7aa0c0); }
    .cns-mark-done { margin-left:auto; font-size:9px; font-weight:600; cursor:pointer;
      color:var(--npi-teal,#00e5c0); font-family:'JetBrains Mono',monospace; letter-spacing:.5px;
      text-transform:uppercase; transition:opacity .15s; }
    .cns-mark-done:hover { opacity:.7; }

    .cns-loading-bar { height:2px; flex-shrink:0;
      background:linear-gradient(90deg,var(--npi-teal,#00e5c0),var(--npi-blue,#3b9eff),var(--npi-teal,#00e5c0));
      background-size:200% auto; animation:cns-sweep 1.4s linear infinite; }
    @keyframes cns-sweep { to { background-position:200% center; } }

    .cns-sig { background:rgba(8,22,40,.6); border:1px solid rgba(26,53,85,.5);
      border-radius:12px; padding:16px 18px;
      font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--npi-txt3,#a8c8e8); }

    @media print {
      .cns-sidebar,.cns-top-acts,.cns-section-acts,.cns-section-footer,
      .cns-btn,.cns-icon-btn,.cns-loading-bar { display:none!important; }
      .cns-wrap  { position:static; background:white; color:black; }
      .cns-top   { background:white; border-bottom:1px solid #ccc; }
      .cns-section { background:white; border:1px solid #ddd; page-break-inside:avoid; }
      .cns-ta { color:black; font-size:11px; }
    }
  `;
  document.head.appendChild(s);
})();

// ── Section definitions ───────────────────────────────────────────────
const SECTIONS = [
  { id:"header", title:"Patient Header",             icon:"👤", key:"1" },
  { id:"cc",     title:"Chief Complaint",             icon:"💬", key:"2" },
  { id:"hpi",    title:"History of Present Illness",  icon:"📝", key:"3" },
  { id:"pmh",    title:"PMH / Meds / Allergies",      icon:"💊", key:"4" },
  { id:"ros",    title:"Review of Systems",            icon:"🔍", key:"5" },
  { id:"vitals", title:"Vital Signs",                  icon:"📈", key:"6" },
  { id:"pe",     title:"Physical Examination",         icon:"🩺", key:"7" },
  { id:"mdm",    title:"Assessment & Plan",            icon:"⚖️", key:"8" },
  { id:"dispo",  title:"Disposition",                  icon:"🚪", key:"9" },
];

const PLACEHOLDERS = {
  header:"Patient header auto-populates from demographics.",
  cc:"Chief complaint...",
  hpi:"History of present illness...",
  pmh:"Past medical history, medications, allergies...",
  ros:"Review of systems...",
  vitals:"Vital signs...",
  pe:"Physical examination findings...",
  mdm:"Impression, differential, plan...",
  dispo:"Disposition and discharge instructions...",
};

// ── Structured data → note text ───────────────────────────────────────
function assembleSection(id, d = {}) {
  const {
    demo = {}, cc = {}, vitals = {}, medications = [], allergies = [],
    pmhSelected = {}, pmhExtra = "", surgHx = "", famHx = "", socHx = "",
    rosState = {}, rosNotes = {}, rosSymptoms = {},
    peState = {}, peFindings = {},
    esiLevel = "", registration = {},
  } = d;

  const dateStr = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const timeStr = new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
  const name    = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Unknown Patient";
  const line    = "─".repeat(58);

  switch (id) {
    case "header":
      return [
        "EMERGENCY DEPARTMENT NOTE", line,
        `Patient:    ${name}`,
        (demo.age || demo.sex) && `Age / Sex:  ${[demo.age ? demo.age + "y" : "", demo.sex].filter(Boolean).join(" · ")}`,
        demo.dob  && `DOB:        ${demo.dob}`,
        (registration.mrn || demo.mrn) && `MRN:        ${registration.mrn || demo.mrn}`,
        registration.room && `Room:       ${registration.room}`,
        esiLevel  && `ESI Level:  ${esiLevel}`,
        `Date / Time: ${dateStr}  ${timeStr}`,
        allergies.length && `${line}\nALLERGIES:  ⚠  ${allergies.join(" · ")}`,
      ].filter(Boolean).join("\n");

    case "cc":
      return cc.text ? `Chief Complaint:\n${cc.text}` : "";

    case "hpi":
      if (cc.hpi) return cc.hpi;
      if (!cc.text) return "";
      return [
        `Patient presents with ${cc.text}.`,
        cc.onset     && `Onset ${cc.onset}.`,
        cc.duration  && `Duration ${cc.duration}.`,
        cc.quality   && `Quality described as ${cc.quality}.`,
        cc.severity  && `Severity rated ${cc.severity}/10.`,
        cc.radiation && `Radiation to ${cc.radiation}.`,
        cc.aggravate && `Aggravated by ${cc.aggravate}.`,
        cc.relieve   && `Relieved by ${cc.relieve}.`,
        cc.assoc     && `Associated symptoms: ${cc.assoc}.`,
      ].filter(Boolean).join(" ");

    case "pmh": {
      const pmhList = Object.entries(pmhSelected).filter(([, v]) => v).map(([k]) => k);
      const pmhStr  = pmhList.length
        ? pmhList.join(", ") + (pmhExtra ? ", " + pmhExtra : "")
        : (pmhExtra || "None documented.");
      return [
        "PAST MEDICAL HISTORY:", pmhStr,
        surgHx && `\nSURGICAL HISTORY:\n${surgHx}`,
        famHx  && `\nFAMILY HISTORY:\n${famHx}`,
        socHx  && `\nSOCIAL HISTORY:\n${socHx}`,
        `\nMEDICATIONS:\n${medications.length ? medications.join("\n") : "None documented."}`,
        `\nALLERGIES:\n${allergies.length ? allergies.join(", ") : "NKDA"}`,
      ].filter(Boolean).join("\n");
    }

    case "ros": {
      const stateKeys  = Object.keys(rosState);
      const symptomKeys = Object.keys(rosSymptoms);
      if (!stateKeys.length && !symptomKeys.length) return "";

      const pos    = stateKeys.filter(s => rosState[s] === "positive" || rosState[s] === true);
      const neg    = stateKeys.filter(s => rosState[s] === "negative" || rosState[s] === false);
      const symPos = symptomKeys.filter(s => rosSymptoms[s] === true);
      const allPos = [...new Set([...pos, ...symPos])];
      if (!allPos.length && !neg.length) return "";

      return [
        "REVIEW OF SYSTEMS:",
        allPos.length && "\nPOSITIVE:",
        ...allPos.map(s => `  (+) ${s}${rosNotes?.[s] ? " — " + rosNotes[s] : ""}`),
        neg.length && "\nNEGATIVE (pertinent):",
        ...neg.map(s => `  (−) ${s}`),
      ].filter(Boolean).join("\n");
    }

    case "vitals": {
      const entries = [
        ["BP",     vitals.bp],
        ["HR",     vitals.hr],
        ["RR",     vitals.rr],
        ["SpO₂",   vitals.spo2],
        ["Temp",   vitals.temp],
        ["GCS",    vitals.gcs],
        ["Wt",     vitals.weight ? vitals.weight + " kg" : null],
        ["O₂ del", vitals.o2del || null],
        ["Pain",   vitals.pain  ? vitals.pain + "/10" : null],
      ].filter(([, v]) => v);
      if (!entries.length) return "";
      return "VITAL SIGNS:\n" + entries.map(([k, v]) => `  ${k.padEnd(8)}: ${v}`).join("\n");
    }

    case "pe": {
      const systems = Object.keys(peState);
      if (!systems.length) return "";
      return [
        "PHYSICAL EXAMINATION:",
        ...systems
          .map(s => { const f = peFindings?.[s] || peState[s]; return f ? `  ${s}: ${f}` : null; })
          .filter(Boolean),
      ].join("\n");
    }

    case "mdm":
      return [
        "MEDICAL DECISION MAKING:", "",
        "Impression:", "  1. ", "",
        "Differential:", "  • ", "",
        "Plan:", "  1. ", "  2. ", "  3. ", "",
        "Risk stratification: [ ] Low   [ ] Moderate   [ ] High",
      ].join("\n");

    case "dispo":
      return [
        "DISPOSITION:", "",
        "[ ] Discharge home",
        "[ ] Admission to: ___________  Service: ___________",
        "[ ] Observation — expected stay: ___________",
        "[ ] Transfer to: ___________", "",
        "Discharge instructions provided: [ ] Yes",
        "Return precautions discussed:     [ ] Yes",
        "Follow-up with: ___________  in ___________", "",
        "Attending Physician: ___________   Time: ___________",
      ].join("\n");

    default:
      return "";
  }
}

function buildInitialSections(patientData) {
  const m = {};
  SECTIONS.forEach(s => {
    const auto = assembleSection(s.id, patientData);
    m[s.id] = { content: auto, status: auto ? "draft" : "empty", locked: false };
  });
  return m;
}

// ── Main component ────────────────────────────────────────────────────
export default function ClinicalNoteStudio({ patientData: propData, embedded = false, onBack }) {
  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();
  const urlNoteId      = searchParams.get("noteId");

  const patientData = useMemo(
    () => propData || location.state?.patientData || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propData, location.key]
  );

  const { demo = {}, cc = {}, medications = [], allergies = [], registration = {}, esiLevel = "" } = patientData;
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";

  const [sections, setSections] = useState(() => buildInitialSections(patientData));
  const [focused,  setFocused]  = useState("header");
  const [loading,  setLoading]  = useState({});
  const [anyBusy,  setAnyBusy]  = useState(false);
  const [saved,    setSaved]    = useState(false);

  const sectionsRef    = useRef(sections);
  const sectionDivRefs = useRef({});
  const textareaRefs   = useRef({});
  const savedNoteIdRef = useRef(urlNoteId || null);

  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  useEffect(() => {
    if (!urlNoteId || propData) return;
    base44.entities.ClinicalNote.filter({ id: urlNoteId })
      .then(results => {
        const note = results?.[0];
        if (!note) return;
        savedNoteIdRef.current = urlNoteId;
        if (note.raw_note) {
          setSections(prev => ({
            ...prev,
            mdm: { content: note.raw_note, status: "draft", locked: false },
          }));
        }
        toast.info("Note loaded.");
      })
      .catch(() => {});
  }, [urlNoteId, propData]);

  useEffect(() => {
    Object.keys(sections).forEach(id => {
      const ta = textareaRefs.current[id];
      if (!ta) return;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }, [sections]);

  const completedCount = useMemo(() =>
    SECTIONS.filter(s => ["complete", "locked"].includes(sections[s.id]?.status)).length,
  [sections]);

  const updateSection = useCallback((id, content) => {
    setSections(prev => ({ ...prev, [id]: { ...prev[id], content, status: content ? "draft" : "empty" } }));
    setSaved(false);
  }, []);

  const markComplete = useCallback((id) => {
    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], status: prev[id].status === "complete" ? "draft" : "complete" },
    }));
  }, []);

  const toggleLock = useCallback((id) => {
    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], locked: !prev[id].locked, status: !prev[id].locked ? "locked" : "complete" },
    }));
  }, []);

  const generateSection = useCallback(async (id) => {
    const sec = SECTIONS.find(s => s.id === id);
    if (!sec || sectionsRef.current[id]?.locked) return;

    setLoading(l => ({ ...l, [id]: true }));
    setAnyBusy(true);

    const prompt = [
      "You are a clinical documentation assistant in an emergency medicine platform.",
      `Generate ONLY the "${sec.title}" section of an ED note in standard EP documentation style.`,
      "Be concise and clinically precise. Return ONLY the section text — no label, no preamble.",
      `Patient: ${patientName}.  CC: ${cc.text || "not documented"}.`,
      `Current content: ${sectionsRef.current[id]?.content || "(empty)"}`,
    ].join("\n");

    try {
      const res  = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = typeof res === "string" ? res : JSON.stringify(res);
      setSections(prev => ({ ...prev, [id]: { ...prev[id], content: text, status: "draft" } }));
      setSaved(false);
    } catch {
      toast.error("AI generation failed.");
    } finally {
      setLoading(prev => {
        const next = { ...prev, [id]: false };
        setAnyBusy(Object.values(next).some(Boolean));
        return next;
      });
    }
  }, [patientName, cc.text]);

  const generateAll = useCallback(async () => {
    const empty = SECTIONS.filter(s => {
      const sec = sectionsRef.current[s.id];
      return !sec?.content || sec.status === "empty";
    });
    if (!empty.length) { toast.info("All sections have content."); return; }
    toast.info(`Generating ${empty.length} sections…`);
    for (const s of empty) await generateSection(s.id);
    toast.success("Done.");
  }, [generateSection]);

  const rebuildAll = useCallback(() => {
    setSections(buildInitialSections(patientData));
    setSaved(false);
    toast.success("Note rebuilt from patient data.");
  }, [patientData]);

  const copyAll = useCallback(async () => {
    const divider = "\n\n" + "─".repeat(58) + "\n\n";
    const full = SECTIONS.map(s => sectionsRef.current[s.id]?.content).filter(Boolean).join(divider);
    try {
      await navigator.clipboard.writeText(full);
      toast.success("Note copied.");
    } catch {
      toast.error("Clipboard access denied.");
    }
  }, []);

  const printNote = useCallback(() => window.print(), []);

  const saveNote = useCallback(async () => {
    const full = SECTIONS.map(s => sectionsRef.current[s.id]?.content).filter(Boolean).join("\n\n");
    try {
      if (savedNoteIdRef.current) {
        await base44.entities.ClinicalNote.update(savedNoteIdRef.current, {
          raw_note: full, status: "draft",
        });
      } else {
        const created = await base44.entities.ClinicalNote.create({
          raw_note: full, patient_name: patientName,
          patient_id: registration.mrn || demo.mrn || "",
          patient_age: demo.age || "", patient_gender: demo.sex || "",
          chief_complaint: cc.text || "",
          medications, allergies, status: "draft",
        });
        savedNoteIdRef.current = created.id;
      }
      setSaved(true);
      toast.success("Note saved.");
    } catch (e) {
      toast.error("Save failed: " + (e?.message || "unknown error"));
    }
  }, [patientName, demo, registration, cc, medications, allergies]);

  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const sIdx = parseInt(e.key, 10) - 1;
      if (!Number.isNaN(sIdx) && sIdx >= 0 && sIdx < SECTIONS.length) {
        e.preventDefault();
        const target = SECTIONS[sIdx].id;
        setFocused(target);
        sectionDivRefs.current[target]?.scrollIntoView({ behavior:"smooth", block:"start" });
        return;
      }

      switch (true) {
        case e.key === "g" && !e.shiftKey: e.preventDefault(); generateSection(focused); break;
        case e.key === "g" &&  e.shiftKey: e.preventDefault(); generateAll();            break;
        case e.key === "s":                e.preventDefault(); saveNote();               break;
        case e.key === "p":                e.preventDefault(); printNote();              break;
        case e.key === "c" &&  e.shiftKey: e.preventDefault(); copyAll();               break;
        case e.key === "r":                e.preventDefault(); rebuildAll();             break;
        default: break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, generateSection, generateAll, saveNote, printNote, copyAll, rebuildAll]);

  return (
    <div className={`cns-wrap${embedded ? " embedded" : ""}`}>
      {anyBusy && <div className="cns-loading-bar"/>}

      <div className="cns-top">
        <button className="cns-btn cns-btn-ghost" onClick={() => onBack ? onBack() : navigate(-1)}>← Back</button>
        <span className="cns-top-badge">NOTE STUDIO</span>
        <span className="cns-top-patient">{patientName}</span>
        {(demo.age || demo.sex) && (
          <span className="cns-top-meta">
            {[demo.age ? demo.age + "y" : "", demo.sex].filter(Boolean).join(" · ")}
          </span>
        )}
        {cc.text && (
          <span className="cns-top-meta" style={{ color:"var(--npi-orange,#ff9f43)", fontWeight:600 }}>
            CC: {cc.text}
          </span>
        )}
        {esiLevel && (
          <span style={{
            fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
            padding:"2px 9px", borderRadius:4, flexShrink:0,
            background:"rgba(255,107,107,.1)", color:"var(--npi-coral,#ff6b6b)",
            border:"1px solid rgba(255,107,107,.3)",
          }}>ESI {esiLevel}</span>
        )}
        <div className="cns-top-acts">
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:"var(--npi-txt4,#7aa0c0)" }}>
            {completedCount}/{SECTIONS.length} done
          </span>
          <button className="cns-btn cns-btn-ghost" onClick={rebuildAll} title="⌘R">↺ Rebuild</button>
          <button className="cns-btn cns-btn-gold"  onClick={generateAll} disabled={anyBusy} title="⌘⇧G">
            {anyBusy ? "⟳ Generating…" : "✦ Generate All"}
          </button>
          <button className="cns-btn cns-btn-ghost" onClick={copyAll}   title="⌘⇧C">⎘ Copy</button>
          <button className="cns-btn cns-btn-ghost" onClick={printNote} title="⌘P">⎙ Print</button>
          <button className="cns-btn cns-btn-teal"  onClick={saveNote}  title="⌘S">
            {saved ? "✓ Saved" : "💾 Save"}
          </button>
        </div>
      </div>

      <div className="cns-body">
        <div className="cns-sidebar">
          <div className="cns-sb-head">
            <div className="cns-sb-title">Note Sections</div>
            <div className="cns-progress-bar">
              <div className="cns-progress-fill" style={{ width:`${(completedCount / SECTIONS.length) * 100}%` }}/>
            </div>
            <div className="cns-progress-label">{completedCount} of {SECTIONS.length} signed off</div>
          </div>
          <div className="cns-sb-items">
            {SECTIONS.map(s => {
              const st = sections[s.id]?.status || "empty";
              return (
                <div
                  key={s.id}
                  className={`cns-sb-item${focused === s.id ? " active" : ""}`}
                  onClick={() => {
                    setFocused(s.id);
                    sectionDivRefs.current[s.id]?.scrollIntoView({ behavior:"smooth", block:"start" });
                  }}
                >
                  <span className="cns-sb-item-icon">{s.icon}</span>
                  <div className="cns-sb-item-info">
                    <div className="cns-sb-item-name">{s.title}</div>
                  </div>
                  <span className="cns-sb-key">⌘{s.key}</span>
                  <div className={`cns-sb-dot ${st}`}/>
                </div>
              );
            })}
          </div>
          <div className="cns-sb-legend">
            <div className="cns-sb-legend-title">Shortcuts</div>
            {[
              ["⌘ 1–9", "Jump to section"],
              ["⌘ G",   "AI: generate focused"],
              ["⌘ ⇧ G","AI: all empty"],
              ["⌘ R",   "Rebuild from data"],
              ["⌘ ⇧ C","Copy full note"],
              ["⌘ S",   "Save"],
              ["⌘ P",   "Print"],
            ].map(([k, d]) => (
              <div key={k} className="cns-sc-row">
                <span className="cns-sc-key">{k}</span>
                <span className="cns-sc-desc">{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cns-note-area">
          {SECTIONS.map(s => {
            const st   = sections[s.id]?.status || "empty";
            const lk   = sections[s.id]?.locked  || false;
            const txt  = sections[s.id]?.content  || "";
            const busy = loading[s.id]             || false;

            return (
              <div
                key={s.id}
                ref={el => { sectionDivRefs.current[s.id] = el; }}
                className={`cns-section${focused === s.id ? " active-section" : ""}`}
                onClick={() => setFocused(s.id)}
              >
                <div className="cns-section-header">
                  <span className="cns-section-icon">{s.icon}</span>
                  <span className="cns-section-title">{s.title}</span>
                  <span className="cns-section-shortcut">⌘{s.key}</span>
                  <div className="cns-section-acts">
                    <span className={`cns-section-status ${st}`}>
                      {st === "locked" ? "🔒 locked" : st}
                    </span>
                    <button
                      className={`cns-icon-btn${busy ? " spin" : ""}`}
                      title="AI Generate (⌘G)"
                      disabled={lk || busy}
                      onClick={e => { e.stopPropagation(); generateSection(s.id); }}
                    >
                      {busy ? "⟳" : "✦"}
                    </button>
                    <button
                      className="cns-icon-btn"
                      title={lk ? "Unlock" : "Lock section"}
                      onClick={e => { e.stopPropagation(); toggleLock(s.id); }}
                      style={{ color: lk ? "var(--npi-blue,#3b9eff)" : undefined }}
                    >
                      {lk ? "🔒" : "🔓"}
                    </button>
                  </div>
                </div>

                <textarea
                  ref={el => { textareaRefs.current[s.id] = el; }}
                  className={`cns-ta${lk ? " locked" : ""}`}
                  value={txt}
                  disabled={lk}
                  placeholder={PLACEHOLDERS[s.id] || ""}
                  onChange={e => updateSection(s.id, e.target.value)}
                  onFocus={() => setFocused(s.id)}
                  onInput={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />

                <div className="cns-section-footer">
                  <span className="cns-char-count">
                    {txt.length} chars · {txt ? txt.split("\n").length : 0} lines
                  </span>
                  {!lk && (
                    <span className="cns-mark-done" onClick={() => markComplete(s.id)}>
                      {st === "complete" ? "✓ done — undo" : "Mark complete ✓"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="cns-sig">
            <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase",
              color:"var(--npi-txt4,#7aa0c0)", marginBottom:8 }}>ELECTRONIC SIGNATURE</div>
            <div>Attending Physician: ___________________________  Date: ______________</div>
            <div style={{ marginTop:6, fontSize:10, color:"var(--npi-txt4,#7aa0c0)" }}>
              I have personally seen and evaluated this patient and agree with the above documentation.
              Notrya is a clinical decision support tool. Verify all clinical decisions independently.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}