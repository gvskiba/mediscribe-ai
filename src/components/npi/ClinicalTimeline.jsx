import { useState, useEffect } from 'react';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function epochToHHMM(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function elapsedStr(from, to) {
  const f = toMinutes(from), t = toMinutes(to);
  if (f === null || t === null) return null;
  const diff = t - f;
  if (diff < 0 || diff > 720) return null;
  if (diff === 0) return '0m';
  const h = Math.floor(diff / 60), m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── STANDARD EVENTS ──────────────────────────────────────────────────────────
const EVENTS = [
  { id: 'door',        icon: '🚪', label: 'Patient arrival',     subLabel: 'Door time',             auto: true  },
  { id: 'md_eval',     icon: '🩺', label: 'MD evaluation',       subLabel: 'First clinical contact', auto: true  },
  { id: 'treatment',   icon: '💊', label: 'First treatment',     subLabel: 'Medication / procedure', auto: false },
  { id: 'disposition', icon: '📋', label: 'Disposition decided', subLabel: 'Admit / DC / obs',       auto: false },
  { id: 'departed',    icon: '✅', label: 'Patient departed',    subLabel: 'Physical departure',     auto: false },
];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ClinicalTimeline({ arrivalMs, onStateChange }) {
  const [times, setTimes] = useState(() => ({
    door:        epochToHHMM(arrivalMs) || '',
    md_eval:     epochToHHMM(arrivalMs) || '',
    treatment:   '',
    disposition: '',
    departed:    '',
  }));
  const [notes, setNotes] = useState({});
  const [customEvents, setCustomEvents] = useState([]);
  const [customInput, setCustomInput] = useState({ label: '', time: '' });
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    onStateChange?.({ times, notes, customEvents });
  }, [times, notes, customEvents, onStateChange]);

  const setTime = (id, val) => setTimes(prev => ({ ...prev, [id]: val }));
  const setNote = (id, val) => setNotes(prev => ({ ...prev, [id]: val }));

  const allEvents = [
    ...EVENTS,
    ...customEvents.map(e => ({ id: e.id, icon: '📌', label: e.label, subLabel: 'Custom event', auto: false })),
  ];
  const allTimes = { ...times, ...Object.fromEntries(customEvents.map(e => [e.id, e.time])) };

  const completedCount = EVENTS.filter(e => allTimes[e.id]).length;
  const d2md = elapsedStr(allTimes.door, allTimes.md_eval);
  const los  = elapsedStr(allTimes.door, allTimes.departed || allTimes.disposition);

  return (
    <>
      <style>{CSS}</style>
      <div className="ctl-wrap">

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div className="ctl-hdr">
          <div className="ctl-hdr-left">
            <span className="ctl-title">Clinical Timeline</span>
            <span className="ctl-guideline">Timestamps for quality metrics, risk management &amp; medicolegal record</span>
          </div>
          <div className="ctl-hdr-stats">
            {d2md && (
              <div className="ctl-stat">
                <span className="ctl-stat-lbl">Door-to-MD</span>
                <span className="ctl-stat-val">{d2md}</span>
              </div>
            )}
            {los && (
              <div className="ctl-stat">
                <span className="ctl-stat-lbl">LOS (est.)</span>
                <span className="ctl-stat-val">{los}</span>
              </div>
            )}
            <span className="ctl-progress">{completedCount}/{EVENTS.length}</span>
          </div>
        </div>

        {/* ── TIMELINE ─────────────────────────────────────────────────── */}
        <div className="ctl-body">
          <div className="ctl-track">

            {allEvents.map((ev, idx) => {
              const t = allTimes[ev.id];
              const prev = idx > 0 ? allTimes[allEvents[idx - 1].id] : null;
              const elapsed = elapsedStr(prev, t);
              const isSet = !!t;

              return (
                <div key={ev.id} className="ctl-event-group">
                  {idx > 0 && (
                    <div className="ctl-connector">
                      <div className={`ctl-connector-line${prev && isSet ? ' done' : ''}`} />
                      {elapsed && <span className="ctl-elapsed">{elapsed}</span>}
                    </div>
                  )}

                  <div className={`ctl-event${isSet ? ' set' : ''}`}>
                    <div className={`ctl-dot${isSet ? ' set' : ''}${ev.auto ? ' auto' : ''}`}>
                      {isSet ? '✓' : <span style={{ fontSize: 13 }}>{ev.icon}</span>}
                    </div>
                    <div className="ctl-event-body">
                      <div className="ctl-event-labels">
                        <span className="ctl-event-name">{ev.label}</span>
                        <span className="ctl-event-sub">{ev.subLabel}</span>
                        {ev.auto && <span className="ctl-auto-badge">auto</span>}
                      </div>
                      <div className="ctl-event-inputs">
                        <input
                          type="time"
                          className="ctl-time-inp"
                          value={ev.id in times ? times[ev.id] : (customEvents.find(c => c.id === ev.id)?.time || '')}
                          onChange={e => {
                            if (ev.id in times) setTime(ev.id, e.target.value);
                            else setCustomEvents(prev => prev.map(c => c.id === ev.id ? { ...c, time: e.target.value } : c));
                          }}
                        />
                        {isSet && (
                          <input
                            className="ctl-note-inp"
                            placeholder="optional note…"
                            value={notes[ev.id] || ''}
                            onChange={e => setNote(ev.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Add custom event ──────────────────────────────────── */}
            <div className="ctl-connector">
              <div className="ctl-connector-line" />
            </div>
            {showCustom ? (
              <div className="ctl-custom-form">
                <input
                  className="ctl-custom-lbl-inp"
                  placeholder="Event name (e.g. First ECG, Antibiotics given)…"
                  value={customInput.label}
                  onChange={e => setCustomInput(p => ({ ...p, label: e.target.value }))}
                />
                <input
                  type="time"
                  className="ctl-time-inp"
                  value={customInput.time}
                  onChange={e => setCustomInput(p => ({ ...p, time: e.target.value }))}
                />
                <button
                  className="ctl-add-btn"
                  disabled={!customInput.label.trim()}
                  onClick={() => {
                    if (!customInput.label.trim()) return;
                    const id = `custom_${Date.now()}`;
                    setCustomEvents(prev => [...prev, { id, label: customInput.label.trim(), time: customInput.time }]);
                    setCustomInput({ label: '', time: '' });
                    setShowCustom(false);
                  }}
                >Add</button>
                <button className="ctl-cancel-btn" onClick={() => setShowCustom(false)}>Cancel</button>
              </div>
            ) : (
              <button className="ctl-new-event-btn" onClick={() => setShowCustom(true)}>
                + Add clinical event
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.ctl-wrap{display:flex;flex-direction:column;height:100%;background:var(--npi-bg);border-radius:12px;border:1px solid var(--npi-bd);overflow:hidden}
.ctl-hdr{display:flex;align-items:center;gap:14px;padding:10px 18px;background:var(--npi-panel);border-bottom:1px solid var(--npi-bd);flex-shrink:0;flex-wrap:wrap}
.ctl-hdr-left{display:flex;flex-direction:column;gap:2px;flex:1}
.ctl-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--npi-txt)}
.ctl-guideline{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);letter-spacing:.03em}
.ctl-hdr-stats{display:flex;align-items:center;gap:16px;flex-shrink:0}
.ctl-stat{display:flex;flex-direction:column;align-items:flex-end;gap:1px}
.ctl-stat-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--npi-txt4);text-transform:uppercase;letter-spacing:.08em}
.ctl-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--npi-teal)}
.ctl-progress{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:20px;padding:2px 8px}

.ctl-body{flex:1;overflow-y:auto;padding:20px 28px;scrollbar-width:thin;scrollbar-color:#1a3555 transparent}
.ctl-body::-webkit-scrollbar{width:3px}
.ctl-body::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
.ctl-track{display:flex;flex-direction:column;max-width:640px}

.ctl-event-group{display:flex;flex-direction:column}
.ctl-connector{display:flex;align-items:center;gap:0;padding:0 0 0 19px;height:36px;position:relative}
.ctl-connector-line{width:1.5px;height:100%;background:rgba(26,53,85,.8);margin-right:auto;position:absolute;left:19px;top:0}
.ctl-connector-line.done{background:rgba(0,229,192,.4)}
.ctl-elapsed{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:20px;padding:1px 7px;position:absolute;left:32px;top:50%;transform:translateY(-50%)}

.ctl-event{display:flex;align-items:flex-start;gap:12px;padding:4px 0}
.ctl-dot{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--npi-bd);background:var(--npi-up);flex-shrink:0;transition:all .2s;font-size:9px;color:var(--npi-txt4);font-family:'JetBrains Mono',monospace;font-weight:700}
.ctl-dot.set{background:rgba(0,229,192,.12);border-color:rgba(0,229,192,.5);color:var(--npi-teal)}
.ctl-dot.auto.set{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.4);color:var(--npi-blue)}

.ctl-event-body{flex:1;padding-top:4px}
.ctl-event-labels{display:flex;align-items:center;gap:7px;margin-bottom:6px}
.ctl-event-name{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:var(--npi-txt)}
.ctl-event.set .ctl-event-name{color:var(--npi-txt)}
.ctl-event-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4)}
.ctl-auto-badge{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--npi-blue);background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.25);border-radius:3px;padding:1px 5px}

