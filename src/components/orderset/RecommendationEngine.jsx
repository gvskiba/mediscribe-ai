import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Plus, X } from "lucide-react";

const G = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
  green: "#2ecc71", purple: "#9b6dff", blue: "#4a90d9", rose: "#f472b6",
};

// Clinical decision rules for recommendations based on diagnosis + vitals
const RECOMMENDATION_RULES = [
  {
    id: "dvt_prophylaxis",
    title: "DVT Prophylaxis",
    trigger: (patient) => patient?.mobility === "bedbound" || patient?.los_days >= 3,
    orders: [
      { cat: "meds", name: "Enoxaparin 40mg SQ", detail: "Once daily for VTE prophylaxis", priority: "routine", guideline: "ACCP Guidelines" },
      { cat: "nursing", name: "SCDs / Compression", detail: "Sequential compression devices if appropriate", priority: "routine", guideline: "ACCP" },
    ],
    reason: "Patient is bedbound or prolonged admission — DVT prophylaxis indicated",
  },
  {
    id: "stress_ulcer_prophylaxis",
    trigger: (patient) => patient?.icu_status === true || patient?.mechanical_ventilation === true,
    orders: [
      { cat: "meds", name: "Famotidine 20mg IV", detail: "Twice daily for GI prophylaxis", priority: "routine", guideline: "ACG/ASGE" },
    ],
    reason: "ICU patient or on mechanical ventilation — stress ulcer prophylaxis recommended",
  },
  {
    id: "hypoglycemia_protocol",
    trigger: (patient) => patient?.diagnosis?.toLowerCase().includes("diabetes") && patient?.glucose_level > 250,
    orders: [
      { cat: "meds", name: "Insulin Infusion", detail: "Titrate to 180–220 mg/dL per protocol", priority: "routine", guideline: "ADA Guidelines" },
      { cat: "labs", name: "POC Glucose Checks", detail: "Every 1 hour initially, then per protocol", priority: "routine", guideline: "ADA" },
    ],
    reason: "Diabetes with elevated glucose — insulin management indicated",
  },
  {
    id: "sepsis_workup",
    trigger: (patient) => patient?.temp_f > 101 || (patient?.wbc > 15 && patient?.suspected_infection),
    orders: [
      { cat: "labs", name: "Blood Cultures x2", detail: "Before antibiotics", priority: "stat", guideline: "Surviving Sepsis" },
      { cat: "labs", name: "Lactate Level", detail: "Assess tissue perfusion", priority: "stat", guideline: "Surviving Sepsis" },
      { cat: "vitals", name: "Continuous Monitoring", detail: "HR, BP, O2, respiratory rate q15min", priority: "stat", guideline: "Surviving Sepsis" },
    ],
    reason: "Fever + elevated WBC — sepsis workup indicated",
  },
  {
    id: "heparin_monitoring",
    trigger: (patient) => patient?.on_heparin === true,
    orders: [
      { cat: "labs", name: "aPTT", detail: "Check at 6 hours, then per protocol (target 60–80)", priority: "routine", guideline: "ACCP" },
      { cat: "nursing", name: "Heparin Flow Sheet", detail: "Document PTT, dose, reason for any changes", priority: "routine", guideline: "Institutional" },
    ],
    reason: "Patient on heparin — anti-coagulation monitoring required",
  },
];

