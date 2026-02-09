import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PageHeader({ 
  title, 
  description, 
  actions = [], 
  breadcrumb 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-slate-200 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {breadcrumb && (
          <nav className="flex items-center gap-2 text-sm text-slate-600 mb-3">
            {breadcrumb}
          </nav>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {description && (
              <p className="text-sm text-slate-600 mt-1">{description}</p>
            )}
          </div>
          
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}