import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// ─── CSS (scoped to .cc-panel) ────────────────────────────────────────────────
const PANEL_CSS = `
.cc-panel {
  width:300px;flex-shrink:0;background:#060e1c;border-left:1px solid #1a3555;
  display:flex;flex-direction:column;overflow:hidden;font-family:'DM Sans',sans-serif;
}
.cc-tabs {
  display:flex;border-bottom:1px solid #1a3555;background:#040d1a;flex-shrink:0;
}
.cc-tab {
  flex:1;padding:9px 4px;font-size:11px;font-weight:500;border:none;background:transparent;
  color:#4a6a8a;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;
  border-bottom:2px solid transparent;
}
.cc-tab:hover{color:#8aaccc;}
.cc-tab.active{color:#3b9eff;border-bottom-color:#3b9eff;background:#040d1a;}
.cc-body{flex:1;overflow-y:auto;padding:12px 14px;}
.cc-body::-webkit-scrollbar{width:3px}
.cc-body::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}

/* Section heading */
.cc-heading{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#2e4a6a;
  padding:4px 0 6px;font-weight:700;display:flex;align-items:center;gap:6px;}
.cc-heading::after{content:'';flex:1;height:1px;background:#1a3555;}

/* Patient chip */
.cc-patient-card{background:#081628;border:1px solid #2a4f7a;border-radius:8px;padding:10px 12px;margin-bottom:12px;}
.cc-patient-name{font-size:13px;font-weight:600;color:#e8f0fe;margin-bottom:3px;}
.cc-patient-meta{font-size:10px;color:#4a6a8a;display:flex;gap:8px;flex-wrap:wrap;}
.cc-patient-tag{font-size:9px;padding:2px 7px;border-radius:3px;font-weight:600;background:#0a2040;color:#3b9eff;border:1px solid #1a3555;}
.cc-no-note{text-align:center;padding:28px 16px;color:#4a6a8a;}
.cc-no-note-icon{font-size:28px;margin-bottom:8px;}
.cc-no-note-text{font-size:11px;line-height:1.6;}
.cc-load-btn{width:100%;margin-top:10px;padding:8px;background:#0a1e35;border:1px solid #2a4f7a;
  border-radius:7px;color:#3b9eff;font-size:11px;font-weight:600;cursor:pointer;
  transition:all .15s;font-family:'DM Sans',sans-serif;}
.cc-load-btn:hover{background:#0e2844;}
.cc-load-btn:disabled{opacity:.5;cursor:not-allowed;}

/* Insight cards */
.cc-insight{background:#0b1e36;border:1px solid #1a3555;border-radius:8px;padding:10px 12px;margin-bottom:8px;}
.cc-insight.warning{border-left:3px solid #ff6b6b;background:#150708;}
.cc-insight.caution{border-left:3px solid #f5c842;background:#140e00;}
.cc-insight.info{border-left:3px solid #3b9eff;background:#040f22;}
.cc-insight.ok{border-left:3px solid #3dffa0;background:#021408;}
.cc-insight-header{display:flex;align-items:center;gap:6px;margin-bottom:5px;}
.cc-insight-icon{font-size:13px;flex-shrink:0;}
.cc-insight-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
.cc-insight.warning .cc-insight-label{color:#ff6b6b;}
.cc-insight.caution .cc-insight-label{color:#f5c842;}
.cc-insight.info .cc-insight-label{color:#3b9eff;}
.cc-insight.ok .cc-insight-label{color:#3dffa0;}
.cc-insight-body{font-size:11px;color:#8aaccc;line-height:1.55;}
.cc-insight-drug{font-family:'JetBrains Mono',monospace;font-size:10px;color:#00d4ff;
  background:#052535;padding:1px 6px;border-radius:3px;display:inline-block;margin-bottom:3px;}
.cc-insight-adj{font-family:'JetBrains Mono',monospace;font-size:10px;color:#f5c842;
  background:#1a1500;padding:1px 6px;border-radius:3px;display:inline-block;}

/* Loading state */
.cc-loader{display:flex;flex-direction:column;gap:10px;padding:8px 0;}
.cc-loader-row{display:flex;align-items:center;gap:8px;font-size:11px;color:#4a6a8a;}
.cc-dot{width:6px;height:6px;border-radius:50%;background:#00e5c0;animation:ccbounce 1.2s infinite;}
.cc-dot:nth-child(2){animation-delay:.2s;}
.cc-dot:nth-child(3){animation-delay:.4s;}
@keyframes ccbounce{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}

/* Meds/diag list */
.cc-chip-list{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;}
.cc-chip{font-size:10px;padding:2px 8px;border-radius:10px;border:1px solid #1a3555;
  background:#081628;color:#8aaccc;}
.cc-chip.med{border-color:rgba(0,212,255,.3);color:#00d4ff;}
.cc-chip.diag{border-color:rgba(155,109,255,.3);color:#9b6dff;}
.cc-chip.lab-ab{border-color:rgba(255,107,107,.3);color:#ff6b6b;}

/* AI Chat panel */
.cc-chat{flex:1;overflow-y:auto;padding:10px 12px;}
.cc-chat::-webkit-scrollbar{width:3px}
.cc-chat::-webkit-scrollbar-thumb{background:#1a3555}
.cc-ai-msg{padding:9px 11px;border-radius:7px;margin-bottom:8px;font-size:11px;line-height:1.6;}
.cc-ai-msg.system{background:#0b1e36;border:1px solid #1a3555;color:#8aaccc;}
.cc-ai-msg.user{background:#0a2040;border:1px solid rgba(59,158,255,.2);color:#e8f0fe;text-align:right;}
.cc-ai-msg.assistant{background:#062020;border:1px solid rgba(0,229,192,.15);color:#8aaccc;}
.cc-ai-msg.loading{display:flex;gap:4px;align-items:center;background:#0b1e36;border:1px solid #1a3555;}
.cc-ai-label{font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#00e5c0;margin-bottom:4px;font-weight:600;}
.cc-input-wrap{padding:10px 12px;border-top:1px solid #1a3555;flex-shrink:0;}
.cc-input-row{display:flex;gap:6px;}
.cc-input{flex:1;height:34px;background:#0b1e36;border:1px solid #1a3555;border-radius:7px;
  padding:0 10px;color:#e8f0fe;font-size:11px;font-family:'DM Sans',sans-serif;outline:none;}
.cc-input:focus{border-color:#00e5c0;}
.cc-input::placeholder{color:#2e4a6a;}
.cc-send{width:34px;height:34px;background:#062020;border:1px solid rgba(0,229,192,.3);
  border-radius:7px;color:#00e5c0;font-size:15px;display:flex;align-items:center;
  justify-content:center;cursor:pointer;}
.cc-send:hover{background:#0a3030;}

/* Dot */
.cc-live-dot{width:7px;height:7px;border-radius:50%;background:#00e5c0;
  animation:cc-pulse 2s infinite;flex-shrink:0;}
@keyframes cc-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 3px rgba(0,229,192,0)}}
`;

