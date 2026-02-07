import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Wand2, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const CONDITION_TYPES = [
  { value: "note_type", label: "Note Type", description: "Show section for specific note types" },
  { value: "specialty", label: "Medical Specialty", description: "Show section for specific specialties" },
  { value: "diagnosis_contains", label: "Diagnosis Contains", description: "Show section if diagnosis contains keyword" },
  { value: "chronic_condition_contains", label: "Chronic Condition", description: "Show section if patient has chronic condition" },
  { value: "medication_contains", label: "Medication Contains", description: "Show section if patient is on medication" },
  { value: "allergy_contains", label: "Allergy Present", description: "Show section if patient has allergy" },
  { value: "patient_age", label: "Patient Age", description: "Show section based on patient age range" },
  { value: "symptom_contains", label: "Symptom Present", description: "Show section if symptom is documented" },
];

function ConditionRow({ condition, onUpdate, onRemove, index }) {
  const selectedType = CONDITION_TYPES.find(c => c.value === condition.type);

  return (
    <div className="flex gap-2 items-end p-3 bg-white border border-slate-200 rounded-lg">
      <div className="flex-1 min-w-0 space-y-1">
        <label className="text-xs font-medium text-slate-600">Condition Type</label>
        <Select value={condition.type} onValueChange={(type) => onUpdate({ ...condition, type })}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_TYPES.map(ct => (
              <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <label className="text-xs font-medium text-slate-600">
          {condition.type === "patient_age" ? "Age Range" : "Value"}
        </label>
        <Input
          value={condition.value}
          onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
          placeholder={condition.type === "patient_age" ? "e.g., 18-65" : "e.g., hypertension"}
          className="h-8 text-sm"
        />
      </div>

      {condition.type === "patient_age" && (
        <div className="flex-1 min-w-0 space-y-1">
          <label className="text-xs font-medium text-slate-600">Or Range 2</label>
          <Input
            value={condition.secondary_value || ""}
            onChange={(e) => onUpdate({ ...condition, secondary_value: e.target.value })}
            placeholder="Optional"
            className="h-8 text-sm"
          />
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function AdvancedConditionalLogicEditor({ value, onChange, noteType, specialty }) {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [operator, setOperator] = useState(value?.operator || "AND");
  const [conditions, setConditions] = useState(value?.conditions || []);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleUpdate = () => {
    onChange({
      enabled,
      operator,
      conditions: conditions.map(c => ({
        id: c.id || generateId(),
        type: c.type,
        value: c.value,
        secondary_value: c.secondary_value,
      })),
    });
  };

  React.useEffect(() => {
    handleUpdate();
  }, [enabled, operator, conditions]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: generateId(), type: "diagnosis_contains", value: "" }
    ]);
  };

  const updateCondition = (index, updatedCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = updatedCondition;
    setConditions(newConditions);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const generateSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `For a ${noteType} note in ${specialty || "general"} specialty, suggest 2-3 conditional logic rules that would make sense for automatically showing/hiding sections. 

Consider common scenarios like:
- Age-based conditions (pediatrics, geriatrics)
- Common diagnoses in this specialty that would require additional sections
- Common medications that indicate specific conditions
- Chronic conditions commonly seen in this specialty

Return suggestions as a JSON array of condition suggestions.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  condition_type: { type: "string" },
                  value: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      if (suggestions.suggestions) {
        setConditions(
          suggestions.suggestions.map(s => ({
            id: generateId(),
            type: s.condition_type,
            value: s.value,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    }
    setLoadingSuggestions(false);
  };

  return (
    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <label className="text-sm font-medium text-slate-700">
            Show section based on complex conditions
          </label>
        </div>
        {noteType && specialty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={loadingSuggestions}
            className="gap-2 text-xs h-7"
          >
            {loadingSuggestions ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="w-3 h-3" /> AI Suggest</>
            )}
          </Button>
        )}
      </div>

      {enabled && (
        <div className="space-y-3 ml-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Combine conditions with:
              </label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">ALL (AND)</SelectItem>
                  <SelectItem value="OR">ANY (OR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              {operator === "AND" 
                ? "Section appears only when ALL conditions match"
                : "Section appears when ANY condition matches"}
            </p>
          </div>

          {conditions.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 block">
                Conditions ({conditions.length})
              </label>
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <ConditionRow
                    key={condition.id}
                    condition={condition}
                    onUpdate={(updated) => updateCondition(index, updated)}
                    onRemove={removeCondition}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={addCondition}
            className="gap-1 h-8 text-xs"
          >
            <Plus className="w-3 h-3" /> Add Condition
          </Button>

          <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 text-blue-700 flex gap-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>Complex conditions allow fine-grained control over when sections appear based on patient data and note type.</span>
          </div>
        </div>
      )}
    </div>
  );
}