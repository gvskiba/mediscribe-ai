import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { Activity, Trash2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function VitalSignsHistory({ vitalHistory = [], onAddToNote }) {
  if (!vitalHistory || vitalHistory.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No vital signs recorded yet</p>
        <p className="text-sm text-slate-500 mt-1">Vitals will appear here with timestamps when you save them</p>
      </div>
    );
  }

  const formatVitalValue = (field, vital) => {
    if (!vital || !vital.value) return "—";
    
    if (field === "blood_pressure") {
      return `${vital.systolic}/${vital.diastolic} ${vital.unit || "mmHg"}`;
    }
    return `${vital.value} ${vital.unit || ""}`.trim();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-slate-900">Recorded Vital Signs</h3>
        <Badge className="bg-emerald-100 text-emerald-800">{vitalHistory.length}</Badge>
      </div>

      <div className="space-y-3">
        {vitalHistory.map((entry, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-lg border-2 border-slate-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            {/* Header with timestamp */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Recorded {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {format(new Date(entry.timestamp), "MMM d, yyyy • h:mm a")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const vitalsText = Object.entries(entry.vitals)
                    .map(([key, vital]) => {
                      const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                      return `${label}: ${formatVitalValue(key, vital)}`;
                    })
                    .join("\n");
                  navigator.clipboard.writeText(vitalsText);
                  toast.success("Vitals copied to clipboard");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Vital signs grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(entry.vitals).map(([field, vital]) => {
                if (!vital || (vital.value === undefined && vital.systolic === undefined)) return null;
                
                const label = field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <div key={field} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatVitalValue(field, vital)}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}