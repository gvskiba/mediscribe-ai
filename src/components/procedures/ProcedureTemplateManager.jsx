import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Edit2, Plus } from "lucide-react";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
};

const ICON_OPTIONS = ["🩹", "🩸", "🫁", "💧", "❤️", "🫀", "🧠", "🦴", "🚿", "🔩", "🌸", "👁️", "💉", "⚡", "🔪", "🧲"];
const CATEGORY_OPTIONS = ["wound", "vascular", "airway", "thoracic", "cardiac", "abdominal", "neuro", "ortho", "uro", "gi", "gyn", "ent", "anesthesia"];
const COLOR_OPTIONS = ["#00d4bc", "#ff5c6c", "#9b6dff", "#f5a623", "#2ecc71", "#4a90d9", "#f472b6"];

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>📋</span>
        <span style={{ fontFamily: "Playfair Display,serif", fontSize: 20, fontWeight: 700, color: T.bright }}>{title}</span>
      </div>
      {subtitle && <p style={{ fontSize: 13, color: T.dim, lineHeight: 1.6, marginLeft: 34 }}>{subtitle}</p>}
    </div>
  );
}

export default function ProcedureTemplateManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "wound",
    icon: "🩹",
    color: "#00d4bc",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["procedureTemplates"],
    queryFn: () => base44.entities.ProcedureTemplate.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcedureTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedureTemplates"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProcedureTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedureTemplates"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProcedureTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["procedureTemplates"] }),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", category: "wound", icon: "🩹", color: "#00d4bc" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.specialty || "wound",
      icon: template.tags?.[0] || "🩹",
      color: template.tags?.[1] || "#00d4bc",
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 13, padding: 24, marginBottom: 40 }}>
      <SectionHeader
        title="Template Manager"
        subtitle="Create and customize procedure templates for quick access to common procedures."
      />

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg,#00d4bc,#00a896)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          <Plus size={16} /> Create Template
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: T.edge, padding: 20, borderRadius: 10, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Laceration Repair - Standard"
                style={{
                  width: "100%",
                  background: T.panel,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: T.bright,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: "100%",
                  background: T.panel,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: T.bright,
                  fontSize: 13,
                }}>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this template for?"
              rows={2}
              style={{
                width: "100%",
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                color: T.bright,
                fontSize: 13,
                boxSizing: "border-box",
                fontFamily: "DM Sans,sans-serif",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                style={{
                  width: "100%",
                  background: T.panel,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: T.bright,
                  fontSize: 13,
                }}>
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon} {icon}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
                Color
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      background: color,
                      border: formData.color === color ? `3px solid ${T.bright}` : `1px solid ${T.border}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              style={{
                background: "linear-gradient(135deg,#00d4bc,#00a896)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 20px",
                borderRadius: 6,
                border: "none",
                cursor: createMutation.isPending || updateMutation.isPending ? "not-allowed" : "pointer",
                opacity: createMutation.isPending || updateMutation.isPending ? 0.6 : 1,
              }}>
              {editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{
                background: "transparent",
                color: T.dim,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "10px 20px",
                cursor: "pointer",
                fontSize: 13,
              }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", color: T.dim, padding: "20px" }}>Loading templates…</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: "center", color: T.dim, padding: "40px 20px" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600, color: T.text, marginBottom: 6 }}>No templates yet</div>
          <div style={{ fontSize: 12 }}>Create your first template to get started.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    fontSize: 24,
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: `${template.tags?.[1] || "#00d4bc"}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: template.tags?.[1] || "#00d4bc",
                  }}>
                  {template.tags?.[0] || "🩹"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>{template.name}</div>
                  <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>
                    {template.specialty || "uncategorized"}
                  </div>
                </div>
              </div>
              {template.description && (
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{template.description}</div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => handleEdit(template)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "rgba(155,109,255,0.1)",
                    color: T.purple,
                    border: `1px solid rgba(155,109,255,0.25)`,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}>
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate(template.id)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "rgba(255,92,108,0.1)",
                    color: T.red,
                    border: `1px solid rgba(255,92,108,0.25)`,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}