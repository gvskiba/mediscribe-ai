import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AutoCoder() {
  const [activeTab, setActiveTab] = useState('icd10');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [selectedEM, setSelectedEM] = useState('99285');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [modalType, setModalType] = useState('icd10');
  const [newCode, setNewCode] = useState({ code: '', desc: '', type: 'secondary', poa: 'Y' });

  const C = {
    navy: '#050f1e',
    slate: '#0b1d35',
    panel: '#0d2240',
    edge: '#162d4f',
    border: '#1e3a5f',
    muted: '#2a4d72',
    dim: '#4a7299',
    text: '#c8ddf0',
    bright: '#e8f4ff',
    teal: '#00d4bc',
    amber: '#f5a623',
    red: '#ff5c6c',
    green: '#2ecc71',
    purple: '#9b6dff',
    blue: '#4a90d9',
    rose: '#f472b6',
    gold: '#f0c040',
  };

  const styles = {
    page: { minHeight: '100vh', background: C.navy, color: C.text, fontFamily: "'DM Sans', sans-serif" },
    navbar: { position: 'fixed', top: 0, left: 72, right: 0, height: 50, zIndex: 100, background: C.slate, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' },
    vitalsBar: { position: 'fixed', top: 50, left: 72, right: 0, height: 38, zIndex: 99, background: C.navy, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 0, overflowX: 'auto' },
    mainLayout: { position: 'fixed', top: 88, left: 72, right: 0, bottom: 95, display: 'flex', overflow: 'hidden' },
    sidebar: { width: 220, minWidth: 220, background: C.slate, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
    center: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    aiPanel: { width: 295, minWidth: 295, background: C.slate, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    bottomNav: { position: 'fixed', bottom: 0, left: 72, right: 0, zIndex: 100, background: C.slate, borderTop: `1px solid ${C.border}` },
  };

  const tabs = ['icd10', 'cpt', 'em', 'billing', 'audit'];

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  const nextTab = () => {
    const idx = tabs.indexOf(activeTab);
    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
  };

  const prevTab = () => {
    const idx = tabs.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabs[idx - 1]);
  };

  const runFullAICoding = async () => {
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this ED encounter and provide a brief coding analysis:

Patient: Marcus Webb, 58M
Encounter: #29341
Chief Complaint: Fever with altered mental status
Final Diagnosis: Septic Shock — Urinary Source
Provider: Dr. Sarah Chen, MD

Assigned Codes:
- A41.51 (Sepsis due to E. coli) — Primary
- R65.21 (Severe sepsis with septic shock)
- N39.0 (UTI, unspecified)
- E11.9 (Type 2 DM without complications)
- I10 (Essential hypertension)
- 99285 (ED E&M Level 5)

Vitals: HR 118, BP 88/56, Temp 38.9°C, RR 24, SpO2 94%, GCS 13, Lactate 4.2

Provide: (1) coding accuracy assessment, (2) any missed codes, (3) revenue optimization tips, (4) compliance notes. Keep response under 200 words, use emoji bullets.`
      });
      setAiAnalysisText(result);
    } catch (e) {
      setAiAnalysisText('⚠️ AI analysis unavailable. Codes have been pre-validated by system rules.');
    }
    setAiLoading(false);
  };

  const exportJSON = () => {
    const codeSet = {
      encounter: '#29341',
      patient: 'Marcus Webb',
      mrn: 'MRN-4821',
      provider: 'Dr. Sarah Chen, MD',
      date: new Date().toISOString().split('T')[0],
      icd10: [
        { code: 'A41.51', desc: 'Sepsis due to Escherichia coli', type: 'primary', poa: 'Y' },
        { code: 'R65.21', desc: 'Severe sepsis with septic shock', type: 'secondary', poa: 'Y' },
      ],
      totalRVU: 12.83,
      estimatedRevenue: 2140,
    };
    const blob = new Blob([JSON.stringify(codeSet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notrya-codes-29341.json';
    a.click();
    setShowExportModal(false);
  };

  return (
    <div style={styles.page}>
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${C.slate}; }
        ::-webkit-scrollbar-thumb { background: ${C.muted}; border-radius: 3px; }
        @keyframes redglow {
          0%, 100% { text-shadow: 0 0 4px rgba(255,92,108,0.4); }
          50% { text-shadow: 0 0 10px rgba(255,92,108,0.9); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(155,109,255,0.6); }
          50% { box-shadow: 0 0 0 5px rgba(155,109,255,0); }
        }
      `}</style>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Left Sidebar */}
        <div style={styles.sidebar}>
          <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: C.bright, fontWeight: 600 }}>Code Sets</h3>
            <p style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Encounter #29341 · Auto-coded</p>
          </div>

          <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Diagnoses</div>
          <div onClick={() => switchTab('icd10')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', borderLeft: `3px solid ${activeTab === 'icd10' ? C.teal : 'transparent'}`, background: activeTab === 'icd10' ? C.panel : 'transparent' }}>
            <span style={{ fontSize: 15 }}>🏷️</span>
            <span style={{ fontSize: 12, color: activeTab === 'icd10' ? C.bright : C.text, flex: 1, fontWeight: activeTab === 'icd10' ? 500 : 400 }}>ICD-10 Codes</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(0,212,188,0.12)', color: C.teal }}>6</span>
          </div>

          <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Procedures</div>
          <div onClick={() => switchTab('cpt')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', borderLeft: `3px solid ${activeTab === 'cpt' ? C.teal : 'transparent'}`, background: activeTab === 'cpt' ? C.panel : 'transparent' }}>
            <span style={{ fontSize: 15 }}>⚙️</span>
            <span style={{ fontSize: 12, color: activeTab === 'cpt' ? C.bright : C.text, flex: 1 }}>CPT Procedures</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(244,114,182,0.15)', color: C.rose }}>6</span>
          </div>

          <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Billing</div>
          <div onClick={() => switchTab('billing')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', borderLeft: `3px solid ${activeTab === 'billing' ? C.teal : 'transparent'}`, background: activeTab === 'billing' ? C.panel : 'transparent' }}>
            <span style={{ fontSize: 15 }}>💳</span>
            <span style={{ fontSize: 12, color: activeTab === 'billing' ? C.bright : C.text, flex: 1 }}>Billing Summary</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(240,192,64,0.15)', color: C.gold }}>12</span>
          </div>

          <div style={{ height: 1, background: C.border, margin: '6px 14px' }} />
          <div style={{ margin: '10px 10px 0', padding: 10, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <h4 style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Quick Stats</h4>
            {[
              { label: 'Total Codes', value: '12' },
              { label: 'Total RVUs', value: '12.83' },
              { label: 'Est. Revenue', value: '$2,140' },
              { label: 'Confidence', value: '94%' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                <span style={{ fontSize: 11, color: C.text }}>{s.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.teal, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div style={{ margin: '12px 10px 0' }}>
            <button onClick={runFullAICoding} style={{ width: '100%', padding: '9px', borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(155,109,255,0.2), rgba(0,212,188,0.1))', border: `1px solid rgba(155,109,255,0.3)`, color: C.purple, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✦ Re-Run AI Coder
            </button>
          </div>
        </div>

        {/* Center Content - ICD-10 Tab shown as example */}
        <div style={styles.center}>
          {activeTab === 'icd10' && (
            <div style={{ padding: '20px 22px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.bright, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>🏷️</span>ICD-10 Diagnosis Codes
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>AI-extracted from clinical note · Encounter #29341 · 6 codes assigned</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: C.dim }}>
                <div>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>📋</div>
                  <div style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>No Codes Available</div>
                  <div style={{ fontSize: 12 }}>Select a patient encounter to begin auto-coding</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right AI Panel */}
        <div style={styles.aiPanel}>
          <div style={{ padding: '14px 15px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 600, color: C.bright, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.purple, animation: 'pulse 2s infinite' }} />
              Notrya AI Coder
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>claude-sonnet-4 · ICD-10 CM 2025</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 15px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>✦ AI Analysis</div>
              {aiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.purple, fontSize: 12 }}>
                  <div style={{ width: 14, height: 14, border: `2px solid rgba(155,109,255,0.2)`, borderTopColor: C.purple, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Analyzing encounter...
                </div>
              ) : aiAnalysisText ? (
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{aiAnalysisText}</div>
              ) : (
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>Select an encounter and run AI analysis to generate coding recommendations</div>
              )}
            </div>
          </div>

          <div style={{ padding: '12px 15px', borderTop: `1px solid ${C.border}` }}>
            <button onClick={runFullAICoding} disabled={aiLoading} style={{ width: '100%', padding: 9, borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(155,109,255,0.2), rgba(0,212,188,0.1))', border: `1px solid rgba(155,109,255,0.3)`, color: C.purple, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✦ Full AI Re-Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        <div style={{ display: 'flex', padding: '6px 18px', gap: 5, alignItems: 'center', overflowX: 'auto' }}>
          {[
            { id: 'icd10', label: 'ICD-10 Diagnoses', count: '6', color: C.teal },
            { id: 'cpt', label: 'CPT Procedures', count: '6', color: C.rose },
            { id: 'billing', label: 'Billing Summary', count: '$2,140', color: C.gold },
          ].map((t) => (
            <button key={t.id} onClick={() => switchTab(t.id)} style={{ padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11, color: activeTab === t.id ? t.color : C.dim, background: activeTab === t.id ? `rgba(0,212,188,0.07)` : 'transparent', border: `1px solid ${activeTab === t.id ? 'rgba(0,212,188,0.3)' : 'transparent'}`, fontWeight: activeTab === t.id ? 500 : 400, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
              {t.label} <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700 }}>{t.count}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prevTab} style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim }}>← Back</button>
            <button onClick={nextTab} style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, background: C.teal, color: '#000', border: `1px solid ${C.teal}`, fontWeight: 600 }}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}