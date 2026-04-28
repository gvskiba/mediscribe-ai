// QuickNote.jsx  v11
// Two-phase ED documentation with: Workup Rationale, EKG Interpreter, Consult Docs,
// Timestamps, MDM Explainer, Critical Results Auto-Flag, Bounceback Detection,
// Per-section copy, Paste-ready mode, Auto-ROS from HPI, Shift+3/4 shortcuts

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { dispColor, StepProgress, MDMResult, DispositionResult,
         DiagnosisCodingCard, InterventionsCard,
         DifferentialCard, ClinicalCalcsCard } from "./QuickNoteComponents";
import { injectQNStyles } from "./QuickNoteStyle.jsx";
import { PatientBanner, FatigueBanner, UndoToast, NhResumeBanner,
         VhImportBanner, VhAnalysisCard, AddendumBanner } from "./QuickNoteBanners";
import { KbHelpModal } from "./QuickNoteKbHelp";
import { Phase1Panel } from "./QuickNotePhase1Panel";
import { Phase2Panel } from "./QuickNotePhase2Panel";
import { ActionBar } from "./QuickNoteActionBar";
import { TimelineCard } from "./QuickNoteTimeline";
import { SepsisBanner } from "./QuickNoteSepsis";
import { ProcedureNoteModal } from "./QuickNoteProcedure";
import { SDMBlock, AttestationBlock, NursingHandoff, PriorVisitsPanel } from "./QuickNoteExtras";
import { DEFAULT_EXPANSIONS } from "./QuickNoteVoice";
import {
  MDM_SCHEMA, DISP_SCHEMA,
  buildMDMPrompt, buildDispPrompt, buildMDMBlock,
  buildFullNote, buildPhase1Copy, buildPhase2Copy,
} from "./QuickNotePrompts";

injectQNStyles();

