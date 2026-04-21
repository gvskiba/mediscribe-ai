import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useNPIState } from "@/components/npi/useNPIState";
import { NPI_CSS } from "@/components/npi/npiStyles";
import {
  NAV_DATA, GROUP_META, ALL_SECTIONS, SECTION_SHORTCUT, QUICK_ACTIONS,
  ROS_RAIL_SYSTEMS, PE_RAIL_SYSTEMS, BEERS_DRUGS, getCCRiskHints, buildDecisionDocPhrase,
  SEPSIS_BUNDLE_ITEMS, SIMPLE_HIDDEN,
} from "@/components/npi/npiData";

// ── Already-separate tab components ──────────────────────────────────────────
import DemoTab              from "@/components/npi/DemoTab";
import CCTab                from "@/components/npi/CCTab";
import VitalsTab            from "@/components/npi/VitalsTab";
import MedsTab              from "@/components/npi/MedsTab";
import ROSTab               from "@/components/npi/ROSTab";
import PETab                from "@/components/npi/PETab";
import AutoCoderTab         from "@/components/npi/AutoCoderTab";
import InlineHPITab         from "@/components/npi/InlineHPITab";
import ClinicalNoteStudio   from "@/components/npi/ClinicalNoteStudio";
import ReassessmentTab      from "@/components/npi/ReassessmentTab";
import ClinicalTimeline     from "@/components/npi/ClinicalTimeline";
import VitalSignsChart      from "@/components/npi/VitalSignsChart";
import OrdersPanel          from "@/components/npi/OrdersPanel";
import CDSAlertsSidebar     from "@/components/npi/CDSAlertsSidebar";

// ── Newly extracted tab components ───────────────────────────────────────────
import TriageTab                from "@/components/npi/TriageTab";
import SDOHWidget               from "@/components/npi/SDOHWidget";
import ConsultTab               from "@/components/npi/ConsultTab";
import DispositionTab           from "@/components/npi/DispositionTab";
import PatientSummaryTab        from "@/components/npi/PatientSummaryTab";
import HandoffTab               from "@/components/npi/HandoffTab";
import SmartDischargeHub         from "@/components/npi/SmartDischargeHub";
import MDMBuilderTab            from "@/components/npi/MDMBuilderTab";

// ── Utility / overlay components ─────────────────────────────────────────────
import ParseFab               from "@/components/npi/ParseFab";
import SystemProgressHeader   from "@/components/npi/SystemProgressHeader";
import TemplateSuggestionsBar from "@/components/npi/TemplateSuggestionsBar";
import NursingPanel           from "@/components/npi/NursingPanel";
import MediaAttachmentPanel   from "@/components/npi/MediaAttachmentPanel";
import SignCloseChecklist     from "@/components/npi/SignCloseChecklist";
import CommunicationLog       from "@/components/npi/CommunicationLog";
import FhirDataSync           from "@/components/npi/FhirDataSync";
import CCDASmartParse         from "@/components/npi/CCDASmartParse";
import ConnectivityIndicator  from "@/components/npi/ConnectivityIndicator";
import LabInterpreter         from "@/components/npi/LabInterpreter";

// ── Embedded page components ──────────────────────────────────────────────────
import EDProcedureNotes        from "@/pages/EDProcedureNotes";
import MedicationReferencePage from "@/pages/MedicationReference";
import ERPlanBuilder           from "@/pages/ERPlanBuilder";
import ResultsViewer           from "@/pages/ResultsViewer";
import ERxHub                  from "@/pages/ERx";
import ScoreHub                from "@/pages/ScoreHub";
import WeightDoseHub           from "@/pages/WeightDoseHub";
import ResusHub                from "@/pages/ResusHub";
import StrokeHub               from "@/pages/StrokeHub";
import ToxicologyHub           from "@/pages/ToxicologyHub";
import ImagingInterpreter      from "@/pages/ImagingInterpreter";

// ── FIX #6: Toast helper at module scope — passed into useNPIState so the
// hook can emit toasts without importing sonner directly (Base44 constraint).
// MDMBuilderTab also receives this as its onToast prop.
const _showToast = (msg, type = "success") => {
  if (type === "error")   toast.error(msg);
  else if (type === "warn") toast.warning ? toast.warning(msg) : toast(msg);
  else                    toast.success(msg);
};

// ── FIX #5: Onboarding flag at module scope — replaces sessionStorage usage
// (sessionStorage is prohibited in Base44). Resets each hard page reload, which
// is the same effective lifetime as sessionStorage for a SPA.
let _introDismissed = false;

