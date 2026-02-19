import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Eye, 
  Heart, 
  Wind, 
  User, 
  Brain,
  Plus,
  X,
  Settings,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const DEFAULT_SECTIONS = [
  { id: "general", label: "General Appearance", icon: User, defaultText: "Well-developed, well-nourished, in no acute distress" },
  { id: "heent", label: "HEENT", icon: Eye, defaultText: "Normocephalic, atraumatic. PERRLA. EOMI. TMs clear bilaterally. Oropharynx clear without lesions" },
  { id: "neck", label: "Neck", icon: User, defaultText: "Supple, no JVD, no lymphadenopathy, no thyromegaly" },
  { id: "cardiovascular", label: "Cardiovascular", icon: Heart, defaultText: "Regular rate and rhythm, normal S1/S2, no murmurs/rubs/gallops" },
  { id: "respiratory", label: "Respiratory", icon: Wind, defaultText: "Clear to auscultation bilaterally, no wheezes/rales/rhonchi, good air movement" },
  { id: "abdomen", label: "Abdomen", icon: User, defaultText: "Soft, non-tender, non-distended, normoactive bowel sounds, no organomegaly" },
  { id: "musculoskeletal", label: "Musculoskeletal", icon: Activity, defaultText: "Full range of motion, no deformities, no tenderness, normal gait" },
  { id: "neurological", label: "Neurological", icon: Brain, defaultText: "Alert and oriented x3, cranial nerves II-XII intact, normal strength and sensation, normal reflexes" },
  { id: "skin", label: "Skin", icon: User, defaultText: "Warm, dry, no rashes, no lesions, good capillary refill" },
  { id: "psychiatric", label: "Psychiatric", icon: Brain, defaultText: "Appropriate mood and affect, normal thought process and content" }
];

