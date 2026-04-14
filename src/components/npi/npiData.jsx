// ─── npiData.js ───────────────────────────────────────────────────────────────
// All static data, configuration arrays, and pure functions used across the
// Notrya NPI module. No React imports — pure JS only.

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
export const NAV_DATA = {
  intake: [
    { section: "triage",     icon: "🏷️", label: "Triage",           abbr: "Tr", dot: "empty" },
    { section: "demo",       icon: "👤", label: "Demographics",      abbr: "Dm", dot: "empty" },
    { section: "cc",         icon: "💬", label: "Chief Complaint",   abbr: "Cc", dot: "empty" },
    { section: "vit",        icon: "📈", label: "Vitals",            abbr: "Vt", dot: "empty" },
    { section: "meds",       icon: "💊", label: "Meds & PMH",        abbr: "Rx", dot: "empty" },
    { section: "sdoh",       icon: "🏘️", label: "SDOH Screening",    abbr: "Sd", dot: "empty" },
  ],
  assess: [
    { section: "summary",    icon: "📊", label: "Patient Summary",    abbr: "Sm", dot: "empty" },
    { section: "hpi",        icon: "📝", label: "HPI",               abbr: "Hp", dot: "empty" },
    { section: "ros",        icon: "🔍", label: "Review of Systems", abbr: "Rs", dot: "empty" },
    { section: "pe",         icon: "🩺", label: "Physical Exam",     abbr: "Pe", dot: "empty" },
    { section: "erplan",     icon: "🗺️", label: "ER Plan Builder",   abbr: "Ep", dot: "empty" },
  ],
  orders: [
    { section: "orders",     icon: "📋", label: "Orders",            abbr: "Or", dot: "empty" },
    { section: "erx",        icon: "💉", label: "eRx",               abbr: "Ex", dot: "empty" },
    { section: "procedures", icon: "✂️", label: "Procedures",        abbr: "Pr", dot: "empty" },
    { section: "consult",    icon: "👥", label: "Consults",          abbr: "Co", dot: "empty" },
  ],
  close: [
    { section: "chart",      icon: "📄", label: "Clinical Note",     abbr: "Cn", dot: "empty" },
    { section: "reassess",   icon: "🔄", label: "Reassessment",      abbr: "Ra", dot: "empty" },
    { section: "autocoder",  icon: "🤖", label: "AutoCoder",         abbr: "Ac", dot: "empty" },
    { section: "mdm",        icon: "⚖️", label: "MDM Builder",       abbr: "Md", dot: "empty" },
    { section: "timeline",   icon: "⏱",  label: "Timeline",          abbr: "Tl", dot: "empty" },
    { section: "closeout",   icon: "✅", label: "Close-out",         abbr: "Cl", dot: "empty" },
    { section: "handoff",    icon: "🤝", label: "Handoff (I-PASS)",  abbr: "Ho", dot: "empty" },
    { section: "discharge",  icon: "🚪", label: "Discharge",         abbr: "Dc", dot: "empty" },
    { section: "capacity",   icon: "⚖️", label: "Capacity/AMA",      abbr: "Ca", dot: "empty" },
    { section: "audit",      icon: "🔒", label: "Audit Lock",         abbr: "Al", dot: "empty" },
  ],
  tools: [
    { section: "scores",     icon: "🧮", label: "Score Calc",        abbr: "Sc", dot: "empty" },
    { section: "weightdose", icon: "💊", label: "Drug Dosing",        abbr: "Dd", dot: "empty" },
    { section: "sepsis",     icon: "🦠", label: "Sepsis Protocol",   abbr: "Sp", dot: "empty", href: "/SepsisHub"           },
    { section: "ecg",        icon: "❤️", label: "ECG Review",        abbr: "Eg", dot: "empty", href: "/ECGHub"              },
    { section: "psych",      icon: "🧠", label: "Psych Assessment",  abbr: "Px", dot: "empty", href: "/PsychHub"            },
    { section: "resus",      icon: "🫀", label: "Resus Hub",         abbr: "Rh", dot: "empty", href: "/ResusHub"            },
    { section: "labsint",    icon: "🔬", label: "Labs Interpreter",  abbr: "Li", dot: "empty", href: "/LabsInterpreter"     },
    { section: "knowledge",  icon: "📚", label: "Knowledge Base",    abbr: "Kb", dot: "empty", href: "/KnowledgeBaseV2"     },
    { section: "results",    icon: "🧪", label: "Results",           abbr: "Re", dot: "empty", href: "/Results"             },
    { section: "medref",     icon: "🧬", label: "ED Med Ref",        abbr: "Mr", dot: "empty", href: "/MedicationReference" },
    { section: "calc",       icon: "🧮", label: "Calculators",       abbr: "Ca", dot: "empty", href: "/Calculators"         },
    { section: "hub",        icon: "🏥", label: "Clinical Hub",      abbr: "Hb", dot: "empty", href: "/hub"                 },
  ],
};

export const GROUP_META = [
  { key: "intake",  icon: "📋", label: "Intake"  },
  { key: "assess",  icon: "🔍", label: "Assess"  },
  { key: "orders",  icon: "📋", label: "Orders"  },
  { key: "close",   icon: "📝", label: "Close"   },
  { key: "tools",   icon: "🔧", label: "Tools"   },
];

export const ALL_SECTIONS = Object.values(NAV_DATA).flat();

// ─── VISIT MODE NAV FILTERING ─────────────────────────────────────────────────
// Simple mode (ESI 4-5): hide complex close-group tabs not needed for routine visits
export const SIMPLE_HIDDEN = new Set(["reassess", "autocoder", "mdm", "timeline", "handoff"]);
// Critical mode (ESI 1-2): all tabs shown; sepsis tool gets visual promotion

export const SHORTCUT_MAP = {
  "1": "triage", "2": "demo",  "3": "cc",
  "4": "vit",    "5": "meds",  "6": "hpi",
  "7": "ros",    "8": "pe",    "9": "orders",
  "0": "discharge",
};

export const SECTION_SHORTCUT = Object.fromEntries(
  Object.entries(SHORTCUT_MAP).map(([k, v]) => [v, k])
);

export const QUICK_ACTIONS = [
  { icon: "📋", label: "Summarise", prompt: "Summarise what I have entered so far."                  },
  { icon: "🔍", label: "Check",     prompt: "What am I missing? Check my entries for completeness." },
  { icon: "📝", label: "Draft Note",prompt: "Generate a draft note from the data entered."           },
  { icon: "🧠", label: "DDx",       prompt: "Suggest differential diagnoses based on current data." },
  { icon: "⚖️",  label: "MDM",      prompt: "Draft a compliant AMA/CPT 2023 Medical Decision Making paragraph. Include: (1) Number & complexity of problems addressed (COPA), (2) Amount & complexity of data reviewed, (3) Risk level (Minimal/Low/Moderate/High) with specific table-of-risk elements. Note any diagnoses considered but not ordered, and any social risk factors (housing, food, transportation) that affect management." },
];

