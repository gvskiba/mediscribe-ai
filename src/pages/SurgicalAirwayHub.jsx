import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const T = {
  bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
  bd: '#1a3555', bhi: '#2a4f7a', blue: '#3b9eff', teal: '#00e5c0',
  gold: '#f5c842', coral: '#ff6b6b', orange: '#ff9f43', purple: '#9b6dff',
  txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
};

const glass = {
  background: 'rgba(8,22,40,0.6)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(42,79,122,0.3)',
  borderRadius: 12,
};

const SECTIONS = [
  { id: 'indications', icon: '🚨', label: 'Indications', sub: 'When to perform surgical airway' },
  { id: 'anatomy', icon: '🦴', label: 'Anatomy', sub: 'Key landmarks and structures' },
  { id: 'cricothyrotomy', icon: '🔪', label: 'Cricothyrotomy', sub: 'Step-by-step technique' },
  { id: 'tracheostomy', icon: '🏥', label: 'Tracheostomy', sub: 'Surgical vs percutaneous' },
  { id: 'complications', icon: '⚠️', label: 'Complications', sub: 'Recognition and management' },
];

const INDICATIONS = {
  absolute: [
    'Complete tracheal transection',
    'Laryngeal crush injury',
    'Severe maxillofacial trauma (airway compromise)',
    'Failed intubation + failed BVM + cannot oxygenate',
    'Epiglottitis with impending airway loss',
  ],
  relative: [
    'Severe oral/pharyngeal bleeding (cannot visualize cords)',
    'Large neck hematoma compressing airway',
    'Angioedema refractory to treatment',
    'Foreign body with complete obstruction',
    'Thermal/chemical burns to airway',
  ],
};

const LANDMARKS = [
  { name: 'Thyroid Cartilage', detail: 'Largest laryngeal cartilage; forms Adams apple. Palpable superior notch (laryngeal prominence).', tip: 'Key starting landmark for location.' },
  { name: 'Cricoid Cartilage', detail: 'Ring-shaped cartilage inferior to thyroid. Most stable cartilage. Complete anterior-posterior ring.', tip: 'Narrowest point of subglottic airway.' },
  { name: 'Cricothyroid Membrane', detail: 'Elastic membrane between thyroid and cricoid. ~9mm wide, 10mm tall in adults. Palpable gap.', tip: 'Incision site for emergency cricothyrotomy.' },
  { name: 'Trachea', detail: 'Cartilage rings inferior to cricoid. More mobile than cricoid. Tracheal bifurcation at T4-T5.', tip: 'Extends to ~6cm below skin in adults.' },
];

const CRICO_STEPS = [
  { step: '1. Positioning', detail: 'Supine, neck extended (if C-spine cleared). Shoulder roll under neck. Head of bed 30° (if stable).' },
  { step: '2. Preparation', detail: 'Sterile prep (betadine/chlorhex). Local anesthetic if time permits (1% lidocaine). Identify thyroid notch and cricoid.' },
  { step: '3. Incision', detail: 'Vertical or horizontal 1–2 cm incision over cricothyroid membrane. Avoid major blood vessels.' },
  { step: '4. Membrane Puncture', detail: 'Scalpel handle or bougie through membrane at inferior border to avoid vocal cords. Syringe withdraw air to confirm entry.' },
  { step: '5. Tube Placement', detail: '6.0–7.5 ETT or surgical airway kit tube. Secure with tape or sutures. Inflate cuff, confirm breath sounds.' },
  { step: '6. Capnography', detail: 'Verify CO₂ on ETCO₂ monitor. CXR to check placement and rule out pneumothorax.' },
];

const COMPLICATIONS = [
  { complication: 'Tracheal stenosis', risk: 'High', onset: 'Weeks–months', management: 'Long-term tube placement risk; convert to tracheostomy >72 hrs.' },
  { complication: 'Subcutaneous emphysema', risk: 'Moderate', onset: 'Minutes', management: 'Usually self-limited; monitor for tension pneumothorax.' },
  { complication: 'Vocal cord injury', risk: 'Moderate', onset: 'Immediate', management: 'Hoarseness; may resolve. Defer conversion to trach if possible.' },
  { complication: 'Thyroid cartilage fracture', risk: 'Low', onset: 'Immediate', management: 'Assess for instability; ENT involvement if unstable.' },
  { complication: 'Hemorrhage', risk: 'Low', onset: 'Immediate', management: 'Pack wound; compress; type & cross; surgical backup.' },
  { complication: 'Tube obstruction', risk: 'Moderate', onset: 'Hours', management: 'Suction; if persists, replace tube or convert to tracheostomy.' },
];

