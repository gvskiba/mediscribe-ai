import React, { useState, useEffect, useRef } from "react";

const CSS = `
:root {
  --bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;
  --border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;
  --teal:#00e5c0;--gold:#f5c842;--coral:#ff6b6b;--orange:#ff9f43;
  --txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;
  --r:8px;--rl:12px;
  --icon-sb:56px;--top-h:88px;--bot-h:50px;--sb-w:170px;--ai-w:280px;
}
.bt *,
.bt *::before,
.bt *::after { box-sizing:border-box; margin:0; padding:0; }
.bt {
  position:fixed; inset:0; margin-left:72px;
  background:var(--bg); color:var(--txt);
  font-family:'DM Sans',sans-serif; font-size:14px; overflow:hidden;
  display:flex; flex-direction:column;
}

/* TOP BAR */
.bt-top { flex-shrink:0; background:var(--bg-panel); border-bottom:1px solid var(--border); display:flex; flex-direction:column; }
.bt-row1 {
  height:44px; display:flex; align-items:center; padding:0 14px; gap:8px;
  border-bottom:1px solid rgba(26,53,85,0.5);
}
.bt-row2 { height:44px; display:flex; align-items:center; padding:0 14px; gap:8px; overflow:hidden; }
.bt-welcome { font-size:12px; color:var(--txt2); font-weight:500; white-space:nowrap; }
.bt-welcome strong { color:var(--txt); }
.bt-vsep { width:1px; height:20px; background:var(--border); flex-shrink:0; }
.bt-stat {
  display:flex; align-items:center; gap:5px;
  background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:3px 10px;
}
.bt-stat-v { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:var(--txt); }
.bt-stat-v.alert { color:var(--gold); }
.bt-stat-l { font-size:9px; color:var(--txt3); text-transform:uppercase; letter-spacing:.04em; }
.bt-r1-right { margin-left:auto; display:flex; align-items:center; gap:6px; }
.bt-clock { background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:3px 10px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt2); }
.bt-aion { display:flex; align-items:center; gap:4px; background:rgba(0,229,192,0.08); border:1px solid rgba(0,229,192,0.3); border-radius:6px; padding:3px 10px; font-size:11px; font-weight:600; color:var(--teal); }
.bt-aion-dot { width:6px; height:6px; border-radius:50%; background:var(--teal); animation:aipulse 2s ease-in-out infinite; }
@keyframes aipulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,0.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.bt-newpt { background:var(--teal); color:var(--bg); border:none; border-radius:6px; padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; }
.bt-newpt:hover { filter:brightness(1.15); }
/* Row 2 */
.bt-chart-badge { font-family:'JetBrains Mono',monospace; font-size:10px; background:var(--bg-up); border:1px solid var(--border); border-radius:20px; padding:1px 8px; color:var(--teal); white-space:nowrap; }
.bt-pt-name { font-family:'Playfair Display',serif; font-size:14px; font-weight:600; color:var(--txt); white-space:nowrap; }
.bt-pt-meta { font-size:11px; color:var(--txt3); white-space:nowrap; }
.bt-vb-div { width:1px; height:18px; background:var(--border); flex-shrink:0; }
.bt-vital { display:flex; align-items:center; gap:3px; font-family:'JetBrains Mono',monospace; font-size:10.5px; white-space:nowrap; }
.bt-vital .lbl { color:var(--txt4); font-size:9px; }
.bt-vital .val { color:var(--txt3); }
.bt-stable { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; padding:2px 10px; border-radius:4px; background:rgba(0,229,192,0.1); color:var(--teal); border:1px solid rgba(0,229,192,0.3); white-space:nowrap; }
.bt-room { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; padding:2px 8px; border-radius:4px; background:var(--bg-up); color:var(--txt2); border:1px solid var(--border); cursor:pointer; }
.bt-chart-actions { margin-left:auto; display:flex; align-items:center; gap:5px; flex-shrink:0; }
.btn-ghost { background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:4px 10px; font-size:11px; color:var(--txt2); cursor:pointer; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; transition:all .15s; }
.btn-ghost:hover { border-color:var(--border-hi); color:var(--txt); }
.btn-teal { background:var(--teal); color:var(--bg); border:none; border-radius:6px; padding:4px 12px; font-size:11px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
.btn-teal:hover { filter:brightness(1.15); }
.btn-coral { background:rgba(255,107,107,0.15); color:var(--coral); border:1px solid rgba(255,107,107,0.3); border-radius:6px; padding:4px 12px; font-size:11px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
.btn-coral:hover { background:rgba(255,107,107,0.25); }

/* BODY */
.bt-body { flex:1; display:flex; overflow:hidden; }

/* LEFT SIDEBAR */
.bt-sidebar { width:var(--sb-w); flex-shrink:0; background:var(--bg-panel); border-right:1px solid var(--border); overflow-y:auto; padding:10px 8px; display:flex; flex-direction:column; gap:1px; }
.bt-sb-group { font-size:9px; color:var(--txt4); text-transform:uppercase; letter-spacing:.08em; padding:10px 8px 4px; font-weight:600; }
.bt-sb-group:first-child { padding-top:4px; }
.bt-sb-item { display:flex; align-items:center; gap:7px; padding:6px 8px; border-radius:6px; cursor:pointer; transition:all .15s; border:1px solid transparent; font-size:12px; color:var(--txt2); user-select:none; }
.bt-sb-item:hover { background:var(--bg-up); border-color:var(--border); color:var(--txt); }
.bt-sb-item.active { background:rgba(59,158,255,0.1); border-color:rgba(59,158,255,0.3); color:var(--blue); }
.bt-sb-icon { font-size:13px; width:18px; text-align:center; flex-shrink:0; }
.bt-dot { width:6px; height:6px; border-radius:50%; margin-left:auto; flex-shrink:0; background:var(--border); }
.bt-dot.done    { background:var(--teal);   box-shadow:0 0 5px rgba(0,229,192,0.5); }
.bt-dot.partial { background:var(--orange); box-shadow:0 0 5px rgba(255,159,67,0.5); }
.bt-dot.empty   { background:var(--border); }
.bt-sb-div { height:1px; background:var(--border); margin:6px 4px; }

/* CONTENT */
.bt-content { flex:1; overflow-y:auto; padding:18px 22px 30px; display:flex; flex-direction:column; gap:16px; }
.bt-page-header { display:flex; align-items:flex-start; justify-content:space-between; }
.bt-page-header-left { display:flex; align-items:center; gap:10px; }
.bt-page-icon { font-size:20px; }
.bt-page-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:600; color:var(--txt); }
.bt-page-sub { font-size:12px; color:var(--txt3); margin-top:2px; }
.btn-add { background:rgba(59,158,255,0.1); border:1px solid rgba(59,158,255,0.3); color:var(--blue); border-radius:6px; padding:5px 12px; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px; }
.btn-add:hover { background:rgba(59,158,255,0.18); }

/* Section Card */
.bt-section { background:var(--bg-panel); border:1px solid var(--border); border-radius:var(--rl); padding:16px 18px; display:flex; flex-direction:column; gap:14px; }
.bt-section-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.bt-section-header-left { display:flex; align-items:center; gap:10px; }
.bt-section-icon { font-size:16px; }
.bt-section-title { font-size:14px; font-weight:600; color:var(--txt); }
.bt-section-sub { font-size:11px; color:var(--txt3); margin-top:2px; }
.btn-action { background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:4px 12px; font-size:11px; color:var(--txt2); cursor:pointer; white-space:nowrap; }
.btn-action:hover { border-color:var(--border-hi); color:var(--txt); }
.btn-ready { background:rgba(0,229,192,0.1); border:1px solid rgba(0,229,192,0.3); color:var(--teal); border-radius:20px; padding:3px 12px; font-size:11px; font-weight:600; cursor:pointer; }

/* Form grid */
.bt-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.bt-field { display:flex; flex-direction:column; gap:4px; }
.bt-field-label { font-size:9px; color:var(--txt3); text-transform:uppercase; letter-spacing:.06em; font-weight:500; }
.bt-field-input { background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:8px 10px; color:var(--txt); font-family:'DM Sans',sans-serif; font-size:13px; outline:none; width:100%; transition:border-color .15s; }
.bt-field-input:focus { border-color:var(--blue); }
.bt-field-input::placeholder { color:var(--txt4); }
.bt-field-select { background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:8px 10px; color:var(--txt); font-family:'DM Sans',sans-serif; font-size:13px; outline:none; width:100%; cursor:pointer; }
.bt-field-select:focus { border-color:var(--blue); }
.bt-field-textarea { background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:10px 12px; color:var(--txt); font-family:'DM Sans',sans-serif; font-size:13px; outline:none; resize:vertical; min-height:80px; width:100%; transition:border-color .15s; line-height:1.5; }
.bt-field-textarea:focus { border-color:var(--blue); }
.bt-field-textarea::placeholder { color:var(--txt4); }
.bt-full { grid-column:1/-1; }

/* Chips */
.bt-chips { display:flex; flex-wrap:wrap; gap:6px; }
.bt-chip { background:var(--bg-up); border:1px solid var(--border); border-radius:20px; padding:4px 12px; font-size:12px; color:var(--txt2); cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:5px; }
.bt-chip:hover { border-color:var(--border-hi); color:var(--txt); }
.bt-chip.selected { background:rgba(0,229,192,0.1); border-color:rgba(0,229,192,0.4); color:var(--teal); }
.bt-chip .check { font-size:10px; }

/* Placeholder box */
.bt-placeholder { background:var(--bg-up); border:1px solid var(--border); border-radius:var(--r); padding:16px 18px; font-size:12px; color:var(--txt3); font-style:italic; }

/* AI PANEL */
.bt-ai { width:var(--ai-w); flex-shrink:0; background:var(--bg-panel); border-left:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
.bt-ai-hdr { padding:10px 12px; border-bottom:1px solid var(--border); flex-shrink:0; }
.bt-ai-hdr-top { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
.bt-ai-dot { width:7px; height:7px; border-radius:50%; background:var(--teal); flex-shrink:0; animation:aipulse 2s ease-in-out infinite; }
.bt-ai-label { font-size:11px; font-weight:600; color:var(--txt2); }
.bt-ai-model { margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:9px; background:var(--bg-up); border:1px solid var(--border); border-radius:20px; padding:1px 6px; color:var(--txt3); }
.bt-ai-qbtns { display:flex; flex-wrap:wrap; gap:3px; }
.bt-ai-qbtn { padding:2px 8px; border-radius:20px; font-size:10px; cursor:pointer; background:var(--bg-up); border:1px solid var(--border); color:var(--txt2); transition:all .15s; }
.bt-ai-qbtn:hover { border-color:var(--teal); color:var(--teal); }
.bt-ai-msgs { flex:1; overflow-y:auto; padding:8px 10px; display:flex; flex-direction:column; gap:6px; }
.bt-ai-msg { padding:8px 10px; border-radius:var(--r); font-size:11px; line-height:1.5; }
.bt-ai-msg.sys  { background:var(--bg-up); color:var(--txt3); font-style:italic; border:1px solid var(--border); }
.bt-ai-msg.user { background:rgba(59,158,255,0.12); border:1px solid rgba(59,158,255,0.25); color:var(--txt); }
.bt-ai-msg.bot  { background:rgba(0,229,192,0.07); border:1px solid rgba(0,229,192,0.18); color:var(--txt); }
.bt-ai-input-wrap { padding:8px 10px; border-top:1px solid var(--border); flex-shrink:0; display:flex; gap:5px; }
.bt-ai-input { flex:1; background:var(--bg-up); border:1px solid var(--border); border-radius:6px; padding:6px 8px; color:var(--txt); font-size:11px; outline:none; resize:none; font-family:'DM Sans',sans-serif; }
.bt-ai-input:focus { border-color:var(--teal); }
.bt-ai-send { background:var(--teal); color:var(--bg); border:none; border-radius:6px; padding:6px 10px; font-size:14px; cursor:pointer; flex-shrink:0; font-weight:700; }
.bt-ai-send:hover { filter:brightness(1.15); }

/* BOTTOM BAR */
.bt-bottom { flex-shrink:0; height:var(--bot-h); background:var(--bg-panel); border-top:1px solid var(--border); display:flex; align-items:center; padding:0 16px; z-index:100; gap:8px; }
.bt-stepper-dots { display:flex; align-items:center; gap:4px; margin:0 auto; }
.bt-step-dot { width:8px; height:8px; border-radius:50%; cursor:pointer; flex-shrink:0; transition:all .2s; }
.bt-step-dot.done    { background:var(--teal);   box-shadow:0 0 4px rgba(0,229,192,0.4); }
.bt-step-dot.current { background:var(--blue);   box-shadow:0 0 6px rgba(59,158,255,0.5); width:10px; height:10px; }
.bt-step-dot.partial { background:var(--orange); }
.bt-step-dot.empty   { background:var(--txt4); }
.bt-step-lbl { font-size:11px; color:var(--txt3); }
.bt-cur-lbl  { font-size:12px; color:var(--txt); font-weight:500; }
.bt ::-webkit-scrollbar { width:5px; }
.bt ::-webkit-scrollbar-track { background:transparent; }
.bt ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.bt-loader { display:flex; gap:5px; padding:10px 12px; align-items:center; }
.bt-loader span { width:6px; height:6px; border-radius:50%; background:var(--teal); animation:bounce 1.2s ease-in-out infinite; }
.bt-loader span:nth-child(2){animation-delay:.2s}
.bt-loader span:nth-child(3){animation-delay:.4s}
`;

