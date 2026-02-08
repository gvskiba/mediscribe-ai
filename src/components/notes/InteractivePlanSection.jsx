import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus, Check, Edit2, X, Trash2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const PLAN_CATEGORIES = {
  medications: { label: "Medications", color: "bg-rose-100 text-rose-700 border-rose-200", icon: "💊" },
  diagnostics: { label: "Diagnostic Tests", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🔬" },
  procedures: { label: "Procedures", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "⚕️" },
  followup: { label: "Follow-up", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "📅" },
  education: { label: "Patient Education", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "📚" },
  referrals: { label: "Referrals", color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "🏥" },
  other: { label: "Other", color: "bg-slate-100 text-slate-700 border-slate-200", icon: "📝" }
};

export default function InteractivePlanSection({ value, onUpdate, onReanalyze }) {
  const [planItems, setPlanItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ text: "", category: "medications" });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  // Parse plan text into structured items on mount or when value changes
  useEffect(() => {
    if (typeof value === "string" && value && value !== "Not extracted") {
      parsePlanText(value);
    }
  }, [value]);

  const parsePlanText = (text) => {
    const lines = text.split("\n").filter(line => line.trim());
    const items = lines.map((line, idx) => {
      const category = detectCategory(line);
      return {
        id: Date.now() + idx,
        text: line.trim().replace(/^[-•]\s*/, ""),
        category,
        selected: true
      };
    });
    setPlanItems(items);
  };

  const detectCategory = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("prescribe") || lower.includes("medication") || lower.includes("mg") || lower.includes("tablet")) return "medications";
    if (lower.includes("test") || lower.includes("lab") || lower.includes("x-ray") || lower.includes("ct") || lower.includes("mri")) return "diagnostics";
    if (lower.includes("procedure") || lower.includes("surgery") || lower.includes("biopsy")) return "procedures";
    if (lower.includes("follow") || lower.includes("return") || lower.includes("appointment")) return "followup";
    if (lower.includes("educate") || lower.includes("counsel") || lower.includes("instruct")) return "education";
    if (lower.includes("refer") || lower.includes("consult") || lower.includes("specialist")) return "referrals";
    return "other";
  };

  const toggleSelection = (id) => {
    setPlanItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const addNewItem = () => {
    if (!newItem.text.trim()) return;
    const item = {
      id: Date.now(),
      text: newItem.text.trim(),
      category: newItem.category,
      selected: true
    };
    const updated = [...planItems, item];
    setPlanItems(updated);
    updatePlanText(updated);
    setNewItem({ text: "", category: "medications" });
    setShowAddForm(false);
    toast.success("Item added to plan");
  };

  const deleteItem = (id) => {
    const updated = planItems.filter(item => item.id !== id);
    setPlanItems(updated);
    updatePlanText(updated);
    toast.success("Item removed");
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditText(item.text);
  };

  const saveEdit = (id) => {
    if (!editText.trim()) return;
    const updated = planItems.map(item => 
      item.id === id ? { ...item, text: editText.trim() } : item
    );
    setPlanItems(updated);
    updatePlanText(updated);
    setEditingItemId(null);
    setEditText("");
    toast.success("Item updated");
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditText("");
  };

  const updatePlanText = (items) => {
    const selectedItems = items.filter(item => item.selected);
    const grouped = {};
    
    selectedItems.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item.text);
    });

    let text = "";
    Object.entries(grouped).forEach(([category, items]) => {
      text += `${PLAN_CATEGORIES[category].label}:\n`;
      items.forEach(item => {
        text += `- ${item}\n`;
      });
      text += "\n";
    });

    onUpdate("plan", text.trim());
  };

  const handleReanalyze = async () => {
    const result = await onReanalyze("plan");
    if (result) {
      parsePlanText(result);
      toast.success("Plan reanalyzed");
    }
  };

  const groupedItems = planItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Treatment Plan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select and organize plan elements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReanalyze}
              className="gap-1.5 rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5" /> Regenerate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {planItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">No plan items yet</p>
                  <p className="text-xs mt-1">Add items below or regenerate the plan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{PLAN_CATEGORIES[category].icon}</span>
                        <h4 className="text-sm font-semibold text-slate-700">{PLAN_CATEGORIES[category].label}</h4>
                        <Badge variant="outline" className="text-xs">{items.length}</Badge>
                      </div>
                      <div className="space-y-2 ml-7">
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
                              item.selected
                                ? `${PLAN_CATEGORIES[category].color} border-2`
                                : "bg-slate-50 border-slate-200 opacity-50"
                            }`}
                          >
                            <button
                              onClick={() => toggleSelection(item.id)}
                              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                item.selected
                                  ? "bg-emerald-600 border-emerald-600"
                                  : "bg-white border-slate-300 hover:border-slate-400"
                              }`}
                            >
                              {item.selected && <Check className="w-3 h-3 text-white" />}
                            </button>

                            {editingItemId === item.id ? (
                              <div className="flex-1 flex items-start gap-2">
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="text-sm"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => saveEdit(item.id)} className="h-8 w-8 p-0">
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={`flex-1 text-sm leading-relaxed ${item.selected ? "text-slate-700" : "text-slate-500"}`}>
                                  {item.text}
                                </p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEdit(item)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteItem(item.id)}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Item Form */}
              {showAddForm ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 rounded-lg border-2 border-slate-300 p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PLAN_CATEGORIES).map(([key, cat]) => (
                        <button
                          key={key}
                          onClick={() => setNewItem({ ...newItem, category: key })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                            newItem.category === key
                              ? `${cat.color} border-current`
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Item Text</label>
                    <Textarea
                      value={newItem.text}
                      onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
                      placeholder="e.g., Prescribe Lisinopril 10mg daily for hypertension"
                      className="text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addNewItem} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-4 h-4" /> Add Item
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1 gap-2">
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="outline"
                  className="w-full gap-2 border-dashed border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Plus className="w-4 h-4" /> Add Plan Item
                </Button>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>{planItems.filter(i => i.selected).length} of {planItems.length} items selected</span>
                <span>Items automatically grouped by category</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}