// ─── CLINICAL SYSTEM LISTS ────────────────────────────────────────────────────
export const ROS_RAIL_SYSTEMS = [
  { id: "const",   icon: "🌡️", label: "Constitutional"    },
  { id: "heent",   icon: "👁️", label: "HEENT"             },
  { id: "cv",      icon: "❤️", label: "Cardiovascular"    },
  { id: "resp",    icon: "🫁", label: "Respiratory"       },
  { id: "gi",      icon: "🫃", label: "GI / Abdomen"      },
  { id: "gu",      icon: "🔵", label: "Genitourinary"     },
  { id: "msk",     icon: "🦴", label: "MSK"               },
  { id: "neuro",   icon: "🧠", label: "Neurological"      },
  { id: "psych",   icon: "🧘", label: "Psychiatric"       },
  { id: "skin",    icon: "🩹", label: "Skin"              },
  { id: "endo",    icon: "⚗️", label: "Endocrine"         },
  { id: "heme",    icon: "🩸", label: "Heme / Lymph"      },
  { id: "allergy", icon: "🌿", label: "Allergic / Immuno" },
];

export const PE_RAIL_SYSTEMS = [
  { id: "gen",   icon: "🧍", label: "General"        },
  { id: "heent", icon: "👁️", label: "HEENT"          },
  { id: "neck",  icon: "🔵", label: "Neck"           },
  { id: "cv",    icon: "❤️", label: "Cardiovascular" },
  { id: "resp",  icon: "🫁", label: "Respiratory"    },
  { id: "abd",   icon: "🫃", label: "Abdomen"        },
  { id: "msk",   icon: "🦴", label: "MSK"            },
  { id: "neuro", icon: "🧠", label: "Neurological"   },
  { id: "skin",  icon: "🩹", label: "Skin"           },
  { id: "psych", icon: "🧘", label: "Psychiatric"    },
];

// ─── AI SYSTEM PROMPT ─────────────────────────────────────────────────────────
export const SYSTEM_PROMPT =
  "You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2-4 concise, actionable sentences. Be direct. Never fabricate data.";

// ─── NOTE BLOAT GUARD ─────────────────────────────────────────────────────────
// Import this constant and append it to any AI note-generation prompt.
// Basis: AMA/CPT 2023 guidance against auto-pulling EHR data that adds length
// but no clinical value. Only clinically relevant findings should appear.
export const NOTE_BLOAT_GUARD =
  "\n\nNOTE QUALITY RULES (mandatory — AMA/CPT 2023 documentation standards):\n" +
  "- Include ONLY findings that are clinically relevant to this specific encounter.\n" +
  "- Do NOT auto-list normal or negative findings unless they directly support or" +
  " exclude a diagnosis being considered.\n" +
  "- Do NOT reproduce every ROS checkbox or every PE system if they are not pertinent.\n" +
  "- A complete note is not the same as a long note. Brevity with specificity is correct.\n" +
  "- For MDM: state the problem complexity, data reviewed, and risk level explicitly." +
  " Do not pad with peripheral data.";

export function buildPatientCtx(demo, cc, vitals, allergies, pmhSelected, currentTab) {
  const name = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).join(", ") || "none";
  return [
    `Patient: ${name}, ${demo.age || "?"}${demo.sex ? " " + demo.sex : ""}.`,
    cc.text     ? `CC: ${cc.text}.`                                                                   : null,
    vitals.bp   ? `BP ${vitals.bp}  HR ${vitals.hr || "-"}  SpO2 ${vitals.spo2 || "-"}  T ${vitals.temp || "-"}.` : null,
    allergies.length ? `Allergies: ${allergies.join(", ")}.`                                          : "Allergies: NKDA.",
    pmhList !== "none" ? `PMH: ${pmhList}.`                                                           : null,
    cc.hpi      ? `HPI summary: ${cc.hpi.slice(0, 200)}.`                                             : null,
    `Active section: ${currentTab}.`,
  ].filter(Boolean).join(" ");
}

// ─── BEERS CRITERIA ───────────────────────────────────────────────────────────
export const BEERS_DRUGS = [
  "alprazolam","diazepam","lorazepam","clonazepam","temazepam","triazolam","oxazepam","chlordiazepoxide",
  "cyclobenzaprine","carisoprodol","methocarbamol","chlorzoxazone","orphenadrine",
  "diphenhydramine","hydroxyzine","promethazine","doxylamine","meclizine",
  "zolpidem","zaleplon","eszopiclone",
  "amitriptyline","imipramine","doxepin","nortriptyline",
  "indomethacin","ketorolac","piroxicam",
  "meperidine","pentazocine","butorphanol",
];

// ─── CC RISK SCORE HINTS ──────────────────────────────────────────────────────
export function getCCRiskHints(ccText) {
  const t = (ccText || "").toLowerCase();
  const h = [];
  if (/chest.?pain|cp\b|angina|acs|troponin/.test(t))
    h.push({ tier:"advisory", score:"HEART Pathway", use:"ACS risk stratification", action:"Score \u22643 \u2192 low risk (MACE <2%), consider discharge" });
  if (/short.?ness|sob\b|dyspnea|breath/.test(t))
    h.push({ tier:"advisory", score:"PERC Rule", use:"Rule out PE if pre-test probability <15%", action:"All 8 criteria negative \u2192 no workup needed" });
  if (/syncope|faint|passed.?out|black.?out/.test(t))
    h.push({ tier:"advisory", score:"SF Syncope Rule", use:"Short-term serious outcome prediction", action:"Any CHESS criterion positive \u2192 high risk" });
  if (/head|trauma|fall|collision|mvc|blow/.test(t))
    h.push({ tier:"info", score:"PECARN (age <18)", use:"Clinically important TBI, minimize CT", action:"Age-stratified algorithm \u2192 select imaging" });
  if (/ankle|knee/.test(t))
    h.push({ tier:"info", score:"Ottawa Rules", use:"Reduce unnecessary radiographs", action:"Bony-landmark tenderness \u2192 X-ray indicated" });
  if (/pneumonia|pna|cough.*fever|fever.*cough/.test(t))
    h.push({ tier:"info", score:"PSI / PORT Score", use:"CAP severity \u2014 discharge vs. admit", action:"Class I\u2013II \u2192 low-risk outpatient candidate" });
  if (/back.?pain|neck.?pain|c-spine|c.?spine/.test(t))
    h.push({ tier:"info", score:"Canadian C-Spine Rule", use:"Cervical spine imaging decision", action:"Low-risk criteria + range of motion \u2192 no CT" });
  return h;
}

// ─── AMA CPT 2023 CATEGORY 2 DOCUMENTATION PHRASE BUILDER ───────────────────
// Generates a ready-to-paste chart phrase for "decision not to order" credit.
// Basis: AMA CPT 2023 FAQ #36 — ordering a test that was considered but not
// selected after shared decision-making satisfies MDM Category 2 data element.
export function buildDecisionDocPhrase(hint) {
  const verb = hint.tier === "advisory"
    ? "Applied to support decision regarding further workup"
    : "Applied to guide imaging / testing decision";
  return (
    `Clinical decision rule applied: ${hint.score}. ${verb} (${hint.use}). ` +
    `Result: ${hint.action}. ` +
    `Per AMA CPT 2023 FAQ \u002336, documented application of a validated clinical ` +
    `decision rule with explicit reasoning satisfies MDM Category 2 data element ` +
    `(Amount and Complexity of Data Reviewed and Analyzed).`
  );
}

