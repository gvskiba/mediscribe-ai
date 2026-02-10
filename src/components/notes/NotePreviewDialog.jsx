import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Calendar, User, Stethoscope, CheckCircle2, Pill } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amended: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function NotePreviewDialog({ note, open, onClose }) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {note.patient_name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 flex-wrap mt-2">
            {note.patient_id && (
              <span className="flex items-center gap-1.5 text-sm">
                <span className="text-slate-400">MRN:</span>
                <span className="font-mono font-semibold">{note.patient_id}</span>
              </span>
            )}
            {note.date_of_visit && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {format(new Date(note.date_of_visit), "MMMM d, yyyy")}
                </span>
              </>
            )}
            {note.specialty && (
              <>
                <span className="text-slate-300">•</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Stethoscope className="w-3 h-3 mr-1" />
                  {note.specialty}
                </Badge>
              </>
            )}
            <Badge variant="outline" className={statusColors[note.status] || statusColors.draft}>
              {note.status || "draft"}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {note.chief_complaint && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
              <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Chief Complaint
              </h4>
              <p className="text-base text-slate-800 leading-relaxed">{note.chief_complaint}</p>
            </div>
          )}
          
          {note.clinical_impression && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
              <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Clinical Impression
              </h4>
              <p className="text-base text-slate-800 leading-relaxed">{note.clinical_impression}</p>
            </div>
          )}
          
          {note.diagnoses?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Diagnoses ({note.diagnoses.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {note.diagnoses.map((dx, i) => (
                  <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm py-1.5">
                    {dx}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {note.medications?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-green-600" />
                Medications ({note.medications.length})
              </h4>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="space-y-2">
                  {note.medications.map((med, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span className="text-sm text-slate-700">{med}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {note.plan && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Treatment Plan</h4>
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.plan}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 flex gap-3">
          <Link to={createPageUrl(`NoteDetail?id=${note.id}`)} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg">
              View Full Note
            </Button>
          </Link>
          <Button variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}