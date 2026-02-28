import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, X, Search, ChevronDown } from "lucide-react";

const config = {
  colors: {
    background: "#080b10",
    surface: "#0e1320",
    surface_2: "#141b2d",
    card: "#0f1624",
    card_hover: "#141f32",
    border: "#1a2236",
    border_active: "#243048",
    text: "#dde2ef",
    muted: "#4e5a78",
    dim: "#2d3a56",
    teal: "#00cca3",
    teal_dim: "#003328",
    blue: "#3b82f6",
    blue_dim: "#0d2040",
    amber: "#f59e0b",
    amber_dim: "#2a1a00",
    green: "#34d399",
    green_dim: "#002a1a",
    red: "#f87171",
    red_dim: "#2a0f0f",
    purple: "#a78bfa",
    purple_dim: "#1a1040",
  },
  departments: [
    "Emergency Dept.",
    "ICU / Critical Care",
    "Hospitalist",
    "OR / Surgery",
    "OB / Labor & Delivery",
    "Outpatient Clinic",
  ],
  noteTypes: [
    { id: "progress_note", label: "Progress Note", icon: "📝", color: "#3b82f6", bg: "#0d2040" },
    { id: "h_and_p", label: "H&P", icon: "🏥", color: "#00cca3", bg: "#003328" },
    { id: "discharge_summary", label: "Discharge Summary", icon: "🚪", color: "#f59e0b", bg: "#2a1a00" },
    { id: "procedure_note", label: "Procedure Note", icon: "🔧", color: "#a78bfa", bg: "#1a1040" },
    { id: "consult", label: "Consult Note", icon: "💬", color: "#34d399", bg: "#002a1a" },
  ],
  noteStatuses: [
    { id: "draft", label: "draft", color: "#f59e0b", bg: "#2a1a00" },
    { id: "finalized", label: "signed", color: "#34d399", bg: "#002a1a" },
    { id: "amended", label: "amended", color: "#a78bfa", bg: "#1a1040" },
  ],
};

