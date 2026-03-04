import React, { useState, useMemo, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

const CPT_DATA = [
  { cptCode:"12001", procedureName:"Simple repair, scalp/neck/axillae ≤2.5cm",    category:"wound-repair",  rvu:1.83 },
  { cptCode:"12002", procedureName:"Simple repair, scalp/neck/axillae 2.6–7.5cm", category:"wound-repair",  rvu:2.08 },
  { cptCode:"12004", procedureName:"Simple repair 7.6–12.5cm",                    category:"wound-repair",  rvu:2.51 },
  { cptCode:"12011", procedureName:"Simple repair, face/ears/eyelids ≤2.5cm",     category:"wound-repair",  rvu:2.40 },
  { cptCode:"12032", procedureName:"Intermediate repair, scalp/trunk 2.6–7.5cm",  category:"wound-repair",  rvu:3.44 },
  { cptCode:"12051", procedureName:"Intermediate repair, face/ears ≤2.5cm",       category:"wound-repair",  rvu:4.25 },
  { cptCode:"13100", procedureName:"Complex repair, trunk 1.1–2.5cm",             category:"wound-repair",  rvu:5.12 },
  { cptCode:"13131", procedureName:"Complex repair, forehead/cheeks 1.1–2.5cm",   category:"wound-repair",  rvu:5.67 },
  { cptCode:"31500", procedureName:"Emergency endotracheal intubation",            category:"airway",        rvu:3.14 },
  { cptCode:"31575", procedureName:"Flexible fiberoptic laryngoscopy",             category:"airway",        rvu:2.61 },
  { cptCode:"31603", procedureName:"Cricothyrotomy",                               category:"airway",        rvu:6.42 },
  { cptCode:"94002", procedureName:"Ventilation management, hospital inpatient",   category:"airway",        rvu:3.86 },
  { cptCode:"36556", procedureName:"Central venous catheter, non-tunneled ≥5yrs",  category:"vascular",      rvu:3.58 },
  { cptCode:"36569", procedureName:"PICC line insertion",                          category:"vascular",      rvu:2.41 },
  { cptCode:"36625", procedureName:"Arterial line, percutaneous",                  category:"vascular",      rvu:1.95 },
  { cptCode:"36680", procedureName:"Intraosseous catheter placement",              category:"vascular",      rvu:1.66 },
  { cptCode:"23650", procedureName:"Shoulder dislocation, closed reduction",       category:"ortho",         rvu:4.84 },
  { cptCode:"29125", procedureName:"Short arm splint, static",                     category:"ortho",         rvu:1.04 },
  { cptCode:"29515", procedureName:"Short leg splint",                             category:"ortho",         rvu:1.23 },
  { cptCode:"20610", procedureName:"Joint aspiration/injection, major joint",      category:"ortho",         rvu:1.40 },
  { cptCode:"20600", procedureName:"Joint aspiration/injection, small joint",      category:"ortho",         rvu:0.91 },
  { cptCode:"92960", procedureName:"External electrical cardioversion",            category:"cardio",        rvu:3.20 },
  { cptCode:"32551", procedureName:"Tube thoracostomy",                            category:"cardio",        rvu:4.53 },
  { cptCode:"32422", procedureName:"Thoracentesis, therapeutic",                   category:"cardio",        rvu:3.84 },
  { cptCode:"93000", procedureName:"ECG with interpretation",                      category:"cardio",        rvu:0.56 },
  { cptCode:"99291", procedureName:"Critical care, first 30–74 minutes",           category:"critical-care", rvu:9.14 },
  { cptCode:"99292", procedureName:"Critical care, each additional 30 min",        category:"critical-care", rvu:4.57 },
  { cptCode:"99152", procedureName:"Procedural sedation, first 15 min",            category:"critical-care", rvu:1.34 },
  { cptCode:"96374", procedureName:"IV push, single drug",                         category:"critical-care", rvu:0.58 },
  { cptCode:"10060", procedureName:"I&D abscess, simple",                          category:"drainage",      rvu:1.55 },
  { cptCode:"10061", procedureName:"I&D abscess, complicated",                     category:"drainage",      rvu:2.97 },
  { cptCode:"10140", procedureName:"I&D hematoma/seroma",                          category:"drainage",      rvu:2.32 },
  { cptCode:"49083", procedureName:"Paracentesis, diagnostic/therapeutic",         category:"drainage",      rvu:2.18 },
  { cptCode:"51702", procedureName:"Bladder catheterization, simple",              category:"drainage",      rvu:0.56 },
  { cptCode:"69200", procedureName:"Foreign body removal, ear canal",              category:"drainage",      rvu:1.02 },
  { cptCode:"30300", procedureName:"Foreign body removal, nasal",                  category:"drainage",      rvu:1.28 },
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

function SectionHeader({ icon, title, subtitle, badge }) {
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

function CPTSearch({ onSelectCPT }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [copied, setCopied] = useState(null);

  const filtered = useMemo(() => {
    return CPT_DATA.filter(row => {
      const matchCat = category === "all" || row.category === category;
      const q = query.toLowerCase();
      const matchQ = !q || row.cptCode.includes(q) || row.procedureName.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const categories = ["all", ...Object.keys(CATEGORY_LABELS)];

  return (
    <div id="cpt-search" style={{ borderBottom:`1px solid rgba(30,58,95,0.55)`, paddingBottom:40, marginBottom:40 }}>
      <SectionHeader
        icon="🔍"
        title="Procedure & CPT Code Search"
        subtitle="Search by procedure name, body region, or keyword."
        badge={{ text:`${CPT_DATA.length}+ ED-relevant codes`, background:"rgba(0,212,188,0.07)", border:"1px solid rgba(0,212,188,0.2)", color:T.teal }}
      />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search procedures or CPT codes… e.g. 'laceration', '12002', 'intubation'"
        style={{ width:"100%", background:T.panel, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"13px 18px", color:T.bright, fontSize:14, fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box", marginBottom:12 }}
        onFocus={e => e.target.style.borderColor = T.teal}
        onBlur={e => e.target.style.borderColor = T.border}
      />
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{ padding:"5px 13px", borderRadius:20, fontSize:11.5, fontWeight:600, cursor:"pointer", border:`1px solid ${category===cat?"rgba(0,212,188,0.3)":T.border}`, background:category===cat?"rgba(0,212,188,0.1)":"transparent", color:category===cat?T.teal:T.dim, transition:"all 0.15s" }}>
            {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 80px 80px", gap:0 }}>
          {["CPT Code","Procedure","Category","RVU"].map(h => (
            <div key={h} style={{ padding:"10px 14px", fontSize:11, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${T.border}` }}>{h}</div>
          ))}
          {filtered.slice(0, 50).map(row => {
            const cc = CATEGORY_COLORS[row.category] || { bg:"rgba(74,114,153,0.12)", fg:"#4a7299" };
            return (
              <React.Fragment key={row.cptCode}>
                <div style={{ padding:"10px 14px", borderBottom:`1px solid rgba(30,58,95,0.4)`, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:13, fontWeight:700, color:T.teal }}>{row.cptCode}</span>
                  <button onClick={() => copyCode(row.cptCode)} style={{ background:"transparent", border:"none", cursor:"pointer", color:copied===row.cptCode?T.green:T.muted, fontSize:11, padding:"2px 4px" }}>
                    {copied === row.cptCode ? "✓" : "⎘"}
                  </button>
                </div>
                <div
                  onClick={() => onSelectCPT && onSelectCPT(row)}
                  title="Use in Procedure Note Drafter"
                  style={{ padding:"10px 14px", fontSize:13, fontWeight:600, color:T.bright, borderBottom:`1px solid rgba(30,58,95,0.4)`, cursor:onSelectCPT?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}
                  onMouseEnter={e=>{ if(onSelectCPT){ e.currentTarget.style.background="rgba(0,212,188,0.05)"; e.currentTarget.style.color=T.teal; } }}
                  onMouseLeave={e=>{ if(onSelectCPT){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.bright; } }}
                >
                  <span>{row.procedureName}</span>
                  {onSelectCPT && <span style={{ fontSize:10, color:T.teal, opacity:0.7, whiteSpace:"nowrap" }}>→ Use in Drafter</span>}
                </div>
                <div style={{ padding:"10px 14px", borderBottom:`1px solid rgba(30,58,95,0.4)`, display:"flex", alignItems:"center" }}>
                  <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10.5, fontWeight:600, background:cc.bg, color:cc.fg }}>{CATEGORY_LABELS[row.category] || row.category}</span>
                </div>
                <div style={{ padding:"10px 14px", fontFamily:"JetBrains Mono,monospace", fontSize:12, color:T.dim, borderBottom:`1px solid rgba(30,58,95,0.4)` }}>{row.rvu}</div>
              </React.Fragment>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{ padding:"32px 16px", textAlign:"center", color:T.dim, fontSize:13 }}>
            🔍 No procedures matched your search.
          </div>
        )}
      </div>
    </div>
  );
}

const PROC_CATEGORIES = [
  { id:"all", label:"All" },
  { id:"wound", label:"🩹 Wound" },
  { id:"vascular", label:"🩸 Vascular" },
  { id:"airway", label:"🫁 Airway" },
  { id:"thoracic", label:"💧 Thoracic" },
  { id:"cardiac", label:"❤️ Cardiac" },
  { id:"abdominal", label:"🫀 Abdominal" },
  { id:"neuro", label:"🧠 Neuro" },
  { id:"ortho", label:"🦴 Ortho" },
  { id:"uro", label:"🚿 Urology" },
  { id:"gi", label:"🔩 GI" },
  { id:"gyn", label:"🌸 OB/GYN" },
  { id:"ent", label:"👁️ ENT/Ophth" },
  { id:"anesthesia", label:"💉 Anesthesia" },
];

const PROC_TEMPLATES = [
  // ── Wound ──────────────────────────────────────────────────────────────────
  { id:"laceration-repair", label:"Laceration Repair", category:"wound", icon:"🩹", color:T.teal,
    fields:[
      { id:"location",        label:"Wound Location",       type:"text",    required:true,  placeholder:"e.g., right volar forearm" },
      { id:"mechanism",       label:"Mechanism",            type:"text",    required:true,  placeholder:"e.g., fall on glass" },
      { id:"length_cm",       label:"Length (cm)",          type:"number",  required:true,  placeholder:"4.5" },
      { id:"depth",           label:"Depth",                type:"select",  required:true,  options:["Superficial","Subcutaneous fat","Fascia","Muscle","Tendon/bone visible"] },
      { id:"contamination",   label:"Contamination",        type:"select",  required:true,  options:["Clean","Clean-contaminated","Contaminated","Dirty/infected"] },
      { id:"neurovasc",       label:"Neurovascular Status", type:"select",  required:true,  options:["Intact distal","Sensation diminished","Motor deficit","Vascular compromise"] },
      { id:"anesthesia",      label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine w/ epi, 5 mL" },
      { id:"irrigation",      label:"Irrigation",           type:"text",    required:false, placeholder:"e.g., 500 mL NS under pressure" },
      { id:"closure",         label:"Closure Method",       type:"select",  required:true,  options:["Primary closure with sutures","Staples","Steri-strips","Dermabond","Wound packed open"] },
      { id:"suture_material", label:"Suture Material",      type:"text",    required:false, placeholder:"e.g., 4-0 nylon interrupted" },
      { id:"tetanus",         label:"Tetanus Status",       type:"select",  required:true,  options:["Up to date — no intervention","Tdap given","TIG given","TIG + Tdap given"] },
      { id:"antibiotics",     label:"Antibiotics",          type:"text",    required:false, placeholder:"e.g., none required" },
    ]
  },
  { id:"abscess-id", label:"Abscess I&D", category:"wound", icon:"🔪", color:T.amber,
    fields:[
      { id:"location",    label:"Location",         type:"text",   required:true,  placeholder:"e.g., left lateral buttock" },
      { id:"size",        label:"Size (cm)",        type:"text",   required:true,  placeholder:"e.g., 3 × 2 cm" },
      { id:"fluctuance",  label:"Fluctuance",       type:"select", required:true,  options:["Present","Absent","Partial"] },
      { id:"anesthesia",  label:"Anesthesia",       type:"text",   required:true,  placeholder:"e.g., 1% lidocaine, 8 mL field block" },
      { id:"drainage",    label:"Drainage",         type:"text",   required:true,  placeholder:"e.g., ~10 mL purulent material, cultures sent" },
      { id:"packing",     label:"Packing",          type:"text",   required:false, placeholder:"e.g., 0.25 in plain gauze, 4 cm" },
      { id:"antibiotics", label:"Antibiotics",      type:"text",   required:false, placeholder:"e.g., TMP-SMX DS BID × 7 days" },
    ]
  },
  { id:"foreign-body-removal", label:"Foreign Body Removal", category:"wound", icon:"🧲", color:T.teal,
    fields:[
      { id:"location",      label:"Location",              type:"text",   required:true,  placeholder:"e.g., right index finger" },
      { id:"fb_type",       label:"Foreign Body Type",     type:"text",   required:true,  placeholder:"e.g., glass shard, wood splinter, fishhook" },
      { id:"imaging",       label:"Pre-procedure Imaging", type:"select", required:true,  options:["Plain X-ray — FB visible","Plain X-ray — FB not visible","Ultrasound guided","No imaging — palpable FB","CT scan"] },
      { id:"anesthesia",    label:"Anesthesia",            type:"text",   required:true,  placeholder:"e.g., digital nerve block, 3 mL 2% lidocaine" },
      { id:"technique",     label:"Removal Technique",     type:"text",   required:true,  placeholder:"e.g., longitudinal incision, hemostat retrieval" },
      { id:"fb_retrieved",  label:"FB Retrieved",          type:"select", required:true,  options:["Completely retrieved — confirmed intact","Partially retrieved","Not retrieved — referral placed"] },
      { id:"wound_closure", label:"Wound Closure",         type:"text",   required:false, placeholder:"e.g., primary closure 4-0 nylon × 2" },
      { id:"complications", label:"Complications",         type:"text",   required:false, placeholder:"None" },
    ]
  },
  { id:"burn-wound", label:"Burn Wound Care", category:"wound", icon:"🔥", color:T.red,
    fields:[
      { id:"mechanism",          label:"Burn Mechanism",       type:"select",  required:true,  options:["Thermal — flame","Thermal — scald","Thermal — contact","Chemical","Electrical","Radiation"] },
      { id:"tbsa",               label:"TBSA (%)",             type:"number",  required:true,  placeholder:"e.g., 9" },
      { id:"depth",              label:"Depth",                type:"select",  required:true,  options:["Superficial (1st degree)","Partial thickness — superficial (2nd degree)","Partial thickness — deep (2nd degree)","Full thickness (3rd degree)"] },
      { id:"location",           label:"Body Region(s)",       type:"text",    required:true,  placeholder:"e.g., right forearm and dorsal hand" },
      { id:"wound_care",         label:"Wound Care Performed", type:"textarea",required:true,  placeholder:"e.g., cleansed, devitalized tissue debrided, bacitracin, non-adherent dressing" },
      { id:"fluid_resuscitation",label:"Fluid Resuscitation",  type:"text",    required:false, placeholder:"e.g., Parkland: 4 mL × kg × TBSA% over 24h" },
      { id:"disposition",        label:"Disposition",          type:"select",  required:true,  options:["Discharged with wound care instructions","Admitted — general","Transferred to burn center"] },
    ]
  },
  // ── Vascular Access ────────────────────────────────────────────────────────
  { id:"central-line", label:"Central Line Placement", category:"vascular", icon:"🩸", color:T.purple,
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., septic shock requiring vasopressors" },
      { id:"site",          label:"Access Site",          type:"select",  required:true,  options:["Right internal jugular","Left internal jugular","Right subclavian","Left subclavian","Right femoral","Left femoral"] },
      { id:"us_guidance",   label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound","Static marking","Landmark technique"] },
      { id:"catheter_type", label:"Catheter Type",        type:"text",    required:true,  placeholder:"e.g., 7 Fr triple-lumen, 15 cm" },
      { id:"attempts",      label:"Attempts",             type:"number",  required:true,  placeholder:"1" },
      { id:"blood_return",  label:"Blood Return",         type:"select",  required:true,  options:["Confirmed × all lumens","Confirmed × primary lumen","No blood return"] },
      { id:"cxr",           label:"Post-procedure CXR",   type:"select",  required:true,  options:["Tip at cavoatrial junction, no PTX","Obtained — see report","Pending","Femoral — not indicated"] },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"arterial-line", label:"Arterial Line Placement", category:"vascular", icon:"❤️‍🩹", color:T.red,
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., continuous hemodynamic monitoring, frequent ABGs" },
      { id:"site",          label:"Access Site",          type:"select",  required:true,  options:["Right radial","Left radial","Right femoral","Left femoral","Right brachial","Left brachial","Right dorsalis pedis"] },
      { id:"allen_test",    label:"Allen Test (radial)",  type:"select",  required:false, options:["Normal — collateral flow confirmed","Abnormal — alternative site selected","Not performed — femoral access"] },
      { id:"us_guidance",   label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound","Palpation/landmark technique"] },
      { id:"catheter",      label:"Catheter",             type:"text",    required:true,  placeholder:"e.g., 20G radial arterial catheter" },
      { id:"attempts",      label:"Attempts",             type:"number",  required:true,  placeholder:"1" },
      { id:"waveform",      label:"Waveform Confirmation",type:"select",  required:true,  options:["Arterial waveform confirmed on monitor","Pulsatile bright red blood — waveform confirmed"] },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"picc-line", label:"PICC Line Insertion", category:"vascular", icon:"💉", color:T.purple,
    fields:[
      { id:"indication",   label:"Indication",            type:"textarea",required:true,  placeholder:"e.g., prolonged IV antibiotic therapy" },
      { id:"site",         label:"Access Site",           type:"select",  required:true,  options:["Right basilic","Left basilic","Right brachial","Left brachial","Right cephalic","Left cephalic"] },
      { id:"catheter",     label:"Catheter",              type:"text",    required:true,  placeholder:"e.g., 4 Fr dual-lumen PICC, 40 cm" },
      { id:"us_guidance",  label:"Ultrasound Guidance",   type:"select",  required:true,  options:["Real-time ultrasound guidance","Landmark technique"] },
      { id:"tip_position", label:"Tip Position",          type:"select",  required:true,  options:["CXR — tip at cavoatrial junction","Fluoroscopy confirmed","ECG tip confirmation","Pending confirmation"] },
      { id:"blood_return", label:"Blood Return",          type:"select",  required:true,  options:["Confirmed × all lumens","Confirmed × primary lumen"] },
      { id:"complications",label:"Complications",         type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"io-access", label:"Intraosseous Access", category:"vascular", icon:"🦴", color:T.amber,
    fields:[
      { id:"indication",   label:"Indication",            type:"textarea",required:true,  placeholder:"e.g., cardiac arrest, failed peripheral IV × 2 attempts" },
      { id:"io_site",      label:"IO Site",               type:"select",  required:true,  options:["Proximal tibia","Distal tibia","Proximal humerus","Sternal","Distal femur"] },
      { id:"device",       label:"Device Used",           type:"select",  required:true,  options:["EZ-IO — 15mm needle","EZ-IO — 25mm needle","EZ-IO — 45mm needle","FAST1 — sternal","Manual IO needle"] },
      { id:"attempts",     label:"Attempts",              type:"number",  required:true,  placeholder:"1" },
      { id:"confirmation", label:"Confirmation Method",   type:"text",    required:true,  placeholder:"e.g., IO seated, aspirated marrow, flushed 10 mL NS without extravasation" },
      { id:"initial_flush",label:"Initial Flush",         type:"text",    required:true,  placeholder:"e.g., 10 mL NS + lidocaine 40 mg IO for awake patient" },
      { id:"complications",label:"Complications",         type:"text",    required:false, placeholder:"None" },
    ]
  },
  // ── Airway ─────────────────────────────────────────────────────────────────
  { id:"rsi-intubation", label:"RSI / ETT Intubation", category:"airway", icon:"🫁", color:T.red,
    fields:[
      { id:"indication",      label:"Indication",           type:"textarea",required:true },
      { id:"gcs_pre",         label:"Pre-intubation GCS",   type:"number",  required:true,  placeholder:"e.g., 8" },
      { id:"spo2_pre",        label:"Pre-intubation SpO2",  type:"text",    required:true,  placeholder:"e.g., 88% on 15L NRB" },
      { id:"preoxygenation",  label:"Preoxygenation",       type:"text",    required:true,  placeholder:"e.g., 15L NRB × 3 min, BVM × 30 sec" },
      { id:"induction_agent", label:"Induction Agent",      type:"text",    required:true,  placeholder:"e.g., ketamine 1.5 mg/kg IV (150 mg)" },
      { id:"paralytic",       label:"Paralytic",            type:"text",    required:true,  placeholder:"e.g., succinylcholine 1.5 mg/kg (150 mg)" },
      { id:"blade",           label:"Blade",                type:"select",  required:true,  options:["Mac 3","Mac 4","Miller 2","Video (GlideScope)","Video (C-MAC)","Video (AWS)"] },
      { id:"ett_size",        label:"ETT Size",             type:"text",    required:true,  placeholder:"e.g., 7.5 cuffed" },
      { id:"depth",           label:"Depth at Lips",        type:"text",    required:true,  placeholder:"e.g., 22 cm" },
      { id:"attempts",        label:"Attempts",             type:"number",  required:true },
      { id:"confirmation",    label:"Confirmation",         type:"text",    required:true,  placeholder:"e.g., waveform capnography, bilateral breath sounds" },
      { id:"vent_settings",   label:"Initial Vent Settings",type:"text",    required:false, placeholder:"e.g., AC/VC, TV 420 mL, RR 14, PEEP 5, FiO2 0.6" },
      { id:"complications",   label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"cricothyrotomy", label:"Cricothyrotomy", category:"airway", icon:"⚡", color:T.red,
    fields:[
      { id:"indication",   label:"Indication",              type:"textarea",required:true,  placeholder:"e.g., cannot intubate cannot oxygenate (CICO) scenario" },
      { id:"technique",    label:"Technique",               type:"select",  required:true,  options:["Surgical cricothyrotomy — scalpel-finger-bougie","Needle cricothyrotomy — 14G angiocath","Commercial cricothyrotomy kit"] },
      { id:"landmark",     label:"Landmark Identified",     type:"select",  required:true,  options:["Cricothyroid membrane identified by palpation","Ultrasound-assisted identification","Neck landmarks obscured — surgical approach used"] },
      { id:"tube_placed",  label:"Tube Placed",             type:"text",    required:true,  placeholder:"e.g., 6.0 cuffed ETT via surgical cricothyrotomy" },
      { id:"confirmation", label:"Confirmation",            type:"text",    required:true,  placeholder:"e.g., EtCO2 detected, bilateral breath sounds" },
      { id:"complications",label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"supraglottic", label:"Supraglottic Airway (LMA/King)", category:"airway", icon:"😮", color:T.amber,
    fields:[
      { id:"indication",   label:"Indication",              type:"textarea",required:true,  placeholder:"e.g., bridging airway, failed intubation rescue" },
      { id:"device",       label:"Device",                  type:"select",  required:true,  options:["LMA Classic","LMA Fastrach (ILMA)","King LT airway","i-gel","Combitube"] },
      { id:"size",         label:"Size",                    type:"text",    required:true,  placeholder:"e.g., size 4 LMA" },
      { id:"placement",    label:"Placement Confirmation",  type:"text",    required:true,  placeholder:"e.g., chest rise, EtCO2, no audible air leak" },
      { id:"complications",label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
  // ── Thoracic ───────────────────────────────────────────────────────────────
  { id:"tube-thoracostomy", label:"Chest Tube (Tube Thoracostomy)", category:"thoracic", icon:"🫁", color:T.purple,
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., left-sided tension pneumothorax, hemothorax" },
      { id:"side",          label:"Side",                 type:"select",  required:true,  options:["Right","Left"] },
      { id:"site",          label:"Insertion Site",       type:"select",  required:true,  options:["4th or 5th ICS — anterior axillary line","2nd ICS — mid-clavicular line (emergency)","6th ICS — posterior axillary line"] },
      { id:"anesthesia",    label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine 15 mL subcutaneous + intercostal" },
      { id:"tube_size",     label:"Tube Size",            type:"text",    required:true,  placeholder:"e.g., 28 Fr chest tube" },
      { id:"output",        label:"Immediate Output",     type:"text",    required:true,  placeholder:"e.g., ~400 mL serosanguinous fluid, air rush" },
      { id:"drainage",      label:"Drainage System",      type:"select",  required:true,  options:["Water seal with suction — 20 cmH2O","Water seal — no suction","Heimlich valve"] },
      { id:"cxr",           label:"Post-procedure CXR",   type:"select",  required:true,  options:["Good position — lung re-expanded","Malpositioned — adjusted","Pending"] },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"needle-decompression", label:"Needle Thoracostomy", category:"thoracic", icon:"⚡", color:T.red,
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., suspected tension PTX — hypotension, absent breath sounds, tracheal deviation" },
      { id:"side",          label:"Side",                 type:"select",  required:true,  options:["Right","Left","Bilateral"] },
      { id:"site",          label:"Insertion Site",       type:"select",  required:true,  options:["2nd ICS mid-clavicular line","4th/5th ICS anterior axillary line"] },
      { id:"needle",        label:"Needle",               type:"text",    required:true,  placeholder:"e.g., 14G, 8 cm angiocath" },
      { id:"response",      label:"Clinical Response",    type:"text",    required:true,  placeholder:"e.g., rush of air, hemodynamic improvement, SpO2 improved to 96%" },
      { id:"follow_up",     label:"Follow-up",            type:"select",  required:true,  options:["Definitive chest tube placed","Finger thoracostomy performed","Patient expired despite intervention"] },
    ]
  },
  { id:"thoracentesis", label:"Thoracentesis", category:"thoracic", icon:"💧", color:"#4a90d9",
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., diagnostic — exudative vs transudative; or symptomatic relief" },
      { id:"side",          label:"Side",                 type:"select",  required:true,  options:["Right","Left"] },
      { id:"us_guidance",   label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound guidance","Ultrasound-marked landmark","Percussion — no US available"] },
      { id:"site",          label:"Insertion Site",       type:"text",    required:true,  placeholder:"e.g., posterior 8th ICS below tip of scapula" },
      { id:"anesthesia",    label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine 10 mL infiltrated to pleura" },
      { id:"volume",        label:"Volume Removed",       type:"text",    required:true,  placeholder:"e.g., 900 mL straw-colored fluid — therapeutic" },
      { id:"fluid_sent",    label:"Labs Sent",            type:"text",    required:false, placeholder:"e.g., LDH, protein, glucose, culture, cytology" },
      { id:"cxr",           label:"Post-procedure CXR",   type:"select",  required:true,  options:["No PTX — stable","PTX identified — managed","Pending"] },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  // ── Cardiac ────────────────────────────────────────────────────────────────
  { id:"pericardiocentesis", label:"Pericardiocentesis", category:"cardiac", icon:"❤️", color:T.red,
    fields:[
      { id:"indication",        label:"Indication",             type:"textarea",required:true,  placeholder:"e.g., cardiac tamponade — pulsus paradoxus, hypotension, JVD, muffled heart sounds" },
      { id:"approach",          label:"Approach",               type:"select",  required:true,  options:["Subxiphoid","Apical (parasternal)","US-guided"] },
      { id:"echo_guidance",     label:"Echocardiographic Guidance", type:"select",required:true,options:["Real-time echo guidance","Bedside POCUS-guided","Landmark — emergency"] },
      { id:"needle",            label:"Needle",                 type:"text",    required:true,  placeholder:"e.g., 18G, 3.5 inch spinal needle" },
      { id:"volume_removed",    label:"Volume Removed",         type:"text",    required:true,  placeholder:"e.g., 200 mL serosanguinous fluid" },
      { id:"hemodynamic",       label:"Hemodynamic Response",   type:"text",    required:true,  placeholder:"e.g., BP improved from 70/40 to 110/70, JVD resolved" },
      { id:"catheter_left",     label:"Pigtail Catheter Left",  type:"select",  required:true,  options:["Yes — for continued drainage","No — single aspiration only"] },
      { id:"complications",     label:"Complications",          type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"cardioversion", label:"Electrical Cardioversion", category:"cardiac", icon:"⚡", color:T.red,
    fields:[
      { id:"indication",    label:"Indication",                   type:"textarea",required:true,  placeholder:"e.g., SVT with hemodynamic instability, atrial flutter with RVR" },
      { id:"rhythm",        label:"Pre-cardioversion Rhythm",     type:"select",  required:true,  options:["SVT (AVNRT/AVRT)","Atrial flutter","Atrial fibrillation","Ventricular tachycardia (stable)","VF — unsynchronized"] },
      { id:"type",          label:"Cardioversion Type",           type:"select",  required:true,  options:["Synchronized cardioversion","Unsynchronized defibrillation — VF/pulseless VT"] },
      { id:"sedation",      label:"Sedation/Analgesia",           type:"text",    required:false, placeholder:"e.g., etomidate 0.3 mg/kg IV" },
      { id:"energy_j",      label:"Energy (Joules)",              type:"text",    required:true,  placeholder:"e.g., 50J → 100J → 200J" },
      { id:"attempts",      label:"Shocks Delivered",             type:"number",  required:true,  placeholder:"1" },
      { id:"post_rhythm",   label:"Post-cardioversion Rhythm",    type:"text",    required:true,  placeholder:"e.g., normal sinus rhythm at 72 bpm" },
      { id:"complications", label:"Complications",                type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"transcutaneous-pacing", label:"Transcutaneous Pacing", category:"cardiac", icon:"🔌", color:T.amber,
    fields:[
      { id:"indication",    label:"Indication",             type:"textarea",required:true,  placeholder:"e.g., symptomatic 3rd degree AV block — HR 32, BP 80/50" },
      { id:"rhythm_pre",    label:"Rhythm Pre-pacing",      type:"text",    required:true,  placeholder:"e.g., complete heart block, ventricular escape at 28 bpm" },
      { id:"pad_placement", label:"Pad Placement",          type:"select",  required:true,  options:["Anterior-posterior (preferred)","Anterior-lateral"] },
      { id:"sedation",      label:"Analgesia/Sedation",     type:"text",    required:false, placeholder:"e.g., morphine 2 mg + midazolam 1 mg IV" },
      { id:"rate_set",      label:"Rate Set (bpm)",         type:"number",  required:true,  placeholder:"80" },
      { id:"threshold_ma",  label:"Capture Threshold (mA)", type:"number",  required:true,  placeholder:"e.g., 70 (programmed to 80 mA)" },
      { id:"capture",       label:"Electrical Capture",     type:"select",  required:true,  options:["Confirmed — wide QRS after each spike","No capture — rate increased","Intermittent capture"] },
      { id:"mechanical",    label:"Mechanical Capture",     type:"select",  required:true,  options:["Confirmed — pulse with each spike, BP improved","Unable to confirm — pulsox wave reviewed"] },
      { id:"bridge",        label:"Bridge Plan",            type:"text",    required:true,  placeholder:"e.g., cardiology consulted for transvenous pacing" },
    ]
  },
  // ── Abdominal ──────────────────────────────────────────────────────────────
  { id:"paracentesis", label:"Paracentesis", category:"abdominal", icon:"🫀", color:T.green,
    fields:[
      { id:"indication",      label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., diagnostic — new ascites; or large-volume therapeutic drainage" },
      { id:"us_guidance",     label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound guidance","Ultrasound-marked site","Percussion — no US available"] },
      { id:"site",            label:"Insertion Site",       type:"select",  required:true,  options:["Left lower quadrant — lateral to rectus","Right lower quadrant — lateral to rectus","Midline infraumbilical"] },
      { id:"anesthesia",      label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine 10 mL infiltrated to peritoneum" },
      { id:"needle_catheter", label:"Needle/Catheter",      type:"text",    required:true,  placeholder:"e.g., 18G needle, Z-track technique; or 14G paracentesis kit" },
      { id:"volume_removed",  label:"Volume Removed",       type:"text",    required:true,  placeholder:"e.g., 5.5 L clear amber fluid" },
      { id:"fluid_appearance",label:"Fluid Appearance",     type:"select",  required:true,  options:["Clear amber","Straw-colored","Bloody — traumatic","Cloudy/turbid — SBP suspected","Milky — chylous"] },
      { id:"labs_sent",       label:"Labs Sent",            type:"text",    required:false, placeholder:"e.g., cell count, albumin, culture, total protein" },
      { id:"albumin_given",   label:"Albumin Replacement",  type:"text",    required:false, placeholder:"e.g., 6.25 g/L removed — 25% albumin given" },
      { id:"complications",   label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  // ── Neuro / Spine ──────────────────────────────────────────────────────────
  { id:"lumbar-puncture", label:"Lumbar Puncture", category:"neuro", icon:"🧠", color:T.rose,
    fields:[
      { id:"indication",       label:"Indication",              type:"textarea",required:true,  placeholder:"e.g., fever + headache + neck stiffness, r/o meningitis" },
      { id:"position",         label:"Patient Position",        type:"select",  required:true,  options:["Lateral decubitus — fetal position","Seated leaning forward"] },
      { id:"level",            label:"Intervertebral Level",    type:"select",  required:true,  options:["L3-L4","L4-L5","L2-L3"] },
      { id:"needle",           label:"Needle Used",             type:"text",    required:true,  placeholder:"e.g., 22G, 3.5 inch Quincke needle" },
      { id:"us_guidance",      label:"Imaging/Guidance",        type:"select",  required:false, options:["Surface landmarks only","Ultrasound-guided","Fluoroscopy-guided"] },
      { id:"attempts",         label:"Attempts",                type:"number",  required:true },
      { id:"opening_pressure", label:"Opening Pressure (cmH2O)",type:"number",  required:false },
      { id:"csf_appearance",   label:"CSF Appearance",          type:"select",  required:true,  options:["Clear and colorless","Xanthochromic","Bloody — clears with sequential tubes","Bloody — does not clear","Turbid/cloudy"] },
      { id:"tubes",            label:"Tubes Collected",         type:"text",    required:true,  placeholder:"e.g., 4 tubes: cell count, glucose/protein, culture & gram stain, cell count" },
      { id:"complications",    label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
  // ── Ortho / MSK ────────────────────────────────────────────────────────────
  { id:"joint-aspiration-injection", label:"Joint Aspiration / Injection", category:"ortho", icon:"💉", color:T.teal,
    fields:[
      { id:"joint",           label:"Joint",                  type:"select",  required:true,  options:["Knee (right)","Knee (left)","Shoulder (right)","Shoulder (left)","Elbow (right)","Elbow (left)","Ankle (right)","Ankle (left)","Wrist (right)","Wrist (left)","First MTP (gout)","Bursa — prepatellar","Bursa — olecranon"] },
      { id:"indication",      label:"Indication",             type:"select",  required:true,  options:["Diagnostic aspiration — r/o septic arthritis","Diagnostic aspiration — r/o crystal arthropathy","Therapeutic drainage","Corticosteroid injection","Viscosupplementation"] },
      { id:"us_guidance",     label:"Guidance",               type:"select",  required:true,  options:["Landmark technique","Real-time ultrasound guidance"] },
      { id:"approach",        label:"Approach",               type:"text",    required:true,  placeholder:"e.g., lateral parapatellar approach" },
      { id:"anesthesia",      label:"Anesthesia",             type:"text",    required:false, placeholder:"e.g., 1% lidocaine 2 mL local" },
      { id:"fluid_aspirated", label:"Fluid Aspirated",        type:"text",    required:false, placeholder:"e.g., 20 mL cloudy synovial fluid — cell count/culture/crystals sent" },
      { id:"injection_given", label:"Injection Given",        type:"text",    required:false, placeholder:"e.g., triamcinolone 40 mg + 0.5% bupivacaine 3 mL" },
      { id:"complications",   label:"Complications",          type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"shoulder-reduction", label:"Shoulder Dislocation Reduction", category:"ortho", icon:"💪", color:T.amber,
    fields:[
      { id:"direction",       label:"Dislocation Direction",     type:"select",  required:true,  options:["Anterior (most common)","Posterior","Inferior (luxatio erecta)"] },
      { id:"pre_imaging",     label:"Pre-reduction Imaging",     type:"select",  required:true,  options:["X-ray confirmed — AP, scapular Y, axillary views","Clinical diagnosis — emergent reduction without delay","CT obtained"] },
      { id:"neurovasc_pre",   label:"Neurovascular Status Pre",  type:"text",    required:true,  placeholder:"e.g., axillary nerve sensation intact, radial pulse 2+" },
      { id:"sedation",        label:"Analgesia/Sedation",        type:"text",    required:true,  placeholder:"e.g., ketamine 0.5 mg/kg + midazolam 2 mg IV; or intra-articular lidocaine 20 mL" },
      { id:"technique",       label:"Reduction Technique",       type:"select",  required:true,  options:["Cunningham technique","Stimson (gravity) technique","Mitch technique","FARES technique","Traction-countertraction","External rotation method","Milch technique"] },
      { id:"attempts",        label:"Attempts",                  type:"number",  required:true,  placeholder:"1" },
      { id:"post_imaging",    label:"Post-reduction Imaging",    type:"select",  required:true,  options:["Confirmed reduction — no fracture","Confirmed reduction — Hill-Sachs noted","Associated fracture — see imaging","Pending"] },
      { id:"neurovasc_post",  label:"Neurovascular Status Post", type:"text",    required:true,  placeholder:"e.g., intact" },
      { id:"immobilization",  label:"Immobilization",            type:"text",    required:true,  placeholder:"e.g., sling and swath × 3 weeks" },
    ]
  },
  { id:"hip-reduction", label:"Hip Dislocation Reduction", category:"ortho", icon:"🦴", color:T.amber,
    fields:[
      { id:"direction",       label:"Dislocation Direction",     type:"select",  required:true,  options:["Posterior (most common)","Anterior","Central — acetabular fracture"] },
      { id:"pre_imaging",     label:"Pre-reduction Imaging",     type:"text",    required:true,  placeholder:"e.g., AP pelvis X-ray, CT — no femoral neck fracture" },
      { id:"neurovasc_pre",   label:"Neurovascular Status Pre",  type:"text",    required:true,  placeholder:"e.g., sciatic nerve — sensation/motor intact" },
      { id:"sedation",        label:"Procedural Sedation",       type:"text",    required:true,  placeholder:"e.g., ketamine 1 mg/kg + midazolam 2 mg IV" },
      { id:"technique",       label:"Reduction Technique",       type:"select",  required:true,  options:["Allis technique","Stimson gravity technique","Bigelow technique","Captain Morgan technique"] },
      { id:"attempts",        label:"Attempts",                  type:"number",  required:true,  placeholder:"1" },
      { id:"post_imaging",    label:"Post-reduction Imaging",    type:"select",  required:true,  options:["Confirmed reduction — congruent joint space","Associated fracture identified — CT obtained","Pending CT"] },
      { id:"neurovasc_post",  label:"Neurovascular Status Post", type:"text",    required:true,  placeholder:"e.g., intact" },
    ]
  },
  { id:"fracture-splinting", label:"Fracture Splinting", category:"ortho", icon:"🦾", color:"#4a90d9",
    fields:[
      { id:"fracture_location",label:"Fracture Location",            type:"text",    required:true,  placeholder:"e.g., distal radius, right" },
      { id:"fracture_pattern", label:"Fracture Pattern",             type:"text",    required:true,  placeholder:"e.g., closed, non-displaced, extra-articular" },
      { id:"imaging",          label:"Imaging",                      type:"text",    required:true,  placeholder:"e.g., X-ray AP and lateral — Colles fracture, no joint involvement" },
      { id:"reduction",        label:"Reduction Performed",          type:"select",  required:true,  options:["Closed reduction — performed successfully","No reduction required — acceptable alignment","Reduction unsuccessful — orthopedic consulted"] },
      { id:"anesthesia",       label:"Anesthesia for Reduction",     type:"text",    required:false, placeholder:"e.g., hematoma block 5 mL 1% lidocaine" },
      { id:"splint_type",      label:"Splint Type",                  type:"text",    required:true,  placeholder:"e.g., volar short arm splint with thumb spica extension" },
      { id:"neurovasc_post",   label:"Neurovascular Status Post",    type:"text",    required:true,  placeholder:"e.g., intact — cap refill <2s, sensation preserved" },
      { id:"disposition",      label:"Disposition",                  type:"select",  required:true,  options:["Discharged — ortho follow-up 5-7 days","Admitted — operative planning","Ortho consulted in ED"] },
    ]
  },
  { id:"compartment-pressure", label:"Compartment Pressure Measurement", category:"ortho", icon:"📏", color:T.red,
    fields:[
      { id:"indication",  label:"Indication",                    type:"textarea",required:true,  placeholder:"e.g., suspected acute compartment syndrome — tense forearm after radial fracture" },
      { id:"extremity",   label:"Extremity/Compartment(s)",      type:"text",    required:true,  placeholder:"e.g., right forearm — volar and dorsal compartments" },
      { id:"device",      label:"Device Used",                   type:"select",  required:true,  options:["Stryker intra-compartment pressure monitor","Arterial line manometer setup","Needle manometer"] },
      { id:"pressures",   label:"Measured Pressures (mmHg)",     type:"textarea",required:true,  placeholder:"e.g., volar: 42 mmHg, dorsal: 38 mmHg" },
      { id:"delta_p",     label:"Delta P (DBP - compartment)",   type:"text",    required:true,  placeholder:"e.g., delta P = 28 mmHg (critical threshold <30 mmHg)" },
      { id:"action",      label:"Action Taken",                  type:"select",  required:true,  options:["Emergent fasciotomy — surgery consulted","Taken to OR","Serial monitoring — threshold not met yet","Conservative management"] },
    ]
  },
  // ── Urology ────────────────────────────────────────────────────────────────
  { id:"bladder-cath", label:"Bladder Catheterization", category:"uro", icon:"🚿", color:"#4a90d9",
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., urinary retention, accurate urine output monitoring" },
      { id:"catheter_type", label:"Catheter Type",        type:"select",  required:true,  options:["14 Fr Foley — standard","16 Fr Foley — standard","18 Fr Foley — standard","Coudé tip catheter","3-way Foley","Straight catheter — in/out"] },
      { id:"approach",      label:"Approach",             type:"select",  required:true,  options:["Transurethral — sterile technique","Suprapubic — see note"] },
      { id:"urine_return",  label:"Urine Return",         type:"text",    required:true,  placeholder:"e.g., ~400 mL clear yellow urine immediately drained" },
      { id:"balloon",       label:"Balloon",              type:"text",    required:false, placeholder:"e.g., 10 mL sterile water balloon inflated, catheter secured" },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  // ── GI ─────────────────────────────────────────────────────────────────────
  { id:"ng-tube", label:"Nasogastric Tube Placement", category:"gi", icon:"🔩", color:"#4a90d9",
    fields:[
      { id:"indication",    label:"Indication",              type:"select",  required:true,  options:["GI decompression — obstruction/ileus","Gastric lavage — overdose/ingestion","Enteral nutrition/medication administration","Diagnostic — bloody aspirate","Variceal bleeding"] },
      { id:"nare",          label:"Nare",                    type:"select",  required:true,  options:["Right nare","Left nare"] },
      { id:"tube_type",     label:"Tube Type",               type:"text",    required:true,  placeholder:"e.g., 18 Fr Salem sump; or 16 Fr Levin tube" },
      { id:"tube_depth",    label:"Insertion Depth (cm)",    type:"number",  required:true,  placeholder:"e.g., 55 cm at nare" },
      { id:"confirmation",  label:"Confirmation",            type:"select",  required:true,  options:["Auscultation + aspiration of gastric contents","X-ray confirmed — tip in stomach","Aspirate pH <4 + auscultation"] },
      { id:"output",        label:"Initial Aspirate",        type:"text",    required:false, placeholder:"e.g., ~300 mL bilious fluid returned" },
      { id:"complications", label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
  // ── OB / GYN ───────────────────────────────────────────────────────────────
  { id:"iud-insertion", label:"IUD Insertion", category:"gyn", icon:"🔩", color:T.rose,
    fields:[
      { id:"indication",    label:"Indication",              type:"text",    required:true,  placeholder:"e.g., long-acting reversible contraception" },
      { id:"iud_type",      label:"IUD Type",                type:"select",  required:true,  options:["Mirena (levonorgestrel 52mg)","Kyleena (levonorgestrel 19.5mg)","Liletta (levonorgestrel 52mg)","Paragard (copper T380A)","Skyla (levonorgestrel 13.5mg)"] },
      { id:"uterine_sound", label:"Uterine Sounding Depth",  type:"text",    required:true,  placeholder:"e.g., 8 cm" },
      { id:"technique",     label:"Technique",               type:"text",    required:true,  placeholder:"e.g., tenaculum applied, os visualized, sound passed without resistance, IUD deployed" },
      { id:"string_check",  label:"String Visibility",       type:"select",  required:true,  options:["Strings visible at os — trimmed to 3 cm","Strings visible — not trimmed","Strings not visible — US obtained"] },
      { id:"complications", label:"Complications",           type:"text",    required:false, placeholder:"None — patient tolerated well" },
    ]
  },
  { id:"perimortem-csection", label:"Perimortem C-Section", category:"gyn", icon:"🚨", color:T.red,
    fields:[
      { id:"indication",       label:"Indication",              type:"textarea",required:true,  placeholder:"e.g., maternal cardiac arrest — gravid uterus ≥20 weeks, ACLS × 4 min without ROSC" },
      { id:"gestational_age",  label:"Gestational Age",         type:"text",    required:true,  placeholder:"e.g., ~32 weeks by fundal height" },
      { id:"time_to_delivery", label:"Decision-to-Delivery Time",type:"text",   required:true,  placeholder:"e.g., 3 minutes" },
      { id:"technique",        label:"Technique",               type:"textarea",required:true,  placeholder:"e.g., vertical midline incision, classical uterine incision, infant and placenta delivered" },
      { id:"infant_outcome",   label:"Neonatal Outcome",        type:"text",    required:true,  placeholder:"e.g., spontaneous cry, HR >100, transferred to NICU" },
      { id:"maternal_outcome", label:"Maternal Outcome",        type:"text",    required:true,  placeholder:"e.g., ROSC achieved 2 min post-delivery — transferred to OR" },
    ]
  },
  // ── ENT / Ophthalmology ────────────────────────────────────────────────────
  { id:"nasal-packing", label:"Anterior Nasal Packing", category:"ent", icon:"👃", color:T.amber,
    fields:[
      { id:"indication",    label:"Indication",              type:"select",  required:true,  options:["Epistaxis — anterior, failed direct pressure","Epistaxis — anterior, site identified"] },
      { id:"nare",          label:"Nare",                    type:"select",  required:true,  options:["Right","Left","Bilateral"] },
      { id:"site",          label:"Bleeding Site",           type:"select",  required:false, options:["Kiesselbach plexus — anterior septum","Not clearly identified — diffuse","Posterior source suspected — ENT consulted"] },
      { id:"technique",     label:"Technique",               type:"select",  required:true,  options:["Rapid Rhino balloon (anterior)","Merocel sponge packing","Vaseline gauze packing","Silver nitrate cauterization","Surgicel/oxidized cellulose","Tranexamic acid packing"] },
      { id:"hemostasis",    label:"Hemostasis Achieved",     type:"select",  required:true,  options:["Complete hemostasis achieved","Near-complete — packing left in place","Persistent bleeding — ENT consulted"] },
      { id:"antibiotics",   label:"Prophylactic Antibiotics",type:"text",    required:false, placeholder:"e.g., amoxicillin-clavulanate 875 mg BID × 5 days while packing in" },
    ]
  },
  { id:"eye-fb-removal", label:"Ocular Foreign Body Removal", category:"ent", icon:"👁️", color:T.teal,
    fields:[
      { id:"mechanism",     label:"Mechanism",               type:"text",    required:true,  placeholder:"e.g., grinding metal without eye protection" },
      { id:"va_pre",        label:"Visual Acuity Pre",       type:"text",    required:true,  placeholder:"e.g., 20/40 affected eye, 20/20 unaffected" },
      { id:"slit_lamp",     label:"Slit Lamp Exam",          type:"textarea",required:true,  placeholder:"e.g., metallic FB on cornea at 9 o'clock, rust ring present, no perforation, anterior chamber clear" },
      { id:"anesthesia",    label:"Topical Anesthesia",      type:"text",    required:true,  placeholder:"e.g., proparacaine 0.5% ophthalmic × 2 drops" },
      { id:"technique",     label:"Removal Technique",       type:"select",  required:true,  options:["Slit-lamp irrigation","27G needle under slit-lamp","Ophthalmic burr — rust ring removed","Cotton swab — superficial FB"] },
      { id:"post_exam",     label:"Post-removal Exam",       type:"text",    required:true,  placeholder:"e.g., corneal abrasion present, no retained FB, no leak on fluorescein" },
      { id:"discharge_meds",label:"Discharge Medications",   type:"text",    required:true,  placeholder:"e.g., erythromycin ointment, cyclopentolate drops, ophthalmology follow-up 24h" },
    ]
  },
  { id:"dental-block", label:"Dental / Nerve Block", category:"ent", icon:"🦷", color:T.dim,
    fields:[
      { id:"indication",    label:"Indication",              type:"text",    required:true,  placeholder:"e.g., dental abscess analgesia, facial laceration anesthesia" },
      { id:"block_type",    label:"Nerve Block Type",        type:"select",  required:true,  options:["Inferior alveolar nerve block (mandibular)","Infraorbital nerve block","Mental nerve block","Supraorbital/supratrochlear block","Greater auricular block"] },
      { id:"agent",         label:"Local Anesthetic",        type:"text",    required:true,  placeholder:"e.g., 2% lidocaine with 1:100,000 epinephrine, 3 mL" },
      { id:"technique",     label:"Technique",               type:"text",    required:true,  placeholder:"e.g., intraoral approach — needle directed to lingula, aspirated prior to injection" },
      { id:"onset",         label:"Block Onset",             type:"select",  required:true,  options:["Adequate anesthesia within 5 min","Partial block — repeated injection","Failed block — alternative approach used"] },
    ]
  },
];

function ProcedureNoteDrafter({ prefilledCPT, onClearPrefill }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fields, setFields] = useState({});
  const [generatedNote, setGeneratedNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [customProcedureName, setCustomProcedureName] = useState("");
  const [customCptCode, setCustomCptCode] = useState("");
  const [openCategories, setOpenCategories] = useState({});

  const templatesByCategory = useMemo(() => {
    const grouped = {};
    PROC_CATEGORIES.forEach(cat => {
      if (cat.id !== "all") {
        grouped[cat.id] = PROC_TEMPLATES.filter(t => t.category === cat.id);
      }
    });
    return grouped;
  }, []);

  useEffect(() => {
    if (prefilledCPT) {
      setCustomProcedureName(prefilledCPT.procedureName);
      setCustomCptCode(prefilledCPT.cptCode);
      setSelectedTemplate(null);
      setFields({});
      setGeneratedNote("");
    }
  }, [prefilledCPT]);

  const selectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setCustomProcedureName("");
    setCustomCptCode("");
    setFields({});
    setGeneratedNote("");
    if (onClearPrefill) onClearPrefill();
  };

  const generateNote = async () => {
    const procedureLabel = selectedTemplate ? selectedTemplate.label : customProcedureName;
    if (!procedureLabel) return;
    setGenerating(true);
    try {
      const fieldSummary = selectedTemplate
        ? selectedTemplate.fields.map(f => `${f.label}: ${fields[f.id] || "(not provided)"}`).join("\n")
        : `Procedure Name: ${customProcedureName}\nCPT Code: ${customCptCode}`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI. Draft a complete, medicolegally sound ${procedureLabel} procedure note for an emergency medicine provider.\n\nPROCEDURE: ${procedureLabel}${customCptCode ? `\nCPT CODE: ${customCptCode}` : ""}\nDATE/TIME: ${new Date().toLocaleString()}\n\nCOMPLETED FIELDS:\n${fieldSummary}\n\nGenerate a complete, structured procedure note including: indication, preprocedure assessment/consent, procedure description, postprocedure status, and provider attestation. Format it professionally with clear section headers.`,
      });
      setGeneratedNote(result);
    } catch(e) { console.error(e); } finally { setGenerating(false); }
  };

  return (
    <div id="procedure-note-drafter" style={{ borderBottom:`1px solid rgba(30,58,95,0.55)`, paddingBottom:40, marginBottom:40 }}>
      <SectionHeader icon="📋" title="Procedure Note Drafter"
        subtitle="Select an ED procedure template. Fill the fields and Notrya AI drafts the complete, billable procedure note."
        badge={{ text:`${PROC_TEMPLATES.length} ED procedure templates`, background:"rgba(245,166,35,0.07)", border:"1px solid rgba(245,166,35,0.22)", color:T.amber }}
      />
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, alignItems:"start" }}>
        <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden", maxHeight:"600px", overflowY:"auto" }}>
          <div style={{ padding:"12px 0", fontSize:12, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.06em", paddingLeft:"16px", paddingRight:"16px", paddingTop:"16px" }}>Categories</div>
          {PROC_CATEGORIES.filter(cat => cat.id !== "all").map(cat => (
            <div key={cat.id}>
              <button
                onClick={()=>setOpenCategories({...openCategories, [cat.id]:!openCategories[cat.id]})}
                style={{
                  width:"100%", padding:"12px 16px", background:openCategories[cat.id]?"rgba(22,45,79,0.8)":"transparent", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10, transition:"all 0.2s", borderBottom:`1px solid ${T.border}`
                }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(22,45,79,0.5)"}
                onMouseLeave={e=>!openCategories[cat.id]&&(e.currentTarget.style.background="transparent")}
              >
                <span style={{fontSize:14, flexShrink:0}}>{cat.label.split(" ")[0]}</span>
                <div style={{flex:1, textAlign:"left", fontSize:12, fontWeight:600, color:T.bright, minWidth:0}}>{cat.label.split(" ").slice(1).join(" ")}</div>
                <span style={{fontSize:11, color:T.dim, flexShrink:0, fontWeight:600}}>{templatesByCategory[cat.id]?.length || 0}</span>
              </button>
              {openCategories[cat.id] && (
                <div style={{background:"rgba(14,35,64,0.4)", borderBottom:`1px solid ${T.border}`}}>
                  {templatesByCategory[cat.id]?.map(tmpl => (
                    <button key={tmpl.id} onClick={() => selectTemplate(tmpl)}
                      style={{ width:"100%", padding:"9px 24px", textAlign:"left", background:selectedTemplate?.id===tmpl.id?"rgba(155,109,255,0.15)":"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s", fontSize:12, fontWeight:selectedTemplate?.id===tmpl.id?700:500, color:selectedTemplate?.id===tmpl.id?T.bright:T.text }}>
                      <span style={{fontSize:13}}>{tmpl.icon}</span>
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
          {!selectedTemplate && !customProcedureName ? (
            <div style={{ padding:"52px 24px", textAlign:"center", color:T.dim, fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div>Select a procedure template, or click a procedure name in the CPT Search below to begin</div>
            </div>
          ) : !selectedTemplate && customProcedureName ? (
            <>
              <div style={{ padding:"12px 18px", background:"rgba(22,45,79,0.9)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.bright, marginRight:"auto" }}>📋 {customProcedureName} <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11, color:T.teal, marginLeft:6 }}>{customCptCode}</span></span>
                <button onClick={()=>{setCustomProcedureName("");setCustomCptCode("");if(onClearPrefill)onClearPrefill();}} style={{ padding:"4px 10px", borderRadius:6, background:"transparent", color:T.dim, border:`1px solid ${T.border}`, fontSize:11, cursor:"pointer" }}>✕ Clear</button>
                {generatedNote && <button onClick={()=>navigator.clipboard.writeText(generatedNote)} style={{ padding:"5px 10px", borderRadius:6, background:"rgba(0,212,188,0.1)", color:T.teal, border:`1px solid rgba(0,212,188,0.25)`, fontSize:11.5, cursor:"pointer" }}>📋 Copy Note</button>}
              </div>
              <div style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ padding:"12px 16px", background:"rgba(0,212,188,0.06)", border:"1px solid rgba(0,212,188,0.2)", borderRadius:9, fontSize:12.5, color:T.text, lineHeight:1.6 }}>
                  <strong style={{ color:T.teal }}>Selected from CPT Search:</strong> {customProcedureName} — CPT {customCptCode}<br/>
                  <span style={{ color:T.dim, fontSize:11.5 }}>Click "Generate Note" to have Notrya AI draft a complete procedure note, or select a structured template from the left.</span>
                </div>
                <button onClick={generateNote} disabled={generating}
                  style={{ background:generating?"rgba(245,166,35,0.2)":"linear-gradient(135deg,#f5a623,#e09010)", color:generating?T.amber:"#fff", fontWeight:700, fontSize:14, padding:"12px 24px", borderRadius:9, border:"none", cursor:generating?"not-allowed":"pointer" }}>
                  {generating ? "✨ Generating procedure note…" : "✨ Generate Note"}
                </button>
              </div>
              {generatedNote && (
                <div style={{ background:"#0a1929", padding:20, fontFamily:"DM Sans,sans-serif", fontSize:13.5, lineHeight:1.9, color:T.text, whiteSpace:"pre-wrap", borderTop:`1px solid ${T.border}` }}>
                  {generatedNote}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ padding:"12px 18px", background:"rgba(22,45,79,0.9)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.bright, marginRight:"auto" }}>{selectedTemplate.icon} {selectedTemplate.label}</span>
                {generatedNote && <button onClick={() => navigator.clipboard.writeText(generatedNote)} style={{ padding:"5px 10px", borderRadius:6, background:"rgba(0,212,188,0.1)", color:T.teal, border:`1px solid rgba(0,212,188,0.25)`, fontSize:11.5, cursor:"pointer" }}>📋 Copy Note</button>}
              </div>
              <div style={{ padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {selectedTemplate.fields.map(field => (
                  <div key={field.id} style={{ gridColumn:field.type==="textarea"?"1/-1":"auto" }}>
                    <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>{field.label}{field.required && <span style={{color:T.amber}}> *</span>}</label>
                    {field.type==="select" ? (
                      <select value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                        style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:fields[field.id]?T.bright:T.dim, fontSize:13 }}>
                        <option value="">Select…</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type==="textarea" ? (
                      <textarea value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})} placeholder={field.placeholder} rows={3}
                        style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, resize:"vertical", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
                    ) : (
                      <input type={field.type==="number"?"number":"text"} value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})} placeholder={field.placeholder}
                        style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding:"0 20px 20px" }}>
                <button onClick={generateNote} disabled={generating}
                  style={{ width:"100%", background:generating?"rgba(245,166,35,0.2)":"linear-gradient(135deg,#f5a623,#e09010)", color:generating?T.amber:"#fff", fontWeight:700, fontSize:14, padding:"12px 24px", borderRadius:9, border:"none", cursor:generating?"not-allowed":"pointer" }}>
                  {generating ? "✨ Generating procedure note…" : "✨ Generate Note"}
                </button>
              </div>
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

const ED_NOTES = [
  { id:"critical-care-note", label:"Critical Care", icon:"🚨", color:T.red, description:"99291/99292 — documents time-based critical care with organ systems review",
    fields:[
      { id:"critical_care_time", label:"Total Critical Care Time (min)", type:"number", required:true },
      { id:"presenting_problem", label:"Critical Presenting Problem", type:"textarea", required:true },
      { id:"interventions", label:"Critical Care Interventions", type:"textarea", required:true, placeholder:"e.g., intubation, central line, vasopressor initiation" },
      { id:"disposition", label:"Disposition", type:"select", required:true, options:["ICU admission","ICU transfer","Step-down care","ROSC — admitted to ICU","Deceased"] },
    ]
  },
  { id:"ama-note", label:"Against Medical Advice", icon:"⚠️", color:T.amber, description:"Documents capacity assessment, risks discussed, and patient decision to leave AMA",
    fields:[
      { id:"presenting_complaint", label:"Presenting Complaint", type:"text", required:true },
      { id:"recommended_treatment", label:"Recommended Treatment / Admission", type:"textarea", required:true },
      { id:"capacity_assessment", label:"Capacity Assessment", type:"select", required:true, options:["Patient demonstrates capacity — alert, oriented ×4, understands diagnosis and risks","Capacity borderline — psych consult obtained","Capacity absent — surrogate contacted"] },
      { id:"risks_discussed", label:"Specific Risks Communicated", type:"textarea", required:true },
      { id:"patient_statement", label:"Patient's Stated Reason", type:"text", required:true },
      { id:"ama_form_signed", label:"AMA Form", type:"select", required:true, options:["Signed by patient","Patient refused to sign — documented","Representative signed"] },
    ]
  },
  { id:"code-note", label:"Code / Resuscitation", icon:"❤️", color:T.red, description:"Cardiac arrest documentation with timeline, rhythm progression, and ROSC/termination",
    fields:[
      { id:"arrest_time", label:"Time of Arrest", type:"text", required:true },
      { id:"initial_rhythm", label:"Initial Rhythm", type:"select", required:true, options:["VF","pVT","PEA","Asystole"] },
      { id:"epi_doses", label:"Epinephrine Doses", type:"number", required:true },
      { id:"medications", label:"Medications Given", type:"textarea", required:true, placeholder:"e.g., Epi 1mg × 4, Amiodarone 300mg + 150mg" },
      { id:"airway_management", label:"Airway Management", type:"text", required:true },
      { id:"total_downtime", label:"Total Downtime (min)", type:"number", required:true },
      { id:"outcome", label:"Outcome", type:"select", required:true, options:["ROSC achieved — admitted to ICU","ROSC — cath lab activated","Resuscitation unsuccessful — death pronounced"] },
    ]
  },
  { id:"trauma-note", label:"Trauma Activation", icon:"🏥", color:T.red, description:"Primary and secondary survey, mechanism, resuscitation actions" },
  { id:"psychiatric-hold", label:"Psychiatric Hold / 5150", icon:"🧠", color:T.rose, description:"Involuntary hold documentation with danger criteria" },
  { id:"restraint-note", label:"Physical/Chemical Restraint", icon:"🔐", color:T.purple, description:"Restraint application note with indication and monitoring plan" },
  { id:"pronouncement-note", label:"Death Pronouncement", icon:"🕯️", color:T.dim, description:"Death pronouncement note with time, circumstances, and notification" },
  { id:"transfer-note", label:"Transfer / EMTALA", icon:"🚑", color:"#4a90d9", description:"EMTALA-compliant transfer note" },
  { id:"discharge-instructions", label:"Discharge Instructions", icon:"🏠", color:T.green, description:"Comprehensive discharge instructions with return precautions" },
];

function EDNoteDrafter() {
  const [selected, setSelected] = useState(null);
  const [fields, setFields] = useState({});
  const [generatedNote, setGeneratedNote] = useState("");
  const [generating, setGenerating] = useState(false);

  const selectNote = (n) => { setSelected(n); setFields({}); setGeneratedNote(""); };

  const generateNote = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const fieldSummary = (selected.fields || []).map(f => `${f.label}: ${fields[f.id] || "(not provided)"}`).join("\n");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI. Draft a complete, medicolegally sound ${selected.label} note for an emergency medicine provider.\n\n${fieldSummary ? `COMPLETED FIELDS:\n${fieldSummary}\n` : ""}\nGenerate a professional, complete note suitable for the medical record.`,
      });
      setGeneratedNote(result);
    } catch(e) { console.error(e); } finally { setGenerating(false); }
  };

  return (
    <div id="ed-note-drafter" style={{ borderBottom:`1px solid rgba(30,58,95,0.55)`, paddingBottom:40, marginBottom:40, background:"rgba(11,29,53,0.35)", margin:"0 -20px 40px", padding:"40px 20px" }}>
      <SectionHeader icon="📝" title="Common ED Notes"
        subtitle="Structured, medicolegally sound note templates for common ED documentation requirements."
        badge={{ text:`${ED_NOTES.length} ED note templates`, background:"rgba(244,114,182,0.07)", border:"1px solid rgba(244,114,182,0.22)", color:T.rose }}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:10, marginBottom:20 }}>
        {ED_NOTES.map(n => (
          <div key={n.id} onClick={() => selectNote(n)}
            style={{ background:selected?.id===n.id?"rgba(14,35,64,0.8)":T.panel, border:`1px solid ${selected?.id===n.id?n.color:T.border}`, borderRadius:11, padding:16, cursor:"pointer", transition:"all 0.18s" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{n.icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:T.bright, marginBottom:4 }}>{n.label}</div>
            <div style={{ fontSize:11, color:T.dim, lineHeight:1.5 }}>{n.description}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
          <div style={{ padding:"12px 18px", background:"rgba(22,45,79,0.9)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T.bright, marginRight:"auto" }}>{selected.icon} {selected.label}</span>
            {generatedNote && <button onClick={() => navigator.clipboard.writeText(generatedNote)} style={{ padding:"5px 10px", borderRadius:6, background:"rgba(244,114,182,0.1)", color:T.rose, border:`1px solid rgba(244,114,182,0.25)`, fontSize:11.5, cursor:"pointer" }}>📋 Copy</button>}
          </div>
          {selected.fields?.length > 0 && (
            <div style={{ padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {selected.fields.map(field => (
                <div key={field.id} style={{ gridColumn:field.type==="textarea"?"1/-1":"auto" }}>
                  <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>{field.label}{field.required && <span style={{color:T.rose}}> *</span>}</label>
                  {field.helpText && <div style={{ fontSize:10.5, color:T.muted, marginBottom:5 }}>{field.helpText}</div>}
                  {field.type==="select" ? (
                    <select value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})}
                      style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:fields[field.id]?T.bright:T.dim, fontSize:13 }}>
                      <option value="">Select…</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type==="textarea" ? (
                    <textarea value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})} placeholder={field.placeholder} rows={3}
                      style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, resize:"vertical", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
                  ) : (
                    <input type={field.type==="number"?"number":"text"} value={fields[field.id]||""} onChange={e=>setFields({...fields,[field.id]:e.target.value})} placeholder={field.placeholder}
                      style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
                  )}
                </div>
              ))}
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

function ProcedureLog() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    procedure_name:"", cpt_code:"", date_performed:new Date().toISOString().split("T")[0],
    location:"", supervision:"Attending (primary operator)", attempts:1, success:true,
    ultrasound_used:false, complications:"None", indication:"", attending_name:"", notes:""
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.procedure_name.trim()) return;
    createMutation.mutate(form);
  };

  const exportCSV = () => {
    const cols = ["procedure_name","cpt_code","date_performed","location","supervision","attempts","success","ultrasound_used","complications","attending_name","indication"];
    const header = cols.join(",");
    const rows = logs.map(r => cols.map(c => JSON.stringify(r[c]??"")||"").join(","));
    const blob = new Blob([[header,...rows].join("\n")],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="procedure_log.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = logs.map(({ id, created_date, updated_date, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="procedure_log.json"; a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const win = window.open("", "_blank");
    const date = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const rows = logs.map((row, i) => `
      <tr style="background:${i%2===0?"#f9fafb":"#ffffff"}">
        <td>${row.date_performed?.split("T")[0] || "—"}</td>
        <td><strong>${row.procedure_name || "—"}</strong></td>
        <td style="font-family:monospace">${row.cpt_code || "—"}</td>
        <td>${row.location || "—"}</td>
        <td>${row.supervision?.split(" ")[0] || "—"}</td>
        <td style="text-align:center">${row.attempts || 1}</td>
        <td style="text-align:center;color:${row.success!==false?"#16a34a":"#dc2626"}">${row.success!==false?"✓":"✗"}</td>
        <td style="text-align:center">${row.ultrasound_used?"Yes":"No"}</td>
        <td>${row.complications || "—"}</td>
        <td>${row.attending_name || "—"}</td>
      </tr>
      ${row.indication ? `<tr style="background:#f0fdf4"><td colspan="10" style="padding:4px 12px;font-size:11px;color:#166534"><em>Indication: ${row.indication}</em></td></tr>` : ""}
      ${row.notes ? `<tr style="background:#fefce8"><td colspan="10" style="padding:4px 12px;font-size:11px;color:#713f12"><em>Notes: ${row.notes}</em></td></tr>` : ""}
    `).join("");

    win.document.write(`<!DOCTYPE html><html><head><title>Procedure Log</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 40px; font-size: 13px; }
      h1 { font-size: 24px; color: #0f172a; margin-bottom: 4px; }
      .meta { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
      .summary { display: flex; gap: 24px; margin-bottom: 24px; }
      .stat { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 20px; }
      .stat-value { font-size: 22px; font-weight: 700; color: #0369a1; }
      .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #0f172a; color: #e2e8f0; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
      .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
      @media print { body { margin: 20px; } }
    </style></head><body>
    <h1>Procedure Log</h1>
    <div class="meta">Generated ${date} · ${logs.length} procedure${logs.length!==1?"s":""} total</div>
    <div class="summary">
      <div class="stat"><div class="stat-value">${logs.length}</div><div class="stat-label">Total Procedures</div></div>
      <div class="stat"><div class="stat-value">${logs.filter(r=>r.success!==false).length}</div><div class="stat-label">Successful</div></div>
      <div class="stat"><div class="stat-value">${logs.filter(r=>r.supervision==="Attending (primary operator)").length}</div><div class="stat-label">As Primary Operator</div></div>
      <div class="stat"><div class="stat-value">${[...new Set(logs.map(r=>r.procedure_name).filter(Boolean))].length}</div><div class="stat-label">Unique Procedures</div></div>
    </div>
    <table>
      <thead><tr>
        <th>Date</th><th>Procedure</th><th>CPT</th><th>Site</th><th>Role</th>
        <th>Att.</th><th>Success</th><th>US</th><th>Complications</th><th>Attending</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Notrya AI · Procedure Log Export · Confidential Clinical Document</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const supervisionColors = {
    "Attending (primary operator)": {bg:"rgba(0,212,188,0.1)",fg:T.teal},
    "Supervising (resident/APP primary)": {bg:"rgba(155,109,255,0.1)",fg:T.purple},
    "Observed": {bg:"rgba(74,114,153,0.12)",fg:T.dim},
    "Assisted": {bg:"rgba(245,166,35,0.1)",fg:T.amber},
  };

  return (
    <div id="procedure-log" style={{ paddingBottom:40 }}>
      <SectionHeader icon="📊" title="Procedure Log"
        subtitle="Maintain a personal procedure log for credentialing, reappointment, and competency tracking."
        badge={{ text:"Credentialing ready", background:"rgba(46,204,113,0.07)", border:"1px solid rgba(46,204,113,0.22)", color:T.green }}
      />
      <form onSubmit={handleSubmit} style={{ background:T.panel, border:`1px solid rgba(46,204,113,0.2)`, borderRadius:14, padding:"22px 24px", marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.bright, marginBottom:16 }}>➕ Log New Procedure</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14 }}>
          {[
            { key:"date_performed", label:"Date", type:"date", required:true, colSpan:1 },
            { key:"procedure_name", label:"Procedure Name", type:"text", required:true, placeholder:"e.g., Laceration Repair", colSpan:2 },
            { key:"cpt_code", label:"CPT Code", type:"text", required:false, placeholder:"e.g., 12002", colSpan:1 },
            { key:"location", label:"Site / Location", type:"text", required:false, placeholder:"e.g., right IJ", colSpan:2 },
          ].map(f => (
            <div key={f.key} style={{ gridColumn:`span ${f.colSpan||1}` }}>
              <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>{f.label}{f.required && <span style={{color:T.green}}> *</span>}</label>
              <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} required={f.required} placeholder={f.placeholder}
                style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
            </div>
          ))}
          <div style={{ gridColumn:"span 2" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Role <span style={{color:T.green}}>*</span></label>
            <select value={form.supervision} onChange={e=>setForm({...form,supervision:e.target.value})}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13 }}>
              {["Attending (primary operator)","Supervising (resident/APP primary)","Assisted","Observed"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Attempts</label>
            <input type="number" min={1} max={20} value={form.attempts} onChange={e=>setForm({...form,attempts:+e.target.value})}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
          </div>
          <div style={{ gridColumn:"span 3", display:"flex", gap:24, alignItems:"center" }}>
            {[{key:"success",label:"Successful"},{key:"ultrasound_used",label:"US Guidance"}].map(t=>(
              <label key={t.key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <div onClick={()=>setForm({...form,[t.key]:!form[t.key]})}
                  style={{ width:40, height:22, borderRadius:11, background:form[t.key]?"rgba(46,204,113,0.4)":"rgba(30,58,95,0.8)", border:`1px solid ${form[t.key]?T.green:T.border}`, position:"relative", transition:"all 0.2s", cursor:"pointer" }}>
                  <div style={{ position:"absolute", top:2, left:form[t.key]?20:2, width:16, height:16, borderRadius:"50%", background:form[t.key]?T.green:T.dim, transition:"left 0.2s" }} />
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{t.label}</span>
              </label>
            ))}
          </div>
          <div style={{ gridColumn:"span 3" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Complications</label>
            <input value={form.complications} onChange={e=>setForm({...form,complications:e.target.value})} placeholder="None"
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, boxSizing:"border-box" }} />
          </div>
          <div style={{ gridColumn:"span 3" }}>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:T.dim, marginBottom:5 }}>Indication</label>
            <textarea value={form.indication} onChange={e=>setForm({...form,indication:e.target.value})} rows={2}
              style={{ width:"100%", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7, padding:"9px 12px", color:T.bright, fontSize:13, resize:"vertical", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
          </div>
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
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden" }}>
        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.bright, marginRight:"auto" }}>Procedure History ({logs.length})</span>
          <button onClick={exportCSV} style={{ padding:"5px 12px", borderRadius:6, background:"rgba(46,204,113,0.09)", color:T.green, border:`1px solid rgba(46,204,113,0.25)`, fontSize:11.5, cursor:"pointer", fontWeight:600 }}>⬇ CSV</button>
          <button onClick={exportJSON} style={{ padding:"5px 12px", borderRadius:6, background:"rgba(155,109,255,0.09)", color:T.purple, border:`1px solid rgba(155,109,255,0.25)`, fontSize:11.5, cursor:"pointer", fontWeight:600 }}>⬇ JSON</button>
          <button onClick={exportPDF} style={{ padding:"5px 12px", borderRadius:6, background:"rgba(245,166,35,0.09)", color:T.amber, border:`1px solid rgba(245,166,35,0.25)`, fontSize:11.5, cursor:"pointer", fontWeight:600 }}>⬇ PDF</button>
        </div>
        {isLoading ? (
          <div style={{ padding:"24px 16px", textAlign:"center", color:T.dim, fontSize:13 }}>Loading procedure log…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding:"40px 16px", textAlign:"center", color:T.dim, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
            <div style={{ fontWeight:600, color:T.text, marginBottom:6 }}>No procedures logged yet</div>
            <div>Use the form above to log your first procedure.</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {["Date","Procedure","CPT","Site","Role","Att.","✓","US","Complications",""].map((h,i)=>(
                    <th key={i} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(row => {
                  const sc = supervisionColors[row.supervision] || {bg:"rgba(74,114,153,0.12)",fg:T.dim};
                  return (
                    <tr key={row.id} style={{ borderBottom:`1px solid rgba(30,58,95,0.4)` }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(22,45,79,0.4)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 12px", color:T.dim, whiteSpace:"nowrap" }}>{row.date_performed?.split("T")[0]||"—"}</td>
                      <td style={{ padding:"10px 12px", fontWeight:600, color:T.bright, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.procedure_name}</td>
                      <td style={{ padding:"10px 12px", fontFamily:"JetBrains Mono,monospace", color:T.teal }}>{row.cpt_code||"—"}</td>
                      <td style={{ padding:"10px 12px", color:T.text, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.location||"—"}</td>
                      <td style={{ padding:"10px 12px" }}><span style={{ padding:"2px 8px", borderRadius:6, fontSize:10.5, fontWeight:600, background:sc.bg, color:sc.fg }}>{row.supervision?.split(" ")[0]||"—"}</span></td>
                      <td style={{ padding:"10px 12px", textAlign:"center", color:T.text }}>{row.attempts||1}</td>
                      <td style={{ padding:"10px 12px", textAlign:"center" }}><span style={{ color:row.success!==false?T.green:T.red }}>{row.success!==false?"✓":"✗"}</span></td>
                      <td style={{ padding:"10px 12px", textAlign:"center", color:T.dim }}>{row.ultrasound_used?"✅":"—"}</td>
                      <td style={{ padding:"10px 12px", color:T.text, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.complications||"—"}</td>
                      <td style={{ padding:"10px 12px" }}><button onClick={()=>deleteMutation.mutate(row.id)} style={{ background:"transparent", border:"none", color:T.dim, cursor:"pointer", fontSize:12 }}>🗑️</button></td>
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

export default function Procedures() {
  const [selectedCPT, setSelectedCPT] = useState(null);

  const handleSelectCPT = (row) => {
    setSelectedCPT(row);
    setTimeout(() => {
      document.getElementById("procedure-note-drafter")?.scrollIntoView({ behavior:"smooth", block:"start" });
    }, 100);
  };

  const SECTIONS = [
    { id:"procedure-note-drafter", label:"📋 Procedure Notes",  color:T.amber },
    { id:"ed-note-drafter",        label:"📝 ED Notes",         color:T.rose  },
    { id:"cpt-search",             label:"🔍 CPT Code Search",  color:T.teal  },
    { id:"procedure-log",          label:"📊 Procedure Log",    color:T.green },
  ];

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });

  return (
    <div style={{ background:T.navy, minHeight:"100%", fontFamily:"DM Sans,sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:0.8} }
        select option { background: #0e2340; color: #c8ddf0; }
      `}</style>
      <div style={{ padding:"28px 24px 20px", borderBottom:`1px solid rgba(30,58,95,0.6)` }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
          <div style={{ fontSize:28, background:"rgba(0,212,188,0.1)", border:"1px solid rgba(0,212,188,0.2)", borderRadius:12, padding:12 }}>✂️</div>
          <div>
            <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:26, fontWeight:700, color:T.bright, margin:0 }}>Procedure Suite</h1>
            <p style={{ fontSize:13, color:T.dim, margin:"4px 0 0" }}>CPT lookup, note templates, and procedure logging</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              style={{ padding:"5px 13px", borderRadius:20, fontSize:11.5, fontWeight:600, background:"rgba(14,35,64,0.9)", border:`1px solid ${T.border}`, color:T.dim, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color; e.currentTarget.style.color=s.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.dim;}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:"32px 24px" }}>
        <ProcedureNoteDrafter prefilledCPT={selectedCPT} onClearPrefill={() => setSelectedCPT(null)} />
        <EDNoteDrafter />
        <CPTSearch onSelectCPT={handleSelectCPT} />
        <ProcedureLog />
      </div>
    </div>
  );
}