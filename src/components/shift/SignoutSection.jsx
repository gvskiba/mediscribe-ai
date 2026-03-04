import React, { useState } from "react";

const T = {
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  purple: "#9b6dff",
  edge: "#162d4f",
  panel: "#0d2240",
};

export default function SignoutSection({ patients }) {
  const [format, setFormat] = useState("ipass");

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.bright }}>🤖 AI Sign-Out Generator</div>
            <div style={{ fontSize: 12, color: "#4a7299", marginTop: 4 }}>
              Notrya AI drafts structured I-PASS sign-out summaries for each patient
            </div>
          </div>
          <span
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              borderRadius: 6,
              background: T.purple + "22",
              color: T.purple,
              fontSize: 11,
              fontWeight: 600,
            }}>
            Powered by Notrya AI
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{
              padding: "6px 12px",
              background: T.edge,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              color: T.bright,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}>
            <option value="ipass">I-PASS Format</option>
            <option value="sbar">SBAR Format</option>
            <option value="soap">SOAP Brief</option>
          </select>
          <button
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg,#9b6dff,#7c5cdb)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            🤖 Generate All
          </button>
          <button
            style={{
              padding: "8px 16px",
              background: "rgba(0,212,188,0.1)",
              color: T.teal,
              border: `1px solid rgba(0,212,188,0.25)`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,188,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,188,0.1)")}>
            📋 Copy All
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 14,
          }}>
          {patients.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: T.text }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: T.bright }}>Add patients to your board</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>then click Generate All to create AI sign-outs</div>
            </div>
          ) : (
            patients.map((patient) => (
              <div
                key={patient.id}
                style={{
                  background: T.panel,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}>
                <div style={{ padding: 12, background: T.edge, borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center" }}>
                  <div
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: "#ff5c6c",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                    {patient.acuity}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.bright }}>Room {patient.room}</div>
                    <div style={{ fontSize: 10, color: "#4a7299" }}>{patient.chief_complaint}</div>
                  </div>
                </div>
                <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
                  <textarea
                    placeholder="Click ✨ Generate to create AI sign-out for this patient"
                    defaultValue={patient.signout || ""}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: T.edge,
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      color: T.text,
                      fontSize: 11,
                      fontFamily: "DM Sans, sans-serif",
                      resize: "vertical",
                      minHeight: 120,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: "linear-gradient(135deg,#9b6dff,#7c5cdb)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                      ✨ Generate
                    </button>
                    <button
                      style={{
                        padding: "8px 12px",
                        background: "rgba(0,212,188,0.1)",
                        color: T.teal,
                        border: `1px solid rgba(0,212,188,0.25)`,
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,188,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,188,0.1)")}>
                      📋
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}