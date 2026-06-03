// ─────────────────────────────────────────────────────────────────────────────
// hubRegistry.js — single source of truth for the Lakonyx hub catalog
//
// Reconciled from HubSelectorPage.jsx + HubIndex.jsx, then VERIFIED against
// App.jsx routes. The launcher shells (HubTakeover, no-patient surface) consume
// this instead of each keeping a diverging copy.
//
// VERIFICATION PASS (against App.jsx):
//  • Confirmed live + dropped dead routes (a 404 in the catalog is worse than a
//    missing card). `live:false` = real catalog entry whose route is NOT mounted
//    in App.jsx — kept as a roadmap/greyed card, not deleted, with a note.
//  • DELETED entirely (dead route + fully superseded, nothing to preserve):
//      - neuro (/StrokeAssessment)  → dead; StrokeAssessment.jsx is mounted at
//        /stroke-hub. Collapsed to the single "Stroke" card.
//      - sepsis (/sepsis-hub) + sepsis-bundle (/SepsisBundleTracker) → both dead;
//        the live /SepsisHub is already the merged Pathway+ABX+SEP-1 hub.
//      - procedures (/Procedures) → dead; /procedure-hub is the real one.
//      - labs-imaging (/LabsImaging) → dead + superseded by LabHub/Imaging/Results.
//      - preferences (/UserPreferences) → app-chrome, belongs on the header gear,
//        not the clinical launcher. (Aside: HSP sidebar's /AppSettings is a DEAD
//        link — the real route is /UserPreferences.)
//  • Color variants derived from one `color` hex via palette() — anti-drift.
//  • Workflow category retained from HubIndex.
//  • suggestHubs stub still awaiting ClinicalDecisionHub.jsx.
// ─────────────────────────────────────────────────────────────────────────────

