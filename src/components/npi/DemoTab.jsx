import React from 'react';

export default function DemoTab({ demo, setDemo, parseText, setParseText, parsing, onSmartParse }) {
  const handleChange = (field, value) => setDemo(prev => ({ ...prev, [field]: value }));

  // Auto-calculate age from DOB
  const handleDob = (value) => {
    handleChange('dob', value);
    if (value) {
      const age = Math.floor((new Date() - new Date(value)) / 31557600000);
      handleChange('age', isNaN(age) ? '' : String(age));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>👤</span>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: 'var(--txt)' }}>Patient Demographics</div>
          <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 1 }}>All fields optional — enter what is available</div>
        </div>
      </div>

      {/* Smart Parse */}
      <div style={{ background: 'rgba(0,229,192,0.04)', border: '1px solid rgba(0,229,192,0.2)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)', marginBottom: 3 }}>✨ Smart Parse — powered by AI</div>
        <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 10 }}>Paste a referral note or type freeform — AI will extract patient data automatically</div>
        <textarea
          className="npi-textarea"
          style={{ background: 'var(--bg-up)', border: '1px solid var(--border)', minHeight: 60 }}
          value={parseText}
          onChange={e => setParseText(e.target.value)}
          placeholder='e.g. "62yo male presenting with chest pain 2h, PMHx: HTN, T2DM. Meds: metoprolol 50mg. BP 158/94, HR 92"'
        />
        <button
          onClick={onSmartParse}
          disabled={parsing}
          style={{
            marginTop: 10, background: 'rgba(0,229,192,0.12)', color: 'var(--teal)',
            border: '1px solid rgba(0,229,192,0.3)', borderRadius: 6, padding: '6px 16px',
            fontSize: 12, fontWeight: 600, cursor: parsing ? 'wait' : 'pointer', opacity: parsing ? 0.6 : 1
          }}
        >
          {parsing ? '⏳ Extracting…' : '⚡ Auto-Extract Patient Data'}
        </button>
      </div>

      {/* Identity */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🪪</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>Identity</div>
        </div>

        <div className="npi-grid-3" style={{ marginBottom: 12 }}>
          <div className="npi-field">
            <label className="npi-label">First Name <span className="opt">(optional)</span></label>
            <input className="npi-input" placeholder="Given name" value={demo.firstName} onChange={e => handleChange('firstName', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Last Name <span className="opt">(optional)</span></label>
            <input className="npi-input" placeholder="Family name" value={demo.lastName} onChange={e => handleChange('lastName', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Preferred Name <span className="opt">(optional)</span></label>
            <input className="npi-input" placeholder="Goes by…" value={demo.pronouns || ''} onChange={e => handleChange('pronouns', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 0.8fr 1fr 1fr', gap: 12 }}>
          <div className="npi-field">
            <label className="npi-label">Date of Birth</label>
            <input type="date" className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} value={demo.dob} onChange={e => handleDob(e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Age</label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--txt3)' }} placeholder="yrs" value={demo.age} readOnly />
          </div>
          <div className="npi-field">
            <label className="npi-label">Sex</label>
            <select className="npi-select" value={demo.sex} onChange={e => handleChange('sex', e.target.value)}>
              <option value="">— Select —</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="npi-field">
            <label className="npi-label">MRN / Patient ID</label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="00-000-000" value={demo.mrn} onChange={e => handleChange('mrn', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Insurance / Payer</label>
            <input className="npi-input" placeholder="e.g. Medicare" value={demo.insurance} onChange={e => handleChange('insurance', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🏥</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>Insurance</div>
        </div>
        <div className="npi-grid-3">
          <div className="npi-field">
            <label className="npi-label">Insurance ID / Member ID <span className="opt">(optional)</span></label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="Policy number" value={demo.insuranceId} onChange={e => handleChange('insuranceId', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Group Number <span className="opt">(optional)</span></label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="Group #" value={demo.groupNumber || ''} onChange={e => handleChange('groupNumber', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Authorization <span className="opt">(optional)</span></label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="Auth #" value={demo.authNumber || ''} onChange={e => handleChange('authNumber', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📞</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>Contact Information</div>
        </div>
        <div className="npi-grid-3">
          <div className="npi-field">
            <label className="npi-label">Phone</label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="+1 (000) 000-0000" value={demo.phone} onChange={e => handleChange('phone', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Email</label>
            <input type="email" className="npi-input" placeholder="patient@email.com" value={demo.email} onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Emergency Contact</label>
            <input className="npi-input" placeholder="Name & relationship" value={demo.emerg} onChange={e => handleChange('emerg', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Biometrics */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>⚖️</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>Biometrics</div>
        </div>
        <div className="npi-grid-3">
          <div className="npi-field">
            <label className="npi-label">Height</label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="e.g. 170 cm or 5'8 in" value={demo.height} onChange={e => handleChange('height', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Weight</label>
            <input className="npi-input" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="e.g. 75 kg" value={demo.weight} onChange={e => handleChange('weight', e.target.value)} />
          </div>
          <div className="npi-field">
            <label className="npi-label">Primary Language <span className="opt">(optional)</span></label>
            <input className="npi-input" placeholder="e.g. English" value={demo.lang} onChange={e => handleChange('lang', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>Additional Notes <span style={{ fontSize: 11, color: 'var(--txt4)', fontWeight: 400 }}>(optional)</span></div>
        </div>
        <textarea
          className="npi-textarea"
          placeholder="Any additional demographic or intake notes…"
          value={demo.notes}
          onChange={e => handleChange('notes', e.target.value)}
          style={{ minHeight: 70 }}
        />
      </div>

    </div>
  );
}