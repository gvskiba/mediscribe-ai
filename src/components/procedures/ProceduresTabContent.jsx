import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Theme ────────────────────────────────────────────────────────────────────
const T = {
  navy:   "#050f1e",
  slate:  "#0b1d35",
  panel:  "#0e2340",
  edge:   "#162d4f",
  border: "#1e3a5f",
  muted:  "#2a4d72",
  dim:    "#4a7299",
  text:   "#c8ddf0",
  bright: "#e8f4ff",
  teal:   "#00d4bc",
  teal2:  "#00a896",
  amber:  "#f5a623",
  red:    "#ff5c6c",
  green:  "#2ecc71",
  purple: "#9b6dff",
  rose:   "#f472b6",
};

// ── CPT Data ─────────────────────────────────────────────────────────────────
const CPT_DATA = [
  // Wound Repair
  { cptCode:"12001", procedureName:"Simple repair, scalp/neck/axillae ≤2.5cm",    category:"wound-repair",  rvu:1.83 },
  { cptCode:"12002", procedureName:"Simple repair, scalp/neck/axillae 2.6–7.5cm", category:"wound-repair",  rvu:2.08 },
  { cptCode:"12004", procedureName:"Simple repair 7.6–12.5cm",                    category:"wound-repair",  rvu:2.51 },
  { cptCode:"12011", procedureName:"Simple repair, face/ears/eyelids ≤2.5cm",     category:"wound-repair",  rvu:2.40 },
  { cptCode:"12032", procedureName:"Intermediate repair, scalp/trunk 2.6–7.5cm",  category:"wound-repair",  rvu:3.44 },
  { cptCode:"12051", procedureName:"Intermediate repair, face/ears ≤2.5cm",       category:"wound-repair",  rvu:4.25 },
  { cptCode:"13100", procedureName:"Complex repair, trunk 1.1–2.5cm",             category:"wound-repair",  rvu:5.12 },
  { cptCode:"13131", procedureName:"Complex repair, forehead/cheeks 1.1–2.5cm",   category:"wound-repair",  rvu:5.67 },
  // Airway
  { cptCode:"31500", procedureName:"Emergency endotracheal intubation",            category:"airway",        rvu:3.14 },
  { cptCode:"31575", procedureName:"Flexible fiberoptic laryngoscopy",             category:"airway",        rvu:2.61 },
  { cptCode:"31603", procedureName:"Cricothyrotomy",                               category:"airway",        rvu:6.42 },
  { cptCode:"94002", procedureName:"Ventilation management, hospital inpatient",   category:"airway",        rvu:3.86 },
  // Vascular
  { cptCode:"36556", procedureName:"Central venous catheter, non-tunneled ≥5yrs",  category:"vascular",      rvu:3.58 },
  { cptCode:"36569", procedureName:"PICC line insertion",                          category:"vascular",      rvu:2.41 },
  { cptCode:"36625", procedureName:"Arterial line, percutaneous",                  category:"vascular",      rvu:1.95 },
  { cptCode:"36680", procedureName:"Intraosseous catheter placement",              category:"vascular",      rvu:1.66 },
  // Ortho
  { cptCode:"23650", procedureName:"Shoulder dislocation, closed reduction",       category:"ortho",         rvu:4.84 },
  { cptCode:"29125", procedureName:"Short arm splint, static",                     category:"ortho",         rvu:1.04 },
  { cptCode:"29515", procedureName:"Short leg splint",                             category:"ortho",         rvu:1.23 },
  { cptCode:"20610", procedureName:"Joint aspiration/injection, major joint",      category:"ortho",         rvu:1.40 },
  { cptCode:"20600", procedureName:"Joint aspiration/injection, small joint",      category:"ortho",         rvu:0.91 },
  // Cardiac
  { cptCode:"92960", procedureName:"External electrical cardioversion",            category:"cardio",        rvu:3.20 },
  { cptCode:"32551", procedureName:"Tube thoracostomy",                            category:"cardio",        rvu:4.53 },
  { cptCode:"32422", procedureName:"Thoracentesis, therapeutic",                   category:"cardio",        rvu:3.84 },
  { cptCode:"93000", procedureName:"ECG with interpretation",                      category:"cardio",        rvu:0.56 },
  // Critical Care
  { cptCode:"99291", procedureName:"Critical care, first 30–74 minutes",           category:"critical-care", rvu:9.14 },
  { cptCode:"99292", procedureName:"Critical care, each additional 30 min",        category:"critical-care", rvu:4.57 },
  { cptCode:"99152", procedureName:"Procedural sedation, first 15 min",            category:"critical-care", rvu:1.34 },
  { cptCode:"96374", procedureName:"IV push, single drug",                         category:"critical-care", rvu:0.58 },
  // Drainage
  { cptCode:"10060", procedureName:"I&D abscess, simple",                          category:"drainage",      rvu:1.55 },
  { cptCode:"10061", procedureName:"I&D abscess, complicated",                     category:"drainage",      rvu:2.97 },
  { cptCode:"10140", procedureName:"I&D hematoma/seroma",                         category:"drainage",      rvu:2.32 },
  { cptCode:"49083", procedureName:"Paracentesis, diagnostic/therapeutic",         category:"drainage",      rvu:2.18 },
  { cptCode:"51702", procedureName:"Bladder catheterization, simple",              category:"drainage",      rvu:0.56 },
  { cptCode:"69200", procedureName:"Foreign body removal, ear canal",              category:"drainage",      rvu:1.02 },
  { cptCode:"30300", procedureName:"Foreign body removal, nasal",                  category:"drainage",      rvu:1.28 },
  // Neuro
  { cptCode:"62270", procedureName:"Lumbar puncture, diagnostic",                  category:"neuro",         rvu:2.78 },
  { cptCode:"64400", procedureName:"Nerve block, trigeminal",                      category:"neuro",         rvu:1.82 },
  { cptCode:"64420", procedureName:"Intercostal nerve block, single",              category:"neuro",         rvu:1.45 },
];

const CATEGORY_LABELS = {
  "wound-repair":  "Wound Repair",
  "airway":        "Airway",
  "vascular":      "Vascular Access",
  "ortho":         "Ortho / MSK",
  "cardio":        "Cardiac",
  "critical-care": "Critical Care",
  "drainage":      "Drainage / I&D",
  "neuro":         "Neuro / Spine",
};

const CATEGORY_COLORS = {
  "wound-repair":  { bg:"rgba(0,212,188,0.1)",  fg:"#00d4bc" },
  "airway":        { bg:"rgba(255,92,108,0.1)",  fg:"#ff5c6c" },
  "vascular":      { bg:"rgba(155,109,255,0.1)", fg:"#9b6dff" },
  "ortho":         { bg:"rgba(245,166,35,0.1)",  fg:"#f5a623" },
  "cardio":        { bg:"rgba(255,92,108,0.1)",  fg:"#ff5c6c" },
  "critical-care": { bg:"rgba(74,114,153,0.15)", fg:"#4a90d9" },
  "drainage":      { bg:"rgba(46,204,113,0.1)",  fg:"#2ecc71" },
  "neuro":         { bg:"rgba(244,114,182,0.1)", fg:"#f472b6" },
};

