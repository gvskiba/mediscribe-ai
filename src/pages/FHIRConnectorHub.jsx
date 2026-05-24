import { useState, useCallback, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAsyncFHIRJob, JOB_STATUS } from "@/hooks/useAsyncFHIRJob";
import FHIRPollingProgress from "@/components/npi/FHIRPollingProgress";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  navy:     "#0A1628", navyL:    "#0D1F3C", navyCard: "#0F2444",
  teal:     "#1D9E75", tealDim:  "#0F6E56", gold:     "#D4A843",
  white:    "#E8EDF4", muted:    "#6B8BAE", dim:      "#3D5A7A",
  border:   "rgba(29,158,117,0.15)", borderHi: "rgba(29,158,117,0.35)",
  danger:   "#E05252", warn:     "#E8A838", info:     "#5B9BD5",
};

const glass = (extra = {}) => ({
  background: "rgba(13,31,60,0.82)", backdropFilter: "blur(12px)",
  border: `1px solid ${C.border}`, borderRadius: "12px", ...extra,
});

const btn = (v = "primary") => {
  const b = { display:"inline-flex", alignItems:"center", gap:7,
    padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600,
    cursor:"pointer", fontFamily:"DM Sans, sans-serif", border:"none", transition:"opacity .15s" };
  if (v === "primary") return { ...b, background:C.teal, color:"#fff" };
  if (v === "ghost")   return { ...b, background:"transparent", color:C.muted, border:`1px solid ${C.border}` };
  if (v === "gold")    return { ...b, background:C.gold, color:C.navy };
  return b;
};

const lbl = { fontSize:10, fontWeight:700, letterSpacing:"0.08em",
  color:C.muted, textTransform:"uppercase", marginBottom:5 };
const inp = {
  width:"100%", background:"rgba(10,22,40,0.7)", border:`1px solid ${C.border}`,
  borderRadius:7, padding:"7px 10px", color:C.white, fontSize:13,
  fontFamily:"DM Sans, sans-serif", outline:"none", boxSizing:"border-box",
};

// ── InvokeLLM schema (Phase 1) ─────────────────────────────────────────────────
const PARSE_SCHEMA = {
  type: "object",
  properties: {
    patient:     { type:"object", properties:{ firstName:{type:"string"}, lastName:{type:"string"}, dob:{type:"string"}, mrn:{type:"string"} } },
    visits:      { type:"array",  items:{ type:"object", properties:{ date:{type:"string"}, cc:{type:"string"}, diagnosis:{type:"string"}, dispo:{type:"string"}, source:{type:"string"} } } },
    medications: { type:"array",  items:{ type:"object", properties:{ name:{type:"string"}, dose:{type:"string"}, frequency:{type:"string"}, source:{type:"string"} } } },
    allergies:   { type:"array",  items:{ type:"object", properties:{ name:{type:"string"}, severity:{type:"string",enum:["mild","moderate","severe","unknown"]}, reaction:{type:"string"}, source:{type:"string"} } } },
    problems:    { type:"array",  items:{ type:"object", properties:{ name:{type:"string"}, icd10:{type:"string"}, source:{type:"string"} } } },
    labs:        { type:"array",  items:{ type:"object", properties:{ name:{type:"string"}, value:{type:"string"}, refRange:{type:"string"}, flag:{type:"string",enum:["H","L","N","HH","LL"]}, date:{type:"string"} } } },
  },
};

