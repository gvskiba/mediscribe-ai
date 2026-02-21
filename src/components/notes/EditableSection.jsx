import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, X, FileText, Bold, Italic, List, ListOrdered, CheckSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import SnippetPicker from "../snippets/SnippetPicker";
import SectionAISuggestions from "./SectionAISuggestions";



export default function EditableSection({ 
  icon: Icon, 
  title, 
  color, 
  value, 
  field,
  type = "text",
  onUpdate,
  onReanalyze,
  hideBorder = false,
  noteContext = {}
}) {
  const [editValue, setEditValue] = useState(value === "Not extracted" ? "" : value);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [snippetPickerOpen, setSnippetPickerOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [useRichText, setUseRichText] = useState(false);
    const [showStructuredList, setShowStructuredList] = useState(false);
    const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
    const [grammarSuggestions, setGrammarSuggestions] = useState(null);
    const textareaRef = useRef(null);
    const selectionRef = useRef({ start: 0, end: 0 });

  const stripMarkdown = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/Not extracted/g, '');
  };

  useEffect(() => {
    const raw = value === "Not extracted" ? "" : value;
    setEditValue(typeof raw === 'string' ? stripMarkdown(raw) : raw);
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
      const cleaned = stripMarkdown(newValue) || "";
      setEditValue(cleaned);
      onUpdate(field, cleaned);
    }
    setIsReanalyzing(false);
  };

  const getPlaceholder = () => {
    const placeholders = {
      chief_complaint: "Enter the main reason for visit (e.g., 'Chest pain for 2 hours')",
      history_of_present_illness: "Describe the patient's current condition using OLDCARTS (Onset, Location, Duration, Character, Alleviating/Aggravating factors, Radiation, Temporal patterns, Severity)",
      medical_history: "Document past medical history, chronic conditions, surgeries, and relevant family/social history",
      review_of_systems: "Document systematic review by body system (Constitutional, HEENT, Cardiovascular, Respiratory, GI, GU, MSK, Neuro, Psych, Skin)",
      physical_exam: "Record vital signs and physical examination findings by system",
      assessment: "Clinical interpretation of symptoms and findings, differential diagnoses, and clinical impression",
      plan: "Treatment plan including medications, tests, procedures, follow-up, and patient education",
      clinical_impression: "Synthesize the primary clinical issues, key findings, and clinical context in 2-4 sentences"
    };
    return placeholders[field] || "Enter clinical information here...";
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

  const handleApplySuggestion = (field, suggestion) => {
    if (!suggestion) return;

    if (field === "history_of_present_illness") {
      // For differential diagnoses, add to assessment
      const diagnosisText = `\n\nDifferential Consideration: ${suggestion.name} (${suggestion.probability})`;
      onUpdate(field, (editValue || "") + diagnosisText);
    } else if (field === "assessment") {
      // For ICD-10 codes, add to diagnoses array
      const codeText = `${suggestion.code} - ${suggestion.diagnosis}`;
      onUpdate("diagnoses", [...(noteContext.diagnoses || []), codeText]);
    } else if (field === "plan") {
      // For plan suggestions, add to plan
      const planText = `\n\n${suggestion.category}: ${suggestion.suggestion}`;
      onUpdate(field, (editValue || "") + planText);
    }
  };

  const handleTextareaSelect = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      selectionRef.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      };
    }
  };

  const applyFormatting = (format, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = selectionRef.current.start;
    const end = selectionRef.current.end;
    const text = editValue || "";
    const selectedText = text.substring(start, end);

    if (!selectedText) {
      textarea.focus();
      return;
    }

    let formattedText = selectedText;
    if (format === "bold") {
      formattedText = `**${selectedText}**`;
    } else if (format === "italic") {
      formattedText = `*${selectedText}*`;
    } else if (format === "bullet") {
      formattedText = selectedText.split("\n").map(line => `• ${line}`).join("\n");
    } else if (format === "numbered") {
      formattedText = selectedText.split("\n").map((line, i) => `${i + 1}. ${line}`).join("\n");
    }

    const newText = text.substring(0, start) + formattedText + text.substring(end);
    setEditValue(newText);
    onUpdate(field, newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleGrammarCheck = async () => {
    if (!editValue || editValue.trim().length === 0) {
      toast.error("Please add text to check grammar and spelling");
      return;
    }
    
    setIsCheckingGrammar(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Check this text for grammar, spelling, punctuation, and clarity issues. Be thorough but concise.\n\nText: "${editValue}"\n\nRespond with ONLY a JSON object with this structure: { "has_errors": boolean, "errors": [{issue, location, suggestion}], "overall_feedback": "string" }. If no errors, return empty errors array.`,
        response_json_schema: {
          type: "object",
          properties: {
            has_errors: { type: "boolean" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  location: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            },
            overall_feedback: { type: "string" }
          }
        }
      });
      
      setGrammarSuggestions(result);
      if (!result.has_errors) {
        toast.success("No grammar or spelling issues found!");
      }
    } catch (error) {
      toast.error("Failed to check grammar");
    } finally {
      setIsCheckingGrammar(false);
    }
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
              {(type === "textarea" || type === "text") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleGrammarCheck}
                  disabled={isCheckingGrammar}
                  title="Check grammar & spelling"
                >
                  {isCheckingGrammar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  )}
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
            <>
              <div className="flex gap-1 mb-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  onMouseDown={(e) => applyFormatting("bold", e)}
                  className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 hover:text-slate-900 border-0 bg-white shadow-sm"
                  title="Bold (select text first)"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onMouseDown={(e) => applyFormatting("italic", e)}
                  className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 hover:text-slate-900 border-0 bg-white shadow-sm"
                  title="Italic (select text first)"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onMouseDown={(e) => applyFormatting("bullet", e)}
                  className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 hover:text-slate-900 border-0 bg-white shadow-sm"
                  title="Bullet list (select text first)"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onMouseDown={(e) => applyFormatting("numbered", e)}
                  className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 hover:text-slate-900 border-0 bg-white shadow-sm"
                  title="Numbered list (select text first)"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                  ref={textareaRef}
                  value={editValue || ""}
                  onChange={(e) => {
                    handleChange(e.target.value);
                    if (!showSuggestions) setShowSuggestions(true);
                  }}
                  onBlur={(e) => handleChange(e.target.value)}
                  onMouseUp={handleTextareaSelect}
                  onKeyUp={handleTextareaSelect}
                  className="min-h-[100px] rounded-xl border-slate-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 transition-all hover:border-slate-400"
                  placeholder={getPlaceholder()}
                  spellCheck="true"
                />
               {grammarSuggestions && grammarSuggestions.has_errors && (
                 <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                   <p className="text-xs font-semibold text-amber-900 mb-2">Grammar & Spelling Issues:</p>
                   {grammarSuggestions.errors.map((error, i) => (
                     <div key={i} className="text-xs text-amber-800 mb-1.5 last:mb-0">
                       <span className="font-medium">{error.issue}</span>
                       <br />
                       <span className="text-amber-700">Suggestion: {error.suggestion}</span>
                     </div>
                   ))}
                 </div>
               )}
               {showSuggestions && ["history_of_present_illness", "assessment", "plan"].includes(field) && (
                  <SectionAISuggestions
                    field={field}
                    currentValue={editValue}
                    context={noteContext}
                    onApplySuggestion={handleApplySuggestion}
                  />
                )}
             </>
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
             placeholder={getPlaceholder()}
             spellCheck="true"
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