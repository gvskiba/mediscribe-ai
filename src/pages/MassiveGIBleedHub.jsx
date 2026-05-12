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

const GBS_ITEMS = [
  { id: "bun",  label: "BUN (mg/dL)",       options: [{ l: "< 18.2", p: 0 }, { l: "18.2–22.3", p: 2 }, { l: "22.4–28", p: 3 }, { l: "28–70", p: 4 }, { l: "≥ 70", p: 6 }] },
  { id: "hgb_m", label: "Hgb — Male (g/dL)", options: [{ l: "≥ 13", p: 0 }, { l: "12–12.9", p: 1 }, { l: "10–11.9", p: 3 }, { l: "< 10", p: 6 }] },
  { id: "hgb_f", label: "Hgb — Female (g/dL)", options: [{ l: "≥ 12", p: 0 }, { l: "10–11.9", p: 1 }, { l: "< 10", p: 6 }] },
  { id: "sbp",  label: "SBP (mmHg)",        options: [{ l: "≥ 110", p: 0 }, { l: "100–109", p: 1 }, { l: "90–99", p: 2 }, { l: "< 90", p: 3 }] },
  { id: "pulse", label: "Pulse",            options: [{ l: "< 100 bpm", p: 0 }, { l: "≥ 100 bpm", p: 1 }] },
  { id: "melena", label: "Melena",          options: [{ l: "Absent", p: 0 }, { l: "Present", p: 1 }] },
  { id: "syncope", label: "Syncope",        options: [{ l: "Absent", p: 0 }, { l: "Present", p: 2 }] },
  { id: "liver", label: "Liver disease",    options: [{ l: "Absent", p: 0 }, { l: "Present", p: 2 }] },
  { id: "hf",   label: "Heart failure",     options: [{ l: "Absent", p: 0 }, { l: "Present", p: 2 }] },
];

const ROCKALL_ITEMS = [
  { id: "age",  label: "Age",                options: [{ l: "< 60", p: 0 }, { l: "60–79", p: 1 }, { l: "≥ 80", p: 2 }] },
  { id: "shock", label: "Shock",            options: [{ l: "No shock · SBP ≥ 100 · HR < 100", p: 0 }, { l: "Tachycardia · SBP ≥ 100 · HR ≥ 100", p: 1 }, { l: "Hypotension · SBP < 100", p: 2 }] },
  { id: "comorbidity", label: "Comorbidity", options: [{ l: "None", p: 0 }, { l: "CHF · IHD · any major comorbidity", p: 2 }, { l: "Renal failure · liver failure · metastatic cancer", p: 3 }] },
  { id: "diagnosis", label: "Endoscopic Diagnosis", options: [{ l: "Mallory-Weiss · no lesion · no SRH", p: 0 }, { l: "All other diagnoses", p: 1 }, { l: "Upper GI malignancy", p: 2 }] },
  { id: "srh",  label: "Stigmata of Hemorrhage", options: [{ l: "None or dark spot", p: 0 }, { l: "Blood in upper GI · adherent clot · visible / spurting vessel", p: 2 }] },
];

