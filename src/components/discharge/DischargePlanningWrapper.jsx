import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CSS = `
.dc3-root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;display:flex;flex-direction:column;height:100%;overflow:hidden}
.dc3-root *{box-sizing:border-box}

/* TOP NAVBAR */
.dc3-topnav{height:46px;background:#040d19;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:10px;flex-shrink:0}
.dc3-topnav-welcome{font-size:12px;color:var(--txt2);font-weight:500;white-space:nowrap;margin-right:4px}
.dc3-topnav-welcome strong{color:var(--txt);font-weight:600}
.dc3-topnav-sep{width:1px;height:22px;background:var(--border);flex-shrink:0}
.dc3-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:3px 11px;min-width:64px;cursor:pointer}
.dc3-stat-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--txt);line-height:1.2}
.dc3-stat-val.alert{color:var(--gold)}
.dc3-stat-lbl{font-size:8px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.dc3-topnav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.dc3-specialty-btn{display:flex;align-items:center;gap:5px;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 11px;font-size:11px;color:var(--txt2);cursor:pointer;white-space:nowrap}
.dc3-time-chip{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 11px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2)}
.dc3-ai-chip{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:var(--r);padding:5px 11px;font-size:11px;font-weight:600;color:var(--teal)}
.dc3-ai-chip-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:dc3-pulse 2s ease-in-out infinite}
.dc3-newpt-btn{background:var(--teal);color:#050f1e;border:none;border-radius:var(--r);padding:6px 13px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px}
.dc3-topnav-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#1a5fbf,#2563eb);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;cursor:pointer;letter-spacing:-.5px}

/* SUB-NAVBAR */
.dc3-subnav{height:42px;background:#0b1e36;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.dc3-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-.5px}
.dc3-sep{color:var(--txt4)}
.dc3-title{font-size:13px;color:var(--txt2);font-weight:500}
.dc3-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace}
.dc3-snr{margin-left:auto;display:flex;align-items:center;gap:8px}
.dc3-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:var(--r);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:none;font-family:'DM Sans',sans-serif;white-space:nowrap}
.dc3-btn-ghost{background:var(--bg-up);border:1px solid var(--border)!important;color:var(--txt2)}
.dc3-btn-ghost:hover{border-color:var(--border-hi)!important;color:var(--txt)}
.dc3-btn-em{background:rgba(245,200,66,.15);border:1px solid rgba(245,200,66,.45)!important;color:var(--gold)}
.dc3-btn-em:hover{background:rgba(245,200,66,.25)}
.dc3-btn-gold{background:rgba(245,200,66,.13);border:1px solid rgba(245,200,66,.35)!important;color:var(--gold)}
.dc3-btn-gold:hover{background:rgba(245,200,66,.22)}
.dc3-btn-primary{background:var(--teal);color:var(--bg)}
.dc3-btn-primary:hover{filter:brightness(1.1)}

/* VITALS BAR */
.dc3-vbar{height:38px;background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:8px;flex-shrink:0;overflow-x:auto}
.dc3-vbar::-webkit-scrollbar{display:none}
.dc3-vname{font-family:'Playfair Display',serif;font-size:13px;color:var(--txt);font-weight:600;white-space:nowrap}
.dc3-vmeta{font-size:11px;color:var(--txt3);white-space:nowrap}
.dc3-vdiv{width:1px;height:18px;background:var(--border);flex-shrink:0}
.dc3-vital{display:flex;align-items:center;gap:3px;font-size:11px;white-space:nowrap}
.dc3-vital .lbl{color:var(--txt4);font-size:8.5px;text-transform:uppercase;letter-spacing:.04em}
.dc3-vital .val{font-family:'JetBrains Mono',monospace;color:var(--txt2);font-weight:600}
.dc3-vital-inline{display:inline-flex;align-items:baseline;gap:3px;font-size:11px;white-space:nowrap;margin-left:8px}
.dc3-vital-inline .lbl{color:var(--txt4);font-size:8.5px;text-transform:uppercase;letter-spacing:.04em}
.dc3-vital-inline .val{font-family:'JetBrains Mono',monospace;color:var(--txt2);font-weight:600;font-size:12px}
.dc3-vital-val-cc{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;color:var(--orange);margin-left:4px;white-space:nowrap}
/* body */
.dc3-body{display:flex;flex:1;overflow:hidden}
/* sidebar */
.dc3-sb{flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dc3-sb.open{width:230px}
.dc3-sb.collapsed{width:36px}
.dc3-sb-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dc3-sb.collapsed .dc3-sb-tab{display:flex}
.dc3-sb.collapsed .dc3-sb-inner{display:none}
.dc3-sb-tab-lbl{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none;transition:color .15s}
.dc3-sb-tab:hover .dc3-sb-tab-lbl{color:var(--teal)}
.dc3-sb-inner{overflow-y:auto;flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:5px;min-width:0}
.dc3-sb-inner::-webkit-scrollbar{width:3px}
.dc3-sb-inner::-webkit-scrollbar-thumb{background:var(--border)}
.dc3-sb-toggle{width:28px;height:28px;border-radius:7px;margin-left:auto;flex-shrink:0;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:18px;font-weight:700;color:var(--txt2);line-height:1}
.dc3-sb-toggle:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dc3-sb-lbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:4px}
.dc3-sb-nav{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2)}
.dc3-sb-nav:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt)}
.dc3-sb-nav.active{background:rgba(0,229,192,.09);border-color:rgba(0,229,192,.3);color:var(--teal)}
.dc3-sb-icon{font-size:14px;width:18px;text-align:center}
.dc3-sb-dot{width:7px;height:7px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0}
.dc3-sb-dot.done{background:var(--teal);box-shadow:0 0 6px rgba(0,229,192,.5)}
.dc3-sb-divider{height:1px;background:var(--border);margin:6px 0}
.dc3-sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:11px 12px;margin-bottom:4px}
/* content */
.dc3-content{flex:1;overflow-y:auto;padding:16px 20px 50px;display:flex;flex-direction:column;gap:16px}
.dc3-content::-webkit-scrollbar{width:4px}
.dc3-content::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
/* AI panel */
.dc3-ai{flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dc3-ai.open{width:295px}
.dc3-ai.collapsed{width:36px}
.dc3-ai-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dc3-ai.collapsed .dc3-ai-tab{display:flex}
.dc3-ai.collapsed .dc3-ai-inner{display:none}
.dc3-ai-tab-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);animation:dc3-pulse 2s ease-in-out infinite;flex-shrink:0}
.dc3-ai-tab-lbl{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none;transition:color .15s}
.dc3-ai-tab:hover .dc3-ai-tab-lbl{color:var(--teal)}
@keyframes dc3-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
.dc3-ai-inner{display:flex;flex-direction:column;flex:1;overflow:hidden;min-width:0}
.dc3-ai-hdr{padding:11px 13px;border-bottom:1px solid var(--border);flex-shrink:0}
.dc3-ai-hrow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.dc3-ai-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);flex-shrink:0;animation:dc3-pulse 2s ease-in-out infinite}
.dc3-ai-lbl{font-size:12px;font-weight:600;color:var(--txt2);flex:1}
.dc3-ai-model{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3)}
.dc3-ai-toggle{width:28px;height:28px;border-radius:7px;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:18px;font-weight:700;color:var(--txt2);line-height:1}
.dc3-ai-toggle:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dc3-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.dc3-ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;transition:all .15s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);font-family:'DM Sans',sans-serif}
.dc3-ai-qbtn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.06)}
.dc3-ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.dc3-ai-msgs::-webkit-scrollbar{width:3px}
.dc3-ai-msgs::-webkit-scrollbar-thumb{background:var(--border)}
.dc3-ai-msg{padding:9px 11px;border-radius:var(--r);font-size:12px;line-height:1.55}
.dc3-ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border)}
.dc3-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2)}
.dc3-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt)}
.dc3-ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
.dc3-ai-loader span{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:dc3-bounce 1.2s ease-in-out infinite}
.dc3-ai-loader span:nth-child(2){animation-delay:.2s}.dc3-ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes dc3-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.dc3-ai-inp-wrap{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:6px}
.dc3-ai-inp{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
.dc3-ai-inp:focus{border-color:var(--teal)}
.dc3-ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;font-weight:700}
/* sections */
.dc3-sec{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.dc3-sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.dc3-sec-icon{font-size:18px}
.dc3-sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--txt)}
.dc3-sec-sub{font-size:11px;color:var(--txt3);margin-top:1px}
/* fields */
.dc3-field{display:flex;flex-direction:column;gap:4px}
.dc3-flbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em}
.dc3-inp{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%}
.dc3-inp:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.07)}
.dc3-ta{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:9px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:80px;width:100%;line-height:1.6;transition:border-color .15s}
.dc3-ta:focus{border-color:var(--blue)}
.dc3-sel{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%}
.dc3-sel:focus{border-color:var(--blue)}
.dc3-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dc3-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
/* disposition */
.dc3-disp-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
.dc3-disp-card{background:var(--bg-card);border:2px solid var(--border);border-radius:14px;padding:14px 8px 12px;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;user-select:none}
.dc3-disp-card:hover{border-color:var(--border-hi);background:var(--bg-up);transform:translateY(-1px)}
.dc3-disp-card.sel-home{border-color:var(--teal)!important;background:rgba(0,229,192,.07)!important;box-shadow:0 0 0 1px rgba(0,229,192,.25),0 6px 24px rgba(0,229,192,.18);transform:translateY(-2px)}
.dc3-disp-card.sel-floor{border-color:var(--blue)!important;background:rgba(59,158,255,.07)!important;box-shadow:0 0 0 1px rgba(59,158,255,.25),0 6px 24px rgba(59,158,255,.15);transform:translateY(-2px)}
.dc3-disp-card.sel-telem{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dc3-disp-card.sel-icu{border-color:var(--coral)!important;background:rgba(255,107,107,.07)!important;transform:translateY(-2px)}
.dc3-disp-card.sel-obs{border-color:var(--purple)!important;background:rgba(155,109,255,.07)!important;transform:translateY(-2px)}
.dc3-disp-card.sel-tx{border-color:var(--orange)!important;background:rgba(255,159,67,.07)!important;transform:translateY(-2px)}
.dc3-disp-card.sel-ama{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dc3-disp-card.sel-expired{border-color:var(--txt4)!important;background:rgba(46,74,106,.15)!important;transform:translateY(-2px)}
.dc3-disp-emoji{font-size:28px;line-height:1}
.dc3-disp-name{font-size:12px;font-weight:700;color:var(--txt);line-height:1.2;transition:color .18s}
.dc3-disp-sub{font-size:10px;color:var(--txt3);line-height:1.3}
.dc3-banner{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:var(--r);margin-top:12px;border:1px solid;font-size:12px;font-weight:600}
/* em cards */
.dc3-em-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:13px 15px;transition:all .15s;cursor:pointer;position:relative;overflow:hidden}
.dc3-em-card:hover{border-color:var(--border-hi)}
.dc3-em-card.sel{border-color:var(--blue);background:rgba(59,158,255,.07)}
.dc3-em-card.sel::after{content:'✓';position:absolute;top:8px;right:10px;color:var(--blue);font-size:14px;font-weight:700}
.dc3-em-lvl{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--txt);line-height:1}
.dc3-em-code{font-size:11px;color:var(--txt3);font-family:'JetBrains Mono',monospace;margin-top:2px}
.dc3-em-desc{font-size:11px;color:var(--txt2);margin-top:6px;line-height:1.4}
.dc3-em-time{font-size:10px;color:var(--txt4);margin-top:4px;font-family:'JetBrains Mono',monospace}
.dc3-em-badge{font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;margin-top:5px;display:inline-block}
.dc3-c-low{background:rgba(0,229,192,.12);color:var(--teal)}
.dc3-c-mod{background:rgba(245,200,66,.12);color:var(--gold)}
.dc3-c-high{background:rgba(255,107,107,.12);color:var(--coral)}
.dc3-c-crit{background:rgba(155,109,255,.12);color:var(--purple)}
.dc3-mdm-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-up);border-radius:var(--r);margin-bottom:6px}
/* rows */
.dc3-row{display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:10px 13px;margin-bottom:6px;transition:border-color .15s}
.dc3-row:hover{border-color:var(--border-hi)}
.dc3-row-inp{background:transparent;border:none;outline:none;font-size:12px;color:var(--txt2);font-family:'DM Sans',sans-serif;flex:1;min-width:0}
.dc3-row-del{color:var(--txt4);cursor:pointer;font-size:15px;transition:color .15s;background:none;border:none;padding:0 2px}
.dc3-row-del:hover{color:var(--coral)}
.dc3-chip{font-size:10px;padding:2px 8px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-weight:600}
.dc3-chip-urg{background:rgba(255,107,107,.15);color:var(--coral)}
.dc3-chip-rtn{background:rgba(0,229,192,.12);color:var(--teal)}
.dc3-add-row{display:flex;gap:6px;align-items:center;margin-top:8px}
.dc3-add-inp{flex:1;background:var(--bg-up);border:1px dashed var(--border);border-radius:var(--r);padding:7px 11px;color:var(--txt);font-size:12px;outline:none;font-family:'DM Sans',sans-serif}
.dc3-add-inp:focus{border-style:solid;border-color:var(--blue)}
.dc3-add-inp::placeholder{color:var(--txt4)}
/* return cards */
.dc3-ret-card{background:rgba(255,107,107,.05);border:1px solid rgba(255,107,107,.22);border-radius:var(--r);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;transition:all .15s}
.dc3-ret-card:hover{background:rgba(255,107,107,.09);border-color:rgba(255,107,107,.35)}
/* sig */
.dc3-sig{background:linear-gradient(135deg,rgba(0,229,192,.06),rgba(59,158,255,.04));border:1px solid rgba(0,229,192,.2);border-radius:var(--rl);padding:18px 20px}
.dc3-sig-line{height:1px;background:rgba(0,229,192,.2);margin:12px 0}
/* instr */
.dc3-instr-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;margin-bottom:10px}
.dc3-instr-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid var(--border)}
/* badge */
.dc3-bdg{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;display:inline-block}
.dc3-bdg-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.dc3-bdg-blue{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}
.dc3-bdg-gold{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}
.dc3-bdg-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3)}
.dc3-bdg-purple{background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3)}
.dc3-spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(0,229,192,.2);border-top-color:var(--teal);border-radius:50%;animation:dc3-spinr .6s linear infinite}
@keyframes dc3-spinr{to{transform:rotate(360deg)}}
.dc3-shimmer{background:linear-gradient(90deg,var(--bg-up) 25%,rgba(0,229,192,.06) 50%,var(--bg-up) 75%);background-size:200% 100%;animation:dc3-shim 1.5s infinite;border-radius:var(--r);height:120px}
@keyframes dc3-shim{0%{background-position:200% 0}100%{background-position:-200% 0}}
/* CC section */
.dc3-cc-accent{background:linear-gradient(135deg,rgba(255,107,107,.1),rgba(155,109,255,.06));border:1px solid rgba(255,107,107,.28);border-radius:var(--rl);padding:16px 20px;margin-bottom:12px}
.dc3-cc-lbl{font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.dc3-organ-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.dc3-organ-chip{display:flex;align-items:center;gap:7px;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;cursor:pointer;transition:all .15s;user-select:none}
.dc3-organ-chip:hover{border-color:var(--border-hi)}
.dc3-organ-chip.active{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.4)}
.dc3-organ-chip.active .dc3-organ-chk{background:var(--coral);border-color:var(--coral)}
.dc3-organ-chk{width:15px;height:15px;border-radius:3px;border:1.5px solid var(--border);background:var(--bg-card);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:var(--bg);transition:all .15s}
.dc3-organ-lbl{font-size:12px;color:var(--txt2);font-weight:500}
.dc3-organ-chip.active .dc3-organ-lbl{color:var(--coral);font-weight:600}
.dc3-sev-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.dc3-sev-btn{flex:1;min-width:110px;padding:10px 8px;border-radius:var(--r);border:1.5px solid var(--border);background:var(--bg-up);text-align:center;cursor:pointer;transition:all .15s;user-select:none}
.dc3-sev-btn.active-imm{border-color:var(--coral);background:rgba(255,107,107,.12)}
.dc3-sev-btn.active-life{border-color:var(--orange);background:rgba(255,159,67,.1)}
.dc3-sev-btn.active-org{border-color:var(--gold);background:rgba(245,200,66,.1)}
.dc3-sev-btn-lbl{font-size:11px;font-weight:700}
.dc3-sev-btn-sub{font-size:10px;color:var(--txt3);margin-top:2px}
.active-imm .dc3-sev-btn-lbl{color:var(--coral)}
.active-life .dc3-sev-btn-lbl{color:var(--orange)}
.active-org .dc3-sev-btn-lbl{color:var(--gold)}
.dc3-attest{background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.2);border-radius:var(--r);padding:12px 14px;font-size:12px;line-height:1.65;color:var(--txt2)}
.dc3-attest strong{color:var(--teal)}
.dc3-cc-ai-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:linear-gradient(135deg,rgba(255,107,107,.18),rgba(155,109,255,.12));border:1px solid rgba(255,107,107,.4);border-radius:var(--r);color:var(--coral);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.dc3-cc-ai-btn:hover{filter:brightness(1.1)}
.dc3-cc-ai-btn:disabled{opacity:.5;cursor:wait}
.dc3-cc-time-strip{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;margin-top:12px}
.dc3-cc-time-lbl{font-size:9px;color:var(--txt4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.dc3-cc-time-val{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--coral);line-height:1}
.dc3-cc-time-note{font-size:10px;color:var(--txt3);margin-top:2px}
.dc3-addon-track{display:flex;align-items:center;gap:8px;background:rgba(155,109,255,.08);border:1px solid rgba(155,109,255,.25);border-radius:var(--r);padding:6px 10px}
.dc3-addon-ctrl{width:26px;height:26px;border-radius:6px;border:1px solid rgba(155,109,255,.3);background:rgba(155,109,255,.12);color:var(--purple);font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dc3-addon-ctrl:hover{background:rgba(155,109,255,.25)}
.dc3-addon-cnt{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:var(--purple);min-width:24px;text-align:center}
`;

