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
  ChevronUp,
  Ear
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const DEFAULT_SECTIONS = [
  { id: "constitutional", label: "Constitutional", icon: User, defaultText: "No fever, chills, fatigue, weight loss, or night sweats" },
  { id: "eyes", label: "Eyes", icon: Eye, defaultText: "No vision changes, eye pain, redness, or discharge" },
  { id: "ent", label: "ENT", icon: Ear, defaultText: "No hearing loss, ear pain, nasal congestion, sore throat, or dysphagia" },
  { id: "cardiovascular", label: "Cardiovascular", icon: Heart, defaultText: "No chest pain, palpitations, orthopnea, or lower extremity edema" },
  { id: "respiratory", label: "Respiratory", icon: Wind, defaultText: "No shortness of breath, cough, wheezing, or hemoptysis" },
  { id: "gastrointestinal", label: "Gastrointestinal", icon: User, defaultText: "No nausea, vomiting, diarrhea, constipation, abdominal pain, or blood in stool" },
  { id: "genitourinary", label: "Genitourinary", icon: User, defaultText: "No dysuria, hematuria, frequency, urgency, or incontinence" },
  { id: "musculoskeletal", label: "Musculoskeletal", icon: Activity, defaultText: "No joint pain, swelling, stiffness, back pain, or muscle weakness" },
  { id: "neurological", label: "Neurological", icon: Brain, defaultText: "No headaches, dizziness, syncope, seizures, weakness, numbness, or paresthesias" },
  { id: "psychiatric", label: "Psychiatric", icon: Brain, defaultText: "No depression, anxiety, mood changes, or sleep disturbances" },
  { id: "endocrine", label: "Endocrine", icon: Activity, defaultText: "No polyuria, polydipsia, heat/cold intolerance, or changes in hair/skin" },
  { id: "hematologic", label: "Hematologic", icon: Activity, defaultText: "No easy bruising, bleeding, lymphadenopathy, or history of blood clots" },
  { id: "integumentary", label: "Integumentary", icon: User, defaultText: "No rashes, skin lesions, pruritus, or changes in moles" }
];

export default function ReviewOfSystemsEditor({ rosData, onUpdate, onAddToNote }) {
  const [sections, setSections] = useState(() => {
    if (rosData && typeof rosData === 'object' && !Array.isArray(rosData)) {
      return Object.keys(rosData).map(key => ({
        id: key,
        label: DEFAULT_SECTIONS.find(s => s.id === key)?.label || key,
        icon: DEFAULT_SECTIONS.find(s => s.id === key)?.icon || User,
        content: rosData[key],
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
    
    const rosObj = {};
    updatedSections.filter(s => s.enabled).forEach(s => {
      rosObj[s.id] = s.content;
    });
    onUpdate(rosObj);
  };

  const toggleSectionEnabled = (sectionId) => {
    const updatedSections = sections.map(s => 
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    setSections(updatedSections);
    
    const rosObj = {};
    updatedSections.filter(s => s.enabled).forEach(s => {
      rosObj[s.id] = s.content;
    });
    onUpdate(rosObj);
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
    
    const rosObj = {};
    updatedSections.filter(s => s.enabled).forEach(s => {
      rosObj[s.id] = s.content;
    });
    onUpdate(rosObj);
  };

  const updateSectionLabel = (sectionId, newLabel) => {
    const updatedSections = sections.map(s => 
      s.id === sectionId ? { ...s, label: newLabel } : s
    );
    setSections(updatedSections);
  };

  const formatForNote = () => {
    let rosText = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    rosText += "REVIEW OF SYSTEMS\n";
    rosText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    sections.filter(s => s.enabled && s.content).forEach(section => {
      rosText += `${section.label.toUpperCase()}:\n`;
      rosText += `${section.content}\n\n`;
    });
    
    return rosText;
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-300 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-amber-600" />
              Review of Systems
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
              className={customizing ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 hover:bg-amber-50"}
            >
              <Settings className="w-4 h-4 mr-2" />
              {customizing ? "Done" : "Customize"}
            </Button>
            <Button
              onClick={() => {
                const rosText = formatForNote();
                onAddToNote(rosText);
              }}
              size="sm"
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
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
            <h4 className="font-semibold text-slate-900 mb-3">Customize ROS Sections</h4>
            <p className="text-sm text-slate-600 mb-4">Toggle sections on/off and add custom sections</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {sections.map(section => (
                <div
                  key={section.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    section.enabled 
                      ? 'bg-white border-amber-200 hover:border-amber-300' 
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <section.icon className={`w-4 h-4 flex-shrink-0 ${section.enabled ? 'text-amber-600' : 'text-slate-400'}`} />
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
                        <Check className="w-4 h-4 text-amber-600" />
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
              className="w-full border-dashed border-slate-400 hover:border-amber-500 hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Section
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROS Sections */}
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
              className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-amber-300 transition-all"
            >
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Icon + Label */}
                <Icon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <h4 className="font-semibold text-slate-900 w-32 flex-shrink-0 text-sm">{section.label}</h4>

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
                      className="w-full min-h-[70px] text-sm bg-white border-2 border-amber-300 focus:border-amber-500 focus:ring-amber-100"
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
              </div>
            </motion.div>
          );
        })}
      </div>

      {sections.filter(s => s.enabled).length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-2">No ROS sections enabled</p>
          <p className="text-sm text-slate-500 mb-4">Click "Customize" to enable sections</p>
        </div>
      )}
    </div>
  );
}