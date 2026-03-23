import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const CSS = `
:root {
  --bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;
  --border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;
  --teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;
  --green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;
  --txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;
  --icon-sb:56px;--top-h:88px;--bot-h:50px;--sb-w:210px;--ai-w:280px;
}
.npi-demo *,
.npi-demo *::before,
.npi-demo *::after { box-sizing:border-box; margin:0; padding:0; }
.npi-demo {
  position:fixed; inset:0; margin-left:72px;
  background:var(--bg); color:var(--txt);
  font-family:'DM Sans',sans-serif; font-size:14px; overflow:hidden;
}
/* ICON SIDEBAR */
.npi-icon-sb {
  position:fixed; top:0; left:72px; bottom:0; width:var(--icon-sb);
  background:#040d19; border-right:1px solid var(--border);
  display:flex; flex-direction:column; align-items:center; z-index:200;
}
.isb-logo {
  width:100%; height:48px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  border-bottom:1px solid var(--border);
}
.isb-logo-box {
  width:30px; height:30px; background:var(--blue); border-radius:7px;
  display:flex; align-items:center; justify-content:center;
  font-family:'Playfair Display',serif; font-size:13px; font-weight:700;
  color:white; cursor:pointer; transition:filter .15s,transform .3s;
}
.isb-scroll {
  flex:1; width:100%; display:flex; flex-direction:column; align-items:center;
  padding:8px 0; gap:2px; overflow-y:auto;
}
.isb-btn {
  width:42px; height:42px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:2px; border-radius:6px; cursor:pointer; transition:all .15s;
  color:var(--txt3); border:1px solid transparent; font-size:15px;
}
.isb-btn:hover { background:var(--bg-up); border-color:var(--border); color:var(--txt2); }
.isb-btn.active { background:rgba(59,158,255,0.1); border-color:rgba(59,158,255,0.3); color:var(--blue); }
.isb-lbl { font-size:8px; line-height:1; white-space:nowrap; }
.isb-sep { width:30px; height:1px; background:var(--border); margin:4px 0; flex-shrink:0; }
.isb-bottom { padding:8px 0; border-top:1px solid var(--border); display:flex; flex-direction:column; align-items:center; gap:2px; }
/* TOP BAR */
.npi-top-bar {
  position:fixed; top:0; left:calc(72px + var(--icon-sb)); right:0;
  height:var(--top-h);
  background:var(--bg-panel); border-bottom:1px solid var(--border);
  z-index:100; display:flex; flex-direction:column;
}
.top-row-1 {
  height:44px; flex-shrink:0;
  display:flex; align-items:center; padding:0 14px; gap:8px;
  border-bottom:1px solid rgba(26,53,85,0.5);
}
.nav-welcome { font-size:12px; color:var(--txt2); font-weight:500; white-space:nowrap; }
.nav-welcome strong { color:var(--txt); font-weight:600; }
.nav-sep { width:1px; height:20px; background:var(--border); flex-shrink:0; }
.nav-stat {
  display:flex; align-items:center; gap:5px;
  background:var(--bg-up); border:1px solid var(--border); border-radius:6px;
  padding:3px 10px; cursor:pointer; transition:border-color .15s;
}
.nav-stat:hover { border-color:var(--border-hi); }
.nav-stat-val { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:var(--txt); }
.nav-stat-val.alert { color:var(--gold); }
.nav-stat-lbl { font-size:9px; color:var(--txt3); text-transform:uppercase; letter-spacing:.04em; }
.nav-right { margin-left:auto; display:flex; align-items:center; gap:6px; }
.nav-time {
  background:var(--bg-up); border:1px solid var(--border); border-radius:6px;
  padding:3px 10px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt2);
}
.nav-ai-on {
  display:flex; align-items:center; gap:4px;
  background:rgba(0,229,192,0.08); border:1px solid rgba(0,229,192,0.3);
  border-radius:6px; padding:3px 10px; font-size:11px; font-weight:600; color:var(--teal);
}
.nav-ai-dot { width:6px; height:6px; border-radius:50%; background:var(--teal); animation:ai-pulse 2s ease-in-out infinite; }
@keyframes ai-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,0.4)}50%{opacity:.8;box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.nav-new-pt {
  background:var(--teal); color:var(--bg); border:none; border-radius:6px;
  padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap;
}
.nav-new-pt:hover { filter:brightness(1.15); }
.top-row-2 {
  height:44px; flex-shrink:0;
  display:flex; align-items:center; padding:0 14px; gap:8px; overflow:hidden;
}
.pt-name { font-family:'Playfair Display',serif; font-size:14px; font-weight:600; color:var(--txt); white-space:nowrap; }
.pt-meta { font-size:11px; color:var(--txt3); white-space:nowrap; }
.pt-cc { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; color:var(--orange); white-space:nowrap; }
.vb-div { width:1px; height:18px; background:var(--border); flex-shrink:0; }
.vb-vital { display:flex; align-items:center; gap:3px; font-family:'JetBrains Mono',monospace; font-size:10.5px; white-space:nowrap; }
.vb-vital .lbl { color:var(--txt4); font-size:9px; }
.vb-vital .val { color:var(--txt2); }
.vb-vital .val.abn { color:var(--coral); animation:glow-red 2s ease-in-out infinite; }
@keyframes glow-red{0%,100%{text-shadow:0 0 4px rgba(255,107,107,0.4)}50%{text-shadow:0 0 10px rgba(255,107,107,0.9)}}
.chart-badge { font-family:'JetBrains Mono',monospace; font-size:10px; background:var(--bg-up); border:1px solid var(--border); border-radius:20px; padding:1px 8px; color:var(--teal); white-space:nowrap; }
.status-badge { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; padding:2px 8px; border-radius:4px; white-space:nowrap; }
.status-monitoring { background:rgba(255,107,107,0.15); color:var(--coral); border:1px solid rgba(255,107,107,0.3); }
.status-room { background:rgba(0,229,192,0.1); color:var(--teal); border:1px solid rgba(0,229,192,0.3); }
.chart-actions { margin-left:auto; display:flex; align-items:center; gap:5px; flex-shrink:0; }
.btn-ghost {
  background:var(--bg-up); border:1px solid var(--border); border-radius:6px;
  padding:4px 10px; font-size:11px; color:var(--txt2); cursor:pointer;
  transition:all .15s; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
}
.btn-ghost:hover { border-color:var(--border-hi); color:var(--txt); }
.btn-primary {
  background:var(--teal); color:var(--bg); border:none; border-radius:6px;
  padding:4px 12px; font-size:11px; font-weight:600; cursor:pointer;
  transition:filter .15s; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
}
.btn-primary:hover { filter:brightness(1.15); }
.btn-coral {
  background:rgba(255,107,107,0.15); color:var(--coral); border:1px solid rgba(255,107,107,0.3);
  border-radius:6px; padding:4px 12px; font-size:11px; font-weight:600; cursor:pointer;
  transition:all .15s; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
}
.btn-coral:hover { background:rgba(255,107,107,0.25); }
/* MAIN LAYOUT */
.npi-main-wrap {
  position:fixed;
  top:var(--top-h);
  left:calc(72px + var(--icon-sb)); right:0;
  bottom:var(--bot-h);
  display:flex;
}
/* SIDEBAR */
.npi-sidebar {
  width:var(--sb-w); flex-shrink:0;
  background:var(--bg-panel); border-right:1px solid var(--border);
  overflow-y:auto; padding:10px 8px;
  display:flex; flex-direction:column; gap:1px;
}
.sb-group-label {
  font-size:9px; color:var(--txt4); text-transform:uppercase; letter-spacing:.08em;
  padding:10px 8px 4px; font-weight:600;
}
.sb-group-label:first-child { padding-top:4px; }
.sb-nav-btn {
  display:flex; align-items:center; gap:7px; padding:6px 8px; border-radius:6px;
  cursor:pointer; transition:all .15s; border:1px solid transparent;
  font-size:12px; color:var(--txt2); user-select:none;
}
.sb-nav-btn:hover { background:var(--bg-up); border-color:var(--border); color:var(--txt); }
.sb-nav-btn.active { background:rgba(59,158,255,0.1); border-color:rgba(59,158,255,0.3); color:var(--blue); }
.sb-nav-btn .sb-icon { font-size:13px; width:18px; text-align:center; flex-shrink:0; }
.sb-dot { width:6px; height:6px; border-radius:50%; background:var(--border); margin-left:auto; flex-shrink:0; }
.sb-dot.done    { background:var(--teal);   box-shadow:0 0 5px rgba(0,229,192,0.5); }
.sb-dot.partial { background:var(--orange); box-shadow:0 0 5px rgba(255,159,67,0.5); }
.sb-dot.empty   { background:var(--border); }
.sb-divider { height:1px; background:var(--border); margin:6px 4px; }
/* CONTENT */
.npi-content {
  flex:1; overflow-y:auto; padding:18px 22px 30px;
  display:flex; flex-direction:column; gap:18px;
}
.page-header { display:flex; align-items:center; gap:10px; }
.page-header-icon { font-size:20px; }
.page-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:600; color:var(--txt); }
.page-subtitle { font-size:12px; color:var(--txt3); margin-top:1px; }
.section-box { background:var(--bg-panel); border:1px solid var(--border); border-radius:var(--rl); padding:16px 18px; }
.sec-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.sec-icon { font-size:16px; }
.sec-title { font-size:14px; font-weight:600; color:var(--txt); }
.smart-parse { background:rgba(0,229,192,0.04); border:1px solid rgba(0,229,192,0.2); border-radius:var(--rl); padding:14px 16px; }
.smart-parse-title { font-size:13px; font-weight:600; color:var(--teal); margin-bottom:3px; }
.smart-parse-desc { font-size:11px; color:var(--txt3); margin-bottom:10px; }
.smart-parse-area {
  background:var(--bg-up); border:1px solid var(--border); border-radius:var(--r);
  padding:10px 12px; color:var(--txt); font-family:'DM Sans',sans-serif; font-size:13px;
  outline:none; resize:vertical; min-height:60px; width:100%; transition:border-color .15s; line-height:1.5;
}
.smart-parse-area:focus { border-color:var(--teal); }
.smart-parse-area::placeholder { color:var(--txt4); }
.btn-extract {
  margin-top:10px;
  background:rgba(0,229,192,0.12); color:var(--teal); border:1px solid rgba(0,229,192,0.3);
  border-radius:6px; padding:6px 16px; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s;
}
.btn-extract:hover { background:rgba(0,229,192,0.2); }
.npi-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.npi-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.npi-grid-5 { display:grid; grid-template-columns:1fr 0.6fr 0.8fr 1fr 1fr; gap:12px; }
.npi-field { display:flex; flex-direction:column; gap:3px; }
.npi-field-label { font-size:9px; color:var(--txt3); text-transform:uppercase; letter-spacing:.06em; font-weight:500; }
.npi-field-label .opt { color:var(--txt4); font-weight:400; text-transform:none; }
.npi-field-input {
  background:var(--bg-up); border:1px solid var(--border); border-radius:6px;
  padding:7px 10px; color:var(--txt); font-family:'DM Sans',sans-serif; font-size:13px;
  outline:none; transition:border-color .15s; width:100%;
}
.npi-field-input:focus { border-color:var(--blue); }
.npi-field-input::placeholder { color:var(--txt4); }
.npi-field-input.mono { font-family:'JetBrains Mono',monospace; font-size:12px; }
.npi-field-select {
  background:var(--bg-up); border:1px solid var(--border); border-radius:6px;
  padding:7px 10px; color:var(--txt); font-family:'DM Sans',sans-serif; font-size:13px;
  outline:none; cursor:pointer; width:100%;
}
.npi-field-select:focus { border-color:var(--blue); }
/* AI PANEL */
.npi-ai-panel {
  width:var(--ai-w); flex-shrink:0;
  background:var(--bg-panel); border-left:1px solid var(--border);
  display:flex; flex-direction:column; overflow:hidden;
}
.ai-header { padding:10px 12px; border-bottom:1px solid var(--border); flex-shrink:0; }
.ai-header-top { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
.ai-dot { width:7px; height:7px; border-radius:50%; background:var(--teal); flex-shrink:0; animation:ai-pulse 2s ease-in-out infinite; }
.ai-label { font-size:11px; font-weight:600; color:var(--txt2); }
.ai-model { margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:9px; background:var(--bg-up); border:1px solid var(--border); border-radius:20px; padding:1px 6px; color:var(--txt3); }
.ai-quick-btns { display:flex; flex-wrap:wrap; gap:3px; }
.ai-qbtn { padding:2px 8px; border-radius:20px; font-size:10px; cursor:pointer; transition:all .15s; background:var(--bg-up); border:1px solid var(--border); color:var(--txt2); }
.ai-qbtn:hover { border-color:var(--teal); color:var(--teal); background:rgba(0,229,192,0.06); }
.ai-msgs { flex:1; overflow-y:auto; padding:8px 10px; display:flex; flex-direction:column; gap:6px; }
.ai-msg { padding:8px 10px; border-radius:var(--r); font-size:11px; line-height:1.5; }
.ai-msg.sys  { background:var(--bg-up); color:var(--txt3); font-style:italic; border:1px solid var(--border); }
.ai-msg.user { background:rgba(59,158,255,0.12); border:1px solid rgba(59,158,255,0.25); color:var(--txt); }
.ai-msg.bot  { background:rgba(0,229,192,0.07); border:1px solid rgba(0,229,192,0.18); color:var(--txt); }
.ai-input-wrap { padding:8px 10px; border-top:1px solid var(--border); flex-shrink:0; display:flex; gap:5px; }
.ai-input { flex:1; background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:6px 8px; color:var(--txt); font-size:11px; outline:none; resize:none; font-family:'DM Sans',sans-serif; }
.ai-input:focus { border-color:var(--teal); }
.ai-send { background:var(--teal); color:var(--bg); border:none; border-radius:6px; padding:6px 10px; font-size:12px; cursor:pointer; flex-shrink:0; font-weight:700; transition:filter .15s; }
.ai-send:hover { filter:brightness(1.15); }
/* BOTTOM BAR */
.npi-bottom-bar {
  position:fixed; bottom:0; left:calc(72px + var(--icon-sb)); right:0;
  height:var(--bot-h);
  background:var(--bg-panel); border-top:1px solid var(--border);
  display:flex; align-items:center; padding:0 16px; z-index:100;
}
.stepper-left { display:flex; align-items:center; gap:6px; }
.stepper-right { margin-left:auto; display:flex; align-items:center; gap:6px; }
.stepper-dots { display:flex; align-items:center; gap:4px; margin:0 auto; }
.stepper-dot {
  width:8px; height:8px; border-radius:50%; transition:all .2s; cursor:pointer; flex-shrink:0;
}
.stepper-dot.done    { background:var(--teal);   box-shadow:0 0 4px rgba(0,229,192,0.4); }
.stepper-dot.current { background:var(--blue);   box-shadow:0 0 6px rgba(59,158,255,0.5); width:10px; height:10px; }
.stepper-dot.partial { background:var(--orange); }
.stepper-dot.empty   { background:var(--txt4); }
.stepper-section-label { font-size:11px; color:var(--txt3); margin:0 8px; }
.stepper-current-label { font-size:12px; color:var(--txt); font-weight:500; }
.btn-next { background:var(--teal); color:var(--bg); border:none; border-radius:6px; padding:6px 16px; font-size:12px; font-weight:700; cursor:pointer; transition:filter .15s; }
.btn-next:hover { filter:brightness(1.15); }
.npi-demo ::-webkit-scrollbar { width:5px; }
.npi-demo ::-webkit-scrollbar-track { background:transparent; }
.npi-demo ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
.npi-demo ::-webkit-scrollbar-thumb:hover { background:var(--border-hi); }
@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.ai-loader { display:flex; gap:5px; padding:10px 12px; align-items:center; }
.ai-loader span { width:6px; height:6px; border-radius:50%; background:var(--teal); animation:bounce 1.2s ease-in-out infinite; }
.ai-loader span:nth-child(2){animation-delay:.2s}
.ai-loader span:nth-child(3){animation-delay:.4s}
`;

