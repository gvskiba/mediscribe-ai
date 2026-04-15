// AMSHub.jsx — Altered Mental Status Hub
//
// Clinical basis:
//   - AEIOU-TIPS mnemonic (standard EM differential framework)
//   - CAM-ICU (Ely 2001, JAMA) — ICU delirium detection
//   - RASS (Sessler 2002) — sedation/agitation scale
//   - Wernicke's encephalopathy: thiamine before glucose
//   - NCSE: underdiagnosed cause of AMS (Towne 2000)
//   - Hypertensive encephalopathy vs ischemic stroke
//   - Hepatic encephalopathy grading (West Haven criteria)
//
// Route: /ams-hub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("ams-fonts")) return;
  const l = document.createElement("link");
  l.id = "ams-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ams-css";
  s.textContent = `
    @keyframes ams-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .ams-in{animation:ams-in .18s ease forwards}
    @keyframes shimmer-ams{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-ams{background:linear-gradient(90deg,#f0f4ff 0%,#b06dff 40%,#4da6ff 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-ams 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07050f", panel:"#0e0a1a",
  txt:"#f0ecff", txt2:"#c0b4e8", txt3:"#8878c0", txt4:"#504070",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  lavender:"#c4aaff",
};

const TABS = [
  { id:"diff",     label:"AEIOU-TIPS",         icon:"🔍", color:T.purple  },
  { id:"delirium", label:"Delirium / CAM-ICU",  icon:"🧠", color:T.blue   },
  { id:"workup",   label:"Workup Pathway",      icon:"⚡", color:T.teal   },
  { id:"syndromes",label:"Specific Syndromes",  icon:"💊", color:T.orange },
];

function Card({ color, title, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}07`, border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      {title && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>{title}</div>}
      {children}
    </div>
  );
}

