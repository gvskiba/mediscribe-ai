import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Sparkles, Loader2, Plus, Trash2, FileText } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [snippetPickerOpen, setSnippetPickerOpen] = useState(false);
  const textareaRef = useRef(null);

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  const handleSave = () => {
    onUpdate(field, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
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
  };

  const handleArrayItemChange = (index, newValue) => {
    if (!Array.isArray(editValue)) return;
    const newArray = [...editValue];
    newArray[index] = newValue;
    setEditValue(newArray);
  };

  const handleArrayItemRemove = (index) => {
    if (!Array.isArray(editValue)) return;
    const newArray = editValue.filter((_, i) => i !== index);
    setEditValue(newArray);
  };

  const handleInsertSnippet = (snippetText) => {
    if (type === "array") {
      const newArray = [...(Array.isArray(editValue) ? editValue : []), snippetText];
      setEditValue(newArray);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      setEditValue((editValue || "") + "\n\n" + snippetText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = editValue || "";
    const newText = currentValue.substring(0, start) + snippetText + currentValue.substring(end);
    setEditValue(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippetText.length, start + snippetText.length);
    }, 0);
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
            {isEditing && type !== "text" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSnippetPickerOpen(true)}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
              </Button>
            )}
            {!isEditing && onReanalyze && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleReanalyze}
                disabled={isReanalyzing}
              >
                {isReanalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                )}
              </Button>
            )}
            {!isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCancel}
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSave}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </Button>
              </>
            )}
            </div>
          </div>
        )}
        {!title && (
          <div className="flex justify-end mb-2">
            {isEditing && type !== "text" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSnippetPickerOpen(true)}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
              </Button>
            )}
            {!isEditing && onReanalyze && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleReanalyze}
                disabled={isReanalyzing}
              >
                {isReanalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                )}
              </Button>
            )}
            {!isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCancel}
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSave}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </Button>
              </>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-2">
            {type === "textarea" ? (
              <Textarea
                ref={textareaRef}
                value={editValue || ""}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[100px] rounded-xl border-slate-200 focus:border-blue-400 text-sm"
              />
            ) : type === "array" ? (
              <div className="space-y-2">
                {(Array.isArray(editValue) ? editValue : []).map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleArrayItemChange(index, e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-blue-400 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArrayItemRemove(index)}
                      className="h-9 w-9 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArrayItemAdd}
                  className="gap-2 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </Button>
              </div>
            ) : (
              <Input
                value={editValue || ""}
                onChange={(e) => setEditValue(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-blue-400 text-sm"
              />
            )}
          </div>
        ) : (
          <div>
            {type === "array" ? (
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(value) ? value : []).map((item, i) => (
                  <Badge key={i} variant="outline" className={`${colorMap[color].replace('text-', 'border-').replace('bg-', 'bg-')} px-3 py-1`}>
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
            )}
          </div>
        )}

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