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
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
    @keyframes sp-f1{0%,100%{transform:translate(0,0)}50%{transform:translate(55px,38px)}}
    @keyframes sp-f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-48px,55px)}}
    @keyframes sp-f3{0%,100%{transform:translate(0,0)}50%{transform:translate(38px,-48px)}}
    @keyframes sp-ring{0%,100%{box-shadow:0 0 0 0 rgba(11,191,191,0.2)}65%{box-shadow:0 0 0 18px rgba(11,191,191,0)}}
    @keyframes sp-scroll{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(7px);opacity:.15}}
    @keyframes sp-slide{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
    .su1{animation:fadeUp .45s .05s ease both}
    .su2{animation:fadeUp .45s .18s ease both}
    .su3{animation:fadeUp .45s .32s ease both}
    .su4{animation:fadeUp .45s .46s ease both}
    .su5{animation:fadeUp .45s .58s ease both}
    .su6{animation:fadeUp .45s .70s ease both}
    .blink{animation:blink 2s ease-in-out infinite}
    .sp-scroll-ind{animation:sp-scroll 1.8s ease-in-out infinite}
    .sp-feat-detail{animation:sp-slide .22s ease both}
    .sp-hub-scroll{overflow-x:auto;scrollbar-width:none}
    .sp-hub-scroll::-webkit-scrollbar{display:none}
    .sp-btn{transition:all .18s;user-select:none;cursor:pointer}
    .sp-test-card{transition:transform .18s,box-shadow .18s}
    .sp-test-card:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,0.38)!important}
    .sp-row-alt:nth-child(even){background:rgba(8,22,44,0.5)}
    @media(max-width:768px){
      .sp-feat-grid{grid-template-columns:1fr!important}
      .sp-how-grid{grid-template-columns:1fr!important}
      .sp-dual-cta{flex-direction:column!important;align-items:stretch!important}
      .sp-comp-wrap{overflow-x:auto}
      .sp-hero-title{font-size:36px!important}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation:none!important;transition:none!important}
    }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#070d1a", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};
const BRAND = { gold:"#C9A84C", teal:"#0ABFBF" };

const STATS = [
  { label:"Clinical Hubs",        value:"65+", color:T.teal   },
  { label:"Clinical Calculators", value:"50+", color:T.gold   },
  { label:"AI-Powered Tools",     value:"20+", color:T.purple },
];

const HOW_STEPS = [
  { n:"01", icon:"🏥", title:"Open an Encounter", color:T.teal,
    desc:"Enter patient demographics, chief complaint, and vitals. Lakonyx auto-configures the relevant decision support tools for the presentation." },
  { n:"02", icon:"🎯", title:"Select Your Hub", color:T.blue,
    desc:"Choose from 65+ evidence-based clinical hubs. Scores, dosing, and protocols load instantly — no extra navigation, no switching apps." },
  { n:"03", icon:"📋", title:"Documentation Done", color:T.purple,
    desc:"AI generates CMS-compliant MDM, HPI, and discharge instructions from your encounter context. One click to finalize and sign." },
];

const SCENARIO_STEPS = [
  { time:"22:14", icon:"🚑", title:"Patient Arrives",        color:T.coral,
    detail:"ESI 2 · 55M · Chest pain with diaphoresis · HR 108 · BP 154/92" },
  { time:"22:15", icon:"💓", title:"HEART Score Auto-Fills", color:T.coral,
    detail:"Score: 8 / 10 · High Risk · Serial troponin protocol activated automatically" },
  { time:"22:16", icon:"🧪", title:"Troponin Tracker Live",  color:T.blue,
    detail:"0h baseline drawn · 1h and 3h reminders queued · Delta calculator ready" },
  { time:"22:34", icon:"📋", title:"AI MDM Generated",       color:T.purple,
    detail:"High complexity · Data reviewed: labs, imaging, EKG · CMS 2024 compliant" },
  { time:"22:36", icon:"❤️", title:"Admitted to Cath Lab",   color:T.teal,
    detail:"Door-to-balloon initiated · 22 minutes total · Cardiology activated" },
];

