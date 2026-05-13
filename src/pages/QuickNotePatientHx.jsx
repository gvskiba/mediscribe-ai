// QuickNotePatientHx.jsx
// PMH constants and PMHTab component extracted from QuickNote.jsx

import { useState } from "react";
import { base44 } from "@/api/base44Client";

// ─── PMH CONSTANTS ────────────────────────────────────────────────────────────
export const PMH_CATS = {
  Cardiovascular:["HTN","CAD","CHF","Atrial fibrillation","Prior MI","PVD","Cardiomyopathy","Valvular disease","Pacemaker/ICD","Aortic aneurysm"],
  Pulmonary:["Asthma","COPD","OSA","Pulmonary HTN","Prior PE","Bronchiectasis","Interstitial lung disease"],
  "Metabolic/Endo":["DM Type 2","DM Type 1","Obesity","Hypothyroidism","Hyperthyroidism","Hyperlipidemia","Metabolic syndrome","Adrenal insufficiency"],
  Neurological:["Stroke/TIA","Seizure disorder","Migraines","Parkinson's","Dementia","Neuropathy","Multiple sclerosis"],
  "GI/Hepatic":["GERD","PUD","IBD","Cirrhosis","NAFLD","Pancreatitis","Diverticulosis","GI bleed history"],
  Renal:["CKD","ESRD on HD","Renal transplant","Prior AKI","Nephrolithiasis","Proteinuria"],
  Hematologic:["Anemia","Thrombocytopenia","On anticoagulation","Coagulopathy","Prior DVT/PE","Sickle cell disease"],
  Psychiatric:["Depression","Anxiety","Bipolar disorder","Schizophrenia","PTSD","Substance use disorder"],
  Oncologic:["Active malignancy","Prior malignancy","On chemotherapy","On immunotherapy","Immunocompromised"],
  Other:["HIV/AIDS","Autoimmune disease","Transplant recipient","Chronic pain","Fibromyalgia","Thyroid disease"],
};

export const PMH_CAT_ICONS = {
  Cardiovascular:"♥", Pulmonary:"🫁", "Metabolic/Endo":"⚡", Neurological:"🧠",
  "GI/Hepatic":"🔵", Renal:"💧", Hematologic:"🩸", Psychiatric:"🧩",
  Oncologic:"⚠", Other:"＋",
};

export const PMH_PRI_STYLE = {
  Immediate: { dot:"#ef4444", bg:"rgba(239,68,68,0.12)", badge:"#ef4444" },
  Urgent:    { dot:"#f59e0b", bg:"rgba(245,158,11,0.12)", badge:"#f59e0b" },
  Routine:   { dot:"#64748b", bg:"rgba(100,116,139,0.12)", badge:"#64748b" },
};

export const PMH_MDM_HIGH = new Set([
  "Active malignancy","ESRD on HD","On chemotherapy","On immunotherapy","Immunocompromised",
  "Cirrhosis","On anticoagulation","Coagulopathy","Substance use disorder","Transplant recipient",
  "Renal transplant","HIV/AIDS","Pulmonary HTN","Cardiomyopathy","CHF",
]);

export const PMH_MDM_MOD = new Set([
  "HTN","CAD","DM Type 2","DM Type 1","Atrial fibrillation","COPD","Asthma","CKD","Prior MI",
  "Prior PE","Prior DVT/PE","Stroke/TIA","Seizure disorder","Hypothyroidism","Hyperthyroidism",
  "Hyperlipidemia","IBD","Pancreatitis","OSA","GI bleed history","Autoimmune disease",
]);

export function computePMHMDM(list) {
  const high = list.filter(c => PMH_MDM_HIGH.has(c));
  const mod  = list.filter(c => PMH_MDM_MOD.has(c));
  const other= list.filter(c => !PMH_MDM_HIGH.has(c) && !PMH_MDM_MOD.has(c));
  let level = "Low", rationale = "Minimal comorbidity burden";
  if (high.length >= 1) {
    level = "High";
    rationale = `${high.length} high-complexity condition${high.length>1?"s":""}: ${high.slice(0,2).join(", ")}${high.length>2?"...":""}`;
  } else if (mod.length >= 3) {
    level = "High";
    rationale = `${mod.length} chronic conditions — ≥3 elevates to High (AMA 2021)`;
  } else if (mod.length >= 1) {
    level = "Moderate";
    rationale = `${mod.length} established chronic condition${mod.length>1?"s":""}`;
  } else if (list.length > 0) {
    level = "Low-Moderate";
    rationale = "Minor or unclassified conditions present";
  }
  return { level, rationale, high, mod, other };
}