const DISPS = [
  {id:'home', cls:'sel-home', icon:'🏠', label:'Discharge Home', sub:'Patient may safely return home', bannerStyle:{background:'rgba(0,229,192,.07)',borderColor:'rgba(0,229,192,.25)',color:'#00e5c0'}, text:'Patient discharged home in stable condition.', textSub:'Instructions reviewed and signed.'},
  {id:'floor', cls:'sel-floor', icon:'🏥', label:'Admit — Floor', sub:'General medical/surgical floor', bannerStyle:{background:'rgba(59,158,255,.07)',borderColor:'rgba(59,158,255,.25)',color:'#3b9eff'}, text:'Patient admitted to general floor.', textSub:'Admitting orders placed.'},
  {id:'telem', cls:'sel-telem', icon:'📡', label:'Admit — Telemetry', sub:'Continuous cardiac monitoring', bannerStyle:{background:'rgba(245,200,66,.07)',borderColor:'rgba(245,200,66,.2)',color:'#f5c842'}, text:'Patient admitted to telemetry.', textSub:'Cardiac monitoring initiated.'},
  {id:'icu', cls:'sel-icu', icon:'🚨', label:'Admit — ICU', sub:'Critical care — high acuity', bannerStyle:{background:'rgba(255,107,107,.07)',borderColor:'rgba(255,107,107,.25)',color:'#ff6b6b'}, text:'Patient admitted to the ICU.', textSub:'ICU team bedside.'},
  {id:'obs', cls:'sel-obs', icon:'🔭', label:'Observation', sub:'Hospital outpatient status <48h', bannerStyle:{background:'rgba(155,109,255,.07)',borderColor:'rgba(155,109,255,.2)',color:'#9b6dff'}, text:'Patient in observation status.', textSub:'Expected stay < 48 hours.'},
  {id:'tx', cls:'sel-tx', icon:'🚑', label:'Transfer', sub:'Higher level / specialty facility', bannerStyle:{background:'rgba(255,159,67,.07)',borderColor:'rgba(255,159,67,.2)',color:'#ff9f43'}, text:'Patient transferred to receiving facility.', textSub:'Accepting physician confirmed.'},
  {id:'ama', cls:'sel-ama', icon:'⚠️', label:'AMA', sub:'Against Medical Advice', bannerStyle:{background:'rgba(245,200,66,.07)',borderColor:'rgba(245,200,66,.2)',color:'#f5c842'}, text:'Patient leaving AMA.', textSub:'Risks explained. AMA form signed.'},
  {id:'expired', cls:'sel-expired', icon:'🕯️', label:'Expired', sub:'Patient expired in ED', bannerStyle:{background:'rgba(46,74,106,.15)',borderColor:'rgba(74,106,138,.3)',color:'#4a6a8a'}, text:'Patient expired in the ED.', textSub:'Time of death documented.'},
];

