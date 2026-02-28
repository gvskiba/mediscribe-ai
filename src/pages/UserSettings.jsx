import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Save, Check, User, FileText, Brain, Settings,
  Activity, Stethoscope, Loader2, ChevronRight,
  Palette, LayoutDashboard, Bell, Sliders
} from "lucide-react";
import { toast } from "sonner";
import ROSDefaultsEditor from "../components/settings/ROSDefaultsEditor";
import PhysExamDefaultsEditor from "../components/settings/PhysExamDefaultsEditor";

const NOTE_TYPES = [
  { value: "progress_note", label: "Progress Note", desc: "Standard SOAP format" },
  { value: "h_and_p", label: "History & Physical", desc: "Comprehensive H&P" },
  { value: "discharge_summary", label: "Discharge Summary", desc: "Discharge documentation" },
  { value: "consult", label: "Consultation", desc: "Specialist consult note" },
  { value: "procedure_note", label: "Procedure Note", desc: "Procedural documentation" },
];

const AI_VERBOSITY = [
  { value: "concise", label: "Concise", desc: "Short, focused outputs" },
  { value: "standard", label: "Standard", desc: "Balanced detail level" },
  { value: "detailed", label: "Detailed", desc: "Comprehensive, thorough outputs" },
];

const SECTIONS = [
  { id: "clinical_defaults", label: "Clinical Defaults", icon: Stethoscope, color: "emerald" },
  { id: "note_preferences", label: "Note Preferences", icon: FileText, color: "blue" },
  { id: "ai_behavior", label: "AI Behavior", icon: Brain, color: "purple" },
  { id: "appearance", label: "Appearance", icon: Palette, color: "rose" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "blue" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "slate" },
  { id: "account", label: "Account", icon: User, color: "slate" },
];

const COLOR_THEMES = [
  { value: "blue", label: "Ocean Blue", primary: "#2563eb" },
  { value: "purple", label: "Royal Purple", primary: "#7c3aed" },
  { value: "emerald", label: "Emerald", primary: "#059669" },
  { value: "rose", label: "Rose", primary: "#e11d48" },
  { value: "slate", label: "Classic Slate", primary: "#475569" },
];

const MEDICAL_SPECIALTIES = [
  { value: "emergency_medicine", label: "Emergency Medicine", desc: "Fast-paced acute care" },
  { value: "internal_medicine", label: "Internal Medicine", desc: "General adult medicine" },
  { value: "family_medicine", label: "Family Medicine", desc: "Primary care" },
  { value: "pediatrics", label: "Pediatrics", desc: "Children's medicine" },
  { value: "cardiology", label: "Cardiology", desc: "Heart & vascular" },
  { value: "pulmonology", label: "Pulmonology", desc: "Respiratory medicine" },
  { value: "neurology", label: "Neurology", desc: "Nervous system" },
  { value: "psychiatry", label: "Psychiatry", desc: "Mental health" },
  { value: "surgery", label: "Surgery", desc: "Surgical specialties" },
  { value: "orthopedics", label: "Orthopedics", desc: "Bones & joints" },
];

const PROVIDER_TYPES = [
  { value: "md", label: "MD", desc: "Medical Doctor" },
  { value: "do", label: "DO", desc: "Doctor of Osteopathic Medicine" },
  { value: "pa", label: "PA", desc: "Physician Assistant" },
  { value: "np", label: "NP", desc: "Nurse Practitioner" },
  { value: "other", label: "Other", desc: "Other provider type" },
];

const DEFAULT_SETTINGS = {
  // Clinical defaults
  ros_defaults: null,
  physexam_defaults: null,
  // Note preferences
  default_note_type: "progress_note",
  default_template_id: null,
  auto_save: true,
  medical_specialty: "internal_medicine",
  provider_type: "md",
  // AI behavior
  ai_verbosity: "standard",
  ai_auto_fill_ros: true,
  ai_suggest_icd10: true,
  ai_differential_on_load: false,
  ai_guideline_suggestions: true,
};

function SettingSection({ id, title, subtitle, icon: Icon, color, active, onClick, children }) {
  const colorMap = {
    emerald: "border-l-emerald-500 bg-emerald-50 text-emerald-600",
    blue: "border-l-blue-500 bg-blue-50 text-blue-600",
    purple: "border-l-purple-500 bg-purple-50 text-purple-600",
    rose: "border-l-rose-500 bg-rose-50 text-rose-600",
    slate: "border-l-slate-400 bg-slate-100 text-slate-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${active ? "rotate-90" : ""}`} />
      </button>
      {active && (
        <div className={`border-t border-slate-100 border-l-4 ${colorMap[color].split(' ')[0]} px-5 py-4`}>
          {children}
        </div>
      )}
    </div>
  );
}

