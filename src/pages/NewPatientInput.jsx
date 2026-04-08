import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

import DemoTab from "@/components/npi/DemoTab";
import CCTab from "@/components/npi/CCTab";
import VitalsTab from "@/components/npi/VitalsTab";
import MedsTab from "@/components/npi/MedsTab";
import ROSTab from "@/components/npi/ROSTab";
import PETab from "@/components/npi/PETab";
import AutoCoderTab from "@/components/npi/AutoCoderTab";
import MedicalDecisionMaking from "@/pages/MedicalDecisionMaking";
import DischargePlanning from "@/pages/DischargePlanning";
import NotryaApp from "@/pages/NotryaApp";
import EDProcedureNotes from "@/pages/EDProcedureNotes";
import EDOrders from "@/pages/EDOrders";
import MedicationReferencePage from "@/pages/MedicationReference";
import ERPlanBuilder from "@/pages/ERPlanBuilder";
import ResultsViewer from "@/pages/ResultsViewer";
import CDSAlertsSidebar from "@/components/npi/CDSAlertsSidebar";
import ERxHub from "@/pages/ERx";
import ClinicalNoteStudio from "@/components/npi/ClinicalNoteStudio";

// ─── NAV DATA — 5-stage clinical workflow ─────────────────────────────────────
// register → assess → note (destination) → orders → close
const NAV_DATA = {
  register: [
    { section: "demo",       icon: "👤", label: "Demographics",      abbr: "Dm", dot: "empty"   },
    { section: "cc",         icon: "💬", label: "Chief Complaint",   abbr: "Cc", dot: "empty"   },
    { section: "vit",        icon: "📈", label: "Vitals",            abbr: "Vt", dot: "empty"   },
    { section: "meds",       icon: "💊", label: "Meds & PMH",        abbr: "Rx", dot: "empty"   },
  ],
  assess: [
    { section: "hpi",        icon: "📝", label: "HPI",               abbr: "Hp", dot: "empty"   },
    { section: "ros",        icon: "🔍", label: "Review of Systems", abbr: "Rs", dot: "empty"   },
    { section: "pe",         icon: "🩺", label: "Physical Exam",     abbr: "Pe", dot: "empty"   },
  ],
  note: [
    { section: "chart",      icon: "📄", label: "Clinical Note",     abbr: "Cn", dot: "empty"   },
  ],
  orders: [
    { section: "orders",     icon: "📋", label: "Orders",            abbr: "Or", dot: "empty"   },
    { section: "erx",        icon: "💉", label: "eRx",               abbr: "Ex", dot: "empty"   },
    { section: "erplan",     icon: "🗺️", label: "ER Plan Builder",   abbr: "Ep", dot: "empty"   },
    { section: "procedures", icon: "✂️", label: "Procedures",        abbr: "Pr", dot: "empty"   },
  ],
  close: [
    { section: "discharge",  icon: "🚪", label: "Discharge",         abbr: "Dc", dot: "empty"   },
    { section: "results",    icon: "🧪", label: "Results",           abbr: "Re", dot: "empty", href: "/Results"     },
    { section: "autocoder",  icon: "🤖", label: "AutoCoder",         abbr: "Ac", dot: "empty"   },
    { section: "medref",     icon: "🧬", label: "ED Med Ref",        abbr: "Mr", dot: "empty"   },
    { section: "calc",       icon: "🧮", label: "Calculators",       abbr: "Ca", dot: "empty", href: "/Calculators" },
    { section: "hub",        icon: "🏥", label: "Clinical Hub",      abbr: "Hb", dot: "empty", href: "/hub"         },
  ],
};

const GROUP_META = [
  { key: "register", icon: "👤", label: "Register" },
  { key: "assess",   icon: "🔍", label: "Assess"   },
  { key: "note",     icon: "📄", label: "Note"      },
  { key: "orders",   icon: "📋", label: "Orders"    },
  { key: "close",    icon: "🚪", label: "Close"     },
];

const ALL_SECTIONS = Object.values(NAV_DATA).flat();

const SHORTCUT_MAP = {
  "1": "demo", "2": "cc",    "3": "vit",
  "4": "meds", "5": "hpi",   "6": "ros",
  "7": "pe",   "8": "chart", "9": "orders",
  "0": "discharge",
};
const SECTION_SHORTCUT = Object.fromEntries(
  Object.entries(SHORTCUT_MAP).map(([k, v]) => [v, k])
);

const QUICK_ACTIONS = [
  { icon: "📋", label: "Summarise", prompt: "Summarise what I have entered so far."                    },
  { icon: "🔍", label: "Check",     prompt: "What am I missing? Check my entries for completeness."   },
  { icon: "📝", label: "Draft Note",prompt: "Generate a draft note from the data entered."             },
  { icon: "🧠", label: "DDx",       prompt: "Suggest differential diagnoses based on current data."   },
];

const SYSTEM_PROMPT =
  "You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2-4 concise, actionable sentences. Be direct. Never fabricate data.";

// ─── PATIENT CONTEXT BUILDER ──────────────────────────────────────────────────
function buildPatientCtx(demo, cc, vitals, allergies, pmhSelected, currentTab) {
  const name = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).join(", ") || "none";
  return [
    `Patient: ${name}, ${demo.age || "?"}${demo.sex ? " " + demo.sex : ""}.`,
    cc.text     ? `CC: ${cc.text}.`                                                            : null,
    vitals.bp   ? `BP ${vitals.bp}  HR ${vitals.hr || "-"}  SpO2 ${vitals.spo2 || "-"}  T ${vitals.temp || "-"}.` : null,
    allergies.length ? `Allergies: ${allergies.join(", ")}.`                                  : "Allergies: NKDA.",
    pmhList !== "none" ? `PMH: ${pmhList}.`                                                   : null,
    cc.hpi      ? `HPI summary: ${cc.hpi.slice(0, 200)}.`                                     : null,
    `Active section: ${currentTab}.`,
  ].filter(Boolean).join(" ");
}

