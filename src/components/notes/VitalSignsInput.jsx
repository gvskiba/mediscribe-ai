import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Thermometer, Heart, Wind, Droplet, Weight, Ruler, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function VitalSignsInput({ vitalSigns, onSave, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(vitalSigns || {});

  const handleSave = () => {
    onSave(values);
    setEditing(false);
  };

  const handleCancel = () => {
    setValues(vitalSigns || {});
    setEditing(false);
  };

  const updateValue = (field, key, value) => {
    setValues(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value
      }
    }));
  };

  const vitalSignConfig = [
    {
      field: "temperature",
      label: "Temperature",
      icon: Thermometer,
      color: "red",
      inputs: [
        { key: "value", type: "number", placeholder: "98.6", step: "0.1" },
        { key: "unit", type: "select", options: ["F", "C"] }
      ]
    },
    {
      field: "heart_rate",
      label: "Heart Rate",
      icon: Heart,
      color: "pink",
      inputs: [
        { key: "value", type: "number", placeholder: "72", step: "1" },
        { key: "unit", type: "text", value: "bpm", disabled: true }
      ]
    },
    {
      field: "blood_pressure",
      label: "Blood Pressure",
      icon: Activity,
      color: "blue",
      inputs: [
        { key: "systolic", type: "number", placeholder: "120", step: "1" },
        { key: "diastolic", type: "number", placeholder: "80", step: "1" },
        { key: "unit", type: "text", value: "mmHg", disabled: true }
      ]
    },
    {
      field: "respiratory_rate",
      label: "Respiratory Rate",
      icon: Wind,
      color: "cyan",
      inputs: [
        { key: "value", type: "number", placeholder: "16", step: "1" },
        { key: "unit", type: "text", value: "breaths/min", disabled: true }
      ]
    },
    {
      field: "oxygen_saturation",
      label: "O2 Saturation",
      icon: Droplet,
      color: "indigo",
      inputs: [
        { key: "value", type: "number", placeholder: "98", step: "1" },
        { key: "unit", type: "text", value: "%", disabled: true }
      ]
    },
    {
      field: "weight",
      label: "Weight",
      icon: Weight,
      color: "purple",
      inputs: [
        { key: "value", type: "number", placeholder: "150", step: "0.1" },
        { key: "unit", type: "select", options: ["lbs", "kg"] }
      ]
    },
    {
      field: "height",
      label: "Height",
      icon: Ruler,
      color: "amber",
      inputs: [
        { key: "value", type: "number", placeholder: "68", step: "0.1" },
        { key: "unit", type: "select", options: ["in", "cm"] }
      ]
    }
  ];

  const colorMap = {
    red: "bg-red-50 text-red-700 border-red-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200"
  };

  const hasAnyData = vitalSigns && Object.keys(vitalSigns).some(key => 
    vitalSigns[key] && Object.keys(vitalSigns[key]).some(k => vitalSigns[key][k] !== undefined && vitalSigns[key][k] !== "")
  );

  if (!editing && !hasAnyData && readOnly) {
    return null;
  }

  return (
    <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Vital Signs
        </h3>
        {!readOnly && (
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="h-8 gap-1.5">
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8">
              {hasAnyData ? "Edit" : "Add"}
            </Button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vitalSignConfig.map(({ field, label, icon: Icon, color, inputs }) => {
          const data = editing ? values[field] : vitalSigns?.[field];
          const hasValue = data && Object.keys(data).some(k => data[k] !== undefined && data[k] !== "");

          if (!editing && !hasValue) return null;

          return (
            <div key={field} className={`rounded-lg border p-3 ${colorMap[color]}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
              {editing ? (
                <div className="flex gap-2 flex-wrap">
                  {inputs.map(input => (
                    <div key={input.key} className="flex-1 min-w-[60px]">
                      {input.type === "select" ? (
                        <select
                          value={data?.[input.key] || input.options[0]}
                          onChange={(e) => updateValue(field, input.key, e.target.value)}
                          className="w-full px-2 py-1 text-sm rounded border border-slate-300 bg-white"
                        >
                          {input.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={input.type}
                          value={data?.[input.key] ?? (input.value || "")}
                          onChange={(e) => updateValue(field, input.key, input.type === "number" ? parseFloat(e.target.value) : e.target.value)}
                          placeholder={input.placeholder}
                          step={input.step}
                          disabled={input.disabled}
                          className="h-8 text-sm bg-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-base font-bold">
                  {field === "blood_pressure" ? (
                    `${data?.systolic || "-"}/${data?.diastolic || "-"} ${data?.unit || "mmHg"}`
                  ) : (
                    `${data?.value || "-"} ${data?.unit || ""}`
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}