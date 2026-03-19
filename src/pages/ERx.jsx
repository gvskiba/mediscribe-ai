import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClinicalTabBar from "@/components/shared/ClinicalTabBar";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PDMPAlertPanel from '@/components/erx/PDMPAlertPanel';

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
.erx-root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;position:fixed;top:65px;left:72px;right:0;bottom:0;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;display:flex;flex-direction:column;overflow:hidden;z-index:10;}
.erx-root *{box-sizing:border-box;}
/* sub navbar */
.erx-subnav{background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;height:42px;flex-shrink:0;}
.erx-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-.5px;}
.erx-sep{color:var(--txt4);font-size:14px;}
.erx-title{font-size:13px;color:var(--txt2);font-weight:500;}
.erx-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace;}
.erx-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px;}
.erx-btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer;transition:all .15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
.erx-btn-ghost:hover{border-color:var(--border-hi);color:var(--txt);}
.erx-btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:filter .15s;}
.erx-btn-primary:hover{filter:brightness(1.15);}
.erx-btn-gold{background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.35);color:var(--gold);border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;}
.erx-btn-gold:hover{background:rgba(245,200,66,.22);}
.erx-btn-coral{background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.3);color:var(--coral);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;}
/* patient bar */
.erx-vbar{background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:10px;height:42px;flex-shrink:0;overflow:hidden;}
.erx-vb-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);white-space:nowrap;}
.erx-vb-meta{font-size:11px;color:var(--txt3);}
.erx-vb-div{width:1px;height:22px;background:var(--border);flex-shrink:0;}
.erx-vb-chip{display:flex;align-items:center;gap:4px;font-size:11px;}
.erx-vb-lbl{color:var(--txt4);font-size:9px;text-transform:uppercase;letter-spacing:.04em;}
.erx-vb-val{font-family:'JetBrains Mono',monospace;color:var(--txt2);font-weight:600;}
.erx-allergy-btn{display:flex;align-items:center;gap:5px;background:rgba(255,107,107,.12);border:1px solid rgba(255,107,107,.3);border-radius:var(--r);padding:3px 10px;font-size:11px;font-weight:600;color:var(--coral);cursor:pointer;}
/* main layout */
.erx-main{flex:1;display:flex;overflow:hidden;min-height:0;}
/* sidebar */
.erx-sb{width:240px;flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);overflow-y:auto;display:flex;flex-direction:column;}
.erx-sb-sec{padding:11px 12px;border-bottom:1px solid var(--border);}
.erx-sb-sec-title{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;display:flex;align-items:center;gap:5px;}
.erx-sb-cnt{font-family:'JetBrains Mono',monospace;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 6px;font-size:9px;color:var(--txt4);}
.erx-allergy-pill{display:flex;align-items:center;gap:6px;background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.25);border-radius:var(--r);padding:5px 9px;margin-bottom:5px;cursor:pointer;transition:background .15s;}
.erx-allergy-pill:hover{background:rgba(255,107,107,.18);}
.erx-allergy-name{font-size:12px;font-weight:600;color:var(--coral);flex:1;}
.erx-allergy-rx{font-size:10px;color:var(--txt3);}
.erx-sev{font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;}
.erx-sev-high{background:rgba(255,107,107,.25);color:var(--coral);}
.erx-sev-mod{background:rgba(245,200,66,.18);color:var(--gold);}
.erx-med-pill{display:flex;align-items:center;gap:6px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:6px 9px;margin-bottom:4px;}
.erx-med-name{font-size:12px;font-weight:500;color:var(--txt);flex:1;}
.erx-med-dose{font-size:10px;color:var(--txt3);font-family:'JetBrains Mono',monospace;}
.erx-rxq-item{display:flex;align-items:center;gap:6px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:7px 9px;margin-bottom:4px;}
.erx-rxq-item.pending{border-left:3px solid var(--gold);}
.erx-rxq-item.signed{border-left:3px solid var(--teal);}
.erx-rxq-drug{font-size:12px;font-weight:600;color:var(--txt);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.erx-rxq-detail{font-size:10px;color:var(--txt3);}
.erx-rxq-status{font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;}
.erx-qs-pending{background:rgba(245,200,66,.15);color:var(--gold);}
.erx-qs-signed{background:rgba(0,229,192,.12);color:var(--teal);}
/* content */
.erx-content{flex:1;overflow-y:auto;padding:16px 18px 40px;display:flex;flex-direction:column;gap:14px;}
.erx-sec{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:15px 17px;}
.erx-sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.erx-sec-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--txt);}
.erx-sec-sub{font-size:11px;color:var(--txt3);margin-top:1px;}
/* drug search */
.erx-search-wrap{position:relative;}
.erx-search-inp{width:100%;background:var(--bg-card);border:2px solid var(--border-hi);border-radius:var(--rl);padding:11px 40px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all .2s;}
.erx-search-inp:focus{border-color:var(--blue);box-shadow:0 0 0 4px rgba(59,158,255,.1);}
.erx-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:17px;pointer-events:none;}
.erx-search-clear{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--txt4);cursor:pointer;font-size:16px;}
.erx-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--bg-card);border:1px solid var(--border-hi);border-radius:var(--rl);box-shadow:0 16px 48px rgba(0,0,0,.6);z-index:500;max-height:300px;overflow-y:auto;}
.erx-drug-row{display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;transition:background .12s;border-bottom:1px solid var(--border);}
.erx-drug-row:last-child{border-bottom:none;}
.erx-drug-row:hover{background:var(--bg-up);}
.erx-drug-ico{font-size:19px;width:26px;text-align:center;}
.erx-drug-name{font-size:13px;font-weight:600;color:var(--txt);}
.erx-drug-gen{font-size:11px;color:var(--txt3);}
.erx-sched-badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;}
.sch-2{background:rgba(255,107,107,.2);color:var(--coral);}
.sch-3,.sch-4{background:rgba(245,200,66,.15);color:var(--gold);}
/* favorites */
.erx-fav-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.erx-fav-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:10px 11px;cursor:pointer;transition:all .15s;}
.erx-fav-card:hover{border-color:var(--border-hi);background:var(--bg-up);}
.erx-fav-drug{font-size:12px;font-weight:600;color:var(--txt);}
.erx-fav-sig{font-size:10px;color:var(--txt3);font-family:'JetBrains Mono',monospace;}
.erx-fav-diag{font-size:10px;color:var(--txt4);}
/* rx card */
.erx-rx-card{background:linear-gradient(135deg,rgba(59,158,255,.05),rgba(0,229,192,.04));border:1px solid rgba(59,158,255,.22);border-radius:var(--rl);padding:17px 19px;}
.erx-rx-drug-hdr{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:11px 14px;margin-bottom:13px;display:flex;align-items:center;gap:12px;}
.erx-rx-drug-name{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--txt);}
.erx-rx-drug-gen{font-size:12px;color:var(--txt3);margin-top:2px;}
/* fields */
.erx-field{display:flex;flex-direction:column;gap:4px;}
.erx-lbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;}
.erx-req{color:var(--coral);}
.erx-inp{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%;}
.erx-inp:focus{border-color:var(--blue);}
.erx-inp.mono{font-family:'JetBrains Mono',monospace;font-size:12px;}
.erx-select{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-size:13px;outline:none;cursor:pointer;width:100%;}
.erx-select:focus{border-color:var(--blue);}
.erx-textarea{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-size:13px;outline:none;resize:vertical;min-height:58px;width:100%;line-height:1.5;}
.erx-textarea:focus{border-color:var(--blue);}
.erx-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
.erx-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px;}
.erx-grid-4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:11px;}
.erx-mb-10{margin-bottom:10px;}
.erx-mb-12{margin-bottom:12px;}
/* sig preview */
.erx-sig-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:11px 13px;}
.erx-sig-preview{background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.2);border-radius:var(--r);padding:9px 13px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--teal);min-height:36px;margin-top:9px;word-break:break-word;}
.erx-sig-empty{color:var(--txt4);font-style:italic;font-size:11px;}
/* alerts */
.erx-allergy-conflict{background:rgba(255,107,107,.1);border:2px solid rgba(255,107,107,.5);border-radius:var(--r);padding:11px 13px;margin-bottom:11px;display:flex;align-items:flex-start;gap:10px;}
.erx-cs-alert{background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.28);border-radius:var(--r);padding:11px 13px;display:flex;align-items:flex-start;gap:10px;margin-bottom:11px;}
.erx-cs-title{font-size:12px;font-weight:700;color:var(--coral);margin-bottom:3px;}
.erx-cs-body{font-size:11px;color:var(--txt2);line-height:1.5;}
/* pharmacy */
.erx-pharm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.erx-pharm-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:9px 12px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:9px;}
.erx-pharm-card:hover{border-color:var(--border-hi);}
.erx-pharm-card.sel{border-color:var(--teal);background:rgba(0,229,192,.05);}
.erx-pharm-dot{width:9px;height:9px;border-radius:50%;border:2px solid var(--border);flex-shrink:0;}
.erx-pharm-card.sel .erx-pharm-dot{background:var(--teal);border-color:var(--teal);}
.erx-pharm-name{font-size:12px;font-weight:600;color:var(--txt);}
.erx-pharm-addr{font-size:10px;color:var(--txt3);}
.erx-chain-pill{font-size:10px;padding:1px 6px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-weight:600;margin-left:auto;}
.chain-cvs{background:rgba(255,107,107,.15);color:var(--coral);}
.chain-wag{background:rgba(59,158,255,.15);color:var(--blue);}
.chain-hosp{background:rgba(155,109,255,.15);color:var(--purple);}
.chain-wm{background:rgba(0,229,192,.12);color:var(--teal);}
/* interactions */
.erx-int-row{display:flex;align-items:flex-start;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:9px 12px;margin-bottom:6px;}
.erx-int-row.severe{border-color:rgba(255,107,107,.4);background:rgba(255,107,107,.06);}
.erx-int-row.moderate{border-color:rgba(245,200,66,.3);background:rgba(245,200,66,.04);}
.erx-int-row.mild{border-color:rgba(59,158,255,.2);}
.erx-int-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:3px;}
.erx-int-drugs{font-size:12px;font-weight:600;color:var(--txt);}
.erx-int-desc{font-size:11px;color:var(--txt3);margin-top:2px;line-height:1.4;}
.erx-int-label{font-size:10px;font-weight:600;padding:1px 6px;border-radius:3px;margin-top:4px;display:inline-block;}
.ia-avoid{background:rgba(255,107,107,.2);color:var(--coral);}
.ia-monitor{background:rgba(245,200,66,.15);color:var(--gold);}
.ia-info{background:rgba(59,158,255,.12);color:var(--blue);}
/* rx history */
.erx-hist-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-card);margin-bottom:5px;}
.erx-hist-drug{font-size:12px;font-weight:600;color:var(--txt);flex:1;}
.erx-hist-detail{font-size:11px;color:var(--txt3);font-family:'JetBrains Mono',monospace;}
.erx-hist-date{font-size:10px;color:var(--txt4);white-space:nowrap;}
.erx-hist-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;}
.hb-sent{background:rgba(0,229,192,.12);color:var(--teal);}
.hb-printed{background:rgba(59,158,255,.12);color:var(--blue);}
/* send method */
.erx-send-btns{display:flex;gap:6px;flex-wrap:wrap;}
.erx-send-btn{display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);font-size:12px;cursor:pointer;transition:all .15s;}
.erx-send-btn:hover{border-color:var(--border-hi);color:var(--txt);}
.erx-send-btn.active-etx{border-color:rgba(0,229,192,.3);background:rgba(0,229,192,.07);color:var(--teal);}
/* toggle */
.erx-toggle-wrap{display:flex;align-items:center;gap:8px;}
.erx-toggle{position:relative;width:34px;height:18px;flex-shrink:0;}
.erx-toggle input{opacity:0;width:0;height:0;position:absolute;}
.erx-tog-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;transition:.2s;}
.erx-tog-slider:before{position:absolute;content:'';height:12px;width:12px;left:2px;bottom:2px;background:var(--txt4);border-radius:50%;transition:.2s;}
.erx-toggle input:checked + .erx-tog-slider{background:rgba(0,229,192,.2);border-color:var(--teal);}
.erx-toggle input:checked + .erx-tog-slider:before{transform:translateX(16px);background:var(--teal);}
/* divider */
.erx-div{height:1px;background:var(--border);margin:11px 0;}
/* badge */
.erx-status-badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;}
.erx-sb-draft{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3);}
.erx-sb-sent{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3);}
/* ai panel */
.erx-ai-panel{width:285px;flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.erx-ai-hdr{padding:11px 13px;border-bottom:1px solid var(--border);flex-shrink:0;}
.erx-ai-hrow{display:flex;align-items:center;gap:7px;margin-bottom:7px;}
.erx-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:erx-pulse 2s infinite;}
@keyframes erx-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.erx-ai-lbl{font-size:12px;font-weight:600;color:var(--txt2);}
.erx-ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3);}
.erx-ai-qbtns{display:flex;flex-wrap:wrap;gap:3px;}
.erx-ai-qbtn{padding:3px 8px;border-radius:20px;font-size:10px;cursor:pointer;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);transition:all .15s;}
.erx-ai-qbtn:hover{border-color:var(--teal);color:var(--teal);}
.erx-ai-msgs{flex:1;overflow-y:auto;padding:10px 11px;display:flex;flex-direction:column;gap:7px;}
.erx-ai-msg{padding:8px 10px;border-radius:var(--r);font-size:12px;line-height:1.55;}
.erx-ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border);}
.erx-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2);}
.erx-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt);}
.erx-ai-msg.warn{background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.25);color:var(--txt);}
.erx-ai-loader{display:flex;gap:4px;padding:9px 11px;align-items:center;}
.erx-ai-tdot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:erx-bounce 1.2s infinite;}
.erx-ai-tdot:nth-child(2){animation-delay:.2s}.erx-ai-tdot:nth-child(3){animation-delay:.4s}
@keyframes erx-bounce{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
.erx-ai-inp-wrap{padding:9px 11px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:5px;}
.erx-ai-inp{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 9px;color:var(--txt);font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif;}
.erx-ai-inp:focus{border-color:var(--teal);}
.erx-ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;font-weight:700;}
`;

/* ─── Helper: map DB record to ERx drug shape ────────────────────────── */
function dbToErxDrug(rec) {
  return {
    id: rec.id,
    name: rec.name,
    generic: rec.brand ? `${rec.brand} (${rec.name})` : rec.name,
    class: rec.drugClass,
    emoji: rec.emoji || '💊',
    strengths: rec.strengths || [],
    forms: rec.forms || ['Tablet'],
    route: rec.route || 'PO',
    schedule: rec.schedule || null,
    allergy: rec.allergy || null,
    interactions: rec.interactions || [],
    warnings: rec.warnings || [],
    contraindications: rec.contraindications || [],
    renal: rec.renal || [],
    indications: rec.indications || '',
    mechanism: rec.mechanism || '',
    monitoring: rec.monitoring || '',
    halfLife: rec.halfLife || '',
    pregnancy: rec.pregnancy || '',
  };
}

const PHARMACIES = [
  {name:'CVS Pharmacy #3847',addr:'1420 Oak Ave · 0.4 mi · Open 24hr',chain:'CVS',chainClass:'chain-cvs'},
  {name:'Walgreens #0291',addr:'832 Main St · 0.9 mi · Open until 10pm',chain:'WAG',chainClass:'chain-wag'},
  {name:'Regional Medical Center',addr:'On-site pharmacy · Open 24hr',chain:'HOSP',chainClass:'chain-hosp'},
  {name:'Walmart Pharmacy #4421',addr:'2200 Commerce Blvd · 1.8 mi · Open until 9pm',chain:'WM',chainClass:'chain-wm'},
];

function getInteractions(drug) {
  // Use interactions from DB if available
  const dbInts = drug.interactions || [];
  if (dbInts.length > 0) {
    return dbInts.map(intStr => {
      const sev = /avoid|black box|contraindicated|severe/i.test(intStr) ? 'severe'
                : /monitor|caution|moderate/i.test(intStr) ? 'moderate' : 'mild';
      const action = sev === 'severe' ? 'avoid' : sev === 'moderate' ? 'monitor' : 'info';
      const label = sev === 'severe' ? 'AVOID' : sev === 'moderate' ? 'MONITOR' : 'INFO';
      return { sev, drugs: `${drug.name} — Interaction`, desc: intStr, label, action };
    });
  }
  return [{ sev: 'mild', drugs: `${drug.name} + Current Medications`, desc: 'No major interactions identified with the current medication list.', label: 'NO SIGNIFICANT INTERACTIONS', action: 'info' }];
}

export default function ERx() {
  const navigate = useNavigate();

  // Load patient data from NewPatientInput via localStorage
  const [patientData, setPatientData] = useState(() => {
    const stored = localStorage.getItem('npiPatientData');
    return stored ? JSON.parse(stored) : { firstName: '', lastName: '', age: '', dob: '', sex: '', mrn: '', weight: '', crCl: '', insurance: '', insuranceId: '', medications: [], allergies: [] };
  });

  // Load drugs from Medication entity
  const { data: rawMeds = [], isLoading: drugsLoading, refetch: refetchMeds } = useQuery({
    queryKey: ['medications-erx'],
    queryFn: async () => {
      const meds = await base44.entities.Medication.list();
      return meds || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const DRUGS = useMemo(() => {
    const drugs = rawMeds.map(r => dbToErxDrug(r.data ? r.data : r));
    return drugs;
  }, [rawMeds]);

  const patientName = [patientData.firstName, patientData.lastName].filter(Boolean).join(', ') || 'Patient';
  const PATIENT_ALLERGIES = patientData.allergies || [];
  const PATIENT_MEDS = patientData.medications || [];

  const [query, setQuery] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [rxQueue, setRxQueue] = useState([]);
  const [selectedPharm, setSelectedPharm] = useState('CVS Pharmacy #3847');
  const [sendMethod, setSendMethod] = useState('e-prescribe');
  const [statusBadge, setStatusBadge] = useState('draft');
  const [interactions, setInteractions] = useState([]);
  const [loadingInt, setLoadingInt] = useState(false);
  const [aiMessages, setAiMessages] = useState([{role:'sys',text:'Notrya AI Rx Advisor ready. Select a drug or use a quick action.'}]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [convHistory, setConvHistory] = useState([]);
  // rx fields
  const [rxStrength, setRxStrength] = useState('');
  const [rxForm, setRxForm] = useState('Tablet');
  const [rxRoute, setRxRoute] = useState('PO');
  const [sigDose, setSigDose] = useState('');
  const [sigFreq, setSigFreq] = useState('once daily');
  const [sigDur, setSigDur] = useState('');
  const [sigQual, setSigQual] = useState('');
  const [sigExtra, setSigExtra] = useState('');
  const [rxQty, setRxQty] = useState('');
  const [rxQtyUnit, setRxQtyUnit] = useState('tablets');
  const [rxDays, setRxDays] = useState('');
  const [rxRefills, setRxRefills] = useState('0');
  const [rxDx, setRxDx] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [togGeneric, setTogGeneric] = useState(true);
  const [togCounsel, setTogCounsel] = useState(false);
  const [showCS, setShowCS] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [showPDMP, setShowPDMP] = useState(false);
  const [pharmSearchType, setPharmSearchType] = useState(''); // 'city', 'state', 'zip', 'near'
  const [pharmSearchValue, setPharmSearchValue] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [formularyStatus, setFormularyStatus] = useState(null);
  const [loadingFormulary, setLoadingFormulary] = useState(false);

  const aiMsgsRef = useRef(null);
  const aiInputRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'erx-styles';
    el.textContent = CSS;
    if (!document.getElementById('erx-styles')) document.head.appendChild(el);
    return () => document.getElementById('erx-styles')?.remove();
  }, []);

  const handleNearMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude});
          setPharmSearchType('near');
          setPharmSearchValue('');
          appendMsg('sys', '📍 Location detected. Showing nearby pharmacies.');
        },
        () => appendMsg('sys', '⚠ Unable to access location. Please enable location services.')
      );
    } else {
      appendMsg('sys', '⚠ Geolocation not supported by your browser.');
    }
  };

  const checkFormulary = async () => {
    if (!selectedDrug || !patientData.insurance) {
      appendMsg('sys', '⚠ Select a drug and ensure insurance info is entered.');
      return;
    }
    setLoadingFormulary(true);
    setFormularyStatus(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide formulary coverage information for ${selectedDrug.name} (${selectedDrug.generic}) under ${patientData.insurance} insurance. Return ONLY valid JSON with: tier (string: "Tier 1", "Tier 2", "Tier 3", "Non-formulary", or "Unknown"), priorAuthRequired (boolean), copay (string or null), notes (string with any restrictions).`,
        response_json_schema: {
          type: 'object',
          properties: {
            tier: { type: 'string' },
            priorAuthRequired: { type: 'boolean' },
            copay: { type: ['string', 'null'] },
            notes: { type: 'string' }
          }
        }
      });
      setFormularyStatus(response);
      const action = response.priorAuthRequired ? '⚠ Prior auth required' : '✓ No prior auth';
      appendMsg('bot', `📋 **${selectedDrug.name}** on ${patientData.insurance}: **${response.tier}** · ${action}${response.copay ? ` · Copay: ${response.copay}` : ''}${response.notes ? ` · ${response.notes}` : ''}`);
    } catch (e) {
      appendMsg('sys', '⚠ Could not retrieve formulary status. Please verify insurance details.');
    }
    setLoadingFormulary(false);
  };

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const sig = (() => {
    if (!sigDose && !sigFreq) return '';
    const formMap = {Tablet:'tablet',Capsule:'capsule',ODT:'tablet',Liquid:'mL',Patch:'patch',Cream:'application',Inhaler:'inhalation'};
    const fUnit = formMap[rxForm] || 'dose';
    let s = '';
    if (sigDose) s += `Take ${sigDose} ${fUnit}(s) `;
    if (sigFreq) s += `${sigFreq} `;
    if (sigDur) s += `for ${sigDur} `;
    if (sigQual) s += `${sigQual} `;
    if (sigExtra) s += `· ${sigExtra}`;
    return s.trim();
  })();

  const filteredDrugs = query.length >= 2
    ? DRUGS.filter(d => 
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.generic.toLowerCase().includes(query.toLowerCase()) ||
        d.class.toLowerCase().includes(query.toLowerCase()) ||
        (d.indications && d.indications.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 12)
    : [];

  const selectDrug = (drug) => {
    setSelectedDrug(drug);
    setQuery(drug.name);
    setShowDrop(false);
    setRxStrength(drug.strengths?.[0] || '');
    setRxForm(drug.forms?.[0] || 'Tablet');
    setRxRoute(drug.route || 'PO');
    setSigDose('1 ' + (drug.forms?.[0] || 'tablet').toLowerCase());
    setShowCS(!!drug.schedule);
    const conflict = drug.allergy && PATIENT_ALLERGIES.some(a =>
      a.toLowerCase() === drug.allergy.toLowerCase() ||
      drug.allergy.toLowerCase().includes(a.toLowerCase()) ||
      a.toLowerCase().includes(drug.allergy.toLowerCase())
    );
    setShowConflict(conflict);
    // interactions
    setLoadingInt(true);
    setInteractions([]);
    setTimeout(() => { setInteractions(getInteractions(drug)); setLoadingInt(false); }, 800);
    // AI auto-brief
    const ageGender = patientData.age && patientData.sex ? `${patientData.age}yo ${patientData.sex.charAt(0)}` : 'patient';
    const medsStr = PATIENT_MEDS.length > 0 ? PATIENT_MEDS.join(', ') : 'none listed';
    const allergyStr = PATIENT_ALLERGIES.length > 0 ? PATIENT_ALLERGIES.join(', ') : 'none listed';
    aiQ(`I'm prescribing ${drug.name} (${drug.generic}, ${drug.class}) to ${ageGender}${patientData.crCl ? ` with CrCl ${patientData.crCl} mL/min` : ''}${patientData.weight ? `, weight ${patientData.weight}kg` : ''}. Allergies: ${allergyStr}. Current meds: ${medsStr}. Briefly: 1) Any safety concerns? 2) Renal dose adjustment? 3) Key drug interactions? 4) Key counselling points.`);
  };

  const loadFav = (fav) => {
    const drugName = fav.drugName || fav.name;
    const drug = DRUGS.find(d => d.name.toLowerCase() === drugName.toLowerCase()) || {name:fav.name,generic:fav.name,class:'',emoji:'💊',strengths:[fav.rx.strength],forms:[fav.rx.form],route:fav.rx.route,interactions:[],warnings:[],contraindications:[],renal:[]};
    selectDrug(drug);
    setTimeout(() => {
      setRxStrength(fav.rx.strength);
      setRxForm(fav.rx.form);
      setRxRoute(fav.rx.route);
      setSigDose(fav.rx.dose || '1 tablet');
      setSigFreq(fav.rx.freq || 'once daily');
      setSigDur(fav.rx.dur || '');
      setSigQual(fav.rx.qual || '');
      setRxQty(fav.rx.qty || '');
      setRxDays(fav.rx.days || '');
      setRxRefills(fav.rx.refills || '0');
    }, 60);
  };

  const addToQueue = () => {
    if (!selectedDrug) return;
    const rx = {id: Date.now(), drug: selectedDrug.name, strength: rxStrength, form: rxForm, qty: rxQty, days: rxDays, sig, pharm: selectedPharm, method: sendMethod, status: 'pending', controlled: !!selectedDrug.schedule};
    setRxQueue(q => [...q, rx]);
    appendMsg('sys', `✅ ${selectedDrug.name} ${rxStrength} added to queue.`);
  };

  const removeFromQueue = (id) => setRxQueue(q => q.filter(r => r.id !== id));

  const signRx = async () => {
    if (!selectedDrug && rxQueue.length === 0) { appendMsg('sys','⚠ No prescription to sign.'); return; }
    if (selectedDrug) addToQueue();
    await new Promise(r => setTimeout(r, 1000));
    setRxQueue(q => q.map(r => ({...r, status:'signed'})));
    setStatusBadge('sent');
    const method = sendMethod === 'e-prescribe' ? 'electronically (EPCS)' : sendMethod === 'fax' ? 'via fax' : 'via print';
    appendMsg('bot', `✅ **Prescription(s) signed and sent** ${method} to ${selectedPharm}. Filed in patient record.`);
  };

  const clearRx = () => {
    setSelectedDrug(null); setQuery(''); setRxStrength(''); setSigDose(''); setSigFreq('once daily');
    setSigDur(''); setSigQual(''); setSigExtra(''); setRxQty(''); setRxDays(''); setRxRefills('0');
    setRxDx(''); setRxNotes(''); setShowCS(false); setShowConflict(false); setInteractions([]);
    setStatusBadge('draft');
    appendMsg('sys','🗑 Prescription cleared.');
  };

  const buildCtx = () => {
    const ageGender = patientData.age && patientData.sex ? `${patientData.age}yo ${patientData.sex.charAt(0)}` : '—';
    const crClStr = patientData.crCl ? `CrCl ${patientData.crCl} mL/min` : '—';
    const wtStr = patientData.weight ? `Wt ${patientData.weight}kg` : '—';
    return `Patient: ${patientName} | ${ageGender} | ${crClStr} | ${wtStr}
Allergies: ${PATIENT_ALLERGIES.length > 0 ? PATIENT_ALLERGIES.join(', ') : 'None'}
Current Meds: ${PATIENT_MEDS.length > 0 ? PATIENT_MEDS.join(' · ') : 'None'}
Drug: ${selectedDrug ? selectedDrug.name : '(none)'} ${rxStrength} ${rxForm} ${rxRoute}
SIG: ${sig}
Qty: ${rxQty} ${rxQtyUnit} · Days: ${rxDays} · Refills: ${rxRefills}
Diagnosis: ${rxDx || '—'}`;
  };

  const appendMsg = (role, text) => setAiMessages(prev => [...prev, {role, text}]);

  const aiQ = async (question) => {
    appendMsg('user', question);
    setAiLoading(true);
    const newHistory = [...convHistory, {role:'user', content:`${buildCtx()}\n\nQuestion: ${question}`}];
    setConvHistory(newHistory);
    try {
      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an expert clinical pharmacist and prescribing assistant. Be concise and clinically precise. Reference FDA guidelines and current pharmacotherapy standards. Always flag safety concerns first.\n\n${buildCtx()}\n\nQuestion: ${question}`,
        model: 'claude_sonnet_4_6',
      });
      const text = typeof reply === 'string' ? reply : (reply.content || JSON.stringify(reply));
      setConvHistory(h => [...h, {role:'assistant', content:text}]);
      const isWarn = text.toLowerCase().includes('allergy') || text.toLowerCase().includes('contraindic') || text.toLowerCase().includes('severe');
      appendMsg(isWarn ? 'warn' : 'bot', text);
    } catch {
      appendMsg('sys','⚠ Connection error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const sendAI = () => {
    if (!aiInput.trim() || aiLoading) return;
    const q = aiInput; setAiInput(''); aiQ(q);
  };

  return (
    <div className="erx-root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      {/* SUB NAV */}
      <div className="erx-subnav">
        <span className="erx-logo">notrya</span>
        <span className="erx-sep">|</span>
        <span className="erx-title">Electronic Prescribing</span>
        <span className="erx-badge">eRx</span>
        <div className="erx-nav-right">
          <button className="erx-btn-ghost" onClick={clearRx}>✕ Clear Rx</button>
          <button className="erx-btn-ghost" onClick={() => selectedDrug && aiQ(`Perform a comprehensive safety check for ${selectedDrug.name} in this patient. Check: 1) Allergy conflicts 2) DDI with current meds${patientData.crCl ? ` 3) Renal dose adjustment for CrCl ${patientData.crCl} mL/min` : ''} 4) Contraindications.`)}>🔍 Safety Check</button>
          <button className="erx-btn-ghost" onClick={addToQueue}>⏸ Hold</button>
          <Link to="/NewPatientInput" className="erx-btn-ghost">← Patient Input</Link>
          <button className="erx-btn-primary" onClick={signRx}>✍ Sign & Send</button>
        </div>
      </div>

      {/* PATIENT BAR */}
      <div className="erx-vbar">
        <span className="erx-vb-name">{patientName}</span>
        <span className="erx-vb-meta">{patientData.age ? `${patientData.age} yo` : '—'} {patientData.sex ? patientData.sex.charAt(0).toUpperCase() : ''} · DOB {patientData.dob || '—'} · MRN {patientData.mrn || '—'}</span>
        <div className="erx-vb-div"/>
        {patientData.weight && <><div className="erx-vb-chip"><span className="erx-vb-lbl">Wt</span><span className="erx-vb-val">{patientData.weight} kg</span></div></> }
        {patientData.crCl && <><div className="erx-vb-chip"><span className="erx-vb-lbl">CrCl</span><span className="erx-vb-val" style={{color:'var(--gold)'}}>{patientData.crCl} mL/min</span></div></> }
        {PATIENT_ALLERGIES.length > 0 && <><div className="erx-vb-div"/><div className="erx-allergy-btn">⚠ {PATIENT_ALLERGIES.length} Allergy{PATIENT_ALLERGIES.length !== 1 ? 'ies' : ''}</div></> }
        <div style={{marginLeft:'auto'}}>
          <span className={`erx-status-badge ${statusBadge === 'sent' ? 'erx-sb-sent' : 'erx-sb-draft'}`}>
            {statusBadge === 'sent' ? 'SENT' : 'RX DRAFT'}
          </span>
        </div>
      </div>

      {/* MAIN */}
      <div className="erx-main">

        {/* SIDEBAR */}
        <aside className="erx-sb">
          <div className="erx-sb-sec">
            <div className="erx-sb-sec-title">⚠ Allergies <span className="erx-sb-cnt">{PATIENT_ALLERGIES.length}</span></div>
            {PATIENT_ALLERGIES.length > 0 ? PATIENT_ALLERGIES.map(a => (
              <div key={a} className="erx-allergy-pill" onClick={() => aiQ(`Check if the current prescription conflicts with documented allergy to ${a}. Suggest safe alternatives.`)}>
                <div style={{flex:1}}><div className="erx-allergy-name">{a}</div></div>
              </div>
            )) : <div style={{fontSize:11,color:'var(--txt3)',padding:'4px 0'}}>No allergies documented.</div>}
            {PATIENT_ALLERGIES.length > 0 && <button className="erx-btn-ghost" style={{width:'100%',fontSize:11,marginTop:6}} onClick={() => aiQ(`Review all patient allergies (${PATIENT_ALLERGIES.join(', ')}) against my current prescription. Flag any conflicts or cross-reactivity risks.`)}>+ Review All Conflicts</button>}
          </div>

          <div className="erx-sb-sec">
            <div className="erx-sb-sec-title">💊 Current Medications <span className="erx-sb-cnt">{PATIENT_MEDS.length}</span></div>
            {PATIENT_MEDS.length > 0 ? PATIENT_MEDS.map((m) => (
              <div key={m} className="erx-med-pill"><div className="erx-med-name">{m}</div></div>
            )) : <div style={{fontSize:11,color:'var(--txt3)',padding:'4px 0'}}>No medications documented.</div>}
            {PATIENT_MEDS.length > 0 && <button className="erx-btn-ghost" style={{width:'100%',fontSize:11,marginTop:6}} onClick={() => aiQ(`Check all current medications (${PATIENT_MEDS.join(', ')}) for interactions with the new prescription.`)}>🔍 Check All Interactions</button>}
          </div>

          <div className="erx-sb-sec" style={{flex:1,overflow:'auto'}}>
            <div className="erx-sb-sec-title">📋 Rx Queue <span className="erx-sb-cnt">{rxQueue.length}</span></div>
            {rxQueue.length === 0 && <div style={{fontSize:11,color:'var(--txt3)',padding:'4px 0'}}>No prescriptions in queue.</div>}
            {rxQueue.map(r => (
              <div key={r.id} className={`erx-rxq-item ${r.status}`}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="erx-rxq-drug">{r.drug} {r.strength}</div>
                  <div className="erx-rxq-detail">{r.qty || '?'} × {r.days || '?'}d</div>
                </div>
                <span className={`erx-rxq-status ${r.status === 'signed' ? 'erx-qs-signed' : 'erx-qs-pending'}`}>{r.status.toUpperCase()}</span>
                <span style={{cursor:'pointer',color:'var(--txt4)',fontSize:14,marginLeft:4}} onClick={() => removeFromQueue(r.id)}>×</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="erx-content">

          {/* Drug Search */}
          <div className="erx-sec">
            <div className="erx-sec-hdr">
              <span style={{fontSize:17}}>🔍</span>
              <div><div className="erx-sec-title">Drug Search</div><div className="erx-sec-sub">{drugsLoading ? 'Loading drug database from server…' : `Search by brand name, generic, or drug class · ${DRUGS.length} drugs loaded`}</div></div>
            </div>
            <div className="erx-search-wrap">
              <span className="erx-search-icon">💊</span>
              <input className="erx-search-inp" value={query} onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
                onFocus={() => query.length >= 2 && setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder={drugsLoading ? 'Loading drug database…' : `Search ${DRUGS.length} drugs, generics, drug class…`} />
              {query && <span className="erx-search-clear" onClick={() => { setQuery(''); setShowDrop(false); }}>✕</span>}
              {showDrop && filteredDrugs.length > 0 && (
                <div className="erx-dropdown">
                  {filteredDrugs.map(drug => {
                    const allergyWarn = drug.allergy && PATIENT_ALLERGIES.includes(drug.allergy);
                    return (
                      <div key={drug.name} className="erx-drug-row" onMouseDown={() => selectDrug(drug)}>
                        <span className="erx-drug-ico">{drug.emoji}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="erx-drug-name">{drug.name}{allergyWarn && <span style={{fontSize:10,color:'var(--coral)',fontWeight:700,marginLeft:6}}>⚠ ALLERGY</span>}</div>
                          <div className="erx-drug-gen">{drug.generic}</div>
                        </div>
                        <span style={{fontSize:9,color:'var(--txt3)',fontFamily:'monospace',marginRight:6}}>{drug.class}</span>
                        {drug.schedule && <span className={`erx-sched-badge sch-${drug.schedule}`}>C{['','I','II','III','IV','V'][drug.schedule]}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Favorites */}

          </div>

          {/* Rx Builder */}
          <div className="erx-rx-card">
            <div className="erx-sec-hdr" style={{marginBottom:10}}>
              <span style={{fontSize:16}}>✍</span>
              <div><div className="erx-sec-title">Prescription Builder</div><div className="erx-sec-sub">{selectedDrug ? `Prescribing ${selectedDrug.name} — complete the fields below` : 'Select a drug above to begin'}</div></div>
              <span style={{marginLeft:'auto',fontSize:11,fontFamily:'monospace',padding:'2px 9px',borderRadius:20,fontWeight:600,background:statusBadge==='sent'?'rgba(0,229,192,.12)':'rgba(245,200,66,.12)',color:statusBadge==='sent'?'var(--teal)':'var(--gold)',border:`1px solid ${statusBadge==='sent'?'rgba(0,229,192,.3)':'rgba(245,200,66,.3)'}`}}>
                {statusBadge === 'sent' ? 'SENT' : 'DRAFT'}
              </span>
            </div>

            {selectedDrug && (
              <div className="erx-rx-drug-hdr erx-mb-12">
                <span style={{fontSize:24}}>{selectedDrug.emoji}</span>
                <div style={{flex:1}}>
                  <div className="erx-rx-drug-name">{selectedDrug.name}</div>
                  <div className="erx-rx-drug-gen">{selectedDrug.generic}</div>
                </div>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:3,background:'rgba(59,158,255,.12)',color:'var(--blue)',fontFamily:'monospace',fontWeight:600}}>{selectedDrug.class}</span>
                {selectedDrug.schedule && <span className={`erx-sched-badge sch-${selectedDrug.schedule}`}>C{['','I','II','III','IV','V'][selectedDrug.schedule]}</span>}
                <button className="erx-btn-ghost" style={{fontSize:11}} onClick={clearRx}>✕ Change Drug</button>
              </div>
            )}

            {showConflict && (
              <div className="erx-allergy-conflict erx-mb-12">
                <span style={{fontSize:19}}>⛔</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--coral)'}}>ALLERGY CONFLICT DETECTED</div>
                  <div style={{fontSize:11,color:'var(--txt2)',marginTop:2}}>{selectedDrug?.name} may conflict with a documented patient allergy ({selectedDrug?.allergy}). Consider alternatives.</div>
                </div>
                <button className="erx-btn-coral" style={{fontSize:11}} onClick={() => aiQ('Allergy conflict detected. Suggest alternative drugs with similar efficacy that are safe for this patient.')}>Get Alternatives</button>
              </div>
            )}

            {showCS && (
              <div className="erx-cs-alert erx-mb-12">
                <span style={{fontSize:17}}>🔒</span>
                <div style={{flex:1}}>
                  <div className="erx-cs-title">SCHEDULE {selectedDrug?.schedule <= 2 ? 'II' : 'IV'} CONTROLLED SUBSTANCE</div>
                  <div className="erx-cs-body">DEA registration required · No refills permitted · PDMP query recommended before prescribing</div>
                </div>
                <button className="erx-btn-ghost" style={{fontSize:11}} onClick={() => setShowPDMP(!showPDMP)}>🔍 {showPDMP ? 'Hide' : 'Check'} PDMP</button>
              </div>
            )}

            {showPDMP && (
              <PDMPAlertPanel 
                patientName={patientName}
                patientDob={patientData.dob || ''}
                patientId={patientData.mrn || ''}
                state="TX"
                onClose={() => setShowPDMP(false)}
              />
            )}

            <div className="erx-grid-3 erx-mb-12">
              <div className="erx-field">
                <label className="erx-lbl">Strength <span className="erx-req">*</span></label>
                <select className="erx-select" value={rxStrength} onChange={e => setRxStrength(e.target.value)}>
                  <option value="">— Select strength —</option>
                  {(selectedDrug?.strengths || []).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="erx-field">
                <label className="erx-lbl">Formulation <span className="erx-req">*</span></label>
                <select className="erx-select" value={rxForm} onChange={e => setRxForm(e.target.value)}>
                  {['Tablet','Capsule','Liquid','ODT','Patch','Cream','Ointment','Drops','Inhaler','Suppository','Injection'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="erx-field">
                <label className="erx-lbl">Route <span className="erx-req">*</span></label>
                <select className="erx-select" value={rxRoute} onChange={e => setRxRoute(e.target.value)}>
                  {['PO','SL','TOP','INH','PR','SQ','IM','IV','PO/SL'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* SIG builder */}
            <div className="erx-sig-box erx-mb-12">
              <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>SIG — Directions to Patient <span style={{color:'var(--coral)'}}>*</span></div>
              <div className="erx-grid-4" style={{marginBottom:8}}>
                <div className="erx-field"><label className="erx-lbl">Dose</label><input className="erx-inp mono" value={sigDose} onChange={e => setSigDose(e.target.value)} placeholder="e.g. 1 tab"/></div>
                <div className="erx-field"><label className="erx-lbl">Frequency</label>
                  <select className="erx-select" value={sigFreq} onChange={e => setSigFreq(e.target.value)}>
                    {['once daily','twice daily','three times daily','four times daily','every 4-6 hours','every 6 hours','every 8 hours','every 12 hours','at bedtime','as needed','as directed','once'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="erx-field"><label className="erx-lbl">Duration</label>
                  <select className="erx-select" value={sigDur} onChange={e => setSigDur(e.target.value)}>
                    <option value="">—</option>
                    {['1 day','3 days','5 days','7 days','10 days','14 days','21 days','30 days','until finished','as directed'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="erx-field"><label className="erx-lbl">Qualifier</label>
                  <select className="erx-select" value={sigQual} onChange={e => setSigQual(e.target.value)}>
                    <option value="">—</option>
                    {['with food','without food','with water','with meals','at bedtime','for pain','for nausea','for fever','by mouth'].map(q => <option key={q}>{q}</option>)}
                  </select>
                </div>
              </div>
              <div className="erx-field" style={{marginBottom:8}}>
                <label className="erx-lbl">Additional Instructions</label>
                <input className="erx-inp" value={sigExtra} onChange={e => setSigExtra(e.target.value)} placeholder="e.g. Do not crush, do not exceed 400mg/day…"/>
              </div>
              <div className={`erx-sig-preview${!sig ? ' erx-sig-empty' : ''}`}>{sig || 'SIG will appear here as you fill in the fields above.'}</div>
            </div>

            <div className="erx-grid-3 erx-mb-12">
              <div className="erx-field">
                <label className="erx-lbl">Quantity <span className="erx-req">*</span></label>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  <input type="number" className="erx-inp mono" style={{flex:1}} value={rxQty} onChange={e => setRxQty(e.target.value)} placeholder="30" min="1"/>
                  <select className="erx-select" style={{width:'auto'}} value={rxQtyUnit} onChange={e => setRxQtyUnit(e.target.value)}>
                    {['tablets','capsules','mL','patches','units','doses','grams'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="erx-field">
                <label className="erx-lbl">Days Supply <span className="erx-req">*</span></label>
                <input type="number" className="erx-inp mono" value={rxDays} onChange={e => setRxDays(e.target.value)} placeholder="30" min="1"/>
              </div>
              <div className="erx-field">
                <label className="erx-lbl">Refills <span className="erx-req">*</span></label>
                <select className="erx-select" value={rxRefills} onChange={e => setRxRefills(e.target.value)}>
                  {showCS && selectedDrug?.schedule <= 2
                    ? <option value="0">0 — No Refills (Schedule II)</option>
                    : ['0','1','2','3','6','11'].map(r => <option key={r} value={r}>{r === '0' ? '0 — No Refills' : r === '11' ? '11 Refills (1 year)' : `${r} Refill${r==='1'?'':'s'}`}</option>)}
                </select>
              </div>
            </div>

            <div className="erx-grid-2 erx-mb-12">
              <div className="erx-field">
                <label className="erx-lbl">Diagnosis / Indication <span className="erx-req">*</span></label>
                <input className="erx-inp" value={rxDx} onChange={e => setRxDx(e.target.value)} placeholder="ICD-10 or free-text diagnosis…"/>
              </div>
              <div className="erx-field">
                <label className="erx-lbl">Notes to Pharmacist</label>
                <input className="erx-inp" value={rxNotes} onChange={e => setRxNotes(e.target.value)} placeholder="Dispense as written, counselling required…"/>
              </div>
            </div>

            <div className="erx-grid-2 erx-mb-12">
              <div className="erx-field">
                <label className="erx-lbl">Prescriber Notes (internal)</label>
                <textarea className="erx-textarea" value={rxNotes} onChange={e => setRxNotes(e.target.value)} placeholder="Clinical rationale, monitoring plan…" style={{resize:'vertical',minHeight:'80px'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:9,paddingTop:4}}>
                {[['togGeneric',togGeneric,setTogGeneric,'Dispense as Generic (DAW-0)'],['togCounsel',togCounsel,setTogCounsel,'Pharmacist counselling required']].map(([id,val,set,lbl]) => (
                  <div key={id} className="erx-toggle-wrap">
                    <label className="erx-toggle"><input type="checkbox" checked={val} onChange={e => set(e.target.checked)}/><span className="erx-tog-slider"/></label>
                    <span style={{fontSize:12,color:'var(--txt2)'}}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pharmacy */}
            <div className="erx-div"/>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>🏪 Pharmacy Selection</div>

            {/* Pharmacy Search */}
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
              <input 
                type="text" 
                className="erx-inp" 
                placeholder="City, State, or Zip code" 
                value={pharmSearchValue}
                onChange={e => { setPharmSearchValue(e.target.value); setPharmSearchType(e.target.value ? 'search' : ''); }}
                style={{flex:1,minWidth:'150px'}}
              />
              <button 
                className="erx-btn-ghost" 
                onClick={handleNearMe}
                style={{whiteSpace:'nowrap'}}
              >📍 Near Me</button>
              {(pharmSearchType || pharmSearchValue) && (
                <button 
                  className="erx-btn-ghost" 
                  onClick={() => { setPharmSearchType(''); setPharmSearchValue(''); setUserLocation(null); }}
                  style={{whiteSpace:'nowrap'}}
                >✕ Clear</button>
              )}
            </div>

            <div className="erx-pharm-grid erx-mb-12">
              {PHARMACIES.map(p => (
                <div key={p.name} className={`erx-pharm-card${selectedPharm === p.name ? ' sel' : ''}`} onClick={() => setSelectedPharm(p.name)}>
                  <div className="erx-pharm-dot"/>
                  <div><div className="erx-pharm-name">{p.name}</div><div className="erx-pharm-addr">{p.addr}</div></div>
                  <span className={`erx-chain-pill ${p.chainClass}`}>{p.chain}</span>
                </div>
              ))}
            </div>

            {/* Send method */}
            <div className="erx-div"/>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>📤 Send Method</div>
            <div className="erx-send-btns erx-mb-12">
              {[['e-prescribe','🖥 e-Prescribe (EPCS)'],['fax','📠 Fax to Pharmacy'],['print','🖨 Print Rx'],['phone','📞 Phone-In']].map(([m,lbl]) => (
                <div key={m} className={`erx-send-btn${sendMethod === m ? ' active-etx' : ''}`} onClick={() => setSendMethod(m)}>{lbl}{m === 'e-prescribe' && sendMethod === m && <span style={{fontSize:9,padding:'1px 5px',borderRadius:20,background:'rgba(0,229,192,.2)',color:'var(--teal)',fontWeight:700,marginLeft:4}}>DEFAULT</span>}</div>
              ))}
            </div>

            <div className="erx-div"/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button className="erx-btn-ghost" onClick={addToQueue}>＋ Add to Queue</button>
              <div style={{display:'flex',gap:8}}>
                <button className="erx-btn-ghost" onClick={() => aiQ('Review this prescription for accuracy, appropriateness, dosing, duration, and any safety concerns. Suggest improvements if needed.')}>🤖 AI Review</button>
                <button className="erx-btn-primary" onClick={signRx}>✍ Sign & Send Rx</button>
              </div>
            </div>
          </div>

          {/* Drug Interactions */}
          <div className="erx-sec">
            <div className="erx-sec-hdr">
              <span style={{fontSize:17}}>⚡</span>
              <div><div className="erx-sec-title">Drug Interactions & Safety</div><div className="erx-sec-sub">Real-time interaction screening against current medication list</div></div>
              <button className="erx-btn-ghost" style={{marginLeft:'auto',fontSize:11}} onClick={() => selectedDrug && PATIENT_MEDS.length > 0 && aiQ(`Perform a comprehensive drug interaction check for ${selectedDrug.name} against: ${PATIENT_MEDS.join(', ')}. Classify each by severity.`)}>🔍 Full Check</button>
            </div>
            {loadingInt && <div className="erx-ai-loader"><div className="erx-ai-tdot"/><div className="erx-ai-tdot"/><div className="erx-ai-tdot"/><span style={{marginLeft:6,fontSize:11,color:'var(--txt3)'}}>Running interaction screen…</span></div>}
            {!loadingInt && interactions.length === 0 && <div style={{fontSize:12,color:'var(--txt3)',padding:'6px 0'}}>Select a drug above to run interaction screening.</div>}
            {!loadingInt && interactions.map((int, i) => (
              <div key={i} className={`erx-int-row ${int.sev}`}>
                <div className="erx-int-dot" style={{background:int.sev==='severe'?'var(--coral)':int.sev==='moderate'?'var(--gold)':'var(--blue)'}}/>
                <div style={{flex:1}}>
                  <div className="erx-int-drugs">{int.drugs}</div>
                  <div className="erx-int-desc">{int.desc}</div>
                  <span className={`erx-int-label ia-${int.action}`}>{int.label}</span>
                </div>
              </div>
            ))}
          </div>



        </main>

        {/* AI PANEL */}
        <aside className="erx-ai-panel">
          <div className="erx-ai-hdr">
            <div className="erx-ai-hrow">
              <div className="erx-ai-dot"/>
              <span className="erx-ai-lbl">Notrya AI — Rx Advisor</span>
              <span className="erx-ai-model">claude-sonnet-4</span>
            </div>
            <div className="erx-ai-qbtns">
              {[
                ['⚡ DDI Check','Check this prescription for drug-drug interactions against current medications. Classify by severity: severe/moderate/mild.'],
                ['⚖ Renal Dosing',`What is the appropriate dosing for this drug given${patientData.crCl ? ` CrCl of ${patientData.crCl} mL/min` : ' the patient renal function'}${patientData.weight ? `, weight ${patientData.weight}kg` : ''}${patientData.age ? `, age ${patientData.age}` : ''}?`],
                ['🔄 Alternatives','Suggest safe alternatives to the current prescription given the patient allergies and current medications.'],
                ['📋 Counselling','What patient counselling points should I communicate for this medication?'],
                ['💳 Formulary',() => checkFormulary()],
                ['✅ Review Rx','Review the prescription for completeness. Are the dose, frequency, quantity, and days supply appropriate?'],
                ['💡 Suggest Rx','Suggest the top 5 most commonly prescribed medications for the diagnosis entered.'],
                ['💰 Cost / Generic','Approximate cost of this prescription? Are there lower-cost generic alternatives?'],
              ].map(([lbl, q]) => (
                <button key={lbl} className="erx-ai-qbtn" onClick={() => typeof q === 'function' ? q() : aiQ(q)}>{lbl}</button>
              ))}
            </div>
          </div>
          <div className="erx-ai-msgs" ref={aiMsgsRef}>
            {formularyStatus && (
              <div style={{background:'rgba(0,229,192,.08)',border:'1px solid rgba(0,229,192,.25)',borderRadius:8,padding:10,marginBottom:10}}>
                <div style={{fontSize:10,color:'var(--teal)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>📋 Formulary Status</div>
                <div style={{fontSize:12,color:'var(--txt)',marginBottom:6}}><strong>{formularyStatus.tier}</strong></div>
                {formularyStatus.priorAuthRequired && <div style={{fontSize:11,color:'var(--coral)',marginBottom:4}}>⚠ <strong>Prior Authorization Required</strong></div>}
                {formularyStatus.copay && <div style={{fontSize:11,color:'var(--txt2)',marginBottom:4}}>💰 Typical Copay: {formularyStatus.copay}</div>}
                {formularyStatus.notes && <div style={{fontSize:11,color:'var(--txt3)',fontStyle:'italic'}}>{formularyStatus.notes}</div>}
              </div>
            )}
            {loadingFormulary && <div className="erx-ai-loader"><div className="erx-ai-tdot"/><div className="erx-ai-tdot"/><div className="erx-ai-tdot"/><span style={{marginLeft:6,fontSize:11,color:'var(--txt3)'}}>Checking formulary…</span></div>}
            {aiMessages.map((m, i) => (
              <div key={i} className={`erx-ai-msg ${m.role}`} dangerouslySetInnerHTML={{__html: m.text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}/>
            ))}
            {aiLoading && <div className="erx-ai-loader"><div className="erx-ai-tdot"/><div className="erx-ai-tdot"/><div className="erx-ai-tdot"/></div>}
          </div>
          <div className="erx-ai-inp-wrap">
            <textarea className="erx-ai-inp" rows={2} value={aiInput} onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
              placeholder="Ask about dosing, interactions, alternatives…"/>
            <button className="erx-ai-send" onClick={sendAI}>↑</button>
          </div>
        </aside>

      </div>
      <ClinicalTabBar currentPage="ERx" />
    </div>
  );
}