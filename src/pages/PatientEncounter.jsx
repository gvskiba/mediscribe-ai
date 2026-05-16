// PatientEncounter.jsx — Central encounter workspace for Notrya AI
// Architecture: font IIFE → tokens → helpers → hub registry → primitives → columns → export

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// ── Font loader ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("pe-fonts")) return;
  const l = document.createElement("link");
  l.id = "pe-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = "pe-styles";
  s.textContent = `
    .pe-scroll::-webkit-scrollbar{width:4px}
    .pe-scroll::-webkit-scrollbar-track{background:transparent}
    .pe-scroll::-webkit-scrollbar-thumb{background:rgba(58,130,180,0.25);border-radius:2px}
    .pe-scroll::-webkit-scrollbar-thumb:hover{background:rgba(0,229,192,0.35)}
    .pe-lane-card:hover{filter:brightness(1.07)}
    .pe-hub-card:hover{filter:brightness(1.08)}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444", cyan:"#00d4ff"
};

const BORDER = "1px solid rgba(26,53,85,0.5)";
const CARD_R = 10;

// ── Helpers ────────────────────────────────────────────────────────────────
function navigateTo(page, patientId) {
  const url = "/" + page + (patientId ? "?patientId=" + patientId : "");
  window.location.href = url;
}

function esiColor(esi) {
  return { 1:T.red, 2:T.orange, 3:T.gold, 4:T.green, 5:T.txt4 }[esi] || T.txt4;
}

function timeColor(mins) {
  if (mins > 120) return T.red;
  if (mins > 60)  return T.gold;
  return T.txt4;
}

function fmtTime(mins) {
  if (!mins) return "--";
  if (mins < 60) return mins + "m";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h + "h" + (m > 0 ? " " + m + "m" : "");
}

function vitalStatus(key, val) {
  if (val === undefined || val === null || val === "" || val === "--") return T.txt3;
  const n = parseFloat(val);
  if (isNaN(n)) return T.txt3;
  if (key === "hr")   return n > 130 || n < 40 ? T.red : n > 100 || n < 50 ? T.gold : T.teal;
  if (key === "spo2") return n < 90 ? T.red : n < 94 ? T.gold : T.teal;
  if (key === "rr")   return n > 30 || n < 8  ? T.red : n > 20 || n < 12  ? T.gold : T.teal;
  return T.txt3;
}

// ── Hub registry ───────────────────────────────────────────────────────────
const HUB_REG = {
  ECGHub:            { label:"ECG Hub",        icon:"⚡", color:T.teal,   page:"ECGHub"            },
  CardiacRiskPage:   { label:"Cardiac Risk",   icon:"🫀", color:T.coral,  page:"CardiacRiskPage"   },
  StrokeHub:         { label:"Stroke Hub",     icon:"🧠", color:T.purple, page:"StrokeHub"         },
  ToxicologyHub:     { label:"Toxicology",     icon:"☣️", color:T.orange, page:"ToxHub"            },
  SepsisHub:         { label:"Sepsis Hub",     icon:"🔬", color:T.coral,  page:"SepsisHub"         },
  AirwayHub:         { label:"Airway Hub",     icon:"💨", color:T.teal,   page:"AirwayHub"         },
  LabInterpreter:    { label:"Lab Interpreter",icon:"🧪", color:T.teal,   page:"LabHub"            },
  ImagingInterpreter:{ label:"Imaging",        icon:"🩻", color:T.gold,   page:"imaging-interpreter"},
  DermatologyHub:    { label:"Derm Hub",       icon:"🔎", color:T.purple, page:"derm-hub"          },
  DermMorphologyRef: { label:"Derm Ref",       icon:"📖", color:T.purple, page:"derm-morphology"   },
  POCUSHub:          { label:"POCUS Hub",      icon:"📡", color:T.teal,   page:"POCUSHub"          },
  OrderGeneratorHub: { label:"Orders",         icon:"📋", color:T.gold,   page:"order-generator"   },
  ElectrolyteHub:    { label:"Electrolytes",   icon:"⚗️", color:T.cyan,   page:"electrolyte-hub"   },
  OrthoHub:          { label:"Ortho Hub",      icon:"🦴", color:T.gold,   page:"OrthoHub"          },
  OBGYNHub:          { label:"OB/GYN Hub",     icon:"🩺", color:T.purple, page:"OBGYNHub"          },
  QuickNote:         { label:"Quick Note",     icon:"✏️", color:T.teal,   page:"QuickNote"         },
  ClinicalNoteStudio:{ label:"Note Studio",    icon:"📝", color:T.purple, page:"ProviderStudio"    },
  MDMBuilderTab:     { label:"MDM Builder",    icon:"🧠", color:T.blue,   page:"ClinicalDecisionHub"},
  AutocoderHub:      { label:"Autocoder",      icon:"🏷️", color:T.gold,   page:"AutocoderHub"      },
};

const HUB_GROUPS = [
  { label:"Cardiac & Vascular", color:T.coral,  keys:["ECGHub","CardiacRiskPage"] },
  { label:"Neuro & Psych",      color:T.purple, keys:["StrokeHub"] },
  { label:"Critical Care",      color:T.orange, keys:["SepsisHub","AirwayHub","ToxicologyHub"] },
  { label:"Diagnostics",        color:T.teal,   keys:["LabInterpreter","ImagingInterpreter","POCUSHub","ElectrolyteHub"] },
  { label:"Subspecialty",       color:T.gold,   keys:["DermatologyHub","DermMorphologyRef","OrthoHub","OBGYNHub"] },
  { label:"Documentation",      color:T.blue,   keys:["QuickNote","ClinicalNoteStudio","MDMBuilderTab","AutocoderHub"] },
];

function suggestHubs(cc) {
  if (!cc) return ["LabInterpreter","ECGHub","OrderGeneratorHub"];
  const s = cc.toLowerCase();
  if (s.includes("chest pain"))                                        return ["ECGHub","CardiacRiskPage","LabInterpreter","OrderGeneratorHub"];
  if (s.includes("stroke") || s.includes("neuro"))                    return ["StrokeHub","ImagingInterpreter","CardiacRiskPage"];
  if (s.includes("overdose")||s.includes("opioid")||s.includes("tox")) return ["ToxicologyHub","AirwayHub","OrderGeneratorHub"];
  if (s.includes("shortness")||s.includes("sob"))                     return ["ECGHub","POCUSHub","LabInterpreter","ImagingInterpreter"];
  if (s.includes("sepsis")||s.includes("fever"))                      return ["SepsisHub","LabInterpreter","OrderGeneratorHub"];
  if (s.includes("rash")||s.includes("derm"))                         return ["DermatologyHub","DermMorphologyRef","LabInterpreter"];
  if (s.includes("abdominal")||s.includes("abd"))                     return ["POCUSHub","LabInterpreter","ImagingInterpreter"];
  if (s.includes("altered")||s.includes("ams"))                       return ["ToxicologyHub","LabInterpreter","ImagingInterpreter"];
  if (s.includes("weakness")||s.includes("electrolyte"))              return ["ElectrolyteHub","ECGHub","LabInterpreter"];
  if (s.includes("trauma")||s.includes("fracture"))                   return ["ImagingInterpreter","OrderGeneratorHub"];
  return ["LabInterpreter","ECGHub","OrderGeneratorHub"];
}

// ── Primitives ─────────────────────────────────────────────────────────────
function Mono({ children, size = 9, color = T.txt4, style = {} }) {
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:size, color, ...style }}>
      {children}
    </span>
  );
}

function AccentBtn({ label, accent, onClick }) {
  return (
    <div onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      padding:"6px 13px", borderRadius:8,
      background:`linear-gradient(135deg,${accent}22,${accent}0a)`,
      border:`1px solid ${accent}55`,
      color:accent,
      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
      cursor:"pointer", whiteSpace:"nowrap", transition:"opacity .15s",
    }}>
      {label}
    </div>
  );
}

function SmallBtn({ label, onClick, style = {} }) {
  return (
    <div onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"4px 10px", borderRadius:6, cursor:"pointer",
      fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4,
      border:BORDER, background:"transparent",
      transition:"color .15s", whiteSpace:"nowrap", ...style,
    }}>
      {label}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
      letterSpacing:"0.12em", textTransform:"uppercase", color:T.txt4,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop:BORDER, margin:"10px 0" }} />;
}

// ── Top Context Bar ────────────────────────────────────────────────────────
function ContextBar({ patient, patientId }) {
  const v = patient.vitals || {};
  const timeMins = patient.mins || 0;
  const tc = timeColor(timeMins);
  const ec = esiColor(patient.esi);

  return (
    <div style={{
      height:52, flexShrink:0,
      background:T.panel, borderBottom:BORDER,
      display:"flex", alignItems:"center",
      padding:"0 16px", gap:12,
    }}>
      {/* Back button */}
      <SmallBtn
        label="← Census"
        onClick={() => { window.location.href = "/"; }}
      />

      {/* Room */}
      {patient.room && (
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4,
          background:"rgba(255,255,255,0.04)", border:BORDER,
          borderRadius:5, padding:"2px 8px", flexShrink:0,
        }}>
          {patient.room}
        </span>
      )}

      {/* Name */}
      <span style={{
        fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15,
        color:T.txt, flexShrink:0,
      }}>
        {patient.name}
      </span>

      {/* Age / Sex */}
      {(patient.age || patient.sex) && (
        <Mono size={10} color={T.txt3} style={{ flexShrink:0 }}>
          {patient.age}{patient.sex}
        </Mono>
      )}

      {/* Dot */}
      <Mono size={10} color={T.txt4} style={{ flexShrink:0 }}>·</Mono>

      {/* Chief Complaint */}
      {patient.cc && (
        <span style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
          color:T.gold, flexShrink:0,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:220,
        }}>
          {patient.cc}
        </span>
      )}

      {/* ESI badge */}
      {patient.esi && (
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:ec, background:`${ec}1a`, border:`1px solid ${ec}44`,
          borderRadius:4, padding:"1px 6px", flexShrink:0,
        }}>
          ESI {patient.esi}
        </span>
      )}

      {/* Time in dept */}
      {timeMins > 0 && (
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:tc, flexShrink:0,
        }}>
          {fmtTime(timeMins)}
        </span>
      )}

      <div style={{ flex:1 }} />

      {/* Action buttons */}
      <AccentBtn label="Quick Note" accent={T.teal}
        onClick={() => navigateTo("QuickNote", patientId)} />
      <AccentBtn label="Orders" accent={T.gold}
        onClick={() => navigateTo("order-generator", patientId)} />
    </div>
  );
}

// ── LEFT COLUMN — Documentation Lane ──────────────────────────────────────
const DOC_CARDS = [
  {
    key:"QuickNote", page:"QuickNote",
    icon:"✏️", label:"Quick Note", color:T.teal,
    sub:"Fast bedside documentation",
    badge:"START HERE", primary:true,
  },
  {
    key:"ClinicalNoteStudio", page:"ProviderStudio",
    icon:"📝", label:"Note Studio", color:T.purple,
    sub:"APSO format, E&M estimator, Note Quality Score",
  },
  {
    key:"MDMBuilder", page:"ClinicalDecisionHub",
    icon:"🧠", label:"MDM Builder", color:T.blue,
    sub:"CPT stepper, critical care time, comorbidities",
  },
  {
    key:"Autocoder", page:"AutocoderHub",
    icon:"🏷️", label:"Autocoder", color:T.gold,
    sub:"ICD-10 coding and charge capture",
  },
];

const DOC_STEPS = ["Quick Note", "Note Studio", "MDM Builder", "Autocoder"];

function DocCard({ card, patientId }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="pe-lane-card"
      onClick={() => navigateTo(card.page, patientId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${card.color}09` : T.card,
        border:BORDER, borderLeft:`3px solid ${card.color}`,
        borderRadius:CARD_R, margin:"0 12px 10px", padding:"12px 14px",
        cursor:"pointer", transition:"background .15s",
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>{card.icon}</span>
          <span style={{
            fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:card.color,
          }}>
            {card.label}
          </span>
        </div>
        {card.badge && (
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
            color:card.color, background:`${card.color}1a`,
            border:`1px solid ${card.color}4d`, borderRadius:4, padding:"1px 6px",
            flexShrink:0, letterSpacing:"0.05em",
          }}>
            {card.badge}
          </span>
        )}
      </div>
      <div style={{
        fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4,
        marginTop:5, lineHeight:1.45,
      }}>
        {card.sub}
      </div>
    </div>
  );
}

