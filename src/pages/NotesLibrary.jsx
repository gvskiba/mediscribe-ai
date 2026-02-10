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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, FileText, Calendar, ChevronRight, Trash2, Archive, CheckCircle2, X, Eye, User, FolderOpen, Clock, ArrowUpDown, Stethoscope } from "lucide-react";
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
  const [viewMode, setViewMode] = useState("all");

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
  
  // Group notes by patient
  const notesByPatient = filtered.reduce((acc, note) => {
    const patientName = note.patient_name || "Unknown Patient";
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
            {viewMode === "by-patient" && ` • ${Object.keys(notesByPatient).length} patients`}
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

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100">
          <TabsTrigger value="all" className="gap-2">
            <FileText className="w-4 h-4" /> All Notes
          </TabsTrigger>
          <TabsTrigger value="by-patient" className="gap-2">
            <User className="w-4 h-4" /> By Patient
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, ID, or complaint..."
              className="pl-10 rounded-xl border-slate-300"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-300">
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
        
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl border-slate-300">
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
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-300">
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
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-300">
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
            <SelectTrigger className="w-full sm:w-36 rounded-xl border-slate-300">
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
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No notes found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or create a new note.</p>
        </div>
      ) : viewMode === "by-patient" ? (
        /* BY PATIENT VIEW */
        <div className="space-y-4">
          {Object.entries(notesByPatient).map(([patientName, patientNotes]) => (
            <motion.div
              key={patientName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Patient Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{patientName}</h3>
                      <p className="text-xs text-slate-600">
                        {patientNotes.length} note{patientNotes.length > 1 ? "s" : ""}
                        {patientNotes[0]?.patient_id && ` • MRN: ${patientNotes[0].patient_id}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white text-slate-700">
                      {patientNotes.filter(n => n.status === "draft").length} drafts
                    </Badge>
                    <Badge variant="outline" className="bg-white text-slate-700">
                      {patientNotes.filter(n => n.status === "finalized").length} finalized
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Patient's Notes */}
              <div className="divide-y divide-slate-100">
                {patientNotes.map((note) => (
                  <div key={note.id} className="group flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <Checkbox
                      checked={selectedNotes.includes(note.id)}
                      onCheckedChange={() => handleToggleNote(note.id)}
                      className="mt-1"
                    />

                    <Link
                      to={createPageUrl(`NoteDetail?id=${note.id}`)}
                      className="flex items-start gap-4 flex-1 min-w-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {note.date_of_visit && (
                            <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {format(new Date(note.date_of_visit), "MMM d, yyyy")}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                            {typeLabels[note.note_type] || "Note"}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${statusColors[note.status] || statusColors.draft}`}>
                            {note.status || "draft"}
                          </Badge>
                          {note.archived && (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">
                              Archived
                            </Badge>
                          )}
                        </div>
                        {note.chief_complaint && (
                          <p className="text-sm text-slate-700 font-medium line-clamp-1 mb-1">
                            {note.chief_complaint}
                          </p>
                        )}
                        {note.clinical_impression && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {note.clinical_impression}
                          </p>
                        )}
                        {note.diagnoses?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {note.diagnoses.slice(0, 3).map((dx, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {dx.length > 30 ? dx.substring(0, 30) + "..." : dx}
                              </Badge>
                            ))}
                            {note.diagnoses.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                                +{note.diagnoses.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
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
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ALL NOTES VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
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

          <div className="divide-y divide-slate-100">
            <AnimatePresence>
              {filtered.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="group flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedNotes.includes(note.id)}
                    onCheckedChange={() => handleToggleNote(note.id)}
                    className="mt-1"
                  />

                  <Link
                    to={createPageUrl(`NoteDetail?id=${note.id}`)}
                    className="flex items-start gap-4 flex-1 min-w-0"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-all">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-slate-900">{note.patient_name}</p>
                        {note.patient_id && <span className="text-xs text-slate-400">#{note.patient_id}</span>}
                        {note.archived && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">
                            Archived
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        {note.date_of_visit && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(note.date_of_visit), "MMM d, yyyy")}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                          {typeLabels[note.note_type] || "Note"}
                        </Badge>
                        {note.specialty && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            {note.specialty}
                          </Badge>
                        )}
                      </div>
                      {note.chief_complaint && (
                        <p className="text-sm text-slate-700 font-medium line-clamp-1 mb-1">
                          {note.chief_complaint}
                        </p>
                      )}
                      {note.clinical_impression && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {note.clinical_impression}
                        </p>
                      )}
                      {note.diagnoses?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {note.diagnoses.slice(0, 3).map((dx, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {dx.length > 30 ? dx.substring(0, 30) + "..." : dx}
                            </Badge>
                          ))}
                          {note.diagnoses.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                              +{note.diagnoses.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={`text-xs ${statusColors[note.status] || statusColors.draft}`}>
                        {note.status || "draft"}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
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
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewNote !== null} onOpenChange={() => setPreviewNote(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Note Preview
            </DialogTitle>
            <DialogDescription className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {previewNote?.patient_name}
              </span>
              {previewNote?.date_of_visit && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(previewNote.date_of_visit), "MMM d, yyyy")}
                  </span>
                </>
              )}
              {previewNote?.specialty && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    {previewNote.specialty}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {previewNote && (
            <div className="space-y-5 mt-4">
              {previewNote.chief_complaint && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Chief Complaint
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{previewNote.chief_complaint}</p>
                </div>
              )}
              
              {previewNote.clinical_impression && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <h4 className="text-sm font-bold text-purple-900 mb-2">Clinical Impression</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{previewNote.clinical_impression}</p>
                </div>
              )}
              
              {previewNote.diagnoses?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Diagnoses</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewNote.diagnoses.map((dx, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{dx}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {previewNote.plan && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Treatment Plan</h4>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{previewNote.plan}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex gap-2">
                <Link to={createPageUrl(`NoteDetail?id=${previewNote.id}`)} className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">View Full Note</Button>
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