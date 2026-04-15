import { useState } from 'react';

// ── Font + CSS injection ───────────────────────────────────────────────────────
(() => {
  if (document.getElementById("notrya-home-fonts")) return;
  const l = document.createElement("link");
  l.id = "notrya-home-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = "notrya-home-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px}
    button{font-family:'DM Sans',sans-serif;outline:none;cursor:pointer}
    @keyframes nh-f1{0%,100%{transform:translate(0,0)}50%{transform:translate(55px,38px)}}
    @keyframes nh-f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-48px,55px)}}
    @keyframes nh-f3{0%,100%{transform:translate(0,0)}50%{transform:translate(38px,-48px)}}
    @keyframes nh-pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes nh-crit{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,0.5)}60%{box-shadow:0 0 0 5px rgba(255,107,107,0)}}
    .nh-pt-row{transition:background .14s}
    .nh-pt-row:hover{background:rgba(59,158,255,0.05)!important}
    .nh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(276px,1fr));gap:12px}
    .nh-tb-grid{display:grid;grid-template-columns:36px 52px 1fr 1fr 70px 130px 90px;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid rgba(26,53,85,0.35)}
    .nh-tb-hdr{display:grid;grid-template-columns:36px 52px 1fr 1fr 70px 130px 90px;gap:12px;padding:7px 16px;border-bottom:1px solid rgba(26,53,85,0.3);background:rgba(5,15,30,0.4)}
    @media(max-width:680px){
      .nh-tb-grid{grid-template-columns:28px 1fr 58px 76px;gap:8px;padding:10px 12px}
      .nh-tb-hdr{grid-template-columns:28px 1fr 58px 76px;gap:8px;padding:6px 12px}
      .nh-tb-room,.nh-tb-cc,.nh-tb-dots{display:none!important}
    }
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff", rose:"#f472b6",
};

