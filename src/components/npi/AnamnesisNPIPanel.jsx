// AnamnesisNPIPanel.jsx
// Compact embedded Anamnesis panel for NewPatientInput (NPI/QuickNote).
// Place at: @/components/npi/AnamnesisNPIPanel.jsx

import { useState, useCallback, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  HG_SANDBOX, MAX_POLL_MS, INIT_INTERVAL, MAX_INTERVAL, BACKOFF, sleep,
  PARSE_SCHEMA, parseFHIRBundle, hgAuth, hgFindPatient,
  scoreIdentity, extractFHIRDemog, normalizeMedList, runDDICheck,
  AnamnesisCache, CACHE_TTL_MS, cacheKey,
} from "@/utils/anamnesisEngines";

const T = {
  bg:"#060f1c", panel:"#0a1828",
  teal:"#00d4a8", gold:"#e8b84b", coral:"#f06060",
  blue:"#4a9eff", warn:"#e8a838", violet:"#9b7de8",
  txt:"#e8f0fb", txt2:"#9ab8d8", txt3:"#5e88b0", txt4:"#3a5f80",
  border:"rgba(0,212,168,0.13)", borderHi:"rgba(0,212,168,0.32)",
};
const FONTS = { body:"'DM Sans', system-ui, sans-serif", mono:"'JetBrains Mono', monospace" };

function ImportToggle({ label, count, checked, onToggle, color }) {
  if (!count) return null;
  return (
    <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
      borderRadius:7, cursor:"pointer", marginBottom:4,
      background:checked?`${color||T.teal}12`:"rgba(255,255,255,0.03)",
      border:`1px solid ${checked?color||T.borderHi:T.border}`, transition:"all .15s" }}>
      <div style={{ width:16, height:16, borderRadius:3, border:`2px solid ${checked?T.teal:"rgba(0,212,168,0.3)"}`,
        background:checked?`${T.teal}25`:"transparent", display:"flex", alignItems:"center",
        justifyContent:"center", flexShrink:0 }}>
        {checked && <span style={{ fontSize:10, color:T.teal, lineHeight:1 }}>✓</span>}
      </div>
      <span style={{ fontSize:12, color:checked?T.txt:T.txt3, flex:1 }}>{label}</span>
      <span style={{ fontFamily:FONTS.mono, fontSize:11, fontWeight:700, color:T.teal }}>{count}</span>
    </div>
  );
}

