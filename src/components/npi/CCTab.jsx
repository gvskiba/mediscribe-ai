import { useState, useRef, useEffect, useCallback } from 'react';

const CC_LIST = [
  'Abdominal pain','Agitation / behavioral emergency','Allergic reaction / anaphylaxis',
  'Altered mental status','Ankle pain / injury','Anxiety / panic attack',
  'Back pain','Burns',
  'Cardiac arrest','Cellulitis / skin infection','Chest pain','Constipation','Cough',
  'Dental / tooth pain','Dizziness / vertigo',
  'Ear pain / otitis','Edema / swelling','Epistaxis','Eye pain / vision change',
  'Fall / trauma','Fever','Flank pain / renal colic','Fracture',
  'GI bleed / rectal bleeding','Generalized weakness',
  'Head injury / concussion','Headache','Hemoptysis','Hip pain',
  'Jaundice','Joint pain',
  'Knee pain / injury','Laceration / wound',
  'MVC / polytrauma','Medication reaction / overdose',
  'Nausea / vomiting','Near-syncope','Neck pain',
  'Overdose / intentional ingestion',
  'Palpitations','Pelvic pain','Pregnancy complication',
  'Rash / urticaria',
  'Seizure','Shortness of breath','Shoulder pain','Sore throat',
  'Stroke / TIA / focal deficit','Suicidal ideation','Syncope',
  'Testicular pain',
  'Urinary complaints / UTI','Urinary retention',
  'Vaginal bleeding','Weakness / falls','Wheezing','Wrist / hand pain',
];

const OPQRST = [
  { key: 'onset',    label: 'Onset',             type: 'choice',
    opts: ['Sudden / acute','Gradual','Woke from sleep','Progressive over hours','Progressive over days','Unknown'] },
  { key: 'duration', label: 'Duration',           type: 'choice',
    opts: ['< 30 min','30 min–2 hrs','2–6 hrs','6–24 hrs','1–3 days','3–7 days','> 1 week'] },
  { key: 'severity', label: 'Severity / Pain',    type: 'scale',
    hint: '0 = none  →  9 = worst ever' },
  { key: 'quality',  label: 'Quality',            type: 'choice',
    opts: ['Sharp / stabbing','Dull / aching','Pressure / squeezing','Burning','Crampy / colicky','Throbbing','Tearing','N/A – non-pain','Other'] },
  { key: 'radiation',label: 'Radiation / Spread', type: 'yesno',
    hint: 'Does it radiate or spread?' },
  { key: 'aggravate',label: 'Aggravated by',      type: 'choice',
    opts: ['Exertion','Deep breath','Movement','Eating','Lying flat','Standing','Nothing obvious','Unknown'] },
  { key: 'relieve',  label: 'Relieved by',        type: 'choice',
    opts: ['Rest','Position change','Antacids','Nitroglycerin','Analgesics','Ice / heat','Nothing','Unknown'] },
  { key: 'assoc',    label: 'Associated symptoms',type: 'choice',
    opts: ['Nausea / vomiting','Diaphoresis','Dyspnea','Fever / chills','Palpitations','Lightheadedness','None'] },
];

function KK({ ch }) {
  return <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--npi-blue)', background:'rgba(59,158,255,.12)', border:'1px solid rgba(59,158,255,.25)', borderRadius:3, padding:'0 5px' }}>{ch}</kbd>;
}
function AdvBtn({ onClick, label }) {
  return <button onClick={onClick} style={{ padding:'5px 14px', borderRadius:7, background:'var(--npi-teal)', color:'#050f1e', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>{label}</button>;
}
function Chip({ active, accent, children, onClick }) {
  return (
    <span onClick={onClick} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:7, border:`1px solid ${active ? accent+'88' : 'var(--npi-bd)'}`, background: active ? accent+'18' : 'var(--npi-up)', color: active ? accent : 'var(--npi-txt2)', fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: active?600:400, cursor:'pointer', transition:'all .12s' }}>
      {children}
    </span>
  );
}

