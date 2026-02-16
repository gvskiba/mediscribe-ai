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
      <div className="space-y-3">
        {sections.filter(s => s.enabled).map((section, idx) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-amber-300 transition-all"
            >
              <div 
                className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-slate-900">{section.label}</h4>
                  {!isExpanded && section.content && (
                    <Badge variant="outline" className="text-xs">
                      {section.content.length > 50 ? section.content.substring(0, 50) + "..." : section.content}
                    </Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4"
                  >
                    <Textarea
                      value={section.content || ""}
                      onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                      placeholder={`Enter ${section.label.toLowerCase()} findings...`}
                      className="w-full min-h-[100px] bg-white border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-100"
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-500">
                        {section.content?.length || 0} characters
                      </span>
                      {section.content !== section.defaultText && section.defaultText && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateSection(section.id, section.defaultText)}
                          className="text-xs text-slate-600 hover:text-slate-900"
                        >
                          Reset to default
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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