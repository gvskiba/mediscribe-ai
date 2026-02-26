import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Plus, XCircle, Check, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import InlineSectionAI from "../ai/InlineSectionAI";
import ClinicalWorkflowAutomation from "./ClinicalWorkflowAutomation";
import AITextCompletion from "../ai/AITextCompletion";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

function formatPlanText(text) {
  if (!text) return null;

  // Split on section headers like "IMMEDIATE ACTIONS:", "MEDICATIONS:", etc.
  const sectionRegex = /([A-Z][A-Z\s\/&]+):\s*/g;
  const parts = text.split(sectionRegex).filter(p => p.trim());

  // If no sections detected, just split on • bullets
  if (parts.length <= 1) {
    const bullets = text.split(/•/).map(b => b.trim()).filter(Boolean);
    if (bullets.length <= 1) return <p className="text-sm text-slate-700 leading-relaxed">{text}</p>;
    return (
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Build header→content pairs
  const sections = [];
  for (let i = 0; i < parts.length; i += 2) {
    const header = parts[i]?.trim();
    const content = parts[i + 1]?.trim() || "";
    if (header) sections.push({ header, content });
  }

  const headerColors = {
    "IMMEDIATE ACTIONS": "text-red-700 bg-red-50 border-red-200",
    "MEDICATIONS": "text-blue-700 bg-blue-50 border-blue-200",
    "INTERVENTIONS": "text-purple-700 bg-purple-50 border-purple-200",
    "FOLLOW-UP PLAN": "text-green-700 bg-green-50 border-green-200",
    "FOLLOW UP": "text-green-700 bg-green-50 border-green-200",
    "PATIENT EDUCATION": "text-teal-700 bg-teal-50 border-teal-200",
    "RED FLAGS": "text-rose-700 bg-rose-50 border-rose-200",
    "TREATMENT PLAN": "text-amber-700 bg-amber-50 border-amber-200",
  };

  return (
    <div className="space-y-4">
      {sections.map(({ header, content }, idx) => {
        const colorClass = Object.entries(headerColors).find(([k]) => header.includes(k))?.[1] || "text-slate-700 bg-slate-50 border-slate-200";
        const isRedFlags = header.includes("RED FLAG");

        // Split on bullet characters or newlines, handle both • and \n- patterns
        const rawBullets = content
          .split(/\n?•\s*|\n?⚠️?\s*|\n-\s+/)
          .map(b => b.trim())
          .filter(b => b && b.toLowerCase() !== "none");

        return (
          <div key={idx} className="space-y-2">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wide ${colorClass}`}>
              {isRedFlags && "⚠️ "}{header}
            </div>
            {rawBullets.length === 0 ? (
              <p className="text-xs text-slate-400 ml-1">None documented</p>
            ) : (
              <ul className="space-y-2 ml-1">
                {rawBullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${isRedFlags ? "bg-rose-500" : "bg-amber-500"}`} />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TreatmentPlanTab({ note, noteId, queryClient, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await base44.auth.me();
      if (settings) {
        setUserSettings(settings);
      }
    };
    loadSettings();
  }, []);

  const generateAITreatmentPlan = async () => {
    if (!note?.diagnoses || note.diagnoses.length === 0) {
      toast.error("Add diagnoses first to generate treatment plan");
      return;
    }
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateSpecialtyAwareTreatmentPlan', {
        diagnoses: note.diagnoses,
        assessment: note.assessment || "",
        specialty: userSettings?.clinical_settings?.medical_specialty || "internal_medicine"
      });
      
      if (response.data) {
        const planText = `TREATMENT PLAN (${userSettings?.clinical_settings?.medical_specialty?.replace(/_/g, " ").toUpperCase() || "INTERNAL MEDICINE"})

IMMEDIATE ACTIONS:
${response.data.immediate_actions?.map(a => `• ${a}`).join('\n') || "None"}

MEDICATIONS:
${response.data.medications?.map(m => `• ${m}`).join('\n') || "None"}

INTERVENTIONS:
${response.data.interventions?.map(i => `• ${i}`).join('\n') || "None"}

FOLLOW-UP PLAN:
${response.data.follow_up?.map(f => `• ${f}`).join('\n') || "None"}

PATIENT EDUCATION:
${response.data.education?.map(e => `• ${e}`).join('\n') || "None"}

RED FLAGS:
${response.data.red_flags?.map(r => `⚠️  ${r}`).join('\n') || "None"}`;

        queryClient.setQueryData(["note", noteId], old => ({ ...old, plan: planText }));
        toast.success("Treatment plan generated for " + (userSettings?.clinical_settings?.medical_specialty?.replace(/_/g, " ") || "Internal Medicine"));
      }
    } catch (error) {
      console.error("Failed to generate treatment plan:", error);
      toast.error("Failed to generate treatment plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Treatment Plan</h2><p className="text-xs text-slate-400 mt-0.5">Review and edit the treatment approach</p></div>
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-sm font-semibold text-slate-800">Treatment Plan</span></div>
          <Button onClick={() => setEditOpen(true)} size="sm" variant="outline" className="text-xs h-6 px-2 gap-1 border-slate-200"><Settings className="w-3 h-3" />Edit</Button>
        </div>
        <div className="p-4">
          {note.plan ? (
            <div className="text-sm leading-relaxed">
              {formatPlanText(note.plan)}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400">No treatment plan yet.</p>
              <Button onClick={() => setEditOpen(true)} size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-6"><Plus className="w-3 h-3" />Add Plan</Button>
            </div>
          )}
        </div>
      </div>
      {/* AI shortcut */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs text-amber-800">Generate specialty-specific treatment plan using AI</p>
          {userSettings?.clinical_settings?.medical_specialty && (
            <p className="text-xs text-amber-600 mt-1">Specialty: {userSettings.clinical_settings.medical_specialty.replace(/_/g, ' ').toUpperCase()}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={generateAITreatmentPlan}
            disabled={loading || !note.diagnoses?.length}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-6"
          >
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Generate Plan</>}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openAISidebar', { detail: 'treatment' }));
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-6 flex-shrink-0"
          >
            <Sparkles className="w-3 h-3" />AI Hub
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2"><TabDataPreview tabId="treatment_plan" note={note} /><ClinicalNotePreviewButton note={note} /></div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}
          {!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
              <span className="text-sm font-bold text-slate-800">Edit Treatment Plan</span>
              <div className="flex items-center gap-2">
                <InlineSectionAI type="plan" note={note} onApply={async (val) => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: val })); await base44.entities.ClinicalNote.update(noteId, { plan: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
                <button onClick={() => setEditOpen(false)} className="p-1 rounded hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AITextCompletion
                field="plan"
                value={note.plan || ""}
                onChange={(val) => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: val })); }}
                note={note}
                placeholder="Document treatment plan..."
                className="w-full min-h-[300px] text-sm resize-none rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                minRows={12}
              />
              <ClinicalWorkflowAutomation note={note} noteId={noteId} onUpdateNote={async (updates) => { await base44.entities.ClinicalNote.update(noteId, updates); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 flex-shrink-0 bg-slate-50">
              <Button variant="ghost" onClick={() => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: "" })); }} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1 h-7"><X className="w-3 h-3" />Clear</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)} className="text-xs h-7">Cancel</Button>
                <Button onClick={async () => { await base44.entities.ClinicalNote.update(noteId, { plan: note.plan }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); setEditOpen(false); toast.success("Saved"); }} className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-7"><Check className="w-3 h-3" />Save</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}