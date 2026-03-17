import { useMemo, useState } from 'react';
import { runValidation } from './claimValidation';

const SEV = {
  denial:  { color: '#ff4757', bg: 'rgba(255,71,87,.1)',  border: 'rgba(255,71,87,.25)',  icon: '🚫', label: 'DENIAL RISK' },
  warning: { color: '#f5a623', bg: 'rgba(245,166,35,.1)', border: 'rgba(245,166,35,.25)', icon: '⚠️', label: 'WARNING' },
  info:    { color: '#00c6ff', bg: 'rgba(0,198,255,.08)', border: 'rgba(0,198,255,.2)',   icon: '💡', label: 'INFO' },
};

export default function ClaimValidationPanel({ selIcd, selCpt }) {
  const [expanded, setExpanded] = useState({});

  const findings = useMemo(() => runValidation(selIcd, selCpt), [selIcd, selCpt]);

  const denials  = findings.filter(f => f.type === 'denial');
  const warnings = findings.filter(f => f.type === 'warning');
  const infos    = findings.filter(f => f.type === 'info');

  const toggle = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));

  if (selIcd.length + selCpt.length === 0) return null;

  const claimReady = denials.length === 0 && warnings.length === 0;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Status Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderRadius: 10, marginBottom: 14,
        background: claimReady ? 'rgba(0,229,160,.08)' : denials.length > 0 ? 'rgba(255,71,87,.08)' : 'rgba(245,166,35,.08)',
        border: `1px solid ${claimReady ? 'rgba(0,229,160,.3)' : denials.length > 0 ? 'rgba(255,71,87,.3)' : 'rgba(245,166,35,.3)'}`,
      }}>
        <span style={{ fontSize: 22 }}>{claimReady ? '✅' : denials.length > 0 ? '🚫' : '⚠️'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: claimReady ? '#00e5a0' : denials.length > 0 ? '#ff4757' : '#f5a623' }}>
            {claimReady ? 'Claim Ready — No Issues Detected' : denials.length > 0 ? `${denials.length} Denial Risk${denials.length > 1 ? 's' : ''} Detected` : `${warnings.length} Warning${warnings.length > 1 ? 's' : ''} — Review Before Submission`}
          </div>
          <div style={{ fontSize: 11, color: '#4d7a9e', marginTop: 2 }}>
            {findings.length === 0 ? 'All selected codes passed validation checks.' : `${denials.length} denial risk · ${warnings.length} warning · ${infos.length} info`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['🚫', denials.length, '#ff4757'], ['⚠️', warnings.length, '#f5a623'], ['💡', infos.length, '#00c6ff']].map(([icon, count, color]) => count > 0 && (
            <span key={icon} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,.05)', color, border: `1px solid ${color}40` }}>
              {icon} {count}
            </span>
          ))}
        </div>
      </div>

      {/* Findings List */}
      {findings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {findings.map((f, i) => {
            const s = SEV[f.type];
            const open = expanded[i];
            return (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
                <div
                  onClick={() => toggle(i)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', padding: '1px 7px', borderRadius: 10, background: `${s.color}20`, border: `1px solid ${s.color}50`, color: s.color }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#4d7a9e', fontFamily: "'JetBrains Mono', monospace", background: 'rgba(255,255,255,.04)', padding: '1px 6px', borderRadius: 4 }}>
                        {f.rule}
                      </span>
                      {f.codes?.filter(Boolean).map(code => (
                        <span key={code} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00c6ff', background: 'rgba(0,198,255,.08)', padding: '1px 6px', borderRadius: 4 }}>
                          {code}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#8fadc8', marginTop: 5, lineHeight: 1.55 }}>{f.message}</div>
                  </div>
                  <span style={{ color: '#4d7a9e', fontSize: 11, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', marginTop: 2 }}>▼</span>
                </div>
                {open && (
                  <div style={{ padding: '0 14px 12px 40px', borderTop: `1px solid ${s.border}`, paddingTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4d7a9e', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>Recommended Resolution</div>
                    <div style={{ fontSize: 12, color: '#e8f0f8', lineHeight: 1.6 }}>{f.resolution}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {findings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#4d7a9e', fontSize: 12 }}>
          No issues found. Codes passed all NCCI edit and LCD checks.
        </div>
      )}
    </div>
  );
}