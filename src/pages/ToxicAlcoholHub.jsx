import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

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
const sL   = (c = T.amber) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

export default function ToxicAlcoholHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]     = useState(0);
  const [toxin, setToxin] = useState("methanol");
  const [na, setNa]       = useState("");
  const [cl, setCl]       = useState("");
  const [bicarb, setBicarb] = useState("");
  const [bun, setBun]     = useState("");
  const [gluc, setGluc]   = useState("");
  const [etoh, setEtoh]   = useState("");
  const [osmol, setOsmol] = useState("");
  const TABS = ["Recognition", "Calculators", "Treatment", "Monitoring"];

  const naNum = parseFloat(na), clNum = parseFloat(cl), bicarbNum = parseFloat(bicarb);
  const bunNum = parseFloat(bun), glucNum = parseFloat(gluc);
  const etohNum = parseFloat(etoh), osmolNum = parseFloat(osmol);

  const ag  = !isNaN(naNum) && !isNaN(clNum) && !isNaN(bicarbNum) && na && cl && bicarb
    ? (naNum - clNum - bicarbNum).toFixed(1) : null;
  const agHigh = ag !== null && parseFloat(ag) > 12;

  const calcOsm = !isNaN(naNum) && !isNaN(bunNum) && !isNaN(glucNum) && na && bun && gluc
    ? (2 * naNum + bunNum / 2.8 + glucNum / 18).toFixed(1) : null;
  const osmolGap = calcOsm !== null && !isNaN(osmolNum) && osmol
    ? (osmolNum - parseFloat(calcOsm)).toFixed(1) : null;
  const ethGap = etohNum && osmolGap !== null
    ? (parseFloat(osmolGap) - etohNum / 4.6).toFixed(1) : null;
  const osmolGapHigh = osmolGap !== null && parseFloat(osmolGap) > 10;

  const TOXINS = {
    methanol: {
      label: "Methanol", color: T.coral,
      source: "Windshield washer fluid · antifreeze · paint solvent · moonshine · illicit alcohol · industrial solvent",
      latency: "6–30 hours (masked by ETOH if co-ingested) · severe toxicity delayed while methanol is metabolized",
      metabolism: "Methanol → formaldehyde (ADH) → formic acid (ALDH) → CO₂ (folate-dependent) · Formic acid causes toxicity",
      target: "Eyes (retina / optic nerve) · CNS",
      features: ["Visual disturbances — blurred vision · photophobia · 'snowfield' vision", "Optic disc hyperemia on fundoscopy", "Severe high anion gap metabolic acidosis", "Minimal CNS depression relative to acidosis", "Headache · nausea · abdominal pain", "Elevated osmol gap early (before metabolism) · elevated AG late"],
      antidote: "Fomepizole (4-MP) 15 mg/kg IV loading dose · inhibits ADH · prevents formation of formic acid",
      dialysis: "pH &lt; 7.25 · visual symptoms · formate level &gt; 20 mg/dL · renal failure · toxic level or very high osmol gap · seizures",
      folinic: "Leucovorin (folinic acid) 1 mg/kg IV q 4h × 6 doses enhances formate conversion to CO₂ · give in methanol poisoning",
    },
    ethylene_glycol: {
      label: "Ethylene Glycol", color: T.blue,
      source: "Antifreeze (green/orange sweet liquid) · hydraulic fluid · de-icing solutions · deliberately ingested (sweet taste)",
      latency: "1–6 hours",
      metabolism: "EG → glycolaldehyde (ADH) → glycolic acid → glyoxylic acid → oxalic acid · Oxalate precipitates with Ca²⁺ → crystal deposition",
      target: "Kidneys (oxalate crystals in tubules) · CNS · heart",
      features: ["Initial: drunk-appearing without ETOH smell", "CNS depression · confusion · coma (glycolaldehyde)", "Severe high AGMA + high osmol gap", "Flank pain · AKI (oliguric) · hematuria (crystal deposition)", "Hypocalcemia (oxalate chelates Ca²⁺) → tetany · seizures", "Calcium oxalate monohydrate crystals in urine (envelope-shaped)", "Fluorescence in urine (antifreeze contains fluorescein — Wood's lamp)"],
      antidote: "Fomepizole (4-MP) 15 mg/kg IV loading dose · blocks ADH-mediated metabolism",
      dialysis: "pH &lt; 7.25 · renal failure · osmol gap very high · calcium oxalate crystals + AKI · seizures · EG level &gt; 50 mg/dL",
      folinic: "Pyridoxine 100 mg IV q 6h (enhances glyoxylate → glycine) · Thiamine 100 mg IV TID (glyoxylate → alpha-hydroxy-beta-ketoadipate)",
    },
    isopropanol: {
      label: "Isopropanol (Isopropyl Alcohol)", color: T.purple,
      source: "Rubbing alcohol (70%) · hand sanitizer · industrial solvents · deliberately ingested",
      latency: "Rapid — 30–60 min",
      metabolism: "Isopropanol → acetone (ADH) · Acetone is NOT toxic · isopropanol itself causes CNS depression",
      target: "CNS (direct depressant) · GI mucosa",
      features: ["Elevated osmol gap WITHOUT anion gap (acetone does not cause AGMA)", "Strong smell of acetone (fruity/nail polish)", "Severe CNS depression · coma (potent CNS depressant)", "GI upset · hemorrhagic gastritis · vomiting", "Ketonemia WITHOUT acidosis — 'ketosis without acidosis' pattern", "Acetone positive on tox screen"],
      antidote: "NO specific antidote · SUPPORTIVE CARE ONLY · fomepizole NOT needed (acetone is not toxic)",
      dialysis: "Refractory hemodynamic instability · extremely high levels · prolonged coma",
      folinic: "N/A — no toxic metabolites requiring cofactors",
    },
  };

  const selToxin = TOXINS[toxin];

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Toxic Alcohol Poisoning — Osmol Gap + Anion Gap = Diagnostic Keys</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Methanol and ethylene glycol cause severe high anion gap metabolic acidosis with delayed onset (hours). The osmol gap closes as toxic alcohols are metabolized. Early presentation: high osmol gap, low AG. Late: high AG, low osmol gap. Both may be elevated simultaneously.</div>
      </div>

      <div style={sL()}>Select Toxic Alcohol</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {Object.entries(TOXINS).map(([key, val]) => (
          <button key={key} onClick={() => setToxin(key)}
            style={{ flex: 1, padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${toxin === key ? val.color : T.border}`, background: toxin === key ? val.color + "20" : T.glass, color: toxin === key ? val.color : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s", textAlign: "center" }}>
            {val.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {selToxin && (
        <div style={{ ...card({ border: `1.5px solid ${selToxin.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: selToxin.color, marginBottom: 10 }}>{selToxin.label}</div>
          {[
            { l: "Source",     v: selToxin.source },
            { l: "Latency",    v: selToxin.latency },
            { l: "Metabolism", v: selToxin.metabolism },
            { l: "Target Organs", v: selToxin.target },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: selToxin.color, minWidth: 110, flexShrink: 0 }}>{l}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
            </div>
          ))}
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Clinical Features</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {selToxin.features.map((f, i) => <span key={i} style={{ ...tag(selToxin.color), fontSize: 10 }}>{f}</span>)}
          </div>
          <div style={aBox(T.teal, 6)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 2 }}>Antidote</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selToxin.antidote}</div>
          </div>
          <div style={aBox(T.coral, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Dialysis Indications</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selToxin.dialysis}</div>
          </div>
        </div>
      )}

      <div style={sL(T.teal)}>Classic Comparison</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 420 }}>
          {[{ h: true, f: "Feature", m: "Methanol", e: "Ethylene Glycol", i: "Isopropanol" }].concat([
            { f: "AGMA",      m: "YES (formic acid)",  e: "YES (glycolic/oxalic)", i: "NO — normal AG" },
            { f: "Osmol Gap", m: "YES (early)",        e: "YES (early)",          i: "YES" },
            { f: "Target",    m: "Eyes/Retina",        e: "Kidneys/AKI",          i: "CNS only" },
            { f: "Urine",     m: "Normal",             e: "Calcium oxalate crystals", i: "Normal" },
            { f: "Ketosis",   m: "No",                 e: "No",                   i: "YES — acetone" },
            { f: "Antidote",  m: "Fomepizole + folate", e: "Fomepizole + cofactors", i: "Supportive only" },
            { f: "Dialysis",  m: "Visual Sx / pH &lt; 7.25", e: "AKI / pH &lt; 7.25", i: "Rarely" },
          ]).map(({ f, m, e, i, h }, idx) => (
            <div key={f} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: h ? T.glassMid : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", padding: "7px 8px", gap: 4 }}>
              <div style={{ flex: 1.2, fontSize: h ? 9.5 : 11.5, fontWeight: h ? 700 : 400, color: h ? T.muted : T.muted, textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{f}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.coral, textTransform: h ? "uppercase" : "none" }}>{m}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.blue, textTransform: h ? "uppercase" : "none" }}>{e}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.purple, textTransform: h ? "uppercase" : "none" }}>{i}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TAB 1: CALCULATORS ──────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={sL()}>Anion Gap Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Na⁺</div>
            <input value={na} onChange={e => setNa(e.target.value)} placeholder="140" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Cl⁻</div>
            <input value={cl} onChange={e => setCl(e.target.value)} placeholder="102" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>HCO₃⁻</div>
            <input value={bicarb} onChange={e => setBicarb(e.target.value)} placeholder="24" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        {ag !== null && (
          <div style={aBox(agHigh ? T.coral : T.green, 0)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.muted }}>Anion Gap = Na⁺ − Cl⁻ − HCO₃⁻</span>
              <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: agHigh ? T.coral : T.green }}>{ag}</span>
            </div>
            <div style={{ fontSize: 11.5, color: agHigh ? T.coral : T.green, fontWeight: 600, marginTop: 3 }}>
              {agHigh ? "HIGH Anion Gap Metabolic Acidosis (HAGMA) — includes toxic alcohols" : "Normal anion gap (8–12 mEq/L) — suggests late isopropanol or early ingestion"}
            </div>
          </div>
        )}
      </div>

      <div style={sL(T.blue)}>Osmol Gap Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {[
            { lbl: "Na⁺ (mEq/L)", val: na, set: setNa, ph: "140" },
            { lbl: "BUN (mg/dL)", val: bun, set: setBun, ph: "15" },
            { lbl: "Glucose (mg/dL)", val: gluc, set: setGluc, ph: "100" },
            { lbl: "Measured Osm", val: osmol, set: setOsmol, ph: "295" },
            { lbl: "ETOH (mg/dL)", val: etoh, set: setEtoh, ph: "0" },
          ].map(({ lbl, val, set, ph }) => (
            <div key={lbl} style={{ flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 9.5, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>{lbl}</div>
              <input value={val} onChange={e => set(e.target.value)} placeholder={ph} type="number"
                style={{ ...inp, width: "100%", boxSizing: "border-box", fontSize: 12 }} />
            </div>
          ))}
        </div>
        {calcOsm !== null && (
          <div style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>Calculated Osm = 2×Na + BUN/2.8 + Glucose/18</div>
            <div style={{ fontFamily: T.mono, fontSize: 14, color: T.white }}>{calcOsm} mOsm/kg</div>
          </div>
        )}
        {osmolGap !== null && (
          <div style={aBox(osmolGapHigh ? T.coral : T.green, 6)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Osmol Gap (Measured − Calculated)</span>
              <span style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: osmolGapHigh ? T.coral : T.green }}>{osmolGap}</span>
            </div>
            <div style={{ fontSize: 11.5, color: osmolGapHigh ? T.coral : T.green, fontWeight: 600 }}>
              {osmolGapHigh ? "ELEVATED osmol gap (&gt;10) — suggests toxic alcohol, ETOH, acetone, mannitol, or sorbitol" : "Normal osmol gap (≤10)"}
            </div>
          </div>
        )}
        {ethGap !== null && (
          <div style={aBox(parseFloat(ethGap) > 10 ? T.amber : T.teal, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: parseFloat(ethGap) > 10 ? T.amber : T.teal, marginBottom: 2 }}>ETOH-Corrected Osmol Gap</div>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 3 }}>{ethGap}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>
              {parseFloat(ethGap) > 10 ? "Residual osmol gap after accounting for ETOH — suggests ADDITIONAL toxic alcohol present (methanol or ethylene glycol)" : "Osmol gap explained by ETOH alone"}
            </div>
          </div>
        )}
        <div style={{ fontSize: 10.5, color: T.dim, marginTop: 8 }}>
          ETOH contributes 4.6 mOsm/L per 10 mg/dL · ETOH-corrected gap = osmol gap − (ETOH/4.6)
        </div>
      </div>

      <div style={sL(T.purple)}>Temporal Pattern — Osmol Gap vs Anion Gap</div>
      {[
        { time: "Early (0–6h)", og: "HIGH", ag: "Low or Normal", interp: "Toxic alcohol still present, not yet metabolized · most urgent window for fomepizole", color: T.coral },
        { time: "Intermediate (6–24h)", og: "Both elevated", ag: "Rising", interp: "Active metabolism → accumulating toxic acids · osmol gap falling as toxic alcohol metabolized", color: T.amber },
        { time: "Late (&gt; 24h)", og: "Low or Normal", ag: "HIGH", interp: "Toxic alcohol fully metabolized → high AGMA predominates · osmol gap may have normalized · severe acidosis · dialysis often needed", color: T.gold },
      ].map(({ time, og, ag: agVal, interp, color }) => (
        <div key={time} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{time}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ ...tag(T.blue), fontSize: 9 }}>OG: {og}</span>
              <span style={{ ...tag(T.coral), fontSize: 9 }}>AG: {agVal}</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{interp}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: TREATMENT ────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.teal, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 2 }}>Call Poison Control: 1-800-222-1222 · Fomepizole ASAP</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Fomepizole (4-methylpyrazole) blocks ADH — prevents formation of toxic metabolites. Give immediately on suspicion in methanol or ethylene glycol. Do NOT wait for levels.</div>
      </div>

      <div style={sL()}>Fomepizole Protocol</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { step: "Loading dose",       dose: "15 mg/kg IV over 30 min",                        note: "Immediately on clinical suspicion of methanol or ethylene glycol · before lab results if high suspicion" },
          { step: "Maintenance",        dose: "10 mg/kg IV q 12h × 4 doses",                   note: "Then 15 mg/kg q 12h thereafter (enzyme induction increases own metabolism after 48h)" },
          { step: "During dialysis",    dose: "15 mg/kg q 4h during hemodialysis",              note: "Fomepizole is dialyzed — give more frequently during HD · redose after dialysis ends" },
          { step: "Stop criteria",      dose: "pH ≥ 7.30 · osmol gap &lt; 10 · asymptomatic · serum levels undetectable · no dialysis required", note: "Confirm with toxicology / poison control before stopping" },
        ].map(({ step, dose, note }) => (
          <div key={step} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, minWidth: 100, flexShrink: 0 }}>{step}</div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.coral, marginBottom: 2 }}>{dose}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
            </div>
          </div>
        ))}
        <div style={aBox(T.gold, 0)}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.gold, fontWeight: 600 }}>Ethanol IV (historical alternative): </span>Loading 10 mL/kg 10% ETOH → maintenance 1.5 mL/kg/h to maintain ETOH 100–150 mg/dL. Much harder to titrate, more side effects. Use only if fomepizole absolutely unavailable.
          </div>
        </div>
      </div>

      <div style={sL(T.purple)}>Hemodialysis — Indications</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { ind: "Methanol", criteria: ["pH &lt; 7.25 despite bicarbonate", "Visual symptoms (any degree)", "Formate level &gt; 20 mg/dL", "Methanol level &gt; 50 mg/dL (&gt; 20 mg/dL per some guidelines)", "Renal failure", "Coma / seizures"] },
          { ind: "Ethylene Glycol", criteria: ["pH &lt; 7.25", "Renal failure (AKI)", "EG level &gt; 50 mg/dL", "Calcium oxalate crystals + hemodynamic instability", "Severe electrolyte disturbances", "Coma / seizures"] },
        ].map(({ ind, criteria }) => (
          <div key={ind} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ind === "Methanol" ? T.coral : T.blue, marginBottom: 7 }}>{ind} — Dialysis When:</div>
            {criteria.map((c, i) => (
              <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}>
                <span style={{ color: ind === "Methanol" ? T.coral : T.blue, flexShrink: 0 }}>●</span>{c}
              </div>
            ))}
          </div>
        ))}
        <div style={aBox(T.purple, 0)}>
          <div style={{ fontSize: 11.5, color: T.muted }}>SAMSCA (continuous venovenous hemofiltration / CVVH) is less efficient than intermittent HD for toxic alcohol clearance — use intermittent HD if available. Continue fomepizole during dialysis at increased frequency.</div>
        </div>
      </div>

      <div style={sL(T.gold)}>Cofactor Therapy</div>
      {[
        { drug: "Leucovorin (Folinic Acid) — METHANOL", dose: "1 mg/kg IV (max 50 mg) q 4–6h until methanol cleared", note: "Enhances formate conversion to CO₂ via folate-dependent pathway · give in ALL methanol poisoning · folate 50 mg IV q 4–6h if leucovorin unavailable", color: T.coral },
        { drug: "Pyridoxine (Vit B6) — ETHYLENE GLYCOL", dose: "100 mg IV q 6h", note: "Enhances glyoxylate → glycine (non-toxic) · reduced oxalate production", color: T.blue },
        { drug: "Thiamine (Vit B1) — ETHYLENE GLYCOL", dose: "100 mg IV q 6h", note: "Cofactor for glyoxylate → alpha-hydroxy-beta-ketoadipate pathway · reduces oxalate formation", color: T.blue },
        { drug: "Calcium — ETHYLENE GLYCOL", dose: "1–2 g calcium gluconate IV if symptomatic hypocalcemia", note: "Oxalate chelates Ca²⁺ → hypocalcemia · replace for symptomatic hypocalcemia (tetany · seizures · QTc prolongation) · avoid excessive Ca²⁺ replacement (may worsen crystal deposition in some models) · monitor ECG", color: T.teal },
        { drug: "Sodium Bicarbonate", dose: "1–2 mEq/kg IV for pH &lt; 7.10", note: "Adjunct for severe acidosis · does NOT treat underlying toxicity · buys time for fomepizole/dialysis · titrate to pH ≥ 7.20–7.25", color: T.gold },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 2h",   items: "ABG/VBG (pH · bicarb · lactate) · anion gap · osmol gap trend · mental status", color: T.coral },
        { freq: "Every 4–6h", items: "BMP (electrolytes · creatinine · glucose · bicarb) · Ca²⁺ (EG) · Mg · urinalysis (crystals) · osmolality if still elevated", color: T.gold },
        { freq: "Every 12h",  items: "LFTs · CBC · coagulation · fomepizole level if available · reassess dialysis indications", color: T.teal },
        { freq: "Continuous", items: "Cardiac monitor (QTc in hypocalcemia) · SpO₂ · mental status · urine output (AKI watch in EG)", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 90, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Treatment Response Targets</div>
      {[
        { target: "pH",           goal: "≥ 7.30 · rising with treatment",          color: T.green },
        { target: "Osmol Gap",    goal: "Decreasing toward &lt; 10 (toxic alcohol being cleared or metabolized)", color: T.teal },
        { target: "Anion Gap",    goal: "Normalizing (&lt; 12) as acids cleared by dialysis / metabolism", color: T.coral },
        { target: "Urine Output", goal: "≥ 1 mL/kg/h (AKI prevention in EG) · crystal clearance", color: T.blue },
        { target: "Calcium (EG)", goal: "Ionized Ca²⁺ &gt; 1.1 mmol/L · total Ca &gt; 8.5 mg/dL", color: T.amber },
        { target: "Visual Acuity (Methanol)", goal: "Any improvement from baseline · persistent visual loss may be permanent", color: T.gold },
      ].map(({ target, goal, color }) => (
        <div key={target} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 140, flexShrink: 0 }}>{target}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{goal}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation / Dialysis Triggers</div>
      {["pH &lt; 7.25 despite bicarbonate supplementation → dialysis immediately",
        "Rising creatinine (EG) → AKI developing → nephrology + dialysis urgently",
        "Visual symptoms (methanol) of ANY degree → dialysis + intensive ophthalmology consult",
        "No improvement in pH after 4h of fomepizole + bicarb → reassess diagnosis · escalate to dialysis",
        "Fomepizole unavailable → ethanol IV protocol (contact poison control for guidance)"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",           detail: "All confirmed methanol or ethylene glycol poisoning · pH &lt; 7.30 · altered mentation · visual symptoms · requiring dialysis · fomepizole infusion ongoing · hemodynamic instability" },
          { level: "Nephrology",    detail: "All methanol and EG cases — dialysis availability · ongoing fomepizole management · AKI management (EG) · guideline for stopping dialysis" },
          { level: "Toxicology / Poison Control", detail: "All cases — management guidance · source identification · fomepizole stopping criteria · ethanol protocol if fomepizole unavailable", phone: "1-800-222-1222" },
          { level: "Ophthalmology", detail: "All methanol poisoning · even if visual symptoms not yet present · baseline visual acuity · fundoscopy · optic disc assessment · visual loss may be permanent even with treatment" },
        ].map(({ level, detail, phone }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>{level}{phone && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, marginLeft: 6 }}>{phone}</span>}</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(251,146,60,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(59,130,246,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#fb923c,#b45309)")}>☠️ Toxicologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>Toxicology / Poison Control</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Toxic Alcohol Poisoning</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Methanol · Ethylene Glycol · Isopropanol · Anion + Osmol gap calculators · Fomepizole protocol · Dialysis criteria</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.amber : T.border}`, background: tab === i ? "rgba(251,146,60,0.14)" : T.glass, color: tab === i ? T.amber : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        {tab === 0 && T0}{tab === 1 && T1}{tab === 2 && T2}{tab === 3 && T3}
      </div>
    </div>
  );
}