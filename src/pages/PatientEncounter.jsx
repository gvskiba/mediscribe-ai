import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const Patient = base44.entities.Patient;

(() => {
  if (document.getElementById("pe-fonts")) return;
  const l = document.createElement("link");
  l.id = "pe-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "pe-css";
  s.textContent = `
    @keyframes pe-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .pe-fade{animation:pe-fade .18s ease forwards}
    @keyframes pe-spin{to{transform:rotate(360deg)}}
    .pe-spin{animation:pe-spin 1s linear infinite}
  `;
  document.head.appendChild(s);
})();

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",
  txt:"#f2f7ff",txt2:"#b8d4f0",txt3:"#82aece",txt4:"#5a82a8",
  teal:"#00e5c0",gold:"#f5c842",coral:"#ff6b6b",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",red:"#ff4444",cyan:"#00d4ff",
};

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
// Replace with navigateTo(page) in Base44
const nav = (page, params = {}) => { console.log("nav ->", page, params); };

// ─── SUGGEST HUBS BY CHIEF COMPLAINT ─────────────────────────────────────────
const suggestHubs = (cc = "") => {
  const c = cc.toLowerCase();
  if (c.includes("chest pain") || c.includes("chest"))
    return ["ECGHub","CardiacRiskPage","LabInterpreter","OrderGeneratorHub"];
  if (c.includes("stroke") || c.includes("tpa") || c.includes("neuro"))
    return ["StrokeHub","ImagingInterpreter","CardiacRiskPage"];
  if (c.includes("overdose") || c.includes("opioid") || c.includes("tox") || c.includes("ingestion"))
    return ["ToxicologyHub","AirwayHub","OrderGeneratorHub"];
  if (c.includes("shortness") || c.includes("sob") || c.includes("breath") || c.includes("respiratory"))
    return ["ECGHub","POCUSHub","LabInterpreter","ImagingInterpreter"];
  if (c.includes("sepsis") || c.includes("fever") || c.includes("infection") || c.includes("uti"))
    return ["SepsisHub","LabInterpreter","OrderGeneratorHub"];
  if (c.includes("rash") || c.includes("derm") || c.includes("skin"))
    return ["DermatologyHub","DermMorphologyRef","LabInterpreter"];
  if (c.includes("abdominal") || c.includes("abd") || c.includes("belly"))
    return ["POCUSHub","LabInterpreter","ImagingInterpreter"];
  if (c.includes("altered") || c.includes("ams") || c.includes("confusion") || c.includes("mental"))
    return ["ToxicologyHub","LabInterpreter","ImagingInterpreter"];
  if (c.includes("weakness") || c.includes("electrolyte") || c.includes("k+") || c.includes("potassium"))
    return ["ElectrolyteHub","ECGHub","LabInterpreter"];
  if (c.includes("trauma") || c.includes("fracture") || c.includes("ortho") || c.includes("fall"))
    return ["ImagingInterpreter","OrderGeneratorHub"];
  if (c.includes("cardiac") || c.includes("heart") || c.includes("arrest"))
    return ["ECGHub","CardiacRiskPage","OrderGeneratorHub"];
  if (c.includes("airway") || c.includes("intub") || c.includes("rsi"))
    return ["AirwayHub","OrderGeneratorHub"];
  return ["LabInterpreter","ECGHub","OrderGeneratorHub"];
};

// ─── HUB REGISTRY ─────────────────────────────────────────────────────────────
const HUBS = {
  ECGHub:             { label:"ECG Hub",         icon:"⚡", color:T.teal   },
  CardiacRiskPage:    { label:"Cardiac Risk",    icon:"🫀", color:T.coral  },
  StrokeHub:          { label:"Stroke Hub",      icon:"🧠", color:T.purple },
  ToxicologyHub:      { label:"Toxicology",      icon:"☣️", color:T.orange },
  SepsisHub:          { label:"Sepsis Hub",      icon:"🔬", color:T.coral  },
  AirwayHub:          { label:"Airway Hub",      icon:"💨", color:T.teal   },
  LabInterpreter:     { label:"Lab Interpreter", icon:"🧪", color:T.teal   },
  ImagingInterpreter: { label:"Imaging",         icon:"🩻", color:T.gold   },
  DermatologyHub:     { label:"Derm Hub",        icon:"🔎", color:T.purple },
  DermMorphologyRef:  { label:"Derm Ref",        icon:"📖", color:T.purple },
  POCUSHub:           { label:"POCUS Hub",       icon:"📡", color:T.teal   },
  OrderGeneratorHub:  { label:"Orders",          icon:"📋", color:T.gold   },
  ElectrolyteHub:     { label:"Electrolytes",    icon:"⚗️", color:T.cyan   },
  OrthoHub:           { label:"Ortho Hub",       icon:"🦴", color:T.gold   },
  ERxHub:             { label:"ERx Hub",         icon:"💊", color:T.blue   },
  ShockHub:           { label:"Shock Hub",       icon:"⚡", color:T.red    },
  PsychHub:           { label:"Psych Hub",       icon:"🧩", color:T.purple },
};

