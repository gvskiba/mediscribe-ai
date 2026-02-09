import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SnippetVersionHistory({ snippetId, open, onClose, onRevert }) {
  const { data: versions = [], refetch } = useQuery({
    queryKey: ["snippetVersions", snippetId],
    queryFn: () => snippetId ? base44.entities.SnippetVersion.filter({ snippet_id: snippetId }, "-version_number", 100) : Promise.resolve([]),
    enabled: open && !!snippetId
  });

  const handleRevert = async (version) => {
    try {
      await onRevert(version);
      toast.success(`Reverted to version ${version.version_number}`);
      refetch();
    } catch (error) {
      toast.error("Failed to revert version");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No previous versions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, idx) => (
              <div key={version.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-900">Version {version.version_number}</div>
                    <p className="text-xs text-slate-500">
                      {version.created_date ? format(new Date(version.created_date), "MMM d, yyyy HH:mm") : "N/A"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevert(version)}
                    className="gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Name</p>
                    <p className="text-slate-900 font-mono text-xs bg-slate-100 p-2 rounded">{version.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Preview</p>
                    <div className="text-slate-700 prose prose-sm max-w-none bg-slate-50 p-2 rounded max-h-24 overflow-hidden" dangerouslySetInnerHTML={{ __html: version.content }} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {version.category && <Badge variant="outline" className="text-xs">{version.category}</Badge>}
                    {(version.tags || []).map(tag => (
                      <Badge key={tag} className="text-xs bg-blue-50 text-blue-700 border-blue-200">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}