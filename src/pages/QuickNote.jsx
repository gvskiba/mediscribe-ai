// QuickNote.jsx  v10
// Two-phase ED documentation: Phase 1 -> MDM | Phase 2 -> Reevaluation, Plan, Disposition, Discharge Rx
// Grounded in AMA/CMS 2023 E&M MDM table + ACEP Clinical Policy guidelines

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
import {
  MDM_SCHEMA, DISP_SCHEMA,
  buildMDMPrompt, buildDispPrompt, buildMDMBlock,
  buildFullNote, buildPhase1Copy, buildPhase2Copy,
} from "./QuickNotePrompts";

injectQNStyles();

injectQNStyles();

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function QuickNote({ embedded = false, demo, vitals: initVitals, cc: initCC }) {
  // Phase 1 inputs
  const [cc,     setCC]     = useState(initCC?.text || "");
  const [vitals, setVitals] = useState(() => {
    if (!initVitals) return "";
    const parts = [
      initVitals.hr   ? `HR ${initVitals.hr}`      : null,
      initVitals.bp   ? `BP ${initVitals.bp}`      : null,
      initVitals.rr   ? `RR ${initVitals.rr}`      : null,
      initVitals.spo2 ? `SpO2 ${initVitals.spo2}%` : null,
      initVitals.temp ? `T ${initVitals.temp}`      : null,
    ].filter(Boolean);
    return parts.join("  ");
  });
  const [hpi,    setHpi]    = useState("");
  const [ros,    setRos]    = useState("");
  const [exam,   setExam]   = useState("");

  // Phase 2 inputs
  const [labs,       setLabs]       = useState("");
  const [imaging,    setImaging]    = useState("");
  const [ekg,        setEkg]        = useState("");
  const [newVitals,  setNewVitals]  = useState("");
  const [formatMode, setFormatMode] = useState("plain");
  const [encounterType, setEncounterType] = useState("adult");

  // ── Multi-patient session slots ────────────────────────────────────────────
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
  const slotRef = useRef(activeSlot);
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
    const cur = slotStateRef.current;
    saveCurrentToSlot(activeSlot, cur);
    setSlots(prev => {
      const slot = prev[idx] || EMPTY_SLOT();
      setCC(slot.cc || ""); setVitals(slot.vitals || ""); setHpi(slot.hpi || "");
      setRos(slot.ros || ""); setExam(slot.exam || "");
      setLabs(slot.labs || ""); setImaging(slot.imaging || "");
      setEkg(slot.ekg || ""); setNewVitals(slot.newVitals || "");
      setMedsRaw(slot.medsRaw || ""); setAllergiesRaw(slot.allergiesRaw || "");
      setParsedMeds(slot.parsedMeds || []); setParsedAllergies(slot.parsedAllergies || []);
      setMdmResult(slot.mdmResult || null); setDispResult(slot.dispResult || null);
      setIcdSelected(slot.icdSelected || []); setIcdSuggestions([]);
      setInterventions(slot.interventions || []);
      setHpiSummary(slot.hpiSummary || null); setHpiMode(slot.hpiMode || "original");
      setEncounterType(slot.encounterType || "adult"); setP2Open(slot.p2Open || false);
      setP1Error(null); setP2Error(null);
      return prev;
    });
    setActiveSlot(idx); slotRef.current = idx;
  }, [activeSlot, saveCurrentToSlot]);

  // AI results
  const [mdmResult,  setMdmResult]  = useState(null);
  const [dispResult, setDispResult] = useState(null);

  // UI state
  const [p1Busy,   setP1Busy]   = useState(false);
  const [p2Busy,   setP2Busy]   = useState(false);
  const [p1Error,  setP1Error]  = useState(null);
  const [p2Error,  setP2Error]  = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [p2Open,   setP2Open]   = useState(false);
  const [copiedMDM,     setCopiedMDM]     = useState(false);
  const [copiedDisch,   setCopiedDisch]   = useState(false);
  const [copiedMDMFull, setCopiedMDMFull] = useState(false);
  const [savedNote,     setSavedNote]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [sentToNPI,     setSentToNPI]     = useState(false);
  const [sendingNPI,    setSendingNPI]    = useState(false);
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
  // Medications & allergies
  const [medsRaw,         setMedsRaw]         = useState("");
  const [allergiesRaw,    setAllergiesRaw]    = useState("");
  const [parsedMeds,      setParsedMeds]      = useState([]);
  const [parsedAllergies, setParsedAllergies] = useState([]);
  const [medsParsing,     setMedsParsing]     = useState(false);
  const [medsError,       setMedsError]       = useState(null);
  // Quick DDx
  const [quickDDx,          setQuickDDx]          = useState(null);
  const [quickDDxBusy,      setQuickDDxBusy]      = useState(false);
  const [quickDDxErr,       setQuickDDxErr]       = useState(null);
  const [quickDDxDismissed, setQuickDDxDismissed] = useState(false);
  // HPI summary
  const [hpiSummary,    setHpiSummary]    = useState(null);
  const [hpiSumBusy,    setHpiSumBusy]    = useState(false);
  const [hpiSumError,   setHpiSumError]   = useState(null);
  const [copiedHpiSum,  setCopiedHpiSum]  = useState(false);
  const [hpiMode,       setHpiMode]       = useState("original");
  // ICD-10
  const [icdSuggestions, setIcdSuggestions] = useState([]);
  const [icdSelected,    setIcdSelected]    = useState([]);
  const [icdSearching,   setIcdSearching]   = useState(false);
  const [icdError,       setIcdError]       = useState(null);
  // Interventions
  const [interventions, setInterventions] = useState([]);
  const [intLoading,    setIntLoading]    = useState(false);
  const [intGenerated,  setIntGenerated]  = useState(false);
  // Copy state
  const [copiedP1,     setCopiedP1]     = useState(false);
  const [copiedP2,     setCopiedP2]     = useState(false);
  const [copiedInputs, setCopiedInputs] = useState(false);

  const effectiveHpi = hpiMode === "summary" && hpiSummary ? hpiSummary : hpi;
  const phase1Ready  = Boolean(cc.trim() || hpi.trim() || exam.trim());
  const phase2Ready  = Boolean(mdmResult && (labs.trim() || imaging.trim() || newVitals.trim()));
  const hasAnyResult = Boolean(mdmResult || dispResult);

  const fieldRefs = useRef([]);
  const setRef    = useCallback((idx) => (ref) => { fieldRefs.current[idx] = ref; }, []);
  const advanceFocus = useCallback((idx) => { fieldRefs.current[idx + 1]?.current?.focus(); }, []);

  // ── Phase 1 — MDM ─────────────────────────────────────────────────────────
  const runMDM = useCallback(async () => {
    if (!phase1Ready || p1Busy) return;
    setP1Busy(true); setP1Error(null); setMdmResult(null); setDispResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc, vitals, hpi, ros, exam, vhAnalysis, parsedMeds, parsedAllergies, encounterType),
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res); setP2Open(true);
      setIcdSuggestions([]); setIcdSelected([]); setIcdError(null);
      setInterventions([]); setIntGenerated(false);
      setQuickDDxDismissed(true);
    } catch (e) {
      setP1Error("MDM generation failed: " + (e.message || "Check API connectivity"));
    } finally { setP1Busy(false); }
  }, [cc, vitals, hpi, ros, exam, phase1Ready, p1Busy, vhAnalysis, parsedMeds, parsedAllergies, encounterType]);

  // ── Phase 2 — Disposition ─────────────────────────────────────────────────
  const runDisposition = useCallback(async () => {
    if (!mdmResult || p2Busy) return;
    setP2Busy(true); setP2Error(null); setDispResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildDispPrompt(mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam, parsedMeds, parsedAllergies, ekg),
        response_json_schema: DISP_SCHEMA,
      });
      setDispResult(res); setIntGenerated(false); setIntLoading(false);
    } catch (e) {
      setP2Error("Disposition generation failed: " + (e.message || "Check API connectivity"));
    } finally { setP2Busy(false); }
  }, [mdmResult, labs, imaging, newVitals, cc, hpi, vitals, ros, exam, p2Busy, ekg, parsedMeds, parsedAllergies]);

  // ── Copy callbacks ─────────────────────────────────────────────────────────
  const copyNote = useCallback(() => {
    const text = buildFullNote(
      { cc, vitals, hpi: effectiveHpi, ros, exam }, mdmResult,
      { labs, imaging, newVitals }, dispResult,
      { icdSelected, interventions, parsedMeds, parsedAllergies }
    );
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }, [cc, vitals, effectiveHpi, ros, exam, mdmResult, labs, imaging, newVitals, dispResult, icdSelected, interventions, parsedMeds, parsedAllergies]);

  const copyClinicalInputs = useCallback(() => {
    const hpiLabel = hpiMode === "summary" && hpiSummary ? "HISTORY OF PRESENT ILLNESS (AI Summary)" : "HISTORY OF PRESENT ILLNESS";
    const sections = [
      { label:"CHIEF COMPLAINT",   text:cc },
      { label:"TRIAGE VITALS",     text:vitals },
      { label:hpiLabel,            text:effectiveHpi },
      { label:"REVIEW OF SYSTEMS", text:ros },
      { label:"PHYSICAL EXAM",     text:exam },
    ].filter(s => s.text?.trim());
    if (!sections.length) return;
    const block = sections.map(s => `${s.label}:\n${s.text.trim()}`).join("\n\n");
    navigator.clipboard.writeText(block).then(() => { setCopiedInputs(true); setTimeout(() => setCopiedInputs(false), 2500); });
  }, [cc, vitals, effectiveHpi, ros, exam, hpiMode, hpiSummary]);

  const copyPhase1 = useCallback(() => {
    if (!mdmResult) return;
    const prov = window._notryaProvider || {};
    const text = buildPhase1Copy(
      { cc, vitals, hpi: effectiveHpi, ros, exam }, mdmResult,
      { parsedMeds, parsedAllergies, hpiSummary, hpiMode,
        providerName: prov.full_name || demo?.full_name || "",
        sigBlock:     prov.sigBlock  || "",
        demographics: { ...(demo || {}), facility: prov.facility, location: prov.location } },
      formatMode
    );
    navigator.clipboard.writeText(text).then(() => { setCopiedP1(true); setTimeout(() => setCopiedP1(false), 3000); });
  }, [cc, vitals, effectiveHpi, ros, exam, mdmResult, parsedMeds, parsedAllergies, hpiSummary, hpiMode, demo, formatMode]);

  const copyPhase2 = useCallback(() => {
    if (!dispResult) return;
    const prov = window._notryaProvider || {};
    const text = buildPhase2Copy(
      { labs, imaging, ekg, newVitals }, dispResult,
      { icdSelected, interventions,
        providerName: prov.full_name || demo?.full_name || "",
        sigBlock:     prov.sigBlock  || "",
        demographics: { ...(demo || {}), facility: prov.facility } },
      formatMode
    );
    navigator.clipboard.writeText(text).then(() => { setCopiedP2(true); setTimeout(() => setCopiedP2(false), 3000); });
  }, [labs, imaging, ekg, newVitals, dispResult, icdSelected, interventions, demo, formatMode]);

  const copyDischargeInstructions = useCallback(() => {
    const di = dispResult?.discharge_instructions;
    if (!di) return;
    const lines = [];
    const demog = demo || {};
    const patName = [demog.firstName, demog.lastName].filter(Boolean).join(" ");
    if (patName) lines.push(`Patient: ${patName}`);
    lines.push("DISCHARGE INSTRUCTIONS");
    lines.push(`Date: ${new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })}`);
    lines.push("");
    if (di.diagnosis_explanation) { lines.push("YOUR DIAGNOSIS:"); lines.push(di.diagnosis_explanation); lines.push(""); }
    if (di.medications?.length) {
      lines.push("MEDICATIONS TO TAKE AT HOME:");
      di.medications.forEach(m => lines.push(`  • ${typeof m === "string" ? m : m.medication || m}`));
      lines.push("");
    }
    if (di.activity) { lines.push(`ACTIVITY: ${di.activity}`); lines.push(""); }
    if (di.diet)     { lines.push(`DIET: ${di.diet}`);         lines.push(""); }
    if (di.return_precautions?.length) {
      lines.push("RETURN TO THE EMERGENCY DEPARTMENT OR CALL 911 IF:");
      di.return_precautions.forEach((r, i) => lines.push(`  ${i+1}. ${typeof r === "string" ? r : r}`));
      lines.push("");
    }
    if (di.followup) { lines.push(`FOLLOW-UP: ${di.followup}`); lines.push(""); }
    lines.push("If you have questions, call your physician or return to the ED.");
    navigator.clipboard.writeText(lines.join("\n")).then(() => { setCopiedDisch(true); setTimeout(() => setCopiedDisch(false), 3000); });
  }, [dispResult, demo]);

  // ── AI helpers ─────────────────────────────────────────────────────────────
  const summarizeHPI = useCallback(async () => {
    if (!hpi.trim() || hpiSumBusy) return;
    setHpiSumBusy(true); setHpiSumError(null); setHpiSummary(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a board-certified emergency physician rewriting a nursing triage HPI note into a physician's clinical HPI paragraph.\n\nSTRICT ACCURACY RULES — NON-NEGOTIABLE:\n- Do NOT add, infer, or extrapolate any clinical detail not explicitly stated in the source text.\n- Do NOT assume or imply any vital sign, symptom, or finding not present in the source.\n- If a detail is ambiguous or unclear, preserve the original wording exactly.\n- If information is missing, omit that OPQRST element entirely.\n\nOUTPUT FORMAT:\n- Single paragraph, 3-5 sentences, past tense, third person\n- OPQRST structure where elements are present in the source\n- Suitable for direct EMR charting as physician HPI documentation\n- No headers, no bullet points, no preamble\n\nSOURCE HPI TEXT:\n${hpi}\n\nReturn a JSON object with a single field: { "summary": "<your HPI paragraph here>" }`,
        response_json_schema: { type:"object", required:["summary"], properties:{ summary:{ type:"string" } } },
      });
      const text = res?.summary?.trim() || "";
      if (!text) throw new Error("Empty response — please try again");
      setHpiSummary(text);
    } catch (e) { setHpiSumError("HPI summary failed: " + (e.message || "Check API connectivity")); }
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
        prompt: `You are a clinical pharmacist parsing a patient's medication and allergy list from raw text.\n\nMEDICATIONS RAW TEXT:\n${medsRaw || "(none provided)"}\n\nALLERGIES RAW TEXT:\n${allergiesRaw || "(none provided)"}\n\nExtract and standardize each medication into name (generic preferred), dose, route (PO/IV/SQ/IM/TOP/INH/SL), frequency (Daily/BID/TID/QID/QHS/PRN). Extract each allergy into allergen and reaction. Only include items actually present. Return empty arrays if none present. Respond ONLY in valid JSON, no markdown.`,
        response_json_schema: schema,
      });
      setParsedMeds(res?.medications || []); setParsedAllergies(res?.allergies || []);
    } catch (e) { setMedsError("Parse failed: " + (e.message || "try again")); }
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
        prompt: `You are a board-certified emergency physician generating a rapid differential diagnosis.\n\nChief Complaint: ${cc || "Not provided"}\nHPI: ${hpi || "Not provided"}\nVitals: ${vitals || "Not provided"}\n${ros ? "ROS: "+ros : ""}\n${exam ? "Physical Exam: "+exam : ""}\n${medsRaw ? "Medications: "+medsRaw : ""}\n\nGenerate 3-5 conditions. For each: diagnosis, probability (high|moderate|low), supporting_evidence (1 sentence from this case), against (1 sentence from this case or "No features against at this time"), must_not_miss (true only for immediately life-threatening diagnoses). Base reasoning ONLY on findings explicitly present. Respond ONLY in valid JSON, no markdown.`,
        response_json_schema: schema,
      });
      if (!res?.differential?.length) throw new Error("Empty response");
      setQuickDDx(res.differential);
    } catch (e) { setQuickDDxErr("Quick DDx failed: " + (e.message || "try again")); }
    finally { setQuickDDxBusy(false); }
  }, [quickDDxBusy, cc, hpi, vitals, ros, exam, medsRaw]);

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
        prompt: `You are a certified medical coder (CPC) specializing in Emergency Medicine ICD-10-CM coding.\n\nDIAGNOSIS TO CODE: ${diagnosisText}\nCLINICAL CONTEXT: ${cc || ""} ${mdmResult?.working_diagnosis || ""} ${dispResult?.final_diagnosis || ""}\n\nReturn 4-6 most clinically appropriate ICD-10-CM codes ordered from most likely primary to secondary. For each: code (exact ICD-10-CM), description (official short), type (primary|secondary|comorbidity|symptom), specificity_note (one sentence on whether more specific code may exist). Only suggest valid billable codes. Respond ONLY in valid JSON, no markdown fences.`,
        response_json_schema: schema,
      });
      setIcdSuggestions(res?.codes || []);
    } catch (e) { setIcdError("ICD-10 search failed: " + (e.message || "unknown error")); }
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
        prompt: `You are an ED physician generating a pre-populated interventions list for this encounter.\n\nCC: ${cc || "not provided"}\nWorking Dx: ${mdmResult?.working_diagnosis || "not provided"}\nCritical Actions: ${mdmResult?.critical_actions?.join("; ") || "none"}\nTreatment Recs: ${mdmResult?.treatment_recommendations?.map(t => t.intervention).join("; ") || "none"}\nLabs: ${labs || "not ordered"}\nImaging: ${imaging || "not ordered"}\nRecheck Vitals: ${newVitals || "not documented"}\nDisposition: ${dispResult?.disposition || "not yet determined"}\n\nGenerate likely interventions performed. type: medication|procedure|iv_access|monitoring|imaging|lab|other. Include dose_route for medications. Leave time_given as empty string. Pre-fill response if obvious from recheck vitals. confirmed: true. Only include interventions clearly supported by documentation. Respond ONLY in valid JSON, no markdown.`,
        response_json_schema: schema,
      });
      setInterventions((res?.interventions || []).map((item, i) => ({ ...item, id:`int-${i}-${Date.now()}` })));
      setIntGenerated(true);
    } catch (e) { console.error("Interventions generation failed:", e); }
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
        disposition_plan:dispResult?.disposition||"",
        provider_name:user?.full_name||user?.email||"",
        patient_identifier:demo?.mrn||"", patient_id:demo?.mrn||"",
        status:"finalized", flag_reviewed:false, patient_active:true,
        result_flags_json:dispResult?.result_flags?.length ? JSON.stringify(dispResult.result_flags) : "",
        icd_codes_json:icdSelected.length ? JSON.stringify(icdSelected) : "",
        meds_raw:medsRaw||"", allergies_raw:allergiesRaw||"",
      });
      setSavedNote(true); setTimeout(() => setSavedNote(false), 3000);
      if (draftId) { base44.entities.ClinicalNote.update(draftId, { status:"superseded" }).catch(() => null); setDraftId(null); }
    } catch (e) { console.error("Save failed:", e); }
    finally { setSaving(false); }
  }, [saving, hasAnyResult, cc, vitals, hpi, ros, exam, labs, imaging, newVitals, mdmResult, dispResult, demo, icdSelected, interventions, parsedMeds, parsedAllergies, medsRaw, allergiesRaw, draftId]);

  const sendToNPI = useCallback(async () => {
    if (sendingNPI) return;
    setSendingNPI(true);
    try {
      const prior = await base44.entities.ClinicalNote.list({ sort:"-created_date", limit:5 }).catch(() => []);
      await Promise.all((prior||[]).filter(r => r.source==="QN-Handoff"&&r.status==="pending")
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

  // ── New encounter handler ──────────────────────────────────────────────────
  const handleNewEncounter = useCallback(() => {
    const snap = { cc, vitals, hpi, ros, exam, labs, imaging, ekg, newVitals,
      parsedMeds, parsedAllergies, mdmResult, dispResult };
    setUndoData(snap);
    setCC(""); setVitals(""); setHpi(""); setRos(""); setExam("");
    setLabs(""); setImaging(""); setEkg(""); setNewVitals("");
    setParsedMeds([]); setParsedAllergies([]);
    setMdmResult(null); setDispResult(null);
    setP1Error(null); setP2Error(null); setP2Open(false);
    setQuickDDxDismissed(false);
    setShowUndo(true);
    const t = setTimeout(() => { setShowUndo(false); setUndoData(null); }, 6000);
    setUndoTimer(t);
  }, [cc, vitals, hpi, ros, exam, labs, imaging, ekg, newVitals, parsedMeds, parsedAllergies, mdmResult, dispResult]);

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
    clearTimeout(undoTimer);
    setShowUndo(false); setUndoData(null);
  }, [undoData, undoTimer]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const makeKeyDown = useCallback((idx, isLast, onEnterSubmit) => (e) => {
    if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); if (!isLast) advanceFocus(idx); }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (onEnterSubmit) onEnterSubmit(); }
  }, [advanceFocus]);

  useEffect(() => {
    const fn = e => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = tag === "textarea" || tag === "input";
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        const active = document.activeElement;
        if (active?.dataset?.copySection) navigator.clipboard.writeText(active.dataset.copySection);
        else copyNote();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const activePhase = parseInt(document.activeElement?.dataset?.phase || "1");
        if (p2Open && activePhase === 2) runDisposition(); else runMDM();
        return;
      }
      if (e.altKey && !e.metaKey) {
        const jumpMap = { h:2, r:3, e:4, l:5 };
        const idx = jumpMap[e.key.toLowerCase()];
        if (idx !== undefined) { e.preventDefault(); fieldRefs.current[idx]?.current?.focus(); return; }
      }
      if (e.shiftKey && e.key === "?" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowKbHelp(h => !h); return; }
      if (e.shiftKey && e.key === "1" && !e.ctrlKey && !e.metaKey) { if (mdmResult) { e.preventDefault(); copyPhase1(); } return; }
      if (e.shiftKey && e.key === "2" && !e.ctrlKey && !e.metaKey) { if (dispResult) { e.preventDefault(); copyPhase2(); } return; }
      if (inInput) return;
      if ((e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey && mdmResult) {
        e.preventDefault(); window.dispatchEvent(new CustomEvent("qn-edit-narrative")); return;
      }
      if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey) {
        if (e.shiftKey) { e.preventDefault(); copyClinicalInputs(); return; }
        if (mdmResult || dispResult) { e.preventDefault(); copyNote(); }
      }
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey) { e.preventDefault(); window.print(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [p2Open, mdmResult, dispResult, runMDM, runDisposition, copyNote, copyClinicalInputs, copyPhase1, copyPhase2]);

  useEffect(() => { if (p2Open) setTimeout(() => { fieldRefs.current[5]?.current?.focus(); }, 80); }, [p2Open]);

  useEffect(() => {
    const saveDraft = async () => {
      if (!cc.trim() && !hpi.trim()) return;
      const payload = { source:"QuickNote", status:"draft", encounter_date:new Date().toISOString().split("T")[0],
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
            firstName:r.provider_name, lastName:r.credentials||"",
            facility:r.facility||"", location:r.location||"Emergency Department", sigBlock:r.signature_block||"" };
        }
        if (r.format_mode) setFormatMode(r.format_mode);
        if (r.default_encounter_type) setEncounterType(r.default_encounter_type);
      }
    }).catch(() => null);
    base44.entities.ClinicalNote.list({ sort:"-created_date", limit:10 }).then(results => {
      const all = results || [];
      const vhRec = all.find(r => r.source==="VH-Analysis"&&r.status==="pending");
      if (vhRec) {
        let flags = []; try { flags = JSON.parse(vhRec.ros_raw||"[]"); } catch {}
        setVhAnalysis({ trend_narrative:vhRec.full_note_text||"", vitals_summary:vhRec.hpi_raw||"",
          clinical_flags:Array.isArray(flags)?flags:[], raw_data:vhRec.working_diagnosis||"" });
        base44.entities.ClinicalNote.update(vhRec.id, { status:"imported" }).catch(() => null);
      }
      const nhRec = all.find(r => r.source==="NH-Resume"&&r.status==="pending");
      if (nhRec) {
        if (nhRec.cc) setCC(nhRec.cc); if (nhRec.hpi_raw) setHpi(nhRec.hpi_raw);
        if (nhRec.ros_raw) setRos(nhRec.ros_raw); if (nhRec.exam_raw) setExam(nhRec.exam_raw);
        if (nhRec.labs_raw) setLabs(nhRec.labs_raw); if (nhRec.imaging_raw) setImaging(nhRec.imaging_raw);
        if (nhRec.full_note_text && !nhRec.hpi_raw) setVitals(nhRec.full_note_text);
        setNhResumed(true);
        base44.entities.ClinicalNote.update(nhRec.id, { status:"imported" }).catch(() => null);
      }
      const addRec = all.find(r => r.source==="NH-Addendum"&&r.status==="pending");
      if (addRec) {
        setAddendumRef({ cc:addRec.cc||"", working_diagnosis:addRec.working_diagnosis||"",
          mdm_level:addRec.mdm_level||"", mdm_narrative:addRec.mdm_narrative||"",
          patient_identifier:addRec.patient_identifier||"", encounter_date:addRec.encounter_date||"" });
        setAddendumMode(true); setP2Open(true);
        base44.entities.ClinicalNote.update(addRec.id, { status:"imported" }).catch(() => null);
      }
    }).catch(() => null);
    base44.entities.ClinicalNote.list({ sort:"-created_date", limit:5 }).then(results => {
      const draft = (results||[]).find(r => r.status==="draft"&&r.source==="QuickNote");
      if (draft) { const age = Date.now()-new Date(draft.created_date||0).getTime(); if (age<8*3600000) setDraftId(draft.id); }
    }).catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    slotStateRef.current = { cc, vitals, hpi, ros, exam, labs, imaging, ekg, newVitals,
      medsRaw, allergiesRaw, parsedMeds, parsedAllergies,
      mdmResult, dispResult, icdSelected, interventions, hpiSummary, hpiMode, encounterType, p2Open };
  });

  const isFatigueRisk = useMemo(() => { const h = new Date().getHours(); return h >= 17 || h <= 7; }, []);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : "var(--qn-bg)",
      minHeight: embedded ? "auto" : "100vh", color:"var(--qn-txt)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding: embedded ? "0" : "0 16px 40px" }}>

        {/* Standalone header */}
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
              fontSize:"clamp(22px,4vw,38px)", fontWeight:900, letterSpacing:-.5, lineHeight:1.1, margin:"0 0 4px" }}>
              QuickNote
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt4)", margin:0 }}>
              Paste · Cmd+Enter generate MDM · Complete workup · Cmd+Enter disposition · C copy · Shift+C copy inputs · Ctrl+T template · Alt+H/R/E/L jump
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }} className="no-print">
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"var(--qn-teal)" }}>QuickNote</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)",
              letterSpacing:1.5, textTransform:"uppercase", background:"rgba(0,229,192,.1)",
              border:"1px solid rgba(0,229,192,.25)", borderRadius:4, padding:"2px 7px" }}>
              MDM · Disposition · Discharge Rx · v10
            </span>
          </div>
        )}

        {/* Banners */}
        <PatientBanner demo={demo} />
        {isFatigueRisk && !fatigueDismissed && <FatigueBanner onDismiss={() => setFatigueDismissed(true)} />}
        <StepProgress phase1Done={Boolean(mdmResult)} phase2Done={Boolean(dispResult)} p2Open={p2Open} />

        {/* Multi-patient slot bar */}
        {!embedded && (
          <div style={{ display:"flex", gap:5, marginBottom:10, padding:"6px 10px", borderRadius:10,
            background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}>
            {slots.map((slot, i) => {
              const isActive = i === activeSlot;
              const hasData = !!(slot.cc || slot.hpi || slot.mdmResult);
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
            <button onClick={() => setShowKbHelp(h => !h)} title="Keyboard shortcuts (Shift+?)"
              style={{ padding:"4px 9px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
                border:"1px solid rgba(42,79,122,.4)", background:"transparent", color:"var(--qn-txt4)" }}>?</button>
          </div>
        )}

        {showUndo && <UndoToast onUndo={handleUndo} onDismiss={() => { clearTimeout(undoTimer); setShowUndo(false); setUndoData(null); }} />}
        {nhResumed && !nhResumeDismissed && <NhResumeBanner onDismiss={() => setNhResumeDismissed(true)} />}
        {vhImported && !vhDismissed && <VhImportBanner onDismiss={() => setVhDismissed(true)} />}
        <VhAnalysisCard vhAnalysis={vhAnalysis && !vhAnalysisDismissed ? vhAnalysis : null} onDismiss={() => setVhAnalysisDismissed(true)} />
        {addendumMode && <AddendumBanner addendumRef={addendumRef} />}

        {/* Phase 1 panel */}
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
        />

        {/* MDM Result */}
        {mdmResult && (
          <div style={{ marginBottom:14, padding:"16px", background:"rgba(8,22,40,.5)",
            border:"1px solid rgba(0,229,192,.2)", borderRadius:14 }} className="print-body">
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"var(--qn-teal)" }}>Medical Decision Making</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)",
                letterSpacing:1, textTransform:"uppercase", background:"rgba(0,229,192,.1)",
                border:"1px solid rgba(0,229,192,.2)", borderRadius:4, padding:"2px 7px" }}>AMA/CMS 2023 · ACEP</span>
              <div style={{ flex:1 }} />
              <button onClick={() => {
                  navigator.clipboard.writeText(buildMDMBlock(mdmResult)).then(() => {
                    setCopiedMDMFull(true); setTimeout(() => setCopiedMDMFull(false), 2000);
                  });
                }}
                style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${copiedMDMFull?"rgba(61,255,160,.5)":"rgba(0,229,192,.35)"}`,
                  background:copiedMDMFull?"rgba(61,255,160,.1)":"rgba(0,229,192,.07)",
                  color:copiedMDMFull?"var(--qn-green)":"var(--qn-teal)", transition:"all .15s" }}>
                {copiedMDMFull ? "✓ MDM Copied" : "Copy MDM"}
              </button>
              <button onClick={() => { setMdmResult(null); setDispResult(null); setP2Open(false); }}
                style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:"1px solid rgba(245,200,66,.35)", background:"rgba(245,200,66,.07)",
                  color:"var(--qn-gold)", transition:"all .15s" }}>↩ Re-run MDM</button>
            </div>
            <MDMResult result={mdmResult} copiedMDM={copiedMDM} setCopiedMDM={setCopiedMDM}
              onNarrativeEdit={text => setMdmResult(prev => ({ ...prev, mdm_narrative:text }))} />
          </div>
        )}

        {/* Phase 2 panel */}
        {p2Open && (
          <Phase2Panel
            labs={labs} setLabs={setLabs} imaging={imaging} setImaging={setImaging}
            ekg={ekg} setEkg={setEkg} newVitals={newVitals} setNewVitals={setNewVitals}
            p2Busy={p2Busy} p1Busy={p1Busy} p2Error={p2Error}
            phase2Ready={phase2Ready} mdmResult={mdmResult} dispResult={dispResult}
            dispColor={dispColor}
            setRef={setRef} makeKeyDown={makeKeyDown} runDisposition={runDisposition}
          />
        )}

        {/* Disposition Result */}
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
              <div style={{ marginTop:8 }}>
                <button onClick={copyDischargeInstructions}
                  style={{ padding:"7px 16px", borderRadius:8, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:`1px solid ${copiedDisch?"rgba(61,255,160,.5)":"rgba(61,255,160,.35)"}`,
                    background:copiedDisch?"rgba(61,255,160,.15)":"rgba(61,255,160,.07)",
                    color:"var(--qn-green)", transition:"all .15s" }}>
                  {copiedDisch ? "✓ Patient Instructions Copied" : "🖨 Copy Patient Discharge Instructions"}
                </button>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", marginLeft:10, letterSpacing:.4 }}>
                  Patient-facing format — no clinical codes
                </span>
              </div>
            )}
          </div>
        )}

        {/* Clinical tools */}
        {mdmResult && (
          <ClinicalCalcsCard cc={cc} workingDx={mdmResult?.working_diagnosis||""}
            labs={labs} imaging={imaging}
            onAddToMDM={text => setMdmResult(prev => ({ ...prev,
              mdm_narrative:prev?.mdm_narrative ? prev.mdm_narrative+"\n\n"+text : text }))} />
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

        {/* Action bar */}
        {hasAnyResult && (
          <ActionBar
            mdmResult={mdmResult} dispResult={dispResult}
            copiedP1={copiedP1} copiedP2={copiedP2} copied={copied}
            savedNote={savedNote} saving={saving} sentToNPI={sentToNPI} sendingNPI={sendingNPI}
            formatMode={formatMode} setFormatMode={setFormatMode}
            copyPhase1={copyPhase1} copyPhase2={copyPhase2}
            copyNote={copyNote} saveNote={saveNote} sendToNPI={sendToNPI}
            onNewEncounter={handleNewEncounter}
          />
        )}

        {showKbHelp && <KbHelpModal onClose={() => setShowKbHelp(false)} />}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 8px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-txt4)", letterSpacing:1.5 }} className="no-print">
            NOTRYA QUICKNOTE v10 · AMA/CMS 2023 E&M · ACEP CLINICAL POLICY ALIGNED ·
            AI OUTPUT REQUIRES PHYSICIAN REVIEW BEFORE CHARTING
          </div>
        )}
      </div>
    </div>
  );
}