import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function SavedCasesPanel({ onLoadCase }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");

  const fetchCases = async () => {
    setLoading(true);
    const data = await base44.entities.SavedCase.list("-created_date", 50);
    setCases(data);
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.SavedCase.delete(id);
    setCases(prev => prev.filter(c => c.id !== id));
  };

  const handleEditSave = async (id) => {
    await base44.entities.SavedCase.update(id, { notes: editNotes });
    setCases(prev => prev.map(c => c.id === id ? { ...c, notes: editNotes } : c));
    setEditingId(null);
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditNotes(c.notes || "");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
      {loading ? (
        <div style={{ textAlign: "center", color: "#4a6080", padding: 24, fontSize: 12 }}>Loading...</div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: "center", color: "#4a6080", padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 11 }}>No saved cases yet</div>
        </div>
      ) : (
        cases.map(c => (
          <div key={c.id} style={{
            background: "#0d1628", border: "1px solid rgba(0,196,160,0.1)",
            borderRadius: 8, padding: "10px 12px", marginBottom: 6, marginInline: 8
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.patient_name}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  {c.weight_kg} kg{c.patient_age ? ` · ${c.patient_age}` : ""}
                  {c.broselow_zone ? ` · ${c.broselow_zone}` : ""}
                </div>
                {c.notes && editingId !== c.id && (
                  <div style={{ fontSize: 10, color: "#4a6080", marginTop: 3, fontStyle: "italic" }}>{c.notes}</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => onLoadCase(c)}
                  title="Load into calculator"
                  style={{ background: "rgba(0,196,160,0.1)", border: "1px solid rgba(0,196,160,0.25)", color: "#00c4a0", borderRadius: 5, padding: "3px 7px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                >↗</button>
                <button
                  onClick={() => editingId === c.id ? setEditingId(null) : startEdit(c)}
                  title="Edit notes"
                  style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", color: "#94a3b8", borderRadius: 5, padding: "3px 7px", fontSize: 10, cursor: "pointer" }}
                >✎</button>
                <button
                  onClick={() => handleDelete(c.id)}
                  title="Delete"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 5, padding: "3px 7px", fontSize: 10, cursor: "pointer" }}
                >✕</button>
              </div>
            </div>

            {editingId === c.id && (
              <div style={{ marginTop: 8 }}>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%", background: "#162240", border: "1px solid rgba(0,196,160,0.2)",
                    borderRadius: 6, padding: "6px 8px", color: "#e2e8f0", fontSize: 11,
                    outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 5, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditingId(null)} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(0,196,160,0.2)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  <button onClick={() => handleEditSave(c.id)} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 5, border: "none", background: "#00c4a0", color: "#080e1a", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Save</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}