// HeadacheHub.jsx
// Integrated Headache Evaluation Hub — Bedside Reference
//
// Guidelines:
//   - Ottawa SAH Rule (Perry 2013, JAMA) — 100% sensitivity
//   - SNOOP4 secondary headache red flags
//   - CSF / LP interpretation for SAH
//   - Migraine: ACEP 2016, AHS 2024 (dexamethasone, magnesium)
//   - Cluster: EHF 2023 (CGRP mAb galcanezumab for prevention)
//   - GCA: ACR/EULAR 2022 (tocilizumab for refractory)
//   - SAH: AHA/ASA 2023
//   - Hypertensive emergency management
//
// Route: /HeadacheHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc, < 1600 lines

import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
const ClinicalNote = base44.entities.ClinicalNote;

(() => {
  if (document.getElementById("ha-fonts")) return;
  const l = document.createElement("link");
  l.id = "ha-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ha-css";
  s.textContent = `
    @keyframes ha-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .ha-in{animation:ha-in .18s ease forwards}
    @keyframes shimmer-ha{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-ha{background:linear-gradient(90deg,#f0f4ff 0%,#9b6dff 40%,#ff6b6b 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-ha 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#080510", panel:"#0e0a1a",
  txt:"#f0ecff", txt2:"#c4b8e8", txt3:"#8a7ab4", txt4:"#7a6cb0",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#6b9fff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  lavender:"#c4aaff",
};

const TABS = [
  { id:"redflags",  label:"Red Flags",   icon:"🚨", color:T.coral  },
  { id:"ottawa",    label:"Ottawa SAH",  icon:"🧠", color:T.purple },
  { id:"lp",        label:"LP / CSF",    icon:"🔬", color:T.blue  },
  { id:"treatment", label:"Treatment",   icon:"💊", color:T.teal  },
  { id:"types",     label:"HA Types",    icon:"📋", color:T.gold  },
];

// ── Shared primitives ───────────────────────────────────────────────────
function Card({ color, title, icon, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}08`, border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
          {icon && <span style={{ marginRight:5 }}>{icon}</span>}{title}
        </div>
      )}
      {children}
    </div>
  );
}