// ── Hub groups ─────────────────────────────────────────────────────────────────
const GROUPS = [
  { label:"Critical Care", color:T.coral, hubs:[
    { id:"sepsis",    route:"/SepsisHub",        icon:"🦠", title:"Sepsis Hub",       badge:"SSC 2021",  color:T.coral,  desc:"Sepsis-3, qSOFA/SIRS, Hour-1 Bundle, source-based antibiotic tiers, AI resistance lookup.", features:["qSOFA / SIRS","Hour-1 Bundle","7 Source ABX Sets","AI Resistance Lookup"] },
    { id:"airway",    route:"/AirwayHub",         icon:"🌬️", title:"Airway Hub",        badge:"DAS 2022",  color:T.blue,   desc:"RSI weight-based dosing, DAS 2022 difficult airway algorithm, ARDSNet, HFNC/CPAP/BiPAP.", features:["RSI Drug Calculator","ARDSNet IBW / TV","ROX Index / RSBI","CICO Plan A–D"] },
    { id:"shock",     route:"/ShockHub",          icon:"⚡", title:"Shock Hub",         badge:"ACEP 2023", color:T.coral,  desc:"4 shock state profiles, vasopressor ladder with weight-based dosing, RUSH exam protocol.", features:["4 Shock States","Vasopressor Ladder","RUSH Protocol","Resuscitation Endpoints"] },
    { id:"resus",     route:"/resus-hub",         icon:"❤️", title:"Resus Hub",         badge:"ACLS·PALS", color:"#ff4444",desc:"Real-time code management. Rhythm-specific checklists. CPR 2-min cycle timer. Epinephrine dose tracker. Shock energy calculator. H's and T's. Post-ROSC checklist.", features:["VF / PEA / Asystole","CPR Timer","Epi Tracker","PALS Weight-Based"] },
    { id:"stroke",    route:"/stroke-hub",        icon:"🧠", title:"Stroke Hub",        badge:"AHA 2019",  color:T.purple, desc:"Door-to-needle timer with LKW onset window. Full AHA/ASA tPA inclusion/exclusion checklist. Alteplase 0.9 mg/kg dose calculator. BP management protocols. LVO criteria. NIHSS scoring.", features:["Door-to-Needle Timer","tPA Eligibility","Alteplase Dosing","NIHSS Scoring"] },
    { id:"triage",    route:"/triage-hub",        icon:"🏷️", title:"Triage Hub",        badge:"ESI v4",    color:T.gold,   desc:"ESI algorithm, pediatric triage adjustments, CTAS/JTS crosswalk.", features:["ESI Algorithm","Peds Adjustments","CTAS Crosswalk","Priority Flags"] },
  ]},
  { label:"Diagnostics", color:T.cyan, hubs:[
    { id:"ecg",       route:"/ecg-hub",           icon:"📈", title:"ECG Hub",           badge:"ACC/AHA",   color:T.cyan,   desc:"SVG waveform library, STEMI equivalents, QTc calculator, Sgarbossa criteria, 8-step reading.", features:["Waveform Library","STEMI Equivalents","QTc Calculator","Sgarbossa Criteria"] },
    { id:"labs",      route:"/lab-interpreter",   icon:"🧪", title:"Lab Interpreter",   badge:"AI·PASTE",  color:T.green,  desc:"Manual entry or paste-parse. Live flagging with critical thresholds. Calculated values (anion gap, P/F ratio, acid-base). AI interpretation with differential and action items.", features:["BMP / CBC / LFT / Coag","Anion Gap / P/F Ratio","Pattern Recognition","AI Interpretation"] },
    { id:"scores",    route:"/score-hub",         icon:"🧮", title:"Score Hub",         badge:"12 TOOLS",  color:T.blue,   desc:"Auto-populated from encounter. HEART, Wells PE/DVT, PERC, CURB-65, Ottawa Ankle/Knee, NEXUS C-spine, Canadian CT Head, GCS, ABCD2.", features:["HEART / Wells / PERC","Ottawa / NEXUS","CURB-65 / GCS","ABCD2 / Canadian CT"] },
    { id:"tox",       route:"/tox-hub",           icon:"☠️", title:"Tox Hub",           badge:"ANTIDOTES", color:T.coral,  desc:"16 antidotes with dosing. 10 ingestion protocols. Rumack-Matthew APAP nomogram. Toxidrome recognition table. Poison Control 1-800-222-1222.", features:["16 Antidotes","Rumack-Matthew","10 Protocols","Toxidromes"] },
    { id:"pocus",     route:"/pocus-hub",         icon:"🔊", title:"POCUS Hub",         badge:"BEDSIDE",   color:T.cyan,   desc:"Cardiac, lung, FAST, DVT, AAA, soft tissue — standard views, image gallery, clinical protocols.", features:["Cardiac / Lung","FAST / AAA","DVT Protocol","Soft Tissue"] },
    { id:"radiology", route:"/radiology-hub",     icon:"🩻", title:"Radiology Hub",     badge:"IMAGING",   color:T.txt3,   desc:"Plain film, CT, and MRI rapid reads for common ED presentations with findings and critical diagnoses.", features:["Plain Film","CT / MRI Reads","Critical Findings","ED Patterns"] },
  ]},
  { label:"Pharmacology & Specialty", color:T.green, hubs:[
    { id:"erx",       route:"/erx",               icon:"💊", title:"ERx Hub",           badge:"ACEP 2023", color:T.teal,   desc:"Emergency prescribing, renal dosing, IV-to-PO conversion, DDI checking, PDMP integration.", features:["Renal Dose Adjuster","IV → PO Converter","Drug Interactions","Beers Criteria"] },
    { id:"weightdose",route:"/weight-dose",        icon:"⚖️", title:"Weight Dose Hub",   badge:"30 DRUGS",  color:T.teal,   desc:"30 critical drugs. RSI induction and paralysis, vasopressors with live infusion rate calculator, reversal agents, sedation, resuscitation. PALS mode for weight < 40 kg.", features:["RSI / Vasopressors","Reversal Agents","Live Infusion Calc","PALS Mode"] },
    { id:"infectious",route:"/id-hub",             icon:"🦠", title:"Infectious Disease", badge:"IDSA 2024", color:T.green,  desc:"11 ID syndromes, empiric antibiotic selection, IV-to-PO guidance, de-escalation protocols.", features:["11 ID Syndromes","Empiric ABX","IV → PO Guidance","De-escalation"] },
    { id:"psych",     route:"/psyche-hub",         icon:"🧘", title:"Psych Hub",         badge:"LIVE",      color:T.rose,   desc:"Agitation escalation protocols, SI/HI risk scoring, CIWA-Ar, 9 intoxication syndromes.", features:["Agitation Protocol","SI / HI Risk Score","CIWA-Ar","9 Intox Syndromes"] },
    { id:"ob",        route:"/ob-hub",             icon:"🤱", title:"OB/GYN Hub",        badge:"OB·EM",     color:T.rose,   desc:"Pregnancy emergencies, ectopic, preeclampsia, eclampsia, perimortem C-section protocol.", features:["Ectopic / Preeclampsia","Eclampsia Tx","Perimortem C/S","Obstetric Emergencies"] },
  ]},
  { label:"Procedures & Operations", color:T.orange, hubs:[
    { id:"procedure", route:"/procedure-hub",      icon:"🔧", title:"Procedure Hub",    badge:"CPT CODES", color:T.orange, desc:"Procedure note templates with CPT coding, consent guidance, and step-by-step technique.", features:["Procedure Notes","CPT Codes","Consent Templates","Step-by-Step"] },
    { id:"ortho",     route:"/ortho-hub",          icon:"🦴", title:"Ortho Hub",        badge:"FRACTURES", color:T.gold,   desc:"Fracture identification, reduction techniques, splinting references, Ottawa rules integrated.", features:["Fracture ID","Reduction Technique","Splinting Ref","Ottawa Rules"] },
    { id:"wound",     route:"/wound-hub",          icon:"🩹", title:"Wound Hub",        badge:"CLOSURE",   color:T.orange, desc:"Laceration management, closure type selection, suture sizing, wound care instructions.", features:["Closure Selection","Suture Sizing","Wound Care","Irrigation"] },
    { id:"surgical",  route:"/surgical-airway-hub",icon:"✂️", title:"Surgical Airway",  badge:"CRIC",      color:T.red,    desc:"Cricothyrotomy — rapid and surgical technique with landmark identification and equipment checklist.", features:["Rapid Cric Technique","Surgical Technique","Landmark Guide","Equipment List"] },
    { id:"rapid",     route:"/rapid-assessment-hub",icon:"⚡", title:"Rapid Assessment",badge:"ED FLOW",   color:T.gold,   desc:"Chief complaint-based rapid assessment protocols — streamlined H&P for high-volume ED situations.", features:["CC-Based Protocols","Rapid H&P","High-Volume Workflow","Disposition Logic"] },
  ]},
  { label:"Tools & Reference", color:T.purple, hubs:[
    { id:"knowledge", route:"/KnowledgeBaseV2",   icon:"📖", title:"Knowledge Base",   badge:"AI-POWERED",color:T.purple, desc:"17 guidelines, 20 landmark trials, AI-powered evidence summaries, drug monographs, NNT/NNH.", features:["17 Guidelines","20 Landmark Trials","AI Summaries","NNT / NNH Data"] },
    { id:"autocoder", route:"/AutocoderHub",      icon:"🏷️", title:"Autocoder Hub",    badge:"AI-POWERED",color:T.purple, desc:"AI-powered ICD-10/CPT coding, E&M level calculator, code cart, transmit-ready summaries.", features:["ICD-10 / CPT","E&M Calculator","Code Cart","AI Autocoder"] },
    { id:"discharge", route:"/discharge-hub",     icon:"🚪", title:"Discharge Hub",    badge:"AI-POWERED",color:T.gold,   desc:"AI-generated discharge instructions tailored to diagnosis, medications, and follow-up plan.", features:["AI Instructions","Diagnosis-Specific","Med Reconciliation","Print-Ready"] },
    { id:"consult",   route:"/consult-hub",       icon:"👥", title:"Consult Hub",      badge:"SPECIALTIES",color:T.blue,  desc:"Specialty-specific consult preparation, question framing, and expected recommendations by service.", features:["Consult Prep","Specialty Scripts","Question Framing","Key Data Points"] },
    { id:"trauma",    route:"/trauma-hub",        icon:"🚨", title:"Trauma Hub",       badge:"ATLS",      color:T.coral,  desc:"ATLS primary/secondary survey, massive transfusion protocol, trauma scoring, penetrating vs blunt.", features:["Primary Survey","MTP Protocol","Trauma Scoring","Blunt vs Penetrating"] },
    { id:"cardiac",   route:"/cardiac-hub",       icon:"🫀", title:"Cardiac Hub",      badge:"ACS·CHF",   color:"#ff4444",desc:"ACS workup, STEMI pathways, CHF management, cardiac arrest algorithms, pacing indications.", features:["ACS / STEMI","CHF Management","Cardiac Arrest","Pacing Indications"] },
  ]},
];

