// ─────────────────────────────────────────────────────────────────────────────
// Notrya — Discharge Summary (React port of the new HTML design)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
.dc-root *{box-sizing:border-box;margin:0;padding:0}
.dc-root{background:#050f1e;color:#c8ddf0;font-family:'DM Sans',sans-serif;font-size:14px;display:flex;flex-direction:column;height:calc(100vh - 0px);overflow:hidden}
/* scrollbar */
.dc-root ::-webkit-scrollbar{width:4px;height:4px}
.dc-root ::-webkit-scrollbar-track{background:transparent}
.dc-root ::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
/* sub-navbar */
.dc-subnav{height:44px;background:#081628;border-bottom:1px solid #1a3555;display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;z-index:10}
.dc-subnav-logo{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#00d4ff;letter-spacing:-.5px}
.dc-subnav-sep{color:#2e4a6a;font-size:14px}
.dc-subnav-title{font-size:12px;color:#8aaccc;font-weight:500}
.dc-subnav-badge{background:#0e2544;border:1px solid #1a3555;border-radius:20px;padding:2px 10px;font-size:11px;color:#00e5c0;font-family:'JetBrains Mono',monospace}
.dc-subnav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
/* vitals bar */
.dc-vbar{height:38px;background:#081628;border-bottom:1px solid #1a3555;display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;overflow:hidden}
.dc-vbar-name{font-family:'Playfair Display',serif;font-size:13px;color:#e8f0fe;font-weight:600;white-space:nowrap}
.dc-vbar-meta{font-size:10px;color:#4a6a8a;white-space:nowrap}
.dc-vbar-div{width:1px;height:18px;background:#1a3555;flex-shrink:0}
.dc-vital{display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap}
.dc-vital .lbl{color:#2e4a6a;font-size:9px;text-transform:uppercase;letter-spacing:.04em}
.dc-vital .val{font-family:'JetBrains Mono',monospace;color:#8aaccc;font-weight:600}
/* main layout */
.dc-body{display:flex;flex:1;overflow:hidden}
/* sidebar */
.dc-sb{width:220px;flex-shrink:0;background:#060e1c;border-right:1px solid #1a3555;overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:4px}
.dc-sb-label{font-size:9px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:6px;margin-bottom:2px}
.dc-sb-nav{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:#8aaccc}
.dc-sb-nav:hover{background:#0e2544;border-color:#1a3555;color:#e8f0fe}
.dc-sb-nav.active{background:rgba(0,229,192,.09);border-color:rgba(0,229,192,.3);color:#00e5c0}
.dc-sb-icon{font-size:13px;width:18px;text-align:center}
.dc-sb-dot{width:7px;height:7px;border-radius:50%;background:#1a3555;margin-left:auto;flex-shrink:0}
.dc-sb-dot.done{background:#00e5c0;box-shadow:0 0 5px rgba(0,229,192,.5)}
.dc-sb-card{background:#0b1e36;border:1px solid #1a3555;border-radius:10px;padding:10px 12px;margin-bottom:4px}
.dc-sb-divider{height:1px;background:#1a3555;margin:5px 0}
/* content */
.dc-content{flex:1;overflow-y:auto;padding:18px 22px 40px;display:flex;flex-direction:column;gap:18px}
/* ai panel */
.dc-ai{width:290px;flex-shrink:0;background:#060e1c;border-left:1px solid #1a3555;display:flex;flex-direction:column;overflow:hidden}
.dc-ai-hdr{padding:10px 12px;border-bottom:1px solid #1a3555;flex-shrink:0}
.dc-ai-hdr-top{display:flex;align-items:center;gap:7px;margin-bottom:8px}
.dc-ai-dot{width:7px;height:7px;border-radius:50%;background:#00e5c0;animation:dc-pulse 2s ease-in-out infinite}
@keyframes dc-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.dc-ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;background:#0e2544;border:1px solid #1a3555;border-radius:20px;padding:1px 7px;color:#4a6a8a}
.dc-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.dc-ai-qbtn{padding:3px 8px;border-radius:20px;font-size:10.5px;cursor:pointer;background:#0e2544;border:1px solid #1a3555;color:#8aaccc;transition:all .15s;font-family:'DM Sans',sans-serif}
.dc-ai-qbtn:hover{border-color:#00e5c0;color:#00e5c0;background:rgba(0,229,192,.06)}
.dc-ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:7px}
.dc-ai-msg{padding:8px 11px;border-radius:8px;font-size:12px;line-height:1.55}
.dc-ai-msg.sys{background:#0e2544;color:#4a6a8a;font-style:italic;border:1px solid #1a3555}
.dc-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:#8aaccc}
.dc-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:#e8f0fe}
.dc-ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
.dc-ai-loader span{width:6px;height:6px;border-radius:50%;background:#00e5c0;animation:dc-bounce 1.2s ease-in-out infinite}
.dc-ai-loader span:nth-child(2){animation-delay:.2s}.dc-ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes dc-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
.dc-ai-inp-wrap{padding:9px 12px;border-top:1px solid #1a3555;flex-shrink:0;display:flex;gap:6px}
.dc-ai-inp{flex:1;background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:7px 10px;color:#e8f0fe;font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
.dc-ai-inp:focus{border-color:#00e5c0}
.dc-ai-send{background:#00e5c0;color:#050f1e;border:none;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer;flex-shrink:0;font-weight:700}
/* section box */
.dc-sec{background:#081628;border:1px solid #1a3555;border-radius:12px;padding:18px 20px}
.dc-sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.dc-sec-icon{font-size:18px}
.dc-sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:#e8f0fe}
.dc-sec-sub{font-size:11px;color:#4a6a8a;margin-top:1px}
/* disposition */
.dc-disp-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-bottom:10px}
.dc-disp-card{background:#0b1e36;border:2px solid #1a3555;border-radius:13px;padding:14px 8px 12px;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;user-select:none}
.dc-disp-card:hover{border-color:#2a4f7a;background:#0e2544;transform:translateY(-1px)}
.dc-disp-card.sel-home{border-color:#00e5c0!important;background:rgba(0,229,192,.07)!important;box-shadow:0 0 0 1px rgba(0,229,192,.25),0 4px 20px rgba(0,229,192,.15);transform:translateY(-2px)}
.dc-disp-card.sel-floor{border-color:#3b9eff!important;background:rgba(59,158,255,.07)!important;box-shadow:0 0 0 1px rgba(59,158,255,.25),0 4px 20px rgba(59,158,255,.12);transform:translateY(-2px)}
.dc-disp-card.sel-telem{border-color:#f5c842!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-icu{border-color:#ff6b6b!important;background:rgba(255,107,107,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-obs{border-color:#9b6dff!important;background:rgba(155,109,255,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-tx{border-color:#ff9f43!important;background:rgba(255,159,67,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-ama{border-color:#f5c842!important;background:rgba(245,200,66,.07)!important;transform:translateY(-2px)}
.dc-disp-card.sel-expired{border-color:#4a6a8a!important;background:rgba(46,74,106,.15)!important;transform:translateY(-2px)}
.dc-disp-emoji{font-size:26px;line-height:1}
.dc-disp-name{font-size:11px;font-weight:700;color:#e8f0fe;line-height:1.2;transition:color .18s}
.dc-disp-sub{font-size:9.5px;color:#4a6a8a;line-height:1.3}
/* banner */
.dc-banner{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:8px;margin-top:10px;border:1px solid;font-size:12px;font-weight:600}
/* em cards */
.dc-em-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px}
.dc-em-card{background:#0b1e36;border:1px solid #1a3555;border-radius:8px;padding:13px 14px;cursor:pointer;transition:all .15s;position:relative;overflow:hidden}
.dc-em-card:hover{border-color:#2a4f7a}
.dc-em-card.selected{border-color:#3b9eff;background:rgba(59,158,255,.07)}
.dc-em-card.selected::after{content:'✓';position:absolute;top:7px;right:9px;color:#3b9eff;font-size:13px;font-weight:700}
/* fu rows */
.dc-fu-row{display:flex;align-items:center;gap:10px;background:#0b1e36;border:1px solid #1a3555;border-radius:8px;padding:10px 13px;margin-bottom:6px;transition:border-color .15s}
.dc-fu-row:hover{border-color:#2a4f7a}
.dc-fu-inp{background:transparent;border:none;outline:none;font-size:12px;color:#8aaccc;font-family:'DM Sans',sans-serif;flex:1;min-width:0}
.dc-fu-del{color:#2e4a6a;cursor:pointer;font-size:15px;transition:color .15s;padding:0 2px;background:none;border:none}
.dc-fu-del:hover{color:#ff6b6b}
.dc-add-row{display:flex;gap:6px;align-items:center;margin-top:8px}
/* field */
.dc-field{display:flex;flex-direction:column;gap:4px}
.dc-field-label{font-size:9.5px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.05em}
.dc-input{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:8px 11px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%}
.dc-input:focus{border-color:#3b9eff}
.dc-textarea{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:9px 11px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:80px;width:100%;line-height:1.6;transition:border-color .15s}
.dc-textarea:focus{border-color:#3b9eff}
.dc-select{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:8px 11px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%}
.dc-select:focus{border-color:#3b9eff}
.dc-select option{background:#0d2240}
/* instr */
.dc-instr-box{background:#0b1e36;border:1px solid #1a3555;border-radius:8px;padding:13px 15px;margin-bottom:10px}
.dc-instr-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #1a3555}
/* return */
.dc-return-card{background:rgba(255,107,107,.05);border:1px solid rgba(255,107,107,.22);border-radius:8px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;transition:all .15s}
.dc-return-card:hover{background:rgba(255,107,107,.09);border-color:rgba(255,107,107,.35)}
/* sig */
.dc-sig{background:linear-gradient(135deg,rgba(0,229,192,.06),rgba(59,158,255,.04));border:1px solid rgba(0,229,192,.2);border-radius:12px;padding:18px 20px}
/* btns */
.dc-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap}
.dc-btn-ghost{background:#0e2544;border:1px solid #1a3555;color:#8aaccc}
.dc-btn-ghost:hover{border-color:#2a4f7a;color:#e8f0fe}
.dc-btn-primary{background:#00e5c0;color:#050f1e;border:none}
.dc-btn-primary:hover{filter:brightness(1.1)}
.dc-btn-gold{background:rgba(245,200,66,.13);border:1px solid rgba(245,200,66,.35);color:#f5c842}
.dc-btn-gold:hover{background:rgba(245,200,66,.22)}
.dc-btn-blue{background:#3b9eff;color:white;border:none}
.dc-btn-blue:hover{filter:brightness(1.1)}
.dc-btn-purple{background:transparent;border:1px solid rgba(155,109,255,.4);color:#9b6dff}
.dc-btn-purple:hover{background:rgba(155,109,255,.1)}
/* badges */
.dc-badge{font-size:10px;font-family:'JetBrains Mono',monospace;padding:2px 8px;border-radius:20px;font-weight:700;white-space:nowrap;display:inline-block}
.dc-badge-teal{background:rgba(0,229,192,.12);color:#00e5c0;border:1px solid rgba(0,229,192,.3)}
.dc-badge-blue{background:rgba(59,158,255,.12);color:#3b9eff;border:1px solid rgba(59,158,255,.3)}
.dc-badge-gold{background:rgba(245,200,66,.12);color:#f5c842;border:1px solid rgba(245,200,66,.3)}
.dc-badge-coral{background:rgba(255,107,107,.15);color:#ff6b6b;border:1px solid rgba(255,107,107,.3)}
.dc-badge-purple{background:rgba(155,109,255,.12);color:#9b6dff;border:1px solid rgba(155,109,255,.3)}
.dc-badge-green{background:rgba(61,255,160,.12);color:#3dffa0;border:1px solid rgba(61,255,160,.3)}
/* grid */
.dc-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dc-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
/* shimmer */
.dc-shimmer{background:linear-gradient(90deg,#0e2544 25%,rgba(0,229,192,.05) 50%,#0e2544 75%);background-size:200% 100%;animation:dc-shimmer 1.5s infinite;border-radius:6px}
@keyframes dc-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.dc-spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(0,229,192,.2);border-top-color:#00e5c0;border-radius:50%;animation:dc-spinr .6s linear infinite}
@keyframes dc-spinr{to{transform:rotate(360deg)}}
`;

const DISPS = [
  { id:"home",    cls:"sel-home",    icon:"🏠", label:"Discharge Home",     sub:"Patient may safely return home",       bannerCls:"rgba(0,229,192,.07)", bannerBorder:"rgba(0,229,192,.25)", bannerColor:"#00e5c0",   bannerText:"Patient discharged home in stable condition.", bannerSub:"Instructions reviewed and signed." },
  { id:"floor",   cls:"sel-floor",   icon:"🏥", label:"Admit — Floor",      sub:"General medical/surgical floor",       bannerCls:"rgba(59,158,255,.07)",bannerBorder:"rgba(59,158,255,.25)",bannerColor:"#3b9eff",  bannerText:"Patient admitted to general floor.",             bannerSub:"Admitting orders placed." },
  { id:"telem",   cls:"sel-telem",   icon:"📡", label:"Admit — Telemetry",  sub:"Continuous cardiac monitoring",        bannerCls:"rgba(245,200,66,.07)",bannerBorder:"rgba(245,200,66,.2)", bannerColor:"#f5c842",   bannerText:"Patient admitted to telemetry.",                 bannerSub:"Cardiac monitoring initiated." },
  { id:"icu",     cls:"sel-icu",     icon:"🚨", label:"Admit — ICU",        sub:"Critical care — high acuity",          bannerCls:"rgba(255,107,107,.07)",bannerBorder:"rgba(255,107,107,.25)",bannerColor:"#ff6b6b", bannerText:"Patient admitted to the ICU.",                   bannerSub:"ICU team bedside." },
  { id:"obs",     cls:"sel-obs",     icon:"🔭", label:"Observation",        sub:"Hospital outpatient status <48h",      bannerCls:"rgba(155,109,255,.07)",bannerBorder:"rgba(155,109,255,.2)",bannerColor:"#9b6dff",  bannerText:"Patient in observation status.",                 bannerSub:"Expected stay < 48 hours." },
  { id:"transfer",cls:"sel-tx",      icon:"🚑", label:"Transfer",           sub:"Higher level / specialty facility",    bannerCls:"rgba(255,159,67,.07)", bannerBorder:"rgba(255,159,67,.2)", bannerColor:"#ff9f43",  bannerText:"Patient transferred to receiving facility.",      bannerSub:"Accepting physician confirmed." },
  { id:"ama",     cls:"sel-ama",     icon:"⚠️", label:"AMA",                sub:"Against Medical Advice",               bannerCls:"rgba(245,200,66,.07)",bannerBorder:"rgba(245,200,66,.2)", bannerColor:"#f5c842",   bannerText:"Patient leaving Against Medical Advice (AMA).",  bannerSub:"Risks explained. AMA form signed." },
  { id:"expired", cls:"sel-expired", icon:"🕯️", label:"Expired",            sub:"Patient expired in ED",                bannerCls:"rgba(46,74,106,.15)", bannerBorder:"rgba(74,106,138,.3)",  bannerColor:"#4a6a8a",  bannerText:"Patient expired in the Emergency Department.",   bannerSub:"Time of death documented. Family notified." },
];

const EM_LEVELS = [
  { code:"99281", level:"L1", desc:"Self-limited or minor problem. Minimal assessment.", time:"≤ 15 min", cplx:"MINIMAL", cplxCls:"rgba(0,229,192,.12)", cplxColor:"#00e5c0" },
  { code:"99282", level:"L2", desc:"Low complexity. New/established condition with low risk.", time:"16–25 min", cplx:"LOW", cplxCls:"rgba(0,229,192,.12)", cplxColor:"#00e5c0" },
  { code:"99283", level:"L3", desc:"Moderate complexity. Multiple presenting problems.", time:"26–35 min", cplx:"MODERATE", cplxCls:"rgba(245,200,66,.12)", cplxColor:"#f5c842" },
  { code:"99284", level:"L4", desc:"High complexity. High risk. Undiagnosed new problem.", time:"36–45 min", cplx:"HIGH", cplxCls:"rgba(255,107,107,.12)", cplxColor:"#ff6b6b" },
  { code:"99285", level:"L5", desc:"High complexity. Immediate threat to life or function.", time:"46–60 min", cplx:"HIGHEST", cplxCls:"rgba(155,109,255,.12)", cplxColor:"#9b6dff" },
];

const RETURN_ITEMS = [
  { icon:"🫀", text:<>Chest pain, pressure, or tightness that is <strong>new, returns, or worsens</strong> — call 911 immediately.</> },
  { icon:"😵", text:<><strong>Sudden severe headache</strong>, face drooping, arm weakness, or difficulty speaking — call 911 immediately.</> },
  { icon:"🌬️", text:<><strong>Shortness of breath</strong> at rest, difficulty breathing, or oxygen below 94%.</> },
  { icon:"💓", text:<><strong>Rapid, irregular, or pounding heartbeat</strong> with dizziness, fainting, or near-fainting.</> },
  { icon:"😰", text:<><strong>Severe sweating, nausea, or vomiting</strong> with chest discomfort.</> },
  { icon:"🩸", text:<><strong>Blood sugar &lt; 70 mg/dL</strong> with symptoms not responding to treatment, or &gt; 400 mg/dL.</> },
  { icon:"😟", text:<><strong>Any other symptom</strong> that feels severe, sudden, or different from usual.</> },
];

const NAV_SECTIONS = [
  { id:"disp",    icon:"🚪", label:"Disposition" },
  { id:"em",      icon:"🧮", label:"E&M Coding" },
  { id:"dx",      icon:"📋", label:"Diagnoses" },
  { id:"instr",   icon:"📄", label:"DC Instructions" },
  { id:"return",  icon:"🚨", label:"Return Precautions" },
  { id:"fu",      icon:"📅", label:"Follow-Up" },
  { id:"rx",      icon:"💊", label:"Discharge Meds" },
  { id:"sig",     icon:"✍", label:"Sign & Finalize" },
];

const now = new Date();
const pad = n => String(n).padStart(2, "0");
const TODAY_DATE = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()}`;
const TODAY_TIME = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default function DischargePlanning() {
  const navigate = useNavigate();

  // ── Base44 data ──
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setCurrentUser(u);
        const notes = await base44.entities.ClinicalNote.list("-updated_date", 20);
        setClinicalNotes(notes || []);
        if (notes?.length) setSelectedNoteId(notes[0].id);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const note = clinicalNotes.find(n => n.id === selectedNoteId) || null;
  const patientName = note?.patient_name || "New Patient";
  const patientMRN  = note?.patient_id  || "—";
  const patientDOB  = note?.date_of_birth || "";
  const primaryDx   = note?.diagnoses?.[0] || note?.chief_complaint || "—";
  const medications = (note?.medications || []).map((m, i) => ({ id: `m${i}`, drug: m, sig: "Continue as prescribed", type: "CONTINUE" }));
  const noteAllergies = note?.allergies || [];
  const attendingMD = currentUser?.full_name || "—";

  // ── UI state ──
  const [activeSection, setActiveSection] = useState("disp");
  const [disp, setDisp] = useState(null);
  const [emCode, setEmCode] = useState(null);
  const [dxList, setDxList] = useState([
    { id: 1, code: "R07.9", name: "Chest pain, unspecified", primary: true },
    { id: 2, code: "I10",   name: "Essential hypertension",  primary: false },
  ]);
  const [newDxCode, setNewDxCode] = useState("");
  const [newDxName, setNewDxName] = useState("");
  const [instrDiag, setInstrDiag]     = useState("");
  const [instrTreat, setInstrTreat]   = useState("");
  const [instrMeds, setInstrMeds]     = useState("");
  const [instrAct, setInstrAct]       = useState("");
  const [instrMisc, setInstrMisc]     = useState("");
  const [instrGenerated, setInstrGenerated] = useState(false);
  const [generatingInstr, setGeneratingInstr] = useState(false);
  const [returnCustom, setReturnCustom] = useState("");
  const [fuList, setFuList] = useState([
    { id: 1, icon: "🫀", specialty: "Cardiology", note: "Within 1–2 weeks — stress test or outpatient evaluation", urgency: "Urgent" },
    { id: 2, icon: "🩺", specialty: "Primary Care Physician (PCP)", note: "Within 3–5 days — blood pressure check and medication review", urgency: "Routine" },
  ]);
  const [newFu, setNewFu] = useState("");
  const [newFuUrg, setNewFuUrg] = useState("Routine");
  const [dcRxList, setDcRxList] = useState(medications);
  const [newRxDrug, setNewRxDrug] = useState("");
  const [newRxSig, setNewRxSig] = useState("");
  const [newRxType, setNewRxType] = useState("NEW");
  const [sigDate, setSigDate] = useState(TODAY_DATE);
  const [sigTime, setSigTime] = useState(TODAY_TIME);
  const [sigPt, setSigPt] = useState("");
  const [sigRel, setSigRel] = useState("");
  const [sigRN, setSigRN] = useState("");
  const [sigNote, setSigNote] = useState("");
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
  const [dots, setDots] = useState({});
  const [dcStatus, setDcStatus] = useState("DRAFT");
  const [aiOpen, setAiOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  // AI
  const [aiMsgs, setAiMsgs] = useState([{ role: "sys", text: "Notrya AI Discharge Advisor ready. Select disposition to begin, then use quick actions to auto-generate instructions, E&M level, and return precautions." }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [convHistory, setConvHistory] = useState([]);
  const aiMsgsRef = useRef(null);

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMsgs, aiLoading]);

  // sync meds when note changes
  useEffect(() => {
    if (note) {
      setDcRxList((note.medications || []).map((m, i) => ({ id: `m${i}`, drug: m, sig: "Continue as prescribed", type: "CONTINUE" })));
    }
  }, [selectedNoteId]);

  const showToast = (msg, color = "#00e5c0") => {
    clearTimeout(toastRef.current);
    setToast({ msg, color });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  };

  const setDot = (id, done) => setDots(p => ({ ...p, [id]: done }));

  const buildCtx = () => `Patient: ${patientName} | MRN: ${patientMRN} | Primary Dx: ${primaryDx} | Allergies: ${noteAllergies.join(", ") || "NKDA"} | Attending: ${attendingMD} | Disposition: ${disp || "Not set"} | E&M: ${emCode || "Not selected"}`;

  const appendMsg = (role, text) => setAiMsgs(p => [...p, { role, text }]);

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput("");
    appendMsg("user", question);
    setAiLoading(true);
    const history = [...convHistory, { role: "user", content: `${buildCtx()}\n\n${question}` }];
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `You are Notrya AI, an expert emergency medicine physician. Help complete discharge documentation accurately. Context: ${buildCtx()}\n\nQuestion: ${question}` });
      const reply = typeof res === "string" ? res : JSON.stringify(res);
      setConvHistory([...history, { role: "assistant", content: reply }]);
      appendMsg("bot", reply);
    } catch (e) { appendMsg("sys", "⚠ Connection error. Please try again."); }
    setAiLoading(false);
  };

  const generateInstructions = async () => {
    setGeneratingInstr(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate discharge instructions for: ${patientName}, Dx: ${primaryDx}, Allergies: ${noteAllergies.join(", ") || "NKDA"}, Meds: ${dcRxList.map(r=>r.drug).join(", ") || "see list"}. Return JSON with keys: diagnosis, treatment, medications, activity, additional. Write at 6th grade reading level.`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnosis:    { type: "string" },
            treatment:    { type: "string" },
            medications:  { type: "string" },
            activity:     { type: "string" },
            additional:   { type: "string" },
          }
        }
      });
      if (res.diagnosis)   setInstrDiag(res.diagnosis);
      if (res.treatment)   setInstrTreat(res.treatment);
      if (res.medications) setInstrMeds(res.medications);
      if (res.activity)    setInstrAct(res.activity);
      if (res.additional)  setInstrMisc(res.additional);
      setInstrGenerated(true);
      setDot("instr", true);
      appendMsg("bot", "✅ Discharge instructions generated. Review each section and edit as needed.");
      showToast("Instructions generated ✓");
    } catch (e) { showToast("Generation failed — please try again", "#ff6b6b"); }
    setGeneratingInstr(false);
  };

  const finalizeDischarge = async () => {
    if (!disp) { showToast("Please select a disposition first", "#ff6b6b"); return; }
    setSaving(true);
    try {
      if (note) {
        await base44.entities.ClinicalNote.update(note.id, { disposition_plan: disp, status: "finalized" });
      }
      setDcStatus("SIGNED");
      NAV_SECTIONS.forEach(s => setDot(s.id, true));
      appendMsg("bot", `✅ Discharge summary signed and finalized for ${patientName}.\n\nDisposition: ${disp} · E&M: ${emCode || "Not selected"}\n\nDischarge papers are ready to print.`);
      showToast("Discharge signed & finalized ✓");
    } catch (e) { showToast("Save failed — please try again", "#ff6b6b"); }
    setSaving(false);
  };

  const addDx = () => {
    if (!newDxName.trim()) return;
    setDxList(p => [...p, { id: Date.now(), code: newDxCode, name: newDxName, primary: false }]);
    setNewDxCode(""); setNewDxName("");
    setDot("dx", true);
  };

  const addFu = () => {
    if (!newFu.trim()) return;
    const iconMap = { cardio:"🫀", cardiac:"🫀", pcp:"🩺", primary:"🩺", neuro:"🧠", ortho:"🦴", pulm:"🫁" };
    const em = Object.entries(iconMap).find(([k]) => newFu.toLowerCase().includes(k))?.[1] || "📅";
    setFuList(p => [...p, { id: Date.now(), icon: em, specialty: newFu, note: "", urgency: newFuUrg }]);
    setNewFu("");
    setDot("fu", true);
  };

  const addDcRx = () => {
    if (!newRxDrug.trim()) return;
    setDcRxList(p => [...p, { id: Date.now(), drug: newRxDrug, sig: newRxSig, type: newRxType }]);
    setNewRxDrug(""); setNewRxSig("");
    setDot("rx", true);
  };

  const scrollTo = (id) => {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  const selDispObj = DISPS.find(d => d.id === disp);

  const typeColor = { NEW: "#9b6dff", CONTINUE: "#3b9eff", CHANGED: "#f5c842", STOP: "#ff6b6b" };
  const typeIcon  = { NEW: "🆕", CONTINUE: "🔵", CHANGED: "🔄", STOP: "❌" };

  // ── RENDER ──
  return (
    <div className="dc-root">
      <style>{CSS}</style>

      {/* SUB-NAVBAR */}
      <div className="dc-subnav">
        <span className="dc-subnav-logo">notrya</span>
        <span className="dc-subnav-sep">|</span>
        <span className="dc-subnav-title">Discharge Summary</span>
        {dcStatus === "SIGNED" && <span className="dc-badge dc-badge-teal">SIGNED</span>}
        {dcStatus === "DRAFT"  && <span className="dc-badge dc-badge-gold">DRAFT</span>}
        <div className="dc-subnav-right">
          {clinicalNotes.length > 0 && (
            <select className="dc-select" style={{ width: "auto", padding: "4px 10px", fontSize: 11 }} value={selectedNoteId || ""} onChange={e => setSelectedNoteId(e.target.value)}>
              {clinicalNotes.map(n => <option key={n.id} value={n.id}>{n.patient_name || "Unknown"} — {n.diagnoses?.[0] || n.chief_complaint || "Note"}</option>)}
            </select>
          )}
          <button className="dc-btn dc-btn-ghost" onClick={() => window.print()}>🖨 Print</button>
          <button className="dc-btn dc-btn-gold" onClick={() => sendAI("Suggest the optimal E&M level for this visit based on the chart information.")}>🧮 Suggest E&M</button>
          <button className="dc-btn dc-btn-primary" onClick={finalizeDischarge} disabled={saving}>{saving ? "Signing…" : "✍ Finalize & Sign"}</button>
        </div>
      </div>

      {/* VITALS BAR */}
      <div className="dc-vbar">
        <span className="dc-vbar-name">{patientName}</span>
        <span className="dc-vbar-meta">{patientDOB ? `DOB ${patientDOB} · ` : ""}{patientMRN !== "—" ? `MRN ${patientMRN}` : ""}</span>
        <div className="dc-vbar-div"/>
        <div className="dc-vital"><span className="lbl">CC</span><span className="val" style={{ color:"#ff9f43" }}>{note?.chief_complaint || "—"}</span></div>
        <div className="dc-vbar-div"/>
        <div className="dc-vital"><span className="lbl">Dx</span><span className="val">{primaryDx}</span></div>
        {noteAllergies.length > 0 && <><div className="dc-vbar-div"/><div className="dc-vital"><span className="lbl">Allergies</span><span className="val" style={{ color:"#ff6b6b" }}>{noteAllergies.slice(0,2).join(", ")}</span></div></>}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          <span className={`dc-badge ${dcStatus === "SIGNED" ? "dc-badge-teal" : "dc-badge-gold"}`}>{dcStatus}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="dc-body">

        {/* SIDEBAR */}
        <aside className="dc-sb">
          <div className="dc-sb-card">
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:"#e8f0fe" }}>{patientName}</div>
            <div style={{ fontSize:10, color:"#4a6a8a", marginTop:3 }}>{patientMRN !== "—" ? `MRN ${patientMRN}` : "No note selected"}</div>
            <div style={{ marginTop:8, display:"flex", gap:5, flexWrap:"wrap" }}>
              {primaryDx !== "—" && <span className="dc-badge dc-badge-gold" style={{ fontSize:9.5 }}>{primaryDx.slice(0,24)}</span>}
            </div>
          </div>

          <div className="dc-sb-label">Sections</div>
          {NAV_SECTIONS.map(s => (
            <div key={s.id} className={`dc-sb-nav${activeSection === s.id ? " active" : ""}`} onClick={() => scrollTo(s.id)}>
              <span className="dc-sb-icon">{s.icon}</span>{s.label}
              <span className={`dc-sb-dot${dots[s.id] ? " done" : ""}`}/>
            </div>
          ))}

          <div className="dc-sb-divider"/>
          <div className="dc-sb-label">Visit Summary</div>
          <div className="dc-sb-card" style={{ marginBottom:0, display:"flex", flexDirection:"column", gap:6 }}>
            {[
              ["Disposition", disp || "—", "#00e5c0"],
              ["E&M Level",   emCode || "—", "#3b9eff"],
              ["Dx Count",    String(dxList.length), "#8aaccc"],
              ["Follow-Ups",  String(fuList.length), "#f5c842"],
              ["DC Meds",     String(dcRxList.length), "#9b6dff"],
              ["Status",      dcStatus, "#00e5c0"],
            ].map(([l, v, c]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"#4a6a8a" }}>{l}</span>
                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="dc-content">

          {/* ════ DISPOSITION ════ */}
          <div className="dc-sec" id="sec-disp">
            <div className="dc-sec-hdr">
              <span className="dc-sec-icon">🚪</span>
              <div><div className="dc-sec-title">Select Disposition</div><div className="dc-sec-sub">Patient's final disposition from the Emergency Department</div></div>
            </div>
            <div style={{ fontSize:10, color:"#4a6a8a", textTransform:"uppercase", letterSpacing:".08em", fontWeight:600, marginBottom:10 }}>SELECT DISPOSITION</div>
            <div className="dc-disp-grid">
              {DISPS.map(d => (
                <div key={d.id} className={`dc-disp-card${disp === d.id ? " " + d.cls : ""}`} onClick={() => { setDisp(d.id); setDot("disp", true); }}>
                  <span className="dc-disp-emoji">{d.icon}</span>
                  <div className="dc-disp-name" style={{ color: disp === d.id ? d.bannerColor : "#e8f0fe" }}>{d.label}</div>
                  <div className="dc-disp-sub">{d.sub}</div>
                </div>
              ))}
            </div>
            {selDispObj && (
              <div className="dc-banner" style={{ background: selDispObj.bannerCls, borderColor: selDispObj.bannerBorder, color: selDispObj.bannerColor }}>
                <span style={{ fontSize:20 }}>{selDispObj.icon}</span>
                <div>
                  <div style={{ fontWeight:700 }}>{selDispObj.bannerText}</div>
                  <div style={{ opacity:.8, fontSize:11, marginTop:2 }}>{selDispObj.bannerSub}</div>
                </div>
                <button style={{ marginLeft:"auto", background:"none", border:"none", color:"#4a6a8a", cursor:"pointer", fontSize:16 }} onClick={() => setDisp(null)}>✕</button>
              </div>
            )}
            {disp && ["floor","telem","icu","obs"].includes(disp) && (
              <div className="dc-grid-3" style={{ marginTop:14 }}>
                <div className="dc-field"><label className="dc-field-label">Admitting Service</label><input className="dc-input" value={admitService} onChange={e=>setAdmitService(e.target.value)} placeholder="e.g. Cardiology, Hospitalist…"/></div>
                <div className="dc-field"><label className="dc-field-label">Admitting Physician</label><input className="dc-input" value={admitMD} onChange={e=>setAdmitMD(e.target.value)} placeholder="Dr. Name"/></div>
                <div className="dc-field"><label className="dc-field-label">Bed / Unit</label><input className="dc-input" value={admitBed} onChange={e=>setAdmitBed(e.target.value)} placeholder="e.g. 4W-412, MICU-6"/></div>
              </div>
            )}
            {disp === "transfer" && (
              <div className="dc-grid-2" style={{ marginTop:14, gap:12 }}>
                <div className="dc-field"><label className="dc-field-label">Receiving Facility</label><input className="dc-input" value={txFacility} onChange={e=>setTxFacility(e.target.value)} placeholder="Facility name…"/></div>
                <div className="dc-field"><label className="dc-field-label">Reason for Transfer</label><input className="dc-input" value={txReason} onChange={e=>setTxReason(e.target.value)} placeholder="Higher level of care…"/></div>
                <div className="dc-field"><label className="dc-field-label">Accepting Physician</label><input className="dc-input" value={txMD} onChange={e=>setTxMD(e.target.value)} placeholder="Dr. Name"/></div>
                <div className="dc-field"><label className="dc-field-label">Transport Mode</label>
                  <select className="dc-select" value={txMode} onChange={e=>setTxMode(e.target.value)}>
                    {["ALS Ambulance","BLS Ambulance","Air Transport","Private Vehicle"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ════ E&M CODING ════ */}
          <div className="dc-sec" id="sec-em">
            <div className="dc-sec-hdr">
              <span className="dc-sec-icon">🧮</span>
              <div><div className="dc-sec-title">Evaluation & Management (E&M) Coding</div><div className="dc-sec-sub">Select appropriate level · 2021 AMA guidelines · Medical Decision Making</div></div>
              <button className="dc-btn dc-btn-ghost" style={{ marginLeft:"auto" }} onClick={() => sendAI("Based on this ED visit, suggest the most appropriate E&M level and document the MDM using 2021 AMA E&M guidelines.")}>✨ AI Suggest</button>
            </div>
            <div className="dc-em-grid">
              {EM_LEVELS.map(e => (
                <div key={e.code} className={`dc-em-card${emCode === e.code ? " selected" : ""}`} onClick={() => { setEmCode(e.code); setDot("em", true); }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700, color:"#e8f0fe", lineHeight:1 }}>{e.level}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#4a6a8a", marginTop:2 }}>{e.code}</div>
                  <div style={{ fontSize:10.5, color:"#8aaccc", marginTop:6, lineHeight:1.4 }}>{e.desc}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:"#4a6a8a", marginTop:3 }}>{e.time}</div>
                  <span style={{ display:"inline-block", marginTop:5, fontSize:9, padding:"2px 7px", borderRadius:3, fontWeight:700, background:e.cplxCls, color:e.cplxColor }}>{e.cplx}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                { code:"99291", level:"Critical", levelColor:"#ff6b6b", desc:"Critical care, first 30–74 min. Direct care with high complexity MDM.", time:"30–74 min (add +99292 per 30 min)", cplx:"CRITICAL CARE" },
                { code:"99285-25", level:"L5 + Proc", levelColor:"#9b6dff", desc:"Level 5 with significant, separately identifiable procedure.", time:"Modifier -25 required", cplx:"HIGHEST + PROC" },
              ].map(e => (
                <div key={e.code} className={`dc-em-card${emCode === e.code ? " selected" : ""}`} onClick={() => { setEmCode(e.code); setDot("em", true); }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700, color:e.levelColor, lineHeight:1 }}>{e.level}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#4a6a8a", marginTop:2 }}>{e.code}</div>
                  <div style={{ fontSize:10.5, color:"#8aaccc", marginTop:6, lineHeight:1.4 }}>{e.desc}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:"#4a6a8a", marginTop:3 }}>{e.time}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:9.5, color:"#4a6a8a", textTransform:"uppercase", letterSpacing:".05em", fontWeight:800, marginBottom:8 }}>Medical Decision Making (MDM) Documentation</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Number & Complexity of Problems", state:mdmProblems, setState:setMdmProblems, opts:["1 self-limited / minor problem","1 stable chronic illness","2+ stable chronic illnesses","1 undiagnosed new problem with uncertain prognosis","1 acute illness with systemic symptoms","1 acute or chronic illness with threat to life or bodily function"] },
                { label:"Amount & Complexity of Data Reviewed", state:mdmData, setState:setMdmData, opts:["Minimal / none","Limited — order/review test(s), external notes","Moderate — independent interpretation of results","Extensive — independent interpretation + discussion with specialist"] },
                { label:"Risk of Complications / Morbidity or Mortality", state:mdmRisk, setState:setMdmRisk, opts:["Minimal — OTC medications, minor surgery","Low — Rx drug mgmt, procedure with no identified risk","Moderate — Prescription drug mgmt, minor surgery with identified risk","High — Drug therapy requiring intensive monitoring, elective major surgery"] },
              ].map(({ label, state, setState, opts }) => (
                <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", background:"#0e2544", borderRadius:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"#8aaccc", marginBottom:6 }}>{label}</div>
                    <select className="dc-select" value={state} onChange={e => setState(e.target.value)}>
                      <option value="">— Select —</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <div className="dc-field"><label className="dc-field-label">MDM Narrative</label><textarea className="dc-textarea" rows={3} value={mdmNarrative} onChange={e=>setMdmNarrative(e.target.value)} placeholder="Document clinical decision-making rationale…"/></div>
              <div className="dc-grid-3">
                <div className="dc-field"><label className="dc-field-label">Total Encounter Time</label><input className="dc-input" value={emTime} onChange={e=>setEmTime(e.target.value)} placeholder="e.g. 45 min"/></div>
                <div className="dc-field"><label className="dc-field-label">Provider Time (face-to-face)</label><input className="dc-input" value={emFaceTime} onChange={e=>setEmFaceTime(e.target.value)} placeholder="e.g. 30 min"/></div>
                <div className="dc-field"><label className="dc-field-label">Procedure CPT (if any)</label><input className="dc-input" value={emProcCpt} onChange={e=>setEmProcCpt(e.target.value)} placeholder="e.g. 93010 EKG"/></div>
              </div>
            </div>
          </div>

          {/* ════ DIAGNOSES ════ */}
          <div className="dc-sec" id="sec-dx">
            <div className="dc-sec-hdr">
              <span className="dc-sec-icon">📋</span>
              <div><div className="dc-sec-title">Discharge Diagnoses</div><div className="dc-sec-sub">Primary and secondary diagnoses with ICD-10 codes</div></div>
              <button className="dc-btn dc-btn-ghost" style={{ marginLeft:"auto" }} onClick={() => sendAI("Suggest appropriate ICD-10 codes for the discharge diagnoses based on the chart.")}>✨ AI Code</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {dxList.map((dx, i) => (
                <div key={dx.id} className="dc-fu-row">
                  <span style={{ fontSize:11, fontWeight:700, color: dx.primary ? "#00e5c0" : "#4a6a8a", minWidth:26, fontFamily:"'JetBrains Mono',monospace" }}>{dx.primary ? "1°" : `${i+1}°`}</span>
                  <input className="dc-fu-inp" style={{ maxWidth:80, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#3b9eff" }} value={dx.code} onChange={e => setDxList(p => p.map(d => d.id === dx.id ? {...d, code:e.target.value} : d))} placeholder="ICD-10"/>
                  <input className="dc-fu-inp" style={{ flex:1 }} value={dx.name} onChange={e => setDxList(p => p.map(d => d.id === dx.id ? {...d, name:e.target.value} : d))} placeholder="Diagnosis name…"/>
                  <span className={`dc-badge ${dx.primary ? "dc-badge-coral" : "dc-badge-teal"}`} style={{ fontSize:9 }}>{dx.primary ? "PRIMARY" : "SECONDARY"}</span>
                  {!dx.primary && <button className="dc-fu-del" onClick={() => { setDxList(p => p.filter(d => d.id !== dx.id)); }}>×</button>}
                </div>
              ))}
            </div>
            <div className="dc-add-row">
              <input className="dc-input" style={{ width:90, fontFamily:"'JetBrains Mono',monospace", fontSize:12 }} value={newDxCode} onChange={e=>setNewDxCode(e.target.value)} placeholder="ICD-10"/>
              <input className="dc-input" style={{ flex:1 }} value={newDxName} onChange={e=>setNewDxName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDx()} placeholder="+ Add diagnosis…"/>
              <button className="dc-btn dc-btn-ghost" onClick={addDx}>Add</button>
            </div>
          </div>

          {/* ════ DC INSTRUCTIONS ════ */}
          <div className="dc-sec" id="sec-instr">
            <div className="dc-sec-hdr">
              <span className="dc-sec-icon">📄</span>
              <div><div className="dc-sec-title">Discharge Instructions</div><div className="dc-sec-sub">Patient-facing care guide · AI generated from chart information</div></div>
              <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
                {instrGenerated && <span className="dc-badge dc-badge-teal" style={{ fontSize:9 }}>✨ AI Generated</span>}
                <button className="dc-btn dc-btn-gold" onClick={generateInstructions} disabled={generatingInstr}>
                  {generatingInstr ? <><span className="dc-spin"/> Generating…</> : "✨ Generate from Chart"}
                </button>
              </div>
            </div>
            {!instrGenerated && (
              <div style={{ background:"rgba(22,45,79,.3)", border:"1px dashed #1a3555", borderRadius:8, textAlign:"center", padding:"28px 20px", color:"#4a6a8a", fontSize:12 }}>
                Click <strong style={{ color:"#f5c842" }}>✨ Generate from Chart</strong> to have AI create personalized discharge instructions.
              </div>
            )}
            {instrGenerated && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { icon:"🩺", title:"Your Diagnosis",             val:instrDiag,  setVal:setInstrDiag },
                  { icon:"💊", title:"Treatment Received in the ED", val:instrTreat, setVal:setInstrTreat },
                  { icon:"💊", title:"Medications",                  val:instrMeds,  setVal:setInstrMeds },
                  { icon:"🏃", title:"Activity & Diet",              val:instrAct,   setVal:setInstrAct },
                  { icon:"📝", title:"Additional Instructions",       val:instrMisc,  setVal:setInstrMisc },
                ].map(({ icon, title, val, setVal }) => (
                  <div key={title} className="dc-instr-box">
                    <div className="dc-instr-hdr">
                      <span style={{ fontSize:15 }}>{icon}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#e8f0fe", textTransform:"uppercase", letterSpacing:".04em" }}>{title}</span>
                    </div>
                    <textarea className="dc-textarea" style={{ minHeight:60, fontSize:12.5, lineHeight:1.6 }} value={val} onChange={e => setVal(e.target.value)} placeholder="Enter patient instructions…"/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ════ RETURN PRECAUTIONS ════ */}
          <div className="dc-sec" id="sec-return">
            <div className="dc-sec-hdr">
              <span className="dc-sec-icon">🚨</span>
              <div><div className="dc-sec-title">Return to the Emergency Department</div><div className="dc-sec-sub">Instruct patient to return immediately for any of the following</div></div>
              <button className="dc-btn dc-btn-ghost" style={{ marginLeft:"auto" }} onClick={() => sendAI("List the most important return-to-ED precautions for this patient. Use patient-friendly language.")}>✨ AI Precautions</button>
            </div>
            {RETURN_ITEMS.map((item, i) => (
              <div key={i} className="dc-return-card">
                <span style={{ fontSize:17, flexShrink:0, marginTop:2 }}>{item.icon}</span>
                <div style={{ fontSize:12, color:"#8aaccc", lineHeight:1.5 }}>{item.text}</div>
              </div>
            ))}
            <div className="dc-field" style={{ marginTop:12 }}>
              <label className="dc-field-label">Additional Return Precautions (custom)</label>
              <textarea className="dc-textarea" style={{ minHeight:60, borderColor:"rgba(255,107,107,.25)" }} value={returnCustom} onChange={e => setReturnCustom(e.target.value)} placeholder="Add any diagnosis-specific or patient-specific return precautions…"/>
            </div>
            <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10, background:"rgba(255,107,107,.06)", border:"1px solid rgba(255,107,107,.2)", borderRadius:8, padding:"11px 14px" }}>
              <span style={{ fontSize:20 }}>📞</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#ff6b6b" }}>Emergency Instructions</div>
                <div style={{ fontSize:11, color:"#8aaccc", marginTop:2 }}>If experiencing a medical emergency, call <strong style={{ color:"#e8f0fe" }}>911</strong> immediately or go to your nearest emergency room.</div>
              </div>
            </div>
          </div>

          {/* ════ FOLLOW-UP ════ */}
          <div className="dc-sec" id="sec-fu">
            <div className="dc-sec-hdr">
              <span className="dc-sec-icon">📅</span>
              <div><div className="dc-sec-title">Follow-Up Appointments</div><div className="dc-sec-sub">Specialist referrals · Primary care · Recommended timeframe</div></div>
              <button className="dc-btn dc-btn-ghost" style={{ marginLeft:"auto" }} onClick={() => sendAI("What follow-up appointments should be scheduled for this patient? Include timeframe and urgency.")}>✨ AI Suggest</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {fuList.map(f => (
                <div key={f.id} className="dc-fu-row">
                  <span style={{ fontSize:18 }}>{f.icon}</span>
                  <div style={{ display:"flex", flexDirection:"column", flex:1, gap:3 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#e8f0fe" }}>{f.specialty}</div>
                    <input className="dc-fu-inp" style={{ fontSize:11 }} value={f.note} onChange={e => setFuList(p => p.map(x => x.id === f.id ? {...x, note:e.target.value} : x))} placeholder="Timeframe / instructions…"/>
                  </div>
                  <span className={`dc-badge ${f.urgency === "Urgent" ? "dc-badge-coral" : "dc-badge-teal"}`} style={{ fontSize:9 }}>{f.urgency.toUpperCase()}</span>
                  <button className="dc-fu-del" onClick={() => setFuList(p => p.filter(x => x.id !== f.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dc-add-row">
              <input className="dc-input" style={{ flex:1 }} value={newFu} onChange={e=>setNewFu(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFu()} placeholder="+ Add follow-up specialty or provider…"/>
              <select className="dc-select" style={{ width:"auto", paddingRight:28 }} value={newFuUrg} onChange={e=>setNewFuUrg(e.target.value)}>
                <option>Urgent</option><option>Routine</option>
              </select>
              <button className="dc-btn dc-btn-ghost" onClick={addFu}>Add</button>
            </div>
          </div>

          {/* ════ DISCHARGE MEDS ════ */}
          <div className="dc-sec" id="sec-rx">
            <div className="dc-sec-hdr">
              <span className="dc-sec-icon">💊</span>
              <div><div className="dc-sec-title">Discharge Medications</div><div className="dc-sec-sub">New prescriptions and changes to home medications</div></div>
              <span className="dc-badge dc-badge-purple" style={{ marginLeft:"auto" }}>{dcRxList.length} Rx</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {dcRxList.map(rx => (
                <div key={rx.id} className="dc-fu-row" style={{ borderColor: `${typeColor[rx.type] || "#1a3555"}33` }}>
                  <span style={{ fontSize:15 }}>{typeIcon[rx.type] || "🔵"}</span>
                  <div style={{ display:"flex", flexDirection:"column", flex:1, gap:2 }}>
                    <input className="dc-fu-inp" style={{ fontWeight:600, color:"#e8f0fe" }} value={rx.drug} onChange={e => setDcRxList(p => p.map(x => x.id === rx.id ? {...x, drug:e.target.value} : x))} placeholder="Drug name + dose"/>
                    <input className="dc-fu-inp" style={{ fontSize:11 }} value={rx.sig} onChange={e => setDcRxList(p => p.map(x => x.id === rx.id ? {...x, sig:e.target.value} : x))} placeholder="SIG / instructions…"/>
                  </div>
                  <span style={{ fontSize:9, padding:"2px 7px", borderRadius:3, background:`${typeColor[rx.type]}22`, color:typeColor[rx.type], fontWeight:700, whiteSpace:"nowrap" }}>{rx.type}</span>
                  <button className="dc-fu-del" onClick={() => setDcRxList(p => p.filter(x => x.id !== rx.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="dc-add-row">
              <input className="dc-input" style={{ flex:"1.5" }} value={newRxDrug} onChange={e=>setNewRxDrug(e.target.value)} placeholder="Drug name + dose…"/>
              <input className="dc-input" style={{ flex:1 }} value={newRxSig} onChange={e=>setNewRxSig(e.target.value)} placeholder="SIG / instructions…"/>
              <select className="dc-select" style={{ width:"auto", paddingRight:28 }} value={newRxType} onChange={e=>setNewRxType(e.target.value)}>
                {["NEW","CONTINUE","CHANGED","STOP"].map(o=><option key={o}>{o}</option>)}
              </select>
              <button className="dc-btn dc-btn-ghost" onClick={addDcRx}>Add</button>
            </div>
          </div>

          {/* ════ SIGN & FINALIZE ════ */}
          <div className="dc-sig" id="sec-sig">
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#e8f0fe" }}>{attendingMD}</div>
                <div style={{ fontSize:11, color:"#4a6a8a", marginTop:2 }}>Attending Physician</div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
                <div className="dc-field" style={{ minWidth:160 }}>
                  <label className="dc-field-label">Date of Service</label>
                  <input className="dc-input" value={sigDate} onChange={e=>setSigDate(e.target.value)}/>
                </div>
                <div className="dc-field" style={{ minWidth:120 }}>
                  <label className="dc-field-label">Time of Discharge</label>
                  <input className="dc-input" value={sigTime} onChange={e=>setSigTime(e.target.value)}/>
                </div>
              </div>
            </div>
            <div style={{ height:1, background:"rgba(0,229,192,.2)", marginBottom:14 }}/>
            <div className="dc-grid-3" style={{ marginBottom:14 }}>
              <div className="dc-field"><label className="dc-field-label">Patient / Guardian Signature</label><input className="dc-input" value={sigPt} onChange={e=>setSigPt(e.target.value)} placeholder="Name of signatory"/></div>
              <div className="dc-field"><label className="dc-field-label">Relationship (if guardian)</label><input className="dc-input" value={sigRel} onChange={e=>setSigRel(e.target.value)} placeholder="Self / Parent / POA…"/></div>
              <div className="dc-field"><label className="dc-field-label">Nurse Witnessing Discharge</label><input className="dc-input" value={sigRN} onChange={e=>setSigRN(e.target.value)} placeholder="RN Name"/></div>
            </div>
            <div className="dc-field" style={{ marginBottom:14 }}>
              <label className="dc-field-label">Attestation / Provider Notes</label>
              <textarea className="dc-textarea" style={{ minHeight:60 }} value={sigNote} onChange={e=>setSigNote(e.target.value)} placeholder="I have reviewed the discharge instructions with the patient/guardian and they verbalized understanding. Patient discharged in stable condition…"/>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button className="dc-btn dc-btn-ghost" onClick={() => window.print()}>🖨 Print Discharge Papers</button>
              <button className="dc-btn dc-btn-ghost" onClick={() => sendAI("Write a complete, signed discharge summary note in SOAP format suitable for the medical record.")}>📄 Generate DC Note</button>
              <button className="dc-btn dc-btn-primary" style={{ padding:"8px 20px", fontSize:13 }} onClick={finalizeDischarge} disabled={saving}>
                {saving ? <><span className="dc-spin"/> Signing…</> : "✍ Sign & Finalize Discharge"}
              </button>
            </div>
          </div>

        </main>

        {/* AI PANEL TOGGLE */}
        {!aiOpen && (
          <div style={{ width:36, flexShrink:0, background:"#060e1c", borderLeft:"1px solid #1a3555", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:14, gap:10, cursor:"pointer" }} onClick={() => setAiOpen(true)}>
            <div style={{ writingMode:"vertical-rl", transform:"rotate(180deg)", fontSize:11, fontWeight:600, color:"#00e5c0", letterSpacing:".06em", userSelect:"none" }}>Notrya AI</div>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#00e5c0", animation:"dc-pulse 2s ease-in-out infinite" }}/>
            <div style={{ fontSize:16, color:"#4a6a8a" }}>‹</div>
          </div>
        )}

        {/* AI PANEL */}
        <aside className="dc-ai" style={{ display: aiOpen ? "flex" : "none" }}>
          <div className="dc-ai-hdr">
            <div className="dc-ai-hdr-top">
              <div className="dc-ai-dot"/>
              <span style={{ fontSize:12, fontWeight:600, color:"#8aaccc" }}>Notrya AI — Discharge Advisor</span>
              <span className="dc-ai-model">GPT-4o</span>
            </div>
            <div className="dc-ai-qbtns">
              {[
                ["📄 DC Instructions", () => generateInstructions()],
                ["🧮 E&M Level",       () => sendAI("Suggest the optimal E&M level and document the MDM reasoning using 2021 AMA guidelines.")],
                ["🚨 Return Precautions", () => sendAI("Generate a complete set of return-to-ED precautions tailored to this patient's diagnosis.")],
                ["📅 Follow-Up Plan",  () => sendAI("What follow-up appointments, labs, or imaging should be arranged? Include timeframe and urgency.")],
                ["🏷 ICD-10 Codes",    () => sendAI("Suggest ICD-10 codes for the discharge diagnoses based on the chart information.")],
                ["📝 DC Summary Note", () => sendAI("Write a complete discharge summary note for this visit in SOAP format.")],
                ["💌 Patient Letter",  () => sendAI("Generate a patient-friendly discharge letter explaining the diagnosis, treatment, medications, follow-up, and when to return.")],
                ["✅ Review Completeness", () => sendAI("Review the completeness of this discharge summary. What sections are missing or incomplete?")],
              ].map(([label, fn]) => (
                <button key={label} className="dc-ai-qbtn" onClick={fn}>{label}</button>
              ))}
            </div>
          </div>
          <div className="dc-ai-msgs" ref={aiMsgsRef}>
            {aiMsgs.map((m, i) => (
              <div key={i} className={`dc-ai-msg ${m.role}`} dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>") }}/>
            ))}
            {aiLoading && <div className="dc-ai-loader"><span/><span/><span/></div>}
          </div>
          <div className="dc-ai-inp-wrap">
            <textarea
              className="dc-ai-inp"
              rows={2}
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
              placeholder="Ask about discharge planning…"
            />
            <button className="dc-ai-send" onClick={() => sendAI()}>↑</button>
          </div>
        </aside>

      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:20, right:20, zIndex:999, background:"#0b1e36", border:`1px solid ${toast.color}`, borderLeft:`3px solid ${toast.color}`, borderRadius:10, padding:"10px 16px", fontSize:12.5, fontWeight:600, color:"#e8f0fe", boxShadow:"0 8px 24px rgba(0,0,0,.35)" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}