import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Copy } from "lucide-react";
import { toast } from "sonner";

const defaultTemplates = {
  assessment: [
    "Patient presents with acute exacerbation of chronic condition.",
    "Clinical findings consistent with diagnosis. Differential includes...",
    "Assessment: [Primary diagnosis] with complications. Plan initiated.",
  ],
  plan: [
    "Continue current medications with monitoring.",
    "Refer to specialist for further evaluation and management.",
    "Follow-up in clinic within 2 weeks. Patient counseled on warning signs.",
    "Ordered labs and imaging as indicated. Patient educated on findings.",
  ],
};

export default function QuickTextTemplates({ field, onInsert, open, onClose }) {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem(`templates_${field}`);
    return saved ? JSON.parse(saved) : defaultTemplates[field] || [];
  });
  
  const [newTemplate, setNewTemplate] = useState("");

  const handleAddTemplate = () => {
    if (!newTemplate.trim()) {
      toast.error("Template cannot be empty");
      return;
    }
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem(`templates_${field}`, JSON.stringify(updated));
    setNewTemplate("");
    toast.success("Template saved");
  };

  const handleDeleteTemplate = (idx) => {
    const updated = templates.filter((_, i) => i !== idx);
    setTemplates(updated);
    localStorage.setItem(`templates_${field}`, JSON.stringify(updated));
    toast.success("Template deleted");
  };

  const handleUseTemplate = (template) => {
    onInsert(template);
    onClose();
    toast.success("Template inserted");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Quick Text Templates - {field}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {/* Add New Template */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-900">Add New Template</p>
            <textarea
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              placeholder="Enter your template text..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[80px] resize-none"
            />
            <Button
              onClick={handleAddTemplate}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4" /> Save Template
            </Button>
          </div>

          {/* Existing Templates */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">Your Templates</p>
            {templates.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No templates yet. Create your first one above.</p>
            ) : (
              templates.map((template, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors"
                >
                  <p className="text-sm text-slate-700 mb-2 line-clamp-2">{template}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 gap-2 border-blue-300 hover:bg-blue-50"
                    >
                      <Copy className="w-3.5 h-3.5" /> Use
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(idx)}
                      className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}