// ── color helper: one hex → full variant set ────────────────────────────────
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const lighten = (hex, amt = 0.4) => {
  const [r, g, b] = hexToRgb(hex);
  const L = (v) => Math.round(v + (255 - v) * amt);
  return `#${[L(r), L(g), L(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
const palette = (hex) => ({
  color: hex, glow: rgba(hex, 0.4), glass: rgba(hex, 0.07),
  border: rgba(hex, 0.28), accent: lighten(hex, 0.4),
});

// ── canonical hub catalog ────────────────────────────────────────────────────
export const HUBS = [
  // ── CRITICAL CARE ──────────────────────────────────────────────────────────
  { id: "cardiac", route: "/cardiac-hub", icon: "🫀", abbr: "CARD", title: "Cardiac", subtitle: "ACS · ECG · Chest Pain · Tachycardia · Bradycardia · PALS · OB Arrest", category: "Critical Care", ...palette("#ff6b6b"), stats: ["8 Protocols", "2025 ACC/AHA", "ECG · HEART · TNK"], badge: "2025 ACC/AHA", priority: 1, essential: true, live: true },
  { id: "critical-protocols", route: "/CriticalProtocolsPage", icon: "⚡", abbr: "CRIT PROTO", title: "Critical Protocols", subtitle: "Sepsis · Anaphylaxis · DKA · Hyperkalemia · Thyroid Storm · PE · ADHF · Meningitis", category: "Critical Care", ...palette("#f43f5e"), stats: ["14 Protocols", "ACEP/SSC Aligned", "Evidence-Based"], badge: "ACEP/SSC", priority: 0.8, essential: true, live: true },
  { id: "stroke", route: "/stroke-hub", icon: "🧠", abbr: "STROKE", title: "Stroke", subtitle: "Stroke Protocols · tPA · Thrombectomy · NIHSS · Post-Stroke Care", category: "Critical Care", ...palette("#9b6dff"), stats: ["tPA Protocol", "Thrombectomy", "NIHSS"], badge: "AHA 2023", priority: 2, essential: true, live: true, note: "Was two cards (Neuro /StrokeAssessment + Stroke /stroke-hub). /StrokeAssessment is a dead route; StrokeAssessment.jsx mounts at /stroke-hub. Collapsed." },
  { id: "resus", route: "/resus-hub", icon: "💓", abbr: "RESUS", title: "Resuscitation", subtitle: "ACLS Algorithms · Resus Meds · Defib · Airway · 5H5T · Post-ROSC", category: "Critical Care", ...palette("#ff4444"), stats: ["4 ACLS Algorithms", "10 Resus Meds", "5H5T Guide"], badge: "Live", priority: 24, essential: true, live: true },
  { id: "shock", route: "/shock-hub", icon: "🚨", abbr: "SHOCK", title: "Shock", subtitle: "Classification · Septic · Cardiogenic · Hypovolemic · Lactate-directed", category: "Critical Care", ...palette("#ff6b6b"), stats: ["5 Shock Types", "Management Protocol", "Monitoring"], badge: "Live", priority: 21, essential: true, live: true },
  { id: "sepsis", route: "/SepsisHub", icon: "🦠", abbr: "SEPSIS", title: "Sepsis", subtitle: "Sepsis-3 · qSOFA · Hour-1 Bundle · SEP-1 Tracker · Source-Based ABX", category: "Critical Care", ...palette("#f5c842"), stats: ["Sepsis-3 · qSOFA", "SEP-1 Tracker", "Source-Based ABX"], badge: "SSC 2021 · CMS SEP-1", priority: 12, essential: false, live: true, note: "Merged hub. Absorbed the dead /sepsis-hub and /SepsisBundleTracker routes — SepsisHub.jsx already tabs Pathway/ABX/SEP-1." },
  { id: "trauma", route: "/trauma-hub", icon: "🩹", abbr: "TRAUMA", title: "Trauma", subtitle: "ATLS · Primary Survey · Haemorrhage Control", category: "Critical Care", ...palette("#ff9f43"), stats: ["ATLS Protocol", "Damage Control", "Transfusion"], badge: "ATLS 11th Ed", priority: 3, essential: true, live: true },
  { id: "critical-drip", route: "/CriticalCareDripHub", icon: "💧", abbr: "DRIP HUB", title: "Critical Care Drip", subtitle: "Vasopressor Titration · Shock Classification · Drip Rates · Titration Sheets", category: "Critical Care", ...palette("#ff6060"), stats: ["Vasopressors", "Shock Types", "Titration Sheets"], badge: "ICU Tools", priority: 24.5, essential: false, live: true },
  { id: "antidote", route: "/antidote-hub", icon: "🧬", abbr: "ANTIDOTE", title: "Antidote", subtitle: "Antidote Reference · NOAC Reversal · Toxidromes · Dosing · Monitoring", category: "Critical Care", ...palette("#3dffa0"), stats: ["12 Antidotes", "NOAC Reversal", "7 Toxidromes"], badge: "Live", priority: 25, essential: false, live: true },
  { id: "electrolyte-acidbase", route: "/ElectrolyteAcidBaseHub", icon: "⚗️", abbr: "LYTES/ABG", title: "Electrolyte & Acid-Base", subtitle: "ABG/VBG · Osmolar Gaps · K/Na/Ca/Mg/Phos · SIADH vs CSW · QTc · Tumor Lysis", category: "Critical Care", ...palette("#00bcd4"), stats: ["ABG/VBG Interpreter", "Hyperkalemia Cascade", "SIADH vs CSW"], badge: "Live", priority: 24.2, essential: false, live: true },
  { id: "tox", route: "/tox-hub", icon: "☠️", abbr: "TOX", title: "Toxicology", subtitle: "Overdose · Antidotes · Toxidromes", category: "Critical Care", ...palette("#3dffa0"), stats: ["Toxidromes", "Antidotes", "Poison Control"], badge: "Clinical Tools", priority: 13, essential: false, live: true },

  // ── CHIEF COMPLAINT ────────────────────────────────────────────────────────
  { id: "dyspnea", route: "/DyspneaHub", icon: "💨", abbr: "DYSPNEA", title: "Dyspnea", subtitle: "BLUE Protocol · PE Pathway · CHF / ADHF · COPD / Pneumonia", category: "Chief Complaint", ...palette("#3b9eff"), stats: ["BLUE Protocol", "PE Pathway", "CHF / ADHF"], badge: "BLUE·PE", priority: 34, essential: false, live: true },
  { id: "headache", route: "/HeadacheHub", icon: "🤕", abbr: "HEADACHE", title: "Headache", subtitle: "SNOOP4 Red Flags · Ottawa SAH Rule · LP Interpretation · Treatment", category: "Chief Complaint", ...palette("#9b6dff"), stats: ["SNOOP4 Flags", "Ottawa SAH", "LP Interpretation"], badge: "OTTAWA·SAH", priority: 35, essential: false, live: true },
  { id: "abdpain", route: "/AbdominalPainHub", icon: "🔴", abbr: "ABD PAIN", title: "Abdominal Pain", subtitle: "Alvarado · BISAP · Glasgow-Blatchford · Tokyo 2018", category: "Chief Complaint", ...palette("#ff9f43"), stats: ["Alvarado Score", "BISAP", "GI Bleed"], badge: "ALVARADO", priority: 36, essential: false, live: true },
  { id: "ams", route: "/ams-hub", icon: "😵", abbr: "AMS", title: "AMS", subtitle: "AEIOU-TIPS · CAM-ICU · RASS Scale · Specific Syndromes", category: "Chief Complaint", ...palette("#9b6dff"), stats: ["AEIOU-TIPS", "CAM-ICU", "RASS Scale"], badge: "AEIOU-TIPS", priority: 37, essential: false, live: true },
  { id: "syncope", route: "/syncope-hub", icon: "💫", abbr: "SYNCOPE", title: "Syncope", subtitle: "SFSR + CSRS · High-Risk Features · Ottawa ECG · Disposition", category: "Chief Complaint", ...palette("#f5c842"), stats: ["SFSR + CSRS", "High-Risk Features", "Disposition"], badge: "SFSR·CSRS", priority: 38, essential: false, live: true },
  { id: "dvt", route: "/dvt-hub", icon: "🩸", abbr: "DVT/VTE", title: "DVT / VTE", subtitle: "Wells DVT Score · DOAC Selection · Renal Dosing · IVC Filter", category: "Chief Complaint", ...palette("#3b9eff"), stats: ["Wells DVT Score", "DOAC Selection", "Renal Dosing"], badge: "DOAC·WELLS", priority: 39, essential: false, live: true, note: "Recategorized Specialty → Chief Complaint." },
  { id: "seizure", route: "/seizure-hub", icon: "⚡", abbr: "SEIZURE", title: "Seizure", subtitle: "Status Epilepticus · BZD Dosing · NCSE · Post-ictal Management", category: "Chief Complaint", ...palette("#9b6dff"), stats: ["Status Epilepticus", "BZD Protocol", "NCSE"], badge: "Live", priority: 47, essential: false, live: true, note: "Recategorized Specialty → Chief Complaint." },

  // ── DIAGNOSTICS ────────────────────────────────────────────────────────────
  { id: "labhub", route: "/LabHub", icon: "🧪", abbr: "LAB HUB", title: "Lab Hub", subtitle: "Interpret · Serial Trends · AI Analysis · KDIGO · Troponin Delta · Lactate Clearance", category: "Diagnostics", ...palette("#3dffa0"), stats: ["10 Panels · AI Interp", "Serial Trends", "KDIGO · Trop Delta"], badge: "AI·TRENDS", priority: 44, essential: false, live: true },
  { id: "imaging", route: "/imaging-interpreter", icon: "🩻", abbr: "IMAGING", title: "Imaging Interpreter", subtitle: "CXR · CT Head · CT Chest/PE · CT Abdomen — AI Interpretation", category: "Diagnostics", ...palette("#82aece"), stats: ["CXR Patterns", "CT Head", "CT Abdomen"], badge: "IMAGING", priority: 45, essential: false, live: true },
  { id: "radiology", route: "/radiology-hub", icon: "🩻", abbr: "RADIOLOGY", title: "Radiology", subtitle: "CXR · CT Head · CT Abdomen — Systematic Approach · Classic Patterns · Don't-Miss Dx", category: "Diagnostics", ...palette("#00d4ff"), stats: ["CXR A-F System", "CT Head Patterns", "CT Abd Patterns"], badge: "Live", priority: 26, essential: false, live: true, note: "Recategorized Tools → Diagnostics." },

  // ── PHARMACOLOGY ───────────────────────────────────────────────────────────
  { id: "unified-pharma", route: "/unified-pharma", icon: "⚗", abbr: "PHARMA HUB", title: "Unified Pharmacology", subtitle: "Rx Lookup · FDA Labels · Weight Dosing · Drip Calc · Interactions · AI Pharmacist", category: "Pharmacology", ...palette("#00b4d8"), stats: ["FDA Drug Labels", "Drip Calculator", "AI Pharmacist"], badge: "AI-Powered", priority: 41.2, essential: true, live: true },
  { id: "fluid-electrolyte", route: "/FluidElectrolyteCalculator", icon: "🧪", abbr: "FLUIDS", title: "Fluid & Electrolyte Calc", subtitle: "Na Deficit · Free Water · K Replacement · Bicarb · Anion Gap · Osmolality", category: "Pharmacology", ...palette("#4ade80"), stats: ["Na/K/HCO3", "Anion Gap", "Osmol Gap"], badge: "Live", priority: 41.3, essential: false, live: true },
  { id: "abx-stewardship", route: "/AntibioticStewardshipHub", icon: "💉", abbr: "ABX STEWARD", title: "Antibiotic Stewardship", subtitle: "Empiric Regimens · PCN Allergy Alts · De-escalation · Culture-Guided AI", category: "Pharmacology", ...palette("#3dffa0"), stats: ["Empiric ABX", "Allergy Alts", "AI De-escalation"], badge: "Live", priority: 41.4, essential: false, live: true },
  { id: "drug-comparison", route: "/DrugComparisonHub", icon: "⚖", abbr: "DRUG COMPARE", title: "Drug Comparison", subtitle: "Side-by-side drug analysis · Renal tiers · Interactions · ISMP flags", category: "Pharmacology", ...palette("#00b4d8"), stats: ["Side-by-Side", "Renal Tiers", "ISMP Flags"], badge: "Live", priority: 41.6, essential: false, live: true },
  { id: "med-rec", route: "/MedRecHub", icon: "📋", abbr: "MED REC", title: "Medication Reconciliation", subtitle: "AI-powered med rec · Drug interactions · Renal flags · Hold list · Allergy conflicts", category: "Pharmacology", ...palette("#00b4d8"), stats: ["Drug Interactions", "Renal Flags", "Hold List"], badge: "AI-Powered", priority: 41.7, essential: false, live: true },
  { id: "pain", route: "/pain-hub", icon: "🩺", abbr: "PAIN", title: "Pain", subtitle: "Acute Pain Ladder · Opioid Dosing · Nerve Blocks · Adjuncts", category: "Pharmacology", ...palette("#ff9f43"), stats: ["Pain Ladder", "Opioid Dosing", "Nerve Blocks"], badge: "MULTIMODAL", priority: 41, essential: false, live: true },
  { id: "dischargerx", route: "/DischargeRxCard", icon: "💊", abbr: "DC Rx", title: "Discharge Rx Card", subtitle: "Discharge prescription builder · Dose · Duration · Quantity · Sig", category: "Pharmacology", ...palette("#f5c842"), stats: ["Dose · Duration", "Quantity", "Sig Builder"], badge: "DOSE·DURATION", priority: 60, essential: false, live: true, note: "RESCUED from HubIndex — confirmed live at /DischargeRxCard in App.jsx." },
  { id: "weightdose", route: "/weight-dose", icon: "⚖️", abbr: "WT DOSE", title: "Weight Dose", subtitle: "30 Critical Drugs · RSI · Vasopressors · Live Infusion Rates", category: "Pharmacology", ...palette("#00e5c0"), stats: ["RSI / Vasopressors", "Live Infusion Calc", "Reversal Agents"], badge: "Coming Soon", priority: 42, essential: false, live: false, note: "DEAD ROUTE: /weight-dose not mounted in App.jsx. Likely folded into UnifiedPharmacologyHub — delete this card or re-point." },
  { id: "smartdosing", route: "/smart-dosing", icon: "💡", abbr: "SMART DOSE", title: "Smart Dosing", subtitle: "AI-Assisted Drug Dosing · Renal Adjustments · Interactions", category: "Pharmacology", ...palette("#00e5c0"), stats: ["AI Dosing", "Renal Adjust", "Interactions"], badge: "Coming Soon", priority: 48, essential: false, live: false, note: "DEAD ROUTE: /smart-dosing not mounted. Likely folded into UnifiedPharmacologyHub (AI Pharmacist) — delete or re-point." },
  { id: "order-generator", route: "/EDOrderHub", icon: "📋", abbr: "ORDERS", title: "Order Generator", subtitle: "Weight-based dosing · Copy-paste order text · Bundles · CPOE bridge", category: "Pharmacology", ...palette("#3b9eff"), stats: ["30+ Drugs", "Weight-Based", "Bundle Launch"], badge: "CPOE", priority: 41.5, essential: false, live: true },
  { id: "erx", route: "/erx", icon: "💊", abbr: "eRx", title: "ePrescribing", subtitle: "Formulary · Drug interactions · DEA schedules", category: "Pharmacology", ...palette("#ff9f43"), stats: ["Drug DB", "Interactions", "Controlled Rx"], badge: "Coming Soon", priority: 7, essential: false, live: false, note: "DEAD ROUTE: /erx not mounted in App.jsx. Not built — keep as roadmap or delete." },

  // ── SPECIALTY ──────────────────────────────────────────────────────────────
  { id: "ob", route: "/ob-hub", icon: "🤰", abbr: "OB/GYN", title: "OB/GYN", subtitle: "Obstetric Emergencies · Pre-eclampsia · PPH", category: "Specialty", ...palette("#ff6b9d"), stats: ["HELLP", "Pre-eclampsia", "PPH Protocol"], badge: "ACOG", priority: 9, essential: false, live: true },
  { id: "peds", route: "/peds-hub", icon: "👶", abbr: "PEDS", title: "Pediatric", subtitle: "PALS · Broselow · Weight-based Dosing", category: "Specialty", ...palette("#b99bff"), stats: ["PALS 2025", "Broselow", "Neonatal"], badge: "AHA/AAP 2025", priority: 10, essential: false, live: true },
  { id: "psyche-hub", route: "/psyche-hub", icon: "🧠", abbr: "PSYCH", title: "Psychiatry", subtitle: "Agitation · NMS · Serotonin Syndrome · Bipolar · Suicide Risk", category: "Specialty", ...palette("#9b6dff"), stats: ["8 Protocols", "Screening Tools", "NMS/SS"], badge: "Live", priority: 19, essential: false, live: true },
  { id: "ortho", route: "/ortho-hub", icon: "🦴", abbr: "ORTHO", title: "Orthopaedic", subtitle: "Fractures · Dislocations · Compartment Syndrome · Ottawa Rules", category: "Specialty", ...palette("#a78bfa"), stats: ["5 Fracture Types", "4 Dislocations", "Ottawa Rules"], badge: "Live", priority: 23, essential: false, live: true },
  { id: "dental", route: "/DentalHub", icon: "🦷", abbr: "DENTAL", title: "Dental", subtitle: "Dental Emergencies · Tooth Fractures · Pericoronitis · Abscess · Nerve Blocks", category: "Specialty", ...palette("#00b4d8"), stats: ["Dental Emergencies", "Nerve Blocks", "Abscess Mgmt"], badge: "Live", priority: 54, essential: true, live: true },
  { id: "derm", route: "/derm-hub", icon: "🩺", abbr: "DERM", title: "Dermatology", subtitle: "Characteristic-Based DDx · LRINEC · SJS/TEN · Cellulitis vs Nec Fasc", category: "Specialty", ...palette("#00e5c0"), stats: ["AI Differential", "LRINEC Score", "SJS/TEN"], badge: "AI·DDx", priority: 55, essential: false, live: true, note: "RESCUED — was missing from HSP. Confirmed live at /derm-hub. (App.jsx also has /derm-morphology · DermMorphologyRef — add as a card?)" },

  // ── PROCEDURES ─────────────────────────────────────────────────────────────
  { id: "airway", route: "/airway-hub", icon: "🌬️", abbr: "AIRWAY", title: "Airway", subtitle: "RSI · Difficult Airway · Ventilator Management", category: "Procedures", ...palette("#3b9eff"), stats: ["RSI Protocol", "ARDS Net", "Difficult Airway"], badge: "DAS 2022", priority: 4, essential: true, live: true },
  { id: "surgical-airway", route: "/surgical-airway-hub", icon: "🔪", abbr: "SURG AIR", title: "Surgical Airway", subtitle: "CICO · Cricothyrotomy · RSI · Difficult Airway · Vent Settings", category: "Procedures", ...palette("#ff4444"), stats: ["RSI Calculator", "LEMON Score", "CICO Protocol"], badge: "Live", priority: 20, essential: false, live: true },
  { id: "pocus", route: "/pocus-hub", icon: "🔬", abbr: "POCUS", title: "POCUS", subtitle: "RUSH · BLUE · eFAST protocols · Annotated findings · Documentation template", category: "Procedures", ...palette("#00d4ff"), stats: ["RUSH Exam", "BLUE Protocol", "eFAST"], badge: "Live", priority: 22, essential: true, live: true },
  { id: "procedure-hub", route: "/procedure-hub", icon: "✂️", abbr: "PROC", title: "Procedures", subtitle: "Step-by-step guides · Equipment checklists · Complications · AI Scrub-In", category: "Procedures", ...palette("#00d4ff"), stats: ["8 Procedures", "Step-by-Step", "AI Scrub-In"], badge: "Live", priority: 11, essential: false, live: true, note: "Sole survivor of the /Procedures + /procedure-hub pair (/Procedures was a dead route)." },
  { id: "woundcare", route: "/wound-care-hub", icon: "🩹", abbr: "WOUND CARE", title: "Wound Care", subtitle: "Laceration Management · Closure Type · Suture Sizing · Irrigation", category: "Procedures", ...palette("#ff9f43"), stats: ["Closure Selection", "Suture Sizing", "Irrigation"], badge: "CLOSURE", priority: 46, essential: false, live: true, note: "Distinct from Wound Management (id wound). Both routes are real — relabeled to disambiguate (this = acute laceration repair)." },
  { id: "wound", route: "/wound-hub", icon: "🩹", abbr: "WOUND MGMT", title: "Wound Management", subtitle: "Wound Assessment · Dressing Selection · Management Protocols", category: "Procedures", ...palette("#ff9f43"), stats: ["Assessment Framework", "Dressing Guide", "Clinical Reference"], badge: "Live", priority: 31, essential: false, live: true, note: "Both wound routes are real builds — kept both, relabeled (this = chronic/dressing management). Merge later if you prefer one hub." },
  { id: "ed-procedure-notes", route: "/ed-procedure-notes", icon: "📝", abbr: "PROC NOTES", title: "ED Procedure Notes", subtitle: "Procedure Documentation · Templates · Consent · Complication Tracking", category: "Procedures", ...palette("#00d4ff"), stats: ["Note Templates", "Consent Forms", "Documentation"], badge: "Live", priority: 53, essential: true, live: true },
  { id: "rapid-assessment", route: "/rapid-assessment-hub", icon: "⚡", abbr: "RAPID", title: "Rapid Assessment", subtitle: "10-minute workup templates · Time-phased by chief complaint · Checkable steps", category: "Procedures", ...palette("#06b6d4"), stats: ["10 Templates", "Time-Phased", "Step Tracker"], badge: "Live", priority: 17, essential: true, live: true },

  // ── TOOLS ──────────────────────────────────────────────────────────────────
  { id: "quicknote", route: "/QuickNote", icon: "📋", abbr: "QUICKNOTE", title: "QuickNote", subtitle: "Paste-to-MDM · ACEP Disposition · Discharge Rx · 2-phase AI workflow", category: "Tools", ...palette("#00e5c0"), stats: ["MDM · 2023 E&M", "ACEP Disposition", "Discharge Rx"], badge: "AI-Powered", priority: 4.5, essential: true, live: true },
  { id: "autocoder", route: "/AutoCoder", icon: "🤖", abbr: "CODE", title: "AutoCoder", subtitle: "AI-powered ICD-10 · CPT · E/M coding", category: "Tools", ...palette("#9b6dff"), stats: ["ICD-10", "CPT", "E/M Levels"], badge: "AI-Powered", priority: 5, essential: false, live: true, note: "Confirmed live via pages.config Pages map." },
  { id: "calculator", route: "/Calculators", icon: "🧮", abbr: "CALC", title: "Calculator", subtitle: "Clinical scores, dosing, risk stratification", category: "Tools", ...palette("#00e5c0"), stats: ["40+ Calculators", "Weight-based", "GRACE · TIMI"], badge: "Clinical Tools", priority: 6, essential: false, live: true, note: "Confirmed live via pages.config Pages map." },
  { id: "scores", route: "/score-hub", icon: "🎯", abbr: "SCORES", title: "Score Hub", subtitle: "12+ Validated Scores · HEART · Wells · Ottawa · GCS · ABCD2", category: "Tools", ...palette("#3b9eff"), stats: ["HEART / Wells", "Ottawa / NEXUS", "CURB-65 / GCS"], badge: "12+ TOOLS", priority: 40, essential: false, live: true, note: "OVERLAP with clinical-decision (/ClinicalDecisionHub): HEART/Wells/Ottawa/ABCD2 appear in both. Score Hub = quick calculators; ClinicalDecisionHub = rules + per-rule AI + chart handoff. Rationalize or keep as distinct tiers." },
  { id: "clinical-decision", route: "/ClinicalDecisionHub", icon: "🧭", abbr: "CDR", title: "Clinical Decision Rules", subtitle: "Canadian CT · PECARN · New Orleans · ABCD2 · PERC+Wells · HEART · CURB-65 · SF Syncope · Ottawa · C-Spine/NEXUS", category: "Tools", ...palette("#b06dff"), stats: ["11 Validated Rules", "Per-Rule AI Interp", "Chart Handoff"], badge: "AI·RULES", priority: 40.5, essential: false, live: true, note: "RESCUED — real live route absent from both source catalogs. Has an `embedded` prop, so it mounts directly in HubTakeover's renderHub; just swap its '/hub' back-button for close-overlay when embedded. NOT a launcher." },
  { id: "results", route: "/Results", icon: "🧪", abbr: "RESULTS", title: "Results", subtitle: "Labs · Vitals · EKG · Imaging · EMR Paste Import · AI Integrated Synthesis", category: "Tools", ...palette("#3b9eff"), stats: ["Critical Value Flags", "EMR Paste Import", "AI Synthesis"], badge: "Coming Soon", priority: 27, essential: false, live: false, note: "Confirmed DEAD — absent from both App.jsx and pages.config. Scope overlaps LabHub + critical-inbox; delete or build." },
  { id: "consult", route: "/consult-hub", icon: "📡", abbr: "CONSULT", title: "Consult", subtitle: "16 Specialties · Pre-Call Prep · Escalation Criteria · AI Consult Coach", category: "Tools", ...palette("#9b6dff"), stats: ["16 Specialties", "Pre-Call Checklists", "AI Coach"], badge: "Live", priority: 28, essential: false, live: true },
  { id: "id-hub", route: "/id-hub", icon: "🦠", abbr: "ID", title: "Infectious Disease", subtitle: "Antibiotics · Resistant Organisms · HIV/OI · Travel Medicine · Isolation · AI ID Coach", category: "Tools", ...palette("#3dffa0"), stats: ["Antibiotic Guides", "Resistant Orgs", "AI ID Coach"], badge: "Live", priority: 29, essential: false, live: true },
  { id: "discharge", route: "/discharge-hub", icon: "🏠", abbr: "D/C", title: "Discharge", subtitle: "Disposition Criteria · Discharge Checklist · Return Precautions · AI Discharge Note", category: "Tools", ...palette("#00d4ff"), stats: ["5 Disposition Guides", "26 Checklist Items", "AI Note Generator"], badge: "Live", priority: 30, essential: false, live: true },
  { id: "ddx", route: "/ddx-engine", icon: "🔎", abbr: "DDx", title: "DDx Engine", subtitle: "AI Differential Diagnosis · Symptom Matching · Probability Ranking", category: "Tools", ...palette("#3b9eff"), stats: ["AI-Powered", "Symptom Match", "Probability"], badge: "AI-Powered", priority: 50, essential: false, live: true },
  { id: "narrative", route: "/narrative-engine", icon: "✍️", abbr: "NARRATIVE", title: "Clinical Narrative", subtitle: "AI Note Generation · HPI Builder · Clinical Narrative Engine", category: "Tools", ...palette("#9b6dff"), stats: ["AI Notes", "HPI Builder", "Narrative Engine"], badge: "AI-Powered", priority: 52, essential: false, live: true },
  { id: "triage", route: "/triage-hub", icon: "🏷️", abbr: "TRIAGE", title: "Triage", subtitle: "ESI Calculator · START/SALT MCI · Danger Vitals · CC Quick Sort", category: "Tools", ...palette("#fb923c"), stats: ["ESI v4", "START / SALT", "AI Assistant"], badge: "Live", priority: 16, essential: true, live: true },
  { id: "clinpres", route: "/ClinicalPresentationHub", icon: "🏥", abbr: "CLIN PRES", title: "Clinical Presentation", subtitle: "Evidence-based presentation workups", category: "Tools", ...palette("#3b9eff"), stats: ["Evidence-Based"], badge: "EVIDENCE-BASED", priority: 61, essential: false, live: true, note: "RESCUED — confirmed live at /ClinicalPresentationHub. Fill in real stats when known." },
  { id: "guidelines", route: "/KnowledgeBaseV2", icon: "📚", abbr: "GUIDE", title: "Medical Guidelines", subtitle: "Evidence-based clinical guidelines · Best practices", category: "Tools", ...palette("#6b63ff"), stats: ["ACC/AHA", "ACCP", "CDC"], badge: "Guidelines", priority: 8, essential: false, live: true, note: "Confirmed live — registered as KnowledgeBaseV2 in pages.config (not an explicit App.jsx Route, which is why it read as dead at first)." },

  // ── WORKFLOW ─────────────────────────────────────────────────────────────────
  { id: "command-center", route: "/command-center", icon: "⚕️", abbr: "CMD", title: "Command Center", subtitle: "Provider dashboard · AI shift briefing · Attention queue · Smart hub launcher", category: "Workflow", ...palette("#00e5c0"), stats: ["AI Briefing", "Attention Queue", "Smart Hubs"], badge: "Live", priority: 0.5, essential: true, live: true },
  { id: "critical-inbox", route: "/critical-inbox", icon: "🔴", abbr: "CRITICAL", title: "Critical Results Inbox", subtitle: "Critical & panic value alerts · Acknowledge · Audit trail · Escalation timers", category: "Workflow", ...palette("#ff4444"), stats: ["Critical Values", "Ack Audit Trail", "Escalation Timers"], badge: "Live", priority: 1.5, essential: true, live: true },
  { id: "newpatient", route: "/NewPatientInput", icon: "🆕", abbr: "NEW PT", title: "New Patient Input", subtitle: "Patient intake · Chart · Documentation · Disposition", category: "Workflow", ...palette("#00e5c0"), stats: ["Demographics", "Vitals", "Full Chart"], badge: "Clinical Workflow", priority: 14, essential: true, live: true },
  { id: "ed-tracking", route: "/EDTrackingBoard", icon: "📋", abbr: "TRACK", title: "ED Tracking Board", subtitle: "Patient Flow · Status Board · Acuity Tracking · Department Overview", category: "Workflow", ...palette("#00e5c0"), stats: ["Patient Flow", "Status Board", "Acuity Track"], badge: "Live", priority: 51, essential: false, live: true },
  { id: "dispo-board", route: "/DispositionBoard", icon: "🚪", abbr: "DISPO", title: "Disposition Board", subtitle: "Admit · Discharge · Transfer · Boarding Timers · Bed Status", category: "Workflow", ...palette("#00e5c0"), stats: ["Boarding Timers", "Bed Requests", "Status Tracker"], badge: "Live", priority: 32, essential: false, live: true },
  { id: "order-dashboard", route: "/OrderDashboard", icon: "🗂️", abbr: "ORD BOARD", title: "Order Dashboard", subtitle: "Order lifecycle tracking · Pending → Active → Completed · Per-patient grouping · Status mgmt", category: "Workflow", ...palette("#00e5c0"), stats: ["Status Lifecycle", "Per-Patient View", "Type Breakdown"], badge: "Live", priority: 32.5, essential: false, live: true, note: "Entity-backed (ClinicalOrder) order tracker — distinct from the EDOrderHub composer at /EDOrderHub. Added in order-surface consolidation." },
  { id: "shift-dash", route: "/ShiftDashboard", icon: "🏥", abbr: "SHIFT", title: "Shift Dashboard", subtitle: "Shift overview · Auto-refresh census · Stats", category: "Workflow", ...palette("#00e5c0"), stats: ["Auto-Refresh", "Census", "Shift Stats"], badge: "AUTO-REFRESH", priority: 0.6, essential: false, live: true, note: "Confirmed live at /ShiftDashboard (was in LIVE_ROUTES with no card). Verify subtitle/stats." },
  { id: "vitals", route: "/VitalsHub", icon: "📈", abbr: "VITALS", title: "Vitals Hub", subtitle: "Live vitals · Monitor integration · Trends", category: "Workflow", ...palette("#3b9eff"), stats: ["Live Feed", "Monitor Integration", "Trends"], badge: "Live", priority: 14.5, essential: false, live: true, note: "Confirmed live at /VitalsHub. Verify subtitle/stats." },
  { id: "calendar", route: "/Calendar", icon: "📅", abbr: "CAL", title: "Provider Schedule", subtitle: "Shift calendar · Day, night, on-call · Monthly tracking", category: "Workflow", ...palette("#00e5c0"), stats: ["Month View", "Week View", "Shift Tracking"], badge: "Coming Soon", priority: 7.5, essential: false, live: false, note: "Confirmed DEAD — absent from both App.jsx and pages.config. Delete or build." },
  { id: "huddle", route: "/huddle-board", icon: "👥", abbr: "HUDDLE", title: "Huddle Board", subtitle: "Team huddle · Shift handoff · Real-time board", category: "Workflow", ...palette("#00e5c0"), stats: ["Real-Time"], badge: "REAL-TIME", priority: 62, essential: false, live: true, note: "RESCUED — confirmed live at /huddle-board. Fill in real stats." },
];

// ── category taxonomy (Workflow retained from HubIndex) ──────────────────────
export const CATEGORIES = [
  "All", "Essential", "Critical Care", "Chief Complaint", "Diagnostics",
  "Pharmacology", "Specialty", "Procedures", "Tools", "Workflow",
];

export const ESSENTIAL_IDS = new Set(HUBS.filter((h) => h.essential).map((h) => h.id));

// ── selectors ────────────────────────────────────────────────────────────────
export const getHubByRoute = (route) => HUBS.find((h) => h.route === route) || null;
export const liveHubs = () => HUBS.filter((h) => h.live);
export const hubsByCategory = (cat) =>
  cat === "All" ? HUBS
  : cat === "Essential" ? HUBS.filter((h) => ESSENTIAL_IDS.has(h.id))
  : HUBS.filter((h) => h.category === cat);
export const searchHubs = (q) => {
  const s = (q || "").toLowerCase().trim();
  if (!s) return [];
  return HUBS.filter((h) =>
    h.title.toLowerCase().includes(s) ||
    h.subtitle.toLowerCase().includes(s) ||
    h.abbr.toLowerCase().includes(s) ||
    h.category.toLowerCase().includes(s) ||
    h.stats.some((st) => st.toLowerCase().includes(s))
  );
};

// ── getHubById ───────────────────────────────────────────────────────────────
export const getHubById = (id) => HUBS.find((h) => h.id === id) || null;

// ── suggestHubs — chief-complaint → suggested hub IDs ────────────────────────
// Lifted from PatientEncounter.jsx's ClinicalDecisionLane. The cc keyword logic
// is preserved verbatim; the OUTPUTS are remapped from PatientEncounter's ad-hoc
// component keys to canonical registry ids — because nav(key) → /${key} made
// those keys 404 (e.g. /ECGHub, /LabInterpreter, /OrderGeneratorHub,
// /DermatologyHub are not routes; the real ones are /cardiac-hub [ECG is a
// Cardiac tab], /LabHub, /EDOrderHub, /derm-hub). Returning ids resolves it.
//
// THREE lossy remaps — confirm:
//  • CardiacRiskPage   → "cardiac"          (no standalone route; Cardiac covers risk)
//  • OrderGeneratorHub → "order-generator"  (DEAD route — re-point to /EDOrderHub)
//  • DermMorphologyRef → "derm"             (no card; Derm covers, or add its own)
//
// Follow-on: PatientEncounter's local HUBS / HUB_DOMAINS are a THIRD diverging
// catalog copy. Point its ClinicalDecisionLane at suggestHubs() + getHubById()
// here so the patient-context rail stops 404-ing and stays in sync.
const SUGGEST_MAP = {
  ECGHub: "cardiac", CardiacRiskPage: "cardiac", LabInterpreter: "labhub",
  OrderGeneratorHub: "order-generator", StrokeHub: "stroke",
  ImagingInterpreter: "imaging", ToxicologyHub: "tox", AirwayHub: "airway",
  SepsisHub: "sepsis", DermatologyHub: "derm", DermMorphologyRef: "derm",
  POCUSHub: "pocus", ElectrolyteHub: "electrolyte-acidbase",
};
export const suggestHubs = (cc = "") => {
  const c = cc.toLowerCase();
  let keys;
  if (c.includes("chest pain") || c.includes("chest"))
    keys = ["ECGHub", "CardiacRiskPage", "LabInterpreter", "OrderGeneratorHub"];
  else if (c.includes("stroke") || c.includes("tpa") || c.includes("neuro"))
    keys = ["StrokeHub", "ImagingInterpreter", "CardiacRiskPage"];
  else if (c.includes("overdose") || c.includes("opioid") || c.includes("tox") || c.includes("ingestion"))
    keys = ["ToxicologyHub", "AirwayHub", "OrderGeneratorHub"];
  else if (c.includes("shortness") || c.includes("sob") || c.includes("breath") || c.includes("respiratory"))
    keys = ["ECGHub", "POCUSHub", "LabInterpreter", "ImagingInterpreter"];
  else if (c.includes("sepsis") || c.includes("fever") || c.includes("infection") || c.includes("uti"))
    keys = ["SepsisHub", "LabInterpreter", "OrderGeneratorHub"];
  else if (c.includes("rash") || c.includes("derm") || c.includes("skin"))
    keys = ["DermatologyHub", "DermMorphologyRef", "LabInterpreter"];
  else if (c.includes("abdominal") || c.includes("abd") || c.includes("belly"))
    keys = ["POCUSHub", "LabInterpreter", "ImagingInterpreter"];
  else if (c.includes("altered") || c.includes("ams") || c.includes("confusion") || c.includes("mental"))
    keys = ["ToxicologyHub", "LabInterpreter", "ImagingInterpreter"];
  else if (c.includes("weakness") || c.includes("electrolyte") || c.includes("k+") || c.includes("potassium"))
    keys = ["ElectrolyteHub", "ECGHub", "LabInterpreter"];
  else if (c.includes("trauma") || c.includes("fracture") || c.includes("ortho") || c.includes("fall"))
    keys = ["ImagingInterpreter", "OrderGeneratorHub"];
  else if (c.includes("cardiac") || c.includes("heart") || c.includes("arrest"))
    keys = ["ECGHub", "CardiacRiskPage", "OrderGeneratorHub"];
  else if (c.includes("airway") || c.includes("intub") || c.includes("rsi"))
    keys = ["AirwayHub", "OrderGeneratorHub"];
  else
    keys = ["LabInterpreter", "ECGHub", "OrderGeneratorHub"];
  const ids = [...new Set(keys.map((k) => SUGGEST_MAP[k]).filter(Boolean))];
  return ids.filter((id) => HUBS.some((h) => h.id === id));
};