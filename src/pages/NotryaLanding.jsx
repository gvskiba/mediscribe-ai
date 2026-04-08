import { useState, useEffect, useRef, useCallback } from "react";

const PREFIX = "lp";

(() => {
  const id = `${PREFIX}-fonts`;
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    @keyframes ${PREFIX}shim { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}orb0 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1 { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    @keyframes ${PREFIX}orb2 { 0%,100%{transform:translate(-50%,-50%) scale(.95)} 50%{transform:translate(-50%,-50%) scale(1.09)} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:.28} }
    @keyframes ${PREFIX}scan  { from{transform:translateY(-100%)} to{transform:translateY(420px)} }
    @keyframes ${PREFIX}tick  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes ${PREFIX}up    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}cnt   { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    .${PREFIX}-shim {
      background:linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#00e5c0 45%,#3b9eff 70%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 2s ease-in-out infinite; }
    .${PREFIX}-scan  { animation:${PREFIX}scan 4s linear infinite; }
    .${PREFIX}-tick  { animation:${PREFIX}tick 30s linear infinite; }
    .${PREFIX}-vis   { animation:${PREFIX}up .65s ease both; }
    .${PREFIX}-hub:hover { transform:translateY(-3px); }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

// ── HUB DATA ──────────────────────────────────────────────────────────
const HUBS = [
  { icon:"🫀", name:"ResusHub",                  desc:"ACLS algorithms, post-ROSC checklists, vasopressor guides, RSI protocols, 5H5T reversible causes.",          tag:"RESUSCITATION",     color:T.red    },
  { icon:"💊", name:"AntidoteHub",               desc:"20 antidotes across 5 categories with dose, mechanism, monitoring, and time-window urgency tiers.",          tag:"TOXICOLOGY",        color:T.teal   },
  { icon:"🩺", name:"ECGHub",                    desc:"SVG waveform library, STEMI equivalents, dangerous patterns, QTc calculator, 8-step reading approach.",       tag:"CARDIOLOGY",        color:T.gold   },
  { icon:"🌬", name:"AirwayHub",                 desc:"RSI drug selection, LEMON assessment, difficult airway algorithm, CICO pathway, post-intubation vent settings.", tag:"AIRWAY",           color:T.blue   },
  { icon:"🩸", name:"SepsisHub",                 desc:"Sepsis-3 screening, source-based infection categories, qSOFA/SIRS calculators, AI-powered resistance lookup.", tag:"SEPSIS",           color:T.orange  },
  { icon:"🧠", name:"PsychHub",                  desc:"Agitation escalation, SI/HI risk assessment, Columbia scoring, Tarasoff logic, intoxication syndromes.",      tag:"BEHAVIORAL",       color:T.purple  },
  { icon:"📋", name:"Patient Tracking Board",    desc:"Live census with provider-specific views, pending order chips, critical result flags, 1-click access.",        tag:"OPERATIONS",       color:T.teal   },
  { icon:"🚪", name:"Disposition Board",          desc:"Admit/discharge/transfer tracking with live boarding timers, 6-hour escalation alerts, bed status.",           tag:"THROUGHPUT",       color:T.blue   },
  { icon:"💊", name:"Smart Dosing Hub",           desc:"Patient-specific renal/hepatic/weight dosing for 40 ED drugs. CrCl, IBW/ABW, Child-Pugh. AI pharmacist.",     tag:"AI · PHARMACOLOGY", color:T.green  },
  { icon:"🔍", name:"DDx Engine",                desc:"AI differential from CC + vitals + context. 9 embedded decision rules. HEART, Wells, PERC, NEXUS, PECARN.",   tag:"AI · DIAGNOSIS",   color:T.purple  },
  { icon:"🚨", name:"Critical Results Inbox",    desc:"Cross-patient critical lab and radiology view. Escalation timers. Acknowledgment audit trail.",                 tag:"PATIENT SAFETY",   color:T.red    },
  { icon:"⏱",  name:"Resuscitation Timer",       desc:"Second-screen code display. CPR cycle countdown, drug timestamps, rhythm log, ROSC screen, event audit.",      tag:"CODE",             color:T.red    },
  { icon:"🧠", name:"Clinical Narrative Engine", desc:"Living patient stories. Narrative break detection. Pre-discharge safety check. Smart I-PASS handoff.",          tag:"FLAGSHIP · AI",    color:T.purple, flagship:true },
];

const COMPARE = [
  ["Clinical decision support",    "Rule-based alerts, 87-97% overridden",  "AI synthesis across all data streams"],
  ["Drug dosing alerts",           "87-97% override rate",                   "Patient-specific, no interruption"],
  ["Differential diagnosis",       "Not available",                          "AI-weighted tiers from CC + vitals"],
  ["Living patient narrative",     "Not available",                          "Real-time synthesis, every patient"],
  ["Premature closure detection",  "Not available",                          "Narrative break alerts"],
  ["Pre-discharge safety review",  "Not available",                          "One-button AI review + checklist"],
  ["Structured handoff",           "Template-based, manual",                 "Auto-generated I-PASS from clinical arc"],
  ["Critical result tracking",     "Per-patient only",                       "Cross-patient inbox with audit trail"],
  ["Resuscitation management",     "Documentation only",                     "Live CPR timer, drug log, code summary"],
  ["Boarding time visibility",     "Requires enterprise configuration",      "Live timers, 6-hour escalation alerts"],
];

const METRICS = [
  { value:13, label:"Clinical Hubs",               sub:"FULLY INTEGRATED",         color:T.teal   },
  { value:9,  label:"Decision Rule Calculators",   sub:"HEART WELLS PERC MORE",    color:T.gold   },
  { value:40, label:"ED Drugs with Renal Dosing",  sub:"PATIENT-SPECIFIC CG CRCL", color:T.green  },
  { value:5,  label:"AI Features",                 sub:"DDx DOSING STORY SAFETY",  color:T.purple },
];

const PROBLEMS = [
  { icon:"📊", title:"Documentation Overload",   text:"Physicians spend twice as much time in the EHR as with patients. Data entry has replaced clinical thinking.", stat:"2x",     statSub:"EHR time vs patient time",    color:T.red    },
  { icon:"🔔", title:"Alert Fatigue",            text:"97.8% of renal dosing alerts are overridden — often incorrectly. EHRs cry wolf constantly, so providers ignore everything.", stat:"97.8%", statSub:"Drug alerts overridden", color:T.orange },
  { icon:"🧠", title:"Lost Clinical Reasoning",  text:"The most important information — the reasoning arc — lives only in the physician's working memory and disappears at shift change.", stat:"0", statSub:"Tools that synthesize across data streams", color:T.blue },
];

const TICKER_ITEMS = [
  "ResusHub","ECGHub","AirwayHub","SepsisHub","ShockHub","AntidoteHub",
  "PsychHub","Smart Dosing Hub","DDx Engine","Critical Results Inbox",
  "Patient Tracking Board","Disposition Board","Resuscitation Timer","Clinical Narrative Engine",
];

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE COMPONENTS
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"10%", t:"15%", r:600, c:"rgba(0,229,192,0.055)",  a:0 },
        { l:"88%", t:"10%", r:520, c:"rgba(59,158,255,0.050)", a:1 },
        { l:"75%", t:"78%", r:680, c:"rgba(155,109,255,0.04)", a:2 },
        { l:"18%", t:"80%", r:440, c:"rgba(245,200,66,0.038)", a:0 },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${o.a} ${9+i*1.4}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Eyebrow({ children, center }) {
  return (
    <div style={{
      fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
      letterSpacing:3, textTransform:"uppercase", color:T.teal,
      marginBottom:14, textAlign: center ? "center" : "left",
    }}>{children}</div>
  );
}

function SectionTitle({ children, center, style = {} }) {
  return (
    <div style={{
      fontFamily:"Playfair Display", fontWeight:900,
      fontSize:"clamp(32px,4.5vw,54px)", letterSpacing:-1.5, lineHeight:1.05,
      marginBottom:16, color:T.txt, textAlign: center ? "center" : "left", ...style,
    }}>{children}</div>
  );
}

function FadeSection({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold:0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={vis ? `${PREFIX}-vis` : ""} style={{ opacity: vis ? 1 : 0, animationDelay:`${delay}s`, ...style }}>
      {children}
    </div>
  );
}

function AnimatedCount({ target, color }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let start; const dur = 1100;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.disconnect();
    }, { threshold:0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return (
    <div ref={ref} style={{
      fontFamily:"Playfair Display", fontWeight:900,
      fontSize:"clamp(42px,5vw,60px)", color, lineHeight:1,
    }}>{val}</div>
  );
}

function HubCard({ hub }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={`${PREFIX}-hub`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:22, borderRadius:14, cursor:"default",
        background: hov ? `linear-gradient(135deg,${hub.color}08,rgba(8,22,40,0.92))` : "rgba(8,22,40,0.78)",
        border:"1px solid rgba(42,79,122,0.3)",
        borderLeft:`3px solid ${hub.color}`,
        boxShadow: hov ? `0 12px 40px rgba(0,0,0,.4),0 0 24px ${hub.color}18` : "none",
        transition:"transform .2s ease, box-shadow .2s ease, background .2s ease",
        position:"relative", overflow:"hidden",
      }}
    >
      {hub.flagship && (
        <div style={{
          position:"absolute", top:10, right:10,
          fontFamily:"JetBrains Mono", fontSize:6, fontWeight:700,
          padding:"2px 7px", borderRadius:20,
          background:`${T.purple}20`, border:`1px solid ${T.purple}45`, color:T.purple,
        }}>FLAGSHIP</div>
      )}
      <div style={{ fontSize:20, marginBottom:12 }}>{hub.icon}</div>
      <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt, marginBottom:6 }}>
        {hub.name}
      </div>
      <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.6, marginBottom:14 }}>
        {hub.desc}
      </div>
      <span style={{
        fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
        letterSpacing:1, padding:"2px 7px", borderRadius:20,
        background:`${hub.color}14`, border:`1px solid ${hub.color}30`, color:hub.color,
      }}>{hub.tag}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(42,79,122,0.35),transparent)", zIndex:2, position:"relative" }}/>;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function NotryaLanding({ onBack }) {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tickerText = [...TICKER_ITEMS, ...TICKER_ITEMS];

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });
  }, []);

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.txt, fontFamily:"DM Sans, sans-serif", overflowX:"hidden", position:"relative" }}>
      <AmbientBg/>

      {/* ── NAV ── */}
      <div style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100, height:58,
        backdropFilter:"blur(24px) saturate(180%)", WebkitBackdropFilter:"blur(24px) saturate(180%)",
        background: navScrolled ? "rgba(5,10,20,0.92)" : "rgba(5,10,20,0.75)",
        borderBottom:`1px solid ${navScrolled ? "rgba(42,79,122,0.5)" : "rgba(42,79,122,0.25)"}`,
        padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between",
        transition:"all .2s",
      }}>
        <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:14, letterSpacing:4, color:T.gold }}>
          NOTRYA
        </div>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          {[["hubs","Hubs"],["narrative","Narrative"],["compare","vs. EHR"]].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              fontFamily:"DM Sans", fontSize:12, fontWeight:500, color:T.txt3,
              background:"none", border:"none", cursor:"pointer", transition:"color .15s",
            }}>{label}</button>
          ))}
          <div style={{
            fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
            padding:"4px 12px", borderRadius:20,
            border:"1px solid rgba(0,229,192,0.35)", background:"rgba(0,229,192,0.07)",
            color:T.teal, letterSpacing:1.5,
          }}>EMERGENCY MEDICINE</div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ position:"relative", zIndex:2, minHeight:"100vh", display:"flex", alignItems:"center", padding:"100px 64px 80px", overflow:"hidden" }}>
        <div style={{ maxWidth:800, animation:`${PREFIX}up .9s ease both .1s` }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:22 }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, letterSpacing:3,
              color:T.teal, textTransform:"uppercase",
              padding:"5px 14px", border:"1px solid rgba(0,229,192,0.22)", borderRadius:20,
              background:"rgba(0,229,192,0.06)",
            }}>
              <span className={`${PREFIX}-pulse`} style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.teal }}/>
              Clinical Intelligence Platform
            </div>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, letterSpacing:3,
              color:T.blue, textTransform:"uppercase",
              padding:"5px 14px", border:"1px solid rgba(59,158,255,0.28)", borderRadius:20,
              background:"rgba(59,158,255,0.07)",
            }}>
              ⌨ Powered by Keyboard-First Technology
            </div>
          </div>

          <div className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display", fontWeight:900,
            fontSize:"clamp(52px,7.5vw,100px)", letterSpacing:-3, lineHeight:.93,
            marginBottom:28, display:"block",
          }}>
            The brain<br/>the EHR<br/>never had.
          </div>

          <p style={{ fontFamily:"DM Sans", fontSize:17, color:T.txt2, lineHeight:1.7, maxWidth:560, marginBottom:40, fontWeight:400 }}>
            Notrya synthesizes every data stream in your ED into a living clinical story for every patient, in real time. Not alerts. Not documentation. <em>Intelligence.</em>
          </p>

          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <button onClick={() => scrollTo("hubs")} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:13,
              padding:"13px 28px", borderRadius:10, cursor:"pointer",
              border:"1px solid rgba(0,229,192,0.42)", background:"rgba(0,229,192,0.11)",
              color:T.teal, display:"inline-flex", alignItems:"center", gap:7,
            }}>Explore All Hubs →</button>
            <button onClick={() => scrollTo("narrative")} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:13,
              padding:"13px 24px", borderRadius:10, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.5)", background:"transparent", color:T.txt3,
            }}>See the Narrative Engine</button>
          </div>

          {/* Hero stats */}
          <div style={{
            display:"flex", gap:36, marginTop:52, paddingTop:36,
            borderTop:"1px solid rgba(42,79,122,0.35)", flexWrap:"wrap",
          }}>
            {[
              { v:"13", label:"Clinical Hubs",         color:T.teal   },
              { v:"9",  label:"Decision Rules",         color:T.gold   },
              { v:"40+",label:"ED Drugs Dosed",         color:T.blue   },
              { v:"0",  label:"Alert Fatigue Events",   color:T.purple },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:28, color:s.color, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:4, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scan line visual */}
        <div style={{
          position:"absolute", right:0, top:58, bottom:0, width:"38%",
          overflow:"hidden", zIndex:-1, pointerEvents:"none",
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(135deg,rgba(0,229,192,0.035) 0%,rgba(59,158,255,0.03) 50%,transparent 100%)",
            borderLeft:"1px solid rgba(42,79,122,0.15)",
          }}/>
          <div className={`${PREFIX}-scan`} style={{
            position:"absolute", left:0, right:0, height:1,
            background:"linear-gradient(90deg,transparent,rgba(0,229,192,0.35),transparent)",
          }}/>
        </div>
      </div>

      {/* ── TICKER ── */}
      <div style={{
        position:"relative", zIndex:2, overflow:"hidden",
        borderTop:"1px solid rgba(42,79,122,0.3)", borderBottom:"1px solid rgba(42,79,122,0.3)",
        background:"rgba(8,22,40,0.7)", padding:"10px 0",
      }}>
        <div className={`${PREFIX}-tick`} style={{ display:"flex", whiteSpace:"nowrap", width:"max-content", gap:0 }}>
          {tickerText.map((item, i) => (
            <span key={i} style={{
              fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
              letterSpacing:2, textTransform:"uppercase", color:T.txt4,
              padding:"0 28px", display:"inline-flex", alignItems:"center", gap:10,
            }}>
              {item}
              <span style={{ color:T.teal, fontSize:14 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <div style={{ position:"relative", zIndex:2 }}>
        <div style={{ maxWidth:1260, margin:"0 auto", padding:"96px 48px" }}>
          <FadeSection>
            <Eyebrow>The Problem</Eyebrow>
            <SectionTitle>EHRs store data.<br/>Physicians synthesize it.</SectionTitle>
            <p style={{ fontSize:15, color:T.txt2, lineHeight:1.7, maxWidth:500, marginBottom:52 }}>
              No tool exists that does the synthesis continuously — across all data streams, for every patient, in real time.
            </p>
          </FadeSection>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
            {PROBLEMS.map((p, i) => (
              <FadeSection key={p.title} delay={i * 0.12}>
                <div style={{
                  padding:24, borderRadius:14,
                  background:"rgba(11,30,54,0.5)", border:"1px solid rgba(42,79,122,0.22)",
                  borderLeft:`3px solid ${p.color}`,
                }}>
                  <div style={{ fontSize:24, marginBottom:14 }}>{p.icon}</div>
                  <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt, marginBottom:8 }}>{p.title}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, lineHeight:1.65, marginBottom:16 }}>{p.text}</div>
                  <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:28, color:p.color }}>{p.stat}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:4 }}>{p.statSub}</div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </div>

      <Divider/>

      {/* ── HUBS ── */}
      <div id="hubs" style={{ position:"relative", zIndex:2 }}>
        <div style={{ maxWidth:1260, margin:"0 auto", padding:"96px 48px" }}>
          <FadeSection>
            <Eyebrow>Clinical Hubs</Eyebrow>
            <SectionTitle>Every clinical domain.<br/>One platform.</SectionTitle>
            <p style={{ fontSize:15, color:T.txt2, lineHeight:1.7, maxWidth:520, marginBottom:52 }}>
              Thirteen purpose-built hubs covering every emergency medicine workflow — each AI-powered, each integrated with the others.
            </p>
          </FadeSection>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:12 }}>
            {HUBS.map((hub, i) => (
              <FadeSection key={hub.name} delay={(i % 4) * 0.07}>
                <HubCard hub={hub}/>
              </FadeSection>
            ))}
          </div>
        </div>
      </div>

      <Divider/>

      {/* ── NARRATIVE ENGINE ── */}
      <div id="narrative" style={{
        position:"relative", zIndex:2,
        background:"rgba(155,109,255,0.025)",
        borderTop:"1px solid rgba(155,109,255,0.12)",
        borderBottom:"1px solid rgba(155,109,255,0.12)",
      }}>
        <div style={{ maxWidth:1260, margin:"0 auto", padding:"96px 48px" }}>
          <FadeSection>
            <Eyebrow>Clinical Narrative Engine</Eyebrow>
            <SectionTitle>The story every<br/>patient deserves.</SectionTitle>
            <p style={{ fontSize:15, color:T.txt2, lineHeight:1.7, maxWidth:520, marginBottom:52 }}>
              Every patient has a clinical arc. For the first time, that arc is visible — continuously updated, synthesized, available to every provider on every shift.
            </p>
          </FadeSection>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.1fr", gap:64, alignItems:"center" }}>
            {/* Feature list */}
            <FadeSection>
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {[
                  { color:T.purple, title:"Living Patient Story",         text:"3-5 sentence synthesis updated in real time as labs result, vitals change, and orders complete. Written like a curbside verbal report to a colleague."        },
                  { color:T.red,    title:"Narrative Break Detection",    text:"When new data contradicts the working diagnosis, a thoughtful, specific alert surfaces. Directly addresses premature closure and anchoring bias."              },
                  { color:T.teal,   title:"Shift Commander View",        text:"Every patient as a one-line narrative, color-coded by diagnostic convergence — not acuity, but clarity. The operational signal attendings actually need."       },
                  { color:T.green,  title:"Pre-Discharge Safety Check",  text:"One button. AI reviews labs, meds, diagnosis, follow-up, and vital trends. Returns exactly what to confirm before the patient leaves."                        },
                  { color:T.blue,   title:"Smart I-PASS Handoff",        text:"Auto-generated from the clinical arc. The incoming provider gets the story, not just the chart. Every shift change, every patient."                            },
                ].map(f => (
                  <div key={f.title} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:f.color, marginTop:5, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt, marginBottom:3 }}>{f.title}</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, lineHeight:1.6 }}>{f.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeSection>

            {/* Live demo card */}
            <FadeSection delay={0.18}>
              <div style={{
                ...glass,
                border:"1px solid rgba(155,109,255,0.25)",
                boxShadow:"0 24px 80px rgba(0,0,0,0.6),0 0 40px rgba(155,109,255,0.07)",
                overflow:"hidden",
              }}>
                {/* Card header */}
                <div style={{
                  background:"rgba(5,10,20,0.9)", padding:"12px 16px",
                  borderBottom:"1px solid rgba(42,79,122,0.3)",
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <span className={`${PREFIX}-pulse`} style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:T.purple }}/>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.txt4, letterSpacing:2 }}>ROOM 3 · NARRATIVE ENGINE</span>
                  <span style={{ marginLeft:"auto", fontFamily:"JetBrains Mono", fontSize:8, color:T.purple }}>LIVE</span>
                </div>
                {/* Card body */}
                <div style={{ padding:18, display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{
                      fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
                      padding:"2px 8px", borderRadius:20,
                      background:"rgba(255,68,68,0.14)", border:"1px solid rgba(255,68,68,0.35)", color:T.red,
                    }}>⚡ FRAGMENTED</span>
                    <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>57M · Chest Pain · 48m in ED</span>
                  </div>

                  <div style={{
                    padding:14, background:"rgba(155,109,255,0.06)", borderRadius:10,
                    borderLeft:`3px solid ${T.purple}`,
                  }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.purple, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>
                      Clinical Story
                    </div>
                    <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt, lineHeight:1.72, fontStyle:"italic" }}>
                      57M with sudden-onset crushing chest pain radiating to jaw, diaphoretic at onset 45 minutes prior. HEART score 5 — highly suspicious history, nonspecific ST changes, age 65+, first troponin 0.08. <strong style={{ color:T.txt, fontStyle:"normal" }}>Delta troponin at 2 hours is the decisive data point — this case is not closed.</strong>
                    </p>
                  </div>

                  <div style={{ padding:"10px 12px", borderRadius:9, borderLeft:`3px solid ${T.red}`, background:"rgba(255,68,68,0.07)" }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.red, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>⚡ Narrative Break</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>
                      <strong style={{ color:T.red }}>Troponin 2.4 ng/mL</strong> (3x normal) — working assessment documents atypical chest pain. Reconsider working diagnosis immediately.
                    </div>
                  </div>

                  <div style={{ padding:"9px 12px", borderRadius:9, borderLeft:`3px solid ${T.gold}`, background:"rgba(245,200,66,0.07)" }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.gold, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Watch For</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>Rate acceleration. BP drop. Any inferior wall motion changes on echo if ordered.</div>
                  </div>

                  <div style={{ display:"flex", gap:7 }}>
                    <div style={{ flex:1, padding:"8px", borderRadius:8, background:"rgba(61,255,160,0.08)", border:"1px solid rgba(61,255,160,0.2)", textAlign:"center", fontFamily:"DM Sans", fontWeight:700, fontSize:10, color:T.green }}>🛡 Safety Check</div>
                    <div style={{ flex:1, padding:"8px", borderRadius:8, background:"rgba(59,158,255,0.08)", border:"1px solid rgba(59,158,255,0.2)", textAlign:"center", fontFamily:"DM Sans", fontWeight:700, fontSize:10, color:T.blue }}>📋 Handoff</div>
                  </div>
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </div>

      {/* ── METRICS ── */}
      <div style={{ position:"relative", zIndex:2 }}>
        <div style={{ maxWidth:1260, margin:"0 auto", padding:"80px 48px 48px" }}>
          <FadeSection>
            <Eyebrow center>By the Numbers</Eyebrow>
            <SectionTitle center>Built for the ED.<br/>Engineered for clarity.</SectionTitle>
          </FadeSection>
        </div>
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          borderTop:"1px solid rgba(42,79,122,0.25)",
          borderBottom:"1px solid rgba(42,79,122,0.25)",
        }}>
          {METRICS.map((m, i) => (
            <div key={m.label} style={{
              padding:"40px 28px", textAlign:"center",
              background:"rgba(8,22,40,0.6)",
              borderRight: i < METRICS.length-1 ? "1px solid rgba(42,79,122,0.2)" : "none",
            }}>
              <AnimatedCount target={m.value} color={m.color}/>
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, fontWeight:500, marginTop:8 }}>{m.label}</div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, marginTop:4, letterSpacing:1 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <Divider/>

      {/* ── COMPARE ── */}
      <div id="compare" style={{ position:"relative", zIndex:2 }}>
        <div style={{ maxWidth:1260, margin:"0 auto", padding:"96px 48px" }}>
          <FadeSection>
            <Eyebrow>vs. The Competition</Eyebrow>
            <SectionTitle>What EHRs do.<br/>What Notrya does instead.</SectionTitle>
            <p style={{ fontSize:15, color:T.txt2, lineHeight:1.7, maxWidth:520, marginBottom:52 }}>
              Epic, Oracle Health, and Cerner are documentation platforms. Notrya is a clinical intelligence platform. The difference is the AI.
            </p>
          </FadeSection>

          <FadeSection>
            <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid rgba(42,79,122,0.3)" }}>
              {/* Table header */}
              <div style={{
                display:"grid", gridTemplateColumns:"1.4fr 1.2fr 1fr",
                background:"rgba(5,10,20,0.9)", padding:"13px 20px",
                borderBottom:"1px solid rgba(42,79,122,0.3)",
              }}>
                {["Capability","Epic / Cerner / Oracle","Notrya"].map((h, i) => (
                  <div key={h} style={{
                    fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
                    letterSpacing:2, textTransform:"uppercase",
                    color: i === 2 ? T.teal : i === 1 ? T.txt4 : T.txt3,
                  }}>{h}</div>
                ))}
              </div>
              {COMPARE.map(([cap, ehr, notrya], i) => (
                <div key={cap} style={{
                  display:"grid", gridTemplateColumns:"1.4fr 1.2fr 1fr",
                  padding:"12px 20px",
                  background: i%2===0 ? "rgba(11,30,54,0.25)" : "rgba(8,22,40,0.35)",
                  borderBottom: i < COMPARE.length-1 ? "1px solid rgba(42,79,122,0.1)" : "none",
                }}>
                  <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt2 }}>{cap}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>{ehr}</div>
                  <div style={{
                    fontFamily:"DM Sans", fontWeight:600, fontSize:11, color:T.teal,
                    display:"flex", alignItems:"center", gap:5,
                  }}>
                    <span style={{ color:T.teal, fontSize:10 }}>✓</span> {notrya}
                  </div>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </div>

      <Divider/>

      {/* ── BOTTOM CTA ── */}
      <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"120px 48px", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse 55% 45% at 50% 50%,rgba(155,109,255,0.06) 0%,transparent 70%)",
        }}/>
        <FadeSection>
          <Eyebrow center>Emergency Medicine · Built by a Physician</Eyebrow>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:18, padding:"5px 16px", border:"1px solid rgba(59,158,255,0.28)", borderRadius:20, background:"rgba(59,158,255,0.07)" }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, letterSpacing:2, color:T.blue, textTransform:"uppercase" }}>⌨ Powered by Keyboard-First Technology</span>
          </div>
          <div className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display", fontWeight:900,
            fontSize:"clamp(36px,5.5vw,68px)", letterSpacing:-2, lineHeight:1.05,
            marginBottom:20,
          }}>
            Intelligence,<br/>not documentation.
          </div>
          <p style={{ fontFamily:"DM Sans", fontSize:15, color:T.txt2, maxWidth:460, margin:"0 auto 40px", lineHeight:1.7 }}>
            Notrya is the platform Epic cannot build — because it requires understanding emergency medicine from the inside.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={() => scrollTo("hubs")} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:14,
              padding:"14px 32px", borderRadius:10, cursor:"pointer",
              border:"1px solid rgba(0,229,192,0.42)", background:"rgba(0,229,192,0.1)", color:T.teal,
            }}>Explore All Hubs →</button>
            <button onClick={() => scrollTo("narrative")} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:14,
              padding:"14px 28px", borderRadius:10, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.5)", background:"transparent", color:T.txt3,
            }}>Narrative Engine Demo</button>
          </div>
        </FadeSection>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        position:"relative", zIndex:2,
        borderTop:"1px solid rgba(42,79,122,0.3)",
        padding:"24px 48px", display:"flex",
        justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10,
      }}>
        {[
          "NOTRYA · CLINICAL INTELLIGENCE PLATFORM",
          "CLINICAL DECISION SUPPORT ONLY · NOT A SUBSTITUTE FOR PHYSICIAN JUDGMENT",
          "2026 NOTRYA",
        ].map(t => (
          <span key={t} style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}