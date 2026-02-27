import React, { useState } from "react";
import { Sparkles, Loader2, BookOpen, ChevronDown, ChevronUp, MessageCircle, AlertTriangle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DiagnosisEducationPanel({ diagnosis, patientName }) {
  const [loading, setLoading] = useState(false);
  const [education, setEducation] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create brief, patient-friendly education for: "${diagnosis}"
Patient: ${patientName || "the patient"}

Use simple everyday language (5th-grade reading level). Be concise.`,
        response_json_schema: {
          type: "object",
          properties: {
            what_is_it: { type: "string" },
            self_care: { type: "array", items: { type: "string" } },
            red_flags: { type: "array", items: { type: "string" } },
            questions_for_doctor: { type: "array", items: { type: "string" } }
          }
        }
      });
      setEducation(result);
      setExpanded(true);
      toast.success("Education generated");
    } catch {
      toast.error("Failed to generate education");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-1.5">
      {!education ? (
        <Button
          size="sm"
          variant="outline"
          onClick={generate}
          disabled={loading}
          className="h-6 px-2 text-xs text-teal-700 border-teal-200 hover:bg-teal-50 gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
          {loading ? "Generating..." : "Patient Education"}
        </Button>
      ) : (
        <div className="border border-teal-200 rounded-lg bg-teal-50 overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Patient Education
            </div>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {expanded && (
            <div className="px-3 pb-3 space-y-2 text-xs">
              {education.what_is_it && (
                <p className="text-slate-700 leading-relaxed">{education.what_is_it}</p>
              )}

              {education.self_care?.length > 0 && (
                <div>
                  <p className="font-semibold text-teal-800 flex items-center gap-1 mb-1">
                    <Heart className="w-3 h-3" /> Self-Care
                  </p>
                  <ul className="space-y-0.5">
                    {education.self_care.map((item, i) => (
                      <li key={i} className="flex gap-1.5 text-slate-700"><span className="text-teal-500 flex-shrink-0">•</span>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {education.red_flags?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-md px-2.5 py-2">
                  <p className="font-semibold text-red-800 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3" /> When to Seek Help
                  </p>
                  <ul className="space-y-0.5">
                    {education.red_flags.map((flag, i) => (
                      <li key={i} className="text-red-700">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {education.questions_for_doctor?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-md px-2.5 py-2">
                  <p className="font-semibold text-blue-800 flex items-center gap-1 mb-1">
                    <MessageCircle className="w-3 h-3" /> Questions to Ask Your Doctor
                  </p>
                  <ul className="space-y-0.5">
                    {education.questions_for_doctor.map((q, i) => (
                      <li key={i} className="text-blue-700 flex gap-1"><span className="flex-shrink-0">?</span>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEducation(null); setExpanded(false); }}
                className="h-5 px-2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}