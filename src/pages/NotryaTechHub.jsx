// Notrya Technology Hub — Brand & Platform Showcase
import { useEffect, useRef } from "react";

const T = {
  navy:"#060E2B", navy2:"#0B1640", navy3:"#0D1B4B",
  teal:"#1D9E75", tealL:"#7EC9AA",
  gold:"#EF9F27", goldL:"#FAC775",
  coral:"#D85A30", purple:"#7F77DD", red:"#E24B4A", blue:"#378ADD", pink:"#D4537E",
  t1:"#F0F4FF", t2:"#7A94C0", t3:"#2A4A7F",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ecgDraw{from{stroke-dashoffset:2000}to{stroke-dashoffset:0}}
  @keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
  @keyframes drift{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-10px)}}
  @keyframes scan{0%{transform:translateX(-120%)}100%{transform:translateX(300%)}}
  @keyframes gridScroll{from{background-position:0 0}to{background-position:60px 60px}}
  .nthub-a1{animation:fadeUp .7s ease both .1s}
  .nthub-a2{animation:fadeUp .7s ease both .25s}
  .nthub-a3{animation:fadeUp .7s ease both .4s}
  .nthub-a4{animation:fadeUp .7s ease both .55s}
  .nthub-ecg-path{animation:ecgDraw 3.5s ease forwards .8s}
  .nthub-scan::after{content:'';position:absolute;inset:0;background:linear-gradient(45deg,transparent 40%,rgba(29,158,117,.04) 50%,transparent 60%);animation:scan 5s linear infinite}
  .nthub-hgrid{position:absolute;inset:0;background-image:linear-gradient(rgba(29,158,117,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,158,117,.06) 1px,transparent 1px);background-size:60px 60px;animation:gridScroll 10s linear infinite}
  .nthub-hbdot{width:6px;height:6px;border-radius:50%;background:#1D9E75;animation:pulse 2s ease-in-out infinite;flex-shrink:0}
  .nthub-scroll{position:absolute;bottom:48px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;color:${T.t3};font-size:10px;letter-spacing:3px;text-transform:uppercase;animation:drift 3s ease-in-out infinite}
  .nthub-scroll::after{content:'↓';font-size:20px;color:${T.teal}}
  .nthub-bcard{background:${T.navy2};border:1px solid rgba(29,158,117,.18);border-radius:20px;overflow:hidden;transition:border-color .25s,transform .22s}
  .nthub-bcard:hover{border-color:rgba(29,158,117,.5);transform:translateY(-5px)}
  .nthub-lcard{background:${T.navy2};border:1px solid rgba(29,158,117,.15);border-radius:18px;padding:30px;display:flex;flex-direction:column;gap:18px;cursor:pointer;transition:border-color .25s,transform .22s,background .25s;position:relative;overflow:hidden}
  .nthub-lcard::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top left,rgba(29,158,117,.07) 0%,transparent 55%);opacity:0;transition:opacity .25s}
  .nthub-lcard:hover{border-color:rgba(29,158,117,.55);transform:translateY(-5px);background:rgba(11,22,64,.95)}
  .nthub-lcard:hover::before{opacity:1}
  .nthub-pcard{background:${T.navy2};border:1px solid rgba(29,158,117,.18);border-radius:22px;overflow:hidden;transition:border-color .25s,transform .22s}
  .nthub-pcard:hover{border-color:rgba(29,158,117,.45);transform:translateY(-5px)}
  .nthub-tkcard{background:${T.navy2};border:1px solid rgba(29,158,117,.15);border-radius:16px;padding:28px;transition:border-color .2s,transform .2s}
  .nthub-tkcard:hover{border-color:rgba(29,158,117,.4);transform:translateY(-3px)}
  .nthub-btn1{background:${T.teal};color:${T.navy};font-weight:700;font-size:13px;letter-spacing:1.5px;padding:14px 36px;border-radius:10px;text-decoration:none;text-transform:uppercase;transition:background .2s,transform .15s;display:inline-block;cursor:pointer}
  .nthub-btn1:hover{background:#22B888;transform:translateY(-2px)}
  .nthub-btn2{background:transparent;color:${T.t2};border:1px solid rgba(120,148,192,.3);font-weight:400;font-size:13px;letter-spacing:1.5px;padding:14px 36px;border-radius:10px;text-decoration:none;text-transform:uppercase;transition:border-color .2s,color .2s,transform .15s;display:inline-block;cursor:pointer}
  .nthub-btn2:hover{border-color:${T.teal};color:${T.teal};transform:translateY(-2px)}
  .nthub-ncta{background:${T.teal};color:${T.navy};font-weight:700;font-size:12px;letter-spacing:1.5px;padding:10px 22px;border-radius:8px;text-decoration:none;text-transform:uppercase;transition:background .2s}
  .nthub-ncta:hover{background:#22B888}
  .nthub-nav a{color:${T.t2};text-decoration:none;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;transition:color .2s}
  .nthub-nav a:hover{color:${T.teal}}
  .nthub-si+.nthub-si{border-left:1px solid rgba(29,158,117,.15)}
  @media(max-width:900px){
    .nthub-bgrid{grid-template-columns:1fr!important}
    .nthub-feat{grid-template-columns:1fr!important;gap:28px!important;padding:28px!important}
    .nthub-pgrid{grid-template-columns:1fr!important}
    .nthub-sgrid{grid-template-columns:repeat(2,1fr)!important}
    .nthub-tkgrid{grid-template-columns:1fr!important}
    .nthub-navlinks{display:none!important}
  }
`;

function InjectStyles() {
  useEffect(() => {
    const id = "nthub-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = css;
      document.head.appendChild(s);
    }
    return () => {};
  }, []);
  return null;
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".nthub-reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => {
            e.target.style.opacity = "1";
            e.target.style.transform = "translateY(0)";
          }, (i % 9) * 80);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateY(22px)";
      el.style.transition = "opacity .55s ease,transform .55s ease";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
}

const SL = ({ children }) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, letterSpacing:4, color:T.teal, textTransform:"uppercase", marginBottom:14 }}>{children}</div>
);
const ST = ({ children }) => (
  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(32px,4.5vw,56px)", fontWeight:700, lineHeight:1.08, letterSpacing:"-1.5px", marginBottom:14 }}>{children}</div>
);
const SS = ({ children }) => (
  <p style={{ fontSize:16, fontWeight:300, color:T.t2, lineHeight:1.75, maxWidth:540, marginBottom:64 }}>{children}</p>
);
const Pill = ({ children, style }) => (
  <span style={{ background:"rgba(29,158,117,.1)", border:"1px solid rgba(29,158,117,.2)", color:T.tealL, fontSize:11, letterSpacing:1, padding:"5px 14px", borderRadius:100, ...style }}>{children}</span>
);
const Sep = () => (
  <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(29,158,117,.3),transparent)", maxWidth:1400, margin:"0 auto" }} />
);
const Wrap = ({ children, id }) => (
  <div id={id} style={{ maxWidth:1400, margin:"0 auto", padding:"100px 64px" }}>{children}</div>
);

// ── Logo SVGs ─────────────────────────────────────────────────────────────────
const NotryaLogo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="9" fill="#0B1640"/>
    <path d="M5 18L11 18L13.5 10L16 26L18.5 18L31 18" fill="none" stroke="#EF9F27" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5" cy="18" r="1.8" fill="#1D9E75" opacity="0.7"/>
    <circle cx="31" cy="18" r="1.8" fill="#1D9E75" opacity="0.7"/>
  </svg>
);

const HubIcon = ({ color, children }) => (
  <svg width="200" height="72" viewBox="0 0 200 72">{children}</svg>
);

export default function NotryaTechHub() {
  useScrollReveal();

  const HUBS = [
    {
      name: "ECG", nameColor: T.teal, nameSuffix: "Hub", tag: "// cardiology · ai interpreter",
      desc: "STEMI localizer, AV block classifier, wide-complex tachycardia differentiator, CHA₂DS₂-VASc, serial ECG timer, AI interpreter.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#1D9E75" strokeWidth="1.2" opacity="0.5"/>
          <path d="M10 36 L22 36 L27 14 L31 58 L36 36 L62 36" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="82" y="32" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="700" fill="#F0F4FF" letterSpacing="-.5">ECG</text>
          <text x="82" y="55" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="300" fill="#1D9E75" letterSpacing="-.5">Hub</text>
        </svg>
      ),
    },
    {
      name: "Tox", nameColor: T.coral, nameSuffix: "Hub", tag: "// toxicology · overdose protocols",
      desc: "Six clinical tabs, antidote calculators, xylazine/tranq protocol, buprenorphine initiation, evidence-graded toxidrome guidance.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#D85A30" strokeWidth="1.2" opacity="0.5"/>
          <circle cx="36" cy="36" r="7" fill="none" stroke="#D85A30" strokeWidth="2"/>
          <circle cx="20" cy="24" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/>
          <circle cx="52" cy="24" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/>
          <circle cx="20" cy="48" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/>
          <circle cx="52" cy="48" r="4.5" fill="none" stroke="#D85A30" strokeWidth="1.5"/>
          <line x1="29" y1="31" x2="24" y2="27" stroke="#D85A30" strokeWidth="1.5"/>
          <line x1="43" y1="31" x2="48" y2="27" stroke="#D85A30" strokeWidth="1.5"/>
          <line x1="29" y1="41" x2="24" y2="45" stroke="#D85A30" strokeWidth="1.5"/>
          <line x1="43" y1="41" x2="48" y2="45" stroke="#D85A30" strokeWidth="1.5"/>
          <text x="82" y="32" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="700" fill="#F0F4FF" letterSpacing="-.5">Tox</text>
          <text x="82" y="55" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="300" fill="#D85A30" letterSpacing="-.5">Hub</text>
        </svg>
      ),
    },
    {
      name: "Stroke", nameColor: T.purple, nameSuffix: "Hub", tag: "// neurology · time-critical",
      desc: "TIA, seizure, and AMS pathways. StrokeQualityLog, lytics decision support, de-identified quality metrics.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#7F77DD" strokeWidth="1.2" opacity="0.5"/>
          <ellipse cx="28" cy="36" rx="14" ry="17" fill="none" stroke="#7F77DD" strokeWidth="1.8"/>
          <ellipse cx="44" cy="36" rx="14" ry="17" fill="none" stroke="#7F77DD" strokeWidth="1.8"/>
          <line x1="36" y1="19" x2="36" y2="53" stroke="#070F2C" strokeWidth="3.5"/>
          <line x1="36" y1="19" x2="36" y2="53" stroke="#7F77DD" strokeWidth="1.5" strokeDasharray="3,3"/>
          <path d="M33 26 L29 37 L34 37 L30 50" fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="82" y="32" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="700" fill="#F0F4FF" letterSpacing="-.5">Stroke</text>
          <text x="82" y="55" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="300" fill="#7F77DD" letterSpacing="-.5">Hub</text>
        </svg>
      ),
    },
    {
      name: "Derm", nameColor: T.pink, nameSuffix: "Hub", tag: "// dermatology · skin emergencies",
      desc: "AI web search, LRINEC score, NF protocol, SJS/TEN BSA calculator, DermMorphologyRef, ten evidence-based improvements.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#D4537E" strokeWidth="1.2" opacity="0.5"/>
          <rect x="26" y="14" width="20" height="30" rx="5" fill="none" stroke="#D4537E" strokeWidth="2"/>
          <line x1="36" y1="44" x2="36" y2="54" stroke="#D4537E" strokeWidth="2" strokeLinecap="round"/>
          <line x1="24" y1="54" x2="48" y2="54" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="36" cy="29" r="6" fill="none" stroke="#EF9F27" strokeWidth="1.5"/>
          <circle cx="36" cy="29" r="2" fill="#EF9F27" opacity="0.5"/>
          <text x="82" y="30" fontFamily="'DM Sans',sans-serif" fontSize="16" fontWeight="700" fill="#F0F4FF" letterSpacing="-.3">Derm</text>
          <text x="82" y="47" fontFamily="'DM Sans',sans-serif" fontSize="16" fontWeight="300" fill="#D4537E" letterSpacing="-.3">atology</text>
          <text x="82" y="62" fontFamily="'DM Sans',sans-serif" fontSize="16" fontWeight="300" fill="#D4537E" letterSpacing="-.3">Hub</text>
        </svg>
      ),
    },
    {
      name: "Quick", nameColor: T.gold, nameSuffix: "Note", tag: "// documentation · ai-assisted",
      desc: "SmartFill, ICD-10 search, AI HPI summary, MDM narrative, ED Interventions — complete documentation in under 60 seconds.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#EF9F27" strokeWidth="1.2" opacity="0.5"/>
          <rect x="18" y="12" width="32" height="42" rx="5" fill="none" stroke="#EF9F27" strokeWidth="2"/>
          <line x1="25" y1="23" x2="43" y2="23" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="25" y1="31" x2="43" y2="31" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="25" y1="39" x2="36" y2="39" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="50" cy="51" r="9" fill="#070F2C" stroke="#1D9E75" strokeWidth="1.5"/>
          <path d="M47 51 L49 47.5 L51 51 L53 54.5" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="82" y="32" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="700" fill="#F0F4FF" letterSpacing="-.5">Quick</text>
          <text x="82" y="55" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="300" fill="#EF9F27" letterSpacing="-.5">Note</text>
        </svg>
      ),
    },
    {
      name: "Cardiac", nameColor: T.red, nameSuffix: "Risk", tag: "// acs · risk stratification",
      desc: "HEART, GRACE, TIMI scores. Troponin delta, lytics decision support, evidence-based disposition guidance.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#E24B4A" strokeWidth="1.2" opacity="0.5"/>
          <path d="M36 50 C36 50 17 39 17 26 C17 20 22 15 28 17.5 C31.5 18.8 34.5 21.8 36 25 C37.5 21.8 40.5 18.8 44 17.5 C50 15 55 20 55 26 C55 39 36 50 36 50Z" fill="none" stroke="#E24B4A" strokeWidth="2"/>
          <path d="M20 58 A16 16 0 0 1 52 58" fill="none" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
          <path d="M20 58 A16 16 0 0 1 36 42" fill="none" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round"/>
          <text x="82" y="30" fontFamily="'DM Sans',sans-serif" fontSize="18" fontWeight="700" fill="#F0F4FF" letterSpacing="-.4">Cardiac</text>
          <text x="82" y="50" fontFamily="'DM Sans',sans-serif" fontSize="18" fontWeight="300" fill="#E24B4A" letterSpacing="-.4">Risk</text>
        </svg>
      ),
    },
    {
      name: "Imaging", nameColor: T.blue, nameSuffix: "Interp", tag: "// radiology · vision ai",
      desc: "7 modality panels, 3 reading modes, AI vision image upload, 10 evidence-based radiology error mitigations.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#378ADD" strokeWidth="1.2" opacity="0.5"/>
          <circle cx="36" cy="36" r="19" fill="none" stroke="#378ADD" strokeWidth="1.5" strokeDasharray="4,4"/>
          <ellipse cx="36" cy="36" rx="10" ry="7" fill="none" stroke="#378ADD" strokeWidth="2"/>
          <circle cx="36" cy="36" r="3.5" fill="#378ADD" opacity="0.6"/>
          <line x1="17" y1="36" x2="26" y2="36" stroke="#378ADD" strokeWidth="2" strokeLinecap="round"/>
          <line x1="46" y1="36" x2="55" y2="36" stroke="#378ADD" strokeWidth="2" strokeLinecap="round"/>
          <text x="82" y="28" fontFamily="'DM Sans',sans-serif" fontSize="16" fontWeight="700" fill="#F0F4FF" letterSpacing="-.3">Imaging</text>
          <text x="82" y="46" fontFamily="'DM Sans',sans-serif" fontSize="16" fontWeight="300" fill="#378ADD" letterSpacing="-.3">Inter-</text>
          <text x="82" y="63" fontFamily="'DM Sans',sans-serif" fontSize="16" fontWeight="300" fill="#378ADD" letterSpacing="-.3">preter</text>
        </svg>
      ),
    },
    {
      name: "Order", nameColor: T.teal, nameSuffix: "Generator", tag: "// cpoe · rapid ordering",
      desc: "43-drug CPOE text generator, six high-acuity quick bundles, one-tap order set export for any ED presentation.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#1D9E75" strokeWidth="1.2" opacity="0.5"/>
          <text x="14" y="54" fontFamily="Georgia,serif" fontSize="42" fontWeight="700" fill="#1D9E75" opacity="0.9">℞</text>
          <text x="82" y="26" fontFamily="'DM Sans',sans-serif" fontSize="15" fontWeight="700" fill="#F0F4FF" letterSpacing="-.2">Order</text>
          <text x="82" y="44" fontFamily="'DM Sans',sans-serif" fontSize="15" fontWeight="300" fill="#1D9E75" letterSpacing="-.2">Generator</text>
          <text x="82" y="62" fontFamily="'DM Sans',sans-serif" fontSize="15" fontWeight="300" fill="#1D9E75" letterSpacing="-.2">Hub</text>
        </svg>
      ),
    },
    {
      name: "MDM", nameColor: T.gold, nameSuffix: "Builder", tag: "// billing · e&m optimization",
      desc: "CPT stepper, critical care time, split/shared attestation, comorbidity linkage — nine E&M billing upgrades built in.",
      icon: (
        <svg width="200" height="72" viewBox="0 0 200 72">
          <rect x="4" y="4" width="64" height="64" rx="14" fill="#070F2C"/>
          <rect x="4" y="4" width="64" height="64" rx="14" fill="none" stroke="#EF9F27" strokeWidth="1.2" opacity="0.5"/>
          <rect x="14" y="17" width="16" height="9" rx="2.5" fill="#EF9F27" opacity="0.9"/>
          <rect x="14" y="31" width="26" height="9" rx="2.5" fill="#EF9F27" opacity="0.65"/>
          <rect x="14" y="45" width="36" height="9" rx="2.5" fill="#EF9F27" opacity="0.4"/>
          <circle cx="55" cy="21" r="6" fill="none" stroke="#EF9F27" strokeWidth="1.5"/>
          <text x="55" y="25" fontFamily="'DM Sans',sans-serif" fontSize="9" fontWeight="700" fill="#EF9F27" textAnchor="middle">$</text>
          <text x="82" y="32" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="700" fill="#F0F4FF" letterSpacing="-.5">MDM</text>
          <text x="82" y="55" fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="300" fill="#EF9F27" letterSpacing="-.5">Builder</text>
        </svg>
      ),
    },
  ];

  const TECH = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L22 12L12 22L2 12Z" stroke="#1D9E75" strokeWidth="1.5"/><path d="M12 8L16 12L12 16L8 12Z" fill="#1D9E75" opacity="0.4"/></svg>,
      name: "Anthropic Claude API",
      desc: "Claude Sonnet powers all AI inference — HPI generation, ECG interpretation, imaging analysis, and clinical reasoning across every hub in real time.",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#1D9E75" strokeWidth="1.5"/><path d="M8 12L11 15L16 9" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      name: "Base44 Platform",
      desc: "All Notrya hubs are single-file JSX components on Base44 — enabling rapid iteration, live deployment, and entity-level persistent data storage.",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1D9E75" strokeWidth="1.5"/><path d="M8 12L12 8L16 12L12 16Z" fill="#1D9E75" opacity="0.35"/><circle cx="12" cy="12" r="2.5" fill="#1D9E75"/></svg>,
      name: "FHIR Integration Layer",
      desc: "Smart Sync connects to EMR systems via FHIR R4 — real-time vitals polling, patient context propagation, and bidirectional lab data flow.",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6H20M4 12H20M4 18H14" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      name: "ICD-10 & CPT Engine",
      desc: "Real-time ICD-10 search, CPT code stepping, E&M level estimation, and comorbidity linkage built directly into the documentation flow.",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3L21 8L21 16L12 21L3 16L3 8Z" stroke="#1D9E75" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="#1D9E75" opacity="0.5"/></svg>,
      name: "Glassmorphism Design System",
      desc: "Navy-dark UI with teal, gold, and coral token accents. Playfair Display, DM Sans, JetBrains Mono. Keyboard-first, zero-mouse-click navigation architecture.",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="2" fill="#1D9E75"/><circle cx="12" cy="5" r="2" fill="#1D9E75"/><circle cx="19" cy="12" r="2" fill="#1D9E75"/><circle cx="12" cy="19" r="2" fill="#1D9E75"/><line x1="7" y1="12" x2="10" y2="12" stroke="#1D9E75" strokeWidth="1.5"/><line x1="12" y1="7" x2="12" y2="10" stroke="#1D9E75" strokeWidth="1.5"/><line x1="14" y1="12" x2="17" y2="12" stroke="#1D9E75" strokeWidth="1.5"/><line x1="12" y1="14" x2="12" y2="17" stroke="#1D9E75" strokeWidth="1.5"/></svg>,
      name: "Evidence-Based Protocols",
      desc: "Every recommendation is graded and sourced. LRINEC, CHA₂DS₂-VASc, GRACE, TIMI, HEART — peer-reviewed protocols, not hallucinated guidance.",
    },
  ];

  return (
    <div style={{ background: T.navy, color: T.t1, fontFamily:"'DM Sans',system-ui,sans-serif", minHeight:"100vh", overflowX:"hidden" }}>
      <InjectStyles />

      {/* ── NAV ── */}
      <nav className="nthub-nav" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        padding:"16px 64px", display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(6,14,43,.9)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(29,158,117,.2)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <NotryaLogo />
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-.3px" }}>
            NOTRYA <span style={{ fontWeight:300, color:T.teal }}>AI</span>
          </span>
        </div>
        <ul className="nthub-navlinks" style={{ display:"flex", gap:32, listStyle:"none" }}>
          {["brand","products","portfolio","technology"].map(s => (
            <li key={s}><a href={`#${s}`}>{s}</a></li>
          ))}
        </ul>
        <a href="#contact" className="nthub-ncta">Request Demo</a>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        minHeight:"100vh", position:"relative", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"140px 60px 100px",
        overflow:"hidden", textAlign:"center",
      }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 90% 70% at 50% -10%,rgba(29,158,117,.1) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(239,159,39,.06) 0%,transparent 60%)" }} />
        <div className="nthub-hgrid" />

        <div className="nthub-a1" style={{ position:"relative", zIndex:2, maxWidth:920 }}>
          <div className="nthub-a1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(29,158,117,.1)", border:"1px solid rgba(29,158,117,.3)", borderRadius:100, padding:"6px 18px", marginBottom:36, fontSize:11, letterSpacing:3, color:T.tealL, textTransform:"uppercase" }}>
            <div className="nthub-hbdot" />
            Active Development · Seeking Strategic Acquirer
          </div>
          <h1 className="nthub-a2" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(44px,7vw,84px)", fontWeight:900, lineHeight:1.04, letterSpacing:"-3px", marginBottom:28 }}>
            The <em style={{ fontStyle:"normal", color:T.teal }}>Intelligence</em><br/>
            Emergency Medicine<br/>Has Been Waiting For
          </h1>
          <p className="nthub-a3" style={{ fontSize:18, fontWeight:300, lineHeight:1.75, color:T.t2, maxWidth:620, margin:"0 auto 52px" }}>
            Notrya AI unifies clinical decision support, AI documentation, and real-time protocol guidance into a single keyboard-first platform purpose-built for emergency physicians.
          </p>
          <div className="nthub-a4" style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="#brand" className="nthub-btn1">View the Brand</a>
            <a href="#portfolio" className="nthub-btn2">Full Portfolio</a>
          </div>
        </div>

        <svg style={{ position:"absolute", bottom:0, left:0, right:0, height:130, opacity:.2 }} viewBox="0 0 1400 130" preserveAspectRatio="none">
          <path className="nthub-ecg-path"
            d="M0,65 L180,65 L210,65 L224,18 L236,105 L248,65 L400,65 L418,65 L434,14 L448,108 L462,65 L640,65 L658,65 L674,20 L688,106 L700,65 L880,65 L898,65 L914,16 L928,110 L942,65 L1120,65 L1138,65 L1154,18 L1168,108 L1182,65 L1400,65"
            fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeDasharray="2000" strokeDashoffset="2000" />
        </svg>
        <div className="nthub-scroll">Scroll</div>
      </div>

      {/* ── BRAND FAMILY ── */}
      <Wrap id="brand">
        <SL>// notrya ai brand family</SL>
        <ST>The Flagship. Three Marks.</ST>
        <SS>Each logo expresses a different dimension of the Notrya AI platform — sync, interaction philosophy, and clinical identity.</SS>

        {/* Featured Smart Sync */}
        <div className="nthub-reveal nthub-feat nthub-scan" style={{
          background:T.navy2, border:"1px solid rgba(29,158,117,.25)", borderRadius:24, padding:56,
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center",
          position:"relative", overflow:"hidden", marginBottom:48,
        }}>
          <div style={{ position:"absolute", top:0, right:0, width:"55%", height:"100%", background:"radial-gradient(ellipse at 80% 50%,rgba(29,158,117,.07) 0%,transparent 70%)" }} />
          <div style={{ background:"linear-gradient(135deg,#060E2B,#0D1B4B)", border:"1px solid rgba(29,158,117,.2)", borderRadius:16, padding:36, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 560 185">
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
            <span style={{ display:"inline-block", background:"rgba(239,159,39,.1)", border:"1px solid rgba(239,159,39,.3)", color:T.goldL, fontSize:10, letterSpacing:3, padding:"4px 12px", borderRadius:4, marginBottom:20, textTransform:"uppercase" }}>Flagship Mark · v1.0</span>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, letterSpacing:"-.5px", marginBottom:14 }}>Notrya AI Smart Sync</h3>
            <p style={{ fontSize:15, color:T.t2, lineHeight:1.75, marginBottom:32 }}>Circular sync arrows + gold ECG pulse. The platform's primary identity — communicating continuous intelligence, clinical rhythm, and real-time AI synchronization.</p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <Pill>Navy #0D1B4B</Pill><Pill>Teal #1D9E75</Pill><Pill>Gold #EF9F27</Pill>
            </div>
          </div>
        </div>

        {/* Keyboard + Zero-Click */}
        <div className="nthub-bgrid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:22 }}>
          {/* Keyboard-First */}
          <div className="nthub-bcard nthub-reveal">
            <div style={{ background:"linear-gradient(135deg,#06091C 0%,#0C1640 100%)", padding:32, display:"flex", alignItems:"center", justifyContent:"center", minHeight:160, position:"relative", overflow:"hidden" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 230">
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
                <text x="228" y="120" fontFamily="system-ui,sans-serif" fontSize="66" fontWeight="700" fill="#DEE9F7" letterSpacing="-1">Notrya</text>
                <line x1="228" y1="134" x2="624" y2="134" stroke="#132240" strokeWidth="1"/>
                <text x="228" y="158" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="600" fill="#00BFA5" letterSpacing="3">AI</text>
                <text x="263" y="158" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="300" fill="#2B7FE0"> × </text>
                <text x="290" y="158" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="400" fill="#5480A6" letterSpacing="2.5">keyboard-first technology</text>
              </svg>
            </div>
            <div style={{ padding:"22px 24px", borderTop:"1px solid rgba(29,158,117,.12)" }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Keyboard-First Technology</div>
              <div style={{ fontSize:12, color:T.t2, lineHeight:1.65, marginBottom:14 }}>Navy keycap icon with geometric N letterform, circuit nodes in teal and electric blue. Communicates zero-mouse interaction philosophy.</div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {["#071428","#0C1C36","#2B7FE0","#00BFA5","#DEE9F7"].map(c => (
                  <div key={c} style={{ width:18, height:18, borderRadius:4, background:c, border:"1px solid rgba(255,255,255,.1)" }} />
                ))}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2, color:T.t3, textTransform:"uppercase", marginTop:10 }}>// interaction identity</div>
            </div>
          </div>

          {/* Zero-Click */}
          <div className="nthub-bcard nthub-reveal">
            <div style={{ background:"linear-gradient(135deg,#06091C 0%,#0C1640 100%)", padding:32, display:"flex", alignItems:"center", justifyContent:"center", minHeight:160, position:"relative", overflow:"hidden" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="56%" viewBox="0 0 256 256">
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
              <div style={{ fontSize:12, color:T.t2, lineHeight:1.65, marginBottom:14 }}>Keyboard key mark with N letterform, cyan ECG through center, and no-mouse badge. Purpose-built for emergency department documentation.</div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {["#060C19","#0B1A30","#12CCE6","#E8F3FF"].map(c => (
                  <div key={c} style={{ width:18, height:18, borderRadius:4, background:c, border:"1px solid rgba(255,255,255,.1)" }} />
                ))}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2, color:T.t3, textTransform:"uppercase", marginTop:10 }}>// ed documentation identity</div>
            </div>
          </div>
        </div>
      </Wrap>

      <Sep />

      {/* ── CLINICAL HUBS ── */}
      <Wrap id="products">
        <SL>// clinical intelligence suite</SL>
        <ST>Every Hub. One Platform.</ST>
        <SS>Nine specialized clinical modules, each with a distinct brand mark — unified by a single AI backbone and design system.</SS>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:20 }}>
          {HUBS.map((h, i) => (
            <div key={i} className="nthub-lcard nthub-reveal">
              <div style={{ background:"linear-gradient(135deg,#06091C,#0B1640)", border:"1px solid rgba(29,158,117,.15)", borderRadius:12, padding:22, display:"flex", alignItems:"center", justifyContent:"center", minHeight:96 }}>
                {h.icon}
              </div>
              <div style={{ fontSize:17, fontWeight:700, letterSpacing:"-.3px" }}>
                {h.name}<span style={{ color:h.nameColor, fontWeight:300 }}>{h.nameSuffix}</span>
              </div>
              <div style={{ fontSize:13, color:T.t2, lineHeight:1.65 }}>{h.desc}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2, color:T.t3, textTransform:"uppercase" }}>{h.tag}</div>
            </div>
          ))}
        </div>
      </Wrap>

      <Sep />

      {/* ── PORTFOLIO ── */}
      <Wrap id="portfolio">
        <SL>// extended portfolio</SL>
        <ST>Beyond the Platform</ST>
        <SS>Adjacent products built with the same clinical rigor, design precision, and AI-first approach.</SS>
        <div className="nthub-pgrid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

          {/* Hospital Bed Finder */}
          <div className="nthub-pcard nthub-reveal">
            <div style={{ padding:"48px 32px", display:"flex", alignItems:"center", justifyContent:"center", minHeight:220, background:"linear-gradient(135deg,#030B18 0%,#061525 100%)", position:"relative", overflow:"hidden" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 560 200">
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
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:3, color:T.teal, textTransform:"uppercase", marginBottom:10 }}>// healthcare saas · real-time availability</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, marginBottom:10, letterSpacing:"-.5px" }}>Hospital Bed Finder</div>
              <div style={{ fontSize:14, color:T.t2, lineHeight:1.65, marginBottom:16 }}>Real-time hospital bed availability platform. Healthcare blue gradient identity with combined cross + bed + magnifier + location pin mark. Three-tone wordmark treatment.</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <Pill style={{ background:"rgba(0,119,182,.15)", borderColor:"rgba(0,119,182,.3)", color:"#00B4D8" }}>Blue #0077B6</Pill>
                <Pill style={{ background:"rgba(0,119,182,.15)", borderColor:"rgba(0,119,182,.3)", color:"#00B4D8" }}>Teal #00B4D8</Pill>
              </div>
            </div>
          </div>

          {/* AI Vision Analysis */}
          <div className="nthub-pcard nthub-reveal">
            <div style={{ padding:"48px 32px", display:"flex", alignItems:"center", justifyContent:"center", minHeight:220, background:"linear-gradient(135deg,#0A1220 0%,#0E1B2E 100%)", position:"relative", overflow:"hidden" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 560 200">
                <rect x="20" y="20" width="160" height="160" rx="30" fill="#0E1B2E" opacity="0.9"/>
                <rect x="20" y="20" width="160" height="160" rx="30" fill="none" stroke="#00D4C8" strokeWidth="1.8" opacity="0.4"/>
                <circle cx="100" cy="100" r="64" fill="none" stroke="#00D4C8" strokeWidth="0.8" opacity="0.2"/>
                <g stroke="#00D4C8" strokeWidth="1" opacity="0.4">
                  <line x1="100" y1="36" x2="100" y2="42"/><line x1="132" y1="44.3" x2="129" y2="49.5"/><line x1="155.7" y1="68" x2="150.5" y2="71"/>
                  <line x1="164" y1="100" x2="158" y2="100"/><line x1="155.7" y1="132" x2="150.5" y2="129"/><line x1="132" y1="155.7" x2="129" y2="150.5"/>
                  <line x1="100" y1="164" x2="100" y2="158"/><line x1="68" y1="155.7" x2="71" y2="150.5"/><line x1="44.3" y1="132" x2="49.5" y2="129"/>
                  <line x1="36" y1="100" x2="42" y2="100"/><line x1="44.3" y1="68" x2="49.5" y2="71"/><line x1="68" y1="44.3" x2="71" y2="49.5"/>
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
                <text x="207" y="178" fontFamily="'Courier New',monospace" fontSize="11" letterSpacing="2" fill="#1A4040" opacity="0.9">computer vision · ai inference</text>
              </svg>
            </div>
            <div style={{ padding:"24px 28px 28px", borderTop:"1px solid rgba(29,158,117,.12)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:3, color:T.teal, textTransform:"uppercase", marginBottom:10 }}>// ai tools · computer vision</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, marginBottom:10, letterSpacing:"-.5px" }}>AI Vision Analysis</div>
              <div style={{ fontSize:14, color:T.t2, lineHeight:1.65, marginBottom:16 }}>High-precision computer vision platform identity. Almond eye with neural network iris, gold scan line, measurement ring, corner targeting brackets, and teal pupil bearing the AI mark.</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <Pill style={{ background:"rgba(0,212,200,.1)", borderColor:"rgba(0,212,200,.3)", color:"#00D4C8" }}>Teal #00D4C8</Pill>
                <Pill style={{ background:"rgba(255,184,48,.1)", borderColor:"rgba(255,184,48,.3)", color:"#FFB830" }}>Gold #FFB830</Pill>
              </div>
            </div>
          </div>
        </div>
      </Wrap>

      <Sep />

      {/* ── STATS ── */}
      <Wrap id="technology">
        <SL>// platform metrics</SL>
        <ST>Built to Scale with Care</ST>
        <SS>The numbers behind a platform designed for real clinical environments.</SS>
        <div className="nthub-reveal" style={{ background:T.navy2, border:"1px solid rgba(29,158,117,.2)", borderRadius:24, padding:60 }}>
          <div className="nthub-sgrid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
            {[
              { n:"15", unit:"+", label:"Logo Assets" },
              { n:"10", unit:"+", label:"Clinical Hubs" },
              { n:"43", unit:"+", label:"CPOE Drug Entries" },
              { n:"1",  unit:"x", label:"Unified Platform" },
            ].map((s, i) => (
              <div key={i} className="nthub-si" style={{ textAlign:"center", padding:"0 20px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:54, fontWeight:900, letterSpacing:"-2px", lineHeight:1, marginBottom:10 }}>
                  {s.n}<em style={{ fontStyle:"normal", color:T.teal }}>{s.unit}</em>
                </div>
                <div style={{ fontSize:12, color:T.t2, letterSpacing:"1.5px", textTransform:"uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Wrap>

      <Sep />

      {/* ── TECH STACK ── */}
      <Wrap>
        <SL>// under the hood</SL>
        <ST>What Powers Notrya AI</ST>
        <SS>A modern, AI-native architecture built for the unique demands of emergency medicine.</SS>
        <div className="nthub-tkgrid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {TECH.map((t, i) => (
            <div key={i} className="nthub-tkcard nthub-reveal">
              <div style={{ width:46, height:46, borderRadius:12, background:"rgba(29,158,117,.12)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                {t.icon}
              </div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{t.name}</div>
              <div style={{ fontSize:13, color:T.t2, lineHeight:1.65 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </Wrap>

      <Sep />

      {/* ── CTA ── */}
      <div id="contact" style={{ textAlign:"center", padding:"100px 64px 120px", maxWidth:840, margin:"0 auto" }}>
        <SL>// ready to transform care?</SL>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(38px,5.5vw,68px)", fontWeight:900, letterSpacing:"-2.5px", lineHeight:1.04, marginBottom:24 }}>
          The Future of<br/><em style={{ fontStyle:"normal", color:T.teal }}>Emergency Medicine</em><br/>Is Already Built.
        </h2>
        <p style={{ fontSize:17, color:T.t2, lineHeight:1.75, marginBottom:52 }}>
          Notrya AI is actively developed and positioned for strategic acquisition by a leading EHR company. If you are an investor, health system executive, or strategic partner — let's talk.
        </p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <a href="mailto:contact@notrya.ai" className="nthub-btn1">Contact the Team</a>
          <a href="#brand" className="nthub-btn2">Explore All Products</a>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:"1px solid rgba(29,158,117,.15)", padding:"40px 64px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ fontWeight:700, fontSize:15 }}>NOTRYA <span style={{ color:T.teal }}>AI</span></div>
        <div style={{ fontSize:12, color:T.t3 }}>© 2025 Skiba Enterprises · All rights reserved</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:T.t3 }}>v1.0.0 · Smart Sync</div>
      </footer>
    </div>
  );
}