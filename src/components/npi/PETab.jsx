import React, { useState, useEffect } from "react";

/* ─── PE DATA MODEL ─────────────────────────────────── */
const PE_SYSTEMS = {
  constitutional: {
    name: 'Constitutional', icon: '🌡️',
    findings: [
      { id: 'const_appearance', label: 'General Appearance', abnOptions: ['Ill-appearing','Diaphoretic','Pale','Cachectic','Obese','Lethargic'] },
      { id: 'const_distress', label: 'Distress Level', abnOptions: ['Mild distress','Moderate distress','Severe distress','Acute distress'] },
      { id: 'const_nutrition', label: 'Nutrition', abnOptions: ['Malnourished','Obese','Underweight'] },
      { id: 'const_hygiene', label: 'Hygiene', abnOptions: ['Poor hygiene','Malodorous','Unkempt'] },
    ]
  },
  heent: {
    name: 'HEENT', icon: '👁️',
    findings: [
      { id: 'heent_head', label: 'Head Atraumatic', abnOptions: ['Laceration','Hematoma','Tenderness','Deformity'] },
      { id: 'heent_pupils', label: 'PERRL', abnOptions: ['Anisocoria','Fixed','Dilated','Constricted','Non-reactive'] },
      { id: 'heent_eomi', label: 'EOMI', abnOptions: ['Nystagmus','Restricted EOM','Diplopia'] },
      { id: 'heent_conjunctiva', label: 'Conjunctivae Normal', abnOptions: ['Injected','Pale','Icteric','Discharge','Chemosis'] },
      { id: 'heent_ears', label: 'Ears Normal', abnOptions: ['TM erythema','Effusion','Canal edema','Hemotympanum','Otorrhea'] },
      { id: 'heent_nose', label: 'Nose Normal', abnOptions: ['Epistaxis','Septal deviation','Congestion','Rhinorrhea'] },
      { id: 'heent_throat', label: 'Oropharynx Normal', abnOptions: ['Erythema','Exudate','Uvula deviation','Tonsillar swelling','Trismus'] },
      { id: 'heent_neck', label: 'Neck Supple', abnOptions: ['Rigidity','LAD','Thyromegaly','JVD','Meningismus','Midline tenderness'] },
    ]
  },
  cardiovascular: {
    name: 'Cardiovascular', icon: '❤️',
    findings: [
      { id: 'cv_rate', label: 'Rate/Rhythm Regular', abnOptions: ['Tachycardic','Bradycardic','Irregular','A-fib','Gallop'] },
      { id: 'cv_murmur', label: 'No Murmur', abnOptions: ['Systolic murmur','Diastolic murmur','Holosystolic','Crescendo-decrescendo','Grade I-VI'] },
      { id: 'cv_s1s2', label: 'S1/S2 Normal', abnOptions: ['S3 gallop','S4 gallop','Distant heart sounds','Muffled','Rub'] },
      { id: 'cv_pulses', label: 'Pulses Equal', abnOptions: ['Diminished','Absent','Bounding','Asymmetric'] },
      { id: 'cv_caprefill', label: 'Cap Refill <2s', abnOptions: ['Delayed >2s','Delayed >4s','Mottled'] },
      { id: 'cv_edema', label: 'No Edema', abnOptions: ['Trace','1+','2+','3+','4+','Pitting','Non-pitting','Bilateral','Unilateral'] },
      { id: 'cv_jvd', label: 'No JVD', abnOptions: ['JVD present','Elevated JVP'] },
    ]
  },
  respiratory: {
    name: 'Respiratory', icon: '🫁',
    findings: [
      { id: 'resp_effort', label: 'No Distress', abnOptions: ['Tachypneic','Labored','Accessory muscles','Tripoding','Paradoxical breathing'] },
      { id: 'resp_breath', label: 'Breath Sounds Clear', abnOptions: ['Wheezing','Rhonchi','Crackles','Rales','Stridor','Diminished','Absent'] },
      { id: 'resp_bilateral', label: 'Bilateral Equal', abnOptions: ['Asymmetric','Unilateral diminished','Unilateral absent'] },
      { id: 'resp_percussion', label: 'Resonant', abnOptions: ['Dull','Hyperresonant','Tympanic'] },
      { id: 'resp_cough', label: 'No Cough', abnOptions: ['Productive','Dry','Hemoptysis','Barking'] },
      { id: 'resp_chest_wall', label: 'Chest Wall Normal', abnOptions: ['Tenderness','Crepitus','Deformity','Flail segment','Subcutaneous emphysema'] },
    ]
  },
  abdominal: {
    name: 'Abdominal', icon: '🔵',
    findings: [
      { id: 'abd_soft', label: 'Soft', abnOptions: ['Rigid','Distended','Board-like','Guarding'] },
      { id: 'abd_tender', label: 'Non-tender', abnOptions: ['Diffuse tenderness','RUQ tenderness','RLQ tenderness','LUQ tenderness','LLQ tenderness','Epigastric tenderness','Suprapubic tenderness','Periumbilical'] },
      { id: 'abd_rebound', label: 'No Rebound', abnOptions: ['Rebound present','Rovsing sign','Psoas sign','Obturator sign'] },
      { id: 'abd_bowel', label: 'Bowel Sounds Normal', abnOptions: ['Hyperactive','Hypoactive','Absent','High-pitched','Tinkling'] },
      { id: 'abd_masses', label: 'No Masses', abnOptions: ['Palpable mass','Hepatomegaly','Splenomegaly','Pulsatile mass','Hernia'] },
      { id: 'abd_murphy', label: 'Murphy Negative', abnOptions: ['Murphy positive'] },
    ]
  },
  musculoskeletal: {
    name: 'Musculoskeletal', icon: '🦴',
    findings: [
      { id: 'msk_rom', label: 'Full ROM', abnOptions: ['Limited ROM','Painful ROM','Contracture'] },
      { id: 'msk_strength', label: 'Strength 5/5', abnOptions: ['4/5','3/5','2/5','1/5','0/5','Asymmetric'] },
      { id: 'msk_deformity', label: 'No Deformity', abnOptions: ['Deformity present','Angulation','Shortening','Rotation'] },
      { id: 'msk_swelling', label: 'No Swelling', abnOptions: ['Joint effusion','Soft tissue swelling','Warmth','Erythema'] },
      { id: 'msk_tender', label: 'Non-tender', abnOptions: ['Point tenderness','Diffuse tenderness','Crepitus'] },
      { id: 'msk_gait', label: 'Gait Normal', abnOptions: ['Antalgic','Ataxic','Limping','Unable to ambulate'] },
    ]
  },
  neurological: {
    name: 'Neurological', icon: '🧠',
    findings: [
      { id: 'neuro_alert', label: 'Alert & Oriented x4', abnOptions: ['AO x3','AO x2','AO x1','AO x0','Confused','Obtunded','Unresponsive'] },
      { id: 'neuro_cranial', label: 'CN II-XII Intact', abnOptions: ['Facial droop','Tongue deviation','Visual field cut','Hearing deficit','Absent gag'] },
      { id: 'neuro_motor', label: 'Motor Intact', abnOptions: ['Weakness','Hemiparesis','Paraparesis','Quadriparesis','Pronator drift'] },
      { id: 'neuro_sensory', label: 'Sensation Intact', abnOptions: ['Decreased','Absent','Paresthesias','Dermatomal loss'] },
      { id: 'neuro_reflexes', label: 'Reflexes 2+', abnOptions: ['Hyperreflexia','Hyporeflexia','Areflexia','Clonus','Babinski present'] },
      { id: 'neuro_cerebellar', label: 'Cerebellar Normal', abnOptions: ['Dysmetria','Dysdiadochokinesia','Intention tremor','Ataxia','Romberg positive'] },
      { id: 'neuro_speech', label: 'Speech Clear', abnOptions: ['Dysarthria','Aphasia','Slurred','Expressive deficit','Receptive deficit'] },
    ]
  },
  psychiatric: {
    name: 'Psychiatric', icon: '🧩',
    findings: [
      { id: 'psych_mood', label: 'Mood Normal', abnOptions: ['Depressed','Anxious','Agitated','Euphoric','Flat','Labile'] },
      { id: 'psych_affect', label: 'Affect Appropriate', abnOptions: ['Blunted','Flat','Incongruent','Restricted','Tearful'] },
      { id: 'psych_thought', label: 'Thought Process Normal', abnOptions: ['Tangential','Circumstantial','Loose associations','Flight of ideas','Perseveration'] },
      { id: 'psych_judgment', label: 'Judgment Intact', abnOptions: ['Poor judgment','Impaired insight','Impulsive'] },
      { id: 'psych_si', label: 'No SI/HI', abnOptions: ['Suicidal ideation','Homicidal ideation','Self-harm','Plan','Intent'] },
    ]
  },
  skin: {
    name: 'Skin', icon: '🔬',
    findings: [
      { id: 'skin_color', label: 'Color Normal', abnOptions: ['Pale','Cyanotic','Jaundiced','Flushed','Mottled','Ashen'] },
      { id: 'skin_integrity', label: 'Skin Intact', abnOptions: ['Laceration','Abrasion','Contusion','Burn','Ulcer','Rash'] },
      { id: 'skin_turgor', label: 'Turgor Normal', abnOptions: ['Poor turgor','Tenting','Dehydrated'] },
      { id: 'skin_warmth', label: 'Warm/Dry', abnOptions: ['Diaphoretic','Cool','Clammy','Hot','Erythematous'] },
      { id: 'skin_lesions', label: 'No Lesions', abnOptions: ['Macular','Papular','Vesicular','Petechiae','Purpura','Ecchymosis','Urticaria'] },
    ]
  },
  genitourinary: {
    name: 'Genitourinary', icon: '🔵',
    findings: [
      { id: 'gu_cva', label: 'CVA Non-tender', abnOptions: ['CVA tenderness R','CVA tenderness L','CVA tenderness bilateral'] },
      { id: 'gu_suprapubic', label: 'Suprapubic Non-tender', abnOptions: ['Suprapubic tenderness','Bladder distension'] },
      { id: 'gu_foley', label: 'No Foley', abnOptions: ['Foley in place','Hematuria noted','Cloudy urine'] },
    ]
  }
};

