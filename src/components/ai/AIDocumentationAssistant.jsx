import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, FileText, Code, Pill, ClipboardList, Wand2, Copy, Check, Mic, MicOff, Square, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AIDocumentationAssistant({ note, onUpdateNote }) {
  const [activeTab, setActiveTab] = useState("generate");
  const [rawInput, setRawInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState(null);
  const recognitionRef = useRef(null);

  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = rawInput;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interim = transcript;
        }
      }
      setRawInput(finalTranscript + (interim ? " " + interim : ""));
    };

    recognition.onerror = (e) => {
      toast.error("Dictation error: " + e.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    toast.success("Dictation started — speak now");
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    toast.success("Dictation stopped");
  };

  // 1. Generate Structured Clinical Note
  const generateStructuredNote = async () => {
    if (!rawInput.trim()) {
      toast.error("Please enter raw patient data");
      return;
    }

    setProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical scribe. Convert the following raw clinical data into a comprehensive, well-structured clinical note with all standard sections.

RAW INPUT:
${rawInput}

PATIENT CONTEXT:
- Name: ${note.patient_name || "Not provided"}
- Age: ${note.patient_age || "Not provided"}
- Gender: ${note.patient_gender || "Not provided"}

Generate a complete clinical note with:
- Chief Complaint
- History of Present Illness (detailed OLDCARTS)
- Past Medical History
- Review of Systems
- Physical Examination
- Assessment with differential diagnoses
- Treatment Plan with specific medications and dosing
- ICD-10 codes
- Follow-up recommendations

Be thorough, clinically accurate, and use professional medical documentation standards.`,
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint: { type: "string" },
            history_of_present_illness: { type: "string" },
            medical_history: { type: "string" },
            review_of_systems: { type: "string" },
            physical_exam: { type: "string" },
            assessment: { type: "string" },
            plan: { type: "string" },
            diagnoses: { type: "array", items: { type: "string" } },
            icd10_codes: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            medications: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedContent(result);
      toast.success("Structured note generated");
    } catch (error) {
      console.error("Failed to generate note:", error);
      toast.error("Failed to generate structured note");
    } finally {
      setProcessing(false);
    }
  };

  // 2. Summarize Patient History
  const summarizeHistory = async () => {
    setProcessing(true);
    try {
      const historyData = {
        medical_history: note.medical_history || "",
        previous_notes: "", // Could fetch from previous encounters
        medications: note.medications || [],
        allergies: note.allergies || [],
        diagnoses: note.diagnoses || []
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a concise, actionable summary of this patient's medical history. Focus on information critical for clinical decision-making.

PATIENT: ${note.patient_name}
AGE: ${note.patient_age || "Not specified"}

MEDICAL HISTORY:
${historyData.medical_history || "No documented history"}

CHRONIC CONDITIONS:
${historyData.diagnoses.join(", ") || "None"}

CURRENT MEDICATIONS:
${historyData.medications.join(", ") || "None"}

ALLERGIES:
${historyData.allergies.join(", ") || "None"}

Provide:
1. Key Medical Conditions (prioritized by severity/relevance)
2. Active Medications with indications
3. Important Allergies and Reactions
4. Risk Factors
5. Recent Significant Events
6. Recommendations for Current Visit`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_conditions: { type: "array", items: { type: "string" } },
            active_medications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            recent_events: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedContent(result);
      toast.success("Patient history summarized");
    } catch (error) {
      console.error("Failed to summarize:", error);
      toast.error("Failed to summarize patient history");
    } finally {
      setProcessing(false);
    }
  };

  // 3. Suggest ICD-10 Codes
  const suggestICD10 = async () => {
    if (!note.assessment && !note.diagnoses?.length) {
      toast.error("No diagnoses or assessment available");
      return;
    }

    setProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical coder. Suggest accurate ICD-10 codes based on this clinical information.

CHIEF COMPLAINT: ${note.chief_complaint || "Not provided"}
ASSESSMENT: ${note.assessment || "Not provided"}
DIAGNOSES: ${note.diagnoses?.join(", ") || "Not provided"}
HISTORY: ${note.history_of_present_illness || "Not provided"}

Provide ICD-10 codes with:
- Most specific codes (5-7 characters)
- Include laterality when applicable
- Include severity/type when documented
- Rank by specificity and clinical relevance
- Include rationale for each code`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  diagnosis: { type: "string" },
                  confidence: { type: "string", enum: ["high", "moderate", "low"] },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedContent(result);
      toast.success("ICD-10 codes suggested");
    } catch (error) {
      console.error("Failed to suggest codes:", error);
      toast.error("Failed to suggest ICD-10 codes");
    } finally {
      setProcessing(false);
    }
  };

  // 4. Auto-complete Treatment Plan
  const autocompleteTreatmentPlan = async () => {
    if (!note.assessment && !note.diagnoses?.length) {
      toast.error("No diagnoses or assessment available");
      return;
    }

    setProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support system. Generate a comprehensive, evidence-based treatment plan.

PATIENT: ${note.patient_name}
AGE: ${note.patient_age || "Not specified"}
GENDER: ${note.patient_gender || "Not specified"}

DIAGNOSES: ${note.diagnoses?.join(", ") || "Not provided"}
ASSESSMENT: ${note.assessment || "Not provided"}
ALLERGIES: ${note.allergies?.join(", ") || "None"}
CURRENT MEDICATIONS: ${note.medications?.join(", ") || "None"}

Generate complete treatment plan with:
1. Medications (with specific dosing, frequency, duration)
2. Diagnostic tests/imaging
3. Specialist referrals
4. Lifestyle modifications
5. Patient education topics
6. Follow-up timing
7. Red flags to monitor

Base recommendations on current clinical guidelines.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  dosing: { type: "string" },
                  indication: { type: "string" },
                  duration: { type: "string" },
                  monitoring: { type: "string" }
                }
              }
            },
            diagnostic_tests: { type: "array", items: { type: "string" } },
            referrals: { type: "array", items: { type: "string" } },
            lifestyle_modifications: { type: "array", items: { type: "string" } },
            patient_education: { type: "array", items: { type: "string" } },
            follow_up: { type: "string" },
            red_flags: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedContent(result);
      toast.success("Treatment plan generated");
    } catch (error) {
      console.error("Failed to generate plan:", error);
      toast.error("Failed to generate treatment plan");
    } finally {
      setProcessing(false);
    }
  };

  const applyToNote = async () => {
    if (!generatedContent) return;

    try {
      if (activeTab === "generate" && generatedContent.chief_complaint) {
        await onUpdateNote(generatedContent);
        toast.success("Content applied to note");
      } else if (activeTab === "icd10" && generatedContent.codes) {
        const icd10Diagnoses = generatedContent.codes.map(c => `${c.code} - ${c.description}`);
        await onUpdateNote({ diagnoses: [...(note.diagnoses || []), ...icd10Diagnoses] });
        toast.success("ICD-10 codes added to note");
      } else if (activeTab === "treatment" && generatedContent.medications) {
        const planText = formatTreatmentPlan(generatedContent);
        const medications = generatedContent.medications.map(m => `${m.name} ${m.dosing} - ${m.indication}`);
        await onUpdateNote({ 
          plan: (note.plan || "") + "\n\n" + planText,
          medications: [...(note.medications || []), ...medications]
        });
        toast.success("Treatment plan applied to note");
      }
      setGeneratedContent(null);
    } catch (error) {
      console.error("Failed to apply content:", error);
      toast.error("Failed to apply content");
    }
  };

  const formatTreatmentPlan = (plan) => {
    let text = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAI-GENERATED TREATMENT PLAN\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    if (plan.medications?.length > 0) {
      text += "MEDICATIONS:\n";
      plan.medications.forEach((m, i) => {
        text += `  ${i + 1}. ${m.name}\n`;
        text += `     • Dosing: ${m.dosing}\n`;
        text += `     • Indication: ${m.indication}\n`;
        text += `     • Duration: ${m.duration}\n`;
        if (m.monitoring) text += `     • Monitoring: ${m.monitoring}\n`;
      });
      text += "\n";
    }
    
    if (plan.diagnostic_tests?.length > 0) {
      text += `DIAGNOSTIC TESTS:\n${plan.diagnostic_tests.map(t => `  • ${t}`).join('\n')}\n\n`;
    }
    
    if (plan.referrals?.length > 0) {
      text += `REFERRALS:\n${plan.referrals.map(r => `  • ${r}`).join('\n')}\n\n`;
    }
    
    if (plan.follow_up) {
      text += `FOLLOW-UP: ${plan.follow_up}\n`;
    }
    
    return text;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-3">
      {/* Input area with dictation */}
      <div className="relative">
        <Textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Paste or dictate raw clinical data, voice transcript, or unstructured notes here..."
          rows={5}
          className={`text-sm pr-12 ${isRecording ? "border-red-400 ring-2 ring-red-100" : ""}`}
        />
        {/* Mic button */}
        <button
          type="button"
          onClick={isRecording ? stopDictation : startDictation}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
          title={isRecording ? "Stop dictation" : "Start dictation"}
        >
          {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
        {isRecording && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-red-600 font-medium pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Recording
          </div>
        )}
      </div>

      <Button
        onClick={generateStructuredNote}
        disabled={processing || !rawInput.trim()}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating Structured Note...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate Complete Clinical Note</>
        )}
      </Button>

      {generatedContent && (
        <GeneratedNoteDisplay content={generatedContent} onApply={applyToNote} onCopy={copyToClipboard} copied={copied} />
      )}
    </div>
  );
}

// Display Components
const GeneratedNoteDisplay = ({ content, onApply, onCopy, copied }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border-2 border-purple-200 p-5 space-y-4">
    <h3 className="font-bold text-slate-900 flex items-center gap-2">
      <Check className="w-5 h-5 text-green-600" /> Generated Clinical Note
    </h3>
    {Object.entries(content).map(([key, value]) => (
      <div key={key} className="border-b border-slate-100 pb-3 last:border-0">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{key.replace(/_/g, " ")}</p>
        {Array.isArray(value) ? (
          <ul className="space-y-1">
            {value.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 flex gap-2">
                <span>•</span>
                <span>{typeof item === 'object' ? `${item.code} - ${item.description}` : item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
        )}
      </div>
    ))}
    <div className="flex gap-3 pt-3 border-t border-slate-200">
      <Button onClick={onApply} className="flex-1 bg-purple-600 hover:bg-purple-700">
        <Check className="w-4 h-4 mr-2" /> Apply to Note
      </Button>
      <Button variant="outline" onClick={() => onCopy(JSON.stringify(content, null, 2))} className="gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  </motion.div>
);

const PatientSummaryDisplay = ({ content, onCopy, copied }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border-2 border-blue-200 p-5 space-y-4">
    <h3 className="font-bold text-slate-900">Patient Summary</h3>
    <p className="text-sm text-slate-700 leading-relaxed">{content.summary}</p>
    {Object.entries(content).filter(([k]) => k !== 'summary').map(([key, value]) => (
      <div key={key}>
        <p className="text-xs font-semibold text-blue-900 uppercase mb-2">{key.replace(/_/g, " ")}</p>
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-slate-700 flex gap-2"><span>•</span><span>{item}</span></li>
          ))}
        </ul>
      </div>
    ))}
    <Button variant="outline" onClick={() => onCopy(content.summary)} className="w-full gap-2">
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Summary
    </Button>
  </motion.div>
);

const ICD10CodesDisplay = ({ content, onApply }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border-2 border-emerald-200 p-5 space-y-3">
    <h3 className="font-bold text-slate-900">Suggested ICD-10 Codes</h3>
    {content.codes?.map((code, i) => (
      <div key={i} className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="font-bold text-lg text-emerald-900">{code.code}</p>
          <Badge className={`${code.confidence === 'high' ? 'bg-green-100 text-green-700' : code.confidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
            {code.confidence} confidence
          </Badge>
        </div>
        <p className="text-sm font-semibold text-slate-900 mb-1">{code.description}</p>
        <p className="text-xs text-slate-600 mb-2"><strong>Diagnosis:</strong> {code.diagnosis}</p>
        <p className="text-xs text-slate-600"><strong>Rationale:</strong> {code.rationale}</p>
      </div>
    ))}
    <Button onClick={onApply} className="w-full bg-emerald-600 hover:bg-emerald-700">
      <Check className="w-4 h-4 mr-2" /> Add Codes to Note
    </Button>
  </motion.div>
);

