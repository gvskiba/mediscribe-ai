import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Color tokens — identical to the rest of Notrya ─────────────────
const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040", indigo:"#6366f1",
};

// ── Order category config ──────────────────────────────────────────
const ORDER_CATS = [
  { id:"labs",     label:"Laboratory",   icon:"🧪", color:C.teal   },
  { id:"imaging",  label:"Imaging",      icon:"🔬", color:C.blue   },
  { id:"meds",     label:"Medications",  icon:"💊", color:C.amber  },
  { id:"consults", label:"Consults",     icon:"👨‍⚕️", color:C.purple },
  { id:"nursing",  label:"Nursing",      icon:"📋", color:C.green  },
  { id:"procedures",label:"Procedures",  icon:"⚕️", color:C.rose   },
];

// ── Priority config ────────────────────────────────────────────────
const PRIORITY = {
  critical: { label:"CRITICAL",  color:C.red,    bg:"rgba(255,92,108,.13)"  },
  high:     { label:"HIGH",      color:C.amber,  bg:"rgba(245,166,35,.12)"  },
  routine:  { label:"ROUTINE",   color:C.green,  bg:"rgba(46,204,113,.1)"   },
  prn:      { label:"PRN",       color:C.dim,    bg:"rgba(74,144,217,.08)"  },
};

// ── ROS system quick-toggles ───────────────────────────────────────
const ROS_SYSTEMS = [
  { id:"constitutional", label:"Constitutional", symptoms:["Fever","Chills","Fatigue","Weight loss","Night sweats","Malaise"] },
  { id:"cardiovascular", label:"Cardiovascular", symptoms:["Chest pain","Palpitations","Syncope","Edema","Orthopnea","PND"] },
  { id:"respiratory",    label:"Respiratory",    symptoms:["Dyspnea","Cough","Hemoptysis","Wheezing","Pleuritic pain"] },
  { id:"gastrointestinal",label:"GI",            symptoms:["Nausea","Vomiting","Abdominal pain","Diarrhea","Melena","Hematochezia"] },
  { id:"genitourinary",  label:"GU",             symptoms:["Dysuria","Frequency","Hematuria","Flank pain","Discharge"] },
  { id:"neurological",   label:"Neuro",          symptoms:["Headache","Focal weakness","Vision change","Dizziness","AMS","Seizure"] },
  { id:"musculoskeletal",label:"MSK",            symptoms:["Joint pain","Swelling","Trauma","Back pain"] },
];

// ── PE systems ─────────────────────────────────────────────────────
const PE_SYSTEMS = [
  "General","HEENT","Cardiovascular","Pulmonary","Abdomen","Neurological","Extremities","Skin",
];

// ── Shared components ──────────────────────────────────────────────
const Label = ({ children, style={} }) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".1em", marginBottom:5, ...style }}>
    {children}
  </div>
);

const inputS = {
  width:"100%", background:C.edge, border:`1px solid ${C.border}`, borderRadius:9,
  padding:"8px 11px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
};
const taS = { ...inputS, resize:"vertical", lineHeight:1.65, display:"block" };

function Card({ title, icon, badge, badgeColor=C.blue, children, style={} }) {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", ...style }}>
      <div style={{ padding:"9px 14px", background:"rgba(0,0,0,.18)", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
        {icon && <span style={{ fontSize:13 }}>{icon}</span>}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.dim, letterSpacing:".1em", flex:1 }}>{title}</span>
        {badge && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:7, background:`${badgeColor}18`, border:`1px solid ${badgeColor}44`, color:badgeColor }}>{badge}</span>}
      </div>
      <div style={{ padding:"13px 14px" }}>{children}</div>
    </div>
  );
}

