import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function UserPreferences() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">User Preferences</h1>
          <p className="text-slate-600">Your account information</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
      </motion.div>
    </div>
  );
}