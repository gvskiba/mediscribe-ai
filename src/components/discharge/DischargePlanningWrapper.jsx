import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const pad = n => String(n).padStart(2, "0");
const nowStr = () => { const d = new Date(); return `${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()}`; };
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

const DISPS = [
  { id:"home",    cls:"active-home",    icon:"🏠", label:"Discharge Home",     sub:"Patient may safely return home",          bannerCls:"disp-banner-home",  bannerText:"Patient discharged home in stable condition.", bannerSub:"Discharge instructions reviewed and signed." },
  { id:"floor",   cls:"active-floor",   icon:"🏥", label:"Admit — Floor",      sub:"General medical/surgical floor",          bannerCls:"disp-banner-admit", bannerText:"Patient admitted to general medical/surgical floor.", bannerSub:"Admitting orders placed. Nursing handoff completed." },
  { id:"telem",   cls:"active-telem",   icon:"📡", label:"Admit — Telemetry",  sub:"Continuous cardiac monitoring",           bannerCls:"disp-banner-telem", bannerText:"Patient admitted to telemetry for continuous cardiac monitoring.", bannerSub:"Cardiac monitoring initiated. Admitting physician notified." },
  { id:"icu",     cls:"active-icu",     icon:"🚨", label:"Admit — ICU",        sub:"Critical care — high acuity",            bannerCls:"disp-banner-icu",   bannerText:"Patient admitted to the ICU for critical care management.", bannerSub:"ICU team bedside. Invasive monitoring initiated." },
  { id:"obs",     cls:"active-obs",     icon:"🔭", label:"Observation",        sub:"Hospital outpatient status <48h",         bannerCls:"disp-banner-obs",   bannerText:"Patient placed in hospital outpatient observation status.", bannerSub:"Observation orders placed. Expected stay < 48 hours." },
  { id:"transfer",cls:"active-tx",      icon:"🚑", label:"Transfer",           sub:"Higher level / specialty facility",       bannerCls:"disp-banner-tx",    bannerText:"Patient transferred to receiving facility.", bannerSub:"Accepting physician confirmed. Transfer paperwork complete." },
  { id:"ama",     cls:"active-ama",     icon:"⚠️", label:"AMA",               sub:"Against Medical Advice",                  bannerCls:"disp-banner-ama",   bannerText:"Patient leaving Against Medical Advice (AMA).", bannerSub:"Risks explained and documented. AMA form signed." },
  { id:"expired", cls:"active-expired", icon:"🕯️", label:"Expired",            sub:"Patient expired in ED",                   bannerCls:"",                  bannerText:"Patient expired in the Emergency Department.", bannerSub:"Time of death documented. Family notified." },
];

const EM_CARDS = [
  { code:"99281", level:"L1", desc:"Self-limited or minor problem. Minimal assessment.", time:"≤ 15 min", badge:"MINIMAL", badgeCls:"em-c-low" },
  { code:"99282", level:"L2", desc:"Low complexity. New or established condition with low risk.", time:"16–25 min", badge:"LOW", badgeCls:"em-c-low" },
  { code:"99283", level:"L3", desc:"Moderate complexity. Multiple presenting problems.", time:"26–35 min", badge:"MODERATE", badgeCls:"em-c-mod" },
  { code:"99284", level:"L4", desc:"High complexity. High risk. Undiagnosed new problem.", time:"36–45 min", badge:"HIGH", badgeCls:"em-c-high" },
  { code:"99285", level:"L5", desc:"High complexity. Immediate threat to life or function.", time:"46–60 min", badge:"HIGHEST", badgeCls:"em-c-crit" },
];

const RETURN_ITEMS = [
  { icon:"🫀", strong:"Chest pain, pressure, or tightness", rest:" that is new, returns, worsens, or radiates to your arm, jaw, neck, or back — call 911 immediately." },
  { icon:"😵", strong:"Sudden severe headache", rest:", face drooping, arm weakness, or difficulty speaking — signs of stroke — call 911 immediately." },
  { icon:"🌬️", strong:"Shortness of breath", rest:" at rest, difficulty breathing, or oxygen level below 94%." },
  { icon:"💓", strong:"Rapid, irregular, or pounding heartbeat", rest:" associated with dizziness, fainting, or near-fainting." },
  { icon:"😰", strong:"Severe sweating, nausea, or vomiting", rest:" with chest discomfort." },
  { icon:"🩸", strong:"Blood sugar < 70 mg/dL", rest:" with symptoms not responding to treatment, or blood sugar > 400 mg/dL." },
  { icon:"😟", strong:"Any other symptom", rest:" that feels severe, sudden, or different from what you usually experience." },
];

const ORGAN_SYSTEMS = ["Cardiovascular","Respiratory","Neurological","Renal","Hepatic","Hematologic","Metabolic / Endocrine","Infectious / Sepsis"];
const ORGAN_ICONS = ["🫀","🫁","🧠","🫘","🟤","🩸","⚗️","🦠"];
const CC_INTERVENTIONS = [
  {label:"Intubation / RSI", full:"Endotracheal Intubation / RSI"},
  {label:"Mechanical Ventilation", full:"Mechanical Ventilation Management"},
  {label:"Vasopressors", full:"Vasopressor Initiation / Titration"},
  {label:"CPR / ACLS", full:"CPR / Advanced Resuscitation"},
  {label:"Central Line", full:"Central Venous Access (CVC)"},
  {label:"Arterial Line", full:"Arterial Line Placement"},
  {label:"Cardioversion", full:"Cardioversion / Defibrillation"},
  {label:"MTP / Blood Products", full:"Massive Transfusion Protocol"},
  {label:"Hemodynamic Monitor", full:"Hemodynamic Monitoring"},
  {label:"Sedation/Analgesia", full:"Sedation / Analgesia Titration"},
  {label:"Chest Tube", full:"Chest Tube Thoracostomy"},
  {label:"POCUS", full:"Point-of-Care Ultrasound (POCUS)"},
];

