import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const nowHHMM = () => {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
};

const MDM_CSS = `
.mdm-panel-wrap{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;display:flex;flex:1;overflow:hidden;min-height:0;background:var(--bg);}
.mdm-panel-wrap *{box-sizing:border-box;}
/* sidebar */
.mdm-sb{width:200px;flex-shrink:0;background:#060e1c;border-right:1px solid var(--border);overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:5px;}
.mdm-sb::-webkit-scrollbar{width:3px}
.mdm-sb::-webkit-scrollbar-thumb{background:var(--border)}
.mdm-sb-head{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--txt4);padding:4px 8px 2px;}
.mdm-sb-btn{display:flex;align-items:center;gap:7px;padding:6px 9px;border-radius:7px;cursor:pointer;border:1px solid transparent;font-size:11px;color:var(--txt2);background:none;width:100%;text-align:left;transition:all .15s;}
.mdm-sb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt);}
.mdm-sb-dot{width:6px;height:6px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0;}
.mdm-sb-dot.done{background:var(--teal);}
.mdm-sb-divider{height:1px;background:var(--border);margin:6px 0;}
.mdm-sb-progress{padding:8px 9px;background:var(--bg-card);border:1px solid var(--border);border-radius:7px;}
.mdm-sb-prog-title{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;}
.mdm-sb-prog-row{display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;}
.mdm-sb-prog-key{color:var(--txt2);}
.mdm-sb-prog-val{font-family:'JetBrains Mono',monospace;color:var(--txt3);}
.mdm-sb-prog-val.filled{color:var(--teal);}
/* content */
.mdm-content-area{flex:1;overflow-y:auto;padding:14px 16px 30px;display:flex;flex-direction:column;gap:16px;}
.mdm-content-area::-webkit-scrollbar{width:4px}
.mdm-content-area::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.mdm-sec{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px;}
.mdm-sec-hdr{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.mdm-sec-title{font-size:15px;font-weight:600;color:var(--txt);}
.mdm-sec-sub{font-size:11px;color:var(--txt3);margin-top:1px;}
/* dx tabs */
.mdm-dx-tabs{display:flex;gap:4px;margin-bottom:12px;}
.mdm-dx-tab{padding:5px 14px;border-radius:7px;cursor:pointer;font-size:11px;font-weight:500;border:1px solid var(--border);color:var(--txt2);background:var(--bg-card);transition:all .15s;}
.mdm-dx-tab.active{background:rgba(59,158,255,.12);border-color:rgba(59,158,255,.4);color:var(--blue);}
/* order cards */
.mdm-order-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);overflow:hidden;margin-bottom:8px;transition:border-color .2s;}
.mdm-order-card.status-resulted{border-left:3px solid var(--teal);}
.mdm-order-card.status-critical{border-left:3px solid var(--coral);}
.mdm-order-card.status-pending{border-left:3px solid var(--txt3);}
.mdm-order-card.status-abnormal{border-left:3px solid var(--orange);}
.mdm-order-hdr{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;user-select:none;}
.mdm-order-name{font-weight:600;font-size:12px;color:var(--txt);flex:1;}
.mdm-order-status{font-size:9px;font-family:'JetBrains Mono',monospace;padding:2px 7px;border-radius:20px;font-weight:600;}
.mdm-order-status.pending{background:rgba(74,106,138,.3);color:var(--txt3);}
.mdm-order-status.resulted{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.25);}
.mdm-order-status.abnormal{background:rgba(255,159,67,.12);color:var(--orange);border:1px solid rgba(255,159,67,.25);}
.mdm-order-status.critical{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);}
.mdm-order-body{padding:0 12px 12px;}
.mdm-order-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
.mdm-of{display:flex;flex-direction:column;gap:3px;}
.mdm-of-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;}
.mdm-of-inp{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:6px 9px;color:var(--txt);font-size:12px;outline:none;width:100%;transition:border-color .15s;}
.mdm-of-inp:focus{border-color:var(--blue);}
.mdm-of-ta{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 9px;color:var(--txt);font-size:12px;outline:none;resize:vertical;min-height:52px;width:100%;transition:border-color .15s;line-height:1.5;}
.mdm-of-ta:focus{border-color:var(--blue);}
.mdm-of-sel{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:6px 9px;color:var(--txt);font-size:12px;outline:none;cursor:pointer;width:100%;}
.mdm-add-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;border:1px dashed var(--border);border-radius:var(--rl);background:transparent;color:var(--txt3);font-size:11px;cursor:pointer;transition:all .15s;width:100%;margin-top:6px;}
.mdm-add-btn:hover{border-color:var(--blue);color:var(--blue);background:rgba(59,158,255,.05);}
.mdm-ai-btn{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.25);border-radius:var(--r);padding:4px 10px;font-size:10px;color:var(--teal);cursor:pointer;transition:all .15s;}
.mdm-del-btn{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.2);border-radius:var(--r);padding:4px 9px;font-size:10px;color:var(--coral);cursor:pointer;margin-left:auto;}
/* ekg grid */
.mdm-ekg-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;}
/* timeline */
.mdm-timeline{display:flex;flex-direction:column;gap:0;position:relative;}
.mdm-timeline::before{content:'';position:absolute;left:16px;top:18px;bottom:18px;width:1px;background:var(--border);}
.mdm-tl-item{display:flex;gap:12px;align-items:flex-start;padding:6px 0;position:relative;}
.mdm-tl-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:12px;margin-left:10px;border:2px solid var(--bg-card);z-index:1;}
.mdm-tl-dot.med{background:var(--blue);}
.mdm-tl-dot.proc{background:var(--purple);}
.mdm-tl-dot.fluid{background:var(--cyan);}
.mdm-tl-dot.consult{background:var(--gold);}
.mdm-tl-dot.result{background:var(--teal);}
.mdm-tl-dot.other{background:var(--txt3);}
.mdm-tl-body{flex:1;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;}
.mdm-tl-hdr{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.mdm-tl-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--txt3);}
.mdm-tl-badge{font-size:9px;padding:1px 6px;border-radius:20px;font-weight:600;}
.mdm-tl-badge.med{background:rgba(59,158,255,.15);color:var(--blue);}
.mdm-tl-badge.proc{background:rgba(155,109,255,.15);color:var(--purple);}
.mdm-tl-badge.fluid{background:rgba(0,212,255,.15);color:var(--cyan);}
.mdm-tl-badge.consult{background:rgba(245,200,66,.15);color:var(--gold);}
.mdm-tl-badge.result{background:rgba(0,229,192,.15);color:var(--teal);}
.mdm-tl-badge.other{background:rgba(74,106,138,.2);color:var(--txt2);}
.mdm-tl-del{margin-left:auto;background:none;border:none;color:var(--txt4);cursor:pointer;font-size:12px;}
.mdm-tl-del:hover{color:var(--coral);}
.mdm-tl-detail{font-size:12px;color:var(--txt);line-height:1.4;}
.mdm-tl-resp{margin-top:4px;font-size:11px;color:var(--txt3);font-style:italic;}
.mdm-tl-resp.improved{color:var(--teal);}
.mdm-tl-resp.unchanged{color:var(--gold);}
.mdm-tl-resp.deteriorated{color:var(--coral);}
.mdm-int-form{background:var(--bg-card);border:1px dashed var(--border);border-radius:var(--rl);padding:10px 12px;margin-top:6px;}
/* impressions */
.mdm-imp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.mdm-imp-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:13px;}
.mdm-imp-card.initial{border-top:2px solid var(--gold);}
.mdm-imp-card.final{border-top:2px solid var(--teal);}
.mdm-imp-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:8px;}
.mdm-imp-lbl.initial{color:var(--gold);}
.mdm-imp-lbl.final{color:var(--teal);}
.mdm-imp-dx{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 10px;color:var(--txt);font-size:13px;outline:none;width:100%;transition:border-color .15s;margin-bottom:8px;}
.mdm-imp-dx:focus{border-color:var(--gold);}
.mdm-imp-card.final .mdm-imp-dx:focus{border-color:var(--teal);}
.mdm-ev-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;}
.mdm-ev-chips{display:flex;flex-wrap:wrap;gap:4px;min-height:24px;}
.mdm-ev-chip{display:flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:10px;border:1px solid;}
.mdm-ev-chip.lab{background:rgba(59,158,255,.12);color:var(--blue);border-color:rgba(59,158,255,.3);}
.mdm-ev-chip.imaging{background:rgba(155,109,255,.12);color:var(--purple);border-color:rgba(155,109,255,.3);}
.mdm-ev-chip.vital{background:rgba(255,107,107,.12);color:var(--coral);border-color:rgba(255,107,107,.3);}
.mdm-ev-chip.hx{background:rgba(245,200,66,.12);color:var(--gold);border-color:rgba(245,200,66,.3);}
.mdm-ev-chip.exam{background:rgba(0,229,192,.12);color:var(--teal);border-color:rgba(0,229,192,.3);}
.mdm-ev-chip.ekg{background:rgba(255,159,67,.12);color:var(--orange);border-color:rgba(255,159,67,.3);}
.mdm-add-ev-row{display:flex;gap:5px;margin-top:5px;}
.mdm-add-ev-inp{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 8px;color:var(--txt);font-size:11px;outline:none;}
.mdm-add-ev-sel{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 6px;color:var(--txt2);font-size:10px;cursor:pointer;outline:none;}
.mdm-add-ev-btn{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 8px;color:var(--txt2);font-size:10px;cursor:pointer;}
.mdm-imp-rationale{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 9px;color:var(--txt);font-size:11px;outline:none;resize:vertical;min-height:60px;width:100%;line-height:1.5;margin-top:6px;}
.mdm-imp-icd-row{display:grid;grid-template-columns:1fr 110px;gap:7px;margin-top:6px;}
/* mdm complexity */
.mdm-cx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.mdm-cx-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px;}
.mdm-cx-card-title{font-size:10px;font-weight:600;color:var(--txt2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;}
.mdm-cx-btns{display:flex;gap:5px;flex-wrap:wrap;}
.mdm-cx-btn{flex:1;padding:6px 5px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);font-size:10px;font-weight:600;cursor:pointer;text-align:center;transition:all .2s;text-transform:uppercase;}
.mdm-cx-btn.active-straight{background:rgba(0,229,192,.12);border-color:var(--teal);color:var(--teal);}
.mdm-cx-btn.active-low{background:rgba(59,158,255,.12);border-color:var(--blue);color:var(--blue);}
.mdm-cx-btn.active-mod{background:rgba(245,200,66,.12);border-color:var(--gold);color:var(--gold);}
.mdm-cx-btn.active-high{background:rgba(255,107,107,.12);border-color:var(--coral);color:var(--coral);}
.mdm-cx-check-list{display:flex;flex-direction:column;gap:4px;}
.mdm-cx-check{display:flex;align-items:center;gap:7px;cursor:pointer;padding:3px 5px;border-radius:5px;transition:background .1s;}
.mdm-cx-check:hover{background:var(--bg-up);}
.mdm-cx-check input[type="checkbox"]{accent-color:var(--blue);width:12px;height:12px;cursor:pointer;}
.mdm-cx-check-lbl{font-size:11px;color:var(--txt2);}
.mdm-cx-check-lbl.checked{color:var(--teal);text-decoration:line-through;text-decoration-color:rgba(0,229,192,.4);}
.mdm-risk-grid2{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
.mdm-risk-chip{padding:5px 8px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);font-size:10px;cursor:pointer;text-align:center;transition:all .15s;}
.mdm-risk-chip.selected{background:rgba(255,107,107,.12);border-color:var(--coral);color:var(--coral);}
.mdm-result-box2{grid-column:1/-1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--rl);padding:10px 14px;display:flex;align-items:center;gap:12px;}
.mdm-result-lbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;}
.mdm-result-lvl{font-size:20px;font-weight:700;}
.mdm-result-lvl.straight{color:var(--teal);}
.mdm-result-lvl.low{color:var(--blue);}
.mdm-result-lvl.mod{color:var(--gold);}
.mdm-result-lvl.high{color:var(--coral);}
.mdm-result-desc2{font-size:11px;color:var(--txt3);flex:1;}
/* rtt */
.mdm-rtt-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:13px;}
.mdm-rtt-hdr{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.mdm-rtt-title{font-size:12px;font-weight:600;color:var(--txt);}
.mdm-rtt-btns{display:flex;gap:5px;margin-left:auto;}
.mdm-rtt-btn{padding:3px 10px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);font-size:10px;font-weight:600;cursor:pointer;transition:all .15s;}
.mdm-rtt-btn.active-improved{background:rgba(0,229,192,.12);border-color:var(--teal);color:var(--teal);}
.mdm-rtt-btn.active-unchanged{background:rgba(245,200,66,.12);border-color:var(--gold);color:var(--gold);}
.mdm-rtt-btn.active-deteriorated{background:rgba(255,107,107,.12);border-color:var(--coral);color:var(--coral);}
/* ai panel */
.mdm-ai-aside{width:260px;flex-shrink:0;background:#060e1c;border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.mdm-ai-hdr{padding:10px 12px 8px;border-bottom:1px solid var(--border);flex-shrink:0;}
.mdm-ai-hrow{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
.mdm-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:mdm-pulse 2s infinite;}
@keyframes mdm-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 4px rgba(0,229,192,0)}}
.mdm-ai-title{font-size:11px;font-weight:600;color:var(--txt);flex:1;}
.mdm-ai-model{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt4);background:var(--bg-up);padding:2px 5px;border-radius:3px;}
.mdm-ai-qbtns{display:flex;flex-wrap:wrap;gap:3px;}
.mdm-ai-qbtn{padding:2px 7px;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:5px;color:var(--txt3);cursor:pointer;transition:all .15s;}
.mdm-ai-qbtn:hover{border-color:var(--teal);color:var(--teal);}
.mdm-ai-chat{flex:1;padding:10px 11px;overflow-y:auto;}
.mdm-ai-chat::-webkit-scrollbar{width:3px}
.mdm-ai-chat::-webkit-scrollbar-thumb{background:var(--border)}
.mdm-ai-msg{padding:7px 9px;border-radius:7px;margin-bottom:6px;font-size:11px;line-height:1.6;}
.mdm-ai-msg.sys{background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);}
.mdm-ai-msg.user{background:#0a2040;border:1px solid rgba(59,158,255,.2);color:var(--txt);}
.mdm-ai-msg.bot{background:#062020;border:1px solid rgba(0,229,192,.15);color:var(--txt2);}
.mdm-ai-loading{display:flex;gap:4px;align-items:center;padding:8px 11px;}
.mdm-ai-tdot{width:5px;height:5px;border-radius:50%;background:var(--teal);animation:mdm-bounce 1.2s infinite;}
.mdm-ai-tdot:nth-child(2){animation-delay:.2s}
.mdm-ai-tdot:nth-child(3){animation-delay:.4s}
@keyframes mdm-bounce{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
.mdm-ai-inp-wrap{padding:8px 11px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:5px;}
.mdm-ai-inp{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:7px;padding:6px 9px;color:var(--txt);font-size:11px;outline:none;resize:none;}
.mdm-ai-inp:focus{border-color:var(--teal);}
.mdm-ai-send{background:var(--teal);color:#050f1e;border:none;border-radius:7px;padding:6px 10px;font-size:13px;cursor:pointer;font-weight:700;}
`;

