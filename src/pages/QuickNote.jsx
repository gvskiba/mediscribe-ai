// QuickNote.jsx  v13.0  — Full layout restructure + HPI-driven ROS/PE AI
// v13.0 changes:
//   - LAYOUT: Two-phase clinical flow with clear visual dividers
//   - PHASE 1 DATA: CC → Vitals → HPI → [AI: Generate ROS + PE] → ROS → PE
//   - HPI auto-generates ROS + PE after 1.8s debounce (no button needed)
//   - Manual "Generate ROS from HPI" and "Generate PE from HPI" buttons also added
//   - Generate Initial Impression button anchored BELOW focused exam
//   - PHASE 1 OUTPUT: Initial Impression → A&P → Clinical Plan — all grouped together
//   - PHASE 2 DATA: Labs → Imaging → EKG → Recheck Vitals → Patient Response
//   - PHASE 2 OUTPUT: Lab Summary → Imaging Analysis → Final Impression → Disposition → ED Meds
//   - EHR EXPORT: Meditech MDM Hub + ActionBar at very bottom
//   - All v12.2 features preserved (scaffolds, EMLevel, MDM thread, etc.)

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { dispColor, StepProgress, MDMResult, DispositionResult,
         DiagnosisCodingCard, InterventionsCard,
         DifferentialCard, ClinicalCalcsCard, InlineCopyBtn,
         CCPicker, HPIBuilder, CC_LIBRARY } from "./QuickNoteComponents";
import { InitialImpressionDisplay, TreatmentDisplay } from "./QuickNoteMDM";
import { PMH_CATS, PMH_CAT_ICONS, PMH_PRI_STYLE, PMH_MDM_HIGH, PMH_MDM_MOD, computePMHMDM, PMHTab } from "./QuickNotePatientHx";
import { usePMHConditionInjector } from "@/components/MDMBuilderPMHBridge";
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
import { SDMBlock, AttestationBlock, NursingHandoff, PriorVisitsPanel, MDMPlanEntry } from "./QuickNoteExtras";
import { DEFAULT_EXPANSIONS } from "./QuickNoteVoice";
import { QuickNoteAbnormals } from "@/components/quicknote/QuickNoteAbnormals";
import { GuidelineAssist } from "@/components/quicknote/QuickNoteGuidelines";
import { DispositionCriteriaBuilder } from "@/components/quicknote/QuickNoteDispositionCriteria";
import HighAlertMedAlert from "@/components/quicknote/HighAlertMedAlert";
import {
  MDM_SCHEMA, DISP_SCHEMA, TREATMENT_SCHEMA,
  buildMDMPrompt, buildDispPrompt, buildMDMBlock,
  buildFullNote, buildPhase1Copy, buildPhase2Copy,
  formatMDMForCopy, buildTreatmentPrompt, formatTreatmentForCopy,
  LAB_SUMMARY_SCHEMA, buildLabSummaryPrompt, formatLabSummaryForCopy,
  FINAL_IMPRESSION_SCHEMA, buildFinalImpressionPrompt, formatFinalImpressionForCopy,
  ED_MEDICATIONS_SCHEMA, buildEDMedicationsPrompt, formatEDMedicationsForCopy,
  IMAGING_ANALYSIS_SCHEMA, buildImagingAnalysisPrompt,
} from "./QuickNotePrompts";
import { LabSummaryDisplay, FinalImpressionDisplay, EDMedicationsDisplay } from "./QuickNoteDisposition";
import { detectCriticalValues, getExpectedOPQRST, serializeSlot, deserializeSlot } from "./QuickNoteHelpers";
import { HPI_SCAFFOLDS, HPI_ALIASES, getScaffold } from "./QuickNoteScaffolds";
import { EncounterPicker } from "./QuickNoteEncounterPicker";
import { EMLevel, PatientResponsePanel } from "@/components/QuickNote/QuickNoteMDMEnhancer";
import { MDMHandoffBridge } from "@/components/quicknote/MDMHandoffBridge";
import StagedOrderQueue from "@/components/StagedOrderQueue";
import NoteExportPanel from "@/components/NoteExportPanel";
// ── v14.0: CC-driven imports ──────────────────────────────────────────────────
import { CCLauncher } from "./QuickNoteCCLauncher";
import { MustNotMissBanner } from "./QuickNoteMustNotMiss";
import { getCCProfile } from "./QuickNoteCCProfiles";

injectQNStyles();

