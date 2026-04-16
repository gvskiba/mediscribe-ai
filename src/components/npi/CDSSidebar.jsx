// CDSSidebar.jsx — P2: Passive Clinical Decision Support Sidebar
//
// Evidence basis: Five Rights CDS framework (right info, right person,
// right format, right channel, right time). Banner Health / AHRQ literature:
// 90% alert override rates when alerts are non-specific and interruptive.
// This component is non-interruptive, non-blocking, and dismissable.
//
// 7 deterministic flag rules — no API calls, pure encounter state logic:
//   1. qSOFA >= 2        → SepsisHub
//   2. Possible PE       → Wells PE / ScoreHub
//   3. Beers medication  → SmartDischargeHub (age > 65)
//   4. Drug-allergy      → ERxHub
//   5. High-risk syncope → SyncopeHub
//   6. Troponin elevated → ECGHub + HEART Score
//   7. Sepsis bundle gap → Sepsis section
//
// Design:
//   - Renders as a compact top rail within the encounter content area
//   - Max 4 simultaneous flags (highest priority shown)
//   - Each flag individually dismissable (session memory, no localStorage)
//   - Collapsed state shows only a slim pill with count
//   - No modals, no blocking, no required actions
//
// Props:
//   vitals, cc, demo, pmhSelected, medications, allergies
//   rosState, mdmState, sepsisBundle, esiLevel
//   labsText     string  — optional free-text labs for troponin detection
//   onSelectSection fn(section) — navigate within encounter
//   onNavigate  fn(path)        — navigate to hub page
//
// Wiring in NewPatientInput.jsx renderContent():
//   import CDSSidebar from "@/components/npi/CDSSidebar";
//
//   // At top of the content wrapper div, before {renderSection()}:
//   <CDSSidebar
//     vitals={vitals} cc={cc} demo={demo}
//     pmhSelected={pmhSelected} medications={medications}
//     allergies={allergies} rosState={rosState}
//     mdmState={mdmState} sepsisBundle={sepsisBundle}
//     esiLevel={esiLevel} labsText={labsText}
//     onSelectSection={selectSection}
//     onNavigate={navigate} />
//
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo } from "react";

const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Session-scope dismissed flag IDs (no localStorage) ───────────────────────
const dismissed = new Set();

