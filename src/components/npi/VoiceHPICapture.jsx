// VoiceHPICapture.jsx
// Microphone-driven HPI dictation with real-time transcript, AI structuring,
// and direct injection into the HPI narrative.
//
// Uses the Web Speech API (SpeechRecognition) for in-browser STT —
// no external API keys required for transcription.
// AI structuring uses the built-in InvokeLLM integration.
//
// Props:
//   cc          object    — { text: string } chief complaint for context
//   demo        object    — { age, sex } for contextual structuring
//   vitals      object    — vital signs for context
//   allergies   array     — allergy list
//   onAccept    fn(text)  — called with the final HPI narrative string
//   onToast     fn(msg, type) — toast bridge
//   embedded    bool      — compact mode when embedded in HPI tab
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on all async functions

import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ── Design tokens (matches NPI palette) ──────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

// ── OLDCARTS element labels ───────────────────────────────────────────────────
const OLDCARTS = [
  { key:"onset",         label:"Onset",            hint:"When did it start?" },
  { key:"location",      label:"Location",         hint:"Where exactly?" },
  { key:"duration",      label:"Duration",         hint:"How long does it last?" },
  { key:"character",     label:"Character",        hint:"Describe the quality" },
  { key:"aggravating",   label:"Aggravating",      hint:"What makes it worse?" },
  { key:"relieving",     label:"Relieving",        hint:"What makes it better?" },
  { key:"timing",        label:"Timing",           hint:"Constant vs intermittent?" },
  { key:"severity",      label:"Severity",         hint:"Scale 0-10 / functional impact" },
];

// ── Browser STT support check ─────────────────────────────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

