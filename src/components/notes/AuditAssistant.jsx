import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, Wand2, DollarSign, TrendingUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const T = {
  navy:   "#050f1e",
  panel:  "#0e2340",
  edge:   "#162d4f",
  border: "#1e3a5f",
  muted:  "#2a4d72",
  dim:    "#4a7299",
  text:   "#c8ddf0",
  bright: "#e8f4ff",
  teal:   "#00d4bc",
  amber:  "#f5a623",
  red:    "#ff5c6c",
  green:  "#2ecc71",
  purple: "#9b6dff",
};

const EM_LEVELS = {
  "99202": { label: "99202 – New, Low", complexity: "Straightforward", mdc: 1, requires: ["Chief complaint", "Minimal history", "Minimal exam"] },
  "99203": { label: "99203 – New, Low-Mod", complexity: "Low", mdc: 2, requires: ["HPI with 1-3 elements", "Problem-focused exam", "Low MDM or 30 min total time"] },
  "99204": { label: "99204 – New, Moderate", complexity: "Moderate", mdc: 3, requires: ["HPI with ≥4 elements", "Detailed exam", "Moderate MDM or 45 min total time"] },
  "99205": { label: "99205 – New, High", complexity: "High", mdc: 4, requires: ["Comprehensive HPI", "Comprehensive exam", "High MDM or 60 min total time"] },
  "99212": { label: "99212 – Est, Minimal", complexity: "Straightforward", mdc: 1, requires: ["Minimal CC", "Minimal exam", "Straightforward MDM"] },
  "99213": { label: "99213 – Est, Low", complexity: "Low", mdc: 2, requires: ["Brief HPI", "Problem-focused exam", "Low MDM or 20 min total time"] },
  "99214": { label: "99214 – Est, Moderate", complexity: "Moderate", mdc: 3, requires: ["Extended HPI", "Detailed multi-system exam", "Moderate MDM or 30 min total time"] },
  "99215": { label: "99215 – Est, High", complexity: "High", mdc: 4, requires: ["Comprehensive HPI", "Comprehensive multi-system exam", "High MDM or 40 min total time"] },
  "99281": { label: "99281 – ED, Minor", complexity: "Straightforward", mdc: 1, requires: ["CC", "Brief history", "Minimal exam"] },
  "99282": { label: "99282 – ED, Low", complexity: "Low", mdc: 2, requires: ["HPI", "Focused exam", "Straightforward MDM"] },
  "99283": { label: "99283 – ED, Moderate", complexity: "Moderate", mdc: 3, requires: ["HPI with ≥4 elements", "Expanded exam", "Moderate MDM"] },
  "99284": { label: "99284 – ED, Moderate-High", complexity: "Moderate-High", mdc: 4, requires: ["Detailed HPI", "Detailed multi-system exam", "Moderate-High MDM"] },
  "99285": { label: "99285 – ED, High", complexity: "High", mdc: 5, requires: ["Comprehensive HPI & ROS", "Comprehensive exam", "High MDM — high risk decision-making"] },
};

const SEVERITY_CONFIG = {
  met:      { color: T.green,  bg: "rgba(46,204,113,0.08)",  border: "rgba(46,204,113,0.2)",  icon: CheckCircle2, label: "Met" },
  partial:  { color: T.amber,  bg: "rgba(245,166,35,0.08)",  border: "rgba(245,166,35,0.2)",  icon: AlertTriangle,label: "Partial" },
  missing:  { color: T.red,    bg: "rgba(255,92,108,0.08)",  border: "rgba(255,92,108,0.2)",  icon: XCircle,      label: "Missing" },
};

function GhostBtn({ onClick, disabled, children, teal }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
        borderRadius: 8, border: `1px solid ${teal ? "transparent" : T.border}`,
        background: teal ? `linear-gradient(135deg, ${T.teal}, #00a896)` : "transparent",
        color: teal ? T.navy : T.dim, fontSize: 12, fontWeight: teal ? 700 : 500,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        boxShadow: teal ? "0 4px 14px rgba(0,212,188,0.25)" : "none",
        transition: "all 0.15s",
      }}>
      {children}
    </button>
  );
}

export default function AuditAssistant({ note }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetCode, setTargetCode] = useState("99214");
  const [expandedFinding, setExpandedFinding] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const codeInfo = EM_LEVELS[targetCode];
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical auditor and E/M coding specialist. Cross-reference this clinical note against the requirements for ${targetCode} (${codeInfo.label}) billing code.