const SIDEBAR_GROUPS = [
  { label: 'Intake', items: [
    { id:'chart',      icon:'📊', label:'Patient Chart',      dot:'done' },
    { id:'demo',       icon:'👤', label:'Demographics',       dot:'partial' },
    { id:'cc',         icon:'💬', label:'Chief Complaint',    dot:'done' },
    { id:'vitals',     icon:'📈', label:'Vitals',             dot:'done' },
  ]},
  { label: 'Documentation', items: [
    { id:'meds',       icon:'💊', label:'Meds & PMH',         dot:'partial' },
    { id:'ros',        icon:'🔍', label:'Review of Systems',  dot:'empty' },
    { id:'exam',       icon:'🩺', label:'Physical Exam',      dot:'empty' },
    { id:'mdm',        icon:'⚖️', label:'MDM',                dot:'empty' },
  ]},
  { label: 'Disposition', items: [
    { id:'orders',     icon:'📋', label:'Orders',             dot:'empty' },
    { id:'discharge',  icon:'🚪', label:'Discharge',          dot:'empty' },
    { id:'erplan',     icon:'🗺️', label:'ER Plan Builder',    dot:'empty' },
  ]},
  { label: 'Tools', items: [
    { id:'autocoder',  icon:'🤖', label:'AutoCoder',          dot:'empty' },
    { id:'erx',        icon:'💉', label:'eRx',                dot:'empty' },
    { id:'procedures', icon:'✂️', label:'Procedures',         dot:'empty' },
  ]},
];