// ─── PMH TAB COMPONENT ────────────────────────────────────────────────────────
export function PMHTab({ pmh, setPmh, psh, setPsh, patientMeds, setPatientMeds,
  patientAllergies, setPatientAllergies, chiefComplaint, hpi, onOrderQueueChange, onMDMDataChange }) {

  const teal = "#0d9488", gold = "#d4a017", bdr = "rgba(42,79,122,.4)";
  const [mode, setMode]           = useState("select");
  const [activeCat, setActiveCat] = useState("Cardiovascular");
  const [searchQ, setSearchQ]     = useState("");
  const [pasteText, setPasteText] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [pshInput, setPshInput]   = useState("");
  const [medInput, setMedInput]   = useState("");
  const [aInput, setAInput]       = useState("");
  const [workupRecs, setWorkupRecs] = useState([]);
  const [analyzing, setAnalyzing]   = useState(false);
  const [recsOpen, setRecsOpen]     = useState(false);
  const [parseMsg, setParseMsg]     = useState("");
  const [analyzeErr, setAnalyzeErr] = useState("");
  const [orderQueue, setOrderQueue] = useState([]);
  const [showQueue, setShowQueue]   = useState(false);
  const [showMDM, setShowMDM]       = useState(false);
  const [orderSent, setOrderSent]   = useState(false);
  const [mdmSent, setMdmSent]       = useState(false);
  const [copiedAll, setCopiedAll]   = useState(false);

  const allConds = Object.values(PMH_CATS).flat();
  const filtered = searchQ.length > 1 ? allConds.filter(c => c.toLowerCase().includes(searchQ.toLowerCase())) : [];
  const mdmData  = computePMHMDM(pmh);
  const MDM_COL  = { High:"#ef4444", Moderate:"#f59e0b", "Low-Moderate":"#a78bfa", Low:"#64748b" };
  const mdmColor = MDM_COL[mdmData.level] || "#64748b";

  const toggle = c => setPmh(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const remPmh = c => setPmh(p => p.filter(x => x !== c));
  const remPsh = c => setPsh(p => p.filter(x => x !== c));
  const remMed = c => setPatientMeds(p => p.filter(x => x !== c));
  const remA   = c => setPatientAllergies(p => p.filter(x => x !== c));
  const addCust = () => { const v = customInput.trim(); if (v && !pmh.includes(v)) setPmh(p => [...p, v]); setCustomInput(""); };
  const addPsh  = () => { const v = pshInput.trim();   if (v && !psh.includes(v)) setPsh(p => [...p, v]); setPshInput(""); };
  const addMed  = () => { const v = medInput.trim();   if (v && !patientMeds.includes(v)) setPatientMeds(p => [...p, v]); setMedInput(""); };
  const addA    = () => { const v = aInput.trim();     if (v && !patientAllergies.includes(v)) setPatientAllergies(p => [...p, v]); setAInput(""); };

  const isQueued  = rec => orderQueue.some(o => o.recommendation === rec.recommendation);
  const addToQ    = rec => { if (!isQueued(rec)) setOrderQueue(p => [...p, rec]); };
  const remFromQ  = rec => setOrderQueue(p => p.filter(o => o.recommendation !== rec.recommendation));
  const addAllPri = pr  => { const add = workupRecs.filter(r => r.priority === pr && !isQueued(r)); setOrderQueue(p => [...p, ...add]); setShowQueue(true); };

  const parsePaste = async () => {
    if (!pasteText.trim()) return;
    setParseMsg("Parsing…");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured medical history from the following text. Return JSON with keys: pmh (array), psh (array), medications (array), allergies (array). Text:\n\n${pasteText}`,
        response_json_schema: {
          type: "object",
          properties: {
            pmh: { type: "array", items: { type: "string" } },
            psh: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
          },
        },
      });
      if (res.pmh?.length)         setPmh(p          => [...new Set([...p, ...res.pmh])]);
      if (res.psh?.length)         setPsh(p          => [...new Set([...p, ...res.psh])]);
      if (res.medications?.length) setPatientMeds(p  => [...new Set([...p, ...res.medications])]);
      if (res.allergies?.length)   setPatientAllergies(p => [...new Set([...p, ...res.allergies])]);
      const tot = (res.pmh?.length||0)+(res.psh?.length||0)+(res.medications?.length||0)+(res.allergies?.length||0);
      setParseMsg(`✓ Extracted ${tot} item${tot!==1?"s":""}`);
      setPasteText("");
    } catch { setParseMsg("Parse error — review manually"); }
  };

  const analyzeWorkup = async () => {
    if (!chiefComplaint && !hpi && !pmh.length) { setAnalyzeErr("Add CC, HPI, or PMH items first"); return; }
    setAnalyzeErr(""); setAnalyzing(true); setRecsOpen(true); setWorkupRecs([]); setOrderQueue([]);
    try {
      const schema = {
        type: "object",
        properties: { recs: { type: "array", items: {
          type: "object",
          properties: {
            category: { type: "string" }, recommendation: { type: "string" },
            rationale: { type: "string" }, priority: { type: "string" }, evidence: { type: "string" },
          },
        }}},
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Emergency medicine CDS. Generate workup recommendations (max 10).
CC: ${chiefComplaint||"Not provided"}
HPI: ${hpi||"Not provided"}
PMH: ${pmh.join(", ")||"None"}
PSH: ${psh.join(", ")||"None"}
Meds: ${patientMeds.join(", ")||"None"}
Allergies: ${patientAllergies.join(", ")||"NKDA"}

Each item: category (Labs|Imaging|Consults|Monitoring|Medications), recommendation, rationale (under 15 words), priority (Immediate|Urgent|Routine), evidence (optional guideline tag). Return JSON with key "recs".`,
        response_json_schema: schema,
      });
      const recs = res?.recs || [];
      setWorkupRecs(recs);
      const imm = recs.filter(r => r.priority === "Immediate");
      setOrderQueue(imm);
      if (imm.length) setShowQueue(true);
    } catch { setAnalyzeErr("Analysis failed — check connection"); }
    setAnalyzing(false);
  };

  const sendToOrders = () => { if (onOrderQueueChange) onOrderQueueChange(orderQueue); setOrderSent(true); setTimeout(() => setOrderSent(false), 3000); };
  const sendToMDM    = () => { if (onMDMDataChange) onMDMDataChange(mdmData); setMdmSent(true); setTimeout(() => setMdmSent(false), 3000); };
  const copyAll      = () => {
    const t = workupRecs.map(r => `[${r.priority.toUpperCase()}] ${r.category}: ${r.recommendation} — ${r.rationale}`).join("\n");
    navigator.clipboard.writeText(t).then(() => { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000); });
  };

  // Style helpers
  const card    = { background:"rgba(8,22,40,.55)", border:`1px solid ${bdr}`, borderRadius:12, padding:"13px 16px", marginBottom:9 };
  const inp     = { width:"100%", background:"rgba(14,37,68,.6)", border:"1px solid rgba(42,79,122,.45)", borderRadius:8, padding:"8px 11px", color:"var(--qn-txt)", fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" };
  const modeBtn = a => ({ padding:"5px 14px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${a?teal:bdr}`, background:a?"rgba(13,148,136,0.18)":"transparent", color:a?teal:"var(--qn-txt4)", fontFamily:"'DM Sans',sans-serif" });
  const addBtn  = col => ({ padding:"7px 13px", background:`${col||teal}20`, border:`1px solid ${col||teal}`, borderRadius:7, color:col||teal, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, fontFamily:"'DM Sans',sans-serif" });
  const chip    = (sel, col) => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:16, fontSize:11, fontWeight:500, cursor:"pointer", border:`1px solid ${sel?col||teal:bdr}`, background:sel?`${col||teal}22`:"transparent", color:sel?col||teal:"var(--qn-txt3)", margin:"2px", fontFamily:"'DM Sans',sans-serif" });
  const catTab  = a => ({ padding:"4px 10px", borderRadius:14, fontSize:9, fontWeight:700, cursor:"pointer", border:`1px solid ${a?gold:bdr}`, background:a?"rgba(212,160,23,0.13)":"transparent", color:a?gold:"var(--qn-txt4)", margin:"2px", fontFamily:"'JetBrains Mono',monospace" });
  const ta      = { width:"100%", background:"rgba(14,37,68,.6)", border:"1px solid rgba(42,79,122,.45)", borderRadius:8, padding:"9px 11px", color:"var(--qn-txt)", fontSize:12, outline:"none", minHeight:90, resize:"vertical", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" };
  const primBtn = { padding:"8px 20px", background:`linear-gradient(135deg,${teal},#0f766e)`, border:"none", borderRadius:9, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" };
  const row     = { display:"flex", gap:8, alignItems:"center" };
  const chipRow = { display:"flex", flexWrap:"wrap", gap:5, marginTop:7, minHeight:26 };
  const recCard = p => ({ background:PMH_PRI_STYLE[p]?.bg||"rgba(100,116,139,0.1)", border:"1px solid rgba(42,79,122,.35)", borderRadius:9, padding:"10px 13px", display:"flex", gap:9, alignItems:"flex-start", marginBottom:6 });
  const dotSt   = p => ({ width:7, height:7, borderRadius:"50%", background:PMH_PRI_STYLE[p]?.dot||"#64748b", flexShrink:0, marginTop:4 });
  const catBadge= { fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:8, background:"rgba(13,148,136,0.15)", color:teal, fontFamily:"'JetBrains Mono',monospace" };
  const spinner = { width:14, height:14, border:"2px solid rgba(42,79,122,.4)", borderTop:`2px solid ${teal}`, borderRadius:"50%", animation:"pmhspin 0.7s linear infinite" };
  const qBtn    = q => ({ padding:"3px 9px", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer", border:`1px solid ${q?"#ef4444":teal}`, background:q?"rgba(239,68,68,0.12)":`rgba(13,148,136,0.12)`, color:q?"#ef4444":teal, flexShrink:0, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" });
  const lbl     = { fontSize:9, fontWeight:700, letterSpacing:"0.08em", color:"var(--qn-txt4)", textTransform:"uppercase", marginBottom:7, fontFamily:"'JetBrains Mono',monospace" };

  const Chips = ({ items, onRemove, col }) => (
    <div style={chipRow}>
      {!items.length && <span style={{ fontSize:11, color:"var(--qn-txt4)", fontStyle:"italic" }}>None added</span>}
      {items.map(i => (
        <span key={i} style={chip(true, col)}>
          {i}
          <span style={{ cursor:"pointer", color:"var(--qn-txt4)", marginLeft:3, fontSize:10, fontWeight:700 }} onClick={() => onRemove(i)}>✕</span>
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ marginBottom:14 }}>
      <style>{`@keyframes pmhspin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }} className="no-print">
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:"var(--qn-teal)" }}>Patient History</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", letterSpacing:1.5, textTransform:"uppercase", background:"rgba(0,229,192,.08)", border:"1px solid rgba(0,229,192,.2)", borderRadius:4, padding:"2px 7px" }}>PMH · PSH · Meds · Allergies · AI Workup</span>
        {pmh.length > 0 && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:mdmColor, background:`${mdmColor}20`, border:`1px solid ${mdmColor}44`, borderRadius:4, padding:"2px 8px", letterSpacing:"0.06em" }}>{mdmData.level.toUpperCase()} COMPLEXITY</span>}
      </div>

      {/* Input card */}
      <div style={card} className="no-print">
        <div style={{ display:"flex", gap:7, marginBottom:13, flexWrap:"wrap" }}>
          {["search","select","paste"].map(m => (
            <button key={m} style={modeBtn(mode===m)} onClick={() => setMode(m)}>
              {m==="search"?"🔍 Search":m==="select"?"☑ Select":"📋 Paste"}
            </button>
          ))}
          <span style={{ marginLeft:"auto", fontSize:11, color:"var(--qn-txt4)", alignSelf:"center", fontFamily:"'JetBrains Mono',monospace" }}>{pmh.length} dx</span>
        </div>

        {mode==="search" && (
          <div>
            <input style={inp} placeholder="Search conditions (e.g. HTN, COPD, cirrhosis)..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {filtered.length > 0 && <div style={{ marginTop:9 }}>{filtered.map(c => <span key={c} style={chip(pmh.includes(c))} onClick={() => toggle(c)}>{pmh.includes(c)?"✓ ":""}{c}</span>)}</div>}
            {searchQ.length > 1 && !filtered.length && (
              <div style={{ ...row, marginTop:9 }}>
                <span style={{ fontSize:11, color:"var(--qn-txt4)" }}>No match —</span>
                <button style={addBtn()} onClick={() => { toggle(searchQ); setSearchQ(""); }}>Add "{searchQ}"</button>
              </div>
            )}
          </div>
        )}

        {mode==="select" && (
          <div>
            <div style={{ display:"flex", flexWrap:"wrap", marginBottom:11 }}>
              {Object.keys(PMH_CATS).map(cat => (
                <button key={cat} style={catTab(activeCat===cat)} onClick={() => setActiveCat(cat)}>{PMH_CAT_ICONS[cat]} {cat}</button>
              ))}
            </div>
            <div>{PMH_CATS[activeCat].map(c => <span key={c} style={chip(pmh.includes(c))} onClick={() => toggle(c)}>{pmh.includes(c)?"✓ ":""}{c}</span>)}</div>
            <div style={{ ...row, marginTop:12 }}>
              <input style={inp} placeholder="Add custom condition..." value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter") addCust(); }} />
              <button style={addBtn()} onClick={addCust}>Add</button>
            </div>
          </div>
        )}

        {mode==="paste" && (
          <div>
            <div style={lbl}>Paste history, med list, or prior note — AI extracts automatically</div>
            <textarea style={ta} placeholder={"Paste here...\nE.g. PMH: HTN, DM2, CAD s/p CABG\nMeds: metoprolol 25mg, lisinopril 10mg\nAllergies: penicillin (rash)"} value={pasteText} onChange={e => setPasteText(e.target.value)} />
            <div style={{ ...row, marginTop:9 }}>
              <button style={primBtn} onClick={parsePaste}>✶ AI Parse &amp; Extract</button>
              {parseMsg && <span style={{ fontSize:11, color:parseMsg.startsWith("✓")?"var(--qn-teal)":"var(--qn-coral)", fontFamily:"'DM Sans',sans-serif" }}>{parseMsg}</span>}
            </div>
          </div>
        )}

        <div style={{ borderTop:"1px solid rgba(42,79,122,.3)", paddingTop:12, marginTop:13 }}>
          <div style={lbl}>Past Medical History</div>
          <Chips items={pmh} onRemove={remPmh} col={teal} />
        </div>
      </div>

      {/* PSH + Allergies */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:9 }} className="no-print">
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--qn-txt2)", marginBottom:9, fontFamily:"'DM Sans',sans-serif" }}>🔪 Past Surgical History</div>
          <div style={row}>
            <input style={inp} placeholder="e.g. CABG 2018, appendectomy..." value={pshInput} onChange={e => setPshInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter") addPsh(); }} />
            <button style={addBtn("#a78bfa")} onClick={addPsh}>Add</button>
          </div>
          <Chips items={psh} onRemove={remPsh} col="#a78bfa" />
        </div>
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--qn-txt2)", marginBottom:9, fontFamily:"'DM Sans',sans-serif" }}>⚠ Allergies</div>
          <div style={row}>
            <input style={inp} placeholder="e.g. Penicillin (rash)..." value={aInput} onChange={e => setAInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter") addA(); }} />
            <button style={addBtn("var(--qn-coral)")} onClick={addA}>Add</button>
          </div>
          <Chips items={patientAllergies} onRemove={remA} col="var(--qn-coral)" />
        </div>
      </div>

      {/* Medications */}
      <div style={card} className="no-print">
        <div style={{ fontSize:12, fontWeight:600, color:"var(--qn-txt2)", marginBottom:9, fontFamily:"'DM Sans',sans-serif" }}>💊 Current Medications</div>
        <div style={row}>
          <input style={inp} placeholder="e.g. Metoprolol 25mg daily..." value={medInput} onChange={e => setMedInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter") addMed(); }} />
          <button style={addBtn(gold)} onClick={addMed}>Add</button>
        </div>
        <Chips items={patientMeds} onRemove={remMed} col={gold} />
      </div>

      {/* MDM Comorbidity Panel */}
      {pmh.length > 0 && (
        <div style={{ ...card, border:`1px solid ${mdmColor}44` }} className="no-print">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom:showMDM?13:0 }} onClick={() => setShowMDM(o => !o)}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"var(--qn-txt2)", fontFamily:"'DM Sans',sans-serif" }}>📋 MDM Comorbidity</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:800, padding:"2px 9px", borderRadius:6, background:`${mdmColor}20`, color:mdmColor, letterSpacing:"0.06em" }}>{mdmData.level.toUpperCase()}</span>
            </div>
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              <button style={{ ...addBtn(mdmColor), padding:"5px 13px", fontSize:11, fontWeight:700 }} onClick={e => { e.stopPropagation(); sendToMDM(); }}>
                {mdmSent?"✓ Sent":"→ Send to MDM"}
              </button>
              <span style={{ color:"var(--qn-txt4)", fontSize:13 }}>{showMDM?"▲":"▼"}</span>
            </div>
          </div>
          {showMDM && (
            <div>
              <div style={{ fontSize:12, color:"var(--qn-txt4)", marginBottom:11, fontFamily:"'DM Sans',sans-serif" }}>{mdmData.rationale}</div>
              {mdmData.high.length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ ...lbl, color:"#ef4444" }}>🔴 High complexity (AMA 2021)</div>
                  <div>{mdmData.high.map(c => <span key={c} style={{ ...chip(true,"#ef4444"), margin:"2px" }}>{c}</span>)}</div>
                </div>
              )}
              {mdmData.mod.length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ ...lbl, color:"#f59e0b" }}>🟡 Moderate complexity</div>
                  <div>{mdmData.mod.map(c => <span key={c} style={{ ...chip(true,"#f59e0b"), margin:"2px" }}>{c}</span>)}</div>
                </div>
              )}
              {mdmData.other.length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <div style={lbl}>⚪ Unclassified / Minor</div>
                  <div>{mdmData.other.map(c => <span key={c} style={{ ...chip(false), margin:"2px" }}>{c}</span>)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Workup Recommendations */}
      <div style={{ ...card, border:"1px solid rgba(0,229,192,.3)" }} className="no-print">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom:recsOpen?13:0 }} onClick={() => setRecsOpen(o => !o)}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--qn-teal)", fontFamily:"'Playfair Display',serif" }}>✶ AI Workup Recommendations</span>
            {workupRecs.length > 0 && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 8px", borderRadius:8, background:"rgba(0,229,192,.12)", color:"var(--qn-teal)" }}>{workupRecs.length} recs</span>}
          </div>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            {workupRecs.length > 0 && <button style={{ ...addBtn(), padding:"5px 11px", fontSize:11 }} onClick={e => { e.stopPropagation(); copyAll(); }}>{copiedAll?"✓ Copied":"⌘ Copy All"}</button>}
            <button style={primBtn} onClick={e => { e.stopPropagation(); analyzeWorkup(); }}>
              {analyzing?"⏳ Analyzing…":"✶ Analyze"}
            </button>
            <span style={{ color:"var(--qn-txt4)", fontSize:13 }}>{recsOpen?"▲":"▼"}</span>
          </div>
        </div>
        {analyzeErr && <div style={{ color:"var(--qn-coral)", fontSize:11, marginTop:5, fontFamily:"'DM Sans',sans-serif" }}>{analyzeErr}</div>}
        {recsOpen && (
          <div>
            {analyzing && (
              <div style={{ ...row, padding:"12px 0" }}>
                <div style={spinner} />
                <span style={{ color:"var(--qn-txt4)", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>Analyzing CC + HPI + PMH…</span>
              </div>
            )}
            {!analyzing && !workupRecs.length && (
              <div style={{ color:"var(--qn-txt4)", fontSize:12, fontStyle:"italic", fontFamily:"'DM Sans',sans-serif" }}>Click Analyze to generate evidence-based recommendations from CC, HPI, and PMH.</div>
            )}
            {!analyzing && workupRecs.length > 0 && (
              <div style={{ ...row, flexWrap:"wrap", gap:7, marginBottom:12, paddingBottom:12, borderBottom:"1px solid rgba(42,79,122,.3)" }}>
                <span style={{ fontSize:11, color:"var(--qn-txt4)", fontFamily:"'DM Sans',sans-serif" }}>Stage to orders:</span>
                {["Immediate","Urgent","Routine"].map(p => {
                  const cnt = workupRecs.filter(r => r.priority === p).length;
                  if (!cnt) return null;
                  return <button key={p} style={{ ...addBtn(PMH_PRI_STYLE[p].badge), padding:"4px 11px", fontSize:10 }} onClick={() => addAllPri(p)}>+ All {p} ({cnt})</button>;
                })}
                {orderQueue.length > 0 && <span style={{ marginLeft:"auto", fontSize:11, color:"var(--qn-teal)", fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{orderQueue.length} staged →</span>}
              </div>
            )}
            {!analyzing && workupRecs.length > 0 && ["Immediate","Urgent","Routine"].map(priority => {
              const grp = workupRecs.filter(r => r.priority === priority);
              if (!grp.length) return null;
              return (
                <div key={priority} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:PMH_PRI_STYLE[priority]?.dot, marginBottom:7, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
                    {priority==="Immediate"?"🔴":priority==="Urgent"?"🟡":"⚪"} {priority}
                  </div>
                  {grp.map((rec, i) => (
                    <div key={i} style={recCard(priority)}>
                      <div style={dotSt(priority)} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:3 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif" }}>{rec.recommendation}</span>
                          <span style={catBadge}>{rec.category}</span>
                          {rec.evidence && <span style={{ fontSize:9, color:"var(--qn-txt4)", fontStyle:"italic", fontFamily:"'DM Sans',sans-serif" }}>{rec.evidence}</span>}
                          <button style={{ ...qBtn(isQueued(rec)), marginLeft:"auto" }} onClick={() => { isQueued(rec) ? remFromQ(rec) : addToQ(rec); setShowQueue(true); }}>
                            {isQueued(rec)?"✓ Staged":"+ Orders"}
                          </button>
                        </div>
                        <div style={{ fontSize:11, color:"var(--qn-txt4)", fontFamily:"'DM Sans',sans-serif" }}>{rec.rationale}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {!analyzing && workupRecs.length > 0 && (
              <div style={{ fontSize:10, color:"var(--qn-txt4)", borderTop:"1px solid rgba(42,79,122,.3)", paddingTop:9, fontFamily:"'DM Sans',sans-serif" }}>
                ⚠ AI recommendations are clinical decision support only. Always apply clinical judgment.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Queue */}
      {orderQueue.length > 0 && (
        <div style={{ ...card, border:"1px solid rgba(245,200,66,.35)" }} className="no-print">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom:showQueue?12:0 }} onClick={() => setShowQueue(o => !o)}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"var(--qn-gold)", fontFamily:"'DM Sans',sans-serif" }}>📤 Order Queue</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:800, padding:"2px 9px", borderRadius:6, background:"rgba(245,200,66,.15)", color:"var(--qn-gold)" }}>{orderQueue.length} staged</span>
            </div>
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              <button style={{ padding:"7px 17px", background:"linear-gradient(135deg,#d4a017,#b8860b)", border:"none", borderRadius:9, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }} onClick={e => { e.stopPropagation(); sendToOrders(); }}>
                {orderSent?"✓ Sent":"→ Pre-fill Labs & Imaging"}
              </button>
              <span style={{ color:"var(--qn-txt4)", fontSize:13 }}>{showQueue?"▲":"▼"}</span>
            </div>
          </div>
          {showQueue && (
            <div>
              {["Immediate","Urgent","Routine"].map(priority => {
                const grp = orderQueue.filter(o => o.priority === priority);
                if (!grp.length) return null;
                return (
                  <div key={priority} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:PMH_PRI_STYLE[priority]?.dot, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
                      {priority==="Immediate"?"🔴":priority==="Urgent"?"🟡":"⚪"} {priority}
                    </div>
                    {grp.map((o, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 11px", background:"rgba(14,37,68,.5)", borderRadius:7, marginBottom:5 }}>
                        <span style={catBadge}>{o.category}</span>
                        <span style={{ fontSize:12, color:"var(--qn-txt)", flex:1, fontFamily:"'DM Sans',sans-serif" }}>{o.recommendation}</span>
                        <span style={{ fontSize:10, color:"var(--qn-txt4)", fontFamily:"'DM Sans',sans-serif" }}>{o.rationale}</span>
                        <button style={{ ...qBtn(true), padding:"2px 7px", fontSize:10 }} onClick={() => remFromQ(o)}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}