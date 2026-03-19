import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import ClaimValidationPanel from '@/components/autocoder/ClaimValidationPanel';
import { runValidation } from '@/components/autocoder/claimValidation';

const TABS = ['note', 'icd', 'cpt', 'billing'];
const RVU_MAP = { '99211': 1.3, '99212': 2.6, '99213': 3.9, '99214': 5.2, '99215': 7.2, '93000': 1.0, '71046': 1.5, '80053': 0.8, '85025': 0.7, '84484': 0.5 };

function confClass(n) { return n >= 85 ? 'high' : n >= 65 ? 'med' : 'low'; }

const SAMPLE_NOTE = `CHIEF COMPLAINT: Chest pain, shortness of breath.

HPI: Mr. James Hartwell is a 67-year-old male with a history of hypertension and type 2 diabetes presenting with 2 days of substernal chest pressure radiating to the left arm, rated 6/10, associated with mild dyspnea on exertion and mild diaphoresis.

PMH: Hypertension, Type 2 diabetes mellitus, Hyperlipidemia, GERD

MEDICATIONS: Lisinopril 10mg, atorvastatin 20mg, metformin 1000mg BID, pantoprazole 40mg, aspirin 81mg

ALLERGIES: Penicillin (rash), sulfa drugs.

PHYSICAL EXAM: BP 158/96 mmHg, HR 88, RR 16, SpO2 96% on RA, Temp 98.8°F

ASSESSMENT: Unstable angina, Hypertension, Type 2 diabetes mellitus, Hyperlipidemia

PLAN: Cardiology referral, Aspirin, Increase lisinopril, Diabetes education`;

