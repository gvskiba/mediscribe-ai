import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amended: "bg-blue-50 text-blue-700 border-blue-200"
};

const typeLabels = {
  progress_note: "Progress Note",
  h_and_p: "H&P",
  discharge_summary: "Discharge",
  consult: "Consult",
  procedure_note: "Procedure"
};

export default function RecentNoteCard({ note }) {
  return (
    <Link
      to={createPageUrl(`NoteDetail?id=${note.id}`)} className="text-slate-800 p-4 rounded-xl group flex items-center gap-4 hover:bg-[#242938] transition-colors duration-200">


      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
        <FileText className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{note.patient_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-300">
            {note.date_of_visit ? format(new Date(note.date_of_visit), "MMM d, yyyy") : "No date"}
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-300">{typeLabels[note.note_type] || "Note"}</span>
        </div>
      </div>
      <Badge variant="outline" className="bg-emerald-500/10 text-slate-950 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-emerald-500/20">
        {note.status || "draft"}
      </Badge>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-300 transition-colors" />
    </Link>);

}