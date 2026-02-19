import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Activity, Thermometer, Heart, Wind, Droplet, Weight, Ruler } from "lucide-react";
import { motion } from "framer-motion";

export default function VitalSignsInput({ vitalSigns, onChange, onSave, readOnly = false }) {
  const [values, setValues] = useState(vitalSigns || {});
  const [selectedVital, setSelectedVital] = useState(null);

  const updateValue = (field, key, value) => {
    const newValues = {
      ...values,
      [field]: {
        ...values[field],
        [key]: value
      }
    };
    setValues(newValues);
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
    red: { card: "border-red-300 bg-red-50 hover:border-red-400", icon: "text-red-600", dot: "bg-red-500" },
    pink: { card: "border-pink-300 bg-pink-50 hover:border-pink-400", icon: "text-pink-600", dot: "bg-pink-500" },
    blue: { card: "border-blue-300 bg-blue-50 hover:border-blue-400", icon: "text-blue-600", dot: "bg-blue-500" },
    cyan: { card: "border-cyan-300 bg-cyan-50 hover:border-cyan-400", icon: "text-cyan-600", dot: "bg-cyan-500" },
    indigo: { card: "border-indigo-300 bg-indigo-50 hover:border-indigo-400", icon: "text-indigo-600", dot: "bg-indigo-500" },
    purple: { card: "border-purple-300 bg-purple-50 hover:border-purple-400", icon: "text-purple-600", dot: "bg-purple-500" },
    amber: { card: "border-amber-300 bg-amber-50 hover:border-amber-400", icon: "text-amber-600", dot: "bg-amber-500" }
  };

  const hasAnyData = vitalSigns && Object.keys(vitalSigns).some(key => 
    vitalSigns[key] && Object.keys(vitalSigns[key]).some(k => vitalSigns[key][k] !== undefined && vitalSigns[key][k] !== "")
  );

  if (!hasAnyData && readOnly && !selectedVital) {
    return null;
  }

  const activeVital = vitalSignConfig.find(v => v.field === selectedVital);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Vital Signs</h3>
        </div>
        <p className="text-sm text-slate-600">Select vital signs to record and monitor patient status</p>
      </div>

      {/* Vital Signs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {vitalSignConfig.map(({ field, label, icon: Icon, color }) => {
          const isSelected = selectedVital === field;
          const colors = colorMap[color];
          const data = values[field] || vitalSigns?.[field];
          const hasValue = data && Object.keys(data).some(k => data[k] !== undefined && data[k] !== "");

          if (!hasValue && readOnly && !isSelected) return null;

          return (
            <motion.button
              key={field}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedVital(isSelected ? null : field)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${colors.card} border-blue-500 shadow-md`
                  : `border-slate-200 bg-white hover:bg-slate-50`
              }`}
            >
              {/* Selection indicator dot */}
              {isSelected && (
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${colors.dot}`} />
              )}
              
              <Icon className={`w-6 h-6 mb-2 ${isSelected ? colors.icon : "text-slate-400"}`} />
              <p className={`font-semibold text-sm ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                {label}
              </p>
              
              {hasValue && (
                <p className="text-xs text-slate-500 mt-1">
                  {data.value ? `${data.value}${data.unit ? ` ${data.unit}` : ""}` : "Pending"}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Detail Input Panel */}
      {selectedVital && activeVital && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <activeVital.icon.render className={`w-5 h-5 ${colorMap[activeVital.color].icon}`} />
            <h4 className="text-base font-bold text-slate-900">{activeVital.label}</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {activeVital.inputs.map(input => (
              <div key={input.key}>
                <label className="block text-xs font-semibold text-slate-700 mb-2 capitalize">
                  {input.key === "systolic" ? "Systolic" : input.key === "diastolic" ? "Diastolic" : input.key.replace(/_/g, " ")}
                </label>
                {input.type === "select" ? (
                  <select
                    value={values[selectedVital]?.[input.key] || input.options[0]}
                    onChange={(e) => updateValue(selectedVital, input.key, e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  >
                    {input.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={input.type}
                    value={values[selectedVital]?.[input.key] ?? (input.value || "")}
                    onChange={(e) => updateValue(selectedVital, input.key, input.type === "number" ? parseFloat(e.target.value) || "" : e.target.value)}
                    placeholder={input.placeholder}
                    step={input.step}
                    disabled={input.disabled}
                    className="h-10 text-sm bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (onSave) onSave(values);
              else if (onChange) onChange(values);
              setSelectedVital(null);
            }}
            className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all"
          >
            Save {activeVital.label}
          </button>
        </motion.div>
      )}
    </div>
  );
}