import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Download, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { jsPDF } from "jspdf";

export default function PatientEducationGenerator({ note, onGenerationComplete }) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateMaterials = async () => {
    if (!note?.diagnoses || note.diagnoses.length === 0) {
      toast.error("No diagnoses available");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create comprehensive, easy-to-understand patient education materials based on this clinical note. Use ONLY simple, clear language that a non-medical person can understand. Avoid all medical jargon completely. Use everyday terms and relatable examples.

PATIENT: ${note.patient_name}
DIAGNOSES: ${note.diagnoses.join(", ")}
TREATMENT PLAN: ${note.plan || "N/A"}
MEDICATIONS: ${note.medications?.join(", ") || "None"}

For EACH diagnosis, create a patient education section with these subsections:

1. WHAT IS MY CONDITION? (2-3 sentences using simple everyday language, like explaining to someone with no medical background)
2. SIGNS TO WATCH FOR AT HOME (5-7 specific symptoms to monitor - things the patient can actually observe)
3. WHAT I CAN DO TO HELP MYSELF (6-8 practical self-care tips including diet, activity, lifestyle changes, medication adherence)
4. MY MEDICATIONS EXPLAINED (simple explanation of what each medication does and why - avoid drug names if possible, focus on what it does)
5. RED FLAGS - WHEN TO GO TO THE HOSPITAL (4-6 serious warning signs requiring immediate medical attention)
6. QUESTIONS TO ASK MY DOCTOR (4-5 important questions to discuss at follow-up visits)
7. FOLLOW-UP CARE (when to schedule next appointment and why)

Keep language at 5th-grade reading level. Use analogies and comparisons to everyday things. Be encouraging and positive.`,
        response_json_schema: {
          type: "object",
          properties: {
            education_sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  what_is_it: { type: "string" },
                  signs_to_watch: { type: "array", items: { type: "string" } },
                  self_care: { type: "array", items: { type: "string" } },
                  medications_explained: { type: "array", items: { type: "string" } },
                  red_flags: { type: "array", items: { type: "string" } },
                  questions_for_doctor: { type: "array", items: { type: "string" } },
                  follow_up: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setMaterials(result.education_sections || []);
      setShowPreview(true);
      onGenerationComplete?.(result.education_sections);
      toast.success("Patient education materials generated");
    } catch (error) {
      console.error("Failed to generate materials:", error);
      toast.error("Failed to generate patient education materials");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!materials || materials.length === 0) return;

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Helper function to check if we need a new page
      const checkNewPage = (minHeight) => {
        if (currentY + minHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
      };

      // Helper function to add text with wrapping
      const addWrappedText = (text, fontSize, isBold, maxWidth) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = pdf.splitTextToSize(text, maxWidth);
        const lineHeight = fontSize * 0.5;
        
        checkNewPage(lines.length * lineHeight + 2);
        
        lines.forEach((line) => {
          pdf.text(line, margin, currentY);
          currentY += lineHeight;
        });
      };

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("Patient Education Materials", margin, currentY);
      currentY += 12;

      // Patient info
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(`Patient: ${note.patient_name}`, 10, false, contentWidth);
      addWrappedText(`Date: ${new Date().toLocaleDateString()}`, 10, false, contentWidth);
      currentY += 5;

      // Add each diagnosis section
      materials.forEach((section, idx) => {
        checkNewPage(30);

        // Diagnosis heading
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235); // blue
        pdf.text(`${idx + 1}. ${section.diagnosis}`, margin, currentY);
        currentY += 8;
        pdf.setTextColor(0, 0, 0);

        // What is it
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        addWrappedText("What Is My Condition?", 11, true, contentWidth);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        addWrappedText(section.what_is_it, 10, false, contentWidth);
        currentY += 2;

        // Signs to watch
        if (section.signs_to_watch?.length > 0) {
          checkNewPage(20);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          addWrappedText("Signs to Watch For", 11, true, contentWidth);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          section.signs_to_watch.forEach((sign) => {
            addWrappedText(`• ${sign}`, 10, false, contentWidth - 5);
          });
          currentY += 2;
        }

        // Self care
        if (section.self_care?.length > 0) {
          checkNewPage(20);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          addWrappedText("What I Can Do to Help Myself", 11, true, contentWidth);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          section.self_care.forEach((care) => {
            addWrappedText(`• ${care}`, 10, false, contentWidth - 5);
          });
          currentY += 2;
        }

        // Medications
        if (section.medications_explained?.length > 0) {
          checkNewPage(15);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          addWrappedText("My Medications Explained", 11, true, contentWidth);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          section.medications_explained.forEach((med) => {
            addWrappedText(`• ${med}`, 10, false, contentWidth - 5);
          });
          currentY += 2;
        }

        // Red flags
        if (section.red_flags?.length > 0) {
          checkNewPage(15);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(220, 38, 38); // red
          addWrappedText("⚠️ When to Go to the Hospital", 11, true, contentWidth);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          section.red_flags.forEach((flag) => {
            addWrappedText(`• ${flag}`, 10, false, contentWidth - 5);
          });
          currentY += 2;
        }

        // Questions for doctor
        if (section.questions_for_doctor?.length > 0) {
          checkNewPage(15);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          addWrappedText("Questions to Ask My Doctor", 11, true, contentWidth);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          section.questions_for_doctor.forEach((q) => {
            addWrappedText(`• ${q}`, 10, false, contentWidth - 5);
          });
          currentY += 2;
        }

        // Follow up
        if (section.follow_up) {
          checkNewPage(10);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          addWrappedText("Follow-Up Care", 11, true, contentWidth);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          addWrappedText(section.follow_up, 10, false, contentWidth);
          currentY += 5;
        }

        currentY += 3;
      });

      // Add footer
      checkNewPage(10);
      currentY = pageHeight - 20;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(128, 128, 128);
      pdf.text("Generated patient education materials for personal use. Always consult with your healthcare provider.", margin, currentY);

      pdf.save(`${note.patient_name}_PatientEducation_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="space-y-4">
      {!materials ? (
        <div>
          <p className="text-xs text-slate-600 mb-3">Generate simple, patient-friendly education materials based on the finalized diagnoses and treatment plan. Materials will include what the condition is, self-care tips, medication explanations, and warning signs.</p>
          <Button
            onClick={generateMaterials}
            disabled={loading}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs h-7 px-3"
          >
            {loading ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="w-3 h-3" />Generate Materials</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <p className="text-xs font-semibold text-slate-700">
                {materials.length} diagnosis education{materials.length !== 1 ? "s" : ""} generated
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadPDF}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1 text-xs h-6 px-2"
              >
                <Download className="w-3 h-3" />Download PDF
              </Button>
              <Button
                onClick={() => { setMaterials(null); setShowPreview(false); }}
                size="sm"
                variant="outline"
                className="text-xs h-6 px-2"
              >
                <X className="w-3 h-3" />Clear
              </Button>
            </div>
          </div>

          {showPreview && (
            <div className="bg-teal-50 rounded-lg border border-teal-200 max-h-96 overflow-y-auto p-3">
              {materials.map((section, idx) => (
                <div key={idx} className="mb-4 pb-3 border-b border-teal-200 last:border-0">
                  <p className="text-xs font-bold text-teal-800 mb-2">{idx + 1}. {section.diagnosis}</p>
                  <p className="text-xs text-slate-700 mb-1"><span className="font-semibold">What is it:</span> {section.what_is_it}</p>
                  {section.self_care?.length > 0 && (
                    <p className="text-xs text-slate-700"><span className="font-semibold">Self-care tips:</span> {section.self_care.slice(0, 2).join(", ")}...</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}