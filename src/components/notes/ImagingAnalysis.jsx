import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check, Plus, ImageIcon, X, Upload, FileText } from "lucide-react";
import ImagingFindingsLinker from "./ImagingFindingsLinker";

export default function ImagingAnalysis({ noteId, onAddToNote }) {
  const [imagingResults, setImagingResults] = useState("");
  const [analyzingSummary, setAnalyzingSummary] = useState(false);
  const [imagingSummary, setImagingSummary] = useState(null);
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

        // Extract text from the uploaded file
        let extractedText = "";
        try {
          const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: uploadedFile.file_url,
            json_schema: {
              type: "object",
              properties: {
                text: { type: "string", description: "All text content from the file" },
              },
            },
          });
          extractedText = extracted.output?.text || "";
        } catch (extractErr) {
          console.warn("Could not extract text automatically, file uploaded but may need manual review");
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

        // Auto-add extracted text to imaging results
        if (extractedText) {
          setImagingResults((prev) => `${prev}\n\n[From: ${file.name}]\n${extractedText}`);
        }
      }
    } catch (err) {
      console.error("Failed to upload file:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
      e.target.value = ""; // Reset file input
    }
  };

  const handleAnalyzeImaging = async () => {
    if (!imagingResults.trim()) {
      setError("Please paste imaging results or upload files first");
      return;
    }

    setAnalyzingSummary(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical radiologist. Analyze the following imaging results and provide a structured summary.

IMAGING RESULTS:
${imagingResults}

Provide:
1. **Key Findings**: List of significant findings
2. **Clinical Impression**: Summary of what the imaging shows
3. **Recommendations**: Next steps or follow-up imaging if needed
4. **Urgency Level**: Normal, Urgent, or Critical based on findings

Format the response in a clear, clinically actionable way.`,
        response_json_schema: {
          type: "object",
          properties: {
            key_findings: {
              type: "array",
              items: { type: "string" },
              description: "List of significant findings",
            },
            clinical_impression: {
              type: "string",
              description: "Summary of imaging findings",
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Next steps or follow-up recommendations",
            },
            urgency_level: {
              type: "string",
              enum: ["Normal", "Urgent", "Critical"],
              description: "Clinical urgency assessment",
            },
          },
        },
      });

      setImagingSummary(result);
    } catch (err) {
      console.error("Failed to analyze imaging:", err);
      setError("Failed to analyze imaging results. Please try again.");
    } finally {
      setAnalyzingSummary(false);
    }
  };

  const handleAddToNote = () => {
    if (!imagingSummary) return;

    let imagingText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    imagingText += `IMAGING RESULTS & ANALYSIS\n`;
    imagingText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (imagingSummary.key_findings?.length > 0) {
      imagingText += `KEY FINDINGS:\n`;
      imagingSummary.key_findings.forEach((finding) => {
        imagingText += `  • ${finding}\n`;
      });
      imagingText += `\n`;
    }

    if (imagingSummary.clinical_impression) {
      imagingText += `CLINICAL IMPRESSION:\n${imagingSummary.clinical_impression}\n\n`;
    }

    if (imagingSummary.urgency_level) {
      imagingText += `URGENCY LEVEL: ${imagingSummary.urgency_level}\n\n`;
    }

    if (imagingSummary.recommendations?.length > 0) {
      imagingText += `RECOMMENDATIONS:\n`;
      imagingSummary.recommendations.forEach((rec) => {
        imagingText += `  • ${rec}\n`;
      });
    }

    onAddToNote(imagingText);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-cyan-600" />
          Imaging Results Analysis
        </h3>

        {/* Input Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
            Paste Imaging Results
          </label>
          <Textarea
            value={imagingResults}
            onChange={(e) => {
              setImagingResults(e.target.value);
              setError(null);
            }}
            placeholder="Paste imaging report text here (CT, MRI, X-ray, etc.)..."
            className="min-h-32 rounded-lg resize-none border-slate-300"
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={handleAnalyzeImaging}
            disabled={analyzingSummary || !imagingResults.trim()}
            className="mt-4 w-full gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {analyzingSummary ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Imaging...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Analyze with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Section */}
      {imagingSummary && (
        <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-semibold text-slate-900">AI Analysis Summary</h4>
            <button
              onClick={() => setImagingSummary(null)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Urgency Badge */}
          {imagingSummary.urgency_level && (
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  imagingSummary.urgency_level === "Critical"
                    ? "bg-red-100 text-red-700"
                    : imagingSummary.urgency_level === "Urgent"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {imagingSummary.urgency_level}
              </span>
            </div>
          )}

          {/* Key Findings */}
          {imagingSummary.key_findings?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">KEY FINDINGS:</p>
              <ul className="space-y-1">
                {imagingSummary.key_findings.map((finding, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-cyan-600 mt-0.5">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clinical Impression */}
          {imagingSummary.clinical_impression && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">CLINICAL IMPRESSION:</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {imagingSummary.clinical_impression}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {imagingSummary.recommendations?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">RECOMMENDATIONS:</p>
              <ul className="space-y-1">
                {imagingSummary.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-cyan-600 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to Note Button */}
          <Button
            onClick={handleAddToNote}
            className="w-full mt-4 gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="w-4 h-4" /> Add to Clinical Note
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!imagingSummary && !analyzingSummary && !imagingResults && (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Paste imaging results above to start AI analysis
          </p>
        </div>
      )}
    </div>
  );
}