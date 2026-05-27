import { useState } from "react";

const SECTION_LABELS = {
  cc:         "Chief Complaint",
  hpi:        "HPI",
  ros:        "ROS",
  pe:         "Physical Exam",
  assessment: "Assessment",
  mdm:        "MDM",
  consults:   "Consultations",
  orders:     "Orders",
  plan:       "Plan / Disposition",
};

const FORMATS = [
  { id: "apso",        label: "APSO Note" },
  { id: "soapMDM",     label: "SOAP + MDM" },
  { id: "mdmOnly",     label: "MDM Only" },
  { id: "consultsOnly",label: "Consults Only" },
  { id: "ordersOnly",  label: "Orders Summary" },
  { id: "handoff",     label: "SBAR Handoff" },
  { id: "full",        label: "Full Encounter" },
];

export default function NoteExportPanel({
  chiefComplaint  = "",
  hpi             = "",
  ros             = "",
  physicalExam    = "",
  assessment      = "",
  plan            = "",
  mdmText         = "",
  patientContext  = "",
  consults        = [],
  phases          = [],
  onPopulatePlan  = null,
  onPopulateMDM   = null,
}) {
  const [format, setFormat]           = useState("apso");
  const [sections, setSections]       = useState({
    cc: true, hpi: true, ros: true, pe: true,
    assessment: true, mdm: true, consults: true,
    orders: true, plan: true,
  });
  const [copied, setCopied]           = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [populated, setPopulated]     = useState(null);

  const genConsultsBlock = () => {
    if (!consults.length) return "";
    return consults.map((c, i) =>
      `Consult ${i + 1}: ${c.specialty}${c.physician ? " — Dr. " + c.physician : ""} @ ${c.time}\n` +
      `  Reason: ${c.reason}\n` +
      (c.findings       ? `  Findings communicated: ${c.findings}\n`   : "") +
      (c.recommendation ? `  Recommendation: ${c.recommendation}\n`    : "") +
      (c.orders         ? `  Orders placed per consult: ${c.orders}\n` : "") +
      (c.disposition    ? `  Disposition plan: ${c.disposition}`        : "")
    ).join("\n\n");
  };

  const genOrdersBlock = (includeStaged = true) => {
    const active = phases.filter(p => p.status === "active" && p.orders.length > 0);
    const staged = phases.filter(p => p.status === "staged" && p.orders.length > 0);
    const lines  = [];

    if (active.length) {
      lines.push("Active Orders:");
      active.forEach(p => {
        lines.push(`  [${p.label}${p.firedAt ? " @ " + p.firedAt : ""}]`);
        p.orders.forEach(o => lines.push(`    • [${o.category}] ${o.text}`));
      });
    }

    if (includeStaged && staged.length) {
      lines.push("");
      lines.push("Anticipated / Staged Orders:");
      staged.forEach(p => {
        lines.push(`  [${p.label} — Trigger: ${p.trigger || "Manual fire"}]`);
        p.orders.forEach(o => lines.push(`    • [${o.category}] ${o.text}`));
      });
    }

    return lines.join("\n");
  };

  const genMDMPopulate = () => {
    const parts = [];
    if (mdmText)         parts.push(mdmText);
    if (consults.length) parts.push("\nCONSULTATIONS:\n" + genConsultsBlock());
    const activeOrders = genOrdersBlock(false);
    if (activeOrders)    parts.push("\nORDERS PLACED:\n" + activeOrders);
    return parts.join("\n");
  };

  const genPlanPopulate = () => {
    const parts = [];
    if (plan) parts.push(plan);
    if (consults.length) {
      const recs = consults
        .filter(c => c.recommendation)
        .map(c => `${c.specialty}: ${c.recommendation}`)
        .join("\n");
      if (recs) parts.push("\nConsult Recommendations:\n" + recs);
    }
    const ordersBlock = genOrdersBlock(true);
    if (ordersBlock) parts.push("\n" + ordersBlock);
    return parts.join("\n");
  };

  const genFormat = (id) => {
    const sec = sections;
    const parts = [];

    const add = (header, body) => {
      if (body && body.trim()) parts.push(`${header}\n${body.trim()}`);
    };

    if (id === "apso") {
      if (sec.assessment)  add("ASSESSMENT:",                  assessment);
      if (sec.consults)    add("CONSULTATIONS:",               genConsultsBlock());
      if (sec.plan)        add("PLAN / MANAGEMENT:",           plan);
      if (sec.orders)      add("ORDERS:",                      genOrdersBlock());
      if (sec.cc)          add("CHIEF COMPLAINT:",             chiefComplaint);
      if (sec.hpi)         add("HISTORY OF PRESENT ILLNESS:",  hpi);
      if (sec.ros)         add("REVIEW OF SYSTEMS:",           ros);
      if (sec.pe)          add("PHYSICAL EXAMINATION:",        physicalExam);
    } else if (id === "soapMDM") {
      if (sec.cc)          add("CHIEF COMPLAINT:",              chiefComplaint);
      if (sec.hpi)         add("HISTORY OF PRESENT ILLNESS:",   hpi);
      if (sec.ros)         add("REVIEW OF SYSTEMS:",            ros);
      if (sec.pe)          add("PHYSICAL EXAMINATION:",         physicalExam);
      if (sec.assessment)  add("ASSESSMENT:",                   assessment);
      if (sec.mdm)         add("MEDICAL DECISION MAKING:",      mdmText);
      if (sec.consults)    add("CONSULTATIONS:",                genConsultsBlock());
      if (sec.plan)        add("PLAN:",                         plan);
      if (sec.orders)      add("ORDERS:",                       genOrdersBlock());
    } else if (id === "mdmOnly") {
      add("MEDICAL DECISION MAKING:", mdmText);
      if (consults.length) add("CONSULTATIONS:", genConsultsBlock());
      const activeOrders = genOrdersBlock(false);
      if (activeOrders)    add("ORDERS PLACED:", activeOrders);
    } else if (id === "consultsOnly") {
      if (!consults.length) return "No consultations logged.";
      return genConsultsBlock();
    } else if (id === "ordersOnly") {
      const block = genOrdersBlock(true);
      return block || "No orders entered.";
    } else if (id === "handoff") {
      const activeOrds = phases
        .filter(p => p.status === "active")
        .flatMap(p => p.orders.map(o => `• [${o.category}] ${o.text}`))
        .join("\n");
      const pendingOrds = phases
        .filter(p => p.status === "staged")
        .flatMap(p => p.orders.map(o => `• [${o.category}] ${o.text} (trigger: ${p.trigger || "manual"})`))
        .join("\n");
      const consultRecs = consults
        .filter(c => c.recommendation)
        .map(c => `• ${c.specialty}: ${c.recommendation}`)
        .join("\n");

      return [
        `SITUATION:\n${chiefComplaint || assessment || "(no chief complaint entered)"}`,
        `BACKGROUND:\n${hpi || "(no HPI entered)"}`,
        `ASSESSMENT:\n${assessment || "(no assessment entered)"}`,
        `RECOMMENDATIONS / PLAN:\n${plan || "(no plan entered)"}`,
        consultRecs ? `SPECIALIST INPUT:\n${consultRecs}` : "",
        activeOrds  ? `ACTIVE ORDERS:\n${activeOrds}` : "",
        pendingOrds ? `PENDING / STAGED ORDERS:\n${pendingOrds}` : "",
      ].filter(Boolean).join("\n\n");
    } else if (id === "full") {
      add("CHIEF COMPLAINT:",            chiefComplaint);
      add("HISTORY OF PRESENT ILLNESS:", hpi);
      add("REVIEW OF SYSTEMS:",          ros);
      add("PHYSICAL EXAMINATION:",       physicalExam);
      add("ASSESSMENT:",                 assessment);
      add("MEDICAL DECISION MAKING:",    mdmText);
      add("CONSULTATIONS:",              genConsultsBlock());
      add("PLAN / MANAGEMENT:",          plan);
      add("ORDERS:",                     genOrdersBlock());
    }

    return parts.join("\n\n") || "(Nothing to export — fill in QuickNote fields above)";
  };

  const copy = (text, key) => {
    if (!text || !text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2200);
    });
  };

  const populateMDM = () => {
    if (onPopulateMDM) onPopulateMDM(genMDMPopulate());
    setPopulated("mdm");
    setTimeout(() => setPopulated(null), 2200);
  };

  const populatePlan = () => {
    if (onPopulatePlan) onPopulatePlan(genPlanPopulate());
    setPopulated("plan");
    setTimeout(() => setPopulated(null), 2200);
  };

  const toggleSection = (key) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const previewText  = genFormat(format);
  const hasConsults  = consults.length > 0;
  const hasOrders    = phases.some(p => p.orders.length > 0);
  const activeCount  = phases.filter(p => p.status === "active").reduce((n, p) => n + p.orders.length, 0);
  const stagedCount  = phases.filter(p => p.status === "staged").reduce((n, p) => n + p.orders.length, 0);

  const wrap = {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#e2e8f0",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "1.1rem 1.25rem",
  };

  const sectionLabel = {
    fontSize: "10px", fontWeight: "800",
    textTransform: "uppercase", letterSpacing: "0.09em",
    color: "#4b5e78", marginBottom: "0.5rem", display: "block",
  };

  const btn = (v, active = false) => ({
    background:
      active            ? (v === "teal" ? "rgba(20,184,166,0.22)"  : v === "gold" ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.12)")
      : v === "teal"    ? "rgba(20,184,166,0.1)"
      : v === "gold"    ? "rgba(245,158,11,0.1)"
      : v === "green"   ? "rgba(16,185,129,0.12)"
      : "rgba(255,255,255,0.05)",
    border:
      active            ? (v === "teal" ? "1px solid rgba(20,184,166,0.55)" : v === "gold" ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.22)")
      : v === "teal"    ? "1px solid rgba(20,184,166,0.3)"
      : v === "gold"    ? "1px solid rgba(245,158,11,0.3)"
      : v === "green"   ? "1px solid rgba(16,185,129,0.35)"
      : "1px solid rgba(255,255,255,0.09)",
    color:
      active            ? (v === "teal" ? "#14b8a6" : v === "gold" ? "#f59e0b" : "#e2e8f0")
      : v === "teal"    ? "#14b8a6"
      : v === "gold"    ? "#f59e0b"
      : v === "green"   ? "#10b981"
      : "#64748b",
    borderRadius: "7px", padding: "5px 12px",
    fontSize: "12px", fontWeight: active ? "700" : "500",
    cursor: "pointer", whiteSpace: "nowrap",
  });

  const chipBtn = (on) => ({
    display: "inline-flex", alignItems: "center", gap: "4px",
    background: on ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${on ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.08)"}`,
    color: on ? "#14b8a6" : "#4b5e78",
    borderRadius: "6px", padding: "3px 9px",
    fontSize: "11px", fontWeight: on ? "700" : "500",
    cursor: "pointer", margin: "2px",
  });

  return (
    <div style={wrap}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: "700", color: "#f1f5f9" }}>
              Note Export
            </span>
            <span style={{ fontSize: "11px", color: "#4b5e78", marginLeft: "10px" }}>
              QuickNote integration layer
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "5px" }}>
          <span style={{
            background: hasConsults ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${hasConsults ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.07)"}`,
            color: hasConsults ? "#14b8a6" : "#334155",
            borderRadius: "20px", padding: "2px 9px", fontSize: "11px", fontWeight: "700",
          }}>
            {consults.length} consult{consults.length !== 1 ? "s" : ""}
          </span>
          <span style={{
            background: hasOrders ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${hasOrders ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.07)"}`,
            color: hasOrders ? "#f59e0b" : "#334155",
            borderRadius: "20px", padding: "2px 9px", fontSize: "11px", fontWeight: "700",
          }}>
            {activeCount} active · {stagedCount} staged
          </span>
        </div>
      </div>

      {/* Populate buttons */}
      {(onPopulateMDM || onPopulatePlan) && (
        <div style={{
          display: "flex", gap: "6px", flexWrap: "wrap",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px", padding: "0.6rem 0.75rem", marginBottom: "0.85rem",
        }}>
          <span style={{ ...sectionLabel, marginBottom: 0, display: "flex", alignItems: "center" }}>Push to field →</span>
          {onPopulateMDM && (
            <button style={btn(populated === "mdm" ? "green" : "teal")} onClick={populateMDM}>
              {populated === "mdm" ? "✓ MDM Updated" : "→ Populate MDM"}
            </button>
          )}
          {onPopulatePlan && (
            <button style={btn(populated === "plan" ? "green" : "gold")} onClick={populatePlan}>
              {populated === "plan" ? "✓ Plan Updated" : "→ Populate Plan"}
            </button>
          )}
        </div>
      )}

      {/* Format selector */}
      <span style={sectionLabel}>Note Format</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.75rem" }}>
        {FORMATS.map(f => (
          <button key={f.id} style={btn("default", format === f.id)} onClick={() => setFormat(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Section toggles */}
      {!["consultsOnly", "ordersOnly"].includes(format) && (
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={sectionLabel}>Include Sections</span>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <button key={key} style={chipBtn(sections[key])} onClick={() => toggleSection(key)}>
                {sections[key] ? "✓" : "○"} {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Copy actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "0.75rem" }}>
        <button
          style={{ ...btn("gold"), fontWeight: "700", padding: "7px 16px" }}
          onClick={() => copy(previewText, "format")}
        >
          {copied === "format" ? "✓ Copied" : `⎘ Copy ${FORMATS.find(f => f.id === format)?.label || "Note"}`}
        </button>
        <button style={btn("default")} onClick={() => copy([chiefComplaint, hpi].filter(Boolean).join("\n\nHPI:\n"), "hpi")}>
          {copied === "hpi" ? "✓" : "⎘ HPI"}
        </button>
        <button style={btn("default")} onClick={() => copy(assessment + (mdmText ? "\n\n" + mdmText : ""), "mdm")}>
          {copied === "mdm" ? "✓" : "⎘ MDM"}
        </button>
        <button style={btn("default", hasConsults)} onClick={() => copy(genConsultsBlock(), "consults")}>
          {copied === "consults" ? "✓" : `⎘ Consults${hasConsults ? " (" + consults.length + ")" : ""}`}
        </button>
        <button style={btn("default", hasOrders)} onClick={() => copy(genOrdersBlock(true), "orders")}>
          {copied === "orders" ? "✓" : `⎘ Orders${hasOrders ? " (" + (activeCount + stagedCount) + ")" : ""}`}
        </button>
        <button style={btn("default")} onClick={() => copy(genFormat("handoff"), "handoff")}>
          {copied === "handoff" ? "✓" : "⎘ SBAR"}
        </button>
        <button style={btn("teal")} onClick={() => copy(genFormat("full"), "full")}>
          {copied === "full" ? "✓ Full Note Copied" : "⎘ Full Encounter Note"}
        </button>
        <button style={btn("default")} onClick={() => setShowPreview(v => !v)}>
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
      </div>

      {/* Preview pane */}
      {showPreview && (
        <div style={{
          background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "8px", padding: "0.85rem 1rem",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "12px", color: "#94a3b8", lineHeight: "1.7",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          maxHeight: "320px", overflowY: "auto",
        }}>
          {previewText}
        </div>
      )}
    </div>
  );
}