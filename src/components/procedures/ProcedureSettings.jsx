import React, { useState, useEffect } from 'react';

const T = {
  bg:'#050f1e',panel:'#081628',card:'#0b1e36',up:'#0e2544',
  border:'#1a3555',borderHi:'#2a4f7a',
  blue:'#3b9eff',teal:'#00e5c0',gold:'#f5c842',coral:'#ff6b6b',orange:'#ff9f43',
  txt:'#e8f0fe',txt2:'#8aaccc',txt3:'#4a6a8a',txt4:'#2e4a6a',
};

const PREF_KEY = 'notrya_proc_prefs';

export const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
};

const savePrefs = (prefs) => {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
};

const CSS = `
.ps-wrap *,.ps-wrap *::before,.ps-wrap *::after{box-sizing:border-box}
.ps-wrap{font-family:'DM Sans',sans-serif;font-size:13px;color:${T.txt}}
.ps-overlay{position:fixed;inset:0;background:rgba(5,15,30,.88);z-index:800;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.ps-modal{background:${T.panel};border:1px solid ${T.border};border-radius:16px;width:540px;max-height:82vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.6);display:flex;flex-direction:column}
.ps-modal::-webkit-scrollbar{width:4px}.ps-modal::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
.ps-hdr{padding:16px 20px 12px;border-bottom:1px solid ${T.border};display:flex;align-items:center;gap:10px;flex-shrink:0}
.ps-body{padding:18px 20px;display:flex;flex-direction:column;gap:18px}
.ps-section{display:flex;flex-direction:column;gap:10px}
.ps-section-title{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt3};text-transform:uppercase;letter-spacing:.08em;font-weight:600;padding-bottom:6px;border-bottom:1px solid ${T.border}}
.ps-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ps-field{display:flex;flex-direction:column;gap:4px}
.ps-label{font-size:9px;color:${T.txt3};text-transform:uppercase;letter-spacing:.06em;font-weight:500;font-family:'JetBrains Mono',monospace}
.ps-input,.ps-select{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:7px 10px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:12px;outline:none;width:100%;transition:border-color .15s}
.ps-input:focus,.ps-select:focus{border-color:${T.blue}}
.ps-select option{background:${T.card}}
.ps-input::placeholder{color:${T.txt4}}
.ps-chip-row{display:flex;flex-wrap:wrap;gap:5px}
.ps-chip{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:18px;font-size:11px;cursor:pointer;border:1px solid ${T.border};background:${T.up};color:${T.txt2};transition:all .15s;user-select:none}
.ps-chip:hover{border-color:${T.borderHi};color:${T.txt}}
.ps-chip.sel{background:rgba(59,158,255,.15);border-color:${T.blue};color:${T.blue}}
.ps-btn{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:5px 14px;font-size:11px;color:${T.txt2};cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all .15s;font-family:'DM Sans',sans-serif}
.ps-btn:hover{border-color:${T.borderHi};color:${T.txt}}
.ps-btn-primary{background:${T.teal};color:${T.bg};border:none;border-radius:6px;padding:6px 18px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif}
.ps-btn-primary:hover{filter:brightness(1.12)}
.ps-saved-badge{font-size:10px;color:${T.teal};font-family:'JetBrains Mono',monospace;opacity:0;transition:opacity .4s}
.ps-saved-badge.show{opacity:1}
`;

const ANESTHETICS = ['Lidocaine 1% plain','Lidocaine 1% w/ epi','Lidocaine 2% plain','Lidocaine 2% w/ epi','Bupivacaine 0.25%','Bupivacaine 0.5%','LET gel'];
const SUTURE_MATERIALS = ['3-0 Nylon','4-0 Nylon','5-0 Nylon','6-0 Nylon','3-0 Vicryl','3-0 Chromic','4-0 Monocryl'];
const CLOSURE_METHODS = ['Simple interrupted','Running','Horizontal mattress','Vertical mattress','Deep + interrupted','Dermabond','Staples'];
const DRESSINGS = ['Dry sterile','Bacitracin + gauze','Petrolatum','Tegaderm','None (face)'];
const TETANUS_OPTS = ['Up to date','Tdap given','TIG given','Declined'];
const LOCATIONS = ['Bedside','Procedure room','OR','Clinic','ER','ICU'];

