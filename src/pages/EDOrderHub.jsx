import React, { useState, useRef, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import NotryaPatientBar from '@/components/HubHeader/NotryaPatientBar';

// ── Font ──────────────────────────────────────────────────────────────────────
(function(){if(document.getElementById('edoh-f'))return;const l=document.createElement('link');l.id='edoh-f';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap';document.head.appendChild(l);})();

// ── Tokens ────────────────────────────────────────────────────────────────────
const T={bg:'#050f1e',bgP:'#081628',bgC:'#0b1e36',bgU:'#0e2544',bd:'#1a3555',bdH:'#2a4f7a',blue:'#3b9eff',teal:'#00e5c0',gold:'#f5c842',coral:'#ff6b6b',orange:'#ff9f43',purple:'#9b6dff',green:'#3dffa0',txt:'#ffffff',txt2:'#d0e8ff',txt3:'#a8c8e8',txt4:'#7aa0c0'};

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
.edoh-wrap *{box-sizing:border-box;}
.edoh-wrap button{font-family:'DM Sans',sans-serif;cursor:pointer;}
.edoh-wrap input{font-family:'DM Sans',sans-serif;}
.edoh-wrap ::-webkit-scrollbar{width:4px;height:4px;}
.edoh-wrap ::-webkit-scrollbar-thumb{background:${T.bd};border-radius:2px;}
.edoh-wrap ::-webkit-scrollbar-track{background:transparent;}
.edoh-wrap{display:flex;flex-direction:column;background:${T.bg};color:${T.txt};font-family:'DM Sans',sans-serif;overflow:hidden;}
.edoh-layout{flex:1;display:flex;overflow:hidden;min-height:0;}

/* AI PANEL */
.ai-panel{width:268px;flex-shrink:0;background:${T.bgP};border-right:1px solid ${T.bd};display:flex;flex-direction:column;overflow:hidden;}
.ph{flex-shrink:0;padding:10px 13px 9px;border-bottom:1px solid ${T.bd};display:flex;align-items:center;gap:8px;}
.ph-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:${T.txt};}
.ph-sub{font-size:10px;color:${T.txt3};margin-top:1px;}
.ai-dot{width:7px;height:7px;border-radius:50%;background:${T.teal};flex-shrink:0;animation:aip 2s ease-in-out infinite;}
@keyframes aip{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4);}50%{box-shadow:0 0 0 5px rgba(0,229,192,0);}}
.ai-body{flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:7px;}
.ai-addall{width:100%;padding:7px;font-size:11px;font-weight:700;background:linear-gradient(135deg,rgba(0,229,192,.13),rgba(59,158,255,.08));border:1px solid rgba(0,229,192,.28);border-radius:8px;color:${T.teal};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .2s;}
.ai-addall:hover{background:linear-gradient(135deg,rgba(0,229,192,.22),rgba(59,158,255,.14));border-color:rgba(0,229,192,.5);}
.ai-set{background:${T.bgC};border:1px solid ${T.bd};border-radius:12px;overflow:hidden;transition:border-color .15s;}
.ai-set:hover{border-color:${T.bdH};}
.ai-set-hdr{padding:9px 11px;display:flex;align-items:flex-start;gap:7px;cursor:pointer;user-select:none;}
.ai-set-hdr:hover{background:rgba(255,255,255,.02);}
.ai-conf{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 6px;border-radius:20px;flex-shrink:0;margin-top:2px;}
.ai-sname{font-size:12px;font-weight:600;color:${T.txt};line-height:1.3;}
.ai-sbasis{font-size:10px;color:${T.txt3};margin-top:2px;line-height:1.35;}
.ai-chev{font-size:10px;color:${T.txt4};transition:transform .2s;flex-shrink:0;margin-top:3px;}
.ai-set.open .ai-chev{transform:rotate(180deg);}
.ai-set-body{display:none;border-top:1px solid ${T.bd};padding:7px 9px;}
.ai-set.open .ai-set-body{display:block;}
.ai-orow{display:flex;align-items:center;gap:6px;padding:4px 5px;border-radius:6px;font-size:11px;transition:all .12s;cursor:default;}
.ai-orow.addable{cursor:pointer;}
.ai-orow.addable:hover{background:${T.bgU};}
.ai-orow.addable:hover .ai-add-ic{background:rgba(0,229,192,.15);border-color:rgba(0,229,192,.5);color:${T.teal};}
.ai-sdot{width:15px;height:15px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;}
.ai-sdot.done{background:rgba(0,229,192,.15);color:${T.teal};border:1px solid rgba(0,229,192,.4);}
.ai-sdot.active{background:rgba(59,158,255,.15);color:${T.blue};border:1px solid rgba(59,158,255,.4);}
.ai-sdot.add{background:rgba(74,106,138,.2);color:${T.txt3};border:1px solid ${T.bd};}
.ai-sdot.queued{background:rgba(0,229,192,.2);color:${T.teal};border:1px solid rgba(0,229,192,.5);}
.ai-oname{flex:1;color:${T.txt2};line-height:1.3;}
.ai-onote{font-size:9px;color:${T.txt4};white-space:nowrap;}
.ai-add-ic{width:18px;height:18px;border-radius:4px;flex-shrink:0;background:${T.bgU};border:1px solid ${T.bd};color:${T.txt3};font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.ai-set-acts{margin-top:7px;padding-top:6px;border-top:1px solid rgba(26,53,85,.5);}
.ai-addbtn{font-size:11px;font-weight:600;color:${T.teal};background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.22);border-radius:5px;padding:3px 9px;cursor:pointer;transition:all .15s;}
.ai-addbtn:hover{background:rgba(0,229,192,.2);}
.ai-foot{flex-shrink:0;padding:8px 10px;border-top:1px solid ${T.bd};}
.btn-analyze{width:100%;padding:7px;font-size:11px;font-weight:600;background:rgba(155,109,255,.1);border:1px solid rgba(155,109,255,.28);border-radius:6px;color:${T.purple};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .2s;}
.btn-analyze:hover{background:rgba(155,109,255,.2);}
.btn-analyze:disabled{opacity:.5;cursor:not-allowed;}

/* CATALOG */
.cat-panel{flex:1;background:${T.bg};display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.cat-top{flex-shrink:0;padding:8px 13px 7px;border-bottom:1px solid ${T.bd};background:${T.bgP};display:flex;gap:8px;align-items:center;}
.srch{flex:1;display:flex;align-items:center;background:${T.bgU};border:1px solid ${T.bd};border-radius:9px;padding:0 10px;gap:6px;transition:border-color .15s;}
.srch:focus-within{border-color:rgba(0,229,192,.45);box-shadow:0 0 0 3px rgba(0,229,192,.06);}
.srch input{flex:1;background:transparent;border:none;outline:none;color:${T.txt};font-size:12px;padding:7px 0;}
.srch input::placeholder{color:${T.txt4};}
.wt-wrap{display:flex;align-items:center;gap:5px;flex-shrink:0;}
.wt-lbl{font-size:9px;color:${T.txt4};font-family:'JetBrains Mono',monospace;font-weight:600;text-transform:uppercase;letter-spacing:.05em;}
.wt-inp{width:60px;background:rgba(14,37,68,.8);border:1px solid ${T.bd};border-radius:7px;padding:5px 7px;color:${T.txt};font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;outline:none;text-align:center;transition:border-color .15s;}
.wt-inp:focus{border-color:rgba(0,229,192,.5);}
.wt-inp.filled{border-color:rgba(0,229,192,.35);}
/* Bundle 2-row layout */
.bcat-row{flex-shrink:0;display:flex;gap:3px;padding:5px 11px;border-bottom:1px solid ${T.bd};background:${T.bgP};overflow-x:auto;}
.bcat-row::-webkit-scrollbar{height:0;}
.bcat-tab{display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;background:${T.bgU};border:1px solid ${T.bd};color:${T.txt3};transition:all .15s;}
.bcat-tab:hover{border-color:${T.bdH};color:${T.txt2};filter:brightness(1.1);}
.bcat-tab.active{font-weight:700;}
.bchips-row{flex-shrink:0;display:flex;gap:5px;padding:5px 11px 6px;border-bottom:1px solid ${T.bd};background:${T.bgP};overflow-x:auto;align-items:center;min-height:34px;}
.bchips-row::-webkit-scrollbar{height:0;}
.bchip{display:flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .18s;}
.bchip:hover{filter:brightness(1.15);}
.bchip.active{box-shadow:0 0 0 2px currentColor;filter:brightness(1.18);}
.bchip-empty{font-size:10px;color:${T.txt4};font-style:italic;}
/* ── QUICK DOSE STRIP ── */
.qdose-row{flex-shrink:0;display:flex;gap:4px;padding:5px 11px 6px;border-bottom:1px solid ${T.bd};background:${T.bg};overflow-x:auto;align-items:center;}
.qdose-row::-webkit-scrollbar{height:0;}
.qdose-hdr{font-size:8px;font-family:'JetBrains Mono',monospace;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${T.txt4};flex-shrink:0;white-space:nowrap;margin-right:3px;}
.qdose-chip{display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 9px;border-radius:8px;border:1px solid transparent;cursor:pointer;flex-shrink:0;transition:all .16s;min-width:58px;text-align:center;}
.qdose-chip:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.3);}
.qdose-chip.inq{box-shadow:0 0 0 2px currentColor;}
.qd-name{font-size:10px;font-weight:700;white-space:nowrap;line-height:1.2;}
.qd-dose{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;opacity:.85;white-space:nowrap;line-height:1.2;}
.qd-check{font-size:8px;font-weight:900;line-height:1;}
.acep-banner{flex-shrink:0;display:flex;align-items:center;gap:8px;padding:5px 13px;background:rgba(0,229,192,.06);border-bottom:1px solid rgba(0,229,192,.2);}
.acep-banner-txt{font-size:11px;font-weight:600;color:${T.teal};}
.acep-banner-sub{font-size:10px;color:${T.txt4};}
.acep-clr{background:none;border:none;color:${T.txt4};font-size:12px;cursor:pointer;margin-left:auto;padding:2px 6px;border-radius:4px;transition:all .15s;}
.acep-clr:hover{color:${T.coral};background:rgba(255,107,107,.1);}
.cat-tabs{flex-shrink:0;display:flex;gap:3px;padding:6px 13px;border-bottom:1px solid ${T.bd};background:${T.bgP};overflow-x:auto;}
.ctab{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;background:${T.bgU};border:1px solid ${T.bd};color:${T.txt3};flex-shrink:0;transition:all .15s;}
.ctab:hover{border-color:${T.bdH};color:${T.txt2};}
.ctab.active{background:rgba(59,158,255,.12);border-color:rgba(59,158,255,.4);color:${T.blue};font-weight:600;}
.cat-body{flex:1;overflow-y:auto;padding:12px 13px 60px;display:flex;flex-direction:column;gap:12px;}
.sec-ttl{font-size:10px;color:${T.txt3};text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:7px;display:flex;align-items:center;gap:6px;}
.sec-ttl::after{content:'';flex:1;height:1px;background:${T.bd};}
.orders-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:6px;}
.oc{background:${T.bgP};border:1px solid ${T.bd};border-radius:8px;padding:8px 10px;cursor:pointer;transition:all .18s;position:relative;user-select:none;}
.oc:hover{border-color:${T.bdH};background:${T.bgC};transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.3);}
.oc.inq{border-color:rgba(0,229,192,.35);background:rgba(0,229,192,.03);}
.oc.inq:hover{border-color:rgba(255,107,107,.4);background:rgba(255,107,107,.04);}
.oc.acep-rec{border-color:rgba(0,229,192,.52)!important;box-shadow:0 0 0 1px rgba(0,229,192,.14),0 3px 14px rgba(0,229,192,.1)!important;}
.oc-ck{position:absolute;top:6px;right:6px;width:14px;height:14px;border-radius:50%;background:${T.teal};color:${T.bg};font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.oc-nm{font-size:11px;font-weight:600;color:${T.txt};line-height:1.3;padding-right:16px;}
.oc-dt{font-size:9.5px;color:${T.txt3};margin-top:2px;line-height:1.35;}
.oc-ft{display:flex;align-items:center;gap:3px;margin-top:4px;flex-wrap:wrap;}
.prio{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 6px;border-radius:20px;}
.pS{background:rgba(255,107,107,.15);color:${T.coral};border:1px solid rgba(255,107,107,.3);}
.pU{background:rgba(255,159,67,.12);color:${T.orange};border:1px solid rgba(255,159,67,.3);}
.pR{background:rgba(0,229,192,.1);color:${T.teal};border:1px solid rgba(0,229,192,.25);}
.acep-bdg{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(0,229,192,.13);color:${T.teal};border:1px solid rgba(0,229,192,.35);white-space:nowrap;}
.allg-chip{font-size:9px;color:${T.coral};background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.25);border-radius:4px;padding:1px 5px;margin-top:3px;}
.drug-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(282px,1fr));gap:7px;}
.mc{background:${T.bgP};border:1px solid ${T.bd};border-radius:10px;padding:11px 13px;transition:border-color .18s;}
.mc:hover{border-color:${T.bdH};}
.mc.acep-rec{border-color:rgba(0,229,192,.52)!important;box-shadow:0 0 0 1px rgba(0,229,192,.14),0 3px 14px rgba(0,229,192,.1)!important;}
.mc-top{display:flex;align-items:flex-start;gap:9px;margin-bottom:8px;}
.mc-info{flex:1;}
.mc-name{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:${T.txt};}
.mc-sub{font-size:10px;color:${T.txt3};margin-top:1px;}
.mc-bdg{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;}
.bdg{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 6px;border-radius:20px;}
.mc-sc{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;}
.sc-btn{padding:3px 8px;border-radius:5px;font-size:10px;cursor:pointer;border:1px solid ${T.bd};background:transparent;color:${T.txt3};transition:all .12s;}
.sc-btn.sel{background:rgba(0,229,192,.1);border-color:rgba(0,229,192,.3);color:${T.teal};}
.mc-acts{display:flex;gap:5px;justify-content:flex-end;}
.mc-copy{padding:5px 11px;border-radius:6px;font-size:10px;font-weight:700;border:1px solid ${T.bd};background:${T.bgU};color:${T.txt3};cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;}
.mc-copy.cpok{border-color:rgba(0,229,192,.4);background:rgba(0,229,192,.1);color:${T.teal};}
.mc-add{padding:5px 11px;border-radius:6px;font-size:10px;font-weight:700;border:1px solid rgba(59,158,255,.3);background:rgba(59,158,255,.1);color:${T.blue};cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;}
.mc-add:hover{background:rgba(59,158,255,.18);}
.mc-add.inq{border-color:rgba(0,229,192,.4);background:rgba(0,229,192,.1);color:${T.teal};}
.wt-warn{padding:6px 11px;border-radius:7px;background:rgba(245,200,66,.07);border:1px solid rgba(245,200,66,.2);font-size:11px;color:${T.gold};}
.no-results{padding:40px 20px;text-align:center;color:${T.txt3};font-size:13px;}

/* QUEUE */
.q-panel{width:308px;flex-shrink:0;background:${T.bgP};border-left:1px solid ${T.bd};display:flex;flex-direction:column;overflow:hidden;}
.qcnt{background:rgba(59,158,255,.14);border:1px solid rgba(59,158,255,.33);border-radius:20px;padding:1px 8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${T.blue};}
.q-body{flex:1;overflow-y:auto;padding:7px 9px;display:flex;flex-direction:column;gap:4px;}
.q-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:20px;text-align:center;}
.qi{background:${T.bgC};border:1px solid ${T.bd};border-radius:8px;overflow:hidden;transition:border-color .15s;animation:qin .2s ease-out;}
@keyframes qin{from{opacity:0;transform:translateX(14px);}to{opacity:1;transform:translateX(0);}}
.qi:hover{border-color:${T.bdH};}
.qi-row{display:flex;align-items:center;gap:7px;padding:8px 9px;cursor:pointer;user-select:none;}
.pp{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;padding:2px 5px;border-radius:3px;flex-shrink:0;min-width:44px;text-align:center;}
.pp.STAT{background:rgba(255,107,107,.18);color:${T.coral};border:1px solid rgba(255,107,107,.35);}
.pp.URGENT{background:rgba(255,159,67,.14);color:${T.orange};border:1px solid rgba(255,159,67,.32);}
.pp.ROUTINE{background:rgba(0,229,192,.1);color:${T.teal};border:1px solid rgba(0,229,192,.28);}
.qi-nm{font-size:12px;font-weight:600;color:${T.txt};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.qi-dt{font-size:10px;color:${T.txt3};margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.qi-chev{font-size:9px;color:${T.txt4};transition:transform .2s;flex-shrink:0;}
.qi.open .qi-chev{transform:rotate(180deg);}
.qi-rm{width:20px;height:20px;border-radius:4px;background:none;border:none;color:${T.txt4};font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;flex-shrink:0;}
.qi-rm:hover{background:rgba(255,107,107,.15);color:${T.coral};}
.qi-exp{display:none;border-top:1px solid rgba(26,53,85,.5);padding:9px;background:rgba(8,22,40,.5);}
.qi.open .qi-exp{display:block;}
.qi-lbl{font-size:9px;color:${T.txt4};text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;font-weight:600;}
.prio-sel{display:flex;gap:3px;margin-bottom:8px;}
.ps-btn{flex:1;padding:4px 3px;font-size:9px;font-weight:700;border-radius:4px;cursor:pointer;border:1px solid ${T.bd};background:${T.bgC};color:${T.txt4};font-family:'JetBrains Mono',monospace;text-align:center;transition:all .12px;}
.ps-btn.sel.STAT{background:rgba(255,107,107,.18);border-color:${T.coral};color:${T.coral};}
.ps-btn.sel.URGENT{background:rgba(255,159,67,.14);border-color:${T.orange};color:${T.orange};}
.ps-btn.sel.ROUTINE{background:rgba(0,229,192,.1);border-color:${T.teal};color:${T.teal};}
.qi-allg{display:flex;align-items:center;gap:5px;background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.25);border-radius:5px;padding:5px 7px;font-size:10px;color:${T.coral};margin-bottom:7px;font-weight:600;}
.cpoe-pre{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt3};white-space:pre-wrap;background:rgba(4,13,25,.7);border:1px solid ${T.bd};border-radius:5px;padding:7px 9px;max-height:128px;overflow-y:auto;line-height:1.6;margin-top:4px;}
.cpoe-copy{margin-top:5px;width:100%;padding:5px;font-size:10px;font-weight:700;border:1px solid ${T.bd};background:${T.bgU};color:${T.txt3};border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;}
.cpoe-copy.cpok{border-color:rgba(0,229,192,.4);background:rgba(0,229,192,.1);color:${T.teal};}
.q-foot{flex-shrink:0;padding:10px 12px;border-top:1px solid ${T.bd};display:flex;flex-direction:column;gap:6px;}
.allg-warn{display:flex;align-items:flex-start;gap:5px;background:rgba(245,200,66,.07);border:1px solid rgba(245,200,66,.22);border-radius:6px;padding:6px 8px;font-size:10px;color:${T.gold};}
.sign-btn{width:100%;padding:9px;font-size:13px;font-weight:700;background:linear-gradient(135deg,${T.teal},#00bfaa);color:${T.bg};border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s;box-shadow:0 4px 16px rgba(0,229,192,.22);}
.sign-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 6px 22px rgba(0,229,192,.34);}
.sign-btn:disabled{background:${T.bgU};border:1px solid ${T.bd};color:${T.txt4};cursor:not-allowed;box-shadow:none;}
/* ── MDM BRIDGE PANEL ── */
.mdm-overlay{position:fixed;inset:0;background:rgba(2,8,18,.82);backdrop-filter:blur(5px);z-index:9996;display:flex;align-items:center;justify-content:flex-end;animation:palIn .15s ease-out;}
.mdm-panel{width:430px;max-height:90vh;background:#07111f;border:1px solid ${T.bdH};border-radius:16px 0 0 16px;display:flex;flex-direction:column;overflow:hidden;animation:slidein .2s cubic-bezier(.22,1,.36,1);}
.mdm-pre{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt3};white-space:pre-wrap;background:rgba(4,13,25,.7);border:1px solid ${T.bd};border-radius:7px;padding:9px 11px;line-height:1.65;max-height:230px;overflow-y:auto;}
.mdm-copy{width:100%;padding:8px;font-size:11px;font-weight:700;background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.28);border-radius:7px;color:${T.teal};cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .18s;}
.mdm-copy:hover,.mdm-copy.cpok{background:rgba(0,229,192,.2);border-color:rgba(0,229,192,.5);}
.clr-btn{width:100%;text-align:center;font-size:11px;color:${T.txt4};background:none;border:none;cursor:pointer;padding:2px;transition:color .15s;}
.clr-btn:hover{color:${T.coral};}

/* ── DRUG CONFLICT DETECTION ── */
.conflicts-wrap{flex-shrink:0;display:flex;flex-direction:column;gap:4px;padding:7px 9px 5px;border-bottom:1px solid ${T.bd};}
.cf-hdr{font-size:8px;font-weight:700;color:${T.txt4};text-transform:uppercase;letter-spacing:.08em;font-family:'JetBrains Mono',monospace;padding:0 1px 3px;display:flex;align-items:center;gap:5px;}
.cf-hdr::after{content:'';flex:1;height:1px;background:${T.bd};}
.cf-card{border-radius:8px;padding:8px 10px;animation:qin .18s ease-out;}
.cf-card.sev-alert{background:rgba(255,159,67,.05);border:1px solid rgba(255,159,67,.38);}
.cf-card.sev-warning{background:rgba(59,158,255,.04);border:1px solid rgba(59,158,255,.2);}
.cf-top{display:flex;align-items:flex-start;gap:6px;margin-bottom:3px;}
.cf-icon{font-size:11px;flex-shrink:0;margin-top:1px;}
.cf-title{font-size:10px;font-weight:700;flex:1;line-height:1.3;}
.sev-alert .cf-title{color:${T.orange};}
.sev-warning .cf-title{color:${T.blue};}
.cf-x{background:none;border:none;color:${T.txt4};font-size:10px;cursor:pointer;padding:0 2px;flex-shrink:0;transition:color .15s;}
.cf-x:hover{color:${T.coral};}
.cf-msg{font-size:9px;color:${T.txt3};line-height:1.4;margin-bottom:2px;}
.cf-rec{font-size:9px;color:${T.txt4};line-height:1.35;font-style:italic;}

