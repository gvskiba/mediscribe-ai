// VoiceDictationButton — hands-free dictation using Web Speech API
// Appends transcribed text to the target field value
// Usage: <VoiceDictationButton onTranscript={(t) => setValue(prev => prev + t)} fieldLabel="HPI" />

import { useState, useEffect, useRef, useCallback } from "react";

const isSupported = () =>
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export default function VoiceDictationButton({ onTranscript, fieldLabel = "field", compact = false }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim]     = useState("");
  const [error, setError]         = useState(null);
  const recognitionRef = useRef(null);
  const finalBuf = useRef("");

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterim("");
    if (finalBuf.current.trim()) {
      onTranscript((finalBuf.current.trim().endsWith(".") ? " " : ". ") + finalBuf.current.trim());
    }
    finalBuf.current = "";
  }, [onTranscript]);

  const start = useCallback(() => {
    if (!isSupported()) {
      setError("Speech recognition not supported in this browser. Use Chrome or Edge.");
      return;
    }
    setError(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous       = true;
    rec.interimResults   = true;
    rec.lang             = "en-US";
    rec.maxAlternatives  = 1;
    finalBuf.current = "";

    rec.onresult = (e) => {
      let fin = "", intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + " ";
        else intr += t;
      }
      if (fin) finalBuf.current += fin;
      setInterim(intr);
    };

    rec.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      setError(`Mic error: ${e.error}`);
      stop();
    };

    rec.onend = () => {
      // auto-restart if still in listening state (handles 60s browser limit)
      if (recognitionRef.current) {
        try { rec.start(); } catch {}
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (e) {
      setError("Could not start microphone. Check browser permissions.");
    }
  }, [stop]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  // cleanup on unmount
  useEffect(() => () => { recognitionRef.current?.abort(); }, []);

  if (!isSupported() && !error) return null;

  const supported = isSupported();

  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, position:"relative" }}>
      <button
        onClick={toggle}
        title={listening ? `Stop dictation for ${fieldLabel}` : `Dictate ${fieldLabel} hands-free`}
        style={{
          display:"inline-flex", alignItems:"center", gap: compact ? 0 : 5,
          padding: compact ? "3px 7px" : "4px 11px",
          borderRadius:7, cursor: supported ? "pointer" : "default",
          border:`1px solid ${listening ? "rgba(255,61,61,.6)" : "rgba(0,229,192,.4)"}`,
          background: listening
            ? "rgba(255,61,61,.12)"
            : "rgba(0,229,192,.07)",
          color: listening ? "#ff4d4d" : "var(--qn-teal)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
          transition:"all .15s",
          opacity: supported ? 1 : 0.4,
          position:"relative", overflow:"hidden",
        }}
      >
        {/* Pulsing ring when active */}
        {listening && (
          <span style={{
            position:"absolute", inset:0, borderRadius:7,
            border:"1px solid rgba(255,61,61,.5)",
            animation:"qn-voice-pulse 1s ease-in-out infinite",
            pointerEvents:"none",
          }} />
        )}
        <MicIcon listening={listening} />
        {!compact && (
          <span style={{ fontSize:10 }}>
            {listening ? "Stop" : "Dictate"}
          </span>
        )}
      </button>

      {/* Interim transcript badge */}
      {listening && interim && (
        <span style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"rgba(0,229,192,.7)",
          background:"rgba(0,229,192,.07)", border:"1px solid rgba(0,229,192,.2)",
          borderRadius:5, padding:"2px 8px", maxWidth:200,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          display:"inline-block",
        }}>
          {interim}
        </span>
      )}

      {/* Error */}
      {error && (
        <span style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--qn-coral)",
          background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
          borderRadius:5, padding:"2px 8px", maxWidth:260,
          display:"inline-block",
        }}>
          {error}
        </span>
      )}

      <style>{`
        @keyframes qn-voice-pulse {
          0%,100%{opacity:.5;transform:scale(1)}
          50%{opacity:1;transform:scale(1.06)}
        }
      `}</style>
    </div>
  );
}

function MicIcon({ listening }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="12" rx="3"
        fill={listening ? "#ff4d4d" : "currentColor"} opacity={listening ? 0.9 : 0.8} />
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" fill="none" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}