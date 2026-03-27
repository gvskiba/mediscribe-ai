import { useState, useRef, useEffect, useCallback } from "react";
import ACSPage from "@/components/acs/ACSPage";

const NAV_DATA = {
  intake: [
    { section:"chart",        abbr:"Pc", icon:"📊", label:"Patient Chart",    dot:"done" },
    { section:"demographics", abbr:"Dm", icon:"👤", label:"Demographics",     dot:"partial" },
    { section:"cc",           abbr:"Cc", icon:"💬", label:"Chief Complaint",  dot:"empty" },
    { section:"vitals",       abbr:"Vt", icon:"📈", label:"Vitals",           dot:"empty" },
  ],
  documentation: [
    { section:"meds",  abbr:"Rx", icon:"💊", label:"Meds & PMH",        dot:"empty" },
    { section:"ros",   abbr:"Rs", icon:"🔍", label:"Review of Systems", dot:"empty" },
    { section:"exam",  abbr:"Pe", icon:"🩺", label:"Physical Exam",     dot:"empty" },
    { section:"mdm",   abbr:"Md", icon:"⚖️", label:"MDM",               dot:"empty" },
  ],
  disposition: [
    { section:"orders",    abbr:"Or", icon:"📋", label:"Orders",          dot:"empty" },
    { section:"discharge", abbr:"Dc", icon:"🚪", label:"Discharge",       dot:"empty" },
    { section:"erplan",    abbr:"Ep", icon:"🗺️", label:"ER Plan Builder", dot:"empty" },
  ],
  tools: [
    { section:"acs",        abbr:"CS", icon:"🫀", label:"ACS Protocol",  dot:"empty" },
    { section:"erx",        abbr:"Ex", icon:"💉", label:"eRx",           dot:"empty" },
    { section:"procedures", abbr:"Pr", icon:"✂️", label:"Procedures",    dot:"empty" },
  ],
};
const GROUP_META = [
  { key:"intake",        icon:"📋", label:"Intake" },
  { key:"documentation", icon:"🩺", label:"Documentation" },
  { key:"disposition",   icon:"🚪", label:"Disposition" },
  { key:"tools",         icon:"🔧", label:"Tools" },
];
const SIDEBAR_BTNS = [
  { icon:"🏠", label:"Home" },
  { icon:"📊", label:"Dash" },
  { icon:"👥", label:"Patients", active:true },
  { icon:"🔄", label:"Shift" },
  "sep",
  { icon:"💊", label:"Drugs" },
  { icon:"🧮", label:"Calc" },
];
const QUICK_ACTIONS = [
  { icon:"📋", label:"Summarise", prompt:"Summarise what I have entered so far." },
  { icon:"🔍", label:"Check",     prompt:"What am I missing? Check my entries for completeness." },
  { icon:"📝", label:"Draft Note",prompt:"Generate a draft note from the data entered." },
  { icon:"🧠", label:"DDx",       prompt:"Suggest differential diagnoses based on current data." },
];
const ALL_SECTIONS = Object.values(NAV_DATA).flat();
const SYSTEM_PROMPT = "You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2–4 concise, actionable sentences. Be direct. Never fabricate data.";

