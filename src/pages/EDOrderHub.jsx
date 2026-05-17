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
.bundles-row{flex-shrink:0;padding:5px 13px;border-bottom:1px solid ${T.bd};background:${T.bgP};display:flex;gap:5px;overflow-x:auto;align-items:center;}
.bl-lbl{font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:${T.txt4};flex-shrink:0;white-space:nowrap;}
.bchip{display:flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:filter .15s;}
.bchip:hover{filter:brightness(1.15);}
.cat-tabs{flex-shrink:0;display:flex;gap:3px;padding:6px 13px;border-bottom:1px solid ${T.bd};background:${T.bgP};overflow-x:auto;}
.ctab{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;background:${T.bgU};border:1px solid ${T.bd};color:${T.txt3};flex-shrink:0;transition:all .15s;}
.ctab:hover{border-color:${T.bdH};color:${T.txt2};}
.ctab.active{background:rgba(59,158,255,.12);border-color:rgba(59,158,255,.4);color:${T.blue};font-weight:600;}
.cat-body{flex:1;overflow-y:auto;padding:12px 13px 60px;display:flex;flex-direction:column;gap:12px;}
.sec-ttl{font-size:10px;color:${T.txt3};text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:7px;display:flex;align-items:center;gap:6px;}
.sec-ttl::after{content:'';flex:1;height:1px;background:${T.bd};}
.orders-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:6px;}
.oc{background:${T.bgP};border:1px solid ${T.bd};border-radius:8px;padding:8px 10px;cursor:pointer;transition:all .15s;position:relative;user-select:none;}
.oc:hover{border-color:${T.bdH};background:${T.bgC};transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.3);}
.oc.inq{border-color:rgba(0,229,192,.35);background:rgba(0,229,192,.03);}
.oc.inq:hover{border-color:rgba(255,107,107,.4);background:rgba(255,107,107,.04);}
.oc-ck{position:absolute;top:6px;right:6px;width:14px;height:14px;border-radius:50%;background:${T.teal};color:${T.bg};font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.oc-nm{font-size:11px;font-weight:600;color:${T.txt};line-height:1.3;padding-right:16px;}
.oc-dt{font-size:9.5px;color:${T.txt3};margin-top:2px;line-height:1.35;}
.oc-ft{display:flex;align-items:center;gap:3px;margin-top:4px;flex-wrap:wrap;}
.prio{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 6px;border-radius:20px;}
.pS{background:rgba(255,107,107,.15);color:${T.coral};border:1px solid rgba(255,107,107,.3);}
.pU{background:rgba(255,159,67,.12);color:${T.orange};border:1px solid rgba(255,159,67,.3);}
.pR{background:rgba(0,229,192,.1);color:${T.teal};border:1px solid rgba(0,229,192,.25);}
.allg-chip{font-size:9px;color:${T.coral};background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.25);border-radius:4px;padding:1px 5px;margin-top:3px;}
.drug-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(282px,1fr));gap:7px;}
.mc{background:${T.bgP};border:1px solid ${T.bd};border-radius:10px;padding:11px 13px;transition:border-color .15s;}
.mc:hover{border-color:${T.bdH};}
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
.clr-btn{width:100%;text-align:center;font-size:11px;color:${T.txt4};background:none;border:none;cursor:pointer;padding:2px;transition:color .15s;}
.clr-btn:hover{color:${T.coral};}
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%) translateY(0);background:${T.bgC};border:1px solid ${T.bdH};border-radius:8px;padding:7px 14px;font-size:12px;color:${T.txt};z-index:9999;pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,.5);white-space:nowrap;transition:all .28s;}
.toast.hide{transform:translateX(-50%) translateY(30px);opacity:0;}
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
  {id:'c_cards',cat:'consults',sub:'Medical',icon:'🩺',name:'Cardiology Consult',detail:'NSTEMI mgmt, cath lab decision',meta:'URGENT',priority:'URGENT',alert:null,contrast:false},
  {id:'c_surg',cat:'consults',sub:'Medical',icon:'🩺',name:'General Surgery Consult',detail:'Acute abdomen, appendicitis eval',meta:'URGENT',priority:'URGENT',alert:null,contrast:false},
  {id:'c_neuro',cat:'consults',sub:'Medical',icon:'🩺',name:'Neurology Consult',detail:'Stroke eval, seizure management',meta:'STAT',priority:'STAT',alert:null,contrast:false},
  {id:'c_pharm',cat:'consults',sub:'Support',icon:'💊',name:'Pharmacy Consult',detail:'Drip adjustment, med reconcile',meta:'ROUTINE',priority:'ROUTINE',alert:null,contrast:false},
  {id:'c_sw',cat:'consults',sub:'Support',icon:'🤝',name:'Social Work Consult',detail:'Disposition, resources, safety',meta:'ROUTINE',priority:'ROUTINE',alert:null,contrast:false},
];

