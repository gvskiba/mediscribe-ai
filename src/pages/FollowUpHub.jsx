import { useState, useEffect, useMemo, useCallback } from 'react';
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

// ── Theme ──────────────────────────────────────────────────────────────────────
const T = {
  bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
  bd: 'rgba(26,53,85,0.8)', bdH: '#2a4f7a',
  txt: '#f2f7ff', txt2: '#c8e0f8', txt3: '#96c0e0', txt4: '#78a8cc',
  teal: '#00e5c0', gold: '#f5c842', coral: '#ff6b6b', blue: '#3b9eff',
  orange: '#ff9f43', purple: '#9b6dff', green: '#3dffa0',
};

// ── Constants ──────────────────────────────────────────────────────────────────
const ESI_COLORS = { '1': T.coral, '2': T.orange, '3': T.gold, '4': T.green, '5': T.txt4 };

const DISPO_LABELS = {
  discharge: 'Discharged', admit: 'Admitted', transfer: 'Transferred',
  observation: 'Observation', ama: 'AMA', lwbs: 'LWBS', deceased: 'Deceased',
};

const CALLBACK_STATES = {
  not_called: { label: 'Not Called', color: T.coral, icon: '📵' },
  attempted:  { label: 'Attempted',  color: T.gold,  icon: '📞' },
  completed:  { label: 'Completed',  color: T.green, icon: '✅' },
};

const TIME_WINDOWS = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d',  hours: 168 },
  { label: '30d', hours: 720 },
];

const SORT_OPTIONS = [
  { id: 'time',    label: 'Dispo Time' },
  { id: 'esi',     label: 'ESI' },
  { id: 'actions', label: 'Actions' },
  { id: 'note',    label: 'Note Status' },
];

// ── Utilities ──────────────────────────────────────────────────────────────────
function getPendingActions(enc) {
  const a = [];
  if (enc.note_status === 'not_started')
    a.push({ label: 'Note not started', sev: 'alert' });
  else if (enc.note_status === 'in_progress')
    a.push({ label: 'Note in progress — not signed', sev: 'warn' });
  else if (enc.note_status === 'drafted')
    a.push({ label: 'Note drafted — awaiting signature', sev: 'warn' });
  if (!enc.primary_diagnosis)
    a.push({ label: 'Primary diagnosis not recorded', sev: 'warn' });
  if (!enc.icd10_code)
    a.push({ label: 'ICD-10 code missing', sev: 'info' });
  if (enc.flags && enc.flags.length > 0)
    enc.flags.forEach(f => a.push({ label: f, sev: 'alert' }));
  if (enc.signout && !enc.signout_reviewed_at)
    a.push({ label: 'Sign-out not reviewed', sev: 'info' });
  if (!enc.callback_status || enc.callback_status === 'not_called')
    a.push({ label: 'Callback not attempted', sev: 'info' });
  return a;
}

