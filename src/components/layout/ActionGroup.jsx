import React from "react";
import { motion } from "framer-motion";

export default function ActionGroup({ 
  title, 
  description, 
  actions = [], 
  variant = "default",
  className = "" 
}) {
  const variantStyles = {
    default: "bg-white border border-slate-200",
    secondary: "bg-slate-50 border border-slate-200",
    accent: "bg-blue-50 border border-blue-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 sm:p-6 ${variantStyles[variant]} ${className}`}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-slate-600 mt-1">{description}</p>
          )}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {actions}
      </div>
    </motion.div>
  );
}