// ─── Helper to parse note data ────────────────────────────────────────────────
function extractNoteContext(note) {
  const meds = note.medications || [];
  const diags = note.diagnoses || [];
  const labs = note.lab_findings || [];
  const allergies = note.allergies || [];

  // Pull renal/hepatic markers from labs
  const creatinine = labs.find(l => /creatinine/i.test(l.test_name));
  const gfr = labs.find(l => /gfr|egfr/i.test(l.test_name));
  const bilirubin = labs.find(l => /bilirubin/i.test(l.test_name));
  const ast = labs.find(l => /\bast\b/i.test(l.test_name));
  const alt = labs.find(l => /\balt\b/i.test(l.test_name));

  const abnormalLabs = labs.filter(l => l.status === 'abnormal' || l.status === 'critical');

  return { meds, diags, labs, allergies, creatinine, gfr, bilirubin, ast, alt, abnormalLabs };
}

// ─── Clinical Context Panel ───────────────────────────────────────────────────
export default function ClinicalContextPanel() {
  const [mode, setMode] = useState('context'); // 'context' | 'chat'
  const [note, setNote] = useState(null);
  const [loadingNote, setLoadingNote] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([{
    role: 'system',
    content: 'Ask me about guidelines, drug interactions, dosing for specific patients, or any clinical question.'
  }]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, chatLoading]);

  const loadLatestNote = async () => {
    setLoadingNote(true);
    setAnalysis(null);
    setAnalysisError(false);
    try {
      const notes = await base44.entities.ClinicalNote.filter({ status: 'draft' }, '-updated_date', 1);
      if (notes.length > 0) {
        setNote(notes[0]);
        runAnalysis(notes[0]);
      } else {
        // Try any note
        const anyNotes = await base44.entities.ClinicalNote.list('-updated_date', 1);
        if (anyNotes.length > 0) {
          setNote(anyNotes[0]);
          runAnalysis(anyNotes[0]);
        } else {
          setNote(null);
        }
      }
    } catch {
      setNote(null);
    }
    setLoadingNote(false);
  };

  const runAnalysis = async (n) => {
    const ctx = extractNoteContext(n);
    if (ctx.meds.length === 0 && ctx.diags.length === 0 && ctx.labs.length === 0) {
      // Not enough data — still show what we have
      setAnalysis({ empty: true });
      return;
    }

    setAnalyzing(true);
    setAnalysisError(false);

    const prompt = `You are a clinical pharmacist and physician AI assistant. Analyze this patient's clinical data and return a JSON object with targeted clinical recommendations.

Patient: ${n.patient_name || 'Unknown'} | Age: ${n.patient_age || 'Unknown'} | Chief Complaint: ${n.chief_complaint || n.summary || 'Not specified'}

ACTIVE MEDICATIONS: ${ctx.meds.join(', ') || 'None documented'}
DIAGNOSES: ${ctx.diags.join(', ') || 'None documented'}
ALLERGIES: ${ctx.allergies.join(', ') || 'None'}
LABS (abnormal): ${ctx.abnormalLabs.map(l => `${l.test_name}: ${l.result} ${l.unit || ''} [${l.status}]`).join(', ') || 'None'}
Creatinine: ${ctx.creatinine ? `${ctx.creatinine.result} ${ctx.creatinine.unit || ''}` : 'Not available'}
eGFR: ${ctx.gfr ? `${ctx.gfr.result} ${ctx.gfr.unit || ''}` : 'Not available'}
Bilirubin: ${ctx.bilirubin ? `${ctx.bilirubin.result}` : 'Not available'}
AST/ALT: ${ctx.ast ? ctx.ast.result : 'N/A'} / ${ctx.alt ? ctx.alt.result : 'N/A'}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "guidelines": [
    { "condition": "condition name", "recommendation": "brief actionable guideline recommendation", "source": "ACC/AHA or other org", "priority": "high|medium|low" }
  ],
  "dose_adjustments": [
    { "drug": "drug name", "reason": "renal/hepatic reason", "current_use": "why patient takes it", "adjustment": "specific dose adjustment recommendation", "severity": "required|consider|monitor" }
  ],
  "contraindications": [
    { "drug": "drug name", "issue": "contraindication or interaction description", "interacting_with": "drug/condition/allergy it interacts with", "severity": "absolute|relative|caution" }
  ],
  "monitoring": [
    { "parameter": "what to monitor", "reason": "why", "frequency": "how often" }
  ]
}

Focus only on clinically significant findings. If no relevant items for a category, return an empty array. Be specific and actionable.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            guidelines: { type: 'array', items: { type: 'object' } },
            dose_adjustments: { type: 'array', items: { type: 'object' } },
            contraindications: { type: 'array', items: { type: 'object' } },
            monitoring: { type: 'array', items: { type: 'object' } },
          }
        }
      });
      setAnalysis(res);
    } catch {
      setAnalysisError(true);
    }
    setAnalyzing(false);
  };

  const sendChat = async (q) => {
    const text = q || input.trim();
    if (!text || chatLoading) return;
    setInput('');
    const noteCtx = note
      ? `\n\nCurrent patient context: ${note.patient_name || ''}, medications: ${(note.medications||[]).join(', ')}, diagnoses: ${(note.diagnoses||[]).join(', ')}.`
      : '';
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setChatLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical knowledge assistant for physicians. Answer concisely and clinically.${noteCtx}\n\nQuestion: ${text}`,
        add_context_from_internet: true,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠ Unable to reach AI. Please try again.' }]);
    }
    setChatLoading(false);
  };

  const ctx = note ? extractNoteContext(note) : null;

  const priorityColor = { high: '#ff6b6b', medium: '#f5c842', low: '#3b9eff' };
  const severityClass = { absolute: 'warning', relative: 'caution', caution: 'caution' };
  const adjClass = { required: 'warning', consider: 'caution', monitor: 'info' };

  return (
    <>
      <style>{PANEL_CSS}</style>
      <aside className="cc-panel">
        {/* Tab row */}
        <div className="cc-tabs">
          <button className={`cc-tab${mode === 'context' ? ' active' : ''}`} onClick={() => setMode('context')}>
            🩺 Clinical Context
          </button>
          <button className={`cc-tab${mode === 'chat' ? ' active' : ''}`} onClick={() => setMode('chat')}>
            <span className="cc-live-dot" style={{ display: 'inline-block', marginRight: 4 }} />AI Chat
          </button>
        </div>

        {/* ── CLINICAL CONTEXT MODE ── */}
        {mode === 'context' && (
          <div className="cc-body">
            {!note ? (
              <div className="cc-no-note">
                <div className="cc-no-note-icon">🩺</div>
                <div className="cc-no-note-text">
                  Load a clinical note to get AI-powered guideline suggestions, dose adjustments, and contraindication alerts based on this patient's data.
                </div>
                <button className="cc-load-btn" onClick={loadLatestNote} disabled={loadingNote}>
                  {loadingNote ? '⏳ Loading...' : '⚡ Load Latest Note'}
                </button>
              </div>
            ) : (
              <>
                {/* Patient card */}
                <div className="cc-patient-card">
                  <div className="cc-patient-name">{note.patient_name || 'Unknown Patient'}</div>
                  <div className="cc-patient-meta">
                    {note.patient_age && <span>{note.patient_age}</span>}
                    {note.patient_gender && <span style={{ textTransform: 'capitalize' }}>{note.patient_gender}</span>}
                    {note.status && <span className="cc-patient-tag">{note.status}</span>}
                    {note.note_type && <span className="cc-patient-tag" style={{ color: '#9b6dff', borderColor: 'rgba(155,109,255,.3)' }}>{note.note_type?.replace('_', ' ')}</span>}
                  </div>
                </div>

                {/* Medications */}
                {ctx.meds.length > 0 && (
                  <>
                    <div className="cc-heading">Active Medications</div>
                    <div className="cc-chip-list">
                      {ctx.meds.map((m, i) => <span key={i} className="cc-chip med">{m}</span>)}
                    </div>
                  </>
                )}

                {/* Diagnoses */}
                {ctx.diags.length > 0 && (
                  <>
                    <div className="cc-heading">Diagnoses</div>
                    <div className="cc-chip-list">
                      {ctx.diags.map((d, i) => <span key={i} className="cc-chip diag">{d}</span>)}
                    </div>
                  </>
                )}

                {/* Abnormal labs */}
                {ctx.abnormalLabs.length > 0 && (
                  <>
                    <div className="cc-heading">Abnormal Labs</div>
                    <div className="cc-chip-list">
                      {ctx.abnormalLabs.map((l, i) => (
                        <span key={i} className="cc-chip lab-ab">{l.test_name}: {l.result} {l.unit || ''}</span>
                      ))}
                    </div>
                  </>
                )}

                {/* Reload button */}
                <button className="cc-load-btn" style={{ marginBottom: 14 }} onClick={loadLatestNote} disabled={loadingNote || analyzing}>
                  {loadingNote || analyzing ? '⏳ Analyzing...' : '🔄 Re-analyze'}
                </button>

                {/* Analysis */}
                {analyzing && (
                  <div className="cc-loader">
                    <div className="cc-loader-row"><div className="cc-dot"/><div className="cc-dot"/><div className="cc-dot"/><span>Running clinical analysis...</span></div>
                    <div className="cc-loader-row" style={{ paddingLeft: 20, opacity: .6 }}>Checking dose adjustments for renal/hepatic function...</div>
                    <div className="cc-loader-row" style={{ paddingLeft: 20, opacity: .6 }}>Screening for contraindications...</div>
                    <div className="cc-loader-row" style={{ paddingLeft: 20, opacity: .6 }}>Matching relevant guidelines...</div>
                  </div>
                )}

                {analysisError && (
                  <div className="cc-insight warning">
                    <div className="cc-insight-header"><span className="cc-insight-icon">⚠</span><span className="cc-insight-label">Analysis Failed</span></div>
                    <div className="cc-insight-body">Could not complete AI analysis. Check connection and try again.</div>
                  </div>
                )}

                {analysis && !analyzing && !analysis.empty && (
                  <>
                    {/* Contraindications */}
                    {analysis.contraindications?.length > 0 && (
                      <>
                        <div className="cc-heading">Contraindications & Interactions</div>
                        {analysis.contraindications.map((c, i) => (
                          <div key={i} className={`cc-insight ${severityClass[c.severity] || 'caution'}`}>
                            <div className="cc-insight-header">
                              <span className="cc-insight-icon">{c.severity === 'absolute' ? '🚫' : '⚠️'}</span>
                              <span className="cc-insight-label">{c.severity?.toUpperCase() || 'CAUTION'}</span>
                            </div>
                            <div className="cc-insight-body">
                              <span className="cc-insight-drug">{c.drug}</span>
                              <div style={{ marginTop: 4 }}>{c.issue}</div>
                              {c.interacting_with && (
                                <div style={{ marginTop: 3, fontSize: 10, color: '#4a6a8a' }}>
                                  Interacts with: <span style={{ color: '#8aaccc' }}>{c.interacting_with}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Dose Adjustments */}
                    {analysis.dose_adjustments?.length > 0 && (
                      <>
                        <div className="cc-heading">Dose Adjustments</div>
                        {analysis.dose_adjustments.map((d, i) => (
                          <div key={i} className={`cc-insight ${adjClass[d.severity] || 'caution'}`}>
                            <div className="cc-insight-header">
                              <span className="cc-insight-icon">💊</span>
                              <span className="cc-insight-label">{d.severity?.toUpperCase() || 'CONSIDER'}</span>
                            </div>
                            <div className="cc-insight-body">
                              <span className="cc-insight-drug">{d.drug}</span>
                              <div style={{ marginTop: 4 }}>{d.reason}</div>
                              <div style={{ marginTop: 5 }}>
                                <span className="cc-insight-adj">→ {d.adjustment}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Guidelines */}
                    {analysis.guidelines?.length > 0 && (
                      <>
                        <div className="cc-heading">Relevant Guidelines</div>
                        {analysis.guidelines.map((g, i) => (
                          <div key={i} className="cc-insight info">
                            <div className="cc-insight-header">
                              <span className="cc-insight-icon">📋</span>
                              <span className="cc-insight-label" style={{ color: priorityColor[g.priority] || '#3b9eff' }}>
                                {g.condition}
                              </span>
                              {g.source && (
                                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#2e4a6a', fontFamily: 'JetBrains Mono,monospace' }}>
                                  {g.source}
                                </span>
                              )}
                            </div>
                            <div className="cc-insight-body">{g.recommendation}</div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Monitoring */}
                    {analysis.monitoring?.length > 0 && (
                      <>
                        <div className="cc-heading">Monitoring Recommendations</div>
                        {analysis.monitoring.map((m, i) => (
                          <div key={i} className="cc-insight ok">
                            <div className="cc-insight-header">
                              <span className="cc-insight-icon">📊</span>
                              <span className="cc-insight-label">{m.parameter}</span>
                            </div>
                            <div className="cc-insight-body">
                              {m.reason}
                              {m.frequency && <span style={{ color: '#3dffa0', marginLeft: 6, fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>[{m.frequency}]</span>}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* All empty */}
                    {!analysis.contraindications?.length && !analysis.dose_adjustments?.length && !analysis.guidelines?.length && !analysis.monitoring?.length && (
                      <div className="cc-insight ok">
                        <div className="cc-insight-header"><span className="cc-insight-icon">✅</span><span className="cc-insight-label">No Critical Alerts</span></div>
                        <div className="cc-insight-body">No significant contraindications, dose adjustment requirements, or critical guideline deviations identified for this patient's current medication and diagnosis profile.</div>
                      </div>
                    )}
                  </>
                )}

                {analysis?.empty && !analyzing && (
                  <div className="cc-insight info">
                    <div className="cc-insight-header"><span className="cc-insight-icon">ℹ️</span><span className="cc-insight-label">Insufficient Data</span></div>
                    <div className="cc-insight-body">This note doesn't have medications, diagnoses, or labs documented yet. Add clinical data to the note to enable AI analysis.</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── AI CHAT MODE ── */}
        {mode === 'chat' && (
          <>
            <div className="cc-chat" ref={chatRef}>
              {messages.map((m, i) => (
                <div key={i} className={`cc-ai-msg ${m.role}`}>
                  {m.role === 'assistant' && <div className="cc-ai-label">AI</div>}
                  {m.content}
                </div>
              ))}
              {chatLoading && (
                <div className="cc-ai-msg loading">
                  <div className="cc-dot"/><div className="cc-dot"/><div className="cc-dot"/>
                </div>
              )}
            </div>
            <div className="cc-input-wrap">
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {['Guidelines for AF', 'Vancomycin renal dosing', 'Metformin + AKI', 'Warfarin interactions'].map(q => (
                  <button key={q} onClick={() => sendChat(q)} style={{
                    padding: '3px 8px', fontSize: 10, background: '#0b1e36', border: '1px solid #1a3555',
                    borderRadius: 4, color: '#4a6a8a', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif'
                  }}>{q}</button>
                ))}
              </div>
              <div className="cc-input-row">
                <input
                  className="cc-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Ask a clinical question..."
                />
                <button className="cc-send" onClick={() => sendChat()}>↑</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}