const HUB_DOMAINS = [
  { domain:"Cardiac & Vascular", color:T.coral,  hubs:["ECGHub","CardiacRiskPage","ShockHub"]             },
  { domain:"Neuro & Psych",      color:T.purple, hubs:["StrokeHub","PsychHub"]                            },
  { domain:"Critical Care",      color:T.orange, hubs:["SepsisHub","AirwayHub","ToxicologyHub"]            },
  { domain:"Diagnostics",        color:T.teal,   hubs:["LabInterpreter","ImagingInterpreter","POCUSHub","ElectrolyteHub"] },
  { domain:"Subspecialty",       color:T.gold,   hubs:["DermatologyHub","DermMorphologyRef","OrthoHub"]   },
  { domain:"Orders & Rx",        color:T.blue,   hubs:["OrderGeneratorHub","ERxHub"]                      },
];



// ─── HELPERS ──────────────────────────────────────────────────────────────────
const esiColor = (n) => ({1:T.red,2:T.orange,3:T.gold,4:T.green,5:T.txt4}[n]||T.txt4);
const fmtTime  = (m) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
const gc       = (x={}) => ({ background:T.card, border:"1px solid rgba(26,53,85,0.5)", borderRadius:10, ...x });

const vitalColor = (k, v) => {
  const n = parseFloat(v);
  if (k==="spo2") return n<90?T.red:n<94?T.gold:T.teal;
  if (k==="hr")   return (n<50||n>120)?T.red:(n<60||n>100)?T.gold:T.teal;
  if (k==="rr")   return (n<8||n>24)?T.red:(n<12||n>20)?T.gold:T.teal;
  return T.teal;
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Btn({ children, accent, onClick, sm, full }) {
  return (
    <button onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      fontFamily:"'DM Sans',sans-serif",
      fontSize:sm?11:12, fontWeight:600, color:accent,
      background:`linear-gradient(135deg,${accent}22,${accent}0a)`,
      border:`1px solid ${accent}55`,
      borderRadius:8, padding:sm?"4px 10px":"7px 15px",
      cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap",
      width:full?"100%":"auto",
    }}>
      {children}
    </button>
  );
}

function EsiBadge({ esi }) {
  const c = esiColor(esi);
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:c, background:`${c}18`, border:`1px solid ${c}45`, borderRadius:5, padding:"2px 7px", whiteSpace:"nowrap" }}>
      ESI {esi}
    </span>
  );
}

function VitalChip({ label, value, colorKey }) {
  const c = colorKey ? vitalColor(colorKey, value) : T.teal;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:44 }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:700, color:c, lineHeight:1 }}>{value}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.09em" }}>{label}</span>
    </div>
  );
}

function AlertBubble({ t, m }) {
  const cfg = {
    critical:{ color:T.red,  bg:"rgba(255,68,68,0.1)",   border:"rgba(255,68,68,0.35)",  icon:"🚨" },
    warn:    { color:T.gold, bg:"rgba(245,200,66,0.08)", border:"rgba(245,200,66,0.3)",  icon:"⚠️" },
    info:    { color:T.blue, bg:"rgba(59,158,255,0.08)", border:"rgba(59,158,255,0.3)",  icon:"ℹ️" },
  }[t]||{ color:T.txt4, bg:"rgba(26,53,85,0.2)", border:"rgba(26,53,85,0.4)", icon:"·" };
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", background:cfg.bg, border:`1px solid ${cfg.border}`, borderLeft:`3px solid ${cfg.color}`, borderRadius:8, padding:"8px 11px" }}>
      <span style={{ fontSize:12, marginTop:1, flexShrink:0 }}>{cfg.icon}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.55 }}>{m}</span>
    </div>
  );
}