export default function AutoCoderTab({ patientName = '', patientMrn = '', patientDob = '', patientAge = '', patientGender = '', chiefComplaint = '', vitals = {}, medications = [], allergies = [], pmhSelected = {}, rosState = {}, rosSymptoms = {}, peState = {}, peFindings = {} }) {
  const [tab, setTab] = useState('note');
  const [icdCodes, setIcdCodes] = useState([]);
  const [cptCodes, setCptCodes] = useState([]);
  const [aiRationale, setAiRationale] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extractDone, setExtractDone] = useState(false);
  const [extractSummary, setExtractSummary] = useState('');
  const [icdManualCode, setIcdManualCode] = useState('');
  const [icdManualDesc, setIcdManualDesc] = useState('');
  const [cptManualCode, setCptManualCode] = useState('');
  const [cptManualDesc, setCptManualDesc] = useState('');
  const [toast, setToast] = useState(false);

  // Build comprehensive note from ALL NPI data
  const buildFullNote = () => {
    let note = '';
    if (patientName || patientAge || patientGender) {
      note += `${patientName || 'Patient'} is a ${patientAge || '?'}-year-old ${patientGender || 'unknown'}\n\n`;
    }
    if (chiefComplaint) note += `CHIEF COMPLAINT: ${chiefComplaint}\n\n`;
    if (Object.keys(vitals).length > 0) {
      note += `VITALS:\n`;
      Object.entries(vitals).forEach(([k, v]) => { if (v) note += `- ${k.toUpperCase()}: ${v}\n`; });
      note += '\n';
    }
    if (medications.length > 0) note += `MEDICATIONS: ${medications.join(', ')}\n\n`;
    if (allergies.length > 0) note += `ALLERGIES: ${allergies.join(', ')}\n\n`;
    const pmhList = Object.entries(pmhSelected).filter(([, v]) => v > 0).map(([k]) => k);
    if (pmhList.length > 0) note += `PAST MEDICAL HISTORY: ${pmhList.join(', ')}\n\n`;
    
    // Add ROS and PE summaries
    const rosAbn = Object.entries(rosState).filter(([, v]) => v === 2);
    if (rosAbn.length > 0) {
      note += `REVIEW OF SYSTEMS (Abnormal):\n`;
      rosAbn.forEach(([system]) => {
        note += `- ${system}: ABNORMAL${rosSymptoms[system]?.length ? ' — ' + rosSymptoms[system].join(', ') : ''}\n`;
      });
      note += '\n';
    }

    const peAbn = Object.entries(peState).filter(([, v]) => v === 2);
    if (peAbn.length > 0) {
      note += `PHYSICAL EXAMINATION (Abnormal):\n`;
      peAbn.forEach(([system]) => {
        note += `- ${system}: ${peFindings[system] || 'ABNORMAL'}\n`;
      });
      note += '\n';
    }

    return note || SAMPLE_NOTE;
  };

  const [noteText, setNoteText] = useState(() => buildFullNote());

  const selIcd = icdCodes.filter(c => c.selected);
  const selCpt = cptCodes.filter(c => c.selected);

  const switchTab = (t) => setTab(t);
  const navNext = () => { const i = TABS.indexOf(tab); if (i < TABS.length - 1) setTab(TABS[i + 1]); };
  const navBack = () => { const i = TABS.indexOf(tab); if (i > 0) setTab(TABS[i - 1]); };

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 2200); };

  const runExtraction = async () => {
    if (!noteText.trim()) return;
    setLoading(true);
    setAiMessages([{ type: 'thinking' }]);
    try {
      const prompt = `You are an expert medical coder (CPC certified) with deep knowledge of ICD-10-CM and CPT coding guidelines.

Analyze this clinical note and extract the most appropriate codes. Return ONLY valid JSON in exactly this format (no markdown, no explanation outside the JSON):

{
  "icd10": [
    {
      "code": "I20.0",
      "description": "Unstable angina",
      "category": "Primary Dx",
      "confidence": 95,
      "rationale": "Patient presents with classic unstable angina symptoms"
    }
  ],
  "cpt": [
    {
      "code": "99215",
      "description": "Office or other outpatient visit, high complexity MDM",
      "category": "E&M",
      "confidence": 90,
      "modifier": "",
      "rationale": "High complexity MDM, >50% counseling"
    }
  ],
  "summary": "Brief 2-3 sentence coding rationale.",
  "em_level": "99215",
  "principal_dx": "I20.0"
}

Guidelines:
- ICD-10: Include principal diagnosis first, then comorbidities actively managed, then relevant secondary diagnoses. Use most specific code.
- CPT: Include E&M code based on documented MDM or time, plus any procedures performed.
- Confidence: 90-99 high (clear documentation), 70-89 medium (implied), 50-69 low (uncertain)

Clinical Note:
${noteText}`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
      let parsed;
      try {
        const clean = (typeof result === 'string' ? result : JSON.stringify(result)).replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch (e) {
        throw new Error('Could not parse AI response. Please try again.');
      }

      const ts = Date.now();
      setIcdCodes((parsed.icd10 || []).map((c, i) => ({ ...c, selected: true, id: 'icd-' + ts + '-' + i })));
      setCptCodes((parsed.cpt || []).map((c, i) => ({ ...c, selected: true, id: 'cpt-' + ts + '-' + i, modifier: c.modifier || '' })));
      setAiRationale(parsed.summary || '');
      setAiMessages([{ type: 'result', data: parsed }]);
      setExtractDone(true);
      setExtractSummary(`Extracted ${(parsed.icd10 || []).length} ICD-10 and ${(parsed.cpt || []).length} CPT codes. Principal Dx: ${parsed.principal_dx || '—'}`);
    } catch (err) {
      setAiMessages([{ type: 'error', text: err.message }]);
    }
    setLoading(false);
  };

  const toggleCode = (type, id, checked) => {
    if (type === 'icd') setIcdCodes(prev => prev.map(c => c.id === id ? { ...c, selected: checked } : c));
    else setCptCodes(prev => prev.map(c => c.id === id ? { ...c, selected: checked } : c));
  };
  const removeCode = (type, id) => {
    if (type === 'icd') setIcdCodes(prev => prev.filter(c => c.id !== id));
    else setCptCodes(prev => prev.filter(c => c.id !== id));
  };
  const addManual = (type) => {
    const code = (type === 'icd' ? icdManualCode : cptManualCode).trim().toUpperCase();
    const desc = (type === 'icd' ? icdManualDesc : cptManualDesc).trim() || '(description pending)';
    if (!code) return;
    const obj = { code, description: desc, category: type === 'icd' ? 'Secondary Dx' : 'Procedure', confidence: 80, rationale: 'Manually added', selected: true, modifier: '', id: type + '-manual-' + Date.now() };
    if (type === 'icd') { setIcdCodes(prev => [...prev, obj]); setIcdManualCode(''); setIcdManualDesc(''); }
    else { setCptCodes(prev => [...prev, obj]); setCptManualCode(''); setCptManualDesc(''); }
  };

  const copyBilling = () => {
    let txt = `BILLING SUMMARY — Notrya\nDate: ${new Date().toLocaleDateString()}\n\nICD-10 CODES:\n`;
    selIcd.forEach(c => { txt += `  ${c.code}  ${c.description}\n`; });
    txt += `\nCPT CODES:\n`;
    selCpt.forEach(c => { txt += `  ${c.code}  ${c.description}${c.modifier ? ' (' + c.modifier + ')' : ''}\n`; });
    txt += `\nRATIONALE:\n${aiRationale}`;
    navigator.clipboard.writeText(txt).then(showToast);
  };

  const { denialCount } = useMemo(() => {
    if (selIcd.length + selCpt.length === 0) return { denialCount: 0 };
    const findings = runValidation(selIcd, selCpt);
    return { denialCount: findings.filter(f => f.type === 'denial').length };
  }, [selIcd, selCpt]);

  const avgConf = selIcd.length + selCpt.length > 0
    ? Math.round([...selIcd, ...selCpt].reduce((a, c) => a + c.confidence, 0) / (selIcd.length + selCpt.length))
    : null;
  const totalRVU = selCpt.reduce((a, c) => a + (RVU_MAP[c.code] || 2.0), 0);

  const CodeRow = ({ code, type }) => {
    const cc = confClass(code.confidence);
    const catCls = code.category?.includes('Primary') ? 'cat-dx' : 'cat-proc';
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px', borderRadius: '8px', border: '1px solid #1a3550', background: '#0f2237', transition: '.2s' }} className={code.selected ? 'sel' : ''}>
        <input type="checkbox" checked={code.selected} onChange={e => toggleCode(type, code.id, e.target.checked)} style={{ width: 16, height: 16, borderRadius: 4 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 600, color: '#00c6ff', marginRight: 8 }}>{code.code}</div>
          <div style={{ fontSize: 13, color: '#e8f0f8' }}>{code.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600, background: 'rgba(168,85,247,.18)', color: '#a855f7' }}>{code.category}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4d7a9e' }}>{code.confidence}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: '-16px -18px -100px', height: 'calc(100vh - 160px)', background: '#050f1e', color: '#e8f0f8', fontFamily: 'DM Sans', overflow: 'hidden', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'y', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tab === 'note' && (
          <>
            <div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Clinical Note Input</div>
              <div style={{ fontSize: 12, color: '#4d7a9e' }}>AI will extract diagnosis and procedure codes from the patient data</div>
            </div>
            <div style={{ background: '#0f2237', border: '1px solid #1a3550', borderRadius: 8, padding: '14px' }}>
              <textarea style={{ width: '100%', minHeight: 200, background: '#0f2237', border: '1px solid #1a3550', borderRadius: 8, color: '#e8f0f8', fontFamily: 'DM Sans', fontSize: 13, lineHeight: 1.7, padding: 14, resize: 'vertical', outline: 'none' }} placeholder="Clinical note…" value={noteText} onChange={e => setNoteText(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!loading && <button onClick={runExtraction} style={{ background: '#0096d6', border: 'none', borderRadius: 5, color: '#fff', padding: '4px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>✦ Extract Codes</button>}
              {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4d7a9e', fontSize: 13 }}>🔄 Analyzing…</div>}
              {extractDone && !loading && <button onClick={() => setTab('icd')} style={{ background: 'transparent', border: '1px solid #1f4060', borderRadius: 5, color: '#8fadc8', padding: '4px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>View Codes →</button>}
            </div>
            {extractDone && !loading && (
              <div style={{ background: 'rgba(0,229,160,.07)', border: '1px solid rgba(0,229,160,.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#8fadc8' }}>
                ✅ {extractSummary}
              </div>
            )}
          </>
        )}

        {tab === 'icd' && (
          <>
            <div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>ICD-10 Diagnosis Codes</div>
              <div style={{ fontSize: 12, color: '#4d7a9e' }}>Review and confirm diagnosis codes</div>
            </div>
            {icdCodes.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4d7a9e', padding: 48 }}>No codes yet — extract from note</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {icdCodes.map(c => <CodeRow key={c.id} code={c} type="icd" />)}
                </div>
                <div style={{ background: '#0a1929', border: '1px solid #1a3550', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a3550', fontSize: 12, fontWeight: 600, color: '#e8f0f8' }}>ADD ICD-10 CODE MANUALLY</div>
                  <div style={{ padding: 14, display: 'flex', gap: 8 }}>
                    <input placeholder="e.g. I10" value={icdManualCode} onChange={e => setIcdManualCode(e.target.value)} style={{ background: '#0f2237', border: '1px solid #1a3550', borderRadius: 6, color: '#e8f0f8', fontFamily: 'JetBrains Mono', fontSize: 13, padding: '6px 10px', width: 130 }} />
                    <input placeholder="Description" value={icdManualDesc} onChange={e => setIcdManualDesc(e.target.value)} style={{ flex: 1, background: '#0f2237', border: '1px solid #1a3550', borderRadius: 6, color: '#e8f0f8', fontSize: 13, padding: '6px 10px' }} />
                    <button onClick={() => addManual('icd')} style={{ background: '#0096d6', border: 'none', borderRadius: 5, color: '#fff', padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Add</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'cpt' && (
          <>
            <div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>CPT Procedure Codes</div>
              <div style={{ fontSize: 12, color: '#4d7a9e' }}>Review and confirm procedure and E&M codes</div>
            </div>
            {cptCodes.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4d7a9e', padding: 48 }}>No codes yet — extract from note</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cptCodes.map(c => <CodeRow key={c.id} code={c} type="cpt" />)}
                </div>
                <div style={{ background: '#0a1929', border: '1px solid #1a3550', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a3550', fontSize: 12, fontWeight: 600, color: '#e8f0f8' }}>ADD CPT CODE MANUALLY</div>
                  <div style={{ padding: 14, display: 'flex', gap: 8 }}>
                    <input placeholder="e.g. 99214" value={cptManualCode} onChange={e => setCptManualCode(e.target.value)} style={{ background: '#0f2237', border: '1px solid #1a3550', borderRadius: 6, color: '#e8f0f8', fontFamily: 'JetBrains Mono', fontSize: 13, padding: '6px 10px', width: 110 }} />
                    <input placeholder="Description" value={cptManualDesc} onChange={e => setCptManualDesc(e.target.value)} style={{ flex: 1, background: '#0f2237', border: '1px solid #1a3550', borderRadius: 6, color: '#e8f0f8', fontSize: 13, padding: '6px 10px' }} />
                    <button onClick={() => addManual('cpt')} style={{ background: '#0096d6', border: 'none', borderRadius: 5, color: '#fff', padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Add</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'billing' && (
          <>
            <div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Billing Summary</div>
              <div style={{ fontSize: 12, color: '#4d7a9e' }}>Final code set for claim submission</div>
            </div>
            
            {(selIcd.length + selCpt.length > 0) && (
              <div style={{ background: '#0a1929', border: '1px solid #1a3550', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a3550', fontSize: 12, fontWeight: 600, color: '#e8f0f8' }}>🛡️ CLAIM VALIDATION</div>
                <div style={{ padding: 14 }}>
                  <ClaimValidationPanel selIcd={selIcd} selCpt={selCpt} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <div style={{ background: '#0f2237', border: '1px solid #1a3550', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#4d7a9e', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>ICD-10 Codes</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 600, color: '#e8f0f8' }}>{selIcd.length}</div>
              </div>
              <div style={{ background: '#0f2237', border: '1px solid #1a3550', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#4d7a9e', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>CPT Codes</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 600, color: '#e8f0f8' }}>{selCpt.length}</div>
              </div>
              <div style={{ background: '#0f2237', border: '1px solid #1a3550', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#4d7a9e', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Avg Confidence</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 600, color: '#00e5a0' }}>{avgConf !== null ? avgConf + '%' : '—'}</div>
              </div>
              <div style={{ background: '#0f2237', border: '1px solid #1a3550', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#4d7a9e', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Est. RVU</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 600, color: '#f5a623' }}>{selCpt.length ? totalRVU.toFixed(1) : '—'}</div>
              </div>
            </div>

            {selIcd.length + selCpt.length > 0 ? (
              <>
                <button onClick={copyBilling} style={{ background: 'transparent', border: '1px solid #1f4060', borderRadius: 5, color: '#8fadc8', padding: '4px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>📋 Copy</button>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#4d7a9e', padding: 48 }}>No codes selected yet</div>
            )}
          </>
        )}
      </div>

      <div style={{ height: 50, background: '#0a1929', borderTop: '1px solid #1a3550', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[['note','📋 Note Input'],['icd','🏥 ICD-10'],['cpt','⚕️ CPT'],['billing','💳 Billing']].map(([id, label]) => (
            <button key={id} onClick={() => switchTab(id)} style={{ padding: '0 12px', height: 50, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderBottom: tab === id ? '2px solid #00c6ff' : '2px solid transparent', color: tab === id ? '#00c6ff' : '#4d7a9e', fontSize: 12, fontWeight: 500, background: 'transparent', border: 'none', fontFamily: 'DM Sans', transition: '.15s', whiteSpace: 'nowrap' }}>
              {label}
              {id === 'icd' && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, padding: '1px 5px', borderRadius: 8, background: '#132840', color: '#4d7a9e' }}>{icdCodes.length}</span>}
              {id === 'cpt' && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, padding: '1px 5px', borderRadius: 8, background: '#132840', color: '#4d7a9e' }}>{cptCodes.length}</span>}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#4d7a9e' }}>Step {TABS.indexOf(tab) + 1} of 4</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={navBack} style={{ padding: '4px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid #1f4060', background: 'transparent', color: '#8fadc8', fontFamily: 'DM Sans', opacity: tab === 'note' ? 0.4 : 1, pointerEvents: tab === 'note' ? 'none' : 'auto' }}>← Back</button>
          <button onClick={navNext} style={{ padding: '4px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid #0096d6', background: '#0096d6', color: '#fff', fontFamily: 'DM Sans', opacity: tab === 'billing' ? 0.4 : 1, pointerEvents: tab === 'billing' ? 'none' : 'auto' }}>Next →</button>
        </div>
      </div>
    </div>
  );
}