/* ── SAVED SETS ── */
.sets-overlay{position:fixed;inset:0;background:rgba(2,8,18,.72);backdrop-filter:blur(4px);z-index:9997;display:flex;align-items:stretch;justify-content:flex-end;animation:palIn .14s ease-out;}
.sets-panel{width:360px;max-width:100vw;background:#070f1e;border-left:1px solid ${T.bdH};display:flex;flex-direction:column;overflow:hidden;animation:slidein .2s cubic-bezier(.22,1,.36,1);}
@keyframes slidein{from{transform:translateX(100%);}to{transform:translateX(0);}}
.sets-hdr{flex-shrink:0;padding:13px 16px 11px;border-bottom:1px solid ${T.bd};display:flex;align-items:center;gap:8px;}
.sets-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:${T.txt};flex:1;}
.sets-close{background:none;border:none;color:${T.txt4};font-size:18px;cursor:pointer;padding:0 2px;transition:color .15s;}
.sets-close:hover{color:${T.coral};}
.sets-body{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:7px;}
.sets-empty{padding:40px 20px;text-align:center;color:${T.txt4};font-size:13px;}
.set-card{background:${T.bgC};border:1px solid ${T.bd};border-radius:10px;padding:10px 12px;transition:border-color .15s;}
.set-card:hover{border-color:${T.bdH};}
.set-name{font-size:12px;font-weight:700;color:${T.txt};margin-bottom:2px;}
.set-meta{font-size:9px;color:${T.txt4};font-family:'JetBrains Mono',monospace;margin-bottom:6px;}
.set-preview{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:7px;}
.set-chip{font-size:8px;padding:1px 6px;border-radius:3px;background:${T.bgU};border:1px solid ${T.bd};color:${T.txt3};white-space:nowrap;font-family:'JetBrains Mono',monospace;}
.set-acts{display:flex;gap:4px;}
.set-btn{flex:1;padding:5px 6px;font-size:9px;font-weight:700;border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;text-align:center;}
.set-btn.load{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.28);color:${T.teal};}
.set-btn.load:hover{background:rgba(0,229,192,.2);}
.set-btn.exp{background:${T.bgU};border:1px solid ${T.bd};color:${T.txt3};}
.set-btn.exp:hover{border-color:${T.bdH};color:${T.txt2};}
.set-btn.del{background:none;border:1px solid rgba(255,107,107,.18);color:${T.coral};}
.set-btn.del:hover{background:rgba(255,107,107,.1);}
.sets-foot{flex-shrink:0;border-top:1px solid ${T.bd};padding:10px 12px;display:flex;flex-direction:column;gap:7px;}
.import-area{display:flex;flex-direction:column;gap:5px;animation:suggIn .18s ease-out;}
.import-ta{width:100%;background:${T.bgU};border:1px solid ${T.bd};border-radius:7px;padding:7px 9px;color:${T.txt};font-family:'JetBrains Mono',monospace;font-size:10px;resize:vertical;min-height:70px;outline:none;line-height:1.5;transition:border-color .15s;}
.import-ta:focus{border-color:rgba(59,158,255,.45);}
.import-ta::placeholder{color:${T.txt4};}
.import-btn{padding:5px 12px;font-size:10px;font-weight:700;background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.28);border-radius:5px;color:${T.blue};cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;}
.import-btn:hover{background:rgba(59,158,255,.2);}
.sets-strip{flex-shrink:0;display:flex;gap:5px;padding:6px 10px;border-top:1px solid ${T.bd};background:rgba(8,22,40,.5);}
.save-input-row{flex-shrink:0;display:flex;gap:5px;align-items:center;padding:6px 10px;background:rgba(0,229,192,.05);border-top:1px solid rgba(0,229,192,.18);animation:suggIn .18s ease-out;}
.save-inp{flex:1;background:${T.bgU};border:1px solid ${T.bd};border-radius:7px;padding:5px 9px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:12px;outline:none;transition:border-color .15s;}
.save-inp:focus{border-color:rgba(0,229,192,.5);}
.save-inp::placeholder{color:${T.txt4};}
.save-go{padding:5px 11px;font-size:10px;font-weight:700;background:linear-gradient(135deg,${T.teal},#00bfaa);color:${T.bg};border:none;border-radius:6px;cursor:pointer;font-family:'JetBrains Mono',monospace;white-space:nowrap;}
.save-cancel{background:none;border:none;color:${T.txt4};font-size:12px;cursor:pointer;padding:2px 4px;transition:color .15s;}
.save-cancel:hover{color:${T.coral};}
.strip-btn{flex:1;padding:5px 8px;font-size:10px;font-weight:600;border-radius:6px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;}
.strip-save{background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.25);color:${T.blue};}
.strip-save:hover{background:rgba(59,158,255,.18);}
.strip-save:disabled{opacity:.35;cursor:not-allowed;}
.strip-open{background:${T.bgU};border:1px solid ${T.bd};color:${T.txt3};}
.strip-open:hover{border-color:${T.bdH};color:${T.txt2};}
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%) translateY(0);background:${T.bgC};border:1px solid ${T.bdH};border-radius:8px;padding:7px 14px;font-size:12px;color:${T.txt};z-index:9999;pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,.5);white-space:nowrap;transition:all .28s;}
.toast.hide{transform:translateX(-50%) translateY(30px);opacity:0;}

