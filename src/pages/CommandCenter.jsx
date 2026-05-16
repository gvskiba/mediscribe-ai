// CommandCenter.jsx — Notrya AI Home · ED Patient Census Dashboard
// Architecture: import → font IIFE → T tokens → helpers → data → primitives → panels → default export

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ── Font loader ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("cc-fonts")) return;
  const l = document.createElement("link");
  l.id = "cc-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = "cc-styles";
  s.textContent = `
    .cc-scroll::-webkit-scrollbar{width:4px}
    .cc-scroll::-webkit-scrollbar-track{background:transparent}
    .cc-scroll::-webkit-scrollbar-thumb{background:rgba(58,130,180,0.25);border-radius:2px}
    .cc-scroll::-webkit-scrollbar-thumb:hover{background:rgba(0,229,192,0.35)}
    .cc-row:hover{background:rgba(59,158,255,0.05)!important;cursor:pointer}
    .cc-hub:hover{opacity:.85;cursor:pointer}
    .cc-btn:hover{opacity:.8}
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

// ── Helper functions ───────────────────────────────────────────────────────
function navigateTo(page, patientId) {
  const url = "/" + page + (patientId ? "?patientId=" + patientId : "");
  window.location.href = url;
}

function esiColor(esi) {
  return { 1:T.red, 2:T.orange, 3:T.gold, 4:T.green, 5:T.txt4 }[esi] || T.txt4;
}

function timeColor(mins) {
  if (mins > 120) return T.red;
  if (mins > 60) return T.gold;
  return T.txt4;
}

function fmtTime(mins) {
  if (mins < 60) return mins + "m";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h + "h" + (m > 0 ? " " + m + "m" : "");
}

function hasCritical(patient) {
  return (patient.alerts || []).some(a => a.t === "critical");
}

function vitalStatus(key, val) {
  if (val === undefined || val === null || val === "") return T.txt3;
  const n = parseFloat(val);
  if (isNaN(n)) return T.txt3;
  if (key === "hr")   return n > 130 || n < 40 ? T.red : n > 100 || n < 50 ? T.gold : T.teal;
  if (key === "spo2") return n < 90 ? T.red : n < 94 ? T.gold : T.teal;
  if (key === "rr")   return n > 30 || n < 8 ? T.red : n > 20 || n < 12 ? T.gold : T.teal;
  return T.txt3;
}

function sortPatients(list) {
  return [...list].sort((a, b) => {
    if (a.esi !== b.esi) return a.esi - b.esi;
    return (b.mins || 0) - (a.mins || 0);
  });
}

// ── Hub data ───────────────────────────────────────────────────────────────
const HUB_REG = {
  ECGHub:            { label:"ECG Hub",       icon:"⚡", color:T.teal,   page:"ECGHub"            },
  CardiacRiskPage:   { label:"Cardiac Risk",  icon:"🫀", color:T.coral,  page:"CardiacRiskPage"   },
  StrokeHub:         { label:"Stroke Hub",    icon:"🧠", color:T.purple, page:"StrokeHub"         },
  ToxicologyHub:     { label:"Toxicology",    icon:"☣️", color:T.orange, page:"ToxicologyHub"     },
  SepsisHub:         { label:"Sepsis Hub",    icon:"🔬", color:T.coral,  page:"SepsisHub"         },
  AirwayHub:         { label:"Airway Hub",    icon:"💨", color:T.teal,   page:"AirwayHub"         },
  LabInterpreter:    { label:"Lab Interpreter",icon:"🧪", color:T.teal,  page:"LabInterpreter"    },
  ImagingInterpreter:{ label:"Imaging",       icon:"🩻", color:T.gold,   page:"ImagingInterpreter"},
  DermatologyHub:    { label:"Derm Hub",      icon:"🔎", color:T.purple, page:"DermatologyHub"    },
  DermMorphologyRef: { label:"Derm Ref",      icon:"📖", color:T.purple, page:"DermatologyHub"    },
  POCUSHub:          { label:"POCUS Hub",     icon:"📡", color:T.teal,   page:"POCUSHub"          },
  OrderGeneratorHub: { label:"Orders",        icon:"📋", color:T.gold,   page:"OrderGeneratorHub" },
  ElectrolyteHub:    { label:"Electrolytes",  icon:"⚗️", color:T.cyan,   page:"ElectrolyteHub"    },
};

const ALL_HUBS_GROUPS = [
  { label:"Cardiac & Vascular", keys:["ECGHub","CardiacRiskPage"] },
  { label:"Neuro & Psych",      keys:["StrokeHub"] },
  { label:"Critical Care",      keys:["SepsisHub","AirwayHub","ToxicologyHub"] },
  { label:"Diagnostics",        keys:["LabInterpreter","ImagingInterpreter","POCUSHub","ElectrolyteHub"] },
  { label:"Subspecialty",       keys:["DermatologyHub","DermMorphologyRef"] },
  { label:"Orders & Docs",      keys:["OrderGeneratorHub"] },
];

function suggestHubs(cc) {
  if (!cc) return ["LabInterpreter","OrderGeneratorHub","ECGHub"];
  const s = cc.toLowerCase();
  if (s.includes("chest pain"))                              return ["ECGHub","CardiacRiskPage","OrderGeneratorHub"];
  if (s.includes("stroke") || s.includes("neuro"))          return ["StrokeHub","ImagingInterpreter","CardiacRiskPage"];
  if (s.includes("overdose")||s.includes("opioid")||s.includes("tox")) return ["ToxicologyHub","AirwayHub","OrderGeneratorHub"];
  if (s.includes("shortness")||s.includes("sob")||s.includes("respiratory")) return ["ECGHub","POCUSHub","LabInterpreter","ImagingInterpreter"];
  if (s.includes("sepsis")||s.includes("fever")||s.includes("infection"))  return ["SepsisHub","LabInterpreter","OrderGeneratorHub"];
  if (s.includes("rash")||s.includes("derm"))               return ["DermatologyHub","DermMorphologyRef","LabInterpreter"];
  if (s.includes("abdominal")||s.includes("abd"))           return ["POCUSHub","LabInterpreter","ImagingInterpreter"];
  if (s.includes("altered")||s.includes("ams")||s.includes("confusion")) return ["ToxicologyHub","LabInterpreter","ImagingInterpreter"];
  if (s.includes("weakness")||s.includes("electrolyte"))    return ["ElectrolyteHub","ECGHub","LabInterpreter"];
  if (s.includes("trauma")||s.includes("fracture")||s.includes("ortho")) return ["ImagingInterpreter","OrderGeneratorHub"];
  return ["LabInterpreter","OrderGeneratorHub","ECGHub"];
}

// ── Primitive components ───────────────────────────────────────────────────
function Mono({ children, size = 9, color = T.txt4, style = {} }) {
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:size, color, ...style }}>
      {children}
    </span>
  );
}

function Btn({ label, accent, onClick, small }) {
  return (
    <div className="cc-btn" onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      padding: small ? "4px 11px" : "6px 15px",
      borderRadius:7,
      background:`linear-gradient(135deg,${accent}22,${accent}0a)`,
      border:`1px solid ${accent}55`,
      color:accent,
      fontFamily:"'DM Sans',sans-serif", fontWeight:600,
      fontSize: small ? 10 : 11,
      cursor:"pointer", letterSpacing:.3,
      whiteSpace:"nowrap", transition:"opacity .15s",
    }}>
      {label}
    </div>
  );
}

function EsiBadge({ esi }) {
  const c = esiColor(esi);
  return (
    <span style={{
      fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
      color:c, background:`${c}1a`, border:`1px solid ${c}44`,
      borderRadius:4, padding:"1px 6px", flexShrink:0,
    }}>
      {esi}
    </span>
  );
}

function TimeBadge({ mins }) {
  const c = timeColor(mins);
  return (
    <span style={{
      fontFamily:"'JetBrains Mono',monospace", fontSize:8,
      color:c, flexShrink:0,
    }}>
      {fmtTime(mins)}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
      letterSpacing:1.5, textTransform:"uppercase", color:T.txt4, marginBottom:8,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background:T.card, border:BORDER, borderRadius:CARD_R,
      padding:"13px 18px", ...style,
    }}>
      {children}
    </div>
  );
}

// ── Clock ──────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");
  const date = now.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:500, color:T.txt, letterSpacing:2 }}>
        {hh}:{mm}:<span style={{ color:T.txt4 }}>{ss}</span>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:1 }}>{date}</div>
    </div>
  );
}

// ── Top Bar ────────────────────────────────────────────────────────────────
function TopBar({ selectedPatient }) {
  return (
    <div style={{
      height:58, background:T.panel, borderBottom:BORDER,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 20px", flexShrink:0, gap:12,
    }}>
      {/* Left: Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:11, flexShrink:0 }}>
        <div style={{
          width:36, height:36, borderRadius:9,
          background:"linear-gradient(135deg,#00e5c0,#9b6dff)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, flexShrink:0,
        }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:T.txt, letterSpacing:.5 }}>NOTRYA</div>
          <Mono size={8} color={T.teal} style={{ letterSpacing:2 }}>COMMAND CENTER</Mono>
        </div>
      </div>

      {/* Center: Clock */}
      <LiveClock />

      {/* Right: Actions */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        {/* On Shift pill */}
        <div style={{
          display:"flex", alignItems:"center", gap:5, padding:"4px 10px",
          background:`${T.teal}12`, border:`1px solid ${T.teal}35`, borderRadius:100,
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, flexShrink:0 }} />
          <Mono size={8} color={T.teal}>On Shift</Mono>
        </div>
        <Btn label="Quick Note" accent={T.teal} small
          onClick={() => navigateTo("QuickNote", selectedPatient?.id)} />
        <Btn label="+ New Patient" accent={T.gold} small
          onClick={() => navigateTo("NewPatientInput")} />
        {/* Avatar */}
        <div style={{
          width:32, height:32, borderRadius:"50%",
          background:"linear-gradient(135deg,#ff6b6b,#9b6dff)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, color:"#fff",
          cursor:"pointer", flexShrink:0,
        }}>G</div>
      </div>
    </div>
  );
}

// ── Left Rail ─────────────────────────────────────────────────────────────
function PatientRow({ patient, selected, onClick }) {
  const crit = hasCritical(patient);
  const isSelected = selected?.id === patient.id;
  return (
    <div className="cc-row" onClick={onClick} style={{
      padding:"9px 12px",
      borderLeft: isSelected ? `3px solid ${T.teal}` : "3px solid transparent",
      background: isSelected
        ? `linear-gradient(135deg,${T.teal}09,rgba(8,22,40,0.85))`
        : "transparent",
      transition:"background .15s",
    }}>
      {/* Row 1: room + dot + ESI + time */}
      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
        <Mono size={9} color={T.txt4} style={{ flexShrink:0 }}>{patient.room}</Mono>
        {crit && (
          <div style={{ width:5, height:5, borderRadius:"50%", background:T.red, flexShrink:0 }} />
        )}
        <EsiBadge esi={patient.esi} />
        <div style={{ flex:1 }} />
        <TimeBadge mins={patient.mins} />
      </div>
      {/* Row 2: name */}
      <div style={{
        fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:12,
        color: isSelected ? T.txt : T.txt2, marginBottom:2,
        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
      }}>
        {patient.name}
      </div>
      {/* Row 3: age / sex / cc */}
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
        {patient.age}{patient.sex} &middot; {patient.cc}
      </div>
    </div>
  );
}

function LeftRail({ patients, selected, onSelect }) {
  const [query, setQuery] = useState("");
  const sorted = sortPatients(patients);
  const filtered = query.trim()
    ? sorted.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.cc?.toLowerCase().includes(query.toLowerCase()) ||
        p.room?.toLowerCase().includes(query.toLowerCase())
      )
    : sorted;

  return (
    <div style={{
      width:286, flexShrink:0, background:T.panel,
      borderRight:BORDER, display:"flex", flexDirection:"column",
      height:"100%", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{ padding:"12px 14px 8px", borderBottom:BORDER, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <Mono size={8} style={{ letterSpacing:1.5, textTransform:"uppercase" }}>Patient Census</Mono>
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
            color:T.teal, background:`${T.teal}18`, border:`1px solid ${T.teal}40`,
            borderRadius:4, padding:"1px 7px",
          }}>{patients.length}</span>
        </div>
        {/* Search */}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name, room, CC..."
          style={{
            width:"100%", boxSizing:"border-box",
            background:"rgba(255,255,255,0.04)", border:BORDER,
            borderRadius:6, padding:"5px 9px",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt,
            outline:"none", caretColor:T.teal,
          }}
        />
      </div>
      {/* Rows */}
      <div className="cc-scroll" style={{ flex:1, overflowY:"auto" }}>
        {filtered.length === 0 && (
          <div style={{ padding:"24px 14px", textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>
            No patients match
          </div>
        )}
        {filtered.map(p => (
          <PatientRow key={p.id} patient={p} selected={selected} onClick={() => onSelect(p)} />
        ))}
      </div>
    </div>
  );
}

// ── Center Panel ───────────────────────────────────────────────────────────
function VitalChip({ label, value, colorKey }) {
  const c = colorKey ? vitalStatus(colorKey, value) : T.txt3;
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:4,
      padding:"10px 14px", background:`${c}0d`, border:`1px solid ${c}35`,
      borderRadius:8, minWidth:62,
    }}>
      <Mono size={8} color={T.txt4}>{label}</Mono>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:700, color:c }}>
        {value ?? "--"}
      </div>
    </div>
  );
}

function AlertRow({ alert }) {
  const cfg = {
    critical:{ color:T.red,    bg:`${T.red}10`,    icon:"🚨" },
    warn:    { color:T.gold,   bg:`${T.gold}10`,   icon:"⚠️" },
    info:    { color:T.blue,   bg:`${T.blue}10`,   icon:"ℹ️" },
  }[alert.t] || { color:T.txt3, bg:"transparent", icon:"ℹ️" };
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:9, padding:"9px 12px",
      background:cfg.bg, borderLeft:`3px solid ${cfg.color}`,
      borderRadius:"0 7px 7px 0", marginBottom:5,
    }}>
      <span style={{ fontSize:14, flexShrink:0 }}>{cfg.icon}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.5 }}>{alert.m}</span>
    </div>
  );
}

function CenterPanel({ patient }) {
  if (!patient) {
    return (
      <div style={{ flex:1, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🏥</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:T.txt3, marginBottom:6 }}>No patient selected</div>
          <Mono size={10} color={T.txt4}>Select a patient from the census rail</Mono>
        </div>
      </div>
    );
  }

  const v = patient.vitals || {};
  const flags = patient.flags || [];
  const alerts = patient.alerts || [];
  const tasks = patient.tasks || [];
  const pmhx = patient.pmhx || [];
  const allergies = patient.allergies || [];

  return (
    <div className="cc-scroll" style={{ flex:1, background:T.bg, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10 }}>

      {/* Header card */}
      <Card>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color:T.txt, marginBottom:5 }}>
              {patient.name}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <Mono size={10} color={T.txt3}>{patient.age}{patient.sex}</Mono>
              <Mono size={10} color={T.txt4}>&middot;</Mono>
              <Mono size={10} color={T.txt3}>{patient.room}</Mono>
              <Mono size={10} color={T.txt4}>&middot;</Mono>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>{patient.cc}</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <EsiBadge esi={patient.esi} />
            <TimeBadge mins={patient.mins} />
          </div>
        </div>
        {/* Action buttons */}
        <div style={{ display:"flex", gap:7, marginTop:12, flexWrap:"wrap" }}>
          <Btn label="Quick Note"   accent={T.teal}   onClick={() => navigateTo("QuickNote",         patient.id)} />
          <Btn label="Full Intake"  accent={T.gold}   onClick={() => navigateTo("NewPatientInput",   patient.id)} />
          <Btn label="Note Studio"  accent={T.purple} onClick={() => navigateTo("ProviderStudio",    patient.id)} />
          <Btn label="Orders"       accent={T.coral}  onClick={() => navigateTo("OrderGeneratorHub", patient.id)} />
        </div>
      </Card>

      {/* Vitals */}
      <Card>
        <SectionLabel>Vitals</SectionLabel>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <VitalChip label="HR"   value={v.hr}   colorKey="hr"   />
          <VitalChip label="BP"   value={v.bp}                   />
          <VitalChip label="SpO2" value={v.spo2 !== undefined ? v.spo2 + "%" : "--"} colorKey="spo2" />
          <VitalChip label="RR"   value={v.rr}   colorKey="rr"   />
          <VitalChip label="Temp" value={v.temp}                 />
        </div>
      </Card>

      {/* Flags */}
      {flags.length > 0 && (
        <Card>
          <SectionLabel>Flags</SectionLabel>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {flags.map((f, i) => (
              <span key={i} style={{
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                color:T.red, background:`${T.red}15`, border:`1px solid ${T.red}40`,
                borderRadius:5, padding:"3px 10px",
              }}>{f}</span>
            ))}
          </div>
        </Card>
      )}

      {/* CDS Alerts */}
      {alerts.length > 0 && (
        <Card>
          <SectionLabel>CDS Alerts</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {alerts.map((a, i) => <AlertRow key={i} alert={a} />)}
          </div>
        </Card>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <Card>
          <SectionLabel>Tasks</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${T.teal}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:T.teal }} />
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2 }}>{t}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PMHx + Allergies side by side */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {/* PMHx */}
        <Card>
          <SectionLabel>Past Medical Hx</SectionLabel>
          {pmhx.length === 0
            ? <Mono size={10} color={T.txt4}>None documented</Mono>
            : (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {pmhx.map((p, i) => (
                  <span key={i} style={{
                    fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:T.txt3, background:"rgba(130,174,206,0.1)",
                    border:"1px solid rgba(130,174,206,0.2)",
                    borderRadius:5, padding:"2px 9px",
                  }}>{p}</span>
                ))}
              </div>
            )
          }
        </Card>
        {/* Allergies */}
        <Card>
          <SectionLabel>Allergies</SectionLabel>
          {allergies.length === 0
            ? <Mono size={10} color={T.txt4}>NKDA</Mono>
            : (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {allergies.map((a, i) => (
                  <span key={i} style={{
                    fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                    color:T.coral, background:`${T.coral}12`,
                    border:`1px solid ${T.coral}40`,
                    borderRadius:5, padding:"2px 9px",
                  }}>{a}</span>
                ))}
              </div>
            )
          }
        </Card>
      </div>
    </div>
  );
}

// ── Right Rail ─────────────────────────────────────────────────────────────
function HubCard({ hubKey, patientId }) {
  const h = HUB_REG[hubKey];
  if (!h) return null;
  return (
    <div className="cc-hub" onClick={() => navigateTo(h.page, patientId)} style={{
      display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
      background:T.card, border:BORDER,
      borderLeft:`3px solid ${h.color}`,
      borderRadius:"0 8px 8px 0",
      transition:"opacity .15s",
    }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{h.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12, color:T.txt }}>{h.label}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, marginTop:1 }}>Open for this patient →</div>
      </div>
    </div>
  );
}

function AllHubsGroup({ group, patientId }) {
  return (
    <div style={{ marginBottom:12 }}>
      <Mono size={8} color={T.txt4} style={{ letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:5 }}>
        {group.label}
      </Mono>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {group.keys.map(k => <HubCard key={k} hubKey={k} patientId={patientId} />)}
      </div>
    </div>
  );
}

function ShiftStats({ patients }) {
  const total = patients.length;
  const critCount = patients.filter(p => p.esi <= 2).length;
  const alertCount = patients.filter(hasCritical).length;
  const avgTime = total > 0 ? Math.round(patients.reduce((s, p) => s + (p.mins || 0), 0) / total) : 0;

  const tiles = [
    { label:"Total Pts",   val:total,       color:T.teal  },
    { label:"ESI 1-2",     val:critCount,   color:T.orange},
    { label:"Crit Alerts", val:alertCount,  color:T.red   },
    { label:"Avg Time",    val:fmtTime(avgTime), color:T.gold },
  ];

  return (
    <div style={{ borderTop:BORDER, padding:"10px 12px" }}>
      <Mono size={8} style={{ letterSpacing:1.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Shift Overview</Mono>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ background:T.card, border:BORDER, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:t.color }}>{t.val}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, marginTop:2 }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RightRail({ patient, patients }) {
  const [showAll, setShowAll] = useState(false);
  const hubKeys = patient ? suggestHubs(patient.cc) : suggestHubs("");

  return (
    <div style={{
      width:270, flexShrink:0, background:T.panel,
      borderLeft:BORDER, display:"flex", flexDirection:"column",
      height:"100%", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{ padding:"12px 12px 8px", borderBottom:BORDER, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Mono size={8} style={{ letterSpacing:1.5, textTransform:"uppercase" }}>Suggested Hubs</Mono>
        <div className="cc-btn" onClick={() => setShowAll(v => !v)} style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, color: showAll ? T.teal : T.txt4,
          background: showAll ? `${T.teal}12` : "transparent",
          border:`1px solid ${showAll ? T.teal+"40" : "transparent"}`,
          borderRadius:4, padding:"2px 8px", cursor:"pointer", transition:"all .15s",
        }}>
          {showAll ? "Suggested" : "All Hubs"}
        </div>
      </div>

      {/* Hub list */}
      <div className="cc-scroll" style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
        {showAll
          ? ALL_HUBS_GROUPS.map(g => <AllHubsGroup key={g.label} group={g} patientId={patient?.id} />)
          : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {!patient && (
                <Mono size={10} color={T.txt4} style={{ display:"block", marginBottom:8 }}>
                  Select a patient to see contextual hubs
                </Mono>
              )}
              {hubKeys.map(k => <HubCard key={k} hubKey={k} patientId={patient?.id} />)}
            </div>
          )
        }
      </div>

      {/* Shift stats */}
      <ShiftStats patients={patients} />
    </div>
  );
}

// ── Default export ─────────────────────────────────────────────────────────
export default function CommandCenter() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await base44.entities.Patient.list();
    setPatients(list || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ height:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:16 }}>⚡</div>
          <Mono size={12} color={T.teal} style={{ letterSpacing:2 }}>Loading census...</Mono>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height:"100vh", width:"100vw", display:"flex", flexDirection:"column",
      background:T.bg, color:T.txt, overflow:"hidden",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <TopBar selectedPatient={selected} />
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <LeftRail  patients={patients} selected={selected} onSelect={setSelected} />
        <CenterPanel patient={selected} />
        <RightRail  patient={selected} patients={patients} />
      </div>
    </div>
  );
}