// QuickNotePhase1Panel.jsx  v14.0 — CC-Driven additions
// Carries forward all v13.1 layout (7-step field order, collapsible Meds)
// v14.0 adds:
//   - ccProfile prop: when set and not "general", panel becomes CC-branded
//   - onChangeCC prop: "Change CC" button in panel header
//   - HPI, ROS, Exam auto-seeded from ccProfile templates on CC change
//   - "Reset to CC template" buttons on ROS and Exam when user has edited
//   - Key Diagnostics strip below Exam (collapsible, informational)
//   - Risk Scores line below diagnostics strip
//   - CC accent color applied to panel header circle and title
//   - Generate Initial Impression button still NOT here (lives in QuickNote.jsx)

import React, { useState, useCallback, useRef, useEffect } from "react";
import { InputZone, QuickDDxCard, InlineCopyBtn } from "./QuickNoteComponents";
import { MedsAllergyZone } from "./QuickNoteMedsAllergy";
import MedTermHighlighter from "@/components/MedTermHighlighter";
import ExamShortcuts from "@/components/quicknote/ExamShortcuts";
import VoiceDictationButton from "@/components/quicknote/VoiceDictationButton";
// v15.0: KB-mode ROS and PE panels — these ARE the ROS and PE fields
import { QuickNoteROSHelper } from "./QuickNoteROSHelper";
import { QuickNoteExamHelper } from "@/components/quicknote/QuickNoteExamHelper";

