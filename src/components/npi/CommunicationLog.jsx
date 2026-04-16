// CommunicationLog.jsx
// Tracks all clinical communications for the encounter:
// consult calls, family notifications, specialist callbacks,
// EMS report, nursing handoffs, interpreter services, etc.
//
// Self-contained — no external state dependency.
// Props: entries (array), onChange(entries) — or use standalone mode.

import { useState, useCallback } from "react";

const T = {
  bg:"#050f1e", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.7)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", green:"#3dffa0", purple:"#9b6dff",
};

const COMM_TYPES = [
  { id:"consult",    label:"Consult",           icon:"👥", color:T.blue   },
  { id:"family",     label:"Family/Guardian",   icon:"👨‍👩‍👧", color:T.green  },
  { id:"specialist", label:"Specialist Callback",icon:"📞", color:T.purple },
  { id:"ems",        label:"EMS Report",         icon:"🚑", color:T.orange },
  { id:"pcp",        label:"PCP Notification",   icon:"🏥", color:T.teal   },
  { id:"nursing",    label:"Nursing Handoff",    icon:"🤝", color:T.gold   },
  { id:"interpreter",label:"Interpreter",        icon:"🌐", color:"#00cec9" },
  { id:"pharmacy",   label:"Pharmacy",           icon:"💊", color:"#fd79a8" },
  { id:"social",     label:"Social Work",        icon:"🧡", color:T.coral  },
  { id:"other",      label:"Other",              icon:"💬", color:T.txt3   },
];

const DIRECTIONS = ["Outgoing", "Incoming", "In Person"];
const OUTCOMES   = ["Completed", "Voicemail", "No Answer", "Pending Callback", "Refused", "In Progress"];

const now = () => {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
};

const todayStr = () => new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

function TypeBadge({ type }) {
  const t = COMM_TYPES.find(c => c.id === type) || COMM_TYPES[COMM_TYPES.length - 1];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 8px", borderRadius:4,
      background:`${t.color}15`, border:`1px solid ${t.color}40`,
      fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600,
      color:t.color, textTransform:"uppercase", letterSpacing:1, whiteSpace:"nowrap" }}>
      {t.icon} {t.label}
    </span>
  );
}

function OutcomeBadge({ outcome }) {
  const c = outcome === "Completed" ? T.teal
    : outcome === "Pending Callback" ? T.gold
    : outcome === "No Answer" || outcome === "Voicemail" ? T.orange
    : outcome === "Refused" ? T.coral
    : T.txt4;
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
      color:c, background:`${c}12`, border:`1px solid ${c}30`,
      borderRadius:4, padding:"2px 7px", whiteSpace:"nowrap" }}>
      {outcome}
    </span>
  );
}

function EntryRow({ entry, onRemove, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderRadius:9, background:T.card, border:`1px solid ${T.bd}`,
      marginBottom:6, overflow:"hidden" }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        padding:"9px 13px", cursor:"pointer", flexWrap:"wrap" }}
        onClick={() => setExpanded(e => !e)}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
          color:T.txt4, flexShrink:0 }}>
          {entry.time || "—"}
        </span>
        <TypeBadge type={entry.type} />
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
          fontWeight:600, color:T.txt, flex:1, minWidth:0,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {entry.contact || "—"}
        </span>
        {entry.outcome && <OutcomeBadge outcome={entry.outcome} />}
        <span style={{ color:T.txt4, fontSize:10, flexShrink:0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding:"0 13px 12px", borderTop:`1px solid ${T.bd}` }}>
          {entry.direction && (
            <div style={{ marginTop:8, marginBottom:6, fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.txt4, letterSpacing:1 }}>
              {entry.direction.toUpperCase()}
            </div>
          )}
          {entry.note && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt2, lineHeight:1.65, background:T.up,
              padding:"8px 11px", borderRadius:7,
              border:`1px solid ${T.bd}`, whiteSpace:"pre-wrap" }}>
              {entry.note}
            </div>
          )}
          {entry.callbackTime && (
            <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.gold }}>
              📞 Callback expected: {entry.callbackTime}
            </div>
          )}
          <div style={{ display:"flex", gap:7, marginTop:10 }}>
            <button onClick={() => onEdit(entry)}
              style={{ padding:"5px 12px", borderRadius:7, fontSize:11,
                fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                background:"rgba(59,158,255,0.1)", border:"1px solid rgba(59,158,255,0.3)",
                color:T.blue }}>
              Edit
            </button>
            <button onClick={() => onRemove(entry.id)}
              style={{ padding:"5px 12px", borderRadius:7, fontSize:11,
                fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.25)",
                color:T.coral }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const BLANK = { type:"consult", direction:"Outgoing", contact:"", outcome:"Completed", note:"", time:"", callbackTime:"" };

function EntryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...BLANK, time:now(), ...initial });
  const set = k => v => setForm(p => ({ ...p, [k]:v }));
  const inp = (focus) => ({
    width:"100%", padding:"7px 10px",
    background:T.up, border:`1px solid ${focus ? "rgba(59,158,255,0.5)" : T.bd}`,
    borderRadius:7, color:T.txt, fontFamily:"'DM Sans',sans-serif",
    fontSize:12.5, outline:"none", boxSizing:"border-box",
  });

  return (
    <div style={{ padding:"14px 16px", borderRadius:10, background:T.card,
      border:`1px solid rgba(59,158,255,0.3)`, marginBottom:14 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:T.blue, letterSpacing:"1.5px", textTransform:"uppercase",
        marginBottom:12 }}>
        {initial?.id ? "Edit Entry" : "New Communication"}
      </div>

      {/* Type + Direction row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>
            Type
          </div>
          <select value={form.type} onChange={e => set("type")(e.target.value)}
            style={{ ...inp(false), cursor:"pointer" }}>
            {COMM_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>
            Direction
          </div>
          <select value={form.direction} onChange={e => set("direction")(e.target.value)}
            style={{ ...inp(false), cursor:"pointer" }}>
            {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Contact */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>
          Contact / Person / Service
        </div>
        <input value={form.contact} onChange={e => set("contact")(e.target.value)}
          placeholder="e.g. Dr. Smith — Surgery, Patient's wife Jane, EMS Unit 7..."
          style={inp(!!form.contact)} />
      </div>

      {/* Time + Outcome */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>
            Time
          </div>
          <input type="time" value={form.time} onChange={e => set("time")(e.target.value)}
            style={inp(false)} />
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>
            Outcome
          </div>
          <select value={form.outcome} onChange={e => set("outcome")(e.target.value)}
            style={{ ...inp(false), cursor:"pointer" }}>
            {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Callback time (conditional) */}
      {(form.outcome === "Pending Callback" || form.outcome === "Voicemail") && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>
            Expected Callback Time
          </div>
          <input type="time" value={form.callbackTime}
            onChange={e => set("callbackTime")(e.target.value)}
            style={inp(false)} />
        </div>
      )}

      {/* Note */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>
          Notes / Summary
        </div>
        <textarea value={form.note} onChange={e => set("note")(e.target.value)}
          rows={3} placeholder="Brief summary of communication, information conveyed, or instructions given..."
          style={{ ...inp(!!form.note), resize:"vertical", lineHeight:1.6 }} />
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => onSave(form)}
          disabled={!form.contact.trim()}
          style={{ flex:1, padding:"9px", borderRadius:8,
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
            cursor:form.contact.trim() ? "pointer" : "not-allowed",
            border:"none", transition:"all .15s",
            background:form.contact.trim() ? `linear-gradient(135deg,${T.teal},#00b4a0)` : "rgba(26,53,85,0.4)",
            color:form.contact.trim() ? "#050f1e" : T.txt4 }}>
          {initial?.id ? "Save Changes" : "Log Communication"}
        </button>
        <button onClick={onCancel}
          style={{ padding:"9px 18px", borderRadius:8, fontSize:13,
            fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:"pointer",
            background:"transparent", border:`1px solid ${T.bd}`, color:T.txt4 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function CommunicationLog({ entries: externalEntries, onChange }) {
  // Support both controlled (props) and standalone (internal state) modes
  const [internalEntries, setInternalEntries] = useState([]);
  const entries = externalEntries ?? internalEntries;
  const setEntries = useCallback((updater) => {
    const next = typeof updater === "function" ? updater(entries) : updater;
    if (onChange) onChange(next);
    else setInternalEntries(next);
  }, [entries, onChange]);

  const [showForm, setShowForm]   = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [filter, setFilter]       = useState("all");

  const handleSave = useCallback((form) => {
    if (form.id) {
      setEntries(prev => prev.map(e => e.id === form.id ? form : e));
    } else {
      setEntries(prev => [...prev, { ...form, id: Date.now().toString(), date: todayStr() }]);
    }
    setShowForm(false);
    setEditEntry(null);
  }, [setEntries]);

  const handleRemove = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, [setEntries]);

  const handleEdit = useCallback((entry) => {
    setEditEntry(entry);
    setShowForm(false);
  }, []);

  const filtered = filter === "all" ? entries
    : entries.filter(e => e.type === filter);

  const pendingCallbacks = entries.filter(e =>
    e.outcome === "Pending Callback" || e.outcome === "Voicemail"
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        marginBottom:14, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16,
            fontWeight:700, color:T.txt }}>
            Communication Log
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt4, marginTop:1 }}>
            {entries.length} entr{entries.length !== 1 ? "ies" : "y"} this encounter
          </div>
        </div>
        <button onClick={() => { setEditEntry(null); setShowForm(s => !s); }}
          style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8,
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12.5,
            cursor:"pointer", border:"none", transition:"all .15s",
            background:`linear-gradient(135deg,${T.blue},#2080d0)`,
            color:"#fff" }}>
          + Log Communication
        </button>
      </div>

      {/* Pending callbacks alert */}
      {pendingCallbacks.length > 0 && (
        <div style={{ padding:"9px 13px", borderRadius:8, marginBottom:12,
          background:"rgba(245,200,66,0.08)", border:"1px solid rgba(245,200,66,0.35)",
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:14, flexShrink:0 }}>📞</span>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              fontWeight:600, color:T.gold }}>
              {pendingCallbacks.length} pending callback{pendingCallbacks.length > 1 ? "s" : ""}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>
              {pendingCallbacks.map(e => `${e.contact}${e.callbackTime ? " @ " + e.callbackTime : ""}`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* New entry form */}
      {showForm && !editEntry && (
        <EntryForm
          initial={null}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editEntry && (
        <EntryForm
          initial={editEntry}
          onSave={handleSave}
          onCancel={() => setEditEntry(null)}
        />
      )}

      {/* Filter chips */}
      {entries.length > 0 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          <button key="all" onClick={() => setFilter("all")}
            style={{ padding:"3px 11px", borderRadius:20, fontSize:11,
              fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              border:`1px solid ${filter==="all" ? "rgba(59,158,255,.5)" : T.bd}`,
              background:filter==="all" ? "rgba(59,158,255,.12)" : "transparent",
              color:filter==="all" ? T.blue : T.txt4 }}>
            All ({entries.length})
          </button>
          {COMM_TYPES.filter(t => entries.some(e => e.type === t.id)).map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              style={{ padding:"3px 11px", borderRadius:20, fontSize:11,
                fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                border:`1px solid ${filter===t.id ? t.color+"77" : T.bd}`,
                background:filter===t.id ? `${t.color}12` : "transparent",
                color:filter===t.id ? t.color : T.txt4 }}>
              {t.icon} {t.label} ({entries.filter(e => e.type === t.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div style={{ padding:"40px 20px", textAlign:"center",
          color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
          <div>No communications logged{filter !== "all" ? " for this type" : " yet"}</div>
          <div style={{ fontSize:11, marginTop:4, color:T.txt4 }}>
            Log consults, family notifications, EMS reports, and more
          </div>
        </div>
      ) : (
        filtered.map(entry => (
          <EntryRow
            key={entry.id}
            entry={entry}
            onRemove={handleRemove}
            onEdit={handleEdit}
          />
        ))
      )}

      {/* Footer summary */}
      {entries.length > 0 && (
        <div style={{ marginTop:12, padding:"8px 12px", borderRadius:8,
          background:T.up, border:`1px solid ${T.bd}`,
          fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.txt4, letterSpacing:1, textAlign:"center" }}>
          {entries.filter(e=>e.outcome==="Completed").length} completed ·{" "}
          {pendingCallbacks.length} pending ·{" "}
          {entries.length} total — {todayStr()}
        </div>
      )}
    </div>
  );
}