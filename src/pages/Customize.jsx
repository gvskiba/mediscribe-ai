import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Check, Palette, LayoutDashboard, Bell, User, Sliders, Monitor, Grid3X3, Clock, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'notes', label: 'Notes & Editor', icon: Sliders },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: User },
];

const COLOR_THEMES = [
  { value: 'blue', label: 'Ocean Blue', primary: '#2563eb', secondary: '#dbeafe' },
  { value: 'purple', label: 'Royal Purple', primary: '#7c3aed', secondary: '#ede9fe' },
  { value: 'emerald', label: 'Emerald', primary: '#059669', secondary: '#d1fae5' },
  { value: 'rose', label: 'Rose', primary: '#e11d48', secondary: '#ffe4e6' },
  { value: 'slate', label: 'Classic Slate', primary: '#475569', secondary: '#f1f5f9' },
];

export default function Customize() {
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [activeSection, setActiveSection] = useState('appearance');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openNoteId] = useState(() => localStorage.getItem('currentOpenNote'));

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setPrefs({
        color_theme: 'blue',
        font_size: 'medium',
        compact_mode: false,
        sidebar_collapsed: false,
        dashboard_layout: '2x2',
        clock_face_style: 'digital',
        active_widgets: ['quicklinks', 'stats', 'recentnotes', 'news'],
        default_note_type: 'progress_note',
        auto_save: true,
        spell_check: true,
        ai_suggestions: true,
        show_word_count: false,
        notifications_email: true,
        notifications_inapp: true,
        notify_on_save: false,
        ...(u?.preferences || {})
      });
    }).finally(() => setLoading(false));
  }, []);

  const set = (key, value) => {
    setPrefs(p => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ preferences: prefs });
      setSaved(true);
      toast.success('Preferences saved!');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !prefs) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Customize</h1>
          <p className="text-slate-500">Personalize your Notrya AI experience</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <div className="w-48 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    activeSection === s.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <s.icon className="w-4 h-4 flex-shrink-0" />
                  {s.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-4">

            {/* APPEARANCE */}
            {activeSection === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card title="Color Theme" subtitle="Choose your accent color">
                  <div className="grid grid-cols-5 gap-3">
                    {COLOR_THEMES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => set('color_theme', t.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          prefs.color_theme === t.value ? 'border-slate-700 shadow-md scale-105' : 'border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full shadow" style={{ background: t.primary }} />
                        <span className="text-xs font-medium text-slate-700">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card title="Font Size" subtitle="Adjust text size across the app">
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map(s => (
                      <OptionButton key={s} value={s} active={prefs.font_size === s} onClick={() => set('font_size', s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </OptionButton>
                    ))}
                  </div>
                </Card>

                <Card title="Display" subtitle="Layout density preferences">
                  <Toggle label="Compact Mode" desc="Reduce padding and spacing throughout the app" checked={prefs.compact_mode} onChange={v => set('compact_mode', v)} />
                </Card>
              </motion.div>
            )}

            {/* DASHBOARD */}
            {activeSection === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card title="Layout" subtitle="Choose your default dashboard grid">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {[
                      { value: '2x2', label: '2×2' },
                      { value: '3x3', label: '3×3' },
                      { value: '4x4', label: '4×4' },
                      { value: '6x6', label: '6×6' },
                      { value: 'horizontal', label: 'Horizontal' },
                    ].map(l => (
                      <OptionButton key={l.value} value={l.value} active={prefs.dashboard_layout === l.value} onClick={() => set('dashboard_layout', l.value)}>
                        {l.label}
                      </OptionButton>
                    ))}
                  </div>
                </Card>

                <Card title="Clock Widget" subtitle="Choose your clock display style">
                  <div className="grid grid-cols-4 gap-2">
                    {['digital', 'analog', 'minimal', 'binary'].map(s => (
                      <OptionButton key={s} value={s} active={prefs.clock_face_style === s} onClick={() => set('clock_face_style', s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </OptionButton>
                    ))}
                  </div>
                </Card>

                <Card title="Widgets" subtitle="Choose which widgets appear on your dashboard">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'quicklinks', label: 'Quick Links' },
                      { id: 'stats', label: 'Stats Overview' },
                      { id: 'recentnotes', label: 'Recent Notes' },
                      { id: 'news', label: 'Medical News' },
                      { id: 'guidelines', label: 'Guidelines' },
                      { id: 'tasks', label: 'Task List' },
                      { id: 'calendar', label: 'Calendar' },
                      { id: 'progress', label: 'Progress Tracker' },
                    ].map(w => {
                      const active = (prefs.active_widgets || []).includes(w.id);
                      return (
                        <button
                          key={w.id}
                          onClick={() => {
                            const cur = prefs.active_widgets || [];
                            set('active_widgets', active ? cur.filter(x => x !== w.id) : [...cur, w.id]);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                            active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* NOTES */}
            {activeSection === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card title="Default Note Type" subtitle="Pre-select note type when creating new notes">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { value: 'progress_note', label: 'Progress Note' },
                      { value: 'h_and_p', label: 'H&P' },
                      { value: 'discharge_summary', label: 'Discharge Summary' },
                      { value: 'consult', label: 'Consult Note' },
                      { value: 'procedure_note', label: 'Procedure Note' },
                    ].map(t => (
                      <OptionButton key={t.value} value={t.value} active={prefs.default_note_type === t.value} onClick={() => set('default_note_type', t.value)}>
                        {t.label}
                      </OptionButton>
                    ))}
                  </div>
                </Card>

                <Card title="Editor Behavior" subtitle="Configure how the note editor works">
                  <div className="space-y-3">
                    <Toggle label="Auto-Save" desc="Automatically save notes while editing" checked={prefs.auto_save} onChange={v => set('auto_save', v)} />
                    <Toggle label="Spell Check" desc="Highlight spelling errors in notes" checked={prefs.spell_check} onChange={v => set('spell_check', v)} />
                    <Toggle label="AI Suggestions" desc="Show inline AI suggestions while typing" checked={prefs.ai_suggestions} onChange={v => set('ai_suggestions', v)} />
                    <Toggle label="Word Count" desc="Show word count in the note editor" checked={prefs.show_word_count} onChange={v => set('show_word_count', v)} />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card title="Notification Channels" subtitle="Choose how you receive alerts">
                  <div className="space-y-3">
                    <Toggle label="Email Notifications" desc="Receive updates and reminders by email" checked={prefs.notifications_email} onChange={v => set('notifications_email', v)} />
                    <Toggle label="In-App Notifications" desc="Show notification banners inside the app" checked={prefs.notifications_inapp} onChange={v => set('notifications_inapp', v)} />
                    <Toggle label="Save Confirmation" desc="Show a toast message whenever a note is saved" checked={prefs.notify_on_save} onChange={v => set('notify_on_save', v)} />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ACCOUNT */}
            {activeSection === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card title="Account Information" subtitle="Your profile details">
                  <div className="space-y-4">
                    {[
                      { label: 'Full Name', value: user?.full_name },
                      { label: 'Email', value: user?.email },
                      { label: 'Role', value: user?.role },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500">{row.label}</span>
                        <span className="text-sm font-semibold text-slate-900 capitalize">{row.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Session" subtitle="Manage your active session">
                  <button
                    onClick={() => base44.auth.logout()}
                    className="w-full px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </Card>
              </motion.div>
            )}

            {/* NOTES CUSTOMIZATION */}
            {activeSection === 'notes' && (
              <motion.div key="notes-extend" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card title="Tab Groups & Customization" subtitle="Customize note-taking interface tabs and groups">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-3">Tab Organization</p>
                      <p className="text-sm text-slate-600 mb-4">You can customize how tabs appear in the clinical note editor. Changes are saved automatically in the Note Detail page when you click the customize button.</p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900"><strong>How to customize:</strong></p>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                          <li>• Open any clinical note</li>
                          <li>• Click the <strong>⚙️ Customize</strong> button in the bottom-right tab bar</li>
                          <li>• Drag to reorder tab groups and tabs</li>
                          <li>• Create new custom tabs in any group</li>
                          <li>• Rename or delete custom groups</li>
                          <li>• Click <strong>Done</strong> to save changes</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">Default Tab Groups</p>
                      <div className="space-y-2">
                        {[
                          { name: 'History', color: 'blue', tabs: ['HPI & Intake', 'Chief Complaint', 'Review of Systems'] },
                          { name: 'Physical Exam', color: 'purple', tabs: ['Physical Exam'] },
                          { name: 'Assessment', color: 'emerald', tabs: ['Analysis', 'Calculators', 'Laboratory', 'Imaging', 'MDM', 'Diagnoses'] },
                          { name: 'Plan', color: 'rose', tabs: ['Treatment Plan', 'Medications', 'Procedures', 'Guidelines'] },
                          { name: 'Finalization', color: 'amber', tabs: ['Final Impression', 'Clinical Note', 'Summary', 'Patient Education', 'Research', 'AI Assistant'] },
                        ].map((group, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-${group.color}-500`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{group.name}</p>
                              <p className="text-xs text-slate-500 mt-1">{group.tabs.join(', ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-amber-900">💡 Pro Tip</p>
                      <p className="text-sm text-amber-800 mt-1">Create custom tab groups to organize notes by specialty, patient type, or workflow. Your customization is persistent and will apply to all new notes you create.</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Save */}
            {activeSection !== 'account' && (
              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {isSaving ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</>
                  ) : saved ? (
                    <><Check className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function OptionButton({ value, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
        active ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <Switch checked={!!checked} onCheckedChange={onChange} />
    </div>
  );
}