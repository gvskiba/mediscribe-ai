import { useState, useEffect, useRef, useCallback } from "react";

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;700&family=JetBrains+Mono:wght@400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#060E2B;color:#F0F4FF;font-family:'DM Sans',system-ui,sans-serif;overflow-x:hidden}
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes ecgDraw{from{stroke-dashoffset:2000}to{stroke-dashoffset:0}}
@keyframes bpulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}
@keyframes gdrift{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-10px)}}
@keyframes slowScan{0%{transform:translateX(-120%);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateX(300%);opacity:0}}
@keyframes gridScroll{from{background-position:0 0}to{background-position:60px 60px}}
@keyframes sepPulse{0%{left:-6px;opacity:0}10%{opacity:1}90%{opacity:1}100%{left:calc(100% + 6px);opacity:0}}
@keyframes a1{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
.fr{opacity:0;transform:translateY(22px);transition:opacity .55s ease,transform .55s ease}
.fr.vis{opacity:1;transform:translateY(0)}
.ecg-path{stroke-dasharray:2000;stroke-dashoffset:2000;animation:ecgDraw 3.5s ease forwards .8s}
.slow-scan{animation:slowScan 8s ease-in-out infinite}
.pdot{animation:bpulse 2s ease-in-out infinite}
.sdrift{position:absolute;bottom:48px;left:50%;animation:gdrift 3s ease-in-out infinite}
.ha1{animation:a1 .7s ease both .1s;opacity:0}
.ha2{animation:a1 .7s ease both .25s;opacity:0}
.ha3{animation:a1 .7s ease both .4s;opacity:0}
.ha4{animation:a1 .7s ease both .55s;opacity:0}
`;

// ─── PALETTE ────────────────────────────────────────────────────────────────
const P = {
  navy:"#060E2B",navy2:"#0B1640",
  teal:"#1D9E75",tealL:"#7EC9AA",
  gold:"#EF9F27",goldL:"#FAC775",
  t1:"#F0F4FF",t2:"#7A94C0",t3:"#2A4A7F"
};

// ─── HUB DATA ───────────────────────────────────────────────────────────────
const HUBS = [
  { name:"ECG", sub:"Hub", color:"#1D9E75", glow:"rgba(29,158,117,.25)",
    tag:"cardiology · ai interpreter",
    desc:"STEMI localizer, AV block classifier, wide-complex tachycardia differentiator, CHA\u2082DS\u2082-VASc, serial ECG timer.",
    Icon:()=><path d="M10 36 L22 36 L27 14 L31 58 L36 36 L62 36" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  },
  { name:"Tox", sub:"Hub", color:"#D85A30", glow:"rgba(216,90,48,.25)",
    tag:"toxicology · overdose protocols",
    desc:"Six clinical tabs, antidote calculators, xylazine/tranq protocol, buprenorphine initiation, evidence-graded toxidrome guidance.",
    Icon:()=><g><circle cx="36" cy="36" r="7" fill="none" stroke="#D85A30" strokeWidth="2"/><circle cx="20" cy="24" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/><circle cx="52" cy="24" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/><circle cx="20" cy="48" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/><circle cx="52" cy="48" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/><line x1="29" y1="31" x2="24" y2="27" stroke="#D85A30" strokeWidth="1.5"/><line x1="43" y1="31" x2="48" y2="27" stroke="#D85A30" strokeWidth="1.5"/><line x1="29" y1="41" x2="24" y2="45" stroke="#D85A30" strokeWidth="1.5"/><line x1="43" y1="41" x2="48" y2="45" stroke="#D85A30" strokeWidth="1.5"/></g>
  },
  { name:"Stroke", sub:"Hub", color:"#7F77DD", glow:"rgba(127,119,221,.25)",
    tag:"neurology · time-critical",
    desc:"TIA, seizure, and AMS pathways. StrokeQualityLog, lytics decision support, de-identified quality metrics.",
    Icon:()=><g><ellipse cx="28" cy="36" rx="14" ry="17" fill="none" stroke="#7F77DD" strokeWidth="1.8"/><ellipse cx="44" cy="36" rx="14" ry="17" fill="none" stroke="#7F77DD" strokeWidth="1.8"/><line x1="36" y1="19" x2="36" y2="53" stroke="#070F2C" strokeWidth="3.5"/><line x1="36" y1="19" x2="36" y2="53" stroke="#7F77DD" strokeWidth="1.5" strokeDasharray="3,3"/><path d="M33 26 L29 37 L34 37 L30 50" fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
  },
  { name:"Derm", sub:"Hub", color:"#D4537E", glow:"rgba(212,83,126,.25)",
    tag:"dermatology · skin emergencies",
    desc:"AI web search, LRINEC score, NF protocol, SJS/TEN BSA calculator, DermMorphologyRef, ten evidence-based improvements.",
    Icon:()=><g><rect x="26" y="14" width="20" height="30" rx="5" fill="none" stroke="#D4537E" strokeWidth="2"/><line x1="36" y1="44" x2="36" y2="54" stroke="#D4537E" strokeWidth="2" strokeLinecap="round"/><line x1="24" y1="54" x2="48" y2="54" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round"/><circle cx="36" cy="29" r="6" fill="none" stroke="#EF9F27" strokeWidth="1.5"/><circle cx="36" cy="29" r="2" fill="#EF9F27" opacity="0.5"/></g>
  },
  { name:"Quick", sub:"Note", color:"#EF9F27", glow:"rgba(239,159,39,.25)",
    tag:"documentation · ai-assisted",
    desc:"SmartFill, ICD-10 search, AI HPI summary, MDM narrative, ED Interventions \u2014 complete documentation in under 60 seconds.",
    Icon:()=><g><rect x="18" y="12" width="32" height="42" rx="5" fill="none" stroke="#EF9F27" strokeWidth="2"/><line x1="25" y1="23" x2="43" y2="23" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round"/><line x1="25" y1="31" x2="43" y2="31" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round"/><line x1="25" y1="39" x2="36" y2="39" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round"/><circle cx="50" cy="51" r="9" fill="#070F2C" stroke="#1D9E75" strokeWidth="1.5"/><path d="M47 51 L49 47.5 L51 51 L53 54.5" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></g>
  },
  { name:"Cardiac", sub:"Risk", color:"#E24B4A", glow:"rgba(226,75,74,.25)",
    tag:"acs · risk stratification",
    desc:"HEART, GRACE, TIMI scores. Troponin delta, lytics decision support, evidence-based disposition guidance.",
    Icon:()=><g><path d="M36 50 C36 50 17 39 17 26 C17 20 22 15 28 17.5 C31.5 18.8 34.5 21.8 36 25 C37.5 21.8 40.5 18.8 44 17.5 C50 15 55 20 55 26 C55 39 36 50 36 50Z" fill="none" stroke="#E24B4A" strokeWidth="2"/><path d="M20 58 A16 16 0 0 1 52 58" fill="none" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/><path d="M20 58 A16 16 0 0 1 36 42" fill="none" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round"/></g>
  },
  { name:"Imaging", sub:"Interp", color:"#378ADD", glow:"rgba(55,138,221,.25)",
    tag:"radiology · vision ai",
    desc:"7 modality panels, 3 reading modes, AI vision image upload, 10 evidence-based radiology error mitigations.",
    Icon:()=><g><circle cx="36" cy="36" r="19" fill="none" stroke="#378ADD" strokeWidth="1.5" strokeDasharray="4,4"/><ellipse cx="36" cy="36" rx="10" ry="7" fill="none" stroke="#378ADD" strokeWidth="2"/><circle cx="36" cy="36" r="3.5" fill="#378ADD" opacity="0.6"/><line x1="17" y1="36" x2="26" y2="36" stroke="#378ADD" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="36" x2="55" y2="36" stroke="#378ADD" strokeWidth="2" strokeLinecap="round"/></g>
  },
  { name:"Order", sub:"Generator", color:"#1D9E75", glow:"rgba(29,158,117,.25)",
    tag:"cpoe · rapid ordering",
    desc:"43-drug CPOE text generator, six high-acuity quick bundles, one-tap order set export for any ED presentation.",
    Icon:()=><text x="14" y="54" fontFamily="Georgia,serif" fontSize="42" fontWeight="700" fill="#1D9E75" opacity="0.9">{"\u211E"}</text>
  },
  { name:"MDM", sub:"Builder", color:"#EF9F27", glow:"rgba(239,159,39,.25)",
    tag:"billing · e&m optimization",
    desc:"CPT stepper, critical care time, split/shared attestation, comorbidity linkage \u2014 nine E&M billing upgrades built in.",
    Icon:()=><g><rect x="14" y="17" width="16" height="9" rx="2.5" fill="#EF9F27" opacity="0.9"/><rect x="14" y="31" width="26" height="9" rx="2.5" fill="#EF9F27" opacity="0.65"/><rect x="14" y="45" width="36" height="9" rx="2.5" fill="#EF9F27" opacity="0.4"/><circle cx="55" cy="21" r="6" fill="none" stroke="#EF9F27" strokeWidth="1.5"/><text x="55" y="25" fontFamily="'DM Sans',sans-serif" fontSize="9" fontWeight="700" fill="#EF9F27" textAnchor="middle">$</text></g>
  },
];

// ─── TECH STACK DATA ────────────────────────────────────────────────────────
const STACK = [
  { name:"Anthropic Claude API", desc:"Claude Sonnet powers all AI inference \u2014 HPI generation, ECG interpretation, imaging analysis, and clinical reasoning across every hub in real time.", icon:<path d="M12 2L22 12L12 22L2 12Z" stroke="#1D9E75" strokeWidth="1.5" fill="none"/>,icon2:<path d="M12 8L16 12L12 16L8 12Z" fill="#1D9E75" opacity="0.4"/>},
  { name:"Base44 Platform", desc:"All Notrya hubs are single-file JSX components on Base44 \u2014 rapid iteration, live deployment, and entity-level persistent data storage.", icon:<rect x="3" y="3" width="18" height="18" rx="4" stroke="#1D9E75" strokeWidth="1.5" fill="none"/>,icon2:<path d="M8 12L11 15L16 9" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>},
  { name:"FHIR Integration Layer", desc:"Smart Sync connects to EMR systems via FHIR R4 \u2014 real-time vitals polling, patient context propagation, and bidirectional lab data flow.", icon:<circle cx="12" cy="12" r="9" stroke="#1D9E75" strokeWidth="1.5" fill="none"/>,icon2:<g><path d="M8 12L12 8L16 12L12 16Z" fill="#1D9E75" opacity="0.35"/><circle cx="12" cy="12" r="2.5" fill="#1D9E75"/></g>},
  { name:"ICD-10 & CPT Engine", desc:"Real-time ICD-10 search, CPT code stepping, E&M level estimation, and comorbidity linkage built directly into the documentation flow.", icon:<path d="M4 6H20M4 12H20M4 18H14" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" fill="none"/>,icon2:null},
  { name:"Glassmorphism Design System", desc:"Navy-dark UI with teal, gold, and coral token accents. Playfair Display, DM Sans, JetBrains Mono. Keyboard-first, zero-mouse-click navigation.", icon:<path d="M12 3L21 8L21 16L12 21L3 16L3 8Z" stroke="#1D9E75" strokeWidth="1.5" fill="none"/>,icon2:<circle cx="12" cy="12" r="3" fill="#1D9E75" opacity="0.5"/>},
  { name:"Evidence-Based Protocols", desc:"Every recommendation is graded and sourced. LRINEC, CHA\u2082DS\u2082-VASc, GRACE, TIMI, HEART \u2014 peer-reviewed protocols, not hallucinated guidance.", icon:<g><circle cx="5" cy="12" r="2" fill="#1D9E75"/><circle cx="12" cy="5" r="2" fill="#1D9E75"/><circle cx="19" cy="12" r="2" fill="#1D9E75"/><circle cx="12" cy="19" r="2" fill="#1D9E75"/></g>,icon2:<g><line x1="7" y1="12" x2="10" y2="12" stroke="#1D9E75" strokeWidth="1.5"/><line x1="12" y1="7" x2="12" y2="10" stroke="#1D9E75" strokeWidth="1.5"/><line x1="14" y1="12" x2="17" y2="12" stroke="#1D9E75" strokeWidth="1.5"/><line x1="12" y1="14" x2="12" y2="17" stroke="#1D9E75" strokeWidth="1.5"/></g>},
];

// ─── HOOKS ──────────────────────────────────────────────────────────────────
function useCounter(target, active, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return val;
}

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("vis"), (i % 8) * 85);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".fr").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── SUBCOMPONENTS ──────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", position:"relative", height:1 }}>
      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(29,158,117,.3),transparent)", position:"relative", overflow:"visible" }}>
        <div style={{ position:"absolute", top:-3, width:6, height:6, borderRadius:"50%", background:"#1D9E75", animation:"sepPulse 4s ease-in-out infinite" }}/>
      </div>
    </div>
  );
}

function SLabel({ children }) {
  return <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, letterSpacing:4, color:P.teal, textTransform:"uppercase", marginBottom:14 }}>{children}</div>;
}

function STitle({ children }) {
  return <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(32px,4.5vw,56px)", fontWeight:900, lineHeight:1.08, letterSpacing:-1.5, marginBottom:14 }}>{children}</h2>;
}

function SSub({ children }) {
  return <p style={{ fontSize:16, fontWeight:300, color:P.t2, lineHeight:1.75, maxWidth:540, marginBottom:64 }}>{children}</p>;
}

function HubCard({ hub }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = hub;
  return (
    <div className="fr"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background:P.navy2, border:`1px solid ${hovered ? hub.color : "rgba(29,158,117,.15)"}`, borderRadius:18, padding:28, display:"flex", flexDirection:"column", gap:16, cursor:"pointer", transition:"border-color .25s, transform .22s, box-shadow .25s", transform:hovered?"translateY(-5px)":"translateY(0)", boxShadow:hovered?`0 8px 32px ${hub.glow}`:"none", position:"relative", overflow:"hidden" }}>
      {hovered && <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at top left, ${hub.glow} 0%, transparent 60%)`, pointerEvents:"none" }}/>}
      <div style={{ background:"linear-gradient(135deg,#06091C,#0B1640)", border:"1px solid rgba(29,158,117,.15)", borderRadius:12, padding:20, display:"flex", alignItems:"center", justifyContent:"center", minHeight:88 }}>
        <svg viewBox="0 0 72 72" width="100%" height="72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke={hub.color} strokeWidth="1.2" opacity="0.5"/>
          <Icon/>
        </svg>
        <div style={{ marginLeft:16, flex:1 }}>
          <div style={{ fontSize:18, fontWeight:700, letterSpacing:-.3 }}>{hub.name}<span style={{ color:hub.color, fontWeight:300 }}>{hub.sub}</span></div>
        </div>
      </div>
      <div style={{ fontSize:13, color:P.t2, lineHeight:1.65 }}>{hub.desc}</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2, color:P.t3, textTransform:"uppercase" }}>// {hub.tag}</div>
    </div>
  );
}

