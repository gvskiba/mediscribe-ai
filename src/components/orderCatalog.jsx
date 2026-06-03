// orderCatalog.js — single source of truth for the ED order + drug catalog.
// Plain JavaScript module (no React, no JSX). Consumed by:
//   • EDOrderHub.jsx              (composer + queue)
//   • CommandCenter OrdersTab     (in-board order entry)  → replaces ROC_INLINE
//   • CommandCenter RapidOrderDrawer (board rapid entry)  → replaces ROC
// Import path convention: "@/components/orderCatalog" (match across all consumers).
//
// IMPORTANT — clinical data integrity:
// Do NOT re-type the dose strings. The SIMPLE and DRUGS arrays below are paste
// slots. Move them VERBATIM out of your already-tested EDOrderHub.jsx so no
// weight-based dose math is re-keyed by hand.

// ── Text-builder helpers (order text / CPOE bridge) ─────────────────────────
// These back every drug scenario's build() function. Lakonyx-branded footer.
const BAR = "\u2501".repeat(46);
const ts = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const fmt = (n) => Math.round(n).toLocaleString();
const pad = (s, n = 12) => s.padEnd(n, " ");
const bline = (k, v) => `${pad(k + ":")} ${v}`;
export const buildBlock = (name, rows, note) => {
  const body = rows.map(([k, v]) => bline(k, v)).join("\n");
  return `${BAR}\n${body}${note ? `\n${BAR}\n\u26A0  ${note}` : ""}\n${BAR}\n[Lakonyx Order Generator \u00B7 ${ts()}]`;
};

// ── Allergy map (labels only — no dose math, safe to define here) ───────────
export const AMAP = {
  contrast: { name: "Iodinated Contrast", sev: "Moderate", reaction: "Urticaria" },
  codeine:  { name: "Codeine",            sev: "Mild",     reaction: "Nausea/Vomiting" },
  pcn:      { name: "Penicillin",         sev: "SEVERE",   reaction: "Anaphylaxis" },
};
export const getAllergyWarn = (o) => {
  if (o && o.alert && AMAP[o.alert]) return AMAP[o.alert];
  if (o && o.contrast && AMAP.contrast) return AMAP.contrast;
  return null;
};

// ── Category meta (medication catalog grouping) ─────────────────────────────
export const CAT_META = {
  cardiac:  { label: "Cardiac",                    color: "#ff6b6b" },
  rhythm:   { label: "Arrhythmia",                 color: "#f5c842" },
  pressors: { label: "Vasopressors",               color: "#ff9f43" },
  abx:      { label: "Antibiotics",                color: "#00e5c0" },
  sedation: { label: "RSI / Sedation",             color: "#9b6dff" },
  pain:     { label: "Analgesia",                  color: "#3b9eff" },
  psych:    { label: "Psych / Behavioral Health",  color: "#9b6dff" },
  support:  { label: "Supportive",                 color: "#3dffa0" },
};

