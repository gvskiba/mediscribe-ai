// AnamnesisAnalyticsDashboard.jsx
// De-identified MDM analytics and session intelligence dashboard.
// For health system leadership and quality/billing teams.

import { useState, useEffect } from "react";
import { AnamnesisCache } from "@/utils/anamnesisEngines";

const T = {
  bg:"#060f1c", panel:"#0a1828", card:"#0d2040",
  teal:"#00d4a8", gold:"#e8b84b", coral:"#f06060",
  blue:"#4a9eff", warn:"#e8a838", violet:"#9b7de8",
  txt:"#e8f0fb", txt2:"#9ab8d8", txt3:"#5e88b0", txt4:"#3a5f80",
  border:"rgba(0,212,168,0.13)", borderHi:"rgba(0,212,168,0.32)",
};
const FONTS = {
  display:"'Playfair Display', Georgia, serif",
  body:"'DM Sans', system-ui, sans-serif",
  mono:"'JetBrains Mono', 'Fira Code', monospace",
};

const MDM_COLOR = { minimal:T.txt4, low:T.teal, moderate:T.gold, high:T.coral };
const MDM_ORDER = ["minimal","low","moderate","high"];

async function loadSessionData() {
  // ── Option 1: Load from Base44 AnamnesisProvenanceLog (uncomment after entity creation) ──
  // try {
  //   const { AnamnesisProvenanceLog } = await import("@/api/entities");
  //   const records = await AnamnesisProvenanceLog.filter([], { limit: 500 });
  //   return records.map(r => ({
  //     queryId:       r.queryId,
  //     ts:            r.queryInitiatedAt,
  //     method:        r.retrievalMethod,
  //     resourceCount: r.resourceCount,
  //     resources:     r.resourceSummary ? JSON.parse(r.resourceSummary) : {},
  //     identityScore: r.identityMatchScore,
  //     identityLevel: r.identityMatchLevel,
  //     imported:      r.importedToEncounter,
  //     latencyMs:     r.latencyMs,
  //   }));
  // } catch {}

  // ── Option 2: Load from current session AnamnesisCache ──
  const sessions = [];
  AnamnesisCache.forEach((val, key) => {
    if (!val || !val.ts) return;
    sessions.push({
      queryId:       `SESSION-${key.slice(0,8)}`,
      ts:            new Date(val.ts).toISOString(),
      method:        "async-fhir",
      resourceCount: val.resourceCount ?? 0,
      resources:     {
        visits:      val.data?.visits?.length      ?? 0,
        medications: val.data?.medications?.length ?? 0,
        allergies:   val.data?.allergies?.length   ?? 0,
        problems:    val.data?.problems?.length    ?? 0,
        labs:        val.data?.labs?.length        ?? 0,
      },
      identityScore: val.matchResult?.score  ?? null,
      identityLevel: val.matchResult?.level  ?? null,
      imported:      false,
      latencyMs:     null,
      criticalDDIs:  0,
      mdmLevel:      null,
    });
  });
  return sessions;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ padding:"16px 20px", borderRadius:10, background:T.panel,
      border:`1px solid ${T.border}`, flex:1 }}>
      <div style={{ fontFamily:FONTS.mono, fontSize:28, fontWeight:700,
        color:color??T.teal, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, fontWeight:600, color:T.txt, marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:T.txt4 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, height=120, showLabels=true }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", gap:4, height:"100%" }}>
          <div style={{ fontSize:11, fontWeight:700, color:d.color??T.teal,
            opacity: d.value>0?1:0.3 }}>{d.value}</div>
          <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
            <div style={{ width:"100%", borderRadius:"4px 4px 0 0",
              height: `${Math.max((d.value/max)*100,2)}%`,
              background: d.value>0 ? (d.color??T.teal)+"80" : "rgba(255,255,255,0.05)",
              border: d.value>0 ? `1px solid ${d.color??T.teal}40` : "none",
              transition:"height .4s ease" }}/>
          </div>
          {showLabels && <div style={{ fontSize:10, color:T.txt4, textAlign:"center",
            whiteSpace:"nowrap" }}>{d.label}</div>}
        </div>
      ))}
    </div>
  );
}

