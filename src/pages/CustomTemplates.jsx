import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Copy, Star, StarOff, Search, ChevronRight } from "lucide-react";
import CustomTemplateEditor from "../components/notetemplates/CustomTemplateEditor";
import { SPECIALTY_CONFIG } from "../components/notetemplates/templateData";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", border: "#1e3a5f",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
};

const NOTE_TYPES = ["Progress Note", "H&P", "Discharge Summary", "Consult Note", "Procedure Note", "ED Note", "Outpatient SOAP", "Psychiatry Eval", "Custom"];
const SPECIALTIES = Object.keys(SPECIALTY_CONFIG);

export default function CustomTemplates() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["NoteTemplate"],
    queryFn: () => base44.entities.NoteTemplate.list("-created_date", 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NoteTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["NoteTemplate"]); toast.success("Template deleted"); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (tpl) => {
      const { id, created_date, updated_date, created_by, ...rest } = tpl;
      return base44.entities.NoteTemplate.create({ ...rest, name: `${rest.name} (copy)` });
    },
    onSuccess: () => { queryClient.invalidateQueries(["NoteTemplate"]); toast.success("Template duplicated"); },
  });

  const handleEdit = (tpl) => { setEditingTemplate(tpl); setEditorOpen(true); };
  const handleNew = () => { setEditingTemplate(null); setEditorOpen(true); };

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.specialty?.toLowerCase().includes(search.toLowerCase());
    const matchSpec = filterSpec === "All" || t.specialty === filterSpec;
    return matchSearch && matchSpec;
  });

  return (
    <div style={{ background: T.navy, minHeight: "100%", color: T.text, fontFamily: "DM Sans, sans-serif", padding: "0 0 40px" }}>
      {/* Page Header */}
      <div style={{ padding: "24px 32px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.bright, fontFamily: "Playfair Display, serif", margin: 0 }}>Custom Note Templates</h1>
          <p style={{ fontSize: 13, color: T.dim, margin: "4px 0 0" }}>Create, edit, and manage your own clinical documentation templates with custom fields and AI prompts.</p>
        </div>
        <button
          onClick={handleNew}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10,
            background: `linear-gradient(135deg, ${T.teal}, #00a896)`, border: "none",
            color: "#050f1e", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding: "16px 32px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "0 0 260px" }}>
          <Search size={14} color={T.dim} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            style={{
              width: "100%", padding: "8px 10px 8px 32px", background: "rgba(255,255,255,0.05)",
              border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12.5, color: T.bright,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...SPECIALTIES].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterSpec(s)}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 600,
                background: filterSpec === s ? `${T.teal}22` : "rgba(255,255,255,0.04)",
                border: `1px solid ${filterSpec === s ? T.teal : T.border}`,
                color: filterSpec === s ? T.teal : T.dim,
              }}
            >
              {s === "All" ? "All Specialties" : (SPECIALTY_CONFIG[s]?.icon + " " + s)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 32px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", color: T.dim, padding: "60px 0", fontSize: 14 }}>Loading templates…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>No custom templates yet</div>
            <div style={{ fontSize: 13, color: T.dim, marginBottom: 20 }}>Create your first template to streamline your documentation.</div>
            <button
              onClick={handleNew}
              style={{
                padding: "10px 24px", borderRadius: 10, background: `${T.teal}22`, border: `1px solid ${T.teal}`,
                color: T.teal, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Create First Template
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filtered.map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onEdit={() => handleEdit(tpl)}
                onDelete={() => { if (window.confirm(`Delete "${tpl.name}"?`)) deleteMutation.mutate(tpl.id); }}
                onDuplicate={() => duplicateMutation.mutate(tpl)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <CustomTemplateEditor
          template={editingTemplate}
          onClose={() => setEditorOpen(false)}
          onSave={() => { queryClient.invalidateQueries(["NoteTemplate"]); setEditorOpen(false); }}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onEdit, onDelete, onDuplicate }) {
  const cfg = SPECIALTY_CONFIG[template.specialty] || { icon: "📄", color: T.teal };
  const fieldCount = (template.dynamic_fields || []).length;
  const sectionCount = (template.sections || []).length;

  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.dim}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{template.icon || "📄"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.bright, lineHeight: 1.2 }}>{template.name}</div>
          {template.description && (
            <div style={{ fontSize: 12, color: T.dim, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {template.description}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {template.specialty && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}35` }}>
            {cfg.icon} {template.specialty}
          </span>
        )}
        {template.note_type && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.06)", color: T.dim, border: `1px solid ${T.border}` }}>
            {template.note_type}
          </span>
        )}
        {(template.tags || []).slice(0, 2).map(tag => (
          <span key={tag} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: T.dim, border: `1px solid ${T.border}` }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.dim }}>
        <span>🔡 {fieldCount} field{fieldCount !== 1 ? "s" : ""}</span>
        <span>📄 {sectionCount} section{sectionCount !== 1 ? "s" : ""}</span>
        {template.usage_count > 0 && <span>✓ Used {template.usage_count}×</span>}
      </div>

      <div style={{ display: "flex", gap: 6, borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: 2 }}>
        <button
          type="button"
          onClick={onEdit}
          style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
        >
          <Pencil size={13} /> Edit
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.dim, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Duplicate"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,92,108,0.08)", border: `1px solid rgba(255,92,108,0.25)`, color: T.red, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}