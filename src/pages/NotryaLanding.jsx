import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  const id = "notrya-landing-css";
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = id;
  s.textContent = `
    .nl-root * { box-sizing:border-box; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }

    @keyframes nl-fade-up   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes nl-fade-in   { from{opacity:0} to{opacity:1} }
    @keyframes nl-orb0 { 0%,100%{transform:translate(-50%,-50%) scale(1)}   50%{transform:translate(-50%,-50%) scale(1.15)} }
    @keyframes nl-orb1 { 0%,100%{transform:translate(-50%,-50%) scale(1.1)} 50%{transform:translate(-50%,-50%) scale(.88)} }
    @keyframes nl-orb2 { 0%,100%{transform:translate(-50%,-50%) scale(.92)} 50%{transform:translate(-50%,-50%) scale(1.12)} }
    @keyframes nl-pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
    @keyframes nl-spin    { to{transform:rotate(360deg)} }
    @keyframes nl-shimmer {
      0%   { background-position: -200% center }
      100% { background-position: 200% center }
    }
    @keyframes nl-scan {
      0%   { top: 0%; opacity: 1 }
      100% { top: 100%; opacity: 0 }
    }
    @keyframes nl-float {
      0%,100% { transform: translateY(0px) }
      50%     { transform: translateY(-10px) }
    }
    @keyframes nl-border-glow {
      0%,100% { box-shadow: 0 0 20px rgba(0,229,192,0.15) }
      50%     { box-shadow: 0 0 40px rgba(0,229,192,0.35), 0 0 80px rgba(155,109,255,0.15) }
    }

    .nl-shim-teal {
      background: linear-gradient(90deg,#fff 0%,#00e5c0 30%,#3b9eff 60%,#9b6dff 85%,#fff 100%);
      background-size: 250% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: nl-shimmer 5s linear infinite;
    }
    .nl-shim-gold {
      background: linear-gradient(90deg,#f5c842 0%,#ff9f43 40%,#f5c842 100%);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: nl-shimmer 4s linear infinite;
    }
    .nl-pulse { animation: nl-pulse 2.2s ease-in-out infinite; }
    .nl-float { animation: nl-float 4s ease-in-out infinite; }
    .nl-border-glow { animation: nl-border-glow 3s ease-in-out infinite; }

    .nl-hub-card {
      transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1);
      cursor: pointer;
    }
    .nl-hub-card:hover {
      transform: translateY(-6px) scale(1.025);
    }
    .nl-cta-btn {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .nl-cta-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .nl-cta-btn:active { transform: scale(0.97); }

    .nl-stat-card {
      transition: all 0.2s ease;
    }
    .nl-stat-card:hover { transform: translateY(-3px); }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  border:"#1a3555", borderHi:"#2a4f7a",
  teal:"#00e5c0", gold:"#f5c842", blue:"#3b9eff",
  purple:"#9b6dff", red:"#ff4444", orange:"#ff9f43",
  green:"#3dffa0", coral:"#ff6b6b",
  txt:"#ffffff", txt2:"#d0e8ff", txt3:"#a8c8e8", txt4:"#7aa0c0",
};

const HUBS = [
  { icon:"🫀", label:"Cardiac",        color:T.coral,  route:"/cardiac-hub",        badge:"2025 ACC/AHA" },
  { icon:"🚨", label:"Shock",          color:T.red,    route:"/shock-hub",           badge:"Protocols" },
  { icon:"🌬️", label:"Airway",         color:T.blue,   route:"/airway-hub",          badge:"RSI" },
  { icon:"🦠", label:"Sepsis",         color:T.gold,   route:"/sepsis-hub",          badge:"SSC 2021" },
  { icon:"🧠", label:"Neuro/Stroke",   color:T.purple, route:"/StrokeAssessment",    badge:"AHA 2023" },
  { icon:"🩹", label:"Trauma",         color:T.orange, route:"/trauma-hub",          badge:"ATLS 11" },
  { icon:"💓", label:"Resuscitation",  color:T.red,    route:"/resus-hub",           badge:"ACLS" },
  { icon:"🫁", label:"Airway/Surg",    color:T.blue,   route:"/surgical-airway-hub", badge:"CICO" },
  { icon:"👶", label:"Pediatrics",     color:"#b99bff",route:"/peds-hub",            badge:"PALS 2025" },
  { icon:"🤰", label:"OB/GYN",         color:"#ff6b9d",route:"/ob-hub",              badge:"ACOG" },
  { icon:"☠️", label:"Toxicology",     color:T.green,  route:"/tox-hub",             badge:"Clinical" },
  { icon:"🔬", label:"POCUS",          color:"#00d4ff",route:"/pocus-hub",           badge:"RUSH/FAST" },
];

const FEATURES = [
  {
    icon:"🧠",
    color:T.purple,
    title:"Clinical Narrative Engine",
    desc:"Living patient stories that synthesize all clinical data in real-time. Narrative break detection, pre-discharge safety checks, and AI-powered I-PASS handoffs.",
    route:"/narrative-engine",
    tag:"New",
  },
  {
    icon:"🔴",
    color:T.red,
    title:"Critical Results Inbox",
    desc:"Panic value management with escalation timers, provider acknowledgment workflows, and full audit trail for medico-legal documentation.",
    route:"/critical-inbox",
    tag:"Live",
  },
  {
    icon:"🚪",
    color:T.teal,
    title:"Disposition Board",
    desc:"Real-time boarding timers, bed request tracking, admit/discharge/transfer workflows, and a visual floor plan view for your entire department.",
    route:"/DispositionBoard",
    tag:"Live",
  },
  {
    icon:"📐",
    color:T.blue,
    title:"DDx Engine",
    desc:"AI-powered differential diagnosis generator with weighted probability tiers, must-rule-out flags, and 9 embedded clinical decision rules.",
    route:"/ddx-engine",
    tag:"Live",
  },
  {
    icon:"💊",
    color:T.orange,
    title:"Smart Dosing Hub",
    desc:"Patient-specific drug dosing with renal function calculations, pharmacokinetic adjustments, and AI pharmacist consultation.",
    route:"/smart-dosing",
    tag:"Live",
  },
  {
    icon:"🏥",
    color:T.teal,
    title:"ED Tracking Board",
    desc:"Live patient census with provider assignments, order tracking, result alerts, and real-time notification system for critical changes.",
    route:"/EDTrackingBoard",
    tag:"Live",
  },
];

const STATS = [
  { value:"35+", label:"Clinical Hubs",   sub:"Evidence-based protocols", color:T.teal   },
  { value:"9",   label:"Decision Rules",  sub:"Embedded calculators",     color:T.blue   },
  { value:"2025",label:"Guidelines",      sub:"ACC/AHA · AHA · SSC · ATLS",color:T.gold  },
  { value:"AI",  label:"Powered",         sub:"Every workflow",           color:T.purple },
];

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {[
        { l:"5%",  t:"18%", r:420, c:"rgba(59,158,255,0.05)",  a:"nl-orb0", dur:9   },
        { l:"92%", t:"8%",  r:360, c:"rgba(155,109,255,0.05)", a:"nl-orb1", dur:11  },
        { l:"75%", t:"75%", r:400, c:"rgba(0,229,192,0.045)",  a:"nl-orb2", dur:10  },
        { l:"20%", t:"80%", r:280, c:"rgba(245,200,66,0.04)",  a:"nl-orb0", dur:13  },
        { l:"50%", t:"45%", r:500, c:"rgba(59,158,255,0.025)", a:"nl-orb1", dur:15  },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${o.a} ${o.dur}s ease-in-out infinite`,
        }}/>
      ))}
      {/* Grid overlay */}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.025 }}>
        <defs>
          <pattern id="nlgrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0L0 0 0 50" fill="none" stroke="#3b9eff" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nlgrid)"/>
      </svg>
    </div>
  );
}