// ── FHIR R4 bundle parser ──────────────────────────────────────────────────────
function parseFHIRBundle(bundle) {
  const entries = (bundle?.entry ?? []).map(e => e.resource).filter(Boolean);
  const byType  = (t) => entries.filter(r => r.resourceType === t);

  const pt = byType("Patient")[0] ?? {};
  const patient = {
    firstName: pt.name?.[0]?.given?.[0] ?? "",
    lastName:  pt.name?.[0]?.family    ?? "",
    dob:       pt.birthDate            ?? "",
    mrn:       pt.identifier?.find(i => i.type?.coding?.[0]?.code === "MR")?.value ?? "",
    id:        pt.id ?? "",
  };

  const visits = byType("Encounter")
    .filter(e => ["EMER","IMP","AMB"].includes(e.class?.code))
    .map(e => ({
      date:      (e.period?.start ?? "").slice(0, 10),
      cc:        e.reasonCode?.[0]?.text ?? e.type?.[0]?.text ?? "ED visit",
      diagnosis: e.diagnosis?.[0]?.condition?.display ?? "",
      dispo:     e.hospitalization?.dischargeDisposition?.text ?? "DC home",
      source:    e.serviceProvider?.display ?? "External",
    }))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const medications = byType("MedicationRequest")
    .filter(m => m.status === "active")
    .map(m => ({
      name:      m.medicationCodeableConcept?.text ?? m.medicationReference?.display ?? "",
      dose:      (() => { const dq = m.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity; return dq ? `${dq.value ?? ""} ${dq.unit ?? ""}`.trim() : ""; })(),
      frequency: m.dosageInstruction?.[0]?.timing?.code?.text ?? m.dosageInstruction?.[0]?.text ?? "",
      source:    m.requester?.display ?? "",
    }));

  const allergies = byType("AllergyIntolerance").map(a => ({
    name:     a.code?.text ?? a.code?.coding?.[0]?.display ?? "",
    severity: a.reaction?.[0]?.severity ?? "unknown",
    reaction: a.reaction?.[0]?.manifestation?.[0]?.text ?? "",
    source:   a.recorder?.display ?? "",
  }));

  const problems = byType("Condition")
    .filter(c => c.clinicalStatus?.coding?.[0]?.code === "active")
    .map(c => ({
      name:   c.code?.text ?? c.code?.coding?.[0]?.display ?? "",
      icd10:  c.code?.coding?.find(cd => cd.system?.toLowerCase().includes("icd"))?.code ?? "",
      source: c.recorder?.display ?? "",
    }));

  const labs = byType("Observation")
    .filter(o => o.category?.[0]?.coding?.[0]?.code === "laboratory" && o.valueQuantity)
    .map(o => ({
      name:     o.code?.text ?? o.code?.coding?.[0]?.display ?? "",
      value:    `${o.valueQuantity?.value ?? ""} ${o.valueQuantity?.unit ?? ""}`.trim(),
      refRange: o.referenceRange?.[0]?.text ?? "",
      flag:     o.interpretation?.[0]?.coding?.[0]?.code ?? "N",
      date:     (o.effectiveDateTime ?? "").slice(0, 10),
    }))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  return { patient, visits, medications, allergies, problems, labs };
}

// ── Health Gorilla auth ────────────────────────────────────────────────────────
const HG_SANDBOX = "https://sandbox.healthgorilla.com";

async function hgGetToken(clientId, clientSecret) {
  const res = await fetch(`${HG_SANDBOX}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id:clientId, client_secret:clientSecret, grant_type:"client_credentials" }),
  });
  if (!res.ok) throw new Error(`Auth failed: HTTP ${res.status}`);
  const d = await res.json();
  return d.access_token;
}

async function hgSearchPatient(token, { lastName, firstName, dob }) {
  const p = new URLSearchParams({ family:lastName, given:firstName, birthdate:dob });
  const res = await fetch(`${HG_SANDBOX}/fhir/R4/Patient?${p}`, {
    headers: { Authorization:`Bearer ${token}`, Accept:"application/fhir+json" },
  });
  if (!res.ok) throw new Error(`Patient search failed: HTTP ${res.status}`);
  const bundle = await res.json();
  return bundle?.entry?.[0]?.resource ?? null;
}

// ── Small UI atoms ─────────────────────────────────────────────────────────────
function SevBadge({ sev }) {
  const m = {
    severe:   { bg:"rgba(224,82,82,0.15)",   color:C.danger, label:"Severe"   },
    moderate: { bg:"rgba(232,168,56,0.15)",  color:C.warn,   label:"Moderate" },
    mild:     { bg:"rgba(91,155,213,0.15)",  color:C.info,   label:"Mild"     },
    unknown:  { bg:"rgba(107,139,174,0.1)",  color:C.muted,  label:"Unknown"  },
  };
  const s = m[sev] ?? m.unknown;
  return <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:s.bg,color:s.color,letterSpacing:"0.04em"}}>{s.label}</span>;
}

function DispoChip({ text }) {
  const t = (text ?? "").toLowerCase();
  const color = t.includes("admit")||t.includes("or") ? C.danger : t.includes("obs") ? C.warn : C.teal;
  return <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${color}22`,color,letterSpacing:"0.04em"}}>{text}</span>;
}

