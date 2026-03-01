import React, { useState } from "react";
import { BookOpen, Plus, Library, Sparkles } from "lucide-react";
import EducationMaterialGenerator from "../components/education/EducationMaterialGenerator";
import EducationLibrary from "../components/education/EducationLibrary";
import EducationMaterialViewer from "../components/education/EducationMaterialViewer";

const TABS = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "library", label: "Library", icon: Library },
];

export default function PatientEducation() {
  const [activeTab, setActiveTab] = useState("generate");
  const [lastGenerated, setLastGenerated] = useState(null);

  const handleGenerated = (material) => {
    setLastGenerated(material);
    setActiveTab("library");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Patient Education</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>AI-generated materials in 5 languages — printable & shareable</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f1f5f9", padding: 4, borderRadius: 10, width: "fit-content" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 13,
                  background: active ? "white" : "transparent",
                  color: active ? "#3b82f6" : "#64748b",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s"
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 28 }}>
          {activeTab === "generate" && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginTop: 0, marginBottom: 4 }}>Generate New Material</h2>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Enter a diagnosis and optional treatment plan. The AI will create a full patient-friendly guide.</p>
              <EducationMaterialGenerator onGenerated={handleGenerated} />

              {lastGenerated && (
                <div style={{ marginTop: 32, borderTop: "1px solid #e2e8f0", paddingTop: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 0, marginBottom: 16 }}>✅ Last Generated</h3>
                  <EducationMaterialViewer material={lastGenerated} onUpdate={setLastGenerated} />
                </div>
              )}
            </div>
          )}

          {activeTab === "library" && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginTop: 0, marginBottom: 4 }}>Saved Materials</h2>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Browse, search, and reuse previously generated education materials.</p>
              <EducationLibrary onCreateNew={() => setActiveTab("generate")} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}