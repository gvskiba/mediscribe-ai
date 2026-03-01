import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Check } from "lucide-react";

export default function AppSettings() {
  const [settings, setSettings] = useState(null);
  const [newAttending, setNewAttending] = useState({ name: "", specialty: "", email: "" });
  const queryClient = useQueryClient();

  const { data: hospitalSettings, isLoading } = useQuery({
    queryKey: ["hospitalSettings"],
    queryFn: async () => {
      const results = await base44.entities.HospitalSettings.list();
      return results.length > 0 ? results[0] : null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
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

  useEffect(() => {
    if (hospitalSettings) {
      setSettings(hospitalSettings);
    }
  }, [hospitalSettings]);

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAttending = () => {
    if (!newAttending.name.trim()) return;
    const attendingId = `attending_${Date.now()}`;
    const updatedAttending = [
      ...(settings?.attendings || []),
      { id: attendingId, ...newAttending },
    ];
    setSettings((prev) => ({ ...prev, attendings: updatedAttending }));
    setNewAttending({ name: "", specialty: "", email: "" });
  };

  const handleRemoveAttending = (id) => {
    setSettings((prev) => ({
      ...prev,
      attendings: prev.attendings.filter((a) => a.id !== id),
    }));
  };

  const handleSetDefault = (id) => {
    setSettings((prev) => ({ ...prev, default_attending_id: id }));
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(settings);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">App Settings</h1>

      {/* Hospital Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Hospital Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <Input
              value={settings?.company_name || ""}
              onChange={(e) => handleInputChange("company_name", e.target.value)}
              placeholder="Company or practice name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
            <Input
              value={settings?.hospital_name || ""}
              onChange={(e) => handleInputChange("hospital_name", e.target.value)}
              placeholder="Hospital or facility name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <Input
              value={settings?.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Hospital address"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input
              value={settings?.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Hospital phone number"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Attending Physicians */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Attending Physicians</h2>

        {/* Add New Attending */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Add New Attending</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              value={newAttending.name}
              onChange={(e) => setNewAttending((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
            />
            <Input
              value={newAttending.specialty}
              onChange={(e) => setNewAttending((prev) => ({ ...prev, specialty: e.target.value }))}
              placeholder="Specialty"
            />
            <Input
              value={newAttending.email}
              onChange={(e) => setNewAttending((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
            />
          </div>
          <Button onClick={handleAddAttending} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Attending
          </Button>
        </div>

        {/* List of Attendings */}
        <div className="space-y-2">
          {settings?.attendings && settings.attendings.length > 0 ? (
            settings.attendings.map((attending) => (
              <div
                key={attending.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{attending.name}</p>
                  <p className="text-sm text-gray-600">{attending.specialty} • {attending.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={settings.default_attending_id === attending.id ? "default" : "outline"}
                    onClick={() => handleSetDefault(attending.id)}
                    className={settings.default_attending_id === attending.id ? "bg-green-600" : ""}
                  >
                    {settings.default_attending_id === attending.id ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Default
                      </>
                    ) : (
                      "Set as Default"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveAttending(attending.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm italic">No attending physicians added yet</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}