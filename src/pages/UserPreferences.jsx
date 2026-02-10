import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function UserPreferences() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const userPrefs = currentUser?.preferences || {
          clock_face_style: 'digital',
          dashboard_layout: '2x2',
          active_widgets: ['quicklinks', 'stats', 'recentnotes', 'news'],
          color_theme: 'light',
          notifications_email: true,
          notifications_inapp: true
        };
        setPreferences(userPrefs);
      } catch (error) {
        toast.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ preferences });
      setShowSuccess(true);
      toast.success('Preferences saved successfully');
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setShowSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">User Preferences</h1>
          <p className="text-slate-600">Customize your application experience</p>
        </div>

        <div className="space-y-6">
          {/* Dashboard Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Dashboard</h2>
              <p className="text-sm text-slate-600">Configure your dashboard experience</p>
            </div>

            <div className="space-y-4">
              {/* Dashboard Layout */}
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-3 block">
                  Default Layout
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { value: '2x2', label: '2x2 Grid' },
                    { value: '3x3', label: '3x3 Grid' },
                    { value: '4x4', label: '4x4 Grid' },
                    { value: '6x6', label: '6x6 Grid' },
                    { value: 'horizontal', label: 'Horizontal' }
                  ].map(layout => (
                    <button
                      key={layout.value}
                      onClick={() => updatePreference('dashboard_layout', layout.value)}
                      className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                        preferences?.dashboard_layout === layout.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clock Face Style */}
              <div className="border-t border-slate-100 pt-4">
                <label className="text-sm font-semibold text-slate-900 mb-3 block">
                  Clock Face Style
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { value: 'digital', label: 'Digital' },
                    { value: 'analog', label: 'Analog' },
                    { value: 'minimal', label: 'Minimal' },
                    { value: 'binary', label: 'Binary' }
                  ].map(style => (
                    <button
                      key={style.value}
                      onClick={() => updatePreference('clock_face_style', style.value)}
                      className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                        preferences?.clock_face_style === style.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Theme Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Appearance</h2>
              <p className="text-sm text-slate-600">Customize how the app looks</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900 mb-3 block">
                Color Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: '☀️ Light' },
                  { value: 'dark', label: '🌙 Dark' },
                  { value: 'auto', label: '🔄 Auto' }
                ].map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => updatePreference('color_theme', theme.value)}
                    className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      preferences?.color_theme === theme.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Notifications</h2>
              <p className="text-sm text-slate-600">Manage how you receive updates</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Email Notifications</p>
                  <p className="text-xs text-slate-600 mt-1">Receive updates via email</p>
                </div>
                <Switch
                  checked={preferences?.notifications_email}
                  onCheckedChange={(checked) => updatePreference('notifications_email', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">In-App Notifications</p>
                  <p className="text-xs text-slate-600 mt-1">Receive notifications in the app</p>
                </div>
                <Switch
                  checked={preferences?.notifications_inapp}
                  onCheckedChange={(checked) => updatePreference('notifications_inapp', checked)}
                />
              </div>
            </div>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Account</h2>
              <p className="text-sm text-slate-600">Your account information</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Full Name</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{user?.full_name}</p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-600 uppercase tracking-wide">Email</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{user?.email}</p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-600 uppercase tracking-wide">Role</p>
                <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">{user?.role}</p>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : showSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}