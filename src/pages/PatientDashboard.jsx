import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

export default function PatientDashboard() {
  const [encounterId, setEncounterId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [clinicalSummary, setClinicalSummary] = useState(null);
  const [generatingAISummary, setGeneratingAISummary] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEncounterId(params.get("encounterId"));
    setPatientId(params.get("patientId"));
    
    // Check for current open note in localStorage
    const currentNote = localStorage.getItem('currentOpenNote');
    if (currentNote) {
      setNoteId(currentNote);
    }
  }, []);

  // Parallel data fetching per schema dataLoadSequence
  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => base44.entities.Patient.get(patientId),
    enabled: !!patientId,
  });

  const { data: encounter, refetch: refetchEncounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: () => base44.entities.Encounter.get(encounterId),
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 60000 : false,
  });

  const { data: vitals = [], refetch: refetchVitals } = useQuery({
    queryKey: ["vitals", encounterId],
    queryFn: async () => {
      const results = await base44.entities.VitalsRecord.list();
      return results
        .filter(v => v.encounterId === encounterId)
        .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
        .slice(0, 5);
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 60000 : false,
  });

  const { data: assessment } = useQuery({
    queryKey: ["assessment", encounterId],
    queryFn: async () => {
      const results = await base44.entities.AssessmentNote.list();
      return results.find(a => a.encounterId === encounterId);
    },
    enabled: !!encounterId,
  });

  const { data: medications = [], refetch: refetchMeds } = useQuery({
    queryKey: ["medications", encounterId],
    queryFn: async () => {
      const results = await base44.entities.MedicationAdministration.list();
      return results
        .filter(m => m.encounterId === encounterId)
        .sort((a, b) => new Date(b.givenAt) - new Date(a.givenAt));
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 120000 : false,
  });

  const { data: labs = [], refetch: refetchLabs } = useQuery({
    queryKey: ["labs", encounterId],
    queryFn: async () => {
      const results = await base44.entities.LabOrder.list();
      return results
        .filter(l => l.encounterId === encounterId)
        .sort((a, b) => new Date(a.orderedAt) - new Date(b.orderedAt));
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 120000 : false,
  });

  const { data: imaging = [], refetch: refetchImaging } = useQuery({
    queryKey: ["imaging", encounterId],
    queryFn: async () => {
      const results = await base44.entities.ImagingOrder.list();
      return results
        .filter(i => i.encounterId === encounterId)
        .sort((a, b) => new Date(a.orderedAt) - new Date(b.orderedAt));
    },
    enabled: !!encounterId,
    refetchInterval: isAutoRefreshEnabled ? 180000 : false,
  });

  const { data: dischargeSummary } = useQuery({
    queryKey: ["dischargeSummary", encounterId],
    queryFn: async () => {
      const results = await base44.entities.DischargeSummary.list();
      return results.find(ds => ds.encounterId === encounterId);
    },
    enabled: !!encounterId,
  });

  const { data: currentNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => base44.entities.ClinicalNote.get(noteId),
    enabled: !!noteId,
  });

  const handleRefresh = async () => {
    setLastUpdated(new Date());
    await Promise.all([
      refetchVitals(),
      refetchMeds(),
      refetchLabs(),
      refetchImaging(),
      refetchEncounter(),
    ]);
  };

  const generateAIClinicalSummary = async () => {
    if (!currentNote) return;
    setGeneratingAISummary(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this clinical note and generate a concise clinical summary. Return a JSON object with these exact fields:

CLINICAL NOTE:
Chief Complaint: ${currentNote.chief_complaint || "Not documented"}
HPI: ${currentNote.history_of_present_illness || "Not documented"}
Physical Exam: ${JSON.stringify(currentNote.physical_exam) || "Not documented"}
Labs: ${JSON.stringify(currentNote.lab_findings) || "None"}
Imaging: ${JSON.stringify(currentNote.imaging_findings) || "None"}
Plan: ${currentNote.plan || "Not documented"}

Return JSON with:
- chief_complaint: 1-2 sentence summary (or "Not documented")
- hpi: 2-3 sentence summary of history (or "Not documented")
- key_findings: 2-3 sentence AI summary of the most important physical exam findings
- workup_summary: 1-2 sentence summary of labs and imaging (or "No workup documented")
- clinical_course: 2-3 sentence summary of clinical reasoning and plan (or "Not documented")`,
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint: { type: "string" },
            hpi: { type: "string" },
            key_findings: { type: "string" },
            workup_summary: { type: "string" },
            clinical_course: { type: "string" }
          }
        }
      });
      
      setClinicalSummary(result);
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
    } finally {
      setGeneratingAISummary(false);
    }
  };

  const minutesSinceUpdate = lastUpdated ? differenceInMinutes(new Date(), lastUpdated) : null;

  // CSS Variables
  const colors = {
    navy: "#050f1e",
    slate: "#0b1d35",
    panel: "#0e2340",
    edge: "#162d4f",
    border: "#1e3a5f",
    muted: "#2a4d72",
    dim: "#4a7299",
    text: "#c8ddf0",
    bright: "#e8f4ff",
    teal: "#00d4bc",
    amber: "#f5a623",
    red: "#ff5c6c",
    green: "#2ecc71",
    purple: "#9b6dff",
    rose: "#f472b6",
  };

  return (
    <div style={{ background: colors.navy, fontFamily: "DM Sans, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", color: colors.text, marginLeft: 0, marginTop: 0 }}>
      {/* Top Navigation Bar */}
      <div style={{ background: colors.slate, borderBottom: `1px solid ${colors.border}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Row 1: Patient Info + Vitals */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: colors.purple, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "14px" }}>
              {patient?.name?.charAt(0) || "P"}
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, margin: "0 0 2px 0", color: colors.bright }}>{patient?.name || "Patient"}</p>
              <p style={{ fontSize: "10px", margin: 0, color: colors.dim }}>MRN: {patient?.mrn || "—"}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { label: "BP", value: vitals?.[0]?.systolicBP ? `${vitals[0].systolicBP}/${vitals[0].diastolicBP}` : "—" },
              { label: "HR", value: vitals?.[0]?.heartRate || "—" },
              { label: "RR", value: vitals?.[0]?.respiratoryRate || "—" },
              { label: "TEMP", value: vitals?.[0]?.temperature || "—" },
              { label: "SPO₂", value: vitals?.[0]?.spo2 || "—" },
              { label: "PAIN", value: vitals?.[0]?.painScore || "—" },
            ].map((v, idx) => (
              <div key={idx} style={{ textAlign: "center", minWidth: "50px" }}>
                <p style={{ fontSize: "9px", color: colors.dim, margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  {v.label}
                </p>
                <p style={{ fontSize: "10px", fontWeight: 600, margin: 0, color: colors.text }}>—</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Section Tabs */}
        <div style={{ display: "flex", gap: "8px", borderTop: `1px solid ${colors.border}`, paddingTop: "8px" }}>
          {[
            { icon: "S", label: "Subjective", subtext: "HPI · ROS · Vitals", color: colors.teal },
            { icon: "O", label: "Objective", subtext: "Exam · Labs · Imaging", color: colors.dim },
            { icon: "A", label: "Assessment", subtext: "Diagnosis · DDx", color: colors.dim },
            { icon: "P", label: "Plan", subtext: "Orders · Medications", color: colors.dim },
          ].map((tab, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: idx === 0 ? "rgba(0,212,188,0.15)" : "transparent",
                border: idx === 0 ? `1px solid ${colors.teal}` : "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: idx === 0 ? colors.teal : colors.edge,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: idx === 0 ? colors.navy : colors.text,
                  fontWeight: 600,
                  fontSize: "12px",
                }}
              >
                {tab.icon}
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, margin: "0 0 1px 0", color: colors.text }}>
                  {tab.label}
                </p>
                <p style={{ fontSize: "9px", margin: 0, color: colors.dim }}>
                  {tab.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Strip */}
      {patient && encounter && (
        <div
          style={{
            background: colors.slate,
            borderBottom: `1px solid ${colors.border}`,
            borderTop: "3px solid",
            borderImage: "linear-gradient(90deg, #00d4bc, #9b6dff, #f5a623) 1",
            padding: "12px 16px",
            display: "flex",
            gap: "16px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Avatar & Name */}
          <div style={{ display: "flex", gap: "10px", minWidth: "200px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: colors.edge, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "16px", flexShrink: 0 }}>
              {patient?.name?.charAt(0) || "P"}
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, margin: "0 0 2px 0", color: colors.bright }}>
                {patient?.name} — from Base44 Patient entity
              </p>
              <p style={{ fontSize: "10px", margin: 0, color: colors.dim }}>
                MRN: {patient?.mrn || "—"} | Age: {patient?.age || "—"} | DOB: {patient?.dob || "—"}
              </p>
            </div>
          </div>

          {/* Vital Pills */}
          {vitals?.[0] && (
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { label: "SYSTOLIC", value: vitals[0].systolicBP || "—" },
                { label: "DIASTOLIC", value: vitals[0].diastolicBP || "—" },
                { label: "HEART", value: vitals[0].heartRate || "—" },
                { label: "RESP", value: vitals[0].respiratoryRate || "—" },
                { label: "TEMPERATURE", value: vitals[0].temperature || "—" },
                { label: "SPO₂", value: vitals[0].spo2 || "—" },
              ].map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    background: colors.edge,
                    border: `1px solid ${colors.border}`,
                    padding: "6px 10px",
                    borderRadius: "6px",
                    textAlign: "center",
                    minWidth: "70px",
                  }}
                >
                  <p style={{ fontSize: "8px", margin: "0 0 2px 0", color: colors.dim, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    {v.label}
                  </p>
                  <p style={{ fontSize: "10px", fontWeight: 600, margin: 0, color: colors.text }}>
                    {v.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Right: Allergies & Status */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {patient?.allergies?.length > 0 ? (
              <span style={{ background: colors.red, color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 600 }}>
                {patient.allergies[0]}
              </span>
            ) : (
              <span style={{ color: colors.dim, fontSize: "10px" }}>No Allergies</span>
            )}
            <span style={{ color: colors.dim, fontSize: "10px" }}>Arrived: —</span>
            <span
              style={{
                background: encounter?.encounterStatus === "active" ? "rgba(0,212,188,0.2)" : colors.edge,
                color: colors.text,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "9px",
                fontWeight: 600,
              }}
            >
              {encounter?.encounterStatus?.toUpperCase() || "—"}
            </span>
          </div>
        </div>
      )}

      {/* Encounter Info Bar */}
      <div style={{ background: colors.slate, borderBottom: `1px solid ${colors.border}`, padding: "11px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "11px" }}>
        {[
          { icon: "⏱️", label: "LENGTH OF STAY", value: "Active encounter" },
          { icon: "🔢", label: "TRIAGE / ESI", value: "Not assigned" },
          { icon: "👨‍⚕️", label: "ATTENDING", value: "No resident" },
          { icon: "🚪", label: "STATUS", value: "No disposition yet" },
        ].map((item, idx) => (
          <div key={idx} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "16px", minWidth: "20px" }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: "9px", color: colors.dim, margin: "0 0 3px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                {item.label}
              </p>
              <p style={{ fontSize: "11px", color: colors.text, margin: 0, fontWeight: 500 }}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "11px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "290px 1fr 272px", gap: "11px", flex: 1, overflow: "hidden" }}>


          {/* Left: Vitals + Diagnoses */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", overflow: "auto" }}>
            {/* Vitals Panel */}
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.teal}`, borderRadius: "8px", padding: "10px", overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 600, margin: 0, display: "flex", gap: "4px" }}>📊 VITAL SIGNS</h3>
                <span style={{ color: colors.dim, fontSize: "9px" }}>Trends 0 readings</span>
              </div>
              {vitals?.[0] ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { icon: "💓", label: "Systolic BP", value: vitals[0].systolicBP, unit: "mmHg" },
                    { icon: "💓", label: "Diastolic BP", value: vitals[0].diastolicBP, unit: "mmHg" },
                    { icon: "🫀", label: "Heart Rate", value: vitals[0].heartRate, unit: "bpm" },
                    { icon: "🫁", label: "Resp Rate", value: vitals[0].respiratoryRate, unit: "/min" },
                    { icon: "🌡️", label: "Temperature", value: vitals[0].temperature, unit: "°F" },
                    { icon: "💨", label: "SpO₂", value: vitals[0].spo2, unit: "%" },
                    { icon: "😣", label: "Pain Score", value: vitals[0].painScore, unit: "/10" },
                    { icon: "🧠", label: "GCS", value: vitals[0].gcs, unit: "/15" },
                  ].map((v, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", minWidth: "14px" }}>{v.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: colors.dim, fontSize: "10px", margin: 0 }}>{v.label}</p>
                        <p style={{ color: colors.text, fontSize: "12px", fontWeight: 600, margin: 0 }}>
                          {v.value || "Awaiting data"} {v.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: colors.dim, fontSize: "10px", margin: 0, fontStyle: "italic" }}>No vitals recorded — pull from Objective page</p>
              )}
            </div>

            {/* Diagnoses Panel */}
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.rose}`, borderRadius: "8px", padding: "10px", overflow: "auto", flex: 1, minHeight: 0 }}>
              <h3 style={{ fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>🧠 DIAGNOSES</h3>
              <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: `1px solid ${colors.border}` }}>
                <p style={{ color: colors.amber, fontSize: "10px", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase" }}>INITIAL IMPRESSION</p>
                {assessment?.initialDiagnosis ? (
                  <>
                    <p style={{ color: colors.text, fontSize: "11px", margin: "0 0 4px 0", fontWeight: 500 }}>{assessment.initialDiagnosis}</p>
                    {assessment.initialIcd10 && <p style={{ color: colors.dim, fontSize: "9px", margin: 0, fontFamily: "JetBrains Mono" }}>{assessment.initialIcd10}</p>}
                  </>
                ) : (
                  <p style={{ color: colors.dim, fontSize: "10px", margin: 0, fontStyle: "italic" }}>Assessment page not yet completed</p>
                )}
              </div>
              <div>
                <p style={{ color: colors.green, fontSize: "10px", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase" }}>FINAL DIAGNOSIS</p>
                {dischargeSummary?.finalDiagnosis ? (
                  <>
                    <p style={{ color: colors.text, fontSize: "11px", margin: "0 0 4px 0", fontWeight: 500 }}>{dischargeSummary.finalDiagnosis}</p>
                    {dischargeSummary.finalIcd10 && <p style={{ color: colors.dim, fontSize: "9px", margin: 0, fontFamily: "JetBrains Mono" }}>{dischargeSummary.finalIcd10}</p>}
                  </>
                ) : (
                  <p style={{ color: colors.dim, fontSize: "10px", margin: 0, fontStyle: "italic" }}>⏳ Pending</p>
                )}
              </div>
            </div>
          </div>

          {/* Center: Clinical Summary + Abnormal Findings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", overflow: "auto" }}>
            {/* Clinical Summary */}
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.teal}`, borderRadius: "8px", padding: "10px", overflow: "auto", flex: 1, minHeight: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 600, margin: 0, display: "flex", gap: "4px" }}>📋 CLINICAL SUMMARY</h3>
                <button onClick={generateAIClinicalSummary} disabled={generatingAISummary} style={{ background: generatingAISummary ? "rgba(155,109,255,0.1)" : "rgba(155,109,255,0.2)", border: `1px solid ${colors.purple}`, color: colors.purple, padding: "4px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 600, cursor: generatingAISummary ? "not-allowed" : "pointer", opacity: generatingAISummary ? 0.6 : 1 }}>
                  {generatingAISummary ? "⏳ Generating..." : "⚡ AI Refresh"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "10px" }}>
                <div>
                  <p style={{ color: colors.dim, fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>☐ CHIEF COMPLAINT</p>
                  <p style={{ color: colors.text, margin: 0, minHeight: "16px" }}>{clinicalSummary?.chief_complaint || currentNote?.chief_complaint || "Not documented"}</p>
                </div>
                <div>
                  <p style={{ color: colors.dim, fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>☐ BRIEF HPI</p>
                  <p style={{ color: colors.text, margin: 0, minHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{clinicalSummary?.hpi || currentNote?.history_of_present_illness || "Not documented"}</p>
                </div>
                <div>
                  <p style={{ color: colors.dim, fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>🔑 KEY FINDINGS</p>
                  <p style={{ color: colors.text, margin: 0, minHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{clinicalSummary?.key_findings || "Click AI Refresh to analyze"}</p>
                </div>
                <div>
                  <p style={{ color: colors.dim, fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>🔬 WORKUP SUMMARY</p>
                  <p style={{ color: colors.text, margin: 0, minHeight: "16px" }}>{clinicalSummary?.workup_summary || (currentNote?.lab_findings?.length > 0 || currentNote?.imaging_findings?.length > 0 ? `${currentNote?.lab_findings?.length || 0} labs, ${currentNote?.imaging_findings?.length || 0} imaging` : "No workup documented")}</p>
                </div>
                <div>
                  <p style={{ color: colors.dim, fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>📈 CLINICAL COURSE</p>
                  <p style={{ color: colors.text, margin: 0, minHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{clinicalSummary?.clinical_course || currentNote?.plan || "Not documented"}</p>
                </div>
                <div>
                  <p style={{ color: colors.dim, fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>🔴 CURRENT STATUS</p>
                  <p style={{ color: colors.text, margin: 0, minHeight: "16px" }}>{currentNote?.status?.toUpperCase() || "Draft"}</p>
                </div>
              </div>
            </div>

            {/* Abnormal Findings */}
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.red}`, borderRadius: "8px", padding: "10px", overflow: "auto", flex: 1, minHeight: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 600, margin: 0, display: "flex", gap: "4px" }}>⚠️ ABNORMAL FINDINGS</h3>
                <button style={{ background: "rgba(155,109,255,0.2)", border: `1px solid ${colors.purple}`, color: colors.purple, padding: "4px 6px", borderRadius: "4px", fontSize: "8px", fontWeight: 600, cursor: "pointer" }}>
                  🔄 Refresh
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "30px 10px", textAlign: "center" }}>
                <p style={{ fontSize: "30px" }}>✓</p>
                <p style={{ color: colors.dim, fontSize: "10px", margin: 0 }}>No significant abnormal findings detected — or awaiting data from other pages</p>
              </div>
            </div>
          </div>

          {/* Right: Medications + Labs + Imaging */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", overflow: "auto", paddingRight: "4px" }}>
            {/* Medications */}
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.rose}`, borderRadius: "8px", padding: "10px", minHeight: "120px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>💊 MEDICATIONS GIVEN</h3>
              {medications?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px" }}>
                  {medications.slice(0, 3).map((med, idx) => (
                    <div key={idx} style={{ background: med.isControlled ? "rgba(245,166,35,0.1)" : "transparent", padding: "6px", borderRadius: "4px", borderLeft: med.isControlled ? `2px solid ${colors.amber}` : "none" }}>
                      <p style={{ color: colors.text, margin: "0 0 2px 0", fontWeight: 500 }}>
                        {med.drugName} {med.isControlled && <span style={{ color: colors.amber, marginLeft: "4px" }}>⚠</span>}
                      </p>
                      <p style={{ color: colors.dim, margin: "0 0 1px 0" }}>{med.dose} {med.route}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: colors.dim, fontSize: "10px", margin: 0, fontStyle: "italic" }}>No medications administered yet</p>
              )}
            </div>

            {/* Labs */}
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.purple}`, borderRadius: "8px", padding: "10px", minHeight: "120px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>🔬 LABS ORDERED</h3>
              {labs?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px" }}>
                  {labs.slice(0, 3).map((lab, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                        <p style={{ color: colors.text, margin: 0, fontWeight: 500 }}>{lab.panelName}</p>
                        <span style={{ background: lab.resultStatus === "critical" ? colors.red : colors.dim, color: lab.resultStatus === "critical" ? "#fff" : colors.text, padding: "2px 6px", borderRadius: "3px", fontSize: "8px", fontWeight: 600 }}>
                          {lab.resultStatus?.toUpperCase()}
                        </span>
                      </div>
                      {lab.criticalFlag && <p style={{ color: colors.red, fontSize: "9px", margin: 0 }}>🚨 Critical</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: colors.dim, fontSize: "10px", margin: 0, fontStyle: "italic" }}>No lab orders yet</p>
              )}
            </div>

            {/* Imaging */}
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.red}`, borderRadius: "8px", padding: "10px", minHeight: "120px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>🫀 IMAGING ORDERED</h3>
              {imaging?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px" }}>
                  {imaging.slice(0, 3).map((img, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                        <p style={{ color: colors.text, margin: 0, fontWeight: 500 }}>{img.studyName}</p>
                        <span style={{ background: img.readStatus === "critical" ? colors.red : colors.dim, color: img.readStatus === "critical" ? "#fff" : colors.text, padding: "2px 6px", borderRadius: "3px", fontSize: "8px", fontWeight: 600 }}>
                          {img.readStatus?.toUpperCase()}
                        </span>
                      </div>
                      {img.impression && <p style={{ color: colors.dim, fontSize: "9px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.impression}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: colors.dim, fontSize: "10px", margin: 0, fontStyle: "italic" }}>No imaging ordered yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}