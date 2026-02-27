import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Calendar, ChevronRight, Eye, Trash2, Clock, Archive, User } from "lucide-react";
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

function PatientLabel({ note }) {
  const parts = [];
  if (note.patient_age) parts.push(`${note.patient_age}yo`);
  if (note.patient_gender) parts.push(note.patient_gender.charAt(0).toUpperCase());
  return parts.length > 0 ? parts.join(" ") : null;
}

function getSummaryText(note) {
  // Use summary field, or fall back to clinical_impression, or first 120 chars of assessment
  if (note.summary) return note.summary.length > 120 ? note.summary.substring(0, 120) + "…" : note.summary;
  if (note.clinical_impression) return note.clinical_impression.length > 120 ? note.clinical_impression.substring(0, 120) + "…" : note.clinical_impression;
  if (note.assessment) return note.assessment.length > 120 ? note.assessment.substring(0, 120) + "…" : note.assessment;
  return null;
}

export default function NoteCard({ note, selected, onSelect, onPreview, onDelete, layoutMode = "list" }) {
  const patientLabel = PatientLabel({ note });
  const summaryText = getSummaryText(note);
  const noteTypeLabel = typeLabels[note.note_type] || "Note";

  if (layoutMode === "grid") {
    return (
      <Link to={createPageUrl(`NoteDetail?id=${note.id}`)}>
        <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-5 h-full cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <Checkbox
              checked={selected}
              onCheckedChange={(e) => { e.stopPropagation(); onSelect(note.id); }}
              onClick={(e) => e.stopPropagation()}
            />
            <Badge variant="outline" className={`text-xs ${statusColors[note.status] || statusColors.draft}`}>
              {note.status || "draft"}
            </Badge>
          </div>

          {/* Note Type + Date/Time */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-600 font-medium">
              {noteTypeLabel}
            </Badge>
            {note.date_of_visit && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(note.date_of_visit), "MMM d, yyyy")}
              </span>
            )}
            {note.time_of_visit && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />{note.time_of_visit}
              </span>
            )}
          </div>

          {/* Age + Gender + Chief Complaint */}
          <div className="mb-3">
            {patientLabel && (
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{patientLabel}</span>
              </div>
            )}
            {note.chief_complaint && (
              <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                {note.chief_complaint}
              </p>
            )}
          </div>

          {/* Brief summary */}
          {summaryText && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{summaryText}</p>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Created {format(new Date(note.created_date), "MMM d, h:mm a")}
            </p>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </Link>
    );
  }

  // LIST VIEW
  return (
    <div className="group flex items-start gap-4 p-5 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all">
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelect(note.id)}
        className="mt-1"
      />

      <Link to={createPageUrl(`NoteDetail?id=${note.id}`)} className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
          <FileText className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Row 1: Note type · Date · Time · Status */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-600 font-medium">
              {noteTypeLabel}
            </Badge>
            {note.date_of_visit && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                {format(new Date(note.date_of_visit), "MMM d, yyyy")}
              </span>
            )}
            {note.time_of_visit && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />{note.time_of_visit}
              </span>
            )}
            <Badge variant="outline" className={`text-xs font-semibold ${statusColors[note.status] || statusColors.draft}`}>
              {note.status || "draft"}
            </Badge>
            {note.archived && (
              <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">
                <Archive className="w-3 h-3 mr-1" />Archived
              </Badge>
            )}
          </div>

          {/* Row 2: Age · Gender · Chief Complaint */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {patientLabel && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                <User className="w-3 h-3" />{patientLabel}
              </span>
            )}
            {note.chief_complaint && (
              <span className="text-sm font-bold text-slate-900 line-clamp-1">
                {note.chief_complaint}
              </span>
            )}
            {!note.chief_complaint && !patientLabel && (
              <span className="text-sm font-bold text-slate-900">{note.patient_name || "Unknown Patient"}</span>
            )}
          </div>

          {/* Row 3: Brief summary */}
          {summaryText && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-1.5">{summaryText}</p>
          )}

          {/* Row 4: Diagnoses tags */}
          {note.diagnoses?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {note.diagnoses.slice(0, 3).map((dx, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {dx.length > 35 ? dx.substring(0, 35) + "…" : dx}
                </Badge>
              ))}
              {note.diagnoses.length > 3 && (
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200">
                  +{note.diagnoses.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Footer: created date */}
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Created {format(new Date(note.created_date), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </Link>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPreview(note); }} className="rounded-lg hover:bg-blue-50">
          <Eye className="w-4 h-4 text-blue-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (confirm("Delete this note? This cannot be undone.")) onDelete(note.id); }} className="rounded-lg hover:bg-red-50">
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}