function MDMOrderCard({ type, onDelete, onAIInterpret }) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');
  const [ref, setRef] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('');
  const [interp, setInterp] = useState('');
  const [status, setStatus] = useState('pending');
  const isLab = type === 'lab';
  const statusLabel = { pending: 'PENDING', resulted: 'NORMAL', abnormal: 'ABNORMAL', critical: '⚠ CRITICAL' };
  const handleResult = (v) => {
    setResult(v);
    if (v && /\(HH\)|\(LL\)/i.test(v)) setStatus('critical');
    else if (v && /\(H\)|\(L\)/i.test(v)) setStatus('abnormal');
    else if (v) setStatus('resulted');
  };
  return (
    <div className={`mdm-order-card status-${status}`}>
      <div className="mdm-order-hdr" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 14 }}>{isLab ? '🧬' : '🩻'}</span>
        <span className="mdm-order-name">{name || (isLab ? 'New Lab Order' : 'New Imaging Order')}</span>
        <span className={`mdm-order-status ${status}`}>{statusLabel[status]}</span>
        <span style={{ color: 'var(--txt3)', fontSize: 10, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </div>
      {open && (
        <div className="mdm-order-body">
          <div className="mdm-order-row">
            <div className="mdm-of"><label className="mdm-of-lbl">{isLab ? 'Lab / Panel' : 'Modality'}</label>
              <input className="mdm-of-inp" value={name} onChange={e => setName(e.target.value)} placeholder={isLab ? 'e.g. Troponin, CBC…' : 'e.g. CXR, CT Chest…'} />
            </div>
            <div className="mdm-of"><label className="mdm-of-lbl">{isLab ? 'Reference Range' : 'Body Region'}</label>
              <input className="mdm-of-inp" style={{ fontFamily: 'monospace', fontSize: 11 }} value={ref} onChange={e => setRef(e.target.value)} placeholder={isLab ? '0–0.04 ng/mL' : 'Chest w/ contrast'} />
            </div>
          </div>
          <div className="mdm-of" style={{ marginBottom: 8 }}>
            <label className="mdm-of-lbl">🎯 Clinical Rationale</label>
            <textarea className="mdm-of-ta" value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Why was this ordered?" />
          </div>
          <div className="mdm-order-row">
            <div className="mdm-of"><label className="mdm-of-lbl">Result / Findings</label>
              <input className="mdm-of-inp" style={{ fontFamily: 'monospace', fontSize: 11 }} value={result} onChange={e => handleResult(e.target.value)} placeholder={isLab ? 'e.g. Troponin 0.82 (H)' : 'Bilateral infiltrates'} />
            </div>
            <div className="mdm-of"><label className="mdm-of-lbl">Status</label>
              <select className="mdm-of-sel" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="resulted">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="mdm-of" style={{ marginBottom: 8 }}>
            <label className="mdm-of-lbl">🔬 Clinical Interpretation</label>
            <textarea className="mdm-of-ta" value={interp} onChange={e => setInterp(e.target.value)} rows={2} placeholder="Clinical significance…" />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="mdm-ai-btn" onClick={() => onAIInterpret({ name, result, reason, ref, type })}>✨ AI Interpret</button>
            <button className="mdm-del-btn" onClick={onDelete}>✕ Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MDMEKGCard({ num, onDelete, onAIInterpret }) {
  const [open, setOpen] = useState(true);
  const [fields, setFields] = useState({ time: nowHHMM(), reason: '', rate: '', rhythm: '', axis: '', pr: '', qrs: '', qtc: '', st: '', twave: '', other: '', interp: '' });
  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));
  return (
    <div className="mdm-order-card status-resulted">
      <div className="mdm-order-hdr" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 14 }}>📈</span>
        <span className="mdm-order-name">EKG #{num}</span>
        <span className="mdm-order-status resulted">ENTERED</span>
        <span style={{ color: 'var(--txt3)', fontSize: 10, transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>
      {open && (
        <div className="mdm-order-body">
          <div className="mdm-order-row">
            <div className="mdm-of"><label className="mdm-of-lbl">Time</label><input type="time" className="mdm-of-inp" value={fields.time} onChange={e => set('time', e.target.value)} /></div>
            <div className="mdm-of"><label className="mdm-of-lbl">Reason</label><input className="mdm-of-inp" value={fields.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Chest pain…" /></div>
          </div>
          <div className="mdm-ekg-grid" style={{ marginBottom: 8 }}>
            {[['rate','Rate (bpm)','82'],['rhythm','Rhythm','NSR'],['axis','Axis','Normal'],
              ['pr','PR','160ms'],['qrs','QRS','90ms'],['qtc','QTc','440ms'],
              ['st','ST Changes','None'],['twave','T Waves','Normal'],['other','Other','—']
            ].map(([k, lbl, ph]) => (
              <div key={k} className="mdm-of"><label className="mdm-of-lbl">{lbl}</label><input className="mdm-of-inp" value={fields[k]} onChange={e => set(k, e.target.value)} placeholder={ph} /></div>
            ))}
          </div>
          <div className="mdm-of" style={{ marginBottom: 8 }}>
            <label className="mdm-of-lbl">🔬 Interpretation</label>
            <textarea className="mdm-of-ta" rows={2} value={fields.interp} onChange={e => set('interp', e.target.value)} placeholder="Clinical significance…" />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="mdm-ai-btn" onClick={() => onAIInterpret(fields)}>✨ AI Interpret EKG</button>
            <button className="mdm-del-btn" onClick={onDelete}>✕ Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MDMImpressionCard({ variant, evidence, onAddEvidence, onRemoveEvidence }) {
  const [dx, setDx] = useState('');
  const [rationale, setRationale] = useState('');
  const [icd, setIcd] = useState('');
  const [icdLoading, setIcdLoading] = useState(false);
  const [disp, setDisp] = useState('');
  const [evInput, setEvInput] = useState('');
  const [evType, setEvType] = useState('vital');
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sugTimer = useRef(null);
  const isInitial = variant === 'initial';

  const handleDxChange = (val) => {
    setDx(val);
    setSuggestions([]);
    if (sugTimer.current) clearTimeout(sugTimer.current);
    if (val.trim().length < 3) { setShowSuggestions(false); return; }
    sugTimer.current = setTimeout(async () => {
      setSugLoading(true); setShowSuggestions(true);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Given partial diagnosis "${val}", return 5 complete diagnosis suggestions as JSON.`,
          response_json_schema: { type: 'object', properties: { suggestions: { type: 'array', items: { type: 'string' } } }, required: ['suggestions'] }
        });
        setSuggestions(res.suggestions || []);
      } catch { setSuggestions([]); } finally { setSugLoading(false); }
    }, 400);
  };

  const fetchICD = async (txt) => {
    if (!txt.trim()) return;
    setIcdLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `For diagnosis "${txt}", return the ICD-10-CM code as JSON.`,
        response_json_schema: { type: 'object', properties: { code: { type: 'string' }, description: { type: 'string' } }, required: ['code'] }
      });
      if (res.code) setIcd(res.code);
    } catch {} finally { setIcdLoading(false); }
  };

  const pickSuggestion = (val) => {
    setDx(val); setShowSuggestions(false); setSuggestions([]);
    if (!isInitial) fetchICD(val);
  };

  return (
    <div className={`mdm-imp-card ${variant}`}>
      <div className={`mdm-imp-lbl ${variant}`}>{isInitial ? '⚡ Initial Impression' : '✅ Final Impression'}</div>
      <div style={{ position: 'relative' }}>
        <input className="mdm-imp-dx" value={dx}
          onChange={e => handleDxChange(e.target.value)}
          onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); if (!isInitial && dx && !icd) fetchICD(dx); }}
          placeholder={isInitial ? 'Working diagnosis…' : 'Confirmed diagnosis…'} />
        {showSuggestions && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', marginTop: 2 }}>
            {sugLoading ? <div style={{ padding: '8px 11px', fontSize: 10, color: 'var(--teal)' }}>AI completing…</div>
              : suggestions.map((s, i) => (
                <div key={i} onMouseDown={() => pickSuggestion(s)}
                  style={{ padding: '7px 11px', fontSize: 12, color: 'var(--txt)', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-up)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{s}</div>
              ))}
          </div>
        )}
      </div>
      <div className="mdm-ev-lbl">Supporting evidence</div>
      <div className="mdm-ev-chips">
        {evidence.map((e, i) => (
          <div key={i} className={`mdm-ev-chip ${e.type}`}>{e.text}
            <span style={{ opacity: 0.5, fontSize: 9, cursor: 'pointer', marginLeft: 2 }} onClick={() => onRemoveEvidence(i)}>✕</span>
          </div>
        ))}
      </div>
      <div className="mdm-add-ev-row">
        <input className="mdm-add-ev-inp" value={evInput} onChange={e => setEvInput(e.target.value)} placeholder="Add evidence…"
          onKeyDown={e => { if (e.key === 'Enter') { onAddEvidence(evInput, evType); setEvInput(''); } }} />
        <select className="mdm-add-ev-sel" value={evType} onChange={e => setEvType(e.target.value)}>
          <option value="vital">Vital</option><option value="hx">Hx</option><option value="exam">Exam</option>
          <option value="lab">Lab</option><option value="imaging">Imaging</option><option value="ekg">EKG</option>
        </select>
        <button className="mdm-add-ev-btn" onClick={() => { onAddEvidence(evInput, evType); setEvInput(''); }}>Add</button>
      </div>
      {!isInitial && (
        <div className="mdm-imp-icd-row">
          <div className="mdm-of">
            <label className="mdm-of-lbl">ICD-10 {icdLoading && <span style={{ color: 'var(--teal)' }}>✨ fetching…</span>}</label>
            <input className="mdm-of-inp" style={{ fontFamily: 'monospace', fontSize: 11 }} value={icd} onChange={e => setIcd(e.target.value)} placeholder="e.g. I21.9" />
          </div>
          <div className="mdm-of"><label className="mdm-of-lbl">Disposition</label>
            <select className="mdm-of-sel" value={disp} onChange={e => setDisp(e.target.value)}>
              <option value="">— Select —</option>
              <option>Discharge Home</option><option>Admit to Ward</option><option>Admit to ICU</option>
              <option>Observation</option><option>Transfer</option><option>AMA</option>
            </select>
          </div>
        </div>
      )}
      <textarea className="mdm-imp-rationale" value={rationale} onChange={e => setRationale(e.target.value)}
        placeholder={isInitial ? 'Clinical rationale…' : 'Final assessment rationale…'} />
    </div>
  );
}

function MDMCXCheck({ label }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="mdm-cx-check">
      <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
      <span className={`mdm-cx-check-lbl${checked ? ' checked' : ''}`}>{label}</span>
    </label>
  );
}
function MDMRiskChip({ label }) {
  const [sel, setSel] = useState(false);
  return <div className={`mdm-risk-chip${sel ? ' selected' : ''}`} onClick={() => setSel(s => !s)}>{label}</div>;
}

export default function MDMPanel({ patientName, chiefComplaint, vitals }) {
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [ekgs, setEkgs] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [dxTab, setDxTab] = useState('labs');
  const [rttStatus, setRttStatus] = useState('');
  const [mdmLevel, setMdmLevel] = useState('');
  const [evInitial, setEvInitial] = useState([]);
  const [evFinal, setEvFinal] = useState([]);
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'MDM assistant ready. Select a quick action or ask a clinical question.' }]);
  const [aiLoading, setAiLoading] = useState(false);
  const [intTime, setIntTime] = useState(nowHHMM());
  const [intDetail, setIntDetail] = useState('');
  const [intType, setIntType] = useState('med');
  const [intResponse, setIntResponse] = useState('');
  const [intRespType, setIntRespType] = useState('');
  const [aiInput, setAiInput] = useState('');

  const aiMsgsRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = MDM_CSS;
    el.id = 'mdm-panel-styles';
    if (!document.getElementById('mdm-panel-styles')) document.head.appendChild(el);
    return () => document.getElementById('mdm-panel-styles')?.remove();
  }, []);

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const mdmMap = {
    straight: { label: 'Straightforward', cls: 'straight', desc: 'Minor/self-limited. (99211–99212)', badge: 'low' },
    low: { label: 'Low Complexity', cls: 'low', desc: 'Acute uncomplicated illness. (99213)', badge: 'low' },
    mod: { label: 'Moderate Complexity', cls: 'mod', desc: 'Chronic illness exacerbation. (99214)', badge: 'mod' },
    high: { label: 'High Complexity', cls: 'high', desc: 'Severe illness / hospitalization decision. (99215)', badge: 'high' },
  };
  const currentMDM = mdmLevel && mdmMap[mdmLevel];

  const addOrder = (type) => { const id = ++idRef.current; type === 'lab' ? setLabs(l => [...l, { id }]) : setImaging(l => [...l, { id }]); };
  const deleteOrder = (id, type) => type === 'lab' ? setLabs(l => l.filter(o => o.id !== id)) : setImaging(l => l.filter(o => o.id !== id));
  const addEKG = () => { const id = ++idRef.current; setEkgs(e => [...e, { id }]); };
  const deleteEKG = (id) => setEkgs(e => e.filter(x => x.id !== id));
  const addIntervention = () => {
    if (!intDetail.trim()) return;
    const id = ++idRef.current;
    setInterventions(p => [...p, { id, time: intTime, detail: intDetail, type: intType, response: intResponse, respType: intRespType }]);
    setIntDetail(''); setIntResponse(''); setIntRespType('');
  };
  const deleteIntervention = (id) => setInterventions(p => p.filter(i => i.id !== id));
  const addEvidence = (target, text, type) => {
    if (!text.trim()) return;
    target === 'initial' ? setEvInitial(e => [...e, { text, type }]) : setEvFinal(e => [...e, { text, type }]);
  };
  const removeEvidence = (target, idx) => {
    target === 'initial' ? setEvInitial(e => e.filter((_, i) => i !== idx)) : setEvFinal(e => e.filter((_, i) => i !== idx));
  };

  const buildContext = () => {
    let ctx = `Patient: ${patientName || 'Unknown'}, CC: ${chiefComplaint || 'Not entered'}. `;
    if (interventions.length) ctx += `Interventions: ${interventions.map(i => `${i.type}: ${i.detail}`).join(', ')}. `;
    if (mdmLevel) ctx += `MDM Level: ${mdmLevel}. `;
    return ctx;
  };

  const appendMsg = (role, text) => setAiMessages(p => [...p, { role, text }]);

  const aiQ = async (question) => {
    appendMsg('user', question);
    setAiLoading(true);
    try {
      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical MDM assistant. Be concise and clinically accurate.\n\n${buildContext()}\n\nQuestion: ${question}`,
        model: 'claude_sonnet_4_6',
      });
      appendMsg('bot', typeof reply === 'string' ? reply : (reply.content || JSON.stringify(reply)));
    } catch { appendMsg('sys', '⚠ Connection error.'); } finally { setAiLoading(false); }
  };

  const sendAI = () => { if (!aiInput.trim() || aiLoading) return; const q = aiInput; setAiInput(''); aiQ(q); };
  const aiGenerateMDMNote = () => aiQ('Generate a complete, structured MDM documentation note based on all data entered. Include: DIAGNOSTIC WORKUP, ED COURSE, RESPONSE TO TREATMENT, CLINICAL IMPRESSION, MDM COMPLEXITY, DISPOSITION.');

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mdm-panel-wrap">
      {/* SIDEBAR */}
      <aside className="mdm-sb">
        <div className="mdm-sb-head">MDM Sections</div>
        {[
          { label: '🧪 Diagnostic Orders', id: 'mdm-sec-dx', dot: labs.length + imaging.length > 0 ? 'done' : '' },
          { label: '📈 EKG', id: 'mdm-sec-ekg', dot: ekgs.length > 0 ? 'done' : '' },
          { label: '⏱️ ED Course', id: 'mdm-sec-ed', dot: interventions.length > 0 ? 'done' : '' },
          { label: '📉 Response to Tx', id: 'mdm-sec-rtt', dot: rttStatus ? 'done' : '' },
          { label: '🎯 Impressions', id: 'mdm-sec-imp', dot: '' },
          { label: '⚖️ MDM Complexity', id: 'mdm-sec-cx', dot: mdmLevel ? 'done' : '' },
        ].map(({ label, id, dot }) => (
          <button key={id} className="mdm-sb-btn" onClick={() => scrollTo(id)}>
            <span>{label.split(' ')[0]}</span>{label.split(' ').slice(1).join(' ')}
            <span className={`mdm-sb-dot${dot ? ' done' : ''}`} />
          </button>
        ))}
        <div className="mdm-sb-divider" />
        <div className="mdm-sb-progress">
          <div className="mdm-sb-prog-title">MDM Summary</div>
          {[['Labs', labs.length], ['Imaging', imaging.length], ['EKGs', ekgs.length], ['Interventions', interventions.length]].map(([k, v]) => (
            <div key={k} className="mdm-sb-prog-row">
              <span className="mdm-sb-prog-key">{k}</span>
              <span className={`mdm-sb-prog-val${v > 0 ? ' filled' : ''}`}>{v}</span>
            </div>
          ))}
          <div className="mdm-sb-prog-row">
            <span className="mdm-sb-prog-key">Complexity</span>
            <span className={`mdm-sb-prog-val${currentMDM ? ' filled' : ''}`}>{currentMDM?.label || '—'}</span>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="mdm-content-area">

        {/* DIAGNOSTIC ORDERS */}
        <div className="mdm-sec" id="mdm-sec-dx">
          <div className="mdm-sec-hdr">
            <span style={{ fontSize: 16 }}>🧪</span>
            <div><div className="mdm-sec-title">Diagnostic Orders & Results</div><div className="mdm-sec-sub">Document why each test was ordered and interpret the results</div></div>
          </div>
          <div className="mdm-dx-tabs">
            <div className={`mdm-dx-tab${dxTab === 'labs' ? ' active' : ''}`} onClick={() => setDxTab('labs')}>🧬 Labs {labs.length > 0 && `(${labs.length})`}</div>
            <div className={`mdm-dx-tab${dxTab === 'imaging' ? ' active' : ''}`} onClick={() => setDxTab('imaging')}>🩻 Imaging {imaging.length > 0 && `(${imaging.length})`}</div>
          </div>
          {dxTab === 'labs' && (
            <div>
              {labs.map(lab => <MDMOrderCard key={lab.id} type="lab" onDelete={() => deleteOrder(lab.id, 'lab')} onAIInterpret={(d) => aiQ(`Interpret this lab: ${d.name}. Result: "${d.result || 'pending'}". ${d.reason || ''}`)} />)}
              <button className="mdm-add-btn" onClick={() => addOrder('lab')}>＋ Add Lab Order</button>
            </div>
          )}
          {dxTab === 'imaging' && (
            <div>
              {imaging.map(img => <MDMOrderCard key={img.id} type="imaging" onDelete={() => deleteOrder(img.id, 'imaging')} onAIInterpret={(d) => aiQ(`Interpret this imaging: ${d.name}. Result: "${d.result || 'pending'}". ${d.reason || ''}`)} />)}
              <button className="mdm-add-btn" onClick={() => addOrder('imaging')}>＋ Add Imaging Order</button>
            </div>
          )}
        </div>

        {/* EKG */}
        <div className="mdm-sec" id="mdm-sec-ekg">
          <div className="mdm-sec-hdr">
            <span style={{ fontSize: 16 }}>📈</span>
            <div><div className="mdm-sec-title">EKG Interpretation</div><div className="mdm-sec-sub">Structured 12-lead analysis</div></div>
            <button className="mdm-add-btn" style={{ width: 'auto', padding: '5px 12px', borderStyle: 'solid', marginTop: 0 }} onClick={addEKG}>＋ Add EKG</button>
          </div>
          {ekgs.map((ekg, i) => <MDMEKGCard key={ekg.id} num={i + 1} onDelete={() => deleteEKG(ekg.id)} onAIInterpret={(f) => aiQ(`Interpret EKG: Rate ${f.rate}, Rhythm: ${f.rhythm}, ST: ${f.st || 'none'}, QTc: ${f.qtc}.`)} />)}
        </div>

        {/* ED COURSE */}
        <div className="mdm-sec" id="mdm-sec-ed">
          <div className="mdm-sec-hdr">
            <span style={{ fontSize: 16 }}>⏱️</span>
            <div><div className="mdm-sec-title">ED Course & Management</div><div className="mdm-sec-sub">Chronological interventions and treatments</div></div>
          </div>
          <div className="mdm-timeline">
            {interventions.map(obj => (
              <div key={obj.id} className="mdm-tl-item">
                <div className={`mdm-tl-dot ${obj.type}`} />
                <div className="mdm-tl-body">
                  <div className="mdm-tl-hdr">
                    <span className="mdm-tl-time">{obj.time}</span>
                    <span className={`mdm-tl-badge ${obj.type}`}>{obj.type.toUpperCase()}</span>
                    <button className="mdm-tl-del" onClick={() => deleteIntervention(obj.id)}>✕</button>
                  </div>
                  <div className="mdm-tl-detail">{obj.detail}</div>
                  {obj.response && <div className={`mdm-tl-resp${obj.respType ? ' ' + obj.respType : ''}`}>→ {obj.response}</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="mdm-int-form">
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 110px', gap: 7, marginBottom: 7 }}>
              <div className="mdm-of"><label className="mdm-of-lbl">Time</label><input type="time" className="mdm-of-inp" value={intTime} onChange={e => setIntTime(e.target.value)} /></div>
              <div className="mdm-of"><label className="mdm-of-lbl">Intervention</label><input className="mdm-of-inp" value={intDetail} onChange={e => setIntDetail(e.target.value)} placeholder="e.g. IV Morphine 4mg…" onKeyDown={e => e.key === 'Enter' && addIntervention()} /></div>
              <div className="mdm-of"><label className="mdm-of-lbl">Category</label>
                <select className="mdm-of-sel" value={intType} onChange={e => setIntType(e.target.value)}>
                  <option value="med">Medication</option><option value="proc">Procedure</option>
                  <option value="fluid">Fluid</option><option value="consult">Consult</option>
                  <option value="result">Result</option><option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
              <div className="mdm-of" style={{ flex: 1 }}><label className="mdm-of-lbl">Response (optional)</label><input className="mdm-of-inp" value={intResponse} onChange={e => setIntResponse(e.target.value)} placeholder="e.g. Pain improved to 3/10…" /></div>
              <div className="mdm-of"><label className="mdm-of-lbl">Response Type</label>
                <select className="mdm-of-sel" style={{ width: 110 }} value={intRespType} onChange={e => setIntRespType(e.target.value)}>
                  <option value="">—</option><option value="improved">Improved</option><option value="unchanged">Unchanged</option><option value="deteriorated">Deteriorated</option>
                </select>
              </div>
              <button style={{ background: 'var(--teal)', color: '#050f1e', border: 'none', borderRadius: 'var(--r)', padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={addIntervention}>Add →</button>
            </div>
          </div>
        </div>

        {/* RESPONSE TO TREATMENT */}
        <div className="mdm-sec" id="mdm-sec-rtt">
          <div className="mdm-sec-hdr">
            <span style={{ fontSize: 16 }}>📉</span>
            <div><div className="mdm-sec-title">Overall Response to Treatment</div><div className="mdm-sec-sub">Patient's clinical trajectory during ED stay</div></div>
          </div>
          <div className="mdm-rtt-card">
            <div className="mdm-rtt-hdr">
              <span className="mdm-rtt-title">Clinical Status</span>
              <div className="mdm-rtt-btns">
                {['improved', 'unchanged', 'deteriorated'].map(v => (
                  <button key={v} className={`mdm-rtt-btn${rttStatus === v ? ` active-${v}` : ''}`} onClick={() => setRttStatus(v)}>
                    {v === 'improved' ? '✓ Improved' : v === 'unchanged' ? '→ Unchanged' : '↓ Deteriorated'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mdm-of" style={{ marginBottom: 8 }}><label className="mdm-of-lbl">Narrative response</label><textarea className="mdm-of-ta" rows={3} placeholder="Describe response to treatment…" /></div>
            <div className="mdm-of"><label className="mdm-of-lbl">Pending issues / concerns</label><textarea className="mdm-of-ta" rows={2} placeholder="Outstanding results, consultations awaited…" /></div>
          </div>
        </div>

        {/* IMPRESSIONS */}
        <div className="mdm-sec" id="mdm-sec-imp">
          <div className="mdm-sec-hdr">
            <span style={{ fontSize: 16 }}>🎯</span>
            <div><div className="mdm-sec-title">Clinical Impressions</div><div className="mdm-sec-sub">Initial working and final diagnosis with supporting evidence</div></div>
          </div>
          <div className="mdm-imp-grid">
            <MDMImpressionCard variant="initial" evidence={evInitial} onAddEvidence={(t, type) => addEvidence('initial', t, type)} onRemoveEvidence={i => removeEvidence('initial', i)} />
            <MDMImpressionCard variant="final" evidence={evFinal} onAddEvidence={(t, type) => addEvidence('final', t, type)} onRemoveEvidence={i => removeEvidence('final', i)} />
          </div>
        </div>

        {/* MDM COMPLEXITY */}
        <div className="mdm-sec" id="mdm-sec-cx">
          <div className="mdm-sec-hdr">
            <span style={{ fontSize: 16 }}>⚖️</span>
            <div><div className="mdm-sec-title">MDM Complexity (E/M)</div><div className="mdm-sec-sub">Per AMA E/M guidelines</div></div>
          </div>
          <div className="mdm-cx-grid">
            <div className="mdm-cx-card">
              <div className="mdm-cx-card-title">Overall MDM Level</div>
              <div className="mdm-cx-btns">
                {[['straight','Straightforward'],['low','Low'],['mod','Moderate'],['high','High']].map(([k, lbl]) => (
                  <button key={k} className={`mdm-cx-btn${mdmLevel === k ? ` active-${k}` : ''}`} onClick={() => setMdmLevel(k)}>{lbl}</button>
                ))}
              </div>
            </div>
            <div className="mdm-cx-card">
              <div className="mdm-cx-card-title">Data Reviewed</div>
              <div className="mdm-cx-check-list">
                {['Lab results reviewed','Imaging reviewed','EKG interpreted','Old records reviewed','Specialist consulted','Discussed with supervisor'].map(lbl => <MDMCXCheck key={lbl} label={lbl} />)}
              </div>
            </div>
            <div className="mdm-cx-card">
              <div className="mdm-cx-card-title">Risk of Complications</div>
              <div className="mdm-risk-grid2">
                {['Prescription drug mgmt','IV medications','Minor procedure','Major procedure','Drug therapy monitoring','Decision re: hospitalization','Emergency surgery','Elective major surgery'].map(lbl => <MDMRiskChip key={lbl} label={lbl} />)}
              </div>
            </div>
            <div className="mdm-cx-card">
              <div className="mdm-cx-card-title">Diagnoses Addressed</div>
              <div className="mdm-cx-check-list">
                {['New problem — no workup','New problem — workup planned','Established — stable','Established — worsening','Chronic illness exacerbation','Uncertain new problem'].map(lbl => <MDMCXCheck key={lbl} label={lbl} />)}
              </div>
            </div>
            <div className="mdm-result-box2">
              <div><div className="mdm-result-lbl">MDM Level</div>
                <div className={`mdm-result-lvl${currentMDM ? ' ' + currentMDM.cls : ''}`}>{currentMDM?.label || '—'}</div>
              </div>
              <div className="mdm-result-desc2">{currentMDM?.desc || 'Select level, data reviewed, and risk factors above.'}</div>
              <button style={{ background: 'rgba(0,229,192,.12)', border: '1px solid rgba(0,229,192,.3)', borderRadius: 'var(--r)', padding: '7px 14px', fontSize: 11, fontWeight: 600, color: 'var(--teal)', cursor: 'pointer' }} onClick={aiGenerateMDMNote}>✨ Generate MDM Note</button>
            </div>
          </div>
        </div>
      </main>

      {/* AI PANEL */}
      <aside className="mdm-ai-aside">
        <div className="mdm-ai-hdr">
          <div className="mdm-ai-hrow">
            <div className="mdm-ai-dot" />
            <div className="mdm-ai-title">Notrya AI — MDM</div>
            <div className="mdm-ai-model">claude-sonnet</div>
          </div>
          <div className="mdm-ai-qbtns">
            {[['📋 Workup', 'Review my diagnostic workup and suggest additional tests.'],
              ['🔀 DDx', 'List top 3 differentials with brief reasoning.'],
              ['🔬 Results', 'Explain clinical significance of abnormal findings.'],
              ['📝 Draft Note', aiGenerateMDMNote],
              ['⚖️ MDM Level', 'What MDM complexity level is appropriate?'],
            ].map(([label, action]) => (
              <button key={label} className="mdm-ai-qbtn" onClick={() => typeof action === 'string' ? aiQ(action) : action()}>{label}</button>
            ))}
          </div>
        </div>
        <div className="mdm-ai-chat" ref={aiMsgsRef}>
          {aiMessages.map((msg, i) => (
            <div key={i} className={`mdm-ai-msg ${msg.role}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
          {aiLoading && <div className="mdm-ai-loading"><div className="mdm-ai-tdot" /><div className="mdm-ai-tdot" /><div className="mdm-ai-tdot" /></div>}
        </div>
        <div className="mdm-ai-inp-wrap">
          <input className="mdm-ai-inp" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} placeholder="Ask a clinical question…" />
          <button className="mdm-ai-send" onClick={sendAI}>↑</button>
        </div>
      </aside>
    </div>
  );
}