import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, User } from "lucide-react";
import { motion } from "framer-motion";
import FollowUpSuggestions from "./FollowUpSuggestions";

export default function PatientSummary({ summary, patientName, onDownload, note, onAddToNote }) {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 overflow-hidden"
    >
      <div className="p-6 border-b border-indigo-100 bg-white/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Patient Summary</h3>
            <p className="text-sm text-slate-500">AI-generated overview</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="rounded-xl gap-2"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Overview */}
        {summary.overview && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Overview</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{summary.overview}</p>
          </div>
        )}

        {/* Key Diagnoses */}
        {summary.key_diagnoses && summary.key_diagnoses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Key Diagnoses</h4>
            <ul className="space-y-1">
              {summary.key_diagnoses.map((diagnosis, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{diagnosis}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Current Medications */}
        {summary.current_medications && summary.current_medications.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Current Medications</h4>
            <ul className="space-y-1">
              {summary.current_medications.map((med, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{med}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Plans */}
        {summary.follow_up_plans && summary.follow_up_plans.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Follow-up Plans</h4>
            <ul className="space-y-1 mb-3">
              {summary.follow_up_plans.map((plan, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{plan}</span>
                </li>
              ))}
            </ul>
            {note && (
              <div className="border border-indigo-100 rounded-xl bg-indigo-50/50 p-3">
                <p className="text-xs font-semibold text-indigo-800 mb-2">AI Follow-up Suggestions</p>
                <FollowUpSuggestions note={note} onAddToNote={onAddToNote} />
              </div>
            )}
          </div>
        )}

        {/* Critical Alerts */}
        {summary.critical_alerts && summary.critical_alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-2">⚠️ Critical Alerts</h4>
            <ul className="space-y-1">
              {summary.critical_alerts.map((alert, idx) => (
                <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}