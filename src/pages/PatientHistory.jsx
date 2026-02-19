import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, Calendar, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PatientHistory() {
  const [searchParams] = useSearchParams();
  const patientName = searchParams.get("patient");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["patientHistory", patientName],
    queryFn: async () => {
      if (!patientName) return [];
      const allNotes = await base44.entities.ClinicalNote.list();
      return allNotes
        .filter(n => n.patient_name === patientName)
        .sort((a, b) => new Date(b.date_of_visit || b.created_date) - new Date(a.date_of_visit || a.created_date));
    },
    enabled: !!patientName,
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "finalized":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "draft":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "amended":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  if (!patientName) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Patient Selected</h2>
        <p className="text-slate-600">Return to the Patient Dashboard to view history.</p>
        <Link to={createPageUrl("PatientDashboard")}>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link to={createPageUrl("PatientDashboard")}>
          <Button variant="outline" size="sm" className="gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{patientName}</h1>
        <p className="text-slate-600 mt-1">Clinical Note History</p>
      </motion.div>

      {/* Notes List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : notes.length === 0 ? (
        <Card className="bg-white border border-slate-200 text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No clinical notes found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note, idx) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={createPageUrl(`NoteDetail?id=${note.id}`)}>
                <Card className="bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-900">
                          {note.date_of_visit 
                            ? format(new Date(note.date_of_visit), "MMM d, yyyy") 
                            : format(new Date(note.created_date), "MMM d, yyyy")}
                        </span>
                        <Badge className={`text-xs border ${getStatusColor(note.status)}`}>
                          {note.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {note.chief_complaint || note.summary || "No summary available"}
                      </p>
                      {note.note_type && (
                        <p className="text-xs text-slate-500 mt-2">
                          Type: <span className="font-medium">{note.note_type.replace(/_/g, " ")}</span>
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}