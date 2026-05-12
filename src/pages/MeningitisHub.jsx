import { useState } from "react";

// ── Font Loader ──────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#0a1628", glass: "rgba(255,255,255,0.04)", glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)", teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G    = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg)     => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)      => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.teal) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

// ── Data ─────────────────────────────────────────────────────────────────────
const EMPIRIC_REGIMENS = [
  {
    group: "Neonates (< 1 month)", color: T.purple,
    organisms: "GBS · E. coli · Listeria · Klebsiella",
    abx: ["Ampicillin 50 mg/kg IV q 6h", "Gentamicin 2.5 mg/kg IV q 8h (or Cefotaxime 50 mg/kg IV q 6h)"],
    dex: false, dexNote: "Dexamethasone NOT recommended in neonates",
    acyclovir: "10 mg/kg IV q 8h if HSV neonatal encephalitis suspected",
  },
  {
    group: "Infants 1–3 months", color: T.amber,
    organisms: "GBS · Listeria · E. coli · S. pneumoniae · N. meningitidis",
    abx: ["Ampicillin 50–100 mg/kg IV q 6h", "Ceftriaxone 50 mg/kg IV q 12h (or Cefotaxime)"],
    dex: true, dexNote: "Dexamethasone evidence limited in this age group — use clinical judgment",
    acyclovir: null,
  },
  {
    group: "Children > 3 months & Adults (< 50, immunocompetent)", color: T.teal,
    organisms: "S. pneumoniae · N. meningitidis · H. influenzae",
    abx: ["Ceftriaxone 2g IV q 12h", "Vancomycin 25–30 mg/kg IV q 8–12h (target AUC 400–600)"],
    dex: true, dexNote: "Dexamethasone 0.15 mg/kg IV (max 10 mg) BEFORE or WITH first antibiotic dose · q 6h × 4 days",
    acyclovir: "Add Acyclovir 10 mg/kg IV q 8h if encephalitis features (altered mentation + focal deficits)",
  },
  {
    group: "Adults > 50 or Immunocompromised", color: T.gold,
    organisms: "S. pneumoniae · N. meningitidis · Listeria · Gram-negative bacilli",
    abx: ["Ceftriaxone 2g IV q 12h", "Vancomycin 25–30 mg/kg IV q 8–12h", "Ampicillin 2g IV q 4h (Listeria coverage)"],
    dex: true, dexNote: "Dexamethasone 0.15 mg/kg IV BEFORE or WITH first antibiotic dose",
    acyclovir: "Add Acyclovir 10 mg/kg IV q 8h — HSV encephalitis cannot be excluded without PCR",
  },
  {
    group: "Hospital-Acquired / Post-Neurosurgical", color: T.coral,
    organisms: "S. aureus · Gram-negative bacilli (Pseudomonas) · coagulase-negative Staph",
    abx: ["Vancomycin 25–30 mg/kg IV q 8–12h", "Cefepime 2g IV q 8h (or Meropenem 2g IV q 8h)"],
    dex: false, dexNote: "Dexamethasone not routinely recommended in nosocomial meningitis",
    acyclovir: null,
  },
];

const CSF_PROFILES = [
  { type: "Normal",    color: T.green,  pressure: "70–180 mmH₂O", appearance: "Clear", wbc: "0–5 (lymphs)", protein: "15–45 mg/dL", glucose: "> 60% serum glucose", gram: "Negative", notes: "—" },
  { type: "Bacterial", color: T.coral,  pressure: "> 200 (often 300–500+)", appearance: "Cloudy/Turbid/Purulent", wbc: "1,000–10,000+ (PMN > 80%)", protein: "100–500+ mg/dL", glucose: "< 45 mg/dL (< 40% serum)", gram: "Positive 60–80%", notes: "Culture positive 70–85% · Lactate elevated" },
  { type: "Viral",     color: T.blue,   pressure: "Normal or slight ↑", appearance: "Clear", wbc: "10–1,000 (lymphs > 80%)", protein: "50–100 mg/dL", glucose: "Normal", gram: "Negative", notes: "PCR panel (HSV, enteroviruses, VZV)" },
  { type: "Fungal",    color: T.purple, pressure: "Often markedly elevated (300–600)", appearance: "Clear or slightly turbid", wbc: "20–500 (lymphs)", protein: "50–200 mg/dL", glucose: "Low (< 45 mg/dL)", gram: "Negative · India ink (+)", notes: "Cryptococcal Ag nearly 100% sensitive · CRAG titer" },
  { type: "TB",        color: T.amber,  pressure: "200–400 mmH₂O", appearance: "Clear/xanthochromic", wbc: "100–500 (lymphs)", protein: "100–500 mg/dL", glucose: "Very low (< 45)", gram: "Negative", notes: "AFB smear 37–87% · ADA elevated · culture weeks" },
];

