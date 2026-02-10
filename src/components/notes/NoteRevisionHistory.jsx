import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  History,
  ChevronDown,
  Clock,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function NoteRevisionHistory({ noteId, onRestore }) {
  const [expandedRevision, setExpandedRevision] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const { data: revisions = [], isLoading } = useQuery({
    queryKey: ["noteRevisions", noteId],
    queryFn: async () => {
      const allRevisions = await base44.entities.NoteRevision.list();
      return allRevisions
        .filter(r => r.note_id === noteId)
        .sort((a, b) => b.revision_number - a.revision_number);
    },
    enabled: !!noteId,
  });

  if (!revisions.length) {
    return null;
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all">
          <History className="w-4 h-4" /> View Revisions ({revisions.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Note Revision History
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : revisions.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            No revisions yet. Auto-save will create revisions as you make changes.
          </div>
        ) : (
          <div className="space-y-2">
            {revisions.map((revision, idx) => (
              <div key={revision.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedRevision(
                      expandedRevision === revision.id ? null : revision.id
                    )
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="secondary" className="flex-shrink-0">
                      v{revision.revision_number}
                    </Badge>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {revision.change_summary || "Auto-save"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {revision.revision_date
                          ? format(new Date(revision.revision_date), "PPp")
                          : format(
                              new Date(revision.created_date),
                              "PPp"
                            )}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
                      expandedRevision === revision.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedRevision === revision.id && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                    {revision.chief_complaint && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 uppercase mb-1">
                          Chief Complaint
                        </h4>
                        <p className="text-sm text-slate-700">{revision.chief_complaint}</p>
                      </div>
                    )}

                    {revision.history_of_present_illness && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 uppercase mb-1">
                          HPI
                        </h4>
                        <div className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 max-h-[200px] overflow-y-auto">
                          <ReactQuill
                            value={revision.history_of_present_illness}
                            readOnly={true}
                            theme="bubble"
                            modules={{ toolbar: false }}
                          />
                        </div>
                      </div>
                    )}

                    {revision.assessment && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 uppercase mb-1">
                          Assessment
                        </h4>
                        <div className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 max-h-[200px] overflow-y-auto">
                          <ReactQuill
                            value={revision.assessment}
                            readOnly={true}
                            theme="bubble"
                            modules={{ toolbar: false }}
                          />
                        </div>
                      </div>
                    )}

                    {revision.plan && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 uppercase mb-1">
                          Plan
                        </h4>
                        <div className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 max-h-[200px] overflow-y-auto">
                          <ReactQuill
                            value={revision.plan}
                            readOnly={true}
                            theme="bubble"
                            modules={{ toolbar: false }}
                          />
                        </div>
                      </div>
                    )}

                    {revision.diagnoses?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 uppercase mb-1">
                          Diagnoses
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {revision.diagnoses.map((diag, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-50">
                              {diag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {revision.medications?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 uppercase mb-1">
                          Medications
                        </h4>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {revision.medications.map((med, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5">•</span>
                              <span>{med}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        onRestore?.(revision);
                        setOpenDialog(false);
                      }}
                      className="w-full gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30 font-semibold transition-all"
                      size="sm"
                    >
                      Restore This Version
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}