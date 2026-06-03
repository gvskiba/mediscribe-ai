import { useEffect, useRef, useState, useCallback } from "react";

/*
  CommandCenterSpine - build 7: every surface real.

  Build 1 wiring; build 2 banner + board; build 3 orders half-sheet; build 5
  triage popover + note dock; build 6 completed the popover tier (labs, imaging,
  allergies, vitals, patient). Build 7 adds the last tier - the clinical hub
  takeover (h): a full-screen launcher into the decision hubs, the patient's
  complaint-relevant hubs surfaced first, still summoned and dismissed with Esc
  rather than navigated to. With this, all nine keys drive real surfaces. The
  banner, board, keyboard contract, and focus guard are unchanged.

  NOTE: this is the last build that fits the single-file budget. The h takeover
  build is where surfaces move into their own component files.

  Base44-safe: single file, default export, no Router, no localStorage,
  no <form>, no alert(), straight quotes only, no non-ASCII glyphs.
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

/* ---------------------------------------- tokens ---------------------------------------- */
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

function PatientCard({ p, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        background: selected ? T.cardHi : T.card,
        border: "1px solid " + (selected ? T.borderHi : T.border),
        boxShadow: selected ? "0 0 0 1px " + T.borderHi + ", 0 6px 18px rgba(0,0,0,0.35)" : "none",
        borderRadius: 10,
        padding: 11,
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AcuityBadge esi={p.esi} />
        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.teal, minWidth: 26 }}>{p.room}</span>
        <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.bright, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: T.sans, fontSize: 12, color: T.txt, flex: 1 }}>{p.cc}</span>
        <StatusPill status={p.status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.dim, fontFamily: T.mono, fontSize: 10.5 }}>
        <span>{p.age}{p.sex}</span>
        <span>MRN {p.mrn}</span>
        <span style={{ marginLeft: "auto", color: p.wait > 120 ? T.orange : T.faint }}>{p.wait}m</span>
      </div>
    </button>
  );
}

/* ---------------------------------------- banner: the always-on layer (never summoned, never dismissed) */
function Banner({ patient, clock }) {
  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 18px",
        background: T.panel,
        borderBottom: "1px solid " + T.border,
        zIndex: 50,
      }}
    >
      {/* mark + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(0,229,192,0.18), rgba(245,200,66,0.12))",
            border: "1px solid " + T.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: T.serif,
            fontWeight: 900,
            fontSize: 15,
            color: T.gold,
            letterSpacing: "-0.02em",
          }}
        >
          LX
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 15, color: T.bright, lineHeight: 1 }}>Command Center</div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginTop: 2 }}>SPINE / FRAME TEST</div>
        </div>
      </div>

      <div style={{ width: 1, height: 34, background: T.border, flexShrink: 0 }} />

      {/* selected patient identity */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
        {patient ? (
          <>
            <AcuityBadge esi={patient.esi} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 16, color: T.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {patient.name}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, padding: "1px 7px", borderRadius: 5, border: "1px solid " + T.border }}>
                  {patient.room}
                </span>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, marginTop: 2 }}>
                {patient.age}{patient.sex} &nbsp;/&nbsp; MRN {patient.mrn} &nbsp;/&nbsp; {patient.cc}
              </div>
            </div>
          </>
        ) : (
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>
            No patient selected. Click a card or use the arrow keys.
          </span>
        )}
      </div>

      {/* always-visible allergy chip - the Epic fix lives here */}
      {patient && <AllergyChip allergies={patient.allergies} />}

      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, flexShrink: 0, marginLeft: 4 }}>{clock}</span>
    </header>
  );
}

