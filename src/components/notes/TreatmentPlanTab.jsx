import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus, Check, ArrowLeft, Loader2, Sparkles, Pill, FlaskConical,
  Scan, User, ClipboardList, Search, X, ChevronDown, ChevronRight,
  Edit3, Save, Trash2, FileText
} from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

// ── Common Labs Database ─────────────────────────────────────────────────────
const COMMON_LABS = [
  { name: "Complete Blood Count (CBC)", category: "Hematology" },
  { name: "Basic Metabolic Panel (BMP)", category: "Chemistry" },
  { name: "Comprehensive Metabolic Panel (CMP)", category: "Chemistry" },
  { name: "Hemoglobin A1c (HbA1c)", category: "Endocrine" },
  { name: "Lipid Panel", category: "Cardiovascular" },
  { name: "Thyroid Stimulating Hormone (TSH)", category: "Endocrine" },
  { name: "Free T4", category: "Endocrine" },
  { name: "Urinalysis (UA)", category: "Renal" },
  { name: "Urine Culture", category: "Microbiology" },
  { name: "Blood Culture x2", category: "Microbiology" },
  { name: "Prothrombin Time / INR", category: "Coagulation" },
  { name: "Partial Thromboplastin Time (PTT)", category: "Coagulation" },
  { name: "B-type Natriuretic Peptide (BNP)", category: "Cardiovascular" },
  { name: "Troponin I / T", category: "Cardiovascular" },
  { name: "D-dimer", category: "Coagulation" },
  { name: "Lactate", category: "Critical Care" },
  { name: "Arterial Blood Gas (ABG)", category: "Pulmonary" },
  { name: "Magnesium", category: "Chemistry" },
  { name: "Phosphorus", category: "Chemistry" },
  { name: "Uric Acid", category: "Chemistry" },
  { name: "Ferritin", category: "Hematology" },
  { name: "Iron / TIBC", category: "Hematology" },
  { name: "Vitamin D (25-OH)", category: "Endocrine" },
  { name: "Vitamin B12", category: "Hematology" },
  { name: "Folate", category: "Hematology" },
  { name: "Hepatic Function Panel (LFTs)", category: "Hepatic" },
  { name: "C-Reactive Protein (CRP)", category: "Inflammatory" },
  { name: "Erythrocyte Sedimentation Rate (ESR)", category: "Inflammatory" },
  { name: "ANA Screen", category: "Rheumatology" },
  { name: "Rheumatoid Factor (RF)", category: "Rheumatology" },
  { name: "Anti-dsDNA", category: "Rheumatology" },
  { name: "PSA (Prostate Specific Antigen)", category: "Oncology" },
  { name: "CEA", category: "Oncology" },
  { name: "CA-125", category: "Oncology" },
  { name: "Hemoccult / FOBT", category: "GI" },
  { name: "Stool Culture", category: "GI" },
  { name: "H. pylori Antigen (stool)", category: "GI" },
  { name: "Urine Protein/Creatinine Ratio", category: "Renal" },
  { name: "eGFR / Creatinine", category: "Renal" },
  { name: "Cortisol (AM)", category: "Endocrine" },
  { name: "HIV Screen (4th gen)", category: "Infectious Disease" },
  { name: "HCV Antibody", category: "Infectious Disease" },
  { name: "HBsAg / HBsAb", category: "Infectious Disease" },
  { name: "RPR / VDRL", category: "Infectious Disease" },
  { name: "Influenza A/B PCR", category: "Infectious Disease" },
  { name: "COVID-19 PCR", category: "Infectious Disease" },
  { name: "Strep A Rapid Antigen", category: "Infectious Disease" },
  { name: "Blood Alcohol Level", category: "Toxicology" },
  { name: "Urine Drug Screen", category: "Toxicology" },
  { name: "Digoxin Level", category: "Toxicology" },
  { name: "Vancomycin Trough", category: "Toxicology" },
];

