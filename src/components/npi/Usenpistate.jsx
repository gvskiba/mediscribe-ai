// useNPIState.js — extracted state & logic hook for NewPatientInput
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  NAV_DATA, ALL_SECTIONS, SHORTCUT_MAP, SYSTEM_PROMPT,
  getTemplateForCC, buildPatientCtx, QUICK_ACTIONS,
} from "@/components/npi/npiData";

const ASSESS_SECTIONS = ["hpi", "ros", "pe"];

export function useNPIState() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Tab / group navigation ──────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState(
    () => new URLSearchParams(window.location.search).get("tab") || "demo"
  );
  const [activeGroup, setActiveGroup] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") || "demo";
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === tab)) return group;
    }
    return "intake";
  });

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab) setCurrentTab(tab);
  }, [location.search]);

  // ── Nav dots ────────────────────────────────────────────────────────────────
  const [navDots, setNavDots] = useState(() => {
    const m = {}; ALL_SECTIONS.forEach(s => (m[s.section] = s.dot)); return m;
  });

  // ── Arrival timer ───────────────────────────────────────────────────────────
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

  // ── Patient data ────────────────────────────────────────────────────────────
  const [demo, setDemo]               = useState({ firstName:"", lastName:"", age:"", dob:"", sex:"", mrn:"", insurance:"", insuranceId:"", address:"", city:"", phone:"", email:"", emerg:"", height:"", weight:"", lang:"", notes:"", pronouns:"" });
  const [cc, setCC]                   = useState({ text:"", onset:"", duration:"", severity:"", quality:"", radiation:"", aggravate:"", relieve:"", assoc:"", hpi:"" });
  const [vitals, setVitals]           = useState({});
  const [vitalsHistory, setVitalsHistory] = useState([]);
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
  const [consults, setConsults]       = useState([]);
  const [sdoh, setSdoh]               = useState({ housing:"", food:"", transport:"", utilities:"", isolation:"", safety:"" });
  const [disposition, setDisposition] = useState("");
  const [dispReason, setDispReason]   = useState("");
  const [dispTime, setDispTime]       = useState("");
  const [registration, setRegistration] = useState({ mrn:"", room:"" });
  const [railCompact, setRailCompact] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [cdsOpen, setCdsOpen]         = useState(false);
  const [rosActiveSystem, setRosActiveSystem] = useState(0);
  const [peActiveSystem, setPeActiveSystem]   = useState(0);
  const [reassessState, setReassessState]     = useState({});
  const [clinicalTimeline, setClinicalTimeline] = useState({});
  const [templateDismissed, setTemplateDismissed] = useState({ ros:false, pe:false });

  // ── Nursing & Media panels ───────────────────────────────────────────────────
  const [nursingOpen, setNursingOpen]                   = useState(false);
  const [nursingInterventions, setNursingInterventions] = useState([]);
  const [nursingNotes, setNursingNotes]                 = useState([]);
  const [mediaOpen, setMediaOpen]                       = useState(false);
  const [attachments, setAttachments]                   = useState([]);

  // ── Provider identity ────────────────────────────────────────────────────────
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

  // ── Resume section tracking ──────────────────────────────────────────────────
  const prevTabRef = useRef(null);
  const [resumeSection, setResumeSection] = useState(null);
  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev && ASSESS_SECTIONS.includes(prev) && !ASSESS_SECTIONS.includes(currentTab)) setResumeSection(prev);
    if (ASSESS_SECTIONS.includes(currentTab)) setResumeSection(null);
    prevTabRef.current = currentTab;
  }, [currentTab]); // eslint-disable-line

  // ── AI state ─────────────────────────────────────────────────────────────────
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
    const h = e => { if (e.key === "Escape" && aiOpen) setAiOpen(false); if (e.key === "Escape" && cdsOpen) setCdsOpen(false); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [aiOpen, cdsOpen]);

  // ── Applied CC template ──────────────────────────────────────────────────────
  const appliedTemplate = getTemplateForCC(cc.text);

  // ── Nav dots update ──────────────────────────────────────────────────────────
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
      triage:   esiLevel                        ? "done"    : "empty",
      consult:  consults.length > 0               ? "done"    : "empty",
      closeout: disposition                        ? "done"    : "empty",
      sdoh:     Object.values(sdoh).filter(v => v === "2").length > 0 ? "partial"
                  : Object.values(sdoh).some(Boolean) ? "done" : "empty",
      reassess: reassessState.condition ? "done" : reassessState.note ? "partial" : "empty",
      timeline: clinicalTimeline?.times?.departed ? "done" : clinicalTimeline?.times?.disposition ? "partial" : "empty",
      summary:  (demo.firstName || cc.text || vitals.bp) ? "partial" : "empty",
      handoff:  "empty",
    }));
  }, [
    demo.firstName, demo.lastName, demo.age, cc.text, cc.hpi, vitals.bp, vitals.hr,
    medications.length, allergies.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.keys(rosState).length, Object.keys(peState).length,
    esiLevel, consults.length, disposition,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(sdoh).join(","),
    reassessState.condition, reassessState.note,
    clinicalTimeline?.times?.departed, clinicalTimeline?.times?.disposition,
  ]);

  // ── Navigation helpers ───────────────────────────────────────────────────────
  const selectSection = useCallback((sectionId) => {
    navigate(`/NewPatientInput?tab=${sectionId}`);
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === sectionId)) { setActiveGroup(group); break; }
    }
  }, [navigate]);

  const selectGroup = useCallback((group) => {
    if (group === activeGroup) return;
    setActiveGroup(group);
    const items = NAV_DATA[group];
    if (items.every(i => i.href)) return;
    if (items.length === 1) { navigate(`/NewPatientInput?tab=${items[0].section}`); return; }
    const target = items.find(i => i.section === currentTab) ? currentTab : items[0].section;
    navigate(`/NewPatientInput?tab=${target}`);
  }, [currentTab, activeGroup, navigate]);

  const getGroupBadge = useCallback((groupKey) => {
    const items = NAV_DATA[groupKey];
    if (items.every(i => navDots[i.section] === "done")) return "done";
    if (items.some(i => navDots[i.section] === "done" || navDots[i.section] === "partial")) return "partial";
    return "empty";
  }, [navDots]);

  // ── Vital utilities ──────────────────────────────────────────────────────────
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

  // ── Actions ──────────────────────────────────────────────────────────────────
  const toggleAI = useCallback(() => { setAiOpen(o => { if (!o) setUnread(0); return !o; }); }, []);

  const addVitalsSnapshot = useCallback((label, overrideVitals) => {
    const v = overrideVitals || vitals;
    if (!v || (!v.hr && !v.bp)) return;
    setVitalsHistory(prev => [...prev, { t: Date.now(), label, ...v }]);
  }, [vitals]);

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
        disposition: disposition||"", disposition_reason: dispReason||"",
        consult_count: consults.length,
        consult_services: consults.map(c => c.service).join(", ")||"",
        ros_summary: Object.keys(rosState).filter(k => rosState[k]).join(", ")||"",
        pe_summary:  Object.keys(peState).filter(k => peState[k]).join(", ")||"",
      };
      if (!disposition) toast.warning("Disposition not set — chart saved as draft without close-out.");
      await base44.entities.ClinicalNote.create(payload);
      toast.success("Chart signed and saved.");
      navigate("/EDTrackingBoard");
    } catch (e) { toast.error("Failed to save: " + e.message); }
  }, [demo,cc,vitals,medications,allergies,parseText,rosState,peState,registration,disposition,dispReason,consults,navigate]);

  const smartParse = useCallback(async () => {
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
  }, [parseText]);

  // ── AI messaging ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || aiLoading) return;
    setAiMsgs(m => [...m, { role:"user", text:text.trim() }]);
    setAiInput(""); setAiLoading(true);
    const ctx = buildPatientCtx(demo, cc, vitals, allergies, pmhSelected, currentTab);
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
  }, [aiLoading, currentTab, demo, cc, vitals, allergies, pmhSelected]);

  const handleAIKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(aiInput); } };

  const renderMsg = text =>
    text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,'<strong style="color:#00e5c0">$1</strong>');

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
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
  }, [selectSection, navigate, handleSaveChart]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";

  const patientDataBundle = {
    demo, cc, vitals, medications, allergies,
    pmhSelected, pmhExtra, surgHx, famHx, socHx,
    rosState, rosNotes, rosSymptoms, peState, peFindings,
    esiLevel, registration, sdoh,
  };

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
    triage, setTriage, esiLevel, setEsiLevel,
    consults, setConsults, sdoh, setSdoh,
    disposition, setDisposition, dispReason, setDispReason, dispTime, setDispTime,
    registration, setRegistration,
    railCompact, setRailCompact, showShortcuts, setShowShortcuts,
    cdsOpen, setCdsOpen,
    rosActiveSystem, setRosActiveSystem, peActiveSystem, setPeActiveSystem,
    reassessState, setReassessState, clinicalTimeline, setClinicalTimeline,
    appliedTemplate, templateDismissed, setTemplateDismissed,
    nursingOpen, setNursingOpen, nursingInterventions, setNursingInterventions,
    nursingNotes, setNursingNotes,
    mediaOpen, setMediaOpen, attachments, setAttachments,
    providerName, providerRole,
    aiOpen, aiMsgs, aiInput, setAiInput, aiLoading, unread, msgsRef, inputRef,
    resumeSection, setResumeSection,
    patientName, patientDataBundle,
    vitalClass, getRosSysDot, getPeSysDot,
    toggleAI, addVitalsSnapshot, handleSaveChart, smartParse,
    sendMessage, handleAIKey, renderMsg,
  };
}