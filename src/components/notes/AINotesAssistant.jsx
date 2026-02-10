import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function AINotesAssistant({ onContentGenerated, onTagsSuggested, onSummarize }) {
  const [mode, setMode] = useState(null); // 'generate', 'summarize', 'tags'
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const generateDraftNote = async () => {
    if (!input.trim()) {
      toast.error("Please enter a prompt or bullet points");
      return;
    }

    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinical note writer. Based on the following brief input, generate a professional clinical note with appropriate sections (Chief Complaint, History of Present Illness, Assessment, Plan, etc). Make it clinically accurate and well-structured.

Input: ${input}

Generate a complete clinical note that can be used as a draft for further editing.`,
        response_json_schema: {
          type: "object",
          properties: {
            note_content: { type: "string" },
          },
        },
      });

      onContentGenerated(result.note_content);
      setInput("");
      setMode(null);
      toast.success("Draft note generated");
    } catch (error) {
      toast.error("Failed to generate note");
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeNote = async () => {
    if (!input.trim()) {
      toast.error("Please enter the note content to summarize");
      return;
    }

    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize the following clinical note into key points. Extract the most important information including chief complaint, main findings, diagnosis, and plan.

Note: ${input}

Provide a concise summary highlighting critical clinical information.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      });

      onSummarize(result.summary, result.key_points);
      setInput("");
      setMode(null);
      toast.success("Note summarized");
    } catch (error) {
      toast.error("Failed to summarize note");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestTags = async () => {
    if (!input.trim()) {
      toast.error("Please enter note content");
      return;
    }

    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following clinical note and suggest relevant tags and categories for organization.

Note: ${input}

Suggest:
1. Medical conditions/diagnoses mentioned
2. Specialties relevant to this note
3. Treatment types mentioned
4. Procedural tags if applicable
5. Patient demographics/risk factors if mentioned`,
        response_json_schema: {
          type: "object",
          properties: {
            conditions: { type: "array", items: { type: "string" } },
            specialties: { type: "array", items: { type: "string" } },
            treatments: { type: "array", items: { type: "string" } },
            procedures: { type: "array", items: { type: "string" } },
            demographics: { type: "array", items: { type: "string" } },
          },
        },
      });

      onTagsSuggested(result);
      setInput("");
      setMode(null);
      toast.success("Tags suggested");
    } catch (error) {
      toast.error("Failed to suggest tags");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode("generate")}
          className="gap-2 rounded-lg"
        >
          <Sparkles className="w-4 h-4" />
          Generate Draft
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode("summarize")}
          className="gap-2 rounded-lg"
        >
          <Sparkles className="w-4 h-4" />
          Summarize
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode("tags")}
          className="gap-2 rounded-lg"
        >
          <Sparkles className="w-4 h-4" />
          Suggest Tags
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h4 className="font-semibold text-slate-900">
            {mode === "generate" && "Generate Draft Note"}
            {mode === "summarize" && "Summarize Note"}
            {mode === "tags" && "Suggest Tags"}
          </h4>
        </div>
        <button
          onClick={() => {
            setMode(null);
            setInput("");
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          mode === "generate"
            ? "Enter brief prompt or bullet points for the note..."
            : mode === "summarize"
            ? "Paste the note content to summarize..."
            : "Paste note content to analyze..."
        }
        className="min-h-24 rounded-lg border-slate-300"
      />

      <div className="flex gap-2">
        <Button
          onClick={() => {
            setMode(null);
            setInput("");
          }}
          variant="outline"
          size="sm"
          className="rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={
            mode === "generate"
              ? generateDraftNote
              : mode === "summarize"
              ? summarizeNote
              : suggestTags
          }
          disabled={isLoading}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {mode === "generate" && "Generate"}
              {mode === "summarize" && "Summarize"}
              {mode === "tags" && "Analyze"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}