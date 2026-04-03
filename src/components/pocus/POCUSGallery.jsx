import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36",
  b: "rgba(26,53,85,0.8)", txt: "#e8f0fe", txt2: "#8aaccc",
  txt3: "#4a6a8a", txt4: "#2e4a6a",
  teal: "#00e5c0", red: "#ff4444", yellow: "#f5c842",
  blue: "#3b9eff", coral: "#ff6b6b",
};

const PRESET_TAGS = [
  "Pericardial Effusion", "Tamponade", "Pneumothorax", "B-Lines",
  "Free Fluid", "RV Dilation", "Pleural Effusion", "IVC Collapsible",
  "IVC Plethoric", "McConnell Sign", "Consolidation", "Normal",
];

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");
  const add = (tag) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  const remove = (t) => onChange(tags.filter(x => x !== t));
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
        {tags.map(t => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(0,229,192,0.12)", border: "1px solid rgba(0,229,192,0.3)", color: T.teal, fontSize: 11 }}>
            {t}
            <button onClick={() => remove(t)} style={{ background: "none", border: "none", color: T.teal, cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PRESET_TAGS.filter(t => !tags.includes(t)).map(t => (
          <button key={t} onClick={() => add(t)}
            style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(14,37,68,0.8)", border: "1px solid rgba(42,79,122,0.4)", color: T.txt3, fontSize: 10, cursor: "pointer" }}>
            + {t}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(input); }}
          placeholder="Custom tag + Enter"
          style={{ flex: 1, background: "rgba(14,37,68,0.7)", border: "1px solid rgba(42,79,122,0.5)", borderRadius: 7, padding: "5px 10px", color: T.txt, fontSize: 12, outline: "none" }} />
        <button onClick={() => add(input)}
          style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(0,229,192,0.15)", border: "1px solid rgba(0,229,192,0.35)", color: T.teal, fontSize: 12, cursor: "pointer" }}>Add</button>
      </div>
    </div>
  );
}

function AnnotationModal({ item, onClose, onSaved }) {
  const [notes, setNotes] = useState(item.notes || "");
  const [tags, setTags] = useState(item.diagnosis_tags || []);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.POCUSAnnotation.update(item.id, { notes, diagnosis_tags: tags });
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#081628", border: "1px solid rgba(42,79,122,0.6)", borderRadius: 16, padding: 22, maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700, color: T.teal }}>{item.title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.txt3, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <img src={item.image_data} alt={item.title} style={{ width: "100%", borderRadius: 10, marginBottom: 14, border: "1px solid rgba(42,79,122,0.4)" }} />
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Diagnosis Tags</div>
        <TagInput tags={tags} onChange={setTags} />
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1.5, margin: "12px 0 6px" }}>Clinical Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          rows={4} placeholder="Describe your findings, clinical context, or teaching points…"
          style={{ width: "100%", background: "rgba(14,37,68,0.7)", border: "1px solid rgba(42,79,122,0.5)", borderRadius: 9, padding: "10px 12px", color: T.txt, fontSize: 12, lineHeight: 1.7, resize: "vertical", fontFamily: "DM Sans, sans-serif" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 9, background: "transparent", border: "1px solid rgba(42,79,122,0.5)", color: T.txt3, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding: "8px 20px", borderRadius: 9, background: saving ? "rgba(0,229,192,0.1)" : "rgba(0,229,192,0.2)", border: "1px solid rgba(0,229,192,0.4)", color: T.teal, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function POCUSGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterTag, setFilterTag] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.POCUSAnnotation.list("-created_date", 50);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteItem = async (id) => {
    setDeleting(id);
    await base44.entities.POCUSAnnotation.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
  };

  const toggleFav = async (item) => {
    await base44.entities.POCUSAnnotation.update(item.id, { is_favorite: !item.is_favorite });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_favorite: !i.is_favorite } : i));
  };

  const allTags = [...new Set(items.flatMap(i => i.diagnosis_tags || []))];
  const filtered = filterTag ? items.filter(i => (i.diagnosis_tags || []).includes(filterTag)) : items;

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: T.txt3, fontFamily: "DM Sans, sans-serif" }}>Loading gallery…</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, color: T.teal }}>Annotated Image Gallery</div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: T.txt3, marginTop: 2 }}>{items.length} saved annotation{items.length !== 1 ? "s" : ""} · Save from the Reference tab drawing overlay</div>
        </div>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: T.txt4 }}>{filtered.length} shown</span>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <button onClick={() => setFilterTag("")}
            style={{ padding: "4px 12px", borderRadius: 20, background: !filterTag ? "rgba(0,229,192,0.18)" : "rgba(14,37,68,0.7)", border: `1px solid ${!filterTag ? "rgba(0,229,192,0.4)" : "rgba(42,79,122,0.4)"}`, color: !filterTag ? T.teal : T.txt3, fontSize: 11, cursor: "pointer" }}>All</button>
          {allTags.map(t => (
            <button key={t} onClick={() => setFilterTag(t === filterTag ? "" : t)}
              style={{ padding: "4px 12px", borderRadius: 20, background: filterTag === t ? "rgba(0,229,192,0.18)" : "rgba(14,37,68,0.7)", border: `1px solid ${filterTag === t ? "rgba(0,229,192,0.4)" : "rgba(42,79,122,0.4)"}`, color: filterTag === t ? T.teal : T.txt3, fontSize: 11, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.txt4, fontFamily: "DM Sans, sans-serif" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🖼️</div>
          <div style={{ fontSize: 14 }}>No saved annotations yet</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Use the drawing overlay in the Reference tab and click "Save to Gallery"</div>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ background: "rgba(8,22,40,0.78)", backdropFilter: "blur(16px)", border: "1px solid rgba(26,53,85,0.75)", borderRadius: 14, overflow: "hidden", transition: "transform 0.15s", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ position: "relative" }} onClick={() => setSelected(item)}>
              <img src={item.image_data} alt={item.title} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }} />
              {item.is_favorite && <span style={{ position: "absolute", top: 7, right: 8, fontSize: 16 }}>⭐</span>}
            </div>
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 13, color: T.txt, marginBottom: 4 }}>{item.title}</div>
              {item.protocol && <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: T.txt4, marginBottom: 6 }}>{item.protocol}</div>}
              {(item.diagnosis_tags || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                  {item.diagnosis_tags.map(t => (
                    <span key={t} style={{ padding: "1px 7px", borderRadius: 20, background: "rgba(0,229,192,0.1)", border: "1px solid rgba(0,229,192,0.25)", color: T.teal, fontSize: 10 }}>{t}</span>
                  ))}
                </div>
              )}
              {item.notes && <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: T.txt3, lineHeight: 1.5, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.notes}</div>}
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setSelected(item)} style={{ flex: 1, padding: "5px 0", borderRadius: 8, background: "rgba(59,158,255,0.12)", border: "1px solid rgba(59,158,255,0.3)", color: T.blue, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Edit / Notes</button>
                <button onClick={() => toggleFav(item)} title="Favorite" style={{ padding: "5px 9px", borderRadius: 8, background: "transparent", border: "1px solid rgba(42,79,122,0.4)", color: item.is_favorite ? T.yellow : T.txt4, fontSize: 13, cursor: "pointer" }}>{item.is_favorite ? "★" : "☆"}</button>
                <button onClick={() => deleteItem(item.id)} disabled={deleting === item.id} title="Delete" style={{ padding: "5px 9px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,68,68,0.25)", color: T.coral, fontSize: 13, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && <AnnotationModal item={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}