// ── Medication catalog ────────────────────────────────────────────────────────
const DRUGS=[
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
  {id:'adenosine',cat:'rhythm',icon:'⚡',name:'Adenosine',sub:'Adenocard — SVT',cor:'I',wtBased:false,scenarios:[{label:'SVT Termination',build:()=>buildBlock('Adenosine',[['DRUG','Adenosine (Adenocard)'],['DOSE','6 mg IV RAPID push — proximal IV'],['FLUSH','20 mL NS rapid flush IMMEDIATELY after'],['REPEAT','12 mg IV if no conversion in 1–2 min; then 12 mg × 1'],['INDICATION','Stable SVT — termination and diagnosis  [COR I-B  ACLS 2025]']],'Warn pt: asystole < 30 sec, chest pressure, dyspnea · Never use in pre-excited AFib or WPW')}]},
  {id:'diltia',cat:'rhythm',icon:'💊',name:'Diltiazem',sub:'Cardizem — AFib rate',cor:'I',wtBased:true,scenarios:[{label:'AFib Rate Control',build:(wt)=>{const b=fmt(wt*0.25);const b2=fmt(wt*0.35);return buildBlock('Diltiazem',[['DRUG','Diltiazem (Cardizem)'],['DOSE',`${b} mg IV over 2 min  [0.25 mg/kg × ${wt} kg, max 25 mg]`],['REPEAT',`${b2} mg in 15 min if inadequate  [0.35 mg/kg, max 35 mg]`],['THEN','5–15 mg/hr infusion — titrate to HR < 110 bpm'],['INDICATION','AFib / Aflutter rate control  [COR I-B]']],'CI: EF < 40%, accessory pathway, WPW · Monitor BP — significant vasodilation');}}]},
  {id:'amio_iv',cat:'rhythm',icon:'💉',name:'Amiodarone IV',sub:'Cordarone — VT/VF/AFib',cor:'IIa',wtBased:false,scenarios:[
    {label:'VT / Refractory VF',build:()=>buildBlock('Amiodarone',[['DRUG','Amiodarone (Cordarone)'],['DOSE','150 mg IV over 10 min (loading)'],['THEN','1 mg/min × 6 hr, then 0.5 mg/min × 18 hr'],['INDICATION','Stable VT / refractory VF/pVT  [COR IIa-B  ACLS 2025]']],'Dilute in D5W · Non-PVC tubing preferred · Monitor QT, BP')},
    {label:'AFib Cardioversion',build:()=>buildBlock('Amiodarone',[['DRUG','Amiodarone (Cordarone)'],['DOSE','150 mg IV over 10 min'],['THEN','1 mg/min × 6 hr, then 0.5 mg/min × 18 hr (total 1 g/24h)'],['INDICATION','AFib chemical cardioversion — hemodynamically stable  [COR IIb]']],'Less effective than ibutilide for acute AFib · QT monitoring required')},
  ]},
  {id:'procain',cat:'rhythm',icon:'💉',name:'Procainamide',sub:'Pronestyl — stable VT',cor:'IIa',wtBased:true,scenarios:[{label:'Stable Monomorphic VT',build:(wt)=>buildBlock('Procainamide',[['DRUG','Procainamide (Pronestyl)'],['DOSE','20–50 mg/min IV until VT suppressed, QRS widens > 50%, or hypotension'],['MAX',`${fmt(wt*17)} mg total  [17 mg/kg × ${wt} kg]`],['THEN','1–4 mg/min maintenance IV'],['INDICATION','Stable monomorphic VT  [COR IIa-B  ACLS 2025]']],'AVOID: prolonged QT, HF, severe LV dysfunction · Preferred over amiodarone for stable VT')}]},
  {id:'mag_iv',cat:'rhythm',icon:'⚡',name:'Magnesium Sulfate',sub:'MgSO₄ — TdP / hypoMg',cor:'IIb',wtBased:false,scenarios:[{label:'Torsades de Pointes',build:()=>buildBlock('Magnesium Sulfate',[['DRUG','Magnesium Sulfate (MgSO₄)'],['DOSE','2 g IV over 5–20 min  (arrest: 1–2 min)'],['THEN','0.5–1 g/hr infusion for recurrence'],['INDICATION','Torsades de Pointes — first-line  [COR IIb-C  ACLS 2025]']],'Correct hypokalemia simultaneously · Monitor DTRs for toxicity')}]},
  {id:'atropine',cat:'rhythm',icon:'⚡',name:'Atropine',sub:'Bradycardia — first-line',cor:'I',wtBased:false,scenarios:[{label:'Symptomatic Bradycardia',build:()=>buildBlock('Atropine',[['DRUG','Atropine Sulfate'],['DOSE','1 mg IV bolus'],['REPEAT','q3–5 min, max 3 mg total (0.04 mg/kg)'],['INDICATION','Symptomatic bradycardia — first-line  [COR I-B  ACLS 2025]']],'Ineffective for Mobitz II / CHB → proceed immediately to TCP or pacing')}]},
  {id:'norepi',cat:'pressors',icon:'💉',name:'Norepinephrine',sub:'Levophed — sepsis 1st-line',cor:'I',wtBased:true,scenarios:[{label:'Septic Shock',build:(wt)=>buildBlock('Norepinephrine',[['DRUG','Norepinephrine (Levophed)'],['MIX','4 mg in 250 mL D5W = 16 mcg/mL  |  8 mg in 250 mL = 32 mcg/mL'],['START',`${(wt*0.1).toFixed(1)} mcg/min  [0.1 mcg/kg/min × ${wt} kg]`],['TITRATE','Increase 0.05–0.1 mcg/kg/min q5–10 min prn'],['RANGE','0.01–3 mcg/kg/min  (typical 0.1–0.5)'],['INDICATION','Septic shock — first-line vasopressor  [COR I-B  SSC 2021]']],'Central line/arterial line ASAP · Target MAP ≥ 65 mmHg')}]},
  {id:'epi_anap',cat:'pressors',icon:'💉',name:'Epinephrine',sub:'Anaphylaxis / pressor drip',cor:'I',wtBased:true,scenarios:[
    {label:'Anaphylaxis — IM',build:()=>buildBlock('Epinephrine',[['DRUG','Epinephrine 1:1,000'],['DOSE','0.3 mg IM (0.3 mL of 1 mg/mL)'],['ROUTE','Anterolateral thigh — IM'],['REPEAT','q5–15 min prn if no improvement'],['INDICATION','Anaphylaxis — first-line  [COR I-A  WAO 2020]']],'Preferred over IV · Prepare IV drip if biphasic reaction')},
    {label:'Pressor Infusion',build:(wt)=>buildBlock('Epinephrine Infusion',[['DRUG','Epinephrine Infusion'],['MIX','1 mg in 250 mL NS = 4 mcg/mL'],['START','2 mcg/min IV — titrate 2–10 mcg/min'],['INDICATION','Refractory bradycardia or anaphylactic shock  [COR IIa-B]']])},
  ]},
  {id:'dopa',cat:'pressors',icon:'💉',name:'Dopamine',sub:'Cardiogenic shock',cor:'IIb',wtBased:true,scenarios:[{label:'Cardiogenic Shock',build:(wt)=>buildBlock('Dopamine',[['DRUG','Dopamine HCl'],['MIX','400 mg in 250 mL D5W = 1,600 mcg/mL'],['START',`${fmt(wt*5)} mcg/min  [5 mcg/kg/min × ${wt} kg]`],['TITRATE','5–20 mcg/kg/min to target MAP/HR'],['INDICATION','Cardiogenic/distributive shock  [COR IIb]']],'Norepinephrine preferred over dopamine in septic shock — less arrhythmia')}]},
  {id:'vanc',cat:'abx',icon:'🦠',name:'Vancomycin',sub:'MRSA / gram-positive',cor:null,wtBased:true,scenarios:[{label:'Sepsis / SSTI / CAP',build:(wt)=>buildBlock('Vancomycin',[['DRUG','Vancomycin HCl'],['DOSE',`${fmt(Math.min(Math.round(wt*25),3000))} mg IV  [25 mg/kg × ${wt} kg, max 3,000 mg]`],['RATE','Over 1–2 hr  (no faster than 10 mg/min)'],['FREQUENCY','Q8–12h — renal dosing per pharmacy'],['INDICATION','MRSA / gram-positive — sepsis, SSTI, CAP, HAP']],'AUC/MIC-guided dosing preferred · Trough before 4th dose · CrCl < 50 → reduce · Redman → slow infusion')}]},
  {id:'piptz',cat:'abx',icon:'🦠',name:'Pip-Tazo',sub:'Zosyn — broad spectrum',cor:null,wtBased:false,scenarios:[{label:'Broad Spectrum Sepsis',build:()=>buildBlock('Piperacillin-Tazobactam',[['DRUG','Pip-Tazobactam (Zosyn)'],['DOSE','4.5 g IV  (4 g pip + 0.5 g tazo)'],['RATE','Over 30 min  (extended: 4 hr for severe sepsis)'],['FREQUENCY','Q6–8h; Q6h for severe; adjust for CrCl < 40'],['INDICATION','Broad spectrum — sepsis, HAP, intra-abdominal, UTI']],'Do NOT mix with aminoglycosides · Extended 4-hr infusion improves PK/PD attainment')}]},
  {id:'cefep',cat:'abx',icon:'🦠',name:'Cefepime',sub:'Maxipime — gram-negative',cor:null,wtBased:false,scenarios:[{label:'HAP / Febrile Neutropenia',build:()=>buildBlock('Cefepime',[['DRUG','Cefepime (Maxipime)'],['DOSE','2 g IV over 30 min'],['FREQUENCY','Q8h severe; Q12h mild/moderate; adjust for CrCl < 60'],['INDICATION','HAP, febrile neutropenia, gram-negative bacteremia, Pseudomonas']],'Neurotoxicity risk with renal impairment — monitor closely')}]},
  {id:'ceftx',cat:'abx',icon:'🦠',name:'Ceftriaxone',sub:'Rocephin',cor:null,wtBased:false,scenarios:[{label:'CAP / UTI / Meningitis',build:()=>buildBlock('Ceftriaxone',[['DRUG','Ceftriaxone (Rocephin)'],['DOSE','1 g IV over 30 min  (2 g for meningitis / severe sepsis)'],['FREQUENCY','Q12h (meningitis) or Daily (CAP, UTI, skin)'],['INDICATION','CAP, UTI, pyelonephritis, meningitis, Lyme, gonorrhea']],'Avoid with Ca-containing fluids in same line · Safe in renal impairment')}]},
  {id:'azithro',cat:'abx',icon:'🦠',name:'Azithromycin',sub:'Zithromax — atypical CAP',cor:null,wtBased:false,scenarios:[{label:'CAP Atypical Coverage',build:()=>buildBlock('Azithromycin',[['DRUG','Azithromycin (Zithromax)'],['DOSE','500 mg IV over 60 min'],['FREQUENCY','Daily (switch PO when tolerating)'],['INDICATION','CAP atypical coverage — Legionella, Mycoplasma, Chlamydia']],'QTc prolongation — baseline ECG · Combine with beta-lactam for hospitalized CAP per IDSA/ATS')}]},
  {id:'etom',cat:'sedation',icon:'😴',name:'Etomidate',sub:'Amidate — RSI induction',cor:null,wtBased:true,scenarios:[{label:'RSI Induction',build:(wt)=>buildBlock('Etomidate',[['DRUG','Etomidate (Amidate)'],['DOSE',`${(wt*0.3).toFixed(1)} mg IV  [0.3 mg/kg × ${wt} kg]`],['ROUTE','IV push over 30–60 sec'],['ONSET','30–60 seconds'],['INDICATION','RSI induction — hemodynamically unstable patients']],'Single dose only · No analgesia — add fentanyl pre-treatment · Adrenal suppression: do NOT repeat')}]},
  {id:'ketamine',cat:'sedation',icon:'😴',name:'Ketamine',sub:'Ketalar — RSI / PSA',cor:null,wtBased:true,scenarios:[
    {label:'RSI Induction',build:(wt)=>buildBlock('Ketamine',[['DRUG','Ketamine (Ketalar)'],['DOSE',`${(wt*2).toFixed(0)} mg IV  [1.5–2 mg/kg × ${wt} kg]`],['ONSET','30–60 sec IV  |  IM: 3–5 min at 4–6 mg/kg'],['INDICATION','RSI induction — hemodynamically unstable, bronchospasm, trauma']],'Preserves airway reflexes + BP · Relative CI: severe hypertensive emergency')},
    {label:'Procedural Sedation',build:(wt)=>buildBlock('Ketamine',[['DRUG','Ketamine (Ketalar) — Dissociative'],['DOSE',`${(wt*1.5).toFixed(0)} mg IV  [1–1.5 mg/kg × ${wt} kg]  |  IM: ${(wt*4).toFixed(0)} mg`],['ROUTE','IV over 1–2 min'],['DURATION','10–20 min IV · 20–45 min IM'],['INDICATION','Procedural sedation — fracture reduction, I&D, painful procedures']],'Glycopyrrolate 0.2 mg IV reduces sialorrhea · Laryngospasm rare (<1%)')},
  ]},
  {id:'succs',cat:'sedation',icon:'😴',name:'Succinylcholine',sub:'Anectine — RSI paralytic',cor:null,wtBased:true,scenarios:[{label:'RSI Paralytic',build:(wt)=>buildBlock('Succinylcholine',[['DRUG','Succinylcholine (Anectine)'],['DOSE',`${(wt*1.5).toFixed(0)} mg IV  [1.5 mg/kg × ${wt} kg]`],['ONSET','45–60 seconds'],['DURATION','6–10 minutes'],['INDICATION','RSI — depolarizing paralytic']],'ABS CI: hyperkalemia, crush/burn > 24h, denervation, MH risk · Have sugammadex ready')}]},
  {id:'roc',cat:'sedation',icon:'😴',name:'Rocuronium',sub:'Zemuron — RSI paralytic',cor:null,wtBased:true,scenarios:[{label:'RSI Paralytic',build:(wt)=>{const d=(wt*1.2).toFixed(0);const s=(wt*16).toFixed(0);return buildBlock('Rocuronium',[['DRUG','Rocuronium (Zemuron)'],['DOSE',`${d} mg IV  [1.2 mg/kg × ${wt} kg]  high-dose RSI`],['ONSET','45–60 sec at high dose'],['DURATION','45–70 min'],['REVERSAL',`Sugammadex ${s} mg IV  [16 mg/kg] for IMMEDIATE reversal`],['INDICATION','RSI — preferred if succinylcholine CI']],'Keep sugammadex at bedside · Prolonged paralysis risk if failed airway');}}]},
  {id:'midaz',cat:'sedation',icon:'😴',name:'Midazolam',sub:'Versed — PSA / anxiolysis',cor:null,wtBased:true,scenarios:[{label:'Procedural Sedation',build:(wt)=>buildBlock('Midazolam',[['DRUG','Midazolam (Versed)'],['DOSE',`${(wt*0.05).toFixed(1)} mg IV  [0.05 mg/kg × ${wt} kg]  titrate to effect`],['REPEAT','0.025 mg/kg IV q2–3 min prn, max 0.2 mg/kg total'],['INDICATION','Procedural sedation, anxiolysis']],'REVERSAL: flumazenil 0.2 mg IV q1 min × 5 · Reduce 30% in elderly/hepatic impairment')}]},
  {id:'fent',cat:'pain',icon:'🩹',name:'Fentanyl',sub:'Sublimaze — IV/IN analgesia',cor:null,wtBased:true,scenarios:[{label:'IV Pain Management',build:(wt)=>buildBlock('Fentanyl',[['DRUG','Fentanyl Citrate (Sublimaze)'],['DOSE',`${(wt*1).toFixed(0)} mcg IV  [1 mcg/kg × ${wt} kg]`],['ROUTE','IV over 2–3 min  |  IN: 1.5 mcg/kg split nares'],['REPEAT','Titrate q5–10 min prn NRS ≥ 7'],['INDICATION','Moderate–severe acute pain — preferred in renal failure, hemodynamic instability']],'REVERSAL: naloxone 0.4 mg IV · 100× more potent than morphine')}]},
  {id:'morph',cat:'pain',icon:'🩹',name:'Morphine',sub:'IV analgesia',cor:null,wtBased:false,scenarios:[{label:'IV Pain Management',build:()=>buildBlock('Morphine Sulfate',[['DRUG','Morphine Sulfate'],['DOSE','2–4 mg IV — titrate to effect'],['ROUTE','IV over 2–5 min'],['REPEAT','q15–20 min prn NRS ≥ 7'],['INDICATION','Moderate–severe acute pain']],'REVERSAL: naloxone 0.4 mg IV · AVOID: hypotension, renal failure (active metabolite accumulates)')}]},
  {id:'ketor',cat:'pain',icon:'🩹',name:'Ketorolac',sub:'Toradol — non-opioid NSAID',cor:null,wtBased:false,scenarios:[{label:'IV Non-Opioid Analgesia',build:()=>buildBlock('Ketorolac',[['DRUG','Ketorolac (Toradol)'],['DOSE','15–30 mg IV  (30 mg IM)  — ↓ to 15 mg if > 65y or < 50 kg'],['ROUTE','IV over 2 min  OR  IM'],['FREQUENCY','Q6h prn, max 5 days total (IV + PO combined)'],['INDICATION','Moderate–severe pain — renal colic, MSK, headache']],'AVOID: CrCl < 30, active GI bleed, aspirin-sensitive asthma, concurrent anticoagulation')}]},
  {id:'apap',cat:'pain',icon:'🩹',name:'Acetaminophen',sub:'Ofirmev IV — safe in renal failure',cor:null,wtBased:true,scenarios:[{label:'IV Analgesia / Antipyretic',build:(wt)=>buildBlock('Acetaminophen',[['DRUG','Acetaminophen (Ofirmev IV)'],['DOSE',`${wt<50?'650 mg':'1,000 mg'} IV  [${wt} kg — max 4 g/24h]`],['RATE','Over 15 min'],['FREQUENCY','Q6h scheduled OR Q4–6h prn'],['INDICATION','Pain adjunct, antipyretic — safe in renal failure']],'Max 2 g/24h hepatic impairment / chronic ETOH · Multimodal analgesia reduces opioid needs')}]},
  {id:'zofran',cat:'support',icon:'⚕️',name:'Ondansetron',sub:'Zofran — antiemetic',cor:null,wtBased:false,scenarios:[{label:'Nausea / Vomiting',build:()=>buildBlock('Ondansetron',[['DRUG','Ondansetron (Zofran)'],['DOSE','4 mg IV over 2–5 min  (8 mg for PONV / chemo-related)'],['FREQUENCY','Q4–6h prn nausea'],['INDICATION','Acute nausea and vomiting']],'QTc prolongation — avoid if QTc > 480 ms · Serotonin syndrome risk with serotonergic co-meds')}]},
  {id:'lzp',cat:'support',icon:'⚕️',name:'Lorazepam',sub:'Ativan — seizure / status',cor:null,wtBased:true,scenarios:[{label:'Status Epilepticus',build:(wt)=>buildBlock('Lorazepam',[['DRUG','Lorazepam (Ativan)'],['DOSE',`${(Math.min(wt*0.1,4)).toFixed(1)} mg IV  [0.1 mg/kg × ${wt} kg, max 4 mg]`],['ROUTE','IV over 2 min  (IM if no IV)'],['REPEAT','Repeat × 1 in 5–10 min if still seizing'],['INDICATION','Status epilepticus — first-line BZD  [AES 2023]']],'No IV: midazolam IM 10 mg (> 40 kg) · Have airway management ready')}]},
  {id:'labet',cat:'support',icon:'⚕️',name:'Labetalol',sub:'IV — hypertensive emergency',cor:null,wtBased:false,scenarios:[{label:'Hypertensive Emergency',build:()=>buildBlock('Labetalol',[['DRUG','Labetalol HCl'],['DOSE','20 mg IV over 2 min'],['REPEAT','Double q10 min prn: 40 → 80 mg; max single 80 mg; cumulative max 300 mg'],['THEN','0.5–2 mg/min infusion if needed'],['INDICATION','Hypertensive emergency — dissection, SAH, eclampsia  [AHA/ACC 2024]']],'CI: asthma/COPD, severe bradycardia, acute decompensated HF · Dual HR + BP control')}]},
  {id:'cacl',cat:'support',icon:'⚕️',name:'Calcium Chloride',sub:'10% CaCl₂ — hyperkalemia',cor:null,wtBased:false,scenarios:[{label:'Hyperkalemia / CCB OD / Arrest',build:()=>buildBlock('Calcium Chloride 10%',[['DRUG','Calcium Chloride 10%  (1 g = 13.6 mEq Ca²⁺)'],['DOSE','1 g (10 mL of 10%) IV slow push'],['RATE','Over 5–10 min  (arrest: 1–2 min)'],['REPEAT','q5–10 min prn (hyperkalemia / CCB OD)'],['INDICATION','Hyperkalemia, CCB toxicity, ionized hypocalcemia, cardiac arrest']],'3× more elemental Ca than gluconate · Central line preferred — vesicant')}]},
  {id:'bicarb',cat:'support',icon:'⚕️',name:'Sodium Bicarbonate',sub:'NaHCO₃ — TCA / acidosis',cor:null,wtBased:true,scenarios:[{label:'TCA OD / Severe Acidosis',build:(wt)=>buildBlock('Sodium Bicarbonate',[['DRUG','Sodium Bicarbonate (NaHCO₃)  8.4% = 1 mEq/mL'],['DOSE',`${fmt(wt)} mEq IV bolus  [1 mEq/kg × ${wt} kg]`],['ROUTE','IV push'],['INDICATION','TCA overdose, severe metabolic acidosis, hyperkalemia, Na-channel blockade']],'TCA OD: push until QRS < 100 ms, target pH 7.45–7.55 · Do NOT mix with calcium in same line')}]},
  {id:'d50',cat:'support',icon:'⚕️',name:'Dextrose 50%',sub:'D50W — hypoglycemia',cor:null,wtBased:false,scenarios:[{label:'Symptomatic Hypoglycemia',build:()=>buildBlock('Dextrose 50% (D50W)',[['DRUG','Dextrose 50% (D50W)'],['DOSE','25 g IV  (50 mL of D50W)'],['ROUTE','Large patent IV — sclerosing, irritating to veins'],['REPEAT','Recheck BG in 15 min; repeat if < 70 mg/dL'],['INDICATION','Symptomatic hypoglycemia — AMS, seizure, BG < 60 mg/dL']],'Give thiamine 100 mg IV BEFORE dextrose if malnourished / chronic ETOH · D10 250 mL/hr gentler alternative')}]},
  {id:'nalox',cat:'support',icon:'⚕️',name:'Naloxone',sub:'Narcan — opioid reversal',cor:null,wtBased:false,scenarios:[{label:'Opioid Reversal',build:()=>buildBlock('Naloxone',[['DRUG','Naloxone (Narcan)'],['DOSE','0.4–2 mg IV/IM/IN — titrate to RESPIRATORY DRIVE, not full reversal'],['ROUTE','IV preferred · IN: 4 mg per nare (2 mg/0.1 mL)'],['REPEAT','q2–3 min prn; infusion: 2/3 of effective reversal dose per hour'],['INDICATION','Opioid respiratory depression  (RR < 12, SpO₂ < 92%, unresponsive)']],'Avoid full reversal in opioid-dependent — withdrawal, seizure, pulm edema · Duration 30–90 min — WATCH FOR RENARCOTIZATION')}]},
];