// ── NON-MEDICATION ORDERS (labs / imaging / procedures / consults) ──────────
// PASTE EDOrderHub.jsx's exact `SIMPLE` array contents below, verbatim.
// (Just the array literal entries — the `export const SIMPLE = [` wrapper is here.)
export const SIMPLE = [
  { id: "l_trop",  cat: "labs", sub: "Cardiac",    icon: "\u2764\uFE0F", name: "Troponin-I (High Sensitivity)",      detail: "Serial q3h \u00B7 NSTEMI protocol",        meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_bnp",   cat: "labs", sub: "Cardiac",    icon: "\u2764\uFE0F", name: "BNP (B-Natriuretic Peptide)",        detail: "Heart failure marker",                meta: "~45 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_ckmb",  cat: "labs", sub: "Cardiac",    icon: "\u2764\uFE0F", name: "CK-MB",                              detail: "Cardiac isoenzyme",                   meta: "~45 min",            priority: "URGENT",  alert: null,       contrast: false },
  { id: "l_bmp",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "BMP (Basic Metabolic Panel)",        detail: "Na, K, Cl, CO\u2082, BUN, Cr, Glu",   meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_cmp",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "CMP (Comprehensive Metabolic)",      detail: "Full metabolic + LFTs",               meta: "~45 min",            priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_mg",    cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "Magnesium (Serum)",                  detail: "Electrolyte monitoring",              meta: "~30 min",            priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_lac",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "Lactate (Serum)",                    detail: "Perfusion / shock marker",            meta: "~25 min",            priority: "URGENT",  alert: null,       contrast: false },
  { id: "l_a1c",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDE78", name: "HbA1c",                              detail: "Diabetes monitoring",                 meta: "~2 hr",              priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_bhcg",  cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDE78", name: "\u03B2-hCG (Quantitative)",          detail: "Pregnancy test",                      meta: "~45 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_ua",    cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "Urinalysis + Culture",               detail: "UTI, pyelo, renal eval",              meta: "~30 min / 48h Cx",   priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_etoh",  cat: "labs", sub: "Tox/Psych",  icon: "\uD83E\uDDEA", name: "Ethanol Level (Serum)",              detail: "Quantitative ETOH \u00B7 toxicology", meta: "~45 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_utox",  cat: "labs", sub: "Tox/Psych",  icon: "\uD83E\uDDEA", name: "Urine Drug Screen (Comprehensive)",  detail: "Multi-panel UDS \u00B7 immunoassay",  meta: "~60 min",            priority: "URGENT",  alert: null,       contrast: false },
  { id: "l_tsh",   cat: "labs", sub: "Tox/Psych",  icon: "\uD83E\uDDEA", name: "TSH (Thyroid Stimulating Hormone)",  detail: "Thyroid function \u2014 AMS, agitation workup", meta: "~2 hr",     priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_cbc",   cat: "labs", sub: "Hematology", icon: "\uD83E\uDE78", name: "CBC with Differential",              detail: "Complete blood count + diff",         meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_coag",  cat: "labs", sub: "Hematology", icon: "\uD83E\uDE78", name: "PT / INR / PTT",                     detail: "PTT goal 60\u2013100 on heparin",     meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_type",  cat: "labs", sub: "Hematology", icon: "\uD83E\uDE78", name: "Type & Screen",                      detail: "Blood bank \u00B7 pre-procedure",     meta: "Blood Bank",         priority: "URGENT",  alert: null,       contrast: false },
  { id: "i_cxr",   cat: "imaging", sub: "X-Ray", icon: "\uD83E\uDEC1", name: "Chest X-Ray PA / Lateral",            detail: "Cardiomegaly, pulm edema, effusion",  meta: "XR \u00B7 ~15 min",  priority: "STAT",    alert: null,       contrast: false },
  { id: "i_tte",   cat: "imaging", sub: "Echo",  icon: "\u2764\uFE0F", name: "Echocardiogram (TTE)",                detail: "LV function, wall motion, EF",        meta: "Echo \u00B7 ~45 min", priority: "URGENT", alert: null,      contrast: false },
  { id: "i_ctpe",  cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Pulmonary Angiography",            detail: "R/O pulmonary embolism",              meta: "CT W \u00B7 ~30 min", priority: "STAT",   alert: "contrast", contrast: true },
  { id: "i_ctca",  cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Coronary Angiography",             detail: "Non-invasive coronary imaging",       meta: "CT W \u00B7 ~45 min", priority: "URGENT", alert: "contrast", contrast: true },
  { id: "i_cthead",cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Head (Non-Contrast)",              detail: "R/O ICH, stroke, mass",               meta: "CT \u00B7 ~20 min",  priority: "STAT",    alert: null,       contrast: false },
  { id: "i_ctabd", cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Abdomen / Pelvis",                 detail: "Acute abdomen, appy, diverticulitis", meta: "CT W/WO \u00B7 ~30 min", priority: "URGENT", alert: "contrast", contrast: true },
  { id: "p_ecg",   cat: "procedures", sub: "Cardiac",    icon: "\u26A1",     name: "12-Lead ECG",                  detail: "ST changes, rhythm eval",             meta: "~5 min \u00B7 Bedside", priority: "STAT",   alert: null, contrast: false },
  { id: "p_ecg_s", cat: "procedures", sub: "Cardiac",    icon: "\u26A1",     name: "Serial 12-Lead ECG (q4h \u00D7 3)", detail: "NSTEMI monitoring protocol",      meta: "~5 min each",        priority: "URGENT", alert: null, contrast: false },
  { id: "p_tele",  cat: "procedures", sub: "Monitoring", icon: "\uD83D\uDCE1", name: "Continuous Cardiac Telemetry", detail: "Real-time arrhythmia monitoring",     meta: "Ongoing",            priority: "STAT",   alert: null, contrast: false },
  { id: "p_o2",    cat: "procedures", sub: "Monitoring", icon: "\uD83D\uDCA8", name: "Supplemental O\u2082 \u2014 2L NC", detail: "SpO\u2082 target \u2265 94%",      meta: "Ongoing",            priority: "STAT",   alert: null, contrast: false },
  { id: "p_iv2",   cat: "procedures", sub: "Access",     icon: "\uD83D\uDC89", name: "Peripheral IV \u00D7 2 Large Bore", detail: "18G+ \u2014 antecubital preferred", meta: "Bedside",          priority: "STAT",   alert: null, contrast: false },
  { id: "p_1to1",  cat: "procedures", sub: "Safety",     icon: "\uD83D\uDEE1\uFE0F", name: "1:1 Nursing Observation",  detail: "Continuous monitoring \u2014 behavioral health", meta: "Ongoing",  priority: "STAT",   alert: null, contrast: false },
  { id: "p_rest",  cat: "procedures", sub: "Safety",     icon: "\uD83D\uDD12", name: "Soft Restraints (4-point)",    detail: "PRN agitation \u2014 document Q15 min", meta: "PRN \u00B7 Ongoing", priority: "URGENT", alert: null, contrast: false },
  { id: "c_cards", cat: "consults", sub: "Medical",    icon: "\uD83E\uDE7A", name: "Cardiology Consult",            detail: "NSTEMI mgmt, cath lab decision",      meta: "URGENT",             priority: "URGENT",  alert: null, contrast: false },
  { id: "c_surg",  cat: "consults", sub: "Medical",    icon: "\uD83E\uDE7A", name: "General Surgery Consult",       detail: "Acute abdomen, appendicitis eval",    meta: "URGENT",             priority: "URGENT",  alert: null, contrast: false },
  { id: "c_neuro", cat: "consults", sub: "Medical",    icon: "\uD83E\uDE7A", name: "Neurology Consult",             detail: "Stroke eval, seizure management",     meta: "STAT",               priority: "STAT",    alert: null, contrast: false },
  { id: "c_psych", cat: "consults", sub: "Behavioral", icon: "\uD83E\uDDE0", name: "Psychiatry Consult",            detail: "Capacity eval, disposition, safety plan", meta: "URGENT",         priority: "URGENT",  alert: null, contrast: false },
  { id: "c_addx",  cat: "consults", sub: "Behavioral", icon: "\uD83E\uDD1D", name: "Addiction Medicine / SBIRT",    detail: "ETOH / opioid use \u2014 treatment linkage", meta: "ROUTINE",      priority: "ROUTINE", alert: null, contrast: false },
  { id: "c_pharm", cat: "consults", sub: "Support",    icon: "\uD83D\uDC8A", name: "Pharmacy Consult",              detail: "Drip adjustment, med reconcile",      meta: "ROUTINE",            priority: "ROUTINE", alert: null, contrast: false },
  { id: "c_sw",    cat: "consults", sub: "Support",    icon: "\uD83E\uDD1D", name: "Social Work Consult",           detail: "Disposition, resources, safety",      meta: "ROUTINE",            priority: "ROUTINE", alert: null, contrast: false },
];

// ── MEDICATION CATALOG (weight-based dosing builders) ───────────────────────
// MOVE EDOrderHub.jsx's exact `DRUGS` array entries into the slot below,
// VERBATIM. In your EDOrderHub source, select everything between the
// `const DRUGS=[` opening bracket and its closing `];` (the 44 drug objects,
// including all the `// ── Cardiac ──` style comments) and paste it here,
// replacing the placeholder line.
//
// No edits needed after pasting:
//   • Each entry's scenarios[].build() calls buildBlock(...) / fmt(...), which
//     are exported from this file above — they resolve automatically.
//   • The CPOE footer rebrands from "[Notrya ...]" to
//     "[Lakonyx Order Generator ...]" for free, because the build() functions
//     use THIS file's buildBlock.
//
// Do NOT retype the dose strings by hand. This must be a copy, so every dose,
// max, and weight coefficient is preserved exactly as in your tested source.
export const DRUGS = [
  /* ⟨⟨ MOVE EDOrderHub's 44 DRUGS entries here, verbatim — see note above ⟩⟩ */
];

// ── Selectors (the shared API every order surface calls) ────────────────────
export const ALL_ORDERS = () => [...SIMPLE, ...DRUGS];
export const getSimple = (id) => SIMPLE.find((o) => o.id === id);
export const getDrug = (id) => DRUGS.find((d) => d.id === id);
export const getOrder = (id) => getSimple(id) || getDrug(id);
export const drugsByCategory = (cat) => DRUGS.filter((d) => d.cat === cat);

// Unified search across both order types. Returns tagged results so a caller
// can render meds and simple orders differently.
export const searchCatalog = (query) => {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const inText = (...parts) => parts.some((p) => (p || "").toLowerCase().includes(q));
  const simple = SIMPLE.filter((o) => inText(o.name, o.detail, o.sub)).map((o) => ({ ...o, _type: "simple" }));
  const drugs = DRUGS.filter((d) => inText(d.name, d.sub)).map((d) => ({ ...d, _type: "drug" }));
  return [...simple, ...drugs];
};

// Build the CPOE order text for a drug id at a given weight (kg), scenario index.
// Centralizes the "which scenario" + "what weight" logic so every surface that
// wants order text calls one function instead of reaching into scenarios[].
export const buildOrderText = (drugId, weightKg = 70, scenarioIdx = 0) => {
  const d = getDrug(drugId);
  if (!d || !d.scenarios || !d.scenarios.length) return "";
  const sc = d.scenarios[scenarioIdx] || d.scenarios[0];
  return sc.build(parseFloat(weightKg) || 70);
};