const CT_CRITERIA = [
  "New-onset seizure",
  "Papilledema on fundoscopic exam",
  "Focal neurologic deficit",
  "Altered mental status (GCS ≤ 13)",
  "Immunocompromised state (HIV, transplant, cancer)",
  "Known or suspected CNS mass / hydrocephalus",
  "Age > 60 years",
  "History of CNS disease (stroke, focal lesion, infection)",
];

const COMPLICATIONS = [
  { comp: "Cerebral Edema / Herniation", mgmt: "HOB 30–45° · Mannitol 0.5–1 g/kg IV · 3% NaCl 150 mL IV · Hyperventilation briefly · Neurosurgery STAT", color: T.coral, urgent: true },
  { comp: "Hydrocephalus",               mgmt: "Neurosurgery for ventriculostomy / EVD · may need VP shunt", color: T.coral, urgent: true },
  { comp: "Seizures",                    mgmt: "30% of bacterial meningitis · Treat per status epilepticus protocol · prophylactic AEDs not routinely recommended", color: T.amber, urgent: false },
  { comp: "SIADH / Hyponatremia",        mgmt: "Fluid restriction · 3% NaCl if Na⁺ < 125 or symptomatic · Correct slowly (max 8–10 mEq/L per 24h)", color: T.gold, urgent: false },
  { comp: "DIC (Meningococcemia)",       mgmt: "FFP · platelets · cryoprecipitate · hematology consult · aggressive resuscitation", color: T.coral, urgent: true },
  { comp: "Waterhouse-Friderichsen",     mgmt: "Bilateral adrenal hemorrhage in meningococcemia → shock → stress-dose hydrocortisone 100 mg IV q 8h", color: T.coral, urgent: true },
  { comp: "Hearing Loss",                mgmt: "Most common sequela in pneumococcal meningitis · dexamethasone reduces incidence · audiological testing before discharge", color: T.teal, urgent: false },
  { comp: "Stroke / Vasculitis",         mgmt: "Cerebral arteritis from meningeal inflammation · MRI/MRA · neuro consult · maintain adequate MAP", color: T.amber, urgent: false },
];

