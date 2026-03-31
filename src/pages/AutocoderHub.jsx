import { useState, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════
//  FONT INJECTION  (idempotent — runs once at module load)
// ════════════════════════════════════════════════════════════
(() => {
  if (document.getElementById("notrya-ac-fonts")) return;
  const l = document.createElement("link");
  l.id = "notrya-ac-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ════════════════════════════════════════════════════════════
//  HUB IDENTITY
// ════════════════════════════════════════════════════════════
const AC = "#9b6dff"; // purple — AI / coding theme

// ── Design tokens (identical to template) ───────────────────
const T = {
  bg:"#050f1e", txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

// ════════════════════════════════════════════════════════════
//  ICD-10 DATABASE
// ════════════════════════════════════════════════════════════
const ICD10_DB = [
  { code:"R07.9",   desc:"Chest pain, unspecified",                             cat:"Cardiovascular" },
  { code:"R07.1",   desc:"Chest pain on breathing",                             cat:"Cardiovascular" },
  { code:"I21.9",   desc:"Acute myocardial infarction, unspecified",            cat:"Cardiovascular" },
  { code:"I21.01",  desc:"STEMI involving left anterior descending artery",     cat:"Cardiovascular" },
  { code:"I20.9",   desc:"Angina pectoris, unspecified",                        cat:"Cardiovascular" },
  { code:"I10",     desc:"Essential (primary) hypertension",                    cat:"Cardiovascular" },
  { code:"I16.0",   desc:"Hypertensive urgency",                                cat:"Cardiovascular" },
  { code:"I16.1",   desc:"Hypertensive emergency",                              cat:"Cardiovascular" },
  { code:"I48.91",  desc:"Unspecified atrial fibrillation",                     cat:"Cardiovascular" },
  { code:"I47.2",   desc:"Ventricular tachycardia",                             cat:"Cardiovascular" },
  { code:"I46.9",   desc:"Cardiac arrest, cause unspecified",                   cat:"Cardiovascular" },
  { code:"R00.1",   desc:"Bradycardia, unspecified",                            cat:"Cardiovascular" },
  { code:"I63.9",   desc:"Cerebral infarction, unspecified (CVA/Stroke)",       cat:"Neurological" },
  { code:"G45.9",   desc:"Transient ischemic attack (TIA), unspecified",        cat:"Neurological" },
  { code:"R51.9",   desc:"Headache, unspecified",                               cat:"Neurological" },
  { code:"G43.909", desc:"Migraine, unspecified, not intractable",              cat:"Neurological" },
  { code:"R55",     desc:"Syncope and collapse",                                cat:"Neurological" },
  { code:"R56.9",   desc:"Unspecified convulsions",                             cat:"Neurological" },
  { code:"G40.909", desc:"Epilepsy, unspecified, not intractable",              cat:"Neurological" },
  { code:"R42",     desc:"Dizziness and giddiness",                             cat:"Neurological" },
  { code:"H81.10",  desc:"Benign paroxysmal vertigo, unspecified ear",          cat:"Neurological" },
  { code:"S06.0X0A",desc:"Concussion without loss of consciousness, initial",   cat:"Neurological" },
  { code:"S09.90XA",desc:"Unspecified injury of head, initial encounter",       cat:"Neurological" },
  { code:"R06.00",  desc:"Dyspnea, unspecified",                                cat:"Respiratory" },
  { code:"J18.9",   desc:"Pneumonia, unspecified organism",                     cat:"Respiratory" },
  { code:"J44.1",   desc:"COPD with acute exacerbation",                        cat:"Respiratory" },
  { code:"J45.901", desc:"Unspecified asthma, uncomplicated",                   cat:"Respiratory" },
  { code:"J96.00",  desc:"Acute respiratory failure, unspecified hypoxia",      cat:"Respiratory" },
  { code:"J96.01",  desc:"Acute respiratory failure with hypoxia",              cat:"Respiratory" },
  { code:"R05.9",   desc:"Cough, unspecified",                                  cat:"Respiratory" },
  { code:"R10.9",   desc:"Unspecified abdominal pain",                          cat:"GI" },
  { code:"R10.0",   desc:"Acute abdomen",                                       cat:"GI" },
  { code:"K35.80",  desc:"Acute appendicitis without abscess",                  cat:"GI" },
  { code:"K80.10",  desc:"Calculus of gallbladder with acute cholecystitis",    cat:"GI" },
  { code:"K57.32",  desc:"Diverticulitis of large intestine without abscess",   cat:"GI" },
  { code:"K92.1",   desc:"Melena",                                              cat:"GI" },
  { code:"K92.0",   desc:"Hematemesis",                                         cat:"GI" },
  { code:"A09",     desc:"Infectious gastroenteritis and colitis, unspecified", cat:"GI" },
  { code:"N23",     desc:"Unspecified renal colic",                             cat:"GU" },
  { code:"N10",     desc:"Acute pyelonephritis",                                cat:"GU" },
  { code:"N39.0",   desc:"Urinary tract infection, site not specified",         cat:"GU" },
  { code:"R31.9",   desc:"Hematuria, unspecified",                              cat:"GU" },
  { code:"M54.50",  desc:"Low back pain, unspecified",                          cat:"MSK" },
  { code:"M25.511", desc:"Pain in right shoulder",                              cat:"MSK" },
  { code:"M17.11",  desc:"Primary osteoarthritis, right knee",                  cat:"MSK" },
  { code:"S93.401A",desc:"Sprain of right ankle ligament, initial encounter",   cat:"Trauma" },
  { code:"S72.001A",desc:"Fracture of femoral neck, unspecified, initial",      cat:"Trauma" },
  { code:"S52.501A",desc:"Unspecified fracture lower end of radius, initial",   cat:"Trauma" },
  { code:"S01.00XA",desc:"Unspecified open wound of scalp, initial encounter",  cat:"Trauma" },
  { code:"T14.90",  desc:"Injury, unspecified",                                 cat:"Trauma" },
  { code:"L03.90",  desc:"Cellulitis, unspecified",                             cat:"Derm" },
  { code:"R21",     desc:"Rash and other nonspecific skin eruption",            cat:"Derm" },
  { code:"T78.2XXA",desc:"Anaphylactic shock, unspecified, initial encounter",  cat:"Allergy" },
  { code:"R50.9",   desc:"Fever, unspecified",                                  cat:"Infectious" },
  { code:"A41.9",   desc:"Sepsis, unspecified organism",                        cat:"Infectious" },
  { code:"A41.01",  desc:"Sepsis due to Methicillin-resistant Staphylococcus",  cat:"Infectious" },
  { code:"E11.65",  desc:"Type 2 diabetes mellitus with hyperglycemia",         cat:"Endocrine" },
  { code:"E16.0",   desc:"Drug-induced hypoglycemia without coma",              cat:"Endocrine" },
  { code:"E11.641", desc:"Type 2 DM with hypoglycemia with coma",               cat:"Endocrine" },
  { code:"R73.09",  desc:"Other abnormal glucose",                              cat:"Endocrine" },
  { code:"F10.20",  desc:"Alcohol use disorder, moderate, uncomplicated",       cat:"Tox" },
  { code:"T51.0X1A",desc:"Toxic effects of ethanol, accidental, initial",       cat:"Tox" },
  { code:"R57.9",   desc:"Shock, unspecified",                                  cat:"Critical" },
  { code:"R57.1",   desc:"Hypovolemic shock",                                   cat:"Critical" },
];

// ════════════════════════════════════════════════════════════
//  CPT DATABASE
// ════════════════════════════════════════════════════════════
const CPT_DB = [
  { code:"99281", desc:"ED visit — minimal severity, self-limited",              cat:"ED E&M",    rvu:0.80 },
  { code:"99282", desc:"ED visit — low to moderate severity",                    cat:"ED E&M",    rvu:1.48 },
  { code:"99283", desc:"ED visit — moderate severity",                           cat:"ED E&M",    rvu:2.60 },
  { code:"99284", desc:"ED visit — high severity, urgent evaluation required",   cat:"ED E&M",    rvu:4.00 },
  { code:"99285", desc:"ED visit — high severity, high complexity MDM",          cat:"ED E&M",    rvu:5.28 },
  { code:"99202", desc:"Office/outpatient, new pt — straightforward MDM",        cat:"Office",    rvu:1.60 },
  { code:"99203", desc:"Office/outpatient, new pt — low complexity MDM",         cat:"Office",    rvu:2.60 },
  { code:"99204", desc:"Office/outpatient, new pt — moderate complexity MDM",    cat:"Office",    rvu:3.82 },
  { code:"99205", desc:"Office/outpatient, new pt — high complexity MDM",        cat:"Office",    rvu:4.87 },
  { code:"99212", desc:"Office/outpatient, est pt — straightforward MDM",        cat:"Office",    rvu:1.30 },
  { code:"99213", desc:"Office/outpatient, est pt — low complexity MDM",         cat:"Office",    rvu:1.92 },
  { code:"99214", desc:"Office/outpatient, est pt — moderate complexity MDM",    cat:"Office",    rvu:2.92 },
  { code:"99215", desc:"Office/outpatient, est pt — high complexity MDM",        cat:"Office",    rvu:3.85 },
  { code:"99221", desc:"Initial hospital care — low complexity MDM",             cat:"Inpatient", rvu:2.65 },
  { code:"99222", desc:"Initial hospital care — moderate complexity MDM",        cat:"Inpatient", rvu:3.83 },
  { code:"99223", desc:"Initial hospital care — high complexity MDM",            cat:"Inpatient", rvu:5.25 },
  { code:"99231", desc:"Subsequent hospital care — low complexity MDM",          cat:"Inpatient", rvu:1.40 },
  { code:"99232", desc:"Subsequent hospital care — moderate complexity MDM",     cat:"Inpatient", rvu:2.26 },
  { code:"99233", desc:"Subsequent hospital care — high complexity MDM",         cat:"Inpatient", rvu:3.18 },
  { code:"10060", desc:"Incision & drainage of abscess, simple",                 cat:"Procedure", rvu:1.69 },
  { code:"10061", desc:"Incision & drainage of abscess, complicated",            cat:"Procedure", rvu:3.18 },
  { code:"12001", desc:"Simple repair of laceration ≤ 2.5 cm",                  cat:"Procedure", rvu:1.79 },
  { code:"12002", desc:"Simple repair of laceration 2.6–7.5 cm",                cat:"Procedure", rvu:2.09 },
  { code:"12011", desc:"Simple repair of face/ear/eyelid ≤ 2.5 cm",             cat:"Procedure", rvu:2.08 },
  { code:"20610", desc:"Arthrocentesis — large joint",                           cat:"Procedure", rvu:1.44 },
  { code:"29515", desc:"Application of short leg splint (static)",               cat:"Procedure", rvu:1.76 },
  { code:"29125", desc:"Application of short arm splint (static)",               cat:"Procedure", rvu:1.47 },
  { code:"36415", desc:"Collection of venous blood by venipuncture",             cat:"Procedure", rvu:0.17 },
  { code:"31500", desc:"Intubation, endotracheal, emergency procedure",          cat:"Procedure", rvu:2.91 },
  { code:"92950", desc:"Cardiopulmonary resuscitation (CPR)",                    cat:"Procedure", rvu:4.32 },
  { code:"71046", desc:"Radiologic exam, chest — 2 views",                       cat:"Imaging",   rvu:0.22 },
  { code:"70450", desc:"CT head/brain without contrast",                         cat:"Imaging",   rvu:0.87 },
  { code:"70553", desc:"MRI brain without contrast then with contrast",          cat:"Imaging",   rvu:1.52 },
  { code:"74177", desc:"CT abdomen and pelvis with contrast",                    cat:"Imaging",   rvu:1.29 },
  { code:"74178", desc:"CT abdomen and pelvis without then with contrast",       cat:"Imaging",   rvu:1.63 },
  { code:"73721", desc:"MRI joint lower extremity without contrast",             cat:"Imaging",   rvu:1.50 },
  { code:"93010", desc:"ECG, routine, 12+ leads — with interpretation",          cat:"Cardiac",   rvu:0.25 },
  { code:"93005", desc:"ECG, routine — tracing only, no interpretation",         cat:"Cardiac",   rvu:0.17 },
  { code:"94640", desc:"Pressurized or nonpressurized inhalation treatment",     cat:"Respiratory",rvu:0.35 },
  { code:"94002", desc:"Ventilator management, hospital inpatient, initiation",  cat:"Respiratory",rvu:0.97 },
];

// ════════════════════════════════════════════════════════════
//  E&M TABLE DATA
// ════════════════════════════════════════════════════════════
const EM_GROUPS = [
  { label:"Emergency Department",         accent:T.coral,    levels:[
    { code:"99281", lvl:"1", severity:"Minimal / self-limited",          mdm:"Straightforward",    time:"—" },
    { code:"99282", lvl:"2", severity:"Low to moderate",                  mdm:"Straightforward",    time:"—" },
    { code:"99283", lvl:"3", severity:"Moderate",                         mdm:"Low complexity",     time:"—" },
    { code:"99284", lvl:"4", severity:"High — urgent evaluation",         mdm:"Moderate complexity",time:"—" },
    { code:"99285", lvl:"5", severity:"High — threat to life/function",   mdm:"High complexity",    time:"—" },
  ]},
  { label:"Office — New Patient",         accent:T.teal,    levels:[
    { code:"99202", lvl:"2", severity:"Low",      mdm:"Straightforward",    time:"15–29 min" },
    { code:"99203", lvl:"3", severity:"Low",      mdm:"Low complexity",     time:"30–44 min" },
    { code:"99204", lvl:"4", severity:"Moderate", mdm:"Moderate complexity",time:"45–59 min" },
    { code:"99205", lvl:"5", severity:"High",     mdm:"High complexity",    time:"60–74 min" },
  ]},
  { label:"Office — Established Patient", accent:T.gold,    levels:[
    { code:"99211", lvl:"1", severity:"Minimal",  mdm:"N/A (nurse only)",   time:"≤ 10 min" },
    { code:"99212", lvl:"2", severity:"Low",      mdm:"Straightforward",    time:"10–19 min" },
    { code:"99213", lvl:"3", severity:"Low",      mdm:"Low complexity",     time:"20–29 min" },
    { code:"99214", lvl:"4", severity:"Moderate", mdm:"Moderate complexity",time:"30–39 min" },
    { code:"99215", lvl:"5", severity:"High",     mdm:"High complexity",    time:"40–54 min" },
  ]},
  { label:"Inpatient — Initial",           accent:T.blue,   levels:[
    { code:"99221", lvl:"1", severity:"Low",      mdm:"Straightforward / Low", time:"—" },
    { code:"99222", lvl:"2", severity:"Moderate", mdm:"Moderate complexity",   time:"—" },
    { code:"99223", lvl:"3", severity:"High",     mdm:"High complexity",        time:"—" },
  ]},
  { label:"Inpatient — Subsequent",        accent:"#b99bff", levels:[
    { code:"99231", lvl:"1", severity:"Stable / recovering",        mdm:"Straightforward / Low", time:"—" },
    { code:"99232", lvl:"2", severity:"Inadequate response",         mdm:"Moderate complexity",   time:"—" },
    { code:"99233", lvl:"3", severity:"Unstable / significant new",  mdm:"High complexity",        time:"—" },
  ]},
];

// ════════════════════════════════════════════════════════════
//  SHARED COMPONENTS  (from template)
// ════════════════════════════════════════════════════════════
function GlassBg() {
  const orbs = [
    { x:"9%",  y:"16%", r:300, c:`${AC}09` },
    { x:"87%", y:"11%", r:250, c:"rgba(155,109,255,0.05)" },
    { x:"79%", y:"79%", r:330, c:`${AC}07` },
    { x:"17%", y:"83%", r:210, c:"rgba(245,200,66,0.04)" },
    { x:"50%", y:"46%", r:390, c:"rgba(59,158,255,0.03)" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position:"absolute", left:o.x, top:o.y, width:o.r*2, height:o.r*2,
          borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)", animation:`hto${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.036 }}>
        <defs><pattern id="htg" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke={AC} strokeWidth="0.5"/>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#htg)"/>
      </svg>
      <style>{`
        @keyframes hto0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
        @keyframes hto1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes hto2{0%,100%{transform:translate(-50%,-50%) scale(0.95)}50%{transform:translate(-50%,-50%) scale(1.1)}}
        @keyframes htpulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(155,109,255,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(155,109,255,0)}}
        @keyframes ac-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:#2e4a6a}
        button{outline:none}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1a3555;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#2a4f7a}
      `}</style>
    </div>
  );
}

function GBox({ children, style = {}, glow = null }) {
  return (
    <div style={{
      background:"rgba(8,22,40,0.7)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
      border:`1px solid ${glow ? `${glow}30` : T.border}`, borderRadius:16,
      boxShadow: glow
        ? `0 4px 24px rgba(0,0,0,0.4),0 0 22px ${glow}14`
        : "0 4px 20px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function EvidenceBadge({ label, color }) {
  const presets = {
    "Level A":{ bg:"rgba(0,229,192,0.12)",  br:"rgba(0,229,192,0.4)",  c:"#00e5c0" },
    "Level B":{ bg:"rgba(59,158,255,0.12)", br:"rgba(59,158,255,0.4)", c:"#3b9eff" },
    "Level C":{ bg:"rgba(245,200,66,0.1)",  br:"rgba(245,200,66,0.4)", c:"#f5c842" },
  };
  const s = presets[label] || { bg:`${color||AC}18`, br:`${color||AC}45`, c:color||AC };
  return (
    <span style={{
      fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
      padding:"2px 7px", borderRadius:20,
      background:s.bg, border:`1px solid ${s.br}`, color:s.c, whiteSpace:"nowrap",
    }}>{label}</span>
  );
}

function SectionHeader({ icon, title, sub, badge }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${T.border}`,
    }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.txt }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.txt3, marginTop:1 }}>{sub}</div>}
      </div>
      <span style={{
        fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
        padding:"3px 10px", borderRadius:20, background:`${AC}12`, border:`1px solid ${AC}30`, color:AC,
      }}>{badge || "Guideline-Based"}</span>
    </div>
  );
}

function CodeRow({ item, accent, showRvu, onAdd }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${accent}08` : "rgba(14,37,68,0.5)",
        border:`1px solid ${hov ? `${accent}30` : T.border}`,
        borderRadius:9, padding:"9px 13px", marginBottom:5,
        backdropFilter:"blur(8px)", transition:"all .18s",
        display:"flex", alignItems:"center", gap:10,
      }}>
      <span style={{ fontSize:13, fontWeight:700, color:accent, fontFamily:"'JetBrains Mono',monospace", minWidth:74, flexShrink:0 }}>
        {item.code}
      </span>
      <span style={{ fontSize:12, color:T.txt2, flex:1, lineHeight:1.35 }}>{item.desc}</span>
      <div style={{ display:"flex", gap:5, alignItems:"center", flexShrink:0 }}>
        {item.cat && <EvidenceBadge label={item.cat} color={accent}/>}
        {showRvu && item.rvu && <EvidenceBadge label={`${item.rvu} RVU`} color={T.purple}/>}
      </div>
      <button onClick={() => onAdd(item)}
        style={{
          background: hov ? `${accent}20` : `${accent}10`,
          border:`1px solid ${accent}30`, borderRadius:7,
          color:accent, padding:"4px 13px", cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700,
          flexShrink:0, transition:"background .15s",
        }}>+ Add</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MODULE-LEVEL UI PRIMITIVES
// ════════════════════════════════════════════════════════════
function SearchInput({ value, onChange, placeholder, onKeyDown, accent }) {
  return (
    <div style={{ position:"relative", flex:1 }}>
      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:13, opacity:0.3 }}>🔍</span>
      <input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
        style={{
          width:"100%", background:"rgba(8,22,40,0.8)", border:`1px solid ${T.borderHi}`,
          borderRadius:11, padding:"10px 14px 10px 38px", color:T.txt,
          fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
          backdropFilter:"blur(14px)", transition:"border-color .2s",
        }}
        onFocus={e => e.target.style.borderColor=`${accent||AC}55`}
        onBlur={e  => e.target.style.borderColor=T.borderHi}/>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        background:"rgba(8,22,40,0.85)", border:`1px solid ${T.borderHi}`, borderRadius:10,
        padding:"10px 13px", color:T.txt3, fontFamily:"'DM Sans',sans-serif",
        fontSize:12, cursor:"pointer", outline:"none",
      }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FilterPill({ label, active, accent, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"7px 15px", borderRadius:24, fontSize:12, fontWeight:600,
      fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .2s",
      background: active ? `${accent}16` : "rgba(8,22,40,0.75)",
      border:`1px solid ${active ? `${accent}45` : "rgba(42,79,122,0.5)"}`,
      color: active ? accent : T.txt3, backdropFilter:"blur(12px)",
      boxShadow: active ? `0 0 12px ${accent}18` : "none",
    }}>{label}</button>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 20px" }}>
      <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>{msg}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function AutocoderHub() {
  const [nav, setNav]             = useState("icd10");
  const [toasts, setToasts]       = useState([]);
  const [cart, setCart]           = useState([]);
  const [icdQ, setIcdQ]           = useState("");
  const [icdCat, setIcdCat]       = useState("All");
  const [icdHits, setIcdHits]     = useState([]);
  const [aiCond, setAiCond]       = useState("");
  const [aiIcdBusy, setAiIcdBusy] = useState(false);
  const [aiIcdRecs, setAiIcdRecs] = useState([]);
  const [cptQ, setCptQ]           = useState("");
  const [cptCat, setCptCat]       = useState("All");
  const [cptHits, setCptHits]     = useState([]);
  const [emFilter, setEmFilter]   = useState("All");
  const [noteText, setNoteText]   = useState("");
  const [acBusy, setAcBusy]       = useState(false);
  const [acResult, setAcResult]   = useState(null);

  const toast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3400);
  }, []);

  useEffect(() => {
    if (!icdQ.trim()) { setIcdHits([]); return; }
    const q = icdQ.toLowerCase();
    setIcdHits(ICD10_DB.filter(r =>
      (r.code.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q)) &&
      (icdCat === "All" || r.cat === icdCat)
    ).slice(0, 16));
  }, [icdQ, icdCat]);

  useEffect(() => {
    if (!cptQ.trim()) { setCptHits([]); return; }
    const q = cptQ.toLowerCase();
    setCptHits(CPT_DB.filter(r =>
      (r.code.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q)) &&
      (cptCat === "All" || r.cat === cptCat)
    ).slice(0, 16));
  }, [cptQ, cptCat]);

  const addToCart = useCallback((item, type) => {
    if (cart.find(c => c.code === item.code)) { toast(`${item.code} already in cart`, "warn"); return; }
    setCart(p => [...p, { ...item, type }]);
    toast(`Added ${item.code}`, "success");
  }, [cart, toast]);

  const removeFromCart = (code) => setCart(p => p.filter(c => c.code !== code));

  const runAiIcd = async () => {
    if (!aiCond.trim() || aiIcdBusy) return;
    setAiIcdBusy(true); setAiIcdRecs([]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`You are a board-certified clinical documentation specialist. Return the 5 most appropriate ICD-10 codes for the described condition. Respond ONLY with a valid JSON array, no markdown. Format: [{"code":"I21.9","desc":"Acute myocardi..."Use when type/location not further specified"}]`,
          messages:[{ role:"user", content:`Clinical condition: ${aiCond}\nReturn top 5 ICD-10 codes as JSON array.` }]
        })
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "[]").replace(/```json|```/g,"").trim();
      setAiIcdRecs(JSON.parse(raw));
      toast("AI recommendations ready", "success");
    } catch { toast("AI query failed — check connection", "error"); }
    setAiIcdBusy(false);
  };

  const runAutocoder = async () => {
    if (!noteText.trim() || acBusy) return;
    setAcBusy(true); setAcResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1800,
          system:`You are an expert emergency medicine clinical coder (CPC-certified). Analyze the note and extract all billable codes. Respond ONLY with valid JSON, no markdown. Format:
{"summary":"One-sentence encounter summary","icd10":[{"code":"I21.9","desc":"Acute MI, unspecified","role":"principal"}],"cpt":[{"code":"99285","desc":"ED visit, high complexity","cat":"E&M"}],"em_level":{"code":"99285","level":"5","rationale":"High...notes":"Any important coding flags or guidance"}`,
          messages:[{ role:"user", content:`Clinical Note:\n${noteText}` }]
        })
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g,"").trim();
      setAcResult(JSON.parse(raw));
      toast("Autocoding complete", "success");
    } catch { toast("Autocoder failed — check note format", "error"); }
    setAcBusy(false);
  };

  const importAcToCart = () => {
    if (!acResult) return;
    const toAdd = [];
    (acResult.icd10||[]).forEach(r => {
      if (!cart.find(c => c.code === r.code) && !toAdd.find(c => c.code === r.code))
        toAdd.push({ ...r, type:"ICD-10" });
    });
    (acResult.cpt||[]).forEach(r => {
      if (!cart.find(c => c.code === r.code) && !toAdd.find(c => c.code === r.code))
        toAdd.push({ ...r, type:"CPT" });
    });
    if (toAdd.length > 0) setCart(p => [...p, ...toAdd]);
    toast(`Imported ${toAdd.length} code${toAdd.length !== 1 ? "s" : ""} to cart`, "success");
  };

  const icdCats = ["All", ...new Set(ICD10_DB.map(r => r.cat))];
  const cptCats = ["All", ...new Set(CPT_DB.map(r => r.cat))];
  const emLabels = ["All", ...EM_GROUPS.map(g => g.label)];

  // ════════════════════════════════════════════════════════════
  //  SECTION RENDERERS
  // ════════════════════════════════════════════════════════════
  const renderICD10 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"ac-fade .35s ease" }}>
      <GBox style={{ padding:"20px 22px" }}>
        <SectionHeader icon="🧬" title="ICD-10 Code Search" sub={`${ICD10_DB.length} codes — search by condition, symptom, or code`} badge="ICD-10-CM"/>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <SearchInput value={icdQ} onChange={e => setIcdQ(e.target.value)} placeholder="Search conditions, symptoms, or code…" accent={T.teal}/>
          <FilterSelect value={icdCat} onChange={setIcdCat} options={icdCats}/>
        </div>
        <div style={{ maxHeight:340, overflowY:"auto" }}>
          {icdHits.length > 0 ? icdHits.map(r => (
            <CodeRow key={r.code} item={r} accent={T.teal} onAdd={i => addToCart(i,"ICD-10")}/>
          )) : icdQ
            ? <EmptyState icon="🔍" msg={`No ICD-10 codes matched "${icdQ}"`}/>
            : <EmptyState icon="🧬" msg="Type a condition, symptom, or ICD-10 code above to search"/>}
        </div>
      </GBox>

      <GBox style={{ padding:"20px 22px" }} glow={T.teal}>
        <SectionHeader icon="✨" title="AI ICD-10 Recommender" sub="Describe the presentation in plain language — AI returns top 5 codes ranked by specificity" badge="AI-POWERED"/>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <SearchInput value={aiCond} onChange={e => setAiCond(e.target.value)}
            onKeyDown={e => e.key==="Enter" && runAiIcd()}
            placeholder="e.g. crushing substernal chest pain with diaphoresis radiating to left arm…" accent={T.teal}/>
          <button onClick={runAiIcd} disabled={aiIcdBusy||!aiCond.trim()}
            style={{
              background: aiIcdBusy ? "rgba(14,37,68,0.5)" : `linear-gradient(135deg,${T.teal},#0bb98e)`,
              border:`1px solid ${T.teal}40`, borderRadius:10,
              color: aiIcdBusy ? T.txt3 : "#050f1e", padding:"10px 18px",
              cursor: aiIcdBusy ? "not-allowed" : "pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
              whiteSpace:"nowrap", flexShrink:0,
            }}>
            {aiIcdBusy ? "⏳ Querying…" : "✨ Recommend"}
          </button>
        </div>
        {aiIcdRecs.length > 0 && aiIcdRecs.map((r, i) => (
          <div key={i} style={{
            background:`${T.teal}08`, border:`1px solid ${T.teal}25`, borderLeft:`3px solid ${T.teal}`,
            borderRadius:9, padding:"10px 13px", marginBottom:6, backdropFilter:"blur(8px)",
            animation:`ac-fade .3s ease ${i*0.05}s both`,
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:r.rationale?4:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:T.teal }}>{r.code}</span>
                <span style={{ fontSize:12, color:T.txt2 }}>{r.desc}</span>
                {r.specificity && <EvidenceBadge label={r.specificity} color={r.specificity==="High"?T.green:r.specificity==="Medium"?T.gold:T.txt3}/>}
              </div>
              <button onClick={() => addToCart(r,"ICD-10")} style={{
                background:`${T.teal}12`, border:`1px solid ${T.teal}35`, borderRadius:7,
                color:T.teal, padding:"3px 12px", cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, flexShrink:0, marginLeft:10,
              }}>+ Add</button>
            </div>
            {r.rationale && <div style={{ fontSize:10, color:T.txt4, fontStyle:"italic", lineHeight:1.4 }}>{r.rationale}</div>}
          </div>
        ))}
      </GBox>
    </div>
  );

  const renderCPT = () => (
    <div style={{ animation:"ac-fade .35s ease" }}>
      <GBox style={{ padding:"20px 22px" }}>
        <SectionHeader icon="🏥" title="CPT Code Search" sub={`${CPT_DB.length} codes — procedures, imaging, E&M with RVU values`} badge="CPT-4"/>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <SearchInput value={cptQ} onChange={e => setCptQ(e.target.value)} placeholder="Search procedures, imaging, or CPT code…" accent={T.gold}/>
          <FilterSelect value={cptCat} onChange={setCptCat} options={cptCats}/>
        </div>
        <div style={{ maxHeight:460, overflowY:"auto" }}>
          {cptHits.length > 0 ? cptHits.map(r => (
            <CodeRow key={r.code} item={r} accent={T.gold} onAdd={i => addToCart(i,"CPT")} showRvu/>
          )) : cptQ ? (
            <EmptyState icon="🔍" msg={`No CPT codes matched "${cptQ}"`}/>
          ) : (
            <div style={{ padding:"20px 0" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3, textAlign:"center", marginBottom:16 }}>
                Type a procedure name, or click a category to browse
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center" }}>
                {cptCats.filter(c => c!=="All").map(cat => (
                  <FilterPill key={cat} label={cat} active={false} accent={T.gold}
                    onClick={() => { setCptQ(cat); setCptCat(cat); }}/>
                ))}
              </div>
            </div>
          )}
        </div>
      </GBox>
    </div>
  );

  const renderEM = () => {
    const visible = emFilter==="All" ? EM_GROUPS : EM_GROUPS.filter(g => g.label===emFilter);
    return (
      <div style={{ animation:"ac-fade .35s ease" }}>
        <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
          {emLabels.map(lab => {
            const grp = EM_GROUPS.find(g => g.label===lab);
            return <FilterPill key={lab} label={lab==="All"?"All Categories":lab.split("—")[1]?.trim()||lab}
              active={emFilter===lab} accent={grp?.accent||AC} onClick={() => setEmFilter(lab)}/>;
          })}
        </div>
        {visible.map(grp => (
          <GBox key={grp.label} style={{ padding:"18px 20px", marginBottom:12, borderLeft:`3px solid ${grp.accent}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:grp.accent }}>{grp.label}</span>
              <EvidenceBadge label={`${grp.levels.length} LEVELS`} color={grp.accent}/>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    {["Code","Level","Problem Severity","Medical Decision Making","Typical Time"].map(h => (
                      <th key={h} style={{ padding:"7px 10px", textAlign:"left", color:T.txt3, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                    <th style={{ width:50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {grp.levels.map((lv, i) => (
                    <tr key={lv.code}
                      style={{ borderBottom:i<grp.levels.length-1?`1px solid ${T.border}`:"none", transition:"background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background=`${grp.accent}06`}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 10px" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:grp.accent }}>{lv.code}</span>
                      </td>
                      <td style={{ padding:"10px 10px" }}>
                        <EvidenceBadge label={`Lv ${lv.lvl}`} color={grp.accent}/>
                      </td>
                      <td style={{ padding:"10px 10px", color:T.txt, fontSize:12 }}>{lv.severity}</td>
                      <td style={{ padding:"10px 10px", color:T.txt2, fontSize:11 }}>{lv.mdm}</td>
                      <td style={{ padding:"10px 10px", color:T.txt3, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>{lv.time}</td>
                      <td style={{ padding:"10px 10px" }}>
                        <button onClick={() => addToCart({code:lv.code,desc:`${grp.label} — Level ${lv.lvl} (${lv.severity})`,cat:"E&M"},"CPT")}
                          style={{ background:`${grp.accent}10`, border:`1px solid ${grp.accent}30`, borderRadius:6, color:grp.accent, padding:"3px 11px", cursor:"pointer", fontSize:11, fontWeight:700 }}>+</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GBox>
        ))}
        <div style={{ marginTop:4, fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7, padding:"10px 14px", background:"rgba(5,15,30,0.55)", borderRadius:8, border:`1px solid ${T.border}` }}>
          ⚕ 2021 AMA MDM-based guidelines · Time-based billing requires total time documentation
        </div>
      </div>
    );
  };

  const renderAutocoder = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"ac-fade .35s ease" }}>
      <GBox style={{ padding:"20px 22px" }} glow={T.purple}>
        <SectionHeader icon="🤖" title="AI Autocoder" sub="Paste a clinical note — AI extracts all ICD-10 diagnoses, CPT procedures, and the correct E&M level" badge="AI-POWERED"/>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
          placeholder="Paste clinical note, HPI, assessment & plan, or procedure documentation here…" rows={8}
          style={{
            width:"100%", background:"rgba(5,15,30,0.75)", border:`1px solid ${T.purple}30`,
            borderRadius:10, padding:"13px 15px", color:T.txt,
            fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.65,
            resize:"vertical", outline:"none", boxSizing:"border-box", transition:"border-color .2s",
          }}
          onFocus={e => e.target.style.borderColor=`${T.purple}55`}
          onBlur={e  => e.target.style.borderColor=`${T.purple}30`}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4 }}>
            {noteText.length > 0 ? `${noteText.length} chars · ${noteText.trim().split(/\s+/).length} words` : "Paste note to begin"}
          </span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { setNoteText(""); setAcResult(null); }}
              style={{ background:"rgba(14,37,68,0.6)", border:`1px solid ${T.border}`, borderRadius:9, color:T.txt3, padding:"8px 16px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12 }}
              onMouseEnter={e => e.currentTarget.style.borderColor=T.borderHi}
              onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
              Clear
            </button>
            <button onClick={runAutocoder} disabled={acBusy||!noteText.trim()}
              style={{
                background: acBusy ? "rgba(14,37,68,0.5)" : `linear-gradient(135deg,${T.purple},#7c3aed)`,
                border:`1px solid ${T.purple}40`, borderRadius:9,
                color: acBusy ? T.txt3 : T.txt, padding:"8px 22px",
                cursor: acBusy ? "not-allowed" : "pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
              }}>
              {acBusy ? "⏳ Autocoding…" : "🤖 Run Autocoder"}
            </button>
          </div>
        </div>
      </GBox>

      {acResult && (
        <GBox style={{ padding:"20px 22px", animation:"ac-fade .4s ease" }}>
          {acResult.summary && (
            <div style={{ background:`${T.purple}0a`, border:`1px solid ${T.purple}25`, borderLeft:`3px solid ${T.purple}`, borderRadius:9, padding:"10px 14px", marginBottom:16 }}>
              <span style={{ fontSize:10, color:T.txt3 }}>Summary: </span>
              <span style={{ fontSize:13, color:T.txt2, lineHeight:1.5 }}>{acResult.summary}</span>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:14 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:T.teal }}>ICD-10 Diagnoses</span>
                <EvidenceBadge label={`${(acResult.icd10||[]).length}`} color={T.teal}/>
              </div>
              {(acResult.icd10||[]).map((r, i) => (
                <div key={i} style={{ background:"rgba(14,37,68,0.5)", border:`1px solid ${T.teal}22`, borderLeft:`2px solid ${T.teal}`, borderRadius:8, padding:"9px 12px", marginBottom:6, backdropFilter:"blur(8px)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.teal }}>{r.code}</span>
                    {r.role==="principal" && <EvidenceBadge label="Principal" color={T.coral}/>}
                    {r.role==="secondary" && <EvidenceBadge label="Secondary" color={T.txt3}/>}
                  </div>
                  <div style={{ fontSize:12, color:T.txt2, lineHeight:1.35 }}>{r.desc}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:T.gold }}>CPT / E&M Codes</span>
                <EvidenceBadge label={`${(acResult.cpt||[]).length}`} color={T.gold}/>
              </div>
              {(acResult.cpt||[]).map((r, i) => (
                <div key={i} style={{ background:"rgba(14,37,68,0.5)", border:`1px solid ${T.gold}22`, borderLeft:`2px solid ${T.gold}`, borderRadius:8, padding:"9px 12px", marginBottom:6, backdropFilter:"blur(8px)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.gold }}>{r.code}</span>
                    {r.cat && <EvidenceBadge label={r.cat} color={T.gold}/>}
                  </div>
                  <div style={{ fontSize:12, color:T.txt2, lineHeight:1.35 }}>{r.desc}</div>
                </div>
              ))}
              {acResult.em_level && (
                <div style={{ background:`${T.purple}0e`, border:`1px solid ${T.purple}30`, borderRadius:9, padding:"11px 13px", marginTop:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:T.purple }}>{acResult.em_level.code}</span>
                    {acResult.em_level.level && <EvidenceBadge label={`Level ${acResult.em_level.level}`} color={T.purple}/>}
                  </div>
                  {acResult.em_level.rationale && <div style={{ fontSize:11, color:T.txt3, fontStyle:"italic", lineHeight:1.4 }}>{acResult.em_level.rationale}</div>}
                </div>
              )}
            </div>
          </div>
          {acResult.coding_notes && (
            <div style={{ background:`${T.gold}09`, border:`1px solid ${T.gold}25`, borderLeft:`2px solid ${T.gold}`, borderRadius:8, padding:"9px 13px", marginBottom:14 }}>
              <span style={{ fontSize:10, color:T.gold, fontWeight:700, marginRight:7 }}>⚠ Coding Note:</span>
              <span style={{ fontSize:12, color:T.txt3 }}>{acResult.coding_notes}</span>
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>
              ⚕ Clinical decision support only — final decisions rest with the treating physician
            </span>
            <button onClick={importAcToCart}
              style={{ background:`linear-gradient(135deg,${T.purple},#7c3aed)`, border:`1px solid ${T.purple}40`, borderRadius:10, color:T.txt, padding:"9px 22px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700 }}>
              📦 Import All to Cart
            </button>
          </div>
        </GBox>
      )}
    </div>
  );

  const renderCart = () => (
    <div style={{ animation:"ac-fade .35s ease" }}>
      {cart.length===0 ? (
        <GBox style={{ padding:"60px 40px", textAlign:"center" }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🛒</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:T.txt2, marginBottom:6 }}>Your cart is empty</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>Search ICD-10 or CPT codes, browse E&M levels, or run the AI Autocoder</div>
        </GBox>
      ) : (
        <div>
          <GBox style={{ padding:"20px 22px", marginBottom:10 }}>
            <SectionHeader icon="📦" title="Code Cart" sub="Review collected codes for claim submission" badge={`${cart.length} CODES`}/>
            {["ICD-10","CPT"].map(type => {
              const items = cart.filter(c => c.type===type);
              if (!items.length) return null;
              const accent = type==="ICD-10" ? T.teal : T.gold;
              return (
                <div key={type} style={{ marginBottom:18 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:accent }}>{type} Codes</span>
                    <EvidenceBadge label={`${items.length}`} color={accent}/>
                  </div>
                  {items.map(item => (
                    <div key={item.code} style={{ background:"rgba(14,37,68,0.5)", border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 13px", marginBottom:5, backdropFilter:"blur(8px)", display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:accent, minWidth:74 }}>{item.code}</span>
                      <span style={{ fontSize:12, color:T.txt2, flex:1 }}>{item.desc}</span>
                      {item.cat && <EvidenceBadge label={item.cat} color={accent}/>}
                      {item.rvu && <EvidenceBadge label={`${item.rvu} RVU`} color={T.purple}/>}
                      <button onClick={() => removeFromCart(item.code)}
                        style={{ background:`${T.coral}0e`, border:`1px solid ${T.coral}30`, borderRadius:6, color:T.coral, padding:"3px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }}
                        onMouseEnter={e => e.currentTarget.style.background=`${T.coral}1a`}
                        onMouseLeave={e => e.currentTarget.style.background=`${T.coral}0e`}>✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </GBox>
          {cart.some(c => c.rvu) && (
            <div style={{ background:"rgba(8,22,40,0.7)", border:`1px solid ${T.border}`, borderRadius:10, padding:"11px 18px", marginBottom:10, display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(12px)" }}>
              <span style={{ fontSize:11, color:T.txt3 }}>Total wRVU (CPT)</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:T.purple }}>
                {cart.filter(c=>c.rvu).reduce((s,c)=>s+(c.rvu||0),0).toFixed(2)}
              </span>
              <span style={{ fontSize:10, color:T.txt4 }}>work RVUs</span>
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.txt4 }}>{cart.length} code{cart.length!==1?"s":""} collected</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { navigator.clipboard?.writeText(cart.map(c=>`${c.code}  ${c.desc}`).join("\n")); toast("Copied to clipboard","success"); }}
                style={{ background:"rgba(14,37,68,0.6)", border:`1px solid ${T.borderHi}`, borderRadius:9, color:T.txt2, padding:"8px 16px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12 }}
                onMouseEnter={e => { e.currentTarget.style.background=`${AC}12`; e.currentTarget.style.color=AC; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(14,37,68,0.6)"; e.currentTarget.style.color=T.txt2; }}>
                📋 Copy All
              </button>
              <button onClick={() => { setCart([]); toast("Cart cleared","info"); }}
                style={{ background:`${T.coral}0e`, border:`1px solid ${T.coral}35`, borderRadius:9, color:T.coral, padding:"8px 16px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12 }}
                onMouseEnter={e => e.currentTarget.style.background=`${T.coral}1a`}
                onMouseLeave={e => e.currentTarget.style.background=`${T.coral}0e`}>
                🗑 Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const NAV = [
    { id:"icd10",     icon:"🧬", label:"ICD-10",       accent:T.teal    },
    { id:"cpt",       icon:"🏥", label:"CPT Codes",    accent:T.gold    },
    { id:"em",        icon:"📋", label:"E&M Levels",   accent:T.blue    },
    { id:"autocoder", icon:"🤖", label:"AI Autocoder", accent:T.purple  },
    { id:"cart",      icon:"📦", label:"Code Cart",    accent:T.coral,  badge:cart.length||null },
  ];
  const SECTIONS = { icd10:renderICD10, cpt:renderCPT, em:renderEM, autocoder:renderAutocoder, cart:renderCart };
  const activeNav = NAV.find(n => n.id===nav);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <GlassBg/>

      {/* ── SIDEBAR ── */}
      <nav style={{
        width:220, minHeight:"100vh", position:"relative", zIndex:10, flexShrink:0,
        background:"rgba(5,15,30,0.92)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        borderRight:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column", padding:"80px 14px 24px 14px", gap:3,
        boxShadow:`4px 0 28px rgba(0,0,0,0.4),inset -1px 0 0 ${T.borderHi}`,
      }}>
        {/* Wordmark */}
        <div style={{ marginBottom:26, paddingLeft:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3 }}>
            <span style={{ fontSize:21 }}>⚕️</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:T.txt, letterSpacing:"-0.3px" }}>Notrya</span>
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:AC, letterSpacing:".16em", textTransform:"uppercase", paddingLeft:31 }}>Autocoder Hub</div>
        </div>

        {NAV.map(item => {
          const active = nav===item.id;
          return (
            <button key={item.id} onClick={() => setNav(item.id)}
              style={{
                display:"flex", alignItems:"center", gap:9, padding:"10px 12px", borderRadius:10,
                border:"none", width:"100%", cursor:"pointer", textAlign:"left",
                fontFamily:"'DM Sans',sans-serif", fontSize:13,
                fontWeight:active?600:400, transition:"all .2s", position:"relative",
                background:active?`${item.accent}16`:"transparent",
                color:active?item.accent:T.txt3,
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background="rgba(26,53,85,0.45)"; e.currentTarget.style.color=T.txt2; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.txt3; }}}>
              {active && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2.5, height:20, background:item.accent, borderRadius:"0 3px 3px 0" }}/>}
              <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background:item.accent, color:T.bg, borderRadius:10, minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, padding:"0 5px" }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ flex:1 }}/>

        {/* Cart tile */}
        <div style={{ padding:"12px 13px", borderRadius:10, background:"rgba(14,37,68,0.6)", border:`1px solid ${T.border}`, marginBottom:6 }}>
          <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:T.txt4, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>Cart</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:700, color:T.coral, lineHeight:1 }}>{cart.length}</div>
          <div style={{ fontSize:10, color:T.txt4, marginTop:3 }}>code{cart.length!==1?"s":""} selected</div>
        </div>

        {/* AI status */}
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 11px", borderRadius:8, background:"rgba(0,229,192,0.04)", border:`1px solid rgba(0,229,192,0.12)` }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, animation:"htpulse 2s ease-in-out infinite" }}/>
          <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>AI Ready</span>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, padding:"30px 36px 50px", overflowY:"auto", position:"relative", zIndex:1 }}>
        {/* Section label strip (from template) */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <div style={{ height:1, width:20, background:`${activeNav?.accent||AC}50`, borderRadius:1 }}/>
          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:activeNav?.accent||AC, textTransform:"uppercase", letterSpacing:".12em", fontWeight:700 }}>
            {activeNav?.label}
          </span>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${activeNav?.accent||AC}28,transparent)` }}/>
          <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>Notrya · Clinical Coding</span>
        </div>

        {(SECTIONS[nav]||(() => null))()}
      </main>

      {/* ── TOASTS ── */}
      <div style={{ position:"fixed", bottom:22, right:22, display:"flex", flexDirection:"column", gap:7, zIndex:200 }}>
        {toasts.map(t => {
          const color = t.type==="success"?T.green:t.type==="error"?T.coral:t.type==="warn"?T.gold:T.blue;
          return (
            <div key={t.id} style={{
              padding:"10px 18px", borderRadius:10,
              background:"rgba(5,15,30,0.92)", border:`1px solid ${color}40`,
              color, fontFamily:"'DM Sans',sans-serif", fontSize:13,
              backdropFilter:"blur(18px)", boxShadow:`0 4px 20px rgba(0,0,0,0.5),0 0 12px ${color}18`,
              animation:"ac-fade .25s ease", whiteSpace:"nowrap",
            }}>{t.msg}</div>
          );
        })}
      </div>
    </div>
  );
}