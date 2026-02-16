import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Calendar, ChevronRight, Eye, Archive, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

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

export default function PatientNotesGroup({ patientName, notes, selectedNotes, onToggleNote, onPreview, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Patient Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-5 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{patientName}</h3>
              <p className="text-sm text-slate-600">
                {notes.length} encounter{notes.length > 1 ? "s" : ""}
                {notes[0]?.patient_id && ` • MRN: ${notes[0].patient_id}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="text-center bg-white rounded-lg px-3 py-2 border border-slate-200">
              <p className="text-xs text-slate-500">Drafts</p>
              <p className="text-lg font-bold text-amber-600">
                {notes.filter(n => n.status === "draft").length}
              </p>
            </div>
            <div className="text-center bg-white rounded-lg px-3 py-2 border border-slate-200">
              <p className="text-xs text-slate-500">Finalized</p>
              <p className="text-lg font-bold text-emerald-600">
                {notes.filter(n => n.status === "finalized").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient's Notes */}
      <div className="divide-y divide-slate-100">
        {notes.map((note) => (
          <div key={note.id} className="group flex items-start gap-4 p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all">
            <Checkbox
              checked={selectedNotes.includes(note.id)}
              onCheckedChange={() => onToggleNote(note.id)}
              className="mt-1"
            />

            <Link
              to={createPageUrl(`NoteDetail?id=${note.id}`)}
              className="flex items-start gap-4 flex-1 min-w-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {note.date_of_visit && (
                    <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {format(new Date(note.date_of_visit), "MMM d, yyyy")}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                    {typeLabels[note.note_type] || "Note"}
                  </Badge>
                  <Badge variant="outline" className={`text-xs font-semibold ${statusColors[note.status] || statusColors.draft}`}>
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
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {note.clinical_impression}
                  </p>
                )}
                
                {note.diagnoses?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {note.diagnoses.slice(0, 2).map((dx, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {dx.length > 25 ? dx.substring(0, 25) + "..." : dx}
                      </Badge>
                    ))}
                    {note.diagnoses.length > 2 && (
                      <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                        +{note.diagnoses.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </Link>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPreview(note);
                }}
                className="rounded-lg hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 text-blue-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm(`Delete note from ${format(new Date(note.date_of_visit || note.created_date), "MMM d, yyyy")}? This cannot be undone.`)) {
                    onDelete(note.id);
                  }
                }}
                className="rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}