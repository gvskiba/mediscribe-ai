import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const NOTE_SECTIONS = {
  history_physical: [
    { key: "chief_complaint", title: "Chief Complaint", icon: "💬", noteField: "chief_complaint" },
    { key: "hpi", title: "History of Present Illness", icon: "📖", noteField: "history_of_present_illness" },
    { key: "ros", title: "Review of Systems", icon: "🔍", noteField: "review_of_systems" },
    { key: "past_medical_hx", title: "Past Medical History", icon: "📂", noteField: "medical_history" },
    { key: "medications", title: "Medications", icon: "💊", noteField: null },
    { key: "allergies", title: "Allergies", icon: "⚠️", noteField: null },
    { key: "physical_exam", title: "Physical Examination", icon: "🩺", noteField: "physical_exam" },
    { key: "assessment_plan", title: "Assessment & Plan", icon: "🧠", noteField: "assessment" },
    { key: "mdm", title: "Medical Decision Making", icon: "⚖️", noteField: "mdm" },
  ],
  progress_note: [
    { key: "subjective", title: "Subjective", icon: "💬", noteField: "history_of_present_illness" },
    { key: "objective", title: "Objective", icon: "📊", noteField: "physical_exam" },
    { key: "assessment", title: "Assessment", icon: "🧠", noteField: "assessment" },
    { key: "plan", title: "Plan", icon: "📋", noteField: "plan" },
  ],
  discharge_summary: [
    { key: "final_impression", title: "Final Impression", icon: "🧠", noteField: "clinical_impression" },
    { key: "hospital_course", title: "Hospital Course", icon: "🏥", noteField: "summary" },
    { key: "discharge_meds", title: "Discharge Medications", icon: "💊", noteField: null },
    { key: "follow_up", title: "Follow-Up Plan", icon: "📅", noteField: "plan" },
    { key: "instructions", title: "Patient Instructions", icon: "📋", noteField: "discharge_summary" },
  ],
  consultation: [
    { key: "reason", title: "Reason for Consult", icon: "🔍", noteField: "chief_complaint" },
    { key: "hpi", title: "History of Present Illness", icon: "📖", noteField: "history_of_present_illness" },
    { key: "exam", title: "Physical Exam", icon: "🩺", noteField: "physical_exam" },
    { key: "assessment", title: "Assessment", icon: "🧠", noteField: "assessment" },
    { key: "recommendations", title: "Recommendations", icon: "📋", noteField: "plan" },
  ],
  procedure_note: [
    { key: "indication", title: "Indication", icon: "🔍", noteField: "chief_complaint" },
    { key: "technique", title: "Technique", icon: "🔧", noteField: null },
    { key: "findings", title: "Findings", icon: "📊", noteField: null },
    { key: "complications", title: "Complications", icon: "⚠️", noteField: null },
    { key: "plan", title: "Post-Procedure Plan", icon: "📋", noteField: "plan" },
  ],
  critical_care: [
    { key: "events", title: "24h Events", icon: "📋", noteField: "history_of_present_illness" },
    { key: "exam", title: "Physical Exam", icon: "🩺", noteField: "physical_exam" },
    { key: "labs", title: "Labs & Data", icon: "🧪", noteField: null },
    { key: "assessment", title: "Assessment", icon: "🧠", noteField: "assessment" },
    { key: "plan", title: "Plan", icon: "📋", noteField: "plan" },
    { key: "mdm", title: "MDM", icon: "⚖️", noteField: "mdm" },
  ],
  ama: [
    { key: "reason", title: "Patient's Stated Reason", icon: "💬", noteField: null },
    { key: "risks", title: "Risks Explained", icon: "⚠️", noteField: null },
    { key: "capacity", title: "Decision-Making Capacity", icon: "🧠", noteField: null },
    { key: "instructions", title: "Return Instructions", icon: "📋", noteField: null },
  ],
};

const WORKFLOW_STEPS = [
  { step: 1, label: "Choose a", sublabel: "Note Type", description: "Select the type of clinical note you need" },
  { step: 2, label: "Select a", sublabel: "Template", description: "Pick a template matching your specialty" },
  { step: 3, label: "Review &", sublabel: "Edit Sections", description: "Add content or use AI to generate" },
  { step: 4, label: "Sign &", sublabel: "Finalize", description: "Complete and sign the note" },
];

