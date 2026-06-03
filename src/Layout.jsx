import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import LakonyxHeader from "@/components/LakonyxHeader";

/*
  Layout.jsx — global wrapper.
  Renders the shared Lakonyx header on every page, then the page below it.
  The header lives here (not in each page) so the brand block is identical
  everywhere and can never drift. Pages no longer render their own header.

  When the URL carries ?patientId=, Layout loads that patient and passes it to
  the header, which shows a passive context chip (identity only — never a link).
  So any encounter page navigated with a patient automatically shows who you're
  working on, with no per-page wiring.

  Exemptions: pages that own their full chrome (e.g. the Command Center, with
  its richer TopBar) pass straight through with no Layout header.
*/

// Pages that render their own top chrome — Layout adds no header to these.
const NO_HEADER = new Set([
  "CommandCenter",
  "CommandCenterSpine",
  // add a full-bleed landing/login route here if you have one
]);

// Pages that print their own date/clock — hide the nav clock to avoid showing
// the time twice. The Shift Brief has its own "Fri, May 29  16:38" line.
const NO_CLOCK = new Set([
  "ShiftBriefPage",
  "ShiftBrief",
]);

// Friendly breadcrumb titles. Falls back to auto-formatting for anything absent.
const PAGE_TITLES = {
  ShiftBriefPage:        "Shift Brief",
  ShiftBrief:            "Shift Brief",
  NewPatientInput:       "New Patient",
  PatientEncounter:      "Patient Encounter",
  ClinicalNoteStudio:    "Clinical Note Studio",
  QuickNote:             "Quick Note",
  ECGHub:                "ECG Interpreter",
  AirwayHub:             "Airway Management",
  ShockHub:              "Shock Hub",
  SepsisHub:             "Sepsis Protocol",
  StrokeHub:             "Stroke Assessment",
  ToxicologyHub:         "Toxicology",
  PsychHub:              "Psych Evaluation",
  OrthoHub:              "Ortho Reference",
  CardiacRiskPage:       "Cardiac Risk",
  POCUSHub:              "POCUS Guide",
  DermatologyHub:        "Dermatology",
  ElectrolyteAcidBaseHub:"Electrolytes & Acid-Base",
  TriageHub:             "Triage Tools",
  RapidAssessmentHub:    "Rapid Assessment",
  ERxHub:                "ED Prescribing",
  OrderGeneratorHub:     "Order Generator",
  AutocoderHub:          "Auto-Coder",
  ImagingInterpreter:    "Imaging Interpreter",
};

// "StrokeHub" -> "Stroke Hub", "ShiftBriefPage" -> "Shift Brief"
const prettyName = (name = "") =>
  name.replace(/Page$/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();

// Load one patient by id, tolerant of which SDK methods this Base44 build exposes.
async function loadPatient(id) {
  const E = base44?.entities?.Patient;
  if (!E || !id) return null;
  try {
    if (E.get)    { const p = await E.get(id);            if (p) return p; }
    if (E.filter) { const a = await E.filter({ id });      if (Array.isArray(a) && a[0]) return a[0]; }
    if (E.list)   { const a = await E.list();              return (a || []).find(x => String(x.id) === String(id)) || null; }
  } catch { /* fall through — no chip rather than a broken header */ }
  return null;
}

export default function Layout({ children, currentPageName }) {
  // Base44 passes currentPageName; fall back to the URL path if it's ever absent.
  const routeName = currentPageName ||
    (typeof window !== "undefined" ? window.location.pathname.replace(/^\//, "").split("/")[0] : "");

  // ?patientId= drives the header context chip. Read it every render; re-resolves
  // on navigation because Base44 re-renders Layout with a new currentPageName.
  const patientId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("patientId")
    : null;

  const [patient, setPatient] = useState(null);

  // Hooks must run unconditionally — keep this ABOVE the NO_HEADER early return.
  useEffect(() => {
    let live = true;
    if (!patientId) { setPatient(null); return; }
    loadPatient(patientId).then(p => { if (live) setPatient(p); });
    return () => { live = false; };
  }, [patientId]);

  // Exempt pages keep their original full-screen behavior — pure pass-through.
  if (NO_HEADER.has(routeName)) return <>{children}</>;

  const title = PAGE_TITLES[routeName] || prettyName(routeName);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"#050f1e" }}>
      <div style={{ flex:1, overflow:"auto", minHeight:0 }}>
        {children}
      </div>
    </div>
  );
}