function NavBar({ navigate }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      padding:"0 32px", height:60,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      background: scrolled ? "rgba(5,15,30,0.96)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
      transition:"all 0.3s ease",
    }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => navigate("/")}>
        <div style={{
          width:34, height:34, borderRadius:9,
          background:"linear-gradient(135deg,rgba(0,229,192,0.25),rgba(59,158,255,0.15))",
          border:"1px solid rgba(0,229,192,0.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16,
        }}>⚕</div>
        <span style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:T.txt, letterSpacing:-.5 }}>
          Notrya
        </span>
        <span style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
          padding:"2px 7px", borderRadius:20,
          background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)",
          color:T.teal, letterSpacing:1,
        }}>ED</span>
      </div>

      {/* Nav links */}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {[
          { label:"Hub",         route:"/hub"            },
          { label:"Tracking",    route:"/EDTrackingBoard" },
          { label:"Dispo Board", route:"/DispositionBoard"},
          { label:"DDx",         route:"/ddx-engine"     },
          { label:"Narrative",   route:"/narrative-engine"},
        ].map(item => (
          <button key={item.route} onClick={() => navigate(item.route)} style={{
            fontFamily:"DM Sans", fontWeight:500, fontSize:12,
            padding:"6px 14px", borderRadius:8, cursor:"pointer",
            border:"1px solid transparent",
            background:"transparent", color:T.txt3,
            transition:"all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.txt; e.currentTarget.style.background = "rgba(14,37,68,0.6)"; e.currentTarget.style.borderColor = T.border; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.txt3; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
          >{item.label}</button>
        ))}
        <button onClick={() => navigate("/NewPatientInput")} className="nl-cta-btn" style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          padding:"7px 18px", borderRadius:8, cursor:"pointer",
          border:"none", background:T.teal, color:"#050f1e", marginLeft:4,
        }}>+ New Patient</button>
      </div>
    </nav>
  );
}

