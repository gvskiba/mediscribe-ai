import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Upload, Sparkles, Loader2, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

export default function EKGAnalysis({ noteId, onAddToNote }) {
  const [ekgFiles, setEkgFiles] = useState([]);
  const [ekgText, setEkgText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return file_url;
        })
      );

      setEkgFiles((prev) => [...prev, ...uploadedUrls]);
      toast.success(`Uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const analyzeEKG = async () => {
    if (!ekgText && ekgFiles.length === 0) {
      toast.error("Please provide EKG data to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = `You are an expert cardiologist analyzing an EKG (electrocardiogram). Provide a comprehensive clinical interpretation.

${ekgText ? `EKG DATA:\n${ekgText}` : "Review the uploaded EKG images/files."}

Provide a structured analysis with:
1. RHYTHM: Heart rate, rhythm interpretation, regularity
2. INTERVALS: PR interval, QRS duration, QT/QTc interval with values and interpretation
3. AXIS: QRS axis determination
4. KEY_FINDINGS: Important morphological findings (ST changes, T-wave abnormalities, Q waves, etc.)
5. INTERPRETATION: Overall clinical interpretation and diagnosis
6. CLINICAL_SIGNIFICANCE: Clinical implications and urgency level (normal/monitor/urgent)
7. RECOMMENDATIONS: Follow-up actions, additional tests, or clinical correlations needed

Be specific with measurements and diagnostic criteria. If findings suggest acute pathology, clearly state urgency.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: ekgFiles.length > 0 ? ekgFiles : null,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            rhythm: { type: "string" },
            intervals: { type: "string" },
            axis: { type: "string" },
            key_findings: { type: "array", items: { type: "string" } },
            interpretation: { type: "string" },
            clinical_significance: { 
              type: "string",
              enum: ["normal", "monitor", "urgent"]
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);
      toast.success("EKG analysis complete");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze EKG");
    } finally {
      setAnalyzing(false);
    }
  };

  const addToNote = () => {
    if (!analysis) return;

    const ekgSummary = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EKG INTERPRETATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RHYTHM: ${analysis.rhythm}

INTERVALS: ${analysis.intervals}

AXIS: ${analysis.axis}

KEY FINDINGS:
${analysis.key_findings?.map((f, i) => `  ${i + 1}. ${f}`).join('\n') || '  None'}

INTERPRETATION:
${analysis.interpretation}

CLINICAL SIGNIFICANCE: ${analysis.clinical_significance?.toUpperCase()}

RECOMMENDATIONS:
${analysis.recommendations?.map((r, i) => `  • ${r}`).join('\n') || '  None'}

`;

    onAddToNote(ekgSummary);
    toast.success("EKG analysis added to note");
  };

  const addRecommendationsOnly = () => {
    if (!analysis?.recommendations) return;

    const recsText = `\n\nEKG Recommendations:\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}`;
    onAddToNote(recsText);
    toast.success("EKG recommendations added to note");
  };

  const urgencyColor = {
    normal: "bg-emerald-50 border-emerald-300 text-emerald-700",
    monitor: "bg-amber-50 border-amber-300 text-amber-700",
    urgent: "bg-red-50 border-red-300 text-red-700"
  };

  return (
    <div className="bg-white rounded-xl border-2 border-blue-300 shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">EKG AI Analysis</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Upload EKG Files
          </label>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              id="ekg-upload"
              disabled={uploading}
            />
            <label htmlFor="ekg-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {uploading ? "Uploading..." : "Click to upload PDF or image files"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supported: PDF, JPG, PNG</p>
            </label>
          </div>
          {ekgFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {ekgFiles.map((file, i) => (
                <div key={i} className="text-xs text-blue-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  File {i + 1} uploaded
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Or Paste EKG Results
          </label>
          <Textarea
            value={ekgText}
            onChange={(e) => setEkgText(e.target.value)}
            placeholder="Paste EKG interpretation text here (rate, rhythm, intervals, axis, findings)..."
            className="min-h-[120px] text-sm bg-white border-slate-300"
          />
        </div>

        {/* Analyze Button */}
        <Button
          onClick={analyzeEKG}
          disabled={analyzing || (!ekgText && ekgFiles.length === 0)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing EKG...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze with AI
            </>
          )}
        </Button>

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-6 space-y-4 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                EKG Analysis
              </h4>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${urgencyColor[analysis.clinical_significance] || urgencyColor.normal}`}>
                {analysis.clinical_significance?.toUpperCase()}
              </span>
            </div>

            {/* Rhythm */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-bold text-slate-600 mb-1">RHYTHM</p>
              <p className="text-sm text-slate-900">{analysis.rhythm}</p>
            </div>

            {/* Intervals */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-bold text-slate-600 mb-1">INTERVALS</p>
              <p className="text-sm text-slate-900">{analysis.intervals}</p>
            </div>

            {/* Axis */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-bold text-slate-600 mb-1">AXIS</p>
              <p className="text-sm text-slate-900">{analysis.axis}</p>
            </div>

            {/* Key Findings */}
            {analysis.key_findings && analysis.key_findings.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-2">KEY FINDINGS</p>
                <ul className="space-y-1">
                  {analysis.key_findings.map((finding, i) => (
                    <li key={i} className="text-sm text-slate-900 flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interpretation */}
            <div className={`rounded-lg p-4 border-2 ${urgencyColor[analysis.clinical_significance] || urgencyColor.normal}`}>
              <p className="text-xs font-bold mb-2">INTERPRETATION</p>
              <p className="text-sm leading-relaxed">{analysis.interpretation}</p>
            </div>

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs font-bold text-blue-900 mb-2">RECOMMENDATIONS</p>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-slate-900 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Urgent Warning */}
            {analysis.clinical_significance === "urgent" && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">URGENT FINDINGS</p>
                  <p className="text-xs text-red-700 mt-1">This EKG may require immediate clinical attention and correlation.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={addToNote}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Check className="w-4 h-4" />
                Add Full Analysis
              </Button>
              <Button
                onClick={addRecommendationsOnly}
                variant="outline"
                className="flex-1 border-blue-300 hover:bg-blue-50 gap-2"
              >
                Add Recommendations Only
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}