// QuickNoteCalcs.jsx
// Clinical calculator system — 8 calculators with keyword detection
// Extracted from QuickNoteComponents.jsx
// Exports: ClinicalCalcsCard

import { useState, useMemo } from "react";

// ─── CLINICAL CALCULATORS ─────────────────────────────────────────────────────
// Inline scoring — no external links, no API calls
// Keyword detection reuses the CC/MDM pattern from CC_HUB_MAP

const CALCS = {
  heart: {
    id:"heart", label:"HEART Score", abbr:"HEART",
    color:"#ff6b6b", colorRgb:"255,107,107",
    description:"Chest pain risk stratification · ACS",
    triggers:/chest.pain|acs|angina|stemi|nstemi|troponin|cardiac/i,
    fields:[
      { key:"history",     label:"History",               type:"select",
        options:[{v:0,l:"Slightly suspicious (0)"},{v:1,l:"Moderately suspicious (1)"},{v:2,l:"Highly suspicious (2)"}] },
      { key:"ecg",         label:"ECG",                   type:"select",
        options:[{v:0,l:"Normal (0)"},{v:1,l:"Non-specific repolarization (1)"},{v:2,l:"Significant ST deviation (2)"}] },
      { key:"age",         label:"Age",                   type:"select",
        options:[{v:0,l:"<45 (0)"},{v:1,l:"45–64 (1)"},{v:2,l:"≥65 (2)"}] },
      { key:"risk",        label:"Risk Factors",          type:"select",
        options:[{v:0,l:"No known factors (0)"},{v:1,l:"1–2 factors (1)"},{v:2,l:"≥3 or history of ACS (2)"}] },
      { key:"troponin",    label:"Initial Troponin",      type:"select",
        options:[{v:0,l:"≤normal limit (0)"},{v:1,l:"1–3× normal (1)"},{v:2,l:">3× normal (2)"}] },
    ],
    score: (v) => (v.history||0)+(v.ecg||0)+(v.age||0)+(v.risk||0)+(v.troponin||0),
    interpret:(n) =>
      n <= 3 ? { label:"LOW RISK", note:"0.9–1.7% MACE · Consider early discharge with follow-up", color:"var(--qn-green)" } :
      n <= 6 ? { label:"MODERATE RISK", note:"12–16.6% MACE · Serial troponins + observation", color:"var(--qn-gold)" } :
               { label:"HIGH RISK", note:"50–65% MACE · Early invasive strategy", color:"var(--qn-red)" },
    guideline:"Backus et al. Ann Emerg Med 2010",
  },

  wells_pe: {
    id:"wells_pe", label:"Wells PE Score", abbr:"Wells PE",
    color:"#9b6dff", colorRgb:"155,109,255",
    description:"Pulmonary embolism pre-test probability",
    triggers:/pe|pulmonary.embol|dyspnea|pleuritic|hemoptysis|dvt|tachycardia.*hypox|hypox.*tachycardia/i,
    fields:[
      { key:"dvt_sx",      label:"Clinical signs/sx of DVT",         type:"bool" },
      { key:"alt_dx",      label:"Alternative Dx less likely than PE",type:"bool" },
      { key:"hr_gt100",    label:"HR > 100 bpm",                     type:"bool" },
      { key:"immob",       label:"Immobilization or surgery in 4 wks",type:"bool" },
      { key:"prior_dvt",   label:"Prior DVT or PE",                   type:"bool" },
      { key:"hemoptysis",  label:"Hemoptysis",                        type:"bool" },
      { key:"malignancy",  label:"Malignancy (active, or treated <6mo)",type:"bool" },
    ],
    score: (v) =>
      (v.dvt_sx?3:0)+(v.alt_dx?3:0)+(v.hr_gt100?1.5:0)+
      (v.immob?1.5:0)+(v.prior_dvt?1.5:0)+(v.hemoptysis?1:0)+(v.malignancy?1:0),
    interpret:(n) =>
      n < 2  ? { label:"LOW", note:"<2%  probability · D-dimer + PERC rule", color:"var(--qn-green)" } :
      n <= 6  ? { label:"MODERATE", note:"2–20% · D-dimer or CT-PA", color:"var(--qn-gold)" } :
                { label:"HIGH", note:">40% · Direct CT-PA", color:"var(--qn-red)" },
    guideline:"Wells et al. Thromb Haemost 2000",
  },

  wells_dvt: {
    id:"wells_dvt", label:"Wells DVT Score", abbr:"Wells DVT",
    color:"#3b9eff", colorRgb:"59,158,255",
    description:"DVT pre-test probability",
    triggers:/dvt|deep.vein|leg.swelling|calf.pain|unilateral.edema/i,
    fields:[
      { key:"cancer",      label:"Active cancer",                    type:"bool" },
      { key:"paralysis",   label:"Paralysis/plaster immobilization", type:"bool" },
      { key:"bedrest",     label:"Bedridden >3 days or surgery <12 wks",type:"bool" },
      { key:"tenderness",  label:"Localized tenderness along deep veins",type:"bool" },
      { key:"swelling",    label:"Entire leg swollen",                type:"bool" },
      { key:"calf",        label:"Calf swelling >3 cm vs other leg", type:"bool" },
      { key:"pitting",     label:"Pitting edema (symptomatic leg only)",type:"bool" },
      { key:"collateral",  label:"Collateral superficial veins",      type:"bool" },
      { key:"prior_dvt",   label:"Prior DVT documented",              type:"bool" },
      { key:"alt_dx",      label:"Alternative Dx at least as likely", type:"bool", pts:-2 },
    ],
    score:(v) =>
      (v.cancer?1:0)+(v.paralysis?1:0)+(v.bedrest?1:0)+(v.tenderness?1:0)+
      (v.swelling?1:0)+(v.calf?1:0)+(v.pitting?1:0)+(v.collateral?1:0)+
      (v.prior_dvt?1:0)+(v.alt_dx?-2:0),
    interpret:(n) =>
      n <= 0 ? { label:"LOW", note:"3%  probability · D-dimer if needed", color:"var(--qn-green)" } :
      n <= 2 ? { label:"MODERATE", note:"17% · D-dimer or duplex US", color:"var(--qn-gold)" } :
               { label:"HIGH", note:"75% · Duplex US", color:"var(--qn-red)" },
    guideline:"Wells et al. Lancet 1997",
  },

  curb65: {
    id:"curb65", label:"CURB-65", abbr:"CURB-65",
    color:"#f5c842", colorRgb:"245,200,66",
    description:"Pneumonia severity · admission decision",
    triggers:/pneumonia|cap|hap|consolidation|infiltrate|lobar/i,
    fields:[
      { key:"confusion",   label:"Confusion (new disorientation)",   type:"bool" },
      { key:"bun",         label:"BUN > 19 mg/dL (urea > 7 mmol/L)",type:"bool" },
      { key:"rr",          label:"RR ≥ 30 /min",                     type:"bool" },
      { key:"bp",          label:"SBP < 90 or DBP ≤ 60 mmHg",       type:"bool" },
      { key:"age65",       label:"Age ≥ 65",                         type:"bool" },
    ],
    score:(v)=>(v.confusion?1:0)+(v.bun?1:0)+(v.rr?1:0)+(v.bp?1:0)+(v.age65?1:0),
    interpret:(n) =>
      n <= 1 ? { label:"LOW (Class I–II)", note:"<3% mortality · Outpatient treatment", color:"var(--qn-green)" } :
      n <= 2 ? { label:"MODERATE (Class III)", note:"3–15% · Short admission or close follow-up", color:"var(--qn-gold)" } :
               { label:"SEVERE (Class IV–V)", note:">15% mortality · ICU admission consider", color:"var(--qn-red)" },
    guideline:"Lim et al. Thorax 2003",
  },

  gcs: {
    id:"gcs", label:"Glasgow Coma Scale", abbr:"GCS",
    color:"#00e5c0", colorRgb:"0,229,192",
    description:"Level of consciousness assessment",
    triggers:/altered|ams|gcs|head.injury|trauma|unresponsive|letharg|obtund|coma/i,
    fields:[
      { key:"eye",   label:"Eye Opening",   type:"select",
        options:[{v:4,l:"Spontaneous (4)"},{v:3,l:"To voice (3)"},{v:2,l:"To pain (2)"},{v:1,l:"None (1)"}] },
      { key:"verbal",label:"Verbal Response",type:"select",
        options:[{v:5,l:"Oriented (5)"},{v:4,l:"Confused (4)"},{v:3,l:"Words (3)"},{v:2,l:"Sounds (2)"},{v:1,l:"None (1)"}] },
      { key:"motor", label:"Motor Response", type:"select",
        options:[{v:6,l:"Obeys commands (6)"},{v:5,l:"Localizes (5)"},{v:4,l:"Withdraws (4)"},{v:3,l:"Flexion (3)"},{v:2,l:"Extension (2)"},{v:1,l:"None (1)"}] },
    ],
    score:(v)=>(v.eye||1)+(v.verbal||1)+(v.motor||1),
    interpret:(n) =>
      n >= 13 ? { label:"MILD", note:"GCS 13–15 · Monitor, serial exams", color:"var(--qn-green)" } :
      n >= 9  ? { label:"MODERATE", note:"GCS 9–12 · CT head, neurosurgery consult", color:"var(--qn-gold)" } :
                { label:"SEVERE", note:"GCS ≤ 8 · Intubation threshold · Neurosurgery", color:"var(--qn-red)" },
    guideline:"Teasdale & Jennett 1974",
  },

  rose_syncope: {
    id:"rose_syncope", label:"ROSE Rule (Syncope)", abbr:"ROSE",
    color:"#ff9f43", colorRgb:"255,159,67",
    description:"30-day serious outcome prediction after syncope",
    triggers:/syncope|syncopal|loss.of.consciousness|lol|passed.out/i,
    fields:[
      { key:"bnp",         label:"BNP ≥ 300 pg/mL",                 type:"bool" },
      { key:"bradycardia", label:"Bradycardia (HR <50 on ECG/monitoring)",type:"bool" },
      { key:"rectal",      label:"Fecal occult blood positive",      type:"bool" },
      { key:"anemia",      label:"Hemoglobin ≤ 9 g/dL",             type:"bool" },
      { key:"saturation",  label:"SpO2 <94% on RA",                  type:"bool" },
      { key:"ecg",         label:"Q wave on ECG (not in lead III)",  type:"bool" },
    ],
    score:(v) =>
      (v.bnp?1:0)+(v.bradycardia?1:0)+(v.rectal?1:0)+
      (v.anemia?1:0)+(v.saturation?1:0)+(v.ecg?1:0),
    interpret:(n) =>
      n === 0 ? { label:"LOW RISK", note:"<1% serious outcome · Safe discharge", color:"var(--qn-green)" } :
                { label:"HIGH RISK", note:"≥1 factor — 1 serious outcome risk · Admission or close monitoring", color:"var(--qn-red)" },
    guideline:"Reed et al. Ann Emerg Med 2010",
  },

  kdigo: {
    id:"kdigo", label:"KDIGO AKI Staging", abbr:"KDIGO",
    color:"#3b9eff", colorRgb:"59,158,255",
    description:"AKI severity — use LabTrendHub for serial creatinine",
    triggers:/aki|acute.kidney|creatinine|renal.failure|oliguria|kdigo/i,
    fields:[
      { key:"baseline", label:"Baseline creatinine (mg/dL)", type:"number", placeholder:"e.g. 0.9" },
      { key:"current",  label:"Current creatinine (mg/dL)",  type:"number", placeholder:"e.g. 1.6" },
      { key:"urine",    label:"Urine output (mL/kg/h)",      type:"number", placeholder:"optional" },
    ],
    score:(v) => {
      const bl = parseFloat(v.baseline); const curr = parseFloat(v.current);
      if (isNaN(bl) || isNaN(curr) || bl <= 0) return null;
      const ratio = curr / bl;
      if (ratio >= 3.0 || curr >= 4.0) return 3;
      if (ratio >= 2.0)                return 2;
      if (ratio >= 1.5 || (curr - bl) >= 0.3) return 1;
      return 0;
    },
    interpret:(n) =>
      n === null ? { label:"ENTER VALUES", note:"Requires baseline and current creatinine", color:"var(--qn-txt4)" } :
      n === 0    ? { label:"NO AKI", note:"Creatinine within KDIGO thresholds", color:"var(--qn-green)" } :
      n === 1    ? { label:"AKI STAGE 1", note:"1.5–1.9× baseline or +0.3 mg/dL · IV fluids, nephrotoxin review", color:"var(--qn-gold)" } :
      n === 2    ? { label:"AKI STAGE 2", note:"2.0–2.9× baseline · Consider nephrology", color:"var(--qn-coral)" } :
                   { label:"AKI STAGE 3", note:"≥3× baseline or Cr ≥4.0 · Nephrology consult", color:"var(--qn-red)" },
    guideline:"KDIGO AKI 2012",
  },

  nihss: {
    id:"nihss", label:"NIHSS", abbr:"NIHSS",
    color:"#9b6dff", colorRgb:"155,109,255",
    description:"NIH Stroke Scale · Stroke severity · tPA eligibility context",
    triggers:/stroke|tia|nihss|facial.droop|arm.drift|aphasia|dysarthria|focal.neuro|neuro.deficit/i,
    fields:[
      { key:"loc",     label:"1a. Level of Consciousness", type:"select",
        options:[{v:0,l:"Alert (0)"},{v:1,l:"Drowsy (1)"},{v:2,l:"Stuporous (2)"},{v:3,l:"Unresponsive (3)"}]},
      { key:"locq",    label:"1b. LOC Questions",          type:"select",
        options:[{v:0,l:"Both correct (0)"},{v:1,l:"One correct (1)"},{v:2,l:"Neither (2)"}]},
      { key:"locc",    label:"1c. LOC Commands",           type:"select",
        options:[{v:0,l:"Both obey (0)"},{v:1,l:"One obeys (1)"},{v:2,l:"Neither (2)"}]},
      { key:"gaze",    label:"2. Best Gaze",               type:"select",
        options:[{v:0,l:"Normal (0)"},{v:1,l:"Partial palsy (1)"},{v:2,l:"Forced deviation (2)"}]},
      { key:"visual",  label:"3. Visual Fields",           type:"select",
        options:[{v:0,l:"No loss (0)"},{v:1,l:"Partial hemianopia (1)"},{v:2,l:"Complete hemianopia (2)"},{v:3,l:"Bilateral (3)"}]},
      { key:"facial",  label:"4. Facial Palsy",            type:"select",
        options:[{v:0,l:"Normal (0)"},{v:1,l:"Minor (1)"},{v:2,l:"Partial (2)"},{v:3,l:"Complete (3)"}]},
      { key:"motorL",  label:"5L. Motor Arm Left",         type:"select",
        options:[{v:0,l:"No drift (0)"},{v:1,l:"Drift (1)"},{v:2,l:"Some effort (2)"},{v:3,l:"No effort (3)"},{v:4,l:"No movement (4)"}]},
      { key:"motorR",  label:"5R. Motor Arm Right",        type:"select",
        options:[{v:0,l:"No drift (0)"},{v:1,l:"Drift (1)"},{v:2,l:"Some effort (2)"},{v:3,l:"No effort (3)"},{v:4,l:"No movement (4)"}]},
      { key:"legL",    label:"6L. Motor Leg Left",         type:"select",
        options:[{v:0,l:"No drift (0)"},{v:1,l:"Drift (1)"},{v:2,l:"Some effort (2)"},{v:3,l:"No effort (3)"},{v:4,l:"No movement (4)"}]},
      { key:"legR",    label:"6R. Motor Leg Right",        type:"select",
        options:[{v:0,l:"No drift (0)"},{v:1,l:"Drift (1)"},{v:2,l:"Some effort (2)"},{v:3,l:"No effort (3)"},{v:4,l:"No movement (4)"}]},
      { key:"ataxia",  label:"7. Limb Ataxia",             type:"select",
        options:[{v:0,l:"Absent (0)"},{v:1,l:"One limb (1)"},{v:2,l:"Two limbs (2)"}]},
      { key:"sensory", label:"8. Sensory",                 type:"select",
        options:[{v:0,l:"Normal (0)"},{v:1,l:"Mild loss (1)"},{v:2,l:"Severe loss (2)"}]},
      { key:"lang",    label:"9. Best Language",           type:"select",
        options:[{v:0,l:"Normal (0)"},{v:1,l:"Mild aphasia (1)"},{v:2,l:"Severe aphasia (2)"},{v:3,l:"Mute/global (3)"}]},
      { key:"dysarth", label:"10. Dysarthria",             type:"select",
        options:[{v:0,l:"Normal (0)"},{v:1,l:"Mild (1)"},{v:2,l:"Severe/anarthric (2)"}]},
      { key:"extinct", label:"11. Extinction/Inattention", type:"select",
        options:[{v:0,l:"Normal (0)"},{v:1,l:"One modality (1)"},{v:2,l:"Two modalities (2)"}]},
    ],
    score:(v)=>["loc","locq","locc","gaze","visual","facial","motorL","motorR",
      "legL","legR","ataxia","sensory","lang","dysarth","extinct"]
      .reduce((s,k)=>s+(parseFloat(v[k])||0),0),
    interpret:(n)=>
      n===0  ?{label:"NO DEFICIT",        note:"Score 0 — no neurological deficit detected",              color:"var(--qn-green)"  }:
      n<=4   ?{label:"MINOR STROKE",      note:"1–4 · Minor deficit · NIHSS-guided imaging pathway",      color:"var(--qn-gold)"   }:
      n<=15  ?{label:"MODERATE STROKE",   note:"5–15 · Moderate · Evaluate tPA/thrombectomy eligibility", color:"var(--qn-orange)" }:
      n<=20  ?{label:"MOD-SEVERE STROKE", note:"16–20 · Significant deficit",                             color:"var(--qn-coral)"  }:
               {label:"SEVERE STROKE",    note:"21–42 · Severe deficit · Thrombectomy workup urgently",   color:"var(--qn-red)"    },
    guideline:"Brott et al. Stroke 1989 · AHA/ASA 2019 Acute Ischemic Stroke Guidelines",
  },
};

