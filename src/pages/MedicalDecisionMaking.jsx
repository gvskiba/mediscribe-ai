import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MedicalDecisionMaking = () => {
  const [state, setState] = useState({
    labs: [],
    imaging: [],
    ekgs: [],
    interventions: [],
    rttStatus: '',
    evidenceInitial: [],
    evidenceFinal: [],
    mdmLevel: '',
  });

  const [currentTab, setCurrentTab] = useState('labs');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [aiMessages, setAiMessages] = useState([
    { role: 'sys', text: 'MDM assistant ready. Select a quick action or ask a clinical question. Patient context is included automatically.' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiInput = useRef(null);
  const aiMsgs = useRef(null);
  const orderIdCounter = useRef(0);
  const ekgCounter = useRef(0);

  const addOrder = (type) => {
    const id = ++orderIdCounter.current;
    const newOrder = {
      id,
      type,
      name: '',
      reason: '',
      result: '',
      interpretation: '',
      status: 'pending',
      ref: '',
    };

    setState(prev => ({
      ...prev,
      [type === 'lab' ? 'labs' : 'imaging']: [...prev[type === 'lab' ? 'labs' : 'imaging'], newOrder],
    }));
  };

  const deleteOrder = (id, type) => {
    setState(prev => ({
      ...prev,
      [type === 'lab' ? 'labs' : 'imaging']: prev[type === 'lab' ? 'labs' : 'imaging'].filter(o => o.id !== id),
    }));
  };

  const addEKG = () => {
    const id = ++ekgCounter.current;
    setState(prev => ({
      ...prev,
      ekgs: [...prev.ekgs, { id }],
    }));
  };

  const deleteEKG = (id) => {
    setState(prev => ({
      ...prev,
      ekgs: prev.ekgs.filter(e => e.id !== id),
    }));
  };

  const addIntervention = (e, time, detail, type, response, respType) => {
    if (!detail.trim()) return;
    const id = Date.now();
    setState(prev => ({
      ...prev,
      interventions: [...prev.interventions, { id, time, detail, type, response, respType }],
    }));
  };

  const deleteIntervention = (id) => {
    setState(prev => ({
      ...prev,
      interventions: prev.interventions.filter(i => i.id !== id),
    }));
  };

  const setRTT = (val) => {
    setState(prev => ({ ...prev, rttStatus: val }));
  };

  const setMDMLevel = (level) => {
    setState(prev => ({ ...prev, mdmLevel: level }));
  };

  const buildContext = () => {
    const lines = ['=== CURRENT MDM CONTEXT ==='];
    if (state.labs.length) {
      lines.push('\n--- LABS ---');
      state.labs.forEach(l => {
        lines.push(`${l.name || 'Lab'}: ${l.result || 'Pending'}${l.reason ? ` | Ordered for: ${l.reason}` : ''}${l.interpretation ? ` | Interpretation: ${l.interpretation}` : ''}`);
      });
    }
    if (state.imaging.length) {
      lines.push('\n--- IMAGING ---');
      state.imaging.forEach(i => {
        lines.push(`${i.name || 'Imaging'}: ${i.result || 'Pending'}${i.reason ? ` | Ordered for: ${i.reason}` : ''}${i.interpretation ? ` | Interpretation: ${i.interpretation}` : ''}`);
      });
    }
    if (state.ekgs.length) lines.push(`\n--- EKGs: ${state.ekgs.length} performed ---`);
    if (state.interventions.length) {
      lines.push('\n--- ED INTERVENTIONS ---');
      state.interventions.forEach(i => lines.push(`[${i.time || '—'}] ${i.type.toUpperCase()}: ${i.detail}${i.response ? ` → ${i.response}` : ''}`));
    }
    if (state.mdmLevel) lines.push(`MDM Level: ${state.mdmLevel}`);
    lines.push('\n===========================');
    return lines.join('\n');
  };

  const appendMsg = (role, text) => {
    setAiMessages(prev => [...prev, { role, text }]);
    setTimeout(() => {
      if (aiMsgs.current) aiMsgs.current.scrollTop = aiMsgs.current.scrollHeight;
    }, 0);
  };

  const aiQ = async (question) => {
    appendMsg('user', question);
    setAiLoading(true);
    const ctx = buildContext();
    const systemPrompt = `You are Notrya AI, a clinical assistant for ED documentation. Help physicians document medical decision making (MDM). Be concise, clinically accurate, and use ED context. Keep responses under 300 words unless generating a full note.`;

    const newHistory = [...conversationHistory, { role: 'user', content: `${ctx}\n\nQuestion: ${question}` }];
    setConversationHistory(newHistory);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY || '' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'No response received.';
      setConversationHistory([...newHistory, { role: 'assistant', content: reply }]);
      appendMsg('bot', reply);
    } catch (e) {
      appendMsg('sys', '⚠ Connection error. Check API configuration.');
    } finally {
      setAiLoading(false);
    }
  };

  const sendAI = () => {
    const val = aiInput.current?.value.trim();
    if (!val) return;
    aiInput.current.value = '';
    aiQ(val);
  };

  const saveMDM = () => {
    appendMsg('sys', '💾 MDM data saved to session.');
  };

  return (
    <div style={styles.root}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <span style={styles.navLogo}>notrya</span>
        <div style={styles.navSep} />
        <span style={styles.navTitle}>Medical Decision Making</span>
        <span style={styles.navBadge}>MDM</span>
        <div style={styles.navRight}>
          <Link to="/Home" style={styles.navBack}>← Back to Chart</Link>
          <button style={styles.navSave} onClick={saveMDM}>💾 Save MDM</button>
        </div>
      </nav>

      {/* VITALS BAR */}
      <div style={styles.vitalsBar}>
        <div style={styles.vbPatient}>
          <span style={styles.vbName}>— Patient —</span>
          <span style={styles.vbMeta}>Age · Sex · DOB</span>
        </div>
        <div style={styles.vbDiv} />
        <div style={styles.vbVital}>
          <span style={styles.vbLbl}>CC</span>
          <span style={{ ...styles.vbVal, color: '#ff9f43' }}>—</span>
        </div>
        <div style={styles.vbDiv} />
        <div style={styles.vbVital}>
          <span style={styles.vbLbl}>BP</span><span style={styles.vbVal}>—</span>
        </div>
        <div style={styles.vbVital}>
          <span style={styles.vbLbl}>HR</span><span style={styles.vbVal}>—</span>
        </div>
        <div style={styles.vbVital}>
          <span style={styles.vbLbl}>SpO₂</span><span style={styles.vbVal}>—</span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={styles.vbMdmBadge}>MDM: LOW</span>
      </div>

      {/* MAIN LAYOUT */}
      <div style={styles.mainWrap}>
        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.sbPatientCard}>
            <div style={styles.sbName}>New Patient</div>
            <div style={styles.sbMeta}>No demographics entered</div>
          </div>
          <div style={styles.sbLabel}>MDM Sections</div>
          <button style={styles.sbNavBtn} onClick={() => document.getElementById('sec-dx')?.scrollIntoView({ behavior: 'smooth' })}>
            🧪 Diagnostic Orders
          </button>
          <button style={styles.sbNavBtn} onClick={() => document.getElementById('sec-imp')?.scrollIntoView({ behavior: 'smooth' })}>
            🎯 Impressions
          </button>
          <button style={styles.sbNavBtn} onClick={() => document.getElementById('sec-mdm')?.scrollIntoView({ behavior: 'smooth' })}>
            ⚖️ MDM Complexity
          </button>
          <div style={styles.sbMdmProgress}>
            <div style={styles.sbMdmTitle}>MDM Summary</div>
            <div style={styles.sbMdmRow}>
              <span style={styles.sbMdmKey}>Labs ordered</span>
              <span style={styles.sbMdmVal}>{state.labs.length}</span>
            </div>
            <div style={styles.sbMdmRow}>
              <span style={styles.sbMdmKey}>Imaging ordered</span>
              <span style={styles.sbMdmVal}>{state.imaging.length}</span>
            </div>
            <div style={styles.sbMdmRow}>
              <span style={styles.sbMdmKey}>Interventions</span>
              <span style={styles.sbMdmVal}>{state.interventions.length}</span>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main style={styles.content} id="main-content">
          {/* DIAGNOSTIC ORDERS */}
          <div style={styles.sectionBox} id="sec-dx">
            <div style={styles.secHeader}>
              <span style={{ fontSize: '18px' }}>🧪</span>
              <div>
                <div style={styles.secTitle}>Diagnostic Orders & Results</div>
                <div style={styles.secSubtitle}>Document why each test was ordered and interpret the results</div>
              </div>
            </div>

            <div style={styles.dxTabs}>
              <button style={{ ...styles.dxTab, ...(currentTab === 'labs' && styles.dxTabActive) }} onClick={() => setCurrentTab('labs')}>
                🧬 Labs ({state.labs.length})
              </button>
              <button style={{ ...styles.dxTab, ...(currentTab === 'imaging' && styles.dxTabActive) }} onClick={() => setCurrentTab('imaging')}>
                🩻 Imaging ({state.imaging.length})
              </button>
            </div>

            {currentTab === 'labs' && (
              <div>
                {state.labs.map(lab => (
                  <OrderCard key={lab.id} order={lab} type="lab" onDelete={() => deleteOrder(lab.id, 'lab')} />
                ))}
                <button style={styles.addOrderBtn} onClick={() => addOrder('lab')}>＋ Add Lab Order</button>
              </div>
            )}

            {currentTab === 'imaging' && (
              <div>
                {state.imaging.map(img => (
                  <OrderCard key={img.id} order={img} type="imaging" onDelete={() => deleteOrder(img.id, 'imaging')} />
                ))}
                <button style={styles.addOrderBtn} onClick={() => addOrder('imaging')}>＋ Add Imaging Order</button>
              </div>
            )}
          </div>

          {/* IMPRESSIONS */}
          <div style={styles.sectionBox} id="sec-imp">
            <div style={styles.secHeader}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <div>
                <div style={styles.secTitle}>Clinical Impressions</div>
                <div style={styles.secSubtitle}>Initial working diagnosis and final assessment</div>
              </div>
            </div>
            <div style={styles.impressionGrid}>
              <ImpressionCard title="Initial Impression" variant="initial" />
              <ImpressionCard title="Final Impression / Diagnosis" variant="final" />
            </div>
          </div>

          {/* MDM COMPLEXITY */}
          <div style={styles.sectionBox} id="sec-mdm">
            <div style={styles.secHeader}>
              <span style={{ fontSize: '18px' }}>⚖️</span>
              <div>
                <div style={styles.secTitle}>MDM Complexity (E/M)</div>
                <div style={styles.secSubtitle}>Medical decision-making level per AMA E/M guidelines</div>
              </div>
            </div>
            <div style={styles.mdmGrid}>
              <div style={styles.mdmCard}>
                <div style={styles.mdmCardTitle}>Overall MDM Level</div>
                <div style={styles.complexitySelector}>
                  {['Straightforward', 'Low', 'Moderate', 'High'].map((level, i) => (
                    <button
                      key={i}
                      style={{
                        ...styles.complexityBtn,
                        ...(state.mdmLevel === level && styles.complexityBtnActive),
                      }}
                      onClick={() => setMDMLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.mdmCard}>
                <div style={styles.mdmCardTitle}>Data Reviewed & Analysed</div>
                {['Lab results reviewed', 'Imaging studies reviewed', 'EKG interpreted', 'Old records reviewed'].map((item, i) => (
                  <label key={i} style={styles.mdmCheckItem}>
                    <input type="checkbox" style={styles.checkbox} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* AI PANEL */}
        <aside style={styles.aiPanel}>
          <div style={styles.aiHeader}>
            <div style={styles.aiHeaderTop}>
              <div style={styles.aiDot} />
              <span style={styles.aiLabel}>Notrya AI</span>
              <span style={styles.aiModel}>claude-sonnet-4</span>
            </div>
            <div style={styles.aiQuickBtns}>
              <button style={styles.aiQBtn} onClick={() => aiQ('Review my diagnostic workup and suggest any additional tests.')}>📋 Review Workup</button>
              <button style={styles.aiQBtn} onClick={() => aiQ('What are the key differentials I should rule out?')}>🔀 Differentials</button>
            </div>
          </div>
          <div style={styles.aiMsgs} ref={aiMsgs}>
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ ...styles.aiMsg, ...styles[`aiMsg${msg.role}`] }}>
                {msg.text}
              </div>
            ))}
            {aiLoading && <div style={styles.aiLoader}><span></span><span></span><span></span></div>}
          </div>
          <div style={styles.aiInputWrap}>
            <textarea
              ref={aiInput}
              style={styles.aiInput}
              rows="2"
              placeholder="Ask a clinical question…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendAI();
                }
              }}
            />
            <button style={styles.aiSend} onClick={sendAI}>↑</button>
          </div>
        </aside>
      </div>

      {/* BOTTOM NAV */}
      <div style={styles.bottomNav}>
        <button style={styles.bnavBack}>← Summary</button>
        <div style={{ flex: 1 }} />
        <button style={styles.bnavGenNote} onClick={() => aiQ('Generate a complete, structured Medical Decision Making (MDM) documentation note.')}>
          ✨ Generate Full MDM Note
        </button>
        <button style={styles.bnavNext} onClick={saveMDM}>💾 Save & Finish</button>
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, type, onDelete }) => {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState(order.name);
  const [reason, setReason] = useState(order.reason);
  const [result, setResult] = useState(order.result);
  const [interp, setInterp] = useState(order.interpretation);
  const [status, setStatus] = useState(order.status);

  return (
    <div style={{ ...styles.orderCard, ...(open && styles.orderCardOpen) }}>
      <div style={styles.orderHeader} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: '16px' }}>{type === 'lab' ? '🧬' : '🩻'}</span>
        <span style={styles.orderName}>{name || (type === 'lab' ? 'New Lab Order' : 'New Imaging Order')}</span>
        <span style={{ ...styles.orderStatus, ...styles[`orderStatus${status}`] }}>{status.toUpperCase()}</span>
        <span style={styles.orderChevron}>▼</span>
      </div>
      {open && (
        <div style={styles.orderBody}>
          <div style={styles.orderRow}>
            <div style={styles.orderField}>
              <label style={styles.ofLabel}>{type === 'lab' ? 'Lab / Panel Name' : 'Modality'}</label>
              <input style={styles.ofInput} value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'lab' ? 'e.g. Troponin, CBC, BMP…' : 'e.g. CXR, CT Chest…'} />
            </div>
          </div>
          <div style={styles.orderField}>
            <label style={styles.ofLabel}>Clinical Rationale</label>
            <textarea style={styles.ofTextarea} value={reason} onChange={(e) => setReason(e.target.value)} rows="2" placeholder="Why was this ordered?" />
          </div>
          <div style={styles.orderRow}>
            <div style={styles.orderField}>
              <label style={styles.ofLabel}>Result / Findings</label>
              <input style={styles.ofInput} value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. Troponin 0.82 ng/mL (H)" />
            </div>
            <div style={styles.orderField}>
              <label style={styles.ofLabel}>Status</label>
              <select style={styles.ofSelect} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="resulted">Resulted — Normal</option>
                <option value="abnormal">Resulted — Abnormal</option>
                <option value="critical">Critical Value</option>
              </select>
            </div>
          </div>
          <div style={styles.orderField}>
            <label style={styles.ofLabel}>Clinical Interpretation</label>
            <textarea style={styles.ofTextarea} value={interp} onChange={(e) => setInterp(e.target.value)} rows="2" placeholder="Explain the significance…" />
          </div>
          <button style={styles.orderDelBtn} onClick={onDelete}>✕ Remove</button>
        </div>
      )}
    </div>
  );
};

