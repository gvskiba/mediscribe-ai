import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("splash-fonts")) return;
  const l = document.createElement("link");
  l.id = "splash-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "splash-css";
  s.textContent = `
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
    @keyframes sp-f1{0%,100%{transform:translate(0,0)}50%{transform:translate(55px,38px)}}
    @keyframes sp-f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-48px,55px)}}
    @keyframes sp-f3{0%,100%{transform:translate(0,0)}50%{transform:translate(38px,-48px)}}
    @keyframes sp-ring{0%,100%{box-shadow:0 0 0 0 rgba(11,191,191,0.2)}65%{box-shadow:0 0 0 18px rgba(11,191,191,0)}}
    .su1{animation:fadeUp .45s .05s ease both}
    .su2{animation:fadeUp .45s .18s ease both}
    .su3{animation:fadeUp .45s .32s ease both}
    .su4{animation:fadeUp .45s .46s ease both}
    .su5{animation:fadeUp .45s .58s ease both}
    .blink{animation:blink 2s ease-in-out infinite}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", purple:"#9b6dff",
};

// Exact brand hex values — used for the LX mark and tagline only
const BRAND = { gold:"#C9A84C", teal:"#0ABFBF" };

const AUTO_SECS = 5;

const STATS = [
  { label:"Clinical Hubs",      value:"65+", color:T.teal   },
  { label:"Clinical Calculators",value:"50+", color:T.gold   },
  { label:"AI-Powered Tools",   value:"20+", color:T.purple },
];

// ── Mesh orb background — identical to LakonyxHome ────────────────────────────
function BgMesh() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[
        { sz:600, s:{top:"-120px",left:"-80px"},  c:"rgba(0,229,192,0.045)", a:"sp-f1 18s ease-in-out infinite" },
        { sz:480, s:{top:"42%",right:"-110px"},   c:"rgba(59,158,255,0.032)", a:"sp-f2 22s ease-in-out infinite" },
        { sz:400, s:{bottom:"-70px",left:"38%"},  c:"rgba(155,109,255,0.032)",a:"sp-f3 26s ease-in-out infinite" },
      ].map((b,i) => (
        <div key={i} style={{
          position:"absolute", width:b.sz, height:b.sz, borderRadius:"50%",
          ...b.s,
          background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,
          animation:b.a,
        }}/>
      ))}
    </div>
  );
}

// ── LX Monogram — exact rebrand spec values ───────────────────────────────────
function LXMark({ size = 100 }) {
  const r = Math.round(size * 0.2);
  return (
    <div style={{
      width:size, height:size, borderRadius:r,
      background:"#0A1628",
      border:`1px solid rgba(201,168,76,0.35)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative",
      boxShadow:`0 0 0 1px rgba(11,191,191,0.12), 0 8px 40px rgba(0,0,0,0.55)`,
      animation:"sp-ring 3.2s ease-out infinite",
      flexShrink:0,
    }}>
      <div style={{
        position:"absolute", inset:0, borderRadius:"inherit",
        background:`radial-gradient(circle at 38% 42%, rgba(201,168,76,0.07) 0%, transparent 65%)`,
        pointerEvents:"none",
      }}/>
      <svg
        viewBox="0 0 500 500"
        width={Math.round(size * 0.74)}
        height={Math.round(size * 0.74)}
        xmlns="http://www.w3.org/2000/svg"
        style={{position:"relative", zIndex:1}}
      >
        <text x="106" y="305"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="280" fontWeight="700"
          fill={BRAND.gold}>L</text>
        <text x="193" y="305"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="280" fontWeight="700"
          fill={BRAND.teal}>X</text>
      </svg>
      <div className="blink" style={{
        position:"absolute", top:10, right:10,
        width:7, height:7, borderRadius:"50%",
        background:BRAND.teal,
        boxShadow:`0 0 6px ${BRAND.teal}`,
      }}/>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LakonyxSplash() {
  const navigate = useNavigate();
  const [hov, setHov]           = useState(false);
  const [countdown, setCountdown] = useState(AUTO_SECS);
  const [auto, setAuto]         = useState(true);
  const timerRef                = useRef(null);

  // Auto-advance countdown
  useEffect(() => {
    if (!auto) return;
    if (countdown <= 0) { navigate("/LakonyxHome"); return; }
    timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown, auto]);

  // Keyboard: Enter → go now, any other key → cancel auto-advance
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Enter") { navigate("/LakonyxHome"); return; }
      if (e.key !== "Tab") setAuto(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const go = () => navigate("/LakonyxHome");

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif",
      overflow:"hidden", position:"relative",
    }}>

      <BgMesh />

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", zIndex:1 }}>

        {/* LX Mark */}
        <div className="su1" style={{ marginBottom:30 }}>
          <LXMark size={100} />
        </div>

        {/* Wordmark */}
        <div className="su2" style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:52, fontWeight:900, color:T.txt,
          letterSpacing:"0.10em", lineHeight:1, marginBottom:12,
        }}>
          LAKONYX
        </div>

        {/* Tagline — prominent, flanked by rule lines */}
        <div className="su2" style={{
          display:"flex", alignItems:"center", gap:14, marginBottom:30,
        }}>
          <div style={{width:36, height:1, background:`${BRAND.teal}45`}}/>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:12, color:BRAND.teal,
            letterSpacing:"0.20em", textTransform:"uppercase",
          }}>
            Clinical Decision Intelligence
          </div>
          <div style={{width:36, height:1, background:`${BRAND.teal}45`}}/>
        </div>

        {/* Descriptor */}
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

        {/* Stat tiles */}
        <div className="su3" style={{
          display:"flex", gap:20, marginBottom:52,
          flexWrap:"wrap", justifyContent:"center",
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              textAlign:"center", padding:"10px 20px",
              background:T.card,
              border:"1px solid rgba(26,53,85,0.5)",
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
        <div className="su4" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
          <div
            onClick={go}
            onMouseEnter={() => { setHov(true); setAuto(false); }}
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
              userSelect:"none",
            }}
          >
            Begin Shift
          </div>

          {/* Auto-advance progress bar */}
          {auto && (
            <div style={{ width:"100%", marginTop:10, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <div style={{
                width:200, height:2, borderRadius:1,
                background:`${T.teal}18`, overflow:"hidden",
              }}>
                <div style={{
                  height:"100%", borderRadius:1,
                  background:`linear-gradient(90deg,${T.teal},${BRAND.teal})`,
                  width:`${(countdown / AUTO_SECS) * 100}%`,
                  transition:"width 0.85s linear",
                }}/>
              </div>
              <div style={{
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.txt4, letterSpacing:"0.1em",
              }}>
                Auto-advancing in {countdown}s · press any key to cancel
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="su5" style={{ marginTop:36, textAlign:"center" }}>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:"rgba(90,130,168,0.5)",
            letterSpacing:"0.08em",
          }}>
            Clinical decision support only — not a substitute for clinical judgment
          </div>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:7.5, color:"rgba(90,130,168,0.3)",
            marginTop:4, letterSpacing:"0.06em",
          }}>
            Lakonyx v2.0 · Powered by Claude (Anthropic)
          </div>
        </div>

      </div>
    </div>
  );
}