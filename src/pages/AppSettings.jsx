import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Check, Key, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

const NEWS_API_KEY = "thenewsapi_token";
const WEBZIO_KEY = "webzio_token";

function NewsAPIKeySection() {
  const [inputVal, setInputVal] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(null); // null | "validating" | "valid" | "invalid"
  const [errMsg, setErrMsg] = useState("");
  const [saved, setSaved] = useState(() => localStorage.getItem(NEWS_API_KEY) || "");

  const validate = async (token) => {
    setStatus("validating");
    setErrMsg("");
    try {
      const res = await base44.functions.invoke("validateNewsApiKey", { token });
      if (res.data?.valid) {
        setStatus("valid");
        localStorage.setItem(NEWS_API_KEY, token);
        setSaved(token);
      } else {
        setStatus("invalid");
        setErrMsg(res.data?.error || "Invalid token");
      }
    } catch {
      setStatus("invalid");
      setErrMsg("Validation failed — check your connection");
    }
  };

  const handleSave = () => {
    if (!inputVal.trim()) return;
    validate(inputVal.trim());
  };

  const handleRevoke = () => {
    localStorage.removeItem(NEWS_API_KEY);
    setSaved("");
    setInputVal("");
    setStatus(null);
    setErrMsg("");
  };

  const maskedKey = (k) => k ? `${k.slice(0, 8)}${"•".repeat(20)}${k.slice(-4)}` : "";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Key className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">News API Keys</h2>
          <p className="text-sm text-gray-500">Manage your TheNewsAPI.com access token for the Medical News feed</p>
        </div>
      </div>

      {/* Active Key Display */}
      {saved && (
        <div className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-700">TheNewsAPI.com — Active</p>
              <p className="text-xs text-green-600 font-mono mt-0.5">{maskedKey(saved)}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleRevoke} className="text-red-600 hover:bg-red-50 border-red-200 shrink-0">
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Revoke
          </Button>
        </div>
      )}

      {/* Add / Replace Key */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {saved ? "Replace API Token" : "Add API Token"}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); setStatus(null); setErrMsg(""); }}
              placeholder="Paste your TheNewsAPI.com token…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            onClick={handleSave}
            disabled={!inputVal.trim() || status === "validating"}
            className="bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            {status === "validating" ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Validating…</>
            ) : "Validate & Save"}
          </Button>
        </div>

        {/* Feedback */}
        {status === "valid" && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Token is valid and saved successfully!
          </div>
        )}
        {status === "invalid" && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errMsg || "Invalid token — please check and try again."}
          </div>
        )}

        <p className="text-xs text-gray-400">
          Get a free token at{" "}
          <a href="https://www.thenewsapi.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            thenewsapi.com
          </a>
          . Your token is stored locally in this browser session.
        </p>
      </div>
    </div>
  );
}

function WebzAPIKeySection() {
  const [inputVal, setInputVal] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [saved, setSaved] = useState(() => localStorage.getItem(WEBZIO_KEY) || "");

  const validate = async (token) => {
    setStatus("validating");
    setErrMsg("");
    try {
      const res = await base44.functions.invoke("validateWebzApiKey", { token });
      if (res.data?.valid) {
        setStatus("valid");
        localStorage.setItem(WEBZIO_KEY, token);
        setSaved(token);
      } else {
        setStatus("invalid");
        setErrMsg(res.data?.error || "Invalid token");
      }
    } catch {
      setStatus("invalid");
      setErrMsg("Validation failed — check your connection");
    }
  };

  const handleSave = () => { if (inputVal.trim()) validate(inputVal.trim()); };
  const handleRevoke = () => {
    localStorage.removeItem(WEBZIO_KEY);
    setSaved(""); setInputVal(""); setStatus(null); setErrMsg("");
  };
  const maskedKey = (k) => k ? `${k.slice(0, 8)}${"•".repeat(20)}${k.slice(-4)}` : "";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
          <Key className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Webz.io News API</h2>
          <p className="text-sm text-gray-500">Access the Webz.io News API Lite for additional medical news coverage</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-700">Webz.io — Active</p>
              <p className="text-xs text-green-600 font-mono mt-0.5">{maskedKey(saved)}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleRevoke} className="text-red-600 hover:bg-red-50 border-red-200 shrink-0">
            <Trash2 className="w-3.5 h-3.5 mr-1" />Revoke
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">{saved ? "Replace API Token" : "Add API Token"}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); setStatus(null); setErrMsg(""); }}
              placeholder="Paste your Webz.io token…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={handleSave} disabled={!inputVal.trim() || status === "validating"} className="bg-purple-600 hover:bg-purple-700 shrink-0">
            {status === "validating" ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Validating…</> : "Validate & Save"}
          </Button>
        </div>

        {status === "valid" && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />Token is valid and saved successfully!
          </div>
        )}
        {status === "invalid" && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{errMsg || "Invalid token — please check and try again."}
          </div>
        )}

        <p className="text-xs text-gray-400">
          Get a free token at{" "}
          <a href="https://webz.io" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">webz.io</a>
          . Your token is stored locally in this browser session.
        </p>
      </div>
    </div>
  );
}

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

      {/* News API Keys */}
      <NewsAPIKeySection />

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