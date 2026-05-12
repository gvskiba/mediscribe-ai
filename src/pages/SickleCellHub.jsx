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

export default function SickleCellHub({ onBack }) {
  const [tab, setTab]     = useState(0);
  const [crisis, setCrisis] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const TABS = ["Recognition", "Pain Crisis", "Acute Chest", "Complications"];

  const CRISES = [
    {
      id: "voc", name: "Vaso-Occlusive Crisis (VOC)", color: T.amber, icon: "🦴",
      freq: "Most common (90%)",
      mech: "HbS polymerization → sickling → microvascular occlusion → ischemia/infarction → pain",
      features: "Severe bone pain (most common: back · hips · knees · chest · arms) · pain is ischemic in nature · no reliable objective findings · based entirely on patient report · may have fever (from infarction or infection)",
      tx: "Aggressive IV/oral opioids · NSAIDs adjunct · IV fluids · warmth · incentive spirometry · avoid overhydration · treat triggers",
    },
    {
      id: "acs", name: "Acute Chest Syndrome (ACS)", color: T.coral, icon: "🫁",
      freq: "2nd most common · most common cause of death",
      mech: "Fat embolism (bone marrow infarction) · infection (Mycoplasma · Chlamydia · S. pneumoniae) · in situ sickling in pulmonary vasculature · pulmonary infarction",
      features: "Fever + new infiltrate on CXR + respiratory symptoms (chest pain · cough · tachypnea · hypoxia) · ANY two of these → ACS · often starts as VOC then progresses · can develop ARDS",
      tx: "Exchange transfusion (urgent if SpO₂ &lt; 90% or rapid deterioration) · antibiotics (coverage for atypicals + encapsulated organisms) · bronchodilators · incentive spirometry · simple transfusion for mild ACS",
    },
    {
      id: "stroke", name: "Acute Stroke", color: T.purple, icon: "🧠",
      freq: "11% of HbSS by age 20",
      mech: "Large vessel vasculopathy (stenosis/occlusion of MCA/ICA) from sickling and inflammation · embolic from cardiomegaly",
      features: "Focal neuro deficits · hemiparesis · aphasia · altered mentation · children most affected · pediatric stroke is more common in SCD than general pediatric population",
      tx: "Emergency exchange transfusion (reduce HbS to &lt; 30%) · DO NOT use tPA (lack of evidence · vasculopathy not thrombotic in typical sense) · MRI/MRA brain · transcranial Doppler for risk assessment · hydroxyurea for prevention",
    },
    {
      id: "splenic", name: "Splenic Sequestration", color: T.gold, icon: "🫀",
      freq: "Children &lt; 5 years (before auto-splenectomy) · adults with HbSC",
      mech: "Massive trapping of RBCs in spleen → rapid spleen enlargement + profound anemia + hypovolemic shock",
      features: "Sudden splenomegaly + Hgb drop ≥ 2g/dL from baseline + hypovolemic shock · pallor · weakness · rapid deterioration · can be fatal in hours",
      tx: "Urgent simple transfusion (raise Hgb, reduce sequestration) · IV fluids for shock · may need splenectomy for recurrent episodes · close monitoring as spleen contracts and releases cells (over-transfusion risk)",
    },
    {
      id: "aplastic", name: "Aplastic Crisis", color: T.blue, icon: "🔴",
      freq: "Usually parvovirus B19 · children > adults",
      mech: "Parvovirus B19 infects erythroid precursors → temporary cessation of RBC production · in high-turnover SCD, even brief cessation causes severe anemia",
      features: "Profound anemia (Hgb may drop to 2–3 g/dL) · reticulocyte count very low (&lt; 1%) · often with viral prodrome (parvovirus) · no pain crisis typically · fatigue + pallor dominant",
      tx: "Transfusion support · self-limited (1–2 weeks for marrow recovery) · isolate from immunocompromised patients (parvovirus contagious) · IVIG if immunocompromised",
    },
    {
      id: "priapism", name: "Priapism", color: T.teal, icon: "⚡",
      freq: "30–40% of males with SCD",
      mech: "Sickling in penile vasculature → venous outflow obstruction → prolonged painful erection · ischemic (low-flow) type is painful and requires urgent treatment",
      features: "Painful persistent erection > 4h · ischemic type = emergency · recurrent (stuttering priapism) episodes are common",
      tx: "Urological emergency if > 4h · corporal aspiration ± phenylephrine injection · IV hydration · analgesia · exchange transfusion for severe/prolonged cases · penile damage and impotence risk increases with duration",
    },
  ];

  const selCrisis = CRISES.find(c => c.id === crisis);

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.amber, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>Sickle Cell Disease — Pathophysiology Drives Management</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>HbS polymerization under low-O₂ conditions → irreversible sickling → microvascular occlusion, hemolysis, endothelial injury, and progressive organ damage. Acute crises require rapid recognition — some are immediately life-threatening.</div>
      </div>

      <div style={sL()}>Crisis Type Selector — tap for details</div>
      {CRISES.map(c => (
        <div key={c.id}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${crisis === c.id ? c.color + "70" : T.border}`, background: crisis === c.id ? c.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setCrisis(crisis === c.id ? null : c.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.name}</div>
                <div style={{ fontSize: 10, color: T.dim }}>{c.freq}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: crisis === c.id ? c.color : T.dim }}>{crisis === c.id ? "▲" : "▼"}</span>
          </div>
          {crisis === c.id && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${c.color}30` }}>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Mechanism</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.mech}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Features</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.features}</div>
              </div>
              <div style={aBox(c.color, 0)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 2 }}>Treatment</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.tx}</div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.coral)}>Common Triggers</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { t: "Infection",     d: "Most common · viral and bacterial · fever alone may represent crisis", color: T.coral },
          { t: "Dehydration",   d: "Increases sickling · hot weather · poor intake", color: T.amber },
          { t: "Hypoxia",       d: "Altitude · sleep apnea · swimming · poorly oxygenated environments", color: T.blue },
          { t: "Cold",          d: "Vasoconstriction → decreased flow → sickling · especially extremities", color: T.teal },
          { t: "Stress",        d: "Physical and emotional stress · surgery · catecholamine release", color: T.gold },
          { t: "Acidosis",      d: "Promotes HbS polymerization · vomiting → alkalosis may help", color: T.purple },
        ].map(({ t, d, color }) => (
          <div key={t} style={{ ...G({ borderRadius: 9 }), padding: "9px 11px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{t}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: PAIN CRISIS ──────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.amber, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>VOC — Pain is Real. Believe the Patient. Treat Aggressively.</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Sickle cell pain is ischemic bone pain — some of the most severe pain in medicine. Objective findings are absent by design. Undertreated pain → hyperventilation → hypoxia → worsened sickling. Time to analgesia &lt; 30 min.</div>
      </div>

      <div style={sL()}>Analgesia Protocol</div>
      {[
        { step: "1. Assess severity", detail: "NRS pain score · baseline pain score (patient knows their baseline) · vital signs · SpO₂ · respiratory rate · patient-reported usual medications", color: T.teal },
        { step: "2. IV access + immediate analgesia", detail: "Goal time to analgesia &lt; 30 min from arrival · IV opioid preferred for severe pain (NRS ≥ 7) · PO/SQ acceptable for moderate pain", color: T.coral },
        { step: "3. IV hydration", detail: "D5W or 0.45% NS at 1–1.5× maintenance (avoids sickling without overhydration) · restrict to maintenance in ACS to prevent pulmonary edema · oral hydration if tolerating PO", color: T.blue },
        { step: "4. Reassess at 30 min", detail: "Reassess pain score · if NRS ≥ 7 unchanged → repeat opioid dose · if improving → continue monitoring · ACS screening (SpO₂ · breath sounds · fever)", color: T.gold },
        { step: "5. Adjuncts", detail: "Ketorolac 30 mg IV or ibuprofen PO (NSAIDs reduce opioid need) · Heat/warmth to painful areas · Incentive spirometry (prevents ACS) · Antihistamine if itching from opioids", color: T.purple },
      ].map(({ step, detail, color }) => (
        <div key={step} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Opioid Dosing Reference</div>
      {[
        { drug: "Morphine IV",         dose: "0.1–0.15 mg/kg IV q 20 min PRN · patient-controlled analgesia (PCA) if admitted", note: "Standard for severe pain · titrate to NRS &lt; 4", color: T.teal },
        { drug: "Hydromorphone (Dilaudid) IV", dose: "0.015–0.02 mg/kg IV q 20 min PRN", note: "More potent · preferred if morphine causes significant pruritus · 5–10× more potent than morphine", color: T.blue },
        { drug: "Oxycodone PO",        dose: "5–10 mg PO q 4h (opioid-naive) · use patient's usual dose if known", note: "For moderate pain or oral medication tolerance", color: T.gold },
        { drug: "Fentanyl IV",         dose: "1–1.5 mcg/kg IV q 30–60 min PRN · or PCA", note: "Rapid onset · short duration · useful for procedural pain or PCA", color: T.amber },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 2 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Discharge vs Admission Criteria</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={card({ borderLeft: `3px solid ${T.green}`, padding: "12px" })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Discharge if:</div>
          {["Pain NRS ≤ 6 on oral meds", "SpO₂ ≥ 95% room air", "Tolerating PO fluids", "No ACS signs", "No fever (or evaluable)", "Reliable follow-up", "Adequate home support"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.green }}>✓</span>{s}</div>
          ))}
        </div>
        <div style={card({ borderLeft: `3px solid ${T.coral}`, padding: "12px" })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Admit if:</div>
          {["Pain uncontrolled on PO", "SpO₂ &lt; 95% or declining", "Fever with sepsis concern", "New chest symptoms / ACS", "Neurological changes", "Priapism > 4h", "Aplastic / sequestration crisis"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.coral }}>●</span>{s}</div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TAB 2: ACUTE CHEST ──────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>ACS — Most Common Cause of SCD Death</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Definition: new pulmonary infiltrate on CXR + fever OR respiratory symptoms (chest pain · cough · tachypnea · hypoxia). Leading cause of death in SCD. Often starts as VOC then evolves. Early exchange transfusion is life-saving in severe cases.</div>
      </div>

      <div style={sL()}>ACS Severity Assessment</div>
      {[
        { sev: "Mild",    criteria: "SpO₂ ≥ 95% · RR &lt; 20 · no respiratory distress · unilateral infiltrate · fever present", tx: "Simple transfusion (raise Hgb by 1–2 g/dL · do NOT over-transfuse) · antibiotics · bronchodilators · IS", color: T.teal },
        { sev: "Moderate", criteria: "SpO₂ 90–94% · RR 20–30 · mild distress · bilateral or spreading infiltrates", tx: "Exchange transfusion (urgent) · antibiotics · bronchodilators · NPPV if needed · ICU consider", color: T.gold },
        { sev: "Severe",  criteria: "SpO₂ &lt; 90% · RR > 30 · severe distress · multilobar · ARDS pattern · rapid deterioration", tx: "Emergency exchange transfusion (red cell exchange · target HbS &lt; 30%) · ICU · intubation · treat as ARDS", color: T.coral },
      ].map(({ sev, criteria, tx, color }) => (
        <div key={sev} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 5 }}>{sev}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}><span style={{ color, fontWeight: 600 }}>Criteria: </span>{criteria}</div>
          <div style={aBox(color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>Treatment</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{tx}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>Exchange Transfusion</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { f: "Indication",  v: "SpO₂ &lt; 90% · rapid deterioration · severe ACS · stroke · multiorgan failure · priapism refractory to simple measures" },
          { f: "Goal",        v: "Reduce HbS to &lt; 30% of total Hgb · raise Hgb to 10–11 g/dL without raising above 12 (hyperviscosity)" },
          { f: "Method",      v: "Automated erythrocytapheresis (preferred) · manual exchange if automated unavailable (remove 1 unit pRBC · replace with 2 units · repeat)" },
          { f: "Blood type",  v: "Extended Rh typing + Kell antigen matching before first transfusion · alloimmunization prevention · sickle cell patients often develop multiple RBC antibodies with repeated transfusion" },
        ].map(({ f, v }) => (
          <div key={f} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 80, flexShrink: 0 }}>{f}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Antibiotic Coverage in ACS</div>
      {[
        { coverage: "Atypicals (Mycoplasma · Chlamydia)", drug: "Azithromycin 500 mg IV/PO daily", note: "Most common infectious cause of ACS", color: T.teal },
        { coverage: "Encapsulated organisms (S. pneumoniae · H. flu)", drug: "Ceftriaxone 1–2 g IV daily", note: "SCD patients functionally asplenic from auto-splenectomy → high pneumococcal risk", color: T.blue },
        { coverage: "Combined coverage standard", drug: "Ceftriaxone + Azithromycin", note: "Always empirically cover both atypical and encapsulated · await cultures · follow up with blood culture results", color: T.gold },
      ].map(({ coverage, drug, note, color }) => (
        <div key={coverage} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{coverage}</div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 2 }}>{drug}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: COMPLICATIONS ────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Chronic Organ Damage in SCD</div>
      {[
        { organ: "Spleen", finding: "Auto-splenectomy by age 5 in HbSS → functional asplenia → susceptibility to encapsulated bacteria (S. pneumoniae · H. influenzae · N. meningitidis) · fever in SCD patient = bacteremia until proven otherwise", color: T.gold },
        { organ: "Kidney", finding: "Sickle nephropathy · proteinuria · papillary necrosis (hematuria) · hyposthenuria (inability to concentrate urine → polyuria + dehydration risk) · CKD · ESRD in 10%", color: T.teal },
        { organ: "Brain",  finding: "Vasculopathy of ICA/MCA · 11% incidence of overt stroke by age 20 · silent cerebral infarctions (40% by adulthood) · transcranial Doppler screening for primary prevention · cognitive impairment", color: T.purple },
        { organ: "Lung",   finding: "Pulmonary hypertension (30%) → right heart failure · restrictive lung disease · recurrent ACS → progressive fibrosis · PFTs show restrictive pattern · echo for tricuspid regurgitation velocity", color: T.blue },
        { organ: "Heart",  finding: "Cardiomegaly (high-output state from chronic anemia) · diastolic dysfunction · increased stroke risk · sudden death from arrhythmia in pulmonary HTN", color: T.coral },
        { organ: "Bone",   finding: "Avascular necrosis (AVN) of femoral/humeral heads · bone infarcts · osteomyelitis (Salmonella typical in SCD) · growth retardation in children", color: T.amber },
        { organ: "Eyes",   finding: "Proliferative sickle retinopathy · vitreous hemorrhage · retinal detachment · HbSC > HbSS risk · annual ophthalmology screening", color: T.teal },
      ].map(({ organ, finding, color }) => (
        <div key={organ} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{organ}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{finding}</div>
        </div>
      ))}

      <div style={sL(T.blue)}>Disease-Modifying Therapies</div>
      {[
        { drug: "Hydroxyurea",       moa: "Increases HbF → inhibits HbS polymerization · decreases WBC adhesion · reduces crises by 50%", dose: "Start 15 mg/kg/day PO · titrate to max tolerated dose (watch for cytopenias) · first-line for frequent VOC or ACS · FDA-approved", color: T.teal },
        { drug: "Voxelotor (Oxbryta)", moa: "HbS polymerization inhibitor · directly inhibits HbS sickling · increases Hgb · reduces hemolysis · FDA approved 2019", dose: "1500 mg PO daily", color: T.blue },
        { drug: "Crizanlizumab (Adakveo)", moa: "Anti-P-selectin monoclonal antibody · blocks adhesion of sickled cells to endothelium · reduces VOC frequency · FDA approved 2019", dose: "5 mg/kg IV q 4 weeks (after 2 loading doses 2 weeks apart)", color: T.purple },
        { drug: "Stem Cell Transplant", moa: "Curative for SCD · HLA-matched sibling preferred · gene therapy emerging (betibeglogene autologous) · FDA approved 2023 (Casgevy/CRISPR) · potentially curative", dose: "Hematology/transplant center · high-risk procedure · best results in children with severe SCD before organ damage", color: T.coral },
      ].map(({ drug, moa, dose, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 3 }}>{moa}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white }}>{dose}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Infection Protocol — Functional Asplenia</div>
      <div style={{ ...card({ background: "rgba(20,184,166,0.07)", borderColor: "rgba(20,184,166,0.3)" }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 8 }}>⚠ Fever in SCD Patient = Sepsis Until Proven Otherwise</div>
        {[
          { item: "Blood cultures × 2 before antibiotics", color: T.teal },
          { item: "CBC · CMP · blood culture · CXR immediately", color: T.teal },
          { item: "Ceftriaxone 1–2g IV empirically within 30 min of presentation", color: T.coral },
          { item: "Add vancomycin if penicillin-resistant pneumococcus suspected · critically ill · bacteremia", color: T.amber },
          { item: "Mandatory vaccinations: PCV13 · PPSV23 · Hib · MenACWY · MenB · annual influenza", color: T.blue },
          { item: "Penicillin prophylaxis (amoxicillin 125–250 mg BID) from age 2 months to 5 years", color: T.purple },
        ].map(({ item, color }, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color, flexShrink: 0 }}>●</span>{item}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(34,197,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(245,158,11,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (<button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>← Critical Protocols</button>)}
        <div>
          <span style={pill("linear-gradient(135deg,#22c55e,#15803d)")}>🩸 Hematologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ASH / NHLBI 2020</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Sickle Cell Crisis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>VOC · ACS · Stroke · Sequestration · Pain protocol · Exchange transfusion · Hydroxyurea · Infection protocol</p>
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