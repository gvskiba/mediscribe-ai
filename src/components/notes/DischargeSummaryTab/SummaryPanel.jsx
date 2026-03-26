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
  const S = { panel: '#0b1e36', up: '#0e2544', border: '#1a3555', teal: '#00e5c0', txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a', bg: '#050f1e' };

  const Section = ({ title, icon, children, action }) => (
    <div style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${S.border}`, background: S.panel, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${S.border}`, background: S.up }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: S.txt, margin: 0 }}>{icon} {title}</h3>
        {action && action}
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );

  const TextField = ({ label, value, onChange, placeholder = '', rows = 1 }) => (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: S.txt3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      {rows > 1 ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: '100%', padding: '7px 10px', fontSize: 12, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, color: S.txt, outline: 'none', resize: 'vertical', fontFamily: "'DM Sans', sans-serif" }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '7px 10px', fontSize: 12, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, color: S.txt, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
      )}
    </div>
  );

  const SelectField = ({ label, value, onChange, options = [] }) => (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: S.txt3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '7px 10px', fontSize: 12, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, color: S.txt, outline: 'none', cursor: 'pointer' }}>
        <option value="">— Select —</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: S.txt, margin: 0 }}>📋 Clinical Summary</h2>
        {saving && <span style={{ fontSize: 10, color: S.txt3 }}>Saving...</span>}
      </div>

      <Section title="Final Impression" icon="🧠" action={
        <button onClick={onGenerateInstructions} disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: S.teal, color: '#050f1e', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: generating ? 0.5 : 1 }}>
          <Sparkles style={{ width: 12, height: 12 }} />
          {generating ? 'Generating...' : 'Generate'}
        </button>
      }>
        <TextField label="Primary Diagnosis" value={data.finalImpression.primaryDx} onChange={(v) => onUpdateField('finalImpression.primaryDx', v)} placeholder="e.g., Chest pain — ACS ruled out" />
        <TextField label="ICD-10 Code" value={data.finalImpression.icd10} onChange={(v) => onUpdateField('finalImpression.icd10', v)} placeholder="e.g., R07.9" />
        <TextField label="Secondary Diagnoses" value={data.finalImpression.secondaryDx} onChange={(v) => onUpdateField('finalImpression.secondaryDx', v)} placeholder="One per line" rows={3} />
        <TextField label="Clinical Summary" value={data.finalImpression.clinicalSummary} onChange={(v) => onUpdateField('finalImpression.clinicalSummary', v)} placeholder="Brief narrative of encounter and findings" rows={4} />
        <SelectField label="Condition at Discharge" value={data.finalImpression.conditionAtDischarge} onChange={(v) => onUpdateField('finalImpression.conditionAtDischarge', v)} options={['Good', 'Stable', 'Fair', 'Improved', 'Unchanged', 'Guarded']} />
        <SelectField label="E&M / MDM Level" value={data.finalImpression.mdmLevel} onChange={(v) => onUpdateField('finalImpression.mdmLevel', v)} options={['99281', '99282', '99283', '99284', '99285']} />
      </Section>

      <Section title="Workup Performed" icon="🔬">
        <TextField label="Key Lab Results" value={data.workupPerformed.labResults} onChange={(v) => onUpdateField('workupPerformed.labResults', v)} rows={3} />
        <TextField label="Imaging Results" value={data.workupPerformed.imagingResults} onChange={(v) => onUpdateField('workupPerformed.imagingResults', v)} rows={3} />
        <TextField label="Procedures" value={data.workupPerformed.procedures} onChange={(v) => onUpdateField('workupPerformed.procedures', v)} rows={2} />
        <TextField label="Consults / Referrals" value={data.workupPerformed.consults} onChange={(v) => onUpdateField('workupPerformed.consults', v)} rows={2} />
      </Section>

      <Section title="Treatment Provided in ED" icon="💉">
        <TextField label="Medications Given in ED" value={data.treatmentProvided.medicationsGivenInED} onChange={(v) => onUpdateField('treatmentProvided.medicationsGivenInED', v)} rows={3} />
        <TextField label="IV Fluids" value={data.treatmentProvided.ivFluids} onChange={(v) => onUpdateField('treatmentProvided.ivFluids', v)} />
        <SelectField label="Oxygen Therapy" value={data.treatmentProvided.oxygenTherapy} onChange={(v) => onUpdateField('treatmentProvided.oxygenTherapy', v)} options={['None — Room air throughout', 'NC 2 L/min', 'Venti-mask', 'HFNC', 'BiPAP', 'Mechanical ventilation']} />
        <TextField label="Response to Treatment" value={data.treatmentProvided.responseToTreatment} onChange={(v) => onUpdateField('treatmentProvided.responseToTreatment', v)} rows={2} />
      </Section>

      <Section title="Medications at Discharge" icon="💊" action={
        <button onClick={() => onAddRow('dischargeMedications')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: S.teal, color: '#050f1e', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          <Plus style={{ width: 12, height: 12 }} /> Add
        </button>
      }>
        {data.dischargeMedications.length === 0 ? (
          <p style={{ fontSize: 12, color: S.txt4 }}>No medications added yet</p>
        ) : data.dischargeMedications.map((med, idx) => (
          <div key={idx} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${S.border}`, background: S.bg, position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => onRemoveRow('dischargeMedications', idx)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}>
              <Trash2 style={{ width: 12, height: 12 }} />
            </button>
            <TextField label="Medication Name" value={med.name} onChange={(v) => onArrayUpdate('dischargeMedications', idx, 'name', v)} placeholder="Generic name" />
            <TextField label="Dose" value={med.dose} onChange={(v) => onArrayUpdate('dischargeMedications', idx, 'dose', v)} />
            <SelectField label="Route" value={med.route} onChange={(v) => onArrayUpdate('dischargeMedications', idx, 'route', v)} options={['By mouth (PO)', 'IV', 'IM', 'Topical', 'Inhaled', 'Under the tongue (SL)', 'Nasal', 'Eye drops']} />
            <TextField label="Frequency" value={med.frequency} onChange={(v) => onArrayUpdate('dischargeMedications', idx, 'frequency', v)} />
            <TextField label="Purpose (patient-facing)" value={med.purpose} onChange={(v) => onArrayUpdate('dischargeMedications', idx, 'purpose', v)} />
          </div>
        ))}
      </Section>

      <Section title="Follow-Up Plan" icon="📅" action={
        <button onClick={() => onAddRow('followUpPlan')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: S.teal, color: '#050f1e', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          <Plus style={{ width: 12, height: 12 }} /> Add
        </button>
      }>
        {data.followUpPlan.length === 0 ? (
          <p style={{ fontSize: 12, color: S.txt4 }}>No follow-ups scheduled yet</p>
        ) : data.followUpPlan.map((fu, idx) => (
          <div key={idx} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${S.border}`, background: S.bg, position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => onRemoveRow('followUpPlan', idx)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}>
              <Trash2 style={{ width: 12, height: 12 }} />
            </button>
            <SelectField label="Provider Type" value={fu.providerType} onChange={(v) => onArrayUpdate('followUpPlan', idx, 'providerType', v)} options={['Primary Care Physician', 'Cardiologist', 'Pulmonologist', 'ED Return PRN']} />
            <TextField label="Provider Name" value={fu.providerName} onChange={(v) => onArrayUpdate('followUpPlan', idx, 'providerName', v)} />
            <SelectField label="Timeframe" value={fu.timeframe} onChange={(v) => onArrayUpdate('followUpPlan', idx, 'timeframe', v)} options={['24–48 hours', '72 hours', '1 week', '2 weeks', '4–6 weeks', 'PRN']} />
            <TextField label="Reason" value={fu.reason} onChange={(v) => onArrayUpdate('followUpPlan', idx, 'reason', v)} />
            <TextField label="Phone" value={fu.phone} onChange={(v) => onArrayUpdate('followUpPlan', idx, 'phone', v)} />
          </div>
        ))}
      </Section>

      <Section title="Provider Attestation & Signature" icon="✍️">
        <TextField label="Attending Physician" value={data.attendingPhysician} onChange={(v) => onUpdateField('attendingPhysician', v)} placeholder="Full name, MD / DO / NP / PA" />
        <TextField label="NPI" value={data.npi} onChange={(v) => onUpdateField('npi', v)} placeholder="10-digit NPI" />
        <TextField label="Resident / APP" value={data.residentPhysician} onChange={(v) => onUpdateField('residentPhysician', v)} placeholder="Co-signer if applicable" />
        <TextField label="Attestation Statement" value={data.attestation} onChange={(v) => onUpdateField('attestation', v)} rows={3} />
      </Section>
    </div>
  );
}