// ECGReportExport.jsx — PDF Export for ECG AI Analysis Results
import React, { useState } from "react";
import { jsPDF } from "jspdf";

const T = {
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", red:"#ff4444", txt4:"#4e7098",
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

export function ECGReportExport({ result, context, mode }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  if (!result) return null;

  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const ml = 18, mr = 18, cw = pw - ml - mr;
      let y = 0;

      const addPage = () => { doc.addPage(); y = 20; };
      const checkY = (needed = 10) => { if (y + needed > ph - 16) addPage(); };

      // ── Header bar ────────────────────────────────────────────
      doc.setFillColor(5, 15, 30);
      doc.rect(0, 0, pw, 22, "F");
      doc.setFont("helvetica","bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 229, 192);
      doc.text("NOTRYA ECG HUB", ml, 10);
      doc.setFont("helvetica","normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 148, 184);
      doc.text("AI ECG INTERPRETATION REPORT", ml, 16);
      doc.text(new Date().toLocaleString(), pw - mr, 16, { align:"right" });

      y = 30;

      // ── Urgency banner ────────────────────────────────────────
      const urgencyColors = {
        Critical:[180,20,20], High:[200,80,50], Moderate:[180,140,30], Low:[0,140,110]
      };
      const uc = urgencyColors[result.urgency] || [60,100,140];
      doc.setFillColor(...uc);
      doc.roundedRect(ml, y, cw, 14, 2, 2, "F");
      doc.setFont("helvetica","bold");
      doc.setFontSize(11);
      doc.setTextColor(255,255,255);
      doc.text(`URGENCY: ${result.urgency}`, ml+5, y+6.5);
      if (result.stemi_equivalent) {
        doc.setFontSize(9);
        doc.text("⚡ STEMI EQUIVALENT — ACTIVATE CATH LAB", ml+5, y+11.5);
      }
      if (result.dangerous_pattern && !result.stemi_equivalent) {
        doc.setFontSize(9);
        doc.text(`Pattern: ${result.dangerous_pattern}`, ml+5, y+11.5);
      }
      y += 20;

      // ── Interpretation ────────────────────────────────────────
      doc.setFillColor(12, 28, 55);
      doc.roundedRect(ml, y, cw, 2, 0, 0, "F");
      y += 5;
      doc.setFont("helvetica","bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 229, 192);
      doc.text("INTERPRETATION", ml, y);
      y += 5;
      doc.setFont("helvetica","normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const interpLines = doc.splitTextToSize(result.interpretation || "", cw);
      checkY(interpLines.length * 5 + 4);
      doc.text(interpLines, ml, y);
      y += interpLines.length * 5 + 6;

      if (result.urgency_reason) {
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        const urLines = doc.splitTextToSize(result.urgency_reason, cw);
        checkY(urLines.length * 4 + 4);
        doc.text(urLines, ml, y);
        y += urLines.length * 4 + 6;
      }

      // ── Clinical context ──────────────────────────────────────
      if (context?.trim()) {
        checkY(16);
        doc.setFillColor(240, 248, 255);
        const ctxLines = doc.splitTextToSize(context, cw - 10);
        doc.roundedRect(ml, y, cw, ctxLines.length * 4.5 + 10, 2, 2, "F");
        doc.setFont("helvetica","bold");
        doc.setFontSize(8);
        doc.setTextColor(60, 100, 160);
        doc.text("CLINICAL CONTEXT", ml+4, y+5.5);
        doc.setFont("helvetica","normal");
        doc.setFontSize(9);
        doc.setTextColor(40, 60, 100);
        doc.text(ctxLines, ml+4, y+10.5);
        y += ctxLines.length * 4.5 + 16;
      }

      // ── Machine concerns ──────────────────────────────────────
      if (result.machine_concerns && result.machine_concerns !== "null") {
        checkY(20);
        doc.setFillColor(245, 240, 255);
        const mcLines = doc.splitTextToSize(result.machine_concerns, cw - 10);
        doc.roundedRect(ml, y, cw, mcLines.length * 4.5 + 10, 2, 2, "F");
        doc.setFont("helvetica","bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 60, 160);
        doc.text("MACHINE INTERPRETATION CONCERNS", ml+4, y+5.5);
        doc.setFont("helvetica","normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 40, 120);
        doc.text(mcLines, ml+4, y+10.5);
        y += mcLines.length * 4.5 + 16;
      }

      // ── Key findings ──────────────────────────────────────────
      if (result.key_findings?.length) {
        checkY(14 + result.key_findings.length * 6);
        doc.setFont("helvetica","bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 229, 192);
        doc.text("KEY FINDINGS", ml, y);
        y += 5;
        doc.setFont("helvetica","normal");
        doc.setFontSize(9);
        result.key_findings.forEach(f => {
          checkY(8);
          doc.setFillColor(0, 229, 192);
          doc.circle(ml+2, y-1, 1, "F");
          doc.setTextColor(30, 30, 30);
          const fLines = doc.splitTextToSize(f, cw - 8);
          doc.text(fLines, ml+6, y);
          y += fLines.length * 4.5 + 2;
        });
        y += 4;
      }

      // ── Parsed ECG measurements ───────────────────────────────
      if (result.parsed_findings?.length) {
        checkY(14);
        doc.setFont("helvetica","bold");
        doc.setFontSize(10);
        doc.setTextColor(78, 112, 152);
        doc.text("ECG MEASUREMENTS", ml, y);
        y += 5;
        doc.setFont("helvetica","normal");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const measText = result.parsed_findings.join("  ·  ");
        const measLines = doc.splitTextToSize(measText, cw);
        checkY(measLines.length * 4.5 + 4);
        doc.text(measLines, ml, y);
        y += measLines.length * 4.5 + 8;
      }

      // ── Differential ──────────────────────────────────────────
      if (result.differentials?.length) {
        checkY(14 + result.differentials.length * 6);
        doc.setFont("helvetica","bold");
        doc.setFontSize(10);
        doc.setTextColor(59, 158, 255);
        doc.text("DIFFERENTIAL DIAGNOSIS", ml, y);
        y += 5;
        result.differentials.forEach((d, i) => {
          checkY(8);
          doc.setFont("helvetica","bold");
          doc.setFontSize(9);
          doc.setTextColor(59, 158, 255);
          doc.text(`${i+1}.`, ml, y);
          doc.setFont("helvetica","normal");
          doc.setTextColor(30, 30, 30);
          const dLines = doc.splitTextToSize(d, cw - 8);
          doc.text(dLines, ml+6, y);
          y += dLines.length * 4.5 + 2;
        });
        y += 4;
      }

      // ── Recommended actions ───────────────────────────────────
      if (result.recommended_actions?.length) {
        checkY(14 + result.recommended_actions.length * 7);
        doc.setFont("helvetica","bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 159, 67);
        doc.text("RECOMMENDED ACTIONS", ml, y);
        y += 5;
        result.recommended_actions.forEach((a, i) => {
          checkY(10);
          doc.setFillColor(255, 159, 67);
          doc.roundedRect(ml, y-3.5, 5.5, 5.5, 1, 1, "F");
          doc.setFont("helvetica","bold");
          doc.setFontSize(8);
          doc.setTextColor(255,255,255);
          doc.text(`${i+1}`, ml+1.8, y+0.5);
          doc.setFont("helvetica","normal");
          doc.setFontSize(9);
          doc.setTextColor(30, 30, 30);
          const aLines = doc.splitTextToSize(a, cw - 9);
          doc.text(aLines, ml+8, y);
          y += aLines.length * 4.5 + 3;
        });
        y += 4;
      }

      // ── Do not miss ───────────────────────────────────────────
      if (result.do_not_miss) {
        checkY(20);
        doc.setFillColor(255, 235, 235);
        const dnmLines = doc.splitTextToSize(result.do_not_miss, cw - 10);
        doc.roundedRect(ml, y, cw, dnmLines.length * 4.5 + 12, 2, 2, "F");
        doc.setFont("helvetica","bold");
        doc.setFontSize(8.5);
        doc.setTextColor(200, 30, 30);
        doc.text("⚠  DO NOT MISS", ml+4, y+6);
        doc.setFont("helvetica","italic");
        doc.setFontSize(9);
        doc.setTextColor(160, 20, 20);
        doc.text(dnmLines, ml+4, y+11);
        y += dnmLines.length * 4.5 + 18;
      }

      // ── Guideline note ────────────────────────────────────────
      if (result.guideline_note) {
        checkY(16);
        doc.setFillColor(230, 250, 247);
        const gnLines = doc.splitTextToSize(result.guideline_note, cw - 10);
        doc.roundedRect(ml, y, cw, gnLines.length * 4.5 + 10, 2, 2, "F");
        doc.setFont("helvetica","bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 140, 110);
        doc.text("GUIDELINE REFERENCE", ml+4, y+5.5);
        doc.setFont("helvetica","normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 100, 80);
        doc.text(gnLines, ml+4, y+10.5);
        y += gnLines.length * 4.5 + 16;
      }

      // ── Confidence ────────────────────────────────────────────
      if (result.confidence) {
        checkY(10);
        doc.setFont("helvetica","normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`AI Confidence: ${result.confidence}${result.confidence_reason ? "  —  " + result.confidence_reason : ""}`, ml, y);
        y += 8;
      }

      // ── Footer ────────────────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(5, 15, 30);
        doc.rect(0, ph - 10, pw, 10, "F");
        doc.setFont("helvetica","normal");
        doc.setFontSize(7);
        doc.setTextColor(78, 112, 152);
        doc.text("NOTRYA ECG HUB · CLINICAL DECISION SUPPORT ONLY · NOT A SUBSTITUTE FOR PHYSICIAN JUDGMENT · 2025 ACC/AHA/ACEP", ml, ph - 4);
        doc.text(`Page ${i} of ${totalPages}`, pw - mr, ph - 4, { align:"right" });
      }

      const timestamp = new Date().toISOString().slice(0,16).replace("T","_").replace(/:/g,"-");
      doc.save(`ECG_Report_${timestamp}.pdf`);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch(e) {
      console.error("PDF export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportPDF}
      disabled={exporting}
      style={{
        width:"100%", padding:"10px 0", borderRadius:8,
        cursor: exporting ? "not-allowed" : "pointer",
        fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
        border:`1px solid ${done?"rgba(0,229,192,.5)":exporting?"rgba(26,53,85,.4)":"rgba(245,200,66,.4)"}`,
        background: done?"rgba(0,229,192,.1)":exporting?"rgba(14,37,68,.4)":"rgba(245,200,66,.07)",
        color: done?"#00e5c0":exporting?"#4e7098":"#f5c842",
        transition:"all .2s",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      }}
    >
      {done ? "✓ PDF Downloaded" : exporting ? "⏳ Generating PDF…" : "📄 Export Report to PDF"}
    </button>
  );
}