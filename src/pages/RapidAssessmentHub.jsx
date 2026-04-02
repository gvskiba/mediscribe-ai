import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

// ── Font Injection ────────────────────────────────────────────────────
(() => {
  if (document.getElementById("rapid-fonts")) return;
  const l = document.createElement("link");
  l.id = "rapid-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "rapid-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulseAlert{0%,100%{opacity:1}50%{opacity:.55}}
    .fade-in{animation:fadeSlide .25s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff6b6b 52%,#f5c842 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .cc-row{transition:background .12s,border-color .12s;}
    .cc-row:hover{background:rgba(14,37,68,0.85)!important;border-color:rgba(42,79,122,0.5)!important;}
    .phase-card{transition:transform .15s;}
    .phase-card:hover{transform:translateY(-1px);}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", orange:"#ff9f43", yellow:"#f5c842", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b", cyan:"#00d4ff",
};
const glass = {backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.75)",border:"1px solid rgba(42,79,122,0.35)",borderRadius:16};

const ESI_META = {
  1:{color:T.red,   label:"Immediate",  tc:"#fff"},
  2:{color:T.orange,label:"Emergent",   tc:"#fff"},
  3:{color:T.yellow,label:"Urgent",     tc:"#050f1e"},
  4:{color:T.blue,  label:"Less Urgent",tc:"#fff"},
  5:{color:T.green, label:"Non-Urgent", tc:"#050f1e"},
};

const CATEGORIES = [
  {id:"all",       label:"All",        color:T.txt3},
  {id:"cardiac",   label:"Cardiac",    color:T.coral},
  {id:"pulmonary", label:"Pulmonary",  color:T.blue},
  {id:"neuro",     label:"Neuro",      color:T.purple},
  {id:"gi",        label:"GI",         color:T.orange},
  {id:"infectious",label:"Infectious", color:T.teal},
  {id:"trauma",    label:"Trauma",     color:T.red},
  {id:"tox",       label:"Tox",        color:T.yellow},
  {id:"peds",      label:"Peds",       color:T.green},
  {id:"msk",       label:"MSK",        color:T.cyan},
  {id:"allergy",   label:"Allergy",    color:T.orange},
];

const PHASE_META = [
  {key:"immediate", time:"0 – 1 min",  label:"Immediate Actions", color:T.red,    icon:"⚡"},
  {key:"history",   time:"2 – 4 min",  label:"Focused History",   color:T.orange, icon:"📋"},
  {key:"exam",      time:"5 – 7 min",  label:"Physical Exam",     color:T.yellow, icon:"🔍"},
  {key:"orders",    time:"7 – 10 min", label:"Initial Orders",    color:T.teal,   icon:"📝"},
];

// ── Hardcoded fallback complaint data ────────────────────────────────
const COMPLAINTS_FALLBACK = [
  { id:"chest_pain", label:"Chest Pain", category:"cardiac", esi:2, icon:"🫀", color:"#ff6b6b", tagline:"ACS, dissection, PE, PTX — rule out life threats before anchoring", immediate:[], history:[], exam:[], orders:[], redFlags:[], dontMiss:[], pearl:"" },
  { id:"dyspnea", label:"Shortness of Breath", category:"pulmonary", esi:2, icon:"🫁", color:"#3b9eff", tagline:"Silent chest in asthma is pre-arrest", immediate:[], history:[], exam:[], orders:[], redFlags:[], dontMiss:[], pearl:"" },
];

// ── Transform DB record → component shape ─────────────────────────────
function dbToComplaint(r) {
  return {
    id: r.complaint_id,
    label: r.label,
    category: r.category,
    esi: r.esi,
    icon: r.icon || "📋",
    color: r.color || "#3b9eff",
    tagline: r.tagline || "",
    immediate: r.immediate || [],
    history: r.history || [],
    exam: r.exam || [],
    orders: r.orders || [],
    redFlags: r.red_flags || [],
    dontMiss: r.dont_miss || [],
    pearl: r.pearl || "",
  };
}

// ── Module-scope Primitives ───────────────────────────────────────────

function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(255,107,107,0.09) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(59,158,255,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"45%",right:"25%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(155,109,255,0.06) 0%,transparent 70%)"}}/>
    </div>
  );
}

