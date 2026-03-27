import { useState, useRef, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════
//  ACS HOME PAGE — GLASSMORPHISM HUB
// ════════════════════════════════════════════════════════════
const HOME_PROTOCOLS = [
  { id:"acs",       icon:"🫀", abbr:"ACS",   title:"Acute Coronary Syndrome",       subtitle:"STEMI · NSTEMI · Unstable Angina",        badge:"2025 ACC/AHA", tagline:"From door-to-ECG to complete revascularisation", color:"#ff6b6b", glow:"rgba(255,107,107,0.35)", glass:"rgba(255,107,107,0.06)", border:"rgba(255,107,107,0.25)", accent:"#ff9999", stat:{value:"≤ 90",unit:"min",label:"Door-to-Balloon"}, tags:["TNK Tool","Risk Scores","Cardiology Consult"] },
  { id:"tachy",     icon:"⚡", abbr:"TACHY", title:"Adult Tachycardia",             subtitle:"Stable · Unstable · SVT · VT · TdP",      badge:"ACLS 2025",   tagline:"Stable vs unstable pathway with cardioversion guide", color:"#f5c842", glow:"rgba(245,200,66,0.3)",  glass:"rgba(245,200,66,0.06)", border:"rgba(245,200,66,0.25)", accent:"#f7d875", stat:{value:"< 3",unit:"min",label:"Cardiovert if unstable"}, tags:["Cardioversion","Adenosine","Amiodarone"] },
  { id:"brady",     icon:"🔻", abbr:"BRADY", title:"Adult Bradycardia",             subtitle:"Symptomatic · AV Block · Pacing",          badge:"ACLS 2025",   tagline:"Atropine first · TCP · Vasopressor infusions",       color:"#3b9eff", glow:"rgba(59,158,255,0.3)",  glass:"rgba(59,158,255,0.06)", border:"rgba(59,158,255,0.25)", accent:"#6ab8ff", stat:{value:"1 mg",unit:"IV",label:"Atropine first dose"}, tags:["Atropine","TCP","H's & T's"] },
  { id:"peds",      icon:"👶", abbr:"PALS",  title:"Pediatric ACLS",               subtitle:"Cardiac Arrest · Brady · Tachy · PALS",   badge:"PALS 2025",   tagline:"Weight-based dosing · Defibrillation · All rhythms",  color:"#9b6dff", glow:"rgba(155,109,255,0.3)", glass:"rgba(155,109,255,0.06)",border:"rgba(155,109,255,0.25)",accent:"#b99bff",stat:{value:"2 J/kg",unit:"VF/pVT",label:"1st defibrillation"}, tags:["Weight-based","Broselow","Epinephrine"] },
  { id:"pregnancy", icon:"🤰", abbr:"OB",    title:"Cardiac Arrest in Pregnancy",  subtitle:"PMCD · LUD · Maternal Resuscitation",     badge:"AHA 2020",    tagline:"Dual-patient emergency · Perimortem C-section by 5 min",color:"#00e5c0",glow:"rgba(0,229,192,0.3)",  glass:"rgba(0,229,192,0.06)", border:"rgba(0,229,192,0.25)", accent:"#33eccc", stat:{value:"5 min",unit:"PMCD",label:"If no ROSC"}, tags:["LUD","ABCDEFGH","PMCD Tool"] },
];

function ecgPath(x=0,y=0,s=1){ return [`M${x},${y}`,`L${x+15*s},${y}`,`Q${x+18*s},${y} ${x+20*s},${y-3*s}`,`L${x+22*s},${y+6*s}`,`L${x+24*s},${y-28*s}`,`L${x+26*s},${y+14*s}`,`L${x+28*s},${y}`,`Q${x+32*s},${y} ${x+35*s},${y-4*s}`,`Q${x+38*s},${y-8*s} ${x+41*s},${y}`,`L${x+60*s},${y}`].join(" "); }

function ProtocolCard({ p, onClick, index }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={()=>onClick(p.id)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        position:"relative", borderRadius:20, padding:"22px 22px 20px", cursor:"pointer", overflow:"hidden",
        transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hov ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        animation:`card-in 0.55s ease both ${index*0.08}s`,
        background: hov
          ? `linear-gradient(135deg, ${p.glass.replace("0.06","0.22")}, ${p.glass.replace("0.06","0.06")})`
          : "rgba(8,22,40,0.65)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        border:`1px solid ${hov ? p.border : "rgba(26,53,85,0.7)"}`,
        boxShadow: hov
          ? `0 24px 48px rgba(0,0,0,0.45), 0 0 0 1px ${p.border}, inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px ${p.glow}`
          : "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}>
      {/* Corner glow */}
      <div style={{position:"absolute",top:-40,right:-40,width:150,height:150,borderRadius:"50%",background:`radial-gradient(circle, ${p.glow} 0%, transparent 70%)`,opacity:hov?1:0,transition:"opacity 0.3s",pointerEvents:"none"}}/>
      {/* Shimmer */}
      <div style={{position:"absolute",inset:0,borderRadius:20,background:"linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.04) 50%,transparent 60%)",opacity:hov?1:0,transition:"opacity 0.4s",pointerEvents:"none"}}/>
      {/* Top row */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${p.glass.replace("0.06","0.28")},${p.glass})`,border:`1px solid ${p.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:hov?`0 0 20px ${p.glow}`:"none",transition:"box-shadow 0.3s",flexShrink:0}}>
          {p.icon}
        </div>
        <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:p.glass.replace("0.06","0.2"),border:`1px solid ${p.border}`,color:p.color,letterSpacing:".05em",backdropFilter:"blur(8px)"}}>
          {p.badge}
        </span>
      </div>
      <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:p.accent,letterSpacing:".12em",textTransform:"uppercase",marginBottom:4,opacity:0.85}}>
        {p.abbr}
      </div>
      <div style={{fontSize:15,fontFamily:"'Playfair Display',serif",fontWeight:600,color:"#e8f0fe",lineHeight:1.3,marginBottom:4}}>
        {p.title}
      </div>
      <div style={{fontSize:11,color:"#4a6a8a",marginBottom:14,lineHeight:1.4}}>
        {p.subtitle}
      </div>
      <div style={{height:1,background:`linear-gradient(90deg, ${p.border}, transparent)`,marginBottom:12}}/>
      <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:12}}>
        <span style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:p.color}}>{p.stat.value}</span>
        <span style={{fontSize:11,color:p.accent,fontFamily:"'JetBrains Mono',monospace"}}>{p.stat.unit}</span>
        <span style={{fontSize:10,color:"#4a6a8a",marginLeft:4}}>{p.stat.label}</span>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {p.tags.map((t,i)=><span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:p.glass,border:`1px solid ${p.border.replace("0.25","0.18")}`,color:"#8aaccc",backdropFilter:"blur(4px)"}}>{t}</span>)}
      </div>
      <div style={{position:"absolute",bottom:18,right:18,width:28,height:28,borderRadius:"50%",background:p.glass.replace("0.06","0.18"),border:`1px solid ${p.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:p.color,opacity:hov?1:0,transform:hov?"scale(1) translateX(0)":"scale(0.7) translateX(-4px)",transition:"all 0.25s ease"}}>
        →
      </div>
    </div>
  );
}

function ACSHomePage({ onNavigate }) {
  const [bannerOpen, setBannerOpen] = useState(true);

  return (
    <div style={{position:"relative",minHeight:"100%",fontFamily:"'DM Sans',sans-serif"}}>
      {/* ── Background ── */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {[{x:"10%",y:"20%",r:280,c:"rgba(255,107,107,0.07)"},{x:"85%",y:"15%",r:220,c:"rgba(245,200,66,0.06)"},{x:"75%",y:"75%",r:300,c:"rgba(155,109,255,0.07)"},{x:"20%",y:"80%",r:200,c:"rgba(0,229,192,0.06)"},{x:"50%",y:"45%",r:350,c:"rgba(59,158,255,0.04)"}].map((orb,i)=>(
          <div key={i} style={{position:"absolute",left:orb.x,top:orb.y,width:orb.r*2,height:orb.r*2,borderRadius:"50%",background:`radial-gradient(circle, ${orb.c} 0%, transparent 70%)`,transform:"translate(-50%,-50%)",animation:`of${i%3} ${7+i*1.5}s ease-in-out infinite`}}/>
        ))}
      </div>

      <div style={{position:"relative",zIndex:1}}>
        {/* ── Hero ── */}
        <div style={{borderRadius:20,padding:"26px 28px 22px",background:"rgba(5,15,30,0.78)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",border:"1px solid rgba(255,107,107,0.18)",marginBottom:16,position:"relative",overflow:"hidden",animation:"card-in 0.55s ease both",boxShadow:"0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(105deg,rgba(255,107,107,0.06) 0%,transparent 50%,rgba(155,109,255,0.05) 100%)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"20px 20px 0 0",background:"linear-gradient(90deg,#ff6b6b,#f5c842,#00e5c0,#9b6dff,#3b9eff)"}}/>
          <div style={{display:"flex",alignItems:"flex-start",gap:18,position:"relative"}}>
            {/* Beating heart */}
            <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,rgba(255,107,107,0.2),rgba(155,109,255,0.15))",border:"1px solid rgba(255,107,107,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,animation:"hb 1.4s ease-in-out infinite",position:"relative"}}>
              🫀
              <span style={{position:"absolute",inset:-4,borderRadius:20,border:"1.5px solid rgba(255,107,107,0.2)",animation:"pr 1.4s ease-in-out infinite"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:"#e8f0fe",letterSpacing:"-0.01em"}}>Cardiac Protocol Hub</span>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"rgba(0,229,192,0.1)",color:"#00e5c0",border:"1px solid rgba(0,229,192,0.3)",letterSpacing:".06em"}}>NOTRYA TOOLS</span>
              </div>
              <p style={{fontSize:13,color:"#8aaccc",margin:0,lineHeight:1.6,maxWidth:560}}>
                Evidence-based algorithms for the emergency physician — five guideline-integrated cardiac protocols spanning the full spectrum of acute cardiovascular emergencies.
              </p>
            </div>
            <div style={{borderRadius:12,padding:"10px 14px",background:"rgba(8,22,40,0.85)",border:"1px solid rgba(26,53,85,0.9)",textAlign:"center",flexShrink:0}}>
              <div style={{fontSize:9,color:"#4a6a8a",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>Protocols</div>
              <div style={{fontSize:28,fontWeight:700,color:"#3b9eff",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>5</div>
              <div style={{fontSize:9,color:"#4a6a8a",marginTop:2}}>available</div>
            </div>
          </div>
        </div>

        {/* ── Alert banner ── */}
        {bannerOpen && (
          <div style={{borderRadius:12,padding:"10px 16px",marginBottom:14,background:"rgba(255,107,107,0.07)",border:"1px solid rgba(255,107,107,0.22)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:12,animation:"card-in 0.5s ease both 0.1s"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#ff6b6b",animation:"ap 1.5s ease-in-out infinite",flexShrink:0}}/>
            <span style={{fontSize:11,color:"#ff9999",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,flexShrink:0}}>CARDIAC PROTOCOL HUB</span>
            <span style={{fontSize:11,color:"#8aaccc",flex:1}}>All algorithms follow 2025 ACC/AHA/ACEP guidelines · Clinical decision support only</span>
            <button onClick={()=>setBannerOpen(false)} style={{background:"none",border:"none",color:"#4a6a8a",fontSize:18,cursor:"pointer",lineHeight:1,padding:0,flexShrink:0}}>×</button>
          </div>
        )}

        {/* ── Cards ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
          {HOME_PROTOCOLS.slice(0,3).map((p,i)=><ProtocolCard key={p.id} p={p} onClick={onNavigate} index={i}/>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:22}}>
          {HOME_PROTOCOLS.slice(3).map((p,i)=><ProtocolCard key={p.id} p={p} onClick={onNavigate} index={i+3}/>)}
        </div>
      </div>

      <style>{`
        @keyframes card-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hb { 0%,100%{transform:scale(1)} 14%{transform:scale(1.15)} 28%{transform:scale(1)} 42%{transform:scale(1.1)} 70%{transform:scale(1)} }
        @keyframes pr { 0%{opacity:.6;transform:scale(1)} 100%{opacity:0;transform:scale(1.5)} }
        @keyframes ap { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,107,107,.4)} 50%{opacity:.8;box-shadow:0 0 0 6px rgba(255,107,107,0)} }
        @keyframes of0 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes of1 { 0%,100%{transform:translate(-50%,-50%) scale(1.1)} 50%{transform:translate(-50%,-50%) scale(0.9)} }
        @keyframes of2 { 0%,100%{transform:translate(-50%,-50%) scale(0.95)} 50%{transform:translate(-50%,-50%) scale(1.12)} }
      `}</style>
    </div>
  );
}

export default function NotryaCardiacHub() {
  const [currentPage, setCurrentPage] = useState("home");

  const navigateTo = (protocolId) => {
    setCurrentPage(protocolId);
  };

  const backToHome = () => {
    setCurrentPage("home");
  };

  return (
    <div style={{width:"100%",height:"100%",overflow:"auto",background:"#050f1e"}}>
      {currentPage === "home" && <ACSHomePage onNavigate={navigateTo}/>}
      {currentPage !== "home" && (
        <div style={{padding:"24px",maxWidth:"1200px",margin:"0 auto"}}>
          <button onClick={backToHome} style={{marginBottom:"20px",padding:"8px 16px",borderRadius:"6px",background:"rgba(59,158,255,0.15)",border:"1px solid rgba(59,158,255,0.3)",color:"var(--blue)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            ← Back to Hub
          </button>
          <div style={{textAlign:"center",color:"#8aaccc",fontSize:"18px"}}>
            Protocol: {currentPage.toUpperCase()} (Coming soon — detailed algorithms will be integrated here)
          </div>
        </div>
      )}
    </div>
  );
}