// ─── CRITICAL VALUE DETECTOR (sync, runs before Phase 2 generate) ─────────────
function detectCriticalValues(labsText) {
  if (!labsText) return [];
  const flags = [];
  const rules = [
    { re:/K\+?\s*[:\-]?\s*([0-9.]+)/i,  label:"K+",         lo:3.0,  hi:6.0  },
    { re:/Na\+?\s*[:\-]?\s*([0-9.]+)/i, label:"Na+",        lo:125,  hi:155  },
    { re:/glucose\s*[:\-]?\s*([0-9.]+)/i, label:"Glucose",  lo:50,   hi:500  },
    { re:/lactate\s*[:\-]?\s*([0-9.]+)/i, label:"Lactate",  lo:null, hi:4.0  },
    { re:/troponin[^0-9]*([0-9.]+)/i,   label:"Troponin",   lo:null, hi:0.04 },
    { re:/creatinine\s*[:\-]?\s*([0-9.]+)/i, label:"Creatinine", lo:null, hi:4.0 },
    { re:/ph\s*[:\-]?\s*([0-9.]+)/i,    label:"pH",         lo:7.2,  hi:7.6  },
    { re:/hgb\s*[:\-]?\s*([0-9.]+)/i,   label:"Hgb",        lo:7.0,  hi:null },
    { re:/inr\s*[:\-]?\s*([0-9.]+)/i,   label:"INR",        lo:null, hi:4.0  },
    { re:/wbc\s*[:\-]?\s*([0-9.]+)/i,   label:"WBC",        lo:null, hi:30   },
  ];
  rules.forEach(({ re, label, lo, hi }) => {
    const m = labsText.match(re);
    if (!m) return;
    const val = parseFloat(m[1]);
    if (isNaN(val)) return;
    if ((lo !== null && val < lo) || (hi !== null && val > hi)) {
      flags.push({ label, value: m[1] });
    }
  });
  return flags;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function QuickNote({ embedded = false, demo, vitals: initVitals, cc: initCC }) {
  const [cc,     setCC]     = useState(initCC?.text || "");
  const [vitals, setVitals] = useState(() => {
    if (!initVitals) return "";
    return [
      initVitals.hr   ? `HR ${initVitals.hr}`      : null,
      initVitals.bp   ? `BP ${initVitals.bp}`      : null,
      initVitals.rr   ? `RR ${initVitals.rr}`      : null,
      initVitals.spo2 ? `SpO2 ${initVitals.spo2}%` : null,
      initVitals.temp ? `T ${initVitals.temp}`      : null,
    ].filter(Boolean).join("  ");
  });
  const [hpi,  setHpi]  = useState("");
  const [ros,  setRos]  = useState("");
  const [exam, setExam] = useState("");

  const [labs,       setLabs]       = useState("");
  const [imaging,    setImaging]    = useState("");
  const [ekg,        setEkg]        = useState("");
  const [newVitals,  setNewVitals]  = useState("");
  const [formatMode, setFormatMode] = useState("plain");
  const [pasteReady, setPasteReady] = useState("labeled");
  const [encounterType, setEncounterType] = useState("adult");

  // Bounceback
  const [isBounceback,   setIsBounceback]   = useState(false);
  const [bouncebackDate, setBouncebackDate] = useState("");

  // Consults
  const [consults, setConsults] = useState([]);

  // Timeline
  const DEFAULT_EVENTS = [
    { id:"triage",       label:"Triage",                   time:"", notes:"" },
    { id:"physician",    label:"Physician Evaluation",      time:"", notes:"" },
    { id:"labs_ordered", label:"Labs Ordered",              time:"", notes:"" },
    { id:"labs_result",  label:"Labs Resulted",             time:"", notes:"" },
    { id:"img_ordered",  label:"Imaging Ordered",           time:"", notes:"" },
    { id:"img_result",   label:"Imaging Resulted",          time:"", notes:"" },
    { id:"recheck",      label:"Recheck Vitals / Reassess", time:"", notes:"" },
    { id:"disposition",  label:"Disposition Decision",      time:"", notes:"" },
  ];
  const [timestamps, setTimestamps] = useState(DEFAULT_EVENTS);

  // EKG AI interpret state
  const [ekgBusy, setEkgBusy] = useState(false);

  // Workup rationale
  const [workupRationale,     setWorkupRationale]     = useState(null);
  const [workupRationaleBusy, setWorkupRationaleBusy] = useState(false);
  const [copiedWorkup,        setCopiedWorkup]        = useState(false);

  // Auto-ROS
  const [autoRosBusy, setAutoRosBusy] = useState(false);

  // New features state
  const [patientPregnant,   setPatientPregnant]   = useState("Unknown");
  const [patientWeight,     setPatientWeight]     = useState("");
  const [showProcedureModal,setShowProcedureModal]= useState(false);
  const [priorVisits,       setPriorVisits]       = useState(null);
  const [priorVisitsLoading,setPriorVisitsLoading]= useState(false);
  const [signOutBusy,       setSignOutBusy]       = useState(false);
  const [signOutDone,       setSignOutDone]       = useState(false);
  const [showSDM,           setShowSDM]           = useState(false);
  const [showAttestation,   setShowAttestation]   = useState(false);
  const [showNursingHandoff,setShowNursingHandoff]= useState(false);
  const [rerunAddendumBusy, setRerunAddendumBusy] = useState(false);

  // Provider info from UserPreferences (populated on mount)
  const [providerInfo, setProviderInfo] = useState({ name:"", credentials:"", facility:"" });

  // Slots
  const EMPTY_SLOT = () => ({
    cc:"", vitals:"", hpi:"", ros:"", exam:"",
    labs:"", imaging:"", ekg:"", newVitals:"",
    medsRaw:"", allergiesRaw:"", parsedMeds:[], parsedAllergies:[],
    mdmResult:null, dispResult:null, icdSelected:[], icdSuggestions:[],
    interventions:[], hpiSummary:null, hpiMode:"original",
    encounterType:"adult", p2Open:false,
  });
  const [slots,      setSlots]      = useState(() => [EMPTY_SLOT(),EMPTY_SLOT(),EMPTY_SLOT(),EMPTY_SLOT()]);
  const [activeSlot, setActiveSlot] = useState(0);
  const slotRef      = useRef(activeSlot);
  const [undoData,   setUndoData]   = useState(null);
  const [undoTimer,  setUndoTimer]  = useState(null);
  const [showUndo,   setShowUndo]   = useState(false);
  const [draftId,    setDraftId]    = useState(null);
  const slotStateRef = useRef({});

  const saveCurrentToSlot = useCallback((idx, state) => {
    setSlots(prev => { const next = [...prev]; next[idx] = { ...prev[idx], ...state }; return next; });
  }, []);

  const switchToSlot = useCallback((idx) => {
    if (idx === activeSlot) return;
    saveCurrentToSlot(activeSlot, slotStateRef.current);
    setSlots(prev => {
      const slot = prev[idx] || EMPTY_SLOT();
      setCC(slot.cc||""); setVitals(slot.vitals||""); setHpi(slot.hpi||"");
      setRos(slot.ros||""); setExam(slot.exam||"");
      setLabs(slot.labs||""); setImaging(slot.imaging||"");
      setEkg(slot.ekg||""); setNewVitals(slot.newVitals||"");
      setMedsRaw(slot.medsRaw||""); setAllergiesRaw(slot.allergiesRaw||"");
      setParsedMeds(slot.parsedMeds||[]); setParsedAllergies(slot.parsedAllergies||[]);
      setMdmResult(slot.mdmResult||null); setDispResult(slot.dispResult||null);
      setIcdSelected(slot.icdSelected||[]); setIcdSuggestions([]);
      setInterventions(slot.interventions||[]);
      setHpiSummary(slot.hpiSummary||null); setHpiMode(slot.hpiMode||"original");
      setEncounterType(slot.encounterType||"adult"); setP2Open(slot.p2Open||false);
      setP1Error(null); setP2Error(null);
      setWorkupRationale(null); setConsults([]);
      return prev;
    });
    setActiveSlot(idx); slotRef.current = idx;
  }, [activeSlot, saveCurrentToSlot]);

  const [mdmResult,  setMdmResult]  = useState(null);
  const [dispResult, setDispResult] = useState(null);

  const [p1Busy,   setP1Busy]   = useState(false);
  const [p2Busy,   setP2Busy]   = useState(false);
  const [p1Error,  setP1Error]  = useState(null);
  const [p2Error,  setP2Error]  = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [p2Open,   setP2Open]   = useState(false);
  const [copiedMDM,          setCopiedMDM]          = useState(false);
  const [copiedDisch,        setCopiedDisch]        = useState(false);
  const [copiedMDMFull,      setCopiedMDMFull]      = useState(false);
  const [copiedMDMOnly,      setCopiedMDMOnly]      = useState(false);
  const [copiedDischargeOnly,setCopiedDischargeOnly]= useState(false);
  const [savedNote,          setSavedNote]          = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [sentToNPI,          setSentToNPI]          = useState(false);
  const [sendingNPI,         setSendingNPI]         = useState(false);
  const [fatigueDismissed,     setFatigueDismissed]     = useState(false);
  const [vhImported,           setVhImported]           = useState(false);
  const [vhDismissed,          setVhDismissed]          = useState(false);
  const [vhAnalysis,           setVhAnalysis]           = useState(null);
  const [vhAnalysisDismissed,  setVhAnalysisDismissed]  = useState(false);
  const [nhResumed,            setNhResumed]            = useState(false);
  const [nhResumeDismissed,    setNhResumeDismissed]    = useState(false);
  const [showKbHelp,           setShowKbHelp]           = useState(false);
  const [addendumMode,         setAddendumMode]         = useState(false);
  const [addendumRef,          setAddendumRef]          = useState(null);
  const [medsRaw,         setMedsRaw]         = useState("");
  const [allergiesRaw,    setAllergiesRaw]    = useState("");
  const [parsedMeds,      setParsedMeds]      = useState([]);
  const [parsedAllergies, setParsedAllergies] = useState([]);
  const [medsParsing,     setMedsParsing]     = useState(false);
  const [medsError,       setMedsError]       = useState(null);
  const [quickDDx,          setQuickDDx]          = useState(null);
  const [quickDDxBusy,      setQuickDDxBusy]      = useState(false);
  const [quickDDxErr,       setQuickDDxErr]       = useState(null);
  const [quickDDxDismissed, setQuickDDxDismissed] = useState(false);
  const [hpiSummary,    setHpiSummary]    = useState(null);
  const [hpiSumBusy,    setHpiSumBusy]    = useState(false);
  const [hpiSumError,   setHpiSumError]   = useState(null);
  const [copiedHpiSum,  setCopiedHpiSum]  = useState(false);
  const [hpiMode,       setHpiMode]       = useState("original");
  const [icdSuggestions, setIcdSuggestions] = useState([]);
  const [icdSelected,    setIcdSelected]    = useState([]);
  const [icdSearching,   setIcdSearching]   = useState(false);
  const [icdError,       setIcdError]       = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [intLoading,    setIntLoading]    = useState(false);
  const [intGenerated,  setIntGenerated]  = useState(false);
  const [copiedP1,     setCopiedP1]     = useState(false);
  const [copiedP2,     setCopiedP2]     = useState(false);
  const [copiedInputs, setCopiedInputs] = useState(false);

  const effectiveHpi = hpiMode === "summary" && hpiSummary ? hpiSummary : hpi;
  const phase1Ready  = Boolean(cc.trim() || hpi.trim() || exam.trim());
  const phase2Ready  = Boolean(mdmResult && (labs.trim() || imaging.trim() || newVitals.trim()));
  const hasAnyResult = Boolean(mdmResult || dispResult);

  // Derived: critical flags from labs (sync, no AI)
  const criticalFlags = useMemo(() => detectCriticalValues(labs), [labs]);

  const fieldRefs    = useRef([]);
  const setRef       = useCallback((idx) => (ref) => { fieldRefs.current[idx] = ref; }, []);
  const advanceFocus = useCallback((idx) => { fieldRefs.current[idx+1]?.current?.focus(); }, []);

  // ── MDM ────────────────────────────────────────────────────────────────────
  const runMDM = useCallback(async () => {
    if (!phase1Ready || p1Busy) return;
    setP1Busy(true); setP1Error(null); setMdmResult(null); setDispResult(null);
    setWorkupRationale(null);
    try {
      const bouncebackContext = isBounceback
        ? `\nBOUNCEBACK ALERT: Patient is returning within 72 hours${bouncebackDate ? ` (prior visit: ${bouncebackDate})` : ""}. Document in MDM: prior visit diagnosis, what has changed, and clinical justification for current disposition differing from prior visit.`
        : "";
      const patientContext = [
        patientPregnant === "Yes" ? "\nPREGNANCY: Patient is PREGNANT — consider pregnancy-related diagnoses, avoid teratogenic medications, adjust radiation decisions." : "",
        patientPregnant === "Unknown" ? "\nPREGNANCY STATUS: Unknown — consider ordering pregnancy test if clinically relevant." : "",
        patientWeight ? `\nPATIENT WEIGHT: ${patientWeight}kg — use for weight-based medication dosing.` : "",
      ].join("");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc, vitals, hpi, ros, exam, vhAnalysis, parsedMeds, parsedAllergies, encounterType) + bouncebackContext + patientContext,
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res); setP2Open(true);
      setIcdSuggestions([]); setIcdSelected([]); setIcdError(null);
      setInterventions([]); setIntGenerated(false);
      setQuickDDxDismissed(true);
    } catch (e) { setP1Error("MDM generation failed: " + (e.message || "Check API connectivity")); }
    finally { setP1Busy(false); }
  }, [cc, vitals, hpi, ros, exam, phase1Ready, p1Busy, vhAnalysis, parsedMeds, parsedAllergies, encounterType, isBounceback, bouncebackDate]);

  // ── Disposition ────────────────────────────────────────────────────────────
  const runDisposition = useCallback(async () => {
    if (!mdmResult || p2Busy) return;
    setP2Busy(true); setP2Error(null); setDispResult(null);
    try {
      const consultContext = consults.length
        ? `\nCONSULTS OBTAINED:\n${consults.map(c => `  ${c.service}${c.provider ? " — Dr. "+c.provider : ""}${c.time ? " at "+c.time : ""}: ${c.recommendation}`).join("\n")}`
        : "";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildDispPrompt(mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam, parsedMeds, parsedAllergies, ekg) + consultContext,
        response_json_schema: DISP_SCHEMA,
      });
      setDispResult(res); setIntGenerated(false); setIntLoading(false);
    } catch (e) { setP2Error("Disposition generation failed: " + (e.message || "Check API connectivity")); }
    finally { setP2Busy(false); }
  }, [mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam, p2Busy, ekg, parsedMeds, parsedAllergies, consults]);

  // ── Workup Rationale ───────────────────────────────────────────────────────
  const runWorkupRationale = useCallback(async () => {
    if (!mdmResult || workupRationaleBusy) return;
    setWorkupRationaleBusy(true);
    try {
      const schema = {
        type:"object", required:["rationale_paragraph"],
        properties:{ rationale_paragraph: { type:"string" } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a board-certified emergency physician writing a brief workup rationale paragraph for the chart.

WORKING DIAGNOSIS: ${mdmResult.working_diagnosis || ""}
MUST-NOT-MISS DIAGNOSES: ${mdmResult.differential?.filter(d => d.must_not_miss).map(d => d.diagnosis).join(", ") || "none"}
RECOMMENDED WORKUP: ${(mdmResult.recommended_actions || []).join("; ")}
CRITICAL ACTIONS: ${(mdmResult.critical_actions || []).join("; ") || "none"}

Write a 2-3 sentence paragraph explaining WHY the ordered workup is clinically indicated. For each test/study, briefly state the clinical question it answers. Example format: "Laboratory studies including [tests] are ordered to evaluate for [reasons] and rule out [diagnoses]. Imaging with [study] is obtained to assess for [finding]." Be specific to this case. No headers, no bullets, no preamble. Suitable for direct chart documentation. Return JSON: { "rationale_paragraph": "..." }`,
        response_json_schema: schema,
      });
      setWorkupRationale(res?.rationale_paragraph?.trim() || "");
    } catch (e) { console.error("Workup rationale failed:", e); }
    finally { setWorkupRationaleBusy(false); }
  }, [mdmResult, workupRationaleBusy]);

  // ── EKG AI Interpretation ──────────────────────────────────────────────────
  const interpretEKG = useCallback(async (ekgText) => {
    if (!ekgText || ekgBusy) return;
    setEkgBusy(true);
    try {
      const schema = {
        type:"object", required:["interpretation"],
        properties:{ interpretation: { type:"string" } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a cardiologist writing a concise EKG interpretation for an ED chart note.

EKG DATA: ${ekgText}

Write a single sentence EKG interpretation suitable for EMR charting. Include rate, rhythm, key intervals (if provided), and any significant findings. Note ST changes explicitly. Example: "Normal sinus rhythm at 72 bpm, normal axis, PR 160ms, QRS 88ms, QTc 440ms, no ST elevation or depression, no T-wave inversions." If concerning findings are present, flag them clearly. Return JSON: { "interpretation": "..." }`,
        response_json_schema: schema,
      });
      if (res?.interpretation) setEkg(res.interpretation.trim());
    } catch (e) { console.error("EKG interpretation failed:", e); }
    finally { setEkgBusy(false); }
  }, [ekgBusy]);

  // ── Auto-ROS from HPI ──────────────────────────────────────────────────────
  const autoRosFromHpi = useCallback(async () => {
    if (!hpi.trim() || autoRosBusy) return;
    setAutoRosBusy(true);
    try {
      const schema = {
        type:"object", required:["ros_text"],
        properties:{ ros_text: { type:"string" } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency physician extracting Review of Systems (ROS) documentation from a nursing HPI note.

HPI TEXT: ${hpi}

Extract any symptoms mentioned (positive or negative) and organize them into a standard ROS format by body system. For each system, list ONLY symptoms explicitly mentioned in the HPI as positive (+) or negative (-/denies). Do NOT add symptoms not mentioned. Format example:
"Constitutional: Fever (-), chills (-), fatigue (+). Cardiovascular: Chest pain (+), palpitations (-). Respiratory: Shortness of breath (-). GI: Nausea (+), vomiting (-), abdominal pain (-)."

Only include body systems that have at least one symptom explicitly mentioned in the HPI. Return JSON: { "ros_text": "..." }`,
        response_json_schema: schema,
      });
      if (res?.ros_text?.trim()) setRos(res.ros_text.trim());
    } catch (e) { console.error("Auto-ROS failed:", e); }
    finally { setAutoRosBusy(false); }
  }, [hpi, autoRosBusy]);

  // ── Load prior visits ──────────────────────────────────────────────────────
  const loadPriorVisits = useCallback(async () => {
    if (priorVisitsLoading) return;
    setPriorVisitsLoading(true);
    try {
      const filter = demo?.mrn
        ? { patient_identifier: demo.mrn, sort:"-encounter_date", limit:5 }
        : { sort:"-encounter_date", limit:5 };
      const results = await base44.entities.ClinicalNote.list(filter).catch(() => []);
      const visits = (results||[])
        .filter(r => r.status === "finalized" && r.source === "QuickNote")
        .slice(0, 3);
      setPriorVisits(visits);
    } catch { setPriorVisits([]); }
    finally { setPriorVisitsLoading(false); }
  }, [priorVisitsLoading, demo]);

  // ── Generate sign-out → ShiftSignOut ──────────────────────────────────────
  const generateSignOut = useCallback(async () => {
    if (!mdmResult || signOutBusy) return;
    setSignOutBusy(true);
    try {
      const schema = {
        type:"object", required:["signout_text"],
        properties:{ signout_text:{ type:"string" } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ED physician generating a concise sign-out note for the oncoming provider.

PATIENT: ${[demo?.age, demo?.sex].filter(Boolean).join("yo ")||"Adult"}
CC: ${cc}
WORKING DIAGNOSIS: ${mdmResult.working_diagnosis||"TBD"}
MDM LEVEL: ${mdmResult.mdm_level||""}
PENDING: ${labs?"Labs: pending":""} ${imaging?"Imaging: pending":""}
DISPOSITION: ${dispResult?.disposition||"Pending"}

Write a single sign-out paragraph in SBAR format: Situation (CC and current status), Background (key hx/meds/allergies if relevant), Assessment (working dx and MDM level), Recommendation (what to do if patient deteriorates or if pending results return abnormal). 2-4 sentences total. Plain text, no headers. Return JSON: { "signout_text": "..." }`,
        response_json_schema: schema,
      });
      const text = res?.signout_text?.trim();
      if (text) {
        // Push to ShiftSignOut entity
        await base44.entities.ShiftSignOut.create({
          source:"QuickNote",
          patient_identifier: demo?.mrn||"",
          cc: cc||"",
          working_diagnosis: mdmResult.working_diagnosis||"",
          mdm_level: mdmResult.mdm_level||"",
          signout_text: text,
          status: "pending",
          created_date: new Date().toISOString(),
        }).catch(() => null);
        setSignOutDone(true);
        setTimeout(() => setSignOutDone(false), 4000);
      }
    } catch (e) { console.error("Sign-out failed:", e); }
    finally { setSignOutBusy(false); }
  }, [mdmResult, dispResult, cc, demo, labs, imaging, signOutBusy]);

  // ── Re-run MDM with addendum context ──────────────────────────────────────
  const runMDMAddendum = useCallback(async () => {
    if (!mdmResult || rerunAddendumBusy) return;
    setRerunAddendumBusy(true);
    try {
      const addendumPrompt = `\n\nADDENDUM — ADDITIONAL CLINICAL CONTEXT:
Previous MDM: ${mdmResult.working_diagnosis} (${mdmResult.mdm_level})
New information since prior assessment:
- Updated HPI: ${hpi}
- Labs resulted: ${labs||"pending"}
- Imaging resulted: ${imaging||"pending"}
- EKG: ${ekg||"not performed"}
- Recheck vitals: ${newVitals||"not yet"}
Revise the MDM if warranted. Preserve prior working diagnosis unless new data clearly refutes it.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc, vitals, hpi, ros, exam, vhAnalysis, parsedMeds, parsedAllergies, encounterType) + addendumPrompt,
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res);
    } catch (e) { console.error("Addendum re-run failed:", e); }
    finally { setRerunAddendumBusy(false); }
  }, [mdmResult, cc, vitals, hpi, ros, exam, labs, imaging, ekg, newVitals,
      vhAnalysis, parsedMeds, parsedAllergies, encounterType, rerunAddendumBusy]);

  // Smart text expansions (can be extended by user preferences in future)
  const smartExpansions = DEFAULT_EXPANSIONS;
  const stripLabels = (text) => {
    if (pasteReady !== "prose") return text;
    return text.replace(/^[A-Z][A-Z /&]+:\s*/gm, "").trim();
  };

  const copyNote = useCallback(() => {
    const text = buildFullNote(
      { cc, vitals, hpi:effectiveHpi, ros, exam }, mdmResult,
      { labs, imaging, newVitals }, dispResult,
      { icdSelected, interventions, parsedMeds, parsedAllergies }
    );
    navigator.clipboard.writeText(stripLabels(text)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [cc, vitals, effectiveHpi, ros, exam, mdmResult, labs, imaging, newVitals,
      dispResult, icdSelected, interventions, parsedMeds, parsedAllergies, pasteReady]);

  const copyClinicalInputs = useCallback(() => {
    const sections = [
      { label:"CHIEF COMPLAINT",   text:cc },
      { label:"TRIAGE VITALS",     text:vitals },
      { label:hpiMode==="summary"&&hpiSummary ? "HISTORY OF PRESENT ILLNESS (AI Summary)" : "HISTORY OF PRESENT ILLNESS", text:effectiveHpi },
      { label:"REVIEW OF SYSTEMS", text:ros },
      { label:"PHYSICAL EXAM",     text:exam },
    ].filter(s => s.text?.trim());
    if (!sections.length) return;
    const block = pasteReady === "prose"
      ? sections.map(s => s.text.trim()).join("\n\n")
      : sections.map(s => `${s.label}:\n${s.text.trim()}`).join("\n\n");
    navigator.clipboard.writeText(block).then(() => {
      setCopiedInputs(true); setTimeout(() => setCopiedInputs(false), 2500);
    });
  }, [cc, vitals, effectiveHpi, ros, exam, hpiMode, hpiSummary, pasteReady]);

  const copyPhase1 = useCallback(() => {
    if (!mdmResult) return;
    const prov = window._notryaProvider || {};
    const text = buildPhase1Copy(
      { cc, vitals, hpi:effectiveHpi, ros, exam }, mdmResult,
      { parsedMeds, parsedAllergies, hpiSummary, hpiMode,
        workupRationale,
        providerName: prov.full_name||demo?.full_name||"",
        sigBlock:     prov.sigBlock||"",
        demographics: { ...(demo||{}), facility:prov.facility, location:prov.location } },
      formatMode
    );
    navigator.clipboard.writeText(stripLabels(text)).then(() => {
      setCopiedP1(true); setTimeout(() => setCopiedP1(false), 3000);
    });
  }, [cc, vitals, effectiveHpi, ros, exam, mdmResult, parsedMeds, parsedAllergies,
      hpiSummary, hpiMode, workupRationale, demo, formatMode, pasteReady]);

  const copyPhase2 = useCallback(() => {
    if (!dispResult) return;
    const prov = window._notryaProvider || {};
    const consultBlock = consults.length
      ? "\n\nCONSULTS:\n" + consults.map(c =>
          `  ${c.service}${c.provider?" — Dr."+c.provider:""}${c.time?" at "+c.time:""}: ${c.recommendation}`
        ).join("\n")
      : "";
    const text = buildPhase2Copy(
      { labs, imaging, ekg, newVitals }, dispResult,
      { icdSelected, interventions,
        providerName: prov.full_name||demo?.full_name||"",
        sigBlock:     prov.sigBlock||"",
        demographics: { ...(demo||{}), facility:prov.facility } },
      formatMode
    ) + consultBlock;
    navigator.clipboard.writeText(stripLabels(text)).then(() => {
      setCopiedP2(true); setTimeout(() => setCopiedP2(false), 3000);
    });
  }, [labs, imaging, ekg, newVitals, dispResult, icdSelected, interventions,
      demo, formatMode, consults, pasteReady]);

  // Shift+3 — MDM only
  const copyMDMOnly = useCallback(() => {
    if (!mdmResult) return;
    const text = buildMDMBlock(mdmResult);
    navigator.clipboard.writeText(stripLabels(text)).then(() => {
      setCopiedMDMOnly(true); setTimeout(() => setCopiedMDMOnly(false), 2500);
    });
  }, [mdmResult, pasteReady]);

  // Shift+4 — discharge instructions only
  const copyDischargeOnly = useCallback(() => {
    const di = dispResult?.discharge_instructions;
    if (!di) return;
    const lines = [];
    if (di.diagnosis_explanation) { lines.push(di.diagnosis_explanation); lines.push(""); }
    if (di.medications?.length) {
      lines.push("Medications:"); di.medications.forEach(m => lines.push(`  • ${m}`)); lines.push("");
    }
    if (di.activity) lines.push(`Activity: ${di.activity}`);
    if (di.diet)     lines.push(`Diet: ${di.diet}`);
    if (di.return_precautions?.length) {
      lines.push("\nReturn to ED if:");
      di.return_precautions.forEach((r,i) => lines.push(`  ${i+1}. ${r}`));
    }
    if (di.followup) { lines.push(""); lines.push(`Follow-up: ${di.followup}`); }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopiedDischargeOnly(true); setTimeout(() => setCopiedDischargeOnly(false), 2500);
    });
  }, [dispResult]);

  const copyDischargeInstructions = copyDischargeOnly;

  // ── AI helpers ─────────────────────────────────────────────────────────────
  const summarizeHPI = useCallback(async () => {
    if (!hpi.trim() || hpiSumBusy) return;
    setHpiSumBusy(true); setHpiSumError(null); setHpiSummary(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a board-certified emergency physician rewriting a nursing triage HPI into a physician's clinical HPI paragraph.\n\nSTRICT ACCURACY RULES:\n- Do NOT add, infer, or extrapolate any detail not explicitly in the source.\n- Omit OPQRST elements not present in the source.\n- Single paragraph, 3-5 sentences, past tense, third person.\n- No headers, no bullets.\n\nSOURCE HPI:\n${hpi}\n\nReturn JSON: { "summary": "..." }`,
        response_json_schema: { type:"object", required:["summary"], properties:{ summary:{ type:"string" } } },
      });
      const text = res?.summary?.trim() || "";
      if (!text) throw new Error("Empty response");
      setHpiSummary(text);
    } catch (e) { setHpiSumError("HPI summary failed: " + (e.message || "Check API")); }
    finally { setHpiSumBusy(false); }
  }, [hpi, hpiSumBusy]);

  const parseMedsAllergies = useCallback(async () => {
    if ((!medsRaw.trim() && !allergiesRaw.trim()) || medsParsing) return;
    setMedsParsing(true); setMedsError(null);
    try {
      const schema = {
        type:"object", required:["medications","allergies"],
        properties:{
          medications:{ type:"array", items:{ type:"object", required:["name","dose","route","frequency"],
            properties:{ name:{type:"string"}, dose:{type:"string"}, route:{type:"string"}, frequency:{type:"string"} } } },
          allergies:{ type:"array", items:{ type:"object", required:["allergen","reaction"],
            properties:{ allergen:{type:"string"}, reaction:{type:"string"} } } },
        },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Parse meds and allergies. Meds: ${medsRaw||"none"}. Allergies: ${allergiesRaw||"none"}. Standardize name (generic), dose, route (PO/IV/SQ/IM/TOP/INH/SL), frequency (Daily/BID/TID/QID/QHS/PRN). Return JSON only.`,
        response_json_schema: schema,
      });
      setParsedMeds(res?.medications||[]); setParsedAllergies(res?.allergies||[]);
    } catch (e) { setMedsError("Parse failed: " + (e.message||"try again")); }
    finally { setMedsParsing(false); }
  }, [medsRaw, allergiesRaw, medsParsing]);

  const runQuickDDx = useCallback(async () => {
    if (quickDDxBusy || (!cc.trim() && !hpi.trim())) return;
    setQuickDDxBusy(true); setQuickDDxErr(null); setQuickDDxDismissed(false);
    try {
      const schema = {
        type:"object", required:["differential"],
        properties:{ differential:{ type:"array", minItems:3, maxItems:5,
          items:{ type:"object", required:["diagnosis","probability","supporting_evidence","against","must_not_miss"],
            properties:{ diagnosis:{type:"string"}, probability:{type:"string"},
              supporting_evidence:{type:"string"}, against:{type:"string"}, must_not_miss:{type:"boolean"} } } } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate rapid ED differential. CC: ${cc||"?"} HPI: ${hpi||"?"} Vitals: ${vitals||"?"} ${ros?"ROS: "+ros:""} ${exam?"PE: "+exam:""}. 3-5 diagnoses with probability (high/moderate/low), supporting_evidence, against, must_not_miss. JSON only.`,
        response_json_schema: schema,
      });
      if (!res?.differential?.length) throw new Error("Empty response");
      setQuickDDx(res.differential);
    } catch (e) { setQuickDDxErr("Quick DDx failed: " + (e.message||"try again")); }
    finally { setQuickDDxBusy(false); }
  }, [quickDDxBusy, cc, hpi, vitals, ros, exam]);

  const searchICD10 = useCallback(async (diagnosisText) => {
    if (!diagnosisText || icdSearching) return;
    setIcdSearching(true); setIcdError(null); setIcdSuggestions([]);
    try {
      const schema = {
        type:"object", required:["codes"],
        properties:{ codes:{ type:"array", minItems:1, maxItems:6,
          items:{ type:"object", required:["code","description","type","specificity_note"],
            properties:{ code:{type:"string"}, description:{type:"string"}, type:{type:"string"}, specificity_note:{type:"string"} } } } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `CPC coder: ICD-10-CM codes for "${diagnosisText}" in ED context. 4-6 codes ordered primary to secondary. Each: code, description, type (primary/secondary/comorbidity/symptom), specificity_note. Billable codes only. JSON only.`,
        response_json_schema: schema,
      });
      setIcdSuggestions(res?.codes||[]);
    } catch (e) { setIcdError("ICD-10 search failed: " + (e.message||"")); }
    finally { setIcdSearching(false); }
  }, [icdSearching, cc, mdmResult, dispResult]);

  const generateInterventions = useCallback(async () => {
    if (intLoading || intGenerated) return;
    setIntLoading(true);
    try {
      const schema = {
        type:"object", required:["interventions"],
        properties:{ interventions:{ type:"array", maxItems:12,
          items:{ type:"object", required:["type","name","confirmed"],
            properties:{ type:{type:"string"}, name:{type:"string"}, dose_route:{type:"string"},
              time_given:{type:"string"}, response:{type:"string"}, confirmed:{type:"boolean"} } } } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `ED physician: pre-populate interventions list for this encounter. CC: ${cc} Dx: ${mdmResult?.working_diagnosis} Labs: ${labs||"none"} Imaging: ${imaging||"none"} Recheck: ${newVitals||"none"} Disposition: ${dispResult?.disposition||"TBD"}. type: medication|procedure|iv_access|monitoring|imaging|lab|other. confirmed: true. time_given: empty string. JSON only.`,
        response_json_schema: schema,
      });
      setInterventions((res?.interventions||[]).map((item,i) => ({ ...item, id:`int-${i}-${Date.now()}` })));
      setIntGenerated(true);
    } catch (e) { console.error("Interventions failed:", e); }
    finally { setIntLoading(false); }
  }, [intLoading, intGenerated, cc, mdmResult, labs, imaging, newVitals, dispResult]);

  const saveNote = useCallback(async () => {
    if (saving || !hasAnyResult) return;
    setSaving(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      const fullText = buildFullNote(
        { cc, vitals, hpi, ros, exam }, mdmResult,
        { labs, imaging, newVitals }, dispResult,
        { icdSelected, interventions, parsedMeds, parsedAllergies }
      );
      await base44.entities.ClinicalNote.create({
        source:"QuickNote", encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"", chief_complaint:cc||"", raw_note:fullText, full_note_text:fullText,
        working_diagnosis:mdmResult?.working_diagnosis||dispResult?.final_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"", mdm_narrative:mdmResult?.mdm_narrative||"",
        mdm:mdmResult?.mdm_narrative||"", disposition:dispResult?.disposition||"",
        provider_name:user?.full_name||user?.email||"",
        patient_identifier:demo?.mrn||"", status:"finalized", flag_reviewed:false,
        result_flags_json:dispResult?.result_flags?.length ? JSON.stringify(dispResult.result_flags) : "",
        icd_codes_json:icdSelected.length ? JSON.stringify(icdSelected) : "",
        meds_raw:medsRaw||"", allergies_raw:allergiesRaw||"",
      });
      setSavedNote(true); setTimeout(() => setSavedNote(false), 3000);
      if (draftId) { base44.entities.ClinicalNote.update(draftId, { status:"superseded" }).catch(() => null); setDraftId(null); }
    } catch (e) { console.error("Save failed:", e); }
    finally { setSaving(false); }
  }, [saving, hasAnyResult, cc, vitals, hpi, ros, exam, labs, imaging, newVitals,
      mdmResult, dispResult, demo, icdSelected, interventions, parsedMeds, parsedAllergies, medsRaw, allergiesRaw, draftId]);

  const sendToNPI = useCallback(async () => {
    if (sendingNPI) return;
    setSendingNPI(true);
    try {
      const prior = await base44.entities.ClinicalNote.list({ sort:"-created_date", limit:5 }).catch(() => []);
      await Promise.all((prior||[]).filter(r=>r.source==="QN-Handoff"&&r.status==="pending")
        .map(r => base44.entities.ClinicalNote.update(r.id, { status:"superseded" }).catch(() => null)));
      await base44.entities.ClinicalNote.create({
        source:"QN-Handoff", status:"pending",
        encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"", full_note_text:vitals||"", hpi_raw:hpi||"",
        ros_raw:ros||"", exam_raw:exam||"", labs_raw:labs||"", imaging_raw:imaging||"",
        working_diagnosis:mdmResult?.working_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"", mdm_narrative:mdmResult?.mdm_narrative||"",
        patient_identifier:demo?.mrn||"",
      });
      setSentToNPI(true);
      setTimeout(() => { window.location.href = "/NewPatientInput"; }, 1200);
    } catch (e) { console.error("Send to NPI failed:", e); setSendingNPI(false); }
  }, [sendingNPI, cc, vitals, hpi, ros, exam, labs, imaging, mdmResult, demo]);

  const handleNewEncounter = useCallback(() => {
    const snap = { cc, vitals, hpi, ros, exam, labs, imaging, ekg, newVitals,
      parsedMeds, parsedAllergies, mdmResult, dispResult };
    setUndoData(snap);
    [setCC,setVitals,setHpi,setRos,setExam,setLabs,setImaging,setEkg,setNewVitals].forEach(fn => fn(""));
    setParsedMeds([]); setParsedAllergies([]);
    setMdmResult(null); setDispResult(null);
    setP1Error(null); setP2Error(null); setP2Open(false);
    setWorkupRationale(null); setConsults([]);
    setQuickDDxDismissed(false); setIsBounceback(false);
    setShowUndo(true);
    const t = setTimeout(() => { setShowUndo(false); setUndoData(null); }, 6000);
    setUndoTimer(t);
  }, [cc, vitals, hpi, ros, exam, labs, imaging, ekg, newVitals,
      parsedMeds, parsedAllergies, mdmResult, dispResult]);

  const handleUndo = useCallback(() => {
    if (undoData) {
      setCC(undoData.cc||""); setVitals(undoData.vitals||""); setHpi(undoData.hpi||"");
      setRos(undoData.ros||""); setExam(undoData.exam||"");
      setLabs(undoData.labs||""); setImaging(undoData.imaging||"");
      setEkg(undoData.ekg||""); setNewVitals(undoData.newVitals||"");
      setParsedMeds(undoData.parsedMeds||[]); setParsedAllergies(undoData.parsedAllergies||[]);
      setMdmResult(undoData.mdmResult||null); setDispResult(undoData.dispResult||null);
      if (undoData.mdmResult) setP2Open(true);
    }
    clearTimeout(undoTimer); setShowUndo(false); setUndoData(null);
  }, [undoData, undoTimer]);

  const makeKeyDown = useCallback((idx, isLast, onEnterSubmit) => (e) => {
    if (e.key==="Tab" && !e.shiftKey) { e.preventDefault(); if (!isLast) advanceFocus(idx); }
    if ((e.metaKey||e.ctrlKey) && e.key==="Enter") { e.preventDefault(); if (onEnterSubmit) onEnterSubmit(); }
  }, [advanceFocus]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = tag==="textarea" || tag==="input";
      if ((e.metaKey||e.ctrlKey) && e.key==="Enter") {
        e.preventDefault();
        const activePhase = parseInt(document.activeElement?.dataset?.phase||"1");
        if (p2Open && activePhase===2) runDisposition(); else runMDM();
        return;
      }
      if (e.altKey && !e.metaKey) {
        const jumpMap = { h:2, r:3, e:4, l:5 };
        const idx = jumpMap[e.key.toLowerCase()];
        if (idx !== undefined) { e.preventDefault(); fieldRefs.current[idx]?.current?.focus(); return; }
      }
      if (e.shiftKey && e.key==="?" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowKbHelp(h=>!h); return; }
      if (e.shiftKey && e.key==="1" && !e.ctrlKey && !e.metaKey && mdmResult)    { e.preventDefault(); copyPhase1();        return; }
      if (e.shiftKey && e.key==="2" && !e.ctrlKey && !e.metaKey && dispResult)   { e.preventDefault(); copyPhase2();        return; }
      if (e.shiftKey && e.key==="3" && !e.ctrlKey && !e.metaKey && mdmResult)    { e.preventDefault(); copyMDMOnly();       return; }
      if (e.shiftKey && e.key==="4" && !e.ctrlKey && !e.metaKey && dispResult)   { e.preventDefault(); copyDischargeOnly(); return; }
      if (inInput) return;
      if ((e.key==="e"||e.key==="E") && !e.ctrlKey && !e.metaKey && mdmResult) {
        e.preventDefault(); window.dispatchEvent(new CustomEvent("qn-edit-narrative")); return;
      }
      if ((e.key==="c"||e.key==="C") && !e.ctrlKey && !e.metaKey) {
        if (e.shiftKey) { e.preventDefault(); copyClinicalInputs(); return; }
        if (mdmResult||dispResult) { e.preventDefault(); copyNote(); }
      }
      if ((e.key==="p"||e.key==="P") && !e.ctrlKey && !e.metaKey) { e.preventDefault(); window.print(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [p2Open, mdmResult, dispResult, runMDM, runDisposition, copyNote,
      copyClinicalInputs, copyPhase1, copyPhase2, copyMDMOnly, copyDischargeOnly]);

  useEffect(() => { if (p2Open) setTimeout(() => { fieldRefs.current[5]?.current?.focus(); }, 80); }, [p2Open]);

  useEffect(() => {
    const saveDraft = async () => {
      if (!cc.trim() && !hpi.trim()) return;
      const payload = { source:"QuickNote", status:"draft",
        encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"", hpi_raw:hpi||"", ros_raw:ros||"", exam_raw:exam||"",
        labs_raw:labs||"", imaging_raw:imaging||"", full_note_text:vitals||"",
        working_diagnosis:mdmResult?.working_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"", mdm_narrative:mdmResult?.mdm_narrative||"" };
      try {
        if (draftId) await base44.entities.ClinicalNote.update(draftId, payload).catch(() => null);
        else { const rec = await base44.entities.ClinicalNote.create(payload).catch(() => null); if (rec?.id) setDraftId(rec.id); }
      } catch {}
    };
    const interval = setInterval(saveDraft, 90000);
    return () => clearInterval(interval);
  }, [cc, hpi, ros, exam, labs, imaging, vitals, mdmResult, draftId]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("vitals");
      if (v) { setVitals(decodeURIComponent(v)); setVhImported(true); window.history.replaceState({}, "", window.location.pathname); }
    } catch {}
    base44.entities.UserPreferences.list({ sort:"-created_date", limit:1 }).then(results => {
      const r = results?.[0];
      if (r) {
        if (r.provider_name && !demo?.full_name) {
          window._notryaProvider = { full_name:[r.provider_name,r.credentials].filter(Boolean).join(", "),
            firstName:r.provider_name, facility:r.facility||"",
            location:r.location||"Emergency Department", sigBlock:r.signature_block||"" };
        }
        if (r.format_mode) setFormatMode(r.format_mode);
        if (r.default_encounter_type) setEncounterType(r.default_encounter_type);
        setProviderInfo({ name:r.provider_name||"", credentials:r.credentials||"", facility:r.facility||"" });
      }
    }).catch(() => null);
    base44.entities.ClinicalNote.list({ sort:"-created_date", limit:10 }).then(results => {
      const all = results||[];
      const vhRec = all.find(r=>r.source==="VH-Analysis"&&r.status==="pending");
      if (vhRec) {
        let flags=[]; try { flags=JSON.parse(vhRec.ros_raw||"[]"); } catch {}
        setVhAnalysis({ trend_narrative:vhRec.full_note_text||"", vitals_summary:vhRec.hpi_raw||"",
          clinical_flags:Array.isArray(flags)?flags:[] });
        base44.entities.ClinicalNote.update(vhRec.id, { status:"imported" }).catch(() => null);
      }
      const nhRec = all.find(r=>r.source==="NH-Resume"&&r.status==="pending");
      if (nhRec) {
        if (nhRec.cc) setCC(nhRec.cc); if (nhRec.hpi_raw) setHpi(nhRec.hpi_raw);
        if (nhRec.ros_raw) setRos(nhRec.ros_raw); if (nhRec.exam_raw) setExam(nhRec.exam_raw);
        if (nhRec.labs_raw) setLabs(nhRec.labs_raw); if (nhRec.imaging_raw) setImaging(nhRec.imaging_raw);
        setNhResumed(true);
        base44.entities.ClinicalNote.update(nhRec.id, { status:"imported" }).catch(() => null);
      }
      const addRec = all.find(r=>r.source==="NH-Addendum"&&r.status==="pending");
      if (addRec) {
        setAddendumRef({ cc:addRec.cc||"", working_diagnosis:addRec.working_diagnosis||"",
          mdm_level:addRec.mdm_level||"", patient_identifier:addRec.patient_identifier||"" });
        setAddendumMode(true); setP2Open(true);
        base44.entities.ClinicalNote.update(addRec.id, { status:"imported" }).catch(() => null);
      }
    }).catch(() => null);
    base44.entities.ClinicalNote.list({ sort:"-created_date", limit:5 }).then(results => {
      const draft = (results||[]).find(r=>r.status==="draft"&&r.source==="QuickNote");
      if (draft) { const age=Date.now()-new Date(draft.created_date||0).getTime(); if (age<8*3600000) setDraftId(draft.id); }
    }).catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    slotStateRef.current = { cc, vitals, hpi, ros, exam, labs, imaging, ekg, newVitals,
      medsRaw, allergiesRaw, parsedMeds, parsedAllergies,
      mdmResult, dispResult, icdSelected, interventions,
      hpiSummary, hpiMode, encounterType, p2Open };
  });

  const isFatigueRisk = useMemo(() => { const h = new Date().getHours(); return h>=17||h<=7; }, []);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : "var(--qn-bg)",
      minHeight:embedded ? "auto" : "100vh", color:"var(--qn-txt)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:embedded?"0":"0 16px 40px" }}>

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
                <span style={{ color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:"var(--qn-txt3)", letterSpacing:2 }}>QUICKNOTE</span>
              </div>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,.5),transparent)" }} />
            </div>
            <h1 className="qn-shim" style={{ fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(22px,4vw,38px)", fontWeight:900, letterSpacing:-.5,
              lineHeight:1.1, margin:"0 0 4px" }}>QuickNote</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt4)", margin:0 }}>
              Paste · Cmd+Enter MDM · Cmd+Enter Disposition · Shift+1/2/3/4 copy sections · C full note · Ctrl+T template
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }} className="no-print">
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"var(--qn-teal)" }}>QuickNote</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)",
              letterSpacing:1.5, textTransform:"uppercase", background:"rgba(0,229,192,.1)",
              border:"1px solid rgba(0,229,192,.25)", borderRadius:4, padding:"2px 7px" }}>
              v11 · MDM · Disposition · Discharge Rx
            </span>
          </div>
        )}

        <PatientBanner demo={demo} />
        {isFatigueRisk && !fatigueDismissed && <FatigueBanner onDismiss={() => setFatigueDismissed(true)} />}
        <StepProgress phase1Done={Boolean(mdmResult)} phase2Done={Boolean(dispResult)} p2Open={p2Open} />

        {!embedded && (
          <div style={{ display:"flex", gap:5, marginBottom:10, padding:"6px 10px", borderRadius:10,
            background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}>
            {slots.map((slot, i) => {
              const isActive = i===activeSlot;
              const hasData = !!(slot.cc||slot.hpi||slot.mdmResult);
              const slotLabel = slot.cc ? slot.cc.slice(0,18)+(slot.cc.length>18?"…":"") : `Slot ${i+1}`;
              return (
                <button key={i} onClick={() => switchToSlot(i)}
                  style={{ flex:1, padding:"5px 8px", borderRadius:7, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:isActive?700:500, fontSize:11,
                    transition:"all .15s", textAlign:"left",
                    border:`1px solid ${isActive?"rgba(0,229,192,.5)":hasData?"rgba(42,79,122,.5)":"rgba(42,79,122,.25)"}`,
                    background:isActive?"rgba(0,229,192,.12)":hasData?"rgba(14,37,68,.6)":"transparent",
                    color:isActive?"var(--qn-teal)":hasData?"var(--qn-txt3)":"var(--qn-txt4)" }}>
                  {isActive && <span style={{ marginRight:4, fontSize:8 }}>●</span>}
                  {hasData && !isActive && <span style={{ marginRight:4, fontSize:8, color:"var(--qn-gold)" }}>◆</span>}
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, opacity:.5 }}>P{i+1} </span>
                  {slotLabel}
                </button>
              );
            })}
            <div style={{ borderLeft:"1px solid rgba(42,79,122,.3)", margin:"2px 4px" }} />
            <button onClick={() => setShowKbHelp(h=>!h)}
              style={{ padding:"4px 9px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
                border:"1px solid rgba(42,79,122,.4)", background:"transparent",
                color:"var(--qn-txt4)" }}>?</button>
          </div>
        )}

        {showUndo && <UndoToast onUndo={handleUndo} onDismiss={() => { clearTimeout(undoTimer); setShowUndo(false); setUndoData(null); }} />}
        {nhResumed && !nhResumeDismissed && <NhResumeBanner onDismiss={() => setNhResumeDismissed(true)} />}
        {vhImported && !vhDismissed && <VhImportBanner onDismiss={() => setVhDismissed(true)} />}
        <VhAnalysisCard vhAnalysis={vhAnalysis&&!vhAnalysisDismissed?vhAnalysis:null} onDismiss={() => setVhAnalysisDismissed(true)} />
        {addendumMode && <AddendumBanner addendumRef={addendumRef} />}

        {/* Prior Visits */}
        <PriorVisitsPanel
          visits={priorVisits} loading={priorVisitsLoading}
          onLoad={loadPriorVisits}
        />

        {/* Sepsis/SIRS auto-check — appears once vitals have content */}
        {(vitals.trim().length > 10 || labs.trim().length > 5) && (
          <SepsisBanner vitalsText={vitals} labsText={labs} />
        )}

        <Phase1Panel
          cc={cc} setCC={setCC} vitals={vitals} setVitals={setVitals}
          hpi={hpi} setHpi={setHpi} ros={ros} setRos={setRos} exam={exam} setExam={setExam}
          encounterType={encounterType} setEncounterType={setEncounterType}
          hpiMode={hpiMode} setHpiMode={setHpiMode} hpiSummary={hpiSummary} setHpiSummary={setHpiSummary}
          hpiSumBusy={hpiSumBusy} hpiSumError={hpiSumError} copiedHpiSum={copiedHpiSum} setCopiedHpiSum={setCopiedHpiSum}
          summarizeHPI={summarizeHPI}
          quickDDx={quickDDx} quickDDxBusy={quickDDxBusy} quickDDxErr={quickDDxErr}
          quickDDxDismissed={quickDDxDismissed} setQuickDDxDismissed={setQuickDDxDismissed}
          runQuickDDx={runQuickDDx}
          medsRaw={medsRaw} setMedsRaw={setMedsRaw} allergiesRaw={allergiesRaw} setAllergiesRaw={setAllergiesRaw}
          parsedMeds={parsedMeds} parsedAllergies={parsedAllergies}
          setParsedMeds={setParsedMeds} setParsedAllergies={setParsedAllergies}
          medsParsing={medsParsing} medsError={medsError} parseMedsAllergies={parseMedsAllergies}
          p1Busy={p1Busy} p1Error={p1Error} phase1Ready={phase1Ready} mdmResult={mdmResult}
          copiedInputs={copiedInputs} copyClinicalInputs={copyClinicalInputs}
          setRef={setRef} makeKeyDown={makeKeyDown} runMDM={runMDM}
          isBounceback={isBounceback} setIsBounceback={setIsBounceback}
          bouncebackDate={bouncebackDate} setBouncebackDate={setBouncebackDate}
          autoRosFromHpi={autoRosFromHpi} autoRosBusy={autoRosBusy}
          patientPregnant={patientPregnant} setPatientPregnant={setPatientPregnant}
          patientWeight={patientWeight} setPatientWeight={setPatientWeight}
          smartExpansions={smartExpansions}
        />

        {/* MDM Result */}
        {mdmResult && (
          <div style={{ marginBottom:14, padding:"16px", background:"rgba(8,22,40,.5)",
            border:"1px solid rgba(0,229,192,.2)", borderRadius:14 }} className="print-body">
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:15, color:"var(--qn-teal)" }}>Medical Decision Making</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.2)",
                borderRadius:4, padding:"2px 7px" }}>AMA/CMS 2023 · ACEP</span>
              {isBounceback && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-coral)", background:"rgba(255,107,107,.1)",
                  border:"1px solid rgba(255,107,107,.35)", borderRadius:4, padding:"2px 7px" }}>
                  ⚠ Bounceback
                </span>
              )}
              <div style={{ flex:1 }} />
              {/* Workup rationale button */}
              <button onClick={runWorkupRationale} disabled={workupRationaleBusy}
                style={{ padding:"4px 11px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${workupRationaleBusy ? "rgba(42,79,122,.3)" : "rgba(245,200,66,.4)"}`,
                  background:workupRationaleBusy ? "rgba(14,37,68,.4)" : "rgba(245,200,66,.07)",
                  color:workupRationaleBusy ? "var(--qn-txt4)" : "var(--qn-gold)",
                  letterSpacing:.4, transition:"all .15s" }}>
                {workupRationaleBusy ? "● …" : "✦ Workup Rationale"}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(buildMDMBlock(mdmResult)).then(() => { setCopiedMDMFull(true); setTimeout(() => setCopiedMDMFull(false), 2000); }); }}
                style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${copiedMDMFull?"rgba(61,255,160,.5)":"rgba(0,229,192,.35)"}`,
                  background:copiedMDMFull?"rgba(61,255,160,.1)":"rgba(0,229,192,.07)",
                  color:copiedMDMFull?"var(--qn-green)":"var(--qn-teal)", transition:"all .15s" }}>
                {copiedMDMFull ? "✓ MDM Copied" : "Copy MDM"}
              </button>
              <button onClick={() => { setMdmResult(null); setDispResult(null); setP2Open(false); setWorkupRationale(null); }}
                style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:"1px solid rgba(245,200,66,.35)", background:"rgba(245,200,66,.07)",
                  color:"var(--qn-gold)", transition:"all .15s" }}>↩ Re-run MDM</button>
              <button onClick={runMDMAddendum} disabled={rerunAddendumBusy}
                title="Re-run MDM incorporating new labs/imaging/vitals context"
                style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${rerunAddendumBusy ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.4)"}`,
                  background:rerunAddendumBusy ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.07)",
                  color:rerunAddendumBusy ? "var(--qn-txt4)" : "var(--qn-purple)",
                  transition:"all .15s" }}>
                {rerunAddendumBusy ? "● …" : "+ Addendum Re-run"}
              </button>
            </div>

            <MDMResult result={mdmResult} copiedMDM={copiedMDM} setCopiedMDM={setCopiedMDM}
              onNarrativeEdit={text => setMdmResult(prev => ({ ...prev, mdm_narrative:text }))} />

            {/* MDM Level Explainer */}
            {mdmResult.mdm_level && (
              <details style={{ marginTop:10 }}>
                <summary style={{ cursor:"pointer", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, fontWeight:700, color:"var(--qn-txt4)", letterSpacing:1,
                  textTransform:"uppercase", listStyle:"none" }}>
                  ▶ Why {mdmResult.mdm_level} complexity?
                </summary>
                <div style={{ marginTop:8, padding:"10px 12px", borderRadius:8,
                  background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.3)" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                    {[
                      { label:"Problem Complexity", value:mdmResult.problem_complexity, color:"var(--qn-teal)" },
                      { label:"Data Complexity",    value:mdmResult.data_complexity,    color:"var(--qn-blue)" },
                      { label:"Risk Level",         value:mdmResult.risk_tier,          color:"var(--qn-gold)" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                          color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                          marginBottom:4 }}>{label}</div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                          fontWeight:600, color, lineHeight:1.4 }}>{value || "—"}</div>
                      </div>
                    ))}
                  </div>
                  {mdmResult.risk_rationale && (
                    <div style={{ marginTop:8, fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      color:"var(--qn-txt2)", lineHeight:1.6, paddingTop:8,
                      borderTop:"1px solid rgba(42,79,122,.25)" }}>
                      {mdmResult.risk_rationale}
                    </div>
                  )}
                  <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"rgba(107,158,200,.45)", letterSpacing:.4 }}>
                    MDM level is driven by the HIGHEST column achieved — Problem, Data, or Risk
                  </div>
                </div>
              </details>
            )}

            {/* Workup Rationale card */}
            {workupRationale && (
              <div className="qn-fade" style={{ marginTop:10, padding:"12px 14px", borderRadius:10,
                background:"rgba(245,200,66,.05)", border:"1px solid rgba(245,200,66,.3)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                    color:"var(--qn-gold)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
                    Workup Rationale
                  </span>
                  <button onClick={() => {
                      navigator.clipboard.writeText(workupRationale).then(() => {
                        setCopiedWorkup(true); setTimeout(() => setCopiedWorkup(false), 2000);
                      });
                    }}
                    style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                      border:`1px solid ${copiedWorkup ? "rgba(61,255,160,.5)" : "rgba(245,200,66,.4)"}`,
                      background:copiedWorkup ? "rgba(61,255,160,.1)" : "transparent",
                      color:copiedWorkup ? "var(--qn-green)" : "var(--qn-gold)",
                      letterSpacing:.4, transition:"all .15s" }}>
                    {copiedWorkup ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--qn-txt2)", lineHeight:1.75 }}>
                  {workupRationale}
                </div>
                <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color:"rgba(245,200,66,.5)", letterSpacing:.4 }}>
                  Paste into EHR workup rationale / clinical indication field
                </div>
              </div>
            )}
          </div>
        )}

        {p2Open && (
          <Phase2Panel
            labs={labs} setLabs={setLabs} imaging={imaging} setImaging={setImaging}
            ekg={ekg} setEkg={setEkg} newVitals={newVitals} setNewVitals={setNewVitals}
            p2Busy={p2Busy} p1Busy={p1Busy} p2Error={p2Error}
            phase2Ready={phase2Ready} mdmResult={mdmResult} dispResult={dispResult}
            dispColor={dispColor}
            setRef={setRef} makeKeyDown={makeKeyDown} runDisposition={runDisposition}
            consults={consults} setConsults={setConsults}
            criticalFlags={criticalFlags}
            ekgBusy={ekgBusy} onEkgInterpret={interpretEKG}
          />
        )}

        {dispResult && (
          <div style={{ marginBottom:14, padding:"16px", background:"rgba(8,22,40,.5)",
            border:`1px solid ${dispColor(dispResult.disposition)}30`, borderRadius:14 }} className="print-body">
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:15, color:dispColor(dispResult.disposition) }}>Reevaluation &amp; Disposition</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)",
                letterSpacing:1, textTransform:"uppercase", background:"rgba(59,158,255,.1)",
                border:"1px solid rgba(59,158,255,.2)", borderRadius:4, padding:"2px 7px" }}>ACEP Guidelines</span>
            </div>
            <DispositionResult result={dispResult} copiedDisch={copiedDisch} setCopiedDisch={setCopiedDisch}
              onDiagExplanationEdit={text => setDispResult(prev => ({
                ...prev, discharge_instructions:{ ...(prev.discharge_instructions||{}), diagnosis_explanation:text } }))} />
            {dispResult?.discharge_instructions?.diagnosis_explanation &&
             dispResult?.disposition &&
             !dispResult.disposition.toLowerCase().includes("admit") &&
             !dispResult.disposition.toLowerCase().includes("icu") && (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <button onClick={copyDischargeInstructions}
                  style={{ padding:"7px 16px", borderRadius:8, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:`1px solid ${copiedDischargeOnly?"rgba(61,255,160,.5)":"rgba(61,255,160,.35)"}`,
                    background:copiedDischargeOnly?"rgba(61,255,160,.15)":"rgba(61,255,160,.07)",
                    color:"var(--qn-green)", transition:"all .15s" }}>
                  {copiedDischargeOnly ? "✓ Discharge Instructions Copied" : "🖨 Copy Discharge Instructions"}
                  {!copiedDischargeOnly && <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, opacity:.5, marginLeft:6 }}>[Shift+4]</span>}
                </button>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", letterSpacing:.4 }}>Patient-facing — no clinical codes</span>
              </div>
            )}
          </div>
        )}

        {mdmResult && (
          <ClinicalCalcsCard cc={cc} workingDx={mdmResult?.working_diagnosis||""}
            labs={labs} imaging={imaging}
            onAddToMDM={text => setMdmResult(prev => ({ ...prev,
              mdm_narrative:prev?.mdm_narrative ? prev.mdm_narrative+"\n\n"+text : text }))} />
        )}

        {/* SDM + Attestation + Nursing Handoff — shown when disposition result exists */}
        {dispResult && (
          <div style={{ marginBottom:14 }}>
            {/* Toggle buttons */}
            <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }} className="no-print">
              <button onClick={() => setShowSDM(s => !s)}
                style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${showSDM ? "rgba(59,158,255,.5)" : "rgba(42,79,122,.4)"}`,
                  background:showSDM ? "rgba(59,158,255,.1)" : "transparent",
                  color:showSDM ? "var(--qn-blue)" : "var(--qn-txt4)",
                  letterSpacing:.5, transition:"all .15s" }}>
                {showSDM ? "▲" : "▼"} Shared Decision Making
              </button>
              <button onClick={() => setShowAttestation(s => !s)}
                style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${showAttestation ? "rgba(155,109,255,.5)" : "rgba(42,79,122,.4)"}`,
                  background:showAttestation ? "rgba(155,109,255,.1)" : "transparent",
                  color:showAttestation ? "var(--qn-purple)" : "var(--qn-txt4)",
                  letterSpacing:.5, transition:"all .15s" }}>
                {showAttestation ? "▲" : "▼"} Physician Attestation
              </button>
              <button onClick={() => setShowNursingHandoff(s => !s)}
                style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${showNursingHandoff ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.4)"}`,
                  background:showNursingHandoff ? "rgba(61,255,160,.1)" : "transparent",
                  color:showNursingHandoff ? "var(--qn-green)" : "var(--qn-txt4)",
                  letterSpacing:.5, transition:"all .15s" }}>
                {showNursingHandoff ? "▲" : "▼"} Nursing Handoff
              </button>
              <button onClick={generateSignOut} disabled={signOutBusy}
                style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${signOutDone ? "rgba(61,255,160,.5)" : signOutBusy ? "rgba(42,79,122,.3)" : "rgba(245,200,66,.4)"}`,
                  background:signOutDone ? "rgba(61,255,160,.1)" : signOutBusy ? "rgba(14,37,68,.4)" : "rgba(245,200,66,.07)",
                  color:signOutDone ? "var(--qn-green)" : signOutBusy ? "var(--qn-txt4)" : "var(--qn-gold)",
                  letterSpacing:.5, transition:"all .15s" }}>
                {signOutDone ? "✓ Sent to Sign-Out" : signOutBusy ? "● Generating…" : "→ Generate Sign-Out"}
              </button>
            </div>
            {showSDM && (
              <SDMBlock
                disposition={dispResult.disposition}
                patientName={[demo?.firstName, demo?.lastName].filter(Boolean).join(" ")}
              />
            )}
            {showAttestation && (
              <AttestationBlock
                providerName={providerInfo.name}
                credentials={providerInfo.credentials}
                facility={providerInfo.facility}
                mdmLevel={mdmResult?.mdm_level}
              />
            )}
            {showNursingHandoff && (
              <NursingHandoff
                patientName={[demo?.firstName, demo?.lastName].filter(Boolean).join(" ")}
                diagnosis={dispResult.final_diagnosis||mdmResult?.working_diagnosis||""}
                disposition={dispResult.disposition}
              />
            )}
          </div>
        )}

        {dispResult && (
          <DiagnosisCodingCard
            finalDiagnosis={dispResult.final_diagnosis||mdmResult?.working_diagnosis||""}
            suggestions={icdSuggestions} selected={icdSelected}
            searching={icdSearching} error={icdError}
            onSearch={() => searchICD10(dispResult.final_diagnosis||mdmResult?.working_diagnosis||cc)}
            onSelect={code => setIcdSelected(prev => prev.find(c=>c.code===code.code)?prev:[...prev,code])}
            onRemove={code => setIcdSelected(prev => prev.filter(c=>c.code!==code))}
          />
        )}

        {dispResult && (
          <InterventionsCard items={interventions} loading={intLoading} generated={intGenerated}
            onGenerate={generateInterventions}
            onToggle={id => setInterventions(prev => prev.map(i => i.id===id?{...i,confirmed:!i.confirmed}:i))}
            onUpdate={(id,field,value) => setInterventions(prev => prev.map(i => i.id===id?{...i,[field]:value}:i))}
            onAdd={item => setInterventions(prev => [...prev,{...item,id:`int-manual-${Date.now()}`,confirmed:true}])}
            onRemove={id => setInterventions(prev => prev.filter(i => i.id!==id))}
          />
        )}

        {/* Timeline — always visible once Phase 1 has content */}
        {phase1Ready && (
          <TimelineCard timestamps={timestamps} setTimestamps={setTimestamps} />
        )}

        {hasAnyResult && (
          <ActionBar
            mdmResult={mdmResult} dispResult={dispResult}
            copiedP1={copiedP1} copiedP2={copiedP2} copied={copied}
            copiedMDMOnly={copiedMDMOnly} copiedDischargeOnly={copiedDischargeOnly}
            savedNote={savedNote} saving={saving} sentToNPI={sentToNPI} sendingNPI={sendingNPI}
            formatMode={formatMode} setFormatMode={setFormatMode}
            pasteReady={pasteReady} setPasteReady={setPasteReady}
            copyPhase1={copyPhase1} copyPhase2={copyPhase2}
            copyMDMOnly={copyMDMOnly} copyDischargeOnly={copyDischargeOnly}
            copyNote={copyNote} saveNote={saveNote} sendToNPI={sendToNPI}
            onNewEncounter={handleNewEncounter}
            onProcedureNote={() => setShowProcedureModal(true)}
          />
        )}

        {showKbHelp && <KbHelpModal onClose={() => setShowKbHelp(false)} />}
        {showProcedureModal && (
          <ProcedureNoteModal
            onInsert={() => {}}
            onClose={() => setShowProcedureModal(false)}
          />
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 8px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-txt4)", letterSpacing:1.5 }} className="no-print">
            NOTRYA QUICKNOTE v11 · AMA/CMS 2023 E&M · ACEP CLINICAL POLICY ALIGNED ·
            AI OUTPUT REQUIRES PHYSICIAN REVIEW BEFORE CHARTING
          </div>
        )}
      </div>
    </div>
  );
}