const CSS = `
.dpw-root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--r:8px;--rl:12px;display:flex;flex-direction:column;height:100%;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;overflow:hidden}
.dpw-root *{box-sizing:border-box}
.dpw-root input,.dpw-root select,.dpw-root textarea{font-family:'DM Sans',sans-serif}
.dpw-subnav{height:42px;background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.dpw-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-.5px}
.dpw-sep{color:var(--txt4)}
.dpw-title{font-size:13px;color:var(--txt2);font-weight:500}
.dpw-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace}
.dpw-snr{margin-left:auto;display:flex;align-items:center;gap:8px}
.dpw-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:var(--r);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;border:none;font-family:'DM Sans',sans-serif}
.dpw-btn-ghost{background:var(--bg-up);border:1px solid var(--border)!important;color:var(--txt2)}.dpw-btn-ghost:hover{border-color:var(--border-hi)!important;color:var(--txt)}
.dpw-btn-gold{background:rgba(245,200,66,.13);border:1px solid rgba(245,200,66,.35)!important;color:var(--gold)}.dpw-btn-gold:hover{background:rgba(245,200,66,.22)}
.dpw-btn-primary{background:var(--teal);color:#050f1e}.dpw-btn-primary:hover{filter:brightness(1.1)}
.dpw-vbar{height:40px;background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;overflow:hidden}
.dpw-vname{font-family:'Playfair Display',serif;font-size:14px;color:var(--txt);font-weight:600;white-space:nowrap}
.dpw-vmeta{font-size:11px;color:var(--txt3);white-space:nowrap}
.dpw-vdiv{width:1px;height:20px;background:var(--border);flex-shrink:0}
.dpw-vital{display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap}
.dpw-vital .lbl{color:var(--txt4);font-size:9px;text-transform:uppercase;letter-spacing:.04em}
.dpw-vital .val{font-family:'JetBrains Mono',monospace;color:var(--txt2);font-weight:600}
.dpw-body{display:flex;flex:1;overflow:hidden}

/* SIDEBAR */
.dpw-sb{flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dpw-sb.open{width:230px}.dpw-sb.collapsed{width:36px}
.dpw-sb-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dpw-sb.collapsed .dpw-sb-tab{display:flex}
.dpw-sb.collapsed .dpw-sb-inner{display:none}
.dpw-sb-tab-label{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none;transition:color .15s}
.dpw-sb-tab:hover .dpw-sb-tab-label{color:var(--teal)}
.dpw-sb-inner{overflow-y:auto;flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:4px;min-width:0}
.dpw-sb-toggle{width:26px;height:26px;border-radius:6px;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:16px;color:var(--txt2);flex-shrink:0;margin-left:auto}
.dpw-sb-toggle:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dpw-sb-label{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:6px;margin-bottom:2px}
.dpw-sb-nav{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2)}
.dpw-sb-nav:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt)}
.dpw-sb-nav.active{background:rgba(0,229,192,.09);border-color:rgba(0,229,192,.3);color:var(--teal)}
.dpw-sb-dot{width:7px;height:7px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0;transition:all .3s}
.dpw-sb-dot.done{background:var(--teal);box-shadow:0 0 6px rgba(0,229,192,.5)}
.dpw-sb-divider{height:1px;background:var(--border);margin:5px 0}
.dpw-sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:10px 12px;margin-bottom:4px}

/* CONTENT */
.dpw-content{flex:1;overflow-y:auto;padding:16px 20px 50px;display:flex;flex-direction:column;gap:16px}
.dpw-content::-webkit-scrollbar{width:4px}.dpw-content::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* AI PANEL */
.dpw-ai{flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1)}
.dpw-ai.open{width:295px}.dpw-ai.collapsed{width:36px}
.dpw-ai-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dpw-ai.collapsed .dpw-ai-tab{display:flex}
.dpw-ai.collapsed .dpw-ai-inner{display:none}
.dpw-ai-tab-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);animation:dpw-pulse 2s infinite;flex-shrink:0}
@keyframes dpw-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
.dpw-ai-tab-label{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none;transition:color .15s}
.dpw-ai-tab:hover .dpw-ai-tab-label{color:var(--teal)}
.dpw-ai-inner{display:flex;flex-direction:column;flex:1;overflow:hidden;min-width:0}
.dpw-ai-toggle{width:26px;height:26px;border-radius:6px;background:var(--bg-up);border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:16px;color:var(--txt2);flex-shrink:0}
.dpw-ai-toggle:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.12)}
.dpw-ai-hdr{padding:11px 13px;border-bottom:1px solid var(--border);flex-shrink:0}
.dpw-ai-hrow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.dpw-ai-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);flex-shrink:0;animation:dpw-pulse 2s infinite}
.dpw-ai-lbl{font-size:12px;font-weight:600;color:var(--txt2);flex:1}
.dpw-ai-model{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3)}
.dpw-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.dpw-ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;transition:all .15s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2)}
.dpw-ai-qbtn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.06)}
.dpw-ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.dpw-ai-msg{padding:9px 11px;border-radius:var(--r);font-size:12px;line-height:1.55}
.dpw-ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border)}
.dpw-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2)}
.dpw-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt)}
.dpw-ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
.dpw-ai-loader span{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:dpw-bounce 1.2s infinite}
.dpw-ai-loader span:nth-child(2){animation-delay:.2s}.dpw-ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes dpw-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.dpw-ai-inp-wrap{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:6px}
.dpw-ai-inp{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-size:12px;outline:none;resize:none}
.dpw-ai-inp:focus{border-color:var(--teal)}
.dpw-ai-send{background:var(--teal);color:#050f1e;border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;font-weight:700}

/* SECTION */
.dpw-sec{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.dpw-sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.dpw-sec-icon{font-size:18px}
.dpw-sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--txt)}
.dpw-sec-sub{font-size:11px;color:var(--txt3);margin-top:1px}

/* FIELDS */
.dpw-field{display:flex;flex-direction:column;gap:4px}
.dpw-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em}
.dpw-input{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-size:13px;outline:none;transition:border-color .15s;width:100%}
.dpw-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.07)}
.dpw-textarea{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:9px 11px;color:var(--txt);font-size:13px;outline:none;resize:vertical;min-height:70px;width:100%;line-height:1.6;transition:border-color .15s}
.dpw-textarea:focus{border-color:var(--blue)}
.dpw-select{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;color:var(--txt);font-size:13px;outline:none;cursor:pointer;width:100%}
.dpw-select:focus{border-color:var(--blue)}
.dpw-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dpw-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}

/* DISPOSITION */
.disp-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
.disp-card{background:var(--bg-card);border:2px solid var(--border);border-radius:14px;padding:14px 8px 12px;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;user-select:none}
.disp-card:hover{border-color:var(--border-hi);background:var(--bg-up);transform:translateY(-1px)}
.disp-emoji{font-size:28px;line-height:1;margin-bottom:2px}
.disp-name{font-size:12px;font-weight:700;color:var(--txt);line-height:1.2;transition:color .18s}
.disp-sub{font-size:10px;color:var(--txt3);line-height:1.3}
.active-home{border-color:var(--teal)!important;background:rgba(0,229,192,.07)!important;box-shadow:0 0 0 1px rgba(0,229,192,.25),0 4px 20px rgba(0,229,192,.15);transform:translateY(-2px)}
.active-home .disp-name{color:var(--teal)!important}
.active-floor{border-color:var(--blue)!important;background:rgba(59,158,255,.07)!important;box-shadow:0 0 0 1px rgba(59,158,255,.25),0 4px 20px rgba(59,158,255,.12);transform:translateY(-2px)}
.active-floor .disp-name{color:var(--blue)!important}
.active-telem{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}.active-telem .disp-name{color:var(--gold)!important}
.active-icu{border-color:var(--coral)!important;background:rgba(255,107,107,.07)!important;transform:translateY(-2px)}.active-icu .disp-name{color:var(--coral)!important}
.active-obs{border-color:var(--purple)!important;background:rgba(155,109,255,.07)!important;transform:translateY(-2px)}.active-obs .disp-name{color:var(--purple)!important}
.active-tx{border-color:var(--orange)!important;background:rgba(255,159,67,.07)!important;transform:translateY(-2px)}.active-tx .disp-name{color:var(--orange)!important}
.active-ama{border-color:var(--gold)!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}.active-ama .disp-name{color:var(--gold)!important}
.active-expired{border-color:var(--txt4)!important;background:rgba(46,74,106,.15)!important;transform:translateY(-2px)}.active-expired .disp-name{color:var(--txt3)!important}
.disp-banner{display:none;align-items:center;gap:12px;padding:11px 16px;border-radius:var(--r);margin-top:12px;border:1px solid;font-size:12px;font-weight:600}
.disp-banner.show{display:flex}
.disp-banner-home{background:rgba(0,229,192,.07);border-color:rgba(0,229,192,.25)!important;color:var(--teal)}
.disp-banner-admit{background:rgba(59,158,255,.07);border-color:rgba(59,158,255,.25)!important;color:var(--blue)}
.disp-banner-icu{background:rgba(255,107,107,.07);border-color:rgba(255,107,107,.25)!important;color:var(--coral)}
.disp-banner-telem{background:rgba(245,200,66,.07);border-color:rgba(245,200,66,.2)!important;color:var(--gold)}
.disp-banner-obs{background:rgba(155,109,255,.07);border-color:rgba(155,109,255,.2)!important;color:var(--purple)}
.disp-banner-tx{background:rgba(255,159,67,.07);border-color:rgba(255,159,67,.2)!important;color:var(--orange)}
.disp-banner-ama{background:rgba(245,200,66,.07);border-color:rgba(245,200,66,.2)!important;color:var(--gold)}

/* E&M */
.em-grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px}
.em-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:13px 15px;cursor:pointer;transition:all .15s;position:relative;overflow:hidden}
.em-card:hover{border-color:var(--border-hi)}
.em-card.em-sel{border-color:var(--blue);background:rgba(59,158,255,.07)}
.em-card.em-sel::after{content:'✓';position:absolute;top:8px;right:10px;color:var(--blue);font-size:14px;font-weight:700}
.em-level{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--txt);line-height:1}
.em-code{font-size:11px;color:var(--txt3);font-family:'JetBrains Mono',monospace;margin-top:2px}
.em-desc{font-size:11px;color:var(--txt2);margin-top:6px;line-height:1.4}
.em-time{font-size:10px;color:var(--txt4);margin-top:4px;font-family:'JetBrains Mono',monospace}
.em-badge{font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;margin-top:5px;display:inline-block}
.em-c-low{background:rgba(0,229,192,.12);color:var(--teal)}.em-c-mod{background:rgba(245,200,66,.12);color:var(--gold)}.em-c-high{background:rgba(255,107,107,.12);color:var(--coral)}.em-c-crit{background:rgba(155,109,255,.12);color:var(--purple)}
.em-mdm-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-up);border-radius:var(--r);margin-bottom:6px}

/* CRITICAL CARE */
.cc-section{display:none;animation:cc-in .35s cubic-bezier(.4,0,.2,1)}
.cc-section.show{display:block}
@keyframes cc-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.cc-header-accent{background:linear-gradient(135deg,rgba(255,107,107,.1),rgba(155,109,255,.06));border:1px solid rgba(255,107,107,.28);border-radius:var(--rl);padding:16px 20px;margin-bottom:14px}
.cc-title-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,107,107,.14);border:1px solid rgba(255,107,107,.35);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--coral);letter-spacing:.05em;text-transform:uppercase}
.cc-time-strip{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px}
.cc-time-label{font-size:9px;color:var(--txt4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.cc-time-val{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--coral);line-height:1}
.cc-time-note{font-size:10px;color:var(--txt3);margin-top:4px}
.cc-section-lbl{font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.organ-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.organ-chip{display:flex;align-items:center;gap:7px;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:8px 11px;cursor:pointer;transition:all .15s;user-select:none}
.organ-chip:hover{border-color:var(--border-hi)}
.organ-chip.active{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.4)}
.organ-check{width:15px;height:15px;border-radius:3px;border:1.5px solid var(--border);background:var(--bg-card);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;transition:all .15s}
.organ-chip.active .organ-check{background:var(--coral);border-color:var(--coral);color:var(--bg)}
.organ-label{font-size:12px;color:var(--txt2);font-weight:500}
.organ-chip.active .organ-label{color:var(--coral);font-weight:600}
.sev-btn{flex:1;min-width:110px;padding:10px 8px;border-radius:var(--r);border:1.5px solid var(--border);background:var(--bg-up);text-align:center;cursor:pointer;transition:all .15s;user-select:none}
.sev-btn:hover{border-color:var(--border-hi)}
.sev-btn.active-imm{border-color:var(--coral);background:rgba(255,107,107,.12)}.sev-btn.active-imm .sev-btn-label{color:var(--coral)}
.sev-btn.active-life{border-color:var(--orange);background:rgba(255,159,67,.10)}.sev-btn.active-life .sev-btn-label{color:var(--orange)}
.sev-btn.active-org{border-color:var(--gold);background:rgba(245,200,66,.10)}.sev-btn.active-org .sev-btn-label{color:var(--gold)}
.sev-btn-label{font-size:11px;font-weight:700}
.sev-btn-sub{font-size:10px;color:var(--txt3);margin-top:2px}
.addon-tracker{display:flex;align-items:center;gap:8px;background:rgba(155,109,255,.08);border:1px solid rgba(155,109,255,.25);border-radius:var(--r);padding:6px 10px;margin-top:4px}
.addon-count{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--purple);min-width:28px;text-align:center}
.addon-ctrl{width:28px;height:28px;border-radius:6px;border:1px solid rgba(155,109,255,.3);background:rgba(155,109,255,.12);color:var(--purple);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.addon-ctrl:hover{background:rgba(155,109,255,.25)}
.attestation-box{background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.2);border-radius:var(--r);padding:12px 14px;font-size:12px;line-height:1.65;color:var(--txt2)}
.cc-ai-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:linear-gradient(135deg,rgba(255,107,107,.18),rgba(155,109,255,.12));border:1px solid rgba(255,107,107,.4);border-radius:var(--r);color:var(--coral);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.cc-ai-btn:hover{box-shadow:0 0 18px rgba(255,107,107,.2);filter:brightness(1.1)}
.cc-ai-btn:disabled{opacity:.5;cursor:not-allowed}

/* ROWS / LISTS */
.dpw-row{display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:10px 13px;margin-bottom:6px;transition:border-color .15s}
.dpw-row:hover{border-color:var(--border-hi)}
.dpw-inp{background:transparent;border:none;outline:none;font-size:12px;color:var(--txt2);flex:1;min-width:0}
.dpw-del{color:var(--txt4);cursor:pointer;font-size:15px;transition:color .15s;padding:0 2px;background:none;border:none}
.dpw-del:hover{color:var(--coral)}
.dpw-add-row{display:flex;gap:6px;align-items:center;margin-top:8px}
.fu-chip{font-size:10px;padding:2px 8px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-weight:600}
.fu-urgent{background:rgba(255,107,107,.15);color:var(--coral)}.fu-routine{background:rgba(0,229,192,.12);color:var(--teal)}

/* RETURN */
.return-card{background:rgba(255,107,107,.05);border:1px solid rgba(255,107,107,.22);border-radius:var(--r);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;transition:all .15s}
.return-card:hover{background:rgba(255,107,107,.09);border-color:rgba(255,107,107,.35)}

/* SIG */
.dpw-sig{background:linear-gradient(135deg,rgba(0,229,192,.06),rgba(59,158,255,.04));border:1px solid rgba(0,229,192,.2);border-radius:var(--rl);padding:18px 20px}
.dpw-sig-line{height:1px;background:rgba(0,229,192,.2);margin:12px 0}

/* INSTR */
.instr-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;margin-bottom:10px}
.instr-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid var(--border)}

/* BADGE */
.dpw-bdg{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;display:inline-block}
.dpw-bdg-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.dpw-bdg-blue{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}
.dpw-bdg-gold{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}
.dpw-bdg-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3)}
.dpw-bdg-purple{background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3)}

/* SPIN */
.dpw-spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(0,229,192,.2);border-top-color:var(--teal);border-radius:50%;animation:dpw-spinr .6s linear infinite}
@keyframes dpw-spinr{to{transform:rotate(360deg)}}

/* SHIMMER */
.shimmer{background:linear-gradient(90deg,var(--bg-up) 25%,rgba(0,229,192,.06) 50%,var(--bg-up) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;

export default function DischargePlanningWrapper({ patientName = "New Patient", patientDob = "", patientId = "", medications = [], allergies = [] }) {
  const [sbOpen, setSbOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [dots, setDots] = useState({});
  const [dcStatus, setDcStatus] = useState("DRAFT");
  const [saving, setSaving] = useState(false);

  // Disposition
  const [disp, setDispId] = useState(null);
  const [admitService, setAdmitService] = useState("");
  const [admitMD, setAdmitMD] = useState("");
  const [admitBed, setAdmitBed] = useState("");
  const [txFacility, setTxFacility] = useState("");
  const [txReason, setTxReason] = useState("");
  const [txMD, setTxMD] = useState("");
  const [txMode, setTxMode] = useState("ALS Ambulance");

  // E&M
  const [emCode, setEmCode] = useState(null);
  const [mdmProblems, setMdmProblems] = useState("");
  const [mdmData, setMdmData] = useState("");
  const [mdmRisk, setMdmRisk] = useState("");
  const [mdmNarrative, setMdmNarrative] = useState("");
  const [emTime, setEmTime] = useState("");
  const [emFaceTime, setEmFaceTime] = useState("");
  const [emProcCpt, setEmProcCpt] = useState("");

  // Critical Care
  const [ccStart, setCcStart] = useState("");
  const [ccEnd, setCcEnd] = useState("");
  const [ccTotal, setCcTotal] = useState("—");
  const [addonCount, setAddonCount] = useState(0);
  const [ccSeverity, setCcSeverity] = useState("");
  const [ccCondition, setCcCondition] = useState("");
  const [ccOrgans, setCcOrgans] = useState([]);
  const [ccInterventions, setCcInterventions] = useState([]);
  const [ccBp, setCcBp] = useState(""); const [ccHr, setCcHr] = useState(""); const [ccRr, setCcRr] = useState("");
  const [ccSpo2, setCcSpo2] = useState(""); const [ccTemp, setCcTemp] = useState(""); const [ccGcs, setCcGcs] = useState(""); const [ccMap, setCcMap] = useState("");
  const [ccIntText, setCcIntText] = useState(""); const [ccLabs, setCcLabs] = useState(""); const [ccResponse, setCcResponse] = useState("");
  const [ccConsults, setCcConsults] = useState(""); const [ccDispo, setCcDispo] = useState(""); const [ccImpression, setCcImpression] = useState("");
  const [ccSig, setCcSig] = useState(""); const [ccSigDt, setCcSigDt] = useState("");
  const [generatingCC, setGeneratingCC] = useState(false);

  // Diagnoses
  const [dxList, setDxList] = useState([
    { id: 1, code: "R07.9", name: "Chest pain, unspecified", primary: true },
    { id: 2, code: "I10", name: "Essential hypertension", primary: false },
  ]);
  const [newDxCode, setNewDxCode] = useState("");
  const [newDxName, setNewDxName] = useState("");

  // Instructions
  const [instrGenerated, setInstrGenerated] = useState(false);
  const [generatingInstr, setGeneratingInstr] = useState(false);
  const [instrDiag, setInstrDiag] = useState("");
  const [instrTreat, setInstrTreat] = useState("");
  const [instrMeds, setInstrMeds] = useState("");
  const [instrAct, setInstrAct] = useState("");
  const [instrMisc, setInstrMisc] = useState("");

  // Return precautions
  const [returnCustom, setReturnCustom] = useState("");

  // Follow-up
  const [fuList, setFuList] = useState([
    { id: 1, icon: "🫀", specialty: "Cardiology", note: "Within 1–2 weeks — stress test or outpatient evaluation", urgency: "Urgent" },
    { id: 2, icon: "🩺", specialty: "Primary Care Physician (PCP)", note: "Within 3–5 days — blood pressure check and medication review", urgency: "Routine" },
  ]);
  const [newFu, setNewFu] = useState("");
  const [newFuUrg, setNewFuUrg] = useState("Routine");
  const [fuPending, setFuPending] = useState("");
  const [fuPcp, setFuPcp] = useState("");

  // Discharge Rx
  const [dcRxList, setDcRxList] = useState(() =>
    medications.length
      ? medications.map((m, i) => ({ id: `m${i}`, drug: m, sig: "Continue as prescribed", type: "CONTINUE" }))
      : [
          { id: "r1", drug: "Aspirin 81mg", sig: "Take 1 tablet by mouth once daily", type: "CONTINUE" },
          { id: "r2", drug: "Nitroglycerin 0.4mg SL", sig: "Place 1 tablet under tongue every 5 min up to 3 times for chest pain.", type: "NEW" },
        ]
  );
  const [newRxDrug, setNewRxDrug] = useState("");
  const [newRxSig, setNewRxSig] = useState("");
  const [newRxType, setNewRxType] = useState("NEW");

  // Signature
  const [sigDate, setSigDate] = useState(nowStr());
  const [sigTime, setSigTime] = useState(nowTime());
  const [sigPt, setSigPt] = useState("");
  const [sigRel, setSigRel] = useState("");
  const [sigRN, setSigRN] = useState("");
  const [sigNote, setSigNote] = useState("");

  // AI
  const [aiMsgs, setAiMsgs] = useState([{ role: "sys", text: "Notrya AI Discharge Advisor ready. Select disposition to begin, then use quick actions to auto-generate instructions, E&M level, and return precautions." }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiMsgsRef = useRef(null);

  useEffect(() => { if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight; }, [aiMsgs, aiLoading]);

  const setDot = useCallback((id, done) => setDots(p => ({ ...p, [id]: done })), []);
  const appendMsg = useCallback((role, text) => setAiMsgs(p => [...p, { role, text }]), []);

  const buildCtx = () =>
    `Patient: ${patientName} | MRN: ${patientId || "—"} | DOB: ${patientDob || "—"} | Allergies: ${allergies.join(", ") || "NKDA"} | Meds: ${medications.join(", ") || "See list"} | Disposition: ${disp || "Not set"} | E&M: ${emCode || "Not selected"}`;

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput("");
    appendMsg("user", question);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an expert emergency medicine physician. Help complete discharge documentation. Be concise. Context: ${buildCtx()}\n\nQuestion: ${question}`,
      });
      appendMsg("bot", typeof res === "string" ? res : JSON.stringify(res));
    } catch { appendMsg("sys", "⚠ Connection error. Please try again."); }
    setAiLoading(false);
  };

  const generateInstructions = async () => {
    setGeneratingInstr(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate discharge instructions for: ${patientName}, Allergies: ${allergies.join(",") || "NKDA"}, Meds: ${dcRxList.map(r => r.drug).join(", ")}. Return JSON with keys: diagnosis, treatment, medications, activity, additional. Write at 6th grade reading level.`,
        response_json_schema: { type: "object", properties: { diagnosis: { type: "string" }, treatment: { type: "string" }, medications: { type: "string" }, activity: { type: "string" }, additional: { type: "string" } } }
      });
      if (res.diagnosis) setInstrDiag(res.diagnosis);
      if (res.treatment) setInstrTreat(res.treatment);
      if (res.medications) setInstrMeds(res.medications);
      if (res.activity) setInstrAct(res.activity);
      if (res.additional) setInstrMisc(res.additional);
      setInstrGenerated(true);
      setDot("instr", true);
      appendMsg("bot", "✅ Discharge instructions generated. Review each section and edit as needed.");
    } catch { appendMsg("sys", "⚠ Generation failed. Please try again."); }
    setGeneratingInstr(false);
  };

  const generateCCNote = async () => {
    setGeneratingCC(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a critical care note for this patient. Context: ${buildCtx()}. Organs involved: ${ccOrgans.join(", ") || "not specified"}. Interventions: ${ccInterventions.join(", ") || "not specified"}. Return JSON with keys: condition, impression, interventions_text, labs_text, response_text, consults_text.`,
        response_json_schema: { type: "object", properties: { condition: { type: "string" }, impression: { type: "string" }, interventions_text: { type: "string" }, labs_text: { type: "string" }, response_text: { type: "string" }, consults_text: { type: "string" } } }
      });
      if (res.condition) setCcCondition(res.condition);
      if (res.impression) setCcImpression(res.impression);
      if (res.interventions_text) setCcIntText(res.interventions_text);
      if (res.labs_text) setCcLabs(res.labs_text);
      if (res.response_text) setCcResponse(res.response_text);
      if (res.consults_text) setCcConsults(res.consults_text);
      appendMsg("bot", "✅ Critical care note generated. Review and edit as needed.");
    } catch { appendMsg("sys", "⚠ Generation failed."); }
    setGeneratingCC(false);
  };

  const calcCCTime = (start, end) => {
    if (!start || !end) { setCcTotal("—"); return; }
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) { setCcTotal("—"); return; }
    setCcTotal(`${diff} min`);
  };

  const finalizeDischarge = async () => {
    if (!disp) { appendMsg("sys", "⚠ Please select a disposition before finalizing."); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setDcStatus("SIGNED");
    ["disp","em","dx","instr","ret","fu","rx","sig"].forEach(s => setDot(s, true));
    appendMsg("bot", `✅ Discharge summary signed and finalized for ${patientName}.\n\nDisposition: ${disp} · E&M: ${emCode || "Not selected"}\n\nDischarge papers are ready to print.`);
    setSaving(false);
  };

  const addDx = () => {
    if (!newDxName.trim()) return;
    setDxList(p => [...p, { id: Date.now(), code: newDxCode, name: newDxName, primary: false }]);
    setNewDxCode(""); setNewDxName(""); setDot("dx", true);
  };
  const addFu = () => {
    if (!newFu.trim()) return;
    const icons = { cardio: "🫀", cardiac: "🫀", pcp: "🩺", primary: "🩺", neuro: "🧠", ortho: "🦴", pulm: "🫁" };
    const em = Object.entries(icons).find(([k]) => newFu.toLowerCase().includes(k))?.[1] || "📅";
    setFuList(p => [...p, { id: Date.now(), icon: em, specialty: newFu, note: "", urgency: newFuUrg }]);
    setNewFu(""); setDot("fu", true);
  };
  const addDcRx = () => {
    if (!newRxDrug.trim()) return;
    setDcRxList(p => [...p, { id: Date.now(), drug: newRxDrug, sig: newRxSig, type: newRxType }]);
    setNewRxDrug(""); setNewRxSig(""); setDot("rx", true);
  };
  const toggleOrgan = (name, list, setList) => setList(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);

  const scrollTo = id => document.getElementById(`dpw-sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const typeColor = { NEW: "#9b6dff", CONTINUE: "#3b9eff", CHANGED: "#f5c842", STOP: "#ff6b6b" };
  const typeIcon = { NEW: "🆕", CONTINUE: "🔵", CHANGED: "🔄", STOP: "❌" };
  const selDispObj = DISPS.find(d => d.id === disp);
  const isCritical = emCode === "99291" || emCode === "99291-25";

  const NAV_SECTIONS = [
    { id: "disp", icon: "🚪", label: "Disposition" },
    { id: "em", icon: "🧮", label: "E&M Coding" },
    { id: "dx", icon: "📋", label: "Diagnoses" },
    { id: "instr", icon: "📄", label: "DC Instructions" },
    { id: "ret", icon: "🚨", label: "Return Precautions" },
    { id: "fu", icon: "📅", label: "Follow-Up" },
    { id: "rx", icon: "💊", label: "Discharge Meds" },
    { id: "sig", icon: "✍", label: "Sign & Finalize" },
  ];

  return (
    <div className="dpw-root">
      <style>{CSS}</style>

      {/* SUB-NAVBAR */}
      <div className="dpw-subnav">
        <span className="dpw-logo">notrya</span>
        <span className="dpw-sep">|</span>
        <span className="dpw-title">Discharge Summary</span>
        <span className={`dpw-bdg ${dcStatus === "SIGNED" ? "dpw-bdg-teal" : "dpw-bdg-gold"}`}>{dcStatus}</span>
        <div className="dpw-snr">
          <button className="dpw-btn dpw-btn-ghost" onClick={() => window.print()}>🖨 Print</button>
          <button className="dpw-btn dpw-btn-ghost" onClick={() => sendAI("Generate a complete patient-friendly discharge letter.")}>📄 Patient Letter</button>
          <button className="dpw-btn dpw-btn-gold" onClick={() => sendAI("Suggest the optimal E&M level for this visit using 2021 AMA guidelines.")}>🧮 Suggest E&M</button>
          <button className="dpw-btn dpw-btn-primary" onClick={finalizeDischarge} disabled={saving}>
            {saving ? <><span className="dpw-spin" /> Signing…</> : "✍ Finalize & Sign"}
          </button>
        </div>
      </div>

      {/* VITALS BAR */}
      <div className="dpw-vbar">
        <span className="dpw-vname">{patientName}</span>
        {patientDob && <span className="dpw-vmeta">DOB {patientDob}</span>}
        {patientId && <><div className="dpw-vdiv" /><div className="dpw-vital"><span className="lbl">MRN</span><span className="val">{patientId}</span></div></>}
        {allergies.length > 0 && <><div className="dpw-vdiv" /><div className="dpw-vital"><span className="lbl">Allergies</span><span className="val" style={{ color: "var(--coral)" }}>{allergies.slice(0, 2).join(", ")}</span></div></>}
        <div style={{ marginLeft: "auto" }}><span className={`dpw-bdg ${dcStatus === "SIGNED" ? "dpw-bdg-teal" : "dpw-bdg-gold"}`}>{dcStatus}</span></div>
      </div>

      <div className="dpw-body">

        {/* SIDEBAR */}
        <aside className={`dpw-sb ${sbOpen ? "open" : "collapsed"}`}>
          <div className="dpw-sb-tab" onClick={() => setSbOpen(true)} title="Expand sidebar">
            <span style={{ fontSize: 15, color: "var(--txt4)" }}>☰</span>
            <span className="dpw-sb-tab-label">Discharge Summary</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--teal)", marginTop: 6, lineHeight: 1 }}>›</span>
          </div>
          <div className="dpw-sb-inner">
            <div className="dpw-sb-card" style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "var(--txt)" }}>{patientName}</div>
                  <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 3 }}>{patientId ? `MRN ${patientId}` : "New Patient"}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {disp && <span className="dpw-bdg dpw-bdg-teal" style={{ fontSize: 9.5 }}>{disp}</span>}
                  </div>
                </div>
                <div className="dpw-sb-toggle" onClick={() => setSbOpen(false)} title="Collapse sidebar">‹</div>
              </div>
            </div>

            <div className="dpw-sb-label">Sections</div>
            {NAV_SECTIONS.map(s => (
              <div key={s.id} className="dpw-sb-nav" onClick={() => scrollTo(s.id)}>
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{s.icon}</span>{s.label}
                <span className={`dpw-sb-dot${dots[s.id] ? " done" : ""}`} />
              </div>
            ))}
            <div className="dpw-sb-divider" />
            <div className="dpw-sb-label">Visit Summary</div>
            <div className="dpw-sb-card" style={{ marginBottom: 0 }}>
              {[["Disposition", disp || "—", "var(--teal)"], ["E&M Level", emCode || "—", "var(--blue)"], ["Diagnoses", String(dxList.length), "var(--txt2)"], ["Follow-Ups", String(fuList.length), "var(--gold)"], ["DC Meds", String(dcRxList.length), "var(--purple)"], ["Status", dcStatus, "var(--teal)"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--txt3)" }}>{l}</span>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="dpw-content">

          {/* 1. DISPOSITION */}
          <div className="dpw-sec" id="dpw-sec-disp">
            <div className="dpw-sec-hdr">
              <span className="dpw-sec-icon">🚪</span>
              <div><div className="dpw-sec-title">Select Disposition</div><div className="dpw-sec-sub">Patient's final disposition from the Emergency Department</div></div>
            </div>
            <div style={{ fontSize: 11, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12, fontWeight: 600 }}>SELECT DISPOSITION</div>
            <div className="disp-grid">
              {DISPS.map(d => (
                <div key={d.id} className={`disp-card${disp === d.id ? " " + d.cls : ""}`} onClick={() => { setDispId(d.id); setDot("disp", true); }}>
                  <span className="disp-emoji">{d.icon}</span>
                  <div className="disp-name">{d.label}</div>
                  <div className="disp-sub">{d.sub}</div>
                </div>
              ))}
            </div>
            {selDispObj && (
              <div className={`disp-banner show ${selDispObj.bannerCls}`}>
                <span style={{ fontSize: 20 }}>{selDispObj.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{selDispObj.bannerText}</div>
                  <div style={{ opacity: .8, fontSize: 11, marginTop: 2 }}>{selDispObj.bannerSub}</div>
                </div>
                <button style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--txt4)", cursor: "pointer", fontSize: 16 }} onClick={() => setDispId(null)}>✕</button>
              </div>
            )}
            {disp && ["floor", "telem", "icu", "obs"].includes(disp) && (
              <div className="dpw-g3" style={{ marginTop: 14 }}>
                <div className="dpw-field"><label className="dpw-label">Admitting Service</label><input className="dpw-input" value={admitService} onChange={e => setAdmitService(e.target.value)} placeholder="e.g. Cardiology…" /></div>
                <div className="dpw-field"><label className="dpw-label">Admitting Physician</label><input className="dpw-input" value={admitMD} onChange={e => setAdmitMD(e.target.value)} placeholder="Dr. Name" /></div>
                <div className="dpw-field"><label className="dpw-label">Bed / Unit</label><input className="dpw-input" value={admitBed} onChange={e => setAdmitBed(e.target.value)} placeholder="e.g. 4W-412" /></div>
              </div>
            )}
            {disp === "transfer" && (
              <div className="dpw-g2" style={{ marginTop: 14 }}>
                <div className="dpw-field"><label className="dpw-label">Receiving Facility</label><input className="dpw-input" value={txFacility} onChange={e => setTxFacility(e.target.value)} placeholder="Facility name…" /></div>
                <div className="dpw-field"><label className="dpw-label">Reason for Transfer</label><input className="dpw-input" value={txReason} onChange={e => setTxReason(e.target.value)} placeholder="Higher level of care…" /></div>
                <div className="dpw-field"><label className="dpw-label">Accepting Physician</label><input className="dpw-input" value={txMD} onChange={e => setTxMD(e.target.value)} placeholder="Dr. Name" /></div>
                <div className="dpw-field"><label className="dpw-label">Transport Mode</label>
                  <select className="dpw-select" value={txMode} onChange={e => setTxMode(e.target.value)}>
                    {["ALS Ambulance", "BLS Ambulance", "Air Transport", "Private Vehicle"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. E&M CODING */}
          <div className="dpw-sec" id="dpw-sec-em">
            <div className="dpw-sec-hdr">
              <span className="dpw-sec-icon">🧮</span>
              <div><div className="dpw-sec-title">Evaluation & Management (E&M) Coding</div><div className="dpw-sec-sub">Select appropriate level · 2021 AMA guidelines</div></div>
              <button className="dpw-btn dpw-btn-ghost" style={{ marginLeft: "auto" }} onClick={() => sendAI("Suggest the most appropriate E&M level using 2021 AMA guidelines.")}>✨ AI Suggest Level</button>
            </div>
            <div className="em-grid5">
              {EM_CARDS.map(e => (
                <div key={e.code} className={`em-card${emCode === e.code ? " em-sel" : ""}`} onClick={() => { setEmCode(e.code); setDot("em", true); }}>
                  <div className="em-level">{e.level}</div>
                  <div className="em-code">{e.code}</div>
                  <div className="em-desc">{e.desc}</div>
                  <div className="em-time">{e.time}</div>
                  <span className={`em-badge ${e.badgeCls}`}>{e.badge}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { code: "99291", level: "Critical", color: "var(--coral)", desc: "Critical care, first 30–74 min.", time: "30–74 min (+99292/30min)", badge: "CRITICAL CARE", badgeCls: "em-c-crit" },
                { code: "99285-25", level: "L5 + Proc", color: "var(--purple)", desc: "Level 5 with significant separately identifiable procedure.", time: "Modifier -25 required", badge: "HIGHEST + PROC", badgeCls: "em-c-crit" },
              ].map(e => (
                <div key={e.code} className={`em-card${emCode === e.code ? " em-sel" : ""}`} onClick={() => { setEmCode(e.code); setDot("em", true); }}>
                  <div className="em-level" style={{ color: e.color }}>{e.level}</div>
                  <div className="em-code">{e.code}</div>
                  <div className="em-desc">{e.desc}</div>
                  <div className="em-time">{e.time}</div>
                  <span className={`em-badge ${e.badgeCls}`}>{e.badge}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9.5, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 800, marginBottom: 8 }}>Medical Decision Making (MDM)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Number & Complexity of Problems", val: mdmProblems, set: setMdmProblems, opts: ["1 self-limited / minor problem", "1 stable chronic illness", "2+ stable chronic illnesses", "1 undiagnosed new problem with uncertain prognosis", "1 acute illness with systemic symptoms", "1 acute or chronic illness with threat to life or bodily function"] },
                { label: "Amount & Complexity of Data Reviewed", val: mdmData, set: setMdmData, opts: ["Minimal / none", "Limited — order/review test(s), external notes", "Moderate — independent interpretation of results", "Extensive — independent interpretation + discussion with specialist"] },
                { label: "Risk of Complications / Morbidity or Mortality", val: mdmRisk, set: setMdmRisk, opts: ["Minimal — OTC medications, minor surgery", "Low — Rx drug mgmt, procedure with no identified risk", "Moderate — Prescription drug mgmt, minor surgery with identified risk", "High — Drug therapy requiring intensive monitoring, elective major surgery"] },
              ].map(({ label, val, set, opts }) => (
                <div key={label} className="em-mdm-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--txt2)", marginBottom: 6 }}>{label}</div>
                    <select className="dpw-select" value={val} onChange={e => set(e.target.value)}>
                      <option value="">— Select —</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <div className="dpw-field"><label className="dpw-label">MDM Narrative</label><textarea className="dpw-textarea" rows={3} value={mdmNarrative} onChange={e => setMdmNarrative(e.target.value)} placeholder="Document clinical decision-making rationale…" /></div>
              <div className="dpw-g3">
                <div className="dpw-field"><label className="dpw-label">Total Encounter Time</label><input className="dpw-input" value={emTime} onChange={e => setEmTime(e.target.value)} placeholder="e.g. 45 min" /></div>
                <div className="dpw-field"><label className="dpw-label">Provider Time (face-to-face)</label><input className="dpw-input" value={emFaceTime} onChange={e => setEmFaceTime(e.target.value)} placeholder="e.g. 30 min" /></div>
                <div className="dpw-field"><label className="dpw-label">Procedure CPT (if any)</label><input className="dpw-input" value={emProcCpt} onChange={e => setEmProcCpt(e.target.value)} placeholder="e.g. 93010 EKG" /></div>
              </div>
            </div>
          </div>

          {/* CRITICAL CARE NOTE */}
          <div className={`dpw-sec cc-section${isCritical ? " show" : ""}`} id="dpw-sec-critical">
            <div className="cc-header-accent">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 22 }}>🚨</span>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--txt)" }}>Critical Care Note</div>
                    <span className="cc-title-badge">CPT 99291</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--txt3)" }}>Document critical care time, organ systems, interventions, and attestation for billing compliance.</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <button className="cc-ai-btn" onClick={generateCCNote} disabled={generatingCC}>
                    {generatingCC ? <><span className="dpw-spin" /> Generating…</> : "✨ AI Generate Note"}
                  </button>
                </div>
              </div>
              <div className="cc-time-strip">
                <div>
                  <div className="cc-time-label">CC Start Time</div>
                  <input type="time" className="dpw-input" style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--coral)", fontSize: 14, fontWeight: 700 }} value={ccStart} onChange={e => { setCcStart(e.target.value); calcCCTime(e.target.value, ccEnd); }} />
                  <div className="cc-time-note">Time at bedside</div>
                </div>
                <div>
                  <div className="cc-time-label">CC End Time</div>
                  <input type="time" className="dpw-input" style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--coral)", fontSize: 14, fontWeight: 700 }} value={ccEnd} onChange={e => { setCcEnd(e.target.value); calcCCTime(ccStart, e.target.value); }} />
                  <div className="cc-time-note">Time left bedside</div>
                </div>
                <div>
                  <div className="cc-time-label">Total CC Time</div>
                  <div className="cc-time-val">{ccTotal}</div>
                  <div className="cc-time-note">Must be ≥ 30 min for 99291</div>
                </div>
                <div>
                  <div className="cc-time-label">99292 Add-On Units</div>
                  <div className="addon-tracker">
                    <button className="addon-ctrl" onClick={() => setAddonCount(c => Math.max(0, c - 1))}>−</button>
                    <div className="addon-count">{addonCount}</div>
                    <button className="addon-ctrl" onClick={() => setAddonCount(c => c + 1)}>+</button>
                    <div style={{ fontSize: 10, color: "var(--txt3)" }}><strong style={{ color: "var(--purple)" }}>×30 min</strong><br />each</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="cc-section-lbl"><span>⚕️</span>Critical Condition — Nature & Severity</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {[{ cls: "active-imm", label: "Immediately Life-Threatening", sub: "Imminent risk of death without intervention" },
                  { cls: "active-life", label: "Life-Threatening Condition", sub: "High probability of deterioration" },
                  { cls: "active-org", label: "Threat to Organ Function", sub: "Risk of significant organ dysfunction" }
                ].map(s => (
                  <div key={s.cls} className={`sev-btn${ccSeverity === s.cls ? " " + s.cls : ""}`} style={{ flex: 1, minWidth: 110 }} onClick={() => setCcSeverity(p => p === s.cls ? "" : s.cls)}>
                    <div className="sev-btn-label">{s.label}</div>
                    <div className="sev-btn-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
              <textarea className="dpw-textarea" style={{ minHeight: 72 }} value={ccCondition} onChange={e => setCcCondition(e.target.value)} placeholder="Describe the critical condition, acuity, clinical findings supporting critical illness…" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="cc-section-lbl"><span>🫀</span>Organ Systems Involved</div>
              <div className="organ-grid">
                {ORGAN_SYSTEMS.map((organ, i) => (
                  <div key={organ} className={`organ-chip${ccOrgans.includes(organ) ? " active" : ""}`} onClick={() => toggleOrgan(organ, ccOrgans, setCcOrgans)}>
                    <div className="organ-check">{ccOrgans.includes(organ) ? "✓" : ""}</div>
                    <span className="organ-label">{ORGAN_ICONS[i]} {organ}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="cc-section-lbl"><span>📊</span>Vitals at Time of Critical Care</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
                {[["BP", ccBp, setCcBp, "82/50"], ["HR", ccHr, setCcHr, "128"], ["RR", ccRr, setCcRr, "28"], ["SpO₂", ccSpo2, setCcSpo2, "86%"], ["Temp", ccTemp, setCcTemp, "103.4°F"], ["GCS", ccGcs, setCcGcs, "8"], ["MAP", ccMap, setCcMap, "54"]].map(([lbl, val, set, ph]) => (
                  <div key={lbl} className="dpw-field"><label className="dpw-label">{lbl}</label><input className="dpw-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} value={val} onChange={e => set(e.target.value)} placeholder={ph} /></div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="cc-section-lbl"><span>⚙️</span>Interventions During Critical Care</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 10 }}>
                {CC_INTERVENTIONS.map(({ label, full }) => (
                  <div key={full} className={`organ-chip${ccInterventions.includes(full) ? " active" : ""}`} onClick={() => toggleOrgan(full, ccInterventions, setCcInterventions)}>
                    <div className="organ-check">{ccInterventions.includes(full) ? "✓" : ""}</div>
                    <span className="organ-label" style={{ fontSize: 11 }}>{label}</span>
                  </div>
                ))}
              </div>
              <textarea className="dpw-textarea" style={{ minHeight: 64 }} value={ccIntText} onChange={e => setCcIntText(e.target.value)} placeholder="Describe additional interventions, timing, patient response, and reasoning…" />
            </div>

            <div className="dpw-g2" style={{ marginBottom: 14 }}>
              <div className="dpw-field"><label className="dpw-label" style={{ marginBottom: 6 }}>🔬 Diagnostic Results Reviewed</label><textarea className="dpw-textarea" style={{ minHeight: 80 }} value={ccLabs} onChange={e => setCcLabs(e.target.value)} placeholder="Labs, imaging, ECG findings reviewed during CC time…" /></div>
              <div className="dpw-field"><label className="dpw-label" style={{ marginBottom: 6 }}>📈 Response to Treatment</label><textarea className="dpw-textarea" style={{ minHeight: 80 }} value={ccResponse} onChange={e => setCcResponse(e.target.value)} placeholder="Patient response to interventions, hemodynamic trends…" /></div>
              <div className="dpw-field"><label className="dpw-label" style={{ marginBottom: 6 }}>💬 Communication & Consultations</label><textarea className="dpw-textarea" style={{ minHeight: 70 }} value={ccConsults} onChange={e => setCcConsults(e.target.value)} placeholder="Specialist consultations, family discussions, code status…" /></div>
              <div className="dpw-field"><label className="dpw-label" style={{ marginBottom: 6 }}>🏥 Disposition Decision</label><textarea className="dpw-textarea" style={{ minHeight: 70 }} value={ccDispo} onChange={e => setCcDispo(e.target.value)} placeholder="Disposition plan determined during CC care…" /></div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="cc-section-lbl"><span>📋</span>Clinical Impression & Assessment</div>
              <textarea className="dpw-textarea" style={{ minHeight: 90 }} value={ccImpression} onChange={e => setCcImpression(e.target.value)} placeholder="Critical care clinical impression: summary of presenting illness, working diagnosis, acuity justification, management plan…" />
            </div>

            <div className="attestation-box">
              <strong style={{ color: "var(--teal)" }}>Physician Attestation:</strong> I personally provided direct, face-to-face critical care to this patient for the time documented above. The patient's condition was of high complexity requiring constant physician attendance.
              <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center" }}>
                <div className="dpw-field" style={{ flex: 1 }}><label className="dpw-label">Physician Signature</label><input className="dpw-input" value={ccSig} onChange={e => setCcSig(e.target.value)} placeholder="Dr. Name, MD" /></div>
                <div className="dpw-field" style={{ width: 180 }}><label className="dpw-label">Date / Time</label><input className="dpw-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} value={ccSigDt} onChange={e => setCcSigDt(e.target.value)} placeholder="MM/DD/YYYY HH:MM" /></div>
              </div>
            </div>
          </div>

          {/* 3. DIAGNOSES */}
          <div className="dpw-sec" id="dpw-sec-dx">
            <div className="dpw-sec-hdr">
              <span className="dpw-sec-icon">📋</span>
              <div><div className="dpw-sec-title">Discharge Diagnoses</div><div className="dpw-sec-sub">Primary and secondary diagnoses with ICD-10 codes</div></div>
              <button className="dpw-btn dpw-btn-ghost" style={{ marginLeft: "auto" }} onClick={() => sendAI("Suggest appropriate ICD-10 codes for the discharge diagnoses.")}>✨ AI Code</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dxList.map((dx, i) => (
                <div key={dx.id} className="dpw-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: dx.primary ? "var(--teal)" : "var(--txt3)", minWidth: 26, fontFamily: "'JetBrains Mono',monospace" }}>{dx.primary ? "1°" : `${i + 1}°`}</span>
                  <input className="dpw-inp" style={{ maxWidth: 80, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--blue)" }} value={dx.code} onChange={e => setDxList(p => p.map(d => d.id === dx.id ? { ...d, code: e.target.value } : d))} placeholder="ICD-10" />
                  <input className="dpw-inp" style={{ flex: 1 }} value={dx.name} onChange={e => setDxList(p => p.map(d => d.id === dx.id ? { ...d, name: e.target.value } : d))} placeholder="Diagnosis name…" />
                  <span className={`dpw-bdg ${dx.primary ? "dpw-bdg-coral" : "dpw-bdg-teal"}`} style={{ fontSize: 9 }}>{dx.primary ? "PRIMARY" : "SECONDARY"}</span>
                  {!dx.primary && <button className="dpw-del" onClick={() => setDxList(p => p.filter(d => d.id !== dx.id))}>×</button>}
                </div>
              ))}
            </div>
            <div className="dpw-add-row">
              <input className="dpw-input" style={{ width: 90, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} value={newDxCode} onChange={e => setNewDxCode(e.target.value)} placeholder="ICD-10" />
              <input className="dpw-input" style={{ flex: 1 }} value={newDxName} onChange={e => setNewDxName(e.target.value)} onKeyDown={e => e.key === "Enter" && addDx()} placeholder="+ Add diagnosis…" />
              <button className="dpw-btn dpw-btn-ghost" onClick={addDx}>Add</button>
            </div>
          </div>

          {/* 4. DISCHARGE INSTRUCTIONS */}
          <div className="dpw-sec" id="dpw-sec-instr">
            <div className="dpw-sec-hdr">
              <span className="dpw-sec-icon">📄</span>
              <div><div className="dpw-sec-title">Discharge Instructions</div><div className="dpw-sec-sub">Patient-facing care guide — AI generated from chart information</div></div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                {instrGenerated && <span style={{ fontSize: 9, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,229,192,.1)", border: "1px solid rgba(0,229,192,.25)", borderRadius: 3, padding: "1px 6px", color: "var(--teal)", fontWeight: 700 }}>✨ AI Generated</span>}
                <button className="dpw-btn dpw-btn-gold" onClick={generateInstructions} disabled={generatingInstr}>
                  {generatingInstr ? <><span className="dpw-spin" /> Generating…</> : "✨ Generate from Chart"}
                </button>
              </div>
            </div>
            {!instrGenerated ? (
              <div style={{ background: "rgba(22,45,79,.3)", border: "1px dashed var(--border)", borderRadius: 8, textAlign: "center", padding: "28px 20px", color: "var(--txt4)", fontSize: 12 }}>
                Click <strong style={{ color: "var(--gold)" }}>✨ Generate from Chart</strong> to have AI create personalized discharge instructions.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "🩺", title: "Your Diagnosis", val: instrDiag, set: setInstrDiag },
                  { icon: "💊", title: "Treatment Received in the ED", val: instrTreat, set: setInstrTreat },
                  { icon: "💊", title: "Medications", val: instrMeds, set: setInstrMeds },
                  { icon: "🏃", title: "Activity & Diet", val: instrAct, set: setInstrAct },
                  { icon: "📝", title: "Additional Instructions", val: instrMisc, set: setInstrMisc },
                ].map(({ icon, title, val, set }) => (
                  <div key={title} className="instr-box">
                    <div className="instr-hdr">
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)", textTransform: "uppercase", letterSpacing: ".04em" }}>{title}</span>
                    </div>
                    <textarea className="dpw-textarea" style={{ minHeight: 60, fontSize: 12.5 }} value={val} onChange={e => set(e.target.value)} placeholder="Enter patient instructions…" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. RETURN PRECAUTIONS */}
          <div className="dpw-sec" id="dpw-sec-ret">
            <div className="dpw-sec-hdr">
              <span className="dpw-sec-icon">🚨</span>
              <div><div className="dpw-sec-title">Return to the Emergency Department</div><div className="dpw-sec-sub">Instruct patient to return immediately for any of the following</div></div>
              <button className="dpw-btn dpw-btn-ghost" style={{ marginLeft: "auto" }} onClick={() => sendAI("List the most important return-to-ED precautions for this patient. Use patient-friendly language.")}>✨ AI Precautions</button>
            </div>
            {RETURN_ITEMS.map((item, i) => (
              <div key={i} className="return-card">
                <span style={{ fontSize: 17, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                <div style={{ fontSize: 12, color: "var(--txt2)", lineHeight: 1.5 }}><strong style={{ color: "var(--coral)" }}>{item.strong}</strong>{item.rest}</div>
              </div>
            ))}
            <div className="dpw-field" style={{ marginTop: 12 }}>
              <label className="dpw-label">Additional Return Precautions (custom)</label>
              <textarea className="dpw-textarea" style={{ minHeight: 60, borderColor: "rgba(255,107,107,.25)" }} value={returnCustom} onChange={e => setReturnCustom(e.target.value)} placeholder="Add any diagnosis-specific or patient-specific return precautions…" />
            </div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,107,107,.06)", border: "1px solid rgba(255,107,107,.2)", borderRadius: "var(--r)", padding: "11px 14px" }}>
              <span style={{ fontSize: 20 }}>📞</span>
              <div><div style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)" }}>Emergency Instructions</div><div style={{ fontSize: 11, color: "var(--txt2)", marginTop: 2 }}>If experiencing a medical emergency, call <strong style={{ color: "var(--txt)" }}>911</strong> immediately or go to your nearest emergency room.</div></div>
            </div>
          </div>

          {/* 6. FOLLOW-UP */}
          <div className="dpw-sec" id="dpw-sec-fu">
            <div className="dpw-sec-hdr">
              <span className="dpw-sec-icon">📅</span>
              <div><div className="dpw-sec-title">Follow-Up Appointments</div><div className="dpw-sec-sub">Specialist referrals · Primary care · Recommended timeframe</div></div>
              <button className="dpw-btn dpw-btn-ghost" style={{ marginLeft: "auto" }} onClick={() => sendAI("What follow-up appointments should be scheduled? Include timeframe and urgency.")}>✨ AI Suggest</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fuList.map(f => (
                <div key={f.id} className="dpw-row">
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 3 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--txt)" }}>{f.specialty}</div>
                    <input className="dpw-inp" style={{ fontSize: 11 }} value={f.note} onChange={e => setFuList(p => p.map(x => x.id === f.id ? { ...x, note: e.target.value } : x))} placeholder="Timeframe / instructions…" />
                  </div>
                  <span className={`fu-chip ${f.urgency === "Urgent" ? "fu-urgent" : "fu-routine"}`}>{f.urgency.toUpperCase()}</span>
                  <button className="dpw-del" onClick={() => setFuList(p => p.filter(x => x.id !== f.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dpw-add-row">
              <input className="dpw-input" style={{ flex: 1 }} value={newFu} onChange={e => setNewFu(e.target.value)} onKeyDown={e => e.key === "Enter" && addFu()} placeholder="+ Add follow-up specialty or provider…" />
              <select className="dpw-select" style={{ width: "auto" }} value={newFuUrg} onChange={e => setNewFuUrg(e.target.value)}><option>Urgent</option><option>Routine</option></select>
              <button className="dpw-btn dpw-btn-ghost" onClick={addFu}>Add</button>
            </div>
            <div className="dpw-g2" style={{ marginTop: 12 }}>
              <div className="dpw-field"><label className="dpw-label">Pending Lab / Imaging Results</label><textarea className="dpw-textarea" style={{ minHeight: 60 }} value={fuPending} onChange={e => setFuPending(e.target.value)} placeholder="Results still pending that need follow-up…" /></div>
              <div className="dpw-field"><label className="dpw-label">Primary Care Provider on Record</label><input className="dpw-input" value={fuPcp} onChange={e => setFuPcp(e.target.value)} placeholder="Dr. Name · Practice · Phone" /></div>
            </div>
          </div>

          {/* 7. DISCHARGE MEDS */}
          <div className="dpw-sec" id="dpw-sec-rx">
            <div className="dpw-sec-hdr">
              <span className="dpw-sec-icon">💊</span>
              <div><div className="dpw-sec-title">Discharge Medications</div><div className="dpw-sec-sub">New prescriptions and changes to home medications</div></div>
              <span className="dpw-bdg dpw-bdg-purple" style={{ marginLeft: "auto" }}>{dcRxList.length} Rx</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dcRxList.map(rx => (
                <div key={rx.id} className="dpw-row" style={{ borderColor: `${typeColor[rx.type] || "var(--border)"}33` }}>
                  <span style={{ fontSize: 15 }}>{typeIcon[rx.type] || "🔵"}</span>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 2 }}>
                    <input className="dpw-inp" style={{ fontWeight: 600, color: "var(--txt)" }} value={rx.drug} onChange={e => setDcRxList(p => p.map(x => x.id === rx.id ? { ...x, drug: e.target.value } : x))} placeholder="Drug name + dose" />
                    <input className="dpw-inp" style={{ fontSize: 11 }} value={rx.sig} onChange={e => setDcRxList(p => p.map(x => x.id === rx.id ? { ...x, sig: e.target.value } : x))} placeholder="SIG / instructions…" />
                  </div>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: `${typeColor[rx.type]}22`, color: typeColor[rx.type], fontWeight: 700, whiteSpace: "nowrap" }}>{rx.type}</span>
                  <button className="dpw-del" onClick={() => setDcRxList(p => p.filter(x => x.id !== rx.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dpw-add-row">
              <input className="dpw-input" style={{ flex: 1.5 }} value={newRxDrug} onChange={e => setNewRxDrug(e.target.value)} placeholder="Drug name + dose…" />
              <input className="dpw-input" style={{ flex: 1 }} value={newRxSig} onChange={e => setNewRxSig(e.target.value)} placeholder="SIG / instructions…" />
              <select className="dpw-select" style={{ width: "auto" }} value={newRxType} onChange={e => setNewRxType(e.target.value)}>
                {["NEW", "CONTINUE", "CHANGED", "STOP"].map(o => <option key={o}>{o}</option>)}
              </select>
              <button className="dpw-btn dpw-btn-ghost" onClick={addDcRx}>Add</button>
            </div>
          </div>

          {/* 8. SIGN & FINALIZE */}
          <div className="dpw-sig" id="dpw-sec-sig">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--txt)" }}>Attending Physician</div>
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2 }}>Emergency Medicine</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <div className="dpw-field" style={{ minWidth: 160 }}><label className="dpw-label">Date of Service</label><input className="dpw-input" value={sigDate} onChange={e => setSigDate(e.target.value)} /></div>
                <div className="dpw-field" style={{ minWidth: 120 }}><label className="dpw-label">Time of Discharge</label><input className="dpw-input" value={sigTime} onChange={e => setSigTime(e.target.value)} /></div>
              </div>
            </div>
            <div className="dpw-sig-line" />
            <div className="dpw-g3" style={{ marginBottom: 14 }}>
              <div className="dpw-field"><label className="dpw-label">Patient / Guardian Signature</label><input className="dpw-input" value={sigPt} onChange={e => setSigPt(e.target.value)} placeholder="Name of signatory" /></div>
              <div className="dpw-field"><label className="dpw-label">Relationship (if guardian)</label><input className="dpw-input" value={sigRel} onChange={e => setSigRel(e.target.value)} placeholder="Self / Parent / POA…" /></div>
              <div className="dpw-field"><label className="dpw-label">Nurse Witnessing Discharge</label><input className="dpw-input" value={sigRN} onChange={e => setSigRN(e.target.value)} placeholder="RN Name" /></div>
            </div>
            <div className="dpw-field" style={{ marginBottom: 14 }}>
              <label className="dpw-label">Attestation / Provider Notes</label>
              <textarea className="dpw-textarea" style={{ minHeight: 60 }} value={sigNote} onChange={e => setSigNote(e.target.value)} placeholder="I have reviewed the discharge instructions with the patient/guardian and they verbalized understanding. Patient discharged in stable condition…" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="dpw-btn dpw-btn-ghost" onClick={() => window.print()}>🖨 Print Discharge Papers</button>
              <button className="dpw-btn dpw-btn-ghost" onClick={() => sendAI("Write a complete discharge summary note for this visit in SOAP format suitable for the medical record.")}>📄 Generate DC Note</button>
              <button className="dpw-btn dpw-btn-primary" style={{ padding: "8px 20px", fontSize: 13 }} onClick={finalizeDischarge} disabled={saving}>
                {saving ? <><span className="dpw-spin" /> Signing…</> : "✍ Sign & Finalize Discharge"}
              </button>
            </div>
          </div>

        </main>

        {/* AI PANEL */}
        <aside className={`dpw-ai ${aiOpen ? "open" : "collapsed"}`}>
          <div className="dpw-ai-tab" onClick={() => setAiOpen(true)} title="Expand AI Advisor">
            <div className="dpw-ai-tab-dot" />
            <span className="dpw-ai-tab-label">Notrya AI Advisor</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--teal)", marginTop: 6, lineHeight: 1 }}>›</span>
          </div>
          <div className="dpw-ai-inner">
            <div className="dpw-ai-hdr">
              <div className="dpw-ai-hrow">
                <div className="dpw-ai-dot" />
                <span className="dpw-ai-lbl">Notrya AI — Discharge Advisor</span>
                <span className="dpw-ai-model">claude-sonnet-4</span>
                <div className="dpw-ai-toggle" onClick={() => setAiOpen(false)} title="Collapse">‹</div>
              </div>
              <div className="dpw-ai-qbtns">
                {[
                  ["📄 DC Instructions", () => generateInstructions()],
                  ["🧮 E&M Level", () => sendAI("Suggest the optimal E&M level using 2021 AMA guidelines.")],
                  ["🚨 Return Precautions", () => sendAI("Generate return-to-ED precautions tailored to this patient's diagnosis.")],
                  ["📅 Follow-Up Plan", () => sendAI("What follow-up appointments should be arranged? Include timeframe and urgency.")],
                  ["🏷 ICD-10 Codes", () => sendAI("Suggest ICD-10 codes for the discharge diagnoses.")],
                  ["📝 DC Summary Note", () => sendAI("Write a complete discharge summary note in SOAP format.")],
                  ["💌 Patient Letter", () => sendAI("Generate a patient-friendly discharge letter explaining diagnosis, treatment, medications, follow-up, and when to return.")],
                  ["✅ Review Completeness", () => sendAI("Review the completeness of this discharge summary. What is missing or incomplete?")],
                ].map(([label, fn]) => (
                  <button key={label} className="dpw-ai-qbtn" onClick={fn}>{label}</button>
                ))}
              </div>
            </div>
            <div className="dpw-ai-msgs" ref={aiMsgsRef}>
              {aiMsgs.map((m, i) => (
                <div key={i} className={`dpw-ai-msg ${m.role}`} dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              ))}
              {aiLoading && <div className="dpw-ai-loader"><span /><span /><span /></div>}
            </div>
            <div className="dpw-ai-inp-wrap">
              <textarea className="dpw-ai-inp" rows={2} value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); } }} placeholder="Ask about discharge planning…" />
              <button className="dpw-ai-send" onClick={() => sendAI()}>↑</button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}