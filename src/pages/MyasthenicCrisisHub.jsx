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
const sL   = (c = T.purple) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

const MGFA_CLASSES = [
  { cls: "Class I",   color: T.green,  desc: "Ocular weakness only · any severity",                                             resp: "No — ocular only",   mgmt: "Pyridostigmine · steroids if needed" },
  { cls: "Class II",  color: T.teal,   desc: "Mild weakness affecting limbs/axial/oropharyngeal — ocular may be any severity",  resp: "Rare",               mgmt: "Pyridostigmine · steroids · consider azathioprine" },
  { cls: "Class III", color: T.gold,   desc: "Moderate weakness affecting limbs/axial/oropharyngeal",                          resp: "Possible — monitor", mgmt: "Immunotherapy · IVIG or PLEX if rapid deterioration" },
  { cls: "Class IV",  color: T.amber,  desc: "Severe weakness of limbs/axial/oropharyngeal",                                   resp: "High risk — ICU",    mgmt: "IVIG or PLEX · ICU admission" },
  { cls: "Class V",   color: T.coral,  desc: "Intubation required · with or without mechanical ventilation",                   resp: "YES — crisis",      mgmt: "Intubate · IVIG or PLEX · identify trigger" },
];

const DRUGS_TO_AVOID = [
  { drug: "Fluoroquinolones",              reason: "Ciprofloxacin · levofloxacin — block NMJ · can precipitate crisis" },
  { drug: "Aminoglycosides",              reason: "Gentamicin · tobramycin — pre-synaptic NMJ blockade" },
  { drug: "Magnesium",                    reason: "IV magnesium blocks calcium-dependent ACh release — even Mg in antacids can worsen" },
  { drug: "Beta-blockers",               reason: "Propranolol · atenolol — worsen NMJ transmission" },
  { drug: "Neuromuscular blockers",       reason: "Extreme sensitivity — succinylcholine resistance · non-depolarizing agents markedly prolonged" },
  { drug: "D-penicillamine",             reason: "Can cause de novo MG or worsen existing disease" },
  { drug: "Checkpoint inhibitors",        reason: "Pembrolizumab / nivolumab — immune-mediated worsening · rapidly fatal MG crisis" },
  { drug: "Botulinum toxin",             reason: "Direct NMJ toxin — absolute contraindication" },
  { drug: "Chloroquine / hydroxychloroquine", reason: "Impairs NMJ transmission" },
  { drug: "Procainamide",                reason: "Anti-arrhythmic — NMJ blockade effect" },
];

const PRECIPITANTS = [
  { l: "I", w: "Infection",            d: "Most common precipitant · especially respiratory infection · UTI · aspiration pneumonia from bulbar weakness" },
  { l: "M", w: "Medications",          d: "See medications to avoid list · fluoroquinolones most common iatrogenic cause in ED" },
  { l: "S", w: "Surgery / Stress",     d: "Surgical procedures · physical or emotional stress · pregnancy / postpartum period" },
  { l: "S", w: "Stopping medications", d: "Non-compliance with pyridostigmine or immunosuppressants · abrupt steroid taper" },
];

