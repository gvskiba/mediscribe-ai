import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Clock, User, FileText, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export default function TemplateVersionHistory({ template, versions, open, onClose, onRestore }) {
  const sortedVersions = [...(versions || [])]
    .sort((a, b) => b.version - a.version);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of "{template?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto pr-2">
          {sortedVersions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No version history available</p>
            </div>
          ) : (
            sortedVersions.map((version) => {
              const isCurrent = version.id === template?.id;
              
              return (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isCurrent 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            Version {version.version}
                          </span>
                          {isCurrent && (
                            <Badge className="bg-blue-100 text-blue-700">Current</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(version.created_date), "MMM d, yyyy 'at' h:mm a")}
                          <span>•</span>
                          <User className="w-3 h-3" />
                          {version.created_by}
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRestore(version)}
                        className="gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </Button>
                    )}
                  </div>

                  {version.version_notes && (
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <p className="text-sm text-slate-700">{version.version_notes}</p>
                    </div>
                  )}

                  {/* Show section count */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                    <span>{version.sections?.length || 0} sections</span>
                    {version.usage_count > 0 && (
                      <span>Used {version.usage_count} times</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}