import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

export default function TemplateVersionComparison({ open, onClose, versions = [] }) {
  const [expandedVersions, setExpandedVersions] = useState({});

  const sortedVersions = [...versions].sort((a, b) => (b.version || 0) - (a.version || 0));

  const toggleVersion = (versionId) => {
    setExpandedVersions(prev => ({
      ...prev,
      [versionId]: !prev[versionId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {sortedVersions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No versions found</p>
          ) : (
            sortedVersions.map((version, idx) => {
              const isExpanded = expandedVersions[version.id];
              const isLatest = idx === 0;

              return (
                <div
                  key={version.id}
                  className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
                >
                  <button
                    onClick={() => toggleVersion(version.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={isLatest ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}>
                        v{version.version}
                      </Badge>
                      <div className="text-left">
                        <p className="font-medium text-slate-900 text-sm">{version.name}</p>
                        <p className="text-xs text-slate-500">
                          {version.updated_date ? format(new Date(version.updated_date), "MMM d, yyyy") : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {version.sections?.filter(s => s.enabled !== false).length || 0} sections
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
                      {version.version_notes && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Version Notes:</p>
                          <p className="text-sm text-slate-600">{version.version_notes}</p>
                        </div>
                      )}

                      {version.description && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Description:</p>
                          <p className="text-sm text-slate-600">{version.description}</p>
                        </div>
                      )}

                      {version.sections && version.sections.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-2">Sections:</p>
                          <div className="space-y-1">
                            {version.sections
                              .filter(s => s.enabled !== false)
                              .map((section, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2">
                                  <span className="text-xs text-slate-500 font-medium mt-1">{sIdx + 1}.</span>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">{section.name}</p>
                                    {section.description && (
                                      <p className="text-xs text-slate-500">{section.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                        <span>Usage Count: {version.usage_count || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}