import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  buildPatientCtx, SYSTEM_PROMPT, getTemplateForCC,
  ROS_RAIL_SYSTEMS, PE_RAIL_SYSTEMS, NAV_DATA, ALL_SECTIONS,
} from "@/components/npi/npiData";

// ─── Door-time clock ──────────────────────────────────────────────────────────
function useDoorTime(arrivalRef) {
  const [doorTime, setDoorTime] = useState("00:00");
  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Date.now() - arrivalRef.current;
      const m = Math.floor(elapsed / 60000);
      const s = Math.floor((elapsed % 60000) / 1000);
      setDoorTime(`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [arrivalRef]);
  return doorTime;
}

// ─── Message renderer (markdown-lite) ────────────────────────────────────────
function renderMsg(text) {
  return (text || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useNPIState(onToast) {
  const navigate = useNavigate();
  const arrivalTimeRef = useRef(Date.now());

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [currentTab,  setCurrentTab]  = useState("triage");
  const [activeGroup, setActiveGroup] = useState("intake");
  const [navDots,     setNavDots]     = useState({});
  const [resumeSection, setResumeSection] = useState(null);

  const selectSection = useCallback((section) => {
    const item = ALL_SECTIONS.find(s => s.section === section);
    if (item?.href) { navigate(item.href); return; }
    setCurrentTab(section);
    // find parent group
    for (const [g, items] of Object.entries(NAV_DATA)) {
      if (items.some(i => i.section === section)) { setActiveGroup(g); break; }
    }
  }, [navigate]);

  const selectGroup = useCallback((g) => {
    setActiveGroup(g);
    const first = NAV_DATA[g]?.[0];
    if (first) setCurrentTab(first.section);
  }, []);

  const getGroupBadge = useCallback((g) => {
    const items = NAV_DATA[g] || [];
    const dots  = items.map(i => navDots[i.section] || "empty");
    if (dots.every(d => d === "done"))  return "done";
    if (dots.some(d => d === "done" || d === "partial")) return "partial";
    return "empty";
  }, [navDots]);

  // ── Mark dots when state changes ────────────────────────────────────────────
  const markDot = useCallback((section, state) => {
    setNavDots(p => ({ ...p, [section]: state }));
  }, []);

  // ── Patient data ────────────────────────────────────────────────────────────
  const [demo,        setDemo]        = useState({ firstName:"", lastName:"", age:"", sex:"", dob:"", mrn:"", weight:"" });
  const [cc,          setCC]          = useState({ text:"", onset:"", hpi:"", severity:"", quality:"", radiation:"", associated:"", modifying:"" });
  const [vitals,      setVitals]      = useState({ bp:"", hr:"", rr:"", temp:"", spo2:"", weight:"", height:"" });
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies,   setAllergies]   = useState([]);
  const [pmhSelected, setPmhSelected] = useState({});
  const [pmhExtra,    setPmhExtra]    = useState("");
  const [surgHx,      setSurgHx]      = useState("");
  const [famHx,       setFamHx]       = useState("");
  const [socHx,       setSocHx]       = useState("");
  const [pmhExpanded, setPmhExpanded] = useState(false);
  const [rosState,    setRosState]    = useState({});
  const [rosSymptoms, setRosSymptoms] = useState({});
  const [rosNotes,    setRosNotes]    = useState({});
  const [peState,     setPeState]     = useState({});
  const [peFindings,  setPeFindings]  = useState({});
  const [selectedCC,  setSelectedCC]  = useState(null);

  // ── Triage ──────────────────────────────────────────────────────────────────
  const [triage,    setTriage]    = useState({});
  const [esiLevel,  setEsiLevel]  = useState(null);
  const [visitMode, setVisitMode] = useState("standard");
  const [avpu,      setAvpu]      = useState("");
  const [o2del,     setO2del]     = useState("");
  const [pain,      setPain]      = useState("");

  // ── Other clinical data ─────────────────────────────────────────────────────
  const [consults,      setConsults]      = useState([]);
  const [sdoh,          setSdoh]          = useState({});
  const [disposition,   setDisposition]   = useState("discharge");
  const [dispReason,    setDispReason]    = useState("");
  const [dispTime,      setDispTime]      = useState("");
  const [registration,  setRegistration]  = useState({ mrn:"", room:"", mode:"", insurance:"", fhirId:"" });
  const [sepsisBundle,  setSepsisBundle]  = useState({});
  const [pdmpState,     setPdmpState]     = useState({});
  const [isarState,     setIsarState]     = useState({});
  const [mdmState,      setMdmState]      = useState({ copa:"", dataLevel:"", risk:"", dataChecks:{}, copaRationale:"", riskRationale:"" });
  const [mdmDataElements, setMdmDataElements] = useState([]);
  const [reassessState,   setReassessState]   = useState({});
  const [clinicalTimeline, setClinicalTimeline] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [railCompact,   setRailCompact]   = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [cdsOpen,       setCdsOpen]       = useState(false);
  const [nursingOpen,   setNursingOpen]   = useState(false);
  const [mediaOpen,     setMediaOpen]     = useState(false);

  const [rosActiveSystem, setRosActiveSystem] = useState(0);
  const [peActiveSystem,  setPeActiveSystem]  = useState(0);

  const [nursingInterventions, setNursingInterventions] = useState([]);
  const [nursingNotes,         setNursingNotes]         = useState([]);
  const [attachments,          setAttachments]          = useState([]);

  // ── Provider ─────────────────────────────────────────────────────────────────
  const [providerName, setProviderName] = useState("Provider");
  const [providerRole, setProviderRole] = useState("MD");

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.full_name) setProviderName(u.full_name);
      if (u?.role)      setProviderRole(u.role.toUpperCase());
    }).catch(() => {});
  }, []);

  // ── Smart parse ──────────────────────────────────────────────────────────────
  const [parseText, setParseText] = useState("");
  const [parsing,   setParsing]   = useState(false);

  const smartParse = useCallback(async () => {
    if (!parseText.trim()) return;
    setParsing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract patient data from this clinical text. Return ONLY valid JSON with these keys (omit any key if not found):
firstName, lastName, age, sex (M/F/Other), dob (YYYY-MM-DD), mrn,
bp (e.g. "120/80"), hr, rr, temp, spo2, weight,
cc (chief complaint text),
allergies (array of strings),
medications (array of strings),
pmh (array of condition strings)

Clinical text:
${parseText}`,
        response_json_schema: {
          type:"object",
          properties: {
            firstName:{type:"string"}, lastName:{type:"string"}, age:{type:"string"},
            sex:{type:"string"}, dob:{type:"string"}, mrn:{type:"string"},
            bp:{type:"string"}, hr:{type:"string"}, rr:{type:"string"},
            temp:{type:"string"}, spo2:{type:"string"}, weight:{type:"string"},
            cc:{type:"string"},
            allergies:{type:"array", items:{type:"string"}},
            medications:{type:"array", items:{type:"string"}},
            pmh:{type:"array", items:{type:"string"}},
          }
        }
      });
      const d = typeof result === "string" ? JSON.parse(result) : result;
      if (d.firstName || d.lastName || d.age) {
        setDemo(p => ({ ...p, firstName: d.firstName||p.firstName, lastName: d.lastName||p.lastName, age: d.age||p.age, sex: d.sex||p.sex, dob: d.dob||p.dob, mrn: d.mrn||p.mrn }));
      }
      if (d.bp || d.hr || d.rr || d.temp || d.spo2) {
        setVitals(p => ({ ...p, bp: d.bp||p.bp, hr: d.hr||p.hr, rr: d.rr||p.rr, temp: d.temp||p.temp, spo2: d.spo2||p.spo2, weight: d.weight||p.weight }));
      }
      if (d.cc) setCC(p => ({ ...p, text: d.cc }));
      if (d.allergies?.length)   setAllergies(p   => [...new Set([...p, ...d.allergies])]);
      if (d.medications?.length) setMedications(p => [...new Set([...p, ...d.medications])]);
      if (d.pmh?.length)         setPmhSelected(p => { const n={...p}; d.pmh.forEach(c => { n[c]=true; }); return n; });
      onToast?.("Chart parsed successfully", "success");
      setParseText("");
    } catch(e) {
      onToast?.("Parse failed: " + e.message, "error");
    } finally {
      setParsing(false);
    }
  }, [parseText, onToast]);

  // ── Vitals snapshot ───────────────────────────────────────────────────────────
  const addVitalsSnapshot = useCallback((label, overrideVitals) => {
    const v = overrideVitals || vitals;
    if (!v.bp && !v.hr && !v.spo2) return;
    setVitalsHistory(p => [...p, { label, ts: Date.now(), ...v }]);
  }, [vitals]);

  // ── Save chart ────────────────────────────────────────────────────────────────
  const handleSaveChart = useCallback(async () => {
    try {
      const name = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
      await base44.entities.ClinicalNote.create({
        patient_name: name,
        patient_id:   registration.mrn || demo.mrn || "",
        patient_age:  demo.age || "",
        patient_gender: demo.sex === "M" ? "male" : demo.sex === "F" ? "female" : "other",
        date_of_visit: new Date().toISOString().split("T")[0],
        raw_note:     cc.hpi || cc.text || "",
        chief_complaint: cc.text || "",
        medications:  medications,
        allergies:    allergies,
        status:       "draft",
        note_type:    "progress_note",
      });
      onToast?.("Chart saved", "success");
    } catch(e) {
      onToast?.("Save failed: " + e.message, "error");
    }
  }, [demo, cc, medications, allergies, registration, onToast]);

  // ── AI ─────────────────────────────────────────────────────────────────────────
  const [aiOpen,    setAiOpen]    = useState(false);
  const [aiMsgs,    setAiMsgs]    = useState([{ role:"assistant", text:"Hi — I'm Notrya AI. I can help with differentials, documentation, risk stratification, or any clinical question. What do you need?" }]);
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread,    setUnread]    = useState(0);
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  const toggleAI = useCallback(() => {
    setAiOpen(o => { if (!o) setUnread(0); return !o; });
  }, []);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || aiInput).trim();
    if (!msg) return;
    setAiMsgs(p => [...p, { role:"user", text: msg }]);
    setAiInput("");
    setAiLoading(true);
    try {
      const ctx = buildPatientCtx(demo, cc, vitals, allergies, pmhSelected, currentTab);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nPatient context:\n${ctx}\n\nUser: ${msg}`,
      });
      const reply = typeof result === "string" ? result : result.data || "";
      setAiMsgs(p => [...p, { role:"assistant", text: reply }]);
      if (!aiOpen) setUnread(u => u + 1);
    } catch(e) {
      setAiMsgs(p => [...p, { role:"assistant", text:"Sorry, I encountered an error. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiOpen, demo, cc, vitals, allergies, pmhSelected, currentTab]);

  const handleAIKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(aiInput);
    }
  }, [aiInput, sendMessage]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [aiMsgs]);

  // ── CC template ───────────────────────────────────────────────────────────────
  const appliedTemplate = cc.text ? getTemplateForCC(cc.text) : null;
  const [templateDismissed, setTemplateDismissed] = useState({});

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const SHORTCUTS = {
      "1":"triage","2":"demo","3":"cc","4":"vit","5":"meds",
      "6":"hpi","7":"ros","8":"pe","9":"orders","0":"discharge",
    };
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && SHORTCUTS[e.key]) {
        e.preventDefault();
        selectSection(SHORTCUTS[e.key]);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSaveChart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectSection, handleSaveChart]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";

  const patientDataBundle = {
    demo, cc, vitals, medications, allergies, pmhSelected, pmhExtra,
    surgHx, famHx, socHx, rosState, rosSymptoms, peState, peFindings,
    esiLevel, registration, sdoh, consults, sepsisBundle, mdmState,
    isarState, pdmpState, disposition, dispReason,
  };

  const vitalClass = useCallback((key, val) => {
    if (val === "—" || !val || val === "") return "";
    const n = parseFloat(val);
    if (isNaN(n)) return "";
    if (key === "hr")   return n > 100 || n < 60 ? " abnormal" : "";
    if (key === "spo2") return n < 95 ? " critical" : "";
    if (key === "temp") return n > 38.0 || n < 36.0 ? " abnormal" : "";
    if (key === "rr")   return n > 20 || n < 12 ? " abnormal" : "";
    if (key === "bp") {
      const [s] = val.split("/").map(Number);
      return s > 160 || s < 90 ? " abnormal" : "";
    }
    return "";
  }, []);

  const getRosSysDot = useCallback((idx) => {
    const sys = ROS_RAIL_SYSTEMS[idx];
    if (!sys) return "empty";
    const entries = Object.entries(rosState).filter(([k]) => k.startsWith(sys.id));
    if (!entries.length) return "empty";
    return entries.some(([,v]) => v === "positive") ? "partial" : "done";
  }, [rosState]);

  const getPeSysDot = useCallback((idx) => {
    const sys = PE_RAIL_SYSTEMS[idx];
    if (!sys) return "empty";
    const entries = Object.entries(peState).filter(([k]) => k.startsWith(sys.id));
    if (!entries.length) return "empty";
    return entries.some(([,v]) => v === "abnormal") ? "partial" : "done";
  }, [peState]);

  const doorTime = useDoorTime(arrivalTimeRef);

  return {
    navigate, currentTab, activeGroup,
    navDots, selectGroup, selectSection, getGroupBadge,
    arrivalTimeRef, doorTime,
    demo, setDemo, cc, setCC,
    vitals, setVitals, vitalsHistory,
    medications, setMedications, allergies, setAllergies,
    pmhSelected, setPmhSelected, pmhExtra, setPmhExtra,
    surgHx, setSurgHx, famHx, setFamHx, socHx, setSocHx,
    rosState, setRosState, rosSymptoms, setRosSymptoms, rosNotes, setRosNotes,
    peState, setPeState, peFindings, setPeFindings,
    selectedCC, setSelectedCC,
    parseText, setParseText, parsing,
    pmhExpanded, setPmhExpanded,
    avpu, setAvpu, o2del, setO2del, pain, setPain,
    triage, setTriage, esiLevel, setEsiLevel, visitMode, setVisitMode,
    consults, setConsults, sdoh, setSdoh,
    disposition, setDisposition, dispReason, setDispReason, dispTime, setDispTime,
    registration, setRegistration,
    railCompact, setRailCompact, showShortcuts, setShowShortcuts,
    cdsOpen, setCdsOpen,
    rosActiveSystem, setRosActiveSystem, peActiveSystem, setPeActiveSystem,
    reassessState, setReassessState, clinicalTimeline, setClinicalTimeline,
    sepsisBundle, setSepsisBundle,
    pdmpState, setPdmpState,
    isarState, setIsarState,
    mdmState, setMdmState, mdmDataElements, setMdmDataElements,
    appliedTemplate, templateDismissed, setTemplateDismissed,
    nursingOpen, setNursingOpen, nursingInterventions, setNursingInterventions,
    nursingNotes, setNursingNotes,
    mediaOpen, setMediaOpen, attachments, setAttachments,
    providerName, providerRole,
    aiOpen, setAiOpen, aiMsgs, aiInput, setAiInput, aiLoading, unread, msgsRef, inputRef,
    resumeSection, setResumeSection,
    patientName, patientDataBundle,
    vitalClass, getRosSysDot, getPeSysDot,
    toggleAI, addVitalsSnapshot, handleSaveChart, smartParse,
    sendMessage, handleAIKey, renderMsg,
  };
}