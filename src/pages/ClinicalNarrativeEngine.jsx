import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const PREFIX = "cne";

(() => {
  const fontId = `${PREFIX}-fonts`;
  if (document.getElementById(fontId)) return;
  const l = document.createElement("link");
  l.id = fontId; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)}  }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)}   }
    @keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)}  }
    @keyframes ${PREFIX}spin  { to{transform:rotate(360deg)} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
    @keyframes ${PREFIX}type  { from{opacity:0} to{opacity:1} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .25s ease both; }
    .${PREFIX}-spin  { animation:${PREFIX}spin  .9s linear infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#00e5c0 30%,#3b9eff 60%,#9b6dff 80%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#ffffff", txt2:"#d8ecff", txt3:"#a8ccee", txt4:"#7aaace",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.82)", border:"1px solid rgba(42,79,122,0.38)", borderRadius:14,
};

// ── NARRATIVE TEMPLATES ───────────────────────────────────────────────
const TEMPLATES = [
  {
    id:"ed_note",
    label:"ED Physician Note",
    icon:"🏥",
    color:T.teal,
    description:"Full emergency department note with HPI, ROS, PE, MDM, and disposition",
    fields:[
      { id:"patient_age",    label:"Age / Sex",           placeholder:"45M",                 required:true  },
      { id:"chief_complaint",label:"Chief Complaint",      placeholder:"chest pain x 2 hours", required:true  },
      { id:"hpi_bullets",    label:"HPI Key Points",       placeholder:"onset, quality, severity, radiation, associated sx…", required:true, textarea:true },
      { id:"pmh",            label:"Past Medical History", placeholder:"HTN, DM2, prior MI",   required:false },
      { id:"meds",           label:"Medications",          placeholder:"metformin, lisinopril…",required:false },
      { id:"allergies",      label:"Allergies",            placeholder:"NKDA",                 required:false },
      { id:"vitals",         label:"Vital Signs",          placeholder:"BP 148/90, HR 88, RR 18, SpO2 98%, Temp 98.6", required:false },
      { id:"exam_findings",  label:"Physical Exam Findings",placeholder:"describe key positive and negative findings", required:false, textarea:true },
      { id:"labs_imaging",   label:"Labs / Imaging",       placeholder:"trop 0.02, ECG NSR, CXR clear", required:false, textarea:true },
      { id:"assessment",     label:"Assessment",           placeholder:"NSTEMI vs ACS, HTN", required:true  },
      { id:"plan",           label:"Plan",                 placeholder:"aspirin, heparin, cardiology consult, admit CCU", required:true, textarea:true },
      { id:"disposition",    label:"Disposition",          placeholder:"admit to cardiology, or discharge with follow-up", required:true },
    ],
  },
  {
    id:"hpi_only",
    label:"HPI Generator",
    icon:"📝",
    color:T.blue,
    description:"Detailed, OLDCARTS-formatted history of present illness",
    fields:[
      { id:"patient_age",    label:"Age / Sex",            placeholder:"67F",                  required:true  },
      { id:"chief_complaint",label:"Chief Complaint",      placeholder:"shortness of breath",  required:true  },
      { id:"onset",          label:"Onset",                placeholder:"3 days ago, gradual",  required:true  },
      { id:"location",       label:"Location / Radiation", placeholder:"bilateral lower extremities", required:false },
      { id:"duration",       label:"Duration",             placeholder:"constant, worsening",  required:false },
      { id:"character",      label:"Character / Quality",  placeholder:"pressure, dull ache",  required:false },
      { id:"severity",       label:"Severity (1–10)",      placeholder:"7/10 at rest",         required:false },
      { id:"alleviating",    label:"Alleviating Factors",  placeholder:"sitting upright",      required:false },
      { id:"aggravating",    label:"Aggravating Factors",  placeholder:"exertion, lying flat", required:false },
      { id:"associated",     label:"Associated Symptoms",  placeholder:"orthopnea, PND, leg swelling", required:false, textarea:true },
      { id:"pmh",            label:"Relevant PMH",         placeholder:"CHF, atrial fibrillation", required:false },
    ],
  },
  {
    id:"discharge_summary",
    label:"Discharge Summary",
    icon:"🏠",
    color:T.green,
    description:"Clear, patient-friendly discharge summary with instructions and follow-up",
    fields:[
      { id:"patient_age",    label:"Age / Sex",            placeholder:"72M",                         required:true  },
      { id:"diagnosis",      label:"Primary Diagnosis",    placeholder:"Community-acquired pneumonia", required:true  },
      { id:"hospital_course",label:"Hospital Course",      placeholder:"3-day admission, IV abx, improved", required:true, textarea:true },
      { id:"discharge_meds", label:"Discharge Medications",placeholder:"azithromycin 250mg daily x5d, albuterol PRN", required:false, textarea:true },
      { id:"activity",       label:"Activity Restrictions",placeholder:"light activity, no strenuous exercise", required:false },
      { id:"diet",           label:"Dietary Instructions", placeholder:"regular diet, push fluids",   required:false },
      { id:"followup",       label:"Follow-up",            placeholder:"PCP in 1 week, pulm in 4 weeks", required:true  },
      { id:"return_precautions",label:"Return Precautions",placeholder:"fever >101, worsening SOB, chest pain", required:true, textarea:true },
    ],
  },
  {
    id:"procedure_note",
    label:"Procedure Note",
    icon:"✂️",
    color:T.orange,
    description:"Structured bedside procedure note with consent, technique, and complications",
    fields:[
      { id:"procedure",      label:"Procedure Name",       placeholder:"Central venous catheter placement", required:true  },
      { id:"indication",     label:"Indication",           placeholder:"IV access, hemodynamic monitoring", required:true  },
      { id:"consent",        label:"Consent",              placeholder:"verbal/written, risks discussed",   required:true  },
      { id:"timeout",        label:"Time-Out Performed",   placeholder:"Yes — patient, procedure, site confirmed", required:false },
      { id:"site",           label:"Site / Approach",      placeholder:"right internal jugular, ultrasound-guided", required:true  },
      { id:"anesthesia",     label:"Anesthesia Used",      placeholder:"1% lidocaine 5mL",                 required:false },
      { id:"technique",      label:"Technique",            placeholder:"Seldinger technique, 3-lumen catheter, good blood return all ports", required:true, textarea:true },
      { id:"complications",  label:"Complications",        placeholder:"None. Post-procedure CXR pending.", required:true  },
      { id:"operator",       label:"Operator",             placeholder:"Dr. Smith, attending; Dr. Jones, resident", required:false },
    ],
  },
  {
    id:"consult_note",
    label:"Consult Request Note",
    icon:"📡",
    color:T.purple,
    description:"Structured specialty consultation note with clinical question and urgency",
    fields:[
      { id:"patient_age",    label:"Age / Sex",            placeholder:"58F",                           required:true  },
      { id:"service",        label:"Consulting Service",   placeholder:"Cardiology",                    required:true  },
      { id:"urgency",        label:"Urgency",              placeholder:"Emergent / Urgent / Routine",   required:true  },
      { id:"reason",         label:"Reason for Consult",   placeholder:"New LBBB with chest pain, please evaluate for ACS", required:true, textarea:true },
      { id:"relevant_hx",   label:"Relevant History",     placeholder:"HTN, hyperlipidemia, prior CABG 2019", required:false, textarea:true },
      { id:"relevant_data",  label:"Relevant Data",        placeholder:"troponin trend, ECG findings, echo results", required:false, textarea:true },
      { id:"question",       label:"Specific Question",    placeholder:"Is this patient a cath lab candidate? Management recommendations.", required:true, textarea:true },
      { id:"current_plan",   label:"Current Management",   placeholder:"aspirin, heparin gtt, metoprolol", required:false },
    ],
  },
  {
    id:"mdm",
    label:"Medical Decision Making",
    icon:"⚖️",
    color:T.gold,
    description:"High-quality MDM documentation for billing and clinical reasoning",
    fields:[
      { id:"diagnoses",      label:"Diagnoses / Problems", placeholder:"1. Chest pain r/o ACS\n2. HTN, poorly controlled", required:true, textarea:true },
      { id:"data_reviewed",  label:"Data Reviewed / Ordered", placeholder:"ECG, troponin x2, CXR, CBC, BMP", required:true, textarea:true },
      { id:"risk",           label:"Risk Level",           placeholder:"High — new cardiac symptoms, abnormal ECG", required:true  },
      { id:"differential",   label:"Differential Diagnosis",placeholder:"ACS, PE, aortic dissection, esophageal spasm", required:false, textarea:true },
      { id:"treatment",      label:"Treatment Plan",       placeholder:"aspirin, NTG, heparin, admit for serial troponins", required:true, textarea:true },
      { id:"followup",       label:"Follow-up / Escalation",placeholder:"cardiology consult placed, repeat ECG in 30 min", required:false },
    ],
  },
];

const TONE_OPTIONS = [
  { id:"attending",  label:"Attending Physician",  icon:"🩺", desc:"Formal, authoritative, board-ready" },
  { id:"resident",   label:"Resident/Fellow",       icon:"👨‍⚕️", desc:"Detailed, learning-focused, thorough" },
  { id:"concise",    label:"Concise / Bullet",      icon:"⚡", desc:"Short, scannable, key points only" },
  { id:"patient",    label:"Patient-Friendly",       icon:"😊", desc:"Plain language, lay terms, empathetic" },
];

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"8%",  t:"12%", r:320, c:"rgba(0,229,192,0.045)"   },
        { l:"90%", t:"15%", r:280, c:"rgba(155,109,255,0.04)"  },
        { l:"78%", t:"80%", r:300, c:"rgba(59,158,255,0.04)"   },
        { l:"15%", t:"82%", r:240, c:"rgba(245,200,66,0.04)"   },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg, isError }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", border:`1px solid ${isError?T.red+"55":"rgba(0,229,192,0.4)"}`,
      borderRadius:10, padding:"10px 20px", fontFamily:"DM Sans", fontWeight:600,
      fontSize:13, color:isError?T.coral:T.teal,
      zIndex:99999, pointerEvents:"none", animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function FieldInput({ field, value, onChange }) {
  const base = {
    background:"rgba(14,37,68,0.8)",
    border:`1px solid ${value ? "rgba(59,158,255,0.4)" : "rgba(42,79,122,0.4)"}`,
    borderRadius:9, padding:"9px 12px",
    fontFamily:"DM Sans", fontSize:13, color:T.txt,
    outline:"none", width:"100%", transition:"border-color .15s",
  };
  if (field.textarea) {
    return (
      <textarea
        value={value} onChange={e => onChange(e.target.value)} rows={3}
        placeholder={field.placeholder}
        style={{ ...base, resize:"vertical", lineHeight:1.55 }}
      />
    );
  }
  return (
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      style={base}
    />
  );
}

