import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye } from "lucide-react";
import StructuredNotePreview from "./StructuredNotePreview";

export default function ClinicalNotePreviewButton({ note, templates = [], selectedTemplate, onTemplateChange, onUpdate }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-sm"
      >
        <Eye className="w-4 h-4" />
        Preview Note
      </Button>

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