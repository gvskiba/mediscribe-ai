import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import SepsisPredictionDashboard from "../components/sepsis/SepsisPredictionDashboard";

const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040",
};

// ── Mock patients (replace with base44.entities.ClinicalNote.list()) ──
const MOCK_PATIENTS = [
  { id:"n1", name:"Margaret T. Sullivan", age:67, sex:"F", cc:"Chest pain, diaphoresis", triage:"ESI-2", room:"TR-1", provider:"Dr. Rivera", status:"critical", arrived:"08:14", los:"2h 18m", noteId:"n1", vitals:{ hr:108, sbp:88, spo2:94, temp:98.6 }, flags:["Critical labs","EKG pending"] },
  { id:"n2", name:"James K. Okonkwo",    age:52, sex:"M", cc:"Shortness of breath",     triage:"ESI-2", room:"B-4",  provider:"Dr. Rivera", status:"urgent",   arrived:"08:41", los:"1h 51m", noteId:"n2", vitals:{ hr:118, sbp:142, spo2:91, temp:99.1 }, flags:["O₂ req"] },
  { id:"n3", name:"Priya S. Nair",        age:34, sex:"F", cc:"Abdominal pain x 2 days", triage:"ESI-3", room:"C-2",  provider:"Dr. Rivera", status:"active",   arrived:"09:02", los:"1h 30m", noteId:"n3", vitals:{ hr:88, sbp:118, spo2:99, temp:100.4 }, flags:["CT ordered"] },
  { id:"n4", name:"Robert L. Castillo",   age:71, sex:"M", cc:"Syncope, witnessed fall",  triage:"ESI-2", room:"B-6",  provider:"Dr. Rivera", status:"urgent",   arrived:"09:28", los:"1h 04m", noteId:"n4", vitals:{ hr:52, sbp:102, spo2:97, temp:98.2 }, flags:["HR critical","Neuro consult"] },
  { id:"n5", name:"Amara O. Mensah",      age:28, sex:"F", cc:"Headache, photophobia",    triage:"ESI-3", room:"C-5",  provider:"Dr. Rivera", status:"active",   arrived:"09:55", los:"0h 37m", noteId:"n5", vitals:{ hr:76, sbp:124, spo2:100,temp:98.8 }, flags:[] },
  { id:"n6", name:"William B. Torres",    age:45, sex:"M", cc:"Laceration, right hand",   triage:"ESI-4", room:"Fast", provider:"Dr. Rivera", status:"stable",   arrived:"10:05", los:"0h 27m", noteId:"n6", vitals:{ hr:82, sbp:128, spo2:99, temp:98.4 }, flags:[] },
  { id:"n7", name:"Linda S. Shah",        age:60, sex:"F", cc:"UTI symptoms, fever",       triage:"ESI-3", room:"C-8",  provider:"Dr. Rivera", status:"active",   arrived:"10:18", los:"0h 14m", noteId:"n7", vitals:{ hr:95, sbp:108, spo2:98, temp:101.2 }, flags:["Fever"] },
];

const STATUS_CONFIG = {
  critical: { color:C.red,    bg:"rgba(255,92,108,.13)",  dot:"#ff5c6c", label:"CRITICAL" },
  urgent:   { color:C.amber,  bg:"rgba(245,166,35,.11)",  dot:"#f5a623", label:"URGENT"   },
  active:   { color:C.blue,   bg:"rgba(74,144,217,.1)",   dot:"#4a90d9", label:"ACTIVE"   },
  stable:   { color:C.green,  bg:"rgba(46,204,113,.09)",  dot:"#2ecc71", label:"STABLE"   },
};

const TRIAGE_COLOR = {
  "ESI-1":"#ff5c6c","ESI-2":"#f5a623","ESI-3":"#f0c040","ESI-4":"#2ecc71","ESI-5":"#4a7299",
};

