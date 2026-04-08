import { useState, useRef, useEffect, useCallback } from 'react';

// ─── PMH DATA ─────────────────────────────────────────────────────────────────
const PMH_GROUPS = [
  { key:'cardio', label:'Cardiovascular', icon:'❤️', items:[
    {id:'htn',      label:'Hypertension'},
    {id:'cad',      label:'CAD / Angina'},
    {id:'mi',       label:'Prior MI'},
    {id:'chf',      label:'CHF / HFrEF'},
    {id:'afib',     label:'Atrial fibrillation'},
    {id:'stroke',   label:'Stroke / TIA'},
    {id:'dvt',      label:'DVT / PE'},
    {id:'pvd',      label:'Peripheral vascular disease'},
    {id:'pacer',    label:'Pacemaker / ICD'},
  ]},
  { key:'endo', label:'Endocrine / Metabolic', icon:'🔬', items:[
    {id:'dm1',      label:'DM Type 1'},
    {id:'dm2',      label:'DM Type 2'},
    {id:'hypothyroid',label:'Hypothyroidism'},
    {id:'hyperthyroid',label:'Hyperthyroidism'},
    {id:'obesity',  label:'Obesity'},
    {id:'hyperlipid',label:'Hyperlipidemia'},
    {id:'adrenal',  label:'Adrenal insufficiency'},
  ]},
  { key:'pulm', label:'Pulmonary', icon:'🫁', items:[
    {id:'asthma',   label:'Asthma'},
    {id:'copd',     label:'COPD'},
    {id:'osa',      label:'OSA'},
    {id:'pulm_htn', label:'Pulmonary hypertension'},
    {id:'ild',      label:'ILD / Fibrosis'},
  ]},
  { key:'renal', label:'Renal', icon:'🫘', items:[
    {id:'ckd',      label:'CKD'},
    {id:'esrd',     label:'ESRD on HD'},
    {id:'renal_tx', label:'Renal transplant'},
    {id:'nephroliths',label:'Nephrolithiasis'},
  ]},
  { key:'gi', label:'GI / Liver', icon:'🫃', items:[
    {id:'gerd',     label:'GERD / PUD'},
    {id:'ibd',      label:'IBD (Crohn / UC)'},
    {id:'cirrhosis',label:'Cirrhosis'},
    {id:'nafld',    label:'NAFLD'},
    {id:'hepb',     label:'Hepatitis B'},
    {id:'hepc',     label:'Hepatitis C'},
    {id:'panc',     label:'Chronic pancreatitis'},
  ]},
  { key:'neuro', label:'Neurological', icon:'🧠', items:[
    {id:'seizure',  label:'Seizure disorder'},
    {id:'ms',       label:'Multiple sclerosis'},
    {id:'parkinsons',label:"Parkinson's disease"},
    {id:'dementia', label:"Dementia / Alzheimer's"},
    {id:'migraine', label:'Migraines'},
  ]},
  { key:'psych', label:'Psychiatric', icon:'💭', items:[
    {id:'depression',label:'Depression'},
    {id:'anxiety',  label:'Anxiety disorder'},
    {id:'bipolar',  label:'Bipolar disorder'},
    {id:'schizo',   label:'Schizophrenia'},
    {id:'ptsd',     label:'PTSD'},
    {id:'sud',      label:'Substance use disorder'},
  ]},
  { key:'heme', label:'Heme / Oncology', icon:'🩸', items:[
    {id:'anemia',   label:'Anemia'},
    {id:'coagulopathy',label:'Coagulopathy / bleeding disorder'},
    {id:'cancer',   label:'Active malignancy'},
    {id:'anticoag', label:'On anticoagulation'},
    {id:'immunosuppressed',label:'Immunosuppressed'},
    {id:'hiv',      label:'HIV / AIDS'},
  ]},
];

const ALL_PMH_ITEMS = PMH_GROUPS.flatMap(g => g.items);