// ─── SDOH ─────────────────────────────────────────────────────────────────────
export const SDOH_DOMAINS = [
  { key:"housing",   icon:"🏠", label:"Housing",     q:"Is housing stable?",         opts:["Stable","Unstable","Homeless / at risk"]      },
  { key:"food",      icon:"🍎", label:"Food",         q:"In the past 12 months, did you worry food would run out before you had money to buy more?", opts:["Adequate","Inconsistent","Insecure / hungry"]  },
  { key:"transport", icon:"🚗", label:"Transport",    q:"Can get to appointments?",   opts:["No barrier","Occasional barrier","Major barrier"] },
  { key:"utilities", icon:"💡", label:"Utilities",    q:"Heat / water stable?",       opts:["Stable","At risk","Shut off / absent"]         },
  { key:"isolation", icon:"👥", label:"Social",       q:"Social support adequate?",   opts:["Connected","Limited","Isolated"]               },
  { key:"safety",    icon:"🛡️", label:"Safety",       q:"Feels safe at home?",        opts:["Safe","Unsure","Unsafe / IPV concern"]         },
];

export const TIER_COLORS = { "0":"#00e5c0", "1":"#f5c842", "2":"#ff6b6b" };

// ─── ISAR-6 FALL RISK SCREEN ──────────────────────────────────────────────────
// Identification of Seniors At Risk — validated specifically for ED use.
// Score ≥ 2 = high risk for functional decline, readmission, and adverse outcomes.
// "Yes" answers score 1 point each EXCEPT q3 (vision) where "No" scores 1 point.
export const ISAR_QUESTIONS = [
  { key:"q1", q:"Do you need someone to help you on a regular basis?",               yesScores:true,  hint:"Dependency in ADLs / IADLs"                              },
  { key:"q2", q:"Have you had an emergency hospital visit in the last 6 months?",    yesScores:true,  hint:"Prior acute care utilization"                             },
  { key:"q3", q:"In general, do you see well?",                                      yesScores:false, hint:"Score 1 if NO — impaired vision is the risk factor"       },
  { key:"q4", q:"Do you have serious problems with your memory?",                    yesScores:true,  hint:"Cognitive impairment"                                     },
  { key:"q5", q:"Do you take more than 3 different medications every day?",          yesScores:true,  hint:"Polypharmacy \u2014 \u22654 meds is an independent risk factor" },
  { key:"q6", q:"Do you have any problems with walking or balance?",                 yesScores:true,  hint:"Functional limitation / fall risk"                        },
];

// ─── PHQ-2 DEPRESSION SCREENING ───────────────────────────────────────────────
// CMS eCQM #134 / NQF-0418 — two-item depression screen validated for ED use.
// Score each item 0-3; total ≥ 3 = positive screen (sensitivity ~83%, spec ~92%).
export const PHQ2_COLORS    = { "0":"#00e5c0", "1":"#f5c842", "2":"#ff9f43", "3":"#ff6b6b" };
export const PHQ2_OPTS      = ["Not at all", "Several days", "More than half the days", "Nearly every day"];
export const PHQ2_QUESTIONS = [
  { key:"phq2q1", q:"Over the past 2 weeks — little interest or pleasure in doing things?" },
  { key:"phq2q2", q:"Over the past 2 weeks — feeling down, depressed, or hopeless?"        },
];

// ─── AUDIT-C ALCOHOL SCREENING ────────────────────────────────────────────────
// MIPS Measure #431 / USPSTF Grade B — 3-item screen for unhealthy alcohol use.
// Each item scored 0-4; positive threshold: ≥ 3 (women) or ≥ 4 (men).
// CAGE is NOT recommended by USPSTF — use AUDIT-C or NIAAA Single Question only.
export const AUDITC_COLORS    = { "0":"#00e5c0", "1":"#7ecbff", "2":"#f5c842", "3":"#ff9f43", "4":"#ff6b6b" };
export const AUDITC_QUESTIONS = [
  { key:"auditcq1", q:"How often do you have a drink containing alcohol?",
    opts:["Never","Monthly or less","2–4 times/month","2–3 times/week","4+ times/week"] },
  { key:"auditcq2", q:"How many standard drinks do you have on a typical drinking day?",
    opts:["1–2","3–4","5–6","7–9","10+"] },
  { key:"auditcq3", q:"How often do you have 6 or more drinks on one occasion?",
    opts:["Never","Less than monthly","Monthly","Weekly","Daily or almost daily"] },
];

// ─── SEPSIS BUNDLE TIMESTAMPS (CMS SEP-1) ────────────────────────────────────
// Three-field lightweight tracker surfaced in the Sepsis tool tab and
// PatientSummaryTab. Each entry is a HH:MM string stamped at time of action.
export const SEPSIS_BUNDLE_ITEMS = [
  { key:"lactateOrdered",       label:"Lactate ordered",             hint:"Initial serum lactate \u2014 \u22654 mmol/L = severe sepsis / septic shock"          },
  { key:"lactateValue",         label:"Initial lactate (mmol/L)",    hint:"Enter value \u2014 \u22652 triggers repeat; \u22654 mandates fluids",  isValue:true  },
  { key:"abxOrdered",           label:"Antibiotics ordered",         hint:"CMS SEP-1: broad-spectrum ABX within 3 hrs of sepsis recognition"                    },
  { key:"fluidsStarted",        label:"30 mL/kg IV fluids started",  hint:"Required if hypotension present or initial lactate \u22654 mmol/L"                   },
  { key:"repeatLactateOrdered", label:"Repeat lactate ordered",      hint:"CEDR 2025: required if initial lactate > 2 mmol/L; target clearance \u226510%"       },
  { key:"repeatLactateValue",   label:"Repeat lactate (mmol/L)",     hint:"Enter value \u2014 clearance = (initial \u2212 repeat) \u00f7 initial \u00d7 100%", isValue:true },
];

// ─── FOLLOW-UP COORDINATION ───────────────────────────────────────────────────
// CEDR 2025 follow-up care coordination measure: requires at least one of —
// (a) specific date/time with provider documented, (b) communication to follow-up
// provider, or (c) hospital-guaranteed follow-up documented in discharge summary.
export const FOLLOW_UP_METHODS = [
  "Appointment scheduled",
  "Referral sent to provider",
  "Patient instructed to call for appointment",
  "Telehealth visit arranged",
  "Hospital follow-up clinic guaranteed",
  "Follow-up via care coordinator",
];

// ─── MDM GRID — AMA CPT 2023 ──────────────────────────────────────────────────
// Three-column grid: COPA | Data | Risk. Final E/M level = highest level
// where at least 2 of 3 columns meet or exceed that level's threshold.

export const MDM_COPA_LEVELS = [
  { key:"minimal",  label:"Minimal",  color:"#8892a4", rank:1,
    desc:"1 self-limited or minor problem",
    emCodes:"99202 / 99212" },
  { key:"low",      label:"Low",      color:"#00e5c0", rank:2,
    desc:"2+ self-limited; or 1 stable chronic condition; or 1 acute uncomplicated illness/injury",
    emCodes:"99203 / 99213" },
  { key:"moderate", label:"Moderate", color:"#f5c842", rank:3,
    desc:"1+ chronic with exacerbation or progression; or undiagnosed new problem with uncertain prognosis; or acute illness with systemic symptoms; or acute complicated injury",
    emCodes:"99204 / 99214" },
  { key:"high",     label:"High",     color:"#ff6b6b", rank:4,
    desc:"1+ chronic with severe exacerbation; or acute/chronic illness posing threat to life or bodily function",
    emCodes:"99205 / 99215" },
];

