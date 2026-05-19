import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MEDICATION_DB, calcDose, formatMedOrder, isPediatric } from '@/lib/commandkit_data';

const T = {
  navyObsidian: '#060C19',
  commandBlue: '#0B1A30',
  signalCyan: '#12CCE6',
  clinicalWhite: '#E8F3FF',
  gold: '#C9A84C',
  danger: '#F05C5C',
  warning: '#F0A050',
  success: '#4CCFA8',
  muted: 'rgba(232,243,255,0.45)',
  border: 'rgba(18,204,230,0.22)',
  glass: 'rgba(11,26,48,0.88)',
  glassPrint: 'rgba(255,255,255,0.98)',
};

const S = {
  overlay: (C) => ({
    position: 'fixed', inset: 0, zIndex: 1200,
    background: C === 'print' ? 'rgba(0,0,0,0.15)' : 'rgba(6,12,25,0.6)',
    backdropFilter: 'blur(4px)',
  }),
  panel: (C) => ({
    position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
    background: C === 'print' ? T.glassPrint : T.glass,
    borderLeft: '1.5px solid rgba(18,204,230,0.22)',
    backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
    display: 'flex', flexDirection: 'column', zIndex: 1300,
    boxShadow: '-8px 0 48px rgba(0,0,0,0.55)',
    animation: 'qop-slide-in 0.22s cubic-bezier(0.22,1,0.36,1)',
  }),
  header: (C) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 20px 14px',
    borderBottom: '1px solid rgba(18,204,230,0.22)',
    background: C === 'print' ? 'rgba(12,26,48,0.06)' : 'rgba(18,204,230,0.04)',
  }),
  headerTitle: (C) => ({
    fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700,
    color: C === 'print' ? T.commandBlue : T.signalCyan,
    letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8,
  }),
  hubBadge: (C) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600,
    color: C === 'print' ? T.commandBlue : T.gold,
    background: C === 'print' ? 'rgba(12,26,48,0.08)' : 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.3)',
    borderRadius: 4, padding: '2px 7px', letterSpacing: '0.06em', textTransform: 'uppercase',
  }),
  closeBtn: (C) => ({
    background: 'transparent', border: 'none',
    color: C === 'print' ? '#666' : 'rgba(232,243,255,0.45)',
    cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6,
  }),
  body: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  sectionLabel: (C) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: C === 'print' ? '#888' : 'rgba(18,204,230,0.6)', marginBottom: 6,
  }),
  seedRow: (C) => ({
    background: C === 'print' ? 'rgba(12,26,48,0.04)' : 'rgba(18,204,230,0.04)',
    border: '1px solid rgba(18,204,230,0.22)', borderRadius: 10, padding: '12px 14px',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px',
  }),
  seedItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  seedKey: (C) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: C === 'print' ? '#aaa' : 'rgba(232,243,255,0.4)',
  }),
  seedVal: (C) => ({
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    color: C === 'print' ? T.commandBlue : T.clinicalWhite, fontWeight: 500,
  }),
  editableField: (C) => ({
    background: C === 'print' ? 'rgba(12,26,48,0.03)' : 'rgba(18,204,230,0.05)',
    border: '1px solid rgba(18,204,230,0.22)', borderRadius: 8,
    padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8,
  }),
  editableInput: (C) => ({
    background: 'transparent', border: 'none', outline: 'none',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    color: C === 'print' ? T.commandBlue : T.clinicalWhite, flex: 1, width: '100%',
  }),
  editableLabel: (C) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: C === 'print' ? '#999' : 'rgba(232,243,255,0.4)', whiteSpace: 'nowrap', minWidth: 54,
  }),
  allergyBanner: {
    background: 'rgba(240,92,92,0.12)', border: '1px solid rgba(240,92,92,0.35)',
    borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
  },
  allergyText: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#F05C5C', fontWeight: 600 },
  orderBox: (C, status) => ({
    background: status === 'ready'
      ? (C === 'print' ? 'rgba(76,207,168,0.06)' : 'rgba(76,207,168,0.07)')
      : (C === 'print' ? 'rgba(12,26,48,0.04)' : 'rgba(18,204,230,0.03)'),
    border: '1.5px solid ' + (status === 'ready' ? 'rgba(76,207,168,0.35)' : status === 'loading' ? 'rgba(18,204,230,0.2)' : 'rgba(18,204,230,0.22)'),
    borderRadius: 10, padding: '14px 16px', minHeight: 80, position: 'relative', transition: 'all 0.25s ease',
  }),
  orderText: (C) => ({
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7,
    color: C === 'print' ? T.commandBlue : T.clinicalWhite, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
  }),
  loadingDots: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' },
  dot: (i) => ({
    width: 7, height: 7, borderRadius: '50%', background: '#12CCE6',
    animation: 'qop-pulse 1.2s ease-in-out ' + (i * 0.2) + 's infinite', opacity: 0.7,
  }),
  warningsBox: (C) => ({
    background: 'rgba(240,160,80,0.08)', border: '1px solid rgba(240,160,80,0.3)',
    borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5,
  }),
  warningItem: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#F0A050',
    display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4,
  },
  footer: (C) => ({
    padding: '14px 20px', borderTop: '1px solid rgba(18,204,230,0.22)',
    display: 'flex', flexDirection: 'column', gap: 8,
    background: C === 'print' ? 'rgba(12,26,48,0.03)' : 'rgba(6,12,25,0.4)',
  }),
  btnRow: { display: 'flex', gap: 8 },
  btnPrimary: {
    background: 'linear-gradient(135deg, #12CCE6 0%, #0ea8c2 100%)',
    border: 'none', color: '#060C19',
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
    letterSpacing: '0.04em', padding: '9px 14px', borderRadius: 8,
    cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  btnSecondary: (C) => ({
    background: 'transparent', border: '1px solid rgba(18,204,230,0.22)',
    color: C === 'print' ? '#0B1A30' : '#E8F3FF',
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
    letterSpacing: '0.04em', padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  }),
  btnGhost: {
    background: 'transparent', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C',
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
    letterSpacing: '0.04em', padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  regenBtn: (C) => ({
    background: 'transparent', border: 'none',
    color: C === 'print' ? '#888' : 'rgba(18,204,230,0.5)',
    fontFamily: "'DM Sans', sans-serif", fontSize: 10, cursor: 'pointer',
    padding: '2px 4px', position: 'absolute', top: 8, right: 8,
    display: 'flex', alignItems: 'center', gap: 3,
  }),
  statusPill: (status) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: status === 'ready' ? '#4CCFA8' : status === 'loading' ? '#12CCE6' : 'rgba(232,243,255,0.45)',
    background: status === 'ready' ? 'rgba(76,207,168,0.12)' : status === 'loading' ? 'rgba(18,204,230,0.1)' : 'rgba(232,243,255,0.05)',
    border: '1px solid ' + (status === 'ready' ? 'rgba(76,207,168,0.3)' : status === 'loading' ? 'rgba(18,204,230,0.2)' : 'rgba(232,243,255,0.1)'),
    borderRadius: 20, padding: '2px 8px',
  }),
  disclaimer: (C) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 9,
    color: C === 'print' ? '#bbb' : 'rgba(232,243,255,0.25)',
    textAlign: 'center', letterSpacing: '0.04em',
  }),
};

