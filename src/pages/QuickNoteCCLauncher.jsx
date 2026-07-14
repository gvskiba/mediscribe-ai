// QuickNoteCCLauncher.jsx
// Chief Complaint selection screen — appears on QuickNote load
// Named export: CCLauncher
// No AI calls. No base44 imports. Display only.
// v14.0 — CC-Driven QuickNote

import { useState, useEffect, useRef, useCallback } from "react";
import { getCCList } from "./QuickNoteCCProfiles";

// ─── Category accent colors ───────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Cardiovascular: { color: "#ff6b6b",  bg: "rgba(255,107,107,.08)",  border: "rgba(255,107,107,.3)"  },
  Respiratory:    { color: "#3b9eff",  bg: "rgba(59,158,255,.08)",   border: "rgba(59,158,255,.3)"   },
  GI:             { color: "#f5c842",  bg: "rgba(245,200,66,.08)",   border: "rgba(245,200,66,.3)"   },
  Neuro:          { color: "#9b6dff",  bg: "rgba(155,109,255,.08)",  border: "rgba(155,109,255,.3)"  },
  MSK:            { color: "#3dffa0",  bg: "rgba(61,255,160,.08)",   border: "rgba(61,255,160,.3)"   },
  GU:             { color: "#f5c842",  bg: "rgba(245,200,66,.06)",   border: "rgba(245,200,66,.25)"  },
  Psychiatric:    { color: "#9b6dff",  bg: "rgba(155,109,255,.06)",  border: "rgba(155,109,255,.25)" },
  Infectious:     { color: "#ff6b6b",  bg: "rgba(255,107,107,.06)",  border: "rgba(255,107,107,.25)" },
  General:        { color: "var(--qn-txt4)", bg: "rgba(42,79,122,.08)", border: "rgba(42,79,122,.3)" },
};

