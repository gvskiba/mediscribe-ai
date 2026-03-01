import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, Pill, Beaker, Heart, RotateCw, Clock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import PatientStrip from "../components/dashboard/PatientStrip";
import QuickStats from "../components/dashboard/QuickStats";
import VitalsPanel from "../components/dashboard/VitalsPanel";
import DiagnosesPanel from "../components/dashboard/DiagnosesPanel";
import ClinicalSummaryPanel from "../components/dashboard/ClinicalSummaryPanel";
import AbnormalFindingsPanel from "../components/dashboard/AbnormalFindingsPanel";
import MedicationsPanel from "../components/dashboard/MedicationsPanel";
import LabsPanel from "../components/dashboard/LabsPanel";
import ImagingPanel from "../components/dashboard/ImagingPanel";

export default function PatientDashboard() {
  const [encounterId, setEncounterId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eid = params.get("encounterId");
    const pid = params.get("patientId");
    setEncounterId(eid);
    setPatientId(pid);
  }, []);

  // Data fetching
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

  const minutesSinceUpdate = lastUpdated ? differenceInMinutes(new Date(), lastUpdated) : null;

  return (
    <div style={{ background: "#050f1e", fontFamily: "DM Sans, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <div style={{ background: "#0b1d35", borderBottom: "1px solid #1e3a5f", padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", height: "58px", flexShrink: 0 }}>
        <div>
          <h1 style={{ color: "#e8f4ff", fontSize: "16px", fontWeight: 600, margin: 0 }}>Clinical Overview</h1>
          <p style={{ color: "#4a7299", fontSize: "11px", margin: "4px 0 0 0" }}>ClinAI / ER Note / Overview</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {lastUpdated && (
            <span style={{ color: "#4a7299", fontSize: "11px" }}>
              {minutesSinceUpdate === 0 ? "Just now" : `${minutesSinceUpdate}m ago`}
            </span>
          )}
          <button
            onClick={handleRefresh}
            style={{
              background: "#00d4bc",
              color: "#050f1e",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RotateCw size={12} /> Refresh
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#c8ddf0", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isAutoRefreshEnabled}
              onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Live
          </label>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", padding: "13px 16px", display: "flex", flexDirection: "column", gap: "11px" }}>
        {/* Patient Strip */}
        {patient && encounter && (
          <PatientStrip patient={patient} encounter={encounter} vitals={vitals[0]} />
        )}

        {/* Quick Stats */}
        {encounter && (
          <QuickStats encounter={encounter} vitals={vitals[0]} />
        )}

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "290px 1fr 272px", gap: "11px", flex: 1, overflow: "hidden" }}>
          {/* Left Column: Vitals + Diagnoses */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", overflow: "hidden" }}>
            <VitalsPanel vitals={vitals} />
            <DiagnosesPanel assessment={assessment} dischargeSummary={dischargeSummary} />
          </div>

          {/* Center Column: Clinical Summary + Abnormal Findings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", overflow: "hidden" }}>
            {encounter && <ClinicalSummaryPanel encounter={encounter} />}
            <AbnormalFindingsPanel vitals={vitals} labs={labs} imaging={imaging} />
          </div>

          {/* Right Column: Medications, Labs, Imaging (scrollable) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", overflow: "auto", paddingRight: "4px" }}>
            <MedicationsPanel medications={medications} />
            <LabsPanel labs={labs} />
            <ImagingPanel imaging={imaging} />
          </div>
        </div>
      </div>
    </div>
  );
}