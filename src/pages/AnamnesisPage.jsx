import { useState, useCallback, useEffect, useRef } from "react";
import { InvokeLLM } from "@/integrations/Core";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAKONYX — Anamnesis  (Clinical Record Intelligence)
// File: src/pages/AnamnesisPage.jsx
// Base44 app ID: 69e2b07447a94ce494a296b7
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#060f1c",
  panel:    "#0a1828",
  card:     "#0d2040",
  teal:     "#00d4a8",
  tealDim:  "#008f72",
  gold:     "#e8b84b",
  coral:    "#f06060",
  blue:     "#4a9eff",
  violet:   "#9b7de8",
  txt:      "#e8f0fb",
  txt2:     "#9ab8d8",
  txt3:     "#5e88b0",
  txt4:     "#3a5f80",
  border:   "rgba(0,212,168,0.13)",
  borderHi: "rgba(0,212,168,0.32)",
  warn:     "#e8a838",
};

const g = (r = 10, extra = {}) => ({
  background:     "rgba(10,24,40,0.88)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:         `1px solid ${T.border}`,
  borderRadius:   r,
  ...extra,
});

const FONTS = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', system-ui, sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Async polling constants ───────────────────────────────────────────────────
const HG_SANDBOX     = "https://sandbox.healthgorilla.com";
const MAX_POLL_MS    = 90_000;
const INIT_INTERVAL  = 3_000;
const MAX_INTERVAL   = 15_000;
const BACKOFF        = 1.5;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── FHIR bundle parser ────────────────────────────────────────────────────────
function parseFHIRBundle(bundle) {
  const res  = (bundle?.entry ?? []).map(e => e.resource).filter(Boolean);
  const by   = (t) => res.filter(r => r.resourceType === t);
  const pt   = by("Patient")[0] ?? {};

  const patient = {
    firstName: pt.name?.[0]?.given?.[0] ?? "",
    lastName:  pt.name?.[0]?.family ?? "",
    dob:       pt.birthDate ?? "",
    mrn:       pt.identifier?.find(i => i.type?.coding?.[0]?.code === "MR")?.value ?? "",
    id:        pt.id ?? "",
  };

  const visits = by("Encounter")
    .filter(e => ["EMER","IMP","AMB"].includes(e.class?.code))
    .map(e => ({
      date:  (e.period?.start ?? "").slice(0,10),
      cc:    e.reasonCode?.[0]?.text ?? e.type?.[0]?.text ?? "Visit",
      dx:    e.diagnosis?.[0]?.condition?.display ?? "",
      dispo: e.hospitalization?.dischargeDisposition?.text ?? "DC home",
      src:   e.serviceProvider?.display ?? "External",
    }))
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0,10);

  const medications = by("MedicationRequest").filter(m => m.status==="active").map(m => ({
    name: m.medicationCodeableConcept?.text ?? m.medicationReference?.display ?? "",
    dose: (() => { const d = m.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity; return d ? `${d.value??""} ${d.unit??""}`.trim() : ""; })(),
    freq: m.dosageInstruction?.[0]?.timing?.code?.text ?? m.dosageInstruction?.[0]?.text ?? "",
    src:  m.requester?.display ?? "",
  }));

  const allergies = by("AllergyIntolerance").map(a => ({
    name:  a.code?.text ?? a.code?.coding?.[0]?.display ?? "",
    sev:   a.reaction?.[0]?.severity ?? "unknown",
    rxn:   a.reaction?.[0]?.manifestation?.[0]?.text ?? "",
    src:   a.recorder?.display ?? "",
  }));

  const problems = by("Condition").filter(c => c.clinicalStatus?.coding?.[0]?.code==="active").map(c => ({
    name:  c.code?.text ?? c.code?.coding?.[0]?.display ?? "",
    icd:   c.code?.coding?.find(cd => cd.system?.toLowerCase().includes("icd"))?.code ?? "",
    src:   c.recorder?.display ?? "",
  }));

  const labs = by("Observation")
    .filter(o => o.category?.[0]?.coding?.[0]?.code==="laboratory" && o.valueQuantity)
    .map(o => ({
      name:  o.code?.text ?? o.code?.coding?.[0]?.display ?? "",
      val:   `${o.valueQuantity?.value??""} ${o.valueQuantity?.unit??""}`.trim(),
      ref:   o.referenceRange?.[0]?.text ?? "",
      flag:  o.interpretation?.[0]?.coding?.[0]?.code ?? "N",
      date:  (o.effectiveDateTime??"").slice(0,10),
    }))
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0,15);

  return { patient, visits, medications, allergies, problems, labs };
}

// ── InvokeLLM schema ──────────────────────────────────────────────────────────
const PARSE_SCHEMA = {
  type:"object", properties:{
    patient:     { type:"object", properties:{ firstName:{type:"string"},lastName:{type:"string"},dob:{type:"string"},mrn:{type:"string"} } },
    visits:      { type:"array", items:{ type:"object", properties:{ date:{type:"string"},cc:{type:"string"},diagnosis:{type:"string"},dispo:{type:"string"},source:{type:"string"} } } },
    medications: { type:"array", items:{ type:"object", properties:{ name:{type:"string"},dose:{type:"string"},frequency:{type:"string"},source:{type:"string"} } } },
    allergies:   { type:"array", items:{ type:"object", properties:{ name:{type:"string"},severity:{type:"string",enum:["mild","moderate","severe","unknown"]},reaction:{type:"string"},source:{type:"string"} } } },
    problems:    { type:"array", items:{ type:"object", properties:{ name:{type:"string"},icd10:{type:"string"},source:{type:"string"} } } },
    labs:        { type:"array", items:{ type:"object", properties:{ name:{type:"string"},value:{type:"string"},refRange:{type:"string"},flag:{type:"string",enum:["H","L","N","HH","LL"]},date:{type:"string"} } } },
  },
};

