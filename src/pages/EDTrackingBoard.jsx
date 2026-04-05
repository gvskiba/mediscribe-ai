import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("edtb-css")) return;
  const s = document.createElement("style");
  s.id = "edtb-css";
  s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');

.edtb { position:fixed; inset:0; background:#050f1e; font-family:'DM Sans',sans-serif; color:#f2f7ff; display:flex; flex-direction:column; overflow:hidden; }
.edtb * { box-sizing:border-box; }
.edtb ::-webkit-scrollbar { width:4px; height:4px; }
.edtb ::-webkit-scrollbar-thumb { background:#1a3555; border-radius:2px; }

/* TOP BAR */
.edtb-top { height:56px; flex-shrink:0; background:#081628; border-bottom:1px solid #1a3555; display:flex; align-items:center; padding:0 20px; gap:12px; z-index:20; }
.edtb-logo { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:#fff; white-space:nowrap; }
.edtb-badge { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:2px; background:rgba(0,229,192,.08); border:1px solid rgba(0,229,192,.3); color:#00e5c0; border-radius:20px; padding:2px 10px; }
.edtb-clock { font-family:'JetBrains Mono',monospace; font-size:12px; color:#8aaccc; background:#0e2544; border:1px solid #1a3555; border-radius:6px; padding:4px 12px; white-space:nowrap; }
.edtb-top-stats { display:flex; gap:6px; }
.edtb-stat { display:flex; flex-direction:column; align-items:center; background:#0e2544; border:1px solid #1a3555; border-radius:7px; padding:4px 14px; cursor:default; }
.edtb-stat-val { font-family:'JetBrains Mono',monospace; font-size:16px; font-weight:700; line-height:1; }
.edtb-stat-lbl { font-size:8px; color:#7aa0c0; text-transform:uppercase; letter-spacing:.06em; margin-top:2px; }
.edtb-spacer { flex:1; }
.edtb-btn { padding:6px 14px; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:5px; font-family:'DM Sans',sans-serif; transition:all .15s; white-space:nowrap; border:none; }
.edtb-btn-ghost { background:#0e2544; border:1px solid #1a3555 !important; color:#b8d4f0; }
.edtb-btn-ghost:hover { border-color:#2a4f7a !important; color:#fff; }
.edtb-btn-teal { background:#00e5c0; color:#050f1e; }
.edtb-btn-teal:hover { filter:brightness(1.1); }
.edtb-btn-gold { background:rgba(245,200,66,.1); color:#f5c842; border:1px solid rgba(245,200,66,.3) !important; }
.edtb-btn-gold:hover { background:rgba(245,200,66,.2); }

/* FILTER BAR */
.edtb-filters { height:44px; flex-shrink:0; background:#081628; border-bottom:1px solid rgba(26,53,85,.5); display:flex; align-items:center; padding:0 20px; gap:8px; overflow-x:auto; }
.edtb-filters::-webkit-scrollbar { display:none; }
.edtb-filter-pill { padding:4px 14px; border-radius:20px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid #1a3555; background:transparent; color:#8aaccc; white-space:nowrap; transition:all .15s; }
.edtb-filter-pill:hover { border-color:#2a4f7a; color:#d0e8ff; }
.edtb-filter-pill.active { background:rgba(59,158,255,.12); border-color:rgba(59,158,255,.4); color:#3b9eff; font-weight:600; }
.edtb-filter-sep { width:1px; height:20px; background:#1a3555; flex-shrink:0; margin:0 4px; }

/* BOARD */
.edtb-board { flex:1; overflow:auto; padding:16px 20px 24px; }
.edtb-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:10px; }

/* PATIENT CARD */
.edtb-card { background:#0b1e36; border:1px solid #1a3555; border-radius:12px; overflow:hidden; transition:border-color .2s, box-shadow .2s; cursor:pointer; }
.edtb-card:hover { border-color:#2a4f7a; box-shadow:0 4px 20px rgba(0,0,0,.4); }
.edtb-card.esi-1 { border-left:3px solid #ff4444; }
.edtb-card.esi-2 { border-left:3px solid #ff6b6b; }
.edtb-card.esi-3 { border-left:3px solid #ff9f43; }
.edtb-card.esi-4 { border-left:3px solid #00e5c0; }
.edtb-card.esi-5 { border-left:3px solid #3b9eff; }
.edtb-card-hdr { padding:10px 14px 8px; background:rgba(11,30,54,.6); border-bottom:1px solid rgba(26,53,85,.4); display:flex; align-items:center; gap:8px; }
.edtb-esi-badge { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; flex-shrink:0; }
.edtb-esi-1 { background:rgba(255,68,68,.15); color:#ff4444; border:1px solid rgba(255,68,68,.3); }
.edtb-esi-2 { background:rgba(255,107,107,.15); color:#ff6b6b; border:1px solid rgba(255,107,107,.3); }
.edtb-esi-3 { background:rgba(255,159,67,.12); color:#ff9f43; border:1px solid rgba(255,159,67,.25); }
.edtb-esi-4 { background:rgba(0,229,192,.08); color:#00e5c0; border:1px solid rgba(0,229,192,.2); }
.edtb-esi-5 { background:rgba(59,158,255,.08); color:#3b9eff; border:1px solid rgba(59,158,255,.2); }
.edtb-pt-name { font-family:'Playfair Display',serif; font-size:14px; font-weight:700; color:#f2f7ff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.edtb-room-badge { margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; background:rgba(0,229,192,.1); color:#00e5c0; border:1px solid rgba(0,229,192,.25); border-radius:5px; padding:2px 8px; flex-shrink:0; }
.edtb-card-body { padding:10px 14px 12px; display:flex; flex-direction:column; gap:6px; }
.edtb-cc { font-size:12px; font-weight:600; color:#ff9f43; font-family:'JetBrains Mono',monospace; }
.edtb-meta { display:flex; gap:6px; flex-wrap:wrap; }
.edtb-meta-chip { font-size:10px; color:#7aa0c0; background:#0e2544; border:1px solid #1a3555; border-radius:4px; padding:1px 7px; white-space:nowrap; font-family:'JetBrains Mono',monospace; }
.edtb-vitals { display:grid; grid-template-columns:repeat(4, 1fr); gap:4px; margin-top:2px; }
.edtb-vital-cell { display:flex; flex-direction:column; align-items:center; background:#081628; border:1px solid rgba(26,53,85,.6); border-radius:5px; padding:4px 2px; }
.edtb-vital-val { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; color:#e8f0fe; }
.edtb-vital-val.abn { color:#ff6b6b; animation:edtb-glow 2s ease-in-out infinite; }
.edtb-vital-lbl { font-size:7px; color:#5a82a8; text-transform:uppercase; letter-spacing:.05em; margin-top:1px; }
@keyframes edtb-glow { 0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)} }
.edtb-card-foot { padding:6px 14px 10px; display:flex; align-items:center; gap:6px; border-top:1px solid rgba(26,53,85,.3); }
.edtb-status-chip { font-size:9px; font-weight:700; font-family:'JetBrains Mono',monospace; padding:2px 8px; border-radius:12px; white-space:nowrap; }
.edtb-status-triage { background:rgba(155,109,255,.1); color:#9b6dff; border:1px solid rgba(155,109,255,.25); }
.edtb-status-waiting { background:rgba(245,200,66,.08); color:#f5c842; border:1px solid rgba(245,200,66,.2); }
.edtb-status-workup { background:rgba(59,158,255,.1); color:#3b9eff; border:1px solid rgba(59,158,255,.25); }
.edtb-status-results { background:rgba(0,229,192,.08); color:#00e5c0; border:1px solid rgba(0,229,192,.2); }
.edtb-status-ready { background:rgba(61,255,160,.08); color:#3dffa0; border:1px solid rgba(61,255,160,.2); }
.edtb-status-discharged { background:rgba(90,130,168,.08); color:#5a82a8; border:1px solid rgba(90,130,168,.2); }
.edtb-los { margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10px; color:#5a82a8; }
.edtb-los.warn { color:#f5c842; }
.edtb-los.over { color:#ff6b6b; }
.edtb-card-acts { display:flex; gap:4px; margin-left:4px; }
.edtb-act { width:26px; height:26px; border-radius:5px; border:1px solid #1a3555; background:#0e2544; color:#8aaccc; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; flex-shrink:0; }
.edtb-act:hover { border-color:#2a4f7a; color:#f2f7ff; }

/* MODAL */
.edtb-modal-overlay { position:fixed; inset:0; background:rgba(5,15,30,.85); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
.edtb-modal { background:#081628; border:1px solid #1a3555; border-radius:16px; width:520px; max-width:95vw; max-height:85vh; overflow-y:auto; box-shadow:0 24px 80px rgba(0,0,0,.6); }
.edtb-modal-hdr { padding:16px 20px 12px; border-bottom:1px solid #1a3555; display:flex; align-items:center; gap:10px; }
.edtb-modal-body { padding:16px 20px 20px; display:flex; flex-direction:column; gap:12px; }
.edtb-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.edtb-field { display:flex; flex-direction:column; gap:3px; }
.edtb-lbl { font-size:8px; color:#7aa0c0; text-transform:uppercase; letter-spacing:.07em; font-family:'JetBrains Mono',monospace; font-weight:600; }
.edtb-input, .edtb-select { background:#0e2544; border:1px solid #1a3555; border-radius:7px; padding:7px 10px; color:#f2f7ff; font-family:'DM Sans',sans-serif; font-size:12px; outline:none; width:100%; transition:border-color .15s; }
.edtb-input:focus, .edtb-select:focus { border-color:#2a4f7a; }
.edtb-input::placeholder { color:#4a6a8a; }
.edtb-select option { background:#0b1e36; }

/* EMPTY */
.edtb-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:12px; color:#4a6a8a; padding:40px; }
.edtb-empty-icon { font-size:48px; opacity:.3; }

/* LOAD */
.edtb-load { height:2px; flex-shrink:0; background:linear-gradient(90deg,#00e5c0,#3b9eff,#00e5c0); background-size:200% auto; animation:edtb-sweep 1.4s linear infinite; }
@keyframes edtb-sweep { to { background-position:200% center; } }
`;
  document.head.appendChild(s);
})();

const ESI_LABELS = { 1:"ESI 1", 2:"ESI 2", 3:"ESI 3", 4:"ESI 4", 5:"ESI 5" };
const STATUS_OPTS = ["Triage","Waiting","Workup","Awaiting Results","Ready to Dispo","Discharged"];
const STATUS_CLS  = {
  "Triage":"triage","Waiting":"waiting","Workup":"workup",
  "Awaiting Results":"results","Ready to Dispo":"ready","Discharged":"discharged",
};
const FILTER_OPTS = ["All","ESI 1","ESI 2","ESI 3","ESI 4","ESI 5","Triage","Waiting","Workup","Awaiting Results","Ready to Dispo","Discharged"];

const DEMO_PATIENTS = [
  { id:"1", name:"John Hartwell",    room:"1A",  esi:1, cc:"Chest pain / STEMI",        age:67, sex:"M", status:"Workup",            bp:"88/50",  hr:"118", rr:"22", spo2:"91", arrivalMins:42 },
  { id:"2", name:"Maria Gonzalez",   room:"2B",  esi:2, cc:"Respiratory distress",       age:74, sex:"F", status:"Awaiting Results",  bp:"148/92", hr:"104", rr:"28", spo2:"88", arrivalMins:65 },
  { id:"3", name:"Tyler Brink",      room:"3C",  esi:3, cc:"Abdominal pain / RLQ",       age:29, sex:"M", status:"Workup",            bp:"122/78", hr:"96",  rr:"16", spo2:"98", arrivalMins:90 },
  { id:"4", name:"Susan Patel",      room:"4A",  esi:3, cc:"Syncope",                    age:55, sex:"F", status:"Awaiting Results",  bp:"102/64", hr:"88",  rr:"14", spo2:"97", arrivalMins:110 },
  { id:"5", name:"James O'Brien",    room:"5B",  esi:4, cc:"Laceration — R hand",        age:34, sex:"M", status:"Waiting",           bp:"130/82", hr:"78",  rr:"14", spo2:"99", arrivalMins:25 },
  { id:"6", name:"Linda Chen",       room:"6C",  esi:2, cc:"Altered mental status",      age:81, sex:"F", status:"Workup",            bp:"178/98", hr:"112", rr:"18", spo2:"94", arrivalMins:55 },
  { id:"7", name:"Marcus Reed",      room:"7A",  esi:3, cc:"Headache",                   age:44, sex:"M", status:"Triage",            bp:"186/110",hr:"90",  rr:"16", spo2:"98", arrivalMins:8  },
  { id:"8", name:"Priya Sharma",     room:"8B",  esi:4, cc:"UTI",                        age:23, sex:"F", status:"Ready to Dispo",    bp:"118/72", hr:"82",  rr:"15", spo2:"99", arrivalMins:140 },
  { id:"9", name:"George Flanagan",  room:"9C",  esi:5, cc:"Medication refill",          age:62, sex:"M", status:"Ready to Dispo",    bp:"124/80", hr:"70",  rr:"14", spo2:"99", arrivalMins:155 },
  { id:"10",name:"Rachel Kim",       room:"10A", esi:2, cc:"Stroke symptoms",            age:70, sex:"F", status:"Workup",            bp:"192/108",hr:"96",  rr:"18", spo2:"95", arrivalMins:30 },
  { id:"11",name:"David Torres",     room:"11B", esi:3, cc:"Asthma exacerbation",        age:19, sex:"M", status:"Awaiting Results",  bp:"130/84", hr:"108", rr:"24", spo2:"93", arrivalMins:75 },
  { id:"12",name:"Carol Jennings",   room:"Triage",esi:3,cc:"Nausea / vomiting",        age:38, sex:"F", status:"Triage",            bp:"",       hr:"",    rr:"",   spo2:"",   arrivalMins:3  },
];

function losStr(mins) {
  if (!mins && mins !== 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function losCls(mins) {
  if (mins > 240) return "over";
  if (mins > 120) return "warn";
  return "";
}

function isAbnVital(key, val) {
  const n = parseInt(val);
  if (isNaN(n)) return false;
  if (key === "hr"  && (n > 120 || n < 50)) return true;
  if (key === "spo2" && n < 94) return true;
  if (key === "rr"  && (n > 20 || n < 10)) return true;
  return false;
}

export default function EDTrackingBoard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState(DEMO_PATIENTS);
  const [filter, setFilter] = useState("All");
  const [clock, setClock] = useState("");
  const [loading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editPt, setEditPt] = useState(null);
  const [form, setForm] = useState({ name:"", room:"", esi:"3", cc:"", age:"", sex:"", status:"Triage", bp:"", hr:"", rr:"", spo2:"" });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Tick arrival minutes every minute
  useEffect(() => {
    const id = setInterval(() => {
      setPatients(prev => prev.map(p => ({ ...p, arrivalMins: (p.arrivalMins || 0) + 1 })));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const filtered = patients.filter(p => {
    if (filter === "All") return true;
    if (filter.startsWith("ESI")) return p.esi === parseInt(filter.split(" ")[1]);
    return p.status === filter;
  });

  const counts = {
    total: patients.length,
    critical: patients.filter(p => p.esi <= 2).length,
    waiting: patients.filter(p => p.status === "Waiting" || p.status === "Triage").length,
    ready: patients.filter(p => p.status === "Ready to Dispo").length,
  };

  const openAdd = () => {
    setForm({ name:"", room:"", esi:"3", cc:"", age:"", sex:"", status:"Triage", bp:"", hr:"", rr:"", spo2:"" });
    setEditPt(null);
    setShowAdd(true);
  };

  const openEdit = (pt, e) => {
    e.stopPropagation();
    setForm({ name:pt.name, room:pt.room, esi:String(pt.esi), cc:pt.cc, age:String(pt.age||""), sex:pt.sex||"", status:pt.status, bp:pt.bp||"", hr:pt.hr||"", rr:pt.rr||"", spo2:pt.spo2||"" });
    setEditPt(pt);
    setShowAdd(true);
  };

  const saveForm = () => {
    if (!form.name.trim()) return;
    if (editPt) {
      setPatients(prev => prev.map(p => p.id === editPt.id ? {
        ...p, name:form.name, room:form.room, esi:parseInt(form.esi)||3, cc:form.cc,
        age:form.age, sex:form.sex, status:form.status,
        bp:form.bp, hr:form.hr, rr:form.rr, spo2:form.spo2,
      } : p));
    } else {
      setPatients(prev => [...prev, {
        id: String(Date.now()), name:form.name, room:form.room, esi:parseInt(form.esi)||3,
        cc:form.cc, age:form.age, sex:form.sex, status:form.status,
        bp:form.bp, hr:form.hr, rr:form.rr, spo2:form.spo2, arrivalMins:0,
      }]);
    }
    setShowAdd(false);
  };

  const removePt = (id, e) => { e.stopPropagation(); setPatients(prev => prev.filter(p => p.id !== id)); };

  const cycleStatus = (id, e) => {
    e.stopPropagation();
    setPatients(prev => prev.map(p => {
      if (p.id !== id) return p;
      const idx = STATUS_OPTS.indexOf(p.status);
      return { ...p, status: STATUS_OPTS[(idx + 1) % STATUS_OPTS.length] };
    }));
  };

  const openStudio = (pt, e) => {
    e.stopPropagation();
    navigate("/ClinicalNoteStudio", {
      state: {
        patientData: {
          demo: { firstName: pt.name.split(" ")[0], lastName: pt.name.split(" ").slice(1).join(" "), age: String(pt.age||""), sex: pt.sex },
          cc: { text: pt.cc },
          vitals: { bp: pt.bp, hr: pt.hr, rr: pt.rr, spo2: pt.spo2 },
          esiLevel: String(pt.esi),
          registration: { room: pt.room },
          medications: [], allergies: [],
        },
      },
    });
  };

  return (
    <div className="edtb">
      {loading && <div className="edtb-load" />}

      {/* TOP BAR */}
      <div className="edtb-top">
        <span className="edtb-logo">ED Tracking Board</span>
        <span className="edtb-badge">LIVE</span>
        <div className="edtb-top-stats">
          <div className="edtb-stat"><span className="edtb-stat-val" style={{color:"#f2f7ff"}}>{counts.total}</span><span className="edtb-stat-lbl">Total</span></div>
          <div className="edtb-stat"><span className="edtb-stat-val" style={{color:"#ff6b6b"}}>{counts.critical}</span><span className="edtb-stat-lbl">Critical</span></div>
          <div className="edtb-stat"><span className="edtb-stat-val" style={{color:"#f5c842"}}>{counts.waiting}</span><span className="edtb-stat-lbl">Waiting</span></div>
          <div className="edtb-stat"><span className="edtb-stat-val" style={{color:"#3dffa0"}}>{counts.ready}</span><span className="edtb-stat-lbl">Ready</span></div>
        </div>
        <div className="edtb-spacer" />
        <div className="edtb-clock">{clock}</div>
        <button className="edtb-btn edtb-btn-ghost" onClick={() => navigate("/NewPatientInput")}>← New Patient Input</button>
        <button className="edtb-btn edtb-btn-teal" onClick={openAdd}>+ Add Patient</button>
      </div>

      {/* FILTERS */}
      <div className="edtb-filters">
        {FILTER_OPTS.map((f, i) => (
          <>
            {i === 6 && <div key="sep" className="edtb-filter-sep" />}
            <button key={f} className={`edtb-filter-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          </>
        ))}
      </div>

      {/* BOARD */}
      <div className="edtb-board">
        {filtered.length === 0 ? (
          <div className="edtb-empty">
            <div className="edtb-empty-icon">🏥</div>
            <div style={{fontSize:14,color:"#7aa0c0"}}>No patients matching this filter</div>
          </div>
        ) : (
          <div className="edtb-grid">
            {filtered.sort((a, b) => a.esi - b.esi).map(pt => (
              <div key={pt.id} className={`edtb-card esi-${pt.esi}`} onClick={(e) => openStudio(pt, e)}>
                <div className="edtb-card-hdr">
                  <span className={`edtb-esi-badge edtb-esi-${pt.esi}`}>{ESI_LABELS[pt.esi]}</span>
                  <span className="edtb-pt-name">{pt.name}</span>
                  {pt.room && <span className="edtb-room-badge">Rm {pt.room}</span>}
                </div>
                <div className="edtb-card-body">
                  {pt.cc && <div className="edtb-cc">{pt.cc}</div>}
                  <div className="edtb-meta">
                    {pt.age && <span className="edtb-meta-chip">{pt.age}y</span>}
                    {pt.sex && <span className="edtb-meta-chip">{pt.sex}</span>}
                    <span className="edtb-meta-chip">LOS {losStr(pt.arrivalMins)}</span>
                  </div>
                  {(pt.bp || pt.hr || pt.rr || pt.spo2) && (
                    <div className="edtb-vitals">
                      {[["BP",pt.bp,"bp"],["HR",pt.hr,"hr"],["RR",pt.rr,"rr"],["SpO₂",pt.spo2,"spo2"]].map(([lbl,val,key]) => (
                        <div key={lbl} className="edtb-vital-cell">
                          <span className={`edtb-vital-val${isAbnVital(key,val) ? " abn" : ""}`}>{val || "—"}</span>
                          <span className="edtb-vital-lbl">{lbl}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="edtb-card-foot">
                  <span className={`edtb-status-chip edtb-status-${STATUS_CLS[pt.status] || "waiting"}`}>{pt.status}</span>
                  <span className={`edtb-los ${losCls(pt.arrivalMins)}`}>{losStr(pt.arrivalMins)}</span>
                  <div className="edtb-card-acts" onClick={e => e.stopPropagation()}>
                    <button className="edtb-act" title="Advance status" onClick={(e) => cycleStatus(pt.id, e)}>→</button>
                    <button className="edtb-act" title="Edit" onClick={(e) => openEdit(pt, e)}>✎</button>
                    <button className="edtb-act" title="Open Note Studio" style={{color:"#00e5c0"}} onClick={(e) => openStudio(pt, e)}>📝</button>
                    <button className="edtb-act" title="Remove" style={{color:"#ff6b6b"}} onClick={(e) => removePt(pt.id, e)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showAdd && (
        <div className="edtb-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="edtb-modal" onClick={e => e.stopPropagation()}>
            <div className="edtb-modal-hdr">
              <span style={{fontSize:18}}>{editPt ? "✎" : "+"}</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>{editPt ? "Edit Patient" : "Add Patient"}</span>
              <button className="edtb-btn edtb-btn-ghost" style={{marginLeft:"auto"}} onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="edtb-modal-body">
              <div className="edtb-row">
                <div className="edtb-field" style={{gridColumn:"1/-1"}}>
                  <div className="edtb-lbl">Patient Name *</div>
                  <input className="edtb-input" placeholder="First Last" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
                </div>
              </div>
              <div className="edtb-row">
                <div className="edtb-field">
                  <div className="edtb-lbl">Room</div>
                  <input className="edtb-input" placeholder="e.g. 3A" value={form.room} onChange={e => setForm(f => ({...f, room:e.target.value}))} />
                </div>
                <div className="edtb-field">
                  <div className="edtb-lbl">ESI Level</div>
                  <select className="edtb-select" value={form.esi} onChange={e => setForm(f => ({...f, esi:e.target.value}))}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>ESI {n}</option>)}
                  </select>
                </div>
              </div>
              <div className="edtb-field">
                <div className="edtb-lbl">Chief Complaint</div>
                <input className="edtb-input" placeholder="e.g. Chest pain" value={form.cc} onChange={e => setForm(f => ({...f, cc:e.target.value}))} />
              </div>
              <div className="edtb-row">
                <div className="edtb-field">
                  <div className="edtb-lbl">Age</div>
                  <input className="edtb-input" placeholder="e.g. 45" value={form.age} onChange={e => setForm(f => ({...f, age:e.target.value}))} />
                </div>
                <div className="edtb-field">
                  <div className="edtb-lbl">Sex</div>
                  <select className="edtb-select" value={form.sex} onChange={e => setForm(f => ({...f, sex:e.target.value}))}>
                    <option value="">—</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="edtb-field">
                <div className="edtb-lbl">Status</div>
                <select className="edtb-select" value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#5a82a8",letterSpacing:2,textTransform:"uppercase",marginBottom:-6}}>Vitals (optional)</div>
              <div className="edtb-row">
                <div className="edtb-field"><div className="edtb-lbl">BP</div><input className="edtb-input" placeholder="120/80" value={form.bp} onChange={e => setForm(f => ({...f, bp:e.target.value}))} /></div>
                <div className="edtb-field"><div className="edtb-lbl">HR</div><input className="edtb-input" placeholder="72" value={form.hr} onChange={e => setForm(f => ({...f, hr:e.target.value}))} /></div>
                <div className="edtb-field"><div className="edtb-lbl">RR</div><input className="edtb-input" placeholder="16" value={form.rr} onChange={e => setForm(f => ({...f, rr:e.target.value}))} /></div>
                <div className="edtb-field"><div className="edtb-lbl">SpO₂</div><input className="edtb-input" placeholder="98" value={form.spo2} onChange={e => setForm(f => ({...f, spo2:e.target.value}))} /></div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:4}}>
                <button className="edtb-btn edtb-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="edtb-btn edtb-btn-teal" onClick={saveForm}>{editPt ? "💾 Update" : "✦ Add Patient"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}