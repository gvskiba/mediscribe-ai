import React, { useState, useEffect, useRef } from 'react';

const NAV_DATA = {
  intake: [
    { section: 'chart', abbr: 'Pc', icon: '📊', label: 'Patient Chart', dot: 'done' },
    { section: 'demographics', abbr: 'Dm', icon: '👤', label: 'Demographics', dot: 'partial' },
    { section: 'cc', abbr: 'Cc', icon: '💬', label: 'Chief Complaint', dot: 'empty' },
    { section: 'vitals', abbr: 'Vt', icon: '📈', label: 'Vitals', dot: 'empty' },
  ],
  documentation: [
    { section: 'meds', abbr: 'Rx', icon: '💊', label: 'Meds & PMH', dot: 'empty' },
    { section: 'ros', abbr: 'Rs', icon: '🔍', label: 'Review of Systems', dot: 'empty' },
    { section: 'exam', abbr: 'Pe', icon: '🩺', label: 'Physical Exam', dot: 'empty' },
    { section: 'mdm', abbr: 'Md', icon: '⚖️', label: 'MDM', dot: 'empty' },
  ],
  disposition: [
    { section: 'orders', abbr: 'Or', icon: '📋', label: 'Orders', dot: 'empty' },
    { section: 'discharge', abbr: 'Dc', icon: '🚪', label: 'Discharge', dot: 'empty' },
    { section: 'erplan', abbr: 'Ep', icon: '🗺️', label: 'ER Plan Builder', dot: 'empty' },
  ],
  tools: [
    { section: 'autocoder', abbr: 'Ac', icon: '🤖', label: 'AutoCoder', dot: 'empty' },
    { section: 'erx', abbr: 'Ex', icon: '💉', label: 'eRx', dot: 'empty' },
    { section: 'procedures', abbr: 'Pr', icon: '✂️', label: 'Procedures', dot: 'empty' },
  ],
};

const GROUP_META = [
  { key: 'intake', icon: '📋', label: 'Intake' },
  { key: 'documentation', icon: '🩺', label: 'Documentation' },
  { key: 'disposition', icon: '🚪', label: 'Disposition' },
  { key: 'tools', icon: '🔧', label: 'Tools' },
];