export default function PhysicalExamEditor({ examData, onUpdate, onAddToNote }) {
  const [sections, setSections] = useState(() => {
    if (examData && typeof examData === 'object' && !Array.isArray(examData)) {
      return Object.keys(examData).map(key => ({
        id: key,
        label: DEFAULT_SECTIONS.find(s => s.id === key)?.label || key,
        icon: DEFAULT_SECTIONS.find(s => s.id === key)?.icon || User,
        content: examData[key],
        enabled: true
      }));
    }
    return DEFAULT_SECTIONS.map(s => ({
      ...s,
      content: s.defaultText,
      enabled: true
    }));
  });

  const [editingSection, setEditingSection] = useState(null);
  const [customizing, setCustomizing] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleUpdateSection = (sectionId, content) => {
    const updatedSections = sections.map(s => 
      s.id === sectionId ? { ...s, content } : s
    );
    setSections(updatedSections);
    
    const examObj = {};
    updatedSections.filter(s => s.enabled).forEach(s => {
      examObj[s.id] = s.content;
    });
    onUpdate(examObj);
  };

  const toggleSectionEnabled = (sectionId) => {
    const updatedSections = sections.map(s => 
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    setSections(updatedSections);
    
    const examObj = {};
    updatedSections.filter(s => s.enabled).forEach(s => {
      examObj[s.id] = s.content;
    });
    onUpdate(examObj);
  };

  const addCustomSection = () => {
    const newId = `custom_${Date.now()}`;
    const newSection = {
      id: newId,
      label: "Custom Section",
      icon: User,
      content: "",
      enabled: true,
      isCustom: true
    };
    setSections([...sections, newSection]);
    setEditingSection(newId);
  };

  const removeCustomSection = (sectionId) => {
    const updatedSections = sections.filter(s => s.id !== sectionId);
    setSections(updatedSections);
    
    const examObj = {};
    updatedSections.filter(s => s.enabled).forEach(s => {
      examObj[s.id] = s.content;
    });
    onUpdate(examObj);
  };

  const updateSectionLabel = (sectionId, newLabel) => {
    const updatedSections = sections.map(s => 
      s.id === sectionId ? { ...s, label: newLabel } : s
    );
    setSections(updatedSections);
  };

  const formatForNote = () => {
    let examText = "\n\nPHYSICAL EXAMINATION\n";
    examText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    sections.filter(s => s.enabled && s.content).forEach(section => {
      examText += `${section.label.toUpperCase()}:\n`;
      examText += `${section.content}\n\n`;
    });
    
    return examText;
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-300 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              Physical Examination
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {sections.filter(s => s.enabled).length} sections active
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={customizing ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomizing(!customizing)}
              className={customizing ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-300 hover:bg-emerald-50"}
            >
              <Settings className="w-4 h-4 mr-2" />
              {customizing ? "Done" : "Customize"}
            </Button>
            <Button
              onClick={() => {
                const examText = formatForNote();
                onAddToNote(examText);
              }}
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Clinical Note
            </Button>
          </div>
        </div>
      </div>

      {/* Customization Panel */}
      <AnimatePresence>
        {customizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 rounded-xl border-2 border-slate-300 p-5"
          >
            <h4 className="font-semibold text-slate-900 mb-3">Customize Exam Sections</h4>
            <p className="text-sm text-slate-600 mb-4">Toggle sections on/off and add custom sections</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {sections.map(section => (
                <div
                  key={section.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    section.enabled 
                      ? 'bg-white border-emerald-200 hover:border-emerald-300' 
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <section.icon className={`w-4 h-4 flex-shrink-0 ${section.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {editingSection === section.id && section.isCustom ? (
                      <input
                        type="text"
                        value={section.label}
                        onChange={(e) => updateSectionLabel(section.id, e.target.value)}
                        onBlur={() => setEditingSection(null)}
                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className={`text-sm font-medium truncate ${section.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                        {section.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSectionEnabled(section.id)}
                      className="h-7 w-7 p-0"
                    >
                      {section.enabled ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400" />
                      )}
                    </Button>
                    {section.isCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomSection(section.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addCustomSection}
              className="w-full border-dashed border-slate-400 hover:border-emerald-500 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Section
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exam Sections */}
      <div className="space-y-2">
        {sections.filter(s => s.enabled).map((section, idx) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          const isNormal = section.content === section.defaultText;
          
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-emerald-300 transition-all"
            >
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Icon + Label */}
                <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <h4 className="font-semibold text-slate-900 w-36 flex-shrink-0 text-sm">{section.label}</h4>

                {/* Quick Normal/Abnormal toggles */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleUpdateSection(section.id, section.defaultText || "")}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all border ${
                      isNormal && section.content
                        ? "bg-green-100 border-green-400 text-green-800"
                        : "bg-white border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-700"
                    }`}
                    title="Mark as normal"
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => { handleUpdateSection(section.id, ""); toggleSection(section.id); }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all border ${
                      section.content && !isNormal
                        ? "bg-rose-100 border-rose-400 text-rose-800"
                        : "bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-700"
                    }`}
                    title="Mark as abnormal / type custom finding"
                  >
                    Abnormal
                  </button>
                </div>

                {/* Inline content preview / editor */}
                <div className="flex-1 min-w-0">
                  {isExpanded ? (
                    <Textarea
                      value={section.content || ""}
                      onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                      placeholder={`Describe ${section.label.toLowerCase()} findings...`}
                      className="w-full min-h-[70px] text-sm bg-white border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm text-slate-600 truncate block cursor-text hover:text-slate-900"
                      title={section.content}
                      onClick={() => toggleSection(section.id)}
                    >
                      {section.content || <span className="italic text-slate-400">Click to add findings...</span>}
                    </span>
                  )}
                </div>

                {/* Expand/collapse */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeCustomSection(section.id)}
                  className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                  title="Remove section"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {sections.filter(s => s.enabled).length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-2">No exam sections enabled</p>
          <p className="text-sm text-slate-500 mb-4">Click "Customize" to enable sections</p>
        </div>
      )}
    </div>
  );
}