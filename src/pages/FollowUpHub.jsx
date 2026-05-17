import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import NotryaHubHeader from '@/components/HubHeader/NotryaHubHeader';
import NotryaNav from '@/components/HubHeader/NotryaNav';
import NotryaPatientBar from '@/components/HubHeader/NotryaPatientBar';

// ── Font injection ─────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById('fuh-fonts')) return;
  const l = document.createElement('link');
  l.id = 'fuh-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(l);
})();

const T = {
  bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
  bd: 'rgba(26,53,85,0.8)', bdH: '#2a4f7a',
  txt: '#f2f7ff', txt2: '#c8e0f8', txt3: '#96c0e0', txt4: '#78a8cc',
  teal: '#00e5c0', gold: '#f5c842', coral: '#ff6b6b', blue: '#3b9eff',
  orange: '#ff9f43', purple: '#9b6dff', green: '#3dffa0',
};

const ESI_COLORS = { '1': T.coral, '2': T.orange, '3': T.gold, '4': T.green, '5': T.txt4 };
const DISPO_LABELS = {
  discharge: 'Discharged', admit: 'Admitted', transfer: 'Transferred',
  observation: 'Observation', ama: 'AMA', lwbs: 'LWBS', deceased: 'Deceased',
};

// Pending action item extraction from encounter data
function getPendingActions(enc) {
  const actions = [];
  if (enc.note_status === 'not_started') actions.push({ label: 'Note not started', sev: 'alert' });
  else if (enc.note_status === 'in_progress') actions.push({ label: 'Note in progress — not signed', sev: 'warn' });
  else if (enc.note_status === 'drafted') actions.push({ label: 'Note drafted — awaiting signature', sev: 'warn' });
  if (!enc.primary_diagnosis) actions.push({ label: 'Primary diagnosis not recorded', sev: 'warn' });
  if (!enc.icd10_code) actions.push({ label: 'ICD-10 code missing', sev: 'info' });
  if (enc.flags && enc.flags.length > 0) {
    enc.flags.forEach(f => actions.push({ label: f, sev: 'alert' }));
  }
  if (enc.signout && !enc.signout_reviewed_at) actions.push({ label: 'Sign-out not reviewed', sev: 'info' });
  return actions;
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffH = diffMs / 3600000;
  if (diffH < 1) return `${Math.round(diffMs / 60000)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function sevColor(sev) {
  if (sev === 'alert') return T.coral;
  if (sev === 'warn') return T.gold;
  return T.blue;
}

function ActionBadge({ action }) {
  const c = sevColor(action.sev);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4,
      background: `${c}14`, border: `1px solid ${c}44`,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
      color: c, whiteSpace: 'nowrap',
    }}>
      {action.sev === 'alert' ? '⚠' : action.sev === 'warn' ? '!' : 'i'} {action.label}
    </span>
  );
}

function EncounterCard({ enc, onViewNote }) {
  const [expanded, setExpanded] = useState(false);
  const actions = getPendingActions(enc);
  const alertCount = actions.filter(a => a.sev === 'alert').length;
  const warnCount = actions.filter(a => a.sev === 'warn').length;
  const dispoTime = enc.disposition_time ? fmtTime(enc.disposition_time) : '—';

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.bd}`,
      borderLeft: `3px solid ${alertCount > 0 ? T.coral : warnCount > 0 ? T.gold : T.teal}`,
      borderRadius: 10, overflow: 'hidden',
      transition: 'border-color .15s',
    }}>
      {/* Main row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {/* ESI badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: `${ESI_COLORS[enc.acuity] || T.txt4}1a`,
          border: `1px solid ${ESI_COLORS[enc.acuity] || T.txt4}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
          color: ESI_COLORS[enc.acuity] || T.txt4,
        }}>
          {enc.acuity}
        </div>

        {/* Patient identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: T.txt }}>
              {enc.patient_initials || 'Unknown'}
            </span>
            {enc.patient_age && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.txt4 }}>
                {enc.patient_age}{enc.patient_sex ? enc.patient_sex[0] : ''}
              </span>
            )}
            {enc.mrn && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4 }}>
                MRN: {enc.mrn}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.txt3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {enc.primary_diagnosis || enc.chief_complaint || '—'}
            {enc.icd10_code && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, marginLeft: 6 }}>
                {enc.icd10_code}
              </span>
            )}
          </div>
        </div>

        {/* Right meta */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
            padding: '2px 7px', borderRadius: 4,
            background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.28)',
            color: T.teal,
          }}>
            {DISPO_LABELS[enc.disposition] || enc.disposition}
          </span>
          <span style={{ fontSize: 10, color: T.txt4 }}>{dispoTime}</span>
        </div>

        {/* Action count + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {actions.length > 0 && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
              padding: '2px 7px', borderRadius: 20,
              background: alertCount > 0 ? 'rgba(255,107,107,.15)' : 'rgba(245,200,66,.1)',
              border: `1px solid ${alertCount > 0 ? 'rgba(255,107,107,.35)' : 'rgba(245,200,66,.3)'}`,
              color: alertCount > 0 ? T.coral : T.gold,
            }}>
              {actions.length} action{actions.length !== 1 ? 's' : ''}
            </span>
          )}
          {actions.length === 0 && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
              padding: '2px 7px', borderRadius: 20,
              background: 'rgba(61,255,160,.1)', border: '1px solid rgba(61,255,160,.25)',
              color: T.green,
            }}>
              ✓ Clear
            </span>
          )}
          <span style={{ color: T.txt4, fontSize: 10, transition: 'transform .15s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: `1px solid ${T.bd}` }}>
          {/* Pending actions */}
          {actions.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 6 }}>
                Pending Actions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {actions.map((a, i) => <ActionBadge key={i} action={a} />)}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 11, color: T.green }}>✓ No pending actions — encounter complete</div>
          )}

          {/* Additional details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
            {[
              { lbl: 'Room', val: enc.room },
              { lbl: 'CC', val: enc.chief_complaint },
              { lbl: 'Allergies', val: enc.allergies },
              { lbl: 'Note Status', val: enc.note_status?.replace(/_/g, ' ') },
              { lbl: 'Arrived', val: enc.arrival_time ? fmtTime(enc.arrival_time) : null },
              { lbl: 'Disposition', val: enc.disposition_time ? fmtTime(enc.disposition_time) : null },
            ].filter(r => r.val).map(r => (
              <div key={r.lbl} style={{ background: T.up, borderRadius: 6, padding: '6px 9px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>{r.lbl}</div>
                <div style={{ fontSize: 11, color: T.txt2, fontWeight: 500 }}>{r.val}</div>
              </div>
            ))}
          </div>

          {/* Signout preview */}
          {enc.signout && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>Sign-out</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt3,
                background: 'rgba(4,13,25,.7)', border: `1px solid ${T.bd}`, borderRadius: 6,
                padding: '7px 10px', maxHeight: 90, overflowY: 'auto', lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {enc.signout}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {enc.note_id && (
              <button
                onClick={() => window.location.href = `/ProviderStudio?noteId=${enc.note_id}`}
                style={{
                  padding: '4px 11px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: 'rgba(155,109,255,.1)', border: '1px solid rgba(155,109,255,.3)',
                  color: T.purple, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                }}>
                Open Note
              </button>
            )}
            <button
              onClick={() => window.location.href = `/PatientEncounter?patientId=${enc.id}`}
              style={{
                padding: '4px 11px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: 'rgba(0,229,192,.08)', border: '1px solid rgba(0,229,192,.25)',
                color: T.teal, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              }}>
              View Encounter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FollowUpHub() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | clear
  const [search, setSearch] = useState('');

  useEffect(() => {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    base44.entities.encounters
      .filter({ disposition: 'discharge' })
      .then(data => {
        // Filter to last 48h on client side
        const recent = data.filter(e => e.disposition_time && e.disposition_time >= cutoff);
        recent.sort((a, b) => new Date(b.disposition_time) - new Date(a.disposition_time));
        setEncounters(recent);
      })
      .catch(() => setEncounters([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = encounters;
    if (filter === 'pending') list = list.filter(e => getPendingActions(e).length > 0);
    if (filter === 'clear') list = list.filter(e => getPendingActions(e).length === 0);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.patient_initials || '').toLowerCase().includes(q) ||
        (e.primary_diagnosis || '').toLowerCase().includes(q) ||
        (e.chief_complaint || '').toLowerCase().includes(q) ||
        (e.mrn || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [encounters, filter, search]);

  const pendingCount = encounters.filter(e => getPendingActions(e).length > 0).length;
  const clearCount = encounters.length - pendingCount;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.txt, fontFamily: "'DM Sans', sans-serif" }}>
      <NotryaNav currentHub="FollowUpHub" />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <NotryaHubHeader hubName="Follow-Up Hub" category="Documentation" homeUrl="/" />
        <NotryaPatientBar />

        <div style={{ padding: '20px 24px 60px', maxWidth: 900, width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: T.txt, marginBottom: 4 }}>
              Discharged — Last 48 Hours
            </div>
            <div style={{ fontSize: 12, color: T.txt4 }}>
              Review pending actions, unsigned notes, and incomplete documentation for recently discharged patients.
            </div>
          </div>

          {/* Stats strip */}
          {!loading && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Discharged', val: encounters.length, color: T.blue },
                { label: 'Pending Actions', val: pendingCount, color: T.gold },
                { label: 'Fully Cleared', val: clearCount, color: T.green },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '9px 16px', borderRadius: 8, background: T.card,
                  border: `1px solid ${s.color}30`, minWidth: 110,
                }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters + search */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: '⚠ Pending' },
              { id: 'clear', label: '✓ Clear' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all .12s',
                background: filter === f.id ? 'rgba(59,158,255,.15)' : T.up,
                border: `1px solid ${filter === f.id ? 'rgba(59,158,255,.45)' : T.bd}`,
                color: filter === f.id ? T.blue : T.txt3,
              }}>
                {f.label}
              </button>
            ))}
            <div style={{
              flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 6,
              background: T.up, border: `1px solid ${T.bd}`, borderRadius: 8, padding: '0 10px',
            }}>
              <span style={{ fontSize: 11, opacity: .4 }}>🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patient, diagnosis, MRN…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.txt, fontSize: 12, padding: '6px 0' }}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: T.txt4, cursor: 'pointer', fontSize: 11 }}>✕</button>}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: T.txt4, fontSize: 13 }}>
              <div style={{ fontSize: 28, opacity: .2, marginBottom: 10 }}>⏳</div>
              Loading discharged patients…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: T.txt4, fontSize: 13 }}>
              <div style={{ fontSize: 32, opacity: .15, marginBottom: 10 }}>📋</div>
              <div>{encounters.length === 0 ? 'No discharges in the last 48 hours' : 'No results match your filter'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(enc => (
                <EncounterCard key={enc.id} enc={enc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}