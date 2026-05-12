import { useState } from "react";

// ── Font Loader ──────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#0a1628", glass: "rgba(255,255,255,0.04)", glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)", teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G    = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg)     => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)      => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.blue) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

// ── Data ─────────────────────────────────────────────────────────────────────
const PHENOTYPES = [
  {
    quad: "Warm & Wet", prev: "~65%", color: T.teal, bg: "rgba(20,184,166,0.09)",
    icon: "💧", perfusion: "Adequate", congestion: "Present",
    signs: ["Warm extremities", "Adequate mentation", "Normal-strong pulse", "Elevated JVP", "Orthopnea / PND", "Rales · S3 · edema", "Elevated BNP"],
    action: "Diuresis + Vasodilation",
    strategy: "Loop diuretics + IV nitroglycerin (if elevated BP) · NPPV if respiratory distress",
  },
  {
    quad: "Cold & Wet", prev: "~25%", color: T.amber, bg: "rgba(251,146,60,0.09)",
    icon: "🌊", perfusion: "Reduced", congestion: "Present",
    signs: ["Cool / mottled extremities", "Confusion / obtundation", "Oliguria (< 0.5 mL/kg/h)", "Narrow pulse pressure", "Hypotension", "Elevated JVP", "Pulmonary edema"],
    action: "Inotropes + Careful Diuresis",
    strategy: "Dobutamine or milrinone → then diurese once perfusion restored · Vasopressors if MAP < 65",
  },
  {
    quad: "Cold & Dry", prev: "~5%", color: T.coral, bg: "rgba(244,63,94,0.09)",
    icon: "🏜️", perfusion: "Reduced", congestion: "Absent",
    signs: ["Cool extremities", "Hypotension", "Flat JVP / low PCWP", "No pulmonary edema", "Narrow pulse pressure", "Low urine output"],
    action: "Volume Challenge + Inotropes",
    strategy: "Cautious 250–500 mL NS bolus to assess preload responsiveness → inotropes · Consider RV failure + PE",
  },
  {
    quad: "Warm & Dry", prev: "Compensated", color: T.green, bg: "rgba(34,197,94,0.07)",
    icon: "✓", perfusion: "Adequate", congestion: "Absent",
    signs: ["Warm extremities", "Alert", "Normal JVP", "No orthopnea", "Normal urine output"],
    action: "Optimize Oral Medications",
    strategy: "Not acute ADHF · titrate outpatient regimen · ensure medication compliance · close follow-up",
  },
];

const FAILURE = [
  { l: "F", w: "Forgot Medications",        d: "Non-compliance most common precipitant · dietary salt / fluid excess · financial barriers" },
  { l: "A", w: "Arrhythmia",                d: "Atrial fibrillation most common · rapid ventricular response → reduced filling time · new LBBB" },
  { l: "I", w: "Ischemia / Infarction",     d: "Acute MI precipitating ADHF · silent MI in diabetics · demand ischemia from any cause" },
  { l: "L", w: "Lifestyle / Load",          d: "Dietary sodium excess · fluid overload · excessive IV fluids from another hospitalization" },
  { l: "U", w: "Uncontrolled Hypertension", d: "Pressure overload → decompensation · especially in HFpEF · hypertensive emergency" },
  { l: "R", w: "Renal Failure",             d: "Cardiorenal syndrome · CKD progression · NSAIDs · contrast nephropathy · AKI" },
  { l: "E", w: "Embolism / Other",          d: "PE (RV strain → RV failure) · infection / sepsis · thyroid disease · anemia · valvular dysfunction · medication changes" },
];