function ESIBadge({ level }) {
  const e = ESI_META[level] || ESI_META[3];
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:26,height:26,borderRadius:6,background:e.color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 10px ${e.color}55`}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:e.tc}}>{level}</span>
      </div>
      <div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:e.color,lineHeight:1}}>ESI {level}</div>
        <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,lineHeight:1,marginTop:2}}>{e.label}</div>
      </div>
    </div>
  );
}

function CatChip({ cat, active, onClick }) {
  return (
    <button onClick={onClick} style={{fontFamily:"DM Sans",fontWeight:600,fontSize:10,padding:"4px 10px",borderRadius:20,border:`1px solid ${active ? cat.color : "rgba(42,79,122,0.4)"}`,background:active ? `${cat.color}22` : "transparent",color:active ? cat.color : T.txt4,cursor:"pointer",whiteSpace:"nowrap",transition:"all .12s",flexShrink:0}}>
      {cat.label}
    </button>
  );
}

function ComplaintRow({ complaint, active, onClick }) {
  const e = ESI_META[complaint.esi];
  return (
    <div className="cc-row" onClick={onClick} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",borderRadius:10,background:active ? `${complaint.color}18` : "transparent",border:`1px solid ${active ? complaint.color+"44" : "transparent"}`,cursor:"pointer"}}>
      <span style={{fontSize:17,flexShrink:0}}>{complaint.icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:active ? complaint.color : T.txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{complaint.label}</div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:.5}}>{complaint.category}</div>
      </div>
      <div style={{width:20,height:20,borderRadius:5,background:e?.color || T.txt4,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:e?.tc || "#fff"}}>{complaint.esi}</span>
      </div>
    </div>
  );
}

function PhaseCard({ meta, items }) {
  return (
    <div className="phase-card" style={{...glass,padding:"15px 17px",borderLeft:`3px solid ${meta.color}`,background:`linear-gradient(135deg,${meta.color}10,rgba(8,22,40,0.8))`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
        <span style={{fontSize:15}}>{meta.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:meta.color}}>{meta.label}</div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>{meta.time}</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {(items||[]).map((item,i) => (
          <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start"}}>
            <span style={{color:meta.color,fontSize:9,marginTop:3,flexShrink:0}}>▸</span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RedFlagRow({ text }) {
  return (
    <div style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 10px",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.18)",borderRadius:8,marginBottom:5}}>
      <span style={{color:T.red,fontSize:10,marginTop:2,flexShrink:0}}>⚠</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.4}}>{text}</span>
    </div>
  );
}

function DDxPill({ label, color }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:20,background:`${color}18`,border:`1px solid ${color}40`,margin:"0 5px 5px 0"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block"}}/>
      <span style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:color}}>{label}</span>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function RapidAssessmentHub() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState(COMPLAINTS_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("chest_pain");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.RapidAssessmentComplaint
      .filter({ is_active: true }, "sort_order", 50)
      .then(records => {
        if (records && records.length > 0) {
          setComplaints(records.map(dbToComplaint));
          setSelected(records[0].complaint_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = complaints.find(c => c.id === selected) || complaints[0];

  return (
    <div style={{fontFamily:"DM Sans",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden"}}>
      <AmbientBg />
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px",display:"flex",flexDirection:"column",height:"100vh"}}>

        {/* Header */}
        <div style={{padding:"16px 0 12px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <button onClick={()=>navigate("/hub")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,background:"rgba(14,37,68,0.8)",border:"1px solid rgba(42,79,122,0.5)",color:"#8aaccc",fontFamily:"DM Sans",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,158,255,0.5)";e.currentTarget.style.color="#e8f0fe";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.5)";e.currentTarget.style.color="#8aaccc";}}>← Hub</button>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.85)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>RAPID ASSESS</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1}}>10-MIN TEMPLATES</span>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(22px,3.5vw,38px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Rapid Assessment Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:3}}>
            10-minute workup templates · {complaints.length} chief complaints · Immediate actions through initial orders
          </p>
        </div>

        {/* Body */}
        <div style={{display:"flex",gap:14,flex:1,overflow:"hidden",paddingBottom:14}}>

          {/* Left Pane */}
          <div style={{width:248,flexShrink:0,display:"flex",flexDirection:"column",gap:8,overflow:"hidden"}}>
            <input
              type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search complaints..."
              style={{width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:10,padding:"8px 13px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none",flexShrink:0,transition:"border-color .15s"}}
              onFocus={e=>e.target.style.borderColor="rgba(59,158,255,0.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(42,79,122,0.4)"}
            />
            <div style={{display:"flex",gap:4,overflowX:"auto",flexShrink:0,paddingBottom:2}}>
              {CATEGORIES.map(cat=>(
                <CatChip key={cat.id} cat={cat} active={catFilter===cat.id}
                  onClick={()=>setCatFilter(cat.id)}/>
              ))}
            </div>
            <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:2}}>
              {filtered.length === 0 && (
                <div style={{textAlign:"center",padding:20,fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>No matches</div>
              )}
              {filtered.map(c=>(
                <ComplaintRow key={c.id} complaint={c} active={selected===c.id}
                  onClick={()=>setSelected(c.id)}/>
              ))}
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textAlign:"center",flexShrink:0}}>
              {loading ? "Loading..." : `${filtered.length}/${complaints.length} protocols`}
            </div>
          </div>

          {/* Right Pane */}
          <div className="fade-in" key={current.id} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>

            {/* Complaint Header */}
            <div style={{...glass,padding:"18px 22px",borderLeft:`4px solid ${current.color}`,background:`linear-gradient(135deg,${current.color}14,rgba(8,22,40,0.9))`}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                <span style={{fontSize:38,lineHeight:1,flexShrink:0}}>{current.icon}</span>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:6}}>
                    <h2 style={{fontFamily:"Playfair Display",fontSize:"clamp(18px,2.5vw,26px)",fontWeight:700,color:T.txt,lineHeight:1}}>
                      {current.label}
                    </h2>
                    <ESIBadge level={current.esi}/>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:current.color,background:`${current.color}18`,border:`1px solid ${current.color}44`,padding:"3px 9px",borderRadius:4,textTransform:"uppercase",letterSpacing:1}}>
                      {current.category}
                    </span>
                  </div>
                  <p style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,fontStyle:"italic",lineHeight:1.5}}>
                    {current.tagline}
                  </p>
                </div>
                <div style={{...glass,padding:"10px 14px",borderRadius:12,background:"rgba(8,22,40,0.6)",textAlign:"center",flexShrink:0}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:22,fontWeight:700,color:current.color,lineHeight:1}}>10</div>
                  <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,marginTop:2}}>min goal</div>
                </div>
              </div>
            </div>

            {/* Phase Cards 2x2 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {PHASE_META.map((meta,i)=>(
                <PhaseCard key={i} meta={meta} items={current[meta.key]}/>
              ))}
            </div>

            {/* Don't Miss */}
            <div style={{...glass,padding:"14px 18px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
                🚫 Do Not Miss Diagnoses
              </div>
              <div style={{display:"flex",flexWrap:"wrap"}}>
                {(current.dontMiss||[]).map((d,i)=>(
                  <DDxPill key={i} label={d} color={current.color}/>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            <div style={{...glass,padding:"14px 18px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
                🚨 Red Flags — Escalation Triggers
              </div>
              {(current.redFlags||[]).map((f,i)=><RedFlagRow key={i} text={f}/>)}
            </div>

            {/* Pearl */}
            <div style={{padding:"14px 18px",background:`linear-gradient(135deg,${current.color}12,rgba(8,22,40,0.8))`,border:`1px solid ${current.color}30`,borderRadius:14}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:current.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
                💎 Clinical Pearl
              </div>
              <p style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7,fontStyle:"italic"}}>
                {current.pearl}
              </p>
            </div>

            {/* Footer */}
            <div style={{textAlign:"center",paddingBottom:6}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
                NOTRYA RAPID ASSESSMENT HUB · TEMPLATES ARE CLINICAL STARTING POINTS — INDIVIDUALIZE PER PATIENT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}