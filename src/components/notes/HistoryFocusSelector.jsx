import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Heart, Wind, Activity, Brain, Droplet, Pill, Filter, RotateCcw } from "lucide-react";

const focusOptions = [
  { value: "comprehensive", label: "Comprehensive", icon: Activity, description: "All medical history" },
  { value: "cardiac", label: "Cardiac", icon: Heart, description: "Heart & cardiovascular" },
  { value: "respiratory", label: "Respiratory", icon: Wind, description: "Lungs & breathing" },
  { value: "endocrine", label: "Endocrine", icon: Droplet, description: "Diabetes & metabolism" },
  { value: "neurological", label: "Neurological", icon: Brain, description: "Brain & nervous system" },
  { value: "gastrointestinal", label: "GI", icon: Activity, description: "Digestive system" },
  { value: "renal", label: "Renal", icon: Droplet, description: "Kidney & urinary" },
  { value: "oncology", label: "Oncology", icon: Pill, description: "Cancer history" },
];

export default function HistoryFocusSelector({ value, onChange, onRefresh, disabled }) {
  const selectedOption = focusOptions.find(opt => opt.value === value) || focusOptions[0];
  const Icon = selectedOption.icon;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            History Focus Area
          </Label>
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className="rounded-lg bg-white border-blue-200">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{selectedOption.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {focusOptions.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2 py-1">
                      <OptionIcon className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-1.5">
            AI will prioritize {selectedOption.label.toLowerCase()} conditions and medications
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={disabled}
            className="rounded-lg gap-2 bg-white border-blue-200 hover:bg-blue-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
        )}
      </div>
    </div>
  );
}