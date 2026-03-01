import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save } from "lucide-react";

export default function AppSettings() {
  const [settings, setSettings] = useState(null);
  const [newAttending, setNewAttending] = useState({ name: "", specialty: "", email: "" });
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: existingSettings } = useQuery({
    queryKey: ["hospitalSettings"],
    queryFn: async () => {
      const results = await base44.entities.HospitalSettings.list();
      return results.length > 0 ? results[0] : null;
    },
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings(existingSettings);
    }
  }, [existingSettings]);

  // Save/Update settings
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.HospitalSettings.update(settings.id, data);
      } else {
        return base44.entities.HospitalSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitalSettings"] });
    },
  });

  const handleSave = async () => {
    await saveMutation.mutateAsync(settings);
  };

  const handleFieldChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const addAttending = () => {
    if (!newAttending.name) return;
    const attendings = settings?.attendings || [];
    const id = Math.random().toString(36).substr(2, 9);
    const updated = [...attendings, { ...newAttending, id }];
    setSettings((prev) => ({ ...prev, attendings: updated }));
    setNewAttending({ name: "", specialty: "", email: "" });
  };

  const removeAttending = (id) => {
    setSettings((prev) => ({
      ...prev,
      attendings: prev.attendings.filter((a) => a.id !== id),
      default_attending_id:
        prev.default_attending_id === id ? null : prev.default_attending_id,
    }));
  };

  const setDefaultAttending = (id) => {
    setSettings((prev) => ({ ...prev, default_attending_id: id }));
  };

  if (!settings) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">App Settings</h1>
        <p className="text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">App Settings</h1>
        <p className="text-slate-600">Customize your hospital and practice information</p>
      </div>

      {/* Hospital Information */}
      <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Hospital & Practice Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
            <input
              type="text"
              value={settings?.company_name || ""}
              onChange={(e) => handleFieldChange("company_name", e.target.value)}
              placeholder="e.g., My Medical Practice"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Name</label>
            <input
              type="text"
              value={settings?.hospital_name || ""}
              onChange={(e) => handleFieldChange("hospital_name", e.target.value)}
              placeholder="e.g., City Hospital"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <input
              type="text"
              value={settings?.address || ""}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              placeholder="e.g., 123 Main St, City, State ZIP"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={settings?.phone || ""}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              placeholder="e.g., (555) 123-4567"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Attending Physicians */}
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Attending Physicians</h2>

        {/* Add New Attending */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
          <h3 className="font-medium text-slate-900 mb-3">Add New Attending</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              value={newAttending.name}
              onChange={(e) => setNewAttending({ ...newAttending, name: e.target.value })}
              placeholder="Name"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="text"
              value={newAttending.specialty}
              onChange={(e) => setNewAttending({ ...newAttending, specialty: e.target.value })}
              placeholder="Specialty"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="email"
              value={newAttending.email}
              onChange={(e) => setNewAttending({ ...newAttending, email: e.target.value })}
              placeholder="Email"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            onClick={addAttending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" /> Add Attending
          </button>
        </div>

        {/* Attending List */}
        <div className="space-y-2">
          {settings?.attendings?.length > 0 ? (
            settings.attendings.map((attending) => (
              <div
                key={attending.id}
                className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="default_attending"
                      checked={settings.default_attending_id === attending.id}
                      onChange={() => setDefaultAttending(attending.id)}
                      className="w-4 h-4"
                    />
                    <p className="font-medium text-slate-900">{attending.name}</p>
                    {settings.default_attending_id === attending.id && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  {attending.specialty && (
                    <p className="text-sm text-slate-600 mt-1">{attending.specialty}</p>
                  )}
                  {attending.email && (
                    <p className="text-sm text-slate-500">{attending.email}</p>
                  )}
                </div>
                <button
                  onClick={() => removeAttending(attending.id)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm italic">No attending physicians added yet</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}