// ── App navigation pages ───────────────────────────────────────────
const APP_PAGES = [
  {
    page:"NoteCreationHub", icon:"✦", label:"Note Creation",
    sub:"Templates · Transcription · Detailed",
    color:C.teal, desc:"Start a new note using your preferred workflow",
    shortcut:"N",
  },
  {
    page:"ClinicalNoteStudio", icon:"📝", label:"Note Studio",
    sub:"SOAP · AI Assist · Sign",
    color:C.blue, desc:"Full structured note editor with AI analysis",
    shortcut:"S",
  },
  {
    page:"DiagnosticStewardship", icon:"🔬", label:"Diagnostic Stewardship",
    sub:"Guideline orders · AI analysis",
    color:C.purple, desc:"Generate evidence-based order sets from clinical data",
    shortcut:"D",
  },
  {
    page:"Results", icon:"🧪", label:"Results",
    sub:"Labs · Imaging · EKG",
    color:C.amber, desc:"Enter and AI-analyze patient results with flagging",
    shortcut:"R",
  },
  {
    page:"DrugsBugs", icon:"💊", label:"Drugs & Bugs",
    sub:"Reference · Sepsis · Peds",
    color:C.green, desc:"ED drug reference, antibiotic stewardship, pediatric dosing",
    shortcut:"B",
  },
  {
    page:"UserPreferences", icon:"⚙️", label:"Account",
    sub:"Profile · Security · Preferences",
    color:C.dim, desc:"Manage your profile, credentials, and settings",
    shortcut:"A",
  },
];