function DonutRing({ slices, size=100 }) {
  const total = slices.reduce((s,x)=>s+x.value,0) || 1;
  const R=38, CX=50, CY=50, circ=2*Math.PI*R;
  let offset = 0;
  const paths = slices.map((s,i) => {
    const pct = s.value / total;
    const dash = pct * circ;
    const el = (
      <circle key={i} cx={CX} cy={CY} r={R} fill="none"
        stroke={s.color} strokeWidth={14}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={-offset}
        style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%" }}/>
    );
    offset += dash;
    return el;
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx={CX} cy={CY} r={R} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={14}/>
      {paths}
    </svg>
  );
}

export default function AnamnesisAnalyticsDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    loadSessionData().then(s => { setSessions(s); setLoading(false); });
  }, []);

  const total        = sessions.length;
  const avgResources = total ? Math.round(sessions.reduce((s,x)=>s+x.resourceCount,0)/total) : 0;
  const avgLatency   = (() => {
    const valid = sessions.filter(s=>s.latencyMs!=null);
    return valid.length ? (valid.reduce((s,x)=>s+x.latencyMs,0)/valid.length/1000).toFixed(1) : "—";
  })();
  const importRate   = total ? Math.round(sessions.filter(s=>s.imported).length/total*100) : 0;
  const confirmedPct = total ? Math.round(sessions.filter(s=>s.identityLevel==="CONFIRMED").length/total*100) : 0;

  const idDist = ["CONFIRMED","REVIEW","CAUTION","BLOCKED"].map(lvl => ({
    label: lvl, value: sessions.filter(s=>s.identityLevel===lvl).length,
    color: {CONFIRMED:T.teal,REVIEW:T.gold,CAUTION:T.warn,BLOCKED:T.coral}[lvl],
  }));

  const avgByType = ["visits","medications","allergies","problems","labs"].map(k => ({
    label: k.charAt(0).toUpperCase()+k.slice(1),
    value: total ? Math.round(sessions.reduce((s,x)=>s+(x.resources?.[k]??0),0)/total) : 0,
    color: T.teal,
  }));

  const methods = {fhir:0, paste:0, cache:0};
  sessions.forEach(s => {
    if (s.method==="paste-ai") methods.paste++;
    else if (s.method==="session-cache") methods.cache++;
    else methods.fhir++;
  });

  const generateReport = () => {
    const lines = [
      "LAKONYX ANAMNESIS — ANALYTICS REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      `Period: Current session${total>0?` (${total} queries)`:""}\n`,
      "── QUERY VOLUME ─────────────────────────────────────────",
      `Total queries:           ${total}`,
      `FHIR network queries:    ${methods.fhir}`,
      `AI paste parses:         ${methods.paste}`,
      `Session cache hits:      ${methods.cache}`,
      `Avg retrieval latency:   ${avgLatency}s\n`,
      "── RECORD INTELLIGENCE ──────────────────────────────────",
      `Avg resources per query: ${avgResources}`,
      ...avgByType.map(t=>`  · ${t.label}: ${t.value} avg`),
      "",
      "── IDENTITY VERIFICATION ────────────────────────────────",
      `Confirmed matches:       ${confirmedPct}%`,
      ...idDist.map(d=>`  ${d.label}: ${d.value} (${total?Math.round(d.value/total*100):0}%)`),
      "",
      "── DOCUMENTATION ────────────────────────────────────────",
      `Import rate:             ${importRate}%`,
      "",
      "Generated by Lakonyx Anamnesis Analytics · Data is de-identified.",
    ];
    return lines.join("\n");
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:FONTS.body, color:T.txt }}>
      <style>{`
        @keyframes lkxFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lkxSpin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box;}
      `}</style>

      {/* Header */}
      <div style={{ padding:"18px 28px 16px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontFamily:FONTS.display, fontSize:14, fontWeight:700, color:T.txt,
              letterSpacing:"0.1em", textTransform:"uppercase" }}>LAKONYX</span>
            <span style={{ fontSize:11, color:T.txt4 }}>/</span>
            <span style={{ fontFamily:FONTS.display, fontSize:18, fontWeight:700, color:T.teal }}>
              Anamnesis Analytics
            </span>
          </div>
          <div style={{ fontSize:11, color:T.txt4, marginTop:3 }}>
            De-identified MDM intelligence for health system leadership and quality teams
          </div>
        </div>
        <div onClick={() => {
            const text=generateReport();
            navigator.clipboard.writeText(text).catch(()=>{});
            setCopied(true); setTimeout(()=>setCopied(false),2000);
          }}
          style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 16px",
            borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:600,
            background:copied?`${T.teal}20`:"rgba(255,255,255,0.05)",
            color:copied?T.teal:T.txt3, border:`1px solid ${copied?T.borderHi:T.border}`,
            fontFamily:FONTS.body }}>
          {copied?"✓ Copied":"⎙ Export Report"}
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, gap:10 }}>
          <span style={{ width:20, height:20, borderRadius:"50%", border:`2.5px solid ${T.teal}33`,
            borderTop:`2.5px solid ${T.teal}`, display:"inline-block", animation:"lkxSpin .85s linear infinite" }}/>
          <span style={{ color:T.txt4, fontSize:13 }}>Loading session analytics...</span>
        </div>
      ) : total === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          height:300, gap:12, padding:40 }}>
          <span style={{ fontSize:36, opacity:0.3 }}>📊</span>
          <div style={{ fontFamily:FONTS.display, fontSize:18, color:T.txt2 }}>No session data yet</div>
          <div style={{ fontSize:12, color:T.txt4, textAlign:"center", maxWidth:360 }}>
            Query patients via Anamnesis to populate analytics. For cross-session data,
            create the AnamnesisProvenanceLog entity in Base44.
          </div>
        </div>
      ) : (
        <div style={{ padding:"24px 28px", animation:"lkxFadeIn .3s ease" }}>

          {/* Stat cards */}
          <div style={{ display:"flex", gap:12, marginBottom:24 }}>
            <StatCard label="Total Queries" value={total} sub="This session" color={T.teal}/>
            <StatCard label="Avg Resources" value={avgResources} sub="Per query" color={T.blue}/>
            <StatCard label="Identity Confirmed" value={`${confirmedPct}%`} sub="Of queries" color={confirmedPct>=80?T.teal:T.warn}/>
            <StatCard label="Import Rate" value={`${importRate}%`} sub="Records imported to chart" color={T.gold}/>
            {avgLatency!=="—" && <StatCard label="Avg Latency" value={`${avgLatency}s`} sub="FHIR retrieval" color={T.violet}/>}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>

            {/* Identity distribution */}
            <div style={{ padding:"18px 20px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}` }}>
              <div style={{ fontFamily:FONTS.body, fontSize:12, fontWeight:700, color:T.txt, marginBottom:4 }}>
                Identity Match Distribution
              </div>
              <div style={{ fontSize:10, color:T.txt4, marginBottom:14 }}>
                Fellegi-Sunter probabilistic match levels across {total} queries
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <DonutRing slices={idDist.filter(d=>d.value>0).map(d=>({value:d.value,color:d.color,label:d.label}))} size={90}/>
                <div style={{ flex:1 }}>
                  {idDist.map((d,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:T.txt3, flex:1 }}>{d.label}</span>
                      <span style={{ fontFamily:FONTS.mono, fontSize:11, fontWeight:700, color:d.color }}>{d.value}</span>
                      <span style={{ fontSize:10, color:T.txt4, minWidth:30 }}>
                        {total ? Math.round(d.value/total*100)+"%" : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {idDist[3].value > 0 && (
                <div style={{ marginTop:10, padding:"6px 10px", borderRadius:6,
                  background:"rgba(240,96,96,0.08)", border:"1px solid rgba(240,96,96,0.2)",
                  fontSize:10, color:T.coral, lineHeight:1.5 }}>
                  ⊘ {idDist[3].value} query{idDist[3].value!==1?"s":""} blocked by identity threshold.
                  Review demographics quality or MRN availability.
                </div>
              )}
            </div>

            {/* Resource breakdown */}
            <div style={{ padding:"18px 20px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}` }}>
              <div style={{ fontFamily:FONTS.body, fontSize:12, fontWeight:700, color:T.txt, marginBottom:4 }}>
                Average Resources Per Query
              </div>
              <div style={{ fontSize:10, color:T.txt4, marginBottom:14 }}>
                FHIR resource type distribution across all queries
              </div>
              <BarChart data={avgByType} height={110}/>
            </div>
          </div>

          {/* Query method breakdown */}
          <div style={{ padding:"18px 20px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}`, marginBottom:20 }}>
            <div style={{ fontFamily:FONTS.body, fontSize:12, fontWeight:700, color:T.txt, marginBottom:14 }}>
              Query Method Breakdown
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {[
                { label:"FHIR Network", value:methods.fhir, color:T.teal, desc:"Async Carequality/CommonWell queries" },
                { label:"AI Paste Parse", value:methods.paste, color:T.blue, desc:"AI-extracted from pasted documents" },
                { label:"Session Cache", value:methods.cache, color:T.violet, desc:"Restored from 10-min session cache" },
              ].map((m,i) => (
                <div key={i} style={{ flex:1, padding:"12px 14px", borderRadius:8,
                  background:`${m.color}08`, border:`1px solid ${m.color}25` }}>
                  <div style={{ fontFamily:FONTS.mono, fontSize:22, fontWeight:700, color:m.color, marginBottom:4 }}>{m.value}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:m.color, marginBottom:2 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:T.txt4, lineHeight:1.5 }}>{m.desc}</div>
                  <div style={{ marginTop:6, fontSize:10, color:T.txt4 }}>
                    {total ? Math.round(m.value/total*100) : 0}% of total
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentation gap analysis */}
          <div style={{ padding:"18px 20px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}`, marginBottom:20 }}>
            <div style={{ fontFamily:FONTS.body, fontSize:12, fontWeight:700, color:T.txt, marginBottom:4 }}>
              Documentation Opportunity Analysis
            </div>
            <div style={{ fontSize:10, color:T.txt4, marginBottom:14 }}>
              Based on {total} Anamnesis session{total!==1?"s":""} this session
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[
                {
                  title:"External Record Review (Domain 2)",
                  icon:"📋",
                  finding:`${total} encounter${total!==1?"s":""} had external FHIR records available for review.`,
                  opportunity:"Each reviewed record qualifies for Domain 2 Category 1 credit (Low complexity data), potentially supporting a higher E&M level.",
                  color:T.teal,
                },
                {
                  title:"High-Risk Medication Documentation (Domain 3)",
                  icon:"★",
                  finding:"Patients with high-risk medications (anticoagulants, antiarrhythmics, opioids) automatically qualify for HIGH Domain 3 risk.",
                  opportunity:"Documenting the high-risk medication and associated monitoring decision supports HIGH MDM and 99285/99205 billing.",
                  color:T.gold,
                },
                {
                  title:"Drug-Drug Interaction Documentation",
                  icon:"⊘",
                  finding:"Critical and major DDIs detected across queries represent active management decisions.",
                  opportunity:"Documenting a management decision for a DDI (modification, monitoring plan, patient counseling) directly supports Domain 3 HIGH risk.",
                  color:T.coral,
                },
              ].map((item,i) => (
                <div key={i} style={{ padding:"12px 14px", borderRadius:8,
                  background:`${item.color}08`, border:`1px solid ${item.color}20` }}>
                  <div style={{ fontSize:16, marginBottom:6 }}>{item.icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:item.color, marginBottom:6, lineHeight:1.4 }}>{item.title}</div>
                  <div style={{ fontSize:10, color:T.txt2, lineHeight:1.6, marginBottom:6 }}>{item.finding}</div>
                  <div style={{ fontSize:10, color:T.txt4, lineHeight:1.6, fontStyle:"italic" }}>{item.opportunity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize:9, color:T.txt4, lineHeight:1.8, textAlign:"center" }}>
            All analytics are de-identified. No patient-identifiable information is stored.
            Patient demographics are one-way hashed before any persistence.
            For full cross-session analytics, create the AnamnesisProvenanceLog entity in Base44
            and uncomment the entity.filter() call in loadSessionData().
            Generated by Lakonyx Anamnesis Analytics.
          </div>
        </div>
      )}
    </div>
  );
}