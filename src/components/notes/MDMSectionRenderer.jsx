import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MDMSectionRenderer({ 
  sectionKey, 
  title, 
  content, 
  likelihood, 
  color,
  onEdit,
  onAdd,
  isEditing,
  editValue,
  onEditChange
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingItems, setEditingItems] = useState({});

  const contentArray = Array.isArray(content) ? content : [content];
  const colorClasses = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    pink: "bg-pink-50 border-pink-200 text-pink-900",
    orange: "bg-orange-50 border-orange-200 text-orange-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };

  const colorClass = colorClasses[color] || colorClasses.indigo;
  const buttonColor = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    cyan: "bg-cyan-600 hover:bg-cyan-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    pink: "bg-pink-600 hover:bg-pink-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
  }[color] || "bg-indigo-600 hover:bg-indigo-700";

  const handleItemEdit = (index) => {
    setEditingItems({...editingItems, [index]: contentArray[index]});
  };

  const handleItemChange = (index, value) => {
    setEditingItems({...editingItems, [index]: value});
  };

  const handleItemSave = (index) => {
    const updated = [...contentArray];
    updated[index] = editingItems[index];
    onEditChange(updated);
    setEditingItems({...editingItems, [index]: undefined});
  };

  return (
    <div className={`rounded-lg p-4 border-2 ${colorClass}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold">{title}</p>
          {likelihood !== undefined && (
            <Badge variant="secondary" className={`text-xs ${
              likelihood >= 75 ? "bg-red-100 text-red-700" :
              likelihood >= 50 ? "bg-yellow-100 text-yellow-700" :
              "bg-green-100 text-green-700"
            }`}>
              {likelihood}%
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 mt-3"
          >
            <ul className="space-y-2">
              {contentArray.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2 bg-white rounded border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 mt-1 flex-shrink-0">•</span>
                  {editingItems[idx] !== undefined ? (
                    <div className="flex-1 space-y-1">
                      <Textarea
                        value={editingItems[idx]}
                        onChange={(e) => handleItemChange(idx, e.target.value)}
                        className="text-xs min-h-[50px]"
                      />
                      <div className="flex gap-1 justify-end">
                        <Button
                          onClick={() => handleItemSave(idx)}
                          size="sm"
                          className={`${buttonColor} text-white text-xs`}
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingItems({...editingItems, [idx]: undefined})}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-700 flex-1 leading-relaxed">{item}</p>
                      <Button
                        onClick={() => handleItemEdit(idx)}
                        size="sm"
                        variant="ghost"
                        className="text-xs text-slate-500 hover:text-slate-700 p-0 h-auto"
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button
                onClick={() => onAdd(contentArray)}
                size="sm"
                className={`${buttonColor} text-white flex-1`}
              >
                <Plus className="w-3 h-3" /> Add to Note
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}