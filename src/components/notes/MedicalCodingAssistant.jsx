import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, Loader2, Check, X, Search, Plus,
  FileCode, Activity, ChevronDown, ChevronUp, Copy
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const confidenceColors = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

function CodeCard({ code, codeType, onAdd, added }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 transition-all ${added ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-lg ${codeType === "icd10" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
              {code.code}
            </span>
            {code.confidence && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${confidenceColors[code.confidence] || confidenceColors.low}`}>
                {code.confidence}
              </span>
            )}
            {added && <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Added</span>}
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">{code.description}</p>
          {code.diagnosis && <p className="text-xs text-slate-500 mt-0.5">For: {code.diagnosis}</p>}
          {(code.rationale || code.typical_use) && (
            <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs text-blue-600 mt-1.5 hover:text-blue-800">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Less" : "Details"}
            </button>
          )}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg p-2 border border-slate-200 space-y-1">
                {code.rationale && <p><strong>Rationale:</strong> {code.rationale}</p>}
                {code.typical_use && <p><strong>Typical Use:</strong> {code.typical_use}</p>}
                {code.rvu && <p><strong>RVU:</strong> {code.rvu}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {!added ? (
            <Button size="sm" onClick={() => onAdd(code)} className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs">
              <Plus className="w-3 h-3" /> Add
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(code.code).then(() => toast.success("Copied"))}
              className="h-7 px-2 text-slate-400 hover:text-slate-600">
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MedicalCodingAssistant({ note, onAddDiagnoses, onAddCPTCodes }) {
  const [loading, setLoading] = useState(false);
  const [icd10Codes, setIcd10Codes] = useState([]);
  const [icd10BySection, setIcd10BySection] = useState({});
  const [cptCodes, setCptCodes] = useState([]);
  const [addedCodes, setAddedCodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("suggest");
  const [activeCodeTab, setActiveCodeTab] = useState("all");
  const [selectedCodesForAdd, setSelectedCodesForAdd] = useState(new Set());

  const hasContext = note?.diagnoses?.length || note?.chief_complaint || note?.assessment;

  const generateCodes = async () => {
    if (!hasContext) {
      toast.error("Please add diagnoses, chief complaint, or assessment first");
      return;
    }
    setLoading(true);
    setIcd10Codes([]);
    setIcd10BySection({});
    setCptCodes([]);
    setAddedCodes(new Set());
    setSelectedCodesForAdd(new Set());
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical coder (CPC certified). Analyze this clinical encounter and suggest the most accurate ICD-10-CM diagnosis codes AND CPT procedure/service codes.

PATIENT CONTEXT:
Chief Complaint: ${note.chief_complaint || "N/A"}
Assessment: ${note.assessment || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
Plan: ${note.plan || "N/A"}
Note Type: ${note.note_type || "progress_note"}

IMPORTANT: For ICD-10 codes, organize suggestions by note section (hpi, assessment, diagnoses_list). This helps coders understand which part of the note supports each code.

ICD-10 Rules:
- Use the most specific codes available (5-7 characters)
- Include laterality, severity, episode when documented
- Code all documented conditions that affect management
- Return up to 8 codes ranked by primary/secondary
- Organize codes by source section: 'hpi', 'assessment', or 'diagnoses_list'

CPT Rules:
- Suggest E&M codes appropriate for the encounter type and complexity
- Include any procedure codes based on documented services
- Include any diagnostic codes if studies were performed
- Return up to 6 codes

For each code provide: code, description, confidence (high/moderate/low), rationale, section (for ICD-10), and for CPT also include typical_use and rvu estimate.`,
        response_json_schema: {
          type: "object",
          properties: {
            icd10_codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  diagnosis: { type: "string" },
                  section: { type: "string", enum: ["hpi", "assessment", "diagnoses_list"], description: "Which note section this code is based on" },
                  confidence: { type: "string", enum: ["high", "moderate", "low"] },
                  rationale: { type: "string" }
                }
              }
            },
            cpt_codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  diagnosis: { type: "string" },
                  confidence: { type: "string", enum: ["high", "moderate", "low"] },
                  typical_use: { type: "string" },
                  rvu: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });
      setIcd10Codes(result.icd10_codes || []);
      
      // Organize codes by section
      const bySection = {
        hpi: [],
        assessment: [],
        diagnoses_list: []
      };
      (result.icd10_codes || []).forEach(code => {
        const section = code.section || 'diagnoses_list';
        if (bySection[section]) bySection[section].push(code);
      });
      setIcd10BySection(bySection);
      
      setCptCodes(result.cpt_codes || []);
      if (!result.icd10_codes?.length && !result.cpt_codes?.length) {
        toast.info("No codes generated — try adding more clinical details");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate codes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for both ICD-10-CM and CPT codes matching: "${searchQuery}". Return up to 5 of each type with accurate codes, descriptions, and brief clinical notes.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            icd10_codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            cpt_codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });
      setSearchResults([
        ...(result.icd10_codes || []).map(c => ({ ...c, type: "icd10" })),
        ...(result.cpt_codes || []).map(c => ({ ...c, type: "cpt" })),
      ]);
    } catch (e) {
      toast.error("Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddCode = (code, codeType) => {
    const key = `${codeType}-${code.code}`;
    if (addedCodes.has(key)) return;
    setAddedCodes(prev => new Set([...prev, key]));
    if (codeType === "icd10" && onAddDiagnoses) {
      onAddDiagnoses([`${code.code} - ${code.description}`]);
      toast.success(`ICD-10 ${code.code} added to diagnoses`);
    } else if (codeType === "cpt" && onAddCPTCodes) {
      onAddCPTCodes([`${code.code} - ${code.description}`]);
      toast.success(`CPT ${code.code} added`);
    } else {
      toast.success(`${code.code} copied — paste it where needed`);
      navigator.clipboard.writeText(`${code.code} - ${code.description}`);
    }
  };

  const totalSuggestions = icd10Codes.length + cptCodes.length;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="suggest" className="rounded-lg text-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Suggestions
            {totalSuggestions > 0 && <span className="ml-1.5 bg-blue-600 text-white rounded-full px-1.5 text-xs">{totalSuggestions}</span>}
          </TabsTrigger>
          <TabsTrigger value="search" className="rounded-lg text-sm">
            <Search className="w-3.5 h-3.5 mr-1.5" /> Search Codes
          </TabsTrigger>
        </TabsList>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggest" className="space-y-4 mt-3">
          <Button
            onClick={generateCodes}
            disabled={loading || !hasContext}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 py-5 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing encounter & generating codes…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate ICD-10 + CPT Codes from This Encounter</>
            )}
          </Button>
          {!hasContext && (
            <p className="text-xs text-center text-slate-500">Add diagnoses, chief complaint, or assessment to enable AI coding</p>
          )}

          {(icd10Codes.length > 0 || cptCodes.length > 0) && (
            <Tabs defaultValue="icd10">
              <TabsList className="grid grid-cols-2 bg-slate-50 border border-slate-200 rounded-xl p-1 h-auto">
                <TabsTrigger value="icd10" className="rounded-lg text-xs py-2">
                  <FileCode className="w-3 h-3 mr-1" /> ICD-10-CM
                  <span className="ml-1 bg-blue-100 text-blue-700 rounded-full px-1.5 font-bold">{icd10Codes.length}</span>
                </TabsTrigger>
                <TabsTrigger value="cpt" className="rounded-lg text-xs py-2">
                  <Activity className="w-3 h-3 mr-1" /> CPT Codes
                  <span className="ml-1 bg-purple-100 text-purple-700 rounded-full px-1.5 font-bold">{cptCodes.length}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="icd10" className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">Click <strong>Add</strong> to include a code in your diagnoses list</p>
                {icd10Codes.map((code, i) => (
                  <CodeCard key={i} code={code} codeType="icd10"
                    added={addedCodes.has(`icd10-${code.code}`)}
                    onAdd={(c) => handleAddCode(c, "icd10")}
                  />
                ))}
              </TabsContent>

              <TabsContent value="cpt" className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">CPT codes for billing — click <strong>Add</strong> to save or copy to clipboard</p>
                {cptCodes.map((code, i) => (
                  <CodeCard key={i} code={code} codeType="cpt"
                    added={addedCodes.has(`cpt-${code.code}`)}
                    onAdd={(c) => handleAddCode(c, "cpt")}
                  />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4 mt-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search ICD-10 or CPT codes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            <Button type="submit" disabled={searchLoading || !searchQuery.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 gap-1.5">
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">{searchResults.length} results for "{searchQuery}"</p>
              {searchResults.map((code, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-300 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-lg ${code.type === "icd10" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        {code.code}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${code.type === "icd10" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200"}`}>
                        {code.type === "icd10" ? "ICD-10" : "CPT"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{code.description}</p>
                    {code.notes && <p className="text-xs text-slate-500 mt-0.5">{code.notes}</p>}
                  </div>
                  <Button size="sm" onClick={() => handleAddCode(code, code.type)}
                    className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs flex-shrink-0">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}