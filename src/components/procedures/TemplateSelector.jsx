import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, Copy, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplateSelector({ onApplyTemplate, isLoading }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["procedureTemplates"],
    queryFn: () => base44.entities.ProcedureTemplate.list(),
    enabled: open
  });

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.procedure_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleApply = async (template) => {
    onApplyTemplate(template);
    
    // Update usage count
    const updatedTemplate = { ...template, usage_count: (template.usage_count || 0) + 1, last_used: new Date().toISOString() };
    await base44.entities.ProcedureTemplate.update(template.id, updatedTemplate);
    
    setOpen(false);
    setSearchQuery("");
    toast.success(`Applied template: ${template.name}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Copy className="w-4 h-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Procedure Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search templates by name, procedure, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{template.name}</h3>
                        {template.is_favorite && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary">{template.procedure_name}</Badge>
                        {template.category && <Badge variant="outline">{template.category}</Badge>}
                        {template.specialty && <Badge variant="outline" className="text-xs">{template.specialty}</Badge>}
                      </div>
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {template.usage_count > 0 && (
                        <p className="text-xs text-slate-500 mt-2">Used {template.usage_count} times</p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleApply(template)}
                      disabled={isLoading}
                      className="flex-shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>No templates found. Create one to get started.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}