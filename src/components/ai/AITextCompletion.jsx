import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, X } from "lucide-react";

const SECTION_PROMPTS = {
  history_of_present_illness: (text, note) =>
    `You are assisting a clinician documenting a History of Present Illness (HPI). Complete the sentence or paragraph they are typing. Use clinical language, OLDCARTS framework when relevant, and draw from context below. Return ONLY the completion text (what comes after the cursor) — no preamble, no explanation, no markdown. Keep it to 1-2 sentences max.

EXISTING CONTEXT:
Chief Complaint: ${note?.chief_complaint || "N/A"}
Vital Signs: ${buildVitalsSummary(note?.vital_signs)}
Raw Notes: ${note?.raw_note || "N/A"}

HPI SO FAR:
${text}

COMPLETION (continue from where text ends):`,

  assessment: (text, note) =>
    `You are assisting a clinician writing a clinical Assessment section. Continue the text they are typing with a relevant clinical phrase, supporting reasoning, or pertinent finding. Return ONLY the completion (what comes after the cursor) — no preamble, no explanation. 1-2 sentences max.

CONTEXT:
Chief Complaint: ${note?.chief_complaint || "N/A"}
Diagnoses: ${(note?.diagnoses || []).join(", ") || "N/A"}
HPI: ${note?.history_of_present_illness || "N/A"}
Physical Exam: ${note?.physical_exam || "N/A"}

ASSESSMENT SO FAR:
${text}

COMPLETION:`,

  plan: (text, note) =>
    `You are assisting a clinician documenting a treatment Plan. Continue the text they are typing with evidence-based recommendations, medication dosing, follow-up guidance, or clinical next steps. Return ONLY the completion (what comes after the cursor) — no preamble, 1-2 sentences max.

CONTEXT:
Diagnoses: ${(note?.diagnoses || []).join(", ") || "N/A"}
Medications: ${(note?.medications || []).join(", ") || "None"}
Allergies: ${(note?.allergies || []).join(", ") || "NKDA"}
Assessment: ${note?.assessment || "N/A"}

PLAN SO FAR:
${text}

COMPLETION:`,
};

function buildVitalsSummary(vital_signs) {
  if (!vital_signs || typeof vital_signs !== "object") return "N/A";
  const parts = [];
  const v = vital_signs;
  if (v.temperature?.value) parts.push(`Temp ${v.temperature.value}°${v.temperature.unit || "F"}`);
  if (v.heart_rate?.value) parts.push(`HR ${v.heart_rate.value} bpm`);
  if (v.blood_pressure?.systolic) parts.push(`BP ${v.blood_pressure.systolic}/${v.blood_pressure.diastolic}`);
  if (v.oxygen_saturation?.value) parts.push(`SpO2 ${v.oxygen_saturation.value}%`);
  return parts.join(", ") || "N/A";
}

/**
 * AITextCompletion — drop-in textarea with ghost-text AI completions.
 *
 * Props:
 *   field        – one of 'history_of_present_illness' | 'assessment' | 'plan'
 *   value        – controlled value
 *   onChange     – (newValue: string) => void
 *   onBlur       – optional
 *   note         – the full clinical note object (for context)
 *   placeholder  – textarea placeholder
 *   className    – extra classes for the textarea
 *   minRows      – min visible rows (default 6)
 *   disabled     – boolean
 */
export default function AITextCompletion({
  field,
  value = "",
  onChange,
  onBlur,
  note,
  placeholder,
  className = "",
  minRows = 6,
  disabled = false,
}) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const textareaRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const lastFetchedText = useRef("");

  const promptFn = SECTION_PROMPTS[field];

  const fetchSuggestion = useCallback(async (text) => {
    if (!promptFn || !text.trim() || text.trim().length < 20) {
      setSuggestion("");
      return;
    }
    // Don't re-fetch if text didn't meaningfully change
    if (text === lastFetchedText.current) return;
    lastFetchedText.current = text;

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current = false;
    const isCurrent = { alive: true };
    abortRef.current = isCurrent;

    setLoading(true);
    setSuggestion("");

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: promptFn(text, note),
        response_json_schema: {
          type: "object",
          properties: { completion: { type: "string" } },
        },
      });

      if (!isCurrent.alive) return;

      let completion = (result?.completion || "").trim();
      // Remove any accidental repetition of existing text at start
      if (completion && text.trim().endsWith(completion.split(" ")[0])) {
        completion = completion.replace(/^\S+\s*/, "");
      }
      setSuggestion(completion || "");
    } catch {
      // silently fail — completions are optional
    } finally {
      if (isCurrent.alive) setLoading(false);
    }
  }, [field, note, promptFn]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    onChange(newVal);
    setSuggestion(""); // clear old suggestion immediately

    if (!aiEnabled) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestion(newVal);
    }, 1200); // 1.2s debounce to avoid hammering
  };

  const acceptSuggestion = useCallback(() => {
    if (!suggestion) return;
    const newVal = value + suggestion;
    onChange(newVal);
    setSuggestion("");
    lastFetchedText.current = newVal;
    // Move cursor to end
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newVal.length;
        textareaRef.current.selectionEnd = newVal.length;
        textareaRef.current.focus();
      }
    });
  }, [suggestion, value, onChange]);

  const handleKeyDown = (e) => {
    if (suggestion && (e.key === "Tab" || (e.key === "ArrowRight" && isAtEnd()))) {
      e.preventDefault();
      acceptSuggestion();
    }
    if (e.key === "Escape") {
      setSuggestion("");
    }
  };

  const isAtEnd = () => {
    if (!textareaRef.current) return false;
    return textareaRef.current.selectionStart === value.length;
  };

  // Clear suggestion when field loses focus
  const handleBlur = (e) => {
    setTimeout(() => setSuggestion(""), 200);
    if (onBlur) onBlur(e);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.alive = false;
    };
  }, []);

  if (!promptFn) {
    // Fallback: render plain textarea if field not supported
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={minRows}
        className={className}
      />
    );
  }

  return (
    <div className="relative">
      {/* Real textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={minRows}
        className={className}
      />

      {/* Ghost suggestion shown as a preview block below */}
      {suggestion && (
        <div className="mt-1 px-3 py-2 rounded-md border border-dashed border-indigo-200 bg-indigo-50 text-sm text-slate-500 leading-relaxed">
          <span className="text-indigo-400 font-medium text-xs mr-1.5">↳ AI suggestion:</span>
          <span className="italic">{suggestion}</span>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between mt-1 px-0.5">
        <div className="flex items-center gap-1.5">
          {suggestion && !loading && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Press <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-xs font-mono">Tab</kbd> to accept</span>
              <button
                onClick={() => setSuggestion("")}
                className="ml-1 text-slate-300 hover:text-slate-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {loading && (
            <span className="flex items-center gap-1 text-xs text-slate-300">
              <Sparkles className="w-3 h-3 text-indigo-300 animate-pulse" />
              AI thinking...
            </span>
          )}
        </div>
        <button
          onClick={() => { setAiEnabled(e => !e); setSuggestion(""); }}
          className={`text-xs flex items-center gap-1 transition-colors ${aiEnabled ? "text-indigo-400 hover:text-indigo-600" : "text-slate-300 hover:text-slate-500"}`}
          title={aiEnabled ? "Disable AI completions" : "Enable AI completions"}
        >
          <Sparkles className="w-3 h-3" />
          {aiEnabled ? "AI on" : "AI off"}
        </button>
      </div>
    </div>
  );
}