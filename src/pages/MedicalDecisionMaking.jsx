import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/* ─── tiny helpers ─────────────────────────────────── */
const nowHHMM = () => {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
};

/* ─── CSS injected once ─────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
.mdm-root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;position:fixed;top:48px;left:0;right:0;bottom:0;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;display:flex;flex-direction:column;overflow:hidden;z-index:10;}
.mdm-root *{box-sizing:border-box;}
/* sub navbar */
.mdm-subnav{background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;height:42px;flex-shrink:0;}
.mdm-subnav-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-0.5px;}
.mdm-subnav-sep{color:var(--txt4);font-size:14px;}
.mdm-subnav-title{font-size:13px;color:var(--txt2);font-weight:500;}
.mdm-subnav-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace;}
/* vitals */
.mdm-vitals{background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:10px;height:38px;flex-shrink:0;overflow:hidden;}
.vb-name{font-family:'Playfair Display',serif;font-size:14px;color:var(--txt);font-weight:600;white-space:nowrap;}
.vb-meta{font-size:11px;color:var(--txt3);white-space:nowrap;}
.vb-div{width:1px;height:20px;background:var(--border);flex-shrink:0;}
.vb-vital{display:flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:11px;white-space:nowrap;}
.vb-vital .lbl{color:var(--txt3);font-size:10px;}
.vb-vital .val{color:var(--txt2);}
.vb-mdm-badge{font-size:11px;font-weight:600;border-radius:20px;padding:2px 10px;font-family:'JetBrains Mono',monospace;}
.vb-mdm-badge.low{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3);}
.vb-mdm-badge.mod{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3);}
.vb-mdm-badge.high{background:rgba(255,107,107,.12);color:var(--coral);border:1px solid rgba(255,107,107,.3);}
/* main wrap */
.mdm-main{flex:1;display:flex;overflow:hidden;min-height:0;}
/* sidebar */
.mdm-sidebar{flex:0 0 220px;background:var(--bg-panel);border-right:1px solid var(--border);overflow-y:auto;padding:14px 10px;display:flex;flex-direction:column;gap:6px;}
.sb-patient-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px;margin-bottom:6px;}
.sb-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--txt);}
.sb-meta{font-size:11px;color:var(--txt3);margin-top:3px;}
.sb-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:4px;}
.sb-nav-btn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2);background:none;}
.sb-nav-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt);}
.sb-nav-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue);}
.sb-dot{width:7px;height:7px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0;}
.sb-dot.done{background:var(--teal);box-shadow:0 0 6px rgba(0,229,192,.5);}
.sb-dot.partial{background:var(--orange);box-shadow:0 0 6px rgba(255,159,67,.5);}
.sb-divider{height:1px;background:var(--border);margin:8px 0;}
.sb-mdm-progress{padding:8px 10px;background:var(--bg-card);border-radius:var(--r);border:1px solid var(--border);}
.sb-mdm-title{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;}
.sb-mdm-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;}
.sb-mdm-key{font-size:11px;color:var(--txt2);}
.sb-mdm-val{font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--txt3);}
.sb-mdm-val.filled{color:var(--teal);}
/* content */
.mdm-content{flex:1;overflow-y:auto;padding:18px 20px 30px;display:flex;flex-direction:column;gap:20px;}
.section-box{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px;}
.sec-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.sec-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--txt);}
.sec-subtitle{font-size:12px;color:var(--txt3);margin-top:1px;}
/* dx tabs */
.dx-tabs{display:flex;gap:4px;margin-bottom:14px;}
.dx-tab{padding:6px 16px;border-radius:var(--r);cursor:pointer;font-size:12px;font-weight:500;border:1px solid var(--border);color:var(--txt2);background:var(--bg-card);transition:all .15s;}
.dx-tab:hover{border-color:var(--border-hi);color:var(--txt);}
.dx-tab.active{background:rgba(59,158,255,.12);border-color:rgba(59,158,255,.4);color:var(--blue);}
/* order cards */
.order-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);overflow:hidden;transition:border-color .2s;margin-bottom:10px;}
.order-card:hover{border-color:var(--border-hi);}
.order-card.status-resulted{border-left:3px solid var(--teal);}
.order-card.status-critical{border-left:3px solid var(--coral);}
.order-card.status-pending{border-left:3px solid var(--txt3);}
.order-card.status-abnormal{border-left:3px solid var(--orange);}
.order-header{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;user-select:none;}
.order-name{font-weight:600;font-size:13px;color:var(--txt);flex:1;}
.order-status{font-size:10px;font-family:'JetBrains Mono',monospace;padding:2px 8px;border-radius:20px;font-weight:600;flex-shrink:0;}
.order-status.pending{background:rgba(74,106,138,.3);color:var(--txt3);}
.order-status.resulted{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.25);}
.order-status.abnormal{background:rgba(255,159,67,.12);color:var(--orange);border:1px solid rgba(255,159,67,.25);}
.order-status.critical{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);}
.order-body{padding:0 14px 14px;}
.order-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.order-field{display:flex;flex-direction:column;gap:4px;}
.of-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;}
.of-input{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%;}
.of-input:focus{border-color:var(--blue);}
.of-textarea{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:60px;width:100%;transition:border-color .15s;line-height:1.5;}
.of-textarea:focus{border-color:var(--blue);}
.of-select{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%;}
.of-select:focus{border-color:var(--blue);}
.order-ai-btn{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.25);border-radius:var(--r);padding:5px 12px;font-size:11px;color:var(--teal);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;}
.order-ai-btn:hover{background:rgba(0,229,192,.18);}
.order-del-btn{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.2);border-radius:var(--r);padding:5px 10px;font-size:11px;color:var(--coral);cursor:pointer;transition:all .15s;margin-left:auto;}
.order-del-btn:hover{background:rgba(255,107,107,.18);}
.add-order-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;border:1px dashed var(--border);border-radius:var(--rl);background:transparent;color:var(--txt3);font-size:12px;cursor:pointer;transition:all .15s;width:100%;margin-top:8px;}
.add-order-btn:hover{border-color:var(--blue);color:var(--blue);background:rgba(59,158,255,.05);}
/* ekg grid */
.ekg-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
/* timeline */
.timeline{display:flex;flex-direction:column;gap:0;position:relative;}
.timeline::before{content:'';position:absolute;left:18px;top:20px;bottom:20px;width:1px;background:var(--border);}
.tl-item{display:flex;gap:14px;align-items:flex-start;padding:8px 0;position:relative;}
.tl-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;margin-top:3px;border:2px solid var(--bg-card);z-index:1;}
.tl-dot.med{background:var(--blue);}
.tl-dot.proc{background:var(--purple);}
.tl-dot.fluid{background:var(--cyan);}
.tl-dot.consult{background:var(--gold);}
.tl-dot.result{background:var(--teal);}
.tl-dot.other{background:var(--txt3);}
.tl-body{flex:1;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;}
.tl-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.tl-time{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt3);}
.tl-type-badge{font-size:10px;padding:1px 7px;border-radius:20px;font-weight:600;font-family:'JetBrains Mono',monospace;}
.tl-type-badge.med{background:rgba(59,158,255,.15);color:var(--blue);}
.tl-type-badge.proc{background:rgba(155,109,255,.15);color:var(--purple);}
.tl-type-badge.fluid{background:rgba(0,212,255,.15);color:var(--cyan);}
.tl-type-badge.consult{background:rgba(245,200,66,.15);color:var(--gold);}
.tl-type-badge.result{background:rgba(0,229,192,.15);color:var(--teal);}
.tl-type-badge.other{background:rgba(74,106,138,.2);color:var(--txt2);}
.tl-del{margin-left:auto;background:none;border:none;color:var(--txt4);cursor:pointer;font-size:13px;padding:0 2px;}
.tl-del:hover{color:var(--coral);}
.tl-detail{font-size:13px;color:var(--txt);line-height:1.4;}
.tl-response{margin-top:5px;font-size:12px;color:var(--txt3);font-style:italic;}
.tl-response.improved{color:var(--teal);}
.tl-response.unchanged{color:var(--gold);}
.tl-response.deteriorated{color:var(--coral);}
.add-int-form{background:var(--bg-card);border:1px dashed var(--border);border-radius:var(--rl);padding:12px 14px;margin-top:8px;}
/* impressions */
.impression-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.impression-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:16px;}
.impression-card.initial{border-top:2px solid var(--gold);}
.impression-card.final{border-top:2px solid var(--teal);}
.imp-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px;}
.imp-label.initial{color:var(--gold);}
.imp-label.final{color:var(--teal);}
.imp-dx-input{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;color:var(--txt);font-family:'Playfair Display',serif;font-size:15px;outline:none;width:100%;transition:border-color .15s;margin-bottom:10px;}
.imp-dx-input:focus{border-color:var(--gold);}
.impression-card.final .imp-dx-input:focus{border-color:var(--teal);}
.evidence-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
.evidence-chips{display:flex;flex-wrap:wrap;gap:5px;min-height:28px;}
.ev-chip{display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;transition:all .15s;user-select:none;border:1px solid;}
.ev-chip.lab{background:rgba(59,158,255,.12);color:var(--blue);border-color:rgba(59,158,255,.3);}
.ev-chip.imaging{background:rgba(155,109,255,.12);color:var(--purple);border-color:rgba(155,109,255,.3);}
.ev-chip.vital{background:rgba(255,107,107,.12);color:var(--coral);border-color:rgba(255,107,107,.3);}
.ev-chip.hx{background:rgba(245,200,66,.12);color:var(--gold);border-color:rgba(245,200,66,.3);}
.ev-chip.exam{background:rgba(0,229,192,.12);color:var(--teal);border-color:rgba(0,229,192,.3);}
.ev-chip.ekg{background:rgba(255,159,67,.12);color:var(--orange);border-color:rgba(255,159,67,.3);}
.add-ev-row{display:flex;gap:6px;margin-top:6px;}
.add-ev-input{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 9px;color:var(--txt);font-size:12px;outline:none;}
.add-ev-input:focus{border-color:var(--border-hi);}
.add-ev-type{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 7px;color:var(--txt2);font-size:11px;cursor:pointer;outline:none;}
.add-ev-btn{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 10px;color:var(--txt2);font-size:11px;cursor:pointer;transition:all .15s;}
.add-ev-btn:hover{border-color:var(--border-hi);color:var(--txt);}
.imp-rationale{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;resize:vertical;min-height:70px;width:100%;line-height:1.5;margin-top:8px;transition:border-color .15s;}
.imp-rationale:focus{border-color:var(--border-hi);}
.imp-icd-row{display:grid;grid-template-columns:1fr 120px;gap:8px;margin-top:8px;}
/* mdm */
.mdm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.mdm-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:14px;}
.mdm-card-title{font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;}
.complexity-selector{display:flex;gap:6px;flex-wrap:wrap;}
.complexity-btn{flex:1;padding:8px 6px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);font-size:11px;font-weight:600;cursor:pointer;text-align:center;transition:all .2s;text-transform:uppercase;letter-spacing:.04em;}
.complexity-btn:hover{border-color:var(--border-hi);color:var(--txt);}
.complexity-btn.active-straight{background:rgba(0,229,192,.12);border-color:var(--teal);color:var(--teal);}
.complexity-btn.active-low{background:rgba(59,158,255,.12);border-color:var(--blue);color:var(--blue);}
.complexity-btn.active-mod{background:rgba(245,200,66,.12);border-color:var(--gold);color:var(--gold);}
.complexity-btn.active-high{background:rgba(255,107,107,.12);border-color:var(--coral);color:var(--coral);}
.mdm-check-list{display:flex;flex-direction:column;gap:5px;}
.mdm-check-item{display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 6px;border-radius:6px;transition:background .1s;}
.mdm-check-item:hover{background:var(--bg-up);}
.mdm-check-item input[type="checkbox"]{accent-color:var(--blue);width:13px;height:13px;cursor:pointer;}
.mdm-check-label{font-size:12px;color:var(--txt2);}
.mdm-check-label.checked{color:var(--teal);text-decoration:line-through;text-decoration-color:rgba(0,229,192,.4);}
.mdm-risk-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.risk-chip{padding:6px 10px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);font-size:11px;cursor:pointer;text-align:center;transition:all .15s;}
.risk-chip:hover{border-color:var(--border-hi);}
.risk-chip.selected{background:rgba(255,107,107,.12);border-color:var(--coral);color:var(--coral);}
.mdm-result-box{grid-column:1/-1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--rl);padding:12px 16px;display:flex;align-items:center;gap:14px;}
.mdm-result-label{font-size:11px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;}
.mdm-result-level{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;}
.mdm-result-level.straight{color:var(--teal);}
.mdm-result-level.low{color:var(--blue);}
.mdm-result-level.mod{color:var(--gold);}
.mdm-result-level.high{color:var(--coral);text-shadow:0 0 12px rgba(255,107,107,.4);}
.mdm-result-desc{font-size:12px;color:var(--txt3);flex:1;}
/* rtt */
.rtt-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:16px;}
.rtt-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.rtt-title{font-size:13px;font-weight:600;color:var(--txt);}
.rtt-status-btns{display:flex;gap:6px;margin-left:auto;}
.rtt-btn{padding:4px 12px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;}
.rtt-btn.active-improved{background:rgba(0,229,192,.12);border-color:var(--teal);color:var(--teal);}
.rtt-btn.active-unchanged{background:rgba(245,200,66,.12);border-color:var(--gold);color:var(--gold);}
.rtt-btn.active-deteriorated{background:rgba(255,107,107,.12);border-color:var(--coral);color:var(--coral);}
/* ai panel */
.ai-panel{flex:0 0 295px;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.ai-header{padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0;}
.ai-header-top{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ai-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);flex-shrink:0;animation:ai-pulse 2s ease-in-out infinite;}
@keyframes ai-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
.ai-label{font-size:12px;font-weight:600;color:var(--txt2);}
.ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3);}
.ai-quick-btns{display:flex;flex-wrap:wrap;gap:4px;}
.ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;transition:all .15s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);}
.ai-qbtn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.06);}
.ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;}
.ai-msg{padding:9px 11px;border-radius:var(--r);font-size:12px;line-height:1.55;}
.ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border);}
.ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2);}
.ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt);}
.ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center;}
.ai-loader span{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:bounce 1.2s ease-in-out infinite;}
.ai-loader span:nth-child(2){animation-delay:.2s;}
.ai-loader span:nth-child(3){animation-delay:.4s;}
@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.ai-input-wrap{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:6px;}
.ai-input{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif;}
.ai-input:focus{border-color:var(--teal);}
.ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;flex-shrink:0;font-weight:700;transition:filter .15s;}
.ai-send:hover{filter:brightness(1.15);}
/* bottom nav */
.mdm-bottom{background:var(--bg-panel);border-top:1px solid var(--border);height:60px;display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;z-index:10;}
.bnav-back{padding:8px 18px;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);}
.bnav-back:hover{border-color:var(--border-hi);color:var(--txt);}
.bnav-next{padding:8px 18px;border-radius:var(--r);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;background:var(--blue);border:none;color:white;}
.bnav-next:hover{filter:brightness(1.15);}
.bnav-gen{background:rgba(0,229,192,.12);border:1px solid rgba(0,229,192,.3);border-radius:var(--r);padding:8px 16px;font-size:12px;font-weight:600;color:var(--teal);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;}
.bnav-gen:hover{background:rgba(0,229,192,.2);}
.nav-save-btn{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
.nav-save-btn:hover{filter:brightness(1.15);}
.nav-back-link{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer;text-decoration:none;transition:all .15s;}
.nav-back-link:hover{border-color:var(--border-hi);color:var(--txt);}
`;

/* ─── OrderCard ─────────────────────────────────────── */
function OrderCard({ order, type, onDelete, onAIInterpret }) {
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
    <div className={`order-card status-${status}${open ? ' open' : ''}`}>
      <div className="order-header" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 16 }}>{isLab ? '🧬' : '🩻'}</span>
        <span className="order-name">{name || (isLab ? 'New Lab Order' : 'New Imaging Order')}</span>
        <span className={`order-status ${status}`}>{statusLabel[status]}</span>
        <span style={{ color: 'var(--txt3)', fontSize: 11, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>
      {open && (
        <div className="order-body">
          <div className="order-row">
            <div className="order-field">
              <label className="of-label">{isLab ? 'Lab / Panel Name' : 'Modality'}</label>
              <input className="of-input" value={name} onChange={e => setName(e.target.value)}
                placeholder={isLab ? 'e.g. Troponin, CBC, BMP…' : 'e.g. CXR, CT Chest…'} />
            </div>
            <div className="order-field">
              <label className="of-label">{isLab ? 'Reference Range' : 'Body Region'}</label>
              <input className="of-input" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}
                value={ref} onChange={e => setRef(e.target.value)}
                placeholder={isLab ? 'e.g. 0–0.04 ng/mL' : 'e.g. Chest with contrast'} />
            </div>
          </div>
          <div className="order-field" style={{ marginBottom: 10 }}>
            <label className="of-label">🎯 Clinical Rationale — Why Was This Ordered?</label>
            <textarea className="of-textarea" value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder={isLab ? 'e.g. Ordered troponin to rule out ACS…' : 'e.g. CXR to evaluate for pneumonia…'} />
          </div>
          <div className="order-row">
            <div className="order-field" style={{ flex: 1 }}>
              <label className="of-label">Result / Findings</label>
              <input className="of-input" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}
                value={result} onChange={e => handleResult(e.target.value)}
                placeholder={isLab ? 'e.g. Troponin 0.82 ng/mL (H)' : 'e.g. Bilateral infiltrates'} />
            </div>
            <div className="order-field" style={{ minWidth: 130 }}>
              <label className="of-label">Status</label>
              <select className="of-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="resulted">Resulted — Normal</option>
                <option value="abnormal">Resulted — Abnormal</option>
                <option value="critical">Critical Value</option>
              </select>
            </div>
          </div>
          <div className="order-field" style={{ marginTop: 8 }}>
            <label className="of-label">🔬 Clinical Interpretation</label>
            <textarea className="of-textarea" value={interp} onChange={e => setInterp(e.target.value)} rows={2}
              placeholder={isLab ? 'e.g. Elevated troponin confirms Type 1 NSTEMI…' : 'e.g. Bilateral infiltrates consistent with CAP…'} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <button className="order-ai-btn" onClick={() => onAIInterpret({ name, result, reason, ref, type })}>✨ AI Interpret</button>
            <button className="order-del-btn" onClick={onDelete}>✕ Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── EKGCard ───────────────────────────────────────── */
function EKGCard({ num, onDelete, onAIInterpret }) {
  const [open, setOpen] = useState(true);
  const [fields, setFields] = useState({ time: nowHHMM(), reason: '', rate: '', rhythm: '', axis: '', pr: '', qrs: '', qtc: '', st: '', twave: '', other: '', interp: '' });
  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  return (
    <div className={`order-card status-resulted${open ? ' open' : ''}`}>
      <div className="order-header" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 16 }}>📈</span>
        <span className="order-name">EKG #{num}</span>
        <span className="order-status resulted">ENTERED</span>
        <span style={{ color: 'var(--txt3)', fontSize: 11, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>
      {open && (
        <div className="order-body">
          <div className="order-row">
            <div className="order-field">
              <label className="of-label">Time Obtained</label>
              <input type="time" className="of-input" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} value={fields.time} onChange={e => set('time', e.target.value)} />
            </div>
            <div className="order-field">
              <label className="of-label">Reason Ordered</label>
              <input className="of-input" value={fields.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Chest pain, palpitations…" />
            </div>
          </div>
          <div className="ekg-grid" style={{ marginTop: 8, marginBottom: 10 }}>
            {[['rate','Rate (bpm)','e.g. 82'],['rhythm','Rhythm','e.g. Normal sinus rhythm'],['axis','Axis','e.g. Normal'],
              ['pr','PR Interval','e.g. 160ms'],['qrs','QRS Duration','e.g. 90ms'],['qtc','QTc','e.g. 440ms'],
              ['st','ST Changes','e.g. 1mm STE V1–V4'],['twave','T Wave Changes','e.g. TWI in III, aVF'],['other','Other Findings','e.g. LBBB']
            ].map(([k, lbl, ph]) => (
              <div key={k} className="order-field">
                <label className="of-label">{lbl}</label>
                <input className="of-input" value={fields[k]} onChange={e => set(k, e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>
          <div className="order-field">
            <label className="of-label">🔬 Clinical Interpretation & Significance</label>
            <textarea className="of-textarea" rows={2} value={fields.interp} onChange={e => set('interp', e.target.value)}
              placeholder="e.g. Anterior STEMI pattern with concordant ST elevation V1–V4…" />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <button className="order-ai-btn" onClick={() => onAIInterpret(fields)}>✨ AI Interpret EKG</button>
            <button className="order-del-btn" onClick={onDelete}>✕ Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ImpressionCard ────────────────────────────────── */
function ImpressionCard({ variant, evidence, onAddEvidence, onRemoveEvidence }) {
  const [dx, setDx] = useState('');
  const [rationale, setRationale] = useState('');
  const [icd, setIcd] = useState('');
  const [disp, setDisp] = useState('');
  const [evInput, setEvInput] = useState('');
  const [evType, setEvType] = useState('vital');
  const isInitial = variant === 'initial';

  return (
    <div className={`impression-card ${variant}`}>
      <div className={`imp-label ${variant}`}>{isInitial ? '⚡ Initial Impression' : '✅ Final Impression / Diagnosis'}</div>
      <input className="imp-dx-input" value={dx} onChange={e => setDx(e.target.value)}
        placeholder={isInitial ? 'Working diagnosis on presentation…' : 'Confirmed diagnosis at disposition…'} />
      <div className="evidence-label">Supporting evidence from chart</div>
      <div className="evidence-chips">
        {evidence.map((e, i) => (
          <div key={i} className={`ev-chip ${e.type}`}>
            {e.text}
            <span style={{ opacity: 0.5, fontSize: 10, cursor: 'pointer', marginLeft: 3 }} onClick={() => onRemoveEvidence(i)}>✕</span>
          </div>
        ))}
      </div>
      <div className="add-ev-row">
        <input className="add-ev-input" value={evInput} onChange={e => setEvInput(e.target.value)}
          placeholder="Add evidence item…"
          onKeyDown={e => { if (e.key === 'Enter') { onAddEvidence(evInput, evType); setEvInput(''); } }} />
        <select className="add-ev-type" value={evType} onChange={e => setEvType(e.target.value)}>
          <option value="vital">Vital</option>
          <option value="hx">History</option>
          <option value="exam">Exam</option>
          <option value="lab">Lab</option>
          <option value="imaging">Imaging</option>
          <option value="ekg">EKG</option>
        </select>
        <button className="add-ev-btn" onClick={() => { onAddEvidence(evInput, evType); setEvInput(''); }}>Add</button>
      </div>
      {!isInitial && (
        <div className="imp-icd-row">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="of-label">ICD-10 Code</label>
            <input className="of-input" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}
              value={icd} onChange={e => setIcd(e.target.value)} placeholder="e.g. I21.9" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="of-label">Disposition</label>
            <select className="of-select" value={disp} onChange={e => setDisp(e.target.value)}>
              <option value="">— Select —</option>
              <option value="Discharge">Discharge Home</option>
              <option value="Admit">Admit to Ward</option>
              <option value="ICU">Admit to ICU</option>
              <option value="Observation">Observation</option>
              <option value="Transfer">Transfer</option>
              <option value="AMA">AMA</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      )}
      <label className="of-label" style={{ display: 'block', marginTop: 8 }}>
        {isInitial ? 'Clinical rationale' : 'Final assessment rationale'}
      </label>
      <textarea className="imp-rationale" value={rationale} onChange={e => setRationale(e.target.value)}
        placeholder={isInitial ? 'Explain why this diagnosis was considered…' : 'Summarise the key findings that confirm this diagnosis…'} />
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export default function MedicalDecisionMaking() {
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [ekgs, setEkgs] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [dxTab, setDxTab] = useState('labs');
  const [rttStatus, setRttStatus] = useState('');
  const [mdmLevel, setMdmLevel] = useState('');
  const [evInitial, setEvInitial] = useState([]);
  const [evFinal, setEvFinal] = useState([]);
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'MDM assistant ready. Select a quick action or ask a clinical question. Patient context is included automatically.' }]);
  const [aiLoading, setAiLoading] = useState(false);
  const [convHistory, setConvHistory] = useState([]);

  // intervention form
  const [intTime, setIntTime] = useState(nowHHMM);
  const [intDetail, setIntDetail] = useState('');
  const [intType, setIntType] = useState('med');
  const [intResponse, setIntResponse] = useState('');
  const [intRespType, setIntRespType] = useState('');

  const aiMsgsRef = useRef(null);
  const aiInputRef = useRef(null);
  const idRef = useRef(0);

  // inject CSS once
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = CSS;
    el.id = 'mdm-styles';
    if (!document.getElementById('mdm-styles')) document.head.appendChild(el);
    return () => document.getElementById('mdm-styles')?.remove();
  }, []);

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  /* ── dots ── */
  const dotDx = labs.length + imaging.length > 0 ? 'done' : '';
  const dotEkg = ekgs.length > 0 ? 'done' : '';
  const dotEdc = interventions.length > 0 ? 'done' : '';
  const dotRtt = rttStatus ? 'done' : '';
  const dotMdm = mdmLevel ? 'done' : '';

  const mdmMap = {
    straight: { label: 'Straightforward', cls: 'straight', desc: 'Minor/self-limited problem. Minimal data. Minimal risk. (99211–99212)', badge: 'low' },
    low:      { label: 'Low Complexity',   cls: 'low',      desc: 'Acute uncomplicated illness. Limited data reviewed. Low risk. (99213)',         badge: 'low' },
    mod:      { label: 'Moderate Complexity', cls: 'mod',   desc: 'Chronic illness exacerbation, undiagnosed new problem, prescription drug management. (99214)', badge: 'mod' },
    high:     { label: 'High Complexity',  cls: 'high',     desc: 'Severe illness, drug therapy requiring intensive monitoring, decision re: hospitalization. (99215)', badge: 'high' },
  };
  const currentMDM = mdmLevel && mdmMap[mdmLevel];

  /* ── orders ── */
  const addOrder = (type) => {
    const id = ++idRef.current;
    if (type === 'lab') setLabs(l => [...l, { id }]);
    else setImaging(l => [...l, { id }]);
  };
  const deleteOrder = (id, type) => {
    if (type === 'lab') setLabs(l => l.filter(o => o.id !== id));
    else setImaging(l => l.filter(o => o.id !== id));
  };

  /* ── ekgs ── */
  const addEKG = () => { const id = ++idRef.current; setEkgs(e => [...e, { id }]); };
  const deleteEKG = (id) => setEkgs(e => e.filter(x => x.id !== id));

  /* ── interventions ── */
  const addIntervention = () => {
    if (!intDetail.trim()) return;
    const id = ++idRef.current;
    setInterventions(prev => [...prev, { id, time: intTime, detail: intDetail, type: intType, response: intResponse, respType: intRespType }]);
    setIntDetail(''); setIntResponse(''); setIntRespType('');
  };
  const deleteIntervention = (id) => setInterventions(prev => prev.filter(i => i.id !== id));

  /* ── evidence ── */
  const addEvidence = (target, text, type) => {
    if (!text.trim()) return;
    if (target === 'initial') setEvInitial(e => [...e, { text, type }]);
    else setEvFinal(e => [...e, { text, type }]);
  };
  const removeEvidence = (target, idx) => {
    if (target === 'initial') setEvInitial(e => e.filter((_, i) => i !== idx));
    else setEvFinal(e => e.filter((_, i) => i !== idx));
  };

  /* ── AI ── */
  const buildContext = () => {
    const lines = ['=== CURRENT MDM CONTEXT ==='];
    if (labs.length) lines.push('\n--- LABS ---\n' + labs.map(l => `Lab #${l.id}: (entered)`).join('\n'));
    if (imaging.length) lines.push('\n--- IMAGING ---\n' + imaging.map(i => `Imaging #${i.id}: (entered)`).join('\n'));
    if (ekgs.length) lines.push(`\n--- EKGs: ${ekgs.length} performed ---`);
    if (interventions.length) {
      lines.push('\n--- ED INTERVENTIONS ---');
      interventions.forEach(i => lines.push(`[${i.time || '—'}] ${i.type.toUpperCase()}: ${i.detail}${i.response ? ` → ${i.response}` : ''}`));
    }
    if (mdmLevel) lines.push(`\nMDM Level: ${mdmLevel}`);
    lines.push('\n===========================');
    return lines.join('\n');
  };

  const appendMsg = (role, text) => setAiMessages(prev => [...prev, { role, text }]);

  const aiQ = async (question) => {
    appendMsg('user', question);
    setAiLoading(true);
    const ctx = buildContext();
    const systemPrompt = `You are Notrya AI, a clinical assistant embedded in an emergency department documentation platform. You help physicians document medical decision making (MDM). Be concise, clinically accurate, and use ED/emergency medicine context. Format responses with brief headers when helpful. Keep responses under 300 words unless generating a full note.`;
    const newHistory = [...convHistory, { role: 'user', content: `${ctx}\n\nQuestion: ${question}` }];
    setConvHistory(newHistory);
    try {
      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\n${ctx}\n\nQuestion: ${question}`,
        model: 'claude_sonnet_4_6',
      });
      const text = typeof reply === 'string' ? reply : (reply.content || JSON.stringify(reply));
      setConvHistory(h => [...h, { role: 'assistant', content: text }]);
      appendMsg('bot', text);
    } catch (e) {
      appendMsg('sys', '⚠ Connection error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const sendAI = () => {
    const val = aiInputRef.current?.value.trim();
    if (!val) return;
    aiInputRef.current.value = '';
    aiQ(val);
  };

  const aiGenerateMDMNote = () => aiQ(`Generate a complete, structured Medical Decision Making (MDM) documentation note based on all the data entered. Format with sections: DIAGNOSTIC WORKUP, ED COURSE & MANAGEMENT, RESPONSE TO TREATMENT, CLINICAL IMPRESSION, MDM COMPLEXITY, DISPOSITION. Keep it clinically precise using medical abbreviations appropriately.`);

  const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const saveMDM = () => appendMsg('sys', '💾 MDM data saved to session.');

  return (
    <div className="mdm-root">
      {/* SUB NAVBAR */}
      <div className="mdm-subnav">
        <span className="mdm-subnav-logo">notrya</span>
        <span className="mdm-subnav-sep">|</span>
        <span className="mdm-subnav-title">Medical Decision Making</span>
        <span className="mdm-subnav-badge">MDM</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/Home" className="nav-back-link">← Back to Chart</Link>
          <button className="nav-save-btn" onClick={saveMDM}>💾 Save MDM</button>
        </div>
      </div>

      {/* VITALS BAR */}
      <div className="mdm-vitals">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="vb-name">— Patient —</span>
          <span className="vb-meta">Age · Sex · DOB</span>
        </div>
        <div className="vb-div" />
        <div className="vb-vital"><span className="lbl">CC</span><span className="val" style={{ color: 'var(--orange)' }}>—</span></div>
        <div className="vb-div" />
        <div className="vb-vital"><span className="lbl">BP</span><span className="val">—</span></div>
        <div className="vb-vital"><span className="lbl">HR</span><span className="val">—</span></div>
        <div className="vb-vital"><span className="lbl">SpO₂</span><span className="val">—</span></div>
        <div className="vb-vital"><span className="lbl">Temp</span><span className="val">—</span></div>
        <div style={{ flex: 1 }} />
        <span className={`vb-mdm-badge ${currentMDM?.badge || 'low'}`}>
          MDM: {currentMDM ? currentMDM.label.toUpperCase() : '—'}
        </span>
      </div>

      {/* MAIN */}
      <div className="mdm-main">

        {/* SIDEBAR */}
        <aside className="mdm-sidebar">
          <div className="sb-patient-card">
            <div className="sb-name">New Patient</div>
            <div className="sb-meta">No demographics entered</div>
          </div>
          <div className="sb-label">MDM Sections</div>
          {[
            { label: '🧪 Diagnostic Orders', id: 'sec-dx', dot: dotDx },
            { label: '📈 EKG Interpretation', id: 'sec-ekg', dot: dotEkg },
            { label: '⏱️ ED Course', id: 'sec-ed-course', dot: dotEdc },
            { label: '📉 Response to Tx', id: 'sec-rtt', dot: dotRtt },
            { label: '🎯 Impressions', id: 'sec-imp', dot: '' },
            { label: '⚖️ MDM Complexity', id: 'sec-mdm', dot: dotMdm },
          ].map(({ label, id, dot }) => (
            <button key={id} className="sb-nav-btn" onClick={() => scrollToSection(id)}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{label.split(' ')[0]}</span>
              {label.split(' ').slice(1).join(' ')}
              <span className={`sb-dot${dot ? ' ' + dot : ''}`} />
            </button>
          ))}
          <div className="sb-divider" />
          <div className="sb-mdm-progress">
            <div className="sb-mdm-title">MDM Summary</div>
            {[['Labs ordered', labs.length], ['Imaging ordered', imaging.length], ['EKGs', ekgs.length], ['Interventions', interventions.length]].map(([k, v]) => (
              <div key={k} className="sb-mdm-row">
                <span className="sb-mdm-key">{k}</span>
                <span className={`sb-mdm-val${v > 0 ? ' filled' : ''}`}>{v}</span>
              </div>
            ))}
            <div className="sb-mdm-row">
              <span className="sb-mdm-key">Complexity</span>
              <span className={`sb-mdm-val${currentMDM ? ' filled' : ''}`}>{currentMDM?.label || '—'}</span>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="mdm-content" id="main-content">

          {/* ═══ DIAGNOSTIC ORDERS ═══ */}
          <div className="section-box" id="sec-dx">
            <div className="sec-header">
              <span style={{ fontSize: 18 }}>🧪</span>
              <div>
                <div className="sec-title">Diagnostic Orders & Results</div>
                <div className="sec-subtitle">Document why each test was ordered and interpret the results</div>
              </div>
            </div>
            <div className="dx-tabs">
              <div className={`dx-tab${dxTab === 'labs' ? ' active' : ''}`} onClick={() => setDxTab('labs')}>
                🧬 Labs {labs.length > 0 && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.7 }}>({labs.length})</span>}
              </div>
              <div className={`dx-tab${dxTab === 'imaging' ? ' active' : ''}`} onClick={() => setDxTab('imaging')}>
                🩻 Imaging {imaging.length > 0 && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.7 }}>({imaging.length})</span>}
              </div>
            </div>
            {dxTab === 'labs' && (
              <div>
                {labs.map(lab => (
                  <OrderCard key={lab.id} order={lab} type="lab"
                    onDelete={() => deleteOrder(lab.id, 'lab')}
                    onAIInterpret={(d) => aiQ(`Interpret this lab result: ${d.name}. Result: "${d.result || 'pending'}". ${d.ref ? `Reference: ${d.ref}.` : ''} ${d.reason ? `Ordered because: ${d.reason}.` : ''} Explain clinical significance and next steps in 2–3 sentences.`)} />
                ))}
                <button className="add-order-btn" onClick={() => addOrder('lab')}>＋ Add Lab Order</button>
              </div>
            )}
            {dxTab === 'imaging' && (
              <div>
                {imaging.map(img => (
                  <OrderCard key={img.id} order={img} type="imaging"
                    onDelete={() => deleteOrder(img.id, 'imaging')}
                    onAIInterpret={(d) => aiQ(`Interpret this imaging finding: ${d.name}. Result: "${d.result || 'pending'}". ${d.reason ? `Ordered because: ${d.reason}.` : ''} Explain clinical significance and next steps in 2–3 sentences.`)} />
                ))}
                <button className="add-order-btn" onClick={() => addOrder('imaging')}>＋ Add Imaging Order</button>
              </div>
            )}
          </div>

          {/* ═══ EKG ═══ */}
          <div className="section-box" id="sec-ekg">
            <div className="sec-header">
              <span style={{ fontSize: 18 }}>📈</span>
              <div>
                <div className="sec-title">EKG Interpretation</div>
                <div className="sec-subtitle">Structured 12-lead analysis with clinical context</div>
              </div>
              <button className="add-order-btn" style={{ width: 'auto', padding: '6px 14px', borderStyle: 'solid', marginTop: 0 }} onClick={addEKG}>＋ Add EKG</button>
            </div>
            {ekgs.map((ekg, i) => (
              <EKGCard key={ekg.id} num={i + 1} onDelete={() => deleteEKG(ekg.id)}
                onAIInterpret={(fields) => aiQ(`Interpret these EKG findings: Rate ${fields.rate || '?'} bpm, Rhythm: ${fields.rhythm || '?'}, PR: ${fields.pr || '?'}, QRS: ${fields.qrs || '?'}, QTc: ${fields.qtc || '?'}, ST changes: ${fields.st || 'none'}, T wave: ${fields.twave || 'none'}, Other: ${fields.other || 'none'}. Summarise clinical significance and required action.`)} />
            ))}
          </div>

          {/* ═══ ED COURSE ═══ */}
          <div className="section-box" id="sec-ed-course">
            <div className="sec-header">
              <span style={{ fontSize: 18 }}>⏱️</span>
              <div>
                <div className="sec-title">ED Course & Management</div>
                <div className="sec-subtitle">Chronological record of interventions and treatments</div>
              </div>
            </div>
            <div className="timeline">
              {interventions.map(obj => (
                <div key={obj.id} className="tl-item">
                  <div className={`tl-dot ${obj.type}`} style={{ marginTop: 14, marginLeft: 11 }} />
                  <div className="tl-body">
                    <div className="tl-header">
                      <span className="tl-time">{obj.time || '—:——'}</span>
                      <span className={`tl-type-badge ${obj.type}`}>{obj.type.toUpperCase()}</span>
                      <button className="tl-del" onClick={() => deleteIntervention(obj.id)}>✕</button>
                    </div>
                    <div className="tl-detail">{obj.detail}</div>
                    {obj.response && <div className={`tl-response${obj.respType ? ' ' + obj.respType : ''}`}>→ {obj.response}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="add-int-form">
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 120px', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="of-label">Time</label>
                  <input type="time" className="of-input" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} value={intTime} onChange={e => setIntTime(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="of-label">Intervention</label>
                  <input className="of-input" value={intDetail} onChange={e => setIntDetail(e.target.value)}
                    placeholder="e.g. IV Morphine 4mg, CXR ordered…"
                    onKeyDown={e => e.key === 'Enter' && addIntervention()} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="of-label">Category</label>
                  <select className="of-select" value={intType} onChange={e => setIntType(e.target.value)}>
                    <option value="med">Medication</option>
                    <option value="proc">Procedure</option>
                    <option value="fluid">Fluid</option>
                    <option value="consult">Consult</option>
                    <option value="result">Result noted</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label className="of-label">Response / Notes (optional)</label>
                  <input className="of-input" value={intResponse} onChange={e => setIntResponse(e.target.value)}
                    placeholder="e.g. Pain improved to 3/10…" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="of-label">Response</label>
                  <select className="of-select" style={{ width: 120 }} value={intRespType} onChange={e => setIntRespType(e.target.value)}>
                    <option value="">—</option>
                    <option value="improved">Improved</option>
                    <option value="unchanged">Unchanged</option>
                    <option value="deteriorated">Deteriorated</option>
                  </select>
                </div>
                <button className="nav-save-btn" style={{ padding: '7px 16px' }} onClick={addIntervention}>Add →</button>
              </div>
            </div>
          </div>

          {/* ═══ RESPONSE TO TREATMENT ═══ */}
          <div className="section-box" id="sec-rtt">
            <div className="sec-header">
              <span style={{ fontSize: 18 }}>📉</span>
              <div>
                <div className="sec-title">Overall Response to Treatment</div>
                <div className="sec-subtitle">Patient's overall clinical trajectory during ED stay</div>
              </div>
            </div>
            <div className="rtt-card">
              <div className="rtt-header">
                <span className="rtt-title">Clinical Status</span>
                <div className="rtt-status-btns">
                  {['improved', 'unchanged', 'deteriorated'].map(v => (
                    <button key={v} className={`rtt-btn${rttStatus === v ? ` active-${v}` : ''}`} onClick={() => setRttStatus(v)}>
                      {v === 'improved' ? '✓ Improved' : v === 'unchanged' ? '→ Unchanged' : '↓ Deteriorated'}
                    </button>
                  ))}
                </div>
              </div>
              <label className="of-label" style={{ display: 'block', marginBottom: 10 }}>Narrative response to treatment</label>
              <textarea className="of-textarea" rows={3} style={{ minHeight: 80, marginBottom: 10 }}
                placeholder="Describe the patient's overall response to treatment, changes in vitals, symptoms, and clinical status during the ED visit…" />
              <label className="of-label" style={{ display: 'block', marginBottom: 10, marginTop: 10 }}>Pending issues / outstanding concerns</label>
              <textarea className="of-textarea" rows={2} style={{ minHeight: 60 }}
                placeholder="Any results still pending, consultations awaited, or follow-up required…" />
            </div>
          </div>

          {/* ═══ IMPRESSIONS ═══ */}
          <div className="section-box" id="sec-imp">
            <div className="sec-header">
              <span style={{ fontSize: 18 }}>🎯</span>
              <div>
                <div className="sec-title">Clinical Impressions</div>
                <div className="sec-subtitle">Initial working diagnosis and final assessment with supporting evidence</div>
              </div>
            </div>
            <div className="impression-grid">
              <ImpressionCard variant="initial" evidence={evInitial}
                onAddEvidence={(t, type) => addEvidence('initial', t, type)}
                onRemoveEvidence={(i) => removeEvidence('initial', i)} />
              <ImpressionCard variant="final" evidence={evFinal}
                onAddEvidence={(t, type) => addEvidence('final', t, type)}
                onRemoveEvidence={(i) => removeEvidence('final', i)} />
            </div>
          </div>

          {/* ═══ MDM COMPLEXITY ═══ */}
          <div className="section-box" id="sec-mdm">
            <div className="sec-header">
              <span style={{ fontSize: 18 }}>⚖️</span>
              <div>
                <div className="sec-title">MDM Complexity (E/M)</div>
                <div className="sec-subtitle">Medical decision-making level per AMA E/M guidelines</div>
              </div>
            </div>
            <div className="mdm-grid">
              {/* Level */}
              <div className="mdm-card">
                <div className="mdm-card-title">Overall MDM Level</div>
                <div className="complexity-selector">
                  {[['straight','Straightforward'],['low','Low'],['mod','Moderate'],['high','High']].map(([k, lbl]) => (
                    <button key={k} className={`complexity-btn${mdmLevel === k ? ` active-${k}` : ''}`} onClick={() => setMdmLevel(k)}>{lbl}</button>
                  ))}
                </div>
              </div>
              {/* Data reviewed */}
              <div className="mdm-card">
                <div className="mdm-card-title">Data Reviewed & Analysed</div>
                <div className="mdm-check-list">
                  {['Lab results reviewed','Imaging studies reviewed','EKG interpreted','Old records / notes reviewed','Specialist consultation obtained','Discussed with supervisor'].map(lbl => (
                    <MDMCheck key={lbl} label={lbl} />
                  ))}
                </div>
              </div>
              {/* Risk */}
              <div className="mdm-card">
                <div className="mdm-card-title">Risk of Complications / Morbidity</div>
                <div className="mdm-risk-grid">
                  {['Prescription drug management','IV medications given','Minor procedure performed','Major procedure performed','Elective major surgery planned','Drug therapy requiring monitoring','Decision regarding hospitalization','Emergency surgery / resuscitation'].map(lbl => (
                    <RiskChip key={lbl} label={lbl} />
                  ))}
                </div>
              </div>
              {/* Diagnoses */}
              <div className="mdm-card">
                <div className="mdm-card-title">Number of Diagnoses / Conditions Addressed</div>
                <div className="mdm-check-list">
                  {['New problem — no workup planned','New problem — additional workup planned','Established problem — stable/improving','Established problem — worsening','Chronic illness with exacerbation','Undiagnosed new problem with uncertain prognosis'].map(lbl => (
                    <MDMCheck key={lbl} label={lbl} />
                  ))}
                </div>
              </div>
              {/* Result */}
              <div className="mdm-result-box">
                <div>
                  <div className="mdm-result-label">MDM Level</div>
                  <div className={`mdm-result-level${currentMDM ? ' ' + currentMDM.cls : ''}`}>{currentMDM?.label || '—'}</div>
                </div>
                <div className="mdm-result-desc">{currentMDM?.desc || 'Select diagnoses, data, risk factors, and an overall MDM level above.'}</div>
              </div>
            </div>
          </div>
        </main>

        {/* AI PANEL */}
        <aside className="ai-panel">
          <div className="ai-header">
            <div className="ai-header-top">
              <div className="ai-dot" />
              <span className="ai-label">Notrya AI</span>
              <span className="ai-model">claude-sonnet-4</span>
            </div>
            <div className="ai-quick-btns">
              <button className="ai-qbtn" onClick={() => aiQ('Review my diagnostic workup and suggest any additional tests I should consider based on the chief complaint and findings.')}>📋 Review Workup</button>
              <button className="ai-qbtn" onClick={() => aiQ('What are the key differentials I should rule out given this clinical picture? List the top 3 with brief reasoning.')}>🔀 Differentials</button>
              <button className="ai-qbtn" onClick={() => aiQ('Based on the labs and imaging, explain the clinical significance of any abnormal findings in plain language.')}>🔬 Explain Results</button>
              <button className="ai-qbtn" onClick={aiGenerateMDMNote}>📝 Draft MDM Note</button>
              <button className="ai-qbtn" onClick={() => aiQ('What MDM complexity level is appropriate based on the diagnoses, data reviewed, and risk factors documented?')}>⚖️ MDM Level</button>
            </div>
          </div>
          <div className="ai-msgs" ref={aiMsgsRef}>
            {aiMessages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
            {aiLoading && <div className="ai-loader"><span /><span /><span /></div>}
          </div>
          <div className="ai-input-wrap">
            <textarea ref={aiInputRef} className="ai-input" rows={2} placeholder="Ask a clinical question…"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }} />
            <button className="ai-send" onClick={sendAI}>↑</button>
          </div>
        </aside>
      </div>

      {/* BOTTOM NAV */}
      <div className="mdm-bottom">
        <Link to="/Home" className="bnav-back" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>← Summary</Link>
        <div style={{ flex: 1 }} />
        <button className="bnav-gen" onClick={aiGenerateMDMNote}>✨ Generate Full MDM Note</button>
        <button className="bnav-next" onClick={saveMDM}>💾 Save &amp; Finish</button>
      </div>
    </div>
  );
}

/* ─── tiny sub-components ───────────────────────────── */
function MDMCheck({ label }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="mdm-check-item">
      <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
      <span className={`mdm-check-label${checked ? ' checked' : ''}`}>{label}</span>
    </label>
  );
}
function RiskChip({ label }) {
  const [sel, setSel] = useState(false);
  return <div className={`risk-chip${sel ? ' selected' : ''}`} onClick={() => setSel(s => !s)}>{label}</div>;
}