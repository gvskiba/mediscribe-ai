import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
const sL   = (c = T.coral) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

// ── Grading Scales ────────────────────────────────────────────────────────────
const HUNT_HESS = [
  { grade: "Grade I",   color: T.green,  desc: "Asymptomatic or mild headache · slight nuchal rigidity",                           mortality: "~1%",  plan: "Elective surgery · close monitoring" },
  { grade: "Grade II",  color: T.teal,   desc: "Moderate-severe headache · nuchal rigidity · cranial nerve palsy (e.g. CN III)",  mortality: "~5%",  plan: "Early surgical/endovascular intervention" },
  { grade: "Grade III", color: T.gold,   desc: "Mild confusion or drowsiness · mild focal deficit",                               mortality: "~19%", plan: "Early intervention if no vasospasm / edema" },
  { grade: "Grade IV",  color: T.amber,  desc: "Stupor · moderate-severe hemiparesis · decerebrate posturing beginning",         mortality: "~42%", plan: "ICU stabilization first · delayed intervention" },
  { grade: "Grade V",   color: T.coral,  desc: "Deep coma · decerebrate posturing · moribund appearance",                        mortality: "~77%", plan: "Supportive care · prognosis very poor" },
];

const FISHER_MOD = [
  { grade: "Grade 1", color: T.green,  desc: "No blood or thin SAH < 1 mm, no IVH or hemispheric clot",       risk: "Low vasospasm risk" },
  { grade: "Grade 2", color: T.teal,   desc: "Thin SAH < 1 mm, with IVH or hemispheric clot",                 risk: "Low-moderate vasospasm risk" },
  { grade: "Grade 3", color: T.amber,  desc: "Thick SAH ≥ 1 mm, no IVH or hemispheric clot",                  risk: "High vasospasm risk (peak ~33%)" },
  { grade: "Grade 4", color: T.coral,  desc: "Thick SAH ≥ 1 mm WITH IVH or hemispheric clot",                 risk: "Highest vasospasm risk (~40%)" },
];

const VASOSPASM_TX = [
  { tx: "Nimodipine",           dose: "60 mg PO/NG q 4h × 21 days",    note: "ONLY proven mortality-reducing agent · neuroprotective NOT vasodilatory mechanism · do NOT give IV (severe hypotension)", color: T.teal, urgent: true },
  { tx: "Euvolemia",            dose: "Maintain normovolemia with NS",   note: "Old triple-H therapy (hypervolemia/hemodilution) abandoned — euvolemia now standard · avoid hypovolemia", color: T.blue, urgent: false },
  { tx: "Induced Hypertension", dose: "Target MAP 80–120 if vasospasm", note: "Raise MAP with norepinephrine 0.05–0.5 mcg/kg/min if delayed cerebral ischemia (DCI) suspected · first-line for DCI", color: T.gold, urgent: false },
  { tx: "Rescue Angioplasty",   dose: "Interventional neuroradiology",  note: "Balloon angioplasty or intra-arterial verapamil for refractory DCI despite maximal medical therapy", color: T.coral, urgent: false },
];

