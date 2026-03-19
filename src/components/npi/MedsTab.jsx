import React, { useState } from "react";
import { PMH_SYSTEMS } from "./npiData";

export default function MedsTab({ medications, setMedications, allergies, setAllergies, pmhSelected, setPmhSelected, pmhExtra, setPmhExtra, surgHx, setSurgHx, famHx, setFamHx, socHx, setSocHx, pmhExpanded, setPmhExpanded }) {
  const [medInput, setMedInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  const addMed = (name) => { if (name && !medications.includes(name)) setMedications(p => [...p, name]); };
  const removeMed = (i) => setMedications(p => p.filter((_, idx) => idx !== i));
  const handleMedKey = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = medInput.replace(/,/g, '').trim(); if (v) { addMed(v); setMedInput(''); } } };

  const addAllergy = (name) => { if (name && !allergies.includes(name)) setAllergies(p => [...p, name]); };
  const removeAllergy = (i) => setAllergies(p => p.filter((_, idx) => idx !== i));
  const handleAllergyKey = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = allergyInput.replace(/,/g, '').trim(); if (v) { addAllergy(v); setAllergyInput(''); } } };

  const togglePMH = (name) => setPmhSelected(prev => ({ ...prev, [name]: ((prev[name] || 0) + 1) % 3 }));
  const togglePmhSystem = (id) => setPmhExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const getPmhSystemCount = (conditions) => conditions.filter(c => (pmhSelected[c] || 0) > 0).length;

  return (
    <div>
      <div className="npi-sec-title">💊 Medications & Medical History</div>
      <div className="npi-sec-sub">All optional — add medications as tags, tap conditions to mark past medical history</div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>💊 Current Medications</div>
      <div className="npi-hint">Type a medication name and press <strong>Enter</strong> or <strong>comma</strong> to add</div>
      <div className="npi-med-tags" onClick={() => document.getElementById('npi-med-input').focus()}>
        {medications.map((m, i) => (
          <div key={i} className="npi-med-tag">{m}<span className="npi-med-tag-x" onClick={() => removeMed(i)}>×</span></div>
        ))}
        <input id="npi-med-input" className="npi-med-tag-input" value={medInput} onChange={e => setMedInput(e.target.value)} onKeyDown={handleMedKey} placeholder="Type medication + Enter..." />
      </div>
      <div className="npi-med-hint">
        Common: {['Metoprolol 50mg', 'Aspirin 81mg', 'Atorvastatin 40mg', 'Metformin 1g', 'Lisinopril 10mg', 'Amlodipine 5mg', 'Furosemide 40mg'].map(m => (
          <span key={m} className="npi-quick-med" onClick={() => addMed(m)}>{m.split(' ')[0]}</span>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', margin: '12px 0 5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Allergies & Adverse Reactions</div>
      <div className="npi-med-tags" style={{ borderColor: 'rgba(255,107,107,.3)' }} onClick={() => document.getElementById('npi-allergy-input').focus()}>
        {allergies.map((a, i) => (
          <div key={i} className="npi-med-tag npi-allergy-tag">{a}<span className="npi-med-tag-x" onClick={() => removeAllergy(i)}>×</span></div>
        ))}
        <input id="npi-allergy-input" className="npi-med-tag-input" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={handleAllergyKey} placeholder="Drug/substance + Enter..." />
      </div>

      <div className="npi-hdiv" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>🏥 Past Medical History</span>
        <span style={{ fontSize: 10, color: 'var(--txt3)' }}>— organised by system</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          <button onClick={() => setPmhExpanded(PMH_SYSTEMS.reduce((a, s) => ({ ...a, [s.id]: true }), {}))} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt3)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Expand All</button>
          <button onClick={() => setPmhExpanded({})} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt3)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Collapse All</button>
        </div>
      </div>
      <div className="npi-hint">Tap a condition once to mark as <strong style={{ color: 'var(--blue)' }}>present</strong> · tap again to mark as <strong style={{ color: 'var(--teal)' }}>active/significant</strong> · tap again to clear</div>
      <div className="npi-pmh-systems">
        {PMH_SYSTEMS.map(sys => {
          const count = getPmhSystemCount(sys.conditions);
          const isOpen = pmhExpanded[sys.id] ?? false;
          return (
            <div key={sys.id} className={`npi-pmh-sys${count > 0 ? ' has-sel' : ''}`}>
              <div className="npi-pmh-sys-hdr" onClick={() => togglePmhSystem(sys.id)}>
                <span className="npi-pmh-sys-ico">{sys.icon}</span>
                <span className="npi-pmh-sys-name">{sys.name}</span>
                <span className={`npi-pmh-sys-count${count === 0 ? ' zero' : ''}`}>{count > 0 ? count : sys.conditions.length}</span>
                <span className={`npi-pmh-sys-chevron${isOpen ? ' open' : ''}`}>▶</span>
              </div>
              <div className={`npi-pmh-sys-body${isOpen ? ' open' : ''}`}>
                {sys.conditions.map(cond => {
                  const state = pmhSelected[cond] || 0;
                  return (
                    <div key={cond} className={`npi-pmh-chip${state > 0 ? ' sel' : ''}${state === 2 ? ' active-pmh' : ''}`} onClick={() => togglePMH(cond)}>
                      {state === 2 ? '★ ' : state === 1 ? '✓ ' : ''}{cond}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="npi-field" style={{ marginTop: 8 }}>
        <div className="npi-label">Additional Medical History <span className="opt">(free text)</span></div>
        <textarea className="npi-textarea" value={pmhExtra} onChange={e => setPmhExtra(e.target.value)} placeholder="Other conditions, surgeries, significant history..." />
      </div>
      <div className="npi-hdiv" />
      <div className="npi-grid-3">
        <div className="npi-field"><div className="npi-label">Surgical History</div><textarea className="npi-textarea" style={{ minHeight: 55 }} value={surgHx} onChange={e => setSurgHx(e.target.value)} placeholder="Previous operations..." /></div>
        <div className="npi-field"><div className="npi-label">Family History</div><textarea className="npi-textarea" style={{ minHeight: 55 }} value={famHx} onChange={e => setFamHx(e.target.value)} placeholder="Relevant family history..." /></div>
        <div className="npi-field"><div className="npi-label">Social History</div><textarea className="npi-textarea" style={{ minHeight: 55 }} value={socHx} onChange={e => setSocHx(e.target.value)} placeholder="Smoking, alcohol, drugs, occupation..." /></div>
      </div>
    </div>
  );
}