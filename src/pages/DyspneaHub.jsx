// DyspneaHub.jsx
// Integrated Dyspnea Evaluation Hub
//
// Clinical basis:
//   - BLUE Protocol (Lichtenstein 2008) — POCUS-guided differential
//   - PERC Rule (Kline 2004) — PE rule-out in low-risk patients
//   - Wells PE Score — pre-test probability
//   - Framingham criteria — CHF diagnosis
//   - BNP/NT-proBNP thresholds (ESC 2021)
//   - GOLD COPD staging + DECAF score
//   - NAEPP Asthma severity classification
//   - CURB-65 with antibiotic recommendations (IDSA 2019)
//
// Route: /DyspneaHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("dysp-fonts")) return;
  const l = document.createElement("link");
  l.id = "dysp-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dysp-css";
  s.textContent = `
    @keyframes dysp-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .dysp-in{animation:dysp-in .18s ease forwards}
    @keyframes shimmer-d{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-d{background:linear-gradient(90deg,#f0f4ff 0%,#4da6ff 40%,#00d4b4 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-d 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050d1a", panel:"#09141f",
  txt:"#eef3ff", txt2:"#a8c4e0", txt3:"#6b96bc", txt4:"#3f6585",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff3d3d",
  cyan:"#00c8d4",
};

const TABS = [
  { id:"blue",      label:"BLUE Protocol",    icon:"🔊", color:T.cyan   },
  { id:"pe",        label:"PE Pathway",        icon:"🫁", color:T.coral  },
  { id:"chf",       label:"CHF / ADHF",        icon:"💧", color:T.blue   },
  { id:"copd",      label:"COPD / Asthma",     icon:"💨", color:T.orange },
  { id:"pneumonia", label:"Pneumonia",         icon:"🫁", color:T.purple },
];

// ── Small shared UI ────────────────────────────────────────────────────────
function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom:14, padding:"11px 13px", borderRadius:10,
      background:`${color}07`,
      border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color, letterSpacing:1.5, textTransform:"uppercase",
        marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}

function Bullet({ text, color, sub }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:7,
        marginTop:4, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{text}</span>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function CheckRow({ label, sub, checked, onToggle, color }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9,
        width:"100%", padding:"8px 11px", borderRadius:8,
        cursor:"pointer", textAlign:"left", border:"none",
        marginBottom:4, transition:"background .1s",
        background:checked ? `${color||T.teal}10` : "rgba(9,20,31,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.teal) : "rgba(30,55,85,0.4)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4,
        flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.teal) : "rgba(42,79,122,0.5)"}`,
        background:checked ? (color||T.teal) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#050d1a", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.teal) : T.txt2 }}>
          {label}
        </div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}

function NumInput({ label, value, onChange, unit, color }) {
  return (
    <div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
        marginBottom:4 }}>{label}</div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input type="number" value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width:"100%", padding:"8px 10px",
            background:"rgba(9,20,31,0.9)",
            border:`1px solid ${value ? (color||T.blue)+"55" : "rgba(30,55,85,0.4)"}`,
            borderRadius:7, outline:"none",
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:18, fontWeight:700,
            color:color||T.blue }} />
        {unit && <span style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:9, color:T.txt4, whiteSpace:"nowrap" }}>{unit}</span>}
      </div>
    </div>
  );
}

function ResultBadge({ label, detail, color }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:10,
      background:`${color}0c`,
      border:`1px solid ${color}44`,
      marginTop:10 }}>
      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:18, color, marginBottom:4 }}>
        {label}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",
        fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>
        {detail}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BLUE PROTOCOL
// Lichtenstein 2008 — POCUS-guided differential for dyspnea
// Accuracy ~90% for identifying cause of acute dyspnea
// ═══════════════════════════════════════════════════════════════════════════
const BLUE_PROFILES = [
  {
    id:"A",
    name:"A Profile",
    color:T.gold,
    pattern:"Anterior A-lines bilaterally, no B-lines",
    diagnoses:["COPD exacerbation (most common)", "Asthma", "PE (A-lines + DVT = high PE probability)", "Normal lungs"],
    next:"Check for DVT (posterior tibial, femoral veins). If DVT present = PE protocol. If absent = consider COPD/asthma.",
  },
  {
    id:"B",
    name:"B Profile",
    color:T.blue,
    pattern:"Anterior B-lines bilaterally (≥ 3 B-lines per zone)",
    diagnoses:["Acute pulmonary edema / ADHF (most common)", "Bilateral pneumonia (less common)"],
    next:"BNP/NT-proBNP, CXR. If B-profile + cardiomegaly + pleural effusion = ADHF. Consider echo.",
  },
  {
    id:"AB",
    name:"A/B Profile",
    color:T.orange,
    pattern:"A-lines one side, B-lines other side (asymmetric)",
    diagnoses:["Pneumonia (especially lobar or unilateral)", "Lung contusion"],
    next:"Consider unilateral consolidation. Obtain CXR. Start empiric antibiotics if febrile.",
  },
  {
    id:"C",
    name:"C Profile (Consolidation)",
    color:T.coral,
    pattern:"Anterior consolidation with air bronchograms",
    diagnoses:["Pneumonia", "Lung collapse", "Contusion"],
    next:"CXR + CBC + procalcitonin. Dynamic air bronchograms support pneumonia over atelectasis.",
  },
  {
    id:"AP",
    name:"A Profile + Pleuritic Line",
    color:T.purple,
    pattern:"A-lines + absent lung sliding unilateral",
    diagnoses:["Pneumothorax (absent sliding = PTX until proven otherwise)"],
    next:"Confirm with M-mode (barcode sign). Lung point if partial PTX. Decompress if tension.",
  },
];

