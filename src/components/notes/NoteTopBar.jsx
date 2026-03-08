import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Clock, Sparkles, PenLine } from "lucide-react";
import ExportPDFButton from "./ExportPDFButton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const T = {
  navy: "#050f1e",
  panel: "#0e2340",
  border: "#1e3a5f",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  green: "#2ecc71",
  amber: "#f5a623",
  red: "#ff5c6c",
};

export default function NoteTopBar({ note, noteId, queryClient, onNext, autoSaveStatus }) {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState("00:00");
  const [timerStopped, setTimerStopped] = useState(false);
  const stoppedAtRef = React.useRef(null);

  // Timer: counts up from created_date, stops on finalize or manual stop
  useEffect(() => {
    const start = note?.created_date ? new Date(note.created_date) : new Date();
    const autoStopped = note?.updated_date && note?.status !== "draft" ? new Date(note.updated_date) : null;

    const calc = () => {
      const endTime = stoppedAtRef.current || autoStopped;
      const to = endTime ? endTime.getTime() : Date.now();
      const diff = Math.max(0, Math.floor((to - start.getTime()) / 1000));
      const h = Math.floor(diff / 3600).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}`);
    };

    calc();
    if (stoppedAtRef.current || autoStopped) return;
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [note?.created_date, note?.updated_date, note?.status, timerStopped]);

  function handleToggleTimer() {
    if (timerStopped) {
      stoppedAtRef.current = null;
      setTimerStopped(false);
    } else {
      stoppedAtRef.current = new Date();
      setTimerStopped(true);
    }
  }

  const handleSaveDraft = async () => {
    await base44.entities.ClinicalNote.update(noteId, { status: "draft" });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
  };

  const noteTypeLabel = {
    progress_note: "Progress Note",
    h_and_p: "H&P",
    discharge_summary: "Discharge",
    consult: "Consult",
    procedure_note: "Procedure",
  }[note?.note_type] || "ER Note";

  const statusColor = note?.status === "finalized" ? T.green : note?.status === "amended" ? T.amber : "#a78bfa";
  const statusLetter = note?.status === "finalized" ? "F" : note?.status === "amended" ? "A" : "S";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 20px",
      background: T.panel,
      borderBottom: `1px solid ${T.border}`,
      flexShrink: 0,
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Left: Title + breadcrumb */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.bright, fontFamily: "DM Sans, sans-serif" }}>
            {noteTypeLabel}
          </span>
          <span style={{ fontSize: 13, color: T.dim }}>—</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: statusColor,
            background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
            borderRadius: 4, padding: "1px 6px",
          }}>{statusLetter}</span>
        </div>
        <div style={{ fontSize: 11, color: T.dim, display: "flex", alignItems: "center", gap: 4 }}>
          <span>ClinAI</span>
          <span>/</span>
          <span>Emergency Department</span>
          {note?.patient_id && (
            <>
              <span>/</span>
              <span>PT-{note.patient_id}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: badges + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* ESI badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(255,92,108,0.12)", border: "1px solid rgba(255,92,108,0.3)",
          fontSize: 12, fontWeight: 700, color: "#ff8a95",
        }}>
          <Zap size={11} fill="#ff8a95" />
          ESI-2
        </div>

        {/* Timer */}
        <div
          onClick={handleToggleTimer}
          title={timerStopped ? "Click to resume timer" : "Click to pause timer"}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20, cursor: "pointer",
            background: timerStopped ? "rgba(245,166,35,0.1)" : "rgba(200,221,240,0.07)",
            border: `1px solid ${timerStopped ? "rgba(245,166,35,0.4)" : T.border}`,
            fontSize: 12, fontWeight: 600,
            color: timerStopped ? T.amber : T.text,
            transition: "all .15s",
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: timerStopped ? 1 : "50%", background: timerStopped ? T.amber : T.text }} />
          {elapsed}
          <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 2 }}>{timerStopped ? "▶" : "⏸"}</span>
        </div>

        {/* AI Active */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)",
          fontSize: 12, fontWeight: 600, color: T.green,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
          AI ACTIVE
        </div>

        {/* Edit in Studio */}
        <button
          onClick={() => navigate(createPageUrl(`ClinicalNoteStudio?noteId=${noteId}`))}
          title="Edit in Note Studio"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20, cursor: "pointer",
            background: "rgba(0,212,188,0.08)", border: "1px solid rgba(0,212,188,0.3)",
            fontSize: 12, fontWeight: 600, color: T.teal, transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,188,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,212,188,0.08)"; }}
        >
          <PenLine size={12} />
          Edit in Studio
        </button>

        {/* Export */}
        <ExportPDFButton note={note} noteId={noteId} />

        {/* Autosave status */}
        {autoSaveStatus && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20,
            background: autoSaveStatus === 'saving' ? "rgba(74,114,153,0.15)" : "rgba(46,204,113,0.08)",
            border: `1px solid ${autoSaveStatus === 'saving' ? T.border : "rgba(46,204,113,0.3)"}`,
            fontSize: 11, fontWeight: 600,
            color: autoSaveStatus === 'saving' ? T.dim : T.green,
            transition: "all 0.3s",
          }}>
            {autoSaveStatus === 'saving' ? (
              <><Clock size={10} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
            ) : (
              <><Sparkles size={10} /> Saved</>
            )}
          </div>
        )}

        {/* Save Draft */}
        <button onClick={handleSaveDraft} style={{
          padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: "transparent", border: `1px solid ${T.border}`,
          color: T.text, cursor: "pointer", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.dim; e.currentTarget.style.color = T.bright; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
        >
          Save Draft
        </button>

        {/* Next */}
        {onNext && (
          <button onClick={onNext} style={{
            padding: "5px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: `linear-gradient(135deg, ${T.teal}, #00a896)`,
            border: "none", color: T.navy, cursor: "pointer", transition: "opacity 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Next: Objective →
          </button>
        )}
      </div>
    </div>
  );
}