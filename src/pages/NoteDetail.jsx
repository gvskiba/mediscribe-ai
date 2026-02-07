import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Hash,
  Target,
  Stethoscope,
  ClipboardList,
  Pill,
  Check,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amended: "bg-blue-50 text-blue-700 border-blue-200",
};

const typeLabels = {
  progress_note: "Progress Note",
  h_and_p: "History & Physical",
  discharge_summary: "Discharge Summary",
  consult: "Consultation",
  procedure_note: "Procedure Note",
};

export default function NoteDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("id");
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => base44.entities.ClinicalNote.list().then(
      (notes) => notes.find((n) => n.id === noteId)
    ),
    enabled: !!noteId,
  });

  const finalizeMutation = useMutation({
    mutationFn: () => base44.entities.ClinicalNote.update(noteId, { status: "finalized" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["note", noteId] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Note not found</h2>
        <Link to={createPageUrl("NotesLibrary")} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Back to Notes Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Nav */}
      <Link
        to={createPageUrl("NotesLibrary")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Notes
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{note.patient_name}</h1>
              <Badge variant="outline" className={statusColors[note.status] || statusColors.draft}>
                {note.status || "draft"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {note.patient_id && (
                <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {note.patient_id}</span>
              )}
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {typeLabels[note.note_type] || "Note"}</span>
              {note.date_of_visit && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(note.date_of_visit), "MMMM d, yyyy")}</span>
              )}
              {note.specialty && (
                <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> {note.specialty}</span>
              )}
            </div>
          </div>
          {note.status === "draft" && (
            <Button
              onClick={() => finalizeMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2"
            >
              <Check className="w-4 h-4" /> Finalize
            </Button>
          )}
        </div>
      </motion.div>

      {/* Structured Note */}
      <StructuredNotePreview note={note} />

      {/* Raw Note */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 p-6"
      >
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Original Note</h3>
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {note.raw_note}
        </div>
      </motion.div>
    </div>
  );
}