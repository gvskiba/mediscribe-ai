import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

// ── Design tokens ──────────────────────────────────────────────────
const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040", navy2:"#071220",
};

// ── Shared primitives ──────────────────────────────────────────────
const Label = ({ c, children, style={} }) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
    color:c||C.dim, letterSpacing:".1em", marginBottom:4, ...style }}>{children}</div>
);

const Pill = ({ color=C.teal, children, style={} }) => (
  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
    padding:"2px 7px", borderRadius:6, background:`${color}18`,
    border:`1px solid ${color}40`, color, ...style }}>{children}</span>
);

const Card = ({ title, icon, color=C.teal, badge, right, children, style={} }) => (
  <div style={{ background:C.panel, border:`1px solid ${C.border}`,
    borderRadius:14, overflow:"hidden", ...style }}>
    <div style={{ padding:"9px 14px", background:"rgba(0,0,0,.2)",
      borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
      {icon && <span style={{ fontSize:14 }}>{icon}</span>}
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
        fontWeight:700, color:color||C.dim, letterSpacing:".1em", flex:1 }}>{title}</span>
      {badge && <Pill color={color}>{badge}</Pill>}
      {right}
    </div>
    <div style={{ padding:"12px 14px" }}>{children}</div>
  </div>
);

const inputS = {
  background:C.edge, border:`1px solid ${C.border}`, borderRadius:8,
  padding:"7px 10px", color:C.text, fontFamily:"'DM Sans',sans-serif",
  fontSize:12, outline:"none", width:"100%",
};

const Btn = ({ children, onClick, color=C.teal, style={}, disabled=false, small=false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "4px 10px" : "7px 16px",
    borderRadius: small ? 7 : 10, fontSize: small ? 10 : 12,
    fontWeight:700, cursor:disabled?"not-allowed":"pointer", border:"none",
    background: disabled ? C.edge : `linear-gradient(135deg,${color},${color}cc)`,
    color: disabled ? C.muted : color===C.amber||color===C.gold||color===C.green ? C.navy : "#fff",
    opacity: disabled ? .5 : 1, transition:"all .15s", ...style,
  }}>{children}</button>
);

// ── Vital helpers ──────────────────────────────────────────────────
const VITALS_DEF = [
  { id:"hr",    label:"Heart Rate",  unit:"bpm",   lo:60,  hi:100, clo:40,  chi:150  },
  { id:"sbp",   label:"Systolic BP", unit:"mmHg",  lo:90,  hi:180, clo:70,  chi:220  },
  { id:"dbp",   label:"Diastolic",   unit:"mmHg",  lo:60,  hi:110, clo:40,  chi:130  },
  { id:"rr",    label:"Resp Rate",   unit:"/min",  lo:12,  hi:20,  clo:8,   chi:30   },
  { id:"spo2",  label:"SpO₂",        unit:"%",     lo:95,  hi:100, clo:88,  chi:null },
  { id:"temp",  label:"Temp",        unit:"°F",    lo:97,  hi:99,  clo:94,  chi:104  },
  { id:"pain",  label:"Pain",        unit:"/10",   lo:0,   hi:3,   clo:null,chi:8    },
  { id:"gcs",   label:"GCS",         unit:"/15",   lo:14,  hi:15,  clo:null,chi:null },
  { id:"gluc",  label:"Blood Glucose",unit:"mg/dL",lo:70,  hi:140, clo:50,  chi:400  },
  { id:"uop",   label:"Urine Output", unit:"mL/hr",lo:0.5, hi:999, clo:null,chi:null },
];

function vFlag(def, v) {
  if (!v || isNaN(+v)) return null;
  const n = +v;
  if (def.clo!=null && n<=def.clo) return "CRIT";
  if (def.chi!=null && n>=def.chi) return "CRIT";
  if (def.lo!=null  && n<def.lo)  return "LOW";
  if (def.hi!=null  && n>def.hi)  return "HIGH";
  return "WNL";
}

const FLAG_C = {
  CRIT:{ color:C.red,   bg:"rgba(255,92,108,.14)", label:"CRIT" },
  LOW: { color:C.amber, bg:"rgba(245,166,35,.12)",  label:"↓ LOW" },
  HIGH:{ color:C.amber, bg:"rgba(245,166,35,.12)",  label:"↑ HIGH"},
  WNL: { color:C.green, bg:"rgba(46,204,113,.08)",  label:"WNL"  },
};

// ── Assessment templates ───────────────────────────────────────────
const ASSESS_TEMPLATES = {
  neuro:  ["Alert and oriented x4","Pupils equal, round, reactive to light","No focal neurological deficits","GCS 15","Follows commands appropriately","Speech clear"],
  resp:   ["Breath sounds clear bilaterally","No respiratory distress","O₂ on room air","Maintaining SpO₂ >95%","No wheezing or crackles"],
  cardio: ["Regular rate and rhythm","No peripheral edema","Pulses 2+ all extremities","Cap refill <2 seconds","No JVD"],
  gi:     ["Abdomen soft, non-tender","Bowel sounds present x4 quadrants","No nausea/vomiting","Last BM documented","Tolerating PO"],
  gu:     ["Voiding without difficulty","Urine clear/yellow","Foley catheter intact and draining","No hematuria"],
  skin:   ["Skin warm, dry, intact","No pressure injuries noted","IV site without signs of infiltration","Wound dressing dry and intact"],
  pain:   ["Pain assessed using numeric scale","Non-pharmacologic measures in place","Patient verbalized understanding of pain plan","Reassessment completed post-intervention"],
  safety: ["Call light within reach","Bed in lowest position, brakes locked","Side rails up x2","Patient/family educated on fall precautions","ID band verified"],
};

const SYSTEM_LABELS = {
  neuro:"Neurological", resp:"Respiratory", cardio:"Cardiovascular",
  gi:"GI/Abdominal", gu:"GU/Renal", skin:"Skin/Wound", pain:"Pain Management", safety:"Safety",
};

// ── Nursing note templates ─────────────────────────────────────────
const NOTE_TEMPLATES = [
  { id:"admission",  label:"Admission Assessment",   icon:"🏥", fields:["chief_complaint","hpi","allergies","home_meds","pmh","social","review_systems","physical_exam"] },
  { id:"shift",      label:"Shift Assessment",        icon:"🔄", fields:["vital_signs","neuro","resp","cardio","gi","gu","skin","pain","safety","iv","labs_pending"] },
  { id:"postprocedure", label:"Post-Procedure Note",  icon:"⚕️", fields:["procedure","time_out","tolerance","vital_signs","complications","education"] },
  { id:"discharge",  label:"Discharge Teaching",      icon:"🏠", fields:["diagnosis","medications","follow_up","precautions","education_given","verbalized_understanding"] },
  { id:"critical",   label:"Critical Event Note",     icon:"🚨", fields:["event_description","time","interventions","team_response","outcome","family_notified"] },
  { id:"iv",         label:"IV / Line Note",           icon:"💉", fields:["site","gauge","attempts","securement","patient_tolerance","flush_verification"] },
];

// ── Quick-alert presets ────────────────────────────────────────────
const QUICK_ALERTS = [
  { id:"lab_crit",  icon:"🧪", label:"Critical Lab",      color:C.red,   priority:"CRITICAL" },
  { id:"vitals",    icon:"❤️",  label:"Vital Sign Change",  color:C.red,   priority:"URGENT"   },
  { id:"pain",      icon:"😖",  label:"Pain Uncontrolled",  color:C.amber, priority:"URGENT"   },
  { id:"new_med",   icon:"💊",  label:"Medication Question",color:C.blue,  priority:"ROUTINE"  },
  { id:"fall_risk", icon:"⚠️",  label:"Fall / Safety",      color:C.amber, priority:"URGENT"   },
  { id:"resp",      icon:"💨",  label:"Respiratory Change", color:C.red,   priority:"CRITICAL" },
  { id:"neuro",     icon:"🧠",  label:"Neuro Change",       color:C.red,   priority:"CRITICAL" },
  { id:"bleed",     icon:"🩸",  label:"Bleeding / Wound",   color:C.red,   priority:"URGENT"   },
  { id:"iv",        icon:"💉",  label:"IV / Line Issue",    color:C.muted, priority:"ROUTINE"  },
  { id:"other",     icon:"📋",  label:"Other / General",    color:C.dim,   priority:"ROUTINE"  },
];

const PRIORITY_C = {
  CRITICAL:{ color:C.red,   bg:"rgba(255,92,108,.14)", border:"rgba(255,92,108,.4)" },
  URGENT:  { color:C.amber, bg:"rgba(245,166,35,.12)", border:"rgba(245,166,35,.3)" },
  ROUTINE: { color:C.blue,  bg:"rgba(74,144,217,.1)",  border:"rgba(74,144,217,.28)" },
};