// ── Shared style for top-bar RN / media attachment count badges ─────────────
const BADGE_STYLE = {
  position: "absolute", top: -5, right: -5,
  minWidth: 14, height: 14, borderRadius: 7,
  background: "var(--npi-teal)", color: "#050f1e",
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 8, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "0 3px", lineHeight: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
export default function NewPatientInput() {

  // ── FIX #6: pass toast callback so hook can emit toasts via sonner ─────────
  const {
    navigate, currentTab, activeGroup,
    navDots, selectGroup, selectSection, getGroupBadge,
    arrivalTimeRef, doorTime,
    demo, setDemo, cc, setCC,
    vitals, setVitals, vitalsHistory,
    medications, setMedications, allergies, setAllergies,
    pmhSelected, setPmhSelected, pmhExtra, setPmhExtra,
    surgHx, setSurgHx, famHx, setFamHx, socHx, setSocHx,
    rosState, setRosState, rosSymptoms, setRosSymptoms, setRosNotes,
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
    setReassessState, setClinicalTimeline,
    sepsisBundle, setSepsisBundle,
    pdmpState, setPdmpState,
    isarState, setIsarState,
    mdmState, setMdmState, mdmDataElements, setMdmDataElements,
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
  } = useNPIState(_showToast); // FIX #6

  // ── FIX #5: Onboarding — no sessionStorage ─────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(() => !_introDismissed);
  const dismissOnboarding = useCallback(() => {
    _introDismissed = true;
    setShowOnboarding(false);
  }, []);

  // ── Sign & Close checklist ──────────────────────────────────────────────────
  const [showSignChecklist,    setShowSignChecklist]    = useState(false);

  // ── Communication events log ────────────────────────────────────────────────
  const [communicationEvents,  setCommunicationEvents]  = useState([]);

  // ── Interoperability panels ─────────────────────────────────────────────────
  const [showFhirSync,         setShowFhirSync]         = useState(false);
  const [showCCDA,             setShowCCDA]             = useState(false);

  // ── renderContent ──────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (currentTab) {

      case "triage": return (
        <TriageTab
          esiLevel={esiLevel}   setEsiLevel={setEsiLevel}
          triage={triage}       setTriage={setTriage}
          avpu={avpu}           setAvpu={setAvpu}
          pain={pain}           setPain={setPain}
          patientAge={demo.age}
          isarState={isarState} setIsarState={setIsarState}
          onAdvance={() => selectSection("demo")}
        />
      );

      case "demo": return (
        <DemoTab
          demo={demo} setDemo={setDemo}
          parseText={parseText} setParseText={setParseText}
          parsing={parsing} onSmartParse={smartParse}
          esiLevel={esiLevel} setEsiLevel={setEsiLevel}
          registration={registration} setRegistration={setRegistration}
          onAdvance={() => selectSection("cc")}
        />
      );

      case "cc": return (
        <CCTab
          cc={cc} setCC={setCC}
          selectedCC={selectedCC} setSelectedCC={setSelectedCC}
          onAdvance={() => selectSection("vit")}
        />
      );

      // ── VitalsTab: now receives registration + demo for VitalsFhirPoll ──────
      case "vit": return (
        <VitalsTab
          vitals={vitals} setVitals={setVitals}
          avpu={avpu} setAvpu={setAvpu}
          o2del={o2del} setO2del={setO2del}
          pain={pain} setPain={setPain}
          triage={triage} setTriage={setTriage}
          registration={registration} demo={demo}
          onToast={_showToast}
          onAdvance={() => { addVitalsSnapshot("Triage"); selectSection("meds"); }}
        />
      );

      case "meds": return (
        <MedsTab
          medications={medications} setMedications={setMedications}
          allergies={allergies} setAllergies={setAllergies}
          pmhSelected={pmhSelected} setPmhSelected={setPmhSelected}
          pmhExtra={pmhExtra} setPmhExtra={setPmhExtra}
          surgHx={surgHx} setSurgHx={setSurgHx}
          famHx={famHx} setFamHx={setFamHx}
          socHx={socHx} setSocHx={setSocHx}
          pmhExpanded={pmhExpanded} setPmhExpanded={setPmhExpanded}
          patientAge={demo.age}
          pdmpState={pdmpState} setPdmpState={setPdmpState}
          onAdvance={() => selectSection("sdoh")}
        />
      );

      case "sdoh": return (
        <SDOHWidget sdoh={sdoh} setSdoh={setSdoh} patientSex={demo.sex} onAdvance={() => selectSection("summary")} />
      );

      case "summary": return (
        <PatientSummaryTab
          demo={demo} cc={cc} vitals={vitals} vitalsHistory={vitalsHistory}
          medications={medications} allergies={allergies}
          pmhSelected={pmhSelected} pmhExtra={pmhExtra}
          surgHx={surgHx} famHx={famHx} socHx={socHx}
          rosState={rosState} rosSymptoms={rosSymptoms}
          peState={peState} peFindings={peFindings}
          esiLevel={esiLevel} registration={registration}
          sdoh={sdoh} consults={consults} sepsisBundle={sepsisBundle}
          mdmState={mdmState} isarState={isarState} pdmpState={pdmpState}
          onAdvance={() => selectSection("hpi")}
        />
      );

      case "hpi": return (
        <InlineHPITab
          cc={cc} setCC={setCC}
          onAdvance={() => selectSection("ros")}
          patientAge={demo.age} patientSex={demo.sex}
          vitals={vitals} medications={medications}
          allergies={allergies} pmhSelected={pmhSelected}
        />
      );

      case "ros": return (
        <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
          <SystemProgressHeader systems={ROS_RAIL_SYSTEMS} activeIdx={rosActiveSystem} onSelect={setRosActiveSystem} getDot={getRosSysDot} />
          {appliedTemplate && !templateDismissed.ros && (
            <TemplateSuggestionsBar
              template={appliedTemplate} mode="ros"
              onDismiss={() => setTemplateDismissed(p => ({ ...p, ros:true }))}
              onJumpToSystem={idx => setRosActiveSystem(idx)}
            />
          )}
          <ROSTab
            onStateChange={setRosState} onSymptomsChange={setRosSymptoms} onNotesChange={setRosNotes}
            chiefComplaint={cc.text} onAdvance={() => selectSection("pe")}
            extSysIdx={rosActiveSystem} onSysChange={setRosActiveSystem}
          />
        </div>
      );

      case "pe": return (
        <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
          <SystemProgressHeader systems={PE_RAIL_SYSTEMS} activeIdx={peActiveSystem} onSelect={setPeActiveSystem} getDot={getPeSysDot} />
          {appliedTemplate && !templateDismissed.pe && (
            <TemplateSuggestionsBar
              template={appliedTemplate} mode="pe"
              onDismiss={() => setTemplateDismissed(p => ({ ...p, pe:true }))}
              onJumpToSystem={idx => setPeActiveSystem(idx)}
            />
          )}
          <PETab
            peState={peState} setPeState={setPeState}
            peFindings={peFindings} setPeFindings={setPeFindings}
            onAdvance={() => selectSection("chart")}
            extSysIdx={peActiveSystem} onSysChange={setPeActiveSystem}
            chiefComplaint={cc.text}
          />
        </div>
      );

      case "chart": return (
        <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden" }}>
          <ClinicalNoteStudio
            patientData={patientDataBundle} embedded={true}
            onBack={() => selectSection("pe")} onSave={handleSaveChart}
            onAdvance={() => selectSection("reassess")}
          />
        </div>
      );

      case "consult": return (
        <ConsultTab consults={consults} setConsults={setConsults} onAdvance={() => selectSection("chart")} />
      );

      case "reassess": return (
        <ReassessmentTab
          initialVitals={vitals}
          onStateChange={setReassessState}
          onVitalsSnapshot={v => addVitalsSnapshot(`Reassessment ${vitalsHistory.filter(e => e.label.startsWith("Reassessment")).length + 1}`, v)}
          onAdvance={() => selectSection("timeline")}
        />
      );

      case "sepsis": return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* ── qSOFA Live Score ──────────────────────────────────────────── */}
          {(() => {
            const sysBP      = parseFloat((vitals.bp||"").split("/")[0]) || 0;
            const rrVal      = parseFloat(vitals.rr||"0");
            const rrMet      = rrVal > 0 && rrVal >= 22;
            const bpMet      = sysBP > 0 && sysBP <= 100;
            const msMet      = Boolean(avpu && avpu !== "Alert");
            const score      = (rrMet?1:0) + (bpMet?1:0) + (msMet?1:0);
            const hasAnyData = vitals.rr || vitals.bp || avpu;
            const scoreCol   = score >= 2 ? "#ff6b6b" : score === 1 ? "#f5c842" : "var(--npi-teal)";
            return (
              <div style={{ padding:"13px 16px", borderRadius:11, background:"rgba(14,37,68,0.65)",
                border:`1px solid ${score >= 2 ? "rgba(255,107,107,0.3)" : "rgba(26,53,85,0.4)"}`,
                borderTop:`2px solid ${scoreCol}55` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:"var(--npi-txt)" }}>qSOFA Score</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:1 }}>
                      Sepsis-3 screening \u2014 \u22652 suggests high risk of poor outcomes in suspected infection
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:scoreCol, lineHeight:1 }}>{hasAnyData ? score : "\u2014"}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:scoreCol, letterSpacing:1, textTransform:"uppercase", marginTop:2 }}>
                      {!hasAnyData ? "no vitals" : score >= 2 ? "High Risk" : score === 1 ? "Borderline" : "Low Risk"}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {[
                    { label:"Respiratory Rate \u226522", met:rrMet, val:vitals.rr ? `${vitals.rr} breaths/min` : "\u2014", hint:"RR not entered" },
                    { label:"Systolic BP \u2264100",      met:bpMet, val:vitals.bp ? `${vitals.bp} mmHg`       : "\u2014", hint:"BP not entered"  },
                    { label:"Altered Mentation",         met:msMet, val:avpu      ? `AVPU: ${avpu}`           : "\u2014", hint:"AVPU not set"    },
                  ].map(({ label, met, val, hint }) => {
                    const hasVal = val !== "\u2014";
                    return (
                      <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px", borderRadius:8,
                        background: met ? "rgba(255,107,107,0.06)" : "rgba(8,22,40,0.4)",
                        border:`1px solid ${met ? "rgba(255,107,107,0.2)" : "rgba(26,53,85,0.3)"}` }}>
                        <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                          background: met ? "rgba(255,107,107,0.15)" : hasVal ? "rgba(0,229,192,0.12)" : "rgba(42,77,114,0.3)",
                          border:`1px solid ${met ? "rgba(255,107,107,0.4)" : hasVal ? "rgba(0,229,192,0.3)" : "rgba(42,77,114,0.4)"}` }}>
                          <span style={{ fontSize:9, fontWeight:700, color: met ? "#ff8a8a" : hasVal ? "var(--npi-teal)" : "var(--npi-txt4)" }}>
                            {met ? "\u2713" : hasVal ? "\u2717" : "?"}
                          </span>
                        </div>
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color: met ? "var(--npi-txt)" : "var(--npi-txt3)", flex:1 }}>{label}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color: met ? "#ff8a8a" : hasVal ? "var(--npi-teal)" : "var(--npi-txt4)" }}>
                          {hasVal ? val : hint}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {score >= 2 && (
                  <div style={{ marginTop:10, padding:"8px 11px", borderRadius:7, background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.25)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff8a8a", lineHeight:1.55 }}>
                    qSOFA \u22652 \u2014 initiate sepsis workup: blood cultures \u00d72, lactate, broad-spectrum antibiotics within 1 hour of recognition. Stamp bundle elements below.
                  </div>
                )}
                {!hasAnyData && (
                  <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1 }}>
                    Enter vitals and AVPU in the Vitals and Triage tabs to compute qSOFA score.
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Sepsis Bundle Timestamps (CMS SEP-1) ─────────────────────── */}
          {(() => {
            const now       = () => new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12:false });
            const allStamped = SEPSIS_BUNDLE_ITEMS.every(item => sepsisBundle[item.key]);
            const anyStamped = SEPSIS_BUNDLE_ITEMS.some(item => sepsisBundle[item.key]);
            return (
              <div style={{ padding:"16px 18px", borderRadius:12, background:"rgba(14,37,68,0.65)", border:"1px solid rgba(227,112,85,0.25)", borderTop:"2px solid rgba(227,112,85,0.55)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:16 }}>&#x1F9AB;</span>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:"var(--npi-txt)" }}>Sepsis Bundle Tracker</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:1 }}>CMS SEP-1 \u2014 stamp each element at time of completion</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {allStamped && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1, padding:"3px 9px", borderRadius:5, background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)", color:"var(--npi-teal)" }}>
                        \u2713 Bundle complete
                      </span>
                    )}
                    {anyStamped && (
                      <button onClick={() => setSepsisBundle({})}
                        style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1, textTransform:"uppercase", padding:"3px 8px", borderRadius:4, cursor:"pointer", border:"1px solid rgba(42,77,114,0.4)", background:"transparent", color:"var(--npi-txt4)" }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {SEPSIS_BUNDLE_ITEMS.map(item => {
                    const val     = sepsisBundle[item.key] || "";
                    const stamped = Boolean(val);
                    return (
                      <div key={item.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", borderRadius:9,
                        background: stamped ? "rgba(0,229,192,0.05)" : "rgba(8,22,40,0.45)",
                        border:`1px solid ${stamped ? "rgba(0,229,192,0.22)" : "rgba(26,53,85,0.4)"}` }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, background: stamped ? "var(--npi-teal)" : "rgba(42,77,114,0.5)", boxShadow: stamped ? "0 0 6px rgba(0,229,192,0.55)" : "none", transition:"all .2s" }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color: stamped ? "var(--npi-txt)" : "var(--npi-txt3)" }}>{item.label}</div>
                          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:1 }}>{item.hint}</div>
                        </div>
                        {stamped ? (
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"var(--npi-teal)", background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.22)", borderRadius:6, padding:"3px 10px", letterSpacing:.5 }}>{val}</span>
                            <button onClick={() => setSepsisBundle(p => ({ ...p, [item.key]:"" }))} style={{ background:"transparent", border:"none", color:"var(--npi-txt4)", cursor:"pointer", fontSize:11, padding:"2px 4px", lineHeight:1 }}>&#x2715;</button>
                          </div>
                        ) : (
                          <button onClick={() => setSepsisBundle(p => ({ ...p, [item.key]: now() }))}
                            style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1, textTransform:"uppercase", flexShrink:0, border:"1px solid rgba(0,229,192,0.35)", background:"rgba(0,229,192,0.07)", color:"var(--npi-teal)", whiteSpace:"nowrap" }}>
                            Stamp Now
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {anyStamped && (
                  <div style={{ marginTop:10, paddingTop:9, borderTop:"1px solid rgba(26,53,85,0.4)", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1, display:"flex", gap:14, flexWrap:"wrap" }}>
                    <span>{SEPSIS_BUNDLE_ITEMS.filter(i => sepsisBundle[i.key]).length} / {SEPSIS_BUNDLE_ITEMS.length} elements documented</span>
                    {sepsisBundle.lactateOrdered && sepsisBundle.abxOrdered && (() => {
                      const [lh,lm] = sepsisBundle.lactateOrdered.split(":").map(Number);
                      const [ah,am] = sepsisBundle.abxOrdered.split(":").map(Number);
                      const delta = (ah*60+am) - (lh*60+lm);
                      if (delta < 0 || delta > 720) return null;
                      return <span style={{ color: delta <= 180 ? "var(--npi-teal)" : "#ff8a8a" }}>Lactate \u2192 ABX: {delta}m{delta > 180 ? " \u26A0 >3h" : " \u2713"}</span>;
                    })()}
                    {sepsisBundle.lactateValue && sepsisBundle.repeatLactateValue && (() => {
                      const lac1 = parseFloat(sepsisBundle.lactateValue);
                      const lac2 = parseFloat(sepsisBundle.repeatLactateValue);
                      if (isNaN(lac1) || isNaN(lac2) || lac1 <= 0) return null;
                      const clr = Math.round((lac1 - lac2) / lac1 * 100);
                      return <span style={{ color: clr >= 10 ? "var(--npi-teal)" : "#ff8a8a" }}>Clearance: {clr}%{clr >= 10 ? " \u2713 \u226510%" : " \u26A0 <10%"}</span>;
                    })()}
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ padding:"11px 14px", borderRadius:9, background:"rgba(8,18,36,0.5)", border:"1px solid rgba(26,53,85,0.35)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)", lineHeight:1.6 }}>
            For full sepsis scoring (qSOFA, SOFA, SIRS), lactate interpretation, and antibiotic selection \u2014{" "}
            <button onClick={() => navigate("/SepsisHub")} style={{ background:"none", border:"none", color:"var(--npi-teal)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, padding:0 }}>
              open Sepsis Hub &#x2192;
            </button>
          </div>
        </div>
      );

      case "timeline": return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <VitalSignsChart vitalsHistory={vitalsHistory} />
          <ClinicalTimeline arrivalMs={arrivalTimeRef.current} onStateChange={setClinicalTimeline} />
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={() => selectSection("closeout")} style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              Continue to Close-out &#9654;
            </button>
          </div>
        </div>
      );

      case "closeout": return (
        <DispositionTab
          disposition={disposition}   setDisposition={setDisposition}
          dispReason={dispReason}     setDispReason={setDispReason}
          dispTime={dispTime}         setDispTime={setDispTime}
          onAdvance={() => selectSection("handoff")}
        />
      );

      case "handoff": return (
        <HandoffTab
          demo={demo} cc={cc} vitals={vitals}
          medications={medications} allergies={allergies}
          pmhSelected={pmhSelected}
          rosState={rosState} peState={peState} peFindings={peFindings}
          esiLevel={esiLevel} registration={registration}
          sdoh={sdoh} consults={consults}
          disposition={disposition} dispReason={dispReason}
          onAdvance={() => selectSection("discharge")}
        />
      );

      case "comms": return (
        <CommunicationLog
          demo={demo} cc={cc} providerName={providerName}
          events={communicationEvents}
          onEventsChange={setCommunicationEvents}
        />
      );

      case "discharge": return (
        <SmartDischargeHub
          demo={demo} cc={cc} vitals={vitals}
          medications={medications} allergies={allergies}
          pmhSelected={pmhSelected}
          disposition={disposition} dispReason={dispReason} dispTime={dispTime}
          consults={consults} sdoh={sdoh}
          esiLevel={esiLevel} registration={registration}
          providerName={providerName} doorTime={doorTime}
          nursingNotes={nursingNotes} nursingInterventions={nursingInterventions}
        />
      );

      case "erx": return (
        <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden" }}>
          <ERxHub embedded navigate={navigate} patientAllergiesFromParent={allergies} patientWeightFromParent={vitals.weight||""} />
        </div>
      );

      case "orders": return (
        <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden" }}>
          <OrdersPanel
            patientName={patientName} allergies={allergies}
            chiefComplaint={cc.text}
            patientAge={demo.age} patientSex={demo.sex}
            patientWeight={demo.weight || vitals.weight || ""}
          />
        </div>
      );

      case "results": return (
        <ResultsViewer
          patientName={patientName}
          patientMrn={registration.mrn || demo.mrn}
          patientAge={demo.age} patientSex={demo.sex}
          allergies={allergies} chiefComplaint={cc.text}
          vitals={vitals}
        />
      );

      case "labs": return (
        <LabInterpreter
          embedded={true}
          demo={demo}
          vitals={vitals}
          cc={cc}
          medications={medications}
          pmhSelected={pmhSelected}
        />
      );

      case "scores": return (
        <ScoreHub
          embedded={true}
          demo={demo}
          vitals={vitals}
          pmhSelected={pmhSelected}
          cc={cc}
        />
      );

      case "dosing": return (
        <WeightDoseHub
          embedded={true}
          demo={demo}
          vitals={vitals}
          medications={medications}
          allergies={allergies}
          cc={cc}
          showToast={_showToast}
          onAdvance={() => selectSection("mdm")}
        />
      );

      case "resus": return (
        <ResusHub
          embedded={true}
          demo={demo}
          vitals={vitals}
        />
      );

      case "stroke": return (
        <StrokeHub
          embedded={true}
          onBack={() => selectSection("hubs")}
          demo={demo}
          vitals={vitals}
          cc={cc}
        />
      );

      case "tox": return (
        <ToxicologyHub
          embedded={true}
          onBack={() => selectSection("hubs")}
          demo={demo}
          vitals={vitals}
          cc={cc}
        />
      );

      case "imaging": return (
        <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"auto" }}>
          <ImagingInterpreter
            embedded
            demo={demo}
            vitals={vitals}
            cc={cc}
            pmhSelected={pmhSelected}
            medications={medications}
          />
        </div>
      );

      case "autocoder": return (
        <AutoCoderTab
          patientName={patientName} patientMrn={demo.mrn} patientDob={demo.dob}
          patientAge={demo.age} patientGender={demo.sex}
          chiefComplaint={cc.text} vitals={vitals}
          medications={medications} allergies={allergies}
          pmhSelected={pmhSelected}
          rosState={rosState} rosSymptoms={rosSymptoms}
          peState={peState} peFindings={peFindings}
          onAdvance={() => selectSection("mdm")}
        />
      );

      case "mdm": return (
        <MDMBuilderTab
          demo={demo} cc={cc} vitals={vitals} medications={medications}
          pmhSelected={pmhSelected} consults={consults} sdoh={sdoh}
          disposition={disposition} esiLevel={esiLevel} isarState={isarState}
          mdmState={mdmState} setMdmState={setMdmState}
          mdmDataElements={mdmDataElements} setMdmDataElements={setMdmDataElements}
          onToast={_showToast}
          onAdvance={() => selectSection("timeline")}
        />
      );

      case "procedures": return (
        <EDProcedureNotes embedded patientName={patientName} patientAllergies={allergies.join(", ")} physicianName="" />
      );

      case "medref": return (
        <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"auto" }}>
          <MedicationReferencePage embedded />
        </div>
      );

      case "erplan": return (
        <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden" }}>
          <ERPlanBuilder
            embedded
            patientName={patientName}
            patientAge={demo.age} patientSex={demo.sex}
            patientCC={cc.text} patientVitals={vitals}
            patientAllergies={allergies} patientMedications={medications}
          />
        </div>
      );

      default: return null;
    }
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <style>{NPI_CSS}</style>

      {/* ── Top bar ── */}
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
          <button className="npi-tb-link" onClick={() => navigate("/EDTrackingBoard")}>&#x1F3E5; Track Board</button>
          <div className="npi-top-right">
            <button className={`npi-cds-btn${cdsOpen?" open":""}${allergies.length>0?" cds-alert":medications.length>0?" cds-warn":""}`} onClick={() => setCdsOpen(o => !o)} title="Clinical Decision Support">
              <div className="npi-cds-dot" />CDS
            </button>
            <button className={`npi-cds-btn${nursingOpen?" open":""}${(nursingInterventions.length+nursingNotes.length)>0?" cds-warn":""}`}
              onClick={() => setNursingOpen(o => !o)} title="Nursing Input Panel" style={{ position:"relative" }}>
              <div className="npi-cds-dot" />RN
              {(nursingInterventions.length+nursingNotes.length) > 0 && (
                <span style={BADGE_STYLE}>
                  {(nursingInterventions.length+nursingNotes.length) > 9 ? "9+" : (nursingInterventions.length+nursingNotes.length)}
                </span>
              )}
            </button>
            <button className={`npi-ai-btn${aiOpen?" open":""}`} onClick={toggleAI} title="Notrya AI">
              <div className="npi-ai-dot" /> AI
              {unread > 0 && <span className="npi-ai-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>
            <button className={`npi-cds-btn${mediaOpen?" open":""}${attachments.length>0?" cds-warn":""}`}
              onClick={() => setMediaOpen(o => !o)} title="Media Attachments" style={{ position:"relative" }}>
              <div className="npi-cds-dot" />&#x1F4CE;
              {attachments.length > 0 && (
                <span style={BADGE_STYLE}>
                  {attachments.length > 9 ? "9+" : attachments.length}
                </span>
              )}
            </button>
            <button className="npi-new-pt" onClick={() => navigate("/NewPatientInput?tab=demo")}>+ New Patient</button>
            <Link to="/AppSettings" className="npi-tb-settings" title="Settings">&#x2699;&#xFE0F;</Link>
          </div>
        </div>

        <div className="npi-top-row-2">
          <span className={`npi-chart-badge${registration.mrn ? " registered" : ""}`}>{registration.mrn || "PT-NEW"}</span>
          <span className="npi-pt-name">{patientName}</span>
          {demo.dob && <span className="npi-pt-dob" title="Date of birth — second patient identifier">DOB {demo.dob}</span>}
          <span className="npi-door-time" title="Time since intake started">&#x23F1; {doorTime}</span>

          {/* Connectivity / sync status — always visible */}
          <ConnectivityIndicator />

          {/* Visit mode selector */}
          <div style={{ display:"flex", gap:2, background:"rgba(8,22,46,0.8)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:7, overflow:"hidden", flexShrink:0 }}>
            {[
              { key:"simple",   label:"Simple",   hint:"ESI 4-5 — hides complex close tabs",   autoEsi:[4,5] },
              { key:"standard", label:"Standard",  hint:"Default — all tabs visible",            autoEsi:[]    },
              { key:"critical", label:"Critical",  hint:"ESI 1-2 — all tabs + sepsis promoted", autoEsi:[1,2] },
            ].map(({ key, label, hint, autoEsi }) => {
              const active    = visitMode === key;
              const suggested = esiLevel && autoEsi.includes(parseInt(esiLevel)) && visitMode === "standard" && key !== "standard";
              const col       = key === "simple" ? "var(--npi-teal)" : key === "critical" ? "var(--npi-coral)" : "var(--npi-txt3)";
              return (
                <button key={key} title={hint}
                  onClick={() => { setVisitMode(key); if (key === "critical") selectSection("sepsis"); }}
                  style={{
                    padding: "3px 10px", border: "none", cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 10,
                    fontWeight: active ? 700 : 400,
                    background: active ? `${col}18` : "transparent",
                    color: active ? col : suggested ? col : "var(--npi-txt4)",
                    borderLeft: key !== "simple" ? "1px solid rgba(26,53,85,0.4)" : "none",
                    transition: "all .12s", position: "relative",
                  }}>
                  {label}
                  {suggested && !active && (
                    <span style={{ position:"absolute", top:2, right:2, width:4, height:4, borderRadius:"50%", background:col }} />
                  )}
                </button>
              );
            })}
          </div>

          <div className={`npi-allergy-wrap${allergies.length > 0 ? " has-allergies" : ""}`} onClick={() => selectSection("meds")} title="Click to view/edit medications">
            {allergies.length === 0
              ? <span className="npi-allergy-nka">&#x2713; NKA</span>
              : <span className="npi-allergy-alert">&#x26A0; {allergies.slice(0,2).join(" \xb7 ")}{allergies.length > 2 ? ` +${allergies.length-2}` : ""}</span>
            }
          </div>

          {resumeSection && (
            <button className="npi-resume-chip" onClick={() => { selectSection(resumeSection); setResumeSection(null); }} title="Return to where you were">
              &#x21A9; Resume {ALL_SECTIONS.find(s => s.section === resumeSection)?.label || resumeSection}
              <span className="npi-resume-dismiss" onClick={e => { e.stopPropagation(); setResumeSection(null); }}>&#x2715;</span>
            </button>
          )}

          <div className="npi-top-acts">
            <button className="npi-btn-ghost" onClick={() => setShowCCDA(true)} title="Import C-CDA or clinical document">\uD83D\uDCCB Import</button>
            <button className="npi-btn-ghost" onClick={() => setShowFhirSync(true)} title="Sync from FHIR R4 endpoint">&#x21BA; FHIR</button>
            <button className="npi-btn-ghost" onClick={() => selectSection("orders")}>+ Order</button>
            <button className="npi-btn-ghost" onClick={() => selectSection("consult")} title="Request consultation">&#x1F465; Consult</button>
            <button className="npi-btn-coral" onClick={() => selectSection("discharge")}>&#x1F6AA; Discharge</button>
            <button className="npi-btn-primary" onClick={() => setShowSignChecklist(true)}>&#x270D; Sign &amp; Save</button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="npi-main-wrap">
        <main className="npi-content">{renderContent()}</main>
      </div>

      {/* ── AI overlay ── */}
      <div className={`npi-scrim${aiOpen?" open":""}`} onClick={toggleAI} />
      <div className={`npi-overlay${aiOpen?" open":""}`}>
        <div className="npi-n-hdr">
          <div className="npi-n-hdr-top">
            <div className="npi-n-avatar">&#x1F916;</div>
            <div className="npi-n-hdr-info">
              <div className="npi-n-hdr-name">Notrya AI</div>
              <div className="npi-n-hdr-sub"><span className="dot" /> Clinical assistant &middot; online</div>
            </div>
            <button className="npi-n-close" onClick={toggleAI}>&#x2715;</button>
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
          <textarea ref={inputRef} className="npi-n-ta" rows={1} placeholder="Ask anything\u2026" value={aiInput}
            onChange={e => setAiInput(e.target.value)} onKeyDown={handleAIKey} disabled={aiLoading}
            onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,90)+"px"; }}
          />
          <button className="npi-n-send" onClick={() => sendMessage(aiInput)} disabled={aiLoading||!aiInput.trim()}>&#x2191;</button>
        </div>
      </div>

      {/* ── CDS overlay ── */}
      {cdsOpen && <div className="npi-cds-scrim" onClick={() => setCdsOpen(false)} />}
      <div className={`npi-cds-overlay${cdsOpen?" open":""}`}>
        <div className="npi-cds-overlay-hdr">
          <span className="npi-cds-overlay-title">Clinical Decision Support</span>
          <button className="npi-cds-close" onClick={() => setCdsOpen(false)}>&#x2715;</button>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"0 0 16px" }}>

          {/* Beers Criteria — age ≥65 */}
          {parseInt(demo.age) >= 65 && (() => {
            const hits = medications.filter(m => BEERS_DRUGS.some(b => m.toLowerCase().includes(b)));
            if (!hits.length) return null;
            return (
              <div style={{ margin:"12px 12px 0", padding:"12px 14px", borderRadius:10, background:"rgba(255,107,107,0.09)", border:"1px solid rgba(255,107,107,0.45)", borderLeft:"3px solid #ff6b6b" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:14 }}>&#x1F6A8;</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5, textTransform:"uppercase", color:"#ff8a8a" }}>Critical \u2014 Beers Criteria (Age {demo.age})</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ffb3b3", marginBottom:8 }}>Potentially Inappropriate Medications for adults \u226565 (AGS 2023):</div>
                {hits.map(m => (
                  <div key={m} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span style={{ color:"#ff6b6b", fontSize:11 }}>&#x26A0;</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt)", fontWeight:600 }}>{m}</span>
                  </div>
                ))}
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#ff8a8a", marginTop:8, borderTop:"1px solid rgba(255,107,107,0.2)", paddingTop:8 }}>
                  Review for: benzodiazepines, muscle relaxants, anticholinergics, Z-drugs. Consider dose reduction or safer alternative.
                </div>
              </div>
            );
          })()}

          {/* CC risk score hints */}
          {(() => {
            const hints = getCCRiskHints(cc.text);
            if (!hints.length) return null;
            return (
              <div style={{ margin:"12px 12px 0" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, paddingLeft:2 }}>Risk Scores \u2014 Based on CC</div>
                {hints.map((h, i) => {
                  const isAdvisory = h.tier === "advisory";
                  const col = isAdvisory ? "#f5c842" : "var(--npi-teal)";
                  const bg  = isAdvisory ? "rgba(245,200,66,0.07)"  : "rgba(0,229,192,0.05)";
                  const bd  = isAdvisory ? "rgba(245,200,66,0.3)"   : "rgba(0,229,192,0.2)";
                  const bl  = isAdvisory ? "rgba(245,200,66,0.7)"   : "rgba(0,229,192,0.5)";
                  return (
                    <div key={i} style={{ padding:"10px 12px", borderRadius:9, background:bg, border:`1px solid ${bd}`, borderLeft:`3px solid ${bl}`, marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:col }}>{h.score}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)", letterSpacing:1, textTransform:"uppercase" }}>{h.tier}</span>
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)", marginBottom:4 }}>{h.use}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:col, marginBottom:8 }}>\u2192 {h.action}</div>
                      <button
                        onClick={async () => {
                          const phrase = buildDecisionDocPhrase(h);
                          try { await navigator.clipboard.writeText(phrase); } catch(_) {}
                          setMdmDataElements(prev =>
                            prev.some(e => e.score === h.score)
                              ? prev
                              : [...prev, { id: String(Date.now()), source:"cds", score:h.score, phrase, ts:Date.now() }]
                          );
                          _showToast(`${h.score} documented in MDM builder + copied to clipboard.`);
                        }}
                        style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:5, cursor:"pointer",
                          border:`1px solid ${isAdvisory ? "rgba(245,200,66,0.45)" : "rgba(0,229,192,0.35)"}`,
                          background: isAdvisory ? "rgba(245,200,66,0.08)" : "rgba(0,229,192,0.07)",
                          color:col, display:"flex", alignItems:"center", gap:5 }}>
                        &#x1F4CB; Document decision (copy phrase)
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* MDM nudge */}
          {(cc.text || esiLevel) && (
            <div style={{ margin:"12px 12px 0", padding:"10px 12px", borderRadius:9, background:"rgba(59,158,255,0.06)", border:"1px solid rgba(59,158,255,0.2)", borderLeft:"3px solid rgba(59,158,255,0.5)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#3b9eff", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>MDM Documentation \u2014 AMA/CPT 2023</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)", lineHeight:1.6 }}>
                {[
                  "Document complexity of problems addressed (COPA).",
                  "List data reviewed: labs, imaging, external records.",
                  "State risk level with table-of-risk element.",
                  "Note diagnoses considered but NOT ordered.",
                  parseInt(demo.age) >= 65 ? "Age \u226565: document any Beers-listed med rationale." : null,
                  Object.values(sdoh).some(v => v === "2") ? "Positive SDOH screen = Moderate Risk \u2014 document in MDM." : null,
                ].filter(Boolean).map((tip, i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:3 }}>
                    <span style={{ color:"#3b9eff", flexShrink:0 }}>{i+1}.</span><span>{tip}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { sendMessage(QUICK_ACTIONS[4].prompt); if (!aiOpen) toggleAI(); setCdsOpen(false); }}
                style={{ marginTop:8, padding:"5px 12px", borderRadius:6, border:"1px solid rgba(59,158,255,0.4)", background:"rgba(59,158,255,0.1)", color:"#3b9eff", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                \u2728 Draft MDM with AI
              </button>
            </div>
          )}

          {/* Drug / Allergy interactions */}
          {(medications.length > 0 || allergies.length > 0) && (
            <div style={{ margin:"12px 12px 0" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, paddingLeft:2 }}>Drug / Allergy Interactions</div>
              <CDSAlertsSidebar medications={medications} allergies={allergies} vitals={vitals} pmhSelected={pmhSelected} age={demo.age} cc={cc.text} />
            </div>
          )}

          {!cc.text && !demo.age && allergies.length === 0 && medications.length === 0 && (
            <div style={{ padding:"28px 16px", textAlign:"center", color:"var(--npi-txt4)", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
              Enter chief complaint, patient age, or medications to activate clinical decision support.
            </div>
          )}
        </div>
      </div>

      {/* ── Panel overlays ── */}
      <NursingPanel
        open={nursingOpen} onClose={() => setNursingOpen(false)}
        vitals={vitals} setVitals={setVitals} addVitalsSnapshot={addVitalsSnapshot}
        esiLevel={esiLevel} setEsiLevel={setEsiLevel}
        triage={triage} setTriage={setTriage}
        nursingInterventions={nursingInterventions} setNursingInterventions={setNursingInterventions}
        nursingNotes={nursingNotes} setNursingNotes={setNursingNotes}
        patientName={patientName} demo={demo}
      />
      <MediaAttachmentPanel
        open={mediaOpen} onClose={() => setMediaOpen(false)}
        attachments={attachments} setAttachments={setAttachments}
        patientName={patientName} demo={demo} cc={cc} providerName={providerName}
      />

      {/* ── Keyboard shortcut FAB ── */}
      <button className="npi-sc-hint-fab" title="Keyboard shortcuts (?)" onClick={() => setShowShortcuts(s => !s)}>?</button>

      <ParseFab parseText={parseText} setParseText={setParseText} parsing={parsing} onParse={smartParse} tabLabel={ALL_SECTIONS.find(s => s.section === currentTab)?.label || currentTab} />

      {/* Compact rail override */}
      {railCompact && (
        <style>{".npi-wf-gh-label,.npi-wf-item-label,.npi-wf-item-sc,.npi-wf-pt-meta,.npi-wf-vitals,.npi-wf-pt-cc{display:none!important}.npi-wf-rail{width:54px!important}.npi-wf-pt-name{font-size:9px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"}</style>
      )}

      {/* ── Shortcuts modal ── */}
      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={{ position:"fixed", inset:0, zIndex:99998, background:"rgba(3,8,16,.75)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#081628", border:"1px solid #1a3555", borderRadius:16, padding:"24px 28px", width:520, maxWidth:"90vw", boxShadow:"0 24px 80px rgba(0,0,0,.6)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"#fff" }}>Keyboard Shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} style={{ background:"#0e2544", border:"1px solid #1a3555", borderRadius:6, width:28, height:28, color:"#7aa0c0", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>&#x2715;</button>
            </div>
            {[
              { section:"Navigate to section", rows:[["Cmd 1","Triage"],["Cmd 2","Demographics"],["Cmd 3","Chief Complaint"],["Cmd 4","Vitals"],["Cmd 5","Meds & PMH"],["Cmd 6","HPI"],["Cmd 7","ROS"],["Cmd 8","Physical Exam"],["Cmd 9","Orders"],["Cmd 0","Discharge"]] },
              { section:"HPI (scan mode)",     rows:[["Y / Enter","Symptom present"],["N","Symptom absent"],["Space","Skip symptom"],["0-9","Pain scale or option #"],["Arrow Up/Down","Navigate rows"],["Backspace","Go back one row"],["Esc","Finish & build narrative"]] },
              { section:"Actions",             rows:[["Cmd Shift S","Save Chart"],["Cmd Shift N","New Patient"],["?","Toggle shortcuts"]] },
              { section:"Note Studio",         rows:[["Cmd G","AI generate focused section"],["Cmd Shift G","Generate all empty sections"],["Cmd R","Rebuild from patient data"],["Cmd S","Save note"],["Cmd P","Print note"],["Cmd Shift C","Copy full note"]] },
            ].map(({ section, rows }) => (
              <div key={section} style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#5a82a8", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>{section}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                  {rows.map(([key, desc]) => (
                    <div key={key} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#b8d4f0", background:"#0e2544", border:"1px solid #1a3555", borderRadius:4, padding:"1px 7px", flexShrink:0, whiteSpace:"nowrap" }}>{key}</span>
                      <span style={{ fontSize:11, color:"#82aece" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop:8, paddingTop:12, borderTop:"1px solid #1a3555", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#5a82a8", textAlign:"center" }}>press ? to dismiss</div>
          </div>
        </div>
      )}

      {/* ── Left nav rail ── */}
      <aside className="npi-wf-rail">
        <button onClick={() => setRailCompact(c => !c)} title={railCompact ? "Expand sidebar" : "Collapse sidebar"}
          style={{ position:"absolute", top:8, right:railCompact?8:6, zIndex:10, width:22, height:22, borderRadius:11, border:"1px solid rgba(42,77,114,0.5)", background:"rgba(8,22,46,0.9)", color:"var(--npi-txt4)", fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>
          {railCompact ? "\u203A" : "\u2039"}
        </button>

        <div className="npi-wf-pt">
          <div className="npi-wf-pt-name">{patientName}</div>
          <div className="npi-wf-pt-meta">
            {demo.age && <span>{demo.age}y {demo.sex ? `\xb7 ${demo.sex}` : ""}</span>}
            {cc.text && <span className="npi-wf-pt-cc">{cc.text}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
            {esiLevel && (
              <span className="npi-wf-esi" style={{ color:esiLevel<=2?"var(--npi-coral)":esiLevel===3?"var(--npi-orange)":"var(--npi-teal)", borderColor:`rgba(${esiLevel<=2?"255,107,107":esiLevel===3?"255,159,67":"0,229,192"},.3)`, background:`rgba(${esiLevel<=2?"255,107,107":esiLevel===3?"255,159,67":"0,229,192"},.08)` }}>ESI {esiLevel}</span>
            )}
            {registration.room && (
              <span className="npi-wf-esi" style={{ color:"var(--npi-teal)", borderColor:"rgba(0,229,192,.3)", background:"rgba(0,229,192,.08)" }}>Rm {registration.room}</span>
            )}
            {parseInt(demo.age) >= 65 && (
              <span className="npi-wf-esi" title="Geriatric patient — Beers Criteria active" style={{ color:"#f5c842", borderColor:"rgba(245,200,66,.3)", background:"rgba(245,200,66,.08)" }}>65+</span>
            )}
          </div>
          <div className="npi-wf-vitals">
            {[
              { key:"bp",   lbl:"BP",       val:vitals.bp   || "\u2014" },
              { key:"hr",   lbl:"HR",        val:vitals.hr   || "\u2014" },
              { key:"rr",   lbl:"RR",        val:vitals.rr   || "\u2014" },
              { key:"spo2", lbl:"SpO\u2082", val:vitals.spo2 || "\u2014" },
              { key:"temp", lbl:"T",         val:vitals.temp || "\u2014" },
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
          const items    = (NAV_DATA[g.key] || []).filter(item =>
            !(visitMode === "simple" && SIMPLE_HIDDEN.has(item.section))
          );
          const badge = getGroupBadge(g.key);
          return (
            <div key={g.key} className="npi-wf-group">
              <button className={`npi-wf-gh${isActive ? " active" : ""}`} onClick={() => selectGroup(g.key)}>
                <span className="npi-wf-gh-icon">{g.icon}</span>
                <span className="npi-wf-gh-label">{g.label}</span>
                <span className={`npi-wf-gh-badge ${badge}`} />
              </button>
              {isActive && (
                <div className="npi-wf-items">
                  {items.map(item => (
                    <div key={item.section} style={{ display:"contents" }}>
                      <button className={`npi-wf-item${item.section === currentTab ? " active" : ""}`}
                        onClick={() => item.href ? navigate(item.href) : selectSection(item.section)}>
                        <span className="npi-wf-item-icon">{item.icon}</span>
                        <span className="npi-wf-item-label">{item.label}</span>
                        <span className={`npi-wf-item-dot ${navDots[item.section]||"empty"}`} />
                        {SECTION_SHORTCUT[item.section] && (
                          <span className="npi-wf-item-sc">&#x2318;{SECTION_SHORTCUT[item.section]}</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {/* ── FHIR Data Sync modal ── */}
      <FhirDataSync
        open={showFhirSync}
        onClose={() => setShowFhirSync(false)}
        patientMrn={registration?.mrn}
        patientFhirId={registration?.fhirId}
        vitals={vitals} setVitals={setVitals}
        medications={medications} setMedications={setMedications}
        allergies={allergies} setAllergies={setAllergies}
        pmhSelected={pmhSelected} setPmhSelected={setPmhSelected}
        onToast={_showToast}
      />

      {/* ── C-CDA / document import modal ── */}
      <CCDASmartParse
        open={showCCDA}
        onClose={() => setShowCCDA(false)}
        onApplyDemographics={d => setDemo(prev => ({ ...prev, ...d }))}
        onApplyMedications={meds => setMedications(prev => {
          const existing = (prev||[]).map(m => (typeof m === "string" ? m : m.name||"").toLowerCase());
          return [...(prev||[]), ...meds.filter(m => !existing.includes(m.toLowerCase()))];
        })}
        onApplyAllergies={als => setAllergies(prev => {
          const existing = (prev||[]).map(a => (typeof a === "string" ? a : "").toLowerCase());
          return [...(prev||[]), ...als.filter(a => !existing.includes(a.toLowerCase()))];
        })}
        onApplyPmh={problems => setPmhSelected(prev => {
          const updated = { ...(prev||{}) };
          problems.forEach(p => { updated[p] = true; });
          return updated;
        })}
        onApplyVitals={v => setVitals(prev => ({ ...prev, ...v }))}
        onToast={_showToast}
      />

      {/* ── Sign & Close checklist ── */}
      <SignCloseChecklist
        open={showSignChecklist}
        onClose={() => setShowSignChecklist(false)}
        onConfirm={() => { setShowSignChecklist(false); handleSaveChart(); }}
        onNavigate={section => { setShowSignChecklist(false); selectSection(section); }}
        demo={demo} cc={cc} vitals={vitals}
        medications={medications} allergies={allergies}
        pmhSelected={pmhSelected}
        rosState={rosState} peState={peState}
        disposition={disposition} dispReason={dispReason}
        sdoh={sdoh} esiLevel={esiLevel}
        mdmState={mdmState} mdmDataElements={mdmDataElements}
        sepsisBundle={sepsisBundle} avpu={avpu}
        communicationEvents={communicationEvents}
      />

      {/* ── Onboarding overlay (FIX #5 — no sessionStorage) ── */}
      {showOnboarding && (
        <div onClick={dismissOnboarding}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(3,8,16,0.82)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#081628", border:"1px solid rgba(26,53,85,0.7)", borderRadius:18, padding:"28px 32px", width:500, maxWidth:"92vw", boxShadow:"0 32px 96px rgba(0,0,0,0.7)" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#e8f0fe", marginBottom:4 }}>Welcome to Notrya</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#4a6a8a", marginBottom:22 }}>Three features that cut documentation time in half</div>
            {[
              {
                icon: "📋", color: "#3b9eff",
                title: "SmartParse — paste any clinical text",
                desc: "Tap the clipboard button (bottom-right) and paste a triage note, nursing assessment, or typed HPI. Demographics, vitals, allergies, and medications are extracted automatically.",
              },
              {
                icon: "🔍", color: "#00e5c0",
                title: "ROS — click Deny All first, then mark positives",
                desc: "Open Review of Systems and click \u2713 Deny All in the header. A 13-system ROS is complete. Then click any symptom to mark it as reported. Full keyboard navigation also available \u2014 press ? to see shortcuts.",
              },
              {
                icon: "\u2696\ufe0f", color: "#f5c842",
                title: "MDM Builder — Quick mode for routine visits",
                desc: "The MDM Builder opens in \u26A1 Quick mode. Select your E/M level in one click and hit Build Narrative. Switch to \u229e Full grid only for complex encounters that need line-by-line documentation.",
              },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} style={{ display:"flex", gap:14, marginBottom:18 }}>
                <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:`${color}15`, border:`1px solid ${color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:"#e8f0fe", marginBottom:4 }}>{title}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"#4a6a8a", lineHeight:1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
            <button onClick={dismissOnboarding}
              style={{ width:"100%", padding:"11px 0", borderRadius:10, cursor:"pointer", background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:"#050f1e", marginTop:6 }}>
              Got it \u2014 start charting
            </button>
            <div style={{ textAlign:"center", marginTop:10, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(42,77,114,0.8)", letterSpacing:1 }}>
              This message won\u2019t show again this session
            </div>
          </div>
        </div>
      )}
    </div>
  );
}