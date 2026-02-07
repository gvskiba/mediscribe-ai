import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, X } from "lucide-react";

const CONDITION_TYPES = [
  { value: "note_type", label: "Note Type", description: "Show section for specific note types (e.g., progress_note)" },
  { value: "specialty", label: "Medical Specialty", description: "Show section for specific specialties (e.g., cardiology)" },
  { value: "diagnosis_contains", label: "Diagnosis Contains", description: "Show section if diagnosis contains keyword (e.g., hypertension)" },
  { value: "chronic_condition_contains", label: "Chronic Condition", description: "Show section if patient has chronic condition (e.g., diabetes)" },
  { value: "medication_contains", label: "Medication Contains", description: "Show section if patient is on medication (e.g., metformin)" },
  { value: "allergy_contains", label: "Allergy Present", description: "Show section if patient has allergy (e.g., penicillin)" },
];

export default function ConditionalLogicEditor({ value, onChange }) {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [conditionType, setConditionType] = useState(value?.condition_type || "");
  const [conditionValue, setConditionValue] = useState(value?.condition_value || "");

  const handleUpdate = () => {
    onChange({
      enabled,
      condition_type: conditionType,
      condition_value: conditionValue,
    });
  };

  React.useEffect(() => {
    handleUpdate();
  }, [enabled, conditionType, conditionValue]);

  const selectedCondition = CONDITION_TYPES.find(c => c.value === conditionType);

  return (
    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <label className="text-sm font-medium text-slate-700">
          Show section based on conditions
        </label>
      </div>

      {enabled && (
        <div className="space-y-3 ml-6">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              When condition is:
            </label>
            <Select value={conditionType} onValueChange={setConditionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition type" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCondition && (
              <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {selectedCondition.description}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              {conditionType === "note_type" && "Note Type (e.g., progress_note)"}
              {conditionType === "specialty" && "Specialty (e.g., cardiology)"}
              {conditionType === "diagnosis_contains" && "Diagnosis Keyword (e.g., hypertension)"}
              {conditionType === "chronic_condition_contains" && "Chronic Condition (e.g., diabetes, cardiac)"}
              {conditionType === "medication_contains" && "Medication Name (e.g., metformin, aspirin)"}
              {conditionType === "allergy_contains" && "Allergy (e.g., penicillin)"}
            </label>
            <Input
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              placeholder="Enter value to match"
              className="text-sm"
            />
          </div>

          <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 text-blue-700">
            💡 This section will only appear when the condition matches the patient's data or note properties.
          </div>
        </div>
      )}
    </div>
  );
}