// ── Bundles ───────────────────────────────────────────────────────────────────
const BUNDLES=[
  {label:'STEMI',icon:'🫀',color:T.coral,ids:[['asa','ACS Load'],['tica','ACS Load'],['heparin','STEMI / PCI'],['statin','ACS High-Intensity'],['metro_iv','IV Rate Control / ACS']]},
  {label:'NSTEMI',icon:'🫀',color:T.orange,ids:[['asa','ACS Load'],['tica','ACS Load'],['enox','NSTEMI Treatment'],['statin','ACS High-Intensity']]},
  {label:'Sepsis',icon:'💉',color:T.teal,ids:[['norepi','Septic Shock'],['vanc','Sepsis / SSTI / CAP'],['piptz','Broad Spectrum Sepsis'],['apap','IV Analgesia / Antipyretic']]},
  {label:'RSI',icon:'😴',color:T.purple,ids:[['fent','IV Pain Management'],['ketamine','RSI Induction'],['succs','RSI Paralytic']]},
  {label:'AFib RVR',icon:'⚡',color:T.gold,ids:[['diltia','AFib Rate Control'],['metro_iv','IV Rate Control / ACS']]},
  {label:'Anaphylaxis',icon:'⚠️',color:T.coral,ids:[['epi_anap','Anaphylaxis — IM'],['zofran','Nausea / Vomiting'],['cacl','Hyperkalemia / CCB OD / Arrest']]},
  {label:'TdP',icon:'🔄',color:T.gold,ids:[['mag_iv','Torsades de Pointes'],['atropine','Symptomatic Bradycardia']]},
  {label:'Hypo-BG',icon:'🍬',color:T.blue,ids:[['d50','Symptomatic Hypoglycemia'],['nalox','Opioid Reversal']]},
];

