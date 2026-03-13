import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Design tokens ──────────────────────────────────────────────────
const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040", indigo:"#818cf8",
};

// ── Template library ───────────────────────────────────────────────
const TEMPLATES = [
  // Emergency
  { id:"t_chest_pain",    title:"Chest Pain",          specialty:"Emergency",    type:"ED Visit",      icon:"❤️",  tags:["cardiovascular","ACS","PE"],   sections:["CC","HPI","ROS","PE","MDM","Dispo"],   description:"ACS/PE workup with HEART score and risk stratification" },
  { id:"t_sob",           title:"Shortness of Breath", specialty:"Emergency",    type:"ED Visit",      icon:"🫁",  tags:["respiratory","CHF","PE"],       sections:["CC","HPI","ROS","PE","MDM","Dispo"],   description:"Dyspnea evaluation including cardiac and pulmonary etiologies" },
  { id:"t_abdo_pain",     title:"Abdominal Pain",      specialty:"Emergency",    type:"ED Visit",      icon:"🔴",  tags:["GI","surgical","GYN"],          sections:["CC","HPI","ROS","PE","MDM","Dispo"],   description:"Acute abdomen evaluation with surgical and GI differentials" },
  { id:"t_altered_ms",    title:"Altered Mental Status",specialty:"Emergency",   type:"ED Visit",      icon:"🧠",  tags:["neuro","tox","metabolic"],      sections:["CC","HPI","ROS","PE","Neuro","MDM"],   description:"AMS workup covering structural, metabolic, toxic etiologies" },
  { id:"t_trauma",        title:"Trauma Assessment",   specialty:"Emergency",    type:"ED Visit",      icon:"🚑",  tags:["trauma","FAST","primary survey"],sections:["Mechanism","Primary","Secondary","MDM"], description:"Primary and secondary survey with FAST exam documentation" },
  { id:"t_sepsis",        title:"Sepsis / Infection",  specialty:"Emergency",    type:"ED Visit",      icon:"🦠",  tags:["sepsis","infection","SIRS"],    sections:["CC","HPI","ROS","PE","MDM","Dispo"],   description:"Sepsis-3 criteria with Hour-1 Bundle checklist" },
  // General
  { id:"t_general_ed",    title:"General ED Visit",    specialty:"Emergency",    type:"ED Visit",      icon:"⚕️",  tags:["general","undifferentiated"],   sections:["CC","HPI","ROS","PE","MDM","Dispo"],   description:"General emergency department encounter template" },
  { id:"t_progress",      title:"Progress Note",       specialty:"Hospitalist",  type:"Progress Note", icon:"📈",  tags:["daily","inpatient"],            sections:["Interval","Assessment","Plan"],        description:"Daily inpatient progress note with problem-based plan" },
  { id:"t_discharge",     title:"Discharge Summary",   specialty:"Hospitalist",  type:"Discharge",     icon:"🏠",  tags:["discharge","instructions"],    sections:["Diagnosis","Summary","Instructions"],  description:"Complete discharge with follow-up and return precautions" },
  { id:"t_consult",       title:"Consult Note",        specialty:"General",      type:"Consult",       icon:"📞",  tags:["consult","referral"],           sections:["Reason","History","Exam","Recs"],      description:"Specialist consultation response template" },
  { id:"t_procedure",     title:"Procedure Note",      specialty:"Emergency",    type:"Procedure",     icon:"🔧",  tags:["procedure","consent","technique"],sections:["Indication","Consent","Technique","Complications"], description:"Bedside procedure documentation with informed consent" },
  // Pediatrics
  { id:"t_peds_fever",    title:"Pediatric Fever",     specialty:"Pediatrics",   type:"ED Visit",      icon:"🌡️",  tags:["pediatric","fever","sepsis"],   sections:["CC","HPI","ROS","PE","MDM","Dispo"],   description:"Pediatric fever evaluation with age-based risk stratification" },
  { id:"t_peds_resp",     title:"Pediatric Respiratory",specialty:"Pediatrics",  type:"ED Visit",      icon:"💨",  tags:["pediatric","respiratory","asthma"],sections:["CC","HPI","ROS","PE","MDM","Dispo"], description:"Pediatric respiratory distress including asthma, croup, bronchiolitis" },
  // Specialty
  { id:"t_stroke",        title:"Stroke / TIA",        specialty:"Neurology",    type:"ED Visit",      icon:"⚡",  tags:["stroke","TIA","NIH","tPA"],     sections:["CC","HPI","NIH","PE","Neuro","MDM"],   description:"Stroke protocol with NIH stroke scale and tPA eligibility" },
  { id:"t_mi",            title:"STEMI / NSTEMI",      specialty:"Cardiology",   type:"ED Visit",      icon:"💔",  tags:["ACS","STEMI","cath"],           sections:["CC","HPI","ECG","PE","MDM","Dispo"],   description:"Acute coronary syndrome with cath lab activation criteria" },
  { id:"t_ob",            title:"OB / Pregnancy",      specialty:"OB-GYN",       type:"ED Visit",      icon:"🤰",  tags:["OB","pregnancy","ectopic"],     sections:["CC","HPI","OB Hx","ROS","PE","MDM"],  description:"Pregnancy-related complaint with trimester-specific evaluation" },
];