function HeroSection({ navigate }) {
  return (
    <section style={{
      minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", padding:"80px 24px 40px",
      position:"relative",
    }}>
      <div style={{
        maxWidth:900, margin:"0 auto", textAlign:"center",
        animation:"nl-fade-up .7s ease both",
      }}>
        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
          padding:"6px 16px", borderRadius:30,
          background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.25)",
          color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:24, animation:"nl-fade-up .5s ease both",
        }}>
          <span className="nl-pulse" style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block" }}/>
          Emergency Medicine · AI-Powered · 2025 Guidelines
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:"Playfair Display", fontWeight:900,
          fontSize:"clamp(42px,7vw,88px)",
          lineHeight:1.0, letterSpacing:"-2px", marginBottom:16,
        }}>
          <span className="nl-shim-teal">Clinical Intelligence</span>
          <br/>
          <span style={{ color:T.txt, fontStyle:"italic" }}>at the speed of care.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily:"DM Sans", fontSize:"clamp(15px,2vw,20px)",
          color:T.txt3, lineHeight:1.7, maxWidth:660, margin:"0 auto 36px",
          animation:"nl-fade-up .7s ease .15s both",
        }}>
          Notrya is an AI-native emergency medicine platform — protocols, decision support, documentation, and disposition management, unified in one clinical workspace.
        </p>

        {/* CTAs */}
        <div style={{
          display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap",
          animation:"nl-fade-up .7s ease .25s both",
        }}>
          <button onClick={() => navigate("/EDTrackingBoard")} className="nl-cta-btn" style={{
            fontFamily:"DM Sans", fontWeight:800, fontSize:15,
            padding:"14px 34px", borderRadius:12, cursor:"pointer",
            border:"none",
            background:`linear-gradient(135deg,${T.teal},${T.blue})`,
            color:"#050f1e",
            boxShadow:`0 4px 24px rgba(0,229,192,0.35)`,
          }}>
            Open Tracking Board →
          </button>
          <button onClick={() => navigate("/hub")} className="nl-cta-btn" style={{
            fontFamily:"DM Sans", fontWeight:700, fontSize:15,
            padding:"14px 34px", borderRadius:12, cursor:"pointer",
            background:"rgba(14,37,68,0.8)",
            border:"1px solid rgba(42,79,122,0.6)",
            color:T.txt2,
          }}>
            Browse All Hubs
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{
          marginTop:60, display:"flex", flexDirection:"column", alignItems:"center", gap:6,
          animation:"nl-fade-up .7s ease .4s both",
        }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:2 }}>SCROLL TO EXPLORE</span>
          <div style={{ width:1, height:40, background:`linear-gradient(180deg,${T.teal},transparent)` }}/>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section style={{
      background:"rgba(8,22,40,0.9)",
      backdropFilter:"blur(20px)",
      borderTop:`1px solid ${T.border}`,
      borderBottom:`1px solid ${T.border}`,
      padding:"28px 24px",
    }}>
      <div style={{
        maxWidth:1100, margin:"0 auto",
        display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:0,
      }}>
        {STATS.map((s, i) => (
          <div key={i} className="nl-stat-card" style={{
            textAlign:"center", padding:"16px",
            borderRight: i < STATS.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontWeight:700,
              fontSize:"clamp(28px,4vw,42px)", color:s.color, lineHeight:1,
              marginBottom:6,
            }}>{s.value}</div>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt, marginBottom:3 }}>{s.label}</div>
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection({ navigate }) {
  return (
    <section style={{ padding:"80px 24px", maxWidth:1200, margin:"0 auto" }}>
      {/* Section label */}
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
          color:T.purple, letterSpacing:3, textTransform:"uppercase", marginBottom:12,
        }}>Platform Features</div>
        <h2 style={{
          fontFamily:"Playfair Display", fontWeight:900,
          fontSize:"clamp(28px,4vw,48px)",
          color:T.txt, letterSpacing:-1, lineHeight:1.15, marginBottom:12,
        }}>
          Built for the ED. <br/><span className="nl-shim-teal">Designed for speed.</span>
        </h2>
        <p style={{ fontFamily:"DM Sans", fontSize:15, color:T.txt3, maxWidth:540, margin:"0 auto" }}>
          Every tool purpose-built for emergency medicine workflows — from triage to disposition.
        </p>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",
        gap:16,
      }}>
        {FEATURES.map((f, i) => (
          <div
            key={i}
            onClick={() => navigate(f.route)}
            className="nl-hub-card"
            style={{
              background:"rgba(8,22,40,0.78)",
              backdropFilter:"blur(20px)",
              border:`1px solid ${T.border}`,
              borderRadius:18, padding:"22px",
              borderTop:`2px solid ${f.color}`,
              position:"relative", overflow:"hidden",
            }}
          >
            <div style={{
              position:"absolute", top:-40, right:-40,
              width:160, height:160, borderRadius:"50%",
              background:`radial-gradient(circle,${f.color}0d 0%,transparent 70%)`,
              pointerEvents:"none",
            }}/>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0,
                background:`${f.color}14`,
                border:`1px solid ${f.color}30`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt }}>{f.title}</div>
                <span style={{
                  fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                  padding:"2px 7px", borderRadius:20,
                  background:`${f.color}14`, color:f.color,
                  border:`1px solid ${f.color}30`,
                }}>{f.tag}</span>
              </div>
            </div>
            <p style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3, lineHeight:1.65 }}>{f.desc}</p>
            <div style={{ marginTop:14, fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:f.color }}>
              Open {f.title.split(" ")[0]} →
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HubsSection({ navigate }) {
  return (
    <section style={{
      padding:"60px 24px 80px",
      background:"rgba(5,12,26,0.95)",
      borderTop:`1px solid ${T.border}`,
    }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color:T.teal, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>
            Clinical Hubs
          </div>
          <h2 style={{
            fontFamily:"Playfair Display", fontWeight:900,
            fontSize:"clamp(26px,3.5vw,42px)", color:T.txt, letterSpacing:-1, marginBottom:10,
          }}>
            Every emergency. <span className="nl-shim-gold">Every protocol.</span>
          </h2>
          <p style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt4 }}>
            35+ specialized hubs with 2025 evidence-based guidelines.
          </p>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",
          gap:10,
        }}>
          {HUBS.map((h, i) => (
            <div key={i} onClick={() => navigate(h.route)} className="nl-hub-card" style={{
              background:"rgba(8,22,40,0.7)",
              backdropFilter:"blur(16px)",
              border:`1px solid rgba(42,79,122,0.5)`,
              borderRadius:14, padding:"14px",
              borderLeft:`3px solid ${h.color}`,
            }}>
              <div style={{ fontSize:22, marginBottom:7 }}>{h.icon}</div>
              <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt, marginBottom:4 }}>{h.label}</div>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                color:h.color, letterSpacing:.5,
              }}>{h.badge}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:28 }}>
          <button onClick={() => navigate("/hub")} className="nl-cta-btn" style={{
            fontFamily:"DM Sans", fontWeight:700, fontSize:13,
            padding:"11px 28px", borderRadius:10, cursor:"pointer",
            background:"rgba(14,37,68,0.8)",
            border:`1px solid ${T.teal}40`, color:T.teal,
          }}>View All 35+ Hubs →</button>
        </div>
      </div>
    </section>
  );
}

