import { useEffect, useRef } from "react";

/*
  ccsKit - shared kit for the Command Center spine.
  Tokens, surface contract, keyboard hook, sample data, atoms, tier geometry,
  and hub registry. Imported by ccsSurfaces and by the CommandCenterSpine page.
  Loading this module also injects the web fonts once.
  Base44-safe: straight quotes only, ASCII only, no Router/localStorage/form/alert.
*/

/* ---------------------------------------- fonts (load once) ---------------------------------------- */
(function () {
  if (typeof document === "undefined") return;
  var id = "lx-fonts";
  if (document.getElementById(id)) return;
  var l = document.createElement("link");
  l.id = id;
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
})();


const T = {
  bg: "#050f1e",
  panel: "#081628",
  card: "#0b1e36",
  cardHi: "#0e2747",
  border: "rgba(26,53,85,0.5)",
  borderHi: "rgba(0,229,192,0.55)",
  teal: "#00e5c0",
  gold: "#f5c842",
  coral: "#ff6b6b",
  purple: "#9b6dff",
  orange: "#ff9f43",
  red: "#ff4444",
  blue: "#6b9fff",
  bright: "#eaf2ff",
  txt: "#c6d6ef",
  dim: "#7c93b3",
  faint: "#4a607f",
  serif: "'Playfair Display', serif",
  sans: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ---------------------------------------- surface contract (unchanged from build 1) ----------------------------------------
   key -> surface id. Extend here; nothing else needs to change. */
const SURFACE_KEYS = {
  o: "orders",
  n: "note",
  l: "labs",
  i: "imaging",
  a: "allergies",
  h: "hub",
  v: "vitals",
  p: "patient",
  t: "triage",
};

/* How each surface renders, so the stub can label its tier. */
const SURFACE_META = {
  orders: { label: "Orders", tier: "half-sheet" },
  note: { label: "Note", tier: "dock" },
  labs: { label: "Labs", tier: "popover" },
  imaging: { label: "Imaging", tier: "popover" },
  allergies: { label: "Allergies detail", tier: "popover" },
  hub: { label: "Clinical Hub", tier: "takeover" },
  vitals: { label: "Vitals trend", tier: "popover" },
  patient: { label: "Patient info", tier: "popover" },
  triage: { label: "Nurse triage note", tier: "popover" },
};

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

/* ---------------------------------------- keyboard layer (the rule, enforced in code) ----------------------------------------
   Bare single keys summon. Esc always heads back to the board, but
   only after the focus guard has had its turn. Arrow Up/Down move the
   board selection. The one modifier combo is the palette (Cmd/Ctrl+K),
   handled with (metaKey || ctrlKey) so both OSes work with no branch. */
function useCommandKeys({ onSurface, onEscape, onPalette, onNav, enabled = true }) {
  const cb = useRef({ onSurface, onEscape, onPalette, onNav });
  cb.current = { onSurface, onEscape, onPalette, onNav };

  useEffect(() => {
    if (!enabled) return undefined;
    function onKeyDown(e) {
      // Command palette: the one cross-platform combo.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (cb.current.onPalette) cb.current.onPalette();
        return;
      }
      // Escape: always offered; the handler protects typing first.
      if (e.key === "Escape") {
        if (cb.current.onEscape) cb.current.onEscape(e);
        return;
      }
      // From here on, bare keys only. Never fire while typing or modified.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(document.activeElement)) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (cb.current.onNav) cb.current.onNav(e.key === "ArrowDown" ? 1 : -1);
        return;
      }

      const key = e.key.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(SURFACE_KEYS, key)) {
        e.preventDefault();
        if (cb.current.onSurface) cb.current.onSurface(SURFACE_KEYS[key]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

/* ---------------------------------------- sample data (config, not entities - swapped for Patient.list later) */
const COLUMNS = [
  { id: "waiting", title: "Waiting", sub: "To be seen" },
  { id: "active", title: "In Progress", sub: "Active workup" },
  { id: "dispo", title: "Disposition", sub: "Boarding / leaving" },
];

const ACUITY = {
  1: { color: T.red, tone: "Resuscitation" },
  2: { color: T.orange, tone: "Emergent" },
  3: { color: T.gold, tone: "Urgent" },
  4: { color: T.teal, tone: "Less urgent" },
  5: { color: T.blue, tone: "Nonurgent" },
};

const PATIENTS = [
  { id: "p1", room: "T1", name: "Alvarez, Marco", age: 58, sex: "M", mrn: "0049213", cc: "Chest pain", esi: 2, col: "active", status: "WORKUP", wait: 41, allergies: ["Penicillin", "Aspirin"] },
  { id: "p2", room: "T2", name: "Booker, Dawn", age: 71, sex: "F", mrn: "0051880", cc: "Syncope", esi: 2, col: "active", status: "WORKUP", wait: 33, allergies: [] },
  { id: "p3", room: "WR", name: "Cho, Linda", age: 24, sex: "F", mrn: "0058102", cc: "Ankle injury", esi: 4, col: "waiting", status: "NEW", wait: 18, allergies: ["Latex"] },
  { id: "p4", room: "WR", name: "Diaz, Hector", age: 9, sex: "M", mrn: "0058777", cc: "Fever", esi: 3, col: "waiting", status: "NEW", wait: 12, allergies: [] },
  { id: "p5", room: "WR", name: "Engel, Ruth", age: 83, sex: "F", mrn: "0042009", cc: "Weakness", esi: 3, col: "waiting", status: "NEW", wait: 27, allergies: ["Sulfa", "Codeine", "Iodine"] },
  { id: "p6", room: "R3", name: "Foster, Jamal", age: 46, sex: "M", mrn: "0060115", cc: "Abdominal pain", esi: 3, col: "active", status: "RESULTS", wait: 64, allergies: [] },
  { id: "p7", room: "R5", name: "Greer, Tanya", age: 36, sex: "F", mrn: "0055431", cc: "Asthma", esi: 3, col: "active", status: "TX", wait: 22, allergies: ["NSAIDs"] },
  { id: "p8", room: "H1", name: "Holt, Eugene", age: 67, sex: "M", mrn: "0039220", cc: "Sepsis", esi: 2, col: "dispo", status: "ADMIT", wait: 188, allergies: ["Vancomycin"] },
  { id: "p9", room: "H2", name: "Im, Soo-jin", age: 52, sex: "F", mrn: "0061004", cc: "Renal colic", esi: 3, col: "dispo", status: "DC", wait: 96, allergies: [] },
];

/* Flattened, column-ordered list - drives arrow-key selection order. */
const ORDER = COLUMNS.flatMap((c) => PATIENTS.filter((p) => p.col === c.id).map((p) => p.id));

/* Order catalog for the orders surface (config; becomes an entity/order set later). */
const ORDER_CATALOG = [
  { id: "cbc", cat: "Lab", label: "CBC with differential" },
  { id: "bmp", cat: "Lab", label: "Basic metabolic panel" },
  { id: "cmp", cat: "Lab", label: "Comprehensive metabolic panel" },
  { id: "trop", cat: "Lab", label: "Troponin, high-sensitivity" },
  { id: "lactate", cat: "Lab", label: "Lactate" },
  { id: "vbg", cat: "Lab", label: "Venous blood gas" },
  { id: "lipase", cat: "Lab", label: "Lipase" },
  { id: "ua", cat: "Lab", label: "Urinalysis, reflex culture" },
  { id: "coags", cat: "Lab", label: "PT / INR / PTT" },
  { id: "ddimer", cat: "Lab", label: "D-dimer" },
  { id: "bcx", cat: "Lab", label: "Blood cultures x2" },
  { id: "cxr", cat: "Imaging", label: "Chest X-ray, portable" },
  { id: "ecg", cat: "Imaging", label: "ECG, 12-lead" },
  { id: "cth", cat: "Imaging", label: "CT head without contrast" },
  { id: "ctap", cat: "Imaging", label: "CT abdomen / pelvis with contrast" },
  { id: "cta", cat: "Imaging", label: "CTA chest, PE protocol" },
  { id: "usruq", cat: "Imaging", label: "Ultrasound, right upper quadrant" },
  { id: "xr", cat: "Imaging", label: "X-ray, extremity" },
  { id: "apap", cat: "Med", label: "Acetaminophen 1 g PO" },
  { id: "ibu", cat: "Med", label: "Ibuprofen 600 mg PO" },
  { id: "zofran", cat: "Med", label: "Ondansetron 4 mg IV" },
  { id: "morphine", cat: "Med", label: "Morphine 4 mg IV" },
  { id: "toradol", cat: "Med", label: "Ketorolac 15 mg IV" },
  { id: "ctx", cat: "Med", label: "Ceftriaxone 1 g IV" },
  { id: "nsbolus", cat: "Med", label: "Normal saline 1 L bolus" },
  { id: "asa", cat: "Med", label: "Aspirin 324 mg PO chewed" },
  { id: "iv", cat: "Nursing", label: "Establish IV access" },
  { id: "monitor", cat: "Nursing", label: "Continuous cardiac monitor" },
  { id: "npo", cat: "Nursing", label: "NPO" },
];

const CAT_COLOR = { Lab: T.teal, Imaging: T.purple, Med: T.gold, Nursing: T.blue };
const CATALOG_BY_ID = ORDER_CATALOG.reduce((m, o) => { m[o.id] = o; return m; }, {});

/* Nurse triage notes, keyed by patient id (read-only surface content). */
const TRIAGE_BY_ID = {
  p1: { arrival: "Ambulatory", arrTime: "13:42", triTime: "13:51", nurse: "RN K. Pham", ccQuote: "Pressure in my chest, came on an hour ago", vitals: { hr: 98, bp: "158/92", rr: 20, spo2: 96, temp: 98.4, pain: 7 }, narrative: "Substernal pressure radiating to left arm, onset ~1 hr while mowing. Diaphoretic on arrival. Denies SOB at rest.", screens: [{ label: "Sepsis screen", result: "Negative" }, { label: "Stroke (BEFAST)", result: "Negative" }, { label: "Fall risk", result: "Low" }] },
  p2: { arrival: "EMS", arrTime: "14:05", triTime: "14:09", nurse: "RN D. Cole", ccQuote: "I passed out in the kitchen", vitals: { hr: 62, bp: "104/64", rr: 16, spo2: 98, temp: 98.1, pain: 0 }, narrative: "Witnessed syncope at home with brief LOC, no head strike per spouse. Alert and oriented on arrival.", screens: [{ label: "Fall risk", result: "High", flag: true }, { label: "Stroke (BEFAST)", result: "Negative" }, { label: "Cardiac monitor", result: "Applied" }] },
  p3: { arrival: "Ambulatory", arrTime: "13:30", triTime: "13:48", nurse: "RN K. Pham", ccQuote: "Rolled my ankle at soccer", vitals: { hr: 78, bp: "122/76", rr: 16, spo2: 99, temp: 98.6, pain: 5 }, narrative: "Inversion injury to right ankle during recreational soccer. Limited weightbearing, lateral swelling. Neurovascularly intact distally.", screens: [{ label: "Fall risk", result: "Low" }, { label: "Sepsis screen", result: "Negative" }] },
  p4: { arrival: "Ambulatory", arrTime: "14:18", triTime: "14:30", nurse: "RN J. Ortiz", ccQuote: "He has had a fever for two days", vitals: { hr: 118, bp: "100/62", rr: 22, spo2: 98, temp: 102.3, pain: 3 }, narrative: "9 y/o with 2 days fever and cough, PO intake fair, last antipyretic 4 hrs ago. Playful in waiting room.", screens: [{ label: "Pediatric sepsis screen", result: "Negative" }, { label: "Fall risk", result: "Standard peds" }] },
  p5: { arrival: "Family", arrTime: "13:15", triTime: "13:42", nurse: "RN D. Cole", ccQuote: "She just has no strength lately", vitals: { hr: 88, bp: "142/80", rr: 18, spo2: 95, temp: 98.0, pain: 0 }, narrative: "83 y/o with generalized weakness x3 days and decreased PO intake. Baseline ambulates with walker. No focal deficit at triage.", screens: [{ label: "Fall risk", result: "High", flag: true }, { label: "Stroke (BEFAST)", result: "Negative" }, { label: "Delirium (b-CAM)", result: "Negative" }] },
  p6: { arrival: "Ambulatory", arrTime: "13:55", triTime: "14:12", nurse: "RN K. Pham", ccQuote: "Bad pain on the right side of my belly", vitals: { hr: 92, bp: "134/82", rr: 18, spo2: 98, temp: 99.1, pain: 8 }, narrative: "RLQ pain since morning with nausea, no BM x2 days, no vomiting. Pain worse with movement.", screens: [{ label: "Sepsis screen", result: "Negative" }, { label: "Fall risk", result: "Low" }] },
  p7: { arrival: "Ambulatory", arrTime: "14:22", triTime: "14:28", nurse: "RN J. Ortiz", ccQuote: "My asthma is acting up, can't catch my breath", vitals: { hr: 104, bp: "128/78", rr: 24, spo2: 93, temp: 98.5, pain: 0 }, narrative: "Audible wheeze, used home albuterol x3 without relief. Speaking in short phrases. Known asthmatic.", screens: [{ label: "Sepsis screen", result: "Negative" }, { label: "Respiratory distress", result: "Moderate", flag: true }] },
  p8: { arrival: "EMS", arrTime: "11:02", triTime: "11:08", nurse: "RN D. Cole", ccQuote: "Family says he is confused and hot", vitals: { hr: 116, bp: "92/54", rr: 24, spo2: 92, temp: 101.8, pain: 4 }, narrative: "Fever with new confusion, indwelling foley from SNF. Hypotensive and tachycardic on arrival. Sepsis bundle initiated at triage.", screens: [{ label: "Sepsis screen", result: "POSITIVE", flag: true }, { label: "Fall risk", result: "High", flag: true }, { label: "Stroke (BEFAST)", result: "Negative" }] },
  p9: { arrival: "Ambulatory", arrTime: "12:40", triTime: "12:58", nurse: "RN J. Ortiz", ccQuote: "Worst flank pain of my life", vitals: { hr: 96, bp: "138/86", rr: 18, spo2: 99, temp: 98.7, pain: 9 }, narrative: "Left flank pain radiating to groin with gross hematuria. Prior history of kidney stones. Unable to find comfortable position.", screens: [{ label: "Sepsis screen", result: "Negative" }, { label: "Fall risk", result: "Low" }] },
};

/* Triage vital thresholds -> abnormal flag (marked with color AND a trailing * so it never relies on color alone). */
function vitalFlag(key, v) {
  if (key === "hr") return v > 100 || v < 60;
  if (key === "rr") return v > 20 || v < 10;
  if (key === "spo2") return v < 94;
  if (key === "temp") return v > 100.4 || v < 96.5;
  if (key === "pain") return v >= 7;
  return false;
}

/* Resulted labs, keyed by patient id. flag is "H", "L", or "" (text, colorblind-safe). */
const LABS_BY_ID = {
  p1: [
    { name: "Troponin hs", value: "18", unit: "ng/L", ref: "<14", flag: "H" },
    { name: "Potassium", value: "4.1", unit: "mmol/L", ref: "3.5-5.1", flag: "" },
    { name: "Creatinine", value: "1.0", unit: "mg/dL", ref: "0.7-1.3", flag: "" },
    { name: "Hemoglobin", value: "14.2", unit: "g/dL", ref: "13.5-17.5", flag: "" },
  ],
  p6: [
    { name: "WBC", value: "13.8", unit: "K/uL", ref: "4.0-11.0", flag: "H" },
    { name: "Lipase", value: "44", unit: "U/L", ref: "13-60", flag: "" },
    { name: "Lactate", value: "1.6", unit: "mmol/L", ref: "0.5-2.0", flag: "" },
  ],
  p8: [
    { name: "Lactate", value: "4.2", unit: "mmol/L", ref: "0.5-2.0", flag: "H" },
    { name: "WBC", value: "18.6", unit: "K/uL", ref: "4.0-11.0", flag: "H" },
    { name: "Creatinine", value: "1.9", unit: "mg/dL", ref: "0.7-1.3", flag: "H" },
    { name: "Bicarbonate", value: "18", unit: "mmol/L", ref: "22-29", flag: "L" },
  ],
  p9: [
    { name: "Creatinine", value: "1.1", unit: "mg/dL", ref: "0.7-1.3", flag: "" },
    { name: "Urine RBC", value: "many", unit: "/hpf", ref: "0-3", flag: "H" },
  ],
};

/* Imaging studies, keyed by patient id. status is Final / Prelim / Pending. */
const IMAGING_BY_ID = {
  p1: [{ study: "ECG, 12-lead", status: "Final", impression: "Sinus rhythm, no acute ST changes." }, { study: "Chest X-ray, portable", status: "Prelim", impression: "No acute cardiopulmonary process." }],
  p3: [{ study: "X-ray, right ankle", status: "Final", impression: "No acute fracture. Soft tissue swelling laterally." }],
  p6: [{ study: "CT abdomen / pelvis with contrast", status: "Pending", impression: "Acquisition complete, awaiting read." }],
  p8: [{ study: "Chest X-ray, portable", status: "Final", impression: "Right lower lobe opacity, concerning for pneumonia." }],
};

/* Allergen detail lookup (reaction + severity), reused across patients. */
const ALLERGY_DETAIL = {
  Penicillin: { reaction: "Hives", severity: "Moderate" },
  Aspirin: { reaction: "Angioedema", severity: "Severe" },
  Sulfa: { reaction: "Rash", severity: "Mild" },
  Codeine: { reaction: "Nausea", severity: "Mild" },
  Iodine: { reaction: "Urticaria", severity: "Moderate" },
  Latex: { reaction: "Contact dermatitis", severity: "Mild" },
  NSAIDs: { reaction: "Bronchospasm", severity: "Severe" },
  Vancomycin: { reaction: "Red man syndrome", severity: "Moderate" },
};

/* Synthesize a short, plausible trend from a current numeric value (no per-patient trend data). */
function trendFrom(cur) {
  const n = typeof cur === "number" ? cur : parseFloat(cur);
  if (isNaN(n)) return [cur, cur, cur];
  const step = Math.max(1, Math.round(Math.abs(n) * 0.05));
  return [n - step * 2, n - step, n];
}

/* ---------------------------------------- primitives ---------------------------------------- */
function AcuityBadge({ esi }) {
  const a = ACUITY[esi] || ACUITY[3];
  return (
    <div
      title={a.tone}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: a.color + "1f",
        border: "1.5px solid " + a.color,
        color: a.color,
        fontFamily: T.mono,
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {esi}
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: T.dim,
        background: "rgba(124,147,179,0.12)",
        border: "1px solid " + T.border,
        borderRadius: 5,
        padding: "2px 6px",
      }}
    >
      {status}
    </span>
  );
}

function AllergyChip({ allergies, compact }) {
  const has = allergies && allergies.length > 0;
  const bg = has ? "rgba(255,68,68,0.10)" : "rgba(0,229,192,0.08)";
  const bd = has ? "rgba(255,68,68,0.45)" : "rgba(0,229,192,0.30)";
  const fg = has ? T.coral : T.teal;
  const label = has ? "ALLERGY" : "NKDA";
  const body = has ? allergies.join(", ") : "No known drug allergies";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: bg,
        border: "1px solid " + bd,
        borderRadius: 8,
        padding: compact ? "4px 8px" : "6px 12px",
        maxWidth: compact ? 220 : 360,
      }}
    >
      <span style={{ fontFamily: T.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", color: fg, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: has ? T.bright : T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {body}
      </span>
    </div>
  );
}


/* ---------------------------------------- tier geometry ---------------------------------------- */
function tierStyle(tier) {
  const base = { position: "fixed", background: T.card, border: "1px solid " + T.borderHi, boxShadow: "0 20px 60px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" };
  if (tier === "half-sheet") return { ...base, top: 0, right: 0, bottom: 0, width: "min(440px, 42vw)", borderRadius: "14px 0 0 14px" };
  if (tier === "dock") return { ...base, left: 0, right: 0, bottom: 0, height: "42vh", borderRadius: "14px 14px 0 0" };
  if (tier === "takeover") return { ...base, inset: 24, borderRadius: 16 };
  // popover
  return { ...base, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(420px, 80vw)", borderRadius: 14 };
}


/* ---------------------------------------- hub registry ---------------------------------------- */
const HUBS = [
  { id: "chestpain", name: "Chest Pain", cat: "Cardiac", mark: "CP", desc: "HEART score, ACS pathway, dispo" },
  { id: "ecg", name: "ECG", cat: "Cardiac", mark: "EKG", desc: "Intervals, ischemia, tox patterns" },
  { id: "cardiacrisk", name: "Cardiac Risk", cat: "Cardiac", mark: "CR", desc: "Risk scores and stratification" },
  { id: "airway", name: "Airway / RSI", cat: "Resp", mark: "AW", desc: "RSI dosing, NIV, vent setup" },
  { id: "sepsis", name: "Sepsis", cat: "Infectious", mark: "SEP", desc: "Bundle timer, lactate, antibiotics" },
  { id: "id", name: "Infectious Dz", cat: "Infectious", mark: "ID", desc: "Empiric antibiotics by source" },
  { id: "abdpain", name: "Abdominal Pain", cat: "Abdominal", mark: "AB", desc: "DDx, imaging, surgical flags" },
  { id: "tox", name: "Toxicology", cat: "Tox", mark: "TOX", desc: "Antidotes, nomograms, decontam" },
  { id: "neuro", name: "Neuro / Stroke", cat: "Neuro", mark: "NEU", desc: "BEFAST, tPA window, NIHSS" },
  { id: "peds", name: "Pediatrics", cat: "Peds", mark: "PED", desc: "Weight-based dosing, peds vitals" },
  { id: "ortho", name: "Orthopedics", cat: "MSK", mark: "ORT", desc: "Reduction, splinting, X-ray rules" },
  { id: "electrolyte", name: "Electrolytes / ABG", cat: "Metabolic", mark: "LYT", desc: "Repletion, stepwise acid-base" },
  { id: "labinterp", name: "Lab Interpreter", cat: "Diagnostics", mark: "LAB", desc: "Pattern-based lab read" },
  { id: "imaginginterp", name: "Imaging Interpreter", cat: "Diagnostics", mark: "IMG", desc: "Read assist and follow-up" },
  { id: "pocus", name: "POCUS", cat: "Procedures", mark: "US", desc: "Protocols and interpretation" },
  { id: "emtala", name: "EMTALA", cat: "Compliance", mark: "LAW", desc: "Transfer and MSE compliance" },
];

const HUB_CAT_COLOR = {
  Cardiac: T.coral, Resp: T.teal, Infectious: T.orange, Abdominal: T.gold,
  Tox: T.orange, Neuro: T.purple, Peds: T.blue, MSK: T.gold,
  Metabolic: T.teal, Diagnostics: T.purple, Procedures: T.teal, Compliance: T.dim,
};

const HUB_BY_ID = HUBS.reduce((m, h) => { m[h.id] = h; return m; }, {});

/* Surface the hubs relevant to a chief complaint (the suggestHubs pattern). */
function suggestHubs(cc) {
  const c = (cc || "").toLowerCase();
  const map = [
    { kw: "chest", ids: ["chestpain", "ecg", "cardiacrisk"] },
    { kw: "syncope", ids: ["ecg", "cardiacrisk", "neuro"] },
    { kw: "abdominal", ids: ["abdpain", "pocus", "imaginginterp"] },
    { kw: "renal", ids: ["abdpain", "imaginginterp", "pocus"] },
    { kw: "fever", ids: ["peds", "id", "sepsis"] },
    { kw: "sepsis", ids: ["sepsis", "id", "labinterp"] },
    { kw: "weakness", ids: ["neuro", "electrolyte", "labinterp"] },
    { kw: "asthma", ids: ["airway"] },
    { kw: "ankle", ids: ["ortho", "imaginginterp"] },
    { kw: "injury", ids: ["ortho", "imaginginterp"] },
  ];
  for (let i = 0; i < map.length; i++) {
    if (c.indexOf(map[i].kw) >= 0) return map[i].ids;
  }
  return [];
}


export {
  T, SURFACE_KEYS, SURFACE_META, isEditable, useCommandKeys,
  COLUMNS, ACUITY, PATIENTS, ORDER, ORDER_CATALOG, CAT_COLOR, CATALOG_BY_ID,
  TRIAGE_BY_ID, vitalFlag, LABS_BY_ID, IMAGING_BY_ID, ALLERGY_DETAIL, trendFrom,
  AcuityBadge, StatusPill, AllergyChip, tierStyle,
  HUBS, HUB_CAT_COLOR, HUB_BY_ID, suggestHubs,
};