function Bullet({ text, color, sub }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{text}</span>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Check({ label, sub, checked, onToggle, color }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9,
        width:"100%", padding:"8px 12px", borderRadius:8,
        cursor:"pointer", textAlign:"left", border:"none",
        marginBottom:4, transition:"all .1s",
        background:checked ? `${color||T.purple}12` : "rgba(14,10,26,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.purple) : "rgba(45,30,80,0.5)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.purple) : "rgba(74,61,122,0.5)"}`,
        background:checked ? (color||T.purple) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#080510", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.purple) : T.txt2 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}

function Result({ label, detail, color }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:10,
      background:`${color}0c`, border:`1px solid ${color}44`, marginTop:10 }}>
      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:18, color, marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",
        fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>{detail}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RED FLAGS TAB — always-visible grid, no accordions
// ═══════════════════════════════════════════════════════════════════════
const DANGER_DX = [
  { dx:"Subarachnoid Hemorrhage",      icon:"🧠", color:T.red,     clue:"Thunderclap, worst of life, meningismus, sentinel bleed" },
  { dx:"Meningitis / Encephalitis",    icon:"🦠", color:T.coral,   clue:"Fever + headache + stiff neck ± altered mentation" },
  { dx:"Cerebral Venous Thrombosis",   icon:"🔴", color:T.orange,  clue:"Progressive, papilledema, pregnancy/OCP, no arterial stroke territory" },
  { dx:"Hypertensive Emergency",       icon:"⚡", color:T.gold,    clue:"BP > 180/120 + headache + end-organ damage" },
  { dx:"Giant Cell Arteritis",         icon:"👁", color:T.purple,  clue:"Age > 50, jaw claudication, tender temporal artery, ESR > 50" },
  { dx:"CO Poisoning",                 icon:"💨", color:T.blue,    clue:"Multiple affected, headache + nausea, fuel-burning appliance" },
  { dx:"Acute Angle-Closure Glaucoma", icon:"👁", color:T.teal,    clue:"Severe eye pain, nausea, red eye, fixed mid-dilated pupil, vision loss" },
  { dx:"Subdural Hematoma",            icon:"🧠", color:T.lavender,clue:"Elderly, fall history, gradual worsening, anticoagulation use" },
];

const SNOOP4 = [
  { letter:"S", color:T.coral, mnemonic:"Systemic / Secondary risk",
    flags:["Fever → meningitis, encephalitis, abscess","Immunocompromised → opportunistic CNS infection","Active cancer → leptomeningeal / mets","Pregnancy / postpartum → PRES, CVT","Night sweats / weight loss → vasculitis, malignancy"] },
  { letter:"N", color:T.red, mnemonic:"Neurologic signs",
    flags:["Focal deficit → stroke, mass, abscess","Altered mentation → encephalitis, SAH, PRES","Papilledema → elevated ICP","Meningismus → meningitis, SAH"] },
  { letter:"O", color:T.purple, mnemonic:"Onset thunderclap",
    flags:["Maximal pain in < 1 sec → SAH until proven otherwise","During exertion / Valsalva → sentinel bleed","During sex / orgasm → coital HA, SAH"] },
  { letter:"O", color:T.orange, mnemonic:"Older patient (> 50 yrs)",
    flags:["New HA after age 50 → giant cell arteritis","Jaw claudication, tender temporal artery","ESR > 50, CRP elevated → GCA; risk of permanent vision loss"] },
  { letter:"P", color:T.gold, mnemonic:"Pattern change / Progressive",
    flags:["Increasing freq / severity over weeks → mass, SDH","Morning HA / worse supine → elevated ICP","Positional worse upright → CSF hypotension / leak"] },
  { letter:"P", color:T.blue, mnemonic:"Precipitated by Valsalva",
    flags:["Cough / sneeze → Chiari, posterior fossa mass","Exertional HA → primary exertional HA vs SAH"] },
  { letter:"P", color:T.teal, mnemonic:"Postural component",
    flags:["Orthostatic (worse upright) → low CSF pressure, post-LP, CSF leak","Worse supine → IIH, venous sinus thrombosis"] },
  { letter:"P", color:T.lavender, mnemonic:"Papilledema",
    flags:["Bilateral disc edema → elevated ICP","Pulsatile tinnitus + visual changes → IIH","Enlarged blind spot on visual fields → IIH"] },
];

function RedFlagsTab() {
  return (
    <div className="ha-in">
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.coral, letterSpacing:1.5, textTransform:"uppercase",
        marginBottom:8 }}>🚨 Must-Not-Miss Diagnoses</div>
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
        gap:6, marginBottom:16 }}>
        {DANGER_DX.map(d => (
          <div key={d.dx} style={{ padding:"8px 10px", borderRadius:8,
            background:`${d.color}08`, border:`1px solid ${d.color}28` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
              <span style={{ fontSize:13 }}>{d.icon}</span>
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:12, color:d.color }}>{d.dx}</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt4, lineHeight:1.5 }}>{d.clue}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:15, color:T.purple, marginBottom:10 }}>
        SNOOP4 Red Flags
      </div>
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
        {SNOOP4.map((item, i) => (
          <div key={i} style={{ padding:"10px 12px", borderRadius:9,
            background:`${item.color}08`, border:`1px solid ${item.color}28`,
            borderLeft:`3px solid ${item.color}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
              <div style={{ width:22, height:22, borderRadius:"50%",
                background:item.color, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Playfair Display',serif",
                fontWeight:900, fontSize:11, color:"#080510" }}>
                {item.letter}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontWeight:600, fontSize:11, color:item.color, lineHeight:1.3 }}>
                {item.mnemonic}
              </div>
            </div>
            {item.flags.map((f, j) => (
              <div key={j} style={{ display:"flex", gap:5, marginBottom:4 }}>
                <span style={{ color:item.color, fontSize:7,
                  marginTop:4, flexShrink:0 }}>▸</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// OTTAWA SAH TAB — interactive calculator (clicking appropriate here)
// ═══════════════════════════════════════════════════════════════════════
const OTTAWA_CRITERIA = [
  { key:"age40",      label:"Age ≥ 40 years",                       sub:"" },
  { key:"neck",       label:"Neck pain or stiffness",                sub:"Reported by patient or on exam" },
  { key:"loc",        label:"Witnessed loss of consciousness",        sub:"Transient LOC at headache onset" },
  { key:"exertion",   label:"Onset during exertion",                 sub:"Weight lifting, sex, defecation, coughing" },
  { key:"thunderclap",label:"Thunderclap — maximal at onset",         sub:"Maximal pain instantaneously" },
  { key:"neckflex",   label:"Limited neck flexion on exam",           sub:"Physician detects reduced ROM" },
];

function OttawaTab() {
  const [items,   setItems]   = useState({});
  const [gcs15,   setGcs15]   = useState(false);
  const [onset,   setOnset]   = useState(false);
  const [ctHours, setCtHours] = useState("");

  const toggle = k => setItems(p => ({ ...p, [k]:!p[k] }));
  const anyPos     = OTTAWA_CRITERIA.some(c => items[c.key]);
  const allEval    = OTTAWA_CRITERIA.every(c => c.key in items);

  const ctSens = useMemo(() => {
    const h = parseFloat(ctHours);
    if (isNaN(h)) return null;
    if (h <= 6)  return { pct:"98.7%", color:T.teal,  note:"CT within 6h near-perfect sensitivity (Perry 2011, JAMA). If negative, SAH essentially excluded." };
    if (h <= 12) return { pct:"~95%",  color:T.gold,  note:"CT sensitivity drops after 6h. LP required if CT negative and clinical suspicion remains." };
    return              { pct:"~90%",  color:T.coral, note:"CT > 12h — sensitivity too low. LP required regardless of CT result." };
  }, [ctHours]);

  return (
    <div className="ha-in">
      <Card color={T.purple} title="Ottawa SAH Rule — Eligibility" icon="📋">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
          color:T.txt3, lineHeight:1.65, marginBottom:10 }}>
          Apply ONLY to: alert (GCS 15) patients with non-traumatic headache reaching
          maximum intensity within 1 hour. Sensitivity 100% (95% CI 97–100%), specificity 15.3%.
        </div>
        <Check label="GCS 15 — alert and oriented"
          sub="Fully alert, no neurologic deficits"
          checked={gcs15} onToggle={() => setGcs15(p => !p)} color={T.purple} />
        <Check label="Headache reached maximum intensity within 1 hour"
          sub="Thunderclap onset — not a gradual build-up"
          checked={onset} onToggle={() => setOnset(p => !p)} color={T.purple} />
        {(!gcs15 || !onset) && (
          <div style={{ marginTop:6, padding:"7px 10px", borderRadius:7,
            background:"rgba(255,92,92,0.08)", border:"1px solid rgba(255,92,92,0.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.coral, lineHeight:1.5 }}>
            {!gcs15 && "Ottawa SAH Rule not applicable — patient not GCS 15. "}
            {!onset && "Ottawa SAH Rule not applicable — HA did not reach max intensity within 1h. "}
            Proceed directly to CT head ± LP based on clinical judgment.
          </div>
        )}
      </Card>

      {gcs15 && onset && (
        <>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:14, color:T.purple, marginBottom:8 }}>
            Ottawa Criteria — Any positive = imaging required
          </div>
          {OTTAWA_CRITERIA.map(c => (
            <Check key={c.key} label={c.label} sub={c.sub}
              checked={!!items[c.key]} onToggle={() => toggle(c.key)} color={T.purple} />
          ))}
          {allEval && (
            anyPos
              ? <Result label="Ottawa Positive — Imaging Required" color={T.coral}
                  detail={`${OTTAWA_CRITERIA.filter(c => items[c.key]).length} criterion/criteria positive. Proceed to CT head. If CT negative, LP required.`} />
              : <Result label="Ottawa Negative — SAH Excluded" color={T.teal}
                  detail="All 6 Ottawa criteria negative. SAH ruled out without CT or LP in eligible patients (GCS 15, maximal onset within 1h). Document criteria explicitly." />
          )}
        </>
      )}

      <Card color={T.blue} title="CT Timing — Sensitivity for SAH" icon="🖥️">
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
          marginBottom:6 }}>Hours Since Headache Onset</div>
        <input type="number" value={ctHours}
          onChange={e => setCtHours(e.target.value)} placeholder="e.g. 4"
          style={{ width:"100%", padding:"9px 11px",
            background:"rgba(14,10,26,0.9)",
            border:`1px solid ${ctHours ? T.blue+"55" : "rgba(45,30,80,0.4)"}`,
            borderRadius:8, outline:"none",
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:20, fontWeight:700, color:T.blue,
            marginBottom:ctSens ? 8 : 0 }} />
        {ctSens && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:`${ctSens.color}09`, border:`1px solid ${ctSens.color}30` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:14, fontWeight:700, color:ctSens.color, marginBottom:4 }}>
              CT sensitivity: {ctSens.pct}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, lineHeight:1.55 }}>{ctSens.note}</div>
          </div>
        )}
      </Card>

      <Card color={T.gold} title="CT-Negative Thunderclap — Next Steps">
        {[
          { step:"CT negative within 6h + low suspicion", action:"Apply Ottawa criteria — if all negative, may avoid LP. Discharge with return precautions.", color:T.teal },
          { step:"CT negative within 6h + high suspicion", action:"LP at ≥ 12h after headache onset. Tubes 1 and 4 for RBC. Spectrophotometry for xanthochromia.", color:T.gold },
          { step:"CT negative after 6h", action:"LP required regardless of Ottawa. CT too insensitive > 6h.", color:T.coral },
          { step:"CT positive", action:"Neurosurgery immediately. Nimodipine 60mg q4h × 21d. CTA for aneurysm. ICU.", color:T.red },
        ].map((s, i) => (
          <div key={i} style={{ padding:"7px 10px", borderRadius:7, marginBottom:6,
            background:`${s.color}09`, border:`1px solid ${s.color}28` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:s.color, marginBottom:3 }}>{s.step}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>{s.action}</div>
          </div>
        ))}
      </Card>

      <Card color={T.red} title="CT-Negative + LP-Negative — Thunderclap DDx" icon="⚠️">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
          color:T.txt4, lineHeight:1.5, marginBottom:10 }}>
          CT and LP negative does NOT exclude serious pathology. The following require specific imaging.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:7 }}>
          {[
            { dx:"RCVS", icon:"🔴", color:T.red,
              features:[
                "Recurrent thunderclap over days–weeks; CT + LP often normal",
                "CTA/MRA: multifocal vasospasm — 'string of beads'",
                "⚠️ TRIPTANS CONTRAINDICATED — worsen vasospasm",
                "Tx: nimodipine 60mg q4h OR verapamil 240mg/day PO; avoid vasoconstrictors",
              ],
              workup:"CTA head + neck (or MRA)" },
            { dx:"Cervical Artery Dissection", icon:"🔶", color:T.orange,
              features:[
                "Thunderclap + severe unilateral neck/head pain",
                "Carotid: Horner syndrome (ptosis, miosis, anhidrosis), amaurosis",
                "Vertebral: occipital/posterior HA, ataxia, dysarthria",
                "Tx: anticoagulation or antiplatelet (neurology-guided)",
              ],
              workup:"CTA neck (not just head) + MRI DWI for ischemia" },
            { dx:"PRES", icon:"🟡", color:T.gold,
              features:[
                "HA + visual changes + confusion + seizure + hypertension",
                "Context: pre-eclampsia, eclampsia, immunosuppression (tacrolimus), HTN emergency",
                "CT often normal; MRI FLAIR: posterior parieto-occipital edema",
                "DWI usually negative (vasogenic, not cytotoxic edema)",
              ],
              workup:"MRI brain (FLAIR sequence); DWI" },
            { dx:"CVT", icon:"🔵", color:T.blue,
              features:[
                "Progressive headache; papilledema; focal deficit; altered mentation",
                "Risk factors: pregnancy/postpartum, OCP, dehydration, hypercoagulable",
                "CT often normal; hemorrhage in atypical location is clue",
                "Tx: anticoagulation even if hemorrhage present (paradoxical but correct)",
              ],
              workup:"CT venography or MR venography" },
          ].map(c => (
            <div key={c.dx} style={{ padding:"9px 11px", borderRadius:9,
              background:`${c.color}09`, border:`1px solid ${c.color}30`,
              borderLeft:`3px solid ${c.color}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:13 }}>{c.icon}</span>
                <span style={{ fontFamily:"'Playfair Display',serif",
                  fontWeight:700, fontSize:12, color:c.color }}>{c.dx}</span>
              </div>
              {c.features.map((f, i) => (
                <div key={i} style={{ display:"flex", gap:5, marginBottom:3 }}>
                  <span style={{ color:c.color, fontSize:7, marginTop:3.5, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10.5, color: f.startsWith("⚠️") ? T.coral : T.txt3,
                    fontWeight: f.startsWith("⚠️") ? 700 : 400,
                    lineHeight:1.45 }}>{f}</span>
                </div>
              ))}
              <div style={{ marginTop:6, padding:"4px 8px", borderRadius:5,
                background:`${c.color}12`, border:`1px solid ${c.color}22` }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:c.color, letterSpacing:1.2,
                  textTransform:"uppercase" }}>Workup: </span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11.5, color:T.txt3 }}>{c.workup}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════
function LPTab() {
  const [op,       setOP]       = useState("");
  const [rbc1,     setRBC1]     = useState("");
  const [rbc4,     setRBC4]     = useState("");
  const [wbc,      setWBC]      = useState("");
  const [protein,  setProtein]  = useState("");
  const [glucose,  setGlucose]  = useState("");
  const [serumGlu, setSerumGlu] = useState("");
  const [xantho,   setXantho]   = useState(null);

  const opVal   = parseFloat(op);
  const rbc1v   = parseFloat(rbc1);
  const rbc4v   = parseFloat(rbc4);
  const wbcV    = parseFloat(wbc);
  const glucV   = parseFloat(glucose);
  const sgluV   = parseFloat(serumGlu);

  const opInterp = isNaN(opVal) ? null
    : opVal < 8   ? { label:"Low (< 8 cmH2O)",       color:T.blue,  note:"Spontaneous intracranial hypotension — orthostatic HA, CSF leak" }
    : opVal <= 20 ? { label:"Normal (8–20 cmH2O)",    color:T.teal,  note:"Normal ICP" }
    : opVal <= 25 ? { label:"Borderline (20–25)",      color:T.gold,  note:"Consider IIH if normal CSF composition" }
    :               { label:"Elevated (> 25 cmH2O)",  color:T.coral, note:"Raised ICP — IIH, venous sinus thrombosis, mass, meningitis" };

  const rbcInterp = (!isNaN(rbc1v) && !isNaN(rbc4v) && rbc1v > 0)
    ? (rbc4v < rbc1v * 0.7
        ? { label:"Clearing — Traumatic Tap More Likely", color:T.gold,
            note:`Tube 1: ${rbc1v}/µL → Tube 4: ${rbc4v}/µL (${Math.round(rbc4v/rbc1v*100)}% of original). Clearing favors traumatic tap. Xanthochromia spectrophotometry is definitive.` }
        : { label:"No Clearing — SAH More Likely", color:T.coral,
            note:`Tube 1: ${rbc1v}/µL → Tube 4: ${rbc4v}/µL (${Math.round(rbc4v/rbc1v*100)}% of original). Persistent RBCs favor SAH. Confirm with xanthochromia.` })
    : null;

  const wbcInterp = isNaN(wbcV) ? null
    : wbcV <= 5    ? { label:"Normal WBC",                    color:T.teal }
    : wbcV <= 100  ? { label:"Mild pleocytosis (< 100)",       color:T.gold,  note:"Viral meningitis, partially treated bacterial, SAH reaction, carcinomatous" }
    : wbcV <= 1000 ? { label:"Moderate pleocytosis (100–1000)",color:T.orange,note:"Bacterial or viral meningitis, TB, fungal. Differential critical." }
    :                { label:"Severe pleocytosis (> 1000)",    color:T.coral, note:"Bacterial meningitis until proven otherwise — start empiric antibiotics immediately" };

  const glucRatio  = (!isNaN(glucV) && !isNaN(sgluV) && sgluV > 0) ? (glucV / sgluV).toFixed(2) : null;
  const glucInterp = glucRatio === null ? null
    : parseFloat(glucRatio) >= 0.6 ? { label:"Normal CSF/serum ratio",          color:T.teal }
    : parseFloat(glucRatio) >= 0.4 ? { label:"Borderline low ratio (0.4–0.6)", color:T.gold,  note:"Consider bacterial, TB, fungal, carcinomatous meningitis" }
    :                                 { label:"Low ratio (< 0.4) — Infection",  color:T.coral, note:"Bacterial meningitis, TB, fungal, carcinomatous — treat empirically" };

  return (
    <div className="ha-in">
      <Card color={T.purple} title="LP Technique for SAH">
        <Bullet text="Collect 4 tubes: tubes 1 and 4 for RBC comparison" color={T.purple} />
        <Bullet text="Timing: LP ideally ≥ 12h after onset for xanthochromia to develop" color={T.purple} />
        <Bullet text="Spectrophotometry required for xanthochromia — visual inspection sensitivity only 52% vs 96% for spectrophotometry" color={T.purple} />
        <Bullet text="Xanthochromia window: 12h to 2 weeks after bleed onset" color={T.purple} />
      </Card>

      <Card color={T.blue} title="Opening Pressure (lateral decubitus)">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
              cmH2O
            </div>
            <input type="number" value={op} onChange={e => setOP(e.target.value)}
              style={{ width:"100%", padding:"8px 10px",
                background:"rgba(14,10,26,0.9)",
                border:`1px solid ${op ? T.blue+"55" : "rgba(45,30,80,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:T.blue }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, justifyContent:"center" }}>
            {[["> 25","Elevated",T.coral],["20–25","Borderline",T.gold],
              ["8–20","Normal",T.teal],["< 8","Low",T.blue]].map(([r,l,c]) => (
              <div key={r} style={{ display:"flex", gap:8,
                fontFamily:"'DM Sans',sans-serif", fontSize:10 }}>
                <span style={{ color:c, minWidth:40,
                  fontFamily:"'JetBrains Mono',monospace" }}>{r}</span>
                <span style={{ color:T.txt4 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        {opInterp && (
          <div style={{ padding:"7px 10px", borderRadius:7,
            background:`${opInterp.color}09`, border:`1px solid ${opInterp.color}28` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:opInterp.color, marginBottom:3 }}>
              {opInterp.label}
            </div>
            {opInterp.note && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11.5, color:T.txt3 }}>{opInterp.note}</div>
            )}
          </div>
        )}
      </Card>

      <Card color={T.coral} title="RBC Count — Traumatic Tap vs SAH">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 }}>
          {[
            { label:"Tube 1 RBC (/µL)", val:rbc1, set:setRBC1 },
            { label:"Tube 4 RBC (/µL)", val:rbc4, set:setRBC4 },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
                {f.label}
              </div>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                style={{ width:"100%", padding:"8px 10px",
                  background:"rgba(14,10,26,0.9)",
                  border:`1px solid ${f.val ? T.coral+"55" : "rgba(45,30,80,0.4)"}`,
                  borderRadius:7, outline:"none",
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize:18, fontWeight:700, color:T.coral }} />
            </div>
          ))}
        </div>
        {rbcInterp && (
          <div style={{ padding:"8px 11px", borderRadius:8,
            background:`${rbcInterp.color}09`, border:`1px solid ${rbcInterp.color}28` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:rbcInterp.color, marginBottom:3 }}>
              {rbcInterp.label}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt3, lineHeight:1.55 }}>{rbcInterp.note}</div>
          </div>
        )}
        <div style={{ marginTop:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:6 }}>
            Xanthochromia (Spectrophotometry)
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[
              { val:true,  label:"Positive", color:T.coral },
              { val:false, label:"Negative", color:T.teal  },
              { val:null,  label:"Not done", color:T.txt4  },
            ].map(x => (
              <button key={String(x.val)} onClick={() => setXantho(x.val)}
                style={{ flex:1, padding:"7px 0", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  transition:"all .1s",
                  border:`1px solid ${xantho===x.val ? x.color+"66" : "rgba(45,30,80,0.4)"}`,
                  background:xantho===x.val ? `${x.color}12` : "transparent",
                  color:xantho===x.val ? x.color : T.txt4 }}>
                {x.label}
              </button>
            ))}
          </div>
          {xantho === true && (
            <div style={{ marginTop:6, padding:"7px 10px", borderRadius:7,
              background:"rgba(255,92,92,0.08)", border:"1px solid rgba(255,92,92,0.25)",
              fontFamily:"'DM Sans',sans-serif", fontSize:10.5, color:T.coral, lineHeight:1.5 }}>
              Xanthochromia positive — SAH confirmed. Neurosurgery consult. CTA for aneurysm.
            </div>
          )}
          {xantho === false && (
            <div style={{ marginTop:6, padding:"7px 10px", borderRadius:7,
              background:"rgba(0,212,180,0.07)", border:"1px solid rgba(0,212,180,0.25)",
              fontFamily:"'DM Sans',sans-serif", fontSize:10.5, color:T.teal, lineHeight:1.5 }}>
              Xanthochromia negative — SAH essentially excluded if ≥ 12h post-onset.
              Spectrophotometry sensitivity 96% at 12h+.
            </div>
          )}
        </div>
      </Card>

      <Card color={T.orange} title="WBC & Glucose — Meningitis Evaluation">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          {[
            { label:"WBC (/µL)",           val:wbc,      set:setWBC,      c:T.orange },
            { label:"Protein (mg/dL)",      val:protein,  set:setProtein,  c:T.orange },
            { label:"CSF Glucose (mg/dL)",  val:glucose,  set:setGlucose,  c:T.gold   },
            { label:"Serum Glucose (mg/dL)",val:serumGlu, set:setSerumGlu, c:T.gold   },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
                {f.label}
              </div>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                style={{ width:"100%", padding:"8px 10px",
                  background:"rgba(14,10,26,0.9)",
                  border:`1px solid ${f.val ? f.c+"55" : "rgba(45,30,80,0.4)"}`,
                  borderRadius:7, outline:"none",
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize:18, fontWeight:700, color:f.c }} />
            </div>
          ))}
        </div>

        {wbcInterp && (
          <div style={{ padding:"7px 10px", borderRadius:7, marginBottom:6,
            background:`${wbcInterp.color}09`, border:`1px solid ${wbcInterp.color}28` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:wbcInterp.color, marginBottom:wbcInterp.note ? 2 : 0 }}>
              {wbcInterp.label}
            </div>
            {wbcInterp.note && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>{wbcInterp.note}</div>
            )}
          </div>
        )}

        {glucInterp && (
          <div style={{ padding:"7px 10px", borderRadius:7,
            background:`${glucInterp.color}09`, border:`1px solid ${glucInterp.color}28` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:glucInterp.color, marginBottom:glucInterp.note ? 2 : 0 }}>
              {glucInterp.label} (ratio {glucRatio})
            </div>
            {glucInterp.note && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>{glucInterp.note}</div>
            )}
          </div>
        )}

        <div style={{ marginTop:10, padding:"7px 10px", borderRadius:7,
          background:"rgba(14,10,26,0.7)", border:"1px solid rgba(45,30,80,0.4)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:6 }}>
            CSF Reference Values
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
            {[["WBC","< 5/µL"],["Protein","15–45 mg/dL"],["Glucose","45–80 mg/dL"],["Ratio","> 0.6"]].map(([l,v]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.txt4 }}>{l}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, fontWeight:700, color:T.teal }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TREATMENT TAB — all protocols scrollable, no selector click needed
// ═══════════════════════════════════════════════════════════════════════
const TREATMENT_PROTOCOLS = [
  {
    id:"migraine", label:"Migraine", icon:"🧠", color:T.purple,
    sections:[
      { title:"First-Line IV — ED Cocktail (AHS 2024, ACEP 2016)",
        items:[
          "Prochlorperazine 10 mg IV + diphenhydramine 25 mg IV — most effective ED regimen (NNT 3.2); diphenhydramine prevents akathisia, not sedation",
          "Metoclopramide 10 mg IV + diphenhydramine 25 mg IV — equivalent alternative",
          "Normal saline 1L IV — improves pain and nausea outcomes",
          "Ketorolac 30 mg IV — adjunct; inferior to dopamine antagonists as monotherapy",
          "Dexamethasone 10 mg IV at discharge — reduces 24h headache recurrence by 26% (NNT 9)",
        ] },
      { title:"Adjuncts & Second-Line",
        items:[
          "Magnesium sulfate 1–2 g IV over 15–30 min — especially effective in migraine with aura (NNT 3.0 in aura subgroup)",
          "Valproate sodium 500–1000 mg IV over 30 min — effective, consider in refractory cases",
          "Sumatriptan 6 mg SQ — triptan-naive patients, no cardiovascular disease",
          "DHE 0.5–1 mg IV q8h — refractory migraine; CI: ergotamine use, cardiovascular disease, pregnancy",
        ] },
      { title:"Avoid",
        items:[
          "Opioids — increase return visits, chronic opioid dependence, no outcome benefit (ACEP 2016)",
          "Ketorolac alone as first-line — inferior to dopamine antagonists",
          "IV diphenhydramine monotherapy — no evidence as single agent",
        ] },
    ],
    pearl:"Complete ED cocktail: Prochlorperazine + diphenhydramine + NS 1L + dexamethasone 10mg at discharge. Dexamethasone cuts 24h headache recurrence nearly in half.",
  },
  {
    id:"cluster", label:"Cluster Headache", icon:"💥", color:T.orange,
    sections:[
      { title:"Acute Abort (EHF 2023)",
        items:[
          "100% O2 via non-rebreather 10–15 L/min × 15–20 min — effective in 60–70%; NRB mandatory, not simple face mask",
          "Sumatriptan 6 mg SQ — fastest pharmacologic onset (< 15 min); first-line pharmacologic agent",
          "Sumatriptan 20 mg intranasal — if SQ unavailable",
          "Zolmitriptan 5–10 mg intranasal — effective alternative, FDA-approved for cluster",
        ] },
      { title:"Refractory / Rescue",
        items:[
          "DHE 1 mg IV or IM",
          "Octreotide 100 mcg SQ — if triptans contraindicated (cardiovascular disease)",
          "Greater occipital nerve block — lidocaine 2% ± methylprednisolone at posterior skull base",
          "Intranasal lidocaine 4% ipsilateral nostril — temporizing measure only",
        ] },
      { title:"Bridging / Prevention (Initiate or Refer)",
        items:[
          "Verapamil 240–480 mg/day PO — standard first-line prevention; ECG monitoring required (PR prolongation)",
          "Prednisone 60 mg PO × 5 days then taper — short-term bridge while verapamil titrated",
          "Galcanezumab 300 mg SQ × 1 (CGRP mAb) — only FDA-approved CGRP monoclonal antibody for episodic cluster",
        ] },
    ],
    pearl:"Cluster is among the most severe pain syndromes known. Start 100% O2 via NRB immediately — most attacks abort in 15 min. Sumatriptan SQ for fastest pharmacologic relief.",
  },
  {
    id:"sah", label:"SAH Management", icon:"🩸", color:T.red,
    sections:[
      { title:"Immediate",
        items:[
          "Neurosurgery consult immediately",
          "CTA head and neck — aneurysm location and morphology; sensitivity > 96% for aneurysms > 3mm",
          "DSA (digital subtraction angiography) — if CTA equivocal or for endovascular treatment planning",
          "ICU admission — continuous monitoring; ECG for neurogenic T-wave changes, QTc prolongation",
          "Avoid anticoagulation and antiplatelet agents until aneurysm secured",
        ] },
      { title:"Medical Management (AHA/ASA 2023)",
        items:[
          "Nimodipine 60 mg PO/NG q4h × 21 days — reduces vasospasm-related ischemic deficits (NNT 17); not a BP-lowering agent",
          "Pre-securing aneurysm: SBP < 160 mmHg — IV nicardipine or labetalol",
          "Post-securing: SBP 140–180 mmHg to maintain cerebral perfusion pressure",
          "Levetiracetam for seizure — avoid phenytoin / fosphenytoin (associated with worse functional outcomes)",
          "Euvolemia — avoid aggressive fluid restriction; maintain Na > 135 mEq/L",
          "Normoglycemia and normothermia — both independently worsen SAH outcomes",
        ] },
    ],
    pearl:"Nimodipine 60 mg PO q4h × 21 days is non-negotiable for all SAH — reduces ischemic injury from vasospasm. It is not used for blood pressure control.",
  },
  {
    id:"htn", label:"Hypertensive Headache", icon:"⚡", color:T.gold,
    sections:[
      { title:"Hypertensive Emergency — BP > 180/120 + End-Organ Damage",
        items:[
          "IV nicardipine 5 mg/hr, titrate 2.5 mg/hr q5 min (max 15 mg/hr) — preferred for most presentations",
          "IV labetalol 20 mg bolus, repeat 40–80 mg q10 min to max 300 mg; then infusion 0.5–2 mg/min",
          "IV clevidipine 1–2 mg/hr, double q90 sec (max 32 mg/hr) — most titratable agent",
          "Target: reduce MAP by 10–25% in first hour — NOT to normal; precipitous drops cause stroke and MI",
          "Oral agents NOT appropriate — variable GI absorption precludes precise titration",
        ] },
      { title:"Hypertensive Urgency — BP > 180/120, No End-Organ Damage",
        items:[
          "Oral amlodipine 5–10 mg, lisinopril 10–20 mg, or labetalol 200–400 mg PO",
          "Gradual reduction over 24–48 hours — no evidence for rapid lowering improves outcomes",
          "Address underlying cause: undertreated pain, anxiety, medication non-adherence, stimulants",
          "NEVER sublingual nifedipine — precipitous BP drops cause cerebral and myocardial infarction",
        ] },
    ],
    pearl:"Hypertensive emergency headache is typically occipital, pulsatile, worse in morning. Target 10–25% MAP reduction in first hour — never normalize rapidly. Never sublingual nifedipine.",
  },
  {
    id:"gca", label:"Giant Cell Arteritis", icon:"👁", color:T.lavender,
    sections:[
      { title:"Suspected GCA — Start Immediately (ACR/EULAR 2022)",
        items:[
          "Prednisone 60 mg PO immediately — do NOT wait for biopsy, ESR, or CRP",
          "If vision loss present: methylprednisolone 1 g IV daily × 3 days, then transition to prednisone",
          "Temporal artery biopsy within 2 weeks — steroids do NOT alter pathology within 14 days",
          "Low-dose aspirin 81 mg — reduces cranial ischemic events and vision loss in GCA",
          "Rheumatology consult; ophthalmology if any visual symptoms",
        ] },
      { title:"Refractory or Relapsing GCA (ACR/EULAR 2022)",
        items:[
          "Tocilizumab 162 mg SQ weekly or 8 mg/kg IV q4 weeks — FDA-approved for GCA; allows faster prednisone taper",
          "Reduces relapse rate vs prednisone monotherapy; IL-6 receptor antagonist",
        ] },
    ],
    pearl:"Vision loss from GCA is irreversible in 10–20% of untreated cases. Steroids immediately — biopsy within 2 weeks. Add aspirin 81mg for vascular protection. Tocilizumab for refractory disease.",
  },
  {
    id:"iih", label:"IIH", icon:"👁", color:T.blue,
    sections:[
      { title:"ED Management (IIH — Idiopathic Intracranial Hypertension)",
        items:[
          "Acetazolamide 500 mg BID PO — first-line; inhibits carbonic anhydrase to reduce CSF production; titrate to 1000–2000 mg/day as outpatient",
          "Therapeutic LP — drain CSF to opening pressure 20 cmH2O; immediate symptom relief; always measure OP before drainage",
          "Urgent ophthalmology if any visual symptoms — papilledema can cause rapid permanent vision loss; visual fields and fundoscopy required",
          "MRI brain + MR venography before diagnosing IIH — exclude CVT, mass, meningitis",
        ] },
    ],
    pearl:"IIH: young obese women + headache + papilledema + OP > 25 cmH2O + normal CSF composition. Always exclude CVT. Acetazolamide + therapeutic LP + urgent ophthalmology.",
  },
  {
    id:"postlp", label:"Post-LP Headache", icon:"🩹", color:T.teal,
    sections:[
      { title:"Diagnosis + Management",
        items:[
          "Presentation: orthostatic HA (worse upright, better supine), onset within 24–48h of LP; usually resolves in 1–2 weeks spontaneously",
          "Caffeine 300 mg IV OR 300–600 mg PO — first-line; repeat in 2h if inadequate response; raises CSF pressure via cerebral vasoconstriction",
          "IV fluids, bed rest — limited evidence as sole treatment; use as adjunct",
          "Epidural blood patch — 10–20 mL autologous blood at LP level; 70–98% success for refractory cases; refer to anesthesia if caffeine fails",
        ] },
    ],
    pearl:"Post-LP HA: orthostatic pattern, onset 24–48h post-LP. Caffeine 300mg IV or PO is effective first-line. Epidural blood patch for refractory cases. Most resolve in 1–2 weeks.",
  },
  {
    id:"preeclampsia", label:"Pre-eclampsia Headache", icon:"🤰", color:T.coral,
    sections:[
      { title:"Severe Features — Act Immediately",
        items:[
          "SBP ≥ 160 OR DBP ≥ 110 + headache = hypertensive emergency in pregnancy — treat without delay",
          "Magnesium sulfate 4–6 g IV over 15–20 min, then 1–2 g/hr infusion — seizure prophylaxis (eclampsia prevention); NOT a BP agent",
          "Labetalol 20 mg IV q10 min (max 300 mg) OR hydralazine 5–10 mg IV — BP target SBP 140–155 / DBP 90–105 mmHg",
          "Urgent OB / MFM — definitive treatment is delivery; gestational age guides timing",
          "Mg toxicity monitoring: check reflexes, RR, urine output; antidote: calcium gluconate 1 g IV",
        ] },
    ],
    pearl:"Pre-eclampsia HA + severe BP: MgSO4 immediately for seizure prophylaxis (not BP). Use labetalol or hydralazine for BP. Target 140–155/90–105 mmHg in pregnancy. Call OB stat.",
  },
];

function TreatmentTab() {
  const refs = useRef({});
  const scrollTo = id => refs.current[id]?.scrollIntoView({ behavior:"smooth", block:"start" });

  return (
    <div className="ha-in">
      {/* Pinned cocktail card — always visible */}
      <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:11,
        background:"rgba(8,5,16,0.95)",
        border:`2px solid ${T.teal}44`,
        borderLeft:`4px solid ${T.teal}` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.teal, letterSpacing:1.8, textTransform:"uppercase", marginBottom:8 }}>
          🍹 Migraine Cocktail — 2am Reference
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:7 }}>
          {[
            ["Prochlorperazine","10 mg IV"],
            ["Diphenhydramine", "25 mg IV"],
            ["Normal Saline",   "1 L IV"],
            ["Dexamethasone",   "10 mg IV *"],
          ].map(([drug, dose]) => (
            <div key={drug} style={{ padding:"5px 10px", borderRadius:7,
              background:`${T.teal}12`, border:`1px solid ${T.teal}30` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, fontWeight:700, color:T.teal }}>{dose}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:9, color:T.txt4 }}>{drug}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt4 }}>
          * Dexamethasone at discharge — reduces 24h recurrence 26% (NNT 9). Diphenhydramine prevents akathisia.
        </div>
      </div>

      {/* Mini-nav */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
        {TREATMENT_PROTOCOLS.map(p => (
          <button key={p.id} onClick={() => scrollTo(p.id)}
            style={{ padding:"4px 9px", borderRadius:6, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:10,
              border:`1px solid ${p.color}44`, background:`${p.color}0a`,
              color:p.color }}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {TREATMENT_PROTOCOLS.map((proto, pi) => (
        <div key={proto.id} ref={el => { refs.current[proto.id] = el; }} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8,
            marginBottom:9, padding:"8px 12px", borderRadius:9,
            background:`${proto.color}10`,
            border:`1px solid ${proto.color}33` }}>
            <span style={{ fontSize:16 }}>{proto.icon}</span>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:16, color:proto.color }}>
              {proto.label}
            </span>
          </div>
          {proto.sections.map((sec, i) => (
            <div key={i} style={{ padding:"10px 12px", borderRadius:9,
              marginBottom:7, background:`${proto.color}07`,
              border:`1px solid ${proto.color}24`,
              borderLeft:`3px solid ${proto.color}` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:proto.color, letterSpacing:1.5,
                textTransform:"uppercase", marginBottom:6 }}>
                {sec.title}
              </div>
              {sec.items.map((item, j) => (
                <Bullet key={j} text={item} color={proto.color} />
              ))}
            </div>
          ))}
          <div style={{ padding:"9px 12px", borderRadius:8,
            background:`${proto.color}09`,
            border:`1px solid ${proto.color}30` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:proto.color, letterSpacing:1.3,
              textTransform:"uppercase" }}>💎 Pearl:{" "}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>
              {proto.pearl}
            </span>
          </div>
          {pi < TREATMENT_PROTOCOLS.length - 1 && (
            <div style={{ height:1, marginTop:18,
              background:"linear-gradient(90deg,transparent,rgba(45,30,80,0.5),transparent)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HA TYPES TAB — ICHD-3, always-visible grid, no accordions
// ═══════════════════════════════════════════════════════════════════════
const HA_TYPES = [
  { type:"Migraine without Aura", color:T.purple, icon:"🧠",
    criteria:[
      "≥ 5 attacks, 4–72h duration",
      "≥ 2 of: unilateral | pulsating | moderate-severe | worsened by activity",
      "≥ 1 of: nausea / vomiting | photophobia + phonophobia",
    ],
    ed:"Prochlorperazine 10mg IV + diphenhydramine 25mg IV + NS 1L + dexamethasone 10mg IV at discharge" },
  { type:"Migraine with Aura", color:T.lavender, icon:"✨",
    criteria:[
      "≥ 1 fully reversible aura: visual (most common), sensory, speech / language",
      "Aura develops over ≥ 5 min, each symptom lasts 5–60 min",
      "Headache begins during or within 60 min of aura",
    ],
    ed:"Same as migraine without aura. Magnesium 2g IV (NNT 3.0 in aura subgroup). Avoid combined OCP — stroke risk." },
  { type:"Cluster Headache", color:T.orange, icon:"💥",
    criteria:[
      "≥ 5 attacks of severe unilateral orbital / supraorbital pain, 15–180 min",
      "≥ 1 ipsilateral autonomic: lacrimation | conjunctival injection | rhinorrhea | ptosis | miosis | lid edema",
      "Frequency 1/2 days to 8/day during cluster period; restlessness / agitation",
    ],
    ed:"100% O2 via NRB 10–15 L/min + sumatriptan 6 mg SQ (fastest response)" },
  { type:"Tension-Type Headache", color:T.blue, icon:"😶",
    criteria:[
      "≥ 10 episodes, 30 min – 7 days",
      "≥ 2 of: bilateral | pressing/tightening (non-pulsating) | mild-moderate | not worsened by activity",
      "No nausea / vomiting; max one of photophobia or phonophobia",
    ],
    ed:"NSAIDs or acetaminophen PO. Avoid opioids and frequent analgesic use (medication overuse HA risk)." },
  { type:"Medication Overuse Headache", color:T.gold, icon:"💊",
    criteria:[
      "HA ≥ 15 days/month for > 3 months",
      "Regular overuse: analgesics / opioids ≥ 15 days/mo; triptans / ergots ≥ 10 days/mo",
      "HA developed or worsened during medication overuse",
    ],
    ed:"Abrupt withdrawal (preferred). Bridge: prednisone 60mg × 3d then taper. Start preventive therapy (topiramate, amitriptyline, propranolol)." },
  { type:"New Daily Persistent Headache", color:T.coral, icon:"📅",
    criteria:[
      "Daily and persistent from onset — never remits",
      "Duration ≥ 3 months",
      "Distinct, clearly remembered onset date (\"I remember the exact day\")",
    ],
    ed:"Rule out CVT, IIH, SAH, meningitis before diagnosing NDPH. No established ED treatment. Neurology referral." },
];

function TypesTab() {
  return (
    <div className="ha-in">
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
        color:T.txt4, lineHeight:1.55, marginBottom:12,
        padding:"8px 11px", borderRadius:8,
        background:"rgba(14,10,26,0.7)",
        border:"1px solid rgba(45,30,80,0.3)" }}>
        ICHD-3 — International Classification of Headache Disorders, 3rd edition.
        Primary headache is a diagnosis of exclusion. Always screen for SNOOP4 red flags first.
      </div>
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:9 }}>
        {HA_TYPES.map((t, i) => (
          <div key={i} style={{ padding:"11px 13px", borderRadius:10,
            background:`${t.color}08`, border:`1px solid ${t.color}28`,
            borderLeft:`3px solid ${t.color}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <span style={{ fontSize:16 }}>{t.icon}</span>
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:t.color }}>
                {t.type}
              </span>
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:t.color, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:5 }}>ICHD-3 Criteria</div>
            {t.criteria.map((c, j) => (
              <div key={j} style={{ display:"flex", gap:5, marginBottom:4 }}>
                <span style={{ color:t.color, fontSize:7,
                  marginTop:4, flexShrink:0 }}>▸</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>{c}</span>
              </div>
            ))}
            <div style={{ marginTop:8, padding:"6px 9px", borderRadius:7,
              background:`${t.color}0a`, border:`1px solid ${t.color}22` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:t.color, letterSpacing:1.3,
                textTransform:"uppercase" }}>ED Tx:{" "}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10.5, color:T.txt2, lineHeight:1.5 }}>
                {t.ed}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════
export default function HeadacheHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("redflags");
  const [showChart, setShowChart] = useState(false);
  const [chartTx,   setChartTx]   = useState("redflags");
  const [chartNote, setChartNote] = useState("");
  const [chartSent, setChartSent] = useState(false);
  const [chartErr,  setChartErr]  = useState(false);

  const defaultNote = `[Notrya HeadacheHub Assessment]
Chief complaint: Headache
Presentation type: [thunderclap / progressive / chronic / other]
Ottawa SAH result: [not evaluated / positive / negative — document criteria]
LP/CSF findings: [not performed / normal / abnormal — document results]
Working diagnosis: [complete]
Treatment initiated: [complete]
Disposition: [complete]

Generated via Notrya HeadacheHub. Review and complete before chart submission.`;

  const sendToChart = async () => {
    setChartErr(false);
    try {
      await ClinicalNote.create({
        note_text: chartNote || defaultNote,
        note_type: "Headache Assessment",
        source: "QN-Handoff",
        status: "pending",
      });
      setChartSent(true);
      setTimeout(() => { setShowChart(false); setChartSent(false); setChartNote(""); }, 2200);
    } catch { setChartErr(true); }
  };

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
                background:"rgba(8,5,16,0.8)",
                border:"1px solid rgba(45,30,80,0.5)",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(8,5,16,0.95)",
                border:"1px solid rgba(45,30,80,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontSize:10,
                  fontFamily:"'JetBrains Mono',monospace" }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:11.5, color:T.txt3, letterSpacing:2 }}>HEADACHE</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(176,109,255,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-ha"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Headache Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              SNOOP4 · Ottawa SAH Rule · LP Interpretation ·
              Migraine Cocktail · Cluster · SAH · GCA · ICHD-3
            </p>
          </div>
        )}

        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", marginBottom:14,
          background:"rgba(14,10,26,0.85)",
          border:"1px solid rgba(45,30,80,0.4)",
          borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 13px", borderRadius:9, cursor:"pointer",
                flex:1, justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(45,30,80,0.5)"}`,
                background:tab===t.id ? `${t.color}14` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "redflags"  && <RedFlagsTab />}
        {tab === "ottawa"    && <OttawaTab />}
        {tab === "lp"        && <LPTab />}
        {tab === "treatment" && <TreatmentTab />}
        {tab === "types"     && <TypesTab />}

        {/* QuickNote / Send to Chart */}
        <div style={{ marginTop:20, marginBottom:8 }}>
          <button onClick={() => { setShowChart(p => !p); setChartNote(defaultNote); setChartSent(false); setChartErr(false); }}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px",
              borderRadius:9, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
              border:`1px solid ${T.teal}44`, background:`${T.teal}09`, color:T.teal }}>
            📋 Send to Chart
          </button>
          {showChart && (
            <div className="ha-in" style={{ marginTop:8, padding:"12px 14px",
              borderRadius:10, background:"rgba(14,10,26,0.95)",
              border:`1px solid ${T.teal}33` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:8 }}>Send to QuickNote / ClinicalNoteStudio</div>
              <textarea value={chartNote || defaultNote}
                onChange={e => setChartNote(e.target.value)} rows={9}
                style={{ width:"100%", padding:"9px 11px", borderRadius:8,
                  outline:"none", resize:"vertical", boxSizing:"border-box",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2,
                  lineHeight:1.65, background:"rgba(8,5,16,0.9)",
                  border:`1px solid ${T.teal}33` }} />
              <div style={{ display:"flex", gap:8, marginTop:8, alignItems:"center" }}>
                <button onClick={sendToChart}
                  style={{ padding:"8px 18px", borderRadius:8, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                    border:`1px solid ${T.teal}66`, background:`${T.teal}18`, color:T.teal }}>
                  {chartSent ? "✓ Sent to Chart" : "Send to QuickNote"}
                </button>
                <button onClick={() => setShowChart(false)}
                  style={{ padding:"8px 12px", borderRadius:8, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    border:"1px solid rgba(45,30,80,0.4)", background:"transparent", color:T.txt4 }}>
                  Cancel
                </button>
                {chartErr && <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:10, color:T.coral }}>Entity write failed — check Base44 connection</span>}
              </div>
              <div style={{ marginTop:7, fontFamily:"'DM Sans',sans-serif",
                fontSize:11.5, color:T.txt4, lineHeight:1.5 }}>
                Creates a ClinicalNote entity with source: "QN-Handoff", status: "pending".
                Opens in ClinicalNoteStudio for completion and charting.
              </div>
            </div>
          )}
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA HEADACHE HUB · OTTAWA SAH (PERRY 2013) · AHS 2024 · EHF 2023 ·
            ACR/EULAR 2022 · AHA/ASA 2023 · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}