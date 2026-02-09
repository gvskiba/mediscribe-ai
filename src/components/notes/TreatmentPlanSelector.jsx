import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sectionConfig = [
  { key: "labs", label: "Labs", icon: "🧪", color: "blue" },
  { key: "medications", label: "Medications", icon: "💊", color: "green" },
  { key: "interventions", label: "Interventions", icon: "⚕️", color: "purple" }
];

const colorClasses = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200"
};

export default function TreatmentPlanSelector({ plan, onAddToNote }) {
  const [selectedSections, setSelectedSections] = useState({});
  const [parsedPlan, setParsedPlan] = useState(null);

  React.useEffect(() => {
    // Parse the plan by sections
    if (plan) {
      const sections = {
        headline: "",
        summary: "",
        labs: "",
        medications: "",
        interventions: "",
        references: ""
      };

      const lines = plan.split("\n");
      let currentSection = "headline";
      let content = [];

      lines.forEach((line) => {
        const trimmed = line.trim();

        if (trimmed === "LABS") currentSection = "labs";
        else if (trimmed === "MEDICATIONS") currentSection = "medications";
        else if (trimmed === "INTERVENTIONS") currentSection = "interventions";
        else if (trimmed === "REFERENCES") currentSection = "references";
        else if (trimmed) {
          content.push(line);
        } else if (content.length > 0 && !trimmed) {
          if (currentSection === "headline" && sections.headline === "") {
            sections.headline = content.join("\n").trim();
            content = [];
          } else if (currentSection === "headline") {
            currentSection = "summary";
            sections.summary = content.join("\n").trim();
            content = [];
          } else if (sections[currentSection] === "") {
            sections[currentSection] = content.join("\n").trim();
            content = [];
          }
        }
      });

      // Handle last content
      if (content.length > 0) {
        if (sections[currentSection] === "") {
          sections[currentSection] = content.join("\n").trim();
        } else {
          sections[currentSection] += "\n" + content.join("\n").trim();
        }
      }

      setParsedPlan(sections);
      // Initialize all sections as selected
      setSelectedSections({
        labs: !!sections.labs,
        medications: !!sections.medications,
        interventions: !!sections.interventions
      });
    }
  }, [plan]);

  const handleToggle = (section) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddSelected = () => {
    if (!parsedPlan) return;

    let selectedText = parsedPlan.headline;
    
    if (parsedPlan.summary) {
      selectedText += `\n\n${parsedPlan.summary}`;
    }

    sectionConfig.forEach(({ key }) => {
      if (selectedSections[key] && parsedPlan[key]) {
        selectedText += `\n\n${key.toUpperCase()}\n${parsedPlan[key]}`;
      }
    });

    if (parsedPlan.references) {
      selectedText += `\n\nREFERENCES\n${parsedPlan.references}`;
    }

    onAddToNote(selectedText);
  };

  if (!parsedPlan) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Treatment Plan Sections</h3>
        <p className="text-sm text-slate-600">Select which sections to include in your plan</p>
      </div>

      <div className="space-y-3 mb-6">
        <AnimatePresence>
          {sectionConfig.map(({ key, label, icon, color }) => {
            const hasContent = !!parsedPlan[key];
            const isSelected = selectedSections[key];

            if (!hasContent) return null;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
              >
                <button
                  onClick={() => handleToggle(key)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `${colorClasses[color]} border-${color}-300 shadow-sm`
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center bg-white">
                        {isSelected && <Check className="w-3 h-3 text-slate-900" />}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{icon}</span>
                        <h4 className="font-semibold text-slate-900">{label}</h4>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {parsedPlan[key]}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Button
        onClick={handleAddSelected}
        disabled={!Object.values(selectedSections).some(v => v)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Selected Sections to Plan
      </Button>
    </motion.div>
  );
}