function BlueTab() {
  const [selected, setSelected] = useState(null);
  const profile = BLUE_PROFILES.find(p => p.id === selected);

  return (
    <div className="dysp-in">
      <Section color={T.cyan} title="BLUE Protocol — Bedside Lung Ultrasound">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.65, marginBottom:10 }}>
          Lichtenstein 2008 — 90% diagnostic accuracy for cause of acute dyspnea.
          Scan anterior zones (BLUE points) bilaterally for A/B-lines. Check
          posterolateral zones for effusion. Check for DVT if A-profile.
        </div>
        <div style={{ display:"grid", gap:7 }}>
          {BLUE_PROFILES.map(p => (
            <button key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
              style={{ display:"flex", alignItems:"flex-start", gap:10,
                padding:"10px 13px", borderRadius:9, cursor:"pointer",
                textAlign:"left", border:"none", transition:"all .12s",
                background:selected===p.id ? `${p.color}12` : "rgba(9,20,31,0.7)",
                borderLeft:`4px solid ${selected===p.id ? p.color : p.color+"40"}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Playfair Display',serif",
                  fontWeight:700, fontSize:13, color:p.color, marginBottom:2 }}>
                  {p.name}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.txt4 }}>{p.pattern}</div>
              </div>
              <span style={{ color:T.txt4, fontSize:10, flexShrink:0 }}>
                {selected===p.id ? "▲" : "▼"}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {profile && (
        <div style={{ padding:"11px 13px", borderRadius:10,
          background:`${profile.color}08`,
          border:`1px solid ${profile.color}35` }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:15, color:profile.color,
            marginBottom:8 }}>
            {profile.name} — Differential
          </div>
          <div style={{ marginBottom:10 }}>
            {profile.diagnoses.map((d, i) => (
              <Bullet key={i} text={d} color={profile.color} />
            ))}
          </div>
          <div style={{ padding:"7px 10px", borderRadius:7,
            background:"rgba(9,20,31,0.7)",
            border:"1px solid rgba(30,55,85,0.4)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.teal, letterSpacing:1.3,
              textTransform:"uppercase", marginBottom:4 }}>
              Next Step
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>
              {profile.next}
            </div>
          </div>
        </div>
      )}

      <Section color={T.teal} title="DVT Assessment — POCUS">
        {[
          { label:"Compression technique", sub:"Apply pressure at CFA, CFV, SFJ, popliteal. Non-compressibility = DVT" },
          { label:"Posterior tibial veins", sub:"Check at medial ankle — high-risk for isolated distal DVT" },
          { label:"Augmentation", sub:"Squeeze calf — loss of augmentation in vein = DVT proximal to probe" },
        ].map((b, i) => <Bullet key={i} {...b} color={T.teal} />)}
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PE PATHWAY
// PERC Rule → Wells PE → D-dimer → CTPA decision
// ═══════════════════════════════════════════════════════════════════════════
const PERC_CRITERIA = [
  { key:"age",    label:"Age < 50",                sub:"Patient is < 50 years old" },
  { key:"hr",     label:"Heart rate < 100",        sub:"HR < 100 bpm on presentation" },
  { key:"spo2",   label:"SpO2 ≥ 95% on room air", sub:"No supplemental O2 required to maintain" },
  { key:"hemo",   label:"No hemoptysis",           sub:"No blood in sputum" },
  { key:"estrogen",label:"No estrogen use",        sub:"Not on OCP, HRT, or pregnant" },
  { key:"dvt",    label:"No prior DVT or PE",      sub:"No documented prior VTE" },
  { key:"surgery",label:"No surgery/trauma in 4 weeks", sub:"No immobility, hospitalization, or procedure" },
  { key:"unilateral",label:"No unilateral leg swelling", sub:"No asymmetric lower extremity swelling" },
];

const WELLS_PE_ITEMS = [
  { key:"dvt_signs",  pts:3,  label:"Clinical signs/symptoms of DVT" },
  { key:"alt_less",   pts:3,  label:"PE more likely than alternative diagnosis" },
  { key:"hr_over",    pts:1.5,label:"Heart rate > 100 bpm" },
  { key:"immob",      pts:1.5,label:"Immobilization or surgery in last 4 weeks" },
  { key:"prior_vte",  pts:1.5,label:"Prior DVT or PE" },
  { key:"hemoptysis", pts:1,  label:"Hemoptysis" },
  { key:"malignancy", pts:1,  label:"Active malignancy (Rx in last 6 months or palliative)" },
];

function PETab() {
  const [percItems,  setPercItems]  = useState({});
  const [wellsItems, setWellsItems] = useState({});

  const percMet = PERC_CRITERIA.filter(c => percItems[c.key]).length;
  const percNeg = percMet === PERC_CRITERIA.length;
  const wellsTotal = WELLS_PE_ITEMS.reduce((s, i) =>
    s + (wellsItems[i.key] ? i.pts : 0), 0);

  const togglePerc  = k => setPercItems(p  => ({ ...p, [k]:!p[k]  }));
  const toggleWells = k => setWellsItems(p => ({ ...p, [k]:!p[k] }));

  const wellsStrata = wellsTotal < 2    ? { label:"Low",      color:T.teal,  rec:"Consider d-dimer — negative rules out PE" }
    : wellsTotal < 6   ? { label:"Moderate",  color:T.gold,  rec:"D-dimer if < 6; CTPA if d-dimer positive or Wells ≥ 6" }
    : wellsTotal >= 6  ? { label:"High",      color:T.coral, rec:"Proceed directly to CTPA — do not use d-dimer" }
    : null;

  return (
    <div className="dysp-in">
      {/* PERC */}
      <Section color={T.coral} title="PERC Rule — For Low-Pretest-Probability Patients Only">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:8, lineHeight:1.55 }}>
          Apply ONLY if clinical gestalt = low probability for PE.
          All 8 criteria must be present to rule out PE without d-dimer.
          Sensitivity 97.4% when applied correctly.
        </div>
        {PERC_CRITERIA.map(c => (
          <CheckRow key={c.key} label={c.label} sub={c.sub}
            checked={!!percItems[c.key]}
            onToggle={() => togglePerc(c.key)}
            color={T.teal} />
        ))}
        {percMet > 0 && (
          percNeg
            ? <ResultBadge label="PERC Negative" color={T.teal}
                detail="All 8 PERC criteria met in a low-probability patient — PE can be excluded without further workup. Document clinical reasoning and PERC criteria." />
            : <ResultBadge label={`PERC Not Met (${percMet}/8)`} color={T.gold}
                detail={`${8 - percMet} criteria not met — proceed to Wells PE score and d-dimer.`} />
        )}
      </Section>

      {/* Wells PE */}
      <Section color={T.orange} title="Wells PE Score">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color:T.txt4 }}>
            Check all that apply
          </span>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:28, fontWeight:900,
            color:wellsStrata?.color || T.txt4 }}>
            {wellsTotal}
          </div>
        </div>
        {WELLS_PE_ITEMS.map(item => (
          <button key={item.key}
            onClick={() => toggleWells(item.key)}
            style={{ display:"flex", alignItems:"center", gap:9,
              width:"100%", padding:"7px 11px", borderRadius:8,
              cursor:"pointer", textAlign:"left", border:"none",
              marginBottom:4, transition:"all .1s",
              background:wellsItems[item.key] ? "rgba(255,159,67,0.1)" : "rgba(9,20,31,0.7)",
              borderLeft:`3px solid ${wellsItems[item.key] ? T.orange : "rgba(30,55,85,0.4)"}` }}>
            <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
              border:`2px solid ${wellsItems[item.key] ? T.orange : "rgba(42,79,122,0.5)"}`,
              background:wellsItems[item.key] ? T.orange : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {wellsItems[item.key] && <span style={{ color:"#050d1a", fontSize:8, fontWeight:900 }}>✓</span>}
            </div>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11.5, color:wellsItems[item.key] ? T.orange : T.txt2, flex:1 }}>
              {item.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:10, fontWeight:700, color:T.orange, flexShrink:0 }}>
              +{item.pts}
            </span>
          </button>
        ))}
        {wellsTotal > 0 && wellsStrata && (
          <ResultBadge label={`${wellsStrata.label} Probability (Wells ${wellsTotal})`}
            color={wellsStrata.color} detail={wellsStrata.rec} />
        )}
      </Section>

      {/* D-dimer guidance */}
      <Section color={T.purple} title="D-dimer Strategy">
        {[
          { label:"Age-adjusted threshold", detail:"D-dimer < (age × 10 µg/L) in patients > 50 — increases specificity without losing sensitivity (ADJUST study)" },
          { label:"YEARS algorithm", detail:"3 criteria (DVT signs, hemoptysis, PE most likely Dx) × 0 criteria + D-dimer < 1000 = rule out; 1+ criteria + D-dimer < 500 = rule out" },
          { label:"Elevated d-dimer next step", detail:"Wells < 6: CTPA or V/Q scan. V/Q preferred if CrCl < 30, contrast allergy, young female (radiation), or pregnancy" },
        ].map((p, i) => (
          <div key={i} style={{ padding:"7px 10px", borderRadius:7,
            marginBottom:6, background:"rgba(9,20,31,0.7)",
            border:"1px solid rgba(30,55,85,0.4)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:T.purple, marginBottom:3 }}>{p.label}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
              color:T.txt3, lineHeight:1.55 }}>{p.detail}</div>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHF / ADHF TAB
// ═══════════════════════════════════════════════════════════════════════════
const FRAMINGHAM_MAJOR = [
  "Acute pulmonary edema",
  "Cardiomegaly on CXR",
  "Paroxysmal nocturnal dyspnea or orthopnea",
  "Neck vein distension (JVD)",
  "Rales (crackles)",
  "S3 gallop",
  "Central venous pressure > 16 cmH2O",
  "Circulation time ≥ 25 sec",
  "Hepatojugular reflux",
];

const FRAMINGHAM_MINOR = [
  "Ankle edema",
  "Night cough",
  "Dyspnea on ordinary exertion",
  "Hepatomegaly",
  "Pleural effusion",
  "Decrease in vital capacity (1/3 from max)",
  "Tachycardia (HR > 120)",
];

function CHFTab() {
  const [bnp, setBNP] = useState("");
  const [ef,  setEF]  = useState("");
  const [weight, setWeight] = useState("");
  const [priorFuro, setPriorFuro] = useState("");
  const [major, setMajor] = useState([]);
  const [minor, setMinor] = useState([]);

  const toggleMajor = v => setMajor(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleMinor = v => setMinor(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  // Framingham criteria: 2 major OR 1 major + 2 minor
  const framDx = major.length >= 2 || (major.length >= 1 && minor.length >= 2);

  // BNP interpretation
  const bnpVal = parseFloat(bnp);
  const bnpInterp = isNaN(bnpVal) ? null
    : bnpVal < 100   ? { label:"CHF unlikely", color:T.teal,   detail:"BNP < 100 pg/mL — sensitivity 90% for ruling out ADHF" }
    : bnpVal < 400   ? { label:"Gray zone", color:T.gold,       detail:"BNP 100–400 pg/mL — consider cardiac causes including cor pulmonale, PE, NSTEMI" }
    : bnpVal < 900   ? { label:"CHF likely", color:T.coral,     detail:"BNP 400–900 pg/mL — high probability ADHF" }
    : { label:"Severe ADHF", color:T.red,                       detail:"BNP > 900 pg/mL — significant cardiac decompensation, consider ICU" };

  // Furosemide dosing (DOSE trial — high-dose vs low-dose)
  const wtKg = parseFloat(weight);
  const priorMg = parseFloat(priorFuro);
  const furoDose = useMemo(() => {
    if (isNaN(wtKg) && isNaN(priorMg)) return null;
    if (!isNaN(priorMg) && priorMg > 0) {
      // DOSE trial: 2.5× home dose IV
      return {
        iv:Math.round(priorMg * 2.5),
        label:`IV furosemide ${Math.round(priorMg * 2.5)} mg bolus (2.5× home dose per DOSE trial)`,
        infusion:`Or: ${Math.round(priorMg * 2.5)} mg/24h continuous infusion`,
      };
    }
    if (!isNaN(wtKg)) {
      return {
        iv:Math.round(wtKg * 0.5),
        label:`Starting dose: furosemide ${Math.round(wtKg * 0.5)} mg IV (0.5 mg/kg for furosemide-naive)`,
        infusion:`Infusion: 0.1–0.4 mg/kg/hr`,
      };
    }
    return null;
  }, [wtKg, priorMg]);

  const efVal = parseFloat(ef);
  const efType = isNaN(efVal) ? null
    : efVal < 40 ? { label:"HFrEF (EF < 40%)", color:T.coral, note:"Target: BB, ACEi/ARB/ARNI, MRA, SGLT2i" }
    : efVal < 50 ? { label:"HFmrEF (EF 40–49%)", color:T.gold, note:"Evidence less robust — consider similar therapy" }
    : { label:"HFpEF (EF ≥ 50%)", color:T.blue, note:"Target: diuresis, HTN control, AF rate control, SGLT2i (EMPEROR-Preserved)" };

  return (
    <div className="dysp-in">
      {/* BNP */}
      <Section color={T.blue} title="BNP / NT-proBNP Interpretation">
        <div style={{ display:"grid",
          gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <NumInput label="BNP (pg/mL)" value={bnp}
            onChange={setBNP} color={T.blue} />
          <div style={{ padding:"8px 10px", borderRadius:8,
            background:"rgba(9,20,31,0.7)",
            border:"1px solid rgba(30,55,85,0.4)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1, marginBottom:6 }}>NT-proBNP THRESHOLDS</div>
            {[["< 75yo","< 300 rule-out | > 900 rule-in"],
              ["≥ 75yo","< 300 rule-out | > 1800 rule-in"]].map(([a,b]) => (
              <div key={a} style={{ display:"flex", gap:6,
                fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt3, marginBottom:3 }}>
                <span style={{ color:T.txt4, minWidth:50 }}>{a}:</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
        {bnpInterp && (
          <div style={{ padding:"9px 12px", borderRadius:8,
            background:`${bnpInterp.color}09`,
            border:`1px solid ${bnpInterp.color}30` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:bnpInterp.color,
              marginBottom:3 }}>{bnpInterp.label}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, lineHeight:1.55 }}>
              {bnpInterp.detail}
            </div>
          </div>
        )}
      </Section>

      {/* Diuresis dosing */}
      <Section color={T.teal} title="Furosemide Dosing (DOSE Trial)">
        <div style={{ display:"grid",
          gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <NumInput label="Home furosemide dose (mg)" value={priorFuro}
            onChange={setPriorFuro} color={T.teal} />
          <NumInput label="Weight (kg)" value={weight}
            onChange={setWeight} color={T.teal} />
        </div>
        {furoDose && (
          <div style={{ padding:"9px 12px", borderRadius:8,
            background:"rgba(0,212,180,0.08)",
            border:"1px solid rgba(0,212,180,0.3)" }}>
            <Bullet text={furoDose.label} color={T.teal} />
            <Bullet text={furoDose.infusion} color={T.teal} />
            <Bullet text="Reassess urine output at 2h — target 200 mL/hr (low threshold to escalate)" color={T.teal} />
            <Bullet text="Daily weight, strict I&Os, BMP q12–24h for K+/creatinine" color={T.teal} />
          </div>
        )}
        <div style={{ marginTop:8 }}>
          {[
            "NIV (CPAP 5–10 cmH2O or BiPAP) for severe ADHF — reduces intubation rate (meta-analysis)",
            "IV nitroglycerin 5–200 mcg/min if SBP > 110 — venodilation reduces preload rapidly",
            "Morphine: avoid — associated with increased intubation and ICU admissions in ADHF",
          ].map((b, i) => <Bullet key={i} text={b} color={T.teal} />)}
        </div>
      </Section>

      {/* EF type */}
      <Section color={T.purple} title="EF Classification">
        <NumInput label="Ejection Fraction (%)" value={ef}
          onChange={setEF} color={T.purple} />
        {efType && (
          <div style={{ marginTop:8, padding:"9px 12px", borderRadius:8,
            background:`${efType.color}09`,
            border:`1px solid ${efType.color}30` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:14, color:efType.color,
              marginBottom:3 }}>{efType.label}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3 }}>{efType.note}</div>
          </div>
        )}
      </Section>

      {/* Framingham */}
      <Section color={T.gold} title="Framingham Criteria (Clinical Diagnosis CHF)">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:8 }}>
          Diagnosis: 2 major criteria OR 1 major + 2 minor
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.gold, letterSpacing:1.3, marginBottom:5 }}>
          MAJOR ({major.length} selected)
        </div>
        {FRAMINGHAM_MAJOR.map(c => (
          <CheckRow key={c} label={c}
            checked={major.includes(c)}
            onToggle={() => toggleMajor(c)}
            color={T.gold} />
        ))}
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.gold, letterSpacing:1.3, margin:"8px 0 5px" }}>
          MINOR ({minor.length} selected)
        </div>
        {FRAMINGHAM_MINOR.map(c => (
          <CheckRow key={c} label={c}
            checked={minor.includes(c)}
            onToggle={() => toggleMinor(c)}
            color={T.gold} />
        ))}
        {(major.length + minor.length > 0) && (
          <ResultBadge
            label={framDx ? "Framingham Criteria Met" : "Criteria Not Met"}
            color={framDx ? T.gold : T.txt4}
            detail={framDx
              ? `${major.length} major + ${minor.length} minor criteria — consistent with CHF diagnosis`
              : `${major.length} major + ${minor.length} minor — insufficient for diagnosis`} />
        )}
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COPD / ASTHMA TAB
// ═══════════════════════════════════════════════════════════════════════════
const DECAF_ITEMS = [
  { key:"dyspnea",  pts:3, label:"eMRCD 5a/5b (too breathless to leave house)", sub:"0 if eMRCD 1-4a" },
  { key:"eosinop",  pts:2, label:"Eosinopenia (eosinophils < 0.05 × 10⁹/L)",   sub:"+2 pts if eosinopenia present" },
  { key:"consolid", pts:1, label:"Consolidation on CXR",                        sub:"New CXR opacity" },
  { key:"acidemia",  pts:1, label:"Acidemia (pH < 7.30)",                       sub:"Arterial or venous pH" },
  { key:"afib",     pts:1, label:"Atrial fibrillation on EKG or history",       sub:"Any AF documented" },
];

function COPDTab() {
  const [decaf,    setDecaf]    = useState({});
  const [pefr,     setPEFR]     = useState("");
  const [bestPEFR, setBestPEFR] = useState("");
  const [fev1,     setFEV1]     = useState("");

  const decafTotal = DECAF_ITEMS.reduce((s, i) =>
    s + (decaf[i.key] ? i.pts : 0), 0);

  const decafRisk = decafTotal <= 1 ? { label:"Low In-Hospital Mortality", color:T.teal, mort:"< 2%" }
    : decafTotal <= 3 ? { label:"Intermediate Mortality", color:T.gold, mort:"5–10%" }
    : { label:"High Mortality", color:T.coral, mort:"25–50%" };

  const pefrPct = bestPEFR && pefr
    ? Math.round((parseFloat(pefr) / parseFloat(bestPEFR)) * 100) : null;
  const asthmaStrata = pefrPct === null ? null
    : pefrPct > 70   ? { label:"Mild", color:T.teal }
    : pefrPct > 40   ? { label:"Moderate", color:T.gold }
    : pefrPct > 25   ? { label:"Severe", color:T.orange }
    : { label:"Life-threatening", color:T.coral };

  return (
    <div className="dysp-in">
      {/* COPD exacerbation treatment */}
      <Section color={T.orange} title="COPD Exacerbation — Treatment Ladder">
        {[
          { level:"All exacerbations", color:T.teal, steps:[
            "SABA (albuterol 2.5 mg q20 min × 3 neb or MDI 4–8 puffs) + ipratropium 0.5 mg",
            "Systemic corticosteroids: prednisone 40 mg PO × 5 days (preferred over IV — REDUCE trial)",
            "Supplemental O2 titrated to SpO2 88–92% — avoid over-oxygenation (Hering-Breuer reflex)",
          ]},
          { level:"Moderate-severe (pH 7.25-7.35, pCO2 > 45, RR > 24)", color:T.gold, steps:[
            "NIV (BiPAP) — reduces intubation, ICU, and mortality (Level A evidence)",
            "BiPAP: IPAP 12–20 cmH2O, EPAP 4–8 cmH2O, FiO2 titrate to SpO2 88–92%",
            "Antibiotics if purulent sputum: amoxicillin-clavulanate, doxycycline, or azithromycin 5d",
          ]},
          { level:"Severe (pH < 7.25, altered mental status, failing NIV)", color:T.coral, steps:[
            "RSI with ketamine induction (avoid propofol if hemodynamically unstable)",
            "Vent settings: TV 6–8 mL/kg IBW, RR 12–16, allow auto-PEEP if air trapping",
            "Sedation holiday early — target RASS -1 to -2 in most patients",
          ]},
        ].map((tier, i) => (
          <div key={i} style={{ marginBottom:10, padding:"9px 11px",
            borderRadius:9, background:`${tier.color}08`,
            border:`1px solid ${tier.color}28` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:tier.color, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:6 }}>{tier.level}</div>
            {tier.steps.map((s, j) => <Bullet key={j} text={s} color={tier.color} />)}
          </div>
        ))}
      </Section>

      {/* DECAF score */}
      <Section color={T.gold} title="DECAF Score — COPD Exacerbation Mortality">
        {DECAF_ITEMS.map(item => (
          <CheckRow key={item.key} label={item.label} sub={item.sub}
            checked={!!decaf[item.key]}
            onToggle={() => setDecaf(p => ({ ...p, [item.key]:!p[item.key] }))}
            color={T.gold} />
        ))}
        {Object.keys(decaf).length > 0 && (
          <ResultBadge
            label={`DECAF ${decafTotal} — ${decafRisk.label}`}
            color={decafRisk.color}
            detail={`Predicted in-hospital mortality: ${decafRisk.mort}. DECAF ≥ 3 = consider ICU.`} />
        )}
      </Section>

      {/* Asthma PEFR */}
      <Section color={T.cyan} title="Asthma — PEFR Severity">
        <div style={{ display:"grid",
          gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <NumInput label="Current PEFR (L/min)" value={pefr}
            onChange={setPEFR} color={T.cyan} />
          <NumInput label="Personal Best PEFR (L/min)" value={bestPEFR}
            onChange={setBestPEFR} color={T.cyan} />
        </div>
        {asthmaStrata && (
          <ResultBadge
            label={`${asthmaStrata.label} Exacerbation (${pefrPct}% of best)`}
            color={asthmaStrata.color}
            detail={
              asthmaStrata.label === "Mild"
                ? "PEFR > 70% — SABA + monitor, consider discharge"
                : asthmaStrata.label === "Moderate"
                ? "PEFR 40–70% — scheduled SABA q1-2h + systemic steroids + consider IV Mg"
                : asthmaStrata.label === "Severe"
                ? "PEFR 25–40% — SABA continuous neb + steroids + IV magnesium 2g over 20 min + heliox"
                : "PEFR < 25% — silent chest, altered mentation — prepare for RSI, get anesthesia"
            } />
        )}
        <div style={{ marginTop:8 }}>
          <Bullet text="Magnesium 2 g IV over 20 min for moderate-severe asthma (NNT ~8 to avoid admission)" color={T.cyan} />
          <Bullet text="Heliox 70:30 for near-fatal asthma — reduces turbulent flow, buys time" color={T.cyan} />
          <Bullet text="Ketamine 0.5–1 mg/kg IV for intubated asthma — bronchodilator, dissociative" color={T.cyan} />
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PNEUMONIA TAB
// CURB-65 + IDSA 2019 antibiotic recommendations
// ═══════════════════════════════════════════════════════════════════════════
const CURB65_ITEMS = [
  { key:"confusion", label:"Confusion (new)", sub:"AMTS ≤ 8 or new disorientation to person/place/time" },
  { key:"bun",       label:"BUN > 19 mg/dL (> 7 mmol/L)", sub:"Blood urea nitrogen elevated" },
  { key:"rr",        label:"Respiratory rate ≥ 30/min", sub:"On initial presentation" },
  { key:"bp",        label:"SBP < 90 or DBP ≤ 60 mmHg", sub:"Either criterion sufficient" },
  { key:"age",       label:"Age ≥ 65 years", sub:"" },
];

const CAP_REGIMENS = {
  0: { dispo:"Outpatient", color:T.teal,
    regimens:[
      "Amoxicillin 1g PO TID × 5 days (no risk factors for MDR)",
      "Doxycycline 100 mg PO BID × 5 days (penicillin allergy)",
      "Azithromycin 500 mg PO day 1, then 250 mg × 4 days (low-resistance area)",
    ]},
  1: { dispo:"Outpatient (close follow-up)", color:T.teal,
    regimens:[
      "Amoxicillin-clavulanate 875/125 mg PO BID × 5d + azithromycin 500 mg day 1 then 250 mg × 4d",
      "Levofloxacin 750 mg PO × 5d (comorbidities, MDR risk)",
    ]},
  2: { dispo:"Hospital Admission", color:T.gold,
    regimens:[
      "Beta-lactam IV (ceftriaxone 1g IV q24h) + macrolide (azithromycin 500 mg IV/PO q24h)",
      "Respiratory fluoroquinolone monotherapy: levofloxacin 750 mg IV/PO q24h × 5d",
      "ICU admission if severe sepsis — add anti-pseudomonal beta-lactam if risk factors",
    ]},
  3: { dispo:"Urgent Hospital Admission", color:T.orange,
    regimens:[
      "Ceftriaxone 1–2g IV q24h + azithromycin 500 mg IV q24h",
      "Levofloxacin 750 mg IV q24h (beta-lactam allergy)",
      "Consider ICU if hemodynamically unstable",
    ]},
  4: { dispo:"ICU / High-Dependency", color:T.coral,
    regimens:[
      "Beta-lactam IV (ceftriaxone 2g IV q12h or pip-tazo 4.5g IV q8h) + azithromycin 500 mg IV q24h",
      "If pseudomonal risk: pip-tazo + ciprofloxacin or aminoglycoside",
      "Oseltamivir 75 mg BID if influenza suspected",
    ]},
};

function PneumoniaTab() {
  const [curb, setCurb]    = useState({});
  const [hap,  setHAP]     = useState(false);
  const [aspir,setAspir]   = useState(false);
  const [immun,setImmun]   = useState(false);

  const score  = CURB65_ITEMS.filter(i => curb[i.key]).length;
  const dispoCap = Math.min(score, 4);
  const recs   = CAP_REGIMENS[dispoCap];

  const toggle = k => setCurb(p => ({ ...p, [k]:!p[k] }));

  return (
    <div className="dysp-in">
      {/* CURB-65 */}
      <Section color={T.purple} title="CURB-65 Score — CAP Severity">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color:T.txt4 }}>Check all that apply</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:32, fontWeight:900, color:recs?.color || T.txt4 }}>
            {score}
          </span>
        </div>
        {CURB65_ITEMS.map(item => (
          <CheckRow key={item.key} label={item.label} sub={item.sub}
            checked={!!curb[item.key]}
            onToggle={() => toggle(item.key)}
            color={T.purple} />
        ))}
        {Object.keys(curb).length > 0 && recs && (
          <ResultBadge
            label={`CURB-65 ${score} — ${recs.dispo}`}
            color={recs.color}
            detail={`30-day mortality: ${
              score === 0 ? "< 1%" : score === 1 ? "3%" :
              score === 2 ? "9%" : score === 3 ? "17%" : "> 20%"
            }`} />
        )}
      </Section>

      {/* Antibiotic regimens */}
      {Object.keys(curb).length > 0 && recs && (
        <Section color={recs.color} title="IDSA 2019 Antibiotic Recommendations">
          {/* Special circumstances */}
          <div style={{ marginBottom:8 }}>
            {[
              { label:"HAP / HCAP (hospitalization ≥ 48h or healthcare exposure)", val:hap, set:setHAP },
              { label:"Aspiration risk", val:aspir, set:setAspir },
              { label:"Immunocompromised (HIV, steroids, chemo)", val:immun, set:setImmun },
            ].map(s => (
              <CheckRow key={s.label} label={s.label}
                checked={s.val} onToggle={() => s.set(p => !p)}
                color={T.orange} />
            ))}
          </div>

          {/* Standard CAP regimens */}
          {!hap && !aspir && !immun && recs.regimens.map((r, i) => (
            <Bullet key={i} text={r} color={recs.color} />
          ))}

          {/* HAP */}
          {hap && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.orange, letterSpacing:1.3, marginBottom:6 }}>
                HOSPITAL-ACQUIRED PNEUMONIA — MDR COVERAGE
              </div>
              {[
                "Pip-tazo 4.5g IV q8h extended infusion + vancomycin or linezolid (MRSA coverage)",
                "If pseudomonal risk: cefepime 2g IV q8h or meropenem 1g IV q8h + tobramycin",
                "De-escalate based on culture results at 48-72h",
              ].map((r, i) => <Bullet key={i} text={r} color={T.orange} />)}
            </div>
          )}

          {/* Aspiration */}
          {aspir && !hap && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.gold, letterSpacing:1.3, marginBottom:6 }}>
                ASPIRATION PNEUMONIA
              </div>
              {[
                "Amoxicillin-clavulanate 875/125 mg PO BID or 1.2g IV q8h (outpatient/mild)",
                "Ceftriaxone 2g IV q24h + metronidazole 500 mg IV q8h (moderate-severe)",
                "Pip-tazo 4.5g IV q8h (severe or HAP overlap)",
              ].map((r, i) => <Bullet key={i} text={r} color={T.gold} />)}
            </div>
          )}

          {/* Immunocompromised */}
          {immun && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.purple, letterSpacing:1.3, marginBottom:6 }}>
                IMMUNOCOMPROMISED — EXPANDED COVERAGE
              </div>
              {[
                "Consider PCP (trimethoprim-sulfamethoxazole 15-20 mg/kg/day TMP component IV/PO) if CD4 < 200 or on steroids",
                "Fungal cover (voriconazole 400 mg PO/IV BID) if aspergillus risk (prolonged neutropenia, steroids)",
                "BAL or bronchoscopy for definitive diagnosis before empiric broad-spectrum",
              ].map((r, i) => <Bullet key={i} text={r} color={T.purple} />)}
            </div>
          )}

          <div style={{ marginTop:10, padding:"7px 10px", borderRadius:7,
            background:"rgba(9,20,31,0.7)",
            border:"1px solid rgba(30,55,85,0.4)" }}>
            <Bullet text="Procalcitonin < 0.25 ng/mL with low pretest probability — consider withholding antibiotics and repeat in 6-12h" color={T.teal} />
            <Bullet text="Urinary legionella antigen in severe CAP — covers Legionella sp. (azithromycin has good activity)" color={T.teal} />
            <Bullet text="Switch IV to PO when: afebrile × 24h, HR < 100, tolerating PO, improving O2 requirement" color={T.teal} />
          </div>
        </Section>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function DyspneaHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("blue");

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh",
      color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto",
        padding:embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                padding:"5px 14px", borderRadius:8,
                background:"rgba(9,20,31,0.7)",
                border:"1px solid rgba(30,55,85,0.5)",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,13,26,0.9)",
                border:"1px solid rgba(30,55,85,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontSize:10,
                  fontFamily:"'JetBrains Mono',monospace" }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>DYSPNEA</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(77,166,255,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-d"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Dyspnea Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              BLUE Protocol · PE Pathway · CHF / ADHF · COPD / Asthma · Pneumonia
              · CURB-65 · DECAF · BNP · PERC · Wells PE · IDSA 2019
            </p>
          </div>
        )}

        {/* Tab strip */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", marginBottom:14,
          background:"rgba(9,20,31,0.8)",
          border:"1px solid rgba(30,55,85,0.4)",
          borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:9, cursor:"pointer",
                flex:1, justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(30,55,85,0.5)"}`,
                background:tab===t.id ? `${t.color}15` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "blue"      && <BlueTab />}
        {tab === "pe"        && <PETab />}
        {tab === "chf"       && <CHFTab />}
        {tab === "copd"      && <COPDTab />}
        {tab === "pneumonia" && <PneumoniaTab />}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA DYSPNEA HUB · BLUE PROTOCOL (LICHTENSTEIN 2008)
            · ESC 2021 · IDSA 2019 · GOLD 2024 · NAEPP · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}