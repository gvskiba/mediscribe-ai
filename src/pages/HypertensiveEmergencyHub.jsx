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
const sL   = (c = T.purple) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

// ── End-Organ Data ────────────────────────────────────────────────────────────
const END_ORGANS = [
  {
    id: "dissection", label: "Aortic Dissection", icon: "🔴", color: T.coral,
    urgency: "MOST URGENT — minutes matter",
    target: "SBP < 120 mmHg · HR < 60 bpm · within 20 min",
    firstLine: ["Esmolol (HR control FIRST)", "Then Nicardipine or Clevidipine (BP control)"],
    avoid: ["Hydralazine (reflex tachycardia → catastrophic)", "Vasodilator before beta-blocker (reflex tachycardia increases aortic wall stress)", "Nitroprusside without adequate beta-blockade"],
    pearl: "Always give beta-blocker FIRST to prevent reflex tachycardia before adding vasodilator. HR target (< 60) is as important as BP target.",
    labs: ["Stat CTA chest/abdomen/pelvis with contrast", "Type & screen × 2 units", "Cardiac enzymes", "Renal function", "Immediate cardiac surgery / vascular surgery consult"],
  },
  {
    id: "eclampsia", label: "Eclampsia / Severe Pre-eclampsia", icon: "🤰", color: T.purple,
    urgency: "Treat if SBP ≥ 160 OR DBP ≥ 110",
    target: "SBP 140–155 mmHg · DBP 90–105 mmHg",
    firstLine: ["Labetalol 20–40 mg IV q 10 min (max 300 mg)", "Hydralazine 5–10 mg IV q 20 min", "Nicardipine 5–15 mg/h IV infusion"],
    avoid: ["ACE inhibitors (teratogenic)", "ARBs (teratogenic)", "Nitroprusside (fetal cyanide toxicity)", "Aggressive lowering (placental hypoperfusion)"],
    pearl: "MgSO4 for seizure prophylaxis (4g IV load → 1–2g/h) — this is NOT a BP medication. Definitive treatment is delivery. OB consult immediately.",
    labs: ["Serum Mg level if on infusion (therapeutic 4–7 mEq/L)", "CBC, LFTs, creatinine (HELLP workup)", "24h urine protein or spot PCR", "Fetal monitoring / obstetrics consult"],
  },
  {
    id: "ischemic_stroke", label: "Acute Ischemic Stroke", icon: "🧠", color: T.blue,
    urgency: "Context-dependent — see targets",
    target: "tPA eligible: SBP < 185/110 before tPA · Not eligible: only treat if > 220/120 (max 15% reduction)",
    firstLine: ["Labetalol 10–20 mg IV over 1–2 min", "Nicardipine 5 mg/h → titrate to target"],
    avoid: ["Nitroprusside (cerebral steal phenomenon)", "Aggressive lowering below target (extends ischemic penumbra)", "Hydralazine (unpredictable)"],
    pearl: "Permissive hypertension preserves penumbra perfusion. Do NOT lower BP aggressively in ischemic stroke. If NOT tPA eligible — only treat SBP > 220 or DBP > 120, max 15% reduction in 24h.",
    labs: ["Stat non-contrast head CT (hemorrhage vs ischemic)", "CT-A head and neck", "Glucose (hypoglycemia mimics stroke)", "INR, PTT, platelets", "Stroke neurology activation"],
  },
  {
    id: "ich", label: "Intracerebral Hemorrhage (ICH)", icon: "🩸", color: T.coral,
    urgency: "Treat SBP > 150 aggressively",
    target: "SBP < 140 mmHg (INTERACT2 / AHA 2022) · Sustained within 1 hour",
    firstLine: ["Nicardipine 5–15 mg/h IV", "Clevidipine 1–2 mg/h → titrate", "Labetalol 20 mg IV → infusion"],
    avoid: ["Nitroprusside (increases ICP via cerebral vasodilation)", "Hydralazine (unpredictable duration)", "Excessive lowering (SBP < 120 — ATACH-2 showed harm)"],
    pearl: "Target SBP 130–140 — do not overshoot below 120. Reverse anticoagulation urgently. Neurosurgery consult. Consider ICP monitoring if GCS < 9.",
    labs: ["Non-contrast head CT STAT", "Repeat CT at 6h (hematoma expansion)", "INR (reverse if elevated)", "Platelet count", "Neurosurgery consult"],
  },
  {
    id: "encephalopathy", label: "Hypertensive Encephalopathy / PRES", icon: "🌀", color: T.purple,
    urgency: "Reduce MAP 20–25% in first hour",
    target: "MAP reduction 20–25% over 1 hour · then 160/100 over next 6h",
    firstLine: ["Nicardipine 5–15 mg/h IV (preferred)", "Labetalol 20–40 mg IV q 10 min or infusion", "Clevidipine 1–2 mg/h → titrate"],
    avoid: ["Nitroprusside (may worsen cerebral edema)", "Overly rapid reduction (cerebral hypoperfusion)", "Hydralazine"],
    pearl: "MRI with FLAIR is gold standard for PRES diagnosis (posterior leukoencephalopathy). Seizures are treated with standard AEDs. BP control is key — PRES is typically reversible with adequate treatment.",
    labs: ["MRI brain with FLAIR (CT often normal)", "BMP, urinalysis", "Toxicology screen", "Consider CSF if infection cannot be excluded"],
  },
  {
    id: "acs", label: "Acute Coronary Syndrome (ACS)", icon: "❤️", color: T.amber,
    urgency: "Reduce myocardial O₂ demand",
    target: "SBP < 140 mmHg · HR < 70 bpm (beta-blocker to goal)",
    firstLine: ["Nitroglycerin 5–200 mcg/min IV (antiischemic + preload reduction)", "Labetalol (HR + BP control)", "Esmolol infusion (if tachycardia-driven)"],
    avoid: ["Nitroprusside (coronary steal — worsens ischemia)", "Hydralazine (reflex tachycardia increases O₂ demand)", "Dihydropyridine CCBs alone without beta-blocker (reflex tachycardia)"],
    pearl: "Nitroglycerin is antiischemic AND antihypertensive. Avoid in RV infarction (inferior MI — hypotension), phosphodiesterase inhibitor use (sildenafil < 24h), and severe AS.",
    labs: ["Serial troponins", "12-lead ECG", "Cardiology consult", "Consider cath lab activation"],
  },
  {
    id: "adhf", label: "Acute Decompensated Heart Failure", icon: "🫁", color: T.blue,
    urgency: "Afterload reduction is primary goal",
    target: "MAP reduction 20–25% · reduce preload and afterload",
    firstLine: ["Nitroglycerin 10–200 mcg/min IV (preload + afterload)", "Nicardipine 5–15 mg/h (afterload)", "Clevidipine 1–2 mg/h (arterial dilation)"],
    avoid: ["Beta-blockers in acute decompensation (negative inotropy)", "Hydralazine alone (reflex tachycardia)", "Nitroprusside in ACS (coronary steal)"],
    pearl: "Nitroprusside (venous + arterial dilator) is highly effective for ADHF with severe hypertension when nitroglycerin is insufficient. Use judiciously — requires arterial line monitoring.",
    labs: ["BNP or NT-proBNP", "Chest X-ray (pulmonary edema pattern)", "Echo (EF, wall motion)", "BMP (creatinine)", "Cardiology consult"],
  },
  {
    id: "nephropathy", label: "Hypertensive Nephropathy / AKI", icon: "🫘", color: T.teal,
    urgency: "Reduce MAP 20–25% over first hour",
    target: "MAP reduction 20–25% over 1 hour · avoid overcorrection",
    firstLine: ["Nicardipine 5–15 mg/h IV", "Clevidipine 1–2 mg/h", "Labetalol 20 mg IV → infusion"],
    avoid: ["ACE inhibitors / ARBs acutely (worsen AKI — can add outpatient)", "Nitroprusside (cyanide accumulates in renal failure)", "NSAIDs"],
    pearl: "Reduction in GFR after BP lowering is expected and usually transient. Check creatinine at 48–72h. Start ACE inhibitor / ARB once AKI resolves (long-term renoprotection).",
    labs: ["BMP (creatinine, BUN, K⁺)", "Urinalysis + urine microscopy (casts)", "Urine protein:creatinine ratio", "Renal ultrasound", "Nephrology consult"],
  },
  {
    id: "sympathomimetic", label: "Sympathomimetic Crisis (Cocaine / Pheo)", icon: "⚡", color: T.gold,
    urgency: "Benzodiazepines FIRST for cocaine — then BP agents",
    target: "MAP reduction 20–25% · HR control",
    firstLine: ["Benzodiazepines (lorazepam/diazepam) — cocaine/stimulants first", "Phentolamine 2–5 mg IV q 5–15 min (pheochromocytoma)", "Nicardipine or Clevidipine (after alpha-blockade for pheo)"],
    avoid: ["Pure beta-blockers (propranolol, esmolol) — unopposed alpha stimulation → paradoxical hypertension", "Labetalol in cocaine (alpha:beta ratio insufficient — controversial)"],
    pearl: "In cocaine toxicity: benzos calm the sympathetic storm and lower BP. For pheochromocytoma: alpha-blocker FIRST (phentolamine), THEN beta-blocker after — never reverse this order.",
    labs: ["Urine toxicology screen", "Plasma/urine metanephrines (pheo workup)", "Troponin (cocaine-induced MI)", "12-lead ECG", "Endocrinology consult if pheo suspected"],
  },
];

