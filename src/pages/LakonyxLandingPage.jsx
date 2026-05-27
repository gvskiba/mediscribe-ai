import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Font + CSS injection ──────────────────────────────────────────────────────
(() => {
  if (document.getElementById("lxl-fonts")) return;
  const l = document.createElement("link");
  l.id = "lxl-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "lxl-css";
  s.textContent = `
    @keyframes lxl-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    @keyframes lxl-blink{0%,100%{opacity:1}50%{opacity:0.3}}
    @keyframes lxl-ring{0%,100%{box-shadow:0 0 0 0 rgba(10,191,191,0.28)}65%{box-shadow:0 0 0 26px rgba(10,191,191,0)}}
    @keyframes lxl-glow{0%,100%{box-shadow:0 4px 22px rgba(0,229,192,0.28),inset 0 1px 0 rgba(255,255,255,0.08)}50%{box-shadow:0 4px 48px rgba(0,229,192,0.52),inset 0 1px 0 rgba(255,255,255,0.12)}}
    @keyframes lxl-pulse-dot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.7}}
    @keyframes lxl-f1{0%,100%{transform:translate(0,0)}50%{transform:translate(55px,38px)}}
    @keyframes lxl-f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-48px,55px)}}
    @keyframes lxl-f3{0%,100%{transform:translate(0,0)}50%{transform:translate(38px,-48px)}}
    @keyframes lxl-inv-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @keyframes lxl-scan{0%{background-position:0 -100%}100%{background-position:0 200%}}

    .lxl-s1{animation:lxl-fadeUp .55s .04s ease both}
    .lxl-s2{animation:lxl-fadeUp .55s .16s ease both}
    .lxl-s3{animation:lxl-fadeUp .55s .28s ease both}
    .lxl-s4{animation:lxl-fadeUp .55s .40s ease both}
    .lxl-s5{animation:lxl-fadeUp .55s .52s ease both}
    .lxl-s6{animation:lxl-fadeUp .55s .64s ease both}
    .lxl-s7{animation:lxl-fadeUp .55s .76s ease both}
    .lxl-s8{animation:lxl-fadeUp .55s .88s ease both}

    .lxl-blink{animation:lxl-blink 2.2s ease-in-out infinite}
    .lxl-dot{animation:lxl-pulse-dot 2.2s ease-in-out infinite}
    .lxl-begin{animation:lxl-glow 2.8s ease-in-out infinite;transition:all .2s;cursor:pointer;user-select:none}
    .lxl-begin:hover{transform:translateY(-2px);filter:brightness(1.08)}
    .lxl-begin:active{transform:translateY(0);filter:brightness(.94)}

    .lxl-dept{transition:all .17s;cursor:pointer;user-select:none}
    .lxl-dept:hover{transform:translateY(-1px)}
    .lxl-dept:active{transform:scale(.97)}

    .lxl-inv{animation:lxl-inv-in .28s ease both}
    .lxl-inv-row{transition:background .15s,border-color .15s;cursor:pointer}
    .lxl-inv-row:hover{background:rgba(11,30,54,0.95)!important}

    .lxl-link{transition:color .15s,opacity .15s;cursor:pointer;user-select:none}
    .lxl-link:hover{opacity:1!important}

    .lxl-input:focus{border-color:rgba(0,229,192,0.5)!important;box-shadow:0 0 0 3px rgba(0,229,192,0.07)!important}

    @media(max-width:580px){
      .lxl-depts{flex-wrap:wrap!important}
      .lxl-clock-num{font-size:32px!important}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation:none!important;transition:none!important}
    }
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#070d1a", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", blue:"#3b9eff", purple:"#9b6dff",
  orange:"#ff9f43", coral:"#ff6b6b",
};
const BRAND = { gold:"#C9A84C", teal:"#0ABFBF" };

const DEPTS = ["ED","ICU","Urgent Care","Peds ED","Trauma","Other"];

const INV_DOCS = [
  { icon:"📊", label:"Platform Overview",        sub:"Full investor pitch · in-app",  color:T.teal,   route:"LakonyxInvestorPitch", live:true  },
  { icon:"📈", label:"Investor Pitch Deck",       sub:"10-slide PPTX · download",      color:T.gold,   route:null,                   live:false },
  { icon:"📄", label:"Executive One-Pager",       sub:"Problem · Solution · Team",     color:T.purple, route:null,                   live:false },
  { icon:"💰", label:"Financial Model",           sub:"5-yr P&L + valuation · XLSX",   color:T.orange, route:null,                   live:false },
  { icon:"🔒", label:"HIPAA Risk Analysis",       sub:"Risk matrix + remediation",     color:T.coral,  route:null,                   live:false },
  { icon:"⚖️", label:"BAA Vendor Checklist",      sub:"Base44 · Anthropic · FHIR",    color:T.blue,   route:null,                   live:false },
  { icon:"🗺️", label:"Vercel Migration Guide",    sub:"Next.js roadmap · PDF",         color:"#3dffa0",route:null,                   live:false },
];

// ── Ambient background ────────────────────────────────────────────────────────
function BgMesh() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[
        {sz:680,s:{top:"-120px",left:"-80px"},  c:"rgba(0,229,192,0.032)", a:"lxl-f1 22s ease-in-out infinite"},
        {sz:520,s:{top:"38%",right:"-120px"},   c:"rgba(59,158,255,0.024)",a:"lxl-f2 27s ease-in-out infinite"},
        {sz:420,s:{bottom:"-60px",left:"38%"},  c:"rgba(155,109,255,0.022)",a:"lxl-f3 31s ease-in-out infinite"},
      ].map((b,i) => (
        <div key={i} style={{position:"absolute",width:b.sz,height:b.sz,borderRadius:"50%",...b.s,
          background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,animation:b.a}}/>
      ))}
      {/* Subtle grid */}
      <div style={{position:"absolute",inset:0,opacity:.012,
        backgroundImage:"linear-gradient(rgba(0,229,192,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,192,1) 1px,transparent 1px)",
        backgroundSize:"52px 52px"}}/>
    </div>
  );
}

// ── LX Monogram ───────────────────────────────────────────────────────────────
function LXMark({size=108}) {
  return (
    <div style={{width:size,height:size,borderRadius:Math.round(size*.2),background:"#0A1628",
      border:"1px solid rgba(201,168,76,0.4)",display:"flex",alignItems:"center",
      justifyContent:"center",position:"relative",animation:"lxl-ring 3.4s ease-out infinite",
      flexShrink:0,boxShadow:"0 0 0 1px rgba(11,191,191,0.1),0 14px 52px rgba(0,0,0,0.7)"}}>
      <div style={{position:"absolute",inset:0,borderRadius:"inherit",
        background:"radial-gradient(circle at 38% 40%,rgba(201,168,76,0.09) 0%,transparent 65%)",
        pointerEvents:"none"}}/>
      {/* Scan line */}
      <div style={{position:"absolute",inset:0,borderRadius:"inherit",overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",left:0,right:0,height:"30%",
          background:"linear-gradient(180deg,transparent 0%,rgba(0,229,192,0.04) 50%,transparent 100%)",
          animation:"lxl-scan 4s linear infinite"}}/>
      </div>
      <svg viewBox="0 0 500 500" width={Math.round(size*.74)} height={Math.round(size*.74)}
        xmlns="http://www.w3.org/2000/svg" style={{position:"relative",zIndex:1}}>
        <text x="106" y="305" fontFamily="'Playfair Display',Georgia,serif"
          fontSize="280" fontWeight="700" fill={BRAND.gold}>L</text>
        <text x="193" y="305" fontFamily="'Playfair Display',Georgia,serif"
          fontSize="280" fontWeight="700" fill={BRAND.teal}>X</text>
      </svg>
      <div className="lxl-dot" style={{position:"absolute",top:9,right:9,width:7,height:7,
        borderRadius:"50%",background:BRAND.teal,boxShadow:`0 0 7px ${BRAND.teal}`}}/>
    </div>
  );
}

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState({ h:"--", m:"--", s:"--", date:"" });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const pad = (v) => String(v).padStart(2,"0");
      setT({
        h: pad(n.getHours()), m: pad(n.getMinutes()), s: pad(n.getSeconds()),
        date: n.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  },[]);
  return (
    <div style={{padding:"20px 32px",borderRadius:14,
      background:"rgba(7,13,26,0.85)",border:"1px solid rgba(26,53,85,0.65)",
      backdropFilter:"blur(10px)",textAlign:"center"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:5}}>
        <span className="lxl-clock-num" style={{fontFamily:"'JetBrains Mono',monospace",
          fontSize:38,fontWeight:700,color:T.txt,letterSpacing:".04em",lineHeight:1}}>{t.h}</span>
        <span className="lxl-blink" style={{fontFamily:"'JetBrains Mono',monospace",
          fontSize:32,fontWeight:700,color:T.teal,lineHeight:1,margin:"0 1px"}}>:</span>
        <span className="lxl-clock-num" style={{fontFamily:"'JetBrains Mono',monospace",
          fontSize:38,fontWeight:700,color:T.txt,letterSpacing:".04em",lineHeight:1}}>{t.m}</span>
        <span className="lxl-blink" style={{fontFamily:"'JetBrains Mono',monospace",
          fontSize:32,fontWeight:700,color:T.teal,lineHeight:1,margin:"0 1px"}}>:</span>
        <span className="lxl-clock-num" style={{fontFamily:"'JetBrains Mono',monospace",
          fontSize:38,fontWeight:700,color:T.txt4,letterSpacing:".04em",lineHeight:1}}>{t.s}</span>
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
        color:T.txt4,letterSpacing:".13em"}}>{t.date}</div>
    </div>
  );
}

// ── Investor Resources Panel ──────────────────────────────────────────────────
function InvPanel({onNavigate}) {
  return (
    <div className="lxl-inv" style={{width:"100%",marginTop:10,display:"flex",
      flexDirection:"column",gap:6}}>
      {INV_DOCS.map((doc,i) => (
        <div key={i} className="lxl-inv-row"
          onClick={() => doc.live && onNavigate(doc.route)}
          style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",
            borderRadius:10,background:"rgba(11,30,54,0.55)",
            border:`1px solid ${doc.color}20`,
            cursor:doc.live?"pointer":"default"}}>
          <div style={{width:32,height:32,borderRadius:8,background:doc.color+"14",
            border:`1px solid ${doc.color}26`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:15,flexShrink:0}}>{doc.icon}</div>
          <div style={{flex:1,textAlign:"left",minWidth:0}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,
              color:T.txt2,lineHeight:1.2,marginBottom:2}}>{doc.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:doc.color}}>{doc.sub}</div>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,
            color:doc.live?doc.color:"rgba(90,130,168,0.25)",flexShrink:0}}>
            {doc.live?"→":"↓"}
          </span>
        </div>
      ))}
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,
        color:"rgba(90,130,168,0.3)",letterSpacing:".07em",textAlign:"center",paddingTop:4}}>
        For institutional &amp; investor use · Not for clinical distribution
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LakonyxLanding() {
  const navigate = useNavigate();
  const [dept, setDept] = useState("ED");
  const [attending, setAttending] = useState("");
  const [showInv, setShowInv] = useState(false);

  // Enter key → Begin Shift
  useEffect(() => {
    const h = (e) => { if (e.key === "Enter" && !showInv) navigate("/CommandCenter"); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  },[showInv]);

  const goShift   = () => navigate("/CommandCenter");
  const goExplore = () => navigate("/LakonyxHome");
  const goRoute   = (r) => navigate(`/${r}`);

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.txt,
      fontFamily:"'DM Sans',sans-serif",overflowX:"hidden",
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"48px 24px 80px",position:"relative"}}>

      <BgMesh/>

      {/* ── Center column ─────────────────────────────────────────────────── */}
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:500,
        display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>

        {/* Version badge */}
        <div className="lxl-s1" style={{marginBottom:26}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 16px",
            borderRadius:20,background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.24)"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
              color:T.gold}}>✦ v2.0</span>
            <div style={{width:1,height:10,background:"rgba(245,200,66,0.28)"}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4}}>
              20 new hubs · AI MDM · CMS 2024
            </span>
          </div>
        </div>

        {/* LX Mark */}
        <div className="lxl-s2" style={{marginBottom:20}}><LXMark size={108}/></div>

        {/* Wordmark */}
        <div className="lxl-s3" style={{fontFamily:"'Playfair Display',serif",
          fontSize:44,fontWeight:900,color:T.txt,letterSpacing:".10em",lineHeight:1,marginBottom:10}}>
          LAKONYX
        </div>

        {/* Tagline */}
        <div className="lxl-s3" style={{display:"flex",alignItems:"center",gap:12,marginBottom:30}}>
          <div style={{width:26,height:1,background:`${BRAND.teal}38`}}/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
            color:BRAND.teal,letterSpacing:".22em",textTransform:"uppercase"}}>
            Clinical Decision Intelligence
          </span>
          <div style={{width:26,height:1,background:`${BRAND.teal}38`}}/>
        </div>

        {/* Clock */}
        <div className="lxl-s4" style={{width:"100%",marginBottom:28}}>
          <LiveClock/>
        </div>

        {/* Shift configuration */}
        <div className="lxl-s5" style={{width:"100%",marginBottom:26}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,
            letterSpacing:".16em",textTransform:"uppercase",marginBottom:12}}>Starting shift in</div>

          {/* Department selector */}
          <div className="lxl-depts" style={{display:"flex",gap:6,justifyContent:"center",
            flexWrap:"wrap",marginBottom:12}}>
            {DEPTS.map(d => {
              const on = d === dept;
              return (
                <div key={d} className="lxl-dept"
                  onClick={() => setDept(d)}
                  style={{padding:"7px 14px",borderRadius:8,
                    fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:on?700:500,
                    color:on?"#050f1e":T.txt3,
                    background:on?`linear-gradient(135deg,${T.teal},#00b4d8)`:"rgba(11,30,54,0.7)",
                    border:`1px solid ${on?"transparent":"rgba(42,79,122,0.45)"}`,
                    boxShadow:on?`0 2px 14px ${T.teal}38`:"none"}}>
                  {d}
                </div>
              );
            })}
          </div>

          {/* Attending input */}
          <input className="lxl-input"
            type="text"
            placeholder="Attending physician (optional)"
            value={attending}
            onChange={e => setAttending(e.target.value)}
            style={{width:"100%",padding:"11px 16px",borderRadius:10,
              background:"rgba(11,30,54,0.65)",border:"1px solid rgba(42,79,122,0.48)",
              color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,
              outline:"none",boxSizing:"border-box",caretColor:T.teal,
              transition:"border-color .15s,box-shadow .15s"}}
          />
        </div>

        {/* Begin Shift button */}
        <div className="lxl-s6" style={{width:"100%",marginBottom:12}}>
          <div className="lxl-begin"
            onClick={goShift}
            style={{width:"100%",padding:"16px",borderRadius:12,
              fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,
              color:"#050f1e",letterSpacing:".04em",textAlign:"center",
              background:`linear-gradient(135deg,${T.teal} 0%,#00b4d8 100%)`,
              border:"none",userSelect:"none"}}>
            Begin Shift →
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:T.txt4,marginTop:7,letterSpacing:".09em"}}>
            Press Enter to begin
          </div>
        </div>

        {/* Explore link */}
        <div className="lxl-s7" style={{marginBottom:48}}>
          <span className="lxl-link"
            onClick={goExplore}
            style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
              color:T.txt4,letterSpacing:".10em",
              textDecoration:"underline",textDecorationColor:"rgba(90,130,168,0.28)",
              opacity:.7}}>
            Explore Platform →
          </span>
        </div>

        {/* ── Investor Resources collapsible ─────────────────────────────── */}
        <div className="lxl-s8" style={{width:"100%"}}>
          <div onClick={() => setShowInv(v => !v)}
            style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",
              opacity:.48,transition:"opacity .18s",userSelect:"none"}}
            onMouseEnter={e => e.currentTarget.style.opacity = ".75"}
            onMouseLeave={e => e.currentTarget.style.opacity = ".48"}>
            <div style={{flex:1,height:1,background:"rgba(26,53,85,0.55)"}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,
              color:T.txt4,letterSpacing:".14em",whiteSpace:"nowrap"}}>
              {showInv ? "▲  INVESTOR RESOURCES" : "▼  INVESTOR RESOURCES"}
            </span>
            <div style={{flex:1,height:1,background:"rgba(26,53,85,0.55)"}}/>
          </div>

          {showInv && <InvPanel onNavigate={goRoute}/>}
        </div>
      </div>

      {/* ── Fixed footer ──────────────────────────────────────────────────── */}
      <div style={{position:"fixed",bottom:14,left:0,right:0,
        textAlign:"center",zIndex:1,pointerEvents:"none"}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,
          color:"rgba(90,130,168,0.28)",letterSpacing:".07em"}}>
          Clinical decision support only · Not a substitute for clinical judgment · Lakonyx v2.0
        </span>
      </div>
    </div>
  );
}