// Keyword-based calculator selection
function detectCalcs(cc, workingDx, labs, imaging) {
  const haystack = [cc, workingDx, labs, imaging].filter(Boolean).join(" ").toLowerCase();
  return Object.values(CALCS).filter(c => c.triggers.test(haystack));
}

// ─── CALCULATOR FIELD ─────────────────────────────────────────────────────────
function CalcField({ field, value, onChange }) {
  if (field.type === "bool") {
    const checked = Boolean(value);
    return (
      <div onClick={() => onChange(!checked)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px",
          borderRadius:6, cursor:"pointer", transition:"all .12s",
          background:checked ? `rgba(${field._colorRgb||"42,79,122"},.12)` : "rgba(8,22,40,.4)",
          border:`1px solid ${checked ? `rgba(${field._colorRgb||"42,79,122"},.4)` : "rgba(42,79,122,.3)"}` }}>
        <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
          background:checked ? "rgba(0,229,192,.2)" : "rgba(14,37,68,.6)",
          border:`2px solid ${checked ? "var(--qn-teal)" : "rgba(42,79,122,.5)"}`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {checked && <span style={{ fontSize:9, color:"var(--qn-teal)", lineHeight:1 }}>✓</span>}
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:checked ? "var(--qn-txt)" : "var(--qn-txt3)", lineHeight:1.3 }}>
          {field.label}
        </span>
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div style={{ marginBottom:4 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", letterSpacing:.8, marginBottom:3 }}>{field.label}</div>
        <select value={value ?? ""} onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width:"100%", padding:"5px 8px", borderRadius:6,
            background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.5)",
            color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:11,
            outline:"none" }}>
          <option value="">— select —</option>
          {field.options.map(o => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div style={{ marginBottom:4 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", letterSpacing:.8, marginBottom:3 }}>{field.label}</div>
        <input type="number" value={value ?? ""} placeholder={field.placeholder}
          onChange={e => onChange(e.target.value)}
          style={{ width:"100%", padding:"5px 8px", borderRadius:6, boxSizing:"border-box",
            background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.5)",
            color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace", fontSize:11,
            outline:"none" }} />
      </div>
    );
  }
  return null;
}