export default function RecommendationEngine({ 
  patientData = {}, 
  existingOrderNames = [], 
  onAddRecommendations = () => {} 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState(new Set());

  // Evaluate which recommendations apply
  useEffect(() => {
    const applicable = RECOMMENDATION_RULES.filter(rule => rule.trigger(patientData))
      .filter(rule => !existingOrderNames.some(name => 
        rule.orders.some(o => o.name.toLowerCase().includes(name.toLowerCase()))
      ));
    
    setRecommendations(applicable);
  }, [patientData, existingOrderNames]);

  function handleToggleRecommendation(recId) {
    setSelectedRecommendations(prev => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId);
      else next.add(recId);
      return next;
    });
  }

  function handleAddSelected() {
    const ordersToAdd = [];
    for (const recId of selectedRecommendations) {
      const rec = recommendations.find(r => r.id === recId);
      if (rec) {
        ordersToAdd.push(...rec.orders);
      }
    }
    onAddRecommendations(ordersToAdd);
    setSelectedRecommendations(new Set());
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(155,109,255,.08), rgba(74,144,217,.08))`,
      border: `1px solid rgba(155,109,255,.25)`,
      borderRadius: 10,
      padding: 14,
      marginBottom: 14,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ color: G.purple, fontSize: 18, flexShrink: 0 }}>✨</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: G.bright, marginBottom: 3 }}>
            Clinical Recommendations
          </div>
          <div style={{ fontSize: 11.5, color: G.dim }}>
            Based on patient diagnosis & vitals, {recommendations.length} evidence-based order{recommendations.length !== 1 ? "s" : ""} suggested
          </div>
        </div>
      </div>

      {/* Recommendation cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recommendations.map(rec => (
          <div
            key={rec.id}
            style={{
              background: selectedRecommendations.has(rec.id) 
                ? "rgba(155,109,255,.15)" 
                : "rgba(22,45,79,.5)",
              border: `1px solid ${selectedRecommendations.has(rec.id) 
                ? "rgba(155,109,255,.4)" 
                : "rgba(30,58,95,.4)"}`,
              borderRadius: 8,
              padding: "10px 12px",
              cursor: "pointer",
              transition: "all .15s",
            }}
            onClick={() => handleToggleRecommendation(rec.id)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: `2px solid ${selectedRecommendations.has(rec.id) ? G.purple : G.border}`,
                background: selectedRecommendations.has(rec.id) ? `rgba(155,109,255,.2)` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}>
                {selectedRecommendations.has(rec.id) && (
                  <div style={{ color: G.purple, fontSize: 12, fontWeight: 700 }}>✓</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: G.bright }}>
                    {rec.title}
                  </span>
                  <span style={{ fontSize: 9, color: G.muted, background: "rgba(74,144,217,.15)", border: `1px solid rgba(74,144,217,.25)`, borderRadius: 4, padding: "1px 6px" }}>
                    {rec.orders.length} orders
                  </span>
                </div>
                <div style={{ fontSize: 11, color: G.dim, lineHeight: 1.4 }}>
                  {rec.reason}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(expandedId === rec.id ? null : rec.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: G.dim,
                  cursor: "pointer",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {expandedId === rec.id ? "▼" : "▶"}
              </button>
            </div>

            {expandedId === rec.id && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid rgba(30,58,95,.4)` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {rec.orders.map((order, idx) => (
                    <div key={idx} style={{ 
                      fontSize: 11,
                      background: "rgba(11,29,53,.5)",
                      border: `1px solid rgba(30,58,95,.3)`,
                      borderRadius: 6,
                      padding: "8px 10px",
                    }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, color: G.teal }}>{order.name}</span>
                        <span style={{
                          fontSize: 9,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: order.priority === "stat" ? "rgba(255,92,108,.15)" : "rgba(0,212,188,.15)",
                          color: order.priority === "stat" ? G.red : G.teal,
                          fontWeight: 700,
                        }}>
                          {order.priority.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: G.dim, marginBottom: 2 }}>{order.detail}</div>
                      <div style={{ fontSize: 10, color: G.muted, fontStyle: "italic" }}>
                        📖 {order.guideline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedRecommendations.size > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(30,58,95,.4)` }}>
          <button
            onClick={handleAddSelected}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: `linear-gradient(135deg, ${G.purple}, #7c5cd6)`,
              border: "none",
              borderRadius: 7,
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Plus size={14} /> Add {selectedRecommendations.size} Order{selectedRecommendations.size !== 1 ? "s" : ""}
          </button>
          <button
            onClick={() => setSelectedRecommendations(new Set())}
            style={{
              padding: "8px 12px",
              background: "transparent",
              border: `1px solid ${G.border}`,
              borderRadius: 7,
              color: G.dim,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}