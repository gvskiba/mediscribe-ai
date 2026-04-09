import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// ── Font + CSS Injection (Base44 pattern) ──────────────────────────
(() => {
  if (document.getElementById("notrya-home-fonts")) return;
  const l = document.createElement("link"); l.id = "notrya-home-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "notrya-home-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
    input,select,button{font-family:'DM Sans',sans-serif;outline:none;}
    select option{background:#0a1628}
    @keyframes nh-meshFloat1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,40px) scale(1.08)}}
    @keyframes nh-meshFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,60px) scale(1.06)}}
    @keyframes nh-meshFloat3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-50px) scale(1.05)}}
    @keyframes nh-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
    @keyframes nh-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    @keyframes nh-fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes nh-fadeInPop{from{opacity:0;transform:scale(.96) translateY(-6px)}to{opacity:1;transform:scale(1) translateY(0)}}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};

const HUBS = [
  { id:"sepsis",    icon:"🦠", title:"Sepsis Hub",          desc:"Sepsis-3 definitions, qSOFA & SIRS calculators, Hour-1 Bundle, source-based antibiotic tiers, AI local resistance lookup, and stewardship protocols.", color:"#f5c842", gl:"rgba(245,200,66,0.08)",   br:"rgba(245,200,66,0.3)",   badge:"SSC 2021",   conditions:9,  calcs:3, tag:"CRITICAL CARE", features:["qSOFA Calculator","SIRS Calculator","30 mL/kg Fluid Bolus","AI Local Resistance","7 Source-Based ABX Sets","Stewardship Dashboard"] },
  { id:"airway",    icon:"🌬️", title:"Airway Hub",           desc:"RSI protocol with weight-based drug calculator, difficult airway DAS 2022 algorithm, ARDSNet ventilation, HFNC/CPAP/BiPAP management, and liberation protocols.", color:"#3b9eff", gl:"rgba(59,158,255,0.08)",  br:"rgba(59,158,255,0.3)",   badge:"DAS 2022",   conditions:9,  calcs:4, tag:"AIRWAY",        features:["RSI Drug Calculator","ARDSNet IBW/TV Calc","ROX Index Calculator","RSBI Extubation Calc","CICO Plan A–D","ABCDEF Bundle"] },
  { id:"erx",       icon:"💊", title:"ERx Hub",              desc:"Evidence-based electronic prescribing for emergency medicine. Condition-specific drug formularies, renal dosing adjustments, IV-to-PO conversion, and PDMP integration.", color:"#00e5c0", gl:"rgba(0,229,192,0.08)",   br:"rgba(0,229,192,0.3)",   badge:"ACEP 2023",  conditions:12, calcs:2, tag:"PRESCRIBING",   features:["Renal Dose Adjuster","IV → PO Converter","Drug Interactions","PDMP Integration","Allergy Checker","Formulary Search"] },
  { id:"knowledge", icon:"📖", title:"Knowledge Base",       desc:"Landmark clinical trials, IDSA/ACC/AHA/SSC guidelines, and evidence summaries with AI-powered synthesis. Searchable by condition, drug, or guideline body.", color:"#9b6dff", gl:"rgba(155,109,255,0.08)", br:"rgba(155,109,255,0.3)",  badge:"AI-Powered", conditions:0,  calcs:0, tag:"REFERENCE",     features:["Landmark Trials","IDSA / SSC / AHA Guidelines","AI Evidence Summary","Drug Monographs","Clinical Pearls","NNT / NNH Data"] },
  { id:"calendar",  icon:"📅", title:"Provider Schedule",    desc:"Glassmorphic shift calendar built for physicians. One-click shift adding, month/week views, hours tracking, CME/call/PTO categorization, and department filtering.", color:"#ff9f43", gl:"rgba(255,159,67,0.08)",  br:"rgba(255,159,67,0.3)",   badge:"LIVE",       conditions:0,  calcs:0, tag:"SCHEDULING",    features:["1-Click Shift Add","Month & Week Views","Hours Tracker","9 Shift Types","Department Filter","Upcoming Panel"] },
  { id:"coming",    icon:"⚡", title:"More Hubs Coming",     desc:"Cardiology Hub, Toxicology Hub, Pediatric Hub, Trauma Hub, and Neurology Hub are in active development. Each will follow the same evidence-based architecture.", color:"#3dffa0", gl:"rgba(61,255,160,0.05)",   br:"rgba(61,255,160,0.2)",   badge:"ROADMAP",    conditions:0,  calcs:0, tag:"COMING SOON",   features:["Cardiology Hub","Toxicology Hub","Pediatric Hub","Trauma Hub","Neurology Hub","Ob/Gyn Hub"], locked:true },
];