function PlaceholderPage({ section }) {
  const meta = {
    chart:        { icon:"📊", title:"Patient Chart",     sub:"Overview of the full patient chart and timeline" },
    demographics: { icon:"👤", title:"Demographics",      sub:"Patient personal information and contact details" },
    cc:           { icon:"💬", title:"Chief Complaint",   sub:"Primary reason for today's visit" },
    vitals:       { icon:"📈", title:"Vitals",            sub:"Current and trending patient vital signs" },
    meds:         { icon:"💊", title:"Meds & PMH",        sub:"Medications, allergies and past medical history" },
    ros:          { icon:"🔍", title:"Review of Systems", sub:"Systematic symptom review by body system" },
    exam:         { icon:"🩺", title:"Physical Exam",     sub:"Findings from today's physical examination" },
    mdm:          { icon:"⚖️", title:"MDM",               sub:"Medical decision making and clinical reasoning" },
    orders:       { icon:"📋", title:"Orders",            sub:"Lab, imaging and medication orders" },
    discharge:    { icon:"🚪", title:"Discharge",         sub:"Discharge instructions, prescriptions and follow-up" },
    erplan:       { icon:"🗺️", title:"ER Plan Builder",   sub:"Build and track the patient's ER care plan" },
    erx:          { icon:"💉", title:"eRx",               sub:"Electronic prescribing and medication reconciliation" },
    procedures:   { icon:"✂️", title:"Procedures",        sub:"Procedure documentation and consent tracking" },
  }[section] || { icon:"📄", title:"Section", sub:"Content area" };
  return (
    <>
      <div className="page-header">
        <span className="page-header-icon">{meta.icon}</span>
        <div>
          <div className="page-title">{meta.title}</div>
          <div className="page-subtitle">{meta.sub}</div>
        </div>
      </div>
      <div className="section-box">
        <div className="card">
          <p className="text-muted text-sm">Select a section from the bottom navigation to begin documenting.</p>
        </div>
      </div>
    </>
  );
}

