import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Sparkles, Edit2, Check, X } from "lucide-react";

export default function EditableSummaryGenerator({ note, onSave, onCancel }) {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");

  const generateSummary = async () => {
    if (!note) return;
    setIsGenerating(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise, clinically relevant summary of this patient encounter. Focus on actionable information.

PATIENT: ${note.patient_name || ""}
DATE: ${note.date_of_visit || ""}

CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}
HISTORY OF PRESENT ILLNESS: ${note.history_of_present_illness || "N/A"}
ASSESSMENT: ${note.assessment || "N/A"}
PLAN: ${note.plan || "N/A"}
DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}
MEDICATIONS: ${note.medications?.join(", ") || "N/A"}

Create a 2-3 paragraph summary that covers:
1. Chief complaint and key clinical findings
2. Working diagnoses and differential considerations
3. Treatment plan and follow-up actions

Make it concise, professional, and suitable for handoff to another clinician.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" }
          }
        }
      });

      if (result.summary) {
        setSummary(result.summary);
        setEditedSummary(result.summary);
        toast.success("Summary generated successfully");
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!editedSummary.trim()) {
      toast.error("Summary cannot be empty");
      return;
    }
    onSave(editedSummary);
    setIsEditing(false);
    toast.success("Summary saved");
  };

  if (!summary) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Auto-Generated Summary
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Generate an AI-powered clinical summary of this note
            </p>
          </div>
        </div>
        <Button
          onClick={generateSummary}
          disabled={isGenerating}
          className="gap-2 bg-blue-600 hover:bg-blue-700 w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Summary
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Clinical Summary
        </h3>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            className="min-h-[150px] border-slate-300 focus:border-blue-400"
            placeholder="Edit the summary..."
          />
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditedSummary(summary);
              }}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm prose-slate max-w-none bg-slate-50 rounded-lg p-4 leading-relaxed text-slate-700">
          {editedSummary.split("\n\n").map((paragraph, idx) => (
            <p key={idx} className="mb-3 last:mb-0 text-sm">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {!isEditing && (
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button
            onClick={() => generateSummary()}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Regenerate
          </Button>
          <Button
            onClick={() => onSave(editedSummary)}
            size="sm"
            className="gap-1.5 bg-green-600 hover:bg-green-700 ml-auto"
          >
            <Check className="w-4 h-4" />
            Finalize
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}