import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { FileText, Download, Share2, Loader2, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";

const EXPORT_FORMATS = [
  { id: "pdf_full", label: "Full Clinical Note (PDF)", icon: FileText, description: "Complete medical documentation" },
  { id: "pdf_patient", label: "Patient Summary (PDF)", icon: Share2, description: "Plain-language instructions" },
  { id: "hl7", label: "HL7 v2.x Format", icon: FileText, description: "Standard healthcare messaging" },
  { id: "fhir", label: "FHIR JSON Bundle", icon: FileText, description: "Modern interoperability standard" },
];

export default function ExportNoteModal({ open, onClose, note }) {
  const [selectedFormats, setSelectedFormats] = useState(["pdf_full"]);
  const [exporting, setExporting] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [includeDiagrams, setIncludeDiagrams] = useState(true);

  const toggleFormat = (formatId) => {
    setSelectedFormats(prev =>
      prev.includes(formatId)
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  const generatePDF = (isPatientVersion = false) => {
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text(isPatientVersion ? "Patient Care Summary" : "Clinical Note", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    y += 15;

    if (isPatientVersion) {
      // Patient-friendly version
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Patient: ${note.patient_name || "N/A"}`, 20, y);
      y += 10;

      if (note.date_of_visit) {
        doc.setFontSize(11);
        doc.text(`Visit Date: ${new Date(note.date_of_visit).toLocaleDateString()}`, 20, y);
        y += 15;
      }

      // What brought you in
      if (note.chief_complaint) {
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text("WHAT BROUGHT YOU IN:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const ccLines = doc.splitTextToSize(note.chief_complaint, 170);
        doc.text(ccLines, 20, y);
        y += ccLines.length * 6 + 8;
      }

      // What we found
      if (note.assessment || note.diagnoses?.length) {
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text("WHAT WE FOUND:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const assessment = note.assessment || note.diagnoses?.join(", ") || "";
        const assessLines = doc.splitTextToSize(assessment, 170);
        doc.text(assessLines, 20, y);
        y += assessLines.length * 6 + 8;
      }

      // Your treatment plan
      if (note.plan) {
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text("YOUR TREATMENT PLAN:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const planLines = doc.splitTextToSize(note.plan, 170);
        doc.text(planLines, 20, y);
        y += planLines.length * 6 + 8;
      }

      // Medications
      if (note.medications?.length) {
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text("MEDICATIONS:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        note.medications.forEach(med => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`• ${med}`, 25, y);
          y += 6;
        });
        y += 8;
      }

      // Follow-up instructions
      if (note.disposition_plan || note.disposition) {
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text("NEXT STEPS:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const dispLines = doc.splitTextToSize(note.disposition_plan || note.disposition || "", 170);
        doc.text(dispLines, 20, y);
        y += dispLines.length * 6 + 8;
      }

      // When to seek help
      y += 5;
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38);
      doc.text("WHEN TO SEEK IMMEDIATE HELP:", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const warnings = [
        "• Difficulty breathing or shortness of breath",
        "• Chest pain or pressure",
        "• Severe or worsening symptoms",
        "• High fever that doesn't respond to medication",
        "• Confusion or loss of consciousness",
      ];
      warnings.forEach(w => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(w, 25, y);
        y += 6;
      });
    } else {
      // Full clinical version
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const sections = [
        { title: "PATIENT INFORMATION", fields: [
          { label: "Name", value: note.patient_name },
          { label: "MRN", value: note.patient_id },
          { label: "DOB", value: note.date_of_birth },
          { label: "Age", value: note.patient_age },
          { label: "Gender", value: note.patient_gender },
        ]},
        { title: "CHIEF COMPLAINT", content: note.chief_complaint },
        { title: "HISTORY OF PRESENT ILLNESS", content: note.history_of_present_illness },
        { title: "PAST MEDICAL HISTORY", content: note.medical_history },
        { title: "MEDICATIONS", list: note.medications },
        { title: "ALLERGIES", list: note.allergies },
        { title: "REVIEW OF SYSTEMS", content: note.review_of_systems },
        { title: "PHYSICAL EXAMINATION", content: note.physical_exam },
        { title: "VITAL SIGNS", data: note.vital_signs },
        { title: "ASSESSMENT", content: note.assessment },
        { title: "MEDICAL DECISION MAKING", content: note.mdm },
        { title: "PLAN", content: note.plan },
        { title: "DISPOSITION", content: note.disposition_plan || note.disposition },
      ];

      sections.forEach(section => {
        if (!section.fields && !section.content && !section.list && !section.data) return;

        if (y > 250) { doc.addPage(); y = 20; }

        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235);
        doc.text(section.title, 20, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        if (section.fields) {
          section.fields.forEach(field => {
            if (field.value) {
              doc.text(`${field.label}: ${field.value}`, 20, y);
              y += 5;
            }
          });
          y += 3;
        } else if (section.content) {
          const lines = doc.splitTextToSize(section.content, 170);
          doc.text(lines, 20, y);
          y += lines.length * 5 + 8;
        } else if (section.list) {
          section.list.forEach(item => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`• ${item}`, 25, y);
            y += 5;
          });
          y += 3;
        } else if (section.data) {
          Object.entries(section.data).forEach(([key, val]) => {
            if (val?.value) {
              doc.text(`${key.replace(/_/g, ' ')}: ${val.value} ${val.unit || ''}`, 25, y);
              y += 5;
            }
          });
          y += 3;
        }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      doc.text("CONFIDENTIAL MEDICAL RECORD", 20, 290);
    }

    return doc;
  };

  const generateHL7 = () => {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const lines = [
      `MSH|^~\\&|NOTRYA|FACILITY|RECEIVER|DEST|${timestamp}||MDM^T02|${note.id}|P|2.5`,
      `PID|1||${note.patient_id || ''}^^^MRN||${note.patient_name || 'UNKNOWN'}||${note.date_of_birth || ''}|${note.patient_gender?.[0]?.toUpperCase() || ''}`,
      `PV1|1|O|||||||||||||||||${note.id}`,
      `TXA|1|CN|TX|||${timestamp}|||${note.created_by || ''}||${note.id}||||PA`,
      `OBX|1|TX|CC^Chief Complaint||${note.chief_complaint || ''}`,
      `OBX|2|TX|HPI^History of Present Illness||${note.history_of_present_illness || ''}`,
      `OBX|3|TX|ASSESS^Assessment||${note.assessment || ''}`,
      `OBX|4|TX|PLAN^Plan||${note.plan || ''}`,
    ];
    return lines.join('\r\n');
  };

  const generateFHIR = () => {
    const bundle = {
      resourceType: "Bundle",
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: "Composition",
            status: "final",
            type: {
              coding: [{
                system: "http://loinc.org",
                code: "34133-9",
                display: "Summarization of Episode Note"
              }]
            },
            subject: {
              reference: `Patient/${note.patient_id || 'unknown'}`,
              display: note.patient_name
            },
            date: note.date_of_visit || new Date().toISOString(),
            author: [{ display: note.created_by }],
            title: "Clinical Note",
            section: [
              {
                title: "Chief Complaint",
                code: { coding: [{ system: "http://loinc.org", code: "10154-3" }] },
                text: { status: "generated", div: `<div>${note.chief_complaint || ''}</div>` }
              },
              {
                title: "History of Present Illness",
                code: { coding: [{ system: "http://loinc.org", code: "10164-2" }] },
                text: { status: "generated", div: `<div>${note.history_of_present_illness || ''}</div>` }
              },
              {
                title: "Assessment",
                code: { coding: [{ system: "http://loinc.org", code: "51848-0" }] },
                text: { status: "generated", div: `<div>${note.assessment || ''}</div>` }
              },
              {
                title: "Plan of Treatment",
                code: { coding: [{ system: "http://loinc.org", code: "18776-5" }] },
                text: { status: "generated", div: `<div>${note.plan || ''}</div>` }
              }
            ]
          }
        }
      ]
    };
    return JSON.stringify(bundle, null, 2);
  };

  const handleExport = async () => {
    if (selectedFormats.length === 0) {
      toast.error("Please select at least one export format");
      return;
    }

    setExporting(true);
    try {
      for (const format of selectedFormats) {
        let blob, filename;

        if (format === "pdf_full") {
          const doc = generatePDF(false);
          blob = doc.output("blob");
          filename = `clinical_note_${note.patient_name?.replace(/\s/g, '_')}_${note.id}.pdf`;
        } else if (format === "pdf_patient") {
          const doc = generatePDF(true);
          blob = doc.output("blob");
          filename = `patient_summary_${note.patient_name?.replace(/\s/g, '_')}_${note.id}.pdf`;
        } else if (format === "hl7") {
          const hl7Content = generateHL7();
          blob = new Blob([hl7Content], { type: "text/plain" });
          filename = `note_${note.id}.hl7`;
        } else if (format === "fhir") {
          const fhirContent = generateFHIR();
          blob = new Blob([fhirContent], { type: "application/json" });
          filename = `note_${note.id}_fhir.json`;
        }

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success(`Exported ${selectedFormats.length} format${selectedFormats.length > 1 ? 's' : ''} successfully`);
      onClose();
    } catch (error) {
      toast.error("Export failed: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Clinical Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format selection */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Export Formats</Label>
            <div className="space-y-3">
              {EXPORT_FORMATS.map(format => (
                <div
                  key={format.id}
                  onClick={() => toggleFormat(format.id)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedFormats.includes(format.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    checked={selectedFormats.includes(format.id)}
                    onCheckedChange={() => toggleFormat(format.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <format.icon className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-sm">{format.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{format.description}</p>
                  </div>
                  {selectedFormats.includes(format.id) && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-semibold">Export Options</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="attachments"
                checked={includeAttachments}
                onCheckedChange={setIncludeAttachments}
              />
              <label htmlFor="attachments" className="text-sm cursor-pointer">
                Include lab results and imaging attachments
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="diagrams"
                checked={includeDiagrams}
                onCheckedChange={setIncludeDiagrams}
              />
              <label htmlFor="diagrams" className="text-sm cursor-pointer">
                Include diagrams and visual aids (patient version)
              </label>
            </div>
          </div>

          {/* Note info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
            <div className="font-semibold">Note Details:</div>
            <div className="text-gray-600">Patient: {note.patient_name || "N/A"}</div>
            <div className="text-gray-600">Date: {note.date_of_visit ? new Date(note.date_of_visit).toLocaleDateString() : "N/A"}</div>
            <div className="text-gray-600">Type: {note.note_type || "N/A"}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || selectedFormats.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {selectedFormats.length > 0 && `(${selectedFormats.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}