const FEATURES = [
  { id:"airway",  icon:"🌬️", title:"RSI & Airway Management",   badge:"DAS 2022",      color:T.blue,
    desc:"Weight-based RSI drug kit auto-calculated from patient weight. DAS 2022 difficult airway decision tree with full branch logic. ARDSNet tidal volume, HFNC/CPAP/BiPAP protocols in one place.",
    items:["Weight-based 7-drug RSI kit","DAS 2022 failed airway A-D","ARDSNet TV + HFNC / BiPAP","CICO surgical cric pathway"] },
  { id:"chest",   icon:"💓", title:"Chest Pain & ACS",           badge:"HEART · EDACS", color:T.coral,
    desc:"HEART score auto-populated from encounter data. 0/1/3h high-sensitivity troponin protocol with serial tracking. EDACS pathway and full ACS disposition matrix built in.",
    items:["HEART + EDACS risk scores","0 / 1 / 3h hs-cTnI protocol","Serial troponin tracker","ACS disposition matrix"] },
  { id:"mdm",     icon:"📋", title:"AI Medical Decision Making", badge:"CMS 2024",      color:T.purple,
    desc:"CMS 2024-compliant MDM generated from encounter context. Medical complexity, data reviewed, and risk of complications documented in one click. Split/shared attestation and SDOH included.",
    items:["CMS 2024 E&M compliance","AI-generated MDM prose","Split / shared attestation","SDOH + critical care time"] },
  { id:"sepsis",  icon:"🦠", title:"Sepsis & Critical Care",     badge:"SSC 2021",      color:T.coral,
    desc:"Hour-1 bundle checklist with completion tracking. Source-based empiric antibiotic tiers with resistance lookup. Norepinephrine vasopressor ladder with weight-based dosing.",
    items:["SEP-1 Hour-1 bundle tracker","Source-based empiric ABX","Vasopressor weight dosing","qSOFA / SIRS / SOFA"] },
  { id:"ecg",     icon:"📈", title:"ECG Interpretation",         badge:"ACC/AHA",       color:T.cyan,
    desc:"8-step systematic read guide with SVG waveform library covering 20+ patterns. STEMI equivalents, Sgarbossa criteria, Wellens patterns. QTc calculator with drug-interaction flags.",
    items:["8-step read framework","STEMI equivalents + Wellens","Sgarbossa criteria","QTc + drug QT flag checker"] },
];

const HUB_PREVIEWS = [
  { icon:"🦠", title:"Sepsis Hub",      badge:"SSC 2021",    color:T.coral,  features:["Hour-1 Bundle","qSOFA","Source ABX","Vasopressors"] },
  { icon:"🌬️", title:"Airway Hub",      badge:"DAS 2022",    color:T.blue,   features:["RSI Kit","ARDSNet","HFNC / BiPAP","CICO A-D"] },
  { icon:"💓", title:"Chest Pain Hub",   badge:"HEART·EDACS", color:T.coral,  features:["HEART Score","Serial Troponin","EDACS","Disposition"] },
  { icon:"📈", title:"ECG Hub",          badge:"ACC/AHA",     color:T.cyan,   features:["Waveform Library","STEMI Equiv.","QTc Calc","Sgarbossa"] },
  { icon:"🧠", title:"Stroke Hub",       badge:"AHA 2019",    color:T.purple, features:["Door-to-Needle","tPA Eligibility","NIHSS","LVO"] },
  { icon:"🚑", title:"Trauma Hub",       badge:"ATLS 10e",    color:T.orange, features:["ABCDE Survey","Shock Class","MTP 1:1:1","TXA"] },
  { icon:"💊", title:"Pharmacology Hub", badge:"UNIFIED",     color:T.teal,   features:["Rx Lookup","Drip Calc","Interactions","AI Pharm"] },
  { icon:"🧪", title:"Lab Interpreter",  badge:"AI · PASTE",  color:T.green,  features:["BMP / CBC / LFTs","Anion Gap","AI Dx","Critical Vals"] },
];

const GUIDELINES = [
  "ACEP 2024","AHA 2022","SSC 2021","ATLS 10e","ADA 2022",
  "DAS 2022","ACOG 2022","ESC 2022","IDSA 2020","ASAM 2020",
];

const PROCUREMENT = [
  { icon:"🌐", label:"Works in any browser"    },
  { icon:"📦", label:"No installation required" },
  { icon:"🔒", label:"HIPAA-conscious design"   },
  { icon:"🚫", label:"Zero patient data stored" },
];

