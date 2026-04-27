// NoteHistory.jsx
// Saved clinical notes from QuickNote and New Patient Input
// Reads from the ClinicalNote entity in Base44 entity storage
// Features: list, filter by source/date/MDM level, expand full note, copy, delete
// Fixes: API call shape, handoff record filtering, full-note search,
//        ICD-10 chips, patient active toggle, Continue in QuickNote

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ─── STYLE INJECTION ─────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("nh-css")) return;
  const s = document.createElement("style"); s.id = "nh-css";
  s.textContent = `
    :root {
      --nh-bg:#050f1e; --nh-panel:#081628; --nh-card:#0b1e36;
      --nh-txt:#f2f7ff; --nh-txt2:#b8d4f0; --nh-txt3:#82aece; --nh-txt4:#6b9ec8;
      --nh-teal:#00e5c0; --nh-gold:#f5c842; --nh-coral:#ff6b6b;
      --nh-blue:#3b9eff; --nh-purple:#9b6dff; --nh-green:#3dffa0;
      --nh-red:#ff4444; --nh-orange:#ff9f43;
      --nh-bd:rgba(42,79,122,0.4); --nh-up:rgba(14,37,68,0.75);
    }
    @keyframes nhfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .nh-fade{animation:nhfade .2s ease both}
    @keyframes nhspin{to{transform:rotate(360deg)}}
    .nh-spin{animation:nhspin .7s linear infinite;display:inline-block}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("nh-fonts")) {
    const l = document.createElement("link"); l.id = "nh-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// Sources that are internal scaffolding — never shown in the note list
const INTERNAL_SOURCES = ["QN-Handoff", "VH-Analysis", "NH-Resume", "superseded"];
const isInternalRecord = (note) =>
  INTERNAL_SOURCES.some(s => (note.source || "").includes(s)) ||
  (note.status === "superseded") ||
  (note.status === "pending" && (note.source || "").includes("Handoff"));

function mdmColor(level) {
  if (!level) return "#6b9ec8";
  const l = level.toLowerCase();
  if (l.includes("high"))            return "#ff4444";
  if (l.includes("moderate"))        return "#ff9f43";
  if (l.includes("low"))             return "#f5c842";
  if (l.includes("straightforward")) return "#3dffa0";
  return "#3b9eff";
}

function dispColor(disp) {
  if (!disp) return "#6b9ec8";
  const d = disp.toLowerCase();
  if (d.includes("icu"))        return "#ff4444";
  if (d.includes("admit"))      return "#ff6b6b";
  if (d.includes("obs"))        return "#ff9f43";
  if (d.includes("transfer"))   return "#9b6dff";
  if (d.includes("precaution")) return "#f5c842";
  return "#3dffa0";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month:"short", day:"numeric", year:"numeric",
      hour:"2-digit", minute:"2-digit"
    });
  } catch { return iso; }
}

function safeParseICD(json) {
  if (!json) return [];
  try { const p = JSON.parse(json); return Array.isArray(p) ? p : []; }
  catch { return []; }
}

const COLOR_HEX = {
  "var(--nh-teal)":   "#00e5c0",
  "var(--nh-purple)": "#9b6dff",
  "var(--nh-blue)":   "#3b9eff",
  "var(--nh-green)":  "#3dffa0",
  "var(--nh-gold)":   "#f5c842",
  "var(--nh-coral)":  "#ff6b6b",
  "var(--nh-red)":    "#ff4444",
};

function Label({ children, color }) {
  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
      color: color || "var(--nh-txt4)", letterSpacing:1.2, textTransform:"uppercase",
      marginBottom:4 }}>
      {children}
    </div>
  );
}

function Badge({ text, color }) {
  if (!text) return null;
  const hex = COLOR_HEX[color] || color;
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
      padding:"2px 8px", borderRadius:20,
      background:`${hex}18`, border:`1px solid ${hex}44`,
      color, letterSpacing:.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>
      {text}
    </span>
  );
}

// ─── NOTE CARD ────────────────────────────────────────────────────────────────
function NoteCard({ note, onDelete, onUpdate }) {
  const [expanded,   setExpanded]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [resuming,   setResuming]   = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const icdCodes = safeParseICD(note.icd_codes_json);
  const lc = mdmColor(note.mdm_level);
  const dc = dispColor(note.disposition);
  const isActive = note.patient_active !== false; // default true if unset

  const handleCopy = () => {
    navigator.clipboard.writeText(note.full_note_text || "").then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await base44.entities.ClinicalNote.delete(note.id);
      onDelete(note.id);
    } catch {
      setDeleting(false); setConfirmDel(false);
    }
  };

  // Toggle patient active/discharged status
  const handleToggleActive = async () => {
    if (togglingActive) return;
    setTogglingActive(true);
    const newVal = !isActive;
    try {
      await base44.entities.ClinicalNote.update(note.id, { patient_active: newVal });
      onUpdate(note.id, { patient_active: newVal });
    } catch {}
    finally { setTogglingActive(false); }
  };

  // Write NH-Resume handoff record → navigate to QuickNote
  const handleContinue = async () => {
    if (resuming) return;
    setResuming(true);
    try {
      // Supersede any prior resume records
      const prior = await base44.entities.ClinicalNote.list({
        sort:"-created_date", limit:5
      }).catch(() => []);
      const stale = (prior || []).filter(r =>
        r.source === "NH-Resume" && r.status === "pending"
      );
      await Promise.all(stale.map(r =>
        base44.entities.ClinicalNote.update(r.id, { status:"superseded" }).catch(() => null)
      ));
      await base44.entities.ClinicalNote.create({
        source:            "NH-Resume",
        status:            "pending",
        encounter_date:    note.encounter_date || new Date().toISOString().split("T")[0],
        cc:                note.cc || "",
        full_note_text:    note.vitals_raw || note.full_note_text || "",
        hpi_raw:           note.hpi_raw || "",
        ros_raw:           note.ros_raw || "",
        exam_raw:          note.exam_raw || "",
        labs_raw:          note.labs_raw || "",
        imaging_raw:       note.imaging_raw || "",
        working_diagnosis: note.working_diagnosis || "",
        mdm_level:         note.mdm_level || "",
        mdm_narrative:     note.mdm_narrative || "",
        patient_identifier: note.patient_identifier || "",
        icd_codes_json:    note.icd_codes_json || "",
      });
      window.location.href = "/QuickNote";
    } catch (e) {
      console.error("Resume failed:", e);
      setResuming(false);
    }
  };

  return (
    <div className="nh-fade" style={{
      background:"rgba(8,22,40,.65)", backdropFilter:"blur(16px)",
      border:"1px solid rgba(42,79,122,.5)", borderRadius:14,
      overflow:"hidden", transition:"border-color .15s",
      opacity: isActive ? 1 : .65,
    }}>

      {/* Card header */}
      <div style={{ padding:"14px 16px", cursor:"pointer" }}
        onClick={() => { setExpanded(e => !e); setConfirmDel(false); }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>

          {/* Left: date + source + active dot */}
          <div style={{ minWidth:140 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--nh-txt4)", marginBottom:3 }}>
              {formatDate(note.created_date)}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <Badge text={note.source || "Note"}
                color={note.source === "QuickNote" ? "var(--nh-teal)" : "var(--nh-purple)"} />
              {/* Active / discharged dot — click to toggle */}
              <div onClick={e => { e.stopPropagation(); handleToggleActive(); }}
                title={isActive ? "Mark discharged" : "Mark active"}
                style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer",
                  padding:"2px 6px", borderRadius:10,
                  background: isActive ? "rgba(61,255,160,.08)" : "rgba(107,158,200,.08)",
                  border:`1px solid ${isActive ? "rgba(61,255,160,.2)" : "rgba(107,158,200,.2)"}`,
                  transition:"all .15s" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
                  background: isActive ? "var(--nh-green)" : "var(--nh-txt4)",
                  transition:"background .2s" }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color: isActive ? "var(--nh-green)" : "var(--nh-txt4)",
                  letterSpacing:.5, textTransform:"uppercase" }}>
                  {togglingActive ? "…" : isActive ? "Active" : "D/C"}
                </span>
              </div>
            </div>
          </div>

          {/* Center: CC + working Dx + ICD codes */}
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:14, color:"var(--nh-txt)", lineHeight:1.3, marginBottom:3 }}>
              {note.cc || "No chief complaint"}
            </div>
            {note.working_diagnosis && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--nh-txt3)", lineHeight:1.4, marginBottom:4 }}>
                {note.working_diagnosis}
              </div>
            )}
            {/* ICD-10 code chips */}
            {icdCodes.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {icdCodes.slice(0, 4).map((c, i) => (
                  <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    fontWeight:700,
                    color: i === 0 ? "var(--nh-teal)" : "var(--nh-txt4)",
                    background: i === 0 ? "rgba(0,229,192,.1)" : "rgba(42,79,122,.2)",
                    border:`1px solid ${i === 0 ? "rgba(0,229,192,.3)" : "rgba(42,79,122,.4)"}`,
                    borderRadius:4, padding:"1px 6px", letterSpacing:.5 }}>
                    {c.code}
                    {i === 0 && (
                      <span style={{ fontSize:7, opacity:.6, marginLeft:3 }}>PRIMARY</span>
                    )}
                  </span>
                ))}
                {icdCodes.length > 4 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--nh-txt4)" }}>+{icdCodes.length - 4}</span>
                )}
              </div>
            )}
          </div>

          {/* Right: MDM + disposition + MRN + chevron */}
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            {note.mdm_level && <Badge text={note.mdm_level} color={lc} />}
            {note.disposition && <Badge text={note.disposition} color={dc} />}
            {note.patient_identifier && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--nh-txt4)", background:"rgba(14,37,68,.6)",
                border:"1px solid rgba(42,79,122,.4)", borderRadius:5,
                padding:"2px 7px" }}>
                MRN {note.patient_identifier}
              </span>
            )}
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:"var(--nh-txt4)", marginLeft:4 }}>
              {expanded ? "▲" : "▼"}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop:"1px solid rgba(42,79,122,.35)", padding:"14px 16px" }}>

          {/* ICD-10 full list */}
          {icdCodes.length > 0 && (
            <div style={{ marginBottom:12, padding:"9px 12px", borderRadius:9,
              background:"rgba(0,229,192,.05)", border:"1px solid rgba(0,229,192,.2)" }}>
              <Label color="var(--nh-teal)">ICD-10 Codes</Label>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {icdCodes.map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                      fontSize:11, color: i === 0 ? "var(--nh-teal)" : "var(--nh-txt3)",
                      minWidth:56 }}>{c.code}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      color:"var(--nh-txt2)" }}>{c.description}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--nh-txt4)", textTransform:"uppercase" }}>{c.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MDM narrative */}
          {note.mdm_narrative && (
            <div style={{ marginBottom:12, padding:"9px 12px", borderRadius:9,
              background:"rgba(155,109,255,.06)", border:"1px solid rgba(155,109,255,.25)" }}>
              <Label color="var(--nh-purple)">MDM Narrative</Label>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--nh-txt2)", lineHeight:1.7 }}>
                {note.mdm_narrative}
              </div>
            </div>
          )}

          {/* Full note text */}
          {note.full_note_text && (
            <div style={{ marginBottom:12 }}>
              <Label color="var(--nh-txt4)">Full Note</Label>
              <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--nh-txt3)", lineHeight:1.7, whiteSpace:"pre-wrap",
                wordBreak:"break-word", background:"rgba(14,37,68,.5)",
                border:"1px solid rgba(42,79,122,.3)", borderRadius:8,
                padding:"10px 12px", margin:0, maxHeight:320, overflowY:"auto" }}>
                {note.full_note_text}
              </pre>
            </div>
          )}

          {/* Provider + encounter date */}
          {(note.provider_name || note.encounter_date) && (
            <div style={{ display:"flex", gap:16, marginBottom:12,
              fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--nh-txt4)" }}>
              {note.encounter_date && <span>Encounter: {note.encounter_date}</span>}
              {note.provider_name  && <span>Provider: {note.provider_name}</span>}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {/* Continue in QuickNote */}
            <button onClick={handleContinue} disabled={resuming}
              style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:"1px solid rgba(0,229,192,.45)",
                background:"rgba(0,229,192,.1)",
                color: resuming ? "var(--nh-txt4)" : "var(--nh-teal)",
                opacity: resuming ? .6 : 1, transition:"all .15s" }}>
              {resuming ? "Opening…" : "Continue in QuickNote →"}
            </button>

            {/* + Addendum — opens QuickNote in Phase 2 addendum mode */}
            {note.status !== "draft" && (
              <button onClick={async () => {
                try {
                  const prior = await base44.entities.ClinicalNote.list(
                    { sort:"-created_date", limit:5 }
                  ).catch(() => []);
                  await Promise.all(
                    (prior||[]).filter(r => r.source === "NH-Addendum" && r.status === "pending")
                      .map(r => base44.entities.ClinicalNote.update(r.id, { status:"superseded" }).catch(() => null))
                  );
                  await base44.entities.ClinicalNote.create({
                    source:"NH-Addendum", status:"pending",
                    encounter_date:      note.encounter_date || "",
                    cc:                  note.cc || "",
                    working_diagnosis:   note.working_diagnosis || "",
                    mdm_level:           note.mdm_level || "",
                    mdm_narrative:       note.mdm_narrative || "",
                    patient_identifier:  note.patient_identifier || "",
                    icd_codes_json:      note.icd_codes_json || "",
                    hpi_raw:             note.hpi_raw || "",
                  });
                  window.location.href = "/QuickNote";
                } catch (e) { console.error("Addendum failed:", e); }
              }}
                style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:"1px solid rgba(59,158,255,.35)", background:"rgba(59,158,255,.06)",
                  color:"var(--nh-blue)", transition:"all .15s" }}>
                + Addendum
              </button>
            )}

            {note.full_note_text && (
              <button onClick={handleCopy}
                style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.5)"}`,
                  background:copied ? "rgba(61,255,160,.1)" : "rgba(14,37,68,.6)",
                  color:copied ? "var(--nh-green)" : "var(--nh-txt3)",
                  transition:"all .15s" }}>
                {copied ? "✓ Copied to clipboard" : "Copy Full Note"}
              </button>
            )}

            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)}
                style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:"1px solid rgba(255,68,68,.3)", background:"rgba(14,37,68,.6)",
                  color:"var(--nh-coral)", transition:"all .15s" }}>
                Delete
              </button>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                padding:"4px 10px", borderRadius:7,
                background:"rgba(255,68,68,.08)", border:"1px solid rgba(255,68,68,.35)" }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--nh-coral)" }}>Delete this note?</span>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:11,
                    border:"1px solid rgba(255,68,68,.5)", background:"rgba(255,68,68,.2)",
                    color:"var(--nh-red)", opacity: deleting ? .5 : 1 }}>
                  {deleting ? "…" : "Yes, delete"}
                </button>
                <button onClick={() => setConfirmDel(false)}
                  style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.6)",
                    color:"var(--nh-txt4)" }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function NoteHistoryPage() {
  const [notes,        setNotes]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filterSource, setFilterSource] = useState("All");
  const [filterMDM,    setFilterMDM]    = useState("All");
  const [filterActive, setFilterActive] = useState("active"); // "active" | "all" | "discharged"
  const [filterDays,   setFilterDays]   = useState("30");
  const [search,       setSearch]       = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // FIX: Base44 API uses list({ sort, limit }) — not positional args
      const result = await base44.entities.ClinicalNote.list({
        sort:"-created_date",
        limit:300,
      });
      // FIX: filter out internal scaffolding records after fetch
      const clinical = (result || []).filter(n => !isInternalRecord(n));
      setNotes(clinical);
    } catch (e) {
      setError("Failed to load notes: " + (e.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id) => setNotes(n => n.filter(x => x.id !== id));
  const handleUpdate = (id, patch) =>
    setNotes(n => n.map(x => x.id === id ? { ...x, ...patch } : x));

  const cutoffMs = filterDays === "All" ? null
    : Date.now() - parseInt(filterDays) * 86400000;

  const filtered = notes.filter(n => {
    // Date filter — applied client-side now that API sort/filter is fixed
    if (cutoffMs && new Date(n.created_date).getTime() < cutoffMs) return false;
    // Source filter
    if (filterSource !== "All" && n.source !== filterSource) return false;
    // MDM filter
    if (filterMDM !== "All") {
      const l = (n.mdm_level || "").toLowerCase();
      if (filterMDM === "High"           && !l.includes("high"))            return false;
      if (filterMDM === "Moderate"       && !l.includes("moderate"))        return false;
      if (filterMDM === "Low"            && !l.includes("low"))             return false;
      if (filterMDM === "Straightforward"&& !l.includes("straightforward")) return false;
    }
    // Active filter
    if (filterActive === "active"     && n.patient_active === false)  return false;
    if (filterActive === "discharged" && n.patient_active !== false)  return false;
    // FIX: search now includes full_note_text
    if (search) {
      const q = search.toLowerCase();
      return (n.cc                || "").toLowerCase().includes(q) ||
             (n.working_diagnosis || "").toLowerCase().includes(q) ||
             (n.patient_identifier|| "").toLowerCase().includes(q) ||
             (n.mdm_narrative     || "").toLowerCase().includes(q) ||
             (n.full_note_text    || "").toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount     = notes.filter(n => n.patient_active !== false).length;
  const dischargedCount = notes.filter(n => n.patient_active === false).length;

  return (
    <div style={{ minHeight:"100vh", background:"var(--nh-bg)",
      fontFamily:"'DM Sans',sans-serif", color:"var(--nh-txt)",
      padding:"28px 24px 48px", maxWidth:900, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <button onClick={() => window.history.back()}
          style={{ marginBottom:12, display:"inline-flex", alignItems:"center", gap:7,
            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
            background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
            borderRadius:8, padding:"5px 14px", color:"var(--nh-txt3)", cursor:"pointer" }}>
          ← Back
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6,
          flexWrap:"wrap" }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
            fontSize:"clamp(22px,4vw,34px)", letterSpacing:-.5, margin:0,
            color:"var(--nh-txt)" }}>
            Note History
          </h1>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--nh-teal)", letterSpacing:1.5, textTransform:"uppercase",
            background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.25)",
            borderRadius:4, padding:"2px 8px" }}>
            QuickNote · NPI
          </span>
          {/* Active / discharged summary */}
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--nh-green)" }}>
              ● {activeCount} active
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--nh-txt4)" }}>
              ○ {dischargedCount} d/c
            </span>
          </div>
        </div>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"var(--nh-txt4)", margin:0 }}>
          Saved clinical notes · Copy to clipboard to paste into your EMR ·
          Click active dot to toggle discharge status
        </p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center",
        marginBottom:16, padding:"12px 14px", borderRadius:10,
        background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}>

        {/* Search — FIX: searches full note text */}
        <div style={{ position:"relative", flex:"1 1 200px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search CC, diagnosis, MRN, note text…"
            style={{ width:"100%", background:"rgba(14,37,68,.7)",
              border:"1px solid rgba(42,79,122,.5)", borderRadius:8,
              padding:"7px 12px", color:"var(--nh-txt)",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
              boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor = "rgba(0,229,192,.5)"}
            onBlur={e  => e.target.style.borderColor = "rgba(42,79,122,.5)"} />
        </div>

        {/* Source filter */}
        {["All","QuickNote","NPI"].map(s => (
          <button key={s} onClick={() => setFilterSource(s)}
            style={{ padding:"6px 12px", borderRadius:20, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
              transition:"all .15s",
              border:`1px solid ${filterSource === s ? "rgba(0,229,192,.45)" : "rgba(42,79,122,.4)"}`,
              background:filterSource === s ? "rgba(0,229,192,.12)" : "transparent",
              color:filterSource === s ? "var(--nh-teal)" : "var(--nh-txt3)" }}>
            {s}
          </button>
        ))}

        {/* Active filter */}
        {[["active","Active only"],["all","All patients"],["discharged","Discharged"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilterActive(v)}
            style={{ padding:"6px 12px", borderRadius:20, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
              transition:"all .15s",
              border:`1px solid ${filterActive === v ? "rgba(61,255,160,.45)" : "rgba(42,79,122,.4)"}`,
              background:filterActive === v ? "rgba(61,255,160,.1)" : "transparent",
              color:filterActive === v ? "var(--nh-green)" : "var(--nh-txt3)" }}>
            {l}
          </button>
        ))}

        {/* MDM filter */}
        <select value={filterMDM} onChange={e => setFilterMDM(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:8, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontSize:11,
            background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.4)",
            color:"var(--nh-txt3)", outline:"none" }}>
          {["All","High","Moderate","Low","Straightforward"].map(o => (
            <option key={o} value={o}>{o === "All" ? "All MDM levels" : o}</option>
          ))}
        </select>

        {/* Date range — FIX: now client-side, API call no longer passes unsupported params */}
        <select value={filterDays} onChange={e => setFilterDays(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:8, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontSize:11,
            background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.4)",
            color:"var(--nh-txt3)", outline:"none" }}>
          {[["7","Last 7 days"],["30","Last 30 days"],["90","Last 90 days"],["All","All time"]].map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--nh-txt4)", marginLeft:"auto", whiteSpace:"nowrap" }}>
          {filtered.length} note{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Note list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0",
          fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"var(--nh-txt4)" }}>
          <span className="nh-spin" style={{ fontSize:20, marginRight:10 }}>⟳</span>
          Loading notes…
        </div>
      ) : error ? (
        <div style={{ padding:"16px", borderRadius:10, textAlign:"center",
          background:"rgba(255,68,68,.07)", border:"1px solid rgba(255,68,68,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--nh-coral)" }}>
          {error}
          <button onClick={load} style={{ marginLeft:12, padding:"4px 12px", borderRadius:6,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11,
            border:"1px solid rgba(255,68,68,.4)", background:"rgba(255,68,68,.1)",
            color:"var(--nh-coral)" }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16,
            color:"var(--nh-txt)", marginBottom:6 }}>
            {notes.length === 0 ? "No notes saved yet" : "No notes match this filter"}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--nh-txt4)" }}>
            {notes.length === 0
              ? "Save a note from QuickNote or New Patient Input to see it here"
              : "Try adjusting the filters above"}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(n => (
            <NoteCard key={n.id} note={n} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <div style={{ marginTop:32, textAlign:"center",
        fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--nh-txt4)", letterSpacing:1.5 }}>
        NOTRYA NOTE HISTORY · CLINICAL CONTENT ONLY · PASTE INTO EMR TO CHART
      </div>
    </div>
  );
}