import { useMemo, useState } from 'react';

// ─── DRUG SETS ─────────────────────────────────────────────────────────────────
const PENICILLIN_DRUGS  = ['amoxicillin','ampicillin','piperacillin','augmentin','amoxil','unasyn'];
const SULFA_DRUGS       = ['sulfamethoxazole','trimethoprim','bactrim','septra','smx','tmp'];
const NSAID_DRUGS       = ['ibuprofen','naproxen','ketorolac','meloxicam','celecoxib','indomethacin','toradol'];
const ASPIRIN_DRUGS     = ['aspirin','asa'];
const QT_DRUGS          = ['azithromycin','ciprofloxacin','haloperidol','ondansetron','methadone','amiodarone','sotalol','droperidol'];
const BLEED_PAIRS       = [['warfarin','aspirin'],['warfarin','ibuprofen'],['warfarin','ketorolac'],['heparin','aspirin']];
const BENZO_DRUGS       = ['lorazepam','diazepam','alprazolam','midazolam','clonazepam','ativan','valium'];
const OPIOID_DRUGS      = ['morphine','fentanyl','oxycodone','hydromorphone','codeine','tramadol','dilaudid'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const medMatch = (meds, drugList) =>
  meds.some(m => drugList.some(d => m.toLowerCase().includes(d)));

const allergyMatch = (allergies, terms) =>
  allergies.some(a => terms.some(t => a.toLowerCase().includes(t)));

// ─── ALERT COMPUTATION ────────────────────────────────────────────────────────
function computeAlerts(medications, allergies, vitals, pmhSelected, age, cc) {
  const meds   = (medications || []).map(String);
  const allgs  = (allergies   || []).map(String);
  const pmh    = pmhSelected  || {};
  const ageN   = parseFloat(age) || 0;
  const ccL    = (cc || '').toLowerCase();
  const alerts = [];

  const sbp    = parseFloat((vitals.bp || '').split('/')[0]);
  const hr     = parseFloat(vitals.hr);
  const spo2   = parseFloat(vitals.spo2);
  const temp   = parseFloat(vitals.temp);
  const rr     = parseFloat(vitals.rr);

  // ── CRITICAL ──────────────────────────────────────────────────────────────
  if (allergyMatch(allgs, ['penicillin','pcn','amoxicillin']) && medMatch(meds, PENICILLIN_DRUGS)) {
    alerts.push({ tier: 'critical', id: 'pcn-allergy', icon: '⚠', title: 'Penicillin allergy + β-lactam', body: 'Patient has documented penicillin allergy. Current medication list contains a β-lactam agent.' });
  }
  if (allergyMatch(allgs, ['sulfa','sulfamethoxazole','sulfonamide']) && medMatch(meds, SULFA_DRUGS)) {
    alerts.push({ tier: 'critical', id: 'sulfa-allergy', icon: '⚠', title: 'Sulfa allergy + sulfonamide', body: 'Documented sulfa allergy with a sulfonamide in the medication list.' });
  }
  if (allergyMatch(allgs, ['nsaid','ibuprofen','naproxen']) && medMatch(meds, NSAID_DRUGS)) {
    alerts.push({ tier: 'critical', id: 'nsaid-allergy', icon: '⚠', title: 'NSAID allergy + NSAID ordered', body: 'NSAID allergy documented. An NSAID appears in the current medication list.' });
  }
  if (allergyMatch(allgs, ['aspirin','asa']) && medMatch(meds, ASPIRIN_DRUGS)) {
    alerts.push({ tier: 'critical', id: 'asa-allergy', icon: '⚠', title: 'Aspirin allergy + ASA', body: 'Documented aspirin allergy with aspirin in the medication list.' });
  }

  if (!isNaN(sbp) && sbp < 90 && !isNaN(hr) && hr > 120) {
    alerts.push({ tier: 'critical', id: 'shock', icon: '🔴', title: 'Hemodynamic instability', body: `SBP ${vitals.bp} with HR ${vitals.hr} — consider shock assessment. Ensure IV access, fluid challenge, and early consult.` });
  }
  if (!isNaN(spo2) && spo2 < 88) {
    alerts.push({ tier: 'critical', id: 'hypoxia', icon: '🔴', title: 'Critical hypoxia', body: `SpO₂ ${vitals.spo2}% — below 88% threshold. Escalate oxygen delivery and consider airway intervention.` });
  }
  if (!isNaN(temp) && temp >= 40) {
    alerts.push({ tier: 'critical', id: 'hyperpyrexia', icon: '🔴', title: 'Hyperpyrexia ≥40°C', body: `Temperature ${vitals.temp}°C. Workup for CNS infection, heat stroke, or malignant hyperthermia.` });
  }

  // ── HIGH ──────────────────────────────────────────────────────────────────
  const infectionCC = /fever|infect|sepsis|pneumon|uti|cellul|abscess|chills/i.test(cc || '');
  const sirs = [
    (!isNaN(temp) && (temp > 38 || temp < 36)),
    (!isNaN(hr)   && hr   > 90),
    (!isNaN(rr)   && rr   > 20),
  ].filter(Boolean).length;
  if (infectionCC && sirs >= 2) {
    alerts.push({ tier: 'high', id: 'sepsis', icon: '🟡', title: 'SIRS criteria met', body: `${sirs}/3 SIRS criteria present with infectious CC. Consider sepsis workup: lactate, blood cultures, early antibiotics per protocol.` });
  }

  BLEED_PAIRS.forEach(([a, b]) => {
    const hasA = meds.some(m => m.toLowerCase().includes(a));
    const hasB = meds.some(m => m.toLowerCase().includes(b));
    if (hasA && hasB) {
      alerts.push({ tier: 'high', id: `bleed-${a}-${b}`, icon: '🟡', title: `${a.charAt(0).toUpperCase()+a.slice(1)} + ${b} — bleeding risk`, body: `This combination increases bleeding risk. Verify indication and consider GI prophylaxis if not present.` });
    }
  });

  const qtMeds = QT_DRUGS.filter(d => meds.some(m => m.toLowerCase().includes(d)));
  if (qtMeds.length >= 2) {
    alerts.push({ tier: 'high', id: 'qt-combo', icon: '🟡', title: 'Multiple QT-prolonging agents', body: `${qtMeds.slice(0,2).join(' + ')} — combination may prolong QTc. Consider baseline ECG.` });
  }

  if (pmh.asthma && meds.some(m => /metoprolol|atenolol|propranolol|carvedilol|labetalol/.test(m.toLowerCase()))) {
    alerts.push({ tier: 'high', id: 'asthma-bb', icon: '🟡', title: 'β-blocker with asthma history', body: 'Non-selective beta-blockers may precipitate bronchospasm. Use cardioselective agent with caution or consider alternative.' });
  }

  if (medMatch(meds, BENZO_DRUGS) && medMatch(meds, OPIOID_DRUGS)) {
    alerts.push({ tier: 'high', id: 'benzo-opioid', icon: '🟡', title: 'Benzodiazepine + opioid', body: 'FDA black-box warning: concurrent use increases risk of respiratory depression and death. Ensure monitoring.' });
  }

  // ── INFO ──────────────────────────────────────────────────────────────────
  if (allgs.length === 0) {
    alerts.push({ tier: 'info', id: 'no-allergies', icon: 'ℹ', title: 'Allergy status not documented', body: 'No allergies recorded. Document NKDA or specific allergies before prescribing.' });
  }

  if (ageN >= 65) {
    if (medMatch(meds, BENZO_DRUGS)) {
      alerts.push({ tier: 'info', id: 'beers-benzo', icon: 'ℹ', title: 'Beers: benzodiazepine in ≥65', body: 'Benzodiazepines increase fall and delirium risk in older adults. Consider alternative anxiolytic or tapering plan.' });
    }
    if (medMatch(meds, NSAID_DRUGS)) {
      alerts.push({ tier: 'info', id: 'beers-nsaid', icon: 'ℹ', title: 'Beers: NSAID in ≥65', body: 'NSAIDs increase GI bleed and renal risk in older adults. Consider acetaminophen or short course with PPI.' });
    }
  }

  if (/chest pain|cp|chest pressure/.test(ccL) && ageN >= 40) {
    alerts.push({ tier: 'info', id: 'acs-reminder', icon: 'ℹ', title: 'Chest pain ≥40y — ACS workup', body: 'Consider 12-lead ECG within 10 minutes, serial troponins, and early risk stratification (HEART score or TIMI).' });
  }

  if (/stroke|tia|facial droop|arm weak|slurred speech|sudden headache/.test(ccL)) {
    alerts.push({ tier: 'info', id: 'stroke-alert', icon: 'ℹ', title: 'Stroke symptoms — time-critical', body: 'LKW, NIHSS, and CT without contrast are time-sensitive. Activate stroke protocol if within window.' });
  }

  return alerts;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function CDSAlertsSidebar({ medications, allergies, vitals, pmhSelected, age, cc }) {
  const [dismissed, setDismissed] = useState(new Set());
  const [collapsed,  setCollapsed]  = useState(false);

  const allAlerts = useMemo(
    () => computeAlerts(medications, allergies, vitals, pmhSelected, age, cc),
    [medications, allergies, vitals, pmhSelected, age, cc]
  );

  const visible  = allAlerts.filter(a => !dismissed.has(a.id));
  const critical = visible.filter(a => a.tier === 'critical');
  const high     = visible.filter(a => a.tier === 'high');
  const info     = visible.filter(a => a.tier === 'info');

  if (visible.length === 0) return null;

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  return (
    <aside style={{
      width: collapsed ? 36 : 220,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--npi-bd)',
      background: 'rgba(5,10,22,.6)',
      transition: 'width .2s ease',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 10px', borderBottom: '1px solid var(--npi-bd)',
        flexShrink: 0, cursor: 'pointer',
      }} onClick={() => setCollapsed(c => !c)}>
        {critical.length > 0 && (
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff6b6b', flexShrink: 0, boxShadow: '0 0 6px rgba(255,107,107,.6)' }} />
        )}
        {!collapsed && (
          <>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--npi-txt4)', textTransform: 'uppercase', letterSpacing: '.08em', flex: 1 }}>
              CDS · {visible.length}
            </span>
            {critical.length > 0 && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: '#ff6b6b' }}>{critical.length}!</span>}
          </>
        )}
        <span style={{ fontSize: 10, color: 'var(--npi-txt4)', flexShrink: 0 }}>{collapsed ? '◂' : '▸'}</span>
      </div>

      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0', scrollbarWidth: 'none' }}>
          {[
            { list: critical, color: '#ff6b6b', bg: 'rgba(255,107,107,.06)', bd: 'rgba(255,107,107,.25)', label: 'Critical', dismissable: false },
            { list: high,     color: '#ff9f43', bg: 'rgba(255,159,67,.06)',  bd: 'rgba(255,159,67,.25)',  label: 'High',     dismissable: true  },
            { list: info,     color: '#3b9eff', bg: 'rgba(59,158,255,.06)',  bd: 'rgba(59,158,255,.2)',   label: 'Info',     dismissable: true  },
          ].map(({ list, color, bg, bd, label, dismissable }) => list.length > 0 && (
            <div key={label}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color, textTransform: 'uppercase', letterSpacing: '.1em', padding: '6px 10px 3px', opacity: .7 }}>
                {label}
              </div>
              {list.map(alert => (
                <div key={alert.id} style={{
                  margin: '3px 8px', padding: '8px 10px',
                  background: bg, border: `1px solid ${bd}`,
                  borderRadius: 7, position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1.3 }}>{alert.icon}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, color, lineHeight: 1.3, flex: 1 }}>
                      {alert.title}
                    </span>
                    {dismissable && (
                      <button onClick={() => dismiss(alert.id)} style={{
                        background: 'none', border: 'none', color: 'var(--npi-txt4)',
                        fontSize: 9, cursor: 'pointer', padding: 0, flexShrink: 0, lineHeight: 1,
                      }}>✕</button>
                    )}
                  </div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, color: 'var(--npi-txt3)', lineHeight: 1.5, margin: 0 }}>
                    {alert.body}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}