/* ---------------------------------------- board: three columns of cards ---------------------------------------- */
function Board({ selectedId, onSelect }) {
  return (
    <main style={{ flex: 1, minHeight: 0, display: "flex", gap: 12, padding: 14, overflow: "hidden" }}>
      {COLUMNS.map((col) => {
        const rows = PATIENTS.filter((p) => p.col === col.id);
        return (
          <section
            key={col.id}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              background: T.panel,
              border: "1px solid " + T.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "11px 14px",
                borderBottom: "1px solid " + T.border,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 14, color: T.bright }}>{col.title}</span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal }}>{rows.length}</span>
              <span style={{ fontFamily: T.sans, fontSize: 11, color: T.dim, marginLeft: "auto" }}>{col.sub}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 10 }}>
              {rows.map((p) => (
                <PatientCard key={p.id} p={p} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

/* ---------------------------------------- surface stub (styled by tier; real content is a later build) */
function tierStyle(tier) {
  const base = { position: "fixed", background: T.card, border: "1px solid " + T.borderHi, boxShadow: "0 20px 60px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" };
  if (tier === "half-sheet") return { ...base, top: 0, right: 0, bottom: 0, width: "min(440px, 42vw)", borderRadius: "14px 0 0 14px" };
  if (tier === "dock") return { ...base, left: 0, right: 0, bottom: 0, height: "42vh", borderRadius: "14px 14px 0 0" };
  if (tier === "takeover") return { ...base, inset: 24, borderRadius: 16 };
  // popover
  return { ...base, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(420px, 80vw)", borderRadius: 14 };
}

function SurfaceStub({ id, patient, depth, onClose }) {
  const meta = SURFACE_META[id] || { label: id, tier: "popover" };
  return (
    <div style={{ ...tierStyle(meta.tier), zIndex: 100 + depth }}>
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>{meta.label}</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, border: "1px solid " + T.border, borderRadius: 5, padding: "2px 7px" }}>
          {meta.tier}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, textAlign: "center" }}>
        <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>Stub surface - real content lands in a later build.</span>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.teal }}>
          {patient ? patient.name + " / " + patient.room : "No patient selected"}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------- orders surface (first real surface) ----------------------------------------
   A right half-sheet that summons over the frame. Search the catalog, toggle
   orders into a pending tray, then Sign - which closes the sheet so the loop
   ends on the board. Self-contained: lift this verbatim into its own component
   file later. Keyboard: ArrowUp/Down move the highlight, Enter toggles the
   highlighted order, Cmd/Ctrl+Enter signs. The global hook ignores arrows while
   a surface is open, so there is no collision; typing in the search field is
   protected by the same focus guard the board uses. */