export default function NotryaACS() {
  const [activeGroup,   setActiveGroup]   = useState("tools");
  const [activeSection, setActiveSection] = useState("acs");
  const [navDots, setNavDots] = useState(() => {
    const m = {};
    ALL_SECTIONS.forEach(s => (m[s.section] = s.dot));
    return m;
  });
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"));
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const currentItem = ALL_SECTIONS.find(s => s.section === activeSection);
  const pageAbbr    = currentItem?.abbr || "CS";

  const [aiOpen,    setAiOpen]    = useState(false);
  const [aiMsgs,    setAiMsgs]    = useState([{ role:"sys", text:"Notrya AI ready — select a quick action or ask a clinical question." }]);
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [history,   setHistory]   = useState([]);
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);
  const pillsRef = useRef(null);

  useEffect(() => { msgsRef.current?.scrollTo({ top:msgsRef.current.scrollHeight, behavior:"smooth" }); }, [aiMsgs, aiLoading]);
  useEffect(() => { if (aiOpen) setTimeout(()=>inputRef.current?.focus(), 280); }, [aiOpen]);
  useEffect(() => {
    const h = e => { if (e.key==="Escape" && aiOpen) setAiOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aiOpen]);
  useEffect(() => {
    const row = pillsRef.current;
    if (!row) return;
    row.querySelector(".bn-sub-pill.active")?.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
  }, [activeSection, activeGroup]);

  const selectGroup = useCallback(group => {
    setActiveGroup(group);
    const items = NAV_DATA[group];
    setActiveSection(prev => items.find(i=>i.section===prev) ? prev : items[0].section);
  }, []);

  const selectSection = useCallback(sectionId => {
    setActiveSection(sectionId);
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i=>i.section===sectionId)) { setActiveGroup(group); break; }
    }
  }, []);

  const getGroupBadge = useCallback(groupKey => {
    const items = NAV_DATA[groupKey];
    const allDone    = items.every(i=>navDots[i.section]==="done");
    const anyStarted = items.some(i=>navDots[i.section]==="done"||navDots[i.section]==="partial");
    return allDone ? "done" : anyStarted ? "partial" : "empty";
  }, [navDots]);

  const toggleAI = useCallback(() => {
    setAiOpen(o => { if (!o) setUnread(0); return !o; });
  }, []);

  const sendMessage = useCallback(async text => {
    if (!text.trim() || aiLoading) return;
    setAiMsgs(m=>[...m,{ role:"user", text:text.trim() }]);
    setAiInput("");
    setAiLoading(true);
    const ctx = `Active section: ${currentItem?.label||"Unknown"} | Group: ${activeGroup}`;
    const newHistory = [...history, { role:"user", content:ctx+"\n\n"+text.trim() }];
    setHistory(newHistory);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:SYSTEM_PROMPT, messages:newHistory }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "No response received.";
      setHistory(h=>[...h,{ role:"assistant", content:reply }]);
      setAiMsgs(m=>[...m,{ role:"bot", text:reply }]);
      setAiOpen(open => { if (!open) setUnread(u=>u+1); return open; });
    } catch {
      setAiMsgs(m=>[...m,{ role:"sys", text:"⚠ Connection error — please try again." }]);
    } finally { setAiLoading(false); }
  }, [aiLoading, history, currentItem, activeGroup]);

  const handleAIKey = e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendMessage(aiInput); } };
  const renderMsg = text => text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,'<strong style="color:#00e5c0">$1</strong>');

  const subItems = NAV_DATA[activeGroup] || [];

  return (
    <>
      <style>{CSS}</style>
      <aside className="icon-sidebar">
        <div className="isb-logo"><div className="isb-logo-box">{pageAbbr}</div></div>
        <div className="isb-scroll">
          {SIDEBAR_BTNS.map((b,i) =>
            b==="sep" ? <div key={i} className="isb-sep" /> :
            <div key={i} className={`isb-btn${b.active?" active":""}`} title={b.label}><span>{b.icon}</span><span className="isb-lbl">{b.label}</span></div>
          )}
        </div>
        <div className="isb-bottom">
          <div className="isb-btn" title="Settings"><span>⚙️</span><span className="isb-lbl">Settings</span></div>
        </div>
      </aside>

      <header className="top-bar">
        <div className="top-row-1">
          <span className="nav-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span>
          <div className="nav-sep" />
          <div className="nav-stat"><span className="nav-stat-val">0</span><span className="nav-stat-lbl">Active</span></div>
          <div className="nav-stat"><span className="nav-stat-val alert">14</span><span className="nav-stat-lbl">Pending</span></div>
          <div className="nav-stat"><span className="nav-stat-val">—</span><span className="nav-stat-lbl">Orders</span></div>
          <div className="nav-stat"><span className="nav-stat-val">11.6</span><span className="nav-stat-lbl">Hours</span></div>
          <div className="nav-right">
            <div className="nav-time">{clock}</div>
            <div className="nav-ai-on"><div className="nav-ai-dot" /> AI ON</div>
            <button className="nav-new-pt">+ New Patient</button>
          </div>
        </div>
        <div className="top-row-2">
          <span className="chart-badge">[CHART-ID]</span>
          <span className="pt-name">— Patient —</span>
          <span className="pt-meta">Age · Sex · DOB</span>
          <span className="pt-cc">CC: Chest Pain / ACS</span>
          <div className="vb-div" />
          {[{l:"BP",v:"—"},{l:"HR",v:"—"},{l:"RR",v:"—"},{l:"SpO₂",v:"—"},{l:"T",v:"—"},{l:"GCS",v:"—"}].map(vt=>(
            <div key={vt.l} className="vb-vital"><span className="lbl">{vt.l}</span><span className="val">{vt.v}</span></div>
          ))}
          <div className="vb-div" />
          <span className="status-badge status-stable">STABLE</span>
          <span className="status-badge status-room">Room —</span>
          <div className="chart-actions">
            <button className="btn-ghost">📋 Orders</button>
            <button className="btn-coral">🚪 Discharge</button>
            <button className="btn-primary">💾 Save Chart</button>
          </div>
        </div>
      </header>

      <div className="main-wrap">
        <main className="content">
          {activeSection === "acs" ? <ACSPage /> : <PlaceholderPage section={activeSection} />}
        </main>
      </div>

      <div className={`n-scrim${aiOpen?" open":""}`} onClick={toggleAI} />
      <div className={`n-overlay${aiOpen?" open":""}`}>
        <div className="n-hdr">
          <div className="n-hdr-top">
            <div className="n-avatar">🤖</div>
            <div className="n-hdr-info">
              <div className="n-hdr-name">Notrya AI</div>
              <div className="n-hdr-sub"><span className="dot" /> claude-sonnet-4 · online</div>
            </div>
            <button className="n-close" onClick={toggleAI}>✕</button>
          </div>
          <div className="n-quick">
            {QUICK_ACTIONS.map(q=>(
              <button key={q.label} className="n-qbtn" onClick={()=>sendMessage(q.prompt)} disabled={aiLoading}>{q.icon} {q.label}</button>
            ))}
          </div>
        </div>
        <div className="n-msgs" ref={msgsRef}>
          {aiMsgs.map((m,i)=>(
            <div key={i} className={`n-msg ${m.role}`} dangerouslySetInnerHTML={{ __html:renderMsg(m.text) }} />
          ))}
          {aiLoading && <div className="n-dots"><span /><span /><span /></div>}
        </div>
        <div className="n-input-bar">
          <textarea ref={inputRef} className="n-ta" rows={1} placeholder="Ask anything…"
            value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={handleAIKey}
            onInput={e=>{ e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,90)+"px"; }}
            disabled={aiLoading} />
          <button className="n-send" onClick={()=>sendMessage(aiInput)} disabled={aiLoading||!aiInput.trim()}>↑</button>
        </div>
      </div>

      <button className={`n-fab${aiOpen?" open":""}`} onClick={toggleAI}>
        <span className="n-fab-icon">{aiOpen?"✕":"🤖"}</span>
        <span className={`n-fab-badge${unread>0?" show":""}`}>{unread>9?"9+":unread}</span>
      </button>

      <nav className="bottom-nav">
        <div className="bn-sub-wrap">
          <div className="bn-sub-row" ref={pillsRef}>
            {subItems.map(item=>(
              <button key={item.section} className={`bn-sub-pill${item.section===activeSection?" active":""}`} onClick={()=>selectSection(item.section)}>
                <span className="pill-icon">{item.icon}</span>
                {item.label}
                <span className={`pill-dot ${navDots[item.section]}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="bn-groups">
          {GROUP_META.map(g=>(
            <button key={g.key} className={`bn-group-tab${g.key===activeGroup?" active":""}`} onClick={()=>selectGroup(g.key)}>
              <div className="bn-group-icon">{g.icon}<span className={`bn-group-badge ${getGroupBadge(g.key)}`} /></div>
              <span className="bn-group-label">{g.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--icon-sb:56px;--top-h:88px;--bot-h:108px;--r:8px;--rl:12px}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;overflow:hidden}
.icon-sidebar{position:fixed;top:0;left:0;bottom:0;width:var(--icon-sb);background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;z-index:200}
.isb-logo{width:100%;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border)}
.isb-logo-box{width:30px;height:30px;background:var(--blue);border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:white;cursor:pointer}
.isb-scroll{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;overflow-y:auto}
.isb-btn{width:42px;height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:6px;cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent;font-size:15px}
.isb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
.isb-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue)}
.isb-lbl{font-size:8px;line-height:1;white-space:nowrap}
.isb-sep{width:30px;height:1px;background:var(--border);margin:4px 0;flex-shrink:0}
.isb-bottom{padding:8px 0;border-top:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:2px}
.top-bar{position:fixed;top:0;left:var(--icon-sb);right:0;height:var(--top-h);background:var(--bg-panel);border-bottom:1px solid var(--border);z-index:100;display:flex;flex-direction:column}
.top-row-1{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid rgba(26,53,85,.5)}
.nav-welcome{font-size:12px;color:var(--txt2);font-weight:500;white-space:nowrap}
.nav-welcome strong{color:var(--txt);font-weight:600}
.nav-sep{width:1px;height:20px;background:var(--border);flex-shrink:0}
.nav-stat{display:flex;align-items:center;gap:5px;background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px;cursor:pointer}
.nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--txt)}
.nav-stat-val.alert{color:var(--gold)}
.nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2)}
.nav-ai-on{display:flex;align-items:center;gap:4px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--teal)}
.nav-ai-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:ai-pulse 2s ease-in-out infinite}
@keyframes ai-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.nav-new-pt{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer}
.top-row-2{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.pt-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);white-space:nowrap}
.pt-meta{font-size:11px;color:var(--txt3);white-space:nowrap}
.pt-cc{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--orange);white-space:nowrap}
.vb-div{width:1px;height:18px;background:var(--border);flex-shrink:0}
.vb-vital{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:10.5px;white-space:nowrap}
.vb-vital .lbl{color:var(--txt4);font-size:9px}
.vb-vital .val{color:var(--txt2)}
.chart-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 8px;color:var(--teal);white-space:nowrap}
.status-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;white-space:nowrap}
.status-stable{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.status-room{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.chart-actions{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--txt2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}
.btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.main-wrap{position:fixed;top:var(--top-h);left:var(--icon-sb);right:0;bottom:var(--bot-h);display:flex}
.content{flex:1;overflow-y:auto;padding:18px 28px 30px;display:flex;flex-direction:column;gap:18px}
.page-header{display:flex;align-items:center;gap:10px}
.page-header-icon{font-size:20px}
.page-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:var(--txt)}
.page-subtitle{font-size:12px;color:var(--txt3);margin-top:1px}
.section-box{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px}
.text-muted{color:var(--txt3)}.text-sm{font-size:12px}
.bottom-nav{position:fixed;bottom:0;left:var(--icon-sb);right:0;height:var(--bot-h);background:var(--bg-panel);border-top:1px solid var(--border);z-index:100;display:flex;flex-direction:column}
.bn-sub-wrap{position:relative;flex-shrink:0;height:44px}
.bn-sub-wrap::before,.bn-sub-wrap::after{content:'';position:absolute;top:0;bottom:0;width:24px;z-index:2;pointer-events:none}
.bn-sub-wrap::before{left:0;background:linear-gradient(90deg,var(--bg-panel) 0%,transparent 100%)}
.bn-sub-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg-panel) 0%,transparent 100%)}
.bn-sub-row{height:44px;display:flex;align-items:center;padding:0 12px;gap:6px;overflow-x:auto;overflow-y:hidden;border-bottom:1px solid rgba(26,53,85,.4);scrollbar-width:none}
.bn-sub-row::-webkit-scrollbar{display:none}
.bn-sub-pill{display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;color:var(--txt3);background:transparent;border:1px solid transparent;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0;font-family:'DM Sans',sans-serif}
.bn-sub-pill:hover{color:var(--txt2);background:var(--bg-up);border-color:var(--border)}
.bn-sub-pill.active{color:var(--blue);background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.35);font-weight:600}
.bn-sub-pill .pill-icon{font-size:12px}
.bn-sub-pill .pill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.bn-sub-pill .pill-dot.done{background:var(--teal);box-shadow:0 0 4px rgba(0,229,192,.5)}
.bn-sub-pill .pill-dot.partial{background:var(--orange)}
.bn-sub-pill .pill-dot.empty{background:var(--txt4)}
.bn-groups{height:64px;flex-shrink:0;display:flex;align-items:stretch}
.bn-group-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;position:relative;transition:all .2s;border:none;background:none;font-family:'DM Sans',sans-serif;padding:6px 0}
.bn-group-tab::before{content:'';position:absolute;top:0;left:20%;right:20%;height:2px;background:var(--blue);border-radius:0 0 2px 2px;transform:scaleX(0);transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.bn-group-tab.active::before{transform:scaleX(1)}
.bn-group-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:transparent;border:1px solid transparent;transition:all .2s;position:relative}
.bn-group-tab:hover .bn-group-icon{background:var(--bg-up);border-color:var(--border)}
.bn-group-tab.active .bn-group-icon{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3)}
.bn-group-badge{position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--bg-panel)}
.bn-group-badge.done{background:var(--teal)}
.bn-group-badge.partial{background:var(--orange)}
.bn-group-badge.empty{background:transparent;border-color:transparent}
.bn-group-label{font-size:9px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:var(--txt4);transition:color .2s}
.bn-group-tab:hover .bn-group-label{color:var(--txt3)}
.bn-group-tab.active .bn-group-label{color:var(--blue);font-weight:600}
.bn-group-tab+.bn-group-tab{border-left:1px solid rgba(26,53,85,.4)}
.n-scrim{position:fixed;inset:0;z-index:9997;background:rgba(3,8,16,.4);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .3s}
.n-scrim.open{opacity:1;pointer-events:auto}
.n-fab{position:fixed;bottom:124px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--teal) 0%,#00b4d8 100%);box-shadow:0 6px 24px rgba(0,229,192,.35);transition:all .35s cubic-bezier(.34,1.56,.64,1);animation:n-ring 3s ease-in-out infinite}
.n-fab:hover{transform:scale(1.12)}
.n-fab.open{animation:none;background:linear-gradient(135deg,var(--coral) 0%,#e05555 100%);transform:rotate(90deg)}
@keyframes n-ring{0%,100%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 0 rgba(0,229,192,.28)}50%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 12px rgba(0,229,192,0)}}
.n-fab-icon{font-size:24px;line-height:1}
.n-fab-badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:var(--coral);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2.5px solid var(--bg);padding:0 5px;opacity:0;transform:scale(0);transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.n-fab-badge.show{opacity:1;transform:scale(1)}
.n-overlay{position:fixed;bottom:194px;right:24px;z-index:9998;width:340px;height:520px;background:#081628;border:1px solid var(--border);border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);opacity:0;transform:translateY(20px) scale(.94);pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1)}
.n-overlay.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.n-hdr{padding:16px 16px 12px;flex-shrink:0;border-bottom:1px solid var(--border)}
.n-hdr-top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.n-avatar{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--teal),var(--blue));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.n-hdr-info{flex:1}
.n-hdr-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--txt)}
.n-hdr-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt3);margin-top:2px;display:flex;align-items:center;gap:4px}
.n-hdr-sub .dot{width:5px;height:5px;border-radius:50%;background:var(--teal)}
.n-close{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg-up);color:var(--txt3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.n-quick{display:flex;flex-wrap:wrap;gap:5px}
.n-qbtn{padding:5px 11px;border-radius:20px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);display:flex;align-items:center;gap:4px}
.n-qbtn:hover{border-color:rgba(0,229,192,.4);color:var(--teal);background:rgba(0,229,192,.06)}
.n-qbtn:disabled{opacity:.4;cursor:not-allowed}
.n-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.n-msgs::-webkit-scrollbar{width:4px}
.n-msgs::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.n-msg{padding:10px 13px;border-radius:12px;font-size:12.5px;line-height:1.65;max-width:88%;font-family:'DM Sans',sans-serif}
.n-msg.sys{background:rgba(14,37,68,.6);color:var(--txt3);border:1px solid rgba(26,53,85,.5);align-self:center;max-width:100%;text-align:center;font-size:11px;font-style:italic;border-radius:8px}
.n-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.22);color:var(--txt);align-self:flex-end;border-radius:14px 14px 3px 14px}
.n-msg.bot{background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.15);color:var(--txt);align-self:flex-start;border-radius:14px 14px 14px 3px}
.n-dots{display:flex;gap:5px;padding:12px 14px;align-self:flex-start;align-items:center}
.n-dots span{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:n-bounce 1.2s ease-in-out infinite}
.n-dots span:nth-child(2){animation-delay:.15s}.n-dots span:nth-child(3){animation-delay:.3s}
@keyframes n-bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-7px);opacity:1}}
.n-input-bar{padding:10px 14px 16px;flex-shrink:0;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end}
.n-ta{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:12px;padding:9px 13px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none;resize:none;min-height:40px;max-height:90px;line-height:1.5}
.n-ta:focus{border-color:var(--teal)}
.n-ta::placeholder{color:var(--txt4)}
.n-ta:disabled{opacity:.5}
.n-send{width:40px;height:40px;flex-shrink:0;background:linear-gradient(135deg,var(--teal),#00b4d8);border:none;border-radius:12px;color:var(--bg);font-size:18px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.n-send:hover{transform:scale(1.08)}
.n-send:disabled{opacity:.4;cursor:not-allowed;transform:none}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
`;