const MED_SUGGESTIONS = [
  'Acetaminophen','Amoxicillin','Amlodipine','Aspirin','Atorvastatin',
  'Carvedilol','Cephalexin','Ciprofloxacin','Clopidogrel',
  'Doxycycline','Eliquis (apixaban)','Furosemide',
  'Hydrochlorothiazide','Hydrocodone','Hydroxyzine',
  'Ibuprofen','Insulin glargine','Insulin lispro','Lisinopril',
  'Losartan','Metformin','Metoprolol succinate','Metoprolol tartrate',
  'Morphine','Naproxen','Omeprazole','Ondansetron','Oxycodone',
  'Prednisone','Sertraline','Tramadol','Warfarin','Xarelto (rivaroxaban)',
];

const ALLERGY_SUGGESTIONS = [
  'NKDA','Penicillin','Amoxicillin','Cephalosporins','Sulfonamides',
  'Fluoroquinolones','Aspirin','NSAIDs','Ibuprofen','Naproxen',
  'Morphine','Codeine','Hydrocodone','Tramadol',
  'Contrast dye','Latex','Shellfish','Tree nuts',
  'ACE inhibitors','Statins',
];

const SECTIONS = [
  { id:'meds',    label:'Medications', icon:'💊' },
  { id:'allergy', label:'Allergies',   icon:'⚠️' },
  { id:'pmh',     label:'PMH',         icon:'📋' },
  { id:'social',  label:'Social Hx',  icon:'👥' },
];

const FL = { fontSize:10, color:'var(--npi-txt4)', fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', letterSpacing:'.08em', marginBottom:5 };
const IS = { width:'100%', padding:'9px 12px', boxSizing:'border-box', background:'rgba(255,255,255,.05)', border:'1px solid rgba(59,130,246,.2)', borderRadius:8, color:'#e2e8f0', fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:'none' };

function KK({ ch }) {
  return <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-blue)', background:'rgba(59,158,255,.12)', border:'1px solid rgba(59,158,255,.25)', borderRadius:3, padding:'0 5px' }}>{ch}</kbd>;
}