function OrdersSurface({ patient, depth, onClose }) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState([]);
  const [hi, setHi] = useState(0);
  const [signed, setSigned] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ORDER_CATALOG.filter((o) => o.label.toLowerCase().indexOf(q) >= 0 || o.cat.toLowerCase().indexOf(q) >= 0)
    : ORDER_CATALOG;

  useEffect(() => {
    setHi((h) => Math.max(0, Math.min(h, Math.max(0, filtered.length - 1))));
  }, [filtered.length]);

  const toggle = useCallback((id) => {
    setPending((p) => (p.indexOf(id) >= 0 ? p.filter((x) => x !== id) : p.concat(id)));
  }, []);

  const sign = useCallback(() => {
    setPending((p) => {
      if (p.length > 0) setSigned(true);
      return p;
    });
  }, []);

  useEffect(() => {
    if (!signed) return undefined;
    const t = setTimeout(() => onClose(), 950);
    return () => clearTimeout(t);
  }, [signed, onClose]);

  // local keyboard for the sheet; mirrors current values through a ref so the
  // window listener only needs to mount once.
  const st = useRef({ filtered, hi, toggle, sign });
  st.current = { filtered, hi, toggle, sign };
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        st.current.sign();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHi((h) => Math.min(st.current.filtered.length - 1, h + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHi((h) => Math.max(0, h - 1));
        return;
      }
      if (e.key === "Enter") {
        const item = st.current.filtered[st.current.hi];
        if (item) {
          e.preventDefault();
          st.current.toggle(item.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sheet = { ...tierStyle("half-sheet"), zIndex: 100 + depth };

  return (
    <div style={sheet}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>Orders</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>

      {/* search */}
      <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: "1px solid " + T.border }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter orders (e.g. trop, CT, zofran)"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: T.bg,
            border: "1px solid " + T.border,
            borderRadius: 8,
            padding: "8px 11px",
            color: T.bright,
            fontFamily: T.sans,
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* catalog */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "8px 10px" }}>
        {filtered.length === 0 && (
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, padding: 16, textAlign: "center" }}>No matching orders.</div>
        )}
        {filtered.map((o, idx) => {
          const added = pending.indexOf(o.id) >= 0;
          const isHi = idx === hi;
          const c = CAT_COLOR[o.cat] || T.teal;
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              onMouseEnter={() => setHi(idx)}
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                marginBottom: 5,
                borderRadius: 8,
                background: added ? "rgba(0,229,192,0.10)" : isHi ? T.cardHi : "transparent",
                border: "1px solid " + (added ? T.borderHi : isHi ? T.border : "transparent"),
              }}
            >
              <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: c, border: "1px solid " + c + "66", borderRadius: 4, padding: "2px 5px", flexShrink: 0, minWidth: 52, textAlign: "center" }}>
                {o.cat.toUpperCase()}
              </span>
              <span style={{ fontFamily: T.sans, fontSize: 13, color: T.bright, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.label}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: added ? T.teal : T.faint, flexShrink: 0 }}>
                {added ? "added" : "+"}
              </span>
            </button>
          );
        })}
      </div>

      {/* pending tray */}
      {pending.length > 0 && (
        <div style={{ flexShrink: 0, borderTop: "1px solid " + T.border, padding: "10px 12px", maxHeight: "26vh", overflow: "auto" }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 7 }}>
            PENDING ({pending.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pending.map((id) => {
              const o = CATALOG_BY_ID[id];
              if (!o) return null;
              return (
                <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.card, border: "1px solid " + T.border, borderRadius: 7, padding: "4px 6px 4px 9px" }}>
                  <span style={{ fontFamily: T.sans, fontSize: 12, color: T.txt }}>{o.label}</span>
                  <button onClick={() => toggle(id)} style={{ cursor: "pointer", background: "transparent", border: "none", color: T.coral, fontFamily: T.mono, fontSize: 13, lineHeight: 1, padding: "0 2px" }}>
                    x
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* sign bar */}
      <div style={{ flexShrink: 0, borderTop: "1px solid " + T.border, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>Cmd / Ctrl + Enter</span>
        <button
          onClick={sign}
          disabled={pending.length === 0}
          style={{
            marginLeft: "auto",
            cursor: pending.length === 0 ? "default" : "pointer",
            background: pending.length === 0 ? "rgba(0,229,192,0.10)" : T.teal,
            color: pending.length === 0 ? T.faint : T.bg,
            border: "none",
            borderRadius: 9,
            padding: "9px 18px",
            fontFamily: T.sans,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {pending.length === 0 ? "Sign orders" : "Sign " + pending.length + " order" + (pending.length === 1 ? "" : "s")}
        </button>
      </div>

      {/* signed confirmation, then auto-return to the board */}
      {signed && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,15,30,0.92)", borderRadius: "14px 0 0 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 20, color: T.teal }}>Signed {pending.length} order{pending.length === 1 ? "" : "s"}</div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>Returning to the board.</div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------- note dock (first real dock) ----------------------------------------
   A bottom dock that summons over the lower ~42vh while the board stays visible
   above it - the point of the dock tier: you keep the board in view while you
   document. APSO section tabs, a per-section editor, and quick-phrase chips.
   Save shows a brief confirmation, then closes back to the board. The AI draft
   control is a stub here; it is where InvokeLLM plugs in once PHI-safe. Editing
   happens in a real textarea, so the global focus guard protects it: letters do
   not summon, and the first Esc blurs before the second Esc closes the dock. */
const APSO = [
  { id: "A", label: "Assessment" },
  { id: "P", label: "Plan" },
  { id: "S", label: "Subjective" },
  { id: "O", label: "Objective" },
];

const NOTE_PHRASES = {
  A: ["Acute, uncomplicated presentation", "Differential includes", "Clinically stable at this time"],
  P: ["Workup as ordered above", "Reassess after intervention", "Disposition pending results", "Shared decision-making discussed"],
  S: ["Patient reports", "Denies fever, chills, or night sweats", "Symptoms began", "No similar episodes previously"],
  O: ["Alert, no acute distress", "Exam notable for", "Vitals reviewed and within stated ranges"],
};

function NoteDock({ patient, depth, onClose }) {
  const [section, setSection] = useState("A");
  const [text, setText] = useState({ A: "", P: "", S: "", O: "" });
  const [saved, setSaved] = useState(false);

  const append = useCallback((phrase) => {
    setText((t) => {
      const cur = t[section] || "";
      const joined = cur && !cur.endsWith("\n") && !cur.endsWith(" ") ? cur + " " + phrase : cur + phrase;
      return { ...t, [section]: joined };
    });
  }, [section]);

  const save = useCallback(() => {
    setSaved(true);
  }, []);

  useEffect(() => {
    if (!saved) return undefined;
    const t = setTimeout(() => onClose(), 950);
    return () => clearTimeout(t);
  }, [saved, onClose]);

  const sheet = { ...tierStyle("dock"), zIndex: 100 + depth };
  const body = text[section] || "";
  const filled = APSO.filter((s) => (text[s.id] || "").trim().length > 0).length;
  const chars = Object.keys(text).reduce((n, k) => n + (text[k] || "").length, 0);

  return (
    <div style={sheet}>
      {/* header: title, patient, APSO tabs, count, actions */}
      <div style={{ flexShrink: 0, padding: "11px 14px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>Note</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>

        <div style={{ display: "flex", gap: 6, marginLeft: 6 }}>
          {APSO.map((s) => {
            const active = s.id === section;
            const has = (text[s.id] || "").trim().length > 0;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: active ? T.cardHi : "transparent",
                  border: "1px solid " + (active ? T.borderHi : T.border),
                  borderRadius: 8,
                  padding: "5px 10px",
                  color: active ? T.bright : T.dim,
                  fontFamily: T.sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontFamily: T.mono, fontWeight: 700, color: active ? T.teal : T.faint }}>{s.id}</span>
                {s.label}
                {has ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.teal }} /> : null}
              </button>
            );
          })}
        </div>

        <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>
          {filled}/4 sections / {chars} chars
        </span>
        <button onClick={onClose} style={{ cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "5px 9px" }}>
          Esc
        </button>
        <button
          onClick={save}
          style={{ cursor: "pointer", background: T.teal, color: T.bg, border: "none", borderRadius: 8, padding: "6px 16px", fontFamily: T.sans, fontWeight: 700, fontSize: 12.5 }}
        >
          Save draft
        </button>
      </div>

      {/* body: editor + quick phrases */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 12, padding: 12 }}>
        <textarea
          value={body}
          onChange={(e) => setText((t) => ({ ...t, [section]: e.target.value }))}
          placeholder={"Document the " + (APSO.find((s) => s.id === section) || {}).label + " section..."}
          style={{
            flex: 1,
            minWidth: 0,
            resize: "none",
            background: T.bg,
            border: "1px solid " + T.border,
            borderRadius: 10,
            padding: 12,
            color: T.bright,
            fontFamily: T.sans,
            fontSize: 14,
            lineHeight: 1.6,
            outline: "none",
          }}
        />
        <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 7, overflow: "auto" }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em" }}>QUICK PHRASES</div>
          {(NOTE_PHRASES[section] || []).map((p) => (
            <button
              key={p}
              onClick={() => append(p)}
              style={{ textAlign: "left", cursor: "pointer", background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: "7px 9px", color: T.txt, fontFamily: T.sans, fontSize: 12 }}
            >
              {p}
            </button>
          ))}
          <button
            title="Wires to InvokeLLM once PHI-safe"
            onClick={() => append("[AI draft pending - InvokeLLM]")}
            style={{ textAlign: "left", cursor: "pointer", background: "rgba(155,109,255,0.10)", border: "1px solid rgba(155,109,255,0.40)", borderRadius: 8, padding: "7px 9px", color: T.purple, fontFamily: T.sans, fontSize: 12, marginTop: 4 }}
          >
            AI draft (stub)
          </button>
        </div>
      </div>

      {/* saved confirmation */}
      {saved && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,15,30,0.92)", borderRadius: "14px 14px 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 20, color: T.teal }}>Draft saved</div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>Returning to the board.</div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------- triage surface (first real popover) ----------------------------------------
   A centered popover that surfaces the nurse triage note over the board, then
   dismisses with Esc - the read you do without losing your place. Read-only by
   design. Self-contained and lift-out-ready; the same shape (header + scrollable
   body in the popover tier) is the mold labs / imaging / vitals / patient reuse. */
