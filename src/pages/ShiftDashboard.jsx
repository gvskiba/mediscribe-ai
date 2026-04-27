// ShiftDashboard.jsx
// Real-time shift view of today's ED encounters
// Reads ClinicalNote records from today, sorted by time
// Status: draft | MDM only | complete | discharged
// One-click Continue in QuickNote per encounter

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("sd-css")) return;
  const s = document.createElement("style"); s.id = "sd-css";
  s.textContent = `
    :root{--sd-bg:#050f1e;--sd-txt:#f2f7ff;--sd-txt2:#b8d4f0;--sd-txt3:#82aece;
          --sd-txt4:#6b9ec8;--sd-teal:#00e5c0;--sd-gold:#f5c842;--sd-coral:#ff6b6b;
          --sd-blue:#3b9eff;--sd-purple:#9b6dff;--sd-green:#3dffa0;--sd-red:#ff4444;
          --sd-bd:rgba(42,79,122,0.4);}
    @keyframes sdfade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .sd-fade{animation:sdfade .18s ease both}
    @keyframes sdspin{to{transform:rotate(360deg)}}
    .sd-spin{animation:sdspin .7s linear infinite;display:inline-block}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("sd-fonts")) {
    const l = document.createElement("link"); l.id="sd-fonts"; l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// Internal record sources — never shown
const INTERNAL = ["QN-Handoff","VH-Analysis","NH-Resume","superseded"];
const isInternal = n =>
  INTERNAL.some(s => (n.source||"").includes(s)) || n.status === "superseded" ||
  (n.status === "pending" && (n.source||"").includes("Handoff"));

function mdmColor(level) {
  const l = (level||"").toLowerCase();
  if (l.includes("high"))            return "#ff4444";
  if (l.includes("moderate"))        return "#ff9f43";
  if (l.includes("low"))             return "#f5c842";
  if (l.includes("straightforward")) return "#3dffa0";
  return "#3b9eff";
}

function dispColor(disp) {
  const d = (disp||"").toLowerCase();
  if (d.includes("icu"))    return "#ff4444";
  if (d.includes("admit"))  return "#ff6b6b";
  if (d.includes("obs"))    return "#ff9f43";
  if (d.includes("trans"))  return "#9b6dff";
  return "#3dffa0";
}

function getStatus(note) {
  if (note.status === "draft")             return "draft";
  if (note.patient_active === false)       return "discharged";
  if (note.disposition && note.full_note_text) return "complete";
  if (note.mdm_level || note.mdm_narrative)    return "mdm_only";
  return "draft";
}

const STATUS_CONFIG = {
  draft:      { label:"Draft",       color:"#f5c842",  bg:"rgba(245,200,66,.1)",  bd:"rgba(245,200,66,.3)"  },
  mdm_only:   { label:"MDM Done",    color:"#3b9eff",  bg:"rgba(59,158,255,.1)",  bd:"rgba(59,158,255,.3)"  },
  complete:   { label:"Complete",    color:"#3dffa0",  bg:"rgba(61,255,160,.1)",  bd:"rgba(61,255,160,.3)"  },
  discharged: { label:"Discharged",  color:"#82aece",  bg:"rgba(130,174,206,.08)",bd:"rgba(130,174,206,.25)"},
};

function formatTime(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }); }
  catch { return "—"; }
}

function EncounterRow({ note, onToggleActive, onContinue, idx }) {
  const status   = getStatus(note);
  const sc       = STATUS_CONFIG[status];
  const isActive = note.patient_active !== false;
  const [resuming, setResuming] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleContinue = async () => {
    if (resuming) return;
    setResuming(true);
    try {
      const prior = await base44.entities.ClinicalNote.list({ sort:"-created_date", limit:5 }).catch(() => []);
      const stale = (prior||[]).filter(r => r.source === "NH-Resume" && r.status === "pending");
      await Promise.all(stale.map(r => base44.entities.ClinicalNote.update(r.id, { status:"superseded" }).catch(() => null)));
      await base44.entities.ClinicalNote.create({
        source:"NH-Resume", status:"pending",
        encounter_date: note.encounter_date || new Date().toISOString().split("T")[0],
        cc: note.cc||"", hpi_raw: note.hpi_raw||"", ros_raw: note.ros_raw||"",
        exam_raw: note.exam_raw||"", labs_raw: note.labs_raw||"",
        imaging_raw: note.imaging_raw||"", full_note_text: note.full_note_text||"",
        working_diagnosis: note.working_diagnosis||"", mdm_level: note.mdm_level||"",
        mdm_narrative: note.mdm_narrative||"", patient_identifier: note.patient_identifier||"",
        icd_codes_json: note.icd_codes_json||"",
      });
      window.location.href = "/QuickNote";
    } catch { setResuming(false); }
  };

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    const newVal = !isActive;
    try {
      await base44.entities.ClinicalNote.update(note.id, { patient_active: newVal });
      onToggleActive(note.id, newVal);
    } catch {}
    finally { setToggling(false); }
  };

  return (
    <div className="sd-fade" style={{ display:"grid",
      gridTemplateColumns:"48px 1fr 140px 120px 160px",
      alignItems:"center", gap:0,
      borderBottom:"1px solid rgba(42,79,122,.2)",
      opacity: status === "discharged" ? .6 : 1,
      transition:"opacity .2s" }}>

      {/* Time */}
      <div style={{ padding:"10px 0 10px 14px",
        fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:"var(--sd-txt4)" }}>
        {formatTime(note.created_date)}
      </div>

      {/* CC + Dx + MRN */}
      <div style={{ padding:"10px 12px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:"var(--sd-txt)", lineHeight:1.3, marginBottom:2 }}>
          {note.cc || "—"}
        </div>
        {note.working_diagnosis && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--sd-txt3)" }}>{note.working_diagnosis}</div>
        )}
        {note.patient_identifier && (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--sd-txt4)", marginTop:2 }}>MRN {note.patient_identifier}</div>
        )}
      </div>

      {/* MDM + Disposition badges */}
      <div style={{ padding:"10px 8px", display:"flex", flexDirection:"column", gap:4 }}>
        {note.mdm_level && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, color:mdmColor(note.mdm_level),
            background:`${mdmColor(note.mdm_level)}14`,
            border:`1px solid ${mdmColor(note.mdm_level)}33`,
            borderRadius:4, padding:"1px 7px", letterSpacing:.5,
            textTransform:"uppercase", alignSelf:"flex-start" }}>
            {note.mdm_level.replace("Medical Decision Making — ","").replace("MDM — ","")}
          </span>
        )}
        {note.disposition && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:dispColor(note.disposition),
            background:`${dispColor(note.disposition)}10`,
            border:`1px solid ${dispColor(note.disposition)}30`,
            borderRadius:4, padding:"1px 7px", letterSpacing:.5,
            textTransform:"uppercase", alignSelf:"flex-start" }}>
            {note.disposition}
          </span>
        )}
      </div>

      {/* Status + active dot */}
      <div style={{ padding:"10px 8px", display:"flex", alignItems:"center", gap:6 }}>
        <div onClick={handleToggle}
          title={isActive ? "Mark discharged" : "Mark active"}
          style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, cursor:"pointer",
            background: isActive ? "var(--sd-green)" : "var(--sd-txt4)",
            transition:"background .2s" }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
          color:sc.color, background:sc.bg, border:`1px solid ${sc.bd}`,
          borderRadius:4, padding:"1px 6px", letterSpacing:.5,
          textTransform:"uppercase", whiteSpace:"nowrap" }}>
          {sc.label}
        </span>
      </div>

      {/* Actions */}
      <div style={{ padding:"10px 14px 10px 8px",
        display:"flex", gap:6, justifyContent:"flex-end" }}>
        <button onClick={handleContinue} disabled={resuming}
          style={{ padding:"4px 11px", borderRadius:6, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
            border:"1px solid rgba(0,229,192,.4)", background:"rgba(0,229,192,.08)",
            color:"var(--sd-teal)", opacity:resuming ? .5 : 1,
            transition:"all .15s", whiteSpace:"nowrap" }}>
          {resuming ? "…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

export default function ShiftDashboard() {
  const [notes,        setNotes]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [handoff,      setHandoff]      = useState(null);
  const [handoffBusy,  setHandoffBusy]  = useState(false);
  const [copiedHandoff,setCopiedHandoff]= useState(false);

  const load = useCallback(async () => {
    setLoading(notes.length === 0); setError(null);
    try {
      const result = await base44.entities.ClinicalNote.list({ sort:"-created_date", limit:200 });
      const today = new Date().toLocaleDateString("en-US");
      const todayNotes = (result||[]).filter(n => {
        if (isInternal(n)) return false;
        const d = n.created_date || n.encounter_date || "";
        return d && new Date(d).toLocaleDateString("en-US") === today;
      });
      setNotes(todayNotes);
      setLastRefresh(new Date());
    } catch (e) {
      setError("Failed to load: " + (e.message || "unknown error"));
    } finally { setLoading(false); }
  }, [notes.length]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleActive = (id, val) =>
    setNotes(prev => prev.map(n => n.id === id ? {...n, patient_active:val} : n));

  const generateHandoff = async () => {
    const active = notes.filter(n => n.patient_active !== false);
    if (!active.length || handoffBusy) return;
    setHandoffBusy(true); setHandoff(null);
    try {
      const schema = { type:"object", required:["handoff"],
        properties:{ handoff:{ type:"string" } } };
      const summary = active.map((n, i) =>
        `${i+1}. CC: ${n.cc||"?"} | Dx: ${n.working_diagnosis||"pending"} | MDM: ${n.mdm_level||"—"} | Dispo: ${n.disposition||"pending"}`
      ).join("\n");
      const prompt = `You are an emergency physician writing a verbal shift handoff for incoming coverage.

