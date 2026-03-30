import { useState } from "react";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("hpi-fonts")) return;
  const l = document.createElement("link"); l.id = "hpi-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "hpi-css";
  s.textContent = `
    @keyframes hpi-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .hpi-fade { animation: hpi-fade .3s ease forwards; }
    .hpi-field:focus { border-color: #00d4bc !important; }
    select option { background: #0e2340; color: #c8ddf0; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: rgba(42,77,114,0.5); border-radius: 2px; }
  `;
  document.head.appendChild(s);
})();

const T = {
  navy: "#050f1e", panel: "#081628", card: "#0b1e36",
  border: "rgba(26,53,85,0.6)", borderHi: "rgba(42,79,122,0.9)",
  teal: "#00d4bc", amber: "#f5a623", blue: "#3b9eff",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
  red: "#ff5c6c", green: "#2ecc71", purple: "#9b6dff",
};

const glass = (extra = {}) => ({
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  background: "rgba(8,22,40,0.75)",
  border: "1px solid rgba(26,53,85,0.55)",
  borderRadius: 14,
  ...extra,
});

const deepGlass = (extra = {}) => ({
  backdropFilter: "blur(40px) saturate(220%)",
  WebkitBackdropFilter: "blur(40px) saturate(220%)",
  background: "rgba(5,15,30,0.88)",
  border: "1px solid rgba(26,53,85,0.7)",
  ...extra,
});

const OLDCARTS = [
  {
    id: "onset", label: "Onset", icon: "⏱️", color: T.teal,
    placeholder: "When did it start? Sudden or gradual?",
    hint: "e.g., 3 days ago, sudden onset while at rest",
  },
  {
    id: "location", label: "Location", icon: "📍", color: T.blue,
    placeholder: "Where is the symptom located? Does it radiate?",
    hint: "e.g., substernal chest, radiates to left arm and jaw",
  },
  {
    id: "duration", label: "Duration", icon: "⌛", color: T.amber,
    placeholder: "How long does it last? Constant or intermittent?",
    hint: "e.g., constant for 2 hours, intermittent episodes lasting 5–10 min",
  },
  {
    id: "character", label: "Character", icon: "🔍", color: T.purple,
    placeholder: "Describe the quality/character of the symptom",
    hint: "e.g., pressure-like, sharp, burning, dull, throbbing",
  },
  {
    id: "aggravating", label: "Aggravating Factors", icon: "⬆️", color: T.red,
    placeholder: "What makes it worse?",
    hint: "e.g., exertion, deep breathing, eating, movement",
  },
  {
    id: "relieving", label: "Relieving Factors", icon: "⬇️", color: T.green,
    placeholder: "What makes it better?",
    hint: "e.g., rest, antacids, sitting forward, nitroglycerin",
  },
  {
    id: "timing", label: "Timing / Pattern", icon: "📅", color: T.teal,
    placeholder: "Any pattern? Getting better or worse?",
    hint: "e.g., worse at night, progressive over 3 days, episodic",
  },
  {
    id: "severity", label: "Severity", icon: "📊", color: T.amber,
    placeholder: "Rate pain/symptom severity 0–10",
    hint: "e.g., 8/10 at worst, currently 5/10",
  },
];

const ASSOCIATED = [
  "Nausea / Vomiting", "Diaphoresis", "Shortness of Breath", "Fever / Chills",
  "Dizziness / Syncope", "Palpitations", "Headache", "Vision Changes",
  "Weakness / Numbness", "Cough", "Diarrhea / Constipation", "Hematuria",
  "Hemoptysis", "Melena / Hematochezia", "Rash", "Edema",
  "Weight Loss", "Fatigue", "Anorexia", "Night Sweats",
];

