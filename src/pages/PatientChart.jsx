import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;--icon-sb:56px;--top-h:88px;--bot-h:50px;--sb-w:170px;--ai-w:280px}
.pc *,.pc *::before,.pc *::after{box-sizing:border-box;margin:0;padding:0}
.pc-isb{position:fixed;top:0;left:0;bottom:0;width:56px;background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;z-index:300}
.pc-isb-logo{width:100%;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border)}
.pc-isb-box{width:30px;height:30px;background:var(--blue);border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:12px;font-weight:700;color:white;cursor:pointer}
.pc-isb-scroll{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;overflow-y:auto}
.pc-isb-btn{width:42px;height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:6px;cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent;font-size:16px;text-decoration:none}
.pc-isb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
.pc-isb-btn.isb-active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue)}
.pc-isb-lbl{font-size:8px;line-height:1;white-space:nowrap;color:inherit}
.pc-isb-bottom{padding:8px 0;border-top:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:2px}
.pc{position:fixed;inset:0;margin-left:var(--icon-sb);background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;overflow:hidden;display:flex;flex-direction:column}
.pc.embedded{position:relative;inset:auto;margin-left:0;height:100%}

/* TOP BAR */
.pc-top{flex-shrink:0;background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;flex-direction:column}
.pc-row1{height:44px;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid rgba(26,53,85,0.5)}
.pc-row2{height:44px;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.pc-welcome{font-size:12px;color:var(--txt2);font-weight:500;white-space:nowrap}
.pc-welcome strong{color:var(--txt)}
.pc-vsep{width:1px;height:20px;background:var(--border);flex-shrink:0}
.pc-stat{display:flex;align-items:center;gap:5px;background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px}
.pc-stat-v{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--txt)}
.pc-stat-v.alert{color:var(--gold)}
.pc-stat-l{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}
.pc-r1-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.pc-clock{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2)}
.pc-aion{display:flex;align-items:center;gap:4px;background:rgba(0,229,192,0.08);border:1px solid rgba(0,229,192,0.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--teal)}
.pc-aion-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:aipulse 2s ease-in-out infinite}
@keyframes aipulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,0.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.pc-newpt{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}
/* Row 2 */
.pc-chart-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 8px;color:var(--teal);white-space:nowrap}
.pc-pt-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);white-space:nowrap}
.pc-pt-meta{font-size:11px;color:var(--txt3);white-space:nowrap}
.pc-vital{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:10.5px;white-space:nowrap}
.pc-vital .lbl{color:var(--txt4);font-size:9px} .pc-vital .val{color:var(--txt2)}
.pc-vital .val.hi{color:var(--gold);animation:glow-gold 2s ease-in-out infinite}
.pc-vital .val.lo{color:var(--blue);animation:glow-blue 2s ease-in-out infinite}
.pc-vital .val.crit{color:var(--coral);animation:glow-red 2s ease-in-out infinite}
@keyframes glow-red{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)}}
@keyframes glow-blue{0%,100%{text-shadow:0 0 4px rgba(59,158,255,.4)}50%{text-shadow:0 0 10px rgba(59,158,255,.9)}}
@keyframes glow-gold{0%,100%{text-shadow:0 0 4px rgba(245,200,66,.4)}50%{text-shadow:0 0 10px rgba(245,200,66,.9)}}
.pc-status-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 10px;border-radius:4px;background:rgba(255,107,107,0.1);color:var(--coral);border:1px solid rgba(255,107,107,0.3);white-space:nowrap}
.pc-room-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(0,229,192,0.1);color:var(--teal);border:1px solid rgba(0,229,192,0.3);white-space:nowrap}
.pc-chart-actions{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--txt2);cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}
.btn-teal{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.btn-teal:hover{filter:brightness(1.15)}
.btn-blue{background:var(--blue);color:white;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.btn-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.btn-coral:hover{background:rgba(255,107,107,.25)}

/* BODY */
.pc-body{flex:1;display:flex;overflow:hidden}

/* SIDEBAR */
.pc-sb{width:var(--sb-w);flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:1px}
.pc-sb-group{font-size:9px;color:var(--txt4);text-transform:uppercase;letter-spacing:.08em;padding:10px 8px 4px;font-weight:600}
.pc-sb-group:first-child{padding-top:4px}
.pc-sb-item{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:6px;cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2);user-select:none}
.pc-sb-item:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt)}
.pc-sb-item.active{background:rgba(59,158,255,0.1);border-color:rgba(59,158,255,0.3);color:var(--blue)}
.pc-sb-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0}
.pc-dot{width:6px;height:6px;border-radius:50%;margin-left:auto;flex-shrink:0;background:var(--border)}
.pc-dot.done{background:var(--teal);box-shadow:0 0 5px rgba(0,229,192,0.5)}
.pc-dot.partial{background:var(--orange);box-shadow:0 0 5px rgba(255,159,67,0.5)}
.pc-dot.alert{background:var(--coral);box-shadow:0 0 5px rgba(255,107,107,0.5)}
.pc-sb-div{height:1px;background:var(--border);margin:6px 4px}

/* CONTENT */
.pc-content{flex:1;overflow-y:auto;padding:18px 20px 30px;display:flex;flex-direction:column;gap:16px}

/* AI PANEL */
.pc-ai{width:var(--ai-w);flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.pc-ai-hdr{padding:10px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.pc-ai-hdr-top{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.pc-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);flex-shrink:0;animation:aipulse 2s ease-in-out infinite}
.pc-ai-label{font-size:11px;font-weight:600;color:var(--txt2)}
.pc-ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 6px;color:var(--txt3)}
.pc-ai-qbtns{display:flex;flex-wrap:wrap;gap:3px}
.pc-ai-qbtn{padding:2px 8px;border-radius:20px;font-size:10px;cursor:pointer;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);transition:all .15s}
.pc-ai-qbtn:hover{border-color:var(--teal);color:var(--teal)}
.pc-ai-msgs{flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.pc-ai-msg{padding:8px 10px;border-radius:var(--r);font-size:11px;line-height:1.5}
.pc-ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border)}
.pc-ai-msg.user{background:rgba(59,158,255,0.12);border:1px solid rgba(59,158,255,0.25);color:var(--txt)}
.pc-ai-msg.bot{background:rgba(0,229,192,0.07);border:1px solid rgba(0,229,192,0.18);color:var(--txt)}
.pc-ai-input-wrap{padding:8px 10px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:5px}
.pc-ai-input{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:6px 8px;color:var(--txt);font-size:11px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
.pc-ai-input:focus{border-color:var(--teal)}
.pc-ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:6px 10px;font-size:14px;cursor:pointer;flex-shrink:0;font-weight:700}