// ─── ITEM LIST ────────────────────────────────────────────────────────────────
function ListSection({ items, setItems, suggestions, placeholder, accentColor }) {
  const [input, setInput]   = useState('');
  const [hiSug, setHiSug]   = useState(-1);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const filtered = input.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !items.includes(s)).slice(0, 6)
    : [];

  const add = useCallback((val) => {
    const v = val.trim();
    if (!v || items.includes(v)) return;
    setItems(p => [...p, v]);
    setInput('');
    setHiSug(-1);
    inputRef.current?.focus();
  }, [items, setItems]);

  const remove = useCallback((idx) => {
    setItems(p => p.filter((_, i) => i !== idx));
    setFocusIdx(-1);
    inputRef.current?.focus();
  }, [setItems]);

  const onKey = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length) setHiSug(h => Math.min(h+1, filtered.length-1));
      else setFocusIdx(i => Math.min(i+1, items.length-1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length) setHiSug(h => Math.max(h-1, -1));
      else setFocusIdx(i => Math.max(i-1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hiSug >= 0 && filtered[hiSug]) add(filtered[hiSug]);
      else if (input.trim()) add(input);
    } else if (e.key === 'Escape') {
      setInput(''); setHiSug(-1);
    }
  }, [filtered, hiSug, input, items.length, add]);

  const onListKey = useCallback((e, idx) => {
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(idx); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i+1, items.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => i <= 0 ? -1 : i-1); }
    if (e.key === 'Escape')    { setFocusIdx(-1); inputRef.current?.focus(); }
  }, [items.length, remove]);

  useEffect(() => {
    if (focusIdx >= 0) {
      document.getElementById(`meds-item-${focusIdx}`)?.focus();
    }
  }, [focusIdx]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
        <div style={{ flex:1, position:'relative' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); setHiSug(-1); }}
            onKeyDown={onKey}
            placeholder={placeholder}
            style={{ ...IS }}
          />
          {filtered.length > 0 && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:20, background:'#081628', border:'1px solid var(--npi-bd)', borderRadius:8, marginTop:2, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
              {filtered.map((s, i) => (
                <div key={s} onClick={() => add(s)} onMouseEnter={() => setHiSug(i)}
                  style={{ padding:'8px 12px', cursor:'pointer', background: i===hiSug ? 'rgba(59,158,255,.1)' : 'transparent', color: i===hiSug ? 'var(--npi-blue)' : 'var(--npi-txt2)', fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  {s}
                  {i===hiSug && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, background:'rgba(59,158,255,.2)', borderRadius:3, padding:'1px 5px', color:'var(--npi-blue)' }}>Enter ↵</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => input.trim() && add(input)} disabled={!input.trim()}
          style={{ padding:'9px 16px', borderRadius:8, background: input.trim() ? accentColor : 'rgba(255,255,255,.04)', border:`1px solid ${input.trim() ? accentColor+'66' : 'rgba(255,255,255,.1)'}`, color: input.trim() ? '#050f1e' : 'var(--npi-txt4)', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap' }}>
          + Add <KK ch="Enter" />
        </button>
      </div>

      {items.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {items.map((item, i) => (
            <div
              id={`meds-item-${i}`}
              key={item + i}
              tabIndex={0}
              onFocus={() => setFocusIdx(i)}
              onBlur={() => setFocusIdx(-1)}
              onKeyDown={e => onListKey(e, i)}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background: i===focusIdx ? 'rgba(59,158,255,.08)' : 'rgba(255,255,255,.03)', border:`1px solid ${i===focusIdx ? 'rgba(59,158,255,.25)' : 'rgba(255,255,255,.06)'}`, cursor:'default', outline:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:accentColor, flexShrink:0 }} />
                <span style={{ color:'var(--npi-txt2)', fontSize:13 }}>{item}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {i===focusIdx && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-txt4)' }}><KK ch="Del" /> remove</span>}
                <button onClick={() => remove(i)} style={{ width:20, height:20, borderRadius:4, background:'none', border:'1px solid rgba(255,107,107,.3)', color:'var(--npi-coral)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,.02)', border:'1px dashed rgba(255,255,255,.08)', color:'var(--npi-txt4)', fontSize:12, textAlign:'center' }}>
          None added — type above and press <KK ch="Enter" />
        </div>
      )}

      <div style={{ display:'flex', gap:10, fontSize:10, color:'var(--npi-txt4)', fontFamily:"'JetBrains Mono',monospace" }}>
        <span><KK ch="Enter" /> add</span>
        <span><KK ch="↑↓" /> navigate list</span>
        <span><KK ch="Del" /> remove focused</span>
        <span><KK ch="Esc" /> back to input</span>
      </div>
    </div>
  );
}

// ─── PMH SECTION ──────────────────────────────────────────────────────────────
function PMHSection({ pmhSelected, setPmhSelected, pmhExtra, setPmhExtra, pmhExpanded, setPmhExpanded }) {
  const [flatIdx, setFlatIdx] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => { setTimeout(() => panelRef.current?.focus(), 60); }, []);

  const toggle = useCallback((id) => {
    setPmhSelected(p => ({ ...p, [id]: !p[id] }));
  }, [setPmhSelected]);

  const onKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFlatIdx(i => Math.min(i+1, ALL_PMH_ITEMS.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFlatIdx(i => Math.max(i-1, 0)); }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const item = ALL_PMH_ITEMS[flatIdx];
      if (item) toggle(item.id);
    }
  }, [flatIdx, toggle]);

  const selectedCount = Object.values(pmhSelected).filter(Boolean).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontSize:10, color:'var(--npi-txt4)', fontFamily:"'JetBrains Mono',monospace" }}>{selectedCount} selected</div>
        <div style={{ display:'flex', gap:8, marginLeft:'auto', fontSize:10, color:'var(--npi-txt4)', fontFamily:"'JetBrains Mono',monospace" }}>
          <span><KK ch="↑↓" /> navigate</span>
          <span><KK ch="Space" /> toggle</span>
        </div>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={onKey} style={{ outline:'none', display:'flex', flexDirection:'column', gap:10 }}>
        {PMH_GROUPS.map(group => {
          const expanded = pmhExpanded[group.key] !== false;
          const groupSelected = group.items.filter(item => pmhSelected[item.id]).length;
          return (
            <div key={group.key} style={{ border:'1px solid rgba(59,130,246,.15)', borderRadius:10, overflow:'hidden' }}>
              <div onClick={() => setPmhExpanded(p => ({ ...p, [group.key]: !expanded }))}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', background:'rgba(14,31,54,.7)', cursor:'pointer' }}>
                <span style={{ fontSize:14 }}>{group.icon}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#fff', flex:1 }}>{group.label}</span>
                {groupSelected > 0 && (
                  <span style={{ background:'rgba(0,229,192,.15)', color:'var(--npi-teal)', borderRadius:20, padding:'1px 8px', fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>{groupSelected}</span>
                )}
                <span style={{ color:'var(--npi-txt4)', fontSize:10 }}>{expanded ? '▲' : '▼'}</span>
              </div>
              {expanded && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:4, padding:'8px 10px', background:'rgba(8,22,40,.5)' }}>
                  {group.items.map(item => {
                    const checked = !!pmhSelected[item.id];
                    const globalIdx = ALL_PMH_ITEMS.findIndex(i => i.id === item.id);
                    const isFocused = globalIdx === flatIdx;
                    return (
                      <div key={item.id} onClick={() => toggle(item.id)}
                        style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', borderRadius:7, cursor:'pointer', background: checked ? 'rgba(0,229,192,.1)' : isFocused ? 'rgba(59,158,255,.08)' : 'rgba(255,255,255,.02)', border:`1px solid ${checked ? 'rgba(0,229,192,.3)' : isFocused ? 'rgba(59,158,255,.25)' : 'rgba(255,255,255,.06)'}`, transition:'all .12s' }}>
                        <div style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${checked ? 'var(--npi-teal)' : 'var(--npi-bhi)'}`, background: checked ? 'var(--npi-teal)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                          {checked && <span style={{ color:'#050f1e', fontSize:9, fontWeight:700, lineHeight:1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:11, color: checked ? 'var(--npi-teal)' : 'var(--npi-txt3)', fontFamily:"'DM Sans',sans-serif", lineHeight:1.3 }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <div style={FL}>Additional PMH (free text)</div>
        <textarea value={pmhExtra} onChange={e => setPmhExtra(e.target.value)} placeholder="Other diagnoses, prior surgeries, immunizations…" rows={3} style={{ ...IS, resize:'vertical' }} />
      </div>
    </div>
  );
}

// ─── SOCIAL HX SECTION ────────────────────────────────────────────────────────
function SocialSection({ surgHx, setSurgHx, famHx, setFamHx, socHx, setSocHx, onAdvance }) {
  const refs = useRef([]);
  useEffect(() => { setTimeout(() => refs.current[0]?.focus(), 60); }, []);

  const fields = [
    { key:'surg', label:'Surgical History',  val: surgHx, set: setSurgHx, placeholder:'Prior surgeries, procedures…' },
    { key:'fam',  label:'Family History',     val: famHx,  set: setFamHx,  placeholder:'Relevant family history…' },
    { key:'soc',  label:'Social History',     val: socHx,  set: setSocHx,  placeholder:'Smoking, ETOH, illicits, occupation, living situation…' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {fields.map((f, i) => (
        <div key={f.key}>
          <div style={FL}>{f.label}</div>
          <textarea
            ref={el => { refs.current[i] = el; }}
            value={f.val}
            onChange={e => f.set(e.target.value)}
            onKeyDown={e => { if (e.key === 'Tab' && !e.shiftKey && i < fields.length-1) { e.preventDefault(); refs.current[i+1]?.focus(); } }}
            placeholder={f.placeholder}
            rows={3}
            style={{ ...IS, resize:'vertical' }}
          />
        </div>
      ))}
      {onAdvance && (
        <div style={{ paddingTop:8, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          <button onClick={onAdvance} style={{ padding:'8px 20px', borderRadius:8, background:'var(--npi-teal)', color:'#050f1e', border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>Continue to HPI →</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function MedsTab({
  medications, setMedications,
  allergies, setAllergies,
  pmhSelected, setPmhSelected,
  pmhExtra, setPmhExtra,
  surgHx, setSurgHx,
  famHx, setFamHx,
  socHx, setSocHx,
  pmhExpanded, setPmhExpanded,
  onAdvance,
}) {
  const [section, setSection] = useState('meds');

  useEffect(() => {
    const h = (e) => {
      if (!e.ctrlKey || e.metaKey) return;
      if (e.key === '1') { e.preventDefault(); setSection('meds'); }
      if (e.key === '2') { e.preventDefault(); setSection('allergy'); }
      if (e.key === '3') { e.preventDefault(); setSection('pmh'); }
      if (e.key === '4') { e.preventDefault(); setSection('social'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const medCount     = medications.length;
  const allergyCount = allergies.length;
  const pmhCount     = Object.values(pmhSelected).filter(Boolean).length;
  const socCount     = [surgHx, famHx, socHx].filter(Boolean).length;
  const counts       = { meds:medCount, allergy:allergyCount, pmh:pmhCount, social:socCount };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", maxWidth:820, display:'flex', flexDirection:'column', gap:18 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ margin:0, fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:'#fff' }}>Meds & PMH</h2>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:10, color:'var(--npi-txt4)', fontFamily:"'JetBrains Mono',monospace" }}>Ctrl+1–4 switch section</span>
          {onAdvance && <button onClick={onAdvance} style={{ padding:'5px 14px', borderRadius:7, background:'var(--npi-teal)', color:'#050f1e', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>Next: HPI →</button>}
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display:'flex', gap:4, background:'rgba(14,31,54,.7)', border:'1px solid rgba(59,130,246,.15)', borderRadius:10, padding:5 }}>
        {SECTIONS.map((s, i) => {
          const active = section === s.id;
          const cnt = counts[s.id];
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ flex:1, padding:'8px 10px', borderRadius:7, border:`1px solid ${active ? 'rgba(59,158,255,.35)' : 'transparent'}`, background: active ? 'rgba(59,158,255,.12)' : 'transparent', color: active ? 'var(--npi-blue)' : 'var(--npi-txt3)', fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: active?600:400, cursor:'pointer', transition:'all .13s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span>{s.icon}</span>{s.label}
              {cnt > 0 && <span style={{ background: active ? 'rgba(59,158,255,.25)' : 'rgba(255,255,255,.1)', borderRadius:20, padding:'0 6px', fontSize:10, fontFamily:"'JetBrains Mono',monospace", color: active ? 'var(--npi-blue)' : 'var(--npi-txt4)' }}>{cnt}</span>}
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-txt4)', background:'rgba(255,255,255,.04)', borderRadius:3, padding:'0 4px', marginLeft:2 }}>^{i+1}</span>
            </button>
          );
        })}
      </div>

      {/* Section content */}
      {section === 'meds' && (
        <ListSection
          key="meds"
          items={medications}
          setItems={setMedications}
          suggestions={MED_SUGGESTIONS}
          placeholder="Type medication name…"
          accentColor="var(--npi-blue)"
        />
      )}

      {section === 'allergy' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => setAllergies([])}
              style={{ padding:'6px 16px', borderRadius:8, border:`1px solid ${allergies.length === 0 ? 'var(--npi-teal)' : 'rgba(255,255,255,.12)'}`, background: allergies.length === 0 ? 'rgba(0,229,192,.1)' : 'rgba(255,255,255,.04)', color: allergies.length === 0 ? 'var(--npi-teal)' : 'var(--npi-txt3)', fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: allergies.length === 0 ? 600 : 400, cursor:'pointer' }}>
              NKDA
            </button>
            <span style={{ fontSize:11, color:'var(--npi-txt4)', alignSelf:'center' }}>or add specific allergies below</span>
          </div>
          <ListSection
            key="allergy"
            items={allergies}
            setItems={setAllergies}
            suggestions={ALLERGY_SUGGESTIONS}
            placeholder="Type allergen (drug, food, environmental)…"
            accentColor="var(--npi-coral)"
          />
        </div>
      )}

      {section === 'pmh' && (
        <PMHSection
          pmhSelected={pmhSelected}
          setPmhSelected={setPmhSelected}
          pmhExtra={pmhExtra}
          setPmhExtra={setPmhExtra}
          pmhExpanded={pmhExpanded}
          setPmhExpanded={setPmhExpanded}
        />
      )}

      {section === 'social' && (
        <SocialSection
          surgHx={surgHx} setSurgHx={setSurgHx}
          famHx={famHx}   setFamHx={setFamHx}
          socHx={socHx}   setSocHx={setSocHx}
          onAdvance={onAdvance}
        />
      )}
    </div>
  );
}