export const MDM_DATA_CATS = {
  cat1Items: [
    { key:"orderLab",   label:"Ordered and/or reviewed lab result(s)"                                     },
    { key:"orderRad",   label:"Ordered and/or reviewed radiology result(s)"                               },
    { key:"orderOther", label:"Ordered and/or reviewed other diagnostic test(s)"                          },
    { key:"extRecords", label:"Reviewed external records / communicated with treating clinician"           },
    { key:"indepHist",  label:"Obtained independent history from additional source (family, EMS, etc.)"   },
  ],
  cat2Label: "Independent interpretation of a test result not separately reported by another provider",
  cat3Label: "Discussion of management or test interpretation with external provider/specialist",
};

export const MDM_RISK_LEVELS = [
  { key:"minimal",  label:"Minimal",  color:"#8892a4", rank:1,
    examples:"OTC medications, rest, bandages, superficial suture closure" },
  { key:"low",      label:"Low",      color:"#00e5c0", rank:2,
    examples:"Prescription drug management; minor procedures (sutures, splints, IV fluids); lab or imaging ordered" },
  { key:"moderate", label:"Moderate", color:"#f5c842", rank:3,
    examples:"New Rx with minor risk; IV drugs requiring intensive monitoring; closed fracture without manipulation; social determinants of health affecting management; mental health treatment (AMA CPT 2023 Table of Risk)" },
  { key:"high",     label:"High",     color:"#ff6b6b", rank:4,
    examples:"Drug therapy requiring intensive monitoring for toxicity; decision for elective major surgery; diagnosis or treatment significantly limited by social determinants; life-threatening condition" },
];

export const EM_LEVEL_MAP = {
  1: { outpatient:"99202", established:"99212", ed:"99281",       label:"Straightforward",     color:"#8892a4" },
  2: { outpatient:"99203", established:"99213", ed:"99282",       label:"Low Complexity",      color:"#00e5c0" },
  3: { outpatient:"99204", established:"99214", ed:"99283–99284", label:"Moderate Complexity", color:"#f5c842" },
  4: { outpatient:"99205", established:"99215", ed:"99285",       label:"High Complexity",     color:"#ff6b6b" },
};

// Highest rank where ≥2 of 3 MDM columns meet/exceed that rank.
export function computeEMLevel(copa, dataLevel, risk) {
  const rank = { "":0, minimal:1, low:2, moderate:3, high:4 };
  const cols = [rank[copa]||0, rank[dataLevel]||0, rank[risk]||0];
  for (const r of [4,3,2,1]) {
    if (cols.filter(v => v >= r).length >= 2) return r;
  }
  return 0;
}

// AMA 2023 data level from checked categories:
// Limited  = ≥2 Cat1 items OR Cat2
// Moderate = ≥3 Cat1 items OR Cat2 OR Cat3
// High     = ≥2 of the three Moderate categories met
export function computeDataLevel(cat1Keys, hasCat2, hasCat3) {
  const c1 = (cat1Keys||[]).length;
  const metMod = [c1>=3, hasCat2, hasCat3].filter(Boolean).length;
  if (metMod >= 2) return "high";
  if (metMod >= 1) return "moderate";
  if (c1 >= 2 || hasCat2) return "limited";
  return "none";
}