// ── Chart completion helper ────────────────────────────────────────────────────
// chartStatus shape: { triage, demo, vitals, ros, pe, chart } — all booleans
const PHASES = ['triage','demo','vitals','ros','pe','chart'];
const PHASE_LABELS = ['T','D','V','R','P','M'];

function getAction(status) {
  const done = PHASES.filter(p => status?.[p]).length;
  if (done === 0)            return { label:"Open →",   color:T.blue   };
  if (done === PHASES.length)return { label:"Sign →",   color:T.gold   };
  return                           { label:"Resume →",  color:T.teal   };
}

function esiColor(level) {
  if (level <= 2) return T.coral;
  if (level === 3) return T.orange;
  return T.teal;
}

// ── Door time helpers ─────────────────────────────────────────────────────────
// Accepts strings like "47m", "1h 22m", "2h 05m", "90m", "1:22"
function parseDoorMinutes(str) {
  if (!str) return 0;
  const hMatch = str.match(/(\d+)h/);
  const mMatch = str.match(/(\d+)m/);
  const colonMatch = str.match(/^(\d+):(\d+)$/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  let mins = 0;
  if (hMatch) mins += parseInt(hMatch[1]) * 60;
  if (mMatch) mins += parseInt(mMatch[1]);
  return mins || parseInt(str) || 0;
}

function doorTimeColor(doorTime) {
  const m = parseDoorMinutes(doorTime);
  if (m >= 120) return T.coral;
  if (m >= 60)  return T.orange;
  return T.txt4;
}

function doorTimeWeight(doorTime) {
  return parseDoorMinutes(doorTime) >= 60 ? 700 : 400;
}

// ── Background mesh ───────────────────────────────────────────────────────────
function BgMesh() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", top:-150, left:-80,  background:"radial-gradient(circle,rgba(0,229,192,0.04) 0%,transparent 70%)",   animation:"nh-f1 18s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", top:"40%", right:-120, background:"radial-gradient(circle,rgba(59,158,255,0.035) 0%,transparent 70%)", animation:"nh-f2 22s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:420, height:420, borderRadius:"50%", bottom:-80, left:"38%", background:"radial-gradient(circle,rgba(155,109,255,0.03) 0%,transparent 70%)",  animation:"nh-f3 26s ease-in-out infinite" }} />
    </div>
  );
}