function TriageVital({ label, value, unit, flag }) {
  return (
    <div style={{ background: T.bg, border: "1px solid " + (flag ? "rgba(255,159,67,0.45)" : T.border), borderRadius: 8, padding: "7px 9px" }}>
      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.dim, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 700, color: flag ? T.orange : T.bright, marginTop: 2 }}>
        {value}{flag ? "*" : ""}{unit ? <span style={{ fontSize: 10, color: T.dim, fontWeight: 400 }}> {unit}</span> : null}
      </div>
    </div>
  );
}

function TriageSurface({ patient, depth, onClose }) {
  const rec = patient ? TRIAGE_BY_ID[patient.id] : null;
  const sheet = { ...tierStyle("popover"), zIndex: 100 + depth, width: "min(460px, 86vw)", maxHeight: "82vh" };

  return (
    <div style={sheet}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>Triage Note</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16 }}>
        {!rec ? (
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, textAlign: "center", padding: 20 }}>
            {patient ? "No triage note on file for this patient." : "Select a patient to view their triage note."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* arrival line */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontFamily: T.mono, fontSize: 11, color: T.dim }}>
              <span>{rec.arrival}</span>
              <span>Arr {rec.arrTime}</span>
              <span>Triaged {rec.triTime}</span>
              <span>{rec.nurse}</span>
            </div>

            {/* chief complaint in patient words */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 5 }}>STATED COMPLAINT</div>
              <div style={{ fontFamily: T.sans, fontStyle: "italic", fontSize: 14, color: T.bright, lineHeight: 1.5, borderLeft: "2px solid " + T.gold, paddingLeft: 10 }}>
                "{rec.ccQuote}"
              </div>
            </div>

            {/* triage vitals */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 7 }}>TRIAGE VITALS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                <TriageVital label="HR" value={rec.vitals.hr} flag={vitalFlag("hr", rec.vitals.hr)} />
                <TriageVital label="BP" value={rec.vitals.bp} flag={false} />
                <TriageVital label="RR" value={rec.vitals.rr} flag={vitalFlag("rr", rec.vitals.rr)} />
                <TriageVital label="SpO2" value={rec.vitals.spo2} unit="%" flag={vitalFlag("spo2", rec.vitals.spo2)} />
                <TriageVital label="Temp" value={rec.vitals.temp} unit="F" flag={vitalFlag("temp", rec.vitals.temp)} />
                <TriageVital label="Pain" value={rec.vitals.pain} unit="/10" flag={vitalFlag("pain", rec.vitals.pain)} />
              </div>
            </div>

            {/* narrative */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 5 }}>TRIAGE NARRATIVE</div>
              <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.txt, lineHeight: 1.6 }}>{rec.narrative}</div>
            </div>

            {/* screens */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 7 }}>SCREENS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {rec.screens.map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + (s.flag ? "rgba(255,107,107,0.45)" : T.border), borderRadius: 8, padding: "7px 10px" }}>
                    <span style={{ fontFamily: T.sans, fontSize: 13, color: T.txt, flex: 1 }}>{s.label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: s.flag ? T.coral : T.dim }}>
                      {s.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------- popover surfaces (the proven mold) ----------------------------------------
   PopoverShell is the literal mold triage established: popover-tier container,
   a standard header (title + patient + Esc), and a scrollable body slot. Labs,
   Imaging, Allergies, Vitals, and Patient all pour into it. Each is read-only
   and self-contained / lift-out-ready. */
function PopoverShell({ title, patient, depth, onClose, children, width }) {
  const sheet = { ...tierStyle("popover"), zIndex: 100 + depth, width: width || "min(460px, 86vw)", maxHeight: "82vh" };
  return (
    <div style={sheet}>
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>{title}</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16 }}>{children}</div>
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, textAlign: "center", padding: 20 }}>{text}</div>;
}

