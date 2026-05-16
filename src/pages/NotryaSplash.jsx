import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("splash-fonts")) return;
  const l = document.createElement("link");
  l.id = "splash-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "splash-css";
  s.textContent = `
    @keyframes ecg{0%{stroke-dashoffset:400}100%{stroke-dashoffset:0}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
    .su1{animation:fadeUp .5s .05s ease both}
    .su2{animation:fadeUp .5s .2s ease both}
    .su3{animation:fadeUp .5s .38s ease both}
    .su4{animation:fadeUp .5s .56s ease both}
    .su5{animation:fadeUp .5s .72s ease both}
    .ecg-line{animation:ecg 2.4s ease-in-out infinite alternate;stroke-dasharray:400}
    .blink{animation:blink 2s ease-in-out infinite}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

const STATS = [
  { label:"Documentation Hubs",   value:"18+", color:T.teal   },
  { label:"Clinical Calculators", value:"40+", color:T.gold   },
  { label:"AI-Powered Tools",     value:"12+", color:T.purple },
];

export default function NotryaSplash() {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif",
      overflow:"hidden", position:"relative",
    }}>

      {/* Grid overlay */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none", opacity:0.025,
        backgroundImage:"linear-gradient(rgba(0,229,192,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,192,1) 1px,transparent 1px)",
        backgroundSize:"48px 48px",
      }} />

      {/* Radial glow */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-60%)",
        width:700, height:700, borderRadius:"50%",
        background:`radial-gradient(circle,${T.teal}0a 0%,transparent 68%)`,
        pointerEvents:"none",
      }} />

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", zIndex:1 }}>

        {/* Logo block */}
        <div className="su1" style={{
          width:80, height:80, borderRadius:20,
          background:`linear-gradient(135deg,${T.teal}28,${T.purple}28)`,
          border:`1px solid ${T.teal}40`,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:28, position:"relative",
        }}>
          <svg width="52" height="30" viewBox="0 0 130 60" fill="none">
            <polyline
              className="ecg-line"
              points="0,30 25,30 32,30 38,6 44,54 50,30 62,30 68,16 74,44 80,30 130,30"
              stroke={T.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div className="blink" style={{
            position:"absolute", top:10, right:10,
            width:7, height:7, borderRadius:"50%", background:T.teal,
          }} />
        </div>

        {/* Brand */}
        <div className="su2" style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:52, fontWeight:900, color:T.txt,
          letterSpacing:"0.10em", lineHeight:1, marginBottom:6,
        }}>
          NOTRYA
        </div>

        <div className="su2" style={{
          fontFamily:"'JetBrains Mono',monospace",
          fontSize:10, color:T.teal,
          letterSpacing:"0.24em", textTransform:"uppercase",
          marginBottom:28,
        }}>
          AI · Emergency Medicine
        </div>

        {/* Tagline */}
        <div className="su3" style={{
          fontFamily:"'DM Sans',sans-serif",
          fontSize:17, color:T.txt3, lineHeight:1.65,
          textAlign:"center", maxWidth:360, marginBottom:48,
        }}>
          Built for the pace of emergency medicine.<br />
          <span style={{ fontSize:13, color:T.txt4 }}>
            Documentation, decisions, and orders — at the bedside.
          </span>
        </div>

        {/* Stat row */}
        <div className="su3" style={{
          display:"flex", gap:20, marginBottom:52, flexWrap:"wrap", justifyContent:"center",
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              textAlign:"center", padding:"10px 18px",
              background:T.card, border:"1px solid rgba(26,53,85,0.5)",
              borderRadius:10,
            }}>
              <div style={{
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:22, fontWeight:700, color:s.color, lineHeight:1,
              }}>
                {s.value}
              </div>
              <div style={{
                fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, marginTop:4,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="su4"
          onClick={() => navigate("/")}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            padding:"15px 56px",
            background: hov
              ? `linear-gradient(135deg,${T.teal}44,${T.teal}22)`
              : `linear-gradient(135deg,${T.teal}28,${T.teal}0e)`,
            border:`1px solid ${T.teal}${hov ? "99" : "55"}`,
            borderRadius:12, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",
            fontSize:15, fontWeight:700, color:T.teal,
            letterSpacing:"0.07em",
            transition:"all .18s",
            boxShadow: hov ? `0 0 36px ${T.teal}28` : "none",
            marginBottom:20,
          }}
        >
          Begin Shift
        </div>

        <div className="su5" style={{
          fontFamily:"'JetBrains Mono',monospace",
          fontSize:9, color:T.txt4, letterSpacing:"0.14em",
        }}>
          NOTRYA AI · FOR CLINICAL DECISION SUPPORT ONLY
        </div>

      </div>
    </div>
  );
}