const TESTIMONIALS = [
  { quote:"Lakonyx replaced three separate tools I was switching between every shift. RSI dosing, ECG interpretation, and AI documentation — all in one place. It is the first clinical tool I have used that was actually built for the pace of emergency medicine.",
    name:"Dr. James R.", role:"Emergency Medicine Attending", facility:"Level I Trauma Center", color:T.teal },
  { quote:"Our residents adopted Lakonyx in the first week of intern orientation. The HEART score auto-population and serial troponin tracking alone have improved our chest pain pathway compliance measurably.",
    name:"Dr. Sarah K.", role:"EM Residency Program Director", facility:"Academic Medical Center", color:T.blue },
  { quote:"We evaluated four clinical decision support platforms. Lakonyx was the only one built specifically for emergency medicine — not adapted from general medicine. The CMS documentation compliance feature was the deciding factor for our department.",
    name:"Dr. Michael T.", role:"Medical Director, Emergency Services", facility:"Regional Health System", color:T.gold },
];

const COMPARE_ROWS = [
  { feat:"ED-Specific Clinical Hubs",     lak:1,   udt:0,   cal:0,   ehr:0   },
  { feat:"AI-Generated Documentation",     lak:1,   udt:0,   cal:0,   ehr:0   },
  { feat:"Weight-Based Drug Dosing",        lak:1,   udt:0,   cal:0.5, ehr:0   },
  { feat:"Real-Time Clinical Calculators",  lak:1,   udt:0,   cal:1,   ehr:0   },
  { feat:"CMS E&M Compliance",              lak:1,   udt:0,   cal:0,   ehr:0.5 },
  { feat:"Integrated Single Workflow",      lak:1,   udt:0,   cal:0,   ehr:0   },
  { feat:"Evidence-Based Guidelines",       lak:1,   udt:1,   cal:0.5, ehr:0   },
  { feat:"Zero Install / Browser-Based",    lak:1,   udt:1,   cal:1,   ehr:0   },
];

// ── Background mesh ───────────────────────────────────────────────────────────
function BgMesh() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[
        {sz:700,s:{top:"-140px",left:"-100px"}, c:"rgba(0,229,192,0.04)", a:"sp-f1 18s ease-in-out infinite"},
        {sz:550,s:{top:"40%",right:"-130px"},   c:"rgba(59,158,255,0.03)",a:"sp-f2 22s ease-in-out infinite"},
        {sz:450,s:{bottom:"-80px",left:"36%"},  c:"rgba(155,109,255,0.03)",a:"sp-f3 26s ease-in-out infinite"},
      ].map((b,i) => (
        <div key={i} style={{position:"absolute",width:b.sz,height:b.sz,borderRadius:"50%",...b.s,
          background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,animation:b.a}}/>
      ))}
    </div>
  );
}

// ── LX Monogram ───────────────────────────────────────────────────────────────
function LXMark({size=90}) {
  return (
    <div style={{width:size,height:size,borderRadius:Math.round(size*.2),background:"#0A1628",
      border:"1px solid rgba(201,168,76,0.35)",display:"flex",alignItems:"center",justifyContent:"center",
      position:"relative",boxShadow:"0 0 0 1px rgba(11,191,191,0.12),0 8px 40px rgba(0,0,0,0.55)",
      animation:"sp-ring 3.2s ease-out infinite",flexShrink:0}}>
      <div style={{position:"absolute",inset:0,borderRadius:"inherit",
        background:"radial-gradient(circle at 38% 42%,rgba(201,168,76,0.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <svg viewBox="0 0 500 500" width={Math.round(size*.74)} height={Math.round(size*.74)}
        xmlns="http://www.w3.org/2000/svg" style={{position:"relative",zIndex:1}}>
        <text x="106" y="305" fontFamily="'Playfair Display',Georgia,serif"
          fontSize="280" fontWeight="700" fill={BRAND.gold}>L</text>
        <text x="193" y="305" fontFamily="'Playfair Display',Georgia,serif"
          fontSize="280" fontWeight="700" fill={BRAND.teal}>X</text>
      </svg>
      <div className="blink" style={{position:"absolute",top:9,right:9,width:6,height:6,
        borderRadius:"50%",background:BRAND.teal,boxShadow:`0 0 5px ${BRAND.teal}`}}/>
    </div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section style={{padding:"80px 0",background:T.panel}}>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,
            letterSpacing:".18em",textTransform:"uppercase",marginBottom:10}}>How It Works</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:T.txt}}>
            From patient arrival to signed note — in minutes.
          </div>
        </div>
        <div className="sp-how-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
          {HOW_STEPS.map((step,i) => (
            <div key={i} style={{padding:"28px 24px",borderRadius:16,background:T.card,
              border:`1px solid ${step.color}28`,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:step.color}}/>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:38,fontWeight:700,
                color:step.color,opacity:.12,position:"absolute",top:12,right:18,lineHeight:1}}>{step.n}</div>
              <div style={{width:44,height:44,borderRadius:12,background:step.color+"16",
                border:`1px solid ${step.color}30`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:22,marginBottom:16}}>{step.icon}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,
                color:T.txt,marginBottom:10,lineHeight:1.3}}>{step.title}</div>
              <div style={{fontSize:13,color:T.txt4,lineHeight:1.72}}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Feature Carousel ──────────────────────────────────────────────────────────
