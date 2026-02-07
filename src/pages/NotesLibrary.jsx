import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, FileText, Calendar, ChevronRight, Trash2, Archive, CheckCircle2, X, Eye, ChevronDown, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amended: "bg-blue-50 text-blue-700 border-blue-200",
};

const typeLabels = {
  progress_note: "Progress Note",
  h_and_p: "H&P",
  discharge_summary: "Discharge",
  consult: "Consult",
  procedure_note: "Procedure",
};

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notes Library</h1>
          <p className="text-slate-500 mt-1">
            {filtered.length} {showArchived ? "notes" : "active notes"}
            {selectedNotes.length > 0 && ` • ${selectedNotes.length} selected`}
          </p>
        </div>
        <Link to={createPageUrl("NewNote")}>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /> New Note
          </Button>
        </Link>
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

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, ID, or complaint..."
              className="pl-10 rounded-xl border-slate-200"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-200">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created_date">Newest First</SelectItem>
              <SelectItem value="created_date">Oldest First</SelectItem>
              <SelectItem value="-date_of_visit">Recent Visits</SelectItem>
              <SelectItem value="patient_name">Patient A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="amended">Amended</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-200">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="progress_note">Progress Note</SelectItem>
              <SelectItem value="h_and_p">H&P</SelectItem>
              <SelectItem value="discharge_summary">Discharge</SelectItem>
              <SelectItem value="consult">Consult</SelectItem>
              <SelectItem value="procedure_note">Procedure</SelectItem>
            </SelectContent>
          </Select>

          <Select value={patientFilter} onValueChange={setPatientFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-200">
              <SelectValue placeholder="Patient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              {uniquePatients.map(patient => (
                <SelectItem key={patient} value={patient}>{patient}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl border-slate-200">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="quarter">Past Quarter</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className={`rounded-xl ${showArchived ? "bg-slate-100" : ""}`}
          >
            <Archive className="w-4 h-4 mr-2" />
            {showArchived ? "Hide" : "Show"} Archived
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No notes found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or create a new note.</p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="border-b border-slate-100 px-5 py-3 bg-slate-50 flex items-center gap-3">
              <Checkbox
                checked={selectedNotes.length === filtered.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-xs text-slate-600 font-medium">
                Select All ({filtered.length})
              </span>
            </div>

            <div className="divide-y divide-slate-50">
              <AnimatePresence>
                {filtered.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="group flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedNotes.includes(note.id)}
                      onCheckedChange={() => handleToggleNote(note.id)}
                      className="mt-1"
                    />

                    <Link
                      to={createPageUrl(`NoteDetail?id=${note.id}`)}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{note.patient_name}</p>
                          {note.patient_id && <span className="text-xs text-slate-400">#{note.patient_id}</span>}
                          {note.archived && (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">
                              Archived
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {note.date_of_visit && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(note.date_of_visit), "MMM d, yyyy")}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{typeLabels[note.note_type] || "Note"}</span>
                        </div>
                        {note.chief_complaint && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-1">
                            {note.chief_complaint}
                          </p>
                        )}
                        {note.clinical_impression && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {note.clinical_impression}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${statusColors[note.status] || statusColors.draft}`}>
                          {note.status || "draft"}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPreviewNote(note);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewNote !== null} onOpenChange={() => setPreviewNote(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Quick Preview
            </DialogTitle>
            <DialogDescription>
              {previewNote?.patient_name} • {previewNote?.date_of_visit && format(new Date(previewNote.date_of_visit), "MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          
          {previewNote && (
            <div className="space-y-4 mt-4">
              {previewNote.chief_complaint && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">Chief Complaint</h4>
                  <p className="text-sm text-slate-700">{previewNote.chief_complaint}</p>
                </div>
              )}
              
              {previewNote.clinical_impression && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">Clinical Impression</h4>
                  <p className="text-sm text-slate-700">{previewNote.clinical_impression}</p>
                </div>
              )}
              
              {previewNote.diagnoses?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Diagnoses</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewNote.diagnoses.map((dx, i) => (
                      <Badge key={i} variant="outline">{dx}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {previewNote.plan && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">Plan</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{previewNote.plan}</p>
                </div>
              )}

              <div className="pt-4 border-t flex gap-2">
                <Link to={createPageUrl(`NoteDetail?id=${previewNote.id}`)} className="flex-1">
                  <Button className="w-full">View Full Note</Button>
                </Link>
                <Button variant="outline" onClick={() => setPreviewNote(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}