// Impression Card Component
const ImpressionCard = ({ title, variant }) => {
  const [dx, setDx] = useState('');
  const [rationale, setRationale] = useState('');
  const [icd, setIcd] = useState('');

  return (
    <div style={{ ...styles.impressionCard, ...(variant === 'initial' ? styles.impressionCardInitial : styles.impressionCardFinal) }}>
      <div style={{ ...styles.impLabel, ...(variant === 'initial' ? styles.impLabelInitial : styles.impLabelFinal) }}>
        {variant === 'initial' ? '⚡' : '✅'} {title}
      </div>
      <input style={styles.impDxInput} value={dx} onChange={(e) => setDx(e.target.value)} placeholder={variant === 'initial' ? 'Working diagnosis on presentation…' : 'Confirmed diagnosis at disposition…'} />
      <div style={styles.ofLabel}>Clinical rationale</div>
      <textarea style={styles.impRationale} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Explain the clinical reasoning…" />
      {variant === 'final' && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <input style={{ ...styles.ofInput, flex: 1 }} value={icd} onChange={(e) => setIcd(e.target.value)} placeholder="ICD-10 Code (e.g. I21.9)" />
          <select style={styles.ofSelect}>
            <option>— Disposition —</option>
            <option>Discharge Home</option>
            <option>Admit to Ward</option>
            <option>ICU</option>
          </select>
        </div>
      )}
    </div>
  );
};

