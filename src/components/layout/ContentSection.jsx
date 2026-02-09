import React from "react";
import { motion } from "framer-motion";

export default function ContentSection({ 
  title, 
  description, 
  children, 
  icon: Icon,
  className = "" 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}
    >
      {(title || description || Icon) && (
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-slate-400" />}
            <div>
              {title && (
                <h2 className="font-semibold text-slate-900 text-lg">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-slate-600 mt-0.5">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </motion.div>
  );
}