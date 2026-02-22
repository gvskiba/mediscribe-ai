import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import StructuredNotePreview from "./StructuredNotePreview";

export default function ClinicalNotePreviewButton({ note, templates = [], selectedTemplate, onTemplateChange, onUpdate }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-0 hover:gap-2 transition-all duration-200 w-9 hover:w-auto overflow-hidden border border-blue-300 hover:bg-blue-50 hover:border-blue-400 text-blue-600 rounded-lg px-2.5 py-2 font-medium text-sm shadow-sm bg-white"
        title="Preview Note"
      >
        <Eye className="w-4 h-4 flex-shrink-0" />
        <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-200">Preview Note</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-5 h-5 text-blue-600" />
              Clinical Note Preview
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StructuredNotePreview
              note={note}
              templates={templates}
              selectedTemplate={selectedTemplate}
              onTemplateChange={onTemplateChange}
              onUpdate={onUpdate || (() => {})}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}