// ─── SINGLE CALCULATOR PANEL ──────────────────────────────────────────────────
function CalcPanel({ calc, onAddToMDM }) {
  const [values,   setValues]   = useState({});
  const [expanded, setExpanded] = useState(false);
  const [added,    setAdded]    = useState(false);

  const raw   = calc.score(values);
  const score = typeof raw === "number" ? (Number.isInteger(raw) ? raw : parseFloat(raw.toFixed(1))) : raw;
  const interp = calc.interpret(score);

  const allFilled = calc.fields
    .filter(f => f.type !== "number" || f.key !== "urine") // urine optional in KDIGO
    .every(f => values[f.key] !== undefined && values[f.key] !== "");

  const handleAddToMDM = () => {
    const scoreLabel = score === null ? "" : `Score: ${score}`;
    const text = `${calc.label} — ${scoreLabel ? scoreLabel + " — " : ""}${interp.label}. ${interp.note}. (${calc.guideline})`;
    onAddToMDM(text);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div style={{ border:`1px solid rgba(${calc.colorRgb},.25)`,
      borderRadius:10, overflow:"hidden",
      background:`rgba(${calc.colorRgb},.04)` }}>

      {/* Panel header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 11px",
        cursor:"pointer" }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
          background:calc.color, boxShadow:`0 0 6px ${calc.color}` }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
          fontSize:10, color:calc.color, flex:1 }}>{calc.abbr}</span>
        {allFilled && score !== null && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
            fontSize:11, color:interp.color, background:`rgba(${calc.colorRgb},.12)`,
            border:`1px solid rgba(${calc.colorRgb},.3)`,
            borderRadius:5, padding:"1px 8px" }}>
            {score} — {interp.label}
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ borderTop:`1px solid rgba(${calc.colorRgb},.2)`,
          padding:"10px 11px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:"var(--qn-txt4)", marginBottom:10, lineHeight:1.4 }}>
            {calc.description}
          </div>

          {/* Fields */}
          <div style={{ display:"flex", flexDirection:"column",
            gap: calc.fields[0]?.type === "bool" ? 4 : 0 }}>
            {calc.fields.map(f => (
              <CalcField key={f.key}
                field={{ ...f, _colorRgb:calc.colorRgb }}
                value={values[f.key]}
                onChange={v => setValues(prev => ({ ...prev, [f.key]: v }))} />
            ))}
          </div>

          {/* Result */}
          {allFilled && score !== null && (
            <div style={{ marginTop:10, padding:"9px 11px", borderRadius:8,
              background:`rgba(${calc.colorRgb},.08)`,
              border:`1px solid rgba(${calc.colorRgb},.3)` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  fontSize:14, color:interp.color }}>
                  {typeof score === "number" && score !== null ? score : "—"}
                </span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                  fontSize:12, color:interp.color }}>{interp.label}</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt3)", lineHeight:1.5, marginBottom:8 }}>
                {interp.note}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", marginBottom:8 }}>{calc.guideline}</div>
              <button onClick={handleAddToMDM}
                style={{ padding:"4px 12px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${added ? "rgba(61,255,160,.5)" : `rgba(${calc.colorRgb},.4)`}`,
                  background:added ? "rgba(61,255,160,.1)" : `rgba(${calc.colorRgb},.1)`,
                  color:added ? "var(--qn-green)" : calc.color,
                  transition:"all .15s" }}>
                {added ? "✓ Added to MDM" : "Add to MDM Narrative"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CLINICAL CALCULATORS CARD ────────────────────────────────────────────────
export function ClinicalCalcsCard({ cc, workingDx, labs, imaging, onAddToMDM }) {
  const calcs = useMemo(
    () => detectCalcs(cc, workingDx, labs, imaging),
    [cc, workingDx, labs, imaging]
  );
  const [dismissed, setDismissed] = useState(false);

  if (!calcs.length || dismissed) return null;

  return (
    <div style={{ marginBottom:14, padding:"12px 14px",
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(59,158,255,.22)",
      borderRadius:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:14, color:"var(--qn-blue)" }}>Clinical Calculators</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", background:"rgba(59,158,255,.08)",
          border:"1px solid rgba(59,158,255,.2)", borderRadius:4,
          padding:"1px 7px", letterSpacing:.5 }}>
          {calcs.length} suggested
        </span>
        <div style={{ flex:1 }} />
        <button onClick={() => setDismissed(true)}
          style={{ background:"transparent", border:"none", cursor:"pointer",
            color:"var(--qn-txt4)", fontSize:12, padding:"0 2px" }}>✕</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {calcs.map(c => (
          <CalcPanel key={c.id} calc={c} onAddToMDM={onAddToMDM} />
        ))}
      </div>
      <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
        SCORES CALCULATED LOCALLY · VERIFY INPUTS BEFORE CLINICAL USE
      </div>
    </div>
  );
}