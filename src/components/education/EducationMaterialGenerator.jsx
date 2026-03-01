import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const LANGUAGES = ["English", "Spanish", "French", "Chinese", "Arabic", "Portuguese"];

export default function EducationMaterialGenerator({ initialDiagnosis = "", initialPlan = "", patientName = "", noteId = "", onGenerated }) {
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
  const [plan, setPlan] = useState(initialPlan);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!diagnosis.trim()) { toast.error("Please enter a diagnosis"); return; }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate patient education material in ${language} for the following diagnosis and treatment plan. Write in simple, clear language at a 6th-grade reading level. Avoid medical jargon.

Diagnosis: ${diagnosis}
Treatment Plan: ${plan || "Standard care"}
${patientName ? `Patient Name: ${patientName}` : ""}

Return JSON with these keys:
- what_is_it: 2-3 sentence plain-language explanation
- symptoms: array of 4-6 symptoms to watch for (strings)
- causes: array of 3-5 common causes (strings)
- treatment: array of 4-6 treatment steps (strings)
- medications: array of medication notes if applicable (strings), empty array if none
- lifestyle: array of 4-5 lifestyle/self-care tips (strings)
- when_to_call: array of 4-5 red flag symptoms requiring immediate care (strings)
- follow_up: 1-2 sentence follow-up guidance

All text must be in ${language}.`,
        response_json_schema: {
          type: "object",
          properties: {
            what_is_it: { type: "string" },
            symptoms: { type: "array", items: { type: "string" } },
            causes: { type: "array", items: { type: "string" } },
            treatment: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            lifestyle: { type: "array", items: { type: "string" } },
            when_to_call: { type: "array", items: { type: "string" } },
            follow_up: { type: "string" }
          }
        }
      });

      const material = {
        title: `${diagnosis} — Patient Guide`,
        diagnosis,
        language,
        sections: result,
        tags: [diagnosis.split(" ")[0].toLowerCase()],
        note_id: noteId || "",
        patient_name: patientName || ""
      };

      const saved = await base44.entities.PatientEducationMaterial.create(material);
      toast.success("Education material generated and saved!");
      if (onGenerated) onGenerated(saved);
    } catch (e) {
      toast.error("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Diagnosis / Condition</label>
          <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Type 2 Diabetes, Hypertension..." />
        </div>
        <div style={{ width: 170 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Language</label>
          <div style={{ position: "relative" }}>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{ width: "100%", padding: "8px 32px 8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", fontSize: 13, color: "#1e293b", appearance: "none", outline: "none", cursor: "pointer" }}
            >
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            <Globe size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Treatment Plan (optional)</label>
        <textarea
          value={plan}
          onChange={e => setPlan(e.target.value)}
          placeholder="Paste treatment plan or medications for more personalized content..."
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#1e293b", minHeight: 70, resize: "none", outline: "none", fontFamily: "sans-serif", boxSizing: "border-box" }}
        />
      </div>

      <Button onClick={generate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 self-start">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate Education Material</>}
      </Button>
    </div>
  );
}