function LabsSurface({ patient, depth, onClose }) {
  const rows = patient ? LABS_BY_ID[patient.id] : null;
  return (
    <PopoverShell title="Labs" patient={patient} depth={depth} onClose={onClose}>
      {!rows || rows.length === 0 ? (
        <EmptyNote text={patient ? "No labs resulted yet." : "Select a patient to view labs."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((r) => {
            const abn = r.flag === "H" || r.flag === "L";
            const c = r.flag === "H" ? T.orange : r.flag === "L" ? T.blue : T.dim;
            return (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + (abn ? "rgba(255,159,67,0.35)" : T.border), borderRadius: 8, padding: "8px 10px" }}>
                <span style={{ fontFamily: T.sans, fontSize: 13, color: T.txt, flex: 1 }}>{r.name}</span>
                <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: abn ? T.bright : T.txt }}>
                  {r.value}<span style={{ fontSize: 10, color: T.dim, fontWeight: 400 }}> {r.unit}</span>
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: c, minWidth: 16, textAlign: "center" }}>{r.flag || "-"}</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, minWidth: 64, textAlign: "right" }}>{r.ref}</span>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function ImagingSurface({ patient, depth, onClose }) {
  const rows = patient ? IMAGING_BY_ID[patient.id] : null;
  return (
    <PopoverShell title="Imaging" patient={patient} depth={depth} onClose={onClose}>
      {!rows || rows.length === 0 ? (
        <EmptyNote text={patient ? "No imaging ordered." : "Select a patient to view imaging."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => {
            const pending = r.status === "Pending";
            const sc = r.status === "Final" ? T.teal : r.status === "Prelim" ? T.gold : T.faint;
            return (
              <div key={r.study} style={{ background: T.bg, border: "1px solid " + T.border, borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.bright, flex: 1 }}>{r.study}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: sc, border: "1px solid " + sc + "66", borderRadius: 4, padding: "2px 6px" }}>{r.status.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: pending ? T.dim : T.txt, lineHeight: 1.5 }}>{r.impression}</div>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function AllergyDetailSurface({ patient, depth, onClose }) {
  const list = patient ? patient.allergies : [];
  return (
    <PopoverShell title="Allergies" patient={patient} depth={depth} onClose={onClose}>
      {!list || list.length === 0 ? (
        <EmptyNote text="No known drug allergies (NKDA)." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {list.map((a) => {
            const d = ALLERGY_DETAIL[a] || { reaction: "Reaction not documented", severity: "Unknown" };
            const sev = d.severity;
            const sc = sev === "Severe" ? T.coral : sev === "Moderate" ? T.orange : T.dim;
            return (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.30)", borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.bright }}>{a}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.dim, marginTop: 1 }}>{d.reaction}</div>
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: sc, border: "1px solid " + sc + "66", borderRadius: 5, padding: "3px 8px" }}>{sev.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function VitalsSurface({ patient, depth, onClose }) {
  const rec = patient ? TRIAGE_BY_ID[patient.id] : null;
  const v = rec ? rec.vitals : null;
  const rows = v
    ? [
        { key: "hr", label: "Heart rate", value: v.hr, unit: "bpm" },
        { key: "rr", label: "Resp rate", value: v.rr, unit: "/min" },
        { key: "spo2", label: "SpO2", value: v.spo2, unit: "%" },
        { key: "temp", label: "Temp", value: v.temp, unit: "F" },
      ]
    : [];
  return (
    <PopoverShell title="Vitals trend" patient={patient} depth={depth} onClose={onClose}>
      {!v ? (
        <EmptyNote text={patient ? "No vitals recorded." : "Select a patient to view vitals."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em" }}>SINCE TRIAGE ({rec.triTime})</div>
          {rows.map((r) => {
            const t = trendFrom(r.value);
            const flag = vitalFlag(r.key, r.value);
            const delta = t[2] - t[0];
            const arrow = delta > 0 ? "^" : delta < 0 ? "v" : "-";
            return (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + (flag ? "rgba(255,159,67,0.35)" : T.border), borderRadius: 8, padding: "8px 11px" }}>
                <span style={{ fontFamily: T.sans, fontSize: 13, color: T.txt, flex: 1 }}>{r.label}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>{t[0]} {String.fromCharCode(8594)} {t[1]} {String.fromCharCode(8594)}</span>
                <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 700, color: flag ? T.orange : T.bright }}>{r.value}{flag ? "*" : ""}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, width: 12, textAlign: "center" }}>{arrow}</span>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, width: 30 }}>{r.unit}</span>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function PatientSurface({ patient, depth, onClose }) {
  if (!patient) {
    return (
      <PopoverShell title="Patient info" patient={patient} depth={depth} onClose={onClose}>
        <EmptyNote text="Select a patient to view details." />
      </PopoverShell>
    );
  }
  const a = ACUITY[patient.esi] || ACUITY[3];
  const fields = [
    ["MRN", patient.mrn],
    ["Age / Sex", patient.age + " " + patient.sex],
    ["Room", patient.room],
    ["ESI", patient.esi + " (" + a.tone + ")"],
    ["Chief complaint", patient.cc],
    ["Status", patient.status],
    ["Time in dept", patient.wait + " min"],
  ];
  return (
    <PopoverShell title="Patient info" patient={patient} depth={depth} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fields.map(([k, val]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + T.border, borderRadius: 8, padding: "8px 11px" }}>
            <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.dim, letterSpacing: "0.05em", width: 120 }}>{k}</span>
            <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.bright, flex: 1 }}>{val}</span>
          </div>
        ))}
        <div style={{ marginTop: 4 }}>
          <AllergyChip allergies={patient.allergies} />
        </div>
      </div>
    </PopoverShell>
  );
}

/* ---------------------------------------- clinical hub (the takeover tier) ----------------------------------------
   A full-screen takeover that is still summoned and dismissed, never navigated
   to: Esc returns to the board like every other surface. It is the launcher
   into the decision hubs, with the ones relevant to this patient's complaint
   surfaced first. Selecting a hub swaps the takeover's body to that hub (a stub
   here) - in production the hub's tools render in this same container, so the
   one-screen rule holds even for deep clinical work. */
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

function HubCard({ hub, onOpen, suggested }) {
  const c = HUB_CAT_COLOR[hub.cat] || T.teal;
  return (
    <button
      onClick={() => onOpen(hub.id)}
      style={{
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: T.card,
        border: "1px solid " + (suggested ? c + "66" : T.border),
        borderRadius: 12,
        padding: 13,
        minHeight: 92,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 11, color: c, background: c + "1f", border: "1px solid " + c + "55", borderRadius: 7, padding: "4px 7px", minWidth: 38, textAlign: "center" }}>
          {hub.mark}
        </span>
        <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 14, color: T.bright, flex: 1 }}>{hub.name}</span>
      </div>
      <span style={{ fontFamily: T.sans, fontSize: 12, color: T.dim, lineHeight: 1.45 }}>{hub.desc}</span>
      <span style={{ fontFamily: T.mono, fontSize: 9, color: c, letterSpacing: "0.06em", marginTop: "auto" }}>{hub.cat.toUpperCase()}</span>
    </button>
  );
}

function HubTakeover({ patient, depth, onClose }) {
  const [active, setActive] = useState(null);
  const suggestedIds = patient ? suggestHubs(patient.cc) : [];
  const suggested = suggestedIds.map((id) => HUB_BY_ID[id]).filter(Boolean);
  const sheet = { ...tierStyle("takeover"), zIndex: 100 + depth };
  const hub = active ? HUB_BY_ID[active] : null;
  const c = hub ? (HUB_CAT_COLOR[hub.cat] || T.teal) : T.teal;

  return (
    <div style={sheet}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: "14px 18px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 18, color: T.bright }}>Clinical Hub</span>
        {patient ? (
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {patient.name} / {patient.room} / {patient.cc}
          </span>
        ) : (
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>No patient selected</span>
        )}
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "5px 10px" }}>
          Esc
        </button>
      </div>

      {/* body */}
      {hub ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 18 }}>
          <button
            onClick={() => setActive(null)}
            style={{ alignSelf: "flex-start", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 7, color: T.dim, fontFamily: T.sans, fontSize: 12.5, padding: "6px 12px", marginBottom: 16 }}
          >
            Back to hubs
          </button>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
            <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 18, color: c, background: c + "1f", border: "1px solid " + c + "55", borderRadius: 12, padding: "12px 16px" }}>
              {hub.mark}
            </span>
            <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 22, color: T.bright }}>{hub.name}</span>
            <span style={{ fontFamily: T.sans, fontSize: 14, color: T.txt, maxWidth: 460, lineHeight: 1.6 }}>{hub.desc}</span>
            <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, maxWidth: 460, lineHeight: 1.6 }}>
              In production the {hub.name} tools render right here, inside the takeover. Esc still returns you to the board - the hub is summoned, never a place you navigate away to.
            </span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 20 }}>
          {suggested.length > 0 && (
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.gold, letterSpacing: "0.08em", marginBottom: 10 }}>
                SUGGESTED FOR {(patient && patient.cc ? patient.cc : "").toUpperCase()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
                {suggested.map((h) => <HubCard key={h.id} hub={h} onOpen={setActive} suggested />)}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 10 }}>ALL HUBS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
              {HUBS.map((h) => <HubCard key={h.id} hub={h} onOpen={setActive} suggested={false} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------- footer hint (keycap legend) ---------------------------------------- */
function HintBar() {
  const keys = ["o orders", "n note", "l labs", "i imaging", "a allergies", "h hub", "v vitals", "p patient", "t triage"];
  return (
    <footer
      style={{
        flexShrink: 0,
        height: 30,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 16px",
        background: T.panel,
        borderTop: "1px solid " + T.border,
        overflow: "hidden",
      }}
    >
      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, letterSpacing: "0.06em" }}>SUMMON</span>
      {keys.map((k) => (
        <span key={k} style={{ fontFamily: T.mono, fontSize: 10.5, color: T.dim, whiteSpace: "nowrap" }}>{k}</span>
      ))}
      <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>Esc back / Cmd or Ctrl + K palette</span>
    </footer>
  );
}