export default function ProcedureSettings({ onClose }) {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [saved, setSaved] = useState(false);

  const set = (key, val) => setPrefs(p => ({ ...p, [key]: val }));

  const toggleChip = (key, val) => {
    setPrefs(p => ({ ...p, [key]: p[key] === val ? '' : val }));
  };

  const handleSave = () => {
    savePrefs(prefs);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const Field = ({ label, fieldKey, options }) => (
    <div className="ps-field">
      <label className="ps-label">{label}</label>
      <select className="ps-select" value={prefs[fieldKey] || ''} onChange={e => set(fieldKey, e.target.value)}>
        <option value="">No default</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const ChipRow = ({ label, fieldKey, options }) => (
    <div className="ps-field" style={{ gridColumn: '1/-1' }}>
      <label className="ps-label">{label}</label>
      <div className="ps-chip-row">
        {options.map(o => (
          <div key={o} className={`ps-chip${prefs[fieldKey] === o ? ' sel' : ''}`} onClick={() => toggleChip(fieldKey, o)}>{o}</div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="ps-wrap">
        <div className="ps-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
          <div className="ps-modal">
            <div className="ps-hdr">
              <span style={{ fontSize: 20 }}>⚙️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600 }}>Procedure Preferences</div>
                <div style={{ fontSize: 11, color: T.txt3 }}>Defaults auto-populate new procedure notes</div>
              </div>
              <button className="ps-btn" onClick={onClose}>✕</button>
            </div>

            <div className="ps-body">

              {/* Physician Info */}
              <div className="ps-section">
                <div className="ps-section-title">👤 Physician Info</div>
                <div className="ps-grid">
                  <div className="ps-field">
                    <label className="ps-label">Default Physician Name</label>
                    <input className="ps-input" placeholder="Dr. Smith, MD" value={prefs.physician || ''} onChange={e => set('physician', e.target.value)} />
                  </div>
                  <Field label="Default Location" fieldKey="location" options={LOCATIONS} />
                </div>
              </div>

              {/* Wound & Closure */}
              <div className="ps-section">
                <div className="ps-section-title">🩹 Wound & Closure Defaults</div>
                <div className="ps-grid">
                  <Field label="Default Anesthetic" fieldKey="anesthetic" options={ANESTHETICS} />
                  <Field label="Default Suture Material" fieldKey="suture_material" options={SUTURE_MATERIALS} />
                  <Field label="Default Closure Method" fieldKey="closure_method" options={CLOSURE_METHODS} />
                  <Field label="Default Dressing" fieldKey="dressing" options={DRESSINGS} />
                  <Field label="Default Tetanus Status" fieldKey="tetanus" options={TETANUS_OPTS} />
                </div>
              </div>

              {/* Post-procedure */}
              <div className="ps-section">
                <div className="ps-section-title">✅ Post-Procedure Defaults</div>
                <div className="ps-grid">
                  <div className="ps-field" style={{ gridColumn: '1/-1' }}>
                    <label className="ps-label">Default Allergies</label>
                    <input className="ps-input" placeholder="NKDA" value={prefs.allergies || ''} onChange={e => set('allergies', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Favorite Procedures */}
              <div className="ps-section">
                <div className="ps-section-title">⭐ Note Style</div>
                <div className="ps-grid">
                  <div className="ps-field">
                    <label className="ps-label">Note Verbosity</label>
                    <div className="ps-chip-row">
                      {['Concise','Standard','Detailed'].map(v => (
                        <div key={v} className={`ps-chip${prefs.verbosity === v ? ' sel' : ''}`} onClick={() => toggleChip('verbosity', v)}>{v}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <span className={`ps-saved-badge${saved ? ' show' : ''}`}>✓ Saved!</span>
                <button className="ps-btn" onClick={onClose}>Cancel</button>
                <button className="ps-btn-primary" onClick={handleSave}>💾 Save Preferences</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}