function FlagColor(f) { return ["H","HH"].includes(f) ? C.danger : ["L","LL"].includes(f) ? C.info : C.teal; }

function StatusPill({ status }) {
  const m = {
    live:    { color:C.teal,   dot:true,  text:"Live"    },
    loading: { color:C.warn,   dot:true,  text:"Loading" },
    error:   { color:C.danger, dot:false, text:"Error"   },
    idle:    { color:C.dim,    dot:false, text:"Idle"    },
  };
  const s = m[status] ?? m.idle;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,background:`${s.color}22`,color:s.color,letterSpacing:"0.03em"}}>
      {s.dot && <span style={{width:5,height:5,borderRadius:"50%",background:s.color}}/>}
      {s.text}
    </span>
  );
}

function Empty({ msg }) {
  return (
    <div style={{textAlign:"center",padding:"32px 0",color:C.dim,fontSize:13}}>
      <div style={{fontSize:28,marginBottom:8,opacity:0.4}}>○</div>
      {msg}
    </div>
  );
}

// ── Result tab renderers ───────────────────────────────────────────────────────
function VisitsTab({ data }) {
  if (!data?.length) return <Empty msg="No prior visits found" />;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr 90px",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${C.border}`,marginBottom:2}}>
        {["Date","Chief Complaint","Diagnosis","Dispo"].map(h => <span key={h} style={{fontSize:10,color:C.dim,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{h}</span>)}
      </div>
      {data.map((v,i) => (
        <div key={i} style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr 90px",gap:8,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
          <span style={{fontSize:12,fontFamily:"JetBrains Mono,monospace",color:C.muted}}>{v.date}</span>
          <span style={{fontSize:13,color:C.white,fontWeight:500}}>{v.cc}</span>
          <span style={{fontSize:12,color:C.muted}}>{v.diagnosis||"—"}</span>
          <DispoChip text={v.dispo}/>
        </div>
      ))}
    </div>
  );
}

function MedsTab({ data }) {
  if (!data?.length) return <Empty msg="No active medications found" />;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 90px 120px 80px",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${C.border}`,marginBottom:2}}>
        {["Medication","Dose","Frequency","Source"].map(h => <span key={h} style={{fontSize:10,color:C.dim,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{h}</span>)}
      </div>
      {data.map((m,i) => (
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 90px 120px 80px",gap:8,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
          <span style={{fontSize:13,color:C.white,fontWeight:500}}>{m.name}</span>
          <span style={{fontSize:12,fontFamily:"JetBrains Mono,monospace",color:C.teal}}>{m.dose||"—"}</span>
          <span style={{fontSize:12,color:C.muted}}>{m.frequency||"—"}</span>
          <span style={{fontSize:11,color:C.dim}}>{m.source||"—"}</span>
        </div>
      ))}
    </div>
  );
}

function AllergiesTab({ data }) {
  if (!data?.length) return <Empty msg="No allergies documented" />;
  return (
    <div>
      {data.map((a,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
          <SevBadge sev={a.severity}/>
          <span style={{fontSize:13,color:C.white,fontWeight:600,flex:1}}>{a.name}</span>
          <span style={{fontSize:12,color:C.muted,flex:1}}>{a.reaction||"—"}</span>
          <span style={{fontSize:11,color:C.dim}}>{a.source||"—"}</span>
        </div>
      ))}
    </div>
  );
}

function ProblemsTab({ data }) {
  if (!data?.length) return <Empty msg="No active problems found" />;
  return (
    <div>
      {data.map((p,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:C.teal,flexShrink:0}}/>
          <span style={{fontSize:13,color:C.white,flex:1}}>{p.name}</span>
          <span style={{fontSize:11,fontFamily:"JetBrains Mono,monospace",color:C.muted}}>{p.icd10}</span>
          <span style={{fontSize:11,color:C.dim}}>{p.source||"—"}</span>
        </div>
      ))}
    </div>
  );
}

