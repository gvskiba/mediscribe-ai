import React from "react";

export default function DemoTab({ demo, setDemo, parseText, setParseText, parsing, onSmartParse }) {
  return (
    <div>
      <div className="npi-sec-title">👤 Patient Demographics</div>
      <div className="npi-sec-sub">All fields optional — enter what is available</div>

      <div className="npi-parse-box">
        <div className="npi-parse-title">✨ Smart Parse — powered by AI</div>
        <div className="npi-parse-sub">Paste a referral note or type freeform — AI will extract patient data automatically</div>
        <textarea className="npi-textarea" value={parseText} onChange={e => setParseText(e.target.value)} placeholder='e.g. "62yo male presenting with chest pain 2h, PMHx: HTN, T2DM. Meds: metoprolol 50mg. BP 158/94, HR 92"' style={{ minHeight: 60 }} />
        <button className="npi-parse-btn" onClick={onSmartParse} disabled={parsing}>{parsing ? '⏳ Parsing...' : '⚡ Auto-Extract Patient Data'}</button>
      </div>

      <div className="npi-grid-3">
        <div className="npi-field"><div className="npi-label">First Name <span className="opt">(optional)</span></div><input className="npi-input" value={demo.firstName} onChange={e => setDemo(p => ({ ...p, firstName: e.target.value }))} placeholder="Given name" /></div>
        <div className="npi-field"><div className="npi-label">Last Name <span className="opt">(optional)</span></div><input className="npi-input" value={demo.lastName} onChange={e => setDemo(p => ({ ...p, lastName: e.target.value }))} placeholder="Family name" /></div>
        <div className="npi-field"><div className="npi-label">Preferred Name <span className="opt">(optional)</span></div><input className="npi-input" placeholder="Goes by..." /></div>
      </div>
      <div className="npi-grid-auto">
        <div className="npi-field"><div className="npi-label">Date of Birth</div><input className="npi-input" type="date" value={demo.dob} onChange={e => { const val = e.target.value; if (val) { const d = new Date(val), now = new Date(); let a = now.getFullYear() - d.getFullYear(); if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--; setDemo(p => ({ ...p, dob: val, age: String(a) })); } else { setDemo(p => ({ ...p, dob: val })); } }} /></div>
        <div className="npi-field"><div className="npi-label">Age</div><input className="npi-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} value={demo.age} onChange={e => setDemo(p => ({ ...p, age: e.target.value }))} placeholder="yrs" /></div>
        <div className="npi-field"><div className="npi-label">Sex</div>
          <select className="npi-select" value={demo.sex} onChange={e => setDemo(p => ({ ...p, sex: e.target.value }))}>
            <option value="">— Select —</option>
            <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
          </select>
        </div>
        <div className="npi-field"><div className="npi-label">MRN / Patient ID</div><input className="npi-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} value={demo.mrn} onChange={e => setDemo(p => ({ ...p, mrn: e.target.value }))} placeholder="00-000-000" /></div>
        <div className="npi-field"><div className="npi-label">Insurance / Payer</div><input className="npi-input" value={demo.insurance} onChange={e => setDemo(p => ({ ...p, insurance: e.target.value }))} placeholder="e.g. Medicare" /></div>
      </div>
      <div className="npi-hdiv" />
      <div className="npi-grid-3">
        <div className="npi-field"><div className="npi-label">Phone</div><input className="npi-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} value={demo.phone} onChange={e => setDemo(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (000) 000-0000" /></div>
        <div className="npi-field"><div className="npi-label">Email</div><input className="npi-input" type="email" value={demo.email} onChange={e => setDemo(p => ({ ...p, email: e.target.value }))} placeholder="patient@email.com" /></div>
        <div className="npi-field"><div className="npi-label">Emergency Contact</div><input className="npi-input" value={demo.emerg} onChange={e => setDemo(p => ({ ...p, emerg: e.target.value }))} placeholder="Name & relationship" /></div>
      </div>
      <div className="npi-grid-3">
        <div className="npi-field"><div className="npi-label">Height</div><input className="npi-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} value={demo.height} onChange={e => setDemo(p => ({ ...p, height: e.target.value }))} placeholder="cm or ft/in" /></div>
        <div className="npi-field"><div className="npi-label">Weight</div><input className="npi-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} value={demo.weight} onChange={e => setDemo(p => ({ ...p, weight: e.target.value }))} placeholder="kg or lbs" /></div>
        <div className="npi-field"><div className="npi-label">Language / Interpreter</div><input className="npi-input" value={demo.lang} onChange={e => setDemo(p => ({ ...p, lang: e.target.value }))} placeholder="Language spoken" /></div>
      </div>
      <div className="npi-field"><div className="npi-label">Additional Notes <span className="opt">(optional)</span></div><textarea className="npi-textarea" value={demo.notes} onChange={e => setDemo(p => ({ ...p, notes: e.target.value }))} placeholder="Any other relevant demographic information..." /></div>
    </div>
  );
}