const TEMPLATES = {
  chest_pain: { systems: ['constitutional','heent','cardiovascular','respiratory','abdominal','neurological'], name: 'Chest Pain' },
  abdominal: { systems: ['constitutional','abdominal','genitourinary','skin','cardiovascular'], name: 'Abdominal Pain' },
  trauma: { systems: ['constitutional','heent','cardiovascular','respiratory','abdominal','musculoskeletal','neurological','skin'], name: 'Trauma' },
  neuro: { systems: ['constitutional','heent','cardiovascular','neurological','psychiatric','musculoskeletal'], name: 'Neurological' },
  peds: { systems: ['constitutional','heent','cardiovascular','respiratory','abdominal','skin','neurological'], name: 'Pediatric' },
  full: { systems: Object.keys(PE_SYSTEMS), name: 'Full Exam' },
};

/* ─── STYLES ─────────────────────────────────────────── */
const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', coral:'#ff6b6b', orange:'#ff9f43', purple:'#9b6dff',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CSS = `
@keyframes pe-fadein { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
@keyframes pe-flash { 0%{box-shadow:0 0 0 0 rgba(0,229,192,.4)} 50%{box-shadow:0 0 20px 4px rgba(0,229,192,.15)} 100%{box-shadow:0 0 0 0 rgba(0,229,192,0)} }
@keyframes pe-toast-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

.pe-pill { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:8px; font-size:12.5px; cursor:pointer; user-select:none; border:1px solid ${S.border}; background:${S.card}; color:${S.txt3}; transition:all .18s; font-family:'DM Sans',sans-serif; }
.pe-pill:hover { border-color:${S.borderHi}; }
.pe-pill-dot { width:7px; height:7px; border-radius:50%; background:${S.txt4}; transition:all .2s; flex-shrink:0; }
.pe-pill.normal { border-color:rgba(0,229,192,.35); background:rgba(0,229,192,.06); color:${S.teal}; }
.pe-pill.normal .pe-pill-dot { background:${S.teal}; box-shadow:0 0 6px rgba(0,229,192,.5); }
.pe-pill.abnormal { border-color:rgba(255,107,107,.45); background:rgba(255,107,107,.08); color:${S.coral}; }
.pe-pill.abnormal .pe-pill-dot { background:${S.coral}; box-shadow:0 0 6px rgba(255,107,107,.5); }

.pe-abn-chip { padding:3px 10px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .15s; user-select:none; font-family:'DM Sans',sans-serif; }
.pe-abn-chip:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.pe-abn-chip.on { background:rgba(255,107,107,.12); border-color:rgba(255,107,107,.4); color:${S.coral}; font-weight:500; }

.pe-sys-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; font-size:12px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .2s; user-select:none; font-family:'DM Sans',sans-serif; }
.pe-sys-chip:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.pe-sys-chip.active { background:rgba(59,158,255,.12); border-color:rgba(59,158,255,.4); color:${S.blue}; font-weight:500; }
.pe-sys-chip.has-abn { border-color:rgba(255,107,107,.3); }

