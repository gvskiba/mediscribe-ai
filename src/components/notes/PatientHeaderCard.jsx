import React from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Hash } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import InlineSectionAI from "../ai/InlineSectionAI";
import NoteQuickFind from "./NoteQuickFind";

export default function PatientHeaderCard({ note, noteId, queryClient, setLastSaved, onNavigate }) {
  const avatarLetter = note.patient_age 
    ? note.patient_age[0] 
    : (note.patient_name && note.patient_name !== "New Patient" ? note.patient_name[0] : "?");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{avatarLetter?.toUpperCase()}</span>
        </div>

        {/* Age */}
        <input
          type="text"
          value={note.patient_age || ""}
          onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, patient_age: e.target.value }))}
          onBlur={async (e) => { await base44.entities.ClinicalNote.update(noteId, { patient_age: e.target.value }); }}
          placeholder="Age"
          className="w-14 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-400 text-center"
        />

        {/* Gender */}
        <select
          value={note.patient_gender || ""}
          onChange={async (e) => {
            queryClient.setQueryData(["note", noteId], (old) => ({ ...old, patient_gender: e.target.value }));
            await base44.entities.ClinicalNote.update(noteId, { patient_gender: e.target.value });
          }}
          className="text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-400"
        >
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        {/* Optional patient name - shown if set */}
        <input
          type="text"
          value={note.patient_name && note.patient_name !== "New Patient" ? note.patient_name : ""}
          onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, patient_name: e.target.value }))}
          onBlur={async (e) => {
            await base44.entities.ClinicalNote.update(noteId, { patient_name: e.target.value });
            if (setLastSaved) setLastSaved(new Date().toISOString());
          }}
          placeholder="Patient name (optional)"
          className="flex-1 text-sm text-slate-600 bg-transparent border-0 outline-none focus:ring-0 min-w-0 placeholder:text-slate-300"
        />

        {/* Right: date/time/status */}
        <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {note.date_of_visit ? format(new Date(note.date_of_visit), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {note.time_of_visit || format(new Date(), "h:mm a")}
          </span>
          {note.patient_id && (
            <span className="hidden sm:flex items-center gap-1"><Hash className="w-3 h-3" />{note.patient_id}</span>
          )}
          <Badge className={`text-xs px-1.5 py-0 ${note.status === 'finalized' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'} border`}>
            {note.status || "draft"}
          </Badge>
        </div>
      </div>

      {/* Chief Complaint row */}
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex-shrink-0">CC</span>
        <div className="w-px h-3 bg-slate-200 flex-shrink-0" />
        <input
          type="text"
          value={note.chief_complaint || ""}
          onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, chief_complaint: e.target.value }))}
          onBlur={async (e) => { await base44.entities.ClinicalNote.update(noteId, { chief_complaint: e.target.value }); }}
          placeholder="Chief complaint — primary reason for visit..."
          className="flex-1 text-xs text-slate-700 placeholder:text-slate-400 bg-transparent border-0 outline-none focus:ring-0"
          maxLength={200}
        />
        <InlineSectionAI
          type="chief_complaint"
          note={note}
          onApply={async (val) => {
            await base44.entities.ClinicalNote.update(noteId, { chief_complaint: val });
            queryClient.invalidateQueries({ queryKey: ["note", noteId] });
          }}
        />
      </div>
    </motion.div>
  );
}