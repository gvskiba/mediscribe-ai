import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Archive, CheckCircle2, X, FileText, CheckCheck, PenTool, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import NotesFilters from "../components/notes/NotesFilters";
import NoteCard from "../components/notes/NoteCard";
import PatientNotesGroup from "../components/notes/PatientNotesGroup";
import NotePreviewDialog from "../components/notes/NotePreviewDialog";



export default function NotesLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-created_date");
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState("all");
  const [layoutMode, setLayoutMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.ClinicalNote.list(sortBy, 200),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.ClinicalNote.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNotes([]);
      toast.success("Notes deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete notes: ${error.message || 'Rate limited or network error'}`);
    }
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.ClinicalNote.update(id, { archived: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNotes([]);
      toast.success("Notes archived");
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }) => {
      await Promise.all(ids.map(id => base44.entities.ClinicalNote.update(id, { status })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNotes([]);
      toast.success("Status updated");
    },
  });

  const deleteSingleNoteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.ClinicalNote.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
  });

  const uniquePatients = [...new Set(notes.map(n => n.patient_name).filter(Boolean))].sort();

  const getDateRangeFilter = (note) => {
    if (!note.date_of_visit) return false;
    const date = new Date(note.date_of_visit);
    const now = new Date();
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    switch(dateRangeFilter) {
      case "today": return daysDiff === 0;
      case "week": return daysDiff <= 7;
      case "month": return daysDiff <= 30;
      case "quarter": return daysDiff <= 90;
      default: return true;
    }
  };

  const filtered = notes.filter((n) => {
    if (!showArchived && n.archived) return false;
    const matchSearch =
      !search ||
      n.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      n.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      n.chief_complaint?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || n.status === statusFilter;
    const matchType = typeFilter === "all" || n.note_type === typeFilter;
    const matchPatient = patientFilter === "all" || n.patient_name === patientFilter;
    const matchDate = dateRangeFilter === "all" || getDateRangeFilter(n);
    return matchSearch && matchStatus && matchType && matchPatient && matchDate;
  });

  // Group notes by patient (after filtered is defined)
  const notesByPatient = filtered.reduce((acc, note) => {
    const patientName = note.patient_name === "New Patient" 
      ? (note.chief_complaint || "New Patient")
      : (note.patient_name || "Unknown Patient");
    if (!acc[patientName]) acc[patientName] = [];
    acc[patientName].push(note);
    return acc;
  }, {});
  
  // Sort each patient's notes by date
  Object.keys(notesByPatient).forEach(patient => {
    notesByPatient[patient].sort((a, b) => 
      new Date(b.date_of_visit || b.created_date) - new Date(a.date_of_visit || a.created_date)
    );
  });

  const handleSelectAll = () => {
    if (selectedNotes.length === filtered.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filtered.map(n => n.id));
    }
  };

  const handleToggleNote = (id) => {
    if (selectedNotes.includes(id)) {
      setSelectedNotes(selectedNotes.filter(nid => nid !== id));
    } else {
      setSelectedNotes([...selectedNotes, id]);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedNotes.length} note(s)? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedNotes);
      setBulkActionDialogOpen(false);
    }
  };

  const handleBulkArchive = () => {
    bulkArchiveMutation.mutate(selectedNotes);
    setBulkActionDialogOpen(false);
  };

  const handleBulkStatus = (status) => {
    bulkStatusMutation.mutate({ ids: selectedNotes, status });
    setBulkActionDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Redesigned Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Clinical Notes</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-10 w-10 p-0 group relative hover:bg-slate-100"
              >
                <FileText className="w-5 h-5 text-slate-600" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Total: {notes.length}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-10 w-10 p-0 group relative hover:bg-emerald-50"
              >
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Finalized: {notes.filter(n => n.status === "finalized").length}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-10 w-10 p-0 group relative hover:bg-amber-50"
              >
                <PenTool className="w-5 h-5 text-amber-600" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Drafts: {notes.filter(n => n.status === "draft").length}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-10 w-10 p-0 group relative hover:bg-purple-50"
              >
                <Users className="w-5 h-5 text-purple-600" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Patients: {uniquePatients.length}
                </span>
              </Button>
              <Link to={createPageUrl("NewNote")}>
                <Button
                  size="sm"
                  className="rounded-lg h-10 w-10 p-0 group relative bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-5 h-5" />
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Create Note
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedNotes.length} note{selectedNotes.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatus("finalized")}
              className="gap-1 border-blue-300 hover:bg-blue-100"
            >
              <CheckCircle2 className="w-3 h-3" /> Finalize
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkArchive}
              className="gap-1 border-blue-300 hover:bg-blue-100"
            >
              <Archive className="w-3 h-3" /> Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedNotes([])}
              className="gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Component */}
      <NotesFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        patientFilter={patientFilter}
        onPatientFilterChange={setPatientFilter}
        dateRangeFilter={dateRangeFilter}
        onDateRangeFilterChange={setDateRangeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(!showArchived)}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        uniquePatients={uniquePatients}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of <span className="font-semibold text-slate-900">{notes.length}</span> notes
          {selectedNotes.length > 0 && (
            <span className="ml-2 text-blue-600 font-semibold">• {selectedNotes.length} selected</span>
          )}
        </p>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16">
          <Plus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No notes found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or create a new note.</p>
        </div>
      ) : viewMode === "by-patient" ? (
        /* BY PATIENT VIEW */
        <div className="space-y-4">
          {Object.entries(notesByPatient).map(([patientName, patientNotes]) => (
            <PatientNotesGroup
              key={patientName}
              patientName={patientName}
              notes={patientNotes}
              selectedNotes={selectedNotes}
              onToggleNote={handleToggleNote}
              onPreview={setPreviewNote}
            />
          ))}
        </div>
      ) : layoutMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <NoteCard
                note={note}
                selected={selectedNotes.includes(note.id)}
                onSelect={handleToggleNote}
                onPreview={setPreviewNote}
                onDelete={(id) => deleteSingleNoteMutation.mutate(id)}
                layoutMode="grid"
              />
            </motion.div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
            <Checkbox
              checked={selectedNotes.length === filtered.length && filtered.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-slate-700 font-semibold">
              {selectedNotes.length > 0 ? `${selectedNotes.length} selected` : `All Notes (${filtered.length})`}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <NoteCard
                  note={note}
                  selected={selectedNotes.includes(note.id)}
                  onSelect={handleToggleNote}
                  onPreview={setPreviewNote}
                  onDelete={(id) => deleteSingleNoteMutation.mutate(id)}
                  layoutMode="list"
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <NotePreviewDialog
        note={previewNote}
        open={previewNote !== null}
        onClose={() => setPreviewNote(null)}
      />
    </div>
  );
}