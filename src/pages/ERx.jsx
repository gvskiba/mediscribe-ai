import React, { useState, useRef, useEffect, useCallback } from "react";
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
import DischargePlanning from "@/pages/DischargePlanning";
import EDProcedureNotes from "@/pages/EDProcedureNotes";
import MedicationReferencePage from "@/pages/MedicationReference";
import ERPlanBuilder from "@/pages/ERPlanBuilder";
import ResultsViewer from "@/pages/ResultsViewer";
import CDSAlertsSidebar from "@/components/npi/CDSAlertsSidebar";
import ERxHub from "@/pages/ERx";
import ClinicalNoteStudio from "@/components/npi/ClinicalNoteStudio";
import ReassessmentTab from "@/components/npi/ReassessmentTab";
import ClinicalTimeline from "@/components/npi/ClinicalTimeline";
import InlineHPITab from "@/components/npi/InlineHPITab";
import OrdersPanel from "@/components/npi/OrdersPanel";
import { NPI_CSS } from "@/components/npi/npiStyles";

// ─── NAV DATA ─────────────────────────────────────────────────────────────────
const NAV_DATA = {
  register: [
    { section: "demo",       icon: "👤", label: "Demographics",      abbr: "Dm", dot: "empty" },
    { section: "cc",         icon: "💬", label: "Chief Complaint",   abbr: "Cc", dot: "empty" },
    { section: "vit",        icon: "📈", label: "Vitals",            abbr: "Vt", dot: "empty" },
    { section: "meds",       icon: "💊", label: "Meds & PMH",        abbr: "Rx", dot: "empty" },
  ],
  assess: [
    { section: "hpi",        icon: "📝", label: "HPI",               abbr: "Hp", dot: "empty" },
    { section: "ros",        icon: "🔍", label: "Review of Systems", abbr: "Rs", dot: "empty" },
    { section: "pe",         icon: "🩺", label: "Physical Exam",     abbr: "Pe", dot: "empty" },
  ],
  note: [
    { section: "chart",      icon: "📄", label: "Clinical Note",     abbr: "Cn", dot: "empty" },
  ],
  orders: [
    { section: "orders",     icon: "📋", label: "Orders",            abbr: "Or", dot: "empty" },
    { section: "erx",        icon: "💉", label: "eRx",               abbr: "Ex", dot: "empty" },
    { section: "erplan",     icon: "🗺️", label: "ER Plan Builder",   abbr: "Ep", dot: "empty" },
    { section: "procedures", icon: "✂️", label: "Procedures",        abbr: "Pr", dot: "empty" },
  ],
  close: [
    { section: "reassess",   icon: "🔄", label: "Reassessment",      abbr: "Ra", dot: "empty" },
    { section: "timeline",   icon: "⏱",  label: "Timeline",          abbr: "Tl", dot: "empty" },
    { section: "discharge",  icon: "🚪", label: "Discharge",         abbr: "Dc", dot: "empty" },
    { section: "results",    icon: "🧪", label: "Results",           abbr: "Re", dot: "empty", href: "/Results"     },
    { section: "autocoder",  icon: "🤖", label: "AutoCoder",         abbr: "Ac", dot: "empty" },
    { section: "medref",     icon: "🧬", label: "ED Med Ref",        abbr: "Mr", dot: "empty" },
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
  { icon: "📋", label: "Summarise", prompt: "Summarise what I have entered so far."                  },
  { icon: "🔍", label: "Check",     prompt: "What am I missing? Check my entries for completeness." },
  { icon: "📝", label: "Draft Note",prompt: "Generate a draft note from the data entered."           },
  { icon: "🧠", label: "DDx",       prompt: "Suggest differential diagnoses based on current data." },
];

const ROS_RAIL_SYSTEMS = [
  { id: "const",   icon: "🌡️", label: "Constitutional"    },
  { id: "heent",   icon: "👁️", label: "HEENT"             },
  { id: "cv",      icon: "❤️", label: "Cardiovascular"    },
  { id: "resp",    icon: "🫁", label: "Respiratory"       },
  { id: "gi",      icon: "🫃", label: "GI / Abdomen"      },
  { id: "gu",      icon: "🔵", label: "Genitourinary"     },
  { id: "msk",     icon: "🦴", label: "MSK"               },
  { id: "neuro",   icon: "🧠", label: "Neurological"      },
  { id: "psych",   icon: "🧘", label: "Psychiatric"       },
  { id: "skin",    icon: "🩹", label: "Skin"              },
  { id: "endo",    icon: "⚗️", label: "Endocrine"         },
  { id: "heme",    icon: "🩸", label: "Heme / Lymph"      },
  { id: "allergy", icon: "🌿", label: "Allergic / Immuno" },
];
const PE_RAIL_SYSTEMS = [
  { id: "gen",   icon: "🧍", label: "General"        },
  { id: "heent", icon: "👁️", label: "HEENT"          },
  { id: "neck",  icon: "🔵", label: "Neck"           },
  { id: "cv",    icon: "❤️", label: "Cardiovascular" },
  { id: "resp",  icon: "🫁", label: "Respiratory"    },
  { id: "abd",   icon: "🫃", label: "Abdomen"        },
  { id: "msk",   icon: "🦴", label: "MSK"            },
  { id: "neuro", icon: "🧠", label: "Neurological"   },
  { id: "skin",  icon: "🩹", label: "Skin"           },
  { id: "psych", icon: "🧘", label: "Psychiatric"    },
];

const SYSTEM_PROMPT =
  "You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2-4 concise, actionable sentences. Be direct. Never fabricate data.";

// ─── PATIENT CONTEXT BUILDER ──────────────────────────────────────────────────
function buildPatientCtx(demo, cc, vitals, allergies, pmhSelected, currentTab) {
  const name = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).join(", ") || "none";
  return [
    `Patient: ${name}, ${demo.age || "?"}${demo.sex ? " " + demo.sex : ""}.`,
    cc.text     ? `CC: ${cc.text}.`                                                                   : null,
    vitals.bp   ? `BP ${vitals.bp}  HR ${vitals.hr || "-"}  SpO2 ${vitals.spo2 || "-"}  T ${vitals.temp || "-"}.` : null,
    allergies.length ? `Allergies: ${allergies.join(", ")}.`                                          : "Allergies: NKDA.",
    pmhList !== "none" ? `PMH: ${pmhList}.`                                                           : null,
    cc.hpi      ? `HPI summary: ${cc.hpi.slice(0, 200)}.`                                             : null,
    `Active section: ${currentTab}.`,
  ].filter(Boolean).join(" ");
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
    const m = {}; ALL_SECTIONS.forEach(s => (m[s.section] = s.dot)); return m;
  });

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

  const [demo, setDemo]               = useState({ firstName:"", lastName:"", age:"", dob:"", sex:"", mrn:"", insurance:"", insuranceId:"", address:"", city:"", phone:"", email:"", emerg:"", height:"", weight:"", lang:"", notes:"", pronouns:"" });
  const [cc, setCC]                   = useState({ text:"", onset:"", duration:"", severity:"", quality:"", radiation:"", aggravate:"", relieve:"", assoc:"", hpi:"" });
  const [vitals, setVitals]           = useState({});
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies]     = useState([]);
  const [pmhSelected, setPmhSelected] = useState({});
  const [pmhExtra, setPmhExtra]       = useState("");
  const [surgHx, setSurgHx]           = useState("");
  const [famHx, setFamHx]             = useState("");
  const [socHx, setSocHx]             = useState("");
  const [rosState, setRosState]       = useState({});
  const [rosSymptoms, setRosSymptoms] = useState({});
  const [rosNotes, setRosNotes]       = useState({});
  const [peState, setPeState]         = useState({});
  const [peFindings, setPeFindings]   = useState({});
  const [selectedCC, setSelectedCC]   = useState(-1);
  const [parseText, setParseText]     = useState("");
  const [parsing, setParsing]         = useState(false);
  const [pmhExpanded, setPmhExpanded] = useState({ cardio: true, endo: true });
  const [avpu, setAvpu]               = useState("");
  const [o2del, setO2del]             = useState("");
  const [pain, setPain]               = useState("");
  const [triage, setTriage]           = useState("");
  const [esiLevel, setEsiLevel]       = useState("");
  const [registration, setRegistration] = useState({ mrn:"", room:"" });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [rosActiveSystem, setRosActiveSystem] = useState(0);
  const [peActiveSystem,  setPeActiveSystem]  = useState(0);
  const [reassessState,   setReassessState]   = useState({});
  const [clinicalTimeline, setClinicalTimeline] = useState({});

  const [providerName, setProviderName] = useState("Provider");
  const [providerRole, setProviderRole] = useState("ED");
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth?.me?.();
        if (me) {
          const full = [me.first_name, me.last_name].filter(Boolean).join(" ");
          if (full) setProviderName(full);
          if (me.role) setProviderRole(me.role);
        }
      } catch (_) {}
    })();
  }, []);

  const ASSESS_SECTIONS = ["hpi", "ros", "pe"];
  const prevTabRef = useRef(null);
  const [resumeSection, setResumeSection] = useState(null);
  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev && ASSESS_SECTIONS.includes(prev) && !ASSESS_SECTIONS.includes(currentTab)) setResumeSection(prev);
    if (ASSESS_SECTIONS.includes(currentTab)) setResumeSection(null);
    prevTabRef.current = currentTab;
  }, [currentTab]); // eslint-disable-line

  const [aiOpen, setAiOpen]       = useState(false);
  const [aiMsgs, setAiMsgs]       = useState([{ role:"sys", text:"Notrya AI ready — select a quick action or ask a clinical question." }]);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [history, setHistory]     = useState([]);
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior:"smooth" }); }, [aiMsgs, aiLoading]);
  useEffect(() => { if (aiOpen) setTimeout(() => inputRef.current?.focus(), 280); }, [aiOpen]);
  useEffect(() => {
    const h = e => { if (e.key === "Escape" && aiOpen) setAiOpen(false); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [aiOpen]);

  useEffect(() => {
    setNavDots(prev => ({
      ...prev,
      demo:     (demo.firstName || demo.lastName || demo.age) ? "done"    : "empty",
      cc:       cc.text                                        ? "done"    : "empty",
      vit:      (vitals.bp || vitals.hr)                       ? "done"    : "empty",
      meds:     (medications.length || allergies.length)       ? "done"    : "empty",
      hpi:      cc.hpi ? "done" : cc.text                      ? "partial" : "empty",
      ros:      Object.keys(rosState).length > 3 ? "done" : Object.keys(rosState).length > 0 ? "partial" : "empty",
      pe:       Object.keys(peState).length  > 3 ? "done" : Object.keys(peState).length  > 0 ? "partial" : "empty",
      reassess: reassessState.condition ? "done" : reassessState.note ? "partial" : "empty",
      timeline: clinicalTimeline?.times?.departed ? "done" : clinicalTimeline?.times?.disposition ? "partial" : "empty",
    }));
  }, [
    demo.firstName, demo.lastName, demo.age, cc.text, cc.hpi, vitals.bp, vitals.hr,
    medications.length, allergies.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.keys(rosState).length, Object.keys(peState).length,
    reassessState.condition, reassessState.note,
    clinicalTimeline?.times?.departed, clinicalTimeline?.times?.disposition,
  ]);

  const selectGroup = useCallback((group) => {
    setActiveGroup(group);
    const items = NAV_DATA[group];
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

  const vitalClass = (key, raw) => {
    if (!raw || raw === "\u2014") return "";
    const src = key === "bp" ? String(raw).split("/")[0] : raw;
    const n = parseFloat(src); if (isNaN(n)) return "";
    if (key === "hr")   return n > 110 || n < 50  ? " abn" : n > 90  || n < 55 ? " warn" : "";
    if (key === "rr")   return n > 22  || n < 8   ? " abn" : n > 20  || n < 10 ? " warn" : "";
    if (key === "spo2") return n < 90              ? " abn" : n < 94            ? " warn" : "";
    if (key === "temp") return n > 39.5 || n < 35.5 ? " abn" : n > 38 || n < 36 ? " warn" : "";
    if (key === "bp")   return n > 180 || n < 80  ? " abn" : n > 140 || n < 90 ? " warn" : "";
    return "";
  };

  const getRosSysDot = (sysId) => {
    const st = rosState[sysId]; if (!st) return "empty";
    return st === "has-positives" ? "partial" : "done";
  };
  const getPeSysDot = (sysId) => {
    const st = peState[sysId]; if (!st) return "empty";
    return (st === "has-positives" || st === "abnormal" || st === "mixed") ? "partial" : "done";
  };

  const toggleAI = useCallback(() => { setAiOpen(o => { if (!o) setUnread(0); return !o; }); }, []);

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
      await base44.entities.ClinicalNote.create(payload);
      toast.success("Chart signed and saved.");
      navigate("/EDTrackingBoard");
    } catch (e) { toast.error("Failed to save: " + e.message); }
  }, [demo,cc,vitals,medications,allergies,parseText,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration,navigate]);

  useEffect(() => {
    const handler = e => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && SHORTCUT_MAP[e.key]) { e.preventDefault(); selectSection(SHORTCUT_MAP[e.key]); return; }
      if (mod && e.shiftKey && e.key === "s") { e.preventDefault(); handleSaveChart(); return; }
      if (mod && e.shiftKey && e.key === "n") { e.preventDefault(); navigate("/NewPatientInput?tab=demo"); return; }
      if (e.key === "?" && !mod && !["INPUT","TEXTAREA"].includes(e.target.tagName)) {
        e.preventDefault(); setShowShortcuts(s => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectSection,navigate,handleSaveChart,demo,cc,vitals,medications,allergies,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration]);

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

  const renderContent = () => {
    switch (currentTab) {
      case "demo":       return <DemoTab demo={demo} setDemo={setDemo} parseText={parseText} setParseText={setParseText} parsing={parsing} onSmartParse={smartParse} esiLevel={esiLevel} setEsiLevel={setEsiLevel} registration={registration} setRegistration={setRegistration} onAdvance={() => selectSection("cc")} />;
      case "cc":         return <CCTab cc={cc} setCC={setCC} selectedCC={selectedCC} setSelectedCC={setSelectedCC} onAdvance={() => selectSection("vit")} />;
      case "vit":        return <VitalsTab vitals={vitals} setVitals={setVitals} avpu={avpu} setAvpu={setAvpu} o2del={o2del} setO2del={setO2del} pain={pain} setPain={setPain} triage={triage} setTriage={setTriage} onAdvance={() => selectSection("meds")} />;
      case "meds":       return <MedsTab medications={medications} setMedications={setMedications} allergies={allergies} setAllergies={setAllergies} pmhSelected={pmhSelected} setPmhSelected={setPmhSelected} pmhExtra={pmhExtra} setPmhExtra={setPmhExtra} surgHx={surgHx} setSurgHx={setSurgHx} famHx={famHx} setFamHx={setFamHx} socHx={socHx} setSocHx={setSocHx} pmhExpanded={pmhExpanded} setPmhExpanded={setPmhExpanded} onAdvance={() => selectSection("hpi")} />;
      case "hpi":        return <InlineHPITab cc={cc} setCC={setCC} onAdvance={() => selectSection("ros")} />;
      case "ros":        return <ROSTab onStateChange={setRosState} chiefComplaint={cc.text} onAdvance={() => selectSection("pe")} extSysIdx={rosActiveSystem} onSysChange={setRosActiveSystem} />;
      case "pe":         return <PETab peState={peState} setPeState={setPeState} peFindings={peFindings} setPeFindings={setPeFindings} onAdvance={() => selectSection("chart")} extSysIdx={peActiveSystem} onSysChange={setPeActiveSystem} chiefComplaint={cc.text} />;
      case "chart":      return <ClinicalNoteStudio demo={demo} cc={cc} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} pmhExtra={pmhExtra} surgHx={surgHx} famHx={famHx} socHx={socHx} rosState={rosState} peState={peState} peFindings={peFindings} esiLevel={esiLevel} registration={registration} onSave={handleSaveChart} />;
      case "reassess":   return <ReassessmentTab initialVitals={vitals} onStateChange={setReassessState} onAdvance={() => selectSection("timeline")} />;
      case "timeline":   return <ClinicalTimeline arrivalMs={arrivalTimeRef.current} onStateChange={setClinicalTimeline} />;
      case "discharge":  return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><DischargePlanning embedded patientName={patientName} patientAge={demo.age} patientSex={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} /></div>;
      case "erx":        return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><ERxHub embedded navigate={navigate} patientAllergiesFromParent={allergies} patientWeightFromParent={vitals.weight||""} /></div>;
      case "orders":     return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><OrdersPanel patientName={patientName} allergies={allergies} chiefComplaint={cc.text} patientAge={demo.age} patientSex={demo.sex} /></div>;
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
      <style>{NPI_CSS}</style>

      <header className="npi-top-bar">
        <div className="npi-top-row-1">
          <span className="npi-dr-label">
            {providerName.split(" ").length > 1 ? `Dr. ${providerName.split(" ").slice(-1)[0]}` : providerName}
            <span className="npi-dr-role">{providerRole}</span>
          </span>
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
          <span className={`npi-chart-badge${registration.mrn ? " registered" : ""}`}>{registration.mrn || "PT-NEW"}</span>
          <span className="npi-pt-name">{patientName}</span>
          {demo.dob && <span className="npi-pt-dob" title="Date of birth — second patient identifier">DOB {demo.dob}</span>}
          <span className="npi-door-time" title="Time since intake started">⏱ {doorTime}</span>
          <div className={`npi-allergy-wrap${allergies.length > 0 ? " has-allergies" : ""}`}
               onClick={() => selectSection("meds")} title="Click to view/edit medications">
            {allergies.length === 0
              ? <span className="npi-allergy-nka">✓ NKA</span>
              : <span className="npi-allergy-alert">⚠ {allergies.slice(0, 2).join(" · ")}{allergies.length > 2 ? ` +${allergies.length - 2}` : ""}</span>
            }
          </div>
          {resumeSection && (
            <button className="npi-resume-chip"
              onClick={() => { selectSection(resumeSection); setResumeSection(null); }} title="Return to where you were">
              ↩ Resume {ALL_SECTIONS.find(s => s.section === resumeSection)?.label || resumeSection}
              <span className="npi-resume-dismiss" onClick={e => { e.stopPropagation(); setResumeSection(null); }}>✕</span>
            </button>
          )}
          <div className="npi-top-acts">
            <button className="npi-btn-ghost" onClick={() => selectSection("orders")}>+ Order</button>
            <button className="npi-btn-ghost" onClick={() => selectSection("orders")} title="Request consultation">👥 Consult</button>
            <button className="npi-btn-coral" onClick={() => selectSection("discharge")}>🚪 Discharge</button>
            <button className="npi-btn-primary" onClick={handleSaveChart}>✍ Sign &amp; Save</button>
          </div>
        </div>
      </header>

      <div className="npi-main-wrap">
        <main className="npi-content">{renderContent()}</main>
        <CDSAlertsSidebar medications={medications} allergies={allergies} vitals={vitals} pmhSelected={pmhSelected} age={demo.age} cc={cc.text} />
      </div>

      <div className={`npi-scrim${aiOpen?" open":""}`} onClick={toggleAI} />
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

      <button className="npi-sc-hint-fab" title="Keyboard shortcuts (?)" onClick={() => setShowShortcuts(s=>!s)}>?</button>

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
              { section:"Actions", rows:[["Cmd Shift S","Save Chart"],["Cmd Shift N","New Patient"],["?","Toggle shortcuts"]] },
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

      <aside className="npi-wf-rail">
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
              <span className="npi-wf-esi" style={{ color:"var(--npi-teal)", borderColor:"rgba(0,229,192,.3)", background:"rgba(0,229,192,.08)" }}>Rm {registration.room}</span>
            )}
          </div>
          <div className="npi-wf-vitals">
            {[
              { key:"bp",   lbl:"BP",   val: vitals.bp   || "\u2014" },
              { key:"hr",   lbl:"HR",   val: vitals.hr   || "\u2014" },
              { key:"rr",   lbl:"RR",   val: vitals.rr   || "\u2014" },
              { key:"spo2", lbl:"SpO\u2082", val: vitals.spo2 || "\u2014" },
              { key:"temp", lbl:"T",    val: vitals.temp || "\u2014" },
            ].map(v => (
              <div key={v.key} className="npi-wf-v-row">
                <span className="npi-wf-v-lbl">{v.lbl}</span>
                <span className={`npi-wf-v-val${vitalClass(v.key, v.val)}`}>{v.val}</span>
              </div>
            ))}
          </div>
        </div>

        {GROUP_META.map(g => {
          const isActive = g.key === activeGroup;
          const items    = NAV_DATA[g.key] || [];
          const badge    = getGroupBadge(g.key);
          return (
            <div key={g.key} className="npi-wf-group">
              <button className={`npi-wf-gh${isActive ? " active" : ""}${g.key === "note" ? " note-grp" : ""}`} onClick={() => selectGroup(g.key)}>
                <span className="npi-wf-gh-icon">{g.icon}</span>
                <span className="npi-wf-gh-label">{g.label}</span>
                <span className={`npi-wf-gh-badge ${badge}`} />
              </button>
              {isActive && (
                <div className="npi-wf-items">
                  {g.key === "note" ? (
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
                    items.map(item => (
                      <React.Fragment key={item.section}>
                        <button className={`npi-wf-item${item.section === currentTab ? " active" : ""}`}
                          onClick={() => item.href ? navigate(item.href) : selectSection(item.section)}>
                          <span className="npi-wf-item-icon">{item.icon}</span>
                          <span className="npi-wf-item-label">{item.label}</span>
                          <span className={`npi-wf-item-dot ${navDots[item.section]||"empty"}`} />
                          {SECTION_SHORTCUT[item.section] && (
                            <span className="npi-wf-item-sc">⌘{SECTION_SHORTCUT[item.section]}</span>
                          )}
                        </button>
                        {item.section === "ros" && currentTab === "ros" && ROS_RAIL_SYSTEMS.map((sys, i) => (
                          <button key={sys.id} className={`npi-wf-sys-item${i === rosActiveSystem ? " active" : ""}`}
                            onClick={() => setRosActiveSystem(i)}>
                            <span className="npi-wf-sys-icon">{sys.icon}</span>
                            <span className="npi-wf-sys-label">{sys.label}</span>
                            <span className={`npi-wf-item-dot ${getRosSysDot(sys.id)}`} />
                          </button>
                        ))}
                        {item.section === "pe" && currentTab === "pe" && PE_RAIL_SYSTEMS.map((sys, i) => (
                          <button key={sys.id} className={`npi-wf-sys-item${i === peActiveSystem ? " active" : ""}`}
                            onClick={() => setPeActiveSystem(i)}>
                            <span className="npi-wf-sys-icon">{sys.icon}</span>
                            <span className="npi-wf-sys-label">{sys.label}</span>
                            <span className={`npi-wf-item-dot ${getPeSysDot(sys.id)}`} />
                          </button>
                        ))}
                      </React.Fragment>
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