// MDMQualityIndicator.jsx — P4: MDM note quality indicator
// Drop-in strip for MDMBuilderTab.jsx.
//
// Behavior (no gating — always advisory):
//   1. Word count chip with target range 150-350 words
//   2. Boilerplate detector — flags if >= 2 low-value phrases found
//   3. Color coded: green (good) → gold (attention) → coral (poor)
//   4. Expandable detail showing exact issues
//   5. Dismissable per session so it stays out of the way once reviewed
//
// Props:
//   text       string   — the MDM narrative to analyze
//   className  string   — optional outer class
//
// Wiring in MDMBuilderTab.jsx:
//   import MDMQualityIndicator from "@/components/npi/MDMQualityIndicator";
//
//   // After the AI-generated MDM textarea:
//   {mdmText && <MDMQualityIndicator text={mdmText} />}
//
// No async functions, no API calls — pure deterministic analysis.
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo } from "react";

const T = {
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  purple:"#9b6dff", green:"#3dffa0",
};

// ── Boilerplate phrase list ───────────────────────────────────────────────────
// Phrases that inflate note length without adding clinical substance.
// Based on CMS note bloat guidelines and E/M documentation guidance.
const BOILERPLATE = [
  { phrase:"risks and benefits were discussed",     label:"Generic risk counseling" },
  { phrase:"risks and benefits discussed",          label:"Generic risk counseling" },
  { phrase:"patient verbalized understanding",      label:"Formulaic acknowledgment" },
  { phrase:"patient verbalized",                    label:"Formulaic acknowledgment" },
  { phrase:"return precautions were given",         label:"Templated precaution language" },
  { phrase:"return precautions given",              label:"Templated precaution language" },
  { phrase:"return precautions were provided",      label:"Templated precaution language" },
  { phrase:"questions were answered",               label:"Formulaic counseling language" },
  { phrase:"all questions were answered",           label:"Formulaic counseling language" },
  { phrase:"patient tolerated the procedure well",  label:"Boilerplate procedure phrase" },
  { phrase:"informed consent was obtained",         label:"Standalone consent phrase" },
  { phrase:"informed consent obtained",             label:"Standalone consent phrase" },
  { phrase:"the patient is a",                      label:"Redundant patient identifier" },
  { phrase:"presents to the emergency department",  label:"Redundant venue descriptor" },
  { phrase:"presenting to the ed",                  label:"Redundant venue descriptor" },
  { phrase:"no acute distress",                     label:"Exam in MDM (belongs in PE)" },
  { phrase:"alert and oriented",                    label:"Exam in MDM (belongs in PE)" },
  { phrase:"vital signs stable",                    label:"Vitals in MDM (belongs in triage)" },
  { phrase:"labs were reviewed",                    label:"Vague lab reference — specify findings" },
  { phrase:"imaging was reviewed",                  label:"Vague imaging reference — specify findings" },
  { phrase:"follow up with",                        label:"Disposition language in MDM" },
  { phrase:"follow-up with",                        label:"Disposition language in MDM" },
  { phrase:"will follow up",                        label:"Disposition language in MDM" },
  { phrase:"discharged home",                       label:"Disposition in MDM (belongs in disposition)" },
  { phrase:"patient was discharged",                label:"Disposition in MDM" },
];

// ── Word count ────────────────────────────────────────────────────────────────
function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Analyze text ──────────────────────────────────────────────────────────────
function analyzeText(text) {
  if (!text || !text.trim()) return null;

  const wc    = wordCount(text);
  const lower = text.toLowerCase();

  // Find boilerplate hits (deduplicated by label)
  const seenLabels = new Set();
  const hits = BOILERPLATE.filter(b => {
    if (!lower.includes(b.phrase)) return false;
    if (seenLabels.has(b.label))   return false;
    seenLabels.add(b.label);
    return true;
  });

  // Word count rating
  let wcRating = "good";
  if (wc < 80)               wcRating = "poor";
  else if (wc < 150)         wcRating = "low";
  else if (wc > 500)         wcRating = "high";
  else if (wc > 350)         wcRating = "attention";

  // Boilerplate rating
  let bpRating = "good";
  if (hits.length >= 4)      bpRating = "poor";
  else if (hits.length >= 2) bpRating = "attention";

  // Overall
  const ratings = [wcRating, bpRating];
  const overall = ratings.includes("poor")      ? "poor"
    : ratings.includes("attention")             ? "attention"
    : wcRating === "low" || wcRating === "high" ? "attention"
    : "good";

  return { wc, wcRating, hits, bpRating, overall };
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, value, rating, icon }) {
  const color = rating === "good"      ? T.teal
    : rating === "attention"           ? T.gold
    : T.coral;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5,
      padding:"3px 9px", borderRadius:20,
      background:`${color}10`,
      border:`1px solid ${color}35` }}>
      <span style={{ fontSize:11 }}>{icon}</span>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:T.txt4, letterSpacing:0.5 }}>{label}</span>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
        fontWeight:700, color }}>
        {value}
      </span>
    </div>
  );
}

