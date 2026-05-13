import { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_CATEGORIES = {
  Cardiovascular: ['HTN','CAD','CHF','Atrial fibrillation','Prior MI','PVD','Cardiomyopathy','Valvular disease','Pacemaker/ICD','Aortic aneurysm'],
  Pulmonary: ['Asthma','COPD','OSA','Pulmonary HTN','Prior PE','Bronchiectasis','Interstitial lung disease'],
  'Metabolic/Endocrine': ['DM Type 2','DM Type 1','Obesity','Hypothyroidism','Hyperthyroidism','Hyperlipidemia','Metabolic syndrome','Adrenal insufficiency'],
  Neurological: ['Stroke/TIA','Seizure disorder','Migraines',"Parkinson's",'Dementia','Neuropathy','Multiple sclerosis'],
  'GI/Hepatic': ['GERD','PUD','IBD','Cirrhosis','NAFLD','Pancreatitis','Diverticulosis','GI bleed history'],
  Renal: ['CKD','ESRD on HD','Renal transplant','Prior AKI','Nephrolithiasis','Proteinuria'],
  Hematologic: ['Anemia','Thrombocytopenia','On anticoagulation','Coagulopathy','Prior DVT/PE','Sickle cell disease'],
  Psychiatric: ['Depression','Anxiety','Bipolar disorder','Schizophrenia','PTSD','Substance use disorder'],
  Oncologic: ['Active malignancy','Prior malignancy','On chemotherapy','On immunotherapy','Immunocompromised'],
  Other: ['HIV/AIDS','Autoimmune disease','Transplant recipient','Chronic pain','Fibromyalgia','Thyroid disease'],
};

const CAT_ICONS = {
  Cardiovascular:'♥', Pulmonary:'🫁', 'Metabolic/Endocrine':'⚡',
  Neurological:'🧠', 'GI/Hepatic':'🔵', Renal:'💧',
  Hematologic:'🩸', Psychiatric:'🧩', Oncologic:'⚠', Other:'＋',
};

const PRIORITY_STYLE = {
  Immediate:{ dot:'#ef4444', bg:'rgba(239,68,68,0.12)', badge:'#ef4444' },
  Urgent:   { dot:'#f59e0b', bg:'rgba(245,158,11,0.12)', badge:'#f59e0b' },
  Routine:  { dot:'#64748b', bg:'rgba(100,116,139,0.12)', badge:'#64748b' },
};

const MDM_HIGH = new Set([
  'Active malignancy','ESRD on HD','On chemotherapy','On immunotherapy',
  'Immunocompromised','Cirrhosis','On anticoagulation','Coagulopathy',
  'Substance use disorder','Transplant recipient','Renal transplant',
  'HIV/AIDS','Pulmonary HTN','Cardiomyopathy','CHF',
]);
const MDM_MODERATE = new Set([
  'HTN','CAD','DM Type 2','DM Type 1','Atrial fibrillation','COPD','Asthma',
  'CKD','Prior MI','Prior PE','Prior DVT/PE','Stroke/TIA','Seizure disorder',
  'Hypothyroidism','Hyperthyroidism','Hyperlipidemia','IBD','Pancreatitis',
  'Sickle cell disease','Anemia','Thrombocytopenia','Prior malignancy',
  'Depression','Bipolar disorder','Schizophrenia','PTSD',"Parkinson's",'Dementia',
  'Aortic aneurysm','Valvular disease','Pacemaker/ICD','Interstitial lung disease',
  'OSA','GI bleed history','Autoimmune disease',
]);

function computeMDM(pmhList) {
  const high     = pmhList.filter(c => MDM_HIGH.has(c));
  const moderate = pmhList.filter(c => MDM_MODERATE.has(c));
  const other    = pmhList.filter(c => !MDM_HIGH.has(c) && !MDM_MODERATE.has(c));
  let level = 'Low';
  let rationale = 'Minimal comorbidity burden';
  if (high.length >= 1) {
    level = 'High';
    rationale = `${high.length} high-complexity condition${high.length > 1 ? 's' : ''}: ${high.slice(0,2).join(', ')}${high.length > 2 ? '...' : ''}`;
  } else if (moderate.length >= 3) {
    level = 'High';
    rationale = `${moderate.length} chronic conditions — ≥3 elevates to High complexity (AMA 2021)`;
  } else if (moderate.length >= 1) {
    level = 'Moderate';
    rationale = `${moderate.length} established chronic condition${moderate.length > 1 ? 's' : ''}`;
  } else if (pmhList.length > 0) {
    level = 'Low-Moderate';
    rationale = 'Minor or unclassified conditions present';
  }
  return { level, rationale, high, moderate, other };
}

const ORDER_CATEGORY_MAP = {
  Labs:'labs', Imaging:'imaging', Consults:'consults', Monitoring:'monitoring', Medications:'medications',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PMHTab({ C = {}, chiefComplaint = '', hpi = '', onOrdersReady, onMDMReady }) {
  const teal  = C.teal   || '#0d9488';
  const gold  = C.gold   || '#d4a017';
  const glass = C.glass  || 'rgba(255,255,255,0.06)';
  const bdr   = C.border || 'rgba(255,255,255,0.13)';
  const text  = C.text   || '#e2e8f0';
  const muted = C.muted  || '#94a3b8';
  const surf  = C.surface|| 'rgba(255,255,255,0.09)';

  const [mode, setMode]             = useState('select');
  const [activeCat, setActiveCat]   = useState('Cardiovascular');
  const [pmh, setPmh]               = useState([]);
  const [psh, setPsh]               = useState([]);
  const [meds, setMeds]             = useState([]);
  const [allergies, setAllergies]   = useState([]);
  const [searchQ, setSearchQ]       = useState('');
  const [pasteText, setPasteText]   = useState('');
  const [customInput, setCustom]    = useState('');
  const [pshInput, setPshInput]     = useState('');
  const [medInput, setMedInput]     = useState('');
  const [aInput, setAInput]         = useState('');
  const [workupRecs, setWorkupRecs] = useState([]);
  const [analyzing, setAnalyzing]   = useState(false);
  const [recsOpen, setRecsOpen]     = useState(false);
  const [parseMsg, setParseMsg]     = useState('');
  const [analyzeErr, setAnalyzeErr] = useState('');
  const [orderQueue, setOrderQueue] = useState([]);
  const [showQueue, setShowQueue]   = useState(false);
  const [showMDM, setShowMDM]       = useState(false);
  const [orderSent, setOrderSent]   = useState(false);
  const [mdmSent, setMdmSent]       = useState(false);
  const [copiedAll, setCopiedAll]   = useState(false);

  const allConditions = Object.values(CONDITION_CATEGORIES).flat();
  const filtered = searchQ.length > 1 ? allConditions.filter(c => c.toLowerCase().includes(searchQ.toLowerCase())) : [];
  const mdm = computeMDM(pmh);
  const MDM_COLORS = { High:'#ef4444', Moderate:'#f59e0b', 'Low-Moderate':'#a78bfa', Low:'#64748b' };
  const mdmColor = MDM_COLORS[mdm.level] || '#64748b';

  const toggle  = useCallback((item) => setPmh(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]), []);
  const remPmh  = i => setPmh(p => p.filter(x => x !== i));
  const remPsh  = i => setPsh(p => p.filter(x => x !== i));
  const remMed  = i => setMeds(p => p.filter(x => x !== i));
  const remA    = i => setAllergies(p => p.filter(x => x !== i));
  const addCust = () => { const v = customInput.trim(); if (v && !pmh.includes(v)) setPmh(p => [...p, v]); setCustom(''); };
  const addPsh  = () => { const v = pshInput.trim(); if (v && !psh.includes(v)) setPsh(p => [...p, v]); setPshInput(''); };
  const addMed  = () => { const v = medInput.trim(); if (v && !meds.includes(v)) setMeds(p => [...p, v]); setMedInput(''); };
  const addA    = () => { const v = aInput.trim(); if (v && !allergies.includes(v)) setAllergies(p => [...p, v]); setAInput(''); };

  const isQueued = rec => orderQueue.some(o => o.recommendation === rec.recommendation);
  const addToQ   = rec => { if (!isQueued(rec)) setOrderQueue(p => [...p, rec]); };
  const remFromQ = rec => setOrderQueue(p => p.filter(o => o.recommendation !== rec.recommendation));
  const addAllPriority = (priority) => {
    const toAdd = workupRecs.filter(r => r.priority === priority && !isQueued(r));
    setOrderQueue(p => [...p, ...toAdd]);
    setShowQueue(true);
  };

  const parsePaste = async () => {
    if (!pasteText.trim()) return;
    setParseMsg('Parsing...');
    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000,
          system:'Extract structured medical history. Return ONLY valid JSON, no markdown. Format: {"pmh":[],"psh":[],"medications":[],"allergies":[]}',
          messages:[{ role:'user', content:`Extract PMH, PSH, medications, allergies:\n\n${pasteText}` }] }),
      });
      const data = await res.json();
      const parsed = JSON.parse((data.content?.[0]?.text || '{}').replace(/```json|```/g,'').trim());
      if (parsed.pmh?.length)         setPmh(p  => [...new Set([...p,  ...parsed.pmh])]);
      if (parsed.psh?.length)         setPsh(p  => [...new Set([...p,  ...parsed.psh])]);
      if (parsed.medications?.length) setMeds(p => [...new Set([...p,  ...parsed.medications])]);
      if (parsed.allergies?.length)   setAllergies(p => [...new Set([...p, ...parsed.allergies])]);
      const tot = (parsed.pmh?.length||0)+(parsed.psh?.length||0)+(parsed.medications?.length||0)+(parsed.allergies?.length||0);
      setParseMsg(`✓ Extracted ${tot} item${tot !== 1 ? 's' : ''}`);
      setPasteText('');
    } catch { setParseMsg('Parse error — review manually'); }
  };

  const analyzeWorkup = async () => {
    if (!chiefComplaint && !hpi && !pmh.length) { setAnalyzeErr('Add CC, HPI, or PMH first'); return; }
    setAnalyzeErr(''); setAnalyzing(true); setRecsOpen(true); setWorkupRecs([]); setOrderQueue([]);
    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000,
          system:'Emergency medicine CDS. Return ONLY a valid JSON array, no markdown. Each item: {"category":"Labs|Imaging|Consults|Monitoring|Medications","recommendation":"string","rationale":"string under 15 words","priority":"Immediate|Urgent|Routine","evidence":"guideline tag"}. Max 10 recs. Only what the clinical context supports.',
          messages:[{ role:'user', content:`CC: ${chiefComplaint||'Not provided'}\nHPI: ${hpi||'Not provided'}\nPMH: ${pmh.join(', ')||'None'}\nPSH: ${psh.join(', ')||'None'}\nMeds: ${meds.join(', ')||'None'}\nAllergies: ${allergies.join(', ')||'NKDA'}\n\nGenerate workup recommendations.` }] }),
      });
      const data = await res.json();
      const recs = JSON.parse((data.content?.[0]?.text || '[]').replace(/```json|```/g,'').trim());
      if (Array.isArray(recs)) {
        setWorkupRecs(recs);
        setOrderQueue(recs.filter(r => r.priority === 'Immediate'));
        if (recs.some(r => r.priority === 'Immediate')) setShowQueue(true);
      }
    } catch { setAnalyzeErr('Analysis failed'); }
    setAnalyzing(false);
  };

  const sendToOrders = () => {
    const payload = orderQueue.map(o => ({
      name: o.recommendation, category: ORDER_CATEGORY_MAP[o.category]||'other',
      priority: o.priority, source:'pmh-ai', rationale: o.rationale,
    }));
    window.dispatchEvent(new CustomEvent('pmhOrdersReady', { detail: { orders: payload } }));
    window.history.replaceState(null,'',`?pmhOrders=${encodeURIComponent(JSON.stringify(payload))}`);
    if (onOrdersReady) onOrdersReady(payload);
    setOrderSent(true); setTimeout(() => setOrderSent(false), 3000);
  };

  const sendToMDM = () => {
    const payload = { conditions: mdm.high.concat(mdm.moderate), highComplexity: mdm.high, moderateComplexity: mdm.moderate, suggestedLevel: mdm.level, source:'pmh-tab' };
    window.dispatchEvent(new CustomEvent('pmhMDMReady', { detail: payload }));
    window.history.replaceState(null,'',`?pmhComorbidities=${encodeURIComponent(JSON.stringify(payload))}`);
    if (onMDMReady) onMDMReady(payload);
    setMdmSent(true); setTimeout(() => setMdmSent(false), 3000);
  };

  const copyAll = () => {
    const txt = workupRecs.map(r => `[${r.priority.toUpperCase()}] ${r.category}: ${r.recommendation} — ${r.rationale}`).join('\n');
    navigator.clipboard.writeText(txt).then(() => { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000); });
  };

  // ── Style helpers ─────────────────────────────────────────────────────────
  const card    = { background: glass, border:`1px solid ${bdr}`, borderRadius:12, padding:'16px 20px', marginBottom:12 };
  const inp     = { width:'100%', background:surf, border:`1px solid ${bdr}`, borderRadius:8, padding:'9px 12px', color:text, fontSize:13, outline:'none', boxSizing:'border-box' };
  const modeBtn = (a) => ({ padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', border:`1px solid ${a ? teal : bdr}`, background:a ? 'rgba(13,148,136,0.2)' : 'transparent', color:a ? teal : muted });
  const addBtn  = (col) => ({ padding:'9px 16px', background:`${col||teal}22`, border:`1px solid ${col||teal}`, borderRadius:8, color:col||teal, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 });
  const chip    = (sel, col) => ({ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:`1px solid ${sel ? col||teal : bdr}`, background:sel ? `${col||teal}28` : 'transparent', color:sel ? col||teal : muted, margin:'3px' });
  const catTab  = (a) => ({ padding:'5px 11px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${a ? gold : bdr}`, background:a ? 'rgba(212,160,23,0.15)' : 'transparent', color:a ? gold : muted, margin:'3px' });
  const ta      = { width:'100%', background:surf, border:`1px solid ${bdr}`, borderRadius:8, padding:'10px 12px', color:text, fontSize:13, outline:'none', minHeight:100, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' };
  const primBtn = { padding:'10px 22px', background:`linear-gradient(135deg, ${teal}, #0f766e)`, border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' };
  const row     = { display:'flex', gap:8, alignItems:'center' };
  const chipRow = { display:'flex', flexWrap:'wrap', gap:6, marginTop:8, minHeight:28 };
  const recCard = (p) => ({ background:PRIORITY_STYLE[p]?.bg||'rgba(100,116,139,0.1)', border:`1px solid ${bdr}`, borderRadius:10, padding:'11px 14px', display:'flex', gap:10, alignItems:'flex-start', marginBottom:7 });
  const dot     = (p) => ({ width:8, height:8, borderRadius:'50%', background:PRIORITY_STYLE[p]?.dot||'#64748b', flexShrink:0, marginTop:5 });
  const catBadge= { fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(13,148,136,0.15)', color:teal };
  const spinner = { width:16, height:16, border:`2px solid ${bdr}`, borderTop:`2px solid ${teal}`, borderRadius:'50%', animation:'spin 0.7s linear infinite' };
  const qBtn    = (q) => ({ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', border:`1px solid ${q ? '#ef4444' : teal}`, background:q ? 'rgba(239,68,68,0.12)' : `rgba(13,148,136,0.12)`, color:q ? '#ef4444' : teal, flexShrink:0, whiteSpace:'nowrap' });

  const Chips = ({ items, onRemove, col }) => (
    <div style={chipRow}>
      {!items.length && <span style={{ fontSize:12, color:muted, fontStyle:'italic' }}>None added</span>}
      {items.map(i => (
        <span key={i} style={chip(true, col)}>
          {i}
          <span style={{ cursor:'pointer', color:muted, marginLeft:3, fontSize:11, fontWeight:700 }} onClick={() => onRemove(i)}>✕</span>
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", color:text }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} button{transition:all 0.12s}`}</style>

      {/* ── Input Mode ─────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {['search','select','paste'].map(m => (
            <button key={m} style={modeBtn(mode === m)} onClick={() => setMode(m)}>
              {m === 'search' ? '🔍 Search' : m === 'select' ? '☑ Select' : '📋 Paste'}
            </button>
          ))}
          <span style={{ marginLeft:'auto', fontSize:12, color:muted, alignSelf:'center' }}>{pmh.length} condition{pmh.length !== 1 ? 's' : ''}</span>
        </div>

        {mode === 'search' && (
          <div>
            <input style={inp} placeholder="Search conditions..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {filtered.length > 0 && <div style={{ marginTop:10 }}>{filtered.map(c => <span key={c} style={chip(pmh.includes(c))} onClick={() => toggle(c)}>{pmh.includes(c) ? '✓ ' : ''}{c}</span>)}</div>}
            {searchQ.length > 1 && !filtered.length && (
              <div style={{ ...row, marginTop:10 }}>
                <span style={{ fontSize:12, color:muted }}>No match —</span>
                <button style={addBtn()} onClick={() => { toggle(searchQ); setSearchQ(''); }}>Add "{searchQ}"</button>
              </div>
            )}
          </div>
        )}

        {mode === 'select' && (
          <div>
            <div style={{ display:'flex', flexWrap:'wrap', marginBottom:12 }}>
              {Object.keys(CONDITION_CATEGORIES).map(cat => (
                <button key={cat} style={catTab(activeCat === cat)} onClick={() => setActiveCat(cat)}>{CAT_ICONS[cat]} {cat}</button>
              ))}
            </div>
            <div>{CONDITION_CATEGORIES[activeCat].map(c => <span key={c} style={chip(pmh.includes(c))} onClick={() => toggle(c)}>{pmh.includes(c) ? '✓ ' : ''}{c}</span>)}</div>
            <div style={{ ...row, marginTop:14 }}>
              <input style={inp} placeholder="Add custom condition..." value={customInput} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCust(); }} />
              <button style={addBtn()} onClick={addCust}>Add</button>
            </div>
          </div>
        )}

        {mode === 'paste' && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:muted, textTransform:'uppercase', marginBottom:8 }}>Paste history, med list, or prior note text</div>
            <textarea style={ta} placeholder={"Paste here...\nE.g. PMH: HTN, DM2, CAD s/p CABG\nMeds: metoprolol 25mg, lisinopril 10mg\nAllergies: penicillin (rash)"} value={pasteText} onChange={e => setPasteText(e.target.value)} />
            <div style={{ ...row, marginTop:10 }}>
              <button style={primBtn} onClick={parsePaste}>✦ AI Parse & Extract</button>
              {parseMsg && <span style={{ fontSize:12, color:parseMsg.startsWith('✓') ? teal : '#f87171' }}>{parseMsg}</span>}
            </div>
          </div>
        )}

        <div style={{ borderTop:`1px solid ${bdr}`, paddingTop:14, marginTop:16 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:muted, textTransform:'uppercase', marginBottom:8 }}>Past Medical History</div>
          <Chips items={pmh} onRemove={remPmh} col={teal} />
        </div>
      </div>

      {/* ── PSH + Allergies ─────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🔪 Past Surgical History</div>
          <div style={row}>
            <input style={inp} placeholder="e.g. CABG 2018..." value={pshInput} onChange={e => setPshInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addPsh(); }} />
            <button style={addBtn('#a78bfa')} onClick={addPsh}>Add</button>
          </div>
          <Chips items={psh} onRemove={remPsh} col='#a78bfa' />
        </div>
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>⚠ Allergies</div>
          <div style={row}>
            <input style={inp} placeholder="e.g. Penicillin (rash)..." value={aInput} onChange={e => setAInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addA(); }} />
            <button style={addBtn('#f87171')} onClick={addA}>Add</button>
          </div>
          <Chips items={allergies} onRemove={remA} col='#f87171' />
        </div>
      </div>

      {/* ── Medications ─────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>💊 Current Medications</div>
        <div style={row}>
          <input style={inp} placeholder="e.g. Metoprolol 25mg daily..." value={medInput} onChange={e => setMedInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addMed(); }} />
          <button style={addBtn(gold)} onClick={addMed}>Add</button>
        </div>
        <Chips items={meds} onRemove={remMed} col={gold} />
      </div>

      {/* ── MDM Comorbidity Panel ────────────────────────────────────────────── */}
      {pmh.length > 0 && (
        <div style={{ ...card, border:`1px solid ${mdmColor}55`, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', marginBottom: showMDM ? 14 : 0 }} onClick={() => setShowMDM(o => !o)}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:text }}>📋 MDM Comorbidity Analysis</span>
              <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:8, background:`${mdmColor}22`, color:mdmColor, letterSpacing:'0.06em' }}>
                {mdm.level.toUpperCase()} COMPLEXITY
              </span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button style={{ ...addBtn(mdmColor), padding:'6px 14px', fontSize:12, fontWeight:700 }} onClick={e => { e.stopPropagation(); sendToMDM(); }}>
                {mdmSent ? '✓ Sent' : '→ MDM Builder'}
              </button>
              <span style={{ color:muted, fontSize:15 }}>{showMDM ? '▲' : '▼'}</span>
            </div>
          </div>

          {showMDM && (
            <div>
              <div style={{ fontSize:13, color:muted, marginBottom:14 }}>{mdm.rationale}</div>

              {mdm.high.length > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#ef4444', letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>
                    🔴 High Complexity (AMA 2021)
                  </div>
                  <div>{mdm.high.map(c => <span key={c} style={{ ...chip(true,'#ef4444'), margin:'3px' }}>{c}</span>)}</div>
                </div>
              )}

              {mdm.moderate.length > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#f59e0b', letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>
                    🟡 Moderate Complexity
                  </div>
                  <div>{mdm.moderate.map(c => <span key={c} style={{ ...chip(true,'#f59e0b'), margin:'3px' }}>{c}</span>)}</div>
                </div>
              )}

              {mdm.other.length > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:muted, letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>⚪ Unclassified / Minor</div>
                  <div>{mdm.other.map(c => <span key={c} style={{ ...chip(false), margin:'3px' }}>{c}</span>)}</div>
                </div>
              )}

              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 14px', fontSize:12, color:muted, borderLeft:`3px solid ${mdmColor}` }}>
                <strong style={{ color:text }}>AMA 2021 Guidance — </strong>
                {mdm.level === 'High'         && 'High complexity: severe comorbidity, exacerbation of chronic illness with threat to life/function, or highly complex problems.'}
                {mdm.level === 'Moderate'     && 'Moderate complexity: 2+ stable chronic conditions OR new condition requiring additional workup OR established condition worsening.'}
                {mdm.level === 'Low-Moderate' && 'Low-Moderate: minor conditions present — verify clinical context supports complexity level.'}
                {mdm.level === 'Low'          && 'Low complexity: minimal comorbidity burden. Self-limited or minor problem.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI Workup Recommendations ─────────────────────────────────────────── */}
      <div style={{ ...card, border:`1px solid rgba(13,148,136,0.4)` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', marginBottom: recsOpen ? 16 : 0 }} onClick={() => setRecsOpen(o => !o)}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:15, fontWeight:700, color:teal }}>✦ AI Workup Recommendations</span>
            {workupRecs.length > 0 && <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:10, background:'rgba(13,148,136,0.2)', color:teal }}>{workupRecs.length} recs</span>}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {workupRecs.length > 0 && (
              <button style={{ ...addBtn(), padding:'6px 12px', fontSize:12 }} onClick={e => { e.stopPropagation(); copyAll(); }}>
                {copiedAll ? '✓ Copied' : '⎘ Copy All'}
              </button>
            )}
            <button style={primBtn} onClick={e => { e.stopPropagation(); analyzeWorkup(); }}>
              {analyzing ? '⏳ Analyzing...' : '✦ Analyze'}
            </button>
            <span style={{ color:muted, fontSize:15 }}>{recsOpen ? '▲' : '▼'}</span>
          </div>
        </div>

        {analyzeErr && <div style={{ color:'#f87171', fontSize:12, marginTop:6 }}>{analyzeErr}</div>}

        {recsOpen && (
          <div>
            {analyzing && (
              <div style={{ ...row, padding:'14px 0' }}>
                <div style={spinner} />
                <span style={{ color:muted, fontSize:13 }}>Analyzing CC + HPI + PMH...</span>
              </div>
            )}

            {!analyzing && !workupRecs.length && (
              <div style={{ color:muted, fontSize:13, fontStyle:'italic' }}>Click Analyze to generate evidence-based recommendations.</div>
            )}

            {!analyzing && workupRecs.length > 0 && (
              <div style={{ ...row, flexWrap:'wrap', gap:8, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${bdr}` }}>
                <span style={{ fontSize:12, color:muted }}>Stage to orders:</span>
                {['Immediate','Urgent','Routine'].map(p => {
                  const cnt = workupRecs.filter(r => r.priority === p).length;
                  if (!cnt) return null;
                  return (
                    <button key={p} style={{ ...addBtn(PRIORITY_STYLE[p].badge), padding:'5px 12px', fontSize:11 }} onClick={() => addAllPriority(p)}>
                      + All {p} ({cnt})
                    </button>
                  );
                })}
                {orderQueue.length > 0 && <span style={{ marginLeft:'auto', fontSize:12, color:teal, fontWeight:600 }}>{orderQueue.length} staged →</span>}
              </div>
            )}

            {!analyzing && workupRecs.length > 0 && ['Immediate','Urgent','Routine'].map(priority => {
              const grp = workupRecs.filter(r => r.priority === priority);
              if (!grp.length) return null;
              return (
                <div key={priority} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:PRIORITY_STYLE[priority]?.dot, marginBottom:8, textTransform:'uppercase' }}>
                    {priority === 'Immediate' ? '🔴' : priority === 'Urgent' ? '🟡' : '⚪'} {priority}
                  </div>
                  {grp.map((rec, i) => (
                    <div key={i} style={recCard(priority)}>
                      <div style={dot(priority)} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:text }}>{rec.recommendation}</span>
                          <span style={catBadge}>{rec.category}</span>
                          {rec.evidence && <span style={{ fontSize:10, color:muted, fontStyle:'italic' }}>{rec.evidence}</span>}
                          <button style={{ ...qBtn(isQueued(rec)), marginLeft:'auto' }}
                            onClick={() => { isQueued(rec) ? remFromQ(rec) : addToQ(rec); setShowQueue(true); }}>
                            {isQueued(rec) ? '✓ Staged' : '+ Orders'}
                          </button>
                        </div>
                        <div style={{ fontSize:12, color:muted }}>{rec.rationale}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {!analyzing && workupRecs.length > 0 && (
              <div style={{ fontSize:11, color:muted, borderTop:`1px solid ${bdr}`, paddingTop:10 }}>
                ⚠ AI recommendations are clinical decision support only. Always apply clinical judgment.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Order Queue Panel ─────────────────────────────────────────────────── */}
      {orderQueue.length > 0 && (
        <div style={{ ...card, border:`1px solid rgba(212,160,23,0.4)` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', marginBottom: showQueue ? 14 : 0 }} onClick={() => setShowQueue(o => !o)}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:gold }}>📤 Order Queue</span>
              <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:8, background:'rgba(212,160,23,0.2)', color:gold }}>
                {orderQueue.length} order{orderQueue.length !== 1 ? 's' : ''} staged
              </span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button
                style={{ padding:'8px 18px', background:`linear-gradient(135deg, ${gold}, #b8860b)`, border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}
                onClick={e => { e.stopPropagation(); sendToOrders(); }}>
                {orderSent ? '✓ Sent' : '→ OrderGeneratorHub'}
              </button>
              <span style={{ color:muted, fontSize:15 }}>{showQueue ? '▲' : '▼'}</span>
            </div>
          </div>

          {showQueue && (
            <div>
              {['Immediate','Urgent','Routine'].map(priority => {
                const grp = orderQueue.filter(o => o.priority === priority);
                if (!grp.length) return null;
                return (
                  <div key={priority} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:PRIORITY_STYLE[priority]?.dot, letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>
                      {priority === 'Immediate' ? '🔴' : priority === 'Urgent' ? '🟡' : '⚪'} {priority}
                    </div>
                    {grp.map((o, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:8, marginBottom:5 }}>
                        <span style={catBadge}>{o.category}</span>
                        <span style={{ fontSize:13, color:text, flex:1 }}>{o.recommendation}</span>
                        <span style={{ fontSize:11, color:muted }}>{o.rationale}</span>
                        <button style={{ ...qBtn(true), padding:'3px 8px' }} onClick={() => remFromQ(o)}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}

              <div style={{ borderTop:`1px solid ${bdr}`, paddingTop:12, fontSize:11, color:muted }}>
                Dispatches <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 5px', borderRadius:4, fontSize:10 }}>pmhOrdersReady</code> CustomEvent.
                OrderGeneratorHub listener: <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 5px', borderRadius:4, fontSize:10 }}>window.addEventListener('pmhOrdersReady', e =&gt; ingestOrders(e.detail.orders))</code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}