ACTIVE PATIENTS (${active.length}):
${summary}

Write a concise shift handoff. For each patient:
- 1-sentence clinical summary
- Current status and disposition plan
- Outstanding tasks or pending results

Format as numbered list matching patient order. Prioritize high-acuity patients first.
Keep it brief — this is for verbal handoff.

Return JSON: { "handoff": "<text with \\n line breaks>" }`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt, response_json_schema: schema,
      });
      setHandoff(res?.handoff || "");
    } catch (e) { console.error(e); }
    finally { setHandoffBusy(false); }
  };

  const copyHandoff = () => {
    if (!handoff) return;
    const ts = new Date().toLocaleString("en-US",
      { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" });
    navigator.clipboard.writeText(`SHIFT HANDOFF — ${ts}\n\n${handoff}`).then(() => {
      setCopiedHandoff(true); setTimeout(() => setCopiedHandoff(false), 3000);
    });
  };

  const stats = {
    total:      notes.length,
    active:     notes.filter(n => n.patient_active !== false).length,
    discharged: notes.filter(n => n.patient_active === false).length,
    complete:   notes.filter(n => getStatus(n) === "complete").length,
    draft:      notes.filter(n => getStatus(n) === "draft").length,
    highMDM:    notes.filter(n => (n.mdm_level||"").toLowerCase().includes("high")).length,
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--sd-bg)",
      fontFamily:"'DM Sans',sans-serif", color:"var(--sd-txt)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 20px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <button onClick={() => window.history.back()}
            style={{ marginBottom:12, display:"inline-flex", alignItems:"center", gap:7,
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
              background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
              borderRadius:8, padding:"5px 14px", color:"var(--sd-txt3)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                fontSize:"clamp(22px,4vw,34px)", letterSpacing:-.5,
                margin:"0 0 4px", color:"var(--sd-txt)" }}>
                Shift Dashboard
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--sd-txt4)", margin:0 }}>
                Today's encounters · Auto-refreshes every 60s · Click dot to toggle active/discharged
              </p>
            </div>

            {/* Stat pills */}
            <div style={{ marginLeft:"auto", display:"flex", gap:8, flexWrap:"wrap",
              alignItems:"center" }}>
              {[
                { label:"Total",       val:stats.total,      color:"var(--sd-txt3)"   },
                { label:"Active",      val:stats.active,     color:"var(--sd-green)"  },
                { label:"D/C'd",       val:stats.discharged, color:"var(--sd-txt4)"   },
                { label:"Complete",    val:stats.complete,   color:"var(--sd-teal)"   },
                { label:"High MDM",    val:stats.highMDM,    color:"var(--sd-red)"    },
              ].map(s => (
                <div key={s.label} style={{ padding:"6px 12px", borderRadius:8,
                  background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                    fontSize:20, color:s.color, lineHeight:1 }}>{s.val}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--sd-txt4)", letterSpacing:.8,
                    textTransform:"uppercase" }}>{s.label}</span>
                </div>
              ))}
              <button onClick={generateHandoff}
                disabled={handoffBusy || stats.active === 0}
                style={{ padding:"8px 18px", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                  border:`1px solid ${handoffBusy ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.45)"}`,
                  background:handoffBusy ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.12)",
                  color:handoffBusy ? "var(--sd-txt4)" : "var(--sd-purple)",
                  opacity:stats.active===0 ? .4 : 1, transition:"all .15s" }}>
                {handoffBusy ? "Generating…" : "✦ Generate Handoff"}
              </button>
              <button onClick={() => window.location.href="/QuickNote"}
                style={{ padding:"8px 18px", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                  border:"1px solid rgba(0,229,192,.45)", background:"rgba(0,229,192,.12)",
                  color:"var(--sd-teal)", transition:"all .15s" }}>
                + New Encounter
              </button>
              <button onClick={load}
                style={{ padding:"6px 12px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                  border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.6)",
                  color:"var(--sd-txt4)", letterSpacing:.5, textTransform:"uppercase" }}>
                ↺ Refresh
              </button>
            </div>
          </div>
          {lastRefresh && (
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"rgba(107,158,200,.4)", marginTop:6, letterSpacing:.5 }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · Showing today's encounters only
            </div>
          )}
        </div>

        {/* Handoff output */}
        {handoff && (
          <div style={{ marginBottom:16, padding:"14px 16px", borderRadius:12,
            background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.35)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:14, color:"var(--sd-purple)", flex:1 }}>Shift Handoff</span>
              <button onClick={copyHandoff}
                style={{ padding:"5px 14px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${copiedHandoff ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.4)"}`,
                  background:copiedHandoff ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.1)",
                  color:copiedHandoff ? "var(--sd-green)" : "var(--sd-purple)",
                  transition:"all .15s" }}>
                {copiedHandoff ? "✓ Copied" : "Copy Handoff"}
              </button>
              <button onClick={() => setHandoff(null)}
                style={{ background:"transparent", border:"none", cursor:"pointer",
                  color:"var(--sd-txt4)", fontSize:16 }}>✕</button>
            </div>
            <pre style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--sd-txt2)", lineHeight:1.7, whiteSpace:"pre-wrap", margin:0 }}>
              {handoff}
            </pre>
          </div>
        )}

        {/* Table */}
        {loading && notes.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0",
            fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"var(--sd-txt4)" }}>
            <span className="sd-spin" style={{ fontSize:20, marginRight:10 }}>⟳</span>
            Loading shift…
          </div>
        ) : error ? (
          <div style={{ padding:"16px", borderRadius:10, textAlign:"center",
            background:"rgba(255,68,68,.07)", border:"1px solid rgba(255,68,68,.3)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--sd-coral)" }}>
            {error}
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🏥</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16,
              color:"var(--sd-txt)", marginBottom:8 }}>No encounters saved today</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--sd-txt4)", marginBottom:18 }}>
              Save a QuickNote to see it on the dashboard
            </div>
            <button onClick={() => window.location.href="/QuickNote"}
              style={{ padding:"9px 22px", borderRadius:8, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                border:"1px solid rgba(0,229,192,.45)", background:"rgba(0,229,192,.12)",
                color:"var(--sd-teal)" }}>
              Open QuickNote
            </button>
          </div>
        ) : (
          <div style={{ background:"rgba(8,22,40,.5)", border:"1px solid rgba(42,79,122,.4)",
            borderRadius:12, overflow:"hidden" }}>
            {/* Table header */}
            <div style={{ display:"grid",
              gridTemplateColumns:"48px 1fr 140px 120px 160px",
              background:"rgba(14,37,68,.8)",
              borderBottom:"1px solid rgba(42,79,122,.5)" }}>
              {["Time","Chief Complaint / Diagnosis","MDM / Disp","Status",""].map((h, i) => (
                <div key={i} style={{ padding:"8px 0 8px" + (i===0?" 0 8px 14px":" 12px"),
                  fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                  color:"var(--sd-txt4)", letterSpacing:1, textTransform:"uppercase" }}>
                  {h}
                </div>
              ))}
            </div>
            {notes.map((n, i) => (
              <EncounterRow key={n.id} note={n} idx={i}
                onToggleActive={handleToggleActive}
                onContinue={() => {}} />
            ))}
          </div>
        )}

        <div style={{ marginTop:28, textAlign:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(107,158,200,.4)", letterSpacing:1.5 }}>
          NOTRYA SHIFT DASHBOARD · TODAY'S ENCOUNTERS · CLICK DOT TO TOGGLE DISCHARGE STATUS
        </div>
      </div>
    </div>
  );
}