const SIDEBAR = [
  { group: 'Intake', items: [
    { id:'chart',  icon:'📊', label:'Patient Chart',     dot:'done' },
    { id:'demo',   icon:'👤', label:'Demographics',      dot:'partial' },
    { id:'cc',     icon:'💬', label:'Chief Complaint',   dot:'empty' },
    { id:'vitals', icon:'📈', label:'Vitals',            dot:'empty' },
  ]},
  { group: 'Documentation', items: [
    { id:'meds', icon:'💊', label:'Meds & PMH',          dot:'partial' },
    { id:'ros',  icon:'🔍', label:'Review of Systems',   dot:'empty' },
    { id:'pe',   icon:'🩺', label:'Physical Exam',       dot:'empty' },
    { id:'mdm',  icon:'⚖️', label:'MDM',                 dot:'empty' },
  ]},
  { group: 'Disposition', items: [
    { id:'orders',    icon:'📋', label:'Orders',         dot:'empty' },
    { id:'discharge', icon:'🚪', label:'Discharge',      dot:'empty' },
    { id:'erplan',    icon:'🗺️', label:'ER Plan Builder', dot:'empty' },
  ]},
  { group: 'Tools', items: [
    { id:'autocoder',  icon:'🤖', label:'AutoCoder',     dot:'empty' },
    { id:'erx',        icon:'💉', label:'eRx',           dot:'empty' },
    { id:'procedures', icon:'✂️', label:'Procedures',    dot:'empty' },
  ]},
];

