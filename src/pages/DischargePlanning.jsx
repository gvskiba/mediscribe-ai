import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--nav-h:50px;--sub-nav-h:42px;--vit-h:40px;--icon-sb:65px;--sb-w:230px;--ai-w:295px;--r:8px;--rl:12px}
.dcw *{box-sizing:border-box}
.dcw{background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;display:flex;height:100%;overflow:hidden}
/* SCROLLBAR */
.dcw ::-webkit-scrollbar{width:4px;height:4px}
.dcw ::-webkit-scrollbar-track{background:transparent}
.dcw ::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
/* ICON SIDEBAR */
.dcw-isb{width:var(--icon-sb);flex-shrink:0;background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;z-index:200}
.dcw-isb-logo{width:100%;height:var(--nav-h);flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border)}
.dcw-isb-logo-box{width:34px;height:34px;background:var(--blue);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:11px;font-weight:700;color:white;cursor:pointer;letter-spacing:-.5px}
.dcw-isb-scroll{overflow-y:auto;width:100%;flex:1;display:flex;flex-direction:column;align-items:center;padding:6px 0 10px;gap:1px}
.dcw-isb-group-label{font-size:8px;color:var(--txt4);text-transform:uppercase;letter-spacing:.08em;text-align:center;padding:6px 4px 2px;width:100%}
.dcw-isb-btn{width:48px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:var(--r);cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent}
.dcw-isb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
.dcw-isb-btn.active{background:rgba(0,229,192,.1);border-color:rgba(0,229,192,.3);color:var(--teal)}
.dcw-isb-icon{font-size:16px;line-height:1}
.dcw-isb-lbl{font-size:8.5px;line-height:1;white-space:nowrap}
.dcw-isb-sep{width:36px;height:1px;background:var(--border);margin:4px 0;flex-shrink:0}
/* RIGHT COLUMN */
.dcw-right{flex:1;display:flex;flex-direction:column;overflow:hidden}
/* NAVBAR */
.dcw-navbar{height:var(--nav-h);background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;z-index:100}
.dcw-nav-welcome{font-size:13px;color:var(--txt2);font-weight:500;white-space:nowrap}
.dcw-nav-welcome strong{color:var(--txt);font-weight:600}
.dcw-nav-sep{width:1px;height:22px;background:var(--border);flex-shrink:0}
.dcw-nav-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 12px;min-width:70px;cursor:pointer}
.dcw-nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--txt);line-height:1.2}
.dcw-nav-stat-val.alert{color:var(--gold)}
.dcw-nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}
.dcw-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.dcw-nav-specialty{display:flex;align-items:center;gap:5px;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer}
.dcw-nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--txt2);display:flex;align-items:center;gap:5px}
.dcw-nav-ai-on{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:600;color:var(--teal)}
.dcw-nav-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:dcw-ai-pulse 2s ease-in-out infinite}
@keyframes dcw-ai-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
.dcw-nav-new-pt{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
/* SUB-NAVBAR */
.dcw-subnav{height:var(--sub-nav-h);background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;z-index:99}
.dcw-subnav-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-.5px}
.dcw-subnav-sep{color:var(--txt4);font-size:14px}
.dcw-subnav-title{font-size:13px;color:var(--txt2);font-weight:500}
.dcw-subnav-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace}
.dcw-subnav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
/* VITALS BAR */
.dcw-vbar{height:var(--vit-h);background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;overflow:hidden}
.dcw-vbar-name{font-family:'Playfair Display',serif;font-size:14px;color:var(--txt);font-weight:600;white-space:nowrap}
.dcw-vbar-meta{font-size:11px;color:var(--txt3);white-space:nowrap}
.dcw-vbar-div{width:1px;height:20px;background:var(--border);flex-shrink:0}
.dcw-vital{display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap}
.dcw-vital .lbl{color:var(--txt4);font-size:9px;text-transform:uppercase;letter-spacing:.04em}
.dcw-vital .val{font-family:'JetBrains Mono',monospace;color:var(--txt2);font-weight:600}
/* MAIN WRAP */
.dcw-main-wrap{flex:1;display:flex;overflow:hidden}
/* SIDEBAR */
.dcw-sb{width:var(--sb-w);flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dcw-sb.collapsed{width:36px}
.dcw-sb-collapse-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dcw-sb.collapsed .dcw-sb-collapse-tab{display:flex}
.dcw-sb.collapsed .dcw-sb-inner{display:none}
.dcw-sb-tab-icon{font-size:15px;color:var(--txt4)}
.dcw-sb-tab-label{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none}
.dcw-sb-inner{overflow-y:auto;flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:5px;min-width:0}
.dcw-sb-toggle-btn{width:28px;height:28px;border-radius:7px;margin-left:auto;flex-shrink:0;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:18px;font-weight:700;color:var(--txt2);line-height:1}
.dcw-sb-toggle-btn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dcw-sb-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:4px}
.dcw-sb-nav-btn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2)}
.dcw-sb-nav-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt)}
.dcw-sb-nav-btn.active{background:rgba(0,229,192,.09);border-color:rgba(0,229,192,.3);color:var(--teal)}
.dcw-sb-dot{width:7px;height:7px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0}
.dcw-sb-dot.done{background:var(--teal);box-shadow:0 0 6px rgba(0,229,192,.5)}
.dcw-sb-divider{height:1px;background:var(--border);margin:6px 0}
.dcw-sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:11px 12px;margin-bottom:4px}
/* CONTENT */
.dcw-content{flex:1;overflow-y:auto;padding:16px 20px 50px;display:flex;flex-direction:column;gap:16px}
/* AI PANEL */
.dcw-ai-panel{width:var(--ai-w);flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dcw-ai-panel.collapsed{width:36px}
.dcw-ai-collapse-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dcw-ai-panel.collapsed .dcw-ai-collapse-tab{display:flex}
.dcw-ai-panel.collapsed .dcw-ai-panel-inner{display:none}
.dcw-ai-tab-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);animation:dcw-ai-pulse 2s ease-in-out infinite;flex-shrink:0}
.dcw-ai-tab-label{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none}
.dcw-ai-panel-inner{display:flex;flex-direction:column;flex:1;overflow:hidden;min-width:0}
.dcw-ai-toggle-btn{width:28px;height:28px;border-radius:7px;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0;font-size:18px;font-weight:700;color:var(--txt2);line-height:1}
.dcw-ai-toggle-btn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dcw-ai-header{padding:11px 13px;border-bottom:1px solid var(--border);flex-shrink:0}
.dcw-ai-header-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.dcw-ai-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);flex-shrink:0;animation:dcw-ai-pulse 2s ease-in-out infinite}
.dcw-ai-label{font-size:12px;font-weight:600;color:var(--txt2)}
.dcw-ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3)}
.dcw-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.dcw-ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;transition:all .15s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);font-family:'DM Sans',sans-serif}
.dcw-ai-qbtn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.06)}
.dcw-ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.dcw-ai-msg{padding:9px 11px;border-radius:var(--r);font-size:12px;line-height:1.55}
.dcw-ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border)}
.dcw-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2)}
.dcw-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt)}
.dcw-ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
.dcw-ai-loader span{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:dcw-bounce 1.2s ease-in-out infinite}
.dcw-ai-loader span:nth-child(2){animation-delay:.2s}.dcw-ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes dcw-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.dcw-ai-input-wrap{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:6px}
.dcw-ai-input{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
.dcw-ai-input:focus{border-color:var(--teal)}
.dcw-ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;flex-shrink:0;font-weight:700}
/* SECTIONS */
.dcw-sec{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.dcw-sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.dcw-sec-icon{font-size:18px}
.dcw-sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--txt)}
.dcw-sec-subtitle{font-size:11px;color:var(--txt3);margin-top:1px}
/* FIELDS */
.dcw-field{display:flex;flex-direction:column;gap:4px}
.dcw-field-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em}
.dcw-input{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%}
.dcw-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.07)}
.dcw-textarea{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:9px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:80px;width:100%;line-height:1.6;transition:border-color .15s}
.dcw-textarea:focus{border-color:var(--blue)}
.dcw-select{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%}
.dcw-select:focus{border-color:var(--blue)}
.dcw-select option{background:#0d2240}
/* GRIDS */
.dcw-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dcw-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
/* BUTTONS */
.dcw-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:var(--r);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:none;font-family:'DM Sans',sans-serif;white-space:nowrap}
.dcw-btn-ghost{background:var(--bg-up);border:1px solid var(--border)!important;color:var(--txt2)}
.dcw-btn-ghost:hover{border-color:var(--border-hi)!important;color:var(--txt)}
.dcw-btn-primary{background:var(--teal);color:var(--bg)}
.dcw-btn-primary:hover{filter:brightness(1.1)}
.dcw-btn-gold{background:rgba(245,200,66,.13);border:1px solid rgba(245,200,66,.35)!important;color:var(--gold)}
.dcw-btn-gold:hover{background:rgba(245,200,66,.22)}
/* BADGES */
.dcw-badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;display:inline-block}
.dcw-badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.dcw-badge-blue{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}
.dcw-badge-gold{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}
.dcw-badge-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3)}
.dcw-badge-purple{background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3)}
/* DISPOSITION */
.dcw-disp-label{font-size:11px;color:var(--txt3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;font-weight:600}
.dcw-disp-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
.dcw-disp-card{background:var(--bg-card);border:2px solid var(--border);border-radius:14px;padding:14px 8px 12px;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;user-select:none}
.dcw-disp-card:hover{border-color:var(--border-hi);background:var(--bg-up);transform:translateY(-1px)}
.dcw-disp-card.active-home{border-color:var(--teal)!important;background:rgba(0,229,192,.07)!important;box-shadow:0 0 0 1px rgba(0,229,192,.25),0 4px 20px rgba(0,229,192,.15);transform:translateY(-2px)}
.dcw-disp-card.active-home .dcw-disp-name{color:var(--teal)!important}
.dcw-disp-card.active-floor{border-color:var(--blue)!important;background:rgba(59,158,255,.07)!important;box-shadow:0 0 0 1px rgba(59,158,255,.25),0 4px 20px rgba(59,158,255,.12);transform:translateY(-2px)}
.dcw-disp-card.active-floor .dcw-disp-name{color:var(--blue)!important}
.dcw-disp-card.active-telem{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dcw-disp-card.active-telem .dcw-disp-name{color:var(--gold)!important}
.dcw-disp-card.active-icu{border-color:var(--coral)!important;background:rgba(255,107,107,.07)!important;transform:translateY(-2px)}
.dcw-disp-card.active-icu .dcw-disp-name{color:var(--coral)!important}
.dcw-disp-card.active-obs{border-color:var(--purple)!important;background:rgba(155,109,255,.07)!important;transform:translateY(-2px)}
.dcw-disp-card.active-obs .dcw-disp-name{color:var(--purple)!important}
.dcw-disp-card.active-tx{border-color:var(--orange)!important;background:rgba(255,159,67,.07)!important;transform:translateY(-2px)}
.dcw-disp-card.active-tx .dcw-disp-name{color:var(--orange)!important}
.dcw-disp-card.active-ama{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dcw-disp-card.active-ama .dcw-disp-name{color:var(--gold)!important}
.dcw-disp-card.active-expired{border-color:var(--txt4)!important;background:rgba(46,74,106,.15)!important;transform:translateY(-2px)}
.dcw-disp-card.active-expired .dcw-disp-name{color:var(--txt3)!important}
.dcw-disp-emoji{font-size:28px;line-height:1;margin-bottom:2px}
.dcw-disp-name{font-size:12px;font-weight:700;color:var(--txt);line-height:1.2;transition:color .18s}
.dcw-disp-sub{font-size:10px;color:var(--txt3);line-height:1.3;margin-top:1px}
.dcw-disp-banner{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:var(--r);margin-top:12px;border:1px solid;font-size:12px;font-weight:600}
/* EM CARDS */
.dcw-em-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:13px 15px;transition:all .15s;cursor:pointer;position:relative;overflow:hidden}
.dcw-em-card:hover{border-color:var(--border-hi)}
.dcw-em-card.em-sel{border-color:var(--blue);background:rgba(59,158,255,.07)}
.dcw-em-card.em-sel::after{content:'✓';position:absolute;top:8px;right:10px;color:var(--blue);font-size:14px;font-weight:700}
.dcw-em-badge{font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;margin-top:5px;display:inline-block}
/* MDM ROWS */
.dcw-mdm-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-up);border-radius:var(--r);margin-bottom:6px}
/* ROWS */
.dcw-row{display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:10px 13px;margin-bottom:6px;transition:border-color .15s}
.dcw-row:hover{border-color:var(--border-hi)}
.dcw-row-inp{background:transparent;border:none;outline:none;font-size:12px;color:var(--txt2);font-family:'DM Sans',sans-serif;flex:1;min-width:0}
.dcw-row-del{color:var(--txt4);cursor:pointer;font-size:15px;transition:color .15s;background:none;border:none;padding:0 2px}
.dcw-row-del:hover{color:var(--coral)}
.dcw-add-row{display:flex;gap:6px;align-items:center;margin-top:8px}
.dcw-add-inp{flex:1;background:var(--bg-up);border:1px dashed var(--border);border-radius:var(--r);padding:7px 11px;color:var(--txt);font-size:12px;outline:none;font-family:'DM Sans',sans-serif}
.dcw-add-inp:focus{border-style:solid;border-color:var(--blue)}
.dcw-add-inp::placeholder{color:var(--txt4)}
/* RETURN CARDS */
.dcw-return-card{background:rgba(255,107,107,.05);border:1px solid rgba(255,107,107,.22);border-radius:var(--r);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;transition:all .15s}
.dcw-return-card:hover{background:rgba(255,107,107,.09);border-color:rgba(255,107,107,.35)}
/* INSTR */
.dcw-instr-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;margin-bottom:10px}
.dcw-instr-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid var(--border)}
/* SIG */
.dcw-sig{background:linear-gradient(135deg,rgba(0,229,192,.06),rgba(59,158,255,.04));border:1px solid rgba(0,229,192,.2);border-radius:var(--rl);padding:18px 20px}
.dcw-sig-line{height:1px;background:rgba(0,229,192,.2);margin:12px 0}
/* CRITICAL CARE */
.dcw-cc-accent{background:linear-gradient(135deg,rgba(255,107,107,.1),rgba(155,109,255,.06));border:1px solid rgba(255,107,107,.28);border-radius:var(--rl);padding:16px 20px;margin-bottom:12px}
.dcw-cc-title-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,107,107,.14);border:1px solid rgba(255,107,107,.35);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--coral);letter-spacing:.05em;text-transform:uppercase}
.dcw-cc-time-strip{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px}
.dcw-cc-time-label{font-size:9px;color:var(--txt4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.dcw-cc-time-val{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--coral);line-height:1}
.dcw-cc-time-note{font-size:10px;color:var(--txt3);margin-top:2px}
.dcw-cc-sec{margin-bottom:14px}
.dcw-cc-sec-lbl{font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.dcw-organ-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.dcw-organ-chip{display:flex;align-items:center;gap:7px;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;cursor:pointer;transition:all .15s;user-select:none}
.dcw-organ-chip:hover{border-color:var(--border-hi)}
.dcw-organ-chip.active{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.4)}
.dcw-organ-chip.active .dcw-organ-chk{background:var(--coral);border-color:var(--coral)}
.dcw-organ-chk{width:15px;height:15px;border-radius:3px;border:1.5px solid var(--border);background:var(--bg-card);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:var(--bg);transition:all .15s}
.dcw-organ-lbl{font-size:12px;color:var(--txt2);font-weight:500}
.dcw-organ-chip.active .dcw-organ-lbl{color:var(--coral);font-weight:600}
.dcw-sev-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.dcw-sev-btn{flex:1;min-width:110px;padding:10px 8px;border-radius:var(--r);border:1.5px solid var(--border);background:var(--bg-up);text-align:center;cursor:pointer;transition:all .15s;user-select:none}
.dcw-sev-btn.active-imm{border-color:var(--coral);background:rgba(255,107,107,.12)}
.dcw-sev-btn.active-imm .dcw-sev-btn-lbl{color:var(--coral)}
.dcw-sev-btn.active-life{border-color:var(--orange);background:rgba(255,159,67,.10)}
.dcw-sev-btn.active-life .dcw-sev-btn-lbl{color:var(--orange)}
.dcw-sev-btn.active-org{border-color:var(--gold);background:rgba(245,200,66,.10)}
.dcw-sev-btn.active-org .dcw-sev-btn-lbl{color:var(--gold)}
.dcw-sev-btn-lbl{font-size:11px;font-weight:700}
.dcw-sev-btn-sub{font-size:10px;color:var(--txt3);margin-top:2px}
.dcw-addon-tracker{display:flex;align-items:center;gap:12px;background:rgba(155,109,255,.08);border:1px solid rgba(155,109,255,.25);border-radius:var(--r);padding:6px 10px;margin-top:4px}
.dcw-addon-ctrl{width:28px;height:28px;border-radius:6px;border:1px solid rgba(155,109,255,.3);background:rgba(155,109,255,.12);color:var(--purple);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.dcw-addon-ctrl:hover{background:rgba(155,109,255,.25)}
.dcw-addon-cnt{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--purple);min-width:28px;text-align:center}
.dcw-attest{background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.2);border-radius:var(--r);padding:12px 14px;font-size:12px;line-height:1.65;color:var(--txt2)}
.dcw-attest strong{color:var(--teal)}
.dcw-cc-ai-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:linear-gradient(135deg,rgba(255,107,107,.18),rgba(155,109,255,.12));border:1px solid rgba(255,107,107,.4);border-radius:var(--r);color:var(--coral);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.dcw-cc-ai-btn:hover{filter:brightness(1.1)}
.dcw-cc-ai-btn:disabled{opacity:.5;cursor:wait}
/* SPIN */
.dcw-spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(0,229,192,.2);border-top-color:var(--teal);border-radius:50%;animation:dcw-spinr .6s linear infinite}
@keyframes dcw-spinr{to{transform:rotate(360deg)}}
`;

const DISPS = [
  { id:"home",    cls:"active-home",    icon:"🏠", label:"Discharge Home",    sub:"Patient may safely return home",      bannerStyle:{background:"rgba(0,229,192,.07)",borderColor:"rgba(0,229,192,.25)",color:"#00e5c0"},   bannerText:"Patient discharged home in stable condition.",     bannerSub:"Instructions reviewed and signed." },
  { id:"floor",   cls:"active-floor",   icon:"🏥", label:"Admit — Floor",     sub:"General medical/surgical floor",      bannerStyle:{background:"rgba(59,158,255,.07)",borderColor:"rgba(59,158,255,.25)",color:"#3b9eff"},  bannerText:"Patient admitted to general floor.",               bannerSub:"Admitting orders placed." },
  { id:"telem",   cls:"active-telem",   icon:"📡", label:"Admit — Telemetry", sub:"Continuous cardiac monitoring",       bannerStyle:{background:"rgba(245,200,66,.07)",borderColor:"rgba(245,200,66,.2)",color:"#f5c842"},   bannerText:"Patient admitted to telemetry.",                   bannerSub:"Cardiac monitoring initiated." },
  { id:"icu",     cls:"active-icu",     icon:"🚨", label:"Admit — ICU",       sub:"Critical care — high acuity",         bannerStyle:{background:"rgba(255,107,107,.07)",borderColor:"rgba(255,107,107,.25)",color:"#ff6b6b"}, bannerText:"Patient admitted to the ICU.",                     bannerSub:"ICU team bedside." },
  { id:"obs",     cls:"active-obs",     icon:"🔭", label:"Observation",       sub:"Hospital outpatient status <48h",     bannerStyle:{background:"rgba(155,109,255,.07)",borderColor:"rgba(155,109,255,.2)",color:"#9b6dff"},  bannerText:"Patient in observation status.",                   bannerSub:"Expected stay < 48 hours." },
  { id:"tx",      cls:"active-tx",      icon:"🚑", label:"Transfer",          sub:"Higher level / specialty facility",   bannerStyle:{background:"rgba(255,159,67,.07)",borderColor:"rgba(255,159,67,.2)",color:"#ff9f43"},   bannerText:"Patient transferred to receiving facility.",        bannerSub:"Accepting physician confirmed." },
  { id:"ama",     cls:"active-ama",     icon:"⚠️", label:"AMA",               sub:"Against Medical Advice",              bannerStyle:{background:"rgba(245,200,66,.07)",borderColor:"rgba(245,200,66,.2)",color:"#f5c842"},   bannerText:"Patient leaving AMA.",                             bannerSub:"Risks explained. AMA form signed." },
  { id:"expired", cls:"active-expired", icon:"🕯️", label:"Expired",           sub:"Patient expired in ED",               bannerStyle:{background:"rgba(46,74,106,.15)",borderColor:"rgba(74,106,138,.3)",color:"#4a6a8a"},    bannerText:"Patient expired in the Emergency Department.",     bannerSub:"Time of death documented." },
];

const EM_CARDS = [
  { code:"99281", level:"L1",       levelColor:"#e8f0fe", desc:"Self-limited or minor problem. Minimal assessment.",               time:"≤ 15 min",              cplx:"MINIMAL",        cplxBg:"rgba(0,229,192,.12)",   cplxColor:"#00e5c0" },
  { code:"99282", level:"L2",       levelColor:"#e8f0fe", desc:"Low complexity. New/established condition with low risk.",          time:"16–25 min",             cplx:"LOW",            cplxBg:"rgba(0,229,192,.12)",   cplxColor:"#00e5c0" },
  { code:"99283", level:"L3",       levelColor:"#e8f0fe", desc:"Moderate complexity. Multiple presenting problems.",                time:"26–35 min",             cplx:"MODERATE",       cplxBg:"rgba(245,200,66,.12)",  cplxColor:"#f5c842" },
  { code:"99284", level:"L4",       levelColor:"#e8f0fe", desc:"High complexity. High risk. Undiagnosed new problem.",             time:"36–45 min",             cplx:"HIGH",           cplxBg:"rgba(255,107,107,.12)", cplxColor:"#ff6b6b" },
  { code:"99285", level:"L5",       levelColor:"#e8f0fe", desc:"High complexity. Immediate threat to life or function.",           time:"46–60 min",             cplx:"HIGHEST",        cplxBg:"rgba(155,109,255,.12)", cplxColor:"#9b6dff" },
  { code:"99291", level:"Critical", levelColor:"#ff6b6b", desc:"Critical care, first 30–74 min. Direct care with high complexity MDM.", time:"30–74 min (+99292/30min)", cplx:"CRITICAL CARE", cplxBg:"rgba(155,109,255,.12)", cplxColor:"#9b6dff" },
  { code:"99285-25", level:"L5+Proc", levelColor:"#9b6dff", desc:"Level 5 with significant, separately identifiable procedure.",  time:"Modifier -25 required", cplx:"HIGHEST+PROC",   cplxBg:"rgba(155,109,255,.12)", cplxColor:"#9b6dff" },
];

const NAV_SECTIONS = [
  { id:"disp",   icon:"🚪", label:"Disposition" },
  { id:"em",     icon:"🧮", label:"E&M Coding" },
  { id:"dx",     icon:"📋", label:"Diagnoses" },
  { id:"instr",  icon:"📄", label:"DC Instructions" },
  { id:"return", icon:"🚨", label:"Return Precautions" },
  { id:"fu",     icon:"📅", label:"Follow-Up" },
  { id:"rx",     icon:"💊", label:"Discharge Meds" },
  { id:"sig",    icon:"✍",  label:"Sign & Finalize" },
];

const RETURN_ITEMS = [
  { icon:"🫀", strong:"Chest pain, pressure, or tightness", rest:" that is new, returns, worsens, or radiates — call 911 immediately." },
  { icon:"😵", strong:"Sudden severe headache", rest:", face drooping, arm weakness, or difficulty speaking — call 911." },
  { icon:"🌬️", strong:"Shortness of breath", rest:" at rest, difficulty breathing, or oxygen below 94%." },
  { icon:"💓", strong:"Rapid, irregular, or pounding heartbeat", rest:" with dizziness, fainting, or near-fainting." },
  { icon:"😰", strong:"Severe sweating, nausea, or vomiting", rest:" with chest discomfort." },
  { icon:"🩸", strong:"Blood sugar < 70 mg/dL", rest:" not responding to treatment, or > 400 mg/dL." },
  { icon:"😟", strong:"Any other symptom", rest:" that feels severe, sudden, or different from usual." },
];

const ISB_ITEMS = [
  { type:"group", label:"CORE" },
  { type:"btn", icon:"🏠", label:"Home" },
  { type:"btn", icon:"📊", label:"Dashboard" },
  { type:"btn", icon:"🔄", label:"Shift" },
  { type:"btn", icon:"👥", label:"Patients" },
  { type:"sep" },
  { type:"group", label:"DOCUMENTATION" },
  { type:"btn", icon:"✨", label:"Note Hub" },
  { type:"btn", icon:"🎙️", label:"Transcribe" },
  { type:"btn", icon:"📄", label:"SOAP" },
  { type:"btn", icon:"📝", label:"Notes" },
  { type:"btn", icon:"⚖️", label:"MDM" },
  { type:"btn", icon:"🩺", label:"Plan" },
  { type:"btn", icon:"💊", label:"eRx" },
  { type:"btn", icon:"🚪", label:"Discharge", active:true },
  { type:"sep" },
  { type:"group", label:"REFERENCE" },
  { type:"btn", icon:"🦠", label:"Antibiotics" },
  { type:"btn", icon:"🧮", label:"Calculators" },
];

const ORGAN_LIST = [
  { label:"🫀 Cardiovascular", key:"Cardiovascular" },
  { label:"🫁 Respiratory", key:"Respiratory" },
  { label:"🧠 Neurological", key:"Neurological" },
  { label:"🫘 Renal", key:"Renal" },
  { label:"🟤 Hepatic", key:"Hepatic" },
  { label:"🩸 Hematologic", key:"Hematologic" },
  { label:"⚗️ Metabolic/Endo", key:"Metabolic / Endocrine" },
  { label:"🦠 Infectious/Sepsis", key:"Infectious / Sepsis" },
];

const INTERV_LIST = [
  { label:"Intubation / RSI", key:"Endotracheal Intubation / RSI" },
  { label:"Mechanical Ventilation", key:"Mechanical Ventilation Management" },
  { label:"Vasopressors", key:"Vasopressor Initiation / Titration" },
  { label:"CPR / ACLS", key:"CPR / Advanced Resuscitation" },
  { label:"Central Line", key:"Central Venous Access (CVC)" },
  { label:"Arterial Line", key:"Arterial Line Placement" },
  { label:"Cardioversion", key:"Cardioversion / Defibrillation" },
  { label:"MTP / Blood Products", key:"Massive Transfusion Protocol" },
  { label:"Hemodynamic Monitor", key:"Hemodynamic Monitoring" },
  { label:"Sedation/Analgesia", key:"Sedation / Analgesia Titration" },
  { label:"Chest Tube", key:"Chest Tube Thoracostomy" },
  { label:"POCUS", key:"Point-of-Care Ultrasound (POCUS)" },
];

const now = new Date();
const pad = n => String(n).padStart(2, "0");
const TODAY_DATE = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()}`;
const TODAY_TIME = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default function DischargePlanning() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [clock, setClock] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setCurrentUser(u);
        const notes = await base44.entities.ClinicalNote.list("-updated_date", 20);
        setClinicalNotes(notes || []);
        if (notes?.length) setSelectedNoteId(notes[0].id);
      } catch (e) {}
    })();
    const t = setInterval(() => {
      const d = new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const note = clinicalNotes.find(n => n.id === selectedNoteId) || null;
  const patientName = note?.patient_name || "— Patient Name —";
  const patientMRN  = note?.patient_id  || "00847291";
  const patientDOB  = note?.date_of_birth || "04/22/1962";
  const patientCC   = note?.chief_complaint || "Chest Pain";
  const noteAllergies = note?.allergies || [];
  const attendingName = currentUser?.full_name || "Dr. Gabriel Skiba";

  // UI state
  const [sbOpen, setSbOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("disp");
  const [disp, setDisp] = useState(null);
  const [emCode, setEmCode] = useState(null);
  const [dots, setDots] = useState({});
  const [dcStatus, setDcStatus] = useState("DRAFT");
  const [saving, setSaving] = useState(false);

  // Diagnoses
  const [dxList, setDxList] = useState([
    { id:1, code:"R07.9", name:"Chest pain, unspecified", primary:true },
    { id:2, code:"I10",   name:"Essential hypertension",  primary:false },
  ]);
  const [newDxCode, setNewDxCode] = useState("");
  const [newDxName, setNewDxName] = useState("");

  // Instructions
  const [instrDiag, setInstrDiag] = useState("");
  const [instrTreat, setInstrTreat] = useState("");
  const [instrMeds, setInstrMeds] = useState("");
  const [instrAct, setInstrAct] = useState("");
  const [instrMisc, setInstrMisc] = useState("");
  const [instrGenerated, setInstrGenerated] = useState(false);
  const [generatingInstr, setGeneratingInstr] = useState(false);

  // Return
  const [returnCustom, setReturnCustom] = useState("");

  // Follow-up
  const [fuList, setFuList] = useState([
    { id:1, icon:"🫀", specialty:"Cardiology", note:"Within 1–2 weeks — stress test or outpatient evaluation", urgency:"Urgent" },
    { id:2, icon:"🩺", specialty:"Primary Care Physician (PCP)", note:"Within 3–5 days — blood pressure check", urgency:"Routine" },
  ]);
  const [newFu, setNewFu] = useState("");
  const [newFuUrg, setNewFuUrg] = useState("Routine");

  // Meds
  const [dcRxList, setDcRxList] = useState([
    { id:"r1", drug:"Aspirin 81mg", sig:"Take 1 tablet by mouth once daily", type:"CONTINUE" },
    { id:"r2", drug:"Nitroglycerin 0.4mg SL", sig:"Place 1 tablet under tongue for chest pain. Call 911 if no relief.", type:"NEW" },
  ]);
  const [newRxDrug, setNewRxDrug] = useState("");
  const [newRxSig, setNewRxSig] = useState("");
  const [newRxType, setNewRxType] = useState("NEW");

  // Admit / Transfer fields
  const [admitService, setAdmitService] = useState("");
  const [admitMD, setAdmitMD] = useState("");
  const [admitBed, setAdmitBed] = useState("");
  const [txFacility, setTxFacility] = useState("");
  const [txReason, setTxReason] = useState("");
  const [txMD, setTxMD] = useState("");
  const [txMode, setTxMode] = useState("ALS Ambulance");

  // MDM
  const [mdmProblems, setMdmProblems] = useState("");
  const [mdmData, setMdmData] = useState("");
  const [mdmRisk, setMdmRisk] = useState("");
  const [mdmNarrative, setMdmNarrative] = useState("");
  const [emTime, setEmTime] = useState("");
  const [emFaceTime, setEmFaceTime] = useState("");
  const [emProcCpt, setEmProcCpt] = useState("");

  // Critical care
  const [showCC, setShowCC] = useState(false);
  const [ccStart, setCcStart] = useState("");
  const [ccEnd, setCcEnd] = useState("");
  const [ccAddon, setCcAddon] = useState(0);
  const [ccSeverity, setCcSeverity] = useState("");
  const [ccOrgans, setCcOrgans] = useState([]);
  const [ccInterventions, setCcInterventions] = useState([]);
  const [ccCondition, setCcCondition] = useState("");
  const [ccIntervText, setCcIntervText] = useState("");
  const [ccLabs, setCcLabs] = useState("");
  const [ccResponse, setCcResponse] = useState("");
  const [ccConsults, setCcConsults] = useState("");
  const [ccDispo, setCcDispo] = useState("");
  const [ccImpression, setCcImpression] = useState("");
  const [ccBp, setCcBp] = useState("");
  const [ccHr, setCcHr] = useState("");
  const [ccRr, setCcRr] = useState("");
  const [ccSpo2, setCcSpo2] = useState("");
  const [ccTemp, setCcTemp] = useState("");
  const [ccGcs, setCcGcs] = useState("");
  const [ccMap, setCcMap] = useState("");
  const [ccSig, setCcSig] = useState("");
  const [ccSigDt, setCcSigDt] = useState("");
  const [ccAiLoading, setCcAiLoading] = useState(false);

  // Signature
  const [sigDate, setSigDate] = useState(TODAY_DATE);
  const [sigTime, setSigTime] = useState(TODAY_TIME);
  const [sigPt, setSigPt] = useState("");
  const [sigRel, setSigRel] = useState("");
  const [sigRN, setSigRN] = useState("");
  const [sigNote, setSigNote] = useState("");

  // AI
  const [aiMsgs, setAiMsgs] = useState([{ role:"sys", text:"Notrya AI Discharge Advisor ready. Select disposition to begin, then use quick actions to auto-generate instructions, E&M level, and return precautions from chart data." }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiMsgsRef = useRef(null);

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMsgs, aiLoading]);

  const setDot = (id, done) => setDots(p => ({ ...p, [id]: done }));
  const appendMsg = (role, text) => setAiMsgs(p => [...p, { role, text }]);

  const buildCtx = () =>
    `Patient: ${patientName} | DOB: ${patientDOB} | MRN: ${patientMRN} | CC: ${patientCC} | Allergies: ${noteAllergies.join(", ")||"NKDA"} | Provider: ${attendingName} | Disposition: ${disp||"Not set"} | E&M: ${emCode||"Not selected"}`;

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput("");
    appendMsg("user", question);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an expert emergency medicine physician. Help complete discharge documentation accurately. Be concise and clinical.\n\nContext: ${buildCtx()}\n\nQuestion: ${question}`,
      });
      appendMsg("bot", typeof res === "string" ? res : JSON.stringify(res));
    } catch (e) { appendMsg("sys", "⚠ Connection error. Please try again."); }
    setAiLoading(false);
  };

  const generateInstructions = async () => {
    setGeneratingInstr(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate comprehensive, patient-friendly discharge instructions for: Patient ${patientName}, CC: ${patientCC}, Allergies: ${noteAllergies.join(",")||"NKDA"}, Meds: ${dcRxList.map(r=>r.drug).join(", ")}. Return JSON with keys: diagnosis, treatment, medications, activity, additional. Write at 6th grade reading level.`,
        response_json_schema: { type:"object", properties:{ diagnosis:{type:"string"}, treatment:{type:"string"}, medications:{type:"string"}, activity:{type:"string"}, additional:{type:"string"} } }
      });
      if (res.diagnosis)   setInstrDiag(res.diagnosis);
      if (res.treatment)   setInstrTreat(res.treatment);
      if (res.medications) setInstrMeds(res.medications);
      if (res.activity)    setInstrAct(res.activity);
      if (res.additional)  setInstrMisc(res.additional);
      setInstrGenerated(true);
      setDot("instr", true);
      appendMsg("bot", "✅ Discharge instructions generated. Review and edit as needed.");
    } catch (e) { appendMsg("sys", "⚠ Generation failed. Please try again."); }
    setGeneratingInstr(false);
  };

  const generateCCNote = async () => {
    appendMsg("user", "Generate Critical Care note from chart data");
    setCcAiLoading(true);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a complete Critical Care (CPT 99291) note. Context: ${buildCtx()}. Organs involved: ${ccOrgans.join(", ")||"See chart"}. Interventions: ${ccInterventions.join(", ")||"See chart"}. Return JSON: { condition, impression, labs, response, consults, dispo, interventions_text }`,
        response_json_schema: { type:"object", properties:{ condition:{type:"string"}, impression:{type:"string"}, labs:{type:"string"}, response:{type:"string"}, consults:{type:"string"}, dispo:{type:"string"}, interventions_text:{type:"string"} } }
      });
      if (res.condition && !ccCondition) setCcCondition(res.condition);
      if (res.impression && !ccImpression) setCcImpression(res.impression);
      if (res.labs && !ccLabs) setCcLabs(res.labs);
      if (res.response && !ccResponse) setCcResponse(res.response);
      if (res.consults && !ccConsults) setCcConsults(res.consults);
      if (res.dispo && !ccDispo) setCcDispo(res.dispo);
      if (res.interventions_text && !ccIntervText) setCcIntervText(res.interventions_text);
      appendMsg("bot", "✅ Critical Care Note generated. Review all sections and verify attestation before signing.");
    } catch (e) { appendMsg("sys", "⚠ Generation failed."); }
    setCcAiLoading(false);
    setAiLoading(false);
  };

  const calcCCTime = (start, end) => {
    if (!start || !end) return "—";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 1440;
    if (mins === 0) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const finalizeDischarge = async () => {
    if (!disp) { appendMsg("sys", "⚠ Please select a disposition before finalizing."); return; }
    setSaving(true);
    try {
      if (note) await base44.entities.ClinicalNote.update(note.id, { disposition_plan: disp, status: "finalized" });
      setDcStatus("SIGNED");
      NAV_SECTIONS.forEach(s => setDot(s.id, true));
      appendMsg("bot", `✅ **Discharge summary signed and finalized** for ${patientName}.\n\nDisposition: **${disp}** · E&M: **${emCode||"Not selected"}**\n\nDischarge papers are ready to print.`);
    } catch (e) { appendMsg("sys", "⚠ Save failed. Please try again."); }
    setSaving(false);
  };

  const addDx = () => {
    if (!newDxName.trim()) return;
    setDxList(p => [...p, { id:Date.now(), code:newDxCode, name:newDxName, primary:false }]);
    setNewDxCode(""); setNewDxName(""); setDot("dx", true);
  };

  const addFU = () => {
    if (!newFu.trim()) return;
    const iconMap = { cardio:"🫀", cardiac:"🫀", pcp:"🩺", primary:"🩺", neuro:"🧠", ortho:"🦴", pulm:"🫁", gi:"🫙", nephro:"🫘" };
    const em = Object.entries(iconMap).find(([k]) => newFu.toLowerCase().includes(k))?.[1] || "📅";
    setFuList(p => [...p, { id:Date.now(), icon:em, specialty:newFu, note:"", urgency:newFuUrg }]);
    setNewFu(""); setDot("fu", true);
  };

  const addDcRx = () => {
    if (!newRxDrug.trim()) return;
    setDcRxList(p => [...p, { id:Date.now(), drug:newRxDrug, sig:newRxSig, type:newRxType }]);
    setNewRxDrug(""); setNewRxSig(""); setDot("rx", true);
  };

  const scrollTo = (id) => {
    document.getElementById(`dcw-sec-${id}`)?.scrollIntoView({ behavior:"smooth", block:"start" });
    setActiveSection(id);
  };

  const toggleOrgan = (key, list, setList) => {
    setList(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);
  };

  const selDispObj = DISPS.find(d => d.id === disp);
  const typeColor = { NEW:"#9b6dff", CONTINUE:"#3b9eff", CHANGED:"#f5c842", STOP:"#ff6b6b" };
  const typeIcon  = { NEW:"🆕", CONTINUE:"🔵", CHANGED:"🔄", STOP:"❌" };

  return (
    <div className="dcw">
      <style>{CSS}</style>

      {/* ICON SIDEBAR */}
      <aside className="dcw-isb">
        <div className="dcw-isb-logo">
          <div className="dcw-isb-logo-box">D/C</div>
        </div>
        <div className="dcw-isb-scroll">
          {ISB_ITEMS.map((item, i) => {
            if (item.type === "sep") return <div key={i} className="dcw-isb-sep"/>;
            if (item.type === "group") return <span key={i} className="dcw-isb-group-label">{item.label}</span>;
            return (
              <div key={i} className={`dcw-isb-btn${item.active ? " active" : ""}`}>
                <span className="dcw-isb-icon">{item.icon}</span>
                <span className="dcw-isb-lbl">{item.label}</span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT COLUMN */}
      <div className="dcw-right">

        {/* NAVBAR */}
        <div className="dcw-navbar">
          <span className="dcw-nav-welcome">Welcome, <strong>{attendingName}</strong></span>
          <div className="dcw-nav-sep"/>
          <div className="dcw-nav-stat"><span className="dcw-nav-stat-val">7</span><span className="dcw-nav-stat-lbl">Active Patients</span></div>
          <div className="dcw-nav-stat"><span className="dcw-nav-stat-val alert">14</span><span className="dcw-nav-stat-lbl">Notes Pending</span></div>
          <div className="dcw-nav-stat"><span className="dcw-nav-stat-val">3</span><span className="dcw-nav-stat-lbl">Orders Queue</span></div>
          <div className="dcw-nav-stat"><span className="dcw-nav-stat-val">11.6</span><span className="dcw-nav-stat-lbl">Shift Hours</span></div>
          <div className="dcw-nav-right">
            <div className="dcw-nav-specialty">Emergency Medicine <span style={{color:"var(--txt4)"}}>▾</span></div>
            <div className="dcw-nav-time">{clock} <span style={{color:"var(--txt4)"}}>▾</span></div>
            <div className="dcw-nav-ai-on"><div className="dcw-nav-ai-dot"/> AI ON</div>
            <button className="dcw-nav-new-pt">+ New Patient</button>
          </div>
        </div>

        {/* SUB-NAVBAR */}
        <div className="dcw-subnav">
          <span className="dcw-subnav-logo">notrya</span>
          <span className="dcw-subnav-sep">|</span>
          <span className="dcw-subnav-title">Discharge Summary</span>
          <span className="dcw-subnav-badge">DC-01</span>
          <div className="dcw-subnav-right">
            <button className="dcw-btn dcw-btn-ghost" onClick={() => window.print()}>🖨 Print</button>
            <button className="dcw-btn dcw-btn-ghost" onClick={() => sendAI("Generate a complete patient-friendly discharge letter.")}>📄 Generate Patient Letter</button>
            <button className="dcw-btn dcw-btn-gold" onClick={() => sendAI("Suggest the optimal E&M level and document the MDM reasoning using 2021 AMA guidelines.")}>🧮 Suggest E&M</button>
            <button className="dcw-btn dcw-btn-primary" onClick={finalizeDischarge} disabled={saving}>
              {saving ? <><span className="dcw-spin"/> Signing…</> : "✍ Finalize & Sign"}
            </button>
          </div>
        </div>

        {/* VITALS BAR */}
        <div className="dcw-vbar">
          <span className="dcw-vbar-name">{patientName}</span>
          <span className="dcw-vbar-meta">62 yo F · DOB {patientDOB} · MRN {patientMRN}</span>
          <div className="dcw-vbar-div"/>
          <div className="dcw-vital"><span className="lbl">CC</span><span className="val" style={{color:"var(--orange)"}}>{patientCC}</span></div>
          <div className="dcw-vbar-div"/>
          <div className="dcw-vital"><span className="lbl">BP</span><span className="val">138/86</span></div>
          <div className="dcw-vital"><span className="lbl">HR</span><span className="val">88</span></div>
          <div className="dcw-vital"><span className="lbl">SpO₂</span><span className="val">97%</span></div>
          <div className="dcw-vital"><span className="lbl">Temp</span><span className="val">98.4°F</span></div>
          <div className="dcw-vbar-div"/>
          <div className="dcw-vital"><span className="lbl">LOS</span><span className="val">4h 32m</span></div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <span className={`dcw-badge ${dcStatus==="SIGNED"?"dcw-badge-teal":"dcw-badge-gold"}`}>{dcStatus}</span>
          </div>
        </div>

        {/* MAIN WRAP */}
        <div className="dcw-main-wrap">

          {/* SIDEBAR */}
          <aside className={`dcw-sb${sbOpen?"":" collapsed"}`}>
            <div className="dcw-sb-collapse-tab" onClick={() => setSbOpen(true)}>
              <span className="dcw-sb-tab-icon">☰</span>
              <span className="dcw-sb-tab-label">Discharge Summary</span>
              <span style={{fontSize:22,fontWeight:700,color:"var(--teal)",lineHeight:1}}>›</span>
            </div>
            <div className="dcw-sb-inner">
              <div className="dcw-sb-card">
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"var(--txt)"}}>{patientName}</div>
                    <div style={{fontSize:11,color:"var(--txt3)",marginTop:3}}>MRN {patientMRN}</div>
                    <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
                      {selDispObj && <span className="dcw-badge dcw-badge-teal" style={{fontSize:9.5}}>{selDispObj.label}</span>}
                      <span className="dcw-badge" style={{fontSize:9.5,background:"rgba(255,159,67,.12)",color:"var(--orange)",border:"1px solid rgba(255,159,67,.3)"}}>{patientCC}</span>
                    </div>
                  </div>
                  <div className="dcw-sb-toggle-btn" onClick={() => setSbOpen(false)}>‹</div>
                </div>
              </div>
              <div className="dcw-sb-label">Sections</div>
              {NAV_SECTIONS.map(s => (
                <div key={s.id} className={`dcw-sb-nav-btn${activeSection===s.id?" active":""}`} onClick={() => scrollTo(s.id)}>
                  <span style={{fontSize:14,width:18,textAlign:"center"}}>{s.icon}</span>
                  {s.label}
                  <span className={`dcw-sb-dot${dots[s.id]?" done":""}`}/>
                </div>
              ))}
              <div className="dcw-sb-divider"/>
              <div className="dcw-sb-label">Visit Summary</div>
              <div className="dcw-sb-card" style={{marginBottom:0}}>
                {[
                  ["Disposition", selDispObj?.label||"—", "var(--teal)"],
                  ["E&M Level",   emCode||"—",            "var(--blue)"],
                  ["Diagnoses",   String(dxList.length),  "var(--txt2)"],
                  ["Follow-Ups",  String(fuList.length),  "var(--gold)"],
                  ["DC Meds",     String(dcRxList.length),"var(--purple)"],
                  ["Status",      dcStatus,               "var(--teal)"],
                ].map(([l,v,c]) => (
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:11,color:"var(--txt3)"}}>{l}</span>
                    <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:c}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <main className="dcw-content">

            {/* DISPOSITION */}
            <div className="dcw-sec" id="dcw-sec-disp">
              <div className="dcw-sec-hdr">
                <span className="dcw-sec-icon">🚪</span>
                <div><div className="dcw-sec-title">Select Disposition</div><div className="dcw-sec-subtitle">Patient's final disposition from the Emergency Department</div></div>
              </div>
              <div className="dcw-disp-label">SELECT DISPOSITION</div>
              <div className="dcw-disp-grid">
                {DISPS.map(d => (
                  <div key={d.id} className={`dcw-disp-card${disp===d.id?" "+d.cls:""}`} onClick={() => { setDisp(d.id); setDot("disp",true); }}>
                    <span className="dcw-disp-emoji">{d.icon}</span>
                    <div className="dcw-disp-name">{d.label}</div>
                    <div className="dcw-disp-sub">{d.sub}</div>
                  </div>
                ))}
              </div>
              {selDispObj && (
                <div className="dcw-disp-banner" style={selDispObj.bannerStyle}>
                  <span style={{fontSize:20}}>{selDispObj.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:12}}>{selDispObj.bannerText}</div>
                    <div style={{fontSize:11,opacity:.8,marginTop:2}}>{selDispObj.bannerSub}</div>
                  </div>
                  <button style={{marginLeft:"auto",background:"none",border:"none",color:"var(--txt4)",cursor:"pointer",fontSize:16}} onClick={() => setDisp(null)}>✕</button>
                </div>
              )}
              {disp && ["floor","telem","icu","obs"].includes(disp) && (
                <div className="dcw-grid-3" style={{marginTop:14}}>
                  <div className="dcw-field"><label className="dcw-field-label">Admitting Service</label><input className="dcw-input" value={admitService} onChange={e=>setAdmitService(e.target.value)} placeholder="e.g. Cardiology, Hospitalist…"/></div>
                  <div className="dcw-field"><label className="dcw-field-label">Admitting Physician</label><input className="dcw-input" value={admitMD} onChange={e=>setAdmitMD(e.target.value)} placeholder="Dr. Name"/></div>
                  <div className="dcw-field"><label className="dcw-field-label">Bed / Unit</label><input className="dcw-input" value={admitBed} onChange={e=>setAdmitBed(e.target.value)} placeholder="e.g. 4W-412, MICU-6"/></div>
                </div>
              )}
              {disp === "tx" && (
                <div className="dcw-grid-2" style={{marginTop:14}}>
                  <div className="dcw-field"><label className="dcw-field-label">Receiving Facility</label><input className="dcw-input" value={txFacility} onChange={e=>setTxFacility(e.target.value)} placeholder="Facility name…"/></div>
                  <div className="dcw-field"><label className="dcw-field-label">Reason for Transfer</label><input className="dcw-input" value={txReason} onChange={e=>setTxReason(e.target.value)} placeholder="Higher level of care…"/></div>
                  <div className="dcw-field"><label className="dcw-field-label">Accepting Physician</label><input className="dcw-input" value={txMD} onChange={e=>setTxMD(e.target.value)} placeholder="Dr. Name"/></div>
                  <div className="dcw-field"><label className="dcw-field-label">Transport Mode</label>
                    <select className="dcw-select" value={txMode} onChange={e=>setTxMode(e.target.value)}>
                      {["ALS Ambulance","BLS Ambulance","Air Transport","Private Vehicle"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* E&M CODING */}
            <div className="dcw-sec" id="dcw-sec-em">
              <div className="dcw-sec-hdr">
                <span className="dcw-sec-icon">🧮</span>
                <div><div className="dcw-sec-title">Evaluation &amp; Management (E&amp;M) Coding</div><div className="dcw-sec-subtitle">Select appropriate level · 2021 AMA guidelines · Medical Decision Making</div></div>
                <button className="dcw-btn dcw-btn-ghost" style={{marginLeft:"auto"}} onClick={() => sendAI("Suggest the most appropriate E&M level and document the MDM reasoning using 2021 AMA E&M guidelines.")}>✨ AI Suggest Level</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:10}}>
                {EM_CARDS.slice(0,5).map(e => (
                  <div key={e.code} className={`dcw-em-card${emCode===e.code?" em-sel":""}`} onClick={() => { setEmCode(e.code); setDot("em",true); setShowCC(e.code==="99291"); }}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:e.levelColor,lineHeight:1}}>{e.level}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--txt3)",marginTop:2}}>{e.code}</div>
                    <div style={{fontSize:11,color:"var(--txt2)",marginTop:6,lineHeight:1.4}}>{e.desc}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--txt4)",marginTop:4}}>{e.time}</div>
                    <span className="dcw-em-badge" style={{background:e.cplxBg,color:e.cplxColor}}>{e.cplx}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {EM_CARDS.slice(5).map(e => (
                  <div key={e.code} className={`dcw-em-card${emCode===e.code?" em-sel":""}`} onClick={() => { setEmCode(e.code); setDot("em",true); setShowCC(e.code==="99291"); }}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:e.levelColor,lineHeight:1}}>{e.level}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--txt3)",marginTop:2}}>{e.code}</div>
                    <div style={{fontSize:11,color:"var(--txt2)",marginTop:6,lineHeight:1.4}}>{e.desc}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--txt4)",marginTop:4}}>{e.time}</div>
                    <span className="dcw-em-badge" style={{background:e.cplxBg,color:e.cplxColor}}>{e.cplx}</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".05em",fontWeight:700,marginBottom:8}}>Medical Decision Making (MDM)</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {lbl:"Number & Complexity of Problems",val:mdmProblems,set:setMdmProblems,opts:["1 self-limited / minor problem","1 stable chronic illness","2+ stable chronic illnesses","1 undiagnosed new problem with uncertain prognosis","1 acute illness with systemic symptoms","1 acute or chronic illness with threat to life or bodily function"]},
                  {lbl:"Amount & Complexity of Data Reviewed",val:mdmData,set:setMdmData,opts:["Minimal / none","Limited — order/review test(s), external notes","Moderate — independent interpretation of results","Extensive — independent interpretation + discussion with specialist"]},
                  {lbl:"Risk of Complications / Morbidity or Mortality",val:mdmRisk,set:setMdmRisk,opts:["Minimal — OTC medications, minor surgery","Low — Rx drug mgmt, procedure with no identified risk","Moderate — Prescription drug mgmt, minor surgery with identified risk","High — Drug therapy requiring intensive monitoring, elective major surgery"]},
                ].map(({lbl,val,set,opts}) => (
                  <div key={lbl} className="dcw-mdm-row">
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:"var(--txt2)",marginBottom:6}}>{lbl}</div>
                      <select className="dcw-select" value={val} onChange={e=>set(e.target.value)}>
                        <option value="">— Select —</option>
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                <div className="dcw-field"><label className="dcw-field-label">MDM Narrative</label><textarea className="dcw-textarea" rows={3} value={mdmNarrative} onChange={e=>setMdmNarrative(e.target.value)} placeholder="Document clinical decision-making rationale…"/></div>
                <div className="dcw-grid-3">
                  <div className="dcw-field"><label className="dcw-field-label">Total Encounter Time</label><input className="dcw-input" value={emTime} onChange={e=>setEmTime(e.target.value)} placeholder="e.g. 45 min"/></div>
                  <div className="dcw-field"><label className="dcw-field-label">Provider Time (face-to-face)</label><input className="dcw-input" value={emFaceTime} onChange={e=>setEmFaceTime(e.target.value)} placeholder="e.g. 30 min"/></div>
                  <div className="dcw-field"><label className="dcw-field-label">Procedure CPT (if any)</label><input className="dcw-input" value={emProcCpt} onChange={e=>setEmProcCpt(e.target.value)} placeholder="e.g. 93010 EKG"/></div>
                </div>
              </div>
            </div>

            {/* CRITICAL CARE NOTE */}
            {showCC && (
              <div className="dcw-sec" id="dcw-sec-cc" style={{animation:"dcw-ccin .35s cubic-bezier(.4,0,.2,1)"}}>
                <style>{`@keyframes dcw-ccin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div className="dcw-cc-accent">
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <span style={{fontSize:22}}>🚨</span>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"var(--txt)"}}>Critical Care Note</div>
                        <span className="dcw-cc-title-badge">CPT 99291</span>
                        <span className="dcw-badge dcw-badge-coral" style={{fontSize:10}}>HIGH COMPLEXITY</span>
                      </div>
                      <div style={{fontSize:12,color:"var(--txt3)"}}>Direct physician care of a critically ill/injured patient — first 30–74 minutes. Document all elements for billing compliance.</div>
                    </div>
                    <button className="dcw-cc-ai-btn" style={{marginLeft:"auto"}} onClick={generateCCNote} disabled={ccAiLoading}>
                      {ccAiLoading ? <><span className="dcw-spin"/> Generating…</> : "✨ AI Generate Note"}
                    </button>
                  </div>
                  <div className="dcw-cc-time-strip">
                    <div><div className="dcw-cc-time-label">CC Start Time</div><input type="time" className="dcw-input" value={ccStart} onChange={e=>setCcStart(e.target.value)} style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:"var(--coral)"}}/><div className="dcw-cc-time-note">Time at bedside</div></div>
                    <div><div className="dcw-cc-time-label">CC End Time</div><input type="time" className="dcw-input" value={ccEnd} onChange={e=>setCcEnd(e.target.value)} style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:"var(--coral)"}}/><div className="dcw-cc-time-note">Time left bedside</div></div>
                    <div><div className="dcw-cc-time-label">Total CC Time</div><div className="dcw-cc-time-val" style={{color:calcCCTime(ccStart,ccEnd)==="—"||parseInt(calcCCTime(ccStart,ccEnd))<30?"var(--gold)":"var(--coral)"}}>{calcCCTime(ccStart,ccEnd)}</div><div className="dcw-cc-time-note">Must be ≥ 30 min for 99291</div></div>
                    <div><div className="dcw-cc-time-label">99292 Add-On Units</div>
                      <div className="dcw-addon-tracker">
                        <button className="dcw-addon-ctrl" onClick={()=>setCcAddon(p=>Math.max(0,p-1))}>−</button>
                        <div className="dcw-addon-cnt">{ccAddon}</div>
                        <button className="dcw-addon-ctrl" onClick={()=>setCcAddon(p=>p+1)}>+</button>
                        <div style={{fontSize:10,color:"var(--txt3)",lineHeight:1.4}}><strong style={{color:"var(--purple)"}}>×30 min</strong><br/>each</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dcw-cc-sec">
                  <div className="dcw-cc-sec-lbl"><span>⚕️</span>Critical Condition — Nature &amp; Severity</div>
                  <div className="dcw-sev-row">
                    {[["active-imm","Immediately Life-Threatening","Imminent risk of death"],["active-life","Life-Threatening Condition","High probability of deterioration"],["active-org","Threat to Organ Function","Risk of significant organ dysfunction"]].map(([cls,lbl,sub])=>(
                      <div key={cls} className={`dcw-sev-btn${ccSeverity===cls?" "+cls:""}`} onClick={()=>setCcSeverity(p=>p===cls?"":cls)}>
                        <div className="dcw-sev-btn-lbl">{lbl}</div>
                        <div className="dcw-sev-btn-sub">{sub}</div>
                      </div>
                    ))}
                  </div>
                  <textarea className="dcw-textarea" value={ccCondition} onChange={e=>setCcCondition(e.target.value)} style={{minHeight:72}} placeholder="Describe the critical condition and clinical findings supporting critical illness…"/>
                </div>

                <div className="dcw-cc-sec">
                  <div className="dcw-cc-sec-lbl"><span>🫀</span>Organ Systems Involved</div>
                  <div className="dcw-organ-grid">
                    {ORGAN_LIST.map(o=>(
                      <div key={o.key} className={`dcw-organ-chip${ccOrgans.includes(o.key)?" active":""}`} onClick={()=>toggleOrgan(o.key,ccOrgans,setCcOrgans)}>
                        <div className="dcw-organ-chk">{ccOrgans.includes(o.key)?"✓":""}</div>
                        <span className="dcw-organ-lbl">{o.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dcw-cc-sec">
                  <div className="dcw-cc-sec-lbl"><span>📊</span>Vitals at Time of Critical Care</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
                    {[["BP",ccBp,setCcBp,"82/50"],["HR",ccHr,setCcHr,"128"],["RR",ccRr,setCcRr,"28"],["SpO₂",ccSpo2,setCcSpo2,"86%"],["Temp",ccTemp,setCcTemp,"103.4°F"],["GCS",ccGcs,setCcGcs,"8"],["MAP",ccMap,setCcMap,"54"]].map(([lbl,val,set,ph])=>(
                      <div key={lbl} className="dcw-field"><label className="dcw-field-label">{lbl}</label><input className="dcw-input" style={{fontFamily:"monospace"}} value={val} onChange={e=>set(e.target.value)} placeholder={ph}/></div>
                    ))}
                  </div>
                </div>

                <div className="dcw-cc-sec">
                  <div className="dcw-cc-sec-lbl"><span>⚙️</span>Interventions During Critical Care Time</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:10}}>
                    {INTERV_LIST.map(iv=>(
                      <div key={iv.key} className={`dcw-organ-chip${ccInterventions.includes(iv.key)?" active":""}`} onClick={()=>toggleOrgan(iv.key,ccInterventions,setCcInterventions)}>
                        <div className="dcw-organ-chk">{ccInterventions.includes(iv.key)?"✓":""}</div>
                        <span className="dcw-organ-lbl" style={{fontSize:11}}>{iv.label}</span>
                      </div>
                    ))}
                  </div>
                  <textarea className="dcw-textarea" value={ccIntervText} onChange={e=>setCcIntervText(e.target.value)} style={{minHeight:64}} placeholder="Describe additional interventions and patient response during critical care period…"/>
                </div>

                <div className="dcw-grid-2" style={{marginBottom:12}}>
                  {[["🔬 Diagnostic Results Reviewed",ccLabs,setCcLabs,"Labs, imaging, ECG findings reviewed…"],["📈 Response to Treatment",ccResponse,setCcResponse,"Patient response to interventions…"],["💬 Communication & Consultations",ccConsults,setCcConsults,"Specialist consultations, family discussions…"],["🏥 Disposition Decision",ccDispo,setCcDispo,"Disposition plan discussed during CC care…"]].map(([lbl,val,set,ph])=>(
                    <div key={lbl} className="dcw-field"><label className="dcw-field-label" style={{marginBottom:6}}>{lbl}</label><textarea className="dcw-textarea" value={val} onChange={e=>set(e.target.value)} style={{minHeight:70}} placeholder={ph}/></div>
                  ))}
                </div>

                <div className="dcw-cc-sec">
                  <div className="dcw-cc-sec-lbl"><span>📋</span>Clinical Impression &amp; Assessment</div>
                  <textarea className="dcw-textarea" value={ccImpression} onChange={e=>setCcImpression(e.target.value)} style={{minHeight:90}} placeholder="Critical care clinical impression, working diagnosis, acuity justification, management plan…"/>
                </div>

                <div className="dcw-attest">
                  <strong>Physician Attestation:</strong> I personally provided direct, face-to-face critical care to this patient for the time documented above. The patient's condition was of high complexity requiring constant physician attendance due to the critical nature of the illness or injury.
                  <div style={{marginTop:8,display:"flex",gap:12,alignItems:"center"}}>
                    <div className="dcw-field" style={{flex:1}}><label className="dcw-field-label">Physician Signature</label><input className="dcw-input" value={ccSig} onChange={e=>setCcSig(e.target.value)} placeholder="Dr. Name, MD"/></div>
                    <div className="dcw-field" style={{width:180}}><label className="dcw-field-label">Date / Time</label><input className="dcw-input" style={{fontFamily:"monospace"}} value={ccSigDt} onChange={e=>setCcSigDt(e.target.value)} placeholder="MM/DD/YYYY HH:MM"/></div>
                  </div>
                </div>
              </div>
            )}

            {/* DIAGNOSES */}
            <div className="dcw-sec" id="dcw-sec-dx">
              <div className="dcw-sec-hdr">
                <span className="dcw-sec-icon">📋</span>
                <div><div className="dcw-sec-title">Discharge Diagnoses</div><div className="dcw-sec-subtitle">Primary and secondary diagnoses with ICD-10 codes</div></div>
                <button className="dcw-btn dcw-btn-ghost" style={{marginLeft:"auto"}} onClick={()=>sendAI("Suggest appropriate ICD-10 codes for the discharge diagnoses.")}>✨ AI Code</button>
              </div>
              {dxList.map((dx,i) => (
                <div key={dx.id} className="dcw-row">
                  <span style={{fontSize:11,fontWeight:700,color:dx.primary?"var(--teal)":"var(--txt3)",minWidth:26,fontFamily:"'JetBrains Mono',monospace"}}>{dx.primary?"1°":`${i+1}°`}</span>
                  <input className="dcw-row-inp" style={{maxWidth:80,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--blue)"}} value={dx.code} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,code:e.target.value}:d))} placeholder="ICD-10"/>
                  <input className="dcw-row-inp" style={{flex:1}} value={dx.name} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,name:e.target.value}:d))} placeholder="Diagnosis name…"/>
                  <span style={{fontSize:9,padding:"2px 8px",borderRadius:3,background:dx.primary?"rgba(255,107,107,.15)":"rgba(0,229,192,.12)",color:dx.primary?"var(--coral)":"var(--teal)",fontWeight:700}}>{dx.primary?"PRIMARY":"SECONDARY"}</span>
                  {!dx.primary && <button className="dcw-row-del" onClick={()=>setDxList(p=>p.filter(d=>d.id!==dx.id))}>×</button>}
                </div>
              ))}
              <div className="dcw-add-row">
                <input className="dcw-add-inp" style={{maxWidth:90,fontFamily:"'JetBrains Mono',monospace",fontSize:12}} value={newDxCode} onChange={e=>setNewDxCode(e.target.value)} placeholder="ICD-10"/>
                <input className="dcw-add-inp" style={{flex:1}} value={newDxName} onChange={e=>setNewDxName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDx()} placeholder="+ Add diagnosis…"/>
                <button className="dcw-btn dcw-btn-ghost" onClick={addDx}>Add</button>
              </div>
            </div>

            {/* DC INSTRUCTIONS */}
            <div className="dcw-sec" id="dcw-sec-instr">
              <div className="dcw-sec-hdr">
                <span className="dcw-sec-icon">📄</span>
                <div><div className="dcw-sec-title">Discharge Instructions</div><div className="dcw-sec-subtitle">Patient-facing care guide — AI generated from chart information</div></div>
                <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                  {instrGenerated && <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:9,color:"var(--teal)",background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.25)",borderRadius:3,padding:"1px 6px",fontWeight:700}}>✨ AI Generated</span>}
                  <button className="dcw-btn dcw-btn-gold" onClick={generateInstructions} disabled={generatingInstr}>
                    {generatingInstr?<><span className="dcw-spin"/> Generating…</>:"✨ Generate from Chart"}
                  </button>
                </div>
              </div>
              {!instrGenerated ? (
                <div style={{background:"rgba(22,45,79,.3)",border:"1px dashed var(--border)",borderRadius:8,textAlign:"center",padding:"28px 20px",color:"var(--txt3)",fontSize:12}}>
                  Click <strong style={{color:"var(--gold)"}}>✨ Generate from Chart</strong> to have AI create personalized discharge instructions.
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[{icon:"🩺",title:"Your Diagnosis",val:instrDiag,set:setInstrDiag},{icon:"💊",title:"Treatment Received in the ED",val:instrTreat,set:setInstrTreat},{icon:"💊",title:"Medications",val:instrMeds,set:setInstrMeds},{icon:"🏃",title:"Activity & Diet",val:instrAct,set:setInstrAct},{icon:"📝",title:"Additional Instructions",val:instrMisc,set:setInstrMisc}].map(({icon,title,val,set})=>(
                    <div key={title} className="dcw-instr-box">
                      <div className="dcw-instr-hdr">
                        <span style={{fontSize:15}}>{icon}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"var(--txt)",textTransform:"uppercase",letterSpacing:".04em"}}>{title}</span>
                      </div>
                      <textarea className="dcw-textarea" style={{minHeight:60,fontSize:12.5}} value={val} onChange={e=>set(e.target.value)} placeholder="Enter patient instructions…"/>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RETURN PRECAUTIONS */}
            <div className="dcw-sec" id="dcw-sec-return">
              <div className="dcw-sec-hdr">
                <span className="dcw-sec-icon">🚨</span>
                <div><div className="dcw-sec-title">Return to the Emergency Department</div><div className="dcw-sec-subtitle">Instruct patient to return immediately for any of the following</div></div>
                <button className="dcw-btn dcw-btn-ghost" style={{marginLeft:"auto"}} onClick={()=>sendAI("List the most important return-to-ED precautions for this patient. Use patient-friendly language.")}>✨ AI Precautions</button>
              </div>
              {RETURN_ITEMS.map((item,i)=>(
                <div key={i} className="dcw-return-card">
                  <span style={{fontSize:17,flexShrink:0,marginTop:2}}>{item.icon}</span>
                  <div style={{fontSize:12,color:"var(--txt2)",lineHeight:1.5}}><strong style={{color:"var(--coral)"}}>{item.strong}</strong>{item.rest}</div>
                </div>
              ))}
              <div className="dcw-field" style={{marginTop:12}}>
                <label className="dcw-field-label">Additional Return Precautions (custom)</label>
                <textarea className="dcw-textarea" style={{minHeight:60,borderColor:"rgba(255,107,107,.25)"}} value={returnCustom} onChange={e=>setReturnCustom(e.target.value)} placeholder="Add any diagnosis-specific return precautions…"/>
              </div>
              <div style={{marginTop:12,display:"flex",alignItems:"center",gap:10,background:"rgba(255,107,107,.06)",border:"1px solid rgba(255,107,107,.2)",borderRadius:8,padding:"11px 14px"}}>
                <span style={{fontSize:20}}>📞</span>
                <div><div style={{fontSize:12,fontWeight:700,color:"var(--coral)"}}>Emergency Instructions</div><div style={{fontSize:11,color:"var(--txt2)",marginTop:2}}>If experiencing a medical emergency, call <strong style={{color:"var(--txt)"}}>911</strong> immediately or go to your nearest emergency room. Do not drive yourself.</div></div>
              </div>
            </div>

            {/* FOLLOW-UP */}
            <div className="dcw-sec" id="dcw-sec-fu">
              <div className="dcw-sec-hdr">
                <span className="dcw-sec-icon">📅</span>
                <div><div className="dcw-sec-title">Follow-Up Appointments</div><div className="dcw-sec-subtitle">Specialist referrals · Primary care · Recommended timeframe</div></div>
                <button className="dcw-btn dcw-btn-ghost" style={{marginLeft:"auto"}} onClick={()=>sendAI("What follow-up appointments should be scheduled? Include timeframe and urgency.")}>✨ AI Suggest</button>
              </div>
              {fuList.map(f=>(
                <div key={f.id} className="dcw-row">
                  <span style={{fontSize:18}}>{f.icon}</span>
                  <div style={{display:"flex",flexDirection:"column",flex:1,gap:3}}>
                    <div style={{fontSize:12,fontWeight:600,color:"var(--txt)"}}>{f.specialty}</div>
                    <input className="dcw-row-inp" style={{fontSize:11}} value={f.note} onChange={e=>setFuList(p=>p.map(x=>x.id===f.id?{...x,note:e.target.value}:x))} placeholder="Timeframe / instructions…"/>
                  </div>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:3,background:f.urgency==="Urgent"?"rgba(255,107,107,.15)":"rgba(0,229,192,.12)",color:f.urgency==="Urgent"?"var(--coral)":"var(--teal)",fontWeight:700}}>{f.urgency.toUpperCase()}</span>
                  <button className="dcw-row-del" onClick={()=>setFuList(p=>p.filter(x=>x.id!==f.id))}>×</button>
                </div>
              ))}
              <div className="dcw-add-row">
                <input className="dcw-add-inp" style={{flex:1}} value={newFu} onChange={e=>setNewFu(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFU()} placeholder="+ Add follow-up specialty or provider…"/>
                <select className="dcw-select" style={{width:"auto",paddingRight:24}} value={newFuUrg} onChange={e=>setNewFuUrg(e.target.value)}><option>Urgent</option><option>Routine</option></select>
                <button className="dcw-btn dcw-btn-ghost" onClick={addFU}>Add</button>
              </div>
            </div>

            {/* DISCHARGE MEDS */}
            <div className="dcw-sec" id="dcw-sec-rx">
              <div className="dcw-sec-hdr">
                <span className="dcw-sec-icon">💊</span>
                <div><div className="dcw-sec-title">Discharge Medications</div><div className="dcw-sec-subtitle">New prescriptions and changes to home medications</div></div>
                <span className="dcw-badge dcw-badge-purple" style={{marginLeft:"auto"}}>{dcRxList.length} Rx</span>
              </div>
              {dcRxList.map(rx=>(
                <div key={rx.id} className="dcw-row" style={{borderColor:`${typeColor[rx.type]||"var(--border)"}33`}}>
                  <span style={{fontSize:15}}>{typeIcon[rx.type]||"🔵"}</span>
                  <div style={{display:"flex",flexDirection:"column",flex:1,gap:2}}>
                    <input className="dcw-row-inp" style={{fontWeight:600,color:"var(--txt)"}} value={rx.drug} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,drug:e.target.value}:x))} placeholder="Drug name + dose"/>
                    <input className="dcw-row-inp" style={{fontSize:11}} value={rx.sig} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,sig:e.target.value}:x))} placeholder="SIG / instructions…"/>
                  </div>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:`${typeColor[rx.type]||"var(--blue)"}22`,color:typeColor[rx.type]||"var(--blue)",fontWeight:700,whiteSpace:"nowrap"}}>{rx.type}</span>
                  <button className="dcw-row-del" onClick={()=>setDcRxList(p=>p.filter(x=>x.id!==rx.id))}>×</button>
                </div>
              ))}
              <div className="dcw-add-row">
                <input className="dcw-add-inp" style={{flex:"1.5"}} value={newRxDrug} onChange={e=>setNewRxDrug(e.target.value)} placeholder="Drug name + dose…"/>
                <input className="dcw-add-inp" style={{flex:1}} value={newRxSig} onChange={e=>setNewRxSig(e.target.value)} placeholder="SIG / instructions…"/>
                <select className="dcw-select" style={{width:"auto",paddingRight:24}} value={newRxType} onChange={e=>setNewRxType(e.target.value)}>
                  {["NEW","CONTINUE","CHANGED","STOP"].map(o=><option key={o}>{o}</option>)}
                </select>
                <button className="dcw-btn dcw-btn-ghost" onClick={addDcRx}>Add</button>
              </div>
            </div>

            {/* SIGN & FINALIZE */}
            <div className="dcw-sig" id="dcw-sec-sig">
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"var(--txt)"}}>{attendingName}</div>
                  <div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>Specialty · Emergency Medicine</div>
                </div>
                <div style={{marginLeft:"auto",display:"flex",gap:10}}>
                  <div className="dcw-field" style={{minWidth:180}}><label className="dcw-field-label">Date of Service</label><input className="dcw-input" value={sigDate} onChange={e=>setSigDate(e.target.value)}/></div>
                  <div className="dcw-field" style={{minWidth:140}}><label className="dcw-field-label">Time of Discharge</label><input className="dcw-input" value={sigTime} onChange={e=>setSigTime(e.target.value)}/></div>
                </div>
              </div>
              <div className="dcw-sig-line"/>
              <div className="dcw-grid-3" style={{marginBottom:14}}>
                <div className="dcw-field"><label className="dcw-field-label">Patient / Guardian Signature</label><input className="dcw-input" value={sigPt} onChange={e=>setSigPt(e.target.value)} placeholder="Name of signatory"/></div>
                <div className="dcw-field"><label className="dcw-field-label">Relationship (if guardian)</label><input className="dcw-input" value={sigRel} onChange={e=>setSigRel(e.target.value)} placeholder="Self / Parent / POA…"/></div>
                <div className="dcw-field"><label className="dcw-field-label">Nurse Witnessing Discharge</label><input className="dcw-input" value={sigRN} onChange={e=>setSigRN(e.target.value)} placeholder="RN Name"/></div>
              </div>
              <div className="dcw-field" style={{marginBottom:14}}>
                <label className="dcw-field-label">Attestation / Provider Notes</label>
                <textarea className="dcw-textarea" style={{minHeight:60}} value={sigNote} onChange={e=>setSigNote(e.target.value)} placeholder="I have reviewed the discharge instructions with the patient/guardian and they verbalized understanding…"/>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button className="dcw-btn dcw-btn-ghost" onClick={()=>window.print()}>🖨 Print Discharge Papers</button>
                <button className="dcw-btn dcw-btn-ghost" onClick={()=>sendAI("Write a complete discharge summary note for this visit in SOAP format suitable for the medical record.")}>📄 Generate DC Note</button>
                <button className="dcw-btn dcw-btn-primary" style={{padding:"8px 20px",fontSize:13}} onClick={finalizeDischarge} disabled={saving}>
                  {saving?<><span className="dcw-spin"/> Signing…</>:"✍ Sign & Finalize Discharge"}
                </button>
              </div>
            </div>

          </main>

          {/* AI PANEL */}
          <aside className={`dcw-ai-panel${aiOpen?"":" collapsed"}`}>
            <div className="dcw-ai-collapse-tab" onClick={()=>setAiOpen(true)}>
              <div className="dcw-ai-tab-dot"/>
              <span className="dcw-ai-tab-label">Notrya AI Advisor</span>
              <span style={{fontSize:22,fontWeight:700,color:"var(--teal)",lineHeight:1}}>›</span>
            </div>
            <div className="dcw-ai-panel-inner">
              <div className="dcw-ai-header">
                <div className="dcw-ai-header-top">
                  <div className="dcw-ai-dot"/>
                  <span className="dcw-ai-label">Notrya AI — Discharge Advisor</span>
                  <span className="dcw-ai-model">claude-sonnet-4</span>
                  <div className="dcw-ai-toggle-btn" onClick={()=>setAiOpen(false)}>‹</div>
                </div>
                <div className="dcw-ai-qbtns">
                  {[
                    ["📄 Generate DC Instructions", ()=>generateInstructions()],
                    ["🧮 E&M Level", ()=>sendAI("Suggest the optimal E&M level using 2021 AMA guidelines.")],
                    ["🚨 Return Precautions", ()=>sendAI("Generate return-to-ED precautions tailored to this patient.")],
                    ["📅 Follow-Up Plan", ()=>sendAI("What follow-up appointments should be arranged?")],
                    ["🏷 ICD-10 Codes", ()=>sendAI("Suggest ICD-10 codes for the discharge diagnoses.")],
                    ["📝 DC Summary Note", ()=>sendAI("Write a complete discharge summary note in SOAP format.")],
                    ["💌 Patient Letter", ()=>sendAI("Generate a patient-friendly discharge letter.")],
                    ["✅ Review Completeness", ()=>sendAI("Review the completeness of this discharge summary.")],
                  ].map(([label,fn])=>(
                    <button key={label} className="dcw-ai-qbtn" onClick={fn}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="dcw-ai-msgs" ref={aiMsgsRef}>
                {aiMsgs.map((m,i)=>(
                  <div key={i} className={`dcw-ai-msg ${m.role}`} dangerouslySetInnerHTML={{__html:m.text.replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}}/>
                ))}
                {aiLoading && <div className="dcw-ai-loader"><span/><span/><span/></div>}
              </div>
              <div className="dcw-ai-input-wrap">
                <textarea className="dcw-ai-input" rows={2} value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAI();}}} placeholder="Ask about discharge planning…"/>
                <button className="dcw-ai-send" onClick={()=>sendAI()}>↑</button>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}