import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Stethoscope,
  Search,
  Sparkles,
  Youtube,
  ExternalLink,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Upload,
  X as XIcon,
  Code,
  Paperclip,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import ProcedureNoteCreator from "./ProcedureNoteCreator";

export default function ProceduresPanel({ note, noteId }) {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [createdNote, setCreatedNote] = useState(null);

  const queryClient = useQueryClient();

  // Fetch procedure logs for this note
  const { data: procedureLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['procedureLogs', note?.id],
    queryFn: () => base44.entities.ProcedureLog.filter({ note_id: note?.id }),
    enabled: !!note?.id
  });

  // AI Recommendations
  const getRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const context = `
Chief Complaint: ${note?.chief_complaint || 'N/A'}
History of Present Illness: ${note?.history_of_present_illness || 'N/A'}
Assessment: ${note?.assessment || 'N/A'}
Medical Decision Making: ${note?.mdm || 'N/A'}
Patient History: ${note?.medical_history || 'N/A'}
      `.trim();

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the following clinical information, recommend evidence-based procedures that may be indicated. Include diagnostic and therapeutic procedures. For each recommendation, provide clinical reasoning based on current guidelines.

${context}

Provide recommendations in JSON format with: procedure_name, indication, clinical_reasoning, urgency (routine/urgent/emergent), estimated_duration, complexity (simple/moderate/complex), and guidelines_reference.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  procedure_name: { type: "string" },
                  indication: { type: "string" },
                  clinical_reasoning: { type: "string" },
                  urgency: { type: "string" },
                  estimated_duration: { type: "string" },
                  complexity: { type: "string" },
                  guidelines_reference: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(response.recommendations || []);
    } catch (error) {
      toast.error("Failed to generate recommendations");
      console.error(error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Search procedures
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for the medical procedure: "${searchQuery}". Provide detailed information including: procedure name, description, indications, contraindications, CPT code if applicable, estimated duration, and find 2-3 relevant educational resources (YouTube videos from reputable medical channels, medical college resources, or professional association guidelines). Include direct URLs.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  procedure_name: { type: "string" },
                  description: { type: "string" },
                  indications: { type: "string" },
                  contraindications: { type: "string" },
                  cpt_code: { type: "string" },
                  estimated_duration: { type: "string" },
                  educational_resources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        source: { type: "string" },
                        type: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setSearchResults(response.results || []);
    } catch (error) {
      toast.error("Search failed");
      console.error(error);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Log procedure mutation
  const logProcedureMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcedureLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['procedureLogs']);
      toast.success("Procedure logged successfully");
      setLogDialogOpen(false);
      setSelectedProcedure(null);
    },
    onError: () => toast.error("Failed to log procedure")
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid w-full grid-cols-4">
           <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
           <TabsTrigger value="search">Search Procedures</TabsTrigger>
           <TabsTrigger value="procedure_note">Procedure Note</TabsTrigger>
           <TabsTrigger value="logs">Procedure Log</TabsTrigger>
         </TabsList>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">AI-Powered Procedure Recommendations</h3>
              </div>
              <Button
                onClick={getRecommendations}
                disabled={loadingRecommendations}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {loadingRecommendations ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Recommendations
                  </>
                )}
              </Button>
            </div>

            {loadingRecommendations ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <Card key={idx} className="p-4 border-l-4 border-l-purple-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{rec.procedure_name}</h4>
                          <Badge variant={rec.urgency === 'emergent' ? 'destructive' : rec.urgency === 'urgent' ? 'default' : 'secondary'}>
                            {rec.urgency}
                          </Badge>
                          <Badge variant="outline">{rec.complexity}</Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-2"><strong>Indication:</strong> {rec.indication}</p>
                        <p className="text-sm text-slate-600 mb-2">{rec.clinical_reasoning}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rec.estimated_duration}
                          </span>
                          <span>{rec.guidelines_reference}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProcedure(rec);
                          setLogDialogOpen(true);
                        }}
                        className="ml-4"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Log
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>Click "Generate Recommendations" to get AI-powered procedure suggestions</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Search Procedures</h3>
            </div>
            
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search for a procedure (e.g., 'lumbar puncture', 'central line placement')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loadingSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {loadingSearch ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result, idx) => (
                  <Card key={idx} className="p-4">
                    <h4 className="font-semibold text-lg text-slate-900 mb-2">{result.procedure_name}</h4>
                    {result.cpt_code && (
                      <Badge variant="outline" className="mb-2">CPT: {result.cpt_code}</Badge>
                    )}
                    <p className="text-sm text-slate-700 mb-3">{result.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Indications:</p>
                        <p className="text-sm text-slate-700">{result.indications}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Contraindications:</p>
                        <p className="text-sm text-slate-700">{result.contraindications}</p>
                      </div>
                    </div>

                    {result.educational_resources && result.educational_resources.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          Educational Resources
                        </p>
                        <div className="space-y-2">
                          {result.educational_resources.map((resource, ridx) => (
                            <a
                              key={ridx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {resource.title} ({resource.source})
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProcedure({
                          procedure_name: result.procedure_name,
                          indication: result.indications,
                          procedure_code: result.cpt_code
                        });
                        setLogDialogOpen(true);
                      }}
                      className="mt-3"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Log This Procedure
                    </Button>
                  </Card>
                ))}
              </div>
            ) : searchQuery && !loadingSearch ? (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>No results found. Try a different search term.</p>
              </div>
            ) : null}
          </Card>
        </TabsContent>

        {/* Procedure Note Tab */}
        <TabsContent value="procedure_note" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Create Procedure Note</h3>
            </div>

            {createdNote ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900">Procedure Note Created</p>
                      <p className="text-sm text-slate-600 mt-1">Your note is ready to be added to this clinical visit</p>
                    </div>
                  </div>
                </div>

                <Textarea
                  value={createdNote}
                  readOnly
                  className="min-h-[300px] text-sm bg-slate-50"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(createdNote);
                      toast.success("Procedure note copied to clipboard");
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" /> Copy to Clipboard
                  </Button>
                  <Button
                    onClick={() => setCreatedNote(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Create Another
                  </Button>
                </div>
              </div>
            ) : (
              <ProcedureNoteCreator
                onSuccess={(note) => {
                  setCreatedNote(note);
                  toast.success("Procedure note generated");
                }}
              />
            )}
          </Card>
        </TabsContent>

        {/* Procedure Log Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Procedure Log</h3>
              </div>
              <Button onClick={() => {
                setSelectedProcedure(null);
                setLogDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Log New Procedure
              </Button>
            </div>

            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : procedureLogs.length > 0 ? (
              <div className="space-y-3">
                {procedureLogs.map((log) => (
                  <Card key={log.id} className="p-4 border-l-4 border-l-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{log.procedure_name}</h4>
                          {log.procedure_code && <Badge variant="outline">{log.procedure_code}</Badge>}
                          <Badge variant={log.outcome === 'successful' ? 'default' : 'destructive'}>
                            {log.outcome}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-1"><strong>Indication:</strong> {log.indication}</p>
                        
                        {log.icd10_codes && log.icd10_codes.length > 0 && (
                          <div className="flex flex-wrap gap-1 my-2">
                            {log.icd10_codes.map((code, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-purple-50 text-purple-800 border-purple-300">
                                {code}
                              </Badge>
                              ))}
                              </div>
                              )}

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {moment(log.date_performed).format('MMM D, YYYY h:mm A')}
                          </span>
                          {log.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {log.duration_minutes} min
                            </span>
                          )}
                          {log.operator && <span>By: {log.operator}</span>}
                        </div>
                        
                        {log.findings && (
                          <p className="text-sm text-slate-600 mt-2"><strong>Findings:</strong> {log.findings}</p>
                        )}
                        
                        {log.documentation_files && log.documentation_files.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {log.documentation_files.map((doc, didx) => (
                              <a
                                key={didx}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200"
                              >
                                <Paperclip className="w-3 h-3" />
                                {doc.description}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                  ))}
                  </div>
                  ) : (
                  <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>No procedures logged yet</p>
                  </div>
                  )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Procedure Dialog */}
      <LogProcedureDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        note={note}
        selectedProcedure={selectedProcedure}
        onSave={(data) => logProcedureMutation.mutate(data)}
        isSaving={logProcedureMutation.isPending}
      />
    </div>
  );
}

