import React from "react";

// NotryaHubHeader v2 — shared across all Lakonyx hubs
// No React Router · no localStorage · React.useState only · window.location.href navigation

const HUB_CATEGORY_COLORS = {
  "Documentation": "#9B8BFF", "Cardiac": "#FF6B6B",
  "Neurology": "#00BFA5",    "Critical Care": "#F4B942",
  "Tox": "#FF8C42",          "Imaging": "#4FC3F7",
  "Labs": "#81C784",         "Procedures": "#CE93D8",
};

export default function NotryaHubHeader({
  hubName, category, homeUrl, subPage, statusSlot, actions,
}) {
  hubName    = hubName    || "Hub";
  category   = category   || "Clinical";
  homeUrl    = homeUrl    || "/";
  subPage    = subPage    || null;
  statusSlot = statusSlot || null;
  actions    = actions    || null;

  const [wordmarkHov, setWordmarkHov] = React.useState(false);
  const [homeHov,     setHomeHov]     = React.useState(false);
  const catColor = HUB_CATEGORY_COLORS[category] || "#00BFA5";

  const params    = new URLSearchParams(window.location.search);
  const ptName    = params.get("pt_name")   || "";
  const ptAge     = params.get("pt_age")    || "";
  const ptSex     = params.get("pt_sex")    || "";
  const ptWeight  = params.get("pt_weight") || "";
  const ptMrn     = params.get("pt_mrn")    || "";
  const ptRoom    = params.get("pt_room")   || "";
  const patientId = params.get("patientId") || "";
  const hasPatient = !!(ptName || ptMrn);
  // Show census link when no patientId in URL
  const showCensusLink = !patientId;

  const goHome = function() { window.location.href = homeUrl; };
  const goCat  = function() { window.location.href = homeUrl + "?category=" + encodeURIComponent(category); };

  function Slash() {
    return React.createElement("span", {
      style: { color: "rgba(232,237,245,0.20)", fontSize: "15px", margin: "0 2px", lineHeight: 1 }
    }, "/");
  }

  return React.createElement("header", {
    role: "banner",
    style: {
      width: "100%",
      background: "rgba(10,22,40,0.96)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(0,191,165,0.16)",
      fontFamily: '"DM Sans","Inter",sans-serif',
      position: "sticky",
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    },
  },
    // ── Main bar ──
    React.createElement("div", {
      style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "54px" }
    },
      // Left: breadcrumb
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }
      },
        React.createElement("span", {
          onClick: goHome,
          onMouseEnter: function() { setWordmarkHov(true); },
          onMouseLeave: function() { setWordmarkHov(false); },
          style: {
            fontFamily: '"Playfair Display",Georgia,serif',
            fontSize: "17px", fontWeight: "700",
            color: wordmarkHov ? "#00BFA5" : "#E8EDF5",
            cursor: "pointer", userSelect: "none",
            transition: "color 0.15s", letterSpacing: "-0.3px", flexShrink: 0,
          }
        }, "Lakonyx"),
        React.createElement(Slash, null),
        React.createElement("span", {
          style: {
            width: "6px", height: "6px", borderRadius: "50%",
            background: catColor, display: "inline-block", flexShrink: 0,
          }
        }),
        React.createElement("span", {
          onClick: goCat,
          onMouseEnter: function(e) {
            e.currentTarget.style.color = catColor;
            e.currentTarget.style.textDecoration = "underline";
          },
          onMouseLeave: function(e) {
            e.currentTarget.style.color = "rgba(232,237,245,0.45)";
            e.currentTarget.style.textDecoration = "none";
          },
          style: {
            fontSize: "13px", color: "rgba(232,237,245,0.45)",
            cursor: "pointer", transition: "color 0.15s",
            textUnderlineOffset: "3px", flexShrink: 0,
          }
        }, category),
        React.createElement(Slash, null),
        subPage
          ? React.createElement(React.Fragment, null,
              React.createElement("span", {
                onClick: goHome,
                style: {
                  fontFamily: '"Playfair Display",Georgia,serif',
                  fontSize: "14px", fontWeight: "500",
                  color: "rgba(244,185,66,0.60)",
                  cursor: "pointer", flexShrink: 0,
                }
              }, hubName),
              React.createElement(Slash, null),
              React.createElement("span", {
                "aria-current": "page",
                style: {
                  fontFamily: '"Playfair Display",Georgia,serif',
                  fontSize: "16px", fontWeight: "600",
                  color: "#F4B942",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }
              }, subPage)
            )
          : React.createElement("span", {
              "aria-current": "page",
              style: {
                fontFamily: '"Playfair Display",Georgia,serif',
                fontSize: "16px", fontWeight: "600",
                color: "#F4B942",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }
            }, hubName)
      ),
      // Right: actions + home
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "12px" }
      },
        statusSlot,
        actions,
        showCensusLink && React.createElement("button", {
          onClick: function() { window.location.href = "/"; },
          style: {
            display: "flex", alignItems: "center", gap: "5px",
            padding: "4px 11px", borderRadius: "7px",
            border: "1px solid rgba(232,237,245,0.10)",
            background: "transparent",
            color: "rgba(232,237,245,0.35)", fontSize: "12px", cursor: "pointer",
            fontFamily: '"DM Sans","Inter",sans-serif', fontWeight: "400",
            transition: "color 0.15s, border-color 0.15s", whiteSpace: "nowrap",
          },
          onMouseEnter: function(e) {
            e.currentTarget.style.color = "rgba(232,237,245,0.70)";
            e.currentTarget.style.borderColor = "rgba(232,237,245,0.22)";
          },
          onMouseLeave: function(e) {
            e.currentTarget.style.color = "rgba(232,237,245,0.35)";
            e.currentTarget.style.borderColor = "rgba(232,237,245,0.10)";
          },
        },
          React.createElement("svg", {
            width: "11", height: "11", viewBox: "0 0 24 24",
            fill: "none", stroke: "currentColor",
            strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
          },
            React.createElement("line", { x1: "19", y1: "12", x2: "5", y2: "12" }),
            React.createElement("polyline", { points: "12 19 5 12 12 5" })
          ),
          "Patient Census"
        ),
        React.createElement("button", {
          onClick: goHome,
          onMouseEnter: function() { setHomeHov(true); },
          onMouseLeave: function() { setHomeHov(false); },
          "aria-label": "Go to Lakonyx home",
          style: {
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 13px", borderRadius: "8px",
            border: "1px solid rgba(0,191,165,0.25)",
            background: homeHov ? "rgba(0,191,165,0.12)" : "transparent",
            color: "#00BFA5", fontSize: "13px", cursor: "pointer",
            fontFamily: '"DM Sans","Inter",sans-serif', fontWeight: "500",
            transition: "background 0.15s", whiteSpace: "nowrap",
          }
        },
          React.createElement("svg", {
            width: "13", height: "13", viewBox: "0 0 24 24",
            fill: "none", stroke: "currentColor",
            strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round",
          },
            React.createElement("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
            React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })
          ),
          "Home"
        )
      )
    ),
    // ── Patient context strip (visible only when URL params present) ──
    hasPatient && React.createElement("div", {
      style: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: "0 20px", height: "28px",
        background: "rgba(12,26,52,0.92)",
        borderTop: "1px solid rgba(244,185,66,0.09)",
      }
    },
      React.createElement("span", {
        style: {
          fontSize: "10px", fontWeight: "600",
          color: "rgba(244,185,66,0.50)",
          letterSpacing: "0.07em", textTransform: "uppercase",
        }
      }, "Patient"),
      ptName && React.createElement("span", {
        style: { fontSize: "12px", color: "rgba(232,237,245,0.72)" }
      }, ptName + (ptAge ? ", " + ptAge : "") + (ptSex ? " " + ptSex : "")),
      ptWeight && React.createElement(React.Fragment, null,
        React.createElement("span", {
          style: { width: "1px", height: "11px", background: "rgba(244,185,66,0.18)", display: "inline-block", margin: "0 2px" }
        }),
        React.createElement("span", {
          style: { fontSize: "10px", fontWeight: "600", color: "rgba(244,185,66,0.50)", letterSpacing: "0.07em", textTransform: "uppercase" }
        }, "Wt"),
        React.createElement("span", {
          style: { fontSize: "12px", color: "rgba(232,237,245,0.72)" }
        }, ptWeight + " kg")
      ),
      ptMrn && React.createElement(React.Fragment, null,
        React.createElement("span", {
          style: { width: "1px", height: "11px", background: "rgba(244,185,66,0.18)", display: "inline-block", margin: "0 2px" }
        }),
        React.createElement("span", {
          style: { fontSize: "10px", fontWeight: "600", color: "rgba(244,185,66,0.50)", letterSpacing: "0.07em", textTransform: "uppercase" }
        }, "MRN"),
        React.createElement("span", {
          style: { fontSize: "12px", color: "rgba(232,237,245,0.72)" }
        }, ptMrn)
      ),
      ptRoom && React.createElement(React.Fragment, null,
        React.createElement("span", {
          style: { width: "1px", height: "11px", background: "rgba(244,185,66,0.18)", display: "inline-block", margin: "0 2px" }
        }),
        React.createElement("span", {
          style: { fontSize: "10px", fontWeight: "600", color: "rgba(244,185,66,0.50)", letterSpacing: "0.07em", textTransform: "uppercase" }
        }, "Room"),
        React.createElement("span", {
          style: { fontSize: "12px", color: "rgba(232,237,245,0.72)" }
        }, ptRoom)
      )
    )
  );
}