const SPECIALTIES = ["All","Emergency","Hospitalist","Pediatrics","Neurology","Cardiology","OB-GYN","General"];
const NOTE_TYPES  = ["All","ED Visit","Progress Note","Discharge","Consult","Procedure"];

// ── HPI/note structure sections ────────────────────────────────────
const DETAILED_SECTIONS = [
  { id:"cc",        label:"Chief Complaint",      icon:"💬", placeholder:"Primary reason for visit..." },
  { id:"hpi",       label:"History of Present Illness", icon:"📖", placeholder:"OLDCARTS — onset, location, duration, character, aggravating/alleviating factors, radiation, timing, severity...", rows:5 },
  { id:"pmh",       label:"Past Medical History", icon:"📚", placeholder:"Significant medical history, prior surgeries, hospitalizations..." },
  { id:"meds",      label:"Medications",          icon:"💊", placeholder:"Current medications with doses..." },
  { id:"allergies", label:"Allergies",            icon:"⚠️", placeholder:"Drug, food, and environmental allergies..." },
  { id:"ros",       label:"Review of Systems",    icon:"🔍", placeholder:"Pertinent positive and negative findings by system...", rows:4 },
  { id:"pe",        label:"Physical Examination", icon:"🩺", placeholder:"Vital signs, general appearance, systems examined...", rows:5 },
  { id:"mdm",       label:"Medical Decision Making", icon:"🧩", placeholder:"Assessment, differential diagnosis, complexity of data reviewed...", rows:4 },
  { id:"plan",      label:"Treatment Plan",       icon:"📋", placeholder:"Ordered tests, treatments, medications, procedures...", rows:4 },
  { id:"dispo",     label:"Disposition",          icon:"🏥", placeholder:"Discharge, admit, observation, follow-up..." },
];

// ── Shared UI ──────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".1em", marginBottom:5 }}>
    {children}
  </div>
);

const inputS = {
  width:"100%", background:C.edge, border:`1px solid ${C.border}`, borderRadius:9,
  padding:"9px 12px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
};

function Card({ title, icon, badge, badgeColor=C.teal, children, style={} }) {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", ...style }}>
      <div style={{ padding:"9px 14px", background:"rgba(0,0,0,.2)", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
        {icon && <span style={{ fontSize:13 }}>{icon}</span>}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.dim, letterSpacing:".1em", flex:1 }}>{title}</span>
        {badge && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:7, background:`${badgeColor}18`, border:`1px solid ${badgeColor}44`, color:badgeColor }}>{badge}</span>}
      </div>
      <div style={{ padding:"14px" }}>{children}</div>
    </div>
  );
}