// ─── INLINE HPI TAB ───────────────────────────────────────────────────────────
// Keyboard-first AI-driven symptom checklist that builds an HPI narrative.
//
// Keyboard contract (scan phase):
//   Arrow Up/Down  — navigate symptom rows
//   Y / Enter      — mark yes / present (yesno)
//   N              — mark no / absent  (yesno)
//   Space          — skip symptom
//   0-9            — answer pain scale (scale type) or pick option 1-N (choice type)
//   Backspace      — go back one row (when current row unanswered)
//   Esc            — finish and build narrative
function InlineHPITab({ cc, setCC, onAdvance }) {
  const [phase, setPhase]     = useState("idle");   // idle | loading | scan | narrative
  const [symptoms, setSymptoms] = useState([]);
  const [answers, setAnswers]   = useState({});
  const [focusIdx, setFocusIdx] = useState(0);
  const [narrative, setNarrative] = useState(cc.hpi || "");
  const panelRef = useRef(null);

  const answerColor = (ans) => {
    if (!ans || ans === "skip") return "var(--npi-txt4)";
    if (ans === "yes")  return "var(--npi-coral)";
    if (ans === "no")   return "var(--npi-teal)";
    return "var(--npi-blue)";
  };

  const answerLabel = (sym, ans) => {
    if (!ans || ans === "skip") return "\u2014";
    if (ans === "yes") return sym.hint || "Present";
    if (ans === "no")  return "Absent";
    return ans;
  };

  const buildNarrative = useCallback((ans) => {
    const yes     = symptoms.filter(s => ans[s.id] === "yes").map(s => (s.hint || s.label).toLowerCase());
    const no      = symptoms.filter(s => ans[s.id] === "no").map(s => (s.hint || s.label).toLowerCase());
    const details = symptoms
      .filter(s => ans[s.id] && !["yes","no","skip"].includes(ans[s.id]))
      .map(s => `${s.label}: ${ans[s.id]}`);

    let text = cc.text ? `${cc.text}.` : "Chief complaint not specified.";
    if (details.length) text += ` ${details.join("; ")}.`;
    if (yes.length)     text += ` Associated with ${yes.join(", ")}.`;
    if (no.length)      text += ` Denies ${no.join(", ")}.`;
    return text;
  }, [symptoms, cc.text]);

  const finishScan = useCallback((ans) => {
    const text = buildNarrative(ans);
    setNarrative(text);
    setCC(prev => ({ ...prev, hpi: text }));
    setPhase("narrative");
  }, [buildNarrative, setCC]);

  const advance = useCallback((newAnswers, idx) => {
    if (idx + 1 >= symptoms.length) { finishScan(newAnswers); }
    else { setFocusIdx(idx + 1); }
  }, [symptoms.length, finishScan]);

  const generateSymptoms = async () => {
    if (!cc.text.trim()) { toast.error("Enter a chief complaint first (Cmd+2)."); return; }
    setPhase("loading");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation assistant for emergency medicine.
For the chief complaint: "${cc.text}"
Generate a focused HPI symptom checklist using OPQRST framework plus relevant associated symptoms.
Return ONLY valid JSON — no preamble, no backticks:
{"symptoms":[
  {"id":"onset","label":"Onset","type":"choice","opts":["Sudden","Gradual","Woke from sleep","Unknown"]},
  {"id":"duration","label":"Duration","type":"choice","opts":["<1 hr","1-6 hrs","6-24 hrs","1-3 days","3-7 days",">1 week"]},
  {"id":"severity","label":"Severity","type":"scale","hint":"0=none, 9=worst ever"},
  {"id":"quality","label":"Quality","type":"choice","opts":["Sharp","Dull","Pressure/squeezing","Burning","Crampy","Aching","Throbbing"]},
  {"id":"radiation","label":"Radiation","type":"yesno","hint":"radiates elsewhere"},
  {"id":"aggravate","label":"Aggravated by","type":"choice","opts":["Exertion","Movement","Deep breath","Food/drink","Lying flat","Nothing","Unknown"]},
  {"id":"relieve","label":"Relieved by","type":"choice","opts":["Rest","Position change","Antacids","Nitroglycerin","Nothing","Unknown"]},
  {"id":"prior","label":"Prior episodes","type":"yesno","hint":"prior similar episodes"},
  {"id":"assoc1","label":"Nausea/Vomiting","type":"yesno","hint":"nausea or vomiting"},
  {"id":"assoc2","label":"Diaphoresis","type":"yesno","hint":"diaphoresis"},
  {"id":"assoc3","label":"Dyspnea","type":"yesno","hint":"shortness of breath"}
]}
Customize the symptom list to be clinically relevant for "${cc.text}". Keep 8-12 symptoms. Labels max 3 words.`,
        response_json_schema: {
          type: "object",
          properties: {
            symptoms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id:    { type: "string" },
                  label: { type: "string" },
                  type:  { type: "string" },
                  hint:  { type: "string" },
                  opts:  { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });
      const parsed = typeof result === "object" ? result : JSON.parse(String(result).replace(/```json|```/g, "").trim());
      setSymptoms(parsed.symptoms || []);
      setAnswers({});
      setFocusIdx(0);
      setPhase("scan");
    } catch {
      toast.error("Could not generate HPI template. Check your connection.");
      setPhase("idle");
    }
  };

  useEffect(() => {
    if (phase === "scan") setTimeout(() => panelRef.current?.focus(), 60);
  }, [phase]);

  const handleKey = useCallback((e) => {
    if (phase !== "scan") return;
    const sym = symptoms[focusIdx];
    if (!sym) return;

    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, symptoms.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === "Escape")    { finishScan(answers); return; }
    if (e.key === "Backspace" && !answers[sym.id]) { setFocusIdx(i => Math.max(i - 1, 0)); return; }

    if (sym.type === "yesno") {
      if (e.key === "y" || e.key === "Y" || e.key === "Enter") {
        const a = { ...answers, [sym.id]: "yes" }; setAnswers(a); advance(a, focusIdx);
      } else if (e.key === "n" || e.key === "N") {
        const a = { ...answers, [sym.id]: "no" }; setAnswers(a); advance(a, focusIdx);
      } else if (e.key === " ") {
        e.preventDefault();
        const a = { ...answers, [sym.id]: "skip" }; setAnswers(a); advance(a, focusIdx);
      }
    } else if (sym.type === "scale") {
      if (/^[0-9]$/.test(e.key)) {
        const a = { ...answers, [sym.id]: `${e.key}/10` }; setAnswers(a); advance(a, focusIdx);
      }
    } else if (sym.type === "choice" && sym.opts) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= sym.opts.length) {
        const a = { ...answers, [sym.id]: sym.opts[n - 1] }; setAnswers(a); advance(a, focusIdx);
      } else if (e.key === " ") {
        e.preventDefault();
        const a = { ...answers, [sym.id]: "skip" }; setAnswers(a); advance(a, focusIdx);
      }
    }
  }, [phase, symptoms, focusIdx, answers, advance, finishScan]);

  // ── idle / loading ──────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "loading") {
    return (
      <div className="hpi-idle">
        <div className="hpi-cc-row">
          <span className="hpi-field-lbl">Chief Complaint</span>
          <span className="hpi-cc-val">
            {cc.text || <span className="hpi-muted">Not set — navigate to CC first (Cmd+2)</span>}
          </span>
        </div>
        {cc.text && (
          <button className="hpi-gen-btn" onClick={generateSymptoms} disabled={phase === "loading"}>
            {phase === "loading" ? (
              <><span className="hpi-spinner">⏳</span> Generating symptom checklist…</>
            ) : (
              <><span>✦</span> Generate AI Symptom Template</>
            )}
          </button>
        )}
        {cc.hpi && (
          <div style={{ marginTop: 24 }}>
            <div className="hpi-field-lbl">Current HPI</div>
            <textarea
              className="hpi-ta"
              value={narrative}
              onChange={e => { setNarrative(e.target.value); setCC(prev => ({ ...prev, hpi: e.target.value })); }}
              rows={6}
            />
          </div>
        )}
        <div className="hpi-kbd-legend">
          <span className="hpi-kbd-item"><kbd>↑↓</kbd> Navigate</span>
          <span className="hpi-kbd-item"><kbd>Y</kbd> Present</span>
          <span className="hpi-kbd-item"><kbd>N</kbd> Absent</span>
          <span className="hpi-kbd-item"><kbd>Space</kbd> Skip</span>
          <span className="hpi-kbd-item"><kbd>0-9</kbd> Scale / option</span>
          <span className="hpi-kbd-item"><kbd>Esc</kbd> Build narrative</span>
        </div>
      </div>
    );
  }

  // ── scan phase ──────────────────────────────────────────────────────────────
  if (phase === "scan") {
    const done = Object.keys(answers).filter(k => answers[k] !== "skip").length;
    const pct  = symptoms.length ? Math.round((Object.keys(answers).length / symptoms.length) * 100) : 0;
    return (
      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} className="hpi-scan" style={{ outline: "none" }}>
        <div className="hpi-scan-hdr">
          <div className="hpi-scan-hdr-left">
            <span className="hpi-cc-val">{cc.text}</span>
            <span className="hpi-prog">{Object.keys(answers).length} / {symptoms.length}</span>
          </div>
          <div className="hpi-scan-bar-wrap">
            <div className="hpi-scan-bar" style={{ width: pct + "%" }} />
          </div>
          <div className="hpi-hint-strip">
            <kbd>↑↓</kbd> nav &nbsp;·&nbsp;
            <kbd>Y</kbd> yes &nbsp;·&nbsp;
            <kbd>N</kbd> no &nbsp;·&nbsp;
            <kbd>Space</kbd> skip &nbsp;·&nbsp;
            <kbd>0-9</kbd> scale/option &nbsp;·&nbsp;
            <kbd>Esc</kbd> done
          </div>
        </div>

        <div className="hpi-sym-list">
          {symptoms.map((sym, i) => {
            const ans    = answers[sym.id];
            const active = i === focusIdx;
            return (
              <div
                key={sym.id}
                className={`hpi-sym-row${active ? " active" : ""}${ans ? " answered" : ""}`}
                onClick={() => setFocusIdx(i)}
              >
                <div className="hpi-sym-idx">{String(i + 1).padStart(2, "0")}</div>
                <div className="hpi-sym-body">
                  <div className="hpi-sym-label">{sym.label}
                    {sym.type === "scale" && <span className="hpi-type-badge">scale</span>}
                    {sym.type === "yesno" && <span className="hpi-type-badge">Y/N</span>}
                    {sym.type === "choice" && <span className="hpi-type-badge">choice</span>}
                  </div>
                  {active && sym.hint && <div className="hpi-sym-hint">{sym.hint}</div>}
                  {active && sym.type === "choice" && sym.opts && (
                    <div className="hpi-sym-opts">
                      {sym.opts.map((opt, oi) => (
                        <span key={opt} className="hpi-opt-chip">
                          <span className="hpi-opt-key">{oi + 1}</span>{opt}
                        </span>
                      ))}
                    </div>
                  )}
                  {active && sym.type === "scale" && (
                    <div className="hpi-sym-opts">
                      {[0,1,2,3,4,5,6,7,8,9].map(n => (
                        <span key={n} className="hpi-opt-chip hpi-opt-scale">
                          <span className="hpi-opt-key">{n}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {active && sym.type === "yesno" && (
                    <div className="hpi-sym-opts">
                      <span className="hpi-opt-chip"><span className="hpi-opt-key">Y</span>Present</span>
                      <span className="hpi-opt-chip"><span className="hpi-opt-key">N</span>Absent</span>
                      <span className="hpi-opt-chip"><span className="hpi-opt-key">Space</span>Skip</span>
                    </div>
                  )}
                </div>
                <div className="hpi-sym-ans" style={{ color: answerColor(ans) }}>
                  {answerLabel(sym, ans)}
                </div>
                <div className={`hpi-sym-dot${ans && ans !== "skip" ? " done" : ans === "skip" ? " skip" : ""}`} />
              </div>
            );
          })}
        </div>

        <div className="hpi-scan-footer">
          <button className="hpi-done-btn" onClick={() => finishScan(answers)}>
            Build Narrative ({done} answered) &rarr;
          </button>
          <button className="hpi-ghost-btn" onClick={() => setPhase("idle")}>&#8635; Restart</button>
        </div>
      </div>
    );
  }

  // ── narrative phase ─────────────────────────────────────────────────────────
  return (
    <div className="hpi-narrative">
      <div className="hpi-narr-hdr">
        <span className="hpi-cc-val">{cc.text}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="hpi-ghost-btn" onClick={() => setPhase("scan")}>&#8592; Edit Answers</button>
          <button className="hpi-ghost-btn" onClick={() => setPhase("idle")}>&#8635; Restart</button>
          {onAdvance && (
            <button className="hpi-done-btn" onClick={onAdvance}>
              Continue to ROS &rarr;
            </button>
          )}
        </div>
      </div>
      {onAdvance && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-blue)", background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.2)", borderRadius:4, padding:"1px 6px" }}>⌘ Enter</kbd>
          <span style={{ fontSize:11, color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif" }}>Continue to ROS</span>
        </div>
      )}
      <div className="hpi-field-lbl" style={{ marginBottom: 8 }}>HPI Narrative — edit freely</div>
      <textarea
        className="hpi-ta"
        value={narrative}
        autoFocus
        onChange={e => { setNarrative(e.target.value); setCC(prev => ({ ...prev, hpi: e.target.value })); }}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onAdvance?.(); } }}
        rows={7}
      />
      <div className="hpi-badge-row">
        {symptoms.filter(s => answers[s.id] && answers[s.id] !== "skip").map(sym => (
          <div key={sym.id} className="hpi-badge" style={{ borderColor: answerColor(answers[sym.id]) + "44", color: answerColor(answers[sym.id]) }}>
            <span className="hpi-badge-label">{sym.label}</span>
            <span className="hpi-badge-val">{answerLabel(sym, answers[sym.id])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function NewPatientInput() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTab, setCurrentTab] = useState(
    () => new URLSearchParams(window.location.search).get("tab") || "demo"
  );
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab) setCurrentTab(tab);
  }, [location.search]);

  const [activeGroup, setActiveGroup] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") || "demo";
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === tab)) return group;
    }
    return "register";
  });

  const [navDots, setNavDots] = useState(() => {
    const m = {};
    ALL_SECTIONS.forEach(s => (m[s.section] = s.dot));
    return m;
  });

  // ── Door-time counter (mounts when intake begins) ───────────────────────
  const arrivalTimeRef = useRef(Date.now());
  const [doorTime, setDoorTime] = useState("0m");
  useEffect(() => {
    const update = () => {
      const mins = Math.floor((Date.now() - arrivalTimeRef.current) / 60000);
      const h = Math.floor(mins / 60), m = mins % 60;
      setDoorTime(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Patient data ─────────────────────────────────────────────────────────
  const [demo, setDemo]           = useState({ firstName:"", lastName:"", age:"", dob:"", sex:"", mrn:"", insurance:"", insuranceId:"", address:"", city:"", phone:"", email:"", emerg:"", height:"", weight:"", lang:"", notes:"", pronouns:"" });
  const [cc, setCC]               = useState({ text:"", onset:"", duration:"", severity:"", quality:"", radiation:"", aggravate:"", relieve:"", assoc:"", hpi:"" });
  const [vitals, setVitals]       = useState({});
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [pmhSelected, setPmhSelected] = useState({});
  const [pmhExtra, setPmhExtra]   = useState("");
  const [surgHx, setSurgHx]       = useState("");
  const [famHx, setFamHx]         = useState("");
  const [socHx, setSocHx]         = useState("");
  const [rosState, setRosState]   = useState({});
  const [rosSymptoms, setRosSymptoms] = useState({});
  const [rosNotes, setRosNotes]   = useState({});
  const [peState, setPeState]     = useState({});
  const [peFindings, setPeFindings] = useState({});
  const [selectedCC, setSelectedCC] = useState(-1);
  const [parseText, setParseText] = useState("");
  const [parsing, setParsing]     = useState(false);
  const [pmhExpanded, setPmhExpanded] = useState({ cardio: true, endo: true });
  const [avpu, setAvpu]           = useState("");
  const [o2del, setO2del]         = useState("");
  const [pain, setPain]           = useState("");
  const [triage, setTriage]       = useState("");
  const [esiLevel, setEsiLevel]   = useState("");
  const [registration, setRegistration] = useState({ mrn:"", room:"" });
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ── AI state ─────────────────────────────────────────────────────────────
  const [aiOpen, setAiOpen]       = useState(false);
  const [aiMsgs, setAiMsgs]       = useState([{ role:"sys", text:"Notrya AI ready — select a quick action or ask a clinical question." }]);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [history, setHistory]     = useState([]);
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior:"smooth" });
  }, [aiMsgs, aiLoading]);

  useEffect(() => {
    if (aiOpen) setTimeout(() => inputRef.current?.focus(), 280);
  }, [aiOpen]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape" && aiOpen) setAiOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aiOpen]);

  // ── navDots ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setNavDots(prev => ({
      ...prev,
      demo:  (demo.firstName || demo.lastName || demo.age) ? "done"    : "empty",
      cc:    cc.text                                        ? "done"    : "empty",
      vit:   (vitals.bp || vitals.hr)                       ? "done"    : "empty",
      meds:  (medications.length || allergies.length)       ? "done"    : "empty",
      hpi:   cc.hpi ? "done" : cc.text                      ? "partial" : "empty",
      ros:   Object.keys(rosState).length > 3 ? "done" : Object.keys(rosState).length > 0 ? "partial" : "empty",
      pe:    Object.keys(peState).length  > 3 ? "done" : Object.keys(peState).length  > 0 ? "partial" : "empty",
    }));
  }, [
    demo.firstName, demo.lastName, demo.age,
    cc.text, cc.hpi, vitals.bp, vitals.hr,
    medications.length, allergies.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.keys(rosState).length, Object.keys(peState).length,
  ]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const selectGroup = useCallback((group) => {
    setActiveGroup(group);
    const items = NAV_DATA[group];
    // Note group has only one section — go there directly
    if (items.length === 1) { navigate(`/NewPatientInput?tab=${items[0].section}`); return; }
    const target = items.find(i => i.section === currentTab) ? currentTab : items[0].section;
    navigate(`/NewPatientInput?tab=${target}`);
  }, [currentTab, navigate]);

  const selectSection = useCallback((sectionId) => {
    navigate(`/NewPatientInput?tab=${sectionId}`);
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === sectionId)) { setActiveGroup(group); break; }
    }
  }, [navigate]);

  const getGroupBadge = useCallback((groupKey) => {
    const items = NAV_DATA[groupKey];
    if (items.every(i => navDots[i.section] === "done")) return "done";
    if (items.some(i => navDots[i.section] === "done" || navDots[i.section] === "partial")) return "partial";
    return "empty";
  }, [navDots]);

  // Returns " abn" | " warn" | "" for vital colour coding
  const vitalClass = (key, raw) => {
    if (!raw || raw === "—") return "";
    const src = key === "bp" ? String(raw).split("/")[0] : raw;
    const n = parseFloat(src);
    if (isNaN(n)) return "";
    if (key === "hr")   return n > 110 || n < 50 ? " abn" : n > 90 || n < 55 ? " warn" : "";
    if (key === "rr")   return n > 22  || n < 8  ? " abn" : n > 20 || n < 10 ? " warn" : "";
    if (key === "spo2") return n < 90  ? " abn" : n < 94  ? " warn" : "";
    if (key === "temp") return n > 39.5 || n < 35.5 ? " abn" : n > 38 || n < 36 ? " warn" : "";
    if (key === "bp")   return n > 180 || n < 80  ? " abn" : n > 140 || n < 90 ? " warn" : "";
    return "";
  };

  const toggleAI = useCallback(() => {
    setAiOpen(o => { if (!o) setUnread(0); return !o; });
  }, []);

  // ── Save chart ────────────────────────────────────────────────────────────
  const handleSaveChart = useCallback(async () => {
    try {
      const payload = {
        raw_note: parseText || `Patient ${[demo.firstName,demo.lastName].filter(Boolean).join(" ")||"New Patient"} presenting with ${cc.text||"unspecified complaint"}`,
        patient_name:    [demo.firstName,demo.lastName].filter(Boolean).join(" ")||"New Patient",
        patient_id:      registration.mrn||demo.mrn||"",
        patient_age:     demo.age||"",
        patient_gender:  demo.sex?.toLowerCase()==="male"?"male":demo.sex?.toLowerCase()==="female"?"female":"other",
        date_of_birth:   demo.dob||"",
        chief_complaint: cc.text||"",
        history_of_present_illness: cc.hpi||"",
        medications, allergies, status:"draft",
        registration_mrn: registration.mrn||"", registration_room: registration.room||"",
        triage_esi_level: esiLevel||"",
      };
      const created = await base44.entities.ClinicalNote.create(payload);
      toast.success("Patient saved!");
      navigate(`/ClinicalNoteStudio?noteId=${created.id}`, {
        state: { patientData: { demo,cc,vitals,medications,allergies,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration } },
      });
    } catch (e) { toast.error("Failed to save: " + e.message); }
  }, [demo,cc,vitals,medications,allergies,parseText,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration,navigate]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && SHORTCUT_MAP[e.key]) { e.preventDefault(); selectSection(SHORTCUT_MAP[e.key]); return; }
      if (mod && e.shiftKey && e.key === "e") {
        e.preventDefault();
        navigate("/ClinicalNoteStudio", { state: { patientData: { demo,cc,vitals,medications,allergies,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration } } });
        return;
      }
      if (mod && e.shiftKey && e.key === "s") { e.preventDefault(); handleSaveChart(); return; }
      if (mod && e.shiftKey && e.key === "n") { e.preventDefault(); navigate("/NewPatientInput?tab=demo"); return; }
      if (e.key === "?" && !mod && !["INPUT","TEXTAREA"].includes(e.target.tagName)) {
        e.preventDefault(); setShowShortcuts(s => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectSection,navigate,handleSaveChart,demo,cc,vitals,medications,allergies,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration]);

  // ── AI send ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || aiLoading) return;
    setAiMsgs(m => [...m, { role:"user", text:text.trim() }]);
    setAiInput(""); setAiLoading(true);
    const ctx = buildPatientCtx(demo,cc,vitals,allergies,pmhSelected,currentTab);
    setHistory(h => [...h, { role:"user", content: ctx+"\n\n"+text.trim() }]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: SYSTEM_PROMPT+"\n\nPATIENT CONTEXT:\n"+ctx+"\n\nPHYSICIAN QUESTION:\n"+text.trim() });
      const reply = typeof res === "string" ? res : JSON.stringify(res);
      setHistory(h => [...h, { role:"assistant", content:reply }]);
      setAiMsgs(m => [...m, { role:"bot", text:reply }]);
      setAiOpen(open => { if (!open) setUnread(u => u+1); return open; });
    } catch {
      setAiMsgs(m => [...m, { role:"sys", text:"\u26a0 Connection error \u2014 please try again." }]);
    } finally { setAiLoading(false); }
  }, [aiLoading,history,currentTab,demo,cc,vitals,allergies,pmhSelected]);

  const handleAIKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(aiInput); } };

  const renderMsg = text =>
    text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,'<strong style="color:#00e5c0">$1</strong>');

  const smartParse = async () => {
    if (!parseText.trim()) { toast.error("Please enter some text to parse."); return; }
    setParsing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured patient data from the following text. Return ONLY valid JSON.\nText: ${parseText}`,
        response_json_schema: { type:"object", properties:{ firstName:{type:"string"},lastName:{type:"string"},age:{type:"string"},sex:{type:"string"},dob:{type:"string"},cc:{type:"string"},onset:{type:"string"},duration:{type:"string"},severity:{type:"string"},quality:{type:"string"},bp:{type:"string"},hr:{type:"string"},rr:{type:"string"},spo2:{type:"string"},temp:{type:"string"},gcs:{type:"string"},medications:{type:"array",items:{type:"string"}},allergies:{type:"array",items:{type:"string"}},pmh:{type:"array",items:{type:"string"}} } },
      });
      setDemo(prev => ({ ...prev, firstName:result.firstName||prev.firstName, lastName:result.lastName||prev.lastName, age:result.age||prev.age, sex:result.sex||prev.sex, dob:result.dob||prev.dob }));
      setCC(prev => ({ ...prev, text:result.cc||prev.text, onset:result.onset||prev.onset, duration:result.duration||prev.duration, severity:result.severity||prev.severity, quality:result.quality||prev.quality }));
      setVitals(prev => ({ ...prev, bp:result.bp||prev.bp||"", hr:result.hr||prev.hr||"", rr:result.rr||prev.rr||"", spo2:result.spo2||prev.spo2||"", temp:result.temp||prev.temp||"", gcs:result.gcs||prev.gcs||"" }));
      (result.medications||[]).forEach(m => { if (m) setMedications(p => p.includes(m)?p:[...p,m]); });
      (result.allergies||[]).forEach(a => { if (a) setAllergies(p => p.includes(a)?p:[...p,a]); });
      toast.success("Patient data extracted!");
    } catch { toast.error("Could not parse automatically."); }
    setParsing(false);
  };

  const patientName = [demo.firstName,demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const currentItem = ALL_SECTIONS.find(s => s.section === currentTab);
  const pageAbbr    = currentItem?.abbr || "Np";
  const subItems    = NAV_DATA[activeGroup] || [];

  const renderContent = () => {
    switch (currentTab) {
      case "demo":       return <DemoTab demo={demo} setDemo={setDemo} parseText={parseText} setParseText={setParseText} parsing={parsing} onSmartParse={smartParse} esiLevel={esiLevel} setEsiLevel={setEsiLevel} registration={registration} setRegistration={setRegistration} onAdvance={() => selectSection("cc")} />;
      case "cc":         return <CCTab cc={cc} setCC={setCC} selectedCC={selectedCC} setSelectedCC={setSelectedCC} onAdvance={() => selectSection("vit")} />;
      case "vit":        return <VitalsTab vitals={vitals} setVitals={setVitals} avpu={avpu} setAvpu={setAvpu} o2del={o2del} setO2del={setO2del} pain={pain} setPain={setPain} triage={triage} setTriage={setTriage} onAdvance={() => selectSection("meds")} />;
      case "meds":       return <MedsTab medications={medications} setMedications={setMedications} allergies={allergies} setAllergies={setAllergies} pmhSelected={pmhSelected} setPmhSelected={setPmhSelected} pmhExtra={pmhExtra} setPmhExtra={setPmhExtra} surgHx={surgHx} setSurgHx={setSurgHx} famHx={famHx} setFamHx={setFamHx} socHx={socHx} setSocHx={setSocHx} pmhExpanded={pmhExpanded} setPmhExpanded={setPmhExpanded} onAdvance={() => selectSection("hpi")} />;
      case "hpi":        return <InlineHPITab cc={cc} setCC={setCC} onAdvance={() => selectSection("ros")} />;
      case "ros":        return <ROSTab onStateChange={setRosState} chiefComplaint={cc.text} onAdvance={() => selectSection("pe")} />;
      case "pe":         return <PETab peState={peState} setPeState={setPeState} peFindings={peFindings} setPeFindings={setPeFindings} onAdvance={() => selectSection("mdm")} />;
      case "mdm":        return <ClinicalNoteStudio demo={demo} cc={cc} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} pmhExtra={pmhExtra} surgHx={surgHx} famHx={famHx} socHx={socHx} rosState={rosState} peState={peState} peFindings={peFindings} esiLevel={esiLevel} registration={registration} onSave={handleSaveChart} />;
      case "chart":      return <ClinicalNoteStudio demo={demo} cc={cc} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} pmhExtra={pmhExtra} surgHx={surgHx} famHx={famHx} socHx={socHx} rosState={rosState} peState={peState} peFindings={peFindings} esiLevel={esiLevel} registration={registration} onSave={handleSaveChart} />;
      case "discharge":  return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><DischargePlanning embedded patientName={patientName} patientAge={demo.age} patientSex={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} /></div>;
      case "erx":        return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><ERxHub embedded navigate={navigate} patientAllergiesFromParent={allergies} patientWeightFromParent={vitals.weight||""} /></div>;
      case "orders":     return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><EDOrders embedded patientName={patientName} patientAllergies={allergies} chiefComplaint={cc.text} patientAge={demo.age} patientSex={demo.sex} /></div>;
      case "results":    return <ResultsViewer patientName={patientName} patientMrn={registration.mrn||demo.mrn} patientAge={demo.age} patientSex={demo.sex} allergies={allergies} chiefComplaint={cc.text} vitals={vitals} />;
      case "autocoder":  return <AutoCoderTab patientName={patientName} patientMrn={demo.mrn} patientDob={demo.dob} patientAge={demo.age} patientGender={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} rosState={rosState} rosSymptoms={rosSymptoms} peState={peState} peFindings={peFindings} />;
      case "procedures": return <EDProcedureNotes embedded patientName={patientName} patientAllergies={allergies.join(", ")} physicianName="" />;
      case "medref":     return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"auto"   }}><MedicationReferencePage embedded /></div>;
      case "erplan":     return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden" }}><ERPlanBuilder embedded patientName={patientName} patientAge={demo.age} patientSex={demo.sex} patientCC={cc.text} patientVitals={vitals} patientAllergies={allergies} patientMedications={medications} /></div>;
      default:           return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* TOP BAR */}
      <header className="npi-top-bar">
        <div className="npi-top-row-1">
          <span className="npi-dr-label">Dr. Skiba <span className="npi-dr-role">ED</span></span>
          <div className="npi-vsep" />
          <div className="npi-stat"><span className="npi-stat-val">0</span><span className="npi-stat-lbl">Active</span></div>
          <div className="npi-stat"><span className="npi-stat-val alert">14</span><span className="npi-stat-lbl">Pending</span></div>
          <div className="npi-vsep" />
          <button className="npi-tb-link" onClick={() => navigate("/EDTrackingBoard")}>🏥 Track Board</button>
          <div className="npi-top-right">
            <button className={`npi-ai-btn${aiOpen?" open":""}`} onClick={toggleAI} title="Notrya AI">
              <div className="npi-ai-dot" /> AI
              {unread > 0 && <span className="npi-ai-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>
            <button className="npi-new-pt" onClick={() => navigate("/NewPatientInput?tab=demo")}>+ New Patient</button>
            <Link to="/AppSettings" className="npi-tb-settings" title="Settings">⚙️</Link>
          </div>
        </div>
        <div className="npi-top-row-2">
          {/* MRN badge — amber unregistered, teal once assigned */}
          <span className={`npi-chart-badge${registration.mrn ? " registered" : ""}`}>
            {registration.mrn || "PT-NEW"}
          </span>
          {/* Patient name — dominant safety identifier */}
          <span className="npi-pt-name">{patientName}</span>
          {/* Door-to-present timer */}
          <span className="npi-door-time" title="Time since intake started">⏱ {doorTime}</span>
          {/* Allergy — two distinct visual states */}
          <div className={`npi-allergy-wrap${allergies.length > 0 ? " has-allergies" : ""}`}
               onClick={() => selectSection("meds")} title="Click to view/edit medications">
            {allergies.length === 0
              ? <span className="npi-allergy-nka">✓ NKA</span>
              : <span className="npi-allergy-alert">
                  ⚠ {allergies.slice(0, 2).join(" · ")}{allergies.length > 2 ? ` +${allergies.length - 2}` : ""}
                </span>
            }
          </div>
          {/* Action buttons */}
          <div className="npi-top-acts">
            <button className="npi-btn-ghost" onClick={() => selectSection("orders")}>+ Order</button>
            <button className="npi-btn-ghost" onClick={() => selectSection("orders")} title="Request consultation">👥 Consult</button>
            <button className="npi-btn-coral" onClick={() => selectSection("discharge")}>🚪 Discharge</button>
            <button className="npi-btn-primary" onClick={handleSaveChart}>✍ Sign & Save</button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="npi-main-wrap">
        <main className="npi-content">{renderContent()}</main>
        <CDSAlertsSidebar medications={medications} allergies={allergies} vitals={vitals} pmhSelected={pmhSelected} age={demo.age} cc={cc.text} />
      </div>

      {/* AI SCRIM */}
      <div className={`npi-scrim${aiOpen?" open":""}`} onClick={toggleAI} />      {/* AI CHAT OVERLAY */}
      <div className={`npi-overlay${aiOpen?" open":""}`}>
        <div className="npi-n-hdr">
          <div className="npi-n-hdr-top">
            <div className="npi-n-avatar">🤖</div>
            <div className="npi-n-hdr-info">
              <div className="npi-n-hdr-name">Notrya AI</div>
              <div className="npi-n-hdr-sub"><span className="dot" /> Clinical assistant · online</div>
            </div>
            <button className="npi-n-close" onClick={toggleAI}>✕</button>
          </div>
          <div className="npi-n-quick">
            {QUICK_ACTIONS.map(q => (
              <button key={q.label} className="npi-n-qbtn" onClick={() => sendMessage(q.prompt)} disabled={aiLoading}>
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        </div>
        <div className="npi-n-msgs" ref={msgsRef}>
          {aiMsgs.map((m, i) => (
            <div key={i} className={`npi-n-msg ${m.role}`} dangerouslySetInnerHTML={{ __html: renderMsg(m.text) }} />
          ))}
          {aiLoading && <div className="npi-n-dots"><span /><span /><span /></div>}
        </div>
        <div className="npi-n-input-bar">
          <textarea ref={inputRef} className="npi-n-ta" rows={1} placeholder="Ask anything…" value={aiInput}
            onChange={e => setAiInput(e.target.value)} onKeyDown={handleAIKey} disabled={aiLoading}
            onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,90)+"px"; }}
          />
          <button className="npi-n-send" onClick={() => sendMessage(aiInput)} disabled={aiLoading||!aiInput.trim()}>↑</button>
        </div>
      </div>

      {/* SHORTCUT ? FAB */}
      <button className="npi-sc-hint-fab" title="Keyboard shortcuts (?)" onClick={() => setShowShortcuts(s=>!s)}>?</button>

      {/* SHORTCUT OVERLAY */}
      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={{ position:"fixed",inset:0,zIndex:99998,background:"rgba(3,8,16,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#081628",border:"1px solid #1a3555",borderRadius:16,padding:"24px 28px",width:520,maxWidth:"90vw",boxShadow:"0 24px 80px rgba(0,0,0,.6)" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <span style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#fff" }}>Keyboard Shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} style={{ background:"#0e2544",border:"1px solid #1a3555",borderRadius:6,width:28,height:28,color:"#7aa0c0",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            </div>
            {[
              { section:"Navigate to section", rows:[["Cmd 1","Demographics"],["Cmd 2","Chief Complaint"],["Cmd 3","Vitals"],["Cmd 4","Meds & PMH"],["Cmd 5","HPI"],["Cmd 6","ROS"],["Cmd 7","Physical Exam"],["Cmd 8","Clinical Note"],["Cmd 9","Orders"],["Cmd 0","Discharge"]] },
              { section:"HPI (scan mode)", rows:[["Y / Enter","Symptom present"],["N","Symptom absent"],["Space","Skip symptom"],["0-9","Pain scale or option #"],["Arrow Up/Down","Navigate rows"],["Backspace","Go back one row"],["Esc","Finish & build narrative"]] },
              { section:"Actions", rows:[["Cmd Shift E","Open Note Studio"],["Cmd Shift S","Save Chart"],["Cmd Shift N","New Patient"],["?","Toggle shortcuts"]] },
            ].map(({ section, rows }) => (
              <div key={section} style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#5a82a8",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{section}</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px" }}>
                  {rows.map(([key,desc]) => (
                    <div key={key} style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#b8d4f0",background:"#0e2544",border:"1px solid #1a3555",borderRadius:4,padding:"1px 7px",flexShrink:0,whiteSpace:"nowrap" }}>{key}</span>
                      <span style={{ fontSize:11,color:"#82aece" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop:8,paddingTop:12,borderTop:"1px solid #1a3555",fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#5a82a8",textAlign:"center" }}>press ? to dismiss</div>
          </div>
        </div>
      )}

      {/* WORKFLOW RAIL — left vertical nav replacing bottom bar */}
      <aside className="npi-wf-rail">
        {/* Patient card header — always visible in the rail */}
        <div className="npi-wf-pt">
          <div className="npi-wf-pt-name">{patientName}</div>
          <div className="npi-wf-pt-meta">
            {demo.age && <span>{demo.age}y {demo.sex ? `· ${demo.sex}` : ""}</span>}
            {cc.text && <span className="npi-wf-pt-cc">{cc.text}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
            {esiLevel && (
              <span className="npi-wf-esi" style={{
                color: esiLevel<=2?"var(--npi-coral)":esiLevel===3?"var(--npi-orange)":"var(--npi-teal)",
                borderColor: `rgba(${esiLevel<=2?"255,107,107":esiLevel===3?"255,159,67":"0,229,192"},.3)`,
                background: `rgba(${esiLevel<=2?"255,107,107":esiLevel===3?"255,159,67":"0,229,192"},.08)`,
              }}>ESI {esiLevel}</span>
            )}
            {registration.room && (
              <span className="npi-wf-esi" style={{ color:"var(--npi-teal)", borderColor:"rgba(0,229,192,.3)", background:"rgba(0,229,192,.08)" }}>
                Rm {registration.room}
              </span>
            )}
          </div>
          {/* Vitals strip — always visible, colour-coded */}
          <div className="npi-wf-vitals">
            {[
              { key:"bp",   lbl:"BP",   val: vitals.bp   || "—" },
              { key:"hr",   lbl:"HR",   val: vitals.hr   || "—" },
              { key:"rr",   lbl:"RR",   val: vitals.rr   || "—" },
              { key:"spo2", lbl:"SpO₂", val: vitals.spo2 || "—" },
              { key:"temp", lbl:"T",    val: vitals.temp || "—" },
            ].map(v => (
              <div key={v.key} className="npi-wf-v-row">
                <span className="npi-wf-v-lbl">{v.lbl}</span>
                <span className={`npi-wf-v-val${vitalClass(v.key, v.val)}`}>{v.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5 workflow group sections */}
        {GROUP_META.map(g => {
          const isActive = g.key === activeGroup;
          const items    = NAV_DATA[g.key] || [];
          const badge    = getGroupBadge(g.key);
          return (
            <div key={g.key} className="npi-wf-group">
              {/* Group header */}
              <button
                className={`npi-wf-gh${isActive ? " active" : ""}${g.key === "note" ? " note-grp" : ""}`}
                onClick={() => selectGroup(g.key)}
              >
                <span className="npi-wf-gh-icon">{g.icon}</span>
                <span className="npi-wf-gh-label">{g.label}</span>
                <span className={`npi-wf-gh-badge ${badge}`} />
              </button>

              {/* Section list — only when this group is active */}
              {isActive && (
                <div className="npi-wf-items">
                  {g.key === "note" ? (
                    /* Note group: upstream readiness chips + keyboard hints */
                    <>
                      {[
                        { id:"reg",  label:"Register",     done: !!(demo.firstName||demo.lastName) && !!cc.text && (!!vitals.bp||!!vitals.hr) },
                        { id:"asmt", label:"Assessment",   done: !!(cc.hpi) && Object.keys(rosState).length > 0 && Object.keys(peState).length > 0 },
                        { id:"note", label:"Clinical Note", active: true },
                      ].map(chip => (
                        <div key={chip.id}
                          className={`npi-wf-chip${chip.active ? " active" : chip.done ? " done" : " todo"}`}
                          onClick={() => !chip.active && selectGroup(chip.id === "reg" ? "register" : "assess")}
                          style={{ cursor: chip.active ? "default" : "pointer" }}
                        >
                          <span className="npi-wf-chip-icon">{chip.active ? "📄" : chip.done ? "✓" : "○"}</span>
                          <span>{chip.label}</span>
                        </div>
                      ))}
                      <div className="npi-wf-note-kbd">
                        {[["⌘D","Impression"],["⌘M","MDM"],["⌘G","Generate"]].map(([k,d]) => (
                          <span key={k}><kbd>{k}</kbd>{d}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Standard groups: section buttons */
                    items.map(item => (
                      <button key={item.section}
                        className={`npi-wf-item${item.section === currentTab ? " active" : ""}`}
                        onClick={() => item.href ? navigate(item.href) : selectSection(item.section)}
                      >
                        <span className="npi-wf-item-icon">{item.icon}</span>
                        <span className="npi-wf-item-label">{item.label}</span>
                        <span className={`npi-wf-item-dot ${navDots[item.section]||"empty"}`} />
                        {SECTION_SHORTCUT[item.section] && (
                          <span className="npi-wf-item-sc">⌘{SECTION_SHORTCUT[item.section]}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </aside>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --npi-bg:#050f1e;--npi-panel:#081628;--npi-card:#0b1e36;--npi-up:#0e2544;
  --npi-bd:#1a3555;--npi-bhi:#2a4f7a;--npi-blue:#3b9eff;--npi-teal:#00e5c0;
  --npi-gold:#f5c842;--npi-coral:#ff6b6b;--npi-orange:#ff9f43;--npi-purple:#9b6dff;
  --npi-txt:#ffffff;--npi-txt2:#d0e8ff;--npi-txt3:#a8c8e8;--npi-txt4:#7aa0c0;
  --npi-wf:190px;--npi-top:88px;
}

.npi-tb-settings{font-size:16px;color:var(--npi-txt4);text-decoration:none;padding:4px 6px;border-radius:6px;transition:all .15s;display:flex;align-items:center;justify-content:center}
.npi-tb-settings:hover{color:var(--npi-txt2);background:var(--npi-up)}

.npi-top-bar{position:fixed;top:0;left:var(--npi-wf);right:0;height:var(--npi-top);background:var(--npi-panel);border-bottom:1px solid var(--npi-bd);z-index:200;display:flex;flex-direction:column}
.npi-top-row-1{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid rgba(26,53,85,.5)}
.npi-dr-label{font-size:12px;font-weight:500;color:var(--npi-txt2);white-space:nowrap;flex-shrink:0}
.npi-dr-role{font-size:10px;font-weight:400;color:var(--npi-txt4);margin-left:3px}
.npi-tb-link{background:none;border:1px solid var(--npi-bd);border-radius:6px;padding:3px 9px;font-size:11px;color:var(--npi-txt3);cursor:pointer;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px}
.npi-tb-link:hover{border-color:var(--npi-bhi);color:var(--npi-txt2);background:var(--npi-up)}
.npi-ai-btn{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--npi-teal);cursor:pointer;position:relative;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-ai-btn:hover{background:rgba(0,229,192,.15)}
.npi-ai-btn.open{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.4);color:var(--npi-coral)}
.npi-ai-dot{width:6px;height:6px;border-radius:50%;background:var(--npi-teal);animation:npi-ai-pulse 2s ease-in-out infinite;flex-shrink:0}
.npi-ai-btn.open .npi-ai-dot{background:var(--npi-coral);animation:none}
.npi-ai-badge{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;background:var(--npi-coral);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--npi-panel);padding:0 3px}
.npi-vsep{width:1px;height:20px;background:var(--npi-bd);flex-shrink:0}
.npi-stat{display:flex;align-items:center;gap:5px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;padding:3px 10px;cursor:pointer}
.npi-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--npi-txt)}
.npi-stat-val.alert{color:var(--npi-gold)}
.npi-stat-lbl{font-size:9px;color:var(--npi-txt3);text-transform:uppercase;letter-spacing:.04em}
.npi-top-right{margin-left:auto;display:flex;align-items:center;gap:6px}

@keyframes npi-ai-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.npi-new-pt{background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s;white-space:nowrap}
.npi-new-pt:hover{filter:brightness(1.15)}
.npi-top-row-2{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.npi-chart-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:rgba(255,159,67,.08);border:1px solid rgba(255,159,67,.3);border-radius:20px;padding:1px 8px;color:var(--npi-orange);white-space:nowrap;flex-shrink:0}
.npi-chart-badge.registered{background:rgba(59,158,255,.08);border-color:rgba(59,158,255,.3);color:var(--npi-blue)}
.npi-pt-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--npi-txt);white-space:nowrap;flex-shrink:0;letter-spacing:-.01em}
.npi-door-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4);white-space:nowrap;flex-shrink:0;letter-spacing:.02em}
.npi-allergy-wrap{display:flex;align-items:center;cursor:pointer;flex-shrink:0;transition:opacity .15s}
.npi-allergy-wrap:hover{opacity:.85}
.npi-allergy-nka{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;color:var(--npi-teal);background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.2);border-radius:6px;padding:2px 8px;white-space:nowrap}
.npi-allergy-alert{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#fff;background:var(--npi-coral);border:1px solid rgba(255,107,107,.5);border-radius:6px;padding:3px 10px;white-space:nowrap;animation:npi-allergy-pulse 3s ease-in-out infinite}
@keyframes npi-allergy-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,.3)}50%{box-shadow:0 0 0 4px rgba(255,107,107,0)}}
.npi-top-acts{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.npi-btn-ghost{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--npi-txt2);cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-btn-ghost:hover{border-color:var(--npi-bhi);color:var(--npi-txt)}
.npi-btn-primary{background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:filter .15s;font-family:'DM Sans',sans-serif}
.npi-btn-primary:hover{filter:brightness(1.15)}
.npi-btn-coral{background:rgba(255,107,107,.15);color:var(--npi-coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-btn-coral:hover{background:rgba(255,107,107,.25)}


.npi-main-wrap{position:fixed;top:var(--npi-top);left:var(--npi-wf);right:0;bottom:0;display:flex;background:var(--npi-bg)}
.npi-content{flex:1;overflow-y:auto;padding:18px 28px 24px;display:flex;flex-direction:column;gap:18px;min-height:0}

/* ── WORKFLOW RAIL (replaces bottom nav) ─────────────────────────────────── */
.npi-wf-rail{position:fixed;top:0;left:0;bottom:0;width:var(--npi-wf);background:var(--npi-panel);border-right:1px solid var(--npi-bd);z-index:250;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden}
.npi-wf-rail::-webkit-scrollbar{width:3px}
.npi-wf-rail::-webkit-scrollbar-thumb{background:var(--npi-bd);border-radius:2px}

/* Patient card — top of rail, flexible height to fit vitals */
.npi-wf-pt{flex-shrink:0;padding:10px 12px 8px;display:flex;flex-direction:column;gap:3px;border-bottom:1px solid var(--npi-bd);background:rgba(8,22,40,.8)}
.npi-wf-pt-name{font-family:'Playfair Display',serif;font-size:13px;font-weight:600;color:var(--npi-txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.npi-wf-pt-meta{display:flex;flex-direction:column;gap:2px}
.npi-wf-pt-meta span{font-size:10px;color:var(--npi-txt4);font-family:'DM Sans',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.npi-wf-pt-cc{color:var(--npi-teal) !important;font-size:10px !important}
.npi-wf-esi{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 7px;border-radius:4px;border:1px solid;align-self:flex-start}
.npi-wf-vitals{margin-top:6px;padding-top:6px;border-top:1px solid rgba(26,53,85,.5);display:flex;flex-direction:column;gap:3px}
.npi-wf-v-row{display:flex;align-items:center;justify-content:space-between;gap:4px}
.npi-wf-v-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);flex-shrink:0;min-width:32px}
.npi-wf-v-val{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--npi-txt2)}
.npi-wf-v-val.warn{color:var(--npi-orange)}
.npi-wf-v-val.abn{color:var(--npi-coral);animation:npi-glow-red 2s ease-in-out infinite}
@keyframes npi-glow-red{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.3)}50%{text-shadow:0 0 8px rgba(255,107,107,.8)}}

/* Group container */
.npi-wf-group{border-bottom:1px solid rgba(26,53,85,.5);flex-shrink:0}

/* Group header button */
.npi-wf-gh{width:100%;display:flex;align-items:center;gap:8px;padding:9px 12px;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;position:relative;text-align:left}
.npi-wf-gh:hover{background:rgba(255,255,255,.03)}
.npi-wf-gh.active{background:rgba(59,158,255,.05)}
.npi-wf-gh.active::before{content:'';position:absolute;left:0;top:7px;bottom:7px;width:3px;background:var(--npi-blue);border-radius:0 2px 2px 0}
.npi-wf-gh.note-grp.active{background:rgba(0,229,192,.05)}
.npi-wf-gh.note-grp.active::before{background:var(--npi-teal)}
.npi-wf-gh-icon{font-size:14px;flex-shrink:0;line-height:1}
.npi-wf-gh-label{font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--npi-txt4);flex:1;transition:color .15s}
.npi-wf-gh:hover .npi-wf-gh-label{color:var(--npi-txt3)}
.npi-wf-gh.active .npi-wf-gh-label{color:var(--npi-blue)}
.npi-wf-gh.note-grp.active .npi-wf-gh-label{color:var(--npi-teal)}
.npi-wf-gh-badge{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.npi-wf-gh-badge.done{background:var(--npi-teal);box-shadow:0 0 4px rgba(0,229,192,.4)}
.npi-wf-gh-badge.partial{background:var(--npi-orange)}
.npi-wf-gh-badge.empty{background:transparent;border:1.5px solid rgba(26,53,85,.8)}

/* Section item buttons */
.npi-wf-items{padding:2px 0 6px}
.npi-wf-item{width:100%;display:flex;align-items:center;gap:7px;padding:6px 12px 6px 22px;background:none;border:none;cursor:pointer;transition:all .12s;font-family:'DM Sans',sans-serif;text-align:left;position:relative}
.npi-wf-item:hover{background:rgba(255,255,255,.025)}
.npi-wf-item.active{background:rgba(59,158,255,.08)}
.npi-wf-item.active::before{content:'';position:absolute;left:10px;top:50%;transform:translateY(-50%);width:2px;height:12px;background:var(--npi-blue);border-radius:1px}
.npi-wf-item-icon{font-size:12px;flex-shrink:0;opacity:.65;line-height:1}
.npi-wf-item-label{font-size:11px;color:var(--npi-txt3);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .12s;line-height:1.2}
.npi-wf-item.active .npi-wf-item-label,.npi-wf-item:hover .npi-wf-item-label{color:var(--npi-txt2)}
.npi-wf-item.active .npi-wf-item-label{font-weight:500;color:var(--npi-txt)}
.npi-wf-item-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.npi-wf-item-dot.done{background:var(--npi-teal);box-shadow:0 0 3px rgba(0,229,192,.4)}
.npi-wf-item-dot.partial{background:var(--npi-orange)}
.npi-wf-item-dot.empty{background:transparent;border:1px solid rgba(122,160,192,.4)}
.npi-wf-item-sc{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:0 4px;opacity:0;transition:opacity .12s;flex-shrink:0}
.npi-wf-item:hover .npi-wf-item-sc{opacity:1}

/* Note group chips */
.npi-wf-chip{display:flex;align-items:center;gap:7px;padding:6px 12px 6px 14px;font-size:11px;font-family:'DM Sans',sans-serif;margin:2px 6px;border-radius:7px;transition:all .12s;border:1px solid transparent}
.npi-wf-chip.active{color:var(--npi-teal);background:rgba(0,229,192,.08);border-color:rgba(0,229,192,.2);font-weight:600}
.npi-wf-chip.done{color:var(--npi-teal);background:rgba(0,229,192,.04);border-color:rgba(0,229,192,.12)}
.npi-wf-chip.todo{color:var(--npi-txt4)}
.npi-wf-chip.todo:hover{color:var(--npi-txt2);background:var(--npi-up);border-color:var(--npi-bd)}
.npi-wf-chip-icon{font-size:12px;flex-shrink:0;line-height:1}
.npi-wf-note-kbd{padding:6px 14px 8px;display:flex;flex-direction:column;gap:5px}
.npi-wf-note-kbd span{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);display:flex;align-items:center;gap:5px}
.npi-wf-note-kbd kbd{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:0 5px;color:var(--npi-blue);font-family:'JetBrains Mono',monospace;font-size:9px}

.npi-scrim{position:fixed;inset:0;z-index:9997;background:rgba(3,8,16,.4);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .3s}
.npi-scrim.open{opacity:1;pointer-events:auto}
.npi-overlay{position:fixed;bottom:24px;right:24px;z-index:9998;width:330px;height:500px;background:#081628;border:1px solid var(--npi-bd);border-radius:18px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);opacity:0;transform:translateY(20px) scale(.94);pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1)}
.npi-overlay.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.npi-n-hdr{padding:14px 14px 10px;flex-shrink:0;border-bottom:1px solid var(--npi-bd);background:linear-gradient(180deg,rgba(0,229,192,.05) 0%,transparent 100%)}
.npi-n-hdr-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.npi-n-avatar{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--npi-teal),var(--npi-blue));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.npi-n-hdr-info{flex:1}
.npi-n-hdr-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--npi-txt)}
.npi-n-hdr-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt3);margin-top:2px;display:flex;align-items:center;gap:4px}
.npi-n-hdr-sub .dot{width:5px;height:5px;border-radius:50%;background:var(--npi-teal)}
.npi-n-close{width:28px;height:28px;border-radius:7px;border:1px solid var(--npi-bd);background:var(--npi-up);color:var(--npi-txt3);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
.npi-n-close:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}
.npi-n-quick{display:flex;flex-wrap:wrap;gap:4px}
.npi-n-qbtn{padding:4px 10px;border-radius:20px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;background:var(--npi-up);border:1px solid var(--npi-bd);color:var(--npi-txt2);display:flex;align-items:center;gap:4px}
.npi-n-qbtn:hover{border-color:rgba(0,229,192,.4);color:var(--npi-teal);background:rgba(0,229,192,.06)}
.npi-n-qbtn:disabled{opacity:.4;cursor:not-allowed}
.npi-n-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:7px}
.npi-n-msgs::-webkit-scrollbar{width:4px}
.npi-n-msgs::-webkit-scrollbar-thumb{background:var(--npi-bd);border-radius:2px}
.npi-n-msg{padding:9px 12px;border-radius:11px;font-size:12px;line-height:1.6;max-width:88%;font-family:'DM Sans',sans-serif}
.npi-n-msg.sys{background:rgba(14,37,68,.6);color:var(--npi-txt3);border:1px solid rgba(26,53,85,.5);align-self:center;max-width:100%;text-align:center;font-size:11px;font-style:italic;border-radius:7px}
.npi-n-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.22);color:var(--npi-txt);align-self:flex-end;border-radius:12px 12px 3px 12px}
.npi-n-msg.bot{background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.15);color:var(--npi-txt);align-self:flex-start;border-radius:12px 12px 12px 3px}
.npi-n-dots{display:flex;gap:5px;padding:10px 12px;align-self:flex-start;align-items:center}
.npi-n-dots span{width:6px;height:6px;border-radius:50%;background:var(--npi-teal);animation:npi-bounce 1.2s ease-in-out infinite}
.npi-n-dots span:nth-child(2){animation-delay:.15s}
.npi-n-dots span:nth-child(3){animation-delay:.3s}
@keyframes npi-bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-6px);opacity:1}}
.npi-n-input-bar{padding:9px 12px 14px;flex-shrink:0;border-top:1px solid var(--npi-bd);display:flex;gap:7px;align-items:flex-end}
.npi-n-ta{flex:1;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:10px;padding:8px 11px;color:var(--npi-txt);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;resize:none;min-height:36px;max-height:90px;line-height:1.5;transition:border-color .2s}
.npi-n-ta:focus{border-color:var(--npi-teal)}
.npi-n-ta::placeholder{color:var(--npi-txt4)}
.npi-n-ta:disabled{opacity:.5}
.npi-n-send{width:36px;height:36px;flex-shrink:0;background:linear-gradient(135deg,var(--npi-teal),#00b4d8);border:none;border-radius:10px;color:var(--npi-bg);font-size:17px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.npi-n-send:hover{transform:scale(1.08)}
.npi-n-send:disabled{opacity:.4;cursor:not-allowed;transform:none}

.npi-sc-hint-fab{position:fixed;bottom:76px;left:10px;z-index:9990;width:26px;height:26px;border-radius:50%;background:var(--npi-up);border:1px solid var(--npi-bd);color:var(--npi-txt4);font-size:12px;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
.npi-sc-hint-fab:hover{border-color:var(--npi-bhi);color:var(--npi-txt2);background:var(--npi-card)}

/* ── INLINE HPI TAB ─────────────────────────────────────────────────────── */
.hpi-idle,.hpi-scan,.hpi-narrative{display:flex;flex-direction:column;gap:16px;max-width:780px;font-family:'DM Sans',sans-serif}
.hpi-cc-row{display:flex;align-items:baseline;gap:12px;padding:14px 16px;background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.2);border-radius:10px}
.hpi-field-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);text-transform:uppercase;letter-spacing:.1em;flex-shrink:0}
.hpi-cc-val{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--npi-txt)}
.hpi-muted{color:var(--npi-txt4);font-family:'DM Sans',sans-serif;font-size:13px;font-style:italic}
.hpi-gen-btn{display:flex;align-items:center;gap:8px;padding:12px 22px;background:linear-gradient(135deg,rgba(0,229,192,.15),rgba(59,158,255,.1));border:1px solid rgba(0,229,192,.35);border-radius:10px;color:var(--npi-teal);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;align-self:flex-start}
.hpi-gen-btn:hover{background:linear-gradient(135deg,rgba(0,229,192,.25),rgba(59,158,255,.18));transform:translateY(-1px)}
.hpi-gen-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.hpi-ta{width:100%;padding:12px 14px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:8px;color:var(--npi-txt);font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.65;resize:vertical;outline:none;transition:border-color .2s;box-sizing:border-box}
.hpi-ta:focus{border-color:var(--npi-blue)}
.hpi-kbd-legend{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;background:rgba(14,37,68,.5);border:1px solid var(--npi-bd);border-radius:8px}
.hpi-kbd-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--npi-txt4)}
.hpi-kbd-item kbd{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--npi-up);border:1px solid var(--npi-bhi);border-radius:4px;padding:1px 6px;color:var(--npi-blue)}

.hpi-scan-hdr{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;background:rgba(14,37,68,.6);border:1px solid var(--npi-bd);border-radius:10px;flex-shrink:0}
.hpi-scan-hdr-left{display:flex;align-items:center;gap:10px;flex:1}
.hpi-prog{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--npi-teal);background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.25);border-radius:20px;padding:1px 9px}
.hpi-scan-bar-wrap{width:100%;height:3px;background:var(--npi-bd);border-radius:2px;overflow:hidden}
.hpi-scan-bar{height:100%;background:linear-gradient(90deg,var(--npi-teal),var(--npi-blue));border-radius:2px;transition:width .3s}
.hpi-hint-strip{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4)}
.hpi-hint-strip kbd{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:0 4px;color:var(--npi-blue)}