function NarrativeOutput({ text, onCopy, onSave, onRegenerate, loading }) {
  const lines = text.split("\n");
  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Actions bar */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button onClick={onCopy} style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          padding:"8px 16px", borderRadius:9, cursor:"pointer",
          border:`1px solid ${T.teal}45`, background:`${T.teal}12`, color:T.teal,
        }}>⎘ Copy to Clipboard</button>
        <button onClick={onSave} style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          padding:"8px 16px", borderRadius:9, cursor:"pointer",
          border:`1px solid ${T.blue}45`, background:`${T.blue}10`, color:T.blue,
        }}>💾 Save as Note</button>
        <button onClick={onRegenerate} disabled={loading} style={{
          fontFamily:"DM Sans", fontWeight:600, fontSize:12,
          padding:"8px 16px", borderRadius:9, cursor:loading?"not-allowed":"pointer",
          border:"1px solid rgba(42,79,122,0.4)",
          background:"rgba(14,37,68,0.5)", color:T.txt3,
          opacity:loading?0.5:1,
        }}>{loading ? "⟳ Regenerating…" : "⟳ Regenerate"}</button>
      </div>

      {/* Note output */}
      <div style={{
        ...glass, padding:"20px 22px",
        borderLeft:`3px solid ${T.teal}`,
        background:"rgba(8,22,40,0.9)",
        fontFamily:"JetBrains Mono", fontSize:12, lineHeight:1.9,
        color:T.txt2, whiteSpace:"pre-wrap", overflowY:"auto", maxHeight:"65vh",
        position:"relative",
      }}>
        <div style={{
          position:"absolute", top:10, right:12,
          fontFamily:"JetBrains Mono", fontSize:8, color:T.teal,
          letterSpacing:1.5, textTransform:"uppercase", opacity:0.7,
        }}>AI Generated · Review Before Use</div>
        {lines.map((line, i) => {
          // Headings: ALL CAPS lines or lines ending with ":"
          const isHeader = /^[A-Z\s\/&]+:/.test(line) || /^[A-Z\s]{5,}$/.test(line.trim());
          const isDivider = /^[-─═]{3,}/.test(line.trim());
          return (
            <div key={i} style={{
              color: isDivider ? T.txt4 : isHeader ? T.teal : T.txt2,
              fontWeight: isHeader ? 700 : 400,
              marginTop: isHeader && i > 0 ? 12 : 0,
              letterSpacing: isHeader ? .5 : 0,
              opacity: isDivider ? 0.4 : 1,
            }}>{line || " "}</div>
          );
        })}
      </div>

      {/* Word count */}
      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textAlign:"right" }}>
        {text.split(/\s+/).filter(Boolean).length} words · {text.length} chars
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════
export default function ClinicalNarrativeEngine({ onBack }) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [fieldValues,      setFieldValues]      = useState({});
  const [selectedTone,     setSelectedTone]     = useState("attending");
  const [customInstructions, setCustomInstructions] = useState("");
  const [narrative,        setNarrative]        = useState("");
  const [loading,          setLoading]          = useState(false);
  const [toast,            setToast]            = useState({ msg:"", err:false });
  const [step,             setStep]             = useState("form"); // "form" | "output"

  function showToast(msg, err=false) {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg:"", err:false }), 2500);
  }

  function setField(id, val) {
    setFieldValues(prev => ({ ...prev, [id]: val }));
  }

  function selectTemplate(t) {
    setSelectedTemplate(t);
    setFieldValues({});
    setNarrative("");
    setStep("form");
  }

  const generate = useCallback(async () => {
    const required = selectedTemplate.fields.filter(f => f.required);
    const missing  = required.filter(f => !fieldValues[f.id]?.trim());
    if (missing.length) {
      showToast(`Please fill in: ${missing.map(f => f.label).join(", ")}`, true);
      return;
    }

    setLoading(true);
    setStep("output");

    const tone = TONE_OPTIONS.find(t => t.id === selectedTone);
    const fieldsSummary = selectedTemplate.fields
      .map(f => fieldValues[f.id] ? `${f.label}: ${fieldValues[f.id]}` : null)
      .filter(Boolean)
      .join("\n");

    const prompt = `You are an expert clinical documentation specialist writing for a U.S. emergency medicine department.

Generate a complete, high-quality "${selectedTemplate.label}" using the information below.

TONE: ${tone.label} — ${tone.desc}

CLINICAL DATA:
${fieldsSummary}

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}\n` : ""}

FORMAT REQUIREMENTS:
- Use clear section headings in ALL CAPS followed by colon (e.g., "CHIEF COMPLAINT:")
- Write in professional clinical prose appropriate for the specified tone
- For attending tone: formal, precise, complete sentences, defensible documentation
- For concise tone: use structured bullets where appropriate
- For patient-friendly tone: avoid jargon, use simple language
- Include all clinically relevant details provided
- Do NOT include placeholder text like [BLANK] — omit sections if data not provided
- Do NOT add fabricated clinical data not provided
- End with appropriate sign-off section

Generate the complete note now:`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setNarrative(typeof result === "string" ? result : JSON.stringify(result));
    } catch {
      showToast("Generation failed — please try again", true);
      setStep("form");
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate, fieldValues, selectedTone, customInstructions]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(narrative);
      showToast("Copied to clipboard!");
    } catch {
      showToast("Clipboard access denied", true);
    }
  }

  async function saveAsNote() {
    try {
      await base44.entities.ClinicalNote.create({
        raw_note: narrative,
        chief_complaint: fieldValues.chief_complaint || fieldValues.diagnosis || selectedTemplate.label,
        status: "draft",
        note_type: "progress_note",
      });
      showToast("Saved as draft note!");
    } catch {
      showToast("Error saving note", true);
    }
  }

  const completedFields = selectedTemplate.fields.filter(f => fieldValues[f.id]?.trim()).length;
  const totalFields     = selectedTemplate.fields.length;
  const progress        = Math.round((completedFields / totalFields) * 100);

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} isError={toast.err}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
            <div style={{
              backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8,
            }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>NARRATIVE ENGINE</span>
            </div>
            <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }}/>
            {onBack && (
              <button onClick={onBack} style={{
                fontFamily:"DM Sans", fontSize:11, fontWeight:600, padding:"5px 14px",
                borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
                background:"rgba(14,37,68,0.6)", color:T.txt3,
              }}>← Hub</button>
            )}
          </div>
          <h1 className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display", fontSize:"clamp(22px,3.5vw,36px)",
            fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
          }}>Clinical Narrative Engine</h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
            AI-powered documentation · Choose template · Fill structured fields · Generate publish-ready clinical narrative
          </p>
        </div>

        {/* Main layout */}
        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:16, alignItems:"start", marginBottom:24 }}>

          {/* Left: Template selector */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:2 }}>
              Note Type
            </div>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => selectTemplate(t)} style={{
                ...glass, padding:"11px 13px", cursor:"pointer",
                borderLeft:`3px solid ${selectedTemplate.id === t.id ? t.color : "transparent"}`,
                background: selectedTemplate.id === t.id
                  ? `${t.color}0f`
                  : "rgba(8,22,40,0.6)",
                transition:"all .15s",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:16 }}>{t.icon}</span>
                  <span style={{
                    fontFamily:"DM Sans", fontWeight:700, fontSize:12,
                    color:selectedTemplate.id === t.id ? t.color : T.txt2,
                  }}>{t.label}</span>
                </div>
                <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, lineHeight:1.4 }}>
                  {t.description}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Form + Output */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {step === "form" || loading ? (
              <>
                {/* Tone selector */}
                <div style={{ ...glass, padding:"12px 14px" }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
                    Writing Tone
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {TONE_OPTIONS.map(t => (
                      <button key={t.id} onClick={() => setSelectedTone(t.id)} style={{
                        fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                        padding:"6px 12px", borderRadius:20, cursor:"pointer",
                        border:`1px solid ${selectedTone===t.id ? T.blue+"55" : "rgba(42,79,122,0.35)"}`,
                        background: selectedTone===t.id ? `${T.blue}14` : "transparent",
                        color: selectedTone===t.id ? T.blue : T.txt3,
                        transition:"all .12s",
                        display:"flex", alignItems:"center", gap:5,
                      }}>
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedTone && (
                    <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:6 }}>
                      {TONE_OPTIONS.find(t => t.id === selectedTone)?.desc}
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div style={{ ...glass, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:18 }}>{selectedTemplate.icon}</span>
                      <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt }}>{selectedTemplate.label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:80, height:4, background:"rgba(42,79,122,0.4)", borderRadius:2, overflow:"hidden" }}>
                        <div style={{
                          height:"100%", borderRadius:2, transition:"width .3s",
                          width:`${progress}%`,
                          background:`linear-gradient(90deg,${selectedTemplate.color},${T.teal})`,
                        }}/>
                      </div>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
                        {completedFields}/{totalFields}
                      </span>
                    </div>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {selectedTemplate.fields.map(field => (
                      <div key={field.id}>
                        <div style={{
                          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                          color: fieldValues[field.id] ? T.teal : T.txt4,
                          letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
                          display:"flex", alignItems:"center", gap:5,
                        }}>
                          {field.label}
                          {field.required && (
                            <span style={{ color:T.red, fontSize:9 }}>*</span>
                          )}
                          {fieldValues[field.id] && (
                            <span style={{ color:T.teal, fontSize:10 }}>✓</span>
                          )}
                        </div>
                        <FieldInput
                          field={field}
                          value={fieldValues[field.id] || ""}
                          onChange={val => setField(field.id, val)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Custom instructions */}
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                      Additional Instructions (optional)
                    </div>
                    <textarea
                      value={customInstructions}
                      onChange={e => setCustomInstructions(e.target.value)}
                      rows={2} placeholder="e.g. Include social history, emphasize medication reconciliation, use bullet points for plan…"
                      style={{
                        background:"rgba(14,37,68,0.7)",
                        border:"1px solid rgba(42,79,122,0.35)",
                        borderRadius:9, padding:"9px 12px",
                        fontFamily:"DM Sans", fontSize:12, color:T.txt,
                        outline:"none", width:"100%", resize:"vertical", lineHeight:1.55,
                      }}
                    />
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={generate}
                    disabled={loading}
                    style={{
                      width:"100%", marginTop:16,
                      fontFamily:"DM Sans", fontWeight:700, fontSize:14,
                      padding:"14px", borderRadius:10, cursor:loading?"not-allowed":"pointer",
                      border:`1px solid ${selectedTemplate.color}55`,
                      background:`linear-gradient(135deg,${selectedTemplate.color}20,${selectedTemplate.color}0a)`,
                      color:selectedTemplate.color,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      opacity:loading?0.6:1, transition:"all .15s",
                      fontSize:14,
                    }}
                  >
                    {loading ? (
                      <>
                        <span className={`${PREFIX}-spin`} style={{ display:"inline-block", fontSize:16 }}>⟳</span>
                        Generating narrative…
                      </>
                    ) : (
                      <>✦ Generate {selectedTemplate.label}</>
                    )}
                  </button>
                </div>
              </>
            ) : null}

            {/* Output */}
            {step === "output" && !loading && narrative && (
              <>
                {/* Back to edit */}
                <button onClick={() => setStep("form")} style={{
                  alignSelf:"flex-start", fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                  padding:"6px 14px", borderRadius:8, cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.4)",
                  background:"rgba(14,37,68,0.5)", color:T.txt3,
                }}>← Edit Inputs</button>

                <NarrativeOutput
                  text={narrative}
                  loading={loading}
                  onCopy={copyToClipboard}
                  onSave={saveAsNote}
                  onRegenerate={generate}
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · CLINICAL NARRATIVE ENGINE · AI-ASSISTED · ALWAYS REVIEW BEFORE SIGNING
          </span>
        </div>

      </div>
    </div>
  );
}