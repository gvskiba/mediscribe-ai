import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // FIX #1 — was missing entirely
import { base44 } from "@/api/base44Client";
import {
  NAV_DATA, ALL_SECTIONS, SHORTCUT_MAP,
  SYSTEM_PROMPT, buildPatientCtx,
  getTemplateForCC, ROS_RAIL_SYSTEMS, PE_RAIL_SYSTEMS,
} from "@/components/npi/npiData";

// FIX #7 — was defined inside the hook body, re-creating on every render
const ASSESS_SECTIONS = ["hpi", "ros", "pe"];

// ─────────────────────────────────────────────────────────────────────────────
// FIX #6 — removed the internal state-based toast system (toasts were never
// rendered in the page JSX). Hook now accepts an onToast(msg, type) callback
// from NewPatientInput so it can use the existing sonner instance there.
//
// NewPatientInput.jsx call site change required:
//   const showToast = (msg, type="success") => type==="error" ? toast.error(msg) : toast.success(msg);
//   const { navigate, ... } = useNPIState(showToast);
// ─────────────────────────────────────────────────────────────────────────────
export function useNPIState(onToast) {
  const _toast = onToast || (() => {});

  // FIX #1 — navigate returned so page can route to other hubs
  const navigate = useNavigate();

  // ── Tab / nav routing ────────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState(
    () => new URLSearchParams(window.location.search).get("tab") || "demo"
  );
  useEffect(() => {
    const onPop = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab) setCurrentTab(tab);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const [activeGroup, setActiveGroup] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") || "demo";
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === tab)) return group;
    }
    return "intake";
  });

  const [navDots, setNavDots] = useState(() => {
    const m = {}; ALL_SECTIONS.forEach(s => (m[s.section] = s.dot)); return m;
  });

  // ── Door timer ───────────────────────────────────────────────────────────
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

  // ── Clinical data ────────────────────────────────────────────────────────
  const [demo, setDemo] = useState({ firstName:"", lastName:"", age:"", dob:"", sex:"", mrn:"", insurance:"", insuranceId:"", address:"", city:"", phone:"", email:"", emerg:"", height:"", weight:"", lang:"", notes:"", pronouns:"" });
  const [cc, setCC]                       = useState({ text:"", onset:"", duration:"", severity:"", quality:"", radiation:"", aggravate:"", relieve:"", assoc:"", hpi:"" });
  const [vitals, setVitals]               = useState({});
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medications, setMedications]     = useState([]);
  const [allergies, setAllergies]         = useState([]);
  const [pmhSelected, setPmhSelected]     = useState({});
  const [pmhExtra, setPmhExtra]           = useState("");
  const [surgHx, setSurgHx]               = useState("");
  const [famHx, setFamHx]                 = useState("");
  const [socHx, setSocHx]                 = useState("");
  const [rosState, setRosState]           = useState({});
  const [rosSymptoms, setRosSymptoms]     = useState({});
  const [rosNotes, setRosNotes]           = useState({});
  const [peState, setPeState]             = useState({});
  const [peFindings, setPeFindings]       = useState({});
  const [selectedCC, setSelectedCC]       = useState(-1);
  const [parseText, setParseText]         = useState("");
  const [parsing, setParsing]             = useState(false);
  const [saving,  setSaving]              = useState(false);
  const [pmhExpanded, setPmhExpanded]     = useState({ cardio: true, endo: true });
  const [avpu, setAvpu]                   = useState("");
  const [o2del, setO2del]                 = useState("");
  const [pain, setPain]                   = useState("");
  const [triage, setTriage]               = useState("");
  const [esiLevel, setEsiLevel]           = useState("");
  const [visitMode, setVisitMode]         = useState("standard");
  const [consults, setConsults]           = useState([]);
  const [sdoh, setSdoh]                   = useState({ housing:"", food:"", transport:"", utilities:"", isolation:"", safety:"", tobacco:"", phq2q1:"", phq2q2:"", auditcq1:"", auditcq2:"", auditcq3:"" });
  const [disposition, setDisposition]     = useState("");
  const [dispReason, setDispReason]       = useState("");
  const [dispTime, setDispTime]           = useState("");
  const [registration, setRegistration]   = useState({ mrn:"", room:"" });
  const [rosActiveSystem, setRosActiveSystem] = useState(0);
  const [peActiveSystem,  setPeActiveSystem]  = useState(0);
  const [reassessState,   setReassessState]   = useState({});
  const [clinicalTimeline, setClinicalTimeline] = useState({});
  const [sepsisBundle,    setSepsisBundle]      = useState({});
  const [pdmpState,       setPdmpState]         = useState({ checked:false, timestamp:"", method:"" });
  const [isarState,       setIsarState]         = useState({ q1:null, q2:null, q3:null, q4:null, q5:null, q6:null });
  const [mdmState,        setMdmState]          = useState({ copa:"", copaRationale:"", dataChecks:{ cat1:[], cat2:false, cat3:false }, dataLevel:"", risk:"", riskRationale:"", sdohRiskAccepted:false, narrative:"" });
  const [mdmDataElements, setMdmDataElements]   = useState([]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [railCompact, setRailCompact]       = useState(false);
  const [showShortcuts, setShowShortcuts]   = useState(false);
  const [cdsOpen, setCdsOpen]               = useState(false);
  const [resumeSection, setResumeSection]   = useState(null);

  // ── CC Smart Template state ──────────────────────────────────────────────
  const [appliedTemplate,   setAppliedTemplate]   = useState(null);
  const [templateDismissed, setTemplateDismissed] = useState({ ros:false, pe:false });
  const templateFiredRef = useRef({ ros:false, pe:false });
  const prevCCRef        = useRef("");

  // ── Panel state ──────────────────────────────────────────────────────────
  const [nursingOpen,          setNursingOpen]          = useState(false);
  const [nursingInterventions, setNursingInterventions] = useState([]);
  const [nursingNotes,         setNursingNotes]         = useState([]);
  const [mediaOpen,            setMediaOpen]            = useState(false);
  const [attachments,          setAttachments]          = useState([]);

  // ── Provider ─────────────────────────────────────────────────────────────
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

  // ── AI overlay state ─────────────────────────────────────────────────────
  // FIX #4 — initial message uses "assistant" so it receives .npi-n-msg.assistant CSS
  const [aiOpen, setAiOpen]       = useState(false);
  const [aiMsgs, setAiMsgs]       = useState([{ role:"assistant", text:"Notrya AI ready \u2014 select a quick action or ask a clinical question." }]);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [history, setHistory]     = useState([]);
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  // ── Resume section tracker ───────────────────────────────────────────────
  // FIX #7 — ASSESS_SECTIONS moved to module scope above
  const prevTabRef = useRef(null);
  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev && ASSESS_SECTIONS.includes(prev) && !ASSESS_SECTIONS.includes(currentTab)) setResumeSection(prev);
    if (ASSESS_SECTIONS.includes(currentTab)) setResumeSection(null);
    prevTabRef.current = currentTab;
  }, [currentTab]); // eslint-disable-line

  // ── AI overlay effects ───────────────────────────────────────────────────
  useEffect(() => { msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior:"smooth" }); }, [aiMsgs, aiLoading]);
  useEffect(() => { if (aiOpen) setTimeout(() => inputRef.current?.focus(), 280); }, [aiOpen]);

  // ── Escape key ───────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape" && aiOpen)      setAiOpen(false);
      if (e.key === "Escape" && cdsOpen)     setCdsOpen(false);
      if (e.key === "Escape" && nursingOpen) setNursingOpen(false);
      if (e.key === "Escape" && mediaOpen)   setMediaOpen(false);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [aiOpen, cdsOpen, nursingOpen, mediaOpen]);

  // ── Nav dot computation ──────────────────────────────────────────────────
  // FIX #3 — "done" → "complete" everywhere to match .npi-wf-item-dot.complete CSS
  useEffect(() => {
    setNavDots(prev => ({
      ...prev,
      demo:     (demo.firstName || demo.lastName || demo.age) ? "complete" : "empty",
      cc:       cc.text                                        ? "complete" : "empty",
      vit:      (vitals.bp || vitals.hr)                       ? "complete" : "empty",
      meds:     (medications.length || allergies.length)       ? "complete" : "empty",
      hpi:      cc.hpi ? "complete" : cc.text                  ? "partial"  : "empty",
      ros:      Object.keys(rosState).length > 3 ? "complete" : Object.keys(rosState).length > 0 ? "partial" : "empty",
      pe:       Object.keys(peState).length  > 3 ? "complete" : Object.keys(peState).length  > 0 ? "partial" : "empty",
      triage:   esiLevel                          ? "complete" : "empty",
      consult:  consults.length > 0               ? "complete" : "empty",
      closeout: disposition                        ? "complete" : "empty",
      sdoh: (() => {
        const sdohPositive = Object.entries(sdoh).filter(([k]) => !k.startsWith("phq2") && !k.startsWith("auditc") && k !== "tobacco").some(([,v]) => v === "2");
        const phq2Score    = parseInt(sdoh.phq2q1||"0") + parseInt(sdoh.phq2q2||"0");
        const auditcScore  = parseInt(sdoh.auditcq1||"0") + parseInt(sdoh.auditcq2||"0") + parseInt(sdoh.auditcq3||"0");
        const auditcPos    = Boolean(sdoh.auditcq1 && sdoh.auditcq2 && sdoh.auditcq3 && auditcScore >= 4);
        if (sdohPositive || phq2Score >= 3 || auditcPos) return "partial";
        if (Object.values(sdoh).some(Boolean)) return "complete";
        return "empty";
      })(),
      reassess: reassessState.condition ? "complete" : reassessState.note ? "partial" : "empty",
      timeline: clinicalTimeline?.times?.departed ? "complete" : clinicalTimeline?.times?.disposition ? "partial" : "empty",
      summary:  (demo.firstName || cc.text || vitals.bp) ? "partial" : "empty",
      mdm:      mdmState.narrative ? "complete" : (mdmState.copa || mdmState.risk) ? "partial" : "empty",
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
    mdmState.narrative, mdmState.copa, mdmState.risk,
  ]);

  // ── CC Template auto-apply ───────────────────────────────────────────────
  useEffect(() => {
    if (cc.text !== prevCCRef.current) {
      templateFiredRef.current = { ros:false, pe:false };
      setTemplateDismissed({ ros:false, pe:false });
      prevCCRef.current = cc.text;
    }
    const tpl = getTemplateForCC(cc.text);
    setAppliedTemplate(tpl || null);
    if (!tpl) return;
    if (currentTab === "ros" && !templateFiredRef.current.ros) {
      templateFiredRef.current.ros = true;
      const idx = ROS_RAIL_SYSTEMS.findIndex(s => s.id === tpl.rosPriority[0]);
      if (idx >= 0) setRosActiveSystem(idx);
    }
    if (currentTab === "pe" && !templateFiredRef.current.pe) {
      templateFiredRef.current.pe = true;
      const idx = PE_RAIL_SYSTEMS.findIndex(s => s.id === tpl.pePriority[0]);
      if (idx >= 0) setPeActiveSystem(idx);
    }
  }, [cc.text, currentTab]); // eslint-disable-line

  // ── Navigation callbacks ─────────────────────────────────────────────────
  const selectSection = useCallback((sectionId) => {
    setCurrentTab(sectionId);
    window.history.pushState({}, "", `?tab=${sectionId}`);
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === sectionId)) { setActiveGroup(group); break; }
    }
  }, []);

  const selectGroup = useCallback((group) => {
    if (group === activeGroup) return;
    setActiveGroup(group);
    const items = NAV_DATA[group];
    if (items.every(i => i.href)) return;
    const target = items.find(i => i.section === currentTab) ? currentTab : items[0].section;
    setCurrentTab(target);
    window.history.pushState({}, "", `?tab=${target}`);
  }, [currentTab, activeGroup]);

  // FIX #3 — returns "complete" to match .npi-wf-gh-badge.complete CSS
  const getGroupBadge = useCallback((groupKey) => {
    const items = NAV_DATA[groupKey];
    if (items.every(i => navDots[i.section] === "complete")) return "complete";
    if (items.some(i => navDots[i.section] === "complete" || navDots[i.section] === "partial")) return "partial";
    return "empty";
  }, [navDots]);

  // ── Vital helpers ─────────────────────────────────────────────────────────
  // FIX #2 — " abn" → " alert" to match .npi-wf-v-val.alert CSS class
  // FIX #11 — thresholds are Fahrenheit-aware for US ED documentation
  //   (temp input expected in °F; 38°C=100.4°F, 39.5°C=103.1°F, 35.5°C=95.9°F)
  const vitalClass = (key, raw) => {
    if (!raw || raw === "\u2014") return "";
    const src = key === "bp" ? String(raw).split("/")[0] : raw;
    const n = parseFloat(src); if (isNaN(n)) return "";
    if (key === "hr")   return n > 110 || n < 50    ? " alert" : n > 90  || n < 55  ? " warn" : "";
    if (key === "rr")   return n > 22  || n < 8     ? " alert" : n > 20  || n < 10  ? " warn" : "";
    if (key === "spo2") return n < 90               ? " alert" : n < 94             ? " warn" : "";
    if (key === "temp") return n > 103.1 || n < 95.9 ? " alert" : n > 100.4 || n < 96.8 ? " warn" : "";
    if (key === "bp")   return n > 180 || n < 80    ? " alert" : n > 140 || n < 90  ? " warn" : "";
    return "";
  };

  const getRosSysDot = (sysId) => {
    const st = rosState[sysId]; if (!st) return "empty";
    return st === "has-positives" ? "partial" : "complete"; // FIX #3
  };

  const getPeSysDot = (sysId) => {
    const st = peState[sysId]; if (!st) return "empty";
    return (st === "has-positives" || st === "abnormal" || st === "mixed") ? "partial" : "complete"; // FIX #3
  };

  const addVitalsSnapshot = useCallback((label, overrideVitals) => {
    const v = overrideVitals || vitals;
    if (!v || (!v.hr && !v.bp)) return;
    setVitalsHistory(prev => [...prev, { t: Date.now(), label, ...v }]);
  }, [vitals]);

  // ── Chart save ────────────────────────────────────────────────────────────
  // FIX #10 — dep array now includes mdmState, reassessState, pdmpState, isarState
  const handleSaveChart = useCallback(async () => {
    setSaving(true);
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
        sdoh_housing: sdoh.housing||"", sdoh_food: sdoh.food||"",
        sdoh_transport: sdoh.transport||"", sdoh_isolation: sdoh.isolation||"",
        sdoh_safety: sdoh.safety||"", sdoh_tobacco: sdoh.tobacco||"",
        sdoh_phq2q1: sdoh.phq2q1||"", sdoh_phq2q2: sdoh.phq2q2||"",
        sdoh_phq2_score: String(parseInt(sdoh.phq2q1||"0") + parseInt(sdoh.phq2q2||"0")),
        sepsis_lactate_ordered:        sepsisBundle.lactateOrdered||"",
        sepsis_lactate_value:          sepsisBundle.lactateValue||"",
        sepsis_abx_ordered:            sepsisBundle.abxOrdered||"",
        sepsis_fluids_started:         sepsisBundle.fluidsStarted||"",
        sepsis_repeat_lactate_ordered: sepsisBundle.repeatLactateOrdered||"",
        sepsis_repeat_lactate_value:   sepsisBundle.repeatLactateValue||"",
        pdmp_checked:   pdmpState.checked ? "yes" : "no",
        pdmp_timestamp: pdmpState.timestamp||"",
        pdmp_method:    pdmpState.method||"",
        isar_score: String(
          (isarState.q1===true?1:0)+(isarState.q2===true?1:0)+
          (isarState.q3===false?1:0)+(isarState.q4===true?1:0)+
          (isarState.q5===true?1:0)+(isarState.q6===true?1:0)
        ),
        disposition: disposition||"", disposition_reason: dispReason||"",
        consult_count: consults.length,
        consult_services: consults.map(c => c.service).join(", ")||"",
        ros_summary: Object.keys(rosState).filter(k => rosState[k]).join(", ")||"",
        pe_summary:  Object.keys(peState).filter(k => peState[k]).join(", ")||"",
        mdm_narrative: mdmState.narrative||"",
        mdm_copa:      mdmState.copa||"",
        mdm_risk:      mdmState.risk||"",
        reassess_condition: reassessState.condition||"",
        reassess_note:      reassessState.note||"",
      };
      if (!disposition) _toast("Disposition not set \u2014 chart saved as draft.", "warn");
      await base44.entities.ClinicalNote.create(payload);
      _toast("Chart signed and saved.", "success");
      setCurrentTab("demo");
      window.history.pushState({}, "", "?tab=demo");
    } catch (e) { _toast("Failed to save: " + e.message, "error"); }
    finally     { setSaving(false); }
  }, [
    // FIX #10 — full dep list including previously missing mdmState, reassessState, pdmpState, isarState
    demo, cc, vitals, medications, allergies, parseText,
    pmhSelected, pmhExtra, surgHx, famHx, socHx,
    rosState, rosNotes, rosSymptoms, peState, peFindings,
    esiLevel, registration, sdoh, consults, disposition, dispReason,
    sepsisBundle, pdmpState, isarState, mdmState, reassessState,
  ]);

  // ── Smart parse ──────────────────────────────────────────────────────────
  // FIX #8 — clears parseText on success
  const smartParse = async () => {
    if (!parseText.trim()) { _toast("Please enter some text to parse.", "error"); return; }
    setParsing(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          system: `Extract structured patient data from the following text. Return ONLY valid JSON, no markdown.
Fields: firstName, lastName, age, sex, dob, cc, onset, duration, severity, quality, bp, hr, rr, spo2, temp, gcs, medications (array), allergies (array), pmh (array).
Omit any field not present in the text.`,
          messages: [{ role: "user", content: `Text: ${parseText}` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const result = JSON.parse(raw);
      setDemo(prev => ({ ...prev, firstName:result.firstName||prev.firstName, lastName:result.lastName||prev.lastName, age:result.age||prev.age, sex:result.sex||prev.sex, dob:result.dob||prev.dob }));
      setCC(prev => ({ ...prev, text:result.cc||prev.text, onset:result.onset||prev.onset, duration:result.duration||prev.duration, severity:result.severity||prev.severity, quality:result.quality||prev.quality }));
      setVitals(prev => ({ ...prev, bp:result.bp||prev.bp||"", hr:result.hr||prev.hr||"", rr:result.rr||prev.rr||"", spo2:result.spo2||prev.spo2||"", temp:result.temp||prev.temp||"", gcs:result.gcs||prev.gcs||"" }));
      (result.medications||[]).forEach(m => { if (m) setMedications(p => p.includes(m)?p:[...p,m]); });
      (result.allergies||[]).forEach(a => { if (a) setAllergies(p => p.includes(a)?p:[...p,a]); });
      setParseText(""); // FIX #8 — clear input on success
      _toast("Patient data extracted!", "success");
    } catch { _toast("Could not parse automatically.", "error"); }
    finally  { setParsing(false); }
  };

  // ── AI message handler ───────────────────────────────────────────────────
  // FIX #4 — role "bot" → "assistant" to match .npi-n-msg.assistant CSS
  // FIX #9 — history state capped to last 12 entries (6 turns) to prevent unbounded growth
  const toggleAI = useCallback(() => { setAiOpen(o => { if (!o) setUnread(0); return !o; }); }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || aiLoading) return;
    setAiMsgs(m => [...m, { role:"user", text:text.trim() }]);
    setAiInput(""); setAiLoading(true);
    const ctx = buildPatientCtx(demo, cc, vitals, allergies, pmhSelected, currentTab);
    const newHistory = [...history, { role:"user", content: ctx + "\n\n" + text.trim() }];
    setHistory(newHistory.slice(-12)); // FIX #9 — cap stored history
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages: newHistory.slice(-10),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "No response.";
      setHistory(h => [...h, { role:"assistant", content:reply }].slice(-12)); // FIX #9
      setAiMsgs(m => [...m, { role:"assistant", text:reply }]); // FIX #4
      setAiOpen(open => { if (!open) setUnread(u => u + 1); return open; });
    } catch {
      setAiMsgs(m => [...m, { role:"assistant", text:"\u26a0 Connection error \u2014 please try again." }]); // FIX #4
    } finally { setAiLoading(false); }
  }, [aiLoading, history, currentTab, demo, cc, vitals, allergies, pmhSelected]);

  const handleAIKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(aiInput); } };

  const renderMsg = text =>
    text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,"<strong style=\"color:#00e5c0\">$1</strong>");

  // ── Global keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && SHORTCUT_MAP[e.key]) { e.preventDefault(); selectSection(SHORTCUT_MAP[e.key]); return; }
      if (mod && e.shiftKey && e.key === "s") { e.preventDefault(); handleSaveChart(); return; }
      if (mod && e.shiftKey && e.key === "n") { e.preventDefault(); setCurrentTab("demo"); window.history.pushState({}, "", "?tab=demo"); return; }
      if (e.key === "?" && !mod && !["INPUT","TEXTAREA"].includes(e.target.tagName)) {
        e.preventDefault(); setShowShortcuts(s => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectSection, handleSaveChart]); // eslint-disable-line

  // ── Derived values ───────────────────────────────────────────────────────
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";

  const patientDataBundle = {
    demo, cc, vitals, medications, allergies,
    pmhSelected, pmhExtra, surgHx, famHx, socHx,
    rosState, rosNotes, rosSymptoms,
    peState, peFindings,
    esiLevel, registration, sdoh, attachments,
  };

  return {
    navigate,                                                       // FIX #1
    currentTab, setCurrentTab, activeGroup, setActiveGroup,
    navDots, setNavDots, selectGroup, selectSection, getGroupBadge,
    arrivalTimeRef, doorTime,
    demo, setDemo, cc, setCC,
    vitals, setVitals, vitalsHistory, setVitalsHistory,
    medications, setMedications, allergies, setAllergies,
    pmhSelected, setPmhSelected, pmhExtra, setPmhExtra,
    surgHx, setSurgHx, famHx, setFamHx, socHx, setSocHx,
    rosState, setRosState, rosSymptoms, setRosSymptoms, rosNotes, setRosNotes,
    peState, setPeState, peFindings, setPeFindings,
    selectedCC, setSelectedCC,
    parseText, setParseText, parsing, saving,
    pmhExpanded, setPmhExpanded,
    avpu, setAvpu, o2del, setO2del, pain, setPain,
    triage, setTriage, esiLevel, setEsiLevel, visitMode, setVisitMode,
    consults, setConsults, sdoh, setSdoh,
    disposition, setDisposition, dispReason, setDispReason, dispTime, setDispTime,
    registration, setRegistration,
    railCompact, setRailCompact, showShortcuts, setShowShortcuts, cdsOpen, setCdsOpen,
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
    aiOpen, setAiOpen, aiMsgs, aiInput, setAiInput, aiLoading, unread,
    msgsRef, inputRef,
    resumeSection, setResumeSection,
    patientName, patientDataBundle,
    vitalClass, getRosSysDot, getPeSysDot,
    // FIX #6 — toasts / setToasts removed; toast calls now go through onToast prop
    toggleAI, addVitalsSnapshot, handleSaveChart, smartParse,
    sendMessage, handleAIKey, renderMsg,
  };
}