function CtaSection({ navigate }) {
  return (
    <section style={{ padding:"80px 24px", position:"relative", overflow:"hidden" }}>
      <div style={{
        position:"absolute", left:"50%", top:"50%",
        width:600, height:600, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 65%)",
        transform:"translate(-50%,-50%)", pointerEvents:"none",
      }}/>
      <div style={{
        maxWidth:720, margin:"0 auto", textAlign:"center",
        animation:"nl-fade-up .5s ease both",
      }}>
        <div style={{ fontSize:40, marginBottom:16 }} className="nl-float">⚕</div>
        <h2 style={{
          fontFamily:"Playfair Display", fontWeight:900,
          fontSize:"clamp(28px,4.5vw,54px)",
          color:T.txt, letterSpacing:-1.5, lineHeight:1.1, marginBottom:16,
        }}>
          Your clinical workspace. <br/><span className="nl-shim-teal">Starts now.</span>
        </h2>
        <p style={{ fontFamily:"DM Sans", fontSize:16, color:T.txt3, marginBottom:36, lineHeight:1.7 }}>
          Open the ED Dashboard to view your shift, or jump straight into a clinical hub. Everything is one click away.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => navigate("/EDTrackingBoard")} className="nl-cta-btn nl-border-glow" style={{
            fontFamily:"DM Sans", fontWeight:800, fontSize:16,
            padding:"16px 40px", borderRadius:14, cursor:"pointer",
            background:`linear-gradient(135deg,${T.teal},${T.blue})`,
            border:"none", color:"#050f1e",
          }}>Open Dashboard →</button>
          <button onClick={() => navigate("/hub")} className="nl-cta-btn" style={{
            fontFamily:"DM Sans", fontWeight:700, fontSize:16,
            padding:"16px 40px", borderRadius:14, cursor:"pointer",
            background:"rgba(14,37,68,0.9)",
            border:`1px solid ${T.border}`,
            color:T.txt2,
          }}>Clinical Hub →</button>
        </div>
      </div>
    </section>
  );
}