// ── HG auth helpers ───────────────────────────────────────────────────────────
async function hgAuth(id, secret) {
  const r = await fetch(`${HG_SANDBOX}/oauth/token`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ client_id:id, client_secret:secret, grant_type:"client_credentials" }),
  });
  if (!r.ok) throw new Error(`Auth failed: HTTP ${r.status}`);
  return (await r.json()).access_token;
}

async function hgFindPatient(token, { lastName, firstName, dob }) {
  const p = new URLSearchParams({ family:lastName, given:firstName, birthdate:dob });
  const r = await fetch(`${HG_SANDBOX}/fhir/R4/Patient?${p}`, {
    headers:{ Authorization:`Bearer ${token}`, Accept:"application/fhir+json" },
  });
  if (!r.ok) throw new Error(`Patient search failed: HTTP ${r.status}`);
  return (await r.json())?.entry?.[0]?.resource ?? null;
}

// ── Tiny atoms ────────────────────────────────────────────────────────────────
const SevColor = { severe:T.coral, moderate:T.warn, mild:T.blue, unknown:T.txt3 };

function Pill({ children, color = T.teal, bg }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, fontWeight:700,
      padding:"2px 8px", borderRadius:20, letterSpacing:"0.05em",
      background: bg ?? `${color}20`, color }}>
      {children}
    </span>
  );
}

function Dot({ color = T.teal, pulse }) {
  return (
    <span style={{ width:6, height:6, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0,
      animation: pulse ? "lkxPulse 1.6s ease-in-out infinite" : "none" }} />
  );
}

function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <span onClick={handle} style={{ display:"inline-flex", alignItems:"center", gap:4,
      fontSize:10, fontWeight:600, cursor:"pointer", color: copied ? T.teal : T.txt3,
      padding:"3px 8px", borderRadius:5, border:`1px solid ${copied?T.borderHi:T.border}`,
      background: copied ? `${T.teal}12` : "transparent", transition:"all .2s", fontFamily:FONTS.body }}>
      {copied ? "✓ Copied" : label}
    </span>
  );
}

function SectionHeader({ title, count, copyText }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <span style={{ fontFamily:FONTS.body, fontSize:10, fontWeight:700, color:T.txt3,
        letterSpacing:"0.08em", textTransform:"uppercase", flex:1 }}>{title}</span>
      {count != null && (
        <span style={{ fontSize:10, fontWeight:700, minWidth:18, height:18, borderRadius:9,
          background:T.teal, color:"#000", display:"inline-flex", alignItems:"center",
          justifyContent:"center", padding:"0 5px" }}>{count}</span>
      )}
      {copyText && <CopyBtn text={copyText} />}
    </div>
  );
}

// ── Result sections ───────────────────────────────────────────────────────────
function VisitList({ data }) {
  if (!data?.length) return <div style={{textAlign:"center",padding:24,color:T.txt4,fontSize:12}}>No prior visits on record</div>;
  const copyText = data.map(v=>`${v.date}: ${v.cc} → ${v.dx||"—"} (${v.dispo})`).join("\n");
  return <>
    <SectionHeader title="ED & Inpatient Visits" count={data.length} copyText={copyText}/>
    <div style={{display:"grid",gridTemplateColumns:"92px 1fr 1fr 78px",gap:8,
      padding:"0 0 6px",borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
      {["Date","Chief Complaint","Diagnosis","Dispo"].map(h=>(
        <span key={h} style={{fontSize:9,color:T.txt4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</span>
      ))}
    </div>
    {data.map((v,i)=>(
      <div key={i} style={{display:"grid",gridTemplateColumns:"92px 1fr 1fr 78px",gap:8,
        padding:"8px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,alignItems:"center"}}>
        <span style={{fontFamily:FONTS.mono,fontSize:11,color:T.txt3}}>{v.date}</span>
        <span style={{fontSize:12,color:T.txt,fontWeight:500}}>{v.cc}</span>
        <span style={{fontSize:11,color:T.txt2}}>{v.dx||"—"}</span>
        <Pill color={v.dispo?.toLowerCase().includes("admit")?T.coral:v.dispo?.toLowerCase().includes("obs")?T.warn:T.teal}>{v.dispo}</Pill>
      </div>
    ))}
  </>;
}

function MedList({ data }) {
  if (!data?.length) return <div style={{textAlign:"center",padding:24,color:T.txt4,fontSize:12}}>No active medications found</div>;
  const copyText = data.map(m=>`${m.name} ${m.dose} ${m.freq}`.trim()).join("\n");
  return <>
    <SectionHeader title="Active Medications" count={data.length} copyText={copyText}/>
    {data.map((m,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",
        borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
        <span style={{fontSize:12,color:T.txt,fontWeight:500,flex:2}}>{m.name}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:11,color:T.teal,flex:0,whiteSpace:"nowrap"}}>{m.dose||"—"}</span>
        <span style={{fontSize:11,color:T.txt2,flex:1}}>{m.freq||"—"}</span>
        <span style={{fontSize:10,color:T.txt4}}>{m.src||"—"}</span>
      </div>
    ))}
  </>;
}

function AllergyList({ data }) {
  if (!data?.length) return <div style={{textAlign:"center",padding:24,color:T.txt4,fontSize:12}}>No allergies documented</div>;
  const copyText = data.map(a=>`${a.name}: ${a.rxn||"reaction unreported"} (${a.sev})`).join("\n");
  return <>
    <SectionHeader title="Allergies & Adverse Reactions" count={data.length} copyText={copyText}/>
    {data.map((a,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",
        borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
        <Pill color={SevColor[a.sev]??T.txt3}>{(a.sev||"?").toUpperCase()}</Pill>
        <span style={{fontSize:12,color:T.txt,fontWeight:600,flex:1}}>{a.name}</span>
        <span style={{fontSize:11,color:T.txt2,flex:1}}>{a.rxn||"—"}</span>
        <span style={{fontSize:10,color:T.txt4}}>{a.src||"—"}</span>
      </div>
    ))}
  </>;
}

function ProblemList({ data }) {
  if (!data?.length) return <div style={{textAlign:"center",padding:24,color:T.txt4,fontSize:12}}>No active problems found</div>;
  const copyText = data.map(p=>`${p.name}${p.icd?" ("+p.icd+")":""}`).join("\n");
  return <>
    <SectionHeader title="Active Problem List" count={data.length} copyText={copyText}/>
    {data.map((p,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",
        borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
        <Dot color={T.teal}/>
        <span style={{fontSize:12,color:T.txt,flex:1}}>{p.name}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:10,color:T.txt3}}>{p.icd||"—"}</span>
        <span style={{fontSize:10,color:T.txt4}}>{p.src||"—"}</span>
      </div>
    ))}
  </>;
}

function LabList({ data }) {
  if (!data?.length) return <div style={{textAlign:"center",padding:24,color:T.txt4,fontSize:12}}>No recent labs found</div>;
  const flagColor = (f) => ["H","HH"].includes(f)?T.coral:["L","LL"].includes(f)?T.blue:T.teal;
  const copyText = data.map(l=>`${l.name}: ${l.val} (ref ${l.ref||"—"}) [${l.flag}] ${l.date}`).join("\n");
  return <>
    <SectionHeader title="Recent Laboratory Results" count={data.length} copyText={copyText}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px",gap:8,
      padding:"0 0 6px",borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
      {["Test","Value","Reference","Date"].map(h=>(
        <span key={h} style={{fontSize:9,color:T.txt4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</span>
      ))}
    </div>
    {data.map((l,i)=>(
      <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px",gap:8,
        padding:"7px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,alignItems:"center"}}>
        <span style={{fontSize:12,color:T.txt}}>{l.name}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:12,color:flagColor(l.flag),
          fontWeight:["H","L","HH","LL"].includes(l.flag)?700:400}}>{l.val}</span>
        <span style={{fontSize:11,color:T.txt4}}>{l.ref||"—"}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:10,color:T.txt3}}>{l.date}</span>
      </div>
    ))}
  </>;
}

