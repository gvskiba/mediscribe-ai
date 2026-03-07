import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Pencil, Trash2, Copy, Sparkles, FileText } from "lucide-react";
import CustomTemplateEditor from "../components/notetemplates/CustomTemplateEditor";
import { SPECIALTY_CONFIG } from "../components/notetemplates/templateData";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", edge: "#162d4f", border: "#1e3a5f",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
};

const inputStyle = {
  padding: "8px 12px 8px 36px", background: "rgba(255,255,255,0.05)",
  border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.text,
  outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif",
};

export default function CustomTemplates() {
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["NoteTemplate"],
    queryFn: () => base44.entities.NoteTemplate.list("-created_date", 200),
  });

  // Only show templates created with the new editor (have dynamic_fields)
  const customTemplates = templates.filter(t => t.dynamic_fields && t.dynamic_fields.length > 0);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NoteTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["NoteTemplate"] });
      toast.success("Template deleted");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (t) => base44.entities.NoteTemplate.create({
      ...t,
      id: undefined, created_date: undefined, updated_date: undefined,
      name: `${t.name} (Copy)`,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["NoteTemplate"] });
      toast.success("Template duplicated");
    },
  });

  const specialties = ["All", ...Array.from(new Set(customTemplates.map(t => t.specialty).filter(Boolean)))];

  const filtered = customTemplates.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || (t.name || "").toLowerCase().includes(q) || (t.specialty || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
    const matchSpecialty = specialtyFilter === "All" || t.specialty === specialtyFilter;
    return matchSearch && matchSpecialty;
  });

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ["NoteTemplate"] });
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const openCreate = () => { setEditingTemplate(null); setShowEditor(true); };
  const openEdit = (t) => { setEditingTemplate(t); setShowEditor(true); };

  return (
    <div style={{ background: T.navy, minHeight: "100%", fontFamily: "DM Sans, sans-serif", color: T.text }}>
      {/* Header */}
      <div style={{ padding: "24px 32px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.bright, fontFamily: "Playfair Display, serif" }}>
              ✏️ Custom Templates
            </div>
            <div style={{ fontSize: 13, color: T.dim, marginTop: 4 }}>
              Build your own structured note templates with custom fields and AI prompts
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
              background: `linear-gradient(135deg, ${T.teal}, #00a896)`, border: "none",
              color: "#050f1e", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Plus size={16} /> New Template
          </button>
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.dim }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {specialties.map(s => (
              <button key={s} type="button" onClick={() => setSpecialtyFilter(s)} style={{
                padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: specialtyFilter === s ? T.teal : "rgba(255,255,255,0.05)",
                border: `1px solid ${specialtyFilter === s ? T.teal : T.border}`,
                color: specialtyFilter === s ? "#050f1e" : T.dim,
              }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", color: T.dim, padding: 60 }}>Loading templates…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.bright, marginBottom: 8 }}>
              {customTemplates.length === 0 ? "No custom templates yet" : "No templates match your search"}
            </div>
            <div style={{ fontSize: 13, color: T.dim, marginBottom: 24 }}>
              {customTemplates.length === 0
                ? "Create your first custom template with structured fields and AI-powered note generation."
                : "Try adjusting your search or filters."}
            </div>
            {customTemplates.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                style={{
                  padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: `linear-gradient(135deg, ${T.teal}, #00a896)`, border: "none", color: "#050f1e",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                <Sparkles size={15} /> Create First Template
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => openEdit(t)}
                onDuplicate={() => duplicateMutation.mutate(t)}
                onDelete={() => {
                  if (window.confirm(`Delete "${t.name}"?`)) deleteMutation.mutate(t.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <CustomTemplateEditor
          template={editingTemplate}
          onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onEdit, onDuplicate, onDelete }) {
  const cfg = SPECIALTY_CONFIG[template.specialty] || { icon: "📄", color: T.teal };
  const fieldCount = (template.dynamic_fields || []).length;

  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color + "60"}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 26 }}>{template.icon || "📋"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.bright, lineHeight: 1.2 }}>{template.name}</div>
          {template.description && (
            <div style={{ fontSize: 11, color: T.dim, marginTop: 3, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {template.description}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {template.specialty && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}35` }}>
            {cfg.icon} {template.specialty.split("/")[0]}
          </span>
        )}
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: T.dim, border: `1px solid ${T.border}` }}>
          {template.note_type}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: T.dim, border: `1px solid ${T.border}` }}>
          <FileText size={9} style={{ verticalAlign: "middle", marginRight: 3 }} />{fieldCount} field{fieldCount !== 1 ? "s" : ""}
        </span>
      </div>

      {(template.tags || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {template.tags.slice(0, 4).map(tag => (
            <span key={tag} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: `${T.teal}12`, color: T.teal, border: `1px solid ${T.teal}25` }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
        <button type="button" onClick={onEdit}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", borderRadius: 8, background: `${T.teal}15`, border: `1px solid ${T.teal}35`, color: T.teal, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          <Pencil size={11} /> Edit
        </button>
        <button type="button" onClick={onDuplicate}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.dim, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          <Copy size={11} /> Duplicate
        </button>
        <button type="button" onClick={onDelete}
          style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(255,92,108,0.1)", border: `1px solid rgba(255,92,108,0.3)`, color: T.red, fontSize: 11, cursor: "pointer" }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}