import { useState, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const T = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', gold:'#f5c842',
  coral:'#ff6b6b', orange:'#ff9f43',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const RISK_MAP = {
  high: { color: T.coral, bg: 'rgba(255,107,107,.12)', border: 'rgba(255,107,107,.3)', label: 'HIGH RISK' },
  mod:  { color: T.orange, bg: 'rgba(255,159,67,.12)', border: 'rgba(255,159,67,.3)', label: 'MOD RISK' },
  low:  { color: T.teal, bg: 'rgba(0,229,192,.08)', border: 'rgba(0,229,192,.2)', label: '' },
};

const CATEGORIES = [
  { id: 'wound',     name: 'Wound & Soft Tissue', icon: '🩹', color: '#3b9eff' },
  { id: 'airway',    name: 'Airway',              icon: '🌬️', color: '#ff6b6b' },
  { id: 'vascular',  name: 'Vascular Access',     icon: '💉', color: '#9b6dff' },
  { id: 'thoracic',  name: 'Thoracic',            icon: '🫁', color: '#ff9f43' },
  { id: 'ortho',     name: 'Orthopedic',          icon: '🦴', color: '#00e5c0' },
  { id: 'cardiac',   name: 'Cardiac',             icon: '❤️', color: '#e05555' },
  { id: 'procedure', name: 'Procedures',          icon: '🩺', color: '#00d4ff' },
  { id: 'ent',       name: 'ENT & Eye',           icon: '👃', color: '#f5c842' },
  { id: 'nerve',     name: 'Nerve Blocks',        icon: '🦵', color: '#3dffa0' },
  { id: 'gu',        name: 'Genitourinary',       icon: '🔵', color: '#00b4d8' },
  { id: 'trauma',    name: 'Trauma & Critical',   icon: '⚡', color: '#ff6b6b' },
];

const inputBase = {
  background: T.up, border: `1px solid ${T.border}`, borderRadius: 6,
  padding: '7px 10px', color: T.txt, fontFamily: "'DM Sans', sans-serif",
  fontSize: 13, outline: 'none', width: '100%',
};

function FieldLabel({ field }) {
  return (
    <div style={{ fontSize: 9, color: T.txt3, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>
      {field.label}{field.required && <span style={{ color: T.coral, fontSize: 8, marginLeft: 3 }}>*</span>}
    </div>
  );
}

function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'input') return (
    <div><FieldLabel field={field} /><input style={inputBase} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} /></div>
  );
  if (field.type === 'textarea') return (
    <div><FieldLabel field={field} /><textarea style={{ ...inputBase, resize: 'vertical', minHeight: 70, lineHeight: 1.5 }} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} /></div>
  );
  if (field.type === 'select') return (
    <div><FieldLabel field={field} /><select style={{ ...inputBase, cursor: 'pointer' }} value={value || ''} onChange={e => onChange(e.target.value)}><option value="">Select…</option>{(field.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}</select></div>
  );
  if (field.type === 'chips') {
    const selected = Array.isArray(value) ? value : (field.defaults || []);
    return (
      <div><FieldLabel field={field} /><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{(field.options || []).map(opt => {
        const on = selected.includes(opt);
        return <div key={opt} onClick={() => onChange(on ? selected.filter(x => x !== opt) : [...selected, opt])} style={{ padding: '4px 11px', borderRadius: 20, cursor: 'pointer', fontSize: 12, border: `1px solid ${on ? T.blue : T.border}`, background: on ? 'rgba(59,158,255,.12)' : 'transparent', color: on ? T.blue : T.txt2, userSelect: 'none' }}>{opt}</div>;
      })}</div></div>
    );
  }
  return null;
}

function SectionRenderer({ section, formData, updateField }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10 }}>
      <div style={{ padding: '10px 16px', background: T.up, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{section.icon}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: T.txt, letterSpacing: '.05em', textTransform: 'uppercase' }}>{section.title}</span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {section.warning && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(255,107,107,.07)', border: '1px solid rgba(255,107,107,.25)', color: T.coral, display: 'flex', gap: 8 }}><span>⚠️</span><span>{section.warning}</span></div>}
        {(section.fields || []).map(field => <FieldRenderer key={field.id} field={field} value={formData[field.id]} onChange={val => updateField(field.id, val)} />)}
      </div>
    </div>
  );
}