export default function CCTab({ cc, setCC, selectedCC, setSelectedCC, onAdvance }) {
  const [phase, setPhase]   = useState(() => cc.text ? 'opqrst' : 'search');
  const [query, setQuery]   = useState(cc.text || '');
  const [hilite, setHilite] = useState(0);
  const [opqIdx, setOpqIdx] = useState(0);
  const searchRef = useRef(null);
  const scanRef   = useRef(null);
  const listRef   = useRef(null);

  const filtered = CC_LIST.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 14);

  useEffect(() => {
    if (phase === 'search') setTimeout(() => searchRef.current?.focus(), 60);
    if (phase === 'opqrst') setTimeout(() => scanRef.current?.focus(), 60);
  }, [phase]);

  useEffect(() => {
    listRef.current?.children[hilite]?.scrollIntoView({ block: 'nearest' });
  }, [hilite]);

  const pickCC = useCallback((text) => {
    setCC(p => ({ ...p, text }));
    setQuery(text);
    setOpqIdx(0);
    setPhase('opqrst');
    setSelectedCC?.(-1);
  }, [setCC, setSelectedCC]);

  const advanceFrom = useCallback((idx) => {
    if (idx + 1 < OPQRST.length) setOpqIdx(idx + 1);
    else onAdvance?.();
  }, [onAdvance]);

  const handleSearchKey = useCallback((e) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHilite(h => Math.min(h+1, filtered.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHilite(h => Math.max(h-1, 0)); }
    else if (e.key === 'Enter') {
      const pick = filtered[hilite] || (query.trim() ? query.trim() : null);
      if (pick) pickCC(pick);
    }
    else if (e.key === 'Escape') { setQuery(''); setHilite(0); }
    else setHilite(0);
  }, [filtered, hilite, query, pickCC]);

  const handleScanKey = useCallback((e) => {
    const field = OPQRST[opqIdx];
    if (!field) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpqIdx(i => Math.min(i+1, OPQRST.length-1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setOpqIdx(i => Math.max(i-1, 0)); return; }
    if (e.key === 'Escape')    { onAdvance?.(); return; }
    if (e.key === 'Backspace' && !cc[field.key]) { setOpqIdx(i => Math.max(i-1, 0)); return; }

    if (field.type === 'scale') {
      if (/^[0-9]$/.test(e.key)) { setCC(p => ({ ...p, severity:`${e.key}/10` })); advanceFrom(opqIdx); }
    } else if (field.type === 'yesno') {
      if (e.key==='y'||e.key==='Y'||e.key==='Enter') { setCC(p=>({...p,[field.key]:'Yes'})); advanceFrom(opqIdx); }
      else if (e.key==='n'||e.key==='N')              { setCC(p=>({...p,[field.key]:'No'})); advanceFrom(opqIdx); }
      else if (e.key===' ')  { e.preventDefault(); setCC(p=>({...p,[field.key]:'Unknown'})); advanceFrom(opqIdx); }
    } else if (field.type === 'choice' && field.opts) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= field.opts.length) { setCC(p=>({...p,[field.key]:field.opts[n-1]})); advanceFrom(opqIdx); }
      else if (e.key===' ') { e.preventDefault(); advanceFrom(opqIdx); }
    }
  }, [opqIdx, cc, setCC, advanceFrom, onAdvance]);

  const answered = OPQRST.filter(f => cc[f.key]).length;
  const pct      = Math.round((answered / OPQRST.length) * 100);

  // ── SEARCH PHASE ───────────────────────────────────────────────────────────
  if (phase === 'search') {
    const list = query ? filtered : CC_LIST.slice(0, 18);
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif", maxWidth:680, display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ margin:0, fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:'#fff' }}>Chief Complaint</h2>
          <div style={{ fontSize:10, color:'var(--npi-txt4)', fontFamily:"'JetBrains Mono',monospace" }}>
            ↑↓ navigate &nbsp;·&nbsp; Enter select &nbsp;·&nbsp; type to filter
          </div>
        </div>

        <div style={{ position:'relative' }}>
          <input
            ref={searchRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setHilite(0); }}
            onKeyDown={handleSearchKey}
            placeholder="Type chief complaint or press ↓ to browse…"
            autoComplete="off"
            style={{ width:'100%', padding:'14px 48px 14px 18px', boxSizing:'border-box', background:'rgba(255,255,255,.06)', border:'2px solid rgba(0,229,192,.3)', borderRadius:12, color:'#fff', fontFamily:"'DM Sans',sans-serif", fontSize:17, outline:'none' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setHilite(0); searchRef.current?.focus(); }} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--npi-txt4)', fontSize:18, cursor:'pointer' }}>✕</button>
          )}
        </div>

        <div ref={listRef} style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:'52vh', overflowY:'auto' }}>
          {list.map((item, i) => (
            <div key={item} onClick={() => pickCC(item)} onMouseEnter={() => setHilite(i)}
              style={{ padding:'10px 16px', borderRadius:8, cursor:'pointer', transition:'all .1s', background: i===hilite ? 'rgba(59,158,255,.12)' : 'rgba(255,255,255,.025)', border:`1px solid ${i===hilite ? 'rgba(59,158,255,.35)' : 'rgba(255,255,255,.05)'}`, color: i===hilite ? 'var(--npi-blue)' : 'var(--npi-txt2)', fontSize:14, fontWeight: i===hilite?600:400, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              {item}
              {i===hilite && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, background:'rgba(59,158,255,.2)', borderRadius:3, padding:'1px 6px', color:'var(--npi-blue)' }}>Enter ↵</span>}
            </div>
          ))}
          {query.trim() && !CC_LIST.some(c => c.toLowerCase()===query.toLowerCase()) && (
            <div onClick={() => pickCC(query.trim())} style={{ padding:'10px 16px', borderRadius:8, cursor:'pointer', background:'rgba(0,229,192,.06)', border:'1px dashed rgba(0,229,192,.3)', color:'var(--npi-teal)', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:'var(--npi-txt4)', fontSize:11 }}>Custom:</span>
              <strong>"{query.trim()}"</strong>
              <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:9, background:'rgba(0,229,192,.15)', borderRadius:3, padding:'1px 6px' }}>Enter ↵</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── OPQRST SCAN PHASE ──────────────────────────────────────────────────────
  return (
    <div ref={scanRef} tabIndex={0} onKeyDown={handleScanKey} style={{ fontFamily:"'DM Sans',sans-serif", maxWidth:700, outline:'none', display:'flex', flexDirection:'column', gap:14 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <h2 style={{ margin:0, fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:600, color:'#fff' }}>{cc.text}</h2>
          <button onClick={() => setPhase('search')} style={{ padding:'3px 10px', borderRadius:6, background:'none', border:'1px solid rgba(255,255,255,.15)', color:'var(--npi-txt4)', fontSize:11, cursor:'pointer' }}>✎ Change</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--npi-teal)', background:'rgba(0,229,192,.1)', border:'1px solid rgba(0,229,192,.25)', borderRadius:20, padding:'2px 10px' }}>
            {answered}/{OPQRST.length}
          </span>
          {onAdvance && <AdvBtn onClick={onAdvance} label="Next: Vitals →" />}
        </div>
      </div>

      {/* Progress */}
      <div style={{ height:3, background:'var(--npi-bd)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,var(--npi-teal),var(--npi-blue))', borderRadius:2, transition:'width .3s' }} />
      </div>

      {/* Hint strip */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontSize:10, color:'var(--npi-txt4)', fontFamily:"'JetBrains Mono',monospace" }}>
        {[['↑↓','nav'],['Y','yes'],['N','no'],['1–9','option/scale'],['Space','skip'],['Esc','done']].map(([k,d]) => (
          <span key={k}><KK ch={k} /> {d}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:'58vh', overflowY:'auto' }}>
        {OPQRST.map((field, i) => {
          const active = i === opqIdx;
          const ans    = cc[field.key];
          return (
            <div key={field.key} onClick={() => setOpqIdx(i)}
              style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 14px', borderRadius:9, cursor:'pointer', transition:'all .13s', background: active ? 'rgba(59,158,255,.08)' : 'rgba(255,255,255,.02)', border:`1px solid ${active ? 'rgba(59,158,255,.3)' : 'rgba(255,255,255,.04)'}` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--npi-txt4)', width:20, paddingTop:2, flexShrink:0 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#fff', display:'flex', alignItems:'center', gap:8, marginBottom: active?8:0 }}>
                  {field.label}
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-txt4)', background:'rgba(255,255,255,.06)', borderRadius:3, padding:'1px 5px' }}>{field.type}</span>
                </div>
                {active && field.hint && <div style={{ fontSize:11, color:'var(--npi-txt4)', fontStyle:'italic', marginBottom:8 }}>{field.hint}</div>}

                {active && field.type === 'choice' && field.opts && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {field.opts.map((opt, oi) => (
                      <Chip key={opt} active={ans===opt} accent="var(--npi-blue)"
                        onClick={e => { e.stopPropagation(); setCC(p=>({...p,[field.key]:opt})); advanceFrom(i); }}>
                        <KK ch={oi+1} />{opt}
                      </Chip>
                    ))}
                  </div>
                )}

                {active && field.type === 'scale' && (
                  <div style={{ display:'flex', gap:4 }}>
                    {[0,1,2,3,4,5,6,7,8,9].map(n => {
                      const c = n>=7?'var(--npi-coral)':n>=4?'var(--npi-orange)':'var(--npi-teal)';
                      const a2 = cc.severity===`${n}/10`;
                      return <span key={n} onClick={e=>{e.stopPropagation();setCC(p=>({...p,severity:`${n}/10`}));advanceFrom(i);}} style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:7, border:`1px solid ${a2?c:'var(--npi-bd)'}`, background:a2?c+'22':'var(--npi-up)', fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:c, cursor:'pointer', transition:'all .12s' }}>{n}</span>;
                    })}
                  </div>
                )}

                {active && field.type === 'yesno' && (
                  <div style={{ display:'flex', gap:6 }}>
                    {[['Y','Yes / present','var(--npi-coral)'],['N','No / absent','var(--npi-teal)'],['Space','Unknown','var(--npi-txt4)']].map(([k,l,c]) => (
                      <Chip key={k} active={false} accent={c} onClick={e=>{e.stopPropagation();const v=k==='Y'?'Yes':k==='N'?'No':'Unknown';setCC(p=>({...p,[field.key]:v}));advanceFrom(i);}}>
                        <KK ch={k} />{l}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:ans?'var(--npi-teal)':'var(--npi-txt4)', minWidth:80, textAlign:'right', paddingTop:2, flexShrink:0 }}>{ans||'—'}</div>
              <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:4, background:ans?'var(--npi-teal)':'transparent', border:`1.5px solid ${ans?'var(--npi-teal)':'var(--npi-bd)'}`, boxShadow:ans?'0 0 5px rgba(0,229,192,.4)':'none', transition:'all .2s' }} />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', gap:10, alignItems:'center', paddingTop:4 }}>
        {onAdvance && <button onClick={onAdvance} style={{ padding:'8px 20px', borderRadius:8, background:'var(--npi-teal)', color:'#050f1e', border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>Continue to Vitals ({answered} answered) →</button>}
        <button onClick={() => setPhase('search')} style={{ padding:'7px 14px', borderRadius:8, background:'var(--npi-up)', border:'1px solid var(--npi-bd)', color:'var(--npi-txt3)', fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:'pointer' }}>↩ Change CC</button>
        <button onClick={() => setCC(p=>({...p,onset:'',duration:'',severity:'',quality:'',radiation:'',aggravate:'',relieve:'',assoc:''}))} style={{ padding:'7px 14px', borderRadius:8, background:'none', border:'1px solid rgba(255,255,255,.1)', color:'var(--npi-txt4)', fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:'pointer' }}>Clear OPQRST</button>
      </div>
    </div>
  );
}