function AnatInline() {
  const [exp, setExp] = useState(null);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {LANDMARKS.map((l, i) => (
        <div
          key={i}
          onClick={() => setExp(exp === i ? null : i)}
          style={{
            ...glass,
            padding: '12px 14px',
            cursor: 'pointer',
            background: exp === i ? 'rgba(59,158,255,0.12)' : glass.background,
            borderColor: exp === i ? 'rgba(59,158,255,0.4)' : glass.border,
          }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.txt, marginBottom: 4 }}>{l.name}</div>
          {exp === i && (
            <>
              <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.6, marginBottom: 8 }}>{l.detail}</div>
              <div style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>💡 {l.tip}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function StepList({ steps, title }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ ...glass, padding: '12px 14px', borderLeft: `3px solid ${T.blue}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 4 }}>{s.step}</div>
          <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.6 }}>{s.detail}</div>
        </div>
      ))}
    </div>
  );
}

function ComplicationTable() {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {COMPLICATIONS.map((c, i) => (
        <div key={i} style={{ ...glass, padding: '12px 14px', borderLeft: `3px solid ${c.risk === 'High' ? T.coral : c.risk === 'Moderate' ? T.orange : T.teal}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.txt }}>{c.complication}</span>
            <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: c.risk === 'High' ? 'rgba(255,107,107,0.15)' : c.risk === 'Moderate' ? 'rgba(255,159,67,0.15)' : 'rgba(0,229,192,0.15)', color: c.risk === 'High' ? T.coral : c.risk === 'Moderate' ? T.orange : T.teal }}>{c.risk}</span>
          </div>
          <div style={{ fontSize: 10, color: T.txt3, marginBottom: 4 }}><strong>Onset:</strong> {c.onset}</div>
          <div style={{ fontSize: 11, color: T.txt2 }}><strong>Mgmt:</strong> {c.management}</div>
        </div>
      ))}
    </div>
  );
}

export default function SurgicalAirwayHub() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('indications');
  const sec = SECTIONS.find(s => s.id === activeSection);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: T.txt }}>
      {/* ── Header ── */}
      <div style={{ background: T.panel, borderBottom: `1px solid ${T.bd}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>🔪 Surgical Airway Hub</div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate('/hub')}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            background: T.up,
            border: `1px solid ${T.bd}`,
            color: T.txt2,
            fontFamily: 'DM Sans',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.teal; e.currentTarget.style.borderColor = 'rgba(0,229,192,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.txt2; e.currentTarget.style.borderColor = T.bd; }}>
          ← Hub
        </button>
      </div>

      {/* ── Navigation & Content ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 180, background: T.panel, borderRight: `1px solid ${T.bd}`, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${activeSection === s.id ? 'rgba(59,158,255,0.4)' : 'transparent'}`,
                background: activeSection === s.id ? 'rgba(59,158,255,0.1)' : 'transparent',
                color: activeSection === s.id ? T.blue : T.txt2,
                fontFamily: 'DM Sans',
                fontSize: 12,
                fontWeight: activeSection === s.id ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .15s',
              }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{s.icon}</div>
              <div>{s.label}</div>
              <div style={{ fontSize: 9, color: activeSection === s.id ? T.txt3 : T.txt4 }}>{s.sub}</div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, color: T.txt, marginBottom: 12 }}>{sec.label}</h2>
            <div style={{ fontSize: 12, color: T.txt3 }}>{sec.sub}</div>
          </div>

          {activeSection === 'indications' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Absolute Indications</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {INDICATIONS.absolute.map((ind, i) => (
                    <div key={i} style={{ ...glass, padding: '10px 12px', borderLeft: `3px solid ${T.coral}` }}>
                      <div style={{ fontSize: 12, color: T.txt }}>{ind}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.orange, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Relative Indications</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {INDICATIONS.relative.map((ind, i) => (
                    <div key={i} style={{ ...glass, padding: '10px 12px', borderLeft: `3px solid ${T.orange}` }}>
                      <div style={{ fontSize: 12, color: T.txt }}>{ind}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'anatomy' && <AnatInline />}

          {activeSection === 'cricothyrotomy' && <StepList steps={CRICO_STEPS} title="Cricothyrotomy Technique" />}

          {activeSection === 'tracheostomy' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ ...glass, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Surgical Tracheostomy</div>
                <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.6 }}>
                  • <strong>Indications:</strong> Prolonged airway support, recurrent aspiration, glottic dysfunction<br/>
                  • <strong>Timing:</strong> Ideal 7–10 days after admission; can be performed acutely if needed<br/>
                  • <strong>Approach:</strong> Cuffed tracheostomy tube (8–10 French), surgical exploration of neck, tube secured with sutures
                </div>
              </div>
              <div style={{ ...glass, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8 }}>Percutaneous Tracheostomy (PDT)</div>
                <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.6 }}>
                  • <strong>Indications:</strong> Elective airway support, similar to surgical but less invasive<br/>
                  • <strong>Contraindications:</strong> Difficult neck anatomy, coagulopathy, active infection, emergency (cricothyrotomy preferred)<br/>
                  • <strong>Advantage:</strong> Can be performed at bedside; lower infection rate vs. open surgery<br/>
                  • <strong>Technique:</strong> Guidewire-over-needle approach; Seldinger technique; requires fluoroscopy or ultrasound
                </div>
              </div>
            </div>
          )}

          {activeSection === 'complications' && <ComplicationTable />}
        </div>
      </div>
    </div>
  );
}