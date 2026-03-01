import React from "react";

const NOTE_TYPES = [
  { id: "history_physical", label: "History & Physical", short: "H&P", icon: "📋", color: "teal" },
  { id: "progress_note", label: "Progress Note", short: "SOAP", icon: "📝", color: "purple" },
  { id: "discharge_summary", label: "Discharge Summary", short: "DS", icon: "🏠", color: "green" },
  { id: "consultation", label: "Consultation", short: "CONSULT", icon: "🔍", color: "amber" },
  { id: "procedure_note", label: "Procedure Note", short: "PROC", icon: "🔧", color: "rose" },
  { id: "critical_care", label: "Critical Care Note", short: "ICU", icon: "🚨", color: "red" },
  { id: "ama", label: "Left Against Medical Advice", short: "AMA", icon: "⚠️", color: "gold" },
];

export default function NoteTypePanel({ selectedType, onSelect }) {
  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 flex flex-col">
      <h3 className="text-xs font-semibold text-[#e8f4ff] mb-3">📄 Note Type</h3>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
        {NOTE_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`p-2 rounded-lg border transition-all text-center ${
              selectedType === type.id
                ? "border-[#00d4bc] bg-[#162d4f]"
                : "border-[#1e3a5f] bg-[#0b1d35] hover:border-[#2a4d72]"
            }`}
          >
            <div className="text-lg mb-1">{type.icon}</div>
            <div className="text-xs font-semibold text-[#e8f4ff]">{type.short}</div>
            <div className="text-xs text-[#4a7299]">{type.label.split(" ")[0]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}