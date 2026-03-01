import React from "react";
import { Sparkles, Save } from "lucide-react";

export default function SummaryPanel({
  data,
  onUpdate,
  onGenerateInstructions,
  generating,
  onSave,
}) {
  const renderField = (label, value, onChange, type = "text", placeholder = "", rows = 3) => {
    if (type === "textarea") {
      return (
        <div key={label} className="ds-field">
          <label className="ds-label">{label}</label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="ds-textarea"
          />
        </div>
      );
    } else if (type === "select") {
      return (
        <div key={label} className="ds-field">
          <label className="ds-label">{label}</label>
          <select value={value} onChange={(e) => onChange(e.target.value)} className="ds-select">
            {placeholder.split("|").map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    } else {
      return (
        <div key={label} className="ds-field">
          <label className="ds-label">{label}</label>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="ds-input"
          />
        </div>
      );
    }
  };

  return (
    <div className="ds-summary-panel">
      <div className="ds-panel-header">
        <h2 className="ds-panel-title">📋 Clinical Discharge Summary</h2>
        <button onClick={onSave} className="ds-save-btn">
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>

      <div className="ds-sections-scroll">
        {/* Final Impression Section */}
        <div className="ds-section">
          <div className="ds-section-header">
            <h3 className="ds-section-title">🧠 Final Impression</h3>
            <button
              onClick={onGenerateInstructions}
              disabled={generating}
              className="ds-ai-btn"
            >
              <Sparkles className="w-3 h-3" />
              {generating ? "Generating..." : "Generate Instructions"}
            </button>
          </div>
          <div className="ds-fields">
            {renderField(
              "Primary Diagnosis",
              data.finalImpression.primaryDx,
              (v) => onUpdate("finalImpression", "primaryDx", v),
              "text",
              "e.g., Chest pain — ACS ruled out"
            )}
            {renderField(
              "ICD-10 Code",
              data.finalImpression.icd10,
              (v) => onUpdate("finalImpression", "icd10", v),
              "text",
              "e.g., R07.9"
            )}
            {renderField(
              "Secondary Diagnoses",
              data.finalImpression.secondaryDx,
              (v) => onUpdate("finalImpression", "secondaryDx", v),
              "textarea",
              "One per line",
              3
            )}
            {renderField(
              "Clinical Summary",
              data.finalImpression.clinicalSummary,
              (v) => onUpdate("finalImpression", "clinicalSummary", v),
              "textarea",
              "Brief narrative of the encounter...",
              4
            )}
            {renderField(
              "Condition at Discharge",
              data.finalImpression.conditionAtDx,
              (v) => onUpdate("finalImpression", "conditionAtDx", v),
              "select",
              "Good|Stable|Fair|Improved|Unchanged|Guarded"
            )}
          </div>
        </div>

        {/* Workup Summary */}
        <div className="ds-section">
          <h3 className="ds-section-title">🔬 Workup Performed</h3>
          <div className="ds-fields">
            {renderField(
              "Key Lab Results",
              data.workupSummary.labResults,
              (v) => onUpdate("workupSummary", "labResults", v),
              "textarea",
              "Troponin, BMP, CBC results...",
              3
            )}
            {renderField(
              "Imaging Results",
              data.workupSummary.imagingResults,
              (v) => onUpdate("workupSummary", "imagingResults", v),
              "textarea",
              "CXR, EKG, CT findings...",
              3
            )}
            {renderField(
              "Procedures Performed",
              data.workupSummary.procedures,
              (v) => onUpdate("workupSummary", "procedures", v),
              "textarea",
              "IV access, monitoring...",
              2
            )}
            {renderField(
              "Consults / Referrals",
              data.workupSummary.consults,
              (v) => onUpdate("workupSummary", "consults", v),
              "textarea",
              "Specialty consults...",
              2
            )}
          </div>
        </div>

        {/* Treatment Summary */}
        <div className="ds-section">
          <h3 className="ds-section-title">💊 Treatment Provided</h3>
          <div className="ds-fields">
            {renderField(
              "Medications Given in ED",
              data.treatmentSummary.medsGiven,
              (v) => onUpdate("treatmentSummary", "medsGiven", v),
              "textarea",
              "Aspirin 325 mg PO, Nitroglycerin SL...",
              3
            )}
            {renderField(
              "IV Fluids",
              data.treatmentSummary.ivFluids,
              (v) => onUpdate("treatmentSummary", "ivFluids", v),
              "text",
              "e.g., NS 1L IV over 2h"
            )}
            {renderField(
              "Oxygen Therapy",
              data.treatmentSummary.oxygen,
              (v) => onUpdate("treatmentSummary", "oxygen", v),
              "select",
              "None — Room air throughout|NC 2 L/min|Venti-mask|HFNC|BiPAP"
            )}
            {renderField(
              "Response to Treatment",
              data.treatmentSummary.response,
              (v) => onUpdate("treatmentSummary", "response", v),
              "textarea",
              "Patient's condition improved...",
              3
            )}
          </div>
        </div>

        {/* MDM & Coding */}
        <div className="ds-section">
          <h3 className="ds-section-title">🧾 Medical Decision Making</h3>
          <div className="ds-fields">
            {renderField(
              "E&M Level",
              data.mdmAndCoding.mdmLevel,
              (v) => onUpdate("mdmAndCoding", "mdmLevel", v),
              "select",
              "99281 — Straightforward|99282 — Low Complexity|99283 — Moderate Complexity|99284 — High Complexity|99285 — High Complexity + Threat to Life"
            )}
          </div>
        </div>

        {/* Attending Signature */}
        <div className="ds-section">
          <h3 className="ds-section-title">✍️ Provider Attestation</h3>
          <div className="ds-fields">
            {renderField(
              "Attending Physician",
              data.attendingSignature.attendingName,
              (v) => onUpdate("attendingSignature", "attendingName", v),
              "text",
              "Full name, MD / DO / NP / PA"
            )}
            {renderField(
              "NPI",
              data.attendingSignature.npi,
              (v) => onUpdate("attendingSignature", "npi", v),
              "text",
              "10-digit NPI"
            )}
            {renderField(
              "Resident / APP",
              data.attendingSignature.residentName,
              (v) => onUpdate("attendingSignature", "residentName", v),
              "text",
              "Co-signer if applicable"
            )}
            {renderField(
              "Attestation",
              data.attendingSignature.attestation,
              (v) => onUpdate("attendingSignature", "attestation", v),
              "textarea",
              "",
              4
            )}
          </div>
        </div>
      </div>
    </div>
  );
}