// ── Sub-section: Section Header ───────────────────────────────────────────────
function SectionHeader({ icon, iconColor, title, subtitle, badge }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <span style={{ fontFamily:"Playfair Display,serif", fontSize:20, fontWeight:700, color:T.bright }}>{title}</span>
        {badge && (
          <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:badge.background, border:badge.border, color:badge.color }}>
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && <p style={{ fontSize:13, color:T.dim, lineHeight:1.6, marginLeft:34 }}>{subtitle}</p>}
    </div>
  );
}

// ── Section 1: AI Recommender ─────────────────────────────────────────────────
function AIProcedureRecommender({ note, standalone }) {
  const [noteText, setNoteText] = useState(
    note ? [note.chief_complaint, note.history_of_present_illness, note.assessment].filter(Boolean).join("\n\n") : ""
  );
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const analyze = async () => {
    if (!noteText.trim()) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical decision support assistant. Analyze the provided clinical note and recommend relevant ED procedures.

CLINICAL NOTE:
${noteText}

For each procedure return a JSON object with:
- procedureName (string)
- cptCode (string)
- indication (1-2 sentences from the note context)
- urgency ("immediate"|"urgent"|"elective")
- difficulty ("basic"|"intermediate"|"advanced")
- estimatedTime (number, minutes)
- keyConsiderations (array of 3-4 strings)
- contraindications (array of strings)
- alternativeProcedures (array of strings)

Return up to 6 procedures sorted by clinical priority. Be concise and evidence-based.`,
        response_json_schema: {
          type:"object",
          properties:{
            procedures:{
              type:"array",
              items:{
                type:"object",
                properties:{
                  procedureName:{type:"string"},
                  cptCode:{type:"string"},
                  indication:{type:"string"},
                  urgency:{type:"string"},
                  difficulty:{type:"string"},
                  estimatedTime:{type:"number"},
                  keyConsiderations:{type:"array",items:{type:"string"}},
                  contraindications:{type:"array",items:{type:"string"}},
                  alternativeProcedures:{type:"array",items:{type:"string"}},
                }
              }
            }
          }
        }
      });
      setRecommendations(result?.procedures || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const urgencyColor  = { immediate:"#ff5c6c", urgent:"#f5a623", elective:"#2ecc71" };
  const difficultyColor = { basic:"#2ecc71", intermediate:"#f5a623", advanced:"#ff5c6c" };

  return (
    <div id="ai-recommender" style={{ borderBottom:`1px solid rgba(30,58,95,0.55)`, paddingBottom:40, marginBottom:40 }}>
      <SectionHeader
        icon="🤖" iconColor={T.purple}
        title="AI Procedure Recommendations"
        subtitle="Paste or review the clinical note below. Notrya AI analyzes the context and recommends relevant procedures with CPT codes and guidance."
        badge={{ text:"Powered by Notrya AI", background:"rgba(155,109,255,0.1)", border:"1px solid rgba(155,109,255,0.25)", color:T.purple }}
      />
      <div style={{ display:"grid", gridTemplateColumns: standalone ? "1fr" : "1fr 1fr", gap:16 }}>
        {/* Input — hidden on standalone page */}
        {!standalone && (
          <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:14, padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.dim, textTransform:"uppercase", letterSpacing:"0.06em" }}>📄 Clinical Note / Context</div>
            <textarea
              value={noteText}
              onChange={e=>setNoteText(e.target.value)}
              placeholder={"Paste HPI, Assessment, or full note here...\n\nExample: '54M with 5cm stellate laceration to right forearm after fall, neurovascularly intact...'"}
              rows={12}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:8, padding:"12px 14px", color:T.bright, fontSize:13, lineHeight:1.75, fontFamily:"DM Sans,sans-serif", resize:"vertical", outline:"none", boxSizing:"border-box" }}
            />
            <button
              onClick={analyze}
              disabled={loading || !noteText.trim()}
              style={{ background:loading?"rgba(155,109,255,0.2)":"linear-gradient(135deg,#9b6dff,#7c5cd6)", color:"#fff", fontWeight:700, fontSize:14, padding:"12px 24px", borderRadius:9, border:"none", cursor:loading||!noteText.trim()?"not-allowed":"pointer", transition:"all 0.2s" }}
            >
              {loading ? "Analyzing clinical context…" : "🤖 Recommend Procedures"}
            </button>
          </div>
        )}
        {/* Output */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, overflowY:"auto", maxHeight: standalone ? "none" : 460 }}>
          {!loading && recommendations.length === 0 && (
            <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:14, padding:"52px 24px", textAlign:"center", opacity:0.5, color:T.dim, fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🤖</div>
              <div style={{ fontWeight:600, color:T.text, marginBottom:6 }}>Enter a clinical note</div>
              <div>Notrya AI will surface relevant procedures with CPT codes, indications, and clinical guidance.</div>
            </div>
          )}
          {loading && [1,2,3].map(i=>(
            <div key={i} style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:12, height:120, animation:"shimmer 1.5s infinite", opacity:0.5 }} />
          ))}
          {!loading && recommendations.map((rec,idx)=>(
            <div key={idx} style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px 20px", transition:"all 0.18s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.purple}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}
            >
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                <span style={{ fontSize:14.5, fontWeight:700, color:T.bright }}>{rec.procedureName}</span>
                <span style={{ fontFamily:"JetBrains Mono,monospace", background:"rgba(0,212,188,0.1)", color:T.teal, border:"1px solid rgba(0,212,188,0.22)", padding:"2px 9px", borderRadius:4, fontSize:10.5, fontWeight:700 }}>{rec.cptCode}</span>
                {rec.urgency && <span style={{ padding:"2px 8px", borderRadius:4, fontSize:10.5, fontWeight:700, background:`${urgencyColor[rec.urgency]}22`, color:urgencyColor[rec.urgency] }}>{rec.urgency}</span>}
                {rec.difficulty && <span style={{ padding:"2px 8px", borderRadius:4, fontSize:10.5, fontWeight:700, background:`${difficultyColor[rec.difficulty]}22`, color:difficultyColor[rec.difficulty] }}>{rec.difficulty}</span>}
                {rec.estimatedTime && <span style={{ fontSize:11, color:T.dim }}>⏱ ~{rec.estimatedTime} min</span>}
              </div>
              {rec.indication && <p style={{ fontSize:12, color:"#7aa8cc", lineHeight:1.7, margin:"0 0 8px" }}><strong style={{ color:T.dim }}>Indication: </strong>{rec.indication}</p>}
              {rec.keyConsiderations?.length>0 && (
                <ul style={{ margin:"0 0 6px", paddingLeft:16 }}>
                  {rec.keyConsiderations.map((c,i)=><li key={i} style={{ fontSize:11.5, color:T.text, marginBottom:2 }}><span style={{ color:T.teal }}>•</span> {c}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section 2: CPT Search ─────────────────────────────────────────────────────
function CPTSearch({ onSelectCPT }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [copied, setCopied] = useState(null);

  const filtered = useMemo(()=>{
    return CPT_DATA.filter(row=>{
      const matchCat = category==="all" || row.category===category;
      const q = query.toLowerCase();
      const matchQ = !q || row.cptCode.includes(q) || row.procedureName.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  const copyCode = (code)=>{
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(()=>setCopied(null), 1500);
  };

  const categories = ["all", ...Object.keys(CATEGORY_LABELS)];

  return (
    <div id="cpt-search" style={{ borderBottom:`1px solid rgba(30,58,95,0.55)`, paddingBottom:40, marginBottom:40, background:"rgba(11,29,53,0.35)", margin:"0 -20px 40px", padding:"40px 20px" }}>
      <SectionHeader
        icon="🔍" iconColor={T.teal}
        title="Procedure & CPT Code Search"
        subtitle="Search by procedure name, body region, or keyword. Returns matching procedures, CPT codes, and RVU values."
        badge={{ text:`${CPT_DATA.length}+ ED-relevant codes`, background:"rgba(0,212,188,0.07)", border:"1px solid rgba(0,212,188,0.2)", color:T.teal }}
      />
      {/* Search input */}
      <input
        value={query}
        onChange={e=>setQuery(e.target.value)}
        placeholder="Search procedures or CPT codes… e.g. 'laceration', '12002', 'intubation', 'central line'"
        style={{ width:"100%", background:T.panel, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"13px 18px", color:T.bright, fontSize:14, fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box", marginBottom:12 }}
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}
      />
      {/* Category filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {categories.map(cat=>(
          <button
            key={cat}
            onClick={()=>setCategory(cat)}
            style={{
              padding:"5px 13px", borderRadius:20, fontSize:11.5, fontWeight:600, cursor:"pointer", border:`1px solid ${category===cat?"rgba(0,212,188,0.3)":T.border}`,
              background:category===cat?"rgba(0,212,188,0.1)":"transparent",
              color:category===cat?T.teal:T.dim, transition:"all 0.15s"
            }}
          >{cat==="all"?"All":CATEGORY_LABELS[cat]}</button>
        ))}
      </div>
      {/* Results table */}
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 80px 80px", gap:0 }}>
          {/* Header */}
          {["CPT Code","Procedure","Category","RVU"].map(h=>(
            <div key={h} style={{ padding:"10px 14px", fontSize:11, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${T.border}` }}>{h}</div>
          ))}
          {/* Rows */}
          {filtered.slice(0,50).map((row,i)=>{
            const cc = CATEGORY_COLORS[row.category]||{bg:"rgba(74,114,153,0.12)",fg:"#4a7299"};
            return (
              <React.Fragment key={row.cptCode}>
                <div style={{ padding:"10px 14px", borderBottom:`1px solid rgba(30,58,95,0.4)`, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:13, fontWeight:700, color:T.teal }}>{row.cptCode}</span>
                  <button onClick={()=>copyCode(row.cptCode)} title="Copy CPT code" style={{ background:"transparent", border:"none", cursor:"pointer", color:copied===row.cptCode?T.green:T.muted, fontSize:11, padding:"2px 4px" }}>
                    {copied===row.cptCode?"✓":"⎘"}
                  </button>
                </div>
                <div
                  onClick={() => onSelectCPT && onSelectCPT(row)}
                  title="Use in Procedure Note Drafter"
                  style={{ padding:"10px 14px", fontSize:13, fontWeight:600, color:T.bright, borderBottom:`1px solid rgba(30,58,95,0.4)`, cursor: onSelectCPT ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}
                  onMouseEnter={e=>{ if(onSelectCPT){ e.currentTarget.style.background="rgba(0,212,188,0.05)"; e.currentTarget.style.color=T.teal; } }}
                  onMouseLeave={e=>{ if(onSelectCPT){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.bright; } }}
                >
                  <span>{row.procedureName}</span>
                  {onSelectCPT && <span style={{ fontSize:10, color:T.teal, opacity:0.7, whiteSpace:"nowrap" }}>→ Use in Drafter</span>}
                </div>
                <div style={{ padding:"10px 14px", borderBottom:`1px solid rgba(30,58,95,0.4)`, display:"flex", alignItems:"center" }}>
                  <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10.5, fontWeight:600, background:cc.bg, color:cc.fg }}>
                    {CATEGORY_LABELS[row.category]||row.category}
                  </span>
                </div>
                <div style={{ padding:"10px 14px", fontFamily:"JetBrains Mono,monospace", fontSize:12, color:T.dim, borderBottom:`1px solid rgba(30,58,95,0.4)` }}>{row.rvu}</div>
              </React.Fragment>
            );
          })}
        </div>
        {filtered.length===0&&(
          <div style={{ padding:"32px 16px", textAlign:"center", color:T.dim, fontSize:13 }}>
            🔍 No procedures matched your search. Try a different keyword or clear the filter.
          </div>
        )}
        {filtered.length>50&&(
          <div style={{ padding:"10px 14px", textAlign:"center", color:T.dim, fontSize:11 }}>
            Showing 50 of {filtered.length} results — refine your search for more specific results.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 3: Procedure Note Drafter ────────────────────────────────────────
const PROC_TEMPLATES = [
  { id:"laceration-repair",  label:"Laceration Repair",           icon:"🩹", color:T.teal,
    fields:[
      { id:"location",       label:"Wound Location",       type:"text",   required:true,  placeholder:"e.g., right volar forearm" },
      { id:"mechanism",      label:"Mechanism",            type:"text",   required:true,  placeholder:"e.g., fall on glass" },
      { id:"length_cm",      label:"Length (cm)",          type:"number", required:true,  placeholder:"4.5" },
      { id:"depth",          label:"Depth",                type:"select", required:true,  options:["Superficial","Subcutaneous fat","Fascia","Muscle","Tendon/bone visible"] },
      { id:"contamination",  label:"Contamination",        type:"select", required:true,  options:["Clean","Clean-contaminated","Contaminated","Dirty/infected"] },
      { id:"neurovasc",      label:"Neurovascular Status", type:"select", required:true,  options:["Intact distal","Sensation diminished","Motor deficit","Vascular compromise"] },
      { id:"anesthesia",     label:"Anesthesia",           type:"text",   required:true,  placeholder:"e.g., 1% lidocaine w/ epi, 5 mL" },
      { id:"irrigation",     label:"Irrigation",           type:"text",   required:false, placeholder:"e.g., copious irrigation 500 mL NS" },
      { id:"closure",        label:"Closure Method",       type:"select", required:true,  options:["Primary closure with sutures","Staples","Steri-strips","Dermabond","Wound packed open"] },
      { id:"suture_material",label:"Suture Material",      type:"text",   required:false, placeholder:"e.g., 4-0 nylon interrupted" },
      { id:"tetanus",        label:"Tetanus Status",       type:"select", required:true,  options:["Up to date — no intervention","Tdap given","TIG given","TIG + Tdap given"] },
      { id:"antibiotics",    label:"Antibiotics",          type:"text",   required:false, placeholder:"e.g., none required" },
    ]
  },
  { id:"abscess-id",         label:"Abscess I&D",                 icon:"🔪", color:T.amber,
    fields:[
      { id:"location",       label:"Location",         type:"text",   required:true,  placeholder:"e.g., left lateral buttock" },
      { id:"size",           label:"Size (cm)",        type:"text",   required:true,  placeholder:"e.g., 3 × 2 cm" },
      { id:"fluctuance",     label:"Fluctuance",       type:"select", required:true,  options:["Present","Absent","Partial"] },
      { id:"anesthesia",     label:"Anesthesia",       type:"text",   required:true,  placeholder:"e.g., 1% lidocaine, 8 mL field block" },
      { id:"drainage",       label:"Drainage",         type:"text",   required:true,  placeholder:"e.g., ~10 mL purulent material expressed, cultures sent" },
      { id:"packing",        label:"Packing",          type:"text",   required:false, placeholder:"e.g., 0.25 in plain gauze, 4 cm" },
      { id:"antibiotics",    label:"Antibiotics",      type:"text",   required:false, placeholder:"e.g., TMP-SMX DS BID × 7 days" },
    ]
  },
  { id:"central-line",       label:"Central Line Placement",      icon:"🩸", color:T.purple,
    fields:[
      { id:"indication",     label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., septic shock requiring vasopressor infusion" },
      { id:"site",           label:"Access Site",          type:"select", required:true,  options:["Right internal jugular","Left internal jugular","Right subclavian","Left subclavian","Right femoral","Left femoral"] },
      { id:"us_guidance",    label:"Ultrasound Guidance",  type:"select", required:true,  options:["Real-time ultrasound guidance","Static ultrasound marking","Landmark technique"] },
      { id:"catheter_type",  label:"Catheter Type",        type:"text",   required:true,  placeholder:"e.g., 7 Fr triple-lumen, 15 cm" },
      { id:"attempts",       label:"Attempts",             type:"number", required:true,  placeholder:"1" },
      { id:"blood_return",   label:"Blood Return",         type:"select", required:true,  options:["Confirmed × all lumens","Confirmed × primary lumen","No blood return"] },
      { id:"cxr",            label:"Post-procedure CXR",   type:"select", required:true,  options:["Obtained — tip at cavoatrial junction, no PTX","Obtained — see report","Pending","Femoral — not indicated"] },
      { id:"complications",  label:"Complications",        type:"text",   required:false, placeholder:"None" },
    ]
  },
  { id:"rsi-intubation",     label:"RSI / Endotracheal Intubation",icon:"🫁", color:T.red,
    fields:[
      { id:"indication",     label:"Indication",         type:"textarea",required:true },
      { id:"gcs_pre",        label:"Pre-intubation GCS", type:"number", required:true,  placeholder:"e.g., 8" },
      { id:"spo2_pre",       label:"Pre-intubation SpO2",type:"text",   required:true,  placeholder:"e.g., 88% on 15L NRB" },
      { id:"induction_agent",label:"Induction Agent",    type:"text",   required:true,  placeholder:"e.g., ketamine 1.5 mg/kg IV (150 mg)" },
      { id:"paralytic",      label:"Paralytic",          type:"text",   required:true,  placeholder:"e.g., succinylcholine 1.5 mg/kg (150 mg)" },
      { id:"blade",          label:"Blade",              type:"select", required:true,  options:["Mac 3","Mac 4","Miller 2","Video (GlideScope)","Video (C-MAC)"] },
      { id:"ett_size",       label:"ETT Size",           type:"text",   required:true,  placeholder:"e.g., 7.5 cuffed" },
      { id:"depth",          label:"Depth at Lips",      type:"text",   required:true,  placeholder:"e.g., 22 cm" },
      { id:"attempts",       label:"Attempts",           type:"number", required:true },
      { id:"confirmation",   label:"Confirmation",       type:"text",   required:true,  placeholder:"e.g., waveform capnography, bilateral breath sounds" },
      { id:"complications",  label:"Complications",      type:"text",   required:false, placeholder:"None" },
    ]
  },
  { id:"lumbar-puncture",    label:"Lumbar Puncture",             icon:"🧠", color:T.rose,
    fields:[
      { id:"indication",      label:"Indication",             type:"textarea",required:true,  placeholder:"e.g., fever + headache + neck stiffness, r/o meningitis" },
      { id:"position",        label:"Patient Position",       type:"select", required:true,  options:["Lateral decubitus — fetal position","Seated leaning forward"] },
      { id:"level",           label:"Intervertebral Level",   type:"select", required:true,  options:["L3-L4","L4-L5","L2-L3"] },
      { id:"needle",          label:"Needle Used",            type:"text",   required:true,  placeholder:"e.g., 22G, 3.5 inch Quincke needle" },
      { id:"attempts",        label:"Attempts",               type:"number", required:true },
      { id:"opening_pressure",label:"Opening Pressure (cmH2O)",type:"number",required:false },
      { id:"csf_appearance",  label:"CSF Appearance",         type:"select", required:true,  options:["Clear and colorless","Xanthochromic","Bloody","Turbid/cloudy"] },
      { id:"tubes",           label:"Tubes Collected",        type:"text",   required:true,  placeholder:"e.g., 4 tubes: cell count, glucose/protein, culture, cell count" },
      { id:"complications",   label:"Complications",          type:"text",   required:false, placeholder:"None" },
    ]
  },
];

function ProcedureNoteDrafter({ note }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fields, setFields] = useState({});
  const [generatedNote, setGeneratedNote] = useState("");
  const [generating, setGenerating] = useState(false);

  const selectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setFields({});
    setGeneratedNote("");
  };

  const generateNote = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    try {
      const fieldSummary = selectedTemplate.fields
        .map(f => `${f.label}: ${fields[f.id] || "(not provided)"}`)
        .join("\n");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI. Draft a complete, medicolegally sound ${selectedTemplate.label} procedure note for an emergency medicine provider.

PROCEDURE: ${selectedTemplate.label}
PATIENT CONTEXT FROM NOTE: ${note ? [note.patient_name, note.patient_age, note.patient_gender].filter(Boolean).join(", ") : "Not specified"}
DATE/TIME: ${new Date().toLocaleString()}

COMPLETED FIELDS:
${fieldSummary}

Generate a complete, structured procedure note including: indication, preprocedure assessment/consent, procedure description, postprocedure status, and provider attestation. Format it professionally with clear section headers. The note must be clinically complete and suitable for the medical record.`,
      });
      setGeneratedNote(result);
    } catch(e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copyNote = () => {
    if (generatedNote) navigator.clipboard.writeText(generatedNote);
  };

  return (
    <div id="procedure-note-drafter" style={{ borderBottom:`1px solid rgba(30,58,95,0.55)`, paddingBottom:40, marginBottom:40 }}>
      <SectionHeader
        icon="📋" iconColor={T.amber}
        title="Procedure Note Drafter"
        subtitle="Select an ED procedure template. Fill the fields and Notrya AI drafts the complete, billable procedure note in under 60 seconds."
        badge={{ text:`${PROC_TEMPLATES.length} ED procedure templates`, background:"rgba(245,166,35,0.07)", border:"1px solid rgba(245,166,35,0.22)", color:T.amber }}
      />
      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16, alignItems:"start" }}>
        {/* Template selector */}
        <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
          {PROC_TEMPLATES.map(tmpl=>(
            <button key={tmpl.id} onClick={()=>selectTemplate(tmpl)}
              style={{ width:"100%", padding:"12px 14px", textAlign:"left", background:selectedTemplate?.id===tmpl.id?`rgba(${tmpl.color===T.teal?"0,212,188":"155,109,255"},0.1)`:"transparent", border:"none", borderBottom:`1px solid ${T.border}`, cursor:"pointer", display:"flex", alignItems:"center", gap:10, transition:"all 0.15s" }}
            >
              <span style={{ fontSize:18 }}>{tmpl.icon}</span>
              <span style={{ fontSize:13, fontWeight:selectedTemplate?.id===tmpl.id?700:500, color:selectedTemplate?.id===tmpl.id?T.bright:T.text }}>{tmpl.label}</span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
          {!selectedTemplate ? (
            <div style={{ padding:"52px 24px", textAlign:"center", color:T.dim, fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div>Select a procedure template to begin</div>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div style={{ padding:"12px 18px", background:"rgba(22,45,79,0.9)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.bright, marginRight:"auto" }}>{selectedTemplate.icon} {selectedTemplate.label}</span>
                {generatedNote && (
                  <button onClick={copyNote} style={{ padding:"5px 10px", borderRadius:6, background:"rgba(0,212,188,0.1)", color:T.teal, border:`1px solid rgba(0,212,188,0.25)`, fontSize:11.5, cursor:"pointer" }}>📋 Copy Note</button>
                )}
              </div>

              {/* Fields */}
              <div style={{ padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {selectedTemplate.fields.map(field=>{
                  const isFullWidth = field.type==="textarea";
                  return (
                    <div key={field.id} style={{ gridColumn:isFullWidth?"1/-1":"auto" }}>
                      <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>
                        {field.label}{field.required&&<span style={{color:T.amber}}> *</span>}
                      </label>
                      {field.type==="select"?(
                        <select
                          value={fields[field.id]||""}
                          onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                          style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:fields[field.id]?T.bright:T.dim, fontSize:13 }}
                        >
                          <option value="">Select…</option>
                          {field.options.map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      ):field.type==="textarea"?(
                        <textarea
                          value={fields[field.id]||""}
                          onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                          placeholder={field.placeholder}
                          rows={3}
                          style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, resize:"vertical", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }}
                        />
                      ):(
                        <input
                          type={field.type==="number"?"number":"text"}
                          value={fields[field.id]||""}
                          onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                          placeholder={field.placeholder}
                          style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Generate button */}
              <div style={{ padding:"0 20px 20px" }}>
                <button
                  onClick={generateNote}
                  disabled={generating}
                  style={{ width:"100%", background:generating?"rgba(245,166,35,0.2)":"linear-gradient(135deg,#f5a623,#e09010)", color:generating?T.amber:"#fff", fontWeight:700, fontSize:14, padding:"12px 24px", borderRadius:9, border:"none", cursor:generating?"not-allowed":"pointer" }}
                >
                  {generating ? "✨ Generating procedure note…" : "✨ Generate Note"}
                </button>
              </div>

              {/* Generated note output */}
              {generatedNote && (
                <div style={{ background:"#0a1929", padding:20, fontFamily:"DM Sans,sans-serif", fontSize:13.5, lineHeight:1.9, color:T.text, whiteSpace:"pre-wrap", borderTop:`1px solid ${T.border}` }}>
                  {generatedNote}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section 4: ED Note Drafter ────────────────────────────────────────────────
const ED_NOTES = [
  { id:"critical-care-note", label:"Critical Care",               icon:"🚨", color:T.red,
    description:"99291/99292 — documents time-based critical care with organ systems review",
    fields:[
      { id:"critical_care_time",    label:"Total Critical Care Time (min)", type:"number", required:true, helpText:"≥30 min = 99291. Each +30 min = 99292." },
      { id:"presenting_problem",   label:"Critical Presenting Problem",    type:"textarea",required:true },
      { id:"interventions",        label:"Critical Care Interventions",    type:"textarea",required:true, placeholder:"e.g., intubation, central line, vasopressor initiation" },
      { id:"disposition",          label:"Disposition",                    type:"select", required:true, options:["ICU admission","ICU transfer","Step-down care","ROSC — admitted to ICU","Deceased"] },
    ]
  },
  { id:"ama-note",           label:"Against Medical Advice",      icon:"⚠️", color:T.amber,
    description:"Documents capacity assessment, risks discussed, and patient decision to leave AMA",
    fields:[
      { id:"presenting_complaint",  label:"Presenting Complaint",              type:"text",    required:true },
      { id:"recommended_treatment", label:"Recommended Treatment / Admission", type:"textarea",required:true },
      { id:"capacity_assessment",   label:"Capacity Assessment",               type:"select",  required:true, options:["Patient demonstrates capacity — alert, oriented ×4, understands diagnosis and risks","Capacity borderline — psych consult obtained","Capacity absent — surrogate contacted"] },
      { id:"risks_discussed",       label:"Specific Risks Communicated",       type:"textarea",required:true },
      { id:"patient_statement",     label:"Patient's Stated Reason",           type:"text",    required:true },
      { id:"ama_form_signed",       label:"AMA Form",                          type:"select",  required:true, options:["Signed by patient","Patient refused to sign — documented","Representative signed"] },
    ]
  },
  { id:"code-note",          label:"Code / Resuscitation",        icon:"❤️", color:T.red,
    description:"Cardiac arrest documentation with timeline, rhythm progression, and ROSC/termination",
    fields:[
      { id:"arrest_time",     label:"Time of Arrest",    type:"text",    required:true },
      { id:"initial_rhythm",  label:"Initial Rhythm",    type:"select",  required:true, options:["VF","pVT","PEA","Asystole"] },
      { id:"epi_doses",       label:"Epinephrine Doses", type:"number",  required:true },
      { id:"medications",     label:"Medications Given", type:"textarea",required:true, placeholder:"e.g., Epi 1mg × 4, Amiodarone 300mg + 150mg" },
      { id:"airway_management",label:"Airway Management",type:"text",    required:true },
      { id:"total_downtime",  label:"Total Downtime (min)",type:"number",required:true },
      { id:"outcome",         label:"Outcome",           type:"select",  required:true, options:["ROSC achieved — admitted to ICU","ROSC — cath lab activated","Resuscitation unsuccessful — death pronounced"] },
    ]
  },
  { id:"trauma-note",        label:"Trauma Activation",           icon:"🏥", color:T.red,    description:"Primary and secondary survey, mechanism, resuscitation actions" },
  { id:"psychiatric-hold",   label:"Psychiatric Hold / 5150",     icon:"🧠", color:T.rose,   description:"Involuntary hold documentation with danger criteria" },
  { id:"restraint-note",     label:"Physical/Chemical Restraint", icon:"🔐", color:T.purple, description:"Restraint application note with indication and monitoring plan" },
  { id:"pronouncement-note", label:"Death Pronouncement",         icon:"🕯️", color:T.dim,   description:"Death pronouncement note with time, circumstances, and notification" },
  { id:"transfer-note",      label:"Transfer / EMTALA",           icon:"🚑", color:"#4a90d9",description:"EMTALA-compliant transfer note" },
  { id:"discharge-instructions",label:"Discharge Instructions",   icon:"🏠", color:T.green, description:"Comprehensive discharge instructions with return precautions" },
];

function EDNoteDrafter({ note }) {
  const [selected, setSelected] = useState(null);
  const [fields, setFields]     = useState({});
  const [generatedNote, setGeneratedNote] = useState("");
  const [generating, setGenerating] = useState(false);

  const selectNote = (n) => {
    setSelected(n);
    setFields({});
    setGeneratedNote("");
  };

  const generateNote = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const fieldSummary = (selected.fields||[]).map(f=>`${f.label}: ${fields[f.id]||"(not provided)"}`).join("\n");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI. Draft a complete, medicolegally sound ${selected.label} note for an emergency medicine provider.

${fieldSummary ? `COMPLETED FIELDS:\n${fieldSummary}\n` : ""}

Generate a professional, complete note suitable for the medical record. Include all required medicolegal elements for this specific note type.`,
      });
      setGeneratedNote(result);
    } catch(e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div id="ed-note-drafter" style={{ borderBottom:`1px solid rgba(30,58,95,0.55)`, paddingBottom:40, marginBottom:40, background:"rgba(11,29,53,0.35)", margin:"0 -20px 40px", padding:"40px 20px" }}>
      <SectionHeader
        icon="📝" iconColor={T.rose}
        title="Common ED Notes"
        subtitle="Structured, medicolegally sound note templates for common ED documentation requirements."
        badge={{ text:`${ED_NOTES.length} ED note templates`, background:"rgba(244,114,182,0.07)", border:"1px solid rgba(244,114,182,0.22)", color:T.rose }}
      />
      {/* Card grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:10, marginBottom:20 }}>
        {ED_NOTES.map(n=>(
          <div key={n.id} onClick={()=>selectNote(n)}
            style={{ background:T.panel, border:`1px solid ${selected?.id===n.id?n.color:T.border}`, borderRadius:11, padding:16, cursor:"pointer", transition:"all 0.18s", background:selected?.id===n.id?`rgba(${n.color.replace("#","")==="ff5c6c"?"255,92,108":"0,212,188"},0.04)`:T.panel }}
          >
            <div style={{ fontSize:24, marginBottom:8 }}>{n.icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:T.bright, marginBottom:4 }}>{n.label}</div>
            <div style={{ fontSize:11, color:T.dim, lineHeight:1.5 }}>{n.description}</div>
          </div>
        ))}
      </div>

      {/* Editor */}
      {selected && (
        <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
          <div style={{ padding:"12px 18px", background:"rgba(22,45,79,0.9)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T.bright, marginRight:"auto" }}>{selected.icon} {selected.label}</span>
            {generatedNote && (
              <button onClick={()=>navigator.clipboard.writeText(generatedNote)} style={{ padding:"5px 10px", borderRadius:6, background:"rgba(244,114,182,0.1)", color:T.rose, border:`1px solid rgba(244,114,182,0.25)`, fontSize:11.5, cursor:"pointer" }}>📋 Copy</button>
            )}
          </div>
          {selected.fields?.length > 0 && (
            <div style={{ padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {selected.fields.map(field=>{
                const isFullWidth = field.type==="textarea";
                return (
                  <div key={field.id} style={{ gridColumn:isFullWidth?"1/-1":"auto" }}>
                    <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>
                      {field.label}{field.required&&<span style={{color:T.rose}}> *</span>}
                    </label>
                    {field.helpText && <div style={{ fontSize:10.5, color:T.muted, marginBottom:5 }}>{field.helpText}</div>}
                    {field.type==="select"?(
                      <select value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                        style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:fields[field.id]?T.bright:T.dim, fontSize:13 }}>
                        <option value="">Select…</option>
                        {field.options.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ):field.type==="textarea"?(
                      <textarea value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                        placeholder={field.placeholder} rows={3}
                        style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, resize:"vertical", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
                    ):(
                      <input type={field.type==="number"?"number":"text"} value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                        placeholder={field.placeholder}
                        style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ padding:"0 20px 20px" }}>
            <button onClick={generateNote} disabled={generating}
              style={{ width:"100%", background:generating?"rgba(244,114,182,0.2)":"linear-gradient(135deg,#f472b6,#d946a8)", color:generating?T.rose:"#fff", fontWeight:700, fontSize:14, padding:"12px 24px", borderRadius:9, border:"none", cursor:generating?"not-allowed":"pointer" }}>
              {generating ? "✨ Drafting note…" : "✨ AI Draft Note"}
            </button>
          </div>
          {generatedNote && (
            <div style={{ background:"#0a1929", padding:20, fontFamily:"DM Sans,sans-serif", fontSize:13.5, lineHeight:1.9, color:T.text, whiteSpace:"pre-wrap", borderTop:`1px solid ${T.border}` }}>
              {generatedNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section 5: Procedure Log ──────────────────────────────────────────────────
function ProcedureLog({ note }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    procedure_name:"", cpt_code:"", date_performed:new Date().toISOString().split("T")[0],
    location:"", supervision:"Attending (primary operator)", attempts:1, success:true,
    ultrasound_used:false, complications:"None", indication:"", attending_name:"", notes:""
  });
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("date_performed");
  const [sortDir, setSortDir] = useState("desc");

  const { data: logs=[], isLoading } = useQuery({
    queryKey:["procedureLogs"],
    queryFn:()=>base44.entities.ProcedureLog.list('-date_performed', 50),
  });

  const createMutation = useMutation({
    mutationFn:(data)=>base44.entities.ProcedureLog.create(data),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:["procedureLogs"]});
      setForm({ procedure_name:"", cpt_code:"", date_performed:new Date().toISOString().split("T")[0], location:"", supervision:"Attending (primary operator)", attempts:1, success:true, ultrasound_used:false, complications:"None", indication:"", attending_name:"", notes:"" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn:(id)=>base44.entities.ProcedureLog.delete(id),
    onSuccess:()=>queryClient.invalidateQueries({queryKey:["procedureLogs"]}),
  });

  const handleSubmit = (e)=>{
    e.preventDefault();
    if (!form.procedure_name.trim()) return;
    createMutation.mutate({ ...form, note_id: note?.id });
  };

  const exportCSV = ()=>{
    const cols = ["procedure_name","cpt_code","date_performed","location","supervision","attempts","success","ultrasound_used","complications","attending_name","indication"];
    const header = cols.join(",");
    const rows = logs.map(r=>cols.map(c=>JSON.stringify(r[c]??"")||"").join(","));
    const blob = new Blob([[header,...rows].join("\n")],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="procedure_log.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const supervisionColors = {
    "Attending (primary operator)":        {bg:"rgba(0,212,188,0.1)",  fg:T.teal},
    "Supervising (resident/APP primary)":  {bg:"rgba(155,109,255,0.1)",fg:T.purple},
    "Observed":                            {bg:"rgba(74,114,153,0.12)",fg:T.dim},
    "Assisted":                            {bg:"rgba(245,166,35,0.1)", fg:T.amber},
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase();
    let result = logs.filter(r =>
      !q ||
      (r.procedure_name || "").toLowerCase().includes(q) ||
      (r.cpt_code || "").toLowerCase().includes(q) ||
      (r.location || "").toLowerCase().includes(q)
    );
    result = [...result].sort((a, b) => {
      let av = a[sortField] ?? "";
      let bv = b[sortField] ?? "";
      if (sortField === "date_performed") {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [logs, search, sortField, sortDir]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ color: T.muted, fontSize: 9, marginLeft: 3 }}>⇅</span>;
    return <span style={{ color: T.teal, fontSize: 9, marginLeft: 3 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div id="procedure-log" style={{ paddingBottom:40 }}>
      <SectionHeader
        icon="📊" iconColor={T.green}
        title="Procedure Log"
        subtitle="Maintain a personal procedure log for credentialing, reappointment, and competency tracking."
        badge={{ text:"Credentialing ready", background:"rgba(46,204,113,0.07)", border:"1px solid rgba(46,204,113,0.22)", color:T.green }}
      />

      {/* Log Entry Form */}
      <form onSubmit={handleSubmit} style={{ background:T.panel, border:`1px solid rgba(46,204,113,0.2)`, borderRadius:14, padding:"22px 24px", marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.bright, marginBottom:16 }}>➕ Log New Procedure</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14 }}>
          {[
            { key:"date_performed", label:"Date", type:"date", required:true, colSpan:1 },
            { key:"procedure_name", label:"Procedure Name", type:"text", required:true, placeholder:"e.g., Laceration Repair", colSpan:2 },
            { key:"cpt_code",       label:"CPT Code", type:"text", required:false, placeholder:"e.g., 12002", colSpan:1, mono:true },
            { key:"location",       label:"Site / Location", type:"text", required:false, placeholder:"e.g., right IJ", colSpan:2 },
          ].map(f=>(
            <div key={f.key} style={{ gridColumn:`span ${f.colSpan||1}` }}>
              <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>{f.label}{f.required&&<span style={{color:T.green}}> *</span>}</label>
              <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} required={f.required} placeholder={f.placeholder}
                style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:f.mono?13:13, fontFamily:f.mono?"JetBrains Mono,monospace":"DM Sans,sans-serif", boxSizing:"border-box" }} />
            </div>
          ))}

          {/* Supervision */}
          <div style={{ gridColumn:"span 2" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Role <span style={{color:T.green}}>*</span></label>
            <select value={form.supervision} onChange={e=>setForm({...form,supervision:e.target.value})}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13 }}>
              {["Attending (primary operator)","Supervising (resident/APP primary)","Assisted","Observed"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Attempts */}
          <div>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Attempts</label>
            <input type="number" min={1} max={20} value={form.attempts} onChange={e=>setForm({...form,attempts:+e.target.value})}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
          </div>

          {/* Toggles row */}
          <div style={{ gridColumn:"span 3", display:"flex", gap:24, alignItems:"center" }}>
            {[
              { key:"success",        label:"Successful" },
              { key:"ultrasound_used",label:"US Guidance" },
            ].map(t=>(
              <label key={t.key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <div onClick={()=>setForm({...form,[t.key]:!form[t.key]})}
                  style={{ width:40, height:22, borderRadius:11, background:form[t.key]?"rgba(46,204,113,0.4)":"rgba(30,58,95,0.8)", border:`1px solid ${form[t.key]?T.green:T.border}`, position:"relative", transition:"all 0.2s", cursor:"pointer" }}>
                  <div style={{ position:"absolute", top:2, left:form[t.key]?20:2, width:16, height:16, borderRadius:"50%", background:form[t.key]?T.green:T.dim, transition:"left 0.2s" }} />
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{t.label}</span>
              </label>
            ))}
          </div>

          {/* Complications */}
          <div style={{ gridColumn:"span 3" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Complications</label>
            <input value={form.complications} onChange={e=>setForm({...form,complications:e.target.value})} placeholder="None"
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
          </div>

          {/* Indication */}
          <div style={{ gridColumn:"span 3" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Indication</label>
            <textarea value={form.indication} onChange={e=>setForm({...form,indication:e.target.value})} rows={2}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, resize:"vertical", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
          </div>

          {/* Attending + Notes */}
          <div style={{ gridColumn:"span 2" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Attending</label>
            <input value={form.attending_name} onChange={e=>setForm({...form,attending_name:e.target.value})}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
          </div>
          <div style={{ gridColumn:"span 1" }} />

          <div style={{ gridColumn:"span 3" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Notes / Pearls</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} placeholder="Optional: clinical pearl, teaching point…"
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, resize:"vertical", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          <button type="submit" disabled={createMutation.isPending}
            style={{ background:"linear-gradient(135deg,#2ecc71,#27ae60)", color:"#fff", fontWeight:700, fontSize:14, padding:"11px 28px", borderRadius:9, border:"none", cursor:createMutation.isPending?"not-allowed":"pointer" }}>
            {createMutation.isPending ? "Logging…" : "➕ Log Procedure"}
          </button>
          <button type="button" onClick={()=>setForm({ procedure_name:"", cpt_code:"", date_performed:new Date().toISOString().split("T")[0], location:"", supervision:"Attending (primary operator)", attempts:1, success:true, ultrasound_used:false, complications:"None", indication:"", attending_name:"", notes:"" })}
            style={{ background:"transparent", color:T.dim, border:`1px solid ${T.border}`, borderRadius:9, padding:"10px 18px", cursor:"pointer", fontSize:13 }}>
            Clear
          </button>
        </div>
      </form>

      {/* Log Table */}
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.bright }}>Procedure History ({filteredAndSorted.length}{search ? ` of ${logs.length}` : ""})</span>
          <div style={{ flex:1, minWidth:180, position:"relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, CPT code, or location…"
              style={{ width:"100%", background:T.edge, border:`1.5px solid ${T.border}`, borderRadius:8, padding:"6px 12px 6px 30px", color:T.bright, fontSize:12, fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor = T.teal}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.dim, pointerEvents:"none" }}>🔍</span>
            {search && (
              <button onClick={() => setSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:13, padding:0, lineHeight:1 }}>✕</button>
            )}
          </div>
          <button onClick={exportCSV} style={{ padding:"5px 12px", borderRadius:6, background:"rgba(46,204,113,0.09)", color:T.green, border:`1px solid rgba(46,204,113,0.25)`, fontSize:11.5, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" }}>
            ⬇ Export CSV
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding:"24px 16px", textAlign:"center", color:T.dim, fontSize:13 }}>Loading procedure log…</div>
        ) : filteredAndSorted.length === 0 ? (
          <div style={{ padding:"40px 16px", textAlign:"center", color:T.dim, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
            <div style={{ fontWeight:600, color:T.text, marginBottom:6 }}>{search ? "No procedures matched your search" : "No procedures logged yet"}</div>
            <div>{search ? "Try a different keyword or clear the search." : "Use the form above to log your first procedure."}</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {[
                    { label:"Date",         field:"date_performed",  sortable:true },
                    { label:"Procedure",    field:"procedure_name",  sortable:true },
                    { label:"CPT",          field:"cpt_code",        sortable:false },
                    { label:"Site",         field:"location",        sortable:false },
                    { label:"Role",         field:"supervision",     sortable:false },
                    { label:"Att.",         field:"attempts",        sortable:false },
                    { label:"✓",            field:"success",         sortable:false },
                    { label:"US",           field:"ultrasound_used", sortable:false },
                    { label:"Complications",field:"complications",   sortable:false },
                    { label:"",             field:"",                sortable:false },
                  ].map((h,i)=>(
                    <th key={i}
                      onClick={h.sortable ? () => toggleSort(h.field) : undefined}
                      style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:h.sortable&&sortField===h.field?T.teal:T.dim, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", cursor:h.sortable?"pointer":"default", userSelect:"none" }}>
                      {h.label}{h.sortable && <SortIcon field={h.field} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map(row=>{
                  const sc = supervisionColors[row.supervision] || {bg:"rgba(74,114,153,0.12)",fg:T.dim};
                  return (
                    <tr key={row.id} style={{ borderBottom:`1px solid rgba(30,58,95,0.4)` }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(22,45,79,0.4)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      <td style={{ padding:"10px 12px", color:T.dim, whiteSpace:"nowrap" }}>{row.date_performed?.split("T")[0]||"—"}</td>
                      <td style={{ padding:"10px 12px", fontWeight:600, color:T.bright, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.procedure_name}</td>
                      <td style={{ padding:"10px 12px", fontFamily:"JetBrains Mono,monospace", color:T.teal }}>{row.cpt_code||"—"}</td>
                      <td style={{ padding:"10px 12px", color:T.text, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.location||"—"}</td>
                      <td style={{ padding:"10px 12px" }}>
                        <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10.5, fontWeight:600, background:sc.bg, color:sc.fg }}>
                          {row.supervision?.split(" ")[0]||"—"}
                        </span>
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"center", color:T.text }}>{row.attempts||1}</td>
                      <td style={{ padding:"10px 12px", textAlign:"center" }}>
                        <span style={{ color:row.success!==false?T.green:T.red }}>{row.success!==false?"✓":"✗"}</span>
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"center", color:T.dim }}>{row.ultrasound_used?"✅":"—"}</td>
                      <td style={{ padding:"10px 12px", color:T.text, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.complications||"—"}</td>
                      <td style={{ padding:"10px 12px" }}>
                        <button onClick={()=>deleteMutation.mutate(row.id)} style={{ background:"transparent", border:"none", color:T.dim, cursor:"pointer", fontSize:12 }} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ProceduresTabContent({ note, standalone = false }) {
  const SECTIONS = [
    { id:"ai-recommender",        label:"🤖 AI Recommendations", color:T.purple },
    { id:"cpt-search",            label:"🔍 CPT Code Search",    color:T.teal   },
    { id:"procedure-note-drafter",label:"📋 Procedure Notes",    color:T.amber  },
    { id:"ed-note-drafter",       label:"📝 ED Notes",           color:T.rose   },
    { id:"procedure-log",         label:"📊 Procedure Log",      color:T.green  },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  return (
    <div style={{ background:T.navy, minHeight:"100%", fontFamily:"DM Sans,sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:0.8} }
        select option { background: #0e2340; color: #c8ddf0; }
      `}</style>

      {/* Page Header */}
      <div style={{ padding:"28px 24px 20px", borderBottom:`1px solid rgba(30,58,95,0.6)` }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
          <div style={{ fontSize:28, background:"rgba(0,212,188,0.1)", border:"1px solid rgba(0,212,188,0.2)", borderRadius:12, padding:12 }}>✂️</div>
          <div>
            <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:26, fontWeight:700, color:T.bright, margin:0 }}>Procedures</h1>
            <p style={{ fontSize:13, color:T.dim, margin:"4px 0 0" }}>AI-assisted procedure recommendations, CPT lookup, note templates, and procedure logging</p>
          </div>
        </div>
        {/* Jump bar */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>scrollTo(s.id)}
              style={{ padding:"5px 13px", borderRadius:20, fontSize:11.5, fontWeight:600, background:"rgba(14,35,64,0.9)", border:`1px solid ${T.border}`, color:T.dim, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color; e.currentTarget.style.color=s.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.dim;}}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding:"32px 24px" }}>
        <AIProcedureRecommender note={note} standalone={standalone} />
        <CPTSearch />
        <ProcedureNoteDrafter note={note} />
        <EDNoteDrafter note={note} />
        <ProcedureLog note={note} />
      </div>
    </div>
  );
}