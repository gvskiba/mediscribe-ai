// DischargeReadabilityStrip.jsx — P6: Reading Level + Attestation
//
// Evidence basis: discharge instruction comprehension predicts ED return visits.
// Reading level >= grade 9 correlates with poor comprehension in typical ED
// patient populations. Average US adult reads at grade 7-8 level.
// AI-generated instructions may trend toward higher reading levels.
//
// Features:
//   1. Flesch-Kincaid Grade Level — computed client-side, pure JS, no API
//   2. Color-coded chip: green (grade 6-8), gold (grade 9-10), coral (>11 or <5)
//   3. Readability suggestions when level is too high
//   4. Physician attestation checkbox — confirms AI content was reviewed
//   5. Controls the primary Copy/Print active state (with bypass "Copy anyway")
//
// Flesch-Kincaid Grade Level:
//   FKGL = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
//   Source: Kincaid et al. (1975), used by CMS, AHRQ, and FDA for
//   patient communication standards.
//
// Props:
//   text        string   — discharge instructions text to analyze
//   onAttest    fn(bool) — called when attestation checkbox changes
//   attested    bool     — controlled attestation state
//   onCopy      fn()     — primary copy action
//   onPrint     fn()     — optional print action
//
// Wiring in SmartDischargeHub.jsx or DischargeInstructionsTab.jsx:
//   import DischargeReadabilityStrip from
//     "@/components/npi/DischargeReadabilityStrip";
//
//   // Replace or wrap existing copy button:
//   {generatedText && (
//     <DischargeReadabilityStrip
//       text={generatedText}
//       attested={attested}
//       onAttest={setAttested}
//       onCopy={() => copyToClipboard(generatedText)} />
//   )}
//
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo } from "react";

const T = {
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  purple:"#9b6dff", green:"#3dffa0", orange:"#ff9f43",
};

// ── Syllable counter (Heuristic — no dictionary lookup) ───────────────────────
// Reasonably accurate for clinical English. Based on standard heuristics
// used in Flesch-Kincaid implementations.
function countSyllables(word) {
  if (!word || word.length === 0) return 0;
  const w = word.toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/e$/, "");          // strip silent final e
  if (w.length === 0) return 1;

  // Count vowel groups (each group = 1 syllable)
  const matches = w.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 0;

  // Adjustments
  if (/le$/.test(w) && !/[aeiouy]l$/.test(w)) count++;    // -le ending
  if (/ion/.test(w)) count++;                               // -tion, -sion add a syllable
  if (count === 0) count = 1;                               // minimum 1

  return count;
}

// ── Sentence splitter ─────────────────────────────────────────────────────────
function splitSentences(text) {
  const raw = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  return raw.filter(s => s.trim().length > 0);
}

// ── Flesch-Kincaid Grade Level ────────────────────────────────────────────────
function computeFKGL(text) {
  if (!text || text.trim().length < 20) return null;

  const words     = text.trim().split(/\s+/).filter(Boolean);
  const sentences = splitSentences(text);
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  const wc = words.length;
  const sc = Math.max(1, sentences.length);
  const sy = syllables;

  // FKGL = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const fkgl = 0.39 * (wc / sc) + 11.8 * (sy / wc) - 15.59;
  return Math.round(fkgl * 10) / 10;
}

// ── Grade level metadata ──────────────────────────────────────────────────────
function gradeLevel(fkgl) {
  if (fkgl === null) return null;
  if (fkgl < 5)   return { rating:"low",  color:T.gold,  label:`Grade ${fkgl}`, note:"Very simple — may lack clinical completeness" };
  if (fkgl <= 8)  return { rating:"good", color:T.teal,  label:`Grade ${fkgl}`, note:"Optimal — accessible to most adult readers" };
  if (fkgl <= 10) return { rating:"fair", color:T.gold,  label:`Grade ${fkgl}`, note:"Above average — consider simplifying for some patients" };
  if (fkgl <= 13) return { rating:"poor", color:T.coral, label:`Grade ${fkgl}`, note:"College level — likely difficult for many patients" };
  return                 { rating:"high", color:T.coral, label:`Grade ${fkgl}`, note:"Graduate level — simplify significantly" };
}

