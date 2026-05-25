// AnamnesisPage.jsx — Lakonyx Anamnesis (lean orchestration layer)
// State, effects, handlers, and layout only.
// All pure logic → @/utils/anamnesisEngines.js
// All UI panels → @/components/anamnesis/AnamnesisComponents.jsx

import { useState, useCallback, useEffect, useRef } from "react";
import { InvokeLLM } from "@/integrations/Core";

import {
  HG_SANDBOX, MAX_POLL_MS, INIT_INTERVAL, MAX_INTERVAL, BACKOFF, sleep,
  PARSE_SCHEMA, parseFHIRBundle,
  hgAuth, hgFindPatient,
  scoreIdentity, extractFHIRDemog,
  normalizeMedList,
  runDDICheck,
  AnamnesisCache, CACHE_TTL_MS, cacheKey, readURLParams,
  createProvRecord, provLog, provAttachMatch, provAttachAttest,
  provAttachResources, provAttachImport,
} from "@/utils/anamnesisEngines";

import {
  T, FONTS, g,
  Pill, Dot, CopyBtn,
  SessionItem, PollingPanel,
  IdentityMatchPanel, DDIPanel, MDMNotePanel, ProvenancePanel,
  VisitList, MedList, AllergyList, ProblemList, LabList, DocumentsTab,
  ClinicalSnapshotStrip, SummaryTab,
  LabTrendList, MedDeltaPanel,
} from "@/components/anamnesis/AnamnesisComponents";
import { HubBridgePanel, detectHubRelevance } from "@/utils/AnamnesisHubBridge.jsx";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AnamnesisPage({ patientSeed=null, autoToken=null, onRecordsLoaded=null }) {

  // ── Mode & credentials ──────────────────────────────────────────────────────
  const [mode,      setMode]      = useState("paste");
  const [hgId,      setHgId]      = useState("");
  const [hgSecret,  setHgSecret]  = useState("");
  const [hgToken,   setHgToken]   = useState(autoToken ?? "");
  const [authState, setAuthState] = useState(autoToken ? "live" : "idle");

  // ── Patient query form ──────────────────────────────────────────────────────
  const [qry, setQry] = useState({
    lastName:  patientSeed?.lastName  ?? "",
    firstName: patientSeed?.firstName ?? "",
    dob:       patientSeed?.dob       ?? "",
    mrn:       patientSeed?.mrn       ?? "",
  });

  // ── Paste ───────────────────────────────────────────────────────────────────
  const [paste,      setPaste]      = useState("");
  const [pasteState, setPasteState] = useState("idle");

  // ── Active results ──────────────────────────────────────────────────────────
  const [data,    setData]    = useState(null);
  const [sources, setSources] = useState([]);
  const [tab,     setTab]     = useState("visits");

  // ── Session history ─────────────────────────────────────────────────────────
  const [sessions,      setSessions]      = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // ── Async job ───────────────────────────────────────────────────────────────
  const [job, setJob] = useState({ phase:"idle", polls:0, elapsed:0, pct:0, bundle:null, log:[], error:null });
  const cancelRef = useRef(false);
  const startRef  = useRef(null);
  const timerRef  = useRef(null);

  // ── Identity match ──────────────────────────────────────────────────────────
  const [matchResult, setMatchResult] = useState(null);
  const [matchDemog,  setMatchDemog]  = useState(null);
  const [attested,    setAttested]    = useState(false);

  // ── DDI ─────────────────────────────────────────────────────────────────────
  const [ddiState,    setDdiState]    = useState(null);
  const [ddiChecking, setDdiChecking] = useState(false);
  const [ddiAcked,    setDdiAcked]    = useState(new Set());

  // ── RxNorm ──────────────────────────────────────────────────────────────────
  const [medNorm,      setMedNorm]      = useState(null);
  const [normChecking, setNormChecking] = useState(false);

  // ── Provenance ──────────────────────────────────────────────────────────────
  const [provRecord,    setProvRecord]    = useState(null);
  const [savedToBase44, setSavedToBase44] = useState(false);

  // ── Auto-query (Priority 6) ──────────────────────────────────────────────────
  const [encounterCtx, setEncounterCtx] = useState(null);
  const [autoPhase,    setAutoPhase]    = useState("idle");
  const [cacheHit,     setCacheHit]     = useState(null);
  const autoFiredRef = useRef(false);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type="info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Job completion → parse → session save ───────────────────────────────────
  useEffect(() => {
    if (job.phase === "complete" && job.bundle) {
      const parsed = parseFHIRBundle(job.bundle);
      setData(parsed);
      setSources(["Health Gorilla · Carequality / CommonWell"]);
      setTab("summary");
      saveSession(parsed, ["Health Gorilla · Carequality"]);
      if (autoPhase === "querying") setAutoPhase("done");
      setProvRecord(prev => prev ? provAttachResources(prev, parsed) : prev);
      showToast(`${job.bundle.entry?.length ?? 0} FHIR resources loaded`, "success");
      if (onRecordsLoaded) onRecordsLoaded(parsed);
    }
  }, [job.phase, job.bundle]);

  // ── DDI check on medications change ─────────────────────────────────────────
  useEffect(() => {
    if (!data?.medications?.length) { setDdiState(null); return; }
    setDdiChecking(true); setDdiState(null); setDdiAcked(new Set());
    runDDICheck(data.medications).then(r => {
      setDdiState(r); setDdiChecking(false);
      if (r.status === "critical") showToast(`⊘ ${r.interactions.filter(i=>i.severity==="critical").length} critical DDI(s)`, "error");
      else if (r.status === "major") showToast(`⚠ ${r.interactions.filter(i=>i.severity==="major").length} major DDI(s)`, "warn");
      else if (r.status === "clean") showToast("✓ No drug interactions detected", "success");
    }).catch(() => setDdiChecking(false));
  }, [data?.medications]);

  // ── RxNorm normalization on medications change ───────────────────────────────
  useEffect(() => {
    if (!data?.medications?.length) { setMedNorm(null); return; }
    setNormChecking(true); setMedNorm(null);
    normalizeMedList(data.medications).then(normed => {
      setMedNorm(normed); setNormChecking(false);
      const seen=new Map(); let dups=0;
      normed.forEach(m=>{const k=m.ingredientRxcui?`rxcui:${m.ingredientRxcui}`:m.ingredientName?`ing:${m.ingredientName}`:`name:${m.cleanedName}`;if(seen.has(k))dups++;else seen.set(k,true);});
      if (dups > 0) showToast(`⬡ ${dups} cross-system duplicate med(s) identified by RxNorm`, "warn");
    }).catch(() => setNormChecking(false));
  }, [data?.medications]);

  // ── Auto-query Priority 6 Effects ──────────────────────────────────────────
  useEffect(() => {
    const seed = patientSeed ?? readURLParams();
    if (!seed) return;
    const demog = { lastName:seed.lastName??"", firstName:seed.firstName??"", dob:seed.dob??"", mrn:seed.mrn??"", encounterID:seed.encounterID??"" };
    setEncounterCtx(demog);
    setQry({ lastName:demog.lastName, firstName:demog.firstName, dob:demog.dob, mrn:demog.mrn });
    setMode("query");
    const key = cacheKey(demog);
    const hit = AnamnesisCache.get(key);
    if (hit && (Date.now()-hit.ts) < CACHE_TTL_MS) { setCacheHit(hit); setAutoPhase("cached"); }
    else setAutoPhase("ready");
  }, []);

  useEffect(() => {
    if (autoPhase !== "cached" || !cacheHit) return;
    setData(cacheHit.data); setSources(cacheHit.sources);
    if (cacheHit.matchResult) setMatchResult(cacheHit.matchResult);
    setTab("summary");
    saveSession(cacheHit.data, cacheHit.sources);
    showToast(`⬡ Records from session cache — ${cacheHit.resourceCount} resources`, "success");
  }, [autoPhase, cacheHit]);

  useEffect(() => {
    if (!encounterCtx || autoPhase !== "ready" || !hgToken || autoFiredRef.current) return;
    autoFiredRef.current = true; setAutoPhase("querying");
    showToast(`⬡ Auto-retrieving records for ${encounterCtx.firstName} ${encounterCtx.lastName}...`, "info");
    const t = setTimeout(() => handleQuery(), 600);
    return () => clearTimeout(t);
  }, [encounterCtx, autoPhase, hgToken]);

  useEffect(() => {
    if (!data || !encounterCtx) return;
    const key = cacheKey(encounterCtx);
    AnamnesisCache.set(key, { data, sources, matchResult, matchDemog, ts:Date.now(),
      resourceCount: (data.visits?.length??0)+(data.medications?.length??0)+(data.labs?.length??0)+(data.problems?.length??0) });
    setAutoPhase("done");
    if (onRecordsLoaded) onRecordsLoaded(data);
  }, [data, encounterCtx]);

  // ── Save session ─────────────────────────────────────────────────────────────
  const saveSession = useCallback((parsed, srcs) => {
    const session = { id:Date.now(), ts:Date.now(), patient:parsed.patient, data:parsed, sources:srcs,
      summary:{ visits:parsed.visits?.length??0, meds:parsed.medications?.length??0, labs:parsed.labs?.length??0 } };
    setSessions(prev => [session, ...prev.slice(0,9)]);
    setActiveSession(session.id);
    // ── Base44 session persistence (uncomment after creating AnamnesisSession entity) ──
    // Stores only de-identified summary — no patient PII.
    // try {
    //   const { AnamnesisSession } = await import("@/api/entities");
    //   await AnamnesisSession.create({
    //     patientHash:   _dHash?.(parsed.patient?.lastName, parsed.patient?.dob) ?? "—",
    //     sourceSystem:  srcs.join(", "),
    //     resourceCount: (parsed.visits?.length??0)+(parsed.medications?.length??0)+(parsed.labs?.length??0)+(parsed.problems?.length??0)+(parsed.allergies?.length??0),
    //     visitCount:    parsed.visits?.length     ?? 0,
    //     medCount:      parsed.medications?.length?? 0,
    //     labCount:      parsed.labs?.length       ?? 0,
    //     queryDate:     new Date().toISOString(),
    //     retrievalMethod: "async-fhir",
    //   });
    // } catch(e) { console.warn("Anamnesis session persistence failed:", e.message); }
  }, []);

  // ── resetJob ─────────────────────────────────────────────────────────────────
  const stopTick = useCallback(() => { if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;} }, []);

  const resetJob = useCallback(() => {
    cancelRef.current = true; stopTick();
    setJob({ phase:"idle", polls:0, elapsed:0, pct:0, bundle:null, log:[], error:null });
    setMatchResult(null); setMatchDemog(null); setAttested(false);
    setDdiState(null); setDdiChecking(false); setDdiAcked(new Set());
    setMedNorm(null); setNormChecking(false);
    setProvRecord(null); setSavedToBase44(false);
    autoFiredRef.current = false;
    if (autoPhase === "querying") setAutoPhase("ready");
  }, [stopTick, autoPhase]);

  // ── HG authenticate ──────────────────────────────────────────────────────────
  const handleAuth = useCallback(async () => {
    if (!hgId||!hgSecret) { showToast("Enter client ID and secret","warn"); return; }
    setAuthState("loading");
    try {
      const tok = await hgAuth(hgId, hgSecret);
      setHgToken(tok); setAuthState("live");
      showToast("Authenticated with Health Gorilla","success");
      if (encounterCtx && autoPhase==="ready" && !autoFiredRef.current) {
        autoFiredRef.current=true; setAutoPhase("querying");
        setTimeout(() => handleQuery(), 400);
      }
    } catch(e) { setAuthState("error"); showToast(e.message,"error"); }
  }, [hgId, hgSecret, showToast, encounterCtx, autoPhase]);

  // ── Network query (async $everything) ────────────────────────────────────────
  const handleQuery = useCallback(async () => {
    if (!hgToken) { showToast("Authenticate first","warn"); return; }
    if (!qry.lastName||!qry.dob) { showToast("Last name and DOB required","warn"); return; }
    cancelRef.current=false; startRef.current=Date.now();
    setData(null); setSources([]);

    const prov = createProvRecord({ retrievalMethod:"async-fhir", networkSources:["Carequality","CommonWell"], fhirEndpoint:HG_SANDBOX.replace("https://",""), encounterCtx });
    setProvRecord(prov); setSavedToBase44(false);

    const jobLog = (msg, level="info") => setJob(j=>({...j,log:[...j.log,{ts:Date.now(),msg,level}]}));
    setJob({ phase:"submitting", polls:0, elapsed:0, pct:10, bundle:null, log:[], error:null });

    timerRef.current = setInterval(() => {
      const ms=Date.now()-startRef.current;
      setJob(j=>({...j,elapsed:ms,pct:Math.round(95*(1-Math.exp(-ms/28000)))}));
    }, 400);

    try {
      jobLog("Searching patient in Health Gorilla...");
      const patient = await hgFindPatient(hgToken, qry);
      if (!patient) throw new Error("No patient found matching those demographics.");
      if (cancelRef.current) return;

      const fhirDemog = extractFHIRDemog(patient);
      const idResult  = scoreIdentity(qry, fhirDemog);
      setMatchResult(idResult); setMatchDemog({ query:{...qry}, fhir:fhirDemog }); setAttested(false);
      setProvRecord(prev => prev ? provAttachMatch(prev, idResult) : prev);

      jobLog(`Identity: ${idResult.score}% — ${idResult.level}`, idResult.level==="BLOCKED"?"error":idResult.level==="CAUTION"?"warn":"info");

      if (!idResult.canView) {
        stopTick();
        setJob(j=>({...j,phase:"error",elapsed:Date.now()-startRef.current,error:`Identity match blocked (score ${idResult.score}%). Verify patient demographics.`}));
        showToast(`⊘ Identity blocked — ${idResult.score}%`, "error"); return;
      }

      jobLog("Submitting async $everything with Prefer: respond-async...");
      setJob(j=>({...j,phase:"submitting",pct:18}));

      const kickoff = await fetch(`${HG_SANDBOX}/fhir/R4/Patient/${patient.id}/$everything`, {
        method:"GET", headers:{ Authorization:`Bearer ${hgToken}`, Accept:"application/fhir+json", Prefer:"respond-async" },
      });
      if (cancelRef.current) return;

      if (kickoff.status === 200) {
        const syncBundle = await kickoff.json(); stopTick();
        const elapsed=Date.now()-startRef.current;
        jobLog(`Sync response · ${syncBundle?.entry?.length??0} resources in ${(elapsed/1000).toFixed(1)}s`,"success");
        setJob(j=>({...j,phase:"complete",pct:100,elapsed,bundle:syncBundle})); return;
      }
      if (kickoff.status !== 202) {
        const body=await kickoff.json().catch(()=>({}));
        throw new Error(`Kickoff failed HTTP ${kickoff.status}: ${body?.issue?.[0]?.diagnostics??"Unknown error"}`);
      }

      const pollUrl = kickoff.headers.get("location")||kickoff.headers.get("content-location");
      if (!pollUrl) throw new Error("Server returned 202 but no Location header.");

      jobLog(`Job accepted · ID: ${pollUrl.split("/").pop()}`);
      jobLog("Polling Carequality & CommonWell networks...");
      setJob(j=>({...j,phase:"polling"}));

      let interval=INIT_INTERVAL, polls=0;
      while (true) {
        if (cancelRef.current) return;
        if (Date.now()-startRef.current >= MAX_POLL_MS) throw new Error("Query timed out after 90s. Consider the P360 async retrieval endpoint for large record sets.");
        await sleep(interval);
        if (cancelRef.current) return;
        polls++; setJob(j=>({...j,polls}));

        const pollRes = await fetch(pollUrl, { headers:{ Authorization:`Bearer ${hgToken}`, Accept:"application/fhir+json" } });
        if (cancelRef.current) return;

        if (pollRes.status === 200) {
          const finalBundle = await pollRes.json(); stopTick();
          const elapsed=Date.now()-startRef.current, count=finalBundle?.entry?.length??0;
          jobLog(`Complete · ${count} resources in ${(elapsed/1000).toFixed(1)}s`,"success");
          setJob(j=>({...j,phase:"complete",pct:100,elapsed,bundle:finalBundle})); return;
        }
        if (pollRes.status === 202) {
          const xProg=pollRes.headers.get("x-progress"), retry=parseInt(pollRes.headers.get("retry-after")??"0",10)*1000;
          jobLog(`Poll #${polls}${xProg?" — "+xProg:""} (${Math.round((Date.now()-startRef.current)/1000)}s elapsed)`);
          interval=retry>0?Math.min(retry,MAX_INTERVAL):Math.min(interval*BACKOFF,MAX_INTERVAL); continue;
        }
        const errBody=await pollRes.json().catch(()=>({}));
        throw new Error(`Poll error HTTP ${pollRes.status}: ${errBody?.issue?.[0]?.diagnostics??"Unexpected response"}`);
      }
    } catch(e) {
      if (cancelRef.current) return;
      stopTick(); const elapsed=Date.now()-(startRef.current??Date.now());
      const isTimeout=e.message.toLowerCase().includes("timed out");
      setJob(j=>({...j,phase:isTimeout?"timeout":"error",elapsed,error:e.message}));
      showToast(e.message,"error");
      if (autoPhase==="querying") setAutoPhase("error");
    }
  }, [hgToken, qry, encounterCtx, stopTick, showToast, autoPhase]);

  const handleCancel = useCallback(() => {
    cancelRef.current=true; stopTick();
    setJob(j=>({...j,phase:"cancelled"}));
    showToast("Query cancelled","warn");
  }, [stopTick, showToast]);

  // ── AI paste parse ───────────────────────────────────────────────────────────
  const handleParse = useCallback(async () => {
    if (!paste.trim()) { showToast("Paste a document first","warn"); return; }
    setPasteState("loading");
    try {
      const result = await InvokeLLM({ prompt:`You are a clinical data extraction engine. Extract ALL clinical data from the following document — CCD, C-CDA, discharge summary, or plain text. Return ONLY the structured JSON.\n\nDOCUMENT:\n${paste}`, response_json_schema:PARSE_SCHEMA });
      if (!result?.patient) throw new Error("AI returned an unexpected format.");
      const parsed = { patient:result.patient, visits:(result.visits??[]).map(v=>({date:v.date,cc:v.cc,dx:v.diagnosis,dispo:v.dispo,src:v.source})), medications:(result.medications??[]).map(m=>({name:m.name,dose:m.dose,freq:m.frequency,src:m.source})), allergies:(result.allergies??[]).map(a=>({name:a.name,sev:a.severity,rxn:a.reaction,src:a.source})), problems:(result.problems??[]).map(p=>({name:p.name,icd:p.icd10,src:p.source})), labs:(result.labs??[]).map(l=>({name:l.name,val:l.value,ref:l.refRange,flag:l.flag,date:l.date})), documents:[] };
      setData(parsed); setSources(["Pasted document · AI parsed"]); setTab("summary");
      saveSession(parsed, ["Pasted document"]);
      const pasteProv = createProvRecord({ retrievalMethod:"paste-ai", networkSources:["Document paste"], fhirEndpoint:"N/A" });
      setProvRecord(provAttachResources(pasteProv, parsed)); setSavedToBase44(false);
      setPasteState("done"); showToast("Document parsed successfully","success");
    } catch(e) { setPasteState("error"); showToast(e.message??"Parse failed","error"); }
  }, [paste, saveSession, showToast]);

  // ── DDI + provenance handlers ─────────────────────────────────────────────────
  const handleDDIAcknowledge = useCallback((key) => { setDdiAcked(prev => new Set([...prev, key])); }, []);

  const handleSaveProvenance = useCallback(async () => {
    if (!provRecord) return;
    // Uncomment after creating AnamnesisProvenanceLog entity in Base44:
    // const { AnamnesisProvenanceLog } = await import("@/api/entities");
    // await AnamnesisProvenanceLog.create({ queryId:provRecord.queryId, ... });
    setSavedToBase44(true);
    showToast(`⬡ Provenance ${provRecord.queryId} ready (create entity to persist)`, "info");
  }, [provRecord, showToast]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isQuerying = ["submitting","polling"].includes(job.phase);
  const authColor  = { idle:T.txt4, loading:T.warn, live:T.teal, error:T.coral }[authState];
  const jobVisible = job.phase !== "idle";

  const TABS = [
    { id:"summary",    label:"Summary",       count:null                         },
    { id:"visits",     label:"Prior Visits",  count:data?.visits?.length??0      },
    { id:"meds",       label:"Medications",   count:data?.medications?.length??0 },
    { id:"allergies",  label:"Allergies",     count:data?.allergies?.length??0   },
    { id:"problems",   label:"Problems",      count:data?.problems?.length??0    },
    { id:"labs",       label:"Labs",          count:data?.labs?.length??0        },
    { id:"documents",  label:"Documents",     count:data?.documents?.length??0   },
    { id:"mdm",        label:"MDM Note",      count:null                         },
    { id:"provenance", label:"Provenance",    count:null                         },
  ].filter(t => !data || ["mdm","provenance","summary"].includes(t.id) || (t.count??0)>0 || tab===t.id);

  const tabColor  = id => id==="summary"?"#a78bfa":id==="mdm"?T.gold:id==="provenance"?T.violet:id==="documents"?T.blue:T.teal;
  const tabBorder = id => {
    const active = tab===id;
    if (id==="summary")    return active?"#a78bfa":"transparent";
    if (id==="mdm")        return active?T.gold:"transparent";
    if (id==="provenance") return active?T.violet:"transparent";
    if (id==="documents")  return active?T.blue:"transparent";
    return active?T.teal:"transparent";
  };
  const ddiCritCount = ddiState?.interactions?.filter(i=>i.severity==="critical").length??0;
  const ddiMajCount  = ddiState?.interactions?.filter(i=>i.severity==="major").length??0;
  const normDupCount = (() => { const seen=new Map();let d=0;(medNorm??[]).forEach(m=>{const k=m.ingredientRxcui?`rxcui:${m.ingredientRxcui}`:m.ingredientName?`ing:${m.ingredientName}`:`name:${m.cleanedName}`;if(seen.has(k))d++;else seen.set(k,true);});return d; })();

  const selSty = { background:"rgba(0,0,0,0.35)", border:`1px solid ${T.border}`, borderRadius:6, padding:"6px 8px", color:T.txt, fontSize:11, fontFamily:FONTS.body, outline:"none" };
  const inp    = { width:"100%", background:"rgba(0,0,0,0.3)", border:`1px solid ${T.border}`, borderRadius:6, padding:"6px 8px", color:T.txt, fontSize:12, fontFamily:FONTS.body };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:FONTS.body, color:T.txt, display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes lkxSpin    { to { transform:rotate(360deg); } }
        @keyframes lkxPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.6)} }
        @keyframes lkxShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes lkxFadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        *{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(0,212,168,0.2);border-radius:2px;}
        input,textarea{caret-color:${T.teal};} input:focus,textarea:focus{outline:none;border-color:${T.borderHi}!important;box-shadow:0 0 0 2px rgba(0,212,168,0.12);}
      `}</style>

      {/* ── Nav bar ── */}
      <div style={{ ...g(0,{borderRadius:0,borderLeft:"none",borderRight:"none",borderTop:"none"}), padding:"0 24px", display:"flex", alignItems:"center", gap:0, height:56, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginRight:20 }}>
          <span style={{ fontFamily:FONTS.display, fontSize:14, fontWeight:700, color:T.txt, letterSpacing:"0.1em", textTransform:"uppercase" }}>LAKONYX</span>
          <span style={{ fontSize:11, color:T.txt4 }}>/</span>
          <span style={{ fontFamily:FONTS.display, fontSize:17, fontWeight:700, color:T.teal, letterSpacing:"0.04em" }}>Anamnesis</span>
        </div>
        <span style={{ fontSize:10, color:T.txt4, fontStyle:"italic", borderLeft:`1px solid ${T.border}`, paddingLeft:16, letterSpacing:"0.02em" }}>Complete patient history, instantly.</span>
        <span style={{ marginLeft:10, fontSize:9, background:`${T.teal}20`, color:T.teal, padding:"2px 7px", borderRadius:4, fontWeight:700, letterSpacing:"0.08em" }}>BETA</span>
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {encounterCtx && (
            <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:600,
              background:["done","cached"].includes(autoPhase)?`${T.teal}15`:autoPhase==="querying"?"rgba(255,255,255,0.06)":autoPhase==="error"?"rgba(240,96,96,0.12)":"rgba(232,184,75,0.12)",
              border:`1px solid ${["done","cached"].includes(autoPhase)?T.borderHi:autoPhase==="querying"?"rgba(255,255,255,0.1)":autoPhase==="error"?"rgba(240,96,96,0.3)":"rgba(232,184,75,0.25)"}`,
              color:["done","cached"].includes(autoPhase)?T.teal:autoPhase==="querying"?T.txt3:autoPhase==="error"?T.coral:T.gold }}>
              {autoPhase==="querying"&&<span style={{width:8,height:8,borderRadius:"50%",border:`1.5px solid ${T.txt4}44`,borderTop:`1.5px solid ${T.txt3}`,display:"inline-block",animation:"lkxSpin .85s linear infinite"}}/>}
              {["done","cached"].includes(autoPhase)&&<span>✓</span>}{autoPhase==="ready"&&<span>⬡</span>}{autoPhase==="error"&&<span>⚠</span>}
              <span>{autoPhase==="cached"&&`Cached · ${encounterCtx.firstName} ${encounterCtx.lastName}`}{autoPhase==="ready"&&`Ready · ${encounterCtx.firstName} ${encounterCtx.lastName}`}{autoPhase==="querying"&&`Retrieving · ${encounterCtx.lastName}...`}{autoPhase==="done"&&`Loaded · ${encounterCtx.firstName} ${encounterCtx.lastName}`}{autoPhase==="error"&&`Failed · ${encounterCtx.lastName}`}</span>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}><Dot color={T.teal} pulse/><span style={{ fontSize:11, color:T.txt3 }}>Carequality · CommonWell · TEFCA</span></div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Left sidebar */}
        <div style={{ width:300, flexShrink:0, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"14px 14px 0" }}>

            {/* Encounter context banner */}
            {encounterCtx && (
              <div style={{ margin:"0 0 12px", padding:"10px 12px", borderRadius:8, animation:"lkxFadeIn .3s ease",
                background:["done","cached"].includes(autoPhase)?`${T.teal}08`:"rgba(232,184,75,0.08)",
                border:`1px solid ${["done","cached"].includes(autoPhase)?T.borderHi:"rgba(232,184,75,0.25)"}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:["done","cached"].includes(autoPhase)?T.teal:T.gold }}>⬡ Encounter Context</span>
                  {autoPhase==="cached"&&<Pill color={T.teal}>Cached</Pill>}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:T.txt }}>{encounterCtx.firstName} {encounterCtx.lastName}</div>
                <div style={{ fontSize:11, color:T.txt3, marginTop:2 }}>DOB: {encounterCtx.dob}{encounterCtx.mrn&&` · MRN: ${encounterCtx.mrn}`}</div>
                {encounterCtx.encounterID&&<div style={{ fontSize:10, color:T.txt4, marginTop:2, fontFamily:FONTS.mono }}>Encounter: {encounterCtx.encounterID}</div>}
                {autoPhase==="ready"&&(
                  <div style={{ marginTop:8 }}>
                    {!hgToken?<div style={{ fontSize:10, color:T.gold, lineHeight:1.5 }}>Authenticate with Health Gorilla below to auto-retrieve records.</div>:
                    <div onClick={()=>{autoFiredRef.current=true;setAutoPhase("querying");handleQuery();}} style={{ textAlign:"center", padding:"7px", borderRadius:6, cursor:"pointer", background:`${T.teal}20`, color:T.teal, fontSize:11, fontWeight:700, border:`1px solid ${T.borderHi}` }}>⬡ Retrieve Records Now</div>}
                  </div>
                )}
                {autoPhase==="cached"&&cacheHit&&<div style={{ fontSize:9, color:T.txt4, marginTop:6 }}>Loaded {cacheHit.resourceCount} resources ({Math.round((Date.now()-cacheHit.ts)/60000)} min ago) · <span onClick={()=>{const k=cacheKey(encounterCtx);AnamnesisCache.delete(k);setCacheHit(null);setAutoPhase("ready");setData(null);resetJob();}} style={{ color:T.teal, cursor:"pointer" }}>Refresh</span></div>}
              </div>
            )}

            {/* Mode toggle */}
            <div style={{ display:"flex", background:"rgba(255,255,255,0.03)", borderRadius:8, border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:14 }}>
              {[{id:"paste",label:"📋 Paste Record"},{id:"query",label:"⬡ Query Network"}].map(m=>(
                <div key={m.id} onClick={()=>setMode(m.id)} style={{ flex:1, textAlign:"center", padding:"8px 0", cursor:"pointer", fontSize:12, fontWeight:600, color:mode===m.id?T.teal:T.txt3, background:mode===m.id?`${T.teal}15`:"transparent", borderRight:m.id==="paste"?`1px solid ${T.border}`:"none", transition:"all .15s" }}>{m.label}</div>
              ))}
            </div>

            {/* Paste mode */}
            {mode==="paste" && (
              <div style={{ animation:"lkxFadeIn .2s ease" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.txt3, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6 }}>Paste clinical document</div>
                <textarea value={paste} onChange={e=>setPaste(e.target.value)} placeholder={"CCD · C-CDA · Discharge summary · Plain text — Anamnesis will extract the full clinical record..."} style={{ width:"100%", minHeight:160, background:"rgba(0,0,0,0.3)", border:`1px solid ${T.border}`, borderRadius:8, padding:10, color:T.txt, fontSize:11, fontFamily:FONTS.mono, resize:"vertical", lineHeight:1.6 }}/>
                <div style={{ display:"flex", gap:6, marginTop:8 }}>
                  <div onClick={handleParse} style={{ flex:1, textAlign:"center", padding:"8px 0", background:pasteState==="loading"?`${T.teal}30`:T.teal, color:"#000", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>{pasteState==="loading"?"⟳ Extracting...":"⬡ Extract with Anamnesis"}</div>
                  <div onClick={()=>{setPaste("");setData(null);setPasteState("idle");}} style={{ padding:"8px 12px", background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:7, fontSize:12, color:T.txt3, cursor:"pointer" }}>✕</div>
                </div>
              </div>
            )}

            {/* Query mode */}
            {mode==="query" && (
              <div style={{ animation:"lkxFadeIn .2s ease" }}>
                <div style={{ background:"rgba(0,0,0,0.25)", border:`1px solid ${T.border}`, borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:T.gold, letterSpacing:"0.07em", textTransform:"uppercase", flex:1 }}>Health Gorilla API</span>
                    <Dot color={authColor} pulse={authState==="loading"}/><span style={{ fontSize:10, color:authColor, fontWeight:600 }}>{{idle:"Disconnected",loading:"Connecting...",live:"Connected",error:"Failed"}[authState]}</span>
                  </div>
                  <input type="text" value={hgId} onChange={e=>setHgId(e.target.value)} placeholder="Client ID" style={{ ...inp, marginBottom:6 }}/>
                  <input type="password" value={hgSecret} onChange={e=>setHgSecret(e.target.value)} placeholder="Client Secret" style={{ ...inp, marginBottom:8 }}/>
                  <div onClick={handleAuth} style={{ textAlign:"center", padding:"7px", background:T.gold, color:"#000", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>{authState==="loading"?"⟳ Authenticating...":"🔑 Authenticate"}</div>
                  {authState==="live"&&<div style={{ marginTop:6, fontSize:10, color:T.teal, textAlign:"center" }}>✓ Token active · sandbox.healthgorilla.com</div>}
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:T.txt3, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6 }}>Patient demographics</div>
                {[{k:"lastName",ph:"Last name"},{k:"firstName",ph:"First name"},{k:"dob",ph:"YYYY-MM-DD"},{k:"mrn",ph:"MRN (optional)"}].map(f=>(
                  <input key={f.k} type="text" value={qry[f.k]} onChange={e=>setQry(q=>({...q,[f.k]:e.target.value}))} placeholder={f.ph} style={{ ...inp, marginBottom:6 }}/>
                ))}
                <div onClick={handleQuery} style={{ marginTop:4, textAlign:"center", padding:"9px", background:isQuerying?`${T.teal}40`:authState==="live"?T.teal:"rgba(0,212,168,0.3)", color:authState==="live"?"#000":T.txt3, borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", opacity:isQuerying?0.7:1 }}>{isQuerying?"⟳ Retrieving...":"⬡ Retrieve via Anamnesis"}</div>
              </div>
            )}
          </div>

          {/* Session history */}
          <div style={{ padding:"16px 14px", flex:1, overflowY:"auto" }}>
            {sessions.length>0&&(<>
              <div style={{ fontSize:10, fontWeight:700, color:T.txt4, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>Anamnesis Session History</div>
              {sessions.map(s=><SessionItem key={s.id} session={s} active={s.id===activeSession} onClick={()=>{setData(s.data);setSources(s.sources);setActiveSession(s.id);setTab("visits");}}/>)}
            </>)}
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto", padding:"16px 20px" }}>

          {jobVisible && <PollingPanel job={job} onCancel={handleCancel} onRetry={()=>{resetJob();handleQuery();}}/>}

          {matchResult && (
            <IdentityMatchPanel result={matchResult} queryDemog={matchDemog?.query} fhirDemog={matchDemog?.fhir} attested={attested}
              onAttest={()=>{ setAttested(v=>!v); if(!attested) setProvRecord(prev=>prev?provAttachAttest(prev):prev); }}/>
          )}

          {data && matchResult?.canView !== false ? (
            <div style={{ ...g(12), overflow:"hidden", flex:1, display:"flex", flexDirection:"column", animation:"lkxFadeIn .3s ease" }}>

              {/* Patient banner */}
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontFamily:FONTS.display, fontSize:16, fontWeight:700, color:T.txt }}>{data.patient?.firstName} {data.patient?.lastName}</div>
                  <div style={{ display:"flex", gap:10, marginTop:3 }}>
                    {data.patient?.dob&&<span style={{ fontSize:11, color:T.txt3 }}>DOB: {data.patient.dob}</span>}
                    {data.patient?.mrn&&<span style={{ fontSize:11, color:T.txt3 }}>MRN: {data.patient.mrn}</span>}
                  </div>
                </div>
                <div style={{ flex:1 }}/>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{sources.map((s,i)=><Pill key={i} color={T.teal}>{s}</Pill>)}</div>
                <div style={{ display:"flex", gap:6 }}>
                  <CopyBtn text={[`Patient: ${data.patient?.firstName} ${data.patient?.lastName} DOB: ${data.patient?.dob}`,`\nMedications:\n${(data.medications??[]).map(m=>`  ${m.name} ${m.dose||""} ${m.freq||""}`).join("\n")}`,`\nAllergies:\n${(data.allergies??[]).map(a=>`  ${a.name} (${a.sev}): ${a.rxn}`).join("\n")}`,`\nProblems:\n${(data.problems??[]).map(p=>`  ${p.name} ${p.icd}`).join("\n")}`].join("")} label="Copy All"/>
                  <span onClick={()=>window.print?.()} style={{ fontSize:11, color:T.txt4, padding:"3px 8px", borderRadius:5, border:`1px solid ${T.border}`, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>⎙ Print</span>
                </div>
              </div>

              {/* Clinical Snapshot Strip — always visible, zero API calls */}
              <ClinicalSnapshotStrip
                data={data} ddiState={ddiState} medNorm={medNorm}
                onNavigate={id => setTab(id)}
              />

              {/* Stats row */}
              <div style={{ display:"flex", borderBottom:`1px solid ${T.border}` }}>
                {[{label:"Visits",val:data.visits?.length??0},{label:"Medications",val:data.medications?.length??0},{label:"Allergies",val:data.allergies?.length??0},{label:"Problems",val:data.problems?.length??0},{label:"Labs",val:data.labs?.length??0},{label:"Documents",val:data.documents?.length??0,color:T.blue}].map((s,i,arr)=>(
                  <div key={i} onClick={()=>s.val>0&&setTab(["visits","meds","allergies","problems","labs","documents"][i])} style={{ flex:1, padding:"10px 16px", borderRight:i<arr.length-1?`1px solid ${T.border}`:"none", textAlign:"center", cursor:s.val>0?"pointer":"default" }}>
                    <div style={{ fontFamily:FONTS.mono, fontSize:18, fontWeight:700, color:s.color??T.teal }}>{s.val}</div>
                    <div style={{ fontSize:9, color:T.txt4, marginTop:2, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tab bar */}
              <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, padding:"0 16px", overflowX:"auto" }}>
                {TABS.map(t=>(
                  <div key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px", cursor:"pointer", fontSize:12, fontWeight:tab===t.id?600:400, color:tab===t.id?tabColor(t.id):T.txt3, borderBottom:`2px solid ${tabBorder(t.id)}`, whiteSpace:"nowrap",
                    borderLeft:(t.id==="mdm"||t.id==="provenance")?`1px solid ${T.border}`:"none",
                    marginLeft:t.id==="mdm"?"auto":"0", transition:"all .12s" }}>
                    {t.label}
                    {(t.count??0)>0&&<span style={{ fontSize:10, fontWeight:700, minWidth:16, height:16, borderRadius:8, background:tab===t.id?tabColor(t.id):T.txt4, color:"#000", display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{t.count}</span>}
                    {t.id==="summary"    && <span style={{ fontSize:10, color:tab==="summary"?"#a78bfa":T.txt4 }}>✦</span>}
                    {t.id==="meds"&&(ddiChecking||(ddiState&&ddiState.status!=="ok"))&&<span style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:10, background:ddiChecking?"rgba(255,255,255,0.08)":ddiState?.status==="critical"?"rgba(240,96,96,0.2)":ddiState?.status==="major"?"rgba(232,168,56,0.2)":`${T.teal}20`, color:ddiChecking?T.txt4:ddiState?.status==="critical"?T.coral:ddiState?.status==="major"?T.warn:T.teal }}>{ddiChecking?"…":ddiState?.status==="clean"?"✓ DDI":ddiState?.status==="critical"?`⊘ ${ddiCritCount} critical`:ddiState?.status==="major"?`⚠ ${ddiMajCount} major`:`! ${ddiState?.interactions?.length} DDI`}</span>}
                    {t.id==="meds"&&(normChecking||medNorm)&&<span style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:10, background:normChecking?"rgba(255,255,255,0.06)":normDupCount>0?"rgba(232,184,75,0.15)":`${T.teal}12`, color:normChecking?T.txt4:normDupCount>0?T.gold:T.teal }}>{normChecking?"⬡…":normDupCount>0?`⬡ ${normDupCount} dup`:"⬡ RxNorm ✓"}</span>}
                    {t.id==="mdm"       && <span style={{ fontSize:10, color:tab==="mdm"?T.gold:T.txt4 }}>⬡</span>}
                    {t.id==="provenance"&& <span style={{ fontSize:10, color:tab==="provenance"?T.violet:T.txt4 }}>{provRecord?(savedToBase44?"✓":"○"):"○"}</span>}
                    {t.id==="documents" && tab==="documents"&&<span style={{ fontSize:10, color:T.blue }}>📄</span>}
                  </div>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding:"16px", flex:1, overflowY:"auto", minHeight:240 }}>
                {tab==="summary"   && <SummaryTab data={data} ddiState={ddiState} medNorm={medNorm} sources={sources} matchResult={matchResult}/>}
                {tab==="visits"    && <VisitList    data={data.visits}/>}
                {tab==="meds"      && <><DDIPanel ddiState={ddiState} checking={ddiChecking} acknowledged={ddiAcked} onAcknowledge={handleDDIAcknowledge}/><MedDeltaPanel medications={data.medications} medNorm={medNorm} visits={data.visits}/><MedList data={data.medications} normData={medNorm}/></>}
                {tab==="allergies" && <AllergyList  data={data.allergies}/>}
                {tab==="problems"  && <ProblemList  data={data.problems}/>}
                {tab==="labs"      && <LabTrendList  data={data.labs}/>}
                {tab==="documents" && <DocumentsTab documents={data.documents??[]} hgToken={hgToken} onParseCCDA={txt=>{setPaste(txt);setMode("paste");setTab("visits");showToast("⬡ C-CDA loaded — click Extract with Anamnesis","info");}}/>}
                {tab==="mdm"       && <MDMNotePanel data={data} sources={sources} ddiState={ddiState} medNorm={medNorm}/>}
                {tab==="provenance" && <ProvenancePanel provRecord={provRecord} attested={attested} onSaveToBase44={handleSaveProvenance} savedToBase44={savedToBase44}/>}
              </div>

              {/* Footer */}
              <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:data?8:0 }}>
                  <span style={{ fontSize:10, color:T.txt4 }}>Lakonyx Anamnesis · {new Date().toLocaleString()} · FHIR R4 · {sources.join(" · ")}</span>
                  <div style={{ flex:1 }}/>
                  <span style={{ fontSize:10, color:matchResult?.canImport||(matchResult?.requiresAttestation&&attested)?T.teal:T.txt4, fontWeight:600, padding:"3px 9px", borderRadius:5, background:matchResult?.canImport||(matchResult?.requiresAttestation&&attested)?`${T.teal}10`:"rgba(255,255,255,0.04)", border:`1px solid ${matchResult?.canImport||(matchResult?.requiresAttestation&&attested)?T.borderHi:T.border}` }}>
                    {matchResult?.level==="BLOCKED"?"⊘ Import blocked":matchResult?.requiresAttestation&&!attested?"! Attest identity to import":"⬡ Anamnesis → NPI import coming soon"}
                  </span>
                </div>
                {data && <HubBridgePanel data={data} medNorm={medNorm} ddiState={ddiState}/>}
              </div>
            </div>
          ) : (
            !jobVisible&&!matchResult&&(
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:40, animation:"lkxFadeIn .4s ease" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:`${T.teal}10`, border:`1px solid ${T.borderHi}`, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:28, color:T.teal, opacity:0.5 }}>⬡</span></div>
                <div style={{ fontFamily:FONTS.display, fontSize:20, color:T.txt2, textAlign:"center" }}>Anamnesis</div>
                <div style={{ fontFamily:FONTS.body, fontSize:12, color:T.txt4, letterSpacing:"0.06em", textTransform:"uppercase", marginTop:-8 }}>Clinical Record Intelligence</div>
                <div style={{ fontSize:13, color:T.txt4, textAlign:"center", maxWidth:380, lineHeight:1.7 }}>Paste a clinical document to extract the full patient history, or authenticate with Health Gorilla to query Carequality, CommonWell, and TEFCA networks in real time.</div>
                <div style={{ display:"flex", gap:8 }}><Pill color={T.teal}>Carequality</Pill><Pill color={T.teal}>CommonWell</Pill><Pill color={T.txt4}>TEFCA QHIN</Pill><Pill color={T.txt4}>CMS Claims</Pill></div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Toast */}
      {toast&&<div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, padding:"10px 16px", borderRadius:9, fontSize:12, fontWeight:500, fontFamily:FONTS.body, maxWidth:360, animation:"lkxFadeIn .25s ease", background:toast.type==="success"?`${T.teal}22`:toast.type==="error"?"rgba(240,96,96,0.2)":toast.type==="warn"?"rgba(232,168,56,0.2)":"rgba(74,158,255,0.2)", border:`1px solid ${toast.type==="success"?T.borderHi:toast.type==="error"?"rgba(240,96,96,0.4)":toast.type==="warn"?"rgba(232,168,56,0.4)":"rgba(74,158,255,0.4)"}`, color:toast.type==="success"?T.teal:toast.type==="error"?T.coral:toast.type==="warn"?T.warn:T.blue }}>{toast.msg}</div>}
    </div>
  );
}