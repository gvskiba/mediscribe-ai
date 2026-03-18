import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ClinicalTabBar from "@/components/shared/ClinicalTabBar";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

.erp-root {
  --bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;
  --border:#1a3555;--border-hi:#2a4f7a;
  --blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;
  --purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;
  --txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;
  --r:8px;--rl:12px;
  background:var(--bg);color:var(--txt);
  font-family:'DM Sans',sans-serif;font-size:13px;
  display:flex;flex-direction:column;overflow:hidden;
  height:100vh;margin-left:72px;
}
.erp-root * { box-sizing:border-box; }
.erp-root input,.erp-root select,.erp-root textarea { font-family:'DM Sans',sans-serif; }

/* SUB NAVBAR */
.erp-nav{height:44px;background:#040d1a;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.erp-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan)}
.erp-ndiv{width:1px;height:16px;background:var(--border)}
.erp-ntitle{font-size:12px;color:var(--txt2);font-style:italic}
.erp-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:10px;color:var(--teal);font-family:'JetBrains Mono',monospace}
.erp-nav-right{margin-left:auto;display:flex;align-items:center;gap:7px}
.erp-btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 10px;font-size:11px;color:var(--txt2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
.erp-btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}
.erp-btn-gold{background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.35);color:var(--gold);border-radius:var(--r);padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
.erp-btn-gold:hover{background:rgba(245,200,66,.22)}
.erp-btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:filter .15s}
.erp-btn-primary:hover{filter:brightness(1.15)}

/* VITALS BAR */
.erp-vbar{height:36px;background:#060f1c;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 12px;gap:8px;overflow-x:auto;flex-shrink:0}
.erp-vbar::-webkit-scrollbar{display:none}
.erp-vchip{display:flex;align-items:center;gap:4px;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;padding:2px 8px;flex-shrink:0}
.erp-vl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;font-family:'JetBrains Mono',monospace}
.erp-vv{font-size:11px;font-weight:600;color:var(--txt);font-family:'JetBrains Mono',monospace}
.erp-vdiv{width:1px;height:18px;background:var(--border);flex-shrink:0}
.erp-status-badge{font-size:10px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600}
.erp-status-badge.pending{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}
.erp-status-badge.active{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.erp-status-badge.progress{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}

/* LAYOUT */
.erp-layout{display:flex;flex:1;overflow:hidden}

/* SIDEBAR */
.erp-sb{width:210px;flex-shrink:0;background:#060e1c;border-right:1px solid var(--border);overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:4px}
.erp-sb::-webkit-scrollbar{width:3px}
.erp-sb::-webkit-scrollbar-thumb{background:var(--border)}
.erp-sb-head{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--txt4);padding:4px 8px 2px}
.erp-sb-btn{display:flex;align-items:center;gap:7px;padding:6px 9px;border-radius:7px;cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:11px;color:var(--txt2);background:none;width:100%;text-align:left}
.erp-sb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt)}
.erp-sb-dot{width:6px;height:6px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0}
.erp-sb-dot.done{background:var(--teal)}
.erp-sb-divider{height:1px;background:var(--border);margin:6px 0}
.erp-sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 11px}
.erp-sb-pt-name{font-family:'Playfair Display',serif;font-size:13px;font-weight:600;color:var(--txt);margin-bottom:2px}
.erp-sb-pt-meta{font-size:10px;color:var(--txt2)}
.erp-sb-total-row{display:flex;justify-content:space-between;margin-bottom:3px}
.erp-esi-bar{height:3px;border-radius:2px;margin-top:8px}

/* CONTENT */
.erp-content{flex:1;overflow-y:auto;padding:14px 16px 40px;display:flex;flex-direction:column;gap:14px}
.erp-content::-webkit-scrollbar{width:4px}
.erp-content::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* SECTION BOX */
.erp-sec{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px}
.erp-sec-hdr{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.erp-sec-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--txt)}
.erp-sec-sub{font-size:11px;color:var(--txt3);margin-top:1px}
.erp-pill{font-size:10px;font-family:'JetBrains Mono',monospace;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 9px;color:var(--txt3)}

/* PRESENT CARD */
.erp-present{background:linear-gradient(135deg,rgba(59,158,255,.05),rgba(0,229,192,.04));border:1px solid rgba(59,158,255,.22);border-radius:var(--rl);padding:16px 18px}

/* GRIDS */
.erp-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.erp-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px}
.erp-field{display:flex;flex-direction:column;gap:3px}
.erp-flabel{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px}
.erp-input{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:6px 9px;color:var(--txt);font-size:12px;outline:none;width:100%;transition:border-color .15s}
.erp-input:focus{border-color:var(--blue)}
.erp-input::placeholder{color:var(--txt4)}
.erp-textarea{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 9px;color:var(--txt);font-size:12px;outline:none;resize:vertical;min-height:70px;width:100%;transition:border-color .15s;line-height:1.5}
.erp-textarea:focus{border-color:var(--blue)}
.erp-textarea::placeholder{color:var(--txt4)}
.erp-select{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:6px 9px;color:var(--txt);font-size:12px;outline:none;cursor:pointer;width:100%}
.erp-select:focus{border-color:var(--blue)}

/* ESI */
.erp-esi-row{display:flex;gap:5px}
.erp-esi-btn{flex:1;padding:5px 3px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg-up);text-align:center;font-size:10px;font-weight:600;cursor:pointer;transition:all .15s;color:var(--txt3);line-height:1.3}
.erp-esi-btn.e1{border-color:var(--coral);background:rgba(255,107,107,.15);color:var(--coral)}
.erp-esi-btn.e2{border-color:var(--orange);background:rgba(255,159,67,.13);color:var(--orange)}
.erp-esi-btn.e3{border-color:var(--gold);background:rgba(245,200,66,.12);color:var(--gold)}
.erp-esi-btn.e4{border-color:var(--blue);background:rgba(59,158,255,.12);color:var(--blue)}
.erp-esi-btn.e5{border-color:var(--teal);background:rgba(0,229,192,.11);color:var(--teal)}

/* GEN BUTTON */
.erp-gen-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:linear-gradient(135deg,rgba(0,229,192,.18),rgba(59,158,255,.14));border:1px solid rgba(0,229,192,.45);border-radius:var(--r);color:var(--teal);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.erp-gen-btn:hover{box-shadow:0 0 20px rgba(0,229,192,.22);filter:brightness(1.12)}
.erp-gen-btn:disabled{opacity:.5;pointer-events:none}
@keyframes erp-spin{to{transform:rotate(360deg)}}
.erp-spinner{width:13px;height:13px;border:2px solid rgba(0,229,192,.25);border-top-color:var(--teal);border-radius:50%;animation:erp-spin .7s linear infinite;flex-shrink:0}