const ALL_ITEMS = SIDEBAR_GROUPS.flatMap(g => g.items);

const STEPPER_DOTS = [
  { status:'done',    label:'Patient Chart' },
  { status:'current', label:'Demographics' },
  { status:'partial', label:'Chief Complaint' },
  { status:'done',    label:'Vitals' },
  { status:'partial', label:'Meds & PMH' },
  { status:'empty',   label:'ROS' },
  { status:'empty',   label:'Physical Exam' },
  { status:'empty',   label:'MDM' },
  { status:'empty',   label:'Orders' },
  { status:'empty',   label:'Discharge' },
  { status:'empty',   label:'ER Plan' },
  { status:'empty',   label:'AutoCoder' },
  { status:'empty',   label:'eRx' },
  { status:'empty',   label:'Procedures' },
];

export default function NPIDemo() {
  const [clock, setClock] = useState('');
  const [activeSection, setActiveSection] = useState('demo');
  const [logoAbbr, setLogoAbbr] = useState('Dm');
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'Assistant ready. Select a quick action or ask a clinical question.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const handleSectionClick = (item) => {
    setActiveSection(item.id);
    // animate logo abbr
    const abbr = item.label.slice(0,2);
    setLogoAbbr(abbr);
  };

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: question }]);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical assistant in an emergency medicine documentation platform. Be concise and clinically precise.\n\n${question}`,
      });
      setAiMessages(prev => [...prev, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'sys', text: '⚠ Connection error.' }]);
    }
    setAiLoading(false);
  };

  return (
    <div className="npi-demo">
      <style>{CSS}</style>

      {/* ICON SIDEBAR */}
      <aside className="npi-icon-sb">
        <div className="isb-logo">
          <div className="isb-logo-box">{logoAbbr}</div>
        </div>
        <div className="isb-scroll">
          {[['🏠','Home'],['📊','Dash'],['👥','Patients'],['🔄','Shift']].map(([icon,lbl]) => (
            <div key={lbl} className={`isb-btn${lbl==='Patients'?' active':''}`} title={lbl}>
              <span>{icon}</span><span className="isb-lbl">{lbl}</span>
            </div>
          ))}
          <div className="isb-sep" />
          {[['💊','Drugs'],['🧮','Calc']].map(([icon,lbl]) => (
            <div key={lbl} className="isb-btn" title={lbl}>
              <span>{icon}</span><span className="isb-lbl">{lbl}</span>
            </div>
          ))}
        </div>
        <div className="isb-bottom">
          <div className="isb-btn" title="Settings"><span>⚙️</span><span className="isb-lbl">Settings</span></div>
        </div>
      </aside>

      {/* TOP BAR */}
      <header className="npi-top-bar">
        <div className="top-row-1">
          <span className="nav-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span>
          <div className="nav-sep" />
          {[['8','Active',false],['14','Pending',true],['3','Orders',false],['11.6','Hours',false]].map(([v,l,alert]) => (
            <div key={l} className="nav-stat">
              <span className={`nav-stat-val${alert?' alert':''}`}>{v}</span>
              <span className="nav-stat-lbl">{l}</span>
            </div>
          ))}
          <div className="nav-right">
            <div className="nav-time">{clock}</div>
            <div className="nav-ai-on"><div className="nav-ai-dot" /> AI ON</div>
            <button className="nav-new-pt">+ New Patient</button>
          </div>
        </div>
        <div className="top-row-2">
          <span className="chart-badge">PT-4-471-8820</span>
          <span className="pt-name">New Patient</span>
          <span className="pt-meta">67 y/o · Male · 03/14/1957</span>
          <span className="pt-cc">CC: Chest Pain</span>
          <div className="vb-div" />
          {[['BP','158/94',true],['HR','108',true],['RR','18',false],['SpO₂','93',false],['T','37.1°C',false],['GCS','15',false]].map(([l,v,abn]) => (
            <div key={l} className="vb-vital">
              <span className="lbl">{l}</span>
              <span className={`val${abn?' abn':''}`}>{v}</span>
            </div>
          ))}
          <div className="vb-div" />
          <span className="status-badge status-monitoring">MONITORING</span>
          <span className="status-badge status-room">Room 4B</span>
          <div className="chart-actions">
            <button className="btn-ghost">📋 Orders</button>
            <button className="btn-ghost">📝 SOAP Note</button>
            <button className="btn-coral">🚪 Discharge</button>
            <button className="btn-primary">💾 Save Chart</button>
          </div>
        </div>
      </header>

      {/* MAIN WRAP */}
      <div className="npi-main-wrap">

        {/* LEFT SIDEBAR */}
        <aside className="npi-sidebar">
          {SIDEBAR_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="sb-divider" />}
              <div className="sb-group-label">{group.label}</div>
              {group.items.map(item => (
                <div
                  key={item.id}
                  className={`sb-nav-btn${activeSection === item.id ? ' active' : ''}`}
                  onClick={() => handleSectionClick(item)}
                >
                  <span className="sb-icon">{item.icon}</span>
                  {item.label}
                  <span className={`sb-dot ${item.dot}`} />
                </div>
              ))}
            </div>
          ))}
        </aside>

        {/* CONTENT */}
        <main className="npi-content">
          <div className="page-header">
            <span className="page-header-icon">👤</span>
            <div>
              <div className="page-title">Patient Demographics</div>
              <div className="page-subtitle">All fields optional — enter what is available</div>
            </div>
          </div>

          {/* Smart Parse */}
          <div className="smart-parse">
            <div className="smart-parse-title">✨ Smart Parse — powered by AI</div>
            <div className="smart-parse-desc">Paste a referral note or type freeform — AI will extract patient data automatically</div>
            <textarea className="smart-parse-area" placeholder='e.g. "62yo male presenting with chest pain 2h, PMHx: HTN, T2DM. Meds: metoprolol 50mg. BP 158/94, HR 92"' />
            <button className="btn-extract">⚡ Auto-Extract Patient Data</button>
          </div>

          {/* Identity */}
          <div className="section-box">
            <div className="sec-header">
              <span className="sec-icon">🪪</span>
              <div><div className="sec-title">Identity</div></div>
            </div>
            <div className="npi-grid-3" style={{ marginBottom: 12 }}>
              {[['First Name','Given name'],['Last Name','Family name'],['Preferred Name','Goes by…']].map(([lbl,ph]) => (
                <div key={lbl} className="npi-field">
                  <label className="npi-field-label">{lbl} <span className="opt">(optional)</span></label>
                  <input type="text" className="npi-field-input" placeholder={ph} />
                </div>
              ))}
            </div>
            <div className="npi-grid-5">
              <div className="npi-field">
                <label className="npi-field-label">Date of Birth</label>
                <input type="date" className="npi-field-input mono" />
              </div>
              <div className="npi-field">
                <label className="npi-field-label">Age</label>
                <input type="text" className="npi-field-input mono" placeholder="yrs" readOnly style={{ color:'var(--txt3)' }} />
              </div>
              <div className="npi-field">
                <label className="npi-field-label">Sex</label>
                <select className="npi-field-select">
                  <option value="">— Select —</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="npi-field">
                <label className="npi-field-label">MRN / Patient ID</label>
                <input type="text" className="npi-field-input mono" placeholder="00-000-000" />
              </div>
              <div className="npi-field">
                <label className="npi-field-label">Insurance / Payer</label>
                <input type="text" className="npi-field-input" placeholder="e.g. Medicare" />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="section-box">
            <div className="sec-header">
              <span className="sec-icon">🏥</span>
              <div><div className="sec-title">Insurance</div></div>
            </div>
            <div className="npi-grid-3">
              {[['Insurance ID / Member ID','Policy number'],['Group Number','Group #'],['Authorization','Auth #']].map(([lbl,ph]) => (
                <div key={lbl} className="npi-field">
                  <label className="npi-field-label">{lbl} <span className="opt">(optional)</span></label>
                  <input type="text" className="npi-field-input mono" placeholder={ph} />
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="section-box">
            <div className="sec-header">
              <span className="sec-icon">📞</span>
              <div><div className="sec-title">Contact Information</div></div>
            </div>
            <div className="npi-grid-3">
              <div className="npi-field">
                <label className="npi-field-label">Phone</label>
                <input type="tel" className="npi-field-input mono" placeholder="+1 (000) 000-0000" />
              </div>
              <div className="npi-field">
                <label className="npi-field-label">Email</label>
                <input type="email" className="npi-field-input" placeholder="patient@email.com" />
              </div>
              <div className="npi-field">
                <label className="npi-field-label">Emergency Contact</label>
                <input type="text" className="npi-field-input" placeholder="Name & relationship" />
              </div>
            </div>
          </div>
        </main>

        {/* AI PANEL */}
        <aside className="npi-ai-panel">
          <div className="ai-header">
            <div className="ai-header-top">
              <div className="ai-dot" />
              <span className="ai-label">Notrya AI</span>
              <span className="ai-model">claude-sonnet-4</span>
            </div>
            <div className="ai-quick-btns">
              {[['📋 Summarise','Summarise what I have entered so far.'],['🔍 Check','Check my entries for completeness.'],['📝 Draft','Draft a note from the data entered.']].map(([lbl,q]) => (
                <button key={lbl} className="ai-qbtn" onClick={() => sendAI(q)}>{lbl}</button>
              ))}
            </div>
          </div>
          <div className="ai-msgs" ref={chatRef}>
            {aiMessages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>
            ))}
            {aiLoading && (
              <div className="ai-loader">
                <span /><span /><span />
              </div>
            )}
          </div>
          <div className="ai-input-wrap">
            <textarea
              className="ai-input" rows={2} placeholder="Ask anything…"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
            />
            <button className="ai-send" onClick={() => sendAI()}>↑</button>
          </div>
        </aside>
      </div>

      {/* BOTTOM BAR */}
      <footer className="npi-bottom-bar">
        <div className="stepper-left">
          <button className="btn-ghost">← Back</button>
          <span className="stepper-section-label">Patient Chart</span>
        </div>
        <div className="stepper-dots">
          {STEPPER_DOTS.map((d, i) => (
            <div key={i} className={`stepper-dot ${d.status}`} title={d.label} />
          ))}
        </div>
        <div className="stepper-right">
          <span className="stepper-current-label">Demographics</span>
          <button className="btn-next">Next →</button>
        </div>
      </footer>
    </div>
  );
}