function noteStatusWeight(ns) {
  return ({ not_started: 0, in_progress: 1, drafted: 2, signed: 3 })[ns] ?? 99;
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffMs = Date.now() - d;
  const diffH = diffMs / 3600000;
  if (diffH < 1) return `${Math.round(diffMs / 60000)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtClock(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function sevColor(sev) {
  if (sev === 'alert') return T.coral;
  if (sev === 'warn')  return T.gold;
  return T.blue;
}

// ── ErrorBanner ────────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss, onRetry }) {
  return (
    <div style={{
      margin: '0 24px 16px', padding: '11px 14px', borderRadius: 8,
      background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.3)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1, fontSize: 12, color: T.coral, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onRetry} style={{
        padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, flexShrink: 0,
        background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)',
        color: T.coral, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
      }}>Retry</button>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', color: T.txt4, cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

// ── ActionBadge ────────────────────────────────────────────────────────────────
function ActionBadge({ action }) {
  const c = sevColor(action.sev);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4,
      background: `${c}14`, border: `1px solid ${c}44`,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
      color: c, whiteSpace: 'nowrap',
    }}>
      {action.sev === 'alert' ? '⚠' : action.sev === 'warn' ? '!' : 'i'} {action.label}
    </span>
  );
}

// ── CallbackTracker ────────────────────────────────────────────────────────────
function CallbackTracker({ enc, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const current = enc.callback_status || 'not_called';

  async function handleSet(key) {
    if (key === current || saving) return;
    setSaving(true);
    try { await onUpdate(enc.id, key); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4,
        textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 7,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        Callback Status
        {enc.callback_at && (
          <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
            · last {fmtTime(enc.callback_at)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(CALLBACK_STATES).map(([key, s]) => {
          const active = current === key;
          return (
            <button key={key} onClick={() => handleSet(key)} disabled={saving} style={{
              padding: '5px 13px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              cursor: saving ? 'default' : 'pointer', transition: 'all .12s',
              background: active ? `${s.color}1e` : T.up,
              border: `1px solid ${active ? `${s.color}55` : T.bd}`,
              color: active ? s.color : T.txt4,
              fontFamily: "'JetBrains Mono', monospace",
              opacity: saving && !active ? 0.5 : 1,
            }}>
              {s.icon} {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── SignoutSummary ─────────────────────────────────────────────────────────────
function SignoutSummary({ signout }) {
  const [bullets, setBullets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed]   = useState(false);

  async function summarize() {
    setLoading(true); setFailed(false);
    try {
      const res = await base44.integrations.InvokeLLM({
        prompt: `You are a clinical assistant reviewing ED patient sign-outs at handoff. Summarize the following sign-out into exactly 3 concise bullet points — one per key clinical issue or pending item. Be brief, precise, and clinician-friendly.\n\nSign-out:\n${signout}`,
        response_json_schema: {
          type: 'object',
          properties: { bullets: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 } },
          required: ['bullets'],
        },
      });
      setBullets(res.bullets);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          Sign-out
        </div>
        {!bullets ? (
          <button onClick={summarize} disabled={loading} style={{
            padding: '2px 9px', borderRadius: 5, fontSize: 9, fontWeight: 700,
            background: loading ? 'transparent' : 'rgba(155,109,255,.1)',
            border: `1px solid ${loading ? T.bd : 'rgba(155,109,255,.28)'}`,
            color: loading ? T.txt4 : T.purple, cursor: loading ? 'default' : 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
          }}>{loading ? '✦ Summarizing…' : '✦ AI Summary'}</button>
        ) : (
          <button onClick={() => setBullets(null)} style={{
            padding: '2px 9px', borderRadius: 5, fontSize: 9,
            background: 'transparent', border: `1px solid ${T.bd}`,
            color: T.txt4, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
          }}>Show Raw</button>
        )}
      </div>
      {failed && <div style={{ fontSize: 10, color: T.coral, marginBottom: 5 }}>AI summary failed — showing raw text.</div>}
      {bullets ? (
        <div style={{ background: 'rgba(155,109,255,.07)', border: '1px solid rgba(155,109,255,.22)', borderRadius: 7, padding: '9px 12px' }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < bullets.length - 1 ? 6 : 0 }}>
              <span style={{ color: T.purple, fontSize: 11, flexShrink: 0 }}>▸</span>
              <span style={{ fontSize: 11, color: T.txt2, lineHeight: 1.55 }}>{b}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt3,
          background: 'rgba(4,13,25,.7)', border: `1px solid ${T.bd}`, borderRadius: 6,
          padding: '8px 10px', maxHeight: 90, overflowY: 'auto', lineHeight: 1.65, whiteSpace: 'pre-wrap',
        }}>{signout}</div>
      )}
    </div>
  );
}

// ── CommentsSection ────────────────────────────────────────────────────────────
function CommentsSection({ enc, onAddComment }) {
  const [text, setText]       = useState('');
  const [author, setAuthor]   = useState('');
  const [posting, setPosting] = useState(false);
  const comments = enc.comments || [];

  async function post() {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      await onAddComment(enc.id, text.trim(), author.trim() || 'Physician');
      setText('');
    } finally { setPosting(false); }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); post(); }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4,
        textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8,
      }}>
        Internal Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      {/* Thread */}
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 9 }}>
          {comments.map((c, i) => (
            <div key={c.id || i} style={{
              background: 'rgba(4,13,25,.55)', border: `1px solid ${T.bd}`, borderRadius: 6, padding: '7px 10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: T.blue }}>
                  {c.author}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4 }}>
                  {fmtTime(c.created_at)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.5 }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: 5 }}>
        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          placeholder="Your name"
          style={{
            width: 120, background: T.up, border: `1px solid ${T.bd}`, borderRadius: 6,
            color: T.txt, fontSize: 10, padding: '5px 8px', outline: 'none',
            fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
          }}
        />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Add internal comment… (Enter to post)"
          style={{
            flex: 1, background: T.up, border: `1px solid ${T.bd}`, borderRadius: 6,
            color: T.txt, fontSize: 11, padding: '5px 9px', outline: 'none',
          }}
        />
        <button
          onClick={post}
          disabled={posting || !text.trim()}
          style={{
            padding: '5px 13px', borderRadius: 6, fontSize: 10, fontWeight: 700, flexShrink: 0,
            background: text.trim() ? 'rgba(59,158,255,.1)' : 'transparent',
            border: `1px solid ${text.trim() ? 'rgba(59,158,255,.35)' : T.bd}`,
            color: text.trim() ? T.blue : T.txt4,
            cursor: text.trim() && !posting ? 'pointer' : 'default',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {posting ? '…' : 'Post'}
        </button>
      </div>
    </div>
  );
}

// ── DigestSection helper ───────────────────────────────────────────────────────
function DigestSection({ icon, label, color, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
        color, textTransform: 'uppercase', letterSpacing: '1.2px',
        borderBottom: `1px solid ${color}22`, paddingBottom: 7, marginBottom: 10,
      }}>
        <span>{icon}</span> {label}
      </div>
      {children}
    </div>
  );
}

// ── DigestModal ────────────────────────────────────────────────────────────────
function DigestModal({ encounters, onClose }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed]   = useState(false);

  const pending = encounters.filter(e => getPendingActions(e).length > 0);
  const now = new Date();

  const generate = useCallback(async () => {
    setLoading(true); setFailed(false); setDigest(null);
    const items = pending.map(e => ({
      patient:      e.patient_initials || 'Unknown',
      age:          e.patient_age,
      acuity:       e.acuity,
      dx:           e.primary_diagnosis || e.chief_complaint || 'Unspecified',
      note_status:  e.note_status || 'unknown',
      callback:     e.callback_status || 'not_called',
      action_count: getPendingActions(e).length,
      flags:        e.flags || [],
    }));
    try {
      const res = await base44.integrations.InvokeLLM({
        prompt: `You are an emergency physician closing out a shift. The following patients were recently discharged and have open items. Generate a concise, clinician-ready shift-end digest.\n\nPending patients:\n${JSON.stringify(items, null, 2)}\n\nReturn a summary paragraph, a list of the most urgent priority action items, a list of patients with unsigned notes, and a list of patients needing callbacks. Set all_clear to true only if there are zero outstanding items.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary:           { type: 'string' },
            priority_items:    { type: 'array', items: { type: 'string' } },
            unsigned_notes:    { type: 'array', items: { type: 'string' } },
            pending_callbacks: { type: 'array', items: { type: 'string' } },
            all_clear:         { type: 'boolean' },
          },
          required: ['summary', 'priority_items', 'unsigned_notes', 'pending_callbacks', 'all_clear'],
        },
      });
      setDigest(res);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { generate(); }, []);

  function printDigest() {
    if (!digest) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = arr => arr.length
      ? arr.map(x => `<li>${x}</li>`).join('')
      : '<li style="color:#888">None</li>';
    win.document.write(`<!DOCTYPE html><html><head><title>Shift-End Digest</title>
    <style>
      body{font-family:Georgia,serif;padding:40px;color:#111;max-width:700px;margin:0 auto;}
      h1{font-size:22px;margin-bottom:4px;}
      .meta{color:#666;font-size:12px;font-family:monospace;margin-bottom:28px;}
      h2{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#444;
         border-bottom:1px solid #ddd;padding-bottom:5px;margin-top:24px;margin-bottom:10px;}
      p{font-size:13px;line-height:1.7;margin:0;}
      ul{font-size:13px;line-height:1.9;padding-left:20px;margin:0;}
      .clear{background:#f0fff4;border:1px solid #b2dfdb;padding:10px 14px;
             border-radius:6px;font-size:13px;color:#2e7d32;margin-bottom:20px;}
      .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:12px;
              font-size:10px;color:#aaa;font-family:monospace;
              display:flex;justify-content:space-between;}
      .sig{margin-top:32px;border-top:1px solid #999;width:220px;
           padding-top:5px;font-size:10px;color:#999;font-family:monospace;}
    </style></head><body>
    <h1>Shift-End Digest</h1>
    <div class="meta">
      ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      &nbsp;&middot;&nbsp;${fmtClock(now.toISOString())}
      &nbsp;&middot;&nbsp;${pending.length} pending encounter${pending.length !== 1 ? 's' : ''}
    </div>
    ${digest.all_clear ? '<div class="clear">&#10003; All clear &mdash; no critical pending items</div>' : ''}
    <h2>Summary</h2><p>${digest.summary}</p>
    <h2>&#128680; Priority Actions</h2><ul>${rows(digest.priority_items)}</ul>
    <h2>&#128221; Unsigned Notes</h2><ul>${rows(digest.unsigned_notes)}</ul>
    <h2>&#128222; Pending Callbacks</h2><ul>${rows(digest.pending_callbacks)}</ul>
    <div class="footer">
      <span>Notrya AI &middot; Follow-Up Hub</span>
      <span>Generated ${now.toISOString()}</span>
    </div>
    <div class="sig">Receiving Physician Signature</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(3,8,18,.88)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 620, maxHeight: '86vh',
        background: T.panel, border: `1px solid ${T.bdH}`,
        borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${T.bd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 900, color: T.txt }}>
              Shift-End Digest
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, marginTop: 2 }}>
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              &nbsp;·&nbsp;{fmtClock(now.toISOString())}
              &nbsp;·&nbsp;{pending.length} pending
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {digest && !failed && (
              <button onClick={printDigest} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.3)',
                color: T.teal, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              }}>🖨 Print</button>
            )}
            <button onClick={onClose} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 10, fontWeight: 700,
              background: 'transparent', border: `1px solid ${T.bd}`,
              color: T.txt4, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
            }}>Close</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {loading && (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: T.txt4 }}>
              <div style={{ fontSize: 30, opacity: .25, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>Generating digest…</div>
              <div style={{ fontSize: 11, opacity: .6 }}>
                Analyzing {pending.length} pending encounter{pending.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
          {failed && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 8, color: T.coral }}>⚠</div>
              <div style={{ fontSize: 12, color: T.coral, marginBottom: 16 }}>
                Failed to generate digest. Check your connection.
              </div>
              <button onClick={generate} style={{
                padding: '6px 16px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)',
                color: T.coral, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              }}>Retry</button>
            </div>
          )}
          {digest && !failed && (
            <div>
              {digest.all_clear && (
                <div style={{
                  padding: '11px 14px', borderRadius: 8, marginBottom: 18,
                  background: 'rgba(61,255,160,.07)', border: '1px solid rgba(61,255,160,.2)',
                  color: T.green, fontSize: 12, fontWeight: 600,
                }}>
                  ✓ All clear — no critical pending items remaining
                </div>
              )}
              <DigestSection icon="📋" label="Summary" color={T.blue}>
                <p style={{ margin: 0, fontSize: 12, color: T.txt2, lineHeight: 1.7 }}>{digest.summary}</p>
              </DigestSection>
              {digest.priority_items.length > 0 && (
                <DigestSection icon="🚨" label="Priority Actions" color={T.coral}>
                  {digest.priority_items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: T.coral, flexShrink: 0, fontSize: 10, marginTop: 2 }}>▸</span>
                      <span style={{ fontSize: 12, color: T.txt2, lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </DigestSection>
              )}
              <DigestSection icon="📝" label="Unsigned Notes" color={T.gold}>
                {digest.unsigned_notes.length > 0
                  ? digest.unsigned_notes.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <span style={{ color: T.gold, flexShrink: 0, fontSize: 10, marginTop: 2 }}>▸</span>
                        <span style={{ fontSize: 12, color: T.txt2, lineHeight: 1.55 }}>{item}</span>
                      </div>
                    ))
                  : <span style={{ fontSize: 11, color: T.green }}>✓ None</span>}
              </DigestSection>
              <DigestSection icon="📞" label="Pending Callbacks" color={T.orange}>
                {digest.pending_callbacks.length > 0
                  ? digest.pending_callbacks.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <span style={{ color: T.orange, flexShrink: 0, fontSize: 10, marginTop: 2 }}>▸</span>
                        <span style={{ fontSize: 12, color: T.txt2, lineHeight: 1.55 }}>{item}</span>
                      </div>
                    ))
                  : <span style={{ fontSize: 11, color: T.green }}>✓ None</span>}
              </DigestSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PrintView ──────────────────────────────────────────────────────────────────
function PrintView({ encounters, onClose }) {
  const pending = encounters.filter(e => getPendingActions(e).length > 0);
  const now = new Date();

  useEffect(() => {
    const s = document.createElement('style');
    s.id = 'notrya-print-css';
    s.textContent = '@media print { .no-print { display: none !important; } @page { margin: 20mm; } }';
    document.head.appendChild(s);
    const t = setTimeout(() => window.print(), 400);
    return () => {
      clearTimeout(t);
      const el = document.getElementById('notrya-print-css');
      if (el) el.remove();
    };
  }, []);

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      {/* Control bar */}
      <div className="no-print" style={{
        background: '#0b1e36', padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#78a8cc', fontSize: 11, fontFamily: 'monospace' }}>
          🖨 Print Mode — Handoff Sheet ({pending.length} pending)
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.3)',
            color: '#00e5c0', cursor: 'pointer', fontFamily: 'monospace',
          }}>Print</button>
          <button onClick={onClose} style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)',
            color: '#ff6b6b', cursor: 'pointer', fontFamily: 'monospace',
          }}>✕ Close</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 44px', maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 3 }}>
                ED Handoff Sheet
              </div>
              <div style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                Notrya AI · Follow-Up Hub
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#555' }}>
              <div>
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div>{fmtClock(now.toISOString())}</div>
              <div style={{ marginTop: 2, fontWeight: 700, color: '#222' }}>
                {pending.length} patient{pending.length !== 1 ? 's' : ''} with pending items
              </div>
            </div>
          </div>
        </div>

        {/* Patient list */}
        {pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 14 }}>
            ✓ All encounters cleared — no pending items at time of print
          </div>
        ) : (
          pending.map((enc, idx) => {
            const actions  = getPendingActions(enc);
            const cbState  = CALLBACK_STATES[enc.callback_status] || CALLBACK_STATES.not_called;
            const comments = enc.comments || [];
            const isLast   = idx === pending.length - 1;
            return (
              <div key={enc.id} style={{
                borderBottom: isLast ? 'none' : '1px solid #e0e0e0',
                paddingBottom: 20, marginBottom: 20,
              }}>
                {/* Patient header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 4, border: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {enc.acuity || '?'}
                  </div>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{enc.patient_initials || 'Unknown'}</span>
                  {enc.patient_age && (
                    <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>
                      {enc.patient_age}{enc.patient_sex ? enc.patient_sex[0] : ''}
                    </span>
                  )}
                  {enc.mrn && (
                    <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>MRN: {enc.mrn}</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                    Dispo: {enc.disposition_time ? fmtTime(enc.disposition_time) : '—'}
                  </span>
                </div>

                {/* Diagnosis */}
                <div style={{ fontSize: 13, color: '#333', marginBottom: 9, marginLeft: 34 }}>
                  {enc.primary_diagnosis || enc.chief_complaint || 'Diagnosis not recorded'}
                  {enc.icd10_code && (
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', marginLeft: 8 }}>
                      {enc.icd10_code}
                    </span>
                  )}
                </div>

                {/* Action checklist */}
                <div style={{ marginLeft: 34, marginBottom: 7 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: 5, fontFamily: 'monospace' }}>
                    Pending Actions
                  </div>
                  {actions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-block', width: 13, height: 13, borderRadius: 2, flexShrink: 0,
                        border: `1px solid ${a.sev === 'alert' ? '#c62828' : a.sev === 'warn' ? '#f57f17' : '#666'}`,
                      }} />
                      <span style={{ fontSize: 12, color: a.sev === 'alert' ? '#c62828' : '#333' }}>
                        {a.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Callback */}
                <div style={{ marginLeft: 34, fontSize: 11, color: '#555', fontFamily: 'monospace', marginBottom: comments.length > 0 ? 7 : 0 }}>
                  Callback: <strong>{cbState.label}</strong>
                  {enc.callback_at && ` · ${fmtTime(enc.callback_at)}`}
                </div>

                {/* Comments */}
                {comments.length > 0 && (
                  <div style={{ marginLeft: 34, marginTop: 5 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: 4, fontFamily: 'monospace' }}>
                      Internal Comments
                    </div>
                    {comments.map((c, i) => (
                      <div key={i} style={{
                        fontSize: 11, color: '#333',
                        borderLeft: '2px solid #ccc', paddingLeft: 9, marginBottom: 4,
                      }}>
                        <strong style={{ color: '#111' }}>{c.author}</strong>
                        <span style={{ color: '#888', fontFamily: 'monospace', marginLeft: 6 }}>
                          {fmtTime(c.created_at)}
                        </span>
                        <span style={{ marginLeft: 6 }}>— {c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #ccc', paddingTop: 12, marginTop: 8,
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: '#aaa', fontFamily: 'monospace',
        }}>
          <span>Notrya AI · Follow-Up Hub</span>
          <span>Printed {now.toISOString()}</span>
        </div>

        {/* Signature lines */}
        <div style={{ marginTop: 32, display: 'flex', gap: 60 }}>
          {['Outgoing Physician', 'Receiving Physician'].map(label => (
            <div key={label} style={{
              borderTop: '1px solid #999', width: 200, paddingTop: 5,
              fontSize: 10, color: '#888', fontFamily: 'monospace',
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── EncounterCard ──────────────────────────────────────────────────────────────
function EncounterCard({ enc, onCallbackUpdate, onAddComment }) {
  const [expanded, setExpanded] = useState(false);
  const actions      = getPendingActions(enc);
  const alertCount   = actions.filter(a => a.sev === 'alert').length;
  const warnCount    = actions.filter(a => a.sev === 'warn').length;
  const cbState      = CALLBACK_STATES[enc.callback_status] || CALLBACK_STATES.not_called;
  const commentCount = (enc.comments || []).length;

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.bd}`,
      borderLeft: `3px solid ${alertCount > 0 ? T.coral : warnCount > 0 ? T.gold : T.teal}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color .15s',
    }}>
      {/* Collapsed row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: `${ESI_COLORS[enc.acuity] || T.txt4}1a`,
          border: `1px solid ${ESI_COLORS[enc.acuity] || T.txt4}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
          color: ESI_COLORS[enc.acuity] || T.txt4,
        }}>{enc.acuity}</div>

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
            {commentCount > 0 && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.blue, opacity: .85 }}>
                💬 {commentCount}
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

        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          padding: '2px 8px', borderRadius: 6,
          background: `${cbState.color}12`, border: `1px solid ${cbState.color}33`,
        }}>
          <span style={{ fontSize: 9 }}>{cbState.icon}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: cbState.color }}>
            {cbState.label}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
            padding: '2px 7px', borderRadius: 4,
            background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.28)', color: T.teal,
          }}>{DISPO_LABELS[enc.disposition] || enc.disposition}</span>
          <span style={{ fontSize: 10, color: T.txt4 }}>
            {enc.disposition_time ? fmtTime(enc.disposition_time) : '—'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {actions.length > 0 ? (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
              padding: '2px 7px', borderRadius: 20,
              background: alertCount > 0 ? 'rgba(255,107,107,.15)' : 'rgba(245,200,66,.1)',
              border: `1px solid ${alertCount > 0 ? 'rgba(255,107,107,.35)' : 'rgba(245,200,66,.3)'}`,
              color: alertCount > 0 ? T.coral : T.gold,
            }}>{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
          ) : (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
              padding: '2px 7px', borderRadius: 20,
              background: 'rgba(61,255,160,.1)', border: '1px solid rgba(61,255,160,.25)', color: T.green,
            }}>✓ Clear</span>
          )}
          <span style={{ color: T.txt4, fontSize: 10, transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T.bd}` }}>
          <div style={{ marginTop: 10 }}>
            {actions.length > 0 ? (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 6 }}>
                  Pending Actions
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {actions.map((a, i) => <ActionBadge key={i} action={a} />)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: T.green }}>✓ No pending actions — encounter complete</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
            {[
              { lbl: 'Room',        val: enc.room },
              { lbl: 'CC',          val: enc.chief_complaint },
              { lbl: 'Allergies',   val: enc.allergies },
              { lbl: 'Note Status', val: enc.note_status?.replace(/_/g, ' ') },
              { lbl: 'Arrived',     val: enc.arrival_time ? fmtTime(enc.arrival_time) : null },
              { lbl: 'Dispo At',    val: enc.disposition_time ? fmtClock(enc.disposition_time) : null },
            ].filter(r => r.val).map(r => (
              <div key={r.lbl} style={{ background: T.up, borderRadius: 6, padding: '6px 9px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
                  {r.lbl}
                </div>
                <div style={{ fontSize: 11, color: T.txt2, fontWeight: 500 }}>{r.val}</div>
              </div>
            ))}
          </div>

          <CallbackTracker enc={enc} onUpdate={onCallbackUpdate} />
          {enc.signout && <SignoutSummary signout={enc.signout} />}
          <CommentsSection enc={enc} onAddComment={onAddComment} />

          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {enc.note_id && (
              <button onClick={() => { window.location.href = `/ProviderStudio?noteId=${enc.note_id}`; }} style={{
                padding: '4px 11px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: 'rgba(155,109,255,.1)', border: '1px solid rgba(155,109,255,.3)',
                color: T.purple, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              }}>Open Note</button>
            )}
            <button onClick={() => { window.location.href = `/PatientEncounter?patientId=${enc.id}`; }} style={{
              padding: '4px 11px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: 'rgba(0,229,192,.08)', border: '1px solid rgba(0,229,192,.25)',
              color: T.teal, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
            }}>View Encounter</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Hub ───────────────────────────────────────────────────────────────────
export default function FollowUpHub() {
  const [encounters, setEncounters]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState('time');
  const [sortDir, setSortDir]         = useState('desc');
  const [timeWindow, setTimeWindow]   = useState(48);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showDigest, setShowDigest]   = useState(false);
  const [printMode, setPrintMode]     = useState(false);

  const fetchEncounters = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await base44.entities.encounters.filter({ disposition: 'discharge' });
      const cutoff = new Date(Date.now() - timeWindow * 3600000).toISOString();
      const recent = (data || []).filter(e => e.disposition_time && e.disposition_time >= cutoff);
      setEncounters(recent);
      setLastRefresh(new Date().toISOString());
    } catch {
      setError('Failed to load discharged encounters. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  useEffect(() => {
    fetchEncounters();
    const iv = setInterval(fetchEncounters, 90000);
    return () => clearInterval(iv);
  }, [fetchEncounters]);

  const handleCallbackUpdate = useCallback(async (encId, status) => {
    const payload = { callback_status: status, callback_at: new Date().toISOString() };
    await base44.entities.encounters.update(encId, payload);
    setEncounters(prev => prev.map(e => e.id === encId ? { ...e, ...payload } : e));
  }, []);

  const handleAddComment = useCallback(async (encId, text, author) => {
    const enc = encounters.find(e => e.id === encId);
    if (!enc) return;
    const newComment = {
      id: `c${Date.now()}`,
      text,
      author: author || 'Physician',
      created_at: new Date().toISOString(),
    };
    const updatedComments = [...(enc.comments || []), newComment];
    await base44.entities.encounters.update(encId, { comments: updatedComments });
    setEncounters(prev => prev.map(e => e.id === encId ? { ...e, comments: updatedComments } : e));
  }, [encounters]);

  const filtered = useMemo(() => {
    let list = [...encounters];
    if (filter === 'pending') list = list.filter(e => getPendingActions(e).length > 0);
    if (filter === 'clear')   list = list.filter(e => getPendingActions(e).length === 0);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.patient_initials  || '').toLowerCase().includes(q) ||
        (e.primary_diagnosis || '').toLowerCase().includes(q) ||
        (e.chief_complaint   || '').toLowerCase().includes(q) ||
        (e.mrn               || '').toLowerCase().includes(q)
      );
    }
    const mul = sortDir === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      if (sortBy === 'time')    return mul * (new Date(a.disposition_time) - new Date(b.disposition_time));
      if (sortBy === 'esi')     return mul * ((parseInt(a.acuity) || 9) - (parseInt(b.acuity) || 9));
      if (sortBy === 'actions') return mul * (getPendingActions(a).length - getPendingActions(b).length);
      if (sortBy === 'note')    return mul * (noteStatusWeight(a.note_status) - noteStatusWeight(b.note_status));
      return 0;
    });
    return list;
  }, [encounters, filter, search, sortBy, sortDir]);

  function handleSort(id) {
    if (id === sortBy) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(id); setSortDir(id === 'esi' ? 'asc' : 'desc'); }
  }

  const pendingCount = encounters.filter(e => getPendingActions(e).length > 0).length;
  const clearCount   = encounters.length - pendingCount;
  const cbDoneCount  = encounters.filter(e => e.callback_status === 'completed').length;

  if (printMode) return <PrintView encounters={filtered} onClose={() => setPrintMode(false)} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.txt, fontFamily: "'DM Sans', sans-serif" }}>
      <NotryaNav currentHub="FollowUpHub" />
      {showDigest && <DigestModal encounters={encounters} onClose={() => setShowDigest(false)} />}

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <NotryaHubHeader hubName="Follow-Up Hub" category="Documentation" homeUrl="/" />
        <NotryaPatientBar />

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchEncounters} />}

        <div style={{ padding: '20px 24px 60px', maxWidth: 920, width: '100%', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: T.txt, marginBottom: 3 }}>
                Discharged Patients
              </div>
              <div style={{ fontSize: 12, color: T.txt4 }}>
                Review pending actions, unsigned notes, comments, and follow-up status.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setShowDigest(true)} style={{
                padding: '6px 13px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                background: 'rgba(245,200,66,.1)', border: '1px solid rgba(245,200,66,.3)',
                color: T.gold, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              }}>⚡ Shift Digest</button>
              <button onClick={() => setPrintMode(true)} style={{
                padding: '6px 13px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                background: 'rgba(0,229,192,.08)', border: '1px solid rgba(0,229,192,.25)',
                color: T.teal, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              }}>🖨 Print Handoff</button>
              <div style={{ display: 'flex', gap: 4 }}>
                {TIME_WINDOWS.map(w => (
                  <button key={w.hours} onClick={() => setTimeWindow(w.hours)} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .12s',
                    background: timeWindow === w.hours ? 'rgba(0,229,192,.12)' : T.up,
                    border: `1px solid ${timeWindow === w.hours ? 'rgba(0,229,192,.4)' : T.bd}`,
                    color: timeWindow === w.hours ? T.teal : T.txt4,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{w.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4 }}>
                  {lastRefresh ? `Updated ${fmtTime(lastRefresh)}` : '…'}
                </span>
                <button onClick={fetchEncounters} disabled={loading} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                  background: loading ? 'transparent' : 'rgba(59,158,255,.08)',
                  border: `1px solid ${loading ? T.bd : 'rgba(59,158,255,.3)'}`,
                  color: loading ? T.txt4 : T.blue, cursor: loading ? 'default' : 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{loading ? '↻ …' : '↻ Refresh'}</button>
              </div>
            </div>
          </div>

          {/* Stats */}
          {!loading && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Discharged', val: encounters.length, color: T.blue },
                { label: 'Pending Actions',  val: pendingCount,       color: T.gold },
                { label: 'Fully Cleared',    val: clearCount,          color: T.green },
                { label: 'Callbacks Done',   val: cbDoneCount,         color: T.teal },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '9px 16px', borderRadius: 8, background: T.card,
                  border: `1px solid ${s.color}28`, minWidth: 110, flex: '1 0 auto',
                }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: s.color }}>
                    {s.val}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter + sort + search */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {[{ id: 'all', label: 'All' }, { id: 'pending', label: '⚠ Pending' }, { id: 'clear', label: '✓ Clear' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all .12s',
                background: filter === f.id ? 'rgba(59,158,255,.15)' : T.up,
                border: `1px solid ${filter === f.id ? 'rgba(59,158,255,.45)' : T.bd}`,
                color: filter === f.id ? T.blue : T.txt3,
              }}>{f.label}</button>
            ))}
            <div style={{ width: 1, height: 20, background: T.bd, flexShrink: 0 }} />
            {SORT_OPTIONS.map(s => {
              const active = sortBy === s.id;
              return (
                <button key={s.id} onClick={() => handleSort(s.id)} style={{
                  padding: '5px 11px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                  cursor: 'pointer', transition: 'all .12s',
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: active ? 'rgba(155,109,255,.12)' : T.up,
                  border: `1px solid ${active ? 'rgba(155,109,255,.4)' : T.bd}`,
                  color: active ? T.purple : T.txt4,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {s.label}
                  {active && <span style={{ fontSize: 9, opacity: .8 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
                </button>
              );
            })}
            <div style={{
              flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 6,
              background: T.up, border: `1px solid ${T.bd}`, borderRadius: 8, padding: '0 10px',
            }}>
              <span style={{ fontSize: 11, opacity: .35 }}>🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patient, diagnosis, MRN…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.txt, fontSize: 12, padding: '6px 0' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: T.txt4, cursor: 'pointer', fontSize: 11 }}>✕</button>
              )}
            </div>
          </div>

          {/* Results label */}
          {!loading && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, marginBottom: 10 }}>
              {filtered.length} encounter{filtered.length !== 1 ? 's' : ''}
              &nbsp;· sorted by {SORT_OPTIONS.find(s => s.id === sortBy)?.label} {sortDir === 'desc' ? '↓' : '↑'}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: T.txt4, fontSize: 13 }}>
              <div style={{ fontSize: 28, opacity: .2, marginBottom: 10 }}>⏳</div>
              Loading discharged patients…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: T.txt4, fontSize: 13 }}>
              <div style={{ fontSize: 32, opacity: .15, marginBottom: 10 }}>📋</div>
              <div>
                {encounters.length === 0
                  ? `No discharges in the last ${TIME_WINDOWS.find(w => w.hours === timeWindow)?.label}`
                  : 'No results match your filter or search'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(enc => (
                <EncounterCard
                  key={enc.id}
                  enc={enc}
                  onCallbackUpdate={handleCallbackUpdate}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}