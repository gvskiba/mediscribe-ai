import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Search, Download, Plus, ChevronRight, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const T = {
  bg: "#080b10",
  surface: "#0e1320",
  surface_2: "#141b2d",
  card: "#0f1624",
  card_hover: "#141f32",
  border: "#1a2236",
  border_2: "#243048",
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
  purple_dim: "#1a1040"
};

const NOTE_TYPES = [
  { id: "progress_note", label: "Progress Notes", icon: "📝", color: T.blue, bg: T.blue_dim },
  { id: "h_and_p", label: "H&P", icon: "🏥", color: T.teal, bg: T.teal_dim },
  { id: "discharge_summary", label: "Discharge", icon: "🚪", color: T.amber, bg: T.amber_dim },
  { id: "procedure_note", label: "Procedure", icon: "🔧", color: T.purple, bg: T.purple_dim },
  { id: "consult", label: "Consult", icon: "💬", color: T.green, bg: T.green_dim }
];

const STATUS_COLORS = {
  draft: { color: T.amber, bg: T.amber_dim, border: "rgba(245,158,11,.25)" },
  finalized: { color: T.green, bg: T.green_dim, border: "rgba(52,211,153,.25)" },
  amended: { color: T.purple, bg: T.purple_dim, border: "rgba(167,139,250,.25)" }
};

