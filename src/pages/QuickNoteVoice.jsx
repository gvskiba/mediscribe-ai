// QuickNoteVoice.jsx
// Voice dictation button (Web Speech API) + Smart Text expansion hook
// Exported: DictationButton, useSmartText, DEFAULT_EXPANSIONS

import React, { useState, useRef, useCallback } from "react";

// ─── DEFAULT SMART TEXT EXPANSIONS ───────────────────────────────────────────
export const DEFAULT_EXPANSIONS = {
  // Chief Complaint shortcuts
  ".cp":  "Chest pain — onset: ___, character: ___, severity: ___/10, radiation: ___, exertional: yes/no",
  ".sob": "Shortness of breath — onset: ___, severity: mild/moderate/severe, pleuritic: yes/no, orthopnea: yes/no",
  ".abd": "Abdominal pain — onset: ___, location: ___, character: ___, severity: ___/10, N/V: yes/no, fever: yes/no",
  ".ha":  "Headache — onset: sudden/gradual, location: ___, severity: ___/10, photophobia: yes/no, neck stiffness: yes/no",
  ".syn": "Syncope — preceded by: ___, duration: ___, witnessed: yes/no, post-ictal: yes/no, prior episodes: yes/no",
  ".bk":  "Back pain — onset: ___, mechanism: ___, radiation to legs: yes/no, bowel/bladder changes: yes/no, saddle anesthesia: yes/no",
  // ROS shortcuts
  ".rosn": "Constitutional: Fever (-), chills (-), fatigue (-), weight loss (-). Cardiovascular: Chest pain (-), palpitations (-), edema (-). Respiratory: SOB (-), cough (-), hemoptysis (-). GI: Nausea (-), vomiting (-), diarrhea (-), melena (-). GU: Dysuria (-), hematuria (-). Neuro: Headache (-), dizziness (-), focal weakness (-), vision changes (-). MSK: Joint pain (-), back pain (-). Skin: Rash (-).",
  ".rosp": "Constitutional: Fever (+), chills (+). All other systems reviewed and negative.",
  // PE shortcuts
  ".normpe": "General: Alert and oriented x3, no acute distress. HEENT: Normocephalic, atraumatic, PERRL, EOMI, MMM. Neck: Supple, no meningismus, no JVD, no lymphadenopathy. Respiratory: Clear to auscultation bilaterally, no wheezes/rales/rhonchi, normal WOB. Cardiovascular: RRR, no murmurs/rubs/gallops, peripheral pulses 2+ bilaterally, no peripheral edema. Abdomen: Soft, non-tender, non-distended, no guarding/rigidity, NABS. Extremities: No edema, no cyanosis, no clubbing. Neuro: A&Ox3, CN II-XII grossly intact, no focal deficits. Skin: Warm, dry, intact, no rash.",
  ".normpeds": "General: Alert, well-appearing, in no acute distress. HEENT: Normocephalic, atraumatic, PERRL, TMs clear bilaterally, MMM, oropharynx clear. Neck: Supple, no meningismus. Respiratory: Clear to auscultation bilaterally, no retractions, no accessory muscle use. Cardiovascular: RRR, no murmurs, capillary refill <2s. Abdomen: Soft, non-tender, non-distended. Skin: Warm, well-perfused, no rash.",
  ".abd2": "Abdomen: Soft, tender to palpation at ___, no guarding, no rigidity, no rebound tenderness, no peritoneal signs. Bowel sounds present. No hepatosplenomegaly. Murphy's sign: negative. McBurney's: negative. Psoas/obturator: negative.",
  ".cv2":  "Cardiovascular: Regular rate and rhythm. No murmurs, rubs, or gallops. No JVD. No peripheral edema. Distal pulses 2+ bilaterally. Capillary refill <2 seconds.",
  ".resp2":"Respiratory: Tachypneic/breathing comfortably at rest. Breath sounds ___ bilaterally. No wheezes, rales, or rhonchi. No accessory muscle use. No retractions. O2 sat ___ on ___.",
  ".neuro":"Neuro: Alert and oriented to person, place, time, and situation. Speech fluent and appropriate. Cranial nerves II-XII grossly intact. Motor strength 5/5 in all extremities. Sensation intact to light touch. Cerebellar: finger-nose intact, gait steady. No pronator drift.",
};

// ─── USE SMART TEXT HOOK ──────────────────────────────────────────────────────
// Detects .abbreviation patterns as user types and expands them
export function useSmartText(value, onChange, customExpansions = {}) {
  const expansions = { ...DEFAULT_EXPANSIONS, ...customExpansions };

  const handleChange = useCallback((newValue) => {
    // Detect trigger: space or newline after a .word pattern
    const triggerMatch = newValue.match(/(\.[a-z][a-z0-9]*)(\s)$/i);
    if (triggerMatch) {
      const key = triggerMatch[1].toLowerCase();
      const expansion = expansions[key];
      if (expansion) {
        const replaced = newValue.slice(0, newValue.length - triggerMatch[0].length) + expansion + triggerMatch[2];
        onChange(replaced);
        return;
      }
    }
    onChange(newValue);
  }, [onChange, expansions]);

  return handleChange;
}

// ─── DICTATION BUTTON ─────────────────────────────────────────────────────────
// Appends transcribed speech to the current field value
export function DictationButton({ onTranscript, fieldLabel }) {
  const [listening, setListening] = useState(false);
  const [error,     setError]     = useState(null);
  const recogRef = useRef(null);

  // Check Web Speech API availability
  const SpeechRecognition = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  if (!SpeechRecognition) return null; // Browser doesn't support it — hide gracefully

  const startListening = () => {
    setError(null);
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = "en-US";

    recog.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onTranscript(transcript);
    };

    recog.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Mic access denied" : "Speech error");
      setListening(false);
    };

    recog.onend = () => setListening(false);

    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  const toggle = () => {
    if (listening) stopListening();
    else startListening();
  };

  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
      <button
        onClick={toggle}
        title={listening ? `Stop dictating ${fieldLabel}` : `Dictate ${fieldLabel}`}
        style={{
          padding:"2px 7px", borderRadius:5, cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          border:`1px solid ${listening ? "rgba(255,107,107,.6)" : "rgba(0,229,192,.35)"}`,
          background:listening ? "rgba(255,107,107,.15)" : "rgba(0,229,192,.07)",
          color:listening ? "var(--qn-coral)" : "var(--qn-teal)",
          transition:"all .15s",
          animation:listening ? "qnpulse 1.2s ease-in-out infinite" : "none",
        }}>
        {listening ? "⏹ Stop" : "🎤"}
      </button>
      {error && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"var(--qn-coral)" }}>{error}</span>
      )}
    </span>
  );
}