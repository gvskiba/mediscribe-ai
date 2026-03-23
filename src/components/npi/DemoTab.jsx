import React from 'react';

const S = {
  bg: '#050f1e', panel: '#081628', up: '#0e2544',
  border: '#1a3555', teal: '#00e5c0',
  txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
};

const input = {
  width: '100%', background: S.up, border: `1px solid ${S.border}`,
  borderRadius: 6, padding: '7px 10px', color: S.txt, fontSize: 12,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
};

const label = {
  fontSize: 10, color: S.txt3, textTransform: 'uppercase',
  letterSpacing: '0.05em', fontWeight: 600, marginBottom: 5, display: 'block',
};

const opt = { fontWeight: 400, color: S.txt4, textTransform: 'none', letterSpacing: 0 };

const card = {
  background: S.panel, border: `1px solid ${S.border}`,
  borderRadius: 12, padding: '16px 18px',
};

const cardHeader = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
};

const grid3 = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
};

const field = { display: 'flex', flexDirection: 'column' };

export default function DemoTab({ demo, setDemo, parseText, setParseText, parsing, onSmartParse }) {
  const handleChange = (f, v) => setDemo(prev => ({ ...prev, [f]: v }));

  const handleDob = (value) => {
    handleChange('dob', value);
    if (value) {
      const age = Math.floor((new Date() - new Date(value)) / 31557600000);
      handleChange('age', isNaN(age) ? '' : String(age));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>👤</span>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: S.txt }}>Patient Demographics</div>
          <div style={{ fontSize: 12, color: S.txt3, marginTop: 1 }}>All fields optional — enter what is available</div>
        </div>
      </div>

      {/* Smart Parse */}
      <div style={{ background: 'rgba(0,229,192,0.04)', border: '1px solid rgba(0,229,192,0.2)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: S.teal, marginBottom: 3 }}>✨ Smart Parse — powered by AI</div>
        <div style={{ fontSize: 11, color: S.txt3, marginBottom: 10 }}>Paste a referral note or type freeform — AI will extract patient data automatically</div>
        <textarea
          style={{ ...input, minHeight: 60, resize: 'vertical', width: '100%' }}
          value={parseText}
          onChange={e => setParseText(e.target.value)}
          placeholder='e.g. "62yo male presenting with chest pain 2h, PMHx: HTN, T2DM. Meds: metoprolol 50mg. BP 158/94, HR 92"'
        />
        <button
          onClick={onSmartParse}
          disabled={parsing}
          style={{
            marginTop: 10, background: 'rgba(0,229,192,0.12)', color: S.teal,
            border: '1px solid rgba(0,229,192,0.3)', borderRadius: 6, padding: '6px 16px',
            fontSize: 12, fontWeight: 600, cursor: parsing ? 'wait' : 'pointer',
            opacity: parsing ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {parsing ? '⏳ Extracting…' : '⚡ Auto-Extract Patient Data'}
        </button>
      </div>

      {/* Identity */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={{ fontSize: 16 }}>🪪</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Identity</div>
        </div>

        <div style={{ ...grid3, marginBottom: 12 }}>
          <div style={field}>
            <label style={label}>First Name <span style={opt}>(optional)</span></label>
            <input style={input} placeholder="Given name" value={demo.firstName} onChange={e => handleChange('firstName', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Last Name <span style={opt}>(optional)</span></label>
            <input style={input} placeholder="Family name" value={demo.lastName} onChange={e => handleChange('lastName', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Preferred Name <span style={opt}>(optional)</span></label>
            <input style={input} placeholder="Goes by…" value={demo.pronouns || ''} onChange={e => handleChange('pronouns', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.8fr 1fr 1fr', gap: 12 }}>
          <div style={field}>
            <label style={label}>Date of Birth</label>
            <input type="date" style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} value={demo.dob} onChange={e => handleDob(e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Age</label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace", color: S.txt3 }} placeholder="yrs" value={demo.age} readOnly />
          </div>
          <div style={field}>
            <label style={label}>Sex</label>
            <select style={{ ...input, cursor: 'pointer' }} value={demo.sex} onChange={e => handleChange('sex', e.target.value)}>
              <option value="">— Select —</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div style={field}>
            <label style={label}>MRN / Patient ID</label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} placeholder="00-000-000" value={demo.mrn} onChange={e => handleChange('mrn', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Insurance / Payer</label>
            <input style={input} placeholder="e.g. Medicare" value={demo.insurance} onChange={e => handleChange('insurance', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={{ fontSize: 16 }}>🏥</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Insurance</div>
        </div>
        <div style={grid3}>
          <div style={field}>
            <label style={label}>Member ID <span style={opt}>(optional)</span></label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} placeholder="Policy number" value={demo.insuranceId} onChange={e => handleChange('insuranceId', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Group Number <span style={opt}>(optional)</span></label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} placeholder="Group #" value={demo.groupNumber || ''} onChange={e => handleChange('groupNumber', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Authorization <span style={opt}>(optional)</span></label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} placeholder="Auth #" value={demo.authNumber || ''} onChange={e => handleChange('authNumber', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={{ fontSize: 16 }}>📞</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Contact Information</div>
        </div>
        <div style={grid3}>
          <div style={field}>
            <label style={label}>Phone</label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} placeholder="+1 (000) 000-0000" value={demo.phone} onChange={e => handleChange('phone', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Email</label>
            <input type="email" style={input} placeholder="patient@email.com" value={demo.email} onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Emergency Contact</label>
            <input style={input} placeholder="Name & relationship" value={demo.emerg} onChange={e => handleChange('emerg', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Biometrics */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={{ fontSize: 16 }}>⚖️</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Biometrics</div>
        </div>
        <div style={grid3}>
          <div style={field}>
            <label style={label}>Height</label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} placeholder="e.g. 170 cm or 5'8&quot;" value={demo.height} onChange={e => handleChange('height', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Weight</label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono', monospace" }} placeholder="e.g. 75 kg" value={demo.weight} onChange={e => handleChange('weight', e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Primary Language <span style={opt}>(optional)</span></label>
            <input style={input} placeholder="e.g. English" value={demo.lang} onChange={e => handleChange('lang', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={{ fontSize: 16 }}>📝</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>
            Additional Notes <span style={{ fontSize: 11, color: S.txt4, fontWeight: 400 }}>(optional)</span>
          </div>
        </div>
        <textarea
          style={{ ...input, minHeight: 70, resize: 'vertical', width: '100%' }}
          placeholder="Any additional demographic or intake notes…"
          value={demo.notes}
          onChange={e => handleChange('notes', e.target.value)}
        />
      </div>

    </div>
  );
}