.ctl-event-inputs{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ctl-time-inp{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;color:var(--npi-txt2);font-family:'JetBrains Mono',monospace;font-size:12px;padding:5px 9px;outline:none;width:98px;transition:border-color .15s}
.ctl-time-inp:focus{border-color:var(--npi-teal)}
.ctl-note-inp{background:transparent;border:none;border-bottom:1px solid var(--npi-bd);color:var(--npi-txt3);font-family:'DM Sans',sans-serif;font-size:11px;padding:4px 6px;outline:none;flex:1;min-width:140px;max-width:260px;transition:border-color .15s}
.ctl-note-inp:focus{border-bottom-color:var(--npi-teal)}
.ctl-note-inp::placeholder{color:var(--npi-txt4)}

.ctl-new-event-btn{background:transparent;border:1px dashed var(--npi-bd);border-radius:8px;color:var(--npi-txt4);font-family:'DM Sans',sans-serif;font-size:11px;padding:7px 14px;cursor:pointer;transition:all .15s;margin-left:50px;align-self:flex-start}
.ctl-new-event-btn:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}
.ctl-custom-form{display:flex;align-items:center;gap:8px;margin-left:50px;flex-wrap:wrap}
.ctl-custom-lbl-inp{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;color:var(--npi-txt2);font-family:'DM Sans',sans-serif;font-size:12px;padding:5px 10px;outline:none;flex:1;min-width:200px;transition:border-color .15s}
.ctl-custom-lbl-inp:focus{border-color:var(--npi-teal)}
.ctl-add-btn{padding:5px 14px;border-radius:6px;background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);color:var(--npi-teal);font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
.ctl-add-btn:disabled{opacity:.4;cursor:not-allowed}
.ctl-add-btn:not(:disabled):hover{background:rgba(0,229,192,.2)}
.ctl-cancel-btn{padding:5px 12px;border-radius:6px;background:transparent;border:1px solid var(--npi-bd);color:var(--npi-txt4);font-family:'DM Sans',sans-serif;font-size:11px;cursor:pointer}
.ctl-cancel-btn:hover{color:var(--npi-coral);border-color:rgba(255,107,107,.35)}
`;