CURRENT NOTE CONTENT:
- Chief Complaint: ${note.chief_complaint || "Not documented"}
- HPI: ${note.history_of_present_illness || "Not documented"}
- Review of Systems: ${note.review_of_systems || "Not documented"}
- Physical Exam: ${note.physical_exam || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}
- Plan: ${note.plan || "Not documented"}
- MDM: ${note.mdm || "Not documented"}
- Medical History: ${note.medical_history || "Not documented"}
- Medications: ${(note.medications || []).join(", ") || "Not documented"}

TARGET CODE: ${targetCode} — ${codeInfo.label}
Complexity Level: ${codeInfo.complexity}
MDM Complexity Points Required: ${codeInfo.mdc}
Required Elements: ${codeInfo.requires.join("; ")}

For each of the following audit categories, evaluate the note:
1. HPI (History of Present Illness) — does it have sufficient OLDCARTS elements?
2. Review of Systems (ROS) — are enough systems reviewed?
3. Physical Examination — is it sufficiently detailed for the code level?
4. Medical Decision Making (MDM) — number/complexity of problems, data reviewed, risk level
5. Supporting Documentation — are diagnoses supported by documented findings?
6. Problem Complexity — does the complexity match the billing level?

For each category provide:
- status: "met", "partial", or "missing"
- current: what is currently documented
- required: what is required for ${targetCode}
- gap: specific text additions needed (null if met)
- suggestion: a specific, copy-paste-ready documentation phrase to add if gap exists