// ── Beers 2023 — ED-relevant medications to flag in patients > 65 ─────────────
// Condensed to the most actionable ED medications from the full Beers Criteria.
const BEERS_PATTERNS = [
  // Anticholinergic antihistamines
  { pattern:/diphenhydramine|benadryl/i,    label:"Diphenhydramine",    risk:"Anticholinergic — confusion, falls, urinary retention in elderly" },
  { pattern:/hydroxyzine|vistaril|atarax/i, label:"Hydroxyzine",        risk:"Anticholinergic — sedation and confusion risk" },
  { pattern:/meclizine|antivert/i,          label:"Meclizine",          risk:"Anticholinergic — avoid in elderly vertigo" },
  { pattern:/promethazine|phenergan/i,      label:"Promethazine",       risk:"Anticholinergic — extrapyramidal and sedation risk" },
  // Benzodiazepines
  { pattern:/lorazepam|ativan/i,            label:"Lorazepam",          risk:"BZD — increased fall, fracture, and delirium risk in elderly" },
  { pattern:/diazepam|valium/i,             label:"Diazepam",           risk:"BZD — long half-life, accumulation, fall risk" },
  { pattern:/alprazolam|xanax/i,            label:"Alprazolam",         risk:"BZD — falls, dependence risk in elderly" },
  { pattern:/clonazepam|klonopin/i,         label:"Clonazepam",         risk:"BZD — fall and fracture risk" },
  { pattern:/temazepam|restoril/i,          label:"Temazepam",          risk:"BZD sedative — avoid in elderly insomnia" },
  // Sleep medications
  { pattern:/zolpidem|ambien/i,             label:"Zolpidem",           risk:"Z-drug — fall and fracture risk in elderly" },
  { pattern:/eszopiclone|lunesta/i,         label:"Eszopiclone",        risk:"Z-drug — fall and cognitive risk" },
  { pattern:/zaleplon|sonata/i,             label:"Zaleplon",           risk:"Z-drug — avoid in elderly" },
  // Muscle relaxants
  { pattern:/cyclobenzaprine|flexeril/i,    label:"Cyclobenzaprine",    risk:"Muscle relaxant — anticholinergic, sedation, fall risk" },
  { pattern:/carisoprodol|soma/i,           label:"Carisoprodol",       risk:"Muscle relaxant — avoid in elderly" },
  { pattern:/methocarbamol|robaxin/i,       label:"Methocarbamol",      risk:"Muscle relaxant — sedation, fall risk in elderly" },
  // Sulfonylureas (hypoglycemia risk)
  { pattern:/glipizide|glucotrol/i,         label:"Glipizide",          risk:"Sulfonylurea — prolonged hypoglycemia risk in elderly" },
  { pattern:/glyburide|diabeta|glynase/i,   label:"Glyburide",          risk:"Sulfonylurea — highest hypoglycemia risk in class" },
  { pattern:/glimepiride|amaryl/i,          label:"Glimepiride",        risk:"Sulfonylurea — hypoglycemia risk" },
  // NSAIDs
  { pattern:/ibuprofen|advil|motrin/i,      label:"Ibuprofen",          risk:"NSAID — GI bleed, renal failure, fluid retention in elderly" },
  { pattern:/naproxen|aleve|naprosyn/i,     label:"Naproxen",           risk:"NSAID — GI bleed and renal risk in elderly" },
  { pattern:/meloxicam|mobic/i,             label:"Meloxicam",          risk:"NSAID — renal and GI risk in elderly" },
  { pattern:/ketorolac|toradol/i,           label:"Ketorolac",          risk:"NSAID — GI bleed risk, avoid >5 days and in renal impairment" },
  { pattern:/indomethacin|indocin/i,        label:"Indomethacin",       risk:"NSAID — highest CNS adverse effect risk in class" },
  // Tricyclic antidepressants
  { pattern:/amitriptyline|elavil/i,        label:"Amitriptyline",      risk:"TCA — highly anticholinergic, QTc prolongation, fall risk" },
  { pattern:/nortriptyline|pamelor/i,       label:"Nortriptyline",      risk:"TCA — anticholinergic, sedation, fall risk" },
  { pattern:/doxepin|sinequan/i,            label:"Doxepin > 6mg",      risk:"TCA/antihistamine — anticholinergic sedation at higher doses" },
  // Antipsychotics
  { pattern:/haloperidol|haldol/i,          label:"Haloperidol",        risk:"Antipsychotic — EPS, QTc, falls — use caution in elderly" },
  { pattern:/quetiapine|seroquel/i,         label:"Quetiapine",         risk:"Antipsychotic — sedation, falls, metabolic risk" },
  { pattern:/olanzapine|zyprexa/i,          label:"Olanzapine",         risk:"Antipsychotic — metabolic risk, sedation in elderly" },
  // Opioids
  { pattern:/meperidine|demerol/i,          label:"Meperidine",         risk:"Opioid — neurotoxic metabolite (normeperidine), seizure risk in elderly" },
  // Digoxin
  { pattern:/digoxin|lanoxin/i,             label:"Digoxin",            risk:"Cardiac glycoside — toxicity risk with renal impairment in elderly" },
  // Anticholinergic bladder
  { pattern:/oxybutynin|ditropan/i,         label:"Oxybutynin",         risk:"Anticholinergic — confusion, dry mouth, urinary retention" },
  { pattern:/tolterodine|detrol/i,          label:"Tolterodine",        risk:"Anticholinergic bladder — confusion risk in elderly" },
];

// ── Drug-allergy cross-reference ──────────────────────────────────────────────
// Check if any medication name overlaps with any documented allergy.
function checkDrugAllergy(medications, allergies) {
  const meds = (medications || [])
    .map(m => (typeof m === "string" ? m : m.name || "").toLowerCase())
    .filter(Boolean);
  const algs = (allergies || [])
    .map(a => (typeof a === "string" ? a : a.name || a.allergen || "").toLowerCase())
    .filter(Boolean);

  // Cross-class allergy checking
  const CROSS_CLASS = [
    { words:["penicillin","amoxicillin","ampicillin","piperacillin","oxacillin"],  label:"penicillin-class" },
    { words:["cephalosporin","cefazolin","cephalexin","ceftriaxone","cefepime","cefdinir"], label:"cephalosporin-class" },
    { words:["sulfa","sulfamethoxazole","trimethoprim-sulfamethoxazole","bactrim","septra"], label:"sulfa" },
    { words:["fluoroquinolone","ciprofloxacin","levofloxacin","moxifloxacin"],     label:"fluoroquinolone-class" },
    { words:["nsaid","ibuprofen","naproxen","ketorolac","meloxicam","aspirin"],   label:"NSAID" },
    { words:["codeine","morphine","oxycodone","hydrocodone","fentanyl","tramadol","hydromorphone"], label:"opioid-class" },
  ];

  const hits = [];

  // Direct name overlap
  meds.forEach(med => {
    algs.forEach(alg => {
      if (alg.length > 3 && (med.includes(alg) || alg.includes(med))) {
        hits.push({ med, allergy:alg, type:"direct" });
      }
    });
  });

  // Cross-class check
  CROSS_CLASS.forEach(cls => {
    const allergyMatch = algs.some(a =>
      cls.words.some(w => a.includes(w))
    );
    if (!allergyMatch) return;
    const medMatch = meds.find(m =>
      cls.words.some(w => m.includes(w))
    );
    if (medMatch && !hits.find(h => h.med === medMatch)) {
      hits.push({ med:medMatch, allergy:`${cls.label} allergy documented`, type:"class" });
    }
  });

  return hits.slice(0, 3);
}