function StackCard({ item }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="fr"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background:P.navy2, border:`1px solid ${hovered?"rgba(29,158,117,.45)":"rgba(29,158,117,.15)"}`, borderRadius:16, padding:28, transition:"border-color .2s,transform .2s", transform:hovered?"translateY(-3px)":"translateY(0)" }}>
      <div style={{ width:46, height:46, borderRadius:12, background:"rgba(29,158,117,.12)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none">{item.icon}{item.icon2}</svg>
      </div>
      <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{item.name}</div>
      <div style={{ fontSize:13, color:P.t2, lineHeight:1.65 }}>{item.desc}</div>
    </div>
  );
}

// ─── NAV ────────────────────────────────────────────────────────────────────
function Nav({ scrolled }) {
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, padding:"16px 64px", display:"flex", alignItems:"center", justifyContent:"space-between", background:scrolled?"rgba(6,14,43,.96)":"rgba(6,14,43,.7)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(29,158,117,.2)", transition:"background .3s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <rect width="36" height="36" rx="9" fill="#0B1640"/>
          <path d="M5 18L11 18L13.5 10L16 26L18.5 18L31 18" fill="none" stroke="#EF9F27" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="5" cy="18" r="1.8" fill="#1D9E75" opacity="0.7"/>
          <circle cx="31" cy="18" r="1.8" fill="#1D9E75" opacity="0.7"/>
        </svg>
        <span style={{ fontSize:17, fontWeight:700, letterSpacing:-.3 }}>NOTRYA <span style={{ color:P.teal, fontWeight:300 }}>AI</span></span>
      </div>
      <div style={{ display:"flex", gap:32, listStyle:"none" }}>
        {["Brand","Products","Portfolio","Technology"].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{ color:P.t2, textDecoration:"none", fontSize:12, letterSpacing:"1.5px", textTransform:"uppercase", transition:"color .2s" }}
            onMouseEnter={e=>e.target.style.color=P.teal} onMouseLeave={e=>e.target.style.color=P.t2}>{l}</a>
        ))}
      </div>
      <a href="#contact" style={{ background:P.teal, color:P.navy, fontWeight:700, fontSize:12, letterSpacing:"1.5px", padding:"10px 22px", borderRadius:8, textDecoration:"none", textTransform:"uppercase", transition:"background .2s" }}
        onMouseEnter={e=>e.target.style.background="#22B888"} onMouseLeave={e=>e.target.style.background=P.teal}>
        Request Demo
      </a>
    </nav>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={{ minHeight:"100vh", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"140px 60px 100px", overflow:"hidden", textAlign:"center" }}>
      {/* Backgrounds */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 90% 70% at 50% -10%,rgba(29,158,117,.1) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(239,159,39,.06) 0%,transparent 60%)" }}/>
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(29,158,117,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,158,117,.06) 1px,transparent 1px)", backgroundSize:"60px 60px", animation:"gridScroll 10s linear infinite" }}/>
      {/* Watermark */}
      <div style={{ position:"absolute", fontSize:"clamp(120px,22vw,280px)", fontFamily:"'Playfair Display',serif", fontWeight:900, color:"rgba(29,158,117,.04)", letterSpacing:-8, userSelect:"none", whiteSpace:"nowrap", pointerEvents:"none", zIndex:0 }}>NOTRYA</div>
      {/* Content */}
      <div style={{ position:"relative", zIndex:2, maxWidth:920 }}>
        <div className="ha1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(29,158,117,.1)", border:"1px solid rgba(29,158,117,.3)", borderRadius:100, padding:"6px 18px", marginBottom:36, fontSize:11, letterSpacing:3, color:P.tealL, textTransform:"uppercase" }}>
          <span className="pdot" style={{ width:6, height:6, borderRadius:"50%", background:P.teal, display:"inline-block" }}/>
          Active Development &middot; Seeking Strategic Acquirer
        </div>
        <h1 className="ha2" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(44px,7vw,84px)", fontWeight:900, lineHeight:1.04, letterSpacing:-3, marginBottom:28 }}>
          The <em style={{ fontStyle:"normal", color:P.teal }}>Intelligence</em><br/>Emergency Medicine<br/>Has Been Waiting For
        </h1>
        <p className="ha3" style={{ fontSize:18, fontWeight:300, lineHeight:1.75, color:P.t2, maxWidth:620, margin:"0 auto 52px" }}>
          Notrya AI unifies clinical decision support, AI documentation, and real-time protocol guidance into a single keyboard-first platform purpose-built for emergency physicians.
        </p>
        <div className="ha4" style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <a href="#brand" style={{ background:P.teal, color:P.navy, fontWeight:700, fontSize:13, letterSpacing:"1.5px", padding:"14px 36px", borderRadius:10, textDecoration:"none", textTransform:"uppercase", display:"inline-block" }}>View the Brand</a>
          <a href="#portfolio" style={{ background:"transparent", color:P.t2, border:"1px solid rgba(120,148,192,.3)", fontSize:13, letterSpacing:"1.5px", padding:"14px 36px", borderRadius:10, textDecoration:"none", textTransform:"uppercase", display:"inline-block" }}>Full Portfolio</a>
        </div>
      </div>
      {/* ECG background line */}
      <svg style={{ position:"absolute", bottom:0, left:0, right:0, height:130, opacity:.2 }} viewBox="0 0 1400 130" preserveAspectRatio="none">
        <path className="ecg-path" d="M0,65 L180,65 L210,65 L224,18 L236,105 L248,65 L400,65 L418,65 L434,14 L448,108 L462,65 L640,65 L658,65 L674,20 L688,106 L700,65 L880,65 L898,65 L914,16 L928,110 L942,65 L1120,65 L1138,65 L1154,18 L1168,108 L1182,65 L1400,65" fill="none" stroke="#1D9E75" strokeWidth="1.5"/>
      </svg>
      <div className="sdrift" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:P.t3, fontSize:10, letterSpacing:3, textTransform:"uppercase" }}>
        Scroll <span style={{ fontSize:20, color:P.teal }}>↓</span>
      </div>
    </div>
  );
}

