import LakonyxHeader from "@/components/LakonyxHeader";

/*
  Layout.jsx — global wrapper.
  Renders the shared Lakonyx header on every page, then the page below it.
  The header lives here (not in each page) so the brand block is identical
  everywhere and can never drift. Pages no longer render their own header.

  Exemptions: pages that own their full chrome (e.g. the Command Center, with
  its richer TopBar) pass straight through with no Layout header.
*/

// Pages that render their own top chrome — Layout adds no header to these.
const NO_HEADER = new Set([
  "CommandCenter",
  // add a full-bleed landing/login route here if you have one
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

export default function Layout({ children, currentPageName }) {
  // Base44 passes currentPageName; fall back to the URL path if it's ever absent.
  const routeName = currentPageName ||
    (typeof window !== "undefined" ? window.location.pathname.replace(/^\//, "").split("/")[0] : "");

  // Exempt pages keep their original full-screen behavior — pure pass-through.
  if (NO_HEADER.has(routeName)) return <>{children}</>;

  const title = PAGE_TITLES[routeName] || prettyName(routeName);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"#050f1e" }}>
      <LakonyxHeader pageName={title} />
      <div style={{ flex:1, overflow:"auto", minHeight:0 }}>
        {children}
      </div>
    </div>
  );
}