// ── Compute all flags from encounter state ────────────────────────────────────
function computeFlags(props) {
  const {
    vitals, cc, demo, pmhSelected, medications,
    allergies, rosState, mdmState, sepsisBundle,
    esiLevel, labsText,
  } = props;

  const flags = [];
  const ccTxt = (cc?.text || "").toLowerCase();
  const pmh   = (Array.isArray(pmhSelected) ? pmhSelected : []).map(p => (typeof p === "string" ? p : p.label || p.name || "").toLowerCase()).filter(Boolean);
  const meds  = (medications || [])
    .map(m => (typeof m === "string" ? m : m.name || "").toLowerCase())
    .filter(Boolean);
  const age   = parseInt(demo?.age || "0") || 0;

  const hr    = parseFloat(vitals?.hr   || 0);
  const sbp   = parseFloat((vitals?.bp  || "").split("/")[0]) || 0;
  const rr    = parseFloat(vitals?.rr   || 0);
  const spo2  = parseFloat(vitals?.spo2 || 0);

  // ── FLAG 1: qSOFA >= 2 ─────────────────────────────────────────────────
  const qRR  = rr  > 0 && rr  >= 22;
  const qBP  = sbp > 0 && sbp <= 100;
  const qAMS = pmh.some(p => /alter|confus|lethargy/i.test(p)) ||
    Object.values(rosState || {}).some(sys =>
      (Array.isArray(sys?.positive) && sys.positive.some(s =>
        /confus|alter|lethargy|encephal/.test(s.toLowerCase())
      ))
    );
  const qScore = (qRR ? 1 : 0) + (qBP ? 1 : 0) + (qAMS ? 1 : 0);
  if (qScore >= 2) {
    flags.push({
      id:"qsofa",
      priority:1,
      icon:"🦠",
      color:T.coral,
      title:"qSOFA \u2265 2",
      detail:`RR${qRR?" \u2713":""} BP${qBP?" \u2713":""} AMS${qAMS?" \u2713":""}  — sepsis screening positive`,
      action:"Open SepsisHub",
      onAct:p => p.onNavigate && p.onNavigate("/SepsisHub"),
    });
  }

  // ── FLAG 2: Possible PE ────────────────────────────────────────────────
  const isDyspnea   = /sob|dyspnea|breath|pleuritic|hypox/i.test(ccTxt);
  const isTachy     = hr > 100;
  const hasDvtHx    = pmh.some(p => /dvt|pe|pulmonary embolism|deep vein/i.test(p));
  const hasImmob    = pmh.some(p => /immobil|bed rest|paralysis|surgery|hip|knee/i.test(p)) ||
    /immobil|bed rest|long flight|long drive/.test(ccTxt);
  const hasCancer   = pmh.some(p => /cancer|malignancy|oncology/i.test(p));
  const wellsPE     = (isDyspnea ? 1 : 0) + (isTachy ? 1 : 0) +
    (hasDvtHx ? 3 : 0) + (hasImmob ? 1 : 0) + (hasCancer ? 1 : 0);
  if (isDyspnea && wellsPE >= 3) {
    flags.push({
      id:"pe_risk",
      priority:2,
      icon:"🫁",
      color:T.orange,
      title:"Possible PE",
      detail:`Wells PE ${wellsPE} — consider PERC rule and d-dimer`,
      action:"Wells PE Score",
      onAct:p => p.onNavigate && p.onNavigate("/ScoreHub"),
    });
  }

  // ── FLAG 3: Beers medication + age > 65 ───────────────────────────────
  if (age > 65 && meds.length > 0) {
    const beersHits = BEERS_PATTERNS.filter(b =>
      meds.some(m => b.pattern.test(m))
    );
    if (beersHits.length > 0) {
      const topHit = beersHits[0];
      const extra  = beersHits.length > 1
        ? ` (+${beersHits.length - 1} more)` : "";
      flags.push({
        id:"beers",
        priority:3,
        icon:"\uD83D\uDC8A",
        color:T.gold,
        title:`Beers Medication (${age}yo)`,
        detail:`${topHit.label}${extra} — ${topHit.risk}`,
        action:"Medication Review",
        onAct:p => p.onSelectSection && p.onSelectSection("discharge"),
      });
    }
  }

  // ── FLAG 4: Drug-allergy conflict ─────────────────────────────────────
  const allergyHits = checkDrugAllergy(medications, allergies);
  if (allergyHits.length > 0) {
    const h = allergyHits[0];
    flags.push({
      id:"drug_allergy",
      priority:1,
      icon:"\u26A0\uFE0F",
      color:T.red,
      title:"Drug-Allergy Conflict",
      detail:`${h.med} \u2014 ${h.allergy} (${h.type} match)`,
      action:"Review in ERxHub",
      onAct:p => p.onNavigate && p.onNavigate("/ERx"),
    });
  }

  // ── FLAG 5: High-risk syncope ─────────────────────────────────────────
  const isSyncope = /syncope|faint|pass out|loss of conscious/i.test(ccTxt);
  if (isSyncope) {
    const highRiskFeatures = [
      age > 50,
      pmh.some(p => /cardiac|heart failure|chf|cad|cardiomyopathy/i.test(p)),
      pmh.some(p => /arrhythmia|afib|vtach|vfib|heart block/i.test(p)),
      sbp < 90 && sbp > 0,
      hr > 120 || (hr > 0 && hr < 40),
      pmh.some(p => /structural heart/i.test(p)),
      /exertion|exercise|chest pain/.test(ccTxt),
    ].filter(Boolean).length;

    if (highRiskFeatures >= 2) {
      flags.push({
        id:"syncope_risk",
        priority:2,
        icon:"\uD83D\uDE35",
        color:T.purple,
        title:"High-Risk Syncope",
        detail:`${highRiskFeatures} high-risk features — ROSE rule and CSRS indicated`,
        action:"Open SyncopeHub",
        onAct:p => p.onNavigate && p.onNavigate("/SyncopeHub"),
      });
    }
  }

  // ── FLAG 6: Possible elevated troponin (text-based detection) ─────────
  const labsStr = [
    labsText || "",
    mdmState?.narrative || mdmState?.text || "",
  ].join(" ").toLowerCase();
  const tropPattern = /troponin[^a-z]*(?:elevated|high|positive|raised|>|above)|elevated troponin|troponin[\s\S]{0,20}(elevated|positive|raised|\d+\.\d+\s*(?:ng|ug|mcg|iu|u\/l|nmol))/i;
  if (tropPattern.test(labsStr) || /trop(?:onin)?\s*[+>]/.test(labsStr)) {
    flags.push({
      id:"troponin",
      priority:2,
      icon:"\uD83D\uDC93",
      color:T.blue,
      title:"Troponin Elevated",
      detail:"Consider HEART score — risk stratify before disposition",
      action:"HEART Score + ECGHub",
      onAct:p => p.onNavigate && p.onNavigate("/ECGHub"),
    });
  }

  // ── FLAG 7: Sepsis bundle gap ─────────────────────────────────────────
  // Only show if qSOFA >= 2 flag not already showing (avoid duplication)
  // and sepsis bundle has been partially started but is incomplete
  const bundle = sepsisBundle || {};
  const bundleKeys = [
    "lactateOrdered","culturesOrdered","abxOrdered","fluidsGiven",
  ];
  const bundleStarted  = bundleKeys.some(k => bundle[k]);
  const bundleComplete = bundleKeys.every(k => bundle[k]);
  const hasSepcSuspect = qScore >= 1 || /sepsis|infect|fever|bacteremia/.test(ccTxt);

  if (bundleStarted && !bundleComplete && hasSepcSuspect && qScore < 2) {
    const missing = bundleKeys
      .filter(k => !bundle[k])
      .map(k => k.replace(/([A-Z])/g, " $1").toLowerCase().replace("ordered",""))
      .join(", ");
    flags.push({
      id:"bundle_gap",
      priority:3,
      icon:"\u2705",
      color:T.teal,
      title:"Sepsis Bundle Incomplete",
      detail:`Pending: ${missing.trim()}`,
      action:"Open Sepsis Section",
      onAct:p => p.onSelectSection && p.onSelectSection("sepsis"),
    });
  }

  // Sort by priority, limit to 4
  return flags
    .filter(f => !dismissed.has(f.id))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);
}

