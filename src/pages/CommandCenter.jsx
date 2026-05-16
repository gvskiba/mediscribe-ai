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
function TopBar({ selectedPatient, onNewPatient }) {
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
          onClick={onNewPatient} />
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
          <PatientRow key={p.id} patient={p} selected={selected}
            onClick={() => { window.location.href = "/PatientEncounter?patientId=" + p.id; }} />
        ))}
      </div>
    </div>
  );
}

// ── Center Panel ───────────────────────────────────────────────────────────
function CenterPanel() {
  return (
    <div style={{ flex:1, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:14, opacity:0.35 }}>🏥</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:T.txt3, marginBottom:6 }}>
          Select a patient from the census
        </div>
        <Mono size={10} color={T.txt4}>Their encounter workspace will open here</Mono>
      </div>
    </div>
  );
}

// ── New Patient Modal ──────────────────────────────────────────────────────
const EMPTY_FORM = { room:"", name:"", age:"", sex:"", cc:"", esi:3, allergiesText:"" };

function FieldLabel({ children }) {
  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
      letterSpacing:1.5, textTransform:"uppercase", color:T.txt4, marginBottom:5 }}>
      {children}
    </div>
  );
}

function ModalInput({ value, onChange, placeholder, type="text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width:"100%", boxSizing:"border-box",
        background:"rgba(255,255,255,0.04)", border:BORDER,
        borderRadius:7, padding:"8px 11px",
        fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt,
        outline:"none", caretColor:T.teal,
      }}
    />
  );
}

function ToggleGroup({ options, value, onChange, colorFn }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {options.map(opt => {
        const active = value === opt;
        const c = colorFn ? colorFn(opt) : T.teal;
        return (
          <div key={opt} onClick={() => onChange(opt)} style={{
            padding:"5px 14px", borderRadius:7, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:11,
            border:`1px solid ${active ? c + "88" : "rgba(26,53,85,0.5)"}`,
            background: active ? `${c}1a` : "rgba(255,255,255,0.03)",
            color: active ? c : T.txt4,
            transition:"all .12s",
          }}>
            {opt}
          </div>
        );
      })}
    </div>
  );
}

function NewPatientModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (field) => (val) => setForm(f => ({ ...f, [field]:val }));

  const canSubmit = form.room.trim() && form.name.trim() && form.cc.trim() && !saving;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const allergies = form.allergiesText
      .split(",").map(s => s.trim()).filter(Boolean);
    const record = await base44.entities.Patient.create({
      room: form.room.trim(),
      name: form.name.trim(),
      age: form.age ? Number(form.age) : 0,
      sex: form.sex || "M",
      cc: form.cc.trim(),
      esi: form.esi,
      mins: 0,
      vitals: { hr:"--", bp:"--/--", spo2:"--", rr:"--", temp:"--" },
      flags: [], tasks: [], pmhx: [], alerts: [],
      allergies,
    });
    setSaving(false);
    onCreated(record);
  };

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(5,15,30,0.88)",
      backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:T.card,
        border:"1px solid rgba(0,229,192,0.3)",
        borderRadius:16,
        width:"100%", maxWidth:500,
        padding:"24px 28px",
        display:"flex", flexDirection:"column", gap:18,
        maxHeight:"90vh", overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.teal }}>
            New Patient
          </div>
          <div onClick={onClose} style={{
            width:28, height:28, borderRadius:"50%",
            background:"rgba(255,255,255,0.05)", border:BORDER,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:T.txt4, fontSize:14, fontWeight:700,
            transition:"background .15s",
          }}>✕</div>
        </div>

        {/* Room */}
        <div>
          <FieldLabel>Room *</FieldLabel>
          <ModalInput value={form.room} onChange={set("room")} placeholder="Trauma 1, Room 4, Hallway A..." />
        </div>

        {/* Name */}
        <div>
          <FieldLabel>Patient Name *</FieldLabel>
          <ModalInput value={form.name} onChange={set("name")} placeholder="Last, First M." />
        </div>

        {/* Age + Sex row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div>
            <FieldLabel>Age</FieldLabel>
            <ModalInput value={form.age} onChange={set("age")} placeholder="—" type="number" />
          </div>
          <div>
            <FieldLabel>Sex</FieldLabel>
            <ToggleGroup options={["M","F"]} value={form.sex} onChange={set("sex")} colorFn={() => T.teal} />
          </div>
        </div>

        {/* Chief Complaint */}
        <div>
          <FieldLabel>Chief Complaint *</FieldLabel>
          <ModalInput value={form.cc} onChange={set("cc")} placeholder="Chest Pain, Stroke Symptoms, Opioid Overdose..." />
        </div>

        {/* ESI */}
        <div>
          <FieldLabel>ESI Level</FieldLabel>
          <ToggleGroup
            options={[1,2,3,4,5]}
            value={form.esi}
            onChange={set("esi")}
            colorFn={esiColor}
          />
        </div>

        {/* Allergies */}
        <div>
          <FieldLabel>Allergies (comma-separated)</FieldLabel>
          <ModalInput value={form.allergiesText} onChange={set("allergiesText")} placeholder="Penicillin, Sulfa..." />
        </div>

        {/* Submit */}
        <div onClick={canSubmit ? handleCreate : undefined} style={{
          width:"100%", padding:"11px 0", borderRadius:9, textAlign:"center",
          background: canSubmit ? `linear-gradient(135deg,${T.teal}28,${T.teal}10)` : "rgba(255,255,255,0.04)",
          border:`1px solid ${canSubmit ? T.teal + "66" : "rgba(26,53,85,0.4)"}`,
          color: canSubmit ? T.teal : T.txt4,
          fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
          cursor: canSubmit ? "pointer" : "default",
          transition:"all .15s", letterSpacing:.4,
        }}>
          {saving ? "Adding..." : "Add to Census"}
        </div>

        {/* Cancel */}
        <div onClick={onClose} style={{
          textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt4, cursor:"pointer", marginTop:-8,
          textDecoration:"underline", textDecorationColor:"rgba(90,130,168,0.4)",
        }}>
          Cancel
        </div>
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
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await base44.entities.Patient.list();
    setPatients(list || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = useCallback(async (record) => {
    setShowModal(false);
    const list = await base44.entities.Patient.list();
    const refreshed = list || [];
    setPatients(refreshed);
    const found = refreshed.find(p => p.id === record.id) || record;
    setSelected(found);
  }, []);

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
      <TopBar selectedPatient={selected} onNewPatient={() => setShowModal(true)} />
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <LeftRail  patients={patients} selected={selected} onSelect={setSelected} />
        <CenterPanel />
        <RightRail  patient={selected} patients={patients} />
      </div>
      {showModal && (
        <NewPatientModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}