// ── Polling progress panel ────────────────────────────────────────────────────
function PollingPanel({ job, onCancel, onRetry }) {
  const fmtMs = (ms) => { const s=Math.floor(ms/1000),m=Math.floor(s/60); return `${m}:${String(s%60).padStart(2,"0")}`; };
  const isLive = ["submitting","polling"].includes(job.phase);
  const isDone = job.phase === "complete";
  const isBad  = ["error","timeout","cancelled"].includes(job.phase);

  const barColor = isDone ? T.teal : isBad ? T.coral : `linear-gradient(90deg,${T.tealDim},${T.teal})`;

  return (
    <div style={{ ...g(10), padding:"14px 16px", marginBottom:12, border:`1px solid ${isDone?T.borderHi:isBad?"rgba(240,96,96,0.3)":T.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        {/* Spinner / icon */}
        <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0, display:"flex",
          alignItems:"center", justifyContent:"center",
          background: isDone?`${T.teal}18`:isBad?`${T.coral}18`:`${T.teal}12`,
          border:`1.5px solid ${isDone?T.teal:isBad?T.coral:T.txt4}44` }}>
          {isLive
            ? <span style={{ width:14,height:14,borderRadius:"50%",border:`2px solid ${T.teal}33`,borderTop:`2px solid ${T.teal}`,display:"inline-block",animation:"lkxSpin .85s linear infinite" }}/>
            : <span style={{ fontSize:14, color: isDone?T.teal:T.coral }}>{isDone?"✓":isBad?"✕":"○"}</span>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:FONTS.body, fontSize:13, fontWeight:600,
            color: isDone?T.teal:isBad?T.coral:T.txt }}>
            {job.phase==="submitting" && "Submitting async request..."}
            {job.phase==="polling"    && `Querying network · poll #${job.polls}`}
            {job.phase==="complete"   && `Records retrieved · ${job.bundle?.entry?.length??0} resources`}
            {job.phase==="error"      && "Query failed"}
            {job.phase==="timeout"    && "Query timed out"}
            {job.phase==="cancelled"  && "Cancelled"}
          </div>
          <div style={{ fontSize:11, color:T.txt4, marginTop:2 }}>
            {isLive ? "Carequality · CommonWell · CMS Claims · TEFCA QHIN" : job.error?.slice(0,90) ?? ""}
          </div>
        </div>
        <div style={{ fontFamily:FONTS.mono, fontSize:22, fontWeight:700,
          color:isLive?T.teal:T.txt4, letterSpacing:"0.05em" }}>
          {fmtMs(job.elapsed)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden", marginBottom:12 }}>
        <div style={{ height:"100%", width:`${job.pct}%`, borderRadius:2,
          background: barColor, transition: isDone?"width .5s ease":"width 1.2s linear",
          animation: isLive ? "lkxShimmer 2.2s linear infinite" : "none",
          backgroundSize:"200% 100%" }} />
      </div>

      {/* Network badges */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
        {[["Carequality",true],["CommonWell",true],["CMS Claims",true],["TEFCA QHIN",false]].map(([name,active])=>(
          <span key={name} style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontWeight:600,
            padding:"3px 9px",borderRadius:20,letterSpacing:"0.04em",transition:"all .3s",
            background: active&&(isLive||isDone)?`${T.teal}15`:"rgba(255,255,255,0.04)",
            color: active&&(isLive||isDone)?T.teal:T.txt4,
            border:`1px solid ${active&&(isLive||isDone)?T.borderHi:"rgba(255,255,255,0.06)"}` }}>
            <span style={{ width:5,height:5,borderRadius:"50%",
              background:active&&(isLive||isDone)?T.teal:T.txt4,
              animation:active&&isLive?"lkxPulse 1.4s ease-in-out infinite":"none" }}/>
            {name}
          </span>
        ))}
      </div>

      {/* Actions + log toggle */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {isLive && <span onClick={onCancel} style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,cursor:"pointer",color:T.coral,padding:"5px 10px",borderRadius:6,background:"rgba(240,96,96,0.1)",border:"1px solid rgba(240,96,96,0.25)",fontFamily:FONTS.body }}>✕ Cancel</span>}
        {isBad && onRetry && <span onClick={onRetry} style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,cursor:"pointer",color:T.teal,padding:"5px 10px",borderRadius:6,background:`${T.teal}15`,border:`1px solid ${T.borderHi}`,fontFamily:FONTS.body }}>↻ Retry</span>}
        <span style={{ flex:1 }}/>
        {job.log.length>0 && <span style={{ fontSize:10,color:T.txt4 }}>{job.log[job.log.length-1].msg}</span>}
      </div>

      {/* Error box */}
      {job.error && (
        <div style={{ marginTop:10,padding:"8px 10px",borderRadius:7,background:"rgba(240,96,96,0.08)",
          border:"1px solid rgba(240,96,96,0.2)",fontSize:11,color:T.coral,lineHeight:1.6 }}>
          {job.error}
        </div>
      )}
    </div>
  );
}

