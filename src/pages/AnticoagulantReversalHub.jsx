import { useState } from "react";

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
const sL   = (c = T.green) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

export default function AnticoagulantReversalHub({ onBack }) {
  const [tab, setTab]   = useState(0);
  const [drug, setDrug] = useState("warfarin");
  const [inr, setInr]   = useState("");
  const [wt, setWt]     = useState("");
  const [indication, setIndication] = useState("bleeding");
  const TABS = ["Drug Selector", "Warfarin", "DOACs", "Heparin / LMWH"];

  const inrNum = parseFloat(inr);
  const wtNum  = parseFloat(wt);

  // 4F-PCC weight-based dosing for warfarin reversal by INR
  const pccDose = !isNaN(wtNum) && !isNaN(inrNum) && wt && inr
    ? inrNum < 4   ? Math.min(wtNum * 25, 2500).toFixed(0)
    : inrNum < 6   ? Math.min(wtNum * 35, 3500).toFixed(0)
    : Math.min(wtNum * 50, 5000).toFixed(0) : null;

  const pccUnits = !isNaN(inrNum) && inr
    ? inrNum < 4 ? "25 units/kg" : inrNum < 6 ? "35 units/kg" : "50 units/kg" : null;

  const DRUGS = [
    { id: "warfarin",    name: "Warfarin (Coumadin)",         color: T.coral, icon: "💊" },
    { id: "apixaban",    name: "Apixaban (Eliquis)",          color: T.blue,  icon: "💊" },
    { id: "rivaroxaban", name: "Rivaroxaban (Xarelto)",       color: T.teal,  icon: "💊" },
    { id: "dabigatran",  name: "Dabigatran (Pradaxa)",        color: T.purple,icon: "💊" },
    { id: "edoxaban",    name: "Edoxaban (Savaysa)",          color: T.blue,  icon: "💊" },
    { id: "heparin",     name: "Unfractionated Heparin (UFH)", color: T.gold, icon: "💉" },
    { id: "lmwh",        name: "LMWH (Enoxaparin/Lovenox)",  color: T.amber, icon: "💉" },
    { id: "fondaparinux", name: "Fondaparinux (Arixtra)",    color: T.muted, icon: "💉" },
  ];

  const selDrug = DRUGS.find(d => d.id === drug);

  // ── TAB 0: DRUG SELECTOR ────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Anticoagulant Reversal — Identify the Drug First</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>The reversal agent depends entirely on which anticoagulant was taken. Ask the patient or family specifically. Medication bottles, pharmacy records, or MedAlert bracelets may be essential. When unknown: 4F-PCC covers most scenarios.</div>
      </div>

      <div style={sL()}>Select Anticoagulant</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        {DRUGS.map(d => (
          <div key={d.id} onClick={() => setDrug(d.id)}
            style={{ ...G(), padding: "12px 14px", border: `1.5px solid ${drug === d.id ? d.color + "70" : T.border}`, background: drug === d.id ? d.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: drug === d.id ? d.color : T.white }}>{d.name}</div>
              </div>
              <div style={{ ...tag(d.color), fontSize: 9 }}>
                {d.id === "warfarin" ? "Vitamin K antagonist" : d.id.includes("aban") || d.id === "edoxaban" ? "Xa inhibitor" : d.id === "dabigatran" ? "IIa inhibitor" : d.id === "heparin" ? "Anti-Xa/IIa" : d.id === "lmwh" ? "Anti-Xa" : "Anti-Xa"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick reference summary */}
      <div style={sL(T.gold)}>At-a-Glance Reversal Reference</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 420 }}>
          {[{ h: true, d: "Drug", r: "Specific Reversal", b: "Backup" }].concat([
            { d: "Warfarin",    r: "4F-PCC (Kcentra) + Vitamin K", b: "FFP", dc: T.coral, rc: T.gold },
            { d: "Apixaban",    r: "Andexanet alfa (Andexxa)",      b: "4F-PCC 50 u/kg", dc: T.blue,   rc: T.blue },
            { d: "Rivaroxaban", r: "Andexanet alfa (Andexxa)",      b: "4F-PCC 50 u/kg", dc: T.teal,   rc: T.teal },
            { d: "Dabigatran",  r: "Idarucizumab (Praxbind)",       b: "aPCC / dialysis", dc: T.purple, rc: T.purple },
            { d: "Edoxaban",    r: "Andexanet alfa (off-label)",    b: "4F-PCC 50 u/kg", dc: T.blue,   rc: T.blue },
            { d: "UFH",         r: "Protamine sulfate 1 mg/100u UFH", b: "Stop infusion", dc: T.gold,   rc: T.gold },
            { d: "LMWH",        r: "Protamine sulfate (partial)",    b: "Supportive",    dc: T.amber,  rc: T.amber },
            { d: "Fondaparinux", r: "No specific antidote",          b: "rFVIIa / 4F-PCC", dc: T.muted, rc: T.muted },
          ]).map(({ d, r, b, dc, rc, h }, i) => (
            <div key={d} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: h ? T.glassMid : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", padding: "7px 8px", gap: 8 }}>
              <div style={{ flex: 1.2, fontSize: h ? 9.5 : 12, fontWeight: h ? 700 : 600, color: h ? T.muted : (dc || T.white), textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{d}</div>
              <div style={{ flex: 2, fontSize: h ? 9.5 : 11.5, color: h ? T.muted : T.teal, textTransform: h ? "uppercase" : "none" }}>{r}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.dim, textTransform: h ? "uppercase" : "none" }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TAB 1: WARFARIN ─────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Warfarin Reversal — 4F-PCC + Vitamin K</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>4-factor PCC (Kcentra) reverses warfarin in minutes. Vitamin K ensures sustained effect. FFP is slower, requires large volumes, and has transfusion risks — use 4F-PCC for urgent reversal.</div>
      </div>

      <div style={sL()}>4F-PCC Dose Calculator (Kcentra)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>INR</div>
            <input value={inr} onChange={e => setInr(e.target.value)} placeholder="3.5" type="number" step="0.1" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Weight (kg)</div>
            <input value={wt} onChange={e => setWt(e.target.value)} placeholder="70" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        {pccDose && (
          <div style={aBox(T.coral, 4)}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>4F-PCC dose ({pccUnits} · max shown)</div>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: T.coral }}>{pccDose} units IV</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Infuse at 210 units/min · max rate · over {(parseFloat(pccDose) / 210 / 60).toFixed(0)}-{(parseFloat(pccDose) / 100 / 60).toFixed(0)} min</div>
          </div>
        )}
        <div style={{ marginTop: pccDose ? 10 : 0 }}>
          {[{ inr: "INR 2–4", dose: "25 units/kg (max 2,500 units)" },
            { inr: "INR 4–6", dose: "35 units/kg (max 3,500 units)" },
            { inr: "INR > 6",  dose: "50 units/kg (max 5,000 units)" }].map(({ inr: r, dose }) => (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 5, marginBottom: 5, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11.5, color: T.muted }}>{r}</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.coral }}>{dose}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={sL(T.gold)}>Vitamin K — Always Give With 4F-PCC</div>
      {[
        { scenario: "Life-threatening bleeding (ICH, major surgery)", dose: "10 mg IV over 20–60 min · effect 12–24h · repeat INR in 6h", color: T.coral },
        { scenario: "Significant bleeding (GI, urinary)", dose: "5–10 mg IV or PO · INR check at 24h", color: T.amber },
        { scenario: "Supratherapeutic INR without bleeding", dose: "1–2.5 mg PO · omit 1–2 doses · recheck INR in 24h", color: T.gold },
        { scenario: "Hold warfarin only (INR 4–9, no bleeding)", dose: "No vitamin K needed · hold 1–2 doses · monitor · restart at lower dose when INR < 3", color: T.teal },
      ].map(({ scenario, dose, color }) => (
        <div key={scenario} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{scenario}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 2 }}>{dose}</div>
        </div>
      ))}

      <div style={sL(T.blue)}>FFP vs 4F-PCC Comparison</div>
      {[{ h: true, f: "Feature", pcc: "4F-PCC (Kcentra)", ffp: "FFP" }].concat([
        { f: "Speed of reversal",  pcc: "~15–30 min",     ffp: "1–2h (thaw + infuse)" },
        { f: "Volume",             pcc: "20–40 mL IV push", ffp: "4–6 units (1–1.5L)" },
        { f: "INR reversal",       pcc: "Very reliable → INR < 1.5", ffp: "Incomplete in 30%" },
        { f: "VTE risk",           pcc: "Small (0.7%)",   ffp: "Lower" },
        { f: "Transfusion rxn",    pcc: "None",           ffp: "TRALI / TACO risk" },
        { f: "Cost",               pcc: "Higher",         ffp: "Lower" },
        { f: "Availability",       pcc: "Immediate (no thaw)", ffp: "Thaw 20–30 min" },
      ]).map(({ f, pcc, ffp, h }, i) => (
        <div key={f} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: h ? T.glassMid : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", padding: "7px 8px", gap: 8 }}>
          <div style={{ flex: 1, fontSize: h ? 9.5 : 11.5, fontWeight: h ? 700 : 400, color: h ? T.muted : T.muted, textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{f}</div>
          <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11.5, color: h ? T.muted : T.coral, textTransform: h ? "uppercase" : "none" }}>{pcc}</div>
          <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11.5, color: h ? T.muted : T.blue, textTransform: h ? "uppercase" : "none" }}>{ffp}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: DOACs ────────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.blue, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>DOACs — Each Has a Specific Reversal Agent</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Factor Xa inhibitors (apixaban, rivaroxaban, edoxaban) → Andexanet alfa. Direct thrombin inhibitor (dabigatran) → Idarucizumab. Both are FDA-approved. When specific antidote unavailable: 4F-PCC 50 units/kg for Xa inhibitors; aPCC or dialysis for dabigatran.</div>
      </div>

      <div style={sL()}>Andexanet Alfa (Andexxa) — Factor Xa Inhibitor Reversal</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8 }}>FDA-approved for apixaban and rivaroxaban · off-label for edoxaban · betrixaban</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Dosing (based on last dose and timing)</div>
          {[
            { scenario: "Low dose: apixaban ≤ 5 mg OR rivaroxaban ≤ 10 mg · last dose > 8h ago", dose: "400 mg IV bolus over 15 min → 480 mg IV over 2h", color: T.teal },
            { scenario: "High dose: apixaban > 5 mg OR rivaroxaban > 10 mg · last dose ≤ 8h OR unknown", dose: "800 mg IV bolus over 15 min → 960 mg IV over 2h", color: T.coral },
          ].map(({ scenario, dose, color }) => (
            <div key={scenario} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 12px", borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{scenario}</div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color, fontWeight: 700 }}>{dose}</div>
            </div>
          ))}
        </div>
        {[
          { l: "Onset",       v: "Anti-Xa activity reduced by 90% within 2 min of bolus" },
          { l: "Duration",    v: "2h of continuous infusion provides sustained reversal · rebounds possible after infusion ends" },
          { l: "Limitations", v: "Very expensive ($27,000–50,000/dose) · VTE risk post-reversal (reverses anticoagulation completely) · not available at all centers · does NOT reverse dabigatran" },
          { l: "ANNEXA-4 trial", v: "FDA approval based on hemostatic efficacy in major bleeding · 82% excellent/good hemostasis · 10% VTE rate within 30 days" },
        ].map(({ l, v }) => (
          <div key={l} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, minWidth: 110, flexShrink: 0 }}>{l}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Idarucizumab (Praxbind) — Dabigatran Reversal</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Humanized monoclonal antibody fragment — binds dabigatran 350× more avidly than thrombin</div>
        <div style={aBox(T.purple, 10)}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Fixed dose — not weight-based</div>
          <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.purple }}>5 g IV (two 2.5g vials) over 5–10 min</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>Give both vials consecutively · complete reversal in seconds · no need to measure dabigatran level first</div>
        </div>
        {[
          { l: "Onset",       v: "Reversal within seconds to minutes · aTT and ECT normalize immediately" },
          { l: "Duration",    v: "Sustained reversal · dabigatran may rebound if high tissue levels (re-equilibration) · second dose if needed" },
          { l: "Re-dosing",   v: "If bleeding recurs and dabigatran levels recover: can give second 5g dose · discuss with hematology" },
          { l: "RE-VERSE AD", v: "Trial: 100% reversal of dabigatran anticoagulation within minutes · landmark trial for approval" },
        ].map(({ l, v }) => (
          <div key={l} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 100, flexShrink: 0 }}>{l}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>When Specific Antidotes Unavailable — 4F-PCC as Bridge</div>
      {[
        { d: "Apixaban / Rivaroxaban (Xa)", tx: "4F-PCC 50 units/kg IV (max 5,000 units) · evidence from ex vivo studies and small case series · less effective than andexanet but widely available · aPCC (FEIBA) 50 units/kg may also be used", color: T.blue },
        { d: "Dabigatran (IIa)", tx: "aPCC (FEIBA) 50 units/kg · hemodialysis removes dabigatran (~50% in 4h — dialyzable unlike warfarin/DOACs) · charcoal if very recent ingestion (&lt; 2h) · 4F-PCC less evidence for direct thrombin inhibition", color: T.purple },
      ].map(({ d, tx, color }) => (
        <div key={d} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{d}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{tx}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Timing Since Last DOAC Dose</div>
      {[
        { time: "&lt; 2h", guidance: "Activated charcoal 50g PO if patient can protect airway and no contraindication · reduces absorption by 50–60% · consider gastric lavage for massive ingestion", color: T.gold },
        { time: "2–8h", guidance: "Drug still being absorbed · peak effect may not yet be reached · give reversal agent regardless · monitor anti-Xa level if available", color: T.amber },
        { time: "&gt; 8h", guidance: "Most drug absorbed · levels declining · reversal indicated if bleeding present · shorter duration of drug effect expected · last dose timing is key for andexanet dosing", color: T.teal },
      ].map(({ time, guidance, color }) => (
        <div key={time} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10 }}>
          <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color, minWidth: 55 }}>{time}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{guidance}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: HEPARIN / LMWH ──────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Protamine Sulfate — UFH Reversal</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 10 }}>Protamine: 1 mg per 100 units UFH given in last 2–3 hours</div>
        {[
          { scenario: "IV UFH infusion running", dose: "1 mg per 100 units in last 2h of infusion · max 50 mg · give over 10 min · check aPTT 15 min after", color: T.gold },
          { scenario: "IV UFH bolus in last 30 min", dose: "1 mg per 100 units of the bolus dose · max 50 mg · full reversal", color: T.gold },
          { scenario: "IV UFH bolus 30–60 min ago", dose: "0.5–0.75 mg per 100 units given", color: T.amber },
          { scenario: "IV UFH bolus &gt; 2h ago",       dose: "0.25 mg per 100 units · smaller dose (heparin partly metabolized)", color: T.teal },
        ].map(({ scenario, dose, color }) => (
          <div key={scenario} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 12px", borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{scenario}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color, fontWeight: 700 }}>{dose}</div>
          </div>
        ))}
        <div style={aBox(T.coral, 0)}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.coral, fontWeight: 600 }}>Protamine side effects: </span>
            Hypotension (rapid infusion) · bradycardia · bronchospasm · anaphylaxis (especially in fish allergy or prior protamine exposure · NPH insulin users) · give slowly over 10 min · have epinephrine ready
          </div>
        </div>
      </div>

      <div style={sL(T.amber)}>LMWH Reversal (Enoxaparin)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
          Protamine only partially reverses LMWH (neutralizes anti-IIa · incompletely neutralizes anti-Xa). Anti-Xa activity reduced 60–80%.
        </div>
        {[
          { scenario: "Last dose &lt; 8h ago",    dose: "1 mg protamine per 1 mg (100 units anti-Xa) of enoxaparin given · max 50 mg · over 10 min", color: T.amber },
          { scenario: "Last dose 8–12h ago",   dose: "0.5 mg protamine per 1 mg enoxaparin · partial reversal", color: T.gold },
          { scenario: "Last dose &gt; 12h ago",   dose: "Protamine has limited benefit · most anti-Xa activity has waned · supportive care", color: T.teal },
        ].map(({ scenario, dose, color }) => (
          <div key={scenario} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 12px", borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{scenario}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color, fontWeight: 700 }}>{dose}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.blue)}>Fondaparinux — No Specific Antidote</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>Fondaparinux is a synthetic pentasaccharide — protamine does NOT bind it. No FDA-approved reversal agent.</div>
        {[
          { option: "rFVIIa (NovoSeven)",      detail: "90 mcg/kg IV · off-label · bypasses Xa inhibition · limited evidence · expensive · VTE risk · use for life-threatening hemorrhage", color: T.coral },
          { option: "4F-PCC",                  detail: "50 units/kg · limited evidence · may partially bypass · reasonable option when rFVIIa unavailable", color: T.teal },
          { option: "Dialysis",                detail: "Does NOT remove fondaparinux (highly protein-bound) · not effective · supportive care only · time-limited half-life 17–21h", color: T.gold },
          { option: "Activated charcoal",      detail: "If ingested (rare — usually parenteral) and within 2h · may reduce absorption · not effective for SC route · supportive care main strategy", color: T.blue },
        ].map(({ option, detail, color }) => (
          <div key={option} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{option}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>HIT — Heparin-Induced Thrombocytopenia</div>
      <div style={{ ...card({ marginBottom: 14, background: "rgba(167,139,250,0.07)", borderColor: "rgba(167,139,250,0.3)" }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>
          HIT ≠ anticoagulant reversal — but critical to recognize and manage:
        </div>
        {[
          { f: "4T Score",    v: "Thrombocytopenia + Timing (5–10 days after heparin) + Thrombosis + oTher causes excluded · ≥ 6 = high probability · send PF4-heparin antibody" },
          { f: "STOP HEPARIN", v: "Immediately stop ALL heparin (including heparin flushes · LMWH · HIT can be triggered by any heparin exposure)" },
          { f: "Alternative Anticoagulation", v: "Argatroban (IV direct thrombin inhibitor · hepatically cleared) OR Bivalirudin · fondaparinux acceptable · DO NOT give warfarin until PLT > 150k (warfarin-induced skin necrosis risk in acute HIT)" },
        ].map(({ f, v }) => (
          <div key={f} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 120, flexShrink: 0 }}>{f}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Monitoring After Reversal</div>
      {[
        { d: "Warfarin",    check: "INR at 15–30 min and 6h after 4F-PCC · rebound elevation common without Vitamin K · recheck at 24h", color: T.coral },
        { d: "Apixaban/Rivaroxaban", check: "Anti-Xa level (drug-specific) at 2h and 12h post-andexanet · clinical hemostasis assessment · watch for VTE post-reversal", color: T.blue },
        { d: "Dabigatran",  check: "aTT and ECT normalize immediately after idarucizumab · thrombin time if available · dabigatran level if accessible", color: T.purple },
        { d: "UFH",         check: "aPTT at 15 min post-protamine · target aPTT &lt; 40s · repeat dose if still elevated · anti-Xa level if available", color: T.gold },
      ].map(({ d, check, color }) => (
        <div key={d} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{d}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{check}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Anticoagulation Resumption</div>
      <div style={{ ...card() }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Balance between thrombotic risk (mechanical valve · AF · VTE) and re-bleeding risk. Discuss with the prescribing physician and consider:
        </div>
        {[
          "ICH: typical hold 4 weeks minimum · restart only if very high thrombotic risk (mechanical valve) after neurosurgery review",
          "Major GI bleed: typically restart within 7–14 days after hemostasis (DOACs preferred over warfarin for AF post-GI bleed)",
          "Minor bleeding (skin, superficial): may restart within 24–48h at same or reduced dose after source control",
          "VTE (patient's reason for anticoagulation): weigh recurrence risk vs re-bleeding · IVC filter as bridge if cannot anticoagulate",
          "Mechanical valve: highest thrombotic risk — restart as soon as safely possible · IV UFH bridge if needed",
        ].map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5, marginTop: i === 0 ? 8 : 0 }}>
            <span style={{ color: T.gold, flexShrink: 0 }}>▸</span>{s}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(34,197,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(59,130,246,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (<button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>← Critical Protocols</button>)}
        <div>
          <span style={pill("linear-gradient(135deg,#22c55e,#15803d)")}>🩸 Hematologic</span>
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>AHA / ASH 2023</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Anticoagulant Reversal</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Warfarin 4F-PCC calculator · Andexanet alfa · Idarucizumab · Protamine · Fondaparinux · HIT · Resumption timing</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.green : T.border}`, background: tab === i ? "rgba(34,197,94,0.14)" : T.glass, color: tab === i ? T.green : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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