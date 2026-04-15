// DyspneaHub.jsx
// Integrated Dyspnea (SOB) Evaluation Hub
// Combines: Differential Diagnosis · CURB-65 · Modified Shock Index
//           Acute Dyspnea Protocol · Disposition Matrix
//
// Clinical basis:
//   - CURB-65 for CAP severity (Lim et al)
//   - Modified Shock Index (HR/SBP) for hemodynamic risk
//   - ESC 2021 acute PE guidelines
//   - ACC/AHA heart failure guidelines 2022
//   - ACEP 2024 acute dyspnea approach
//
// Route: /DyspneaHub
// Standalone page. No embedded encounter props required.

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── Font + style injection ─────────────────────────────────────────────────
(() => {
  if (document.getElementById("dh-fonts")) return;
  const l = document.createElement("link");
  l.id = "dh-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dh-css";
  s.textContent = `
    @keyframes dh-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .dh-fade{animation:dh-fade .2s ease forwards}
    @keyframes shimmer-dh{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-dh{background:linear-gradient(90deg,#f2f7ff 0%,#00d4b4 40%,#4da6ff 60%,#f2f7ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-dh 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Tokens ─────────────────────────────────────────────────────────────────
const T = {
  bg:"#07090f", panel:"#0d1117", card:"#111923",
  txt:"#f0f4ff", txt2:"#b0c4de", txt3:"#7896b4", txt4:"#4a6a8a",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5757", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Tab config ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"ddx",      label:"Differential",    icon:"🫁", color:T.teal   },
  { id:"curb65",   label:"CURB-65",         icon:"🧮", color:T.purple },
  { id:"shock",    label:"Shock Index",     icon:"⚡", color:T.orange },
  { id:"protocol", label:"Acute Protocol",  icon:"💊", color:T.blue   },
  { id:"dispo",    label:"Disposition",     icon:"🚪", color:T.coral  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DIFFERENTIAL DIAGNOSIS FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════
const DDX_CATEGORIES = [
  {
    name:"Cardiac",
    color:T.coral,
    conditions:[
      { dx:"Acute decompensated HF", icon:"💓", clue:"Orthopnea, PND, edema, elevated JVP" },
      { dx:"ACS/MI", icon:"🚨", clue:"Chest pain, troponin elevation, ECG changes" },
      { dx:"Pulmonary embolism", icon:"🫁", clue:"Tachycardia, unilateral leg swelling, hypoxia" },
      { dx:"Pericarditis/tamponade", icon:"💔", clue:"Pleuritic chest pain, pulsus, muffled heart sounds" },
      { dx:"Arrhythmia", icon:"⚡", clue:"Palpitations, irregular rhythm, syncope risk" },
    ],
  },
  {
    name:"Pulmonary",
    color:T.teal,
    conditions:[
      { dx:"Pneumonia (CAP)", icon:"🦠", clue:"Fever, cough, infiltrate on imaging, elevated WBC" },
      { dx:"COPD exacerbation", icon:"🚬", clue:"Wheezing, productive cough, smoking history" },
      { dx:"Asthma/status asthmaticus", icon:"😮", clue:"Wheezing, accessory muscle use, peak flow ↓" },
      { dx:"Pneumothorax", icon:"💨", clue:"Pleuritic pain, unilateral hyperresonance, ↓ breath sounds" },
      { dx:"Acute respiratory distress", icon:"🫁", clue:"Rapid shallow breathing, bilateral infiltrates, PaO2/FiO2 ↓" },
    ],
  },
  {
    name:"Metabolic/Systemic",
    color:T.gold,
    conditions:[
      { dx:"Anemia", icon:"🩸", clue:"Hemoglobin ↓, tachycardia disproportionate to degree of SOB" },
      { dx:"Sepsis", icon:"🦠", clue:"Fever/hypothermia, lactate ↑, hypotension, source identified" },
      { dx:"Metabolic acidosis (DKA, lactate)", icon:"⚠️", clue:"pH ↓, anion gap ↑, Kussmaul breathing" },
      { dx:"Thyroid storm", icon:"🔥", clue:"Fever, tachycardia, tremor, altered mental status" },
    ],
  },
  {
    name:"Neurologic/Neuromuscular",
    color:T.blue,
    conditions:[
      { dx:"Guillain-Barré syndrome", icon:"🧠", clue:"Ascending paralysis, areflexia, respiratory compromise" },
      { dx:"Myasthenia crisis", icon:"💪", clue:"Ptosis, diplopia, respiratory muscle weakness" },
      { dx:"Spinal cord compression", icon:"🦴", clue:"Acute paralysis below lesion level" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CURB-65 (Community-Acquired Pneumonia Severity)
// ═══════════════════════════════════════════════════════════════════════════
function calcCURB65(fields) {
  let score = 0;
  if (fields.confusion) score += 1;
  if (parseInt(fields.rr) > 30) score += 1;
  if (parseInt(fields.sbp) < 90 || parseInt(fields.dbp) <= 60) score += 1;
  if (parseInt(fields.age) >= 65) score += 1;
  if (fields.urea !== "" && parseInt(fields.urea) > 7) score += 1;
  return score;
}

function curb65Risk(score) {
  if (score === 0) return { label:"Low Risk", color:T.teal, mortality:"< 1%", rec:"Outpatient treatment" };
  if (score === 1) return { label:"Low Risk", color:T.teal, mortality:"1–2%", rec:"Outpatient or short-stay admission" };
  if (score === 2) return { label:"Moderate Risk", color:T.gold, mortality:"2–3%", rec:"Short-stay admission or observation" };
  if (score === 3) return { label:"High Risk", color:T.orange, mortality:"8–10%", rec:"Admission recommended" };
  return { label:"Very High Risk", color:T.coral, mortality:"> 15%", rec:"ICU admission, consider vasopressors" };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODIFIED SHOCK INDEX = HR / SBP
// ═══════════════════════════════════════════════════════════════════════════
function calcShockIndex(hr, sbp) {
  const h = parseInt(hr);
  const s = parseInt(sbp);
  if (isNaN(h) || isNaN(s) || s === 0) return null;
  return (h / s).toFixed(2);
}

function shockIndexRisk(msi) {
  const val = parseFloat(msi);
  if (val < 0.5) return { label:"Normal", color:T.teal, desc:"Stable perfusion" };
  if (val < 0.7) return { label:"Borderline", color:T.gold, desc:"Monitor closely" };
  if (val < 1.0) return { label:"Elevated", color:T.orange, desc:"Compensatory tachycardia, possible shock" };
  return { label:"Severe", color:T.coral, desc:"Likely septic/cardiogenic shock — urgent resuscitation" };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACUTE DYSPNEA PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════
const DYSPNEA_PROTOCOL = [
  {
    title:"Immediate Stabilization",
    color:T.coral,
    steps:[
      "Position upright, place on continuous pulse oximetry and cardiac monitor",
      "Supplemental oxygen: target SpO2 ≥ 90% (or ≥ 88% if COPD/CO2 retention risk)",
      "IV access × 2 if hypoxemic or hemodynamically unstable",
      "If respiratory distress: prepare for intubation (RSI drugs drawn up, difficult airway cart accessible)",
      "Stat 12-lead ECG to rule out ACS, arrhythmia, PE",
    ],
  },
  {
    title:"Diagnostic Workup",
    color:T.blue,
    steps:[
      "Portable CXR (AP, upright vs supine based on stability)",
      "BMP (Cr, BUN, glucose, lactate), CBC, troponin, D-dimer (if PE suspected), BNP if HF suspected",
      "ABG if severe hypoxemia or altered mental status (not before pulse ox if stable)",
      "Imaging: CT pulmonary angiogram (CTPA) if PE risk; echo if acute HF or pericardial effusion suspected",
    ],
  },
  {
    title:"Diuresis (for pulmonary edema/HF)",
    color:T.teal,
    steps:[
      "Furosemide 40–80 mg IV × 1 (higher if chronic loop use) — reassess in 1 hour",
      "Nitroglycerin sublingual 0.4 mg × 3 q5 min (hold if SBP < 90)",
      "CPAP 5–10 cm H2O + FiO2 0.5–0.8 for respiratory assistance in acute pulmonary edema",
      "Monitor for hyperkalemia, hypotension, acute kidney injury during aggressive diuresis",
    ],
  },
  {
    title:"Bronchospasm (Asthma/COPD Exacerbation)",
    color:T.orange,
    steps:[
      "Albuterol 2.5 mg nebulized q15 min × 3, then q4–6h",
      "Ipratropium 0.5 mg q6h for COPD (synergistic with albuterol)",
      "Methylprednisolone 40–125 mg IV (or prednisone 40 mg PO)",
      "Consider magnesium sulfate 2 g IV over 20 min if severe/no response",
      "IV or IM epinephrine 0.3–0.5 mg if status asthmaticus with altered mental status",
    ],
  },
  {
    title:"Infection/Sepsis (CAP, Atypical, Aspiration)",
    color:T.purple,
    steps:[
      "Empiric antibiotics within 1 hour of diagnosis",
      "CAP-OP: amoxicillin-clavulanate or respiratory fluoroquinolone",
      "CAP-Admit: ceftriaxone + azithromycin or respiratory fluoroquinolone ± vancomycin if risk factors",
      "Aspiration/atypical: ampicillin-sulbactam or clindamycin ± fluoroquinolone",
      "IV fluids: start 30 mL/kg bolus if sepsis + hypotension; reassess after 1 hour",
    ],
  },
  {
    title:"PE Suspected",
    color:T.coral,
    steps:[
      "If hemodynamically unstable or right heart strain on echo → consider thrombolysis or embolectomy",
      "Anticoagulation: UFH 80 units/kg IV bolus + 18 units/kg/hr infusion (if no contraindication) OR LMWH if outpatient",
      "If PE confirmed and contraindication to AC → IVC filter",
      "Transfer to facility with thrombolysis/embolectomy capability if massive PE",
    ],
  },
  {
    title:"Key Pearls",
    color:T.gold,
    steps:[
      "Early recognition of 'tripod' position, accessory muscle use, altered mental status = impending respiratory failure",
      "Avoid oral furosemide in acute cardiogenic pulmonary edema — IV diuretics are more reliable",
      "Always consider PE in dyspneic patients with unilateral leg edema or chest pain",
      "Modified Shock Index > 1.0 is a harbinger of shock — act early before hypotension develops",
      "Lactate is a marker of end-organ hypoperfusion — persistent ↑ lactate predicts worse outcomes",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DISPOSITION MATRIX
// ═══════════════════════════════════════════════════════════════════════════
function dispositionRec(ddx, msi, curb, sbp, rr, o2sat) {
  if (sbp < 80 || rr > 40 || o2sat < 80) {
    return {
      dispo:"Admit — ICU",
      color:T.coral,
      icon:"🚨",
      detail:"Hemodynamic instability or severe hypoxia — urgent ICU care",
      plan:[
        "Continuous monitoring, oxygen, vasopressor support if needed",
        "Intubation standby, aggressive workup (imaging, labs)",
        "Consider transfer to facility with extracorporeal support if massive PE",
      ],
    };
  }

  if (msi > 0.7 || curb >= 3) {
    return {
      dispo:"Admit — Floor/Observation",
      color:T.orange,
      icon:"🏥",
      detail:"Moderate risk — admission recommended",
      plan:[
        "Telemetry monitoring, oxygen, diuretics if HF",
        "Diagnostic imaging and labs as indicated",
        "Cardiology or pulmonology consult if indicated",
      ],
    };
  }

  return {
    dispo:"Observation / Outpatient Follow-up",
    color:T.teal,
    icon:"🏠",
    detail:"Low to moderate risk — consider discharge with close follow-up",
    plan:[
      "Outpatient follow-up within 24–48 hours",
      "Stress test or functional assessment if cardiac dyspnea suspected",
      "Strict return precautions: worsening SOB, chest pain, syncope",
    ],
  };
}

// ── Reusable components ────────────────────────────────────────────────────

function TabBtn({ tab, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:6,
        padding:"8px 14px", borderRadius:9, cursor:"pointer",
        transition:"all .15s",
        border:`1px solid ${active ? tab.color + "77" : "rgba(32,48,72,0.55)"}`,
        background:active
          ? `linear-gradient(135deg,${tab.color}18,${tab.color}06)`
          : "rgba(13,17,23,0.6)",
        color:active ? tab.color : T.txt4,
        fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
      <span style={{ fontSize:14 }}>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  );
}

function InfoBox({ color, icon, title, children }) {
  return (
    <div style={{ padding:"10px 13px", borderRadius:9,
      background:`${color}08`,
      border:`1px solid ${color}30`,
      borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:8, color, letterSpacing:1.5,
          textTransform:"uppercase", marginBottom:6 }}>
          {icon && <span style={{ marginRight:5 }}>{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB PANELS
// ═══════════════════════════════════════════════════════════════════════════

function DDxTab() {
  const [selected, setSelected] = useState({});
  return (
    <div className="dh-fade">
      {DDX_CATEGORIES.map(cat => (
        <div key={cat.name} style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:14, color:cat.color,
            marginBottom:8 }}>
            {cat.name}
          </div>
          {cat.conditions.map((c, i) => (
            <button key={i} onClick={() => setSelected(p => ({...p, [cat.name+i]: !p[cat.name+i]}))}
              style={{ display:"flex", alignItems:"flex-start", gap:9,
                width:"100%", padding:"9px 12px", borderRadius:8,
                cursor:"pointer", textAlign:"left", border:"none",
                marginBottom:5, transition:"background .1s",
                background:selected[cat.name+i]
                  ? `${cat.color}12` : "rgba(13,17,23,0.6)",
                borderLeft:`3px solid ${selected[cat.name+i] ? cat.color : "rgba(32,56,96,0.4)"}` }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{c.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:T.txt2, fontWeight:600 }}>
                  {c.dx}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.txt4, marginTop:2 }}>
                  {c.clue}
                </div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function CURB65Tab() {
  const [fields, setFields] = useState({
    confusion:false, rr:"", sbp:"", age:"", urea:""
  });
  const setF = (k, v) => setFields(p => ({...p, [k]:v}));
  const score = calcCURB65(fields);
  const risk = curb65Risk(score);

  return (
    <div className="dh-fade">
      <InfoBox color={T.purple} title="CAP Severity Scoring">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.6 }}>
          Confusion · Respiratory Rate &gt; 30 · Systolic BP &lt; 90 · Age ≥ 65 · Urea &gt; 7 mmol/L
          — Higher score = worse prognosis
        </div>
      </InfoBox>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, margin:"12px 0" }}>
        <div>
          <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.2, textTransform:"uppercase" }}>Age</label>
          <input type="number" value={fields.age}
            onChange={e => setF("age", e.target.value)}
            placeholder="years"
            style={{ width:"100%", padding:"8px", background:"rgba(13,17,23,0.9)",
              border:"1px solid rgba(77,166,255,0.3)", borderRadius:6,
              fontFamily:"'JetBrains Mono',monospace", fontSize:14,
              color:T.blue, outline:"none" }} />
        </div>
        <div>
          <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.2, textTransform:"uppercase" }}>Respiratory Rate</label>
          <input type="number" value={fields.rr}
            onChange={e => setF("rr", e.target.value)}
            placeholder="breaths/min"
            style={{ width:"100%", padding:"8px", background:"rgba(13,17,23,0.9)",
              border:"1px solid rgba(77,166,255,0.3)", borderRadius:6,
              fontFamily:"'JetBrains Mono',monospace", fontSize:14,
              color:T.blue, outline:"none" }} />
        </div>
        <div>
          <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.2, textTransform:"uppercase" }}>Systolic BP</label>
          <input type="number" value={fields.sbp}
            onChange={e => setF("sbp", e.target.value)}
            placeholder="mmHg"
            style={{ width:"100%", padding:"8px", background:"rgba(13,17,23,0.9)",
              border:"1px solid rgba(77,166,255,0.3)", borderRadius:6,
              fontFamily:"'JetBrains Mono',monospace", fontSize:14,
              color:T.blue, outline:"none" }} />
        </div>
        <div>
          <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.2, textTransform:"uppercase" }}>Urea (mmol/L)</label>
          <input type="number" value={fields.urea}
            onChange={e => setF("urea", e.target.value)}
            placeholder="mmol/L"
            style={{ width:"100%", padding:"8px", background:"rgba(13,17,23,0.9)",
              border:"1px solid rgba(77,166,255,0.3)", borderRadius:6,
              fontFamily:"'JetBrains Mono',monospace", fontSize:14,
              color:T.blue, outline:"none" }} />
        </div>
      </div>

      <button onClick={() => setF("confusion", !fields.confusion)}
        style={{ display:"flex", alignItems:"center", gap:9,
          width:"100%", padding:"9px 12px", borderRadius:8,
          cursor:"pointer", textAlign:"left", border:"none",
          marginBottom:8,
          background:fields.confusion ? "rgba(155,109,255,0.12)" : "rgba(13,17,23,0.6)",
          borderLeft:`3px solid ${fields.confusion ? T.purple : "rgba(32,56,96,0.4)"}` }}>
        <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
          border:`2px solid ${fields.confusion ? T.purple : "rgba(42,79,122,0.5)"}`,
          background:fields.confusion ? T.purple : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {fields.confusion && <span style={{ color:"#07090f", fontSize:9, fontWeight:900 }}>✓</span>}
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2 }}>
          Acute confusion present
        </span>
      </button>

      <div style={{ padding:"12px 14px", borderRadius:10,
        background:`${risk.color}09`,
        border:`1px solid ${risk.color}35` }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:16, color:risk.color }}>
            {risk.label}
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:36, fontWeight:900, color:risk.color }}>
            {score}
          </span>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.6 }}>
          <strong>Mortality:</strong> {risk.mortality} · <strong>Recommendation:</strong> {risk.rec}
        </div>
      </div>
    </div>
  );
}

function ShockIndexTab() {
  const [hr, setHR] = useState("");
  const [sbp, setSBP] = useState("");
  const msi = useMemo(() => calcShockIndex(hr, sbp), [hr, sbp]);
  const risk = msi ? shockIndexRisk(msi) : null;

  return (
    <div className="dh-fade">
      <InfoBox color={T.orange} title="Modified Shock Index = HR / SBP">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.6 }}>
          Normal &lt; 0.5 · Borderline 0.5–0.7 · Elevated 0.7–1.0 · Severe &gt; 1.0
          — Predicts shock and mortality independent of hypotension
        </div>
      </InfoBox>

      <div style={{ display:"flex", gap:10, margin:"12px 0" }}>
        <div style={{ flex:1 }}>
          <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", display:"block", marginBottom:4 }}>
            Heart Rate
          </label>
          <input type="number" value={hr}
            onChange={e => setHR(e.target.value)}
            placeholder="bpm"
            style={{ width:"100%", padding:"8px", background:"rgba(13,17,23,0.9)",
              border:"1px solid rgba(77,166,255,0.3)", borderRadius:6,
              fontFamily:"'JetBrains Mono',monospace", fontSize:18,
              fontWeight:700, color:T.blue, outline:"none" }} />
        </div>
        <div style={{ flex:1 }}>
          <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", display:"block", marginBottom:4 }}>
            Systolic BP
          </label>
          <input type="number" value={sbp}
            onChange={e => setSBP(e.target.value)}
            placeholder="mmHg"
            style={{ width:"100%", padding:"8px", background:"rgba(13,17,23,0.9)",
              border:"1px solid rgba(77,166,255,0.3)", borderRadius:6,
              fontFamily:"'JetBrains Mono',monospace", fontSize:18,
              fontWeight:700, color:T.blue, outline:"none" }} />
        </div>
      </div>

      {risk && (
        <div style={{ padding:"12px 14px", borderRadius:10,
          background:`${risk.color}09`,
          border:`1px solid ${risk.color}35` }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:16, color:risk.color }}>
              {risk.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:32, fontWeight:900, color:risk.color }}>
              {msi}
            </span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt3, lineHeight:1.6 }}>
            {risk.desc}
          </div>
        </div>
      )}
    </div>
  );
}

function ProtocolTab() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="dh-fade">
      {DYSPNEA_PROTOCOL.map((section, i) => (
        <div key={i} style={{ marginBottom:6, borderRadius:10,
          overflow:"hidden",
          border:`1px solid ${expanded===i ? section.color+"55" : "rgba(32,56,96,0.4)"}` }}>
          <button onClick={() => setExpanded(p => p===i ? null : i)}
            style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", width:"100%",
              padding:"10px 13px", cursor:"pointer",
              border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${section.color}0c,rgba(13,17,23,0.96))` }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background:section.color, flexShrink:0 }} />
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:section.color }}>
                {section.title}
              </span>
            </div>
            <span style={{ color:T.txt4, fontSize:10 }}>
              {expanded===i ? "▲" : "▼"}
            </span>
          </button>
          {expanded === i && (
            <div style={{ padding:"8px 13px 12px",
              borderTop:`1px solid ${section.color}22` }}>
              {section.steps.map((step, j) => (
                <div key={j} style={{ display:"flex", gap:8,
                  alignItems:"flex-start", marginBottom:7 }}>
                  <span style={{ color:section.color, fontSize:8,
                    marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DispoTab({ msi, curb, sbp, rr, o2sat }) {
  const rec = useMemo(() =>
    dispositionRec(null, msi ? parseFloat(msi) : 0, curb || 0, parseInt(sbp), parseInt(rr), parseInt(o2sat)),
    [msi, curb, sbp, rr, o2sat]
  );

  if (!rec) return <div style={{ padding:"24px 0", textAlign:"center" }}>Complete vitals to generate recommendation</div>;

  return (
    <div className="dh-fade">
      <div style={{ padding:"16px", borderRadius:12, marginBottom:14,
        background:`${rec.color}0c`,
        border:`2px solid ${rec.color}55` }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:12, marginBottom:10 }}>
          <span style={{ fontSize:32 }}>{rec.icon}</span>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:900, fontSize:22, color:rec.color }}>
              {rec.dispo}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, marginTop:2 }}>
              {rec.detail}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {rec.plan.map((p, i) => (
            <div key={i} style={{ display:"flex", gap:8,
              alignItems:"flex-start" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:rec.color, minWidth:18,
                marginTop:1, fontWeight:700 }}>
                {i+1}.
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:12, color:T.txt2, lineHeight:1.6 }}>
                {p}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function DyspneaHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("ddx");

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12,
                fontWeight:600, padding:"5px 14px", borderRadius:8,
                background:"rgba(22,32,48,0.7)",
                border:"1px solid rgba(32,56,96,0.5)",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(7,9,15,0.9)",
                border:"1px solid rgba(32,56,96,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>DYSPNEA</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,212,180,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-dh"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Dyspnea Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              Differential Diagnosis · CURB-65 · Shock Index · Acute Protocol
              · ACC/AHA 2022 · ACEP 2024
            </p>
          </div>
        )}

        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", marginBottom:14,
          background:"rgba(13,17,23,0.8)",
          border:"1px solid rgba(32,56,96,0.4)",
          borderRadius:12 }}>
          {TABS.map(t => (
            <TabBtn key={t.id} tab={t} active={tab===t.id}
              onClick={() => setTab(t.id)} />
          ))}
        </div>

        <div>
          {tab === "ddx"      && <DDxTab />}
          {tab === "curb65"   && <CURB65Tab />}
          {tab === "shock"    && <ShockIndexTab />}
          {tab === "protocol" && <ProtocolTab />}
          {tab === "dispo"    && <DispoTab msi={""} curb={0} sbp={""} rr={""} o2sat={""} />}
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA DYSPNEA HUB · CLINICAL DECISION SUPPORT ONLY
            · CURB-65 · MODIFIED SHOCK INDEX · ACC/AHA 2022 · ACEP 2024
          </div>
        )}
      </div>
    </div>
  );
}