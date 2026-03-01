import React from "react";
import { Sparkles, Plus, Trash2 } from "lucide-react";

export default function SummaryPanel({
  data,
  onUpdateField,
  onArrayUpdate,
  onAddRow,
  onRemoveRow,
  onGenerateInstructions,
  generating,
  saving,
}) {
  const Section = ({ title, icon, children, action }) => (
    <div className="mb-6 rounded-lg border border-[#1e3a5f] bg-[#0e2340] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f] bg-[#0b1d35]">
        <h3 className="text-sm font-semibold text-[#e8f4ff]">{icon} {title}</h3>
        {action && action}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );

  const TextField = ({ label, value, onChange, placeholder = "", rows = 1 }) => (
    <div>
      <label className="block text-xs font-medium text-[#4a7299] mb-1">{label}</label>
      {rows > 1 ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#c8ddf0] placeholder-[#2a4d72]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#c8ddf0] placeholder-[#2a4d72]"
        />
      )}
    </div>
  );

  const SelectField = ({ label, value, onChange, options = [] }) => (
    <div>
      <label className="block text-xs font-medium text-[#4a7299] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded text-[#c8ddf0]"
      >
        <option value="">— Select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#e8f4ff]">📋 Clinical Summary</h2>
        {saving && <span className="text-xs text-[#4a7299]">Saving...</span>}
      </div>

      {/* Final Impression */}
      <Section
        title="Final Impression"
        icon="🧠"
        action={
          <button
            onClick={onGenerateInstructions}
            disabled={generating}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[#00d4bc] text-[#050f1e] rounded hover:bg-[#00a896] disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            {generating ? "Generating..." : "Generate"}
          </button>
        }
      >
        <TextField
          label="Primary Diagnosis"
          value={data.finalImpression.primaryDx}
          onChange={(v) => onUpdateField("finalImpression.primaryDx", v)}
          placeholder="e.g., Chest pain — ACS ruled out"
        />
        <TextField
          label="ICD-10 Code"
          value={data.finalImpression.icd10}
          onChange={(v) => onUpdateField("finalImpression.icd10", v)}
          placeholder="e.g., R07.9"
        />
        <TextField
          label="Secondary Diagnoses"
          value={data.finalImpression.secondaryDx}
          onChange={(v) => onUpdateField("finalImpression.secondaryDx", v)}
          placeholder="One per line"
          rows={3}
        />
        <TextField
          label="Clinical Summary"
          value={data.finalImpression.clinicalSummary}
          onChange={(v) => onUpdateField("finalImpression.clinicalSummary", v)}
          placeholder="Brief narrative of encounter and findings"
          rows={4}
        />
        <SelectField
          label="Condition at Discharge"
          value={data.finalImpression.conditionAtDischarge}
          onChange={(v) => onUpdateField("finalImpression.conditionAtDischarge", v)}
          options={["Good", "Stable", "Fair", "Improved", "Unchanged", "Guarded"]}
        />
        <SelectField
          label="E&M / MDM Level"
          value={data.finalImpression.mdmLevel}
          onChange={(v) => onUpdateField("finalImpression.mdmLevel", v)}
          options={["99281", "99282", "99283", "99284", "99285"]}
        />
      </Section>

      {/* Workup Performed */}
      <Section title="Workup Performed" icon="🔬">
        <TextField
          label="Key Lab Results"
          value={data.workupPerformed.labResults}
          onChange={(v) => onUpdateField("workupPerformed.labResults", v)}
          rows={3}
        />
        <TextField
          label="Imaging Results"
          value={data.workupPerformed.imagingResults}
          onChange={(v) => onUpdateField("workupPerformed.imagingResults", v)}
          rows={3}
        />
        <TextField
          label="Procedures"
          value={data.workupPerformed.procedures}
          onChange={(v) => onUpdateField("workupPerformed.procedures", v)}
          rows={2}
        />
        <TextField
          label="Consults / Referrals"
          value={data.workupPerformed.consults}
          onChange={(v) => onUpdateField("workupPerformed.consults", v)}
          rows={2}
        />
      </Section>

      {/* Treatment Provided */}
      <Section title="Treatment Provided in ED" icon="💉">
        <TextField
          label="Medications Given in ED"
          value={data.treatmentProvided.medicationsGivenInED}
          onChange={(v) => onUpdateField("treatmentProvided.medicationsGivenInED", v)}
          rows={3}
        />
        <TextField
          label="IV Fluids"
          value={data.treatmentProvided.ivFluids}
          onChange={(v) => onUpdateField("treatmentProvided.ivFluids", v)}
        />
        <SelectField
          label="Oxygen Therapy"
          value={data.treatmentProvided.oxygenTherapy}
          onChange={(v) => onUpdateField("treatmentProvided.oxygenTherapy", v)}
          options={[
            "None — Room air throughout",
            "NC 2 L/min",
            "Venti-mask",
            "HFNC",
            "BiPAP",
            "Mechanical ventilation",
          ]}
        />
        <TextField
          label="Response to Treatment"
          value={data.treatmentProvided.responseToTreatment}
          onChange={(v) => onUpdateField("treatmentProvided.responseToTreatment", v)}
          rows={2}
        />
      </Section>

      {/* Discharge Medications */}
      <Section
        title="Medications at Discharge"
        icon="💊"
        action={
          <button
            onClick={() => onAddRow("dischargeMedications")}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[#00d4bc] text-[#050f1e] rounded hover:bg-[#00a896]"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        }
      >
        {data.dischargeMedications.length === 0 ? (
          <p className="text-xs text-[#2a4d72]">No medications added yet</p>
        ) : (
          data.dischargeMedications.map((med, idx) => (
            <div
              key={idx}
              className="p-2 rounded border border-[#1e3a5f] bg-[#162d4f] space-y-2 relative"
            >
              <button
                onClick={() => onRemoveRow("dischargeMedications", idx)}
                className="absolute top-2 right-2 text-[#f5a623] hover:text-[#ff5c6c]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <TextField
                label="Medication Name"
                value={med.name}
                onChange={(v) => onArrayUpdate("dischargeMedications", idx, "name", v)}
                placeholder="Generic name"
              />
              <TextField
                label="Dose"
                value={med.dose}
                onChange={(v) => onArrayUpdate("dischargeMedications", idx, "dose", v)}
              />
              <SelectField
                label="Route"
                value={med.route}
                onChange={(v) => onArrayUpdate("dischargeMedications", idx, "route", v)}
                options={[
                  "By mouth (PO)",
                  "IV",
                  "IM",
                  "Topical",
                  "Inhaled",
                  "Under the tongue (SL)",
                  "Nasal",
                  "Eye drops",
                ]}
              />
              <TextField
                label="Frequency"
                value={med.frequency}
                onChange={(v) => onArrayUpdate("dischargeMedications", idx, "frequency", v)}
              />
              <TextField
                label="Purpose (patient-facing)"
                value={med.purpose}
                onChange={(v) => onArrayUpdate("dischargeMedications", idx, "purpose", v)}
              />
            </div>
          ))
        )}
      </Section>

      {/* Follow-Up Plan */}
      <Section
        title="Follow-Up Plan"
        icon="📅"
        action={
          <button
            onClick={() => onAddRow("followUpPlan")}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[#00d4bc] text-[#050f1e] rounded hover:bg-[#00a896]"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        }
      >
        {data.followUpPlan.length === 0 ? (
          <p className="text-xs text-[#2a4d72]">No follow-ups scheduled yet</p>
        ) : (
          data.followUpPlan.map((fu, idx) => (
            <div
              key={idx}
              className="p-2 rounded border border-[#1e3a5f] bg-[#162d4f] space-y-2 relative"
            >
              <button
                onClick={() => onRemoveRow("followUpPlan", idx)}
                className="absolute top-2 right-2 text-[#f5a623] hover:text-[#ff5c6c]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <SelectField
                label="Provider Type"
                value={fu.providerType}
                onChange={(v) => onArrayUpdate("followUpPlan", idx, "providerType", v)}
                options={[
                  "Primary Care Physician",
                  "Cardiologist",
                  "Pulmonologist",
                  "ED Return PRN",
                ]}
              />
              <TextField
                label="Provider Name"
                value={fu.providerName}
                onChange={(v) => onArrayUpdate("followUpPlan", idx, "providerName", v)}
              />
              <SelectField
                label="Timeframe"
                value={fu.timeframe}
                onChange={(v) => onArrayUpdate("followUpPlan", idx, "timeframe", v)}
                options={["24–48 hours", "72 hours", "1 week", "2 weeks", "4–6 weeks", "PRN"]}
              />
              <TextField
                label="Reason"
                value={fu.reason}
                onChange={(v) => onArrayUpdate("followUpPlan", idx, "reason", v)}
              />
              <TextField
                label="Phone"
                value={fu.phone}
                onChange={(v) => onArrayUpdate("followUpPlan", idx, "phone", v)}
              />
            </div>
          ))
        )}
      </Section>

      {/* Provider Attestation */}
      <Section title="Provider Attestation & Signature" icon="✍️">
        <TextField
          label="Attending Physician"
          value={data.attendingPhysician}
          onChange={(v) => onUpdateField("attendingPhysician", v)}
          placeholder="Full name, MD / DO / NP / PA"
        />
        <TextField
          label="NPI"
          value={data.npi}
          onChange={(v) => onUpdateField("npi", v)}
          placeholder="10-digit NPI"
        />
        <TextField
          label="Resident / APP"
          value={data.residentPhysician}
          onChange={(v) => onUpdateField("residentPhysician", v)}
          placeholder="Co-signer if applicable"
        />
        <TextField
          label="Attestation Statement"
          value={data.attestation}
          onChange={(v) => onUpdateField("attestation", v)}
          rows={3}
        />
      </Section>

      <div className="h-12" />
    </div>
  );
}