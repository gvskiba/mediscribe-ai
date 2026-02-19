import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function ProcedureNoteCreator({ onSuccess }) {
  const [procedureType, setProcedureType] = useState("");
  const [generatedNote, setGeneratedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const generateProcedureNote = async () => {
    if (!procedureType.trim()) {
      toast.error("Enter procedure type");
      return;
    }

    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional medical procedure note template for: ${procedureType}

Include the following sections:
1. Procedure: Name and indication
2. Anesthesia: Type and method
3. Equipment: Required instruments
4. Technique: Step-by-step procedure description
5. Findings: What was observed/findings
6. Complications: Any issues encountered
7. Closure: How procedure was closed
8. Post-procedure Plan: Care and follow-up instructions

Format as a detailed clinical note.`,
        response_json_schema: {
          type: "object",
          properties: {
            procedure_name: { type: "string" },
            indication: { type: "string" },
            anesthesia: { type: "string" },
            equipment: { type: "array", items: { type: "string" } },
            technique: { type: "string" },
            findings: { type: "string" },
            complications: { type: "string" },
            closure: { type: "string" },
            postop_plan: { type: "string" },
          },
        },
      });

      setGeneratedNote(res);
      setCustomNote(formatNoteAsText(res));
    } catch (error) {
      console.error("Failed to generate procedure note:", error);
      toast.error("Failed to generate procedure note");
    } finally {
      setLoading(false);
    }
  };

  const formatNoteAsText = (note) => {
    return `PROCEDURE NOTE
    
Procedure: ${note.procedure_name}
Indication: ${note.indication}

ANESTHESIA:
${note.anesthesia}

EQUIPMENT:
${note.equipment?.map(e => `• ${e}`).join('\n')}

TECHNIQUE:
${note.technique}

FINDINGS:
${note.findings}

COMPLICATIONS:
${note.complications || "None"}

CLOSURE:
${note.closure}

POST-OPERATIVE PLAN:
${note.postop_plan}`;
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Create Procedure Note
        </Button>
      ) : (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Create Procedure Note</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setGeneratedNote(null);
                setProcedureType("");
                setCustomNote("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!generatedNote ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Procedure Type
                </label>
                <Input
                  placeholder="e.g., Knee Arthroscopy, Colonoscopy, Biopsy..."
                  value={procedureType}
                  onChange={(e) => setProcedureType(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button
                onClick={generateProcedureNote}
                disabled={loading || !procedureType.trim()}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate AI Procedure Note</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{generatedNote.procedure_name}</p>
                    <p className="text-sm text-slate-600 mt-1">{generatedNote.indication}</p>
                  </div>
                  <Badge className="bg-rose-100 text-rose-800">Generated</Badge>
                </div>
              </div>

              <Textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="min-h-[400px] text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onSuccess(customNote);
                    setShowForm(false);
                    setGeneratedNote(null);
                    setProcedureType("");
                    setCustomNote("");
                    toast.success("Procedure note created");
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" /> Save Note
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedNote(null);
                    setProcedureType("");
                    setCustomNote("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}