function FeatureSection() {
  const [active,setActive] = useState(0);
  const [userPicked,setUserPicked] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => {
    if (userPicked) return;
    timerRef.current = setInterval(() => setActive(a => (a+1) % FEATURES.length), 3400);
    return () => clearInterval(timerRef.current);
  },[userPicked]);
  const f = FEATURES[active];
  return (
    <section style={{padding:"80px 0",background:`linear-gradient(180deg,${T.panel} 0%,${T.bg} 100%)`}}>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,
            letterSpacing:".18em",textTransform:"uppercase",marginBottom:10}}>Platform Capabilities</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:T.txt,marginBottom:10}}>
            Every tool you need. Zero switching.
          </div>
          <div style={{fontSize:14,color:T.txt4,maxWidth:500,margin:"0 auto",lineHeight:1.7}}>
            Unlike static references, Lakonyx integrates decision support, documentation,
            and orders into a single ED workflow.
          </div>
        </div>
        <div className="sp-feat-grid" style={{display:"grid",gridTemplateColumns:"256px 1fr",gap:20,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {FEATURES.map((feat,i) => {
              const on = i===active;
              return (
                <button key={feat.id} onClick={() => {setActive(i);setUserPicked(true);}}
                  style={{display:"flex",alignItems:"center",gap:11,padding:"11px 14px",borderRadius:10,
                    border:`1px solid ${on?feat.color+"55":"rgba(26,53,85,0.4)"}`,
                    background:on?feat.color+"14":"rgba(8,22,44,0.6)",
                    cursor:"pointer",textAlign:"left",transition:"all .15s",position:"relative",overflow:"hidden"}}>
                  {on&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
                    borderRadius:"10px 0 0 10px",background:feat.color}}/>}
                  <span style={{fontSize:18,flexShrink:0}}>{feat.icon}</span>
                  <div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,fontWeight:700,
                      color:on?T.txt:T.txt3,lineHeight:1.3}}>{feat.title}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:feat.color,
                      marginTop:2,opacity:on?1:.65}}>{feat.badge}</div>
                  </div>
                </button>
              );
            })}
            {!userPicked&&(
              <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:6}}>
                {FEATURES.map((_,i)=>(
                  <div key={i} style={{height:5,borderRadius:3,
                    background:i===active?f.color:"rgba(90,130,168,0.25)",
                    width:i===active?20:5,transition:"all .3s"}}/>
                ))}
              </div>
            )}
          </div>
          <div key={active} className="sp-feat-detail" style={{padding:"28px 32px",borderRadius:16,
            background:T.card,border:`1px solid ${f.color}30`,boxShadow:`0 0 40px ${f.color}08`}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
              <div style={{width:52,height:52,borderRadius:14,background:f.color+"16",
                border:`1px solid ${f.color}30`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:24,flexShrink:0}}>{f.icon}</div>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,
                  color:T.txt,lineHeight:1.2,marginBottom:5}}>{f.title}</div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
                  padding:"2px 8px",borderRadius:20,background:f.color+"18",
                  border:`1px solid ${f.color}30`,color:f.color}}>{f.badge}</span>
              </div>
            </div>
            <div style={{fontSize:13.5,color:T.txt3,lineHeight:1.72,marginBottom:22}}>{f.desc}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px"}}>
              {f.items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:11.5,color:T.txt2}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:f.color,flexShrink:0}}/>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Clinical Scenario ─────────────────────────────────────────────────────────