function Bullet({ text, sub, color }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
          color:T.txt2, lineHeight:1.6 }}>{text}</span>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Check({ label, sub, checked, onToggle, color }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9, width:"100%",
        padding:"8px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
        border:"none", marginBottom:4, transition:"all .1s",
        background:checked ? `${color||T.purple}10` : "rgba(14,10,26,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.purple) : "rgba(45,30,80,0.4)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.purple) : "rgba(80,64,112,0.5)"}`,
        background:checked ? (color||T.purple) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#07050f", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.purple) : T.txt2 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — AEIOU-TIPS DIFFERENTIAL
// ═══════════════════════════════════════════════════════════════════════════
const AEIOU_TIPS = [
  { letter:"A", word:"Alcohol / Withdrawal", color:T.orange,
    causes:[
      { dx:"Acute alcohol intoxication", clue:"ETOH level, breath odor, ataxia", tx:"Supportive, thiamine 100 mg IV" },
      { dx:"Alcohol withdrawal / DTs", clue:"12–48h after last drink; tremor, tachycardia, diaphoresis, seizures", tx:"Benzodiazepines (CIWA protocol), thiamine, electrolytes" },
      { dx:"Wernicke encephalopathy", clue:"Ataxia + ophthalmoplegia + confusion — only 16% have full triad", tx:"Thiamine 500 mg IV TID × 3 days BEFORE glucose" },
    ],
  },
  { letter:"E", word:"Epilepsy / Seizure", color:T.coral,
    causes:[
      { dx:"Post-ictal state", clue:"Witnessed or unwitnessed seizure, Todd's paralysis, incontinence", tx:"Observation, address seizure cause, levetiracetam if recurrent" },
      { dx:"Non-convulsive status epilepticus", clue:"No motor activity — AMS without clear cause, EEG required", tx:"Lorazepam 4 mg IV; levetiracetam 1–3 g IV; EEG urgently" },
      { dx:"Complex partial seizure", clue:"Automatisms, lip smacking, aura, brief episodes", tx:"Antiepileptic, neurology consult" },
    ],
  },
  { letter:"I", word:"Insulin / Glucose", color:T.gold,
    causes:[
      { dx:"Hypoglycemia", clue:"BG < 60 mg/dL — diaphoresis, tachycardia; elderly may lack symptoms", tx:"D50 1 amp IV (25 g). If no IV: glucagon 1 mg IM. Recheck in 15 min." },
      { dx:"Hyperglycemia / HHS", clue:"BG > 600, severe dehydration, hyperosmolarity — INSULIN LATER", tx:"Aggressive IVF first (1L/hr NS × 2h). Insulin only after K+ > 3.5." },
      { dx:"DKA (cerebral)", clue:"Rare complication of DKA treatment — cerebral edema, usually peds", tx:"Slow correction — target BG decrease < 100 mg/dL/hr. Mannitol if herniation." },
    ],
  },
  { letter:"O", word:"Opiates / Overdose / Oxygen", color:T.purple,
    causes:[
      { dx:"Opioid intoxication", clue:"Miosis, respiratory depression, bradycardia — classic triad", tx:"Naloxone 0.4–2 mg IV/IM/IN; titrate to respirations not GCS" },
      { dx:"Hypoxia (any cause)", clue:"SpO2 < 90% — any cause of respiratory failure", tx:"Supplemental O2, address underlying cause, consider intubation" },
      { dx:"CO poisoning", clue:"CO-Hgb: pulse ox falsely normal. Multiple affected simultaneously.", tx:"100% O2 NRB. Co-oximetry for CO-Hgb. Consider HBO2." },
    ],
  },
  { letter:"U", word:"Uremia / Metabolic", color:T.blue,
    causes:[
      { dx:"Uremic encephalopathy", clue:"Creatinine > 8–10 mg/dL, asterixis, myoclonus", tx:"Dialysis if severe. Avoid nephrotoxins. Nephrology consult." },
      { dx:"Hyponatremia", clue:"Na < 120 mEq/L or rapid decline — seizures, cerebral edema", tx:"3% NaCl 100 mL IV bolus over 10 min for severe/symptomatic. Target +4–6 mEq/L in first hour." },
      { dx:"Hyperammonemia / hepatic encephalopathy", clue:"Liver disease, asterixis, ammonia elevated", tx:"Lactulose 30–45 mL PO q2h until bowel movement. Rifaximin 550 mg BID." },
      { dx:"Thyroid storm / myxedema", clue:"Fever/tachycardia/AMS (storm) vs bradycardia/hypothermia/AMS (myxedema)", tx:"Storm: PTU + methimazole + iodine + steroids. Myxedema: L-thyroxine IV." },
    ],
  },
  { letter:"T", word:"Trauma / Temperature", color:T.red,
    causes:[
      { dx:"Intracranial hemorrhage / trauma", clue:"Asymmetric pupils, focal deficit, external signs of head trauma", tx:"Head CT, neurosurgery. Reverse anticoagulation if applicable." },
      { dx:"Hyperthermia / heat stroke", clue:"Core temp > 40°C + CNS dysfunction — sweating may be absent", tx:"Rapid cooling: ice water immersion or evaporative cooling. Target < 39°C in 30 min." },
      { dx:"Hypothermia", clue:"Core temp < 32°C — bradycardia, J waves on EKG, 'death is not death until warm and dead'", tx:"Active rewarming. ECMO for severe (< 28°C). No resuscitation effort limit until normothermic." },
    ],
  },
  { letter:"I", word:"Infection", color:T.coral,
    causes:[
      { dx:"Bacterial meningitis", clue:"Fever + headache + meningismus. CT before LP only if focal deficit, papilledema, immunocompromised, or seizure.", tx:"Antibiotics WITHIN 30 MIN: ceftriaxone 2g IV + vancomycin 25 mg/kg IV. Dexamethasone 0.15 mg/kg IV." },
      { dx:"Viral encephalitis / HSV", clue:"Fever + AMS + seizures + temporal lobe involvement on MRI", tx:"Acyclovir 10 mg/kg IV q8h EMPIRICALLY — do not wait for HSV PCR. LP, MRI brain." },
      { dx:"Septic encephalopathy", clue:"AMS without focal CNS infection — complication of systemic infection", tx:"Treat underlying infection. Supportive care." },
    ],
  },
  { letter:"P", word:"Psychiatric / Psychogenic", color:T.lavender,
    causes:[
      { dx:"Acute psychosis (first episode)", clue:"Hallucinations, disorganized thought, paranoia — DIAGNOSIS OF EXCLUSION in ED", tx:"Rule out organic causes first. Antipsychotics if agitated. Psychiatry consult." },
      { dx:"Conversion disorder / FNS", clue:"Neurologic symptoms inconsistent with organic pathology. Distractible tremor, Hoover sign.", tx:"Non-confrontational approach. Neurology consult. Do not call it 'faking'." },
    ],
  },
  { letter:"S", word:"Stroke / Structural", color:T.teal,
    causes:[
      { dx:"Ischemic stroke / TIA", clue:"Focal deficit, NIHSS, FAST exam — sudden onset most typical", tx:"CT + CTA. IV tPA if eligible. Thrombectomy for LVO. Aspirin 325 mg if no hemorrhage." },
      { dx:"Hypertensive encephalopathy / PRES", clue:"BP > 180/120 + headache + AMS + seizures. MRI: posterior leukoencephalopathy.", tx:"IV labetalol or nicardipine. Target 15–25% MAP reduction in first hour. NOT to normal." },
      { dx:"Subdural hematoma", clue:"Elderly, falls, anticoagulation. May be bilateral and subtle on CT.", tx:"Neurosurgery consult. Reverse anticoagulation. Serial exams if small." },
    ],
  },
];

function DiffTab() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="ams-in">
      <Card color={T.purple} title="AEIOU-TIPS — Complete AMS Differential">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
          color:T.txt3, lineHeight:1.65, marginBottom:10 }}>
          Systematic mnemonic for new AMS evaluation. Every item is potentially reversible.
          Check POC glucose FIRST in every AMS patient — hypoglycemia is the most common reversible cause.
        </div>
        <div style={{ padding:"7px 11px", borderRadius:8,
          background:"rgba(245,200,66,0.1)",
          border:"1px solid rgba(245,200,66,0.35)",
          marginBottom:10 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, fontWeight:700, color:T.gold }}>IMMEDIATE: </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:T.txt2 }}>
            POC glucose → O2 sat → EKG → thiamine 100 mg IV → D50 if hypoglycemic
          </span>
        </div>
      </Card>

      {AEIOU_TIPS.map((item, i) => (
        <div key={i} style={{ marginBottom:6, borderRadius:10, overflow:"hidden",
          border:`1px solid ${expanded===i ? item.color+"55" : item.color+"22"}` }}>
          <button onClick={() => setExpanded(expanded===i ? null : i)}
            style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"11px 13px", cursor:"pointer", border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${item.color}0c,rgba(14,10,26,0.96))` }}>
            <div style={{ width:30, height:30, borderRadius:"50%",
              background:item.color, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Playfair Display',serif", fontWeight:900,
              fontSize:15, color:"#07050f" }}>{item.letter}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:item.color }}>{item.word}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, marginTop:1 }}>
                {item.causes.length} diagnosis{item.causes.length !== 1 ? "es" : ""}
              </div>
            </div>
            <span style={{ color:T.txt4, fontSize:10 }}>{expanded===i ? "▲" : "▼"}</span>
          </button>
          {expanded === i && (
            <div style={{ padding:"8px 13px 12px",
              borderTop:`1px solid ${item.color}22` }}>
              {item.causes.map((c, j) => (
                <div key={j} style={{ padding:"8px 11px", borderRadius:8,
                  marginBottom:7, background:"rgba(14,10,26,0.7)",
                  border:`1px solid ${item.color}20` }}>
                  <div style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:12, color:item.color,
                    marginBottom:4 }}>{c.dx}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10.5, color:T.txt3, marginBottom:4 }}>
                    <strong style={{ color:T.txt4 }}>Clue:</strong> {c.clue}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10.5, color:item.color }}>
                    <strong>Rx:</strong> {c.tx}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — DELIRIUM / CAM-ICU / RASS
