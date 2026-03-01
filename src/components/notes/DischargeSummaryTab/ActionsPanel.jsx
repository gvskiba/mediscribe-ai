import React from "react";
import { Sparkles, Printer, Send, Download, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import PatientInstructionPreview from "./PatientInstructionPreview";

export default function ActionsPanel({
  patientInstructions,
  readingLevel,
  setReadingLevel,
  language,
  setLanguage,
  onGenerateInstructions,
  generating,
  note,
  dischargeData,
}) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!patientInstructions) {
      toast.error("Generate instructions first");
      return;
    }
    toast.success("Downloading PDF...");
    // Implementation would use jsPDF
  };

  const handleSendPortal = () => {
    toast.success("Sent to patient portal");
  };

  const handleSendSMS = () => {
    toast.success("SMS link sent to patient");
  };

  const handleEmail = () => {
    toast.success("Email sent to patient");
  };

  return (
    <div className="ds-actions-panel">
      <div className="ds-panel-header">
        <h2 className="ds-panel-title">📋 Patient Instructions</h2>
      </div>

      {/* Settings Section */}
      <div className="ds-section-compact">
        <h3 className="ds-section-title-small">✦ AI Settings</h3>
        <div className="ds-settings">
          <div className="ds-setting-group">
            <label className="ds-setting-label">Reading Level</label>
            <select
              value={readingLevel}
              onChange={(e) => setReadingLevel(e.target.value)}
              className="ds-select-compact"
            >
              <option value="6th grade">6th Grade (Standard)</option>
              <option value="8th grade">8th Grade</option>
              <option value="10th grade">10th Grade (Advanced)</option>
            </select>
          </div>
          <div className="ds-setting-group">
            <label className="ds-setting-label">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="ds-select-compact"
            >
              <option value="English">English</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="Portuguese">Português</option>
              <option value="Arabic">العربية</option>
              <option value="Chinese">简体中文</option>
            </select>
          </div>
        </div>
        <button
          onClick={onGenerateInstructions}
          disabled={generating}
          className="ds-generate-btn"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? "Generating..." : "Generate Instructions"}
        </button>
      </div>

      {/* Preview Section */}
      <div className="ds-preview-section">
        {patientInstructions ? (
          <PatientInstructionPreview
            instructions={patientInstructions}
            patientName={note?.patient_name}
            visitDate={note?.date_of_visit}
            providerName={dischargeData.attendingSignature.attendingName}
          />
        ) : (
          <div className="ds-preview-empty">
            <p>Generate patient instructions to see preview</p>
          </div>
        )}
      </div>

      {/* Delivery Actions */}
      <div className="ds-section-compact">
        <h3 className="ds-section-title-small">📤 Deliver to Patient</h3>
        <div className="ds-action-buttons">
          <button onClick={handlePrint} className="ds-action-btn" title="Print">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleSendPortal} className="ds-action-btn" title="Portal">
            <Send className="w-4 h-4" />
            Portal
          </button>
          <button onClick={handleSendSMS} className="ds-action-btn" title="SMS">
            <MessageSquare className="w-4 h-4" />
            SMS
          </button>
          <button onClick={handleEmail} className="ds-action-btn" title="Email">
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button onClick={handleDownloadPDF} className="ds-action-btn" title="PDF">
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Acknowledgment Section */}
      <div className="ds-section-compact">
        <h3 className="ds-section-title-small">✅ Patient Acknowledgment</h3>
        <div className="ds-checkboxes">
          <label className="ds-checkbox-label">
            <input type="checkbox" defaultChecked className="ds-checkbox" />
            Instructions reviewed with patient
          </label>
          <label className="ds-checkbox-label">
            <input type="checkbox" defaultChecked className="ds-checkbox" />
            Patient verbalized understanding
          </label>
          <label className="ds-checkbox-label">
            <input type="checkbox" className="ds-checkbox" />
            Interpreter services used
          </label>
        </div>
      </div>

      {/* Sign Button */}
      <button className="ds-sign-btn">✍️ Sign & Finalize</button>
    </div>
  );
}