function NewNoteModal({ isOpen, onClose, onSave }) {
  const [selectedType, setSelectedType] = useState("progress_note");
  const [formData, setFormData] = useState({
    patient_name: "",
    date_of_birth: "",
    patient_id: "",
    raw_note: "",
  });

  const handleSave = async () => {
    if (!formData.patient_name.trim()) return;
    await onSave({
      ...formData,
      note_type: selectedType,
      status: "draft",
    });
    setFormData({ patient_name: "", date_of_birth: "", patient_id: "", raw_note: "" });
    setSelectedType("progress_note");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: config.colors.surface,
          border: `1px solid ${config.colors.border}`,
          borderRadius: "12px",
          padding: "24px",
          width: "90%",
          maxWidth: "500px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: config.colors.text, margin: 0 }}>
            New Clinical Note
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: config.colors.text, cursor: "pointer" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
          {config.noteTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              style={{
                padding: "10px",
                background: selectedType === type.id ? type.bg : config.colors.dim,
                border: `1px solid ${selectedType === type.id ? type.color : config.colors.border}`,
                borderRadius: "6px",
                color: config.colors.text,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "16px", marginBottom: "2px" }}>{type.icon}</div>
              {type.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>
              Patient Name / MRN
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Smith or MRN 00123456"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                background: config.colors.surface_2,
                border: `1px solid ${config.colors.border}`,
                borderRadius: "6px",
                color: config.colors.text,
                fontSize: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>
                Age & Sex
              </label>
              <input
                type="text"
                placeholder="e.g. 54yo F"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: config.colors.surface_2,
                  border: `1px solid ${config.colors.border}`,
                  borderRadius: "6px",
                  color: config.colors.text,
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>
                Department
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "8px",
                  background: config.colors.surface_2,
                  border: `1px solid ${config.colors.border}`,
                  borderRadius: "6px",
                  color: config.colors.text,
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              >
                {config.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>
              Chief Complaint / Title
            </label>
            <input
              type="text"
              placeholder="e.g. COVID Positive, Shortness of Breath"
              value={formData.raw_note.substring(0, 100)}
              onChange={(e) => setFormData({ ...formData, raw_note: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                background: config.colors.surface_2,
                border: `1px solid ${config.colors.border}`,
                borderRadius: "6px",
                color: config.colors.text,
                fontSize: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "10px",
                background: config.colors.teal,
                border: "none",
                borderRadius: "6px",
                color: config.colors.background,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Create Draft
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                background: config.colors.dim,
                border: "none",
                borderRadius: "6px",
                color: config.colors.text,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotesLibrary() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["clinicalNotes"],
    queryFn: () => base44.entities.ClinicalNote.list("-updated_date", 200),
  });

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => base44.entities.ClinicalNote.create(noteData),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["clinicalNotes"] });
      window.location.href = `?page=NoteDetail&id=${newNote.id}`;
    },
  });

  const getDateFilter = (note) => {
    if (!note.created_date) return false;
    const date = new Date(note.created_date);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (timeFilter) {
      case "today":
        return diffDays === 1;
      case "week":
        return diffDays <= 7;
      case "month":
        return diffDays <= 30;
      default:
        return true;
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchSearch =
      !search ||
      note.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      note.chief_complaint?.toLowerCase().includes(search.toLowerCase()) ||
      note.diagnoses?.some((d) => d.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || note.status === statusFilter;
    const matchType = typeFilter === "all" || note.note_type === typeFilter;
    const matchTime = getDateFilter(note);
    return matchSearch && matchStatus && matchType && matchTime;
  });

  const handleExport = () => {
    const csv = [
      ["ID", "Type", "Status", "Patient", "Chief Complaint", "Department", "Created"],
      ...filteredNotes.map((n) => [
        n.id,
        n.note_type || "—",
        n.status || "—",
        n.patient_name || "—",
        n.chief_complaint || "—",
        n.specialty || "—",
        new Date(n.created_date).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = "clinical-notes.csv";
    link.click();
  };

  const statusIcons = {
    draft: "✏️",
    finalized: "✅",
    amended: "🔄",
  };

  return (
    <div style={{ background: config.colors.background, color: config.colors.text, minHeight: "100vh", padding: "16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@300;400;500&family=Geist:wght@300;400;500&display=swap');
        body { font-family: Geist, sans-serif; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: config.colors.bright, margin: 0 }}>
            Clinical <span style={{ color: config.colors.teal }}>Notes</span>
          </h1>
          <p style={{ fontSize: "12px", color: config.colors.muted, marginTop: "4px" }}>Manage your clinical notes</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleExport}
            style={{
              padding: "8px 12px",
              background: config.colors.dim,
              border: `1px solid ${config.colors.border}`,
              borderRadius: "6px",
              color: config.colors.text,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "8px 12px",
              background: config.colors.teal,
              border: "none",
              borderRadius: "6px",
              color: config.colors.background,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {["all", "today", "week", "month"].map((time) => (
            <button
              key={time}
              onClick={() => setTimeFilter(time)}
              style={{
                padding: "6px 12px",
                background: timeFilter === time ? config.colors.teal : config.colors.dim,
                border: "none",
                borderRadius: "6px",
                color: timeFilter === time ? config.colors.background : config.colors.text,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {time === "all" ? "All" : time === "today" ? "Today" : time === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { id: "all", label: "All Status" },
            { id: "draft", label: "Draft" },
            { id: "finalized", label: "Signed" },
            { id: "amended", label: "Amended" },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              style={{
                padding: "6px 12px",
                background: statusFilter === status.id ? config.colors.blue : config.colors.dim,
                border: "none",
                borderRadius: "6px",
                color: statusFilter === status.id ? config.colors.background : config.colors.text,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { id: "all", label: "All Types" },
            { id: "progress_note", label: "Progress" },
            { id: "h_and_p", label: "H&P" },
            { id: "discharge_summary", label: "Discharge" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              style={{
                padding: "6px 12px",
                background: typeFilter === type.id ? config.colors.purple : config.colors.dim,
                border: "none",
                borderRadius: "6px",
                color: typeFilter === type.id ? config.colors.background : config.colors.text,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search
          className="w-4 h-4"
          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: config.colors.muted }}
        />
        <input
          type="text"
          placeholder="Search patients, complaints, diagnoses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px 10px 32px",
            background: config.colors.surface,
            border: `1px solid ${config.colors.border}`,
            borderRadius: "8px",
            color: config.colors.text,
            fontSize: "12px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Results */}
      <div style={{ fontSize: "12px", color: config.colors.muted, marginBottom: "12px" }}>
        Showing {filteredNotes.length} of {notes.length} notes
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "24px", color: config.colors.muted }}>Loading notes...</div>
      ) : filteredNotes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            border: `1px solid ${config.colors.border}`,
            borderRadius: "8px",
            color: config.colors.muted,
          }}
        >
          📋 No notes found. Adjust your filters or create a new note.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => (window.location.href = `?page=NoteDetail&id=${note.id}`)}
              style={{
                padding: "12px 16px",
                background: config.colors.card,
                border: `1px solid ${config.colors.border}`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = config.colors.card_hover;
                e.currentTarget.style.borderColor = config.colors.border_active;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = config.colors.card;
                e.currentTarget.style.borderColor = config.colors.border;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: config.colors.bright }}>
                      {note.patient_name || "Unnamed Patient"}
                    </span>
                    <span style={{ fontSize: "10px", color: config.colors.muted }}>
                      {note.patient_id ? `• ${note.patient_id}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: config.colors.text, marginBottom: "6px" }}>
                    {note.chief_complaint || note.raw_note?.substring(0, 80) || "No content"}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        background: config.colors.dim,
                        borderRadius: "4px",
                        color: config.colors.muted,
                      }}
                    >
                      {config.noteTypes.find((t) => t.id === note.note_type)?.icon || "📝"}{" "}
                      {config.noteTypes.find((t) => t.id === note.note_type)?.label || note.note_type}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        background: config.colors.dim,
                        borderRadius: "4px",
                        color: config.colors.muted,
                      }}
                    >
                      {statusIcons[note.status]} {note.status}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "10px", color: config.colors.muted" }}>
                  {new Date(note.created_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewNoteModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={(data) => createNoteMutation.mutate(data)} />
    </div>
  );
}