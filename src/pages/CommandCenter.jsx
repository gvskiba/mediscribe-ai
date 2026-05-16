import { useState } from "react";

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
// Replace with navigateTo(page) in Base44
const nav = (page, params = {}) => { console.log("nav ->", page, params); };

// ─── PATIENT DATA ─────────────────────────────────────────────────────────────
// Replace with Patient.list() from Base44 entity
const PATIENTS = [
  { id:"1", room:"Trauma 1", name:"Mitchell, Robert J.", age:67, sex:"M",
    cc:"Chest Pain", esi:1, mins:12,
    vitals:{hr:108,bp:"158/94",spo2:94,rr:22,temp:"98.4"},
    flags:["STEMI on ECG","Troponin pending"],
    tasks:["12-lead done","IV x2","Aspirin given","Cath lab notified"],
    allergies:["Penicillin"], pmhx:["HTN","DM2","Prior MI"],
    alerts:[{t:"critical",m:"STEMI pattern — cath lab activation required"},{t:"warn",m:"Hold metformin — contrast study likely"}]},
  { id:"2", room:"Room 2", name:"Hartwell, Susan K.", age:34, sex:"F",
    cc:"Shortness of Breath", esi:2, mins:78,
    vitals:{hr:122,bp:"102/64",spo2:88,rr:28,temp:"99.1"},
    flags:["SpO2 88%","Tachycardic"], tasks:["ABG ordered","CXR awaiting read","Albuterol x2"],
    allergies:[], pmhx:["Asthma","Anxiety"],
    alerts:[{t:"critical",m:"SpO2 88% — airway reassessment needed"},{t:"warn",m:"BP trending down"}]},
  { id:"3", room:"Room 4", name:"Nguyen, Thomas A.", age:52, sex:"M",
    cc:"Altered Mental Status", esi:2, mins:34,
    vitals:{hr:96,bp:"144/88",spo2:97,rr:18,temp:"101.2"},
    flags:["Fever","GCS 13"], tasks:["CT Head ordered","LP tray at bedside","BCx x2 sent"],
    allergies:["Sulfa"], pmhx:["Alcoholism","Seizure disorder"],
    alerts:[{t:"warn",m:"Fever + AMS — rule out meningitis"}]},
  { id:"4", room:"Room 6", name:"Garcia, Maria L.", age:28, sex:"F",
    cc:"Abdominal Pain", esi:3, mins:130,
    vitals:{hr:88,bp:"118/72",spo2:99,rr:16,temp:"98.6"},
    flags:["Beta-hCG pending"], tasks:["UA sent","Pelvic US ordered","Morphine 4mg given"],
    allergies:["Codeine"], pmhx:["G2P1"],
    alerts:[{t:"warn",m:"hCG pending — must rule out ectopic pregnancy"}]},
  { id:"5", room:"Room 8", name:"Brooks, David M.", age:71, sex:"M",
    cc:"Stroke Symptoms", esi:1, mins:8,
    vitals:{hr:78,bp:"186/104",spo2:96,rr:16,temp:"98.2"},
    flags:["LKW 45m ago","Right arm weak"], tasks:["Stroke alert active","CT done","CTA ordered","Neuro at bedside"],
    allergies:[], pmhx:["A-fib","HTN","Prior TIA"],
    alerts:[{t:"critical",m:"Within tPA window — CT results pending"},{t:"warn",m:"On warfarin — check INR before lytics"}]},
  { id:"6", room:"Room 9", name:"Coleman, James R.", age:19, sex:"M",
    cc:"Opioid Overdose", esi:1, mins:6,
    vitals:{hr:54,bp:"88/50",spo2:82,rr:6,temp:"96.8"},
    flags:["Naloxone x2 given","Pinpoint pupils"], tasks:["Narcan drip running","Tox paged","RSI tray open"],
    allergies:[], pmhx:["IVDU"],
    alerts:[{t:"critical",m:"Hypoxia + bradypnea — RSI preparation advised"}]},
  { id:"7", room:"Room 11", name:"Patel, Priya N.", age:45, sex:"F",
    cc:"Sepsis — UTI Source", esi:2, mins:95,
    vitals:{hr:114,bp:"94/58",spo2:95,rr:24,temp:"102.9"},
    flags:["SIRS x4","Lactate 3.8"], tasks:["2L NS given","BCx x2","Pip-tazo running","ICU notified"],
    allergies:["Vancomycin"], pmhx:["DM2","Recurrent UTIs"],
    alerts:[{t:"critical",m:"Lactate 3.8 — septic shock, ICU bed requested"},{t:"warn",m:"SEP-1 bundle: confirm abx < 1h from arrival"}]},
  { id:"8", room:"Room 13", name:"Whitfield, Carol A.", age:58, sex:"F",
    cc:"Diffuse Rash", esi:3, mins:112,
    vitals:{hr:94,bp:"128/80",spo2:98,rr:16,temp:"100.4"},
    flags:["Mucosal involvement","New Lamotrigine"], tasks:["Derm consult called","BSA calculated"],
    allergies:["Sulfa","Lamotrigine — NEW"], pmhx:["Epilepsy","HTN"],
    alerts:[{t:"critical",m:"Lamotrigine + mucosal involvement — rule out SJS/TEN"}]},
  { id:"9", room:"Room 15", name:"O'Brien, Kathleen M.", age:62, sex:"F",
    cc:"Generalized Weakness", esi:3, mins:90,
    vitals:{hr:82,bp:"136/84",spo2:97,rr:16,temp:"98.8"},
    flags:["K+ 2.8 on BMP"], tasks:["KCl IV x2 ordered","Repeat BMP in 2h","ECG done"],
    allergies:["Latex"], pmhx:["HTN","HFrEF","Lasix daily"],
    alerts:[{t:"warn",m:"K+ 2.8 in HFrEF — continuous cardiac monitoring"}]},
  { id:"10", room:"Hallway A", name:"Jenkins, Frank O.", age:44, sex:"M",
    cc:"Low Back Pain", esi:4, mins:185,
    vitals:{hr:76,bp:"122/78",spo2:99,rr:14,temp:"98.2"},
    flags:["Awaiting discharge"], tasks:["Ketorolac given","D/C instructions pending"],
    allergies:[], pmhx:["Chronic LBP"], alerts:[]},
];

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
    [p.name, p.cc, p.room].some(s => s.toLowerCase().includes(search.toLowerCase()))
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
          const hasCrit = p.alerts.some(a => a.t === "critical");
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
function SelectPatientPrompt() {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:T.bg }}>
      <div style={{ fontSize:52 }}>🏥</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.txt3 }}>Select a patient</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4, textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
        Choose a patient from the census to open their encounter workspace
      </div>
      <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {PATIENTS.filter(p => p.alerts.some(a => a.t==="critical")).slice(0,3).map(p => (
          <div key={p.id} onClick={() => nav("PatientEncounter", { patientId:p.id })} style={{ padding:"6px 14px", borderRadius:20, background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.25)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.red }}>
            🚨 {p.room} — {p.cc}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RIGHT RAIL — SHIFT OVERVIEW ──────────────────────────────────────────────
function ShiftRail() {
  const critPts = PATIENTS.filter(p => p.alerts.some(a => a.t==="critical"));
  const avgTime = Math.round(PATIENTS.reduce((s,p) => s+p.mins, 0) / PATIENTS.length);

  return (
    <div style={{ width:258, minWidth:258, height:"100%", borderLeft:"1px solid rgba(26,53,85,0.5)", background:T.panel, display:"flex", flexDirection:"column", overflowY:"auto" }}>

      <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>Shift Overview</div>
      </div>

      <div style={{ padding:"12px 12px 0" }}>
        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:16 }}>
          {[
            { label:"Total Pts",    value:PATIENTS.length,                                           color:T.teal  },
            { label:"ESI 1–2",      value:PATIENTS.filter(p=>p.esi<=2).length,                       color:T.coral },
            { label:"Crit Alerts",  value:PATIENTS.filter(p=>p.alerts.some(a=>a.t==="critical")).length, color:T.red },
            { label:"Avg Time",     value:`${avgTime}m`,                                             color:T.gold  },
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
            const count = PATIENTS.filter(p=>p.esi===esi).length;
            const c = esiColor(esi);
            const pct = PATIENTS.length ? (count/PATIENTS.length)*100 : 0;
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

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
      <TopBar
        onQuickNote={() => nav("QuickNote")}
        onNewPatient={() => setShowNewPatient(true)}
      />

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <CensusPanel
          patients={PATIENTS}
          search={search}
          onSearch={setSearch}
        />
        <SelectPatientPrompt />
        <ShiftRail />
      </div>

      {/* New Patient Choice Modal */}
      {showNewPatient && <NewPatientModal onClose={() => setShowNewPatient(false)} />}
    </div>
  );
}