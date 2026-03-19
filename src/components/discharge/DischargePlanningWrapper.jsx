import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
.dc-root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;font-family:'DM Sans',sans-serif;font-size:14px;background:var(--bg);color:var(--txt);display:flex;flex-direction:column;height:100%;overflow:hidden}
.dc-root *{box-sizing:border-box}

/* ICON SIDEBAR */
.dc-isb{width:65px;flex-shrink:0;background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;overflow-y:auto;overflow-x:hidden}
.dc-isb::-webkit-scrollbar{display:none}
.dc-isb-logo{width:100%;height:50px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border)}
.dc-isb-logo-box{width:34px;height:34px;background:var(--blue);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:11px;font-weight:700;color:white;cursor:pointer;letter-spacing:-.5px}
.dc-isb-scroll{width:100%;flex:1;display:flex;flex-direction:column;align-items:center;padding:6px 0 10px;gap:1px}
.dc-isb-glbl{font-size:8px;color:var(--txt4);text-transform:uppercase;letter-spacing:.08em;text-align:center;padding:6px 4px 2px;width:100%}
.dc-isb-btn{width:48px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:var(--r);cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent}
.dc-isb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
.dc-isb-btn.active{background:rgba(0,229,192,.1);border-color:rgba(0,229,192,.3);color:var(--teal)}
.dc-isb-icon{font-size:16px;line-height:1}.dc-isb-lbl{font-size:8.5px;line-height:1;white-space:nowrap}
.dc-isb-sep{width:36px;height:1px;background:var(--border);margin:4px 0;flex-shrink:0}
.dc-isb-new{background:rgba(59,158,255,.2);border:1px solid rgba(59,158,255,.4);border-radius:4px;padding:1px 3px;font-size:9px;color:var(--blue);font-weight:700}

/* RIGHT COLUMN */
.dc-right{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

/* NAVBAR */
.dc-nav{height:50px;background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.dc-nav-welcome{font-size:13px;color:var(--txt2);font-weight:500;white-space:nowrap}
.dc-nav-welcome strong{color:var(--txt);font-weight:600}
.dc-nav-sep{width:1px;height:22px;background:var(--border);flex-shrink:0}
.dc-nav-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 12px;min-width:70px;cursor:pointer}
.dc-nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--txt);line-height:1.2}
.dc-nav-stat-val.alert{color:var(--gold)}
.dc-nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}
.dc-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.dc-nav-specialty{display:flex;align-items:center;gap:5px;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer}
.dc-nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--txt2);display:flex;align-items:center;gap:5px}
.dc-nav-ai{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:600;color:var(--teal)}
.dc-nav-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:dc-pulse 2s ease-in-out infinite}
@keyframes dc-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
.dc-nav-newpt{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}

/* SUB-NAVBAR */
.dc-subnav{height:42px;background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.dc-subnav-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-.5px}
.dc-subnav-sep{color:var(--txt4);font-size:14px}
.dc-subnav-title{font-size:13px;color:var(--txt2);font-weight:500}
.dc-subnav-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace}
.dc-subnav-right{margin-left:auto;display:flex;align-items:center;gap:8px}

/* BUTTONS */
.dc-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:var(--r);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;border:none}
.dc-btn-ghost{background:var(--bg-up);border:1px solid var(--border)!important;color:var(--txt2)}
.dc-btn-ghost:hover{border-color:var(--border-hi)!important;color:var(--txt)}
.dc-btn-primary{background:var(--teal);color:var(--bg)}
.dc-btn-primary:hover{filter:brightness(1.15)}
.dc-btn-gold{background:rgba(245,200,66,.13);border:1px solid rgba(245,200,66,.35)!important;color:var(--gold)}
.dc-btn-gold:hover{background:rgba(245,200,66,.22)}

/* VITALS BAR */
.dc-vbar{height:40px;background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;overflow:hidden}
.dc-vbar-name{font-family:'Playfair Display',serif;font-size:14px;color:var(--txt);font-weight:600;white-space:nowrap}
.dc-vbar-meta{font-size:11px;color:var(--txt3);white-space:nowrap}
.dc-vbar-div{width:1px;height:20px;background:var(--border);flex-shrink:0}
.dc-vbar-vital{display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap}
.dc-vbar-vital .lbl{color:var(--txt4);font-size:9px;text-transform:uppercase;letter-spacing:.04em}
.dc-vbar-vital .val{font-family:'JetBrains Mono',monospace;color:var(--txt2);font-weight:600}

/* MAIN */
.dc-main{display:flex;flex:1;overflow:hidden}

/* SIDEBAR */
.dc-sb{flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dc-sb.open{width:230px}
.dc-sb.collapsed{width:36px}
.dc-sb-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dc-sb.collapsed .dc-sb-tab{display:flex}
.dc-sb.collapsed .dc-sb-inner{display:none}
.dc-sb-tab-lbl{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none;transition:color .15s}
.dc-sb-tab:hover .dc-sb-tab-lbl{color:var(--teal)}
.dc-sb-inner{overflow-y:auto;flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:5px;min-width:0}
.dc-sb-inner::-webkit-scrollbar{width:3px}
.dc-sb-inner::-webkit-scrollbar-thumb{background:var(--border)}
.dc-sb-toggle{width:28px;height:28px;border-radius:7px;margin-left:auto;flex-shrink:0;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:18px;font-weight:700;color:var(--txt2);line-height:1}
.dc-sb-toggle:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dc-sb-lbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:4px}
.dc-sb-nav{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2)}
.dc-sb-nav:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt)}
.dc-sb-nav.active{background:rgba(0,229,192,.09);border-color:rgba(0,229,192,.3);color:var(--teal)}
.dc-sb-nav .icon{font-size:14px;width:18px;text-align:center}
.dc-sb-dot{width:7px;height:7px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0}
.dc-sb-dot.done{background:var(--teal);box-shadow:0 0 6px rgba(0,229,192,.5)}
.dc-sb-divider{height:1px;background:var(--border);margin:6px 0}
.dc-sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:11px 12px;margin-bottom:4px}

/* CONTENT */
.dc-content{flex:1;overflow-y:auto;padding:16px 20px 50px;display:flex;flex-direction:column;gap:16px}
.dc-content::-webkit-scrollbar{width:4px}
.dc-content::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* AI PANEL */
.dc-ai{flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dc-ai.open{width:295px}
.dc-ai.collapsed{width:36px}
.dc-ai-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dc-ai.collapsed .dc-ai-tab{display:flex}
.dc-ai.collapsed .dc-ai-inner{display:none}
.dc-ai-tab-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);animation:dc-pulse 2s ease-in-out infinite;flex-shrink:0}
.dc-ai-tab-lbl{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none;transition:color .15s}
.dc-ai-tab:hover .dc-ai-tab-lbl{color:var(--teal)}
.dc-ai-inner{display:flex;flex-direction:column;flex:1;overflow:hidden;min-width:0}
.dc-ai-hdr{padding:11px 13px;border-bottom:1px solid var(--border);flex-shrink:0}
.dc-ai-hrow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.dc-ai-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);flex-shrink:0;animation:dc-pulse 2s ease-in-out infinite}
.dc-ai-lbl{font-size:12px;font-weight:600;color:var(--txt2);flex:1}
.dc-ai-model{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3)}
.dc-ai-toggle{width:28px;height:28px;border-radius:7px;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:18px;font-weight:700;color:var(--txt2);line-height:1}
.dc-ai-toggle:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dc-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.dc-ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;transition:all .15s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);font-family:'DM Sans',sans-serif}
.dc-ai-qbtn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.06)}
.dc-ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.dc-ai-msgs::-webkit-scrollbar{width:3px}
.dc-ai-msgs::-webkit-scrollbar-thumb{background:var(--border)}
.dc-ai-msg{padding:9px 11px;border-radius:var(--r);font-size:12px;line-height:1.55}
.dc-ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border)}
.dc-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2)}
.dc-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt)}
.dc-ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
.dc-ai-loader span{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:dc-bounce 1.2s ease-in-out infinite}
.dc-ai-loader span:nth-child(2){animation-delay:.2s}.dc-ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes dc-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.dc-ai-inp-wrap{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:6px}
.dc-ai-inp{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
.dc-ai-inp:focus{border-color:var(--teal)}
.dc-ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;font-weight:700}

/* SECTIONS */
.dc-sec{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.dc-sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.dc-sec-icon{font-size:18px}
.dc-sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--txt)}
.dc-sec-sub{font-size:11px;color:var(--txt3);margin-top:1px}

/* FIELDS */
.dc-field{display:flex;flex-direction:column;gap:4px}
.dc-flbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em}
.dc-inp{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%}
.dc-inp:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.07)}
.dc-ta{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:9px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:80px;width:100%;line-height:1.6;transition:border-color .15s}
.dc-ta:focus{border-color:var(--blue)}
.dc-sel{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%}
.dc-sel:focus{border-color:var(--blue)}
.dc-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dc-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}