// ── Order Item with checkbox ───────────────────────────────────────
function OrderItem({ order, selected, onToggle, catColor }) {
  const pr = PRIORITY[order.priority] || PRIORITY.routine;
  return (
    <motion.div
      layout
      initial={{ opacity:0, x:10 }}
      animate={{ opacity:1, x:0 }}
      transition={{ duration:.15 }}
      onClick={() => onToggle(order.id)}
      style={{
        display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px",
        borderRadius:11, cursor:"pointer", transition:"all .15s", marginBottom:6,
        background: selected ? `${catColor}0c` : C.edge,
        border: `1px solid ${selected ? catColor+"55" : C.border}`,
      }}
    >
      <div style={{
        width:18, height:18, borderRadius:5, flexShrink:0, marginTop:1,
        background: selected ? catColor : "transparent",
        border: `2px solid ${selected ? catColor : C.muted}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all .15s",
      }}>
        {selected && <span style={{ fontSize:10, color:C.navy, fontWeight:700, lineHeight:1 }}>✓</span>}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, fontWeight:600, color: selected ? C.bright : C.text }}>{order.name}</span>
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 6px",
            borderRadius:5, background:pr.bg, color:pr.color,
            border:`1px solid ${pr.color}33`, flexShrink:0,
          }}>{pr.label}</span>
          {order.guideline && (
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, padding:"2px 6px",
              borderRadius:5, background:"rgba(74,144,217,.1)", color:C.blue,
              border:"1px solid rgba(74,144,217,.25)", flexShrink:0,
            }}>{order.guideline}</span>
          )}
        </div>
        <div style={{ fontSize:11, color:C.dim, lineHeight:1.55, marginBottom: order.rationale ? 4 : 0 }}>
          {order.indication}
        </div>
        {order.rationale && (
          <div style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted,
            padding:"4px 8px", borderRadius:6, background:"rgba(0,0,0,.15)",
            borderLeft:`2px solid ${catColor}55`, marginTop:4,
          }}>
            {order.rationale}
          </div>
        )}
        {order.dose && (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:catColor, marginTop:4, fontWeight:600 }}>
            {order.dose}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Loading shimmer ────────────────────────────────────────────────
function AIThinking() {
  const lines = [85, 70, 90, 55, 75, 60, 80, 50];
  return (
    <div style={{ padding:"10px 0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:C.teal, animation:"pulse .8s infinite" }} />
        <div style={{ width:8, height:8, borderRadius:"50%", background:C.teal, animation:"pulse .8s .15s infinite" }} />
        <div style={{ width:8, height:8, borderRadius:"50%", background:C.teal, animation:"pulse .8s .3s infinite" }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.teal, letterSpacing:".1em", marginLeft:4 }}>
          ANALYZING CLINICAL DATA…
        </span>
      </div>
      {lines.map((w, i) => (
        <div key={i} style={{
          height:10, borderRadius:6, marginBottom:8, width:`${w}%`,
          background:`linear-gradient(90deg,${C.edge} 0%,${C.muted}40 50%,${C.edge} 100%)`,
          backgroundSize:"400px 100%",
          animation:`shimmer 1.4s infinite ${i * .08}s`,
        }} />
      ))}
      <div style={{ marginTop:14, padding:"10px 12px", borderRadius:10, background:"rgba(0,212,188,.05)", border:"1px solid rgba(0,212,188,.2)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.teal, marginBottom:5 }}>REVIEWING GUIDELINES</div>
        {["ACEP Clinical Policy","AHA / ACC Guidelines","IDSA Recommendations","UpToDate Evidence-Based"].map((g,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0" }}>
            <div style={{ width:14, height:14, borderRadius:3, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.teal, animation:`pulse .8s ${i*.2}s infinite` }} />
            </div>
            <span style={{ fontSize:11, color:C.dim }}>{g}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function DiagnosticStewardship() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clock, setClock] = useState("");

  const [clinicalData, setClinicalData] = useState({
    patientName: "",
    patientAge: "",
    patientSex: "Male",
    cc: "",
    hpi: "",
    pmh: "",
    meds: "",
    allergies: "",
    vitals: { hr:"", sbp:"", dbp:"", temp:"", rr:"", spo2:"", gcs:"" },
  });

  const [rosPos, setRosPos] = useState({});
  const [rosNeg, setRosNeg] = useState({});
  const [peFindings, setPeFindings] = useState({});

  const [analyzing, setAnalyzing] = useState(false);
  const [orderSets, setOrderSets] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [activeCat, setActiveCat] = useState("labs");
  const [addedToPlan, setAddedToPlan] = useState([]);
  const [planAdded, setPlanAdded] = useState(false);
  const [linkedNoteId, setLinkedNoteId] = useState(null);
  const [activeInputTab, setActiveInputTab] = useState("cc_hpi");

  useEffect(() => {
    const iv = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})),1000);
    return ()=>clearInterval(iv);
  },[]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nid = params.get("noteId");
    if (nid) setLinkedNoteId(nid);
  }, []);

  const updateClinical = (key, val) => setClinicalData(p => ({ ...p, [key]: val }));
  const updateVitals   = (key, val) => setClinicalData(p => ({ ...p, vitals: { ...p.vitals, [key]: val } }));

  const toggleROS = (system, symptom, polarity) => {
    const setter    = polarity === "pos" ? setRosPos : setRosNeg;
    const oppSetter = polarity === "pos" ? setRosNeg : setRosPos;
    setter(p => {
      const cur = p[system] || [];
      return { ...p, [system]: cur.includes(symptom) ? cur.filter(s=>s!==symptom) : [...cur, symptom] };
    });
    oppSetter(p => ({ ...p, [system]: (p[system]||[]).filter(s=>s!==symptom) }));
  };

  const updatePE = (system, field, val) =>
    setPeFindings(p => ({ ...p, [system]: { ...(p[system]||{}), [field]: val } }));

  const buildContext = () => {
    const v = clinicalData.vitals;
    const rosText = ROS_SYSTEMS.map(s => {
      const pos = (rosPos[s.id]||[]).join(", ") || "none";
      const neg = (rosNeg[s.id]||[]).join(", ") || "none";
      return `${s.label}: POS: ${pos} | NEG: ${neg}`;
    }).join("\n");

    const peText = PE_SYSTEMS.map(s => {
      const f = peFindings[s];
      if (!f) return `${s}: Not examined`;
      return `${s}: ${f.abn ? "[ABNORMAL] " : ""}${f.text||"Normal"}`;
    }).join("\n");

    return `
PATIENT: ${clinicalData.patientName||"Unknown"}, ${clinicalData.patientAge||"?"} y/o ${clinicalData.patientSex}
CHIEF COMPLAINT: ${clinicalData.cc}
HISTORY OF PRESENT ILLNESS:\n${clinicalData.hpi}
PAST MEDICAL HISTORY: ${clinicalData.pmh||"None reported"}
CURRENT MEDICATIONS: ${clinicalData.meds||"None"}
ALLERGIES: ${clinicalData.allergies||"NKDA"}
VITAL SIGNS:
HR: ${v.hr||"—"} | BP: ${v.sbp||"—"}/${v.dbp||"—"} | Temp: ${v.temp||"—"}°F | RR: ${v.rr||"—"} | SpO2: ${v.spo2||"—"}% | GCS: ${v.gcs||"—"}
REVIEW OF SYSTEMS:\n${rosText}
PHYSICAL EXAM:\n${peText}
`.trim();
  };

  const analyzeOrders = async () => {
    if (!clinicalData.cc && !clinicalData.hpi) {
      toast.error("Enter at least a chief complaint or HPI before analyzing.");
      return;
    }
    setAnalyzing(true);
    setOrderSets(null);
    setSelectedOrders(new Set());

    const context = buildContext();

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an expert emergency medicine clinical decision support system. Your role is DIAGNOSTIC STEWARDSHIP — recommending ONLY guideline-based, evidence-supported orders to avoid unnecessary testing and treatment.

CLINICAL DATA:
${context}

INSTRUCTIONS:
1. Analyze the clinical presentation carefully
2. Apply evidence-based guidelines (ACEP, AHA/ACC, IDSA, USPSTF, Choosing Wisely, UpToDate)
3. Recommend ONLY orders that are guideline-supported for this specific presentation
4. Flag and OMIT orders that are NOT guideline-supported (over-ordering)
5. Provide a brief clinical rationale for each order
6. Assign priorities: critical (immediately needed), high (should order), routine (standard workup), prn (if needed)
7. Each order must cite its guideline source

Return ONLY valid JSON in this exact structure:
{
  "clinical_summary": "2-3 sentence synthesis of the presentation",
  "working_diagnosis": ["Primary Dx", "DDx 2", "DDx 3"],
  "stewardship_note": "Brief note on what was intentionally NOT ordered and why (over-ordering avoidance)",
  "risk_stratification": "low|moderate|high|critical",
  "guidelines_applied": ["Guideline 1", "Guideline 2"],
  "warnings": [{"text": "string", "severity": "critical|high|moderate"}],
  "categories": {
    "labs": [{"id":"unique_id","name":"Test Name","indication":"Why ordered","rationale":"Evidence basis","guideline":"Source","priority":"critical|high|routine|prn","dose":null}],
    "imaging": [],
    "meds": [{"id":"unique_id","name":"Medication Name","indication":"Why ordered","rationale":"Evidence basis","guideline":"Source","priority":"critical|high|routine|prn","dose":"Dose and route"}],
    "consults": [],
    "nursing": [],
    "procedures": []
  }
}`,
        response_json_schema: {
          type:"object",
          properties:{
            clinical_summary:{type:"string"},
            working_diagnosis:{type:"array",items:{type:"string"}},
            stewardship_note:{type:"string"},
            risk_stratification:{type:"string"},
            guidelines_applied:{type:"array",items:{type:"string"}},
            warnings:{type:"array",items:{type:"object"}},
            categories:{type:"object"},
          }
        },
      });

      setOrderSets(result);

      const autoSelect = new Set();
      if (result?.categories) {
        Object.values(result.categories).forEach(cat => {
          (cat||[]).forEach(o => { if (o.priority === "critical") autoSelect.add(o.id); });
        });
      }
      setSelectedOrders(autoSelect);

      const firstCat = ORDER_CATS.find(c => (result?.categories?.[c.id]||[]).length > 0);
      if (firstCat) setActiveCat(firstCat.id);

      toast.success("Guideline analysis complete");
    } catch (err) {
      toast.error("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleOrder = (id) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllInCat = (catId) => {
    const orders = orderSets?.categories?.[catId] || [];
    const allSelected = orders.every(o => selectedOrders.has(o.id));
    setSelectedOrders(prev => {
      const next = new Set(prev);
      orders.forEach(o => allSelected ? next.delete(o.id) : next.add(o.id));
      return next;
    });
  };

  const selectedInCat = (catId) =>
    (orderSets?.categories?.[catId]||[]).filter(o => selectedOrders.has(o.id)).length;

  const totalSelected = orderSets
    ? Object.values(orderSets.categories||{}).flat().filter(o => selectedOrders.has(o.id)).length
    : 0;

  const totalOrders = orderSets
    ? Object.values(orderSets.categories||{}).flat().length
    : 0;

  const addToPlan = async () => {
    if (totalSelected === 0) { toast.error("Select at least one order"); return; }

    const allOrders = Object.entries(orderSets?.categories||{}).flatMap(([cat, orders]) =>
      (orders||[]).filter(o => selectedOrders.has(o.id)).map(o => ({ ...o, category:cat }))
    );

    try {
      if (linkedNoteId) {
        const existing = await base44.entities.ClinicalNote.filter({ id: linkedNoteId });
        const note = existing?.[0];
        if (note) {
          const planText = allOrders.map(o =>
            `[${o.category.toUpperCase()}] ${o.name}${o.dose ? ` — ${o.dose}` : ""} | ${o.indication} (${o.guideline||"Guideline-based"})`
          ).join("\n");
          await base44.entities.ClinicalNote.update(linkedNoteId, {
            treatment_plan: (note.treatment_plan ? note.treatment_plan + "\n\n" : "") +
              `=== DIAGNOSTIC STEWARDSHIP ORDERS (${new Date().toLocaleDateString()}) ===\n${planText}`,
          });
          queryClient.invalidateQueries({ queryKey: ["studioNote", linkedNoteId] });
          toast.success(`${totalSelected} orders added to note`);
        }
      } else {
        toast.success(`${totalSelected} orders ready — link a note to save to plan`);
      }
      setAddedToPlan(allOrders);
      setPlanAdded(true);
    } catch (err) {
      toast.error("Failed to add orders: " + err.message);
    }
  };

  const riskColor = { low:C.green, moderate:C.amber, high:C.red, critical:C.red };
  const riskIcon  = { low:"🟢", moderate:"🟡", high:"🔴", critical:"🔴" };

  const activeOrders = orderSets?.categories?.[activeCat] || [];
  const activeCatConfig = ORDER_CATS.find(c => c.id === activeCat);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.navy, height:"100vh", color:C.text, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input,textarea,select{transition:border-color .15s}
        input:focus,textarea:focus,select:focus{border-color:#4a7299 !important;outline:none}
        input::placeholder,textarea::placeholder{color:#2a4d72}
        select option{background:#0b1d35}
        button:hover{filter:brightness(1.1)}
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ height:52, background:"rgba(11,29,53,.97)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0, zIndex:100 }}>
        <span onClick={()=>navigate(createPageUrl("Home"))} style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:C.bright, cursor:"pointer", letterSpacing:"-.02em" }}>Notrya</span>
        <div style={{ width:1, height:16, background:C.border }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal, letterSpacing:".12em" }}>DIAGNOSTIC STEWARDSHIP</span>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", gap:5 }}>
          {[
            { label:"📝 Notes",   page:"ClinicalNoteStudio", c:C.teal   },
            { label:"🧬 Drugs",   page:"DrugsBugs",          c:C.green  },
            { label:"⚙️ Account", page:"UserPreferences",    c:C.dim    },
          ].map(p => (
            <button key={p.page} onClick={()=>navigate(createPageUrl(p.page))} style={{ padding:"4px 11px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${p.c}44`, background:`${p.c}0e`, color:p.c }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ width:1, height:16, background:C.border }} />
        {linkedNoteId && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:8, background:"rgba(0,212,188,.08)", border:"1px solid rgba(0,212,188,.25)" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.teal, animation:"pulse .8s infinite" }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.teal, fontWeight:700 }}>LINKED TO NOTE</span>
          </div>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim }}>{clock}</span>
      </nav>

      {/* ── Three-column layout ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* LEFT COLUMN — Clinical Input */}
        <div style={{ width:320, flexShrink:0, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"12px 14px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, letterSpacing:".1em", marginBottom:6 }}>PATIENT ENCOUNTER</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 70px", gap:6 }}>
              <input value={clinicalData.patientName} onChange={e=>updateClinical("patientName",e.target.value)} placeholder="Patient name" style={{ ...inputS, gridColumn:"1 / -1", background:C.edge, fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:C.bright }} />
              <input value={clinicalData.patientAge} onChange={e=>updateClinical("patientAge",e.target.value)} placeholder="Age" style={{ ...inputS, fontFamily:"'JetBrains Mono',monospace" }} />
              <select value={clinicalData.patientSex} onChange={e=>updateClinical("patientSex",e.target.value)} style={{ ...inputS, background:C.edge, cursor:"pointer" }}>
                {["Male","Female","Other"].map(s=><option key={s}>{s}</option>)}
              </select>
              <input value={clinicalData.allergies} onChange={e=>updateClinical("allergies",e.target.value)} placeholder="Allergies" style={{ ...inputS, gridColumn:"1 / -1", fontSize:11 }} />
            </div>
          </div>

          <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            {[
              { id:"cc_hpi",  label:"CC / HPI" },
              { id:"vitals",  label:"Vitals"   },
              { id:"ros",     label:"ROS"      },
              { id:"pe",      label:"Exam"     },
            ].map(tab => (
              <button key={tab.id} onClick={()=>setActiveInputTab(tab.id)} style={{
                flex:1, padding:"8px 4px", fontSize:10, fontWeight:700, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", letterSpacing:".06em",
                background:"transparent", border:"none",
                borderBottom:`2px solid ${activeInputTab===tab.id ? C.teal : "transparent"}`,
                color: activeInputTab===tab.id ? C.teal : C.dim,
                transition:"all .15s",
              }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"12px 14px" }}>
            {activeInputTab === "cc_hpi" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div>
                  <Label>CHIEF COMPLAINT</Label>
                  <input value={clinicalData.cc} onChange={e=>updateClinical("cc",e.target.value)} placeholder="e.g. Chest pain x 2 hours" style={inputS} />
                </div>
                <div>
                  <Label>HISTORY OF PRESENT ILLNESS</Label>
                  <textarea value={clinicalData.hpi} onChange={e=>updateClinical("hpi",e.target.value)} rows={6} style={{ ...taS, minHeight:110 }} placeholder="OLDCARTS — Onset, Location, Duration, Character, Aggravating/Alleviating, Radiation, Timing, Severity..." />
                </div>
                <div>
                  <Label>PAST MEDICAL HISTORY</Label>
                  <textarea value={clinicalData.pmh} onChange={e=>updateClinical("pmh",e.target.value)} rows={3} style={{ ...taS, minHeight:55 }} placeholder="Comorbidities, prior procedures..." />
                </div>
                <div>
                  <Label>CURRENT MEDICATIONS</Label>
                  <textarea value={clinicalData.meds} onChange={e=>updateClinical("meds",e.target.value)} rows={2} style={{ ...taS, minHeight:45 }} placeholder="Active medications..." />
                </div>
              </div>
            )}

            {activeInputTab === "vitals" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                {[
                  { k:"hr",  lbl:"HEART RATE",  unit:"bpm",   abn:v=>+v>100||+v<60 },
                  { k:"sbp", lbl:"SYSTOLIC BP", unit:"mmHg",  abn:v=>+v<90||+v>180 },
                  { k:"dbp", lbl:"DIASTOLIC BP",unit:"mmHg",  abn:v=>+v<60 },
                  { k:"temp",lbl:"TEMPERATURE", unit:"°F",    abn:v=>+v>100.4||+v<96 },
                  { k:"rr",  lbl:"RESP RATE",   unit:"/min",  abn:v=>+v>20||+v<10 },
                  { k:"spo2",lbl:"SpO₂",        unit:"%",     abn:v=>+v<94 },
                  { k:"gcs", lbl:"GCS",         unit:"/15",   abn:v=>+v<14 },
                ].map(d => {
                  const val = clinicalData.vitals[d.k];
                  const isAbn = val && d.abn(val);
                  return (
                    <div key={d.k} style={{ background: isAbn?"rgba(255,92,108,.07)":C.edge, border:`1px solid ${isAbn?"rgba(255,92,108,.45)":C.border}`, borderRadius:10, padding:"9px 10px" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted, marginBottom:3 }}>{d.lbl}</div>
                      <input value={val} onChange={e=>updateVitals(d.k,e.target.value)} placeholder="—" style={{ width:"100%", background:"transparent", border:"none", color: isAbn?C.red:C.bright, fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, outline:"none" }} />
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color: isAbn?C.red:C.muted }}>{isAbn?"⚠ ABNORMAL":d.unit}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeInputTab === "ros" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {ROS_SYSTEMS.map(sys => {
                  const pos = rosPos[sys.id]||[];
                  const neg = rosNeg[sys.id]||[];
                  const hasPos = pos.length > 0;
                  return (
                    <div key={sys.id} style={{ background: hasPos?"rgba(255,92,108,.05)":C.edge, border:`1px solid ${hasPos?"rgba(255,92,108,.35)":C.border}`, borderRadius:10, padding:"9px 10px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:C.text }}>{sys.label}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:hasPos?C.red:C.green }}>{hasPos?"POS":"NEG"}</span>
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {sys.symptoms.map(s => {
                          const isPos = pos.includes(s);
                          const isNeg = neg.includes(s);
                          return (
                            <div key={s} style={{ display:"flex", gap:0 }}>
                              <button onClick={()=>toggleROS(sys.id, s, "pos")} style={{ padding:"2px 6px", borderRadius:"5px 0 0 5px", fontSize:10, cursor:"pointer", background: isPos?"rgba(255,92,108,.18)":"transparent", border:`1px solid ${isPos?"rgba(255,92,108,.4)":C.border}`, color: isPos?C.red:C.muted, fontWeight: isPos?700:400 }}>+</button>
                              <button onClick={()=>toggleROS(sys.id, s, "neg")} style={{ padding:"2px 8px", borderRadius:"0 5px 5px 0", fontSize:10, cursor:"pointer", background: isNeg?"rgba(46,204,113,.1)":"transparent", border:`1px solid ${isNeg?"rgba(46,204,113,.35)":C.border}`, borderLeft:"none", color: isNeg?C.green: isPos?C.text:C.dim }}>{s}</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeInputTab === "pe" && (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {PE_SYSTEMS.map(sys => {
                  const f = peFindings[sys] || {};
                  return (
                    <div key={sys} style={{ background: f.abn?"rgba(255,92,108,.05)":C.edge, border:`1px solid ${f.abn?"rgba(255,92,108,.35)":C.border}`, borderRadius:10, padding:"8px 10px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:C.text, flex:1 }}>{sys}</span>
                        <button onClick={()=>updatePE(sys,"abn",!f.abn)} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:5, cursor:"pointer", background: f.abn?"rgba(255,92,108,.15)":"rgba(46,204,113,.1)", border:`1px solid ${f.abn?"rgba(255,92,108,.3)":"rgba(46,204,113,.25)"}`, color: f.abn?C.red:C.green }}>{f.abn?"ABNORMAL":"NORMAL"}</button>
                      </div>
                      <input value={f.text||""} onChange={e=>updatePE(sys,"text",e.target.value)} placeholder={`${sys} findings...`} style={{ ...inputS, background:"transparent", border:"none", borderTop:`1px solid ${C.border}`, borderRadius:0, paddingTop:6, paddingLeft:0, fontSize:11 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <button
              onClick={analyzeOrders}
              disabled={analyzing || (!clinicalData.cc && !clinicalData.hpi)}
              style={{
                width:"100%", padding:"11px", borderRadius:12, fontSize:13, fontWeight:700,
                cursor: analyzing || (!clinicalData.cc && !clinicalData.hpi) ? "not-allowed" : "pointer",
                border:"none",
                background: analyzing ? C.edge : `linear-gradient(135deg,${C.teal},#00b8a5)`,
                color: analyzing ? C.dim : C.navy,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                opacity: !clinicalData.cc && !clinicalData.hpi ? .4 : 1,
                transition:"all .2s",
              }}
            >
              {analyzing
                ? <><div style={{ width:14,height:14,border:`2px solid ${C.muted}`,borderTopColor:C.teal,borderRadius:"50%",animation:"spin .6s linear infinite" }} />Analyzing Guidelines…</>
                : <>✦ Analyze &amp; Generate Orders</>
              }
            </button>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted, textAlign:"center", marginTop:5, lineHeight:1.5 }}>
              ACEP · AHA/ACC · IDSA · Choosing Wisely · UpToDate
            </div>
          </div>
        </div>

        {/* CENTER COLUMN — AI Results + Order Selection */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          <div style={{ padding:"12px 18px", background:C.slate, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            {orderSets ? (
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.bright, letterSpacing:"-.02em" }}>Order Recommendations</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:1 }}>{totalOrders} guideline-based orders · {totalSelected} selected</div>
                </div>
                {orderSets.risk_stratification && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:9, background:`${riskColor[orderSets.risk_stratification]}14`, border:`1px solid ${riskColor[orderSets.risk_stratification]}44` }}>
                    <span style={{ fontSize:12 }}>{riskIcon[orderSets.risk_stratification]}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:riskColor[orderSets.risk_stratification], textTransform:"uppercase" }}>{orderSets.risk_stratification} risk</span>
                  </div>
                )}
                <div style={{ flex:1 }} />
                <button onClick={()=>{
                  const all = Object.values(orderSets.categories||{}).flat();
                  if(totalSelected===totalOrders) setSelectedOrders(new Set());
                  else setSelectedOrders(new Set(all.map(o=>o.id)));
                }} style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", background:C.edge, border:`1px solid ${C.border}`, color:C.dim }}>
                  {totalSelected===totalOrders ? "Deselect All" : "Select All"}
                </button>
                <button onClick={addToPlan} disabled={totalSelected===0} style={{ padding:"7px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:totalSelected===0?"not-allowed":"pointer", border:"none", background: totalSelected===0 ? C.edge : `linear-gradient(135deg,${C.teal},#00b8a5)`, color: totalSelected===0 ? C.muted : C.navy, transition:"all .2s", display:"flex", alignItems:"center", gap:6 }}>
                  {planAdded ? "✓ Added to Plan" : `📋 Add ${totalSelected > 0 ? totalSelected : ""} Orders to Plan`}
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.bright }}>Order Recommendations</div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim }}>Enter clinical data and analyze to generate guideline-based orders</span>
              </div>
            )}
          </div>

          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
            {!orderSets && !analyzing && (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, padding:40 }}>
                <div style={{ fontSize:52, opacity:.15 }}>⚕️</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright, opacity:.4, textAlign:"center" }}>Awaiting Clinical Data</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.8, maxWidth:400 }}>
                  Enter a chief complaint, HPI, ROS, and physical exam findings in the left panel, then click <strong style={{color:C.teal}}>Analyze &amp; Generate Orders</strong> to receive guideline-based order recommendations.
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:10, width:"100%", maxWidth:520 }}>
                  {["ACEP Clinical Policies","AHA/ACC Guidelines","IDSA Recommendations","Choosing Wisely","UpToDate Evidence","USPSTF Grade A/B"].map((g,i)=>(
                    <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:16, marginBottom:4 }}>📘</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, lineHeight:1.4 }}>{g}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyzing && (
              <div style={{ flex:1, padding:"24px 22px", overflowY:"auto" }}>
                <AIThinking />
              </div>
            )}

            {orderSets && !analyzing && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                <div style={{ padding:"12px 18px", background:"linear-gradient(135deg,rgba(0,212,188,.05),rgba(155,109,255,.03))", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.teal, letterSpacing:".1em", marginBottom:5 }}>✦ AI CLINICAL SYNTHESIS</div>
                  <div style={{ fontSize:12, color:C.text, lineHeight:1.7, marginBottom:8 }}>{orderSets.clinical_summary}</div>
                  {orderSets.working_diagnosis?.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                      {orderSets.working_diagnosis.map((dx,i)=>(
                        <span key={i} style={{ padding:"3px 9px", borderRadius:7, fontSize:11, background: i===0?"rgba(0,212,188,.12)":"rgba(74,144,217,.08)", border:`1px solid ${i===0?"rgba(0,212,188,.3)":"rgba(74,144,217,.2)"}`, color:i===0?C.teal:C.blue, fontWeight: i===0?600:400 }}>
                          {i===0?"▶ ":""}{dx}
                        </span>
                      ))}
                    </div>
                  )}
                  {orderSets.stewardship_note && (
                    <div style={{ padding:"7px 10px", borderRadius:9, background:"rgba(245,166,35,.07)", border:"1px solid rgba(245,166,35,.25)", fontSize:11, color:C.amber }}>
                      <strong>🛡 Stewardship: </strong>{orderSets.stewardship_note}
                    </div>
                  )}
                </div>

                {orderSets.warnings?.length > 0 && (
                  <div style={{ padding:"8px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                    {orderSets.warnings.map((w,i)=>(
                      <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", padding:"5px 10px", borderRadius:8, background: w.severity==="critical"?"rgba(255,92,108,.08)":"rgba(245,166,35,.07)", border:`1px solid ${w.severity==="critical"?"rgba(255,92,108,.3)":"rgba(245,166,35,.25)"}`, marginBottom: i<orderSets.warnings.length-1?5:0 }}>
                        <span style={{ fontSize:12, flexShrink:0 }}>{w.severity==="critical"?"🔴":"⚠️"}</span>
                        <span style={{ fontSize:11, color: w.severity==="critical"?C.red:C.amber, lineHeight:1.55 }}>{w.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0, overflowX:"auto", background:C.slate }}>
                  {ORDER_CATS.map(cat => {
                    const orders = orderSets?.categories?.[cat.id] || [];
                    if (orders.length === 0) return null;
                    const selCount = selectedInCat(cat.id);
                    const isActive = activeCat === cat.id;
                    return (
                      <button key={cat.id} onClick={()=>setActiveCat(cat.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderBottom:`2px solid ${isActive ? cat.color : "transparent"}`, background:"transparent", border:"none", cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
                        <span style={{ fontSize:13 }}>{cat.icon}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:isActive?cat.color:C.dim, letterSpacing:".06em" }}>{cat.label}</span>
                        <span style={{ display:"flex", alignItems:"center", justifyContent:"center", minWidth:18, height:18, borderRadius:9, background: selCount>0?`${cat.color}22`:"rgba(255,255,255,.05)", fontSize:9, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:selCount>0?cat.color:C.muted, padding:"0 4px" }}>
                          {selCount}/{orders.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ flex:1, overflowY:"auto", padding:"14px 18px" }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeCat} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:.12}}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                        <div style={{ width:32, height:32, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, background:`${activeCatConfig?.color}14`, border:`1px solid ${activeCatConfig?.color}33` }}>
                          {activeCatConfig?.icon}
                        </div>
                        <div>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:C.bright }}>{activeCatConfig?.label} Orders</div>
                          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{activeOrders.length} guideline-recommended</div>
                        </div>
                        <div style={{ flex:1 }} />
                        <button onClick={()=>toggleAllInCat(activeCat)} style={{ padding:"4px 11px", borderRadius:8, fontSize:10, fontWeight:600, cursor:"pointer", background:C.edge, border:`1px solid ${C.border}`, color:C.dim }}>
                          {activeOrders.every(o=>selectedOrders.has(o.id)) ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                      {activeOrders.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"28px 20px", color:C.muted, fontSize:12 }}>No {activeCatConfig?.label.toLowerCase()} orders recommended for this presentation.</div>
                      ) : (
                        activeOrders.map(order => (
                          <OrderItem key={order.id} order={order} selected={selectedOrders.has(order.id)} onToggle={toggleOrder} catColor={activeCatConfig?.color||C.teal} />
                        ))
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Selected Plan + Guidelines */}
        <div style={{ width:280, flexShrink:0, background:C.panel, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 14px 8px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:C.teal, animation:"pulse .8s infinite" }} />
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal, letterSpacing:".1em", flex:1 }}>SELECTED ORDERS</div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:C.bright }}>{totalSelected}</span>
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            {totalSelected === 0 ? (
              <div style={{ padding:"20px 14px", textAlign:"center" }}>
                <div style={{ fontSize:26, marginBottom:8, opacity:.2 }}>📋</div>
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.7 }}>Check orders from the center panel to build your order set.</div>
              </div>
            ) : (
              <div style={{ padding:"8px 12px" }}>
                {ORDER_CATS.map(cat => {
                  const sel = (orderSets?.categories?.[cat.id]||[]).filter(o=>selectedOrders.has(o.id));
                  if (sel.length === 0) return null;
                  return (
                    <div key={cat.id} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                        <span style={{ fontSize:11 }}>{cat.icon}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:cat.color, letterSpacing:".08em" }}>{cat.label.toUpperCase()}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>({sel.length})</span>
                      </div>
                      {sel.map(o => {
                        const pr = PRIORITY[o.priority]||PRIORITY.routine;
                        return (
                          <div key={o.id} onClick={()=>toggleOrder(o.id)} style={{ display:"flex", alignItems:"flex-start", gap:7, padding:"6px 8px", borderRadius:8, background:C.edge, border:`1px solid ${cat.color}33`, marginBottom:4, cursor:"pointer" }}>
                            <div style={{ width:5, height:5, borderRadius:"50%", background:pr.color, flexShrink:0, marginTop:4 }} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:11, fontWeight:600, color:C.bright, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{o.name}</div>
                              {o.dose && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:cat.color, marginTop:1 }}>{o.dose}</div>}
                            </div>
                            <span style={{ fontSize:9, color:C.muted, flexShrink:0, marginTop:1 }}>×</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {orderSets?.guidelines_applied?.length > 0 && (
              <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".1em", marginBottom:7 }}>GUIDELINES APPLIED</div>
                {orderSets.guidelines_applied.map((g,i) => (
                  <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:5 }}>
                    <span style={{ fontSize:11, flexShrink:0 }}>📘</span>
                    <span style={{ fontSize:10, color:C.dim, lineHeight:1.55 }}>{g}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding:"12px", borderTop:`1px solid ${C.border}`, flexShrink:0, display:"flex", flexDirection:"column", gap:7 }}>
            <button onClick={addToPlan} disabled={totalSelected === 0} style={{ padding:"10px", borderRadius:11, fontSize:13, fontWeight:700, cursor:totalSelected===0?"not-allowed":"pointer", border: planAdded ? "1px solid rgba(46,204,113,.4)" : "none", background: planAdded ? "rgba(46,204,113,.15)" : totalSelected===0 ? C.edge : `linear-gradient(135deg,${C.teal},#00b8a5)`, color: planAdded ? C.green : totalSelected===0 ? C.muted : C.navy, display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all .25s" }}>
              {planAdded ? "✓ Orders Added to Plan" : `📋 Add ${totalSelected||""} Orders to Plan`}
            </button>
            {linkedNoteId ? (
              <button onClick={()=>navigate(`${createPageUrl("ClinicalNoteStudio")}?noteId=${linkedNoteId}`)} style={{ padding:"7px", borderRadius:9, fontSize:11, fontWeight:600, cursor:"pointer", background:"rgba(74,144,217,.08)", border:"1px solid rgba(74,144,217,.25)", color:C.blue }}>Open Linked Note →</button>
            ) : (
              <button onClick={()=>navigate(createPageUrl("ClinicalNoteStudio"))} style={{ padding:"7px", borderRadius:9, fontSize:11, fontWeight:600, cursor:"pointer", background:C.edge, border:`1px solid ${C.border}`, color:C.dim }}>Open Note Studio →</button>
            )}
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5, color:C.muted, lineHeight:1.6, textAlign:"center" }}>
              FOR CLINICAL DECISION SUPPORT ONLY. Verify all orders independently. Not a substitute for clinical judgment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}