// ─── TOP CONTEXT BAR ──────────────────────────────────────────────────────────
function TopContextBar({ patient, onDischarge }) {
  const p = patient;
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 20px", height:52, minHeight:52, flexShrink:0,
      background:T.panel, borderBottom:"1px solid rgba(26,53,85,0.5)",
    }}>
      {/* Left */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button
          onClick={() => nav("CommandCenter")}
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4, background:"transparent", border:"1px solid rgba(26,53,85,0.5)", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}
        >
          ← Census
        </button>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:5, padding:"2px 8px" }}>{p.room}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.txt }}>{p.name}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt3 }}>{p.age}yo {p.sex==="M"?"M":"F"}</span>
        <span style={{ color:T.txt4 }}>·</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.gold }}>{p.cc}</span>
        <EsiBadge esi={p.esi} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:p.mins>120?T.red:p.mins>60?T.gold:T.txt4 }}>
          {fmtTime(p.mins)}
        </span>
      </div>
      {/* Right */}
      <div style={{ display:"flex", gap:8 }}>
        <Btn accent={T.teal} sm onClick={() => nav("QuickNote", { patientId:p.id })}>✏️ Quick Note</Btn>
        <Btn accent={T.gold} sm onClick={() => nav("OrderGeneratorHub", { patientId:p.id })}>📋 Orders</Btn>
        <Btn accent={T.green} sm onClick={onDischarge}>🏥 Discharge</Btn>
      </div>
    </div>
  );
}

// ─── DOCUMENTATION LANE (LEFT) ────────────────────────────────────────────────
const DOC_STEPS = [
  { key:"QuickNote",          icon:"✏️", label:"Quick Note",   sub:"Fast bedside documentation",           color:T.teal,   primary:true  },
  { key:"ClinicalNoteStudio", icon:"📝", label:"Note Studio",  sub:"APSO format, E&M estimator, NQS",      color:T.purple, primary:false },
  { key:"MDMBuilderTab",      icon:"🧠", label:"MDM Builder",  sub:"CPT stepper, critical care time",      color:T.blue,   primary:false },
  { key:"AutocoderHub",       icon:"🏷️", label:"Autocoder",    sub:"ICD-10 coding and charge capture",     color:T.gold,   primary:false },
  { key:"DischargeHub",       icon:"🏥", label:"Discharge Hub", sub:"AI discharge card, meds, precautions", color:T.green,  primary:false },
];

