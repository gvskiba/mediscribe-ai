import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Zap, Loader2, ArrowRight, AlertTriangle, Clock, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function WorkflowAutomationWidget() {
  const [recentNotes, setRecentNotes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecentNotes();
  }, []);

  const loadRecentNotes = async () => {
    try {
      const notes = await base44.entities.ClinicalNote.list("-updated_date", 5);
      const active = notes.filter(n => n.status === "draft" && (n.chief_complaint || n.diagnoses?.length));
      setRecentNotes(active.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    if (!recentNotes.length) return;
    setGenerating(true);
    try {
      const note = recentNotes[0];
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `For this clinical note, give 3 brief, specific workflow action suggestions.
Chief Complaint: ${note.chief_complaint || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Assessment: ${note.assessment || "N/A"}
Return 3 items: action (short, ≤10 words), urgency (routine/urgent/stat), category (lab/imaging/follow_up/referral/medication).`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  urgency: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });
      setSuggestions((result.suggestions || []).slice(0, 3).map(s => ({ ...s, noteId: note.id, noteName: note.patient_name })));
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const urgencyColor = {
    stat: "bg-red-100 text-red-700",
    urgent: "bg-amber-100 text-amber-700",
    routine: "bg-slate-100 text-slate-600",
  };

  const categoryIcon = {
    lab: "🧪", imaging: "🔬", follow_up: "🔄",
    referral: "👨‍⚕️", medication: "💊"
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : recentNotes.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No active draft notes found.
        </div>
      ) : (
        <>
          {/* Active Notes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Notes</p>
            {recentNotes.map(note => (
              <Link
                key={note.id}
                to={createPageUrl(`NoteDetail?id=${note.id}`)}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{note.patient_name || "Unnamed"}</p>
                    <p className="text-xs text-slate-500 truncate">{note.chief_complaint || "No chief complaint"}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* AI Suggestions */}
          {suggestions.length === 0 ? (
            <Button
              onClick={generateSuggestions}
              disabled={generating}
              size="sm"
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {generating ? "Analyzing..." : "Get AI Workflow Suggestions"}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-500" /> AI Suggestions for {suggestions[0]?.noteName}
              </p>
              {suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="text-base flex-shrink-0">{categoryIcon[s.category] || "📋"}</span>
                  <p className="text-xs text-slate-700 flex-1">{s.action}</p>
                  <Badge className={`text-xs ${urgencyColor[s.urgency] || urgencyColor.routine}`}>{s.urgency}</Badge>
                </motion.div>
              ))}
              <Link to={createPageUrl(`NoteDetail?id=${suggestions[0]?.noteId}`)}>
                <Button size="sm" variant="outline" className="w-full gap-2 text-violet-700 border-violet-300 hover:bg-violet-50 mt-1">
                  Open Full Workflow <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}