import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Calendar, ChevronRight, Filter } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.ClinicalNote.list("-created_date", 100),
  });

  const filtered = notes.filter((n) => {
    const matchSearch =
      !search ||
      n.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      n.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      n.chief_complaint?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || n.status === statusFilter;
    const matchType = typeFilter === "all" || n.note_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notes Library</h1>
          <p className="text-slate-500 mt-1">{notes.length} clinical notes</p>
        </div>
        <Link to={createPageUrl("NewNote")}>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /> New Note
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, ID, or complaint..."
            className="pl-10 rounded-xl border-slate-200"
          />
        </div>
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
          <div className="divide-y divide-slate-50">
            <AnimatePresence>
              {filtered.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={createPageUrl(`NoteDetail?id=${note.id}`)}
                    className="group flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                      <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{note.patient_name}</p>
                        {note.patient_id && <span className="text-xs text-slate-400">#{note.patient_id}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {note.date_of_visit && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(note.date_of_visit), "MMM d, yyyy")}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{typeLabels[note.note_type] || "Note"}</span>
                        {note.chief_complaint && (
                          <span className="text-xs text-slate-500 truncate max-w-[200px] hidden sm:inline">
                            — {note.chief_complaint}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${statusColors[note.status] || statusColors.draft}`}>
                      {note.status || "draft"}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}