const EM_CARDS = [
  {code:'99281',level:'L1',desc:'Self-limited or minor problem.',time:'≤ 15 min',cx:'dc3-c-low',cxl:'MINIMAL'},
  {code:'99282',level:'L2',desc:'Low complexity. New/established condition.',time:'16–25 min',cx:'dc3-c-low',cxl:'LOW'},
  {code:'99283',level:'L3',desc:'Moderate complexity. Multiple problems.',time:'26–35 min',cx:'dc3-c-mod',cxl:'MODERATE'},
  {code:'99284',level:'L4',desc:'High complexity. High risk.',time:'36–45 min',cx:'dc3-c-high',cxl:'HIGH'},
  {code:'99285',level:'L5',desc:'Immediate threat to life or function.',time:'46–60 min',cx:'dc3-c-crit',cxl:'HIGHEST'},
  {code:'99291',level:'Critical',desc:'Critical care, first 30–74 min.',time:'30–74 min (+99292/30min)',cx:'dc3-c-crit',cxl:'CRITICAL CARE',color:'#ff6b6b'},
  {code:'99285-25',level:'L5+Proc',desc:'Level 5 with significant procedure.',time:'Modifier -25 required',cx:'dc3-c-crit',cxl:'L5+PROC',color:'#9b6dff'},
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
  {icon:'🫀',strong:'Chest pain, pressure, or tightness',rest:' that is new, returns, worsens, or radiates — call 911 immediately.'},
  {icon:'😵',strong:'Sudden severe headache',rest:', face drooping, arm weakness, or difficulty speaking — call 911.'},
  {icon:'🌬️',strong:'Shortness of breath',rest:' at rest, difficulty breathing, or oxygen below 94%.'},
  {icon:'💓',strong:'Rapid, irregular, or pounding heartbeat',rest:' with dizziness, fainting, or near-fainting.'},
  {icon:'😰',strong:'Severe sweating, nausea, or vomiting',rest:' with chest discomfort.'},
  {icon:'🩸',strong:'Blood sugar < 70 mg/dL',rest:' not responding to treatment, or > 400 mg/dL.'},
  {icon:'😟',strong:'Any other symptom',rest:' that feels severe, sudden, or different from usual.'},
];

