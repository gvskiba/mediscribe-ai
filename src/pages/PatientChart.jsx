import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function PatientChart() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loaderMsg, setLoaderMsg] = useState('Loading patient chart…');
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [problems, setProblems] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [meds, setMeds] = useState([]);
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [note, setNote] = useState(null);
  const [shift, setShift] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'Loading patient context…' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [activeTab, setActiveTab] = useState({ problems: 'active', meds: 'ed' });

  useEffect(() => {
    init();
  }, [searchParams]);

  async function init() {
    const patientId = searchParams.get('patientId') || searchParams.get('id');
    if (!patientId) {
      setLoaderMsg('No patient ID found in URL. Append ?patientId=… to navigate to a patient.');
      return;
    }

    try {
      setLoaderMsg('Fetching session…');
      const user = await base44.auth.me();
      setCurrentUser(user);
      // Fetch shift stats placeholder
      setShift({ activePatients: '—', notesPending: '—', ordersQueue: '—', shiftHours: '—' });

      setLoaderMsg('Loading patient record…');
      // BASE44: Replace with actual entity fetch
      // const pt = await base44.entities.Patient.get(patientId);
      // For now, stub data
      const pt = null;
      setPatient(pt);

      setLoaderMsg('Loading chart data…');
      // All entity fetches would go here
      setVitals(null);
      setTimeline([]);
      setProblems([]);
      setAllergies([]);
      setMeds([]);
      setLabs([]);
      setImaging([]);
      setNote(null);

      setAiMessages([{ role: 'sys', text: 'Patient chart loaded. Select a quick action or ask a clinical question.' }]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoaderMsg('Error: ' + err.message);
    }
  }

  const calcAge = (dob) => {
    if (!dob) return null;
    const b = new Date(dob), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }); } catch { return '—'; }
  };

  const formatTime = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return '—'; }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' hr ago';
  };

  return (
    <>
      <style>{`
:root {
  --bg:#050f1e; --bg-panel:#081628; --bg-card:#0b1e36; --bg-up:#0e2544;
  --border:#1a3555; --border-hi:#2a4f7a;
  --blue:#3b9eff; --cyan:#00d4ff; --teal:#00e5c0; --gold:#f5c842;
  --purple:#9b6dff; --coral:#ff6b6b; --green:#3dffa0; --orange:#ff9f43;
  --txt:#e8f0fe; --txt2:#8aaccc; --txt3:#4a6a8a; --txt4:#2e4a6a;
  --nav-h:50px; --sub-nav-h:42px; --vit-h:38px;
  --icon-sb:65px; --sb-w:220px; --ai-w:295px;
  --r:8px; --rl:12px;
  --main-top: calc(var(--nav-h) + var(--sub-nav-h) + var(--vit-h));
}
.pc-body{background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;margin:0;padding:0;height:100vh;overflow:hidden;position:fixed;inset:0;}

.icon-sidebar{position:fixed;top:0;left:0;bottom:0;width:var(--icon-sb);background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;z-index:200;}
.isb-logo{width:100%;height:var(--nav-h);flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border);}
.isb-logo-box{width:34px;height:34px;background:var(--blue);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:white;cursor:pointer;}
.isb-scroll{overflow-y:auto;width:100%;flex:1;display:flex;flex-direction:column;align-items:center;padding:6px 0 10px;gap:1px;}
.isb-group-label{font-size:8px;color:var(--txt4);text-transform:uppercase;letter-spacing:.08em;text-align:center;padding:6px 4px 2px;width:100%;}
.isb-btn{width:48px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:var(--r);cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent;}
.isb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt2);}
.isb-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue);}
.isb-icon{font-size:16px;line-height:1;} .isb-lbl{font-size:8.5px;line-height:1;white-space:nowrap;}
.isb-sep{width:36px;height:1px;background:var(--border);margin:4px 0;flex-shrink:0;}
.isb-new-badge{background:rgba(59,158,255,.2);border:1px solid rgba(59,158,255,.4);border-radius:4px;padding:1px 3px;font-size:9px;color:var(--blue);font-weight:700;}

.navbar{position:fixed;top:0;left:var(--icon-sb);right:0;height:var(--nav-h);background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;z-index:100;}
.nav-welcome{font-size:13px;color:var(--txt2);font-weight:500;white-space:nowrap;}
.nav-welcome strong{color:var(--txt);font-weight:600;}
.nav-sep{width:1px;height:22px;background:var(--border);flex-shrink:0;}
.nav-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 12px;min-width:70px;cursor:pointer;}
.nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--txt);line-height:1.2;}
.nav-stat-val.alert{color:var(--gold);}
.nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em;}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:8px;}
.nav-specialty{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer;}
.nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--txt2);cursor:pointer;}
.nav-ai-on{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:600;color:var(--teal);}
.nav-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:ai-pulse 2s ease-in-out infinite;}
@keyframes ai-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
.nav-new-pt{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;}

.sub-navbar{position:fixed;top:var(--nav-h);left:var(--icon-sb);right:0;height:var(--sub-nav-h);background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;z-index:99;}
.sub-nav-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-.5px;}
.sub-nav-sep{color:var(--txt4);}
.sub-nav-title{font-size:13px;color:var(--txt2);font-weight:500;}
.sub-nav-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace;}
.sub-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px;}
.btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s;}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--txt);}
.btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
.btn-blue{background:var(--blue);color:white;border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
.btn-coral{background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.35);color:var(--coral);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}

.vitals-bar{position:fixed;top:calc(var(--nav-h) + var(--sub-nav-h));left:var(--icon-sb);right:0;height:var(--vit-h);background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:10px;z-index:98;overflow:hidden;}
.vb-name{font-family:'Playfair Display',serif;font-size:14px;color:var(--txt);font-weight:600;white-space:nowrap;}
.vb-meta{font-size:11px;color:var(--txt3);white-space:nowrap;}
.vb-div{width:1px;height:20px;background:var(--border);flex-shrink:0;}
.vb-vital{display:flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:11px;white-space:nowrap;}
.vb-vital .lbl{color:var(--txt3);font-size:10px;} .vb-vital .val{color:var(--txt2);}
.vb-vital .val.hi{color:var(--gold);animation:glow-gold 2s ease-in-out infinite;}
.vb-vital .val.lo{color:var(--blue);animation:glow-blue 2s ease-in-out infinite;}
@keyframes glow-gold{0%,100%{text-shadow:0 0 4px rgba(245,200,66,.4)}50%{text-shadow:0 0 10px rgba(245,200,66,.9)}}
@keyframes glow-blue{0%,100%{text-shadow:0 0 4px rgba(59,158,255,.4)}50%{text-shadow:0 0 10px rgba(59,158,255,.9)}}

.main-wrap{position:fixed;top:var(--main-top);left:var(--icon-sb);right:0;bottom:0;display:flex;}

.sidebar{width:var(--sb-w);flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);overflow-y:auto;padding:14px 10px;display:flex;flex-direction:column;gap:6px;}
.sb-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:4px;}
.sb-nav-btn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2);}
.sb-nav-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt);}
.sb-nav-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue);}
.sb-nav-btn .icon{font-size:14px;width:18px;text-align:center;}
.sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px;margin-bottom:2px;}
.sb-divider{height:1px;background:var(--border);margin:8px 0;}

.content{flex:1;overflow-y:auto;padding:18px 20px 30px;display:flex;flex-direction:column;gap:16px;}

.ai-panel{width:var(--ai-w);flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.ai-header{padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0;}
.ai-header-top{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ai-label{font-size:12px;font-weight:600;color:var(--txt2);}
.ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3);}
.ai-quick-btns{display:flex;flex-wrap:wrap;gap:4px;}
.ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);transition:all .15s;}
.ai-qbtn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.06);}
.ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;}
.ai-msg{padding:9px 11px;border-radius:var(--r);font-size:12px;line-height:1.55;}
.ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border);}
.ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2);}
.ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt);}
.ai-input-wrap{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:6px;}
.ai-input{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif;}
.ai-input:focus{border-color:var(--teal);}
.ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;font-weight:700;}

.section-box{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px;}
.sec-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.sec-icon{font-size:18px;}
.sec-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--txt);}
.sec-subtitle{font-size:12px;color:var(--txt3);margin-top:1px;}

.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;gap:8px;color:var(--txt4);text-align:center;}
.empty-state .icon{font-size:28px;opacity:.4;} .empty-state .msg{font-size:12px;}

.page-loader{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;z-index:999;}
.page-loader.hidden{display:none;}
.loader-logo{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--cyan);}
.loader-bar-wrap{width:200px;height:3px;background:var(--bg-up);border-radius:2px;overflow:hidden;}
.loader-bar{height:100%;background:var(--teal);border-radius:2px;animation:load-fill 1.2s ease forwards;}
@keyframes load-fill{from{width:0}to{width:100%}}
.loader-msg{font-size:12px;color:var(--txt3);}

.badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;}
.badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3);}
.badge-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);}
.badge-muted{background:rgba(74,106,138,.2);color:var(--txt3);}

.tab-bar{display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:14px;}
.tab{padding:6px 14px;font-size:12px;color:var(--txt3);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;margin-bottom:-1px;}
.tab:hover{color:var(--txt2);} .tab.active{color:var(--blue);border-bottom-color:var(--blue);font-weight:600;}
      `}</style>

      <div className="pc-body">
        {/* PAGE LOADER */}
        {loading && (
          <div className="page-loader">
            <div className="loader-logo">notrya</div>
            <div className="loader-bar-wrap"><div className="loader-bar"></div></div>
            <div className="loader-msg">{loaderMsg}</div>
          </div>
        )}

        {/* ICON SIDEBAR */}
        <aside className="icon-sidebar">
          <div className="isb-logo"><div className="isb-logo-box">N.</div></div>
          <div className="isb-scroll">
            <span className="isb-group-label">CORE</span>
            <div className="isb-btn"><span className="isb-icon">🏠</span><span className="isb-lbl">Home</span></div>
            <div className="isb-btn"><span className="isb-icon">📊</span><span className="isb-lbl">Dashboard</span></div>
            <div className="isb-btn"><span className="isb-icon">🔄</span><span className="isb-lbl">Shift</span></div>
            <div className="isb-btn active"><span className="isb-icon">👥</span><span className="isb-lbl">Patients</span></div>
            <div className="isb-btn"><span className="isb-new-badge">NEW</span><span className="isb-lbl">New Pt</span></div>
            <div className="isb-sep"></div>
            <span className="isb-group-label">DOCUMENTATION</span>
            <div className="isb-btn"><span className="isb-icon">✨</span><span className="isb-lbl">Note Hub</span></div>
            <div className="isb-btn"><span className="isb-icon">🎙️</span><span className="isb-lbl">Transcription</span></div>
            <div className="isb-btn"><span className="isb-icon">📄</span><span className="isb-lbl">SOAP</span></div>
            <div className="isb-btn"><span className="isb-icon">📝</span><span className="isb-lbl">Note Studio</span></div>
            <div className="isb-btn"><span className="isb-icon">🗒️</span><span className="isb-lbl">Notes</span></div>
            <div className="isb-btn"><span className="isb-icon">⚖️</span><span className="isb-lbl">MDM</span></div>
            <div className="isb-btn"><span className="isb-icon">📋</span><span className="isb-lbl">Orders</span></div>
            <div className="isb-btn"><span className="isb-icon">🚪</span><span className="isb-lbl">Discharge</span></div>
            <div className="isb-sep"></div>
            <span className="isb-group-label">REFERENCE</span>
            <div className="isb-btn"><span className="isb-icon">💊</span><span className="isb-lbl">Drugs</span></div>
            <div className="isb-btn"><span className="isb-icon">🦠</span><span className="isb-lbl">Antibiotics</span></div>
            <div className="isb-btn"><span className="isb-icon">🧮</span><span className="isb-lbl">Calculators</span></div>
          </div>
        </aside>

        {/* NAVBAR */}
        <nav className="navbar">
          <span className="nav-welcome">Welcome, <strong>{currentUser?.full_name || '—'}</strong></span>
          <div className="nav-sep"></div>
          <div className="nav-stat"><span className="nav-stat-val">{shift?.activePatients || '—'}</span><span className="nav-stat-lbl">Active Patients</span></div>
          <div className="nav-stat"><span className="nav-stat-val alert">{shift?.notesPending || '—'}</span><span className="nav-stat-lbl">Notes Pending</span></div>
          <div className="nav-stat"><span className="nav-stat-val">{shift?.ordersQueue || '—'}</span><span className="nav-stat-lbl">Orders Queue</span></div>
          <div className="nav-stat"><span className="nav-stat-val">{shift?.shiftHours || '—'}</span><span className="nav-stat-lbl">Shift Hours</span></div>
          <div className="nav-right">
            <div className="nav-specialty">— ▾</div>
            <div className="nav-time">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
            <div className="nav-ai-on"><div className="nav-ai-dot"></div> AI ON</div>
            <button className="nav-new-pt">+ New Patient</button>
          </div>
        </nav>

        {/* SUB-NAVBAR */}
        <div className="sub-navbar">
          <span className="sub-nav-logo">notrya</span>
          <span className="sub-nav-sep">|</span>
          <span className="sub-nav-title">Patient Chart</span>
          <span className="sub-nav-badge">PT-—</span>
          <div className="sub-nav-right">
            <button className="btn-ghost">← All Patients</button>
            <button className="btn-ghost">📋 Orders</button>
            <button className="btn-ghost">📝 SOAP Note</button>
            <button className="btn-coral">🚪 Discharge</button>
            <button className="btn-primary">💾 Save Chart</button>
          </div>
        </div>

        {/* VITALS BAR */}
        <div className="vitals-bar">
          <span className="vb-name">—</span>
          <span className="vb-meta">—</span>
          <div className="vb-div"></div>
          <div className="vb-vital"><span className="lbl">CC</span><span className="val">—</span></div>
          <div className="vb-div"></div>
          <div className="vb-vital"><span className="lbl">BP</span><span className="val">—</span></div>
          <div className="vb-vital"><span className="lbl">HR</span><span className="val">—</span></div>
          <div className="vb-vital"><span className="lbl">RR</span><span className="val">—</span></div>
          <div className="vb-vital"><span className="lbl">SpO₂</span><span className="val">—</span></div>
          <div className="vb-vital"><span className="lbl">Temp</span><span className="val">—</span></div>
          <div className="vb-vital"><span className="lbl">GCS</span><span className="val">—</span></div>
          <div className="vb-vital"><span className="lbl">Wt</span><span className="val">—</span></div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="main-wrap">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sb-card">
              <div className="empty-state" style={{ padding: '16px 0' }}><div className="icon">👤</div><div className="msg">Loading…</div></div>
            </div>
            <div className="sb-label">Chart Sections</div>
            <div className="sb-nav-btn active"><span className="icon">📊</span> Overview</div>
            <div className="sb-nav-btn"><span className="icon">🕐</span> Timeline</div>
            <div className="sb-nav-btn"><span className="icon">🏷️</span> Problem List</div>
            <div className="sb-nav-btn"><span className="icon">💊</span> Medications</div>
            <div className="sb-nav-btn"><span className="icon">🧪</span> Labs</div>
            <div className="sb-nav-btn"><span className="icon">🩻</span> Imaging</div>
            <div className="sb-nav-btn"><span className="icon">⚠️</span> Allergies</div>
            <div className="sb-nav-btn"><span className="icon">📝</span> Current Note</div>
            <div className="sb-divider"></div>
            <div className="sb-label">Flags</div>
            <div style={{ fontSize: '11px', color: 'var(--txt3)', padding: '4px 8px' }}>No flags yet.</div>
          </aside>

          {/* CONTENT */}
          <main className="content">
            <div className="section-box">
              <div className="sec-header">
                <span className="sec-icon">📊</span>
                <div><div className="sec-title">Overview</div></div>
              </div>
              <div className="empty-state"><div className="icon">📊</div><div className="msg">No patient data loaded.</div></div>
            </div>

            <div className="section-box">
              <div className="sec-header">
                <span className="sec-icon">🕐</span>
                <div><div className="sec-title">Visit Timeline</div><div className="sec-subtitle">ED encounter events</div></div>
              </div>
              <div className="empty-state"><div className="icon">🕐</div><div className="msg">No events recorded.</div></div>
            </div>
          </main>

          {/* AI PANEL */}
          <aside className="ai-panel">
            <div className="ai-header">
              <div className="ai-header-top">
                <div className="nav-ai-dot"></div>
                <span className="ai-label">Notrya AI</span>
                <span className="ai-model">claude-sonnet-4</span>
              </div>
              <div className="ai-quick-btns">
                <button className="ai-qbtn">📋 Summarize</button>
                <button className="ai-qbtn">💊 Drug Check</button>
                <button className="ai-qbtn">🔍 Workup</button>
                <button className="ai-qbtn">🚪 Disposition</button>
                <button className="ai-qbtn">📚 Guidelines</button>
              </div>
            </div>
            <div className="ai-msgs">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`ai-msg ${msg.role}`}>{msg.text}</div>
              ))}
            </div>
            <div className="ai-input-wrap">
              <textarea
                className="ai-input"
                rows="2"
                placeholder="Ask anything about this patient…"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
              ></textarea>
              <button className="ai-send">↑</button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}