const ABX_DURATION = [
  { org: "N. meningitidis",       days: "7 days",                                           color: T.teal },
  { org: "H. influenzae",         days: "7 days",                                           color: T.blue },
  { org: "S. pneumoniae",         days: "10–14 days",                                       color: T.gold },
  { org: "Listeria",              days: "21 days",                                           color: T.amber },
  { org: "GBS (Group B Strep)",   days: "14–21 days",                                       color: T.purple },
  { org: "Gram-negative bacilli", days: "21 days",                                           color: T.coral },
  { org: "Unknown (empiric)",     days: "10–14 days — de-escalate at 48h with cultures",    color: T.muted },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function MeningitisHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]             = useState(0);
  const [regimen, setRegimen]     = useState(null);
  const [csfTab, setCsfTab]       = useState("Bacterial");
  const [wt, setWt]               = useState("");
  const [serumGluc, setSerumGluc] = useState("");
  const [csfGluc, setCsfGluc]     = useState("");
  const [csfWbc, setCsfWbc]       = useState("");
  const [csfRbc, setCsfRbc]       = useState("");
  const TABS = ["Recognition", "Treatment", "CSF Analysis", "Monitoring"];

  const selReg  = EMPIRIC_REGIMENS.find(r => r.group === regimen);
  const selCsf  = CSF_PROFILES.find(p => p.type === csfTab);
  const dexDose = wt && !isNaN(wt) ? Math.min(parseFloat(wt) * 0.15, 10).toFixed(1) : null;

  const glucRatio = serumGluc && csfGluc && !isNaN(serumGluc) && !isNaN(csfGluc)
    ? (parseFloat(csfGluc) / parseFloat(serumGluc)).toFixed(2) : null;
  const corrWbc = csfWbc && csfRbc && !isNaN(csfWbc) && !isNaN(csfRbc)
    ? Math.max(0, Math.round(parseFloat(csfWbc) - parseFloat(csfRbc) / 600)) : null;

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Time = Brain</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Every hour of delay in antibiotics worsens outcomes. Treat empirically — do NOT wait for LP or CT results to initiate antibiotics.</div>
      </div>

      <div style={sL()}>Classic Presentation</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Triad — present in only ~45% of bacterial meningitis</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {["Fever", "Headache", "Neck Stiffness (meningismus)"].map(s => (
            <div key={s} style={{ ...tag(T.coral), fontSize: 12, padding: "5px 12px" }}>{s}</div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>Additional features:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["Photophobia", "Phonophobia", "Altered mentation (85%)", "Nausea / vomiting", "Petechial rash (meningococcemia)", "Seizures (30%)", "Focal deficits"].map(s => (
            <span key={s} style={{ ...tag(T.gold), fontSize: 10 }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={sL()}>Meningismus — Bedside Signs</div>
      {[
        { sign: "Nuchal Rigidity",    how: "Passive neck flexion — resistance or pain", sens: "Sens 30%", spec: "Spec 68%", color: T.teal },
        { sign: "Kernig's Sign",      how: "Supine: flex hip 90° → attempt knee extension → pain or resistance at < 135°", sens: "Sens 5%", spec: "Spec 95%", color: T.gold },
        { sign: "Brudzinski's Sign",  how: "Passive neck flexion → involuntary bilateral hip and knee flexion", sens: "Sens 5%", spec: "Spec 95%", color: T.gold },
        { sign: "Jolt Accentuation",  how: "Rotate head horizontally 2–3 Hz → worsens headache = positive", sens: "Sens 97%", spec: "Spec 60%", color: T.green },
        { sign: "Papilledema",        how: "Fundoscopic exam — suggests elevated ICP → CT before LP mandatory", sens: "Low", spec: "High", color: T.coral },
      ].map(({ sign, how, sens, spec, color }) => (
        <div key={sign} style={{ ...G(), padding: "11px 13px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{sign}</span>
            <div style={{ display: "flex", gap: 5 }}>
              <span style={{ ...tag(T.teal), fontSize: 9 }}>{sens}</span>
              <span style={{ ...tag(T.purple), fontSize: 9 }}>{spec}</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{how}</div>
        </div>
      ))}

      <div style={aBox(T.gold, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.gold, marginBottom: 3 }}>⚡ Jolt Accentuation Pearl</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Best screening test at bedside. If negative (no headache worsening with horizontal rotation), bacterial meningitis is unlikely in a non-immunocompromised patient with intact mentation.</div>
      </div>

      <div style={sL(T.purple)}>Meningococcal Rash — Red Flag</div>
      <div style={aBox(T.coral, 0)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 4 }}>Petechial / Purpuric Rash + Fever → Treat Immediately</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Non-blanching petechiae or purpura (especially trunk, extremities) + fever = Neisseria meningitidis until proven otherwise. Give ceftriaxone 2g IV immediately — before blood cultures, before CT, before LP. Every minute counts.
        </div>
      </div>
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.gold}60`, background: "rgba(245,158,11,0.10)", marginBottom: 16 }), padding: "16px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.gold, marginBottom: 6, letterSpacing: "0.02em" }}>
          ⚡ DEXAMETHASONE BEFORE (OR WITH) FIRST ANTIBIOTIC DOSE
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number"
            style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>kg</span>
        </div>
        {dexDose ? (
          <div style={{ fontFamily: T.mono, fontSize: 20, color: T.gold, fontWeight: 800, marginBottom: 4 }}>
            {dexDose} mg IV
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 400, marginLeft: 8 }}>q 6h × 4 days</span>
          </div>
        ) : (
          <div style={{ fontFamily: T.mono, fontSize: 16, color: T.gold, fontWeight: 700, marginBottom: 4 }}>
            0.15 mg/kg IV (max 10 mg) · q 6h × 4 days
          </div>
        )}
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Reduces mortality and neurologic sequelae in S. pneumoniae meningitis (de Gans et al., NEJM 2002). If not given before first dose, benefit is lost. Discontinue if non-bacterial etiology confirmed.
        </div>
      </div>

      <div style={sL()}>Empiric Regimen — Select Age / Risk Group</div>
      {EMPIRIC_REGIMENS.map(r => (
        <div key={r.group}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${regimen === r.group ? r.color + "70" : T.border}`, background: regimen === r.group ? r.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setRegimen(regimen === r.group ? null : r.group)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.group}</span>
            <span style={{ fontSize: 13, color: regimen === r.group ? r.color : T.dim }}>{regimen === r.group ? "▲" : "▼"}</span>
          </div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>{r.organisms}</div>
          {regimen === r.group && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${r.color}30` }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Antibiotics</div>
              {r.abx.map((a, i) => (
                <div key={i} style={{ fontFamily: T.mono, fontSize: 12, color: T.teal, marginBottom: 5, display: "flex", gap: 7 }}>
                  <span style={{ color: T.teal, flexShrink: 0 }}>▸</span>{a}
                </div>
              ))}
              <div style={dv} />
              <div style={{ ...aBox(r.dex ? T.gold : T.blue, 0) }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: r.dex ? T.gold : T.blue, marginBottom: 2 }}>
                  {r.dex ? "⚡ Dexamethasone" : "ℹ Dexamethasone"}
                </div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{r.dexNote}</div>
              </div>
              {r.acyclovir && (
                <div style={{ ...aBox(T.purple, 0), marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 2 }}>Acyclovir</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.muted }}>{r.acyclovir}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.coral)}>Critical Sequence of Events</div>
      {[
        { n: 1, action: "Blood cultures × 2",                  time: "< 5 min from decision",    color: T.teal },
        { n: 2, action: "Dexamethasone + Antibiotics",          time: "< 30 min from arrival",    color: T.gold },
        { n: 3, action: "Head CT (if CT criteria present)",     time: "After antibiotics started", color: T.blue },
        { n: 4, action: "Lumbar Puncture",                      time: "After CT clears",           color: T.purple },
        { n: 5, action: "Adjust regimen based on cultures/PCR", time: "At 48–72h",                 color: T.green },
      ].map(({ n, action, time, color }) => (
        <div key={n} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: T.white }}>{action}</div>
          <div style={{ ...tag(color), fontSize: 10, whiteSpace: "nowrap", flexShrink: 0 }}>{time}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: CSF ANALYSIS ───────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL(T.coral)}>CT Before LP — Obtain if ANY Present</div>
      <div style={{ ...card({ marginBottom: 14, background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.25)" }) }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 8 }}>⚠ Do NOT delay antibiotics while waiting for CT or LP</div>
        {CT_CRITERIA.map((c, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.coral, flexShrink: 0 }}>●</span>{c}
          </div>
        ))}
      </div>

      <div style={sL()}>CSF Profile Comparison</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {CSF_PROFILES.map(p => (
          <button key={p.type}
            style={{ padding: "6px 13px", borderRadius: 8, border: `1.5px solid ${csfTab === p.type ? p.color : T.border}`, background: csfTab === p.type ? p.color + "20" : T.glass, color: csfTab === p.type ? p.color : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}
            onClick={() => setCsfTab(p.type)}>{p.type}</button>
        ))}
      </div>

      {selCsf && (
        <div style={{ ...card({ border: `1.5px solid ${selCsf.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: selCsf.color, marginBottom: 12 }}>{selCsf.type} — CSF Profile</div>
          {[
            { label: "Opening Pressure", val: selCsf.pressure },
            { label: "Appearance",       val: selCsf.appearance },
            { label: "WBC",              val: selCsf.wbc },
            { label: "Protein",          val: selCsf.protein },
            { label: "Glucose",          val: selCsf.glucose },
            { label: "Gram Stain",       val: selCsf.gram },
            { label: "Notes",            val: selCsf.notes },
          ].map(({ label, val }, i) => (
            <div key={label} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 6 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.muted, minWidth: 130, flexShrink: 0 }}>{label}</div>
              <div style={{ fontFamily: ["Opening Pressure","WBC","Protein","Glucose"].includes(label) ? T.mono : T.sans, fontSize: 12, color: T.white }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={sL(T.gold)}>CSF Calculators</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 10 }}>CSF / Serum Glucose Ratio</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>Serum glucose</div>
            <input value={serumGluc} onChange={e => setSerumGluc(e.target.value)} placeholder="mg/dL" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>CSF glucose</div>
            <input value={csfGluc} onChange={e => setCsfGluc(e.target.value)} placeholder="mg/dL" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        {glucRatio !== null && (
          <div style={aBox(parseFloat(glucRatio) < 0.4 ? T.coral : parseFloat(glucRatio) < 0.6 ? T.gold : T.green, 0)}>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: parseFloat(glucRatio) < 0.4 ? T.coral : parseFloat(glucRatio) < 0.6 ? T.gold : T.green }}>
              Ratio: {glucRatio}
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>
              {parseFloat(glucRatio) < 0.4
                ? "< 0.4 — Strongly suggests bacterial meningitis"
                : parseFloat(glucRatio) < 0.6
                  ? "0.4–0.6 — Borderline (bacterial, fungal, or TB possible)"
                  : "> 0.6 — Normal (viral meningitis or no meningitis)"}
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 10 }}>Traumatic Tap Correction</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>CSF WBC</div>
            <input value={csfWbc} onChange={e => setCsfWbc(e.target.value)} placeholder="cells/µL" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>CSF RBC</div>
            <input value={csfRbc} onChange={e => setCsfRbc(e.target.value)} placeholder="cells/µL" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        {corrWbc !== null && (
          <div style={aBox(corrWbc > 5 ? T.coral : T.green, 0)}>
            <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 2 }}>Corrected WBC (subtract 1 WBC per 600 RBCs)</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: corrWbc > 5 ? T.coral : T.green }}>{corrWbc} cells/µL</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{corrWbc > 5 ? "Elevated — true pleocytosis beyond traumatic contribution" : "Normal — elevated WBC may be explained by bloody tap"}</div>
          </div>
        )}
      </div>

      <div style={sL(T.purple)}>Additional CSF Tests to Order</div>
      {[
        { test: "CSF Culture",            when: "Always — gold standard · 70–85% sensitivity in bacterial" },
        { test: "Gram Stain",             when: "Immediate result · 60–80% in bacterial · order STAT" },
        { test: "CSF Lactate",            when: "> 3.5 mmol/L strongly suggests bacterial over viral" },
        { test: "PCR Panel (BioFire ME)", when: "HSV-1/2 · enteroviruses · bacterial targets · results in 1h" },
        { test: "Cryptococcal Antigen",   when: "HIV+ · immunocompromised · nearly 100% sensitivity for cryptococcal meningitis" },
        { test: "India Ink",              when: "Cryptococcal meningitis — 60–80% sensitivity" },
        { test: "AFB Smear + Culture",    when: "If TB meningitis suspected (lymphs + low glucose + chronic course)" },
        { test: "Cytology",               when: "If malignant meningitis (carcinomatous) in differential" },
        { test: "VDRL / RPR",             when: "Neurosyphilis if exposure history or positive serum RPR" },
      ].map(({ test, when }) => (
        <div key={test} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: T.purple, minWidth: 160, flexShrink: 0 }}>{test}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{when}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={sL()}>Neurologic Monitoring</div>
      {[
        { freq: "Every 2–4h",   items: "GCS / neuro checks · pupils · focal deficits · seizure activity",                                        color: T.coral },
        { freq: "Every 6–8h",   items: "Vital signs · fever curve · BP (permissive hypertension for cerebral perfusion)",                         color: T.gold },
        { freq: "Every 12–24h", items: "BMP (Na⁺ — SIADH) · CBC · CRP/ESR · recheck if not improving",                                          color: T.teal },
        { freq: "At 48–72h",    items: "Reassess diagnosis · de-escalate antibiotics with culture data · consider repeat LP if not improving",    color: T.green },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 7, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 105, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Complications &amp; Management</div>
      {COMPLICATIONS.map(({ comp, mgmt, color, urgent }) => (
        <div key={comp} style={{ ...G(), padding: "11px 13px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{comp}</span>
            {urgent && <span style={{ ...tag(T.coral), fontSize: 9 }}>URGENT</span>}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{mgmt}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>ICP Management</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { step: "HOB 30–45°",             detail: "Reduces ICP by facilitating venous drainage — do for all patients" },
          { step: "Avoid hypotonic fluids",  detail: "Use isotonic NS — hypotonic fluids worsen cerebral edema" },
          { step: "Mannitol 0.5–1 g/kg IV",  detail: "For signs of herniation or acute ICP elevation — osmotic diuresis" },
          { step: "3% NaCl 150–250 mL IV",   detail: "Alternative to mannitol — preferred if hyponatremia coexists (SIADH)" },
          { step: "Brief hyperventilation",  detail: "Target PaCO₂ 35–40 mmHg temporarily — bridge only, causes cerebral vasoconstriction" },
          { step: "Neurosurgery consult",    detail: "EVD / ventriculostomy for hydrocephalus or refractory ICP elevation" },
        ].map(({ step, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, minWidth: 160, flexShrink: 0 }}>{step}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Antibiotic Duration by Organism</div>
      {ABX_DURATION.map(({ org, days, color }) => (
        <div key={org} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `3px solid ${color}` }}>
          <span style={{ fontSize: 12, color: T.white }}>{org}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color }}>{days}</span>
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition &amp; Public Health</div>
      <div style={{ ...card() }}>
        {[
          { label: "ICU",                  detail: "Altered mentation · focal deficits · seizures · hemodynamic instability · papilledema · shock" },
          { label: "Droplet Precautions",  detail: "N. meningitidis — maintain until 24h of effective antibiotics" },
          { label: "Chemoprophylaxis",     detail: "Close contacts of N. meningitidis: rifampin 600 mg PO q 12h × 4 doses · or ciprofloxacin 500 mg PO × 1 · or ceftriaxone 250 mg IM × 1" },
          { label: "Public Health",        detail: "Report N. meningitidis to local health department immediately" },
          { label: "Audiological Testing", detail: "Hearing loss is most common sequela — especially with S. pneumoniae. Test before discharge." },
          { label: "Vaccination",          detail: "Meningococcal vaccine (MenACWY, MenB) for contacts and during outbreaks" },
        ].map(({ label, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 140, flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(20,184,166,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#a78bfa,#6d28d9)")}>🧠 Neurologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>IDSA / de Gans 2002</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Meningitis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Dex before antibiotics · Empiric coverage by age · CSF profiles · LP calculator · Complications</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.teal : T.border}`, background: tab === i ? "rgba(20,184,166,0.14)" : T.glass, color: tab === i ? T.teal : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {tab === 0 && Tab0}
        {tab === 1 && Tab1}
        {tab === 2 && Tab2}
        {tab === 3 && Tab3}
      </div>
    </div>
  );
}