function Footer({ navigate }) {
  return (
    <footer style={{
      background:"rgba(4,10,20,0.98)",
      borderTop:`1px solid ${T.border}`,
      padding:"36px 24px",
    }}>
      <div style={{
        maxWidth:1100, margin:"0 auto",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"Playfair Display", fontSize:16, fontWeight:700, color:T.txt }}>Notrya</span>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>Emergency Medicine Suite</span>
        </div>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          {[
            { label:"Dashboard",  route:"/EDTrackingBoard" },
            { label:"Hub",        route:"/hub"             },
            { label:"DDx",        route:"/ddx-engine"      },
            { label:"Narrative",  route:"/narrative-engine"},
            { label:"Critical",   route:"/critical-inbox"  },
            { label:"Dispo",      route:"/DispositionBoard"},
          ].map(item => (
            <button key={item.route} onClick={() => navigate(item.route)} style={{
              fontFamily:"DM Sans", fontSize:12, color:T.txt4,
              background:"none", border:"none", cursor:"pointer",
              transition:"color .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = T.teal}
            onMouseLeave={e => e.currentTarget.style.color = T.txt4}
            >{item.label}</button>
          ))}
        </div>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
          CLINICAL DECISION SUPPORT ONLY · NOT A SUBSTITUTE FOR PHYSICIAN JUDGMENT
        </span>
      </div>
    </footer>
  );
}

export default function NotryaLanding() {
  const navigate = useNavigate();

  return (
    <div className="nl-root" style={{
      background:T.bg, minHeight:"100vh", color:T.txt,
      fontFamily:"DM Sans, sans-serif", position:"relative",
    }}>
      <AmbientBg/>
      <div style={{ position:"relative", zIndex:1 }}>
        <NavBar navigate={navigate}/>
        <HeroSection navigate={navigate}/>
        <StatsStrip/>
        <FeaturesSection navigate={navigate}/>
        <HubsSection navigate={navigate}/>
        <CtaSection navigate={navigate}/>
        <Footer navigate={navigate}/>
      </div>
    </div>
  );
}