/* PLAN SUMMARY */
.erp-plan-box{background:rgba(0,229,192,.04);border:1px solid rgba(0,229,192,.18);border-radius:var(--r);padding:12px 14px;font-size:12px;line-height:1.7;color:var(--txt);min-height:50px}
.erp-plan-box.empty{color:var(--txt4);font-style:italic;font-size:11px}

/* CHIPS */
.erp-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.erp-chip{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);transition:all .15s;user-select:none}
.erp-chip:hover{border-color:var(--border-hi);color:var(--txt)}
.erp-chip.sel-teal{background:rgba(0,229,192,.12);border-color:var(--teal);color:var(--teal)}
.erp-chip.sel-purple{background:rgba(155,109,255,.12);border-color:var(--purple);color:var(--purple)}

/* ORDER ROW */
.erp-order-row{display:flex;align-items:center;gap:7px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:7px 11px;transition:border-color .15s}
.erp-order-row:hover{border-color:var(--border-hi)}
.erp-order-row.ai-row{border-color:rgba(0,229,192,.22);background:rgba(0,229,192,.03)}
.erp-order-chk{width:15px;height:15px;flex-shrink:0;border:1.5px solid var(--border);border-radius:4px;background:var(--bg-up);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;font-size:9px;font-weight:800;color:var(--bg)}
.erp-order-chk.on{background:var(--teal);border-color:var(--teal)}
.erp-order-chk.on-purple{background:var(--purple);border-color:var(--purple)}
.erp-order-name{flex:1;font-size:12px;font-weight:500;color:var(--txt)}
.erp-ai-tag{font-size:9px;color:var(--teal);background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.28);border-radius:3px;padding:1px 5px;font-weight:700;flex-shrink:0}
.erp-del{color:var(--txt4);cursor:pointer;font-size:15px;padding:0 2px;transition:color .15s}
.erp-del:hover{color:var(--coral)}

/* MED ROW */
.erp-med-row{display:grid;grid-template-columns:8px 1fr 95px 65px 80px 70px auto;align-items:center;gap:7px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:6px 11px;transition:border-color .15s}
.erp-med-row:hover{border-color:var(--border-hi)}
.erp-med-row.ai-row{border-color:rgba(155,109,255,.24);background:rgba(155,109,255,.03)}
.erp-med-dot{width:7px;height:7px;border-radius:50%;background:var(--purple);flex-shrink:0}
.erp-cell-inp{background:transparent;border:none;outline:none;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:12px;width:100%}
.erp-cell-inp::placeholder{color:var(--txt4)}
.erp-cell-sel{background:transparent;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:11px;width:100%;cursor:pointer;color:var(--txt2)}
.erp-cell-sel option{background:var(--bg-card)}
.pri-stat{color:var(--coral);font-weight:700}
.pri-urg{color:var(--gold);font-weight:600}
.pri-rtn{color:var(--teal)}

/* IVF ROW */
.erp-ivf-row{display:grid;grid-template-columns:8px 1fr 95px 65px 95px auto;align-items:center;gap:7px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:6px 11px;transition:border-color .15s}
.erp-ivf-row:hover{border-color:var(--border-hi)}
.erp-ivf-row.ai-row{border-color:rgba(59,158,255,.24);background:rgba(59,158,255,.03)}
.erp-ivf-dot{width:7px;height:7px;border-radius:50%;background:var(--blue);flex-shrink:0}

/* PROC GRID */
.erp-proc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:7px;margin-bottom:10px}
.erp-proc-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:9px 11px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:all .15s}
.erp-proc-card:hover{border-color:var(--border-hi)}
.erp-proc-card.on{border-color:rgba(155,109,255,.45);background:rgba(155,109,255,.08)}
.erp-proc-card.ai-on{border-color:rgba(0,229,192,.38);background:rgba(0,229,192,.06)}
.erp-proc-name{font-size:11px;font-weight:600;color:var(--txt);line-height:1.3}
.erp-proc-sub{font-size:9px;color:var(--txt3);margin-top:1px}

/* CONSULT ROW */
.erp-con-row{display:flex;align-items:center;gap:7px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:7px 11px;transition:border-color .15s}
.erp-con-row:hover{border-color:var(--border-hi)}
.erp-con-row.ai-row{border-color:rgba(245,200,66,.22);background:rgba(245,200,66,.03)}

/* ADD ROW */
.erp-add-row{display:flex;gap:6px;align-items:center;margin-top:7px}
.erp-add-inp{flex:1;background:var(--bg-up);border:1px dashed var(--border);border-radius:var(--r);padding:6px 9px;color:var(--txt);font-size:12px;outline:none}
.erp-add-inp:focus{border-style:solid;border-color:var(--blue)}
.erp-add-inp::placeholder{color:var(--txt4)}

/* COL HEADER */
.erp-col-hdr{font-size:9px;color:var(--txt4);text-transform:uppercase;letter-spacing:.05em;padding:0 11px 4px}

