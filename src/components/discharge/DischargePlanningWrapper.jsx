import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const CSS = `
.dc2-root *{box-sizing:border-box;margin:0;padding:0}
.dc2-root{background:#050f1e;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:14px;display:flex;flex-direction:column;height:100%;overflow:hidden}
.dc2-root ::-webkit-scrollbar{width:4px}.dc2-root ::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}

/* sub-navbar */
.dc2-subnav{height:42px;background:#0b1e36;border-bottom:1px solid #1a3555;display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.dc2-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#00d4ff;letter-spacing:-.5px}
.dc2-sep{color:#2e4a6a}
.dc2-title{font-size:13px;color:#8aaccc;font-weight:500}
.dc2-badge{background:#0e2544;border:1px solid #1a3555;border-radius:20px;padding:2px 10px;font-size:11px;color:#00e5c0;font-family:'JetBrains Mono',monospace}
.dc2-snr{margin-left:auto;display:flex;align-items:center;gap:8px}
.dc2-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;border:none}
.dc2-btn-ghost{background:#0e2544;border:1px solid #1a3555 !important;color:#8aaccc}
.dc2-btn-ghost:hover{border-color:#2a4f7a !important;color:#e8f0fe}
.dc2-btn-gold{background:rgba(245,200,66,.13);border:1px solid rgba(245,200,66,.35) !important;color:#f5c842}
.dc2-btn-gold:hover{background:rgba(245,200,66,.22)}
.dc2-btn-primary{background:#00e5c0;color:#050f1e}
.dc2-btn-primary:hover{filter:brightness(1.1)}

/* vitals bar */
.dc2-vbar{height:40px;background:#081628;border-bottom:1px solid #1a3555;display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;overflow:hidden}
.dc2-vname{font-family:'Playfair Display',serif;font-size:14px;color:#e8f0fe;font-weight:600;white-space:nowrap}
.dc2-vmeta{font-size:11px;color:#4a6a8a;white-space:nowrap}
.dc2-vdiv{width:1px;height:20px;background:#1a3555;flex-shrink:0}
.dc2-vital{display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap}
.dc2-vital .lbl{color:#2e4a6a;font-size:9px;text-transform:uppercase;letter-spacing:.04em}
.dc2-vital .val{font-family:'JetBrains Mono',monospace;color:#8aaccc;font-weight:600}

/* layout */
.dc2-body{display:flex;flex:1;overflow:hidden}

/* sidebar */
.dc2-sb{width:230px;flex-shrink:0;background:#081628;border-right:1px solid #1a3555;overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:4px}
.dc2-sb-label{font-size:9px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:6px;margin-bottom:2px}
.dc2-sb-nav{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:#8aaccc}
.dc2-sb-nav:hover{background:#0e2544;border-color:#1a3555;color:#e8f0fe}
.dc2-sb-nav.active{background:rgba(0,229,192,.09);border-color:rgba(0,229,192,.3);color:#00e5c0}
.dc2-sb-icon{font-size:14px;width:18px;text-align:center}
.dc2-sb-dot{width:7px;height:7px;border-radius:50%;background:#1a3555;margin-left:auto;flex-shrink:0;transition:all .3s}
.dc2-sb-dot.done{background:#00e5c0;box-shadow:0 0 6px rgba(0,229,192,.5)}
.dc2-sb-div{height:1px;background:#1a3555;margin:5px 0}
.dc2-sb-card{background:#0b1e36;border:1px solid #1a3555;border-radius:10px;padding:10px 12px;margin-bottom:4px}

/* content */
.dc2-content{flex:1;overflow-y:auto;padding:16px 20px 50px;display:flex;flex-direction:column;gap:16px}

/* AI panel */
.dc2-ai{background:#081628;border-left:1px solid #1a3555;display:flex;flex-direction:column;overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1);flex-shrink:0}
.dc2-ai.open{width:295px}
.dc2-ai.closed{width:36px}
.dc2-ai-tab{display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 0;cursor:pointer;height:100%}
.dc2-ai.closed .dc2-ai-tab{display:flex}
.dc2-ai.closed .dc2-ai-inner{display:none}
.dc2-ai-tab-dot{width:8px;height:8px;border-radius:50%;background:#00e5c0;animation:dc2-pulse 2s ease-in-out infinite;flex-shrink:0}
@keyframes dc2-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
.dc2-ai-tab-lbl{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;color:#4a6a8a;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;user-select:none;transition:color .15s}
.dc2-ai-tab:hover .dc2-ai-tab-lbl{color:#00e5c0}
.dc2-ai-inner{display:flex;flex-direction:column;flex:1;overflow:hidden;min-width:0}
.dc2-ai-hdr{padding:11px 13px;border-bottom:1px solid #1a3555;flex-shrink:0}
.dc2-ai-hrow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.dc2-ai-dot{width:8px;height:8px;border-radius:50%;background:#00e5c0;flex-shrink:0;animation:dc2-pulse 2s ease-in-out infinite}
.dc2-ai-lbl{font-size:12px;font-weight:600;color:#8aaccc;flex:1}
.dc2-ai-model{font-family:'JetBrains Mono',monospace;font-size:10px;background:#0e2544;border:1px solid #1a3555;border-radius:20px;padding:1px 7px;color:#4a6a8a}
.dc2-ai-toggle{width:24px;height:24px;border-radius:6px;background:#0e2544;border:1px solid #1a3555;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:#4a6a8a;transition:all .15s}
.dc2-ai-toggle:hover{border-color:#00e5c0;color:#00e5c0;background:rgba(0,229,192,.08)}
.dc2-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.dc2-ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;transition:all .15s;background:#0e2544;border:1px solid #1a3555;color:#8aaccc;font-family:'DM Sans',sans-serif}
.dc2-ai-qbtn:hover{border-color:#00e5c0;color:#00e5c0;background:rgba(0,229,192,.06)}
.dc2-ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.dc2-ai-msg{padding:9px 11px;border-radius:8px;font-size:12px;line-height:1.55}
.dc2-ai-msg.sys{background:#0e2544;color:#4a6a8a;font-style:italic;border:1px solid #1a3555}
.dc2-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:#8aaccc}
.dc2-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:#e8f0fe}
.dc2-ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
.dc2-ai-loader span{width:6px;height:6px;border-radius:50%;background:#00e5c0;animation:dc2-bounce 1.2s ease-in-out infinite}
.dc2-ai-loader span:nth-child(2){animation-delay:.2s}.dc2-ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes dc2-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.dc2-ai-inp-wrap{padding:10px 12px;border-top:1px solid #1a3555;flex-shrink:0;display:flex;gap:6px}
.dc2-ai-inp{flex:1;background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:7px 10px;color:#e8f0fe;font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
.dc2-ai-inp:focus{border-color:#00e5c0}
.dc2-ai-send{background:#00e5c0;color:#050f1e;border:none;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer;font-weight:700}

/* section */
.dc2-sec{background:#081628;border:1px solid #1a3555;border-radius:12px;padding:16px 18px}
.dc2-sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.dc2-sec-icon{font-size:18px}
.dc2-sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:#e8f0fe}
.dc2-sec-sub{font-size:11px;color:#4a6a8a;margin-top:1px}

/* disposition */
.dc2-disp-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
.dc2-disp-card{background:#0b1e36;border:2px solid #1a3555;border-radius:14px;padding:14px 8px 12px;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;user-select:none}
.dc2-disp-card:hover{border-color:#2a4f7a;background:#0e2544;transform:translateY(-1px)}
.dc2-disp-card.sel-home{border-color:#00e5c0 !important;background:rgba(0,229,192,.07) !important;box-shadow:0 0 0 1px rgba(0,229,192,.25),0 4px 20px rgba(0,229,192,.15);transform:translateY(-2px)}
.dc2-disp-card.sel-floor{border-color:#3b9eff !important;background:rgba(59,158,255,.07) !important;box-shadow:0 0 0 1px rgba(59,158,255,.25),0 4px 20px rgba(59,158,255,.12);transform:translateY(-2px)}
.dc2-disp-card.sel-telem{border-color:#f5c842 !important;background:rgba(245,200,66,.07) !important;transform:translateY(-2px)}
.dc2-disp-card.sel-icu{border-color:#ff6b6b !important;background:rgba(255,107,107,.07) !important;transform:translateY(-2px)}
.dc2-disp-card.sel-obs{border-color:#9b6dff !important;background:rgba(155,109,255,.07) !important;transform:translateY(-2px)}
.dc2-disp-card.sel-tx{border-color:#ff9f43 !important;background:rgba(255,159,67,.07) !important;transform:translateY(-2px)}
.dc2-disp-card.sel-ama{border-color:#f5c842 !important;background:rgba(245,200,66,.07) !important;transform:translateY(-2px)}
.dc2-disp-card.sel-expired{border-color:#4a6a8a !important;background:rgba(46,74,106,.15) !important;transform:translateY(-2px)}
.dc2-disp-emoji{font-size:28px;line-height:1}
.dc2-disp-name{font-size:12px;font-weight:700;color:#e8f0fe;line-height:1.2;transition:color .18s}
.dc2-disp-sub{font-size:10px;color:#4a6a8a;line-height:1.3}
.dc2-banner{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:8px;margin-top:12px;border:1px solid;font-size:12px;font-weight:600}

/* em */
.dc2-em-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px}
.dc2-em-card{background:#0b1e36;border:1px solid #1a3555;border-radius:8px;padding:13px 15px;cursor:pointer;transition:all .15s;position:relative;overflow:hidden}
.dc2-em-card:hover{border-color:#2a4f7a}
.dc2-em-card.sel{border-color:#3b9eff;background:rgba(59,158,255,.07)}
.dc2-em-card.sel::after{content:'✓';position:absolute;top:8px;right:10px;color:#3b9eff;font-size:14px;font-weight:700}
.dc2-em-lvl{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#e8f0fe;line-height:1}
.dc2-em-code{font-size:11px;color:#4a6a8a;font-family:'JetBrains Mono',monospace;margin-top:2px}
.dc2-em-desc{font-size:11px;color:#8aaccc;margin-top:6px;line-height:1.4}
.dc2-em-time{font-size:10px;color:#2e4a6a;margin-top:4px;font-family:'JetBrains Mono',monospace}
.dc2-em-badge{font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;margin-top:5px;display:inline-block}
.dc2-c-low{background:rgba(0,229,192,.12);color:#00e5c0}
.dc2-c-mod{background:rgba(245,200,66,.12);color:#f5c842}
.dc2-c-high{background:rgba(255,107,107,.12);color:#ff6b6b}
.dc2-c-crit{background:rgba(155,109,255,.12);color:#9b6dff}

/* rows */
.dc2-row{display:flex;align-items:center;gap:10px;background:#0b1e36;border:1px solid #1a3555;border-radius:8px;padding:10px 13px;margin-bottom:6px;transition:border-color .15s}
.dc2-row:hover{border-color:#2a4f7a}
.dc2-inp{background:transparent;border:none;outline:none;font-size:12px;color:#8aaccc;font-family:'DM Sans',sans-serif;flex:1;min-width:0}
.dc2-del{color:#2e4a6a;cursor:pointer;font-size:15px;transition:color .15s;padding:0 2px;background:none;border:none}
.dc2-del:hover{color:#ff6b6b}
.dc2-add-row{display:flex;gap:6px;align-items:center;margin-top:8px}

/* fields */
.dc2-field{display:flex;flex-direction:column;gap:4px}
.dc2-label{font-size:10px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.05em}
.dc2-input{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:8px 11px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%}
.dc2-input:focus{border-color:#3b9eff;box-shadow:0 0 0 3px rgba(59,158,255,.07)}
.dc2-textarea{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:9px 11px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:70px;width:100%;line-height:1.6;transition:border-color .15s}
.dc2-textarea:focus{border-color:#3b9eff}
.dc2-select{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:8px 11px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%}
.dc2-select:focus{border-color:#3b9eff}
.dc2-select option{background:#0d2240}
.dc2-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dc2-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}

/* instr box */
.dc2-instr-box{background:#0b1e36;border:1px solid #1a3555;border-radius:8px;padding:13px 15px;margin-bottom:10px}
.dc2-instr-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #1a3555}

/* return */
.dc2-ret-card{background:rgba(255,107,107,.05);border:1px solid rgba(255,107,107,.22);border-radius:8px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;transition:all .15s}
.dc2-ret-card:hover{background:rgba(255,107,107,.09);border-color:rgba(255,107,107,.35)}

/* sig */
.dc2-sig{background:linear-gradient(135deg,rgba(0,229,192,.06),rgba(59,158,255,.04));border:1px solid rgba(0,229,192,.2);border-radius:12px;padding:18px 20px}

/* badge */
.dc2-bdg{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;display:inline-block}
.dc2-bdg-teal{background:rgba(0,229,192,.12);color:#00e5c0;border:1px solid rgba(0,229,192,.3)}
.dc2-bdg-blue{background:rgba(59,158,255,.12);color:#3b9eff;border:1px solid rgba(59,158,255,.3)}
.dc2-bdg-gold{background:rgba(245,200,66,.12);color:#f5c842;border:1px solid rgba(245,200,66,.3)}
.dc2-bdg-coral{background:rgba(255,107,107,.15);color:#ff6b6b;border:1px solid rgba(255,107,107,.3)}
.dc2-bdg-purple{background:rgba(155,109,255,.12);color:#9b6dff;border:1px solid rgba(155,109,255,.3)}
.dc2-mdm-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#0e2544;border-radius:8px;margin-bottom:6px}
.dc2-spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(0,229,192,.2);border-top-color:#00e5c0;border-radius:50%;animation:dc2-spinr .6s linear infinite}
@keyframes dc2-spinr{to{transform:rotate(360deg)}}
`;