export function CCLauncher({ isOpen, onSelect, onClose, currentProfileId }) {
  const [search,       setSearch]       = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchRef   = useRef(null);
  const cardRefs    = useRef([]);
  const overlayRef  = useRef(null);

  // All profiles sorted by category then label, General last
  const allProfiles = getCCList();

  // Filtered list based on search input
  const filtered = search.trim().length > 0
    ? allProfiles.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.label.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.id.replace(/_/g, " ").includes(q) ||
          p.must_not_miss?.some((d) => d.toLowerCase().includes(q))
        );
      })
    : allProfiles;

  // Group filtered profiles by category
  const grouped = filtered.reduce((acc, profile) => {
    const cat = profile.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(profile);
    return acc;
  }, {});

  // Flat ordered list for keyboard nav (General always last)
  const flatList = filtered;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setFocusedIndex(0);
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === "Escape") {
      if (onClose) onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, flatList.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && flatList[focusedIndex]) {
      e.preventDefault();
      onSelect(flatList[focusedIndex]);
      return;
    }
  }, [isOpen, flatList, focusedIndex, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Scroll focused card into view
  useEffect(() => {
    cardRefs.current[focusedIndex]?.scrollIntoView({
      block: "nearest", behavior: "smooth",
    });
  }, [focusedIndex]);

  // Reset focused index when search changes
  useEffect(() => { setFocusedIndex(0); }, [search]);

  if (!isOpen) return null;

  // Category order for display
  const categoryOrder = [
    "Cardiovascular", "Respiratory", "GI", "Neuro",
    "MSK", "GU", "Psychiatric", "Infectious", "General",
  ];

  const orderedCategories = categoryOrder.filter((cat) => grouped[cat]);

  // Running index for keyboard nav across groups
  let runningIndex = 0;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current && onClose) onClose();
      }}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         999,
        background:     "rgba(5,15,30,.85)",
        backdropFilter: "blur(4px)",
        display:        "flex",
        alignItems:     "flex-start",
        justifyContent: "center",
        padding:        "40px 16px 60px",
        overflowY:      "auto",
      }}
    >
      <div
        style={{
          width:        "100%",
          maxWidth:     680,
          background:   "rgba(8,22,40,.97)",
          border:       "1px solid rgba(0,229,192,.25)",
          borderTop:    "3px solid rgba(0,229,192,.6)",
          borderRadius: 16,
          overflow:     "hidden",
          boxShadow:    "0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(0,229,192,.08)",
        }}
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          style={{
            padding:      "20px 24px 0",
            borderBottom: "1px solid rgba(42,79,122,.3)",
            paddingBottom: 16,
          }}
        >
          <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily:    "'Playfair Display',serif",
                  fontSize:      20,
                  fontWeight:    700,
                  color:         "var(--qn-teal)",
                  marginBottom:  4,
                  letterSpacing: .2,
                }}
              >
                Select Chief Complaint
              </div>
              <div
                style={{
                  fontFamily:    "'DM Sans',sans-serif",
                  fontSize:      12,
                  color:         "var(--qn-txt3)",
                  lineHeight:    1.5,
                }}
              >
                QuickNote will pre-configure the ROS and Physical Exam
                automatically based on your selection.
              </div>
            </div>

            {/* Close button — only shown if there's already an active CC */}
            {currentProfileId && onClose && (
              <button
                onClick={onClose}
                style={{
                  width:          32,
                  height:         32,
                  borderRadius:   "50%",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  cursor:         "pointer",
                  border:         "1px solid rgba(42,79,122,.5)",
                  background:     "transparent",
                  color:          "var(--qn-txt4)",
                  fontSize:       14,
                  flexShrink:     0,
                  transition:     "all .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(42,79,122,.3)";
                  e.currentTarget.style.color      = "var(--qn-txt)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color      = "var(--qn-txt4)";
                }}
                title="Keep current CC"
              >
                ✕
              </button>
            )}
          </div>

          {/* ── Search ──────────────────────────────────────────────────────── */}
          <div style={{ position: "relative" }}>
            <span
              style={{
                position:  "absolute",
                left:      12,
                top:       "50%",
                transform: "translateY(-50%)",
                fontSize:  13,
                color:     "var(--qn-txt4)",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by complaint, category, or diagnosis..."
              style={{
                width:        "100%",
                boxSizing:    "border-box",
                padding:      "9px 12px 9px 36px",
                borderRadius: 8,
                background:   "rgba(14,37,68,.6)",
                border:       "1px solid rgba(42,79,122,.5)",
                color:        "var(--qn-txt)",
                fontFamily:   "'DM Sans',sans-serif",
                fontSize:     13,
                outline:      "none",
                transition:   "border-color .15s",
              }}
              onFocus={(e)  => { e.target.style.borderColor = "rgba(0,229,192,.5)"; }}
              onBlur={(e)   => { e.target.style.borderColor = "rgba(42,79,122,.5)"; }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position:        "absolute",
                  right:           10,
                  top:             "50%",
                  transform:       "translateY(-50%)",
                  background:      "transparent",
                  border:          "none",
                  cursor:          "pointer",
                  color:           "var(--qn-txt4)",
                  fontSize:        12,
                  padding:         "2px 4px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Keyboard hint */}
          <div
            style={{
              display:    "flex",
              gap:        12,
              marginTop:  8,
              flexWrap:   "wrap",
            }}
          >
            {[
              { key: "↑↓", hint: "navigate" },
              { key: "Enter", hint: "select" },
              { key: "Esc", hint: currentProfileId ? "keep current" : "close" },
            ].map(({ key, hint }) => (
              <div
                key={key}
                style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        4,
                }}
              >
                <span
                  style={{
                    fontFamily:    "'JetBrains Mono',monospace",
                    fontSize:      9,
                    color:         "var(--qn-txt4)",
                    background:    "rgba(42,79,122,.3)",
                    border:        "1px solid rgba(42,79,122,.5)",
                    borderRadius: 4,
                    padding:       "1px 6px",
                  }}
                >
                  {key}
                </span>
                <span
                  style={{
                    fontFamily:  "'JetBrains Mono',monospace",
                    fontSize:    8,
                    color:       "rgba(107,158,200,.4)",
                    letterSpacing: .3,
                  }}
                >
                  {hint}
                </span>
              </div>
            ))}
            <span
              style={{
                fontFamily:  "'JetBrains Mono',monospace",
                fontSize:    8,
                color:       "rgba(107,158,200,.3)",
                marginLeft:  "auto",
                alignSelf:   "center",
              }}
            >
              {filtered.length} of {allProfiles.length} complaints
            </span>
          </div>
        </div>

        {/* ── CC Grid ─────────────────────────────────────────────────────── */}
        <div style={{ padding: "16px 24px 24px", maxHeight: "60vh", overflowY: "auto" }}>

          {filtered.length === 0 && (
            <div
              style={{
                textAlign:  "center",
                padding:    "40px 0",
                fontFamily: "'DM Sans',sans-serif",
                fontSize:   13,
                color:      "var(--qn-txt4)",
              }}
            >
              No complaints match "{search}"
              <div style={{ marginTop: 8, fontSize: 11, color: "rgba(107,158,200,.4)" }}>
                Try a symptom, body system, or diagnosis name
              </div>
            </div>
          )}

          {orderedCategories.map((category) => {
            const profiles = grouped[category];
            if (!profiles || profiles.length === 0) return null;
            const catStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
            const isGeneral = category === "General";

            return (
              <div key={category} style={{ marginBottom: isGeneral ? 0 : 20 }}>

                {/* Category label */}
                {!isGeneral && (
                  <div
                    style={{
                      display:       "flex",
                      alignItems:    "center",
                      gap:           8,
                      marginBottom:  8,
                    }}
                  >
                    <div
                      style={{
                        height:     1,
                        width:      12,
                        background: catStyle.border,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily:    "'JetBrains Mono',monospace",
                        fontSize:      8,
                        fontWeight:    700,
                        color:         catStyle.color,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        flexShrink:    0,
                      }}
                    >
                      {category}
                    </span>
                    <div
                      style={{
                        flex:       1,
                        height:     1,
                        background: "rgba(42,79,122,.25)",
                      }}
                    />
                  </div>
                )}

                {/* Profile cards */}
                <div
                  style={{
                    display:             "grid",
                    gridTemplateColumns: isGeneral ? "1fr" : "1fr 1fr",
                    gap:                 8,
                  }}
                >
                  {profiles.map((profile) => {
                    const cardIndex  = runningIndex++;
                    const isFocused  = cardIndex === focusedIndex;
                    const isCurrent  = profile.id === currentProfileId;
                    const cardStyle  = CATEGORY_COLORS[profile.category] || CATEGORY_COLORS.General;

                    return (
                      <button
                        key={profile.id}
                        ref={(el) => { cardRefs.current[cardIndex] = el; }}
                        onClick={() => onSelect(profile)}
                        onMouseEnter={() => setFocusedIndex(cardIndex)}
                        style={{
                          display:     "flex",
                          alignItems:  "flex-start",
                          gap:         10,
                          padding:     isGeneral ? "10px 14px" : "12px 14px",
                          borderRadius: 10,
                          cursor:      "pointer",
                          textAlign:   "left",
                          transition:  "all .15s",
                          border:      `1px solid ${
                            isFocused
                              ? cardStyle.border
                              : isCurrent
                              ? "rgba(0,229,192,.4)"
                              : "rgba(42,79,122,.3)"
                          }`,
                          background:  isFocused
                            ? cardStyle.bg
                            : isCurrent
                            ? "rgba(0,229,192,.06)"
                            : "rgba(14,37,68,.4)",
                          outline:     isFocused
                            ? `2px solid ${cardStyle.border}`
                            : "none",
                          outlineOffset: 1,
                        }}
                      >
                        {/* Icon */}
                        <span
                          style={{
                            fontSize:  isGeneral ? 16 : 22,
                            flexShrink: 0,
                            lineHeight: 1,
                            marginTop:  isGeneral ? 0 : 2,
                          }}
                        >
                          {profile.icon}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Label row */}
                          <div
                            style={{
                              display:      "flex",
                              alignItems:   "center",
                              gap:          6,
                              marginBottom: isGeneral ? 0 : 4,
                              flexWrap:     "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'DM Sans',sans-serif",
                                fontSize:   isGeneral ? 12 : 13,
                                fontWeight: 600,
                                color:      isFocused
                                  ? cardStyle.color
                                  : isCurrent
                                  ? "var(--qn-teal)"
                                  : "var(--qn-txt)",
                                transition: "color .15s",
                              }}
                            >
                              {profile.label}
                            </span>

                            {isCurrent && (
                              <span
                                style={{
                                  fontFamily:  "'JetBrains Mono',monospace",
                                  fontSize:    7,
                                  fontWeight:  700,
                                  color:       "var(--qn-teal)",
                                  background:  "rgba(0,229,192,.1)",
                                  border:      "1px solid rgba(0,229,192,.3)",
                                  borderRadius: 4,
                                  padding:     "1px 6px",
                                  letterSpacing: .4,
                                  flexShrink:  0,
                                }}
                              >
                                Active
                              </span>
                            )}
                          </div>

                          {/* Must not miss preview — hidden for General */}
                          {!isGeneral && profile.must_not_miss?.length > 0 && (
                            <div
                              style={{
                                display:  "flex",
                                flexWrap: "wrap",
                                gap:      4,
                              }}
                            >
                              {profile.must_not_miss.slice(0, 3).map((dx) => (
                                <span
                                  key={dx}
                                  style={{
                                    fontFamily:   "'JetBrains Mono',monospace",
                                    fontSize:     7,
                                    color:        "rgba(255,160,160,.6)",
                                    background:   "rgba(255,107,107,.06)",
                                    border:       "1px solid rgba(255,107,107,.2)",
                                    borderRadius: 3,
                                    padding:      "1px 5px",
                                    letterSpacing: .2,
                                    whiteSpace:   "nowrap",
                                  }}
                                >
                                  {dx}
                                </span>
                              ))}
                              {profile.must_not_miss.length > 3 && (
                                <span
                                  style={{
                                    fontFamily:   "'JetBrains Mono',monospace",
                                    fontSize:     7,
                                    color:        "rgba(107,158,200,.4)",
                                    borderRadius: 3,
                                    padding:      "1px 4px",
                                  }}
                                >
                                  +{profile.must_not_miss.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* General description */}
                          {isGeneral && (
                            <span
                              style={{
                                fontFamily: "'DM Sans',sans-serif",
                                fontSize:   11,
                                color:      "var(--qn-txt4)",
                              }}
                            >
                              Free text — no templates pre-loaded. Use for
                              atypical presentations.
                            </span>
                          )}
                        </div>

                        {/* Arrow indicator on focus */}
                        {isFocused && (
                          <span
                            style={{
                              fontFamily:  "'JetBrains Mono',monospace",
                              fontSize:    10,
                              color:       cardStyle.color,
                              flexShrink:  0,
                              alignSelf:   "center",
                              marginLeft:  "auto",
                            }}
                          >
                            →
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div
          style={{
            padding:       "10px 24px",
            borderTop:     "1px solid rgba(42,79,122,.3)",
            background:    "rgba(5,15,30,.4)",
            display:       "flex",
            alignItems:    "center",
            gap:           10,
            flexWrap:      "wrap",
          }}
        >
          <span
            style={{
              fontFamily:    "'JetBrains Mono',monospace",
              fontSize:      8,
              color:         "rgba(107,158,200,.4)",
              letterSpacing: .4,
              flex:          1,
            }}
          >
            LAKONYX QUICKNOTE v14.0 · CC-DRIVEN · ROS + PE auto-configured
            on selection
          </span>
          {currentProfileId && onClose && (
            <button
              onClick={onClose}
              style={{
                padding:      "4px 14px",
                borderRadius: 6,
                cursor:       "pointer",
                fontFamily:   "'DM Sans',sans-serif",
                fontSize:     11,
                fontWeight:   600,
                border:       "1px solid rgba(42,79,122,.45)",
                background:   "rgba(14,37,68,.6)",
                color:        "var(--qn-txt3)",
                transition:   "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background   = "rgba(42,79,122,.3)";
                e.currentTarget.style.color        = "var(--qn-txt)";
                e.currentTarget.style.borderColor  = "rgba(107,158,200,.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background   = "rgba(14,37,68,.6)";
                e.currentTarget.style.color        = "var(--qn-txt3)";
                e.currentTarget.style.borderColor  = "rgba(42,79,122,.45)";
              }}
            >
              Keep current CC
            </button>
          )}
        </div>
      </div>
    </div>
  );
}