const ALL_SECTIONS = Object.values(NAV_DATA).flat();

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
:root {
  --bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;
  --border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;
  --teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;
  --green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;
  --txt3:#4a6a8a;--txt4:#2e4a6a;--icon-sb:56px;--top-h:88px;--bot-h:108px;--r:8px;--rl:12px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;overflow:hidden}
.icon-sidebar{position:fixed;top:0;left:0;bottom:0;width:var(--icon-sb);background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;z-index:200}
.isb-logo{width:100%;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border)}
.isb-logo-box{width:30px;height:30px;background:var(--blue);border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:white;cursor:pointer;transition:filter .15s}
.isb-logo-box:hover{filter:brightness(1.2)}
.isb-scroll{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;overflow-y:auto}
.isb-btn{width:42px;height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:6px;cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent;font-size:15px;background:none}
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
.nav-stat{display:flex;align-items:center;gap:5px;background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px;cursor:pointer;transition:border-color .15s}
.nav-stat:hover{border-color:var(--border-hi)}
.nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--txt)}
.nav-stat-val.alert{color:var(--gold)}
.nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2)}
.nav-ai-on{display:flex;align-items:center;gap:4px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--teal)}
.nav-ai-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:ai-pulse 2s ease-in-out infinite}
@keyframes ai-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.nav-new-pt{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s;white-space:nowrap;font-family:'DM Sans',sans-serif}
.nav-new-pt:hover{filter:brightness(1.15)}
.top-row-2{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.chart-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 8px;color:var(--teal);white-space:nowrap}
.pt-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);white-space:nowrap}
.pt-meta{font-size:11px;color:var(--txt3);white-space:nowrap}
.pt-cc{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--orange);white-space:nowrap}
.allergy-wrap{display:flex;align-items:center;gap:5px;background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.35);border-radius:6px;padding:3px 10px;cursor:pointer;flex-shrink:0;transition:background .15s}
.allergy-wrap:hover{background:rgba(255,107,107,.16)}
.allergy-icon{font-size:12px}
.allergy-lbl{font-size:9px;color:var(--coral);text-transform:uppercase;letter-spacing:.06em;font-weight:600;white-space:nowrap}
.allergy-pills{display:flex;gap:4px}
.allergy-pill{font-size:10px;font-weight:600;font-family:'JetBrains Mono',monospace;background:rgba(255,107,107,.2);color:var(--coral);border-radius:4px;padding:1px 6px;white-space:nowrap}
.allergy-pill.muted{background:rgba(74,106,138,.15);color:var(--txt3)}
.vb-div{width:1px;height:18px;background:var(--border);flex-shrink:0}
.vb-vital{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:10.5px;white-space:nowrap}
.vb-vital .lbl{color:var(--txt4);font-size:9px}
.vb-vital .val{color:var(--txt2)}
.vb-vital .val.abn{color:var(--coral);animation:glow-red 2s ease-in-out infinite}
.vb-vital .val.lo{color:var(--blue);animation:glow-blue 2s ease-in-out infinite}
@keyframes glow-red{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)}}
@keyframes glow-blue{0%,100%{text-shadow:0 0 4px rgba(59,158,255,.4)}50%{text-shadow:0 0 10px rgba(59,158,255,.9)}}
.status-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;white-space:nowrap}
.status-stable{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.status-unstable{background:rgba(255,107,107,.1);color:var(--coral);border:1px solid rgba(255,107,107,.3)}
.status-muted{background:rgba(74,106,138,.15);color:var(--txt3);border:1px solid var(--border)}
.status-room{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.chart-actions{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--txt2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}
.btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:filter .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-primary:hover{filter:brightness(1.15)}
.btn-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-coral:hover{background:rgba(255,107,107,.25)}
.main-wrap{position:fixed;top:var(--top-h);left:var(--icon-sb);right:0;bottom:var(--bot-h);display:flex}
.content{flex:1;overflow-y:auto;padding:18px 28px 30px;display:flex;flex-direction:column;gap:18px}
.page-header{display:flex;align-items:center;gap:10px}
.page-header-icon{font-size:20px}
.page-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:var(--txt)}
.page-subtitle{font-size:12px;color:var(--txt3);margin-top:1px}
.page-header-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.section-box{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.sec-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.sec-icon{font-size:16px}
.sec-title{font-size:14px;font-weight:600;color:var(--txt)}
.sec-subtitle{font-size:11px;color:var(--txt3);margin-top:1px}
.badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;margin-left:auto}
.badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.field{display:flex;flex-direction:column;gap:3px}
.field-label{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;font-weight:500}
.field-input,.field-select,.field-textarea{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%}
.field-input:focus,.field-select:focus,.field-textarea:focus{border-color:var(--blue)}
.field-input::placeholder,.field-textarea::placeholder{color:var(--txt4)}
.field-textarea{resize:vertical;min-height:70px;padding:8px 10px;line-height:1.5}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
.col-full{grid-column:1/-1}
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);transition:all .15s;user-select:none}
.chip:hover{border-color:var(--border-hi);color:var(--txt)}
.chip.selected{background:rgba(59,158,255,.15);border-color:var(--blue);color:var(--blue)}
.chips-row{display:flex;gap:6px;flex-wrap:wrap}
.bottom-nav{position:fixed;bottom:0;left:var(--icon-sb);right:0;height:var(--bot-h);background:var(--bg-panel);border-top:1px solid var(--border);z-index:100;display:flex;flex-direction:column}
.bn-sub-wrap{position:relative;flex-shrink:0;height:44px}
.bn-sub-wrap::before,.bn-sub-wrap::after{content:'';position:absolute;top:0;bottom:0;width:24px;z-index:2;pointer-events:none}
.bn-sub-wrap::before{left:0;background:linear-gradient(90deg,var(--bg-panel),transparent)}
.bn-sub-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg-panel),transparent)}
.bn-sub-row{height:44px;display:flex;align-items:center;padding:0 12px;gap:6px;overflow-x:auto;overflow-y:hidden;border-bottom:1px solid rgba(26,53,85,.4);scrollbar-width:none}
.bn-sub-row::-webkit-scrollbar{display:none}
.bn-sub-pill{display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;color:var(--txt3);background:transparent;border:1px solid transparent;cursor:pointer;transition:all .2s ease;white-space:nowrap;flex-shrink:0;font-family:'DM Sans',sans-serif}
.bn-sub-pill:hover{color:var(--txt2);background:var(--bg-up);border-color:var(--border)}
.bn-sub-pill.active{color:var(--blue);background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.35);font-weight:600}
.pill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.pill-dot.done{background:var(--teal);box-shadow:0 0 4px rgba(0,229,192,.5)}
.pill-dot.partial{background:var(--orange)}
.pill-dot.empty{background:var(--txt4)}
.bn-groups{height:64px;flex-shrink:0;display:flex;align-items:stretch}
.bn-group-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;position:relative;transition:all .2s ease;border:none;background:none;font-family:'DM Sans',sans-serif;padding:6px 0}
.bn-group-tab::before{content:'';position:absolute;top:0;left:20%;right:20%;height:2px;background:var(--blue);border-radius:0 0 2px 2px;transform:scaleX(0);transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.bn-group-tab.active::before{transform:scaleX(1)}
.bn-group-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:transparent;border:1px solid transparent;transition:all .2s ease;position:relative}
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
.n-fab{position:fixed;bottom:124px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--teal) 0%,#00b4d8 100%);box-shadow:0 6px 24px rgba(0,229,192,.35);transition:all .35s cubic-bezier(.34,1.56,.64,1);animation:n-ring 3s ease-in-out infinite;font-size:24px;font-family:inherit}
.n-fab:hover{transform:scale(1.12)}
.n-fab.open{animation:none;background:linear-gradient(135deg,var(--coral),#e05555);box-shadow:0 6px 24px rgba(255,107,107,.35);transform:rotate(90deg)}
.n-fab.open:hover{transform:rotate(90deg) scale(1.12)}
@keyframes n-ring{0%,100%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 0 rgba(0,229,192,.28)}50%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 12px rgba(0,229,192,0)}}
.n-fab-badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:var(--coral);color:#fff;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center;border:2.5px solid var(--bg);padding:0 5px;font-family:'JetBrains Mono',monospace}
.n-fab-badge.show{display:flex}
.n-overlay{position:fixed;bottom:194px;right:24px;z-index:9998;width:340px;height:520px;background:#081628;border:1px solid var(--border);border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);opacity:0;transform:translateY(20px) scale(.94);pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1)}
.n-overlay.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.n-hdr{padding:16px 16px 12px;flex-shrink:0;border-bottom:1px solid var(--border)}
.n-hdr-top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.n-avatar{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--teal),var(--blue));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.n-hdr-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--txt)}
.n-hdr-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt3);margin-top:2px;display:flex;align-items:center;gap:4px}
.n-hdr-sub .dot{width:5px;height:5px;border-radius:50%;background:var(--teal)}
.n-close{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg-up);color:var(--txt3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;margin-left:auto;font-family:'DM Sans',sans-serif}
.n-close:hover{border-color:var(--border-hi);color:var(--txt2)}
.n-quick{display:flex;flex-wrap:wrap;gap:5px}
.n-qbtn{padding:5px 11px;border-radius:20px;font-size:11px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all .2s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2)}
.n-qbtn:hover{border-color:rgba(0,229,192,.4);color:var(--teal);background:rgba(0,229,192,.06)}
.n-qbtn:disabled{opacity:.4;cursor:not-allowed}
.n-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.n-msgs::-webkit-scrollbar{width:4px}
.n-msgs::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.n-msg{padding:10px 13px;border-radius:12px;font-size:12.5px;line-height:1.65;max-width:88%;animation:msgIn .3s ease both;font-family:'DM Sans',sans-serif}
@keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.n-msg.sys{background:rgba(14,37,68,.6);color:var(--txt3);border:1px solid rgba(26,53,85,.5);align-self:center;max-width:100%;text-align:center;font-size:11px;font-style:italic;border-radius:8px}
.n-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.22);color:var(--txt);align-self:flex-end;border-radius:14px 14px 3px 14px}
.n-msg.bot{background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.15);color:var(--txt);align-self:flex-start;border-radius:14px 14px 14px 3px}
.n-dots{display:flex;gap:5px;padding:12px 14px;align-self:flex-start;align-items:center}
.n-dots span{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:bounce 1.2s ease-in-out infinite}
.n-dots span:nth-child(2){animation-delay:.15s}
.n-dots span:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-7px);opacity:1}}
.n-input-bar{padding:10px 14px 16px;flex-shrink:0;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end}
.n-ta{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:12px;padding:9px 13px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none;resize:none;min-height:40px;max-height:90px;line-height:1.5;transition:border-color .2s}
.n-ta:focus{border-color:var(--teal)}
.n-ta::placeholder{color:var(--txt4)}
.n-ta:disabled{opacity:.5}
.n-send{width:40px;height:40px;flex-shrink:0;background:linear-gradient(135deg,var(--teal),#00b4d8);border:none;border-radius:12px;color:var(--bg);font-size:18px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;font-family:inherit}
.n-send:hover{transform:scale(1.08)}
.n-send:disabled{opacity:.4;cursor:not-allowed;transform:none}
`;

export default function BaseTemplate() {
  const [patient, setPatient] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    dob: '',
    age: '',
    sex: '',
    room: '',
    chiefComplaint: '',
    vitals: { bp: '', hr: '', rr: '', spo2: '', temp: '', gcs: '' },
    allergies: [],
  });

  const [navDots, setNavDots] = useState({});
  const [activeGroup, setActiveGroup] = useState('intake');
  const [activeSection, setActiveSection] = useState('demographics');
  const [clock, setClock] = useState('00:00');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [aiHistory, setAiHistory] = useState([]);
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'Notrya AI ready — select a quick action or ask a clinical question.' }]);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoAllergies, setDemoAllergies] = useState([]);
  const aiInputRef = useRef(null);
  const aiMsgsRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'));
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const getGroupBadge = (key) => {
    const items = NAV_DATA[key];
    if (items.every(i => navDots[i.section] === 'done')) return 'done';
    if (items.some(i => navDots[i.section] === 'done' || navDots[i.section] === 'partial')) return 'partial';
    return 'empty';
  };

  const handleSelectSection = (sectionId) => {
    setActiveSection(sectionId);
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === sectionId)) {
        setActiveGroup(group);
        break;
      }
    }
  };

  const handleToggleChip = (e) => {
    e.currentTarget.classList.toggle('selected');
  };

  const addAiMsg = (role, text) => {
    setAiMessages(prev => [...prev, { role, text }]);
    if (!aiOpen) setUnread(u => u + 1);
  };

  const handleSendAI = async () => {
    const text = aiInputRef.current?.value.trim();
    if (!text || aiLoading) return;
    aiInputRef.current.value = '';
    addAiMsg('user', text);
    setAiLoading(true);

    const cur = ALL_SECTIONS.find(s => s.section === activeSection);
    const ctx = `=== PAGE CONTEXT ===\nActive section: ${cur?.label || 'Unknown'}\nGroup: ${activeGroup}\n====================`;
    const newHistory = [...aiHistory, { role: 'user', content: ctx + '\n\n' + text }];
    setAiHistory(newHistory);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: "You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2–4 concise, actionable sentences. Be direct. Never fabricate data.",
          messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'No response received.';
      setAiHistory([...newHistory, { role: 'assistant', content: reply }]);
      addAiMsg('bot', reply);
    } catch (e) {
      addAiMsg('sys', '⚠ Connection error — please try again.');
    }
    setAiLoading(false);
  };

  const handleApplyDemo = () => {
    setPatient(prev => ({
      ...prev,
      firstName: document.getElementById('d-first')?.value.trim() || '',
      lastName: document.getElementById('d-last')?.value.trim() || '',
      age: document.getElementById('d-age')?.value.trim() || '',
      sex: document.getElementById('d-sex')?.value || '',
      room: document.getElementById('d-room')?.value.trim() || '',
      chiefComplaint: document.getElementById('d-cc')?.value.trim() || '',
      vitals: {
        bp: document.getElementById('d-bp')?.value.trim() || '',
        hr: document.getElementById('d-hr')?.value.trim() || '',
        rr: document.getElementById('d-rr')?.value.trim() || '',
        spo2: document.getElementById('d-spo2')?.value.trim() || '',
        temp: document.getElementById('d-temp')?.value.trim() || '',
        gcs: document.getElementById('d-gcs')?.value.trim() || '',
      },
      allergies: demoAllergies,
      patientId: document.getElementById('pt-chart')?.textContent?.trim() || `PT-${Date.now().toString().slice(-5)}`,
    }));
    setDemoOpen(false);
    addAiMsg('sys', `✅ Chart updated`);
  };

  const p = patient;
  const v = p.vitals;
  const hr = parseInt(v.hr);
  const spo2 = parseInt(v.spo2);
  const hasVitals = Object.values(v).some(x => x && x !== '');
  const unstable = (hr > 120) || (spo2 < 93 && v.spo2);
  const cur = ALL_SECTIONS.find(s => s.section === activeSection);

  const pillItems = NAV_DATA[activeGroup] || [];
  const groupBadges = { intake: getGroupBadge('intake'), documentation: getGroupBadge('documentation'), disposition: getGroupBadge('disposition'), tools: getGroupBadge('tools') };

  return (
    <>
      <style>{STYLES}</style>

      <aside className="icon-sidebar">
        <div className="isb-logo">
          <div className="isb-logo-box">{cur?.abbr || 'Dm'}</div>
        </div>
        <div className="isb-scroll">
          {[{ icon: '🏠', label: 'Home' }, { icon: '📊', label: 'Dash' }, { icon: '👥', label: 'Patients', active: true }, { icon: '🔄', label: 'Shift' }].map(b => (
            <button key={b.label} className={`isb-btn${b.active ? ' active' : ''}`} title={b.label}>{b.icon}<span className="isb-lbl">{b.label}</span></button>
          ))}
        </div>
        <div className="isb-bottom">
          <button className="isb-btn" title="Settings">⚙️<span className="isb-lbl">Settings</span></button>
        </div>
      </aside>

      <header className="top-bar">
        <div className="top-row-1">
          <span className="nav-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span>
          <div className="nav-sep"></div>
          <div className="nav-stat"><span className="nav-stat-val">0</span><span className="nav-stat-lbl">Active</span></div>
          <div className="nav-stat"><span className="nav-stat-val alert">14</span><span className="nav-stat-lbl">Pending</span></div>
          <div className="nav-stat"><span className="nav-stat-val">—</span><span className="nav-stat-lbl">Orders</span></div>
          <div className="nav-stat"><span className="nav-stat-val">11.6</span><span className="nav-stat-lbl">Hours</span></div>
          <div className="nav-right">
            <div className="nav-time">{clock}</div>
            <div className="nav-ai-on"><div className="nav-ai-dot"></div> AI ON</div>
            <button className="nav-new-pt" onClick={() => setDemoOpen(true)}>+ New Patient</button>
          </div>
        </div>

        <div className="top-row-2">
          <span className="chart-badge" id="pt-chart">{p.patientId || 'PT-NEW'}</span>
          <span className="pt-name">{p.lastName ? `${p.lastName}, ${(p.firstName || '').charAt(0)}.` : '— Patient —'}</span>
          <span className="pt-meta">{[p.age ? `${p.age}y` : null, p.sex || null].filter(Boolean).join(' · ') || 'Age · Sex'}</span>
          <span className="pt-cc">{p.chiefComplaint ? `CC: ${p.chiefComplaint}` : 'CC: —'}</span>
          <div className="allergy-wrap" onClick={() => handleSelectSection('meds')}>
            <span className="allergy-icon">⚠️</span>
            <span className="allergy-lbl">Allergies</span>
            <div className="allergy-pills">
              {p.allergies.length === 0 ? <span className="allergy-pill muted">None</span> : p.allergies.slice(0, 3).map(a => <span key={a} className="allergy-pill">{a}</span>)}
              {p.allergies.length > 3 && <span className="allergy-pill">+{p.allergies.length - 3}</span>}
            </div>
          </div>
          <div className="vb-div"></div>
          <div className="vb-vital"><span className="lbl">BP</span><span className="val">{v.bp || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">HR</span><span className={`val${hr > 120 ? ' abn' : ''}`}>{v.hr || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">RR</span><span className="val">{v.rr || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">SpO₂</span><span className={`val${spo2 < 93 && v.spo2 ? ' lo' : ''}`}>{v.spo2 || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">T</span><span className="val">{v.temp || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">GCS</span><span className="val">{v.gcs || '—'}</span></div>
          <div className="vb-div"></div>
          <span className={`status-badge ${!hasVitals ? 'status-muted' : unstable ? 'status-unstable' : 'status-stable'}`}>{!hasVitals ? 'NO DATA' : unstable ? 'UNSTABLE' : 'STABLE'}</span>
          <span className="status-badge status-room">{p.room ? `Room ${p.room}` : 'Room —'}</span>
          <div className="chart-actions">
            <button className="btn-ghost">📋 Orders</button>
            <button className="btn-ghost">📝 SOAP Note</button>
            <button className="btn-coral">🚪 Discharge</button>
            <button className="btn-primary">💾 Save Chart</button>
          </div>
        </div>
      </header>

      <div className="main-wrap">
        <main className="content">
          <div className="page-header">
            <span className="page-header-icon">👤</span>
            <div><div className="page-title">{cur?.label || 'Demographics'}</div><div className="page-subtitle">Core patient identity and registration details</div></div>
            <div className="page-header-right"><button className="btn-ghost">+ Add Item</button></div>
          </div>
          <div className="section-box">
            <div className="sec-header"><span className="sec-icon">👤</span><div><div className="sec-title">Patient Identity</div><div className="sec-subtitle">Name, date of birth, and identifiers</div></div><span className="badge badge-teal">ACTIVE</span></div>
            <div className="grid-2">
              <div className="field"><label className="field-label">First Name</label><input type="text" className="field-input" placeholder="Enter first name…" /></div>
              <div className="field"><label className="field-label">Last Name</label><input type="text" className="field-input" placeholder="Enter last name…" /></div>
              <div className="field"><label className="field-label">Date of Birth</label><input type="date" className="field-input" /></div>
              <div className="field"><label className="field-label">Sex</label><select className="field-select"><option>— Select —</option><option>Male</option><option>Female</option></select></div>
              <div className="field col-full"><label className="field-label">Chief Complaint</label><input type="text" className="field-input" placeholder="e.g. Chest pain…" /></div>
            </div>
          </div>
        </main>
      </div>

      <div className={`n-scrim${aiOpen ? ' open' : ''}`} onClick={() => setAiOpen(false)}></div>
      <div className={`n-overlay${aiOpen ? ' open' : ''}`}>
        <div className="n-hdr">
          <div className="n-hdr-top">
            <div className="n-avatar">🤖</div>
            <div><div className="n-hdr-name">Notrya AI</div><div className="n-hdr-sub"><span className="dot"></span> claude-sonnet-4 · online</div></div>
            <button className="n-close" onClick={() => setAiOpen(false)}>✕</button>
          </div>
          <div className="n-quick">
            <button className="n-qbtn" onClick={() => { aiInputRef.current.value = 'Summarise what I have entered so far.'; handleSendAI(); }}>📋 Summarise</button>
            <button className="n-qbtn" onClick={() => { aiInputRef.current.value = 'What am I missing?'; handleSendAI(); }}>🔍 Check</button>
            <button className="n-qbtn" onClick={() => { aiInputRef.current.value = 'Generate a draft note.'; handleSendAI(); }}>📝 Draft Note</button>
            <button className="n-qbtn" onClick={() => { aiInputRef.current.value = 'Suggest differentials.'; handleSendAI(); }}>🧠 DDx</button>
          </div>
        </div>
        <div className="n-msgs" ref={aiMsgsRef}>
          {aiMessages.map((msg, i) => (
            <div key={i} className={`n-msg ${msg.role}`}>{msg.text}</div>
          ))}
          {aiLoading && <div className="n-dots"><span></span><span></span><span></span></div>}
        </div>
        <div className="n-input-bar">
          <textarea ref={aiInputRef} className="n-ta" rows="1" placeholder="Ask anything…" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendAI())} />
          <button className="n-send" onClick={handleSendAI} disabled={aiLoading || !aiInputRef.current?.value.trim()}>↑</button>
        </div>
      </div>

      <button className={`n-fab${aiOpen ? ' open' : ''}`} onClick={() => setAiOpen(!aiOpen)}>
        {aiOpen ? '✕' : '🤖'}
        {unread > 0 && <span className={`n-fab-badge${unread > 0 ? ' show' : ''}`}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      <nav className="bottom-nav">
        <div className="bn-sub-wrap">
          <div className="bn-sub-row">
            {pillItems.map(item => (
              <button key={item.section} className={`bn-sub-pill${item.section === activeSection ? ' active' : ''}`} onClick={() => handleSelectSection(item.section)}>
                <span>{item.icon}</span>{item.label}<span className={`pill-dot ${navDots[item.section] || item.dot || 'empty'}`}></span>
              </button>
            ))}
          </div>
        </div>
        <div className="bn-groups">
          {GROUP_META.map(g => (
            <button key={g.key} className={`bn-group-tab${g.key === activeGroup ? ' active' : ''}`} onClick={() => setActiveGroup(g.key)}>
              <div className="bn-group-icon">{g.icon}<span className={`bn-group-badge ${groupBadges[g.key] || 'empty'}`}></span></div>
              <span className="bn-group-label">{g.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {demoOpen && (
        <>
          <div className="demo-overlay" onClick={() => setDemoOpen(false)}></div>
          <div className="demo-panel">
            <h2>🏥 New Patient Input</h2>
            <p>Fill in details — the top bar updates live.</p>
            <div className="demo-grid">
              <div className="demo-field"><label>First Name</label><input id="d-first" placeholder="e.g. Hiroshi" /></div>
              <div className="demo-field"><label>Last Name</label><input id="d-last" placeholder="e.g. Nakamura" /></div>
              <div className="demo-field"><label>Age</label><input id="d-age" type="number" placeholder="e.g. 67" /></div>
              <div className="demo-field"><label>Sex</label><select id="d-sex"><option>M</option><option>F</option></select></div>
              <div className="demo-field"><label>Room</label><input id="d-room" placeholder="e.g. 4B" /></div>
              <div className="demo-field"><label>CC</label><input id="d-cc" placeholder="e.g. Chest pain" /></div>
              <div className="demo-field"><label>BP</label><input id="d-bp" placeholder="e.g. 142/88" /></div>
              <div className="demo-field"><label>HR</label><input id="d-hr" type="number" placeholder="e.g. 98" /></div>
              <div className="demo-field"><label>RR</label><input id="d-rr" type="number" placeholder="e.g. 18" /></div>
              <div className="demo-field"><label>SpO₂</label><input id="d-spo2" type="number" placeholder="e.g. 97" /></div>
              <div className="demo-field"><label>Temp</label><input id="d-temp" placeholder="e.g. 37.1" /></div>
              <div className="demo-field"><label>GCS</label><input id="d-gcs" type="number" placeholder="e.g. 15" /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="demo-close" onClick={() => setDemoOpen(false)}>Cancel</button>
              <button className="demo-apply" onClick={handleApplyDemo}>✓ Apply to Chart</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}