export default function HPI() {
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [fields, setFields] = useState({});
  const [associated, setAssociated] = useState([]);
  const [pertinentNeg, setPertinentNeg] = useState([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedHPI, setGeneratedHPI] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleAssociated = (sym) => {
    setAssociated(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const toggleNeg = (sym) => {
    setPertinentNeg(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const oldcartsText = OLDCARTS.map(f =>
        `${f.label}: ${fields[f.id] || "(not provided)"}`
      ).join("\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an expert emergency medicine documentation assistant. Generate a professional, detailed, medicolegally sound History of Present Illness (HPI) using the OLDCARTS framework.

Chief Complaint: ${chiefComplaint || "(not specified)"}

OLDCARTS Data:
${oldcartsText}

Associated Symptoms (positive): ${associated.length > 0 ? associated.join(", ") : "None documented"}
Pertinent Negatives: ${pertinentNeg.length > 0 ? pertinentNeg.join(", ") : "None documented"}

Additional Context: ${additionalContext || "None"}

Instructions:
- Write in third person, past tense (e.g., "The patient presented with…")
- Incorporate all OLDCARTS elements naturally and cohesively
- Include associated symptoms and pertinent negatives in the narrative
- Use precise, professional emergency medicine language
- Format as a single flowing paragraph (no headers)
- Keep it concise but thorough (4–7 sentences)
- Do NOT include assessment or plan`,
      });

      setGeneratedHPI(typeof result === "string" ? result : result?.data || "");
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    if (generatedHPI) {
      navigator.clipboard.writeText(generatedHPI);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const reset = () => {
    setChiefComplaint("");
    setFields({});
    setAssociated([]);
    setPertinentNeg([]);
    setAdditionalContext("");
    setGeneratedHPI("");
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(14,37,68,0.8)",
    border: "1px solid rgba(26,53,85,0.55)",
    borderRadius: 9,
    padding: "10px 14px",
    color: T.txt,
    fontFamily: "DM Sans, sans-serif",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s",
    resize: "vertical",
  };

  return (
    <div style={{
      background: T.navy, minHeight: "100vh", fontFamily: "DM Sans, sans-serif",
      display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", paddingTop: 80,
    }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-5%", width: "50%", height: "50%", background: "radial-gradient(circle,rgba(0,212,188,0.12) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "0", width: "40%", height: "40%", background: "radial-gradient(circle,rgba(59,158,255,0.08) 0%,transparent 70%)" }} />
      </div>

      {/* Header */}
      <div style={{ ...deepGlass({ borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }), padding: "14px 28px", zIndex: 10, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...deepGlass({ borderRadius: 8 }), padding: "5px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, letterSpacing: 3 }}>NOTRYA</span>
            <span style={{ color: T.txt3, fontFamily: "JetBrains Mono", fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, letterSpacing: 2 }}>HPI BUILDER</span>
          </div>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,rgba(42,77,114,0.5),transparent)" }} />
          <h1 style={{ fontFamily: "Playfair Display", fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 900, color: T.txt, letterSpacing: -0.5 }}>
            HPI Builder
          </h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", position: "relative", zIndex: 1, maxWidth: 1100, width: "100%", margin: "0 auto" }}>

        {/* Chief Complaint */}
        <div style={{ ...glass({ borderRadius: 12 }), padding: "16px 20px", marginBottom: 16 }}>
          <label style={{ display: "block", fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Chief Complaint
          </label>
          <input
            type="text"
            value={chiefComplaint}
            onChange={e => setChiefComplaint(e.target.value)}
            placeholder="e.g., chest pain, shortness of breath, abdominal pain…"
            className="hpi-field"
            style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }}
          />
        </div>

        {/* OLDCARTS Grid */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
            OLDCARTS Framework
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {OLDCARTS.map(f => (
              <div key={f.id} style={{ ...glass({ borderRadius: 12, borderColor: `${f.color}30` }), padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 13, color: f.color }}>{f.label}</div>
                    <div style={{ fontFamily: "DM Sans", fontSize: 10, color: T.txt3 }}>{f.hint}</div>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={fields[f.id] || ""}
                  onChange={e => setFields(p => ({ ...p, [f.id]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="hpi-field"
                  style={{ ...inputStyle }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Associated Symptoms */}
        <div style={{ ...glass({ borderRadius: 12 }), padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
            Associated Symptoms — click to mark as POSITIVE
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ASSOCIATED.map(sym => {
              const isPos = associated.includes(sym);
              const isNeg = pertinentNeg.includes(sym);
              return (
                <div key={sym} style={{ display: "flex", gap: 0 }}>
                  <button
                    onClick={() => { toggleAssociated(sym); if (isNeg) toggleNeg(sym); }}
                    style={{
                      padding: "5px 12px", borderRadius: "8px 0 0 8px",
                      background: isPos ? `${T.teal}25` : "rgba(14,37,68,0.6)",
                      border: `1px solid ${isPos ? T.teal + "77" : "rgba(26,53,85,0.5)"}`,
                      borderRight: "none",
                      color: isPos ? T.teal : T.txt3, fontSize: 12, fontWeight: isPos ? 700 : 400,
                      cursor: "pointer", fontFamily: "DM Sans", transition: "all .15s",
                    }}>
                    {isPos ? "✓ " : ""}{sym}
                  </button>
                  <button
                    onClick={() => { toggleNeg(sym); if (isPos) toggleAssociated(sym); }}
                    style={{
                      padding: "5px 10px", borderRadius: "0 8px 8px 0",
                      background: isNeg ? `${T.red}20` : "rgba(14,37,68,0.4)",
                      border: `1px solid ${isNeg ? T.red + "66" : "rgba(26,53,85,0.4)"}`,
                      color: isNeg ? T.red : T.txt4, fontSize: 11, fontWeight: isNeg ? 700 : 400,
                      cursor: "pointer", fontFamily: "DM Sans", transition: "all .15s",
                    }}>
                    {isNeg ? "−" : "−"}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 11, color: T.txt3, fontFamily: "DM Sans" }}>
            <span><span style={{ color: T.teal }}>✓ teal</span> = Positive symptom</span>
            <span><span style={{ color: T.red }}>−red</span> = Pertinent negative</span>
          </div>
        </div>

        {/* Additional Context */}
        <div style={{ ...glass({ borderRadius: 12 }), padding: "16px 20px", marginBottom: 16 }}>
          <label style={{ display: "block", fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Additional Context (Optional)
          </label>
          <textarea
            rows={3}
            value={additionalContext}
            onChange={e => setAdditionalContext(e.target.value)}
            placeholder="PMH, prior episodes, relevant social history, pertinent medications, allergies, recent travel, sick contacts…"
            className="hpi-field"
            style={{ ...inputStyle }}
          />
        </div>

        {/* Generate Button */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              flex: 1, padding: "13px", borderRadius: 10,
              background: generating ? "rgba(0,212,188,0.15)" : `linear-gradient(135deg,${T.teal},${T.teal}aa)`,
              border: `1px solid ${T.teal}55`,
              color: generating ? T.teal : "#051015",
              fontWeight: 700, fontSize: 15, cursor: generating ? "not-allowed" : "pointer",
              fontFamily: "DM Sans", transition: "all .2s",
            }}>
            {generating ? "✨ Generating HPI…" : "✨ Generate HPI"}
          </button>
          <button
            onClick={reset}
            style={{
              padding: "13px 20px", borderRadius: 10,
              background: "transparent", border: "1px solid rgba(26,53,85,0.5)",
              color: T.txt3, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "DM Sans",
            }}>
            Reset
          </button>
        </div>

        {/* Generated HPI Output */}
        {generatedHPI && (
          <div className="hpi-fade" style={{ ...glass({ borderRadius: 14, background: "rgba(5,15,30,0.85)", borderColor: `${T.teal}44` }), padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, textTransform: "uppercase", letterSpacing: 2, flex: 1 }}>
                Generated HPI
              </div>
              <button
                onClick={copy}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: copied ? `${T.green}20` : `${T.teal}18`,
                  border: `1px solid ${copied ? T.green + "55" : T.teal + "44"}`,
                  color: copied ? T.green : T.teal,
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "DM Sans",
                }}>
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
            <div style={{
              fontFamily: "DM Sans", fontSize: 14, color: T.txt, lineHeight: 1.85,
              whiteSpace: "pre-wrap",
              borderLeft: `3px solid ${T.teal}`,
              paddingLeft: 16,
            }}>
              {generatedHPI}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}