// ═══════════════════════════════════════════════════════════════════════════
const RASS_LEVELS = [
  { score:+4, label:"Combative",       color:T.red,    desc:"Overtly combative, violent, immediate danger to staff" },
  { score:+3, label:"Very Agitated",   color:T.coral,  desc:"Pulls/removes tubes, aggressive" },
  { score:+2, label:"Agitated",        color:T.orange, desc:"Frequent non-purposeful movement, fighting ventilator" },
  { score:+1, label:"Restless",        color:T.gold,   desc:"Anxious, apprehensive; movements not aggressive" },
  { score: 0, label:"Alert and Calm",  color:T.teal,   desc:"Spontaneously awake, calm, attentive" },
  { score:-1, label:"Drowsy",          color:T.blue,   desc:"Not fully alert, but sustained awakening to voice > 10 sec" },
  { score:-2, label:"Light Sedation",  color:T.purple, desc:"Brief awakening to voice < 10 sec, eye contact" },
  { score:-3, label:"Moderate Sedation",color:T.lavender,desc:"Movement or eye opening to voice, no eye contact" },
  { score:-4, label:"Deep Sedation",   color:"#555570",desc:"No response to voice, movement to physical stimulation" },
  { score:-5, label:"Unarousable",     color:"#333350",desc:"No response to voice or physical stimulation" },
];

