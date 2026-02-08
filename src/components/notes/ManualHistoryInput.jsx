import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

export default function ManualHistoryInput({ onHistoryExtracted }) {
  const [unstructuredText, setUnstructuredText] = useState("");
  const [extracting, setExtracting] = useState(false);

  const handleExtract = async () => {
    if (!unstructuredText.trim()) return;

    setExtracting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured patient history from the following unstructured text. Be comprehensive and accurate.

Unstructured Text:
${unstructuredText}

Extract:
1. chronic_conditions - Any ongoing or chronic medical conditions
2. allergies - Drug allergies, food allergies, or other allergies
3. current_medications - Current medications with dosages if mentioned
4. past_procedures - Past surgical procedures or major interventions
5. family_history - Family medical history (parents, siblings, children with conditions)

If a category has no information, return an empty array.`,
        response_json_schema: {
          type: "object",
          properties: {
            chronic_conditions: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            current_medications: { type: "array", items: { type: "string" } },
            past_procedures: { type: "array", items: { type: "string" } },
            family_history: { type: "array", items: { type: "string" } }
          }
        }
      });

      onHistoryExtracted(result);
      setUnstructuredText("");
    } catch (error) {
      console.error("Failed to extract history:", error);
      alert("Failed to extract history. Please try again.");
    }
    setExtracting(false);
  };

  return (
    <Card className="p-4 border-purple-200 bg-purple-50/50">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Extract History from Text
          </h3>
          <p className="text-xs text-slate-600">
            Paste unstructured patient history text, and AI will automatically extract and organize it.
          </p>
        </div>
        <Textarea
          value={unstructuredText}
          onChange={(e) => setUnstructuredText(e.target.value)}
          placeholder="e.g., Patient has hypertension, diabetes type 2, takes metformin 1000mg BID and lisinopril 10mg daily. Allergic to penicillin. Father had MI at age 55. Past appendectomy 2015..."
          className="min-h-[100px] text-sm resize-none border-purple-200 focus:border-purple-400"
        />
        <Button
          onClick={handleExtract}
          disabled={extracting || !unstructuredText.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
          size="sm"
        >
          {extracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Extracting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Extract & Add to History
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}