function DocumentationLane({ patientId }) {
  return (
    <div style={{ width:290, minWidth:290, height:"100%", background:T.panel, borderRight:"1px solid rgba(26,53,85,0.5)", display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)", flexShrink:0 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>
          Documentation Lane
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:4 }}>
          Follow the steps in order
        </div>
      </div>

      {/* Step cards */}
      <div style={{ padding:"10px 10px 0", flex:1 }}>
        {DOC_STEPS.map((step, i) => (
          <div
            key={step.key}
            onClick={() => nav(step.key, { patientId })}
            style={{
              ...gc({ borderRadius:10 }),
              borderLeft:`3px solid ${step.color}`,
              background:`linear-gradient(135deg,${step.color}0a,${T.card})`,
              padding:"12px 13px", marginBottom:8,
              cursor:"pointer", transition:"box-shadow .15s",
              position:"relative",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 18px ${step.color}1a`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>{step.icon}</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:step.color }}>{step.label}</span>
              {step.primary && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:step.color, background:`${step.color}18`, border:`1px solid ${step.color}35`, borderRadius:4, padding:"1px 6px", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  Start Here
                </span>
              )}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.45 }}>{step.sub}</div>
            <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.txt4 }}>›</div>
          </div>
        ))}

        {/* Progress stepper */}
        <div style={{ padding:"14px 4px 14px" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>
            Documentation Flow
          </div>
          {DOC_STEPS.map((step, i) => (
            <div key={step.key} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:i<DOC_STEPS.length-1?0:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"rgba(26,53,85,0.6)", border:`1px solid ${step.color}44`, marginTop:2 }} />
                {i < DOC_STEPS.length-1 && (
                  <div style={{ width:1, height:22, background:"rgba(26,53,85,0.4)", margin:"2px 0" }} />
                )}
              </div>
              <div style={{ paddingBottom:i<DOC_STEPS.length-1?0:0 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.4, paddingBottom:i<DOC_STEPS.length-1?14:0 }}>
                  {step.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CLINICAL DECISION LANE (CENTER) ─────────────────────────────────────────
function ClinicalDecisionLane({ patient }) {
  const [showLib, setShowLib] = useState(false);
  const suggested = suggestHubs(patient.cc);

  return (
    <div style={{ flex:1, height:"100%", background:T.bg, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <div style={{ padding:"18px 20px 0" }}>

        {/* CDS Alerts */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
            CDS Alerts
          </div>
          {patient.alerts.length > 0
            ? patient.alerts.map((a, i) => <div key={i} style={{ marginBottom:6 }}><AlertBubble t={a.t} m={a.m} /></div>)
            : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, padding:"10px 14px", background:"rgba(26,53,85,0.2)", borderRadius:8 }}>No active alerts for this patient</div>
          }
        </div>

        {/* Divider */}
        <div style={{ height:1, background:"rgba(26,53,85,0.5)", marginBottom:20 }} />

        {/* Hub section header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>
              {showLib ? "Hub Library — All Hubs" : "Clinical Decision Hubs"}
            </div>
            {!showLib && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2 }}>
                Auto-surfaced for: <span style={{ color:T.gold }}>{patient.cc}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowLib(v=>!v)}
            style={{ padding:"4px 11px", borderRadius:6, cursor:"pointer", border:`1px solid ${showLib?T.teal+"55":"rgba(26,53,85,0.5)"}`, background:showLib?"rgba(0,229,192,0.08)":"transparent", color:showLib?T.teal:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600 }}
          >
            {showLib ? "← Suggested" : "All Hubs"}
          </button>
        </div>

        {/* Suggested hubs grid */}
        {!showLib && (
          <div className="pe-fade" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, paddingBottom:20 }}>
            {suggested.map((key) => {
              const h = HUBS[key];
              if (!h) return null;
              return (
                <div
                  key={key}
                  onClick={() => nav(key, { patientId:patient.id })}
                  style={{ background:`linear-gradient(135deg,${h.color}0d,${h.color}05)`, border:`1px solid ${h.color}30`, borderLeft:`3px solid ${h.color}`, borderRadius:10, padding:"11px 13px", cursor:"pointer", transition:"box-shadow .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 16px ${h.color}1a`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}
                >
                  <div style={{ fontSize:18, marginBottom:5 }}>{h.icon}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:h.color, marginBottom:2 }}>{h.label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4 }}>Open for this patient →</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hub Library — full grouped list */}
        {showLib && (
          <div className="pe-fade" style={{ paddingBottom:20 }}>
            {HUB_DOMAINS.map((dom, di) => (
              <div key={di} style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:dom.color, textTransform:"uppercase", letterSpacing:"0.10em", marginBottom:7 }}>
                  {dom.domain}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {dom.hubs.map((key) => {
                    const h = HUBS[key];
                    if (!h) return null;
                    return (
                      <div
                        key={key}
                        onClick={() => nav(key, { patientId:patient.id })}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(26,53,85,0.4)", cursor:"pointer", transition:"all .12s" }}
                        onMouseEnter={e => { e.currentTarget.style.background=`${h.color}0d`; e.currentTarget.style.borderColor=`${h.color}35`; }}
                        onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor="rgba(26,53,85,0.4)"; }}
                      >
                        <span style={{ fontSize:14 }}>{h.icon}</span>
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:T.txt2 }}>{h.label}</span>
                        <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>›</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── ORDERS LANE (RIGHT) ──────────────────────────────────────────────────────
const ORDER_CARDS = [
  { key:"OrderGeneratorHub", icon:"📋", label:"Order Generator", sub:"43-drug CPOE, 6 quick bundles", color:T.gold   },
  { key:"ERxHub",            icon:"💊", label:"ERx Hub",         sub:"Discharge Rx and prescriptions", color:T.blue  },
];

function OrdersLane({ patient }) {
  const p = patient;
  const v = p.vitals;

  return (
    <div style={{ width:264, minWidth:264, height:"100%", background:T.panel, borderLeft:"1px solid rgba(26,53,85,0.5)", display:"flex", flexDirection:"column", overflowY:"auto" }}>

      {/* Orders header */}
      <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)", flexShrink:0 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>
          Orders & Rx
        </div>
      </div>

      <div style={{ padding:"10px 10px 0", flex:1 }}>

        {/* Order lane cards */}
        {ORDER_CARDS.map(card => (
          <div
            key={card.key}
            onClick={() => nav(card.key, { patientId:p.id })}
            style={{ ...gc({ borderRadius:10, borderLeft:`3px solid ${card.color}`, background:`linear-gradient(135deg,${card.color}0a,${T.card})` }), padding:"11px 12px", marginBottom:8, cursor:"pointer", transition:"box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 16px ${card.color}1a`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <span style={{ fontSize:15 }}>{card.icon}</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:700, color:card.color }}>{card.label}</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>{card.sub}</div>
          </div>
        ))}

        {/* Divider */}
        <div style={{ height:1, background:"rgba(26,53,85,0.5)", margin:"4px 0 12px" }} />

        {/* Active tasks */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:9 }}>
            Active Tasks
          </div>
          {p.tasks.length > 0
            ? p.tasks.map((task, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.teal, background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:"50%", width:15, height:15, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>v</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2 }}>{task}</span>
                </div>
              ))
            : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>No active tasks</div>
          }
        </div>

        {/* Divider */}
        <div style={{ height:1, background:"rgba(26,53,85,0.5)", margin:"0 0 12px" }} />

        {/* Vitals snapshot */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
            Vitals
          </div>
          <div style={{ ...gc({ borderRadius:9 }), padding:"10px 12px", display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center" }}>
            <VitalChip label="HR"   value={v.hr}         colorKey="hr"   />
            <VitalChip label="SpO2" value={`${v.spo2}%`} colorKey="spo2" />
            <VitalChip label="RR"   value={v.rr}         colorKey="rr"   />
            <VitalChip label="BP"   value={v.bp}                         />
            <VitalChip label="Temp" value={`${v.temp}F`}                 />
          </div>
        </div>

        {/* PMHx + Allergies */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <div style={{ ...gc({ borderRadius:8 }), padding:"10px 10px", flex:1 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>PMHx</div>
            {p.pmhx.length
              ? p.pmhx.map((x,i) => <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt3, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(26,53,85,0.4)", borderRadius:4, padding:"2px 6px", marginBottom:3, display:"inline-block", marginRight:3 }}>{x}</div>)
              : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>None</div>
            }
          </div>
          <div style={{ ...gc({ borderRadius:8 }), padding:"10px 10px", flex:1 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Allergies</div>
            {p.allergies.length
              ? p.allergies.map((a,i) => <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.coral, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.3)", borderRadius:4, padding:"2px 6px", marginBottom:3, display:"inline-block", marginRight:3 }}>{a}</div>)
              : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>NKDA</div>
            }
          </div>
        </div>

        {/* Flags */}
        {p.flags.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>Flags</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {p.flags.map((f,i) => (
                <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.red, background:"rgba(255,68,68,0.1)", border:"1px solid rgba(255,68,68,0.3)", borderRadius:16, padding:"2px 9px" }}>{f}</span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── LOADING STATE ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, background:T.bg }}>
      <div className="pe-spin" style={{ width:32, height:32, border:`3px solid rgba(0,229,192,0.2)`, borderTop:`3px solid ${T.teal}`, borderRadius:"50%" }} />
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>Loading patient...</div>
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, background:T.bg }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:T.txt3 }}>Patient not found</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4 }}>The patient record could not be loaded.</div>
      <Btn accent={T.teal} onClick={() => nav("CommandCenter")}>← Back to Census</Btn>
    </div>
  );
}

// ─── DISCHARGE SUMMARY MODAL ──────────────────────────────────────────────────
function DischargeSummaryModal({ patient, onConfirm, onCancel, discharging }) {
  const p = patient;
  const v = p.vitals || {};
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(5,15,30,0.85)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="pe-fade" style={{ background:T.panel, border:"1px solid rgba(26,53,85,0.7)", borderRadius:14, padding:"28px 30px", maxWidth:480, width:"90%", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <span style={{ fontSize:22 }}>🏥</span>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:900, color:T.txt }}>Discharge Summary</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, marginTop:1 }}>Review before confirming</div>
          </div>
        </div>

        {/* Patient snapshot */}
        <div style={{ ...gc({ borderRadius:10 }), padding:"13px 15px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:T.txt }}>{p.name}</span>
            <EsiBadge esi={p.esi} />
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4, marginBottom:4 }}>
            {p.room} · {p.age}yo {p.sex} · {fmtTime(p.mins)} in dept
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gold, fontWeight:600 }}>CC: {p.cc}</div>
        </div>

        {/* Vitals at discharge */}
        {(v.hr || v.bp || v.spo2) && (
          <div style={{ ...gc({ borderRadius:10 }), padding:"11px 14px", marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>Vitals at Discharge</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {v.hr   && <VitalChip label="HR"   value={v.hr}         colorKey="hr"   />}
              {v.spo2 && <VitalChip label="SpO2" value={`${v.spo2}%`} colorKey="spo2" />}
              {v.rr   && <VitalChip label="RR"   value={v.rr}         colorKey="rr"   />}
              {v.bp   && <VitalChip label="BP"   value={v.bp}                         />}
              {v.temp && <VitalChip label="Temp" value={`${v.temp}F`}                 />}
            </div>
          </div>
        )}

        {/* Active tasks */}
        {p.tasks && p.tasks.length > 0 && (
          <div style={{ ...gc({ borderRadius:10, borderLeft:`3px solid ${T.gold}` }), padding:"10px 13px", marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.gold, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Pending Tasks</div>
            {p.tasks.map((t, i) => (
              <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginBottom:3 }}>· {t}</div>
            ))}
          </div>
        )}

        {/* Active alerts warning */}
        {p.alerts && p.alerts.some(a => a.t === "critical") && (
          <div style={{ background:"rgba(255,68,68,0.1)", border:"1px solid rgba(255,68,68,0.35)", borderLeft:`3px solid ${T.red}`, borderRadius:10, padding:"10px 13px", marginBottom:14 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.red, fontWeight:600 }}>⚠️ Patient has unresolved critical alerts. Confirm discharge with caution.</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
          <button
            onClick={onCancel}
            style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.txt4, background:"transparent", border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, padding:"8px 18px", cursor:"pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={discharging}
            style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:"#fff", background:`linear-gradient(135deg,${T.teal},${T.blue})`, border:"none", borderRadius:8, padding:"8px 22px", cursor:discharging?"not-allowed":"pointer", opacity:discharging?0.6:1 }}
          >
            {discharging ? "Discharging…" : "✓ Confirm Discharge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PATIENT ENCOUNTER — MAIN EXPORT ──────────────────────────────────────────
export default function PatientEncounter() {
  const [patient,          setPatient]          = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [showDischarge,    setShowDischarge]    = useState(false);
  const [discharging,      setDischarging]      = useState(false);
  const [discharged,       setDischarged]       = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("patientId");
    if (!id) { setLoading(false); return; }
    Patient.get(id).then(data => { setPatient(data); setLoading(false); });
  }, []);

  const handleDischargeConfirm = async () => {
    setDischarging(true);
    await Patient.update(patient.id, { ...patient, flags: [...(patient.flags||[]), "Discharged"] });
    setDischarging(false);
    setShowDischarge(false);
    setDischarged(true);
  };

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
        <LoadingState />
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
        <ErrorState />
      </div>
    );
  }

  if (discharged) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif", alignItems:"center", justifyContent:"center", gap:16 }}>
        <span style={{ fontSize:52 }}>✅</span>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.teal }}>Patient Discharged</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4 }}>{patient.name} has been marked as discharged in the census.</div>
        <Btn accent={T.teal} onClick={() => window.location.href = "/CommandCenter"}>← Back to Census</Btn>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
      <TopContextBar patient={patient} onDischarge={() => setShowDischarge(true)} />
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <DocumentationLane patientId={patient.id} />
        <ClinicalDecisionLane patient={patient} />
        <OrdersLane patient={patient} />
      </div>
      {showDischarge && (
        <DischargeSummaryModal
          patient={patient}
          onConfirm={handleDischargeConfirm}
          onCancel={() => setShowDischarge(false)}
          discharging={discharging}
        />
      )}
    </div>
  );
}