.pe-mode-tab { padding:6px 16px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; transition:all .2s; color:${S.txt3}; border:none; background:transparent; font-family:'DM Sans',sans-serif; }
.pe-mode-tab:hover { color:${S.txt2}; }
.pe-mode-tab.active { background:${S.blue}; color:white; font-weight:600; }

.pe-sys-section { background:${S.panel}; border:1px solid ${S.border}; border-radius:12px; padding:16px 18px; animation:pe-fadein .25s ease; }
.pe-sys-section.flash { animation:pe-flash .6s ease; }

.pe-abn-detail { width:100%; background:${S.card}; border:1px solid rgba(255,107,107,.25); border-radius:8px; padding:10px 12px; animation:pe-fadein .2s ease; display:flex; flex-direction:column; gap:6px; margin-top:2px; }
.pe-note-input { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:6px 10px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:12px; outline:none; width:100%; transition:border-color .15s; }
.pe-note-input:focus { border-color:${S.coral}; }
.pe-note-input::placeholder { color:${S.txt4}; }

.pe-modal-overlay { position:fixed; inset:0; background:rgba(5,15,30,.8); z-index:1000; display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity .2s; }
.pe-modal-overlay.open { opacity:1; pointer-events:auto; }
.pe-modal { background:${S.panel}; border:1px solid ${S.border}; border-radius:16px; width:520px; max-height:80vh; overflow-y:auto; padding:24px; transform:translateY(10px) scale(.97); transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
.pe-modal-overlay.open .pe-modal { transform:translateY(0) scale(1); }

.pe-toast { position:fixed; top:20px; right:24px; z-index:9999; background:${S.panel}; border:1px solid rgba(0,229,192,.3); border-radius:10px; padding:10px 18px; font-size:12px; color:${S.teal}; box-shadow:0 8px 30px rgba(0,0,0,.4); font-weight:500; animation:pe-toast-in .3s ease; font-family:'DM Sans',sans-serif; }

.pe-template-select { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:5px 10px; color:${S.txt}; font-size:12px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; min-width:180px; }
.pe-template-select:focus { border-color:${S.blue}; }
`;

/* ─── COMPONENT ──────────────────────────────────────── */
export default function PETab({ peState: _peState, setPeState: _setPeState, peFindings: _peFindings, setPeFindings: _setPeFindings }) {
  // Internal state
  const initExamState = () => {
    const s = {};
    Object.values(PE_SYSTEMS).forEach(sys => sys.findings.forEach(f => { s[f.id] = { state: 'ne', abnSelections: [], note: '' }; }));
    return s;
  };

  const [examState, setExamState] = useState(initExamState);
  const [activeSystems, setActiveSystems] = useState(new Set(['constitutional','heent','cardiovascular','respiratory','abdominal','neurological']));
  const [mode, setMode] = useState('systems');
  const [toast, setToast] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [flashSys, setFlashSys] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [modalSystems, setModalSystems] = useState(new Set());
  const [customTemplates, setCustomTemplates] = useState({});
  const [templateKey, setTemplateKey] = useState('chest_pain');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  // ── Cycle finding state ──
  function cycleFinding(id, shiftKey) {
    setExamState(prev => {
      const s = { ...prev[id] };
      if (shiftKey) {
        s.state = s.state === 'abnormal' ? 'ne' : 'abnormal';
      } else {
        if (s.state === 'ne') s.state = 'normal';
        else if (s.state === 'normal') s.state = 'abnormal';
        else { s.state = 'ne'; s.abnSelections = []; s.note = ''; }
      }
      return { ...prev, [id]: s };
    });
  }

  function toggleAbnOption(id, option) {
    setExamState(prev => {
      const s = { ...prev[id] };
      const idx = s.abnSelections.indexOf(option);
      s.abnSelections = idx >= 0 ? s.abnSelections.filter(x => x !== option) : [...s.abnSelections, option];
      return { ...prev, [id]: s };
    });
  }

  function setNote(id, val) {
    setExamState(prev => ({ ...prev, [id]: { ...prev[id], note: val } }));
  }

  // ── System shortcuts ──
  function allNormalForSystem(sysKey) {
    setExamState(prev => {
      const next = { ...prev };
      PE_SYSTEMS[sysKey].findings.forEach(f => { next[f.id] = { state: 'normal', abnSelections: [], note: '' }; });
      return next;
    });
    setFlashSys(sysKey);
    setTimeout(() => setFlashSys(''), 600);
    showToast(`✓ ${PE_SYSTEMS[sysKey].name} — All Normal`);
  }

  function resetSystem(sysKey) {
    setExamState(prev => {
      const next = { ...prev };
      PE_SYSTEMS[sysKey].findings.forEach(f => { next[f.id] = { state: 'ne', abnSelections: [], note: '' }; });
      return next;
    });
  }

  function allSystemsNormal() {
    setExamState(prev => {
      const next = { ...prev };
      activeSystems.forEach(sysKey => {
        PE_SYSTEMS[sysKey].findings.forEach(f => { next[f.id] = { state: 'normal', abnSelections: [], note: '' }; });
      });
      return next;
    });
    showToast('✓ All Active Systems Marked Normal');
  }

  // ── Templates ──
  function loadTemplate(key) {
    if (!key) return;
    const tmpl = TEMPLATES[key] || customTemplates[key];
    if (!tmpl) return;
    setActiveSystems(new Set(tmpl.systems));
    setTemplateKey(key);
    showToast(`📋 Loaded: ${tmpl.name}`);
  }

  function saveCustomTemplate() {
    if (!newTemplateName.trim()) { showToast('⚠ Enter a template name'); return; }
    if (modalSystems.size === 0) { showToast('⚠ Select at least one system'); return; }
    const key = 'custom_' + Date.now();
    setCustomTemplates(prev => ({ ...prev, [key]: { systems: [...modalSystems], name: newTemplateName.trim() } }));
    setActiveSystems(new Set(modalSystems));
    setModalOpen(false);
    setNewTemplateName('');
    setModalSystems(new Set());
    showToast(`✓ Template "${newTemplateName}" saved & loaded`);
  }

  // ── Generate Note ──
  function generateNote() {
    let lines = [];
    activeSystems.forEach(sysKey => {
      const sys = PE_SYSTEMS[sysKey];
      const normals = [];
      const abnormals = [];
      sys.findings.forEach(f => {
        const s = examState[f.id];
        if (s.state === 'normal') normals.push(f.label);
        else if (s.state === 'abnormal') {
          let detail = f.label + ': ';
          if (s.abnSelections.length) detail += s.abnSelections.join(', ');
          if (s.note) detail += (s.abnSelections.length ? '; ' : '') + s.note;
          abnormals.push(detail);
        }
      });
      if (normals.length || abnormals.length) {
        lines.push(`${sys.name.toUpperCase()}:`);
        if (normals.length) lines.push(`  Normal: ${normals.join('. ')}.`);
        abnormals.forEach(a => lines.push(`  ABNORMAL: ${a}`));
        lines.push('');
      }
    });
    setNoteText(lines.join('\n') || 'No findings documented yet.');
    setShowNote(true);
  }

  // ── Counts ──
  let ctNormal = 0, ctAbn = 0, ctNe = 0;
  activeSystems.forEach(sysKey => {
    PE_SYSTEMS[sysKey].findings.forEach(f => {
      const st = examState[f.id].state;
      if (st === 'normal') ctNormal++;
      else if (st === 'abnormal') ctAbn++;
      else ctNe++;
    });
  });

  const box = { background:S.panel, border:`1px solid ${S.border}`, borderRadius:12, padding:'16px 18px' };
  const btnGhost = { background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap' };
  const btnPrimary = { background:S.teal, color:S.bg, border:'none', borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && <div className="pe-toast">{toast}</div>}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>🩺</span>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt }}>Physical Exam</div>
          <div style={{ fontSize:12, color:S.txt3, marginTop:1 }}>Tap findings to cycle: Not Examined → Normal → Abnormal · Shift+Click → jump to Abnormal</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button style={btnGhost} onClick={generateNote}>📄 Preview Note</button>
        </div>
      </div>

      {/* Mode + Template bar */}
      <div style={box}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {/* Mode tabs */}
          <div style={{ display:'flex', gap:4, background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:3 }}>
            <button className={`pe-mode-tab${mode === 'systems' ? ' active' : ''}`} onClick={() => setMode('systems')}>Systems Exam</button>
            <button className={`pe-mode-tab${mode === 'visual' ? ' active' : ''}`} onClick={() => setMode('visual')}>Visual Findings</button>
          </div>
          <div style={{ width:1, height:24, background:S.border }} />
          {/* Template */}
          <select className="pe-template-select" value={templateKey} onChange={e => loadTemplate(e.target.value)}>
            <option value="">— Load Template —</option>
            <option value="chest_pain">📋 Chest Pain</option>
            <option value="abdominal">📋 Abdominal Pain</option>
            <option value="trauma">📋 Trauma</option>
            <option value="neuro">📋 Neurological</option>
            <option value="peds">📋 Pediatric</option>
            <option value="full">📋 Full Exam</option>
            {Object.entries(customTemplates).map(([k, t]) => (
              <option key={k} value={k}>⭐ {t.name}</option>
            ))}
          </select>
          <button style={btnGhost} onClick={() => { setModalSystems(new Set(activeSystems)); setModalOpen(true); }}>✏️ Create Template</button>

          {/* Counts */}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', gap:10, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:6, height:6, borderRadius:'50%', background:S.teal, display:'inline-block' }} /> {ctNormal} Normal</span>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:6, height:6, borderRadius:'50%', background:S.coral, display:'inline-block' }} /> {ctAbn} Abnormal</span>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:6, height:6, borderRadius:'50%', background:S.txt4, display:'inline-block' }} /> {ctNe} NE</span>
            </div>
            <button style={{ ...btnPrimary, background:S.teal }} onClick={allSystemsNormal}>✓ All Systems Normal</button>
          </div>
        </div>
      </div>

      {/* System Chips */}
      {mode === 'systems' && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {Object.entries(PE_SYSTEMS).map(([key, sys]) => {
            const abnCnt = sys.findings.filter(f => examState[f.id].state === 'abnormal').length;
            const isActive = activeSystems.has(key);
            return (
              <div key={key}
                className={`pe-sys-chip${isActive ? ' active' : ''}${abnCnt > 0 ? ' has-abn' : ''}`}
                onClick={() => {
                  const next = new Set(activeSystems);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  setActiveSystems(next);
                }}
              >
                <span>{sys.icon}</span> {sys.name}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, background: abnCnt > 0 ? 'rgba(255,107,107,.2)' : S.card, color: abnCnt > 0 ? S.coral : S.txt4, borderRadius:10, padding:'1px 5px' }}>
                  {sys.findings.length}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Systems View */}
      {mode === 'systems' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {activeSystems.size === 0 ? (
            <div style={{ ...box, textAlign:'center', padding:40 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🩺</div>
              <div style={{ color:S.txt3, fontSize:13 }}>Select systems above to begin your physical exam</div>
            </div>
          ) : (
            [...activeSystems].map(sysKey => {
              const sys = PE_SYSTEMS[sysKey];
              const normalCnt = sys.findings.filter(f => examState[f.id].state === 'normal').length;
              const abnCnt = sys.findings.filter(f => examState[f.id].state === 'abnormal').length;
              const total = sys.findings.length;
              return (
                <div key={sysKey} className={`pe-sys-section${flashSys === sysKey ? ' flash' : ''}`}>
                  {/* System Header */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <span style={{ fontSize:16 }}>{sys.icon}</span>
                    <span style={{ fontSize:14, fontWeight:600, color:S.txt }}>{sys.name}</span>
                    <span style={{
                      fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600,
                      background: abnCnt > 0 ? 'rgba(255,107,107,.15)' : normalCnt === total ? 'rgba(0,229,192,.12)' : 'rgba(59,158,255,.12)',
                      color: abnCnt > 0 ? S.coral : normalCnt === total ? S.teal : S.blue,
                      border: `1px solid ${abnCnt > 0 ? 'rgba(255,107,107,.3)' : normalCnt === total ? 'rgba(0,229,192,.3)' : 'rgba(59,158,255,.3)'}`,
                    }}>{normalCnt}/{total} documented</span>
                    <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                      <button style={{ ...btnGhost, fontSize:10 }} onClick={() => allNormalForSystem(sysKey)}>✓ All Normal</button>
                      <button style={{ ...btnGhost, fontSize:10 }} onClick={() => resetSystem(sysKey)}>↺ Reset</button>
                    </div>
                  </div>

                  {/* Pills grid */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {sys.findings.map(f => {
                      const s = examState[f.id];
                      return (
                        <React.Fragment key={f.id}>
                          <div
                            className={`pe-pill${s.state !== 'ne' ? ' ' + s.state : ''}`}
                            onClick={e => cycleFinding(f.id, e.shiftKey)}
                          >
                            <span className="pe-pill-dot" />
                            <span>{f.label}</span>
                          </div>
                          {s.state === 'abnormal' && (
                            <div className="pe-abn-detail" style={{ width:'100%' }}>
                              <div style={{ fontSize:11, fontWeight:600, color:S.coral, textTransform:'uppercase', letterSpacing:'0.04em' }}>⚠ {f.label} — Abnormal Details</div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                {f.abnOptions.map(opt => (
                                  <div key={opt} className={`pe-abn-chip${s.abnSelections.includes(opt) ? ' on' : ''}`} onClick={() => toggleAbnOption(f.id, opt)}>{opt}</div>
                                ))}
                              </div>
                              <input className="pe-note-input" placeholder="Additional notes…" value={s.note} onChange={e => setNote(f.id, e.target.value)} />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Visual Findings View */}
      {mode === 'visual' && (
        <div style={box}>
          <div style={{ fontSize:11, color:S.txt3, marginBottom:12 }}>Visual findings mode — document any visible abnormalities by region</div>
          <VisualFindings S={S} showToast={showToast} />
        </div>
      )}

      {/* Note Preview */}
      {showNote && (
        <div style={box}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:16 }}>📄</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Generated PE Note</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Auto-generated from exam findings</div>
            </div>
            <button style={{ ...btnGhost, marginLeft:'auto' }} onClick={() => { navigator.clipboard?.writeText(noteText); showToast('📋 Copied!'); }}>📋 Copy</button>
            <button style={btnGhost} onClick={() => setShowNote(false)}>✕ Close</button>
          </div>
          <pre style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'14px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, lineHeight:1.7, color:S.txt2, whiteSpace:'pre-wrap', maxHeight:300, overflowY:'auto' }}>
            {noteText}
          </pre>
        </div>
      )}

      {/* Template Modal */}
      <div className={`pe-modal-overlay${modalOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="pe-modal">
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:S.txt, marginBottom:16 }}>Create Custom PE Template</div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:9, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500, display:'block', marginBottom:4 }}>Template Name</label>
            <input style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'7px 10px', color:S.txt, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:'none', width:'100%' }}
              value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="e.g., My Chest Pain Template" />
          </div>
          <div style={{ fontSize:10, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8 }}>Select Systems</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16 }}>
            {Object.entries(PE_SYSTEMS).map(([key, sys]) => (
              <div key={key} className={`pe-abn-chip${modalSystems.has(key) ? ' on' : ''}`}
                onClick={() => { const n = new Set(modalSystems); n.has(key) ? n.delete(key) : n.add(key); setModalSystems(n); }}>
                {sys.icon} {sys.name}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, paddingTop:14, borderTop:`1px solid ${S.border}` }}>
            <button style={btnGhost} onClick={() => setModalOpen(false)}>Cancel</button>
            <button style={btnPrimary} onClick={saveCustomTemplate}>💾 Save Template</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── VISUAL FINDINGS SUB-COMPONENT ──────────────────── */
function VisualFindings({ S, showToast }) {
  const [findings, setFindings] = useState([]);
  const APPEARANCES = ['Erythema','Ecchymosis','Laceration','Rash','Swelling','Lesion','Wound','Bruising','Petechiae','Cellulitis','Abscess','Blister'];
  const REGIONS = ['Head','Neck','Chest','Abdomen','Left Arm','Right Arm','Left Leg','Right Leg','Pelvis','Back','General'];

  function addFinding(region = 'General') {
    setFindings(prev => [...prev, { id: Date.now(), region, appearance: [], description: '' }]);
  }
  function toggleApp(id, opt) {
    setFindings(prev => prev.map(f => f.id !== id ? f : { ...f, appearance: f.appearance.includes(opt) ? f.appearance.filter(x => x !== opt) : [...f.appearance, opt] }));
  }
  function setDesc(id, val) {
    setFindings(prev => prev.map(f => f.id !== id ? f : { ...f, description: val }));
  }
  function removeFinding(id) {
    setFindings(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:S.txt3 }}>Add finding by region:</span>
        {REGIONS.map(r => (
          <span key={r} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, cursor:'pointer', border:`1px solid ${S.border}`, background:S.up, color:S.txt2, fontFamily:"'DM Sans',sans-serif" }}
            onClick={() => addFinding(r)}>{r}</span>
        ))}
      </div>
      {findings.length === 0 && (
        <div style={{ color:S.txt4, fontSize:12, textAlign:'center', padding:'30px 0' }}>Click a region above to document visual findings</div>
      )}
      {findings.map(f => (
        <div key={f.id} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:10, fontWeight:600, color:S.orange, textTransform:'uppercase', letterSpacing:'0.04em' }}>📍 {f.region}</span>
            <button onClick={() => removeFinding(f.id)} style={{ marginLeft:'auto', width:20, height:20, borderRadius:4, border:`1px solid ${S.border}`, background:S.up, color:S.txt4, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {APPEARANCES.map(a => (
              <span key={a} className={`pe-abn-chip${f.appearance.includes(a) ? ' on' : ''}`} onClick={() => toggleApp(f.id, a)}>{a}</span>
            ))}
          </div>
          <input className="pe-note-input" placeholder="Describe finding (size, color, location detail)…" value={f.description} onChange={e => setDesc(f.id, e.target.value)} />
        </div>
      ))}
    </div>
  );
}