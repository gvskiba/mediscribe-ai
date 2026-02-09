import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, X, FileText } from "lucide-react";
import SnippetPicker from "../snippets/SnippetPicker";

export default function EditableSection({ 
  icon: Icon, 
  title, 
  color, 
  value, 
  field,
  type = "text",
  onUpdate,
  onReanalyze,
  hideBorder = false
}) {
  const [editValue, setEditValue] = useState(value);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [snippetPickerOpen, setSnippetPickerOpen] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    indigo: "bg-indigo-50 text-indigo-600",
    teal: "bg-teal-50 text-teal-600",
    slate: "bg-slate-50 text-slate-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  const handleChange = (newValue) => {
    setEditValue(newValue);
    onUpdate(field, newValue);
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    const newValue = await onReanalyze(field);
    if (newValue) {
      setEditValue(newValue);
      onUpdate(field, newValue);
    }
    setIsReanalyzing(false);
  };

  const handleArrayItemAdd = () => {
    const newArray = [...(Array.isArray(editValue) ? editValue : []), ""];
    setEditValue(newArray);
    onUpdate(field, newArray);
  };

  const handleArrayItemChange = (index, newValue) => {
    if (!Array.isArray(editValue)) return;
    const newArray = [...editValue];
    newArray[index] = newValue;
    setEditValue(newArray);
    onUpdate(field, newArray);
  };

  const handleArrayItemRemove = (index) => {
    if (!Array.isArray(editValue)) return;
    const newArray = editValue.filter((_, i) => i !== index);
    setEditValue(newArray);
    onUpdate(field, newArray);
  };

  const handleInsertSnippet = (snippetText) => {
    if (type === "array") {
      const newArray = [...(Array.isArray(editValue) ? editValue : []), snippetText];
      setEditValue(newArray);
      onUpdate(field, newArray);
      setSnippetPickerOpen(false);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      const newText = (editValue || "") + "\n\n" + snippetText;
      setEditValue(newText);
      onUpdate(field, newText);
      setSnippetPickerOpen(false);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = editValue || "";
    const newText = currentValue.substring(0, start) + snippetText + currentValue.substring(end);
    setEditValue(newText);
    onUpdate(field, newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippetText.length, start + snippetText.length);
    }, 0);
    
    setSnippetPickerOpen(false);
  };

  return (
    <div className={hideBorder ? "" : "flex gap-4"}>
      {!hideBorder && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <div className="flex gap-1">
              {type !== "text" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSnippetPickerOpen(true)}
                  title="Insert snippet"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                </Button>
              )}
              {onReanalyze && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  title="AI reanalyze"
                >
                  {isReanalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
        {!title && (
          <div className="flex justify-end mb-2">
            {type !== "text" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSnippetPickerOpen(true)}
                title="Insert snippet"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
              </Button>
            )}
            {onReanalyze && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                title="AI reanalyze"
              >
                {isReanalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                )}
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          {type === "textarea" ? (
            <Textarea
              ref={textareaRef}
              value={editValue || ""}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={(e) => handleChange(e.target.value)}
              className="min-h-[100px] rounded-xl border-slate-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 transition-all hover:border-slate-400"
              placeholder="Click to edit..."
            />
          ) : type === "array" ? (
            <div className="space-y-2">
              {(Array.isArray(editValue) ? editValue : []).map((item, index) => (
                <div key={index} className="flex gap-2 group">
                  <Input
                    value={item}
                    onChange={(e) => handleArrayItemChange(index, e.target.value)}
                    onBlur={(e) => handleArrayItemChange(index, e.target.value)}
                    className="rounded-xl border-slate-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 transition-all hover:border-slate-400"
                    placeholder={`Item ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleArrayItemRemove(index)}
                    className="h-9 w-9 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleArrayItemAdd}
                className="gap-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 bg-white"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>
          ) : (
            <Input
              value={editValue || ""}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={(e) => handleChange(e.target.value)}
              className="rounded-xl border-slate-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 transition-all hover:border-slate-400"
              placeholder="Click to edit..."
            />
          )}
        </div>

        <SnippetPicker
          open={snippetPickerOpen}
          onClose={() => setSnippetPickerOpen(false)}
          onInsert={handleInsertSnippet}
          category={field === "physical_exam" ? "exam" : field === "review_of_systems" ? "ros" : null}
        />
      </div>
    </div>
  );
}