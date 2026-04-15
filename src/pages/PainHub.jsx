// PainHub.jsx
// Pain Management Module — standalone page + embeddable in encounter.
// Sections:
//   1. MME Calculator — morphine milligram equivalent conversion
//   2. Opioid Rotation Guide — equianalgesic dose calculator
//   3. Non-Opioid Adjunct Protocols — multimodal pain ladder
//   4. PDMP Red Flag Recognizer — pattern detection
//   5. Prescribing Reference — ED-specific limits and guidelines
//
// Props (embedded): demo, vitals, medications, allergies, pmhSelected, cc

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Font injection ─────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("pain-fonts")) return;
  const l = document.createElement("link");
  l.id = "pain-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "pain-css";
  s.textContent = `
    @keyframes pain-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .pain-fade{animation:pain-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#ff9f43 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
  cyan:"#00d4ff",
};

// ── MME conversion factors ─────────────────────────────────────────────────────
const OPIOIDS = [
  { id:"morphine_oral",     name:"Morphine (oral)",          mme:1,    routes:["oral"],                  formulations:["IR","ER"] },
  { id:"morphine_iv",       name:"Morphine (IV/IM/SC)",      mme:3,    routes:["iv","im","sc"],           formulations:["IV push","infusion"] },
  { id:"oxycodone_oral",    name:"Oxycodone (oral)",         mme:1.5,  routes:["oral"],                  formulations:["IR","ER","combination"] },
  { id:"hydrocodone",       name:"Hydrocodone (oral)",       mme:1,    routes:["oral"],                  formulations:["IR","ER","combination"] },
  { id:"hydromorphone_oral",name:"Hydromorphone (oral)",     mme:4,    routes:["oral"],                  formulations:["IR","ER"] },
  { id:"hydromorphone_iv",  name:"Hydromorphone (IV)",       mme:20,   routes:["iv"],                    formulations:["IV push","infusion"] },
  { id:"fentanyl_iv",       name:"Fentanyl (IV mcg)",        mme:0.1,  routes:["iv"],                    formulations:["IV push","infusion"], unit:"mcg" },
  { id:"fentanyl_patch",    name:"Fentanyl patch (mcg/hr)",  mme:2.4,  routes:["transdermal"],           formulations:["patch"],              unit:"mcg/hr", note:"MME per mcg/hr of patch x 24h" },
  { id:"methadone_low",     name:"Methadone <=20 mg/day",   mme:4,    routes:["oral"],                  formulations:["oral"],               note:"MME ratio increases with dose — use caution" },
  { id:"methadone_mid",     name:"Methadone 21-40 mg/day",  mme:8,    routes:["oral"],                  formulations:["oral"],               note:"Non-linear — consult specialist" },
  { id:"methadone_high",    name:"Methadone >40 mg/day",    mme:12,   routes:["oral"],                  formulations:["oral"],               note:"Non-linear — consult specialist" },
  { id:"codeine",           name:"Codeine (oral)",           mme:0.15, routes:["oral"],                  formulations:["IR","combination"] },
  { id:"tramadol",          name:"Tramadol (oral)",          mme:0.1,  routes:["oral"],                  formulations:["IR","ER"],            note:"Partial MOR agonist + SNRI — serotonin syndrome risk with SSRIs" },
  { id:"tapentadol",        name:"Tapentadol (oral)",        mme:0.4,  routes:["oral"],                  formulations:["IR","ER"],            note:"MOR agonist + NRI — 0.4 MME factor" },
  { id:"meperidine",        name:"Meperidine (Demerol)",     mme:0.1,  routes:["oral","iv"],             formulations:["oral","IV"],          note:"NOT recommended — toxic metabolite (normeperidine), seizure risk" },
  { id:"buprenorphine",     name:"Buprenorphine (SL/TD)",    mme:75,   routes:["sublingual","transdermal"], formulations:["Suboxone","Belbuca","Butrans"], unit:"mg", note:"Complex partial agonist — contact pain/addiction specialist for rotation" },
];

// ── Non-opioid adjuncts ───────────────────────────────────────────────────────
const ADJUNCTS = [
  {
    name:"Acetaminophen", color:T.teal, category:"analgesic",
    dose:"650-1000 mg PO/IV q6-8h",
    maxDaily:"4g/day (2g/day if hepatic disease or heavy EtOH)",
    mechanism:"Central COX inhibition + endocannabinoid modulation",
    indication:"Mild-moderate pain; opioid-sparing in all pain types",
    notes:"IV acetaminophen (Ofirmev): onset faster — use when PO not feasible. No renal dosing adjustment needed.",
    contraindications:"Hepatic failure, heavy alcohol use (>3 drinks/day)",
    mmeSparing:"Reduces opioid requirement by 20-30%",
  },
  {
    name:"Ketorolac (Toradol)", color:T.orange, category:"NSAID",
    dose:"15-30 mg IV/IM q6h or 10 mg PO q6h",
    maxDaily:"120 mg/day IV/IM; max 5 days total",
    mechanism:"Peripheral COX-1/2 inhibition — potent anti-inflammatory",
    indication:"Moderate-severe pain, renal colic, MSK pain, post-procedure",
    notes:"15 mg IV equivalent to 6-12 mg morphine for renal colic. Do not exceed 5 days.",
    contraindications:"Active PUD, renal failure (GFR <30), coagulopathy, active bleeding, 3rd trimester",
    mmeSparing:"Reduces opioid requirement by 30-40%",
  },
  {
    name:"Ibuprofen (oral)", color:T.orange, category:"NSAID",
    dose:"400-800 mg PO q6-8h with food",
    maxDaily:"3200 mg/day (ED typically: 2400 mg/day)",
    mechanism:"COX-1/2 inhibition",
    indication:"Mild-moderate pain, musculoskeletal, headache, dental",
    notes:"Often combined with acetaminophen for additive effect (different mechanisms). Take with food.",
    contraindications:"Active PUD, CKD, CHF, 3rd trimester, aspirin allergy/NSAID sensitivity",
    mmeSparing:"Reduces opioid requirement by 20-30%",
  },
  {
    name:"Ketamine (sub-dissociative)", color:T.gold, category:"NMDA antagonist",
    dose:"0.1-0.3 mg/kg IV over 15 min (typical: 20-30 mg IV)",
    maxDaily:"No strict limit — titrate to effect",
    mechanism:"NMDA receptor antagonism — modulates central sensitization",
    indication:"Opioid-sparing, opioid-resistant pain, neuropathic pain, sickle cell crisis",
    notes:"Give slowly over 15 min — rapid push causes dysphoria, laryngospasm. Excellent for opioid-tolerant patients. IM: 0.5-1 mg/kg.",
    contraindications:"Uncontrolled hypertension, active psychosis, poorly controlled seizures",
    mmeSparing:"Reduces opioid requirement by 40-50% in opioid-tolerant patients",
  },
  {
    name:"IV Lidocaine", color:T.cyan, category:"sodium channel blocker",
    dose:"1.5 mg/kg IV bolus over 10 min then 1-3 mg/kg/hr infusion",
    maxDaily:"Infusion duration per anesthesia/pain team",
    mechanism:"Sodium channel blockade — modulates central and peripheral sensitization",
    indication:"Neuropathic pain, abdominal pain, post-operative pain, opioid-tolerant",
    notes:"Requires continuous cardiac monitoring. Contraindicated with sodium channel blockers (TCA, flecainide).",
    contraindications:"Sodium channel blocker use, hepatic failure, 2nd/3rd degree AV block, allergy to amide LAs",
    mmeSparing:"Reduces opioid requirement by 30-40%",
  },
  {
    name:"Methocarbamol (Robaxin)", color:T.blue, category:"muscle relaxant",
    dose:"750-1500 mg PO TID-QID or 1000 mg IV over 5 min",
    maxDaily:"8g/day (first 48h); 4.5g/day maintenance",
    mechanism:"CNS depression — reduces muscle spasm",
    indication:"Acute musculoskeletal pain with spasm component",
    notes:"Sedating — avoid in elderly (Beers Criteria). IV form may cause thrombophlebitis.",
    contraindications:"Renal impairment (IV form — PEG vehicle), elderly (Beers), CNS depression",
    mmeSparing:"Limited opioid-sparing — best combined with NSAID",
  },
  {
    name:"Gabapentin", color:T.purple, category:"neuropathic",
    dose:"300 mg PO — titrate to 300-600 mg TID",
    maxDaily:"3600 mg/day (renal dose adjustment required)",
    mechanism:"Alpha-2-delta calcium channel subunit binding — reduces nociceptive transmission",
    indication:"Neuropathic pain, radiculopathy, postherpetic neuralgia",
    notes:"Significant sedation — caution with opioids (respiratory depression potentiation). FDA black box: risk of respiratory depression when combined with opioids/CNS depressants.",
    contraindications:"Caution in renal impairment (dose-adjust), elderly, respiratory depression risk",
    mmeSparing:"Reduces opioid requirement by 20-35% for neuropathic pain",
  },
  {
    name:"Dexamethasone", color:T.green, category:"corticosteroid",
    dose:"8-10 mg IV/PO (single dose for acute pain)",
    maxDaily:"Single dose in ED; ongoing per pain team",
    mechanism:"Anti-inflammatory, reduces perilesional edema",
    indication:"Radiculopathy/disc herniation, nerve compression, dental pain, headache, sickle cell",
    notes:"Single-dose IV dexamethasone 8-10 mg reduces pain and opioid requirement in radiculopathy significantly.",
    contraindications:"Active infection (relative), uncontrolled diabetes (glucose spike), active PUD with NSAIDs",
    mmeSparing:"Reduces opioid requirement by 20-30% for inflammatory/neuropathic",
  },
  {
    name:"Nitrous Oxide (50/50)", color:T.teal, category:"inhalational analgesic",
    dose:"50% N2O / 50% O2 via demand valve mask — patient self-administered",
    maxDaily:"Typically 15-30 min continuous use",
    mechanism:"NMDA antagonism + endogenous opioid release",
    indication:"Procedural pain (laceration repair, fracture reduction, IV access in anxious patients), pediatric procedures",
    notes:"Excellent for procedural analgesia — onset 60-90 sec, offset 2-3 min. Patient controls delivery.",
    contraindications:"Pneumothorax, bowel obstruction, middle ear surgery, MTHR polymorphism, B12 deficiency",
    mmeSparing:"Avoids opioids entirely for many procedures",
  },
];

// ── PDMP red flag patterns ────────────────────────────────────────────────────
const PDMP_FLAGS = [
  {
    id:"multiple_prescribers",
    label:"Multiple Prescribers",
    color:T.red,
    threshold:">=3 prescribers for controlled substances in 90 days",
    significance:"High specificity for prescription drug misuse — doctor shopping",
    action:"Discuss directly with patient — may have legitimate pain specialist + PCP. Document conversation.",
  },
  {
    id:"multiple_pharmacies",
    label:"Multiple Pharmacies",
    color:T.red,
    threshold:">=3 pharmacies filling controlled substance prescriptions in 90 days",
    significance:"Attempts to avoid single pharmacy tracking — high-risk pattern",
    action:"Address with patient; consider not prescribing additional controlled substances if no clear legitimate explanation.",
  },
  {
    id:"early_refill",
    label:"Early Refill Pattern",
    color:T.orange,
    threshold:">=2 early refills (>7 days early) in 90 days",
    significance:"Suggests faster consumption than prescribed — misuse, diversion, or undertreated pain",
    action:"Assess for undertreated pain vs misuse. Review prescribing appropriateness.",
  },
  {
    id:"high_mme",
    label:"High Total MME",
    color:T.orange,
    threshold:"Current daily MME >=90 (CDC threshold for increased overdose risk)",
    significance:"Doses >=90 MME/day have significantly increased overdose mortality risk",
    action:"Verify clinical necessity. Naloxone should be co-prescribed. Consider pain specialist referral.",
  },
  {
    id:"concurrent_benzo",
    label:"Concurrent Benzodiazepine",
    color:T.red,
    threshold:"Active prescription for opioid AND benzodiazepine simultaneously",
    significance:"3.9x increased overdose mortality risk vs opioid alone — FDA black box warning",
    action:"Document risk discussion. Consider whether ED prescription is appropriate. Discuss with PCP.",
  },
  {
    id:"concurrent_stimulant",
    label:"Concurrent Stimulant",
    color:T.gold,
    threshold:"Active opioid prescription concurrent with amphetamine/stimulant",
    significance:"May indicate misuse of one or both; patients using stimulants to counteract opioid sedation",
    action:"Review clinical context. Not necessarily inappropriate (pain + ADHD) but warrants documentation.",
  },
  {
    id:"high_quantity",
    label:"High Quantity Dispensed",
    color:T.orange,
    threshold:"Single prescription >120 tablets of short-acting opioid",
    significance:"Large quantities facilitate diversion; exceeds most state guideline recommendations",
    action:"Review whether quantity is appropriate for the clinical indication.",
  },
  {
    id:"recent_od",
    label:"Prior Overdose on Record",
    color:T.red,
    threshold:"Naloxone administration or overdose event noted in PDMP or clinical record",
    significance:"Strongest predictor of future overdose — prior OD is independent risk factor",
    action:"Co-prescribe naloxone. Harm reduction counseling. Consider lower dose / shorter duration. Addiction medicine referral.",
  },
  {
    id:"cash_only",
    label:"Cash-Only Payment Pattern",
    color:T.gold,
    threshold:"Multiple controlled substance fills paid cash at multiple pharmacies",
    significance:"May indicate insurance fraud, diversion, or avoiding insurance scrutiny",
    action:"Context-dependent — some patients are legitimately uninsured. Document.",
  },
];

// ── Prescribing reference ─────────────────────────────────────────────────────
const PRESCRIBING_REF = [
  {
    category:"Acute Pain — ED Opioid Prescription",
    color:T.blue,
    items:[
      "CDC 2022: lowest effective dose for shortest duration — typically <=3 days for acute pain",
      "Most states: <=7-day supply for acute non-cancer pain (state laws vary — verify locally)",
      "Prescribe immediate-release formulations only for acute pain — avoid ER/LA opioids in ED",
      "Co-prescribe naloxone for: MME >=50/day, concurrent CNS depressants, history of OUD or SUD",
      "Check PDMP before prescribing — mandatory in most states",
    ],
  },
  {
    category:"Opioid-Tolerant Patients — ED Considerations",
    color:T.purple,
    items:[
      "Continue patient's home opioid regimen — do not withhold due to OUD history if on MOUD",
      "Buprenorphine (Suboxone): do NOT withhold in ED — continue home dose",
      "For acute pain in buprenorphine patients: multimodal analgesia + higher opioid doses needed if adding",
      "Methadone MMT patients: verify daily dose with program — do not prescribe additional methadone",
      "Consider subspecialty consultation (addiction medicine, pain) for complex opioid-tolerant patients",
    ],
  },
  {
    category:"Discharge Opioid Prescribing — High-Risk Scenarios",
    color:T.coral,
    items:[
      "Elderly (>=65): start 25-50% lower dose, shorter duration, monitor fall risk and sedation",
      "Renal impairment: accumulation of active metabolites — hydromorphone preferred over morphine",
      "Hepatic impairment: all opioids metabolized hepatically — reduce dose, extend interval",
      "Pregnancy: opioids may be necessary — brief course, lowest dose; refer to OB",
      "Active SUD (non-opioid): avoid opioids when alternatives adequate; if needed, minimize duration",
    ],
  },
  {
    category:"Pain Assessment Best Practices",
    color:T.teal,
    items:[
      "NRS (0-10): simple, validated for acute pain — document baseline and post-treatment",
      "Functional assessment: Can you walk / work / sleep? is more meaningful than numeric score",
      "FLACC scale (0-10): for non-verbal, pediatric <3yr, or cognitively impaired patients",
      "Pain disproportionate to exam: consider non-analgesic diagnoses (compartment syndrome, ischemia)",
      "Aberrant drug-related behavior: tolerance to pain meds, requesting specific drugs, escalating demands",
    ],
  },
  {
    category:"Non-Opioid First-Line by Condition",
    color:T.green,
    items:[
      "Renal colic: NSAID (ketorolac) + IV fluids — equal to opioids, less emesis",
      "Headache/migraine: IV prochlorperazine + diphenhydramine + ketorolac +/- dexamethasone",
      "Musculoskeletal: NSAID + acetaminophen + muscle relaxant +/- ice/heat",
      "Dental pain: ibuprofen 400 mg + acetaminophen 500 mg — superior to opioids in RCTs",
      "Sickle cell vaso-occlusive: IV ketorolac + IV hydromorphone + sub-dissociative ketamine",
    ],
  },
];

// ── Equianalgesic reference table ─────────────────────────────────────────────
const EQUIANALGESIC = [
  { drug:"Morphine",         oral:30,   iv:10,   unit:"mg" },
  { drug:"Oxycodone",        oral:20,   iv:null, unit:"mg" },
  { drug:"Hydrocodone",      oral:30,   iv:null, unit:"mg" },
  { drug:"Hydromorphone",    oral:7.5,  iv:1.5,  unit:"mg" },
  { drug:"Fentanyl",         oral:null, iv:0.1,  unit:"mg (100 mcg)" },
  { drug:"Codeine",          oral:200,  iv:null, unit:"mg" },
  { drug:"Methadone",        oral:"*",  iv:null, unit:"mg — variable" },
  { drug:"Buprenorphine SL", oral:0.4,  iv:null, unit:"mg" },
];

// ── Frequencies ───────────────────────────────────────────────────────────────
const FREQUENCIES = [
  { label:"q4h (6x/day)",        mult:6  },
  { label:"q6h (4x/day)",        mult:4  },
  { label:"q8h (3x/day)",        mult:3  },
  { label:"q12h (2x/day)",       mult:2  },
  { label:"q24h (1x/day)",       mult:1  },
  { label:"PRN ~3x/day",         mult:3  },
  { label:"PRN ~2x/day",         mult:2  },
  { label:"Single dose",         mult:1  },
  { label:"Per hour (infusion)", mult:24 },
];

// ── Small primitives ──────────────────────────────────────────────────────────
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function Section({ title, icon, accent, open, onToggle, badge, children }) {
  const ac = accent || T.orange;
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"9px 13px",
          background:open
            ? `linear-gradient(135deg,${ac}12,rgba(8,22,40,0.92))`
            : "rgba(8,22,40,0.65)",
          border:`1px solid ${open ? ac+"55" : "rgba(26,53,85,0.4)"}`,
          borderRadius:open ? "10px 10px 0 0" : 10,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:open ? ac : T.txt3, flex:1 }}>{title}</span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, padding:"2px 8px", borderRadius:4,
            background:`${badge.color}18`, border:`1px solid ${badge.color}40`,
            color:badge.color, letterSpacing:1,
            textTransform:"uppercase" }}>{badge.text}</span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:open ? ac : T.txt4, letterSpacing:1, marginLeft:6 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding:"12px 13px",
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${ac}33`,
          borderTop:"none",
          borderRadius:"0 0 10px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── MME Calculator ────────────────────────────────────────────────────────────
