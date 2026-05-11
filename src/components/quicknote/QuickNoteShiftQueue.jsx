// QuickNoteShiftQueue.jsx  v11.5
// Feature #6 — Shift Handoff Queue
// Reads ShiftSignOut entity · last 12 hours · pending / completed
// Export: ShiftQueuePanel
//
// Wire in QuickNote.jsx:
//   import { ShiftQueuePanel } from "./QuickNoteShiftQueue";
//   <ShiftQueuePanel />  — no props required

import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

function timeAgo(iso) {
  if (!iso) return "";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1)  return "just now";
  if (min < 60) return `${min}m ago`;
  const h=Math.floor(min/60), m=min%60;
  return m>0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

function mdmColor(level) {
  if (!level) return "var(--qn-txt4)";
  const l = level.toLowerCase();
  if (l.includes("high"))     return "var(--qn-coral)";
  if (l.includes("moderate")) return "var(--qn-gold)";
  return "var(--qn-teal)";
}

function PendingCard({ s, onMark, marking }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius:9, background:"rgba(245,200,66,.04)",
      border:"1px solid rgba(245,200,66,.22)", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8,
        padding:"9px 12px", cursor:"pointer" }} onClick={() => setOpen(o=>!o)}>
        <div style={{ width:7,height:7,borderRadius:"50%",flexShrink:0,
          background:"var(--qn-gold)",boxShadow:"0 0 6px rgba(245,200,66,.5)" }} />
        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,
          color:"var(--qn-txt)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
          {s.cc||"Unknown CC"}
        </span>
        {s.mdm_level && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,
            color:mdmColor(s.mdm_level),background:`${mdmColor(s.mdm_level)}18`,
            border:`1px solid ${mdmColor(s.mdm_level)}35`,borderRadius:4,padding:"2px 6px",flexShrink:0 }}>
            {s.mdm_level.split(" ")[0].toUpperCase()}
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,
          color:"rgba(107,158,200,.45)",flexShrink:0 }}>{timeAgo(s.created_date)}</span>
        <span style={{ color:"var(--qn-txt4)",fontSize:10,flexShrink:0 }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ padding:"0 12px 12px",borderTop:"1px solid rgba(245,200,66,.15)" }}>
          {s.working_diagnosis && (
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,
              color:"var(--qn-txt3)",marginTop:8,marginBottom:8,fontStyle:"italic" }}>
              {s.working_diagnosis}
            </div>
          )}
          <div style={{ padding:"9px 12px",borderRadius:7,background:"rgba(14,37,68,.6)",
            border:"1px solid rgba(42,79,122,.3)",fontFamily:"'DM Sans',sans-serif",fontSize:11,
            color:"var(--qn-txt2)",lineHeight:1.75,marginBottom:10 }}>
            {s.signout_text||"No sign-out text."}
          </div>
          <button onClick={() => onMark(s.id)} disabled={marking===s.id} style={{
            padding:"5px 14px",borderRadius:7,cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:.4,
            border:`1px solid ${marking===s.id?"rgba(42,79,122,.3)":"rgba(61,255,160,.45)"}`,
            background:marking===s.id?"rgba(14,37,68,.4)":"rgba(61,255,160,.08)",
            color:marking===s.id?"var(--qn-txt4)":"var(--qn-green)",transition:"all .15s",
          }}>
            {marking===s.id?"● Updating…":"✓ Mark Completed"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ShiftQueuePanel() {
  const [open,     setOpen]     = useState(false);
  const [signouts, setSignouts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [marking,  setMarking]  = useState(null);
  const [lastLoad, setLastLoad] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await base44.entities.ShiftSignOut.list({ sort:"-created_date", limit:30 }).catch(()=>[]);
      const cutoff = Date.now() - 12*3600000;
      setSignouts((results||[]).filter(r =>
        r.status!=="superseded" && new Date(r.created_date||0).getTime()>cutoff
      ));
      setLastLoad(Date.now());
    } catch(e) { console.error("ShiftQueue load failed:",e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) load(); }, [open]);

  const markComplete = useCallback(async (id) => {
    setMarking(id);
    try {
      await base44.entities.ShiftSignOut.update(id, { status:"completed" });
      setSignouts(prev => prev.map(s => s.id===id ? {...s,status:"completed"} : s));
    } catch(e) { console.error("Mark complete failed:",e); }
    finally { setMarking(null); }
  }, []);

  const pending   = signouts.filter(s => s.status==="pending");
  const completed = signouts.filter(s => s.status==="completed");

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      display:"inline-flex",alignItems:"center",gap:7,
      padding:"5px 14px",borderRadius:7,cursor:"pointer",
      fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
      letterSpacing:.5,transition:"all .15s",
      border:`1px solid ${pending.length>0?"rgba(245,200,66,.5)":"rgba(42,79,122,.4)"}`,
      background:pending.length>0?"rgba(245,200,66,.08)":"transparent",
      color:pending.length>0?"var(--qn-gold)":"var(--qn-txt4)",
    }}>
      ⇄ Shift Queue
      {pending.length>0 && (
        <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",
          width:16,height:16,borderRadius:"50%",background:"var(--qn-coral)",
          color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,flexShrink:0 }}>
          {pending.length}
        </span>
      )}
    </button>
  );

  return (
    <div className="qn-fade" style={{ marginBottom:14,borderRadius:12,
      background:"rgba(8,22,40,.65)",border:"1px solid rgba(245,200,66,.3)",overflow:"hidden" }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
        borderBottom:"1px solid rgba(42,79,122,.3)",background:"rgba(245,200,66,.04)" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"var(--qn-gold)" }}>
            Shift Handoff Queue
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(107,158,200,.45)",marginTop:2 }}>
            Last 12 hours · {lastLoad?`Updated ${timeAgo(lastLoad)}`:"Loading…"}
          </div>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {pending.length>0 && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:"var(--qn-gold)",background:"rgba(245,200,66,.1)",border:"1px solid rgba(245,200,66,.3)",
            borderRadius:4,padding:"2px 8px" }}>{pending.length} pending</span>}
          {completed.length>0 && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:"var(--qn-green)",background:"rgba(61,255,160,.08)",border:"1px solid rgba(61,255,160,.2)",
            borderRadius:4,padding:"2px 8px" }}>{completed.length} done</span>}
        </div>
        <button onClick={load} disabled={loading} style={{ padding:"4px 10px",borderRadius:6,cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
          border:"1px solid rgba(42,79,122,.4)",background:"transparent",
          color:loading?"var(--qn-txt4)":"var(--qn-blue)" }}>{loading?"●":"↻ Refresh"}</button>
        <button onClick={() => setOpen(false)} style={{ padding:"4px 9px",borderRadius:6,cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace",fontSize:8,
          border:"1px solid rgba(42,79,122,.35)",background:"transparent",color:"var(--qn-txt4)" }}>✕</button>
      </div>

      <div style={{ padding:"12px 14px" }}>
        {loading&&signouts.length===0 && <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,
          color:"var(--qn-txt4)",padding:"12px 0",textAlign:"center" }}>● Loading sign-outs…</div>}
        {!loading&&signouts.length===0 && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,
          color:"var(--qn-txt4)",padding:"16px 0",textAlign:"center" }}>No sign-outs in the last 12 hours</div>}

        {pending.length>0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
              color:"var(--qn-gold)",letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>
              Pending · {pending.length}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {pending.map(s => <PendingCard key={s.id} s={s} onMark={markComplete} marking={marking} />)}
            </div>
          </div>
        )}

        {completed.length>0 && (
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
              color:"rgba(61,255,160,.55)",letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>
              Completed · {completed.length}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
              {completed.map(s => (
                <div key={s.id} style={{ display:"flex",alignItems:"center",gap:8,
                  padding:"6px 10px",borderRadius:7,background:"rgba(14,37,68,.4)",
                  border:"1px solid rgba(42,79,122,.2)" }}>
                  <span style={{ color:"var(--qn-green)",fontSize:10,flexShrink:0 }}>✓</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt4)",
                    flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {s.cc||"Unknown CC"}{s.working_diagnosis?` — ${s.working_diagnosis}`:""}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,
                    color:"rgba(107,158,200,.35)",flexShrink:0 }}>{timeAgo(s.created_date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}