/* DISPOSITION */
.dc-disp-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
.dc-disp-card{background:var(--bg-card);border:2px solid var(--border);border-radius:14px;padding:14px 8px 12px;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;user-select:none}
.dc-disp-card:hover{border-color:var(--border-hi);background:var(--bg-up);transform:translateY(-1px)}
.dc-disp-card.sel-home{border-color:var(--teal)!important;background:rgba(0,229,192,.07)!important;box-shadow:0 0 0 1px rgba(0,229,192,.25),0 6px 24px rgba(0,229,192,.18);transform:translateY(-2px)}
.dc-disp-card.sel-floor{border-color:var(--blue)!important;background:rgba(59,158,255,.07)!important;box-shadow:0 0 0 1px rgba(59,158,255,.25),0 6px 24px rgba(59,158,255,.15);transform:translateY(-2px)}
.dc-disp-card.sel-telem{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-icu{border-color:var(--coral)!important;background:rgba(255,107,107,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-obs{border-color:var(--purple)!important;background:rgba(155,109,255,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-tx{border-color:var(--orange)!important;background:rgba(255,159,67,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-ama{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-expired{border-color:var(--txt4)!important;background:rgba(46,74,106,.15)!important;transform:translateY(-2px)}
.dc-disp-emoji{font-size:28px;line-height:1}
.dc-disp-name{font-size:12px;font-weight:700;color:var(--txt);line-height:1.2;transition:color .18s}
.dc-disp-sub{font-size:10px;color:var(--txt3);line-height:1.3}
.dc-banner{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:var(--r);margin-top:12px;border:1px solid;font-size:12px;font-weight:600}

/* E&M CARDS */
.dc-em-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:13px 15px;transition:all .15s;cursor:pointer;position:relative;overflow:hidden}
.dc-em-card:hover{border-color:var(--border-hi)}
.dc-em-card.sel{border-color:var(--blue);background:rgba(59,158,255,.07)}
.dc-em-card.sel::after{content:'✓';position:absolute;top:8px;right:10px;color:var(--blue);font-size:14px;font-weight:700}
.dc-em-lvl{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--txt);line-height:1}
.dc-em-code{font-size:11px;color:var(--txt3);font-family:'JetBrains Mono',monospace;margin-top:2px}
.dc-em-desc{font-size:11px;color:var(--txt2);margin-top:6px;line-height:1.4}
.dc-em-time{font-size:10px;color:var(--txt4);margin-top:4px;font-family:'JetBrains Mono',monospace}
.dc-em-badge{font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;margin-top:5px;display:inline-block}
.dc-c-low{background:rgba(0,229,192,.12);color:var(--teal)}
.dc-c-mod{background:rgba(245,200,66,.12);color:var(--gold)}
.dc-c-high{background:rgba(255,107,107,.12);color:var(--coral)}
.dc-c-crit{background:rgba(155,109,255,.12);color:var(--purple)}
.dc-mdm-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-up);border-radius:var(--r);margin-bottom:6px}

/* ROWS */
.dc-row{display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:10px 13px;margin-bottom:6px;transition:border-color .15s}
.dc-row:hover{border-color:var(--border-hi)}
.dc-row-inp{background:transparent;border:none;outline:none;font-size:12px;color:var(--txt2);font-family:'DM Sans',sans-serif;flex:1;min-width:0}
.dc-row-del{color:var(--txt4);cursor:pointer;font-size:15px;transition:color .15s;background:none;border:none;padding:0 2px}
.dc-row-del:hover{color:var(--coral)}
.dc-chip{font-size:10px;padding:2px 8px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-weight:600}
.dc-chip-urg{background:rgba(255,107,107,.15);color:var(--coral)}
.dc-chip-rtn{background:rgba(0,229,192,.12);color:var(--teal)}
.dc-add-row{display:flex;gap:6px;align-items:center;margin-top:8px}
.dc-add-inp{flex:1;background:var(--bg-up);border:1px dashed var(--border);border-radius:var(--r);padding:7px 11px;color:var(--txt);font-size:12px;outline:none;font-family:'DM Sans',sans-serif}
.dc-add-inp:focus{border-style:solid;border-color:var(--blue)}
.dc-add-inp::placeholder{color:var(--txt4)}

/* RETURN CARDS */
.dc-ret-card{background:rgba(255,107,107,.05);border:1px solid rgba(255,107,107,.22);border-radius:var(--r);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;transition:all .15s}
.dc-ret-card:hover{background:rgba(255,107,107,.09);border-color:rgba(255,107,107,.35)}

/* SIGNATURE */
.dc-sig{background:linear-gradient(135deg,rgba(0,229,192,.06),rgba(59,158,255,.04));border:1px solid rgba(0,229,192,.2);border-radius:var(--rl);padding:18px 20px}
.dc-sig-line{height:1px;background:rgba(0,229,192,.2);margin:12px 0}

/* INSTRUCTIONS */
.dc-instr-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;margin-bottom:10px}
.dc-instr-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid var(--border)}

/* BADGES */
.dc-bdg{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;display:inline-block}
.dc-bdg-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.dc-bdg-gold{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}
.dc-bdg-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3)}
.dc-bdg-purple{background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3)}

/* SPIN */
.dc-spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(0,229,192,.2);border-top-color:var(--teal);border-radius:50%;animation:dc-spinr .6s linear infinite}
@keyframes dc-spinr{to{transform:rotate(360deg)}}