const TreatmentPlanDisplay = ({ content, onApply, onCopy, copied }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border-2 border-orange-200 p-5 space-y-4">
    <h3 className="font-bold text-slate-900">Generated Treatment Plan</h3>
    {content.medications?.length > 0 && (
      <div>
        <p className="text-xs font-semibold text-orange-900 uppercase mb-2">Medications</p>
        {content.medications.map((m, i) => (
          <div key={i} className="bg-orange-50 rounded-lg border border-orange-200 p-3 mb-2">
            <p className="font-semibold text-sm text-slate-900">{m.name}</p>
            <p className="text-xs text-slate-600 mt-1">• Dosing: {m.dosing}</p>
            <p className="text-xs text-slate-600">• Indication: {m.indication}</p>
            <p className="text-xs text-slate-600">• Duration: {m.duration}</p>
            {m.monitoring && <p className="text-xs text-slate-600">• Monitoring: {m.monitoring}</p>}
          </div>
        ))}
      </div>
    )}
    {content.diagnostic_tests?.length > 0 && (
      <div>
        <p className="text-xs font-semibold text-orange-900 uppercase mb-2">Diagnostic Tests</p>
        <ul className="space-y-1">
          {content.diagnostic_tests.map((t, i) => (
            <li key={i} className="text-sm text-slate-700 flex gap-2"><span>•</span><span>{t}</span></li>
          ))}
        </ul>
      </div>
    )}
    {content.follow_up && (
      <div>
        <p className="text-xs font-semibold text-orange-900 uppercase mb-1">Follow-up</p>
        <p className="text-sm text-slate-700">{content.follow_up}</p>
      </div>
    )}
    <div className="flex gap-3 pt-3 border-t border-slate-200">
      <Button onClick={onApply} className="flex-1 bg-orange-600 hover:bg-orange-700">
        <Check className="w-4 h-4 mr-2" /> Apply to Note
      </Button>
      <Button variant="outline" onClick={() => onCopy(JSON.stringify(content, null, 2))} className="gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  </motion.div>
);