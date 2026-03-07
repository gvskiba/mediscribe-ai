import React, { useState } from "react";
import { Search, Star, ChevronDown, ChevronRight } from "lucide-react";
import { SPECIALTY_CONFIG, BUILTIN_TEMPLATES } from "./templateData";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", edge: "#162d4f",
  border: "#1e3a5f", dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc",
};

const SETTINGS = ["All", "ED", "ICU", "Inpatient", "Outpatient", "Procedures"];
const NOTE_TYPES = ["All", "H&P", "Progress Note", "Consult Note", "Discharge Summary", "Procedure Note", "Brief ED Note", "Outpatient SOAP", "Psychiatry Eval"];

export default function TemplateLibrarySidebar({ selectedTemplate, onSelect, favorites, onToggleFavorite }) {
  const [search, setSearch] = useState("");
  const [settingFilter, setSettingFilter] = useState("All");
  const [noteTypeFilter, setNoteTypeFilter] = useState("All");
  const [openSpecialties, setOpenSpecialties] = useState({});

  const filtered = BUILTIN_TEMPLATES.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.specialty.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q));
    const matchSetting = settingFilter === "All" || t.setting === settingFilter;
    const matchType = noteTypeFilter === "All" || t.note_type === noteTypeFilter;
    return matchSearch && matchSetting && matchType;
  });

  // Group by specialty
  const bySpecialty = {};
  filtered.forEach(t => {
    if (!bySpecialty[t.specialty]) bySpecialty[t.specialty] = [];
    bySpecialty[t.specialty].push(t);
  });

  const toggleSpecialty = (spec) => setOpenSpecialties(prev => ({ ...prev, [spec]: !prev[spec] }));

  const favTemplates = BUILTIN_TEMPLATES.filter(t => favorites.includes(t.id));

  return (
    <div style={{
      width: 260, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.bright, letterSpacing: "0.03em", marginBottom: 10 }}>
          📚 Template Library
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: T.dim }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            style={{
              width: "100%", padding: "6px 8px 6px 28px", background: "rgba(255,255,255,0.05)",
              border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Setting</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {SETTINGS.map(s => (
            <button key={s} type="button" onClick={() => setSettingFilter(s)} style={{
              padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: settingFilter === s ? T.teal : "rgba(255,255,255,0.05)",
              border: `1px solid ${settingFilter === s ? T.teal : T.border}`,
              color: settingFilter === s ? "#050f1e" : T.dim, transition: "all 0.15s",
            }}>{s}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Note Type</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {NOTE_TYPES.slice(0, 6).map(n => (
            <button key={n} onClick={() => setNoteTypeFilter(n)} style={{
              padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: noteTypeFilter === n ? "rgba(155,109,255,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${noteTypeFilter === n ? "#9b6dff" : T.border}`,
              color: noteTypeFilter === n ? "#9b6dff" : T.dim, transition: "all 0.15s",
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {/* Favorites */}
        {favTemplates.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#f5a623", fontWeight: 700, textTransform: "uppercase", padding: "2px 6px 6px", display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={10} fill="#f5a623" /> Favorites
            </div>
            {favTemplates.map(t => (
              <TemplateItem key={t.id} template={t} isActive={selectedTemplate?.id === t.id} onSelect={onSelect} isFavorite favorites={favorites} onToggleFavorite={onToggleFavorite} />
            ))}
          </div>
        )}

        {/* By specialty */}
        {Object.entries(bySpecialty).map(([spec, templates]) => {
          const cfg = SPECIALTY_CONFIG[spec] || { icon: "📄", color: T.teal };
          const isOpen = openSpecialties[spec] !== false;
          return (
            <div key={spec} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleSpecialty(spec)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 6px", borderRadius: 6, cursor: "pointer",
                  background: "transparent", border: "none", textAlign: "left",
                  color: T.dim, fontSize: 11, fontWeight: 700,
                }}
              >
                <span>{cfg.icon}</span>
                <span style={{ flex: 1 }}>{spec}</span>
                <span style={{ fontSize: 10, color: T.dim, background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 8 }}>{templates.length}</span>
                {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
              {isOpen && templates.map(t => (
                <TemplateItem key={t.id} template={t} isActive={selectedTemplate?.id === t.id} onSelect={onSelect} favorites={favorites} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: T.dim, fontSize: 12, padding: "30px 10px" }}>
            No templates match your filters
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateItem({ template, isActive, onSelect, favorites, onToggleFavorite }) {
  const cfg = SPECIALTY_CONFIG[template.specialty] || { color: "#4a7299" };
  const isFav = favorites.includes(template.id);
  return (
    <div
      onClick={() => onSelect(template)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 8px 6px 14px",
        borderRadius: 6, cursor: "pointer", position: "relative",
        background: isActive ? `${cfg.color}18` : "transparent",
        borderLeft: isActive ? `2px solid ${cfg.color}` : "2px solid transparent",
        marginBottom: 1, transition: "all 0.1s",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{template.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? "#e8f4ff" : "#c8ddf0", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {template.name}
        </div>
        <div style={{ fontSize: 10, color: "#4a7299", marginTop: 2 }}>{template.note_type}</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onToggleFavorite(template.id); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isFav ? "#f5a623" : "#2a4d72", flexShrink: 0 }}
      >
        <Star size={10} fill={isFav ? "#f5a623" : "none"} stroke={isFav ? "#f5a623" : "#2a4d72"} />
      </button>
    </div>
  );
}