// ─── Section divider component ────────────────────────────────────────────────
function PhaseDivider({ phase, label, color = "var(--qn-teal)", sublabel }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, margin: "20px 0 14px",
    }}>
      <div style={{
        padding: "4px 14px", borderRadius: 20,
        background: `${color}18`, border: `1px solid ${color}50`,
        fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700,
        color, letterSpacing: 1.5, textTransform: "uppercase", flexShrink: 0,
      }}>
        {phase}
      </div>
      <div style={{ flex: 1, height: 1, background: `${color}25` }} />
      <div style={{
        fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700,
        color: "var(--qn-txt2)", flexShrink: 0,
      }}>
        {label}
      </div>
      {sublabel && (
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
          color: "var(--qn-txt4)", flexShrink: 0, letterSpacing: .4,
        }}>
          {sublabel}
        </div>
      )}
      <div style={{ flex: 1, height: 1, background: `${color}25` }} />
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ children, accent = "rgba(42,79,122,.4)", style = {} }) {
  return (
    <div style={{
      marginBottom: 12, padding: "14px 16px",
      background: "rgba(8,22,40,.5)",
      border: `1px solid ${accent}`,
      borderRadius: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

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
  const [labs,      setLabs]      = useState("");
  const [imaging,   setImaging]   = useState("");
  const [ekg,       setEkg]       = useState("");
  const [newVitals, setNewVitals] = useState("");
  const [formatMode,    setFormatMode]    = useState("plain");
  const [pasteReady,    setPasteReady]    = useState("labeled");
  const [encounterType, setEncounterType] = useState("adult");
  const [isBounceback,   setIsBounceback]   = useState(false);
  const [bouncebackDate, setBouncebackDate] = useState("");
  const [consults, setConsults] = useState([]);
  const [consultList, setConsultList] = useState([]);
  const [showOrderQueue, setShowOrderQueue] = useState(false);
  const [orderPhases, setOrderPhases] = useState([
    { id:1, label:"Phase 1 — Initial Orders", trigger:"On arrival", status:"active",
      firedAt: new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true}),
      orders:[], note:"" },
  ]);

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
  const [ekgBusy,      setEkgBusy]      = useState(false);
  const [autoExamBusy, setAutoExamBusy] = useState(false);
  const [scaffoldOpen, setScaffoldOpen] = useState(false);
  const [workupRationale,     setWorkupRationale]     = useState(null);
  const [workupRationaleBusy, setWorkupRationaleBusy] = useState(false);
  const [copiedWorkup,        setCopiedWorkup]        = useState(false);
  const [autoRosBusy, setAutoRosBusy] = useState(false);

  // ─── v13.0: HPI-driven ROS + PE auto-generation ───────────────────────────
  const [hpiRosBusy,  setHpiRosBusy]  = useState(false);
  const [hpiExamBusy, setHpiExamBusy] = useState(false);
  const [hpiRosDone,  setHpiRosDone]  = useState(false);
  const [hpiExamDone, setHpiExamDone] = useState(false);
  const hpiRosTimer  = useRef(null);
  const hpiExamTimer = useRef(null);

  const generateROSFromHPI = useCallback(async (hpiText, ccText) => {
    if (!hpiText?.trim() || hpiRosBusy) return;
    setHpiRosBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a board-certified emergency physician. The nursing staff has documented the following HPI. Generate a complete, complaint-appropriate Review of Systems (ROS) based on this HPI.

Chief Complaint: ${ccText || "not specified"}
HPI: ${hpiText}

Rules:
1. Only include systems relevant to this chief complaint and its major differentials
2. Format each system as: "System: (+) positive symptom, (-) negative symptom"
3. Extract explicitly mentioned symptoms as positives
4. Include pertinent negatives for high-risk differentials (e.g. for chest pain: deny diaphoresis, syncope, leg swelling)
5. Do NOT invent symptoms — only document what is stated or can be clinically inferred from the CC/HPI
6. Include 4-8 relevant systems
7. Common systems to consider: Constitutional, Cardiovascular, Pulmonary, GI, GU, Musculoskeletal, Neurological, Dermatologic, Psychiatric

Return JSON: { "ros_text": "System-by-system ROS here..." }`,
        response_json_schema: { type:"object", required:["ros_text"], properties:{ ros_text:{type:"string"} } },
      });
      if (res?.ros_text?.trim()) {
        setRos(res.ros_text.trim());
        setHpiRosDone(true);
        setTimeout(() => setHpiRosDone(false), 4000);
      }
    } catch(e) { console.error("HPI→ROS failed:", e); }
    finally { setHpiRosBusy(false); }
  }, [hpiRosBusy]);

  const generatePEFromHPI = useCallback(async (hpiText, ccText) => {
    if (!hpiText?.trim() || hpiExamBusy) return;
    setHpiExamBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a board-certified emergency physician. Generate a focused physical exam template for an ED patient based on the chief complaint and HPI below.

Chief Complaint: ${ccText || "not specified"}
HPI: ${hpiText}

Rules:
1. Include only systems relevant to this complaint and its high-risk differentials
2. Pre-fill normal findings where universally appropriate (e.g. "Alert and oriented x3", "Regular rate and rhythm")
3. Use [FINDING] bracket placeholders for exam findings that require direct patient assessment
4. Include 4-7 relevant exam components
5. Format: "System: findings here [SPECIFIC FINDING TO ASSESS]"
6. Always include: General appearance, Vital signs interpretation, and the primary system for this complaint
7. For chest pain: include Cardiovascular, Pulmonary, Extremities
8. For abdominal pain: include Abdomen with palpation template, Rectal if indicated
9. For neuro complaints: include full Neurological with GCS

Return JSON: { "exam_text": "System-by-system PE template here..." }`,
        response_json_schema: { type:"object", required:["exam_text"], properties:{ exam_text:{type:"string"} } },
      });
      if (res?.exam_text?.trim()) {
        setExam(res.exam_text.trim());
        setHpiExamDone(true);
        setTimeout(() => setHpiExamDone(false), 4000);
      }
    } catch(e) { console.error("HPI→PE failed:", e); }
    finally { setHpiExamBusy(false); }
  }, [hpiExamBusy]);

  // Auto-trigger ROS + PE from HPI after 1.8s debounce
  const handleHpiChange = useCallback((val) => {
    setHpi(val);
    if (hpiRosTimer.current) clearTimeout(hpiRosTimer.current);
    if (hpiExamTimer.current) clearTimeout(hpiExamTimer.current);
    if (val.trim().length > 60) {
      hpiRosTimer.current = setTimeout(() => {
        generateROSFromHPI(val, cc);
      }, 1800);
      hpiExamTimer.current = setTimeout(() => {
        generatePEFromHPI(val, cc);
      }, 2200);
    }
  }, [cc, generateROSFromHPI, generatePEFromHPI]);
  // ──────────────────────────────────────────────────────────────────────────

  const [patientPregnant,    setPatientPregnant]    = useState("Unknown");
  const [patientWeight,      setPatientWeight]      = useState("");
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [priorVisits,        setPriorVisits]        = useState(null);
  const [priorVisitsLoading, setPriorVisitsLoading] = useState(false);
  const [signOutBusy,        setSignOutBusy]        = useState(false);
  const [signOutDone,        setSignOutDone]        = useState(false);
  const [showSDM,            setShowSDM]            = useState(false);
  const [showAttestation,    setShowAttestation]    = useState(false);
  const [showNursingHandoff, setShowNursingHandoff] = useState(false);
  const [rerunAddendumBusy,  setRerunAddendumBusy]  = useState(false);
  const [patientResponse, setPatientResponse] = useState("");
  const [mdmHistory,      setMdmHistory]      = useState([]);
  const [mdmInitialTs,    setMdmInitialTs]    = useState(null);
  const [mdmTimestamp,    setMdmTimestamp]    = useState("");
  const [showMdmHistory,  setShowMdmHistory]  = useState(false);
  const [treatmentPlan,   setTreatmentPlan]   = useState("");
  const [actionPlan,      setActionPlan]      = useState("");
  const [providerInfo,    setProviderInfo]    = useState({ name:"", credentials:"", facility:"" });
  const [treatmentPlanBusy, setTreatmentPlanBusy] = useState(false);
  const [labRecs,            setLabRecs]           = useState(null);
  const [labRecsBusy,        setLabRecsBusy]       = useState(false);
  const [imagingRecs,        setImagingRecs]       = useState(null);
  const [imagingRecsBusy,    setImagingRecsBusy]   = useState(false);

  // Slots
  const EMPTY_SLOT = () => ({
    cc:"", vitals:"", hpi:"", ros:"", exam:"",
    labs:"", imaging:"", ekg:"", newVitals:"",
    medsRaw:"", allergiesRaw:"", parsedMeds:[], parsedAllergies:[],
    mdmResult:null, dispResult:null, icdSelected:[], icdSuggestions:[],
    interventions:[], hpiSummary:null, hpiMode:"original",
    encounterType:"adult", p2Open:false,
    patientName:"", patientAge:"", savedNoteId:null, lastActivity:Date.now(),
    treatmentResult:null, labSummaryResult:null, imagingAnalysisResult:null,
    edMedsResult:null, finalImpressionResult:null,
    confirmedRanks:null, rejectedRanks:null, selectedGuideline:null,
    treatmentLoading:false, labSummaryLoading:false, imagingAnalysisLoading:false,
    edMedsLoading:false, finalImpressionLoading:false, dispLoading:false,
    copiedPhase1:false, copiedImaging:false, copiedEdMeds:false,
    copiedFinal:false, showPlanSelector:false,
    ccProfile:null,   // v14.0 — active CC profile for this slot
  });
  const [slots,      setSlots]      = useState(() => [EMPTY_SLOT(),EMPTY_SLOT(),EMPTY_SLOT(),EMPTY_SLOT()]);
  const [activeSlot, setActiveSlot] = useState(0);
  const slotRef      = useRef(activeSlot);
  const [undoData,   setUndoData]   = useState(null);
  const [undoTimer,  setUndoTimer]  = useState(null);
  const [showUndo,   setShowUndo]   = useState(false);
  const [draftId,    setDraftId]    = useState(null);
  const slotStateRef = useRef({});
  const [slotCacheIds,      setSlotCacheIds]      = useState([null,null,null,null]);
  const [slotSaveTimes,     setSlotSaveTimes]     = useState([null,null,null,null]);
  const [slotSaving,        setSlotSaving]        = useState(false);
  const [slotsRestored,     setSlotsRestored]     = useState(false);
  const [slotsRestoredCount,setSlotsRestoredCount]= useState(0);
  const slotsRef        = useRef(slots);
  const slotCacheIdsRef = useRef(slotCacheIds);
  const activeSlotRef   = useRef(activeSlot);
  const slotSavingRef   = useRef(false);
  useEffect(() => { slotsRef.current = slots; },              [slots]);
  useEffect(() => { slotCacheIdsRef.current = slotCacheIds; },[slotCacheIds]);
  useEffect(() => { activeSlotRef.current = activeSlot; },    [activeSlot]);

  const saveCurrentToSlot = useCallback((idx, state) => {
    setSlots(prev => { const next=[...prev]; next[idx]={...prev[idx],...state}; return next; });
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
      if (typeof setTreatmentResult === "function") setTreatmentResult(slot.treatmentResult || null);
      if (typeof setLabSummaryResult === "function") setLabSummaryResult(slot.labSummaryResult || null);
      if (typeof setImagingAnalysisResult === "function") setImagingAnalysisResult(slot.imagingAnalysisResult || null);
      if (typeof setEdMedsResult === "function") setEdMedsResult(slot.edMedsResult || null);
      if (typeof setFinalImpressionResult === "function") setFinalImpressionResult(slot.finalImpressionResult || null);
      if (typeof setConfirmedRanks === "function") setConfirmedRanks(slot.confirmedRanks instanceof Set ? slot.confirmedRanks : new Set());
      if (typeof setRejectedRanks === "function") setRejectedRanks(slot.rejectedRanks instanceof Set ? slot.rejectedRanks : new Set());
      setIcdSelected(slot.icdSelected||[]); setIcdSuggestions([]);
      setInterventions(slot.interventions||[]);
      setHpiSummary(slot.hpiSummary||null); setHpiMode(slot.hpiMode||"original");
      setEncounterType(slot.encounterType||"adult"); setP2Open(slot.p2Open||false);
      setP1Error(null); setP2Error(null);
      setWorkupRationale(null); setConsults([]);
      setHpiGaps([]);
      setLabRecs(null); setImagingRecs(null);
      setTreatmentPlan(""); setActionPlan("");
      // v14.0: restore CC profile for this slot
      setCCProfile(slot.ccProfile || null);
      setMustNotMissDismissed(false);
      return prev;
    });
    setActiveSlot(idx); slotRef.current = idx;
  }, [activeSlot, saveCurrentToSlot]);

  const [mdmResult,  setMdmResult]  = useState(null);
  const [dispResult, setDispResult] = useState(null);
  const [treatmentResult,  setTreatmentResult]  = useState(null);
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [labSummaryResult,  setLabSummaryResult]  = useState(null);
  const [labSummaryLoading, setLabSummaryLoading] = useState(false);
  const [finalImpressionResult,  setFinalImpressionResult]  = useState(null);
  const [finalImpressionLoading, setFinalImpressionLoading] = useState(false);
  const [edMedsResult,   setEdMedsResult]   = useState(null);
  const [edMedsLoading,  setEdMedsLoading]  = useState(false);
  const [imagingAnalysisResult, setImagingAnalysisResult] = useState(null);
  const [copiedEdMeds,   setCopiedEdMeds]   = useState(false);
  const [confirmedRanks, setConfirmedRanks] = useState(new Set());
  const [rejectedRanks,  setRejectedRanks]  = useState(new Set());
  const [p1Busy,     setP1Busy]     = useState(false);
  const [p2Busy,     setP2Busy]     = useState(false);
  const [p1Error,    setP1Error]    = useState(null);
  const [p2Error,    setP2Error]    = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [p2Open,     setP2Open]     = useState(false);
  const [copiedMDM,           setCopiedMDM]           = useState(false);
  const [copiedDisch,         setCopiedDisch]         = useState(false);
  const [copiedMDMFull,       setCopiedMDMFull]       = useState(false);
  const [copiedMDMOnly,       setCopiedMDMOnly]       = useState(false);
  const [copiedDischargeOnly, setCopiedDischargeOnly] = useState(false);
  const [savedNote,           setSavedNote]           = useState(false);
  const [saving,              setSaving]              = useState(false);
  const [sentToNPI,           setSentToNPI]           = useState(false);
  const [sendingNPI,          setSendingNPI]          = useState(false);
  const [fatigueDismissed,    setFatigueDismissed]    = useState(false);
  const [vhImported,          setVhImported]          = useState(false);
  const [vhDismissed,         setVhDismissed]         = useState(false);
  const [vhAnalysis,          setVhAnalysis]          = useState(null);
  const [vhAnalysisDismissed, setVhAnalysisDismissed]= useState(false);
  const [nhResumed,           setNhResumed]           = useState(false);
  const [nhResumeDismissed,   setNhResumeDismissed]   = useState(false);
  const [showKbHelp,          setShowKbHelp]          = useState(false);
  const [addendumMode,        setAddendumMode]        = useState(false);
  const [addendumRef,         setAddendumRef]         = useState(null);
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
  const [hpiSummary,   setHpiSummary]   = useState(null);
  const [hpiSumBusy,   setHpiSumBusy]   = useState(false);
  const [hpiSumError,  setHpiSumError]  = useState(null);
  const [copiedHpiSum, setCopiedHpiSum] = useState(false);
  const [hpiMode,      setHpiMode]      = useState("original");
  const [hpiStructureBusy,  setHpiStructureBusy]  = useState(false);
  const [hpiStructureError, setHpiStructureError] = useState(null);
  const [hpiGaps, setHpiGaps] = useState([]);
  const [medsFromHpi,      setMedsFromHpi]      = useState([]);
  const [allergiesFromHpi, setAllergiesFromHpi]  = useState([]);
  const [icdSuggestions, setIcdSuggestions] = useState([]);
  const [icdSelected,    setIcdSelected]    = useState([]);
  const [icdSearching,   setIcdSearching]   = useState(false);
  const [icdError,       setIcdError]       = useState(null);
  const [interventions,  setInterventions]  = useState([]);
  const [intLoading,     setIntLoading]     = useState(false);
  const [intGenerated,   setIntGenerated]   = useState(false);
  const [copiedP1,     setCopiedP1]     = useState(false);
  const [copiedP2,     setCopiedP2]     = useState(false);
  const [copiedInputs, setCopiedInputs] = useState(false);
  const [pmh,              setPmh]              = useState([]);
  const [psh,              setPsh]              = useState([]);
  const [patientMeds,      setPatientMeds]      = useState([]);
  const [patientAllergies, setPatientAllergies] = useState([]);
  const [pmhMDMData,       setPmhMDMData]       = useState(null);
  const [showCCPicker,     setShowCCPicker]     = useState(false);
  const [showHPIBuilder,   setShowHPIBuilder]   = useState(false);
  // ── v14.0: CC-driven state ────────────────────────────────────────────────
  const [ccProfile,             setCCProfile]             = useState(null);
  const [showCCLauncher,        setShowCCLauncher]        = useState(true);
  const [mustNotMissDismissed,  setMustNotMissDismissed]  = useState(false);
  const [hpiTemplate,      setHpiTemplate]      = useState("");
  const [hpiBuilderCC,     setHpiBuilderCC]     = useState("");
  const [patientRecord,    setPatientRecord]    = useState(null);
  const [patientIdParam,   setPatientIdParam]   = useState(null);

  const effectiveHpi = hpiMode === "summary" && hpiSummary ? hpiSummary : hpi;
  const phase1Ready  = Boolean(cc.trim() || hpi.trim() || exam.trim());
  const phase2Ready  = Boolean(mdmResult && (labs.trim() || imaging.trim() || newVitals.trim()));
  const hasAnyResult = Boolean(mdmResult || dispResult);
  const criticalFlags = useMemo(() => detectCriticalValues(labs), [labs]);

  const fieldRefs    = useRef([]);
  const setRef       = useCallback((idx) => (ref) => { fieldRefs.current[idx] = ref; }, []);
  const advanceFocus = useCallback((idx) => { fieldRefs.current[idx+1]?.current?.focus(); }, []);
  const labsAnalyzeTimer    = useRef(null);
  const imagingAnalyzeTimer = useRef(null);
  const [labsAutoAnalyzing,    setLabsAutoAnalyzing]    = useState(false);
  const [imagingAutoAnalyzing, setImagingAutoAnalyzing] = useState(false);

  const handleLabsChange = useCallback((val) => {
    setLabs(val);
    if (labsAnalyzeTimer.current) clearTimeout(labsAnalyzeTimer.current);
    if (val.trim().length > 30) {
      setLabsAutoAnalyzing(true);
      labsAnalyzeTimer.current = setTimeout(async () => {
        try {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: buildLabSummaryPrompt(val, cc, mdmResult, parsedMeds, parsedAllergies),
            response_json_schema: LAB_SUMMARY_SCHEMA,
          });
          setLabSummaryResult(res);
        } catch(e) { console.error("Auto lab analysis failed:", e); }
        finally { setLabsAutoAnalyzing(false); }
      }, 1800);
    } else {
      setLabsAutoAnalyzing(false);
    }
  }, [cc, mdmResult, parsedMeds, parsedAllergies]);

  const handleImagingChange = useCallback((val) => {
    setImaging(val);
    if (imagingAnalyzeTimer.current) clearTimeout(imagingAnalyzeTimer.current);
    if (val.trim().length > 30) {
      setImagingAutoAnalyzing(true);
      imagingAnalyzeTimer.current = setTimeout(async () => {
        try {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: buildImagingAnalysisPrompt(val, cc, mdmResult, labSummaryResult),
            response_json_schema: IMAGING_ANALYSIS_SCHEMA,
          });
          setImagingAnalysisResult(res);
        } catch(e) { console.error("Auto imaging analysis failed:", e); }
        finally { setImagingAutoAnalyzing(false); }
      }, 1800);
    } else {
      setImagingAutoAnalyzing(false);
    }
  }, [cc, mdmResult, labSummaryResult]);

  const runMDM = useCallback(async () => {
    if (!phase1Ready || p1Busy) return;
    setP1Busy(true); setP1Error(null); setMdmResult(null); setDispResult(null);
    setWorkupRationale(null); setLabRecs(null); setImagingRecs(null);
    try {
      const bouncebackCtx = isBounceback
        ? `\nBOUNCEBACK: Patient returning within 72h${bouncebackDate?` (prior visit: ${bouncebackDate})`:""}.`:"";
      const patientCtx = [
        patientPregnant==="Yes"?"PREGNANCY: PREGNANT — avoid teratogens, adjust radiation decisions.":"",
        patientPregnant==="Unknown"?"PREGNANCY STATUS: Unknown — consider ordering pregnancy test.":"",
        patientWeight?`PATIENT WEIGHT: ${patientWeight}kg — use for weight-based dosing.`:"",
      ].filter(Boolean).join("\n");
      const pmhCtx = [
        pmh.length?`PAST MEDICAL HISTORY: ${pmh.join(", ")}. MDM Complexity: ${computePMHMDM(pmh).level} (AMA 2021).`:"",
        psh.length?`PAST SURGICAL HISTORY: ${psh.join(", ")}.`:"",
        patientMeds.length?`CURRENT MEDICATIONS (Hx tab): ${patientMeds.join(", ")}.`:"",
        patientAllergies.length?`ALLERGIES (Hx tab): ${patientAllergies.join(", ")}.`:"",
      ].filter(Boolean).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc,vitals,hpi,ros,exam,vhAnalysis,parsedMeds,parsedAllergies,encounterType,ccProfile)
          + (bouncebackCtx ? "\n"+bouncebackCtx : "") + (patientCtx ? "\n"+patientCtx : "")
          + (pmhCtx ? "\n"+pmhCtx : ""),
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res); setP2Open(true);
      generateTreatment(res);
      const ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      setMdmInitialTs(ts);
      setMdmTimestamp(new Date().toISOString());
      setMdmHistory([{ts,trigger:"Initial Impression",
        working_diagnosis:res.working_diagnosis||"",mdm_level:res.mdm_level||"",
        mdm_narrative:res.mdm_narrative||""}]);
      setIcdSuggestions([]); setIcdSelected([]); setIcdError(null);
      setInterventions([]); setIntGenerated(false); setQuickDDxDismissed(true);
    } catch(e) { setP1Error("MDM generation failed: "+(e.message||"Check API")); }
    finally { setP1Busy(false); }
  }, [cc,vitals,hpi,ros,exam,phase1Ready,p1Busy,vhAnalysis,parsedMeds,parsedAllergies,
      encounterType,isBounceback,bouncebackDate,patientPregnant,patientWeight,pmh,psh,patientMeds,patientAllergies]);

  const generateFinalImpression = useCallback(async (resolvedDispResult) => {
    setFinalImpressionLoading(true);
    setConfirmedRanks(new Set()); setRejectedRanks(new Set());
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildFinalImpressionPrompt(cc, hpi, exam, mdmResult, labSummaryResult, imaging, resolvedDispResult),
        response_json_schema: FINAL_IMPRESSION_SCHEMA,
      });
      setFinalImpressionResult(res);
    } catch(e) { console.error("Final impression failed:", e); }
    finally { setFinalImpressionLoading(false); }
  }, [cc, hpi, exam, mdmResult, labSummaryResult, imaging]);

  const handleConfirmDx = useCallback((rank) => {
    setConfirmedRanks(prev => { const s=new Set(prev); s.add(rank); return s; });
    setRejectedRanks(prev => { const s=new Set(prev); s.delete(rank); return s; });
  }, []);
  const handleRejectDx = useCallback((rank) => {
    setRejectedRanks(prev => { const s=new Set(prev); s.add(rank); return s; });
    setConfirmedRanks(prev => { const s=new Set(prev); s.delete(rank); return s; });
  }, []);
  const handleResetDx = useCallback((rank) => {
    setConfirmedRanks(prev => { const s=new Set(prev); s.delete(rank); return s; });
    setRejectedRanks(prev => { const s=new Set(prev); s.delete(rank); return s; });
  }, []);

  const generateLabSummary = useCallback(async () => {
    if (!labs || labSummaryLoading) return;
    setLabSummaryLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildLabSummaryPrompt(labs, cc, mdmResult, parsedMeds, parsedAllergies),
        response_json_schema: LAB_SUMMARY_SCHEMA,
      });
      setLabSummaryResult(res);
    } catch(e) { console.error("Lab summary failed:", e); }
    finally { setLabSummaryLoading(false); }
  }, [labs, cc, mdmResult, parsedMeds, parsedAllergies, labSummaryLoading]);

  const generateEDMedications = useCallback(async () => {
    setEdMedsLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildEDMedicationsPrompt(
          cc, hpi, exam, mdmResult, labSummaryResult,
          treatmentResult, parsedMeds, parsedAllergies, pmh.length ? pmh.join(", ") : ""
        ),
        response_json_schema: ED_MEDICATIONS_SCHEMA,
      });
      setEdMedsResult(res);
    } catch(e) { console.error("ED Medications failed:", e); }
    finally { setEdMedsLoading(false); }
  }, [cc, hpi, exam, mdmResult, labSummaryResult, treatmentResult, parsedMeds, parsedAllergies, pmh]);

  const copyEDMedications = useCallback(async () => {
    if (!edMedsResult) return;
    await navigator.clipboard.writeText(formatEDMedicationsForCopy(edMedsResult));
    setCopiedEdMeds(true);
    setTimeout(() => setCopiedEdMeds(false), 2500);
  }, [edMedsResult]);

  const generateTreatment = useCallback(async (resolvedMdmResult) => {
    setTreatmentLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildTreatmentPrompt(cc, vitals, hpi, ros, exam, resolvedMdmResult),
        response_json_schema: TREATMENT_SCHEMA,
      });
      setTreatmentResult(res);
    } catch(e) { console.error("Treatment generation failed:", e); }
    finally { setTreatmentLoading(false); }
  }, [cc, vitals, hpi, ros, exam]);

  const handlePMHOrders = useCallback((orders) => {
    if (!orders?.length) return;
    const labOrders     = orders.filter(o=>o.category==="Labs").map(o=>o.recommendation);
    const imgOrders     = orders.filter(o=>o.category==="Imaging").map(o=>o.recommendation);
    const consultOrders = orders.filter(o=>o.category==="Consults").map(o=>o.recommendation);
    if (labOrders.length)     setLabs(prev=>(prev.trim()?prev+"\n":"")+labOrders.join("\n"));
    if (imgOrders.length)     setImaging(prev=>(prev.trim()?prev+"\n":"")+imgOrders.join("\n"));
    if (consultOrders.length) setConsults(prev=>[...prev,...consultOrders.map((c,i)=>({id:`pmh-${Date.now()}-${i}`,service:c,provider:"",time:"",recommendation:"AI-staged from PMH workup"}))]);
  }, []);

  const runDisposition = useCallback(async () => {
    if (!mdmResult || p2Busy) return;
    setP2Busy(true); setP2Error(null); setDispResult(null);
    if (labs && !labSummaryResult) generateLabSummary();
    try {
      const consultCtx = consults.length
        ? "\nCONSULTS:\n"+consults.map(c=>`  ${c.service}${c.provider?" — Dr."+c.provider:""}${c.time?" at "+c.time:""}: ${c.recommendation}`).join("\n"):"";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildDispPrompt(mdmResult,labs,imaging,newVitals,cc,hpi,vitals,ros,exam,parsedMeds,parsedAllergies,ekg,encounterType,ccProfile)
          + consultCtx
          + (patientResponse.trim()?`\n\nPATIENT RESPONSE TO TREATMENT:\n${patientResponse}`:""),
        response_json_schema: DISP_SCHEMA,
      });
      setDispResult(res); setIntGenerated(false); setIntLoading(false);
      generateFinalImpression(res);
    } catch(e) { setP2Error("Disposition generation failed: "+(e.message||"Check API")); }
    finally { setP2Busy(false); }
  }, [mdmResult,labs,imaging,newVitals,cc,hpi,vitals,ros,exam,p2Busy,ekg,parsedMeds,parsedAllergies,consults,patientResponse]);

  const runWorkupRationale = useCallback(async () => {
    if (!mdmResult||workupRationaleBusy) return;
    setWorkupRationaleBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Write a 2-3 sentence workup rationale paragraph for the chart. Working Dx: ${mdmResult.working_diagnosis}. Must-not-miss: ${mdmResult.differential?.filter(d=>d.must_not_miss).map(d=>d.diagnosis).join(", ")||"none"}. Workup: ${(mdmResult.recommended_actions||[]).join("; ")}. No headers/bullets. Return JSON: { "rationale_paragraph": "..." }`,
        response_json_schema:{type:"object",required:["rationale_paragraph"],properties:{rationale_paragraph:{type:"string"}}},
      });
      setWorkupRationale(res?.rationale_paragraph?.trim()||"");
    } catch(e) { console.error("Workup rationale failed:",e); }
    finally { setWorkupRationaleBusy(false); }
  }, [mdmResult,workupRationaleBusy]);

  const generateClinicalPlan = useCallback(async () => {
    if (!mdmResult||treatmentPlanBusy) return;
    setTreatmentPlanBusy(true);
    try {
      const schema = {
        type:"object", required:["treatment_plan","action_items"],
        properties:{ treatment_plan:{type:"string"}, action_items:{type:"array",items:{type:"string"}} },
      };
      const medsCtx = parsedMeds.length ? "\nCurrent medications: "+parsedMeds.map(m=>`${m.name} ${m.dose} ${m.route} ${m.frequency}`).join(", "):"";
      const allergyCtx = parsedAllergies.length ? "\nAllergies: "+parsedAllergies.map(a=>`${a.allergen} (${a.reaction})`).join(", "):"";
      const weightCtx = patientWeight ? `\nWeight: ${patientWeight}kg` : "";
      const pregnancyCtx = patientPregnant==="Yes" ? "\nPATIENT IS PREGNANT — avoid teratogenic medications." : "";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are a board-certified emergency physician generating an evidence-based clinical management plan.

WORKING DIAGNOSIS: ${mdmResult.working_diagnosis||""}
DIFFERENTIAL: ${mdmResult.differential?.map(d=>d.diagnosis).join(", ")||""}
MDM LEVEL: ${mdmResult.mdm_level||""}
CC: ${cc}
VITALS: ${vitals}
ENCOUNTER TYPE: ${encounterType}
${medsCtx}${allergyCtx}${weightCtx}${pregnancyCtx}

Generate two things:
1. treatment_plan: A 2-4 sentence narrative of the evidence-based treatment plan.
2. action_items: Array of 5-10 specific, actionable, discrete orders/tasks.

Return JSON only.`,
        response_json_schema: schema,
      });
      if (res?.treatment_plan?.trim()) setTreatmentPlan(res.treatment_plan.trim());
      if (res?.action_items?.length) setActionPlan(res.action_items.map(item=>`• ${item}`).join("\n"));
    } catch(e) { console.error("Clinical plan failed:",e); }
    finally { setTreatmentPlanBusy(false); }
  }, [mdmResult,cc,vitals,encounterType,parsedMeds,parsedAllergies,patientWeight,patientPregnant,treatmentPlanBusy]);

  const generateLabRecs = useCallback(async () => {
    if (!mdmResult||labRecsBusy) return;
    setLabRecsBusy(true); setLabRecs(null);
    try {
      const schema = {
        type:"object", required:["immediate","urgent","consider"],
        properties:{
          immediate:{type:"array",items:{type:"object",required:["name","rationale","category"],properties:{name:{type:"string"},rationale:{type:"string"},category:{type:"string"}}}},
          urgent:{type:"array",items:{type:"object",required:["name","rationale","category"],properties:{name:{type:"string"},rationale:{type:"string"},category:{type:"string"}}}},
          consider:{type:"array",items:{type:"object",required:["name","rationale","category"],properties:{name:{type:"string"},rationale:{type:"string"},category:{type:"string"}}}},
        },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are a board-certified emergency physician recommending evidence-based laboratory studies. WORKING DIAGNOSIS: ${mdmResult.working_diagnosis||""} DIFFERENTIAL: ${mdmResult.differential?.map(d=>d.diagnosis).join(", ")||""} CC: ${cc} VITALS: ${vitals} MDM LEVEL: ${mdmResult.mdm_level||""} ENCOUNTER TYPE: ${encounterType}. Return JSON only.`,
        response_json_schema: schema,
      });
      setLabRecs(res);
    } catch(e) { console.error("Lab recs failed:",e); }
    finally { setLabRecsBusy(false); }
  }, [mdmResult,cc,vitals,encounterType,labRecsBusy]);

  const generateImagingRecs = useCallback(async () => {
    if (!mdmResult||imagingRecsBusy) return;
    setImagingRecsBusy(true); setImagingRecs(null);
    try {
      const schema = {
        type:"object", required:["recommended","consider"],
        properties:{
          recommended:{type:"array",items:{type:"object",required:["modality","indication","guideline","priority"],properties:{modality:{type:"string"},indication:{type:"string"},guideline:{type:"string"},priority:{type:"string"}}}},
          consider:{type:"array",items:{type:"object",required:["modality","indication","guideline"],properties:{modality:{type:"string"},indication:{type:"string"},guideline:{type:"string"}}}},
        },
      };
      const pregnancyWarning = patientPregnant==="Yes" ? "\nPATIENT IS PREGNANT — minimize radiation." : "";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Evidence-based imaging for WORKING DIAGNOSIS: ${mdmResult.working_diagnosis||""} CC: ${cc} VITALS: ${vitals} ENCOUNTER TYPE: ${encounterType}${pregnancyWarning}. Return JSON only.`,
        response_json_schema: schema,
      });
      setImagingRecs(res);
    } catch(e) { console.error("Imaging recs failed:",e); }
    finally { setImagingRecsBusy(false); }
  }, [mdmResult,cc,vitals,encounterType,patientPregnant,imagingRecsBusy]);

  const interpretEKG = useCallback(async (ekgText) => {
    if (!ekgText||ekgBusy) return;
    setEkgBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Write one-sentence EKG interpretation for ED chart. EKG: ${ekgText}. Return JSON: { "interpretation": "..." }`,
        response_json_schema:{type:"object",required:["interpretation"],properties:{interpretation:{type:"string"}}},
      });
      if (res?.interpretation) setEkg(res.interpretation.trim());
    } catch(e) { console.error("EKG failed:",e); }
    finally { setEkgBusy(false); }
  }, [ekgBusy]);

  const autoRosFromHpi = useCallback(async () => {
    if (!hpi.trim()||autoRosBusy) return;
    setAutoRosBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Extract ROS from nursing HPI — only explicitly mentioned symptoms as (+) or (-), organized by body system. HPI: ${hpi}. Return JSON: { "ros_text": "..." }`,
        response_json_schema:{type:"object",required:["ros_text"],properties:{ros_text:{type:"string"}}},
      });
      if (res?.ros_text?.trim()) setRos(res.ros_text.trim());
    } catch(e) { console.error("Auto-ROS failed:",e); }
    finally { setAutoRosBusy(false); }
  }, [hpi,autoRosBusy]);

  const autoExamFromCC = useCallback(async () => {
    if (!cc.trim()||autoExamBusy) return;
    setAutoExamBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Generate pertinent PE template for ED CC: "${cc}". Relevant systems only. Use bracket placeholders for findings. Return JSON: { "exam_text": "..." }`,
        response_json_schema:{type:"object",required:["exam_text"],properties:{exam_text:{type:"string"}}},
      });
      if (res?.exam_text?.trim()) setExam(res.exam_text.trim());
    } catch(e) { console.error("Auto-exam failed:",e); }
    finally { setAutoExamBusy(false); }
  }, [cc,autoExamBusy]);

  const structureHPI = useCallback(async () => {
    if (!hpi.trim()||hpiStructureBusy) return;
    setHpiStructureBusy(true); setHpiStructureError(null);
    setHpiSummary(null); setHpiGaps([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Extract OPQRST from nursing triage note. CC: ${cc||"not specified"}. NOTE: ${hpi}. Format as labeled fields. Return JSON: { "structured_hpi": "...", "chief_complaint_extracted": "...", "fields_found": ["..."], "meds_extracted": [], "allergies_extracted": [] }`,
        response_json_schema:{
          type:"object",
          required:["structured_hpi","chief_complaint_extracted","fields_found"],
          properties:{
            structured_hpi:{type:"string"},chief_complaint_extracted:{type:"string"},
            fields_found:{type:"array",items:{type:"string"}},
            meds_extracted:{type:"array",items:{type:"object",properties:{name:{type:"string"},dose:{type:"string"},route:{type:"string"},frequency:{type:"string"}}}},
            allergies_extracted:{type:"array",items:{type:"object",properties:{allergen:{type:"string"},reaction:{type:"string"}}}},
          },
        },
      });
      const text = res?.structured_hpi?.trim()||"";
      if (!text) throw new Error("Empty response");
      setHpiSummary(text); setHpiMode("summary");
      if (!cc.trim()&&res.chief_complaint_extracted?.trim()) setCC(res.chief_complaint_extracted.trim());
      const fieldsFound = (res.fields_found||[]).map(f=>f.toLowerCase());
      const expected    = getExpectedOPQRST(cc.trim()||res.chief_complaint_extracted||"");
      setHpiGaps(expected.filter(f=>!fieldsFound.includes(f.toLowerCase())));
      if (res.meds_extracted?.length)      setMedsFromHpi(res.meds_extracted);
      if (res.allergies_extracted?.length) setAllergiesFromHpi(res.allergies_extracted);
    } catch(e) { setHpiStructureError("HPI structure failed: "+(e.message||"Check API")); }
    finally { setHpiStructureBusy(false); }
  }, [hpi,cc,hpiStructureBusy]);

  const summarizeFromStructure = useCallback(async () => {
    if (!hpiSummary?.trim()||hpiSumBusy) return;
    setHpiSumBusy(true); setHpiSumError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Convert this OPQRST outline to a physician HPI paragraph. No added details. Past tense, 3rd person, 3-5 sentences. OPQRST: ${hpiSummary}. Return JSON: { "summary": "..." }`,
        response_json_schema:{type:"object",required:["summary"],properties:{summary:{type:"string"}}},
      });
      const text=res?.summary?.trim()||"";
      if (!text) throw new Error("Empty response");
      setHpiSummary(text); setHpiMode("summary"); setHpiGaps([]);
    } catch(e) { setHpiSumError("Narrative conversion failed: "+(e.message||"Check API")); }
    finally { setHpiSumBusy(false); }
  }, [hpiSummary,hpiSumBusy]);

  const summarizeHPI = useCallback(async () => {
    if (!hpi.trim()||hpiSumBusy) return;
    setHpiSumBusy(true); setHpiSumError(null); setHpiSummary(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Rewrite nursing HPI as physician clinical paragraph. Past tense, 3rd person, 3-5 sentences. SOURCE HPI: ${hpi}. Return JSON: { "summary": "..." }`,
        response_json_schema:{type:"object",required:["summary"],properties:{summary:{type:"string"}}},
      });
      const text=res?.summary?.trim()||"";
      if (!text) throw new Error("Empty response");
      setHpiSummary(text);
    } catch(e) { setHpiSumError("HPI summary failed: "+(e.message||"Check API")); }
    finally { setHpiSumBusy(false); }
  }, [hpi,hpiSumBusy]);

  const parseMedsAllergies = useCallback(async () => {
    if ((!medsRaw.trim()&&!allergiesRaw.trim())||medsParsing) return;
    setMedsParsing(true); setMedsError(null);
    try {
      const schema={type:"object",required:["medications","allergies"],properties:{
        medications:{type:"array",items:{type:"object",required:["name","dose","route","frequency"],properties:{name:{type:"string"},dose:{type:"string"},route:{type:"string"},frequency:{type:"string"}}}},
        allergies:{type:"array",items:{type:"object",required:["allergen","reaction"],properties:{allergen:{type:"string"},reaction:{type:"string"}}}},
      }};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Parse meds: ${medsRaw||"none"}. Allergies: ${allergiesRaw||"none"}. Return JSON only.`,
        response_json_schema:schema,
      });
      setParsedMeds(res?.medications||[]); setParsedAllergies(res?.allergies||[]);
    } catch(e) { setMedsError("Parse failed: "+(e.message||"try again")); }
    finally { setMedsParsing(false); }
  }, [medsRaw,allergiesRaw,medsParsing]);

  const runQuickDDx = useCallback(async () => {
    if (quickDDxBusy||(!cc.trim()&&!hpi.trim())) return;
    setQuickDDxBusy(true); setQuickDDxErr(null); setQuickDDxDismissed(false);
    try {
      const schema={type:"object",required:["differential"],properties:{differential:{type:"array",minItems:3,maxItems:5,
        items:{type:"object",required:["diagnosis","probability","supporting_evidence","against","must_not_miss"],
          properties:{diagnosis:{type:"string"},probability:{type:"string"},
            supporting_evidence:{type:"string"},against:{type:"string"},must_not_miss:{type:"boolean"}}}}}};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`ED rapid differential. CC: ${cc||"?"} HPI: ${hpi||"?"} Vitals: ${vitals||"?"} ${ros?"ROS:"+ros:""} ${exam?"PE:"+exam:""}. 3-5 dx. JSON only.`,
        response_json_schema:schema,
      });
      if (!res?.differential?.length) throw new Error("Empty response");
      setQuickDDx(res.differential);
    } catch(e) { setQuickDDxErr("Quick DDx failed: "+(e.message||"try again")); }
    finally { setQuickDDxBusy(false); }
  }, [quickDDxBusy,cc,hpi,vitals,ros,exam]);

  const searchICD10 = useCallback(async (diagnosisText) => {
    if (!diagnosisText||icdSearching) return;
    setIcdSearching(true); setIcdError(null); setIcdSuggestions([]);
    try {
      const schema={type:"object",required:["codes"],properties:{codes:{type:"array",minItems:1,maxItems:6,
        items:{type:"object",required:["code","description","type","specificity_note"],
          properties:{code:{type:"string"},description:{type:"string"},type:{type:"string"},specificity_note:{type:"string"}}}}}};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`ICD-10-CM codes for "${diagnosisText}" in ED. 4-6 billable codes. JSON only.`,
        response_json_schema:schema,
      });
      setIcdSuggestions(res?.codes||[]);
    } catch(e) { setIcdError("ICD-10 search failed: "+(e.message||"")); }
    finally { setIcdSearching(false); }
  }, [icdSearching]);

  const generateInterventions = useCallback(async () => {
    if (intLoading||intGenerated) return;
    setIntLoading(true);
    try {
      const schema={type:"object",required:["interventions"],properties:{interventions:{type:"array",maxItems:12,
        items:{type:"object",required:["type","name","confirmed"],
          properties:{type:{type:"string"},name:{type:"string"},dose_route:{type:"string"},
            time_given:{type:"string"},response:{type:"string"},confirmed:{type:"boolean"}}}}}};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Pre-populate ED interventions list. CC: ${cc} Dx: ${mdmResult?.working_diagnosis} Disposition: ${dispResult?.disposition||"TBD"}. JSON only.`,
        response_json_schema:schema,
      });
      setInterventions((res?.interventions||[]).map((item,i)=>({...item,id:`int-${i}-${Date.now()}`})));
      setIntGenerated(true);
    } catch(e) { console.error("Interventions failed:",e); }
    finally { setIntLoading(false); }
  }, [intLoading,intGenerated,cc,mdmResult,dispResult]);

  const loadPriorVisits = useCallback(async () => {
    if (priorVisitsLoading) return;
    setPriorVisitsLoading(true);
    try {
      const filter = demo?.mrn?{patient_identifier:demo.mrn,sort:"-encounter_date",limit:5}:{sort:"-encounter_date",limit:5};
      const results = await base44.entities.ClinicalNote.list(filter).catch(()=>[]);
      setPriorVisits((results||[]).filter(r=>r.status==="finalized"&&r.source==="QuickNote").slice(0,3));
    } catch { setPriorVisits([]); }
    finally { setPriorVisitsLoading(false); }
  }, [priorVisitsLoading,demo]);

  const generateSignOut = useCallback(async () => {
    if (!mdmResult||signOutBusy) return;
    setSignOutBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`SBAR sign-out for oncoming ED provider. CC: ${cc}. Working Dx: ${mdmResult.working_diagnosis||"TBD"} (${mdmResult.mdm_level||""}). Disposition: ${dispResult?.disposition||"Pending"}. 2-4 sentences. Return JSON: { "signout_text": "..." }`,
        response_json_schema:{type:"object",required:["signout_text"],properties:{signout_text:{type:"string"}}},
      });
      const text=res?.signout_text?.trim();
      if (text) {
        await base44.entities.ShiftSignOut.create({
          source:"QuickNote",patient_identifier:demo?.mrn||"",cc:cc||"",
          working_diagnosis:mdmResult.working_diagnosis||"",mdm_level:mdmResult.mdm_level||"",
          signout_text:text,status:"pending",created_date:new Date().toISOString(),
        }).catch(()=>null);
        setSignOutDone(true); setTimeout(()=>setSignOutDone(false),4000);
      }
    } catch(e) { console.error("Sign-out failed:",e); }
    finally { setSignOutBusy(false); }
  }, [mdmResult,dispResult,cc,demo,signOutBusy]);

  const runMDMAddendum = useCallback(async () => {
    if (!mdmResult||rerunAddendumBusy) return;
    setRerunAddendumBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc,vitals,hpi,ros,exam,vhAnalysis,parsedMeds,parsedAllergies,encounterType,ccProfile)
          + `\n\nADDENDUM: Prev Dx: ${mdmResult.working_diagnosis} (${mdmResult.mdm_level}). Labs: ${labs||"pending"}. Imaging: ${imaging||"pending"}. Revise if warranted.`,
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res);
      const ts=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      setMdmHistory(prev=>[...prev,{ts,trigger:"Interval Update",
        working_diagnosis:res.working_diagnosis||"",mdm_level:res.mdm_level||"",mdm_narrative:res.mdm_narrative||""}]);
    } catch(e) { console.error("Addendum failed:",e); }
    finally { setRerunAddendumBusy(false); }
  }, [mdmResult,cc,vitals,hpi,ros,exam,labs,imaging,vhAnalysis,parsedMeds,parsedAllergies,encounterType,rerunAddendumBusy]);

  const handleAddendumReady = useCallback((addendum) => {
    const ts=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
    setMdmResult(prev=>prev?{...prev,mdm_narrative:(prev.mdm_narrative||"").trim()+"\n\n---\nADDENDUM ["+ts+"]:\n"+addendum}:prev);
    setMdmHistory(prev=>[...prev,{ts,trigger:"Treatment Response Addendum",working_diagnosis:"",mdm_level:"",mdm_narrative:addendum}]);
  }, []);

  usePMHConditionInjector({
    mdmResult, pmh,
    onInject: useCallback((appendText) => {
      setMdmResult(prev=>prev?{...prev,mdm_narrative:(prev.mdm_narrative||"")+appendText}:prev);
    }, []),
  });

  const handleEncounterImport = useCallback(({ cc: impCC, age, vitals: impVitals }) => {
    if (impCC)     setCC(impCC);
    if (impVitals) setVitals(impVitals);
    if (age) setSlots(prev=>{const next=[...prev];next[activeSlot]={...next[activeSlot],patientAge:age};return next;});
  }, [activeSlot]);

  const smartExpansions = DEFAULT_EXPANSIONS;
  const stripLabels = (text) => pasteReady!=="prose" ? text : text.replace(/^[A-Z][A-Z /&]+:\s*/gm,"").trim();

  const copyNote = useCallback(() => {
    const text=buildFullNote({cc,vitals,hpi:effectiveHpi,ros,exam},mdmResult,{labs,imaging,newVitals},dispResult,{icdSelected,interventions,parsedMeds,parsedAllergies});
    navigator.clipboard.writeText(stripLabels(text)).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  }, [cc,vitals,effectiveHpi,ros,exam,mdmResult,labs,imaging,newVitals,dispResult,icdSelected,interventions,parsedMeds,parsedAllergies,pasteReady]);

  const copyClinicalInputs = useCallback(() => {
    const sections=[
      {label:"CHIEF COMPLAINT",text:cc},
      {label:"TRIAGE VITALS",text:vitals},
      {label:hpiMode==="summary"&&hpiSummary?"HISTORY OF PRESENT ILLNESS (AI Summary)":"HISTORY OF PRESENT ILLNESS",text:effectiveHpi},
      {label:"REVIEW OF SYSTEMS",text:ros},
      {label:"PHYSICAL EXAM",text:exam},
    ].filter(s=>s.text?.trim());
    if (!sections.length) return;
    const block=pasteReady==="prose"?sections.map(s=>s.text.trim()).join("\n\n"):sections.map(s=>`${s.label}:\n${s.text.trim()}`).join("\n\n");
    navigator.clipboard.writeText(block).then(()=>{setCopiedInputs(true);setTimeout(()=>setCopiedInputs(false),2500);});
  }, [cc,vitals,effectiveHpi,ros,exam,hpiMode,hpiSummary,pasteReady]);

  const copyPhase1 = useCallback(() => {
    if (!mdmResult) return;
    const prov=window._notryaProvider||{};
    const ts=new Date().toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});
    const text=buildPhase1Copy({fields:{cc,vitals,hpi:effectiveHpi,ros,exam},mdmResult,treatmentResult,providerName:prov.full_name||demo?.full_name||"",facilityName:prov.facility||"",timestamp:ts});
    navigator.clipboard.writeText(stripLabels(text)).then(()=>{setCopiedP1(true);setTimeout(()=>setCopiedP1(false),3000);});
  }, [cc,vitals,effectiveHpi,ros,exam,mdmResult,demo,pasteReady,treatmentResult]);

  const copyPhase2 = useCallback(() => {
    if (!dispResult) return;
    const prov=window._notryaProvider||{};
    const consultBlock=consults.length?"\n\nCONSULTS:\n"+consults.map(c=>`  ${c.service}${c.provider?" — Dr."+c.provider:""}${c.time?" at "+c.time:""}: ${c.recommendation}`).join("\n"):"";
    let text=buildPhase2Copy({labs,imaging,ekg,newVitals},dispResult,{icdSelected,interventions,providerName:prov.full_name||demo?.full_name||"",sigBlock:prov.sigBlock||"",demographics:{...(demo||{}),facility:prov.facility}},formatMode)+consultBlock;
    const labCopy=formatLabSummaryForCopy(labSummaryResult);
    if (labCopy) text=text+"\n\n"+labCopy;
    const finalCopy=formatFinalImpressionForCopy(finalImpressionResult,confirmedRanks);
    if (finalCopy) text=text+"\n\n"+finalCopy;
    navigator.clipboard.writeText(stripLabels(text)).then(()=>{setCopiedP2(true);setTimeout(()=>setCopiedP2(false),3000);});
  }, [labs,imaging,ekg,newVitals,dispResult,icdSelected,interventions,demo,formatMode,consults,pasteReady,labSummaryResult]);

  const copyMDMOnly = useCallback(() => {
    if (!mdmResult) return;
    navigator.clipboard.writeText(stripLabels(buildMDMBlock(mdmResult,{treatmentPlan,actionPlan}))).then(()=>{setCopiedMDMOnly(true);setTimeout(()=>setCopiedMDMOnly(false),2500);});
  }, [mdmResult,pasteReady,treatmentPlan,actionPlan]);

  const copyDischargeOnly = useCallback(() => {
    const di=dispResult?.discharge_instructions;
    if (!di) return;
    const dateStr=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
    const lines=["DISCHARGE INSTRUCTIONS","","Date: "+dateStr,"","WHAT YOU WERE TREATED FOR:"];
    lines.push(di.diagnosis_explanation||dispResult?.final_diagnosis||"See your physician.","");
    lines.push("HOW TO CARE FOR YOURSELF AT HOME:");
    const homeCare=[];
    if (di.home_care_instructions?.length) di.home_care_instructions.forEach(i=>homeCare.push(i));
    if (di.medications?.length) di.medications.forEach(m=>homeCare.push(`Take ${typeof m==="string"?m:m.medication||m} as prescribed.`));
    if (di.activity) homeCare.push(di.activity);
    if (di.diet) homeCare.push(di.diet);
    if (homeCare.length) homeCare.forEach(i=>lines.push(`• ${i}`)); else lines.push("• Follow up with your doctor for specific home care instructions.");
    lines.push("");
    if (di.return_precautions?.length) {
      lines.push("RETURN TO THE EMERGENCY DEPARTMENT OR CALL 911 IF:");
      di.return_precautions.forEach((r,i)=>lines.push(`${i+1}. ${r}`));
      lines.push("");
    }
    lines.push("FOLLOW-UP CARE:",di.followup||"Contact your primary care provider within 3-5 days.","");
    lines.push("These instructions support your care but do not replace medical advice.");
    navigator.clipboard.writeText(lines.join("\n")).then(()=>{setCopiedDischargeOnly(true);setTimeout(()=>setCopiedDischargeOnly(false),2500);});
  }, [dispResult]);
  const copyDischargeInstructions = copyDischargeOnly;

  const saveAllSlots = useCallback(async (force=false) => {
    if (slotSavingRef.current&&!force) return;
    slotSavingRef.current=true; setSlotSaving(true);
    const currentSlots=slotsRef.current;
    const currentActive=activeSlotRef.current;
    const currentCacheIds=[...slotCacheIdsRef.current];
    const newSaveTimes=[...slotSaveTimes];
    const allStates=currentSlots.map((slot,i)=>i===currentActive?{...slot,...slotStateRef.current}:slot);
    const newCacheIds=[...currentCacheIds];
    for (let i=0;i<4;i++) {
      const s=allStates[i];
      if (!s.cc&&!s.hpi&&!s.mdmResult&&!s.labs) continue;
      const payload=serializeSlot(s,i);
      try {
        if (newCacheIds[i]) { await base44.entities.ClinicalNote.update(newCacheIds[i],payload); }
        else { const rec=await base44.entities.ClinicalNote.create(payload); if (rec?.id) newCacheIds[i]=rec.id; }
        newSaveTimes[i]=Date.now();
      } catch(e) { console.error(`Slot ${i} save failed:`,e); }
    }
    setSlotCacheIds(newCacheIds); setSlotSaveTimes(newSaveTimes);
    slotSavingRef.current=false; setSlotSaving(false);
  }, [slotSaveTimes]);

  const clearSlotCache = useCallback((idx) => {
    const cacheId=slotCacheIdsRef.current[idx];
    if (cacheId) {
      base44.entities.ClinicalNote.update(cacheId,{status:"superseded"}).catch(()=>null);
      const newIds=[...slotCacheIdsRef.current]; newIds[idx]=null;
      setSlotCacheIds(newIds); slotCacheIdsRef.current=newIds;
    }
    setSlotSaveTimes(prev=>{const n=[...prev];n[idx]=null;return n;});
  }, []);

  const saveNote = useCallback(async () => {
    if (saving||!hasAnyResult) return;
    setSaving(true);
    try {
      const user=await base44.auth.me().catch(()=>null);
      const fullText=buildFullNote({cc,vitals,hpi,ros,exam},mdmResult,{labs,imaging,newVitals},dispResult,{icdSelected,interventions,parsedMeds,parsedAllergies});
      await base44.entities.ClinicalNote.create({
        source:"QuickNote",encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"",chief_complaint:cc||"",raw_note:fullText,full_note_text:fullText,
        working_diagnosis:mdmResult?.working_diagnosis||dispResult?.final_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"",mdm_narrative:formatMDMForCopy(mdmResult)||"",
        mdm:formatMDMForCopy(mdmResult)||"",disposition:dispResult?.disposition||"",
        provider_name:user?.full_name||user?.email||"",patient_identifier:demo?.mrn||"",
        status:"finalized",flag_reviewed:false,
        result_flags_json:dispResult?.result_flags?.length?JSON.stringify(dispResult.result_flags):"",
        icd_codes_json:icdSelected.length?JSON.stringify(icdSelected):"",
        lab_summary_json:labSummaryResult?JSON.stringify(labSummaryResult):"",
        final_impression_json:finalImpressionResult?JSON.stringify(finalImpressionResult):"",
        confirmed_icd10_codes:finalImpressionResult?(finalImpressionResult.diagnoses||[]).filter(d=>confirmedRanks.has(d.rank)).map(d=>d.icd10_code).join(", "):"",
        meds_raw:medsRaw||"",allergies_raw:allergiesRaw||"",
      });
      setSavedNote(true); setTimeout(()=>setSavedNote(false),3000);
      setSlots(prev=>{const next=[...prev];next[activeSlot]={...next[activeSlot],savedNoteId:"saved"};return next;});
      clearSlotCache(activeSlot);
      if (draftId) { base44.entities.ClinicalNote.update(draftId,{status:"superseded"}).catch(()=>null); setDraftId(null); }
      if (patientIdParam) {
        const ts=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
        base44.entities.Patient.update(patientIdParam,{tasks:[...(patientRecord?.tasks||[]),`QuickNote completed — ${ts}`]}).catch(()=>null);
      }
    } catch(e) { console.error("Save failed:",e); }
    finally { setSaving(false); }
  }, [saving,hasAnyResult,cc,vitals,hpi,ros,exam,labs,imaging,newVitals,mdmResult,dispResult,demo,icdSelected,interventions,parsedMeds,parsedAllergies,medsRaw,allergiesRaw,draftId,activeSlot,clearSlotCache]);

  const sendToNPI = useCallback(async () => {
    if (sendingNPI) return;
    setSendingNPI(true);
    try {
      await base44.entities.ClinicalNote.create({
        source:"QN-Handoff",status:"pending",encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"",full_note_text:vitals||"",hpi_raw:hpi||"",ros_raw:ros||"",exam_raw:exam||"",
        labs_raw:labs||"",imaging_raw:imaging||"",working_diagnosis:mdmResult?.working_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"",mdm_narrative:mdmResult?.mdm_narrative||"",patient_identifier:demo?.mrn||"",
      });
      setSentToNPI(true);
      setTimeout(()=>{window.location.href="/NewPatientInput";},1200);
    } catch(e) { console.error("Send to NPI failed:",e); setSendingNPI(false); }
  }, [sendingNPI,cc,vitals,hpi,ros,exam,labs,imaging,mdmResult,demo]);

  const handleNewEncounter = useCallback(() => {
    const snap={cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,parsedMeds,parsedAllergies,mdmResult,dispResult};
    setUndoData(snap);
    [setCC,setVitals,setHpi,setRos,setExam,setLabs,setImaging,setEkg,setNewVitals].forEach(fn=>fn(""));
    setParsedMeds([]); setParsedAllergies([]);
    setMdmResult(null); setDispResult(null);
    setTreatmentResult(null); setLabSummaryResult(null);
    setFinalImpressionResult(null); setEdMedsResult(null);
    if (labsAnalyzeTimer.current) clearTimeout(labsAnalyzeTimer.current);
    if (imagingAnalyzeTimer.current) clearTimeout(imagingAnalyzeTimer.current);
    if (hpiRosTimer.current) clearTimeout(hpiRosTimer.current);
    if (hpiExamTimer.current) clearTimeout(hpiExamTimer.current);
    setConfirmedRanks(new Set()); setRejectedRanks(new Set());
    setP1Error(null); setP2Error(null); setP2Open(false);
    setWorkupRationale(null); setConsults([]);
    setTreatmentPlan(""); setActionPlan("");
    setPatientResponse(""); setMdmHistory([]); setMdmInitialTs(null);
    setHpiGaps([]); setLabRecs(null); setImagingRecs(null);
    setShowHPIBuilder(false); setHpiTemplate(""); setHpiBuilderCC("");
    // v14.0: reset CC profile, reopen launcher for new encounter
    setCCProfile(null); setShowCCLauncher(true); setMustNotMissDismissed(false);
    clearSlotCache(activeSlot);
    setShowUndo(true);
    const t=setTimeout(()=>{setShowUndo(false);setUndoData(null);},6000);
    setUndoTimer(t);
  }, [cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,parsedMeds,parsedAllergies,mdmResult,dispResult,activeSlot,clearSlotCache]);

  const [confirmingSlot, setConfirmingSlot] = useState(null);

  const resetSlot = useCallback((slotIndex) => {
    if (slotIndex===activeSlot) {
      setCC(""); setVitals(""); setHpi(""); setRos(""); setExam("");
      setLabs(""); setImaging(""); setEkg("");
      setParsedMeds([]); setParsedAllergies([]);
      setMdmResult(null); setTreatmentResult(null); setLabSummaryResult(null);
      setEdMedsResult(null); setFinalImpressionResult(null); setDispResult(null);
      setConfirmedRanks(new Set()); setRejectedRanks(new Set());
    }
    setSlots(prev=>{const next=[...prev];next[slotIndex]=EMPTY_SLOT();return next;});
    clearSlotCache(slotIndex);
  }, [activeSlot,clearSlotCache]);

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
  }, [undoData,undoTimer]);

  const handleCCSelect = useCallback((ccLabel, hpiText, rosText, examText) => {
    if (typeof setCC==="function") setCC(ccLabel);
    if (rosText&&typeof setRos==="function") setRos(rosText);
    if (examText&&typeof setExam==="function") setExam(examText);
    if (hpiText) { setHpiTemplate(hpiText); setHpiBuilderCC(ccLabel); setShowHPIBuilder(true); }
  }, []);

  useEffect(()=>{
    const handleCtrlT=(e)=>{
      if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="t") { e.preventDefault(); setShowCCPicker(true); }
    };
    document.addEventListener("keydown",handleCtrlT);
    return ()=>document.removeEventListener("keydown",handleCtrlT);
  },[]);

  const makeKeyDown = useCallback((idx,isLast,onEnterSubmit)=>(e)=>{
    if (e.key==="Tab"&&!e.shiftKey) { e.preventDefault(); if (!isLast) advanceFocus(idx); }
    if ((e.metaKey||e.ctrlKey)&&e.key==="Enter") { e.preventDefault(); if (onEnterSubmit) onEnterSubmit(); }
  },[advanceFocus]);

  useEffect(()=>{
    const fn=e=>{
      const tag=document.activeElement?.tagName?.toLowerCase();
      const inInput=tag==="textarea"||tag==="input";
      if ((e.ctrlKey||e.metaKey)&&e.key==="Enter") { e.preventDefault(); if (p2Open&&parseInt(document.activeElement?.dataset?.phase||"1")===2) runDisposition(); else runMDM(); return; }
      if ((e.ctrlKey||e.metaKey)&&!e.shiftKey&&["1","2","3","4"].includes(e.key)) { e.preventDefault(); switchToSlot(parseInt(e.key)-1); return; }
      if ((e.ctrlKey||e.metaKey)&&e.key==="s") { e.preventDefault(); saveAllSlots(true); return; }
      if (e.shiftKey&&e.key==="?"&&!e.ctrlKey&&!e.metaKey) { e.preventDefault(); setShowKbHelp(h=>!h); return; }
      if (e.shiftKey&&e.key==="1"&&!e.ctrlKey&&!e.metaKey&&mdmResult)  { e.preventDefault(); copyPhase1(); return; }
      if (e.shiftKey&&e.key==="2"&&!e.ctrlKey&&!e.metaKey&&dispResult) { e.preventDefault(); copyPhase2(); return; }
      if (inInput) return;
      if ((e.key==="c"||e.key==="C")&&!e.ctrlKey&&!e.metaKey) { if (e.shiftKey) { e.preventDefault(); copyClinicalInputs(); return; } if (mdmResult||dispResult) { e.preventDefault(); copyNote(); } }
    };
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[p2Open,mdmResult,dispResult,runMDM,runDisposition,copyNote,copyClinicalInputs,copyPhase1,copyPhase2,switchToSlot,saveAllSlots]);

  useEffect(()=>{ if (p2Open) setTimeout(()=>{fieldRefs.current[5]?.current?.focus();},80); },[p2Open]);

  useEffect(()=>{
    try {
      const params=new URLSearchParams(window.location.search);
      const v=params.get("vitals");
      if (v) { setVitals(decodeURIComponent(v)); setVhImported(true); window.history.replaceState({},"",window.location.pathname); }
    } catch {}
    base44.entities.UserPreferences.list({sort:"-created_date",limit:1}).then(results=>{
      const r=results?.[0];
      if (r) {
        if (r.provider_name&&!demo?.full_name) { window._notryaProvider={full_name:[r.provider_name,r.credentials].filter(Boolean).join(", "),firstName:r.provider_name,facility:r.facility||"",location:r.location||"Emergency Department",sigBlock:r.signature_block||""}; }
        if (r.format_mode) setFormatMode(r.format_mode);
        if (r.default_encounter_type) setEncounterType(r.default_encounter_type);
        setProviderInfo({name:r.provider_name||"",credentials:r.credentials||"",facility:r.facility||""});
      }
    }).catch(()=>null);
    base44.entities.ClinicalNote.list({sort:"-created_date",limit:10}).then(results=>{
      const all=results||[];
      const vhRec=all.find(r=>r.source==="VH-Analysis"&&r.status==="pending");
      if (vhRec) {
        let flags=[]; try{flags=JSON.parse(vhRec.ros_raw||"[]");}catch{}
        setVhAnalysis({trend_narrative:vhRec.full_note_text||"",vitals_summary:vhRec.hpi_raw||"",clinical_flags:Array.isArray(flags)?flags:[]});
        base44.entities.ClinicalNote.update(vhRec.id,{status:"imported"}).catch(()=>null);
      }
      const nhRec=all.find(r=>r.source==="NH-Resume"&&r.status==="pending");
      if (nhRec) {
        if (nhRec.cc) setCC(nhRec.cc); if (nhRec.hpi_raw) setHpi(nhRec.hpi_raw);
        if (nhRec.ros_raw) setRos(nhRec.ros_raw); if (nhRec.exam_raw) setExam(nhRec.exam_raw);
        if (nhRec.labs_raw) setLabs(nhRec.labs_raw); if (nhRec.imaging_raw) setImaging(nhRec.imaging_raw);
        setNhResumed(true);
        base44.entities.ClinicalNote.update(nhRec.id,{status:"imported"}).catch(()=>null);
      }
      const addRec=all.find(r=>r.source==="NH-Addendum"&&r.status==="pending");
      if (addRec) {
        setAddendumRef({cc:addRec.cc||"",working_diagnosis:addRec.working_diagnosis||"",mdm_level:addRec.mdm_level||"",patient_identifier:addRec.patient_identifier||""});
        setAddendumMode(true); setP2Open(true);
        base44.entities.ClinicalNote.update(addRec.id,{status:"imported"}).catch(()=>null);
      }
    }).catch(()=>null);
    base44.entities.ClinicalNote.list({sort:"-created_date",limit:50}).then(results=>{
      const cacheRecords=(results||[]).filter(r=>r.source==="QN-SlotCache"&&r.status==="active");
      if (!cacheRecords.length) return;
      const slotMap={}; const idMap={};
      cacheRecords.forEach(r=>{
        const match=(r.patient_identifier||"").match(/^slot:(\d)$/);
        if (!match) return;
        const idx=parseInt(match[1]);
        if (!slotMap[idx]) { slotMap[idx]=deserializeSlot(r); idMap[idx]=r.id; }
      });
      const restoredCount=Object.keys(slotMap).length;
      if (!restoredCount) return;
      setSlots(prev=>{const next=[...prev];Object.entries(slotMap).forEach(([idx,slotState])=>{next[parseInt(idx)]={...EMPTY_SLOT(),...slotState};});return next;});
      if (slotMap[0]) {
        const s=slotMap[0];
        if (s.cc) setCC(s.cc); if (s.hpi) setHpi(s.hpi); if (s.ros) setRos(s.ros);
        if (s.exam) setExam(s.exam); if (s.labs) setLabs(s.labs); if (s.imaging) setImaging(s.imaging);
        if (s.vitals) setVitals(s.vitals); if (s.ekg) setEkg(s.ekg);
        if (s.medsRaw) setMedsRaw(s.medsRaw); if (s.allergiesRaw) setAllergiesRaw(s.allergiesRaw);
        if (s.parsedMeds?.length) setParsedMeds(s.parsedMeds);
        if (s.parsedAllergies?.length) setParsedAllergies(s.parsedAllergies);
        if (s.mdmResult) { setMdmResult(s.mdmResult); setP2Open(true); }
        if (s.dispResult) setDispResult(s.dispResult);
        if (s.icdSelected?.length) setIcdSelected(s.icdSelected);
        if (s.interventions?.length) setInterventions(s.interventions);
        if (s.hpiSummary) setHpiSummary(s.hpiSummary);
        if (s.hpiMode) setHpiMode(s.hpiMode);
        if (s.encounterType) setEncounterType(s.encounterType);
      }
      const newCacheIds=[null,null,null,null];
      Object.entries(idMap).forEach(([idx,id])=>{newCacheIds[parseInt(idx)]=id;});
      setSlotCacheIds(newCacheIds); slotCacheIdsRef.current=newCacheIds;
      setSlotsRestoredCount(restoredCount); setSlotsRestored(true);
    }).catch(()=>null);
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const pid=params.get("patientId");
    if (!pid) return;
    setPatientIdParam(pid);
    base44.entities.Patient.get(pid).then(patient=>{
      if (!patient) return;
      setPatientRecord(patient);
      if (patient.cc) setCC(prev=>prev||patient.cc);
      if (patient.allergies?.length) setAllergiesRaw(prev=>prev||patient.allergies.join(", "));
      if (patient.pmhx?.length) setPmh(prev=>prev.length?prev:patient.pmhx);
    }).catch(()=>null);
  },[]);

  useEffect(()=>{
    slotStateRef.current={cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,
      medsRaw,allergiesRaw,parsedMeds,parsedAllergies,
      mdmResult,dispResult,icdSelected,interventions,
      hpiSummary,hpiMode,encounterType,p2Open,
      patientName:[demo?.firstName,demo?.lastName].filter(Boolean).join(" "),
      patientAge:demo?.age||"",lastActivity:Date.now(),
      treatmentResult,labSummaryResult,imagingAnalysisResult,
      edMedsResult,finalImpressionResult,confirmedRanks,rejectedRanks,
      ccProfile}; // v14.0
  });

  const LS_KEY="qn_autosave_v1";
  useEffect(()=>{
    if (!cc&&!hpi&&!mdmResult) return;
    const t=setTimeout(()=>{
      try { localStorage.setItem(LS_KEY,JSON.stringify({cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,medsRaw,allergiesRaw,parsedMeds,parsedAllergies,mdmResult,dispResult,icdSelected,hpiSummary,hpiMode,encounterType,p2Open,treatmentPlan,actionPlan,savedAt:Date.now()})); } catch(e){}
    },1500);
    return ()=>clearTimeout(t);
  },[cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,medsRaw,allergiesRaw,parsedMeds,parsedAllergies,mdmResult,dispResult,icdSelected,hpiSummary,hpiMode,encounterType,p2Open,treatmentPlan,actionPlan]);

  const [lsRestored,setLsRestored]=useState(false);
  const [lsRestoredAt,setLsRestoredAt]=useState(null);
  useEffect(()=>{
    try {
      const raw=localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d=JSON.parse(raw);
      if (!d||!d.savedAt||Date.now()-d.savedAt>8*3600000) return;
      if (!d.cc&&!d.hpi&&!d.mdmResult) return;
      if (d.cc) setCC(d.cc); if (d.vitals) setVitals(d.vitals); if (d.hpi) setHpi(d.hpi);
      if (d.ros) setRos(d.ros); if (d.exam) setExam(d.exam); if (d.labs) setLabs(d.labs);
      if (d.imaging) setImaging(d.imaging); if (d.ekg) setEkg(d.ekg);
      if (d.medsRaw) setMedsRaw(d.medsRaw); if (d.allergiesRaw) setAllergiesRaw(d.allergiesRaw);
      if (d.parsedMeds?.length) setParsedMeds(d.parsedMeds);
      if (d.parsedAllergies?.length) setParsedAllergies(d.parsedAllergies);
      if (d.mdmResult) { setMdmResult(d.mdmResult); setP2Open(true); }
      if (d.dispResult) setDispResult(d.dispResult);
      if (d.icdSelected?.length) setIcdSelected(d.icdSelected);
      if (d.hpiSummary) setHpiSummary(d.hpiSummary);
      if (d.hpiMode) setHpiMode(d.hpiMode);
      if (d.encounterType) setEncounterType(d.encounterType);
      if (d.treatmentPlan) setTreatmentPlan(d.treatmentPlan);
      if (d.actionPlan) setActionPlan(d.actionPlan);
      setLsRestored(true); setLsRestoredAt(d.savedAt);
    } catch(e){}
  },[]);

  useEffect(()=>{ const interval=setInterval(()=>saveAllSlots(),60000); return ()=>clearInterval(interval); },[saveAllSlots]);

  const isFatigueRisk=useMemo(()=>{ const h=new Date().getHours(); return h>=17||h<=7; },[]);
  const getSaveLabel=(ts)=>{
    if (!ts) return null;
    const min=Math.floor((Date.now()-ts)/60000);
    if (min<1) return "just now"; if (min===1) return "1m ago";
    if (min<60) return `${min}m ago`; return `${Math.floor(min/60)}h ago`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={embedded?{fontFamily:"'DM Sans',sans-serif",background:"transparent",color:"var(--qn-txt)"}:
      {display:"flex",minHeight:"100%",background:"var(--qn-bg)",fontFamily:"'DM Sans',sans-serif",color:"var(--qn-txt)"}}>
      <div style={embedded?{}:{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0,paddingBottom:80}}>

        {/* ── Census patient context banner ── */}
        {!embedded&&patientRecord&&(
          <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"0 16px 8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",padding:"10px 16px",borderRadius:10,background:"rgba(8,22,40,.75)",border:"1px solid rgba(0,229,192,.25)",borderLeft:"3px solid rgba(0,229,192,.6)"}}>
              {patientRecord.room&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:"var(--qn-teal)",background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.3)",borderRadius:5,padding:"2px 8px"}}>Rm {patientRecord.room}</span>}
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#f2f7ff"}}>{patientRecord.name}</span>
              {(patientRecord.age||patientRecord.sex)&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(184,212,240,.7)"}}>{[patientRecord.age&&`${patientRecord.age}y`,patientRecord.sex].filter(Boolean).join(" · ")}</span>}
              {patientRecord.cc&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-teal)",background:"rgba(0,229,192,.07)",border:"1px solid rgba(0,229,192,.2)",borderRadius:20,padding:"1px 10px"}}>CC: {patientRecord.cc}</span>}
              {patientRecord.esi&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:patientRecord.esi<=2?"#ff6b6b":patientRecord.esi===3?"#ffa726":"var(--qn-teal)",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,padding:"2px 8px"}}>ESI {patientRecord.esi}</span>}
              <div style={{flex:1}}/>
              <button onClick={()=>{window.location.href="/CommandCenter";}} style={{padding:"5px 14px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,border:"1px solid rgba(42,79,122,.5)",background:"rgba(8,22,46,.8)",color:"rgba(130,174,206,.85)"}}>← Back to Census</button>
            </div>
          </div>
        )}

        <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:embedded?"0":"0 16px 40px"}}>

          {embedded&&(
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}} className="no-print">
              <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"var(--qn-teal)"}}>QuickNote</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:1.5,textTransform:"uppercase",background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.25)",borderRadius:4,padding:"2px 7px"}}>v13.0 · HPI→ROS+PE · Layout Restructure</span>
            </div>
          )}

          <PatientBanner demo={demo} />
          {isFatigueRisk&&!fatigueDismissed&&<FatigueBanner onDismiss={()=>setFatigueDismissed(true)} />}
          <StepProgress phase1Done={Boolean(mdmResult)} phase2Done={Boolean(dispResult)} p2Open={p2Open} />

          {/* ── Auto-save restore banners ── */}
          {!embedded&&(
            <div style={{marginBottom:10}} className="no-print">
              {lsRestored&&(
                <div className="qn-fade" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",marginBottom:8,borderRadius:10,background:"rgba(59,158,255,.05)",border:"1px solid rgba(59,158,255,.3)"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--qn-blue)"}}>⚡</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt2)",flex:1}}><strong style={{color:"var(--qn-blue)"}}>Auto-saved session restored</strong>{lsRestoredAt&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",marginLeft:8}}>saved {Math.round((Date.now()-lsRestoredAt)/60000)}m ago</span>}</span>
                  <button onClick={()=>{localStorage.removeItem(LS_KEY);setLsRestored(false);}} style={{padding:"2px 8px",borderRadius:5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,border:"1px solid rgba(42,79,122,.4)",background:"transparent",color:"var(--qn-txt4)"}}>Clear cache</button>
                  <button onClick={()=>setLsRestored(false)} style={{padding:"2px 8px",borderRadius:5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,border:"1px solid rgba(42,79,122,.4)",background:"transparent",color:"var(--qn-txt4)"}}>✕</button>
                </div>
              )}
              {slotsRestored&&(
                <div className="qn-fade" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",marginBottom:8,borderRadius:10,background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.3)"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--qn-teal)"}}>↻</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt2)",flex:1}}><strong style={{color:"var(--qn-teal)"}}>{slotsRestoredCount} patient slot{slotsRestoredCount>1?"s":""}</strong> restored from your last session</span>
                  <button onClick={()=>setSlotsRestored(false)} style={{padding:"2px 8px",borderRadius:5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,border:"1px solid rgba(42,79,122,.4)",background:"transparent",color:"var(--qn-txt4)"}}>✕</button>
                </div>
              )}

              {/* ── Patient Queue Bar ── */}
              <div style={{display:"flex",gap:6,padding:"8px 10px",borderRadius:12,background:"rgba(8,22,40,.7)",border:"1px solid rgba(42,79,122,.35)"}}>
                {slots.map((slot,i)=>{
                  const isActive=i===activeSlot;
                  const isEmpty=!slot.cc&&!slot.hpi&&!slot.mdmResult;
                  const isSaved=!!slot.savedNoteId;
                  const hasDisp=!!slot.dispResult;
                  const hasMDM=!!slot.mdmResult;
                  const hasP2Data=!!(slot.labs||slot.imaging||slot.newVitals);
                  const hasP1Data=!!(slot.cc||slot.hpi);
                  const hasCacheId=!!slotCacheIds[i];
                  const status=isEmpty?null:isSaved?{label:"Saved",color:"var(--qn-green)",bg:"rgba(61,255,160,.12)",bd:"rgba(61,255,160,.4)"}:hasDisp?{label:"Dispo Done",color:"var(--qn-purple)",bg:"rgba(155,109,255,.12)",bd:"rgba(155,109,255,.4)"}:hasMDM&&hasP2Data?{label:"Phase 2",color:"var(--qn-blue)",bg:"rgba(59,158,255,.12)",bd:"rgba(59,158,255,.4)"}:hasMDM?{label:"MDM Done",color:"var(--qn-teal)",bg:"rgba(0,229,192,.12)",bd:"rgba(0,229,192,.4)"}:hasP1Data?{label:"Phase 1",color:"var(--qn-gold)",bg:"rgba(245,200,66,.1)",bd:"rgba(245,200,66,.35)"}:null;
                  // v14.0: prefix slot display with CC icon when a non-general CC is set
                  const rawName=slot.patientName||(slot.cc?slot.cc.slice(0,22)+(slot.cc.length>22?"…":""):null);
                  const displayName=slot.ccProfile&&slot.ccProfile.id!=="general"
                    ? `${slot.ccProfile.icon} ${rawName||slot.ccProfile.label}`
                    : rawName;
                  const hasData=!!(slot.cc||slot.hpi||slot.vitals||slot.labs||slot.mdmResult);
                  return (
                    <button key={i} onClick={()=>switchToSlot(i)} style={{flex:1,padding:"8px 10px",borderRadius:9,cursor:"pointer",textAlign:"left",transition:"all .15s",position:"relative",border:`1px solid ${isActive?"rgba(0,229,192,.55)":isEmpty?"rgba(42,79,122,.2)":"rgba(42,79,122,.45)"}`,background:isActive?"rgba(0,229,192,.1)":isEmpty?"rgba(8,22,40,.3)":"rgba(14,37,68,.55)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:isEmpty?0:4}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:.5,color:isActive?"var(--qn-teal)":"var(--qn-txt4)"}}>P{i+1}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(42,79,122,.5)"}}>Ctrl+{i+1}</span>
                        <div style={{flex:1}}/>
                        {isSaved&&<div style={{width:7,height:7,borderRadius:"50%",background:"var(--qn-green)",boxShadow:"0 0 5px rgba(61,255,160,.6)",flexShrink:0}}/>}
                        {isActive&&!isSaved&&<div style={{width:6,height:6,borderRadius:"50%",background:"var(--qn-teal)",flexShrink:0,animation:"qnpulse 1.2s ease-in-out infinite"}}/>}
                        {hasCacheId&&!isSaved&&<div style={{width:5,height:5,borderRadius:"50%",background:"rgba(59,158,255,.6)",flexShrink:0}}/>}
                        {hasData&&(
                          <button onClick={e=>{e.stopPropagation();if(confirmingSlot===i){setConfirmingSlot(null);}else{setConfirmingSlot(i);setTimeout(()=>{resetSlot(i);setConfirmingSlot(null);},1500);}}} title={`Reset Patient ${i+1}`}
                            style={{width:14,height:14,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,cursor:"pointer",border:"none",background:"transparent",padding:0,color:confirmingSlot===i?"#ff4d4f":"rgba(200,223,240,0.3)",flexShrink:0}}>
                            {confirmingSlot===i?"?":"✕"}
                          </button>
                        )}
                      </div>
                      {isEmpty?(<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(42,79,122,.5)",fontStyle:"italic"}}>Empty</div>):(
                        <>
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:isActive?700:600,color:isActive?"var(--qn-txt)":"var(--qn-txt2)",lineHeight:1.25,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName||"No CC entered"}</div>
                          {status&&(<div style={{marginTop:4,display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:5,background:status.bg,border:`1px solid ${status.bd}`}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:status.color,letterSpacing:.5,textTransform:"uppercase"}}>{status.label}</span></div>)}
                          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
                            {getSaveLabel(slotSaveTimes[i])&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(59,158,255,.5)",flex:1}}>☁ {getSaveLabel(slotSaveTimes[i])}</span>}
                            <button onClick={e=>{e.stopPropagation();saveAllSlots(true);}} disabled={slotSaving} style={{padding:"1px 7px",borderRadius:4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,border:`1px solid ${slotSaving?"rgba(42,79,122,.25)":"rgba(59,158,255,.4)"}`,background:slotSaving?"rgba(14,37,68,.3)":"rgba(59,158,255,.08)",color:slotSaving?"var(--qn-txt4)":"var(--qn-blue)"}}>
                              {slotSaving?"●":"↑ Save"}
                            </button>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 2px"}}><div style={{width:1,height:40,background:"rgba(42,79,122,.35)"}}/></div>
                <button onClick={()=>setShowOrderQueue(v=>!v)} style={{alignSelf:"center",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,flexShrink:0,border:`1px solid ${showOrderQueue?"rgba(245,158,11,.5)":"rgba(42,79,122,.4)"}`,background:showOrderQueue?"rgba(245,158,11,.12)":"transparent",color:showOrderQueue?"#f59e0b":"var(--qn-txt4)"}}>Orders</button>
                <button onClick={()=>setShowKbHelp(h=>!h)} title="Keyboard shortcuts" style={{alignSelf:"center",padding:"6px 10px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,border:"1px solid rgba(42,79,122,.4)",background:"transparent",color:"var(--qn-txt4)",flexShrink:0}}>?</button>
              </div>
            </div>
          )}

          {/* ── Toasts and banners ── */}
          {showUndo&&<UndoToast onUndo={handleUndo} onDismiss={()=>{clearTimeout(undoTimer);setShowUndo(false);setUndoData(null);}}/>}
          {nhResumed&&!nhResumeDismissed&&<NhResumeBanner onDismiss={()=>setNhResumeDismissed(true)}/>}
          {vhImported&&!vhDismissed&&<VhImportBanner onDismiss={()=>setVhDismissed(true)}/>}
          <VhAnalysisCard vhAnalysis={vhAnalysis&&!vhAnalysisDismissed?vhAnalysis:null} onDismiss={()=>setVhAnalysisDismissed(true)}/>
          {addendumMode&&<AddendumBanner addendumRef={addendumRef}/>}
          <PriorVisitsPanel visits={priorVisits} loading={priorVisitsLoading} onLoad={loadPriorVisits}/>
          {(vitals.trim().length>10||labs.trim().length>5)&&<SepsisBanner vitalsText={vitals} labsText={labs}/>}

          {/* ── v14.0: CC Launcher — full-screen CC selection modal ── */}
          <CCLauncher
            isOpen={showCCLauncher}
            onSelect={(profile) => {
              setCCProfile(profile);
              setShowCCLauncher(false);
              setMustNotMissDismissed(false);

              if (profile.id === "general") return;

              // Set CC text field
              setCC(profile.label);

              // Persist profile into current slot state immediately
              setSlots(prev => {
                const next = [...prev];
                next[activeSlot] = { ...next[activeSlot], ccProfile: profile };
                return next;
              });

              // v15.0: look up HPIBuilder template from CC_LIBRARY
              // Match by id first, then by label (handles sob↔shortness_of_breath etc.)
              const profileLabelLower = profile.label.toLowerCase();
              const libEntry = CC_LIBRARY.find(c =>
                c.id === profile.id ||
                c.label.toLowerCase() === profileLabelLower ||
                profileLabelLower.includes(c.label.toLowerCase().split(" / ")[0].toLowerCase()) ||
                c.label.toLowerCase().includes(profileLabelLower.split(" / ")[0].toLowerCase())
              );

              if (libEntry) {
                // Open HPIBuilder with bracket-chip template
                const age = slots[activeSlot]?.patientAge || demo?.age || 20;
                const unit = "year";
                const tpl = typeof libEntry.hpi_template === "function"
                  ? libEntry.hpi_template(age, unit)
                  : libEntry.hpi_template;
                setHpiTemplate(tpl);
                setHpiBuilderCC(profile.label);
                setShowHPIBuilder(true);
                // Also seed ROS + PE from CC_LIBRARY if physician hasn't entered them
                if (!ros.trim() && libEntry.ros)   setRos(libEntry.ros);
                if (!exam.trim() && libEntry.exam) setExam(libEntry.exam);
              } else if (profile.hpi_scaffold) {
                // Fall back to plain scaffold text from CC_PROFILES
                if (!hpi.trim()) setHpi(profile.hpi_scaffold);
                if (!ros.trim() && profile.ros_template)  setRos(profile.ros_template);
                if (!exam.trim() && profile.pe_template)  setExam(profile.pe_template);
              }
            }}
            onClose={() => setShowCCLauncher(false)}
            currentProfileId={ccProfile?.id || null}
          />

          {/* ── v14.0: Must Not Miss Banner — sticky danger rail ── */}
          <MustNotMissBanner
            profile={ccProfile}
            dispResult={dispResult}
            onDismiss={() => setMustNotMissDismissed(true)}
            dismissed={mustNotMissDismissed}
          />

          {/* ── Modals ── */}
          <CCPicker isOpen={showCCPicker} onClose={()=>setShowCCPicker(false)} onSelect={handleCCSelect} patientAge={slots[activeSlot]?.patientAge||demo?.age} patientAgeUnit="year"/>
          {showHPIBuilder&&hpiTemplate&&(<HPIBuilder template={hpiTemplate} ccLabel={hpiBuilderCC} onApply={(completedHpi)=>{if(typeof setHpi==="function")setHpi(completedHpi);}} onClose={()=>setShowHPIBuilder(false)}/>)}
          <EncounterPicker onSelect={handleEncounterImport}/>

          {/* ══════════════════════════════════════════════════════════════════
              PHASE 1 — DATA COLLECTION
          ══════════════════════════════════════════════════════════════════ */}
          <PhaseDivider phase="Phase 1" label="Initial Assessment" color="var(--qn-teal)" sublabel="CC · Vitals · HPI · ROS · Exam" />

          {/* Patient History Tab (PMH/Meds/Allergies) */}
          <PMHTab
            pmh={pmh} setPmh={setPmh} psh={psh} setPsh={setPsh}
            patientMeds={patientMeds} setPatientMeds={setPatientMeds}
            patientAllergies={patientAllergies} setPatientAllergies={setPatientAllergies}
            chiefComplaint={cc} hpi={hpi}
            onOrderQueueChange={handlePMHOrders} onMDMDataChange={setPmhMDMData}
          />

          {/* Phase 1 core data entry panel */}
          <Phase1Panel
            cc={cc} setCC={setCC} vitals={vitals} setVitals={setVitals}
            hpi={hpi} setHpi={handleHpiChange}
            ros={ros} setRos={setRos} exam={exam} setExam={setExam}
            encounterType={encounterType} setEncounterType={setEncounterType}
            hpiMode={hpiMode} setHpiMode={setHpiMode} hpiSummary={hpiSummary} setHpiSummary={setHpiSummary}
            hpiSumBusy={hpiSumBusy} hpiSumError={hpiSumError} copiedHpiSum={copiedHpiSum} setCopiedHpiSum={setCopiedHpiSum}
            summarizeHPI={summarizeHPI}
            structureHPI={structureHPI} hpiStructureBusy={hpiStructureBusy} hpiStructureError={hpiStructureError}
            summarizeFromStructure={summarizeFromStructure} hpiGaps={hpiGaps}
            quickDDx={quickDDx} quickDDxBusy={quickDDxBusy} quickDDxErr={quickDDxErr}
            quickDDxDismissed={quickDDxDismissed} setQuickDDxDismissed={setQuickDDxDismissed} runQuickDDx={runQuickDDx}
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
            medsFromHpi={medsFromHpi} allergiesFromHpi={allergiesFromHpi}
            ccProfile={ccProfile}
            onChangeCC={() => setShowCCLauncher(true)}
          />

          {/* ── v13.0: HPI→ROS+PE AI status strip ── */}
          {hpi.trim().length > 60 && (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",marginBottom:8,borderRadius:8,background:"rgba(0,229,192,.04)",border:"1px solid rgba(0,229,192,.15)"}} className="no-print">
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-teal)",letterSpacing:.5}}>AI ASSIST</span>
              <div style={{width:1,height:12,background:"rgba(0,229,192,.2)"}}/>
              <button
                onClick={()=>generateROSFromHPI(hpi,cc)}
                disabled={hpiRosBusy}
                style={{padding:"3px 12px",borderRadius:6,cursor:hpiRosBusy?"not-allowed":"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:`1px solid ${hpiRosDone?"rgba(61,255,160,.5)":hpiRosBusy?"rgba(42,79,122,.3)":"rgba(0,229,192,.4)"}`,background:hpiRosDone?"rgba(61,255,160,.1)":hpiRosBusy?"rgba(14,37,68,.4)":"rgba(0,229,192,.07)",color:hpiRosDone?"var(--qn-green)":hpiRosBusy?"var(--qn-txt4)":"var(--qn-teal)"}}>
                {hpiRosDone?"✓ ROS Generated":hpiRosBusy?"● Generating ROS…":"↳ Generate ROS from HPI"}
              </button>
              <button
                onClick={()=>generatePEFromHPI(hpi,cc)}
                disabled={hpiExamBusy}
                style={{padding:"3px 12px",borderRadius:6,cursor:hpiExamBusy?"not-allowed":"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:`1px solid ${hpiExamDone?"rgba(61,255,160,.5)":hpiExamBusy?"rgba(42,79,122,.3)":"rgba(0,229,192,.4)"}`,background:hpiExamDone?"rgba(61,255,160,.1)":hpiExamBusy?"rgba(14,37,68,.4)":"rgba(0,229,192,.07)",color:hpiExamDone?"var(--qn-green)":hpiExamBusy?"var(--qn-txt4)":"var(--qn-teal)"}}>
                {hpiExamDone?"✓ PE Generated":hpiExamBusy?"● Generating PE…":"↳ Generate PE from HPI"}
              </button>
              {(hpiRosBusy||hpiExamBusy)&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(0,229,192,.5)",letterSpacing:.3}}>Analyzing HPI…</span>}
              {(hpiRosDone||hpiExamDone)&&!hpiRosBusy&&!hpiExamBusy&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(61,255,160,.6)"}}>Review and edit below before generating Initial Impression</span>}
            </div>
          )}

          {/* HPI Scaffold — inline, before generate button */}
          {cc.trim()&&(()=>{
            const scaffold=getScaffold(cc);
            if (!scaffold||hpi.trim()===scaffold.text.trim()) return null;
            return (
              <div style={{marginBottom:10,background:"rgba(59,158,255,.04)",border:"1px solid rgba(59,158,255,.2)",borderRadius:12,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 14px",borderBottom:scaffoldOpen?"1px solid rgba(59,158,255,.15)":"none",cursor:"pointer"}} onClick={()=>setScaffoldOpen(p=>!p)}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:"var(--qn-blue)",letterSpacing:1.5,textTransform:"uppercase"}}>💡 HPI Scaffold — {scaffold.cc}</span>
                  </div>
                  <span style={{color:"var(--qn-txt4)",fontSize:11}}>{scaffoldOpen?"▲":"▼"}</span>
                </div>
                {scaffoldOpen&&(
                  <div style={{padding:"10px 14px"}}>
                    <pre style={{margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",lineHeight:1.75,background:"rgba(59,158,255,.04)",borderRadius:8,padding:"10px 14px",border:"1px solid rgba(59,158,255,.12)",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{scaffold.text}</pre>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>{setHpi(scaffold.text);setScaffoldOpen(false);}} style={{padding:"5px 14px",borderRadius:7,cursor:"pointer",border:"1px solid rgba(59,158,255,.45)",background:"rgba(59,158,255,.1)",color:"var(--qn-blue)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700}}>{hpi.trim()?"↩ Replace HPI with scaffold":"↓ Insert into HPI"}</button>
                      {hpi.trim()&&(<button onClick={()=>{setHpi(prev=>scaffold.text+"\n\n"+prev);setScaffoldOpen(false);}} style={{padding:"5px 14px",borderRadius:7,cursor:"pointer",border:"1px solid rgba(245,200,66,.4)",background:"rgba(245,200,66,.07)",color:"var(--qn-gold)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700}}>↑ Prepend scaffold</button>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── PHASE 1 ACTION: Generate Initial Impression ── */}
          {/* This button sits BELOW all Phase 1 inputs (CC, Vitals, HPI, ROS, Exam) */}
          {!mdmResult && phase1Ready && (
            <div style={{marginBottom:16,padding:"16px 20px",borderRadius:14,background:"rgba(0,229,192,.04)",border:"1px solid rgba(0,229,192,.3)",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}} className="no-print">
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"var(--qn-teal)",marginBottom:3}}>Ready to Generate Initial Impression</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:.4}}>
                  {[cc&&`CC: ${cc.slice(0,30)}`,hpi.trim()&&"HPI ✓",ros.trim()&&"ROS ✓",exam.trim()&&"Exam ✓"].filter(Boolean).join("  ·  ")}
                </div>
              </div>
              <button
                onClick={runMDM}
                disabled={p1Busy}
                style={{padding:"12px 28px",borderRadius:10,cursor:p1Busy?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700,letterSpacing:.3,transition:"all .15s",flexShrink:0,
                  border:`2px solid ${p1Busy?"rgba(42,79,122,.3)":"rgba(0,229,192,.7)"}`,
                  background:p1Busy?"rgba(14,37,68,.4)":"rgba(0,229,192,.15)",
                  color:p1Busy?"var(--qn-txt4)":"var(--qn-teal)",
                  boxShadow:p1Busy?"none":"0 0 20px rgba(0,229,192,.12)"}}>
                {p1Busy ? "● Generating…" : "✦ Generate Initial Impression"}
              </button>
              {p1Error&&<div style={{width:"100%",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--qn-coral)",padding:"6px 10px",borderRadius:6,background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.3)"}}>{p1Error}</div>}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PHASE 1 OUTPUT — Initial Impression + A&P
          ══════════════════════════════════════════════════════════════════ */}
          {mdmResult && (
            <>
              <PhaseDivider phase="Phase 1 Output" label="Initial Impression & Plan" color="var(--qn-teal)" sublabel={mdmInitialTs ? `Generated ${mdmInitialTs}` : undefined} />

              <SectionCard accent="rgba(0,229,192,.25)">
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"var(--qn-teal)"}}>Initial Impression</span>
                  {isBounceback&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-coral)",background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.35)",borderRadius:4,padding:"2px 7px"}}>⚠ Bounceback</span>}
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:1,textTransform:"uppercase",background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.2)",borderRadius:4,padding:"2px 7px"}}>AMA/CMS 2023 · ACEP</span>
                  <div style={{flex:1}}/>
                  <button onClick={runWorkupRationale} disabled={workupRationaleBusy} style={{padding:"4px 11px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:`1px solid ${workupRationaleBusy?"rgba(42,79,122,.3)":"rgba(245,200,66,.4)"}`,background:workupRationaleBusy?"rgba(14,37,68,.4)":"rgba(245,200,66,.07)",color:workupRationaleBusy?"var(--qn-txt4)":"var(--qn-gold)"}}>
                    {workupRationaleBusy?"● …":"✦ Workup Rationale"}
                  </button>
                  <button onClick={async()=>{
                    const parts=[];
                    const ts=new Date().toLocaleString();
                    parts.push("MEDICAL DECISION MAKING — "+ts,"");
                    const imp=mdmResult?.initial_impression||{};
                    if (imp.working_dx_line) { parts.push("INITIAL IMPRESSION:"); parts.push("Working diagnosis: "+imp.working_dx_line); if(imp.clinical_rationale) parts.push(imp.clinical_rationale); (imp.cannot_exclude||[]).forEach(s=>parts.push(s)); if(imp.differentials?.length){parts.push("Differentials:");imp.differentials.forEach(d=>parts.push(d.rank+". "+d.diagnosis));} parts.push(""); }
                    const t=treatmentResult||null;
                    if(t){if(t.immediate_interventions?.length){parts.push("IMMEDIATE INTERVENTIONS:");t.immediate_interventions.forEach(i=>parts.push("- "+i));parts.push("");} if(t.medications?.length){parts.push("MEDICATIONS:");t.medications.forEach(m=>{if(m.is_note)parts.push("- Note: "+m.agent);else parts.push("- "+m.category+": "+m.agent+" "+m.dosing);});parts.push("");}}
                    parts.push("MDM COMPLEXITY");
                    if(mdmResult?.mdm_label) parts.push("Level: "+mdmResult.mdm_label+(mdmResult.mdm_level?" ("+mdmResult.mdm_level+")":""));
                    if(mdmResult?.problem_complexity) parts.push("Problem Complexity: "+mdmResult.problem_complexity);
                    if(mdmResult?.data_complexity) parts.push("Data Complexity: "+mdmResult.data_complexity);
                    if(mdmResult?.risk_tier) parts.push("Risk: "+mdmResult.risk_tier);
                    await navigator.clipboard.writeText(parts.filter(Boolean).join("\n"));
                    setCopiedMDMFull(true); setTimeout(()=>setCopiedMDMFull(false),2000);
                  }} style={{padding:"4px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,border:`1px solid ${copiedMDMFull?"rgba(61,255,160,.5)":"rgba(0,229,192,.35)"}`,background:copiedMDMFull?"rgba(61,255,160,.1)":"rgba(0,229,192,.07)",color:copiedMDMFull?"var(--qn-green)":"var(--qn-teal)"}}>
                    {copiedMDMFull?"✓ Copied":"Copy MDM"}
                  </button>
                  <button onClick={()=>{setMdmResult(null);setDispResult(null);setP2Open(false);setWorkupRationale(null);}} style={{padding:"4px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,border:"1px solid rgba(245,200,66,.35)",background:"rgba(245,200,66,.07)",color:"var(--qn-gold)"}}>↩ Re-run</button>
                  <button onClick={runMDMAddendum} disabled={rerunAddendumBusy} style={{padding:"4px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,border:`1px solid ${rerunAddendumBusy?"rgba(42,79,122,.3)":"rgba(155,109,255,.4)"}`,background:rerunAddendumBusy?"rgba(14,37,68,.4)":"rgba(155,109,255,.07)",color:rerunAddendumBusy?"var(--qn-txt4)":"var(--qn-purple)"}}>
                    {rerunAddendumBusy?"● …":"+ Addendum"}
                  </button>
                  <MDMHandoffBridge mdmResult={mdmResult} treatmentPlan={treatmentPlan} actionPlan={actionPlan} cc={cc}/>
                </div>

                <InitialImpressionDisplay result={mdmResult}/>

                {treatmentLoading&&<div style={{fontSize:12,color:"#00b89a",padding:"8px 0",fontFamily:"'JetBrains Mono',monospace"}}>Generating treatment plan…</div>}
                <TreatmentDisplay result={treatmentResult}/>

                <MDMResult result={mdmResult} copiedMDM={copiedMDM} setCopiedMDM={setCopiedMDM}
                  onNarrativeEdit={text=>setMdmResult(prev=>({...prev,mdm_narrative:text}))}/>

                {/* My Clinical Plan */}
                <div style={{marginTop:12,padding:"12px 14px",borderRadius:10,background:"rgba(14,37,68,.4)",border:"1px solid rgba(42,79,122,.3)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"var(--qn-txt2)",flex:1}}>My Clinical Plan</span>
                    <button onClick={generateClinicalPlan} disabled={treatmentPlanBusy} style={{padding:"5px 14px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:11,border:`1px solid ${treatmentPlanBusy?"rgba(42,79,122,.3)":"rgba(0,229,192,.5)"}`,background:treatmentPlanBusy?"rgba(14,37,68,.4)":"rgba(0,229,192,.1)",color:treatmentPlanBusy?"var(--qn-txt4)":"var(--qn-teal)"}}>
                      {treatmentPlanBusy?"● Generating…":(treatmentPlan||actionPlan)?"↻ Re-generate":"✦ AI Generate Plan"}
                    </button>
                    {(treatmentPlan||actionPlan)&&<button onClick={()=>{setTreatmentPlan("");setActionPlan("");}} style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:"1px solid rgba(42,79,122,.35)",background:"transparent",color:"var(--qn-txt4)"}}>Clear</button>}
                  </div>
                  {!treatmentPlan&&!actionPlan&&!treatmentPlanBusy&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"rgba(107,158,200,.4)",letterSpacing:.4,marginBottom:8}}>Click ✦ AI Generate Plan for an evidence-based treatment plan and action checklist</div>}
                  <MDMPlanEntry treatmentPlan={treatmentPlan} setTreatmentPlan={setTreatmentPlan} actionPlan={actionPlan} setActionPlan={setActionPlan}/>
                </div>

                <GuidelineAssist workingDx={mdmResult?.working_diagnosis||""} mdmNarrative={mdmResult?.mdm_narrative||""}
                  onInsertSentence={text=>setMdmResult(prev=>({...prev,mdm_narrative:prev?.mdm_narrative?prev.mdm_narrative+"\n\n"+text:text}))}/>

                <div style={{marginTop:10}}>
                  <EMLevel mdmText={mdmResult?.mdm_narrative||""} hpi={effectiveHpi} labs={labs} imaging={imaging} ekg={ekg} newVitals={newVitals} consults={consults}/>
                </div>

                {mdmResult.mdm_level&&(
                  <details style={{marginTop:10}}>
                    <summary style={{cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:"var(--qn-txt4)",letterSpacing:1,textTransform:"uppercase",listStyle:"none"}}>▶ Why {mdmResult.mdm_level} complexity?</summary>
                    <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:"rgba(14,37,68,.5)",border:"1px solid rgba(42,79,122,.3)"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                        {[{label:"Problem Complexity",value:mdmResult.problem_complexity,color:"var(--qn-teal)"},{label:"Data Complexity",value:mdmResult.data_complexity,color:"var(--qn-blue)"},{label:"Risk Level",value:mdmResult.risk_tier,color:"var(--qn-gold)"}].map(({label,value,color})=>(
                          <div key={label}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"var(--qn-txt4)",letterSpacing:.8,textTransform:"uppercase",marginBottom:4}}>{label}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color,lineHeight:1.4}}>{value||"—"}</div></div>
                        ))}
                      </div>
                      {mdmResult.risk_rationale&&<div style={{marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",lineHeight:1.6,paddingTop:8,borderTop:"1px solid rgba(42,79,122,.25)"}}>{mdmResult.risk_rationale}</div>}
                    </div>
                  </details>
                )}

                {workupRationale&&(
                  <div className="qn-fade" style={{marginTop:10,padding:"12px 14px",borderRadius:10,background:"rgba(245,200,66,.05)",border:"1px solid rgba(245,200,66,.3)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:"var(--qn-gold)",letterSpacing:1,textTransform:"uppercase",flex:1}}>Workup Rationale</span>
                      <button onClick={()=>{navigator.clipboard.writeText(workupRationale).then(()=>{setCopiedWorkup(true);setTimeout(()=>setCopiedWorkup(false),2000);});}} style={{padding:"2px 9px",borderRadius:5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:`1px solid ${copiedWorkup?"rgba(61,255,160,.5)":"rgba(245,200,66,.4)"}`,background:copiedWorkup?"rgba(61,255,160,.1)":"transparent",color:copiedWorkup?"var(--qn-green)":"var(--qn-gold)"}}>
                        {copiedWorkup?"✓ Copied":"Copy"}
                      </button>
                    </div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt2)",lineHeight:1.75}}>{workupRationale}</div>
                  </div>
                )}

                {mdmHistory.length>1&&(
                  <div style={{marginTop:10}}>
                    <button onClick={()=>setShowMdmHistory(p=>!p)} style={{padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:`1px solid ${showMdmHistory?"rgba(155,109,255,.5)":"rgba(42,79,122,.35)"}`,background:showMdmHistory?"rgba(155,109,255,.08)":"transparent",color:showMdmHistory?"var(--qn-purple)":"var(--qn-txt4)"}}>
                      {showMdmHistory?"▲":"▼"} Clinical Progression ({mdmHistory.length} entries)
                    </button>
                    {showMdmHistory&&(
                      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
                        {mdmHistory.map((h,i)=>(
                          <div key={i} style={{padding:"9px 12px",borderRadius:8,background:i===mdmHistory.length-1?"rgba(155,109,255,.07)":"rgba(14,37,68,.4)",border:`1px solid ${i===mdmHistory.length-1?"rgba(155,109,255,.3)":"rgba(42,79,122,.25)"}`}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:i===mdmHistory.length-1?"var(--qn-purple)":"var(--qn-txt4)",letterSpacing:.8,textTransform:"uppercase"}}>{h.trigger}</span>
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)"}}>{h.ts}</span>
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-gold)",background:"rgba(245,200,66,.1)",border:"1px solid rgba(245,200,66,.25)",borderRadius:3,padding:"1px 5px"}}>{h.mdm_level}</span>
                              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",flex:1}}>{h.working_diagnosis}</span>
                            </div>
                            {h.mdm_narrative&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt3)",lineHeight:1.5}}>{h.mdm_narrative.slice(0,200)}{h.mdm_narrative.length>200?"…":""}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              {/* Clinical calcs — below Initial Impression */}
              <ClinicalCalcsCard cc={cc} workingDx={mdmResult?.working_diagnosis||""} labs={labs} imaging={imaging}
                onAddToMDM={text=>setMdmResult(prev=>({...prev,mdm_narrative:prev?.mdm_narrative?prev.mdm_narrative+"\n\n"+text:text}))}/>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PHASE 2 — RESULTS INPUT
          ══════════════════════════════════════════════════════════════════ */}
          {p2Open && (
            <>
              <PhaseDivider phase="Phase 2" label="Results & Reevaluation" color="var(--qn-gold)" sublabel="Labs · Imaging · EKG · Recheck Vitals"/>

              <Phase2Panel
                labs={labs} setLabs={handleLabsChange} imaging={imaging} setImaging={handleImagingChange}
                ekg={ekg} setEkg={setEkg} newVitals={newVitals} setNewVitals={setNewVitals}
                p2Busy={p2Busy} p1Busy={p1Busy} p2Error={p2Error}
                phase2Ready={phase2Ready} mdmResult={mdmResult} dispResult={dispResult}
                dispColor={dispColor} setRef={setRef} makeKeyDown={makeKeyDown}
                runDisposition={runDisposition} consults={consults} setConsults={setConsults}
                onConsultsChange={(next)=>setConsultList(next)}
                criticalFlags={criticalFlags} ekgBusy={ekgBusy} onEkgInterpret={interpretEKG}
                labRecs={labRecs} labRecsBusy={labRecsBusy} generateLabRecs={generateLabRecs}
                imagingRecs={imagingRecs} imagingRecsBusy={imagingRecsBusy} generateImagingRecs={generateImagingRecs}
                patientId={demo?.mrn||demo?.patient_identifier||""}
              />

              {/* Abnormals flag panel */}
              {(labs||imaging||ekg)&&(
                <QuickNoteAbnormals labs={labs} imaging={imaging} ekg={ekg}
                  onAddToMDM={text=>setMdmResult(prev=>({...prev,mdm_narrative:prev?.mdm_narrative?prev.mdm_narrative+"\n\n"+text:text}))}/>
              )}

              {/* Patient Response to Treatment */}
              <SectionCard accent="rgba(42,79,122,.3)">
                <PatientResponsePanel
                  patientResponse={patientResponse} setPatientResponse={setPatientResponse}
                  cc={cc} hpi={effectiveHpi} working_diagnosis={mdmResult?.working_diagnosis||""}
                  mdmResult={mdmResult?.mdm_narrative||""} mdmTimestamp={mdmTimestamp}
                  labs={labs} imaging={imaging} ekg={ekg} newVitals={newVitals} consults={consults}
                  onAddendumReady={handleAddendumReady}
                />
              </SectionCard>

              {/* ── PHASE 2 ACTION: Generate Final Disposition ── */}
              {!dispResult && (
                <div style={{marginBottom:16,padding:"16px 20px",borderRadius:14,background:"rgba(245,200,66,.04)",border:"1px solid rgba(245,200,66,.3)",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}} className="no-print">
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"var(--qn-gold)",marginBottom:3}}>Ready to Generate Final Disposition</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:.4}}>
                      {[labs.trim()&&"Labs ✓",imaging.trim()&&"Imaging ✓",ekg.trim()&&"EKG ✓",newVitals.trim()&&"Recheck Vitals ✓",patientResponse.trim()&&"Patient Response ✓"].filter(Boolean).join("  ·  ")||"Add labs, imaging, or recheck vitals above"}
                    </div>
                  </div>
                  <button
                    onClick={runDisposition}
                    disabled={p2Busy || !phase2Ready}
                    style={{padding:"12px 28px",borderRadius:10,cursor:(p2Busy||!phase2Ready)?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700,letterSpacing:.3,transition:"all .15s",flexShrink:0,
                      border:`2px solid ${p2Busy?"rgba(42,79,122,.3)":!phase2Ready?"rgba(42,79,122,.3)":"rgba(245,200,66,.7)"}`,
                      background:p2Busy?"rgba(14,37,68,.4)":!phase2Ready?"rgba(14,37,68,.3)":"rgba(245,200,66,.12)",
                      color:p2Busy?"var(--qn-txt4)":!phase2Ready?"rgba(107,158,200,.4)":"var(--qn-gold)",
                      boxShadow:(!p2Busy&&phase2Ready)?"0 0 20px rgba(245,200,66,.08)":"none"}}>
                    {p2Busy?"● Generating…":"✦ Generate Final Disposition"}
                  </button>
                  {p2Error&&<div style={{width:"100%",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--qn-coral)",padding:"6px 10px",borderRadius:6,background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.3)"}}>{p2Error}</div>}
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PHASE 2 OUTPUT — Results Analysis + Final Impression + Disposition
          ══════════════════════════════════════════════════════════════════ */}
          {(labSummaryResult || imagingAnalysisResult || finalImpressionResult || dispResult) && (
            <PhaseDivider phase="Phase 2 Output" label="Results Analysis & Disposition" color="var(--qn-gold)"/>
          )}

          {/* Lab Summary */}
          {(labSummaryLoading || labsAutoAnalyzing || labSummaryResult) && (
            <div style={{marginBottom:10}}>
              {(labSummaryLoading || labsAutoAnalyzing) && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,background:"rgba(0,229,192,.04)",border:"1px solid rgba(0,229,192,.15)"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#00b89a"}}>● ANALYZING LABS</span>
                </div>
              )}
              {labSummaryResult && !labsAutoAnalyzing && <LabSummaryDisplay result={labSummaryResult}/>}
            </div>
          )}

          {/* Imaging Analysis */}
          {(imagingAutoAnalyzing || imagingAnalysisResult) && (
            <div style={{marginBottom:10}}>
              {imagingAutoAnalyzing && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,background:"rgba(0,229,192,.04)",border:"1px solid rgba(0,229,192,.15)"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#00b89a"}}>● ANALYZING IMAGING</span>
                </div>
              )}
            </div>
          )}

          {/* Final Impression */}
          {(finalImpressionLoading || finalImpressionResult) && (
            <div style={{marginBottom:10}}>
              {finalImpressionLoading && <div style={{fontSize:12,color:"#00b89a",padding:"8px 0",fontFamily:"'JetBrains Mono',monospace"}}>Generating final impression…</div>}
              {finalImpressionResult && (
                <FinalImpressionDisplay
                  result={finalImpressionResult}
                  confirmedRanks={confirmedRanks} rejectedRanks={rejectedRanks}
                  onConfirm={handleConfirmDx} onReject={handleRejectDx} onReset={handleResetDx}
                />
              )}
            </div>
          )}

          {/* ED Medications */}
          <div style={{marginBottom:10}}>
            {p2Open && (
              <div style={{marginBottom:8}} className="no-print">
                <button onClick={generateEDMedications} disabled={edMedsLoading} style={{padding:"8px 18px",borderRadius:6,cursor:edMedsLoading?"not-allowed":"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",border:"1px solid rgba(0,184,154,0.35)",background:"rgba(0,184,154,0.08)",color:"#00b89a",opacity:edMedsLoading?0.5:1}}>
                  {edMedsLoading?"Generating…":"💊 Generate ED Medications"}
                </button>
              </div>
            )}
            {edMedsLoading&&<div style={{fontSize:12,color:"#00b89a",padding:"6px 0",fontFamily:"'JetBrains Mono',monospace"}}>Analyzing patient profile…</div>}
            {edMedsResult&&<EDMedicationsDisplay result={edMedsResult} onCopy={copyEDMedications} copied={copiedEdMeds}/>}
          </div>

          {/* Disposition */}
          {dispResult && (
            <SectionCard accent={`${dispColor(dispResult.disposition)}30`}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:dispColor(dispResult.disposition)}}>Final Impression & Disposition</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:dispColor(dispResult.disposition),letterSpacing:.5,background:`${dispColor(dispResult.disposition)}18`,border:`1px solid ${dispColor(dispResult.disposition)}40`,borderRadius:4,padding:"2px 7px"}}>Post-Results</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:1,textTransform:"uppercase",background:"rgba(59,158,255,.1)",border:"1px solid rgba(59,158,255,.2)",borderRadius:4,padding:"2px 7px"}}>ACEP Guidelines</span>
              </div>
              <DispositionResult result={dispResult} copiedDisch={copiedDisch} setCopiedDisch={setCopiedDisch}
                onDiagExplanationEdit={text=>setDispResult(prev=>({...prev,discharge_instructions:{...(prev.discharge_instructions||{}),diagnosis_explanation:text}}))}/>
              <DispositionCriteriaBuilder disposition={dispResult.disposition}
                onAddToNote={text=>setDispResult(prev=>({...prev,disposition_rationale:(prev.disposition_rationale?prev.disposition_rationale+" ":"")+text}))}/>
              {dispResult?.discharge_instructions?.diagnosis_explanation&&dispResult?.disposition&&!dispResult.disposition.toLowerCase().includes("admit")&&!dispResult.disposition.toLowerCase().includes("icu")&&(
                <div style={{marginTop:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <button onClick={copyDischargeInstructions} style={{padding:"7px 16px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,border:`1px solid ${copiedDischargeOnly?"rgba(61,255,160,.5)":"rgba(61,255,160,.35)"}`,background:copiedDischargeOnly?"rgba(61,255,160,.15)":"rgba(61,255,160,.07)",color:"var(--qn-green)"}}>
                    {copiedDischargeOnly?"✓ Copied":"🖨 Copy Discharge Instructions"}
                  </button>
                  <button onClick={()=>{const dx=encodeURIComponent(dispResult?.final_diagnosis||mdmResult?.working_diagnosis||"");window.open(`/DischargeRxCard${dx?"?dx="+dx:""}`, "_blank");}} style={{padding:"7px 16px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,border:"1px solid rgba(245,200,66,.4)",background:"rgba(245,200,66,.07)",color:"var(--qn-gold)"}}>
                    💊 Open Rx Card
                  </button>
                </div>
              )}
            </SectionCard>
          )}

          {/* ICD Coding + Interventions */}
          {dispResult && (
            <>
              <DiagnosisCodingCard
                finalDiagnosis={dispResult.final_diagnosis||mdmResult?.working_diagnosis||""} suggestions={icdSuggestions} selected={icdSelected}
                searching={icdSearching} error={icdError}
                onSearch={()=>searchICD10(dispResult.final_diagnosis||mdmResult?.working_diagnosis||cc)}
                onSelect={code=>setIcdSelected(prev=>prev.find(c=>c.code===code.code)?prev:[...prev,code])}
                onRemove={code=>setIcdSelected(prev=>prev.filter(c=>c.code!==code))}
              />
              <InterventionsCard items={interventions} loading={intLoading} generated={intGenerated}
                onGenerate={generateInterventions}
                onToggle={id=>setInterventions(prev=>prev.map(i=>i.id===id?{...i,confirmed:!i.confirmed}:i))}
                onUpdate={(id,field,value)=>setInterventions(prev=>prev.map(i=>i.id===id?{...i,[field]:value}:i))}
                onAdd={item=>setInterventions(prev=>[...prev,{...item,id:`int-manual-${Date.now()}`,confirmed:true}])}
                onRemove={id=>setInterventions(prev=>prev.filter(i=>i.id!==id))}
              />
            </>
          )}

          {/* SDM / Attestation / Nursing Handoff */}
          {dispResult && (
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}} className="no-print">
                {[
                  {key:"sdm",label:"Shared Decision Making",active:showSDM,setActive:setShowSDM,c:"rgba(59,158,255"},
                  {key:"att",label:"Physician Attestation",active:showAttestation,setActive:setShowAttestation,c:"rgba(155,109,255"},
                  {key:"nur",label:"Nursing Handoff",active:showNursingHandoff,setActive:setShowNursingHandoff,c:"rgba(61,255,160"},
                ].map(({key,label,active,setActive,c})=>(
                  <button key={key} onClick={()=>setActive(s=>!s)} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:`1px solid ${active?c+",.5)":"rgba(42,79,122,.4)"}`,background:active?c+",.1)":"transparent",color:active?c+",1)":"var(--qn-txt4)",letterSpacing:.5}}>
                    {active?"▲":"▼"} {label}
                  </button>
                ))}
                <button onClick={generateSignOut} disabled={signOutBusy} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,border:`1px solid ${signOutDone?"rgba(61,255,160,.5)":signOutBusy?"rgba(42,79,122,.3)":"rgba(245,200,66,.4)"}`,background:signOutDone?"rgba(61,255,160,.1)":signOutBusy?"rgba(14,37,68,.4)":"rgba(245,200,66,.07)",color:signOutDone?"var(--qn-green)":signOutBusy?"var(--qn-txt4)":"var(--qn-gold)"}}>
                  {signOutDone?"✓ Sent":signOutBusy?"● Generating…":"→ Generate Sign-Out"}
                </button>
              </div>
              {showSDM&&<SDMBlock disposition={dispResult.disposition} patientName={[demo?.firstName,demo?.lastName].filter(Boolean).join(" ")}/>}
              {showAttestation&&<AttestationBlock providerName={providerInfo.name} credentials={providerInfo.credentials} facility={providerInfo.facility} mdmLevel={mdmResult?.mdm_level}/>}
              {showNursingHandoff&&<NursingHandoff patientName={[demo?.firstName,demo?.lastName].filter(Boolean).join(" ")} diagnosis={dispResult.final_diagnosis||mdmResult?.working_diagnosis||""} disposition={dispResult.disposition}/>}
            </div>
          )}

          {/* Timeline */}
          {phase1Ready && <TimelineCard timestamps={timestamps} setTimestamps={setTimestamps}/>}

          {/* Order Queue */}
          {showOrderQueue && (
            <div style={{marginBottom:14,background:"rgba(8,22,40,.5)",border:"1px solid rgba(245,158,11,.25)",borderRadius:14,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid rgba(245,158,11,.12)",cursor:"pointer",background:"rgba(245,158,11,.04)"}} onClick={()=>setShowOrderQueue(false)}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:"#f59e0b",letterSpacing:1,textTransform:"uppercase"}}>Order Queue</span>
                <div style={{flex:1}}/><span style={{color:"#f59e0b",fontSize:10}}>▲</span>
              </div>
              <div style={{padding:"12px 14px"}}>
                <StagedOrderQueue embedded={true} onPhasesChange={(updatedPhases)=>setOrderPhases(updatedPhases)}/>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              EHR EXPORT — Action bar + Note Export
          ══════════════════════════════════════════════════════════════════ */}
          {hasAnyResult && (
            <PhaseDivider phase="Export" label="EHR Documentation" color="var(--qn-blue)" sublabel="Copy · Save · Send"/>
          )}

          {/* Anamnesis shortcut */}
          <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}} className="no-print">
            <button onClick={()=>{window.location.href="/anamnesis";}} style={{padding:"6px 14px",borderRadius:8,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:.5,border:"1px solid rgba(0,229,192,.35)",background:"rgba(0,229,192,.07)",color:"var(--qn-teal)",display:"flex",alignItems:"center",gap:6}}>⬡ Open Anamnesis Hub</button>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:.3}}>Retrieve full patient history via Carequality · CommonWell · TEFCA</span>
          </div>

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
              onProcedureNote={()=>setShowProcedureModal(true)}
            />
          )}

          <HighAlertMedAlert medsRaw={medsRaw}/>
          {showKbHelp&&<KbHelpModal onClose={()=>setShowKbHelp(false)}/>}
          {showProcedureModal&&<ProcedureNoteModal onInsert={()=>{}} onClose={()=>setShowProcedureModal(false)}/>}

          <NoteExportPanel
            chiefComplaint={cc} hpi={effectiveHpi} ros={ros} physicalExam={exam}
            assessment={mdmResult?.working_diagnosis||""} plan={dispResult?.disposition||""}
            mdmText={mdmResult?.mdm_narrative||""} consults={consultList} phases={orderPhases}
            onPopulateMDM={(text)=>setMdmResult(prev=>prev?{...prev,mdm_narrative:text}:prev)}
            onPopulatePlan={(text)=>setDispResult(prev=>prev?{...prev,disposition:text}:prev)}
          />

          {!embedded && (
            <div style={{textAlign:"center",padding:"24px 0 8px",fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:1.5}} className="no-print">
              LAKONYX QUICKNOTE v14.0 · CC-DRIVEN · AMA/CMS 2023 E&M · ACEP CLINICAL POLICY ALIGNED ·
              AI OUTPUT REQUIRES PHYSICIAN REVIEW BEFORE CHARTING
            </div>
          )}
        </div>
      </div>
    </div>
  );
}