import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Pill, Stethoscope, ClipboardList, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function StructuredNotePreview({ note, onFinalize, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">AI-Structured Note</h2>
          <p className="text-sm text-slate-500 mt-1">Review and finalize the structured note.</p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit} className="rounded-xl gap-2">
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          )}
          {onFinalize && (
            <Button onClick={onFinalize} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
              <Check className="w-4 h-4" /> Finalize
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Chief Complaint */}
        {note.chief_complaint && (
          <Section icon={Target} title="Chief Complaint" color="blue">
            <p className="text-slate-700 text-sm leading-relaxed">{note.chief_complaint}</p>
          </Section>
        )}

        {/* Assessment */}
        {note.assessment && (
          <Section icon={Stethoscope} title="Assessment" color="purple">
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{note.assessment}</p>
          </Section>
        )}

        {/* Plan */}
        {note.plan && (
          <Section icon={ClipboardList} title="Plan" color="emerald">
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{note.plan}</p>
          </Section>
        )}

        {/* Diagnoses */}
        {note.diagnoses?.length > 0 && (
          <Section icon={Target} title="Diagnoses" color="amber">
            <div className="flex flex-wrap gap-2">
              {note.diagnoses.map((d, i) => (
                <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
                  {d}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Medications */}
        {note.medications?.length > 0 && (
          <Section icon={Pill} title="Medications" color="rose">
            <div className="flex flex-wrap gap-2">
              {note.medications.map((m, i) => (
                <Badge key={i} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 px-3 py-1">
                  {m}
                </Badge>
              ))}
            </div>
          </Section>
        )}
      </div>
    </motion.div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="flex gap-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}