// ── ESI badge ─────────────────────────────────────────────────────────────────
function ESIBadge({ level }) {
  const col = esiColor(level);
  const critical = level <= 2;
  return (
    <div style={{ width:28, height:28, borderRadius:7, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:col + "18", border:`1px solid ${col}45`, animation: critical ? "nh-crit 1.6s ease-out infinite" : "none" }}>
      <span style={{ fontSize:12, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:col }}>{level}</span>
    </div>
  );
}

// ── Chart status dots ─────────────────────────────────────────────────────────
function StatusDots({ status }) {
  const done = PHASES.filter(p => status?.[p]).length;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      {PHASES.map((p, i) => {
        const complete = status?.[p];
        return (
          <div key={p} title={p.charAt(0).toUpperCase() + p.slice(1)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <span style={{ fontSize:7, fontFamily:"'JetBrains Mono',monospace", color:complete ? T.teal : T.txt4, lineHeight:1 }}>{PHASE_LABELS[i]}</span>
            <div style={{ width:7, height:7, borderRadius:"50%", background:complete ? T.teal : "transparent", border:`1px solid ${complete ? T.teal + "80" : "rgba(42,79,122,0.5)"}`, transition:"all .2s" }} />
          </div>
        );
      })}
      <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:T.txt4, marginLeft:4 }}>{done}/{PHASES.length}</span>
    </div>
  );
}

// ── Patient row ───────────────────────────────────────────────────────────────
function PatientRow({ patient }) {
  const action   = getAction(patient.chartStatus);
  const dtColor  = doorTimeColor(patient.doorTime);
  const dtWeight = doorTimeWeight(patient.doorTime);
  return (
    <div className="nh-pt-row nh-tb-grid">
      <ESIBadge level={patient.esiLevel} />
      <span className="nh-tb-room" style={{ fontSize:11, fontWeight:600, color:T.txt2, fontFamily:"'JetBrains Mono',monospace" }}>{patient.room || "—"}</span>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:T.txt, lineHeight:1.2 }}>{patient.name}</div>
        <div style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>{patient.age}y {patient.sex}</div>
      </div>
      <span className="nh-tb-cc" style={{ fontSize:11, color:T.txt3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{patient.cc}</span>
      <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:dtColor, fontWeight:dtWeight }}>{patient.doorTime}</span>
      <div className="nh-tb-dots"><StatusDots status={patient.chartStatus} /></div>
      <button
        onClick={() => { window.location.href = "/NewPatientInput"; }}
        style={{ padding:"5px 0", borderRadius:7, border:`1px solid ${action.color}40`, background:action.color + "12", color:action.color, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", transition:"all .16s", width:"100%" }}
        onMouseEnter={e => { e.currentTarget.style.background = action.color + "25"; }}
        onMouseLeave={e => { e.currentTarget.style.background = action.color + "12"; }}>
        {action.label}
      </button>
    </div>
  );
}

