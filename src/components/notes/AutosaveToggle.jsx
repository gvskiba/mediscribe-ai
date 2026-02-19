import React from "react";
import { motion } from "framer-motion";
import { Save, X } from "lucide-react";

export default function AutosaveToggle({ enabled, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-24 right-6 z-40 bg-white rounded-full shadow-xl border border-slate-200 p-1 flex items-center lg:top-28"
    >
      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          enabled
            ? "bg-emerald-500 text-white shadow-lg"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Save className="w-4 h-4" />
        <span className="text-xs font-semibold">Autosave On</span>
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          !enabled
            ? "bg-slate-400 text-white shadow-lg"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <X className="w-4 h-4" />
        <span className="text-xs font-semibold">Off</span>
      </button>
    </motion.div>
  );
}