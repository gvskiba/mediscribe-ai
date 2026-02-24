import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, ChevronDown, ChevronUp, Edit3, Copy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  {
    id: "subjective",
    label: "Subjective (S)",
    field: "history_of_present_illness",
    color: "blue",
    description: "HPI synthesized from chief complaint, raw notes, vitals & ROS",
    buildPrompt: (note) => {
      const vitals = buildVitalsSummary(note.vital_signs);
      return `You are an expert clinician. Draft a concise, professional Subjective (S) section for a SOAP note using the structured data below. Write fluent clinical prose — no headers, no bullet points, no markdown. 

CHIEF COMPLAINT: ${note.chief_complaint || "Not documented"}
RAW NOTES / TRANSCRIPT: ${note.raw_note || "None"}
HISTORY OF PRESENT ILLNESS: ${note.history_of_present_illness || "None"}
REVIEW OF SYSTEMS: ${typeof note.review_of_systems === 'string' ? note.review_of_systems : JSON.stringify(note.review_of_systems) || "None"}
VITAL SIGNS: ${vitals || "Not recorded"}
MEDICAL HISTORY: ${note.medical_history || "None"}
MEDICATIONS: ${(note.medications || []).join(", ") || "None"}
ALLERGIES: ${(note.allergies || []).join(", ") || "NKDA"}

Write 2-4 coherent paragraphs suitable for a clinical note's HPI/Subjective section. Include onset, character, associated symptoms, pertinent negatives, and relevant history. Do NOT include markdown formatting.`;
    }
  },
  {
    id: "objective",
    label: "Objective (O)",
    field: "physical_exam",
    color: "emerald",
    description: "Physical exam narrative synthesized from vitals & exam findings",
    buildPrompt: (note) => {
      const vitals = buildVitalsSummary(note.vital_signs);
      return `You are an expert clinician. Draft a concise, professional Objective (O) section for a SOAP note. Write fluent clinical prose — no markdown, no headers.

VITAL SIGNS: ${vitals || "Not recorded"}
PHYSICAL EXAM FINDINGS: ${note.physical_exam || "Not documented"}
LAB FINDINGS: ${note.lab_findings?.length ? note.lab_findings.map(l => `${l.test_name}: ${l.result} ${l.unit || ""} (${l.status})`).join("; ") : "None"}
IMAGING: ${note.imaging_findings?.length ? note.imaging_findings.map(i => `${i.study_type} ${i.location}: ${i.impression}`).join("; ") : "None"}

Write a well-structured objective section covering vitals and relevant exam findings. Integrate vitals naturally into the prose. Do NOT use markdown.`;
    }
  },
  {
    id: "assessment",
    label: "Assessment (A)",
    field: "assessment",
    color: "rose",
    description: "Clinical assessment synthesized from diagnoses, HPI & exam",
    buildPrompt: (note) => `You are an expert clinician. Draft a concise, professional Assessment (A) section for a SOAP note. Write fluent clinical prose — no markdown.

CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}
DIAGNOSES: ${(note.diagnoses || []).join(", ") || "Pending"}
HPI: ${note.history_of_present_illness || note.raw_note || "None"}
PHYSICAL EXAM: ${note.physical_exam || "None"}
LAB FINDINGS: ${note.lab_findings?.length ? note.lab_findings.map(l => `${l.test_name}: ${l.result} (${l.status})`).join("; ") : "None"}

Summarize the clinical picture, list working diagnoses with brief rationale, and note key supporting findings. 2-3 paragraphs. No markdown.`
  },
  {
    id: "plan",
    label: "Plan (P)",
    field: "plan",
    color: "amber",
    description: "Plan prose synthesized from treatment plan, medications & follow-up",
    buildPrompt: (note) => `You are an expert clinician. Draft a concise, professional Plan (P) section for a SOAP note. Write fluent clinical prose — no markdown.

DIAGNOSES: ${(note.diagnoses || []).join(", ") || "N/A"}
EXISTING TREATMENT PLAN: ${note.plan || "None"}
MEDICATIONS: ${(note.medications || []).join(", ") || "None"}
ASSESSMENT: ${note.assessment || "None"}
MDM: ${note.mdm || "None"}

Write an organized plan covering diagnostics, medications, referrals, patient education, and follow-up. 2-4 paragraphs. No markdown.`
  },
];