const STATS = [
  { val:"47+",  label:"Evidence-Based Conditions",  color:"#00e5c0", icon:"🩺" },
  { val:"12",   label:"Interactive Calculators",     color:"#f5c842", icon:"🧮" },
  { val:"200+", label:"Antibiotic Tiers Documented", color:"#3b9eff", icon:"💊" },
  { val:"AI",   label:"Local Resistance Lookup",     color:"#9b6dff", icon:"🌐" },
];

const GUIDELINES = [
  { label:"SSC 2021", color:"#00e5c0" },{ label:"IDSA 2024", color:"#3b9eff" },
  { label:"ARDSNet 2000", color:"#ff6b6b" },{ label:"DAS 2022", color:"#f5c842" },
  { label:"ATS/IDSA CAP 2019", color:"#00d4ff" },{ label:"PADIS 2018", color:"#9b6dff" },
  { label:"PROSEVA 2013", color:"#ff9f43" },{ label:"ACCP/ATS 2017", color:"#3dffa0" },
  { label:"ASHP/SIDP 2020", color:"#00e5c0" },{ label:"Tokyo 2018", color:"#f5c842" },
  { label:"AASM 2021", color:"#3b9eff" },{ label:"IDSA/ASCO 2018", color:"#ff6b6b" },
];

const PHRASES = [
  "Emergency Medicine, Elevated.",
  "Evidence at the Point of Care.",
  "Antibiotics. Airway. Answers.",
  "From Guidelines to Bedside.",
  "Sepsis. Airway. Every Decision.",
];

const AI_SYSTEM = `You are Notrya AI, an expert emergency medicine clinical decision support assistant. The Notrya platform has: Sepsis Hub (Sepsis-3, qSOFA, SIRS, source-based antibiotics, ARDSNet, stewardship, AI local resistance), Airway Hub (RSI, DAS 2022 difficult airway, HFNC/CPAP/BiPAP, vent management, SAT/SBT/RSBI weaning), ERx Hub (emergency prescribing, renal dosing, IV to PO), Knowledge Base (guidelines, landmark trials), and Provider Schedule. Give concise, clinically precise answers referenced to current guidelines (SSC 2021, IDSA 2024, DAS 2022, ARDSNet, ATS/IDSA, PADIS 2018). Use bullet points. Always note that clinical judgment supersedes protocol.`;

// ── Typewriter: cursor blink is a LOCAL interval, not inline Math.sin ──
function Typewriter() {
  const [idx,      setIdx]      = useState(0);
  const [text,     setText]     = useState("");
  const [deleting, setDeleting] = useState(false);
  const [paused,   setPaused]   = useState(false);
  const [cursorOn, setCursorOn] = useState(true); // FIX: independent blink state

  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 480);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const phrase = PHRASES[idx];
    if (paused) {
      const t = setTimeout(() => { setDeleting(true); setPaused(false); }, 2200);
      return () => clearTimeout(t);
    }
    if (!deleting) {
      if (text.length < phrase.length) {
        const t = setTimeout(() => setText(phrase.slice(0, text.length + 1)), 52);
        return () => clearTimeout(t);
      } else { setPaused(true); }
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), 28);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setIdx(i => (i + 1) % PHRASES.length);
      }
    }
  }, [text, deleting, paused, idx]);

  return (
    <span style={{ color:"#00e5c0" }}>
      {text}<span style={{ opacity: cursorOn ? 1 : 0, transition:"opacity .1s" }}>|</span>
    </span>
  );
}

function BgMesh() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", top:-200, left:-100, background:"radial-gradient(circle,rgba(0,229,192,0.055) 0%,transparent 70%)", animation:"nh-meshFloat1 18s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", top:"30%", right:-150, background:"radial-gradient(circle,rgba(59,158,255,0.05) 0%,transparent 70%)", animation:"nh-meshFloat2 22s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", bottom:-100, left:"35%", background:"radial-gradient(circle,rgba(155,109,255,0.04) 0%,transparent 70%)", animation:"nh-meshFloat3 26s ease-in-out infinite" }} />
    </div>
  );
}