// ── Common Imaging Database ──────────────────────────────────────────────────
const COMMON_IMAGING = [
  { name: "Chest X-ray (PA & Lateral)", category: "X-ray" },
  { name: "Chest X-ray (Portable AP)", category: "X-ray" },
  { name: "Abdominal X-ray (KUB)", category: "X-ray" },
  { name: "X-ray Left/Right Hand", category: "X-ray" },
  { name: "X-ray Left/Right Knee", category: "X-ray" },
  { name: "X-ray Left/Right Hip", category: "X-ray" },
  { name: "X-ray Lumbar Spine", category: "X-ray" },
  { name: "X-ray Cervical Spine", category: "X-ray" },
  { name: "CT Head without contrast", category: "CT" },
  { name: "CT Head with contrast", category: "CT" },
  { name: "CT Chest without contrast", category: "CT" },
  { name: "CT Chest with contrast (PE Protocol)", category: "CT" },
  { name: "CT Abdomen/Pelvis with contrast", category: "CT" },
  { name: "CT Abdomen/Pelvis without contrast", category: "CT" },
  { name: "CT Angiography Head/Neck", category: "CT" },
  { name: "CT Coronary Angiography", category: "CT" },
  { name: "CT Spine (Cervical/Thoracic/Lumbar)", category: "CT" },
  { name: "MRI Brain without contrast", category: "MRI" },
  { name: "MRI Brain with and without contrast", category: "MRI" },
  { name: "MRI Spine (Cervical/Thoracic/Lumbar)", category: "MRI" },
  { name: "MRI Left/Right Knee", category: "MRI" },
  { name: "MRI Left/Right Shoulder", category: "MRI" },
  { name: "MRI Abdomen/Pelvis", category: "MRI" },
  { name: "MRA Brain", category: "MRI" },
  { name: "Echocardiogram (TTE)", category: "Ultrasound" },
  { name: "Echocardiogram (TEE)", category: "Ultrasound" },
  { name: "Renal Ultrasound", category: "Ultrasound" },
  { name: "Abdominal Ultrasound (RUQ)", category: "Ultrasound" },
  { name: "Pelvic Ultrasound (Transabdominal)", category: "Ultrasound" },
  { name: "Carotid Duplex Ultrasound", category: "Ultrasound" },
  { name: "Lower Extremity Venous Duplex", category: "Ultrasound" },
  { name: "Thyroid Ultrasound", category: "Ultrasound" },
  { name: "Testicular Ultrasound", category: "Ultrasound" },
  { name: "Breast Ultrasound", category: "Ultrasound" },
  { name: "Nuclear Stress Test", category: "Nuclear" },
  { name: "Ventilation/Perfusion (V/Q) Scan", category: "Nuclear" },
  { name: "Bone Scan", category: "Nuclear" },
  { name: "PET Scan", category: "Nuclear" },
  { name: "DEXA Scan (Bone Density)", category: "Nuclear" },
  { name: "Mammogram (Screening)", category: "Breast" },
  { name: "Mammogram (Diagnostic)", category: "Breast" },
  { name: "Fluoroscopy Upper GI Series", category: "Fluoroscopy" },
  { name: "Barium Enema", category: "Fluoroscopy" },
];

// ── Section Config ────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "medications", label: "Medications", icon: Pill, color: "blue", placeholder: "e.g. Metformin 500mg PO BID" },
  { id: "labs", label: "Labs", icon: FlaskConical, color: "emerald", placeholder: "e.g. CBC, BMP, HbA1c" },
  { id: "imaging", label: "Imaging", icon: Scan, color: "purple", placeholder: "e.g. Chest X-ray PA/Lateral" },
  { id: "referrals", label: "Referrals", icon: User, color: "amber", placeholder: "e.g. Cardiology referral" },
  { id: "followup", label: "Follow-up", icon: ClipboardList, color: "teal", placeholder: "e.g. PCP follow-up in 2 weeks" },
  { id: "other", label: "Other", icon: FileText, color: "slate", placeholder: "Additional plan items..." },
];

