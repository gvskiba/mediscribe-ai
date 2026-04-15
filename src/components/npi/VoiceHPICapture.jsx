// VoiceHPICapture.jsx — P3: Voice-to-HPI dictation
// Drop-in component for HPITab.jsx.
//
// Behavior:
//   1. Mic button triggers window.SpeechRecognition (Chrome-only)
//   2. Captures up to 90s of continuous dictation
//   3. On stop, sends transcript to Claude with OLDCARTS extraction prompt
//   4. Produces a reviewable draft HPI in a preview panel
//   5. "Apply" button passes the draft to the parent's setter
//   6. Never auto-inserts — physician always reviews first
//
// Props:
//   onApply    fn(text)   — called when physician confirms draft
//   cc         object     — { text } chief complaint for context
//   demo       object     — { age, sex } patient demographics
//   onToast    fn(msg)    — toast bridge
//
// Wiring in HPITab.jsx:
//   import VoiceHPICapture from "@/components/npi/VoiceHPICapture";
//
//   // Near the HPI textarea:
//   <VoiceHPICapture
//     cc={cc} demo={demo}
//     onApply={text => setHpiText(text)}
//     onToast={onToast} />
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on all async functions

import { useState, useRef, useCallback, useEffect } from "react";

const T = {
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  purple:"#9b6dff", green:"#3dffa0", orange:"#ff9f43",
};

// ── Check browser support ─────────────────────────────────────────────────────
function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// ── OLDCARTS extraction prompt ────────────────────────────────────────────────
function buildExtractionPrompt(transcript, cc, demo) {
  const pt = [demo?.age && `${demo.age}yo`, demo?.sex].filter(Boolean).join(" ");
  return {
    system:`You are an emergency medicine physician writing an HPI from a dictation transcript. 
Structure the HPI using OLDCARTS format where applicable:
Onset, Location, Duration, Character, Alleviating/Aggravating factors, Radiation, Timing, Severity.
Write in third person, clinical tone. 2-4 sentences. Include all clinically relevant details from the transcript.
Do NOT add clinical details not mentioned by the physician. Do NOT fill in gaps.
Return ONLY the HPI text — no labels, no preamble, no explanation.`,
    user:`Patient: ${pt || "unknown"}. Chief complaint: ${cc?.text || "not specified"}.

Physician dictation:
"${transcript}"

Write the HPI.`,
  };
}

// ── Waveform animation (pure CSS, no canvas) ──────────────────────────────────
function MicWave({ active }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2, height:18 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width:3, borderRadius:2,
          background:active ? T.coral : T.txt4,
          height:active ? undefined : 6,
          animation:active
            ? `mic-wave-${i % 3} 0.6s ease-in-out ${i * 0.1}s infinite alternate`
            : "none",
        }} />
      ))}
      <style>{`
        @keyframes mic-wave-0 { from{height:4px} to{height:16px} }
        @keyframes mic-wave-1 { from{height:7px} to{height:13px} }
        @keyframes mic-wave-2 { from{height:3px} to{height:18px} }
      `}</style>
    </div>
  );
}