export function Phase1Panel({
  // Core inputs
  cc, setCC, vitals, setVitals, hpi, setHpi, ros, setRos, exam, setExam,
  encounterType, setEncounterType,
  // HPI summary
  hpiMode, setHpiMode, hpiSummary, setHpiSummary,
  hpiSumBusy, hpiSumError, copiedHpiSum, setCopiedHpiSum,
  summarizeHPI,
  // Smart Structure HPI
  structureHPI, hpiStructureBusy, hpiStructureError,
  // Structure → Prose chain + gap indicators
  summarizeFromStructure, hpiGaps,
  // QuickDDx
  quickDDx, quickDDxBusy, quickDDxErr, quickDDxDismissed, setQuickDDxDismissed,
  runQuickDDx,
  // Meds & allergies
  medsRaw, setMedsRaw, allergiesRaw, setAllergiesRaw,
  parsedMeds, parsedAllergies, setParsedMeds, setParsedAllergies,
  medsParsing, medsError, parseMedsAllergies,
  // Status
  p1Busy, p1Error, phase1Ready, mdmResult,
  // Copy inputs
  copiedInputs, copyClinicalInputs,
  // Refs + nav
  setRef, makeKeyDown,
  // Submit (Cmd+Enter keyboard shortcut only — button lives in QuickNote.jsx)
  runMDM,
  // Bounceback
  isBounceback, setIsBounceback, bouncebackDate, setBouncebackDate,
  // Auto-ROS (legacy — kept for prop compat)
  autoRosFromHpi, autoRosBusy,
  // Extra props
  patientPregnant, setPatientPregnant,
  patientWeight, setPatientWeight,
  smartExpansions,
  // HPI auto-extract for MedsAllergyZone import nudge
  medsFromHpi, allergiesFromHpi,
  // ── v14.0: CC-driven props ──────────────────────────────────────────────
  ccProfile,    // full CC profile object from QuickNoteCCProfiles.js, or null
  onChangeCC,   // callback — opens CCLauncher when physician clicks "Change CC"
}) {

  // ── Local state ────────────────────────────────────────────────────────────
  const [hpiPastePrompt,   setHpiPastePrompt]   = useState(false);
  const [medsOpen,         setMedsOpen]          = useState(false);
  const [diagnosticsOpen,  setDiagnosticsOpen]   = useState(true);
  const [checkedDiagnostics, setCheckedDiagnostics] = useState(new Set());
  const pasteToastTimer = useRef(null);

  // Track whether ROS/PE/HPI have been user-edited since CC was applied
  const [rosEdited,  setRosEdited]  = useState(false);
  const [examEdited, setExamEdited] = useState(false);
  const [hpiEdited,  setHpiEdited]  = useState(false);

  // ── v14.0: Seed HPI, ROS, Exam from CC profile on profile change ──────────
  useEffect(() => {
    if (!ccProfile || ccProfile.id === "general") return;

    // Reset edit-tracking flags whenever CC changes
    setRosEdited(false);
    setExamEdited(false);
    setHpiEdited(false);
    setCheckedDiagnostics(new Set());
    setDiagnosticsOpen(true);

    // Seed HPI scaffold only if field is empty
    if (ccProfile.hpi_scaffold && !hpi.trim()) {
      setHpi(ccProfile.hpi_scaffold);
    }
    // Seed ROS template only if field is empty
    if (ccProfile.ros_template && !ros.trim()) {
      setRos(ccProfile.ros_template);
    }
    // Seed PE template only if field is empty
    if (ccProfile.pe_template && !exam.trim()) {
      setExam(ccProfile.pe_template);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccProfile?.id]);

  // ── Paste detection ────────────────────────────────────────────────────────
  const handleHpiPaste = useCallback((e) => {
    const text = e.clipboardData?.getData("text") || "";
    if (text.length > 80 && !hpiSummary) {
      setHpiPastePrompt(true);
      clearTimeout(pasteToastTimer.current);
      pasteToastTimer.current = setTimeout(() => setHpiPastePrompt(false), 10000);
    }
  }, [hpiSummary]);

  const dismissPastePrompt = useCallback(() => {
    clearTimeout(pasteToastTimer.current);
    setHpiPastePrompt(false);
  }, []);

  // Wrapped setters that track user edits for CC template reset buttons
  const handleRosChange = useCallback((val) => {
    setRos(val);
    if (ccProfile && ccProfile.id !== "general" && val !== ccProfile.ros_template) {
      setRosEdited(true);
    }
  }, [setRos, ccProfile]);

  const handleExamChange = useCallback((val) => {
    setExam(val);
    if (ccProfile && ccProfile.id !== "general" && val !== ccProfile.pe_template) {
      setExamEdited(true);
    }
  }, [setExam, ccProfile]);

  const handleHpiChange = useCallback((val) => {
    setHpi(val);
    if (ccProfile && ccProfile.id !== "general" && val !== ccProfile.hpi_scaffold) {
      setHpiEdited(true);
    }
  }, [setHpi, ccProfile]);

  // Reset to CC template handlers
  const resetRosToCCTemplate = useCallback(() => {
    if (ccProfile?.ros_template) {
      setRos(ccProfile.ros_template);
      setRosEdited(false);
    }
  }, [ccProfile, setRos]);

  const resetExamToCCTemplate = useCallback(() => {
    if (ccProfile?.pe_template) {
      setExam(ccProfile.pe_template);
      setExamEdited(false);
    }
  }, [ccProfile, setExam]);

  const resetHpiToCCTemplate = useCallback(() => {
    if (ccProfile?.hpi_scaffold) {
      setHpi(ccProfile.hpi_scaffold);
      setHpiEdited(false);
    }
  }, [ccProfile, setHpi]);

  // Toggle diagnostics checkbox
  const toggleDiagnostic = useCallback((item) => {
    setCheckedDiagnostics(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  // Auto-expand Meds if there is data
  const hasMedsData = parsedMeds?.length > 0 || parsedAllergies?.length > 0
    || medsRaw?.trim() || allergiesRaw?.trim()
    || medsFromHpi?.length > 0 || allergiesFromHpi?.length > 0;

  const hpiWordCount = hpi.trim() ? hpi.trim().split(/\s+/).length : 0;
  const hpiCharCount = hpi.length;

  // ── CC accent color (falls back to teal for no CC or General) ─────────────
  const isCC       = ccProfile && ccProfile.id !== "general";
  const accentColor = isCC ? (ccProfile.color || "var(--qn-teal)") : "var(--qn-teal)";

  // ── Shared label style ─────────────────────────────────────────────────────
  const sectionLabel = {
    fontFamily:    "'JetBrains Mono',monospace",
    fontSize:      8,
    fontWeight:    700,
    color:         "var(--qn-txt4)",
    letterSpacing: 1,
    textTransform: "uppercase",
  };

  // Small inline "Reset to CC template" button
  const ResetToTemplateBtn = ({ onReset, label = "Reset to CC template" }) => (
    <button
      onClick={onReset}
      title={label}
      style={{
        padding:      "1px 8px",
        borderRadius: 4,
        cursor:       "pointer",
        fontFamily:   "'JetBrains Mono',monospace",
        fontSize:     7,
        fontWeight:   700,
        border:       `1px solid ${accentColor}50`,
        background:   `${accentColor}08`,
        color:        accentColor,
        letterSpacing:.3,
        transition:   "all .15s",
        flexShrink:   0,
      }}
    >
      ↺ {label}
    </button>
  );

  return (
    <div style={{
      marginBottom: 14,
      background:   "rgba(8,22,40,.5)",
      border:       `1px solid rgba(42,79,122,.4)`,
      borderRadius: 14,
      padding:      "16px",
      // Subtle CC accent on left border when CC is active
      borderLeft:   isCC ? `3px solid ${accentColor}60` : "1px solid rgba(42,79,122,.4)",
    }}>

      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>

        {/* Circle badge */}
        <div style={{
          width:          24, height:24, borderRadius:"50%",
          background:     `${accentColor}20`,
          border:         `1px solid ${accentColor}60`,
          display:        "flex", alignItems:"center", justifyContent:"center",
          fontFamily:     isCC ? "inherit" : "'JetBrains Mono',monospace",
          fontSize:       isCC ? 13 : 11,
          fontWeight:     700,
          color:          accentColor,
          flexShrink:     0,
          transition:     "all .25s",
        }}>
          {isCC ? ccProfile.icon : "1"}
        </div>

        {/* Title */}
        <div>
          <div style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize:   15,
            color:      accentColor,
            transition: "color .25s",
          }}>
            {isCC ? ccProfile.label : "Initial Assessment"}
          </div>
          <div style={{
            fontFamily:    "'JetBrains Mono',monospace",
            fontSize:      9,
            color:         "var(--qn-txt4)",
            letterSpacing: .8,
          }}>
            {isCC
              ? `${ccProfile.category} · CC-Driven · ROS + PE pre-configured`
              : "CC → Vitals → HPI → ROS → Exam"}
          </div>
        </div>

        {/* Encounter type selector */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginLeft:"auto" }}>
          {[
            { id:"adult",  label:"Adult ED"  },
            { id:"peds",   label:"Pediatric" },
            { id:"psych",  label:"Psych"     },
            { id:"trauma", label:"Trauma"    },
            { id:"obs",    label:"Obs"       },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setEncounterType(id)}
              style={{
                padding:     "3px 9px", borderRadius:5, cursor:"pointer",
                fontFamily:  "'JetBrains Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:.4,
                border:      `1px solid ${encounterType === id ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.35)"}`,
                background:  encounterType === id ? "rgba(0,229,192,.12)" : "transparent",
                color:       encounterType === id ? "var(--qn-teal)" : "var(--qn-txt4)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Change CC button — always visible when onChangeCC is provided */}
        {onChangeCC && (
          <button
            onClick={onChangeCC}
            style={{
              padding:      "4px 12px",
              borderRadius: 7,
              cursor:       "pointer",
              fontFamily:   "'JetBrains Mono',monospace",
              fontSize:     8,
              fontWeight:   700,
              letterSpacing:.4,
              border:       `1px solid ${accentColor}50`,
              background:   `${accentColor}08`,
              color:        accentColor,
              transition:   "all .15s",
              flexShrink:   0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${accentColor}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${accentColor}08`; }}
          >
            {isCC ? `⇄ Change CC` : `⊞ Select CC`}
          </button>
        )}

        {/* MDM done badge */}
        {mdmResult && (
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"4px 10px", borderRadius:7,
            background:"rgba(61,255,160,.08)", border:"1px solid rgba(61,255,160,.3)",
          }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--qn-green)", flexShrink:0 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--qn-green)", letterSpacing:.5 }}>
              MDM · {mdmResult.mdm_level}
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1: CC + VITALS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
        <InputZone
          label="Chief Complaint" value={cc} onChange={setCC} phase={1}
          rows={2} templateType="cc" smartfill kbdHint="Alt+H"
          placeholder="e.g. Chest pain, sharp, onset 2h ago — or press T to select"
          onRef={setRef(0)}
          onKeyDown={makeKeyDown(0, false, runMDM)}
        />
        <InputZone
          label="Triage Vitals" value={vitals} onChange={setVitals} phase={1}
          rows={2}
          vitalsTrendLink={() => {
            const url = "/VitalsHub" + (vitals.trim() ? "?v=" + encodeURIComponent(vitals.trim()) : "");
            window.location.href = url;
          }}
          placeholder="e.g. HR 102 BP 148/92 RR 18 SpO2 96% T 37.4°C"
          onRef={setRef(1)}
          onKeyDown={makeKeyDown(1, false, runMDM)}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2: HPI
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:14 }}>

        {/* HPI label row */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flex:1, gap:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={sectionLabel}>HPI</span>
              {/* v14.0: CC scaffold badge */}
              {isCC && ccProfile.hpi_scaffold && (
                <span style={{
                  fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color:accentColor, background:`${accentColor}10`,
                  border:`1px solid ${accentColor}30`, borderRadius:4, padding:"1px 6px",
                }}>
                  {ccProfile.label} scaffold
                </span>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {/* v14.0: Reset to CC template */}
              {isCC && hpiEdited && ccProfile.hpi_scaffold && (
                <ResetToTemplateBtn onReset={resetHpiToCCTemplate} label="Reset scaffold" />
              )}
              <InlineCopyBtn getValue={() => hpi} label="Copy HPI" />
            </div>
          </div>
          {hpiCharCount > 0 && (
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color: hpiWordCount >= 10 ? "rgba(0,229,192,.55)" : "rgba(107,158,200,.45)",
              letterSpacing:.3,
            }}>
              {hpiWordCount}w · {hpiCharCount}c
            </span>
          )}
          <VoiceDictationButton
            fieldLabel="HPI"
            onTranscript={(t) => setHpi(prev => (prev ? prev.trimEnd() + " " + t.trimStart() : t.trimStart()))}
          />
        </div>

        {/* HPI textarea with paste detection */}
        <div onPaste={handleHpiPaste}>
          <InputZone
            label="" value={hpi} onChange={handleHpiChange} phase={1}
            rows={5} copyable kbdHint="Alt+H"
            placeholder={
              isCC && ccProfile.hpi_scaffold
                ? `${ccProfile.label} OPQRST scaffold loaded — fill in bracket placeholders`
                : "Paste HPI from nurse note or EHR — onset, location, quality, severity, duration, modifying factors, associated symptoms..."
            }
            onRef={setRef(2)}
            onKeyDown={makeKeyDown(2, false, runMDM)}
          />
        </div>

        {/* Paste detection toast */}
        {hpiPastePrompt && !hpiSummary && (
          <div className="qn-fade" style={{
            marginTop:6, padding:"8px 12px", borderRadius:8,
            background:"rgba(59,158,255,.08)", border:"1px solid rgba(59,158,255,.3)",
            display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
          }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-blue)", letterSpacing:.4, flex:1 }}>
              Nursing note detected —
            </span>
            <button onClick={() => { structureHPI(); dismissPastePrompt(); }} disabled={hpiStructureBusy}
              style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11, border:"1px solid rgba(59,158,255,.5)", background:"rgba(59,158,255,.1)", color:"var(--qn-blue)" }}>
              ⊞ Structure
            </button>
            <button onClick={() => { summarizeHPI(); dismissPastePrompt(); }} disabled={hpiSumBusy}
              style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11, border:"1px solid rgba(0,229,192,.4)", background:"rgba(0,229,192,.07)", color:"var(--qn-teal)" }}>
              Σ Summarize
            </button>
            <button onClick={dismissPastePrompt}
              style={{ padding:"3px 7px", borderRadius:5, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, border:"1px solid rgba(42,79,122,.35)", background:"transparent", color:"var(--qn-txt4)" }}>✕</button>
          </div>
        )}

        {/* HPI action row: Structure + mode toggle */}
        {hpi.trim().length > 40 && (
          <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <button onClick={structureHPI} disabled={hpiStructureBusy}
              style={{
                padding:"3px 11px", borderRadius:6, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:`1px solid ${hpiStructureBusy ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.5)"}`,
                background:hpiStructureBusy ? "rgba(14,37,68,.4)" : "rgba(59,158,255,.1)",
                color:hpiStructureBusy ? "var(--qn-txt4)" : "var(--qn-blue)",
              }}>
              {hpiStructureBusy ? "● Structuring…" : "⊞ Structure"}
            </button>
            <span style={{ ...sectionLabel, flexShrink:0 }}>HPI in note:</span>
            {[
              { id:"original", label:"My HPI as entered" },
              { id:"summary",  label:"AI-generated summary" },
            ].map(({ id, label }) => {
              const isActive  = hpiMode === id;
              const isLoading = id === "summary" && hpiSumBusy;
              return (
                <button key={id}
                  onClick={() => {
                    setHpiMode(id);
                    if (id === "summary" && !hpiSummary && !hpiSumBusy) summarizeHPI();
                  }}
                  style={{
                    padding:"3px 11px", borderRadius:6, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:`1px solid ${isActive ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.35)"}`,
                    background:isActive ? "rgba(0,229,192,.12)" : "transparent",
                    color:isActive ? "var(--qn-teal)" : "var(--qn-txt4)",
                  }}>
                  {isLoading ? "● Generating…" : label}
                  {isActive && !isLoading && (
                    <span style={{ marginLeft:5, fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:"rgba(0,229,192,.6)" }}>✓ active</span>
                  )}
                </button>
              );
            })}
            {hpiSummary && hpiMode === "summary" && (
              <button onClick={summarizeHPI} disabled={hpiSumBusy}
                style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, border:"1px solid rgba(42,79,122,.3)", background:"transparent", color:"var(--qn-txt4)" }}>↺ Redo</button>
            )}
            {hpiSummary && (
              <button onClick={() => { setHpiSummary(null); setHpiMode("original"); }}
                style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, border:"1px solid rgba(42,79,122,.3)", background:"transparent", color:"var(--qn-txt4)" }}>Clear summary</button>
            )}
          </div>
        )}

        {/* OPQRST gap indicators */}
        {hpiGaps?.length > 0 && (
          <div style={{
            marginTop:6, padding:"6px 10px", borderRadius:7,
            background:"rgba(245,200,66,.06)", border:"1px solid rgba(245,200,66,.25)",
            display:"flex", alignItems:"flex-start", gap:8, flexWrap:"wrap",
          }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:"var(--qn-gold)", letterSpacing:.5, textTransform:"uppercase", flexShrink:0, paddingTop:1 }}>
              Not documented:
            </span>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {hpiGaps.map(gap => (
                <span key={gap} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-gold)", background:"rgba(245,200,66,.1)", border:"1px solid rgba(245,200,66,.25)", borderRadius:4, padding:"1px 7px", letterSpacing:.3 }}>
                  {gap}
                </span>
              ))}
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"rgba(245,200,66,.5)", alignSelf:"center", marginLeft:"auto" }}>
              Consider asking patient
            </span>
          </div>
        )}

        {/* Errors */}
        {hpiStructureError && (
          <div style={{ marginTop:6, padding:"6px 10px", borderRadius:7, background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
            {hpiStructureError}
          </div>
        )}
        {hpiSumError && (
          <div style={{ marginTop:6, padding:"6px 10px", borderRadius:7, background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
            {hpiSumError}
          </div>
        )}

        {/* Medical term auto-linker — only after physician has edited HPI, not on scaffold text */}
        {hpi.trim().length > 20 && hpiEdited && <MedTermHighlighter text={hpi} />}

        {/* HPI Summary / Structure preview card */}
        {hpiSummary && (
          <div className="qn-fade" style={{
            marginTop:8, padding:"12px 14px", borderRadius:10,
            background: hpiMode === "summary" ? "rgba(0,229,192,.05)" : "rgba(59,158,255,.04)",
            border:`1px solid ${hpiMode === "summary" ? "rgba(0,229,192,.35)" : "rgba(59,158,255,.25)"}`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color: hpiMode === "summary" ? "var(--qn-teal)" : "var(--qn-txt4)", letterSpacing:1.2, textTransform:"uppercase" }}>
                AI HPI Summary
              </span>
              {hpiMode === "summary"
                ? <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-teal)", background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.3)", borderRadius:4, padding:"1px 7px" }}>✓ In note</span>
                : <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)" }}>Preview — not active</span>
              }
              <div style={{ flex:1 }} />
              {summarizeFromStructure && (
                <button onClick={summarizeFromStructure} disabled={hpiSumBusy}
                  style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, border:`1px solid ${hpiSumBusy ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.4)"}`, background:hpiSumBusy ? "rgba(14,37,68,.4)" : "rgba(0,229,192,.08)", color:hpiSumBusy ? "var(--qn-txt4)" : "var(--qn-teal)" }}>
                  {hpiSumBusy ? "● Converting…" : "→ Convert to narrative"}
                </button>
              )}
              <button onClick={() => { navigator.clipboard.writeText(hpiSummary); setCopiedHpiSum(true); setTimeout(() => setCopiedHpiSum(false), 2000); }}
                style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, border:`1px solid ${copiedHpiSum ? "rgba(61,255,160,.5)" : "rgba(59,158,255,.4)"}`, background:copiedHpiSum ? "rgba(61,255,160,.1)" : "rgba(59,158,255,.08)", color:copiedHpiSum ? "var(--qn-green)" : "var(--qn-blue)" }}>
                {copiedHpiSum ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <textarea
              value={hpiSummary}
              onChange={e => setHpiSummary(e.target.value)}
              rows={Math.max(4, (hpiSummary || "").split("\n").length + 1)}
              style={{ width:"100%", boxSizing:"border-box", resize:"vertical", background:"transparent", border:"1px solid rgba(0,229,192,.15)", borderRadius:6, padding:"6px 8px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt2)", lineHeight:1.75, outline:"none" }}
              onFocus={e => e.target.style.borderColor = "rgba(0,229,192,.45)"}
              onBlur={e => e.target.style.borderColor = "rgba(0,229,192,.15)"}
            />
            <div style={{ marginTop:8, padding:"5px 9px", borderRadius:6, background:"rgba(245,200,66,.06)", border:"1px solid rgba(245,200,66,.2)", fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--qn-gold)", lineHeight:1.5 }}>
              ⚠ AI restructured from pasted text only — verify before charting.
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 3: REVIEW OF SYSTEMS
          v15.0: QuickNoteROSHelper IS the ROS field — KB mode, system grid,
          positive/negative toggles, all-negative quick action.
          No separate InputZone. No duplicate panel in QuickNote.jsx.
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:14 }}>

        {/* ROS label row */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:8, flexWrap:"wrap", gap:6,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={sectionLabel}>Review of Systems</span>
            {isCC && ccProfile.ros_sections?.length > 0 && (
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.3,
              }}>
                Systems: {ccProfile.ros_sections.join(" · ")}
              </span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {/* From HPI */}
            {hpi.trim().length > 30 && (
              <button onClick={autoRosFromHpi} disabled={autoRosBusy}
                style={{
                  padding:"2px 9px", borderRadius:5, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
                  border:`1px solid ${autoRosBusy ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.35)"}`,
                  background:autoRosBusy ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.07)",
                  color:autoRosBusy ? "var(--qn-txt4)" : "var(--qn-purple)",
                  letterSpacing:.4,
                }}>
                {autoRosBusy ? "● Generating…" : "✦ From HPI"}
              </button>
            )}
            <InlineCopyBtn getValue={() => ros} label="Copy ROS" />
          </div>
        </div>

        {/* QuickNoteROSHelper — the single ROS panel */}
        <QuickNoteROSHelper ros={ros} onChange={handleRosChange} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 4: PHYSICAL EXAM
          v15.0: QuickNoteExamHelper IS the PE field — KB mode, system grid,
          normal/abnormal toggles, all-normal quick action, abnormal textarea.
          No separate InputZone. No duplicate panel in QuickNote.jsx.
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:14 }}>

        {/* PE label row */}
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          marginBottom:8, flexWrap:"wrap",
        }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:6 }}>
            <span style={sectionLabel}>Physical Exam</span>
            {isCC && ccProfile.pe_sections?.length > 0 && (
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.3,
              }}>
                Components: {ccProfile.pe_sections.join(" · ")}
              </span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <InlineCopyBtn getValue={() => exam} label="Copy Exam" />
            <VoiceDictationButton
              fieldLabel="Physical Exam"
              compact
              onTranscript={(t) => setExam(prev => (prev ? prev.trimEnd() + " " + t.trimStart() : t.trimStart()))}
            />
          </div>
        </div>

        {/* QuickNoteExamHelper — the single PE panel */}
        <QuickNoteExamHelper exam={exam} onChange={handleExamChange} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          v14.0: KEY DIAGNOSTICS STRIP
          Only shown when CC profile is active and has key_diagnostics
      ══════════════════════════════════════════════════════════════════════ */}
      {isCC && ccProfile.key_diagnostics?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <button
            onClick={() => setDiagnosticsOpen(o => !o)}
            style={{
              width:"100%", display:"flex", alignItems:"center", gap:8,
              padding:"7px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
              background: diagnosticsOpen ? `${accentColor}08` : "rgba(14,37,68,.4)",
              border:`1px solid ${diagnosticsOpen ? accentColor + "35" : "rgba(42,79,122,.3)"}`,
              marginBottom: diagnosticsOpen ? 8 : 0,
            }}
          >
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:diagnosticsOpen ? accentColor : "var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase" }}>
              🔬 Suggested Diagnostics — {ccProfile.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"var(--qn-txt4)" }}>
              (informational · {checkedDiagnostics.size}/{ccProfile.key_diagnostics.length} noted)
            </span>
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--qn-txt4)" }}>
              {diagnosticsOpen ? "▲" : "▼"}
            </span>
          </button>

          {diagnosticsOpen && (
            <div style={{
              padding:"10px 12px",
              background:"rgba(14,37,68,.35)",
              border:`1px solid ${accentColor}20`,
              borderRadius:8,
              display:"flex", flexWrap:"wrap", gap:8,
            }}>
              {ccProfile.key_diagnostics.map((item) => {
                const checked = checkedDiagnostics.has(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleDiagnostic(item)}
                    style={{
                      display:"flex", alignItems:"center", gap:6,
                      padding:"4px 12px", borderRadius:16, cursor:"pointer",
                      border:`1px solid ${checked ? "rgba(61,255,160,.4)" : accentColor + "35"}`,
                      background: checked ? "rgba(61,255,160,.08)" : `${accentColor}06`,
                      transition:"all .15s",
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width:12, height:12, borderRadius:3, flexShrink:0,
                      border:`1.5px solid ${checked ? "#3dffa0" : accentColor + "60"}`,
                      background: checked ? "rgba(61,255,160,.2)" : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s",
                    }}>
                      {checked && <span style={{ fontSize:7, color:"#3dffa0", fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{
                      fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      fontWeight: checked ? 600 : 400,
                      color: checked ? "#3dffa0" : "var(--qn-txt2)",
                      transition:"all .15s",
                    }}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* v14.0: Risk Scores line */}
          {ccProfile.risk_scores?.length > 0 && (
            <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:"var(--qn-gold)", letterSpacing:.5 }}>
                Risk Scores:
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(245,200,66,.7)", letterSpacing:.3 }}>
                {ccProfile.risk_scores.join("  ·  ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 5: QUICK DDx (after ROS + Exam — needs full clinical picture)
      ══════════════════════════════════════════════════════════════════════ */}
      {(cc.trim().length > 5 || hpi.trim().length > 20) && !mdmResult && (
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={runQuickDDx} disabled={quickDDxBusy}
              style={{
                padding:"3px 12px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${quickDDxBusy ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.4)"}`,
                background:quickDDxBusy ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.08)",
                color:quickDDxBusy ? "var(--qn-txt4)" : "var(--qn-purple)",
                letterSpacing:.5, textTransform:"uppercase",
              }}>
              {quickDDxBusy ? "● Generating…" : "✦ Quick DDx"}
            </button>
            {quickDDxErr && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--qn-coral)" }}>
                {quickDDxErr}
              </span>
            )}
          </div>
          {quickDDx && !quickDDxDismissed && (
            <QuickDDxCard
              items={quickDDx}
              onDismiss={() => setQuickDDxDismissed(true)}
              onRerun={runQuickDDx}
              busy={quickDDxBusy}
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 6: BOUNCEBACK FLAG
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display:"flex", alignItems:"center", gap:10, marginBottom:12,
        padding:"8px 12px", borderRadius:8,
        background: isBounceback ? "rgba(255,107,107,.08)" : "rgba(14,37,68,.4)",
        border:`1px solid ${isBounceback ? "rgba(255,107,107,.4)" : "rgba(42,79,122,.3)"}`,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", flex:1 }}
          onClick={() => setIsBounceback(b => !b)}>
          <div style={{
            width:16, height:16, borderRadius:4, flexShrink:0,
            border:`2px solid ${isBounceback ? "var(--qn-coral)" : "rgba(42,79,122,.6)"}`,
            background:isBounceback ? "rgba(255,107,107,.2)" : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {isBounceback && <span style={{ fontSize:10, color:"var(--qn-coral)", lineHeight:1 }}>✓</span>}
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, color:isBounceback ? "var(--qn-coral)" : "var(--qn-txt4)" }}>
            Return visit within 72h
          </span>
          {isBounceback && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(255,107,107,.6)", letterSpacing:.4 }}>
              — bounceback added to MDM
            </span>
          )}
        </div>
        {isBounceback && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)" }}>Prior visit:</span>
            <input type="date" value={bouncebackDate} onChange={e => setBouncebackDate(e.target.value)}
              style={{ padding:"2px 7px", borderRadius:5, fontSize:10, background:"rgba(14,37,68,.8)", border:"1px solid rgba(255,107,107,.4)", color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 7: COPY CLINICAL INPUTS
      ══════════════════════════════════════════════════════════════════════ */}
      {(hpi.trim() || ros.trim() || exam.trim()) && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12, gap:6, flexWrap:"wrap" }} className="no-print">
          <button onClick={copyClinicalInputs}
            style={{
              padding:"4px 12px", borderRadius:7, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${copiedInputs ? "rgba(61,255,160,.5)" : "rgba(59,158,255,.35)"}`,
              background:copiedInputs ? "rgba(61,255,160,.1)" : "rgba(59,158,255,.07)",
              color:copiedInputs ? "var(--qn-green)" : "var(--qn-blue)",
              letterSpacing:.5, textTransform:"uppercase",
            }}>
            {copiedInputs ? "✓ Copied — paste into EHR" : "Copy HPI / ROS / PE"}
            {!copiedInputs && <span style={{ opacity:.5, marginLeft:4 }}>[Shift+C]</span>}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MEDICATIONS & ALLERGIES — Collapsible, collapsed by default
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:4 }}>
        <button
          onClick={() => setMedsOpen(o => !o)}
          style={{
            width:"100%", display:"flex", alignItems:"center", gap:8,
            padding:"8px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
            background: medsOpen ? "rgba(245,200,66,.06)" : "rgba(14,37,68,.4)",
            border:`1px solid ${medsOpen ? "rgba(245,200,66,.3)" : "rgba(42,79,122,.3)"}`,
          }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color: medsOpen ? "var(--qn-gold)" : "var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase" }}>
            💊 Medications & Allergies
          </span>
          {hasMedsData && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"var(--qn-gold)", background:"rgba(245,200,66,.1)", border:"1px solid rgba(245,200,66,.25)", borderRadius:4, padding:"1px 6px" }}>
              {parsedMeds?.length > 0 ? `${parsedMeds.length} med${parsedMeds.length > 1 ? "s" : ""}` : ""}
              {parsedMeds?.length > 0 && parsedAllergies?.length > 0 ? " · " : ""}
              {parsedAllergies?.length > 0 ? `${parsedAllergies.length} allerg${parsedAllergies.length > 1 ? "ies" : "y"}` : ""}
            </span>
          )}
          {(medsFromHpi?.length > 0 || allergiesFromHpi?.length > 0) && !hasMedsData && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"var(--qn-blue)", background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.25)", borderRadius:4, padding:"1px 6px" }}>
              meds found in HPI
            </span>
          )}
          <div style={{ flex:1 }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--qn-txt4)" }}>
            {medsOpen ? "▲ collapse" : "▼ expand"}
          </span>
        </button>

        {(medsOpen || hasMedsData) && (
          <div style={{ marginTop:8 }}>
            <MedsAllergyZone
              medsRaw={medsRaw}           setMedsRaw={setMedsRaw}
              allergiesRaw={allergiesRaw} setAllergiesRaw={setAllergiesRaw}
              parsedMeds={parsedMeds}     parsedAllergies={parsedAllergies}
              onParse={parseMedsAllergies}
              parsing={medsParsing}       parseError={medsError}
              onEditMed={(idx, field, val) =>
                setParsedMeds(prev => prev.map((m,i) => i===idx ? {...m,[field]:val} : m))
              }
              onRemoveMed={idx => setParsedMeds(prev => prev.filter((_,i) => i !== idx))}
              onEditAllergy={(idx, field, val) =>
                setParsedAllergies(prev => prev.map((a,i) => i===idx ? {...a,[field]:val} : a))
              }
              onRemoveAllergy={idx => setParsedAllergies(prev => prev.filter((_,i) => i !== idx))}
              medsFromHpi={medsFromHpi}
              allergiesFromHpi={allergiesFromHpi}
            />
          </div>
        )}
      </div>

      {/* NOTE: Generate Initial Impression button lives in QuickNote.jsx
          immediately below this panel. Do not add it here. */}

    </div>
  );
}