const ALL_ITEMS = SIDEBAR.flatMap(g => g.items);
const STEPS = ALL_ITEMS.map((item, i) => ({ label: item.label, status: i === 0 ? 'done' : i === 1 ? 'current' : i === 4 ? 'partial' : 'empty' }));

const CHIPS = ['Chip One', 'Chip Two', 'Chip Three'];

export default function BaseTemplate() {
  const [clock, setClock] = useState('');
  const [active, setActive] = useState('demo');
  const [selectedChips, setSelectedChips] = useState(['Chip One']);
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

  const toggleChip = (c) => setSelectedChips(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: question }]);
    setAiLoading(true);
    // Placeholder response for template
    await new Promise(r => setTimeout(r, 800));
    setAiMessages(prev => [...prev, { role: 'bot', text: 'This is a template page. Replace this AI handler with your actual integration.' }]);
    setAiLoading(false);
  };

  const currentIdx = ALL_ITEMS.findIndex(i => i.id === active);
  const currentLabel = ALL_ITEMS[currentIdx]?.label || '';
  const prevLabel = currentIdx > 0 ? ALL_ITEMS[currentIdx - 1]?.label : '';
  const navNext = () => { if (currentIdx < ALL_ITEMS.length - 1) setActive(ALL_ITEMS[currentIdx + 1].id); };
  const navBack = () => { if (currentIdx > 0) setActive(ALL_ITEMS[currentIdx - 1].id); };

  return (
    <div className="bt">
      <style>{CSS}</style>

      {/* TOP BAR */}
      <div className="bt-top">
        <div className="bt-row1">
          <span className="bt-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span>
          <div className="bt-vsep" />
          {[['0','Active',false],['14','Pending',true],['— Orders',false],['11.6','Hours',false]].map(([v,l,alert], i) =>
            typeof l === 'boolean' ? null : (
              <div key={i} className="bt-stat">
                <span className={`bt-stat-v${alert?' alert':''}`}>{v}</span>
                <span className="bt-stat-l">{l}</span>
              </div>
            )
          )}
          {/* Orders badge */}
          <div className="bt-stat"><span className="bt-stat-v">—</span><span className="bt-stat-l">Orders</span></div>
          <div className="bt-r1-right">
            <div className="bt-clock">{clock}</div>
            <div className="bt-aion"><div className="bt-aion-dot" /> AI ON</div>
            <button className="bt-newpt">+ New Patient</button>
          </div>
        </div>
        <div className="bt-row2">
          <span className="bt-chart-badge">[CHART-ID]</span>
          <span className="bt-pt-name">— Patient —</span>
          <span className="bt-pt-meta">Age · Sex · DOB</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, color:'var(--txt3)' }}>CC:</span>
          <div className="bt-vb-div" />
          {['BP','HR','RR','SpO₂','GCS'].map(l => (
            <div key={l} className="bt-vital">
              <span className="lbl">{l}</span>
              <span className="val">—</span>
            </div>
          ))}
          <div className="bt-vb-div" />
          <span className="bt-stable">STABLE</span>
          <span className="bt-room">Room ▾</span>
          <div className="bt-chart-actions">
            <button className="btn-ghost">📋 Orders</button>
            <button className="btn-ghost">📝 SOAP Note</button>
            <button className="btn-coral">🚪 Discharge</button>
            <button className="btn-teal">💾 Save Chart</button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="bt-body">

        {/* LEFT SIDEBAR */}
        <aside className="bt-sidebar">
          {SIDEBAR.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="bt-sb-div" />}
              <div className="bt-sb-group">{group.group}</div>
              {group.items.map(item => (
                <div key={item.id} className={`bt-sb-item${active === item.id ? ' active' : ''}`} onClick={() => setActive(item.id)}>
                  <span className="bt-sb-icon">{item.icon}</span>
                  {item.label}
                  <span className={`bt-dot ${item.dot}`} />
                </div>
              ))}
            </div>
          ))}
        </aside>

        {/* CONTENT */}
        <main className="bt-content">

          {/* Page Header */}
          <div className="bt-page-header">
            <div className="bt-page-header-left">
              <span className="bt-page-icon">📄</span>
              <div>
                <div className="bt-page-title">[Page Title]</div>
                <div className="bt-page-sub">Brief description of what this page does</div>
              </div>
            </div>
            <button className="btn-add">+ Add Item</button>
          </div>

          {/* Section 1 — Form example */}
          <div className="bt-section">
            <div className="bt-section-header">
              <div className="bt-section-header-left">
                <span className="bt-section-icon">📋</span>
                <div>
                  <div className="bt-section-title">Section Title</div>
                  <div className="bt-section-sub">Brief description of what this section does</div>
                </div>
              </div>
              <button className="btn-action">Action</button>
            </div>

            <div className="bt-form-grid">
              <div className="bt-field">
                <label className="bt-field-label">Field Label</label>
                <input type="text" className="bt-field-input" placeholder="Enter value…" />
              </div>
              <div className="bt-field">
                <label className="bt-field-label">Another Field</label>
                <select className="bt-field-select">
                  <option value="">— Select —</option>
                  <option>Option A</option>
                  <option>Option B</option>
                  <option>Option C</option>
                </select>
              </div>
              <div className="bt-field bt-full">
                <label className="bt-field-label">Notes</label>
                <textarea className="bt-field-textarea" placeholder="Enter notes…" />
              </div>
            </div>

            <div className="bt-chips">
              {CHIPS.map(c => (
                <div key={c} className={`bt-chip${selectedChips.includes(c) ? ' selected' : ''}`} onClick={() => toggleChip(c)}>
                  {selectedChips.includes(c) && <span className="check">✓</span>}
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 — Placeholder content */}
          <div className="bt-section">
            <div className="bt-section-header">
              <div className="bt-section-header-left">
                <span className="bt-section-icon">🗂️</span>
                <div>
                  <div className="bt-section-title">Another Section</div>
                  <div className="bt-section-sub">Add your content here</div>
                </div>
              </div>
              <button className="btn-ready">READY</button>
            </div>
            <div className="bt-placeholder">
              Replace this placeholder with your actual section content. Cards, grids, timelines, forms — build here.
            </div>
          </div>

        </main>

        {/* AI PANEL */}
        <aside className="bt-ai">
          <div className="bt-ai-hdr">
            <div className="bt-ai-hdr-top">
              <div className="bt-ai-dot" />
              <span className="bt-ai-label">Notrya AI</span>
              <span className="bt-ai-model">claude-sonnet-4</span>
            </div>
            <div className="bt-ai-qbtns">
              {[['📋 Summarise','Summarise what is on this page.'],['🔍 Check','Check for completeness.'],['📝 Draft Note','Draft a note from the data.']].map(([lbl,q]) => (
                <button key={lbl} className="bt-ai-qbtn" onClick={() => sendAI(q)}>{lbl}</button>
              ))}
            </div>
          </div>
          <div className="bt-ai-msgs" ref={chatRef}>
            {aiMessages.map((m, i) => (
              <div key={i} className={`bt-ai-msg ${m.role}`}>{m.text}</div>
            ))}
            {aiLoading && <div className="bt-loader"><span /><span /><span /></div>}
          </div>
          <div className="bt-ai-input-wrap">
            <textarea
              className="bt-ai-input" rows={2} placeholder="Ask anything…"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
            />
            <button className="bt-ai-send" onClick={() => sendAI()}>↑</button>
          </div>
        </aside>
      </div>

      {/* BOTTOM BAR */}
      <div className="bt-bottom">
        <button className="btn-ghost" onClick={navBack}>← Back</button>
        <span className="bt-step-lbl">{prevLabel}</span>

        <div className="bt-stepper-dots">
          {STEPS.map((s, i) => (
            <div key={i} className={`bt-step-dot ${ALL_ITEMS[i]?.id === active ? 'current' : s.status}`} title={s.label} onClick={() => setActive(ALL_ITEMS[i]?.id)} />
          ))}
        </div>

        <span className="bt-cur-lbl">{currentLabel}</span>
        <button className="btn-teal bt-next" style={{ padding:'6px 16px', fontSize:12, fontWeight:700 }} onClick={navNext}>Next →</button>
      </div>
    </div>
  );
}