import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Zap, AlertTriangle, CheckCircle, Loader2, X, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};

const FINDING_TYPES = {
  critical: { color: C.red, icon: AlertTriangle, label: "CRITICAL" },
  abnormal: { color: C.amber, icon: Zap, label: "ABNORMAL" },
  normal: { color: C.green, icon: CheckCircle, label: "NORMAL" },
};

export default function EKGViewer({ onAnalysisComplete, initialImageUrl = null }) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      setAnalysis(null);
      setSelectedFinding(null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const analyzeEKG = async () => {
    if (!imageUrl) return;

    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this EKG image and provide a structured clinical interpretation. Identify:
1. Rate and rhythm
2. Axis deviation
3. Intervals (PR, QRS, QT)
4. ST-segment changes (elevation/depression)
5. T-wave abnormalities
6. Bundle branch blocks (LBBB/RBBB)
7. Chamber hypertrophy
8. Ischemic changes
9. Arrhythmias

For each finding, indicate severity (critical/abnormal/normal) and clinical significance.`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            overall_interpretation: { type: "string" },
            severity: { type: "string", enum: ["critical", "abnormal", "normal"] },
            rate_bpm: { type: "number" },
            rhythm: { type: "string" },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  finding: { type: "string" },
                  severity: { type: "string", enum: ["critical", "abnormal", "normal"] },
                  location: { type: "string" },
                  clinical_significance: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            differential_diagnoses: {
              type: "array",
              items: { type: "string" }
            },
            immediate_actions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    setAnalysis(null);
    setSelectedFinding(null);
  };

  return (
    <div style={{ display: "flex", gap: 16, height: "100%" }}>
      {/* Left panel - Image viewer */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Upload area */}
        {!imageUrl && (
          <div
            style={{
              flex: 1,
              border: `2px dashed ${C.border}`,
              borderRadius: 14,
              background: C.panel,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: 32,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.teal;
              e.currentTarget.style.background = `${C.teal}08`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.panel;
            }}
            onClick={() => document.getElementById("ekg-upload").click()}
          >
            <input
              id="ekg-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <Upload size={48} style={{ color: C.teal, opacity: 0.6 }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.bright, marginBottom: 6 }}>
                Upload EKG Image
              </div>
              <div style={{ fontSize: 12, color: C.dim }}>
                Click to select or drag & drop
              </div>
            </div>
            {uploading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.teal }}>
                <Loader2 size={16} className="animate-spin" />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Uploading...</span>
              </div>
            )}
          </div>
        )}

        {/* Image display */}
        {imageUrl && (
          <div style={{ flex: 1, position: "relative", borderRadius: 14, overflow: "hidden", background: "#000", border: `1px solid ${C.border}` }}>
            <img
              src={imageUrl}
              alt="EKG"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            
            {/* Action buttons overlay */}
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="outline"
                onClick={clearImage}
                style={{ background: "rgba(5,15,30,0.9)", border: `1px solid ${C.border}` }}
              >
                <X size={16} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(imageUrl, "_blank")}
                style={{ background: "rgba(5,15,30,0.9)", border: `1px solid ${C.border}` }}
              >
                <Download size={16} />
              </Button>
            </div>

            {/* AI overlay markers */}
            {analysis?.findings && selectedFinding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                }}
              >
                {/* Example marker - in production, coordinates would come from AI */}
                <div
                  style={{
                    position: "absolute",
                    top: "30%",
                    left: "40%",
                    width: 100,
                    height: 60,
                    border: `2px solid ${FINDING_TYPES[selectedFinding.severity]?.color || C.teal}`,
                    borderRadius: 8,
                    background: `${FINDING_TYPES[selectedFinding.severity]?.color || C.teal}15`,
                    animation: "pulse 2s infinite",
                  }}
                />
              </motion.div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {imageUrl && !analysis && (
          <Button
            onClick={analyzeEKG}
            disabled={analyzing}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${C.teal}, #00b8a5)`,
              border: "none",
              padding: "12px",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
                Analyzing EKG...
              </>
            ) : (
              <>
                <Zap size={16} style={{ marginRight: 8 }} />
                Analyze with AI
              </>
            )}
          </Button>
        )}
      </div>

      {/* Right panel - Analysis results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            width: 400,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflow: "auto",
          }}
        >
          {/* Overall interpretation */}
          <div
            style={{
              background: FINDING_TYPES[analysis.severity]?.color
                ? `${FINDING_TYPES[analysis.severity].color}12`
                : C.panel,
              border: `1px solid ${FINDING_TYPES[analysis.severity]?.color || C.border}`,
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {FINDING_TYPES[analysis.severity]?.icon && (
                <FINDING_TYPES[analysis.severity].icon
                  size={18}
                  style={{ color: FINDING_TYPES[analysis.severity].color }}
                />
              )}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: FINDING_TYPES[analysis.severity]?.color || C.text,
                  letterSpacing: ".08em",
                }}
              >
                {FINDING_TYPES[analysis.severity]?.label || "ANALYSIS"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
              {analysis.overall_interpretation}
            </div>
          </div>

          {/* Rate & Rhythm */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: ".1em", marginBottom: 8 }}>
              RATE & RHYTHM
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.bright }}>{analysis.rate_bpm}</div>
                <div style={{ fontSize: 10, color: C.dim }}>bpm</div>
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{analysis.rhythm}</div>
              </div>
            </div>
          </div>

          {/* Findings list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: ".1em" }}>
              FINDINGS ({analysis.findings?.length || 0})
            </div>
            {analysis.findings?.map((finding, idx) => {
              const config = FINDING_TYPES[finding.severity] || FINDING_TYPES.normal;
              const isSelected = selectedFinding === finding;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedFinding(isSelected ? null : finding)}
                  style={{
                    background: isSelected ? `${config.color}15` : C.panel,
                    border: `1px solid ${isSelected ? config.color : C.border}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  whileHover={{ y: -2 }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <config.icon size={14} style={{ color: config.color, marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.bright, marginBottom: 2 }}>
                        {finding.finding}
                      </div>
                      <div style={{ fontSize: 10, color: C.dim }}>{finding.category}</div>
                    </div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: `${config.color}18`,
                        color: config.color,
                      }}
                    >
                      {finding.severity.toUpperCase()}
                    </span>
                  </div>
                  {finding.location && (
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      📍 {finding.location}
                    </div>
                  )}
                  {isSelected && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, color: C.text, marginBottom: 6, lineHeight: 1.5 }}>
                        {finding.clinical_significance}
                      </div>
                      {finding.recommendation && (
                        <div
                          style={{
                            fontSize: 10,
                            color: config.color,
                            background: `${config.color}10`,
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: `1px solid ${config.color}30`,
                          }}
                        >
                          💡 {finding.recommendation}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Differential diagnoses */}
          {analysis.differential_diagnoses?.length > 0 && (
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: ".1em", marginBottom: 8 }}>
                DIFFERENTIAL DIAGNOSES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {analysis.differential_diagnoses.map((dx, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: C.purple }}>•</span>
                    {dx}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Immediate actions */}
          {analysis.immediate_actions?.length > 0 && (
            <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}40`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.red, letterSpacing: ".1em", marginBottom: 8 }}>
                ⚠️ IMMEDIATE ACTIONS REQUIRED
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {analysis.immediate_actions.map((action, idx) => (
                  <div key={idx} style={{ fontSize: 11, color: C.text, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <span style={{ color: C.red, fontWeight: 700, flexShrink: 0 }}>{idx + 1}.</span>
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}