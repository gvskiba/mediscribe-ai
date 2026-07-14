// QuickNoteMustNotMiss.jsx
// Pinned clinical danger banner for active chief complaint
// Named export: MustNotMissBanner
// No AI calls. No base44 imports. Display only.
// v14.0 — CC-Driven QuickNote

import { useState, useEffect } from "react";

export function MustNotMissBanner({ profile, dispResult, onDismiss, dismissed }) {

  // ── Guard: render nothing for null, general, or dismissed ─────────────────
  if (!profile || profile.id === "general" || dismissed) return null;
  if (!profile.must_not_miss || profile.must_not_miss.length === 0) return null;

  return <BannerInner profile={profile} dispResult={dispResult} onDismiss={onDismiss} />;
}

// ── Inner component owns the addressed-set state ───────────────────────────
function BannerInner({ profile, dispResult, onDismiss }) {
  const [addressed, setAddressed] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);

  // Reset addressed set whenever the CC profile changes
  useEffect(() => {
    setAddressed(new Set());
    setCollapsed(false);
  }, [profile.id]);

  const total     = profile.must_not_miss.length;
  const doneCount = addressed.size;
  const allDone   = doneCount === total;

  const toggleDx = (dx) => {
    setAddressed((prev) => {
      const next = new Set(prev);
      if (next.has(dx)) next.delete(dx);
      else next.add(dx);
      return next;
    });
  };

  // After disposition is confirmed, auto-mark tone as resolved
  const isResolved = allDone || (dispResult && dispResult.disposition);

  // ── Colors ─────────────────────────────────────────────────────────────────
  const accentColor  = isResolved ? "#3dffa0" : profile.color || "#ff6b6b";
  const bgColor      = isResolved
    ? "rgba(61,255,160,.07)"
    : "rgba(255,107,107,.07)";
  const borderColor  = isResolved
    ? "rgba(61,255,160,.4)"
    : "rgba(255,107,107,.4)";
  const borderLeft   = isResolved
    ? "3px solid rgba(61,255,160,.7)"
    : "3px solid rgba(255,107,107,.7)";

  return (
    <div
      style={{
        position:     "sticky",
        top:          0,
        zIndex:       100,
        marginBottom: 10,
        background:   bgColor,
        border:       `1px solid ${borderColor}`,
        borderLeft,
        borderRadius: 10,
        overflow:     "hidden",
        transition:   "all .25s",
      }}
      className="no-print"
    >
      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          padding:        "8px 14px",
          cursor:         "pointer",
          borderBottom:   collapsed ? "none" : `1px solid ${borderColor}`,
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        {/* Icon + label */}
        <span style={{ fontSize: 14, flexShrink: 0 }}>{profile.icon}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily:    "'Playfair Display',serif",
              fontSize:      13,
              fontWeight:    700,
              color:         accentColor,
              letterSpacing: .2,
            }}
          >
            {isResolved
              ? `${profile.label} — All Critical Diagnoses Addressed`
              : `${profile.label} — Must Not Miss`}
          </div>
          {!collapsed && !isResolved && (
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize:   8,
                color:      "rgba(255,107,107,.6)",
                letterSpacing: .4,
                marginTop:  1,
              }}
            >
              Evaluate and check off each diagnosis as considered —{" "}
              {doneCount}/{total} addressed
            </div>
          )}
          {!collapsed && isResolved && (
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize:   8,
                color:      "rgba(61,255,160,.6)",
                letterSpacing: .4,
                marginTop:  1,
              }}
            >
              {doneCount}/{total} diagnoses reviewed and documented
            </div>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div
            style={{
              width:        80,
              height:       4,
              borderRadius: 2,
              background:   "rgba(255,255,255,.08)",
              flexShrink:   0,
              overflow:     "hidden",
            }}
          >
            <div
              style={{
                height:       "100%",
                width:        `${(doneCount / total) * 100}%`,
                background:   accentColor,
                borderRadius: 2,
                transition:   "width .3s ease",
              }}
            />
          </div>
        )}

        {/* Collapse toggle */}
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize:   9,
            color:      accentColor,
            flexShrink: 0,
          }}
        >
          {collapsed ? "▼ show" : "▲ hide"}
        </span>

        {/* Dismiss button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss && onDismiss();
          }}
          title="Dismiss this banner"
          style={{
            width:           20,
            height:          20,
            borderRadius:    "50%",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            cursor:          "pointer",
            border:          `1px solid ${borderColor}`,
            background:      "transparent",
            color:           accentColor,
            fontFamily:      "'JetBrains Mono',monospace",
            fontSize:        9,
            fontWeight:      700,
            flexShrink:      0,
            transition:      "all .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Diagnosis chips ─────────────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ padding: "10px 14px 12px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.must_not_miss.map((dx) => {
              const isChecked = addressed.has(dx);
              return (
                <button
                  key={dx}
                  onClick={() => toggleDx(dx)}
                  title={
                    isChecked
                      ? `${dx} — marked as considered. Click to unmark.`
                      : `Click to mark ${dx} as considered and documented.`
                  }
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    gap:            6,
                    padding:        "5px 12px",
                    borderRadius:   20,
                    cursor:         "pointer",
                    transition:     "all .15s",
                    border:         `1px solid ${
                      isChecked
                        ? "rgba(61,255,160,.5)"
                        : "rgba(255,107,107,.4)"
                    }`,
                    background:     isChecked
                      ? "rgba(61,255,160,.1)"
                      : "rgba(255,107,107,.06)",
                  }}
                >
                  {/* Checkbox circle */}
                  <div
                    style={{
                      width:          14,
                      height:         14,
                      borderRadius:   "50%",
                      flexShrink:     0,
                      border:         `2px solid ${
                        isChecked ? "#3dffa0" : "rgba(255,107,107,.5)"
                      }`,
                      background:     isChecked
                        ? "rgba(61,255,160,.25)"
                        : "transparent",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      transition:     "all .15s",
                    }}
                  >
                    {isChecked && (
                      <span
                        style={{
                          fontSize:   8,
                          color:      "#3dffa0",
                          lineHeight: 1,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Diagnosis name */}
                  <span
                    style={{
                      fontFamily:  "'DM Sans',sans-serif",
                      fontSize:    11,
                      fontWeight:  isChecked ? 600 : 500,
                      color:       isChecked ? "#3dffa0" : "rgba(255,160,160,.9)",
                      transition:  "all .15s",
                      textDecoration: isChecked ? "none" : "none",
                    }}
                  >
                    {dx}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Footer row ──────────────────────────────────────────────────── */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              marginTop:    10,
              paddingTop:   8,
              borderTop:    `1px solid ${borderColor}`,
              flexWrap:     "wrap",
            }}
          >
            {/* ACEP policy reference */}
            {profile.acep_policy && (
              <span
                style={{
                  fontFamily:    "'JetBrains Mono',monospace",
                  fontSize:      7,
                  color:         "rgba(107,158,200,.5)",
                  letterSpacing: .3,
                  flex:          1,
                }}
              >
                📋 {profile.acep_policy}
              </span>
            )}

            {/* Quick action: mark all */}
            {!allDone && (
              <button
                onClick={() =>
                  setAddressed(new Set(profile.must_not_miss))
                }
                style={{
                  padding:      "2px 10px",
                  borderRadius: 5,
                  cursor:       "pointer",
                  fontFamily:   "'JetBrains Mono',monospace",
                  fontSize:     7,
                  fontWeight:   700,
                  border:       "1px solid rgba(107,158,200,.3)",
                  background:   "transparent",
                  color:        "rgba(107,158,200,.5)",
                  letterSpacing:.3,
                  transition:   "all .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color   = "var(--qn-txt2)";
                  e.currentTarget.style.border  = "1px solid rgba(107,158,200,.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color   = "rgba(107,158,200,.5)";
                  e.currentTarget.style.border  = "1px solid rgba(107,158,200,.3)";
                }}
              >
                Mark all considered
              </button>
            )}

            {/* Quick action: reset */}
            {doneCount > 0 && (
              <button
                onClick={() => setAddressed(new Set())}
                style={{
                  padding:      "2px 10px",
                  borderRadius: 5,
                  cursor:       "pointer",
                  fontFamily:   "'JetBrains Mono',monospace",
                  fontSize:     7,
                  fontWeight:   700,
                  border:       "1px solid rgba(42,79,122,.35)",
                  background:   "transparent",
                  color:        "var(--qn-txt4)",
                  letterSpacing:.3,
                }}
              >
                Reset
              </button>
            )}

            {/* Disposition status indicator */}
            {dispResult && dispResult.disposition && (
              <div
                style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         5,
                  padding:     "2px 8px",
                  borderRadius: 4,
                  background:  "rgba(61,255,160,.08)",
                  border:      "1px solid rgba(61,255,160,.25)",
                }}
              >
                <div
                  style={{
                    width:        5,
                    height:       5,
                    borderRadius: "50%",
                    background:   "#3dffa0",
                    flexShrink:   0,
                  }}
                />
                <span
                  style={{
                    fontFamily:    "'JetBrains Mono',monospace",
                    fontSize:      7,
                    color:         "rgba(61,255,160,.7)",
                    letterSpacing: .3,
                  }}
                >
                  Disposition: {dispResult.disposition}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}