// ── Simplification suggestions ────────────────────────────────────────────────
const SIMPLIFY_PATTERNS = [
  { pattern:/administer/gi,               suggestion:"give"       },
  { pattern:/subsequently/gi,             suggestion:"then"       },
  { pattern:/approximately/gi,            suggestion:"about"      },
  { pattern:/immediately/gi,              suggestion:"right away" },
  { pattern:/physician/gi,                suggestion:"doctor"     },
  { pattern:/medication\(s\)/gi,          suggestion:"medicines"  },
  { pattern:/discontinue/gi,              suggestion:"stop"       },
  { pattern:/initiate/gi,                 suggestion:"start"      },
  { pattern:/utilize/gi,                  suggestion:"use"        },
  { pattern:/demonstrate/gi,              suggestion:"show"       },
  { pattern:/obtain/gi,                   suggestion:"get"        },
  { pattern:/sufficient/gi,               suggestion:"enough"     },
  { pattern:/in the event that/gi,        suggestion:"if"         },
  { pattern:/prior to/gi,                 suggestion:"before"     },
  { pattern:/due to the fact that/gi,     suggestion:"because"    },
  { pattern:/in order to/gi,              suggestion:"to"         },
  { pattern:/at this time/gi,             suggestion:"now"        },
];

function findSimplifications(text) {
  const hits = [];
  SIMPLIFY_PATTERNS.forEach(({ pattern, suggestion }) => {
    const matches = text.match(pattern);
    if (matches) {
      hits.push({ original:matches[0], suggestion, count:matches.length });
    }
  });
  return hits.slice(0, 5);
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function DischargeReadabilityStrip({
  text, attested, onAttest, onCopy, onPrint,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copyBypassed,    setCopyBypassed]    = useState(false);
  const [copied,          setCopied]          = useState(false);

  const fkgl   = useMemo(() => computeFKGL(text), [text]);
  const grade  = useMemo(() => gradeLevel(fkgl),  [fkgl]);
  const simple = useMemo(() => {
    if (!grade || grade.rating === "good" || grade.rating === "low") return [];
    return findSimplifications(text);
  }, [text, grade]);

  const wordCount = useMemo(() =>
    text ? text.trim().split(/\s+/).filter(Boolean).length : 0,
  [text]);

  const canCopy   = attested || copyBypassed;
  const needsAttn = grade && (grade.rating === "poor" || grade.rating === "high");

  const handleCopy = () => {
    if (!canCopy) return;
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!text || !text.trim() || fkgl === null) return null;

  return (
    <div style={{ marginTop:10, borderRadius:10,
      background:"rgba(8,18,40,0.7)",
      border:"1px solid rgba(42,79,122,0.35)",
      overflow:"hidden" }}>

      {/* ── Top strip — always visible ──────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap",
        gap:8, padding:"9px 12px" }}>

        <div style={{ display:"flex", alignItems:"center",
          gap:8, flexWrap:"wrap" }}>

          {/* Reading level chip */}
          <div style={{ display:"flex", alignItems:"center", gap:5,
            padding:"4px 11px", borderRadius:20,
            background:`${grade.color}10`,
            border:`1px solid ${grade.color}35` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4, letterSpacing:0.5 }}>
              Reading Level
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:11, fontWeight:700, color:grade.color }}>
              {grade.label}
            </span>
            {grade.rating === "good" && (
              <span style={{ fontSize:10 }}>&#10003;</span>
            )}
          </div>

          {/* Word count */}
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:T.txt4, letterSpacing:0.5 }}>
            {wordCount} words
          </span>

          {/* Grade note */}
          <span style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color:grade.color }}>
            {grade.note}
          </span>

          {/* Simplification hint */}
          {simple.length > 0 && (
            <button onClick={() => setShowSuggestions(p => !p)}
              style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:7, letterSpacing:1, textTransform:"uppercase",
                padding:"2px 8px", borderRadius:4, cursor:"pointer",
                border:`1px solid ${T.gold}44`,
                background:`${T.gold}0d`, color:T.gold }}>
              {showSuggestions ? "Hide" : `${simple.length} simplification${simple.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>

        {/* Reading level legend */}
        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
          {[
            { label:"6-8", color:T.teal,  note:"target" },
            { label:"9-10",color:T.gold  },
            { label:">11", color:T.coral },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", alignItems:"center", gap:3 }}>
              <div style={{ width:6, height:6, borderRadius:"50%",
                background:r.color }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:7, color:r.color }}>
                {r.label}{r.note ? ` (${r.note})` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Simplification suggestions ──────────────────────────────────── */}
      {showSuggestions && simple.length > 0 && (
        <div style={{ padding:"8px 12px 10px",
          borderTop:"1px solid rgba(26,53,85,0.3)",
          background:"rgba(245,200,66,0.04)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:T.gold, letterSpacing:1.5,
            textTransform:"uppercase", marginBottom:7 }}>
            Suggested Simplifications
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {simple.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center",
                gap:5, padding:"3px 9px", borderRadius:6,
                background:"rgba(245,200,66,0.07)",
                border:"1px solid rgba(245,200,66,0.25)" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.coral,
                  textDecoration:"line-through" }}>
                  {s.original}
                </span>
                <span style={{ color:T.txt4, fontSize:9 }}>&rarr;</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.teal }}>
                  {s.suggestion}
                </span>
                {s.count > 1 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, color:T.txt4 }}>
                    &times;{s.count}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:7, lineHeight:1.55 }}>
            Edit the text above and these suggestions will update in real-time.
          </div>
        </div>
      )}

      {/* ── Attestation section ─────────────────────────────────────────── */}
      <div style={{ padding:"10px 12px",
        borderTop:"1px solid rgba(26,53,85,0.4)",
        background:attested
          ? "rgba(61,255,160,0.04)"
          : needsAttn
          ? "rgba(255,107,107,0.04)"
          : "rgba(42,79,122,0.04)" }}>

        {/* Attestation checkbox */}
        <button onClick={() => onAttest?.(!attested)}
          style={{ display:"flex", alignItems:"flex-start", gap:9,
            cursor:"pointer", border:"none",
            background:"transparent", textAlign:"left",
            width:"100%", marginBottom:10 }}>
          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
            marginTop:1,
            border:`2px solid ${attested ? T.teal : "rgba(42,79,122,0.55)"}`,
            background:attested ? T.teal : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .1s" }}>
            {attested && (
              <span style={{ color:"#050f1e", fontSize:10,
                fontWeight:900, lineHeight:1 }}>&#10003;</span>
            )}
          </div>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:12,
              color:attested ? T.teal : T.txt2 }}>
              {attested
                ? "Physician attestation confirmed"
                : "I have reviewed these AI-generated instructions and confirm their accuracy before providing them to the patient"}
            </div>
            {!attested && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, marginTop:3, lineHeight:1.5 }}>
                AI output must be reviewed before patient delivery.
                {needsAttn && " High reading level detected — verify patient can understand this content."}
              </div>
            )}
          </div>
        </button>

        {/* Action buttons */}
        <div style={{ display:"flex", alignItems:"center", gap:8,
          flexWrap:"wrap" }}>

          {/* Primary copy */}
          <button onClick={handleCopy}
            disabled={!canCopy}
            title={!canCopy ? "Complete attestation above to copy" : ""}
            style={{ display:"flex", alignItems:"center", gap:6,
              padding:"7px 18px", borderRadius:8,
              cursor:canCopy ? "pointer" : "not-allowed",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:12, transition:"all .15s",
              border:`1px solid ${copied
                ? T.green + "66"
                : canCopy
                ? "rgba(0,229,192,0.5)"
                : "rgba(42,79,122,0.3)"}`,
              background:copied
                ? "rgba(61,255,160,0.12)"
                : canCopy
                ? "linear-gradient(135deg,rgba(0,229,192,0.15),rgba(0,229,192,0.06))"
                : "rgba(42,79,122,0.1)",
              color:copied ? T.green : canCopy ? T.teal : T.txt4 }}>
            {copied ? "&#10003; Copied" : canCopy ? "Copy Instructions" : "&#128274; Copy Instructions"}
          </button>

          {/* Print button */}
          {onPrint && (
            <button onClick={canCopy ? onPrint : undefined}
              disabled={!canCopy}
              style={{ padding:"7px 14px", borderRadius:8,
                cursor:canCopy ? "pointer" : "not-allowed",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:12, transition:"all .15s",
                border:"1px solid rgba(42,79,122,0.35)",
                background:"transparent",
                color:canCopy ? T.txt3 : T.txt4 }}>
              Print
            </button>
          )}

          {/* Bypass */}
          {!attested && (
            <button onClick={() => { setCopyBypassed(true); handleCopy(); }}
              style={{ marginLeft:"auto",
                fontFamily:"'DM Sans',sans-serif", fontSize:10,
                fontWeight:500, padding:"5px 12px", borderRadius:6,
                cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.3)",
                background:"transparent", color:T.txt4 }}>
              Copy anyway
            </button>
          )}
        </div>

        {/* Attestation audit notice */}
        {attested && (
          <div style={{ marginTop:8,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.teal, letterSpacing:1, opacity:0.7 }}>
            Attestation timestamp will be included in Note Audit Lock
          </div>
        )}
      </div>
    </div>
  );
}