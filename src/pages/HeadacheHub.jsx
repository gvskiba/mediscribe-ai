// HeadacheHub.jsx
// Integrated Headache Evaluation Hub
//
// Clinical basis:
//   - Ottawa SAH Rule (Perry 2013) — 100% sensitivity for SAH in GCS 15 patients
//   - CT within 6h sensitivity 98.7% for SAH (Perry 2011, JAMA)
//   - SNOOP4 mnemonic — secondary headache red flags
//   - CSF / LP interpretation for SAH (xanthochromia, RBC interpretation)
//   - ED migraine treatment protocol (ACEP 2016, AHS 2019)
//   - Cluster headache: O2 + triptans (EHF 2023)
//   - Giant cell arteritis (ACR/EULAR 2022)
//   - Hypertensive emergency headache management
//
// Route: /HeadacheHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

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
  txt:"#f0ecff", txt2:"#c4b8e8", txt3:"#8a7ab4", txt4:"#4a3d7a",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#6b9fff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  lavender:"#c4aaff",
};

const TABS = [
  { id:"redflags",  label:"Red Flags",       icon:"🚨", color:T.coral    },
  { id:"ottawa",    label:"Ottawa SAH Rule",  icon:"🧠", color:T.purple   },
  { id:"lp",        label:"LP Interpretation",icon:"🔬", color:T.blue    },
  { id:"treatment", label:"Treatment",        icon:"💊", color:T.teal     },
  { id:"types",     label:"HA Classification",icon:"📋", color:T.gold     },
];