const COMPS = [
  { comp: "Rebleeding", color: T.coral, urgent: true,
    timing: "Highest risk in first 24h (up to 15%) · 50% mortality with rebleeding",
    signs: "Sudden severe headache · acute neurological deterioration · LOC",
    mgmt: "Emergent aneurysm securing (coiling or clipping) · BP control SBP < 160 pre-securing · brief antifibrinolytic if delay expected" },
  { comp: "Hydrocephalus (Acute)", color: T.purple, urgent: true,
    timing: "~20% of SAH · within hours · blood obstructs CSF drainage (communicating or obstructive)",
    signs: "Declining GCS · headache · Cushing's triad · upward gaze palsy (aqueductal obstruction)",
    mgmt: "External ventricular drain (EVD) · neurosurgery STAT · do NOT use LP (risk of rebleeding with acute pressure change)" },
  { comp: "Vasospasm / DCI", color: T.gold, urgent: false,
    timing: "Days 4–14 · peaks day 7 · occurs in 30–70% angiographically · 20–30% symptomatic",
    signs: "New focal deficit · declining mental status · fever · new headache",
    mgmt: "Induced hypertension (MAP 80–120) · nimodipine ongoing · TCD monitoring · rescue angioplasty for refractory cases" },
  { comp: "Hyponatremia / CSWS", color: T.teal, urgent: false,
    timing: "Common post-SAH · cerebral salt wasting (CSWS) vs SIADH — important distinction",
    signs: "Declining Na⁺ · volume depletion (CSWS) vs euvolemia/hypervolemia (SIADH)",
    mgmt: "CSWS: 3% NaCl + fludrocortisone 0.1 mg BID · SIADH: fluid restriction (use caution — hypovolemia worsens DCI) · distinguish by volume status" },
  { comp: "Seizures", color: T.amber, urgent: false,
    timing: "6–18% incidence · early (< 24h) vs late · cortical irritation from subarachnoid blood",
    signs: "Convulsions · postictal state · EEG changes · cortical spreading depolarization",
    mgmt: "Levetiracetam for short-term prophylaxis × 3–7 days · treat clinical seizures · long-term AED only if documented seizure · avoid phenytoin (worse outcomes in SAH)" },
  { comp: "Cardiac Complications", color: T.blue, urgent: false,
    timing: "Neurogenic stunned myocardium in 20–30% · catecholamine surge at time of rupture",
    signs: "ECG changes (ST/T wave changes · QTc prolongation · Wellens-like pattern) · troponin elevation · LV wall motion abnormalities on echo",
    mgmt: "Supportive · dobutamine if hemodynamically significant · beta-blockers for tachyarrhythmia · most resolve spontaneously with SAH treatment" },
  { comp: "Neurogenic Pulmonary Edema", color: T.coral, urgent: true,
    timing: "Acute onset at time of rupture · massive catecholamine surge → acute pulmonary vasoconstriction",
    signs: "Acute dyspnea · hypoxia · bilateral infiltrates · frothy sputum · normal PCWP",
    mgmt: "Supplemental O₂ · NPPV or intubation if severe · norepinephrine for hemodynamic support · usually resolves within 24–48h" },
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function SAHHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]         = useState(0);
  const [hhGrade, setHhGrade] = useState(null);
  const [fisherGrade, setFisherGrade] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const TABS = ["Recognition", "Grading", "Treatment", "Complications"];

  // ── TAB 0: RECOGNITION ───────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Worst Headache of Life — Treat as SAH Until Proven Otherwise</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Aneurysmal SAH carries 30-day mortality of 40–50%. Up to 25% die before hospital arrival. Misdiagnosis occurs in 12% on first presentation — most commonly as migraine or tension headache.</div>
      </div>

      <div style={sL()}>Classic Presentation</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 8 }}>Thunderclap Headache — Hallmark Feature</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
          Sudden-onset headache reaching maximum intensity within <span style={{ color: T.coral, fontWeight: 600 }}>60 seconds</span>. Unlike typical headaches that build over minutes. Patients often describe it as "a bat hit me" or "an explosion in my head."
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["Thunderclap headache (peak < 60 sec)", "Neck stiffness / meningismus", "Photophobia", "Nausea / vomiting", "Brief LOC at onset (10–15%)", "Sentinel headache (6 wks prior in 30–40%)", "CN III palsy (posterior communicating aneurysm)", "Focal deficits (if large hematoma)"].map((s, i) => (
            <span key={i} style={{ ...tag(T.coral), fontSize: 10 }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={sL(T.teal)}>Ottawa SAH Rule — For Alert Non-Traumatic Headache Patients</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>
          Investigate with CT ± LP if patient is <span style={{ color: T.teal, fontWeight: 600 }}>≥ 15 years</span>, <span style={{ color: T.teal, fontWeight: 600 }}>alert (GCS 15)</span>, non-traumatic, and has ANY ONE of:
        </div>
        {["Age ≥ 40 years", "Neck pain or stiffness", "Witnessed loss of consciousness", "Onset during exertion", "Thunderclap headache (instantaneous peak)", "Limited neck flexion on examination"].map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.teal }}>●</span>{c}
          </div>
        ))}
        <div style={aBox(T.green, 0)}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.green, fontWeight: 600 }}>Sensitivity 100% · Specificity 15.3%</span> — High sensitivity rule · negative only if NONE present AND GCS 15 AND non-traumatic onset
          </div>
        </div>
      </div>

      <div style={sL(T.gold)}>Diagnostic Pathway</div>
      {[
        { step: 1, label: "Non-contrast CT Head",              detail: "Sensitivity 98% within 6h · 93% at 12h · 50% at 1 week · Hyperdense blood in basal cisterns · classic star-shaped pattern", color: T.teal },
        { step: 2, label: "CT Negative → LP",                  detail: "If CT negative AND < 6h from onset · OR strong clinical suspicion despite negative CT · Xanthochromia (yellow CSF) is gold standard — appears 2–4h after onset · peaks at 12h · persists 1–2 weeks", color: T.gold },
        { step: 3, label: "CT-Angiography or MR-Angiography",  detail: "Once SAH confirmed — identify aneurysm location and morphology · CTA sensitivity 95–98% for aneurysms > 3mm · Negative CTA → perimesencephalic pattern (benign) vs missed aneurysm", color: T.purple },
        { step: 4, label: "Formal DSA",                        detail: "If CTA negative and SAH confirmed — gold standard for aneurysm detection · interventional neuroradiology / neurosurgery decision point", color: T.coral },
      ].map(({ step, label, detail, color }) => (
        <div key={step} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{step}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>LP Findings in SAH</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { finding: "Xanthochromia",      detail: "Yellow discoloration of CSF supernatant · gold standard · due to bilirubin from RBC breakdown · appears 2–4h · persists 1–2 weeks · spectrophotometry more sensitive than visual inspection", color: T.gold },
          { finding: "Bloody CSF (4-tube test)", detail: "Non-clearing blood across tubes 1–4 = SAH (traumatic tap clears) · RBC count should NOT decrease significantly between tube 1 and tube 4 in true SAH", color: T.coral },
          { finding: "Elevated Opening Pressure", detail: "Often > 200 mmH₂O in SAH · reflects elevated ICP from blood in subarachnoid space", color: T.amber },
          { finding: "Elevated CSF protein", detail: "Elevated due to blood breakdown products · not diagnostic alone", color: T.teal },
        ].map(({ finding, detail, color }, i) => (
          <div key={finding} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{finding}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>SAH Mimics</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { m: "Migraine",                d: "Usually builds over minutes · prior history · photophobia prominent · no meningismus" },
          { m: "Thunderclap migraine",    d: "Identical presentation — diagnosis of exclusion only after SAH ruled out" },
          { m: "Sentinel headache",       d: "May be the warning bleed of SAH — do NOT dismiss" },
          { m: "Hypertensive crisis",     d: "Severe headache + very high BP · PRES possible on MRI" },
          { m: "Venous sinus thrombosis", d: "Progressive headache · papilledema · MRV/CTV diagnostic" },
          { m: "Cervical artery dissection", d: "Neck pain + headache · Horner's · ischemic symptoms" },
        ].map(({ m, d }) => (
          <div key={m} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.gold, marginBottom: 2 }}>{m}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.35 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: GRADING ───────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.purple, 16)}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.purple, fontWeight: 700 }}>Two grading systems: </span>Hunt-Hess grades clinical severity and guides surgical timing. Modified Fisher grades CT blood burden and predicts vasospasm risk. Use both together.
        </div>
      </div>

      <div style={sL()}>Hunt-Hess Scale — Clinical Severity</div>
      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Tap a grade to expand details and management guidance</div>
      {HUNT_HESS.map(g => (
        <div key={g.grade}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${hhGrade === g.grade ? g.color + "70" : T.border}`, background: hhGrade === g.grade ? g.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setHhGrade(hhGrade === g.grade ? null : g.grade)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: g.color, fontFamily: T.mono }}>{g.grade}</span>
              <span style={{ fontSize: 11.5, color: T.muted }}>{g.desc.split("·")[0].trim()}</span>
            </div>
            <span style={{ ...tag(g.color), fontSize: 9 }}>Mortality {g.mortality}</span>
          </div>
          {hhGrade === g.grade && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${g.color}30` }}>
              <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>{g.desc}</div>
              <div style={aBox(g.color, 0)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: g.color, marginBottom: 2 }}>Management</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{g.plan}</div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.gold)}>Modified Fisher Scale — CT Blood Burden → Vasospasm Risk</div>
      {FISHER_MOD.map(g => (
        <div key={g.grade}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${fisherGrade === g.grade ? g.color + "70" : T.border}`, background: fisherGrade === g.grade ? g.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setFisherGrade(fisherGrade === g.grade ? null : g.grade)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: g.color, fontFamily: T.mono }}>{g.grade}</span>
            <span style={{ ...tag(g.color), fontSize: 9 }}>{g.risk}</span>
          </div>
          <div style={{ fontSize: 11.5, color: fisherGrade === g.grade ? T.muted : T.dim, marginTop: 3 }}>{g.desc}</div>
          {fisherGrade === g.grade && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${g.color}30` }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: g.color }}>{g.risk}</div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.teal)}>WFNS Scale (World Federation of Neurosurgical Societies)</div>
      <div style={{ ...card() }}>
        {[
          { grade: "I",   gcs: "15",    motor: "Absent",  color: T.green },
          { grade: "II",  gcs: "13–14", motor: "Absent",  color: T.teal },
          { grade: "III", gcs: "13–14", motor: "Present", color: T.gold },
          { grade: "IV",  gcs: "7–12",  motor: "+/–",     color: T.amber },
          { grade: "V",   gcs: "3–6",   motor: "+/–",     color: T.coral },
        ].map(({ grade, gcs, motor, color }, i) => (
          <div key={grade} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 4 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color, minWidth: 30 }}>{grade}</div>
            <div style={{ flex: 1, fontSize: 12, color: T.muted }}>GCS {gcs}</div>
            <div style={{ fontSize: 12, color: motor !== "Absent" ? T.coral : T.green }}>Motor deficit: {motor}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 2: TREATMENT ────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Dual Priority: Prevent Rebleeding + Prevent Vasospasm</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Rebleeding risk highest in first 24h (up to 15%). Vasospasm peaks days 4–14. Both are life-threatening — management targets both simultaneously.</div>
      </div>

      <div style={sL()}>Immediate ED Management</div>
      {[
        { n: 1, label: "Neurosurgery + Neurology",  detail: "Activate immediately on confirmed SAH · aneurysm securing decision (clipping vs coiling) ideally within 24h to prevent rebleeding", color: T.coral },
        { n: 2, label: "ICU Admission",             detail: "All confirmed SAH · continuous neurological monitoring · arterial line for BP monitoring · ICP monitoring in Hunt-Hess ≥ III", color: T.purple },
        { n: 3, label: "Nimodipine 60 mg PO q 4h", detail: "Start immediately · × 21 days · ONLY oral/NG (IV causes severe hypotension) · if unable to take PO: give via NG tube in 20mL NS", color: T.teal },
        { n: 4, label: "BP Control",                detail: "Pre-aneurysm securing: SBP < 160 mmHg (AHA Class I) · Post-securing: permissive hypertension (MAP 80–100) to prevent vasospasm", color: T.gold },
        { n: 5, label: "Seizure Prophylaxis",       detail: "Levetiracetam 500–1000 mg IV (preferred over phenytoin) · short-term use only × 3–7 days unless documented seizure · risk ~6–18%", color: T.blue },
        { n: 6, label: "DVT Prophylaxis",           detail: "Mechanical compression immediately · hold pharmacologic × 24h post-aneurysm securing · SCD boots at all times", color: T.green },
      ].map(({ n, label, detail, color }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>Aneurysm Securing — Clipping vs Coiling</div>
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <div style={card({ background: "rgba(167,139,250,0.07)", borderColor: "rgba(167,139,250,0.3)" })}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Endovascular Coiling (ISAT trial — preferred when feasible)</div>
          {["Posterior circulation aneurysms (basilar tip)", "Elderly or poor surgical candidates (Hunt-Hess IV–V)", "Small neck-to-dome ratio aneurysm", "ISAT: 23.7% vs 30.6% dependent/dead at 1 year (coiling favored)"].map((p, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.purple }}>●</span>{p}</div>
          ))}
        </div>
        <div style={card({ background: "rgba(59,130,246,0.07)", borderColor: "rgba(59,130,246,0.3)" })}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 8 }}>Surgical Clipping (preferred when)</div>
          {["Wide-neck aneurysm not amenable to coiling", "Middle cerebral artery (MCA) aneurysms", "Large intracerebral hematoma requiring evacuation", "Young patient with long life expectancy", "Previous coil compaction / recanalization"].map((p, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.blue }}>●</span>{p}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.gold)}>Vasospasm / DCI Treatment</div>
      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Delayed cerebral ischemia (DCI) peaks days 4–14 · occurs in 30% · most preventable cause of SAH-related death</div>
      {VASOSPASM_TX.map(({ tx, dose, note, color, urgent }) => (
        <div key={tx} style={{ ...G(), padding: "11px 13px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{tx}</span>
            {urgent && <span style={{ ...tag(T.coral), fontSize: 9 }}>Start IMMEDIATELY</span>}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Medications — Critical Considerations</div>
      {[
        { drug: "Antifibrinolytics (TXA / ε-aminocaproic acid)", note: "Brief use (< 72h) may reduce early rebleeding while awaiting aneurysm securing · risk: increased cerebral ischemia · no longer routinely recommended", color: T.gold },
        { drug: "Anticoagulants / Antiplatelets", note: "Avoid until aneurysm is secured · anticoagulation reversal required if on warfarin/DOACs before securing", color: T.coral },
        { drug: "Corticosteroids", note: "NOT recommended in SAH · no benefit shown · may increase infection and hyperglycemia", color: T.amber },
        { drug: "Statins (Simvastatin)", note: "STASH trial: no benefit in randomized trial · not routinely recommended despite earlier enthusiasm", color: T.blue },
      ].map(({ drug, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{drug}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: COMPLICATIONS ─────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Complications Overview</div>
      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 14 }}>Tap each complication to expand management</div>
      {COMPS.map(({ comp, color, urgent, timing, signs, mgmt }) => {
        const open = expanded === comp;
        return (
          <div key={comp}
            style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${open ? color + "65" : T.border}`, background: open ? color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setExpanded(open ? null : comp)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{comp}</span>
                {urgent && <span style={{ ...tag(T.coral), fontSize: 9 }}>URGENT</span>}
              </div>
              <span style={{ fontSize: 13, color: open ? color : T.dim }}>{open ? "▲" : "▼"}</span>
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>{timing.split("·")[0].trim()}</div>
            {open && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${color}30` }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Timing</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{timing}</div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Signs</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{signs}</div>
                </div>
                <div style={aBox(color, 0)}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>Management</div>
                  <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{mgmt}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={sL(T.teal)}>Transcranial Doppler (TCD) Monitoring</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Daily TCD for vasospasm surveillance — mean flow velocities by vessel:</div>
        {[
          { vessel: "MCA",     normal: "< 120 cm/s", vasospasm: "≥ 200 cm/s", borderline: "120–200 cm/s", color: T.blue },
          { vessel: "ACA/PCA", normal: "< 90 cm/s",  vasospasm: "≥ 150 cm/s", borderline: "90–150 cm/s",  color: T.teal },
          { vessel: "Basilar", normal: "< 80 cm/s",  vasospasm: "≥ 115 cm/s", borderline: "80–115 cm/s",  color: T.purple },
        ].map(({ vessel, normal, vasospasm, borderline, color }) => (
          <div key={vessel} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "9px 12px", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 60 }}>{vessel}</div>
            <div style={{ flex: 1, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: T.green }}>Normal: {normal}</span>
              <span style={{ fontSize: 11, color: T.gold }}>Borderline: {borderline}</span>
              <span style={{ fontSize: 11, color: T.coral }}>Spasm: {vasospasm}</span>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>Lindegaard ratio (MCA/extracranial ICA velocity) {'>'} 3 = vasospasm (corrects for hyperemia)</div>
      </div>

      <div style={sL(T.gold)}>ICU Monitoring Protocol</div>
      {[
        { freq: "Every 1–2h", items: "Neuro checks (GCS · pupils · focal deficits) · BP · UO",                         color: T.coral },
        { freq: "Every 6–8h", items: "Na⁺ (CSWS watch) · glucose · temperature",                                       color: T.gold },
        { freq: "Daily",      items: "TCD velocities · labs (BMP · CBC) · ECG · reassess vasospasm risk",               color: T.teal },
        { freq: "Day 1–14",   items: "CT angiography or CTP if new deficit · vasospasm surveillance window",            color: T.purple },
        { freq: "Continuous", items: "Arterial line BP · cardiac monitoring · ICP (if EVD or monitor placed)",          color: T.green },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 90, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Prognosis & Outcomes</div>
      <div style={{ ...card() }}>
        {[
          { label: "Overall 30-day mortality",  val: "~40–50%",        note: "Includes pre-hospital deaths" },
          { label: "Good neurologic outcome",   val: "~60% survivors", note: "mRS 0–2 at 1 year" },
          { label: "Rebleed mortality",         val: "~70%",           note: "Underscores urgency of early securing" },
          { label: "Perimesencephalic SAH",     val: "Excellent",      note: "Non-aneurysmal · CT pattern = blood only in perimesencephalic cisterns · benign prognosis" },
          { label: "Cognitive impairment",      val: "~50% survivors", note: "Memory · executive function · depression common" },
        ].map(({ label, val, note }, i) => (
          <div key={label} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, color: T.muted, flex: 1 }}>{label}</div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.coral, textAlign: "right" }}>{val}</div>
              <div style={{ fontSize: 10.5, color: T.dim, textAlign: "right" }}>{note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,63,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(167,139,250,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#a78bfa,#6d28d9)")}>🧠 Neurologic</span>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>AHA/ASA 2023</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Subarachnoid Hemorrhage</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Ottawa SAH Rule · Hunt-Hess · Modified Fisher · Nimodipine · Vasospasm management · Rebleeding prevention</p>
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
        {tab === 0 && T0}
        {tab === 1 && T1}
        {tab === 2 && T2}
        {tab === 3 && T3}
      </div>
    </div>
  );
}