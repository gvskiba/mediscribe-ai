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
const sL   = (c = T.coral) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

const ABC_ITEMS = [
  { id: "pen",  label: "Penetrating mechanism", pts: 1 },
  { id: "sbp",  label: "Systolic BP ≤ 90 mmHg", pts: 1 },
  { id: "hr",   label: "Heart rate ≥ 120 bpm",  pts: 1 },
  { id: "fast", label: "Positive FAST exam",     pts: 1 },
];

export default function MTPHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]     = useState(0);
  const [abcVals, setAbcVals] = useState({});
  const [packs, setPacks] = useState(1);
  const [txa, setTxa]     = useState(false);
  const TABS = ["Activation", "Protocol", "Products", "Damage Control"];

  const abcScore = ABC_ITEMS.reduce((s, i) => s + (abcVals[i.id] ? 1 : 0), 0);
  const abcInterp = abcScore >= 2
    ? { label: "MTP Activation Indicated", color: T.coral }
    : abcScore === 1
    ? { label: "Monitor Closely — reassess", color: T.gold }
    : { label: "MTP unlikely needed", color: T.green };

  const toggleAbc = (id) => setAbcVals(p => ({ ...p, [id]: !p[id] }));

  // ── TAB 0: ACTIVATION ────────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Activate MTP Early — Before Coagulopathy Develops</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Massive transfusion = ≥ 10 units pRBC in 24h OR ≥ 4 units in 1h with ongoing hemorrhage. Early 1:1:1 resuscitation (pRBC:FFP:PLT) reduces mortality from traumatic hemorrhage.</div>
      </div>

      <div style={sL()}>ABC Score — Activation Criteria</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Assessment of Blood Consumption (ABC) Score — ≥ 2 points = activate MTP</div>
        {ABC_ITEMS.map(item => (
          <div key={item.id} onClick={() => toggleAbc(item.id)}
            style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${abcVals[item.id] ? T.coral : T.border}`, background: abcVals[item.id] ? T.coral + "30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: abcVals[item.id] ? T.coral : T.dim, flexShrink: 0 }}>
              {abcVals[item.id] && "✓"}
            </div>
            <div style={{ flex: 1, fontSize: 12, color: abcVals[item.id] ? T.white : T.muted }}>{item.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: abcVals[item.id] ? T.coral : T.dim }}>+{item.pts}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>ABC Score</span>
          <span style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 800, color: abcInterp.color }}>{abcScore}</span>
        </div>
        <div style={{ ...aBox(abcInterp.color, 0), marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: abcInterp.color }}>{abcInterp.label}</div>
        </div>
        <button onClick={() => setAbcVals({})} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>Reset</button>
      </div>

      <div style={sL(T.gold)}>Other Activation Triggers</div>
      {[
        "Trauma surgeon / attending clinical gestalt — 'this patient will need massive transfusion'",
        "PRBC transfusion ≥ 2 units in < 30 min with ongoing hemorrhage",
        "Penetrating truncal trauma with hemodynamic instability",
        "Ruptured abdominal aortic aneurysm",
        "Obstetric hemorrhage refractory to uterotonics (postpartum hemorrhage)",
        "Major hepatic trauma or pelvic ring disruption with hemorrhage",
      ].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}>
          <span style={{ color: T.gold, flexShrink: 0 }}>●</span>{t}
        </div>
      ))}

      <div style={sL(T.teal)}>Activation Steps</div>
      {[
        { n: 1, step: "Call blood bank — announce MTP activation",     detail: "Notify blood bank with patient MRN · blood bank begins preparing coolers per institutional protocol", color: T.teal },
        { n: 2, step: "Send TYPE & SCREEN immediately",                detail: "Type-specific blood within 15 min (if available) · use O negative pRBC and AB FFP until type confirmed", color: T.blue },
        { n: 3, step: "Send baseline coagulation labs",                detail: "PT/INR · aPTT · fibrinogen · CBC · ABG + lactate · TEG/ROTEM if available", color: T.gold },
        { n: 4, step: "IV access — large bore",                        detail: "2 large-bore IVs minimum · consider introducer sheath (8.5 Fr) · IO if unable · pressure bags or rapid infuser", color: T.amber },
        { n: 5, step: "Prepare for damage control resuscitation",       detail: "Warm all blood products · use pressure infusers (Level 1 / Belmont) · minimize crystalloid · notify OR/IR/surgery", color: T.coral },
      ].map(({ n, step, detail, color }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: PROTOCOL ──────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>1:1:1 Ratio — pRBC : FFP : Platelets</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>PROPPR trial (2015): 1:1:1 vs 1:1:2 — improved 24h survival and better hemostasis with 1:1:1. This is now the standard for massive hemorrhage resuscitation.</div>
      </div>

      <div style={sL()}>Cooler / Pack Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 10 }}>Number of MTP Packs</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[1, 2, 3, 4].map(n => (
            <button key={n} onClick={() => setPacks(n)}
              style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${packs === n ? T.coral : T.border}`, background: packs === n ? "rgba(244,63,94,0.16)" : T.glass, color: packs === n ? T.coral : T.muted, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: T.mono, transition: "all 0.15s" }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            { product: "pRBC", units: packs * 6, color: T.coral },
            { product: "FFP",  units: packs * 6, color: T.gold },
            { product: "Platelets (Apheresis)", units: packs * 1, color: T.teal },
          ].map(({ product, units, color }) => (
            <div key={product} style={{ ...G({ borderRadius: 9 }), padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{product}</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color }}>{units}</div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{units === 1 ? "unit" : "units"}</div>
            </div>
          ))}
        </div>
        <div style={{ ...aBox(T.gold, 0), marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>Cryoprecipitate: add 10 units (1 pool) if fibrinogen &lt; 150 mg/dL · contains fibrinogen + Factor VIII + vWF + Factor XIII</div>
        </div>
      </div>

      <div style={sL(T.teal)}>Tranexamic Acid (TXA)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>Administer TXA?</span>
          <button onClick={() => setTxa(!txa)}
            style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${txa ? T.teal : T.border}`, background: txa ? "rgba(20,184,166,0.2)" : T.glass, color: txa ? T.teal : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans }}>
            {txa ? "✓ Yes — giving TXA" : "Not giving TXA"}
          </button>
        </div>
        {txa && (
          <div style={aBox(T.teal, 10)}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color: T.teal, marginBottom: 4 }}>1 g IV over 10 min → 1 g IV over 8h</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>CRASH-2 trial: reduces mortality in traumatic hemorrhage if given within 3h of injury · No benefit after 3h (possible harm) · WOMAN trial: benefit in PPH</div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={aBox(T.green, 0)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, marginBottom: 2 }}>Give if:</div>
            {["Major trauma with hemorrhage", "Injury ≤ 3h", "Postpartum hemorrhage (WOMAN trial)", "Active hemorrhage + hypotension"].map((s, i) => (
              <div key={i} style={{ fontSize: 11, color: T.muted, display: "flex", gap: 5, marginBottom: 2 }}><span style={{ color: T.green }}>✓</span>{s}</div>
            ))}
          </div>
          <div style={aBox(T.coral, 0)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Avoid if:</div>
            {["> 3h from injury", "DIC with fibrinolytic shutdown", "Active thromboembolic disease", "HALT-IT: NOT routine GI bleed"].map((s, i) => (
              <div key={i} style={{ fontSize: 11, color: T.muted, display: "flex", gap: 5, marginBottom: 2 }}><span style={{ color: T.coral }}>✗</span>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={sL(T.purple)}>Goal-Directed Resuscitation with TEG/ROTEM</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
          Viscoelastic testing (TEG = Thromboelastography · ROTEM = Rotational Thromboelastometry) provides real-time coagulation assessment — guides specific product replacement rather than empiric 1:1:1.
        </div>
        {[
          { param: "Prolonged CT/R (clot initiation)", product: "FFP — factor deficiency", color: T.gold },
          { param: "Low A5/MA (clot strength)",         product: "Platelets or cryoprecipitate", color: T.teal },
          { param: "Hypofibrinogenemia (low FIBTEM A5)", product: "Cryoprecipitate (fibrinogen concentrate)", color: T.blue },
          { param: "Fibrinolysis (LY30 > 3% or ML > 15%)", product: "TXA 1g IV immediately", color: T.coral },
        ].map(({ param, product, color }) => (
          <div key={param} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "9px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ ...tag(color), fontSize: 10, flexShrink: 0, whiteSpace: "nowrap" }}>Abnormal</span>
            <div>
              <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 2 }}>{param}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color }}>→ {product}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Deactivation Criteria</div>
      {["Hemorrhage surgically controlled · source of bleeding addressed",
        "Hemodynamic stability without ongoing resuscitation",
        "INR < 1.5 · PLT > 100k · Fibrinogen > 200 mg/dL · pH > 7.35",
        "Surgeon / trauma attending confirms hemorrhage control",
        "Notify blood bank immediately when deactivating — return unused products"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.green }}>✓</span>{t}
        </div>
      ))}
    </div>
  );

  // ── TAB 2: PRODUCTS ──────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={sL()}>Blood Product Reference</div>
      {[
        { product: "pRBC (Packed Red Blood Cells)", color: T.coral,
          volume: "~250–350 mL/unit", hgb_rise: "1 g/dL per unit (70 kg adult)", storage: "42 days at 4°C",
          contains: "Red cells · white cells (leukoreduced) · minimal plasma",
          notes: "Universal donor: O negative · Warm to body temperature before rapid infusion · each unit raises Hct ~3%" },
        { product: "FFP (Fresh Frozen Plasma)", color: T.gold,
          volume: "~250 mL/unit", hgb_rise: "—", storage: "1 year frozen",
          contains: "All coagulation factors · proteins · Vitamin K-dependent factors (II, VII, IX, X)",
          notes: "Universal donor: AB+ · ABO compatible preferred · thaw takes 20–30 min (order early) · use within 24h once thawed · 4-factor PCC faster for urgent reversal · does not contain platelets · INR correction requires 10–15 mL/kg" },
        { product: "Platelets (Apheresis)", color: T.teal,
          volume: "~300 mL/unit (1 apheresis = 1 unit = 4–6 pooled)", hgb_rise: "30–50k rise per unit", storage: "5 days at 22°C (room temp)",
          contains: "Platelets · plasma · white cells (leukoreduced)",
          notes: "ABO preferred · Rh negative in females of childbearing age · transfuse 1 apheresis unit per MTP pack · fastest product depleted · maintain PLT ≥ 50k (100k for TBI)" },
        { product: "Cryoprecipitate", color: T.blue,
          volume: "~15 mL/unit · typically given in pools of 10", hgb_rise: "—", storage: "1 year frozen",
          contains: "Fibrinogen · Factor VIII · vWF · Factor XIII · Fibronectin",
          notes: "Use when fibrinogen < 150 mg/dL · each pool (10 units) raises fibrinogen ~50–75 mg/dL · thaw takes 20–30 min · cryo essential in massive hemorrhage with fibrinogen depletion" },
        { product: "4-Factor PCC (Kcentra)", color: T.purple,
          volume: "~20–40 mL IV push", hgb_rise: "—", storage: "Refrigerated",
          contains: "Factors II, VII, IX, X + Protein C and S",
          notes: "Urgent warfarin reversal · faster and more complete than FFP · dose by INR · also used for DOACs (rivaroxaban, apixaban) · no large volume · VTE risk" },
      ].map(({ product, color, volume, hgb_rise, storage, contains, notes }) => (
        <div key={product} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{product}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
            {[{ l: "Volume", v: volume }, { l: "Storage", v: storage }, { l: "Contains", v: contains }, { l: "Hgb Rise", v: hgb_rise || "—" }].map(({ l, v }) => (
              <div key={l} style={{ ...G({ borderRadius: 7 }), padding: "7px 9px" }}>
                <div style={{ fontSize: 9.5, color: T.dim, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{notes}</div>
        </div>
      ))}

      <div style={sL(T.amber)}>Complications of Massive Transfusion</div>
      {[
        { comp: "Hypocalcemia",        detail: "Citrate in blood products chelates Ca²⁺ · give calcium gluconate 1g IV after every 4 units pRBC · or continuous infusion during MTP · hypocalcemia = cardiac dysfunction + worsened coagulopathy", color: T.gold },
        { comp: "Hypothermia",         detail: "Cold blood products → core temp drops → coagulopathy worsens (enzymes don't work) · warm all products · forced air warming blankets · warm IV fluids", color: T.blue },
        { comp: "Acidosis",            detail: "Stored blood is acidic (preservatives) + lactic acidosis from hemorrhagic shock · treat shock, not the pH directly · bicarbonate limited role · target lactate clearance", color: T.amber },
        { comp: "Hyperkalemia",        detail: "Old stored blood releases K⁺ from lysed cells · irradiated pRBC worse · monitor ECG · treat per hyperkalemia protocol", color: T.coral },
        { comp: "TACO (Transfusion-Associated Circulatory Overload)", detail: "Acute pulmonary edema from volume overload · diurese · slower rate if stable · most common transfusion complication", color: T.purple },
        { comp: "TRALI (Transfusion-Related Acute Lung Injury)", detail: "Donor antibody → recipient neutrophil activation → acute lung injury · hypoxia within 6h of transfusion · distinguish from TACO (TRALI: non-cardiogenic · no fluid overload) · treatment supportive", color: T.coral },
      ].map(({ comp, detail, color }) => (
        <div key={comp} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{comp}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: DAMAGE CONTROL ────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Damage Control Resuscitation (DCR)</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Simultaneously address the lethal triad: Hypothermia · Acidosis · Coagulopathy. Hemorrhage control is the priority — definitive repair comes after stabilization.</div>
      </div>

      <div style={sL()}>The Lethal Triad</div>
      <div style={{ ...G({ borderRadius: 14, padding: "16px", marginBottom: 14 }) }}>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14 }}>
          {[{ label: "Hypothermia", sub: "< 35°C", color: T.blue }, { label: "Acidosis", sub: "pH < 7.35", color: T.gold }, { label: "Coagulopathy", sub: "INR > 1.5", color: T.coral }].map(({ label, sub, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: color + "22", border: `2px solid ${color}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color }}>{sub}</div>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, textAlign: "center", lineHeight: 1.5 }}>
          Each makes the others worse. Hypothermia → coagulopathy (enzyme dysfunction). Acidosis → coagulopathy. Coagulopathy → continued hemorrhage → shock → more acidosis and hypothermia.
        </div>
      </div>

      <div style={sL()}>DCR Principles</div>
      {[
        { principle: "Permissive Hypotension",   detail: "SBP 80–90 mmHg in penetrating trauma before hemorrhage control · avoids dilution coagulopathy · prevents clot disruption · NOT for TBI (maintain MAP ≥ 80) · time-limited strategy", color: T.gold },
        { principle: "Minimize Crystalloid",     detail: "Every 1L NS above resuscitation need dilutes clotting factors · increases acidosis · promotes edema · switch to blood products early · target crystalloid < 3L total pre-OR", color: T.teal },
        { principle: "Early 1:1:1 Transfusion", detail: "PROPPR trial: 1:1:1 ratio of pRBC:FFP:PLT · prevents dilutional coagulopathy · each product given together · don't wait for labs to start ratio-based transfusion · reassess with TEG at 6 units", color: T.coral },
        { principle: "Hemorrhage Control",      detail: "Definitive source control as rapidly as possible · OR, IR angioembolization, or hybrid suite · tourniquet / wound packing for extremity hemorrhage · pelvic binder for pelvic fractures · REBOA for uncontrolled pelvic/abdominal hemorrhage", color: T.purple },
        { principle: "Damage Control Surgery",  detail: "Abbreviated laparotomy: pack, control, close temporarily · avoid definitive repair in unstable patient · re-look operation at 48–72h when physiology corrected · Damage control orthopedics: external fixation now, ORIF later", color: T.amber },
        { principle: "Calcium Replacement",     detail: "Give calcium gluconate 1g IV after every 4 pRBC units · ionized calcium < 1.1 mmol/L → give calcium · hypocalcemia = cardiac dysfunction + worsened coagulopathy · critical in MTP · check iCa regularly", color: T.blue },
      ].map(({ principle, detail, color }) => (
        <div key={principle} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{principle}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Damage Control Endpoints — "Physiologic Debt Repayment"</div>
      {[
        { end: "Temperature",  target: "≥ 35°C (> 36°C preferred)",   color: T.blue },
        { end: "pH",           target: "> 7.35",                       color: T.gold },
        { end: "Lactate",      target: "< 2 mmol/L (clearance > 20% per hour)", color: T.teal },
        { end: "INR",          target: "< 1.5",                        color: T.coral },
        { end: "Fibrinogen",   target: "> 200 mg/dL",                  color: T.amber },
        { end: "Platelets",    target: "> 100k (50k minimum · 100k for TBI)", color: T.purple },
        { end: "Ionized Ca²⁺", target: "> 1.1 mmol/L",                color: T.green },
      ].map(({ end, target, color }) => (
        <div key={end} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{end}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.white }}>{target}</span>
        </div>
      ))}

      <div style={sL(T.purple)}>Special Populations</div>
      {[
        { pop: "Anticoagulated Patients", detail: "Warfarin → 4-factor PCC + Vitamin K 10 mg IV · DOACs → andexanet alfa (apixaban/rivaroxaban) or idarucizumab (dabigatran) · see AnticoagulantReversalHub", color: T.purple },
        { pop: "Jehovah's Witness",       detail: "Blood transfusion refusal regardless of urgency · cell salvage (intraoperative autotransfusion) acceptable for many · erythropoietin · iron supplementation · volume expanders · document refusal and capacity", color: T.gold },
        { pop: "Pediatric MTP",           detail: "Activate at 40 mL/kg blood loss in 3h · ratio-based (same 1:1:1) · dose per kg · O negative pRBC · AB FFP until type confirmed · involve pediatric surgery / trauma", color: T.teal },
        { pop: "Obstetric Hemorrhage",    detail: "Activate MTP at PPH: uterotonics failed + ≥ 2L blood loss · add fibrinogen concentrate early · TXA (WOMAN trial) · uterine compression sutures · balloon tamponade · interventional radiology · hysterectomy · see PostpartumHemorrhageHub", color: T.coral },
      ].map(({ pop, detail, color }) => (
        <div key={pop} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{pop}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,63,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(245,158,11,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>🚨 Resuscitation</span>
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>PROPPR / CRASH-2</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Massive Transfusion Protocol</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>ABC activation score · 1:1:1 ratio · TXA protocol · TEG/ROTEM guide · Product reference · Damage control resuscitation</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.coral : T.border}`, background: tab === i ? "rgba(244,63,94,0.14)" : T.glass, color: tab === i ? T.coral : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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