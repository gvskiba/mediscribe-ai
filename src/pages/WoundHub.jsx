import { useState } from "react";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bhi: "#2a4f7a",
  blue: "#3b9eff", teal: "#00e5c0", gold: "#f5c842",
  coral: "#ff6b6b", orange: "#ff9f43", purple: "#9b6dff",
  txt: "#ffffff", txt2: "#d0e8ff", txt3: "#a8c8e8", txt4: "#7aa0c0",
};

const WOUND_TYPES = [
  { id: "acute", label: "Acute Wounds", icon: "🩹", color: T.blue },
  { id: "chronic", label: "Chronic Wounds", icon: "🩼", color: T.orange },
  { id: "surgical", label: "Surgical Wounds", icon: "✂️", color: T.purple },
  { id: "burns", label: "Burns", icon: "🔥", color: T.coral },
];

const ASSESSMENT_ITEMS = [
  { label: "Size & Depth", desc: "Measure length × width × depth (cm)" },
  { label: "Wound Bed", desc: "Red/pink (healthy), yellow (slough), black (necrotic)" },
  { label: "Exudate", desc: "Amount: none, minimal, moderate, heavy" },
  { label: "Edges", desc: "Attached, rolled, undermined" },
  { label: "Odor", desc: "None, mild, moderate, offensive" },
  { label: "Pain", desc: "Rate 0–10; assess before/after dressing change" },
];

const DRESSING_TYPES = [
  { name: "Gauze", uses: "Minor abrasions, simple wounds", notes: "Daily changes" },
  { name: "Foam", uses: "Moderate exudate, pressure ulcers", notes: "3–7 day change" },
  { name: "Alginate", uses: "Heavy exudate, bleeding wounds", notes: "Hemostatic" },
  { name: "Hydrogel", uses: "Dry, necrotic wounds", notes: "Moist environment" },
  { name: "Collagen", uses: "Chronic wounds, DFU", notes: "Enzymatic debridement" },
  { name: "Silicone", uses: "Fragile skin, frequent changes", notes: "Non-adherent" },
];

export default function WoundHub() {
  const [activeTab, setActiveTab] = useState("assessment");
  const [selectedType, setSelectedType] = useState("acute");

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "24px", color: T.txt, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        h1 { font-family: 'Playfair Display', serif; font-size: 32px; margin-bottom: 8px; }
        .subtitle { font-size: 13px; color: ${T.txt3}; margin-bottom: 24px; }
        .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .tab-btn {
          padding: 9px 16px; border-radius: 8px; border: 1px solid ${T.bd};
          background: ${T.up}; color: ${T.txt3}; cursor: pointer; font-size: 12px; font-weight: 600;
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .tab-btn:hover { border-color: ${T.bhi}; color: ${T.txt2}; }
        .tab-btn.active { background: rgba(59,158,255,.1); border-color: rgba(59,158,255,.3); color: ${T.blue}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
        .card {
          background: ${T.panel}; border: 1px solid ${T.bd}; border-radius: 12px; padding: 16px;
          transition: border-color 0.2s; cursor: pointer;
        }
        .card:hover { border-color: ${T.bhi}; }
        .card-icon { font-size: 24px; margin-bottom: 8px; }
        .card-title { font-size: 14px; font-weight: 600; color: ${T.txt}; margin-bottom: 4px; }
        .card-sub { font-size: 11px; color: ${T.txt4}; }
        .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .table th { background: ${T.up}; padding: 8px; text-align: left; font-size: 11px; color: ${T.txt3}; text-transform: uppercase; border: 1px solid ${T.bd}; }
        .table td { padding: 10px 8px; border: 1px solid ${T.bd}; font-size: 12px; color: ${T.txt2}; }
        .table tr:hover td { background: ${T.up}; }
        .badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 600; margin-top: 6px; }
        .section { background: ${T.panel}; border: 1px solid ${T.bd}; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
        .section-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: ${T.txt}; }
        .row { display: flex; gap: 3px; margin-bottom: 10px; align-items: flex-start; }
        .bullet { color: ${T.teal}; font-size: 8px; margin-top: 3px; flex-shrink: 0; }
      `}</style>

      <h1>🩹 Wound Hub</h1>
      <p className="subtitle">Wound assessment, management, and dressing selection</p>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: "assessment", label: "Assessment" },
          { id: "dressings", label: "Dressings" },
          { id: "types", label: "Wound Types" },
        ].map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Assessment Tab */}
      {activeTab === "assessment" && (
        <div className="section">
          <div className="section-title">Wound Assessment Framework</div>
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {ASSESSMENT_ITEMS.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: T.teal }}>{item.label}</td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: 12, background: T.up, borderRadius: 8, fontSize: 12, color: T.txt3 }}>
            💡 Document findings systematically. Use photography for objective comparison over time.
          </div>
        </div>
      )}

      {/* Dressings Tab */}
      {activeTab === "dressings" && (
        <div className="section">
          <div className="section-title">Wound Dressing Types</div>
          <table className="table">
            <thead>
              <tr>
                <th>Dressing</th>
                <th>Best Uses</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {DRESSING_TYPES.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: T.blue }}>{d.name}</td>
                  <td>{d.uses}</td>
                  <td style={{ fontSize: 11, color: T.txt4 }}>{d.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Wound Types Tab */}
      {activeTab === "types" && (
        <div>
          <div className="grid">
            {WOUND_TYPES.map(wt => (
              <div
                key={wt.id}
                className="card"
                onClick={() => setSelectedType(wt.id)}
                style={{ borderColor: wt.color, background: selectedType === wt.id ? `${wt.color}15` : T.panel }}
              >
                <div className="card-icon">{wt.icon}</div>
                <div className="card-title" style={{ color: wt.color }}>{wt.label}</div>
              </div>
            ))}
          </div>

          {/* Type Details */}
          {selectedType === "acute" && (
            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-title">Acute Wounds</div>
              <div className="row"><div className="bullet">▸</div><div>Healing follows normal stages: hemostasis → inflammation → proliferation → remodeling</div></div>
              <div className="row"><div className="bullet">▸</div><div>Primary closure preferred when possible</div></div>
              <div className="row"><div className="bullet">▸</div><div>Monitor for signs of infection</div></div>
            </div>
          )}

          {selectedType === "chronic" && (
            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-title">Chronic Wounds</div>
              <div className="row"><div className="bullet">▸</div><div>Pressure ulcers, diabetic foot ulcers, venous leg ulcers</div></div>
              <div className="row"><div className="bullet">▸</div><div>Assess underlying etiology (pressure, arterial, venous, neuropathic)</div></div>
              <div className="row"><div className="bullet">▸</div><div>Offload pressure; optimize perfusion and glucose control</div></div>
            </div>
          )}

          {selectedType === "surgical" && (
            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-title">Surgical Wounds</div>
              <div className="row"><div className="bullet">▸</div><div>Clean and closed (Class I) vs. contaminated/dirty</div></div>
              <div className="row"><div className="bullet">▸</div><div>Keep dressing dry; change per protocol</div></div>
              <div className="row"><div className="bullet">▸</div><div>Remove sutures/staples per timeline (typically 7–14 days)</div></div>
            </div>
          )}

          {selectedType === "burns" && (
            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-title">Burn Wounds</div>
              <div className="row"><div className="bullet">▸</div><div>Classify by depth: 1° (superficial), 2° (partial), 3° (full), 4° (subdermal)</div></div>
              <div className="row"><div className="bullet">▸</div><div>Fluid resuscitation critical in first 24–48 hours</div></div>
              <div className="row"><div className="bullet">▸</div><div>Silvadene or other antimicrobial topical agents</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}