/* ---------------------------------------- page ---------------------------------------- */
export default function CommandCenterSpine() {
  const [selectedId, setSelectedId] = useState(ORDER[0] || null);
  const [stack, setStack] = useState([]);
  const [palette, setPalette] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setClock(hh + ":" + mm);
    }
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  const patient = PATIENTS.find((p) => p.id === selectedId) || null;

  const summon = useCallback((id) => {
    setStack((s) => (s[s.length - 1] === id ? s : s.concat(id)));
  }, []);

  const navSelect = useCallback((dir) => {
    if (stack.length > 0) return; // arrows drive board only when no surface is up
    setSelectedId((cur) => {
      const i = ORDER.indexOf(cur);
      const next = i < 0 ? 0 : Math.max(0, Math.min(ORDER.length - 1, i + dir));
      return ORDER[next];
    });
  }, [stack.length]);

  const escape = useCallback(() => {
    const el = typeof document !== "undefined" ? document.activeElement : null;
    if (isEditable(el)) {
      el.blur(); // focus guard: first Esc keeps your place in a field
      return;
    }
    if (palette) {
      setPalette(false);
      return;
    }
    setStack((s) => s.slice(0, -1)); // peel one layer back toward the board
  }, [palette]);

  useCommandKeys({
    onSurface: summon,
    onEscape: escape,
    onPalette: () => setPalette((v) => !v),
    onNav: navSelect,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, display: "flex", flexDirection: "column", fontFamily: T.sans }}>
      <Banner patient={patient} clock={clock} />
      <Board selectedId={selectedId} onSelect={setSelectedId} />
      <HintBar />

      {/* summoned surfaces overlay the frame; banner/board stay put underneath */}
      {stack.map((id, depth) => {
        const close = () => setStack((s) => s.filter((_, idx) => idx !== depth));
        if (id === "orders") {
          return <OrdersSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "note") {
          return <NoteDock key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "triage") {
          return <TriageSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "labs") {
          return <LabsSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "imaging") {
          return <ImagingSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "allergies") {
          return <AllergyDetailSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "vitals") {
          return <VitalsSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "patient") {
          return <PatientSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        if (id === "hub") {
          return <HubTakeover key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        return <SurfaceStub key={id + "-" + depth} id={id} patient={patient} depth={depth} onClose={close} />;
      })}

      {palette && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,15,30,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "14vh" }}>
          <div style={{ width: "min(560px, 90vw)", background: T.card, border: "1px solid " + T.borderHi, borderRadius: 14, boxShadow: "0 24px 70px rgba(0,0,0,0.6)", padding: 18 }}>
            <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright, marginBottom: 6 }}>Command Palette</div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, marginBottom: 12 }}>Stub. Esc to close.</div>
            <button onClick={() => setPalette(false)} style={{ cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.txt, fontFamily: T.sans, fontSize: 13, padding: "7px 14px" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}