function nowStr() {
  return new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false});
}
function todayStr() {
  return new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function NursingFlowsheet() {
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const chatBottomRef = useRef();
  const [clock, setClock] = useState("");

  // ── Tab state ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("flowsheet");

  // ── Patient context ───────────────────────────────────────────────
  const [patient] = useState({
    name:"Margaret T. Sullivan", age:67, sex:"F", dob:"03/14/1957",
    mrn:"MRN-884412", room:"TR-1", bed:"A", provider:"Dr. Rivera",
    dx:"Chest pain, r/o NSTEMI", allergies:"Penicillin, Aspirin",
    code:"Full Code", iso:"Standard", diet:"NPO",
    admitted:"10/14/2025 08:14", weight:"72 kg", height:"5'4\"",
  });

  // ── Flowsheet state ───────────────────────────────────────────────
  const [vitalRows, setVitalRows] = useState([]);
  const [newVitals, setNewVitals] = useState({ time:nowStr(), hr:"", sbp:"", dbp:"", rr:"", spo2:"", temp:"", pain:"", gcs:"", gluc:"", uop:"" });
  const [ioRows, setIoRows] = useState([]);
  const [newIO, setNewIO] = useState({ time:nowStr(), type:"", route:"", amount:"", in_out:"IN", note:"" });
  const [assessments, setAssessments] = useState({
    neuro:[], resp:[], cardio:[], gi:[], gu:[], skin:[], pain:[], safety:[],
  });
  const [assessTime, setAssessTime] = useState(nowStr());
  const [activeSystem, setActiveSystem] = useState("neuro");
  const [assessNotes, setAssessNotes] = useState({});

  // ── Chat state ────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatFiles, setChatFiles] = useState([]);
  const [sending, setSending] = useState(false);

  // ── Alerts state ──────────────────────────────────────────────────
  const [alerts, setAlerts] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertType, setAlertType] = useState(null);
  const [alertText, setAlertText] = useState("");
  const [alertPriority, setAlertPriority] = useState("URGENT");

  // ── Orders state ──────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [orderNote, setOrderNote] = useState({});

  // ── Labs / Meds / Findings state ──────────────────────────────────
  const [labs, setLabs] = useState([]);
  const [newLab, setNewLab] = useState({ time:nowStr(), name:"", value:"", units:"", ref:"", flag:"WNL" });
  const [meds, setMeds] = useState([]);
  const [newMed, setNewMed] = useState({ time:nowStr(), name:"", dose:"", route:"IV Push", note:"" });
  const [findings, setFindings] = useState([]);
  const [newFinding, setNewFinding] = useState({ time:nowStr(), text:"", alertMD:"no" });

  // ── AI Summary state ──────────────────────────────────────────────
  const [aiSummary, setAiSummary] = useState(null);
  const [genSummary, setGenSummary] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [templateFields, setTemplateFields] = useState({});
  const [generatingNote, setGeneratingNote] = useState(false);
  const [generatedNote, setGeneratedNote] = useState("");

  // ── Crash Cart Inventory state ───────────────────────────────────
  const [crashCartItems, setCrashCartItems] = useState([]);
  const [usageLog, setUsageLog] = useState([]);
  const [newUsage, setNewUsage] = useState({ itemId:null, qty:1, event:"", note:"" });
  const [restockNeeded, setRestockNeeded] = useState([]);

  // ── Clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setClock(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false})), 1000);
    setClock(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false}));
    return () => clearInterval(iv);
  }, []);

  // ── Scroll chat ───────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [chatMessages]);

  // ── Check for restock needs ───────────────────────────────────────
  useEffect(() => {
    const needsRestock = crashCartItems.filter(item => item.qty <= item.minQty);
    setRestockNeeded(needsRestock);
  }, [crashCartItems]);

  // ── Derived stats ─────────────────────────────────────────────────
  const latestVitals = vitalRows[vitalRows.length - 1] || {};
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const unackAlerts = alerts.filter(a => !a.acknowledged).length;
  const totalIn  = ioRows.filter(r=>r.in_out==="IN").reduce((s,r)=>s+(+r.amount||0),0);
  const totalOut = ioRows.filter(r=>r.in_out==="OUT").reduce((s,r)=>s+(+r.amount||0),0);

  // ── Add vital row ─────────────────────────────────────────────────
  const addVitalRow = () => {
    if (!newVitals.time) return;
    setVitalRows(prev => [...prev, { ...newVitals }]);
    setNewVitals({ time:nowStr(), hr:"", sbp:"", dbp:"", rr:"", spo2:"", temp:"", pain:"", gcs:"", gluc:"", uop:"" });
  };

  // ── Add I/O row ───────────────────────────────────────────────────
  const addIORow = () => {
    if (!newIO.type || !newIO.amount) return;
    setIoRows(prev => [...prev, { ...newIO }]);
    setNewIO({ time:nowStr(), type:"", route:"", amount:"", in_out:"IN", note:"" });
  };

  // ── Toggle assessment item ─────────────────────────────────────────
  const toggleAssess = (system, item) => {
    setAssessments(prev => ({
      ...prev,
      [system]: prev[system].includes(item)
        ? prev[system].filter(x => x !== item)
        : [...prev[system], item],
    }));
  };

  // ── Send chat message ─────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() && chatFiles.length === 0) return;
    setSending(true);
    const msg = {
      id: Date.now(),
      sender:"Nurse Kim",
      role:"nurse",
      time: nowStr(),
      text: chatInput,
      type: chatFiles.length > 0 ? "file" : "text",
      files: chatFiles.map(f => ({ name:f.name, size:(f.size/1024).toFixed(0)+"KB", type:f.type })),
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput("");
    setChatFiles([]);
    setSending(false);
  };

  // ── Fire alert ────────────────────────────────────────────────────
  const fireAlert = () => {
    if (!alertText.trim()) return;
    const at = QUICK_ALERTS.find(a => a.id === alertType);
    const newAlert = {
      id: Date.now(), type: alertType, icon: at.icon, label: at.label,
      priority: alertPriority, time: nowStr(), text: alertText,
      acknowledged: false,
    };
    setAlerts(prev => [newAlert, ...prev]);
    setChatMessages(prev => [...prev, {
      id: Date.now()+1, sender:"Nurse Kim", role:"nurse", time:nowStr(),
      text:`🔔 ALERT [${alertPriority}] — ${at.label}: ${alertText}`,
      type:"alert", priority: alertPriority,
    }]);
    setAlertModal(false);
    setAlertText("");
    setAlertType(null);
    setActiveTab("chat");
  };

  // ── Acknowledge order ─────────────────────────────────────────────
  const ackOrder = (id) => {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status:"acknowledged", ackTime:nowStr(), ackBy:"Nurse Kim" } : o
    ));
    setChatMessages(prev => [...prev, {
      id: Date.now(), sender:"Nurse Kim", role:"nurse", time:nowStr(),
      text:`✓ Order acknowledged: ${orders.find(o=>o.id===id)?.text}`,
      type:"text",
    }]);
  };

  // ── Generate AI summary ────────────────────────────────────────────
  const generateAISummary = async () => {
    setGenSummary(true);
    const vitStr = vitalRows.slice(-1)[0]
      ? `HR ${vitalRows.slice(-1)[0].hr}, BP ${vitalRows.slice(-1)[0].sbp}/${vitalRows.slice(-1)[0].dbp}, SpO₂ ${vitalRows.slice(-1)[0].spo2}%, Temp ${vitalRows.slice(-1)[0].temp}°F, Pain ${vitalRows.slice(-1)[0].pain}/10`
      : "Vitals not yet documented";
    const assessStr = Object.entries(assessments)
      .filter(([,v]) => v.length > 0)
      .map(([k,v]) => `${SYSTEM_LABELS[k]}: ${v.join("; ")}`)
      .join("\n") || "Assessment not yet documented";
    const alertStr = alerts.slice(0,3).map(a => `${a.priority}: ${a.text}`).join("\n") || "No active alerts";
    const ioStr = `Total IN: ${totalIn}mL, Total OUT: ${totalOut}mL, Balance: ${totalIn-totalOut>0?"+":""}${totalIn-totalOut}mL`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation AI helping an ED nurse write a structured nursing shift summary. Generate a clear, professional nursing assessment summary using SBAR format.

PATIENT: ${patient.name}, ${patient.age}y ${patient.sex}, Room ${patient.room}
DIAGNOSIS: ${patient.dx}
ALLERGIES: ${patient.allergies}
PROVIDER: ${patient.provider}

LATEST VITALS: ${vitStr}
I&O: ${ioStr}
ASSESSMENT FINDINGS:
${assessStr}
ACTIVE ALERTS:
${alertStr}
PENDING ORDERS: ${pendingOrders}

Generate a professional nursing SBAR note with:
1. Situation (1-2 sentences)
2. Background (2-3 sentences) 
3. Assessment (system-by-system, bullet points)
4. Recommendations (nursing actions and pending items)

Be concise, clinical, and accurate. Use standard nursing documentation language.`,
      });
      setAiSummary(result);
    } catch (e) {
      setAiSummary("Unable to generate summary. Please check your connection and try again.");
    } finally {
      setGenSummary(false);
    }
  };

  // ── Generate note from template ────────────────────────────────────
  const generateTemplateNote = async () => {
    if (!activeTemplate) return;
    setGeneratingNote(true);
    const tmpl = NOTE_TEMPLATES.find(t => t.id === activeTemplate);
    const context = Object.entries(templateFields).map(([k,v]) => `${k}: ${v}`).join("\n");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation AI helping an ED nurse write a ${tmpl.label}.

PATIENT: ${patient.name}, ${patient.age}y ${patient.sex}, Room ${patient.room}
DIAGNOSIS: ${patient.dx}
TIME: ${todayStr()} ${nowStr()}
NURSE: Nurse Kim

NURSE-PROVIDED INFORMATION:
${context || "No additional context provided."}

LATEST VITALS: HR ${latestVitals.hr||"—"}, BP ${latestVitals.sbp||"—"}/${latestVitals.dbp||"—"}, SpO₂ ${latestVitals.spo2||"—"}%, Temp ${latestVitals.temp||"—"}°F, Pain ${latestVitals.pain||"—"}/10

Generate a complete, professional nursing ${tmpl.label} suitable for the medical record. Use standard clinical documentation format. Be specific, accurate, and complete. Include time and nurse signature line at the end.`,
      });
      setGeneratedNote(result);
    } catch (e) {
      setGeneratedNote("Documentation generation failed. Please try again.");
    } finally {
      setGeneratingNote(false);
    }
  };

  // ── Lab/Med helpers ───────────────────────────────────────────────
  const addLab = () => {
    if (!newLab.name || !newLab.value) return;
    const entry = { ...newLab, id: Date.now(), time: newLab.time || nowStr() };
    setLabs(prev => [entry, ...prev]);
    if (entry.flag === "CRIT" || entry.flag === "PANIC") {
      const a = { id:Date.now()+1, type:"lab_crit", icon:"🧪", label:"Critical Lab", priority:"CRITICAL",
        time:entry.time, text:`${entry.name}: ${entry.value} ${entry.units} — ${entry.flag}. Ref: ${entry.ref||"—"}.`, acknowledged:false };
      setAlerts(prev => [a, ...prev]);
      setChatMessages(prev => [...prev, { id:Date.now()+2, sender:"Nurse Kim", role:"nurse", time:nowStr(),
        text:`🔔 ALERT [CRITICAL] — Critical Lab: ${entry.name}: ${entry.value} ${entry.units} — ${entry.flag}`, type:"alert", priority:"CRITICAL" }]);
    }
    setNewLab({ time:nowStr(), name:"", value:"", units:"", ref:"", flag:"WNL" });
  };

  const addMed = () => {
    if (!newMed.name) return;
    setMeds(prev => [{ ...newMed, id:Date.now(), time:newMed.time||nowStr() }, ...prev]);
    setNewMed({ time:nowStr(), name:"", dose:"", route:"IV Push", note:"" });
  };

  const addFinding = () => {
    if (!newFinding.text) return;
    const entry = { ...newFinding, id:Date.now(), time:newFinding.time||nowStr() };
    setFindings(prev => [entry, ...prev]);
    if (entry.alertMD !== "no") {
      const pri = entry.alertMD === "urgent" ? "URGENT" : "ROUTINE";
      const a = { id:Date.now()+1, type:"other", icon:"📌", label:"Nurse Finding", priority:pri,
        time:entry.time, text:entry.text, acknowledged:false };
      setAlerts(prev => [a, ...prev]);
      setChatMessages(prev => [...prev, { id:Date.now()+2, sender:"Nurse Kim", role:"nurse", time:nowStr(),
        text:`🔔 FINDING [${pri}]: ${entry.text}`, type:"alert", priority:pri }]);
    }
    setNewFinding({ time:nowStr(), text:"", alertMD:"no" });
  };

  // ── Crash Cart helpers ────────────────────────────────────────────
  const logCrashCartUsage = () => {
    if (!newUsage.itemId || !newUsage.qty) return;
    const item = crashCartItems.find(i => i.id === +newUsage.itemId);
    if (!item) return;

    // Update item quantity
    setCrashCartItems(prev => prev.map(i => 
      i.id === +newUsage.itemId 
        ? { ...i, qty: Math.max(0, i.qty - +newUsage.qty), used: i.used + +newUsage.qty }
        : i
    ));

    // Log usage
    const logEntry = {
      id: Date.now(),
      time: nowStr(),
      itemName: item.name,
      qty: +newUsage.qty,
      event: newUsage.event,
      note: newUsage.note,
      loggedBy: "Nurse Kim",
    };
    setUsageLog(prev => [logEntry, ...prev]);

    // Check if restock needed
    const newQty = item.qty - +newUsage.qty;
    if (newQty <= item.minQty && !restockNeeded.find(r => r.id === item.id)) {
      setRestockNeeded(prev => [...prev, { ...item, qtyAfterUse: newQty }]);
      // Auto-alert
      const a = {
        id: Date.now()+1, type:"other", icon:"🚨", label:"Crash Cart Restock",
        priority:"URGENT", time:nowStr(),
        text:`${item.name} is below minimum stock (${newQty}/${item.minQty}). Restock required.`,
        acknowledged:false
      };
      setAlerts(prev => [a, ...prev]);
    }

    setNewUsage({ itemId:null, qty:1, event:"", note:"" });
  };

  const restockItem = (itemId) => {
    const item = crashCartItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Reset to original quantity (approximate)
    const originalQty = item.qty + item.used;
    setCrashCartItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, qty: originalQty, used: 0 } : i
    ));
    setRestockNeeded(prev => prev.filter(r => r.id !== itemId));
    
    // Log restock
    setUsageLog(prev => [{
      id: Date.now(),
      time: nowStr(),
      itemName: item.name,
      qty: 0,
      event: "RESTOCKED",
      note: `Item restocked to ${originalQty} units`,
      loggedBy: "Nurse Kim",
    }, ...prev]);
  };

  const TABS = [
    { id:"flowsheet", label:"Flowsheet",    icon:"📊", badge: null },
    { id:"chat",      label:"Provider Chat",icon:"💬", badge: unackAlerts > 0 ? unackAlerts : null },
    { id:"alerts",    label:"Alerts",       icon:"🔔", badge: unackAlerts > 0 ? unackAlerts : null, badgeColor:C.red },
    { id:"orders",    label:"Orders",       icon:"📋", badge: pendingOrders > 0 ? pendingOrders : null, badgeColor:C.amber },
    { id:"labs",      label:"Labs & Meds",  icon:"🧪", badge: null },
    { id:"crashcart", label:"Crash Cart",   icon:"🚨", badge: restockNeeded.length > 0 ? restockNeeded.length : null, badgeColor:C.red },
    { id:"summary",   label:"AI Summary",   icon:"✦",  badge: null },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.navy, minHeight:"100vh", color:C.text, display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#4a7299 !important}
        input::placeholder,textarea::placeholder{color:#2a4d72}
        select option{background:#0b1d35}
        button:hover:not(:disabled){filter:brightness(1.1)}
        .assess-chip:hover{opacity:1 !important;border-color:#00d4bc55 !important}
        .chat-bubble:hover .copy-btn{opacity:1 !important}
        .order-row:hover{background:rgba(0,212,188,.04) !important}
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <nav style={{ height:52, background:"rgba(11,29,53,.98)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 18px", gap:10, flexShrink:0, zIndex:200 }}>
        <span onClick={()=>navigate(createPageUrl("CommandCenter"))} style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:C.bright, cursor:"pointer", letterSpacing:"-.02em" }}>Notrya</span>
        <div style={{ width:1, height:16, background:C.border }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.rose, letterSpacing:".12em" }}>NURSING FLOWSHEET</span>

        {unackAlerts > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:8, background:"rgba(255,92,108,.12)", border:"1px solid rgba(255,92,108,.35)", animation:"pulse 1.4s infinite" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.red }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.red }}>{unackAlerts} UNACK'D ALERTS</span>
          </div>
        )}

        <div style={{ flex:1 }} />

        {/* Patient strip */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"5px 12px", borderRadius:10, background:C.edge, border:`1px solid ${C.border}` }}>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:C.bright, lineHeight:1 }}>{patient.name}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:2 }}>{patient.age}y {patient.sex} · Room {patient.room} · {patient.provider}</div>
          </div>
          <div style={{ width:1, height:28, background:C.border }} />
          <div style={{ textAlign:"right" }}>
            <Pill color={C.red}>{patient.code}</Pill>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted, marginTop:3 }}>{patient.allergies}</div>
          </div>
        </div>

        <div style={{ width:1, height:16, background:C.border }} />

        {/* Quick alert button */}
        <button onClick={()=>setAlertModal(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.red},#e04050)`, color:"#fff" }}>
          🔔 Alert Provider
        </button>

        {/* Nav */}
        {[{l:"📝 Studio",p:"ClinicalNoteStudio"},{l:"🔬 Dx",p:"DiagnosticStewardship"},{l:"🧪 Results",p:"ResultsTab"}].map(n=>(
          <button key={n.p} onClick={()=>navigate(createPageUrl(n.p))} style={{ padding:"4px 10px", borderRadius:8, fontSize:10, fontWeight:600, cursor:"pointer", border:`1px solid ${C.border}`, background:C.edge, color:C.dim }}>
            {n.l}
          </button>
        ))}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim }}>{clock}</span>
      </nav>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <div style={{ background:C.slate, borderBottom:`1px solid ${C.border}`, padding:"6px 18px", display:"flex", gap:18, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
        {[
          { label:"HR",   val:latestVitals.hr,   unit:"bpm",  def:VITALS_DEF[0] },
          { label:"BP",   val:latestVitals.sbp ? `${latestVitals.sbp}/${latestVitals.dbp}` : "", unit:"mmHg", def:VITALS_DEF[1] },
          { label:"SpO₂", val:latestVitals.spo2, unit:"%",   def:VITALS_DEF[4] },
          { label:"Temp", val:latestVitals.temp, unit:"°F",  def:VITALS_DEF[5] },
          { label:"Pain", val:latestVitals.pain, unit:"/10", def:VITALS_DEF[6] },
          { label:"I/O",  val:`${totalIn}/${totalOut}`, unit:"mL", def:null },
        ].map(s => {
          const flag = s.def && s.val ? vFlag(s.def, s.val) : null;
          const fc = flag ? FLAG_C[flag] : null;
          return (
            <div key={s.label} style={{ display:"flex", alignItems:"baseline", gap:5 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>{s.label}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color: fc?.color || C.text, lineHeight:1 }}>{s.val||"—"}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>{s.unit}</span>
              {fc && flag!=="WNL" && <Pill color={fc.color} style={{ fontSize:7, padding:"1px 5px" }}>{fc.label}</Pill>}
            </div>
          );
        })}
        <div style={{ flex:1 }} />
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>
          ADMITTED {patient.admitted} · {patient.dx}
        </div>
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── Tab sidebar ─────────────────────────────────────────── */}
        <div style={{ width:140, flexShrink:0, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"10px 8px", gap:3 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 9px", borderRadius:10, cursor:"pointer", background: isActive?"rgba(0,212,188,.1)":"transparent", border:`1px solid ${isActive?"rgba(0,212,188,.3)":"transparent"}`, textAlign:"left", position:"relative", transition:"all .12s" }}>
                <span style={{ fontSize:14 }}>{tab.icon}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color: isActive?C.teal:C.dim, letterSpacing:".06em" }}>{tab.label.toUpperCase()}</span>
                {tab.badge && (
                  <span style={{ position:"absolute", top:4, right:6, minWidth:16, height:16, borderRadius:8, background:tab.badgeColor||C.teal, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:"#fff", padding:"0 4px" }}>{tab.badge}</span>
                )}
              </button>
            );
          })}

          {/* Patient info box */}
          <div style={{ marginTop:"auto", padding:"10px 8px", background:C.edge, borderRadius:10, border:`1px solid ${C.border}` }}>
            <Label style={{ marginBottom:6 }}>PATIENT</Label>
            {[
              ["MRN", patient.mrn],
              ["Room", `${patient.room}-${patient.bed}`],
              ["Diet", patient.diet],
              ["Iso", patient.iso],
              ["Wt", patient.weight],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted }}>{k}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.text, fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────────── */}
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <AnimatePresence mode="wait">

            {/* ════════════════ FLOWSHEET TAB ════════════════ */}
            {activeTab === "flowsheet" && (
              <motion.div key="flowsheet" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* ── Vitals table ── */}
                <Card title="VITAL SIGNS FLOWSHEET" icon="❤️" color={C.rose}>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                      <thead>
                        <tr style={{ background:C.slate }}>
                          <th style={{ padding:"6px 10px", textAlign:"left", fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".08em", borderBottom:`1px solid ${C.border}` }}>TIME</th>
                          {VITALS_DEF.map(v => (
                            <th key={v.id} style={{ padding:"6px 8px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".07em", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>
                              {v.label}<br/><span style={{ fontWeight:400, opacity:.7 }}>{v.unit}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vitalRows.map((row, ri) => (
                          <tr key={ri} style={{ background: ri%2===0 ? C.panel : "rgba(11,29,53,.5)", borderBottom:`1px solid ${C.edge}` }}>
                            <td style={{ padding:"7px 10px", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:C.text }}>{row.time}</td>
                            {VITALS_DEF.map(def => {
                              const val = row[def.id];
                              const flag = val ? vFlag(def, val) : null;
                              const fc = flag ? FLAG_C[flag] : null;
                              return (
                                <td key={def.id} style={{ padding:"7px 8px", textAlign:"center", background: fc && flag!=="WNL" ? fc.bg : "transparent", animation: flag==="CRIT" ? "pulse 1.5s infinite" : "none" }}>
                                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color: fc?.color || (val?C.text:C.muted) }}>
                                    {val || "—"}
                                  </span>
                                  {fc && flag!=="WNL" && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:fc.color, marginTop:1 }}>{fc.label}</div>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* New vitals input row */}
                        <tr style={{ background:"rgba(0,212,188,.05)", borderBottom:`1px solid ${C.border}` }}>
                          <td style={{ padding:"6px 6px" }}>
                            <input value={newVitals.time} onChange={e=>setNewVitals(p=>({...p,time:e.target.value}))} style={{ ...inputS, width:64, padding:"4px 6px", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }} />
                          </td>
                          {VITALS_DEF.map(def => (
                            <td key={def.id} style={{ padding:"6px 4px", textAlign:"center" }}>
                              <input value={newVitals[def.id]||""} onChange={e=>setNewVitals(p=>({...p,[def.id]:e.target.value}))} placeholder="—" style={{ ...inputS, width:60, padding:"4px 5px", fontSize:11, textAlign:"center", fontFamily:"'JetBrains Mono',monospace" }} />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10, gap:8 }}>
                    <Btn onClick={addVitalRow} color={C.rose} small>+ Add Vitals</Btn>
                  </div>
                </Card>

                {/* ── I/O Table ── */}
                <Card title="INTAKE & OUTPUT" icon="💧" color={C.blue} badge={`+${totalIn-totalOut}mL BALANCE`} badgeColor={totalIn-totalOut<0?C.red:C.green}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                    <div style={{ textAlign:"center", padding:"10px", background:"rgba(74,144,217,.07)", border:"1px solid rgba(74,144,217,.25)", borderRadius:10 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color:C.blue }}>{totalIn} mL</div>
                      <Label c={C.blue}>TOTAL INTAKE</Label>
                    </div>
                    <div style={{ textAlign:"center", padding:"10px", background:"rgba(244,114,182,.07)", border:"1px solid rgba(244,114,182,.25)", borderRadius:10 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color:C.rose }}>{totalOut} mL</div>
                      <Label c={C.rose}>TOTAL OUTPUT</Label>
                    </div>
                  </div>

                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                      <thead>
                        <tr>
                          {["TIME","TYPE","ROUTE","AMOUNT","IN/OUT","NOTE"].map(h=>(
                            <th key={h} style={{ padding:"5px 8px", textAlign:"left", fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.dim, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ioRows.map((row, i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${C.edge}` }}>
                            <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }}>{row.time}</td>
                            <td style={{ padding:"6px 8px", color:C.bright, fontWeight:600 }}>{row.type}</td>
                            <td style={{ padding:"6px 8px", color:C.dim }}>{row.route}</td>
                            <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:C.text }}>{row.amount} mL</td>
                            <td style={{ padding:"6px 8px" }}><Pill color={row.in_out==="IN"?C.blue:C.rose}>{row.in_out}</Pill></td>
                            <td style={{ padding:"6px 8px", color:C.dim, fontSize:11 }}>{row.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* New I/O row */}
                  <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr 80px 80px 1fr auto", gap:6, marginTop:10, alignItems:"center" }}>
                    <input value={newIO.time} onChange={e=>setNewIO(p=>({...p,time:e.target.value}))} style={{ ...inputS, padding:"5px 6px", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }} />
                    <input value={newIO.type} onChange={e=>setNewIO(p=>({...p,type:e.target.value}))} placeholder="Type (IV Fluid, Urine…)" style={{ ...inputS, padding:"5px 8px" }} />
                    <input value={newIO.route} onChange={e=>setNewIO(p=>({...p,route:e.target.value}))} placeholder="Route" style={{ ...inputS, padding:"5px 8px" }} />
                    <input value={newIO.amount} onChange={e=>setNewIO(p=>({...p,amount:e.target.value}))} placeholder="mL" type="number" style={{ ...inputS, padding:"5px 8px" }} />
                    <select value={newIO.in_out} onChange={e=>setNewIO(p=>({...p,in_out:e.target.value}))} style={{ ...inputS, cursor:"pointer" }}>
                      <option>IN</option><option>OUT</option>
                    </select>
                    <input value={newIO.note} onChange={e=>setNewIO(p=>({...p,note:e.target.value}))} placeholder="Note" style={{ ...inputS, padding:"5px 8px" }} />
                    <Btn onClick={addIORow} color={C.blue} small>+ Add</Btn>
                  </div>
                </Card>

                {/* ── Assessment ── */}
                <Card title="NURSING ASSESSMENT" icon="📋" color={C.green} badge={`${Object.values(assessments).flat().length} ITEMS`}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <Label style={{ margin:0 }}>ASSESSMENT TIME</Label>
                    <input value={assessTime} onChange={e=>setAssessTime(e.target.value)} style={{ ...inputS, width:80, padding:"4px 8px", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }} />
                  </div>

                  {/* System tabs */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
                    {Object.entries(SYSTEM_LABELS).map(([k,v]) => {
                      const count = assessments[k]?.length || 0;
                      const isActive = activeSystem === k;
                      return (
                        <button key={k} onClick={()=>setActiveSystem(k)} style={{ padding:"4px 10px", borderRadius:7, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", letterSpacing:".05em", background: isActive?"rgba(46,204,113,.12)":"transparent", border:`1px solid ${isActive?"rgba(46,204,113,.35)":C.border}`, color: isActive?C.green:C.dim }}>
                          {v} {count>0&&<span style={{ color:C.green }}>({count})</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Checkboxes for active system */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:10 }}>
                    {(ASSESS_TEMPLATES[activeSystem]||[]).map(item => {
                      const checked = assessments[activeSystem]?.includes(item);
                      return (
                        <div key={item} className="assess-chip" onClick={()=>toggleAssess(activeSystem, item)} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:8, cursor:"pointer", background: checked?"rgba(46,204,113,.1)":"transparent", border:`1px solid ${checked?"rgba(46,204,113,.35)":C.border}`, transition:"all .12s", opacity: checked?1:.7 }}>
                          <div style={{ width:14, height:14, borderRadius:4, border:`2px solid ${checked?C.green:C.muted}`, background:checked?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .12s" }}>
                            {checked && <span style={{ fontSize:9, color:C.navy, fontWeight:700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize:11, color: checked?C.bright:C.dim }}>{item}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Free text note for system */}
                  <textarea
                    value={assessNotes[activeSystem]||""}
                    onChange={e=>setAssessNotes(p=>({...p,[activeSystem]:e.target.value}))}
                    rows={2} placeholder={`Additional ${SYSTEM_LABELS[activeSystem]} notes…`}
                    style={{ ...inputS, resize:"vertical", lineHeight:1.6 }}
                  />
                </Card>

              </motion.div>
            )}

            {/* ════════════════ CHAT TAB ════════════════ */}
            {activeTab === "chat" && (
              <motion.div key="chat" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

                {/* Messages */}
                <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>
                  {chatMessages.map((msg, i) => {
                    const isNurse = msg.role === "nurse";
                    const isAlert = msg.type === "alert";
                    const pc = isAlert ? PRIORITY_C[msg.priority] : null;
                    return (
                      <motion.div key={msg.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i<3?0:.05}} style={{ display:"flex", flexDirection:isNurse?"row-reverse":"row", gap:10, marginBottom:18, alignItems:"flex-start" }}>
                        {/* Avatar */}
                        <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: isNurse?"rgba(0,212,188,.12)":"rgba(74,144,217,.12)", border:`1.5px solid ${isNurse?"rgba(0,212,188,.35)":"rgba(74,144,217,.35)"}`, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:isNurse?C.teal:C.blue, marginTop:2 }}>
                          {isNurse ? "RN" : "MD"}
                        </div>
                        {/* Bubble */}
                        <div style={{ maxWidth:"72%" }}>
                          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginBottom:4, textAlign:isNurse?"right":"left" }}>
                            {msg.sender} · {msg.time}
                          </div>
                          <div className="chat-bubble" style={{
                            padding:"11px 14px", borderRadius: isNurse?"14px 4px 14px 14px":"4px 14px 14px 14px",
                            background: isAlert ? pc.bg : isNurse?"rgba(0,212,188,.09)":C.panel,
                            border:`1px solid ${isAlert?pc.border:isNurse?"rgba(0,212,188,.28)":C.border}`,
                            position:"relative",
                          }}>
                            {isAlert && (
                              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:pc.color, marginBottom:5 }}>
                                ⚡ PROVIDER ALERT — {msg.priority}
                              </div>
                            )}
                            <div style={{ fontSize:13, color:C.bright, lineHeight:1.7 }}>{msg.text}</div>
                            {msg.files?.length > 0 && (
                              <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:6 }}>
                                {msg.files.map((f,fi) => (
                                  <div key={fi} style={{ display:"flex", gap:6, alignItems:"center", padding:"4px 10px", borderRadius:8, background:C.edge, border:`1px solid ${C.border}` }}>
                                    <span style={{ fontSize:14 }}>{f.type?.includes("image")?"🖼️":"📄"}</span>
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:600, color:C.bright }}>{f.name}</div>
                                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.dim }}>{f.size}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {msg.urgent && (
                              <div style={{ position:"absolute", top:-6, right:isNurse?"auto":10, left:isNurse?10:"auto", padding:"1px 7px", borderRadius:6, background:C.red, fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:"#fff" }}>URGENT</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input area */}
                <div style={{ background:"rgba(11,29,53,.96)", borderTop:`1px solid ${C.border}`, padding:"12px 16px", flexShrink:0 }}>
                  {chatFiles.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                      {chatFiles.map((f,i) => (
                        <div key={i} style={{ display:"flex", gap:6, alignItems:"center", padding:"4px 10px", borderRadius:8, background:C.edge, border:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:13 }}>{f.type?.includes("image")?"🖼️":"📄"}</span>
                          <span style={{ fontSize:11, color:C.bright }}>{f.name}</span>
                          <span style={{ fontSize:11, color:C.dim }}>({(f.size/1024).toFixed(0)}KB)</span>
                          <button onClick={()=>setChatFiles(p=>p.filter((_,j)=>j!==i))} style={{ fontSize:11, background:"none", border:"none", color:C.muted, cursor:"pointer" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                    <button onClick={()=>fileInputRef.current?.click()} style={{ padding:"9px 10px", borderRadius:10, border:`1px solid ${C.border}`, background:C.edge, color:C.dim, cursor:"pointer", fontSize:14, flexShrink:0, transition:"all .15s" }}>
                      📎
                    </button>
                    <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display:"none" }} onChange={e=>setChatFiles(prev=>[...prev,...Array.from(e.target.files||[])])} />
                    <div style={{ flex:1, background:C.edge, border:`1px solid ${chatInput.length>0?"#4a729988":C.border}`, borderRadius:12, padding:"10px 14px", transition:"border-color .15s" }}>
                      <textarea
                        value={chatInput}
                        onChange={e=>setChatInput(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();} }}
                        placeholder="Message Dr. Rivera… (Enter to send, Shift+Enter for newline)"
                        rows={1} style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:C.bright, fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.6, resize:"none", minHeight:22, maxHeight:100, overflowY:"auto" }}
                        onInput={e=>{ e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
                      />
                    </div>
                    <button onClick={sendChat} disabled={sending||(!chatInput.trim()&&chatFiles.length===0)} style={{ width:42, height:42, borderRadius:11, border:"none", cursor:"pointer", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy, fontSize:18, fontWeight:700, flexShrink:0, transition:"all .15s", opacity:sending||(!chatInput.trim()&&chatFiles.length===0)?0.45:1 }}>↑</button>
                  </div>
                  <div style={{ textAlign:"center", marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted }}>
                    SECURE INTERNAL MESSAGING · HIPAA COMPLIANT · FILES UP TO 25MB
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════ ALERTS TAB ════════════════ */}
            {activeTab === "alerts" && (
              <motion.div key="alerts" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>

                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright }}>Provider Alerts</div>
                  <div style={{ flex:1 }} />
                  <button onClick={()=>setAlertModal(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.red},#e04050)`, color:"#fff" }}>
                    🔔 New Alert
                  </button>
                </div>

                {/* Quick-fire grid */}
                <div style={{ marginBottom:20 }}>
                  <Label>QUICK ALERT — TAP TO OPEN</Label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                    {QUICK_ALERTS.map(qa => (
                      <div key={qa.id} onClick={()=>{ setAlertType(qa.id); setAlertPriority(qa.priority); setAlertModal(true); }} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:11, padding:"12px 10px", cursor:"pointer", textAlign:"center", transition:"all .15s" }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=`${qa.color}55`;e.currentTarget.style.background=`${qa.color}0a`;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.panel;}}>
                        <div style={{ fontSize:22, marginBottom:6 }}>{qa.icon}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:C.text, marginBottom:3 }}>{qa.label}</div>
                        <Pill color={PRIORITY_C[qa.priority].color} style={{ fontSize:7 }}>{qa.priority}</Pill>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert log */}
                <Card title="ALERT LOG" icon="📋" color={C.amber}>
                  {alerts.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:12 }}>No alerts yet.</div>
                  ) : (
                    alerts.map((a, i) => {
                      const pc = PRIORITY_C[a.priority];
                      return (
                        <div key={a.id} style={{ padding:"12px 14px", borderRadius:10, background: a.acknowledged?"transparent":pc.bg, border:`1px solid ${a.acknowledged?C.border:pc.border}`, marginBottom:8, transition:"all .15s" }}>
                          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                            <span style={{ fontSize:18, flexShrink:0 }}>{a.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                                <Pill color={pc.color}>{a.priority}</Pill>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.text }}>{a.label}</span>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginLeft:"auto" }}>{a.time}</span>
                              </div>
                              <div style={{ fontSize:12, color:C.text, lineHeight:1.65 }}>{a.text}</div>
                              {a.acknowledged && (
                                <div style={{ marginTop:5, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.green }}>
                                  ✓ Acknowledged by {a.ackBy} at {a.ackTime}
                                </div>
                              )}
                            </div>
                            {!a.acknowledged && (
                              <button onClick={()=>setAlerts(p=>p.map(al=>al.id===a.id?{...al,acknowledged:true,ackBy:"Dr. Rivera",ackTime:nowStr()}:al))} style={{ padding:"4px 10px", borderRadius:7, fontSize:10, fontWeight:700, cursor:"pointer", border:`1px solid ${C.green}44`, background:"rgba(46,204,113,.1)", color:C.green, flexShrink:0 }}>Mark Ack'd</button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </Card>
              </motion.div>
            )}

            {/* ════════════════ ORDERS TAB ════════════════ */}
            {activeTab === "orders" && (
              <motion.div key="orders" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>

                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright }}>Active Orders</div>
                  {pendingOrders > 0 && (
                    <div style={{ padding:"4px 12px", borderRadius:8, background:"rgba(245,166,35,.12)", border:"1px solid rgba(245,166,35,.3)", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.amber, animation:"pulse 1.8s infinite" }}>
                      {pendingOrders} PENDING ACTION
                    </div>
                  )}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {orders.map((order) => {
                    const pc = PRIORITY_C[order.priority];
                    const isDone = order.status === "completed" || order.status === "acknowledged";
                    return (
                      <div key={order.id} className="order-row" style={{ background:C.panel, border:`1px solid ${isDone?C.border:pc.border}`, borderRadius:12, padding:"13px 16px", transition:"all .15s" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                          {/* Status icon */}
                          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: isDone?"rgba(46,204,113,.12)":pc.bg, border:`1.5px solid ${isDone?"rgba(46,204,113,.3)":pc.border}`, marginTop:2 }}>
                            <span style={{ fontSize:14 }}>{isDone?"✓":"!"}</span>
                          </div>

                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                              <Pill color={isDone?C.green:pc.color}>{isDone?"DONE":order.priority}</Pill>
                              <Pill color={C.blue} style={{ fontSize:7 }}>{order.type.toUpperCase()}</Pill>
                              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>Ordered {order.time} · {order.provider}</span>
                            </div>
                            <div style={{ fontSize:13, fontWeight:600, color:C.bright, lineHeight:1.6 }}>{order.text}</div>
                            {order.notes && <div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{order.notes}</div>}
                            {order.ackBy && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.green, marginTop:4 }}>✓ Acknowledged by {order.ackBy} at {order.ackTime}</div>}

                            {/* Note input */}
                            {!isDone && (
                              <div style={{ marginTop:8, display:"flex", gap:8 }}>
                                <input value={orderNote[order.id]||""} onChange={e=>setOrderNote(p=>({...p,[order.id]:e.target.value}))} placeholder="Add note or clarification…" style={{ ...inputS, fontSize:11, padding:"5px 9px" }} />
                              </div>
                            )}
                          </div>

                          {!isDone && (
                            <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                              <Btn onClick={()=>ackOrder(order.id)} color={C.green} small>✓ Acknowledge</Btn>
                              <Btn onClick={()=>{ setChatInput(`Re: Order — ${order.text}. `); setActiveTab("chat"); }} color={C.blue} small>💬 Message MD</Btn>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ════════════════ LABS & MEDS TAB ════════════════ */}
            {activeTab === "labs" && (
              <motion.div key="labs" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* Lab Entry */}
                <Card title="ADD LAB RESULT" icon="🧪" color={C.teal} badge="Critical values auto-alert provider">
                  <div style={{ display:"grid", gridTemplateColumns:"100px 1fr 90px 90px 1fr auto", gap:8, alignItems:"end", marginBottom:12 }}>
                    <div><Label>TIME</Label><input value={newLab.time} onChange={e=>setNewLab(p=>({...p,time:e.target.value}))} style={inputS} /></div>
                    <div><Label>TEST NAME</Label><input value={newLab.name} onChange={e=>setNewLab(p=>({...p,name:e.target.value}))} placeholder="Troponin I, WBC, BMP…" style={inputS} /></div>
                    <div><Label>VALUE</Label><input value={newLab.value} onChange={e=>setNewLab(p=>({...p,value:e.target.value}))} placeholder="Result" style={inputS} /></div>
                    <div><Label>UNITS</Label><input value={newLab.units} onChange={e=>setNewLab(p=>({...p,units:e.target.value}))} placeholder="ng/mL, K/µL…" style={inputS} /></div>
                    <div><Label>REF RANGE</Label><input value={newLab.ref} onChange={e=>setNewLab(p=>({...p,ref:e.target.value}))} placeholder="0.00–0.04" style={inputS} /></div>
                    <div style={{ display:"flex", gap:6, alignItems:"flex-end" }}>
                      <div>
                        <Label>FLAG</Label>
                        <select value={newLab.flag} onChange={e=>setNewLab(p=>({...p,flag:e.target.value}))} style={{ ...inputS, cursor:"pointer" }}>
                          <option value="WNL">WNL</option>
                          <option value="LOW">↓ Low</option>
                          <option value="HIGH">↑ High</option>
                          <option value="CRIT">⚡ Critical</option>
                          <option value="PANIC">🚨 Panic</option>
                        </select>
                      </div>
                      <Btn onClick={addLab} color={C.teal} small>+ Add</Btn>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {labs.map(l => {
                      const fc = {WNL:{c:C.green,bg:"rgba(46,204,113,.08)"},LOW:{c:C.amber,bg:"rgba(245,166,35,.1)"},HIGH:{c:C.amber,bg:"rgba(245,166,35,.1)"},CRIT:{c:C.red,bg:"rgba(255,92,108,.12)"},PANIC:{c:C.red,bg:"rgba(255,92,108,.18)"}}[l.flag]||{c:C.dim,bg:"transparent"};
                      return (
                        <div key={l.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", borderRadius:9, background:fc.bg, border:`1px solid ${fc.c}30` }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim, flexShrink:0 }}>{l.time}</span>
                          <span style={{ fontWeight:700, color:C.bright, fontSize:13, flex:1 }}>{l.name}</span>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:fc.c }}>{l.value} {l.units}</span>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>Ref: {l.ref||"—"}</span>
                          <Pill color={fc.c}>{l.flag}</Pill>
                        </div>
                      );
                    })}
                    {labs.length === 0 && <div style={{ textAlign:"center", padding:"12px", color:C.muted, fontSize:12 }}>No labs added yet.</div>}
                  </div>
                </Card>

                {/* MAR */}
                <Card title="MEDICATION ADMINISTRATION RECORD (MAR)" icon="💊" color={C.purple}>
                  <div style={{ display:"grid", gridTemplateColumns:"100px 1fr 100px 80px 1fr auto", gap:8, alignItems:"end", marginBottom:12 }}>
                    <div><Label>TIME</Label><input value={newMed.time} onChange={e=>setNewMed(p=>({...p,time:e.target.value}))} style={inputS} /></div>
                    <div><Label>MEDICATION</Label><input value={newMed.name} onChange={e=>setNewMed(p=>({...p,name:e.target.value}))} placeholder="Drug name and dose…" style={inputS} /></div>
                    <div>
                      <Label>ROUTE</Label>
                      <select value={newMed.route} onChange={e=>setNewMed(p=>({...p,route:e.target.value}))} style={{ ...inputS, cursor:"pointer" }}>
                        {["IV Push","IV Infusion","PO","SQ","IM","Topical","Other"].map(r=><option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div><Label>DOSE</Label><input value={newMed.dose} onChange={e=>setNewMed(p=>({...p,dose:e.target.value}))} placeholder="Dose" style={inputS} /></div>
                    <div><Label>NOTE / RESPONSE</Label><input value={newMed.note} onChange={e=>setNewMed(p=>({...p,note:e.target.value}))} placeholder="Patient tolerance, response…" style={inputS} /></div>
                    <Btn onClick={addMed} color={C.purple} small style={{ marginBottom:1 }}>+ Give</Btn>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {meds.map(m => (
                      <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", borderRadius:9, background:"rgba(155,109,255,.06)", border:"1px solid rgba(155,109,255,.2)" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim, flexShrink:0 }}>{m.time}</span>
                        <span style={{ fontWeight:700, color:C.bright, fontSize:13, flex:1 }}>{m.name}{m.dose ? ` — ${m.dose}` : ""}</span>
                        <Pill color={C.purple}>{m.route}</Pill>
                        {m.note && <span style={{ fontSize:11, color:C.dim }}>{m.note}</span>}
                      </div>
                    ))}
                    {meds.length === 0 && <div style={{ textAlign:"center", padding:"12px", color:C.muted, fontSize:12 }}>No medications given this shift.</div>}
                  </div>
                </Card>

                {/* Nurse Findings */}
                <Card title="NURSE FINDINGS & NOTES" icon="📌" color={C.amber}>
                  <div style={{ display:"grid", gridTemplateColumns:"100px 1fr auto auto", gap:8, alignItems:"end", marginBottom:12 }}>
                    <div><Label>TIME</Label><input value={newFinding.time} onChange={e=>setNewFinding(p=>({...p,time:e.target.value}))} style={inputS} /></div>
                    <div><Label>FINDING / NOTE</Label><input value={newFinding.text} onChange={e=>setNewFinding(p=>({...p,text:e.target.value}))} placeholder="Describe finding, change, or note…" style={inputS} /></div>
                    <div>
                      <Label>ALERT MD</Label>
                      <select value={newFinding.alertMD} onChange={e=>setNewFinding(p=>({...p,alertMD:e.target.value}))} style={{ ...inputS, cursor:"pointer" }}>
                        <option value="no">No</option>
                        <option value="routine">Yes — Routine</option>
                        <option value="urgent">Yes — Urgent</option>
                      </select>
                    </div>
                    <Btn onClick={addFinding} color={C.amber} small style={{ marginBottom:1 }}>+ Add</Btn>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {findings.map(f => (
                      <div key={f.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", borderRadius:9, background: f.alertMD!=="no"?"rgba(245,166,35,.07)":C.panel, border:`1px solid ${f.alertMD!=="no"?"rgba(245,166,35,.28)":C.border}` }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim, flexShrink:0 }}>{f.time}</span>
                        <span style={{ fontSize:13, color:C.text, flex:1 }}>{f.text}</span>
                        {f.alertMD !== "no" && <Pill color={C.amber}>MD ALERTED</Pill>}
                      </div>
                    ))}
                    {findings.length === 0 && <div style={{ textAlign:"center", padding:"12px", color:C.muted, fontSize:12 }}>No findings added yet.</div>}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ════════════════ CRASH CART TAB ════════════════ */}
            {activeTab === "crashcart" && (
              <motion.div key="crashcart" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright }}>Crash Cart Inventory</div>
                  {restockNeeded.length > 0 && (
                    <div style={{ padding:"4px 12px", borderRadius:8, background:"rgba(255,92,108,.12)", border:"1px solid rgba(255,92,108,.3)", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.red, animation:"pulse 1.8s infinite" }}>
                      {restockNeeded.length} ITEM{restockNeeded.length>1?"S":""} NEED RESTOCK
                    </div>
                  )}
                </div>

                {/* Restock alerts */}
                {restockNeeded.length > 0 && (
                  <Card title="RESTOCK REQUIRED" icon="⚠️" color={C.red}>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {restockNeeded.map(item => (
                        <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:9, background:"rgba(255,92,108,.08)", border:"1px solid rgba(255,92,108,.25)" }}>
                          <span style={{ fontSize:18 }}>🚨</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, color:C.bright, fontSize:13 }}>{item.name}</div>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted, marginTop:2 }}>
                              {item.location} · Current: {item.qtyAfterUse} / Min: {item.minQty}
                            </div>
                          </div>
                          <Btn onClick={()=>restockItem(item.id)} color={C.green} small>✓ Mark Restocked</Btn>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Log usage */}
                <Card title="LOG CRASH CART USAGE" icon="📝" color={C.amber}>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 80px 2fr 1fr auto", gap:8, alignItems:"end", marginBottom:12 }}>
                    <div>
                      <Label>ITEM USED</Label>
                      <select value={newUsage.itemId||""} onChange={e=>setNewUsage(p=>({...p,itemId:e.target.value}))} style={{ ...inputS, cursor:"pointer" }}>
                        <option value="">Select item…</option>
                        {crashCartItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.qty} available)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>QTY</Label>
                      <input value={newUsage.qty} onChange={e=>setNewUsage(p=>({...p,qty:e.target.value}))} type="number" min="1" style={inputS} />
                    </div>
                    <div>
                      <Label>EVENT / REASON</Label>
                      <input value={newUsage.event} onChange={e=>setNewUsage(p=>({...p,event:e.target.value}))} placeholder="Code Blue, Rapid Response…" style={inputS} />
                    </div>
                    <div>
                      <Label>NOTE</Label>
                      <input value={newUsage.note} onChange={e=>setNewUsage(p=>({...p,note:e.target.value}))} placeholder="Optional note…" style={inputS} />
                    </div>
                    <Btn onClick={logCrashCartUsage} color={C.amber} small style={{ marginBottom:1 }}>+ Log Use</Btn>
                  </div>

                  {/* Recent usage log */}
                  {usageLog.length > 0 && (
                    <div style={{ marginTop:12 }}>
                      <Label style={{ marginBottom:8 }}>RECENT USAGE</Label>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {usageLog.slice(0,5).map(log => (
                          <div key={log.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, background: log.event==="RESTOCKED"?"rgba(46,204,113,.06)":"rgba(245,166,35,.06)", border:`1px solid ${log.event==="RESTOCKED"?"rgba(46,204,113,.2)":"rgba(245,166,35,.2)"}` }}>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, flexShrink:0 }}>{log.time}</span>
                            <span style={{ fontWeight:700, fontSize:12, color:C.bright, flex:1 }}>{log.itemName}</span>
                            {log.event !== "RESTOCKED" && <Pill color={C.amber}>−{log.qty}</Pill>}
                            {log.event && <span style={{ fontSize:11, color:C.dim }}>{log.event}</span>}
                            {log.note && <span style={{ fontSize:10, color:C.muted, fontStyle:"italic" }}>{log.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Inventory grid by category */}
                {["Medication", "Supply"].map(cat => {
                  const items = crashCartItems.filter(i => i.category === cat);
                  return (
                    <Card key={cat} title={`${cat.toUpperCase()} INVENTORY`} icon={cat==="Medication"?"💊":"📦"} color={cat==="Medication"?C.purple:C.blue}>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
                        {items.map(item => {
                          const isLow = item.qty <= item.minQty;
                          const pct = Math.min(100, (item.qty / (item.qty + item.used)) * 100);
                          return (
                            <div key={item.id} style={{ padding:"12px", borderRadius:10, background: isLow?"rgba(255,92,108,.08)":C.edge, border:`1px solid ${isLow?"rgba(255,92,108,.3)":C.border}`, transition:"all .15s" }}>
                              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontWeight:700, fontSize:12, color:C.bright, lineHeight:1.3 }}>{item.name}</div>
                                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:2 }}>{item.location}</div>
                                </div>
                                {isLow && <span style={{ fontSize:16, marginLeft:4 }}>⚠️</span>}
                              </div>

                              {/* Progress bar */}
                              <div style={{ height:6, borderRadius:3, background:C.border, overflow:"hidden", marginBottom:8 }}>
                                <div style={{ height:"100%", width:`${pct}%`, background: isLow?C.red:C.green, transition:"width .3s" }} />
                              </div>

                              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color: isLow?C.red:C.text }}>
                                  {item.qty} / {item.minQty} min
                                </div>
                                {item.used > 0 && <Pill color={C.amber} style={{ fontSize:7 }}>−{item.used} USED</Pill>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}

                {/* Full usage history */}
                {usageLog.length > 5 && (
                  <Card title="COMPLETE USAGE HISTORY" icon="📜" color={C.dim}>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      {usageLog.map(log => (
                        <div key={log.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px", borderRadius:7, background:C.edge, fontSize:11 }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, flexShrink:0 }}>{log.time}</span>
                          <span style={{ fontWeight:600, color:C.text, flex:1 }}>{log.itemName}</span>
                          {log.event !== "RESTOCKED" && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.amber }}>−{log.qty}</span>}
                          <span style={{ fontSize:10, color:C.muted }}>{log.event}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

              </motion.div>
            )}

            {/* ════════════════ AI SUMMARY TAB ════════════════ */}
            {activeTab === "summary" && (
              <motion.div key="summary" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, display:"flex", overflow:"hidden" }}>

                {/* Left: templates */}
                <div style={{ width:220, flexShrink:0, borderRight:`1px solid ${C.border}`, padding:"14px 10px", overflowY:"auto" }}>
                  <Label style={{ marginBottom:10 }}>NOTE TEMPLATES</Label>
                  {NOTE_TEMPLATES.map(tmpl => (
                    <div key={tmpl.id} onClick={()=>{ setActiveTemplate(tmpl.id); setGeneratedNote(""); setTemplateFields({}); }} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 9px", borderRadius:10, cursor:"pointer", marginBottom:4, background: activeTemplate===tmpl.id?"rgba(0,212,188,.09)":"transparent", border:`1px solid ${activeTemplate===tmpl.id?"rgba(0,212,188,.3)":C.border}`, transition:"all .12s" }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{tmpl.icon}</span>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color: activeTemplate===tmpl.id?C.teal:C.text, lineHeight:1.3 }}>{tmpl.label}</div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted, marginTop:2 }}>{tmpl.fields.length} FIELDS</div>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop:16, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
                    <Label style={{ marginBottom:10 }}>SHIFT SUMMARY</Label>
                    <Btn onClick={generateAISummary} disabled={genSummary} color={C.purple} style={{ width:"100%", marginBottom:8 }}>
                      {genSummary ? <span style={{ display:"flex",alignItems:"center",gap:6,justifyContent:"center" }}><div style={{ width:12,height:12,border:`2px solid ${C.purple}44`,borderTopColor:C.purple,borderRadius:"50%",animation:"spin .7s linear infinite" }} />Generating…</span> : "✦ Generate SBAR"}
                    </Btn>
                    <div style={{ fontSize:10, color:C.muted, lineHeight:1.5 }}>AI will synthesize vitals, assessments, alerts, and orders into a structured SBAR note.</div>
                  </div>
                </div>

                {/* Right: content */}
                <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>

                  {/* SBAR AI summary */}
                  {(genSummary || aiSummary) && (
                    <Card title="AI-GENERATED SBAR SUMMARY" icon="✦" color={C.purple} style={{ marginBottom:16 }}>
                      {genSummary ? (
                        <div style={{ padding:"8px 0" }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
                            <div style={{ width:14,height:14,border:`2px solid ${C.purple}44`,borderTopColor:C.purple,borderRadius:"50%",animation:"spin .7s linear infinite" }} />
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.purple }}>ANALYZING PATIENT DATA…</span>
                          </div>
                          {[80,65,90,55,75,60].map((w,i)=>(
                            <div key={i} style={{ height:11,borderRadius:6,marginBottom:8,width:`${w}%`,background:`linear-gradient(90deg,${C.edge} 0%,${C.muted}44 50%,${C.edge} 100%)`,backgroundSize:"400px 100%",animation:`shimmer 1.4s infinite ${i*.1}s` }} />
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div style={{ background:"rgba(155,109,255,.05)", border:"1px solid rgba(155,109,255,.2)", borderRadius:10, padding:"12px 14px", lineHeight:1.8, fontSize:13, color:C.text, whiteSpace:"pre-wrap" }}>
                            {aiSummary}
                          </div>
                          <div style={{ display:"flex", gap:8, marginTop:10, justifyContent:"flex-end" }}>
                            <Btn onClick={()=>navigator.clipboard.writeText(aiSummary)} color={C.blue} small>📋 Copy</Btn>
                            <Btn onClick={generateAISummary} color={C.purple} small>↻ Regenerate</Btn>
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Template form */}
                  {activeTemplate && (() => {
                    const tmpl = NOTE_TEMPLATES.find(t => t.id === activeTemplate);
                    return (
                      <Card title={tmpl.label.toUpperCase()} icon={tmpl.icon} color={C.teal}>
                        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
                          {tmpl.fields.map(field => (
                            <div key={field}>
                              <Label>{field.replace(/_/g," ").toUpperCase()}</Label>
                              <textarea
                                value={templateFields[field]||""}
                                onChange={e=>setTemplateFields(p=>({...p,[field]:e.target.value}))}
                                rows={2} placeholder={`Enter ${field.replace(/_/g," ")}…`}
                                style={{ ...inputS, resize:"vertical", lineHeight:1.6 }}
                              />
                            </div>
                          ))}
                        </div>
                        <Btn onClick={generateTemplateNote} disabled={generatingNote} color={C.teal} style={{ width:"100%" }}>
                          {generatingNote ? <span style={{ display:"flex",alignItems:"center",gap:6,justifyContent:"center" }}><div style={{ width:12,height:12,border:"2px solid #00d4bc44",borderTopColor:C.teal,borderRadius:"50%",animation:"spin .7s linear infinite" }} />Generating Note…</span> : `✦ Generate ${tmpl.label}`}
                        </Btn>

                        {generatedNote && (
                          <div style={{ marginTop:12 }}>
                            <div style={{ background:"rgba(0,212,188,.05)", border:"1px solid rgba(0,212,188,.2)", borderRadius:10, padding:"14px 16px", lineHeight:1.8, fontSize:13, color:C.text, whiteSpace:"pre-wrap", maxHeight:400, overflowY:"auto" }}>
                              {generatedNote}
                            </div>
                            <div style={{ display:"flex", gap:8, marginTop:10, justifyContent:"flex-end" }}>
                              <Btn onClick={()=>navigator.clipboard.writeText(generatedNote)} color={C.blue} small>📋 Copy Note</Btn>
                              <Btn onClick={generateTemplateNote} color={C.teal} small>↻ Regenerate</Btn>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })()}

                  {!activeTemplate && !aiSummary && !genSummary && (
                    <div style={{ textAlign:"center", padding:"48px 20px" }}>
                      <div style={{ fontSize:48, marginBottom:16, opacity:.12 }}>✦</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:C.bright, marginBottom:8 }}>AI Documentation Assistant</div>
                      <div style={{ fontSize:13, color:C.muted, lineHeight:1.75, maxWidth:400, margin:"0 auto" }}>
                        Select a note template from the left to generate AI-assisted documentation, or click <strong style={{color:C.purple}}>Generate SBAR</strong> for a complete shift summary.
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── ALERT MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {alertModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500 }} onClick={()=>setAlertModal(false)}>
            <motion.div initial={{scale:.95,opacity:0,y:10}} animate={{scale:1,opacity:1,y:0}} exit={{scale:.95,opacity:0}} transition={{duration:.18}} onClick={e=>e.stopPropagation()} style={{ background:C.slate, border:`1px solid ${C.border}`, borderRadius:18, padding:"24px", width:"100%", maxWidth:520, boxShadow:"0 24px 64px rgba(0,0,0,.5)" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:C.bright, marginBottom:4 }}>Alert Provider</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginBottom:18, letterSpacing:".08em" }}>THIS WILL NOTIFY {patient.provider.toUpperCase()} IMMEDIATELY</div>

              {/* Alert type */}
              <Label style={{ marginBottom:8 }}>ALERT TYPE</Label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:7, marginBottom:14 }}>
                {QUICK_ALERTS.map(qa => (
                  <div key={qa.id} onClick={()=>{ setAlertType(qa.id); setAlertPriority(qa.priority); }} style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 10px", borderRadius:9, cursor:"pointer", background: alertType===qa.id?`${qa.color}12`:"transparent", border:`1px solid ${alertType===qa.id?`${qa.color}55`:C.border}`, transition:"all .12s" }}>
                    <span style={{ fontSize:16 }}>{qa.icon}</span>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color: alertType===qa.id?qa.color:C.text }}>{qa.label}</div>
                      <Pill color={PRIORITY_C[qa.priority].color} style={{ fontSize:7, marginTop:2 }}>{qa.priority}</Pill>
                    </div>
                  </div>
                ))}
              </div>

              {/* Priority override */}
              <Label style={{ marginBottom:6 }}>PRIORITY</Label>
              <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                {["CRITICAL","URGENT","ROUTINE"].map(p => (
                  <button key={p} onClick={()=>setAlertPriority(p)} style={{ flex:1, padding:"6px", borderRadius:8, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", background: alertPriority===p?`${PRIORITY_C[p].color}18`:"transparent", border:`1px solid ${alertPriority===p?PRIORITY_C[p].color:C.border}`, color: alertPriority===p?PRIORITY_C[p].color:C.muted }}>
                    {p}
                  </button>
                ))}
              </div>

              {/* Message */}
              <Label style={{ marginBottom:6 }}>MESSAGE TO PROVIDER</Label>
              <textarea
                value={alertText}
                onChange={e=>setAlertText(e.target.value)}
                rows={4} placeholder="Describe the clinical finding, values, or concern…"
                style={{ ...inputS, resize:"vertical", lineHeight:1.7, marginBottom:16 }}
                autoFocus
              />

              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={fireAlert} disabled={!alertText.trim()||!alertType} color={C.red} style={{ flex:1 }}>🔔 Send Alert to {patient.provider}</Btn>
                <Btn onClick={()=>setAlertModal(false)} color={C.dim} style={{ padding:"7px 18px" }}>Cancel</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
      `}</style>
    </div>
  );
}