export default function NotesLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteData, setNewNoteData] = useState({
    type: "progress_note",
    patient: "",
    ageSex: "",
    dept: "",
    title: "",
    icds: "",
    content: ""
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.ClinicalNote.list("-created_date", 200)
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.ClinicalNote.create({
      raw_note: data.content || "",
      note_type: data.type,
      patient_name: data.patient,
      patient_age: data.ageSex,
      specialty: data.dept,
      summary: data.title,
      status: "draft"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setShowNewNoteModal(false);
      setNewNoteData({ type: "progress_note", patient: "", ageSex: "", dept: "", title: "", icds: "", content: "" });
      toast.success("Draft created");
    },
    onError: () => toast.error("Failed to create note")
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.ClinicalNote.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNotes([]);
      toast.success("Notes deleted");
    }
  });

  const getTimeRange = (date) => {
    if (!date) return false;
    const noteDate = new Date(date);
    const now = new Date();
    const daysDiff = Math.floor((now - noteDate) / (1000 * 60 * 60 * 24));
    switch (timeFilter) {
      case "today": return daysDiff === 0;
      case "week": return daysDiff <= 7;
      case "month": return daysDiff <= 30;
      default: return true;
    }
  };

  const filtered = notes.filter(n => {
    const matchSearch = !search || 
      n.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      n.chief_complaint?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || n.status === statusFilter;
    const matchType = typeFilter === "all" || n.note_type === typeFilter;
    const matchTime = timeFilter === "all" || getTimeRange(n.created_date);
    return matchSearch && matchStatus && matchType && matchTime;
  });

  const statCounts = {
    all: notes.length,
    draft: notes.filter(n => n.status === "draft").length,
    finalized: notes.filter(n => n.status === "finalized").length,
    amended: notes.filter(n => n.status === "amended").length
  };

  const handleSelectAll = () => {
    if (selectedNotes.length === filtered.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filtered.map(n => n.id));
    }
  };

  const handleToggleNote = (id) => {
    setSelectedNotes(prev => prev.includes(id) ? prev.filter(nid => nid !== id) : [...prev, id]);
  };

  const handleCreateNote = () => {
    if (!newNoteData.patient || !newNoteData.title) {
      toast.error("Patient name and title are required");
      return;
    }
    createNoteMutation.mutate(newNoteData);
  };

  return (
    <div style={{ display: "flex", background: T.bg, color: T.text, height: "100%", gap: 0 }}>
      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          background: T.surface,
          borderRight: `1px solid ${T.border}`,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          flexShrink: 0
        }}
      >
          {/* Status Filter */}
          <div>
            <div style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: T.dim, marginBottom: "10px" }}>
              Status
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { id: "all", label: "All Notes", icon: "📋", key: "all" },
                { id: "draft", label: "Drafts", icon: "✏️", key: "draft" },
                { id: "finalized", label: "Signed", icon: "✅", key: "finalized" },
                { id: "amended", label: "Amended", icon: "🔄", key: "amended" }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    border: statusFilter === item.id ? `1px solid ${T.teal}` : "transparent",
                    background: statusFilter === item.id ? T.teal_dim : "transparent",
                    color: statusFilter === item.id ? T.teal : T.muted,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>{item.icon} {item.label}</span>
                  <span style={{ fontSize: "10px", fontFamily: "Geist Mono", color: statusFilter === item.id ? T.teal : T.dim }}>
                    {statCounts[item.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: T.border, margin: "8px 0" }} />

          {/* Type Filter */}
          <div>
            <div style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: T.dim, marginBottom: "10px" }}>
              Note Type
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[{ id: "all", label: "All Types", icon: "📄" }, ...NOTE_TYPES].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTypeFilter(item.id)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    border: typeFilter === item.id ? `1px solid ${T.teal}` : "transparent",
                    background: typeFilter === item.id ? T.teal_dim : "transparent",
                    color: typeFilter === item.id ? T.teal : T.muted,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Page Header */}
          <div
            style={{
              padding: "18px 22px",
              borderBottom: `1px solid ${T.border}`,
              background: T.bg
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
              <h1 style={{ fontFamily: "Instrument Serif", fontSize: "24px", fontStyle: "italic", color: T.text }}>
                Clinical <span style={{ color: T.teal }}>Notes</span>
              </h1>
              <div style={{ display: "flex", gap: "7px" }}>
                <button
                  onClick={() => {}}
                  style={{
                    fontFamily: "Geist Mono",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "7px 13px",
                    borderRadius: "6px",
                    border: `1px solid ${T.border_2}`,
                    color: T.muted,
                    background: "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = T.teal; e.target.style.color = T.teal; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = T.border_2; e.target.style.color = T.muted; }}
                >
                  ↓ Export
                </button>
                <button
                  onClick={() => setShowNewNoteModal(true)}
                  style={{
                    fontFamily: "Geist Mono",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "7px 13px",
                    borderRadius: "6px",
                    border: `1px solid ${T.teal}`,
                    color: T.bg,
                    background: T.teal,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#00efd8"}
                  onMouseLeave={(e) => e.target.style.background = T.teal}
                >
                  + New Note
                </button>
              </div>
            </div>

            {/* Tab Bar */}
            <div style={{ display: "flex", gap: "20px", borderTop: `1px solid ${T.border}`, paddingTop: "14px" }}>
              {["all", "today", "week", "month"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setTimeFilter(tab)}
                  style={{
                    fontFamily: "Geist Mono",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "8px 0",
                    borderBottom: timeFilter === tab ? `2px solid ${T.teal}` : "transparent",
                    color: timeFilter === tab ? T.teal : T.muted,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {tab === "all" ? "All" : tab === "today" ? "Today" : tab === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div
            style={{
              padding: "11px 22px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              gap: "9px",
              alignItems: "center"
            }}
          >
            <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
              <Search size={13} style={{ position: "absolute", left: "11px", top: "8px", color: T.muted }} />
              <input
                type="text"
                placeholder="Search patients, complaints, diagnoses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  background: T.surface,
                  border: `1px solid ${T.border_2}`,
                  borderRadius: "6px",
                  fontSize: "13px",
                  padding: "7px 11px 7px 33px",
                  color: T.text,
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = T.teal}
                onBlur={(e) => e.target.style.borderColor = T.border_2}
              />
            </div>
            <div style={{ width: "1px", height: "22px", background: T.border_2 }} />
            <div style={{ marginLeft: "auto", fontFamily: "Geist Mono", fontSize: "11px", color: T.muted }}>
              Showing <span style={{ color: T.text }}>{filtered.length}</span> of <span style={{ color: T.text }}>{notes.length}</span> notes
            </div>
          </div>

          {/* Notes List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 24px" }}>
            {isLoading ? (
              <div style={{ color: T.muted, textAlign: "center", paddingTop: "40px" }}>Loading notes…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: "64px", opacity: 0.5 }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
                <div style={{ fontFamily: "Instrument Serif", fontSize: "18px", fontStyle: "italic", color: T.muted, marginBottom: "8px" }}>
                  No notes found
                </div>
                <div style={{ fontSize: "12px", color: T.dim, maxWidth: "280px", margin: "0 auto", lineHeight: 1.6 }}>
                  Adjust your filters, or tap New Note to start documenting.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {/* Select All Row */}
                <div
                  style={{
                    padding: "6px 12px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "Geist Mono",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.muted
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedNotes.length === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: "pointer", accentColor: T.teal }}
                  />
                  <span>
                    {selectedNotes.length > 0 ? `${selectedNotes.length} selected` : `All Notes (${filtered.length})`}
                  </span>
                </div>

                {/* Note Rows */}
                <AnimatePresence>
                  {filtered.map((note, i) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.028 }}
                      onClick={() => window.location.href = createPageUrl(`NoteDetail?id=${note.id}`)}
                      style={{
                        display: "flex",
                        gap: "12px",
                        padding: "13px 12px",
                        borderRadius: "8px",
                        background: T.card,
                        border: selectedNotes.includes(note.id) ? `1px solid rgba(0,204,163,0.18)` : "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        marginBottom: "2px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = T.card_hover;
                        e.currentTarget.style.border = `1px solid ${T.border}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = T.card;
                        e.currentTarget.style.border = selectedNotes.includes(note.id) ? `1px solid rgba(0,204,163,0.18)` : "transparent";
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNotes.includes(note.id)}
                        onChange={() => handleToggleNote(note.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: "pointer", accentColor: T.teal, marginTop: "2px" }}
                      />
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "7px",
                          background: T.blue_dim,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "15px",
                          flexShrink: 0
                        }}
                      >
                        {NOTE_TYPES.find(t => t.id === note.note_type)?.icon || "📝"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "Geist Mono", fontSize: "9px", textTransform: "uppercase", padding: "2px 7px", borderRadius: "4px", color: T.muted, background: T.surface_2, border: `1px solid ${T.border_2}` }}>
                            {note.note_type || "note"}
                          </span>
                          <span
                            style={{
                              fontFamily: "Geist Mono",
                              fontSize: "9px",
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              color: STATUS_COLORS[note.status]?.color || T.amber,
                              background: STATUS_COLORS[note.status]?.bg || T.amber_dim,
                              border: STATUS_COLORS[note.status]?.border || "rgba(245,158,11,.25)"
                            }}
                          >
                            {note.status || "draft"}
                          </span>
                          {note.patient_name && (
                            <span style={{ fontFamily: "Geist Mono", fontSize: "9px", color: T.teal, background: T.teal_dim, border: `1px solid rgba(0,204,163,0.18)`, padding: "2px 7px", borderRadius: "4px" }}>
                              👤 {note.patient_name}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: T.text, marginBottom: "5px", lineHeight: 1.35 }}>
                          {note.summary || note.chief_complaint || `${note.note_type || "Note"} — ${note.patient_name || "New Patient"}`}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ fontFamily: "Geist Mono", fontSize: "10px", color: T.muted }}>
                            Created {new Date(note.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={13} style={{ color: T.dim, flexShrink: 0, marginTop: "2px" }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
      </div>

      {/* New Note Modal */}
      <AnimatePresence>
        {showNewNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewNoteModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(3px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(480px, 96vw)",
                maxHeight: "88vh",
                background: T.card,
                border: `1px solid ${T.border_2}`,
                borderRadius: "12px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: "18px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontFamily: "Instrument Serif", fontSize: "17px", fontStyle: "italic", color: T.text }}>
                  New Clinical Note
                </h2>
                <button
                  onClick={() => setShowNewNoteModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: T.muted,
                    cursor: "pointer",
                    fontSize: "24px"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "13px", flex: 1 }}>
                {/* Type Picker */}
                <div>
                  <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: "5px", display: "block" }}>
                    Note Type
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
                    {[{ id: "progress_note", icon: "📝", label: "Progress" }, { id: "h_and_p", icon: "🏥", label: "H&P" }, { id: "discharge_summary", icon: "🚪", label: "Discharge" }, { id: "procedure_note", icon: "🔧", label: "Procedure" }, { id: "consult", icon: "💬", label: "Consult" }].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setNewNoteData({ ...newNoteData, type: t.id })}
                        style={{
                          padding: "9px 6px",
                          borderRadius: "7px",
                          border: newNoteData.type === t.id ? `1px solid ${T.teal}` : `1px solid ${T.border_2}`,
                          background: newNoteData.type === t.id ? T.teal_dim : "transparent",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = newNoteData.type === t.id ? T.teal_dim : T.surface_2}
                      >
                        <span style={{ fontSize: "17px" }}>{t.icon}</span>
                        <span style={{ fontFamily: "Geist Mono", fontSize: "8px", textTransform: "uppercase", color: newNoteData.type === t.id ? T.teal : T.muted }}>
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Input */}
                <div>
                  <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: "5px", display: "block" }}>
                    Patient Name / MRN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Smith or MRN 00123456"
                    value={newNoteData.patient}
                    onChange={(e) => setNewNoteData({ ...newNoteData, patient: e.target.value })}
                    style={{
                      width: "100%",
                      background: T.bg,
                      border: `1px solid ${T.border_2}`,
                      borderRadius: "6px",
                      color: T.text,
                      fontSize: "13px",
                      padding: "7px 11px",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = T.teal}
                    onBlur={(e) => e.target.style.borderColor = T.border_2}
                  />
                </div>

                {/* Two Column Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: "5px", display: "block" }}>
                      Age & Sex
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 54yo F"
                      value={newNoteData.ageSex}
                      onChange={(e) => setNewNoteData({ ...newNoteData, ageSex: e.target.value })}
                      style={{
                        width: "100%",
                        background: T.bg,
                        border: `1px solid ${T.border_2}`,
                        borderRadius: "6px",
                        color: T.text,
                        fontSize: "13px",
                        padding: "7px 11px",
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                      onFocus={(e) => e.target.style.borderColor = T.teal}
                      onBlur={(e) => e.target.style.borderColor = T.border_2}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: "5px", display: "block" }}>
                      Department
                    </label>
                    <select
                      value={newNoteData.dept}
                      onChange={(e) => setNewNoteData({ ...newNoteData, dept: e.target.value })}
                      style={{
                        width: "100%",
                        background: T.bg,
                        border: `1px solid ${T.border_2}`,
                        borderRadius: "6px",
                        color: T.text,
                        fontSize: "13px",
                        padding: "7px 11px",
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                      onFocus={(e) => e.target.style.borderColor = T.teal}
                      onBlur={(e) => e.target.style.borderColor = T.border_2}
                    >
                      <option value="">Select…</option>
                      <option>Emergency Dept.</option>
                      <option>ICU / Critical Care</option>
                      <option>Hospitalist</option>
                      <option>OR / Surgery</option>
                      <option>OB / Labor & Delivery</option>
                      <option>Outpatient Clinic</option>
                    </select>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: "5px", display: "block" }}>
                    Chief Complaint / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. COVID Positive, Shortness of Breath"
                    value={newNoteData.title}
                    onChange={(e) => setNewNoteData({ ...newNoteData, title: e.target.value })}
                    style={{
                      width: "100%",
                      background: T.bg,
                      border: `1px solid ${T.border_2}`,
                      borderRadius: "6px",
                      color: T.text,
                      fontSize: "13px",
                      padding: "7px 11px",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = T.teal}
                    onBlur={(e) => e.target.style.borderColor = T.border_2}
                  />
                </div>

                {/* Content Textarea */}
                <div>
                  <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: "5px", display: "block" }}>
                    Initial Note Content
                  </label>
                  <textarea
                    placeholder="Begin your note…"
                    value={newNoteData.content}
                    onChange={(e) => setNewNoteData({ ...newNoteData, content: e.target.value })}
                    style={{
                      width: "100%",
                      background: T.bg,
                      border: `1px solid ${T.border_2}`,
                      borderRadius: "6px",
                      color: T.text,
                      fontSize: "13px",
                      padding: "7px 11px",
                      minHeight: "64px",
                      boxSizing: "border-box",
                      outline: "none",
                      resize: "none",
                      fontFamily: "Geist"
                    }}
                    onFocus={(e) => e.target.style.borderColor = T.teal}
                    onBlur={(e) => e.target.style.borderColor = T.border_2}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "12px 18px",
                  borderTop: `1px solid ${T.border}`,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "7px"
                }}
              >
                <button
                  onClick={() => setShowNewNoteModal(false)}
                  style={{
                    fontFamily: "Geist Mono",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "7px 13px",
                    borderRadius: "6px",
                    border: `1px solid ${T.border_2}`,
                    color: T.muted,
                    background: "transparent",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={createNoteMutation.isPending}
                  style={{
                    fontFamily: "Geist Mono",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "7px 13px",
                    borderRadius: "6px",
                    border: `1px solid ${T.teal}`,
                    color: T.bg,
                    background: T.teal,
                    cursor: createNoteMutation.isPending ? "not-allowed" : "pointer",
                    opacity: createNoteMutation.isPending ? 0.6 : 1
                  }}
                >
                  {createNoteMutation.isPending ? "Creating…" : "Create Draft"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}