const now = new Date();
const pad = n => String(n).padStart(2,'0');
const todayDate = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()}`;
const todayTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default function DischargePlanningWrapper({ patientName='New Patient', patientDob='', patientId='', medications=[], allergies=[] }) {
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

  const [dcRxList, setDcRxList] = useState(() =>
    medications.length ? medications.map((m,i)=>({id:`m${i}`,drug:m,sig:'Continue as prescribed',type:'CONTINUE'}))
    : [
      {id:'r1',drug:'Aspirin 81mg',sig:'Take 1 tablet by mouth once daily',type:'CONTINUE'},
      {id:'r2',drug:'Nitroglycerin 0.4mg SL',sig:'Place 1 tablet under tongue every 5 min for chest pain. Call 911 if no relief.',type:'NEW'},
    ]
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

  // CC critical care fields
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

  const [aiMsgs, setAiMsgs] = useState([{role:'sys',text:'Notrya AI Discharge Advisor ready. Select disposition to begin, then use quick actions to auto-generate instructions, E&M level, and return precautions.'}]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiMsgsRef = useRef(null);

  useEffect(()=>{ if(aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight; },[aiMsgs,aiLoading]);

  const setDot = (id, done) => setDots(p=>({...p,[id]:done}));
  const appendMsg = (role,text) => setAiMsgs(p=>[...p,{role,text}]);

  const buildCtx = () =>
    `Patient: ${patientName} | DOB: ${patientDob||'—'} | MRN: ${patientId||'—'} | Allergies: ${allergies.join(', ')||'NKDA'} | Meds: ${medications.join(', ')||'See list'} | Disposition: ${selDisp||'Not set'} | E&M: ${selEM||'Not selected'}`;

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    appendMsg('user', question);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an expert emergency medicine physician helping with discharge documentation. Be concise and clinical.\n\nContext: ${buildCtx()}\n\nQuestion: ${question}`,
      });
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
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a complete Critical Care (CPT 99291) note for: ${buildCtx()}. Include: critical condition justification, organ systems involved, interventions performed, clinical impression, and attestation.`,
      });
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
    appendMsg('bot',`✅ Discharge summary signed and finalized for ${patientName}.\n\nDisposition: ${selDisp} · E&M: ${selEM||'Not selected'}\n\nDischarge papers are ready to print.`);
    setSaving(false);
  };

  const addDx = () => {
    if(!newDxName.trim()) return;
    setDxList(p=>[...p,{id:Date.now(),order:`${p.length+1}°`,code:newDxCode,name:newDxName,primary:false}]);
    setNewDxCode(''); setNewDxName('');
    setDot('dx',true);
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

  const scrollTo = id => document.getElementById(`dc3-sec-${id}`)?.scrollIntoView({behavior:'smooth',block:'start'});

  const typeColor={NEW:'rgba(155,109,255,.15)',CONTINUE:'rgba(59,158,255,.15)',CHANGED:'rgba(245,200,66,.15)',STOP:'rgba(255,107,107,.15)'};
  const typeTextColor={NEW:'#9b6dff',CONTINUE:'#3b9eff',CHANGED:'#f5c842',STOP:'#ff6b6b'};
  const typeIcon={NEW:'🆕',CONTINUE:'🔵',CHANGED:'🔄',STOP:'❌'};
  const selDispObj = DISPS.find(d=>d.id===selDisp);

  const ORGAN_LIST = ['Cardiovascular','Respiratory','Neurological','Renal','Hepatic','Hematologic','Metabolic / Endocrine','Infectious / Sepsis'];
  const ORGAN_ICONS = ['🫀','🫁','🧠','🫘','🟤','🩸','⚗️','🦠'];
  const INTERV_LIST = ['Intubation / RSI','Mechanical Ventilation','Vasopressors','CPR / ACLS','Central Line','Arterial Line','Cardioversion','MTP / Blood Products','Hemodynamic Monitor','Sedation/Analgesia','Chest Tube','POCUS'];

  const toggleOrgan = (item, list, setList) => {
    setList(p => p.includes(item) ? p.filter(x=>x!==item) : [...p, item]);
  };

  return (
    <div className="dc3-root">
      <style>{CSS}</style>

      {/* TOP NAVBAR */}
      <div className="dc3-topnav">
        <div className="dc3-topnav-avatar">N.</div>
        <span className="dc3-topnav-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span>
        <div className="dc3-topnav-sep"/>
        <div className="dc3-stat"><span className="dc3-stat-val">7</span><span className="dc3-stat-lbl">Active Patients</span></div>
        <div className="dc3-stat"><span className="dc3-stat-val alert">14</span><span className="dc3-stat-lbl">Notes Pending</span></div>
        <div className="dc3-stat"><span className="dc3-stat-val">3</span><span className="dc3-stat-lbl">Orders Queue</span></div>
        <div className="dc3-stat"><span className="dc3-stat-val">11.6</span><span className="dc3-stat-lbl">Shift Hours</span></div>
        <div className="dc3-topnav-right">
          <div className="dc3-specialty-btn">Emergency Medicine <span style={{color:'var(--txt4)'}}>▾</span></div>
          <div className="dc3-time-chip">{new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})} ↑</div>
          <div className="dc3-ai-chip"><div className="dc3-ai-chip-dot"/> AI ON</div>
          <button className="dc3-newpt-btn">+ New Patient</button>
        </div>
      </div>

      {/* SUB-NAVBAR */}
      <div className="dc3-subnav">
        <span className="dc3-logo">notrya</span>
        <span className="dc3-sep">|</span>
        <span className="dc3-title">Discharge Summary</span>
        <span className="dc3-badge">DC-01</span>
        <div className="dc3-snr">
          <button className="dc3-btn dc3-btn-ghost" onClick={()=>window.print()}>🖨 Print</button>
          <button className="dc3-btn dc3-btn-ghost" onClick={()=>sendAI('Generate a complete patient-friendly discharge letter.')}>📄 Generate Patient Letter</button>
          <button className="dc3-btn dc3-btn-em" onClick={()=>sendAI('Suggest the optimal E&M level and document the MDM reasoning using 2021 AMA guidelines.')}>🧮 Suggest E&M</button>
          <button className="dc3-btn dc3-btn-primary" onClick={finalizeDischarge} disabled={saving}>
            {saving?<><span className="dc3-spin"/> Signing…</>:'✍ Finalize & Sign'}
          </button>
        </div>
      </div>

      {/* VITALS BAR */}
      <div className="dc3-vbar">
        <span className="dc3-vname">{patientName},</span>
        <span className="dc3-vmeta">62 yo F · DOB {patientDob||'04/22/1962'} · MRN {patientId||'00847291'}</span>
        <div className="dc3-vdiv"/>
        <span className="dc3-vmeta">CC</span><span className="dc3-vital-val-cc">Chest Pain</span>
        <span className="dc3-vital-inline"><span className="lbl">BP</span> <span className="val">138/86</span></span>
        <span className="dc3-vital-inline"><span className="lbl">HR</span> <span className="val">88</span></span>
        <span className="dc3-vital-inline"><span className="lbl">SPO</span> <span className="val">97%</span></span>
        <span className="dc3-vital-inline"><span className="lbl">TEMP</span> <span className="val">98.4°F</span></span>
        <span className="dc3-vital-inline"><span className="lbl">LOS</span> <span className="val">4h 32m</span></span>
        <div style={{marginLeft:'auto'}}>
          <span className={`dc3-bdg ${dcStatus==='SIGNED'?'dc3-bdg-teal':'dc3-bdg-gold'}`}>{dcStatus}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="dc3-body">

        {/* SIDEBAR */}
        <aside className={`dc3-sb ${sbOpen?'open':'collapsed'}`}>
          <div className="dc3-sb-tab" onClick={()=>setSbOpen(true)}>
            <span style={{fontSize:15,color:'#4a6a8a'}}>☰</span>
            <span className="dc3-sb-tab-lbl">Discharge Summary</span>
            <span style={{fontSize:22,fontWeight:700,color:'#00e5c0',lineHeight:1}}>›</span>
          </div>
          <div className="dc3-sb-inner">
            <div className="dc3-sb-card">
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6}}>
                <div style={{minWidth:0}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:'#e8f0fe'}}>{patientName}</div>
                  <div style={{fontSize:11,color:'#4a6a8a',marginTop:3}}>{patientId?`MRN ${patientId}`:''}</div>
                  <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>
                    {selDispObj && <span className="dc3-bdg dc3-bdg-teal" style={{fontSize:9.5}}>{selDispObj.label}</span>}
                  </div>
                </div>
                <div className="dc3-sb-toggle" onClick={()=>setSbOpen(false)}>‹</div>
              </div>
            </div>
            <div className="dc3-sb-lbl">Sections</div>
            {NAV_SECTIONS.map(s=>(
              <div key={s.id} className="dc3-sb-nav" onClick={()=>scrollTo(s.id)}>
                <span className="dc3-sb-icon">{s.icon}</span>{s.label}
                <span className={`dc3-sb-dot${dots[s.id]?' done':''}`}/>
              </div>
            ))}
            <div className="dc3-sb-divider"/>
            <div className="dc3-sb-lbl">Visit Summary</div>
            <div className="dc3-sb-card" style={{marginBottom:0}}>
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
        <main className="dc3-content">

          {/* DISPOSITION */}
          <div className="dc3-sec" id="dc3-sec-disp">
            <div className="dc3-sec-hdr">
              <span className="dc3-sec-icon">🚪</span>
              <div><div className="dc3-sec-title">Select Disposition</div><div className="dc3-sec-sub">Patient's final disposition from the Emergency Department</div></div>
            </div>
            <div style={{fontSize:11,color:'#4a6a8a',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:600,marginBottom:12}}>SELECT DISPOSITION</div>
            <div className="dc3-disp-grid">
              {DISPS.map(d=>(
                <div key={d.id} className={`dc3-disp-card${selDisp===d.id?' '+d.cls:''}`} onClick={()=>{setSelDisp(d.id);setDot('disp',true);}}>
                  <span className="dc3-disp-emoji">{d.icon}</span>
                  <div className="dc3-disp-name" style={selDisp===d.id?{color:d.bannerStyle.color}:{}}>{d.label}</div>
                  <div className="dc3-disp-sub">{d.sub}</div>
                </div>
              ))}
            </div>
            {selDispObj && (
              <div className="dc3-banner" style={{...selDispObj.bannerStyle}}>
                <span style={{fontSize:20}}>{selDispObj.icon}</span>
                <div><div style={{fontWeight:700,fontSize:12}}>{selDispObj.text}</div><div style={{fontSize:11,opacity:.8,marginTop:2}}>{selDispObj.textSub}</div></div>
                <button style={{marginLeft:'auto',background:'none',border:'none',color:'#4a6a8a',cursor:'pointer',fontSize:16}} onClick={()=>setSelDisp(null)}>✕</button>
              </div>
            )}
            {selDisp&&['floor','telem','icu','obs'].includes(selDisp) && (
              <div className="dc3-grid3" style={{marginTop:14}}>
                <div className="dc3-field"><label className="dc3-flbl">Admitting Service</label><input className="dc3-inp" value={admitService} onChange={e=>setAdmitService(e.target.value)} placeholder="e.g. Cardiology…"/></div>
                <div className="dc3-field"><label className="dc3-flbl">Admitting Physician</label><input className="dc3-inp" value={admitMD} onChange={e=>setAdmitMD(e.target.value)} placeholder="Dr. Name"/></div>
                <div className="dc3-field"><label className="dc3-flbl">Bed / Unit</label><input className="dc3-inp" value={admitBed} onChange={e=>setAdmitBed(e.target.value)} placeholder="e.g. 4W-412"/></div>
              </div>
            )}
            {selDisp==='tx' && (
              <div className="dc3-grid2" style={{marginTop:14}}>
                <div className="dc3-field"><label className="dc3-flbl">Receiving Facility</label><input className="dc3-inp" value={txFacility} onChange={e=>setTxFacility(e.target.value)} placeholder="Facility name…"/></div>
                <div className="dc3-field"><label className="dc3-flbl">Reason for Transfer</label><input className="dc3-inp" value={txReason} onChange={e=>setTxReason(e.target.value)} placeholder="Higher level of care…"/></div>
                <div className="dc3-field"><label className="dc3-flbl">Accepting Physician</label><input className="dc3-inp" value={txMD} onChange={e=>setTxMD(e.target.value)} placeholder="Dr. Name"/></div>
                <div className="dc3-field"><label className="dc3-flbl">Transport Mode</label>
                  <select className="dc3-sel" value={txMode} onChange={e=>setTxMode(e.target.value)}>
                    {['ALS Ambulance','BLS Ambulance','Air Transport','Private Vehicle'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* E&M CODING */}
          <div className="dc3-sec" id="dc3-sec-em">
            <div className="dc3-sec-hdr">
              <span className="dc3-sec-icon">🧮</span>
              <div><div className="dc3-sec-title">Evaluation &amp; Management (E&M) Coding</div><div className="dc3-sec-sub">Select appropriate level · 2021 AMA guidelines · Medical Decision Making</div></div>
              <button className="dc3-btn dc3-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('Suggest the most appropriate E&M level and document the MDM reasoning using 2021 AMA E&M guidelines.')}>✨ AI Suggest Level</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:10}}>
              {EM_CARDS.slice(0,5).map(e=>(
                <div key={e.code} className={`dc3-em-card${selEM===e.code?' sel':''}`} onClick={()=>{setSelEM(e.code);setDot('em',true);setShowCC(e.code==='99291');}}>
                  <div className="dc3-em-lvl" style={e.color?{color:e.color}:{}}>{e.level}</div>
                  <div className="dc3-em-code">{e.code}</div>
                  <div className="dc3-em-desc">{e.desc}</div>
                  <div className="dc3-em-time">{e.time}</div>
                  <span className={`dc3-em-badge ${e.cx}`}>{e.cxl}</span>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {EM_CARDS.slice(5).map(e=>(
                <div key={e.code} className={`dc3-em-card${selEM===e.code?' sel':''}`} onClick={()=>{setSelEM(e.code);setDot('em',true);setShowCC(e.code==='99291');}}>
                  <div className="dc3-em-lvl" style={e.color?{color:e.color}:{}}>{e.level}</div>
                  <div className="dc3-em-code">{e.code}</div>
                  <div className="dc3-em-desc">{e.desc}</div>
                  <div className="dc3-em-time">{e.time}</div>
                  <span className={`dc3-em-badge ${e.cx}`}>{e.cxl}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:'#4a6a8a',textTransform:'uppercase',letterSpacing:'.05em',fontWeight:700,marginBottom:8}}>Medical Decision Making (MDM)</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                {lbl:'Number & Complexity of Problems',val:mdmProblems,set:setMdmProblems,opts:['1 self-limited / minor problem','1 stable chronic illness','2+ stable chronic illnesses','1 undiagnosed new problem with uncertain prognosis','1 acute illness with systemic symptoms','1 acute or chronic illness with threat to life or bodily function']},
                {lbl:'Amount & Complexity of Data Reviewed',val:mdmData,set:setMdmData,opts:['Minimal / none','Limited — order/review test(s), external notes','Moderate — independent interpretation of results','Extensive — independent interpretation + discussion with specialist']},
                {lbl:'Risk of Complications / Morbidity or Mortality',val:mdmRisk,set:setMdmRisk,opts:['Minimal — OTC medications, minor surgery','Low — Rx drug mgmt, procedure with no identified risk','Moderate — Prescription drug mgmt, minor surgery with identified risk','High — Drug therapy requiring intensive monitoring, elective major surgery']},
              ].map(({lbl,val,set,opts})=>(
                <div key={lbl} className="dc3-mdm-row">
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#8aaccc',marginBottom:6}}>{lbl}</div>
                    <select className="dc3-sel" value={val} onChange={e=>set(e.target.value)}>
                      <option value="">— Select —</option>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <div className="dc3-field"><label className="dc3-flbl">MDM Narrative</label><textarea className="dc3-ta" rows={3} value={mdmNarrative} onChange={e=>setMdmNarrative(e.target.value)} placeholder="Document clinical decision-making rationale…"/></div>
              <div className="dc3-grid3">
                <div className="dc3-field"><label className="dc3-flbl">Total Encounter Time</label><input className="dc3-inp" value={emTime} onChange={e=>setEmTime(e.target.value)} placeholder="e.g. 45 min"/></div>
                <div className="dc3-field"><label className="dc3-flbl">Provider Time (face-to-face)</label><input className="dc3-inp" value={emFaceTime} onChange={e=>setEmFaceTime(e.target.value)} placeholder="e.g. 30 min"/></div>
                <div className="dc3-field"><label className="dc3-flbl">Procedure CPT (if any)</label><input className="dc3-inp" value={emProcCpt} onChange={e=>setEmProcCpt(e.target.value)} placeholder="e.g. 93010 EKG"/></div>
              </div>
            </div>
          </div>

          {/* CRITICAL CARE NOTE */}
          {showCC && (
            <div className="dc3-sec" id="dc3-sec-cc" style={{animation:'dc3-ccin .35s cubic-bezier(.4,0,.2,1)'}}>
              <style>{`@keyframes dc3-ccin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <div className="dc3-cc-accent">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                      <span style={{fontSize:22}}>🚨</span>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#e8f0fe'}}>Critical Care Note</div>
                      <span style={{display:'inline-flex',alignItems:'center',background:'rgba(255,107,107,.14)',border:'1px solid rgba(255,107,107,.35)',borderRadius:6,padding:'4px 12px',fontSize:11,fontWeight:700,color:'#ff6b6b',letterSpacing:'.05em',textTransform:'uppercase'}}>CPT 99291</span>
                      <span className="dc3-bdg dc3-bdg-coral" style={{fontSize:10}}>HIGH COMPLEXITY</span>
                    </div>
                    <div style={{fontSize:12,color:'#4a6a8a'}}>Direct physician care of a critically ill/injured patient — first 30–74 minutes.</div>
                  </div>
                  <button className="dc3-cc-ai-btn" style={{marginLeft:'auto'}} onClick={generateCCNote} disabled={aiLoading}>✨ AI Generate Note</button>
                </div>
                <div className="dc3-cc-time-strip">
                  <div><div className="dc3-cc-time-lbl">CC Start Time</div><input type="time" className="dc3-inp" value={ccStart} onChange={e=>setCcStart(e.target.value)} style={{fontFamily:'monospace',fontSize:14,fontWeight:700,color:'#ff6b6b'}}/><div className="dc3-cc-time-note">Time at bedside</div></div>
                  <div><div className="dc3-cc-time-lbl">CC End Time</div><input type="time" className="dc3-inp" value={ccEnd} onChange={e=>setCcEnd(e.target.value)} style={{fontFamily:'monospace',fontSize:14,fontWeight:700,color:'#ff6b6b'}}/><div className="dc3-cc-time-note">Time left bedside</div></div>
                  <div><div className="dc3-cc-time-lbl">Total CC Time</div><div className="dc3-cc-time-val">{calcCCTime(ccStart,ccEnd)}</div><div className="dc3-cc-time-note">Must be ≥ 30 min for 99291</div></div>
                  <div><div className="dc3-cc-time-lbl">99292 Add-On Units</div>
                    <div className="dc3-addon-track" style={{marginTop:4}}>
                      <button className="dc3-addon-ctrl" onClick={()=>setCcAddon(p=>Math.max(0,p-1))}>−</button>
                      <div className="dc3-addon-cnt">{ccAddon}</div>
                      <button className="dc3-addon-ctrl" onClick={()=>setCcAddon(p=>p+1)}>+</button>
                      <div style={{fontSize:10,color:'#4a6a8a',lineHeight:1.4}}><strong style={{color:'#9b6dff'}}>×30 min</strong><br/>each</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <div className="dc3-cc-lbl"><span>⚕️</span>Critical Condition — Nature & Severity</div>
                <div className="dc3-sev-row">
                  {[['active-imm','Immediately Life-Threatening','Imminent risk of death'],['active-life','Life-Threatening Condition','High probability of deterioration'],['active-org','Threat to Organ Function','Risk of significant organ dysfunction']].map(([cls,lbl,sub])=>(
                    <div key={cls} className={`dc3-sev-btn${ccSeverity===cls?' '+cls:''}`} onClick={()=>setCcSeverity(p=>p===cls?'':cls)}>
                      <div className="dc3-sev-btn-lbl">{lbl}</div>
                      <div className="dc3-sev-btn-sub">{sub}</div>
                    </div>
                  ))}
                </div>
                <textarea className="dc3-ta" value={ccCondition} onChange={e=>setCcCondition(e.target.value)} style={{minHeight:72}} placeholder="Describe the critical condition and clinical findings supporting critical illness…"/>
              </div>

              <div style={{marginBottom:14}}>
                <div className="dc3-cc-lbl"><span>🫀</span>Organ Systems Involved</div>
                <div className="dc3-organ-grid">
                  {ORGAN_LIST.map((organ,i)=>(
                    <div key={organ} className={`dc3-organ-chip${ccOrgans.includes(organ)?' active':''}`} onClick={()=>toggleOrgan(organ,ccOrgans,setCcOrgans)}>
                      <div className="dc3-organ-chk">{ccOrgans.includes(organ)?'✓':''}</div>
                      <span className="dc3-organ-lbl">{ORGAN_ICONS[i]} {organ}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <div className="dc3-cc-lbl"><span>📊</span>Vitals at Time of Critical Care</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
                  {[['BP',ccBp,setCcBp,'e.g. 82/50'],['HR',ccHr,setCcHr,'e.g. 128'],['RR',ccRr,setCcRr,'e.g. 28'],['SpO₂',ccSpo2,setCcSpo2,'e.g. 86%'],['Temp',ccTemp,setCcTemp,'e.g. 103.4°F'],['GCS',ccGcs,setCcGcs,'e.g. 8'],['MAP',ccMap,setCcMap,'e.g. 54']].map(([lbl,val,set,ph])=>(
                    <div key={lbl} className="dc3-field"><label className="dc3-flbl">{lbl}</label><input className="dc3-inp" style={{fontFamily:'monospace'}} value={val} onChange={e=>set(e.target.value)} placeholder={ph}/></div>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <div className="dc3-cc-lbl"><span>⚙️</span>Interventions During Critical Care Time</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
                  {INTERV_LIST.map(iv=>(
                    <div key={iv} className={`dc3-organ-chip${ccInterventions.includes(iv)?' active':''}`} onClick={()=>toggleOrgan(iv,ccInterventions,setCcInterventions)}>
                      <div className="dc3-organ-chk">{ccInterventions.includes(iv)?'✓':''}</div>
                      <span className="dc3-organ-lbl" style={{fontSize:11}}>{iv}</span>
                    </div>
                  ))}
                </div>
                <textarea className="dc3-ta" value={ccIntervText} onChange={e=>setCcIntervText(e.target.value)} style={{minHeight:64}} placeholder="Describe additional interventions and patient response during critical care period…"/>
              </div>

              <div className="dc3-grid2" style={{marginBottom:12}}>
                {[['🔬 Diagnostic Results Reviewed',ccLabs,setCcLabs,'Labs, imaging, ECG findings reviewed…'],['📈 Response to Treatment',ccResponse,setCcResponse,'Patient response to interventions…'],['💬 Communication & Consultations',ccConsults,setCcConsults,'Specialist consultations, family discussions…'],['🏥 Disposition Decision',ccDispo,setCcDispo,'Disposition plan discussed during CC care…']].map(([lbl,val,set,ph])=>(
                  <div key={lbl} className="dc3-field"><label className="dc3-flbl" style={{marginBottom:6}}>{lbl}</label><textarea className="dc3-ta" value={val} onChange={e=>set(e.target.value)} style={{minHeight:70}} placeholder={ph}/></div>
                ))}
              </div>

              <div style={{marginBottom:14}}>
                <div className="dc3-cc-lbl"><span>📋</span>Clinical Impression & Assessment</div>
                <textarea className="dc3-ta" value={ccImpression} onChange={e=>setCcImpression(e.target.value)} style={{minHeight:90}} placeholder="Critical care clinical impression, working diagnosis, acuity justification, management plan…"/>
              </div>

              <div className="dc3-attest">
                <strong>Physician Attestation:</strong> I personally provided direct, face-to-face critical care to this patient for the time documented above. The patient's condition was of high complexity requiring constant physician attendance due to the critical nature of the illness or injury.
                <div style={{marginTop:8,display:'flex',gap:12,alignItems:'center'}}>
                  <div className="dc3-field" style={{flex:1}}><label className="dc3-flbl">Physician Signature</label><input className="dc3-inp" value={ccSig} onChange={e=>setCcSig(e.target.value)} placeholder="Dr. Name, MD"/></div>
                  <div className="dc3-field" style={{width:180}}><label className="dc3-flbl">Date / Time</label><input className="dc3-inp" style={{fontFamily:'monospace'}} value={ccSigDt} onChange={e=>setCcSigDt(e.target.value)} placeholder="MM/DD/YYYY HH:MM"/></div>
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSES */}
          <div className="dc3-sec" id="dc3-sec-dx">
            <div className="dc3-sec-hdr">
              <span className="dc3-sec-icon">📋</span>
              <div><div className="dc3-sec-title">Discharge Diagnoses</div><div className="dc3-sec-sub">Primary and secondary diagnoses with ICD-10 codes</div></div>
              <button className="dc3-btn dc3-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('Suggest appropriate ICD-10 codes for the discharge diagnoses.')}>✨ AI Code</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {dxList.map(dx=>(
                <div key={dx.id} className="dc3-row">
                  <span style={{fontSize:11,fontWeight:700,color:dx.primary?'#00e5c0':'#4a6a8a',minWidth:28,fontFamily:'monospace'}}>{dx.order}</span>
                  <input className="dc3-row-inp" style={{maxWidth:80,fontFamily:'monospace',fontSize:11,color:'#3b9eff'}} value={dx.code} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,code:e.target.value}:d))} placeholder="ICD-10"/>
                  <input className="dc3-row-inp" style={{flex:1}} value={dx.name} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,name:e.target.value}:d))} placeholder="Diagnosis name…"/>
                  <span className={`dc3-chip ${dx.primary?'dc3-chip-urg':'dc3-chip-rtn'}`}>{dx.primary?'PRIMARY':'SECONDARY'}</span>
                  {!dx.primary && <button className="dc3-row-del" onClick={()=>setDxList(p=>p.filter(d=>d.id!==dx.id))}>×</button>}
                </div>
              ))}
            </div>
            <div className="dc3-add-row">
              <input className="dc3-add-inp" style={{maxWidth:90,fontFamily:'monospace',fontSize:12}} value={newDxCode} onChange={e=>setNewDxCode(e.target.value)} placeholder="ICD-10"/>
              <input className="dc3-add-inp" style={{flex:1}} value={newDxName} onChange={e=>setNewDxName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addDx()} placeholder="+ Add diagnosis…"/>
              <button className="dc3-btn dc3-btn-ghost" onClick={addDx}>Add</button>
            </div>
          </div>

          {/* DISCHARGE INSTRUCTIONS */}
          <div className="dc3-sec" id="dc3-sec-instr">
            <div className="dc3-sec-hdr">
              <span className="dc3-sec-icon">📄</span>
              <div><div className="dc3-sec-title">Discharge Instructions</div><div className="dc3-sec-sub">Patient-facing care guide — AI generated from chart information</div></div>
              <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
                {instrGenerated && <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:9,color:'#00e5c0',background:'rgba(0,229,192,.1)',border:'1px solid rgba(0,229,192,.25)',borderRadius:3,padding:'1px 6px',fontWeight:700}}>✨ AI Generated</span>}
                <button className="dc3-btn dc3-btn-gold" onClick={generateInstructions} disabled={generatingInstr}>
                  {generatingInstr?<><span className="dc3-spin"/> Generating…</>:'✨ Generate from Chart'}
                </button>
              </div>
            </div>
            {!instrGenerated ? (
              <div style={{background:'rgba(22,45,79,.3)',border:'1px dashed #1a3555',borderRadius:8,textAlign:'center',padding:'28px 20px',color:'#4a6a8a',fontSize:12}}>
                Click <strong style={{color:'#f5c842'}}>✨ Generate from Chart</strong> to have AI create personalized discharge instructions.
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[{icon:'🩺',title:'Your Diagnosis',val:instrDiag,set:setInstrDiag},{icon:'💊',title:'Treatment Received in the ED',val:instrTreat,set:setInstrTreat},{icon:'💊',title:'Medications',val:instrMeds,set:setInstrMeds},{icon:'🏃',title:'Activity & Diet',val:instrAct,set:setInstrAct},{icon:'📝',title:'Additional Instructions',val:instrMisc,set:setInstrMisc}].map(({icon,title,val,set})=>(
                  <div key={title} className="dc3-instr-box">
                    <div className="dc3-instr-hdr">
                      <span style={{fontSize:15}}>{icon}</span>
                      <span style={{fontSize:12,fontWeight:700,color:'#e8f0fe',textTransform:'uppercase',letterSpacing:'.04em'}}>{title}</span>
                    </div>
                    <textarea className="dc3-ta" style={{minHeight:60,fontSize:12.5}} value={val} onChange={e=>set(e.target.value)} placeholder="Enter patient instructions…"/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RETURN PRECAUTIONS */}
          <div className="dc3-sec" id="dc3-sec-ret">
            <div className="dc3-sec-hdr">
              <span className="dc3-sec-icon">🚨</span>
              <div><div className="dc3-sec-title">Return to the Emergency Department</div><div className="dc3-sec-sub">Instruct patient to return immediately for any of the following</div></div>
              <button className="dc3-btn dc3-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('List the most important return-to-ED precautions for this patient. Use patient-friendly language.')}>✨ AI Precautions</button>
            </div>
            {RETURN_ITEMS.map((item,i)=>(
              <div key={i} className="dc3-ret-card">
                <span style={{fontSize:17,flexShrink:0,marginTop:2}}>{item.icon}</span>
                <div style={{fontSize:12,color:'#8aaccc',lineHeight:1.5}}><strong style={{color:'#ff6b6b'}}>{item.strong}</strong>{item.rest}</div>
              </div>
            ))}
            <div className="dc3-field" style={{marginTop:12}}>
              <label className="dc3-flbl">Additional Return Precautions (custom)</label>
              <textarea className="dc3-ta" style={{minHeight:60,borderColor:'rgba(255,107,107,.25)'}} placeholder="Add any diagnosis-specific return precautions…"/>
            </div>
            <div style={{marginTop:12,display:'flex',alignItems:'center',gap:10,background:'rgba(255,107,107,.06)',border:'1px solid rgba(255,107,107,.2)',borderRadius:8,padding:'11px 14px'}}>
              <span style={{fontSize:20}}>📞</span>
              <div><div style={{fontSize:12,fontWeight:700,color:'#ff6b6b'}}>Emergency Instructions</div><div style={{fontSize:11,color:'#8aaccc',marginTop:2}}>If experiencing a medical emergency, call <strong style={{color:'#e8f0fe'}}>911</strong> immediately or go to your nearest emergency room.</div></div>
            </div>
          </div>

          {/* FOLLOW-UP */}
          <div className="dc3-sec" id="dc3-sec-fu">
            <div className="dc3-sec-hdr">
              <span className="dc3-sec-icon">📅</span>
              <div><div className="dc3-sec-title">Follow-Up Appointments</div><div className="dc3-sec-sub">Specialist referrals · Primary care · Recommended timeframe</div></div>
              <button className="dc3-btn dc3-btn-ghost" style={{marginLeft:'auto'}} onClick={()=>sendAI('What follow-up appointments should be scheduled? Include timeframe and urgency.')}>✨ AI Suggest</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {fuList.map(f=>(
                <div key={f.id} className="dc3-row">
                  <span style={{fontSize:18}}>{f.icon}</span>
                  <div style={{display:'flex',flexDirection:'column',flex:1,gap:3}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#e8f0fe'}}>{f.specialty}</div>
                    <input className="dc3-row-inp" style={{fontSize:11}} value={f.note} onChange={e=>setFuList(p=>p.map(x=>x.id===f.id?{...x,note:e.target.value}:x))} placeholder="Timeframe / instructions…"/>
                  </div>
                  <span className={`dc3-chip ${f.urgency==='Urgent'?'dc3-chip-urg':'dc3-chip-rtn'}`}>{f.urgency.toUpperCase()}</span>
                  <button className="dc3-row-del" onClick={()=>setFuList(p=>p.filter(x=>x.id!==f.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dc3-add-row">
              <input className="dc3-add-inp" style={{flex:1}} value={newFu} onChange={e=>setNewFu(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addFU()} placeholder="+ Add follow-up specialty or provider…"/>
              <select className="dc3-sel" style={{width:'auto',paddingRight:24}} value={newFuUrg} onChange={e=>setNewFuUrg(e.target.value)}><option>Urgent</option><option>Routine</option></select>
              <button className="dc3-btn dc3-btn-ghost" onClick={addFU}>Add</button>
            </div>
          </div>

          {/* DISCHARGE MEDS */}
          <div className="dc3-sec" id="dc3-sec-rx">
            <div className="dc3-sec-hdr">
              <span className="dc3-sec-icon">💊</span>
              <div><div className="dc3-sec-title">Discharge Medications</div><div className="dc3-sec-sub">New prescriptions and changes to home medications</div></div>
              <span className="dc3-bdg dc3-bdg-purple" style={{marginLeft:'auto'}}>{dcRxList.length} Rx</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {dcRxList.map(rx=>(
                <div key={rx.id} className="dc3-row" style={{borderColor:`${typeTextColor[rx.type]}33`}}>
                  <span style={{fontSize:15}}>{typeIcon[rx.type]||'🔵'}</span>
                  <div style={{display:'flex',flexDirection:'column',flex:1,gap:2}}>
                    <input className="dc3-row-inp" style={{fontWeight:600,color:'#e8f0fe'}} value={rx.drug} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,drug:e.target.value}:x))} placeholder="Drug name + dose"/>
                    <input className="dc3-row-inp" style={{fontSize:11}} value={rx.sig} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,sig:e.target.value}:x))} placeholder="SIG / instructions…"/>
                  </div>
                  <span style={{fontSize:9,padding:'2px 7px',borderRadius:3,background:typeColor[rx.type],color:typeTextColor[rx.type],fontWeight:700,whiteSpace:'nowrap'}}>{rx.type}</span>
                  <button className="dc3-row-del" onClick={()=>setDcRxList(p=>p.filter(x=>x.id!==rx.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dc3-add-row">
              <input className="dc3-add-inp" style={{flex:1.5}} value={newRxDrug} onChange={e=>setNewRxDrug(e.target.value)} placeholder="Drug name + dose…"/>
              <input className="dc3-add-inp" style={{flex:1}} value={newRxSig} onChange={e=>setNewRxSig(e.target.value)} placeholder="SIG / instructions…"/>
              <select className="dc3-sel" style={{width:'auto',paddingRight:24}} value={newRxType} onChange={e=>setNewRxType(e.target.value)}>
                {['NEW','CONTINUE','CHANGED','STOP'].map(o=><option key={o}>{o}</option>)}
              </select>
              <button className="dc3-btn dc3-btn-ghost" onClick={addDcRx}>Add</button>
            </div>
          </div>

          {/* SIGN & FINALIZE */}
          <div className="dc3-sig" id="dc3-sec-sig">
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#e8f0fe'}}>Attending Physician</div>
                <div style={{fontSize:11,color:'#4a6a8a',marginTop:2}}>Emergency Medicine</div>
              </div>
              <div style={{marginLeft:'auto',display:'flex',gap:10}}>
                <div className="dc3-field" style={{minWidth:160}}><label className="dc3-flbl">Date of Service</label><input className="dc3-inp" value={sigDate} onChange={e=>setSigDate(e.target.value)}/></div>
                <div className="dc3-field" style={{minWidth:130}}><label className="dc3-flbl">Time of Discharge</label><input className="dc3-inp" value={sigTime} onChange={e=>setSigTime(e.target.value)}/></div>
              </div>
            </div>
            <div className="dc3-sig-line"/>
            <div className="dc3-grid3" style={{marginBottom:14}}>
              <div className="dc3-field"><label className="dc3-flbl">Patient / Guardian Signature</label><input className="dc3-inp" value={sigPt} onChange={e=>setSigPt(e.target.value)} placeholder="Name of signatory"/></div>
              <div className="dc3-field"><label className="dc3-flbl">Relationship (if guardian)</label><input className="dc3-inp" value={sigRel} onChange={e=>setSigRel(e.target.value)} placeholder="Self / Parent / POA…"/></div>
              <div className="dc3-field"><label className="dc3-flbl">Nurse Witnessing Discharge</label><input className="dc3-inp" value={sigRN} onChange={e=>setSigRN(e.target.value)} placeholder="RN Name"/></div>
            </div>
            <div className="dc3-field" style={{marginBottom:14}}>
              <label className="dc3-flbl">Attestation / Provider Notes</label>
              <textarea className="dc3-ta" style={{minHeight:60}} value={sigNote} onChange={e=>setSigNote(e.target.value)} placeholder="I have reviewed the discharge instructions with the patient/guardian and they verbalized understanding…"/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button className="dc3-btn dc3-btn-ghost" onClick={()=>window.print()}>🖨 Print Discharge Papers</button>
              <button className="dc3-btn dc3-btn-ghost" onClick={()=>sendAI('Write a complete discharge summary note for this visit in SOAP format suitable for the medical record.')}>📄 Generate DC Note</button>
              <button className="dc3-btn dc3-btn-primary" style={{padding:'8px 20px',fontSize:13}} onClick={finalizeDischarge} disabled={saving}>
                {saving?<><span className="dc3-spin"/> Signing…</>:'✍ Sign & Finalize Discharge'}
              </button>
            </div>
          </div>

        </main>

        {/* AI PANEL */}
        <aside className={`dc3-ai ${aiOpen?'open':'collapsed'}`}>
          <div className="dc3-ai-tab" onClick={()=>setAiOpen(true)}>
            <div className="dc3-ai-tab-dot"/>
            <span className="dc3-ai-tab-lbl">Notrya AI Advisor</span>
            <span style={{fontSize:22,fontWeight:700,color:'#00e5c0',lineHeight:1}}>›</span>
          </div>
          <div className="dc3-ai-inner">
            <div className="dc3-ai-hdr">
              <div className="dc3-ai-hrow">
                <div className="dc3-ai-dot"/>
                <span className="dc3-ai-lbl">Notrya AI — Discharge Advisor</span>
                <span className="dc3-ai-model">GPT-4o</span>
                <div className="dc3-ai-toggle" onClick={()=>setAiOpen(false)}>‹</div>
              </div>
              <div className="dc3-ai-qbtns">
                {[['📄 Generate DC Instructions',()=>generateInstructions()],['🧮 E&M Level',()=>sendAI('Suggest the optimal E&M level using 2021 AMA guidelines.')],['🚨 Return Precautions',()=>sendAI('Generate return-to-ED precautions tailored to this patient.')],['📅 Follow-Up Plan',()=>sendAI('What follow-up appointments should be arranged?')],['🏷 ICD-10 Codes',()=>sendAI('Suggest ICD-10 codes for the discharge diagnoses.')],['📝 DC Summary Note',()=>sendAI('Write a complete discharge summary note in SOAP format.')],['💌 Patient Letter',()=>sendAI('Generate a patient-friendly discharge letter.')],['✅ Review Completeness',()=>sendAI('Review the completeness of this discharge summary.')]].map(([label,fn])=>(
                  <button key={label} className="dc3-ai-qbtn" onClick={fn}>{label}</button>
                ))}
              </div>
            </div>
            <div className="dc3-ai-msgs" ref={aiMsgsRef}>
              {aiMsgs.map((m,i)=>(
                <div key={i} className={`dc3-ai-msg ${m.role}`} dangerouslySetInnerHTML={{__html:m.text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}/>
              ))}
              {aiLoading && <div className="dc3-ai-loader"><span/><span/><span/></div>}
            </div>
            <div className="dc3-ai-inp-wrap">
              <textarea className="dc3-ai-inp" rows={2} value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI();}}} placeholder="Ask about discharge planning…"/>
              <button className="dc3-ai-send" onClick={()=>sendAI()}>↑</button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}