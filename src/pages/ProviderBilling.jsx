import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import EMCalculator from "@/components/procedures/EMCalculator";
import BillingModule from "@/components/billing/BillingModule";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0e2340", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
  green: "#2ecc71", purple: "#9b6dff", rose: "#f472b6", blue: "#3b9eff",
};

const glass = (extra = {}) => ({
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  background: "rgba(8,22,40,0.75)",
  border: "1px solid rgba(30,58,95,0.55)",
  borderRadius: 16,
  ...extra,
});

const deepGlass = (extra = {}) => ({
  backdropFilter: "blur(40px) saturate(220%)",
  WebkitBackdropFilter: "blur(40px) saturate(220%)",
  background: "rgba(5,15,30,0.88)",
  border: "1px solid rgba(26,53,85,0.7)",
  ...extra,
});

function PatientBillingContext({ patientData }) {
  return (
    <div style={{ ...glass(), padding: "14px 18px", marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.dim, textTransform: "uppercase", marginBottom: 5 }}>
            Patient Name
          </div>
          <div style={{ fontSize: 14, color: T.bright, fontWeight: 600 }}>
            {patientData?.patient_name || "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.dim, textTransform: "uppercase", marginBottom: 5 }}>
            Patient ID
          </div>
          <div style={{ fontSize: 14, color: T.bright, fontWeight: 600, fontFamily: "JetBrains Mono" }}>
            {patientData?.patient_id || "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.dim, textTransform: "uppercase", marginBottom: 5 }}>
            Age / DOB
          </div>
          <div style={{ fontSize: 14, color: T.bright, fontWeight: 600 }}>
            {patientData?.patient_age || "—"} {patientData?.date_of_birth && `(${patientData.date_of_birth})`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.dim, textTransform: "uppercase", marginBottom: 5 }}>
            Visit Date
          </div>
          <div style={{ fontSize: 14, color: T.bright, fontWeight: 600 }}>
            {patientData?.date_of_visit || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderBilling() {
  const [patientData, setPatientData] = useState({
    patient_name: "",
    patient_id: "",
    patient_age: "",
    date_of_birth: "",
    date_of_visit: new Date().toISOString().split("T")[0],
  });

  const handlePatientDataUpdate = (field, value) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ background: T.navy, minHeight: "100vh", fontFamily: "DM Sans,sans-serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Background effects */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-5%", width: "50%", height: "50%", background: "radial-gradient(circle,rgba(0,212,188,0.15) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "0", width: "40%", height: "40%", background: "radial-gradient(circle,rgba(0,212,188,0.08) 0%,transparent 70%)" }} />
      </div>

      {/* Header */}
      <div style={{ ...deepGlass({ borderRadius: 0 }), padding: "16px 24px", flexShrink: 0, zIndex: 10, position: "relative", borderBottom: "1px solid rgba(30,58,95,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...deepGlass({ borderRadius: 10 }), padding: "6px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, letterSpacing: 3 }}>NOTRYA</span>
            <span style={{ color: T.dim, fontFamily: "JetBrains Mono", fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.dim, letterSpacing: 2 }}>BILLING</span>
          </div>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,rgba(42,77,114,0.5),transparent)" }} />
          <h1 style={{ fontFamily: "Playfair Display", fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: -0.5, color: T.bright }}>
            Provider Billing
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 24px", position: "relative", zIndex: 1 }}>
        {/* Patient Context Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <h2 style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 18, color: T.bright, margin: 0 }}>
              Patient Information
            </h2>
          </div>
          <PatientBillingContext patientData={patientData} />
          <div style={{ ...glass(), padding: "14px 18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { key: "patient_name", label: "Patient Name", type: "text" },
                { key: "patient_id", label: "Patient ID / MRN", type: "text" },
                { key: "patient_age", label: "Age", type: "number" },
                { key: "date_of_birth", label: "DOB", type: "date" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: T.dim, marginBottom: 5, textTransform: "uppercase" }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={patientData[field.key]}
                    onChange={e => handlePatientDataUpdate(field.key, e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(14,37,68,0.8)",
                      border: "1px solid rgba(30,58,95,0.6)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: T.bright,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color .15s",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* E&M Calculator Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🧮</span>
            <h2 style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 18, color: T.bright, margin: 0 }}>
              E&M Code Calculator
            </h2>
          </div>
          <div style={{ ...glass(), padding: "16px 18px" }}>
            <EMCalculator />
          </div>
        </div>

        {/* Billing Module Section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>💳</span>
            <h2 style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 18, color: T.bright, margin: 0 }}>
              Invoice Management
            </h2>
          </div>
          <div style={{ ...glass(), padding: "16px 18px" }}>
            <BillingModule />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "8px", borderTop: "1px solid rgba(30,58,95,0.3)", position: "relative", zIndex: 2 }}>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.dim, letterSpacing: 2 }}>NOTRYA PROVIDER BILLING · E&M CODES · INVOICES</span>
      </div>
    </div>
  );
}