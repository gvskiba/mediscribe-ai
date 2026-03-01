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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filtered = TEMPLATES_DATA.filter(
    (t) => t.noteType === selectedNoteType && t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 flex flex-col h-full">
      <h3 className="text-xs font-semibold text-[#e8f4ff] mb-2">🗂️ Templates</h3>
      
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-[#4a7299]" />
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#c8ddf0] placeholder-[#2a4d72]"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-[#4a7299] cursor-pointer">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
            className="w-3 h-3"
          />
          ⭐ Favorites
        </label>
      </div>

      <div className="space-y-1 overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-[#2a4d72] text-center py-4">No templates found</p>
        ) : (
          filtered.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onSelect(tmpl.id)}
              className="w-full text-left p-2 rounded border border-[#1e3a5f] hover:border-[#2a4d72] bg-[#0b1d35] transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#e8f4ff]">{tmpl.name}</p>
                  <p className="text-xs text-[#4a7299]">{tmpl.specialty}</p>
                </div>
                {tmpl.isDefault && <span className="text-xs text-[#00d4bc]">⭐</span>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}