export default function ClinicalNotePreview({ note, noteId, queryClient, selectedNoteType, selectedTemplate }) {
  const [sections, setSections] = useState([]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingSection, setGeneratingSection] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  useEffect(() => {
    const templateSections = NOTE_SECTIONS[selectedNoteType] || [];
    setSections(templateSections.map((s) => ({
      ...s,
      content: s.noteField && note?.[s.noteField]
        ? (Array.isArray(note[s.noteField]) ? note[s.noteField].join(", ") : note[s.noteField])
        : "",
    })));
    setFinalized(false);
  }, [selectedNoteType, selectedTemplate]);

  const handleUpdateContent = (key, content) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, content } : s)));
  };

  const handleRepullAll = () => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        content:
          s.noteField && note?.[s.noteField]
            ? Array.isArray(note[s.noteField])
              ? note[s.noteField].join(", ")
              : note[s.noteField]
            : s.content,
      }))
    );
    toast.success("Re-pulled data from note fields");
  };

  const handleAIGenerateSection = async (sectionKey) => {
    const section = sections.find((s) => s.key === sectionKey);
    if (!section) return;
    setGeneratingSection(sectionKey);
    try {
      const context = `
Patient: ${note?.patient_name || "Unknown"}, ${note?.patient_age || ""} ${note?.patient_gender || ""}
Chief Complaint: ${note?.chief_complaint || "N/A"}
Diagnoses: ${note?.diagnoses?.join(", ") || "N/A"}
Medications: ${note?.medications?.join(", ") || "N/A"}
Assessment: ${note?.assessment || "N/A"}
Plan: ${note?.plan || "N/A"}
HPI: ${note?.history_of_present_illness || "N/A"}
Physical Exam: ${note?.physical_exam || "N/A"}
      `.trim();

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write the "${section.title}" section for a clinical note of type "${selectedNoteType}".
Be concise, professional, and clinically accurate. Use third-person, past tense where appropriate.

Clinical context:
${context}

Write ONLY the section content, no headers or labels.`,
      });

      const text = typeof result === "string" ? result : result?.text || "";
      handleUpdateContent(sectionKey, text);
      toast.success(`${section.title} generated`);
    } catch {
      toast.error("AI generation failed");
    } finally {
      setGeneratingSection(null);
    }
  };

  const handleAIDraftAll = async () => {
    if (!sections.length) return;
    setGeneratingAll(true);
    try {
      for (const section of sections) {
        if (!section.content.trim()) {
          await handleAIGenerateSection(section.key);
        }
      }
      toast.success("All empty sections drafted");
    } catch {
      toast.error("AI draft failed");
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleSignFinalize = async () => {
    if (!noteId) { toast.error("No note ID"); return; }
    setFinalizing(true);
    try {
      await base44.entities.ClinicalNote.update(noteId, { status: "finalized" });
      queryClient?.invalidateQueries({ queryKey: ["note", noteId] });
      setFinalized(true);
      toast.success("Note finalized and signed");
    } catch {
      toast.error("Failed to finalize note");
    } finally {
      setFinalizing(false);
    }
  };

  const requiredSections = sections.filter((s) => s.content.trim()).length;
  const completionPct = sections.length ? Math.round((requiredSections / sections.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#050f1e] rounded-lg border border-[#1e3a5f] overflow-hidden" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div className="sticky top-0 px-4 py-3 border-b border-[#1e3a5f] bg-[#0b1d35] z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00d4bc]" />
            <h2 className="text-xs font-bold text-[#e8f4ff] uppercase tracking-wider">Clinical Note Preview</h2>
          </div>
          {selectedNoteType && selectedTemplate && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRepullAll}
                className="px-3 py-1.5 text-xs font-medium text-[#00d4bc] border border-[#1e3a5f] rounded hover:border-[#00d4bc] transition-colors"
              >
                ↺ Re-pull All
              </button>
              <button
                onClick={handleAIDraftAll}
                disabled={generatingAll}
                className="px-3 py-1.5 text-xs font-medium text-[#a78bfa] border border-[#1e3a5f] rounded hover:border-[#a78bfa] transition-colors flex items-center gap-1"
              >
                {generatingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                ✦ AI Draft All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ overflowY: "auto" }}>
        {!selectedNoteType || !selectedTemplate ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="text-6xl">✒️</div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-[#e8f4ff]">No Note Loaded</h3>
              <p className="text-sm text-[#4a7299] max-w-sm">
                Select a Note Type and Template on the left to begin composing your clinical note. Data will be pulled from other pages of this encounter automatically.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-8">
              {WORKFLOW_STEPS.map((ws) => (
                <div key={ws.step} className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-4 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[#00d4bc] flex items-center justify-center mx-auto">
                    <span className="text-xs font-bold text-[#00d4bc]">{ws.step}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#e8f4ff]">{ws.label} <br /> {ws.sublabel}</p>
                  <p className="text-xs text-[#2a4d72]">{ws.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#4a7299]">{completionPct}% Complete</span>
            </div>
            <div className="w-full bg-[#162d4f] rounded-full h-1.5 mb-4">
              <div className="bg-[#00d4bc] h-full rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            {sections.map((section) => (
              <div key={section.key} className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3a5f] bg-[#0b1d35]">
                  <h3 className="text-xs font-semibold text-[#e8f4ff]">{section.icon} {section.title}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAIGenerateSection(section.key)}
                      disabled={generatingSection === section.key}
                      className="p-1 hover:bg-[#162d4f] rounded text-[#00d4bc] text-xs"
                      title="AI Generate"
                    >
                      {generatingSection === section.key
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Sparkles className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleUpdateContent(section.key, "")}
                      className="p-1 hover:bg-[#162d4f] rounded text-[#ff5c6c] text-xs"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <textarea
                    value={section.content}
                    onChange={(e) => handleUpdateContent(section.key, e.target.value)}
                    placeholder={`Enter ${section.title.toLowerCase()}…`}
                    className="w-full min-h-24 p-2 bg-[#162d4f] border border-[#1e3a5f] rounded text-xs text-[#c8ddf0] placeholder-[#2a4d72] resize-none focus:border-[#00d4bc] outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-4 py-3 border-t border-[#1e3a5f] bg-[#0b1d35] flex items-center justify-between">
        <span className="text-xs text-[#4a7299]">{requiredSections} of {sections.length} sections filled</span>
        <button
          onClick={handleSignFinalize}
          disabled={finalizing || finalized || !selectedNoteType}
          className="px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition-all"
          style={{
            background: finalized ? "rgba(46,204,113,0.15)" : "#00d4bc",
            color: finalized ? "#2ecc71" : "#050f1e",
            border: finalized ? "1px solid rgba(46,204,113,0.3)" : "none",
            cursor: finalizing || !selectedNoteType ? "not-allowed" : "pointer",
            opacity: !selectedNoteType ? 0.5 : 1,
          }}
        >
          {finalizing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : finalized ? (
            <Check className="w-3 h-3" />
          ) : null}
          {finalized ? "Finalized" : "✍️ Sign & Finalize"}
        </button>
      </div>
    </div>
  );
}