const now = new Date();
const pad = n => String(n).padStart(2,"0");
const TODAY_DATE = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()}`;
const TODAY_TIME = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

const DISPS = [
  {id:"home",    cls:"sel-home",    icon:"🏠", label:"Discharge Home",    sub:"Patient may safely return home",           bannerBg:"rgba(0,229,192,.07)",    bannerBorder:"rgba(0,229,192,.25)",   bannerColor:"#00e5c0",  bannerText:"Patient discharged home in stable condition.",           bannerSub:"Instructions reviewed and signed."},
  {id:"floor",   cls:"sel-floor",   icon:"🏥", label:"Admit — Floor",     sub:"General medical/surgical floor",           bannerBg:"rgba(59,158,255,.07)",   bannerBorder:"rgba(59,158,255,.25)",  bannerColor:"#3b9eff",  bannerText:"Patient admitted to general floor.",                      bannerSub:"Admitting orders placed."},
  {id:"telem",   cls:"sel-telem",   icon:"📡", label:"Admit — Telemetry", sub:"Continuous cardiac monitoring",            bannerBg:"rgba(245,200,66,.07)",   bannerBorder:"rgba(245,200,66,.2)",   bannerColor:"#f5c842",  bannerText:"Patient admitted to telemetry.",                          bannerSub:"Cardiac monitoring initiated."},
  {id:"icu",     cls:"sel-icu",     icon:"🚨", label:"Admit — ICU",       sub:"Critical care — high acuity",             bannerBg:"rgba(255,107,107,.07)",  bannerBorder:"rgba(255,107,107,.25)", bannerColor:"#ff6b6b",  bannerText:"Patient admitted to the ICU.",                            bannerSub:"ICU team bedside."},
  {id:"obs",     cls:"sel-obs",     icon:"🔭", label:"Observation",       sub:"Hospital outpatient status <48h",          bannerBg:"rgba(155,109,255,.07)", bannerBorder:"rgba(155,109,255,.2)",  bannerColor:"#9b6dff",  bannerText:"Patient in observation status.",                          bannerSub:"Expected stay < 48 hours."},
  {id:"transfer",cls:"sel-tx",      icon:"🚑", label:"Transfer",          sub:"Higher level / specialty facility",        bannerBg:"rgba(255,159,67,.07)",   bannerBorder:"rgba(255,159,67,.2)",   bannerColor:"#ff9f43",  bannerText:"Patient transferred to receiving facility.",              bannerSub:"Accepting physician confirmed."},
  {id:"ama",     cls:"sel-ama",     icon:"⚠️", label:"AMA",               sub:"Against Medical Advice",                   bannerBg:"rgba(245,200,66,.07)",   bannerBorder:"rgba(245,200,66,.2)",   bannerColor:"#f5c842",  bannerText:"Patient leaving Against Medical Advice (AMA).",          bannerSub:"Risks explained. AMA form signed."},
  {id:"expired", cls:"sel-expired", icon:"🕯️", label:"Expired",           sub:"Patient expired in ED",                    bannerBg:"rgba(46,74,106,.15)",    bannerBorder:"rgba(74,106,138,.3)",   bannerColor:"#4a6a8a",  bannerText:"Patient expired in the Emergency Department.",           bannerSub:"Time of death documented."},
];

const EM_CARDS = [
  {code:"99281",level:"L1",desc:"Self-limited or minor problem. Minimal assessment.",time:"≤ 15 min",cClass:"dc2-c-low",cLabel:"MINIMAL"},
  {code:"99282",level:"L2",desc:"Low complexity. New/established condition with low risk.",time:"16–25 min",cClass:"dc2-c-low",cLabel:"LOW"},
  {code:"99283",level:"L3",desc:"Moderate complexity. Multiple presenting problems.",time:"26–35 min",cClass:"dc2-c-mod",cLabel:"MODERATE"},
  {code:"99284",level:"L4",desc:"High complexity. High risk. Undiagnosed new problem.",time:"36–45 min",cClass:"dc2-c-high",cLabel:"HIGH"},
  {code:"99285",level:"L5",desc:"High complexity. Immediate threat to life or function.",time:"46–60 min",cClass:"dc2-c-crit",cLabel:"HIGHEST"},
];

const NAV_SECTIONS = [
  {id:"disp", icon:"🚪", label:"Disposition"},
  {id:"em",   icon:"🧮", label:"E&M Coding"},
  {id:"dx",   icon:"📋", label:"Diagnoses"},
  {id:"instr",icon:"📄", label:"DC Instructions"},
  {id:"ret",  icon:"🚨", label:"Return Precautions"},
  {id:"fu",   icon:"📅", label:"Follow-Up"},
  {id:"rx",   icon:"💊", label:"Discharge Meds"},
  {id:"sig",  icon:"✍",  label:"Sign & Finalize"},
];

const RETURN_ITEMS = [
  {icon:"🫀", strong:"Chest pain, pressure, or tightness", rest:" that is new, returns, or worsens — call 911 immediately."},
  {icon:"😵", strong:"Sudden severe headache", rest:", face drooping, arm weakness, or difficulty speaking — call 911."},
  {icon:"🌬️", strong:"Shortness of breath", rest:" at rest, difficulty breathing, or oxygen below 94%."},
  {icon:"💓", strong:"Rapid, irregular, or pounding heartbeat", rest:" with dizziness, fainting, or near-fainting."},
  {icon:"😰", strong:"Severe sweating, nausea, or vomiting", rest:" with chest discomfort."},
  {icon:"🩸", strong:"Blood sugar < 70 mg/dL", rest:" with symptoms not responding to treatment, or > 400 mg/dL."},
  {icon:"😟", strong:"Any other symptom", rest:" that feels severe, sudden, or different from usual."},
];

export default function DischargePlanningWrapper({ patientName="New Patient", patientDob="", patientId="", medications=[], allergies=[] }) {
  const [disp, setDispState] = useState(null);
  const [emCode, setEmCode] = useState(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [dots, setDots] = useState({});
  const [dcStatus, setDcStatus] = useState("DRAFT");
  const [saving, setSaving] = useState(false);

  const [dxList, setDxList] = useState([
    {id:1,code:"R07.9",name:"Chest pain, unspecified",primary:true},
    {id:2,code:"I10",  name:"Essential hypertension",  primary:false},
  ]);
  const [newDxCode, setNewDxCode] = useState("");
  const [newDxName, setNewDxName] = useState("");

  const [instrGenerated, setInstrGenerated] = useState(false);
  const [generatingInstr, setGeneratingInstr] = useState(false);
  const [instrDiag, setInstrDiag] = useState("");
  const [instrTreat, setInstrTreat] = useState("");
  const [instrMeds, setInstrMeds] = useState("");
  const [instrAct, setInstrAct] = useState("");
  const [instrMisc, setInstrMisc] = useState("");
  const [returnCustom, setReturnCustom] = useState("");

  const [fuList, setFuList] = useState([
    {id:1,icon:"🫀",specialty:"Cardiology",note:"Within 1–2 weeks — stress test or outpatient evaluation",urgency:"Urgent"},
    {id:2,icon:"🩺",specialty:"Primary Care Physician (PCP)",note:"Within 3–5 days — blood pressure check and medication review",urgency:"Routine"},
  ]);
  const [newFu, setNewFu] = useState("");
  const [newFuUrg, setNewFuUrg] = useState("Routine");

  const [dcRxList, setDcRxList] = useState(() =>
    medications.length ? medications.map((m,i)=>({id:`m${i}`,drug:m,sig:"Continue as prescribed",type:"CONTINUE"}))
    : [
      {id:"r1",drug:"Aspirin 81mg",sig:"Take 1 tablet by mouth once daily",type:"CONTINUE"},
      {id:"r2",drug:"Nitroglycerin 0.4mg SL",sig:"Place 1 tablet under tongue every 5 min up to 3 times for chest pain. Call 911 if no relief.",type:"NEW"},
    ]
  );
  const [newRxDrug, setNewRxDrug] = useState("");
  const [newRxSig, setNewRxSig] = useState("");
  const [newRxType, setNewRxType] = useState("NEW");

  const [admitService, setAdmitService] = useState("");
  const [admitMD, setAdmitMD] = useState("");
  const [admitBed, setAdmitBed] = useState("");
  const [txFacility, setTxFacility] = useState("");
  const [txReason, setTxReason] = useState("");
  const [txMD, setTxMD] = useState("");
  const [txMode, setTxMode] = useState("ALS Ambulance");

  const [mdmProblems, setMdmProblems] = useState("");
  const [mdmData, setMdmData] = useState("");
  const [mdmRisk, setMdmRisk] = useState("");
  const [mdmNarrative, setMdmNarrative] = useState("");
  const [emTime, setEmTime] = useState("");
  const [emFaceTime, setEmFaceTime] = useState("");
  const [emProcCpt, setEmProcCpt] = useState("");

  const [sigDate, setSigDate] = useState(TODAY_DATE);
  const [sigTime, setSigTime] = useState(TODAY_TIME);
  const [sigPt, setSigPt] = useState("");
  const [sigRel, setSigRel] = useState("");
  const [sigRN, setSigRN] = useState("");
  const [sigNote, setSigNote] = useState("");

  const [aiMsgs, setAiMsgs] = useState([{role:"sys",text:"Notrya AI Discharge Advisor ready. Select disposition to begin, then use quick actions to auto-generate instructions, E&M level, and return precautions."}]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [convHistory, setConvHistory] = useState([]);
  const aiMsgsRef = useRef(null);

  useEffect(()=>{ if(aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight; },[aiMsgs,aiLoading]);

  const setDot = (id, done) => setDots(p=>({...p,[id]:done}));
  const appendMsg = (role, text) => setAiMsgs(p=>[...p,{role,text}]);

  const buildCtx = () =>
    `Patient: ${patientName} | MRN: ${patientId||"—"} | DOB: ${patientDob||"—"} | Allergies: ${allergies.join(", ")||"NKDA"} | Meds: ${medications.join(", ")||"See list"} | Disposition: ${disp||"Not set"} | E&M: ${emCode||"Not selected"}`;

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput("");
    appendMsg("user", question);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an expert emergency medicine physician. Help complete discharge documentation. Context: ${buildCtx()}\n\nQuestion: ${question}`,
      });
      appendMsg("bot", typeof res === "string" ? res : JSON.stringify(res));
    } catch(e) { appendMsg("sys","⚠ Connection error. Please try again."); }
    setAiLoading(false);
  };

  const generateInstructions = async () => {
    setGeneratingInstr(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate discharge instructions for: ${patientName}, Allergies: ${allergies.join(",")||"NKDA"}, Meds: ${dcRxList.map(r=>r.drug).join(", ")}. Return JSON with keys: diagnosis, treatment, medications, activity, additional. Write at 6th grade reading level.`,
        response_json_schema:{type:"object",properties:{diagnosis:{type:"string"},treatment:{type:"string"},medications:{type:"string"},activity:{type:"string"},additional:{type:"string"}}}
      });
      if(res.diagnosis) setInstrDiag(res.diagnosis);
      if(res.treatment) setInstrTreat(res.treatment);
      if(res.medications) setInstrMeds(res.medications);
      if(res.activity) setInstrAct(res.activity);
      if(res.additional) setInstrMisc(res.additional);
      setInstrGenerated(true);
      setDot("instr",true);
      appendMsg("bot","✅ Discharge instructions generated. Review each section and edit as needed.");
    } catch(e){ appendMsg("sys","⚠ Generation failed. Please try again."); }
    setGeneratingInstr(false);
  };

  const finalizeDischarge = async () => {
    if(!disp){ appendMsg("sys","⚠ Please select a disposition before finalizing."); return; }
    setSaving(true);
    await new Promise(r=>setTimeout(r,1200));
    setDcStatus("SIGNED");
    NAV_SECTIONS.forEach(s=>setDot(s.id,true));
    appendMsg("bot",`✅ Discharge summary signed and finalized for ${patientName}.\n\nDisposition: ${disp} · E&M: ${emCode||"Not selected"}\n\nDischarge papers are ready to print.`);
    setSaving(false);
  };

  const addDx = () => {
    if(!newDxName.trim()) return;
    setDxList(p=>[...p,{id:Date.now(),code:newDxCode,name:newDxName,primary:false}]);
    setNewDxCode(""); setNewDxName("");
    setDot("dx",true);
  };
  const addFu = () => {
    if(!newFu.trim()) return;
    const iconMap={cardio:"🫀",cardiac:"🫀",pcp:"🩺",primary:"🩺",neuro:"🧠",ortho:"🦴",pulm:"🫁"};
    const em = Object.entries(iconMap).find(([k])=>newFu.toLowerCase().includes(k))?.[1]||"📅";
    setFuList(p=>[...p,{id:Date.now(),icon:em,specialty:newFu,note:"",urgency:newFuUrg}]);
    setNewFu(""); setDot("fu",true);
  };
  const addDcRx = () => {
    if(!newRxDrug.trim()) return;
    setDcRxList(p=>[...p,{id:Date.now(),drug:newRxDrug,sig:newRxSig,type:newRxType}]);
    setNewRxDrug(""); setNewRxSig(""); setDot("rx",true);
  };

  const scrollTo = id => { document.getElementById(`dc2-sec-${id}`)?.scrollIntoView({behavior:"smooth",block:"start"}); };

  const typeColor={NEW:"#9b6dff",CONTINUE:"#3b9eff",CHANGED:"#f5c842",STOP:"#ff6b6b"};
  const typeIcon ={NEW:"🆕",CONTINUE:"🔵",CHANGED:"🔄",STOP:"❌"};
  const selDispObj = DISPS.find(d=>d.id===disp);

  return (
    <div className="dc2-root">
      <style>{CSS}</style>

      {/* SUB-NAVBAR */}
      <div className="dc2-subnav">
        <span className="dc2-logo">notrya</span>
        <span className="dc2-sep">|</span>
        <span className="dc2-title">Discharge Summary</span>
        <span className={`dc2-bdg ${dcStatus==="SIGNED"?"dc2-bdg-teal":"dc2-bdg-gold"}`}>{dcStatus}</span>
        <div className="dc2-snr">
          <button className="dc2-btn dc2-btn-ghost" onClick={()=>window.print()}>🖨 Print</button>
          <button className="dc2-btn dc2-btn-ghost" onClick={()=>sendAI("Generate a complete patient-friendly discharge letter including diagnosis, treatment, medications, follow-up, and when to return.")}>📄 Patient Letter</button>
          <button className="dc2-btn dc2-btn-gold" onClick={()=>sendAI("Suggest the optimal E&M level for this visit and document the MDM reasoning using 2021 AMA guidelines.")}>🧮 Suggest E&M</button>
          <button className="dc2-btn dc2-btn-primary" onClick={finalizeDischarge} disabled={saving}>{saving?<><span className="dc2-spin"/> Signing…</>:"✍ Finalize & Sign"}</button>
        </div>
      </div>

      {/* VITALS BAR */}
      <div className="dc2-vbar">
        <span className="dc2-vname">{patientName}</span>
        {patientDob && <span className="dc2-vmeta">DOB {patientDob}</span>}
        {patientId && <><div className="dc2-vdiv"/><div className="dc2-vital"><span className="lbl">MRN</span><span className="val">{patientId}</span></div></>}
        {allergies.length>0 && <><div className="dc2-vdiv"/><div className="dc2-vital"><span className="lbl">Allergies</span><span className="val" style={{color:"#ff6b6b"}}>{allergies.slice(0,2).join(", ")}</span></div></>}
        <div style={{marginLeft:"auto"}}><span className={`dc2-bdg ${dcStatus==="SIGNED"?"dc2-bdg-teal":"dc2-bdg-gold"}`}>{dcStatus}</span></div>
      </div>

      {/* BODY */}
      <div className="dc2-body">

        {/* SIDEBAR */}
        <aside className="dc2-sb">
          <div className="dc2-sb-card">
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:"#e8f0fe"}}>{patientName}</div>
            <div style={{fontSize:10,color:"#4a6a8a",marginTop:3}}>{patientId?`MRN ${patientId}`:"New Patient"}</div>
            <div style={{marginTop:8,display:"flex",gap:5,flexWrap:"wrap"}}>
              {disp&&<span className="dc2-bdg dc2-bdg-teal" style={{fontSize:9.5}}>{disp}</span>}
            </div>
          </div>
          <div className="dc2-sb-label">Sections</div>
          {NAV_SECTIONS.map(s=>(
            <div key={s.id} className="dc2-sb-nav" onClick={()=>scrollTo(s.id)}>
              <span className="dc2-sb-icon">{s.icon}</span>{s.label}
              <span className={`dc2-sb-dot${dots[s.id]?" done":""}`}/>
            </div>
          ))}
          <div className="dc2-sb-div"/>
          <div className="dc2-sb-label">Visit Summary</div>
          <div className="dc2-sb-card" style={{marginBottom:0,display:"flex",flexDirection:"column",gap:6}}>
            {[["Disposition",disp||"—","#00e5c0"],["E&M Level",emCode||"—","#3b9eff"],["Diagnoses",String(dxList.length),"#8aaccc"],["Follow-Ups",String(fuList.length),"#f5c842"],["DC Meds",String(dcRxList.length),"#9b6dff"],["Status",dcStatus,"#00e5c0"]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#4a6a8a"}}>{l}</span>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:c}}>{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="dc2-content">

          {/* DISPOSITION */}
          <div className="dc2-sec" id="dc2-sec-disp">
            <div className="dc2-sec-hdr">
              <span className="dc2-sec-icon">🚪</span>
              <div><div className="dc2-sec-title">Select Disposition</div><div className="dc2-sec-sub">Patient's final disposition from the Emergency Department</div></div>
            </div>
            <div style={{fontSize:10,color:"#4a6a8a",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,marginBottom:10}}>SELECT DISPOSITION</div>
            <div className="dc2-disp-grid">
              {DISPS.map(d=>(
                <div key={d.id} className={`dc2-disp-card${disp===d.id?" "+d.cls:""}`} onClick={()=>{setDispState(d.id);setDot("disp",true);}}>
                  <span className="dc2-disp-emoji">{d.icon}</span>
                  <div className="dc2-disp-name" style={{color:disp===d.id?d.bannerColor:"#e8f0fe"}}>{d.label}</div>
                  <div className="dc2-disp-sub">{d.sub}</div>
                </div>
              ))}
            </div>
            {selDispObj&&(
              <div className="dc2-banner" style={{background:selDispObj.bannerBg,borderColor:selDispObj.bannerBorder,color:selDispObj.bannerColor,marginTop:12}}>
                <span style={{fontSize:20}}>{selDispObj.icon}</span>
                <div><div style={{fontWeight:700}}>{selDispObj.bannerText}</div><div style={{opacity:.8,fontSize:11,marginTop:2}}>{selDispObj.bannerSub}</div></div>
                <button style={{marginLeft:"auto",background:"none",border:"none",color:"#4a6a8a",cursor:"pointer",fontSize:16}} onClick={()=>setDispState(null)}>✕</button>
              </div>
            )}
            {disp&&["floor","telem","icu","obs"].includes(disp)&&(
              <div className="dc2-g3" style={{marginTop:14}}>
                <div className="dc2-field"><label className="dc2-label">Admitting Service</label><input className="dc2-input" value={admitService} onChange={e=>setAdmitService(e.target.value)} placeholder="e.g. Cardiology, Hospitalist…"/></div>
                <div className="dc2-field"><label className="dc2-label">Admitting Physician</label><input className="dc2-input" value={admitMD} onChange={e=>setAdmitMD(e.target.value)} placeholder="Dr. Name"/></div>
                <div className="dc2-field"><label className="dc2-label">Bed / Unit</label><input className="dc2-input" value={admitBed} onChange={e=>setAdmitBed(e.target.value)} placeholder="e.g. 4W-412"/></div>
              </div>
            )}
            {disp==="transfer"&&(
              <div className="dc2-g2" style={{marginTop:14}}>
                <div className="dc2-field"><label className="dc2-label">Receiving Facility</label><input className="dc2-input" value={txFacility} onChange={e=>setTxFacility(e.target.value)} placeholder="Facility name…"/></div>
                <div className="dc2-field"><label className="dc2-label">Reason for Transfer</label><input className="dc2-input" value={txReason} onChange={e=>setTxReason(e.target.value)} placeholder="Higher level of care…"/></div>
                <div className="dc2-field"><label className="dc2-label">Accepting Physician</label><input className="dc2-input" value={txMD} onChange={e=>setTxMD(e.target.value)} placeholder="Dr. Name"/></div>
                <div className="dc2-field"><label className="dc2-label">Transport Mode</label>
                  <select className="dc2-select" value={txMode} onChange={e=>setTxMode(e.target.value)}>
                    {["ALS Ambulance","BLS Ambulance","Air Transport","Private Vehicle"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* E&M */}
          <div className="dc2-sec" id="dc2-sec-em">
            <div className="dc2-sec-hdr">
              <span className="dc2-sec-icon">🧮</span>
              <div><div className="dc2-sec-title">Evaluation & Management (E&M) Coding</div><div className="dc2-sec-sub">Select appropriate level · 2021 AMA guidelines · Medical Decision Making</div></div>
              <button className="dc2-btn dc2-btn-ghost" style={{marginLeft:"auto"}} onClick={()=>sendAI("Suggest the most appropriate E&M level and document the MDM reasoning using 2021 AMA E&M guidelines.")}>✨ AI Suggest Level</button>
            </div>
            <div className="dc2-em-grid">
              {EM_CARDS.map(e=>(
                <div key={e.code} className={`dc2-em-card${emCode===e.code?" sel":""}`} onClick={()=>{setEmCode(e.code);setDot("em",true);}}>
                  <div className="dc2-em-lvl">{e.level}</div>
                  <div className="dc2-em-code">{e.code}</div>
                  <div className="dc2-em-desc">{e.desc}</div>
                  <div className="dc2-em-time">{e.time}</div>
                  <span className={`dc2-em-badge ${e.cClass}`}>{e.cLabel}</span>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{code:"99291",level:"Critical",color:"#ff6b6b",desc:"Critical care, first 30–74 min.",time:"30–74 min (+99292/30min)",cClass:"dc2-c-crit",cLabel:"CRITICAL CARE"},
                {code:"99285-25",level:"L5 + Proc",color:"#9b6dff",desc:"Level 5 with significant separately identifiable procedure.",time:"Modifier -25 required",cClass:"dc2-c-crit",cLabel:"HIGHEST + PROC"}
              ].map(e=>(
                <div key={e.code} className={`dc2-em-card${emCode===e.code?" sel":""}`} onClick={()=>{setEmCode(e.code);setDot("em",true);}}>
                  <div className="dc2-em-lvl" style={{color:e.color}}>{e.level}</div>
                  <div className="dc2-em-code">{e.code}</div>
                  <div className="dc2-em-desc">{e.desc}</div>
                  <div className="dc2-em-time">{e.time}</div>
                  <span className={`dc2-em-badge ${e.cClass}`}>{e.cLabel}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:9.5,color:"#4a6a8a",textTransform:"uppercase",letterSpacing:".05em",fontWeight:800,marginBottom:8}}>Medical Decision Making (MDM)</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {label:"Number & Complexity of Problems",val:mdmProblems,set:setMdmProblems,opts:["1 self-limited / minor problem","1 stable chronic illness","2+ stable chronic illnesses","1 undiagnosed new problem with uncertain prognosis","1 acute illness with systemic symptoms","1 acute or chronic illness with threat to life or bodily function"]},
                {label:"Amount & Complexity of Data Reviewed",val:mdmData,set:setMdmData,opts:["Minimal / none","Limited — order/review test(s), external notes","Moderate — independent interpretation of results","Extensive — independent interpretation + discussion with specialist"]},
                {label:"Risk of Complications / Morbidity or Mortality",val:mdmRisk,set:setMdmRisk,opts:["Minimal — OTC medications, minor surgery","Low — Rx drug mgmt, procedure with no identified risk","Moderate — Prescription drug mgmt, minor surgery with identified risk","High — Drug therapy requiring intensive monitoring, elective major surgery"]},
              ].map(({label,val,set,opts})=>(
                <div key={label} className="dc2-mdm-row">
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:600,color:"#8aaccc",marginBottom:6}}>{label}</div>
                    <select className="dc2-select" value={val} onChange={e=>set(e.target.value)}>
                      <option value="">— Select —</option>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <div className="dc2-field"><label className="dc2-label">MDM Narrative</label><textarea className="dc2-textarea" rows={3} value={mdmNarrative} onChange={e=>setMdmNarrative(e.target.value)} placeholder="Document clinical decision-making rationale…"/></div>
              <div className="dc2-g3">
                <div className="dc2-field"><label className="dc2-label">Total Encounter Time</label><input className="dc2-input" value={emTime} onChange={e=>setEmTime(e.target.value)} placeholder="e.g. 45 min"/></div>
                <div className="dc2-field"><label className="dc2-label">Provider Time (face-to-face)</label><input className="dc2-input" value={emFaceTime} onChange={e=>setEmFaceTime(e.target.value)} placeholder="e.g. 30 min"/></div>
                <div className="dc2-field"><label className="dc2-label">Procedure CPT (if any)</label><input className="dc2-input" value={emProcCpt} onChange={e=>setEmProcCpt(e.target.value)} placeholder="e.g. 93010 EKG"/></div>
              </div>
            </div>
          </div>

          {/* DIAGNOSES */}
          <div className="dc2-sec" id="dc2-sec-dx">
            <div className="dc2-sec-hdr">
              <span className="dc2-sec-icon">📋</span>
              <div><div className="dc2-sec-title">Discharge Diagnoses</div><div className="dc2-sec-sub">Primary and secondary diagnoses with ICD-10 codes</div></div>
              <button className="dc2-btn dc2-btn-ghost" style={{marginLeft:"auto"}} onClick={()=>sendAI("Suggest appropriate ICD-10 codes for the discharge diagnoses based on the chart.")}>✨ AI Code</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {dxList.map((dx,i)=>(
                <div key={dx.id} className="dc2-row">
                  <span style={{fontSize:11,fontWeight:700,color:dx.primary?"#00e5c0":"#4a6a8a",minWidth:26,fontFamily:"'JetBrains Mono',monospace"}}>{dx.primary?"1°":`${i+1}°`}</span>
                  <input className="dc2-inp" style={{maxWidth:80,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#3b9eff"}} value={dx.code} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,code:e.target.value}:d))} placeholder="ICD-10"/>
                  <input className="dc2-inp" style={{flex:1}} value={dx.name} onChange={e=>setDxList(p=>p.map(d=>d.id===dx.id?{...d,name:e.target.value}:d))} placeholder="Diagnosis name…"/>
                  <span className={`dc2-bdg ${dx.primary?"dc2-bdg-coral":"dc2-bdg-teal"}`} style={{fontSize:9}}>{dx.primary?"PRIMARY":"SECONDARY"}</span>
                  {!dx.primary&&<button className="dc2-del" onClick={()=>setDxList(p=>p.filter(d=>d.id!==dx.id))}>×</button>}
                </div>
              ))}
            </div>
            <div className="dc2-add-row">
              <input className="dc2-input" style={{width:90,fontFamily:"'JetBrains Mono',monospace",fontSize:12}} value={newDxCode} onChange={e=>setNewDxCode(e.target.value)} placeholder="ICD-10"/>
              <input className="dc2-input" style={{flex:1}} value={newDxName} onChange={e=>setNewDxName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDx()} placeholder="+ Add diagnosis…"/>
              <button className="dc2-btn dc2-btn-ghost" onClick={addDx}>Add</button>
            </div>
          </div>

          {/* DC INSTRUCTIONS */}
          <div className="dc2-sec" id="dc2-sec-instr">
            <div className="dc2-sec-hdr">
              <span className="dc2-sec-icon">📄</span>
              <div><div className="dc2-sec-title">Discharge Instructions</div><div className="dc2-sec-sub">Patient-facing care guide — AI generated from chart information</div></div>
              <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                {instrGenerated&&<span style={{fontSize:9,display:"inline-flex",alignItems:"center",gap:4,background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.25)",borderRadius:3,padding:"1px 6px",color:"#00e5c0",fontWeight:700}}>✨ AI Generated</span>}
                <button className="dc2-btn dc2-btn-gold" onClick={generateInstructions} disabled={generatingInstr}>
                  {generatingInstr?<><span className="dc2-spin"/> Generating…</>:"✨ Generate from Chart"}
                </button>
              </div>
            </div>
            {!instrGenerated?(
              <div style={{background:"rgba(22,45,79,.3)",border:"1px dashed #1a3555",borderRadius:8,textAlign:"center",padding:"28px 20px",color:"#4a6a8a",fontSize:12}}>
                Click <strong style={{color:"#f5c842"}}>✨ Generate from Chart</strong> to have AI create personalized discharge instructions.
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[{icon:"🩺",title:"Your Diagnosis",val:instrDiag,set:setInstrDiag},{icon:"💊",title:"Treatment Received in the ED",val:instrTreat,set:setInstrTreat},{icon:"💊",title:"Medications",val:instrMeds,set:setInstrMeds},{icon:"🏃",title:"Activity & Diet",val:instrAct,set:setInstrAct},{icon:"📝",title:"Additional Instructions",val:instrMisc,set:setInstrMisc}].map(({icon,title,val,set})=>(
                  <div key={title} className="dc2-instr-box">
                    <div className="dc2-instr-hdr">
                      <span style={{fontSize:15}}>{icon}</span>
                      <span style={{fontSize:12,fontWeight:700,color:"#e8f0fe",textTransform:"uppercase",letterSpacing:".04em"}}>{title}</span>
                    </div>
                    <textarea className="dc2-textarea" style={{minHeight:60,fontSize:12.5}} value={val} onChange={e=>set(e.target.value)} placeholder="Enter patient instructions…"/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RETURN PRECAUTIONS */}
          <div className="dc2-sec" id="dc2-sec-ret">
            <div className="dc2-sec-hdr">
              <span className="dc2-sec-icon">🚨</span>
              <div><div className="dc2-sec-title">Return to the Emergency Department</div><div className="dc2-sec-sub">Instruct patient to return immediately for any of the following</div></div>
              <button className="dc2-btn dc2-btn-ghost" style={{marginLeft:"auto"}} onClick={()=>sendAI("List the most important return-to-ED precautions for this patient. Use patient-friendly language.")}>✨ AI Precautions</button>
            </div>
            {RETURN_ITEMS.map((item,i)=>(
              <div key={i} className="dc2-ret-card">
                <span style={{fontSize:17,flexShrink:0,marginTop:2}}>{item.icon}</span>
                <div style={{fontSize:12,color:"#8aaccc",lineHeight:1.5}}><strong style={{color:"#ff6b6b"}}>{item.strong}</strong>{item.rest}</div>
              </div>
            ))}
            <div className="dc2-field" style={{marginTop:12}}>
              <label className="dc2-label">Additional Return Precautions (custom)</label>
              <textarea className="dc2-textarea" style={{minHeight:60,borderColor:"rgba(255,107,107,.25)"}} value={returnCustom} onChange={e=>setReturnCustom(e.target.value)} placeholder="Add any diagnosis-specific or patient-specific return precautions…"/>
            </div>
            <div style={{marginTop:12,display:"flex",alignItems:"center",gap:10,background:"rgba(255,107,107,.06)",border:"1px solid rgba(255,107,107,.2)",borderRadius:8,padding:"11px 14px"}}>
              <span style={{fontSize:20}}>📞</span>
              <div><div style={{fontSize:12,fontWeight:700,color:"#ff6b6b"}}>Emergency Instructions</div><div style={{fontSize:11,color:"#8aaccc",marginTop:2}}>If experiencing a medical emergency, call <strong style={{color:"#e8f0fe"}}>911</strong> immediately or go to your nearest emergency room.</div></div>
            </div>
          </div>

          {/* FOLLOW-UP */}
          <div className="dc2-sec" id="dc2-sec-fu">
            <div className="dc2-sec-hdr">
              <span className="dc2-sec-icon">📅</span>
              <div><div className="dc2-sec-title">Follow-Up Appointments</div><div className="dc2-sec-sub">Specialist referrals · Primary care · Recommended timeframe</div></div>
              <button className="dc2-btn dc2-btn-ghost" style={{marginLeft:"auto"}} onClick={()=>sendAI("What follow-up appointments should be scheduled? Include timeframe and urgency.")}>✨ AI Suggest</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {fuList.map(f=>(
                <div key={f.id} className="dc2-row">
                  <span style={{fontSize:18}}>{f.icon}</span>
                  <div style={{display:"flex",flexDirection:"column",flex:1,gap:3}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#e8f0fe"}}>{f.specialty}</div>
                    <input className="dc2-inp" style={{fontSize:11}} value={f.note} onChange={e=>setFuList(p=>p.map(x=>x.id===f.id?{...x,note:e.target.value}:x))} placeholder="Timeframe / instructions…"/>
                  </div>
                  <span className={`dc2-bdg ${f.urgency==="Urgent"?"dc2-bdg-coral":"dc2-bdg-teal"}`} style={{fontSize:9}}>{f.urgency.toUpperCase()}</span>
                  <button className="dc2-del" onClick={()=>setFuList(p=>p.filter(x=>x.id!==f.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dc2-add-row">
              <input className="dc2-input" style={{flex:1}} value={newFu} onChange={e=>setNewFu(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFu()} placeholder="+ Add follow-up specialty or provider…"/>
              <select className="dc2-select" style={{width:"auto",paddingRight:24}} value={newFuUrg} onChange={e=>setNewFuUrg(e.target.value)}><option>Urgent</option><option>Routine</option></select>
              <button className="dc2-btn dc2-btn-ghost" onClick={addFu}>Add</button>
            </div>
          </div>

          {/* DISCHARGE MEDS */}
          <div className="dc2-sec" id="dc2-sec-rx">
            <div className="dc2-sec-hdr">
              <span className="dc2-sec-icon">💊</span>
              <div><div className="dc2-sec-title">Discharge Medications</div><div className="dc2-sec-sub">New prescriptions and changes to home medications</div></div>
              <span className="dc2-bdg dc2-bdg-purple" style={{marginLeft:"auto"}}>{dcRxList.length} Rx</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {dcRxList.map(rx=>(
                <div key={rx.id} className="dc2-row" style={{borderColor:`${typeColor[rx.type]||"#1a3555"}33`}}>
                  <span style={{fontSize:15}}>{typeIcon[rx.type]||"🔵"}</span>
                  <div style={{display:"flex",flexDirection:"column",flex:1,gap:2}}>
                    <input className="dc2-inp" style={{fontWeight:600,color:"#e8f0fe"}} value={rx.drug} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,drug:e.target.value}:x))} placeholder="Drug name + dose"/>
                    <input className="dc2-inp" style={{fontSize:11}} value={rx.sig} onChange={e=>setDcRxList(p=>p.map(x=>x.id===rx.id?{...x,sig:e.target.value}:x))} placeholder="SIG / instructions…"/>
                  </div>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:`${typeColor[rx.type]}22`,color:typeColor[rx.type],fontWeight:700,whiteSpace:"nowrap"}}>{rx.type}</span>
                  <button className="dc2-del" onClick={()=>setDcRxList(p=>p.filter(x=>x.id!==rx.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dc2-add-row">
              <input className="dc2-input" style={{flex:"1.5"}} value={newRxDrug} onChange={e=>setNewRxDrug(e.target.value)} placeholder="Drug name + dose…"/>
              <input className="dc2-input" style={{flex:1}} value={newRxSig} onChange={e=>setNewRxSig(e.target.value)} placeholder="SIG / instructions…"/>
              <select className="dc2-select" style={{width:"auto",paddingRight:24}} value={newRxType} onChange={e=>setNewRxType(e.target.value)}>
                {["NEW","CONTINUE","CHANGED","STOP"].map(o=><option key={o}>{o}</option>)}
              </select>
              <button className="dc2-btn dc2-btn-ghost" onClick={addDcRx}>Add</button>
            </div>
          </div>

          {/* SIGN & FINALIZE */}
          <div className="dc2-sig" id="dc2-sec-sig">
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#e8f0fe"}}>Attending Physician</div>
                <div style={{fontSize:11,color:"#4a6a8a",marginTop:2}}>Emergency Medicine</div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:10}}>
                <div className="dc2-field" style={{minWidth:160}}><label className="dc2-label">Date of Service</label><input className="dc2-input" value={sigDate} onChange={e=>setSigDate(e.target.value)}/></div>
                <div className="dc2-field" style={{minWidth:120}}><label className="dc2-label">Time of Discharge</label><input className="dc2-input" value={sigTime} onChange={e=>setSigTime(e.target.value)}/></div>
              </div>
            </div>
            <div style={{height:1,background:"rgba(0,229,192,.2)",marginBottom:14}}/>
            <div className="dc2-g3" style={{marginBottom:14}}>
              <div className="dc2-field"><label className="dc2-label">Patient / Guardian Signature</label><input className="dc2-input" value={sigPt} onChange={e=>setSigPt(e.target.value)} placeholder="Name of signatory"/></div>
              <div className="dc2-field"><label className="dc2-label">Relationship (if guardian)</label><input className="dc2-input" value={sigRel} onChange={e=>setSigRel(e.target.value)} placeholder="Self / Parent / POA…"/></div>
              <div className="dc2-field"><label className="dc2-label">Nurse Witnessing Discharge</label><input className="dc2-input" value={sigRN} onChange={e=>setSigRN(e.target.value)} placeholder="RN Name"/></div>
            </div>
            <div className="dc2-field" style={{marginBottom:14}}>
              <label className="dc2-label">Attestation / Provider Notes</label>
              <textarea className="dc2-textarea" style={{minHeight:60}} value={sigNote} onChange={e=>setSigNote(e.target.value)} placeholder="I have reviewed the discharge instructions with the patient/guardian and they verbalized understanding. Patient discharged in stable condition…"/>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button className="dc2-btn dc2-btn-ghost" onClick={()=>window.print()}>🖨 Print Discharge Papers</button>
              <button className="dc2-btn dc2-btn-ghost" onClick={()=>sendAI("Write a complete discharge summary note for this visit in SOAP format suitable for the medical record.")}>📄 Generate DC Note</button>
              <button className="dc2-btn dc2-btn-primary" style={{padding:"8px 20px",fontSize:13}} onClick={finalizeDischarge} disabled={saving}>
                {saving?<><span className="dc2-spin"/> Signing…</>:"✍ Sign & Finalize Discharge"}
              </button>
            </div>
          </div>

        </main>

        {/* AI PANEL */}
        <aside className={`dc2-ai ${aiOpen?"open":"closed"}`}>
          <div className="dc2-ai-tab" onClick={()=>setAiOpen(true)}>
            <div className="dc2-ai-tab-dot"/>
            <span className="dc2-ai-tab-lbl">Notrya AI Advisor</span>
            <span style={{fontSize:14,color:"#4a6a8a",marginTop:4}}>›</span>
          </div>
          <div className="dc2-ai-inner">
            <div className="dc2-ai-hdr">
              <div className="dc2-ai-hrow">
                <div className="dc2-ai-dot"/>
                <span className="dc2-ai-lbl">Notrya AI — Discharge Advisor</span>
                <span className="dc2-ai-model">GPT-4o</span>
                <div className="dc2-ai-toggle" onClick={()=>setAiOpen(false)}>‹</div>
              </div>
              <div className="dc2-ai-qbtns">
                {[["📄 DC Instructions",()=>generateInstructions()],["🧮 E&M Level",()=>sendAI("Suggest the optimal E&M level using 2021 AMA guidelines.")],["🚨 Return Precautions",()=>sendAI("Generate return-to-ED precautions tailored to this patient's diagnosis.")],["📅 Follow-Up Plan",()=>sendAI("What follow-up appointments should be arranged? Include timeframe and urgency.")],["🏷 ICD-10 Codes",()=>sendAI("Suggest ICD-10 codes for the discharge diagnoses.")],["📝 DC Summary Note",()=>sendAI("Write a complete discharge summary note in SOAP format.")],["💌 Patient Letter",()=>sendAI("Generate a patient-friendly discharge letter explaining diagnosis, treatment, medications, follow-up, and when to return.")],["✅ Review Completeness",()=>sendAI("Review the completeness of this discharge summary. What is missing or incomplete?")]].map(([label,fn])=>(
                  <button key={label} className="dc2-ai-qbtn" onClick={fn}>{label}</button>
                ))}
              </div>
            </div>
            <div className="dc2-ai-msgs" ref={aiMsgsRef}>
              {aiMsgs.map((m,i)=>(
                <div key={i} className={`dc2-ai-msg ${m.role}`} dangerouslySetInnerHTML={{__html:m.text.replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}}/>
              ))}
              {aiLoading&&<div className="dc2-ai-loader"><span/><span/><span/></div>}
            </div>
            <div className="dc2-ai-inp-wrap">
              <textarea className="dc2-ai-inp" rows={2} value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAI();}}} placeholder="Ask about discharge planning…"/>
              <button className="dc2-ai-send" onClick={()=>sendAI()}>↑</button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}