.hpi-sym-list{display:flex;flex-direction:column;gap:3px;flex:1;overflow-y:auto;max-height:50vh}
.hpi-sym-row{display:flex;align-items:flex-start;gap:12px;padding:10px 14px;border-radius:8px;cursor:pointer;transition:all .15s;border:1px solid transparent}
.hpi-sym-row:hover{background:rgba(255,255,255,.03)}
.hpi-sym-row.active{background:rgba(59,158,255,.08);border-color:rgba(59,158,255,.25)}
.hpi-sym-row.answered{opacity:.75}
.hpi-sym-idx{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4);width:22px;flex-shrink:0;padding-top:2px}
.hpi-sym-body{flex:1;display:flex;flex-direction:column;gap:6px}
.hpi-sym-label{font-size:13px;font-weight:500;color:var(--npi-txt);display:flex;align-items:center;gap:7px}
.hpi-type-badge{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px}
.hpi-sym-hint{font-size:11px;color:var(--npi-txt4);font-style:italic}
.hpi-sym-opts{display:flex;flex-wrap:wrap;gap:5px}
.hpi-opt-chip{display:flex;align-items:center;gap:4px;padding:3px 10px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;font-size:11px;color:var(--npi-txt2);cursor:pointer;transition:all .15s}
.hpi-opt-scale{padding:3px 7px;min-width:32px;justify-content:center}
.hpi-opt-key{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:var(--npi-blue);background:rgba(59,158,255,.12);border-radius:3px;padding:0 4px;margin-right:2px}
.hpi-sym-ans{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;flex-shrink:0;min-width:70px;text-align:right;padding-top:2px}
.hpi-sym-dot{width:8px;height:8px;border-radius:50%;border:1.5px solid var(--npi-bd);flex-shrink:0;margin-top:4px;transition:all .2s}
.hpi-sym-dot.done{background:var(--npi-teal);border-color:var(--npi-teal);box-shadow:0 0 5px rgba(0,229,192,.4)}
.hpi-sym-dot.skip{background:var(--npi-txt4);border-color:var(--npi-txt4)}

.hpi-scan-footer{display:flex;gap:10px;align-items:center;padding-top:4px}
.hpi-done-btn{padding:9px 20px;background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:filter .15s}
.hpi-done-btn:hover{filter:brightness(1.1)}
.hpi-ghost-btn{padding:8px 14px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:8px;color:var(--npi-txt3);font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .15s}
.hpi-ghost-btn:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}

.hpi-narr-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}
.hpi-badge-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.hpi-badge{display:flex;align-items:center;gap:7px;padding:4px 11px;border-radius:20px;border:1px solid;font-size:11px}
.hpi-badge-label{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.07em;opacity:.7}
.hpi-badge-val{font-weight:600;font-size:11px}
`;