export default function MyasthenicCrisisHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]         = useState(0);
  const [mgfaCls, setMgfaCls] = useState(null);
  const [testType, setTestType] = useState("IVIG");
  const [wt, setWt]           = useState("");
  const TABS = ["Recognition", "Treatment", "Workup", "Monitoring"];

  const wtNum  = parseFloat(wt);
  const igDose = !isNaN(wtNum) && wt ? (wtNum * 2).toFixed(0) : null;

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Myasthenic Crisis — Respiratory Failure from NMJ Disease</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Crisis = respiratory failure requiring intubation OR impending failure requiring ICU. Mortality 4–8% with modern ICU care. Key distinction: myasthenic crisis vs cholinergic crisis (too much medication).</div>
      </div>

      <div style={sL()}>The Critical Distinction</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={card({ borderLeft: `3px solid ${T.purple}`, padding: "13px" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Myasthenic Crisis</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Too little acetylcholine effect</div>
          <div style={dv} />
          {["Weakness · diplopia · ptosis", "Dysphagia · dysarthria", "Neck flexion weakness", "Respiratory failure", "Pupils normal or dilated", "Dry skin", "↑ HR"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, display: "flex", gap: 5, marginBottom: 3 }}><span style={{ color: T.purple }}>●</span>{s}</div>
          ))}
          <div style={{ ...tag(T.purple), marginTop: 8, fontSize: 9 }}>Tx: IVIG or PLEX</div>
        </div>
        <div style={card({ borderLeft: `3px solid ${T.gold}`, padding: "13px" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Cholinergic Crisis</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Too much acetylcholine (pyridostigmine OD)</div>
          <div style={dv} />
          {["SLUDGE: Salivation/Lacrimation/Urination/Defecation/GI/Emesis", "Miosis (pinpoint pupils)", "Bradycardia", "Bronchospasm/secretions", "Muscle fasciculations", "Diaphoresis"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, display: "flex", gap: 5, marginBottom: 3 }}><span style={{ color: T.gold }}>●</span>{s}</div>
          ))}
          <div style={{ ...tag(T.gold), marginTop: 8, fontSize: 9 }}>Tx: Stop pyridostigmine · Atropine</div>
        </div>
      </div>

      <div style={aBox(T.teal, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.teal, marginBottom: 3 }}>⚡ Edrophonium (Tensilon) Test — Rarely Done in Modern ED</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>Historical test: edrophonium 2mg IV test dose → 8mg IV if no reaction. Improvement in ptosis/diplopia = positive. Dangerous in cardiac patients (bradycardia). Largely replaced by antibody testing and ice pack test. Have atropine at bedside if performed.</div>
      </div>

      <div style={sL()}>Respiratory Assessment — KEY</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 10 }}>20/30/40 Rule — Intubation Thresholds</div>
        {[
          { val: "< 20 mL/kg",  param: "FVC (Forced Vital Capacity)",          action: "Intubate",                     color: T.coral },
          { val: "< 30 cmH₂O", param: "NIF (Negative Inspiratory Force / MIP)", action: "Intubate",                    color: T.coral },
          { val: "< 40 mL/kg",  param: "FVC with rapid decline",               action: "ICU · prepare for intubation", color: T.amber },
        ].map(({ val, param, action, color }) => (
          <div key={val} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "10px 12px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 800, color, minWidth: 90, flexShrink: 0 }}>{val}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: T.white }}>{param}</div></div>
            <div style={{ ...tag(color), fontSize: 10, whiteSpace: "nowrap" }}>{action}</div>
          </div>
        ))}
        <div style={{ ...aBox(T.gold, 0), marginTop: 8 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.gold, fontWeight: 600 }}>Serial measurements critical: </span>Trend matters more than single value. Check FVC and NIF q 4h. Rapid decline over hours = impending intubation regardless of absolute value. ABG often normal until very late — do NOT rely on PaCO₂ alone.
          </div>
        </div>
      </div>

      <div style={sL(T.gold)}>Bulbar Weakness Assessment</div>
      {["Nasal voice quality or hypophonia — glottic weakness", "Inability to count to 20 in one breath (quantifies respiratory reserve)", "Sip water test — nasal regurgitation or coughing indicates pharyngeal weakness", "Gag reflex assessment — absent = high aspiration risk", "Inability to hold head up — neck flexors are a respiratory crisis predictor"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.gold, flexShrink: 0 }}>▸</span>{s}
        </div>
      ))}

      <div style={sL()}>MGFA Classification — tap to expand</div>
      {MGFA_CLASSES.map(c => (
        <div key={c.cls}
          style={{ ...G(), padding: "11px 14px", marginBottom: 7, border: `1.5px solid ${mgfaCls === c.cls ? c.color + "70" : T.border}`, background: mgfaCls === c.cls ? c.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setMgfaCls(mgfaCls === c.cls ? null : c.cls)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color: c.color }}>{c.cls}</span>
              <span style={{ fontSize: 11.5, color: T.muted }}>{c.desc.split("·")[0]}</span>
            </div>
            <span style={{ ...tag(c.color), fontSize: 9, whiteSpace: "nowrap" }}>{c.resp}</span>
          </div>
          {mgfaCls === c.cls && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${c.color}30` }}>
              <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}>{c.desc}</div>
              <div style={aBox(c.color, 0)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 2 }}>Management</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.mgmt}</div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.amber)}>Precipitants — IMSS</div>
      {PRECIPITANTS.map(({ l, w, d }) => (
        <div key={l + w} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.amber + "22", border: `1.5px solid ${T.amber}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.amber, fontFamily: T.mono, flexShrink: 0 }}>{l}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{w}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.45 }}>{d}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: TREATMENT ─────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Airway First — Then Immunotherapy</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Secure airway before initiating IVIG or PLEX. Both IVIG and plasmapheresis have equivalent efficacy — choose based on availability, access, and contraindications.</div>
      </div>

      <div style={sL()}>Step 1 — Airway Management</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        {[
          { step: "Intubation Indication", detail: "FVC < 20 mL/kg · NIF < 30 cmH₂O · rapid respiratory decline · inability to protect airway (bulbar failure)", color: T.coral },
          { step: "RSI Consideration",     detail: "Succinylcholine: RELATIVE CONTRAINDICATION — resistance possible (up-regulation of AChR) · may cause hyperkalemia · use rocuronium 1.2 mg/kg preferred · vecuronium extremely prolonged — avoid", color: T.gold },
          { step: "Post-intubation",       detail: "Goal: rest respiratory muscles · minimize sedation to allow neuro assessment · avoid neuromuscular blockers · early weaning trials once crisis treated", color: T.teal },
        ].map(({ step, detail, color }, i) => (
          <div key={i} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 12px", borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={sL()}>Step 2 — Immunotherapy (choose one)</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["IVIG", "Plasmapheresis"].map(m => (
          <button key={m} style={{ flex: 1, padding: "8px", borderRadius: 9, border: `1.5px solid ${testType === m ? T.purple : T.border}`, background: testType === m ? "rgba(167,139,250,0.18)" : T.glass, color: testType === m ? T.purple : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}
            onClick={() => setTestType(m)}>{m}</button>
        ))}
      </div>

      {testType === "IVIG" ? (
        <div style={{ ...card({ marginBottom: 14, border: `1.5px solid ${T.purple}50` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.purple, marginBottom: 10 }}>IV Immunoglobulin (IVIG)</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Dose Calculator</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number"
              style={{ flex: 1, padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" }} />
            <span style={{ fontSize: 12, color: T.muted }}>kg</span>
          </div>
          {igDose && (
            <div style={aBox(T.purple, 10)}>
              <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.purple }}>{igDose} g total</div>
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>2 g/kg over 2–5 days · typical: {(parseFloat(igDose) / 5).toFixed(0)}–{(parseFloat(igDose) / 2).toFixed(0)} g/day</div>
            </div>
          )}
          {[
            { label: "Mechanism",  val: "Fc receptor blockade · anti-idiotype antibodies · complement inhibition · modulates T and B cell function" },
            { label: "Onset",      val: "3–5 days · peak effect 1–2 weeks" },
            { label: "Duration",   val: "3–6 weeks · repeat if relapse" },
            { label: "Advantages", val: "No central venous access required · easier logistics · less hemodynamic instability" },
            { label: "Cautions",   val: "IgA deficiency (anaphylaxis risk — check IgA level first) · renal failure (sucrose-based IVIG nephrotoxic — use non-sucrose) · thromboembolism risk · migraine headaches" },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.purple, minWidth: 90, flexShrink: 0 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{val}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...card({ marginBottom: 14, border: `1.5px solid ${T.teal}50` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.teal, marginBottom: 10 }}>Therapeutic Plasma Exchange (PLEX)</div>
          {[
            { label: "Protocol",     val: "5–7 exchanges over 10–14 days · 1–1.5 plasma volumes per exchange" },
            { label: "Mechanism",    val: "Directly removes circulating AChR antibodies · anti-MuSK antibodies · complement" },
            { label: "Onset",        val: "Faster than IVIG — often 24–48h · preferred if rapid deterioration" },
            { label: "Duration",     val: "Weeks · shorter-lived than IVIG" },
            { label: "Advantages",   val: "Faster onset · directly removes pathogenic antibodies · preferred for severe or refractory crisis" },
            { label: "Cautions",     val: "Requires central venous access · hemodynamic instability · hypocalcemia · clotting factor removal · infection risk · FFP replacement if coagulopathic" },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.teal, minWidth: 90, flexShrink: 0 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={sL(T.gold)}>Step 3 — Pyridostigmine Management</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Hold During Crisis</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>
          Pyridostigmine increases secretions in intubated patients → mucus plugging → worsening. <span style={{ color: T.gold, fontWeight: 600 }}>HOLD pyridostigmine while intubated.</span> Restart at reduced dose after extubation.
        </div>
        {[
          { scenario: "Mild crisis (no intubation)",          dose: "Continue at usual dose · may need to increase if dose is subtherapeutic" },
          { scenario: "Intubated",                            dose: "Hold completely · restart at 30–60 mg PO q 4–6h when able to take PO after extubation" },
          { scenario: "Myasthenic vs cholinergic uncertain",  dose: "Hold pyridostigmine × 12–24h and observe — cholinergic crisis will improve, myasthenic will worsen" },
        ].map(({ scenario, dose }) => (
          <div key={scenario} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: T.gold, marginBottom: 2 }}>{scenario}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{dose}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.blue)}>Immunosuppression — Long-Term</div>
      {[
        { drug: "Prednisone",         dose: "Start LOW (15–20 mg/day) and increase slowly · high-dose initiation can transiently worsen MG ('steroid dip') · discuss with neurology", color: T.gold },
        { drug: "Azathioprine",       dose: "2–3 mg/kg/day PO · onset 6–18 months · check TPMT level first · first-line steroid-sparing agent", color: T.teal },
        { drug: "Mycophenolate",      dose: "1–1.5g PO BID · faster onset than azathioprine · alternative steroid-sparing agent", color: T.blue },
        { drug: "Rituximab",          dose: "375 mg/m² IV weekly × 4 · for anti-MuSK MG (especially responsive) · refractory generalized MG", color: T.purple },
        { drug: "Eculizumab (Soliris)", dose: "FDA-approved for anti-AChR+ generalized MG · complement inhibitor · meningococcal vaccination required", color: T.coral },
      ].map(({ drug, dose, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{drug}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{dose}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Drugs to AVOID in Myasthenia Gravis</div>
      {DRUGS_TO_AVOID.map(({ drug, reason }) => (
        <div key={drug} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: T.coral, flexShrink: 0, marginTop: 1 }}>✗</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 1 }}>{drug}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{reason}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: WORKUP ────────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={sL()}>Antibody Testing</div>
      {[
        { ab: "Anti-AChR (acetylcholine receptor)", pos: "85% of generalized MG · 50% of ocular MG",   color: T.purple, note: "Pathogenic · quantitative titer correlates with disease in some patients · does NOT distinguish crisis severity" },
        { ab: "Anti-MuSK (muscle-specific kinase)", pos: "5–10% of seronegative MG",                   color: T.blue,   note: "Predominantly bulbar and respiratory involvement · more prone to crisis · better response to PLEX than IVIG · responds well to rituximab" },
        { ab: "Anti-LRP4",                          pos: "2–5% of double-seronegative MG",             color: T.teal,   note: "Newer target · usually milder disease" },
        { ab: "Seronegative MG",                    pos: "~10–15% of MG patients",                     color: T.gold,   note: "No detectable antibodies · diagnosis by clinical + EMG + response to treatment" },
      ].map(({ ab, pos, color, note }) => (
        <div key={ab} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{ab}</div>
          <div style={{ fontSize: 11, color: T.teal, marginBottom: 3 }}>Positive in: {pos}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Essential Labs in Crisis</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "ABG / VBG",                  why: "Respiratory failure monitoring · CO₂ retention = late sign — act on FVC/NIF before ABG changes" },
          { test: "FVC + NIF (bedside)",         why: "Serial every 4h · 20/30/40 rule · most important monitoring parameters" },
          { test: "BMP",                         why: "Electrolytes · hypokalemia and hypophosphatemia worsen NMJ function" },
          { test: "CBC",                         why: "Leukocytosis suggests infection as precipitant · anemia worsens respiratory reserve" },
          { test: "CXR",                         why: "Aspiration pneumonia · pneumonia as precipitant · mediastinal mass (thymoma)" },
          { test: "IgA level",                   why: "Before IVIG — IgA deficiency → anaphylaxis risk with IVIG containing IgA" },
          { test: "TSH",                         why: "Thyroid disease coexists in MG (autoimmune overlap) · can trigger crisis" },
          { test: "CT Chest (if new diagnosis)", why: "Rule out thymoma — present in 10–15% of MG · drives treatment decision (thymectomy)" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, minWidth: 150, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Electrodiagnostic Testing</div>
      {[
        { test: "Repetitive nerve stimulation (RNS)", find: "Decremental response > 10% at 3 Hz — classic MG finding · most specific · may be negative in mild or purely ocular disease", color: T.teal },
        { test: "Single-fiber EMG (SFEMG)",           find: "Most sensitive test (95%) · increased 'jitter' (variability in NMJ transmission) · normal SFEMG essentially rules out MG", color: T.purple },
        { test: "Ice Pack Test (for ptosis)",         find: "Apply ice to closed eyelid × 2 min → improvement in ptosis = positive MG test · sensitivity ~80% for ocular MG · safe bedside test", color: T.gold },
      ].map(({ test, find, color }) => (
        <div key={test} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{test}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{find}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ────────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Respiratory Monitoring — Core of Management</div>
      {[
        { freq: "Every 4h",   items: "FVC · NIF · SpO₂ · RR · accessory muscle use · ability to count to 20 in one breath", color: T.coral },
        { freq: "Every 8h",   items: "Bulbar assessment (voice quality · swallow screen · gag) · neck flexion strength",     color: T.gold },
        { freq: "Every 12h",  items: "ABG if FVC declining or SpO₂ < 94% · BMP (electrolytes) · clinical reassessment",    color: T.teal },
        { freq: "Continuous", items: "SpO₂ · cardiac monitor · call parameters defined for nursing",                         color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 90, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Extubation Readiness</div>
      {["FVC > 15–20 mL/kg (trending up, not declining)", "NIF more negative than −25 cmH₂O", "Awake and following commands", "Able to handle secretions (swallow, cough)", "Underlying precipitant identified and treated", "IVIG or PLEX course underway or completed", "Off or on minimal sedation"].map((c, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.green }}>✓</span>{c}
        </div>
      ))}

      <div style={aBox(T.gold, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.gold, marginBottom: 2 }}>Ventilator Weaning Pearl</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>MG patients often fail standard weaning protocols due to fatiguable weakness. Spontaneous breathing trials may be shorter. Extubation failure rate is ~25% — have a clear plan before extubation. Consider tracheostomy early for prolonged crisis (&gt; 2 weeks on vent).</div>
      </div>

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["FVC declining below 20 mL/kg despite treatment → intubate", "NIF less negative than −30 cmH₂O and declining → intubate", "O₂ saturation < 92% on supplemental O₂ → intubate", "No improvement in weakness after 5 days of IVIG or 5 exchanges of PLEX → consider combining modalities or adding rituximab", "New fever during crisis → aggressive sepsis workup (aspiration pneumonia common)"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "Neurology ICU / MICU", detail: "All intubated patients · FVC < 25 mL/kg or rapidly declining · inability to swallow · any bulbar crisis features" },
          { level: "Step-Down / IMC",      detail: "FVC 25–40 mL/kg stable · receiving IVIG or PLEX · no bulbar failure · close monitoring" },
          { level: "Neurology Consult",    detail: "All confirmed or suspected MG crisis · IVIG/PLEX decision · immunosuppression optimization · thymectomy evaluation · antibody testing guidance" },
          { level: "Thymectomy evaluation", detail: "Thymoma present → surgery after crisis resolved · Non-thymoma MG < 60 years → thymectomy improves remission rates (MGTX trial)" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 140, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(167,139,250,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#a78bfa,#6d28d9)")}>🧠 Neurologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>MGFA / Neurology</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Myasthenic Crisis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Crisis vs cholinergic · 20/30/40 rule · IVIG dose calculator · PLEX · Drugs to avoid · Weaning criteria</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.purple : T.border}`, background: tab === i ? "rgba(167,139,250,0.14)" : T.glass, color: tab === i ? T.purple : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        {tab === 0 && T0}
        {tab === 1 && T1}
        {tab === 2 && T2}
        {tab === 3 && T3}
      </div>
    </div>
  );
}