function GBox({ children, style={}, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ background:"rgba(255,255,255,0.035)", backdropFilter:"blur(18px) saturate(1.5)", WebkitBackdropFilter:"blur(18px) saturate(1.5)", border:"1px solid rgba(255,255,255,0.07)", ...style }}>{children}</div>
  );
}

function HubCard({ hub, onOpen }) {
  const [hov, setHov] = useState(false);
  const active = hov && !hub.locked;
  return (
    <div onClick={() => !hub.locked && onOpen(hub)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: active ? `linear-gradient(135deg,${hub.gl.replace("0.08","0.14")},rgba(255,255,255,0.04))` : hub.gl, backdropFilter:"blur(20px) saturate(1.4)", WebkitBackdropFilter:"blur(20px) saturate(1.4)", border:`1px solid ${active ? hub.color+"55" : hub.br}`, borderRadius:16, padding:"20px 22px", cursor: hub.locked ? "default" : "pointer", transition:"all .22s cubic-bezier(.4,0,.2,1)", transform: active ? "translateY(-3px)" : "translateY(0)", boxShadow: active ? `0 12px 40px ${hub.color}18` : "none", display:"flex", flexDirection:"column", gap:14, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:`radial-gradient(circle,${hub.color}18,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:46, height:46, borderRadius:13, flexShrink:0, background:hub.gl, border:`1px solid ${hub.br}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{hub.icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>{hub.title}</div>
            {hub.locked && <span style={{ fontSize:9, color:T.txt4 }}>🔒</span>}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <span style={{ fontSize:9, fontFamily:"monospace", fontWeight:700, padding:"2px 8px", borderRadius:20, background:hub.gl, border:`1px solid ${hub.br}`, color:hub.color }}>{hub.tag}</span>
            <span style={{ fontSize:9, fontFamily:"monospace", fontWeight:700, padding:"2px 8px", borderRadius:20, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:T.txt3 }}>{hub.badge}</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>{hub.desc}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 10px" }}>
        {hub.features.map((f,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color: hub.locked ? T.txt4 : T.txt2 }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background: hub.locked ? T.txt4 : hub.color, flexShrink:0 }} />
            {f}
          </div>
        ))}
      </div>
      {!hub.locked && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:`1px solid ${hub.br}`, paddingTop:12, marginTop:2 }}>
          <div style={{ display:"flex", gap:14 }}>
            {hub.conditions > 0 && <div style={{ fontSize:10, color:T.txt3 }}><span style={{ fontWeight:700, color:hub.color, fontFamily:"monospace" }}>{hub.conditions}</span> conditions</div>}
            {hub.calcs > 0 && <div style={{ fontSize:10, color:T.txt3 }}><span style={{ fontWeight:700, color:hub.color, fontFamily:"monospace" }}>{hub.calcs}</span> calculators</div>}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color: active ? "#060d1a" : hub.color, background: active ? hub.color : "transparent", border:`1px solid ${hub.color}55`, borderRadius:7, padding:"4px 12px", transition:"all .18s" }}>Open →</div>
        </div>
      )}
    </div>
  );
}