function MMECalc() {
  const [entries, setEntries] = useState([
    { id:1, drugId:"morphine_oral", dose:"", frequency:"q6h (4x/day)" }
  ]);
  const [nextId, setNextId] = useState(2);

  const addEntry = () => {
    setEntries(p => [...p, { id:nextId, drugId:"morphine_oral", dose:"", frequency:"q6h (4x/day)" }]);
    setNextId(p => p + 1);
  };

  const updateEntry = useCallback((id, field, val) =>
    setEntries(p => p.map(e => e.id === id ? { ...e, [field]:val } : e)), []);

  const removeEntry = useCallback((id) =>
    setEntries(p => p.filter(e => e.id !== id)), []);

  const totalMME = useMemo(() => {
    return entries.reduce((sum, entry) => {
      const opioid = OPIOIDS.find(o => o.id === entry.drugId);
      const dose   = parseFloat(entry.dose) || 0;
      const freq   = FREQUENCIES.find(f => f.label === entry.frequency);
      if (!opioid || !dose || !freq) return sum;
      return sum + (dose * opioid.mme * freq.mult);
    }, 0);
  }, [entries]);

  const mmeColor = totalMME === 0 ? T.txt4
    : totalMME < 50  ? T.teal
    : totalMME < 90  ? T.gold
    : T.red;

  const mmeRisk = totalMME === 0 ? null
    : totalMME < 50  ? "Low risk threshold"
    : totalMME < 90  ? "Moderate risk — naloxone recommended"
    : "High risk (>=90 MME) — significantly increased overdose mortality";

  return (
    <div>
      {entries.map(entry => {
        const opioid   = OPIOIDS.find(o => o.id === entry.drugId);
        const dose     = parseFloat(entry.dose) || 0;
        const freq     = FREQUENCIES.find(f => f.label === entry.frequency);
        const entryMME = opioid && dose && freq
          ? (dose * opioid.mme * freq.mult).toFixed(1)
          : null;

        return (
          <div key={entry.id} style={{ display:"flex", gap:7, flexWrap:"wrap",
            alignItems:"flex-start", marginBottom:8, padding:"9px 10px",
            borderRadius:9, background:"rgba(14,37,68,0.55)",
            border:"1px solid rgba(42,79,122,0.35)" }}>

            {/* Drug selector */}
            <div style={{ flex:"2 1 200px", minWidth:180 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>Drug</div>
              <div style={{ position:"relative" }}>
                <select value={entry.drugId}
                  onChange={e => updateEntry(entry.id, "drugId", e.target.value)}
                  style={{ width:"100%", padding:"6px 24px 6px 9px",
                    background:"rgba(14,37,68,0.8)",
                    border:"1px solid rgba(42,79,122,0.45)",
                    borderRadius:7, outline:"none",
                    appearance:"none", WebkitAppearance:"none",
                    fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:T.txt, cursor:"pointer" }}>
                  {OPIOIDS.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <span style={{ position:"absolute", right:8, top:"50%",
                  transform:"translateY(-50%)", color:T.txt4,
                  fontSize:9, pointerEvents:"none" }}>▼</span>
              </div>
              {opioid && opioid.note && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                  color:T.gold, marginTop:2, lineHeight:1.4 }}>
                  ⚠ {opioid.note}
                </div>
              )}
            </div>

            {/* Dose */}
            <div style={{ flex:"1 1 90px", minWidth:80 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>
                Dose ({opioid ? (opioid.unit || "mg") : "mg"})
              </div>
              <input type="number" value={entry.dose}
                onChange={e => updateEntry(entry.id, "dose", e.target.value)}
                placeholder="0"
                style={{ width:"100%", padding:"6px 9px",
                  background:"rgba(14,37,68,0.8)",
                  border:`1px solid ${entry.dose ? T.orange+"55" : "rgba(42,79,122,0.4)"}`,
                  borderRadius:7, outline:"none",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:15,
                  fontWeight:700, color:T.orange }} />
            </div>

            {/* Frequency */}
            <div style={{ flex:"1 1 140px", minWidth:130 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>Frequency</div>
              <div style={{ position:"relative" }}>
                <select value={entry.frequency}
                  onChange={e => updateEntry(entry.id, "frequency", e.target.value)}
                  style={{ width:"100%", padding:"6px 24px 6px 9px",
                    background:"rgba(14,37,68,0.8)",
                    border:"1px solid rgba(42,79,122,0.45)",
                    borderRadius:7, outline:"none",
                    appearance:"none", WebkitAppearance:"none",
                    fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:T.txt, cursor:"pointer" }}>
                  {FREQUENCIES.map(f => (
                    <option key={f.label} value={f.label}>{f.label}</option>
                  ))}
                </select>
                <span style={{ position:"absolute", right:8, top:"50%",
                  transform:"translateY(-50%)", color:T.txt4,
                  fontSize:9, pointerEvents:"none" }}>▼</span>
              </div>
            </div>

            {/* Per-entry MME */}
            <div style={{ flexShrink:0, textAlign:"right", minWidth:70 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>MME/day</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:entryMME ? T.orange : T.txt4 }}>
                {entryMME || "—"}
              </div>
            </div>

            {entries.length > 1 && (
              <button onClick={() => removeEntry(entry.id)}
                style={{ flexShrink:0, background:"none", border:"none",
                  color:T.txt4, cursor:"pointer", fontSize:14, padding:"4px",
                  alignSelf:"center" }}>✕</button>
            )}
          </div>
        );
      })}

      <button onClick={addEntry}
        style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
          padding:"6px 14px", borderRadius:7, cursor:"pointer",
          border:"1px solid rgba(42,79,122,0.4)",
          background:"transparent", color:T.txt4, marginBottom:12 }}>
        + Add Opioid
      </button>

      {/* Total */}
      <div style={{ padding:"12px 14px", borderRadius:10,
        background:`${mmeColor}0d`,
        border:`2px solid ${mmeColor}44` }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>
              Total Daily MME
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:36, fontWeight:700, color:mmeColor, lineHeight:1 }}>
              {totalMME > 0 ? totalMME.toFixed(1) : "—"}
            </div>
            {mmeRisk && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:mmeColor, marginTop:4 }}>{mmeRisk}</div>
            )}
          </div>
          {totalMME >= 90 && (
            <div style={{ padding:"8px 12px", borderRadius:8,
              background:"rgba(255,68,68,0.1)",
              border:"1px solid rgba(255,68,68,0.35)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.red, fontWeight:700, marginBottom:3, letterSpacing:1 }}>
                HIGH MME — ACTION REQUIRED
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt3, lineHeight:1.5 }}>
                Co-prescribe naloxone · Discuss overdose risk · Consider pain specialist referral
              </div>
            </div>
          )}
          {totalMME >= 50 && totalMME < 90 && (
            <div style={{ padding:"7px 11px", borderRadius:8,
              background:"rgba(245,200,66,0.08)",
              border:"1px solid rgba(245,200,66,0.3)" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.gold, lineHeight:1.5 }}>
                Consider co-prescribing naloxone · Verify no concurrent CNS depressants
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Opioid rotation calculator ─────────────────────────────────────────────────
function RotationCalc() {
  const [fromDrug, setFromDrug] = useState("morphine_oral");
  const [fromDose, setFromDose] = useState("");
  const [toDrug,   setToDrug]   = useState("hydromorphone_iv");
  const [reduceBy, setReduceBy] = useState(25);

  const fromOpioid = OPIOIDS.find(o => o.id === fromDrug);
  const toOpioid   = OPIOIDS.find(o => o.id === toDrug);

  const result = useMemo(() => {
    const dose = parseFloat(fromDose);
    if (!dose || !fromOpioid || !toOpioid) return null;
    const fromMME    = dose * fromOpioid.mme;
    const reducedMME = fromMME * (1 - reduceBy / 100);
    const toDose     = reducedMME / toOpioid.mme;
    return { fromMME, reducedMME, toDose };
  }, [fromDose, fromOpioid, toOpioid, reduceBy]);

  const selectStyle = {
    width:"100%", padding:"6px 24px 6px 9px",
    background:"rgba(14,37,68,0.8)",
    border:"1px solid rgba(42,79,122,0.4)",
    borderRadius:7, outline:"none",
    appearance:"none", WebkitAppearance:"none",
    fontFamily:"'DM Sans',sans-serif", fontSize:12,
    color:T.txt, cursor:"pointer",
  };

  return (
    <div>
      <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:10,
        background:"rgba(245,200,66,0.07)",
        border:"1px solid rgba(245,200,66,0.25)" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.6 }}>
          Equianalgesic rotation: calculate equivalent dose of a new opioid from current opioid.
          A <strong style={{ color:T.gold }}>25% dose reduction</strong> on rotation is standard to account
          for incomplete cross-tolerance. Titrate from there based on clinical response.
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:10, marginBottom:10 }}>
        {/* From */}
        <div style={{ padding:"9px 11px", borderRadius:9,
          background:"rgba(8,22,40,0.6)",
          border:"1px solid rgba(42,79,122,0.4)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>Converting FROM</div>
          <div style={{ marginBottom:7, position:"relative" }}>
            <select value={fromDrug} onChange={e => setFromDrug(e.target.value)} style={selectStyle}>
              {OPIOIDS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <span style={{ position:"absolute", right:8, top:"50%",
              transform:"translateY(-50%)", color:T.txt4,
              fontSize:9, pointerEvents:"none" }}>▼</span>
          </div>
          <input type="number" value={fromDose}
            onChange={e => setFromDose(e.target.value)}
            placeholder={`Dose in ${fromOpioid ? (fromOpioid.unit || "mg") : "mg"}`}
            style={{ width:"100%", padding:"7px 10px",
              background:"rgba(14,37,68,0.8)",
              border:`1px solid ${fromDose ? T.orange+"55" : "rgba(42,79,122,0.4)"}`,
              borderRadius:7, outline:"none",
              fontFamily:"'JetBrains Mono',monospace", fontSize:16,
              fontWeight:700, color:T.orange }} />
          {result && (
            <div style={{ marginTop:5, fontFamily:"'JetBrains Mono',monospace",
              fontSize:10, color:T.txt4 }}>
              = {result.fromMME.toFixed(1)} MME/dose
            </div>
          )}
        </div>

        {/* To */}
        <div style={{ padding:"9px 11px", borderRadius:9,
          background:"rgba(8,22,40,0.6)",
          border:"1px solid rgba(42,79,122,0.4)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>Converting TO</div>
          <div style={{ marginBottom:7, position:"relative" }}>
            <select value={toDrug} onChange={e => setToDrug(e.target.value)} style={selectStyle}>
              {OPIOIDS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <span style={{ position:"absolute", right:8, top:"50%",
              transform:"translateY(-50%)", color:T.txt4,
              fontSize:9, pointerEvents:"none" }}>▼</span>
          </div>

          <div style={{ marginBottom:5 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1 }}>CROSS-TOLERANCE REDUCTION</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                fontWeight:700, color:T.gold }}>{reduceBy}%</span>
            </div>
            <input type="range" min="0" max="50" step="5"
              value={reduceBy}
              onChange={e => setReduceBy(parseInt(e.target.value))}
              style={{ width:"100%", accentColor:T.gold }} />
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4 }}>0% (equianalgesic)</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4 }}>50% (conservative)</span>
            </div>
          </div>

          {result && (
            <div style={{ padding:"8px 10px", borderRadius:7,
              background:"rgba(0,229,192,0.08)",
              border:"1px solid rgba(0,229,192,0.3)", marginTop:6 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.teal, letterSpacing:1, marginBottom:3 }}>CALCULATED DOSE</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:22, fontWeight:700, color:T.teal, lineHeight:1 }}>
                {result.toDose < 1 ? result.toDose.toFixed(2) : result.toDose.toFixed(1)}{" "}
                {toOpioid ? (toOpioid.unit || "mg") : "mg"}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                color:T.txt4, marginTop:2 }}>
                {result.reducedMME.toFixed(1)} MME after {reduceBy}% reduction
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Equianalgesic reference table */}
      <div style={{ padding:"10px 12px", borderRadius:9,
        background:"rgba(8,22,40,0.6)",
        border:"1px solid rgba(26,53,85,0.4)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Equianalgesic Reference (= 30 mg oral morphine)
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {EQUIANALGESIC.map(e => (
            <div key={e.drug} style={{ padding:"5px 10px", borderRadius:6,
              background:"rgba(42,79,122,0.12)",
              border:"1px solid rgba(42,79,122,0.25)" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                fontWeight:600, color:T.txt3 }}>{e.drug}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.teal }}>
                {e.oral ? `PO: ${e.oral} ${e.unit}` : "No oral"}
                {e.iv ? ` · IV: ${e.iv} ${e.unit}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PDMP analyzer ─────────────────────────────────────────────────────────────
function PDMPAnalyzer() {
  const [flagState, setFlagState] = useState({});

  const toggleFlag = useCallback((id) =>
    setFlagState(p => ({ ...p, [id]:!p[id] })), []);

  const activeFlags = PDMP_FLAGS.filter(f => flagState[f.id]);
  const highRisk    = activeFlags.filter(f => f.color === T.red).length;
  const modRisk     = activeFlags.filter(f => f.color === T.orange || f.color === T.gold).length;

  const riskColor = highRisk >= 2 ? T.red
    : highRisk === 1 || modRisk >= 2 ? T.orange
    : activeFlags.length > 0 ? T.gold
    : T.teal;

  const riskLabel = highRisk >= 2 ? "HIGH RISK — Exercise Extreme Caution"
    : highRisk === 1    ? "Elevated Risk — Document Risk Discussion"
    : modRisk >= 2      ? "Moderate Risk — Additional Caution Warranted"
    : activeFlags.length > 0 ? "Low-Moderate Risk — Document Flags"
    : "No flags marked — complete PDMP review before prescribing";

  return (
    <div>
      <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:10,
        background:`${riskColor}0d`,
        border:`1px solid ${riskColor}35` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          fontWeight:700, color:riskColor, letterSpacing:1, textTransform:"uppercase" }}>
          {riskLabel}
        </div>
        {activeFlags.length > 0 && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:3 }}>
            {activeFlags.length} flag{activeFlags.length > 1 ? "s" : ""} identified
            — document PDMP review, flags found, and clinical rationale for prescribing decision
          </div>
        )}
      </div>

      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
        Check each flag found on PDMP review
      </div>

      {PDMP_FLAGS.map(flag => (
        <div key={flag.id} style={{ marginBottom:6, padding:"8px 10px",
          borderRadius:8,
          background:flagState[flag.id] ? `${flag.color}0d` : "rgba(8,22,40,0.5)",
          border:`1px solid ${flagState[flag.id] ? flag.color+"44" : "rgba(26,53,85,0.3)"}`,
          borderLeft:`3px solid ${flag.color}` }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
            <button onClick={() => toggleFlag(flag.id)}
              style={{ width:20, height:20, borderRadius:4, flexShrink:0, marginTop:1,
                border:`2px solid ${flagState[flag.id] ? flag.color : "rgba(42,79,122,0.5)"}`,
                background:flagState[flag.id] ? flag.color : "transparent",
                cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              {flagState[flag.id] && (
                <span style={{ color:T.bg, fontSize:9, fontWeight:900 }}>✓</span>
              )}
            </button>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:7, flexWrap:"wrap", marginBottom:2 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  fontWeight:600, color:flagState[flag.id] ? flag.color : T.txt }}>
                  {flag.label}
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4 }}>{flag.threshold}</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, lineHeight:1.5 }}>{flag.significance}</div>
              {flagState[flag.id] && (
                <div style={{ marginTop:5, padding:"5px 8px", borderRadius:6,
                  background:`${flag.color}12`,
                  border:`1px solid ${flag.color}28`,
                  fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:flag.color, lineHeight:1.5 }}>
                  {flag.action}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function PainHub({ embedded = false, demo, vitals, medications, allergies, pmhSelected, cc }) {
  const navigate = useNavigate();

  const [sMME,      setSMME]      = useState(true);
  const [sRot,      setSRot]      = useState(false);
  const [sAdj,      setSAdj]      = useState(false);
  const [sPDMP,     setSPDMP]     = useState(false);
  const [sRef,      setSRef]      = useState(false);
  const [adjSearch, setAdjSearch] = useState("");

  const filteredAdj = useMemo(() => {
    const q = adjSearch.toLowerCase();
    if (!q) return ADJUNCTS;
    return ADJUNCTS.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.indication.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [adjSearch]);

  const age       = parseInt(demo && demo.age) || 0;
  const isElderly = age >= 65;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {/* ── Standalone header ─────────────────────────────────────────────── */}
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>PAIN</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,159,67,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Pain Management Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              MME Calculator · Opioid Rotation · Non-Opioid Adjuncts · PDMP Red Flags · Prescribing Reference
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.orange }}>
              Pain Management
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(255,159,67,0.1)",
              border:"1px solid rgba(255,159,67,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              MME · Rotation · Adjuncts
            </span>
            {isElderly && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.gold, letterSpacing:1, textTransform:"uppercase",
                background:"rgba(245,200,66,0.1)",
                border:"1px solid rgba(245,200,66,0.35)",
                borderRadius:4, padding:"2px 8px" }}>
                {"⚠ AGE \u226565 — Beers Criteria Active"}
              </span>
            )}
          </div>
        )}

        {/* ── Elderly alert ──────────────────────────────────────────────────── */}
        {isElderly && (
          <div style={{ padding:"9px 13px", borderRadius:9, marginBottom:10,
            background:"rgba(245,200,66,0.08)",
            border:"1px solid rgba(245,200,66,0.35)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.gold, lineHeight:1.6 }}>
              <strong>Geriatric pain considerations ({demo.age}yo):</strong>{" "}
              Start opioids at 25-50% of standard dose. Meperidine contraindicated.
              Benzodiazepines + opioids: very high fall and respiratory depression risk.
              Prefer acetaminophen and topical NSAIDs for first-line.
            </div>
          </div>
        )}

        {/* ── 1. MME Calculator ─────────────────────────────────────────────── */}
        <Section title="MME Calculator" icon="🧮" accent={T.orange}
          open={sMME} onToggle={() => setSMME(p => !p)}>
          <MMECalc />
        </Section>

        {/* ── 2. Opioid Rotation ────────────────────────────────────────────── */}
        <Section title="Opioid Rotation / Equianalgesic Conversion" icon="🔄" accent={T.purple}
          open={sRot} onToggle={() => setSRot(p => !p)}>
          <RotationCalc />
        </Section>

        {/* ── 3. Non-Opioid Adjuncts ────────────────────────────────────────── */}
        <Section title="Non-Opioid Adjunct Protocols" icon="💊" accent={T.teal}
          open={sAdj} onToggle={() => setSAdj(p => !p)}
          badge={{ text:`${ADJUNCTS.length} agents`, color:T.teal }}>
          <input type="text" value={adjSearch}
            onChange={e => setAdjSearch(e.target.value)}
            placeholder="Search by drug, indication, or category..."
            style={{ width:"100%", padding:"7px 12px", marginBottom:10,
              background:"rgba(14,37,68,0.8)",
              border:`1px solid ${adjSearch ? T.teal+"44" : "rgba(42,79,122,0.35)"}`,
              borderRadius:20, outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          {filteredAdj.map(adj => (
            <div key={adj.name} style={{ padding:"10px 12px", borderRadius:9,
              marginBottom:7,
              background:`${adj.color}08`,
              border:`1px solid ${adj.color}28`,
              borderLeft:`4px solid ${adj.color}` }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:8, flexWrap:"wrap", marginBottom:5 }}>
                <span style={{ fontFamily:"'Playfair Display',serif",
                  fontWeight:700, fontSize:13, color:adj.color }}>{adj.name}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:adj.color, letterSpacing:1, textTransform:"uppercase",
                  background:`${adj.color}14`, border:`1px solid ${adj.color}33`,
                  borderRadius:4, padding:"1px 7px" }}>{adj.category}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.green, letterSpacing:0.5 }}>{adj.mmeSparing}</span>
              </div>
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
                gap:7, marginBottom:6 }}>
                {[
                  { label:"Dose",      val:adj.dose      },
                  { label:"Max Daily", val:adj.maxDaily   },
                  { label:"Indication",val:adj.indication },
                  { label:"Mechanism", val:adj.mechanism  },
                ].map(f => (
                  <div key={f.label}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.txt4, letterSpacing:1,
                      textTransform:"uppercase" }}>{f.label}: </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:11, color:T.txt3 }}>{f.val}</span>
                  </div>
                ))}
              </div>
              {adj.notes && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.txt4, lineHeight:1.55, marginBottom:adj.contraindications ? 4 : 0 }}>
                  {adj.notes}
                </div>
              )}
              {adj.contraindications && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.coral, lineHeight:1.5 }}>
                  <strong>Contraindications:</strong> {adj.contraindications}
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* ── 4. PDMP Red Flags ─────────────────────────────────────────────── */}
        <Section title="PDMP Red Flag Recognizer" icon="🚩" accent={T.red}
          open={sPDMP} onToggle={() => setSPDMP(p => !p)}>
          <PDMPAnalyzer />
        </Section>

        {/* ── 5. Prescribing Reference ──────────────────────────────────────── */}
        <Section title="ED Prescribing Reference" icon="📋" accent={T.blue}
          open={sRef} onToggle={() => setSRef(p => !p)}>
          {PRESCRIBING_REF.map((cat, i) => (
            <div key={i} style={{ padding:"10px 12px", borderRadius:9,
              marginBottom:8,
              background:`${cat.color}09`,
              border:`1px solid ${cat.color}28`,
              borderLeft:`4px solid ${cat.color}` }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:cat.color, marginBottom:7 }}>
                {cat.category}
              </div>
              {cat.items.map((item, j) => (
                <Bullet key={j} text={item} color={cat.color} />
              ))}
            </div>
          ))}
        </Section>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA PAIN HUB · CDC 2022 OPIOID PRESCRIBING GUIDELINES · FDA MME CONVERSION FACTORS · VERIFY LOCAL STATE PDMP REQUIREMENTS
          </div>
        )}
      </div>
    </div>
  );
}