export function buildMDMNarrative(mdmState, mdmDataElements, patientName, patientCC) {
  const copa = MDM_COPA_LEVELS.find(l => l.key === mdmState.copa);
  const risk = MDM_RISK_LEVELS.find(l => l.key === mdmState.risk);
  const emRank = computeEMLevel(mdmState.copa, mdmState.dataLevel, mdmState.risk);
  const emLevel = EM_LEVEL_MAP[emRank];
  const cat1Labels = (mdmState.dataChecks?.cat1||[])
    .map(k => MDM_DATA_CATS.cat1Items.find(i => i.key===k)?.label).filter(Boolean);
  const hasCat2 = mdmState.dataChecks?.cat2 || (mdmDataElements||[]).length > 0;
  const hasCat3 = mdmState.dataChecks?.cat3;
  return [
    `MEDICAL DECISION MAKING — AMA CPT 2023${patientName ? " | " + patientName : ""}${patientCC ? " | " + patientCC : ""}`,
    "",
    "1. NUMBER & COMPLEXITY OF PROBLEMS ADDRESSED (COPA):",
    copa ? `   Level: ${copa.label} — ${copa.desc}` : "   Level: Not specified",
    mdmState.copaRationale ? `   Rationale: ${mdmState.copaRationale}` : "",
    "",
    `2. AMOUNT & COMPLEXITY OF DATA: ${mdmState.dataLevel ? mdmState.dataLevel.charAt(0).toUpperCase()+mdmState.dataLevel.slice(1) : "Not specified"}`,
    ...(cat1Labels.length ? ["   Category 1:", ...cat1Labels.map(l => `     \u2022 ${l}`)] : []),
    ...((mdmDataElements||[]).length ? [
      "   Category 2 — Clinical decision rules applied (AMA CPT 2023 FAQ #36):",
      ...(mdmDataElements||[]).map(e => `     \u2022 ${e.score}: ${e.phrase.slice(0,160).trimEnd()}\u2026`),
    ] : []),
    ...(hasCat2 && !(mdmDataElements||[]).length ? ["   \u2022 Independent interpretation of test result"] : []),
    ...(hasCat3 ? ["   \u2022 Discussion of management with external specialist/clinician"] : []),
    "",
    "3. RISK OF COMPLICATIONS AND/OR MORBIDITY/MORTALITY:",
    risk ? `   Level: ${risk.label} — ${risk.examples}` : "   Level: Not specified",
    mdmState.riskRationale ? `   Rationale: ${mdmState.riskRationale}` : "",
    "",
    emLevel
      ? `FINAL E/M LEVEL: ${emLevel.outpatient}/${emLevel.established} (office) \u00b7 ${emLevel.ed} (ED) \u2014 ${emLevel.label}`
      : "FINAL E/M LEVEL: Pending \u2014 complete all three columns",
    emLevel
      ? `Basis: 2-of-3 AMA CPT 2023 MDM columns meet or exceed the ${emLevel.label} threshold.`
      : "",
    emLevel && emLevel.ed === "99285"
      ? "NOTE: For critically ill patients (ESI 1\u20132), consider critical care codes 99291/99292 if high-complexity decision-making provided to a patient with a critical illness. Critical care requires documented time (\u226530 min) and is billed separately from or instead of the ED E/M."
      : "",
  ].filter(l => l !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── TRIAGE ───────────────────────────────────────────────────────────────────
export const ESI_CFG = [
  { level:1, label:"Immediate",   color:"#ff6b6b", desc:"Life-threatening"     },
  { level:2, label:"Emergent",    color:"#ff9f43", desc:"High-risk / unstable" },
  { level:3, label:"Urgent",      color:"#f5c842", desc:"Stable, 2+ resources" },
  { level:4, label:"Less Urgent", color:"#00e5c0", desc:"1 resource expected"  },
  { level:5, label:"Non-urgent",  color:"#8892a4", desc:"No resources needed"  },
];

// ─── DISPOSITION ──────────────────────────────────────────────────────────────
export const DISPOSITION_OPTS = [
  { val:"discharge",   icon:"\uD83D\uDEAA", label:"Discharge",    color:"#00e5c0", desc:"Home or follow-up care"       },
  { val:"admit",       icon:"\uD83C\uDFE5", label:"Admit",         color:"#3b9eff", desc:"Inpatient admission"           },
  { val:"observation", icon:"\uD83D\uDD0D", label:"Observation",   color:"#f5c842", desc:"Outpatient obs status"         },
  { val:"transfer",    icon:"\uD83D\uDE91", label:"Transfer",       color:"#ff9f43", desc:"Transfer to another facility" },
  { val:"ama",         icon:"\u26A0\uFE0F", label:"AMA",            color:"#ff6b6b", desc:"Against medical advice"       },
  { val:"expired",     icon:"\u2020",       label:"Expired",        color:"#8892a4", desc:"Patient expired in ED"        },
];

// ─── CC SMART TEMPLATES ───────────────────────────────────────────────────────
export const CC_TEMPLATES = [
  {
    id: "chest-pain",   label: "Chest Pain / ACS",          icon: "❤️",  color: "#ff6b6b",
    pattern: /chest.?pain|cp\b|acs\b|angina|nstemi|stemi|cardiac|myocardial/i,
    rosPriority: ["cv","resp","const","gi","msk"],
    pePriority:  ["gen","cv","resp","abd"],
    rosHints: {
      cv:   { pos:["chest pressure/pain","diaphoresis","palpitations"],              neg:["radiation to arm or jaw","exertional component"] },
      resp: { pos:["dyspnea on exertion"],                                            neg:["pleuritic pain","cough","hemoptysis"] },
      gi:   { pos:["nausea"],                                                         neg:["epigastric pain","GERD symptoms"] },
      const:{ pos:["fatigue","diaphoresis"],                                          neg:["fever","chills"] },
      msk:  { pos:[],                                                                 neg:["reproducible chest-wall tenderness","positional pain"] },
    },
    peHints: { gen:"Diaphoresis, pallor, distress level", cv:"S3/S4, rubs, murmurs, JVD, peripheral edema", resp:"Crackles, decreased breath sounds, dullness to percussion", abd:"Epigastric tenderness, pulsatile mass" },
    riskScore: "HEART Pathway",
  },
  {
    id: "dyspnea",      label: "Shortness of Breath",        icon: "🫁",  color: "#3b9eff",
    pattern: /short.?ness.?of.?breath|sob\b|dyspnea|difficulty.?breath|breath.*short|can.?t.?breath/i,
    rosPriority: ["resp","cv","const","allergy","neuro"],
    pePriority:  ["gen","resp","cv","neck"],
    rosHints: {
      resp:   { pos:["dyspnea","orthopnea","PND","wheezing"],              neg:["hemoptysis","pleuritic pain"] },
      cv:     { pos:["chest pain","palpitations","leg swelling"],           neg:["PND","orthopnea — cardiac vs pulmonary"] },
      const:  { pos:["fatigue","fever"],                                    neg:["weight loss","night sweats"] },
      allergy:{ pos:["hives","throat tightness"],                           neg:["recent allergen exposure"] },
      neuro:  { pos:[],                                                     neg:["numbness/tingling","anxiety/panic"] },
    },
    peHints: { gen:"Accessory muscle use, tripod positioning, cyanosis, pursed lips", resp:"Air entry bilaterally, wheeze, crackles, percussion, tactile fremitus", cv:"JVP elevation, S3, murmurs, bilateral pedal edema", neck:"Tracheal deviation, JVD, lymphadenopathy" },
    riskScore: "PERC Rule / Wells PE Score",
  },
  {
    id: "abdominal-pain", label: "Abdominal Pain",           icon: "🫃",  color: "#ff9f43",
    pattern: /abdom|belly.?pain|stomach.?pain|abd.?pain|epigastric|RUQ|LUQ|RLQ|LLQ/i,
    rosPriority: ["gi","gu","const","msk","heme"],
    pePriority:  ["abd","gen","cv","resp"],
    rosHints: {
      gi:   { pos:["nausea","vomiting","diarrhea","constipation","rectal bleeding"], neg:["melena","hematochezia","jaundice","anorexia"] },
      gu:   { pos:["dysuria","hematuria","frequency"],                               neg:["vaginal discharge","LMP","sexual history"] },
      const:{ pos:["fever","chills","fatigue","anorexia"],                           neg:["weight loss","night sweats"] },
      msk:  { pos:["flank pain","back pain"],                                        neg:["psoas sign — right hip extension pain","obturator sign"] },
      heme: { pos:[],                                                                neg:["anticoagulant use","bleeding history"] },
    },
    peHints: { abd:"Tenderness location/guarding/rigidity, Murphy, McBurney, psoas, obturator, Rovsing", gen:"Distress, jaundice, diaphoresis — toxicity level", cv:"Pulsatile mass, femoral/pedal pulses (AAA)", resp:"Referred diaphragmatic pain signs, basilar crackles" },
    riskScore: "STONE Score (if renal colic)",
  },
  {
    id: "headache",     label: "Headache",                   icon: "🧠",  color: "#a29bfe",
    pattern: /headache|head.?pain|\bHA\b|migraine|thunderclap|worst.?headache|neck.?stiff/i,
    rosPriority: ["neuro","const","heent","cv","psych"],
    pePriority:  ["neuro","gen","heent","cv"],
    rosHints: {
      neuro:{ pos:["headache location/quality/onset","photophobia","phonophobia","aura","nausea"], neg:["diplopia","focal weakness","speech change","ataxia","LOC"] },
      const:{ pos:["fever","chills","fatigue"],                                                    neg:["weight loss","night sweats"] },
      heent:{ pos:["neck stiffness","visual changes","eye pain"],                                  neg:["sinus pressure","ear pain","jaw claudication"] },
      cv:   { pos:["hypertension history"],                                                        neg:["exertional headache","palpitations"] },
      psych:{ pos:["anxiety","stress","sleep disturbance"],                                        neg:["depression","new psychiatric symptoms"] },
    },
    peHints: { neuro:"Focal deficits, cranial nerves, cerebellar, Kernig/Brudzinski, fundoscopy (papilledema)", gen:"Meningismus, temperature, diaphoresis, toxicity", heent:"Papilledema, sinus tenderness, temporal artery tenderness", cv:"BP both arms, cardiac rhythm, carotid bruits" },
    riskScore: "Ottawa SAH Rule",
  },
  {
    id: "syncope",      label: "Syncope / Near-syncope",     icon: "⚡",  color: "#f5c842",
    pattern: /syncope|faint|passed.?out|blacked.?out|near.?syncope|\bLOC\b|loss.?of.?consciousness/i,
    rosPriority: ["cv","neuro","const","psych","endo"],
    pePriority:  ["gen","cv","neuro","resp"],
    rosHints: {
      cv:   { pos:["palpitations","chest pain","exertional syncope"],               neg:["diaphoresis prodrome","positional component","prolonged standing"] },
      neuro:{ pos:["aura","post-ictal confusion","focal weakness"],                 neg:["tongue bite","urinary incontinence","seizure activity"] },
      const:{ pos:["fever","fatigue","poor PO intake"],                             neg:["weight loss","night sweats"] },
      psych:{ pos:["anxiety","emotional trigger","hyperventilation"],               neg:["depression","new medication changes"] },
      endo: { pos:["heat exposure","prolonged standing","orthostatic symptoms"],    neg:["hypoglycemia symptoms","insulin use"] },
    },
    peHints: { gen:"Orthostatic VS (supine to standing), pallor, diaphoresis, skin turgor", cv:"Murmurs (AS, HCM), arrhythmia, carotid bruits, orthostatic BP x2", neuro:"Post-event confusion, focal deficits, tongue injury, cerebellar", resp:"Respiratory rate, lung exam — PE signs" },
    riskScore: "SF Syncope Rule / CHESS Criteria",
  },
  {
    id: "altered-ms",   label: "Altered Mental Status",      icon: "🌀",  color: "#fd79a8",
    pattern: /altered|AMS\b|confusion|confus|disoriented|agitat|delirium|encephalopathy|unresponsive/i,
    rosPriority: ["neuro","const","psych","endo","cv"],
    pePriority:  ["neuro","gen","cv","resp"],
    rosHints: {
      neuro:{ pos:["acute confusion","memory changes","speech changes"],             neg:["focal weakness","seizure activity","headache"] },
      const:{ pos:["fever","fatigue","recent infection"],                            neg:["weight loss","night sweats"] },
      psych:{ pos:["psychiatric history","medication non-compliance","drug/ETOH use"],neg:["new psychosis","recent stressors"] },
      endo: { pos:["diabetes","insulin use","thyroid history"],                      neg:["polyuria","polydipsia","temperature dysregulation"] },
      cv:   { pos:["stroke risk factors","palpitations"],                            neg:["chest pain","hypoxia symptoms"] },
    },
    peHints: { neuro:"GCS, orientation x4, focal deficits, cranial nerves, reflexes, asterixis", gen:"Temperature, diaphoresis, jaundice, signs of liver disease", cv:"Arrhythmia, BP, JVD, signs of CHF", resp:"Oxygenation, accessory muscles, cyanosis, aspiration signs" },
  },
  {
    id: "back-pain",    label: "Back / Flank Pain",          icon: "🦴",  color: "#00cec9",
    pattern: /back.?pain|flank.?pain|low.?back|lumbar|renal.?colic|kidney.?stone/i,
    rosPriority: ["msk","gu","neuro","const","gi"],
    pePriority:  ["msk","abd","neuro","gen"],
    rosHints: {
      msk:  { pos:["back pain quality/radiation","positional component"],            neg:["bilateral leg weakness/numbness","saddle anesthesia","bowel or bladder dysfunction — cauda equina"] },
      gu:   { pos:["hematuria","dysuria","colicky flank pain","nausea/vomiting"],    neg:["urinary incontinence","vaginal discharge"] },
      neuro:{ pos:["radicular pain","paresthesia","lower extremity weakness"],       neg:["saddle anesthesia","bowel or bladder dysfunction"] },
      const:{ pos:["fever","chills","fatigue"],                                      neg:["weight loss","night sweats — malignancy flag"] },
      gi:   { pos:["nausea","vomiting"],                                             neg:["rectal bleeding","bowel habit changes"] },
    },
    peHints: { msk:"CVA tenderness, spinal percussion, SLR, Patrick/FABER, paraspinal spasm", abd:"Pulsatile abdominal mass, femoral pulses — AAA screen if age > 50", neuro:"Motor/sensation lower extremities, DTRs, rectal tone if indicated", gen:"Diaphoresis + pallor (AAA), fever + CVA tenderness (pyelonephritis)" },
    riskScore: "Ottawa Back Rules / STONE Score",
  },
  {
    id: "fever-sepsis", label: "Fever / Sepsis",             icon: "🌡️", color: "#e17055",
    pattern: /fever|sepsis|bacteremia|febrile|hypertherm|septic/i,
    rosPriority: ["const","resp","gi","gu","skin"],
    pePriority:  ["gen","resp","abd","skin"],
    rosHints: {
      const:{ pos:["fever","chills","rigors","fatigue","myalgias"],          neg:["weight loss","night sweats — TB/malignancy"] },
      resp: { pos:["cough","productive sputum","dyspnea","pleuritic pain"],   neg:["hemoptysis"] },
      gi:   { pos:["nausea","vomiting","diarrhea","RUQ/abdominal pain"],      neg:["rectal bleeding","jaundice — hepatobiliary source"] },
      gu:   { pos:["dysuria","frequency","flank pain","pelvic pain"],         neg:["vaginal/urethral discharge — STI"] },
      skin: { pos:["rash","wound drainage","cellulitis"],                     neg:["petechiae/purpura — meningococcemia","joint erythema"] },
    },
    peHints: { gen:"Temperature, diaphoresis, rigors, toxicity level, altered mentation", resp:"Consolidation signs, crackles, decreased breath sounds, effusion", abd:"RUQ tenderness (cholecystitis), suprapubic (UTI), peritoneal signs", skin:"Rash character/distribution, petechiae, wound, cellulitis borders" },
    riskScore: "qSOFA / SIRS Criteria",
  },
  {
    id: "palpitations", label: "Palpitations",               icon: "💓", color: "#ff7675",
    pattern: /palpitat|racing.?heart|irregular.?heart|heart.?flutter|\bSVT\b|\bafib\b|a-fib|tachycardia/i,
    rosPriority: ["cv","const","neuro","psych","endo"],
    pePriority:  ["gen","cv","resp","neuro"],
    rosHints: {
      cv:   { pos:["palpitation character/onset","chest pain","dyspnea","presyncope/syncope"], neg:["associated diaphoresis","exertional component"] },
      const:{ pos:["fatigue"],                                                                  neg:["weight loss","heat intolerance — thyroid"] },
      neuro:{ pos:["lightheadedness","near-syncope"],                                           neg:["focal weakness","headache"] },
      psych:{ pos:["anxiety","panic","stimulant/caffeine use","stress"],                        neg:["depression","new psychiatric symptoms"] },
      endo: { pos:["thyroid symptoms","tremor","heat intolerance"],                             neg:["polyuria","polydipsia"] },
    },
    peHints: { gen:"Diaphoresis, tremor, exophthalmos, thyroid enlargement", cv:"Rate, rhythm, murmurs (mitral valve prolapse), orthostatic VS", resp:"Pulmonary edema signs — decompensated heart failure", neuro:"Tremor, anxiety signs, reflexes (hyperreflexia in thyrotoxicosis)" },
    riskScore: "CHADS2-VASc (if afib confirmed)",
  },
  {
    id: "stroke",       label: "Stroke / TIA",               icon: "🧠",  color: "#6c5ce7",
    pattern: /stroke|\bTIA\b|\bCVA\b|facial.?droop|arm.?weak|speech.?change|\bFAST\b|transient.?ischemic/i,
    rosPriority: ["neuro","cv","heent","const"],
    pePriority:  ["neuro","gen","cv","heent"],
    rosHints: {
      neuro:{ pos:["sudden focal weakness","speech change","facial droop","vision change","ataxia","dizziness"], neg:["headache","LOC","seizure activity"] },
      cv:   { pos:["afib history","hypertension","hyperlipidemia","diabetes"],                                  neg:["chest pain","palpitations — cardiac embolism source"] },
      heent:{ pos:["vision changes","diplopia","dysarthria"],                                                   neg:["eye pain","tinnitus","hearing loss"] },
      const:{ pos:["fatigue"],                                                                                  neg:["fever — infectious mimic","recent infection"] },
    },
    peHints: { neuro:"NIHSS — facial droop, arm/leg drift, grip, gait, speech, vision fields, nystagmus", gen:"BP both arms (dissection), temperature", cv:"Irregular rhythm (afib), carotid bruits, cardiac murmurs", heent:"Visual field cut, conjugate gaze preference, nystagmus, dysarthria" },
    riskScore: "NIHSS / ABCD2 Score",
  },
  {
    id: "allergic-reaction", label: "Allergic Reaction / Anaphylaxis", icon: "🌿", color: "#00b894",
    pattern: /allergic|anaphylaxis|anaphylactic|hives|urticaria|angioedema|allergic.?reaction/i,
    rosPriority: ["allergy","resp","skin","cv","gi"],
    pePriority:  ["gen","skin","resp","cv"],
    rosHints: {
      allergy:{ pos:["known allergen exposure","hives","itching","angioedema"],  neg:["throat tightness/stridor","prior anaphylaxis — risk factor"] },
      resp:   { pos:["throat tightness","stridor","dyspnea","wheezing"],         neg:["cough","hemoptysis"] },
      skin:   { pos:["hives","diffuse pruritus","flushing","erythema"],          neg:["localized reaction only — low severity"] },
      cv:     { pos:["hypotension","lightheadedness","syncope","palpitations"],  neg:["chest pain"] },
      gi:     { pos:["nausea","vomiting","abdominal cramping","diarrhea"],       neg:["rectal bleeding"] },
    },
    peHints: { gen:"Distress, diaphoresis, altered mentation — severity grading (Anaphylaxis Grade I-IV)", skin:"Urticaria distribution, angioedema location/extent (lip, tongue, oropharynx)", resp:"Stridor, wheeze, air entry, accessory muscles, O2 saturation", cv:"HR, BP, capillary refill, JVD — hemodynamic compromise" },
  },
  {
    id: "urinary",      label: "Urinary Symptoms / UTI",     icon: "🔵",  color: "#74b9ff",
    pattern: /dysuria|\bUTI\b|urinary.?tract|frequency.?urgency|urgency.?frequency|burning.?urin|urinary.?infection|pyelo/i,
    rosPriority: ["gu","const","gi","msk"],
    pePriority:  ["abd","gen","msk"],
    rosHints: {
      gu:   { pos:["dysuria","urgency","frequency","hematuria","pelvic pain","flank pain"], neg:["vaginal/urethral discharge","sexual history","LMP"] },
      const:{ pos:["fever","chills","fatigue"],                                             neg:["weight loss","night sweats"] },
      gi:   { pos:["nausea","vomiting","lower abdominal pain"],                            neg:["diarrhea","rectal bleeding"] },
      msk:  { pos:["flank pain","back pain"],                                              neg:["CVA tenderness — pyelonephritis vs uncomplicated UTI"] },
    },
    peHints: { abd:"Suprapubic tenderness (cystitis), CVA tenderness (pyelonephritis), costovertebral angle", gen:"Fever, toxicity level — pyelonephritis vs uncomplicated UTI vs urosepsis", msk:"Bilateral CVA percussion tenderness" },
  },
  {
    id: "trauma",       label: "Trauma / Injury",            icon: "🤕",  color: "#fdcb6e",
    pattern: /trauma|injury|fall|\bMVC\b|motor.?vehicle|assault|laceration|fracture|accident/i,
    rosPriority: ["msk","neuro","const","cv","resp"],
    pePriority:  ["gen","msk","neuro","resp"],
    rosHints: {
      msk:  { pos:["pain location/quality","swelling","deformity","mechanism of injury"],   neg:["neurovascular compromise distal","compartment symptoms"] },
      neuro:{ pos:["LOC — duration","amnesia — retrograde/anterograde","headache"],         neg:["focal weakness","neck pain — c-spine precaution"] },
      const:{ pos:["nausea/vomiting post-head injury"],                                     neg:["fever — delayed presentation"] },
      cv:   { pos:["chest pain with thoracic trauma","palpitations"],                       neg:["hypotension — hemorrhagic shock"] },
      resp: { pos:["dyspnea with thoracic trauma","rib pain"],                             neg:["hemoptysis","decreased breath sounds (PTX/hemothorax)"] },
    },
    peHints: { gen:"ABCDE primary survey, diaphoresis, pallor, shock signs", msk:"Deformity, tenderness, ROM, neurovascular status distal to injury", neuro:"GCS, AVPU, focal deficits, c-spine tenderness — NEXUS criteria", resp:"Rib tenderness, breath sounds bilaterally, tracheal position" },
    riskScore: "GCS / PECARN / Ottawa Rules",
  },
  {
    id: "seizure",      label: "Seizure",                    icon: "⚡",  color: "#a29bfe",
    pattern: /seizure|convulsion|post.?ictal|epilepsy|epileptic|tonic.?clonic/i,
    rosPriority: ["neuro","const","psych","endo","cv"],
    pePriority:  ["neuro","gen","cv","resp"],
    rosHints: {
      neuro:{ pos:["seizure characterization (type/duration)","aura","post-ictal confusion","tongue bite","urinary incontinence"], neg:["focal weakness/deficit","baseline mental status","previous seizure history"] },
      const:{ pos:["fever","fatigue","recent illness"],                                                                            neg:["weight loss","night sweats"] },
      psych:{ pos:["medication non-compliance","alcohol/drug withdrawal","recent stimulant use"],                                  neg:["psychiatric history changes","new psychosis"] },
      endo: { pos:["diabetes","insulin use","hypoglycemia episodes"],                                                             neg:["thyroid history","electrolyte history"] },
      cv:   { pos:["palpitations before event","prior syncope"],                                                                  neg:["cardiac history","pacemaker"] },
    },
    peHints: { neuro:"Post-ictal state, GCS trajectory, focal deficits, tongue/cheek laceration", gen:"Temperature, meningismus, diaphoresis — infectious etiology", cv:"Rhythm, BP, orthostatic — cardiac syncope mimic", resp:"Aspiration signs, O2 saturation, secretions" },
  },
];

export function getTemplateForCC(ccText) {
  if (!ccText || ccText.length < 3) return null;
  return CC_TEMPLATES.find(t => t.pattern.test(ccText)) || null;
}

// ─── DISCHARGE INSTRUCTIONS ───────────────────────────────────────────────────
export const DC_SECTIONS = [
  { key:"visit_summary",           icon:"📋", label:"Visit Summary",         color:"#3b9eff",  hint:"What brought you in and what was found and done" },
  { key:"medications_instructions", icon:"💊", label:"Your Medications",       color:"#f5c842",  hint:"What to take, what is new, what to stop" },
  { key:"return_precautions",       icon:"⚠️", label:"Return to ED If\u2026",  color:"#ff6b6b",  hint:"Warning signs \u2014 seek emergency care immediately" },
  { key:"follow_up",                icon:"📅", label:"Follow-up Appointments", color:"#00e5c0",  hint:"Who to see and when" },
  { key:"activity_diet",            icon:"🏃", label:"Activity & Diet",        color:"#9b6dff",  hint:"What you can and cannot do at home" },
  { key:"additional_care",          icon:"🩹", label:"Additional Care",        color:"#ff9f43",  hint:"Wound care, devices, condition-specific home instructions" },
];

export function buildDCPrompt(demo, cc, vitals, medications, allergies, pmhSelected, disposition, dispReason, consults, lang, followUp = null) {
  const pmhList = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).slice(0, 8).join(", ");
  const followupSvcs = (consults || []).filter(c => c.status === "completed").map(c => c.service).join(", ");
  const langLine = lang === "simple"
    ? "Write at a 6th-grade reading level. Use very short sentences. No medical jargon — if a medical term is unavoidable, define it immediately in plain English. Use 'you' and 'your' throughout."
    : "Write clearly for an adult patient. Use plain, direct language. Minimal jargon. Use 'you' and 'your'. Brief and actionable.";
  const followUpLine = followUp?.provider
    ? `STRUCTURED FOLLOW-UP (CEDR documented): ${followUp.provider}${followUp.specialty ? " — " + followUp.specialty : ""}${followUp.date ? ", on " + followUp.date : ""}. Method: ${followUp.method || "appointment scheduled"}.`
    : "";
  return [
    "You are writing discharge instructions for a patient leaving the emergency department.",
    langLine,
    "Return ONLY valid JSON with exactly these 6 keys: visit_summary, medications_instructions, return_precautions, follow_up, activity_diet, additional_care.",
    "Each value is a plain string. Use short paragraphs or \u2022 bullets (the literal bullet character). No markdown, no headers inside values. 2-5 sentences or bullets per section.",
    "",
    `PATIENT: ${[demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Patient"}, ${demo.age || "?"}y${demo.sex ? " " + demo.sex : ""}.`,
    cc.text    ? `CHIEF COMPLAINT: ${cc.text}.`                                                             : "",
    cc.hpi     ? `HPI SUMMARY: ${cc.hpi.slice(0, 240)}.`                                                    : "",
    cc.onset   ? `Onset: ${cc.onset}.`                                                                       : "",
    `DISPOSITION: ${disposition || "discharge"}.${dispReason ? " Reason: " + dispReason.slice(0, 120) : ""}`,
    (vitals.bp || vitals.hr) ? `DISCHARGE VITALS: BP ${vitals.bp || "-"}  HR ${vitals.hr || "-"}  SpO2 ${vitals.spo2 || "-"}  T ${vitals.temp || "-"}.` : "",
    allergies.length    ? `ALLERGIES: ${allergies.join(", ")}.`                                              : "ALLERGIES: NKDA.",
    medications.length  ? `CURRENT MEDICATIONS: ${medications.slice(0, 10).join("; ")}.`                    : "MEDICATIONS: None listed.",
    pmhList             ? `PMH: ${pmhList}.`                                                                 : "",
    followupSvcs        ? `FOLLOW-UP SPECIALISTS ARRANGED: ${followupSvcs}.`                                : "",
    followUpLine,
    "",
    "Guidance per section:",
    "visit_summary: In 2-3 sentences, explain what condition was evaluated, key findings, and what was done or tested. No technical lab values.",
    "medications_instructions: List what medications to continue, any changes or new prescriptions discussed, and what to stop. Include allergy reminder if allergies documented. Use bullets.",
    "return_precautions: Give 4-6 SPECIFIC warning signs for this patient's condition that should prompt immediate return to the ED. Be precise — tailor to the CC, not generic.",
    followUpLine
      ? `follow_up: Use the structured follow-up data provided above (provider, specialty, date, method). Write 2-3 sentences confirming the appointment details and what to expect.`
      : "follow_up: Recommend follow-up timing and with whom (PCP and/or specialists). Incorporate any consult services listed above.",
    "activity_diet: Cover activity restrictions, rest, diet, fluids, driving restrictions, and return-to-work/school guidance relevant to this visit.",
    "additional_care: Any wound care, device instructions, or home care advice specific to this encounter. If nothing specific applies, give practical general wellness guidance.",
  ].filter(Boolean).join("\n");
}

export function buildSectionPrompt(sectionKey, sectionLabel, demo, cc, vitals, medications, allergies, disposition, lang) {
  const langLine = lang === "simple"
    ? "Write at a 6th-grade reading level. Very short sentences. No medical jargon. Define any medical terms immediately."
    : "Write clearly for an adult patient. Plain language. Brief and actionable. Use 'you' and 'your'.";
  const ctx = [
    `Patient: ${[demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Patient"}, ${demo.age || "?"}y${demo.sex ? " " + demo.sex : ""}.`,
    cc.text        ? `CC: ${cc.text}.`                            : "",
    `Disposition: ${disposition || "discharge"}.`,
    allergies.length  ? `Allergies: ${allergies.join(", ")}.`    : "NKDA.",
    medications.length ? `Meds: ${medications.slice(0, 6).join("; ")}.` : "",
  ].filter(Boolean).join(" ");
  return [
    langLine,
    `Write ONLY the "${sectionLabel}" section of discharge instructions for this patient.`,
    `Context: ${ctx}`,
    `Return ONLY JSON: { "${sectionKey}": "your text here" }`,
    "Use \u2022 bullets if listing items. No markdown. 2-5 items or sentences maximum.",
  ].join("\n");
}

// ─── NURSING ──────────────────────────────────────────────────────────────────
export const NURSING_ROLES = ["RN","LPN","Tech","MA","Other"];

export const NURSING_IVX = [
  { cat:"IV Access",      col:"#3b9eff", items:["IV 18g","IV 20g","IV 22g","IV 24g","IO access","PICC accessed","Midline accessed"] },
  { cat:"Airway / O2",    col:"#00e5c0", items:["Room air","Nasal cannula","Simple mask","Non-rebreather","Venturi","CPAP","BiPAP","Bag-valve-mask","ETT — intubated & secured"] },
  { cat:"Monitoring",     col:"#f5c842", items:["12-lead ECG","Continuous telemetry","Pulse oximetry","ETCO2","Continuous BP cuff","Foley catheter","NG/OG tube"] },
  { cat:"Labs / Imaging", col:"#a29bfe", items:["CBC / CMP","Coags","Type & screen","Blood cultures \xd7 2","Urinalysis","POC glucose","POC lactate","CXR","ECG transmitted"] },
  { cat:"Medications",    col:"#ff9f43", items:["Medication given — per order","NS bolus 1L","NS lock flush","Antiemetic","Analgesic","PRN med given"] },
  { cat:"Patient Care",   col:"#fd79a8", items:["HOB 30\xb0","HOB 45\xb0","Left lateral","Supine/flat","Oral suction","Repositioned q2h","Family notified","Interpreter","Education given"] },
];

// ─── MEDIA ATTACHMENTS ────────────────────────────────────────────────────────
export const MEDIA_CATEGORIES = [
  { label:"Wound / Laceration",  icon:"🩸", col:"#ff6b6b" },
  { label:"Rash / Dermatology",  icon:"🌿", col:"#00b894" },
  { label:"ECG Strip",           icon:"❤️", col:"#ff7675" },
  { label:"Imaging / X-ray",     icon:"🔬", col:"#74b9ff" },
  { label:"Burn",                icon:"🔥", col:"#e17055" },
  { label:"Orthopedic",          icon:"🦴", col:"#a29bfe" },
  { label:"Eye Exam",            icon:"👁️", col:"#00cec9" },
  { label:"IV / Line Site",      icon:"💉", col:"#3b9eff" },
  { label:"Before Procedure",    icon:"📋", col:"#f5c842" },
  { label:"After Procedure",     icon:"✅", col:"#00e5c0" },
  { label:"Vascular",            icon:"🔵", col:"#6c5ce7" },
  { label:"Other",               icon:"📎", col:"#8892a4" },
];

export const BODY_REGIONS = [
  "Head / Scalp","Face","Forehead","Periorbital","Nose","Mouth / Oral","Ear",
  "Neck","Chest","Upper back","Abdomen","Flank","Low back","Pelvis",
  "Shoulder","Upper arm","Elbow","Forearm","Wrist","Hand","Finger(s)",
  "Hip","Thigh","Knee","Lower leg","Ankle","Foot","Toe(s)",
  "Groin","Sacrum / Gluteal","Perineum","Bilateral / Multiple","Other",
];