function StarButton({ active, onClick }) {
  return (
    <div onClick={e => { e.stopPropagation(); onClick(); }} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0, color: active ? T.gold : T.txt4, textShadow: active ? '0 0 8px rgba(245,200,66,.5)' : 'none', background: active ? 'rgba(245,200,66,.08)' : 'transparent', border: `1px solid ${active ? 'rgba(245,200,66,.2)' : 'transparent'}` }}>
      {active ? '★' : '☆'}
    </div>
  );
}

export default function EDProcedureNotes({ embedded = false, patientName = '', patientAllergies = '', physicianName = '' }) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['procedureTemplates'],
    queryFn: () => base44.entities.ProcedureTemplate.list(),
  });

  const [view, setView] = useState('select');
  const [activeCat, setActiveCat] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [formData, setFormData] = useState({});
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notrya_proc_favs') || '[]'); } catch { return []; }
  });
  const [ctx, setCtx] = useState({
    physician: physicianName || '',
    date: new Date().toISOString().slice(0, 10),
    allergies: patientAllergies || '',
  });

  const selectedTemplate = useMemo(() => templates.find(t => t.key === selectedKey), [templates, selectedKey]);
  const catTemplates = useMemo(() => activeCat ? templates.filter(t => t.category === activeCat) : [], [templates, activeCat]);
  const favTemplates = useMemo(() => favorites.map(k => templates.find(t => t.key === k)).filter(Boolean), [favorites, templates]);
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return templates.filter(t => t.name?.toLowerCase().includes(q) || t.subtitle?.toLowerCase().includes(q));
  }, [templates, search]);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500); };

  const toggleFav = useCallback((key) => {
    setFavorites(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key];
      localStorage.setItem('notrya_proc_favs', JSON.stringify(next));
      return next;
    });
  }, []);

  const selectProc = useCallback((key) => {
    setSelectedKey(key); setFormData({}); setNoteText(''); setView('document'); setSearch('');
  }, []);

  const updateField = useCallback((id, val) => setFormData(prev => ({ ...prev, [id]: val })), []);

  const goHome = useCallback(() => { setActiveCat(null); setSelectedKey(null); setView('select'); }, []);

  const generateNote = useCallback(async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    setView('note');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `You are an expert ED physician generating a formal procedure note.

PATIENT: New Patient | MRN: PT-4-471-8820 | 67 y/o Male
DATE: ${ctx.date}
ATTENDING: ${ctx.physician || '[Physician Name, MD]'}
ALLERGIES: ${ctx.allergies || 'NKDA'}
PROCEDURE: ${selectedTemplate.name}

FORM DATA:
${JSON.stringify(formData, null, 2)}

Write a formal, professional procedure note. Use ALL CAPS section headers. Write in third-person past tense. Use professional prose paragraphs — no bullet points. Include all documented details. Do not invent data not provided. End with a signature line.`
      });
      setNoteText(typeof result === 'string' ? result : JSON.stringify(result));
    } catch {
      const lines = ['PROCEDURE NOTE', '═══════════════════════════════════════',
        'Patient: New Patient | MRN: PT-4-471-8820', `Date: ${ctx.date} | Attending: ${ctx.physician || '[Physician]'}`,
        `Allergies: ${ctx.allergies || 'NKDA'}`, '', `PROCEDURE: ${selectedTemplate.name.toUpperCase()}`,
        '───────────────────────────────────────', ''];
      (selectedTemplate.sections || []).forEach(sec => {
        lines.push(sec.title.toUpperCase());
        (sec.fields || []).forEach(f => {
          const v = formData[f.id];
          if (v && f.label) lines.push(`${f.label}: ${Array.isArray(v) ? v.join(', ') : v}`);
        });
        lines.push('');
      });
      lines.push('COMPLICATIONS: None noted.', '', 'Patient tolerated procedure well.', '',
        '───────────────────────────────────────', `Signed: ${ctx.physician || '[Physician]'}`, `Date/Time: ${new Date().toLocaleString()}`);
      setNoteText(lines.join('\n'));
    }
    setGenerating(false);
  }, [selectedTemplate, formData, ctx]);

  const saveNote = useCallback(async () => {
    if (!selectedTemplate || !noteText) return;
    setSaving(true);
    try {
      await base44.entities.ProcedureLog.create({
        patient_name: 'New Patient', patient_id: 'PT-4-471-8820',
        procedure_name: selectedTemplate.name, date_performed: new Date().toISOString(),
        operator: ctx.physician, technique: noteText.slice(0, 500),
        outcome: 'successful', status: 'completed',
      });
      showToast('Saved to chart ✓');
    } catch { showToast('Save failed'); }
    setSaving(false);
  }, [selectedTemplate, noteText, ctx]);

  const copyNote = useCallback(() => {
    navigator.clipboard.writeText(noteText).then(() => showToast('Copied!')).catch(() => showToast('Failed'));
  }, [noteText]);

  const btn = (label, onClick, opts = {}) => (
    <button onClick={onClick} disabled={opts.disabled} style={{
      background: opts.primary ? T.teal : opts.blue ? T.blue : T.up,
      color: opts.primary ? T.bg : opts.blue ? 'white' : T.txt2,
      border: opts.primary || opts.blue ? 'none' : `1px solid ${T.border}`,
      borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: opts.primary || opts.blue ? 600 : 400,
      cursor: 'pointer', opacity: opts.disabled ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif",
    }}>{label}</button>
  );

  return (
    <div style={{ background: embedded ? 'transparent' : T.bg, minHeight: embedded ? 'unset' : '100vh', color: T.txt, fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <div style={{ maxWidth: embedded ? 'none' : 1100, margin: embedded ? 0 : '0 auto', padding: embedded ? 0 : '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header — hidden when embedded */}
        {!embedded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>✂️</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: T.txt }}>ED Procedure Notes</div>
              <div style={{ fontSize: 12, color: T.txt3, marginTop: 1 }}>Select a category, then document your procedure</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, background: T.up, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px' }}>
          <span style={{ fontSize: 14, color: T.txt3 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} onFocus={() => {}} placeholder={isLoading ? 'Loading templates…' : `Search ${templates.length} procedures… ⌘K`}
            style={{ flex: 1, background: 'none', border: 'none', color: T.txt, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
          {search && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, maxHeight: 300, overflowY: 'auto', zIndex: 50, boxShadow: '0 12px 40px rgba(0,0,0,.4)' }}>
              {searchResults.slice(0, 8).map(t => (
                <div key={t.key} onClick={() => selectProc(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', borderBottom: `1px solid rgba(26,53,85,.3)` }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{t.icon}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: T.txt }}>{t.name}</div><div style={{ fontSize: 11, color: T.txt3 }}>{t.subtitle}</div></div>
                  <StarButton active={favorites.includes(t.key)} onClick={() => toggleFav(t.key)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorites */}
        {favTemplates.length > 0 && view === 'select' && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>⭐</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.gold, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, flexShrink: 0 }}>Favorites</span>
            <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px', flexShrink: 0 }} />
            {favTemplates.map(t => (
              <div key={t.key} onClick={() => selectProc(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', background: T.up, border: `1px solid ${T.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                <span style={{ fontSize: 12, color: T.txt, fontWeight: 500 }}>{t.name}</span>
                <span onClick={e => { e.stopPropagation(); toggleFav(t.key); }} style={{ fontSize: 12, color: T.gold, cursor: 'pointer' }}>★</span>
              </div>
            ))}
          </div>
        )}

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.txt3 }}>
          <span onClick={goHome} style={{ cursor: 'pointer', color: T.txt2 }}>Categories</span>
          {activeCat && <><span style={{ color: T.txt4 }}>›</span><span onClick={() => { setSelectedKey(null); setView('select'); }} style={{ cursor: 'pointer', color: selectedKey ? T.txt2 : T.txt }}>{CATEGORIES.find(c => c.id === activeCat)?.name}</span></>}
          {selectedTemplate && <><span style={{ color: T.txt4 }}>›</span><span style={{ color: T.txt, fontWeight: 500 }}>{selectedTemplate.name}</span></>}
        </div>

        {/* ── SELECT: CATEGORY GRID ── */}
        {view === 'select' && !activeCat && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
            {CATEGORIES.map(cat => {
              const count = templates.filter(t => t.category === cat.id).length;
              return (
                <div key={cat.id} onClick={() => setActiveCat(cat.id)} style={{ position: 'relative', borderRadius: 14, cursor: 'pointer', border: `1.5px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 10px 14px', gap: 8, background: T.card, transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 100, height: 60, borderRadius: '50%', filter: 'blur(30px)', opacity: .22, background: cat.color, pointerEvents: 'none' }} />
                  <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${cat.color}18`, border: `1px solid ${cat.color}40`, fontSize: 26, zIndex: 1 }}>{cat.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.txt, textAlign: 'center', zIndex: 1, lineHeight: 1.3 }}>{cat.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt3, background: T.up, border: `1px solid ${T.border}`, borderRadius: 10, padding: '1px 7px', zIndex: 1 }}>{count}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SELECT: PROCEDURE LIST ── */}
        {view === 'select' && activeCat && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>{CATEGORIES.find(c => c.id === activeCat)?.icon}</span>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>{CATEGORIES.find(c => c.id === activeCat)?.name}</div>
              <span style={{ fontSize: 11, color: T.txt3 }}>{catTemplates.length} procedure{catTemplates.length !== 1 ? 's' : ''}</span>
            </div>
            {catTemplates.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: T.txt3, border: `1px dashed ${T.border}`, borderRadius: 10 }}>No procedures in this category yet.</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
              {catTemplates.map(t => {
                const r = RISK_MAP[t.risk] || RISK_MAP.low;
                return (
                  <div key={t.key} onClick={() => selectProc(t.key)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = T.up; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.txt }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: T.txt3, marginTop: 1 }}>{t.subtitle}</div>
                    </div>
                    {r.label && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: r.bg, color: r.color, border: `1px solid ${r.border}`, flexShrink: 0 }}>{r.label}</span>}
                    <StarButton active={favorites.includes(t.key)} onClick={() => toggleFav(t.key)} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── DOCUMENT VIEW ── */}
        {view === 'document' && selectedTemplate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{selectedTemplate.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedTemplate.name}
                  <StarButton active={favorites.includes(selectedKey)} onClick={() => toggleFav(selectedKey)} />
                </div>
                <div style={{ fontSize: 12, color: T.txt3 }}>{selectedTemplate.subtitle}</div>
              </div>
              {btn('← Back', () => { setSelectedKey(null); setView('select'); })}
            </div>

            {/* Physician context */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <div style={{ padding: '10px 16px', background: T.up, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>👤</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: T.txt, letterSpacing: '.05em', textTransform: 'uppercase' }}>Physician & Encounter</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[['Physician', 'physician', 'text', 'Dr. Smith, MD'], ['Date', 'date', 'date', ''], ['Allergies', 'allergies', 'text', 'Penicillin']].map(([lbl, key, type, ph]) => (
                  <div key={key}>
                    <div style={{ fontSize: 9, color: T.txt3, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{lbl}</div>
                    <input type={type} style={{ ...inputBase, fontFamily: type === 'date' ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif", fontSize: type === 'date' ? 12 : 13, colorScheme: 'dark' }} value={ctx[key]} onChange={e => setCtx(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
                  </div>
                ))}
              </div>
            </div>

            {/* Sections */}
            {(selectedTemplate.sections || []).map((sec, i) => (
              <SectionRenderer key={i} section={sec} formData={formData} updateField={updateField} />
            ))}

            {/* Tips */}
            {selectedTemplate.tips && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, lineHeight: 1.6, background: 'rgba(245,200,66,.06)', border: '1px solid rgba(245,200,66,.2)', color: T.gold, display: 'flex', gap: 8 }}>
                <span>⚠</span><div><strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.1em', display: 'block', marginBottom: 2 }}>KEY REMINDERS</strong>{selectedTemplate.tips}</div>
              </div>
            )}

            <button onClick={generateNote} disabled={generating} style={{ background: T.teal, color: T.bg, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', opacity: generating ? 0.6 : 1 }}>
              {generating ? '⏳ Generating…' : '✦ Generate Procedure Note'}
            </button>
          </div>
        )}

        {/* ── NOTE VIEW ── */}
        {view === 'note' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600 }}>Generated Note</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {btn('↺ Regen', generateNote, { disabled: generating })}
                {btn('📋 Copy', copyNote, { primary: true })}
                {btn('💾 Save to Chart', saveNote, { blue: true, disabled: saving || !noteText })}
                {btn('← Edit', () => setView('document'))}
              </div>
            </div>
            {generating ? (
              <div style={{ textAlign: 'center', padding: 48, color: T.txt3 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 13, color: T.txt2 }}>AI is crafting your procedure note…</div>
              </div>
            ) : (
              <>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                  <div style={{ padding: '9px 16px', background: T.up, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.txt3 }}>{selectedTemplate?.icon} {selectedTemplate?.name}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.txt4 }}>~{noteText.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                  <div contentEditable suppressContentEditableWarning onInput={e => setNoteText(e.currentTarget.innerText)} style={{ padding: '22px 26px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8, color: T.txt, whiteSpace: 'pre-wrap', minHeight: 300, outline: 'none' }}>{noteText}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(59,158,255,.06)', border: '1px solid rgba(59,158,255,.2)', color: T.txt2, display: 'flex', gap: 8 }}>
                  <span>✏️</span><span>Fully editable. Verify all details against clinical findings before signing.</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}