// ── Vital flag helper ──────────────────────────────────────────────
function vitalColor(key, val) {
  if (!val) return C.dim;
  if (key==="hr")  return (val>100||val<60) ? C.amber : C.green;
  if (key==="sbp") return (val<90||val>180) ? C.red   : val<100 ? C.amber : C.green;
  if (key==="spo2")return val<94 ? C.red : val<97 ? C.amber : C.green;
  if (key==="temp")return val>100.4 ? C.amber : C.green;
  return C.green;
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [clock, setClock]     = useState("");
  const [date, setDate]       = useState("");
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState("triage"); // triage | los | room | name

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}));
      setDate(now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName==="INPUT") return;
      const page = APP_PAGES.find(p => p.shortcut === e.key.toUpperCase());
      if (page) navigate(createPageUrl(page.page));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // Real data fetch (falls back to mock)
  const { data: liveNotes } = useQuery({
    queryKey: ["activeNotes"],
    queryFn: () => base44.entities.ClinicalNote.filter({ status: "draft" }, { limit: 20 }),
    retry: false,
  });

  const patients = (liveNotes && liveNotes.length > 0)
    ? liveNotes.map(n => ({
        id: n.id,
        name: n.patient_name || "Unknown Patient",
        age: n.patient_age || "—",
        sex: n.patient_sex || "—",
        cc: n.chief_complaint || "—",
        triage: n.triage_level || "ESI-3",
        room: n.room || "—",
        provider: n.provider || "—",
        status: n.status === "draft" ? "active" : "stable",
        arrived: n.created_date ? new Date(n.created_date).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false}) : "—",
        los: "—",
        noteId: n.id,
        vitals: n.vitals || { hr:null, sbp:null, spo2:null, temp:null },
        flags: [],
      }))
    : MOCK_PATIENTS;

  // Filter + sort
  const filtered = patients
    .filter(p => {
      const q = search.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.room.toLowerCase().includes(q) || p.cc.toLowerCase().includes(q);
      const matchS = filterStatus==="all" || p.status===filterStatus;
      return matchQ && matchS;
    })
    .sort((a,b) => {
      if (sortKey==="triage") return a.triage.localeCompare(b.triage);
      if (sortKey==="los")    return b.los.localeCompare(a.los);
      if (sortKey==="room")   return a.room.localeCompare(b.room);
      if (sortKey==="name")   return a.name.localeCompare(b.name);
      return 0;
    });

  // Stats
  const stats = {
    total:    patients.length,
    critical: patients.filter(p=>p.status==="critical").length,
    urgent:   patients.filter(p=>p.status==="urgent").length,
    flags:    patients.reduce((n,p)=>n+p.flags.length,0),
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.navy, minHeight:"100vh", color:C.text, display:"flex", flexDirection:"column", marginLeft:72 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
        ::-webkit-scrollbar{height:4px;width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input:focus{outline:none;border-color:#4a7299 !important}
        input::placeholder{color:#2a4d72}
        button{transition:all .15s}
        .patient-row:hover{background:rgba(0,212,188,.05) !important;border-color:rgba(0,212,188,.3) !important;cursor:pointer}
        .patient-row:hover .row-arrow{opacity:1 !important;transform:translateX(0) !important}
        .nav-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.3)}
        .nav-card:hover .nav-arrow{opacity:1 !important}
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════ */}
      <nav style={{ height:52, background:"rgba(11,29,53,.97)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0, position:"sticky", top:0, zIndex:200 }}>
        {/* Logo */}
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright, letterSpacing:"-.02em" }}>Notrya</span>
        <div style={{ width:1, height:16, background:C.border }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal, letterSpacing:".14em" }}>COMMAND CENTER</span>

        <div style={{ flex:1 }} />

        {/* Live status */}
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:8, background:"rgba(0,212,188,.07)", border:"1px solid rgba(0,212,188,.2)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:C.teal, animation:"blink 1.4s infinite" }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.teal }}>{stats.total} ACTIVE PATIENTS</span>
        </div>

        {stats.critical > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 11px", borderRadius:8, background:"rgba(255,92,108,.1)", border:"1px solid rgba(255,92,108,.3)", animation:"pulse 1.8s infinite" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.red }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.red }}>{stats.critical} CRITICAL</span>
          </div>
        )}

        <div style={{ width:1, height:16, background:C.border }} />

        {/* Clock */}
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:C.bright, letterSpacing:".04em", lineHeight:1 }}>{clock}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:2 }}>{date}</div>
        </div>
      </nav>

      <div style={{ flex:1, padding:"24px 28px 40px", maxWidth:1440, margin:"0 auto", width:"100%" }}>

        {/* ══════════════════════════════════════════════════════
            SEPSIS PREDICTION DASHBOARD
        ══════════════════════════════════════════════════════ */}
        <SepsisPredictionDashboard 
          patients={liveNotes || MOCK_PATIENTS} 
          onPatientClick={(p) => navigate(`${createPageUrl("ClinicalNoteStudio")}?noteId=${p.id || p.noteId}`)} 
        />

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — ACTIVE PATIENT LIST
        ══════════════════════════════════════════════════════ */}
        <div style={{ marginBottom:36 }}>

          {/* Section header row */}
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:C.bright, letterSpacing:"-.02em", lineHeight:1.1 }}>Active Patients</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:3, letterSpacing:".08em" }}>TAP ANY ROW → OPENS ACTIVE NOTE IN STUDIO</div>
            </div>

            {/* Stat pills */}
            <div style={{ display:"flex", gap:7, marginLeft:8 }}>
              {[
                { label:`${stats.total} Total`,    c:C.dim   },
                { label:`${stats.critical} Critical`, c:C.red   },
                { label:`${stats.urgent} Urgent`,  c:C.amber },
                { label:`${stats.flags} Flags`,    c:C.rose  },
              ].map(s => (
                <div key={s.label} style={{ padding:"3px 10px", borderRadius:8, background:`${s.c}14`, border:`1px solid ${s.c}35`, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:s.c }}>
                  {s.label}
                </div>
              ))}
            </div>

            <div style={{ flex:1 }} />

            {/* Search */}
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search patient, room, CC…"
                style={{ background:C.edge, border:`1px solid ${C.border}`, borderRadius:9, padding:"7px 12px 7px 32px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12, width:220 }}
              />
            </div>

            {/* Filter */}
            <div style={{ display:"flex", gap:4 }}>
              {["all","critical","urgent","active","stable"].map(s => (
                <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:"5px 11px", borderRadius:8, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer", letterSpacing:".06em", background: filterStatus===s ? `${s==="all"?C.teal:STATUS_CONFIG[s]?.color||C.teal}22` : "transparent", border:`1px solid ${filterStatus===s ? `${s==="all"?C.teal:STATUS_CONFIG[s]?.color||C.teal}55` : C.border}`, color: filterStatus===s ? (s==="all"?C.teal:STATUS_CONFIG[s]?.color||C.teal) : C.muted }}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* New note */}
            <button onClick={()=>navigate(createPageUrl("NoteCreationHub"))} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy }}>
              + New Note
            </button>
          </div>

          {/* ── Table header ── */}
          <div style={{ display:"grid", gridTemplateColumns:"34px 2fr 80px 90px 80px 180px 200px 160px 120px 40px", gap:0, padding:"6px 14px", borderRadius:"10px 10px 0 0", background:C.slate, border:`1px solid ${C.border}`, borderBottom:"none" }}>
            {[
              { key:"status", label:"" },
              { key:"name",   label:"PATIENT" },
              { key:"room",   label:"ROOM" },
              { key:"triage", label:"TRIAGE" },
              { key:"los",    label:"LOS" },
              { key:"cc",     label:"CHIEF COMPLAINT" },
              { key:"vitals", label:"VITALS" },
              { key:"flags",  label:"FLAGS" },
              { key:"status2",label:"STATUS" },
              { key:"arrow",  label:"" },
            ].map(col => (
              <div key={col.key} onClick={()=>col.key!=="status"&&col.key!=="arrow"&&col.key!=="vitals"&&col.key!=="flags"&&col.key!=="status2"&&col.key!=="cc"&&setSortKey(col.key)} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color: sortKey===col.key ? C.teal : C.muted, letterSpacing:".12em", cursor:["name","room","triage","los"].includes(col.key)?"pointer":"default", userSelect:"none", display:"flex", alignItems:"center", gap:3 }}>
                {col.label}
                {sortKey===col.key && <span style={{ color:C.teal }}>↑</span>}
              </div>
            ))}
          </div>

          {/* ── Patient rows ── */}
          <div style={{ border:`1px solid ${C.border}`, borderRadius:"0 0 12px 12px", overflow:"hidden" }}>
            <AnimatePresence>
              {filtered.map((p, i) => {
                const sc = STATUS_CONFIG[p.status];
                const isSelected = selected===p.id;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity:0, y:-4 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay:i*.03, duration:.15 }}
                    className="patient-row"
                    onClick={() => { setSelected(p.id); navigate(`${createPageUrl("ClinicalNoteStudio")}?noteId=${p.noteId}`); }}
                    style={{
                      display:"grid",
                      gridTemplateColumns:"34px 2fr 80px 90px 80px 180px 200px 160px 120px 40px",
                      gap:0,
                      padding:"11px 14px",
                      background: isSelected ? "rgba(0,212,188,.06)" : i%2===0 ? C.panel : `rgba(11,29,53,.6)`,
                      borderBottom: i < filtered.length-1 ? `1px solid ${C.border}` : "none",
                      transition:"all .15s",
                      alignItems:"center",
                    }}
                  >
                    {/* Status dot */}
                    <div style={{ display:"flex", justifyContent:"center" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:sc.dot, animation:p.status==="critical"?"pulse 1.2s infinite":"none", boxShadow:`0 0 ${p.status==="critical"?8:4}px ${sc.dot}` }} />
                    </div>

                    {/* Name */}
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:C.bright, letterSpacing:"-.01em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:2 }}>{p.age}y {p.sex} · {p.arrived}</div>
                    </div>

                    {/* Room */}
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:C.text }}>{p.room}</div>

                    {/* Triage */}
                    <div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6, background:`${TRIAGE_COLOR[p.triage]}18`, border:`1px solid ${TRIAGE_COLOR[p.triage]}44`, color:TRIAGE_COLOR[p.triage] }}>
                        {p.triage}
                      </span>
                    </div>

                    {/* LOS */}
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim }}>{p.los}</div>

                    {/* CC */}
                    <div style={{ fontSize:11, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", paddingRight:8 }}>{p.cc}</div>

                    {/* Vitals */}
                    <div style={{ display:"flex", gap:6 }}>
                      {[
                        { k:"hr",   label:"HR",   val:p.vitals.hr,   unit:"" },
                        { k:"sbp",  label:"BP",   val:p.vitals.sbp,  unit:"" },
                        { k:"spo2", label:"SpO₂", val:p.vitals.spo2, unit:"%" },
                      ].map(v => {
                        const vc = vitalColor(v.k, v.val);
                        return (
                          <div key={v.k} style={{ textAlign:"center" }}>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:vc, lineHeight:1 }}>{v.val}{v.unit}</div>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:C.muted, marginTop:1 }}>{v.label}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Flags */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                      {p.flags.slice(0,2).map(f => (
                        <span key={f} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 5px", borderRadius:5, background:"rgba(245,166,35,.12)", border:"1px solid rgba(245,166,35,.3)", color:C.amber, whiteSpace:"nowrap" }}>{f}</span>
                      ))}
                    </div>

                    {/* Status badge */}
                    <div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:7, background:sc.bg, border:`1px solid ${sc.color}40`, color:sc.color }}>
                        {sc.label}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="row-arrow" style={{ display:"flex", justifyContent:"center", opacity:.2, transform:"translateX(-4px)", transition:"all .15s" }}>
                      <span style={{ color:C.teal, fontSize:14, fontWeight:700 }}>→</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div style={{ padding:"32px", textAlign:"center", color:C.muted, fontSize:12, background:C.panel }}>
                No patients match your filter.
              </div>
            )}
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — APP NAVIGATION
        ══════════════════════════════════════════════════════ */}
        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:16 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:C.bright, letterSpacing:"-.02em" }}>Quick Navigation</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, letterSpacing:".08em" }}>KEYBOARD SHORTCUTS ACTIVE</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
            {APP_PAGES.map((p, i) => (
              <motion.div
                key={p.page}
                className="nav-card"
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:.05 + i*.05, duration:.2 }}
                onClick={() => navigate(createPageUrl(p.page))}
                style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 16px 16px", cursor:"pointer", transition:"all .18s", position:"relative", overflow:"hidden" }}
              >
                {/* Color top accent */}
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${p.color},${p.color}44)` }} />

                {/* Keyboard shortcut badge */}
                <div style={{ position:"absolute", top:10, right:12, fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:5, background:`${p.color}14`, border:`1px solid ${p.color}30`, color:p.color, opacity:.7 }}>
                  {p.shortcut}
                </div>

                {/* Icon */}
                <div style={{ fontSize:26, marginBottom:10, lineHeight:1 }}>{p.icon}</div>

                {/* Label */}
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:C.bright, marginBottom:3, letterSpacing:"-.01em", lineHeight:1.2 }}>{p.label}</div>

                {/* Sub */}
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:p.color, letterSpacing:".07em", marginBottom:8, opacity:.85 }}>{p.sub}</div>

                {/* Desc */}
                <div style={{ fontSize:11, color:C.dim, lineHeight:1.55 }}>{p.desc}</div>

                {/* Arrow */}
                <div className="nav-arrow" style={{ position:"absolute", bottom:14, right:14, color:p.color, fontSize:14, fontWeight:700, opacity:0, transition:"opacity .15s" }}>→</div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}