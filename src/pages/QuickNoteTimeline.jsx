// QuickNoteTimeline.jsx
// ED encounter event timeline with timestamps for legal documentation
// Exported: TimelineCard

import React, { useState } from "react";

const DEFAULT_EVENTS = [
  { id:"triage",       label:"Triage",                  time:"", notes:"" },
  { id:"physician",    label:"Physician Evaluation",     time:"", notes:"" },
  { id:"labs_ordered", label:"Labs Ordered",             time:"", notes:"" },
  { id:"labs_result",  label:"Labs Resulted",            time:"", notes:"" },
  { id:"img_ordered",  label:"Imaging Ordered",          time:"", notes:"" },
  { id:"img_result",   label:"Imaging Resulted",         time:"", notes:"" },
  { id:"recheck",      label:"Recheck Vitals / Reassess",time:"", notes:"" },
  { id:"disposition",  label:"Disposition Decision",     time:"", notes:"" },
];

export function TimelineCard({ timestamps, setTimestamps, onCopy }) {
  const [expanded,  setExpanded]  = useState(false);
  const [medEvents, setMedEvents] = useState([]);
  const [copied,    setCopied]    = useState(false);

  const updateEvent = (id, field, val) => {
    setTimestamps(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const addMedEvent = () => {
    setMedEvents(prev => [...prev, {
      id: `med-${Date.now()}`, label:"Medication Given", time:"", notes:"",
    }]);
  };

  const updateMed = (id, field, val) => {
    setMedEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const removeMed = (id) => setMedEvents(prev => prev.filter(e => e.id !== id));

  const handleCopy = () => {
    const allEvents = [...timestamps, ...medEvents]
      .filter(e => e.time)
      .sort((a, b) => a.time.localeCompare(b.time));
    if (!allEvents.length) return;
    const lines = ["ED ENCOUNTER TIMELINE", ""];
    allEvents.forEach(e => {
      lines.push(`${e.time}  ${e.label}${e.notes ? " — " + e.notes : ""}`);
    });
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      if (onCopy) onCopy(text);
    });
  };

  const filledCount = [...timestamps, ...medEvents].filter(e => e.time).length;

  return (
    <div style={{ marginBottom:12, borderRadius:12,
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(42,79,122,.35)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
        cursor:"pointer" }} onClick={() => setExpanded(e => !e)}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-txt4)", letterSpacing:1.5, textTransform:"uppercase", flex:1 }}>
          ⏱ Encounter Timeline
        </span>
        {filledCount > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-teal)", letterSpacing:.5 }}>{filledCount} events</span>
        )}
        {filledCount > 0 && (
          <button onClick={e => { e.stopPropagation(); handleCopy(); }}
            style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.4)"}`,
              background:"transparent",
              color:copied ? "var(--qn-green)" : "var(--qn-txt4)",
              letterSpacing:.4, transition:"all .15s" }}>
            {copied ? "✓ Copied" : "Copy Timeline"}
          </button>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding:"0 14px 14px", borderTop:"1px solid rgba(42,79,122,.25)" }}>
          <div style={{ marginTop:10, display:"grid", gap:5 }}>
            {timestamps.map(evt => (
              <div key={evt.id} style={{ display:"grid",
                gridTemplateColumns:"160px 1fr", gap:8, alignItems:"center" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt3)", fontWeight:500 }}>{evt.label}</div>
                <div style={{ display:"flex", gap:6 }}>
                  <input type="time" value={evt.time}
                    onChange={e => updateEvent(evt.id, "time", e.target.value)}
                    style={{ padding:"3px 7px", borderRadius:6, fontSize:11,
                      background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.5)",
                      color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace",
                      outline:"none", width:90 }} />
                  <input type="text" value={evt.notes}
                    onChange={e => updateEvent(evt.id, "notes", e.target.value)}
                    placeholder="Notes (optional)"
                    style={{ flex:1, padding:"3px 8px", borderRadius:6, fontSize:11,
                      background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.4)",
                      color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                      outline:"none" }} />
                </div>
              </div>
            ))}

            {medEvents.map(evt => (
              <div key={evt.id} style={{ display:"grid",
                gridTemplateColumns:"160px 1fr auto", gap:8, alignItems:"center" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-orange)", fontWeight:500 }}>Medication Given</div>
                <div style={{ display:"flex", gap:6 }}>
                  <input type="time" value={evt.time}
                    onChange={e => updateMed(evt.id, "time", e.target.value)}
                    style={{ padding:"3px 7px", borderRadius:6, fontSize:11,
                      background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.5)",
                      color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace",
                      outline:"none", width:90 }} />
                  <input type="text" value={evt.notes}
                    onChange={e => updateMed(evt.id, "notes", e.target.value)}
                    placeholder="Drug, dose, route"
                    style={{ flex:1, padding:"3px 8px", borderRadius:6, fontSize:11,
                      background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.4)",
                      color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                      outline:"none" }} />
                </div>
                <button onClick={() => removeMed(evt.id)}
                  style={{ background:"transparent", border:"none", cursor:"pointer",
                    color:"var(--qn-txt4)", fontSize:13, lineHeight:1 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={addMedEvent}
              style={{ padding:"4px 12px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(255,159,67,.35)", background:"rgba(255,159,67,.07)",
                color:"var(--qn-orange)", letterSpacing:.5, transition:"all .15s" }}>
              + Add Medication Event
            </button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"var(--qn-txt4)", letterSpacing:.4 }}>
              Times appear in chart note and support MDM data complexity billing
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_EVENTS };