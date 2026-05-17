import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("cc-fonts")) return;
  const l = document.createElement("link");
  l.id = "cc-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "cc-css";
  s.textContent = `
    @keyframes cc-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .cc-fade{animation:cc-fade .16s ease forwards}
    @keyframes modal-in{from{opacity:0;transform:scale(0.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .modal-in{animation:modal-in .2s cubic-bezier(.22,.68,0,1.15) forwards}
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
const nav = (page, params = {}) => {
  const query = Object.keys(params).length
    ? "?" + new URLSearchParams(params).toString()
    : "";
  window.location.href = `/${page}${query}`;
};

// ─── PATIENT DATA ─────────────────────────────────────────────────────────────

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const esiColor = (n) => ({1:T.red,2:T.orange,3:T.gold,4:T.green,5:T.txt4}[n]||T.txt4);
const fmtTime  = (m) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
const gc       = (x={}) => ({ background:T.card, border:"1px solid rgba(26,53,85,0.5)", borderRadius:10, ...x });

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Btn({ children, accent, onClick, sm }) {
  return (
    <button onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:"'DM Sans',sans-serif", fontSize:sm?11:12, fontWeight:600, color:accent, background:`linear-gradient(135deg,${accent}22,${accent}0a)`, border:`1px solid ${accent}55`, borderRadius:8, padding:sm?"4px 10px":"7px 15px", cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap" }}>
      {children}
    </button>
  );
}

function EsiBadge({ esi }) {
  const c = esiColor(esi);
  return <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:c, background:`${c}18`, border:`1px solid ${c}45`, borderRadius:5, padding:"2px 7px", whiteSpace:"nowrap" }}>ESI {esi}</span>;
}

function TimeBadge({ mins }) {
  const c = mins>120?T.red:mins>60?T.gold:T.txt4;
  return <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:c, minWidth:40, textAlign:"right" }}>{fmtTime(mins)}</span>;
}

// ─── NEW PATIENT CHOICE MODAL ─────────────────────────────────────────────────
function NewPatientModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(5,15,30,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-in"
        style={{ width:"100%", maxWidth:480, borderRadius:16, overflow:"hidden", border:"1px solid rgba(26,53,85,0.6)", background:T.panel, boxShadow:"0 24px 80px rgba(0,0,0,0.8)" }}
      >
        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.txt, marginBottom:4 }}>Add New Patient</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>Choose your documentation mode</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:T.txt4, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"6px 12px" }}>✕</button>
          </div>
        </div>

        {/* Two choices */}
        <div style={{ padding:"20px 24px 24px", display:"flex", flexDirection:"column", gap:12 }}>

          {/* Quick Note */}
          <div
            onClick={() => { nav("QuickNote"); onClose(); }}
            style={{ ...gc({ borderRadius:12, borderLeft:`3px solid ${T.teal}`, background:`linear-gradient(135deg,${T.teal}0a,${T.card})` }), padding:"16px 18px", cursor:"pointer", transition:"box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 24px ${T.teal}1a`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>✏️</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.teal }}>Quick Note</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.teal, background:"rgba(0,229,192,0.12)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:4, padding:"1px 6px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Recommended</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3, lineHeight:1.6 }}>
                  Fast bedside documentation. AI-assisted HPI, SmartFill, and ICD-10 search. Designed for speed — document in under 2 minutes.
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.teal, marginTop:8 }}>
                  For attendings and mid-levels at the bedside →
                </div>
              </div>
            </div>
          </div>

          {/* Full Intake */}
          <div
            onClick={() => { nav("NewPatientInput"); onClose(); }}
            style={{ ...gc({ borderRadius:12, borderLeft:`3px solid ${T.gold}`, background:`linear-gradient(135deg,${T.gold}0a,${T.card})` }), padding:"16px 18px", cursor:"pointer", transition:"box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 24px ${T.gold}1a`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>📋</span>
              <div style={{ flex:1 }}>
                <div style={{ marginBottom:5 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.gold }}>Full Intake (NPI)</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3, lineHeight:1.6 }}>
                  Structured intake with ROS, PE, vitals, PMHx, medications, and social history. Full encounter build for complex patients.
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.gold, marginTop:8 }}>
                  For nurses, residents, and detailed documentation →
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, textAlign:"center", marginTop:4 }}>
            You can switch modes at any time from the Patient Encounter page
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CENSUS PANEL ─────────────────────────────────────────────────────────────
function CensusPanel({ patients, search, onSearch }) {
  const filtered = patients.filter(p =>
    [p.name, p.cc, p.room].some(s => (s || "").toLowerCase().includes(search.toLowerCase()))
  );
  const sorted = [...filtered].sort((a, b) => a.esi !== b.esi ? a.esi - b.esi : b.mins - a.mins);

  return (
    <div style={{ width:292, minWidth:292, display:"flex", flexDirection:"column", borderRight:"1px solid rgba(26,53,85,0.5)", height:"100%", background:T.panel }}>
      <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>Patient Census</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.teal, background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:10, padding:"1px 8px" }}>{patients.length}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, padding:"7px 10px" }}>
          <span style={{ fontSize:12, color:T.txt4 }}>🔍</span>
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Room, name, CC..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          {search && <button onClick={() => onSearch("")} style={{ background:"none", border:"none", color:T.txt4, cursor:"pointer", fontSize:11, padding:0 }}>x</button>}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
        {sorted.map(p => {
          const hasCrit = p.alerts && p.alerts.some(a => a.t === "critical");
          return (
            <div
              key={p.id}
              onClick={() => nav("PatientEncounter", { patientId:p.id })}
              style={{ padding:"10px 16px", background:"transparent", borderLeft:"3px solid transparent", borderBottom:"1px solid rgba(26,53,85,0.3)", cursor:"pointer", transition:"all .12s", display:"flex", flexDirection:"column", gap:4 }}
              onMouseEnter={e => { e.currentTarget.style.background=`linear-gradient(135deg,${T.teal}07,transparent)`; e.currentTarget.style.borderLeftColor=T.teal+"55"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderLeftColor="transparent"; }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>{p.room}</span>
                  {hasCrit && <span style={{ width:5, height:5, borderRadius:"50%", background:T.red, display:"inline-block" }} />}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <EsiBadge esi={p.esi} />
                  <TimeBadge mins={p.mins} />
                </div>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.txt, lineHeight:1.2 }}>{p.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>{p.age}{p.sex}</span>
                <span style={{ color:T.txt4, fontSize:9 }}>·</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3 }}>{p.cc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CENTER — SELECT PATIENT PROMPT ───────────────────────────────────────────
function SelectPatientPrompt({ patients }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:T.bg }}>
      <div style={{ fontSize:52 }}>🏥</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.txt3 }}>Select a patient</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4, textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
        Choose a patient from the census to open their encounter workspace
      </div>
      <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {patients.filter(p => p.alerts && p.alerts.some(a => a.t==="critical")).slice(0,3).map(p => (
          <div key={p.id} onClick={() => nav("PatientEncounter", { patientId:p.id })} style={{ padding:"6px 14px", borderRadius:20, background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.25)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.red }}>
            🚨 {p.room} — {p.cc}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RIGHT RAIL — SHIFT OVERVIEW ──────────────────────────────────────────────
function ShiftRail({ patients }) {
  const critPts = patients.filter(p => p.alerts && p.alerts.some(a => a.t==="critical"));
  const avgTime = patients.length ? Math.round(patients.reduce((s,p) => s+(p.mins||0), 0) / patients.length) : 0;

  return (
    <div style={{ width:258, minWidth:258, height:"100%", borderLeft:"1px solid rgba(26,53,85,0.5)", background:T.panel, display:"flex", flexDirection:"column", overflowY:"auto" }}>

      <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>Shift Overview</div>
      </div>

      <div style={{ padding:"12px 12px 0" }}>
        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:16 }}>
          {[
            { label:"Total Pts",    value:patients.length,                                                                   color:T.teal  },
            { label:"ESI 1–2",      value:patients.filter(p=>p.esi<=2).length,                                               color:T.coral },
            { label:"Crit Alerts",  value:patients.filter(p=>p.alerts&&p.alerts.some(a=>a.t==="critical")).length,           color:T.red   },
            { label:"Avg Time",     value:`${avgTime}m`,                                                                     color:T.gold  },
          ].map((s,i) => (
            <div key={i} style={{ ...gc({ borderRadius:9 }), padding:"10px 11px", textAlign:"center" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Critical patients callout */}
        {critPts.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.red, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>
              Critical — Needs Attention
            </div>
            {critPts.map(p => (
              <div
                key={p.id}
                onClick={() => nav("PatientEncounter", { patientId:p.id })}
                style={{ ...gc({ borderRadius:9, borderLeft:`3px solid ${T.red}`, background:"rgba(255,68,68,0.05)" }), padding:"9px 11px", marginBottom:6, cursor:"pointer" }}
              >
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.txt, marginBottom:2 }}>{p.name}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, marginBottom:4 }}>{p.room} · {p.cc}</div>
                {p.alerts.filter(a=>a.t==="critical").map((a,i) => (
                  <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.red, lineHeight:1.4 }}>🚨 {a.m}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ESI breakdown */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>
            ESI Breakdown
          </div>
          {[1,2,3,4,5].map(esi => {
            const count = patients.filter(p=>p.esi===esi).length;
            const c = esiColor(esi);
            const pct = patients.length ? (count/patients.length)*100 : 0;
            return (
              <div key={esi} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:c, minWidth:36 }}>ESI {esi}</span>
                <div style={{ flex:1, height:5, background:"rgba(26,53,85,0.5)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:3, transition:"width .4s" }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, minWidth:12, textAlign:"right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ onQuickNote, onNewPatient }) {
  const now  = new Date();
  const time = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
  const date = now.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:58, minHeight:58, borderBottom:"1px solid rgba(26,53,85,0.5)", background:T.panel, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,${T.teal},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:900, color:T.txt, letterSpacing:"0.03em" }}>NOTRYA</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"0.16em", marginTop:-1 }}>COMMAND CENTER</div>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:T.txt, letterSpacing:"0.04em" }}>{time}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:-2 }}>{date}</div>
        </div>
        <div style={{ background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:8, padding:"4px 12px", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block" }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.teal, fontWeight:700 }}>On Shift</span>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Btn accent={T.teal} onClick={onQuickNote}>✏️ Quick Note</Btn>
        <Btn accent={T.gold} onClick={onNewPatient}>+ New Patient</Btn>
        <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.coral},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, fontWeight:700, color:"white", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>G</div>
      </div>
    </div>
  );
}

// ─── COMMAND CENTER — MAIN EXPORT ─────────────────────────────────────────────
export default function CommandCenter() {
  const [search,         setSearch]         = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patients,       setPatients]       = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    base44.entities.Patient.list().then(data => { setPatients(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid rgba(0,229,192,0.2)`, borderTop:`3px solid ${T.teal}`, animation:"cc-spin 1s linear infinite" }} />
        <style>{`@keyframes cc-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>Loading census...</div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
      <TopBar
        onQuickNote={() => nav("QuickNote")}
        onNewPatient={() => setShowNewPatient(true)}
      />

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <CensusPanel
          patients={patients}
          search={search}
          onSearch={setSearch}
        />
        <SelectPatientPrompt patients={patients} />
        <ShiftRail patients={patients} />
      </div>

      {/* New Patient Choice Modal */}
      {showNewPatient && <NewPatientModal onClose={() => setShowNewPatient(false)} />}
    </div>
  );
}