// ── Timer display ──────────────────────────────────────────────────────────────
function useTimer(running) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      setSecs(0);
      ref.current = setInterval(() => setSecs(p => p + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2,"0")}`;
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function VoiceHPICapture({ onApply, cc, demo, onToast }) {
  const [phase,       setPhase]       = useState("idle");
  // phases: idle | recording | processing | preview | error
  const [transcript,  setTranscript]  = useState("");
  const [draft,       setDraft]       = useState("");
  const [errorMsg,    setErrorMsg]    = useState("");
  const [copied,      setCopied]      = useState(false);
  const recRef   = useRef(null);
  const maxTimer = useRef(null);
  const timerStr = useTimer(phase === "recording");
  const isProcessing = phase === "processing";

  const SpeechRec = getSpeechRecognition();
  const supported = Boolean(SpeechRec);

  // ── Start recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!SpeechRec) return;
    setPhase("recording");
    setTranscript("");
    setDraft("");
    setErrorMsg("");

    const rec = new SpeechRec();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = "en-US";

    let finalText = "";

    rec.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += seg + " ";
        else interim += seg;
      }
      setTranscript(finalText + interim);
    };

    rec.onerror = e => {
      if (e.error === "no-speech") return; // ignore silence
      stopRecording(finalText || "");
    };

    rec.onend = () => {
      // Only process if still in recording phase
      setPhase(p => {
        if (p === "recording") {
          extractHPI(finalText.trim() || transcript.trim());
          return "processing";
        }
        return p;
      });
    };

    recRef.current = rec;
    rec.start();

    // Auto-stop at 90 seconds
    maxTimer.current = setTimeout(() => {
      if (recRef.current) recRef.current.stop();
    }, 90000);
  }, [SpeechRec, transcript]);

  const stopRecording = useCallback((forcedText) => {
    clearTimeout(maxTimer.current);
    if (recRef.current) {
      recRef.current.onend = null; // prevent double-fire
      recRef.current.stop();
    }
    const text = (typeof forcedText === "string" ? forcedText : transcript).trim();
    if (!text) {
      setPhase("idle");
      return;
    }
    extractHPI(text);
    setPhase("processing");
  }, [transcript]);

  // ── OLDCARTS extraction ──────────────────────────────────────────────────
  const extractHPI = useCallback(async (text) => {
    if (!text.trim()) { setPhase("idle"); return; }
    setPhase("processing");
    try {
      const { system, user } = buildExtractionPrompt(text, cc, demo);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:400,
          system,
          messages:[{ role:"user", content:user }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const hpi = data.content?.find(b => b.type === "text")?.text || "";
      setDraft(hpi.trim());
      setPhase("preview");
    } catch (e) {
      setErrorMsg("Extraction error: " + (e.message || "API"));
      setPhase("error");
    } finally {
      // no setBusy — phase drives UI
    }
  }, [cc, demo]);

  const handleApply = useCallback(() => {
    if (onApply && draft) {
      onApply(draft);
      onToast?.("Voice HPI applied", "success");
      setPhase("idle");
      setTranscript("");
      setDraft("");
    }
  }, [onApply, draft, onToast]);

  const handleDiscard = useCallback(() => {
    setPhase("idle");
    setTranscript("");
    setDraft("");
    setErrorMsg("");
  }, []);

  const copyDraft = useCallback(() => {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [draft]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Not supported
  if (!supported) {
    return (
      <div style={{ display:"inline-flex", alignItems:"center", gap:6,
        padding:"4px 10px", borderRadius:6,
        background:"rgba(42,79,122,0.1)",
        border:"1px solid rgba(42,79,122,0.3)" }}>
        <span style={{ fontSize:12 }}>🎙</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1 }}>
          Voice requires Chrome
        </span>
      </div>
    );
  }

  // Idle — just the mic trigger button
  if (phase === "idle") {
    return (
      <button onClick={startRecording}
        style={{ display:"inline-flex", alignItems:"center", gap:6,
          padding:"5px 12px", borderRadius:7, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
          transition:"all .15s",
          border:"1px solid rgba(0,229,192,0.4)",
          background:"rgba(0,229,192,0.07)", color:T.teal }}>
        <span style={{ fontSize:14 }}>🎙</span>
        Voice-to-HPI
      </button>
    );
  }

  // Recording — live transcript + stop button
  if (phase === "recording") {
    return (
      <div style={{ padding:"10px 12px", borderRadius:10,
        background:"rgba(255,107,107,0.07)",
        border:"1px solid rgba(255,107,107,0.35)",
        borderLeft:"3px solid " + T.coral }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <MicWave active={true} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.coral, letterSpacing:1.5,
              textTransform:"uppercase" }}>
              Recording {timerStr}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:7, color:T.txt4 }}>max 1:30</span>
          </div>
          <button onClick={() => stopRecording()}
            style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:11, padding:"4px 12px", borderRadius:6,
              cursor:"pointer",
              border:"1px solid rgba(255,107,107,0.5)",
              background:"rgba(255,107,107,0.12)", color:T.coral }}>
            Stop ↵
          </button>
        </div>
        {transcript && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt3, lineHeight:1.6, maxHeight:90, overflowY:"auto",
            padding:"6px 8px", borderRadius:6,
            background:"rgba(5,15,30,0.6)",
            border:"1px solid rgba(42,79,122,0.3)" }}>
            {transcript}
          </div>
        )}
        {!transcript && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt4, fontStyle:"italic" }}>
            Speak now — describe the HPI using your normal clinical language...
          </div>
        )}
      </div>
    );
  }

  // Processing
  if (phase === "processing") {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8,
        padding:"8px 12px", borderRadius:8,
        background:"rgba(155,109,255,0.08)",
        border:"1px solid rgba(155,109,255,0.3)" }}>
        <div style={{ display:"flex", gap:4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:6, height:6, borderRadius:"50%",
              background:T.purple }}
              className={`vhpi-dot-${i}`} />
          ))}
          <style>{`
            .vhpi-dot-0{animation:vhpi-p 1.1s ease-in-out 0s infinite}
            .vhpi-dot-1{animation:vhpi-p 1.1s ease-in-out 0.18s infinite}
            .vhpi-dot-2{animation:vhpi-p 1.1s ease-in-out 0.36s infinite}
            @keyframes vhpi-p{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
          `}</style>
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.purple }}>
          Extracting OLDCARTS from dictation...
        </span>
      </div>
    );
  }

  // Error
  if (phase === "error") {
    return (
      <div style={{ padding:"9px 12px", borderRadius:8,
        background:"rgba(255,107,107,0.07)",
        border:"1px solid rgba(255,107,107,0.3)" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.coral, marginBottom:7 }}>
          {errorMsg}
        </div>
        <button onClick={handleDiscard}
          style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:11, padding:"4px 12px", borderRadius:6,
            cursor:"pointer", border:"1px solid rgba(42,79,122,0.4)",
            background:"transparent", color:T.txt4 }}>
          Dismiss
        </button>
      </div>
    );
  }

  // Preview — review buffer before applying
  return (
    <div style={{ padding:"11px 13px", borderRadius:10,
      background:"rgba(0,229,192,0.06)",
      border:"1px solid rgba(0,229,192,0.35)",
      borderLeft:"3px solid " + T.teal }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.teal, letterSpacing:1.5, textTransform:"uppercase" }}>
            🧠 Voice HPI Draft
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:T.txt4, letterSpacing:1 }}>
            Review before applying
          </span>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <button onClick={copyDraft}
            style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:10, padding:"3px 9px", borderRadius:5,
              cursor:"pointer",
              border:`1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
              background:copied ? "rgba(61,255,160,0.1)" : "transparent",
              color:copied ? T.green : T.txt4 }}>
            {copied ? "✓" : "Copy"}
          </button>
          <button onClick={handleDiscard}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              padding:"3px 8px", borderRadius:5, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.35)",
              background:"transparent", color:T.txt4, letterSpacing:1 }}>
            Discard
          </button>
        </div>
      </div>

      {/* Editable draft */}
      <textarea value={draft} onChange={e => setDraft(e.target.value)}
        rows={4}
        style={{ width:"100%", resize:"vertical",
          background:"rgba(5,15,30,0.7)",
          border:"1px solid rgba(0,229,192,0.3)",
          borderRadius:7, padding:"8px 10px", outline:"none",
          fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:T.txt, lineHeight:1.65 }} />

      {/* Source transcript (collapsible) */}
      {transcript && (
        <details style={{ marginTop:6 }}>
          <summary style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1, cursor:"pointer",
            listStyle:"none" }}>
            View source dictation
          </summary>
          <div style={{ marginTop:5, padding:"6px 8px", borderRadius:6,
            background:"rgba(14,37,68,0.6)",
            border:"1px solid rgba(42,79,122,0.3)",
            fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, lineHeight:1.6, fontStyle:"italic" }}>
            {transcript}
          </div>
        </details>
      )}

      {/* Apply button */}
      <div style={{ marginTop:9, display:"flex",
        justifyContent:"flex-end", gap:7 }}>
        <button onClick={startRecording}
          style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:11, padding:"5px 12px", borderRadius:7,
            cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.4)",
            background:"transparent", color:T.txt4 }}>
          Re-dictate
        </button>
        <button onClick={handleApply}
          style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
            fontSize:12, padding:"6px 18px", borderRadius:8,
            cursor:"pointer",
            background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
            border:"none", color:"#050f1e" }}>
          Apply to HPI ↵
        </button>
      </div>
    </div>
  );
}