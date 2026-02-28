import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator, ChevronRight } from "lucide-react";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  amber: "#f5a623",
  green: "#2ecc71",
};

export default function QuickCalculatorsWidget() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const calcs = await base44.entities.CalculatorFavorite.list("-updated_date", 5);
        setFavorites(calcs || []);
      } catch (error) {
        console.error("Failed to load calculators:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Calculator className="w-4 h-4" style={{ color: T.amber }} />
          <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>
            Quick Calculators
          </div>
        </div>
        <p style={{ fontSize: "11px", color: T.dim, margin: 0 }}>Your favorite tools</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "12px 16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>Loading…</div>
        ) : favorites.length === 0 ? (
          <div style={{ padding: "12px 16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>
            No favorite calculators yet
          </div>
        ) : (
          favorites.map((calc, idx) => (
            <a
              key={calc.id}
              href={calc.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderBottom: idx < favorites.length - 1 ? `1px solid ${T.border}` : "none",
                cursor: "pointer",
                transition: "all 0.15s",
                textDecoration: "none",
                color: "inherit",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.edge; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div>
                <div style={{ fontSize: "12px", color: T.bright, fontWeight: 500 }}>
                  {calc.calculator_name}
                </div>
                {calc.category && (
                  <div style={{ fontSize: "10px", color: T.dim, marginTop: "2px" }}>
                    {calc.category}
                  </div>
                )}
              </div>
              <ChevronRight className="w-3 h-3" style={{ color: T.muted }} />
            </a>
          ))
        )}
      </div>

      <div style={{ padding: "8px 14px", borderTop: `1px solid ${T.border}`, background: T.edge }}>
        <a
          href="?page=Calculators"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "11px",
            color: T.teal,
            fontWeight: 600,
            textDecoration: "none",
            padding: "6px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.8; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
        >
          View All Calculators <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}