// ── Category meta ─────────────────────────────────────────────────────────────
const CAT_META={cardiac:{label:'Cardiac',color:T.coral},rhythm:{label:'Arrhythmia',color:T.gold},pressors:{label:'Vasopressors',color:T.orange},abx:{label:'Antibiotics',color:T.teal},sedation:{label:'RSI / Sedation',color:T.purple},pain:{label:'Analgesia',color:T.blue},support:{label:'Supportive',color:T.green}};
const CAT_TABS=[{id:'all',label:'All'},{id:'labs',label:'🧪 Labs'},{id:'imaging',label:'🩻 Imaging'},{id:'meds',label:'💊 Meds'},{id:'procedures',label:'⚡ Procedures'},{id:'consults',label:'🩺 Consults'}];
const pc=p=>p==='STAT'?'pS':p==='URGENT'?'pU':'pR';

// ── Main Component ────────────────────────────────────────────────────────────
export default function EDOrderHub({embedded=false,patientName='',patientAllergies=[],chiefComplaint='',patientAge='',patientSex=''}){
  const[queue,setQueue]=useState([]);
  const[activeCat,setActiveCat]=useState('all');
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
  const toastRef=useRef(null);

  const showToast=useCallback(msg=>{
    setToast(msg);
    if(toastRef.current)clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(''),3200);
  },[]);

  const W=parseFloat(wt)||70;
  const findSimple=id=>SIMPLE.find(o=>o.id===id);
  const findDrug=id=>DRUGS.find(d=>d.id===id);

  const addToQueue=useCallback((item,cpoeText=null)=>{
    const aw=getAllergyWarn(item);
    setQueue(p=>{
      if(p.some(q=>q.id===item.id))return p;
      const ni={id:item.id,name:item.name,cat:item.cat||'meds',icon:item.icon||'💊',priority:item.priority||'URGENT',detail:item.detail||item.sub||'',cpoeText,allergyWarn:aw,open:false};
      if(aw)setTimeout(()=>showToast(`⚠ ALLERGY: ${aw.name} (${aw.reaction}) — review before signing`),0);
      return[...p,ni];
    });
  },[showToast]);

  const removeFromQueue=useCallback(id=>setQueue(p=>p.filter(q=>q.id!==id)),[]);

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

  const applyBundle=useCallback(bundle=>{
    const newItems=[];
    bundle.ids.forEach(([drugId,scLabel])=>{
      const d=findDrug(drugId);if(!d)return;
      const sc=d.scenarios.find(s=>s.label===scLabel)||d.scenarios[0];
      newItems.push({id:d.id,name:d.name,cat:'meds',icon:d.icon,priority:'URGENT',detail:`${d.sub} · ${sc.label}`,cpoeText:sc.build(W),allergyWarn:null,open:false});
    });
    setQueue(p=>{const toAdd=newItems.filter(ni=>!p.some(q=>q.id===ni.id));return toAdd.length?[...p,...toAdd]:p;});
    showToast(`📦 ${bundle.label} bundle added`);
  },[W,showToast]);

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
          </div>
          <div className="bundles-row">
            <span className="bl-lbl">Bundles:</span>
            {BUNDLES.map(b=>(
              <button key={b.label} className="bchip" onClick={()=>applyBundle(b)} style={{border:`1px solid ${b.color}44`,background:`${b.color}14`,color:b.color}}>
                <span>{b.icon}</span>{b.label}
              </button>
            ))}
          </div>
          <div className="cat-tabs">
            {CAT_TABS.map(c=><button key={c.id} className={`ctab ${activeCat===c.id?'active':''}`} onClick={()=>setActiveCat(c.id)}>{c.label}</button>)}
          </div>
          <div className="cat-body">
            {(activeCat==='all'||activeCat==='meds')&&!wt&&(
              <div className="wt-warn">⚠ Enter patient weight above for accurate weight-based dosing calculations</div>
            )}
            {Object.entries(simpleGroups).map(([sub,orders])=>(
              <div key={sub}>
                <div className="sec-ttl">{sub}</div>
                <div className="orders-grid">
                  {orders.map(order=>{
                    const inQ=isInQ(order.id);
                    const aw=getAllergyWarn(order);
                    return(
                      <div key={order.id} className={`oc ${inQ?'inq':''}`} onClick={()=>inQ?removeFromQueue(order.id):addToQueue(order)}>
                        {inQ&&<div className="oc-ck">✓</div>}
                        <div style={{display:'flex',gap:5,alignItems:'flex-start',marginBottom:2}}>
                          <span style={{fontSize:11,flexShrink:0}}>{order.icon}</span>
                          <span className="oc-nm">{order.name}</span>
                        </div>
                        <div className="oc-dt">{order.detail}</div>
                        {aw&&<div className="allg-chip">⚠ {aw.name}</div>}
                        <div className="oc-ft">
                          <span className={`prio ${pc(order.priority)}`}>{order.priority}</span>
                          <span style={{fontSize:9,color:T.txt4}}>{order.meta}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
                    return(
                      <div key={drug.id} className="mc">
                        <div className="mc-top">
                          <span style={{fontSize:18,flexShrink:0}}>{drug.icon}</span>
                          <div className="mc-info">
                            <div className="mc-name">{drug.name}</div>
                            <div className="mc-sub">{drug.sub}</div>
                            <div className="mc-bdg">
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
          <div className="q-foot">
            {hasAllergyInQueue&&<div className="allg-warn">⚠ Allergy conflict in queue — review before signing</div>}
            <button className="sign-btn" disabled={queue.length===0} onClick={()=>{if(queue.length){showToast(`✓ ${queue.length} order${queue.length>1?'s':''} signed`);setQueue([]);}}}>
              ✍ Sign {queue.length>0?`${queue.length} Order${queue.length>1?'s':''}`:' Orders'}
            </button>
            {queue.length>0&&<button className="clr-btn" onClick={()=>setQueue([])}>Clear all orders</button>}
          </div>
        </aside>

      </div>
      <div className={`toast ${!toast?'hide':''}`}>{toast}</div>
    </div>
  );
}