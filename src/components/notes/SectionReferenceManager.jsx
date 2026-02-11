import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link2, ArrowRight, Plus, X, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function SectionReferenceManager({ 
  note, 
  currentSection, 
  onAddReference,
  onRemoveReference 
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [targetText, setTargetText] = useState("");
  const [relationship, setRelationship] = useState("supports");

  const sections = [
    { id: "chief_complaint", label: "Chief Complaint", field: "chief_complaint" },
    { id: "history_of_present_illness", label: "HPI", field: "history_of_present_illness" },
    { id: "medical_history", label: "Medical History", field: "medical_history" },
    { id: "review_of_systems", label: "Review of Systems", field: "review_of_systems" },
    { id: "physical_exam", label: "Physical Exam", field: "physical_exam" },
    { id: "assessment", label: "Assessment", field: "assessment" },
    { id: "plan", label: "Plan", field: "plan" }
  ].filter(s => s.id !== currentSection);

  const references = note?.section_references || [];
  const currentReferences = references.filter(
    ref => ref.source_section === currentSection || ref.target_section === currentSection
  );

  const relationshipLabels = {
    supports: "Supports",
    explains: "Explains",
    contradicts: "Contradicts",
    follows_from: "Follows from"
  };

  const relationshipColors = {
    supports: "bg-green-50 text-green-700 border-green-200",
    explains: "bg-blue-50 text-blue-700 border-blue-200",
    contradicts: "bg-red-50 text-red-700 border-red-200",
    follows_from: "bg-purple-50 text-purple-700 border-purple-200"
  };

  const handleAddReference = () => {
    if (!sourceText || !targetSection || !targetText) return;

    const newReference = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source_section: currentSection,
      source_text: sourceText,
      target_section: targetSection,
      target_text: targetText,
      relationship
    };

    onAddReference(newReference);
    setSourceText("");
    setTargetSection("");
    setTargetText("");
    setRelationship("supports");
    setDialogOpen(false);
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          Section Links ({currentReferences.length})
        </span>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Link to Another Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">
                  Text from {currentSection.replace(/_/g, " ")}
                </label>
                <Textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Enter the text or finding from this section..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">
                  Relationship Type
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  {Object.entries(relationshipLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">
                  Link to Section
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Select section...</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>

              {targetSection && (
                <div>
                  <label className="text-sm font-medium text-slate-900 mb-2 block">
                    Text from {targetSection.replace(/_/g, " ")}
                  </label>
                  <Textarea
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    placeholder="Enter the related text from the target section..."
                    className="min-h-[80px]"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddReference} disabled={!sourceText || !targetSection || !targetText}>
                  Add Link
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {currentReferences.length > 0 && (
        <div className="space-y-2">
          {currentReferences.map(ref => {
            const isSource = ref.source_section === currentSection;
            const otherSection = isSource ? ref.target_section : ref.source_section;
            const otherText = isSource ? ref.target_text : ref.source_text;
            
            return (
              <div key={ref.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <Link2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${relationshipColors[ref.relationship]}`}>
                      {relationshipLabels[ref.relationship]}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      {otherSection.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{isSource ? ref.source_text : ref.target_text}</p>
                  {otherText && (
                    <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">
                      → {otherText}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveReference(ref.id)}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}