/* CRITICAL CARE */
.dc-cc-accent{background:linear-gradient(135deg,rgba(255,107,107,.1),rgba(155,109,255,.06));border:1px solid rgba(255,107,107,.28);border-radius:var(--rl);padding:16px 20px;margin-bottom:12px}
.dc-cc-lbl{font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.dc-organ-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.dc-organ-chip{display:flex;align-items:center;gap:7px;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;cursor:pointer;transition:all .15s;user-select:none}
.dc-organ-chip:hover{border-color:var(--border-hi)}
.dc-organ-chip.active{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.4)}
.dc-organ-chip.active .dc-organ-chk{background:var(--coral);border-color:var(--coral)}
.dc-organ-chk{width:15px;height:15px;border-radius:3px;border:1.5px solid var(--border);background:var(--bg-card);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:var(--bg);transition:all .15s}
.dc-organ-lbl{font-size:12px;color:var(--txt2);font-weight:500}
.dc-organ-chip.active .dc-organ-lbl{color:var(--coral);font-weight:600}
.dc-sev-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.dc-sev-btn{flex:1;min-width:110px;padding:10px 8px;border-radius:var(--r);border:1.5px solid var(--border);background:var(--bg-up);text-align:center;cursor:pointer;transition:all .15s;user-select:none}
.dc-sev-btn.active-imm{border-color:var(--coral);background:rgba(255,107,107,.12)}
.dc-sev-btn.active-life{border-color:var(--orange);background:rgba(255,159,67,.1)}
.dc-sev-btn.active-org{border-color:var(--gold);background:rgba(245,200,66,.1)}
.dc-sev-btn-lbl{font-size:11px;font-weight:700}
.dc-sev-btn-sub{font-size:10px;color:var(--txt3);margin-top:2px}
.active-imm .dc-sev-btn-lbl{color:var(--coral)}
.active-life .dc-sev-btn-lbl{color:var(--orange)}
.active-org .dc-sev-btn-lbl{color:var(--gold)}
.dc-attest{background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.2);border-radius:var(--r);padding:12px 14px;font-size:12px;line-height:1.65;color:var(--txt2)}
.dc-attest strong{color:var(--teal)}
.dc-cc-ai-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:linear-gradient(135deg,rgba(255,107,107,.18),rgba(155,109,255,.12));border:1px solid rgba(255,107,107,.4);border-radius:var(--r);color:var(--coral);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.dc-cc-ai-btn:hover{filter:brightness(1.1)}
.dc-cc-ai-btn:disabled{opacity:.5;cursor:wait}
.dc-cc-time-strip{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;margin-top:12px}
.dc-cc-time-lbl{font-size:9px;color:var(--txt4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.dc-cc-time-val{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--coral);line-height:1}
.dc-cc-time-note{font-size:10px;color:var(--txt3);margin-top:2px}
.dc-addon-track{display:flex;align-items:center;gap:8px;background:rgba(155,109,255,.08);border:1px solid rgba(155,109,255,.25);border-radius:var(--r);padding:6px 10px}
.dc-addon-ctrl{width:26px;height:26px;border-radius:6px;border:1px solid rgba(155,109,255,.3);background:rgba(155,109,255,.12);color:var(--purple);font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dc-addon-ctrl:hover{background:rgba(155,109,255,.25)}
.dc-addon-cnt{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:var(--purple);min-width:24px;text-align:center}
@keyframes dc-ccin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
`;

const DISPS = [
  {id:'home',cls:'sel-home',icon:'🏠',label:'Discharge Home',sub:'Patient may safely return home',bannerStyle:{background:'rgba(0,229,192,.07)',borderColor:'rgba(0,229,192,.25)',color:'#00e5c0'},text:'Patient discharged home in stable condition.',textSub:'Discharge instructions reviewed and signed.'},
  {id:'floor',cls:'sel-floor',icon:'🏥',label:'Admit — Floor',sub:'General medical/surgical floor',bannerStyle:{background:'rgba(59,158,255,.07)',borderColor:'rgba(59,158,255,.25)',color:'#3b9eff'},text:'Patient admitted to general medical/surgical floor.',textSub:'Admitting orders placed. Nursing handoff completed.'},
  {id:'telem',cls:'sel-telem',icon:'📡',label:'Admit — Telemetry',sub:'Continuous cardiac monitoring',bannerStyle:{background:'rgba(245,200,66,.07)',borderColor:'rgba(245,200,66,.2)',color:'#f5c842'},text:'Patient admitted to telemetry for continuous cardiac monitoring.',textSub:'Cardiac monitoring initiated. Admitting physician notified.'},
  {id:'icu',cls:'sel-icu',icon:'🚨',label:'Admit — ICU',sub:'Critical care — high acuity',bannerStyle:{background:'rgba(255,107,107,.07)',borderColor:'rgba(255,107,107,.25)',color:'#ff6b6b'},text:'Patient admitted to the ICU for critical care management.',textSub:'ICU team bedside. Invasive monitoring initiated.'},
  {id:'obs',cls:'sel-obs',icon:'🔭',label:'Observation',sub:'Hospital outpatient status <48h',bannerStyle:{background:'rgba(155,109,255,.07)',borderColor:'rgba(155,109,255,.2)',color:'#9b6dff'},text:'Patient placed in hospital outpatient observation status.',textSub:'Observation orders placed. Expected stay < 48 hours.'},
  {id:'tx',cls:'sel-tx',icon:'🚑',label:'Transfer',sub:'Higher level / specialty facility',bannerStyle:{background:'rgba(255,159,67,.07)',borderColor:'rgba(255,159,67,.2)',color:'#ff9f43'},text:'Patient transferred to receiving facility.',textSub:'Accepting physician confirmed. Transfer paperwork complete.'},
  {id:'ama',cls:'sel-ama',icon:'⚠️',label:'AMA',sub:'Against Medical Advice',bannerStyle:{background:'rgba(245,200,66,.07)',borderColor:'rgba(245,200,66,.2)',color:'#f5c842'},text:'Patient leaving Against Medical Advice (AMA).',textSub:'Risks explained and documented. AMA form signed.'},
  {id:'expired',cls:'sel-expired',icon:'🕯️',label:'Expired',sub:'Patient expired in ED',bannerStyle:{background:'rgba(46,74,106,.15)',borderColor:'rgba(74,106,138,.3)',color:'#4a6a8a'},text:'Patient expired in the Emergency Department.',textSub:'Time of death documented. Family notified.'},
];

const EM_CARDS = [
  {code:'99281',level:'L1',desc:'Self-limited or minor problem. Minimal assessment.',time:'≤ 15 min',cx:'dc-c-low',cxl:'MINIMAL'},
  {code:'99282',level:'L2',desc:'Low complexity. New or established condition with low risk.',time:'16–25 min',cx:'dc-c-low',cxl:'LOW'},
  {code:'99283',level:'L3',desc:'Moderate complexity. Multiple presenting problems.',time:'26–35 min',cx:'dc-c-mod',cxl:'MODERATE'},
  {code:'99284',level:'L4',desc:'High complexity. High risk. Undiagnosed new problem.',time:'36–45 min',cx:'dc-c-high',cxl:'HIGH'},
  {code:'99285',level:'L5',desc:'High complexity. Immediate threat to life or function.',time:'46–60 min',cx:'dc-c-crit',cxl:'HIGHEST'},
  {code:'99291',level:'Critical',desc:'Critical care, first 30–74 min. Direct care with high complexity MDM.',time:'30–74 min (add +99292 per 30 min)',cx:'dc-c-crit',cxl:'CRITICAL CARE',color:'#ff6b6b'},
  {code:'99285-25',level:'L5 + Proc',desc:'Level 5 with significant, separately identifiable procedure.',time:'Modifier -25 required',cx:'dc-c-crit',cxl:'HIGHEST + PROC',color:'#9b6dff'},
];

const NAV_SECTIONS = [
  {id:'disp',icon:'🚪',label:'Disposition'},
  {id:'em',icon:'🧮',label:'E&M Coding'},
  {id:'dx',icon:'📋',label:'Diagnoses'},
  {id:'instr',icon:'📄',label:'DC Instructions'},
  {id:'ret',icon:'🚨',label:'Return Precautions'},
  {id:'fu',icon:'📅',label:'Follow-Up'},
  {id:'rx',icon:'💊',label:'Discharge Meds'},
  {id:'sig',icon:'✍',label:'Sign & Finalize'},
];

const RETURN_ITEMS = [
  {icon:'🫀',strong:'Chest pain, pressure, or tightness',rest:' that is new, returns, worsens, or radiates to your arm, jaw, neck, or back — call 911 immediately.'},
  {icon:'😵',strong:'Sudden severe headache',rest:', face drooping, arm weakness, or difficulty speaking — signs of stroke — call 911 immediately.'},
  {icon:'🌬️',strong:'Shortness of breath',rest:' at rest, difficulty breathing, or oxygen level below 94%.'},
  {icon:'💓',strong:'Rapid, irregular, or pounding heartbeat',rest:' associated with dizziness, fainting, or near-fainting.'},
  {icon:'😰',strong:'Severe sweating, nausea, or vomiting',rest:' with chest discomfort.'},
  {icon:'🩸',strong:'Blood sugar < 70 mg/dL',rest:' with symptoms not responding to treatment, or blood sugar > 400 mg/dL.'},
  {icon:'😟',strong:'Any other symptom',rest:' that feels severe, sudden, or different from what you usually experience.'},
];

const ORGAN_LIST = ['Cardiovascular','Respiratory','Neurological','Renal','Hepatic','Hematologic','Metabolic / Endocrine','Infectious / Sepsis'];
const ORGAN_ICONS = ['🫀','🫁','🧠','🫘','🟤','🩸','⚗️','🦠'];
const INTERV_LIST = ['Intubation / RSI','Mechanical Ventilation','Vasopressors','CPR / ACLS','Central Line','Arterial Line','Cardioversion','MTP / Blood Products','Hemodynamic Monitor','Sedation/Analgesia','Chest Tube','POCUS'];

const ISB_ITEMS = [
  {group:'CORE',items:[{icon:'🏠',lbl:'Home'},{icon:'📊',lbl:'Dashboard'},{icon:'🔄',lbl:'Shift'},{icon:'👥',lbl:'Patients'}]},
  {group:'DOCUMENTATION',items:[{icon:'✨',lbl:'Note Hub'},{icon:'🎙️',lbl:'Transcribe'},{icon:'📄',lbl:'SOAP'},{icon:'📝',lbl:'Notes'},{icon:'⚖️',lbl:'MDM'},{icon:'🩺',lbl:'Plan'},{icon:'💊',lbl:'eRx'},{icon:'🚪',lbl:'Discharge',active:true}]},
  {group:'REFERENCE',items:[{icon:'🦠',lbl:'Antibiotics'},{icon:'🧮',lbl:'Calculators'}]},
];

const now = new Date();
const pad = n => String(n).padStart(2,'0');
const todayDate = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()}`;
const todayTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default function DischargePlanningWrapper({ patientName='Martinez, Rosa E.', patientDob='04/22/1962', patientId='00847291', medications=[], allergies=[] }) {
  const [selDisp, setSelDisp] = useState(null);
  const [selEM, setSelEM] = useState(null);
  const [sbOpen, setSbOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [dots, setDots] = useState({});
  const [dcStatus, setDcStatus] = useState('DRAFT');
  const [saving, setSaving] = useState(false);
  const [dxList, setDxList] = useState([
    {id:1,order:'1°',code:'R07.9',name:'Chest pain, unspecified',primary:true},
    {id:2,order:'2°',code:'I10',name:'Essential hypertension',primary:false},
  ]);
  const [newDxCode, setNewDxCode] = useState('');
  const [newDxName, setNewDxName] = useState('');
  const [instrGenerated, setInstrGenerated] = useState(false);
  const [generatingInstr, setGeneratingInstr] = useState(false);
  const [instrDiag, setInstrDiag] = useState('');
  const [instrTreat, setInstrTreat] = useState('');
  const [instrMeds, setInstrMeds] = useState('');
  const [instrAct, setInstrAct] = useState('');
  const [instrMisc, setInstrMisc] = useState('');
  const [fuList, setFuList] = useState([
    {id:1,icon:'🫀',specialty:'Cardiology',note:'Within 1–2 weeks — stress test or outpatient evaluation',urgency:'Urgent'},
    {id:2,icon:'🩺',specialty:'Primary Care Physician (PCP)',note:'Within 3–5 days — blood pressure check',urgency:'Routine'},
  ]);
  const [newFu, setNewFu] = useState('');
  const [newFuUrg, setNewFuUrg] = useState('Routine');
  const [dcRxList, setDcRxList] = useState(
    medications.length ? medications.map((m,i)=>({id:`m${i}`,drug:m,sig:'Continue as prescribed',type:'CONTINUE'}))
    : [{id:'r1',drug:'Aspirin 81mg',sig:'Take 1 tablet by mouth once daily',type:'CONTINUE'},{id:'r2',drug:'Nitroglycerin 0.4mg SL',sig:'Place 1 tablet under tongue every 5 min for chest pain. Call 911 if no relief.',type:'NEW'}]
  );
  const [newRxDrug, setNewRxDrug] = useState('');
  const [newRxSig, setNewRxSig] = useState('');
  const [newRxType, setNewRxType] = useState('NEW');
  const [admitService, setAdmitService] = useState('');
  const [admitMD, setAdmitMD] = useState('');
  const [admitBed, setAdmitBed] = useState('');
  const [txFacility, setTxFacility] = useState('');
  const [txReason, setTxReason] = useState('');
  const [txMD, setTxMD] = useState('');
  const [txMode, setTxMode] = useState('ALS Ambulance');
  const [mdmProblems, setMdmProblems] = useState('');
  const [mdmData, setMdmData] = useState('');
  const [mdmRisk, setMdmRisk] = useState('');
  const [mdmNarrative, setMdmNarrative] = useState('');
  const [emTime, setEmTime] = useState('');
  const [emFaceTime, setEmFaceTime] = useState('');
  const [emProcCpt, setEmProcCpt] = useState('');
  const [showCC, setShowCC] = useState(false);
  const [ccStart, setCcStart] = useState('');
  const [ccEnd, setCcEnd] = useState('');
  const [ccAddon, setCcAddon] = useState(0);
  const [ccSeverity, setCcSeverity] = useState('');
  const [ccOrgans, setCcOrgans] = useState([]);
  const [ccInterventions, setCcInterventions] = useState([]);
  const [ccCondition, setCcCondition] = useState('');
  const [ccLabs, setCcLabs] = useState('');
  const [ccResponse, setCcResponse] = useState('');
  const [ccConsults, setCcConsults] = useState('');
  const [ccDispo, setCcDispo] = useState('');
  const [ccImpression, setCcImpression] = useState('');
  const [ccBp, setCcBp] = useState('');
  const [ccHr, setCcHr] = useState('');
  const [ccRr, setCcRr] = useState('');
  const [ccSpo2, setCcSpo2] = useState('');
  const [ccTemp, setCcTemp] = useState('');
  const [ccGcs, setCcGcs] = useState('');
  const [ccMap, setCcMap] = useState('');
  const [ccSig, setCcSig] = useState('');
  const [ccSigDt, setCcSigDt] = useState('');
  const [ccIntervText, setCcIntervText] = useState('');
  const [sigDate, setSigDate] = useState(todayDate);
  const [sigTime, setSigTime] = useState(todayTime);
  const [sigPt, setSigPt] = useState('');
  const [sigRel, setSigRel] = useState('');
  const [sigRN, setSigRN] = useState('');
  const [sigNote, setSigNote] = useState('');
  const [fuPending, setFuPending] = useState('');
  const [fuPcp, setFuPcp] = useState('');
  const [returnCustom, setReturnCustom] = useState('');
  const [aiMsgs, setAiMsgs] = useState([{role:'sys',text:'Notrya AI Discharge Advisor ready. Select disposition to begin, then use quick actions to auto-generate instructions, E&M level, and return precautions from chart data.'}]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [clockTime, setClockTime] = useState(todayTime);
  const aiMsgsRef = useRef(null);

  useEffect(()=>{ if(aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight; },[aiMsgs,aiLoading]);
  useEffect(()=>{
    const t = setInterval(()=>{ const d=new Date(); setClockTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`); },10000);
    return ()=>clearInterval(t);
  },[]);

  const setDot = (id,done) => setDots(p=>({...p,[id]:done}));
  const appendMsg = (role,text) => setAiMsgs(p=>[...p,{role,text}]);
  const buildCtx = () => `Patient: ${patientName} | DOB: ${patientDob} | MRN: ${patientId} | Allergies: ${allergies.join(', ')||'NKDA'} | Disposition: ${selDisp||'Not set'} | E&M: ${selEM||'Not selected'}`;

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    appendMsg('user', question);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `You are Notrya AI, an expert emergency medicine physician helping with discharge documentation. Be concise and clinical.\n\nContext: ${buildCtx()}\n\nQuestion: ${question}` });
      appendMsg('bot', typeof res === 'string' ? res : JSON.stringify(res));
    } catch(e) { appendMsg('sys','⚠ Connection error. Please try again.'); }
    setAiLoading(false);
  };

  const generateInstructions = async () => {
    setGeneratingInstr(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate discharge instructions for: ${patientName}, Allergies: ${allergies.join(',')||'NKDA'}, Meds: ${dcRxList.map(r=>r.drug).join(', ')}. Return JSON with keys: diagnosis, treatment, medications, activity, additional. Write at 6th grade reading level.`,
        response_json_schema:{type:'object',properties:{diagnosis:{type:'string'},treatment:{type:'string'},medications:{type:'string'},activity:{type:'string'},additional:{type:'string'}}}
      });
      if(res.diagnosis) setInstrDiag(res.diagnosis);
      if(res.treatment) setInstrTreat(res.treatment);
      if(res.medications) setInstrMeds(res.medications);
      if(res.activity) setInstrAct(res.activity);
      if(res.additional) setInstrMisc(res.additional);
      setInstrGenerated(true);
      setDot('instr',true);
      appendMsg('bot','✅ Discharge instructions generated. Review and edit as needed.');
    } catch(e){ appendMsg('sys','⚠ Generation failed. Please try again.'); }
    setGeneratingInstr(false);
  };

  const generateCCNote = async () => {
    appendMsg('user','Generate Critical Care note from chart data');
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `Generate a complete Critical Care (CPT 99291) note for: ${buildCtx()}. Include: critical condition justification, organ systems involved, interventions performed, clinical impression, and attestation.` });
      setCcImpression(typeof res === 'string' ? res : JSON.stringify(res));
      appendMsg('bot','✅ Critical Care note generated. Review and verify all elements.');
    } catch(e){ appendMsg('sys','⚠ Generation failed.'); }
    setAiLoading(false);
  };

  const calcCCTime = (start, end) => {
    if(!start || !end) return '—';
    const [sh,sm] = start.split(':').map(Number);
    const [eh,em] = end.split(':').map(Number);
    const diff = (eh*60+em) - (sh*60+sm);
    if(diff <= 0) return '—';
    return `${diff} min`;
  };

  const finalizeDischarge = async () => {
    if(!selDisp){ appendMsg('sys','⚠ Please select a disposition before finalizing.'); return; }
    setSaving(true);
    await new Promise(r=>setTimeout(r,800));
    setDcStatus('SIGNED');
    NAV_SECTIONS.forEach(s=>setDot(s.id,true));
    appendMsg('bot',`✅ Discharge summary signed and finalized for ${patientName}.`);
    setSaving(false);
  };

  const addDx = () => {
    if(!newDxName.trim()) return;
    setDxList(p=>[...p,{id:Date.now(),order:`${p.length+1}°`,code:newDxCode,name:newDxName,primary:false}]);
    setNewDxCode(''); setNewDxName(''); setDot('dx',true);
  };

  const addFU = () => {
    if(!newFu.trim()) return;
    const emojiMap = {cardio:'🫀',cardiac:'🫀',pcp:'🩺',primary:'🩺',neuro:'🧠',ortho:'🦴',pulm:'🫁',gi:'🫙'};
    const icon = Object.entries(emojiMap).find(([k])=>newFu.toLowerCase().includes(k))?.[1] || '📅';
    setFuList(p=>[...p,{id:Date.now(),icon,specialty:newFu,note:'',urgency:newFuUrg}]);
    setNewFu(''); setDot('fu',true);
  };

  const addDcRx = () => {
    if(!newRxDrug.trim()) return;
    setDcRxList(p=>[...p,{id:Date.now(),drug:newRxDrug,sig:newRxSig,type:newRxType}]);
    setNewRxDrug(''); setNewRxSig(''); setDot('rx',true);
  };

  const scrollTo = id => document.getElementById(`dc-sec-${id}`)?.scrollIntoView({behavior:'smooth',block:'start'});
  const toggleOrgan = (item, list, setList) => setList(p => p.includes(item) ? p.filter(x=>x!==item) : [...p, item]);

  const typeColor={NEW:'rgba(155,109,255,.15)',CONTINUE:'rgba(59,158,255,.15)',CHANGED:'rgba(245,200,66,.15)',STOP:'rgba(255,107,107,.15)'};
  const typeTextColor={NEW:'#9b6dff',CONTINUE:'#3b9eff',CHANGED:'#f5c842',STOP:'#ff6b6b'};
  const typeIcon={NEW:'🆕',CONTINUE:'🔵',CHANGED:'🔄',STOP:'❌'};
  const selDispObj = DISPS.find(d=>d.id===selDisp);
  const isAdmit = selDisp && ['floor','telem','icu','obs'].includes(selDisp);

  return (
    <div className="dc-root">
      <style>{CSS}</style>

      {/* ICON SIDEBAR */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <aside className="dc-isb">
          <div className="dc-isb-logo"><div className="dc-isb-logo-box">D/C</div></div>
          <div className="dc-isb-scroll">
            {ISB_ITEMS.map(group=>(
              <div key={group.group} style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <span className="dc-isb-glbl">{group.group}</span>
                {group.items.map(item=>(
                  <div key={item.lbl} className={`dc-isb-btn${item.active?' active':''}`}>
                    <span className="dc-isb-icon">{item.icon}</span>
                    <span className="dc-isb-lbl">{item.lbl}</span>
                  </div>
                ))}
                <div className="dc-isb-sep"/>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT COLUMN */}
        <div className="dc-right">

          {/* NAVBAR */}
          <div className="dc-nav">
            <span className="dc-nav-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span>
            <div className="dc-nav-sep"/>
            <div className="dc-nav-stat"><span className="dc-nav-stat-val">7</span><span className="dc-nav-stat-lbl">Active Patients</span></div>
            <div className="dc-nav-stat"><span className="dc-nav-stat-val alert">14</span><span className="dc-nav-stat-lbl">Notes Pending</span></div>
            <div className="dc-nav-stat"><span className="dc-nav-stat-val">3</span><span className="dc-nav-stat-lbl">Orders Queue</span></div>
            <div className="dc-nav-stat"><span className="dc-nav-stat-val">11.6</span><span className="dc-nav-stat-lbl">Shift Hours</span></div>
            <div className="dc-nav-right">
              <div className="dc-nav-specialty">Emergency Medicine <span style={{color:'var(--txt4)'}}>▾</span></div>
              <div className="dc-nav-time">{clockTime} <span style={{color:'var(--txt4)'}}>▾</span></div>
              <div className="dc-nav-ai"><div className="dc-nav-ai-dot"/> AI ON</div>
              <button className="dc-nav-newpt">+ New Patient</button>
            </div>
          </div>

          {/* SUB-NAVBAR */}
          <div className="dc-subnav">
            <span className="dc-subnav-logo">notrya</span>
            <span className="dc-subnav-sep">|</span>
            <span className="dc-subnav-title">Discharge Summary</span>
            <span className="dc-subnav-badge">DC-01</span>
            <div className="dc-subnav-right">
              <button className="dc-btn dc-btn-ghost" onClick={()=>window.print()}>🖨 Print</button>
              <button className="dc-btn dc-btn-ghost" onClick={()=>sendAI('Generate a complete patient-friendly discharge letter.')}>📄 Generate Patient Letter</button>
              <button className="dc-btn dc-btn-gold" onClick={()=>sendAI('Suggest the optimal E&M level and document the MDM reasoning using 2021 AMA guidelines.')}>🧮 Suggest E&M</button>
              <button className="dc-btn dc-btn-primary" onClick={finalizeDischarge} disabled={saving}>
                {saving?<><span className="dc-spin"/> Signing…</>:'✍ Finalize & Sign'}
              </button>
            </div>
          </div>

          {/* VITALS BAR */}
          <div className="dc-vbar">
            <span className="dc-vbar-name">{patientName}</span>
            <span className="dc-vbar-meta">62 yo F · DOB {patientDob} · MRN {patientId}</span>
            <div className="dc-vbar-div"/>
            <div className="dc-vbar-vital"><span className="lbl">CC</span><span className="val" style={{color:'var(--orange)'}}>Chest Pain</span></div>
            <div className="dc-vbar-div"/>
            <div className="dc-vbar-vital"><span className="lbl">BP</span><span className="val">138/86</span></div>
            <div className="dc-vbar-vital"><span className="lbl">HR</span><span className="val">88</span></div>
            <div className="dc-vbar-vital"><span className="lbl">SpO₂</span><span className="val">97%</span></div>
            <div className="dc-vbar-vital"><span className="lbl">Temp</span><span className="val">98.4°F</span></div>
            <div className="dc-vbar-div"/>
            <div className="dc-vbar-vital"><span className="lbl">LOS</span><span className="val">4h 32m</span></div>
            <div style={{marginLeft:'auto'}}>
              <span className={`dc-bdg ${dcStatus==='SIGNED'?'dc-bdg-teal':'dc-bdg-gold'}`}>{dcStatus}</span>
            </div>
          </div>

          {/* MAIN */}
          <div className="dc-main">

            {/* SIDEBAR */}
            <aside className={`dc-sb ${sbOpen?'open':'collapsed'}`}>
              <div className="dc-sb-tab" onClick={()=>setSbOpen(true)}>
                <span style={{fontSize:15,color:'#4a6a8a'}}>☰</span>
                <span className="dc-sb-tab-lbl">Discharge Summary</span>
                <span style={{fontSize:22,fontWeight:700,color:'#00e5c0',lineHeight:1}}>›</span>
              </div>
              <div className="dc-sb-inner">
                <div className="dc-sb-card">
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:'#e8f0fe'}}>{patientName}</div>
                      <div style={{fontSize:11,color:'#4a6a8a',marginTop:3}}>MRN {patientId}</div>
                      <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>
                        <span className="dc-bdg" style={{fontSize:9.5,background:'rgba(255,159,67,.12)',color:'var(--orange)',border:'1px solid rgba(255,159,67,.3)'}}>Chest Pain</span>
                        <span className="dc-bdg" style={{fontSize:9.5,background:'rgba(74,106,138,.2)',color:'#4a6a8a',border:'1px solid var(--border)'}}>4h 32m LOS</span>
                      </div>
                    </div>
                    <div className="dc-sb-toggle" onClick={()=>setSbOpen(false)}>‹</div>
                  </div>
                </div>
                <div className="dc-sb-lbl">Sections</div>
                {NAV_SECTIONS.map(s=>(
                  <div key={s.id} className="dc-sb-nav" onClick={()=>scrollTo(s.id)}>
                    <span className="icon">{s.icon}</span>{s.label}
                    <span className={`dc-sb-dot${dots[s.id]?' done':''}`}/>
                  </div>
                ))}
                <div className="dc-sb-divider"/>
                <div className="dc-sb-lbl">Visit Summary</div>
                <div className="dc-sb-card" style={{marginBottom:0}}>
                  {[['Disposition',selDispObj?.label||'—','#00e5c0'],['E&M Level',selEM||'—','#3b9eff'],['Diagnoses',String(dxList.length),'#8aaccc'],['Follow-Ups',String(fuList.length),'#f5c842'],['DC Meds',String(dcRxList.length),'#9b6dff'],['Status',dcStatus,'#00e5c0']].map(([l,v,c])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:11,color:'#4a6a8a'}}>{l}</span>
                      <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:c}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* CONTENT */}
            <main className="dc-content">

              {/* 1. DISPOSITION */}
              <div className="dc-sec" id="dc-sec-disp">
                <div className="dc-sec-hdr">
                  <span className="dc-sec-icon">🚪</span>
                  <div><div className="dc-sec-title">Select Disposition</div><div className="dc-sec-sub">Patient's final disposition from the Emergency Department</div></div>
                </div>
                <div style={{fontSize:11,color:'#4a6a8a',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:600,marginBottom:12}}>SELECT DISPOSITION</div>
                <div className="dc-disp-grid">
                  {DISPS.map(d=>(
                    <div key={d.id} className={`dc-disp-card${selDisp===d.id?' '+d.cls:''}`} onClick={()=>{setSelDisp(d.id);setDot('disp',true);}}>
                      <span className="dc-disp-emoji">{d.icon}</span>
                      <div className="dc-disp-name" style={selDisp===d.id?{color:d.bannerStyle.color}:{}}>{d.label}</div>
                      <div className="dc-disp-sub">{d.sub}</div>
                    </div>
                  ))}
                </div>
                {selDispObj && (
                  <div className="dc-banner" style={{...selDispObj.bannerStyle}}>
                    <span style={{fontSize:20}}>{selDispObj.icon}</span>
                    <div><div style={{fontWeight:700,fontSize:12}}>{selDispObj.text}</div><div style={{fontSize:11,opacity:.8,marginTop:2}}>{selDispObj.textSub}</div></div>
                    <button style={{marginLeft:'auto',background:'none',border:'none',color:'#4a6a8a',cursor:'pointer',fontSize:16}} onClick={()=>setSelDisp(null)}>✕</button>
                  </div>
                )}
                {isAdmit && (
                  <div className="dc-grid3" style={{marginTop:14}}>
                    <div className="dc-field"><label className="dc-flbl">Admitting Service</label><input className="dc-inp" value={admitService} onChange={e=>setAdmitService(e.target.value)} placeholder="e.g. Cardiology…"/></div>
                    <div className="dc-field"><label className="dc-flbl">Admitting Physician</label><input className="dc-inp" value={admitMD} onChange={e=>setAdmitMD(e.target.value)} placeholder="Dr. Name"/></div>
                    <div className="dc-field"><label className="dc-flbl">Bed / Unit</label><input className="dc-inp" value={admitBed} onChange={e=>setAdmitBed(e.target.value)} placeholder="e.g. 4W-412"/></div>
                  </div>
                )}
                {selDisp==='tx' && (
                  <div className="dc-grid2" style={{marginTop:14}}>
                    <div className="dc-field"><label className="dc-flbl">Receiving Facility</label><input className="dc-inp" value={txFacility} onChange={e=>setTxFacility(e.target.value)} placeholder="Facility name…"/></div>
                    <div className="dc-field"><label className="dc-flbl">Reason for Transfer</label><input className="dc-inp" value={txReason} onChange={e=>setTxReason(e.target.value)} placeholder="Higher level of care…"/></div>
                    <div className="dc-field"><label className="dc-flbl">Accepting Physician</label><input className="dc-inp" value={txMD} onChange={e=>setTxMD(e.target.value)} placeholder="Dr. Name"/></div>
                    <div className="dc-field"><label className="dc-flbl">Transport Mode</label>
                      <select className="dc-sel" value={txMode} onChange={e=>setTxMode(e.target.value)}>
                        {['ALS Ambulance','BLS Ambulance','Air Transport','Private Vehicle'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. E&M CODING */}
              <div className="dc-sec" id="dc-sec-em">
                <div className="dc-sec-hdr">
                  <span className="dc-sec-icon">🧮</span>
                  <div><div className="dc-sec-title">Evaluation &amp; Management (E&amp;M) Coding</div><div className="dc-sec-sub">Select appropriate level · 2021 AMA guidelines · Medical Decision Making</div></div>
                  <button className="dc-btn dc-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('Suggest the most appropriate E&M level and document the MDM reasoning using 2021 AMA E&M guidelines.')}>✨ AI Suggest Level</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:10}}>
                  {EM_CARDS.slice(0,5).map(e=>(
                    <div key={e.code} className={`dc-em-card${selEM===e.code?' sel':''}`} onClick={()=>{setSelEM(e.code);setDot('em',true);setShowCC(e.code==='99291');}}>
                      <div className="dc-em-lvl" style={e.color?{color:e.color}:{}}>{e.level}</div>
                      <div className="dc-em-code">{e.code}</div>
                      <div className="dc-em-desc">{e.desc}</div>
                      <div className="dc-em-time">{e.time}</div>
                      <span className={`dc-em-badge ${e.cx}`}>{e.cxl}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                  {EM_CARDS.slice(5).map(e=>(
                    <div key={e.code} className={`dc-em-card${selEM===e.code?' sel':''}`} onClick={()=>{setSelEM(e.code);setDot('em',true);setShowCC(e.code==='99291');}}>
                      <div className="dc-em-lvl" style={e.color?{color:e.color}:{}}>{e.level}</div>
                      <div className="dc-em-code">{e.code}</div>
                      <div className="dc-em-desc">{e.desc}</div>
                      <div className="dc-em-time">{e.time}</div>
                      <span className={`dc-em-badge ${e.cx}`}>{e.cxl}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:'#4a6a8a',textTransform:'uppercase',letterSpacing:'.05em',fontWeight:700,marginBottom:8}}>Medical Decision Making (MDM) Documentation</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {[
                    {lbl:'Number & Complexity of Problems',val:mdmProblems,set:setMdmProblems,opts:['1 self-limited / minor problem','1 stable chronic illness','2+ stable chronic illnesses','1 undiagnosed new problem with uncertain prognosis','1 acute illness with systemic symptoms','1 acute or chronic illness with threat to life or bodily function']},
                    {lbl:'Amount & Complexity of Data Reviewed',val:mdmData,set:setMdmData,opts:['Minimal / none','Limited — order/review test(s), external notes','Moderate — independent interpretation of results','Extensive — independent interpretation + discussion with specialist']},
                    {lbl:'Risk of Complications / Morbidity or Mortality',val:mdmRisk,set:setMdmRisk,opts:['Minimal — OTC medications, minor surgery','Low — Rx drug mgmt, procedure with no identified risk','Moderate — Prescription drug mgmt, minor surgery with identified risk','High — Drug therapy requiring intensive monitoring, elective major surgery']},
                  ].map(({lbl,val,set,opts})=>(
                    <div key={lbl} className="dc-mdm-row">
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:600,color:'#8aaccc',marginBottom:6}}>{lbl}</div>
                        <select className="dc-sel" value={val} onChange={e=>set(e.target.value)}>
                          <option value="">— Select —</option>
                          {opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  <div className="dc-field"><label className="dc-flbl">MDM Narrative</label><textarea className="dc-ta" rows={3} value={mdmNarrative} onChange={e=>setMdmNarrative(e.target.value)} placeholder="Document clinical decision-making rationale…"/></div>
                  <div className="dc-grid3">
                    <div className="dc-field"><label className="dc-flbl">Total Encounter Time</label><input className="dc-inp" value={emTime} onChange={e=>setEmTime(e.target.value)} placeholder="e.g. 45 min"/></div>
                    <div className="dc-field"><label className="dc-flbl">Provider Time (face-to-face)</label><input className="dc-inp" value={emFaceTime} onChange={e=>setEmFaceTime(e.target.value)} placeholder="e.g. 30 min"/></div>
                    <div className="dc-field"><label className="dc-flbl">Procedure CPT (if any)</label><input className="dc-inp" value={emProcCpt} onChange={e=>setEmProcCpt(e.target.value)} placeholder="e.g. 93010 EKG"/></div>
                  </div>
                </div>
              </div>

              {/* 2b. CRITICAL CARE */}
              {showCC && (
                <div className="dc-sec" id="dc-sec-cc" style={{animation:'dc-ccin .35s cubic-bezier(.4,0,.2,1)'}}>
                  <div className="dc-cc-accent">
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                          <span style={{fontSize:22}}>🚨</span>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#e8f0fe'}}>Critical Care Note</div>
                          <span style={{display:'inline-flex',alignItems:'center',background:'rgba(255,107,107,.14)',border:'1px solid rgba(255,107,107,.35)',borderRadius:6,padding:'4px 12px',fontSize:11,fontWeight:700,color:'#ff6b6b',letterSpacing:'.05em',textTransform:'uppercase'}}>CPT 99291</span>
                          <span className="dc-bdg dc-bdg-coral" style={{fontSize:10}}>HIGH COMPLEXITY</span>
                        </div>
                        <div style={{fontSize:12,color:'#4a6a8a'}}>Direct physician care of a critically ill/injured patient — first 30–74 minutes.</div>
                      </div>
                      <button className="dc-cc-ai-btn" style={{marginLeft:'auto'}} onClick={generateCCNote} disabled={aiLoading}>✨ AI Generate Note</button>
                    </div>
                    <div className="dc-cc-time-strip">
                      <div><div className="dc-cc-time-lbl">CC Start Time</div><input type="time" className="dc-inp" value={ccStart} onChange={e=>setCcStart(e.target.value)} style={{fontFamily:'monospace',fontSize:14,fontWeight:700,color:'#ff6b6b'}}/><div className="dc-cc-time-note">Time at bedside</div></div>
                      <div><div className="dc-cc-time-lbl">CC End Time</div><input type="time" className="dc-inp" value={ccEnd} onChange={e=>setCcEnd(e.target.value)} style={{fontFamily:'monospace',fontSize:14,fontWeight:700,color:'#ff6b6b'}}/><div className="dc-cc-time-note">Time left bedside</div></div>
                      <div><div className="dc-cc-time-lbl">Total CC Time</div><div className="dc-cc-time-val">{calcCCTime(ccStart,ccEnd)}</div><div className="dc-cc-time-note">Must be ≥ 30 min for 99291</div></div>
                      <div><div className="dc-cc-time-lbl">99292 Add-On Units</div>
                        <div className="dc-addon-track" style={{marginTop:4}}>
                          <button className="dc-addon-ctrl" onClick={()=>setCcAddon(p=>Math.max(0,p-1))}>−</button>
                          <div className="dc-addon-cnt">{ccAddon}</div>
                          <button className="dc-addon-ctrl" onClick={()=>setCcAddon(p=>p+1)}>+</button>
                          <div style={{fontSize:10,color:'#4a6a8a',lineHeight:1.4}}><strong style={{color:'#9b6dff'}}>×30 min</strong><br/>each</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div className="dc-cc-lbl"><span>⚕️</span>Critical Condition — Nature &amp; Severity</div>
                    <div className="dc-sev-row">
                      {[['active-imm','Immediately Life-Threatening','Imminent risk of death'],['active-life','Life-Threatening Condition','High probability of deterioration'],['active-org','Threat to Organ Function','Risk of significant organ dysfunction']].map(([cls,lbl,sub])=>(
                        <div key={cls} className={`dc-sev-btn${ccSeverity===cls?' '+cls:''}`} onClick={()=>setCcSeverity(p=>p===cls?'':cls)}>
                          <div className="dc-sev-btn-lbl">{lbl}</div><div className="dc-sev-btn-sub">{sub}</div>
                        </div>
                      ))}
                    </div>
                    <textarea className="dc-ta" value={ccCondition} onChange={e=>setCcCondition(e.target.value)} style={{minHeight:72}} placeholder="Describe the critical condition and clinical findings supporting critical illness…"/>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div className="dc-cc-lbl"><span>🫀</span>Organ Systems Involved</div>
                    <div className="dc-organ-grid">
                      {ORGAN_LIST.map((organ,i)=>(
                        <div key={organ} className={`dc-organ-chip${ccOrgans.includes(organ)?' active':''}`} onClick={()=>toggleOrgan(organ,ccOrgans,setCcOrgans)}>
                          <div className="dc-organ-chk">{ccOrgans.includes(organ)?'✓':''}</div>
                          <span className="dc-organ-lbl">{ORGAN_ICONS[i]} {organ}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div className="dc-cc-lbl"><span>📊</span>Vitals at Time of Critical Care</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
                      {[['BP',ccBp,setCcBp,'e.g. 82/50'],['HR',ccHr,setCcHr,'e.g. 128'],['RR',ccRr,setCcRr,'e.g. 28'],['SpO₂',ccSpo2,setCcSpo2,'e.g. 86%'],['Temp',ccTemp,setCcTemp,'e.g. 103.4°F'],['GCS',ccGcs,setCcGcs,'e.g. 8'],['MAP',ccMap,setCcMap,'e.g. 54']].map(([lbl,val,set,ph])=>(
                        <div key={lbl} className="dc-field"><label className="dc-flbl">{lbl}</label><input className="dc-inp" style={{fontFamily:'monospace'}} value={val} onChange={e=>set(e.target.value)} placeholder={ph}/></div>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div className="dc-cc-lbl"><span>⚙️</span>Interventions During Critical Care Time</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
                      {INTERV_LIST.map(iv=>(
                        <div key={iv} className={`dc-organ-chip${ccInterventions.includes(iv)?' active':''}`} onClick={()=>toggleOrgan(iv,ccInterventions,setCcInterventions)}>
                          <div className="dc-organ-chk">{ccInterventions.includes(iv)?'✓':''}</div>
                          <span className="dc-organ-lbl" style={{fontSize:11}}>{iv}</span>
                        </div>
                      ))}
                    </div>
                    <textarea className="dc-ta" value={ccIntervText} onChange={e=>setCcIntervText(e.target.value)} style={{minHeight:64}} placeholder="Describe additional interventions and patient response…"/>
                  </div>
                  <div className="dc-grid2" style={{marginBottom:12}}>
                    {[['🔬 Diagnostic Results Reviewed',ccLabs,setCcLabs,'Labs, imaging, ECG findings reviewed…'],['📈 Response to Treatment',ccResponse,setCcResponse,'Patient response to interventions…'],['💬 Communication & Consultations',ccConsults,setCcConsults,'Specialist consultations, family discussions…'],['🏥 Disposition Decision',ccDispo,setCcDispo,'Disposition plan discussed during CC care…']].map(([lbl,val,set,ph])=>(
                      <div key={lbl} className="dc-field"><label className="dc-flbl" style={{marginBottom:6}}>{lbl}</label><textarea className="dc-ta" value={val} onChange={e=>set(e.target.value)} style={{minHeight:70}} placeholder={ph}/></div>
                    ))}
                  </div>
                  <div style={{marginBottom:14}}>
                    <div className="dc-cc-lbl"><span>📋</span>Clinical Impression &amp; Assessment</div>
                    <textarea className="dc-ta" value={ccImpression} onChange={e=>setCcImpression(e.target.value)} style={{minHeight:90}} placeholder="Critical care clinical impression, working diagnosis, acuity justification, management plan…"/>
                  </div>
                  <div className="dc-attest">
                    <strong>Physician Attestation:</strong> I personally provided direct, face-to-face critical care to this patient for the time documented above. The patient's condition was of high complexity requiring constant physician attendance due to the critical nature of the illness or injury.
                    <div style={{marginTop:8,display:'flex',gap:12,alignItems:'center'}}>
                      <div className="dc-field" style={{flex:1}}><label className="dc-flbl">Physician Signature</label><input className="dc-inp" value={ccSig} onChange={e=>setCcSig(e.target.value)} placeholder="Dr. Name, MD"/></div>
                      <div className="dc-field" style={{width:180}}><label className="dc-flbl">Date / Time</label><input className="dc-inp" style={{fontFamily:'monospace'}} value={ccSigDt} onChange={e=>setCcSigDt(e.target.value)} placeholder="MM/DD/YYYY HH:MM"/></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DIAGNOSES */}
              <div className="dc-sec" id="dc-sec-dx">
                <div className="dc-sec-hdr">
                  <span className="dc-sec-icon">📋</span>
                  <div><div className="dc-sec-title">Discharge Diagnoses</div><div className="dc-sec-sub">Primary and secondary diagnoses with ICD-10 codes</div></div>
                  <button className="dc-btn dc-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('Suggest appropriate ICD-10 codes for the discharge diagnoses. Format each as: ICD-10 code | diagnosis name.')}>✨ AI Code</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {dxList.map(dx=>(
                    <div key={dx.id} className="dc-row">
                      <span style={{fontSize:11,fontWeight:700,color:dx.primary?'#00e5c0':'#4a6a8a',minWidth:28,fontFamily:'monospace'}}>{dx.order}</span>
                      <input className="dc-row-inp" style={{maxWidth:80,fontFamily:'monospace',fontSize:11,color:'#3b9eff'}} value={dx.code} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,code:e.target.value}:d))} placeholder="ICD-10"/>
                      <input className="dc-row-inp" style={{flex:1}} value={dx.name} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,name:e.target.value}:d))} placeholder="Diagnosis name…"/>
                      <span className={`dc-chip ${dx.primary?'dc-chip-urg':'dc-chip-rtn'}`}>{dx.primary?'PRIMARY':'SECONDARY'}</span>
                      {!dx.primary && <button className="dc-row-del" onClick={()=>setDxList(p=>p.filter(d=>d.id!==dx.id))}>×</button>}
                    </div>
                  ))}
                </div>
                <div className="dc-add-row">
                  <input className="dc-add-inp" style={{maxWidth:90,fontFamily:'monospace',fontSize:12}} value={newDxCode} onChange={e=>setNewDxCode(e.target.value)} placeholder="ICD-10"/>
                  <input className="dc-add-inp" style={{flex:1}} value={newDxName} onChange={e=>setNewDxName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addDx()} placeholder="+ Add diagnosis…"/>
                  <button className="dc-btn dc-btn-ghost" onClick={addDx}>Add</button>
                </div>
              </div>

              {/* 4. DISCHARGE INSTRUCTIONS */}
              <div className="dc-sec" id="dc-sec-instr">
                <div className="dc-sec-hdr">
                  <span className="dc-sec-icon">📄</span>
                  <div><div className="dc-sec-title">Discharge Instructions</div><div className="dc-sec-sub">Patient-facing care guide — AI generated from chart information</div></div>
                  <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
                    {instrGenerated && <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:9,color:'#00e5c0',background:'rgba(0,229,192,.1)',border:'1px solid rgba(0,229,192,.25)',borderRadius:3,padding:'1px 6px',fontWeight:700}}>✨ AI Generated</span>}
                    <button className="dc-btn dc-btn-gold" onClick={generateInstructions} disabled={generatingInstr}>
                      {generatingInstr?<><span className="dc-spin"/> Generating…</>:'✨ Generate from Chart'}
                    </button>
                  </div>
                </div>
                {!instrGenerated ? (
                  <div style={{background:'rgba(22,45,79,.3)',border:'1px dashed #1a3555',borderRadius:8,textAlign:'center',padding:'28px 20px',color:'#4a6a8a',fontSize:12}}>
                    Click <strong style={{color:'#f5c842'}}>✨ Generate from Chart</strong> to have AI create personalized discharge instructions based on this patient's diagnosis, treatment, and medications.
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {[{icon:'🩺',title:'Your Diagnosis',val:instrDiag,set:setInstrDiag},{icon:'💊',title:'Treatment Received in the ED',val:instrTreat,set:setInstrTreat},{icon:'💊',title:'Medications',val:instrMeds,set:setInstrMeds},{icon:'🏃',title:'Activity & Diet',val:instrAct,set:setInstrAct},{icon:'📝',title:'Additional Instructions',val:instrMisc,set:setInstrMisc}].map(({icon,title,val,set})=>(
                      <div key={title} className="dc-instr-box">
                        <div className="dc-instr-hdr">
                          <span style={{fontSize:15}}>{icon}</span>
                          <span style={{fontSize:12,fontWeight:700,color:'#e8f0fe',textTransform:'uppercase',letterSpacing:'.04em'}}>{title}</span>
                        </div>
                        <textarea className="dc-ta" style={{minHeight:60,fontSize:12.5}} value={val} onChange={e=>set(e.target.value)} placeholder="Enter patient instructions…"/>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. RETURN PRECAUTIONS */}
              <div className="dc-sec" id="dc-sec-ret">
                <div className="dc-sec-hdr">
                  <span className="dc-sec-icon">🚨</span>
                  <div><div className="dc-sec-title">Return to the Emergency Department</div><div className="dc-sec-sub">Instruct patient to return immediately for any of the following</div></div>
                  <button className="dc-btn dc-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('List the most important return-to-ED precautions for this patient. Use patient-friendly language.')}>✨ AI Precautions</button>
                </div>
                {RETURN_ITEMS.map((item,i)=>(
                  <div key={i} className="dc-ret-card">
                    <span style={{fontSize:17,flexShrink:0,marginTop:2}}>{item.icon}</span>
                    <div style={{fontSize:12,color:'#8aaccc',lineHeight:1.5}}><strong style={{color:'#ff6b6b'}}>{item.strong}</strong>{item.rest}</div>
                  </div>
                ))}
                <div className="dc-field" style={{marginTop:12}}>
                  <label className="dc-flbl">Additional Return Precautions (custom)</label>
                  <textarea className="dc-ta" style={{minHeight:60,borderColor:'rgba(255,107,107,.25)'}} value={returnCustom} onChange={e=>setReturnCustom(e.target.value)} placeholder="Add any diagnosis-specific return precautions…"/>
                </div>
                <div style={{marginTop:12,display:'flex',alignItems:'center',gap:10,background:'rgba(255,107,107,.06)',border:'1px solid rgba(255,107,107,.2)',borderRadius:8,padding:'11px 14px'}}>
                  <span style={{fontSize:20}}>📞</span>
                  <div><div style={{fontSize:12,fontWeight:700,color:'#ff6b6b'}}>Emergency Instructions</div><div style={{fontSize:11,color:'#8aaccc',marginTop:2}}>If experiencing a medical emergency, call <strong style={{color:'#e8f0fe'}}>911</strong> immediately or go to your nearest emergency room.</div></div>
                </div>
              </div>

              {/* 6. FOLLOW-UP */}
              <div className="dc-sec" id="dc-sec-fu">
                <div className="dc-sec-hdr">
                  <span className="dc-sec-icon">📅</span>
                  <div><div className="dc-sec-title">Follow-Up Appointments</div><div className="dc-sec-sub">Specialist referrals · Primary care · Recommended timeframe</div></div>
                  <button className="dc-btn dc-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('What follow-up appointments should be scheduled? Include timeframe and urgency.')}>✨ AI Suggest</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {fuList.map(f=>(
                    <div key={f.id} className="dc-row">
                      <span style={{fontSize:18}}>{f.icon}</span>
                      <div style={{display:'flex',flexDirection:'column',flex:1,gap:3}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#e8f0fe'}}>{f.specialty}</div>
                        <input className="dc-row-inp" style={{fontSize:11}} value={f.note} onChange={e=>setFuList(p=>p.map(x=>x.id===f.id?{...x,note:e.target.value}:x))} placeholder="Timeframe / instructions…"/>
                      </div>
                      <span className={`dc-chip ${f.urgency==='Urgent'?'dc-chip-urg':'dc-chip-rtn'}`}>{f.urgency.toUpperCase()}</span>
                      <button className="dc-row-del" onClick={()=>setFuList(p=>p.filter(x=>x.id!==f.id))}>×</button>
                    </div>
                  ))}
                </div>
                <div className="dc-add-row">
                  <input className="dc-add-inp" style={{flex:1}} value={newFu} onChange={e=>setNewFu(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addFU()} placeholder="+ Add follow-up specialty or provider…"/>
                  <select className="dc-sel" style={{width:'auto',paddingRight:24}} value={newFuUrg} onChange={e=>setNewFuUrg(e.target.value)}><option>Urgent</option><option>Routine</option></select>
                  <button className="dc-btn dc-btn-ghost" onClick={addFU}>Add</button>
                </div>
                <div className="dc-grid2" style={{marginTop:14}}>
                  <div className="dc-field"><label className="dc-flbl">Pending Lab / Imaging Results</label><textarea className="dc-ta" style={{minHeight:60}} value={fuPending} onChange={e=>setFuPending(e.target.value)} placeholder="List any results still pending that need follow-up…"/></div>
                  <div className="dc-field"><label className="dc-flbl">Primary Care Provider on Record</label><input className="dc-inp" value={fuPcp} onChange={e=>setFuPcp(e.target.value)} placeholder="Dr. Name · Practice · Phone"/></div>
                </div>
              </div>

              {/* 7. DISCHARGE MEDS */}
              <div className="dc-sec" id="dc-sec-rx">
                <div className="dc-sec-hdr">
                  <span className="dc-sec-icon">💊</span>
                  <div><div className="dc-sec-title">Discharge Medications</div><div className="dc-sec-sub">New prescriptions and changes to home medications</div></div>
                  <span className="dc-bdg dc-bdg-purple" style={{marginLeft:'auto'}}>{dcRxList.length} Rx</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {dcRxList.map(rx=>(
                    <div key={rx.id} className="dc-row" style={{borderColor:`${typeTextColor[rx.type]}33`}}>
                      <span style={{fontSize:15}}>{typeIcon[rx.type]||'🔵'}</span>
                      <div style={{display:'flex',flexDirection:'column',flex:1,gap:2}}>
                        <input className="dc-row-inp" style={{fontWeight:600,color:'#e8f0fe'}} value={rx.drug} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,drug:e.target.value}:x))} placeholder="Drug name + dose"/>
                        <input className="dc-row-inp" style={{fontSize:11}} value={rx.sig} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,sig:e.target.value}:x))} placeholder="SIG / instructions…"/>
                      </div>
                      <span style={{fontSize:9,padding:'2px 7px',borderRadius:3,background:typeColor[rx.type],color:typeTextColor[rx.type],fontWeight:700,whiteSpace:'nowrap'}}>{rx.type}</span>
                      <button className="dc-row-del" onClick={()=>setDcRxList(p=>p.filter(x=>x.id!==rx.id))}>×</button>
                    </div>
                  ))}
                </div>
                <div className="dc-add-row">
                  <input className="dc-add-inp" style={{flex:1.5}} value={newRxDrug} onChange={e=>setNewRxDrug(e.target.value)} placeholder="Drug name + dose…"/>
                  <input className="dc-add-inp" style={{flex:1}} value={newRxSig} onChange={e=>setNewRxSig(e.target.value)} placeholder="SIG / instructions…"/>
                  <select className="dc-sel" style={{width:'auto',paddingRight:24}} value={newRxType} onChange={e=>setNewRxType(e.target.value)}>
                    {['NEW','CONTINUE','CHANGED','STOP'].map(o=><option key={o}>{o}</option>)}
                  </select>
                  <button className="dc-btn dc-btn-ghost" onClick={addDcRx}>Add</button>
                </div>
              </div>

              {/* 8. SIGN & FINALIZE */}
              <div className="dc-sig" id="dc-sec-sig">
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#e8f0fe'}}>Dr. Gabriel Skiba</div>
                    <div style={{fontSize:11,color:'#4a6a8a',marginTop:2}}>MD · Emergency Medicine</div>
                  </div>
                  <div style={{marginLeft:'auto',display:'flex',gap:10}}>
                    <div className="dc-field" style={{minWidth:160}}><label className="dc-flbl">Date of Service</label><input className="dc-inp" value={sigDate} onChange={e=>setSigDate(e.target.value)}/></div>
                    <div className="dc-field" style={{minWidth:130}}><label className="dc-flbl">Time of Discharge</label><input className="dc-inp" value={sigTime} onChange={e=>setSigTime(e.target.value)}/></div>
                  </div>
                </div>
                <div className="dc-sig-line"/>
                <div className="dc-grid3" style={{marginBottom:14}}>
                  <div className="dc-field"><label className="dc-flbl">Patient / Guardian Signature</label><input className="dc-inp" value={sigPt} onChange={e=>setSigPt(e.target.value)} placeholder="Name of signatory"/></div>
                  <div className="dc-field"><label className="dc-flbl">Relationship (if guardian)</label><input className="dc-inp" value={sigRel} onChange={e=>setSigRel(e.target.value)} placeholder="Self / Parent / POA…"/></div>
                  <div className="dc-field"><label className="dc-flbl">Nurse Witnessing Discharge</label><input className="dc-inp" value={sigRN} onChange={e=>setSigRN(e.target.value)} placeholder="RN Name"/></div>
                </div>
                <div className="dc-field" style={{marginBottom:14}}>
                  <label className="dc-flbl">Attestation / Provider Notes</label>
                  <textarea className="dc-ta" style={{minHeight:60}} value={sigNote} onChange={e=>setSigNote(e.target.value)} placeholder="I have reviewed the discharge instructions with the patient/guardian and they verbalized understanding…"/>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button className="dc-btn dc-btn-ghost" onClick={()=>window.print()}>🖨 Print Discharge Papers</button>
                  <button className="dc-btn dc-btn-ghost" onClick={()=>sendAI('Write a complete discharge summary note for this visit in SOAP format suitable for the medical record.')}>📄 Generate DC Note</button>
                  <button className="dc-btn dc-btn-primary" style={{padding:'8px 20px',fontSize:13}} onClick={finalizeDischarge} disabled={saving}>
                    {saving?<><span className="dc-spin"/> Signing…</>:'✍ Sign & Finalize Discharge'}
                  </button>
                </div>
              </div>

            </main>

            {/* AI PANEL */}
            <aside className={`dc-ai ${aiOpen?'open':'collapsed'}`}>
              <div className="dc-ai-tab" onClick={()=>setAiOpen(true)}>
                <div className="dc-ai-tab-dot"/>
                <span className="dc-ai-tab-lbl">Notrya AI Advisor</span>
                <span style={{fontSize:22,fontWeight:700,color:'#00e5c0',lineHeight:1}}>›</span>
              </div>
              <div className="dc-ai-inner">
                <div className="dc-ai-hdr">
                  <div className="dc-ai-hrow">
                    <div className="dc-ai-dot"/>
                    <span className="dc-ai-lbl">Notrya AI — Discharge Advisor</span>
                    <span className="dc-ai-model">claude-sonnet-4</span>
                    <div className="dc-ai-toggle" onClick={()=>setAiOpen(false)}>‹</div>
                  </div>
                  <div className="dc-ai-qbtns">
                    {[['📄 Generate DC Instructions',()=>generateInstructions()],['🧮 E&M Level',()=>sendAI('Suggest the optimal E&M level using 2021 AMA guidelines.')],['🚨 Return Precautions',()=>sendAI('Generate return-to-ED precautions tailored to this patient.')],['📅 Follow-Up Plan',()=>sendAI('What follow-up appointments should be arranged?')],['🏷 ICD-10 Codes',()=>sendAI('Suggest ICD-10 codes for the discharge diagnoses.')],['📝 DC Summary Note',()=>sendAI('Write a complete discharge summary note in SOAP format.')],['💌 Patient Letter',()=>sendAI('Generate a patient-friendly discharge letter.')],['✅ Review Completeness',()=>sendAI('Review the completeness of this discharge summary.')]].map(([label,fn])=>(
                      <button key={label} className="dc-ai-qbtn" onClick={fn}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="dc-ai-msgs" ref={aiMsgsRef}>
                  {aiMsgs.map((m,i)=>(
                    <div key={i} className={`dc-ai-msg ${m.role}`} dangerouslySetInnerHTML={{__html:m.text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}/>
                  ))}
                  {aiLoading && <div className="dc-ai-loader"><span/><span/><span/></div>}
                </div>
                <div className="dc-ai-inp-wrap">
                  <textarea className="dc-ai-inp" rows={2} value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI();}}} placeholder="Ask about discharge planning…"/>
                  <button className="dc-ai-send" onClick={()=>sendAI()}>↑</button>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}