// ── Word count context ────────────────────────────────────────────────────────
function wordCountMessage(wc, rating) {
  if (rating === "poor")      return `${wc} words — too brief for most ED MDM. Expand complexity discussion, data reviewed, and risk of management.`;
  if (rating === "low")       return `${wc} words — below target range (150-350). Consider adding data interpretation and reasoning.`;
  if (rating === "attention") return `${wc} words — consider trimming to improve readability and reduce note bloat.`;
  if (rating === "high")      return `${wc} words — exceeds target. Review for redundancy and remove templated filler.`;
  return `${wc} words — within target range (150-350 words).`;
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function MDMQualityIndicator({ text }) {
  const [expanded,  setExpanded]  = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const analysis = useMemo(() => analyzeText(text), [text]);

  if (!analysis || dismissed) return null;

  const { wc, wcRating, hits, bpRating, overall } = analysis;

  const overallColor = overall === "good"     ? T.teal
    : overall === "attention"                 ? T.gold
    : T.coral;

  const overallIcon = overall === "good" ? "✓" : overall === "attention" ? "◆" : "⚠";
  const overallLabel = overall === "good"
    ? "Note quality: Good"
    : overall === "attention"
    ? "Note quality: Review suggested"
    : "Note quality: Needs improvement";

  return (
    <div style={{ marginTop:8, borderRadius:9,
      background:`${overallColor}06`,
      border:`1px solid ${overallColor}28`,
      overflow:"hidden" }}>

      {/* Summary bar — always visible */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between",
        padding:"7px 11px", gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            letterSpacing:1.5, textTransform:"uppercase",
            color:overallColor }}>
            {overallIcon} {overallLabel}
          </span>

          <Chip label="Words"
            value={wc}
            rating={wcRating === "low" || wcRating === "high"
              ? "attention" : wcRating}
            icon="📝" />

          {hits.length > 0 && (
            <Chip label="Boilerplate"
              value={`${hits.length} phrase${hits.length !== 1 ? "s" : ""}`}
              rating={bpRating}
              icon="🔁" />
          )}
        </div>

        <div style={{ display:"flex", gap:5 }}>
          {(wcRating !== "good" || hits.length > 0) && (
            <button onClick={() => setExpanded(p => !p)}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                letterSpacing:1, textTransform:"uppercase",
                padding:"2px 8px", borderRadius:4, cursor:"pointer",
                border:`1px solid ${overallColor}40`,
                background:`${overallColor}0d`, color:overallColor }}>
              {expanded ? "Hide" : "Details"}
            </button>
          )}
          <button onClick={() => setDismissed(true)}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              padding:"2px 7px", borderRadius:4, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.35)",
              background:"transparent", color:T.txt4, letterSpacing:1 }}>
            ✕
          </button>
        </div>
      </div>

      {/* Detail panel */}
      {expanded && (
        <div style={{ padding:"8px 11px 10px",
          borderTop:`1px solid ${overallColor}20` }}>

          {/* Word count guidance */}
          {wcRating !== "good" && (
            <div style={{ marginBottom:7,
              padding:"6px 9px", borderRadius:7,
              background:`${wcRating === "poor" || wcRating === "low"
                ? T.coral : T.gold}09`,
              border:`1px solid ${wcRating === "poor" || wcRating === "low"
                ? T.coral : T.gold}28` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:wcRating === "poor" || wcRating === "low"
                  ? T.coral : T.gold,
                letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:3 }}>
                Word Count
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.txt3, lineHeight:1.6 }}>
                {wordCountMessage(wc, wcRating)}
              </div>
              <div style={{ marginTop:5, display:"flex",
                alignItems:"center", gap:4 }}>
                {[
                  { label:"<80", note:"too brief" },
                  { label:"80-149", note:"low" },
                  { label:"150-350", note:"target", target:true },
                  { label:"351-500", note:"wordy" },
                  { label:">500", note:"bloated" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex",
                    flexDirection:"column", alignItems:"center", gap:1 }}>
                    <div style={{ padding:"1px 5px", borderRadius:3,
                      background:r.target ? "rgba(0,229,192,0.15)" : "rgba(42,79,122,0.15)",
                      border:`1px solid ${r.target ? "rgba(0,229,192,0.35)" : "rgba(42,79,122,0.25)"}` }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:7, fontWeight:r.target ? 700 : 400,
                        color:r.target ? T.teal : T.txt4 }}>
                        {r.label}
                      </span>
                    </div>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:8, color:r.target ? T.teal : T.txt4 }}>
                      {r.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boilerplate hits */}
          {hits.length > 0 && (
            <div style={{ padding:"6px 9px", borderRadius:7,
              background:"rgba(245,200,66,0.07)",
              border:"1px solid rgba(245,200,66,0.25)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:T.gold, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:5 }}>
                Low-value Phrases Detected
              </div>
              {hits.map((hit, i) => (
                <div key={i} style={{ display:"flex", gap:7,
                  alignItems:"flex-start", marginBottom:4 }}>
                  <span style={{ color:T.gold, fontSize:7,
                    marginTop:3, flexShrink:0 }}>▸</span>
                  <div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:9, color:T.gold }}>
                      "{hit.phrase}"
                    </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:10, color:T.txt4, marginLeft:7 }}>
                      — {hit.label}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:6,
                fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, lineHeight:1.55 }}>
                These phrases add length without clinical substance.
                Replace with specific findings, reasoning, or management decisions.
              </div>
            </div>
          )}

          {/* Good state */}
          {overall === "good" && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.teal }}>
              Note is within target word count and contains no detected boilerplate.
            </div>
          )}
        </div>
      )}
    </div>
  );
}