function DocStepper() {
  return (
    <div style={{ padding:"0 16px 16px" }}>
      <SectionLabel>Documentation Flow</SectionLabel>
      <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:0 }}>
        {DOC_STEPS.map((step, i) => (
          <div key={step} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
              <div style={{
                width:8, height:8, borderRadius:"50%", flexShrink:0,
                background:"transparent",
                border:"1.5px solid rgba(26,53,85,0.6)",
                marginTop:3,
              }} />
              {i < DOC_STEPS.length - 1 && (
                <div style={{ width:1, height:18, background:"rgba(26,53,85,0.4)" }} />
              )}
            </div>
            <span style={{
              fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4,
              paddingBottom: i < DOC_STEPS.length - 1 ? 8 : 0,
            }}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocLane({ patient, patientId }) {
  return (
    <div style={{
      width:300, flexShrink:0, background:T.bg,
      borderRight:BORDER, display:"flex", flexDirection:"column",
      height:"100%", overflow:"hidden",
    }}>
      <div style={{ padding:"14px 16px 10px", flexShrink:0 }}>
        <SectionLabel>Documentation</SectionLabel>
      </div>
      <div className="pe-scroll" style={{ flex:1, overflowY:"auto" }}>
        {DOC_CARDS.map(card => (
          <DocCard key={card.key} card={card} patientId={patientId} />
        ))}
        <Divider />
        <DocStepper />
      </div>
    </div>
  );
}

// ── CENTER COLUMN — Clinical Decision Lane ─────────────────────────────────
function AlertRow({ alert }) {
  const cfg = {
    critical:{ color:T.red,  bg:`${T.red}1a`,  icon:"🚨" },
    warn:    { color:T.gold, bg:`${T.gold}12`, icon:"⚠️" },
    info:    { color:T.blue, bg:`${T.blue}12`, icon:"ℹ️" },
  }[alert.t] || { color:T.txt3, bg:"transparent", icon:"ℹ️" };
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:9,
      padding:"9px 12px", background:cfg.bg,
      borderLeft:`3px solid ${cfg.color}`,
      borderRadius:"0 8px 8px 0", marginBottom:6,
    }}>
      <span style={{ fontSize:14, flexShrink:0 }}>{cfg.icon}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.55 }}>
        {alert.m}
      </span>
    </div>
  );
}