// ── Live Transcription component ───────────────────────────────────
function LiveTranscription({ onComplete }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [structuredNote, setStructuredNote] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [amplitude, setAmplitude] = useState([]);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  // Visualizer bars
  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => {
        setAmplitude(Array.from({ length: 28 }, () => Math.random() * 0.85 + 0.1));
      }, 80);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      if (!recording) setAmplitude([]);
    }
    return () => { clearInterval(intervalRef.current); clearInterval(timerRef.current); };
  }, [recording]);

  const startRecording = () => {
    setRecording(true);
    setTranscript("");
    transcriptRef.current = "";
    setStructuredNote(null);
    setElapsed(0);

    // Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      recognitionRef.current = rec;

      let finalText = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript;
        }
        const full = finalText + interim;
        transcriptRef.current = full;
        setTranscript(full);
      };
      rec.onerror = () => toast.error("Microphone access error. Check browser permissions.");
      rec.start();
    } else {
      toast.error("Speech recognition not supported in this browser. Use Chrome.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recognitionRef.current?.stop();
  };

  const processWithAI = async () => {
    const text = transcriptRef.current || transcript;
    if (!text.trim()) { toast.error("No transcript to process."); return; }
    setAiProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a medical scribe for emergency medicine. A clinician has dictated a patient encounter.

DICTATION:
"${text}"

Convert this into a structured clinical note in JSON:
{
  "patient_name": "string or null",
  "chief_complaint": "concise CC",
  "hpi": "full HPI paragraph in medical style",
  "pmh": "past medical history extracted",
  "medications": "medications extracted",
  "allergies": "allergies extracted or NKDA",
  "ros": "review of systems — pertinent positives and negatives",
  "physical_exam": "physical exam findings",
  "assessment": "clinical assessment and differential diagnosis",
  "plan": "treatment plan ordered",
  "disposition": "disposition if mentioned",
  "note_type": "ED Visit|Progress Note|Consult|Procedure Note|Discharge",
  "suggested_title": "concise note title",
  "confidence": "high|moderate|low"
}

Fill only what was mentioned. Leave blank if not dictated.`,
        response_json_schema: {
          type:"object",
          properties:{
            chief_complaint:{type:"string"}, hpi:{type:"string"},
            pmh:{type:"string"}, medications:{type:"string"}, allergies:{type:"string"},
            ros:{type:"string"}, physical_exam:{type:"string"}, assessment:{type:"string"},
            plan:{type:"string"}, disposition:{type:"string"}, note_type:{type:"string"},
            suggested_title:{type:"string"}, confidence:{type:"string"}, patient_name:{type:"string"},
          }
        },
      });
      setStructuredNote(result);
    } catch(err) {
      toast.error("AI processing failed: " + err.message);
    } finally {
      setAiProcessing(false);
    }
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, height:"100%", overflowY:"auto", padding:"2px 0" }}>
      {/* Recorder */}
      <Card title="AMBIENT ENCOUNTER CAPTURE" icon="🎙️" badge={recording ? "● RECORDING" : "READY"} badgeColor={recording ? C.red : C.green}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>

          {/* Visualizer */}
          <div style={{ width:"100%", height:60, display:"flex", alignItems:"center", justifyContent:"center", gap:2, background:"rgba(0,0,0,.2)", borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
            {recording ? (
              amplitude.map((a,i) => (
                <div key={i} style={{ width:4, borderRadius:2, background:`linear-gradient(to top,${C.teal}88,${C.teal})`, height:`${a * 52}px`, transition:"height .08s", flexShrink:0 }} />
              ))
            ) : (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted }}>
                {transcript ? "Recording complete" : "Press record to begin"}
              </span>
            )}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {!recording ? (
              <button onClick={startRecording} style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg,${C.red},#e0404f)`, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:`0 0 0 4px ${C.red}22` }}>🎙️</button>
            ) : (
              <button onClick={stopRecording} style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg,${C.amber},#e09010)`, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, animation:"pulse 1s infinite", boxShadow:`0 0 0 6px ${C.red}30` }}>⏹</button>
            )}
            {recording && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:C.red }}>{fmt(elapsed)}</span>}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, textAlign:"center" }}>
            {recording ? "Speak naturally — Notrya is listening" : "Records patient encounter in real time"}
          </div>
        </div>
      </Card>

      {/* Live Transcript */}
      {(transcript || recording) && (
        <Card title="LIVE TRANSCRIPT" icon="📝" badge={recording?"LIVE":""} badgeColor={C.red}>
          <div style={{ maxHeight:200, overflowY:"auto", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text, lineHeight:1.75, padding:"2px 0" }}>
            {transcript || <span style={{ color:C.muted }}>Listening…</span>}
          </div>
          {!recording && transcript && !structuredNote && (
            <button onClick={processWithAI} disabled={aiProcessing} style={{ marginTop:12, width:"100%", padding:"9px", borderRadius:10, fontWeight:700, fontSize:12, cursor:aiProcessing?"wait":"pointer", border:"none", background:`linear-gradient(135deg,${C.purple},#7c52ee)`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              {aiProcessing
                ? <><div style={{ width:13, height:13, border:"2px solid #ffffff44", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .6s linear infinite" }} />Structuring Note…</>
                : "✦ Structure with AI →"
              }
            </button>
          )}
        </Card>
      )}

      {/* Structured result */}
      {structuredNote && (
        <Card title="✦ AI-STRUCTURED NOTE" icon="🧩" badge={`CONFIDENCE: ${(structuredNote.confidence||"").toUpperCase()}`} badgeColor={structuredNote.confidence==="high"?C.green:C.amber}>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {[
              { k:"chief_complaint",  lbl:"CHIEF COMPLAINT"  },
              { k:"hpi",              lbl:"HPI"               },
              { k:"physical_exam",    lbl:"PHYSICAL EXAM"     },
              { k:"assessment",       lbl:"ASSESSMENT"        },
              { k:"plan",             lbl:"PLAN"              },
              { k:"disposition",      lbl:"DISPOSITION"       },
            ].map(f => structuredNote[f.k] ? (
              <div key={f.k}>
                <Label>{f.lbl}</Label>
                <div style={{ fontSize:12, color:C.text, lineHeight:1.65, background:C.edge, borderRadius:8, padding:"8px 10px", border:`1px solid ${C.border}` }}>{structuredNote[f.k]}</div>
              </div>
            ) : null)}
            <button onClick={() => onComplete({ type:"transcription", data:structuredNote, raw:transcript })} style={{ marginTop:4, padding:"9px", borderRadius:11, fontWeight:700, fontSize:13, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy, display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              Open in Note Studio →
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function NoteCreationHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clock, setClock] = useState("");

  // ── Mode: hub | templates | transcription | detailed ──────────
  const [mode, setMode] = useState("hub");
  const [prevMode, setPrevMode] = useState(null);

  // ── Patient context ────────────────────────────────────────────
  const [patient, setPatient] = useState({ name:"", age:"", sex:"Male", mrn:"", cc:"" });

  // ── Template state ─────────────────────────────────────────────
  const [templateSearch, setTemplateSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // ── Detailed note state ────────────────────────────────────────
  const [detailedNote, setDetailedNote] = useState({});
  const [activeSection, setActiveSection] = useState("cc");
  const [aiAssisting, setAiAssisting] = useState(null);

  // ── Recent drafts (mock) ───────────────────────────────────────
  const RECENT = [
    { id:"d1", title:"Chest Pain — Jane Doe",   type:"ED Visit",     time:"15 min ago",  status:"draft", icon:"❤️"  },
    { id:"d2", title:"Abdominal Pain — M. Webb",type:"ED Visit",     time:"1 hr ago",    status:"draft", icon:"🔴"  },
    { id:"d3", title:"Progress Note — P. Nair",  type:"Progress Note",time:"3 hr ago",   status:"signed",icon:"📈" },
    { id:"d4", title:"Discharge — T. Kerrigan",  type:"Discharge",   time:"Yesterday",   status:"signed",icon:"🏠"  },
  ];

  // ── Clock ──────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(()=>setClock(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false})),1000);
    return ()=>clearInterval(iv);
  },[]);

  const goMode = (m) => { setPrevMode(mode); setMode(m); };

  // ── Filtered templates ─────────────────────────────────────────
  const filteredTemplates = TEMPLATES.filter(t => {
    const q = templateSearch.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.tags.some(tag=>tag.includes(q)) || t.specialty.toLowerCase().includes(q);
    const matchS = filterSpec === "All" || t.specialty === filterSpec;
    const matchT = filterType === "All" || t.type === filterType;
    return matchQ && matchS && matchT;
  });

  // ── AI section assist ──────────────────────────────────────────
  const aiAssist = async (sectionId) => {
    const context = Object.entries(detailedNote).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join("\n");
    if (!context.trim() && sectionId !== "hpi") { toast.error("Add some context first."); return; }
    setAiAssisting(sectionId);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical documentation assistant.

Current note content:
${context}

Generate professional, concise clinical text for the "${sectionId}" section of an emergency medicine note.
Return ONLY the text for that section — no labels, no JSON, no explanations.
Write in formal clinical documentation style.`,
      });
      const text = typeof result === "string" ? result : result?.content || result?.text || JSON.stringify(result);
      setDetailedNote(p => ({ ...p, [sectionId]: text.trim() }));
    } catch(err) {
      toast.error("AI assist failed.");
    } finally {
      setAiAssisting(null);
    }
  };

  // ── Launch note in Studio ──────────────────────────────────────
  const launchInStudio = async (noteData) => {
    try {
      const payload = {
        chief_complaint: noteData.cc || noteData.chief_complaint || patient.cc || "",
        hpi:             noteData.hpi || "",
        physical_exam:   noteData.pe || noteData.physical_exam || "",
        assessment:      noteData.assessment || "",
        mdm:             noteData.mdm || "",
        treatment_plan:  noteData.plan || "",
        disposition:     noteData.dispo || noteData.disposition || "",
        review_of_systems: noteData.ros || "",
        pmh:             noteData.pmh || "",
        medications:     noteData.meds || noteData.medications || "",
        allergies:       noteData.allergies || "NKDA",
        status:          "draft",
        note_type:       noteData.note_type || "ED Visit",
        template_id:     noteData.template_id || null,
        patient_name:    noteData.patient_name || patient.name || "",
      };
      const created = await base44.entities.ClinicalNote.create(payload);
      queryClient.invalidateQueries({ queryKey:["clinicalNotes"] });
      toast.success("Note created — opening Studio");
      navigate(`${createPageUrl("ClinicalNoteStudio")}?noteId=${created.id}`);
    } catch(err) {
      toast.error("Failed to create note: " + err.message);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER MODES
  // ────────────────────────────────────────────────────────────────

  // ── HUB ──────────────────────────────────────────────────────
  const renderHub = () => (
    <motion.div key="hub" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}} style={{ flex:1, overflowY:"auto", padding:"20px 24px", backgroundColor:C.navy }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Hero */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:C.bright, letterSpacing:"-.03em", lineHeight:1.1, marginBottom:8 }}>
            How would you like to <span style={{ background:`linear-gradient(135deg,${C.teal},${C.blue})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>create this note?</span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.dim, lineHeight:1.7 }}>
            Choose your workflow — all paths deliver a fully structured note to Clinical Studio.
          </div>
        </div>

        {/* Three main mode cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
          {[

            {
              mode:"transcription",
              icon:"🎙️",
              color:C.rose,
              title:"Live Transcription",
              subtitle:"Dictate the encounter naturally",
              description:"Speak freely with your patient. Notrya AI listens in real time, then instantly structures everything into a complete clinical note.",
              bullets:["Real-time ambient capture","AI-powered structuring","SOAP auto-format"],
              badge:"AI-powered",
            },
            {
              mode:"studio",
              icon:"📝",
              color:C.purple,
              title:"Detailed Note",
              subtitle:"Full clinical note editor",
              description:"Complete note editing environment with tabbed workflow, AI assistance, and comprehensive documentation tools.",
              bullets:["Tabbed SOAP workflow","AI-powered analysis","Full clinical toolkit"],
              badge:"Studio",
            },
            {
              mode:"templates",
              icon:"📋",
              color:C.blue,
              title:"Note Templates",
              subtitle:"Start with proven structure",
              description:"Choose from specialty-specific templates with pre-configured sections, workflows, and documentation requirements.",
              bullets:["40+ clinical templates","Specialty-optimized","Instant customization"],
              badge:"Library",
            },
          ].map(m => (
            <motion.div
              key={m.mode}
              whileHover={{ y:-3, boxShadow:`0 12px 40px ${m.color}18` }}
              onClick={() => m.mode === "studio" ? launchInStudio({}) : goMode(m.mode)}
              style={{
                background:C.panel, border:`1px solid ${C.border}`, borderRadius:18, overflow:"hidden",
                cursor:"pointer", transition:"all .18s", position:"relative",
              }}
            >
              {/* Color accent top */}
              <div style={{ height:3, background:`linear-gradient(90deg,${m.color},${m.color}44)` }} />
              <div style={{ padding:"22px 20px 20px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`${m.color}12`, border:`1px solid ${m.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                    {m.icon}
                  </div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"3px 9px", borderRadius:8, background:`${m.color}14`, border:`1px solid ${m.color}35`, color:m.color }}>{m.badge}</span>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright, marginBottom:3, letterSpacing:"-.02em" }}>{m.title}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:m.color, marginBottom:12, letterSpacing:".06em" }}>{m.subtitle.toUpperCase()}</div>
                <div style={{ fontSize:12, color:C.dim, lineHeight:1.75, marginBottom:16 }}>{m.description}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {m.bullets.map((b,i) => (
                    <div key={i} style={{ display:"flex", gap:7, alignItems:"center" }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:m.color, flexShrink:0 }} />
                      <span style={{ fontSize:11, color:C.text }}>{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:18, display:"flex", justifyContent:"flex-end" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:9, background:`${m.color}12`, border:`1px solid ${m.color}35`, fontSize:12, fontWeight:700, color:m.color }}>
                    Select <span style={{ fontSize:14 }}>→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent drafts */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card title="RECENT DRAFTS" icon="⏱️" badge={`${RECENT.filter(d=>d.status==="draft").length} UNSAVED`} badgeColor={C.amber}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {RECENT.map((d,i) => (
                <div key={i} onClick={()=>navigate(`${createPageUrl("ClinicalNoteStudio")}?noteId=${d.id}`)} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 10px", borderRadius:10, background:C.edge, border:`1px solid ${C.border}`, cursor:"pointer", transition:"all .12s" }}>
                  <div style={{ fontSize:18 }}>{d.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.bright, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.title}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:2 }}>{d.type} · {d.time}</div>
                  </div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:6, background:d.status==="signed"?"rgba(46,204,113,.1)":"rgba(245,166,35,.1)", border:`1px solid ${d.status==="signed"?"rgba(46,204,113,.3)":"rgba(245,166,35,.3)"}`, color:d.status==="signed"?C.green:C.amber, flexShrink:0 }}>
                    {d.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick start */}
          <Card title="QUICK START" icon="⚡" badge="COMMON" badgeColor={C.blue}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {TEMPLATES.slice(0,6).map(t => (
                <div key={t.id} onClick={() => { setSelectedTemplate(t); goMode("templates"); }} style={{ display:"flex", gap:9, alignItems:"center", padding:"8px 10px", borderRadius:10, background:C.edge, border:`1px solid ${C.border}`, cursor:"pointer", transition:"all .12s" }}>
                  <span style={{ fontSize:16 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.bright }}>{t.title}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{t.specialty}</div>
                  </div>
                  <span style={{ fontSize:10, color:C.muted }}>→</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );

  // ── TEMPLATES ────────────────────────────────────────────────
  const renderTemplates = () => (
    <motion.div key="templates" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:.18}} style={{ flex:1, display:"flex", overflow:"hidden" }}>

      {/* Template list */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Filters */}
        <div style={{ padding:"12px 18px", background:C.slate, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", gap:9, alignItems:"center", marginBottom:10 }}>
            <input value={templateSearch} onChange={e=>setTemplateSearch(e.target.value)} placeholder="Search templates…" style={{ ...inputS, background:C.edge, flex:1, fontSize:12 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, flexShrink:0 }}>{filteredTemplates.length} results</span>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {SPECIALTIES.map(s => (
              <button key={s} onClick={()=>setFilterSpec(s)} style={{ padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", letterSpacing:".06em", background: filterSpec===s?"rgba(0,212,188,.15)":"transparent", border:`1px solid ${filterSpec===s?"rgba(0,212,188,.4)":C.border}`, color:filterSpec===s?C.teal:C.dim }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
            {filteredTemplates.map(t => {
              const isSelected = selectedTemplate?.id === t.id;
              return (
                <motion.div
                  key={t.id}
                  layout
                  whileHover={{ y:-2 }}
                  onClick={() => setSelectedTemplate(t)}
                  style={{
                    background: isSelected ? "rgba(0,212,188,.06)" : C.panel,
                    border:`1px solid ${isSelected ? "rgba(0,212,188,.45)" : C.border}`,
                    borderRadius:13, padding:"14px", cursor:"pointer", transition:"all .15s",
                  }}
                >
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ fontSize:24 }}>{t.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:isSelected?C.teal:C.bright, marginBottom:2 }}>{t.title}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.dim }}>{t.specialty} · {t.type}</div>
                    </div>
                    {isSelected && <div style={{ width:16, height:16, borderRadius:"50%", background:C.teal, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span style={{ fontSize:9, color:C.navy, fontWeight:700 }}>✓</span></div>}
                  </div>
                  <div style={{ fontSize:11, color:C.dim, lineHeight:1.6, marginBottom:9 }}>{t.description}</div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {t.tags.slice(0,3).map(tag => (
                      <span key={tag} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, padding:"2px 6px", borderRadius:5, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.2)", color:C.blue }}>{tag}</span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div style={{ width:280, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", background:C.panel, overflow:"hidden" }}>
        <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, background:"rgba(0,0,0,.2)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.dim, letterSpacing:".1em" }}>TEMPLATE PREVIEW</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>
          {!selectedTemplate ? (
            <div style={{ textAlign:"center", padding:"28px 14px", color:C.muted }}>
              <div style={{ fontSize:30, marginBottom:10, opacity:.2 }}>📋</div>
              <div style={{ fontSize:11 }}>Select a template to preview</div>
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:30 }}>{selectedTemplate.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:C.bright }}>{selectedTemplate.title}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{selectedTemplate.specialty}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:C.dim, lineHeight:1.7, marginBottom:14 }}>{selectedTemplate.description}</div>

              <div style={{ marginBottom:12 }}>
                <Label>INCLUDED SECTIONS</Label>
                {selectedTemplate.sections.map(s => (
                  <div key={s} style={{ display:"flex", gap:6, alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${C.edge}` }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:C.teal, flexShrink:0 }} />
                    <span style={{ fontSize:11, color:C.text }}>{s}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:14 }}>
                <Label>TAGS</Label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {selectedTemplate.tags.map(tag => (
                    <span key={tag} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:"2px 8px", borderRadius:6, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.2)", color:C.blue }}>{tag}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => launchInStudio({ note_type: selectedTemplate.type, template_id: selectedTemplate.id, patient_name: patient.name })}
                style={{ width:"100%", padding:"10px", borderRadius:11, fontWeight:700, fontSize:13, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy, display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:7 }}
              >
                Use Template →
              </button>
              <button onClick={()=>setSelectedTemplate(null)} style={{ width:"100%", padding:"7px", borderRadius:9, fontWeight:600, fontSize:11, cursor:"pointer", background:"transparent", border:`1px solid ${C.border}`, color:C.dim }}>
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // ── TRANSCRIPTION ────────────────────────────────────────────
  const renderTranscription = () => (
    <motion.div key="transcription" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:.18}} style={{ flex:1, overflowY:"auto", padding:"20px 24px", backgroundColor:C.navy }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:C.bright, letterSpacing:"-.02em", marginBottom:5 }}>Live Transcription</div>
          <div style={{ fontSize:12, color:C.dim }}>Speak naturally — Notrya will listen and structure your note automatically using AI.</div>
        </div>
        <LiveTranscription onComplete={(result) => launchInStudio(result.data || {})} />
      </div>
    </motion.div>
  );

  // ── DETAILED ─────────────────────────────────────────────────
  const renderDetailed = () => {
    const activeSec = DETAILED_SECTIONS.find(s=>s.id===activeSection);
    const completed = DETAILED_SECTIONS.filter(s=>detailedNote[s.id]?.trim()).length;

    return (
      <motion.div key="detailed" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:.18}} style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Section nav */}
        <div style={{ width:200, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".1em", marginBottom:5 }}>NOTE SECTIONS</div>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ flex:1, height:4, borderRadius:2, background:C.edge, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg,${C.teal},${C.blue})`, width:`${(completed/DETAILED_SECTIONS.length)*100}%`, transition:"width .3s" }} />
              </div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{completed}/{DETAILED_SECTIONS.length}</span>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"7px" }}>
            {DETAILED_SECTIONS.map(sec => {
              const isActive = activeSection === sec.id;
              const isDone = !!detailedNote[sec.id]?.trim();
              return (
                <div key={sec.id} onClick={()=>setActiveSection(sec.id)} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 9px", borderRadius:9, cursor:"pointer", marginBottom:2, background:isActive?"rgba(155,109,255,.1)":"transparent", border:`1px solid ${isActive?"rgba(155,109,255,.3)":"transparent"}`, transition:"all .12s" }}>
                  <span style={{ fontSize:13 }}>{sec.icon}</span>
                  <span style={{ fontSize:11, fontWeight:500, color:isActive?C.indigo:C.text, flex:1 }}>{sec.label}</span>
                  {isDone && <div style={{ width:6, height:6, borderRadius:"50%", background:C.teal, flexShrink:0 }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Section header */}
          <div style={{ padding:"12px 20px", background:C.slate, borderBottom:`1px solid ${C.border}`, flexShrink:0, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>{activeSec?.icon}</span>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.bright }}>{activeSec?.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:1 }}>Section {DETAILED_SECTIONS.findIndex(s=>s.id===activeSection)+1} of {DETAILED_SECTIONS.length}</div>
            </div>
            <div style={{ flex:1 }} />
            <button
              onClick={() => aiAssist(activeSection)}
              disabled={!!aiAssisting}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, fontSize:11, fontWeight:700, cursor:aiAssisting?"wait":"pointer", border:"1px solid rgba(155,109,255,.35)", background:"rgba(155,109,255,.1)", color:C.purple }}
            >
              {aiAssisting === activeSection
                ? <><div style={{ width:10,height:10,border:`2px solid ${C.purple}44`,borderTopColor:C.purple,borderRadius:"50%",animation:"spin .6s linear infinite" }}/>Writing…</>
                : "✦ AI Assist"
              }
            </button>
          </div>

          {/* Text area */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <textarea
              key={activeSection}
              value={detailedNote[activeSection] || ""}
              onChange={e => setDetailedNote(p=>({...p,[activeSection]:e.target.value}))}
              placeholder={activeSec?.placeholder}
              style={{
                flex:1, resize:"none", padding:"20px 22px",
                background:C.navy, border:"none", outline:"none",
                color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13,
                lineHeight:1.85, width:"100%",
              }}
            />
          </div>

          {/* Prev / Next / Finish */}
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, background:C.slate, flexShrink:0, display:"flex", gap:9, alignItems:"center" }}>
            <button
              onClick={()=>{
                const idx=DETAILED_SECTIONS.findIndex(s=>s.id===activeSection);
                if(idx>0) setActiveSection(DETAILED_SECTIONS[idx-1].id);
              }}
              disabled={DETAILED_SECTIONS[0].id===activeSection}
              style={{ padding:"7px 16px", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", background:C.edge, border:`1px solid ${C.border}`, color:C.dim, opacity:DETAILED_SECTIONS[0].id===activeSection?.5:1 }}
            >← Back</button>
            <div style={{ flex:1, textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>
              {Object.values(detailedNote).filter(v=>v?.trim()).length} / {DETAILED_SECTIONS.length} sections filled
            </div>
            {DETAILED_SECTIONS[DETAILED_SECTIONS.length-1].id !== activeSection ? (
              <button
                onClick={()=>{
                  const idx=DETAILED_SECTIONS.findIndex(s=>s.id===activeSection);
                  setActiveSection(DETAILED_SECTIONS[idx+1].id);
                }}
                style={{ padding:"7px 16px", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", background:`linear-gradient(135deg,${C.purple},#7c52ee)`, border:"none", color:"#fff" }}
              >Next →</button>
            ) : (
              <button
                onClick={() => launchInStudio(detailedNote)}
                style={{ padding:"8px 20px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy, display:"flex", alignItems:"center", gap:7 }}
              >Open in Studio →</button>
            )}
          </div>
        </div>

        {/* Right: Note preview */}
        <div style={{ width:248, background:C.panel, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, background:"rgba(0,0,0,.18)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.dim, letterSpacing:".1em" }}>NOTE PREVIEW</div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
            {DETAILED_SECTIONS.map(sec => {
              const val = detailedNote[sec.id];
              if (!val?.trim()) return null;
              return (
                <div key={sec.id} onClick={()=>setActiveSection(sec.id)} style={{ marginBottom:12, cursor:"pointer" }}>
                  <div style={{ display:"flex", gap:5, alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:10 }}>{sec.icon}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:C.teal, letterSpacing:".1em" }}>{sec.label.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:10, color:C.dim, lineHeight:1.6, background:C.edge, borderRadius:7, padding:"6px 8px", border:`1px solid ${C.border}`, maxHeight:70, overflow:"hidden", position:"relative" }}>
                    {val}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:20, background:`linear-gradient(transparent,${C.edge})` }} />
                  </div>
                </div>
              );
            })}
            {Object.values(detailedNote).every(v=>!v?.trim()) && (
              <div style={{ textAlign:"center", padding:"20px 10px", color:C.muted, fontSize:11 }}>
                Your note will appear here as you fill in sections.
              </div>
            )}
          </div>
          {completed > 0 && (
            <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}` }}>
              <button onClick={()=>launchInStudio(detailedNote)} style={{ width:"100%", padding:"8px", borderRadius:10, fontWeight:700, fontSize:12, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy }}>
                Open in Studio →
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.navy, height:"100vh", color:C.text, display:"flex", flexDirection:"column", overflow:"hidden", position:"fixed", top:0, left:72, right:0, bottom:0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input,textarea,select{transition:border-color .15s}
        input:focus,textarea:focus,select:focus{border-color:#4a7299 !important;outline:none}
        input::placeholder,textarea::placeholder{color:#2a4d72}
        select option{background:#0b1d35}
        button:hover{filter:brightness(1.08)}
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav style={{ position:"fixed", top:0, left:72, right:0, height:52, background:"rgba(11,29,53,.97)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0, zIndex:100 }}>
        <span onClick={()=>navigate(createPageUrl("Home"))} style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:C.bright, cursor:"pointer", letterSpacing:"-.02em" }}>Notrya</span>
        <div style={{ width:1, height:16, background:C.border }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal, letterSpacing:".12em" }}>NOTE CREATION</span>

        {/* Mode tabs */}
        <div style={{ display:"flex", gap:2, marginLeft:8 }}>
          {[
            { id:"hub",           label:"⊞ Hub"          },
            { id:"transcription", label:"🎙️ Transcription" },
            { id:"templates",     label:"📋 Templates"   },
          ].map(m => (
            <button key={m.id} onClick={()=>goMode(m.id)} style={{
              padding:"4px 12px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", letterSpacing:".04em",
              background: mode===m.id ? "rgba(0,212,188,.12)":"transparent",
              border: `1px solid ${mode===m.id ? "rgba(0,212,188,.4)":"transparent"}`,
              color: mode===m.id ? C.teal : C.dim,
              transition:"all .15s",
            }}>{m.label}</button>
          ))}
        </div>

        <div style={{ flex:1 }} />

        {/* Patient context pill */}
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <input value={patient.name} onChange={e=>setPatient(p=>({...p,name:e.target.value}))} placeholder="Patient name (optional)" style={{ ...inputS, width:180, fontSize:11, padding:"5px 10px", background:C.edge }} />
          <input value={patient.age} onChange={e=>setPatient(p=>({...p,age:e.target.value}))} placeholder="Age" style={{ ...inputS, width:52, fontSize:11, padding:"5px 8px", background:C.edge }} />
          <select value={patient.sex} onChange={e=>setPatient(p=>({...p,sex:e.target.value}))} style={{ ...inputS, width:78, fontSize:11, padding:"5px 8px", background:C.edge, cursor:"pointer" }}>
            {["Male","Female","Other"].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ width:1, height:16, background:C.border }} />

        {/* App nav */}
        {[
          { label:"📝 Studio",     page:"ClinicalNoteStudio",    c:C.teal   },
          { label:"🧬 Drugs",      page:"DrugsAndBugs",          c:C.green  },
          { label:"🔬 Stewardship",page:"DiagnosticStewardship", c:C.blue   },
        ].map(p => (
          <button key={p.page} onClick={()=>navigate(createPageUrl(p.page))} style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${p.c}44`, background:`${p.c}0e`, color:p.c }}>
            {p.label}
          </button>
        ))}

        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim }}>{clock}</span>
      </nav>

      {/* ── Content ──────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", backgroundColor:C.navy, marginTop:52 }}>
        <AnimatePresence mode="wait">
          {mode === "hub"           && renderHub()}
          {mode === "templates"     && renderTemplates()}
          {mode === "transcription" && renderTranscription()}
          {mode === "detailed"      && renderDetailed()}
        </AnimatePresence>
      </div>
    </div>
  );
}