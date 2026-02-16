import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Check, Calendar, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { createPageUrl } from "../../utils";

export default function AddToNoteDialog({ open, onClose, calculatorData }) {
  const [search, setSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.ClinicalNote.list("-updated_date", 50),
    enabled: open,
  });

  const filteredNotes = notes.filter((n) => {
    if (n.archived) return false;
    const matchSearch =
      !search ||
      n.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      n.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      n.chief_complaint?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleAddToNote = async () => {
    if (!selectedNoteId || !calculatorData) return;

    setSaving(true);
    try {
      const note = notes.find(n => n.id === selectedNoteId);
      
      let mdmText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      mdmText += `MEDICAL CALCULATOR - ${calculatorData.name}\n`;
      mdmText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (calculatorData.inputs && Object.keys(calculatorData.inputs).length > 0) {
        mdmText += `Input Parameters:\n`;
        Object.entries(calculatorData.inputs).forEach(([key, value]) => {
          mdmText += `  • ${key}: ${value}\n`;
        });
        mdmText += `\n`;
      }

      mdmText += `Result: ${calculatorData.result}\n`;
      
      if (calculatorData.interpretation) {
        mdmText += `\nInterpretation: ${calculatorData.interpretation}\n`;
      }
      
      if (calculatorData.category) {
        mdmText += `Category: ${calculatorData.category}\n`;
      }

      mdmText += `\nCalculated: ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}\n`;
      
      if (calculatorData.url) {
        mdmText += `Reference: ${calculatorData.url}\n`;
      }

      const updatedMDM = (note.mdm || "") + mdmText;
      await base44.entities.ClinicalNote.update(selectedNoteId, { mdm: updatedMDM });
      
      toast.success("Calculator result added to MDM section");
      
      // Ask if user wants to open the note
      if (window.confirm("Calculator added to note. Would you like to open the note now?")) {
        window.location.href = createPageUrl(`NoteDetail?id=${selectedNoteId}`);
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Failed to add to note:", error);
      toast.error("Failed to add calculator to note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Add Calculator to Clinical Note
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-2">
            Select a clinical note to add the <span className="font-semibold text-slate-900">{calculatorData?.name}</span> results to the MDM section
          </p>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search notes by patient name, MRN, or chief complaint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notes List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No notes found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedNoteId === note.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <Checkbox
                      checked={selectedNoteId === note.id}
                      onCheckedChange={() => setSelectedNoteId(note.id)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {note.patient_name === "New Patient" 
                          ? (note.chief_complaint || "New Patient")
                          : note.patient_name}
                      </h4>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {note.date_of_visit ? format(new Date(note.date_of_visit), "MMM d") : "N/A"}
                      </span>
                    </div>
                    {note.chief_complaint && (
                      <p className="text-sm text-slate-600 truncate mb-1">
                        {note.chief_complaint}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {note.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          note.status === 'finalized' ? 'bg-emerald-100 text-emerald-700' :
                          note.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {note.status}
                        </span>
                      )}
                      {note.patient_id && (
                        <span className="text-xs text-slate-500">
                          MRN: {note.patient_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleAddToNote}
            disabled={!selectedNoteId || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Add to Note
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}