// ── Shared primitives ──────────────────────────────────────────────────────
function Card({ color, title, icon, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}08`,
      border:`1px solid ${color}28`,
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

function Bullet({ text, color, sub, bold }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start",
      marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:7,
        marginTop:4, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt2, lineHeight:1.6,
          fontWeight:bold ? 600 : 400 }}>{text}</span>
        {sub && (
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>
        )}
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
        borderLeft:`3px solid ${checked
          ? (color||T.purple) : "rgba(45,30,80,0.5)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4,
        flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.purple) : "rgba(74,61,122,0.5)"}`,
        background:checked ? (color||T.purple) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && (
          <span style={{ color:"#080510", fontSize:9, fontWeight:900 }}>✓</span>
        )}
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.purple) : T.txt2 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>
        )}
      </div>
    </button>
  );
}

function Result({ label, detail, color }) {
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
// RED FLAGS TAB — SNOOP4
// ═══════════════════════════════════════════════════════════════════════════
const SNOOP4 = [
  {
    letter:"S",
    mnemonic:"Systemic symptoms / Secondary risk factors",
    color:T.coral,
    flags:[
      "Fever — meningitis, encephalitis, brain abscess",
      "Night sweats / weight loss — malignancy, vasculitis",
      "HIV / immunocompromised — opportunistic CNS infection",
      "Active cancer — leptomeningeal disease, metastasis",
      "Pregnancy / postpartum — PRES, CVT, cortical vein thrombosis",
    ],
  },
  {
    letter:"N",
    mnemonic:"Neurologic symptoms or signs",
    color:T.red,
    flags:[
      "Focal neurologic deficit — stroke, mass, abscess",
      "Altered mental status — encephalitis, SAH, PRES",
      "Papilledema — elevated ICP (mass, IIH, cerebral venous thrombosis)",
      "Meningismus — meningitis, SAH (blood in subarachnoid space)",
    ],
  },
  {
    letter:"O",
    mnemonic:"Onset sudden — Thunderclap",
    color:T.purple,
    flags:[
      "Maximal intensity within 1 second — SAH until proven otherwise",
      "During sexual activity or orgasm — coital headache, SAH",
      "Maximal at onset during Valsalva / exertion — sentinel bleed",
    ],
  },
  {
    letter:"O",
    mnemonic:"Older patient — new headache > age 50",
    color:T.orange,
    flags:[
      "New headache after age 50 — giant cell arteritis (temporal arteritis)",
      "Jaw claudication, tender temporal artery, ESR > 50 — GCA",
      "Risk of bilateral vision loss without treatment",
    ],
  },
  {
    letter:"P",
    mnemonic:"Pattern change / Progressive",
    color:T.gold,
    flags:[
      "Increasing frequency or severity over weeks — mass, subdural",
      "Positional headache worse supine — IIH, CSF obstruction",
      "Positional headache worse upright — spontaneous intracranial hypotension",
      "Morning headache, waking from sleep — elevated ICP",
    ],
  },
  {
    letter:"P",
    mnemonic:"Precipitated by Valsalva",
    color:T.blue,
    flags:[
      "Cough, sneeze, strain → headache — Chiari malformation, posterior fossa mass",
      "Weight lifting headache — primary exertional HA vs SAH",
    ],
  },
  {
    letter:"P",
    mnemonic:"Postural component",
    color:T.teal,
    flags:[
      "Worse upright → better lying (orthostatic) — low CSF pressure, post-LP, CSF leak",
      "Worse supine — IIH, venous sinus thrombosis",
    ],
  },
  {
    letter:"P",
    mnemonic:"Papilledema",
    color:T.lavender,
    flags:[
      "Bilateral disc edema on fundoscopy — elevated ICP",
      "Pulsatile tinnitus + vision changes — IIH (pseudotumor cerebri)",
      "Check visual fields — enlarged blind spot in IIH",
    ],
  },
];

const DANGER_DIAGNOSES = [
  { dx:"Subarachnoid Hemorrhage",      icon:"🧠", color:T.red,     clue:"Thunderclap, worst of life, meningismus, sentinel bleed" },
  { dx:"Meningitis / Encephalitis",    icon:"🦠", color:T.coral,   clue:"Fever + headache + stiff neck ± altered mentation" },
  { dx:"Cerebral Venous Thrombosis",   icon:"🔴", color:T.orange,  clue:"Progressive, papilledema, pregnancy/OCP, stroke without arterial territory" },
  { dx:"Hypertensive Emergency",       icon:"⚡", color:T.gold,    clue:"BP > 180/120 + headache + end-organ damage" },
  { dx:"Giant Cell Arteritis",         icon:"👁", color:T.purple,  clue:"Age > 50, jaw claudication, tender temporal artery, ESR > 50" },
  { dx:"CO Poisoning",                 icon:"💨", color:T.blue,    clue:"Multiple affected simultaneously, headache + nausea, history of fuel-burning appliance" },
  { dx:"Acute Angle-Closure Glaucoma", icon:"👁", color:T.teal,    clue:"Severe eye pain, nausea, red eye, fixed mid-dilated pupil, vision loss" },
  { dx:"Subdural Hematoma",            icon:"🧠", color:T.lavender,clue:"Elderly, fall history, gradually worsening, anticoagulation" },
];

function RedFlagsTab() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="ha-in">
      <Card color={T.coral} title="Must-Not-Miss Secondary Headaches">
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",
          gap:7 }}>
          {DANGER_DIAGNOSES.map(d => (
            <div key={d.dx} style={{ padding:"8px 10px", borderRadius:8,
              background:`${d.color}08`,
              border:`1px solid ${d.color}28` }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:6, marginBottom:4 }}>
                <span style={{ fontSize:14 }}>{d.icon}</span>
                <span style={{ fontFamily:"'Playfair Display',serif",
                  fontWeight:700, fontSize:12, color:d.color }}>
                  {d.dx}
                </span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, lineHeight:1.5 }}>
                {d.clue}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:15, color:T.purple,
        marginBottom:10, marginTop:4 }}>
        SNOOP4 Red Flag Mnemonic
      </div>

      {SNOOP4.map((item, i) => (
        <div key={i} style={{ marginBottom:6, borderRadius:10,
          overflow:"hidden",
          border:`1px solid ${expanded===i ? item.color+"55" : item.color+"22"}` }}>
          <button onClick={() => setExpanded(expanded===i ? null : i)}
            style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", width:"100%",
              padding:"9px 13px", cursor:"pointer",
              border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${item.color}0c,rgba(14,10,26,0.95))` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%",
                background:item.color, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Playfair Display',serif",
                fontWeight:900, fontSize:13, color:"#080510" }}>
                {item.letter}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontWeight:600, fontSize:12, color:item.color }}>
                  {item.mnemonic}
                </div>
                {expanded !== i && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt4 }}>
                    {item.flags.length} red flag{item.flags.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
            <span style={{ color:T.txt4, fontSize:10 }}>
              {expanded===i ? "▲" : "▼"}
            </span>
          </button>
          {expanded === i && (
            <div style={{ padding:"8px 13px 11px",
              borderTop:`1px solid ${item.color}22` }}>
              {item.flags.map((f, j) => (
                <Bullet key={j} text={f} color={item.color} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OTTAWA SAH RULE TAB — Perry et al, JAMA 2013
// ═══════════════════════════════════════════════════════════════════════════
const OTTAWA_CRITERIA = [
  { key:"age40", label:"Age ≥ 40 years", sub:"" },
  { key:"neck", label:"Neck pain or stiffness", sub:"Reported by patient or detected on examination" },
  { key:"loc", label:"Witnessed loss of consciousness", sub:"Transient LOC at headache onset" },
  { key:"exertion", label:"Onset during exertion", sub:"Weight lifting, sexual activity, defecation, coughing" },
  { key:"thunderclap", label:"Thunderclap headache — maximal at onset", sub:"Patient describes reaching maximum pain instantaneously" },
  { key:"neckflex", label:"Limited neck flexion on examination", sub:"Physician detects reduced range of motion of neck" },
];

function OttawaTab() {
  const [items,  setItems]  = useState({});
  const [gcs15,  setGcs15]  = useState(false);
  const [onset,  setOnset]  = useState(false);
  const [ctHours,setCtHours]= useState("");

  const toggle = k => setItems(p => ({ ...p, [k]:!p[k] }));
  const anyPos = OTTAWA_CRITERIA.some(c => items[c.key]);
  const allChecked = Object.keys(items).length > 0;

  const ctSens = useMemo(() => {
    const h = parseFloat(ctHours);
    if (isNaN(h)) return null;
    if (h <= 6)  return { pct:"98.7%", color:T.teal,   note:"CT within 6h has near-perfect sensitivity (Perry 2011, JAMA). If negative, SAH essentially excluded." };
    if (h <= 12) return { pct:"~95%",  color:T.gold,   note:"CT sensitivity drops after 6h. Consider LP if CT negative and high suspicion." };
    return              { pct:"~90%",  color:T.coral,  note:"CT > 12h after onset — sensitivity too low. LP required if SAH suspected regardless of CT result." };
  }, [ctHours]);

  return (
    <div className="ha-in">
      <Card color={T.purple} title="Ottawa SAH Rule — Eligibility" icon="📋">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
          color:T.txt3, lineHeight:1.65, marginBottom:10 }}>
          Apply ONLY to: alert (GCS 15) patients with non-traumatic headache
          that reached maximum intensity within 1 hour.
          Sensitivity 100% (95% CI 97–100%), specificity 15.3%.
        </div>
        <Check label="GCS 15 — alert and oriented"
          sub="Patient is fully alert with no neurologic deficits"
          checked={gcs15} onToggle={() => setGcs15(p => !p)}
          color={T.purple} />
        <Check label="Headache reached maximum intensity within 1 hour"
          sub="Thunderclap onset — not a gradual build-up headache"
          checked={onset} onToggle={() => setOnset(p => !p)}
          color={T.purple} />
        {(!gcs15 || !onset) && (
          <div style={{ marginTop:6, padding:"7px 10px", borderRadius:7,
            background:"rgba(255,92,92,0.08)",
            border:"1px solid rgba(255,92,92,0.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.coral, lineHeight:1.5 }}>
            {!gcs15 && "Ottawa SAH Rule not applicable — patient not GCS 15. "}
            {!onset && "Ottawa SAH Rule not applicable — headache did not reach max intensity within 1h."}
            {(!gcs15 || !onset) && " Proceed directly to CT head ± LP based on clinical judgment."}
          </div>
        )}
      </Card>

      {gcs15 && onset && (
        <>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:14, color:T.purple,
            marginBottom:8 }}>
            Ottawa Criteria — Any positive = imaging required
          </div>
          {OTTAWA_CRITERIA.map(c => (
            <Check key={c.key} label={c.label} sub={c.sub}
              checked={!!items[c.key]}
              onToggle={() => toggle(c.key)}
              color={T.purple} />
          ))}

          {allChecked && (
            anyPos
              ? <Result label="Ottawa Positive — Imaging Required"
                  color={T.coral}
                  detail={`${OTTAWA_CRITERIA.filter(c => items[c.key]).length} criterion/criteria positive. Proceed to CT head. If CT negative, LP required.`} />
              : <Result label="Ottawa Negative — SAH Excluded"
                  color={T.teal}
                  detail="All 6 Ottawa criteria negative. SAH ruled out without CT or LP in eligible patients (GCS 15, maximal onset within 1h). Document criteria clearly." />
          )}
        </>
      )}

      <Card color={T.blue} title="CT Timing — Sensitivity for SAH" icon="🖥️">
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
          marginBottom:6 }}>Hours Since Headache Onset</div>
        <input type="number" value={ctHours}
          onChange={e => setCtHours(e.target.value)}
          placeholder="e.g. 4"
          style={{ width:"100%", padding:"9px 11px",
            background:"rgba(14,10,26,0.9)",
            border:`1px solid ${ctHours ? T.blue+"55" : "rgba(45,30,80,0.4)"}`,
            borderRadius:8, outline:"none",
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:20, fontWeight:700, color:T.blue,
            marginBottom:ctSens ? 8 : 0 }} />
        {ctSens && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:`${ctSens.color}09`,
            border:`1px solid ${ctSens.color}30` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:14, fontWeight:700, color:ctSens.color,
              marginBottom:4 }}>
              CT sensitivity: {ctSens.pct}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, lineHeight:1.55 }}>
              {ctSens.note}
            </div>
          </div>
        )}
      </Card>

      <Card color={T.gold} title="CT-Negative Thunderclap — Next Steps">
        {[
          { step:"If CT negative within 6h AND low clinical suspicion", action:"Consider Ottawa criteria — if negative, may avoid LP. Discharge with return precautions.", color:T.teal },
          { step:"If CT negative within 6h AND high suspicion", action:"LP at ≥ 12h after headache onset. Check xanthochromia by spectrophotometry, RBC in tubes 1 and 4.", color:T.gold },
          { step:"If CT negative after 6h", action:"LP required regardless of Ottawa. CT too insensitive after 6h.", color:T.coral },
          { step:"If CT positive", action:"Neurosurgery consult immediately. Nimodipine. CTA for aneurysm. ICU.", color:T.red },
        ].map((s, i) => (
          <div key={i} style={{ padding:"7px 10px", borderRadius:7,
            marginBottom:6, background:`${s.color}09`,
            border:`1px solid ${s.color}28` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:s.color, marginBottom:3 }}>{s.step}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>{s.action}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LP INTERPRETATION TAB
// ═══════════════════════════════════════════════════════════════════════════
function LPTab() {
  const [op,      setOP]      = useState("");
  const [rbc1,    setRBC1]    = useState("");
  const [rbc4,    setRBC4]    = useState("");
  const [wbc,     setWBC]     = useState("");
  const [protein, setProtein] = useState("");
  const [glucose, setGlucose] = useState("");
  const [serumGlu,setSerumGlu]= useState("");
  const [xantho,  setXantho]  = useState(null);

  const opVal  = parseFloat(op);
  const rbc1v  = parseFloat(rbc1);
  const rbc4v  = parseFloat(rbc4);
  const wbcV   = parseFloat(wbc);
  const sgluV  = parseFloat(serumGlu);
  const glucV  = parseFloat(glucose);

  const opInterp = isNaN(opVal) ? null
    : opVal < 8   ? { label:"Low (< 8 cmH2O)", color:T.blue,  note:"Spontaneous intracranial hypotension — orthostatic headache, CSF leak" }
    : opVal <= 20 ? { label:"Normal (8–20 cmH2O)", color:T.teal, note:"Normal ICP" }
    : opVal <= 25 ? { label:"Borderline (20–25)", color:T.gold, note:"Consider IIH if normal CSF composition" }
    : { label:"Elevated (> 25 cmH2O)", color:T.coral, note:"Raised ICP — IIH, venous sinus thrombosis, mass, meningitis" };

  const rbcInterp = (!isNaN(rbc1v) && !isNaN(rbc4v) && rbc1v > 0) ? (
    rbc4v < rbc1v * 0.7
      ? { label:"Clearing — Traumatic Tap More Likely", color:T.gold,
          note:`Tube 1: ${rbc1v}/µL → Tube 4: ${rbc4v}/µL (${Math.round(rbc4v/rbc1v*100)}% of original). Clearing favors traumatic tap. Xanthochromia (spectrophotometry) is definitive.` }
      : rbc1v > 0
      ? { label:"No Clearing — SAH More Likely", color:T.coral,
          note:`Tube 1: ${rbc1v}/µL → Tube 4: ${rbc4v}/µL (${Math.round(rbc4v/rbc1v*100)}% of original). Persistent RBCs favor SAH over traumatic tap. Confirm with xanthochromia.` }
      : null
  ) : null;

  const wbcInterp = isNaN(wbcV) ? null
    : wbcV <= 5   ? { label:"Normal WBC", color:T.teal }
    : wbcV <= 100 ? { label:"Mild pleocytosis (< 100)", color:T.gold, note:"Viral meningitis, partially treated bacterial, SAH reaction, carcinomatous" }
    : wbcV <= 1000? { label:"Moderate pleocytosis (100–1000)", color:T.orange, note:"Bacterial or viral meningitis, TB, fungal. Differential critical." }
    : { label:"Severe pleocytosis (> 1000)", color:T.coral, note:"Bacterial meningitis until proven otherwise — start empiric antibiotics immediately" };

  const glucRatio = (!isNaN(glucV) && !isNaN(sgluV) && sgluV > 0)
    ? (glucV / sgluV).toFixed(2) : null;
  const glucInterp = glucRatio === null ? null
    : parseFloat(glucRatio) >= 0.6 ? { label:"Normal CSF/Serum glucose ratio", color:T.teal }
    : parseFloat(glucRatio) >= 0.4 ? { label:"Borderline low ratio (0.4–0.6)", color:T.gold, note:"Consider bacterial, TB, fungal meningitis, carcinomatous" }
    : { label:"Low ratio (< 0.4) — Bacterial/Fungal", color:T.coral, note:"CSF/serum ratio < 0.4 — bacterial meningitis, TB, fungal, carcinomatous" };

  return (
    <div className="ha-in">
      <Card color={T.purple} title="LP Technique for SAH Evaluation">
        <Bullet text="Collect 4 tubes: tubes 1 and 4 for RBC comparison" color={T.purple} />
        <Bullet text="Timing: LP ideally ≥ 12h after headache onset for xanthochromia to develop" color={T.purple} />
        <Bullet text="Send tube 4 for xanthochromia — spectrophotometry is required (visual inspection insufficient)" color={T.purple}
          sub="Spectrophotometry sensitivity 96% vs visual inspection 52% for xanthochromia" />
        <Bullet text="Xanthochromia window: 12 hours to 2 weeks after bleed onset" color={T.purple} />
      </Card>

      <Card color={T.blue} title="Opening Pressure">
        <div style={{ display:"grid",
          gridTemplateColumns:"1fr 2fr", gap:10, marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>cmH2O (lateral decubitus)</div>
            <input type="number" value={op}
              onChange={e => setOP(e.target.value)}
              style={{ width:"100%", padding:"8px 10px",
                background:"rgba(14,10,26,0.9)",
                border:`1px solid ${op ? T.blue+"55" : "rgba(45,30,80,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:T.blue }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column",
            gap:4, justifyContent:"center" }}>
            {[[">25","Elevated","coral"],["20-25","Borderline","gold"],
              ["8-20","Normal","teal"],["<8","Low","blue"]].map(([r,l,c]) => (
              <div key={r} style={{ display:"flex", gap:8,
                fontFamily:"'DM Sans',sans-serif", fontSize:10 }}>
                <span style={{ color:T[c], minWidth:40,
                  fontFamily:"'JetBrains Mono',monospace" }}>{r}</span>
                <span style={{ color:T.txt4 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        {opInterp && (
          <div style={{ padding:"7px 10px", borderRadius:7,
            background:`${opInterp.color}09`,
            border:`1px solid ${opInterp.color}28` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:opInterp.color,
              marginBottom:3 }}>{opInterp.label}</div>
            {opInterp.note && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10.5, color:T.txt3 }}>{opInterp.note}</div>
            )}
          </div>
        )}
      </Card>

      <Card color={T.coral} title="RBC Count — Traumatic Tap vs SAH">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:10, marginBottom:8 }}>
          {[
            { label:"Tube 1 RBC (/µL)", val:rbc1, set:setRBC1 },
            { label:"Tube 4 RBC (/µL)", val:rbc4, set:setRBC4 },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:4 }}>{f.label}</div>
              <input type="number" value={f.val}
                onChange={e => f.set(e.target.value)}
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
            background:`${rbcInterp.color}09`,
            border:`1px solid ${rbcInterp.color}28` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:rbcInterp.color,
              marginBottom:3 }}>{rbcInterp.label}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10.5, color:T.txt3, lineHeight:1.55 }}>
              {rbcInterp.note}
            </div>
          </div>
        )}

        <div style={{ marginTop:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:6 }}>Xanthochromia (Spectrophotometry)</div>
          <div style={{ display:"flex", gap:6 }}>
            {[
              { val:true,  label:"Positive", color:T.coral },
              { val:false, label:"Negative", color:T.teal  },
              { val:null,  label:"Not done", color:T.txt4  },
            ].map(x => (
              <button key={String(x.val)} onClick={() => setXantho(x.val)}
                style={{ flex:1, padding:"7px 0", borderRadius:7,
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                  fontWeight:600, fontSize:11, transition:"all .1s",
                  border:`1px solid ${xantho===x.val ? x.color+"66" : "rgba(45,30,80,0.4)"}`,
                  background:xantho===x.val ? `${x.color}12` : "transparent",
                  color:xantho===x.val ? x.color : T.txt4 }}>
                {x.label}
              </button>
            ))}
          </div>
          {xantho === true && (
            <div style={{ marginTop:6, padding:"7px 10px", borderRadius:7,
              background:"rgba(255,92,92,0.08)",
              border:"1px solid rgba(255,92,92,0.25)",
              fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
              color:T.coral, lineHeight:1.5 }}>
              Xanthochromia positive — SAH confirmed. Neurosurgery consult, CTA for aneurysm.
            </div>
          )}
          {xantho === false && (
            <div style={{ marginTop:6, padding:"7px 10px", borderRadius:7,
              background:"rgba(0,212,180,0.07)",
              border:"1px solid rgba(0,212,180,0.25)",
              fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
              color:T.teal, lineHeight:1.5 }}>
              Xanthochromia negative — SAH essentially excluded if ≥ 12h post-onset.
              Sensitivity of spectrophotometry 96% at 12h+.
            </div>
          )}
        </div>
      </Card>

      <Card color={T.orange} title="WBC & Glucose — Meningitis Evaluation">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:10, marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>WBC (/µL)</div>
            <input type="number" value={wbc} onChange={e => setWBC(e.target.value)}
              style={{ width:"100%", padding:"8px 10px",
                background:"rgba(14,10,26,0.9)",
                border:`1px solid ${wbc ? T.orange+"55" : "rgba(45,30,80,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:T.orange }} />
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>Protein (mg/dL)</div>
            <input type="number" value={protein} onChange={e => setProtein(e.target.value)}
              style={{ width:"100%", padding:"8px 10px",
                background:"rgba(14,10,26,0.9)",
                border:`1px solid ${protein ? T.orange+"55" : "rgba(45,30,80,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:T.orange }} />
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>CSF Glucose (mg/dL)</div>
            <input type="number" value={glucose} onChange={e => setGlucose(e.target.value)}
              style={{ width:"100%", padding:"8px 10px",
                background:"rgba(14,10,26,0.9)",
                border:`1px solid ${glucose ? T.gold+"55" : "rgba(45,30,80,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:T.gold }} />
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>Serum Glucose (mg/dL)</div>
            <input type="number" value={serumGlu} onChange={e => setSerumGlu(e.target.value)}
              style={{ width:"100%", padding:"8px 10px",
                background:"rgba(14,10,26,0.9)",
                border:`1px solid ${serumGlu ? T.gold+"55" : "rgba(45,30,80,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:T.gold }} />
          </div>
        </div>

        {wbcInterp && (
          <div style={{ padding:"7px 10px", borderRadius:7, marginBottom:6,
            background:`${wbcInterp.color}09`,
            border:`1px solid ${wbcInterp.color}28` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:wbcInterp.color, marginBottom:wbcInterp.note ? 2 : 0 }}>
              {wbcInterp.label}
            </div>
            {wbcInterp.note && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt3, lineHeight:1.5 }}>
                {wbcInterp.note}
              </div>
            )}
          </div>
        )}

        {glucInterp && (
          <div style={{ padding:"7px 10px", borderRadius:7,
            background:`${glucInterp.color}09`,
            border:`1px solid ${glucInterp.color}28` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:glucInterp.color, marginBottom:glucInterp.note ? 2 : 0 }}>
              {glucInterp.label} (ratio {glucRatio})
            </div>
            {glucInterp.note && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt3, lineHeight:1.5 }}>
                {glucInterp.note}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop:10, padding:"7px 10px", borderRadius:7,
          background:"rgba(14,10,26,0.7)",
          border:"1px solid rgba(45,30,80,0.4)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:6 }}>CSF Reference Values</div>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
            {[
              ["WBC","< 5/µL"],
              ["Protein","15–45 mg/dL"],
              ["Glucose","45–80 mg/dL"],
              ["Ratio","> 0.6"],
            ].map(([l,v]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:7, color:T.txt4 }}>{l}</div>
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

// ═══════════════════════════════════════════════════════════════════════════
// TREATMENT TAB
// ═══════════════════════════════════════════════════════════════════════════
const TREATMENT_PROTOCOLS = [
  {
    id:"migraine",
    label:"Migraine / Primary HA",
    icon:"🧠",
    color:T.purple,
    sections:[
      {
        title:"First-Line (ACEP 2016, AHS 2019)",
        items:[
          "Prochlorperazine 10 mg IV + diphenhydramine 25 mg IV — most effective ED regimen (NNT 3.2)",
          "Or metoclopramide 10 mg IV + diphenhydramine 25 mg IV",
          "IV fluids 1L NS — routine hydration improves outcomes",
          "Ketorolac 30 mg IV for adjunctive pain control",
          "Dark, quiet environment",
        ],
      },
      {
        title:"Second-Line",
        items:[
          "Valproate sodium 500 mg IV over 30 min",
          "DHE 0.5–1 mg IV q8h (contraindicated in ergotamine use, cardiovascular disease)",
          "Sumatriptan 6 mg SQ (triptan naive, no cardiovascular disease)",
        ],
      },
      {
        title:"Avoid",
        items:[
          "Opioids — do not improve outcomes, increase return visits and opioid dependence",
          "Diphenhydramine alone — no evidence as monotherapy",
          "Ketorolac alone as first-line — inferior to dopamine antagonists",
        ],
      },
    ],
    pearl:"Prochlorperazine + diphenhydramine is the most evidence-based ED migraine regimen. The diphenhydramine prevents akathisia, not sedation.",
  },
  {
    id:"cluster",
    label:"Cluster Headache",
    icon:"💥",
    color:T.orange,
    sections:[
      {
        title:"Acute Abort (EHF 2023)",
        items:[
          "100% O2 at 10–12 L/min via non-rebreather mask × 15–20 min — effective in 70%",
          "Sumatriptan 6 mg SQ — fastest onset, most effective pharmacologic option",
          "Sumatriptan 20 mg intranasal if SQ unavailable",
          "Zolmitriptan 5–10 mg intranasal — alternative",
        ],
      },
      {
        title:"Refractory/Rescue",
        items:[
          "DHE 1 mg IV or IM",
          "Octreotide 100 mcg SQ — if triptans contraindicated (cardiovascular disease)",
          "Greater occipital nerve block — lidocaine 2% + steroid at posterior skull base",
        ],
      },
    ],
    pearl:"Cluster headache is one of the most severe pain syndromes known. 100% O2 is first-line — ensure non-rebreather, not simple face mask. Most attacks abort within 15-20 minutes.",
  },
  {
    id:"sah",
    label:"SAH Management",
    icon:"🧠",
    color:T.red,
    sections:[
      {
        title:"Immediate",
        items:[
          "Neurosurgery consult immediately",
          "CTA head and neck — identify aneurysm location and morphology",
          "Angiography if CTA equivocal",
          "ICU admission — continuous cardiac monitoring (neurogenic T-wave changes)",
          "Avoid anticoagulation, antiplatelet agents",
        ],
      },
      {
        title:"Medical Management",
        items:[
          "Nimodipine 60 mg PO/NG q4h × 21 days — reduces vasospasm and ischemic deficits (NNT 17)",
          "SBP target < 160 mmHg before aneurysm secured — nicardipine or labetalol",
          "After aneurysm secured: SBP target 140–180 to maintain perfusion pressure",
          "Levetiracetam if seizure — avoid phenytoin (may worsen outcomes)",
          "Euvolemia — avoid aggressive fluid restriction",
          "Normoglycemia, normothermia",
        ],
      },
    ],
    pearl:"Nimodipine 60mg q4h × 21 days is mandatory for all SAH patients — reduces vasospasm-related ischemia. Not for blood pressure control.",
  },
  {
    id:"htn",
    label:"Hypertensive Headache",
    icon:"⚡",
    color:T.gold,
    sections:[
      {
        title:"Hypertensive Emergency (BP > 180/120 + end-organ damage)",
        items:[
          "IV nicardipine 5 mg/hr, titrate by 2.5 mg/hr q5 min (max 15 mg/hr)",
          "IV labetalol 20 mg, repeat 40–80 mg q10 min to max 300 mg, then infusion 0.5–2 mg/min",
          "Target: reduce MAP by 10–25% in first hour — not to normal",
          "Oral agents NOT appropriate for hypertensive emergency",
        ],
      },
      {
        title:"Hypertensive Urgency (BP > 180/120, no end-organ damage)",
        items:[
          "Oral agents acceptable: amlodipine, lisinopril, clonidine",
          "Target: gradual reduction over 24–48 hours",
          "No evidence that aggressive acute lowering improves outcomes",
          "Address underlying cause: pain, anxiety, medication non-adherence",
        ],
      },
    ],
    pearl:"The headache of hypertensive emergency is typically occipital, pulsatile, worse in morning. Never use sublingual nifedipine — precipitous BP drops cause stroke and MI.",
  },
  {
    id:"gca",
    label:"Giant Cell Arteritis",
    icon:"👁",
    color:T.lavender,
    sections:[
      {
        title:"If GCA Suspected (Age > 50, jaw claudication, ESR > 50, new temporal headache)",
        items:[
          "Prednisone 60 mg PO immediately — do NOT wait for biopsy",
          "If vision loss present: methylprednisolone 1g IV × 3 days, then prednisone",
          "Temporal artery biopsy within 2 weeks (steroids do not affect biopsy within 2 weeks)",
          "Rheumatology consult",
          "Ophthalmology if any visual symptoms",
        ],
      },
    ],
    pearl:"Irreversible vision loss occurs in 10–20% of untreated GCA. Steroids first, biopsy later — do not wait. Steroids do not alter biopsy pathology within 2 weeks.",
  },
];

function TreatmentTab() {
  const [expanded, setExpanded] = useState("migraine");
  const proto = TREATMENT_PROTOCOLS.find(p => p.id === expanded);

  return (
    <div className="ha-in">
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {TREATMENT_PROTOCOLS.map(p => (
          <button key={p.id} onClick={() => setExpanded(p.id)}
            style={{ display:"flex", alignItems:"center", gap:6,
              padding:"7px 13px", borderRadius:9, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              transition:"all .12s",
              border:`1px solid ${expanded===p.id ? p.color+"66" : p.color+"22"}`,
              background:expanded===p.id ? `${p.color}12` : "transparent",
              color:expanded===p.id ? p.color : T.txt4 }}>
            <span style={{ fontSize:13 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {proto && (
        <div>
          {proto.sections.map((sec, i) => (
            <div key={i} style={{ padding:"11px 13px", borderRadius:10,
              marginBottom:10, background:`${proto.color}07`,
              border:`1px solid ${proto.color}28`,
              borderLeft:`3px solid ${proto.color}` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:proto.color, letterSpacing:1.5,
                textTransform:"uppercase", marginBottom:7 }}>
                {sec.title}
              </div>
              {sec.items.map((item, j) => (
                <Bullet key={j} text={item} color={proto.color} />
              ))}
            </div>
          ))}

          <div style={{ padding:"10px 13px", borderRadius:9,
            background:`${proto.color}0a`,
            border:`1px solid ${proto.color}33` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:proto.color, letterSpacing:1.3,
              textTransform:"uppercase" }}>💎 Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>
              {proto.pearl}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION TAB — ICHD-3
// ═══════════════════════════════════════════════════════════════════════════
const HA_TYPES = [
  {
    type:"Migraine without Aura (ICHD-3)",
    color:T.purple,
    criteria:[
      "≥ 5 attacks, 4–72h duration",
      "2 of: unilateral, pulsating, moderate-severe, aggravated by activity",
      "1 of: nausea/vomiting, photophobia + phonophobia",
      "Not better accounted for by another diagnosis",
    ],
    treatment:"Prochlorperazine + diphenhydramine IV in ED",
  },
  {
    type:"Migraine with Aura",
    color:T.lavender,
    criteria:[
      "≥ 1 fully reversible aura: visual (most common), sensory, speech/language",
      "Aura develops gradually over ≥ 5 min, lasts 5–60 min each",
      "Headache begins during or within 60 min of aura",
    ],
    treatment:"Same as migraine without aura. Avoid OCP (stroke risk).",
  },
  {
    type:"Cluster Headache (Trigeminal Autonomic Cephalalgia)",
    color:T.orange,
    criteria:[
      "≥ 5 attacks of severe unilateral orbital/supraorbital pain, 15–180 min",
      "1 ipsilateral autonomic feature: lacrimation, conjunctival injection, rhinorrhea, ptosis, miosis, eyelid edema",
      "Frequency 1 per 2 days to 8/day during cluster period",
    ],
    treatment:"100% O2 + sumatriptan SQ (fastest response)",
  },
  {
    type:"Tension-Type Headache",
    color:T.blue,
    criteria:[
      "≥ 10 episodes, 30 min–7 days duration",
      "2 of: bilateral, pressing/tightening (non-pulsating), mild-moderate, not aggravated by activity",
      "No nausea/vomiting, no more than one of photophobia or phonophobia",
    ],
    treatment:"NSAIDs, acetaminophen — avoid opioids and frequent analgesic use",
  },
  {
    type:"Medication Overuse Headache",
    color:T.gold,
    criteria:[
      "Headache ≥ 15 days/month for > 3 months",
      "Regular overuse of analgesics/triptans ≥ 10–15 days/month",
      "Headache developed or worsened during medication overuse",
    ],
    treatment:"Abrupt withdrawal (preferred). Bridging: prednisone 60mg × 3d, then taper. Preventive therapy.",
  },
  {
    type:"New Daily Persistent Headache (NDPH)",
    color:T.coral,
    criteria:[
      "Persistent headache from onset, daily from first day",
      "Duration ≥ 3 months",
      "Distinct, clearly remembered onset",
      "Rule out secondary causes before diagnosing NDPH",
    ],
    treatment:"No established protocol — rule out CVT, IIH, SAH. Neurology referral.",
  },
];

function TypesTab() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="ha-in">
      <Card color={T.purple} title="ICHD-3 Headache Classification (ED-Relevant)">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:10, lineHeight:1.55 }}>
          International Classification of Headache Disorders, 3rd edition.
          Primary headache is a diagnosis of exclusion — always screen for red flags first.
        </div>
      </Card>

      {HA_TYPES.map((t, i) => (
        <div key={i} style={{ marginBottom:6, borderRadius:10,
          overflow:"hidden",
          border:`1px solid ${expanded===i ? t.color+"55" : t.color+"22"}` }}>
          <button onClick={() => setExpanded(expanded===i ? null : i)}
            style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", width:"100%",
              padding:"10px 13px", cursor:"pointer",
              border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${t.color}0c,rgba(14,10,26,0.95))` }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:t.color }}>
              {t.type}
            </span>
            <span style={{ color:T.txt4, fontSize:10 }}>
              {expanded===i ? "▲" : "▼"}
            </span>
          </button>
          {expanded === i && (
            <div style={{ padding:"9px 13px 12px",
              borderTop:`1px solid ${t.color}22` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:t.color, letterSpacing:1.3,
                textTransform:"uppercase", marginBottom:6 }}>
                ICHD-3 Criteria
              </div>
              {t.criteria.map((c, j) => (
                <Bullet key={j} text={c} color={t.color} />
              ))}
              <div style={{ marginTop:7, padding:"6px 9px", borderRadius:7,
                background:`${t.color}09`,
                border:`1px solid ${t.color}22` }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:t.color, letterSpacing:1.3,
                  textTransform:"uppercase" }}>
                  ED Treatment:{" "}
                </span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, color:T.txt2 }}>
                  {t.treatment}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function HeadacheHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("redflags");

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
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>HEADACHE</span>
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
              SNOOP4 Red Flags · Ottawa SAH Rule · LP Interpretation ·
              Migraine Cocktail · Cluster · SAH Protocol · GCA · ICHD-3
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

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA HEADACHE HUB · OTTAWA SAH RULE (PERRY 2013) · SNOOP4 · ICHD-3
            · ACEP 2016 · AHS 2019 · EHF 2023 · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}