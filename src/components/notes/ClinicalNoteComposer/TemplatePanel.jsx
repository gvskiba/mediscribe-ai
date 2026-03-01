import React, { useState } from "react";
import { Search, Star } from "lucide-react";

const TEMPLATES_DATA = [
  { id: "tmpl-er-hp-001", name: "ER H&P", noteType: "history_physical", specialty: "Emergency Medicine", usageCount: 4821, isDefault: true },
  { id: "tmpl-im-hp-001", name: "Internal Medicine H&P", noteType: "history_physical", specialty: "Internal Medicine", usageCount: 3210 },
  { id: "tmpl-cards-hp-001", name: "Cardiology H&P", noteType: "history_physical", specialty: "Cardiology", usageCount: 1870 },
  { id: "tmpl-soap-daily-001", name: "Daily SOAP", noteType: "progress_note", specialty: "General", usageCount: 9104, isDefault: true },
  { id: "tmpl-soap-icu-001", name: "ICU SOAP", noteType: "progress_note", specialty: "Critical Care", usageCount: 2230 },
  { id: "tmpl-ds-er-001", name: "ER Discharge Summary", noteType: "discharge_summary", specialty: "Emergency Medicine", usageCount: 3991, isDefault: true },
  { id: "tmpl-consult-gen-001", name: "General Consultation", noteType: "consultation", specialty: "General", usageCount: 1540, isDefault: true },
  { id: "tmpl-proc-lp-001", name: "Lumbar Puncture", noteType: "procedure_note", specialty: "Emergency Medicine", usageCount: 410 },
  { id: "tmpl-cc-001", name: "Critical Care Note", noteType: "critical_care", specialty: "Critical Care", usageCount: 1123, isDefault: true },
  { id: "tmpl-ama-001", name: "AMA Departure", noteType: "ama", specialty: "Emergency Medicine", usageCount: 294, isDefault: true },
];

export default function TemplatePanel({ selectedNoteType, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");

  const uniqueSpecialties = ["All Specialties", ...new Set(TEMPLATES_DATA.map(t => t.specialty))];
  
  const filtered = TEMPLATES_DATA.filter((t) => {
    const matchesType = !selectedNoteType || t.noteType === selectedNoteType;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === "All Specialties" || t.specialty === specialtyFilter;
    return matchesType && matchesSearch && matchesSpecialty;
  });

  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗂️</span>
          <h3 className="text-xs font-bold text-[#e8f4ff] uppercase tracking-wider">Template Library</h3>
        </div>
        <button className="px-3 py-1.5 text-xs font-medium text-[#a78bfa] border border-[#1e3a5f] rounded-lg hover:border-[#a78bfa] transition-colors">
          + Section
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[#1e3a5f] space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#4a7299]" />
          <input
            type="text"
            placeholder="Search templates…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded-lg text-[#c8ddf0] placeholder-[#2a4d72] focus:border-[#00d4bc]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded-lg text-[#c8ddf0] focus:border-[#00d4bc]"
          >
            {uniqueSpecialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto" style={{ overflowY: "auto" }}>
        <div className="p-3 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-[#2a4d72] text-center py-8">No templates found</p>
          ) : (
            filtered.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => onSelect(tmpl.id)}
                className="w-full text-left p-3 rounded-lg border border-[#1e3a5f] bg-[#0b1d35] hover:border-[#2a4d72] hover:bg-[#162d4f] transition-all"
              >
                {/* Title and Star */}
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold text-[#e8f4ff] flex-1">{tmpl.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle favorite toggle
                    }}
                    className="ml-2 text-lg hover:scale-110 transition-transform"
                  >
                    ⭐
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 mb-2 text-xs">
                  <span className="text-[#00d4bc] font-medium">{tmpl.specialty}</span>
                  {tmpl.isDefault && (
                    <span className="text-[#fbbf24]">Default</span>
                  )}
                  <span className="text-[#4a7299]">{tmpl.sectionCount} sections</span>
                  <span className="text-[#4a7299]">{(tmpl.usageCount / 1000).toFixed(1)}k uses</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {tmpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs text-[#4a7299] border border-[#1e3a5f] rounded bg-[#162d4f]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}