// ─── BRAND SECTION ──────────────────────────────────────────────────────────
function BrandSection() {
  return (
    <div style={{ maxWidth:1400, margin:"0 auto", padding:"100px 64px" }} id="brand">
      <SLabel>// notrya ai brand family</SLabel>
      <STitle>The Flagship. Three Marks.</STitle>
      <SSub>Each logo expresses a different dimension of the Notrya AI platform — sync, interaction philosophy, and clinical identity.</SSub>
      {/* Featured Smart Sync */}
      <div className="fr" style={{ background:P.navy2, border:"1px solid rgba(29,158,117,.25)", borderRadius:24, padding:56, display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center", marginBottom:24, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:"55%", height:"100%", background:"radial-gradient(ellipse at 80% 50%,rgba(29,158,117,.07) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ background:"linear-gradient(135deg,#060E2B,#0D1B4B)", border:"1px solid rgba(29,158,117,.2)", borderRadius:16, padding:36, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
          <div className="slow-scan" style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent 0%,rgba(29,158,117,.06) 50%,transparent 100%)", width:"40%", pointerEvents:"none" }}/>
          <svg viewBox="0 0 560 185" width="100%">
            <defs>
              <marker id="ss1" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><polygon points="0,1.5 9,5 0,8.5" fill="#1D9E75"/></marker>
              <marker id="ss2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><polygon points="0,1.5 9,5 0,8.5" fill="#1D9E75"/></marker>
            </defs>
            <rect x="8" y="8" width="170" height="170" rx="30" fill="#0B1640"/>
            <rect x="8" y="8" width="170" height="170" rx="30" fill="none" stroke="#1D9E75" strokeWidth="1.5" opacity="0.35"/>
            <circle cx="93" cy="93" r="60" fill="none" stroke="#1D3A6B" strokeWidth="1" opacity="0.5"/>
            <path d="M 35.5 72.8 A 60 60 0 0 1 150.5 72.8" fill="none" stroke="#1D9E75" strokeWidth="7.5" strokeLinecap="round" markerEnd="url(#ss1)"/>
            <path d="M 150.5 113.2 A 60 60 0 0 1 35.5 113.2" fill="none" stroke="#1D9E75" strokeWidth="7.5" strokeLinecap="round" markerEnd="url(#ss2)"/>
            <path d="M 24 93 L 56 93 L 64 62 L 72 124 L 79 93 L 162 93" fill="none" stroke="#EF9F27" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="93" cy="33" r="5" fill="#EF9F27" opacity="0.7"/>
            <circle cx="93" cy="153" r="5" fill="#EF9F27" opacity="0.7"/>
            <text x="198" y="90" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="56" fontWeight="700" letterSpacing="-2" fill="#F0F4FF">NOTRYA</text>
            <text x="199" y="90" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="56" fontWeight="300"><tspan fill="none">NOTRYA </tspan><tspan fill="#1D9E75"> AI</tspan></text>
            <line x1="198" y1="106" x2="548" y2="106" stroke="#1D9E75" strokeWidth="0.8" opacity="0.4"/>
            <text x="201" y="136" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="18" fontWeight="400" letterSpacing="8" fill="#7EC9AA" opacity="0.9">SMART SYNC</text>
          </svg>
        </div>
        <div style={{ position:"relative", zIndex:1 }}>
          <span style={{ display:"inline-block", background:"rgba(239,159,39,.1)", border:"1px solid rgba(239,159,39,.3)", color:P.goldL, fontSize:10, letterSpacing:3, padding:"4px 12px", borderRadius:4, marginBottom:20, textTransform:"uppercase" }}>Flagship Mark &middot; v1.0</span>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, letterSpacing:-.5, marginBottom:14 }}>Notrya AI Smart Sync</h3>
          <p style={{ fontSize:15, color:P.t2, lineHeight:1.75, marginBottom:32 }}>Circular sync arrows + gold ECG pulse. The platform&rsquo;s primary identity &mdash; communicating continuous intelligence, clinical rhythm, and real-time AI synchronization.</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {["Navy #0D1B4B","Teal #1D9E75","Gold #EF9F27"].map(p => (
              <span key={p} style={{ background:"rgba(29,158,117,.1)", border:"1px solid rgba(29,158,117,.2)", color:P.tealL, fontSize:11, letterSpacing:1, padding:"5px 14px", borderRadius:100 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
      {/* Keyboard-First + Zero-Click */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22 }}>
        {/* Keyboard-First */}
        <div className="fr" style={{ background:P.navy2, border:"1px solid rgba(29,158,117,.18)", borderRadius:20, overflow:"hidden" }}>
          <div style={{ background:"linear-gradient(135deg,#06091C,#0C1640)", padding:32, display:"flex", alignItems:"center", justifyContent:"center", minHeight:160, position:"relative", overflow:"hidden" }}>
            <div className="slow-scan" style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent 0%,rgba(43,127,224,.05) 50%,transparent 100%)", width:"40%", pointerEvents:"none" }}/>
            <svg viewBox="0 0 680 230" width="100%">
              <rect x="48" y="28" width="152" height="152" rx="24" fill="#071428" stroke="#2B7FE0" strokeWidth="1.5"/>
              <rect x="63" y="43" width="122" height="122" rx="16" fill="#0C1C36"/>
              <line x1="63" y1="79" x2="185" y2="79" stroke="#132240" strokeWidth="0.75"/>
              <line x1="63" y1="130" x2="185" y2="130" stroke="#132240" strokeWidth="0.75"/>
              <line x1="97" y1="43" x2="97" y2="165" stroke="#132240" strokeWidth="0.75"/>
              <line x1="151" y1="43" x2="151" y2="165" stroke="#132240" strokeWidth="0.75"/>
              <rect x="82" y="63" width="13" height="82" rx="3.5" fill="#DEE9F7"/>
              <rect x="157" y="63" width="13" height="82" rx="3.5" fill="#DEE9F7"/>
              <path d="M95 63 L157 145" stroke="#DEE9F7" strokeWidth="12" strokeLinecap="round" fill="none"/>
              <circle cx="88" cy="63" r="6.5" fill="#00BFA5"/>
              <circle cx="170" cy="145" r="6.5" fill="#00BFA5"/>
              <circle cx="126" cy="104" r="5" fill="#2B7FE0"/>
              <line x1="126" y1="99" x2="126" y2="79" stroke="#2B7FE0" strokeWidth="0.75" strokeDasharray="2,3"/>
              <line x1="121" y1="104" x2="97" y2="104" stroke="#2B7FE0" strokeWidth="0.75" strokeDasharray="2,3"/>
              <text x="228" y="120" fontFamily="system-ui,sans-serif" fontSize="66" fontWeight="700" fill="#DEE9F7" letterSpacing="-1">Notrya</text>
              <line x1="228" y1="134" x2="624" y2="134" stroke="#132240" strokeWidth="1"/>
              <text x="228" y="158" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="600" fill="#00BFA5" letterSpacing="3">AI</text>
              <text x="263" y="158" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="300" fill="#2B7FE0"> &times; </text>
              <text x="290" y="158" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="400" fill="#5480A6" letterSpacing="2.5">keyboard-first technology</text>
            </svg>
          </div>
          <div style={{ padding:"22px 24px", borderTop:"1px solid rgba(29,158,117,.12)" }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Keyboard-First Technology</div>
            <div style={{ fontSize:12, color:P.t2, lineHeight:1.65, marginBottom:14 }}>Navy keycap + geometric N letterform with circuit nodes in teal and electric blue. Communicates zero-mouse interaction philosophy.</div>
            <div style={{ display:"flex", gap:6 }}>
              {["#071428","#0C1C36","#2B7FE0","#00BFA5","#DEE9F7"].map(c=><div key={c} style={{ width:18,height:18,borderRadius:4,background:c,border:"1px solid rgba(255,255,255,.1)" }}/>)}
            </div>
          </div>
        </div>
        {/* Zero-Click */}
        <div className="fr" style={{ background:P.navy2, border:"1px solid rgba(29,158,117,.18)", borderRadius:20, overflow:"hidden" }}>
          <div style={{ background:"linear-gradient(135deg,#06091C,#0B1A30)", padding:32, display:"flex", alignItems:"center", justifyContent:"center", minHeight:160 }}>
            <svg viewBox="0 0 256 256" width="52%">
              <defs><clipPath id="kc"><rect x="12" y="12" width="232" height="232" rx="46"/></clipPath></defs>
              <rect x="12" y="12" width="232" height="232" rx="46" fill="#0B1A30"/>
              <rect x="12" y="12" width="232" height="232" rx="46" fill="none" stroke="#12CCE6" strokeWidth="4"/>
              <g clipPath="url(#kc)">
                <path d="M46 40 L76 40 L180 174 L180 40 L210 40 L210 216 L180 216 L76 82 L76 216 L46 216 Z" fill="#E8F3FF"/>
                <path d="M12 128 L64 128 L78 84 L96 182 L114 128 L244 128" fill="none" stroke="#12CCE6" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <circle cx="214" cy="214" r="42" fill="#060C19"/>
              <circle cx="214" cy="214" r="36" fill="#0B1A30" stroke="#12CCE6" strokeWidth="3"/>
              <rect x="200" y="197" width="28" height="36" rx="11" fill="none" stroke="#E8F3FF" strokeWidth="3.5"/>
              <line x1="214" y1="197" x2="214" y2="212" stroke="#E8F3FF" strokeWidth="3.5" strokeLinecap="round"/>
              <line x1="196" y1="232" x2="232" y2="196" stroke="#12CCE6" strokeWidth="5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ padding:"22px 24px", borderTop:"1px solid rgba(29,158,117,.12)" }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Zero-Click ED Documentation</div>
            <div style={{ fontSize:12, color:P.t2, lineHeight:1.65, marginBottom:14 }}>Key mark with N letterform, cyan ECG through center, no-mouse strikethrough badge. Purpose-built for emergency department documentation.</div>
            <div style={{ display:"flex", gap:6 }}>
              {["#060C19","#0B1A30","#12CCE6","#E8F3FF"].map(c=><div key={c} style={{ width:18,height:18,borderRadius:4,background:c,border:"1px solid rgba(255,255,255,.1)" }}/>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLINICAL SUITE ─────────────────────────────────────────────────────────
function ClinicalSuite() {
  return (
    <div style={{ maxWidth:1400, margin:"0 auto", padding:"100px 64px" }} id="products">
      <SLabel>// clinical intelligence suite</SLabel>
      <STitle>Every Hub. One Platform.</STitle>
      <SSub>Nine specialized clinical modules, each with a distinct brand mark &mdash; unified by a single AI backbone and design system.</SSub>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:18 }}>
        {HUBS.map(h => <HubCard key={h.name+h.sub} hub={h}/>)}
      </div>
    </div>
  );
}

// ─── PORTFOLIO ──────────────────────────────────────────────────────────────
function PortfolioSection() {
  return (
    <div style={{ maxWidth:1400, margin:"0 auto", padding:"100px 64px" }} id="portfolio">
      <SLabel>// extended portfolio</SLabel>
      <STitle>Beyond the Platform</STitle>
      <SSub>Adjacent products built with the same clinical rigor, design precision, and AI-first approach.</SSub>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        {/* Hospital Bed Finder */}
        <div className="fr" style={{ background:P.navy2, border:"1px solid rgba(29,158,117,.18)", borderRadius:22, overflow:"hidden" }}>
          <div style={{ background:"linear-gradient(135deg,#030B18,#061525)", padding:"48px 32px", display:"flex", alignItems:"center", justifyContent:"center", minHeight:220 }}>
            <svg viewBox="0 0 560 200" width="100%">
              <rect x="20" y="20" width="160" height="160" rx="30" fill="#0077B6" opacity="0.18"/>
              <rect x="20" y="20" width="160" height="160" rx="30" fill="none" stroke="#00B4D8" strokeWidth="1.8" opacity="0.5"/>
              <rect x="82" y="42" width="36" height="96" rx="6" fill="#ffffff" opacity="0.9"/>
              <rect x="52" y="72" width="96" height="36" rx="6" fill="#ffffff" opacity="0.9"/>
              <rect x="82" y="72" width="36" height="36" rx="4" fill="#00B4D8" opacity="0.3"/>
              <circle cx="152" cy="48" r="20" fill="none" stroke="#00B4D8" strokeWidth="3"/>
              <line x1="166" y1="62" x2="178" y2="74" stroke="#00B4D8" strokeWidth="4" strokeLinecap="round"/>
              <line x1="152" y1="38" x2="152" y2="58" stroke="#00B4D8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              <line x1="142" y1="48" x2="162" y2="48" stroke="#00B4D8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              <path d="M96 148 C96 140 106 136 106 148 C106 158 100 168 100 168 C100 168 96 158 96 148Z" fill="#00B4D8"/>
              <circle cx="101" cy="148" r="4" fill="#030B18"/>
              <text x="205" y="86" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="44" fontWeight="700" letterSpacing="-1.5" fill="#0099CC">Hospital</text>
              <text x="205" y="132" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="44" fontWeight="700" letterSpacing="-1.5">
                <tspan fill="#00B4D8">Bed </tspan><tspan fill="#0077B6">Finder</tspan>
              </text>
              <line x1="205" y1="148" x2="540" y2="148" stroke="#00B4D8" strokeWidth="0.8" opacity="0.35"/>
              <text x="207" y="172" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="14" fontWeight="400" letterSpacing="4" fill="#2A5A7A" opacity="0.9">FIND AVAILABLE BEDS NEAR YOU</text>
            </svg>
          </div>
          <div style={{ padding:"24px 28px 28px", borderTop:"1px solid rgba(29,158,117,.12)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:3, color:P.teal, textTransform:"uppercase", marginBottom:10 }}>// healthcare saas &middot; real-time availability</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, marginBottom:10, letterSpacing:-.5 }}>Hospital Bed Finder</div>
            <p style={{ fontSize:14, color:P.t2, lineHeight:1.65, marginBottom:16 }}>Real-time hospital bed availability platform. Healthcare blue gradient identity combining cross, bed, magnifier, and location pin mark. Three-tone wordmark treatment.</p>
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ background:"rgba(0,119,182,.15)", border:"1px solid rgba(0,119,182,.3)", color:"#00B4D8", fontSize:11, letterSpacing:1, padding:"5px 14px", borderRadius:100 }}>Blue #0077B6</span>
              <span style={{ background:"rgba(0,119,182,.15)", border:"1px solid rgba(0,119,182,.3)", color:"#00B4D8", fontSize:11, letterSpacing:1, padding:"5px 14px", borderRadius:100 }}>Teal #00B4D8</span>
            </div>
          </div>
        </div>
        {/* AI Vision Analysis */}
        <div className="fr" style={{ background:P.navy2, border:"1px solid rgba(29,158,117,.18)", borderRadius:22, overflow:"hidden" }}>
          <div style={{ background:"linear-gradient(135deg,#0A1220,#0E1B2E)", padding:"48px 32px", display:"flex", alignItems:"center", justifyContent:"center", minHeight:220 }}>
            <svg viewBox="0 0 560 200" width="100%">
              <rect x="20" y="20" width="160" height="160" rx="30" fill="#0E1B2E" opacity="0.9"/>
              <rect x="20" y="20" width="160" height="160" rx="30" fill="none" stroke="#00D4C8" strokeWidth="1.8" opacity="0.4"/>
              <circle cx="100" cy="100" r="64" fill="none" stroke="#00D4C8" strokeWidth="0.8" opacity="0.2"/>
              <g stroke="#00D4C8" strokeWidth="1" opacity="0.4">
                <line x1="100" y1="36" x2="100" y2="42"/><line x1="132" y1="44.3" x2="129" y2="49.5"/>
                <line x1="155.7" y1="68" x2="150.5" y2="71"/><line x1="164" y1="100" x2="158" y2="100"/>
                <line x1="155.7" y1="132" x2="150.5" y2="129"/><line x1="132" y1="155.7" x2="129" y2="150.5"/>
                <line x1="100" y1="164" x2="100" y2="158"/><line x1="68" y1="155.7" x2="71" y2="150.5"/>
                <line x1="44.3" y1="132" x2="49.5" y2="129"/><line x1="36" y1="100" x2="42" y2="100"/>
                <line x1="44.3" y1="68" x2="49.5" y2="71"/><line x1="68" y1="44.3" x2="71" y2="49.5"/>
              </g>
              <path d="M36 100 Q100 58 164 100 Q100 142 36 100Z" fill="#071525" stroke="#00D4C8" strokeWidth="2"/>
              <circle cx="100" cy="100" r="26" fill="#071525" stroke="#00C0B2" strokeWidth="2.5"/>
              <line x1="100" y1="74" x2="100" y2="100" stroke="#00C0B2" strokeWidth="0.8" opacity="0.5"/>
              <line x1="122.5" y1="87" x2="100" y2="100" stroke="#00C0B2" strokeWidth="0.8" opacity="0.5"/>
              <line x1="122.5" y1="113" x2="100" y2="100" stroke="#00C0B2" strokeWidth="0.8" opacity="0.5"/>
              <line x1="100" y1="126" x2="100" y2="100" stroke="#00C0B2" strokeWidth="0.8" opacity="0.5"/>
              <line x1="77.5" y1="113" x2="100" y2="100" stroke="#00C0B2" strokeWidth="0.8" opacity="0.5"/>
              <line x1="77.5" y1="87" x2="100" y2="100" stroke="#00C0B2" strokeWidth="0.8" opacity="0.5"/>
              <circle cx="100" cy="100" r="11" fill="#40EEE0" opacity="0.85"/>
              <text x="100" y="104" fontFamily="'Courier New',monospace" fontSize="9" fontWeight="700" fill="#0E1B2E" textAnchor="middle">AI</text>
              <line x1="40" y1="100" x2="160" y2="100" stroke="#FFB830" strokeWidth="1.5" opacity="0.6" strokeDasharray="3,2"/>
              <circle cx="40" cy="100" r="3" fill="#FFB830" opacity="0.8"/>
              <circle cx="160" cy="100" r="3" fill="#FFB830" opacity="0.8"/>
              <path d="M30 30 L30 42 M30 30 L42 30" fill="none" stroke="#00D4C8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M170 30 L170 42 M170 30 L158 30" fill="none" stroke="#00D4C8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M30 170 L30 158 M30 170 L42 170" fill="none" stroke="#00D4C8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M170 170 L170 158 M170 170 L158 170" fill="none" stroke="#00D4C8" strokeWidth="1.5" strokeLinecap="round"/>
              <text x="205" y="78" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="38" fontWeight="700" letterSpacing="2" fill="#00D4C8">AI</text>
              <text x="205" y="116" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="38" fontWeight="700" letterSpacing="-1" fill="#F0F4FF">VISION</text>
              <text x="205" y="148" fontFamily="'DM Sans','Helvetica Neue',Arial,sans-serif" fontSize="28" fontWeight="300" letterSpacing="-0.5" fill="#00D4C8">ANALYSIS</text>
              <line x1="205" y1="158" x2="540" y2="158" stroke="#00D4C8" strokeWidth="0.8" opacity="0.3"/>
              <text x="207" y="178" fontFamily="'Courier New',monospace" fontSize="11" letterSpacing="2" fill="#1A4040" opacity="0.9">computer vision &middot; ai inference</text>
            </svg>
          </div>
          <div style={{ padding:"24px 28px 28px", borderTop:"1px solid rgba(29,158,117,.12)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:3, color:P.teal, textTransform:"uppercase", marginBottom:10 }}>// ai tools &middot; computer vision</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, marginBottom:10, letterSpacing:-.5 }}>AI Vision Analysis</div>
            <p style={{ fontSize:14, color:P.t2, lineHeight:1.65, marginBottom:16 }}>High-precision computer vision platform. Almond eye with neural network iris, gold scan line, measurement ring, corner targeting brackets, and teal pupil bearing the AI mark.</p>
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ background:"rgba(0,212,200,.1)", border:"1px solid rgba(0,212,200,.3)", color:"#00D4C8", fontSize:11, letterSpacing:1, padding:"5px 14px", borderRadius:100 }}>Teal #00D4C8</span>
              <span style={{ background:"rgba(255,184,48,.1)", border:"1px solid rgba(255,184,48,.3)", color:"#FFB830", fontSize:11, letterSpacing:1, padding:"5px 14px", borderRadius:100 }}>Gold #FFB830</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STATS ──────────────────────────────────────────────────────────────────
function StatsSection() {
  const [active, setActive] = useState(false);
  const ref = useRef(null);
  const logos = useCounter(15, active);
  const hubs = useCounter(10, active);
  const drugs = useCounter(43, active);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const stats = [
    { val:logos, suf:"+", label:"Logo Assets" },
    { val:hubs, suf:"+", label:"Clinical Hubs" },
    { val:drugs, suf:"+", label:"CPOE Drug Entries" },
    { val:1, suf:"x", label:"Unified Platform" },
  ];

  return (
    <div style={{ maxWidth:1400, margin:"0 auto", padding:"100px 64px" }} id="technology">
      <SLabel>// platform metrics</SLabel>
      <STitle>Built to Scale with Care</STitle>
      <SSub>The numbers behind a platform designed for real clinical environments.</SSub>
      <div ref={ref} className="fr" style={{ background:P.navy2, border:"1px solid rgba(29,158,117,.2)", borderRadius:24, padding:60 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {stats.map((s,i) => (
            <div key={i} style={{ textAlign:"center", padding:"0 20px", borderLeft:i>0?"1px solid rgba(29,158,117,.15)":"none" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:54, fontWeight:900, letterSpacing:-2, lineHeight:1, marginBottom:10 }}>
                {s.val}<em style={{ fontStyle:"normal", color:P.teal }}>{s.suf}</em>
              </div>
              <div style={{ fontSize:12, color:P.t2, letterSpacing:"1.5px", textTransform:"uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TECH STACK ──────────────────────────────────────────────────────────────
function TechSection() {
  return (
    <div style={{ maxWidth:1400, margin:"0 auto", padding:"100px 64px" }}>
      <SLabel>// under the hood</SLabel>
      <STitle>What Powers Notrya AI</STitle>
      <SSub>A modern, AI-native architecture built for the unique demands of emergency medicine.</SSub>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {STACK.map(item => <StackCard key={item.name} item={item}/>)}
      </div>
    </div>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <div id="contact" style={{ position:"relative", overflow:"hidden", textAlign:"center", padding:"100px 64px 120px", maxWidth:840, margin:"0 auto" }}>
      {/* Radial glow */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 50%,rgba(29,158,117,.08) 0%,transparent 70%)", pointerEvents:"none" }}/>
      {/* Decorative ECG */}
      <svg style={{ position:"absolute", bottom:0, left:0, right:0, height:80, opacity:.12 }} viewBox="0 0 840 80" preserveAspectRatio="none">
        <path d="M0,40 L200,40 L220,40 L228,10 L236,65 L244,40 L400,40 L420,40 L430,8 L440,68 L450,40 L640,40 L655,40 L665,12 L675,66 L685,40 L840,40" fill="none" stroke="#1D9E75" strokeWidth="1.5"/>
      </svg>
      <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, letterSpacing:4, color:P.teal, textTransform:"uppercase", marginBottom:20, position:"relative" }}>// ready to transform care?</p>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(38px,5.5vw,68px)", fontWeight:900, letterSpacing:-2.5, lineHeight:1.04, marginBottom:24, position:"relative" }}>
        The Future of<br/><em style={{ fontStyle:"normal", color:P.teal }}>Emergency Medicine</em><br/>Is Already Built.
      </h2>
      <p style={{ fontSize:17, color:P.t2, lineHeight:1.75, marginBottom:52, position:"relative" }}>
        Notrya AI is actively developed and positioned for strategic acquisition by a leading EHR company. If you are an investor, health system executive, or strategic partner &mdash; let&rsquo;s talk.
      </p>
      <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap", position:"relative" }}>
        <a href="mailto:contact@notrya.ai" style={{ background:P.teal, color:P.navy, fontWeight:700, fontSize:13, letterSpacing:"1.5px", padding:"14px 36px", borderRadius:10, textDecoration:"none", textTransform:"uppercase", display:"inline-block" }}>Contact the Team</a>
        <a href="#brand" style={{ background:"transparent", color:P.t2, border:"1px solid rgba(120,148,192,.3)", fontSize:13, letterSpacing:"1.5px", padding:"14px 36px", borderRadius:10, textDecoration:"none", textTransform:"uppercase", display:"inline-block" }}>Explore All Products</a>
      </div>
    </div>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop:"1px solid rgba(29,158,117,.15)", padding:"40px 64px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ fontWeight:700, fontSize:15 }}>NOTRYA <span style={{ color:P.teal }}>AI</span></div>
      <div style={{ fontSize:12, color:P.t3, letterSpacing:.5 }}>&#169; 2025 Skiba Enterprises &middot; All rights reserved</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:P.t3 }}>v1.0.0 &middot; Smart Sync</div>
    </footer>
  );
}

// ─── ROOT ───────────────────────────────────────────────────────────────────
export default function TechnologyPage() {
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background:P.navy, color:P.t1, fontFamily:"'DM Sans',system-ui,sans-serif", minHeight:"100vh" }}>
      <style>{CSS}</style>
      <Nav scrolled={scrolled}/>
      <Hero/>
      <Divider/>
      <BrandSection/>
      <Divider/>
      <ClinicalSuite/>
      <Divider/>
      <PortfolioSection/>
      <Divider/>
      <StatsSection/>
      <Divider/>
      <TechSection/>
      <Divider/>
      <CTASection/>
      <Footer/>
    </div>
  );
}