import React, { useState, useEffect } from "react";
import { Sparkles, RotateCw, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const NOTE_SECTIONS = {
  history_physical: [
    { key: "chief_complaint", title: "Chief Complaint", icon: "💬" },
    { key: "hpi", title: "History of Present Illness", icon: "📖" },
    { key: "ros", title: "Review of Systems", icon: "🔍" },
    { key: "past_medical_hx", title: "Past Medical History", icon: "📂" },
    { key: "medications", title: "Medications", icon: "💊" },
    { key: "allergies", title: "Allergies", icon: "⚠️" },
    { key: "physical_exam", title: "Physical Examination", icon: "🩺" },
    { key: "assessment_plan", title: "Assessment & Plan", icon: "🧠" },
    { key: "mdm", title: "Medical Decision Making", icon: "⚖️" },
  ],
  progress_note: [
    { key: "subjective", title: "Subjective", icon: "💬" },
    { key: "objective", title: "Objective", icon: "📊" },
    { key: "assessment", title: "Assessment", icon: "🧠" },
    { key: "plan", title: "Plan", icon: "📋" },
  ],
  discharge_summary: [
    { key: "final_impression", title: "Final Impression", icon: "🧠" },
    { key: "hospital_course", title: "Hospital Course", icon: "🏥" },
    { key: "discharge_meds", title: "Discharge Medications", icon: "💊" },
    { key: "follow_up", title: "Follow-Up Plan", icon: "📅" },
    { key: "instructions", title: "Patient Instructions", icon: "📋" },
  ],
};

export default function ClinicalNotePreview({ note, selectedNoteType, selectedTemplate }) {
  const [sections, setSections] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const templateSections = NOTE_SECTIONS[selectedNoteType] || [];
    setSections(templateSections.map((s) => ({ ...s, content: "" })));
  }, [selectedNoteType]);

  const handleUpdateContent = (id, content) => {
    setSections((prev) => prev.map((s) => (s.key === id ? { ...s, content } : s)));
  };

  const handleAIGenerate = (sectionKey) => {
    toast.info("AI section generation coming soon");
  };

  const requiredSections = sections.filter((s) => s.content.trim()).length;
  const completionPct = Math.round((requiredSections / sections.length) * 100);

  return (
    <div className="flex flex-col h-full bg-[#050f1e] rounded-lg border border-[#1e3a5f] overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 px-4 py-3 border-b border-[#1e3a5f] bg-[#0b1d35] z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-[#e8f4ff]">📋 Clinical Note</h2>
          <span className="text-xs text-[#4a7299]">{completionPct}% Complete</span>
        </div>
        <div className="w-full bg-[#162d4f] rounded-full h-1.5">
          <div className="bg-[#00d4bc] h-full rounded-full transition-all" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!selectedNoteType ? (
          <p className="text-xs text-[#2a4d72] text-center py-8">Select a Note Type to begin</p>
        ) : (
          sections.map((section) => (
            <div key={section.key} className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3a5f] bg-[#0b1d35]">
                <h3 className="text-xs font-semibold text-[#e8f4ff]">
                  {section.icon} {section.title}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAIGenerate(section.key)}
                    className="p-1 hover:bg-[#162d4f] rounded text-[#00d4bc] text-xs"
                    title="AI Generate"
                  >
                    <Sparkles className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleUpdateContent(section.key, "")}
                    className="p-1 hover:bg-[#162d4f] rounded text-[#ff5c6c] text-xs"
                    title="Clear"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <textarea
                  value={section.content}
                  onChange={(e) => handleUpdateContent(section.key, e.target.value)}
                  placeholder={`Enter ${section.title.toLowerCase()}…`}
                  className="w-full min-h-24 p-2 bg-[#162d4f] border border-[#1e3a5f] rounded text-xs text-[#c8ddf0] placeholder-[#2a4d72] resize-none focus:border-[#00d4bc]"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-4 py-3 border-t border-[#1e3a5f] bg-[#0b1d35] flex items-center justify-between">
        <span className="text-xs text-[#4a7299]">{requiredSections} of {sections.length} sections</span>
        <button className="px-3 py-1.5 text-xs font-medium bg-[#00d4bc] text-[#050f1e] rounded hover:bg-[#00a896]">
          ✍️ Sign & Finalize
        </button>
      </div>
    </div>
  );
}