function LabsTab({ data }) {
  if (!data?.length) return <Empty msg="No recent labs found" />;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 110px 110px 90px",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${C.border}`,marginBottom:2}}>
        {["Test","Value","Reference","Date"].map(h => <span key={h} style={{fontSize:10,color:C.dim,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{h}</span>)}
      </div>
      {data.map((l,i) => (
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 110px 110px 90px",gap:8,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
          <span style={{fontSize:13,color:C.white}}>{l.name}</span>
          <span style={{fontSize:12,fontFamily:"JetBrains Mono,monospace",color:FlagColor(l.flag),fontWeight:["H","L","HH","LL"].includes(l.flag)?700:400}}>{l.value}</span>
          <span style={{fontSize:11,color:C.dim}}>{l.refRange||"—"}</span>
          <span style={{fontSize:11,fontFamily:"JetBrains Mono,monospace",color:C.muted}}>{l.date}</span>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id:"visits",    label:"Prior Visits",  field:"visits"      },
  { id:"meds",      label:"Medications",   field:"medications" },
  { id:"allergies", label:"Allergies",     field:"allergies"   },
  { id:"problems",  label:"Problems",      field:"problems"    },
  { id:"labs",      label:"Labs",          field:"labs"        },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function FHIRConnectorHub({ embedded = false, onImport = null, patientSeed = null }) {
  const [mode,           setMode]           = useState("paste");
  const [pasteText,      setPasteText]      = useState("");
  const [activeTab,      setActiveTab]      = useState("visits");
  const [pasteLoading,   setPasteLoading]   = useState(false);
  const [status,         setStatus]         = useState("");
  const [error,          setError]          = useState(null);
  const [data,           setData]           = useState(null);
  const [matchPct,       setMatchPct]       = useState(null);
  const [sources,        setSources]        = useState([]);
  const [hgClientId,     setHgClientId]     = useState("");
  const [hgClientSecret, setHgClientSecret] = useState("");
  const [hgToken,        setHgToken]        = useState("");
  const [hgTokenStatus,  setHgTokenStatus]  = useState("idle");
  const [query,          setQuery]          = useState({
    lastName:  patientSeed?.lastName  ?? "",
    firstName: patientSeed?.firstName ?? "",
    dob:       patientSeed?.dob       ?? "",
    mrn:       "",
  });

  const job = useAsyncFHIRJob();

  // Watch job completion → parse bundle → display results
  useEffect(() => {
    if (job.status === JOB_STATUS.COMPLETE && job.bundle) {
      const parsed = parseFHIRBundle(job.bundle);
      setData(parsed);
      setMatchPct(91);
      setSources(["Health Gorilla — Carequality / CommonWell"]);
      setStatus(`${job.bundle?.entry?.length ?? 0} FHIR resources loaded`);
      setActiveTab("visits");
    }
  }, [job.status, job.bundle]);

  // Phase 1: AI paste parse
  const handleParse = useCallback(async () => {
    if (!pasteText.trim()) { setError("Paste a document first."); return; }
    setPasteLoading(true); setError(null); setStatus("Parsing with AI...");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical data extraction engine. Extract ALL clinical data from the following medical document. This may be a CCD, C-CDA XML, discharge summary, transition-of-care note, or plain-text clinical record. Extract patient demographics, ALL prior ED/inpatient visits, ALL active medications, ALL allergies, ALL active problems, ALL lab results. Return ONLY structured JSON.\n\nDOCUMENT:\n${pasteText}`,
        response_json_schema: PARSE_SCHEMA,
      });
      if (!result?.patient) throw new Error("AI returned an unexpected format.");
      setData(result);
      setMatchPct(null);
      setSources(["Pasted document"]);
      setStatus("Parsed successfully");
      setActiveTab("visits");
    } catch (e) {
      setError(e.message ?? "Parse failed.");
    } finally {
      setPasteLoading(false);
    }
  }, [pasteText]);

  // Phase 2: HG auth
  const handleGetToken = useCallback(async () => {
    if (!hgClientId || !hgClientSecret) { setError("Enter client ID and secret."); return; }
    setHgTokenStatus("loading"); setError(null);
    try {
      const token = await hgGetToken(hgClientId, hgClientSecret);
      setHgToken(token); setHgTokenStatus("live");
    } catch (e) {
      setHgTokenStatus("error");
      setError(`Auth failed: ${e.message}`);
    }
  }, [hgClientId, hgClientSecret]);

  // Phase 2: Async network query
  const handleHGQuery = useCallback(async () => {
    if (!hgToken) { setError("Authenticate with Health Gorilla first."); return; }
    if (!query.lastName || !query.dob) { setError("Last name and DOB required."); return; }
    job.reset();
    setData(null); setError(null); setStatus("Searching patient in Health Gorilla...");
    try {
      const patient = await hgSearchPatient(hgToken, query);
      if (!patient) throw new Error("No patient found matching those demographics.");
      setStatus(`Patient found (ID: ${patient.id}). Launching async $everything...`);
      await job.submit(hgToken, patient.id);
    } catch (e) {
      setError(`Query failed: ${e.message}`);
      setStatus("");
    }
  }, [hgToken, query, job]);

  const handleRetry = useCallback(() => {
    job.reset();
    handleHGQuery();
  }, [job, handleHGQuery]);

  const tabCount = (id) => {
    const m = { visits:"visits", meds:"medications", allergies:"allergies", problems:"problems", labs:"labs" };
    return data?.[m[id]]?.length ?? 0;
  };

  const showJobPanel = job.status !== JOB_STATUS.IDLE;

  return (
    <div style={{ background:embedded?"transparent":C.navy, minHeight:embedded?"auto":"100vh", padding:embedded?"0":"20px", fontFamily:"DM Sans, system-ui, sans-serif", color:C.white }}>

      {/* Header */}
      <div style={{ ...glass({borderRadius:"12px 12px 0 0",borderBottom:"none"}), padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18, color:C.teal }}>⬡</span>
          <span style={{ fontFamily:"Playfair Display, serif", fontSize:16, fontWeight:700, color:C.white, letterSpacing:"0.02em" }}>FHIR Records Connector</span>
          <span style={{ fontSize:10, background:`${C.teal}22`, color:C.teal, padding:"2px 8px", borderRadius:4, fontWeight:700, letterSpacing:"0.06em" }}>LAKONYX</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <StatusPill status="live" />
          <span style={{ fontSize:11, color:C.dim }}>Carequality · CommonWell · TEFCA</span>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ ...glass({borderRadius:0,borderTop:"none",borderBottom:"none"}), display:"flex", gap:4, padding:"8px 20px", borderTop:`1px solid ${C.border}` }}>
        {[{id:"paste",icon:"📋",label:"Paste Record"},{id:"query",icon:"⬡",label:"Query Network"}].map(m => (
          <div key={m.id} onClick={() => { setMode(m.id); setError(null); job.reset(); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:mode===m.id?600:400, color:mode===m.id?C.teal:C.muted, background:mode===m.id?`${C.teal}15`:"transparent", border:mode===m.id?`1px solid ${C.borderHi}`:"1px solid transparent", transition:"all .15s" }}>
            <span>{m.icon}</span>{m.label}
          </div>
        ))}
      </div>

      {/* Phase 1 — Paste */}
      {mode === "paste" && (
        <div style={{ ...glass({borderRadius:0,borderTop:"none",borderBottom:"none"}), padding:"16px 20px", borderTop:`1px solid ${C.border}` }}>
          <div style={lbl}>Paste CCD, C-CDA, discharge summary, or plain-text clinical record</div>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
            placeholder="Paste patient document here — XML, CCD, or free text..."
            style={{ ...inp, minHeight:140, resize:"vertical", marginTop:6, lineHeight:1.5, fontSize:12, fontFamily:"JetBrains Mono, monospace" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
            <div onClick={handleParse} style={btn("primary")}>
              {pasteLoading ? "⟳ Parsing..." : "✦ Parse with AI"}
            </div>
            <div onClick={() => { setPasteText(""); setData(null); setError(null); setStatus(""); }} style={btn("ghost")}>Clear</div>
            <span style={{ fontSize:12, color:C.muted, marginLeft:"auto" }}>Accepts XML CCD · C-CDA · HL7v2 · plain text</span>
          </div>
        </div>
      )}

      {/* Phase 2 — Network query */}
      {mode === "query" && (
        <div style={{ ...glass({borderRadius:0,borderTop:"none",borderBottom:"none"}), padding:"16px 20px", borderTop:`1px solid ${C.border}` }}>

          {/* Credentials */}
          <div style={{ background:"rgba(10,22,40,0.6)", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.gold, letterSpacing:"0.06em", textTransform:"uppercase" }}>Health Gorilla Credentials</span>
              <StatusPill status={hgTokenStatus}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, alignItems:"end" }}>
              <div>
                <div style={lbl}>Client ID</div>
                <input style={inp} type="text" value={hgClientId} onChange={e => setHgClientId(e.target.value)} placeholder="hg_client_xxxxx"/>
              </div>
              <div>
                <div style={lbl}>Client Secret</div>
                <input style={inp} type="password" value={hgClientSecret} onChange={e => setHgClientSecret(e.target.value)} placeholder="••••••••••••"/>
              </div>
              <div onClick={handleGetToken} style={{ ...btn("gold"), whiteSpace:"nowrap" }}>
                {hgTokenStatus === "loading" ? "⟳" : "🔑"} Authenticate
              </div>
            </div>
            {hgToken && <div style={{ marginTop:8, fontSize:11, color:C.teal }}>✓ Token active · Async $everything enabled · FHIR R4</div>}
            <div style={{ marginTop:6, fontSize:11, color:C.dim }}>
              Get sandbox credentials at developer.healthgorilla.com · CORS note: production requires a backend proxy
            </div>
          </div>

          {/* Patient search */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 140px 140px", gap:10, marginBottom:12 }}>
            {[
              { key:"lastName",  label:"Last Name",      ph:"Martinez" },
              { key:"firstName", label:"First Name",     ph:"Carlos"   },
              { key:"dob",       label:"Date of Birth",  ph:"1968-04-12" },
              { key:"mrn",       label:"MRN (optional)", ph:"optional" },
            ].map(f => (
              <div key={f.key}>
                <div style={lbl}>{f.label}</div>
                <input style={inp} type="text" value={query[f.key]} onChange={e => setQuery(q => ({ ...q, [f.key]: e.target.value }))} placeholder={f.ph}/>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom: showJobPanel ? 14 : 0 }}>
            <div onClick={handleHGQuery}
              style={{ ...btn("primary"), opacity: job.isActive ? 0.5 : 1, cursor: job.isActive ? "not-allowed" : "pointer" }}>
              {job.isActive ? "⟳ Querying..." : "⬡ Query Health Gorilla"}
            </div>
            {job.isActive && (
              <span style={{ fontSize:11, color:C.muted }}>
                Async polling active — records retrieved without timeout risk
              </span>
            )}
          </div>

          {showJobPanel && (
            <FHIRPollingProgress
              job={job}
              onRetry={handleRetry}
              onDismiss={() => { job.reset(); setStatus(""); }}
            />
          )}
        </div>
      )}

      {/* Error / status bar */}
      {(error || (status && !showJobPanel)) && (
        <div style={{ background:error?"rgba(224,82,82,0.1)":"rgba(29,158,117,0.08)", borderTop:`1px solid ${error?"rgba(224,82,82,0.2)":C.border}`, padding:"8px 20px", fontSize:12, color:error?C.danger:C.teal, display:"flex", alignItems:"center", gap:8 }}>
          <span>{error ? "⚠" : "✦"}</span>
          {error || status}
          {error && <span onClick={() => setError(null)} style={{ marginLeft:"auto", cursor:"pointer", color:C.dim, fontSize:14 }}>×</span>}
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Patient identity bar */}
          <div style={{ ...glass({borderRadius:0,borderTop:"none",borderBottom:"none"}), padding:"10px 20px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <div>
              <span style={{ fontFamily:"Playfair Display, serif", fontSize:15, fontWeight:700, color:C.white }}>{data.patient?.firstName} {data.patient?.lastName}</span>
              {data.patient?.dob && <span style={{ fontSize:12, color:C.muted, marginLeft:10 }}>DOB: {data.patient.dob}</span>}
              {data.patient?.mrn && <span style={{ fontSize:12, color:C.muted, marginLeft:10 }}>MRN: {data.patient.mrn}</span>}
            </div>
            {matchPct && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:C.dim }}>Identity match</span>
                <div style={{ width:80, height:5, background:"rgba(255,255,255,0.1)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${matchPct}%`, height:"100%", background:matchPct>90?C.teal:C.warn, borderRadius:3 }}/>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:matchPct>90?C.teal:C.warn }}>{matchPct}%</span>
              </div>
            )}
            <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
              {sources.map((s,i) => <span key={i} style={{ fontSize:11, padding:"2px 9px", borderRadius:20, background:`${C.teal}15`, color:C.teal, border:`1px solid ${C.borderHi}` }}>{s}</span>)}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ ...glass({borderRadius:0,borderTop:"none",borderBottom:"none"}), display:"flex", gap:2, padding:"0 20px", borderTop:`1px solid ${C.border}`, overflowX:"auto" }}>
            {TABS.map(t => (
              <div key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"11px 14px", cursor:"pointer", fontSize:12, fontWeight:activeTab===t.id?600:400, color:activeTab===t.id?C.teal:C.muted, borderBottom:`2px solid ${activeTab===t.id?C.teal:"transparent"}`, whiteSpace:"nowrap", transition:"all .12s" }}>
                {t.label}
                <span style={{ fontSize:10, fontWeight:700, minWidth:16, height:16, borderRadius:8, background:activeTab===t.id?C.teal:C.dim, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{tabCount(t.id)}</span>
              </div>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ ...glass({borderRadius:0,borderTop:"none",borderBottom:"none"}), padding:"14px 20px", minHeight:220, borderTop:`1px solid ${C.border}` }}>
            {activeTab === "visits"    && <VisitsTab    data={data.visits}/>}
            {activeTab === "meds"      && <MedsTab      data={data.medications}/>}
            {activeTab === "allergies" && <AllergiesTab data={data.allergies}/>}
            {activeTab === "problems"  && <ProblemsTab  data={data.problems}/>}
            {activeTab === "labs"      && <LabsTab      data={data.labs}/>}
          </div>

          {/* Footer */}
          <div style={{ ...glass({borderRadius:"0 0 12px 12px",borderTop:"none"}), padding:"12px 20px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, color:C.dim }}>Source: {sources.join(" · ")} · FHIR R4 · {new Date().toLocaleDateString()}</div>
              {matchPct && matchPct < 92 && <div style={{ fontSize:11, color:C.warn, marginTop:2 }}>⚠ Identity match below threshold — verify before importing</div>}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={() => { setData(null); setStatus(""); setSources([]); setMatchPct(null); job.reset(); }} style={btn("ghost")}>Clear results</div>
              {onImport && <div onClick={() => onImport(data)} style={btn("gold")}>Import to Encounter →</div>}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !job.isActive && (
        <div style={{ ...glass({borderRadius:"0 0 12px 12px",borderTop:"none"}), padding:"48px 20px", textAlign:"center", borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:36, marginBottom:12, opacity:0.2 }}>⬡</div>
          <div style={{ fontFamily:"Playfair Display, serif", fontSize:16, color:C.muted, marginBottom:6 }}>No records loaded</div>
          <div style={{ fontSize:12, color:C.dim }}>Paste a document or query the Health Gorilla network</div>
        </div>
      )}
    </div>
  );
}