const CAM_ITEMS = [
  { key:"acute",     label:"Feature 1: Acute Onset and Fluctuating Course",
    sub:"Is there evidence of an acute change in mental status? Does it fluctuate during the day?", required:true },
  { key:"inattention",label:"Feature 2: Inattention",
    sub:"Did the patient have difficulty focusing attention? e.g., easily distracted, trouble following conversation", required:true },
  { key:"aloc",      label:"Feature 3: Altered Level of Consciousness",
    sub:"RASS any value other than zero (alert and calm)", required:false },
  { key:"disorganize",label:"Feature 4: Disorganized Thinking",
    sub:"Disorganized or incoherent speech, unclear illogical flow of ideas, unpredictable switching of subjects", required:false },
];

function DeliriumTab() {
  const [rassScore, setRassScore] = useState(null);
  const [cam, setCam] = useState({});
  const toggleCam = k => setCam(p => ({ ...p, [k]:!p[k] }));

  const camPos = cam.acute && cam.inattention && (cam.aloc || cam.disorganize);
  const camSet = Object.keys(cam).length > 0;

  return (
    <div className="ams-in">
      {/* RASS */}
      <Card color={T.blue} title="RASS — Richmond Agitation-Sedation Scale">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:8 }}>
          Validated in medical/surgical ICU. Step 1: Observe patient 30 sec.
          Step 2: Speak name loudly. Step 3: Physical stimulation (sternal rub).
        </div>
        {RASS_LEVELS.map(r => (
          <button key={r.score} onClick={() => setRassScore(r.score)}
            style={{ display:"flex", alignItems:"center", gap:10,
              width:"100%", padding:"7px 11px", borderRadius:8,
              cursor:"pointer", textAlign:"left", border:"none", marginBottom:3,
              transition:"all .1s",
              background:rassScore===r.score ? `${r.color}14` : "rgba(14,10,26,0.65)",
              borderLeft:`4px solid ${rassScore===r.score ? r.color : r.color+"30"}` }}>
            <div style={{ width:28, height:28, borderRadius:"50%",
              background:rassScore===r.score ? r.color : r.color+"30",
              flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:12,
              color:rassScore===r.score ? "#07050f" : r.color }}>
              {r.score > 0 ? "+" : ""}{r.score}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, color:rassScore===r.score ? r.color : T.txt2 }}>
                {r.label}
              </div>
              {rassScore === r.score && (
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:10, color:T.txt4, marginTop:1 }}>{r.desc}</div>
              )}
            </div>
          </button>
        ))}
      </Card>

      {/* CAM-ICU */}
      <Card color={T.purple} title="CAM-ICU — Confusion Assessment Method">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
          color:T.txt3, lineHeight:1.6, marginBottom:8 }}>
          Ely 2001, JAMA. Sensitivity 93–100%, specificity 89–100%.
          Delirium = Features 1 + 2 + (3 or 4). Apply only if RASS ≥ -3.
        </div>
        {CAM_ITEMS.map(c => (
          <Check key={c.key} label={c.label} sub={c.sub}
            checked={!!cam[c.key]} onToggle={() => toggleCam(c.key)}
            color={T.purple} />
        ))}
        {camSet && (
          <div style={{ marginTop:8, padding:"10px 12px", borderRadius:9,
            background:camPos ? "rgba(255,92,92,0.09)" : "rgba(0,212,180,0.08)",
            border:`1px solid ${camPos ? "rgba(255,92,92,0.4)" : "rgba(0,212,180,0.3)"}` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:16, color:camPos ? T.coral : T.teal }}>
              {camPos ? "CAM-ICU Positive — Delirium Present" : "CAM-ICU Negative"}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, marginTop:3, lineHeight:1.55 }}>
              {camPos
                ? "Delirium detected. Identify and treat underlying cause. Non-pharmacologic interventions first (reorientation, sleep hygiene, early mobilization). Antipsychotics only for agitated delirium threatening patient/staff safety."
                : "Delirium criteria not met. Continue monitoring — delirium fluctuates."}
            </div>
          </div>
        )}
      </Card>

      {/* Delirium vs dementia */}
      <Card color={T.gold} title="Delirium vs Dementia vs Psychosis">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse",
            fontFamily:"'DM Sans',sans-serif", fontSize:10.5 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(80,64,112,0.4)" }}>
                {["Feature","Delirium","Dementia","Psychosis"].map(h => (
                  <th key={h} style={{ padding:"6px 8px", textAlign:"left",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.txt4, letterSpacing:1, fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Onset",         "Acute (hours–days)", "Insidious (months–years)", "Variable"],
                ["Course",        "Fluctuating",         "Progressive",              "Variable"],
                ["Attention",     "Always impaired",     "Preserved early",          "May be preserved"],
                ["Level of consciousness","Impaired","Normal until late","Normal"],
                ["Reversible",    "Yes — find the cause","No (usually)",             "Partially"],
                ["Hallucinations","Visual (common)",     "Rare until late",          "Auditory (typical)"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom:"1px solid rgba(80,64,112,0.2)" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding:"6px 8px",
                      color:j===0 ? T.txt4 : j===1 ? T.gold : j===2 ? T.blue : T.purple,
                      fontWeight:j===0 ? 600 : 400 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — WORKUP PATHWAY
// ═══════════════════════════════════════════════════════════════════════════
function WorkupTab() {
  const [checks, setChecks] = useState({});
  const toggle = k => setChecks(p => ({ ...p, [k]:!p[k] }));

  return (
    <div className="ams-in">
      <Card color={T.teal} title="Immediate Actions (First 5 Minutes)">
        {[
          { k:"glu",  l:"POC glucose — hypoglycemia is most common reversible cause" },
          { k:"o2",   l:"Oxygen saturation — hypoxia causes AMS before respiratory symptoms" },
          { k:"ecg",  l:"12-lead EKG — arrhythmia, STEMI, prolonged QTc" },
          { k:"thia", l:"Thiamine 100 mg IV — BEFORE dextrose in any at-risk patient (ETOH, malnutrition)" },
          { k:"d50",  l:"D50 1 amp IV if glucose < 60 mg/dL or unknown" },
          { k:"nalo", l:"Naloxone 0.4 mg IV/IM/IN if opioid toxidrome suspected" },
        ].map(c => <Check key={c.k} label={c.l} checked={!!checks[c.k]}
          onToggle={() => toggle(c.k)} color={T.teal} />)}
      </Card>

      <Card color={T.blue} title="Standard Workup">
        {[
          "CBC, CMP (Na, glucose, BUN, creatinine, LFTs), Mg, Phos",
          "ABG or VBG — acidosis, CO2 retention, CO-Hgb if CO suspected",
          "Urine: UA + tox screen. Urine culture if UTI suspected in elderly.",
          "Blood cultures × 2 if febrile or sepsis suspected",
          "Alcohol level, acetaminophen, salicylate, digoxin if clinically indicated",
          "Thyroid function (TSH) — often overlooked cause of AMS",
          "B12, folate — deficiency-associated encephalopathy",
          "Ammonia — if liver disease known or suspected",
        ].map((b, i) => <Bullet key={i} text={b} color={T.blue} />)}
      </Card>

      <Card color={T.purple} title="Neuroimaging — When to Get CT/MRI">
        {[
          { criteria:"CT Head WITHOUT contrast — initial study",
            indications:"Focal deficit, new AMS after trauma, sudden onset AMS, age > 60 with new AMS, anticoagulated, papilledema, fever + headache + AMS" },
          { criteria:"CT/CTA Head and Neck",
            indications:"Suspected stroke (sudden focal deficit), thunderclap headache, GCS ≤ 13 with no clear cause" },
          { criteria:"MRI Brain (FLAIR + DWI + contrast)",
            indications:"Suspected encephalitis (fever + AMS + seizures), PRES, posterior fossa lesion, subtle ischemia, negative CT with persistent AMS" },
        ].map((item, i) => (
          <div key={i} style={{ padding:"8px 10px", borderRadius:8, marginBottom:6,
            background:"rgba(14,10,26,0.7)",
            border:"1px solid rgba(80,64,112,0.3)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:T.purple, marginBottom:3 }}>{item.criteria}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>{item.indications}</div>
          </div>
        ))}
      </Card>

      <Card color={T.orange} title="LP Indications in AMS">
        {[
          "Fever + headache + AMS (meningitis until proven otherwise)",
          "New AMS without clear cause after CT is negative",
          "Immunocompromised patient with AMS",
          "Suspicion for subarachnoid hemorrhage with negative CT",
          "Suspicion for encephalitis (complement with MRI brain first if possible)",
        ].map((b, i) => <Bullet key={i} text={b} color={T.orange} />)}
        <div style={{ marginTop:6, padding:"6px 9px", borderRadius:7,
          background:"rgba(255,92,92,0.08)",
          border:"1px solid rgba(255,92,92,0.25)",
          fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.coral }}>
          Do NOT delay antibiotics for LP. Give antibiotics within 30 min of suspecting bacterial meningitis — LP can follow.
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — SPECIFIC SYNDROMES
// ═══════════════════════════════════════════════════════════════════════════
const SYNDROMES = [
  {
    id:"wernicke", label:"Wernicke Encephalopathy", icon:"🍺", color:T.orange,
    alert:"Thiamine BEFORE glucose — glucose without thiamine can precipitate or worsen Wernicke's",
    points:[
      "Classic triad: ophthalmoplegia + ataxia + confusion — only 16% present with all three",
      "Risk factors: ETOH, malnutrition, hyperemesis, gastric bypass, HIV, cancer, chronic dialysis",
      "MRI: bilateral mammillary body + periaqueductal gray signal on FLAIR (pathognomonic but insensitive)",
      "Treat ALL suspected cases empirically — do not wait for MRI or thiamine level",
      "Dose: thiamine 500 mg IV TID × 3 days (NOT 100 mg — chronic high-dose needed)",
      "Untreated: Korsakoff psychosis (irreversible anterograde amnesia, confabulation)",
    ],
  },
  {
    id:"ncse", label:"Non-Convulsive Status Epilepticus", icon:"⚡", color:T.coral,
    alert:"NCSE responsible for up to 25% of unexplained AMS in ICU — EEG is required for diagnosis",
    points:[
      "No visible convulsive activity — diagnosed ONLY by EEG",
      "Clinical clues: subtle twitching (face, finger), nystagmus, autonomic instability, fluctuating AMS",
      "Risk factors: prior seizure history, CNS infection, metabolic derangements, recent seizure",
      "EEG: urgent, ideally continuous monitoring — NCSE may require prolonged EEG to capture",
      "Treatment: lorazepam 4 mg IV, then levetiracetam 1–3 g IV or valproate 20–40 mg/kg IV",
      "Refractory: midazolam or propofol infusion — requires ICU and EEG monitoring",
    ],
  },
  {
    id:"pres", label:"PRES / Hypertensive Encephalopathy", icon:"⚡", color:T.blue,
    alert:"PRES is reversible with BP control — treat promptly but avoid overcorrection",
    points:[
      "Posterior Reversible Encephalopathy Syndrome — bilateral posterior white matter edema",
      "Causes: hypertensive emergency, eclampsia, calcineurin inhibitors (cyclosporine, tacrolimus), chemotherapy",
      "Symptoms: headache, AMS, visual disturbance, seizures — may occur without severely elevated BP",
      "Diagnosis: MRI FLAIR — symmetric posterior leukoencephalopathy",
      "Treatment: gradual BP reduction (15–25% MAP reduction in first hour). Labetalol or nicardipine IV",
      "Most cases REVERSIBLE within weeks with BP control — prognosis excellent if treated promptly",
    ],
  },
  {
    id:"hepatic", label:"Hepatic Encephalopathy", icon:"🟡", color:T.gold,
    alert:"Precipitants: GI bleed, infection, constipation, sedatives, electrolytes — treat the precipitant",
    points:[
      "West Haven Criteria: Grade I (mild confusion) → Grade II (drowsiness) → Grade III (stupor) → Grade IV (coma)",
      "Asterixis (flapping tremor): Grade I–II. Absent in deep encephalopathy (Grade III–IV).",
      "Ammonia: correlated with severity but individual levels do not predict outcome reliably",
      "Precipitants: GI bleed (blood = protein load), infection (SBP, UTI), constipation, sedatives, diuretics, hyponatremia",
      "Treatment: lactulose 30–45 mL PO/NG q2–4h until 2–3 soft BM/day; rifaximin 550 mg BID",
      "Grade III–IV: ICU, airway protection, consider liver transplant evaluation",
    ],
  },
];

function SyndromesTab() {
  const [active, setActive] = useState("wernicke");
  const s = SYNDROMES.find(x => x.id === active);
  return (
    <div className="ams-in">
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {SYNDROMES.map(syn => (
          <button key={syn.id} onClick={() => setActive(syn.id)}
            style={{ display:"flex", alignItems:"center", gap:6, flex:1,
              padding:"8px 12px", borderRadius:9, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              transition:"all .12s",
              border:`1px solid ${active===syn.id ? syn.color+"66" : syn.color+"22"}`,
              background:active===syn.id ? `${syn.color}12` : "transparent",
              color:active===syn.id ? syn.color : T.txt4 }}>
            <span style={{ fontSize:14 }}>{syn.icon}</span>
            {syn.label}
          </button>
        ))}
      </div>
      {s && (
        <div>
          <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
            background:`${s.color}0a`, border:`1px solid ${s.color}35` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:s.color, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:3 }}>⚡ Alert</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:12, fontWeight:600, color:s.color }}>{s.alert}</div>
          </div>
          {s.points.map((p, i) => <Bullet key={i} text={p} color={s.color} />)}
        </div>
      )}
    </div>
  );
}

export default function AMSHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("diff");
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh", color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto",
        padding:embedded ? "0" : "0 16px" }}>
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7, fontFamily:"'DM Sans',sans-serif",
                fontSize:12, fontWeight:600, padding:"5px 14px", borderRadius:8,
                background:"rgba(7,5,15,0.8)",
                border:"1px solid rgba(45,30,80,0.5)",
                color:T.txt3, cursor:"pointer" }}>← Back to Hub</button>
            <h1 className="shimmer-ams"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Altered Mental Status Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              AEIOU-TIPS Differential · CAM-ICU Delirium · RASS · Wernicke
              · NCSE · PRES · Hepatic Encephalopathy
            </p>
          </div>
        )}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", padding:"6px",
          marginBottom:14, background:"rgba(14,10,26,0.85)",
          border:"1px solid rgba(45,30,80,0.4)", borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 13px", borderRadius:9, cursor:"pointer", flex:1,
                justifyContent:"center", fontFamily:"'DM Sans',sans-serif",
                fontWeight:600, fontSize:12, transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(45,30,80,0.5)"}`,
                background:tab===t.id ? `${t.color}14` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {tab === "diff"      && <DiffTab />}
        {tab === "delirium"  && <DeliriumTab />}
        {tab === "workup"    && <WorkupTab />}
        {tab === "syndromes" && <SyndromesTab />}
        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA AMS HUB · CAM-ICU (ELY 2001) · RASS (SESSLER 2002)
            · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}