export default function AnamnesisNPIPanel({ patientSeed=null, autoToken=null, onImport=null, onClose=null }) {

  const [hgId,      setHgId]      = useState("");
  const [hgSecret,  setHgSecret]  = useState("");
  const [hgToken,   setHgToken]   = useState(autoToken ?? "");
  const [authState, setAuthState] = useState(autoToken?"live":"idle");

  const [phase,    setPhase]    = useState("idle");
  const [status,   setStatus]   = useState("");
  const [data,     setData]     = useState(null);
  const [idResult, setIdResult] = useState(null);
  const [ddiState, setDdiState] = useState(null);

  const [sel, setSel] = useState({ medications:true, allergies:true, problems:true, visits:false, labs:false });

  const cancelRef = useRef(false);
  const inp = { width:"100%", background:"rgba(0,0,0,0.3)", border:`1px solid ${T.border}`,
    borderRadius:6, padding:"6px 8px", color:T.txt, fontSize:11, fontFamily:FONTS.body,
    outline:"none", boxSizing:"border-box" };

  // Check session cache on mount
  useEffect(() => {
    if (!patientSeed) return;
    const key = cacheKey(patientSeed);
    const hit  = AnamnesisCache.get(key);
    if (hit && (Date.now()-hit.ts) < CACHE_TTL_MS) {
      setData(hit.data);
      setPhase("review");
      setStatus(`⬡ Restored from session cache · ${hit.resourceCount} resources`);
      if (hit.matchResult) setIdResult(hit.matchResult);
    }
  }, []);

  const handleAuth = useCallback(async () => {
    if (!hgId||!hgSecret) return;
    setAuthState("loading");
    try {
      const tok = await hgAuth(hgId, hgSecret);
      setHgToken(tok); setAuthState("live");
    } catch(e) { setAuthState("error"); }
  }, [hgId, hgSecret]);

  const handleQuery = useCallback(async () => {
    if (!hgToken || !patientSeed?.lastName || !patientSeed?.dob) return;
    cancelRef.current = false;
    setPhase("loading"); setStatus("Searching patient in Health Gorilla...");

    try {
      const patient = await hgFindPatient(hgToken, patientSeed);
      if (!patient) throw new Error("No patient found matching those demographics.");
      if (cancelRef.current) return;

      const fhirDemog = extractFHIRDemog(patient);
      const id        = scoreIdentity(patientSeed, fhirDemog);
      setIdResult(id);
      setPhase("identity");
      setStatus(`Identity: ${id.score}% — ${id.level}`);
      if (!id.canView) { setPhase("error"); return; }

      setStatus("Submitting async $everything...");
      const kickoff = await fetch(`${HG_SANDBOX}/fhir/R4/Patient/${patient.id}/$everything`, {
        method:"GET", headers:{ Authorization:`Bearer ${hgToken}`, Accept:"application/fhir+json", Prefer:"respond-async" },
      });
      if (cancelRef.current) return;

      let bundle = null;
      if (kickoff.status === 200) {
        bundle = await kickoff.json();
      } else if (kickoff.status === 202) {
        const pollUrl = kickoff.headers.get("location")||kickoff.headers.get("content-location");
        if (!pollUrl) throw new Error("No Location header returned.");
        let interval = INIT_INTERVAL, start = Date.now();
        setStatus("Polling Carequality & CommonWell...");
        while (true) {
          if (cancelRef.current) return;
          if (Date.now()-start >= MAX_POLL_MS) throw new Error("Query timed out.");
          await sleep(interval);
          if (cancelRef.current) return;
          const res = await fetch(pollUrl,{headers:{Authorization:`Bearer ${hgToken}`,Accept:"application/fhir+json"}});
          if (res.status===200) { bundle=await res.json(); break; }
          if (res.status===202) { interval=Math.min(interval*BACKOFF,MAX_INTERVAL); continue; }
          throw new Error(`Poll error HTTP ${res.status}`);
        }
      } else {
        throw new Error(`Kickoff HTTP ${kickoff.status}`);
      }

      const parsed = parseFHIRBundle(bundle);
      setData(parsed);
      AnamnesisCache.set(cacheKey(patientSeed), {
        data:parsed, sources:["Health Gorilla"], matchResult:id,
        ts:Date.now(), resourceCount:bundle.entry?.length??0
      });
      if (parsed.medications?.length) {
        runDDICheck(parsed.medications).then(r => setDdiState(r)).catch(()=>{});
      }
      setPhase("review");
      setStatus(`✓ ${bundle.entry?.length??0} resources loaded`);
    } catch(e) {
      if (cancelRef.current) return;
      setPhase("error"); setStatus(e.message??"Query failed");
    }
  }, [hgToken, patientSeed]);

  const handleImport = useCallback(() => {
    if (!data || !onImport) return;
    onImport({
      medications: sel.medications ? data.medications : [],
      allergies:   sel.allergies   ? data.allergies   : [],
      problems:    sel.problems    ? data.problems     : [],
      visits:      sel.visits      ? data.visits       : [],
      labs:        sel.labs        ? data.labs         : [],
      patient:     data.patient,
      ddiState,
    });
    setPhase("done");
  }, [data, sel, ddiState, onImport]);

  const critDDIs = ddiState?.interactions?.filter(i=>i.severity==="critical")??[];
  const authColor = {idle:T.txt4,loading:T.warn,live:T.teal,error:T.coral}[authState];

  return (
    <div style={{ borderRadius:10, overflow:"hidden", background:T.panel, border:`1px solid ${T.borderHi}`,
      fontFamily:FONTS.body, animation:"lkxFadeIn .25s ease" }}>
      <style>{`@keyframes lkxFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes lkxSpin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
        borderBottom:`1px solid ${T.border}`, background:`${T.teal}08` }}>
        <span style={{ fontSize:13, fontWeight:700, color:T.teal, fontFamily:"'Playfair Display',serif",
          letterSpacing:"0.03em" }}>⬡ Anamnesis</span>
        <span style={{ fontSize:10, color:T.txt4, flex:1 }}>External record retrieval</span>
        {patientSeed?.lastName && (
          <span style={{ fontSize:10, color:T.teal, padding:"2px 7px", borderRadius:10,
            background:`${T.teal}15`, border:`1px solid ${T.borderHi}` }}>
            {patientSeed.lastName}, {patientSeed.firstName} · {patientSeed.dob}
          </span>
        )}
        {onClose && (
          <span onClick={onClose} style={{ fontSize:14, color:T.txt4, cursor:"pointer", padding:"0 4px" }}>✕</span>
        )}
      </div>

      <div style={{ padding:"14px" }}>

        {/* Auth section */}
        {authState!=="live" && !["review","done"].includes(phase) && (
          <div style={{ marginBottom:12, padding:"10px 12px", borderRadius:8,
            background:"rgba(0,0,0,0.25)", border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ fontSize:10, fontWeight:700, color:T.gold, letterSpacing:"0.07em",
                textTransform:"uppercase", flex:1 }}>Health Gorilla Auth</span>
              <span style={{ width:6, height:6, borderRadius:"50%", background:authColor }}/>
              <span style={{ fontSize:10, color:authColor }}>{authState==="error"?"Failed":"Not connected"}</span>
            </div>
            <input type="text"     value={hgId}    onChange={e=>setHgId(e.target.value)}    placeholder="Client ID"     style={{...inp,marginBottom:5}}/>
            <input type="password" value={hgSecret} onChange={e=>setHgSecret(e.target.value)} placeholder="Client Secret" style={{...inp,marginBottom:8}}/>
            <div onClick={handleAuth} style={{ textAlign:"center", padding:"7px", borderRadius:6, cursor:"pointer",
              background:T.gold, color:"#000", fontSize:11, fontWeight:700 }}>
              {authState==="loading"?"⟳ Connecting...":"🔑 Authenticate"}
            </div>
          </div>
        )}

        {/* Status line */}
        {status && (
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px",
            borderRadius:7, marginBottom:10,
            background: phase==="error"?"rgba(240,96,96,0.08)":phase==="review"?`${T.teal}08`:"rgba(255,255,255,0.04)",
            border:`1px solid ${phase==="error"?"rgba(240,96,96,0.25)":phase==="review"?T.borderHi:T.border}` }}>
            {phase==="loading" && <span style={{ width:10,height:10,borderRadius:"50%",border:`1.5px solid ${T.teal}33`,
              borderTop:`1.5px solid ${T.teal}`,display:"inline-block",animation:"lkxSpin .85s linear infinite",flexShrink:0}}/>}
            {phase==="review" && <span style={{ color:T.teal }}>✓</span>}
            {phase==="error"  && <span style={{ color:T.coral }}>⚠</span>}
            <span style={{ fontSize:11, color:phase==="error"?T.coral:phase==="review"?T.teal:T.txt3 }}>{status}</span>
            {phase==="loading" && (
              <span onClick={()=>{cancelRef.current=true;setPhase("idle");setStatus("");}}
                style={{ marginLeft:"auto", fontSize:10, color:T.coral, cursor:"pointer",
                  padding:"2px 7px", borderRadius:4, border:"1px solid rgba(240,96,96,0.25)" }}>
                Cancel
              </span>
            )}
          </div>
        )}

        {/* Identity match */}
        {idResult && phase!=="done" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px",
            borderRadius:7, marginBottom:10,
            background:idResult.level==="CONFIRMED"?`${T.teal}08`:idResult.level==="BLOCKED"?"rgba(240,96,96,0.08)":"rgba(232,184,75,0.08)",
            border:`1px solid ${idResult.level==="CONFIRMED"?T.borderHi:idResult.level==="BLOCKED"?"rgba(240,96,96,0.3)":"rgba(232,184,75,0.25)"}` }}>
            <span style={{ fontFamily:FONTS.mono, fontSize:13, fontWeight:700,
              color:{CONFIRMED:T.teal,REVIEW:T.gold,CAUTION:T.warn,BLOCKED:T.coral}[idResult.level]??T.txt4 }}>
              {idResult.score}%
            </span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:600, color:T.txt }}>Identity {idResult.level}</div>
              {idResult.level==="BLOCKED" && (
                <div style={{ fontSize:10, color:T.coral, marginTop:2 }}>{idResult.blockReason}</div>
              )}
              {idResult.warnings?.filter(w=>w.startsWith("⚠")).map((w,i)=>(
                <div key={i} style={{ fontSize:10, color:T.warn, marginTop:1 }}>{w}</div>
              ))}
            </div>
          </div>
        )}

        {/* Critical DDI warning */}
        {critDDIs.length>0 && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 10px", borderRadius:7,
            marginBottom:10, background:"rgba(240,96,96,0.08)", border:"1px solid rgba(240,96,96,0.3)" }}>
            <span style={{ color:T.coral, fontSize:14, flexShrink:0 }}>⊘</span>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.coral, marginBottom:3 }}>
                {critDDIs.length} Critical DDI{critDDIs.length!==1?"s":""} in imported medications
              </div>
              {critDDIs.slice(0,2).map((ix,i)=>(
                <div key={i} style={{ fontSize:10, color:"rgba(240,96,96,0.8)", marginBottom:1 }}>
                  {ix.drugA} + {ix.drugB} — {ix.class}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import selection */}
        {phase==="review" && data && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:T.txt4, letterSpacing:"0.08em",
              textTransform:"uppercase", marginBottom:8 }}>Select data to import</div>
            <ImportToggle label="Active Medications" count={data.medications?.length??0}
              checked={sel.medications} onToggle={()=>setSel(s=>({...s,medications:!s.medications}))}
              color={critDDIs.length>0?T.coral:T.teal}/>
            <ImportToggle label="Allergies & Reactions" count={data.allergies?.length??0}
              checked={sel.allergies} onToggle={()=>setSel(s=>({...s,allergies:!s.allergies}))}/>
            <ImportToggle label="Active Problem List" count={data.problems?.length??0}
              checked={sel.problems} onToggle={()=>setSel(s=>({...s,problems:!s.problems}))}/>
            <ImportToggle label="Prior Visits (read-only)" count={data.visits?.length??0}
              checked={sel.visits} onToggle={()=>setSel(s=>({...s,visits:!s.visits}))} color={T.txt4}/>
            <ImportToggle label="Recent Labs (read-only)" count={data.labs?.length??0}
              checked={sel.labs} onToggle={()=>setSel(s=>({...s,labs:!s.labs}))} color={T.txt4}/>

            <div onClick={handleImport}
              style={{ marginTop:10, textAlign:"center", padding:"10px", borderRadius:8, cursor:"pointer",
                background:T.teal, color:"#000", fontSize:12, fontWeight:700, letterSpacing:"0.02em" }}>
              ⬡ Import to Active Chart
            </div>
            <div style={{ marginTop:6, fontSize:9, color:T.txt4, textAlign:"center", lineHeight:1.6 }}>
              Selected data will be added to the current encounter.
              Medications and allergies are additive — review before finalizing.
            </div>
          </>
        )}

        {/* Idle + authenticated */}
        {phase==="idle" && authState==="live" && (
          <div onClick={handleQuery} style={{ textAlign:"center", padding:"10px", borderRadius:8, cursor:"pointer",
            background:T.teal, color:"#000", fontSize:12, fontWeight:700 }}>
            ⬡ Retrieve Records for {patientSeed?.lastName??""}, {patientSeed?.firstName??""}
          </div>
        )}

        {/* Done */}
        {phase==="done" && (
          <div style={{ textAlign:"center", padding:"12px", color:T.teal, fontSize:12, fontWeight:600 }}>
            ✓ Records imported to chart
          </div>
        )}

        {/* Open full Anamnesis */}
        {data && phase!=="done" && (
          <div onClick={()=>window.open("/anamnesis","_blank")} style={{ marginTop:8, textAlign:"center",
            padding:"6px", borderRadius:6, cursor:"pointer", fontSize:10, color:T.txt4,
            border:`1px solid ${T.border}`, background:"rgba(255,255,255,0.02)" }}>
            Open full Anamnesis hub →
          </div>
        )}
      </div>
    </div>
  );
}