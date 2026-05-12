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

const PLASMIC_ITEMS = [
  { id: "plt",      label: "Platelet count < 30 × 10⁹/L", pts: 2 },
  { id: "hemo",     label: "Hemolysis (↑ bilirubin/LDH/↓ haptoglobin)", pts: 1 },
  { id: "no_cause", label: "No other cause of thrombocytopenia", pts: 1 },
  { id: "creat",    label: "Creatinine < 2.26 mg/dL (not severe renal failure)", pts: 1 },
  { id: "neuro",    label: "Neurological abnormality", pts: 1 },
];

export default function TTPHub({ onBack }) {
  const [tab, setTab]     = useState(0);
  const [plasmic, setPlasmic] = useState({});
  const [expanded, setExpanded] = useState(null);
  const TABS = ["Recognition", "Treatment", "TTP vs HUS", "Monitoring"];

  const plasmicScore = PLASMIC_ITEMS.reduce((s, i) => s + (plasmic[i.id] ? i.pts : 0), 0);
  const plasmicInterp = plasmicScore >= 5 ? { label: "High risk TTP — start plasma exchange immediately", color: T.coral }
    : plasmicScore >= 3 ? { label: "Intermediate risk — hematology urgent consult · consider empiric TPE", color: T.amber }
    : { label: "Low risk TTP — investigate other causes", color: T.teal };

  const toggle = (id) => setPlasmic(p => ({ ...p, [id]: !p[id] }));

  const TTP_HUS = [
    { feature: "Primary mechanism",    ttp: "ADAMTS13 deficiency → ultralarge vWF multimers → platelet microthrombi", hus: "Shiga toxin or complement dysregulation → endothelial injury → thrombus" },
    { feature: "ADAMTS13 activity",    ttp: "< 10% (severely deficient) — diagnostic", hus: "Normal or mildly reduced" },
    { feature: "Age",                  ttp: "Adults (peak 30–40s) · female predominance 2:1", hus: "Children (typical HUS) · adults (atypical HUS)" },
    { feature: "Precipitant",          ttp: "Often idiopathic (acquired anti-ADAMTS13) · drugs · pregnancy · HIV", hus: "E. coli O157:H7 (bloody diarrhea) · complement mutations (aHUS)" },
    { feature: "Neurological features", ttp: "Prominent — fluctuating · confusion · seizures · stroke · 65% of patients", hus: "Less prominent (typical HUS) · more severe in aHUS" },
    { feature: "Renal failure",         ttp: "Mild-moderate (creatinine usually < 3)", hus: "SEVERE — oliguria/anuria · dialysis often required" },
    { feature: "Diarrhea prodrome",     ttp: "Absent", hus: "Present (Shiga toxin) · bloody diarrhea 3–10 days prior" },
    { feature: "First-line treatment",  ttp: "Plasma exchange (TPE) + steroids + rituximab", hus: "Supportive (typical) · Eculizumab (atypical/complement-mediated)" },
    { feature: "Platelet transfusion",  ttp: "AVOID — can precipitate thrombosis and worsen TTP", hus: "Also generally avoid unless life-threatening bleeding" },
  ];

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>TTP — Thrombotic Thrombocytopenic Purpura · Mortality &gt; 90% Without Treatment</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>TTP is a hematologic emergency. ADAMTS13 deficiency → ultralarge vWF multimers → platelet thrombi in microvasculature → thrombocytopenia + microangiopathic hemolytic anemia (MAHA) + end-organ ischemia. Do NOT transfuse platelets — this feeds the thrombotic process.</div>
      </div>

      <div style={sL()}>Classic Pentad — Rarely All Five Present (30%)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { f: "🩸 Thrombocytopenia", d: "PLT < 30k in most TTP · severe · purpura · petechiae · bruising · NOT a bleeding disorder (platelet consumption, not production failure)", color: T.coral },
          { f: "🔴 MAHA", d: "Microangiopathic hemolytic anemia · fragmented RBCs (schistocytes) on smear · elevated LDH · low haptoglobin · elevated indirect bilirubin · DAT negative", color: T.gold },
          { f: "🧠 Neurological", d: "Fluctuating · headache · confusion · focal deficits · seizures · stroke · TIA · altered mental status · 65% of TTP cases · may be the presenting complaint", color: T.purple },
          { f: "🌡 Fever", d: "Low-grade fever common · not always present · sepsis/DIC must be excluded", color: T.amber },
          { f: "🫘 Renal Failure", d: "Usually mild in TTP (creatinine &lt; 3) — distinguishes from HUS · marked renal failure → think HUS or aHUS", color: T.teal },
        ].map(({ f, d, color }) => (
          <div key={f} style={card({ padding: "11px 12px", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{f}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.35 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={sL()}>PLASMIC Score — TTP Risk Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Validated tool to risk-stratify TTP and guide empiric TPE initiation before ADAMTS13 results return (takes days)</div>
        {PLASMIC_ITEMS.map(item => (
          <div key={item.id} onClick={() => toggle(item.id)}
            style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${plasmic[item.id] ? T.green : T.border}`, background: plasmic[item.id] ? T.green + "30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: plasmic[item.id] ? T.green : T.dim, flexShrink: 0 }}>
              {plasmic[item.id] && "✓"}
            </div>
            <div style={{ flex: 1, fontSize: 12, color: plasmic[item.id] ? T.white : T.muted }}>{item.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: plasmic[item.id] ? T.green : T.dim, flexShrink: 0 }}>+{item.pts}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>PLASMIC Score</span>
          <span style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 800, color: plasmicInterp.color }}>{plasmicScore}</span>
        </div>
        <div style={aBox(plasmicInterp.color, 4)}>
          <div style={{ fontSize: 12, fontWeight: 700, color: plasmicInterp.color }}>{plasmicInterp.label}</div>
        </div>
        <button onClick={() => setPlasmic({})} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>Reset</button>
      </div>

      <div style={sL(T.gold)}>Blood Smear — Schistocytes Are Key</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>
          A peripheral blood smear showing <span style={{ color: T.gold, fontWeight: 600 }}>schistocytes (fragmented RBCs)</span> confirms microangiopathic hemolytic anemia. This is the single most important bedside test. Helmet cells · triangle cells · irregular fragments. Any schistocytes + thrombocytopenia = TTP until proven otherwise.
        </div>
        {["Normal: schistocytes &lt; 0.5% of RBCs",
          "Significant: schistocytes ≥ 1% = MAHA until proven otherwise",
          "TTP typically: 2–5% or more",
          "Call hematology the moment you see schistocytes + low platelets + elevated LDH"].map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ color: T.gold }}>▸</span>{s}
          </div>
        ))}
      </div>

      <div style={sL(T.coral)}>Causes of TTP</div>
      {[
        { type: "Acquired (Immune) TTP", pct: "~95%", detail: "Anti-ADAMTS13 IgG autoantibody · idiopathic or triggered · most common · responds to immunosuppression", color: T.coral },
        { type: "Congenital (Upshaw-Schulman)", pct: "~5%", detail: "ADAMTS13 gene mutation · presents in childhood or with triggers (pregnancy, infection) · recurrent episodes · FFP to replace ADAMTS13", color: T.blue },
        { type: "Drug-Induced TMA", pct: "Variable", detail: "Immune: quinine (most common) · ticlopidine · clopidogrel · immune complex mechanism · Dose-related: mitomycin C · cyclosporine · tacrolimus · VEGF inhibitors", color: T.amber },
        { type: "Pregnancy-Associated", pct: "Significant",  detail: "HELLP syndrome · severe preeclampsia · postpartum TTP · pregnancy triggers acquired TTP in susceptible women · delivery is treatment for HELLP (not TTP)", color: T.purple },
        { type: "HIV-Associated", pct: "Rare", detail: "ADAMTS13 deficiency from HIV · responds to TPE · ART may prevent recurrence", color: T.teal },
      ].map(({ type, pct, detail, color }, i) => (
        <div key={i} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{type}</span>
            <span style={{ fontSize: 10, color: T.dim }}>{pct}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: TREATMENT ────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>⚠ DO NOT TRANSFUSE PLATELETS — Start TPE Immediately</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Platelet transfusion in TTP provides substrate for further microthrombus formation → clinical deterioration ("throwing fuel on the fire"). Emergency plasma exchange is the life-saving intervention — do not delay for ADAMTS13 results.</div>
      </div>

      <div style={sL()}>Immediate Protocol</div>
      {[
        { n: 1, label: "HEMATOLOGY CONSULT — STAT",  color: T.coral, detail: "Call immediately on suspicion. TPE cannot start without hematology or apheresis team involvement. Mortality without TPE > 90% — every hour matters.", time: "T = 0" },
        { n: 2, label: "Plasma Exchange (TPE) — EMERGENT", color: T.purple, detail: "1.0–1.5 plasma volumes per session · with FFP as replacement fluid · daily until remission (PLT > 150k for 2 consecutive days · LDH normal · neurological recovery) · central venous access required · typical course 7–14 days", time: "&lt; 4–6h" },
        { n: 3, label: "Corticosteroids",             color: T.gold, detail: "Methylprednisolone 1 mg/kg/day IV (or prednisone 1 mg/kg/day PO) · reduces autoantibody production · start with first TPE · taper slowly over weeks after remission", time: "Simultaneously" },
        { n: 4, label: "Caplacizumab (Cablivi)",      color: T.teal, detail: "Anti-vWF nanobody · 10 mg SQ loading dose → 10 mg SQ daily during TPE + 30 days after · reduces time to response and recurrence · blocks ultralarge vWF-platelet binding · FDA approved 2019 · use with TPE + steroids", time: "With first TPE" },
        { n: 5, label: "Rituximab",                   color: T.blue, detail: "375 mg/m² IV weekly × 4 doses · anti-CD20 · depletes B cells → reduces anti-ADAMTS13 antibody production · significantly reduces relapse rate · most centers add early (not waiting for relapse) · also used for refractory/relapsing TTP", time: "Early add-on" },
        { n: 6, label: "Bridge: Fresh Frozen Plasma", color: T.amber, detail: "If TPE unavailable: FFP 25–30 mL/kg IV (replaces ADAMTS13) · CANNOT match TPE efficacy (cannot remove anti-ADAMTS13 antibodies) · temporary bridge only — get to TPE ASAP", time: "If TPE delayed" },
      ].map(({ n, label, color, detail, time }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
              <span style={{ ...tag(color), fontSize: 9, whiteSpace: "nowrap", marginLeft: 6 }}>{time}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.coral)}>What NOT to Do</div>
      {[
        { avoid: "Platelet transfusion", reason: "Feeds microthrombus formation · only give for life-threatening hemorrhage (CNS bleed or surgery) · discuss with hematology first", color: T.coral },
        { avoid: "Antiplatelet agents / anticoagulants", reason: "Not proven beneficial · increases bleeding risk · not standard of care · hematology guidance required", color: T.amber },
        { avoid: "Delay for ADAMTS13 results", reason: "Takes days · do NOT wait · treat empirically on clinical suspicion + PLASMIC score · start TPE based on clinical picture", color: T.coral },
      ].map(({ avoid, reason, color }) => (
        <div key={avoid} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>✗ {avoid}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{reason}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Remission Criteria — Stop TPE When</div>
      {["PLT ≥ 150 × 10⁹/L for 2 consecutive days",
        "LDH normalizing to ≤ upper limit of normal",
        "Clinical neurological improvement",
        "Hemoglobin stabilizing or recovering",
        "ADAMTS13 activity recovering (may lag clinical recovery)"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.teal }}>✓</span>{s}
        </div>
      ))}

      <div style={aBox(T.amber, 0)}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.amber, fontWeight: 600 }}>Relapse: </span>30–50% relapse rate within 10 years. Rituximab in remission reduces relapse. Recurrence may be triggered by pregnancy, infection, or surgery. Long-term hematology follow-up essential. ADAMTS13 monitoring during remission predicts relapse.
        </div>
      </div>
    </div>
  );

  // ── TAB 2: TTP vs HUS ───────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.purple, 16)}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.purple, fontWeight: 700 }}>TTP and HUS both cause MAHA + thrombocytopenia (thrombotic microangiopathy) but have different mechanisms, presentations, and treatments. </span>
          Distinguishing them urgently is critical — typical HUS is supportive, atypical HUS uses eculizumab, and TTP requires urgent plasma exchange.
        </div>
      </div>

      <div style={sL()}>TTP vs HUS Comparison</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 400 }}>
          {TTP_HUS.map(({ feature, ttp, hus }, i) => (
            <div key={feature} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.018)", padding: "9px 8px", gap: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.gold, minWidth: 130, flexShrink: 0 }}>{feature}</div>
              <div style={{ flex: 1, fontSize: 11.5, color: T.purple }}>{ttp}</div>
              <div style={{ flex: 1, fontSize: 11.5, color: T.teal }}>{hus}</div>
            </div>
          ))}
          <div style={{ display: "flex", padding: "6px 8px", gap: 8, marginTop: 4 }}>
            <div style={{ minWidth: 130 }} />
            <div style={{ flex: 1, fontSize: 9.5, fontWeight: 700, color: T.purple, textTransform: "uppercase", letterSpacing: "0.07em" }}>TTP</div>
            <div style={{ flex: 1, fontSize: 9.5, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.07em" }}>HUS</div>
          </div>
        </div>
      </div>

      <div style={sL(T.teal)}>HUS Subtypes</div>
      {[
        { type: "Typical HUS (Shiga toxin / STEC-HUS)", color: T.teal,
          cause: "E. coli O157:H7 (most common) · E. coli O104:H4 · Shigella · Shiga toxin damages renal endothelium",
          presentation: "Bloody diarrhea 3–10 days prior · acute onset · mostly children · severe AKI + MAHA + thrombocytopenia · neurological uncommon (vs TTP)",
          tx: "Supportive care · fluids (avoid hypovolemia) · dialysis if severe AKI · NO antibiotics (may worsen by releasing more Shiga toxin) · NO antiperistaltics (prolongs exposure) · eculizumab not routinely needed · most recover renal function" },
        { type: "Atypical HUS (aHUS — Complement-mediated)", color: T.amber,
          cause: "Complement regulatory gene mutations (CFH · CFI · CD46 · C3) or anti-CFH antibodies · dysregulated complement activation",
          presentation: "No diarrhea prodrome · recurrent episodes · adults more than children · can be triggered by pregnancy · infection · surgery",
          tx: "Eculizumab (C5 complement inhibitor) — specific treatment · meningococcal vaccination REQUIRED before eculizumab · plasma exchange less effective but used as bridge · long-term eculizumab or ravulizumab maintenance · hematology + nephrology" },
      ].map(({ type, color, cause, presentation, tx }) => (
        <div key={type} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{type}</div>
          {[{ l: "Cause", v: cause }, { l: "Presentation", v: presentation }, { l: "Treatment", v: tx }].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 90, flexShrink: 0 }}>{l}</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{v}</div>
            </div>
          ))}
        </div>
      ))}

      <div style={sL(T.gold)}>Other Thrombotic Microangiopathies (TMA)</div>
      {[
        { tma: "Complement-mediated TMA", triggers: "Pregnancy · transplant · infection · malignancy · drugs", color: T.amber },
        { tma: "Drug-induced TMA",        triggers: "Quinine (most common) · gemcitabine · mitomycin · calcineurin inhibitors · VEGF inhibitors · clopidogrel (rare)", color: T.blue },
        { tma: "HELLP Syndrome",          triggers: "Pregnancy complication · see HELLPHub · delivery is treatment", color: T.purple },
        { tma: "Malignant Hypertension",  triggers: "Severe uncontrolled HTN → endothelial damage → MAHA · ADAMTS13 normal · treat HTN · resolves with BP control", color: T.coral },
        { tma: "DIC",                     triggers: "Sepsis · trauma · MAHA present but fibrinogen consumed · elevated D-dimer · prolonged PT/INR (differs from TTP)", color: T.gold },
      ].map(({ tma, triggers, color }) => (
        <div key={tma} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{tma}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{triggers}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 12h",  items: "CBC with differential · platelet count · LDH · bilirubin · peripheral smear for schistocytes · creatinine · mental status", color: T.coral },
        { freq: "Every 24h",  items: "ADAMTS13 activity (if not yet resulted) · coagulation panel · fibrinogen · Hgb trend · haptoglobin · urinalysis (hematuria from MAHA)", color: T.gold },
        { freq: "Per TPE session", items: "Pre and post-TPE platelet count · LDH before each session · vital signs during exchange · ADAMTS13 at start and end of TPE course", color: T.teal },
        { freq: "Continuous", items: "Neuro checks (TTP strokes) · BP monitoring · IV access patency · fluid balance (TPE replaces large plasma volumes)", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 130, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Key Labs — What to Track</div>
      {[
        { lab: "Platelet count",    target: "Rising toward ≥ 150k · doubling between sessions is good sign · persistent fall = refractory TTP", color: T.coral },
        { lab: "LDH",              target: "Falling toward normal · most sensitive marker of hemolysis activity · remains elevated in active disease", color: T.gold },
        { lab: "Haptoglobin",      target: "Rising from undetectable · free Hgb consumed by haptoglobin → depleted in hemolysis", color: T.teal },
        { lab: "Indirect bilirubin", target: "Falling as hemolysis resolves · lags behind platelet recovery", color: T.amber },
        { lab: "Creatinine",       target: "Stable or improving · worsening renal function suggests HUS or secondary TMA rather than TTP", color: T.blue },
        { lab: "ADAMTS13 activity", target: "< 10% confirms TTP · rising toward normal indicates response · may lag clinical recovery by weeks", color: T.purple },
      ].map(({ lab, target, color }) => (
        <div key={lab} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 140, flexShrink: 0 }}>{lab}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{target}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Refractory / Relapsing TTP</div>
      {["Refractory: no PLT response after 5–7 TPE sessions → increase TPE frequency (BID) · rituximab · cyclosporine",
        "Consider splenectomy for refractory cases (removes anti-ADAMTS13 antibody-producing cells) — last resort",
        "Exacerbation (worsening during TPE taper): restart daily TPE + increase steroids · check ADAMTS13 inhibitor level",
        "Relapse monitoring: ADAMTS13 activity q 3 months in remission · PLT + LDH monthly · level &lt; 10% predicts relapse"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{s}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",           detail: "All confirmed TTP requiring TPE · neurological involvement · hemodynamic instability · requiring central venous access placement · caplacizumab initiation" },
          { level: "Hematology ICU / BMT Unit", detail: "Ideal setting for TPE (dedicated apheresis team) · daily exchanges · rituximab administration · ADAMTS13 monitoring · relapse management" },
          { level: "Floor (rare)",  detail: "Very mild TTP with rising platelets on FFP bridge while awaiting TPE transfer · stable without neurological involvement · only as very short-term bridge" },
          { level: "Long-term Follow-up", detail: "Hematology every 3 months in remission · ADAMTS13 monitoring · rituximab for ADAMTS13 level declining · pregnancy counseling (high-risk pregnancy with TTP history) · immunosuppression taper plan" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 150, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(34,197,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(167,139,250,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (<button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>← Critical Protocols</button>)}
        <div>
          <span style={pill("linear-gradient(135deg,#22c55e,#15803d)")}>🩸 Hematologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ASH / ISTH 2021</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>TTP / HUS</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>PLASMIC score · Schistocytes · Plasma exchange urgency · Do NOT transfuse platelets · TTP vs HUS vs aHUS · Caplacizumab · Rituximab</p>
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