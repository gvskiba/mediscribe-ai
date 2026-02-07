import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Pill, Activity, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientHistoryPanel({ history, loading, onApplyToNote }) {
  const [expanded, setExpanded] = useState(true);

  if (loading) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-100">
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading patient history...</span>
        </div>
      </Card>
    );
  }

  if (!history) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Patient History Summary</h3>
            <p className="text-xs text-slate-500">From {history.notes_reviewed} previous note(s)</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-blue-100"
          >
            <div className="p-4 space-y-4">
              {/* Chronic Conditions */}
              {history.chronic_conditions?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-slate-900">Chronic Conditions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.chronic_conditions.map((condition, idx) => (
                      <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies */}
              {history.allergies?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-slate-900">Allergies</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Medications */}
              {history.current_medications?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-slate-900">Current Medications</span>
                  </div>
                  <div className="space-y-1">
                    {history.current_medications.map((med, idx) => (
                      <div key={idx} className="text-sm text-slate-600 bg-white rounded px-2 py-1 border border-slate-200">
                        {med}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Procedures */}
              {history.past_procedures?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-900">Past Procedures</span>
                  </div>
                  <div className="space-y-1">
                    {history.past_procedures.map((proc, idx) => (
                      <div key={idx} className="text-sm text-slate-600 bg-white rounded px-2 py-1 border border-slate-200">
                        {proc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {onApplyToNote && (
                <Button
                  onClick={() => onApplyToNote(history)}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Apply History to Medical History Section
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}