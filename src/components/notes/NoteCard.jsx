import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Calendar, ChevronRight, Eye, User, Stethoscope, Archive, Trash2 } from "lucide-react";
import { format } from "date-fns";

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

export default function NoteCard({ note, selected, onSelect, onPreview, onDelete, layoutMode = "list" }) {
  if (layoutMode === "grid") {
    return (
      <Link to={createPageUrl(`NoteDetail?id=${note.id}`)}>
        <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-5 h-full cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <Checkbox
              checked={selected}
              onCheckedChange={(e) => {
                e.stopPropagation();
                onSelect(note.id);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <Badge variant="outline" className={`text-xs ${statusColors[note.status] || statusColors.draft}`}>
              {note.status || "draft"}
            </Badge>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              {note.patient_name}
            </h3>
            {note.patient_id && (
              <p className="text-xs text-slate-500">MRN: {note.patient_id}</p>
            )}
          </div>

          {note.date_of_visit && (
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {format(new Date(note.date_of_visit), "MMM d, yyyy")}
            </div>
          )}

          {note.chief_complaint && (
            <p className="text-sm text-slate-700 line-clamp-2 mb-3">
              {note.chief_complaint}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">
              {typeLabels[note.note_type] || "Note"}
            </Badge>
            {note.specialty && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                {note.specialty}
              </Badge>
            )}
            {note.diagnoses?.length > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {note.diagnoses.length} Dx
              </Badge>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <p className="font-medium">Created</p>
              <p className="text-slate-400">{format(new Date(note.created_date), "MMM d, yyyy h:mm a")}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group flex items-start gap-4 p-5 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all">
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelect(note.id)}
        className="mt-1"
      />

      <Link
        to={createPageUrl(`NoteDetail?id=${note.id}`)}
        className="flex items-start gap-4 flex-1 min-w-0"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
          <FileText className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-lg text-slate-900">{note.patient_name}</h3>
            {note.patient_id && (
              <span className="text-sm text-slate-400 font-mono">#{note.patient_id}</span>
            )}
            <Badge variant="outline" className={`text-xs font-semibold ${statusColors[note.status] || statusColors.draft}`}>
              {note.status || "draft"}
            </Badge>
            {note.archived && (
              <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">
                <Archive className="w-3 h-3 mr-1" />
                Archived
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {note.date_of_visit && (
              <span className="text-sm text-slate-600 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-blue-500" />
                {format(new Date(note.date_of_visit), "MMMM d, yyyy")}
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
            <p className="text-sm text-slate-700 font-medium line-clamp-1 mb-2">
              <span className="text-slate-500">CC:</span> {note.chief_complaint}
            </p>
          )}
          
          {note.clinical_impression && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-2 leading-relaxed">
              {note.clinical_impression}
            </p>
          )}
          
          {note.diagnoses?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {note.diagnoses.slice(0, 3).map((dx, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  {dx.length > 35 ? dx.substring(0, 35) + "..." : dx}
                </Badge>
              ))}
              {note.diagnoses.length > 3 && (
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-300">
                  +{note.diagnoses.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Created {format(new Date(note.created_date), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
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
            if (confirm(`Delete note for ${note.patient_name}? This cannot be undone.`)) {
              onDelete(note.id);
            }
          }}
          className="rounded-lg hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}