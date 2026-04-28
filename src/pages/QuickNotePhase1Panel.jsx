// QuickNotePhase1Panel.jsx
// Phase 1 input card: CC, Vitals, HPI, ROS, Exam, QuickDDx, Meds, Generate MDM
// Exported: Phase1Panel

import React from "react";
import { InputZone, MedsAllergyZone, QuickDDxCard } from "./QuickNoteComponents";

export function Phase1Panel({
  // Core inputs
  cc, setCC, vitals, setVitals, hpi, setHpi, ros, setRos, exam, setExam,
  encounterType, setEncounterType,
  // HPI summary
  hpiMode, setHpiMode, hpiSummary, setHpiSummary,
  hpiSumBusy, hpiSumError, copiedHpiSum, setCopiedHpiSum,
  summarizeHPI,
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
  // Submit
  runMDM,
  // Bounceback
  isBounceback, setIsBounceback, bouncebackDate, setBouncebackDate,
  // Auto-ROS
  autoRosFromHpi, autoRosBusy,
  // Extra props (pregnancy, weight, smartExpansions)
  patientPregnant, setPatientPregnant,
  patientWeight, setPatientWeight,
  smartExpansions,
}) {
  return (
    <div style={{ marginBottom:14,
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(42,79,122,.4)",
      borderRadius:14, padding:"16px" }}>

      {/* Phase header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ width:24, height:24, borderRadius:"50%",
          background:"rgba(0,229,192,.15)", border:"1px solid rgba(0,229,192,.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          fontWeight:700, color:"var(--qn-teal)", flexShrink:0 }}>1</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:15, color:"var(--qn-teal)" }}>Initial Assessment</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:.8 }}>
            Paste nurse note fields → AI generates MDM
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
              style={{ padding:"3px 9px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                letterSpacing:.4, transition:"all .12s",
                border:`1px solid ${encounterType === id ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.35)"}`,
                background:encounterType === id ? "rgba(0,229,192,.12)" : "transparent",
                color:encounterType === id ? "var(--qn-teal)" : "var(--qn-txt4)" }}>
              {label}
            </button>
          ))}
        </div>
        {mdmResult && (
          <div style={{ display:"flex", alignItems:"center", gap:6,
            padding:"4px 10px", borderRadius:7,
            background:"rgba(61,255,160,.08)", border:"1px solid rgba(61,255,160,.3)" }}>
            <div style={{ width:7, height:7, borderRadius:"50%",
              background:"var(--qn-green)", flexShrink:0 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--qn-green)", letterSpacing:.5 }}>
              MDM · {mdmResult.mdm_level}
            </span>
          </div>
        )}
      </div>

      {/* CC + Vitals row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <InputZone label="Chief Complaint" value={cc} onChange={setCC} phase={1}
          rows={2} templateType="cc" smartfill kbdHint="Alt+H"
          placeholder="e.g. Chest pain, sharp, onset 2h ago — or press T to select"
          onRef={setRef(0)}
          onKeyDown={makeKeyDown(0, false, runMDM)} />
        <InputZone label="Triage Vitals" value={vitals} onChange={setVitals} phase={1}
          rows={2}
          vitalsTrendLink={() => {
            const url = "/VitalsHub" + (vitals.trim() ? "?v=" + encodeURIComponent(vitals.trim()) : "");
            window.location.href = url;
          }}
          placeholder="e.g. HR 102 BP 148/92 RR 18 SpO2 96% T 37.4°C"
          onRef={setRef(1)}
          onKeyDown={makeKeyDown(1, false, runMDM)} />
      </div>

      {/* HPI */}
      <div style={{ marginBottom:12 }}>
        <InputZone label="HPI" value={hpi} onChange={setHpi} phase={1}
          rows={5} copyable kbdHint="Alt+H"
          placeholder="Paste HPI from nurse note or EHR — onset, location, quality, severity, duration, modifying factors, associated symptoms..."
          onRef={setRef(2)}
          onKeyDown={makeKeyDown(2, false, runMDM)} />

        {/* HPI mode toggle */}
        {hpi.trim().length > 40 && (
          <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--qn-txt4)", letterSpacing:.5, textTransform:"uppercase",
              flexShrink:0 }}>HPI in note:</span>
            {[
              { id:"original", label:"My HPI as entered" },
              { id:"summary",  label:"AI-generated summary" },
            ].map(({ id, label }) => {
              const isActive = hpiMode === id;
              const isLoading = id === "summary" && hpiSumBusy;
              return (
                <button key={id}
                  onClick={() => {
                    setHpiMode(id);
                    if (id === "summary" && !hpiSummary && !hpiSumBusy) summarizeHPI();
                  }}
                  style={{ padding:"3px 11px", borderRadius:6, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    transition:"all .15s",
                    border:`1px solid ${isActive ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.35)"}`,
                    background:isActive ? "rgba(0,229,192,.12)" : "transparent",
                    color:isActive ? "var(--qn-teal)" : "var(--qn-txt4)" }}>
                  {isLoading ? "● Generating…" : label}
                  {isActive && !isLoading && (
                    <span style={{ marginLeft:5, fontSize:9,
                      fontFamily:"'JetBrains Mono',monospace",
                      color:"rgba(0,229,192,.6)" }}>✓ active</span>
                  )}
                </button>
              );
            })}
            {hpiSummary && hpiMode === "summary" && (
              <button onClick={summarizeHPI} disabled={hpiSumBusy}
                style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  border:"1px solid rgba(42,79,122,.3)", background:"transparent",
                  color:"var(--qn-txt4)", transition:"all .15s" }}>↺ Redo</button>
            )}
            {hpiSummary && (
              <button onClick={() => { setHpiSummary(null); setHpiMode("original"); }}
                style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  border:"1px solid rgba(42,79,122,.3)", background:"transparent",
                  color:"var(--qn-txt4)", transition:"all .15s" }}>Clear summary</button>
            )}
          </div>
        )}

        {hpiSumError && (
          <div style={{ marginTop:6, padding:"6px 10px", borderRadius:7,
            background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
            {hpiSumError}
          </div>
        )}

        {/* HPI Summary preview card */}
        {hpiSummary && (
          <div className="qn-fade" style={{ marginTop:8, padding:"12px 14px",
            borderRadius:10,
            background: hpiMode === "summary" ? "rgba(0,229,192,.05)" : "rgba(59,158,255,.04)",
            border:`1px solid ${hpiMode === "summary" ? "rgba(0,229,192,.35)" : "rgba(59,158,255,.25)"}`,
            transition:"all .2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                fontWeight:700,
                color: hpiMode === "summary" ? "var(--qn-teal)" : "var(--qn-txt4)",
                letterSpacing:1.2, textTransform:"uppercase", transition:"color .2s" }}>
                AI HPI Summary
              </span>
              {hpiMode === "summary" ? (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-teal)", background:"rgba(0,229,192,.1)",
                  border:"1px solid rgba(0,229,192,.3)", borderRadius:4,
                  padding:"1px 7px", letterSpacing:.4 }}>✓ In note</span>
              ) : (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", letterSpacing:.3 }}>Preview — not active</span>
              )}
              <div style={{ flex:1 }} />
              <button onClick={() => {
                  navigator.clipboard.writeText(hpiSummary);
                  setCopiedHpiSum(true);
                  setTimeout(() => setCopiedHpiSum(false), 2000);
                }}
                style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${copiedHpiSum ? "rgba(61,255,160,.5)" : "rgba(59,158,255,.4)"}`,
                  background:copiedHpiSum ? "rgba(61,255,160,.1)" : "rgba(59,158,255,.08)",
                  color:copiedHpiSum ? "var(--qn-green)" : "var(--qn-blue)",
                  letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
                {copiedHpiSum ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--qn-txt2)", lineHeight:1.75 }}>
              {hpiSummary}
            </div>
            <div style={{ marginTop:8, padding:"5px 9px", borderRadius:6,
              background:"rgba(245,200,66,.06)", border:"1px solid rgba(245,200,66,.2)",
              fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:"var(--qn-gold)", lineHeight:1.5 }}>
              ⚠ AI restructured from pasted text only — no details were added or inferred.
              Verify against original HPI before charting.
            </div>
          </div>
        )}
      </div>

      {/* ROS + Exam row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
        <InputZone label="Review of Systems" value={ros} onChange={setRos} phase={1}
          rows={4} copyable templateType="ros" smartfill kbdHint="Alt+R"
          placeholder="Paste ROS, or press T to insert a template..."
          onRef={setRef(3)}
          onKeyDown={makeKeyDown(3, false, runMDM)} />
        <InputZone label="Physical Exam" value={exam} onChange={setExam} phase={1}
          rows={4} copyable templateType="pe" smartfill kbdHint="Alt+E"
          placeholder="Paste physical exam, or press T to insert a template..."
          onRef={setRef(4)}
          onKeyDown={makeKeyDown(4, true, runMDM)} />
      </div>

      {/* Quick DDx */}
      {(cc.trim().length > 5 || hpi.trim().length > 20) && !mdmResult && (
        <div style={{ marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={runQuickDDx} disabled={quickDDxBusy}
              style={{ padding:"3px 12px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${quickDDxBusy ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.4)"}`,
                background:quickDDxBusy ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.08)",
                color:quickDDxBusy ? "var(--qn-txt4)" : "var(--qn-purple)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {quickDDxBusy ? "● Generating…" : "✦ Quick DDx"}
            </button>
            {quickDDxErr && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"var(--qn-coral)" }}>{quickDDxErr}</span>
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

      {/* Medications & Allergies */}
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
      />

      {/* Copy clinical inputs button */}
      {(hpi.trim() || ros.trim() || exam.trim()) && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:8, gap:6, flexWrap:"wrap" }}
          className="no-print">
          {/* Auto-populate ROS from HPI */}
          {hpi.trim().length > 30 && (
            <button onClick={autoRosFromHpi} disabled={autoRosBusy}
              style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${autoRosBusy ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.4)"}`,
                background:autoRosBusy ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.07)",
                color:autoRosBusy ? "var(--qn-txt4)" : "var(--qn-purple)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {autoRosBusy ? "● Generating…" : "✦ Auto-ROS from HPI"}
            </button>
          )}
          <button onClick={copyClinicalInputs}
            style={{ padding:"4px 12px", borderRadius:7, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${copiedInputs ? "rgba(61,255,160,.5)" : "rgba(59,158,255,.35)"}`,
              background:copiedInputs ? "rgba(61,255,160,.1)" : "rgba(59,158,255,.07)",
              color:copiedInputs ? "var(--qn-green)" : "var(--qn-blue)",
              letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
            {copiedInputs ? "✓ Copied — paste into EHR" : "Copy HPI / ROS / PE  "}
            {!copiedInputs && <span style={{ opacity:.5 }}>[Shift+C]</span>}
          </button>
        </div>
      )}

      {/* Bounceback flag */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10,
        padding:"8px 12px", borderRadius:8,
        background: isBounceback ? "rgba(255,107,107,.08)" : "rgba(14,37,68,.4)",
        border:`1px solid ${isBounceback ? "rgba(255,107,107,.4)" : "rgba(42,79,122,.3)"}`,
        transition:"all .2s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer",
          flex:1 }} onClick={() => setIsBounceback(b => !b)}>
          <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
            border:`2px solid ${isBounceback ? "var(--qn-coral)" : "rgba(42,79,122,.6)"}`,
            background:isBounceback ? "rgba(255,107,107,.2)" : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .15s" }}>
            {isBounceback && <span style={{ fontSize:10, color:"var(--qn-coral)", lineHeight:1 }}>✓</span>}
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
            color:isBounceback ? "var(--qn-coral)" : "var(--qn-txt4)" }}>
            Return visit within 72h
          </span>
          {isBounceback && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"rgba(255,107,107,.6)", letterSpacing:.4 }}>
              — bounceback documentation added to MDM
            </span>
          )}
        </div>
        {isBounceback && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--qn-txt4)" }}>Prior visit:</span>
            <input type="date" value={bouncebackDate}
              onChange={e => setBouncebackDate(e.target.value)}
              style={{ padding:"2px 7px", borderRadius:5, fontSize:10,
                background:"rgba(14,37,68,.8)", border:"1px solid rgba(255,107,107,.4)",
                color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace",
                outline:"none" }} />
          </div>
        )}
      </div>

      {/* Generate MDM button */}
      <button className="qn-btn" onClick={runMDM}
        disabled={p1Busy || !phase1Ready}
        style={{ width:"100%",
          border:`1px solid ${!phase1Ready || p1Busy ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.5)"}`,
          background:!phase1Ready || p1Busy
            ? "rgba(14,37,68,.5)"
            : "linear-gradient(135deg,rgba(0,229,192,.15),rgba(0,229,192,.04))",
          color:!phase1Ready || p1Busy ? "var(--qn-txt4)" : "var(--qn-teal)" }}>
        {p1Busy ? (
          <><span className="qn-busy-dot">●</span>Generating MDM...</>
        ) : (
          <>✦ Generate MDM  <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, opacity:.6 }}>[Cmd+Enter]</span></>
        )}
      </button>

      {p1Error && (
        <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
          background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
          {p1Error}
        </div>
      )}
    </div>
  );
}