function buildVitalsSummary(vital_signs) {
  if (!vital_signs || typeof vital_signs !== "object") return "";
  const parts = [];
  const v = vital_signs;
  if (v.temperature?.value) parts.push(`Temp ${v.temperature.value}°${v.temperature.unit || "F"}`);
  if (v.heart_rate?.value) parts.push(`HR ${v.heart_rate.value} bpm`);
  if (v.blood_pressure?.systolic) parts.push(`BP ${v.blood_pressure.systolic}/${v.blood_pressure.diastolic} mmHg`);
  if (v.respiratory_rate?.value) parts.push(`RR ${v.respiratory_rate.value}/min`);
  if (v.oxygen_saturation?.value) parts.push(`SpO2 ${v.oxygen_saturation.value}%`);
  if (v.weight?.value) parts.push(`Wt ${v.weight.value} ${v.weight.unit || "lbs"}`);
  if (v.height?.value) parts.push(`Ht ${v.height.value} ${v.height.unit || "in"}`);
  return parts.join(", ");
}

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", btn: "bg-blue-600 hover:bg-blue-700", text: "text-blue-700" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700", text: "text-emerald-700" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-700", btn: "bg-rose-600 hover:bg-rose-700", text: "text-rose-700" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", btn: "bg-amber-600 hover:bg-amber-700", text: "text-amber-700" },
};

function SectionDrafter({ section, note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const c = colorMap[section.color];

  const generate = async () => {
    setLoading(true);
    setDraft("");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: section.buildPrompt(note),
        add_context_from_internet: false,
      });
      setDraft(typeof result === "string" ? result : JSON.stringify(result));
      setExpanded(true);
      setEditing(false);
    } catch {
      toast.error(`Failed to draft ${section.label}`);
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    await onUpdateNote({ [section.field]: draft });
    toast.success(`${section.label} applied to note`);
  };

  const copy = () => {
    navigator.clipboard.writeText(draft);
    toast.success("Copied to clipboard");
  };

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${c.bg} px-3 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${c.text}`}>{section.label}</span>
          <span className="text-xs text-slate-500 hidden sm:block">{section.description}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {draft && (
            <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600 p-0.5">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <Button
            size="sm"
            onClick={generate}
            disabled={loading}
            className={`${c.btn} text-white gap-1 text-xs h-6 px-2`}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {draft ? "Re-draft" : "Draft"}
          </Button>
        </div>
      </div>

      {/* Draft output */}
      <AnimatePresence>
        {draft && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {editing ? (
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[120px] text-xs resize-none border-slate-200 font-mono"
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{draft}</p>
              )}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                <Button size="sm" onClick={apply} className="bg-slate-800 hover:bg-slate-900 text-white gap-1 text-xs h-6 px-2">
                  <Check className="w-3 h-3" />Apply to Note
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(e => !e)} className="gap-1 text-xs h-6 px-2">
                  <Edit3 className="w-3 h-3" />{editing ? "Preview" : "Edit"}
                </Button>
                <button onClick={copy} className="text-slate-400 hover:text-slate-600 p-1">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AISectionDrafter({ note, onUpdateNote }) {
  const [draftingAll, setDraftingAll] = useState(false);
  const [allDrafts, setAllDrafts] = useState(null);

  const draftAll = async () => {
    setDraftingAll(true);
    setAllDrafts(null);
    try {
      const results = await Promise.all(
        SECTIONS.map(async (s) => {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: s.buildPrompt(note),
            add_context_from_internet: false,
          });
          return { field: s.field, label: s.label, text: typeof result === "string" ? result : JSON.stringify(result) };
        })
      );
      setAllDrafts(results);
      toast.success("All sections drafted");
    } catch {
      toast.error("Failed to draft all sections");
    } finally {
      setDraftingAll(false);
    }
  };

  const applyAll = async () => {
    if (!allDrafts) return;
    const updates = {};
    allDrafts.forEach(d => { updates[d.field] = d.text; });
    await onUpdateNote(updates);
    toast.success("All sections applied to note");
    setAllDrafts(null);
  };

  return (
    <div className="space-y-4">
      {/* Intro banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-800 leading-relaxed">
        Draft any SOAP section as clinical prose from your structured data (vitals, ROS, chief complaint, diagnoses). Each draft is editable before applying.
      </div>

      {/* Draft All button */}
      <Button
        onClick={draftAll}
        disabled={draftingAll}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
      >
        {draftingAll ? <><Loader2 className="w-4 h-4 animate-spin" />Drafting all sections...</> : <><Sparkles className="w-4 h-4" />Draft All SOAP Sections</>}
      </Button>

      {/* All-at-once result */}
      {allDrafts && (
        <div className="space-y-2">
          {allDrafts.map(d => (
            <div key={d.field} className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
              <p className="text-xs font-bold text-slate-700">{d.label}</p>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">{d.text}</p>
            </div>
          ))}
          <Button onClick={applyAll} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Check className="w-4 h-4" />Apply All to Note
          </Button>
        </div>
      )}

      <div className="border-t border-slate-100 pt-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Draft Individual Sections</p>
        <div className="space-y-3">
          {SECTIONS.map(s => (
            <SectionDrafter key={s.id} section={s} note={note} onUpdateNote={onUpdateNote} />
          ))}
        </div>
      </div>
    </div>
  );
}