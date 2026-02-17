import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, X, Copy, Code } from "lucide-react";
import { toast } from "sonner";

const commonFields = [
  { name: "Patient Name", placeholder: "{{patient_name}}", source: "patient", path: "patient_name", format: "text" },
  { name: "Patient Age", placeholder: "{{patient_age}}", source: "patient", path: "date_of_birth", format: "age" },
  { name: "Patient Gender", placeholder: "{{patient_gender}}", source: "patient", path: "patient_gender", format: "text" },
  { name: "Patient ID/MRN", placeholder: "{{patient_id}}", source: "patient", path: "patient_id", format: "text" },
  { name: "Date of Visit", placeholder: "{{visit_date}}", source: "note", path: "date_of_visit", format: "date" },
  { name: "Chief Complaint", placeholder: "{{chief_complaint}}", source: "note", path: "chief_complaint", format: "text" },
  { name: "Allergies", placeholder: "{{allergies}}", source: "patient", path: "allergies", format: "text" },
  { name: "Current Medications", placeholder: "{{medications}}", source: "note", path: "medications", format: "text" },
  { name: "Provider Name", placeholder: "{{provider_name}}", source: "user", path: "full_name", format: "text" },
];

export default function DynamicFieldManager({ fields = [], onChange }) {
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    placeholder: "",
    data_source: "patient",
    data_path: "",
    default_value: "",
    format: "text",
    calculation: ""
  });

  const addField = () => {
    if (!newField.name || !newField.placeholder) {
      toast.error("Please provide field name and placeholder");
      return;
    }

    const field = {
      id: `field_${Date.now()}`,
      ...newField
    };

    onChange([...fields, field]);
    setNewField({
      name: "",
      placeholder: "",
      data_source: "patient",
      data_path: "",
      default_value: "",
      format: "text",
      calculation: ""
    });
    setShowAddField(false);
    toast.success("Dynamic field added");
  };

  const removeField = (id) => {
    onChange(fields.filter(f => f.id !== id));
    toast.success("Field removed");
  };

  const addCommonField = (commonField) => {
    const field = {
      id: `field_${Date.now()}`,
      name: commonField.name,
      placeholder: commonField.placeholder,
      data_source: commonField.source,
      data_path: commonField.path,
      default_value: "",
      format: commonField.format,
      calculation: ""
    };
    onChange([...fields, field]);
    toast.success(`Added ${commonField.name}`);
  };

  const copyPlaceholder = (placeholder) => {
    navigator.clipboard.writeText(placeholder);
    toast.success("Placeholder copied!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Dynamic Fields</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Create placeholders that auto-fill with patient data
          </p>
        </div>
        <Button
          onClick={() => setShowAddField(!showAddField)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-3 h-3" /> Add Field
        </Button>
      </div>

      {/* Quick Add Common Fields */}
      {fields.length === 0 && (
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
          <p className="text-xs font-semibold text-slate-900 mb-3">Quick Add Common Fields:</p>
          <div className="flex flex-wrap gap-2">
            {commonFields.slice(0, 5).map((field, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer bg-white hover:bg-cyan-50 border-cyan-300 text-cyan-700"
                onClick={() => addCommonField(field)}
              >
                <Plus className="w-3 h-3 mr-1" /> {field.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add New Field Form */}
      {showAddField && (
        <Card className="p-4 bg-slate-50 border-slate-200">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Field Name</label>
                <Input
                  placeholder="e.g., Patient Name"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Placeholder</label>
                <Input
                  placeholder="e.g., {{patient_name}}"
                  value={newField.placeholder}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Data Source</label>
                <Select value={newField.data_source} onValueChange={(v) => setNewField({ ...newField, data_source: v })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="user">User/Provider</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Data Path</label>
                <Input
                  placeholder="e.g., patient_name"
                  value={newField.data_path}
                  onChange={(e) => setNewField({ ...newField, data_path: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Format</label>
                <Select value={newField.format} onValueChange={(v) => setNewField({ ...newField, format: v })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="calculation">Calculation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Default Value (Optional)</label>
              <Input
                placeholder="Value if data not available"
                value={newField.default_value}
                onChange={(e) => setNewField({ ...newField, default_value: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAddField(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={addField} className="bg-cyan-600 hover:bg-cyan-700">
                Add Field
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Existing Fields */}
      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field) => (
            <Card key={field.id} className="p-3 bg-white border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900">{field.name}</h4>
                    <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
                      {field.data_source}
                    </Badge>
                    {field.format !== "text" && (
                      <Badge variant="outline" className="text-xs">
                        {field.format}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 font-mono">
                      {field.placeholder}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyPlaceholder(field.placeholder)}
                      className="h-6 px-2 gap-1 text-xs"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  {field.data_path && (
                    <p className="text-xs text-slate-500 mt-1">
                      Path: {field.data_path}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(field.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Usage in Templates:</p>
                <p>Use these placeholders in section content templates. They'll auto-fill with actual patient data when creating notes.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}