import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Unlink2, Check } from "lucide-react";

export default function ImagingFindingsLinker({ findings, onLinkFindings }) {
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [linkedFindings, setLinkedFindings] = useState({});
  const [linkingMode, setLinkingMode] = useState(false);

  const sections = [
    { id: "assessment", name: "Assessment", color: "blue" },
    { id: "plan", name: "Plan", color: "purple" },
    { id: "history_of_present_illness", name: "History of Present Illness", color: "slate" },
  ];

  const handleLinkToSection = (findingIndex, sectionId) => {
    const key = `finding_${findingIndex}`;
    setLinkedFindings((prev) => {
      const current = prev[key] || [];
      if (current.includes(sectionId)) {
        return { ...prev, [key]: current.filter((s) => s !== sectionId) };
      } else {
        return { ...prev, [key]: [...current, sectionId] };
      }
    });
  };

  const handleApplyLinks = () => {
    onLinkFindings(linkedFindings);
    setLinkingMode(false);
    setLinkedFindings({});
    setSelectedFinding(null);
  };

  if (!findings || findings.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-600" />
          Link Findings to Note Sections
        </h3>
        {linkingMode && (
          <button
            onClick={() => {
              setLinkingMode(false);
              setSelectedFinding(null);
              setLinkedFindings({});
            }}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        )}
      </div>

      {!linkingMode ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 mb-3">
            Click on a finding to link it to specific sections of your clinical note
          </p>
          {findings.map((finding, idx) => {
            const isLinked = Object.keys(linkedFindings).some(
              (key) => key === `finding_${idx}` && linkedFindings[key].length > 0
            );
            return (
              <button
                key={idx}
                onClick={() => setLinkingMode(true)}
                className="w-full text-left p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-slate-700 flex-1">{finding}</span>
                  {isLinked && <Badge className="text-xs bg-green-100 text-green-700">Linked</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Select Findings</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {findings.map((finding, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFinding?.includes(idx) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFinding([...(selectedFinding || []), idx]);
                      } else {
                        setSelectedFinding(selectedFinding?.filter((i) => i !== idx) || []);
                      }
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">{finding}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedFinding && selectedFinding.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Link to Sections</p>
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      selectedFinding.forEach((idx) => {
                        handleLinkToSection(idx, section.id);
                      });
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedFinding.some((idx) =>
                        linkedFindings[`finding_${idx}`]?.includes(section.id)
                      )
                        ? `border-${section.color}-400 bg-${section.color}-50`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium text-${section.color}-900`}>
                        {section.name}
                      </span>
                      {selectedFinding.some((idx) =>
                        linkedFindings[`finding_${idx}`]?.includes(section.id)
                      ) && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setLinkingMode(false);
                setSelectedFinding(null);
              }}
              variant="outline"
              className="flex-1 rounded-lg border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyLinks}
              disabled={
                !selectedFinding ||
                selectedFinding.length === 0 ||
                !Object.values(linkedFindings).some((links) => links.length > 0)
              }
              className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Check className="w-4 h-4" /> Apply Links
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}