// ── Track board ───────────────────────────────────────────────────────────────
function TrackBoard({ patients }) {
  const hasPatients = patients && patients.length > 0;

  // Fix 3: incomplete = started but not signed
  const incomplete = hasPatients
    ? patients.filter(pt => {
        const done = PHASES.filter(p => pt.chartStatus?.[p]).length;
        return done > 0 && done < PHASES.length;
      }).length
    : 0;

  return (
    <div style={{ background:"rgba(8,16,32,0.72)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(26,53,85,0.6)", borderTop:`2px solid ${T.blue}55`, borderRadius:14, overflow:"hidden", marginBottom:12 }}>

      {/* header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px", borderBottom:"1px solid rgba(26,53,85,0.45)", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background: hasPatients ? T.teal : T.txt4, animation: hasPatients ? "nh-pulse 2.5s infinite" : "none" }} />
          <span style={{ fontSize:11, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>
            Active Patients
          </span>
          {hasPatients && (
            <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", padding:"1px 7px", borderRadius:20, background:T.teal + "14", border:`1px solid ${T.teal}30`, color:T.teal }}>
              {patients.length}
            </span>
          )}
          {/* Fix 3: incomplete charts badge */}
          {incomplete > 0 && (
            <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", padding:"1px 7px", borderRadius:20, background:T.orange + "14", border:`1px solid ${T.orange}35`, color:T.orange }}>
              {incomplete} incomplete
            </span>
          )}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <button
            onClick={() => { window.location.href = "/EDTrackingBoard"; }}
            style={{ fontSize:10, color:T.txt4, background:"transparent", border:"1px solid rgba(26,53,85,0.5)", borderRadius:6, padding:"4px 11px", transition:"all .14s" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.txt2; e.currentTarget.style.borderColor = "rgba(42,79,122,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.txt4; e.currentTarget.style.borderColor = "rgba(26,53,85,0.5)"; }}>
            Full Track Board →
          </button>
          <button
            onClick={() => { window.location.href = "/NewPatientInput"; }}
            style={{ fontSize:10, fontWeight:700, color:"#050f1e", background:"linear-gradient(135deg,#00e5c0,#3b9eff)", border:"none", borderRadius:7, padding:"5px 14px", boxShadow:"0 2px 12px rgba(0,229,192,0.2)" }}>
            + New Patient
          </button>
        </div>
      </div>

      {/* column headers — match PatientRow CSS classes for responsive hiding */}
      {hasPatients && (
        <div className="nh-tb-hdr">
          <span style={{ fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", fontFamily:"'JetBrains Mono',monospace" }}>ESI</span>
          <span className="nh-tb-room" style={{ fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", fontFamily:"'JetBrains Mono',monospace" }}>Room</span>
          <span style={{ fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", fontFamily:"'JetBrains Mono',monospace" }}>Patient</span>
          <span className="nh-tb-cc" style={{ fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", fontFamily:"'JetBrains Mono',monospace" }}>Chief Complaint</span>
          <span style={{ fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", fontFamily:"'JetBrains Mono',monospace" }}>Time</span>
          <span className="nh-tb-dots" style={{ fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", fontFamily:"'JetBrains Mono',monospace" }}>Chart Status</span>
          <span style={{ fontSize:8 }} />
        </div>
      )}

      {/* rows or empty state */}
      {hasPatients ? (
        patients.map(pt => <PatientRow key={pt.id} patient={pt} />)
      ) : (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"44px 24px", gap:12 }}>
          <div style={{ fontSize:32, opacity:.3 }}>🏥</div>
          <div style={{ fontSize:13, fontWeight:600, color:T.txt4, fontFamily:"'Playfair Display',serif" }}>Department clear</div>
          <div style={{ fontSize:11, color:T.txt4 }}>No active patients this session</div>
          <button
            onClick={() => { window.location.href = "/NewPatientInput"; }}
            style={{ marginTop:8, padding:"10px 24px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#00e5c0,#3b9eff)", color:"#050f1e", fontWeight:700, fontSize:12, boxShadow:"0 4px 18px rgba(0,229,192,0.22)", transition:"all .16s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,229,192,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,229,192,0.22)"; }}>
            📋 Start New Patient
          </button>
        </div>
      )}
    </div>
  );
}

// ── Hub card ──────────────────────────────────────────────────────────────────
function HubCard({ hub }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => { window.location.href = hub.route; }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   hov ? hub.color + "16" : hub.color + "09",
        border:       `1px solid ${hov ? hub.color + "50" : hub.color + "22"}`,
        borderRadius: 13, padding:"15px 17px",
        transition:   "all .18s cubic-bezier(.4,0,.2,1)",
        transform:    hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow:    hov ? `0 8px 28px ${hub.color}12` : "none",
        display:"flex", flexDirection:"column", gap:10, cursor:"pointer",
      }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:9, flexShrink:0, background:hub.color + "14", border:`1px solid ${hub.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19 }}>
          {hub.icon}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif", lineHeight:1.25, marginBottom:3 }}>{hub.title}</div>
          <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"1px 7px", borderRadius:20, background:hub.color + "14", border:`1px solid ${hub.color}28`, color:hub.color, letterSpacing:".04em" }}>{hub.badge}</span>
        </div>
      </div>
      <div style={{ fontSize:11, color:T.txt3, lineHeight:1.6 }}>{hub.desc}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3px 8px" }}>
        {hub.features.map((f, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:9.5, color:T.txt4 }}>
            <div style={{ width:3, height:3, borderRadius:"50%", background:hub.color, flexShrink:0 }} />
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Group section ─────────────────────────────────────────────────────────────
function GroupSection({ group }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:13 }}>
        <div style={{ width:3, height:14, borderRadius:2, background:group.color, flexShrink:0 }} />
        <span style={{ fontSize:9, fontWeight:700, color:group.color, textTransform:"uppercase", letterSpacing:".1em", fontFamily:"'JetBrains Mono',monospace" }}>{group.label}</span>
        <div style={{ height:1, flex:1, background:group.color + "18" }} />
        <span style={{ fontSize:8, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>{group.hubs.length} {group.hubs.length === 1 ? "hub" : "hubs"}</span>
      </div>
      <div className="nh-grid">
        {group.hubs.map(hub => <HubCard key={hub.id} hub={hub} />)}
      </div>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
// patients prop — array of patient objects with shape:
//   { id, room, name, age, sex, cc, esiLevel, doorTime, urgent?,
//     chartStatus: { triage, demo, vitals, ros, pe, chart } }
// Pass from Base44 context or track board state when available.
export default function NotryaHome({ patients = [] }) {
  // Notrya Home — ED command center with track board and clinical hub grid
  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <BgMesh />
      <div style={{ position:"relative", zIndex:1, padding:"24px 28px 48px", maxWidth:1400, margin:"0 auto" }}>

        {/* ── Brand row ─────────────────────────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
          <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#3b9eff,#00e5c0)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, fontFamily:"'Playfair Display',serif", color:"#050f1e", flexShrink:0 }}>N</div>
          <span style={{ fontSize:12, fontWeight:700, color:T.txt3, fontFamily:"'Playfair Display',serif" }}>Notrya</span>
          <span style={{ fontSize:9, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>Emergency Medicine</span>
        </div>

        {/* ── Track board — PRIMARY ──────────────────────────────────────────── */}
        <TrackBoard patients={patients} />

        {/* ── Clinical hubs — SECONDARY ─────────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"24px 0 18px" }}>
          <div style={{ height:1, flex:1, background:"rgba(26,53,85,0.5)" }} />
          <span style={{ fontSize:9, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".1em", fontFamily:"'JetBrains Mono',monospace" }}>Clinical Hubs</span>
          <div style={{ height:1, flex:1, background:"rgba(26,53,85,0.5)" }} />
        </div>

        {GROUPS.map(g => <GroupSection key={g.label} group={g} />)}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{ borderTop:"1px solid rgba(26,53,85,0.4)", paddingTop:14, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <span style={{ fontSize:10, fontWeight:700, color:T.txt4, fontFamily:"'Playfair Display',serif" }}>Notrya</span>
          <span style={{ fontSize:9, color:T.txt4 }}>Clinical decision support only — not a substitute for clinical judgment. Powered by Claude (Anthropic).</span>
        </div>

      </div>
    </div>
  );
}