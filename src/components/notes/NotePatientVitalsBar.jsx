import React from "react";

const T = {
  panel: "#0b1d35",
  border: "#1e3a5f",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  green: "#2ecc71",
  amber: "#f5a623",
  red: "#ff5c6c",
};

function VitalChip({ label, value, unit, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 48 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || T.bright, fontFamily: "DM Sans, sans-serif", lineHeight: 1 }}>
        {value ?? "—"}
      </span>
      <span style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
    </div>
  );
}

function getVitalColor(id, value, vitals) {
  if (!value && value !== 0) return T.dim;
  const num = parseFloat(value);
  const ranges = {
    heart_rate: [60, 100],
    respiratory_rate: [12, 20],
    oxygen_saturation: [95, 100],
    temperature: [97, 99],
    pain: [0, 3],
  };
  const r = ranges[id];
  if (!r) return T.bright;
  if (num < r[0] || num > r[1]) {
    const delta = Math.max(r[0] - num, num - r[1]);
    return delta > (r[1] - r[0]) * 0.25 ? T.red : T.amber;
  }
  return T.green;
}

export default function NotePatientVitalsBar({ note }) {
  const v = note?.vital_signs || {};
  const bp = v.blood_pressure?.systolic && v.blood_pressure?.diastolic
    ? `${v.blood_pressure.systolic}/${v.blood_pressure.diastolic}`
    : null;
  const hr = v.heart_rate?.value;
  const rr = v.respiratory_rate?.value;
  const temp = v.temperature?.value;
  const spo2 = v.oxygen_saturation?.value;
  const dob = note?.date_of_birth ? note.date_of_birth.slice(0, 7) : null;

  const bpColor = (() => {
    const sys = v.blood_pressure?.systolic;
    if (!sys) return T.dim;
    if (sys >= 180 || sys < 90) return T.red;
    if (sys >= 140 || sys < 100) return T.amber;
    return T.bright;
  })();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: "8px 20px",
      background: T.panel,
      borderBottom: `1px solid ${T.border}`,
      minHeight: 52,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Rainbow top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, #ff5c6c 0%, #f5a623 25%, #2ecc71 50%, #00d4bc 75%, #9b6dff 100%)",
      }} />

      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginRight: 12,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          {note?.patient_name ? note.patient_name[0].toUpperCase() : "?"}
        </span>
      </div>

      {/* Patient info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 20, minWidth: 140 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.bright, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
          {note?.patient_name || "Unknown Patient"}
        </span>
        <span style={{ fontSize: 10, color: T.dim, whiteSpace: "nowrap" }}>
          MRN: {note?.patient_id ? `PT-${note.patient_id}` : "—"} · {note?.patient_age || "—"}y {note?.patient_gender || ""} {dob ? `· ${dob}-` : ""}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 32, background: T.border, marginRight: 20, flexShrink: 0 }} />

      {/* Vitals */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
        <VitalChip label="BP" value={bp} color={bpColor} />
        <VitalChip label="HR" value={hr} color={getVitalColor("heart_rate", hr)} />
        <VitalChip label="RR" value={rr} color={getVitalColor("respiratory_rate", rr)} />
        <VitalChip label="TEMP" value={temp ? `${temp}°` : null} color={getVitalColor("temperature", temp)} />
        <VitalChip label="SPO₂" value={spo2 ? `${spo2}%` : null} color={getVitalColor("oxygen_saturation", spo2)} />
        <VitalChip label="PAIN" value={null} color={T.dim} />
      </div>

      {/* Chief complaint */}
      {note?.chief_complaint && (
        <div style={{ fontSize: 11, color: T.dim, fontStyle: "italic", flexShrink: 0, maxWidth: 260, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
          <span style={{ color: T.teal, fontStyle: "normal", fontWeight: 600, marginRight: 4 }}>CC:</span>
          {note.chief_complaint}
        </div>
      )}
    </div>
  );
}