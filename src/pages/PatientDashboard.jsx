import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RotateCw, ChevronDown } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { createPageUrl } from "../utils";
import LabsImagingAIReview from "../components/notes/LabsImagingAIReview";
import QuickDrugDosingCalculator from "../components/calculators/QuickDrugDosingCalculator";
import PatientSearchBar from "../components/search/PatientSearchBar";

// ── Design System ─────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dash-fonts")) return;
  const l = document.createElement("link");
  l.id = "dash-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dash-css";
  s.textContent = `
    *{box-sizing:border-box;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .dash-fade{animation:fadeSlide .2s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#00d4bc 52%,#9b6dff 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .spin{animation:spin 1s linear infinite;}
    .tab-btn:hover{background:rgba(0,212,188,0.08)!important;border-color:rgba(0,212,188,0.3)!important;}
    .vital-row:hover{background:rgba(0,212,188,0.05)!important;border-color:rgba(0,212,188,0.4)!important;}
    .nav-page:hover{background:rgba(0,212,188,0.08)!important;}
    .att-btn:hover{border-color:#00d4bc!important;background:rgba(0,212,188,0.05)!important;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", orange:"#ff9f43", yellow:"#f5c842", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00d4bc", coral:"#ff6b6b", rose:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.75)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:12,
};

// ── Module-Scope Primitives ───────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-10%",left:"-5%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(0,212,188,0.06) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:0,width:"40%",height:"40%",background:"radial-gradient(circle,rgba(155,109,255,0.06) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"45%",left:"40%",width:"30%",height:"30%",background:"radial-gradient(circle,rgba(59,158,255,0.04) 0%,transparent 70%)"}}/>
    </div>
  );
}

function PanelHeader({ icon, label, accent, action }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:8,borderBottom:`1px solid rgba(42,79,122,0.3)`}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <span style={{fontSize:14}}>{icon}</span>
        <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:accent,textTransform:"uppercase",letterSpacing:1.5}}>{label}</span>
      </div>
      {action}
    </div>
  );
}

function StatusPill({ label, color, bg }) {
  const c = color || T.teal;
  return (
    <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,color:c,background:bg||`${c}18`,border:`1px solid ${c}44`,padding:"2px 7px",borderRadius:4,textTransform:"uppercase",letterSpacing:0.8}}>
      {label}
    </span>
  );
}

function EmptyState({ text }) {
  return <p style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,fontStyle:"italic",margin:0,padding:"8px 0"}}>{text}</p>;
}

function VitalRow({ icon, label, value }) {
  return (
    <div className="vital-row" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.up,border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,cursor:"pointer",transition:"all .15s"}}>
      <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
      <span style={{flex:1,fontFamily:"DM Sans",fontSize:11,fontWeight:500,color:T.txt}}>{label}</span>
      <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:value==="Awaiting data"?T.txt4:T.teal,fontWeight:500}}>{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function PatientDashboard() {
  const navigate = useNavigate();
  const [encounterId, setEncounterId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [clinicalSummary, setClinicalSummary] = useState(null);
  const [generatingAISummary, setGeneratingAISummary] = useState(false);
  const [selectedAttendingId, setSelectedAttendingId] = useState(null);
  const [attendingDropdownOpen, setAttendingDropdownOpen] = useState(false);
  const attendingRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEncounterId(params.get("encounterId"));
    setPatientId(params.get("patientId"));
    const currentNote = localStorage.getItem("currentOpenNote");
    if (currentNote) setNoteId(currentNote);
  }, []);

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => base44.entities.Patient.get(patientId),
    enabled: !!patientId,
  });

  const { data: encounter, refetch: refetchEncounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: () => base44.entities.Encounter.get(encounterId),
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 60000 : false,
  });

  const { data: vitals = [], refetch: refetchVitals } = useQuery({
    queryKey: ["vitals", encounterId],
    queryFn: async () => {
      const r = await base44.entities.VitalsRecord.list();
      return r.filter(v => v.encounterId === encounterId)
               .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
               .slice(0, 5);
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 60000 : false,
  });

  const { data: assessment } = useQuery({
    queryKey: ["assessment", encounterId],
    queryFn: async () => {
      const r = await base44.entities.AssessmentNote.list();
      return r.find(a => a.encounterId === encounterId);
    },
    enabled: !!encounterId,
  });

  const { data: medications = [], refetch: refetchMeds } = useQuery({
    queryKey: ["medications", encounterId],
    queryFn: async () => {
      const r = await base44.entities.MedicationAdministration.list();
      return r.filter(m => m.encounterId === encounterId)
               .sort((a, b) => new Date(b.givenAt) - new Date(a.givenAt));
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 120000 : false,
  });

  const { data: labs = [], refetch: refetchLabs } = useQuery({
    queryKey: ["labs", encounterId],
    queryFn: async () => {
      const r = await base44.entities.LabOrder.list();
      return r.filter(l => l.encounterId === encounterId)
               .sort((a, b) => new Date(a.orderedAt) - new Date(b.orderedAt));
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 120000 : false,
  });

  const { data: imaging = [], refetch: refetchImaging } = useQuery({
    queryKey: ["imaging", encounterId],
    queryFn: async () => {
      const r = await base44.entities.ImagingOrder.list();
      return r.filter(i => i.encounterId === encounterId)
               .sort((a, b) => new Date(a.orderedAt) - new Date(b.orderedAt));
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 180000 : false,
  });

  const { data: dischargeSummary } = useQuery({
    queryKey: ["dischargeSummary", encounterId],
    queryFn: async () => {
      const r = await base44.entities.DischargeSummary.list();
      return r.find(ds => ds.encounterId === encounterId);
    },
    enabled: !!encounterId,
  });

  const { data: currentNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => base44.entities.ClinicalNote.get(noteId),
    enabled: !!noteId,
  });

  const { data: hospitalSettings } = useQuery({
    queryKey: ["hospitalSettings"],
    queryFn: async () => {
      const r = await base44.entities.HospitalSettings.list();
      return r.length > 0 ? r[0] : null;
    },
  });

  const defaultAttending = hospitalSettings?.attendings?.find(a => a.id === hospitalSettings?.default_attending_id);
  const selectedAttending = hospitalSettings?.attendings?.find(a => a.id === selectedAttendingId) || defaultAttending;

  useEffect(() => {
    const handler = e => {
      if (attendingRef.current && !attendingRef.current.contains(e.target))
        setAttendingDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRefresh = async () => {
    setLastUpdated(new Date());
    await Promise.all([refetchVitals(), refetchMeds(), refetchLabs(), refetchImaging(), refetchEncounter()]);
  };

  const generateAIClinicalSummary = async () => {
    if (!currentNote) return;
    setGeneratingAISummary(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this clinical note and generate a concise clinical summary. Return a JSON object with these exact fields:
CLINICAL NOTE:
Chief Complaint: ${currentNote.chief_complaint || "Not documented"}
HPI: ${currentNote.history_of_present_illness || "Not documented"}
Physical Exam: ${JSON.stringify(currentNote.physical_exam) || "Not documented"}
Labs: ${JSON.stringify(currentNote.lab_findings) || "None"}
Imaging: ${JSON.stringify(currentNote.imaging_findings) || "None"}
Plan: ${currentNote.plan || "Not documented"}
Return JSON with: chief_complaint (1-2 sentences), hpi (2-3 sentences), key_findings (2-3 sentences), workup_summary (1-2 sentences), clinical_course (2-3 sentences)`,
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint: { type: "string" }, hpi: { type: "string" },
            key_findings: { type: "string" }, workup_summary: { type: "string" },
            clinical_course: { type: "string" },
          },
        },
      });
      setClinicalSummary(result);
    } catch (e) { console.error("AI summary failed:", e); }
    finally { setGeneratingAISummary(false); }
  };

  const minutesSinceUpdate = lastUpdated ? differenceInMinutes(new Date(), lastUpdated) : null;
  const latestVital = vitals?.[0];

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>

        {/* ── Top Navigation Bar ──────────────────────────────────── */}
        <div style={{...glass,borderRadius:0,borderLeft:"none",borderRight:"none",borderTop:"none",borderBottom:"1px solid rgba(42,79,122,0.5)",padding:"10px 16px",display:"flex",flexDirection:"column",gap:8}}>

          {/* Row 1: Breadcrumb + Patient + Search + Vitals Strip */}
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {/* Breadcrumb + patient identity */}
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0,flex:"0 0 auto"}}>
              <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(26,53,85,0.7)",borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,letterSpacing:3}}>NOTRYA</span>
                <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:9}}>/</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,letterSpacing:2}}>DASHBOARD</span>
              </div>
              {patient && (
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${T.purple},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#fff",flexShrink:0}}>
                    {patient?.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <p style={{fontFamily:"DM Sans",fontSize:12,fontWeight:700,margin:"0 0 1px 0",color:T.txt}}>{patient?.name || "Patient"}</p>
                    <p style={{fontFamily:"JetBrains Mono",fontSize:9,margin:0,color:T.txt4}}>
                      MRN: {patient?.mrn || "—"}
                      {noteId && (
                        <span onClick={() => navigate(createPageUrl(`NoteDetail?id=${noteId}`))}
                          style={{marginLeft:8,color:T.teal,cursor:"pointer",textDecoration:"underline"}}>↗ Open Note</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{flex:1,maxWidth:380}}>
              <PatientSearchBar variant="dark"/>
            </div>

            {/* Live Vitals Strip */}
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {[
                {label:"BP",    val:latestVital?.systolicBP ? `${latestVital.systolicBP}/${latestVital.diastolicBP}` : "—"},
                {label:"HR",    val:latestVital?.heartRate || "—"},
                {label:"RR",    val:latestVital?.respiratoryRate || "—"},
                {label:"TEMP",  val:latestVital?.temperature || "—"},
                {label:"SPO₂",  val:latestVital?.spo2 || "—"},
                {label:"PAIN",  val:latestVital?.painScore || "—"},
              ].map((v,i) => (
                <div key={i} style={{textAlign:"center",minWidth:48,padding:"5px 8px",background:T.up,border:"1px solid rgba(42,79,122,0.3)",borderRadius:7}}>
                  <p style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,margin:"0 0 2px 0",textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>{v.label}</p>
                  <p style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,margin:0,color:v.val==="—"?T.txt4:T.teal}}>{v.val}</p>
                </div>
              ))}
              <button onClick={handleRefresh}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:T.up,border:"1px solid rgba(42,79,122,0.3)",borderRadius:7,color:T.txt3,cursor:"pointer",fontSize:11,transition:"all .15s"}}
                title="Refresh all data">
                <RotateCw size={13} className={minutesSinceUpdate === 0 ? "spin" : ""}/>
                <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>
                  {minutesSinceUpdate !== null ? `${minutesSinceUpdate}m` : "Sync"}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Navigation Tabs */}
          <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid rgba(42,79,122,0.25)"}}>
            {[
              {icon:"✏️", label:"Note Studio",  sub:"Create & Edit",     page:"ClinicalNoteStudio"},
              {icon:"🎤", label:"Transcription",sub:"Voice to Text",     page:"LiveTranscription"},
              {icon:"📋", label:"Orders",        sub:"Orders & Protocols",page:"OrderSetBuilder"},
              {icon:"🚪", label:"Discharge",     sub:"Disposition",       page:"DischargePlanning"},
            ].map((tab, i) => (
              <div key={i} className="nav-page" onClick={() => navigate(createPageUrl(tab.page))}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:9,border:`1px solid ${i===0?"rgba(0,212,188,0.4)":"rgba(42,79,122,0.2)"}`,background:i===0?"rgba(0,212,188,0.1)":"transparent",cursor:"pointer",transition:"all .15s"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:i===0?T.teal:T.up,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>
                  {tab.icon}
                </div>
                <div>
                  <p style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,margin:"0 0 1px 0",color:i===0?T.teal:T.txt}}>{tab.label}</p>
                  <p style={{fontFamily:"JetBrains Mono",fontSize:8,margin:0,color:T.txt4}}>{tab.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Patient Strip ────────────────────────────────────────── */}
        {patient && encounter && (
          <div style={{...glass,borderRadius:0,borderLeft:"none",borderRight:"none",borderTop:"3px solid transparent",borderImage:"linear-gradient(90deg,#00d4bc,#9b6dff,#f5a623) 1",padding:"10px 16px",display:"flex",gap:14,alignItems:"center",justifyContent:"space-between"}}>
            {/* Avatar + demographics */}
            <div style={{display:"flex",gap:10,alignItems:"center",minWidth:220}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${T.purple},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,flexShrink:0}}>
                {patient?.name?.charAt(0) || "P"}
              </div>
              <div>
                <p style={{fontFamily:"DM Sans",fontSize:13,fontWeight:700,margin:"0 0 2px 0",color:T.txt}}>
                  {patient?.name}
                </p>
                <p style={{fontFamily:"JetBrains Mono",fontSize:9,margin:0,color:T.txt4}}>
                  MRN: {patient?.mrn||"—"} · Age: {patient?.age||"—"} · DOB: {patient?.dob||"—"}
                </p>
              </div>
            </div>

            {/* Vitals pills */}
            {latestVital && (
              <div style={{display:"flex",gap:5}}>
                {[
                  {label:"SBP",  val:latestVital.systolicBP||"—"},
                  {label:"DBP",  val:latestVital.diastolicBP||"—"},
                  {label:"HR",   val:latestVital.heartRate||"—"},
                  {label:"RR",   val:latestVital.respiratoryRate||"—"},
                  {label:"TEMP", val:latestVital.temperature||"—"},
                  {label:"SPO₂", val:latestVital.spo2||"—"},
                ].map((v,i) => (
                  <div key={i} style={{padding:"5px 9px",background:T.up,border:"1px solid rgba(42,79,122,0.35)",borderRadius:7,textAlign:"center",minWidth:60}}>
                    <p style={{fontFamily:"JetBrains Mono",fontSize:8,margin:"0 0 2px 0",color:T.txt4,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>{v.label}</p>
                    <p style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,margin:0,color:T.teal}}>{v.val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Allergies + Status */}
            <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
              {patient?.allergies?.length > 0 ? (
                <StatusPill label={patient.allergies[0]} color={T.red}/>
              ) : (
                <StatusPill label="NKDA" color={T.green}/>
              )}
              <StatusPill
                label={encounter?.encounterStatus?.toUpperCase()||"ACTIVE"}
                color={encounter?.encounterStatus==="active"?T.teal:T.txt3}/>
            </div>
          </div>
        )}

        {/* ── Encounter Info Bar ───────────────────────────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,padding:"8px 16px",background:T.panel,borderBottom:"1px solid rgba(42,79,122,0.3)"}}>
          {/* LOS */}
          {[
            {icon:"⏱️", label:"LENGTH OF STAY", val:"Active encounter"},
            {icon:"🔢", label:"TRIAGE / ESI",    val:"Not assigned"},
            {icon:"🚪", label:"STATUS",           val:"No disposition"},
          ].map((item,i) => (
            <div key={i} style={{...glass,padding:"10px 12px",display:"flex",gap:10,alignItems:"flex-start",borderRadius:10}}>
              <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
              <div>
                <p style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,margin:"0 0 3px 0",textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{item.label}</p>
                <p style={{fontFamily:"DM Sans",fontSize:11,color:T.txt,margin:0,fontWeight:500}}>{item.val}</p>
              </div>
            </div>
          ))}

          {/* Attending dropdown */}
          <div ref={attendingRef} style={{position:"relative"}}>
            <button className="att-btn" onClick={() => setAttendingDropdownOpen(p => !p)}
              style={{width:"100%",...glass,padding:"10px 12px",display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer",border:`1px solid ${attendingDropdownOpen?"rgba(0,212,188,0.5)":"rgba(42,79,122,0.35)"}`,borderRadius:10,transition:"all .15s"}}>
              <span style={{fontSize:16,flexShrink:0}}>👨‍⚕️</span>
              <div style={{flex:1,textAlign:"left"}}>
                <p style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,margin:"0 0 3px 0",textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>ATTENDING</p>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <p style={{fontFamily:"DM Sans",fontSize:11,color:T.txt,margin:0,fontWeight:500}}>
                    {selectedAttending?.name || "No attending selected"}
                  </p>
                  <ChevronDown size={12} style={{color:T.txt4,transform:attendingDropdownOpen?"rotate(180deg)":"none",transition:"transform .2s"}}/>
                </div>
              </div>
            </button>
            {attendingDropdownOpen && hospitalSettings?.attendings && (
              <div style={{position:"absolute",top:"calc(100% + 5px)",left:0,right:0,zIndex:200,...glass,borderRadius:10,overflow:"hidden",boxShadow:"0 12px 32px rgba(0,0,0,0.4)"}}>
                {hospitalSettings.attendings.map(a => (
                  <button key={a.id} onClick={() => {setSelectedAttendingId(a.id); setAttendingDropdownOpen(false);}}
                    style={{width:"100%",padding:"10px 14px",border:"none",background:selectedAttendingId===a.id||(!selectedAttendingId&&defaultAttending?.id===a.id)?"rgba(0,212,188,0.12)":"transparent",color:T.txt,textAlign:"left",cursor:"pointer",fontSize:11,fontFamily:"DM Sans",borderBottom:"1px solid rgba(42,79,122,0.2)",transition:"background .1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,212,188,0.08)"}
                    onMouseLeave={e=>e.currentTarget.style.background=selectedAttendingId===a.id?"rgba(0,212,188,0.12)":"transparent"}>
                    <p style={{margin:0,fontWeight:600}}>{a.name}</p>
                    <p style={{margin:"1px 0 0 0",fontSize:9,fontFamily:"JetBrains Mono",color:T.txt4}}>{a.specialty}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content Grid ────────────────────────────────────── */}
        <div style={{flex:1,overflow:"hidden",display:"flex",padding:"10px 16px 14px",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"280px 1fr 268px",gap:10,flex:1,overflow:"hidden",minHeight:0}}>

            {/* ── LEFT COLUMN ─────────────────────────────────────── */}
            <div style={{display:"flex",flexDirection:"column",gap:10,overflow:"auto"}}>

              {/* Vitals Panel */}
              <div style={{...glass,overflow:"hidden",borderLeft:`3px solid ${T.teal}`,display:"flex",flexDirection:"column"}}>
                <PanelHeader icon="📊" label="Vital Signs" accent={T.teal}
                  action={<span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>📈 {vitals.length} readings</span>}/>
                <div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {icon:"❤️",  label:"Systolic BP",  val:latestVital?.systolicBP  ? `${latestVital.systolicBP} mmHg`    : "Awaiting data"},
                    {icon:"❤️",  label:"Diastolic BP", val:latestVital?.diastolicBP ? `${latestVital.diastolicBP} mmHg`   : "Awaiting data"},
                    {icon:"🫀",  label:"Heart Rate",   val:latestVital?.heartRate   ? `${latestVital.heartRate} bpm`       : "Awaiting data"},
                    {icon:"🫁",  label:"Resp Rate",    val:latestVital?.respiratoryRate ? `${latestVital.respiratoryRate}/min` : "Awaiting data"},
                    {icon:"🌡️", label:"Temperature",  val:latestVital?.temperature  ? `${latestVital.temperature}°F`      : "Awaiting data"},
                    {icon:"💨",  label:"SpO₂",         val:latestVital?.spo2         ? `${latestVital.spo2}%`              : "Awaiting data"},
                    {icon:"😣",  label:"Pain Score",   val:latestVital?.painScore    ? `${latestVital.painScore}/10`       : "Awaiting data"},
                    {icon:"🧠",  label:"GCS",          val:latestVital?.gcs          ? `${latestVital.gcs}`                : "Awaiting data"},
                  ].map((v,i) => <VitalRow key={i} icon={v.icon} label={v.label} value={v.val}/>)}
                </div>
                <div onClick={() => noteId && navigate(createPageUrl(`NoteDetail?id=${noteId}`))}
                  style={{padding:"8px 14px",borderTop:"1px solid rgba(42,79,122,0.3)",fontFamily:"DM Sans",fontSize:10,color:noteId?T.teal:T.txt4,fontStyle:"italic",cursor:noteId?"pointer":"default"}}>
                  {noteId ? "↗ Edit vitals in note" : "No vitals recorded"}
                </div>
              </div>

              {/* Diagnoses Panel */}
              <div style={{...glass,padding:"14px 14px",borderLeft:`3px solid ${T.rose}`,flex:1}}>
                <PanelHeader icon="🧠" label="Diagnoses" accent={T.rose}
                  action={noteId && <span onClick={() => navigate(createPageUrl(`NoteDetail?id=${noteId}`))} style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,cursor:"pointer"}}>↗ Edit</span>}/>
                <div style={{marginBottom:12,paddingBottom:10,borderBottom:"1px solid rgba(42,79,122,0.25)"}}>
                  <p style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.orange,margin:"0 0 5px 0",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Initial Impression</p>
                  {assessment?.initialDiagnosis ? (
                    <>
                      <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,margin:"0 0 3px 0",fontWeight:600}}>{assessment.initialDiagnosis}</p>
                      {assessment.initialIcd10 && <p style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,margin:0}}>{assessment.initialIcd10}</p>}
                    </>
                  ) : <EmptyState text="Assessment not yet completed"/>}
                </div>
                <div>
                  <p style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.green,margin:"0 0 5px 0",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Final Diagnosis</p>
                  {dischargeSummary?.finalDiagnosis ? (
                    <>
                      <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,margin:"0 0 3px 0",fontWeight:600}}>{dischargeSummary.finalDiagnosis}</p>
                      {dischargeSummary.finalIcd10 && <p style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,margin:0}}>{dischargeSummary.finalIcd10}</p>}
                    </>
                  ) : <EmptyState text="⏳ Pending disposition"/>}
                </div>
              </div>
            </div>

            {/* ── CENTER COLUMN ────────────────────────────────────── */}
            <div style={{display:"flex",flexDirection:"column",gap:10,overflow:"auto"}}>

              {/* Clinical Summary Panel */}
              <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${T.teal}`,flex:"0 0 auto"}}>
                <PanelHeader icon="📋" label="Clinical Summary" accent={T.teal}
                  action={
                    <button onClick={generateAIClinicalSummary} disabled={generatingAISummary}
                      style={{fontFamily:"DM Sans",fontWeight:600,fontSize:9,padding:"4px 10px",background:generatingAISummary?"rgba(155,109,255,0.08)":"rgba(155,109,255,0.18)",border:`1px solid ${T.purple}44`,color:T.purple,borderRadius:6,cursor:generatingAISummary?"not-allowed":"pointer",opacity:generatingAISummary?0.6:1,transition:"all .15s"}}>
                      {generatingAISummary ? "⏳ Generating..." : "⚡ AI Refresh"}
                    </button>
                  }/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {label:"Chief Complaint", val:clinicalSummary?.chief_complaint||currentNote?.chief_complaint, icon:"☐"},
                    {label:"Brief HPI",        val:clinicalSummary?.hpi||currentNote?.history_of_present_illness, icon:"📝"},
                    {label:"Key Findings",     val:clinicalSummary?.key_findings,   icon:"🔑"},
                    {label:"Workup Summary",   val:clinicalSummary?.workup_summary||(currentNote?.lab_findings?.length>0||currentNote?.imaging_findings?.length>0?`${currentNote?.lab_findings?.length||0} labs, ${currentNote?.imaging_findings?.length||0} imaging`:null), icon:"🔬"},
                    {label:"Clinical Course",  val:clinicalSummary?.clinical_course||currentNote?.plan, icon:"📈"},
                    {label:"Current Status",   val:currentNote?.status?.toUpperCase()||"Draft",         icon:"🔴"},
                  ].map((row,i) => (
                    <div key={i} style={{padding:"9px 11px",background:T.up,border:"1px solid rgba(42,79,122,0.25)",borderRadius:8}}>
                      <p style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,margin:"0 0 4px 0",textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{row.icon} {row.label}</p>
                      <p style={{fontFamily:"DM Sans",fontSize:11,color:row.val?T.txt:T.txt4,margin:0,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",fontStyle:row.val?"normal":"italic"}}>
                        {row.val || "Not documented"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Abnormal Findings + AI Review */}
              <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${T.red}`,flex:1,overflow:"auto",minHeight:200}}>
                <PanelHeader icon="⚠️" label="Abnormal Findings & AI Review" accent={T.red}/>
                <LabsImagingAIReview
                  labs={labs||[]}
                  imaging={imaging||[]}
                  assessment={assessment}
                  patient={patient}/>
              </div>
            </div>

            {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
            <div style={{display:"flex",flexDirection:"column",gap:10,overflow:"auto",paddingRight:2}}>

              {/* Drug Dosing Calculator */}
              <div style={{flex:"0 0 auto"}}>
                <QuickDrugDosingCalculator/>
              </div>

              {/* Medications */}
              <div style={{...glass,padding:"14px 14px",borderLeft:`3px solid ${T.rose}`,minHeight:130}}>
                <PanelHeader icon="💊" label="Medications Given" accent={T.rose}
                  action={noteId && <span onClick={() => navigate(createPageUrl(`NoteDetail?id=${noteId}`))} style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,cursor:"pointer"}}>↗ Edit</span>}/>
                {medications?.length > 0 ? (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {medications.slice(0,4).map((med,i) => (
                      <div key={i} style={{padding:"8px 10px",background:med.isControlled?"rgba(245,166,35,0.08)":T.up,borderRadius:7,border:`1px solid ${med.isControlled?"rgba(245,166,35,0.25)":"rgba(42,79,122,0.25)"}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <p style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:T.txt,margin:"0 0 2px 0"}}>
                            {med.drugName}
                            {med.isControlled && <span style={{color:T.orange,marginLeft:5,fontSize:10}}>⚠</span>}
                          </p>
                          {med.isControlled && <StatusPill label="CONTROLLED" color={T.orange}/>}
                        </div>
                        <p style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,margin:0}}>{med.dose} · {med.route}</p>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState text="No medications administered yet"/>}
              </div>

              {/* Labs */}
              <div style={{...glass,padding:"14px 14px",borderLeft:`3px solid ${T.purple}`,minHeight:130}}>
                <PanelHeader icon="🔬" label="Labs Ordered" accent={T.purple}
                  action={noteId && <span onClick={() => navigate(createPageUrl(`NoteDetail?id=${noteId}`))} style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,cursor:"pointer"}}>↗ Edit</span>}/>
                {labs?.length > 0 ? (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {labs.slice(0,4).map((lab,i) => (
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:T.up,borderRadius:7,border:"1px solid rgba(42,79,122,0.25)"}}>
                        <div>
                          <p style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:T.txt,margin:"0 0 1px 0"}}>{lab.panelName}</p>
                          {lab.criticalFlag && <p style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,margin:0}}>🚨 Critical</p>}
                        </div>
                        <StatusPill
                          label={lab.resultStatus?.toUpperCase()||"PENDING"}
                          color={lab.resultStatus==="critical"?T.red:T.txt3}/>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState text="No lab orders yet"/>}
              </div>

              {/* Imaging */}
              <div style={{...glass,padding:"14px 14px",borderLeft:`3px solid ${T.blue}`,minHeight:130}}>
                <PanelHeader icon="🫀" label="Imaging Ordered" accent={T.blue}
                  action={noteId && <span onClick={() => navigate(createPageUrl(`NoteDetail?id=${noteId}`))} style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,cursor:"pointer"}}>↗ Edit</span>}/>
                {imaging?.length > 0 ? (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {imaging.slice(0,4).map((img,i) => (
                      <div key={i} style={{padding:"7px 10px",background:T.up,borderRadius:7,border:"1px solid rgba(42,79,122,0.25)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:img.impression?3:0}}>
                          <p style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:T.txt,margin:0}}>{img.studyName}</p>
                          <StatusPill
                            label={img.readStatus?.toUpperCase()||"PENDING"}
                            color={img.readStatus==="critical"?T.red:T.txt3}/>
                        </div>
                        {img.impression && (
                          <p style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{img.impression}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <EmptyState text="No imaging ordered yet"/>}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}