Also provide:
- overall_level: the highest E/M code the note currently supports (e.g. "99213")
- overall_score: 0-100 documentation completeness score
- upgrade_possible: boolean — can this note be upgraded to ${targetCode} with additions?
- critical_gaps: array of the most important missing items (max 3)`,
        response_json_schema: {
          type: "object",
          properties: {
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  status: { type: "string", enum: ["met", "partial", "missing"] },
                  current: { type: "string" },
                  required: { type: "string" },
                  gap: { type: "string" },
                  suggestion: { type: "string" },
                },
              },
            },
            overall_level: { type: "string" },
            overall_score: { type: "number" },
            upgrade_possible: { type: "boolean" },
            critical_gaps: { type: "array", items: { type: "string" } },
          },
        },
      });
      setResult(res);
    } catch (e) {
      toast.error("Audit failed — please try again");
    }
    setLoading(false);
  };

  const metCount = result?.findings?.filter(f => f.status === "met").length || 0;
  const totalCount = result?.findings?.length || 0;
  const score = result?.overall_score || 0;
  const scoreColor = score >= 80 ? T.green : score >= 55 ? T.amber : T.red;

  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      overflow: "hidden",
      fontFamily: "DM Sans, sans-serif",
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 22, height: 22, borderRadius: 5, background: "rgba(155,109,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={12} style={{ color: T.purple }} />
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: T.dim, letterSpacing: "0.1em" }}>
            E/M Audit Assistant
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(155,109,255,0.1)", color: T.purple, border: "1px solid rgba(155,109,255,0.2)" }}>
            Beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={targetCode}
            onChange={e => setTargetCode(e.target.value)}
            style={{
              background: T.edge, border: `1px solid ${T.border}`, color: T.bright,
              fontSize: 12, padding: "5px 10px", borderRadius: 7, outline: "none",
              cursor: "pointer",
            }}>
            {Object.entries(EM_LEVELS).map(([code, info]) => (
              <option key={code} value={code} style={{ background: T.panel }}>{info.label}</option>
            ))}
          </select>
          <GhostBtn onClick={runAudit} disabled={loading} teal>
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {loading ? "Auditing…" : result ? "Re-Audit" : "Run Audit"}
          </GhostBtn>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {!result && !loading && (
          <div className="py-10 text-center space-y-3">
            <ShieldCheck size={36} style={{ color: T.muted, margin: "0 auto" }} />
            <p className="text-sm font-semibold" style={{ color: T.dim }}>E/M Billing Code Audit</p>
            <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: T.muted }}>
              Select a target billing code above, then run the audit to identify documentation gaps and missing supporting evidence needed to support that level of E/M coding.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {EM_LEVELS[targetCode].requires.map((req, i) => (
                <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: T.edge, color: T.dim, border: `1px solid ${T.border}` }}>{req}</span>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center gap-3" style={{ color: T.teal }}>
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm font-medium" style={{ color: T.dim }}>Cross-referencing note against {EM_LEVELS[targetCode].label}…</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {/* Score Summary */}
            <div className="rounded-xl p-4 flex items-center gap-6" style={{ background: `${T.edge}`, border: `1px solid ${T.border}` }}>
              {/* Score ring */}
              <div className="flex-shrink-0">
                <svg width="76" height="76" viewBox="0 0 76 76">
                  <circle cx="38" cy="38" r="30" fill="none" stroke={T.muted} strokeWidth="6" />
                  <circle cx="38" cy="38" r="30" fill="none" stroke={scoreColor} strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - score / 100)}
                    strokeLinecap="round" transform="rotate(-90 38 38)"
                    style={{ transition: "stroke-dashoffset 1.2s ease" }} />
                  <text x="38" y="38" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 16, fontWeight: 700, fill: scoreColor }}>{score}</text>
                </svg>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="text-sm font-bold" style={{ color: T.bright }}>
                  Documentation Score: <span style={{ color: scoreColor }}>{score}/100</span>
                </div>
                <div className="text-xs" style={{ color: T.dim }}>
                  Currently supports: <span className="font-semibold" style={{ color: T.teal }}>{result.overall_level || "Undetermined"}</span>
                  {" · "}Target: <span className="font-semibold" style={{ color: T.purple }}>{targetCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: result.upgrade_possible ? "rgba(46,204,113,0.1)" : "rgba(255,92,108,0.1)",
                      color: result.upgrade_possible ? T.green : T.red,
                      border: `1px solid ${result.upgrade_possible ? "rgba(46,204,113,0.25)" : "rgba(255,92,108,0.25)"}`,
                    }}>
                    {result.upgrade_possible ? "✓ Upgrade possible with additions" : "✗ Significant gaps remain"}
                  </span>
                  <span className="text-xs" style={{ color: T.dim }}>{metCount}/{totalCount} criteria met</span>
                </div>
              </div>
            </div>

            {/* Critical Gaps */}
            {result.critical_gaps?.length > 0 && (
              <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,92,108,0.06)", border: "1px solid rgba(255,92,108,0.2)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={13} style={{ color: T.red }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.red }}>Critical Gaps</span>
                </div>
                {result.critical_gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "#ff8a95" }}>
                    <span className="mt-0.5 flex-shrink-0">•</span>
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Findings */}
            <div className="space-y-2">
              {result.findings?.map((finding, i) => {
                const cfg = SEVERITY_CONFIG[finding.status] || SEVERITY_CONFIG.missing;
                const Icon = cfg.icon;
                const isOpen = expandedFinding === i;
                return (
                  <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <button
                      onClick={() => setExpandedFinding(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{ background: "transparent" }}>
                      <Icon size={14} style={{ color: cfg.color, flexShrink: 0 }} />
                      <span className="flex-1 text-sm font-semibold" style={{ color: T.bright }}>{finding.category}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                        {cfg.label}
                      </span>
                      {isOpen ? <ChevronUp size={13} style={{ color: T.dim, flexShrink: 0 }} /> : <ChevronDown size={13} style={{ color: T.dim, flexShrink: 0 }} />}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${cfg.border}` }}>
                            <div className="grid grid-cols-2 gap-3 pt-3">
                              <div>
                                <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: T.dim }}>Currently Documented</p>
                                <p className="text-xs leading-relaxed" style={{ color: T.text }}>{finding.current || "Nothing documented"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: T.dim }}>Required for {targetCode}</p>
                                <p className="text-xs leading-relaxed" style={{ color: T.text }}>{finding.required}</p>
                              </div>
                            </div>
                            {finding.gap && (
                              <div className="rounded-lg p-3 space-y-2" style={{ background: `${T.navy}80`, border: `1px solid ${T.border}` }}>
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.amber }}>Documentation Gap</p>
                                <p className="text-xs leading-relaxed" style={{ color: "#ffd080" }}>{finding.gap}</p>
                              </div>
                            )}
                            {finding.suggestion && finding.status !== "met" && (
                              <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(0,212,188,0.06)", border: "1px solid rgba(0,212,188,0.2)" }}>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.teal }}>Suggested Addition</p>
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(finding.suggestion); toast.success("Copied to clipboard"); }}
                                    className="text-xs px-2 py-0.5 rounded"
                                    style={{ background: "rgba(0,212,188,0.1)", color: T.teal, border: "1px solid rgba(0,212,188,0.25)", cursor: "pointer" }}>
                                    Copy
                                  </button>
                                </div>
                                <p className="text-xs leading-relaxed italic" style={{ color: T.teal }}>{finding.suggestion}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}