const COLOR = {
  blue:    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700 border-blue-200", btn: "bg-blue-600 hover:bg-blue-700" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", btn: "bg-emerald-600 hover:bg-emerald-700" },
  purple:  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 border-purple-200", btn: "bg-purple-600 hover:bg-purple-700" },
  amber:   { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200", btn: "bg-amber-600 hover:bg-amber-700" },
  teal:    { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500", badge: "bg-teal-100 text-teal-700 border-teal-200", btn: "bg-teal-600 hover:bg-teal-700" },
  slate:   { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200", btn: "bg-slate-600 hover:bg-slate-700" },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function parsePlanToSections(planText) {
  const sections = { medications: [], labs: [], imaging: [], referrals: [], followup: [], other: [] };
  if (!planText) return sections;

  const lines = planText.split('\n').map(l => l.trim()).filter(Boolean);
  let currentSection = "other";

  for (const line of lines) {
    const stripped = line.replace(/^[•\-*]\s*/, "");
    const upper = stripped.toUpperCase();
    if (upper.includes("MEDICATION") || upper.includes("DRUG") || upper.includes("PRESCRIPTION")) { currentSection = "medications"; continue; }
    if (upper.includes("LAB") || upper.includes("BLOOD") || upper.includes("TEST")) { currentSection = "labs"; continue; }
    if (upper.includes("IMAGING") || upper.includes("RADIOLOGY") || upper.includes("SCAN") || upper.includes("X-RAY") || upper.includes("MRI") || upper.includes("CT ")) { currentSection = "imaging"; continue; }
    if (upper.includes("REFERRAL") || upper.includes("CONSULT")) { currentSection = "referrals"; continue; }
    if (upper.includes("FOLLOW") || upper.includes("RETURN")) { currentSection = "followup"; continue; }
    if (stripped && !stripped.match(/^[A-Z\s\/&:]+$/) && stripped.length > 2) {
      sections[currentSection].push(stripped);
    }
  }
  return sections;
}

function sectionsToPlainText(sections) {
  const parts = [];
  for (const sec of SECTIONS) {
    const items = sections[sec.id] || [];
    if (items.length === 0) continue;
    parts.push(`${sec.label.toUpperCase()}:\n${items.map(i => `• ${i}`).join('\n')}`);
  }
  return parts.join('\n\n');
}

// ── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal({ type, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const items = type === "labs" ? COMMON_LABS : COMMON_IMAGING;
  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = [...new Set(filtered.map(i => i.category))];
  const color = type === "labs" ? "emerald" : "purple";
  const c = COLOR[color];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`px-5 py-4 border-b border-slate-200 flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
            {type === "labs" ? <FlaskConical className={`w-4 h-4 ${c.text}`} /> : <Scan className={`w-4 h-4 ${c.text}`} />}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">Search Common {type === "labs" ? "Labs" : "Imaging"}</h3>
            <p className="text-xs text-slate-500">Click to add to plan</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${type}...`}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">{cat}</p>
              <div className="space-y-1">
                {filtered.filter(i => i.category === cat).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => { onAdd(item.name); onClose(); }}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-100 hover:${c.bg} hover:border-${c.border} hover:${c.text} text-slate-700 transition-all flex items-center justify-between group`}
                  >
                    <span>{item.name}</span>
                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No results for "{query}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Plan Section ─────────────────────────────────────────────────────────────
function PlanSection({ section, items, onAdd, onRemove, onSearchOpen }) {
  const [open, setOpen] = useState(true);
  const [newItem, setNewItem] = useState("");
  const c = COLOR[section.color];
  const Icon = section.icon;
  const showSearch = section.id === "labs" || section.id === "imaging";

  const handleAdd = () => {
    const val = newItem.trim();
    if (!val) return;
    onAdd(section.id, val);
    setNewItem("");
  };

  return (
    <div className={`bg-white rounded-xl border ${c.border} shadow-sm overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${c.text}`} />
          </div>
          <span className="text-sm font-semibold text-slate-800">{section.label}</span>
          {items.length > 0 && (
            <Badge className={`text-xs px-1.5 py-0 h-4 border ${c.badge}`}>{items.length}</Badge>
          )}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-2">
          {items.length === 0 && (
            <p className="text-xs text-slate-400 italic">No {section.label.toLowerCase()} added yet.</p>
          )}
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-slate-50">
              <div className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
              <span className="text-sm text-slate-700 flex-1">{item}</span>
              <button
                onClick={() => onRemove(section.id, idx)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add row */}
          <div className="flex gap-2 mt-2">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder={section.placeholder}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder:text-slate-400"
            />
            <Button size="sm" onClick={handleAdd} className={`${c.btn} text-white text-xs h-8 px-3 gap-1`}>
              <Plus className="w-3 h-3" />
            </Button>
            {showSearch && (
              <Button size="sm" variant="outline" onClick={() => onSearchOpen(section.id)} className="h-8 px-2 text-xs gap-1 border-slate-200">
                <Search className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Suggestion Card ────────────────────────────────────────────────────────
function AISuggestionCard({ suggestion, sectionId, onAdd, added }) {
  const sec = SECTIONS.find(s => s.id === sectionId);
  const c = COLOR[sec?.color || "slate"];
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${added ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"} transition-all`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
        <span className={`flex-1 truncate ${added ? "text-emerald-700" : "text-slate-700"}`}>{suggestion}</span>
      </div>
      <button
        onClick={() => !added && onAdd(suggestion)}
        disabled={added}
        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md border transition-all text-xs font-medium ${
          added ? "border-emerald-200 text-emerald-600 cursor-default" : "border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
        }`}
      >
        {added ? <><Check className="w-3 h-3" />Added</> : <><Plus className="w-3 h-3" />Add</>}
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TreatmentPlanTab({ note, noteId, queryClient, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [sections, setSections] = useState(() => parsePlanToSections(note?.plan));
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [addedAI, setAddedAI] = useState(new Set());
  const [searchModal, setSearchModal] = useState(null); // "labs" | "imaging" | null
  const [userSettings, setUserSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(s => setUserSettings(s));
  }, []);

  // Sync sections when note.plan changes externally
  useEffect(() => {
    if (note?.plan) setSections(parsePlanToSections(note.plan));
  }, [note?.id]);

  const addItem = (sectionId, item) => {
    setSections(prev => ({ ...prev, [sectionId]: [...(prev[sectionId] || []), item] }));
  };

  const removeItem = (sectionId, idx) => {
    setSections(prev => ({ ...prev, [sectionId]: prev[sectionId].filter((_, i) => i !== idx) }));
  };

  const savePlan = async () => {
    setSaving(true);
    const planText = sectionsToPlainText(sections);
    await base44.entities.ClinicalNote.update(noteId, { plan: planText });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    toast.success("Treatment plan saved");
    setSaving(false);
  };

  const generateAI = async () => {
    if (!note?.diagnoses?.length) { toast.error("Add diagnoses first"); return; }
    setLoading(true);
    setAiResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical AI assistant. Generate a detailed, evidence-based treatment plan for these diagnoses.

DIAGNOSES: ${note.diagnoses.join(", ")}
ASSESSMENT: ${note.assessment || "N/A"}
CURRENT MEDICATIONS: ${note.medications?.join(", ") || "None"}
ALLERGIES: ${note.allergies?.join(", ") || "None"}
SPECIALTY: ${userSettings?.clinical_settings?.medical_specialty?.replace(/_/g, " ") || "Internal Medicine"}

Provide specific, actionable items for each category. For labs, include exact test names. For imaging, include modality and body part.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            medications: { type: "array", items: { type: "string" } },
            labs: { type: "array", items: { type: "string" } },
            imaging: { type: "array", items: { type: "string" } },
            referrals: { type: "array", items: { type: "string" } },
            followup: { type: "array", items: { type: "string" } },
            other: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiResult(res);
    } catch {
      toast.error("Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const addFromAI = (sectionId, item) => {
    addItem(sectionId, item);
    setAddedAI(prev => new Set([...prev, `${sectionId}:${item}`]));
  };

  const addAllFromAI = () => {
    if (!aiResult) return;
    let count = 0;
    for (const sec of SECTIONS) {
      const items = aiResult[sec.id] || [];
      for (const item of items) {
        const key = `${sec.id}:${item}`;
        if (!addedAI.has(key)) {
          addItem(sec.id, item);
          setAddedAI(prev => new Set([...prev, key]));
          count++;
        }
      }
    }
    toast.success(`Added ${count} items from AI plan`);
  };

  const totalItems = Object.values(sections).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Treatment Plan</h2>
          <p className="text-xs text-slate-400 mt-0.5">Build your plan — add items manually or from AI suggestions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={savePlan}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs h-7 px-3"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Plan
          </Button>
        </div>
      </div>

      {/* AI Generator */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold text-amber-900">AI Treatment Plan Generator</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {note.diagnoses?.length ? `Based on ${note.diagnoses.length} diagnosis(es)` : "Add diagnoses to generate a plan"}
              {userSettings?.clinical_settings?.medical_specialty && ` · ${userSettings.clinical_settings.medical_specialty.replace(/_/g, " ")}`}
            </p>
          </div>
          <Button size="sm" onClick={generateAI} disabled={loading || !note.diagnoses?.length} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs h-7 px-3 flex-shrink-0">
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Generate</>}
          </Button>
        </div>

        {aiResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-800">AI Suggestions — click to add individual items or add all at once</p>
              <Button size="sm" variant="outline" onClick={addAllFromAI} className="h-6 px-2 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-100">
                <Plus className="w-3 h-3" /> Add All
              </Button>
            </div>
            {SECTIONS.map(sec => {
              const items = aiResult[sec.id] || [];
              if (!items.length) return null;
              return (
                <div key={sec.id}>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <sec.icon className="w-3 h-3" />{sec.label}
                  </p>
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <AISuggestionCard
                        key={i}
                        suggestion={item}
                        sectionId={sec.id}
                        onAdd={(val) => addFromAI(sec.id, val)}
                        added={addedAI.has(`${sec.id}:${item}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan Builder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">My Plan <span className="text-slate-400 normal-case font-normal">({totalItems} items)</span></p>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setSearchModal("labs")} className="h-6 px-2 text-xs gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Search className="w-3 h-3" /><FlaskConical className="w-3 h-3" />Labs
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSearchModal("imaging")} className="h-6 px-2 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50">
              <Search className="w-3 h-3" /><Scan className="w-3 h-3" />Imaging
            </Button>
          </div>
        </div>

        {SECTIONS.map(section => (
          <PlanSection
            key={section.id}
            section={section}
            items={sections[section.id] || []}
            onAdd={addItem}
            onRemove={removeItem}
            onSearchOpen={setSearchModal}
          />
        ))}
      </div>

      {/* Footer Nav */}
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2"><TabDataPreview tabId="treatment_plan" note={note} /><ClinicalNotePreviewButton note={note} /></div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}
          {!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}
        </div>
      </div>

      {/* Search Modal */}
      {searchModal && (
        <SearchModal
          type={searchModal}
          onAdd={(item) => addItem(searchModal, item)}
          onClose={() => setSearchModal(null)}
        />
      )}
    </div>
  );
}