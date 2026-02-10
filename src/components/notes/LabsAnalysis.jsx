import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check, Plus, Beaker, X, Upload, FileText } from "lucide-react";

export default function LabsAnalysis({ noteId, onAddToNote }) {
  const [labResults, setLabResults] = useState("");
  const [analyzingLabs, setAnalyzingLabs] = useState(false);
  const [labsSummary, setLabsSummary] = useState(null);
  const [error, setError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFile(true);
    setError(null);

    try {
      for (const file of files) {
        const uploadedFile = await base44.integrations.Core.UploadFile({ file });

        let extractedText = "";
        try {
          const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: uploadedFile.file_url,
            json_schema: {
              type: "object",
              properties: {
                text: { type: "string", description: "All lab results and data from the file" },
              },
            },
          });
          extractedText = extracted.output?.text || "";
        } catch (extractErr) {
          console.warn("Could not extract text automatically");
        }

        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            url: uploadedFile.file_url,
            extractedText,
            type: file.type,
          },
        ]);

        if (extractedText) {
          setLabResults((prev) => `${prev}\n\n[From: ${file.name}]\n${extractedText}`);
        }
      }
    } catch (err) {
      console.error("Failed to upload file:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleAnalyzeLabs = async () => {
    if (!labResults.trim()) {
      setError("Please paste lab results or upload files first");
      return;
    }

    setAnalyzingLabs(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical laboratory expert. Analyze these lab results and provide a comprehensive interpretation.

LAB RESULTS:
${labResults}

Please provide:
1. **Key Findings**: Main abnormalities or significant values
2. **Abnormal Labs**: List of out-of-range values with:
   - Test name
   - Result value
   - Normal range
   - Direction (high/low)
   - Clinical significance
3. **Clinical Interpretation**: What these results mean clinically
4. **Trending**: Any notable trends if previous results are mentioned
5. **Clinical Recommendations**: Suggested follow-up or further testing
6. **Summary**: One-paragraph executive summary

Be specific with values and ranges. Highlight critical values that need urgent attention.`,
        response_json_schema: {
          type: "object",
          properties: {
            key_findings: {
              type: "array",
              items: { type: "string" },
              description: "Main abnormalities and significant values",
            },
            abnormal_labs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  result: { type: "string" },
                  normal_range: { type: "string" },
                  direction: { type: "string", enum: ["high", "low", "critical"] },
                  significance: { type: "string" },
                },
              },
              description: "All abnormal lab values",
            },
            clinical_interpretation: {
              type: "string",
              description: "Clinical meaning of the results",
            },
            trending: {
              type: "string",
              description: "Any notable trends",
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Follow-up recommendations",
            },
            summary: {
              type: "string",
              description: "Executive summary",
            },
            has_critical_values: {
              type: "boolean",
              description: "Whether critical values are present",
            },
          },
        },
      });

      setLabsSummary(result);
    } catch (err) {
      console.error("Failed to analyze labs:", err);
      setError("Failed to analyze labs. Please try again.");
    } finally {
      setAnalyzingLabs(false);
    }
  };

  const handleAddToNote = () => {
    if (!labsSummary) return;

    let labsText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    labsText += `LABORATORY RESULTS & ANALYSIS\n`;
    labsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (labsSummary.has_critical_values) {
      labsText += `⚠️ CRITICAL VALUES PRESENT ⚠️\n\n`;
    }

    if (labsSummary.summary) {
      labsText += `SUMMARY:\n${labsSummary.summary}\n\n`;
    }

    if (labsSummary.abnormal_labs?.length > 0) {
      labsText += `ABNORMAL LABS:\n`;
      labsSummary.abnormal_labs.forEach((lab) => {
        const indicator = lab.direction === "critical" ? "🔴" : lab.direction === "high" ? "↑" : "↓";
        labsText += `  ${indicator} ${lab.test_name}\n`;
        labsText += `     Result: ${lab.result} (Normal: ${lab.normal_range})\n`;
        labsText += `     Significance: ${lab.significance}\n`;
      });
      labsText += `\n`;
    }

    if (labsSummary.clinical_interpretation) {
      labsText += `CLINICAL INTERPRETATION:\n${labsSummary.clinical_interpretation}\n\n`;
    }

    if (labsSummary.trending) {
      labsText += `TRENDING:\n${labsSummary.trending}\n\n`;
    }

    if (labsSummary.recommendations?.length > 0) {
      labsText += `RECOMMENDATIONS:\n`;
      labsSummary.recommendations.forEach((rec) => {
        labsText += `  • ${rec}\n`;
      });
    }

    onAddToNote(labsText);
  };

  return (
    <div className="flex-1">
      {!labsSummary ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Beaker className="w-4 h-4 text-amber-600" />
            Laboratory Analysis
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            {/* File Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
                Upload Lab Files
              </label>
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                <div className="text-center">
                  <Upload className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-slate-700">
                    Click to upload lab result files
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Supported: PDF, CSV, Excel
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>
              {uploadingFile && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-700">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </div>
              )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Uploaded Files:</p>
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-slate-700 truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {uploadedFiles.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {/* Text Paste */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
                Or Paste Lab Results
              </label>
              <Textarea
                value={labResults}
                onChange={(e) => {
                  setLabResults(e.target.value);
                  setError(null);
                }}
                placeholder="Paste lab results here (blood work, chemistry panel, etc.)..."
                className="min-h-32 rounded-lg resize-none border-slate-300"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyzeLabs}
              disabled={analyzingLabs || !labResults.trim()}
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {analyzingLabs ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Labs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Lab Results
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Lab Analysis Complete
            </h3>
            <button
              onClick={() => {
                setLabsSummary(null);
                setLabResults("");
                setUploadedFiles([]);
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            {labsSummary.has_critical_values && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm font-semibold text-red-900 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Critical Values Present
                </p>
              </div>
            )}

            {labsSummary.summary && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Summary</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{labsSummary.summary}</p>
              </div>
            )}

            {labsSummary.abnormal_labs?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                  Abnormal Labs ({labsSummary.abnormal_labs.length})
                </h4>
                <div className="space-y-2">
                  {labsSummary.abnormal_labs.map((lab, idx) => {
                    const colorClass = lab.direction === "critical" 
                      ? "bg-red-50 border-red-200" 
                      : lab.direction === "high" 
                      ? "bg-orange-50 border-orange-200" 
                      : "bg-blue-50 border-blue-200";
                    
                    return (
                      <div key={idx} className={`p-2 rounded-lg border ${colorClass}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-900">{lab.test_name}</p>
                            <p className="text-xs text-slate-700 mt-1">
                              Result: <span className="font-medium">{lab.result}</span>
                              {" "}(Normal: {lab.normal_range})
                            </p>
                            <p className="text-xs text-slate-600 mt-1">{lab.significance}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {labsSummary.clinical_interpretation && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Clinical Interpretation</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{labsSummary.clinical_interpretation}</p>
              </div>
            )}

            {labsSummary.recommendations?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {labsSummary.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-amber-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-amber-200">
              <Button
                onClick={handleAddToNote}
                className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-4 h-4" /> Add All to Assessment
              </Button>
              <Button
                onClick={() => {
                  if (!labsSummary) return;
                  let planText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                  planText += `LAB RECOMMENDATIONS\n`;
                  planText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                  if (labsSummary.recommendations?.length > 0) {
                    labsSummary.recommendations.forEach((rec) => {
                      planText += `• ${rec}\n`;
                    });
                  }
                  onAddToNote(planText);
                }}
                variant="outline"
                className="w-full gap-2 border-amber-300 hover:bg-amber-50"
              >
                <Plus className="w-4 h-4" /> Add Recommendations to Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}