function ScenarioVignette() {
  return (
    <section style={{padding:"80px 0",background:T.bg}}>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.coral,
            letterSpacing:".18em",textTransform:"uppercase",marginBottom:10}}>See It In Action</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:T.txt,marginBottom:10}}>
            A chest pain that went the right way.
          </div>
          <div style={{fontSize:14,color:T.txt4,maxWidth:460,margin:"0 auto",lineHeight:1.7}}>
            Watch how Lakonyx guides a high-risk encounter from door to disposition — in 22 minutes.
          </div>
        </div>
        <div style={{maxWidth:620,margin:"0 auto",position:"relative",paddingLeft:16}}>
          <div style={{position:"absolute",left:28,top:28,bottom:28,width:1,
            background:"linear-gradient(180deg,rgba(255,107,107,.5) 0%,rgba(59,158,255,.4) 50%,rgba(0,229,192,.5) 100%)"}}/>
          {SCENARIO_STEPS.map((step,i) => (
            <div key={i} style={{display:"flex",gap:20,marginBottom:i<SCENARIO_STEPS.length-1?24:0,position:"relative"}}>
              <div style={{flexShrink:0,width:28,height:28,borderRadius:"50%",
                background:step.color+"18",border:`2px solid ${step.color}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:13,zIndex:1,marginTop:10,boxShadow:`0 0 12px ${step.color}30`}}>
                {step.icon}
              </div>
              <div style={{flex:1,padding:"14px 20px",borderRadius:12,background:T.card,
                border:`1px solid ${step.color}28`,borderLeft:`3px solid ${step.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,
                    color:step.color,letterSpacing:".06em",flexShrink:0}}>{step.time}</span>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,
                    color:T.txt}}>{step.title}</span>
                </div>
                <div style={{fontSize:12,color:T.txt4,lineHeight:1.65}}>{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Hub Preview Strip ─────────────────────────────────────────────────────────
function HubPreviewStrip({onViewAll}) {
  return (
    <section style={{padding:"72px 0",background:T.panel}}>
      <div style={{maxWidth:1080,margin:"0 auto"}}>
        <div style={{padding:"0 32px",marginBottom:24}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.gold,
            letterSpacing:".18em",textTransform:"uppercase",marginBottom:10}}>Clinical Coverage</div>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:T.txt}}>
              65+ Evidence-Based Clinical Hubs
            </div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4}}>scroll to explore →</span>
          </div>
        </div>
        <div className="sp-hub-scroll" style={{display:"flex",gap:12,padding:"4px 32px 16px"}}>
          {HUB_PREVIEWS.map((h,i) => (
            <div key={i} style={{flexShrink:0,width:210,padding:"16px 18px",borderRadius:12,
              background:T.card,border:`1px solid ${h.color}28`,borderTop:`2px solid ${h.color}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:h.color+"16",
                  border:`1px solid ${h.color}28`,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:17,flexShrink:0}}>{h.icon}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:12.5,fontWeight:700,
                    color:T.txt,lineHeight:1.2}}>{h.title}</div>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,
                    padding:"1px 5px",borderRadius:20,background:h.color+"18",
                    border:`1px solid ${h.color}28`,color:h.color}}>{h.badge}</span>
                </div>
              </div>
              {h.features.map((feat,j)=>(
                <div key={j} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,
                  color:T.txt4,marginBottom:3}}>
                  <div style={{width:3,height:3,borderRadius:"50%",background:h.color,
                    opacity:.7,flexShrink:0}}/>
                  {feat}
                </div>
              ))}
            </div>
          ))}
          <div onClick={onViewAll}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(59,158,255,0.08)";e.currentTarget.style.borderColor="rgba(59,158,255,0.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(26,53,85,0.2)";e.currentTarget.style.borderColor="rgba(90,130,168,0.35)";}}
            style={{flexShrink:0,width:160,padding:"16px 18px",borderRadius:12,cursor:"pointer",
              background:"rgba(26,53,85,0.2)",border:"1px dashed rgba(90,130,168,0.35)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
            <div style={{fontSize:28,opacity:.35}}>⊞</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,
              color:T.txt3,textAlign:"center",lineHeight:1.5}}>View all 65+<br/>clinical hubs</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.blue}}>→</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Competitive Comparison Table ──────────────────────────────────────────────
function ComparisonTable() {
  const COLS = [
    {label:"Lakonyx",   color:T.teal, hl:true },
    {label:"UpToDate",  color:T.txt4, hl:false},
    {label:"MDCalc",    color:T.txt4, hl:false},
    {label:"Static EHR",color:T.txt4, hl:false},
  ];
  const ind = (v) => v===1?{icon:"✓",color:T.teal}:v===0.5?{icon:"~",color:T.gold}:{icon:"—",color:"rgba(90,130,168,0.3)"};
  return (
    <section style={{padding:"80px 0",background:`linear-gradient(180deg,${T.panel} 0%,${T.bg} 100%)`}}>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.purple,
            letterSpacing:".18em",textTransform:"uppercase",marginBottom:10}}>Platform Comparison</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:T.txt}}>
            Built for emergency medicine. Not adapted from it.
          </div>
        </div>
        <div className="sp-comp-wrap">
          <div style={{minWidth:560}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr repeat(4,110px)",marginBottom:4}}>
              <div/>
              {COLS.map((c,i)=>(
                <div key={i} style={{padding:"10px 8px",textAlign:"center",
                  borderBottom:`2px solid ${c.hl?T.teal:"rgba(26,53,85,0.4)"}`,
                  background:c.hl?"rgba(0,229,192,0.07)":"transparent",
                  fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,
                  color:c.hl?T.teal:T.txt4,letterSpacing:".05em"}}>
                  {c.label}
                </div>
              ))}
            </div>
            {COMPARE_ROWS.map((row,ri)=>{
              const vals=[row.lak,row.udt,row.cal,row.ehr];
              return(
                <div key={ri} className="sp-row-alt" style={{display:"grid",
                  gridTemplateColumns:"1fr repeat(4,110px)",borderRadius:6}}>
                  <div style={{padding:"13px 14px",fontSize:12,color:T.txt3,
                    display:"flex",alignItems:"center"}}>{row.feat}</div>
                  {vals.map((v,vi)=>{
                    const {icon,color}=ind(v);
                    return(
                      <div key={vi} style={{display:"flex",alignItems:"center",justifyContent:"center",
                        background:vi===0?"rgba(0,229,192,0.04)":"transparent"}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,
                          fontWeight:700,color}}>{icon}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div style={{display:"flex",gap:18,marginTop:16,justifyContent:"flex-end",flexWrap:"wrap"}}>
              {[["✓",T.teal,"Full"],["~",T.gold,"Partial"],["—","rgba(90,130,168,0.4)","Not available"]].map(([icon,color,label])=>(
                <div key={icon} style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color}}>{icon}</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section style={{padding:"80px 0",background:T.bg}}>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.gold,
            letterSpacing:".18em",textTransform:"uppercase",marginBottom:10}}>Physician Voices</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:T.txt}}>
            From the physicians who use it every shift.
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
          {TESTIMONIALS.map((t,i)=>(
            <div key={i} className="sp-test-card" style={{padding:"26px 24px",borderRadius:16,
              background:T.card,border:`1px solid ${t.color}22`,
              borderTop:`3px solid ${t.color}`,boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
              <div style={{fontSize:32,color:t.color,opacity:.45,lineHeight:1,marginBottom:14,
                fontFamily:"Georgia,serif",fontWeight:700}}>"</div>
              <div style={{fontSize:13,color:T.txt2,lineHeight:1.78,marginBottom:20,
                fontStyle:"italic"}}>{t.quote}</div>
              <div style={{borderTop:`1px solid ${t.color}20`,paddingTop:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,
                  color:T.txt,marginBottom:2}}>{t.name}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:t.color}}>{t.role}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
                  color:T.txt4,marginTop:2}}>{t.facility}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:18}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:"rgba(90,130,168,0.4)",letterSpacing:".06em"}}>
            Representative physician perspectives · Individual results may vary
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Credibility Bar ───────────────────────────────────────────────────────────
function CredibilityBar() {
  return (
    <section style={{padding:"56px 32px",
      background:`linear-gradient(180deg,${T.bg} 0%,${T.panel} 100%)`,textAlign:"center"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,
          letterSpacing:".16em",textTransform:"uppercase",marginBottom:18}}>Built on current evidence</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {GUIDELINES.map((g,i)=>(
            <span key={i} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,
              padding:"4px 12px",borderRadius:20,background:"rgba(26,53,85,0.5)",
              border:"1px solid rgba(42,79,122,0.5)",color:T.txt3,letterSpacing:".05em"}}>{g}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Bottom CTA ────────────────────────────────────────────────────────────────
function BottomCTA({onShift,onExplore}) {
  const [hovS,setHovS]=useState(false); const [hovE,setHovE]=useState(false);
  return (
    <section style={{padding:"80px 32px 64px",background:T.panel,textAlign:"center"}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,
          color:T.txt,marginBottom:10}}>Ready to transform your ED workflow?</div>
        <div style={{fontSize:14,color:T.txt4,marginBottom:44,lineHeight:1.7}}>
          Built for emergency physicians who move fast and document under pressure.
        </div>
        <div className="sp-dual-cta" style={{display:"flex",gap:14,justifyContent:"center",
          flexWrap:"wrap",marginBottom:16}}>
          <div className="sp-btn" onMouseEnter={()=>setHovS(true)} onMouseLeave={()=>setHovS(false)}
            onClick={onShift}
            style={{padding:"14px 48px",borderRadius:12,fontFamily:"'DM Sans',sans-serif",
              fontSize:14,fontWeight:700,color:"#050f1e",
              background:`linear-gradient(135deg,${T.teal},#00b4d8)`,
              boxShadow:hovS?`0 6px 28px ${T.teal}38`:"0 4px 16px rgba(0,229,192,0.22)",
              transform:hovS?"translateY(-1px)":"none"}}>Begin Shift</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div className="sp-btn" onMouseEnter={()=>setHovE(true)} onMouseLeave={()=>setHovE(false)}
              onClick={onExplore}
              style={{padding:"14px 48px",borderRadius:12,fontFamily:"'DM Sans',sans-serif",
                fontSize:14,fontWeight:700,color:T.txt,
                background:hovE?"rgba(59,158,255,0.12)":"rgba(26,53,85,0.4)",
                border:`1px solid ${hovE?"rgba(59,158,255,0.5)":"rgba(42,79,122,0.6)"}`}}>
              Explore Platform
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
              color:T.txt4,letterSpacing:".06em"}}>Demo mode · No patient data required</div>
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"10px 24px",
          justifyContent:"center",marginBottom:36}}>
          {PROCUREMENT.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:13}}>{p.icon}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4}}>{p.label}</span>
            </div>
          ))}
        </div>
        <div style={{marginBottom:28,padding:"14px 20px",borderRadius:10,
          background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.2)"}}>
          <div style={{fontSize:12,color:T.txt3,marginBottom:4}}>
            Evaluating Lakonyx for your institution?
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.blue,
            cursor:"pointer"}} onClick={()=>window.open("mailto:info@lakonyx.com","_blank")}>
            Contact us to schedule a demo →
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(26,53,85,0.4)",paddingTop:22}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:"rgba(90,130,168,0.45)",letterSpacing:".07em",marginBottom:4}}>
            Clinical decision support only — not a substitute for clinical judgment
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,
            color:"rgba(90,130,168,0.3)",letterSpacing:".05em"}}>
            Lakonyx v2.0 · Powered by Claude (Anthropic)
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LakonyxInvestorPitch() {
  const navigate = useNavigate();
  const [hovShift,setHovShift]=useState(false);
  const [hovExplore,setHovExplore]=useState(false);

  useEffect(()=>{
    const h=(e)=>{ if(e.key==="Enter") navigate("/CommandCenter"); };
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[]);

  const goShift   = () => navigate("/CommandCenter");
  const goExplore = () => navigate("/LakonyxHome");

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.txt,
      fontFamily:"'DM Sans',sans-serif",overflowX:"hidden"}}>
      <BgMesh/>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",padding:"60px 32px",
        position:"relative",zIndex:1,textAlign:"center"}}>

        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.016,
          backgroundImage:"linear-gradient(rgba(0,229,192,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,192,1) 1px,transparent 1px)",
          backgroundSize:"48px 48px"}}/>

        {/* v2.0 announcement badge */}
        <div className="su1" style={{marginBottom:20}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 16px",
            borderRadius:20,background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.28)"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
              color:T.gold}}>✦ v2.0</span>
            <div style={{width:1,height:10,background:"rgba(245,200,66,0.3)"}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4}}>
              20 new hubs · AI MDM · CMS 2024 compliance
            </span>
          </div>
        </div>

        <div className="su2" style={{marginBottom:28}}><LXMark size={90}/></div>

        <div className="su3 sp-hero-title" style={{fontFamily:"'Playfair Display',serif",fontSize:54,
          fontWeight:900,color:T.txt,letterSpacing:".09em",lineHeight:1,marginBottom:12}}>
          LAKONYX
        </div>

        <div className="su3" style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
          <div style={{width:36,height:1,background:`${BRAND.teal}45`}}/>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:BRAND.teal,
            letterSpacing:".20em",textTransform:"uppercase"}}>
            Clinical Decision Intelligence
          </div>
          <div style={{width:36,height:1,background:`${BRAND.teal}45`}}/>
        </div>

        <div className="su4" style={{fontSize:17,color:T.txt3,lineHeight:1.65,
          maxWidth:400,marginBottom:10}}>Built for the pace of emergency medicine.</div>
        <div className="su4" style={{fontSize:13,color:T.txt4,maxWidth:460,
          lineHeight:1.75,marginBottom:44}}>
          Unlike static references, Lakonyx integrates decision support,
          documentation, and orders into a single ED workflow.
        </div>

        <div className="su5" style={{display:"flex",gap:16,marginBottom:44,
          flexWrap:"wrap",justifyContent:"center"}}>
          {STATS.map((s,i)=>(
            <div key={i} style={{textAlign:"center",padding:"10px 20px",
              background:T.card,border:"1px solid rgba(26,53,85,0.5)",borderRadius:10}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,
                fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,
                color:T.txt4,marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="su6" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div className="sp-dual-cta" style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            <div className="sp-btn"
              onMouseEnter={()=>setHovShift(true)} onMouseLeave={()=>setHovShift(false)}
              onClick={goShift}
              style={{padding:"14px 48px",borderRadius:12,fontFamily:"'DM Sans',sans-serif",
                fontSize:15,fontWeight:700,color:"#050f1e",
                background:`linear-gradient(135deg,${T.teal},#00b4d8)`,
                boxShadow:hovShift?`0 6px 28px ${T.teal}38`:"0 4px 16px rgba(0,229,192,0.22)",
                transform:hovShift?"translateY(-1px)":"none"}}>Begin Shift</div>
            <div className="sp-btn"
              onMouseEnter={()=>setHovExplore(true)} onMouseLeave={()=>setHovExplore(false)}
              onClick={goExplore}
              style={{padding:"14px 48px",borderRadius:12,fontFamily:"'DM Sans',sans-serif",
                fontSize:15,fontWeight:700,color:T.txt,
                background:hovExplore?"rgba(59,158,255,0.12)":"rgba(26,53,85,0.4)",
                border:`1px solid ${hovExplore?"rgba(59,158,255,0.5)":"rgba(42,79,122,0.6)"}`}}>
              Explore Platform
            </div>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:T.txt4,letterSpacing:".08em"}}>Press Enter to begin · scroll to explore ↓</div>
        </div>

        <div className="sp-scroll-ind" style={{position:"absolute",bottom:32,fontSize:20,color:T.txt4}}>↓</div>
      </section>

      {/* ── SECTIONS ─────────────────────────────────────────────────────────── */}
      <HowItWorks/>
      <FeatureSection/>
      <ScenarioVignette/>
      <HubPreviewStrip onViewAll={goExplore}/>
      <ComparisonTable/>
      <TestimonialsSection/>
      <CredibilityBar/>
      <BottomCTA onShift={goShift} onExplore={goExplore}/>
    </div>
  );
}