export default function MassiveGIBleedHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]       = useState(0);
  const [source, setSource] = useState(null);
  const [gbsVals, setGbsVals]     = useState({});
  const [rockallVals, setRockallVals] = useState({});
  const [scoreType, setScoreType] = useState("GBS");
  const TABS = ["Recognition", "Resuscitation", "Workup & Endoscopy", "Variceal Bleeding"];

  const gbsScore     = GBS_ITEMS.reduce((s, i) => s + (gbsVals[i.id] !== undefined ? i.options[gbsVals[i.id]].p : 0), 0);
  const rockallScore = ROCKALL_ITEMS.reduce((s, i) => s + (rockallVals[i.id] !== undefined ? i.options[rockallVals[i.id]].p : 0), 0);

  const gbsInterp = gbsScore === 0
    ? { label: "Very Low Risk — Outpatient management safe", color: T.green }
    : gbsScore <= 2
    ? { label: "Low Risk — Consider discharge with urgent outpatient endoscopy", color: T.teal }
    : gbsScore <= 5
    ? { label: "Moderate Risk — Admission + early endoscopy", color: T.gold }
    : { label: "High Risk — Urgent endoscopy · ICU consideration", color: T.coral };

  const rockallInterp = rockallScore <= 2
    ? { label: "Low Risk — Early discharge possible", color: T.green }
    : rockallScore <= 4
    ? { label: "Intermediate — Endoscopy + close monitoring", color: T.gold }
    : { label: "High Risk — ICU · urgent endoscopy · likely rebleed", color: T.coral };

  const setScore = (state, setter, id, idx) => setter(p => ({ ...p, [id]: p[id] === idx ? undefined : idx }));

  const ScoreCalc = ({ items, vals, setVals, score, interp, color }) => (
    <div style={card({ marginBottom: 14 })}>
      {items.map(item => (
        <div key={item.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: T.muted }}>{item.label}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: vals[item.id] !== undefined && item.options[vals[item.id]].p > 0 ? color : T.dim }}>
              {vals[item.id] !== undefined ? `+${item.options[vals[item.id]].p}` : "—"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {item.options.map((opt, idx) => {
              const sel = vals[item.id] === idx;
              return (
                <div key={idx} onClick={() => setScore(vals, setVals, item.id, idx)}
                  style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 7, border: `1px solid ${sel ? color + "70" : T.border}`, background: sel ? color + "18" : T.glassMid, cursor: "pointer", transition: "all 0.12s" }}>
                  <span style={{ fontSize: 11.5, color: sel ? T.white : T.muted }}>{opt.l}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: sel ? color : T.dim }}>+{opt.p}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div style={dv} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Score</span>
        <span style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 800, color: interp.color }}>{score}</span>
      </div>
      <div style={aBox(interp.color, 4)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: interp.color }}>{interp.label}</div>
      </div>
      <button onClick={() => scoreType === "GBS" ? setGbsVals({}) : setRockallVals({})}
        style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>
        Reset
      </button>
    </div>
  );

  // ── TAB 0: RECOGNITION ───────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Massive GI Bleed — Hemodynamic Instability + Active Hemorrhage</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Definition: blood transfusion ≥ 3 units pRBC in 24h OR ongoing hemorrhage causing hemodynamic instability. Mortality 5–10% overall — rises significantly with delayed intervention, rebleeding, and comorbidities.</div>
      </div>

      <div style={sL()}>Upper vs Lower GI Localization</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["Upper GI", "Lower GI"].map(s => (
          <button key={s} onClick={() => setSource(source === s ? null : s)}
            style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${source === s ? T.coral : T.border}`, background: source === s ? "rgba(244,63,94,0.15)" : T.glass, color: source === s ? T.coral : T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {s === "Upper GI" ? "⬆ " : "⬇ "}{s}
          </button>
        ))}
      </div>

      {source === "Upper GI" && (
        <div style={{ ...card({ border: `1.5px solid ${T.coral}50`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 8 }}>Above Ligament of Treitz</div>
          {[
            { cause: "Peptic Ulcer Disease", freq: "~35–50%", detail: "H. pylori or NSAID-related · duodenal > gastric · anterior duodenal wall = vessel involvement risk (GDA)" },
            { cause: "Variceal Hemorrhage", freq: "~20%", detail: "Cirrhosis / portal hypertension · esophageal > gastric varices · massive hemorrhage · 6-week mortality 20–40%" },
            { cause: "Mallory-Weiss Tear",  freq: "~10%", detail: "Forceful vomiting → longitudinal mucosal tear at GEJ · usually self-limited · rarely needs intervention" },
            { cause: "Dieulafoy Lesion",    freq: "~5%", detail: "Abnormally large submucosal artery · difficult to identify · fundus of stomach · recurrent bleeding" },
            { cause: "Aortoenteric Fistula", freq: "Rare", detail: "Prior aortic graft surgery → herald bleed (small) then massive exsanguination · always consider with prior aortic surgery + GI bleed" },
            { cause: "Gastric Antral Vascular Ectasia (GAVE)", freq: "Rare", detail: "\"Watermelon stomach\" · chronic blood loss · treated with argon plasma coagulation" },
          ].map(({ cause, freq, detail }) => (
            <div key={cause} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "9px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.coral }}>{cause}</span>
                <span style={{ fontSize: 10, color: T.dim }}>{freq}</span>
              </div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
            </div>
          ))}
          <div style={{ ...aBox(T.gold, 0), marginTop: 8 }}>
            <div style={{ fontSize: 11.5, color: T.muted }}>
              <span style={{ color: T.gold, fontWeight: 600 }}>Presentation: </span>Hematemesis · coffee-ground emesis · melena (tarry stools) · hematochezia (bright red blood per rectum = massive UGIB until proven otherwise)
            </div>
          </div>
        </div>
      )}

      {source === "Lower GI" && (
        <div style={{ ...card({ border: `1.5px solid ${T.blue}50`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8 }}>Below Ligament of Treitz</div>
          {[
            { cause: "Diverticular Bleed", freq: "~40%", detail: "Most common LGIB · painless · right colon > left colon · often massive · 75–80% stops spontaneously" },
            { cause: "Colonic Angiodysplasia", freq: "~10%", detail: "Elderly · right colon · chronic or acute · may coexist with aortic stenosis (Heyde's syndrome)" },
            { cause: "Ischemic Colitis",   freq: "~10%", detail: "Watershed areas (splenic flexure · sigmoid) · abdominal pain + bleeding · post-vascular surgery risk" },
            { cause: "Hemorrhoidal Bleeding", freq: "~10%", detail: "Usually small volume · bright red on toilet paper · rarely causes hemodynamic instability" },
            { cause: "Colorectal Cancer", freq: "~5%", detail: "Chronic occult blood loss · acute hemorrhage possible with large tumors · associated anemia" },
            { cause: "Post-Polypectomy",   freq: "Variable", detail: "Delayed bleeding 7–14 days post-procedure · immediate hemostasis or repeat scope" },
          ].map(({ cause, freq, detail }) => (
            <div key={cause} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "9px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>{cause}</span>
                <span style={{ fontSize: 10, color: T.dim }}>{freq}</span>
              </div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
            </div>
          ))}
          <div style={{ ...aBox(T.gold, 0), marginTop: 8 }}>
            <div style={{ fontSize: 11.5, color: T.muted }}>
              <span style={{ color: T.gold, fontWeight: 600 }}>Presentation: </span>Hematochezia (usually) · melena possible if right-sided · painless (diverticular · angiodysplasia) vs painful (ischemic colitis · IBD)
            </div>
          </div>
        </div>
      )}

      <div style={sL(T.teal)}>BUN:Creatinine Ratio — Localization Pearl</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { ratio: "> 30:1", interp: "Strongly suggests UPPER GI source — blood digested in small bowel → BUN rises", color: T.coral },
          { ratio: "20–30:1", interp: "Indeterminate", color: T.gold },
          { ratio: "< 20:1", interp: "Favors LOWER GI source or non-GI blood loss", color: T.blue },
        ].map(({ ratio, interp, color }) => (
          <div key={ratio} style={{ display: "flex", gap: 12, marginBottom: 7, alignItems: "center" }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color, minWidth: 60 }}>{ratio}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{interp}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Risk Stratification Scores</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["GBS", "Rockall"].map(s => (
          <button key={s} onClick={() => setScoreType(s)}
            style={{ flex: 1, padding: "8px", borderRadius: 9, border: `1.5px solid ${scoreType === s ? T.gold : T.border}`, background: scoreType === s ? "rgba(245,158,11,0.15)" : T.glass, color: scoreType === s ? T.gold : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {s === "GBS" ? "Glasgow-Blatchford" : "Rockall Score"}
          </button>
        ))}
      </div>
      {scoreType === "GBS"
        ? <ScoreCalc items={GBS_ITEMS} vals={gbsVals} setVals={setGbsVals} score={gbsScore} interp={gbsInterp} color={T.gold} />
        : <ScoreCalc items={ROCKALL_ITEMS} vals={rockallVals} setVals={setRockallVals} score={rockallScore} interp={rockallInterp} color={T.coral} />
      }
    </div>
  );

  // ── TAB 1: RESUSCITATION ─────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Resuscitate + Reverse + Scope — Simultaneously</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Two large-bore IVs immediately. Reverse anticoagulation. Transfuse to Hgb ≥ 7 g/dL (8 in ACS/cardiovascular disease). Target endoscopy ≤ 24h for stable UGIB, ≤ 12h for high-risk or ongoing hemorrhage.</div>
      </div>

      <div style={sL()}>Initial Resuscitation</div>
      {[
        { n: 1, label: "IV Access",        detail: "Two large-bore IVs (16G or larger) · consider IO if unable · central line if vasopressor needed", color: T.teal },
        { n: 2, label: "IV Fluids",        detail: "Crystalloid resuscitation for hemodynamic instability while blood being typed · avoid excess (dilutional coagulopathy · ascites accumulation in varices) · switch to blood products early", color: T.blue },
        { n: 3, label: "Transfusion",      detail: "pRBC transfusion for Hgb < 7 g/dL (restrictive) · target 7–9 g/dL · Hgb 8 in ACS or significant cardiovascular disease · avoid overtransfusion in variceal bleeding (↑ portal pressure → worsens bleeding)", color: T.coral },
        { n: 4, label: "Coagulopathy Reversal", detail: "FFP if INR > 1.5 + active bleeding · Platelet transfusion if PLT < 50k + active bleeding · Vitamin K 10mg IV if warfarin · PCC for urgent warfarin reversal · Andexanet for apixaban/rivaroxaban · Idarucizumab for dabigatran", color: T.gold },
        { n: 5, label: "Airway",           detail: "Consider early intubation for: massive hematemesis · altered mentation · high aspiration risk · inability to protect airway · allows safe urgent endoscopy", color: T.amber },
        { n: 6, label: "NPO + NG Tube",    detail: "NPO for endoscopy · NG lavage to clear blood before scope (improves visualization) · ONLY if active hematemesis — not diagnostic for source · prokinetic pre-scope if large amount of blood", color: T.purple },
      ].map(({ n, label, detail, color }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.teal)}>Pharmacologic Adjuncts</div>
      {[
        { drug: "IV PPI (Pantoprazole)", dose: "80 mg IV bolus → 8 mg/h infusion × 72h", indication: "UGIB (non-variceal) · reduces rebleed rate · start before endoscopy", color: T.teal },
        { drug: "Prokinetic (Erythromycin)", dose: "250 mg IV over 30 min · 30–90 min before EGD", indication: "Promotes gastric emptying · improves visualization · especially with large blood volume in stomach", color: T.blue },
        { drug: "Octreotide",            dose: "50 mcg IV bolus → 50 mcg/h infusion × 3–5 days", indication: "Variceal bleeding (reduces portal pressure) · start immediately if varices suspected", color: T.gold },
        { drug: "Tranexamic Acid (TXA)", dose: "1g IV over 10 min (controversial in GI bleed)", indication: "HALT-IT trial: TXA did not reduce mortality in acute UGIB · use selectively for massive hemorrhage with coagulopathy · NOT routine", color: T.amber },
        { drug: "Terlipressin",          dose: "2 mg IV q 4h × 48h → 1 mg q 4h", indication: "Variceal bleeding · reduces portal pressure · mortality benefit vs no active treatment · not available everywhere in US", color: T.purple },
      ].map(({ drug, dose, indication, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{drug}</span>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{indication}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: WORKUP & ENDOSCOPY ────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={sL()}>Endoscopy Timing</div>
      {[
        { timing: "≤ 12 hours",    indication: "Hemodynamic instability despite resuscitation · signs of ongoing active bleeding · GBS ≥ 12 · suspected variceal hemorrhage", color: T.coral, label: "URGENT" },
        { timing: "≤ 24 hours",    indication: "Hemodynamically stable UGIB requiring hospitalization · moderate-high risk (GBS ≥ 6) · standard of care for most UGIB", color: T.gold, label: "EARLY" },
        { timing: "24–48 hours",   indication: "Stable LGIB requiring hospitalization · colonoscopy after bowel prep (4L GoLytely)", color: T.teal, label: "STANDARD" },
        { timing: "Outpatient ≤ 2 weeks", indication: "Very low-risk UGIB (GBS ≤ 1) · stable · no high-risk endoscopic stigmata expected · selected low-risk LGIB", color: T.green, label: "ELECTIVE" },
      ].map(({ timing, indication, color, label }) => (
        <div key={timing} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{timing}</span>
            <span style={{ ...tag(color), fontSize: 9 }}>{label}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{indication}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Endoscopic Hemostasis Options</div>
      {[
        { method: "Epinephrine Injection", detail: "1:10,000 dilution · 4 quadrant injection · cheap · always combine with second modality (inferior alone)", color: T.blue },
        { method: "Thermal Coagulation", detail: "Bipolar (BICAP) or heater probe · direct tissue ablation · contact method · effective for ulcers + active vessels", color: T.amber },
        { method: "Hemostatic Clips",     detail: "Endoclips · mechanical closure · excellent for Dieulafoy · flat ulcers · post-polypectomy · challenging in fibrotic tissue", color: T.teal },
        { method: "OTSC (Over-The-Scope Clip)", detail: "Larger clip for refractory bleeding · anastomotic leaks · large vessels · rescue therapy", color: T.purple },
        { method: "Hemostatic Powder (TC-325)", detail: "Hemospray · spray over bleeding source · temporary bridge · does not treat underlying lesion · time to endoscopy constraint", color: T.gold },
        { method: "Band Ligation",        detail: "Esophageal varices · rubber band · first-line endoscopic therapy for variceal hemorrhage", color: T.coral },
        { method: "Cyanoacrylate Injection", detail: "Gastric varices · tissue adhesive glue · specialized training required · risk of systemic embolism", color: T.green },
      ].map(({ method, detail, color }) => (
        <div key={method} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{method}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Endoscopic High-Risk Stigmata (Forrest Classification)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { f: "Ia — Active spurting",      rebleed: "55%",   color: T.coral, tx: "Endoscopic treatment mandatory" },
          { f: "Ib — Active oozing",        rebleed: "55%",   color: T.coral, tx: "Endoscopic treatment mandatory" },
          { f: "IIa — Visible vessel (non-bleeding)", rebleed: "43%", color: T.amber, tx: "Endoscopic treatment mandatory" },
          { f: "IIb — Adherent clot",       rebleed: "22%",   color: T.gold,  tx: "Remove clot + treat underlying vessel" },
          { f: "IIc — Flat pigmented spot", rebleed: "10%",   color: T.teal,  tx: "Medical therapy · can discharge in 24h" },
          { f: "III — Clean base",          rebleed: "5%",    color: T.green, tx: "Outpatient PPI · no endoscopic treatment" },
        ].map(({ f, rebleed, color, tx }, i) => (
          <div key={f} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 5 ? `1px solid ${T.border}` : "none", alignItems: "flex-start" }}>
            <div style={{ minWidth: 180, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color }}>{f}</div>
              <div style={{ fontSize: 10.5, color: T.dim }}>Rebleed: {rebleed}</div>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{tx}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Salvage Options — Endoscopy Failed</div>
      {[
        { option: "Interventional Radiology (IR)", detail: "Transcatheter arterial embolization (TAE) · 70–90% success · preferred over surgery in high-risk patients · CT angiography first to localize · active bleeding rate ≥ 0.5 mL/min required for angiography success", color: T.purple },
        { option: "Surgery",                       detail: "Definitive but highest morbidity · oversewing of vessel (ulcer) · bowel resection (LGIB) · reserved for failed endoscopy + failed IR · high operative mortality in hemodynamically unstable patients", color: T.coral },
        { option: "SEMS (Self-Expanding Metal Stent)", detail: "Esophageal varices · bridge to definitive therapy (TIPS or banding) · when balloon tamponade or banding fails · temporary · 7–14 days · covered stent", color: T.gold },
        { option: "Balloon Tamponade (Sengstaken-Blakemore / Minnesota tube)", detail: "Refractory variceal hemorrhage as bridge · inflates gastric + esophageal balloons · very temporary · risk of aspiration and esophageal necrosis · intubate first", color: T.amber },
        { option: "TIPS (Transjugular Intrahepatic Portosystemic Shunt)", detail: "Refractory variceal bleeding · reduces portal hypertension · rescue TIPS (within 72h of presentation in selected high-risk patients per Baveno VII consensus) · performed by IR", color: T.teal },
      ].map(({ option, detail, color }) => (
        <div key={option} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{option}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: VARICEAL BLEEDING ─────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={aBox(T.amber, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>Variceal Hemorrhage — Highest Mortality GI Bleed (~20% per episode)</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Portal hypertension → dilated submucosal veins → rupture. Requires simultaneous vasoactive agent + antibiotics + endoscopy. Restrictive transfusion strategy critical.</div>
      </div>

      <div style={sL()}>Time-Critical Protocol</div>
      {[
        { n: 1, action: "Octreotide (or Terlipressin)", detail: "Start BEFORE endoscopy · octreotide 50 mcg IV bolus → 50 mcg/h × 3–5 days · reduces portal pressure · buys time for scope", color: T.gold, time: "Immediately" },
        { n: 2, action: "IV Antibiotics",               detail: "Ceftriaxone 1g IV daily × 7 days · reduces infections (SBP · bacteremia · UTI common in cirrhosis) · reduces mortality and rebleeding · standard of care (Baveno VII)", color: T.teal, time: "Immediately" },
        { n: 3, action: "Restrictive Transfusion",      detail: "Target Hgb 7–8 g/dL ONLY · overtransfusion increases portal pressure → worsens bleeding · avoid FFP unless active coagulopathic bleeding", color: T.coral, time: "During resuscitation" },
        { n: 4, action: "Endoscopy (EGD)",              detail: "Band ligation (EVL) preferred over sclerotherapy · within 12h · cyanoacrylate glue for gastric varices · ensure airway protection (intubate high-risk patients)", color: T.purple, time: "≤ 12h" },
        { n: 5, action: "TIPS (rescue)",                detail: "High-risk patients failing endoscopic therapy · Child-Pugh B+active bleeding or Child-Pugh C < 14 · early TIPS (≤ 72h) per Baveno VII", color: T.amber, time: "Within 72h if high-risk" },
      ].map(({ n, action, detail, color, time }) => (
        <div key={n} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{action}</span>
              <span style={{ ...tag(color), fontSize: 9, whiteSpace: "nowrap", marginLeft: 6 }}>{time}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.gold)}>Hepatic Encephalopathy — Complication of GI Bleed in Cirrhosis</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          GI blood → protein substrate for gut bacteria → ammonia production → HE. <br />
          Management: <span style={{ color: T.gold, fontWeight: 600 }}>Lactulose 25–30 mL q 1–2h until bowel movement</span> · rifaximin 550 mg BID · avoid sedatives · consider airway protection.
        </div>
      </div>

      <div style={sL(T.purple)}>Child-Pugh Score — Cirrhosis Severity</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { param: "Bilirubin", A: "< 2 mg/dL", B: "2–3 mg/dL", C: "> 3 mg/dL" },
          { param: "Albumin",   A: "> 3.5 g/dL", B: "2.8–3.5 g/dL", C: "< 2.8 g/dL" },
          { param: "INR",       A: "< 1.7", B: "1.7–2.3", C: "> 2.3" },
          { param: "Ascites",   A: "None", B: "Mild", C: "Moderate-Severe" },
          { param: "HE",        A: "None", B: "Grade I–II", C: "Grade III–IV" },
        ].map(({ param, A, B, C }, i) => (
          <div key={param} style={{ display: "flex", gap: 6, paddingBottom: 6, marginBottom: 6, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: T.muted, minWidth: 75, flexShrink: 0 }}>{param}</div>
            <div style={{ flex: 1, fontSize: 11, color: T.green, textAlign: "center" }}>A: {A}</div>
            <div style={{ flex: 1, fontSize: 11, color: T.gold, textAlign: "center" }}>B: {B}</div>
            <div style={{ flex: 1, fontSize: 11, color: T.coral, textAlign: "center" }}>C: {C}</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
          {[{ cls: "Child A (5–6 pts)", color: T.green }, { cls: "Child B (7–9 pts)", color: T.gold }, { cls: "Child C (10–15 pts)", color: T.coral }].map(({ cls, color }) => (
            <div key={cls} style={{ fontSize: 11, fontWeight: 600, color }}>{cls}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.coral)}>Secondary Prophylaxis — Prevent Rebleeding</div>
      {["Non-selective beta-blocker (propranolol 20–40 mg BID or nadolol) · start after acute episode resolves · reduces portal pressure",
        "Repeat endoscopic band ligation every 2–4 weeks until varix eradication",
        "TIPS for refractory rebleeding despite beta-blocker + EVL",
        "Liver transplant evaluation for appropriate candidates"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}>
          <span style={{ color: T.purple }}>▸</span>{t}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,63,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(20,184,166,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>🚨 Resuscitation</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ACG / Baveno VII</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Massive GI Bleed</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Glasgow-Blatchford · Rockall · Forrest classification · Endoscopy timing · Variceal protocol · TIPS criteria</p>
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