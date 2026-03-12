import React from "react";
import { Sparkles, CheckCircle2, Plus } from "lucide-react";
import { G, CAT_CFG, PRI_CFG } from "./orderSetData";

export default function SmartSuggestionsPanel({ suggestions, onAddSuggestion, onDismiss }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(155,109,255,.08), rgba(74,144,217,.06))`,
      border: `1px solid rgba(155,109,255,.3)`,
      borderRadius: 10,
      padding: 14,
      marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}>
        <Sparkles size={16} color="#9b6dff" />
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: G.bright,
        }}>
          Smart Suggestions
        </span>
        <span style={{
          fontSize: 11,
          color: G.dim,
        }}>
          ({suggestions.length})
        </span>
      </div>

      {/* Suggestion Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {suggestions.map((sug, idx) => {
          const catConfig = CAT_CFG[sug.cat] || {};
          const priConfig = PRI_CFG[sug.priority] || {};

          return (
            <div
              key={sug.id}
              style={{
                background: "rgba(255,255,255,.03)",
                border: `1px solid ${G.border}`,
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 13 }}>{catConfig.icon}</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: G.bright,
                    }}>
                      {sug.name}
                    </span>
                    {sug.required && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 20,
                        background: "rgba(255,92,108,.15)",
                        border: "1px solid rgba(255,92,108,.4)",
                        color: G.red,
                      }}>
                        REQUIRED
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: 11,
                    color: G.text,
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}>
                    {sug.detail}
                  </div>

                  <div style={{
                    fontSize: 10,
                    color: G.dim,
                    fontStyle: "italic",
                  }}>
                    💡 {sug.reason}
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                  }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 20,
                      color: priConfig.color,
                      background: priConfig.bg,
                      border: `1px solid ${priConfig.color}44`,
                    }}>
                      {sug.priority?.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: 9,
                      color: G.muted,
                    }}>
                      {catConfig.label}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button
                    onClick={() => onAddSuggestion(sug)}
                    style={{
                      padding: "6px 10px",
                      background: "rgba(155,109,255,.15)",
                      border: `1px solid rgba(155,109,255,.4)`,
                      borderRadius: 6,
                      color: "#9b6dff",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(155,109,255,.25)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(155,109,255,.15)"}
                  >
                    <Plus size={12} />
                    Add
                  </button>

                  {!sug.required && (
                    <button
                      onClick={() => onDismiss(sug.id)}
                      style={{
                        padding: "4px 8px",
                        background: "transparent",
                        border: `1px solid ${G.border}`,
                        borderRadius: 6,
                        color: G.muted,
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,.03)";
                        e.currentTarget.style.color = G.text;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = G.muted;
                      }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}