// ── Session history item ──────────────────────────────────────────────────────
function SessionItem({ session, active, onClick }) {
  const { patient, ts, sources, summary } = session;
  const name = `${patient?.firstName??""} ${patient?.lastName??""}`.trim() || "Unknown";
  return (
    <div onClick={onClick} style={{ padding:"10px 12px", borderRadius:8, cursor:"pointer",
      background: active ? `${T.teal}12` : "rgba(255,255,255,0.02)",
      border:`1px solid ${active?T.borderHi:T.border}`, marginBottom:6, transition:"all .15s" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
        <span style={{ fontFamily:FONTS.body,fontSize:12,fontWeight:600,color:T.txt,flex:1 }}>{name}</span>
        <span style={{ fontFamily:FONTS.mono,fontSize:10,color:T.txt4 }}>{new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
      </div>
      {patient?.dob && <div style={{ fontSize:10,color:T.txt3,marginBottom:4 }}>DOB: {patient.dob}</div>}
      <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
        {sources?.map((s,i)=><Pill key={i} color={T.txt4}>{s.slice(0,20)}</Pill>)}
        <Pill color={T.teal}>{(summary?.visits??0)} visits</Pill>
        <Pill color={T.teal}>{(summary?.meds??0)} meds</Pill>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AnamnesisPage() {
  // ── Mode & credentials ──────────────────────────────────────────────────────
  const [mode,      setMode]      = useState("paste"); // "paste" | "query"
  const [hgId,      setHgId]      = useState("");
  const [hgSecret,  setHgSecret]  = useState("");
  const [hgToken,   setHgToken]   = useState("");
  const [authState, setAuthState] = useState("idle"); // idle|loading|live|error

  // ── Patient query form ──────────────────────────────────────────────────────
  const [qry, setQry] = useState({ lastName:"", firstName:"", dob:"", mrn:"" });

  // ── Paste ───────────────────────────────────────────────────────────────────
  const [paste,      setPaste]      = useState("");
  const [pasteState, setPasteState] = useState("idle"); // idle|loading|done|error

  // ── Active results ──────────────────────────────────────────────────────────
  const [data,    setData]    = useState(null);
  const [sources, setSources] = useState([]);
  const [tab,     setTab]     = useState("visits");

  // ── Session history ─────────────────────────────────────────────────────────
  const [sessions,       setSessions]       = useState([]);
  const [activeSession,  setActiveSession]  = useState(null);

  // ── Async job state ─────────────────────────────────────────────────────────
  const [job, setJob] = useState({
    phase:"idle", polls:0, elapsed:0, pct:0, bundle:null, log:[], error:null,
  });
  const cancelRef = useRef(false);
  const startRef  = useRef(null);
  const timerRef  = useRef(null);

  // ── Global error/status ─────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Cleanup timer on unmount ────────────────────────────────────────────────
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Watch job completion → parse → save session ─────────────────────────────
  useEffect(() => {
    if (job.phase === "complete" && job.bundle) {
      const parsed = parseFHIRBundle(job.bundle);
      setData(parsed);
      setSources(["Health Gorilla · Carequality / CommonWell"]);
      setTab("visits");
      saveSession(parsed, ["Health Gorilla · Carequality"]);
      showToast(`${job.bundle.entry?.length??0} FHIR resources loaded`, "success");
    }
  }, [job.phase, job.bundle]);

  // ── Save session to history ─────────────────────────────────────────────────
  const saveSession = useCallback((parsed, srcs) => {
    const session = {
      id:      Date.now(),
      ts:      Date.now(),
      patient: parsed.patient,
      data:    parsed,
      sources: srcs,
      summary: {
        visits: parsed.visits?.length ?? 0,
        meds:   parsed.medications?.length ?? 0,
        labs:   parsed.labs?.length ?? 0,
      },
    };
    setSessions(prev => [session, ...prev.slice(0,9)]);
    setActiveSession(session.id);
  }, []);

  // ── Async job helpers ───────────────────────────────────────────────────────
  const jobLog  = useCallback((msg, level="info") => setJob(j=>({...j,log:[...j.log,{ts:Date.now(),msg,level}]})),[]);
  const stopTick = useCallback(() => { if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;} },[]);

  const resetJob = useCallback(() => {
    cancelRef.current = true;
    stopTick();
    setJob({ phase:"idle", polls:0, elapsed:0, pct:0, bundle:null, log:[], error:null });
  }, [stopTick]);

  // ── HG authentication ───────────────────────────────────────────────────────
  const handleAuth = useCallback(async () => {
    if (!hgId||!hgSecret) { showToast("Enter client ID and secret","warn"); return; }
    setAuthState("loading");
    try {
      const tok = await hgAuth(hgId, hgSecret);
      setHgToken(tok);
      setAuthState("live");
      showToast("Authenticated with Health Gorilla","success");
    } catch(e) {
      setAuthState("error");
      showToast(e.message,"error");
    }
  }, [hgId, hgSecret, showToast]);

  // ── Async $everything query ─────────────────────────────────────────────────
  const handleQuery = useCallback(async () => {
    if (!hgToken)         { showToast("Authenticate first","warn"); return; }
    if (!qry.lastName||!qry.dob) { showToast("Last name and DOB required","warn"); return; }

    cancelRef.current = false;
    startRef.current  = Date.now();
    setData(null); setSources([]);
    setJob({ phase:"submitting", polls:0, elapsed:0, pct:10, bundle:null, log:[], error:null });

    // Elapsed ticker
    timerRef.current = setInterval(() => {
      const ms = Date.now() - startRef.current;
      const pct = Math.round(95*(1-Math.exp(-ms/28000)));
      setJob(j => ({ ...j, elapsed:ms, pct }));
    }, 400);

    try {
      // Patient search
      jobLog("Searching patient in Health Gorilla...");
      const patient = await hgFindPatient(hgToken, qry);
      if (!patient) throw new Error("No patient found matching those demographics.");
      if (cancelRef.current) return;

      jobLog(`Patient found · HG ID: ${patient.id}`);
      jobLog("Submitting async $everything with Prefer: respond-async...");
      setJob(j=>({...j,phase:"submitting",pct:18}));

      // Kick off async $everything
      const kickoff = await fetch(`${HG_SANDBOX}/fhir/R4/Patient/${patient.id}/$everything`, {
        method:"GET",
        headers:{ Authorization:`Bearer ${hgToken}`, Accept:"application/fhir+json", Prefer:"respond-async" },
      });

      if (cancelRef.current) return;

      // Sync fast-path (small record set)
      if (kickoff.status === 200) {
        const syncBundle = await kickoff.json();
        stopTick();
        const elapsed = Date.now()-startRef.current;
        jobLog(`Sync response · ${syncBundle?.entry?.length??0} resources in ${(elapsed/1000).toFixed(1)}s`,"success");
        setJob(j=>({...j,phase:"complete",pct:100,elapsed,bundle:syncBundle}));
        return;
      }

      if (kickoff.status !== 202) {
        const body = await kickoff.json().catch(()=>({}));
        throw new Error(`Kickoff failed HTTP ${kickoff.status}: ${body?.issue?.[0]?.diagnostics??"Unknown error"}`);
      }

      // Get poll URL from Location header
      const pollUrl = kickoff.headers.get("location") || kickoff.headers.get("content-location");
      if (!pollUrl) throw new Error("Server returned 202 but no Location header. Verify async $everything support.");

      const jobId = pollUrl.split("/").pop();
      jobLog(`Job accepted · ID: ${jobId}`);
      jobLog("Polling Carequality & CommonWell networks...");
      setJob(j=>({...j,phase:"polling"}));

      // Poll loop
      let interval = INIT_INTERVAL;
      let polls    = 0;

      while (true) {
        if (cancelRef.current) return;
        if (Date.now()-startRef.current >= MAX_POLL_MS) {
          throw new Error("Query timed out after 90s. The patient may have extensive records. Consider the P360 async retrieval endpoint for large record sets.");
        }

        await sleep(interval);
        if (cancelRef.current) return;

        polls++;
        setJob(j=>({...j,polls}));

        const pollRes = await fetch(pollUrl, {
          headers:{ Authorization:`Bearer ${hgToken}`, Accept:"application/fhir+json" },
        });

        if (cancelRef.current) return;

        // Done
        if (pollRes.status === 200) {
          const finalBundle = await pollRes.json();
          stopTick();
          const elapsed = Date.now()-startRef.current;
          const count   = finalBundle?.entry?.length ?? 0;
          jobLog(`Complete · ${count} resources in ${(elapsed/1000).toFixed(1)}s`,"success");
          setJob(j=>({...j,phase:"complete",pct:100,elapsed,bundle:finalBundle}));
          return;
        }

        // Still processing
        if (pollRes.status === 202) {
          const xProg    = pollRes.headers.get("x-progress");
          const retry    = parseInt(pollRes.headers.get("retry-after")??"0",10)*1000;
          const elapsed  = Date.now()-startRef.current;
          jobLog(`Poll #${polls}${xProg?" — "+xProg:""} (${Math.round(elapsed/1000)}s elapsed)`);
          interval = retry>0 ? Math.min(retry,MAX_INTERVAL) : Math.min(interval*BACKOFF,MAX_INTERVAL);
          continue;
        }

        const errBody = await pollRes.json().catch(()=>({}));
        throw new Error(`Poll error HTTP ${pollRes.status}: ${errBody?.issue?.[0]?.diagnostics??"Unexpected response"}`);
      }

    } catch(e) {
      if (cancelRef.current) return;
      stopTick();
      const elapsed = Date.now()-(startRef.current??Date.now());
      const isTimeout = e.message.toLowerCase().includes("timed out");
      jobLog(e.message,"error");
      setJob(j=>({...j,phase:isTimeout?"timeout":"error",elapsed,error:e.message}));
      showToast(e.message,"error");
    }
  }, [hgToken, qry, jobLog, stopTick, showToast]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    stopTick();
    setJob(j=>({...j,phase:"cancelled"}));
    showToast("Query cancelled","warn");
  }, [stopTick, showToast]);

  // ── Phase 1: AI paste parse ─────────────────────────────────────────────────
  const handleParse = useCallback(async () => {
    if (!paste.trim()) { showToast("Paste a document first","warn"); return; }
    setPasteState("loading");
    try {
      const result = await InvokeLLM({
        prompt:`You are a clinical data extraction engine. Extract ALL clinical data from the following document — CCD, C-CDA, discharge summary, or plain text. Return ONLY the structured JSON.\n\nDOCUMENT:\n${paste}`,
        response_json_schema: PARSE_SCHEMA,
      });
      if (!result?.patient) throw new Error("AI returned an unexpected format.");

      // Remap field names to internal shape
      const parsed = {
        patient:     result.patient,
        visits:      (result.visits??[]).map(v=>({date:v.date,cc:v.cc,dx:v.diagnosis,dispo:v.dispo,src:v.source})),
        medications: (result.medications??[]).map(m=>({name:m.name,dose:m.dose,freq:m.frequency,src:m.source})),
        allergies:   (result.allergies??[]).map(a=>({name:a.name,sev:a.severity,rxn:a.reaction,src:a.source})),
        problems:    (result.problems??[]).map(p=>({name:p.name,icd:p.icd10,src:p.source})),
        labs:        (result.labs??[]).map(l=>({name:l.name,val:l.value,ref:l.refRange,flag:l.flag,date:l.date})),
      };

      setData(parsed);
      setSources(["Pasted document · AI parsed"]);
      setTab("visits");
      saveSession(parsed, ["Pasted document"]);
      setPasteState("done");
      showToast("Document parsed successfully","success");
    } catch(e) {
      setPasteState("error");
      showToast(e.message??"Parse failed","error");
    }
  }, [paste, saveSession, showToast]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const jobVisible = job.phase !== "idle";
  const isQuerying = ["submitting","polling"].includes(job.phase);

  const TABS = [
    { id:"visits",    label:"Prior Visits",   count: data?.visits?.length??0         },
    { id:"meds",      label:"Medications",    count: data?.medications?.length??0    },
    { id:"allergies", label:"Allergies",      count: data?.allergies?.length??0      },
    { id:"problems",  label:"Problems",       count: data?.problems?.length??0       },
    { id:"labs",      label:"Labs",           count: data?.labs?.length??0           },
  ].filter(t => !data || t.count > 0 || tab === t.id);

  const authColor = { idle:T.txt4, loading:T.warn, live:T.teal, error:T.coral }[authState];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:FONTS.body, color:T.txt,
      display:"flex", flexDirection:"column" }}>

      <style>{`
        @keyframes lkxSpin    { to { transform:rotate(360deg); } }
        @keyframes lkxPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.6)} }
        @keyframes lkxShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes lkxFadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(0,212,168,0.2); border-radius:2px; }
        input, textarea { caret-color:${T.teal}; }
        input:focus, textarea:focus { outline:none; border-color:${T.borderHi} !important; box-shadow:0 0 0 2px rgba(0,212,168,0.12); }
      `}</style>

      {/* ── Top nav bar ── */}
      <div style={{ ...g(0,{borderRadius:0,borderLeft:"none",borderRight:"none",borderTop:"none"}),
        padding:"0 24px", display:"flex", alignItems:"center", gap:16, height:52, flexShrink:0 }}>
        <span style={{ fontFamily:FONTS.display, fontSize:15, fontWeight:700, color:T.txt,
          letterSpacing:"0.06em" }}>LAKONYX</span>
        <span style={{ fontSize:12, color:T.txt4 }}>/</span>
        <span style={{ fontSize:13, color:T.teal, fontWeight:500 }}>Anamnesis</span>
        <span style={{ fontSize:9, background:`${T.teal}20`, color:T.teal, padding:"2px 7px",
          borderRadius:4, fontWeight:700, letterSpacing:"0.08em" }}>BETA</span>
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Dot color={T.teal} pulse />
          <span style={{ fontSize:11, color:T.txt3 }}>Carequality · CommonWell · TEFCA</span>
        </div>
      </div>

      {/* ── Body: left sidebar + main ── */}
      <div style={{ display:"flex", flex:1, gap:0, overflow:"hidden" }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width:300, flexShrink:0, borderRight:`1px solid ${T.border}`,
          display:"flex", flexDirection:"column", overflowY:"auto" }}>

          {/* Mode toggle */}
          <div style={{ padding:"14px 14px 0" }}>
            <div style={{ display:"flex", background:"rgba(255,255,255,0.03)", borderRadius:8,
              border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:14 }}>
              {[{id:"paste",label:"📋 Paste"},{id:"query",label:"⬡ Network"}].map(m=>(
                <div key={m.id} onClick={()=>setMode(m.id)}
                  style={{ flex:1, textAlign:"center", padding:"8px 0", cursor:"pointer",
                    fontSize:12, fontWeight:600,
                    color:mode===m.id?T.teal:T.txt3,
                    background:mode===m.id?`${T.teal}15`:"transparent",
                    borderRight:m.id==="paste"?`1px solid ${T.border}`:"none",
                    transition:"all .15s" }}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* ── PASTE MODE ── */}
            {mode==="paste" && (
              <div style={{ animation:"lkxFadeIn .2s ease" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.txt3, letterSpacing:"0.07em",
                  textTransform:"uppercase", marginBottom:6 }}>
                  Paste clinical document
                </div>
                <textarea value={paste} onChange={e=>setPaste(e.target.value)}
                  placeholder={"CCD · C-CDA · Discharge summary · Plain text record..."}
                  style={{ width:"100%", minHeight:160, background:"rgba(0,0,0,0.3)",
                    border:`1px solid ${T.border}`, borderRadius:8, padding:"10px",
                    color:T.txt, fontSize:11, fontFamily:FONTS.mono, resize:"vertical",
                    lineHeight:1.6 }}/>
                <div style={{ display:"flex", gap:6, marginTop:8 }}>
                  <div onClick={handleParse}
                    style={{ flex:1, textAlign:"center", padding:"8px 0",
                      background: pasteState==="loading"?`${T.teal}30`:T.teal,
                      color:"#000", borderRadius:7, fontSize:12, fontWeight:700,
                      cursor:"pointer", transition:"all .15s" }}>
                    {pasteState==="loading" ? "⟳ Parsing..." : "✦ Parse with AI"}
                  </div>
                  <div onClick={()=>{setPaste("");setData(null);setPasteState("idle");}}
                    style={{ padding:"8px 12px", background:"rgba(255,255,255,0.04)",
                      border:`1px solid ${T.border}`, borderRadius:7, fontSize:12,
                      color:T.txt3, cursor:"pointer" }}>
                    ✕
                  </div>
                </div>
              </div>
            )}

            {/* ── NETWORK QUERY MODE ── */}
            {mode==="query" && (
              <div style={{ animation:"lkxFadeIn .2s ease" }}>
                {/* Credentials */}
                <div style={{ background:"rgba(0,0,0,0.25)", border:`1px solid ${T.border}`,
                  borderRadius:8, padding:"10px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:T.gold,
                      letterSpacing:"0.07em", textTransform:"uppercase", flex:1 }}>
                      Health Gorilla API
                    </span>
                    <Dot color={authColor} pulse={authState==="loading"}/>
                    <span style={{ fontSize:10, color:authColor, fontWeight:600 }}>
                      {{idle:"Disconnected",loading:"Connecting...",live:"Connected",error:"Failed"}[authState]}
                    </span>
                  </div>
                  <input type="text" value={hgId} onChange={e=>setHgId(e.target.value)}
                    placeholder="Client ID"
                    style={{ width:"100%", marginBottom:6, padding:"6px 8px", background:"rgba(0,0,0,0.3)",
                      border:`1px solid ${T.border}`, borderRadius:6, color:T.txt,
                      fontSize:11, fontFamily:FONTS.body }}/>
                  <input type="password" value={hgSecret} onChange={e=>setHgSecret(e.target.value)}
                    placeholder="Client Secret"
                    style={{ width:"100%", marginBottom:8, padding:"6px 8px", background:"rgba(0,0,0,0.3)",
                      border:`1px solid ${T.border}`, borderRadius:6, color:T.txt,
                      fontSize:11, fontFamily:FONTS.body }}/>
                  <div onClick={handleAuth}
                    style={{ textAlign:"center", padding:"7px", background:T.gold,
                      color:"#000", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                    {authState==="loading"?"⟳ Authenticating...":"🔑 Authenticate"}
                  </div>
                  {authState==="live" && (
                    <div style={{ marginTop:6, fontSize:10, color:T.teal, textAlign:"center" }}>
                      ✓ Token active · sandbox.healthgorilla.com
                    </div>
                  )}
                </div>

                {/* Patient search fields */}
                <div style={{ fontSize:10, fontWeight:700, color:T.txt3,
                  letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6 }}>
                  Patient demographics
                </div>
                {[{k:"lastName",ph:"Last name",lbl:"Last Name"},{k:"firstName",ph:"First name",lbl:"First Name"},
                  {k:"dob",ph:"YYYY-MM-DD",lbl:"Date of Birth"},{k:"mrn",ph:"Optional",lbl:"MRN"}
                ].map(f=>(
                  <div key={f.k} style={{ marginBottom:6 }}>
                    <div style={{ fontSize:9, color:T.txt4, fontWeight:700, letterSpacing:"0.07em",
                      textTransform:"uppercase", marginBottom:3 }}>{f.lbl}</div>
                    <input type="text" value={qry[f.k]} onChange={e=>setQry(q=>({...q,[f.k]:e.target.value}))}
                      placeholder={f.ph}
                      style={{ width:"100%", padding:"6px 8px", background:"rgba(0,0,0,0.3)",
                        border:`1px solid ${T.border}`, borderRadius:6, color:T.txt,
                        fontSize:12, fontFamily:FONTS.body }}/>
                  </div>
                ))}

                <div onClick={handleQuery}
                  style={{ marginTop:10, textAlign:"center", padding:"9px",
                    background: isQuerying?`${T.teal}40`:authState==="live"?T.teal:"rgba(0,212,168,0.3)",
                    color: authState==="live"?"#000":T.txt3,
                    borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer",
                    opacity: isQuerying ? 0.7 : 1, transition:"all .15s" }}>
                  {isQuerying ? "⟳ Querying..." : "⬡ Query Network"}
                </div>
              </div>
            )}
          </div>

          {/* Session history */}
          <div style={{ padding:"16px 14px", flex:1, overflowY:"auto" }}>
            {sessions.length > 0 && (
              <>
                <div style={{ fontSize:10, fontWeight:700, color:T.txt4,
                  letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
                  Session History
                </div>
                {sessions.map(s=>(
                  <SessionItem key={s.id} session={s} active={s.id===activeSession}
                    onClick={()=>{ setData(s.data); setSources(s.sources); setActiveSession(s.id); setTab("visits"); }}/>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto", padding:"16px 20px" }}>

          {/* Polling panel */}
          {jobVisible && (
            <PollingPanel job={job} onCancel={handleCancel} onRetry={()=>{resetJob();handleQuery();}}/>
          )}

          {/* Results */}
          {data ? (
            <div style={{ ...g(12), overflow:"hidden", flex:1, display:"flex", flexDirection:"column",
              animation:"lkxFadeIn .3s ease" }}>

              {/* Patient banner */}
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`,
                display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontFamily:FONTS.display, fontSize:16, fontWeight:700, color:T.txt }}>
                    {data.patient?.firstName} {data.patient?.lastName}
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:3 }}>
                    {data.patient?.dob && <span style={{ fontSize:11, color:T.txt3 }}>DOB: {data.patient.dob}</span>}
                    {data.patient?.mrn && <span style={{ fontSize:11, color:T.txt3 }}>MRN: {data.patient.mrn}</span>}
                  </div>
                </div>
                <div style={{ flex:1 }}/>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {sources.map((s,i)=><Pill key={i} color={T.teal}>{s}</Pill>)}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <CopyBtn text={[
                    `Patient: ${data.patient?.firstName} ${data.patient?.lastName} DOB: ${data.patient?.dob}`,
                    `\nMedications:\n${(data.medications??[]).map(m=>`  ${m.name} ${m.dose} ${m.freq}`).join("\n")}`,
                    `\nAllergies:\n${(data.allergies??[]).map(a=>`  ${a.name} (${a.sev}): ${a.rxn}`).join("\n")}`,
                    `\nProblems:\n${(data.problems??[]).map(p=>`  ${p.name} ${p.icd}`).join("\n")}`,
                  ].join("")} label="Copy All"/>
                  <span style={{ fontSize:11, color:T.txt4, padding:"3px 8px", borderRadius:5,
                    border:`1px solid ${T.border}`, cursor:"pointer",
                    display:"inline-flex", alignItems:"center", gap:4 }}
                    onClick={()=>window.print?.()}>
                    ⎙ Print
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display:"flex", borderBottom:`1px solid ${T.border}` }}>
                {[
                  { label:"Visits",     val: data.visits?.length??0      },
                  { label:"Medications",val: data.medications?.length??0 },
                  { label:"Allergies",  val: data.allergies?.length??0   },
                  { label:"Problems",   val: data.problems?.length??0    },
                  { label:"Labs",       val: data.labs?.length??0        },
                ].map((s,i)=>(
                  <div key={i} style={{ flex:1, padding:"10px 16px",
                    borderRight: i<4?`1px solid ${T.border}`:"none", textAlign:"center" }}>
                    <div style={{ fontFamily:FONTS.mono, fontSize:20, fontWeight:700, color:T.teal }}>{s.val}</div>
                    <div style={{ fontSize:10, color:T.txt4, marginTop:2, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tab bar */}
              <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, padding:"0 16px" }}>
                {TABS.map(t=>(
                  <div key={t.id} onClick={()=>setTab(t.id)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px",
                      cursor:"pointer", fontSize:12, fontWeight:tab===t.id?600:400,
                      color:tab===t.id?T.teal:T.txt3,
                      borderBottom:`2px solid ${tab===t.id?T.teal:"transparent"}`,
                      whiteSpace:"nowrap", transition:"all .12s" }}>
                    {t.label}
                    {t.count>0 && (
                      <span style={{ fontSize:10, fontWeight:700, minWidth:16, height:16,
                        borderRadius:8, background:tab===t.id?T.teal:T.txt4,
                        color:"#000", display:"inline-flex", alignItems:"center",
                        justifyContent:"center", padding:"0 4px" }}>{t.count}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding:"16px", flex:1, overflowY:"auto", minHeight:240 }}>
                {tab==="visits"    && <VisitList    data={data.visits}/>}
                {tab==="meds"      && <MedList      data={data.medications}/>}
                {tab==="allergies" && <AllergyList  data={data.allergies}/>}
                {tab==="problems"  && <ProblemList  data={data.problems}/>}
                {tab==="labs"      && <LabList      data={data.labs}/>}
              </div>

              {/* Footer attribution */}
              <div style={{ padding:"10px 16px", borderTop:`1px solid ${T.border}`,
                display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:10, color:T.txt4 }}>
                  {new Date().toLocaleString()} · FHIR R4 · {sources.join(" · ")}
                </span>
                <div style={{ flex:1 }}/>
                <span style={{ fontSize:10, color:T.teal, fontWeight:600,
                  padding:"3px 9px", borderRadius:5, background:`${T.teal}10`,
                  border:`1px solid ${T.borderHi}` }}>
                  ⬡ Import to NPI coming soon
                </span>
              </div>
            </div>
          ) : (
            /* Empty state */
            !jobVisible && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:16, padding:40, animation:"lkxFadeIn .4s ease" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:`${T.teal}10`,
                  border:`1px solid ${T.borderHi}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:28, color:T.teal, opacity:0.5 }}>⬡</span>
                </div>
                <div style={{ fontFamily:FONTS.display, fontSize:18, color:T.txt2, textAlign:"center" }}>
                  No records loaded
                </div>
                <div style={{ fontSize:13, color:T.txt4, textAlign:"center", maxWidth:380, lineHeight:1.7 }}>
                  Paste a clinical document on the left, or authenticate with Health Gorilla
                  to query Carequality and CommonWell networks.
                </div>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <Pill color={T.teal}>Carequality</Pill>
                  <Pill color={T.teal}>CommonWell</Pill>
                  <Pill color={T.txt4}>TEFCA QHIN</Pill>
                  <Pill color={T.txt4}>CMS Claims</Pill>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999,
          padding:"10px 16px", borderRadius:9, fontSize:12, fontWeight:500,
          fontFamily:FONTS.body, maxWidth:360, animation:"lkxFadeIn .25s ease",
          background: toast.type==="success"?`${T.teal}22`:toast.type==="error"?"rgba(240,96,96,0.2)":toast.type==="warn"?"rgba(232,168,56,0.2)":"rgba(74,158,255,0.2)",
          border:`1px solid ${toast.type==="success"?T.borderHi:toast.type==="error"?"rgba(240,96,96,0.4)":toast.type==="warn"?"rgba(232,168,56,0.4)":"rgba(74,158,255,0.4)"}`,
          color: toast.type==="success"?T.teal:toast.type==="error"?T.coral:toast.type==="warn"?T.warn:T.blue }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}