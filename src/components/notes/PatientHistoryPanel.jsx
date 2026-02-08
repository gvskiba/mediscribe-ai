import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Activity, Pill, FileText, Loader2, ArrowRight, Edit2, Save, X, Plus, Trash2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientHistoryPanel({ history, loading, onApplyToNote }) {
  const [editing, setEditing] = useState(false);
  const [editedHistory, setEditedHistory] = useState(null);
  const [addingItem, setAddingItem] = useState(null);
  const [newItemText, setNewItemText] = useState("");
  const [expanded, setExpanded] = useState(true);

  React.useEffect(() => {
    if (history) {
      setEditedHistory(JSON.parse(JSON.stringify(history)));
    }
  }, [history]);

  const handleSave = () => {
    onApplyToNote(editedHistory);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditedHistory(JSON.parse(JSON.stringify(history)));
    setEditing(false);
    setAddingItem(null);
    setNewItemText("");
  };

  const handleAddItem = (category) => {
    if (!newItemText.trim()) return;
    
    const updated = { ...editedHistory };
    if (!updated[category]) updated[category] = [];
    updated[category] = [...updated[category], newItemText.trim()];
    
    setEditedHistory(updated);
    setNewItemText("");
    setAddingItem(null);
  };

  const handleRemoveItem = (category, index) => {
    const updated = { ...editedHistory };
    updated[category] = updated[category].filter((_, i) => i !== index);
    setEditedHistory(updated);
  };

  const handleEditItem = (category, index, newValue) => {
    const updated = { ...editedHistory };
    updated[category][index] = newValue;
    setEditedHistory(updated);
  };

  if (loading) {
    return (
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex items-center gap-2 text-slate-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading patient history...</span>
        </div>
      </Card>
    );
  }

  if (!history) return null;

  const displayHistory = editing ? editedHistory : history;

  return (
    <Card className="border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
           <div className="text-left">
             <h3 className="font-semibold text-slate-900">Patient History Summary</h3>
             <p className="text-xs text-slate-700">From {history.notes_reviewed} previous note(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 text-xs gap-1"
              >
                <X className="w-3 h-3" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-3 h-3" /> Save
              </Button>
            </div>
          )}
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="h-7 text-xs gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chronic Conditions */}
                <HistorySection
                  icon={Activity}
                  iconColor="red"
                  title="Chronic Conditions"
                  items={displayHistory.chronic_conditions || []}
                  category="chronic_conditions"
                  editing={editing}
                  addingItem={addingItem}
                  newItemText={newItemText}
                  onAddClick={() => setAddingItem("chronic_conditions")}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onEditItem={handleEditItem}
                  setNewItemText={setNewItemText}
                  setAddingItem={setAddingItem}
                />

                {/* Allergies */}
                <HistorySection
                  icon={Activity}
                  iconColor="orange"
                  title="Allergies"
                  items={displayHistory.allergies || []}
                  category="allergies"
                  editing={editing}
                  addingItem={addingItem}
                  newItemText={newItemText}
                  onAddClick={() => setAddingItem("allergies")}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onEditItem={handleEditItem}
                  setNewItemText={setNewItemText}
                  setAddingItem={setAddingItem}
                />

                {/* Current Medications */}
                <HistorySection
                  icon={Pill}
                  iconColor="blue"
                  title="Current Medications"
                  items={displayHistory.current_medications || []}
                  category="current_medications"
                  editing={editing}
                  addingItem={addingItem}
                  newItemText={newItemText}
                  onAddClick={() => setAddingItem("current_medications")}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onEditItem={handleEditItem}
                  setNewItemText={setNewItemText}
                  setAddingItem={setAddingItem}
                />

                {/* Past Procedures */}
                <HistorySection
                  icon={FileText}
                  iconColor="purple"
                  title="Past Procedures"
                  items={displayHistory.past_procedures || []}
                  category="past_procedures"
                  editing={editing}
                  addingItem={addingItem}
                  newItemText={newItemText}
                  onAddClick={() => setAddingItem("past_procedures")}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onEditItem={handleEditItem}
                  setNewItemText={setNewItemText}
                  setAddingItem={setAddingItem}
                />

                {/* Family History */}
                <HistorySection
                  icon={Activity}
                  iconColor="teal"
                  title="Family History"
                  items={displayHistory.family_history || []}
                  category="family_history"
                  editing={editing}
                  addingItem={addingItem}
                  newItemText={newItemText}
                  onAddClick={() => setAddingItem("family_history")}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onEditItem={handleEditItem}
                  setNewItemText={setNewItemText}
                  setAddingItem={setAddingItem}
                />
              </div>

              {/* Trends & Changes */}
              {displayHistory.trends && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-slate-700" />
                    <h4 className="text-sm font-semibold text-slate-900">Key Trends & Changes</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-white rounded-lg p-3 border border-slate-200">
                    {displayHistory.trends}
                  </p>
                </div>
              )}

              {onApplyToNote && !editing && (
                <Button
                  onClick={() => onApplyToNote(displayHistory)}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <ArrowRight className="w-4 h-4" /> Apply to Medical History Section
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function HistorySection({ 
  icon: Icon, 
  iconColor, 
  title, 
  items, 
  category, 
  editing, 
  addingItem,
  newItemText,
  onAddClick,
  onAddItem,
  onRemoveItem,
  onEditItem,
  setNewItemText,
  setAddingItem
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const colorClasses = {
    red: { icon: "text-red-600", bullet: "text-red-400", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
    orange: { icon: "text-orange-600", bullet: "text-orange-400", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
    blue: { icon: "text-blue-600", bullet: "text-blue-400", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    purple: { icon: "text-purple-600", bullet: "text-purple-400", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    teal: { icon: "text-teal-600", bullet: "text-teal-400", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700" },
  };

  const colors = colorClasses[iconColor] || colorClasses.blue;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.icon}`} />
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        </div>
        {editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddClick}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="group">
            {editing && editingIndex !== idx ? (
              <div className={`flex items-center gap-2 ${colors.bg} ${colors.border} border rounded px-2 py-1.5`}>
                <span className="flex-1 text-sm text-slate-700">{item}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingIndex(idx);
                      setEditValue(item);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemoveItem(category, idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : editing && editingIndex === idx ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onEditItem(category, idx, editValue);
                      setEditingIndex(null);
                    }
                    if (e.key === "Escape") setEditingIndex(null);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onEditItem(category, idx, editValue);
                    setEditingIndex(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Save className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingIndex(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border}`}>
                {item}
              </Badge>
            )}
          </div>
        ))}
        {addingItem === category && (
          <div className="flex items-center gap-2">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}...`}
              className="flex-1 h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddItem(category);
                if (e.key === "Escape") setAddingItem(null);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddItem(category)}
              className="h-8 w-8 p-0"
            >
              <Save className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddingItem(null);
                setNewItemText("");
              }}
              className="h-8 w-8 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      {items.length === 0 && !editing && (
        <p className="text-xs text-slate-400 italic">None documented</p>
      )}
    </div>
  );
}