// ── Flag card ─────────────────────────────────────────────────────────────────
function FlagCard({ flag, onDismiss, onAct }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9,
      padding:"7px 10px", borderRadius:8,
      background:`${flag.color}09`,
      border:`1px solid ${flag.color}30`,
      borderLeft:`3px solid ${flag.color}`,
      transition:"all .15s" }}>

      <span style={{ fontSize:15, flexShrink:0 }}>{flag.icon}</span>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
          fontSize:11.5, color:flag.color,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {flag.title}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginTop:1, lineHeight:1.4,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {flag.detail}
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
        <button onClick={onAct}
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            letterSpacing:0.8, padding:"3px 9px", borderRadius:5,
            cursor:"pointer", transition:"all .12s",
            border:`1px solid ${flag.color}55`,
            background:`${flag.color}0f`, color:flag.color,
            whiteSpace:"nowrap" }}>
          {flag.action} \u2192
        </button>
        <button onClick={onDismiss}
          title="Dismiss for this session"
          style={{ width:18, height:18, borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.4)",
            background:"transparent", color:T.txt4,
            fontSize:9, flexShrink:0, lineHeight:1 }}>
          \u00d7
        </button>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function CDSSidebar(props) {
  const {
    vitals, cc, demo, pmhSelected, medications,
    allergies, rosState, mdmState, sepsisBundle,
    esiLevel, labsText,
    onSelectSection, onNavigate,
  } = props;

  // Force re-render on dismiss
  const [dismissCount, setDismissCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const flags = useMemo(() => computeFlags({
    vitals, cc, demo, pmhSelected, medications,
    allergies, rosState, mdmState, sepsisBundle,
    esiLevel, labsText,
  }), [vitals, cc, demo, pmhSelected, medications,
       allergies, rosState, mdmState, sepsisBundle,
       esiLevel, labsText,
       dismissCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = (id) => {
    dismissed.add(id);
    setDismissCount(p => p + 1);
  };

  const handleDismissAll = () => {
    flags.forEach(f => dismissed.add(f.id));
    setDismissCount(p => p + 1);
  };

  // Nothing to show
  if (flags.length === 0) return null;

  // Collapsed pill
  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        style={{ display:"inline-flex", alignItems:"center", gap:6,
          marginBottom:8, padding:"4px 12px", borderRadius:20,
          cursor:"pointer", transition:"all .15s",
          border:"1px solid rgba(255,107,107,0.4)",
          background:"rgba(255,107,107,0.08)", color:T.coral }}>
        <span style={{ fontSize:12 }}>\uD83D\uDEA8</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          letterSpacing:1.5, textTransform:"uppercase" }}>
          {flags.length} CDS flag{flags.length !== 1 ? "s" : ""}
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:8, color:T.txt4 }}>\u25bc</span>
      </button>
    );
  }

  // Expanded panel
  return (
    <div style={{ marginBottom:12, borderRadius:10,
      background:"rgba(8,18,40,0.7)",
      border:"1px solid rgba(42,79,122,0.35)",
      overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between",
        padding:"7px 11px",
        borderBottom:"1px solid rgba(26,53,85,0.4)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.coral, letterSpacing:1.5, textTransform:"uppercase" }}>
            \uD83D\uDEA8 CDS Flags
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            padding:"1px 7px", borderRadius:10,
            background:"rgba(255,107,107,0.1)",
            border:"1px solid rgba(255,107,107,0.3)",
            color:T.coral }}>
            {flags.length}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
            color:T.txt4 }}>Non-interruptive \u00b7 advisory only</span>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <button onClick={handleDismissAll}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              letterSpacing:1, padding:"2px 8px", borderRadius:4,
              cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.35)",
              background:"transparent", color:T.txt4 }}>
            Dismiss All
          </button>
          <button onClick={() => setCollapsed(true)}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              letterSpacing:1, padding:"2px 8px", borderRadius:4,
              cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.35)",
              background:"transparent", color:T.txt4 }}>
            \u25b2 Collapse
          </button>
        </div>
      </div>

      {/* Flag list */}
      <div style={{ display:"flex", flexDirection:"column", gap:5,
        padding:"8px 10px" }}>
        {flags.map(flag => (
          <FlagCard key={flag.id} flag={flag}
            onDismiss={() => handleDismiss(flag.id)}
            onAct={() => flag.onAct({ onSelectSection, onNavigate })} />
        ))}
      </div>

      {/* Footer hint */}
      <div style={{ padding:"4px 11px 7px",
        fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:T.txt4, letterSpacing:1 }}>
        Flags auto-clear when dismissed. Physician judgment always prevails.
      </div>
    </div>
  );
}