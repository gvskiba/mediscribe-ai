// PediatricModePanel.jsx
// Activates automatically when demo.age < 18.

import React, { useState, useMemo, useCallback } from "react";
import {
  getAgeBand, AGE_BAND_LABELS,
  interpretPedVitals, getVitalSummary, minSBP,
  estimateWeightFromAge, getBroscolowBandByWeight,
  PED_RSI_DRUGS, PED_ARREST_DRUGS, PED_EPI_ANAPHYLAXIS,
  defibEnergy, DEFIB_TYPES,
  ettSize,
  ivrFluid,
  getPedMedFlagsForList,
} from "@/components/npi/pediatricUtils";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

function statusColor(status) {
  switch (status) {
    case "critical_low":  return T.red;
    case "critical_high": return T.red;
    case "low":           return T.coral;
    case "high":          return T.orange;
    default:              return T.green;
  }
}

function statusLabel(status) {
  switch (status) {
    case "critical_low":  return "CRITICAL LOW";
    case "critical_high": return "CRITICAL HIGH";
    case "low":           return "LOW";
    case "high":          return "HIGH";
    default:              return "NORMAL";
  }
}

function Section({ title, icon, accent, open, onToggle, badge, children }) {
  const ac = accent || T.teal;
  return (
    <div style={{ marginBottom:6 }}>
      <button onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"8px 12px",
          background:open
            ? `linear-gradient(135deg,${ac}12,rgba(8,22,40,0.92))`
            : "rgba(8,22,40,0.6)",
          border:`1px solid ${open ? ac+"55" : "rgba(26,53,85,0.4)"}`,
          borderRadius:open ? "8px 8px 0 0" : 8,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:700, fontSize:12, color:open ? ac : T.txt3, flex:1 }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            padding:"1px 7px", borderRadius:4, letterSpacing:1,
            background:`${badge.color}18`, border:`1px solid ${badge.color}40`,
            color:badge.color, textTransform:"uppercase" }}>
            {badge.text}
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:open ? ac : T.txt4, letterSpacing:1, marginLeft:4 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding:"10px 12px",
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${ac}33`,
          borderTop:"none", borderRadius:"0 0 8px 8px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DoseRow({ drug, weightKg }) {
  const w = parseFloat(weightKg) || 0;
  if (!w) return (
    <div style={{ padding:"6px 9px", borderRadius:6, marginBottom:4,
      background:"rgba(14,37,68,0.5)",
      border:"1px solid rgba(26,53,85,0.3)" }}>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3 }}>
        {drug.name}
      </span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
        color:T.txt4, marginLeft:8 }}>enter weight to calculate</span>
    </div>
  );

  const rawDose = drug.dose * w;
  const isMin   = drug.minDose && rawDose < drug.minDose;
  const isMax   = drug.maxDose && rawDose > drug.maxDose;
  const dose    = isMin ? drug.minDose : isMax ? drug.maxDose : rawDose;

  const unit = drug.unit === "mcg/kg" ? "mcg" : drug.unit === "mEq/kg" ? "mEq" : "mg";
  const doseDisplay = `${dose % 1 === 0 ? dose : dose.toFixed(1)} ${unit}`;
  const cap = isMin ? "(MIN DOSE)" : isMax ? "(MAX DOSE)" : null;

  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10,
      padding:"7px 9px", borderRadius:7, marginBottom:4,
      background:"rgba(14,37,68,0.5)",
      border:`1px solid ${cap ? T.gold+"44" : "rgba(26,53,85,0.3)"}` }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:7, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            fontWeight:600, color:T.txt2 }}>{drug.name}</span>
          {drug.indication && (
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
              color:T.txt4 }}>{drug.indication}</span>
          )}
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, marginTop:2 }}>
          {drug.dose} {drug.unit} x {w} kg
          {cap && <span style={{ color:T.gold, marginLeft:6 }}>{cap}</span>}
        </div>
        {drug.conc && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
            color:T.txt4, marginTop:1 }}>Conc: {drug.conc}</div>
        )}
        {drug.note && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
            color:T.txt4, lineHeight:1.5, marginTop:2 }}>{drug.note}</div>
        )}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18,
          fontWeight:700,
          color:cap === "(MAX DOSE)" ? T.coral : cap === "(MIN DOSE)" ? T.gold : T.teal,
          lineHeight:1 }}>{doseDisplay}</div>
      </div>
    </div>
  );
}

export default function PediatricModePanel({ demo, vitals, medications, onToast }) {
  const ageYears = parseFloat(demo?.age);
  const ageBand  = getAgeBand(ageYears);

  const [sOvw,   setSovw]   = useState(true);
  const [sVit,   setSvit]   = useState(true);
  const [sMeds,  setSmeds]  = useState(false);
  const [sDef,   setSdef]   = useState(false);
  const [sEtt,   setSett]   = useState(false);
  const [sFluid, setSfluid] = useState(false);
  const [sSafe,  setSSafe]  = useState(false);

  const enteredWeight   = parseFloat(demo?.weight || vitals?.weight) || 0;
  const estimatedWeight = useMemo(() => estimateWeightFromAge(ageYears), [ageYears]);
  const [weightKg, setWeightKg] = useState(
    enteredWeight > 0 ? String(enteredWeight) : ""
  );

  const displayWeight  = parseFloat(weightKg) > 0 ? parseFloat(weightKg) : estimatedWeight;
  const broscolowBand  = useMemo(() => getBroscolowBandByWeight(displayWeight), [displayWeight]);
  const vitalInterp    = useMemo(() => interpretPedVitals(vitals, ageBand, ageYears), [vitals, ageBand, ageYears]);
  const vitalSummary   = useMemo(() => getVitalSummary(ageBand), [ageBand]);
  const abnormalVitals = vitalInterp.filter(v => v.status !== "normal");
  const medFlags       = useMemo(() => getPedMedFlagsForList(medications, ageYears), [medications, ageYears]);
  const ettCalc        = useMemo(() => ettSize(ageYears), [ageYears]);
  const bandLabel      = AGE_BAND_LABELS[ageBand] || ageBand;

  const copyWeight = useCallback(() => {
    navigator.clipboard.writeText(String(displayWeight));
    onToast?.(`Weight ${displayWeight} kg copied`, "success");
  }, [displayWeight, onToast]);

  if (!ageBand) return null;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      padding:"10px 14px", marginBottom:10,
      background:"linear-gradient(135deg,rgba(245,200,66,0.07),rgba(8,22,40,0.95))",
      border:"1px solid rgba(245,200,66,0.35)",
      borderLeft:"4px solid #f5c842",
      borderRadius:10 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center",
        gap:10, marginBottom:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:20 }}>🧒</span>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:14, color:T.gold }}>
              Pediatric Mode Active
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.txt4, letterSpacing:1, marginTop:1 }}>
              {ageYears}yr · {bandLabel}
              {broscolowBand && (
                <span style={{ marginLeft:10, color:broscolowBand.hex }}>
                  Broselow {broscolowBand.color}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Weight input */}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>
              Weight {parseFloat(weightKg) > 0 ? "(entered)" : "(estimated)"}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <input type="number" value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                placeholder={String(estimatedWeight)}
                style={{ width:60, padding:"4px 7px", textAlign:"right",
                  background:"rgba(14,37,68,0.8)",
                  border:`1px solid ${parseFloat(weightKg)>0 ? T.gold+"77" : "rgba(42,79,122,0.45)"}`,
                  borderRadius:6, outline:"none",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700,
                  color:parseFloat(weightKg)>0 ? T.gold : T.txt4 }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, color:T.txt4 }}>kg</span>
            </div>
          </div>
        </div>

        {abnormalVitals.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6,
            padding:"4px 10px", borderRadius:7,
            background:"rgba(255,68,68,0.1)",
            border:"1px solid rgba(255,68,68,0.35)" }}>
            <span style={{ fontSize:14 }}>⚠️</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.red, fontWeight:700, letterSpacing:1 }}>
              {abnormalVitals.length} VITAL{abnormalVitals.length > 1 ? "S" : ""} OUT OF RANGE
            </span>
          </div>
        )}

        {medFlags.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6,
            padding:"4px 10px", borderRadius:7,
            background:"rgba(255,107,107,0.1)",
            border:"1px solid rgba(255,107,107,0.35)" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.coral, fontWeight:700, letterSpacing:1 }}>
              {medFlags.length} MED SAFETY FLAG{medFlags.length > 1 ? "S" : ""}
            </span>
          </div>
        )}
      </div>

      {/* 1. OVERVIEW */}
      <Section title="Patient Overview" icon="📊" accent={T.gold}
        open={sOvw} onToggle={() => setSovw(p => !p)}>
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
          {[
            { label:"Age Band",     val:bandLabel,                                                       color:T.gold   },
            { label:"Weight",       val:`${displayWeight} kg${parseFloat(weightKg)>0 ? "" : " (est)"}`, color:T.teal   },
            { label:"Broselow",     val:broscolowBand ? `${broscolowBand.color} (${broscolowBand.ageApprox})` : "Beyond tape", color:broscolowBand?.hex || T.txt4 },
            { label:"ETT (cuffed)", val:ettCalc ? `${ettCalc.cuffed} mm`      : "—",                    color:T.blue   },
            { label:"ETT depth",    val:ettCalc ? `${ettCalc.depth} cm at lip`: "—",                    color:T.blue   },
            { label:"Min SBP",      val:minSBP(ageYears) ? `<${minSBP(ageYears)} = hypotension` : "—", color:T.orange },
          ].map(b => (
            <div key={b.label} style={{ padding:"7px 10px", borderRadius:8,
              background:`${b.color}0d`, border:`1px solid ${b.color}25` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1, textTransform:"uppercase",
                marginBottom:3 }}>{b.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                fontWeight:700, color:b.color }}>{b.val}</div>
            </div>
          ))}
        </div>

        {vitalSummary && (
          <div style={{ marginTop:8, padding:"8px 10px", borderRadius:7,
            background:"rgba(42,79,122,0.1)",
            border:"1px solid rgba(42,79,122,0.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:5 }}>Normal Ranges — {bandLabel}</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {Object.entries(vitalSummary).map(([k, v]) => (
                <div key={k} style={{ display:"flex", gap:5 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, color:T.txt4, textTransform:"uppercase" }}>{k}:</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, color:T.teal }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* 2. VITAL INTERPRETATION */}
      <Section title="Vital Sign Interpretation" icon="📈" accent={T.blue}
        open={sVit} onToggle={() => setSvit(p => !p)}
        badge={abnormalVitals.length > 0
          ? { text:`${abnormalVitals.length} abnormal`, color:T.coral }
          : { text:"normal", color:T.green }}>

        {vitalInterp.length === 0 ? (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt4, fontStyle:"italic" }}>
            Enter vitals in the Vitals tab to see age-adjusted interpretation.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {vitalInterp.map(v => {
              const col = statusColor(v.status);
              const isAbnormal = v.status !== "normal";
              return (
                <div key={v.param} style={{ display:"flex", alignItems:"center",
                  gap:10, padding:"8px 10px", borderRadius:8,
                  background:isAbnormal ? `${col}0d` : "rgba(8,22,40,0.45)",
                  border:`1px solid ${isAbnormal ? col+"44" : "rgba(26,53,85,0.3)"}` }}>
                  <div style={{ width:32, flexShrink:0,
                    fontFamily:"'JetBrains Mono',monospace",
                    fontSize:10, fontWeight:700, color:T.txt4 }}>{v.param}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:16, fontWeight:700, color:col,
                    flexShrink:0, minWidth:60 }}>
                    {v.value} {v.unit}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, fontWeight:700, color:col,
                      letterSpacing:1, textTransform:"uppercase" }}>
                      {statusLabel(v.status)}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:9, color:T.txt4, marginTop:1 }}>{v.range}</div>
                  </div>
                  {v.hint && (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                      color:col, textAlign:"right", maxWidth:160 }}>{v.hint}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* 3. MEDICATION DOSING */}
      <Section title="Medication Dosing (PALS / Peds)" icon="💊" accent={T.orange}
        open={sMeds} onToggle={() => setSmeds(p => !p)}>

        {!displayWeight && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.gold, marginBottom:8 }}>
            Enter weight above for live dose calculations
          </div>
        )}

        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:6 }}>RSI / SEDATION</div>
        {PED_RSI_DRUGS.map(d => <DoseRow key={d.name} drug={d} weightKg={displayWeight} />)}

        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:6, marginTop:10 }}>CARDIAC ARREST / RESUSCITATION</div>
        {PED_ARREST_DRUGS.map(d => <DoseRow key={d.name} drug={d} weightKg={displayWeight} />)}

        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:6, marginTop:10 }}>ANAPHYLAXIS</div>
        <DoseRow drug={PED_EPI_ANAPHYLAXIS} weightKg={displayWeight} />
      </Section>

      {/* 4. DEFIBRILLATION */}
      <Section title="Defibrillation / Cardioversion" icon="⚡" accent={T.red}
        open={sDef} onToggle={() => setSdef(p => !p)}>
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:7 }}>
          {DEFIB_TYPES.map(dt => {
            const energy = defibEnergy(displayWeight, dt.id);
            return (
              <div key={dt.id} style={{ padding:"9px 11px", borderRadius:8,
                background:"rgba(255,68,68,0.07)",
                border:"1px solid rgba(255,68,68,0.25)" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.txt3, marginBottom:3 }}>{dt.label}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:20, fontWeight:700, color:T.red }}>
                    {displayWeight > 0 ? energy : "—"}
                  </span>
                  {displayWeight > 0 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:10, color:T.txt4 }}>J</span>
                  )}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4, marginTop:2 }}>{dt.formula}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 5. ETT SIZING */}
      <Section title="ETT Sizing" icon="😮" accent={T.purple}
        open={sEtt} onToggle={() => setSett(p => !p)}>
        {ettCalc ? (
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:7 }}>
            {[
              { label:"Cuffed ETT",      val:`${ettCalc.cuffed} mm`,      color:T.purple },
              { label:"Uncuffed ETT",    val:`${ettCalc.uncuffed} mm`,    color:T.teal   },
              { label:"Insertion Depth", val:`${ettCalc.depth} cm (lip)`, color:T.blue   },
            ].map(b => (
              <div key={b.label} style={{ padding:"9px 11px", borderRadius:8,
                background:`${b.color}0d`, border:`1px solid ${b.color}25` }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.txt4, marginBottom:3 }}>{b.label}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:18, fontWeight:700, color:b.color }}>{b.val}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt4 }}>Enter patient age to calculate ETT size.</div>
        )}
        <div style={{ marginTop:8, fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, lineHeight:1.5 }}>
          Cuffed: (age/4) + 3.5 · Uncuffed: (age/4) + 4 · Depth: (age/2) + 12
          · Broselow tape takes precedence. Have size above and below available.
        </div>
      </Section>

      {/* 6. FLUID RESUSCITATION */}
      <Section title="Fluid Resuscitation" icon="💧" accent={T.teal}
        open={sFluid} onToggle={() => setSfluid(p => !p)}>
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:7, marginBottom:8 }}>
          {[
            { label:"Sepsis Initial Bolus", sub:"20 mL/kg NS or LR",
              val:displayWeight > 0 ? `${ivrFluid(displayWeight,"bolus_20")} mL` : "—", color:T.coral },
            { label:"Cautious Bolus",       sub:"10 mL/kg (cardiac/renal)",
              val:displayWeight > 0 ? `${ivrFluid(displayWeight,"bolus_10")} mL` : "—", color:T.orange },
            { label:"Daily Maintenance",    sub:"Holliday-Segar (mL/day)",
              val:displayWeight > 0 ? `${ivrFluid(displayWeight,"maintenance")} mL/day` : "—", color:T.blue },
          ].map(b => (
            <div key={b.label} style={{ padding:"9px 11px", borderRadius:8,
              background:`${b.color}0d`, border:`1px solid ${b.color}28` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                fontWeight:600, color:T.txt3, marginBottom:1 }}>{b.label}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                color:T.txt4, marginBottom:4 }}>{b.sub}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:16, fontWeight:700, color:b.color }}>{b.val}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:"7px 10px", borderRadius:7,
          background:"rgba(42,79,122,0.1)",
          border:"1px solid rgba(42,79,122,0.25)",
          fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, lineHeight:1.6 }}>
          Reassess after each bolus — stop if hepatomegaly, crackles, or respiratory
          distress. PALS max: 60 mL/kg total in 1h unless cardiogenic shock.
        </div>
      </Section>

      {/* 7. MEDICATION SAFETY FLAGS */}
      <Section title="Medication Safety Flags" icon="⛔" accent={T.coral}
        open={sSafe} onToggle={() => setSSafe(p => !p)}
        badge={medFlags.length > 0
          ? { text:`${medFlags.length} flag${medFlags.length>1?"s":""}`, color:T.coral }
          : { text:"no flags", color:T.green }}>

        {medFlags.length === 0 ? (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.green }}>
            No pediatric medication safety flags detected.
          </div>
        ) : (
          <div>
            {medFlags.map((f, i) => (
              <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                marginBottom:5, background:"rgba(255,107,107,0.08)",
                border:"1px solid rgba(255,107,107,0.3)" }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:7, marginBottom:3 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:10, fontWeight:700, color:T.coral }}>{f.drug}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.coral, letterSpacing:1, textTransform:"uppercase",
                    background:"rgba(255,107,107,0.1)",
                    border:"1px solid rgba(255,107,107,0.3)",
                    borderRadius:4, padding:"1px 6px" }}>PEDS CAUTION</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt2, lineHeight:1.55 }}>{f.reason}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop:8, padding:"6px 9px", borderRadius:6,
          background:"rgba(42,79,122,0.1)",
          border:"1px solid rgba(42,79,122,0.25)",
          fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, lineHeight:1.5 }}>
          Checks: codeine, tramadol, aspirin (Reye), promethazine (&lt;2yr),
          fluoroquinolones, tetracyclines (&lt;8yr), and other age-specific concerns.
          Always verify against current formulary.
        </div>
      </Section>

      <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace",
        fontSize:7.5, color:"rgba(42,79,122,0.5)", letterSpacing:1 }}>
        NOTRYA PEDIATRIC MODE · BROSELOW 2011 · PALS 2020 · AHA · VERIFY ALL DOSES INDEPENDENTLY
      </div>
    </div>
  );
}