const injectKeyframes = () => {
  if (document.getElementById('qop-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'qop-keyframes';
  style.textContent = `
    @keyframes qop-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes qop-pulse { 0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; } 40% { transform: scale(1.1); opacity: 1; } }
    @keyframes qop-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(style);
};

function EditableField({ label, value, onChange, C }) {
  return (
    <div style={S.editableField(C)}>
      <span style={S.editableLabel(C)}>{label}</span>
      <input type='text' value={value} onChange={(e) => onChange(e.target.value)} style={S.editableInput(C)} spellCheck={false} />
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={S.loadingDots}>
      {[0, 1, 2].map(i => <div key={i} style={S.dot(i)} />)}
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#12CCE6', opacity: 0.7, marginLeft: 4 }}>Generating order...</span>
    </div>
  );
}

// ─── COMMANDKIT LOOKUP ───────────────────────────────────────────────────────
function findDrugInDB(medName) {
  if (!medName) return null;
  const q = medName.toLowerCase().trim();
  return Object.values(MEDICATION_DB).find(d =>
    d.name.toLowerCase().includes(q) ||
    (d.genericName || '').toLowerCase().includes(q) ||
    (d.brandName || '').toLowerCase().includes(q) ||
    d.id.toLowerCase().includes(q)
  ) || null;
}

function seedFromCommandKit(drug, weightKg, ageYears) {
  if (!drug?.doses?.length) return {};
  const peds = isPediatric(ageYears, weightKg);
  const doses = calcDose(drug, weightKg, peds);
  const d = doses[0];
  const doseStr = d.calculatedDose != null
    ? `${d.calculatedDose} ${d.calculatedUnit}${d.cappedAtMax ? ' [MAX]' : ''}`
    : d.display || (d.flatDose ? `${d.flatDose} ${d.unit}` : '');
  const route = d.route?.[0] || '';
  const rate = d.rate ? `over ${d.rate}` : '';
  const notes = [d.notes, rate].filter(Boolean).join(' | ');
  return { dose: doseStr, route, notes };
}

export default function QuickOrderPanel({ orderSeed, patientContext = {}, hubName = '', onClose, onOrderToNote, C = 'dark' }) {
  useEffect(() => { injectKeyframes(); }, []);

  // Auto-populate from CommandKit data
  const ckDrug = findDrugInDB(orderSeed.medication || '');
  const ckSeed = ckDrug ? seedFromCommandKit(ckDrug, patientContext.weight, patientContext.age) : {};

  const [med,   setMed]   = useState(orderSeed.medication || '');
  const [dose,  setDose]  = useState(orderSeed.dose  || ckSeed.dose  || '');
  const [route, setRoute] = useState(orderSeed.route || ckSeed.route || '');
  const [freq,  setFreq]  = useState(orderSeed.frequency || '');
  const [notes, setNotes] = useState(orderSeed.notes || ckSeed.notes || '');
  const [orderText, setOrderText] = useState('');
  const [warnings,  setWarnings]  = useState([]);
  const [status,    setStatus]    = useState('idle');
  const [copied,    setCopied]    = useState(false);
  const [sentToNote, setSentToNote] = useState(false);
  const panelRef = useRef(null);

  const allergyFlag = useCallback(() => {
    if (!patientContext.allergies) return null;
    const allergies = Array.isArray(patientContext.allergies) ? patientContext.allergies : [patientContext.allergies];
    const medLower = med.toLowerCase();
    return allergies.find(a => { const al = (a || '').toLowerCase(); return al && medLower.includes(al.split(' ')[0]); }) || null;
  }, [med, patientContext.allergies]);

  const generateOrder = useCallback(async () => {
    if (!med) return;
    setStatus('loading');
    setOrderText('');
    setWarnings([]);
    const ptSummary = [
      patientContext.age     ? 'Age: ' + patientContext.age : '',
      patientContext.weight  ? 'Weight: ' + patientContext.weight : '',
      patientContext.renal   ? 'Renal: ' + patientContext.renal : '',
      patientContext.hepatic ? 'Hepatic: ' + patientContext.hepatic : '',
      patientContext.pregnant === true ? 'PREGNANT' : '',
      patientContext.allergies ? 'Allergies: ' + (Array.isArray(patientContext.allergies) ? patientContext.allergies.join(', ') : patientContext.allergies) : '',
    ].filter(Boolean).join(' | ');
    try {
      const currentDrug = findDrugInDB(med);
      const ckContext = currentDrug
        ? `\nCOMMANDKIT REFERENCE:\n- Doses: ${currentDrug.doses?.map(d => d.label + ': ' + (d.display || (d.flatDose ? d.flatDose + ' ' + d.unit : (d.mgPerKg + ' ' + d.unit + '/kg'))) + (d.route ? ' ' + d.route.join('/') : '')).join('; ')}\n- Warnings: ${(currentDrug.warnings || []).join('; ') || 'none'}\n- Contraindications: ${(currentDrug.contraindications || []).join('; ') || 'none'}`
        : '';
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'You are a clinical pharmacist in an ED CDSS. Generate a precise ED medication order.\nMEDICATION: ' + med + '\nDOSE: ' + (dose || 'standard ED dose') + '\nROUTE: ' + (route || 'IV') + '\nFREQUENCY: ' + (freq || 'once') + '\nINDICATION: ' + (orderSeed.indication || 'ED management') + '\nNOTES: ' + (notes || 'none') + '\nPATIENT CONTEXT: ' + (ptSummary || 'adult, no context provided') + ckContext + '\n\nReturn JSON only. No preamble. No markdown.',
        response_json_schema: {
          type: 'object',
          properties: {
            order_line: { type: 'string' },
            full_order:  { type: 'string' },
            warnings:    { type: 'array', items: { type: 'string' } },
            alternative: { type: 'string' },
          },
          required: ['order_line', 'full_order', 'warnings'],
        },
      });
      setOrderText(result.full_order || result.order_line || 'Order generated.');
      setWarnings(result.warnings || []);
      setStatus('ready');
    } catch (err) {
      setOrderText('Order generation failed. Try again.');
      setStatus('error');
    }
  }, [med, dose, route, freq, notes, orderSeed.indication, patientContext]);

  useEffect(() => { generateOrder(); }, []);

  const handleCopy = useCallback(() => {
    if (!orderText) return;
    navigator.clipboard.writeText(orderText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  }, [orderText]);

  const handleToNote = useCallback(() => {
    if (!orderText || !onOrderToNote) return;
    onOrderToNote(orderText);
    setSentToNote(true);
    setTimeout(() => setSentToNote(false), 2200);
  }, [orderText, onOrderToNote]);

  const handleOverlayClick = useCallback((e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
  }, [onClose]);

  const flag = allergyFlag();

  return (
    <div style={S.overlay(C)} onClick={handleOverlayClick}>
      <div ref={panelRef} style={S.panel(C)}>
        <div style={S.header(C)}>
          <div style={S.headerTitle(C)}>
            <span style={{ fontSize: 15 }}>⚡</span>
            Quick Order
            {hubName && <span style={S.hubBadge(C)}>{hubName}</span>}
          </div>
          <button style={S.closeBtn(C)} onClick={onClose}>✕</button>
        </div>
        <div style={S.body}>
          {flag && (
            <div style={S.allergyBanner}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={S.allergyText}>ALLERGY FLAG: {flag}</span>
            </div>
          )}
          {ckDrug && (
            <div style={{ background: 'rgba(18,204,230,0.05)', border: '1px solid rgba(18,204,230,0.2)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(18,204,230,0.6)', marginBottom: 5 }}>
                CommandKit Reference
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {ckDrug.doses?.map((d, i) => (
                  <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.clinicalWhite, lineHeight: 1.5 }}>
                    <span style={{ color: T.signalCyan }}>{d.label}: </span>
                    {d.display || (d.flatDose ? `${d.flatDose} ${d.unit}` : `${d.mgPerKg} ${d.unit}/kg`)}
                    {d.route ? ' · ' + d.route.join('/') : ''}
                    {d.rate ? ' · ' + d.rate : ''}
                  </div>
                ))}
                {ckDrug.warnings?.map((w, i) => (
                  <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: T.warning }}>⚠ {w}</div>
                ))}
                {ckDrug.isPanic && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: T.danger, fontWeight: 600 }}>
                    🚨 {ckDrug.panicReason}
                  </div>
                )}
              </div>
            </div>
          )}
          <div>
            <div style={S.sectionLabel(C)}>Order Details</div>
            <div style={S.seedRow(C)}>
              {[['Medication', med], ['Dose', dose], ['Route', route], ['Frequency', freq]].filter(f => f[1]).map(([k, v]) => (
                <div key={k} style={S.seedItem}>
                  <span style={S.seedKey(C)}>{k}</span>
                  <span style={S.seedVal(C)}>{v}</span>
                </div>
              ))}
              {orderSeed.indication && (
                <div style={{ gridColumn: '1 / -1', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={S.seedKey(C)}>Indication</span>
                  <div style={{ ...S.seedVal(C), color: T.gold, marginTop: 2 }}>{orderSeed.indication}</div>
                </div>
              )}
            </div>
          </div>
          <div>
            <div style={S.sectionLabel(C)}>Override / Adjust</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <EditableField label='Drug'  value={med}   onChange={setMed}   C={C} />
              <EditableField label='Dose'  value={dose}  onChange={setDose}  C={C} />
              <EditableField label='Route' value={route} onChange={setRoute} C={C} />
              <EditableField label='Freq'  value={freq}  onChange={setFreq}  C={C} />
              <EditableField label='Notes' value={notes} onChange={setNotes} C={C} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={S.sectionLabel(C)}>Generated Order</div>
              <span style={S.statusPill(status)}>
                {status === 'loading' ? '● Generating' : status === 'ready' ? '✓ Ready' : status === 'error' ? '✕ Error' : '○ Idle'}
              </span>
            </div>
            <div style={S.orderBox(C, status)}>
              {status === 'loading' ? <LoadingDots /> : (
                <>
                  <button style={S.regenBtn(C)} onClick={generateOrder}>↻ Regen</button>
                  <pre style={{ ...S.orderText(C), animation: status === 'ready' ? 'qop-fade-in 0.3s ease' : 'none' }}>
                    {orderText || 'Order will appear here...'}
                  </pre>
                </>
              )}
            </div>
          </div>
          {warnings.length > 0 && (
            <div>
              <div style={S.sectionLabel(C)}>Clinical Flags</div>
              <div style={S.warningsBox(C)}>
                {warnings.map((w, i) => (
                  <div key={i} style={S.warningItem}><span style={{ marginTop: 1 }}>⚠</span><span>{w}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={S.footer(C)}>
          <div style={S.btnRow}>
            <button style={S.btnPrimary} onClick={handleCopy} disabled={!orderText || status === 'loading'}>
              {copied ? '✓ Copied!' : '📋 Copy Order'}
            </button>
            {onOrderToNote && (
              <button style={S.btnGhost} onClick={handleToNote} disabled={!orderText || status === 'loading'}>
                {sentToNote ? '✓ Sent' : '📝 → Note'}
              </button>
            )}
            <button style={S.btnSecondary(C)} onClick={generateOrder} disabled={status === 'loading'}>↻</button>
          </div>
          <div style={S.disclaimer(C)}>AI-generated — verify before entry · Notrya AI · Physician use only</div>
        </div>
      </div>
    </div>
  );
}

export function useQuickOrder() {
  const [activeOrder, setActiveOrder] = useState(null);
  const openOrder  = useCallback((seed) => setActiveOrder(seed), []);
  const closeOrder = useCallback(()     => setActiveOrder(null), []);
  return { activeOrder, openOrder, closeOrder };
}

export function QuickOrderButton({ seed, onOpen, size = 'sm', C = 'dark' }) {
  return (
    <button
      onClick={() => onOpen(seed)}
      style={{
        background: 'rgba(18,204,230,0.08)', border: '1px solid rgba(18,204,230,0.25)',
        borderRadius: size === 'sm' ? 6 : 8, color: '#12CCE6',
        fontFamily: "'DM Sans', sans-serif", fontSize: size === 'sm' ? 10 : 12, fontWeight: 700,
        letterSpacing: '0.05em', padding: size === 'sm' ? '3px 8px' : '6px 12px',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: size === 'sm' ? 9 : 11 }}>⚡</span>Order
    </button>
  );
}