// ── Waveform bars (CSS animation) ────────────────────────────────────────────
function WaveformBars({ active }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2, height:24 }}>
      {[0.6, 1, 0.75, 1.1, 0.5, 0.9, 0.65].map((h, i) => (
        <div key={i} style={{
          width:3, borderRadius:2,
          background:active ? T.teal : T.txt4,
          height:`${h * 18}px`,
          opacity:active ? 1 : 0.4,
          animation:active ? `voice-bar 0.8s ease-in-out ${i * 0.08}s infinite alternate` : "none",
          transition:"background .3s, opacity .3s",
        }} />
      ))}
      <style>{`
        @keyframes voice-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}

// ── OLDCARTS chip ─────────────────────────────────────────────────────────────
function OLDCARTSChip({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:5,
      padding:"4px 9px", borderRadius:6,
      background:"rgba(59,158,255,0.08)",
      border:"1px solid rgba(59,158,255,0.2)" }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.blue, letterSpacing:1, textTransform:"uppercase",
        flexShrink:0, marginTop:1 }}>{label}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt2, lineHeight:1.45 }}>{value}</span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function VoiceHPICapture({
  cc, demo, vitals, allergies,
  onAccept, onToast, embedded = false,
}) {
  const [phase, setPhase]         = useState("idle");   // idle | recording | processing | review
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim]     = useState("");
  const [structured, setStructured] = useState(null);   // { narrative, oldcarts }
  const [narrative, setNarrative] = useState("");
  const [busy, setBusy]           = useState(false);
  const [elapsed, setElapsed]     = useState(0);
  const [supported] = useState(Boolean(SpeechRecognition));

  const recRef     = useRef(null);
  const timerRef   = useRef(null);
  const timerStart = useRef(null);

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "recording") {
      timerStart.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timerStart.current) / 1000));
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!supported) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalAcc = transcript;

    rec.onresult = e => {
      let interimBuf = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalAcc += (finalAcc ? " " : "") + chunk.trim();
          setTranscript(finalAcc);
          setInterim("");
        } else {
          interimBuf += chunk;
        }
      }
      if (interimBuf) setInterim(interimBuf);
    };

    rec.onerror = e => {
      if (e.error !== "aborted") onToast?.("Microphone error: " + e.error, "error");
      setPhase("idle");
    };

    rec.onend = () => {
      if (recRef.current === rec) setInterim("");
    };

    recRef.current = rec;
    rec.start();
    setPhase("recording");
    setElapsed(0);
  }, [supported, transcript, onToast]);

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setPhase("idle");
  }, []);

  // ── AI structure ───────────────────────────────────────────────────────────
  const structureWithAI = useCallback(async () => {
    const raw = (transcript + " " + interim).trim();
    if (!raw) { onToast?.("Nothing to structure — record some dictation first", "error"); return; }
    setBusy(true);
    setPhase("processing");
    try {
      const ccText = cc?.text || "unknown complaint";
      const pt     = [demo?.age && `${demo.age}yo`, demo?.sex].filter(Boolean).join(" ");
      const data = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are an emergency physician structuring a dictated HPI.
Patient: ${pt || "unknown"}, CC: ${ccText}
Raw dictation: "${raw}"

Extract OLDCARTS elements and write a polished HPI narrative (3-5 sentences, clinical prose).
Respond ONLY with valid JSON:
{
  "narrative": "Full HPI paragraph in third-person clinical prose",
  "onset": "...",
  "location": "...",
  "duration": "...",
  "character": "...",
  "aggravating": "...",
  "relieving": "...",
  "timing": "...",
  "severity": "..."
}
Omit OLDCARTS keys that are not mentioned. narrative is required.`,
        response_json_schema: {
          type:"object",
          properties:{
            narrative:   { type:"string" },
            onset:       { type:"string" },
            location:    { type:"string" },
            duration:    { type:"string" },
            character:   { type:"string" },
            aggravating: { type:"string" },
            relieving:   { type:"string" },
            timing:      { type:"string" },
            severity:    { type:"string" },
          },
          required:["narrative"],
        },
      });
      const { narrative: narr, ...oldcarts } = data;
      setStructured({ oldcarts });
      setNarrative(narr || raw);
      setPhase("review");
      onToast?.("HPI structured", "success");
    } catch (e) {
      onToast?.("Structuring failed — " + (e.message || "API error"), "error");
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }, [transcript, interim, cc, demo, onToast]);

  // ── Accept narrative ───────────────────────────────────────────────────────
  const accept = useCallback(() => {
    onAccept?.(narrative.trim());
    onToast?.("HPI inserted", "success");
    setPhase("idle");
    setTranscript("");
    setInterim("");
    setStructured(null);
    setNarrative("");
    setElapsed(0);
  }, [narrative, onAccept, onToast]);

  const reset = useCallback(() => {
    stopRecording();
    setPhase("idle");
    setTranscript("");
    setInterim("");
    setStructured(null);
    setNarrative("");
    setElapsed(0);
  }, [stopRecording]);

  const displayTranscript = transcript + (interim ? " " + interim : "");
  const wordCount = displayTranscript.trim().split(/\s+/).filter(Boolean).length;

  // ── No support fallback ────────────────────────────────────────────────────
  if (!supported) {
    return (
      <div style={{ padding:"14px 16px", borderRadius:10,
        background:"rgba(255,107,107,0.07)",
        border:"1px solid rgba(255,107,107,0.3)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.coral, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:5 }}>Browser Not Supported</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3 }}>
          Voice HPI requires Chrome, Edge, or Safari with Web Speech API support.
          Use manual dictation via the HPI text area instead.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12,
      fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      {!embedded && (
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.teal }}>
              Voice HPI Capture
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,0.07)",
              border:"1px solid rgba(0,229,192,0.2)",
              borderRadius:4, padding:"2px 8px" }}>
              OLDCARTS · AI Structuring
            </span>
          </div>
          {(phase !== "idle" || transcript) && (
            <button onClick={reset}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                letterSpacing:1, textTransform:"uppercase",
                padding:"3px 9px", borderRadius:6, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"transparent", color:T.txt4 }}>
              Reset
            </button>
          )}
        </div>
      )}

      {/* ── Context strip ───────────────────────────────────────────────────── */}
      {(cc?.text || demo?.age) && (
        <div style={{ display:"flex", alignItems:"center", gap:8,
          padding:"5px 11px", borderRadius:7, flexWrap:"wrap",
          background:"rgba(14,37,68,0.55)",
          border:"1px solid rgba(26,53,85,0.45)" }}>
          {cc?.text && (
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.teal }}>
              CC: {cc.text}
            </span>
          )}
          {demo?.age && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.txt4 }}>
              {demo.age}yo {demo.sex || ""}
            </span>
          )}
        </div>
      )}

      {/* ── IDLE / RECORDING phase ───────────────────────────────────────────── */}
      {(phase === "idle" || phase === "recording") && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Record button */}
          <div style={{ display:"flex", alignItems:"center", gap:12,
            padding:"16px 18px", borderRadius:12,
            background:phase === "recording"
              ? "linear-gradient(135deg,rgba(0,229,192,0.1),rgba(8,22,40,0.9))"
              : "rgba(14,37,68,0.55)",
            border:`1px solid ${phase === "recording"
              ? "rgba(0,229,192,0.35)" : "rgba(42,79,122,0.4)"}` }}>

            <button
              onClick={phase === "recording" ? stopRecording : startRecording}
              style={{ width:52, height:52, borderRadius:"50%", flexShrink:0,
                border:`2px solid ${phase === "recording" ? T.coral : T.teal}`,
                background:phase === "recording"
                  ? "rgba(255,107,107,0.15)" : "rgba(0,229,192,0.12)",
                cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:22,
                transition:"all .2s",
                boxShadow:phase === "recording"
                  ? "0 0 0 6px rgba(0,229,192,0.1)" : "none" }}>
              {phase === "recording" ? "⏹" : "🎙️"}
            </button>

            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10,
                marginBottom:4 }}>
                <WaveformBars active={phase === "recording"} />
                {phase === "recording" && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:12, fontWeight:700, color:T.teal,
                    letterSpacing:1 }}>
                    {fmtTime(elapsed)}
                  </span>
                )}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:phase === "recording" ? T.txt2 : T.txt4 }}>
                {phase === "recording"
                  ? "Recording — speak your HPI dictation. Press stop when done."
                  : "Press the microphone to begin dictating the HPI."}
              </div>
              {wordCount > 0 && phase !== "recording" && (
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.txt4, marginTop:3 }}>
                  {wordCount} words transcribed
                </div>
              )}
            </div>
          </div>

          {/* Live transcript */}
          {displayTranscript && (
            <div style={{ padding:"11px 13px", borderRadius:9,
              background:"rgba(8,22,40,0.7)",
              border:"1px solid rgba(42,79,122,0.4)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:6 }}>
                Live Transcript
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:T.txt2, lineHeight:1.7 }}>
                {transcript}
                {interim && (
                  <span style={{ color:T.txt4, fontStyle:"italic" }}>
                    {" "}{interim}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* OLDCARTS prompt cards — shown while recording */}
          {phase === "recording" && (
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",
              gap:6 }}>
              {OLDCARTS.map(o => (
                <div key={o.key} style={{ padding:"7px 9px", borderRadius:7,
                  background:"rgba(14,37,68,0.5)",
                  border:"1px solid rgba(26,53,85,0.4)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.blue, letterSpacing:1,
                    textTransform:"uppercase", marginBottom:2 }}>
                    {o.label}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt4, fontStyle:"italic" }}>
                    {o.hint}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action bar */}
          {transcript && phase === "idle" && (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={structureWithAI} disabled={busy}
                style={{ flex:1, display:"flex", alignItems:"center",
                  justifyContent:"center", gap:7,
                  padding:"10px 0", borderRadius:9, cursor:"pointer",
                  border:"1px solid rgba(155,109,255,0.45)",
                  background:"linear-gradient(135deg,rgba(155,109,255,0.15),rgba(155,109,255,0.06))",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                  fontSize:13, color:busy ? T.txt4 : T.purple,
                  transition:"all .15s" }}>
                <span>🧠</span>
                {busy ? "Structuring..." : "Structure with AI"}
              </button>
              <button onClick={() => {
                  setNarrative(transcript.trim());
                  setPhase("review");
                }}
                style={{ padding:"10px 16px", borderRadius:9, cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.4)",
                  background:"rgba(42,79,122,0.1)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:T.txt4 }}>
                Use Raw
              </button>
              <button onClick={startRecording}
                style={{ padding:"10px 14px", borderRadius:9, cursor:"pointer",
                  border:"1px solid rgba(0,229,192,0.35)",
                  background:"rgba(0,229,192,0.07)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:T.teal }}>
                + Continue
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PROCESSING phase ─────────────────────────────────────────────────── */}
      {phase === "processing" && (
        <div style={{ display:"flex", flexDirection:"column",
          alignItems:"center", gap:12,
          padding:"28px 20px", borderRadius:12,
          background:"rgba(155,109,255,0.06)",
          border:"1px solid rgba(155,109,255,0.25)" }}>
          <div style={{ display:"flex", gap:5 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:8, height:8, borderRadius:"50%",
                background:T.purple,
                animation:`voice-dot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
            <style>{`
              @keyframes voice-dot {
                0%,80%,100%{transform:translateY(0);opacity:.3}
                40%{transform:translateY(-6px);opacity:1}
              }
            `}</style>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
            color:T.purple, textAlign:"center" }}>
            Structuring HPI with OLDCARTS framework…
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.txt4, textAlign:"center" }}>
            Extracting onset, location, duration, character, aggravating,
            relieving, timing, severity
          </div>
        </div>
      )}

      {/* ── REVIEW phase ─────────────────────────────────────────────────────── */}
      {phase === "review" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* OLDCARTS extracted chips */}
          {structured?.oldcarts && Object.values(structured.oldcarts).some(Boolean) && (
            <div style={{ padding:"11px 13px", borderRadius:10,
              background:"rgba(59,158,255,0.06)",
              border:"1px solid rgba(59,158,255,0.2)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.blue, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:8 }}>
                OLDCARTS Extracted
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {OLDCARTS.map(o => (
                  <OLDCARTSChip
                    key={o.key}
                    label={o.label}
                    value={structured.oldcarts[o.key]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Narrative editor */}
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:5 }}>
              HPI Narrative — Edit before inserting
            </div>
            <textarea
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              rows={5}
              style={{ width:"100%", resize:"vertical",
                background:"rgba(8,22,40,0.75)",
                border:"1px solid rgba(0,229,192,0.3)",
                borderRadius:9, padding:"10px 13px", outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:13,
                color:T.txt, lineHeight:1.7 }}
            />
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginTop:3 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.txt4 }}>
                {narrative.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <button onClick={structureWithAI} disabled={busy}
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  letterSpacing:1, textTransform:"uppercase",
                  padding:"3px 9px", borderRadius:6, cursor:"pointer",
                  border:"1px solid rgba(155,109,255,0.4)",
                  background:"rgba(155,109,255,0.1)",
                  color:busy ? T.txt4 : T.purple }}>
                {busy ? "..." : "Regenerate"}
              </button>
            </div>
          </div>

          {/* Accept / back actions */}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={accept} disabled={!narrative.trim()}
              style={{ flex:1, padding:"11px 0", borderRadius:10,
                cursor:narrative.trim() ? "pointer" : "not-allowed",
                border:"1px solid rgba(0,229,192,0.5)",
                background:"linear-gradient(135deg,rgba(0,229,192,0.18),rgba(0,229,192,0.06))",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                fontSize:13, color:narrative.trim() ? T.teal : T.txt4,
                transition:"all .15s" }}>
              ✓ Insert into HPI
            </button>
            <button onClick={() => setPhase("idle")}
              style={{ padding:"11px 16px", borderRadius:10, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
              Back
            </button>
            <button onClick={reset}
              style={{ padding:"11px 14px", borderRadius:10, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.35)",
                background:"transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>
              Reset
            </button>
          </div>
        </div>
      )}

      {/* ── Tip footer ───────────────────────────────────────────────────────── */}
      {phase === "idle" && !transcript && (
        <div style={{ display:"flex", gap:12, flexWrap:"wrap",
          padding:"8px 12px", borderRadius:8,
          background:"rgba(8,22,40,0.5)",
          border:"1px solid rgba(26,53,85,0.35)" }}>
          {[
            { tip:"Speak naturally — don't spell out OLDCARTS" },
            { tip:"Include onset, severity, relieving factors" },
            { tip:"AI will structure into clinical prose" },
          ].map((t, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start",
              gap:5, flex:"1 1 160px" }}>
              <span style={{ color:T.teal, fontSize:10, flexShrink:0 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, lineHeight:1.5 }}>
                {t.tip}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}