function LogProcedureDialog({ open, onOpenChange, note, selectedProcedure, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    procedure_name: "",
    procedure_code: "",
    icd10_codes: [],
    indication: "",
    date_performed: new Date().toISOString(),
    operator: "",
    location: "clinic",
    anesthesia_type: "local",
    technique: "",
    findings: "",
    complications: "",
    duration_minutes: "",
    outcome: "successful",
    post_procedure_plan: "",
    consent_obtained: true,
    status: "completed",
    documentation_files: []
  });
  const [icd10Search, setIcd10Search] = useState("");
  const [icd10Suggestions, setIcd10Suggestions] = useState([]);
  const [loadingIcd10, setLoadingIcd10] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    if (selectedProcedure) {
      setFormData((prev) => ({
        ...prev,
        procedure_name: selectedProcedure.procedure_name || "",
        procedure_code: selectedProcedure.procedure_code || "",
        indication: selectedProcedure.indication || ""
      }));
    }
  }, [selectedProcedure]);

  // Auto-suggest ICD-10 codes and CPT code when procedure name changes
  useEffect(() => {
    const getSuggestions = async () => {
      if (formData.procedure_name && formData.procedure_name.length > 3) {
        setLoadingIcd10(true);
        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `For the medical procedure "${formData.procedure_name}", provide:
1. The appropriate CPT code
2. Common ICD-10 diagnosis codes that would justify this procedure
3. Brief clinical rationale for each ICD-10 code

Return structured data.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                cpt_code: { type: "string" },
                icd10_suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      code: { type: "string" },
                      description: { type: "string" },
                      rationale: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          if (result.cpt_code && !formData.procedure_code) {
            setFormData((prev) => ({ ...prev, procedure_code: result.cpt_code }));
          }
          setIcd10Suggestions(result.icd10_suggestions || []);
        } catch (error) {
          console.error("Failed to get suggestions:", error);
        } finally {
          setLoadingIcd10(false);
        }
      }
    };

    const debounce = setTimeout(getSuggestions, 800);
    return () => clearTimeout(debounce);
  }, [formData.procedure_name]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            file_url,
            file_type: file.type,
            description: file.name
          };
        })
      );

      setFormData((prev) => ({
        ...prev,
        documentation_files: [...prev.documentation_files, ...uploadedFiles]
      }));
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      note_id: note.id,
      patient_name: note.patient_name,
      patient_id: note.patient_id,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      icd10_codes: formData.icd10_codes,
      documentation_files: formData.documentation_files
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Procedure</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Procedure Name *</label>
              <Input
                value={formData.procedure_name}
                onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
                placeholder="e.g., Central Line Placement"
              />
              </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Procedure Code</label>
              <Input
                value={formData.procedure_code}
                onChange={(e) => setFormData({ ...formData, procedure_code: e.target.value })}
                placeholder="CPT code"
              />
              </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Indication *</label>
            <Textarea
              value={formData.indication}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              placeholder="Clinical indication for procedure"
              rows={2}
            />
          </div>

          {/* ICD-10 Codes Section */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-600" />
              ICD-10 Diagnosis Codes
            </label>
            
            {/* Current ICD-10 Codes */}
            {formData.icd10_codes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.icd10_codes.map((code, idx) => (
                  <Badge key={idx} className="bg-purple-100 text-purple-800 gap-1">
                    {code}
                    <button
                      onClick={() => {
                        const updated = formData.icd10_codes.filter((_, i) => i !== idx);
                        setFormData({ ...formData, icd10_codes: updated });
                      }}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                    </Badge>
                    ))}
                    </div>
                    )}

            {/* AI Suggestions */}
            {loadingIcd10 && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Getting ICD-10 suggestions...</span>
              </div>
            )}

            {icd10Suggestions.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-xs font-medium text-slate-600">Suggested codes for this procedure:</p>
                {icd10Suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-purple-600 text-white font-mono text-xs">
                            {suggestion.code}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900">{suggestion.description}</p>
                        <p className="text-xs text-slate-600 mt-1">{suggestion.rationale}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!formData.icd10_codes.includes(`${suggestion.code} - ${suggestion.description}`)) {
                            setFormData({
                              ...formData,
                              icd10_codes: [...formData.icd10_codes, `${suggestion.code} - ${suggestion.description}`]
                            });
                            toast.success("ICD-10 code added");
                          }
                        }}
                        className="flex-shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    </div>
                    </div>
                    </div>
                    ))}
                    </div>
                    )}

            {/* Manual ICD-10 Entry */}
            <div className="flex gap-2">
              <Input
                placeholder="Search ICD-10 codes..."
                 value={icd10Search}
                 onChange={(e) => setIcd10Search(e.target.value)}
                 className="flex-1"
                />
                <Button
                 size="sm"
                 onClick={async () => {
                   if (!icd10Search.trim()) return;

                   setLoadingIcd10(true);
                   try {
                    const result = await base44.integrations.Core.InvokeLLM({
                      prompt: `Search for ICD-10 codes related to: "${icd10Search}". Return the top 5 most relevant codes with full descriptions.`,
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
                                description: { type: "string" }
                              }
                            }
                          }
                        }
                      }
                    });

                    setIcd10Suggestions(result.codes?.map((c) => ({
                      code: c.code,
                      description: c.description,
                      rationale: "Search result"
                    })) || []);
                  } catch (error) {
                    toast.error("Search failed");
                  } finally {
                    setLoadingIcd10(false);
                  }
                }}
                disabled={loadingIcd10}
                >
                <Search className="w-4 h-4" />
                </Button>
                </div>
          </div>

          {/* Documentation Upload Section */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-600" />
              Procedure Documentation
            </label>
            
            {formData.documentation_files.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.documentation_files.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 truncate">{doc.description}</p>
                      <p className="text-xs text-slate-500">{doc.file_type}</p>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        const updated = formData.documentation_files.filter((_, i) => i !== idx);
                        setFormData({ ...formData, documentation_files: updated });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                    </div>
                    ))}
                    </div>
                    )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploadingFiles}
                className="hidden"
                id="procedure-file-upload"
                />
                <label
                htmlFor="procedure-file-upload"
                className="flex-1 cursor-pointer"
                >
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg p-4 text-center transition-colors">
                  {uploadingFiles ? (
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-sm text-slate-600">Click to upload images, reports, or documents</p>
                      <p className="text-xs text-slate-500 mt-1">Supports images, PDF, Word documents</p>
                    </div>
                  )}
                  </div>
                  </label>
                  </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Operator</label>
              <Input
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                placeholder="Physician name"
                />
                </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Duration (minutes)</label>
              <Input
               type="number"
               value={formData.duration_minutes}
               onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
               placeholder="30"
              />
              </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Location</label>
              <select
               value={formData.location}
               onChange={(e) => setFormData({ ...formData, location: e.target.value })}
               className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
               <option value="clinic">Clinic</option>
                <option value="bedside">Bedside</option>
                <option value="procedure_room">Procedure Room</option>
                <option value="or">Operating Room</option>
                <option value="er">Emergency Room</option>
                <option value="icu">ICU</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Anesthesia Type</label>
              <select
               value={formData.anesthesia_type}
               onChange={(e) => setFormData({ ...formData, anesthesia_type: e.target.value })}
               className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
               <option value="none">None</option>
                <option value="local">Local</option>
                <option value="regional">Regional</option>
                <option value="conscious_sedation">Conscious Sedation</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Technique</label>
            <Textarea
             value={formData.technique}
             onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
             placeholder="Brief description of technique"
             rows={2}
            />
            </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Findings</label>
            <Textarea
             value={formData.findings}
             onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
             placeholder="Procedure findings"
             rows={2}
            />
            </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Complications</label>
            <Textarea
             value={formData.complications}
             onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
             placeholder="Any complications (leave blank if none)"
             rows={2}
            />
            </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Outcome</label>
            <select
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="successful">Successful</option>
              <option value="partially_successful">Partially Successful</option>
              <option value="unsuccessful">Unsuccessful</option>
              <option value="aborted">Aborted</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Post-Procedure Plan</label>
            <Textarea
             value={formData.post_procedure_plan}
             onChange={(e) => setFormData({ ...formData, post_procedure_plan: e.target.value })}
             placeholder="Post-procedure care instructions"
             rows={2}
            />
            </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.consent_obtained}
              onChange={(e) => setFormData({ ...formData, consent_obtained: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-slate-700">Informed consent obtained</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !formData.procedure_name || !formData.indication}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {isSaving ? "Saving..." : "Save Procedure"}
            </Button>
            </div>
            </div>
            </DialogContent>
            </Dialog>
            );
            }