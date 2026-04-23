// AIFlagReview.jsx
// Unified review of AI-generated result flags across all saved QuickNote encounters
// Reads result_flags_json from ClinicalNote entity, flattens into a sortable list
// NOT a live EHR feed — flags reflect pasted lab/imaging values at time of QuickNote run
// Physician must verify all findings in the EHR before acting

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ─── STYLE INJECTION ─────────────────────────────────────────────────────────
function injectAFRStyles() {
  if (document.getElementById("afr-css")) return;
  const s = document.createElement("style"); s.id = "afr-css";
  s.textContent = `
    :root {
      --afr-bg:#050f1e; --afr-card:#0b1e36;
      --afr-txt:#f2f7ff; --afr-txt2:#b8d4f0; --afr-txt3:#82aece; --afr-txt4:#6b9ec8;
      --afr-teal:#00e5c0; --afr-gold:#f5c842; --afr-coral:#ff6b6b;
      --afr-blue:#3b9eff; --afr-purple:#9b6dff; --afr-green:#3dffa0;
      --afr-red:#ff4444; --afr-orange:#ff9f43;
      --afr-bd:rgba(42,79,122,0.4);
    }
    @keyframes afrfade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .afr-fade{animation:afrfade .18s ease both}
    @keyframes afrspin{to{transform:rotate(360deg)}}
    .afr-spin{animation:afrspin .7s linear infinite;display:inline-block}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("afr-fonts")) {
    const l = document.createElement("link"); l.id = "afr-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const STATUS_ORDER = { critical:0, high:1, low:2, borderline:3, notable:4 };

function statusStyle(status) {
  const s = (status || "").toLowerCase();
  if (s === "critical")   return { color:"var(--afr-red)",    bg:"rgba(255,68,68,.1)",    bd:"rgba(255,68,68,.4)"    };
  if (s === "high")       return { color:"var(--afr-coral)",  bg:"rgba(255,107,107,.08)", bd:"rgba(255,107,107,.35)" };
  if (s === "low")        return { color:"var(--afr-blue)",   bg:"rgba(59,158,255,.08)",  bd:"rgba(59,158,255,.35)"  };
  if (s === "borderline") return { color:"var(--afr-gold)",   bg:"rgba(245,200,66,.08)",  bd:"rgba(245,200,66,.3)"   };
  return                         { color:"var(--afr-purple)", bg:"rgba(155,109,255,.07)", bd:"rgba(155,109,255,.28)" };
}

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
  catch { return iso; }
}

function safeParseFlags(json) {
  if (!json) return [];
  try { const parsed = JSON.parse(json); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

// ─── FLAT FLAG ROW ────────────────────────────────────────────────────────────
function FlagRow({ flag, note, onMarkReviewed, onToggleActive, isReviewed }) {
  const [actioned, setActioned] = useState(false);
  const ss = statusStyle(flag.status);

  const handleAction = async () => {
    setActioned(true);
    await onMarkReviewed(note.id);
  };

  return (
    <div className="afr-fade" style={{
      display:"grid",
      gridTemplateColumns:"140px 1fr 1fr 180px 120px",
      gap:0,
      borderBottom:"1px solid rgba(42,79,122,.25)",
      opacity: isReviewed ? .5 : 1,
      transition:"opacity .2s",
    }}>
      {/* Patient / encounter */}
      <div style={{ padding:"10px 12px", borderRight:"1px solid rgba(42,79,122,.2)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--afr-txt4)", marginBottom:2 }}>
          {formatDate(note.created_date || note.encounter_date)}
        </div>
        {note.patient_identifier && (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--afr-txt4)", marginBottom:3 }}>
            MRN {note.patient_identifier}
          </div>
        )}
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
          color:"var(--afr-txt2)", lineHeight:1.3, marginBottom:3 }}>
          {(note.cc || "—").slice(0, 40)}
        </div>
        {note.working_diagnosis && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:"var(--afr-txt3)", lineHeight:1.3 }}>
            {note.working_diagnosis.slice(0, 40)}
          </div>
        )}
        <div style={{ marginTop:5, display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
            background: note.patient_active ? "var(--afr-green)" : "var(--afr-txt4)" }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color: note.patient_active ? "var(--afr-green)" : "var(--afr-txt4)",
            letterSpacing:.5, cursor:"pointer", textDecoration:"underline",
            textDecorationStyle:"dotted" }}
            onClick={() => onToggleActive(note.id, !note.patient_active)}
            title="Click to toggle active status">
            {note.patient_active ? "Active" : "Discharged"}
          </span>
        </div>
      </div>

      {/* Parameter + value + status */}
      <div style={{ padding:"10px 12px", borderRight:"1px solid rgba(42,79,122,.2)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:5 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
            fontSize:12, color:ss.color }}>{flag.parameter || "—"}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12,
            color:"var(--afr-txt)", fontWeight:600 }}>{flag.value || "—"}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, color:ss.color, background:ss.bg,
            border:`1px solid ${ss.bd}`, borderRadius:4,
            padding:"1px 7px", letterSpacing:.8, textTransform:"uppercase" }}>
            {flag.status || "—"}
          </span>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:"var(--afr-txt2)", lineHeight:1.5 }}>
          {flag.clinical_significance || "—"}
        </div>
      </div>

      {/* Recommendation + citation */}
      <div style={{ padding:"10px 12px", borderRight:"1px solid rgba(42,79,122,.2)" }}>
        {flag.recommendation && (
          <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:4 }}>
            <span style={{ color:ss.color, fontFamily:"'JetBrains Mono',monospace",
              fontSize:10, flexShrink:0, marginTop:1 }}>→</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              fontWeight:600, color:ss.color, lineHeight:1.5 }}>
              {flag.recommendation}
            </span>
          </div>
        )}
        {flag.guideline_citation && (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--afr-blue)", letterSpacing:.3 }}>
            {flag.guideline_citation}
          </div>
        )}
      </div>

      {/* Provider + disposition */}
      <div style={{ padding:"10px 12px", borderRight:"1px solid rgba(42,79,122,.2)" }}>
        {note.provider_name && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--afr-txt3)", marginBottom:3 }}>{note.provider_name}</div>
        )}
        {note.disposition && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--afr-txt4)", background:"rgba(42,79,122,.2)",
            borderRadius:4, padding:"2px 7px" }}>
            {note.disposition}
          </span>
        )}
        {note.mdm_level && (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--afr-txt4)", marginTop:3 }}>MDM: {note.mdm_level}</div>
        )}
      </div>

      {/* Action */}
      <div style={{ padding:"10px 12px", display:"flex", alignItems:"center",
        justifyContent:"center" }}>
        {isReviewed ? (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--afr-green)", letterSpacing:.5 }}>✓ Reviewed</span>
        ) : (
          <button onClick={handleAction} disabled={actioned}
            style={{ padding:"5px 11px", borderRadius:6, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:"1px solid rgba(0,229,192,.4)",
              background:"rgba(0,229,192,.08)", color:"var(--afr-teal)",
              opacity: actioned ? .5 : 1, transition:"all .15s",
              whiteSpace:"nowrap" }}>
            Mark Reviewed
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AIFlagReview() {
  const [notes,        setNotes]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filter,       setFilter]       = useState("unreviewed");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeOnly,   setActiveOnly]   = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  useEffect(() => { injectAFRStyles(); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const results = await base44.entities.ClinicalNote.list({
        sort:"-created_date", limit:200,
      });
      const withFlags = (results || []).filter(r =>
        r.result_flags_json && r.result_flags_json.length > 2 &&
        r.source !== "QN-Handoff"
      );
      setNotes(withFlags);
      setLastRefresh(new Date());
    } catch (e) {
      setError("Failed to load: " + (e.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 90 seconds
  useEffect(() => {
    load();
    const interval = setInterval(load, 90000);
    return () => clearInterval(interval);
  }, [load]);

  const markReviewed = useCallback(async (noteId) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, flag_reviewed: true } : n));
    await base44.entities.ClinicalNote.update(noteId, { flag_reviewed: true }).catch(() => null);
  }, []);

  const toggleActive = useCallback(async (noteId, val) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, patient_active: val } : n));
    await base44.entities.ClinicalNote.update(noteId, { patient_active: val }).catch(() => null);
  }, []);

  // Flatten all flags across all notes
  const allRows = notes.flatMap(note => {
    const flags = safeParseFlags(note.result_flags_json);
    return flags.map(flag => ({ flag, note }));
  });

  // Apply filters
  const filtered = allRows.filter(({ flag, note }) => {
    if (activeOnly && !note.patient_active) return false;
    if (filter === "unreviewed" && note.flag_reviewed) return false;
    if (statusFilter !== "all") {
      const s = (flag.status || "").toLowerCase();
      if (statusFilter === "critical" && s !== "critical") return false;
      if (statusFilter === "high" && !["critical","high"].includes(s)) return false;
    }
    return true;
  });

  // Sort by status severity then date
  filtered.sort((a, b) => {
    const sa = STATUS_ORDER[(a.flag.status||"").toLowerCase()] ?? 9;
    const sb = STATUS_ORDER[(b.flag.status||"").toLowerCase()] ?? 9;
    if (sa !== sb) return sa - sb;
    return new Date(b.note.created_date || 0) - new Date(a.note.created_date || 0);
  });

  const critCount       = allRows.filter(r => (r.flag.status||"").toLowerCase() === "critical" && !r.note.flag_reviewed).length;
  const highCount       = allRows.filter(r => (r.flag.status||"").toLowerCase() === "high"     && !r.note.flag_reviewed).length;
  const unreviewedCount = [...new Set(allRows.filter(r => !r.note.flag_reviewed).map(r => r.note.id))].length;

  return (
    <div style={{ minHeight:"100vh", background:"var(--afr-bg)",
      fontFamily:"'DM Sans',sans-serif", color:"var(--afr-txt)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto", padding:"24px 20px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <button onClick={() => window.history.back()}
            style={{ marginBottom:12, display:"inline-flex", alignItems:"center", gap:7,
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
              background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
              borderRadius:8, padding:"5px 14px", color:"var(--afr-txt3)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"flex-start", gap:16,
            flexWrap:"wrap", marginBottom:10 }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                fontSize:"clamp(20px,3.5vw,32px)", letterSpacing:-.4,
                margin:"0 0 4px", color:"var(--afr-txt)" }}>
                AI Flag Review
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--afr-txt4)", margin:0, lineHeight:1.6 }}>
                AI-generated result flags from QuickNote encounters ·
                Not a live EHR feed · Always verify in your EHR before acting
              </p>
            </div>

            {/* Summary badges */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginLeft:"auto",
              alignItems:"center" }}>
              {critCount > 0 && (
                <div style={{ padding:"6px 14px", borderRadius:8,
                  background:"rgba(255,68,68,.1)", border:"1px solid rgba(255,68,68,.4)",
                  display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%",
                    background:"var(--afr-red)", flexShrink:0 }} />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    fontWeight:700, color:"var(--afr-red)", letterSpacing:.5 }}>
                    {critCount} CRITICAL unreviewed
                  </span>
                </div>
              )}
              {highCount > 0 && (
                <div style={{ padding:"6px 14px", borderRadius:8,
                  background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
                  display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    color:"var(--afr-coral)", letterSpacing:.5 }}>
                    {highCount} HIGH
                  </span>
                </div>
              )}
              {unreviewedCount > 0 && (
                <div style={{ padding:"6px 14px", borderRadius:8,
                  background:"rgba(42,79,122,.2)", border:"1px solid rgba(42,79,122,.4)" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    color:"var(--afr-txt3)", letterSpacing:.5 }}>
                    {unreviewedCount} encounters unreviewed
                  </span>
                </div>
              )}
              <button onClick={load} disabled={loading}
                style={{ padding:"6px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                  border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.6)",
                  color:"var(--afr-txt4)", letterSpacing:.5, textTransform:"uppercase" }}>
                {loading ? <span className="afr-spin">⟳</span> : "↺ Refresh"}
              </button>
            </div>
          </div>
          {lastRefresh && (
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"rgba(107,158,200,.5)", letterSpacing:.5 }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 90s
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center",
          padding:"10px 14px", borderRadius:10, marginBottom:16,
          background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}>

          {/* Review filter */}
          <div style={{ display:"flex", gap:4 }}>
            {[["unreviewed","Unreviewed"],["all","All flags"],["reviewed","Reviewed"]].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                  transition:"all .15s",
                  border:`1px solid ${filter === v ? "rgba(0,229,192,.45)" : "rgba(42,79,122,.4)"}`,
                  background:filter === v ? "rgba(0,229,192,.12)" : "transparent",
                  color:filter === v ? "var(--afr-teal)" : "var(--afr-txt3)" }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ width:1, height:20, background:"rgba(42,79,122,.5)" }} />

          {/* Status filter */}
          <div style={{ display:"flex", gap:4 }}>
            {[["all","All severity"],["critical","Critical only"],["high","Critical + High"]].map(([v,l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                  transition:"all .15s",
                  border:`1px solid ${statusFilter === v ? "rgba(255,68,68,.45)" : "rgba(42,79,122,.4)"}`,
                  background:statusFilter === v ? "rgba(255,68,68,.1)" : "transparent",
                  color:statusFilter === v ? "var(--afr-coral)" : "var(--afr-txt3)" }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ width:1, height:20, background:"rgba(42,79,122,.5)" }} />

          {/* Active only toggle */}
          <button onClick={() => setActiveOnly(p => !p)}
            style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
              transition:"all .15s",
              border:`1px solid ${activeOnly ? "rgba(61,255,160,.45)" : "rgba(42,79,122,.4)"}`,
              background:activeOnly ? "rgba(61,255,160,.1)" : "transparent",
              color:activeOnly ? "var(--afr-green)" : "var(--afr-txt3)" }}>
            {activeOnly ? "● Active patients only" : "○ All patients"}
          </button>

          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--afr-txt4)", marginLeft:"auto" }}>
            {filtered.length} flag{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Safety disclaimer */}
        <div style={{ padding:"8px 14px", borderRadius:8, marginBottom:14,
          background:"rgba(245,200,66,.06)", border:"1px solid rgba(245,200,66,.25)",
          display:"flex", gap:9, alignItems:"center" }}>
          <span style={{ fontSize:13, flexShrink:0 }}>⚠</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--afr-gold)", lineHeight:1.5 }}>
            <b>AI-generated flags only.</b> These values were pasted into QuickNote and interpreted by AI —
            they are not pulled directly from your EHR. Always verify current values in your EHR system
            before taking clinical action.
          </span>
        </div>

        {/* Table */}
        {loading && notes.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0",
            fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"var(--afr-txt4)" }}>
            <span className="afr-spin" style={{ fontSize:20, marginRight:10 }}>⟳</span>
            Loading flags…
          </div>
        ) : error ? (
          <div style={{ padding:"16px", borderRadius:10, textAlign:"center",
            background:"rgba(255,68,68,.07)", border:"1px solid rgba(255,68,68,.3)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--afr-coral)" }}>
            {error}
            <button onClick={load} style={{ marginLeft:12, padding:"4px 12px",
              borderRadius:6, cursor:"pointer",
              border:"1px solid rgba(255,68,68,.4)", background:"rgba(255,68,68,.1)",
              color:"var(--afr-coral)", fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>
              {filter === "unreviewed" && statusFilter === "all" && activeOnly ? "✓" : "🔍"}
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16,
              color:"var(--afr-txt)", marginBottom:6 }}>
              {notes.length === 0
                ? "No QuickNote encounters with result flags found"
                : "No flags match this filter"}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--afr-txt4)" }}>
              {notes.length === 0
                ? "Save a QuickNote encounter with Phase 2 results to see flags here"
                : "Try adjusting the filters above"}
            </div>
          </div>
        ) : (
          <div style={{ background:"rgba(8,22,40,.5)",
            border:"1px solid rgba(42,79,122,.4)", borderRadius:12, overflow:"hidden" }}>

            {/* Table header */}
            <div style={{ display:"grid",
              gridTemplateColumns:"140px 1fr 1fr 180px 120px",
              background:"rgba(14,37,68,.8)",
              borderBottom:"1px solid rgba(42,79,122,.5)" }}>
              {["Patient / Encounter","Finding","Recommendation","Provider","Action"].map((h,i) => (
                <div key={i} style={{ padding:"8px 12px",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                  color:"var(--afr-txt4)", letterSpacing:1, textTransform:"uppercase",
                  borderRight: i < 4 ? "1px solid rgba(42,79,122,.3)" : "none" }}>
                  {h}
                </div>
              ))}
            </div>

            {filtered.map(({ flag, note }, i) => (
              <FlagRow
                key={`${note.id}-${flag.parameter}-${i}`}
                flag={flag}
                note={note}
                isReviewed={Boolean(note.flag_reviewed)}
                onMarkReviewed={markReviewed}
                onToggleActive={toggleActive}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop:28, textAlign:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(107,158,200,.4)", letterSpacing:1.5 }}>
          NOTRYA AI FLAG REVIEW · AI-GENERATED FROM PASTED VALUES · NOT A LIVE EHR FEED ·
          VERIFY ALL FINDINGS IN YOUR EHR BEFORE ACTING
        </div>
      </div>
    </div>
  );
}