// ── AIChat: FIX — uses base44.integrations.Core.InvokeLLM ──────────
function AIChat() {
  const [messages, setMessages] = useState([
    { role:"assistant", text:"Hello! I'm Notrya AI — your clinical decision support assistant. Ask me about sepsis protocols, airway management, drug dosing, guidelines, or any emergency medicine question." }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    const updated = [...messages, { role:"user", text:q }];
    setMessages(updated);
    setLoading(true);
    try {
      const history = updated.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n\n");
      const prompt  = `${AI_SYSTEM}\n\nConversation:\n${history}\n\nAssistant:`;
      const reply   = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages(p => [...p, { role:"assistant", text: reply || "I encountered an error. Please try again." }]);
    } catch (e) {
      setMessages(p => [...p, { role:"assistant", text:"Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const SUGGESTIONS = [
    "qSOFA threshold for high-risk sepsis?",
    "RSI induction agent for hypotensive patient",
    "ARDSNet tidal volume for 170cm female",
    "COPD exac pH 7.28 — BiPAP settings?",
  ];

  return (
    <GBox style={{ borderRadius:16, display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"rgba(0,229,192,0.12)", border:"1px solid rgba(0,229,192,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🤖</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>Notrya AI</div>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, animation:"nh-pulse 2s infinite" }} />
            <span style={{ fontSize:9, color:T.teal, fontWeight:600 }}>Clinical Assistant · Online</span>
          </div>
        </div>
        <div style={{ marginLeft:"auto", fontSize:9, fontFamily:"monospace", padding:"2px 8px", borderRadius:20, background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)", color:T.teal, fontWeight:700 }}>claude-sonnet</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:10, minHeight:0 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
            <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, background: m.role === "user" ? "rgba(59,158,255,0.2)" : "rgba(0,229,192,0.15)", border:`1px solid ${m.role === "user" ? "rgba(59,158,255,0.4)" : "rgba(0,229,192,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{m.role === "user" ? "👤" : "🤖"}</div>
            <div style={{ maxWidth:"78%", padding:"10px 13px", borderRadius:10, fontSize:12, lineHeight:1.65, background: m.role === "user" ? "rgba(59,158,255,0.12)" : "rgba(255,255,255,0.04)", border:`1px solid ${m.role === "user" ? "rgba(59,158,255,0.3)" : "rgba(255,255,255,0.07)"}`, color:T.txt, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"rgba(0,229,192,0.15)", border:"1px solid rgba(0,229,192,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🤖</div>
            <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:5, alignItems:"center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.teal, animation:`nh-bounce .9s ${i*.15}s infinite ease-in-out` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {messages.filter(m => m.role === "user").length === 0 && (
        <div style={{ padding:"0 14px 10px", display:"flex", flexDirection:"column", gap:5 }}>
          {SUGGESTIONS.map((s,i) => (
            <button key={i} onClick={() => setInput(s)} style={{ textAlign:"left", padding:"7px 11px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:T.txt2, fontSize:10.5, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(0,229,192,0.08)"; e.currentTarget.style.color=T.teal; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.color=T.txt2; }}>
              💬 {s}
            </button>
          ))}
        </div>
      )}
      <div style={{ padding:"10px 14px 14px", borderTop:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask about protocols, dosing, guidelines…" style={{ flex:1, padding:"9px 13px", borderRadius:9, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:T.txt, fontSize:12 }} />
          <button onClick={send} disabled={!input.trim() || loading} style={{ padding:"9px 16px", borderRadius:9, border:"none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", background: input.trim() && !loading ? T.teal : "rgba(255,255,255,0.06)", color: input.trim() && !loading ? "#060d1a" : T.txt4, fontWeight:700, fontSize:12, transition:"all .18s" }}>→</button>
        </div>
      </div>
    </GBox>
  );
}

function StatsRow() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
      {STATS.map((s,i) => (
        <GBox key={i} style={{ borderRadius:12, padding:"16px 18px", textAlign:"center" }}>
          <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
          <div style={{ fontSize:24, fontWeight:700, color:s.color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1, marginBottom:5 }}>{s.val}</div>
          <div style={{ fontSize:10, color:T.txt3, textTransform:"uppercase", letterSpacing:".06em", lineHeight:1.4 }}>{s.label}</div>
        </GBox>
      ))}
    </div>
  );
}

function GuidelinesTicker() {
  return (
    <GBox style={{ borderRadius:10, padding:"10px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={{ fontSize:9, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:".08em", flexShrink:0, marginRight:4 }}>Referenced Guidelines</span>
        {GUIDELINES.map((g,i) => (
          <span key={i} style={{ fontSize:9, fontFamily:"monospace", fontWeight:700, padding:"2px 9px", borderRadius:20, background:`${g.color}12`, border:`1px solid ${g.color}35`, color:g.color, flexShrink:0 }}>{g.label}</span>
        ))}
      </div>
    </GBox>
  );
}

const HUB_ROUTES = {
  sepsis:    "/sepsis-hub",
  airway:    "/airway-hub",
  erx:       "/erx",
  knowledge: "/KnowledgeBaseV2",
  calendar:  "/Calendar",
};

function HubOverlay({ hub, onClose }) {
  const navigate = useNavigate();
  const handleOpen = () => {
    const route = HUB_ROUTES[hub.id];
    if (route) { onClose(); navigate(route); }
    else onClose();
  };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(3,8,20,0.82)", zIndex:400, backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"92%", maxWidth:520, background:"rgba(8,16,30,0.97)", backdropFilter:"blur(32px)", border:`1px solid ${hub.color}44`, borderRadius:18, boxShadow:`0 32px 80px rgba(0,0,0,0.7),0 0 80px ${hub.color}12`, padding:"28px", animation:"nh-fadeInPop .18s ease" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:hub.gl, border:`1px solid ${hub.br}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, flexShrink:0 }}>{hub.icon}</div>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>{hub.title}</div>
            <span style={{ fontSize:9, fontFamily:"monospace", fontWeight:700, padding:"2px 9px", borderRadius:20, background:hub.gl, border:`1px solid ${hub.br}`, color:hub.color }}>{hub.badge}</span>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", color:T.txt3, cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
        </div>
        <div style={{ fontSize:13, color:T.txt2, lineHeight:1.7, marginBottom:18 }}>{hub.desc}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
          {hub.features.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, background:hub.gl, border:`1px solid ${hub.br}` }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:hub.color, flexShrink:0 }} />
              <span style={{ fontSize:11, color:T.txt2 }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div onClick={handleOpen} style={{ flex:1, padding:"11px", borderRadius:10, background:hub.color, color:"#060d1a", fontWeight:700, fontSize:13, textAlign:"center", cursor: hub.locked ? "default" : "pointer", opacity: hub.locked ? .5 : 1 }}>
            {hub.locked ? "Coming Soon" : `Open ${hub.title} →`}
          </div>
          <button onClick={onClose} style={{ padding:"11px 18px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:T.txt2, fontSize:12, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function NotryaHome() {
  const [selectedHub, setSelectedHub] = useState(null);
  // NOTE: tick/setTick removed — cursor blink now lives inside Typewriter

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif", position:"relative", overflowX:"hidden" }}>
      <BgMesh />
      <div style={{ position:"relative", zIndex:1 }}>

        <nav style={{ position:"fixed", top:48, left:0, right:0, zIndex:100, background:"rgba(5,15,30,0.88)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 32px", height:56, display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#3b9eff,#00e5c0)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, fontFamily:"'Playfair Display',serif", color:"#050f1e", boxShadow:"0 0 16px rgba(0,229,192,0.4)" }}>N</div>
            <span style={{ fontSize:16, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif", letterSpacing:".02em" }}>Notrya</span>
            <span style={{ fontSize:9, fontWeight:700, padding:"1px 7px", borderRadius:20, background:"rgba(0,229,192,0.12)", border:"1px solid rgba(0,229,192,0.3)", color:T.teal, fontFamily:"monospace" }}>AI</span>
          </div>
          <div style={{ display:"flex", gap:4, marginLeft:16 }}>
            {[["🏠","Home"],["🦠","Sepsis"],["🌬️","Airway"],["💊","ERx"],["📖","Knowledge"],["📅","Schedule"]].map(([icon,label],i) => (
              <button key={i} style={{ padding:"5px 13px", borderRadius:7, background: i===0 ? "rgba(59,158,255,0.12)" : "transparent", border:`1px solid ${i===0 ? "rgba(59,158,255,0.3)" : "transparent"}`, color: i===0 ? T.blue : T.txt3, fontSize:11, fontWeight: i===0 ? 700 : 400, cursor:"pointer", fontFamily:"inherit", transition:"all .15s", display:"flex", alignItems:"center", gap:5 }}
                onMouseEnter={e => { if(i!==0){ e.currentTarget.style.color=T.txt2; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}}
                onMouseLeave={e => { if(i!==0){ e.currentTarget.style.color=T.txt3; e.currentTarget.style.background="transparent"; }}}>
                <span>{icon}</span><span>{label}</span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.25)" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:T.teal, animation:"nh-pulse 2s infinite" }} />
              <span style={{ fontSize:10, fontWeight:600, color:T.teal }}>AI Online</span>
            </div>
            <div style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer" }}>👤</div>
          </div>
        </nav>

        <div style={{ padding:"104px 32px 48px", maxWidth:1440, margin:"0 auto" }}>

          <div style={{ padding:"56px 0 40px", textAlign:"center", animation:"nh-fadeInUp .6s ease" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:20, marginBottom:24, background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.25)", fontSize:11, fontWeight:600, color:T.teal }}>
              <span style={{ animation:"nh-pulse 2s infinite", display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.teal }} />
              Emergency Medicine Clinical Decision Support · Powered by Claude
            </div>
            <h1 style={{ fontSize:"clamp(32px,5vw,58px)", fontWeight:700, lineHeight:1.15, fontFamily:"'Playfair Display',serif", color:T.txt, marginBottom:16, letterSpacing:"-.01em" }}>
              Clinical Intelligence<br /><Typewriter />
            </h1>
            <p style={{ fontSize:"clamp(13px,1.8vw,17px)", color:T.txt2, maxWidth:600, margin:"0 auto 32px", lineHeight:1.7 }}>
              Evidence-based protocols, interactive calculators, and AI-powered decision support built for emergency medicine clinicians. From sepsis to airway — every decision, optimized.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={() => setSelectedHub(HUBS[0])} style={{ padding:"13px 28px", borderRadius:11, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#00e5c0,#3b9eff)", color:"#050f1e", fontWeight:700, fontSize:14, fontFamily:"inherit", boxShadow:"0 8px 32px rgba(0,229,192,0.3)", transition:"all .2s" }}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
                🚀 Open Sepsis Hub
              </button>
              <button style={{ padding:"13px 28px", borderRadius:11, cursor:"pointer", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", color:T.txt, fontWeight:600, fontSize:14, fontFamily:"inherit", transition:"all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"}>
                🤖 Ask Notrya AI
              </button>
            </div>
          </div>

          <div style={{ marginBottom:24 }}><StatsRow /></div>
          <div style={{ marginBottom:32 }}><GuidelinesTicker /></div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:20, marginBottom:32, alignItems:"start" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize:10, fontWeight:700, color:T.txt3, textTransform:"uppercase", letterSpacing:".1em" }}>Clinical Hubs</span>
                <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.06)" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {HUBS.map(h => <HubCard key={h.id} hub={h} onOpen={setSelectedHub} />)}
              </div>
            </div>

            {/* AI Chat panel: FIX — explicit 640px height, no calc(100vh) */}
            <div style={{ position:"sticky", top:116, display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize:10, fontWeight:700, color:T.txt3, textTransform:"uppercase", letterSpacing:".1em" }}>Notrya AI</span>
                <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.06)" }} />
              </div>
              <div style={{ height:640 }}><AIChat /></div>
            </div>
          </div>

          <GBox style={{ borderRadius:16, padding:"28px 32px", marginBottom:20 }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.txt3, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Why Notrya</div>
              <div style={{ fontSize:22, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>Built for the Point of Care</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
              {[
                { icon:"⚡", title:"Real-Time Decision Support",  desc:"Interactive calculators, scored criteria, and protocol flows at the bedside — no more mental arithmetic under pressure.", color:T.gold },
                { icon:"🌐", title:"AI-Localized Resistance Data", desc:"Enter your hospital or city and Claude estimates local antimicrobial resistance rates for smarter empiric antibiotic selection.", color:T.teal },
                { icon:"📚", title:"Current Evidence, Always",    desc:"Every protocol referenced to the most current guidelines: SSC 2021, IDSA 2024, DAS 2022, ARDSNet, PADIS 2018, and more.", color:T.blue },
                { icon:"💊", title:"Full Antibiotic Stewardship", desc:"Empiric to renal-adjusted to IV-to-PO to de-escalation. Expandable drug rows with every tier for every source.", color:T.purple },
                { icon:"🤖", title:"Claude AI Integration",       desc:"Every hub backed by Claude AI for dynamic content generation, resistance lookups, and clinical question answering.", color:T.coral },
                { icon:"🧮", title:"7 Clinical Calculators",      desc:"qSOFA, SIRS, 30 mL/kg Fluid Bolus, ARDSNet IBW/TV, ROX Index, RSBI, and RSI Weight-Based Drug Dosing.", color:T.orange },
              ].map((f,i) => (
                <div key={i} style={{ padding:"18px 20px", borderRadius:12, background:`${f.color}09`, border:`1px solid ${f.color}25`, display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ fontSize:26 }}>{f.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:f.color, fontFamily:"'Playfair Display',serif" }}>{f.title}</div>
                  <div style={{ fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </GBox>

          <GBox style={{ borderRadius:12, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#3b9eff,#00e5c0)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#050f1e", fontFamily:"'Playfair Display',serif" }}>N</div>
              <div>
                <span style={{ fontSize:13, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>Notrya</span>
                <span style={{ fontSize:10, color:T.txt3, marginLeft:8 }}>Emergency Medicine Clinical Decision Support</span>
              </div>
            </div>
            <div style={{ fontSize:10, color:T.txt4, lineHeight:1.6, maxWidth:500, textAlign:"right" }}>
              For clinical decision support only. Not a substitute for clinical judgment. All protocols should be verified against current institutional guidelines. Powered by Claude (Anthropic).
            </div>
          </GBox>

        </div>
      </div>
      {selectedHub && <HubOverlay hub={selectedHub} onClose={() => setSelectedHub(null)} />}
    </div>
  );
}