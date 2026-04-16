import { useState } from "react";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36",
  txt: "#f2f7ff", txt2: "#b8d4f0", txt3: "#82aece", txt4: "#5a82a8",
  teal: "#00e5c0", coral: "#ff6b6b", gold: "#f5c842",
};

export default function ResultsViewer({
  patientName = "Patient",
  patientMrn = "",
  patientAge = "",
  patientSex = "",
  allergies = [],
  chiefComplaint = "",
  vitals = {},
}) {
  const [selectedResult, setSelectedResult] = useState(null);

  // Mock results data
  const results = [
    {
      id: 1,
      date: new Date().toISOString().split("T")[0],
      type: "Lab",
      name: "Complete Blood Count",
      status: "Pending",
      icon: "🧪",
    },
    {
      id: 2,
      date: new Date().toISOString().split("T")[0],
      type: "Imaging",
      name: "Chest X-Ray",
      status: "Completed",
      icon: "🖼️",
    },
    {
      id: 3,
      date: new Date().toISOString().split("T")[0],
      type: "Lab",
      name: "Comprehensive Metabolic Panel",
      status: "Pending",
      icon: "🧪",
    },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "20px", fontFamily: "'DM Sans', sans-serif", color: T.txt }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Results Viewer</h1>
          <p style={{ color: T.txt3, fontSize: 14 }}>
            {patientName} {patientMrn && `(${patientMrn})`}
          </p>
        </div>

        {/* Patient Summary Bar */}
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: "12px 16px",
            background: T.panel,
            border: `1px solid rgba(26, 53, 85, 0.4)`,
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 12,
            color: T.txt3,
          }}
        >
          {patientAge && <span>Age: {patientAge}</span>}
          {patientSex && <span>Sex: {patientSex}</span>}
          {chiefComplaint && <span>CC: {chiefComplaint}</span>}
          {allergies.length > 0 && <span style={{ color: T.coral }}>⚠ {allergies.length} allergy</span>}
        </div>

        {/* Results Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {results.map((result) => {
            const statusColor = result.status === "Completed" ? T.teal : T.gold;
            return (
              <div
                key={result.id}
                onClick={() => setSelectedResult(result.id)}
                style={{
                  background: T.card,
                  border: `1px solid rgba(26, 53, 85, 0.4)`,
                  borderRadius: 10,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderTop: `3px solid ${statusColor}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(26, 53, 85, 0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(26, 53, 85, 0.4)")}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{result.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.txt4, marginBottom: 4 }}>{result.type}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>{result.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: T.txt4 }}>{result.date}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: `${statusColor}15`,
                          color: statusColor,
                        }}
                      >
                        {result.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results Message */}
        {results.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: T.txt4 }}>
            <p>No results available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}