function HubCard2col({ hubKey, patientId }) {
  const h = HUB_REG[hubKey];
  if (!h) return null;
  const [hov, setHov] = useState(false);
  return (
    <div
      className="pe-hub-card"
      onClick={() => navigateTo(h.page, patientId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:`linear-gradient(135deg,${h.color}0d,${h.color}05)`,
        border:`1px solid ${h.color}30`,
        borderLeft:`3px solid ${h.color}`,
        borderRadius:CARD_R, padding:"11px 13px", cursor:"pointer",
        transition:"box-shadow .15s",
        boxShadow: hov ? `0 0 16px ${h.color}1a` : "none",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
        <span style={{ fontSize:18 }}>{h.icon}</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12, color:h.color }}>
          {h.label}
        </span>
      </div>
      <Mono size={8} color={T.txt4}>Open for this patient →</Mono>
    </div>
  );
}

function HubLibraryGroup({ group, patientId }) {
  return (
    <div style={{ marginBottom:14 }}>
      <Mono size={8} color={group.color} style={{ letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>
        {group.label}
      </Mono>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        {group.keys.map(k => <HubCard2col key={k} hubKey={k} patientId={patientId} />)}
      </div>
    </div>
  );
}

function ClinicalDecisionLane({ patient, patientId }) {
  const [showAll, setShowAll] = useState(false);
  const alerts = patient.alerts || [];
  const suggested = suggestHubs(patient.cc);

  return (
    <div style={{ flex:1, background:T.bg, display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

      {/* CDS Alerts */}
      <div style={{ flexShrink:0, padding:"14px 16px 0" }}>
        <SectionLabel>CDS Alerts</SectionLabel>
        <div style={{ marginTop:8 }}>
          {alerts.length === 0
            ? <Mono size={10} color={T.txt4}>No active alerts</Mono>
            : alerts.map((a, i) => <AlertRow key={i} alert={a} />)
          }
        </div>
      </div>

      <Divider />

      {/* Hub section */}
      <div style={{ padding:"0 16px 8px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <SectionLabel>Clinical Decision Hubs</SectionLabel>
        <div
          onClick={() => setShowAll(v => !v)}
          style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color: showAll ? T.teal : T.txt4,
            border:`1px solid ${showAll ? T.teal + "40" : "rgba(26,53,85,0.4)"}`,
            background: showAll ? `${T.teal}12` : "transparent",
            borderRadius:4, padding:"2px 8px", cursor:"pointer",
          }}
        >
          {showAll ? "Suggested" : "Hub Library"}
        </div>
      </div>

      <div className="pe-scroll" style={{ flex:1, overflowY:"auto", padding:"0 16px 16px" }}>
        {showAll
          ? HUB_GROUPS.map(g => <HubLibraryGroup key={g.label} group={g} patientId={patientId} />)
          : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {suggested.map(k => <HubCard2col key={k} hubKey={k} patientId={patientId} />)}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ── RIGHT COLUMN — Orders Lane ─────────────────────────────────────────────
function VitalChip({ label, value, colorKey }) {
  const c = colorKey ? vitalStatus(colorKey, value) : T.txt3;
  const display = value !== undefined && value !== null && value !== "" && value !== "--"
    ? (colorKey === "spo2" ? value + "%" : String(value))
    : "--";
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
      padding:"8px 10px", background:`${c}0d`, border:`1px solid ${c}30`,
      borderRadius:7, flex:1, minWidth:0,
    }}>
      <Mono size={7} color={T.txt4}>{label}</Mono>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:c }}>
        {display}
      </span>
    </div>
  );
}

function OrderCard({ page, icon, label, color, sub, patientId }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="pe-lane-card"
      onClick={() => navigateTo(page, patientId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}09` : T.card,
        border:BORDER, borderLeft:`3px solid ${color}`,
        borderRadius:CARD_R, marginBottom:10, padding:"12px 14px",
        cursor:"pointer", transition:"background .15s",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
        <span style={{ fontSize:15 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.4 }}>
        {sub}
      </div>
    </div>
  );
}

function OrderLane({ patient, patientId }) {
  const tasks    = patient.tasks    || [];
  const pmhx     = patient.pmhx     || [];
  const allergies = patient.allergies || [];
  const v = patient.vitals || {};

  return (
    <div style={{
      width:260, flexShrink:0, background:T.panel,
      borderLeft:BORDER, display:"flex", flexDirection:"column",
      height:"100%", overflow:"hidden",
    }}>
      <div style={{ padding:"14px 14px 10px", flexShrink:0 }}>
        <SectionLabel>Orders &amp; Rx</SectionLabel>
      </div>

      <div className="pe-scroll" style={{ flex:1, overflowY:"auto", padding:"0 12px 16px" }}>

        {/* Order cards */}
        <OrderCard page="order-generator" icon="📋" label="Order Generator" color={T.gold}
          sub="43-drug CPOE generator, 6 quick bundles" patientId={patientId} />
        <OrderCard page="ERx" icon="💊" label="ERx Hub" color={T.blue}
          sub="Discharge medications and prescriptions" patientId={patientId} />

        <Divider />

        {/* Active Tasks */}
        <div style={{ marginBottom:14 }}>
          <SectionLabel>Active Tasks</SectionLabel>
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
            {tasks.length === 0
              ? <Mono size={10} color={T.txt4}>No active tasks</Mono>
              : tasks.map((task, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                  <div style={{
                    width:14, height:14, borderRadius:"50%",
                    border:`2px solid ${T.teal}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0, marginTop:1,
                  }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:T.teal }} />
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.4 }}>
                    {task}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        <Divider />

        {/* Patient Info */}
        <div style={{ marginBottom:14 }}>
          <SectionLabel>Patient Info</SectionLabel>
          <div style={{ marginTop:8, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {/* PMHx */}
            <div style={{ background:T.card, border:BORDER, borderRadius:8, padding:"8px 10px" }}>
              <Mono size={7} color={T.txt4} style={{ letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:5 }}>PMHx</Mono>
              {pmhx.length === 0
                ? <Mono size={9} color={T.txt4}>None</Mono>
                : (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {pmhx.map((p, i) => (
                      <span key={i} style={{
                        fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt3,
                        background:"rgba(130,174,206,0.10)", border:"1px solid rgba(130,174,206,0.2)",
                        borderRadius:4, padding:"1px 6px",
                      }}>{p}</span>
                    ))}
                  </div>
                )
              }
            </div>
            {/* Allergies */}
            <div style={{ background:T.card, border:BORDER, borderRadius:8, padding:"8px 10px" }}>
              <Mono size={7} color={T.txt4} style={{ letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:5 }}>Allergies</Mono>
              {allergies.length === 0
                ? <Mono size={9} color={T.txt4}>NKDA</Mono>
                : (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {allergies.map((a, i) => (
                      <span key={i} style={{
                        fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:600,
                        color:T.coral, background:`${T.coral}12`,
                        border:`1px solid ${T.coral}30`, borderRadius:4, padding:"1px 6px",
                      }}>{a}</span>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        </div>

        <Divider />

        {/* Vitals Snapshot */}
        <div>
          <SectionLabel>Vitals Snapshot</SectionLabel>
          <div style={{ marginTop:8, display:"flex", gap:5, flexWrap:"wrap" }}>
            <VitalChip label="HR"   value={v.hr}   colorKey="hr"   />
            <VitalChip label="BP"   value={v.bp}                   />
            <VitalChip label="SpO2" value={v.spo2} colorKey="spo2" />
            <VitalChip label="RR"   value={v.rr}   colorKey="rr"   />
            <VitalChip label="Temp" value={v.temp}                 />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function PatientEncounter() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const patientId = params.get("patientId");

  useEffect(() => {
    if (!patientId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    base44.entities.Patient.filter({ id: patientId }, "-created_date", 1)
      .then(results => {
        if (results && results.length > 0) {
          setPatient(results[0]);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [patientId]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        height:"100vh", background:T.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ textAlign:"center" }}>
          <div style={{
            width:32, height:32, borderRadius:"50%",
            border:`3px solid ${T.teal}`, borderTopColor:"transparent",
            animation:"spin 0.8s linear infinite", margin:"0 auto 16px",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>
            Loading patient...
          </span>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (notFound || !patient) {
    return (
      <div style={{
        height:"100vh", background:T.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{
          background:T.card, border:BORDER, borderRadius:14,
          padding:"32px 40px", textAlign:"center", maxWidth:380,
        }}>
          <div style={{ fontSize:40, marginBottom:14 }}>🏥</div>
          <div style={{
            fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:18, color:T.txt, marginBottom:6,
          }}>
            Patient not found
          </div>
          <div style={{
            fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4, marginBottom:20,
          }}>
            {patientId ? "This patient record could not be loaded." : "No patient ID was provided in the URL."}
          </div>
          <div
            onClick={() => { window.location.href = "/"; }}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"8px 18px", borderRadius:8, cursor:"pointer",
              background:`linear-gradient(135deg,${T.teal}22,${T.teal}0a)`,
              border:`1px solid ${T.teal}55`, color:T.teal,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
            }}
          >
            ← Back to Census
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height:"100vh", width:"100vw",
      display:"flex", flexDirection:"column",
      background:T.bg, color:T.txt,
      overflow:"hidden", fontFamily:"'DM Sans',sans-serif",
    }}>
      <ContextBar patient={patient} patientId={patientId} />
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <DocLane patient={patient} patientId={patientId} />
        <ClinicalDecisionLane patient={patient} patientId={patientId} />
        <OrderLane patient={patient} patientId={patientId} />
      </div>
    </div>
  );
}