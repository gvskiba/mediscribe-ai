import React from "react";
import { Printer, Send, Mail, Download, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
    if (!patientInstructions) {
      toast.error("Generate instructions first");
      return;
    }
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info("PDF download coming soon");
  };

  const handleAction = (action) => {
    if (!patientInstructions) {
      toast.error("Generate instructions first");
      return;
    }
    toast.success(`${action} delivered to patient`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#e8f4ff]">📋 Patient Instructions</h2>

      {/* AI Generation Settings */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 space-y-3">
        <h3 className="text-xs font-semibold text-[#e8f4ff]">✦ AI Settings</h3>
        <div>
          <label className="text-xs text-[#4a7299] mb-1 block">Reading Level</label>
          <select
            value={readingLevel}
            onChange={(e) => setReadingLevel(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#c8ddf0]"
          >
            <option value="6th grade">6th Grade</option>
            <option value="8th grade">8th Grade</option>
            <option value="10th grade">10th Grade</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#4a7299] mb-1 block">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#c8ddf0]"
          >
            <option value="English">English</option>
            <option value="Spanish">Español</option>
            <option value="French">Français</option>
            <option value="Portuguese">Português</option>
            <option value="Arabic">العربية</option>
          </select>
        </div>
        <button
          onClick={onGenerateInstructions}
          disabled={generating}
          className="w-full px-3 py-2 text-xs font-medium bg-gradient-to-r from-[#00d4bc] to-[#00a896] text-[#050f1e] rounded hover:from-[#00a896] hover:to-[#007f7a] disabled:opacity-50"
        >
          {generating ? "Generating..." : "✦ Generate Instructions"}
        </button>
      </div>

      {/* Patient Instruction Preview */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 max-h-96 overflow-y-auto space-y-3">
        <h3 className="text-xs font-semibold text-[#e8f4ff] sticky top-0 bg-[#0e2340]">Preview</h3>
        {patientInstructions ? (
          <div className="text-xs space-y-3 text-[#c8ddf0]">
            {patientInstructions.diagnosis && (
              <div className="border-b border-[#1e3a5f] pb-2">
                <p className="font-bold text-[#00d4bc]">{patientInstructions.diagnosis.patientFriendlyName}</p>
                <p className="text-[#4a7299] text-xs">{patientInstructions.diagnosis.patientExplanation}</p>
              </div>
            )}
            {patientInstructions.medicationInstructions?.takeAtHome?.length > 0 && (
              <div className="border-b border-[#1e3a5f] pb-2">
                <p className="font-bold text-[#00d4bc]">💊 Medications:</p>
                {patientInstructions.medicationInstructions.takeAtHome.map((med, i) => (
                  <div key={i} className="text-[#4a7299] ml-2">
                    <p className="font-semibold text-[#c8ddf0]">{med.medicationName}</p>
                    <p className="text-xs">Take: {med.dosing}</p>
                    <p className="text-xs">Why: {med.whyTaking}</p>
                  </div>
                ))}
              </div>
            )}
            {patientInstructions.activityGuidelines && (
              <div className="border-b border-[#1e3a5f] pb-2">
                <p className="font-bold text-[#00d4bc]">🚶 Activity:</p>
                <p className="text-[#4a7299] text-xs">{patientInstructions.activityGuidelines.generalActivity}</p>
              </div>
            )}
            {patientInstructions.dietInstructions && (
              <div className="border-b border-[#1e3a5f] pb-2">
                <p className="font-bold text-[#00d4bc]">🥗 Diet:</p>
                <p className="text-[#4a7299] text-xs">{patientInstructions.dietInstructions.generalDiet}</p>
              </div>
            )}
            {patientInstructions.returnPrecautions && (
              <div>
                <p className="font-bold text-[#ff5c6c]">🚨 Return If:</p>
                {patientInstructions.returnPrecautions.call911For?.length > 0 && (
                  <div className="text-[#ff5c6c] text-xs ml-2">
                    <p className="font-semibold">Call 911:</p>
                    <ul className="list-disc list-inside">
                      {patientInstructions.returnPrecautions.call911For.slice(0, 2).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {patientInstructions.followUpPlans?.appointments?.length > 0 && (
              <div className="border-t border-[#1e3a5f] pt-2">
                <p className="font-bold text-[#00d4bc]">📅 Follow-up:</p>
                {patientInstructions.followUpPlans.appointments.slice(0, 2).map((apt, i) => (
                  <p key={i} className="text-[#4a7299] text-xs">{apt}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#2a4d72] text-center py-6">Fill in Final Impression and generate instructions</p>
        )}
      </div>

      {/* Delivery Actions */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 space-y-2">
        <h3 className="text-xs font-semibold text-[#e8f4ff] mb-3">📤 Deliver to Patient</h3>
        <button
          onClick={handlePrint}
          disabled={!patientInstructions}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#00d4bc] hover:bg-[#1e3a5f] disabled:opacity-50"
        >
          <Printer className="w-3 h-3" />
          Print
        </button>
        <button
          onClick={() => handleAction("Portal")}
          disabled={!patientInstructions}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#00d4bc] hover:bg-[#1e3a5f] disabled:opacity-50"
        >
          <Send className="w-3 h-3" />
          Portal
        </button>
        <button
          onClick={() => handleAction("SMS")}
          disabled={!patientInstructions}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#00d4bc] hover:bg-[#1e3a5f] disabled:opacity-50"
        >
          <MessageSquare className="w-3 h-3" />
          SMS
        </button>
        <button
          onClick={() => handleAction("Email")}
          disabled={!patientInstructions}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#00d4bc] hover:bg-[#1e3a5f] disabled:opacity-50"
        >
          <Mail className="w-3 h-3" />
          Email
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={!patientInstructions}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#00d4bc] hover:bg-[#1e3a5f] disabled:opacity-50"
        >
          <Download className="w-3 h-3" />
          PDF
        </button>
      </div>

      {/* Patient Acknowledgment */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 space-y-2">
        <h3 className="text-xs font-semibold text-[#e8f4ff] mb-2">✅ Acknowledgment</h3>
        <label className="flex items-start gap-2 text-xs text-[#c8ddf0] cursor-pointer">
          <input type="checkbox" className="mt-1" defaultChecked />
          <span>Instructions reviewed with patient</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-[#c8ddf0] cursor-pointer">
          <input type="checkbox" className="mt-1" defaultChecked />
          <span>Patient understands</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-[#c8ddf0] cursor-pointer">
          <input type="checkbox" className="mt-1" />
          <span>Interpreter used</span>
        </label>
      </div>

      {/* Sign Button */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#fbbf24] to-[#f5a623] text-[#050f1e] rounded-lg hover:from-[#f5a623] hover:to-[#dc2626]">
        <CheckCircle2 className="w-4 h-4" />
        Sign & Finalize
      </button>
    </div>
  );
}