/* BOTTOM BAR */
.pc-bottom{flex-shrink:0;height:var(--bot-h);background:var(--bg-panel);border-top:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:8px}
.pc-stepper-dots{display:flex;align-items:center;gap:4px;margin:0 auto}
.pc-step-dot{width:8px;height:8px;border-radius:50%;cursor:pointer;flex-shrink:0;transition:all .2s}
.pc-step-dot.done{background:var(--teal);box-shadow:0 0 4px rgba(0,229,192,0.4)}
.pc-step-dot.current{background:var(--blue);box-shadow:0 0 6px rgba(59,158,255,0.5);width:10px;height:10px}
.pc-step-dot.partial{background:var(--orange)}
.pc-step-dot.empty{background:var(--txt4)}
.pc-step-lbl{font-size:11px;color:var(--txt3)}
.pc-cur-lbl{font-size:12px;color:var(--txt);font-weight:500}
.pc ::-webkit-scrollbar{width:4px} .pc ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* CONTENT COMPONENTS */
.section-box{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.sec-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.sec-icon{font-size:18px}
.sec-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--txt)}
.sec-subtitle{font-size:12px;color:var(--txt3);margin-top:1px}
.card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px}
.sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px}
.badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap}
.badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.badge-blue{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}
.badge-gold{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}
.badge-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3)}
.badge-orange{background:rgba(255,159,67,.12);color:var(--orange);border:1px solid rgba(255,159,67,.3)}
.badge-purple{background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3)}
.badge-muted{background:rgba(74,106,138,.2);color:var(--txt3)}
.divider{height:1px;background:var(--border);margin:12px 0}
.flex{display:flex} .flex-col{display:flex;flex-direction:column}
.gap-4{gap:4px} .gap-6{gap:6px} .gap-8{gap:8px} .gap-10{gap:10px} .gap-12{gap:12px}
.flex-1{flex:1} .items-center{align-items:center} .justify-between{justify-content:space-between}
.ml-auto{margin-left:auto} .mt-8{margin-top:8px} .mb-8{margin-bottom:8px}
.text-mono{font-family:'JetBrains Mono',monospace}
.text-muted{color:var(--txt3)} .text-dim{color:var(--txt4)}
.text-teal{color:var(--teal)} .text-blue{color:var(--blue)} .text-coral{color:var(--coral)} .text-gold{color:var(--gold)}
.text-sm{font-size:12px} .text-xs{font-size:11px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.col-full{grid-column:1/-1}
.allergy-tag{display:inline-flex;align-items:center;gap:5px;background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);border-radius:20px;padding:3px 10px;font-size:11px;color:var(--coral);font-weight:600}
.allergy-tag .sev{font-size:9px;color:rgba(255,107,107,.6);text-transform:uppercase;letter-spacing:.05em}
.allergy-tag.moderate{background:rgba(255,159,67,.08);border-color:rgba(255,159,67,.25);color:var(--orange)}
.allergy-tag.moderate .sev{color:rgba(255,159,67,.6)}
.allergy-tag.mild{background:rgba(74,106,138,.2);border-color:var(--border);color:var(--txt3)}
.allergy-tag.mild .sev{color:var(--txt4)}
.timeline{display:flex;flex-direction:column}
.tl-item{display:flex;gap:12px}
.tl-spine{display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0}
.tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px}
.tl-line{flex:1;width:1px;background:var(--border);min-height:16px}
.tl-item:last-child .tl-line{display:none}
.tl-body{padding-bottom:14px;flex:1}
.tl-time{font-size:10px;color:var(--txt4);font-family:'JetBrains Mono',monospace}
.tl-event{font-size:12px;color:var(--txt);font-weight:500}
.tl-detail{font-size:11px;color:var(--txt3);margin-top:2px;line-height:1.45}
.problem-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r);border:1px solid transparent;transition:all .15s}
.problem-row:hover{background:var(--bg-up);border-color:var(--border)}
.problem-icd{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--txt4);min-width:64px}
.problem-name{font-size:12px;color:var(--txt);flex:1}
.problem-onset{font-size:11px;color:var(--txt3)}
.med-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r);border:1px solid transparent;transition:all .15s}
.med-row:hover{background:var(--bg-up);border-color:var(--border)}
.med-name{font-size:12px;color:var(--txt);font-weight:500;flex:1}
.med-dose{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--blue)}
.med-freq{font-size:11px;color:var(--txt3)}
.med-route{font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:4px;padding:1px 6px;color:var(--txt3);font-family:'JetBrains Mono',monospace}
.lab-table{width:100%;border-collapse:collapse}
.lab-table th{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;padding:6px 8px;text-align:left;border-bottom:1px solid var(--border)}
.lab-table td{font-size:12px;padding:7px 8px;border-bottom:1px solid rgba(26,53,85,.5);vertical-align:middle}
.lab-table tr:last-child td{border-bottom:none}
.lab-table tr:hover td{background:rgba(14,37,68,.5)}
.lab-val{font-family:'JetBrains Mono',monospace;font-weight:600}
.lab-val.hi{color:var(--coral)} .lab-val.lo{color:var(--blue)} .lab-val.ok{color:var(--teal)}
.lab-ref{font-size:10px;color:var(--txt4);font-family:'JetBrains Mono',monospace}
.lab-flag{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.lab-flag.hi{background:var(--coral);box-shadow:0 0 5px rgba(255,107,107,.5)}
.lab-flag.lo{background:var(--blue);box-shadow:0 0 5px rgba(59,158,255,.5)}
.lab-flag.ok{background:var(--teal);box-shadow:0 0 5px rgba(0,229,192,.4)}
.stat-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px 14px;display:flex;flex-direction:column;gap:4px}
.stat-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:600;line-height:1}
.stat-lbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em}
.stat-sub{font-size:11px;color:var(--txt4);margin-top:2px}
.imaging-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px 14px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;transition:border-color .15s}
.imaging-card:hover{border-color:var(--border-hi)}
.imaging-icon{font-size:28px;flex-shrink:0;line-height:1}
.imaging-body{flex:1}
.imaging-title{font-size:13px;font-weight:600;color:var(--txt)}
.imaging-meta{font-size:11px;color:var(--txt3);margin-top:2px}
.imaging-finding{font-size:12px;color:var(--txt2);margin-top:6px;line-height:1.5;background:var(--bg-up);border-left:2px solid var(--border-hi);border-radius:0 4px 4px 0;padding:6px 8px}
.note-preview{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;font-size:12px;color:var(--txt2);line-height:1.75;white-space:pre-wrap}
.tab-bar{display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:14px}
.tab{padding:6px 14px;font-size:12px;color:var(--txt3);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;margin-bottom:-1px}
.tab:hover{color:var(--txt2)} .tab.active{color:var(--blue);border-bottom-color:var(--blue);font-weight:600}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;gap:8px;color:var(--txt4);text-align:center}
.empty-state .icon{font-size:28px;opacity:.4} .empty-state .msg{font-size:12px}
.page-loader{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;z-index:999}
.loader-logo{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--cyan)}
.loader-bar-wrap{width:200px;height:3px;background:var(--bg-up);border-radius:2px;overflow:hidden}
.loader-bar{height:100%;background:var(--teal);border-radius:2px;animation:load-fill 1.2s ease forwards}
@keyframes load-fill{from{width:0}to{width:100%}}
.loader-msg{font-size:12px;color:var(--txt3)}
.ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
.ai-loader span{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:bounce 1.2s ease-in-out infinite}
.ai-loader span:nth-child(2){animation-delay:.2s} .ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
`;

const NAV_SECTIONS = [
  { id: 's-overview',  icon: '📊', label: 'Overview',     dot: 'overview' },
  { id: 's-timeline',  icon: '🕐', label: 'Timeline',     dot: 'timeline' },
  { id: 's-problems',  icon: '🏷️', label: 'Problem List', dot: 'problems' },
  { id: 's-meds',      icon: '💊', label: 'Medications',  dot: 'meds' },
  { id: 's-labs',      icon: '🧪', label: 'Labs',         dot: 'labs' },
  { id: 's-imaging',   icon: '🩻', label: 'Imaging',      dot: 'imaging' },
  { id: 's-allergies', icon: '⚠️', label: 'Allergies',    dot: 'allergies' },
  { id: 's-note',      icon: '📝', label: 'Current Note', dot: 'note' },
];

export default function PatientChart({ embedded = false }) {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loaderMsg, setLoaderMsg] = useState('Loading patient chart…');
  const [demoMode, setDemoMode] = useState(false);
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
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [activeSection, setActiveSection] = useState('s-overview');
  const [activeTab, setActiveTab] = useState({ problems: 'active', meds: 'ed' });
  const [clock, setClock] = useState('');
  const aiMsgsRef = useRef(null);

  const DEMO = {
    user: { full_name: 'Dr. Gabriel Skiba', specialty: 'Emergency Medicine' },
    shift: { activePatients: 8, notesPending: 14, ordersQueue: 3, shiftHours: '11.6' },
    patient: { id: 'demo-1', firstName: 'Hiroshi', lastName: 'Nakamura', dateOfBirth: '1957-03-14', sex: 'Male', mrn: '4-471-8820', room: '4B', chiefComplaint: 'Chest Pain', status: 'MONITORING', attendingName: 'Dr. Skiba', triageLevel: 'ESI-2', insuranceName: 'Medicare', arrivedAt: new Date(Date.now() - 90 * 60000).toISOString(), hasAllergyFlag: true },
    vitals: { bp: '158/94', hr: 108, rr: 18, spo2: 93, temperature: '37.1°C', gcs: 15, weight: 82, recordedAt: new Date(Date.now() - 14 * 60000).toISOString() },
    timeline: [
      { type: 'arrival', occurredAt: new Date(Date.now() - 90 * 60000).toISOString(), title: 'Patient Arrived · Ambulance', detail: 'EMS reported acute onset chest pain radiating to left arm, onset ~60 min prior. Diaphoretic on arrival.' },
      { type: 'order', occurredAt: new Date(Date.now() - 84 * 60000).toISOString(), title: 'Triage Complete · ESI-2', detail: 'BP 162/98, HR 112, SpO₂ 91% RA. Placed on 2L NC. 12-lead ECG ordered STAT.' },
      { type: 'result', occurredAt: new Date(Date.now() - 78 * 60000).toISOString(), title: '12-Lead ECG Completed', detail: 'Sinus tachycardia at 110 bpm. ST depression in leads V4–V6. No STEMI criteria met. Cardiology notified.' },
      { type: 'med', occurredAt: new Date(Date.now() - 70 * 60000).toISOString(), title: 'IV Access · Labs Drawn', detail: '18G IV R antecubital. Troponin-I, BMP, CBC, BNP, coag panel sent. Aspirin 325mg PO given.' },
      { type: 'critical', occurredAt: new Date(Date.now() - 25 * 60000).toISOString(), title: '🚨 Critical Lab Result — Troponin-I', detail: 'Troponin-I = 0.84 ng/mL (ref <0.04). Confirmed NSTEMI. Heparin drip initiated.' },
      { type: 'consult', occurredAt: new Date(Date.now() - 10 * 60000).toISOString(), title: 'Cardiology Consult — Dr. Chen', detail: 'Evaluated at bedside. Recommends urgent cath lab. Ticagrelor 180mg PO administered.' },
      { type: 'current', occurredAt: new Date().toISOString(), title: 'Awaiting Echo · Cath Lab on standby', detail: 'Patient hemodynamically stable. Repeat vitals q15 min. Serial ECGs in progress.' },
    ],
    problems: [
      { icdCode: 'I21.4', name: 'Non-ST Elevation MI', status: 'active', onsetDate: new Date().toISOString() },
      { icdCode: 'I10', name: 'Hypertension, Essential', status: 'active', onsetYear: '2019' },
      { icdCode: 'E11.65', name: 'Type 2 DM w/ hyperglycemia', status: 'active', onsetYear: '2021' },
      { icdCode: 'I25.10', name: 'Coronary Artery Disease', status: 'active', onsetYear: '2022' },
      { icdCode: 'Z87.39', name: 'Hx of tobacco use', status: 'historical', onsetYear: '2015' },
      { icdCode: 'K21.0', name: 'GERD', status: 'historical', onsetYear: '2018' },
    ],
    allergies: [
      { allergen: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis', confirmedDate: '2018-06-01' },
      { allergen: 'Iodinated Contrast', severity: 'moderate', reaction: 'Urticaria', confirmedDate: '2020-03-15' },
      { allergen: 'Codeine', severity: 'mild', reaction: 'Nausea/Vomiting', reportedBy: 'Reported by patient' },
    ],
    meds: [
      { name: 'Aspirin', dose: '325 mg', frequency: '× 1 dose', route: 'PO', status: 'ed_given', administeredAt: new Date(Date.now() - 70 * 60000).toISOString(), administeredBy: 'Nurse T. Reyes' },
      { name: 'Heparin', dose: '4000U bolus→800U/hr', frequency: 'Drip active', route: 'IV', status: 'ed_given', administeredAt: new Date(Date.now() - 23 * 60000).toISOString(), administeredBy: 'Dr. Skiba' },
      { name: 'Ticagrelor', dose: '180 mg loading', frequency: '× 1 dose', route: 'PO', status: 'ed_given', administeredAt: new Date(Date.now() - 9 * 60000).toISOString(), administeredBy: 'Dr. Chen' },
      { name: 'Metoprolol', dose: '50 mg', frequency: 'BID', route: 'PO', status: 'home' },
      { name: 'Lisinopril', dose: '10 mg', frequency: 'Daily', route: 'PO', status: 'held' },
      { name: 'Atorvastatin', dose: '40 mg', frequency: 'Nightly', route: 'PO', status: 'home' },
      { name: 'Metformin', dose: '1000 mg', frequency: 'BID', route: 'PO', status: 'home' },
    ],
    labs: [
      { panel: 'Cardiac Markers', testName: 'Troponin-I', value: '0.84', unit: 'ng/mL', referenceRange: '<0.04', flag: 'hi', collectedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { panel: 'Cardiac Markers', testName: 'BNP', value: '812', unit: 'pg/mL', referenceRange: '<100', flag: 'hi', collectedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { panel: 'Cardiac Markers', testName: 'CK-MB', value: '3.2', unit: 'ng/mL', referenceRange: '0–6.3', flag: 'ok', collectedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'Na⁺', value: '138', unit: 'mEq/L', referenceRange: '136–145', flag: 'ok', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'K⁺', value: '5.4', unit: 'mEq/L', referenceRange: '3.5–5.0', flag: 'hi', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'Creatinine', value: '1.1', unit: 'mg/dL', referenceRange: '0.7–1.2', flag: 'ok', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'Glucose', value: '218', unit: 'mg/dL', referenceRange: '70–100', flag: 'hi', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
    ],
    imaging: [
      { studyType: 'Chest X-Ray (PA/Lat)', modality: 'XR', status: 'resulted', orderedAt: new Date(Date.now() - 84 * 60000).toISOString(), resultedAt: new Date(Date.now() - 62 * 60000).toISOString(), radiologist: 'Dr. Patel', finding: 'Mild cardiomegaly. No pneumothorax. Mild pulmonary vascular congestion. No frank consolidation or pleural effusion.' },
      { studyType: 'Echocardiogram (TTE)', modality: 'ECHO', status: 'pending', orderedAt: new Date(Date.now() - 9 * 60000).toISOString(), finding: null },
    ],
    note: { content: `CHIEF COMPLAINT: Acute chest pain, left arm radiation, diaphoresis.\n\nHPI: Mr. Nakamura is a 67-year-old male with known CAD, HTN, and T2DM who presented via EMS with acute onset chest pain 9/10, radiating to the left arm, associated with diaphoresis and mild dyspnea.\n\nASSESSMENT & PLAN:\n1. NSTEMI (I21.4) — Troponin-I 0.84 (>20× ULN).\n   • Aspirin 325mg ✓ | Ticagrelor 180mg ✓ | Heparin drip ✓\n   • Cardiology at bedside — urgent PCI being arranged\n2. HTN — holding lisinopril; BP monitored\n3. T2DM — glucose 218, insulin sliding scale\n\nDISPOSITION: Admit to Cardiac ICU. Cath lab on standby.` }
  };

  useEffect(() => { init(); }, [searchParams]);
  useEffect(() => { if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight; }, [aiMessages]);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  const init = async () => {
    try {
      const patientId = searchParams.get('patientId') || searchParams.get('id');
      let livePatient = null;
      if (patientId) {
        try { /* livePatient = await base44.entities.Patient.get(patientId); */ } catch {}
      }
      const isDemo = !livePatient;
      setDemoMode(isDemo);
      if (isDemo) {
        setCurrentUser(DEMO.user); setShift(DEMO.shift); setPatient(DEMO.patient);
        setVitals(DEMO.vitals); setTimeline(DEMO.timeline); setProblems(DEMO.problems);
        setAllergies(DEMO.allergies); setMeds(DEMO.meds); setLabs(DEMO.labs);
        setImaging(DEMO.imaging); setNote(DEMO.note);
        setAiMessages([{ role: 'sys', text: '⚡ Demo mode — sample data shown.' }]);
      } else {
        const user = await base44.auth.me().catch(() => DEMO.user);
        setCurrentUser(user); setShift(DEMO.shift); setPatient(livePatient);
        setAiMessages([{ role: 'sys', text: 'Chart loaded. Ask a clinical question.' }]);
      }
      setLoading(false);
    } catch (err) {
      setDemoMode(true); setCurrentUser(DEMO.user); setShift(DEMO.shift); setPatient(DEMO.patient);
      setVitals(DEMO.vitals); setTimeline(DEMO.timeline); setProblems(DEMO.problems);
      setAllergies(DEMO.allergies); setMeds(DEMO.meds); setLabs(DEMO.labs);
      setImaging(DEMO.imaging); setNote(DEMO.note);
      setAiMessages([{ role: 'sys', text: '⚠ Load error. Showing demo data.' }]);
      setLoading(false);
    }
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    const b = new Date(dob), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  };
  const formatDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }); } catch { return '—'; } };
  const formatTime = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return '—'; } };
  const timeAgo = (d) => { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' hr ago'; };
  const isToday = (d) => { if (!d) return false; const dt = new Date(d), t = new Date(); return dt.getFullYear() === t.getFullYear() && dt.getMonth() === t.getMonth() && dt.getDate() === t.getDate(); };
  const triageBadge = (l) => ({ 'ESI-1': 'badge-coral', 'ESI-2': 'badge-orange', 'ESI-3': 'badge-gold', 'ESI-4': 'badge-teal', 'ESI-5': 'badge-muted' }[l] ?? 'badge-muted');
  const getVitalClass = (val, { hi, lo } = {}) => { const n = parseFloat(String(val)); if (isNaN(n)) return 'val'; if (hi !== undefined && n > hi) return 'val hi'; if (lo !== undefined && n < lo) return 'val crit'; return 'val'; };
  const vitalCls = (key, val) => { const n = parseFloat(String(val)); if (key === 'bp') return n > 140 ? 'text-coral' : n < 90 ? 'text-blue' : 'text-teal'; if (key === 'hr') return n > 100 ? 'text-gold' : n < 50 ? 'text-blue' : 'text-teal'; return 'text-teal'; };
  const bpStatus = (val) => { const n = parseFloat(String(val)); return n > 140 ? '↑ Hypertensive' : n < 90 ? '↓ Hypotensive' : 'Normal range'; };
  const hrStatus = (val) => { const n = parseFloat(String(val)); return n > 100 ? 'Tachycardic' : n < 50 ? 'Bradycardic' : 'Normal range'; };

  const activeProblems = problems.filter(p => p.status === 'active');
  const historicalProblems = problems.filter(p => p.status !== 'active');
  const edMeds = meds.filter(m => m.status === 'ed_given');
  const homeMeds = meds.filter(m => m.status === 'home');
  const heldMeds = meds.filter(m => m.status === 'held');
  const critLabs = labs.filter(l => l.flag === 'hi' || l.flag === 'lo');
  const todayDx = problems.filter(p => isToday(p.onsetDate));
  const labPanels = labs.reduce((acc, l) => { const p = l.panel ?? 'General'; if (!acc[p]) acc[p] = []; acc[p].push(l); return acc; }, {});

  const dotClass = (section) => {
    if (section === 'overview' || section === 'timeline') return 'done';
    if (section === 'problems') return activeProblems.length ? 'partial' : '';
    if (section === 'meds') return meds.length ? 'done' : '';
    if (section === 'labs') return critLabs.length ? 'alert' : labs.length ? 'done' : '';
    if (section === 'imaging') return imaging.length ? 'partial' : '';
    if (section === 'allergies') return allergies.length ? 'done' : '';
    if (section === 'note') return note?.content ? 'done' : '';
    return '';
  };

  const scrollToSection = (id) => { setActiveSection(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const switchTab = (cat, tab) => setActiveTab(prev => ({ ...prev, [cat]: tab }));

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question) return;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: question }]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an ED clinical assistant. Patient: ${patient?.firstName} ${patient?.lastName}, ${calcAge(patient?.dateOfBirth)}y/o, CC: ${patient?.chiefComplaint}. Question: ${question}`,
      });
      setAiMessages(prev => [...prev, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'sys', text: '⚠ AI error.' }]);
    }
  };

  const ISB_ITEMS = [
    { icon: '🏠', label: 'Home',      page: '/' },
    { icon: '📊', label: 'Dashboard', page: '/Dashboard' },
    { icon: '🆕', label: 'New PT',    page: '/NewPatientInput' },
    { icon: '👥', label: 'Patients',  page: '/PatientDashboard' },
    { icon: '🔄', label: 'Shift',     page: '/Shift' },
    { icon: '💊', label: 'Drugs',     page: '/DrugsBugs' },
    { icon: '🧮', label: 'Calc',      page: '/Calculators' },
  ];

  if (loading) return (
    <div className="page-loader">
      <style>{CSS}</style>
      <div className="loader-logo">notrya</div>
      <div className="loader-bar-wrap"><div className="loader-bar" /></div>
      <div className="loader-msg">{loaderMsg}</div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>

      {/* ICON SIDEBAR */}
      {!embedded && (
        <aside className="pc-isb">
          <div className="pc-isb-logo"><div className="pc-isb-box">Pc</div></div>
          <div className="pc-isb-scroll">
            {ISB_ITEMS.map(item => (
              <a key={item.page} href={item.page} className="pc-isb-btn" title={item.label}>
                <span>{item.icon}</span>
                <span className="pc-isb-lbl">{item.label}</span>
              </a>
            ))}
          </div>
          <div className="pc-isb-bottom">
            <a href="/AppSettings" className="pc-isb-btn" title="Settings"><span>⚙️</span><span className="pc-isb-lbl">Settings</span></a>
          </div>
        </aside>
      )}

      <div className={`pc${embedded ? ' embedded' : ''}`}>

        {/* DEMO BANNER */}
        {demoMode && (
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'rgba(245,200,66,.12)', border: '1px solid rgba(245,200,66,.4)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '3px 14px', fontSize: '10px', color: '#f5c842', fontFamily: '"JetBrains Mono",monospace', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={e => e.currentTarget.style.display = 'none'}>
            ⚡ DEMO MODE — <span style={{ opacity: .7 }}>click to dismiss</span> <span style={{ opacity: .5 }}>✕</span>
          </div>
        )}

        {/* TOP BAR */}
        <div className="pc-top">
          {/* Row 1 — shift stats */}
          <div className="pc-row1">
            <span className="pc-welcome">Welcome, <strong>{currentUser?.full_name || 'Dr. Skiba'}</strong></span>
            <div className="pc-vsep" />
            {[
              [shift?.activePatients ?? '—', 'Active', false],
              [shift?.notesPending ?? '—', 'Pending', true],
              [shift?.ordersQueue ?? '—', 'Orders', false],
              [shift?.shiftHours ?? '—', 'Hours', false],
            ].map(([v, l, alert]) => (
              <div key={l} className="pc-stat">
                <span className={`pc-stat-v${alert ? ' alert' : ''}`}>{v}</span>
                <span className="pc-stat-l">{l}</span>
              </div>
            ))}
            <div className="pc-r1-right">
              <div className="pc-clock">{clock}</div>
              <div className="pc-aion"><div className="pc-aion-dot" /> AI ON</div>
              <button className="pc-newpt">+ New Patient</button>
            </div>
          </div>
          {/* Row 2 — patient info + vitals + actions */}
          <div className="pc-row2">
            <span className="pc-chart-badge">PT-{patient?.mrn || '—'}</span>
            <span className="pc-pt-name">{patient ? `${patient.lastName}, ${patient.firstName}` : '— Patient —'}</span>
            <span className="pc-pt-meta">{patient ? `${calcAge(patient.dateOfBirth) || '—'} y/o · ${patient.sex || '—'} · ${formatDate(patient.dateOfBirth)}` : ''}</span>
            {patient?.chiefComplaint && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: 'var(--orange)', whiteSpace: 'nowrap' }}>CC: {patient.chiefComplaint}</span>}
            <div className="pc-vsep" />
            {vitals && [
              ['BP', vitals.bp, getVitalClass(vitals.bp, { hi: 140 })],
              ['HR', vitals.hr, getVitalClass(vitals.hr, { hi: 100, lo: 50 })],
              ['RR', vitals.rr, getVitalClass(vitals.rr, { hi: 20, lo: 10 })],
              ['SpO₂', vitals.spo2 ? vitals.spo2 + '%' : '—', getVitalClass(vitals.spo2, { lo: 95 })],
              ['GCS', vitals.gcs, getVitalClass(vitals.gcs, { lo: 14 })],
            ].map(([lbl, val, cls]) => (
              <div key={lbl} className="pc-vital"><span className="lbl">{lbl}</span><span className={cls}>{val || '—'}</span></div>
            ))}
            <div className="pc-vsep" />
            {patient?.status && <span className="pc-status-badge">{patient.status}</span>}
            {patient?.room && <span className="pc-room-badge">Room {patient.room}</span>}
            <div className="pc-chart-actions">
              <button className="btn-ghost">📋 Orders</button>
              <button className="btn-teal">💾 Save Chart</button>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="pc-body">

          {/* SIDEBAR */}
          <aside className="pc-sb">
            {/* Patient card */}
            {patient && (
              <div className="sb-card" style={{ marginBottom: 6 }}>
                <div className="flex items-center gap-8">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(59,158,255,.15)', border: '1px solid rgba(59,158,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
                    {(patient.firstName?.[0] || '') + (patient.lastName?.[0] || '')}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{patient.lastName}, {patient.firstName}</div>
                    <div className="text-xs text-muted">MRN {patient.mrn || '—'}</div>
                  </div>
                </div>
                <div className="divider" style={{ margin: '7px 0' }} />
                <div className="flex justify-between" style={{ fontSize: 11 }}><span className="text-muted">Triage</span><span className={`badge ${triageBadge(patient.triageLevel)}`} style={{ fontSize: 9, padding: '1px 5px' }}>{patient.triageLevel || '—'}</span></div>
              </div>
            )}
            <div className="pc-sb-group">Chart Sections</div>
            {NAV_SECTIONS.map(s => (
              <div key={s.id} className={`pc-sb-item${activeSection === s.id ? ' active' : ''}`} onClick={() => scrollToSection(s.id)}>
                <span className="pc-sb-icon">{s.icon}</span>
                <span style={{ flex: 1 }}>{s.label}</span>
                <span className={`pc-dot ${dotClass(s.dot)}`} />
              </div>
            ))}
            <div className="pc-sb-div" />
            <div className="pc-sb-group">Flags</div>
            {critLabs.length > 0 && (
              <div className="sb-card" style={{ borderColor: 'rgba(255,107,107,.25)', marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 600 }}>🚨 Critical Results</div>
                <div className="text-xs text-muted mt-8">{critLabs.slice(0, 3).map(l => l.testName + (l.flag === 'hi' ? ' ▲' : ' ▼')).join(' · ')}</div>
              </div>
            )}
            {todayDx.length > 0 && (
              <div className="sb-card" style={{ borderColor: 'rgba(255,159,67,.25)', marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600 }}>⚕️ New Dx Today</div>
                <div className="text-xs text-muted mt-8">{todayDx.map(p => p.name).join(', ')}</div>
              </div>
            )}
            {critLabs.length === 0 && todayDx.length === 0 && <div className="text-xs text-muted" style={{ padding: '4px 8px' }}>No active flags.</div>}
          </aside>

          {/* CONTENT */}
          <main className="pc-content">

            {/* OVERVIEW */}
            <div id="s-overview">
              <div className="grid-4">
                {vitals?.bp && <div className="stat-card"><div className={`stat-val ${vitalCls('bp', vitals.bp)}`}>{vitals.bp}</div><div className="stat-lbl">Blood Pressure</div><div className="stat-sub">{bpStatus(vitals.bp)}</div></div>}
                {vitals?.hr && <div className="stat-card"><div className={`stat-val ${vitalCls('hr', vitals.hr)}`}>{vitals.hr}</div><div className="stat-lbl">Heart Rate</div><div className="stat-sub">{hrStatus(vitals.hr)}</div></div>}
                {vitals?.spo2 && <div className="stat-card"><div className={`stat-val ${parseFloat(vitals.spo2) < 95 ? 'text-blue' : 'text-teal'}`}>{vitals.spo2}%</div><div className="stat-lbl">SpO₂</div><div className="stat-sub">{vitals?.recordedAt ? 'Last ' + timeAgo(vitals.recordedAt) : ''}</div></div>}
                {vitals?.temperature && <div className="stat-card"><div className="stat-val text-teal">{vitals.temperature}</div><div className="stat-lbl">Temperature</div><div className="stat-sub">GCS {vitals.gcs || '—'}</div></div>}
                {!vitals && <div className="empty-state col-full"><div className="icon">📊</div><div className="msg">No vitals data.</div></div>}
              </div>
            </div>

            {/* TIMELINE */}
            <div className="section-box" id="s-timeline">
              <div className="sec-header">
                <span className="sec-icon">🕐</span>
                <div><div className="sec-title">Visit Timeline</div><div className="sec-subtitle">{timeline.length} events</div></div>
                <button className="btn-ghost ml-auto" style={{ fontSize: 11 }}>+ Add Event</button>
              </div>
              <div className="timeline">
                {timeline.length === 0 ? <div className="empty-state"><div className="icon">🕐</div><div className="msg">No events.</div></div> : timeline.map((e, i) => {
                  const colors = { arrival: 'var(--txt3)', critical: 'var(--coral)', order: 'var(--blue)', result: 'var(--coral)', consult: 'var(--purple)', med: 'var(--teal)', current: 'var(--teal)' };
                  const color = colors[e.type] || 'var(--txt4)';
                  return (
                    <div key={i} className="tl-item">
                      <div className="tl-spine">
                        <div className="tl-dot" style={{ background: color, ...(e.type === 'critical' && { boxShadow: '0 0 8px rgba(255,107,107,.6)' }) }} />
                        {i < timeline.length - 1 && <div className="tl-line" />}
                      </div>
                      <div className="tl-body">
                        <div className="tl-time">{formatTime(e.occurredAt)}</div>
                        <div className="tl-event">{e.title}</div>
                        {e.detail && <div className="tl-detail">{e.detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PROBLEMS + ALLERGIES */}
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="section-box" id="s-problems">
                <div className="sec-header">
                  <span className="sec-icon">🏷️</span>
                  <div><div className="sec-title">Problem List</div><div className="sec-subtitle">Active & historical</div></div>
                  <button className="btn-ghost ml-auto" style={{ fontSize: 11 }}>+ Add</button>
                </div>
                <div className="tab-bar">
                  <div className={`tab ${activeTab.problems === 'active' ? 'active' : ''}`} onClick={() => switchTab('problems', 'active')}>Active ({activeProblems.length})</div>
                  <div className={`tab ${activeTab.problems === 'hx' ? 'active' : ''}`} onClick={() => switchTab('problems', 'hx')}>Historical ({historicalProblems.length})</div>
                </div>
                {(activeTab.problems === 'active' ? activeProblems : historicalProblems).map(p => (
                  <div key={p.icdCode} className="problem-row">
                    <span className="problem-icd">{p.icdCode || '—'}</span>
                    <span className="problem-name">{p.name}{isToday(p.onsetDate) && <span className="badge badge-coral" style={{ fontSize: 9, marginLeft: 4 }}>TODAY</span>}</span>
                    <span className="problem-onset text-xs">{p.onsetYear || formatDate(p.onsetDate) || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="section-box" id="s-allergies">
                <div className="sec-header">
                  <span className="sec-icon">⚠️</span>
                  <div><div className="sec-title">Allergies</div><div className="sec-subtitle">Documented reactions</div></div>
                  <button className="btn-ghost ml-auto" style={{ fontSize: 11 }}>+ Add</button>
                </div>
                <div className="flex flex-col gap-8">
                  {allergies.length === 0 ? <div className="empty-state"><div className="icon">⚠️</div><div className="msg">No allergies documented.</div></div> : allergies.map((a, i) => {
                    const cls = a.severity === 'moderate' ? ' moderate' : a.severity === 'mild' ? ' mild' : '';
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className={`allergy-tag${cls}`}>⚠ {a.allergen} <span className="sev">· {a.severity} · {a.reaction}</span></div>
                        <span className="text-xs text-muted">{a.confirmedDate ? 'Confirmed ' + formatDate(a.confirmedDate) : a.reportedBy || 'Patient-reported'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MEDICATIONS */}
            <div className="section-box" id="s-meds">
              <div className="sec-header">
                <span className="sec-icon">💊</span>
                <div><div className="sec-title">Medications</div><div className="sec-subtitle">Home meds + ED administration record</div></div>
                <div className="flex gap-8 ml-auto">
                  <button className="btn-ghost" style={{ fontSize: 11 }}>📋 Reconcile</button>
                  <button className="btn-ghost" style={{ fontSize: 11 }}>+ Add</button>
                </div>
              </div>
              <div className="tab-bar">
                <div className={`tab ${activeTab.meds === 'ed' ? 'active' : ''}`} onClick={() => switchTab('meds', 'ed')}>ED Given ({edMeds.length})</div>
                <div className={`tab ${activeTab.meds === 'home' ? 'active' : ''}`} onClick={() => switchTab('meds', 'home')}>Home ({homeMeds.length})</div>
                <div className={`tab ${activeTab.meds === 'held' ? 'active' : ''}`} onClick={() => switchTab('meds', 'held')}>Held ({heldMeds.length})</div>
              </div>
              {(activeTab.meds === 'ed' ? edMeds : activeTab.meds === 'home' ? homeMeds : heldMeds).map((m, i) => (
                <div key={i} className="med-row">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeTab.meds === 'ed' ? 'var(--teal)' : activeTab.meds === 'held' ? 'var(--coral)' : 'var(--border)', flexShrink: 0 }} />
                  <span className="med-name">{m.name}</span>
                  <span className="med-dose">{m.dose || '—'}</span>
                  <span className="med-freq">{m.frequency || ''}</span>
                  <span className="med-route">{m.route || '—'}</span>
                  {m.administeredAt && <span className="text-xs text-muted ml-auto">{formatTime(m.administeredAt)}{m.administeredBy ? ' · ' + m.administeredBy : ''}</span>}
                </div>
              ))}
            </div>

            {/* LABS */}
            <div className="section-box" id="s-labs">
              <div className="sec-header">
                <span className="sec-icon">🧪</span>
                <div><div className="sec-title">Laboratory Results</div><div className="sec-subtitle">{labs.length ? `Panel collected ${formatTime(labs[0]?.collectedAt)}` : '—'}</div></div>
                <div className="flex items-center gap-8 ml-auto">
                  {critLabs.length > 0 && <span className="badge badge-coral">⚠ {critLabs.length} Critical</span>}
                  <button className="btn-ghost" style={{ fontSize: 11 }}>+ Order Labs</button>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                {labs.length === 0 ? <div className="empty-state col-full"><div className="icon">🧪</div><div className="msg">No lab results yet.</div></div> : Object.entries(labPanels).map(([name, rows]) => (
                  <div key={name}>
                    <div className="text-xs text-muted mb-8" style={{ textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{name}</div>
                    <table className="lab-table">
                      <thead><tr><th></th><th>Test</th><th>Value</th><th>Reference</th><th>Time</th></tr></thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td><div className={`lab-flag ${r.flag || 'ok'}`} /></td>
                            <td className="text-muted" style={{ fontSize: 12 }}>{r.testName}</td>
                            <td><span className={`lab-val ${r.flag || 'ok'}`}>{r.value}</span> <span className="text-xs text-muted">{r.unit || ''}</span></td>
                            <td className="lab-ref">{r.referenceRange || '—'}</td>
                            <td className="text-xs text-muted">{formatTime(r.collectedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>

            {/* IMAGING */}
            <div className="section-box" id="s-imaging">
              <div className="sec-header">
                <span className="sec-icon">🩻</span>
                <div><div className="sec-title">Imaging</div><div className="sec-subtitle">Completed and pending studies</div></div>
                <button className="btn-ghost ml-auto" style={{ fontSize: 11 }}>+ Order Study</button>
              </div>
              <div className="flex flex-col gap-10">
                {imaging.length === 0 ? <div className="empty-state"><div className="icon">🩻</div><div className="msg">No imaging ordered.</div></div> : imaging.map((s, i) => {
                  const statusBadge = { resulted: 'badge-teal', pending: 'badge-gold', ordered: 'badge-muted' }[s.status] || 'badge-muted';
                  const statusText = { resulted: 'RESULTED', pending: 'IN PROGRESS', ordered: 'ORDERED' }[s.status] || '';
                  const icon = { XR: '🫁', CT: '🧠', MRI: '🧲', ECHO: '❤️', US: '🔊' }[s.modality?.toUpperCase()] || '🩻';
                  return (
                    <div key={i} className="imaging-card">
                      <div className="imaging-icon">{icon}</div>
                      <div className="imaging-body">
                        <div className="flex items-center gap-8"><div className="imaging-title">{s.studyType || s.modality}</div><span className={`badge ${statusBadge}`}>{statusText}</span></div>
                        <div className="imaging-meta">Ordered {formatTime(s.orderedAt)}{s.resultedAt ? ' · Resulted ' + formatTime(s.resultedAt) : ''}{s.radiologist ? ' · ' + s.radiologist : ''}</div>
                        <div className="imaging-finding" style={{ fontStyle: s.finding ? 'normal' : 'italic', color: s.finding ? 'var(--txt2)' : 'var(--txt4)' }}>{s.finding || 'Results pending.'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NOTE */}
            <div className="section-box" id="s-note">
              <div className="sec-header">
                <span className="sec-icon">📝</span>
                <div><div className="sec-title">Current Note Draft</div><div className="sec-subtitle">Auto-assembled — review and sign</div></div>
                <div className="flex gap-8 ml-auto">
                  <button className="btn-ghost">✨ Regenerate</button>
                  <button className="btn-blue">✍ Sign Note</button>
                </div>
              </div>
              <div className="note-preview" dangerouslySetInnerHTML={{ __html: note?.content?.replace(/\n/g, '<br>') || `No note draft. Click "✨ Regenerate" to generate from chart data.` }} />
            </div>

          </main>

          {/* AI PANEL */}
          <aside className="pc-ai">
            <div className="pc-ai-hdr">
              <div className="pc-ai-hdr-top">
                <div className="pc-ai-dot" />
                <span className="pc-ai-label">Notrya AI</span>
                <span className="pc-ai-model">claude-sonnet-4</span>
              </div>
              <div className="pc-ai-qbtns">
                {[['📋 Summarize','Summarize this patient chart.'],['💊 Drug Check','Check for drug interactions.'],['🔍 Workup','Suggest workup.'],['🚪 Disposition','Suggest disposition.'],['📚 Guidelines','Relevant guidelines?']].map(([lbl, q]) => (
                  <button key={lbl} className="pc-ai-qbtn" onClick={() => sendAI(q)}>{lbl}</button>
                ))}
              </div>
            </div>
            <div className="pc-ai-msgs" ref={aiMsgsRef}>
              {aiMessages.map((m, i) => <div key={i} className={`pc-ai-msg ${m.role}`}>{m.text}</div>)}
            </div>
            <div className="pc-ai-input-wrap">
              <textarea className="pc-ai-input" rows={2} placeholder="Ask anything about this patient…" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }} />
              <button className="pc-ai-send" onClick={() => sendAI()}>↑</button>
            </div>
          </aside>
        </div>

        {/* BOTTOM BAR */}
        <div className="pc-bottom">
          <button className="btn-ghost">← Back</button>
          <span className="pc-step-lbl">Chart</span>
          <div className="pc-stepper-dots">
            {NAV_SECTIONS.map((s, i) => (
              <div key={i} className={`pc-step-dot ${activeSection === s.id ? 'current' : dotClass(s.dot) || 'empty'}`} title={s.label} onClick={() => scrollToSection(s.id)} />
            ))}
          </div>
          <span className="pc-cur-lbl">{NAV_SECTIONS.find(s => s.id === activeSection)?.label || ''}</span>
          <button className="btn-teal" style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700 }}>Next →</button>
        </div>
      </div>
    </>
  );
}