function ToggleSetting({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${checked ? 'text-green-600' : 'text-slate-400'}`}>
          {checked ? 'ON' : 'OFF'}
        </span>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );
}

export default function UserSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("clinical_defaults");
  const [templates, setTemplates] = useState([]);
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({ first_name: "", last_name: "", provider_type: "md", specialty: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const [currentUser, tpls] = await Promise.all([
          base44.auth.me(),
          base44.entities.NoteTemplate.list(),
        ]);
        setUser(currentUser);
        setTemplates(tpls || []);
        if (currentUser?.clinical_settings) {
          setSettings(prev => ({ ...prev, ...currentUser.clinical_settings }));
        }
        
        // Parse full_name into first and last
        const nameParts = (currentUser?.full_name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        setProfileData({
          first_name: firstName,
          last_name: lastName,
          provider_type: currentUser?.clinical_settings?.provider_type || "md",
          specialty: currentUser?.clinical_settings?.medical_specialty || "",
        });
        
        setPrefs({
          color_theme: "blue",
          font_size: "medium",
          compact_mode: false,
          dashboard_layout: "2x2",
          clock_face_style: "digital",
          active_widgets: ["quicklinks", "stats", "recentnotes", "news"],
          notifications_email: true,
          notifications_inapp: true,
          notify_on_save: false,
          ...(currentUser?.preferences || {}),
        });
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const updatePref = (key, value) => setPrefs(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ clinical_settings: settings, preferences: prefs });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const full_name = `${profileData.first_name} ${profileData.last_name}`.trim();
      const updatedSettings = {
        ...settings,
        provider_type: profileData.provider_type,
        medical_specialty: profileData.specialty,
      };
      await base44.auth.updateMe({
        full_name,
        clinical_settings: updatedSettings,
      });
      setUser(prev => ({
        ...prev,
        full_name,
        clinical_settings: updatedSettings,
      }));
      setSettings(updatedSettings);
      setProfileData(prev => ({
        ...prev,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        provider_type: profileData.provider_type,
        specialty: profileData.specialty,
      }));
      setEditProfile(false);
      toast.success("Profile updated");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id) => setActiveSection(prev => prev === id ? null : id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Personalize your clinical workflow</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      {/* 1. Clinical Defaults */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SettingSection
          id="clinical_defaults"
          title="Clinical Defaults"
          subtitle="Customize default text for ROS and Physical Exam sections"
          icon={Stethoscope}
          color="emerald"
          active={activeSection === "clinical_defaults"}
          onClick={() => toggleSection("clinical_defaults")}
        >
          <div className="space-y-5">
            {/* ROS Defaults */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Review of Systems — Normal Defaults</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click a system to edit its default "normal" text</p>
                </div>
              </div>
              <ROSDefaultsEditor
                defaults={settings.ros_defaults || {}}
                onChange={(val) => update("ros_defaults", val)}
                onSave={async (val) => {
                  const newSettings = { ...settings, ros_defaults: val };
                  await base44.auth.updateMe({ clinical_settings: newSettings });
                  toast.success("ROS section removed and saved");
                }}
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Physical Exam — Normal Defaults</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click a section to edit its default "normal" text</p>
                </div>
              </div>
              <PhysExamDefaultsEditor
                defaults={settings.physexam_defaults || {}}
                onChange={(val) => update("physexam_defaults", val)}
                onSave={async (val) => {
                  const newSettings = { ...settings, physexam_defaults: val };
                  await base44.auth.updateMe({ clinical_settings: newSettings });
                  toast.success("Exam section removed and saved");
                }}
              />
            </div>
          </div>
        </SettingSection>
      </motion.div>

      {/* 2. Note Preferences */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SettingSection
          id="note_preferences"
          title="Note Preferences"
          subtitle="Default note type, templates, and autosave behavior"
          icon={FileText}
          color="blue"
          active={activeSection === "note_preferences"}
          onClick={() => toggleSection("note_preferences")}
        >
          <div className="space-y-5">
            {/* Default Note Type */}
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">Default Note Type</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NOTE_TYPES.map(nt => (
                  <button
                    key={nt.value}
                    onClick={() => update("default_note_type", nt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                      settings.default_note_type === nt.value
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <p className="text-xs font-semibold">{nt.label}</p>
                    <p className={`text-xs mt-0.5 ${settings.default_note_type === nt.value ? "text-blue-100" : "text-slate-400"}`}>{nt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Template */}
            {templates.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-800 mb-3">Default Template</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => update("default_template_id", null)}
                    className={`w-full px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                      !settings.default_template_id
                        ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    No default template
                  </button>
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => update("default_template_id", t.id)}
                      className={`w-full px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                        settings.default_template_id === t.id
                          ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {t.name}
                      {t.specialty && <span className="text-slate-400 ml-1">· {t.specialty}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Specialty */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">Medical Specialty</p>
              <p className="text-xs text-slate-500 mb-3">AI will tailor differential diagnoses and treatment recommendations to this specialty</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MEDICAL_SPECIALTIES.map(spec => (
                  <button
                    key={spec.value}
                    onClick={() => update("medical_specialty", spec.value)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                      settings.medical_specialty === spec.value
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <p className="text-xs font-semibold">{spec.label}</p>
                    <p className={`text-xs mt-0.5 ${settings.medical_specialty === spec.value ? "text-blue-100" : "text-slate-400"}`}>{spec.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Autosave */}
            <div className="border-t border-slate-100 pt-4">
              <ToggleSetting
                label="Auto-save Notes"
                desc="Automatically save notes every 30 seconds"
                checked={settings.auto_save}
                onChange={(v) => update("auto_save", v)}
              />
            </div>
          </div>
        </SettingSection>
      </motion.div>

      {/* 3. AI Behavior */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SettingSection
          id="ai_behavior"
          title="AI Behavior"
          subtitle="Configure AI verbosity and feature automation"
          icon={Brain}
          color="purple"
          active={activeSection === "ai_behavior"}
          onClick={() => toggleSection("ai_behavior")}
        >
          <div className="space-y-5">
            {/* AI Verbosity */}
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">AI Output Verbosity</p>
              <div className="grid grid-cols-3 gap-2">
                {AI_VERBOSITY.map(v => (
                  <button
                    key={v.value}
                    onClick={() => update("ai_verbosity", v.value)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                      settings.ai_verbosity === v.value
                        ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-purple-300"
                    }`}
                  >
                    <p className="text-xs font-semibold">{v.label}</p>
                    <p className={`text-xs mt-0.5 ${settings.ai_verbosity === v.value ? "text-purple-100" : "text-slate-400"}`}>{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Feature Toggles */}
            <div className="border-t border-slate-100 pt-4 divide-y divide-slate-100">
              <ToggleSetting
                label="AI Auto-Fill ROS"
                desc="Automatically suggest ROS findings from clinical context"
                checked={settings.ai_auto_fill_ros}
                onChange={(v) => update("ai_auto_fill_ros", v)}
              />
              <ToggleSetting
                label="ICD-10 Suggestions"
                desc="Show AI-powered ICD-10 code recommendations"
                checked={settings.ai_suggest_icd10}
                onChange={(v) => update("ai_suggest_icd10", v)}
              />
              <ToggleSetting
                label="Auto-generate Differential on Load"
                desc="Generate differential diagnoses when a note is opened"
                checked={settings.ai_differential_on_load}
                onChange={(v) => update("ai_differential_on_load", v)}
              />
              <ToggleSetting
                label="Guideline Suggestions"
                desc="Show evidence-based guideline recommendations"
                checked={settings.ai_guideline_suggestions}
                onChange={(v) => update("ai_guideline_suggestions", v)}
              />
            </div>
          </div>
        </SettingSection>
      </motion.div>

      {/* 4. Appearance */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.175 }}>
        <SettingSection
          id="appearance"
          title="Appearance"
          subtitle="Color theme, font size, and display density"
          icon={Palette}
          color="rose"
          active={activeSection === "appearance"}
          onClick={() => toggleSection("appearance")}
        >
          {prefs && <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">Color Theme</p>
              <div className="flex gap-3 flex-wrap">
                {COLOR_THEMES.map(t => (
                  <button key={t.value} onClick={() => updatePref("color_theme", t.value)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${prefs.color_theme === t.value ? "border-slate-700 scale-105 shadow" : "border-transparent hover:border-slate-200"}`}>
                    <div className="w-7 h-7 rounded-full shadow" style={{ background: t.primary }} />
                    <span className="text-xs font-medium text-slate-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">Font Size</p>
              <div className="flex gap-2">
                {["small", "medium", "large"].map(s => (
                  <button key={s} onClick={() => updatePref("font_size", s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${prefs.font_size === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <ToggleSetting label="Compact Mode" desc="Reduce padding and spacing throughout the app" checked={prefs.compact_mode} onChange={v => updatePref("compact_mode", v)} />
            </div>
          </div>}
        </SettingSection>
      </motion.div>

      {/* 5. Dashboard */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <SettingSection
          id="dashboard"
          title="Dashboard"
          subtitle="Widgets, layout, and clock style"
          icon={LayoutDashboard}
          color="blue"
          active={activeSection === "dashboard"}
          onClick={() => toggleSection("dashboard")}
        >
          {prefs && <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">Dashboard Layout</p>
              <div className="flex gap-2 flex-wrap">
                {[{v:"2x2",l:"2×2"},{v:"3x3",l:"3×3"},{v:"4x4",l:"4×4"},{v:"6x6",l:"6×6"},{v:"horizontal",l:"Horizontal"}].map(o => (
                  <button key={o.v} onClick={() => updatePref("dashboard_layout", o.v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${prefs.dashboard_layout === o.v ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">Clock Style</p>
              <div className="flex gap-2 flex-wrap">
                {["digital","analog","minimal","binary"].map(s => (
                  <button key={s} onClick={() => updatePref("clock_face_style", s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${prefs.clock_face_style === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">Visible Widgets</p>
              <div className="grid grid-cols-2 gap-2">
                {[{id:"quicklinks",l:"Quick Links"},{id:"stats",l:"Stats Overview"},{id:"recentnotes",l:"Recent Notes"},{id:"news",l:"Medical News"},{id:"guidelines",l:"Guidelines"},{id:"tasks",l:"Task List"},{id:"calendar",l:"Calendar"},{id:"progress",l:"Progress Tracker"}].map(w => {
                  const active = (prefs.active_widgets || []).includes(w.id);
                  return (
                    <button key={w.id} onClick={() => { const cur = prefs.active_widgets || []; updatePref("active_widgets", active ? cur.filter(x => x !== w.id) : [...cur, w.id]); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${active ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-blue-500" : "bg-slate-300"}`} />
                      {w.l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>}
        </SettingSection>
      </motion.div>

      {/* 6. Notifications */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
        <SettingSection
          id="notifications"
          title="Notifications"
          subtitle="Control how and when you receive alerts"
          icon={Bell}
          color="slate"
          active={activeSection === "notifications"}
          onClick={() => toggleSection("notifications")}
        >
          {prefs && <div className="divide-y divide-slate-100">
            <ToggleSetting label="Email Notifications" desc="Receive updates and reminders by email" checked={prefs.notifications_email} onChange={v => updatePref("notifications_email", v)} />
            <ToggleSetting label="In-App Notifications" desc="Show notification banners inside the app" checked={prefs.notifications_inapp} onChange={v => updatePref("notifications_inapp", v)} />
            <ToggleSetting label="Save Confirmation" desc="Show a toast message whenever a note is saved" checked={prefs.notify_on_save} onChange={v => updatePref("notify_on_save", v)} />
          </div>}
        </SettingSection>
      </motion.div>

      {/* 7. Account */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SettingSection
          id="account"
          title="Account"
          subtitle="Your profile and provider information"
          icon={User}
          color="slate"
          active={activeSection === "account"}
          onClick={() => toggleSection("account")}
        >
          <div className="space-y-4">
            {!editProfile ? (
              <>
                <div className="space-y-3">
                  {[
                    { label: "Email", value: user?.email },
                    { label: "Role", value: user?.role },
                    { label: "First Name", value: profileData.first_name },
                    { label: "Last Name", value: profileData.last_name },
                    { label: "Provider Type", value: PROVIDER_TYPES.find(p => p.value === profileData.provider_type)?.label },
                    { label: "Specialty", value: MEDICAL_SPECIALTIES.find(s => s.value === profileData.specialty)?.label },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
                      <span className="text-sm font-semibold text-slate-900">{value || "—"}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setEditProfile(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Edit Profile
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData(p => ({ ...p, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData(p => ({ ...p, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-2">Provider Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROVIDER_TYPES.map(pt => (
                      <button
                        key={pt.value}
                        onClick={() => setProfileData(p => ({ ...p, provider_type: pt.value }))}
                        className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                          profileData.provider_type === pt.value
                            ? "bg-blue-600 border-blue-600 text-white font-medium"
                            : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                        }`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-2">Specialty</label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {MEDICAL_SPECIALTIES.map(spec => (
                      <button
                        key={spec.value}
                        onClick={() => setProfileData(p => ({ ...p, specialty: spec.value }))}
                        className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                          profileData.specialty === spec.value
                            ? "bg-blue-600 border-blue-600 text-white font-medium"
                            : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                        }`}
                      >
                        <p className="font-medium">{spec.label}</p>
                        <p className={profileData.specialty === spec.value ? "text-blue-100 text-xs" : "text-slate-400 text-xs"}>{spec.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setEditProfile(false)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                    Save Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SettingSection>
      </motion.div>

      {/* Bottom Save */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </motion.div>
    </div>
  );
}