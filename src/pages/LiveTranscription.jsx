import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Square, Play, Download, Copy } from "lucide-react";

const COLORS = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0d2240",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
};

export default function LiveTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [soapSegments, setSOAPSegments] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordingData, setRecordingData] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Initialize audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await processAudio(blob);
      };

      mediaRecorder.start(1000); // Chunk every second
      setIsRecording(true);
      setElapsed(0);
      setRecordingData(chunks);

      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Check permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const processAudio = useCallback(async (audioBlob) => {
    setProcessing(true);
    try {
      // Upload audio file first
      const uploadResult = await base44.integrations.Core.UploadFile({
        file: audioBlob,
      });

      // Send to backend for transcription and SOAP generation
      const result = await base44.functions.invoke("processAudioTranscription", {
        file_url: uploadResult.file_url,
      });

      if (result.data) {
        setTranscript(result.data.transcript || "");
        setSOAPSegments({
          subjective: result.data.subjective || "",
          objective: result.data.objective || "",
          assessment: result.data.assessment || "",
          plan: result.data.plan || "",
        });
      }
    } catch (error) {
      console.error("Error processing audio:", error);
    } finally {
      setProcessing(false);
    }
  }, []);

  const resetSession = () => {
    setTranscript("");
    setSOAPSegments({ subjective: "", objective: "", assessment: "", plan: "" });
    setElapsed(0);
    setRecordingData([]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: COLORS.navy, minHeight: "100vh", color: COLORS.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <nav style={{ height: 58, background: `rgba(11,29,53,0.96)`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: 24, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, color: COLORS.bright }}>
          🎙️ Live Transcription Studio
        </div>
        <div style={{ flex: 1 }} />
        {isRecording && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 16px", borderRadius: 8, background: `rgba(255,92,108,0.1)`, border: `1px solid ${COLORS.red}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, animation: "pulse 1s infinite" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: COLORS.red }}>
              {formatTime(elapsed)}
            </span>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "24px", maxWidth: "1400px", margin: "0 auto", minHeight: "calc(100vh - 58px)" }}>
        {/* Left: Recording & Transcript */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recording Controls */}
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.bright }}>🎤 Recording</div>
            <div style={{ display: "flex", gap: 12 }}>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: `linear-gradient(135deg, ${COLORS.teal}, #00a896)`,
                    color: COLORS.navy,
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Mic size={18} /> Start Recording
                </button>
              ) : (
                <>
                  <button
                    onClick={stopRecording}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      background: `rgba(255,92,108,0.2)`,
                      color: COLORS.red,
                      border: `1px solid ${COLORS.red}`,
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Square size={18} /> Stop
                  </button>
                </>
              )}
            </div>
            {processing && (
              <div style={{ fontSize: 12, color: COLORS.teal, textAlign: "center", fontWeight: 600 }}>
                ✦ Processing audio and generating SOAP notes…
              </div>
            )}
          </div>

          {/* Live Transcript */}
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 300 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.bright }}>📝 Live Transcript</div>
              {transcript && (
                <button
                  onClick={() => copyToClipboard(transcript)}
                  style={{
                    padding: "4px 10px",
                    background: `rgba(0,212,188,0.1)`,
                    color: COLORS.teal,
                    border: `1px solid ${COLORS.teal}`,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Copy size={11} /> Copy
                </button>
              )}
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: `rgba(11,29,53,0.5)`,
                borderRadius: 10,
                padding: 12,
                fontSize: 13,
                lineHeight: 1.8,
                color: COLORS.text,
                minHeight: 200,
              }}
            >
              {transcript || <span style={{ color: COLORS.dim, fontStyle: "italic" }}>Transcript will appear here…</span>}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>

        {/* Right: SOAP Segments */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {["subjective", "objective", "assessment", "plan"].map((section) => {
            const labels = {
              subjective: "S — Subjective",
              objective: "O — Objective",
              assessment: "A — Assessment",
              plan: "P — Plan",
            };
            const colors = {
              subjective: "#4a90d9",
              objective: "#2ecc71",
              assessment: "#f5a623",
              plan: "#9b6dff",
            };
            return (
              <div
                key={section}
                style={{
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 16px",
                    background: `${colors[section]}20`,
                    borderBottom: `1px solid ${COLORS.border}`,
                    fontWeight: 700,
                    fontSize: 12,
                    color: colors[section],
                  }}
                >
                  {labels[section]}
                </div>
                <div
                  style={{
                    padding: 16,
                    minHeight: 120,
                    background: `rgba(11,29,53,0.5)`,
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: COLORS.text,
                    overflowY: "auto",
                    maxHeight: 200,
                  }}
                >
                  {soapSegments[section] || (
                    <span style={{ color: COLORS.dim, fontStyle: "italic" }}>
                      {section} data will appear here…
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Reset Button */}
          {(transcript || Object.values(soapSegments).some((v) => v)) && (
            <button
              onClick={resetSession}
              style={{
                padding: "10px 16px",
                background: `rgba(255,92,108,0.1)`,
                color: COLORS.red,
                border: `1px solid ${COLORS.red}`,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              Clear Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}