/* AI PANEL */
.erp-ai-aside{width:270px;flex-shrink:0;background:#060e1c;border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.erp-ai-hdr{padding:10px 12px 8px;border-bottom:1px solid var(--border);flex-shrink:0}
.erp-ai-hrow{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.erp-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:erp-pulse 2s infinite}
@keyframes erp-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 4px rgba(0,229,192,0)}}
.erp-ai-title{font-size:11px;font-weight:600;color:var(--txt);flex:1}
.erp-ai-model{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt4);background:var(--bg-up);padding:2px 5px;border-radius:3px}
.erp-ai-qbtns{display:flex;flex-wrap:wrap;gap:3px}
.erp-ai-qbtn{padding:2px 7px;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:5px;color:var(--txt3);cursor:pointer;transition:all .15s}
.erp-ai-qbtn:hover{border-color:var(--teal);color:var(--teal)}
.erp-ai-chat{flex:1;padding:10px 11px;overflow-y:auto;display:flex;flex-direction:column;gap:7px}
.erp-ai-chat::-webkit-scrollbar{width:3px}
.erp-ai-chat::-webkit-scrollbar-thumb{background:var(--border)}
.erp-ai-msg{padding:8px 10px;border-radius:7px;font-size:11px;line-height:1.6}
.erp-ai-msg.sys{background:var(--bg-up);border:1px solid var(--border);color:var(--txt2)}
.erp-ai-msg.user{background:#0a2040;border:1px solid rgba(59,158,255,.2);color:var(--txt)}
.erp-ai-msg.bot{background:#062020;border:1px solid rgba(0,229,192,.15);color:var(--txt2)}
.erp-ai-loading{display:flex;gap:4px;align-items:center;padding:8px 10px}
.erp-ai-tdot{width:5px;height:5px;border-radius:50%;background:var(--teal);animation:erp-bounce 1.2s infinite}
.erp-ai-tdot:nth-child(2){animation-delay:.2s}
.erp-ai-tdot:nth-child(3){animation-delay:.4s}
@keyframes erp-bounce{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
.erp-ai-inp-wrap{padding:8px 11px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:5px}
.erp-ai-inp{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:7px;padding:6px 9px;color:var(--txt);font-size:11px;outline:none;resize:none}
.erp-ai-inp:focus{border-color:var(--teal)}
.erp-ai-send{background:var(--teal);color:#050f1e;border:none;border-radius:7px;padding:6px 10px;font-size:13px;cursor:pointer;font-weight:700}
`;

const uid = () => 'id' + Date.now() + Math.random().toString(36).slice(2, 6);

const LAB_CHIPS = ['CBC','BMP','CMP','Troponin ×2 (0h & 3h)','BNP','D-Dimer','PT / INR / aPTT','Lactate','Blood Cultures ×2','UA + Urine Culture','Lipase','LFTs','TSH','VBG','ABG','Urine hCG','Serum hCG (quant)','Tox Screen (urine + serum)','EtOH Level','Acetaminophen Level','Salicylate Level','HbA1c','Procalcitonin','ESR / CRP','Type & Screen','Type & Crossmatch','Fibrinogen','Digoxin Level','Ammonia','Lipid Panel'];
const IMG_CHIPS = ['CXR PA/Lateral','CXR Portable AP','CT Head w/o contrast','CT Head w/ contrast','CTPA — PE Protocol','CT Chest w/o contrast','CT Abd/Pelvis w/ contrast','CT Abd/Pelvis w/o contrast','CTA Head / Neck','CT C-Spine w/o contrast','CT L-Spine w/o contrast','US Abdomen','US Pelvis (transabdominal / TV)','FAST Exam (bedside)','US Renal / Bladder','US DVT Lower Extremity','Bedside Echocardiography','XR Pelvis AP','XR Hip','XR Knee','XR Ankle','XR Hand / Wrist','XR Shoulder','XR Foot','XR C-Spine','MRI Brain w/ & w/o','MRI Spine'];
const PROC_CARDS = [
  {emoji:'📈',name:'EKG 12-Lead (stat)',sub:'Stat · read immediately'},
  {emoji:'🔁',name:'Repeat EKG in 30 min',sub:'Serial changes'},
  {emoji:'🫀',name:'Continuous Cardiac Monitoring',sub:'Continuous telemetry'},
  {emoji:'📊',name:'Continuous Pulse Oximetry',sub:'Pulse ox monitoring'},
  {emoji:'🌬️',name:'O₂ Supplementation',sub:'NC / NRB / HFNC / BiPAP'},
  {emoji:'💉',name:'IV Access — Large Bore ×2',sub:'Large bore ×2'},
  {emoji:'🔵',name:'Foley Catheter (strict I&O)',sub:'Strict I&O monitoring'},
  {emoji:'🫁',name:'Intubation / RSI',sub:'Definitive airway'},
  {emoji:'🔗',name:'Central Line (CVC)',sub:'IJ / Subclavian / Femoral'},
  {emoji:'🔴',name:'Arterial Line',sub:'Radial / Femoral'},
  {emoji:'🧠',name:'Lumbar Puncture (LP)',sub:'Cell count · glucose · protein'},
  {emoji:'🫧',name:'Chest Tube Thoracostomy',sub:'Thoracostomy'},
  {emoji:'⚡',name:'Cardioversion / Defibrillation',sub:'Sync / Unsynchronized'},
  {emoji:'🩺',name:'Needle Thoracostomy',sub:'Tension pneumothorax'},
  {emoji:'❤️',name:'Pericardiocentesis',sub:'Cardiac tamponade'},
  {emoji:'🌀',name:'NGT Placement',sub:'Lavage / decompression'},
  {emoji:'🩹',name:'Wound Care / Laceration Repair',sub:'Laceration closure'},
  {emoji:'🦴',name:'Splint / Immobilization',sub:'Immobilization'},
  {emoji:'💤',name:'Procedural Sedation',sub:'Ketamine / propofol / etomidate'},
  {emoji:'🔋',name:'Transcutaneous Pacing',sub:'Bradycardia + instability'},
];
const CONSULT_CHIPS = [
  ['Cardiology','Urgent'],['General Surgery','Urgent'],['Neurology','Urgent'],['Neurosurgery','Stat'],
  ['Orthopedics','Routine'],['Pulmonology','Urgent'],['Gastroenterology','Urgent'],['Nephrology','Urgent'],
  ['Urology','Routine'],['OB/GYN','Urgent'],['Psychiatry','Routine'],['Hematology / Oncology','Urgent'],
  ['Infectious Disease','Urgent'],['Critical Care / MICU','Stat'],['Vascular Surgery','Stat'],
  ['Hospitalist (Admission)','Urgent'],['Social Work','Routine'],['Pharmacy','Routine'],['ENT','Routine'],['Ophthalmology','Routine'],
];
const IVF_QUICK = [
  ['NS 1 L bolus','1000 mL','IV','Over 30 min'],
  ['NS 500 mL bolus','500 mL','IV','Over 15 min'],
  ['LR 1 L bolus','1000 mL','IV','Over 30 min'],
  ['LR 500 mL bolus','500 mL','IV','Over 15 min'],
  ['NS @ 125 mL/hr maintenance','—','IV','Continuous'],
  ['NS @ 75 mL/hr maintenance','—','IV','Continuous'],
  ['D5W 1 L','1000 mL','IV','Over 8 hr'],
  ['D50W 50 mL IV push','50 mL','IV','IV push'],
  ['pRBC 1 unit','1 unit','IV','Over 4 hr'],
  ['FFP 2 units','2 units','IV','Over 30 min'],
  ['Platelets 1 unit','1 unit','IV','Over 30 min'],
  ['Norepinephrine (0.1 mcg/kg/min)','—','IV','Continuous drip'],
];

export default function ERPlanBuilder() {
  const navigate = useNavigate();
  const [esi, setEsiState] = useState(null);
  const [demo, setDemo] = useState({ name:'', demographics:'', cc:'', bp:'', hr:'', rr:'', spo2:'', temp:'', wt:'', hpi:'' });
  const [labs, setLabs] = useState([]);
  const [meds, setMeds] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [ivf, setIvf] = useState([]);
  const [procs, setProcs] = useState([]);
  const [consults, setConsults] = useState([]);
  const [planSummary, setPlanSummary] = useState('');
  const [planGenerated, setPlanGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiMessages, setAiMessages] = useState([{ role:'sys', text:'Plan Advisor ready. Enter Chief Complaint & HPI, then click ✨ Generate Plan.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [labInp, setLabInp] = useState('');
  const [imgInp, setImgInp] = useState('');
  const [procInp, setProcInp] = useState('');
  const [conInp, setConInp] = useState('');
  const chatRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const appendAiMsg = (role, text) => setAiMessages(p => [...p, { role, text }]);

  const buildContext = () => {
    return `Patient: ${demo.name || 'Unknown'} | ${demo.demographics || 'Unknown'} | ESI ${esi || '?'}
CC: ${demo.cc || '—'} | Vitals: BP ${demo.bp || '—'} HR ${demo.hr || '—'} RR ${demo.rr || '—'} SpO₂ ${demo.spo2 || '—'}% Temp ${demo.temp || '—'}
HPI: ${demo.hpi || 'Not entered'}
Labs: ${labs.map(l=>l.name).join(', ') || 'None'}
Meds: ${meds.map(m=>`${m.name} ${m.dose} ${m.route}`).join(' | ') || 'None'}
Imaging: ${imaging.map(i=>i.name).join(', ') || 'None'}
IVF: ${ivf.map(f=>f.name).join(', ') || 'None'}
Procs: ${procs.map(p=>p.name).join(', ') || 'None'}
Consults: ${consults.map(c=>`${c.service} (${c.urgency})`).join(', ') || 'None'}`;
  };

  const generatePlan = async () => {
    if (!demo.cc && !demo.hpi) { toast.error('Enter Chief Complaint and/or HPI first.'); return; }
    setGenerating(true);
    setPlanSummary('');
    try {
      const prompt = `You are an expert emergency medicine clinical AI. Generate a comprehensive, evidence-based ER management plan.

PATIENT:
Name: ${demo.name || 'Unknown'} | Demographics: ${demo.demographics || 'Unknown'} | ESI ${esi || 'Unknown'}
CC: ${demo.cc} | Vitals: BP ${demo.bp || '—'} HR ${demo.hr || '—'} RR ${demo.rr || '—'} SpO₂ ${demo.spo2 || '—'}% Temp ${demo.temp || '—'} Weight ${demo.wt || '—'} kg
HPI: ${demo.hpi || 'Not provided'}

Return ONLY valid JSON (no markdown):
{
  "summary": "3-5 sentence clinical impression with differentials and management strategy",
  "labs": ["lab name"],
  "imaging": ["study with protocol"],
  "medications": [{"name":"drug","dose":"dose+unit","route":"route","freq":"frequency","priority":"Stat|Urgent|Routine"}],
  "ivFluids": [{"name":"fluid","vol":"volume or —","route":"IV","rate":"rate or duration"}],
  "procedures": ["procedure name"],
  "consults": [{"service":"specialty","urgency":"Stat|Urgent|Routine","notes":"reason"}]
}

Apply clinical decision rules (HEART, PERC, Wells, Ottawa, NEXUS, CURB-65, sepsis criteria) where relevant. Include weight-based dosing where applicable.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            labs: { type: 'array', items: { type: 'string' } },
            imaging: { type: 'array', items: { type: 'string' } },
            medications: { type: 'array', items: { type: 'object', properties: { name:{type:'string'}, dose:{type:'string'}, route:{type:'string'}, freq:{type:'string'}, priority:{type:'string'} } } },
            ivFluids: { type: 'array', items: { type: 'object', properties: { name:{type:'string'}, vol:{type:'string'}, route:{type:'string'}, rate:{type:'string'} } } },
            procedures: { type: 'array', items: { type: 'string' } },
            consults: { type: 'array', items: { type: 'object', properties: { service:{type:'string'}, urgency:{type:'string'}, notes:{type:'string'} } } },
          }
        }
      });

      setPlanSummary(res.summary || '');
      setPlanGenerated(true);
      if (res.labs?.length) setLabs(p => { const existing = p.map(x=>x.name); return [...p, ...res.labs.filter(l=>!existing.includes(l)).map(l=>({id:uid(),name:l,ai:true}))]; });
      if (res.imaging?.length) setImaging(p => { const existing = p.map(x=>x.name); return [...p, ...res.imaging.filter(i=>!existing.includes(i)).map(i=>({id:uid(),name:i,ai:true}))]; });
      if (res.medications?.length) setMeds(p => [...p, ...res.medications.map(m=>({id:uid(),name:m.name||'',dose:m.dose||'',route:m.route||'IV',freq:m.freq||'Once',priority:m.priority||'Routine',ai:true}))]);
      if (res.ivFluids?.length) setIvf(p => [...p, ...res.ivFluids.map(f=>({id:uid(),name:f.name||'',vol:f.vol||'',route:f.route||'IV',rate:f.rate||'',ai:true}))]);
      if (res.procedures?.length) setProcs(p => { const existing = p.map(x=>x.name); return [...p, ...res.procedures.filter(x=>!existing.includes(x)).map(x=>({id:uid(),name:x,ai:true}))]; });
      if (res.consults?.length) setConsults(p => { const existing = p.map(x=>x.service); return [...p, ...res.consults.filter(c=>!existing.includes(c.service)).map(c=>({id:uid(),service:c.service||'',urgency:c.urgency||'Urgent',notes:c.notes||'',ai:true}))]; });
      appendAiMsg('bot', `✅ Plan generated for "${demo.cc || 'this presentation'}". All sections populated. Review every AI-tagged order before signing.`);
    } catch(e) {
      toast.error('Generation failed: ' + e.message);
      appendAiMsg('sys', '⚠️ Generation error. Please try again.');
    }
    setGenerating(false);
  };

  const sendAI = async (question) => {
    const q = question || aiInput.trim();
    if (!q || aiLoading) return;
    setAiInput('');
    appendAiMsg('user', q);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, expert emergency medicine assistant. Be concise, clinically precise, reference guidelines.\n\n${buildContext()}\n\nQuestion: ${q}`,
      });
      appendAiMsg('bot', typeof res === 'string' ? res : JSON.stringify(res));
    } catch(e) {
      appendAiMsg('sys', '⚠️ Error. Please try again.');
    }
    setAiLoading(false);
  };

  const clearAll = () => {
    if (!window.confirm('Clear the entire ER plan?')) return;
    setLabs([]); setMeds([]); setImaging([]); setIvf([]); setProcs([]); setConsults([]);
    setPlanSummary(''); setPlanGenerated(false);
    appendAiMsg('sys', '🗑 Plan cleared.');
    toast.success('Plan cleared');
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const esiColors = { 1:'coral', 2:'orange', 3:'gold', 4:'blue', 5:'teal' };
  const total = labs.length + meds.length + imaging.length + ivf.length + procs.length + consults.length;
  const statusClass = planGenerated && total > 0 ? 'active' : total > 0 ? 'progress' : 'pending';
  const statusText = planGenerated && total > 0 ? 'PLAN ACTIVE' : total > 0 ? 'IN PROGRESS' : 'PLAN PENDING';

  // Lab helpers
  const isLabSelected = (name) => labs.some(l => l.name === name);
  const toggleLabChip = (name) => {
    if (isLabSelected(name)) setLabs(p => p.filter(l => l.name !== name));
    else setLabs(p => [...p, { id: uid(), name, ai: false }]);
  };
  const addCustomLab = () => { if (!labInp.trim()) return; if (!isLabSelected(labInp.trim())) setLabs(p => [...p, { id: uid(), name: labInp.trim(), ai: false }]); setLabInp(''); };

  // Imaging helpers
  const isImgSelected = (name) => imaging.some(i => i.name === name);
  const toggleImgChip = (name) => {
    if (isImgSelected(name)) setImaging(p => p.filter(i => i.name !== name));
    else setImaging(p => [...p, { id: uid(), name, ai: false }]);
  };
  const addCustomImg = () => { if (!imgInp.trim()) return; if (!isImgSelected(imgInp.trim())) setImaging(p => [...p, { id: uid(), name: imgInp.trim(), ai: false }]); setImgInp(''); };

  // Proc helpers
  const isProcOn = (name) => procs.some(p => p.name === name);
  const toggleProc = (name) => {
    if (isProcOn(name)) setProcs(p => p.filter(x => x.name !== name));
    else setProcs(p => [...p, { id: uid(), name, ai: false }]);
  };
  const addCustomProc = () => { if (!procInp.trim()) return; setProcs(p => [...p, { id: uid(), name: procInp.trim(), ai: false }]); setProcInp(''); };

  // Consult helpers
  const isConSelected = (service) => consults.some(c => c.service === service);
  const addQuickConsult = (service, urgency) => {
    if (!isConSelected(service)) setConsults(p => [...p, { id: uid(), service, urgency, notes: '', ai: false }]);
  };
  const addCustomConsult = () => { if (!conInp.trim()) return; if (!isConSelected(conInp.trim())) setConsults(p => [...p, { id: uid(), service: conInp.trim(), urgency: 'Routine', notes: '', ai: false }]); setConInp(''); };

  const updMed = (id, field, value) => setMeds(p => p.map(m => m.id === id ? {...m, [field]: value} : m));
  const updIvf = (id, field, value) => setIvf(p => p.map(f => f.id === id ? {...f, [field]: value} : f));
  const updConsult = (id, field, value) => setConsults(p => p.map(c => c.id === id ? {...c, [field]: value} : c));

  return (
    <div className="erp-root">
      <style>{CSS}</style>

      {/* NAVBAR */}
      <nav className="erp-nav">
        <span className="erp-logo">Notrya</span>
        <div className="erp-ndiv"/>
        <span className="erp-ntitle">ER Plan Builder</span>
        <span className="erp-badge">PLAN</span>
        <div className="erp-nav-right">
          <button className="erp-btn-ghost" onClick={() => navigate('/NewPatientInput')}>← New Patient Input</button>
          <button className="erp-btn-ghost" onClick={clearAll}>🗑 Clear Plan</button>
          <button className="erp-btn-gold" onClick={generatePlan} disabled={generating}>{generating ? '⏳ Generating…' : '✨ AI Generate Plan'}</button>
          <button className="erp-btn-primary" onClick={() => { toast.success('Plan saved'); appendAiMsg('sys','💾 Plan saved.'); }}>💾 Save Plan</button>
        </div>
      </nav>

      {/* VITALS BAR */}
      <div className="erp-vbar">
        <div className="erp-vchip">
          <div className="erp-vl">Patient</div>
          <div className="erp-vv" style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{demo.name || '— No Patient —'}</div>
        </div>
        <div className="erp-vdiv"/>
        {[['CC',demo.cc,'var(--orange)'],['BP',demo.bp],['HR',demo.hr],['SpO₂',demo.spo2 ? demo.spo2+'%' : ''],['Temp',demo.temp]].map(([l,v,c]) => (
          <div key={l} className="erp-vchip">
            <div className="erp-vl">{l}</div>
            <div className="erp-vv" style={{color:c||'var(--txt)',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v || '—'}</div>
          </div>
        ))}
        <div className="erp-vdiv"/>
        {esi && <div className="erp-vchip"><div className="erp-vl">ESI</div><div className="erp-vv" style={{color:`var(--${esiColors[esi]})`}}>{esi}</div></div>}
        <div style={{marginLeft:'auto'}}><span className={`erp-status-badge ${statusClass}`}>{statusText}</span></div>
      </div>

      {/* LAYOUT */}
      <div className="erp-layout">

        {/* SIDEBAR */}
        <aside className="erp-sb">
          <div className="erp-sb-card" style={{marginBottom:6}}>
            <div className="erp-sb-pt-name">{demo.name || 'New Patient'}</div>
            <div className="erp-sb-pt-meta">{demo.demographics || 'No demographics'}</div>
            {esi && <div className="erp-esi-bar" style={{background:`var(--${esiColors[esi]})`}}/>}
          </div>
          <div className="erp-sb-head">Plan Sections</div>
          {[
            ['📋','Presentation','sec-presentation'],
            ['💡','Plan Summary','sec-summary'],
            ['🧪','Labs','sec-labs'],
            ['💊','Medications','sec-meds'],
            ['🩻','Imaging','sec-imaging'],
            ['💧','IV Fluids','sec-ivf'],
            ['⚙️','Procedures','sec-procs'],
            ['👨‍⚕️','Consults','sec-consults'],
          ].map(([icon, label, id]) => {
            const counts = {
              'sec-labs': labs.length, 'sec-meds': meds.length, 'sec-imaging': imaging.length,
              'sec-ivf': ivf.length, 'sec-procs': procs.length, 'sec-consults': consults.length,
              'sec-summary': planGenerated ? 1 : 0, 'sec-presentation': (demo.name || demo.cc) ? 1 : 0,
            };
            return (
              <button key={id} className="erp-sb-btn" onClick={() => scrollToSection(id)}>
                <span style={{fontSize:13}}>{icon}</span>{label}
                <span className={`erp-sb-dot${counts[id] > 0 ? ' done' : ''}`}/>
              </button>
            );
          })}
          <div className="erp-sb-divider"/>
          <div className="erp-sb-head">Totals</div>
          <div className="erp-sb-card" style={{marginBottom:0}}>
            {[['Labs',labs.length,'var(--teal)'],['Meds',meds.length,'var(--purple)'],['Imaging',imaging.length,'var(--purple)'],['IV Fluids',ivf.length,'var(--blue)'],['Procedures',procs.length,'var(--txt3)'],['Consults',consults.length,'var(--gold)']].map(([k,v,c]) => (
              <div key={k} className="erp-sb-total-row">
                <span style={{fontSize:11,color:'var(--txt2)'}}>{k}</span>
                <span style={{fontSize:11,fontFamily:'monospace',color:c}}>{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="erp-content" ref={contentRef}>

          {/* PATIENT PRESENTATION */}
          <div className="erp-present" id="sec-presentation">
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:'var(--txt)'}}>Patient Presentation</span>
              <span style={{fontSize:10,color:'var(--orange)',background:'rgba(255,159,67,.12)',border:'1px solid rgba(255,159,67,.3)',borderRadius:20,padding:'1px 8px',fontWeight:600}}>AI Plan Input</span>
            </div>
            <div className="erp-grid-2">
              <div className="erp-field">
                <label className="erp-flabel">Patient Name</label>
                <input className="erp-input" value={demo.name} onChange={e=>setDemo(p=>({...p,name:e.target.value}))} placeholder="Last, First MI"/>
              </div>
              <div className="erp-field">
                <label className="erp-flabel">Age / Sex / DOB</label>
                <input className="erp-input" value={demo.demographics} onChange={e=>setDemo(p=>({...p,demographics:e.target.value}))} placeholder="54 yo M · DOB 01/15/1970"/>
              </div>
              <div className="erp-field">
                <label className="erp-flabel">Chief Complaint</label>
                <input className="erp-input" value={demo.cc} onChange={e=>setDemo(p=>({...p,cc:e.target.value}))} placeholder="e.g. Chest pain, shortness of breath…" style={{borderColor:'rgba(255,159,67,.3)'}}/>
              </div>
              <div>
                <div className="erp-flabel" style={{marginBottom:5}}>ESI Acuity</div>
                <div className="erp-esi-row">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`erp-esi-btn${esi === n ? ` e${n}` : ''}`} onClick={() => setEsiState(n)}>
                      {n}<br/><span style={{fontSize:9,fontWeight:400}}>{['Resus','Emergent','Urgent','Less Urg','Non-urg'][n-1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="erp-grid-3">
              {[['bp','BP (mmHg)','120/80'],['hr','HR (bpm)','72'],['rr','RR (/min)','16'],['spo2','SpO₂ (%)','98'],['temp','Temp (°F)','98.6'],['wt','Weight (kg)','70']].map(([k,lbl,ph]) => (
                <div key={k} className="erp-field">
                  <label className="erp-flabel">{lbl}</label>
                  <input className="erp-input" style={{fontFamily:'monospace',fontSize:12}} value={demo[k]} onChange={e=>setDemo(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
                </div>
              ))}
            </div>
            <div className="erp-field" style={{marginBottom:12}}>
              <label className="erp-flabel">History of Present Illness (HPI)</label>
              <textarea className="erp-textarea" style={{minHeight:80,borderColor:'rgba(59,158,255,.25)'}} value={demo.hpi} onChange={e=>setDemo(p=>({...p,hpi:e.target.value}))} rows={4} placeholder="Onset · character · severity · duration · radiation · associated symptoms · aggravating / relieving factors · PMHx · Meds · Allergies · ROS…"/>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <p style={{fontSize:11,color:'var(--txt3)'}}>Fill in Chief Complaint + HPI, then generate a guideline-referenced ER plan.</p>
              <button className="erp-gen-btn" onClick={generatePlan} disabled={generating}>
                {generating ? <><div className="erp-spinner"/>&nbsp;Generating…</> : '✨ Generate Plan from CC & HPI'}
              </button>
            </div>
          </div>

          {/* PLAN SUMMARY */}
          <div className="erp-sec" id="sec-summary">
            <div className="erp-sec-hdr">
              <span style={{fontSize:16}}>💡</span>
              <div><div className="erp-sec-title">Plan Summary</div><div className="erp-sec-sub">AI clinical impression · differential · overall management strategy</div></div>
              <span className="erp-pill" style={{marginLeft:'auto'}}>{planGenerated ? 'AI Generated' : 'Not generated'}</span>
            </div>
            <div className={`erp-plan-box${!planSummary ? ' empty' : ''}`}>
              {planSummary || 'Enter Chief Complaint and HPI above, then click ✨ Generate Plan.'}
            </div>
          </div>

          {/* LABS */}
          <div className="erp-sec" id="sec-labs">
            <div className="erp-sec-hdr">
              <span style={{fontSize:16}}>🧪</span>
              <div><div className="erp-sec-title">Laboratory Orders</div><div className="erp-sec-sub">Select common panels or add custom tests</div></div>
              <span className="erp-pill" style={{marginLeft:'auto'}}>{labs.length}</span>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Common Panels — click to add</div>
              <div className="erp-chips">
                {LAB_CHIPS.map(name => (
                  <div key={name} className={`erp-chip${isLabSelected(name) ? ' sel-teal' : ''}`} onClick={() => toggleLabChip(name)}>{name}</div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {labs.map(l => (
                <div key={l.id} className={`erp-order-row${l.ai ? ' ai-row' : ''}`}>
                  <div className="erp-order-chk on">✓</div>
                  <span className="erp-order-name">{l.name}</span>
                  {l.ai && <span className="erp-ai-tag">AI</span>}
                  <span className="erp-del" onClick={() => setLabs(p => p.filter(x=>x.id!==l.id))}>×</span>
                </div>
              ))}
            </div>
            <div className="erp-add-row">
              <input className="erp-add-inp" value={labInp} onChange={e=>setLabInp(e.target.value)} placeholder="+ Custom lab / test…" onKeyDown={e=>e.key==='Enter'&&addCustomLab()}/>
              <button className="erp-btn-ghost" onClick={addCustomLab}>Add</button>
            </div>
          </div>

          {/* MEDICATIONS */}
          <div className="erp-sec" id="sec-meds">
            <div className="erp-sec-hdr">
              <span style={{fontSize:16}}>💊</span>
              <div><div className="erp-sec-title">Medications</div><div className="erp-sec-sub">Drug · dose · route · frequency · priority</div></div>
              <span className="erp-pill" style={{marginLeft:'auto'}}>{meds.length}</span>
            </div>
            <div className="erp-col-hdr" style={{display:'grid',gridTemplateColumns:'8px 1fr 95px 65px 80px 70px auto',gap:7}}>
              <div/><div>Drug</div><div>Dose</div><div>Route</div><div>Frequency</div><div>Priority</div><div/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {meds.map(m => (
                <div key={m.id} className={`erp-med-row${m.ai ? ' ai-row' : ''}`}>
                  <div className="erp-med-dot"/>
                  <input className="erp-cell-inp" value={m.name} onChange={e=>updMed(m.id,'name',e.target.value)} placeholder="Drug name…"/>
                  <input className="erp-cell-inp" value={m.dose} onChange={e=>updMed(m.id,'dose',e.target.value)} placeholder="500 mg" style={{fontFamily:'monospace',fontSize:11}}/>
                  <select className="erp-cell-sel" value={m.route} onChange={e=>updMed(m.id,'route',e.target.value)}>
                    {['IV','PO','IM','SQ','IN','PR','SL','TD','Inhaled'].map(r=><option key={r}>{r}</option>)}
                  </select>
                  <select className="erp-cell-sel" value={m.freq} onChange={e=>updMed(m.id,'freq',e.target.value)}>
                    {['Once','PRN','q1h','q2h','q4h','q6h','q8h','q12h','Daily','BID','TID','QID','Continuous'].map(f=><option key={f}>{f}</option>)}
                  </select>
                  <select className={`erp-cell-sel ${m.priority==='Stat'?'pri-stat':m.priority==='Urgent'?'pri-urg':'pri-rtn'}`} value={m.priority} onChange={e=>updMed(m.id,'priority',e.target.value)}>
                    {['Stat','Urgent','Routine'].map(p=><option key={p}>{p}</option>)}
                  </select>
                  {m.ai && <span className="erp-ai-tag">AI</span>}
                  <span className="erp-del" onClick={() => setMeds(p=>p.filter(x=>x.id!==m.id))}>×</span>
                </div>
              ))}
            </div>
            <div className="erp-add-row">
              <button className="erp-btn-ghost" style={{flex:1}} onClick={() => setMeds(p=>[...p,{id:uid(),name:'',dose:'',route:'IV',freq:'Once',priority:'Routine',ai:false}])}>+ Add Medication</button>
            </div>
          </div>

          {/* IMAGING */}
          <div className="erp-sec" id="sec-imaging">
            <div className="erp-sec-hdr">
              <span style={{fontSize:16}}>🩻</span>
              <div><div className="erp-sec-title">Imaging Studies</div><div className="erp-sec-sub">CT · X-ray · Ultrasound · MRI</div></div>
              <span className="erp-pill" style={{marginLeft:'auto'}}>{imaging.length}</span>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Quick Select</div>
              <div className="erp-chips">
                {IMG_CHIPS.map(name => (
                  <div key={name} className={`erp-chip${isImgSelected(name) ? ' sel-purple' : ''}`} onClick={() => toggleImgChip(name)}>{name}</div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {imaging.map(i => (
                <div key={i.id} className={`erp-order-row${i.ai ? ' ai-row' : ''}`}>
                  <div className="erp-order-chk on-purple" style={{background:'var(--purple)',borderColor:'var(--purple)',display:'flex',alignItems:'center',justifyContent:'center',color:' #050f1e',fontSize:9,fontWeight:800}}>✓</div>
                  <span className="erp-order-name">{i.name}</span>
                  {i.ai && <span className="erp-ai-tag">AI</span>}
                  <span className="erp-del" onClick={() => setImaging(p=>p.filter(x=>x.id!==i.id))}>×</span>
                </div>
              ))}
            </div>
            <div className="erp-add-row">
              <input className="erp-add-inp" value={imgInp} onChange={e=>setImgInp(e.target.value)} placeholder="+ Custom imaging study…" onKeyDown={e=>e.key==='Enter'&&addCustomImg()}/>
              <button className="erp-btn-ghost" onClick={addCustomImg}>Add</button>
            </div>
          </div>

          {/* IV FLUIDS */}
          <div className="erp-sec" id="sec-ivf">
            <div className="erp-sec-hdr">
              <span style={{fontSize:16}}>💧</span>
              <div><div className="erp-sec-title">IV Fluids & Blood Products</div><div className="erp-sec-sub">Crystalloids · colloids · blood products · vasopressors</div></div>
              <span className="erp-pill" style={{marginLeft:'auto'}}>{ivf.length}</span>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Quick Add</div>
              <div className="erp-chips">
                {IVF_QUICK.map(([name]) => (
                  <div key={name} className="erp-chip" onClick={() => { const found = IVF_QUICK.find(x=>x[0]===name); if(found) setIvf(p=>[...p,{id:uid(),name:found[0],vol:found[1],route:found[2],rate:found[3],ai:false}]); }}>{name.split(' ').slice(0,3).join(' ')}</div>
                ))}
              </div>
            </div>
            <div className="erp-col-hdr" style={{display:'grid',gridTemplateColumns:'8px 1fr 95px 65px 95px auto',gap:7}}>
              <div/><div>Fluid / Product</div><div>Volume</div><div>Route</div><div>Rate / Duration</div><div/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {ivf.map(f => (
                <div key={f.id} className={`erp-ivf-row${f.ai ? ' ai-row' : ''}`}>
                  <div className="erp-ivf-dot"/>
                  <input className="erp-cell-inp" value={f.name} onChange={e=>updIvf(f.id,'name',e.target.value)} placeholder="Fluid / product…"/>
                  <input className="erp-cell-inp" value={f.vol} onChange={e=>updIvf(f.id,'vol',e.target.value)} placeholder="Volume" style={{fontFamily:'monospace',fontSize:11}}/>
                  <select className="erp-cell-sel" value={f.route} onChange={e=>updIvf(f.id,'route',e.target.value)}>
                    {['IV','IO','Central'].map(r=><option key={r}>{r}</option>)}
                  </select>
                  <input className="erp-cell-inp" value={f.rate} onChange={e=>updIvf(f.id,'rate',e.target.value)} placeholder="Rate / duration" style={{fontFamily:'monospace',fontSize:11,color:'var(--txt3)'}}/>
                  {f.ai && <span className="erp-ai-tag">AI</span>}
                  <span className="erp-del" onClick={() => setIvf(p=>p.filter(x=>x.id!==f.id))}>×</span>
                </div>
              ))}
            </div>
            <div className="erp-add-row">
              <button className="erp-btn-ghost" style={{flex:1}} onClick={() => setIvf(p=>[...p,{id:uid(),name:'',vol:'',route:'IV',rate:'',ai:false}])}>+ Add IV Fluid / Blood Product</button>
            </div>
          </div>

          {/* PROCEDURES */}
          <div className="erp-sec" id="sec-procs">
            <div className="erp-sec-hdr">
              <span style={{fontSize:16}}>⚙️</span>
              <div><div className="erp-sec-title">Procedures, EKG & Monitoring</div><div className="erp-sec-sub">Bedside interventions · diagnostic procedures · monitoring</div></div>
              <span className="erp-pill" style={{marginLeft:'auto'}}>{procs.length}</span>
            </div>
            <div className="erp-proc-grid">
              {PROC_CARDS.map(({emoji,name,sub}) => (
                <div key={name} className={`erp-proc-card${isProcOn(name) ? ' on' : ''}`} onClick={() => toggleProc(name)}>
                  <span style={{fontSize:15,flexShrink:0}}>{emoji}</span>
                  <div><div className="erp-proc-name">{name.split('(')[0].trim()}</div><div className="erp-proc-sub">{sub}</div></div>
                </div>
              ))}
            </div>
            {/* AI-added procs not in grid */}
            {procs.filter(p => !PROC_CARDS.some(c => c.name === p.name)).length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:8}}>
                {procs.filter(p => !PROC_CARDS.some(c => c.name === p.name)).map(p => (
                  <div key={p.id} className={`erp-order-row${p.ai ? ' ai-row' : ''}`}>
                    <div className="erp-order-chk on">✓</div>
                    <span className="erp-order-name">{p.name}</span>
                    {p.ai && <span className="erp-ai-tag">AI</span>}
                    <span className="erp-del" onClick={() => setProcs(prev=>prev.filter(x=>x.id!==p.id))}>×</span>
                  </div>
                ))}
              </div>
            )}
            <div className="erp-add-row">
              <input className="erp-add-inp" value={procInp} onChange={e=>setProcInp(e.target.value)} placeholder="+ Custom procedure or intervention…" onKeyDown={e=>e.key==='Enter'&&addCustomProc()}/>
              <button className="erp-btn-ghost" onClick={addCustomProc}>Add</button>
            </div>
          </div>

          {/* CONSULTS */}
          <div className="erp-sec" id="sec-consults">
            <div className="erp-sec-hdr">
              <span style={{fontSize:16}}>👨‍⚕️</span>
              <div><div className="erp-sec-title">Consults & Notifications</div><div className="erp-sec-sub">Specialty consults · admissions · disposition planning</div></div>
              <span className="erp-pill" style={{marginLeft:'auto'}}>{consults.length}</span>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Quick Consult</div>
              <div className="erp-chips">
                {CONSULT_CHIPS.map(([service, urgency]) => (
                  <div key={service} className={`erp-chip${isConSelected(service) ? ' sel-teal' : ''}`} onClick={() => addQuickConsult(service, urgency)}>{service.split(' ')[0]}</div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {consults.map(c => {
                const urgStyle = c.urgency==='Stat' ? {color:'var(--coral)',fontWeight:700} : c.urgency==='Urgent' ? {color:'var(--gold)',fontWeight:600} : {color:'var(--teal)'};
                return (
                  <div key={c.id} className={`erp-con-row${c.ai ? ' ai-row' : ''}`}>
                    <span style={{fontSize:14}}>👨‍⚕️</span>
                    <span className="erp-order-name" style={{fontWeight:600}}>{c.service}</span>
                    <select className="erp-cell-sel" style={{...urgStyle,width:80}} value={c.urgency} onChange={e=>updConsult(c.id,'urgency',e.target.value)}>
                      {['Stat','Urgent','Routine'].map(u=><option key={u}>{u}</option>)}
                    </select>
                    <input className="erp-add-inp" value={c.notes} onChange={e=>updConsult(c.id,'notes',e.target.value)} placeholder="Reason / question for consult…" style={{flex:1,margin:0,borderStyle:'solid'}}/>
                    {c.ai && <span className="erp-ai-tag">AI</span>}
                    <span className="erp-del" onClick={() => setConsults(p=>p.filter(x=>x.id!==c.id))}>×</span>
                  </div>
                );
              })}
            </div>
            <div className="erp-add-row">
              <input className="erp-add-inp" value={conInp} onChange={e=>setConInp(e.target.value)} placeholder="+ Custom consult or service…" onKeyDown={e=>e.key==='Enter'&&addCustomConsult()}/>
              <button className="erp-btn-ghost" onClick={addCustomConsult}>Add</button>
            </div>
          </div>

        </main>

        {/* AI PANEL */}
        <aside className="erp-ai-aside">
          <div className="erp-ai-hdr">
            <div className="erp-ai-hrow">
              <div className="erp-ai-dot"/>
              <div className="erp-ai-title">Notrya AI — Plan Advisor</div>
              <div className="erp-ai-model">GPT-4o</div>
            </div>
            <div className="erp-ai-qbtns">
              {[
                ['🩺 Full Plan','Generate a complete evidence-based ER plan for this presentation with all labs, imaging (apply clinical decision rules), medications with dosing, IV fluids, procedures, and consults.'],
                ['🧪 Labs','What labs are indicated? Apply risk-stratification tools and explain rationale.'],
                ['💊 Medications','Recommend medications with drug name, dose, route, frequency, and priority.'],
                ['🩻 Imaging','What imaging is indicated? Apply Ottawa, NEXUS, PERC, Wells, HEART score, ACR criteria.'],
                ['💧 IV Strategy','What IV fluid strategy is appropriate given the vitals and likely diagnosis?'],
                ['⚠️ Can\'t-Miss DDx','What are the cannot-miss diagnoses? List time-critical ones first.'],
                ['📋 Draft A&P','Write a concise Assessment and Plan section for an EM note.'],
              ].map(([label, q]) => (
                <button key={label} className="erp-ai-qbtn" onClick={() => sendAI(q)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="erp-ai-chat" ref={chatRef}>
            {aiMessages.map((m, i) => (
              <div key={i} className={`erp-ai-msg ${m.role}`} dangerouslySetInnerHTML={{__html: m.text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}/>
            ))}
            {aiLoading && <div className="erp-ai-loading"><div className="erp-ai-tdot"/><div className="erp-ai-tdot"/><div className="erp-ai-tdot"/></div>}
          </div>
          <div className="erp-ai-inp-wrap">
            <input className="erp-ai-inp" value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAI()} placeholder="Ask a clinical question…"/>
            <button className="erp-ai-send" onClick={() => sendAI()}>↑</button>
          </div>
        </aside>

      </div>
      <ClinicalTabBar currentPage="ERPlanBuilder" />
    </div>
  );
}