/* ── COMMAND PALETTE ── */
.pal-overlay{position:fixed;inset:0;background:rgba(2,8,18,.8);backdrop-filter:blur(5px);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding-top:11vh;animation:palIn .12s ease-out;}
@keyframes palIn{from{opacity:0;}to{opacity:1;}}
.pal-box{width:640px;max-width:calc(100vw - 32px);background:#07111f;border:1px solid ${T.bdH};border-radius:16px;box-shadow:0 28px 90px rgba(0,0,0,.8),0 0 0 1px rgba(0,229,192,.1);overflow:hidden;animation:palDrop .16s cubic-bezier(.22,1,.36,1);}
@keyframes palDrop{from{transform:translateY(-12px) scale(.98);opacity:0;}to{transform:translateY(0) scale(1);opacity:1;}}
.pal-top{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid ${T.bd};}
.pal-icon{font-size:16px;opacity:.4;flex-shrink:0;}
.pal-inp{flex:1;background:transparent;border:none;outline:none;font-size:16px;color:${T.txt};font-family:'DM Sans',sans-serif;font-weight:500;}
.pal-inp::placeholder{color:${T.txt4};}
.pal-esc{font-family:'JetBrains Mono',monospace;font-size:10px;color:${T.txt4};background:${T.bgU};border:1px solid ${T.bd};border-radius:4px;padding:2px 7px;flex-shrink:0;}
.pal-results{max-height:420px;overflow-y:auto;padding:6px 6px 4px;}
.pal-empty{padding:36px 20px;text-align:center;color:${T.txt4};font-size:13px;}
.pal-group-lbl{font-size:9px;font-weight:700;color:${T.txt4};text-transform:uppercase;letter-spacing:.09em;padding:8px 12px 3px;font-family:'JetBrains Mono',monospace;}
.pal-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;cursor:pointer;transition:background .08s;}
.pal-item:hover{background:rgba(255,255,255,.04);}
.pal-item.sel{background:rgba(0,229,192,.09);outline:1px solid rgba(0,229,192,.22);}
.pi-icon{font-size:16px;flex-shrink:0;width:24px;text-align:center;}
.pi-body{flex:1;min-width:0;}
.pi-name{font-size:13px;font-weight:600;color:${T.txt};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pi-detail{font-size:10px;color:${T.txt3};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;}
.pi-tags{display:flex;gap:4px;align-items:center;flex-shrink:0;}
.pi-tag{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;white-space:nowrap;}
.pi-inq{font-size:9px;color:${T.teal};font-weight:700;font-family:'JetBrains Mono',monospace;}
.pal-footer{display:flex;gap:14px;align-items:center;padding:8px 16px;border-top:1px solid ${T.bd};background:rgba(5,15,30,.6);}
.pf-hint{display:flex;align-items:center;gap:5px;font-size:10px;color:${T.txt4};}
.pf-k{font-family:'JetBrains Mono',monospace;font-size:9px;background:${T.bgU};border:1px solid ${T.bd};border-radius:3px;padding:1px 5px;color:${T.txt3};}
.pal-trigger{font-family:'JetBrains Mono',monospace;font-size:10px;color:${T.txt4};background:${T.bgU};border:1px solid ${T.bd};border-radius:5px;padding:3px 8px;cursor:pointer;flex-shrink:0;transition:all .15s;}
.pal-trigger:hover{border-color:${T.bdH};color:${T.txt2};}

/* ── ALSO CONSIDER ── */
.sugg-section{flex-shrink:0;border-top:1px solid rgba(245,200,66,.2);background:rgba(245,200,66,.03);animation:suggIn .22s cubic-bezier(.22,1,.36,1);}
@keyframes suggIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.sugg-hdr{display:flex;align-items:center;gap:6px;padding:8px 11px 4px;font-size:10px;font-weight:700;color:${T.gold};letter-spacing:.04em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
.sugg-hdr-ic{font-size:11px;}
.sugg-dismiss-all{margin-left:auto;background:none;border:none;color:${T.txt4};font-size:10px;cursor:pointer;padding:2px 5px;border-radius:3px;font-family:'DM Sans',sans-serif;transition:color .15s;}
.sugg-dismiss-all:hover{color:${T.coral};}
.sugg-list{padding:0 9px 8px;display:flex;flex-direction:column;gap:4px;}
.sugg-item{display:flex;align-items:center;gap:8px;padding:7px 9px;background:${T.bgC};border:1px solid rgba(245,200,66,.16);border-radius:8px;transition:border-color .15s;animation:qin .18s ease-out;}
.sugg-item:hover{border-color:rgba(245,200,66,.38);}
.sugg-ic{font-size:14px;flex-shrink:0;}
.sugg-body{flex:1;min-width:0;}
.sugg-name{font-size:11px;font-weight:600;color:${T.txt};line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sugg-reason{font-size:9px;color:${T.txt3};margin-top:2px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sugg-add{padding:3px 10px;font-size:10px;font-weight:700;background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.3);border-radius:5px;color:${T.gold};cursor:pointer;font-family:'JetBrains Mono',monospace;flex-shrink:0;transition:all .15s;white-space:nowrap;}
.sugg-add:hover{background:rgba(245,200,66,.22);border-color:rgba(245,200,66,.55);}

/* ── ALLERGY ALTERNATIVES ── */
.allergy-alts{flex-shrink:0;background:rgba(255,107,107,.04);border-top:1px solid rgba(255,107,107,.22);animation:suggIn .22s cubic-bezier(.22,1,.36,1);}
.allergy-alts-hdr{display:flex;align-items:flex-start;gap:8px;padding:9px 11px 4px;}
.allergy-alts-icon{font-size:15px;flex-shrink:0;}
.allergy-alts-title{font-size:10px;font-weight:700;color:#ff6b6b;text-transform:uppercase;letter-spacing:.05em;font-family:'JetBrains Mono',monospace;flex:1;line-height:1.4;}
.allergy-alts-sub{font-size:9px;color:#a8c8e8;margin-top:1px;font-weight:400;text-transform:none;letter-spacing:0;font-family:'DM Sans',sans-serif;}
.allergy-alts-dismiss{background:none;border:none;color:#7aa0c0;font-size:11px;cursor:pointer;padding:0 3px;transition:color .15s;flex-shrink:0;margin-top:1px;}
.allergy-alts-dismiss:hover{color:#ff6b6b;}
.alt-list{padding:0 9px 8px;display:flex;flex-direction:column;gap:5px;}
.alt-item{background:#0b1e36;border:1px solid rgba(255,107,107,.2);border-radius:9px;padding:8px 10px;transition:border-color .15s;}
.alt-item:hover{border-color:rgba(255,107,107,.4);}
.alt-top{display:flex;align-items:center;gap:7px;margin-bottom:3px;}
.alt-icon{font-size:14px;flex-shrink:0;}
.alt-name{font-size:11px;font-weight:600;color:#ffffff;flex:1;}
.alt-risk{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;flex-shrink:0;white-space:nowrap;}
.alt-risk.xr-none{background:rgba(61,255,160,.1);color:#3dffa0;border:1px solid rgba(61,255,160,.28);}
.alt-risk.xr-low{background:rgba(245,200,66,.1);color:#f5c842;border:1px solid rgba(245,200,66,.28);}
.alt-risk.xr-monitor{background:rgba(255,159,67,.1);color:#ff9f43;border:1px solid rgba(255,159,67,.28);}
.alt-reason{font-size:9px;color:#a8c8e8;line-height:1.4;margin-bottom:2px;}
.alt-note{font-size:9px;color:#7aa0c0;font-style:italic;line-height:1.35;margin-bottom:5px;}
.alt-add{width:100%;padding:4px 10px;font-size:10px;font-weight:700;background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);border-radius:5px;color:#ff6b6b;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;text-align:center;}
.alt-add:hover{background:rgba(255,107,107,.22);border-color:rgba(255,107,107,.55);}
.alt-protocol{margin:0 9px 8px;background:rgba(245,200,66,.05);border:1px solid rgba(245,200,66,.18);border-radius:7px;padding:7px 9px;}
.alt-proto-lbl{font-size:8px;font-weight:700;color:#f5c842;text-transform:uppercase;letter-spacing:.07em;font-family:'JetBrains Mono',monospace;margin-bottom:3px;}
.alt-proto-txt{font-size:9px;color:#a8c8e8;line-height:1.5;}

/* ── TIME-CRITICAL TIMERS ── */
.timers-wrap{flex-shrink:0;display:flex;flex-direction:column;gap:5px;padding:8px 9px 6px;border-bottom:1px solid ${T.bd};background:rgba(5,12,25,.4);}
.timer-card{background:${T.bgC};border-radius:10px;padding:9px 11px 8px;border:1px solid ${T.bd};transition:border-color .4s;}
.timer-card.phase-green{border-color:rgba(61,255,160,.3);}
.timer-card.phase-amber{border-color:rgba(245,200,66,.38);}
.timer-card.phase-red{border-color:rgba(255,107,107,.5);animation:tpulse 1.8s ease-in-out infinite;}
.timer-card.phase-done{border-color:rgba(0,229,192,.42);}
@keyframes tpulse{0%,100%{box-shadow:none;}50%{box-shadow:0 0 0 3px rgba(255,107,107,.12);}}
.timer-top{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
.timer-icon{font-size:13px;flex-shrink:0;}
.timer-label{font-size:11px;font-weight:700;color:${T.txt};flex:1;line-height:1.2;}
.timer-done-badge{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;color:${T.teal};background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);border-radius:3px;padding:1px 6px;flex-shrink:0;}
.timer-dismiss{background:none;border:none;color:${T.txt4};font-size:11px;cursor:pointer;padding:0 3px;transition:color .15s;flex-shrink:0;}
.timer-dismiss:hover{color:${T.coral};}
.timer-bar-bg{height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;margin-bottom:5px;}
.timer-bar-fill{height:100%;border-radius:3px;transition:width 1s linear,background .8s ease;}
.timer-bottom{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}
.timer-elapsed{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;line-height:1;flex-shrink:0;}
.timer-meta{display:flex;flex-direction:column;align-items:flex-end;gap:1px;min-width:0;}
.timer-remaining{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;text-align:right;}
.timer-guideline{font-size:9px;color:${T.txt4};text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const BAR='━'.repeat(46);
const ts=()=>{const d=new Date();return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};
const fmt=n=>Math.round(n).toLocaleString();
const pad=(s,n=12)=>s.padEnd(n,' ');
const bline=(k,v)=>`${pad(k+':')} ${v}`;
const buildBlock=(name,rows,note)=>{const body=rows.map(([k,v])=>bline(k,v)).join('\n');return`${BAR}\n${body}${note?`\n${BAR}\n⚠  ${note}`:''}\n${BAR}\n[Notrya · ${ts()}]`;};
async function copyText(t){try{await navigator.clipboard.writeText(t);return true;}catch{const e=document.createElement('textarea');e.value=t;document.body.appendChild(e);e.select();document.execCommand('copy');document.body.removeChild(e);return true;}}

// ── Allergy map ───────────────────────────────────────────────────────────────
const AMAP={contrast:{name:'Iodinated Contrast',sev:'Moderate',reaction:'Urticaria'},codeine:{name:'Codeine',sev:'Mild',reaction:'Nausea/Vomiting'},pcn:{name:'Penicillin',sev:'SEVERE',reaction:'Anaphylaxis'}};
function getAllergyWarn(o){if(o.alert&&AMAP[o.alert])return AMAP[o.alert];if(o.contrast&&AMAP.contrast)return AMAP.contrast;return null;}

// ── Non-medication orders ─────────────────────────────────────────────────────
const SIMPLE=[
  {id:'l_trop',cat:'labs',sub:'Cardiac',icon:'❤️',name:'Troponin-I (High Sensitivity)',detail:'Serial q3h · NSTEMI protocol',meta:'~30 min',priority:'STAT',alert:null,contrast:false},
  {id:'l_bnp',cat:'labs',sub:'Cardiac',icon:'❤️',name:'BNP (B-Natriuretic Peptide)',detail:'Heart failure marker',meta:'~45 min',priority:'STAT',alert:null,contrast:false},
  {id:'l_ckmb',cat:'labs',sub:'Cardiac',icon:'❤️',name:'CK-MB',detail:'Cardiac isoenzyme',meta:'~45 min',priority:'URGENT',alert:null,contrast:false},
  {id:'l_bmp',cat:'labs',sub:'Metabolic',icon:'🧪',name:'BMP (Basic Metabolic Panel)',detail:'Na, K, Cl, CO₂, BUN, Cr, Glu',meta:'~30 min',priority:'STAT',alert:null,contrast:false},
  {id:'l_cmp',cat:'labs',sub:'Metabolic',icon:'🧪',name:'CMP (Comprehensive Metabolic)',detail:'Full metabolic + LFTs',meta:'~45 min',priority:'ROUTINE',alert:null,contrast:false},
  {id:'l_mg',cat:'labs',sub:'Metabolic',icon:'🧪',name:'Magnesium (Serum)',detail:'Electrolyte monitoring',meta:'~30 min',priority:'ROUTINE',alert:null,contrast:false},
  {id:'l_lac',cat:'labs',sub:'Metabolic',icon:'🧪',name:'Lactate (Serum)',detail:'Perfusion / shock marker',meta:'~25 min',priority:'URGENT',alert:null,contrast:false},
  {id:'l_a1c',cat:'labs',sub:'Metabolic',icon:'🩸',name:'HbA1c',detail:'Diabetes monitoring',meta:'~2 hr',priority:'ROUTINE',alert:null,contrast:false},
  {id:'l_bhcg',cat:'labs',sub:'Metabolic',icon:'🩸',name:'β-hCG (Quantitative)',detail:'Pregnancy test',meta:'~45 min',priority:'STAT',alert:null,contrast:false},
  {id:'l_ua',cat:'labs',sub:'Metabolic',icon:'🧪',name:'Urinalysis + Culture',detail:'UTI, pyelo, renal eval',meta:'~30 min / 48h Cx',priority:'ROUTINE',alert:null,contrast:false},
  {id:'l_etoh',cat:'labs',sub:'Tox/Psych',icon:'🧪',name:'Ethanol Level (Serum)',detail:'Quantitative ETOH · toxicology',meta:'~45 min',priority:'STAT',alert:null,contrast:false},
  {id:'l_utox',cat:'labs',sub:'Tox/Psych',icon:'🧪',name:'Urine Drug Screen (Comprehensive)',detail:'Multi-panel UDS · immunoassay',meta:'~60 min',priority:'URGENT',alert:null,contrast:false},
  {id:'l_tsh',cat:'labs',sub:'Tox/Psych',icon:'🧪',name:'TSH (Thyroid Stimulating Hormone)',detail:'Thyroid function — AMS, agitation workup',meta:'~2 hr',priority:'ROUTINE',alert:null,contrast:false},
  {id:'l_cbc',cat:'labs',sub:'Hematology',icon:'🩸',name:'CBC with Differential',detail:'Complete blood count + diff',meta:'~30 min',priority:'STAT',alert:null,contrast:false},
  {id:'l_coag',cat:'labs',sub:'Hematology',icon:'🩸',name:'PT / INR / PTT',detail:'PTT goal 60–100 on heparin',meta:'~30 min',priority:'STAT',alert:null,contrast:false},
  {id:'l_type',cat:'labs',sub:'Hematology',icon:'🩸',name:'Type & Screen',detail:'Blood bank · pre-procedure',meta:'Blood Bank',priority:'URGENT',alert:null,contrast:false},
  {id:'i_cxr',cat:'imaging',sub:'X-Ray',icon:'🫁',name:'Chest X-Ray PA / Lateral',detail:'Cardiomegaly, pulm edema, effusion',meta:'XR · ~15 min',priority:'STAT',alert:null,contrast:false},
  {id:'i_tte',cat:'imaging',sub:'Echo',icon:'❤️',name:'Echocardiogram (TTE)',detail:'LV function, wall motion, EF',meta:'Echo · ~45 min',priority:'URGENT',alert:null,contrast:false},
  {id:'i_ctpe',cat:'imaging',sub:'CT',icon:'🩻',name:'CT Pulmonary Angiography',detail:'R/O pulmonary embolism',meta:'CT W · ~30 min',priority:'STAT',alert:'contrast',contrast:true},
  {id:'i_ctca',cat:'imaging',sub:'CT',icon:'🩻',name:'CT Coronary Angiography',detail:'Non-invasive coronary imaging',meta:'CT W · ~45 min',priority:'URGENT',alert:'contrast',contrast:true},
  {id:'i_cthead',cat:'imaging',sub:'CT',icon:'🩻',name:'CT Head (Non-Contrast)',detail:'R/O ICH, stroke, mass',meta:'CT · ~20 min',priority:'STAT',alert:null,contrast:false},
  {id:'i_ctabd',cat:'imaging',sub:'CT',icon:'🩻',name:'CT Abdomen / Pelvis',detail:'Acute abdomen, appy, diverticulitis',meta:'CT W/WO · ~30 min',priority:'URGENT',alert:'contrast',contrast:true},
  {id:'p_ecg',cat:'procedures',sub:'Cardiac',icon:'⚡',name:'12-Lead ECG',detail:'ST changes, rhythm eval',meta:'~5 min · Bedside',priority:'STAT',alert:null,contrast:false},
  {id:'p_ecg_s',cat:'procedures',sub:'Cardiac',icon:'⚡',name:'Serial 12-Lead ECG (q4h × 3)',detail:'NSTEMI monitoring protocol',meta:'~5 min each',priority:'URGENT',alert:null,contrast:false},
  {id:'p_tele',cat:'procedures',sub:'Monitoring',icon:'📡',name:'Continuous Cardiac Telemetry',detail:'Real-time arrhythmia monitoring',meta:'Ongoing',priority:'STAT',alert:null,contrast:false},
  {id:'p_o2',cat:'procedures',sub:'Monitoring',icon:'💨',name:'Supplemental O₂ — 2L NC',detail:'SpO₂ target ≥ 94%',meta:'Ongoing',priority:'STAT',alert:null,contrast:false},
  {id:'p_iv2',cat:'procedures',sub:'Access',icon:'💉',name:'Peripheral IV × 2 Large Bore',detail:'18G+ — antecubital preferred',meta:'Bedside',priority:'STAT',alert:null,contrast:false},
  {id:'p_1to1',cat:'procedures',sub:'Safety',icon:'🛡️',name:'1:1 Nursing Observation',detail:'Continuous monitoring — behavioral health',meta:'Ongoing',priority:'STAT',alert:null,contrast:false},
  {id:'p_rest',cat:'procedures',sub:'Safety',icon:'🔒',name:'Soft Restraints (4-point)',detail:'PRN agitation — document Q15 min',meta:'PRN · Ongoing',priority:'URGENT',alert:null,contrast:false},
  {id:'c_cards',cat:'consults',sub:'Medical',icon:'🩺',name:'Cardiology Consult',detail:'NSTEMI mgmt, cath lab decision',meta:'URGENT',priority:'URGENT',alert:null,contrast:false},
  {id:'c_surg',cat:'consults',sub:'Medical',icon:'🩺',name:'General Surgery Consult',detail:'Acute abdomen, appendicitis eval',meta:'URGENT',priority:'URGENT',alert:null,contrast:false},
  {id:'c_neuro',cat:'consults',sub:'Medical',icon:'🩺',name:'Neurology Consult',detail:'Stroke eval, seizure management',meta:'STAT',priority:'STAT',alert:null,contrast:false},
  {id:'c_psych',cat:'consults',sub:'Behavioral',icon:'🧠',name:'Psychiatry Consult',detail:'Capacity eval, disposition, safety plan',meta:'URGENT',priority:'URGENT',alert:null,contrast:false},
  {id:'c_addx',cat:'consults',sub:'Behavioral',icon:'🤝',name:'Addiction Medicine / SBIRT',detail:'ETOH / opioid use — treatment linkage',meta:'ROUTINE',priority:'ROUTINE',alert:null,contrast:false},
  {id:'c_pharm',cat:'consults',sub:'Support',icon:'💊',name:'Pharmacy Consult',detail:'Drip adjustment, med reconcile',meta:'ROUTINE',priority:'ROUTINE',alert:null,contrast:false},
  {id:'c_sw',cat:'consults',sub:'Support',icon:'🤝',name:'Social Work Consult',detail:'Disposition, resources, safety',meta:'ROUTINE',priority:'ROUTINE',alert:null,contrast:false},
];

// ── Medication catalog ────────────────────────────────────────────────────────
const DRUGS=[
  // ── Cardiac ──
  {id:'asa',cat:'cardiac',icon:'💊',name:'Aspirin',sub:'ASA 325 mg',cor:'I',wtBased:false,scenarios:[{label:'ACS Load',build:()=>buildBlock('Aspirin',[['DRUG','Aspirin (ASA)'],['DOSE','325 mg — CHEW × 1, then 81 mg daily'],['ROUTE','Oral (PO)'],['INDICATION','ACS — STEMI/NSTEMI/UA  [COR I-A  2025 ACC/AHA]']],'Omit if aspirin allergy — substitute P2Y₁₂ monotherapy')}]},
  {id:'tica',cat:'cardiac',icon:'💊',name:'Ticagrelor',sub:'Brilinta 180 mg load',cor:'I',wtBased:false,scenarios:[{label:'ACS Load',build:()=>buildBlock('Ticagrelor',[['DRUG','Ticagrelor (Brilinta)'],['DOSE','180 mg PO — loading dose, swallow whole'],['THEN','90 mg BID × 12 months'],['INDICATION','ACS — NSTEMI/STEMI  [COR I-B  2025 ACC/AHA]']],'Hold if CABG planned < 5 days · Avoid: prior ICH, active bleed')}]},
  {id:'clopi',cat:'cardiac',icon:'💊',name:'Clopidogrel',sub:'Plavix 600 mg load',cor:'I',wtBased:false,scenarios:[{label:'ACS Load (alt P2Y₁₂)',build:()=>buildBlock('Clopidogrel',[['DRUG','Clopidogrel (Plavix)'],['DOSE','600 mg PO — loading dose'],['THEN','75 mg daily'],['INDICATION','ACS alternative P2Y₁₂  [COR I-B]']],'Check CYP2C19 metabolizer status — poor metabolizers have reduced efficacy')}]},
  {id:'heparin',cat:'cardiac',icon:'🩸',name:'Heparin UFH',sub:'Weight-based bolus + drip',cor:'I',wtBased:true,scenarios:[
    {label:'STEMI / PCI',build:(wt)=>{const b=fmt(Math.min(wt*60,4000));const i=fmt(Math.round(wt*12));return buildBlock('Heparin UFH',[['DRUG','Heparin (Unfractionated UFH)'],['BOLUS',`${b} units IV push  [60 u/kg × ${wt} kg, max 4,000 u]`],['DRIP',`${i} units/hr  [12 u/kg/hr × ${wt} kg]`],['INDICATION','STEMI — PCI anticoagulation  [COR I-C  2025]']],'Monitor ACT during PCI · Target aPTT 50–70 sec post-procedure');}},
    {label:'NSTEMI / Medical Rx',build:(wt)=>{const b=fmt(Math.min(wt*60,5000));const i=fmt(Math.min(Math.round(wt*12),1000));return buildBlock('Heparin UFH',[['DRUG','Heparin (Unfractionated UFH)'],['BOLUS',`${b} units IV push  [60 u/kg × ${wt} kg, max 5,000 u]`],['DRIP',`${i} units/hr  [12 u/kg/hr, max 1,000 u/hr]`],['INDICATION','NSTEMI — medical anticoagulation  [COR I-B]']],'Titrate per hospital nomogram · Target aPTT 50–70 sec');}},
  ]},
  {id:'enox',cat:'cardiac',icon:'🩸',name:'Enoxaparin',sub:'Lovenox — SQ',cor:'I',wtBased:true,scenarios:[{label:'NSTEMI Treatment',build:(wt)=>buildBlock('Enoxaparin',[['DRUG','Enoxaparin (Lovenox)'],['DOSE',`${fmt(wt)} mg SQ  [1 mg/kg × ${wt} kg]`],['FREQUENCY','Every 12 hours'],['INDICATION','NSTEMI anticoagulation  [COR I-A  2025]']],'Reduce to 1 mg/kg daily if CrCl < 30 · Avoid if CrCl < 15 or HD-dependent')}]},
  {id:'tnk',cat:'cardiac',icon:'💉',name:'Tenecteplase',sub:'TNKase — STEMI lytics',cor:'I',wtBased:true,scenarios:[{label:'STEMI Fibrinolysis',build:(wt)=>{const w=parseFloat(wt)||0;const d=w<60?30:w<70?35:w<80?40:w<90?45:50;return buildBlock('Tenecteplase',[['DRUG','Tenecteplase (TNKase)'],['DOSE',`${d} mg IV bolus over 5–10 sec  [${wt} kg]`],['VOLUME',`${d/5} mL from reconstituted 5 mg/mL vial`],['INDICATION','STEMI fibrinolysis — PCI unavailable or delay > 120 min  [COR I-A]']],'ABS CI: prior ICH, stroke < 3 mo, active bleed, aortic dissection — verify ALL before giving');}}]},
  {id:'statin',cat:'cardiac',icon:'💊',name:'Atorvastatin',sub:'Lipitor 80 mg — ACS',cor:'I',wtBased:false,scenarios:[{label:'ACS High-Intensity',build:()=>buildBlock('Atorvastatin',[['DRUG','Atorvastatin (Lipitor) — HIGH INTENSITY'],['DOSE','80 mg PO — first dose STAT, then nightly'],['INDICATION','ACS — plaque stabilization + LDL reduction  [COR I-A  2025]']],'Avoid simvastatin/lovastatin concurrently with many ACS medications')}]},
  {id:'metro_iv',cat:'cardiac',icon:'💊',name:'Metoprolol IV',sub:'Lopressor — rate control',cor:'IIa',wtBased:false,scenarios:[{label:'IV Rate Control / ACS',build:()=>buildBlock('Metoprolol Tartrate',[['DRUG','Metoprolol tartrate (Lopressor)'],['DOSE','5 mg IV over 2–5 min'],['REPEAT','May repeat q5 min × 3 doses (max 15 mg)'],['INDICATION','ACS beta-blockade OR rate control — hemodynamically stable  [COR IIa]']],'CI: HR < 60, SBP < 100, bronchospasm, 2°/3° AVB, decompensated HF')}]},
  {id:'nitro_sl',cat:'cardiac',icon:'💊',name:'Nitroglycerin SL',sub:'NTG 0.4 mg',cor:'I',wtBased:false,scenarios:[{label:'ACS Sublingual',build:()=>buildBlock('Nitroglycerin',[['DRUG','Nitroglycerin (NTG)'],['DOSE','0.4 mg SL tablet or spray'],['FREQUENCY','Repeat q5 min × 3 prn; if ongoing pain → IV drip'],['INDICATION','ACS — ongoing chest pain  [COR I-B]']],'CI: SBP < 90, PDE inhibitor use w/in 24–48h, RV infarct')}]},
  // ── Arrhythmia ──
  {id:'adenosine',cat:'rhythm',icon:'⚡',name:'Adenosine',sub:'Adenocard — SVT',cor:'I',wtBased:false,scenarios:[{label:'SVT Termination',build:()=>buildBlock('Adenosine',[['DRUG','Adenosine (Adenocard)'],['DOSE','6 mg IV RAPID push — proximal IV'],['FLUSH','20 mL NS rapid flush IMMEDIATELY after'],['REPEAT','12 mg IV if no conversion in 1–2 min; then 12 mg × 1'],['INDICATION','Stable SVT — termination and diagnosis  [COR I-B  ACLS 2025]']],'Warn pt: asystole < 30 sec, chest pressure, dyspnea · Never use in pre-excited AFib or WPW')}]},
  {id:'diltia',cat:'rhythm',icon:'💊',name:'Diltiazem',sub:'Cardizem — AFib rate',cor:'I',wtBased:true,scenarios:[{label:'AFib Rate Control',build:(wt)=>{const b=fmt(wt*0.25);const b2=fmt(wt*0.35);return buildBlock('Diltiazem',[['DRUG','Diltiazem (Cardizem)'],['DOSE',`${b} mg IV over 2 min  [0.25 mg/kg × ${wt} kg, max 25 mg]`],['REPEAT',`${b2} mg in 15 min if inadequate  [0.35 mg/kg, max 35 mg]`],['THEN','5–15 mg/hr infusion — titrate to HR < 110 bpm'],['INDICATION','AFib / Aflutter rate control  [COR I-B]']],'CI: EF < 40%, accessory pathway, WPW · Monitor BP — significant vasodilation');}}]},
  {id:'amio_iv',cat:'rhythm',icon:'💉',name:'Amiodarone IV',sub:'Cordarone — VT/VF/AFib',cor:'IIa',wtBased:false,scenarios:[
    {label:'VT / Refractory VF',build:()=>buildBlock('Amiodarone',[['DRUG','Amiodarone (Cordarone)'],['DOSE','150 mg IV over 10 min (loading)'],['THEN','1 mg/min × 6 hr, then 0.5 mg/min × 18 hr'],['INDICATION','Stable VT / refractory VF/pVT  [COR IIa-B  ACLS 2025]']],'Dilute in D5W · Non-PVC tubing preferred · Monitor QT, BP')},
    {label:'AFib Cardioversion',build:()=>buildBlock('Amiodarone',[['DRUG','Amiodarone (Cordarone)'],['DOSE','150 mg IV over 10 min'],['THEN','1 mg/min × 6 hr, then 0.5 mg/min × 18 hr (total 1 g/24h)'],['INDICATION','AFib chemical cardioversion — hemodynamically stable  [COR IIb]']],'Less effective than ibutilide for acute AFib · QT monitoring required')},
  ]},
  {id:'procain',cat:'rhythm',icon:'💉',name:'Procainamide',sub:'Pronestyl — stable VT',cor:'IIa',wtBased:true,scenarios:[{label:'Stable Monomorphic VT',build:(wt)=>buildBlock('Procainamide',[['DRUG','Procainamide (Pronestyl)'],['DOSE','20–50 mg/min IV until VT suppressed, QRS widens > 50%, or hypotension'],['MAX',`${fmt(wt*17)} mg total  [17 mg/kg × ${wt} kg]`],['THEN','1–4 mg/min maintenance IV'],['INDICATION','Stable monomorphic VT  [COR IIa-B  ACLS 2025]']],'AVOID: prolonged QT, HF, severe LV dysfunction · Preferred over amiodarone for stable VT')}]},
  {id:'mag_iv',cat:'rhythm',icon:'⚡',name:'Magnesium Sulfate',sub:'MgSO₄ — TdP / hypoMg',cor:'IIb',wtBased:false,scenarios:[{label:'Torsades de Pointes',build:()=>buildBlock('Magnesium Sulfate',[['DRUG','Magnesium Sulfate (MgSO₄)'],['DOSE','2 g IV over 5–20 min  (arrest: 1–2 min)'],['THEN','0.5–1 g/hr infusion for recurrence'],['INDICATION','Torsades de Pointes — first-line  [COR IIb-C  ACLS 2025]']],'Correct hypokalemia simultaneously · Monitor DTRs for toxicity')}]},
  {id:'atropine',cat:'rhythm',icon:'⚡',name:'Atropine',sub:'Bradycardia — first-line',cor:'I',wtBased:false,scenarios:[{label:'Symptomatic Bradycardia',build:()=>buildBlock('Atropine',[['DRUG','Atropine Sulfate'],['DOSE','1 mg IV bolus'],['REPEAT','q3–5 min, max 3 mg total (0.04 mg/kg)'],['INDICATION','Symptomatic bradycardia — first-line  [COR I-B  ACLS 2025]']],'Ineffective for Mobitz II / CHB → proceed immediately to TCP or pacing')}]},
  // ── Vasopressors ──
  {id:'norepi',cat:'pressors',icon:'💉',name:'Norepinephrine',sub:'Levophed — sepsis 1st-line',cor:'I',wtBased:true,scenarios:[{label:'Septic Shock',build:(wt)=>buildBlock('Norepinephrine',[['DRUG','Norepinephrine (Levophed)'],['MIX','4 mg in 250 mL D5W = 16 mcg/mL  |  8 mg in 250 mL = 32 mcg/mL'],['START',`${(wt*0.1).toFixed(1)} mcg/min  [0.1 mcg/kg/min × ${wt} kg]`],['TITRATE','Increase 0.05–0.1 mcg/kg/min q5–10 min prn'],['RANGE','0.01–3 mcg/kg/min  (typical 0.1–0.5)'],['INDICATION','Septic shock — first-line vasopressor  [COR I-B  SSC 2021]']],'Central line/arterial line ASAP · Target MAP ≥ 65 mmHg')}]},
  {id:'epi_anap',cat:'pressors',icon:'💉',name:'Epinephrine',sub:'Anaphylaxis / pressor drip',cor:'I',wtBased:true,scenarios:[
    {label:'Anaphylaxis — IM',build:()=>buildBlock('Epinephrine',[['DRUG','Epinephrine 1:1,000'],['DOSE','0.3 mg IM (0.3 mL of 1 mg/mL)'],['ROUTE','Anterolateral thigh — IM'],['REPEAT','q5–15 min prn if no improvement'],['INDICATION','Anaphylaxis — first-line  [COR I-A  WAO 2020]']],'Preferred over IV · Prepare IV drip if biphasic reaction')},
    {label:'Pressor Infusion',build:(wt)=>buildBlock('Epinephrine Infusion',[['DRUG','Epinephrine Infusion'],['MIX','1 mg in 250 mL NS = 4 mcg/mL'],['START','2 mcg/min IV — titrate 2–10 mcg/min'],['INDICATION','Refractory bradycardia or anaphylactic shock  [COR IIa-B]']])},
  ]},
  {id:'dopa',cat:'pressors',icon:'💉',name:'Dopamine',sub:'Cardiogenic shock',cor:'IIb',wtBased:true,scenarios:[{label:'Cardiogenic Shock',build:(wt)=>buildBlock('Dopamine',[['DRUG','Dopamine HCl'],['MIX','400 mg in 250 mL D5W = 1,600 mcg/mL'],['START',`${fmt(wt*5)} mcg/min  [5 mcg/kg/min × ${wt} kg]`],['TITRATE','5–20 mcg/kg/min to target MAP/HR'],['INDICATION','Cardiogenic/distributive shock  [COR IIb]']],'Norepinephrine preferred over dopamine in septic shock — less arrhythmia')}]},
  // ── Antibiotics ──
  {id:'vanc',cat:'abx',icon:'🦠',name:'Vancomycin',sub:'MRSA / gram-positive',cor:null,wtBased:true,scenarios:[{label:'Sepsis / SSTI / CAP',build:(wt)=>buildBlock('Vancomycin',[['DRUG','Vancomycin HCl'],['DOSE',`${fmt(Math.min(Math.round(wt*25),3000))} mg IV  [25 mg/kg × ${wt} kg, max 3,000 mg]`],['RATE','Over 1–2 hr  (no faster than 10 mg/min)'],['FREQUENCY','Q8–12h — renal dosing per pharmacy'],['INDICATION','MRSA / gram-positive — sepsis, SSTI, CAP, HAP']],'AUC/MIC-guided dosing preferred · Trough before 4th dose · CrCl < 50 → reduce · Redman → slow infusion')}]},
  {id:'piptz',cat:'abx',icon:'🦠',name:'Pip-Tazo',sub:'Zosyn — broad spectrum',cor:null,wtBased:false,alert:'pcn',contrast:false,scenarios:[{label:'Broad Spectrum Sepsis',build:()=>buildBlock('Piperacillin-Tazobactam',[['DRUG','Pip-Tazobactam (Zosyn)'],['DOSE','4.5 g IV  (4 g pip + 0.5 g tazo)'],['RATE','Over 30 min  (extended: 4 hr for severe sepsis)'],['FREQUENCY','Q6–8h; Q6h for severe; adjust for CrCl < 40'],['INDICATION','Broad spectrum — sepsis, HAP, intra-abdominal, UTI']],'Do NOT mix with aminoglycosides · Extended 4-hr infusion improves PK/PD attainment')}]},
  {id:'cefep',cat:'abx',icon:'🦠',name:'Cefepime',sub:'Maxipime — gram-negative',cor:null,wtBased:false,scenarios:[{label:'HAP / Febrile Neutropenia',build:()=>buildBlock('Cefepime',[['DRUG','Cefepime (Maxipime)'],['DOSE','2 g IV over 30 min'],['FREQUENCY','Q8h severe; Q12h mild/moderate; adjust for CrCl < 60'],['INDICATION','HAP, febrile neutropenia, gram-negative bacteremia, Pseudomonas']],'Neurotoxicity risk with renal impairment — monitor closely')}]},
  {id:'ceftx',cat:'abx',icon:'🦠',name:'Ceftriaxone',sub:'Rocephin',cor:null,wtBased:false,scenarios:[{label:'CAP / UTI / Meningitis',build:()=>buildBlock('Ceftriaxone',[['DRUG','Ceftriaxone (Rocephin)'],['DOSE','1 g IV over 30 min  (2 g for meningitis / severe sepsis)'],['FREQUENCY','Q12h (meningitis) or Daily (CAP, UTI, skin)'],['INDICATION','CAP, UTI, pyelonephritis, meningitis, Lyme, gonorrhea']],'Avoid with Ca-containing fluids in same line · Safe in renal impairment')}]},
  {id:'azithro',cat:'abx',icon:'🦠',name:'Azithromycin',sub:'Zithromax — atypical CAP',cor:null,wtBased:false,scenarios:[{label:'CAP Atypical Coverage',build:()=>buildBlock('Azithromycin',[['DRUG','Azithromycin (Zithromax)'],['DOSE','500 mg IV over 60 min'],['FREQUENCY','Daily (switch PO when tolerating)'],['INDICATION','CAP atypical coverage — Legionella, Mycoplasma, Chlamydia']],'QTc prolongation — baseline ECG · Combine with beta-lactam for hospitalized CAP per IDSA/ATS')}]},
  // ── RSI / Sedation ──
  {id:'etom',cat:'sedation',icon:'😴',name:'Etomidate',sub:'Amidate — RSI induction',cor:null,wtBased:true,scenarios:[{label:'RSI Induction',build:(wt)=>buildBlock('Etomidate',[['DRUG','Etomidate (Amidate)'],['DOSE',`${(wt*0.3).toFixed(1)} mg IV  [0.3 mg/kg × ${wt} kg]`],['ROUTE','IV push over 30–60 sec'],['ONSET','30–60 seconds'],['INDICATION','RSI induction — hemodynamically unstable patients']],'Single dose only · No analgesia — add fentanyl pre-treatment · Adrenal suppression: do NOT repeat')}]},
  {id:'ketamine',cat:'sedation',icon:'😴',name:'Ketamine',sub:'Ketalar — RSI / PSA',cor:null,wtBased:true,scenarios:[
    {label:'RSI Induction',build:(wt)=>buildBlock('Ketamine',[['DRUG','Ketamine (Ketalar)'],['DOSE',`${(wt*2).toFixed(0)} mg IV  [1.5–2 mg/kg × ${wt} kg]`],['ONSET','30–60 sec IV  |  IM: 3–5 min at 4–6 mg/kg'],['INDICATION','RSI induction — hemodynamically unstable, bronchospasm, trauma']],'Preserves airway reflexes + BP · Relative CI: severe hypertensive emergency')},
    {label:'Procedural Sedation',build:(wt)=>buildBlock('Ketamine',[['DRUG','Ketamine (Ketalar) — Dissociative'],['DOSE',`${(wt*1.5).toFixed(0)} mg IV  [1–1.5 mg/kg × ${wt} kg]  |  IM: ${(wt*4).toFixed(0)} mg`],['ROUTE','IV over 1–2 min'],['DURATION','10–20 min IV · 20–45 min IM'],['INDICATION','Procedural sedation — fracture reduction, I&D, painful procedures']],'Glycopyrrolate 0.2 mg IV reduces sialorrhea · Laryngospasm rare (<1%)')},
  ]},
  {id:'succs',cat:'sedation',icon:'😴',name:'Succinylcholine',sub:'Anectine — RSI paralytic',cor:null,wtBased:true,scenarios:[{label:'RSI Paralytic',build:(wt)=>buildBlock('Succinylcholine',[['DRUG','Succinylcholine (Anectine)'],['DOSE',`${(wt*1.5).toFixed(0)} mg IV  [1.5 mg/kg × ${wt} kg]`],['ONSET','45–60 seconds'],['DURATION','6–10 minutes'],['INDICATION','RSI — depolarizing paralytic']],'ABS CI: hyperkalemia, crush/burn > 24h, denervation, MH risk · Have sugammadex ready')}]},
  {id:'roc',cat:'sedation',icon:'😴',name:'Rocuronium',sub:'Zemuron — RSI paralytic',cor:null,wtBased:true,scenarios:[{label:'RSI Paralytic',build:(wt)=>{const d=(wt*1.2).toFixed(0);const s=(wt*16).toFixed(0);return buildBlock('Rocuronium',[['DRUG','Rocuronium (Zemuron)'],['DOSE',`${d} mg IV  [1.2 mg/kg × ${wt} kg]  high-dose RSI`],['ONSET','45–60 sec at high dose'],['DURATION','45–70 min'],['REVERSAL',`Sugammadex ${s} mg IV  [16 mg/kg] for IMMEDIATE reversal`],['INDICATION','RSI — preferred if succinylcholine CI']],'Keep sugammadex at bedside · Prolonged paralysis risk if failed airway');}}]},
  {id:'midaz',cat:'sedation',icon:'😴',name:'Midazolam',sub:'Versed — PSA / anxiolysis',cor:null,wtBased:true,scenarios:[{label:'Procedural Sedation',build:(wt)=>buildBlock('Midazolam',[['DRUG','Midazolam (Versed)'],['DOSE',`${(wt*0.05).toFixed(1)} mg IV  [0.05 mg/kg × ${wt} kg]  titrate to effect`],['REPEAT','0.025 mg/kg IV q2–3 min prn, max 0.2 mg/kg total'],['INDICATION','Procedural sedation, anxiolysis']],'REVERSAL: flumazenil 0.2 mg IV q1 min × 5 · Reduce 30% in elderly/hepatic impairment')}]},
  // ── Analgesia ──
  {id:'fent',cat:'pain',icon:'🩹',name:'Fentanyl',sub:'Sublimaze — IV/IN analgesia',cor:null,wtBased:true,scenarios:[{label:'IV Pain Management',build:(wt)=>buildBlock('Fentanyl',[['DRUG','Fentanyl Citrate (Sublimaze)'],['DOSE',`${(wt*1).toFixed(0)} mcg IV  [1 mcg/kg × ${wt} kg]`],['ROUTE','IV over 2–3 min  |  IN: 1.5 mcg/kg split nares'],['REPEAT','Titrate q5–10 min prn NRS ≥ 7'],['INDICATION','Moderate–severe acute pain — preferred in renal failure, hemodynamic instability']],'REVERSAL: naloxone 0.4 mg IV · 100× more potent than morphine')}]},
  {id:'morph',cat:'pain',icon:'🩹',name:'Morphine',sub:'IV analgesia',cor:null,wtBased:false,scenarios:[{label:'IV Pain Management',build:()=>buildBlock('Morphine Sulfate',[['DRUG','Morphine Sulfate'],['DOSE','2–4 mg IV — titrate to effect'],['ROUTE','IV over 2–5 min'],['REPEAT','q15–20 min prn NRS ≥ 7'],['INDICATION','Moderate–severe acute pain']],'REVERSAL: naloxone 0.4 mg IV · AVOID: hypotension, renal failure (active metabolite accumulates)')}]},
  {id:'ketor',cat:'pain',icon:'🩹',name:'Ketorolac',sub:'Toradol — non-opioid NSAID',cor:null,wtBased:false,scenarios:[{label:'IV Non-Opioid Analgesia',build:()=>buildBlock('Ketorolac',[['DRUG','Ketorolac (Toradol)'],['DOSE','15–30 mg IV  (30 mg IM)  — ↓ to 15 mg if > 65y or < 50 kg'],['ROUTE','IV over 2 min  OR  IM'],['FREQUENCY','Q6h prn, max 5 days total (IV + PO combined)'],['INDICATION','Moderate–severe pain — renal colic, MSK, headache']],'AVOID: CrCl < 30, active GI bleed, aspirin-sensitive asthma, concurrent anticoagulation')}]},
  {id:'apap',cat:'pain',icon:'🩹',name:'Acetaminophen',sub:'Ofirmev IV — safe in renal failure',cor:null,wtBased:true,scenarios:[{label:'IV Analgesia / Antipyretic',build:(wt)=>buildBlock('Acetaminophen',[['DRUG','Acetaminophen (Ofirmev IV)'],['DOSE',`${wt<50?'650 mg':'1,000 mg'} IV  [${wt} kg — max 4 g/24h]`],['RATE','Over 15 min'],['FREQUENCY','Q6h scheduled OR Q4–6h prn'],['INDICATION','Pain adjunct, antipyretic — safe in renal failure']],'Max 2 g/24h hepatic impairment / chronic ETOH · Multimodal analgesia reduces opioid needs')}]},
  // ── Psych / Behavioral Health ──
  {id:'haldo',cat:'psych',icon:'🧠',name:'Haloperidol',sub:'Haldol — acute agitation',cor:null,wtBased:false,scenarios:[
    {label:'Acute Agitation IM',build:()=>buildBlock('Haloperidol',[['DRUG','Haloperidol (Haldol)'],['DOSE','5 mg IM (moderate) — 10 mg IM (severe undifferentiated)'],['ROUTE','IM — anterolateral thigh or deltoid'],['REPEAT','May repeat 5 mg IM q30–60 min prn, max ~20 mg/24h'],['INDICATION','Acute agitation — antipsychotic  [ACEP Agitation Policy 2021]']],'Baseline QTc · Avoid if QTc > 500 ms · No respiratory depression unlike BZDs · Akathisia risk')},
    {label:'IV (Monitored)',build:()=>buildBlock('Haloperidol IV',[['DRUG','Haloperidol (Haldol) IV'],['DOSE','2–5 mg IV over 2–3 min'],['REPEAT','q20–30 min prn; may double dose if inadequate response'],['MAX','~20 mg in 24 hr'],['INDICATION','Acute delirium/agitation — monitored setting  [ACEP 2021]']],'Continuous QTc monitoring required for IV route · Reduce dose in elderly / hepatic impairment')},
  ]},
  {id:'droper',cat:'psych',icon:'🧠',name:'Droperidol',sub:'Inapsine — rapid agitation control',cor:null,wtBased:false,scenarios:[{label:'Acute Agitation',build:()=>buildBlock('Droperidol',[['DRUG','Droperidol (Inapsine)'],['DOSE','5 mg IM — may repeat 2.5 mg IM q15 min prn'],['MAX','10 mg per acute episode'],['ROUTE','IM preferred · IV with continuous monitoring'],['INDICATION','Acute undifferentiated agitation — faster onset than haloperidol  [ACEP 2021]']],'FDA Black Box warning — QTc monitoring required · Faster + more effective than haldol for undifferentiated agitation')}]},
  {id:'olanzIM',cat:'psych',icon:'🧠',name:'Olanzapine IM',sub:'Zyprexa — agitation with psychosis',cor:null,wtBased:false,scenarios:[{label:'Acute Agitation',build:()=>buildBlock('Olanzapine IM',[['DRUG','Olanzapine (Zyprexa) IM formulation'],['DOSE','10 mg IM (5 mg elderly/debilitated)'],['ROUTE','IM ONLY — do NOT give IV'],['REPEAT','5–10 mg IM q2–4h prn, max 30 mg/24h'],['INDICATION','Acute agitation — psychosis/bipolar mania  [ACEP 2021]']],'DO NOT combine with IM lorazepam — respiratory depression risk · Approved specifically for agitation associated with schizophrenia and bipolar disorder')}]},
  {id:'diaz',cat:'psych',icon:'🧠',name:'Diazepam',sub:'Valium — ETOH withdrawal / seizure',cor:null,wtBased:false,scenarios:[
    {label:'ETOH Withdrawal',build:()=>buildBlock('Diazepam',[['DRUG','Diazepam (Valium)'],['DOSE','10 mg IV — repeat q5–10 min prn for CIWA ≥ 15 or active seizure'],['ROUTE','IV preferred (PO/IM: less reliable absorption)'],['INDICATION','Alcohol withdrawal seizure / CIWA ≥ 15  [ASAM 2020, ACEP]']],'Long half-life provides smooth coverage — preferred for ETOH withdrawal seizure · Monitor respiratory drive · Reduce dose in elderly and cirrhotic patients')},
    {label:'Status Epilepticus (alt)',build:()=>buildBlock('Diazepam',[['DRUG','Diazepam (Valium)'],['DOSE','10 mg IV over 2 min'],['INDICATION','Status epilepticus — alternative if lorazepam unavailable']],'Shorter anticonvulsant duration than lorazepam · Follow with fosphenytoin or levetiracetam')},
  ]},
  // ── Supportive ──
  {id:'zofran',cat:'support',icon:'⚕️',name:'Ondansetron',sub:'Zofran — antiemetic',cor:null,wtBased:false,scenarios:[{label:'Nausea / Vomiting',build:()=>buildBlock('Ondansetron',[['DRUG','Ondansetron (Zofran)'],['DOSE','4 mg IV over 2–5 min  (8 mg for PONV / chemo-related)'],['FREQUENCY','Q4–6h prn nausea'],['INDICATION','Acute nausea and vomiting']],'QTc prolongation — avoid if QTc > 480 ms · Serotonin syndrome risk with serotonergic co-meds')}]},
  {id:'lzp',cat:'support',icon:'⚕️',name:'Lorazepam',sub:'Ativan — seizure / status',cor:null,wtBased:true,scenarios:[{label:'Status Epilepticus',build:(wt)=>buildBlock('Lorazepam',[['DRUG','Lorazepam (Ativan)'],['DOSE',`${(Math.min(wt*0.1,4)).toFixed(1)} mg IV  [0.1 mg/kg × ${wt} kg, max 4 mg]`],['ROUTE','IV over 2 min  (IM if no IV)'],['REPEAT','Repeat × 1 in 5–10 min if still seizing'],['INDICATION','Status epilepticus — first-line BZD  [AES 2023]']],'No IV: midazolam IM 10 mg (> 40 kg) · Have airway management ready')}]},
  {id:'labet',cat:'support',icon:'⚕️',name:'Labetalol',sub:'IV — hypertensive emergency',cor:null,wtBased:false,scenarios:[{label:'Hypertensive Emergency',build:()=>buildBlock('Labetalol',[['DRUG','Labetalol HCl'],['DOSE','20 mg IV over 2 min'],['REPEAT','Double q10 min prn: 40 → 80 mg; max single 80 mg; cumulative max 300 mg'],['THEN','0.5–2 mg/min infusion if needed'],['INDICATION','Hypertensive emergency — dissection, SAH, eclampsia  [AHA/ACC 2024]']],'CI: asthma/COPD, severe bradycardia, acute decompensated HF · Dual HR + BP control')}]},
  {id:'cacl',cat:'support',icon:'⚕️',name:'Calcium Chloride',sub:'10% CaCl₂ — hyperkalemia',cor:null,wtBased:false,scenarios:[{label:'Hyperkalemia / CCB OD / Arrest',build:()=>buildBlock('Calcium Chloride 10%',[['DRUG','Calcium Chloride 10%  (1 g = 13.6 mEq Ca²⁺)'],['DOSE','1 g (10 mL of 10%) IV slow push'],['RATE','Over 5–10 min  (arrest: 1–2 min)'],['REPEAT','q5–10 min prn (hyperkalemia / CCB OD)'],['INDICATION','Hyperkalemia, CCB toxicity, ionized hypocalcemia, cardiac arrest']],'3× more elemental Ca than gluconate · Central line preferred — vesicant')}]},
  {id:'bicarb',cat:'support',icon:'⚕️',name:'Sodium Bicarbonate',sub:'NaHCO₃ — TCA / acidosis',cor:null,wtBased:true,scenarios:[{label:'TCA OD / Severe Acidosis',build:(wt)=>buildBlock('Sodium Bicarbonate',[['DRUG','Sodium Bicarbonate (NaHCO₃)  8.4% = 1 mEq/mL'],['DOSE',`${fmt(wt)} mEq IV bolus  [1 mEq/kg × ${wt} kg]`],['ROUTE','IV push'],['INDICATION','TCA overdose, severe metabolic acidosis, hyperkalemia, Na-channel blockade']],'TCA OD: push until QRS < 100 ms, target pH 7.45–7.55 · Do NOT mix with calcium in same line')}]},
  {id:'d50',cat:'support',icon:'⚕️',name:'Dextrose 50%',sub:'D50W — hypoglycemia',cor:null,wtBased:false,scenarios:[{label:'Symptomatic Hypoglycemia',build:()=>buildBlock('Dextrose 50% (D50W)',[['DRUG','Dextrose 50% (D50W)'],['DOSE','25 g IV  (50 mL of D50W)'],['ROUTE','Large patent IV — sclerosing, irritating to veins'],['REPEAT','Recheck BG in 15 min; repeat if < 70 mg/dL'],['INDICATION','Symptomatic hypoglycemia — AMS, seizure, BG < 60 mg/dL']],'Give thiamine 100 mg IV BEFORE dextrose if malnourished / chronic ETOH · D10 250 mL/hr gentler alternative')}]},
  {id:'thiam',cat:'support',icon:'⚕️',name:'Thiamine',sub:'Vitamin B1 — ETOH / malnutrition',cor:null,wtBased:false,scenarios:[{label:'Wernicke Prophylaxis',build:()=>buildBlock('Thiamine',[['DRUG','Thiamine HCl (Vitamin B1)'],['DOSE','100 mg IV over 5–10 min (Wernicke: 500 mg IV q8h × 3 days)'],['ROUTE','IV preferred — higher serum levels than IM or PO'],['INDICATION','ETOH use disorder, malnutrition, Wernicke encephalopathy prevention']],'Give BEFORE dextrose in suspected thiamine deficiency · Anaphylaxis rare but possible with IV · Do not withhold if unsure')}]},
  {id:'nalox',cat:'support',icon:'⚕️',name:'Naloxone',sub:'Narcan — opioid reversal',cor:null,wtBased:false,scenarios:[{label:'Opioid Reversal',build:()=>buildBlock('Naloxone',[['DRUG','Naloxone (Narcan)'],['DOSE','0.4–2 mg IV/IM/IN — titrate to RESPIRATORY DRIVE, not full reversal'],['ROUTE','IV preferred · IN: 4 mg per nare (2 mg/0.1 mL)'],['REPEAT','q2–3 min prn; infusion: 2/3 of effective reversal dose per hour'],['INDICATION','Opioid respiratory depression  (RR < 12, SpO₂ < 92%, unresponsive)']],'Avoid full reversal in opioid-dependent — withdrawal, seizure, pulm edema · Duration 30–90 min — WATCH FOR RENARCOTIZATION')}]},
];

// ── Bundles ───────────────────────────────────────────────────────────────────
// ids format: [itemId, scenarioLabel?]
// itemId can be a DRUG id or SIMPLE order id — applyBundle handles both
const BUNDLE_GROUPS=[
  {id:'Cardiac',label:'Cardiac',icon:'🫀',color:T.coral},
  {id:'Respiratory',label:'Resp',icon:'🫁',color:T.blue},
  {id:'Airway',label:'Airway',icon:'😴',color:T.purple},
  {id:'Neuro',label:'Neuro',icon:'🧠',color:'#b890ff'},
  {id:'Metabolic',label:'Metabolic',icon:'🧪',color:T.gold},
  {id:'Infxn',label:'Infxn',icon:'🦠',color:T.teal},
  {id:'Psych/Tox',label:'Psych/Tox',icon:'🧠',color:'#c084fc'},
  {id:'Allergy',label:'Allergy',icon:'⚠️',color:T.orange},
];

const BUNDLES=[
  // ── Cardiac
  {label:'STEMI',group:'Cardiac',icon:'🫀',color:T.coral,ids:[['asa','ACS Load'],['tica','ACS Load'],['heparin','STEMI / PCI'],['statin','ACS High-Intensity'],['nitro_sl','ACS Sublingual'],['p_ecg'],['p_tele'],['l_trop'],['l_coag'],['l_type'],['c_cards']]},
  {label:'NSTEMI',group:'Cardiac',icon:'🫀',color:T.orange,ids:[['asa','ACS Load'],['tica','ACS Load'],['enox','NSTEMI Treatment'],['statin','ACS High-Intensity'],['p_ecg'],['p_ecg_s'],['p_tele'],['l_trop'],['l_bnp'],['c_cards']]},
  {label:'AFib RVR',group:'Cardiac',icon:'⚡',color:T.gold,ids:[['diltia','AFib Rate Control'],['metro_iv','IV Rate Control / ACS'],['p_ecg'],['p_tele'],['l_trop'],['l_bnp']]},
  {label:'TdP',group:'Cardiac',icon:'🔄',color:T.gold,ids:[['mag_iv','Torsades de Pointes'],['atropine','Symptomatic Bradycardia'],['p_ecg'],['p_tele']]},
  // ── Respiratory
  {label:'Sepsis',group:'Respiratory',icon:'💉',color:T.teal,ids:[['norepi','Septic Shock'],['vanc','Sepsis / SSTI / CAP'],['piptz','Broad Spectrum Sepsis'],['apap','IV Analgesia / Antipyretic'],['l_lac'],['l_cbc'],['l_bmp'],['p_iv2'],['i_cxr']]},
  {label:'PE Workup',group:'Respiratory',icon:'🫁',color:T.blue,ids:[['i_ctpe'],['l_coag'],['l_trop'],['l_bnp'],['p_ecg'],['p_o2'],['enox','NSTEMI Treatment']]},
  {label:'Flash Edema',group:'Respiratory',icon:'💧',color:T.blue,ids:[['nitro_sl','ACS Sublingual'],['labet','Hypertensive Emergency'],['l_bnp'],['i_cxr'],['i_tte'],['p_o2'],['p_tele']]},
  // ── Airway
  {label:'RSI',group:'Airway',icon:'😴',color:T.purple,ids:[['fent','IV Pain Management'],['ketamine','RSI Induction'],['succs','RSI Paralytic'],['p_o2'],['p_tele'],['p_iv2']]},
  // ── Neurological
  {label:'Stroke',group:'Neuro',icon:'🧠',color:T.purple,ids:[['i_cthead'],['l_cbc'],['l_bmp'],['l_coag'],['l_trop'],['p_ecg'],['c_neuro']]},
  {label:'Status Epi',group:'Neuro',icon:'⚡',color:T.gold,ids:[['lzp','Status Epilepticus'],['diaz','Status Epilepticus (alt)'],['l_bmp'],['l_cbc'],['i_cthead'],['p_tele'],['c_neuro']]},
  {label:'Severe HA',group:'Neuro',icon:'🤕',color:T.purple,ids:[['ketor','IV Non-Opioid Analgesia'],['zofran','Nausea / Vomiting'],['i_cthead'],['l_bmp'],['l_cbc'],['l_coag'],['c_neuro']]},
  // ── Metabolic
  {label:'DKA',group:'Metabolic',icon:'🩸',color:T.gold,ids:[['l_bmp'],['l_cbc'],['l_lac'],['l_ua'],['p_iv2'],['cacl','Hyperkalemia / CCB OD / Arrest']]},
  {label:'Hypo-BG',group:'Metabolic',icon:'🍬',color:T.blue,ids:[['d50','Symptomatic Hypoglycemia'],['thiam','Wernicke Prophylaxis'],['l_bmp']]},
  {label:'Hypertensive Emrg',group:'Metabolic',icon:'🔴',color:T.coral,ids:[['labet','Hypertensive Emergency'],['i_cthead'],['l_bmp'],['l_trop'],['l_bnp'],['p_ecg'],['p_tele']]},
  // ── Infectious
  {label:'Pneumonia',group:'Infxn',icon:'🫁',color:T.teal,ids:[['ceftx','CAP / UTI / Meningitis'],['azithro','CAP Atypical Coverage'],['l_cbc'],['l_bmp'],['l_lac'],['i_cxr']]},
  {label:'Pyelonephritis',group:'Infxn',icon:'🧫',color:T.teal,ids:[['ceftx','CAP / UTI / Meningitis'],['piptz','Broad Spectrum Sepsis'],['l_ua'],['l_cbc'],['l_bmp']]},
  // ── Psych / Behavioral Health
  {label:'Acute Agitation',group:'Psych/Tox',icon:'🧠',color:T.purple,ids:[['haldo','Acute Agitation IM'],['lzp','Status Epilepticus'],['p_tele'],['p_1to1'],['l_etoh'],['l_utox'],['l_bmp'],['l_tsh']]},
  {label:'ETOH W/D',group:'Psych/Tox',icon:'🍺',color:T.orange,ids:[['diaz','ETOH Withdrawal'],['thiam','Wernicke Prophylaxis'],['d50','Symptomatic Hypoglycemia'],['l_bmp'],['l_cbc'],['l_etoh'],['p_tele'],['c_addx']]},
  {label:'Opioid OD',group:'Psych/Tox',icon:'💊',color:T.coral,ids:[['nalox','Opioid Reversal'],['thiam','Wernicke Prophylaxis'],['p_o2'],['p_tele'],['l_bmp'],['l_utox'],['c_addx']]},
  // ── Allergy / Other
  {label:'Anaphylaxis',group:'Allergy',icon:'⚠️',color:T.coral,ids:[['epi_anap','Anaphylaxis — IM'],['zofran','Nausea / Vomiting'],['p_o2'],['p_iv2'],['p_tele']]},
];

// ── ACEP / Guideline Recommendation Map ──────────────────────────────────────
// Maps bundle label → Set of order IDs highlighted as guideline-recommended
// Sources: AHA/ACC 2025, ACEP policies, ACLS 2025, SSC 2021, AES 2023, ASAM 2020
const PRESENTATION_RECS={
  'STEMI':new Set(['asa','tica','clopi','heparin','statin','nitro_sl','metro_iv','p_ecg','p_tele','l_trop','l_coag','l_type','c_cards']),
  'NSTEMI':new Set(['asa','tica','enox','statin','p_ecg','p_ecg_s','p_tele','l_trop','l_bnp','l_coag','c_cards']),
  'AFib RVR':new Set(['diltia','metro_iv','amio_iv','p_ecg','p_tele','l_trop','l_bnp','l_cmp']),
  'TdP':new Set(['mag_iv','atropine','p_ecg','p_tele']),
  'Sepsis':new Set(['norepi','vanc','piptz','l_lac','l_cbc','l_bmp','l_coag','p_iv2','i_cxr','l_ua']),
  'PE Workup':new Set(['i_ctpe','l_coag','l_trop','l_bnp','p_ecg','p_o2','enox','heparin']),
  'Flash Edema':new Set(['nitro_sl','labet','l_bnp','i_cxr','i_tte','p_o2','p_tele']),
  'RSI':new Set(['etom','ketamine','succs','roc','fent','midaz','p_o2','p_tele','p_iv2']),
  'Stroke':new Set(['i_cthead','l_cbc','l_coag','l_bmp','l_trop','p_ecg','c_neuro']),
  'Status Epi':new Set(['lzp','diaz','l_bmp','l_cbc','l_cmp','i_cthead','c_neuro','p_tele']),
  'Severe HA':new Set(['i_cthead','l_bmp','l_cbc','l_coag','ketor','zofran','lzp','c_neuro']),
  'DKA':new Set(['l_bmp','l_cbc','l_lac','l_ua','p_iv2','cacl','bicarb']),
  'Hypo-BG':new Set(['d50','thiam','l_bmp']),
  'Hypertensive Emrg':new Set(['labet','i_cthead','l_bmp','l_trop','l_bnp','p_ecg','p_tele']),
  'Pneumonia':new Set(['ceftx','azithro','piptz','l_cbc','l_bmp','l_lac','i_cxr']),
  'Pyelonephritis':new Set(['ceftx','piptz','vanc','l_cbc','l_bmp','l_ua']),
  'Acute Agitation':new Set(['haldo','droper','olanzIM','lzp','midaz','p_tele','p_1to1','l_etoh','l_utox','l_tsh']),
  'ETOH W/D':new Set(['diaz','lzp','thiam','d50','l_bmp','l_cbc','l_etoh','p_tele','c_addx']),
  'Opioid OD':new Set(['nalox','thiam','p_o2','p_tele','l_bmp','l_utox','c_addx']),
  'Anaphylaxis':new Set(['epi_anap','p_o2','p_iv2','p_tele','zofran']),
};

// ── Category meta ─────────────────────────────────────────────────────────────
// ── Also Consider — clinical order chaining map ──────────────────────────────
// Each entry: orderId -> [{id, reason}] suggestions triggered when that order is queued
// ── Allergy Alternative Suggestions ───────────────────────────────────────────────────────────────────────────────
// Keyed by allergy identifier (matches AMAP keys and item.alert values)
const CONFLICT_PAIRS=[
  {ids:['diltia','metro_iv'],sev:'alert',icon:'⚡',title:'Combined AV Nodal Blockade',msg:'Diltiazem + Metoprolol — high risk of bradycardia and complete AV block',rec:'Use one rate-control agent. Have atropine + TCP available if combining.'},
  {ids:['amio_iv','procain'],sev:'alert',icon:'⚡',title:'Dual Antiarrhythmic — Torsades Risk',msg:'Amiodarone + Procainamide — additive QT prolongation, torsades de pointes risk',rec:'Avoid combination. Choose one antiarrhythmic; amiodarone preferred for most presentations.'},
  {ids:['olanzIM','lzp'],sev:'alert',icon:'☠️',title:'IM Antipsychotic + IM Benzodiazepine',msg:'Olanzapine IM + Lorazepam IM — fatal respiratory depression reported (FDA warning)',rec:'Use one agent. If both needed, use IV lorazepam with airway monitoring — never IM combination.'},
  {ids:['heparin','enox'],sev:'alert',icon:'☠️',title:'Double Anticoagulation',msg:'Heparin UFH + Enoxaparin — two simultaneous anticoagulants, major bleeding risk',rec:'Use one anticoagulant. UFH for PCI/rapid reversal; enoxaparin for NSTEMI medical management.'},
  {ids:['fent','midaz'],sev:'alert',icon:'⚠️',title:'Opioid + Benzodiazepine — Respiratory Depression',msg:'Fentanyl + Midazolam — FDA Black Box: significantly increased respiratory depression and death risk',rec:'Titrate carefully with continuous SpO₂ monitoring. Ensure naloxone and flumazenil at bedside.'},
  {ids:['zofran','haldo'],sev:'alert',icon:'⚡',title:'Additive QTc Prolongation',msg:'Ondansetron + Haloperidol — both prolong QTc, cumulative torsades risk',rec:'Obtain baseline ECG, monitor QTc. Consider metoclopramide as alternative antiemetic if QTc > 450 ms.'},
  {ids:['zofran','droper'],sev:'alert',icon:'⚡',title:'Additive QTc Prolongation',msg:'Ondansetron + Droperidol — both carry QTc Black Box warnings; high additive risk',rec:'Use one QTc-prolonging antiemetic. Continuous cardiac monitoring mandatory if combining.'},
  {ids:['amio_iv','metro_iv'],sev:'alert',icon:'⚡',title:'Amiodarone + Beta-Blocker',msg:'Amiodarone + Metoprolol — additive AV nodal depression, bradycardia and heart block risk',rec:'Reduce metoprolol dose when combining. Monitor HR continuously; have atropine ready.'},
  {ids:['bicarb','cacl'],sev:'warning',icon:'🧪',title:'Separate IV Lines Required',msg:'Sodium Bicarbonate + Calcium — precipitates calcium carbonate if co-administered in same line',rec:'Flush line or use separate IV access. Precipitate can occlude line and cause embolism.'},
  {ids:['ketor','enox'],sev:'warning',icon:'⚠️',title:'NSAID + Anticoagulant — Bleeding Risk',msg:'Ketorolac + Enoxaparin — platelet inhibition + anticoagulation increases major bleeding risk',rec:'Prefer acetaminophen for analgesia when anticoagulated. Monitor for bleeding.'},
  {ids:['ketor','heparin'],sev:'warning',icon:'⚠️',title:'NSAID + Anticoagulant — Bleeding Risk',msg:'Ketorolac + Heparin UFH — combined platelet inhibition and anticoagulation, increased hemorrhage risk',rec:'Use acetaminophen or opioid analgesia instead of NSAIDs when heparin is active.'},
  {ids:['ketor','asa'],sev:'warning',icon:'⚠️',title:'Dual NSAID / Antiplatelet Effect',msg:'Ketorolac + Aspirin — additive platelet inhibition and GI bleeding risk',rec:'If ASA is for ACS, use acetaminophen for pain — avoid dual NSAID/antiplatelet effect.'},
  {ids:['amio_iv','diltia'],sev:'warning',icon:'⚡',title:'Dual Negative Dromotropic Agents',msg:'Amiodarone + Diltiazem — additive AV nodal slowing, bradycardia and hypotension risk',rec:'Monitor HR and BP closely. Consider using one agent for rhythm or rate control.'},
  {ids:['haldo','droper'],sev:'warning',icon:'⚡',title:'Dual Antipsychotic — Additive QTc Risk',msg:'Haloperidol + Droperidol — both dopamine antagonists with additive QTc prolongation',rec:'Use one antipsychotic. Obtain baseline QTc; continuous monitoring mandatory.'},
  {ids:['mag_iv','cacl'],sev:'warning',icon:'🧪',title:'Calcium Antagonizes Magnesium',msg:'Calcium Chloride + Magnesium Sulfate — calcium partially reverses magnesium’s antiarrhythmic effect',rec:'If calcium given for magnesium toxicity, this is intentional. Otherwise note reduced TdP efficacy.'},
];

const ALLERGY_ALTERNATIVES={
  'pcn':{
    allergyName:'Penicillin / Beta-Lactam',
    guideline:'Cross-reactivity 1–2% for cephalosporins (non-anaphylactic PCN allergy)  [AAAAI/ACAAI]',
    alternatives:[
      {id:'cefep',reason:'Cefepime — 4th-gen cephalosporin, distinct side chain',crossRisk:'Low (1–2%)',xrClass:'xr-low',note:'Safe in most PCN-allergic patients unless IgE-mediated anaphylaxis — verify reaction history'},
      {id:'vanc',reason:'Vancomycin — no beta-lactam structure, full gram-positive coverage',crossRisk:'None',xrClass:'xr-none',note:'First choice if history includes anaphylaxis — adjust for renal function'},
      {id:'azithro',reason:'Azithromycin — macrolide class, structurally unrelated to PCN',crossRisk:'None',xrClass:'xr-none',note:'Atypical organisms only — not adequate for gram-positive bacteremia'},
    ],
    protocols:[],
  },
  'contrast':{
    allergyName:'Iodinated Contrast',
    guideline:'Pre-medication reduces breakthrough reactions by ~10-fold  [ACR Manual on Contrast v11]',
    alternatives:[
      {id:'i_cthead',reason:'CT Head (Non-Contrast) — adequate for hemorrhage, stroke, AMS, most neuro indications',crossRisk:'None',xrClass:'xr-none',note:'Use when diagnosis does not require vascular enhancement'},
    ],
    protocols:[
      'Premedication protocol (elective): Methylprednisolone 32 mg PO 12h + 2h before contrast · Diphenhydramine 50 mg IV/PO 1h before',
      'Emergent: Methylprednisolone 40 mg IV q4h until procedure · Diphenhydramine 50 mg IV 1h before · Use lowest contrast volume',
    ],
  },
  'codeine':{
    allergyName:'Codeine',
    guideline:'Codeine allergy is often opioid intolerance, not true cross-class allergy  [ASHP]',
    alternatives:[
      {id:'fent',reason:'Fentanyl — synthetic phenylpiperidine, no codeine cross-reactivity',crossRisk:'None',xrClass:'xr-none',note:'Preferred opioid in codeine allergy — 100× more potent than morphine'},
      {id:'ketor',reason:'Ketorolac — non-opioid NSAID, avoid opioids entirely',crossRisk:'None',xrClass:'xr-none',note:'Strong non-opioid for moderate pain — max 5-day course, avoid in renal failure'},
      {id:'morph',reason:'Morphine — natural opioid, distinct receptor binding profile',crossRisk:'Monitor',xrClass:'xr-monitor',note:'Phenanthrene class like codeine — titrate carefully and monitor for reaction'},
    ],
    protocols:[],
  },
};

const ALSO_CONSIDER={
  'asa':[{id:'tica',reason:'Complete dual antiplatelet for ACS'},{id:'statin',reason:'High-intensity statin — plaque stabilization'}],
  'tica':[{id:'asa',reason:'ASA required counterpart for DAPT'},{id:'statin',reason:'Atorvastatin 80 mg — ACS standard of care'}],
  'clopi':[{id:'asa',reason:'Dual antiplatelet — ASA + P2Y₁₂'},{id:'statin',reason:'High-intensity statin for ACS'}],
  'heparin':[{id:'l_coag',reason:'Baseline PTT before heparin drip'},{id:'p_tele',reason:'Arrhythmia monitoring on anticoagulation'},{id:'l_trop',reason:'Serial troponin — ACS monitoring'}],
  'enox':[{id:'l_coag',reason:'Coagulation baseline'},{id:'l_trop',reason:'Serial troponin — NSTEMI protocol'},{id:'l_bmp',reason:'Renal function — dose-adjust if CrCl < 30'}],
  'tnk':[{id:'heparin',reason:'Adjunct anticoag required post-fibrinolysis'},{id:'l_coag',reason:'Coag monitoring after lytics'},{id:'c_cards',reason:'Emergent cath decision after fibrinolysis'}],
  'statin':[{id:'asa',reason:'Complete ACS medical therapy'},{id:'tica',reason:'Dual antiplatelet for ACS'}],
  'metro_iv':[{id:'p_ecg',reason:'ECG — assess rate response'},{id:'p_tele',reason:'Continuous rhythm monitoring required'}],
  'nitro_sl':[{id:'p_ecg',reason:'Confirm no STEMI / RV infarct before redosing'},{id:'l_trop',reason:'Troponin if ongoing ischemic pain'}],
  'diltia':[{id:'p_ecg',reason:'Confirm rhythm before rate control'},{id:'p_tele',reason:'Monitor HR and BP response'},{id:'l_bnp',reason:'BNP — assess EF before CCB use'}],
  'adenosine':[{id:'p_ecg',reason:'12-lead ECG immediately after SVT conversion'},{id:'p_tele',reason:'Continuous monitoring post-adenosine'}],
  'amio_iv':[{id:'p_ecg',reason:'QTc monitoring — amiodarone prolongs QT'},{id:'p_tele',reason:'Continuous rhythm monitoring required'}],
  'procain':[{id:'p_ecg',reason:'Stop if QRS widens > 50% — monitor continuously'},{id:'p_tele',reason:'Monitor for hypotension and arrhythmia'}],
  'mag_iv':[{id:'l_bmp',reason:'Check K⁺ — correct hypokalemia simultaneously'},{id:'p_tele',reason:'Monitor for TdP recurrence and DTRs'}],
  'atropine':[{id:'p_tele',reason:'Monitor HR response to atropine'},{id:'p_ecg',reason:'ECG — characterize AV block type'}],
  'norepi':[{id:'p_iv2',reason:'Central line for vasopressor administration'},{id:'l_lac',reason:'Lactate — assess perfusion response'},{id:'p_tele',reason:'Continuous hemodynamic monitoring'}],
  'epi_anap':[{id:'zofran',reason:'GI symptoms common in anaphylaxis'},{id:'p_tele',reason:'Cardiac monitoring post-epinephrine'},{id:'p_iv2',reason:'Secure IV access for biphasic reaction'}],
  'dopa':[{id:'p_tele',reason:'Dopamine is highly arrhythmogenic — monitor'},{id:'l_lac',reason:'Lactate — assess perfusion response'}],
  'vanc':[{id:'piptz',reason:'Gram-negative coverage for complete empirics'},{id:'l_bmp',reason:'Renal function — vancomycin dose adjustment'},{id:'l_cbc',reason:'WBC baseline for infection monitoring'}],
  'piptz':[{id:'vanc',reason:'Add MRSA coverage if risk factors present'},{id:'l_lac',reason:'Lactate — sepsis severity marker'},{id:'l_cbc',reason:'WBC baseline for monitoring'}],
  'cefep':[{id:'vanc',reason:'Add MRSA coverage if gram-positive risk'},{id:'l_cbc',reason:'WBC monitoring during treatment'}],
  'ceftx':[{id:'azithro',reason:'Atypical coverage — IDSA/ATS CAP combination'},{id:'i_cxr',reason:'CXR — confirm and grade pneumonia extent'},{id:'l_cbc',reason:'WBC for infection monitoring'}],
  'azithro':[{id:'ceftx',reason:'Beta-lactam counterpart for CAP combo therapy'},{id:'i_cxr',reason:'CXR — pneumonia confirmation'},{id:'l_cbc',reason:'WBC monitoring'}],
  'etom':[{id:'succs',reason:'Paralytic — complete RSI sequence'},{id:'roc',reason:'Backup paralytic if succs contraindicated'},{id:'p_o2',reason:'Pre-oxygenation mandatory for RSI'}],
  'ketamine':[{id:'succs',reason:'Paralytic to complete RSI induction'},{id:'roc',reason:'Alternative paralytic if succs CI'},{id:'p_o2',reason:'Pre-oxygenation mandatory'}],
  'succs':[{id:'roc',reason:'Backup paralytic — keep sugammadex at bedside'},{id:'p_tele',reason:'Monitor for post-succinylcholine bradycardia'},{id:'p_o2',reason:'Ensure pre-oxygenation running'}],
  'roc':[{id:'succs',reason:'Faster onset — consider if not contraindicated'},{id:'p_tele',reason:'Monitor during prolonged neuromuscular blockade'}],
  'midaz':[{id:'fent',reason:'Analgesia to complement procedural sedation'},{id:'p_tele',reason:'SpO₂ and HR monitoring during PSA'},{id:'nalox',reason:'Have reversal agent at bedside'}],
  'fent':[{id:'ketor',reason:'NSAID multimodal — reduces opioid requirement'},{id:'apap',reason:'Non-opioid adjunct for multimodal analgesia'},{id:'zofran',reason:'Pre-emptive antiemetic with opioids'}],
  'morph':[{id:'ketor',reason:'NSAID multimodal — opioid-sparing strategy'},{id:'apap',reason:'Acetaminophen adjunct for multimodal analgesia'},{id:'zofran',reason:'Morphine commonly causes nausea/vomiting'}],
  'ketor':[{id:'apap',reason:'Combine for potent non-opioid analgesia'},{id:'zofran',reason:'NSAID GI upset — antiemetic consideration'}],
  'apap':[{id:'ketor',reason:'NSAID combination for opioid-sparing analgesia'},{id:'fent',reason:'Add opioid if pain uncontrolled on non-opioids'}],
  'haldo':[{id:'p_tele',reason:'QTc monitoring required with haloperidol'},{id:'l_etoh',reason:'Ethanol level — primary agitation workup'},{id:'l_utox',reason:'UDS — identify intoxication etiology'}],
  'droper':[{id:'p_tele',reason:'FDA Black Box — mandatory QTc monitoring'},{id:'l_etoh',reason:'ETOH level for agitation workup'},{id:'l_tsh',reason:'TSH — thyroid storm can mimic agitation'}],
  'olanzIM':[{id:'p_tele',reason:'Monitor SpO₂/HR post-IM antipsychotic'},{id:'c_psych',reason:'Psychiatry consult for definitive disposition'},{id:'l_etoh',reason:'ETOH level — etiology of agitation'}],
  'diaz':[{id:'thiam',reason:'Thiamine before/alongside benzos in ETOH W/D'},{id:'d50',reason:'Hypoglycemia common in ETOH withdrawal'},{id:'l_bmp',reason:'Electrolytes — CIWA monitoring baseline'}],
  'lzp':[{id:'diaz',reason:'Longer-acting BZD if ETOH seizure recurs'},{id:'i_cthead',reason:'CT head — structural seizure etiology'},{id:'l_bmp',reason:'Metabolic panel — electrolyte seizure triggers'}],
  'thiam':[{id:'d50',reason:'Dextrose AFTER thiamine in malnourished patient'},{id:'l_bmp',reason:'Metabolic panel — nutritional deficiency screen'},{id:'c_addx',reason:'Addiction medicine — ETOH treatment linkage'}],
  'd50':[{id:'thiam',reason:'Thiamine BEFORE dextrose if ETOH/malnourished'},{id:'l_bmp',reason:'Recheck glucose in 15 min — monitor response'}],
  'nalox':[{id:'p_o2',reason:'Supplemental O₂ — cover respiratory depression'},{id:'p_tele',reason:'Monitor for renarcotization (30–90 min)'},{id:'l_utox',reason:'UDS — identify opioid and polysubstance use'}],
  'cacl':[{id:'l_bmp',reason:'Monitor K⁺ and Ca²⁺ response to treatment'},{id:'p_tele',reason:'Continuous monitoring during calcium infusion'}],
  'bicarb':[{id:'l_bmp',reason:'Serial BMP — monitor pH and bicarb response'},{id:'p_tele',reason:'QRS monitoring — TCA/Na-channel blockade'}],
  'labet':[{id:'p_tele',reason:'Continuous BP and HR monitoring'},{id:'i_cthead',reason:'CT head — r/o hemorrhagic stroke before aggressive BP Rx'},{id:'l_bmp',reason:'Renal function — labetalol clearance'}],
  'zofran':[{id:'apap',reason:'IV acetaminophen — pain often accompanies nausea'},{id:'p_iv2',reason:'IV access needed for ondansetron administration'}],
  'l_trop':[{id:'p_ecg',reason:'12-lead ECG — correlate with troponin elevation'},{id:'l_bnp',reason:'BNP — HF contribution to demand ischemia?'},{id:'p_tele',reason:'Telemetry for ACS monitoring'}],
  'l_lac':[{id:'p_iv2',reason:'Large-bore IV — elevated lactate flags resuscitation need'},{id:'l_cbc',reason:'CBC — infection as source of elevated lactate'},{id:'l_bmp',reason:'Metabolic panel — organ dysfunction screen'}],
  'i_ctpe':[{id:'enox',reason:'Anticoagulate immediately if PE confirmed'},{id:'l_coag',reason:'Coag panel before anticoagulation'},{id:'l_bnp',reason:'BNP — assess RV strain from PE'}],
  'i_cthead':[{id:'l_coag',reason:'INR and platelets before neurosurgical decisions'},{id:'c_neuro',reason:'Neurology consult for CT findings'},{id:'l_cbc',reason:'Platelets — hemorrhage management'}],
  'p_iv2':[{id:'l_cbc',reason:'Draw CBC while placing large-bore IV'},{id:'l_bmp',reason:'Draw BMP simultaneously — efficient workflow'}],
  'c_cards':[{id:'l_trop',reason:'Serial troponin for cardiology evaluation'},{id:'i_tte',reason:'Echo TTE — LV function for cath decision'},{id:'l_coag',reason:'Coag panel — pre-cath preparation'}],
  'c_neuro':[{id:'i_cthead',reason:'CT head — needed for neurology evaluation'},{id:'l_coag',reason:'Coag panel for intervention decisions'}],
  'c_psych':[{id:'l_etoh',reason:'ETOH level — psychiatric assessment workup'},{id:'l_utox',reason:'UDS — rule out substance-induced symptoms'},{id:'l_tsh',reason:'TSH — thyroid disorder as psychiatric mimic'}],
  'l_ua':[{id:'l_cbc',reason:'WBC — leukocytosis for infection severity'},{id:'l_bmp',reason:'Renal function — UTI with concurrent AKI?'}],
  'p_tele':[{id:'p_ecg',reason:'12-lead ECG as baseline before continuous monitoring'},{id:'p_o2',reason:'SpO₂ alongside cardiac monitoring'}],
  'l_coag':[{id:'l_type',reason:'Type & Screen — coag abnormality signals bleeding risk'},{id:'l_cbc',reason:'Platelets alongside coag panel'}],
  'p_ecg':[{id:'p_tele',reason:'Continuous monitoring if ECG shows abnormality'},{id:'l_trop',reason:'Troponin if ST changes or ischemic pattern'}],
  'i_cxr':[{id:'l_cbc',reason:'WBC — correlate with pulmonary infiltrate'},{id:'l_lac',reason:'Lactate — pneumonia with sepsis physiology?'}],
  'i_tte':[{id:'l_bnp',reason:'BNP — correlate with echo EF findings'},{id:'c_cards',reason:'Cardiology if echo shows significant pathology'}],
  'l_cbc':[{id:'l_bmp',reason:'Metabolic panel pairs with CBC for complete picture'},{id:'l_coag',reason:'Coag panel if thrombocytopenia or bleeding concern'}],
  'l_bnp':[{id:'i_tte',reason:'Echo TTE — confirm EF and wall motion'},{id:'i_cxr',reason:'CXR — pulmonary edema severity'}],
  'p_o2':[{id:'p_tele',reason:'Cardiac monitoring alongside O₂ therapy'}],
};

// ── Time-Critical Timer Definitions ───────────────────────────────────────────────────────────────────────────────
const TIMER_DEFS={
  'Sepsis':{label:'Sepsis Hour-1 Bundle',icon:'🦠',targetSec:3600,metric:'Abx + lactate < 60 min  [SSC 2021]',phase:null},
  'STEMI':{label:'STEMI · Door-to-Balloon',icon:'🫀',targetSec:5400,metric:'PCI < 90 min from first medical contact  [AHA/ACC]',phase:null},
  'STEMI-Lytics':{label:'STEMI · Door-to-Needle',icon:'🫀',targetSec:1800,metric:'Fibrinolytic < 30 min from arrival  [AHA/ACC]',phase:null},
  'Stroke':{label:'Stroke · Door-to-tPA',icon:'🧠',targetSec:3600,metric:'tPA < 60 min from arrival  [AHA/ASA 2023]',phase:null},
  'Status-Epi':{label:'Status Epilepticus',icon:'⚡',targetSec:300,metric:'First BZD < 5 min of witnessed seizure  [AES 2023]',phase:null},
  'Anaphylaxis':{label:'Anaphylaxis · Time to Epi',icon:'⚠️',targetSec:600,metric:'Epinephrine < 10 min of recognition  [WAO 2020]',phase:null},
  'PE':{label:'PE · Time to Anticoagulation',icon:'🫁',targetSec:3600,metric:'Anticoag < 60 min if high-probability PE  [AHA 2019]',phase:null},
};
const BUNDLE_TIMER_TRIGGERS={'STEMI':'STEMI','NSTEMI':'STEMI','Sepsis':'Sepsis','Stroke':'Stroke','Status Epi':'Status-Epi','Anaphylaxis':'Anaphylaxis','PE Workup':'PE'};
const ORDER_TIMER_TRIGGERS={'vanc':'Sepsis','piptz':'Sepsis','cefep':'Sepsis','norepi':'Sepsis','tnk':'STEMI-Lytics','lzp':'Status-Epi','diaz':'Status-Epi','epi_anap':'Anaphylaxis','enox':'PE'};
const TIMER_COMPLETE_FN={
  'Sepsis':q=>q.some(x=>['vanc','piptz','cefep','ceftx'].includes(x.id))&&q.some(x=>x.id==='l_lac'),
  'STEMI':q=>q.some(x=>x.id==='asa')&&q.some(x=>['heparin','enox'].includes(x.id))&&q.some(x=>x.id==='c_cards'),
  'STEMI-Lytics':q=>q.some(x=>x.id==='tnk'),
  'Stroke':q=>q.some(x=>x.id==='i_cthead')&&q.some(x=>x.id==='c_neuro'),
  'Status-Epi':q=>q.some(x=>['lzp','diaz'].includes(x.id)),
  'Anaphylaxis':q=>q.some(x=>x.id==='epi_anap'),
  'PE':q=>q.some(x=>['enox','heparin'].includes(x.id))&&q.some(x=>x.id==='i_ctpe'),
};
const fmtTime=ms=>{const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60);return h>0?`${h}h ${String(m%60).padStart(2,'0')}m`:`${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
const fmtSavedAt=iso=>{const d=new Date(iso),diff=Date.now()-d.getTime(),m=Math.floor(diff/60000);if(m<1)return'just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`;};

// ── MDM Documentation Builder ───────────────────────────────────────────────────────────────
const buildMDMText=(orders,time)=>{
  const g=cat=>orders.filter(o=>o.cat===cat).map(o=>o.name);
  const labs=g('labs'),img=g('imaging'),meds=g('meds'),proc=g('procedures'),cons=g('consults');
  const hasCrit=orders.some(o=>['norepi','epi_anap','succs','roc','ketamine','etom','tnk'].includes(o.id));
  const cats=new Set(orders.map(o=>o.cat)).size;
  const cx=hasCrit?'High — Critical / Intensive Management':cats>=3?'Moderate-High — Multi-system Mgmt':cats>=2?'Moderate — Multiple Data Categories':'Low-Moderate — Limited Data Ordering';
  const L=[];
  if(labs.length)L.push(`Tests Ordered:         ${labs.join(', ')}`);
  if(img.length)L.push(`Imaging Ordered:       ${img.join(', ')}`);
  if(meds.length)L.push(`Medications Initiated: ${meds.join(', ')}`);
  if(proc.length)L.push(`Procedures/Monitoring: ${proc.join(', ')}`);
  if(cons.length)L.push(`Consults Placed:       ${cons.join(', ')}`);
  L.push(`\nMDM Complexity (est.): ${cx}`);
  return`${BAR}\n[MDM — Auto-populated from Notrya EDOrderHub]\n${'─'.repeat(46)}\n${L.join('\n')}\n${BAR}\n[Signed: ${time}]`;
};

// ── Quick Dose Strip ───────────────────────────────────────────────────────────────────────────────
// Each id matches a DRUGS entry so queue deduplication + allergy checking work natively
const QUICK_DOSES=[
  {id:'zofran',label:'Zofran',icon:'🤮',color:'#3dffa0',
   doseLabel:()=>'4 mg IV',
   build:()=>buildBlock('Ondansetron',[['DRUG','Ondansetron (Zofran) — Quick Dose'],['DOSE','4 mg IV over 2–5 min'],['FREQUENCY','Q4–6h PRN nausea'],['INDICATION','Acute nausea / vomiting']])},
  {id:'morph',label:'Morphine',icon:'🩹',color:'#3b9eff',
   doseLabel:()=>'4 mg IV',
   build:()=>buildBlock('Morphine Sulfate',[['DRUG','Morphine Sulfate — Quick Dose'],['DOSE','4 mg IV over 2–5 min'],['REPEAT','q15–20 min PRN NRS ≥ 7'],['INDICATION','Moderate–severe pain']],'Monitor resp rate · Reversal: naloxone 0.4 mg IV')},
  {id:'fent',label:'Fentanyl',icon:'🩹',color:'#3b9eff',
   doseLabel:(W)=>`${Math.round(W)} mcg IV`,
   build:(W)=>buildBlock('Fentanyl',[['DRUG','Fentanyl Citrate — Quick Dose'],['DOSE',`${Math.round(W)} mcg IV over 2–3 min  [1 mcg/kg × ${W} kg]`],['REPEAT','Titrate q5–10 min PRN NRS ≥ 7'],['INDICATION','Moderate–severe pain']],'REVERSAL: naloxone 0.4 mg IV · 100× more potent than morphine')},
  {id:'ketor',label:'Ketorolac',icon:'🩹',color:'#ff9f43',
   doseLabel:()=>'15 mg IV',
   build:()=>buildBlock('Ketorolac',[['DRUG','Ketorolac (Toradol) — Quick Dose'],['DOSE','15 mg IV over 2 min'],['FREQUENCY','Q6h PRN, max 5 days total'],['INDICATION','Non-opioid analgesia — renal colic, MSK, HA']],'AVOID: CrCl < 30, GI bleed, anticoagulation')},
  {id:'apap',label:'Tylenol',icon:'🩹',color:'#ff9f43',
   doseLabel:(W)=>`${W<50?'650':'1,000'} mg IV`,
   build:(W)=>buildBlock('Acetaminophen',[['DRUG','Acetaminophen (Ofirmev IV) — Quick Dose'],['DOSE',`${W<50?'650 mg':'1,000 mg'} IV over 15 min  [${W} kg]`],['FREQUENCY','Q6h scheduled or Q4–6h PRN'],['INDICATION','Pain adjunct / antipyretic — safe in renal failure']],'Max 2 g/24h hepatic impairment or chronic ETOH')},
  {id:'lzp',label:'Ativan',icon:'😴',color:'#9b6dff',
   doseLabel:()=>'2 mg IV',
   build:()=>buildBlock('Lorazepam',[['DRUG','Lorazepam (Ativan) — Quick Dose'],['DOSE','2 mg IV over 2 min'],['REPEAT','May repeat × 1 in 5–10 min if seizing'],['INDICATION','Anxiety / agitation / seizure']],'REVERSAL: flumazenil 0.2 mg IV q1 min × 5 · Airway monitoring')},
  {id:'haldo',label:'Haldol',icon:'🧠',color:'#c084fc',
   doseLabel:()=>'5 mg IM',
   build:()=>buildBlock('Haloperidol',[['DRUG','Haloperidol (Haldol) — Quick Dose'],['DOSE','5 mg IM — anterolateral thigh or deltoid'],['REPEAT','May repeat 5 mg IM q30–60 min PRN, max ~20 mg/24h'],['INDICATION','Acute agitation']],'Baseline QTc · No respiratory depression unlike BZDs')},
  {id:'nalox',label:'Narcan',icon:'⚤',color:'#ff6b6b',
   doseLabel:()=>'0.4 mg IV',
   build:()=>buildBlock('Naloxone',[['DRUG','Naloxone (Narcan) — Quick Dose'],['DOSE','0.4 mg IV — titrate to respiratory drive, NOT full reversal'],['ROUTE','IV preferred · IN: 4 mg per nare'],['REPEAT','q2–3 min PRN; infusion if renarcotization risk'],['INDICATION','Opioid respiratory depression']],'Duration 30–90 min — WATCH FOR RENARCOTIZATION · Avoid full reversal in opioid-dependent')},
];

const CAT_META={
  cardiac:{label:'Cardiac',color:T.coral},
  rhythm:{label:'Arrhythmia',color:T.gold},
  pressors:{label:'Vasopressors',color:T.orange},
  abx:{label:'Antibiotics',color:T.teal},
  sedation:{label:'RSI / Sedation',color:T.purple},
  pain:{label:'Analgesia',color:T.blue},
  psych:{label:'Psych / Behavioral Health',color:T.purple},
  support:{label:'Supportive',color:T.green},
};
const CAT_TABS=[{id:'all',label:'All'},{id:'labs',label:'🧪 Labs'},{id:'imaging',label:'🩻 Imaging'},{id:'meds',label:'💊 Meds'},{id:'procedures',label:'⚡ Procedures'},{id:'consults',label:'🩺 Consults'}];
const pc=p=>p==='STAT'?'pS':p==='URGENT'?'pU':'pR';

// ── Main Component ────────────────────────────────────────────────────────────
export default function EDOrderHub({embedded=false,patientName='',patientAllergies=[],chiefComplaint='',patientAge='',patientSex=''}){
  const[queue,setQueue]=useState([]);
  const[activeCat,setActiveCat]=useState('all');
  const[activeBundle,setActiveBundle]=useState(null);
  const[activeBundleCat,setActiveBundleCat]=useState('Cardiac');
  const[bundlePalOpen,setBundlePalOpen]=useState(false);
  const[bundlePalQ,setBundlePalQ]=useState('');
  const[bundlePalIdx,setBundlePalIdx]=useState(0);
  const bundlePalRef=useRef(null);
  const[suggestions,setSuggestions]=useState([]);
  const[allergyAlts,setAllergyAlts]=useState(null);
  const[conflicts,setConflicts]=useState([]);
  const[signedSnapshot,setSignedSnapshot]=useState(null);
  const[mdmCopied,setMdmCopied]=useState(false);
  const dismissedRef=useRef(new Set());
  const[savedSets,setSavedSets]=useState([]);
  const[showSetsPanel,setShowSetsPanel]=useState(false);
  const[showSaveInput,setShowSaveInput]=useState(false);
  const[saveNameInput,setSaveNameInput]=useState('');
  const[showImport,setShowImport]=useState(false);
  const[importInput,setImportInput]=useState('');
  const[timers,setTimers]=useState([]);
  const[tick,setTick]=useState(0);
  const[searchQ,setSearchQ]=useState('');
  const[wt,setWt]=useState('');
  const[drugScIdx,setDrugScIdx]=useState({});
  const[copySt,setCopySt]=useState({});
  const[qCopySt,setQCopySt]=useState({});
  const[aiSets,setAiSets]=useState([
    {id:'nstemi',title:'NSTEMI Management',conf:97,basis:'Troponin-I 0.84 (>20× ULN) · ST depression V4–V6',open:true,orders:[
      {id:'asa',st:'done',note:'ASA 325 mg given 70 min ago'},
      {id:'heparin',st:'active',note:'UFH drip running · PTT subtherapeutic'},
      {id:'tica',st:'done',note:'Ticagrelor 180 mg given 9 min ago'},
      {id:'c_cards',st:'done',note:'Dr. Chen at bedside'},
      {id:'p_tele',st:'active',note:'Active monitoring'},
    ]},
  ]);
  const[aiLoading,setAiLoading]=useState(false);
  const[toast,setToast]=useState('');
  const[palOpen,setPalOpen]=useState(false);
  const[palQ,setPalQ]=useState('');
  const[palIdx,setPalIdx]=useState(0);
  const toastRef=useRef(null);
  const palInputRef=useRef(null);

  const showToast=useCallback(msg=>{
    setToast(msg);
    if(toastRef.current)clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(''),3200);
  },[]);

  const W=parseFloat(wt)||70;
  const findSimple=id=>SIMPLE.find(o=>o.id===id);
  const findDrug=id=>DRUGS.find(d=>d.id===id);

  // ACEP recommended IDs for active bundle
  const acepRecs=useMemo(()=>activeBundle?(PRESENTATION_RECS[activeBundle]||new Set()):new Set(),[activeBundle]);

  // Command Palette fuzzy search results
  const palResults=useMemo(()=>{
    const q=palQ.trim().toLowerCase();
    if(!q)return[];
    const score=(name,sub)=>{
      const n=(name||'').toLowerCase();
      const s=(sub||'').toLowerCase();
      if(n===q)return 5;
      if(n.startsWith(q))return 4;
      if(n.includes(q))return 3;
      if(s.startsWith(q))return 2;
      if(s.includes(q))return 1;
      return 0;
    };
    const sr=SIMPLE.map(o=>({...o,_type:'simple',_score:score(o.name,o.detail+' '+(o.sub||''))})).filter(o=>o._score>0);
    const dr=DRUGS.map(d=>({...d,_type:'drug',_score:score(d.name,d.sub)})).filter(d=>d._score>0);
    return[...sr,...dr].sort((a,b)=>b._score-a._score).slice(0,15);
  },[palQ]);

  const bundlePalResults=useMemo(()=>{
    const q=bundlePalQ.trim().toLowerCase();
    if(!q)return BUNDLES;
    return BUNDLES.filter(b=>b.label.toLowerCase().includes(q)||b.group.toLowerCase().includes(q));
  },[bundlePalQ]);

  const startTimer=useCallback(type=>{
    if(!TIMER_DEFS[type])return;
    setTimers(p=>p.some(t=>t.id===type)?p:[...p,{id:type,startedAt:Date.now()}]);
  },[]);

  const addToQueue=useCallback((item,cpoeText=null,opts={})=>{
    const aw=getAllergyWarn(item);
    setQueue(p=>{
      if(p.some(q=>q.id===item.id))return p;
      const ni={id:item.id,name:item.name,cat:item.cat||'meds',icon:item.icon||'💊',priority:item.priority||'URGENT',detail:item.detail||item.sub||'',cpoeText,allergyWarn:aw,open:false};
      if(aw){
        setTimeout(()=>showToast(`⚠ ALLERGY: ${aw.name} (${aw.reaction}) — alternatives highlighted below`),0);
        if(!opts.noAlts){
          const altKey=item.alert||(item.contrast?'contrast':null);
          if(altKey&&ALLERGY_ALTERNATIVES[altKey]){
            const altData=ALLERGY_ALTERNATIVES[altKey];
            const filtered=altData.alternatives.filter(a=>!p.some(q=>q.id===a.id)&&a.id!==item.id);
            if(filtered.length)setTimeout(()=>setAllergyAlts({allergyKey:altKey,triggeredById:item.id,triggeredByName:item.name,...altData,alternatives:filtered}),0);
          }
        }
      }
      if(!opts.silent){
        const suggs=(ALSO_CONSIDER[item.id]||[]).filter(s=>!p.some(q=>q.id===s.id)&&s.id!==item.id).slice(0,3);
        setTimeout(()=>setSuggestions(suggs),0);
      }
      if(!opts.silent){
        const tType=ORDER_TIMER_TRIGGERS[item.id];
        if(tType)setTimeout(()=>startTimer(tType),0);
      }
      return[...p,ni];
    });
  },[showToast,startTimer]);

  const removeFromQueue=useCallback(id=>setQueue(p=>p.filter(q=>q.id!==id)),[]);

  const dismissTimer=useCallback(type=>setTimers(p=>p.filter(t=>t.id!==type)),[]);

  React.useEffect(()=>{
    if(timers.length===0)return;
    const iv=setInterval(()=>setTick(t=>t+1),1000);
    return()=>clearInterval(iv);
  },[timers.length]);

  const addSuggestion=useCallback(sugg=>{
    const s=SIMPLE.find(o=>o.id===sugg.id);
    if(s){addToQueue(s,null,{silent:true});setSuggestions(p=>p.filter(x=>x.id!==sugg.id));return;}
    const d=DRUGS.find(x=>x.id===sugg.id);
    if(d){const sc=d.scenarios[0];addToQueue({id:d.id,name:d.name,cat:'meds',icon:d.icon,priority:'URGENT',detail:`${d.sub} · ${sc.label}`},sc.build(W),{silent:true});setSuggestions(p=>p.filter(x=>x.id!==sugg.id));}
  },[addToQueue,W]);

  const addAllergyAlt=useCallback(alt=>{
    const s=SIMPLE.find(o=>o.id===alt.id);
    if(s){addToQueue(s,null,{silent:true,noAlts:true});}
    else{
      const d=DRUGS.find(x=>x.id===alt.id);
      if(d){const sc=d.scenarios[0];addToQueue({id:d.id,name:d.name,cat:'meds',icon:d.icon,priority:'URGENT',detail:`${d.sub} · ${sc.label}`},sc.build(W),{silent:true,noAlts:true});}
    }
    setAllergyAlts(p=>{
      if(!p)return null;
      const rem=p.alternatives.filter(a=>a.id!==alt.id);
      return rem.length?{...p,alternatives:rem}:null;
    });
  },[addToQueue,W]);

  // Queue item from palette — uses current drugScIdx and weight
  const palQueue=useCallback(item=>{
    if(queue.some(q=>q.id===item.id)){showToast(`${item.name} already in queue`);setPalOpen(false);return;}
    if(item._type==='simple'){
      addToQueue(item);
    } else {
      const si=drugScIdx[item.id]||0;
      const sc=item.scenarios[si];
      addToQueue({id:item.id,name:item.name,cat:'meds',icon:item.icon,priority:'URGENT',detail:`${item.sub} · ${sc.label}`},sc.build(W));
    }
    showToast(`✓ ${item.name} — added to queue`);
    setPalOpen(false);
    setPalQ('');
    setPalIdx(0);
  },[addToQueue,drugScIdx,W,showToast,queue]);

  // ⌘K keyboard listener
  React.useEffect(()=>{
    const down=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){
        e.preventDefault();
        if(bundlePalOpen)setBundlePalOpen(false);
        setPalOpen(p=>{if(!p)setTimeout(()=>palInputRef.current&&palInputRef.current.focus(),40);return!p;});
        setPalQ('');setPalIdx(0);
        return;
      }
      if((e.metaKey||e.ctrlKey)&&e.key==='b'){
        e.preventDefault();
        if(palOpen)setPalOpen(false);
        setBundlePalOpen(p=>{if(!p)setTimeout(()=>bundlePalRef.current&&bundlePalRef.current.focus(),40);return!p;});
        setBundlePalQ('');setBundlePalIdx(0);
        return;
      }
      if(palOpen){
        if(e.key==='Escape'){e.preventDefault();setPalOpen(false);return;}
        if(e.key==='ArrowDown'){e.preventDefault();setPalIdx(p=>Math.min(p+1,(palResults.length||1)-1));return;}
        if(e.key==='ArrowUp'){e.preventDefault();setPalIdx(p=>Math.max(p-1,0));return;}
        if(e.key==='Enter'){e.preventDefault();const it=palResults[palIdx];if(it)palQueue(it);return;}
      }
      if(bundlePalOpen){
        if(e.key==='Escape'){e.preventDefault();setBundlePalOpen(false);return;}
        if(e.key==='ArrowDown'){e.preventDefault();setBundlePalIdx(p=>Math.min(p+1,(bundlePalResults.length||1)-1));return;}
        if(e.key==='ArrowUp'){e.preventDefault();setBundlePalIdx(p=>Math.max(p-1,0));return;}
        if(e.key==='Enter'){e.preventDefault();const b=bundlePalResults[bundlePalIdx];if(b){applyBundle(b);setBundlePalOpen(false);}return;}
      }
    };
    window.addEventListener('keydown',down);
    return()=>window.removeEventListener('keydown',down);
  },[palOpen,bundlePalOpen,palResults,palIdx,palQueue,bundlePalResults,bundlePalIdx,applyBundle]);

  const handleAddDrug=useCallback(drug=>{
    const si=drugScIdx[drug.id]||0;
    const sc=drug.scenarios[si];
    addToQueue({id:drug.id,name:drug.name,cat:'meds',icon:drug.icon,priority:'URGENT',detail:`${drug.sub} · ${sc.label}`},sc.build(W));
  },[drugScIdx,W,addToQueue]);

  const handleCopyDrug=useCallback(async(drugId,scIdx)=>{
    const d=findDrug(drugId);if(!d)return;
    const sc=d.scenarios[scIdx||0];
    await copyText(sc.build(W));
    const key=`${drugId}_${scIdx||0}`;
    setCopySt(p=>({...p,[key]:'ok'}));
    setTimeout(()=>setCopySt(p=>({...p,[key]:'idle'})),1800);
  },[W]);

  const copyQueueItem=useCallback(async(id,text)=>{
    await copyText(text);
    setQCopySt(p=>({...p,[id]:'ok'}));
    setTimeout(()=>setQCopySt(p=>({...p,[id]:'idle'})),1800);
  },[]);

  const addFromAI=useCallback(ordId=>{
    const s=findSimple(ordId);
    if(s){addToQueue(s);return;}
    const d=findDrug(ordId);
    if(d){const sc=d.scenarios[0];addToQueue({id:d.id,name:d.name,cat:'meds',icon:d.icon,priority:'URGENT',detail:d.sub},sc.build(W));}
  },[W,addToQueue]);

  // Extended applyBundle: handles both SIMPLE order IDs and DRUG IDs
  const applyBundle=useCallback(bundle=>{
    const newItems=[];
    bundle.ids.forEach(([itemId,scLabel])=>{
      const d=findDrug(itemId);
      if(d){
        const sc=scLabel?d.scenarios.find(s=>s.label===scLabel)||d.scenarios[0]:d.scenarios[0];
        newItems.push({id:d.id,name:d.name,cat:'meds',icon:d.icon,priority:'URGENT',detail:`${d.sub} · ${sc.label}`,cpoeText:sc.build(W),allergyWarn:null,open:false});
        return;
      }
      const s=findSimple(itemId);
      if(s){
        const aw=getAllergyWarn(s);
        newItems.push({id:s.id,name:s.name,cat:s.cat,icon:s.icon,priority:s.priority,detail:s.detail,cpoeText:null,allergyWarn:aw,open:false});
      }
    });
    setQueue(p=>{const toAdd=newItems.filter(ni=>!p.some(q=>q.id===ni.id));return toAdd.length?[...p,...toAdd]:p;});
    setActiveBundle(bundle.label);
    setSuggestions([]);
    const bTT=BUNDLE_TIMER_TRIGGERS[bundle.label];
    if(bTT)startTimer(bTT);
    showToast(`📦 ${bundle.label} bundle applied · ACEP recs highlighted in catalog`);
  },[W,showToast,startTimer]);

  const runAI=async()=>{
    setAiLoading(true);
    try{
      const allergyStr=patientAllergies.length?patientAllergies.join(', '):'None known';
      const allIds=[...SIMPLE.map(o=>o.id),...DRUGS.map(d=>d.id)].join(', ');
      const result=await base44.integrations.Core.InvokeLLM({
        prompt:`Emergency medicine CDS AI. Patient: ${patientName||'Unknown'} | ${patientAge?patientAge+'y':''} ${patientSex||''} | CC: ${chiefComplaint||'Not specified'} | Allergies: ${allergyStr}
Generate 2-3 evidence-based order set recommendations. Use IDs from: ${allIds}
Mark each order status as: done (already given), active (currently running), or add (needs ordering). Do NOT recommend contraindicated or allergic orders.`,
        response_json_schema:{type:'object',properties:{sets:{type:'array',items:{type:'object',properties:{id:{type:'string'},title:{type:'string'},conf:{type:'number'},basis:{type:'string'},orders:{type:'array',items:{type:'object',properties:{id:{type:'string'},st:{type:'string'},note:{type:'string'}}}}}}}}}
      });
      if(result?.sets?.length){setAiSets(result.sets.map(s=>({...s,open:true})));showToast(`✦ AI analysis complete — ${result.sets.length} set(s) generated`);}
    }catch(e){showToast(`⚠ AI analysis failed — ${e.message}`);}
    setAiLoading(false);
  };

  const{filteredSimple,filteredDrugs}=useMemo(()=>{
    const q=searchQ.toLowerCase();
    const showSimple=activeCat!=='meds';
    const showDrugs=activeCat==='all'||activeCat==='meds';
    let simples=showSimple?(activeCat==='all'?SIMPLE:SIMPLE.filter(o=>o.cat===activeCat)):[];
    let drugs=showDrugs?DRUGS:[];
    if(q){simples=simples.filter(o=>o.name.toLowerCase().includes(q)||(o.detail&&o.detail.toLowerCase().includes(q)));drugs=drugs.filter(d=>d.name.toLowerCase().includes(q)||(d.sub&&d.sub.toLowerCase().includes(q)));}
    return{filteredSimple:simples,filteredDrugs:drugs};
  },[activeCat,searchQ]);

  const simpleGroups=useMemo(()=>{const g={};filteredSimple.forEach(o=>{if(!g[o.sub])g[o.sub]=[];g[o.sub].push(o);});return g;},[filteredSimple]);
  const drugGroups=useMemo(()=>{const g={};filteredDrugs.forEach(d=>{if(!g[d.cat])g[d.cat]=[];g[d.cat].push(d);});return g;},[filteredDrugs]);
  const isInQ=id=>queue.some(q=>q.id===id);
  const hasAllergyInQueue=queue.some(qi=>qi.allergyWarn);

  // Render bundle chips with group separators
  // Save current queue as a named set
  const saveCurrentQueue=useCallback(()=>{
    const name=saveNameInput.trim();
    if(!name||queue.length===0)return;
    const newSet={
      id:Date.now().toString(),
      name,
      savedAt:new Date().toISOString(),
      orders:queue.map(q=>({id:q.id,name:q.name,icon:q.icon,cat:q.cat,priority:q.priority,detail:q.detail,cpoeText:q.cpoeText||null})),
    };
    setSavedSets(p=>[newSet,...p]);
    setShowSaveInput(false);
    setSaveNameInput('');
    showToast(`✓ Saved “${name}” — ${queue.length} orders`);
  },[saveNameInput,queue,showToast]);

  const loadSavedSet=useCallback(set=>{
    const toAdd=set.orders.filter(o=>!queue.some(q=>q.id===o.id));
    if(!toAdd.length){showToast('All orders already in queue');return;}
    setQueue(p=>[...p,...toAdd.map(o=>({...o,open:false,allergyWarn:null}))]);
    setShowSetsPanel(false);
    showToast(`📦 Loaded “${set.name}” — ${toAdd.length} order${toAdd.length!==1?'s':''} added`);
  },[queue,showToast]);

  const deleteSavedSet=useCallback(id=>{
    setSavedSets(p=>p.filter(s=>s.id!==id));
    showToast('Set deleted');
  },[showToast]);

  const exportSet=useCallback(async set=>{
    const json=JSON.stringify({notryaOrderSet:true,version:1,name:set.name,orders:set.orders},null,2);
    await copyText(json);
    showToast('📋 Set JSON copied to clipboard');
  },[showToast]);

  const importFromJson=useCallback(str=>{
    try{
      const data=JSON.parse(str);
      if(!data.notryaOrderSet||!Array.isArray(data.orders))throw new Error('Invalid');
      const newSet={id:Date.now().toString(),name:data.name||'Imported Set',savedAt:new Date().toISOString(),orders:data.orders};
      setSavedSets(p=>[newSet,...p]);
      setImportInput('');
      setShowImport(false);
      showToast(`✓ Imported “${newSet.name}” — ${newSet.orders.length} orders`);
    }catch{
      showToast('⚠ Invalid format — paste a Notrya order set JSON');
    }
  },[showToast]);

  React.useEffect(()=>{
    const qids=new Set(queue.map(q=>q.id));
    const active=CONFLICT_PAIRS
      .filter(r=>r.ids.every(id=>qids.has(id)))
      .map(r=>({...r,uid:r.ids.slice().sort().join('+')}));
    const sorted=[...active.filter(c=>c.sev==='alert'),...active.filter(c=>c.sev==='warning')];
    setConflicts(sorted.filter(c=>!dismissedRef.current.has(c.uid)));
  },[queue]);

  const dismissConflict=useCallback(uid=>{
    dismissedRef.current.add(uid);
    setConflicts(p=>p.filter(c=>c.uid!==uid));
  },[]);

  return(
    <div className="edoh-wrap" style={{height:embedded?'100%':'calc(100vh - 186px)'}}>
      <style>{CSS}</style>
      <NotryaPatientBar/>
      <div className="edoh-layout">

        {/* AI PANEL */}
        <aside className="ai-panel">
          <div className="ph">
            <div className="ai-dot"/>
            <div><div className="ph-title">AI Recommendations</div><div className="ph-sub">Chart-based · live analysis</div></div>
          </div>
          <div className="ai-body">
            {aiSets.length>0&&(
              <button className="ai-addall" onClick={()=>aiSets.forEach(set=>set.orders.forEach(o=>{if(o.st==='add')addFromAI(o.id);}))}>
                ✦ Add All New ({aiSets.reduce((a,s)=>a+s.orders.filter(o=>o.st==='add').length,0)})
              </button>
            )}
            {aiLoading&&<div style={{textAlign:'center',padding:'20px 10px',color:T.teal,fontSize:12}}><div style={{fontSize:24,marginBottom:8}}>✦</div>Analyzing chart…</div>}
            {!aiLoading&&aiSets.map(set=>(
              <div key={set.id} className={`ai-set ${set.open?'open':''}`}>
                <div className="ai-set-hdr" onClick={()=>setAiSets(p=>p.map(s=>s.id===set.id?{...s,open:!s.open}:s))}>
                  <span className="ai-conf" style={{background:set.conf>=90?'rgba(255,107,107,.15)':'rgba(255,159,67,.12)',color:set.conf>=90?T.coral:T.orange,border:`1px solid ${set.conf>=90?'rgba(255,107,107,.3)':'rgba(255,159,67,.3)'}`}}>{set.conf}%</span>
                  <div style={{flex:1}}><div className="ai-sname">{set.title}</div><div className="ai-sbasis">{set.basis}</div></div>
                  <span className="ai-chev">▼</span>
                </div>
                <div className="ai-set-body">
                  {set.orders.map((o,i)=>{
                    const rec=findSimple(o.id)||findDrug(o.id);
                    const canAdd=o.st==='add';
                    return(
                      <div key={i} className={`ai-orow ${canAdd?'addable':''}`} onClick={()=>canAdd&&addFromAI(o.id)}>
                        <div className={`ai-sdot ${o.st}`}>{o.st==='done'?'✓':o.st==='active'?'●':'+'}</div>
                        <span className="ai-oname">{rec?.name||o.id}</span>
                        {o.note&&<span className="ai-onote">{o.note}</span>}
                        {canAdd&&<div className="ai-add-ic">+</div>}
                      </div>
                    );
                  })}
                  <div className="ai-set-acts">
                    <button className="ai-addbtn" onClick={()=>set.orders.forEach(o=>{if(o.st==='add')addFromAI(o.id);})}>+ Add New</button>
                  </div>
                </div>
              </div>
            ))}
            {!aiLoading&&aiSets.length===0&&<div style={{textAlign:'center',padding:'28px 10px',color:T.txt4,fontSize:12}}><div style={{fontSize:28,opacity:.2,marginBottom:8}}>🤖</div>Click Live AI Analysis below</div>}
          </div>
          <div className="ai-foot">
            <button className="btn-analyze" onClick={runAI} disabled={aiLoading}>{aiLoading?'⏳ Analyzing…':'🤖 Live AI Analysis'}</button>
          </div>
        </aside>

        {/* CATALOG */}
        <main className="cat-panel">
          <div className="cat-top">
            <div className="srch">
              <span style={{opacity:.5,fontSize:12,flexShrink:0}}>🔍</span>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search labs, meds, imaging, procedures…"/>
              {searchQ&&<button onClick={()=>setSearchQ('')} style={{background:'none',border:'none',color:T.txt4,cursor:'pointer',fontSize:12,flexShrink:0}}>✕</button>}
            </div>
            <div className="wt-wrap">
              <span className="wt-lbl">Wt (kg)</span>
              <input type="number" inputMode="decimal" className={`wt-inp ${wt?'filled':''}`} value={wt} onChange={e=>setWt(e.target.value)} placeholder="70"/>
              {wt&&<span style={{fontSize:9,color:T.teal,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>{parseFloat(wt)||0}kg</span>}
            </div>
            <button className="pal-trigger" onClick={()=>{setPalOpen(true);setTimeout(()=>palInputRef.current&&palInputRef.current.focus(),40);}}>
              ⌘K
            </button>
          </div>

          {/* Bundle Category Tabs — Row 1 */}
          <div className="bcat-row">
            {BUNDLE_GROUPS.map(g=>{
              const col=g.color;
              const isA=activeBundleCat===g.id;
              return(
                <button key={g.id} className={`bcat-tab ${isA?'active':''}`}
                  style={isA?{background:`${col}18`,border:`1px solid ${col}55`,color:col}:{}}
                  onClick={()=>setActiveBundleCat(g.id)}>
                  <span>{g.icon}</span>{g.label}
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,opacity:.6,marginLeft:1}}>
                    ({BUNDLES.filter(b=>b.group===g.id).length})
                  </span>
                </button>
              );
            })}
          </div>
          {/* Bundle Chips — Row 2 (filtered by active category) */}
          {(()=>{
            const catBundles=BUNDLES.filter(b=>b.group===activeBundleCat);
            return(
              <div className="bchips-row">
                {catBundles.map(b=>(
                  <button key={b.label}
                    className={`bchip ${activeBundle===b.label?'active':''}`}
                    onClick={()=>activeBundle===b.label?setActiveBundle(null):applyBundle(b)}
                    style={{border:`1px solid ${b.color}44`,background:`${b.color}14`,color:b.color}}>
                    <span>{b.icon}</span>{b.label}
                  </button>
                ))}
                {catBundles.length===0&&<span className="bchip-empty">No bundles in this category</span>}
                <button className="pal-trigger" style={{marginLeft:'auto',flexShrink:0}}
                  onClick={()=>{setBundlePalOpen(true);setBundlePalQ('');setBundlePalIdx(0);setTimeout(()=>bundlePalRef.current&&bundlePalRef.current.focus(),40);}}>
                  ⌘B
                </button>
              </div>
            );
          })()}

          {/* QUICK DOSE STRIP */}
          <div className="qdose-row">
            <span className="qdose-hdr">Fast Rx</span>
            {QUICK_DOSES.map(qd=>{
              const inQ=isInQ(qd.id);
              const doseStr=qd.doseLabel(W);
              const drugRef=DRUGS.find(d=>d.id===qd.id)||{};
              return(
                <button key={qd.id}
                  className={`qdose-chip ${inQ?'inq':''}`}
                  style={{
                    borderColor:`${qd.color}${inQ?'99':'44'}`,
                    color:inQ?T.bg:qd.color,
                    background:inQ?qd.color:`${qd.color}12`,
                  }}
                  onClick={()=>{
                    if(inQ){removeFromQueue(qd.id);return;}
                    addToQueue({
                      id:qd.id,
                      name:drugRef.name||qd.label,
                      cat:'meds',
                      icon:qd.icon,
                      priority:'URGENT',
                      detail:`${doseStr} · Quick Dose`,
                      alert:drugRef.alert||null,
                      contrast:drugRef.contrast||false,
                    },qd.build(W));
                  }}>
                  {inQ&&<span className="qd-check">✓</span>}
                  <span className="qd-name">{qd.label}</span>
                  <span className="qd-dose">{doseStr}</span>
                </button>
              );
            })}
          </div>

          {/* ACEP guideline highlight banner */}
          {activeBundle&&(
            <div className="acep-banner">
              <span style={{fontSize:14}}>✦</span>
              <span className="acep-banner-txt">ACEP guidelines active: {activeBundle}</span>
              <span className="acep-banner-sub">— teal glow = guideline-recommended orders</span>
              <button className="acep-clr" onClick={()=>setActiveBundle(null)}>✕ Clear</button>
            </div>
          )}

          <div className="cat-tabs">
            {CAT_TABS.map(c=><button key={c.id} className={`ctab ${activeCat===c.id?'active':''}`} onClick={()=>setActiveCat(c.id)}>{c.label}</button>)}
          </div>

          <div className="cat-body">
            {(activeCat==='all'||activeCat==='meds')&&!wt&&(
              <div className="wt-warn">⚠ Enter patient weight above for accurate weight-based dosing calculations</div>
            )}

            {/* Simple order cards */}
            {Object.entries(simpleGroups).map(([sub,orders])=>(
              <div key={sub}>
                <div className="sec-ttl">{sub}</div>
                <div className="orders-grid">
                  {orders.map(order=>{
                    const inQ=isInQ(order.id);
                    const aw=getAllergyWarn(order);
                    const isRec=acepRecs.has(order.id);
                    return(
                      <div key={order.id} className={`oc ${inQ?'inq':''} ${isRec?'acep-rec':''}`} onClick={()=>inQ?removeFromQueue(order.id):addToQueue(order)}>
                        {inQ&&<div className="oc-ck">✓</div>}
                        <div style={{display:'flex',gap:5,alignItems:'flex-start',marginBottom:2}}>
                          <span style={{fontSize:11,flexShrink:0}}>{order.icon}</span>
                          <span className="oc-nm">{order.name}</span>
                        </div>
                        <div className="oc-dt">{order.detail}</div>
                        {aw&&<div className="allg-chip">⚠ {aw.name}</div>}
                        <div className="oc-ft">
                          {isRec&&<span className="acep-bdg">ACEP ✓</span>}
                          <span className={`prio ${pc(order.priority)}`}>{order.priority}</span>
                          <span style={{fontSize:9,color:T.txt4}}>{order.meta}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Drug cards */}
            {Object.entries(drugGroups).map(([cat,drugs])=>(
              <div key={cat}>
                <div className="sec-ttl" style={{color:CAT_META[cat]?.color||T.txt3}}>{CAT_META[cat]?.label||cat}</div>
                <div className="drug-grid">
                  {drugs.map(drug=>{
                    const si=drugScIdx[drug.id]||0;
                    const sc=drug.scenarios[si];
                    const inQ=isInQ(drug.id);
                    const cpKey=`${drug.id}_${si}`;
                    const isCopied=copySt[cpKey]==='ok';
                    const isRec=acepRecs.has(drug.id);
                    return(
                      <div key={drug.id} className={`mc ${isRec?'acep-rec':''}`}>
                        <div className="mc-top">
                          <span style={{fontSize:18,flexShrink:0}}>{drug.icon}</span>
                          <div className="mc-info">
                            <div className="mc-name">{drug.name}</div>
                            <div className="mc-sub">{drug.sub}</div>
                            <div className="mc-bdg">
                              {isRec&&<span className="bdg" style={{background:'rgba(0,229,192,.12)',color:T.teal,border:'1px solid rgba(0,229,192,.35)'}}>ACEP ✓</span>}
                              {drug.cor&&<span className="bdg" style={{background:drug.cor==='I'?'rgba(0,229,192,.1)':'rgba(59,158,255,.1)',color:drug.cor==='I'?T.teal:T.blue,border:`1px solid ${drug.cor==='I'?'rgba(0,229,192,.3)':'rgba(59,158,255,.3)'}`}}>COR {drug.cor}</span>}
                              {drug.wtBased&&<span className="bdg" style={{background:'rgba(245,200,66,.08)',color:T.gold,border:'1px solid rgba(245,200,66,.25)'}}>Wt-Based</span>}
                            </div>
                          </div>
                        </div>
                        {drug.scenarios.length>1&&(
                          <div className="mc-sc">
                            {drug.scenarios.map((s,i)=>(
                              <button key={i} className={`sc-btn ${si===i?'sel':''}`} onClick={()=>setDrugScIdx(p=>({...p,[drug.id]:i}))}>{s.label}</button>
                            ))}
                          </div>
                        )}
                        <div className="mc-acts">
                          <button className={`mc-copy ${isCopied?'cpok':''}`} onClick={()=>handleCopyDrug(drug.id,si)}>{isCopied?'✓ Copied':'Copy CPOE'}</button>
                          <button className={`mc-add ${inQ?'inq':''}`} onClick={()=>inQ?removeFromQueue(drug.id):handleAddDrug(drug)}>{inQ?'✓ In Queue':'+ Queue'}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredSimple.length===0&&filteredDrugs.length===0&&(
              <div className="no-results">
                <div style={{fontSize:30,opacity:.2,marginBottom:8}}>🔍</div>
                <div>No results for &ldquo;{searchQ}&rdquo;</div>
              </div>
            )}
          </div>
        </main>

        {/* QUEUE */}
        <aside className="q-panel">
          <div className="ph">
            <div><div className="ph-title">Order Queue</div><div className="ph-sub">Review · Priority · Sign</div></div>
            <span className="qcnt">{queue.length}</span>
          </div>
          {/* TIME-CRITICAL TIMERS */}
          {timers.length>0&&(
            <div className="timers-wrap">
              {timers.map(timer=>{
                const def=TIMER_DEFS[timer.id];if(!def)return null;
                void tick;
                const elapsed=Date.now()-timer.startedAt;
                const pct=Math.min(elapsed/(def.targetSec*1000),1);
                const isDone=(TIMER_COMPLETE_FN[timer.id]&&TIMER_COMPLETE_FN[timer.id](queue))||false;
                const phase=isDone?'done':pct<0.5?'green':pct<0.8?'amber':'red';
                const barC=isDone?'#00e5c0':phase==='green'?'#3dffa0':phase==='amber'?'#f5c842':'#ff6b6b';
                const remaining=Math.max(def.targetSec*1000-elapsed,0);
                return(
                  <div key={timer.id} className={`timer-card phase-${phase}`}>
                    <div className="timer-top">
                      <span className="timer-icon">{def.icon}</span>
                      <span className="timer-label">{def.label}</span>
                      {isDone&&<span className="timer-done-badge">✓ Addressed</span>}
                      <button className="timer-dismiss" onClick={()=>dismissTimer(timer.id)}>✕</button>
                    </div>
                    <div className="timer-bar-bg">
                      <div className="timer-bar-fill" style={{width:`${pct*100}%`,background:barC}}/>
                    </div>
                    <div className="timer-bottom">
                      <span className="timer-elapsed" style={{color:isDone?'#00e5c0':barC}}>{fmtTime(elapsed)}</span>
                      <div className="timer-meta">
                        {isDone
                          ?<span className="timer-remaining" style={{color:'#00e5c0'}}>Protocol addressed</span>
                          :<span className="timer-remaining" style={{color:phase==='red'?'#ff6b6b':'#a8c8e8'}}>{fmtTime(remaining)} remaining</span>
                        }
                        <span className="timer-guideline">{def.metric}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* ALLERGY ALTERNATIVES */}
          {allergyAlts&&(
            <div className="allergy-alts">
              <div className="allergy-alts-hdr">
                <span className="allergy-alts-icon">⚠️</span>
                <div style={{flex:1}}>
                  <div className="allergy-alts-title">Allergy Conflict — {allergyAlts.allergyName}</div>
                  <div className="allergy-alts-sub">{allergyAlts.triggeredByName} flagged · consider these alternatives</div>
                  <div className="allergy-alts-sub" style={{color:'#7aa0c0',marginTop:2,fontSize:8}}>{allergyAlts.guideline}</div>
                </div>
                <button className="allergy-alts-dismiss" onClick={()=>setAllergyAlts(null)}>✕</button>
              </div>
              {allergyAlts.protocols&&allergyAlts.protocols.length>0&&(
                <div className="alt-protocol">
                  <div className="alt-proto-lbl">Protocol</div>
                  {allergyAlts.protocols.map((p,i)=>(
                    <div key={i} className="alt-proto-txt">{i>0&&<span style={{opacity:.5}}>— </span>}{p}</div>
                  ))}
                </div>
              )}
              <div className="alt-list">
                {allergyAlts.alternatives.map(alt=>{
                  const item=SIMPLE.find(o=>o.id===alt.id)||DRUGS.find(d=>d.id===alt.id);
                  if(!item)return null;
                  return(
                    <div key={alt.id} className="alt-item">
                      <div className="alt-top">
                        <span className="alt-icon">{item.icon}</span>
                        <span className="alt-name">{item.name}</span>
                        <span className={`alt-risk ${alt.xrClass}`}>XR: {alt.crossRisk}</span>
                      </div>
                      <div className="alt-reason">{alt.reason}</div>
                      {alt.note&&<div className="alt-note">{alt.note}</div>}
                      <button className="alt-add" onClick={()=>addAllergyAlt(alt)}>+ Queue as Alternative</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* DRUG CONFLICT DETECTION */}
          {conflicts.length>0&&(
            <div className="conflicts-wrap">
              <div className="cf-hdr">⚡ Interaction Alerts ({conflicts.length})</div>
              {conflicts.map(c=>(
                <div key={c.uid} className={`cf-card sev-${c.sev}`}>
                  <div className="cf-top">
                    <span className="cf-icon">{c.icon}</span>
                    <span className="cf-title">{c.title}</span>
                    <button className="cf-x" onClick={()=>dismissConflict(c.uid)}>✕</button>
                  </div>
                  <div className="cf-msg">{c.msg}</div>
                  <div className="cf-rec">{c.rec}</div>
                </div>
              ))}
            </div>
          )}
          <div className="q-body">
            {queue.length===0?(
              <div className="q-empty">
                <div style={{fontSize:32,opacity:.2}}>📋</div>
                <div style={{fontSize:13,color:T.txt3}}>No orders in queue</div>
                <div style={{fontSize:11,color:T.txt4}}>Click catalog items or use bundles</div>
              </div>
            ):(
              queue.map(item=>(
                <div key={item.id} className={`qi ${item.open?'open':''}`}>
                  <div className="qi-row" onClick={()=>setQueue(p=>p.map(q=>q.id===item.id?{...q,open:!q.open}:q))}>
                    <span className={`pp ${item.priority}`}>{item.priority}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="qi-nm">{item.icon} {item.name}</div>
                      <div className="qi-dt">{item.detail}</div>
                    </div>
                    <span className="qi-chev">▼</span>
                    <button className="qi-rm" onClick={e=>{e.stopPropagation();removeFromQueue(item.id);}}>✕</button>
                  </div>
                  {item.open&&(
                    <div className="qi-exp">
                      {item.allergyWarn&&<div className="qi-allg">⚠ {item.allergyWarn.name} — {item.allergyWarn.sev} ({item.allergyWarn.reaction})</div>}
                      <div className="qi-lbl">Priority</div>
                      <div className="prio-sel">
                        {['STAT','URGENT','ROUTINE'].map(p=>(
                          <button key={p} className={`ps-btn ${p} ${item.priority===p?'sel':''}`} onClick={()=>setQueue(q=>q.map(x=>x.id===item.id?{...x,priority:p}:x))}>{p}</button>
                        ))}
                      </div>
                      {item.cpoeText&&(
                        <>
                          <div className="qi-lbl" style={{marginTop:4}}>CPOE Text</div>
                          <pre className="cpoe-pre">{item.cpoeText}</pre>
                          <button className={`cpoe-copy ${qCopySt[item.id]==='ok'?'cpok':''}`} onClick={()=>copyQueueItem(item.id,item.cpoeText)}>
                            {qCopySt[item.id]==='ok'?'✓ Copied':'Copy CPOE Text'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {/* ALSO CONSIDER */}
          {suggestions.length>0&&(
            <div className="sugg-section">
              <div className="sugg-hdr">
                <span className="sugg-hdr-ic">⚡</span>
                Also Consider
                <button className="sugg-dismiss-all" onClick={()=>setSuggestions([])}>Dismiss ✕</button>
              </div>
              <div className="sugg-list">
                {suggestions.map(sugg=>{
                  const item=SIMPLE.find(o=>o.id===sugg.id)||DRUGS.find(d=>d.id===sugg.id);
                  if(!item)return null;
                  return(
                    <div key={sugg.id} className="sugg-item">
                      <span className="sugg-ic">{item.icon}</span>
                      <div className="sugg-body">
                        <div className="sugg-name">{item.name}</div>
                        <div className="sugg-reason">{sugg.reason}</div>
                      </div>
                      <button className="sugg-add" onClick={()=>addSuggestion(sugg)}>+ Add</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* SAVE INPUT */}
          {showSaveInput&&queue.length>0&&(
            <div className="save-input-row">
              <input
                className="save-inp"
                value={saveNameInput}
                onChange={e=>setSaveNameInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')saveCurrentQueue();if(e.key==='Escape'){setShowSaveInput(false);setSaveNameInput('')};}}
                placeholder="Set name (e.g. My Sepsis Protocol)…"
                autoFocus
              />
              <button className="save-go" onClick={saveCurrentQueue} disabled={!saveNameInput.trim()}>Save</button>
              <button className="save-cancel" onClick={()=>{setShowSaveInput(false);setSaveNameInput('');}}>✕</button>
            </div>
          )}
          {/* SAVED SETS STRIP */}
          <div className="sets-strip">
            <button className="strip-btn strip-save" disabled={queue.length===0}
              onClick={()=>{setShowSaveInput(p=>!p);setSaveNameInput('');}}>
              💾 {showSaveInput?'Cancel Save':'Save Set'}
            </button>
            <button className="strip-btn strip-open" onClick={()=>setShowSetsPanel(true)}>
              📚 My Sets{savedSets.length>0?` (${savedSets.length})`:''}
            </button>
          </div>
          <div className="q-foot">
            {hasAllergyInQueue&&<div className="allg-warn">⚠ Allergy conflict in queue — review before signing</div>}
            <button className="sign-btn" disabled={queue.length===0} onClick={()=>{
              if(queue.length){
                const now=ts();
                const snap={orders:[...queue],mdmText:buildMDMText(queue,now),signedAt:now,count:queue.length};
                window.__notryaMDMBridge=snap;
                try{window.dispatchEvent(new CustomEvent('notryaOrdersSigned',{detail:snap}));}catch(_){}
                setSignedSnapshot(snap);
                setQueue([]);setActiveBundle(null);setSuggestions([]);
                setAllergyAlts(null);setConflicts([]);dismissedRef.current.clear();
                setTimers([]);setTick(0);
              }
            }}>
              ✍ Sign {queue.length>0?`${queue.length} Order${queue.length>1?'s':''}`:' Orders'} → MDM
            </button>
            {queue.length>0&&<button className="clr-btn" onClick={()=>{setQueue([]);setActiveBundle(null);setSuggestions([]);setAllergyAlts(null);setConflicts([]);dismissedRef.current.clear();setTimers([]);setTick(0);}}>Clear all orders</button>}
          </div>
        </aside>

      </div>
      <div className={`toast ${!toast?'hide':''}`}>{toast}</div>

      {/* SAVED SETS PANEL */}
      {showSetsPanel&&(
        <div className="sets-overlay" onClick={()=>setShowSetsPanel(false)}>
          <div className="sets-panel" onClick={e=>e.stopPropagation()}>
            <div className="sets-hdr">
              <span style={{fontSize:20}}>📚</span>
              <span className="sets-title">My Order Sets</span>
              <button className="sets-close" onClick={()=>setShowSetsPanel(false)}>✕</button>
            </div>
            <div className="sets-body">
              {savedSets.length===0&&(
                <div className="sets-empty">
                  <div style={{fontSize:32,opacity:.15,marginBottom:10}}>📋</div>
                  <div style={{marginBottom:6}}>No saved sets yet</div>
                  <div style={{fontSize:11,color:'#4a6a8a'}}>Build a queue, then click 💾 Save Set to store it for future shifts</div>
                </div>
              )}
              {savedSets.map(set=>(
                <div key={set.id} className="set-card">
                  <div className="set-name">{set.name}</div>
                  <div className="set-meta">{set.orders.length} order{set.orders.length!==1?'s':''} · {fmtSavedAt(set.savedAt)}</div>
                  <div className="set-preview">
                    {set.orders.slice(0,6).map(o=>(
                      <span key={o.id} className="set-chip">{o.icon} {o.name.split(' ')[0]}</span>
                    ))}
                    {set.orders.length>6&&<span className="set-chip">+{set.orders.length-6} more</span>}
                  </div>
                  <div className="set-acts">
                    <button className="set-btn load" onClick={()=>loadSavedSet(set)}>Load into Queue</button>
                    <button className="set-btn exp" onClick={()=>exportSet(set)}>Export</button>
                    <button className="set-btn del" onClick={()=>deleteSavedSet(set.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sets-foot">
              {showImport&&(
                <div className="import-area">
                  <div style={{fontSize:10,color:'#7aa0c0',fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>PASTE NOTRYA ORDER SET JSON</div>
                  <textarea
                    className="import-ta"
                    value={importInput}
                    onChange={e=>setImportInput(e.target.value)}
                    placeholder='{"notryaOrderSet": true, "name": "...", "orders": [...]}'
                  />
                  <div style={{display:'flex',gap:5}}>
                    <button className="import-btn" onClick={()=>importFromJson(importInput)}>Import Set</button>
                    <button className="save-cancel" onClick={()=>{setShowImport(false);setImportInput('');}}>Cancel</button>
                  </div>
                </div>
              )}
              {!showImport&&(
                <button className="set-btn exp" style={{width:'100%'}} onClick={()=>setShowImport(true)}>📋 Import from JSON</button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MDM BRIDGE PANEL */}
      {signedSnapshot&&(
        <div className="mdm-overlay" onClick={()=>setSignedSnapshot(null)}>
          <div className="mdm-panel" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{flexShrink:0,padding:'14px 16px 10px',borderBottom:`1px solid ${T.bd}`,display:'flex',gap:10,alignItems:'center'}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:'rgba(0,229,192,.12)',border:'2px solid rgba(0,229,192,.38)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>✓</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.txt}}>{signedSnapshot.count} Orders Signed</div>
                <div style={{fontSize:10,color:T.txt3,marginTop:1}}>Signed {signedSnapshot.signedAt} · MDM documentation ready</div>
              </div>
              <button style={{background:'none',border:'none',color:T.txt4,fontSize:18,cursor:'pointer'}} onClick={()=>setSignedSnapshot(null)}>✕</button>
            </div>
            {/* Category chips */}
            <div style={{flexShrink:0,padding:'9px 14px',borderBottom:`1px solid ${T.bd}`,display:'flex',flexWrap:'wrap',gap:5}}>
              {[['labs','🧪'],['imaging','🧻'],['meds','💊'],['procedures','⚡'],['consults','🩺']].map(([cat,ic])=>{
                const n=signedSnapshot.orders.filter(o=>o.cat===cat).length;
                return n>0?(
                  <span key={cat} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',background:T.bgC,border:`1px solid ${T.bd}`,borderRadius:20,fontSize:10,fontWeight:600,color:T.txt2}}>
                    {ic} <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:T.teal}}>{n}</span> {cat.charAt(0).toUpperCase()+cat.slice(1)}
                  </span>
                ):null;
              })}
            </div>
            {/* MDM text */}
            <div style={{flex:1,overflowY:'auto',padding:'10px 14px'}}>
              <div style={{fontSize:9,fontWeight:700,color:T.txt4,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>MDM Documentation — Ready to paste</div>
              <pre className="mdm-pre">{signedSnapshot.mdmText}</pre>
              <div style={{marginTop:8,fontSize:9,color:T.txt4,lineHeight:1.5}}>
                <div>✦ Paste into MDMBuilderTab → Data &amp; Management section</div>
                <div style={{marginTop:3}}>✦ Event fired: <code style={{background:'rgba(255,255,255,.06)',padding:'1px 5px',borderRadius:3,fontSize:8,fontFamily:"'JetBrains Mono',monospace"}}>notryaOrdersSigned</code> · window.__notryaMDMBridge set</div>
              </div>
            </div>
            {/* Footer */}
            <div style={{flexShrink:0,padding:'10px 14px',borderTop:`1px solid ${T.bd}`,display:'flex',gap:7}}>
              <button className={`mdm-copy ${mdmCopied?'cpok':''}`}
                onClick={async()=>{await copyText(signedSnapshot.mdmText);setMdmCopied(true);setTimeout(()=>setMdmCopied(false),2200);}}>
                {mdmCopied?'✓ Copied to Clipboard':'Copy MDM Text'}
              </button>
              <button style={{flex:1,padding:8,fontSize:11,fontWeight:700,background:T.bgU,border:`1px solid ${T.bd}`,borderRadius:7,color:T.txt3,cursor:'pointer'}}
                onClick={()=>setSignedSnapshot(null)}>New Session
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BUNDLE PALETTE ⌘B */}
      {bundlePalOpen&&(
        <div className="pal-overlay" onClick={()=>setBundlePalOpen(false)}>
          <div className="pal-box" onClick={e=>e.stopPropagation()}>
            <div className="pal-top">
              <span className="pal-icon">📦</span>
              <input
                ref={bundlePalRef}
                className="pal-inp"
                value={bundlePalQ}
                onChange={e=>{setBundlePalQ(e.target.value);setBundlePalIdx(0);}}
                placeholder="Search bundles by name or category…"
                autoComplete="off"
                spellCheck={false}
              />
              {bundlePalQ&&<button onClick={()=>{setBundlePalQ('');setBundlePalIdx(0);bundlePalRef.current&&bundlePalRef.current.focus();}} style={{background:'none',border:'none',color:T.txt4,cursor:'pointer',fontSize:13,padding:'0 4px'}}>✕</button>}
              <span className="pal-esc">ESC</span>
            </div>
            <div className="pal-results">
              {!bundlePalQ.trim()&&(
                <div className="pal-empty">
                  <div style={{fontSize:28,opacity:.15,marginBottom:10}}>📦</div>
                  <div>{BUNDLES.length} bundles across {BUNDLE_GROUPS.length} categories</div>
                  <div style={{marginTop:6,fontSize:11,color:T.txt4}}>Type to filter · ↑↓ navigate · ↵ apply</div>
                </div>
              )}
              {bundlePalResults.length===0&&bundlePalQ.trim()&&(
                <div className="pal-empty">No bundles matching &ldquo;{bundlePalQ}&rdquo;</div>
              )}
              {bundlePalResults.length>0&&(()=>{
                let lastGrp=null;
                return bundlePalResults.map((b,i)=>{
                  const grpDef=BUNDLE_GROUPS.find(g=>g.id===b.group);
                  const showGrp=b.group!==lastGrp&&!bundlePalQ.trim();
                  lastGrp=b.group;
                  const isActive=activeBundle===b.label;
                  return(
                    <React.Fragment key={b.label}>
                      {showGrp&&<div className="pal-group-lbl" style={{color:grpDef?.color||T.txt4}}>{b.group}</div>}
                      <div className={`pal-item ${bundlePalIdx===i?'sel':''}`}
                        onClick={()=>{applyBundle(b);setBundlePalOpen(false);setActiveBundleCat(b.group);}}
                        onMouseEnter={()=>setBundlePalIdx(i)}>
                        <span className="pi-icon">{b.icon}</span>
                        <div className="pi-body">
                          <div className="pi-name">{b.label}</div>
                          <div className="pi-detail">{b.ids.length} orders · {b.group}</div>
                        </div>
                        <div className="pi-tags">
                          <span className="pi-tag" style={{background:`${b.color}18`,color:b.color,border:`1px solid ${b.color}33`}}>{b.group}</span>
                          {isActive&&<span className="pi-inq">✓ Active</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
            </div>
            {bundlePalResults.length>0&&(
              <div className="pal-footer">
                <span className="pf-hint"><span className="pf-k">↑↓</span>navigate</span>
                <span className="pf-hint"><span className="pf-k">↵</span>apply bundle</span>
                <span className="pf-hint"><span className="pf-k">ESC</span>close</span>
                <span style={{marginLeft:'auto',fontSize:10,color:T.txt4}}>{bundlePalResults.length} bundle{bundlePalResults.length!==1?'s':''}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* COMMAND PALETTE */}
      {palOpen&&(
        <div className="pal-overlay" onClick={()=>setPalOpen(false)}>
          <div className="pal-box" onClick={e=>e.stopPropagation()}>
            <div className="pal-top">
              <span className="pal-icon">⌘</span>
              <input
                ref={palInputRef}
                className="pal-inp"
                value={palQ}
                onChange={e=>{setPalQ(e.target.value);setPalIdx(0);}}
                placeholder="Search orders, medications, labs, procedures…"
                autoComplete="off"
                spellCheck={false}
              />
              {palQ&&<button onClick={()=>{setPalQ('');setPalIdx(0);palInputRef.current&&palInputRef.current.focus();}} style={{background:'none',border:'none',color:T.txt4,cursor:'pointer',fontSize:13,padding:'0 4px'}}>✕</button>}
              <span className="pal-esc">ESC</span>
            </div>
            <div className="pal-results">
              {!palQ.trim()&&(
                <div className="pal-empty">
                  <div style={{fontSize:28,opacity:.15,marginBottom:10}}>⌘K</div>
                  <div>Type to instantly search {SIMPLE.length + DRUGS.length} orders, meds, labs &amp; procedures</div>
                  {activeBundle&&<div style={{marginTop:8,fontSize:11,color:T.teal}}>✦ {activeBundle} ACEP recs will highlight in results</div>}
                </div>
              )}
              {palQ.trim()!==''&&palResults.length===0&&(
                <div className="pal-empty">No results for &ldquo;{palQ}&rdquo;</div>
              )}
              {palResults.length>0&&(()=>{
                let lastType=null;
                return palResults.map((item,i)=>{
                  const typeLabel=item._type==='drug'?'Medications':'Orders';
                  const showHeader=typeLabel!==lastType;
                  lastType=typeLabel;
                  const inQ=isInQ(item.id);
                  const isRec=acepRecs.has(item.id);
                  const catKey=item._type==='drug'?item.cat:item.cat;
                  const catColor=item._type==='drug'?(CAT_META[catKey]?.color||T.txt3):(item.cat==='labs'?T.blue:item.cat==='imaging'?T.purple:item.cat==='procedures'?T.gold:item.cat==='consults'?T.teal:T.txt3);
                  const catLabel=item._type==='drug'?(CAT_META[catKey]?.label||catKey):(item.cat.charAt(0).toUpperCase()+item.cat.slice(1));
                  return(
                    <React.Fragment key={item.id}>
                      {showHeader&&<div className="pal-group-lbl">{typeLabel}</div>}
                      <div className={`pal-item ${palIdx===i?'sel':''}`}
                        onClick={()=>palQueue(item)}
                        onMouseEnter={()=>setPalIdx(i)}>
                        <span className="pi-icon">{item.icon}</span>
                        <div className="pi-body">
                          <div className="pi-name">{item.name}</div>
                          <div className="pi-detail">{item._type==='drug'?item.sub:item.detail}</div>
                        </div>
                        <div className="pi-tags">
                          {isRec&&<span className="pi-tag" style={{background:'rgba(0,229,192,.13)',color:T.teal,border:'1px solid rgba(0,229,192,.32)'}}>ACEP ✓</span>}
                          <span className="pi-tag" style={{background:`${catColor}18`,color:catColor,border:`1px solid ${catColor}33`}}>{catLabel}</span>
                          {item._type==='simple'&&<span className="pi-tag" style={{background:item.priority==='STAT'?'rgba(255,107,107,.15)':'rgba(255,159,67,.12)',color:item.priority==='STAT'?T.coral:T.orange,border:`1px solid ${item.priority==='STAT'?'rgba(255,107,107,.3)':'rgba(255,159,67,.3)'}`}}>{item.priority}</span>}
                          {item._type==='drug'&&item.cor&&<span className="pi-tag" style={{background:'rgba(0,229,192,.1)',color:T.teal,border:'1px solid rgba(0,229,192,.28)'}}>COR {item.cor}</span>}
                          {inQ&&<span className="pi-inq">✓ Queued</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
            </div>
            {palQ.trim()&&palResults.length>0&&(
              <div className="pal-footer">
                <span className="pf-hint"><span className="pf-k">↑↓</span>navigate</span>
                <span className="pf-hint"><span className="pf-k">↵</span>add to queue</span>
                <span className="pf-hint"><span className="pf-k">ESC</span>close</span>
                <span style={{marginLeft:'auto',fontSize:10,color:T.txt4}}>{palResults.length} result{palResults.length!==1?'s':''}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}