import { useState, useEffect } from "react";
 
// ─── FONT GUARD ───────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("npb-fonts")) return;
  const l = document.createElement("link");
  l.id = "npb-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();
 
// ─── TOKENS — exact Notrya palette ───────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", red:"#ff4444",
};
 
// ─── NAVIGATION ───────────────────────────────────────────────────────────────
// Replace with navigateTo() in Base44
const nav = (page, params = {}) => { console.log("nav ->", page, params); };
 
// ─── MOCK PATIENT LOOKUP — replace with Patient.get(id) in Base44 ─────────────
const MOCK_PATIENTS = [
  { id:"1", room:"Trauma 1",  name:"Mitchell, Robert J.", age:67, sex:"M", cc:"Chest Pain",            esi:1, mins:18 },
  { id:"2", room:"Room 2",    name:"Hartwell, Susan K.",  age:34, sex:"F", cc:"Shortness of Breath",   esi:2, mins:78 },
  { id:"3", room:"Room 4",    name:"Nguyen, Thomas A.",   age:52, sex:"M", cc:"Altered Mental Status", esi:2, mins:40 },
  { id:"4", room:"Room 6",    name:"Garcia, Maria L.",    age:28, sex:"F", cc:"Abdominal Pain",        esi:3, mins:130 },
  { id:"5", room:"Room 8",    name:"Brooks, David M.",    age:71, sex:"M", cc:"Stroke Symptoms",       esi:1, mins:8 },
  { id:"6", room:"Room 9",    name:"Coleman, James R.",   age:19, sex:"M", cc:"Opioid Overdose",       esi:1, mins:6 },
  { id:"7", room:"Room 11",   name:"Patel, Priya N.",     age:45, sex:"F", cc:"Sepsis — UTI Source",   esi:2, mins:95 },
  { id:"8", room:"Room 13",   name:"Whitfield, Carol A.", age:58, sex:"F", cc:"Diffuse Rash",          esi:3, mins:112 },
  { id:"9", room:"Room 15",   name:"O'Brien, Kathleen M.",age:62, sex:"F", cc:"Generalized Weakness",  esi:3, mins:90 },
  { id:"10",room:"Hallway A", name:"Jenkins, Frank O.",   age:44, sex:"M", cc:"Low Back Pain",         esi:4, mins:185 },
];
 
// ─── HELPERS ──────────────────────────────────────────────────────────────────
const esiColor = (n) => ({1:T.red,2:T.orange,3:T.gold,4:"#3dffa0",5:T.txt4}[n]||T.txt4);
const fmtTime  = (m) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
 
function SmBtn({ children, accent, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
        color: accent,
        background: hov ? `${accent}22` : `${accent}10`,
        border: `1px solid ${accent}${hov ? "66" : "40"}`,
        borderRadius: 7, padding: "4px 11px",
        cursor: "pointer", transition: "all .13s", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
 
// ─── NOTRYA PATIENT BAR ───────────────────────────────────────────────────────
// Drop this component directly below <NotryaHubHeader> in every hub page.
// It reads patientId from the URL automatically — no props needed.
// If no patientId is present, it renders a minimal "← Census" bar only.
//
// Base44 wiring:
//   Replace the MOCK_PATIENTS lookup with: const patient = await Patient.get(patientId)
//   Replace nav() calls with navigateTo()
 
export default function NotryaPatientBar() {
  const [patient, setPatient] = useState(null);
  const [patientId, setPatientId] = useState(null);
 
  useEffect(() => {
    // ── Read patientId from URL ─────────────────────────────────────────────
    // In Base44, URL params are typically available via getPageParam("patientId")
    // or new URLSearchParams(window.location.search).get("patientId")
    let id = null;
    try {
      id = new URLSearchParams(window.location.search).get("patientId");
    } catch {}
    setPatientId(id);
 
    if (!id) return;
 
    // ── Fetch patient ───────────────────────────────────────────────────────
    // Replace this with: Patient.get(id).then(setPatient)
    const found = MOCK_PATIENTS.find(p => String(p.id) === String(id));
    if (found) setPatient(found);
  }, []);
 
  // ── No patientId — show minimal census-return bar ─────────────────────────
  if (!patientId) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 20px", height: 38, minHeight: 38,
        background: T.panel,
        borderBottom: "1px solid rgba(26,53,85,0.5)",
        flexShrink: 0,
      }}>
        <SmBtn accent={T.txt4} onClick={() => nav("CommandCenter")}>
          ← Patient Census
        </SmBtn>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4 }}>
          No patient selected — open from Patient Encounter for context
        </span>
      </div>
    );
  }
 
  // ── Patient found — show full context bar ─────────────────────────────────
  if (patient) {
    const ec = esiColor(patient.esi);
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 44, minHeight: 44, flexShrink: 0,
        background: "rgba(0,229,192,0.04)",
        borderBottom: "1px solid rgba(0,229,192,0.18)",
      }}>
 
        {/* Left — breadcrumb + patient identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
 
          {/* Back to census */}
          <SmBtn accent={T.txt4} onClick={() => nav("CommandCenter")}>
            ← Census
          </SmBtn>
 
          <span style={{ color: "rgba(26,53,85,0.8)", fontSize: 10 }}>›</span>
 
          {/* Back to patient encounter */}
          <SmBtn accent={T.teal} onClick={() => nav("PatientEncounter", { patientId: patient.id })}>
            ← {patient.room}
          </SmBtn>
 
          <span style={{ color: "rgba(26,53,85,0.8)", fontSize: 10 }}>›</span>
 
          {/* Patient identity */}
          <span style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 13, fontWeight: 700, color: T.txt,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 200,
          }}>
            {patient.name}
          </span>
 
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt3, whiteSpace: "nowrap" }}>
            {patient.age}{patient.sex}
          </span>
 
          <span style={{ color: T.txt4 }}>·</span>
 
          <span style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12, fontWeight: 600, color: T.gold,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 220,
          }}>
            {patient.cc}
          </span>
 
          {/* ESI badge */}
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 8, fontWeight: 700, color: ec,
            background: `${ec}18`, border: `1px solid ${ec}45`,
            borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap",
          }}>
            ESI {patient.esi}
          </span>
 
          {/* Time in dept */}
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            color: patient.mins > 120 ? T.red : patient.mins > 60 ? T.gold : T.txt4,
            whiteSpace: "nowrap",
          }}>
            {fmtTime(patient.mins)}
          </span>
        </div>
 
        {/* Right — quick actions */}
        <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
          <SmBtn accent={T.teal} onClick={() => nav("QuickNote", { patientId: patient.id })}>
            ✏️ Quick Note
          </SmBtn>
          <SmBtn accent={T.purple} onClick={() => nav("ClinicalNoteStudio", { patientId: patient.id })}>
            📝 Note Studio
          </SmBtn>
          <SmBtn accent={T.gold} onClick={() => nav("OrderGeneratorHub", { patientId: patient.id })}>
            📋 Orders
          </SmBtn>
        </div>
      </div>
    );
  }
 
  // ── patientId present but patient not found ────────────────────────────────
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "0 20px", height: 38, minHeight: 38,
      background: T.panel, borderBottom: "1px solid rgba(26,53,85,0.5)",
      flexShrink: 0,
    }}>
      <SmBtn accent={T.txt4} onClick={() => nav("CommandCenter")}>← Patient Census</SmBtn>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4 }}>
        Patient record not found
      </span>
    </div>
  );
}