const styles = {
  root: {
    width: '100%',
    height: '100%',
    background: '#050f1e',
    color: '#e8f0fe',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '50px',
    background: '#081628',
    borderBottom: '1px solid #1a3555',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    zIndex: 100,
  },
  navLogo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: 700,
    color: '#00d4ff',
    letterSpacing: '-0.5px',
  },
  navSep: {
    width: '1px',
    height: '22px',
    background: '#1a3555',
  },
  navTitle: {
    fontSize: '13px',
    color: '#8aaccc',
    fontWeight: 500,
  },
  navBadge: {
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '20px',
    padding: '2px 10px',
    fontSize: '11px',
    color: '#00e5c0',
    fontFamily: "'JetBrains Mono', monospace",
  },
  navRight: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navBack: {
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '8px',
    padding: '5px 12px',
    fontSize: '12px',
    color: '#8aaccc',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  navSave: {
    background: '#00e5c0',
    color: '#050f1e',
    border: 'none',
    borderRadius: '8px',
    padding: '5px 14px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  vitalsBar: {
    position: 'fixed',
    top: '50px',
    left: 0,
    right: 0,
    height: '38px',
    background: '#081628',
    borderBottom: '1px solid #1a3555',
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    gap: '10px',
    zIndex: 99,
    overflow: 'hidden',
  },
  vbPatient: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  vbName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '14px',
    color: '#e8f0fe',
    fontWeight: 600,
  },
  vbMeta: {
    fontSize: '11px',
    color: '#4a6a8a',
  },
  vbDiv: {
    width: '1px',
    height: '20px',
    background: '#1a3555',
  },
  vbVital: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  vbLbl: {
    color: '#4a6a8a',
    fontSize: '10px',
  },
  vbVal: {
    color: '#8aaccc',
  },
  vbMdmBadge: {
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '20px',
    padding: '2px 10px',
    fontFamily: "'JetBrains Mono', monospace",
    background: 'rgba(0,229,192,0.12)',
    color: '#00e5c0',
    border: '1px solid rgba(0,229,192,0.3)',
  },
  mainWrap: {
    position: 'fixed',
    top: '88px',
    left: 0,
    right: 0,
    bottom: '60px',
    display: 'flex',
  },
  sidebar: {
    width: '220px',
    flexShrink: 0,
    background: '#081628',
    borderRight: '1px solid #1a3555',
    overflowY: 'auto',
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sbPatientCard: {
    background: '#0b1e36',
    border: '1px solid #1a3555',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '6px',
  },
  sbName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '15px',
    fontWeight: 600,
    color: '#e8f0fe',
  },
  sbMeta: {
    fontSize: '11px',
    color: '#4a6a8a',
    marginTop: '3px',
  },
  sbLabel: {
    fontSize: '10px',
    color: '#4a6a8a',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '0 4px',
    marginTop: '4px',
  },
  sbNavBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: '1px solid transparent',
    fontSize: '12px',
    color: '#8aaccc',
    background: 'transparent',
    fontFamily: 'inherit',
  },
  sbMdmProgress: {
    padding: '8px 10px',
    background: '#0b1e36',
    borderRadius: '8px',
    border: '1px solid #1a3555',
    marginTop: '8px',
  },
  sbMdmTitle: {
    fontSize: '10px',
    color: '#4a6a8a',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
  },
  sbMdmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px',
  },
  sbMdmKey: {
    fontSize: '11px',
    color: '#8aaccc',
  },
  sbMdmVal: {
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#4a6a8a',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 20px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionBox: {
    background: '#081628',
    border: '1px solid #1a3555',
    borderRadius: '12px',
    padding: '16px 18px',
  },
  secHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  secTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '17px',
    fontWeight: 600,
    color: '#e8f0fe',
  },
  secSubtitle: {
    fontSize: '12px',
    color: '#4a6a8a',
    marginTop: '1px',
  },
  dxTabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '14px',
  },
  dxTab: {
    padding: '6px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #1a3555',
    color: '#8aaccc',
    background: '#0b1e36',
    transition: 'all 0.15s',
  },
  dxTabActive: {
    background: 'rgba(59,158,255,0.12)',
    borderColor: 'rgba(59,158,255,0.4)',
    color: '#3b9eff',
  },
  addOrderBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px',
    border: '1px dashed #1a3555',
    borderRadius: '12px',
    background: 'transparent',
    color: '#4a6a8a',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    width: '100%',
    fontFamily: 'inherit',
    marginTop: '8px',
  },
  orderCard: {
    background: '#0b1e36',
    border: '1px solid #1a3555',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
    marginBottom: '10px',
  },
  orderCardOpen: {
    borderColor: '#2a4f7a',
  },
  orderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px 14px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  orderName: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#e8f0fe',
    flex: 1,
  },
  orderStatus: {
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    padding: '2px 8px',
    borderRadius: '20px',
    fontWeight: 600,
    flexShrink: 0,
  },
  orderStatuspending: {
    background: 'rgba(74,106,138,0.3)',
    color: '#4a6a8a',
  },
  orderStatusresulted: {
    background: 'rgba(0,229,192,0.12)',
    color: '#00e5c0',
    border: '1px solid rgba(0,229,192,0.25)',
  },
  orderChevron: {
    color: '#4a6a8a',
    fontSize: '11px',
    flexShrink: 0,
    transition: 'transform 0.2s',
  },
  orderBody: {
    display: 'block',
    padding: '0 14px 14px',
  },
  orderRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '10px',
  },
  orderField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  ofLabel: {
    fontSize: '10px',
    color: '#4a6a8a',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  ofInput: {
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '8px',
    padding: '7px 10px',
    color: '#e8f0fe',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
  },
  ofTextarea: {
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '8px',
    padding: '8px 10px',
    color: '#e8f0fe',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '60px',
    width: '100%',
    transition: 'border-color 0.15s',
    lineHeight: 1.5,
  },
  ofSelect: {
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '8px',
    padding: '7px 10px',
    color: '#e8f0fe',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  orderDelBtn: {
    background: 'rgba(255,107,107,0.1)',
    border: '1px solid rgba(255,107,107,0.2)',
    borderRadius: '8px',
    padding: '5px 10px',
    fontSize: '11px',
    color: '#ff6b6b',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
    marginTop: '8px',
  },
  impressionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  impressionCard: {
    background: '#0b1e36',
    border: '1px solid #1a3555',
    borderRadius: '12px',
    padding: '16px',
  },
  impressionCardInitial: {
    borderTop: '2px solid #f5c842',
  },
  impressionCardFinal: {
    borderTop: '2px solid #00e5c0',
  },
  impLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: '10px',
  },
  impLabelInitial: {
    color: '#f5c842',
  },
  impLabelFinal: {
    color: '#00e5c0',
  },
  impDxInput: {
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#e8f0fe',
    fontFamily: "'Playfair Display', serif",
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
    marginBottom: '10px',
  },
  impRationale: {
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '8px',
    padding: '8px 10px',
    color: '#e8f0fe',
    fontFamily: 'inherit',
    fontSize: '12px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '70px',
    width: '100%',
    lineHeight: 1.5,
    marginTop: '8px',
    transition: 'border-color 0.15s',
  },
  mdmGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  mdmCard: {
    background: '#0b1e36',
    border: '1px solid #1a3555',
    borderRadius: '12px',
    padding: '14px',
  },
  mdmCardTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8aaccc',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  complexitySelector: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  complexityBtn: {
    flex: 1,
    padding: '8px 6px',
    borderRadius: '8px',
    border: '1px solid #1a3555',
    background: '#0e2544',
    color: '#8aaccc',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: 'inherit',
  },
  complexityBtnActive: {
    background: 'rgba(59,158,255,0.12)',
    borderColor: '#3b9eff',
    color: '#3b9eff',
  },
  mdmCheckItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '6px',
    transition: 'background 0.1s',
  },
  checkbox: {
    accentColor: '#3b9eff',
    width: '13px',
    height: '13px',
    cursor: 'pointer',
  },
  aiPanel: {
    width: '295px',
    flexShrink: 0,
    background: '#081628',
    borderLeft: '1px solid #1a3555',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  aiHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid #1a3555',
    flexShrink: 0,
  },
  aiHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  aiDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00e5c0',
    flexShrink: 0,
    animation: 'pulse 2s ease-in-out infinite',
  },
  aiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8aaccc',
  },
  aiModel: {
    marginLeft: 'auto',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '20px',
    padding: '1px 7px',
    color: '#4a6a8a',
  },
  aiQuickBtns: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  aiQBtn: {
    padding: '3px 9px',
    borderRadius: '20px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: '#0e2544',
    border: '1px solid #1a3555',
    color: '#8aaccc',
    fontFamily: 'inherit',
  },
  aiMsgs: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  aiMsg: {
    padding: '9px 11px',
    borderRadius: '8px',
    fontSize: '12px',
    lineHeight: 1.55,
    maxWidth: '100%',
  },
  aiMsgsys: {
    background: '#0e2544',
    color: '#4a6a8a',
    fontStyle: 'italic',
    border: '1px solid #1a3555',
  },
  aiMsguser: {
    background: 'rgba(59,158,255,0.12)',
    border: '1px solid rgba(59,158,255,0.25)',
    color: '#8aaccc',
    alignSelf: 'flex-end',
  },
  aiMsgbot: {
    background: 'rgba(0,229,192,0.07)',
    border: '1px solid rgba(0,229,192,0.18)',
    color: '#e8f0fe',
  },
  aiLoader: {
    display: 'flex',
    gap: '5px',
    padding: '10px 12px',
    alignItems: 'center',
  },
  aiInputWrap: {
    padding: '10px 12px',
    borderTop: '1px solid #1a3555',
    flexShrink: 0,
    display: 'flex',
    gap: '6px',
  },
  aiInput: {
    flex: 1,
    background: '#0e2544',
    border: '1px solid #1a3555',
    borderRadius: '8px',
    padding: '7px 10px',
    color: '#e8f0fe',
    fontSize: '12px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
  },
  aiSend: {
    background: '#00e5c0',
    color: '#050f1e',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    flexShrink: 0,
    fontWeight: 700,
    transition: 'filter 0.15s',
    fontFamily: 'inherit',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: '#081628',
    borderTop: '1px solid #1a3555',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '10px',
    zIndex: 100,
  },
  bnavBack: {
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: '#0e2544',
    border: '1px solid #1a3555',
    color: '#8aaccc',
    fontFamily: 'inherit',
  },
  bnavNext: {
    background: '#3b9eff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 18px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'filter 0.15s',
    fontFamily: 'inherit',
  },
  bnavGenNote: {
    background: 'rgba(0,229,192,0.12)',
    border: '1px solid rgba(0,229,192,0.3)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#00e5c0',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
};

export default MedicalDecisionMaking;