const DIURETICS = [
  { drug: "Furosemide",     equiv: "—",                  iv: "40–200 mg IV push or 5–40 mg/h infusion", po: "20–160 mg", note: "If on home dose: give 2.5× home dose IV (DOSE trial)", color: T.teal },
  { drug: "Bumetanide",     equiv: "≈ 40 mg furosemide", iv: "1–3 mg IV push",                          po: "0.5–2 mg",  note: "More lipid-soluble — may work when furosemide is insufficient", color: T.teal },
  { drug: "Torsemide",      equiv: "≈ 40 mg furosemide", iv: "10–20 mg IV",                             po: "10–40 mg",  note: "Higher oral bioavailability (80% vs 50% furosemide) · preferred in some guidelines", color: T.teal },
  { drug: "Metolazone",     equiv: "Synergist",           iv: "—",                                        po: "2.5–5 mg",  note: "Add 30–60 min before loop diuretic for diuretic resistance · monitor K⁺/Cr", color: T.gold },
  { drug: "Chlorothiazide", equiv: "Synergist",           iv: "500 mg IV",                               po: "500 mg",    note: "IV option for diuretic resistance when oral not tolerated", color: T.gold },
];

const INOTROPES = [
  { drug: "Dobutamine",     dose: "2–20 mcg/kg/min",       color: T.amber,
    moa: "β1 agonist — positive inotropy + mild vasodilation",
    best: "Low EF with poor perfusion · first-line inotrope",
    caution: "Tachycardia · arrhythmias · tolerance with prolonged use · avoid in obstructive cardiomyopathy" },
  { drug: "Milrinone",      dose: "0.125–0.75 mcg/kg/min", color: T.purple,
    moa: "PDE-3 inhibitor — inotrope + vasodilator (lusitropic)",
    best: "Beta-blocked patients · pulmonary hypertension · bridge to transplant",
    caution: "Vasodilation → hypotension · accumulates in renal failure · caution in ischemic HF" },
  { drug: "Dopamine",       dose: "2–20 mcg/kg/min",       color: T.blue,
    moa: "Low: dopaminergic (renal) · Mid (5–10): β1 · High (>10): α1 vasoconstriction",
    best: "Cardiogenic shock with hypotension requiring vasopressor + inotrope",
    caution: "Tachyarrhythmias · higher mortality than NE in shock (SOAP II)" },
  { drug: "Norepinephrine", dose: "0.01–0.5 mcg/kg/min",   color: T.coral,
    moa: "α1 + β1 agonist — vasopressor + mild inotrope",
    best: "Cardiogenic shock (SOAP II trial — preferred over dopamine) · MAP support",
    caution: "Increases afterload (may worsen HF) · requires hemodynamic monitoring · combination with inotrope often needed" },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function ADHFHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]           = useState(0);
  const [phenotype, setPhenotype] = useState(null);
  const [homeDose, setHomeDose]   = useState("");
  const [wt, setWt]               = useState("");
  const [nppvMode, setNppvMode]   = useState("CPAP");
  const TABS = ["Recognition", "Treatment", "Workup", "Monitoring"];

  const furoIVDose = homeDose && !isNaN(homeDose)
    ? (parseFloat(homeDose) * 2.5).toFixed(0) : null;

  const dobuDose = wt && !isNaN(wt) ? {
    low:  (parseFloat(wt) * 2).toFixed(1),
    mid:  (parseFloat(wt) * 10).toFixed(1),
    high: (parseFloat(wt) * 20).toFixed(1),
  } : null;

  const selPheno = PHENOTYPES.find(p => p.quad === phenotype);

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.blue, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>Stevenson / Forrester Classification</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Classify by perfusion (warm vs. cold) and congestion (wet vs. dry). Treatment strategy flows directly from phenotype. Tap a quadrant to expand.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {PHENOTYPES.map(p => (
          <div key={p.quad}
            style={{ ...G(), padding: "13px 14px", border: `1.5px solid ${phenotype === p.quad ? p.color + "70" : T.border}`, background: phenotype === p.quad ? p.bg : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setPhenotype(phenotype === p.quad ? null : p.quad)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span style={{ ...tag(p.color), fontSize: 9 }}>{p.prev}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 3 }}>{p.quad}</div>
            <div style={{ fontSize: 10.5, color: T.muted, lineHeight: 1.4 }}>{p.action}</div>
          </div>
        ))}
      </div>

      {selPheno && (
        <div style={{ ...card({ border: `1.5px solid ${selPheno.color}55`, marginBottom: 14 }) }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>{selPheno.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: selPheno.color }}>{selPheno.quad}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>Perfusion: {selPheno.perfusion} · Congestion: {selPheno.congestion}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {selPheno.signs.map((s, i) => <span key={i} style={{ ...tag(selPheno.color), fontSize: 10 }}>{s}</span>)}
          </div>
          <div style={aBox(selPheno.color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: selPheno.color, marginBottom: 3 }}>→ Strategy</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selPheno.strategy}</div>
          </div>
        </div>
      )}

      <div style={sL()}>Bedside Assessment</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "WARM (Adequate Perfusion)", color: T.green,
            signs: ["Warm, pink extremities", "Alert and oriented", "UO ≥ 0.5 mL/kg/h", "Normal-wide pulse pressure", "Capillary refill < 2s"] },
          { label: "COLD (Poor Perfusion)", color: T.coral,
            signs: ["Cool, mottled extremities", "Confusion / somnolence", "Oliguria < 0.5 mL/kg/h", "Narrow pulse pressure < 25 mmHg", "Capillary refill > 3s"] },
          { label: "WET (Congested)", color: T.blue,
            signs: ["Orthopnea / PND", "JVD present", "Pulmonary rales", "S3 gallop", "Pitting edema / ascites"] },
          { label: "DRY (Not Congested)", color: T.teal,
            signs: ["No orthopnea", "Flat jugular veins", "Clear lungs", "No peripheral edema", "Normal PCWP / IVC"] },
        ].map(({ label, color, signs }) => (
          <div key={label} style={card({ padding: "11px 12px", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 7 }}>{label}</div>
            {signs.map((s, i) => <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color }}>●</span>{s}</div>)}
          </div>
        ))}
      </div>

      <div style={sL(T.amber)}>Precipitants — FAILURE Mnemonic</div>
      {FAILURE.map(({ l, w, d }) => (
        <div key={l + w} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.amber + "22", border: `1.5px solid ${T.amber}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.amber, fontFamily: T.mono, flexShrink: 0 }}>{l}</div>
          <div><div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{w}</div><div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.45 }}>{d}</div></div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={sL()}>Step 1 — Diuresis (Warm &amp; Wet · Cold &amp; Wet after perfusion restored)</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 10 }}>IV Furosemide Dose Calculator (DOSE Trial)</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={homeDose} onChange={e => setHomeDose(e.target.value)} placeholder="Home PO furosemide dose (mg)"
            type="number" style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>mg/day</span>
        </div>
        {furoIVDose ? (
          <div style={aBox(T.teal, 0)}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>Recommended IV dose (2.5× home daily dose)</div>
            <div style={{ fontFamily: T.mono, fontSize: 20, color: T.teal, fontWeight: 700 }}>{furoIVDose} mg IV</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>Give as IV push or divide q 8–12h · or continuous infusion {(parseFloat(furoIVDose) / 24).toFixed(1)} mg/h</div>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: T.dim }}>
            Not on home furosemide: start <span style={{ fontFamily: T.mono, color: T.teal }}>40–80 mg IV</span> push · reassess at 2h
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        {DIURETICS.map(({ drug, equiv, iv, po, note, color }) => (
          <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{drug}</span>
              {equiv !== "—" && <span style={{ fontSize: 10.5, color: T.dim }}>{equiv}</span>}
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: T.muted }}>IV: <span style={{ fontFamily: T.mono, color: T.white }}>{iv}</span></span>
              {po !== "—" && <span style={{ fontSize: 11, color: T.muted }}>PO: <span style={{ fontFamily: T.mono, color: T.white }}>{po}</span></span>}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Step 2 — NPPV (Non-Invasive Positive Pressure Ventilation)</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["CPAP", "BiPAP"].map(m => (
            <button key={m} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${nppvMode === m ? T.purple : T.border}`, background: nppvMode === m ? "rgba(167,139,250,0.18)" : T.glass, color: nppvMode === m ? T.purple : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}
              onClick={() => setNppvMode(m)}>{m}</button>
          ))}
        </div>
        {nppvMode === "CPAP" ? (
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.purple, marginBottom: 6 }}>CPAP 5–10 cmH₂O</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
              Preferred for pulmonary edema · reduces preload by increasing intrathoracic pressure · improves oxygenation without backup rate
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.purple, marginBottom: 6 }}>IPAP 10–15 / EPAP 5–8 cmH₂O</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
              BiPAP for patients with COPD component or hypercapnia · ventilatory assistance in addition to oxygenation
            </div>
          </div>
        )}
        <div style={dv} />
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Indications</div>
        {["RR > 25/min or accessory muscle use", "SpO₂ < 90% despite supplemental O₂", "Moderate-to-severe dyspnea", "pH < 7.35 with respiratory distress"].map((item, x) => (
          <div key={x} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.green }}>✓</span>{item}</div>
        ))}
        <div style={dv} />
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Contraindications</div>
        {["Vomiting or aspiration risk", "Unable to protect airway (GCS < 10)", "Hemodynamic instability / shock", "Facial trauma or inability to fit mask", "Patient refusal"].map((item, x) => (
          <div key={x} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.coral }}>✗</span>{item}</div>
        ))}
      </div>

      <div style={sL(T.gold)}>Vasodilators (Warm &amp; Wet with Elevated BP)</div>
      {[
        { drug: "Nitroglycerin", dose: "10–200 mcg/min IV", note: "Venodilator → reduces preload · antiischemic · first-line for ADHF + pulmonary edema · avoid in RV failure, hypotension, PDE5 inhibitors", color: T.gold },
        { drug: "Nitroprusside", dose: "0.25–5 mcg/kg/min IV", note: "Balanced preload + afterload reduction · most potent vasodilator · requires arterial line · avoid in ischemic HF (coronary steal)", color: T.amber },
        { drug: "Nesiritide",   dose: "2 mcg/kg IV bolus → 0.01 mcg/kg/min", note: "BNP analog · venodilator + mild diuretic effect · limited evidence (ASCEND-HF) · expensive · rarely used", color: T.purple },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{drug}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color }}>{dose}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Inotropes / Vasopressors (Cold Phenotype)</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 10 }}>Weight-Based Dobutamine Calculator</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number"
            style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        {dobuDose && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {[{ l: "Low (2 mcg/kg/min)", v: dobuDose.low }, { l: "Mid (10 mcg/kg/min)", v: dobuDose.mid }, { l: "High (20 mcg/kg/min)", v: dobuDose.high }].map(({ l, v }) => (
              <div key={l} style={{ ...G({ borderRadius: 9 }), padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: T.dim, marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.amber, fontWeight: 700 }}>{v} mcg/min</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {INOTROPES.map(({ drug, dose, moa, best, caution, color }) => (
        <div key={drug} style={{ ...G(), padding: "11px 13px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{drug}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color }}>{dose}</span>
          </div>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 3 }}>{moa}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 2 }}><span style={{ color: T.green, fontWeight: 600 }}>Best: </span>{best}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}><span style={{ color: T.coral, fontWeight: 600 }}>Caution: </span>{caution}</div>
        </div>
      ))}

      <div style={aBox(T.coral, 0)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>⚠ Morphine — Avoid in ADHF</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>ADHERE registry: morphine use associated with higher mortality, longer ICU stays, more intubations. Use only for air hunger in comfort-care patients.</div>
      </div>
    </div>
  );

  // ── TAB 2: WORKUP ─────────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL()}>BNP / NT-proBNP Interpretation</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>BNP (pg/mL)</div>
        {[
          { val: "< 100",     interp: "HF unlikely", color: T.green },
          { val: "100 – 400", interp: "Indeterminate — consider RV failure, PE, COPD, renal failure", color: T.gold },
          { val: "> 400",     interp: "HF likely", color: T.coral },
        ].map(({ val, interp, color }) => (
          <div key={val} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
            <div style={{ fontFamily: T.mono, fontSize: 12, color, minWidth: 80, flexShrink: 0 }}>{val}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{interp}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>NT-proBNP (pg/mL) — Age-Stratified</div>
        {[
          { age: "< 50 years",  rule_out: "300", rule_in: "450",  color: T.teal },
          { age: "50–75 years", rule_out: "300", rule_in: "900",  color: T.gold },
          { age: "> 75 years",  rule_out: "300", rule_in: "1800", color: T.amber },
        ].map(({ age, rule_out, rule_in, color }) => (
          <div key={age} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "9px 12px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color, minWidth: 80, fontWeight: 600 }}>{age}</div>
            <div style={{ fontSize: 11, color: T.muted }}>Rules out: <span style={{ fontFamily: T.mono, color: T.green }}>&lt; {rule_out}</span></div>
            <div style={{ fontSize: 11, color: T.muted }}>Rules in: <span style={{ fontFamily: T.mono, color: T.coral }}>&gt; {rule_in}</span></div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>BNP/NT-proBNP elevated in: obesity (falsely low), AF, PE, renal failure, sepsis. Use in clinical context.</div>
      </div>

      <div style={sL(T.teal)}>POCUS Findings</div>
      {[
        { view: "Lung US",         finding: "≥ 3 B-lines bilateral",                  interp: "Pulmonary edema (sensitivity 85%, specificity 93%)", color: T.blue },
        { view: "IVC",             finding: "> 2.1 cm + < 50% collapse",              interp: "Elevated CVP (> 15 mmHg) — congestion", color: T.coral },
        { view: "IVC",             finding: "< 1.2 cm + > 50% collapse",              interp: "Low CVP — volume responsive (or not overloaded)", color: T.green },
        { view: "Apical 4C",       finding: "Dilated LV + reduced wall motion",        interp: "HFrEF — EF likely < 40%", color: T.amber },
        { view: "PLAX",            finding: "EPSS > 7 mm",                             interp: "Reduced LV function — correlates with low EF", color: T.gold },
        { view: "Pleural",         finding: "Bilateral pleural effusions",             interp: "Supports congestion — HF most common cause", color: T.teal },
      ].map(({ view, finding, interp, color }) => (
        <div key={finding} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ ...tag(color), flexShrink: 0, fontSize: 10, whiteSpace: "nowrap" }}>{view}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 2 }}>{finding}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{interp}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>CXR Patterns</div>
      {[
        { find: "Cardiomegaly",                      detail: "Cardiothoracic ratio > 0.5 — chronic HF · dilated cardiomyopathy" },
        { find: "Pulmonary vascular redistribution", detail: "Cephalization — upper zone vessel prominence · early congestion" },
        { find: "Interstitial edema",                detail: "Kerley B lines · peribronchial cuffing · hazy perihilar ('bat wings')" },
        { find: "Alveolar edema",                    detail: "Bilateral airspace opacities · 'butterfly' pattern · severe decompensation" },
        { find: "Pleural effusions",                 detail: "Bilateral (or right > left) blunting of costophrenic angles" },
      ].map(({ find, detail }) => (
        <div key={find} style={{ ...G(), padding: "10px 13px", marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>{find}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Essential Labs</div>
      <div style={{ ...card() }}>
        {[
          { test: "BMP",        why: "Creatinine (cardiorenal) · K⁺ (diuretics) · Na⁺ (hyponatremia = poor prognosis)" },
          { test: "CBC",        why: "Anemia as precipitant · infection" },
          { test: "Troponin",   why: "ACS as precipitant · demand ischemia from elevated filling pressures" },
          { test: "LFTs",       why: "Congestive hepatopathy (elevated AST/ALT, alkaline phosphatase, bilirubin)" },
          { test: "TSH",        why: "Thyroid disease as precipitant — hypo- or hyperthyroidism" },
          { test: "Mg, Phos",   why: "Electrolytes prior to diuresis · Mg deficiency worsens arrhythmias" },
          { test: "Urinalysis", why: "Proteinuria (cardiorenal) · infection" },
          { test: "ECG",        why: "Arrhythmia · LVH · ischemia · LBBB (CRT candidate)" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, minWidth: 100, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={sL()}>Diuretic Response Targets</div>
      {[
        { metric: "Urine Output", target: "> 100–200 mL/h initial response · > 3–5 L net negative over 24h", color: T.teal },
        { metric: "Daily Weight", target: "0.5–1 kg/day loss (goal dry weight)", color: T.blue },
        { metric: "Creatinine",   target: "Expected rise of 0.2–0.3 mg/dL — treat-through unless > 30% rise or oliguria", color: T.gold },
        { metric: "K⁺ / Mg",     target: "Monitor q 12h · replete aggressively (goal K⁺ > 4.0, Mg > 2.0)", color: T.amber },
        { metric: "BNP trend",    target: "Declining BNP correlates with decongestion and improved prognosis", color: T.purple },
      ].map(({ metric, target, color }) => (
        <div key={metric} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 110, flexShrink: 0 }}>{metric}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{target}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["UO < 0.5 mL/kg/h after adequate IV diuresis → add thiazide (metolazone) or switch to combination",
        "SpO₂ < 90% despite NPPV → prepare for intubation · consider PA catheter for hemodynamic guidance",
        "MAP < 65 or new hypotension → stop vasodilators · start vasopressor · consider inotrope",
        "Creatinine rising > 30% above baseline → reassess volume status · consider reducing diuretic",
        "Worsening BNP at 24h → escalate therapy · cardiology / CICU consultation",
        "New arrhythmia (AF with RVR) → rate control · cardioversion if hemodynamically unstable"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 7, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.green)}>Discharge Criteria — ALL Required</div>
      <div style={card({ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)", marginBottom: 14 })}>
        {["At or near dry weight (euvolemic)", "JVD resolved · no rales · edema improving", "Stable renal function (creatinine at baseline ± 30%)", "Oral diuretics effective and established ≥ 24h", "Stable on oral medications ≥ 24h without IV therapy", "SpO₂ ≥ 95% on room air or home O₂", "HF clinic / PCP follow-up within 7 days arranged", "Patient and caregiver education completed (salt restriction, daily weights, when to call)"].map((t, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: T.green, flexShrink: 0 }}>✓</span>{t}
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { label: "CICU / CCU",        detail: "Cold phenotype · cardiogenic shock · inotrope-dependent · hemodynamic instability · ventilated" },
          { label: "Telemetry",          detail: "Warm & wet responding to IV therapy · NPPV weaning · transitioning to oral medications" },
          { label: "Observation",        detail: "Mild decompensation · known HF with clear trigger · expected rapid response to therapy" },
          { label: "Outpatient HF Clinic", detail: "GDMT optimization · uptitration plan · daily weight log · sodium restriction < 2g/day" },
        ].map(({ label, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 130, flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={aBox(T.gold, 0)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.gold, marginBottom: 3 }}>GDMT on Discharge</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Ensure HFrEF patients are on (or have documented intolerance to): ACE-I/ARB/ARNI · Beta-blocker (metoprolol succinate / carvedilol / bisoprolol) · MRA (spironolactone/eplerenone) · SGLT2 inhibitor (dapagliflozin/empagliflozin). All four drug classes reduce mortality.
        </div>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(59,130,246,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(251,146,60,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#3b82f6,#1e3a8a)")}>❤️ Cardiac</span>
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>AHA / HFSA 2022</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Acute Decompensated Heart Failure</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Stevenson phenotypes · FAILURE mnemonic · Diuretic calculator · NPPV · Inotropes · Discharge criteria</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.blue : T.border}`, background: tab === i ? "rgba(59,130,246,0.14)" : T.glass, color: tab === i ? T.blue : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {tab === 0 && Tab0}
        {tab === 1 && Tab1}
        {tab === 2 && Tab2}
        {tab === 3 && Tab3}
      </div>
    </div>
  );
}