// ── Medication Data ───────────────────────────────────────────────────────────
const MEDS = [
  { drug: "Nicardipine",   class: "CCB (DHP)",               color: T.teal,
    dose: "5 mg/h IV → ↑ 2.5 mg/h q 5–15 min → max 15 mg/h",
    onset: "5–15 min", offset: "30–40 min", route: "IV infusion",
    best: "Most hypertensive emergencies · stroke · encephalopathy · eclampsia · ICH",
    avoid: "Severe aortic stenosis · acute decompensated HF with low EF" },
  { drug: "Clevidipine",   class: "CCB ultra-short",          color: T.teal,
    dose: "1–2 mg/h IV → double q 90 sec → max 32 mg/h",
    onset: "2–4 min", offset: "5–15 min", route: "IV infusion (lipid emulsion)",
    best: "Precise BP titration · perioperative · aortic dissection BP component",
    avoid: "Soy/egg allergy · severe AS · lipid metabolism disorders · pancreatitis" },
  { drug: "Labetalol",    class: "α + β blocker",             color: T.purple,
    dose: "20 mg IV over 2 min → 40–80 mg q 10 min → max 300 mg OR 0.5–2 mg/min infusion",
    onset: "5 min", offset: "2–6 h", route: "IV push or infusion",
    best: "Stroke · eclampsia · aortic dissection (BB component) · most emergencies",
    avoid: "Acute decompensated HF · bronchospasm / COPD · bradycardia / heart block · cocaine (relative)" },
  { drug: "Esmolol",      class: "β1 blocker (ultra-short)",  color: T.blue,
    dose: "500 mcg/kg IV over 1 min → 50–200 mcg/kg/min infusion",
    onset: "60 sec", offset: "10–20 min", route: "IV bolus + infusion",
    best: "Aortic dissection (HR control) · perioperative hypertension · ACS with tachycardia",
    avoid: "Decompensated HF · bronchospasm · bradycardia · cocaine" },
  { drug: "Nitroglycerin", class: "Nitrate",                  color: T.gold,
    dose: "5–10 mcg/min → ↑ 5–10 mcg/min q 3–5 min → max 200 mcg/min",
    onset: "1–2 min", offset: "3–5 min", route: "IV infusion",
    best: "ACS (antiischemic + antihypertensive) · ADHF with pulmonary edema",
    avoid: "RV infarction / inferior MI · PDE5 inhibitors (sildenafil < 24h) · severe AS · hypovolemia" },
  { drug: "Nitroprusside", class: "Nitric oxide donor",       color: T.amber,
    dose: "0.25–0.5 mcg/kg/min → titrate → max 8–10 mcg/kg/min (brief use only)",
    onset: "Seconds", offset: "1–2 min", route: "IV infusion (light-protected)",
    best: "ADHF (venous + arterial dilation) · encephalopathy (last resort)",
    avoid: "Renal/hepatic failure (cyanide toxicity) · pregnancy · ischemic stroke · aortic dissection without BB · prolonged use" },
  { drug: "Hydralazine",  class: "Vasodilator",               color: T.coral,
    dose: "5–10 mg IV over 1–2 min q 20–30 min PRN",
    onset: "10–20 min", offset: "3–8 h (UNPREDICTABLE)", route: "IV push",
    best: "Eclampsia (traditional) · last resort when other agents unavailable",
    avoid: "Aortic dissection · ACS (reflex tachycardia) · generally avoid — unpredictable onset and duration" },
  { drug: "Phentolamine", class: "Alpha blocker",             color: T.gold,
    dose: "2–5 mg IV q 5–15 min PRN",
    onset: "1–2 min", offset: "10–15 min", route: "IV push",
    best: "Pheochromocytoma · cocaine/sympathomimetic crisis · MAOI interaction",
    avoid: "Use of pure beta-blocker before alpha-blocker (unopposed alpha → crisis)" },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function HypertensiveEmergencyHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]     = useState(0);
  const [organ, setOrgan] = useState(null);
  const [drug, setDrug]   = useState(null);
  const TABS = ["Recognition", "End-Organ Treatment", "Medications", "Monitoring"];

  const selOrgan = END_ORGANS.find(o => o.id === organ);
  const selDrug  = MEDS.find(m => m.drug === drug);

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={sL()}>Hypertensive Emergency vs. Urgency</div>
      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <div style={card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.3)" })}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.coral, marginBottom: 6 }}>⚠ Hypertensive Emergency</div>
          <div style={{ ...tag(T.coral), marginBottom: 8, fontSize: 10 }}>SBP &gt; 180 OR DBP &gt; 120 + end-organ damage</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
            Requires <strong style={{ color: T.white }}>IV therapy</strong> and hemodynamic monitoring. End-organ damage defines the emergency — not the BP number alone.
          </div>
        </div>
        <div style={card({ background: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.25)" })}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 6 }}>Hypertensive Urgency</div>
          <div style={{ ...tag(T.gold), marginBottom: 8, fontSize: 10 }}>SBP &gt; 180 OR DBP &gt; 120 — NO end-organ damage</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
            Oral agents acceptable. Gradual reduction over 24–48h. No need for ICU or IV. Common misdiagnosis — pain and anxiety cause BP spikes without true emergency.
          </div>
        </div>
      </div>

      <div style={sL()}>End-Organ Assessment — What to Look For</div>
      {[
        { organ: "Brain",           findings: "Headache · confusion · altered mentation · focal neuro deficits · visual changes · seizures → CT head STAT", color: T.purple },
        { organ: "Heart",           findings: "Chest pain · dyspnea · new ST changes · elevated troponin · S3/S4 · pulmonary edema → ECG + troponins", color: T.coral },
        { organ: "Kidneys",         findings: "Rising creatinine · oliguria · hematuria · proteinuria · red cell casts → BMP + urinalysis", color: T.teal },
        { organ: "Eyes",            findings: "Blurred vision · papilledema (grade III–IV retinopathy) · flame hemorrhages → fundoscopic exam", color: T.gold },
        { organ: "Aorta",           findings: "Tearing/ripping back or chest pain · pulse differential · BP differential arms · mediastinal widening → CTA", color: T.amber },
        { organ: "Uterus / Fetus",  findings: "Pregnancy + SBP ≥ 160 or DBP ≥ 110 → preeclampsia / eclampsia protocol immediately", color: T.purple },
      ].map(({ organ: o, findings, color }) => (
        <div key={o} style={{ ...G(), padding: "11px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ ...tag(color), flexShrink: 0, whiteSpace: "nowrap" }}>{o}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{findings}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Initial Workup — All Hypertensive Emergencies</div>
      <div style={{ ...card() }}>
        {[
          { test: "BMP",                     why: "Creatinine (nephropathy) · K⁺ (diuretic use) · glucose" },
          { test: "CBC",                     why: "Microangiopathic hemolytic anemia · HELLP" },
          { test: "Urinalysis + microscopy", why: "Proteinuria · red cell casts (glomerulonephritis)" },
          { test: "12-lead ECG",             why: "LVH · ischemia · arrhythmia" },
          { test: "Troponin",                why: "Myocardial injury from pressure overload or ischemia" },
          { test: "Chest X-ray",             why: "Pulmonary edema · mediastinal widening (dissection)" },
          { test: "Non-contrast head CT",    why: "Hemorrhagic stroke · if neuro symptoms present" },
          { test: "Urine pregnancy test",    why: "All females of reproductive age" },
          { test: "Urine drug screen",       why: "Cocaine · sympathomimetics" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 8 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.purple, minWidth: 155, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: END-ORGAN TREATMENT ────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={aBox(T.purple, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>Agent Selection is End-Organ Dependent</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>The wrong agent can worsen the underlying condition. Select the end-organ involved to see the targeted protocol.</div>
      </div>

      <div style={sL()}>Select End-Organ Involved</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 16 }}>
        {END_ORGANS.map(o => (
          <button key={o.id}
            style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${organ === o.id ? o.color : T.border}`, background: organ === o.id ? o.color + "18" : T.glass, color: organ === o.id ? o.color : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, textAlign: "left", transition: "all 0.18s", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 7 }}
            onClick={() => setOrgan(organ === o.id ? null : o.id)}>
            <span>{o.icon}</span>
            <span style={{ lineHeight: 1.3 }}>{o.label}</span>
          </button>
        ))}
      </div>

      {!selOrgan && (
        <div style={{ ...G(), padding: "28px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ color: T.muted, fontSize: 13 }}>Select an end-organ above to view targeted treatment protocol</div>
        </div>
      )}

      {selOrgan && (
        <div style={{ ...card({ border: `1.5px solid ${selOrgan.color}55` }) }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>{selOrgan.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: selOrgan.color }}>{selOrgan.label}</div>
              <div style={{ ...tag(selOrgan.color), fontSize: 10, marginTop: 3 }}>{selOrgan.urgency}</div>
            </div>
          </div>
          <div style={aBox(selOrgan.color, 12)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: selOrgan.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>BP Target</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.white, lineHeight: 1.5 }}>{selOrgan.target}</div>
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>✓ Preferred Agents</div>
          {selOrgan.firstLine.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5, lineHeight: 1.4 }}>
              <span style={{ color: T.green, flexShrink: 0 }}>▸</span>{a}
            </div>
          ))}
          <div style={dv} />
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>✗ Avoid</div>
          {selOrgan.avoid.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5, lineHeight: 1.4 }}>
              <span style={{ color: T.coral, flexShrink: 0 }}>✗</span>{a}
            </div>
          ))}
          <div style={dv} />
          <div style={aBox(T.gold, 10)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 2 }}>⚡ Pearl</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{selOrgan.pearl}</div>
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Workup / Consults</div>
          {selOrgan.labs.map((l, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: T.teal, flexShrink: 0 }}>→</span>{l}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── TAB 2: MEDICATIONS ────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL()}>Select Agent</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {MEDS.map(m => (
          <button key={m.drug}
            style={{ padding: "7px 13px", borderRadius: 9, border: `1.5px solid ${drug === m.drug ? m.color : T.border}`, background: drug === m.drug ? m.color + "20" : T.glass, color: drug === m.drug ? m.color : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s", backdropFilter: "blur(8px)" }}
            onClick={() => setDrug(drug === m.drug ? null : m.drug)}>
            {m.drug}
          </button>
        ))}
      </div>

      {selDrug ? (
        <div style={{ ...card({ border: `1.5px solid ${selDrug.color}50`, marginBottom: 14 }) }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: selDrug.color, fontFamily: T.mono }}>{selDrug.drug}</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{selDrug.class} · {selDrug.route}</div>
          </div>
          <div style={aBox(selDrug.color, 12)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: selDrug.color, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dosing</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, lineHeight: 1.6 }}>{selDrug.dose}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[{ label: "Onset", val: selDrug.onset }, { label: "Offset", val: selDrug.offset }].map(({ label, val }) => (
              <div key={label} style={{ ...G({ borderRadius: 9 }), padding: "9px 11px", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: T.dim, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Best For</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{selDrug.best}</div>
          </div>
          <div style={dv} />
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Avoid When</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{selDrug.avoid}</div>
          </div>
        </div>
      ) : (
        <div style={{ ...G(), padding: "24px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💊</div>
          <div style={{ color: T.muted, fontSize: 13 }}>Select an agent above for detailed dosing and indications</div>
        </div>
      )}

      <div style={sL(T.gold)}>Quick Agent Comparison</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 480 }}>
          {[{ h: true, drug: "Drug", onset: "Onset", offset: "Offset", color: null },
            ...MEDS.map(m => ({ drug: m.drug, onset: m.onset, offset: m.offset, color: m.color, h: false }))
          ].map(({ drug: d, onset, offset, color, h }, i) => (
            <div key={d} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: h ? T.glassMid : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
              <div style={{ flex: 2, padding: "8px 12px", fontSize: h ? 10 : 12, fontWeight: h ? 700 : 600, color: h ? T.muted : (color || T.white), textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.08em" : "0" }}>{d}</div>
              <div style={{ flex: 1, padding: "8px 12px", fontFamily: h ? T.sans : T.mono, fontSize: h ? 10 : 11.5, color: h ? T.muted : T.teal, textTransform: h ? "uppercase" : "none" }}>{onset}</div>
              <div style={{ flex: 1, padding: "8px 12px", fontFamily: h ? T.sans : T.mono, fontSize: h ? 10 : 11.5, color: h ? T.muted : T.gold, textTransform: h ? "uppercase" : "none" }}>{offset}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Do NOT normalize BP rapidly</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Autoregulation is shifted in chronic hypertension. Rapid correction causes ischemia to brain, heart, and kidneys. Reduce gradually except in aortic dissection.</div>
      </div>

      <div style={sL()}>General BP Reduction Timeline</div>
      {[
        { phase: "First 1 hour",  target: "Reduce MAP by 20–25% (not to normal)", color: T.coral, note: "Exception: aortic dissection (SBP < 120 within 20 min)" },
        { phase: "Hours 1–6",     target: "Reduce to 160/100 mmHg if stable",       color: T.gold,  note: "Reassess end-organ status at each step" },
        { phase: "Hours 6–24",    target: "Continue gradual reduction",             color: T.teal,  note: "Transition to oral agents when tolerating PO and stable" },
        { phase: "24–48 hours",   target: "Normalize to goal BP",                  color: T.green, note: "Establish outpatient follow-up with PCP" },
      ].map(({ phase, target, color, note }) => (
        <div key={phase} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{phase}</div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 3 }}>{target}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL()}>Condition-Specific BP Targets</div>
      {[
        { cond: "Aortic Dissection",          target: "SBP < 120 · HR < 60 · within 20 min",            color: T.coral },
        { cond: "Ischemic Stroke (tPA)",       target: "SBP < 185/110 before tPA",                       color: T.blue },
        { cond: "Ischemic Stroke (no tPA)",    target: "Only treat if > 220/120 · max 15% reduction",    color: T.blue },
        { cond: "ICH",                         target: "SBP 130–140 mmHg (not < 120)",                   color: T.amber },
        { cond: "Eclampsia",                   target: "SBP 140–155 · DBP 90–105",                      color: T.purple },
        { cond: "ACS",                         target: "SBP < 140 · HR < 70 bpm",                       color: T.gold },
        { cond: "ADHF",                        target: "MAP reduction 20–25% · reduce afterload",        color: T.teal },
        { cond: "All others (general)",        target: "MAP reduction 20–25% in first hour",             color: T.green },
      ].map(({ cond, target, color }) => (
        <div key={cond} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color, minWidth: 155, flexShrink: 0 }}>{cond}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.white }}>{target}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Monitoring Parameters</div>
      {[
        { freq: "Every 5 min",  items: "BP (arterial line preferred for dissection/severe cases) · HR · SpO₂",     color: T.coral },
        { freq: "Every 15 min", items: "Neuro checks · urine output · response to therapy",                        color: T.gold },
        { freq: "Every 1–2h",   items: "Creatinine trend · repeat ECG if ACS · reassess end-organ status",        color: T.teal },
        { freq: "Ongoing",      items: "Continuous cardiac monitoring · watch for overshoot hypotension",         color: T.green },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 100, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { label: "ICU / Monitored", detail: "Aortic dissection · ICH · massive stroke · eclampsia · refractory or IV agent required with hemodynamic instability" },
          { label: "Telemetry Floor", detail: "Responding to IV therapy · stable end-organ function · transitioning to oral agents" },
          { label: "Discharge",       detail: "Hypertensive urgency only · oral agents initiated · BP improving · 24–72h PCP follow-up arranged" },
          { label: "Never discharge", detail: "Any confirmed end-organ damage · dissection · stroke · AKI · troponin elevation" },
        ].map(({ label, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 130, flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(167,139,250,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#a78bfa,#6d28d9)")}>🧠 Neurologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>AHA / JNC</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Hypertensive Emergency</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>End-organ targeted agent selection · 9 clinical scenarios · Reduction targets · Drug comparison</p>
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
        {tab === 0 && Tab0}
        {tab === 1 && Tab1}
        {tab === 2 && Tab2}
        {tab === 3 && Tab3}
      </div>
    </div>
  );
}