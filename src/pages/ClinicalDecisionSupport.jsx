import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Clock, Activity, Pill, Settings, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import VitalsTrendChart from '../components/cds/VitalsTrendChart';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ClinicalDecisionSupport() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('alerts');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFullLoading, setAiFullLoading] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [drugInput, setDrugInput] = useState('');
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [currentGuideline, setCurrentGuideline] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);
  
  // Fetch encounters
  const { data: encounters = [], isLoading: encountersLoading } = useQuery({
    queryKey: ['cds-encounters'],
    queryFn: () => base44.entities.CDSEncounter.filter({ status: 'active' }, '-created_date', 1),
    refetchInterval: 60000
  });

  // Fetch alerts for active encounter
  const currentEncounter = encounters[0];
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['cds-alerts', currentEncounter?.encounter_id],
    queryFn: () => currentEncounter ? base44.entities.CDSAlert.filter({ 
      encounter_id: currentEncounter.encounter_id,
      status: 'active'
    }, '-priority_score') : Promise.resolve([]),
    enabled: !!currentEncounter,
    refetchInterval: 60000
  });

  // Fetch CDS rules
  const { data: rules = [] } = useQuery({
    queryKey: ['cds-rules'],
    queryFn: () => base44.entities.CDSRule.filter({ enabled: true })
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: ({ alertId, status }) => base44.entities.CDSAlert.update(alertId, {
      status,
      acknowledged_by: 'current_user',
      acknowledged_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cds-alerts'] });
    }
  });

  const tabs = ['alerts', 'sepsis', 'drugs', 'rules', 'history'];

  const C = {
    navy: '#050f1e',
    slate: '#0b1d35',
    panel: '#0d2240',
    border: '#1e3a5f',
    text: '#c8ddf0',
    bright: '#e8f4ff',
    dim: '#4a7299',
    teal: '#00d4bc',
    amber: '#f5a623',
    red: '#ff5c6c',
    green: '#2ecc71',
    purple: '#9b6dff',
    blue: '#4a90d9'
  };

  const aiMessages = [
    'Parsing clinical context...',
    'Evaluating alert burden...',
    'Cross-referencing guidelines...',
    'Computing risk scores...',
    'Generating recommendations...'
  ];

  const guidelines = {
    sep1: {
      title: 'CMS SEP-1 — Hour-1 Sepsis Bundle',
      body: `The CMS SEP-1 quality measure requires completion of a 7-element bundle within 3 hours of sepsis/septic shock recognition for all adult inpatients.\n\nHour-1 Bundle Elements:\n1. Measure lactate level\n2. Obtain blood cultures before antibiotics\n3. Administer broad-spectrum antibiotics\n4. 30 mL/kg crystalloid for hypotension or lactate ≥4\n5. Apply vasopressors for MAP <65 mmHg despite fluids\n6. Assess CVP and ScvO₂ or perform dynamic fluid responsiveness tests\n7. Repeat lactate if initial >2 mmol/L`
    },
    lactate: {
      title: 'Lactate Clearance — Surviving Sepsis 2021',
      body: `Serial lactate measurement is a cornerstone of sepsis management. Elevated lactate (>2 mmol/L) indicates tissue hypoperfusion even in the absence of hypotension (cryptic shock).\n\nTargets:\n• Initial lactate within 1h of sepsis recognition\n• Repeat lactate within 2–4h if initial ≥2 mmol/L\n• Target: absolute lactate <2 mmol/L or ≥10% clearance\n• Continued elevation despite resuscitation = reassess perfusion strategy`
    },
    qtc: {
      title: 'QTc Prolongation Management',
      body: `Drug-induced QTc prolongation is a common, potentially fatal adverse effect. Combined use of multiple QT-prolonging agents significantly increases Torsades de Pointes risk.\n\nThresholds:\n• QTc >450ms (men) / >470ms (women): Warning — review medications\n• QTc >500ms: High risk — consider stopping QT-prolonging agents\n• QTc >550ms: Immediate cardiology consultation\n\nKey Electrolytes: Maintain K⁺ >4.0, Mg²⁺ >2.0 mg/dL`
    }
  };

  const runAIAnalysis = async () => {
    if (!currentEncounter) return;
    
    setAiFullLoading(true);
    setAiLoading(true);
    let msgIndex = 0;
    const interval = setInterval(() => {
      if (msgIndex < aiMessages.length) {
        setLoadingMessage(aiMessages[msgIndex++]);
      }
    }, 900);

    try {
      const alertSummary = alerts.map(a => `${a.alert_type.toUpperCase()}: ${a.title}`).join('\n');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this clinical decision support encounter and provide prioritized recommendations:

Patient: ${currentEncounter.patient_name}, ${currentEncounter.patient_age}${currentEncounter.patient_gender} | Encounter #${currentEncounter.encounter_id}
Provider: ${currentEncounter.provider_name}
Diagnosis: ${currentEncounter.diagnosis}
Vitals: HR ${currentEncounter.vitals?.hr || 'N/A'}, BP ${currentEncounter.vitals?.sbp || 'N/A'}/${currentEncounter.vitals?.dbp || 'N/A'}, SpO2 ${currentEncounter.vitals?.spo2 || 'N/A'}%
Labs: Lactate ${currentEncounter.labs?.lactate || 'N/A'} mmol/L

ACTIVE ALERTS (${alerts.length}):
${alertSummary}

SEP-1 Bundle: ${currentEncounter.sepsis_bundle_completion || 0}% complete
Medications: ${currentEncounter.medications?.join(', ') || 'None'}
SOFA Score: ${currentEncounter.sofa_score || 'N/A'}

Provide: (1) overall risk assessment, (2) top 3 immediate actions, (3) quality measure implications. Max 220 words, clinical focus.`,
        model: 'claude_sonnet_4_6'
      });
      
      clearInterval(interval);
      setAiAnalysisText(result);
    } catch (error) {
      clearInterval(interval);
      setAiAnalysisText('⚠️ AI analysis unavailable. Manual review required.');
    }
    
    setAiFullLoading(false);
    setAiLoading(false);
  };

  const acknowledgeAlert = (alertId, status) => {
    acknowledgeAlertMutation.mutate({ alertId, status });
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const nextTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const addDrug = () => {
    if (drugInput.trim() && currentEncounter) {
      const updatedMeds = [...(currentEncounter.medications || []), drugInput.trim()];
      base44.entities.CDSEncounter.update(currentEncounter.id, { medications: updatedMeds })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['cds-encounters'] });
          setDrugInput('');
        });
    }
  };

  const removeDrug = (drugName) => {
    if (currentEncounter) {
      const updatedMeds = (currentEncounter.medications || []).filter(d => d !== drugName);
      base44.entities.CDSEncounter.update(currentEncounter.id, { medications: updatedMeds })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['cds-encounters'] });
        });
    }
  };

  const viewGuideline = (type) => {
    setCurrentGuideline(guidelines[type]);
    setShowGuidelineModal(true);
  };

  if (encountersLoading) {
    return (
      <div style={{ background: C.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.purple }}>Loading CDS data...</div>
      </div>
    );
  }

  if (!currentEncounter) {
    return (
      <div style={{ background: C.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>No active encounters</div>
          <div style={{ fontSize: 13, color: C.dim }}>Create a CDSEncounter to begin monitoring</div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.alert_type === 'critical').length;
  const warningAlerts = alerts.filter(a => a.alert_type === 'warning').length;
  const infoAlerts = alerts.filter(a => a.alert_type === 'info').length;

  return (
    <div style={{ background: C.navy, color: C.text, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 50, zIndex: 200, background: C.slate, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #ff5c6c, #f5a623)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#fff' }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: C.bright }}>Notrya</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>Clinical Decision Support</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{currentEncounter.patient_name}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.teal }}>{currentEncounter.patient_id} · {currentEncounter.patient_age}{currentEncounter.patient_gender}</div>
            </div>
          </div>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, background: 'rgba(255,92,108,.15)', color: C.red, border: '1px solid rgba(255,92,108,.3)' }}>⚡ {alerts.length} Active Alerts</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, background: 'rgba(0,212,188,.1)', color: C.teal, border: '1px solid rgba(0,212,188,.25)' }}>#{currentEncounter.encounter_id}</span>
        </div>
      </nav>

      {/* Alert Ticker */}
      <div style={{ position: 'fixed', top: 50, left: 0, right: 0, height: 30, zIndex: 199, background: 'rgba(255,92,108,.1)', borderBottom: '1px solid rgba(255,92,108,.3)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ padding: '0 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: C.red, whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,92,108,.3)', background: 'rgba(255,92,108,.15)' }}>⚡ LIVE ALERTS</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: C.text, whiteSpace: 'nowrap', animation: 'tickerMove 28s linear infinite' }}>
            {alerts.filter(a => a.alert_type === 'critical').map((alert, i) => (
              <span key={i} style={{ padding: '0 28px', borderRight: '1px solid rgba(255,92,108,.15)' }}>
                <strong style={{ color: C.red }}>{alert.alert_type.toUpperCase()}:</strong> {alert.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vitals Bar */}
      <div style={{ position: 'fixed', top: 80, left: 0, right: 0, height: 38, zIndex: 198, background: C.navy, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 0 }}>
        {currentEncounter.vitals && Object.entries({
          HR: currentEncounter.vitals.hr,
          BP: `${currentEncounter.vitals.sbp}/${currentEncounter.vitals.dbp}`,
          Temp: `${currentEncounter.vitals.temp}°C`,
          RR: currentEncounter.vitals.rr,
          'SpO₂': `${currentEncounter.vitals.spo2}%`,
          GCS: currentEncounter.vitals.gcs
        }).map(([label, value], i) => value && (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRight: `1px solid ${C.border}`, height: '100%' }}>
            <span style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: C.text }}>{value}</span>
          </div>
        ))}
        {currentEncounter.labs?.lactate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRight: `1px solid ${C.border}`, height: '100%' }}>
            <span style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5 }}>Lactate</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: currentEncounter.labs.lactate >= 2 ? C.red : C.green }}>{currentEncounter.labs.lactate}</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: C.dim, display: 'flex', alignItems: 'center', gap: 6 }}>
          Provider: <span style={{ color: C.teal, fontWeight: 500 }}>{user?.attending_name || currentEncounter.provider_name || 'Provider'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ paddingTop: 118, paddingBottom: 91, display: 'flex', minHeight: 'calc(100vh - 209px)' }}>
        {/* Sidebar */}
        <div style={{ width: 220, minWidth: 220, background: C.slate, borderRight: `1px solid ${C.border}`, overflowY: 'auto' }}>
          <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: C.bright, fontWeight: 600 }}>CDS Engine</h3>
            <p style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Encounter #29341 · Real-time</p>
          </div>

          <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Active Monitoring</div>
          {[
            { id: 'alerts', icon: '🚨', label: 'Active Alerts', badge: alerts.length.toString(), badgeColor: C.red },
            { id: 'sepsis', icon: '🔴', label: 'Sepsis Bundle', badge: `${currentEncounter.sepsis_bundle_completion || 0}%`, badgeColor: C.amber },
            { id: 'drugs', icon: '💊', label: 'Drug Interactions', badge: alerts.filter(a => a.category === 'drug_interaction').length.toString(), badgeColor: C.red }
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => switchTab(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', borderLeft: `3px solid ${activeTab === item.id ? C.red : 'transparent'}`, background: activeTab === item.id ? C.panel : 'transparent', transition: 'all 0.15s' }}
            >
              <span style={{ fontSize: 15, minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: activeTab === item.id ? C.bright : C.text, flex: 1, fontWeight: activeTab === item.id ? 500 : 400 }}>{item.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: `rgba(${item.badgeColor === C.red ? '255,92,108' : '245,166,35'},.15)`, color: item.badgeColor }}>{item.badge}</span>
            </div>
          ))}

          <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginTop: 6 }}>Management</div>
          {[
            { id: 'rules', icon: '⚙️', label: 'Rule Manager', badge: rules.length.toString(), badgeColor: C.teal },
            { id: 'history', icon: '📋', label: 'Alert History', badge: '0', badgeColor: C.blue }
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => switchTab(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', borderLeft: `3px solid ${activeTab === item.id ? C.red : 'transparent'}`, background: activeTab === item.id ? C.panel : 'transparent', transition: 'all 0.15s' }}
            >
              <span style={{ fontSize: 15, minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: activeTab === item.id ? C.bright : C.text, flex: 1, fontWeight: activeTab === item.id ? 500 : 400 }}>{item.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: `rgba(${item.badgeColor === C.teal ? '0,212,188' : '74,144,217'},.12)`, color: item.badgeColor }}>{item.badge}</span>
            </div>
          ))}

          <div style={{ height: 1, background: C.border, margin: '6px 14px' }} />
          <div style={{ margin: '8px 10px' }}>
            <div style={{ padding: 10, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <h4 style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Alert Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                <span style={{ fontSize: 11, color: C.text }}>🔴 Critical</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.red }}>{criticalAlerts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                <span style={{ fontSize: 11, color: C.text }}>🟠 Warning</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.amber }}>{warningAlerts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                <span style={{ fontSize: 11, color: C.text }}>🔵 Info</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.blue }}>{infoAlerts}</span>
              </div>
            </div>
            <div style={{ padding: 10, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, marginTop: 8 }}>
              <h4 style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>SEP-1 Bundle</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                <span style={{ fontSize: 11, color: C.text }}>Compliance</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.amber }}>{currentEncounter.sepsis_bundle_completion || 0}%</span>
              </div>
              {currentEncounter.sepsis_time_zero && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                  <span style={{ fontSize: 11, color: C.text }}>Time Since T=0</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.amber }}>
                    {Math.floor((new Date() - new Date(currentEncounter.sepsis_time_zero)) / 3600000)}h {Math.floor(((new Date() - new Date(currentEncounter.sepsis_time_zero)) % 3600000) / 60000)}m
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ margin: '10px 10px' }}>
            <button onClick={runAIAnalysis} style={{ width: '100%', padding: '5px', borderRadius: 6, cursor: 'pointer', background: 'linear-gradient(135deg,rgba(155,109,255,.2),rgba(0,212,188,.1))', border: '1px solid rgba(155,109,255,.3)', color: C.purple, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              ✦ AI Risk Analysis
            </button>
          </div>
        </div>

        {/* Center Panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {activeTab === 'alerts' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.bright, display: 'flex', alignItems: 'center', gap: 10 }}>
                    🚨 Active Clinical Alerts
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{alerts.length} alerts firing · Last updated just now · Auto-refresh every 60s</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button style={{ padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim }}>
                    Dismiss All Info
                  </button>
                  <button onClick={runAIAnalysis} style={{ padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, border: 'none', background: 'linear-gradient(135deg,rgba(155,109,255,.2),rgba(0,212,188,.1))', color: C.purple, border: '1px solid rgba(155,109,255,.3)', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✦ AI Triage
                  </button>
                </div>
              </div>
              
              {/* Dynamic Alert Cards */}
              {alerts.map((alert) => (
                <div key={alert.id} style={{ background: C.panel, border: `1px solid ${alert.alert_type === 'critical' ? 'rgba(255,92,108,.4)' : alert.alert_type === 'warning' ? 'rgba(245,166,35,.4)' : 'rgba(74,144,217,.4)'}`, borderRadius: 11, padding: 0, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: alert.alert_type === 'critical' ? C.red : alert.alert_type === 'warning' ? C.amber : C.blue, animation: alert.alert_type === 'critical' ? 'pulse 2s infinite' : 'none' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, padding: '2px 8px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", background: alert.alert_type === 'critical' ? 'rgba(255,92,108,.15)' : alert.alert_type === 'warning' ? 'rgba(245,166,35,.12)' : 'rgba(74,144,217,.12)', color: alert.alert_type === 'critical' ? C.red : alert.alert_type === 'warning' ? C.amber : C.blue, border: `1px solid ${alert.alert_type === 'critical' ? 'rgba(255,92,108,.3)' : alert.alert_type === 'warning' ? 'rgba(245,166,35,.3)' : 'rgba(74,144,217,.3)'}` }}>{alert.alert_type}</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.bright, flex: 1 }}>{alert.title}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim }}>
                      {alert.triggered_at ? new Date(alert.triggered_at).toLocaleTimeString() : 'Now'}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => acknowledgeAlert(alert.id, 'acknowledged')} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer', background: 'rgba(255,92,108,.1)', color: C.red, border: '1px solid rgba(255,92,108,.25)', fontFamily: "'DM Sans', sans-serif" }}>
                        Override
                      </button>
                      <button onClick={() => acknowledgeAlert(alert.id, 'resolved')} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer', background: C.teal, color: '#000', border: 'none', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        ✓ Resolve
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px 14px' }}>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>
                      {alert.description}
                    </div>
                    {alert.recommendation && (
                      <div style={{ padding: '9px 12px', background: 'rgba(155,109,255,.07)', border: '1px solid rgba(155,109,255,.2)', borderRadius: 7, fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                        <strong style={{ color: C.purple }}>Recommendation:</strong> {alert.recommendation}
                      </div>
                    )}
                    {alert.guideline_ref && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 10, color: C.dim }}>Guideline: <span style={{ color: C.teal }}>{alert.guideline_ref}</span></div>
                        <button onClick={() => viewGuideline('sep1')} style={{ padding: '3px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontFamily: "'DM Sans', sans-serif" }}>
                          📖 View Guideline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sepsis' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.bright }}>🔴 SEP-1 Bundle Tracker</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>CMS Sepsis-1 compliance · Encounter #29341 · T=0 at 06:42 presentation</div>
              </div>

              {/* Trend Chart */}
              <VitalsTrendChart C={C} />
              
              <div style={{ background: 'linear-gradient(135deg,rgba(255,92,108,.12),rgba(245,166,35,.06))', border: '1px solid rgba(255,92,108,.3)', borderRadius: 11, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: C.bright }}>SEP-1 Hour-1 Bundle</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>Surviving Sepsis Campaign 2021 · CMS Core Measure</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: C.amber, lineHeight: 1 }}>57%</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>4 of 7 complete</div>
                  </div>
                </div>
                <div style={{ height: 6, background: '#162d4f', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ height: '100%', width: '57%', borderRadius: 3, background: 'linear-gradient(90deg,#ff5c6c,#f5a623)', transition: 'width 1s ease' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: C.dim }}>
                  <span style={{ color: C.dim }}>T+0 Presentation</span>
                  <div style={{ flex: 1, height: 1, background: C.border, margin: '0 8px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '57%', top: -3, width: 8, height: 8, borderRadius: '50%', background: C.amber }} />
                  </div>
                  <span style={{ color: C.dim }}>T+60 min Target</span>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.amber, fontWeight: 600, marginLeft: 12 }}>⏱ 3h 12m elapsed</div>
                </div>
              </div>

              {/* Bundle Items Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { name: 'Lactate Measurement', target: 'T+0–60m', status: 'done', detail: 'Serum lactate obtained at presentation. Result: 4.2 mmol/L (critically elevated).', time: '✓ Completed 06:50 · T+8m', timeColor: C.green },
                  { name: 'Blood Cultures × 2 Sets', target: 'Before ABX', status: 'overdue', detail: 'Two sets from separate sites required before antibiotic administration. Status unconfirmed.', time: '⚠ OVERDUE — ABX given at 09:02', timeColor: C.red },
                  { name: 'Broad-Spectrum Antibiotics', target: 'T+0–60m', status: 'done', detail: 'Vancomycin + Pip/Tazo ordered and administered. Appropriate empiric coverage for urosepsis.', time: '✓ Administered 09:02 · T+140m (late)', timeColor: C.green },
                  { name: '30 mL/kg Crystalloid Bolus', target: 'T+0–60m', status: 'done', detail: 'Weight 82kg → target 2,460mL. Normal saline 3L ordered and infusing. 2,100mL given so far.', time: '✓ In progress — 2,100/2,460 mL', timeColor: C.green },
                  { name: 'Vasopressors if MAP <65', target: 'After fluid', status: 'pending', detail: 'MAP currently 55 mmHg. After 30 mL/kg fluid, if MAP remains <65 mmHg, norepinephrine must be initiated.', time: '⏳ Pending — assess after fluid complete', timeColor: C.amber },
                  { name: 'Stress-Dose Steroids', target: 'If vasopressor-dependent', status: 'done', detail: 'Hydrocortisone 200mg/day ordered for refractory septic shock. Appropriate for vasopressor-dependent patient.', time: '✓ Ordered 09:35', timeColor: C.green },
                  { name: 'Repeat Lactate (if ≥2)', target: 'Within 2–4h', status: 'overdue', detail: 'Initial lactate 4.2 requires repeat within 2–4h to document clearance. Due by 10:50 AM.', time: '⚠ Due in 47 min — Order immediately', timeColor: C.red }
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: C.panel,
                      borderRadius: 9,
                      padding: '13px 14px',
                      border: `1px solid ${item.status === 'done' ? 'rgba(46,204,113,.3)' : item.status === 'overdue' ? 'rgba(255,92,108,.35)' : 'rgba(245,166,35,.3)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        background: item.status === 'done' ? 'rgba(46,204,113,.15)' : item.status === 'overdue' ? 'rgba(255,92,108,.15)' : 'rgba(245,166,35,.12)',
                        color: item.status === 'done' ? C.green : item.status === 'overdue' ? C.red : C.amber
                      }}>
                        {item.status === 'done' ? '✓' : item.status === 'overdue' ? '!' : '○'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.bright, flex: 1 }}>{item.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim }}>{item.target}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>{item.detail}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, marginTop: 5, color: item.timeColor }}>{item.time}</div>
                  </div>
                ))}
              </div>

              {/* Compliance Warning */}
              <div style={{ padding: '12px 16px', background: 'rgba(245,166,35,.07)', border: '1px solid rgba(245,166,35,.25)', borderRadius: 9, fontSize: 12, color: C.text }}>
                <strong style={{ color: C.amber }}>⚠ SEP-1 Compliance Risk:</strong> Two overdue elements (blood cultures + repeat lactate) may result in non-compliance with CMS SEP-1 quality measure. Document any clinical justification for deviation.
              </div>
            </div>
          )}

          {activeTab === 'drugs' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.bright }}>💊 Drug Interactions</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Active medication cross-check · {drugList.length} drugs on profile · 2 interactions detected</div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  value={drugInput}
                  onChange={(e) => setDrugInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDrug()}
                  placeholder="Search drug name to add to check..."
                  style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 14px', color: C.bright, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                />
                <button onClick={addDrug} style={{ padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, border: 'none', background: C.teal, color: '#000', fontFamily: "'DM Sans', sans-serif" }}>
                  + Add Drug
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, minHeight: 36, padding: 8, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                {(currentEncounter.medications || []).map((drug, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'rgba(0,212,188,.12)', color: C.teal, border: '1px solid rgba(0,212,188,.3)', cursor: 'pointer' }}>
                    {drug} <span onClick={() => removeDrug(drug)} style={{ fontSize: 12, opacity: 0.6 }}>✕</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.bright }}>⚙️ CDS Rule Manager</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>12 rules active · Manage, create, and tune clinical decision support logic</div>
              </div>
              {/* Rule cards would go here */}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.bright }}>📋 Alert History</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Complete audit log · Encounter #29341 · 24 events recorded</div>
              </div>
              {/* History table would go here */}
            </div>
          )}
        </div>

        {/* Right AI Panel */}
        <div style={{ width: 295, minWidth: 295, background: C.slate, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 15px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 600, color: C.bright, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.purple }} />
              CDS Intelligence
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>claude-sonnet-4 · Real-time</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 15px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {/* Alert Overview */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>🚨 ALERT OVERVIEW</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.dim }}>Critical Active</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.red }}>{criticalAlerts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.dim }}>Warnings</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.amber }}>{warningAlerts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.dim }}>Info</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.blue }}>{infoAlerts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.dim }}>SEP-1 Compliance</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.amber }}>{currentEncounter.sepsis_bundle_completion || 0}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.dim }}>Drug Interactions</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.red }}>{alerts.filter(a => a.category === 'drug_interaction').length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span style={{ fontSize: 11, color: C.dim }}>Total Meds</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.teal }}>{(currentEncounter.medications || []).length}</span>
              </div>
            </div>

            {/* Priority Actions */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>⚡ PRIORITY ACTIONS</div>
              {[
                { text: 'Order repeat lactate IMMEDIATELY — due in 47 min for SEP-1', priority: 'NOW', color: C.red },
                { text: 'Confirm blood culture collection status and document in chart', priority: 'URGENT', color: C.red },
                { text: 'Check Mg²⁺ — essential with QTc 492ms + Azithromycin', priority: 'HIGH', color: C.amber },
                { text: 'Initiate AUC-guided Vancomycin monitoring per ASHP 2020', priority: 'HIGH', color: C.amber },
                { text: 'Order DVT prophylaxis — Enoxaparin 40mg SQ daily', priority: 'MOD', color: C.blue }
              ].map((action, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: action.color, flexShrink: 0, marginTop: 4, animation: action.priority === 'NOW' || action.priority === 'URGENT' ? 'pulse 1.8s infinite' : 'none' }} />
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4, flex: 1 }}>{action.text}</div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: `rgba(${action.color === C.red ? '255,92,108' : action.color === C.amber ? '245,166,35' : '74,144,217'},.12)`, color: action.color, flexShrink: 0, marginTop: 2 }}>{action.priority}</span>
                </div>
              ))}
            </div>

            {/* AI Analysis */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>✦ AI ANALYSIS</div>
              {aiLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.purple, fontSize: 12, marginBottom: 8 }}>
                  <div style={{ width: 14, height: 14, border: `2px solid rgba(155,109,255,.2)`, borderTopColor: C.purple, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  {loadingMessage}
                </div>
              )}
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{aiAnalysisText}</div>
            </div>

            {/* Sepsis Risk Score */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>📊 SEPSIS RISK SCORE</div>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: C.red }}>{currentEncounter.sofa_score || 'N/A'}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>/ 10 · SOFA Score</div>
                {currentEncounter.sofa_score && (
                  <>
                    <div style={{ margin: '10px 0 4px', height: 6, background: '#162d4f', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(currentEncounter.sofa_score / 10) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#f5a623,#ff5c6c)', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.dim }}>Sepsis severity: <span style={{ color: C.red, fontWeight: 600 }}>{currentEncounter.sofa_score >= 8 ? 'High' : currentEncounter.sofa_score >= 4 ? 'Moderate' : 'Low'}</span></div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 15px', borderTop: `1px solid ${C.border}` }}>
            {aiFullLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.purple, fontSize: 12, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, border: `2px solid rgba(155,109,255,.2)`, borderTopColor: C.purple, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                {loadingMessage}
              </div>
            )}
            <button onClick={runAIAnalysis} disabled={aiFullLoading} style={{ width: '100%', padding: 9, borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg,rgba(155,109,255,.2),rgba(0,212,188,.1))', border: '1px solid rgba(155,109,255,.3)', color: C.purple, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✦ Full CDS AI Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: C.slate, borderTop: `1px solid ${C.border}` }}>
        {/* Group Tabs */}
        <div style={{ display: 'flex', padding: '6px 18px 0', gap: 6, borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: 'alerts', icon: '🚨', label: 'Alerts' },
            { id: 'sepsis', icon: '🔴', label: 'Sepsis' },
            { id: 'drugs', icon: '💊', label: 'Drugs' },
            { id: 'rules', icon: '⚙️', label: 'Rules' },
            { id: 'history', icon: '📋', label: 'History' }
          ].map((group, i) => (
            <button
              key={i}
              onClick={() => switchTab(group.id)}
              style={{
                padding: '5px 14px',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontSize: 11,
                color: activeTab === group.id ? C.bright : C.dim,
                background: activeTab === group.id ? C.panel : 'transparent',
                border: 'none',
                borderTop: `2px solid ${activeTab === group.id ? C.red : 'transparent'}`,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all .15s',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              {group.icon} {group.label}
            </button>
          ))}
        </div>
        
        {/* Sub Tabs */}
        <div style={{ display: 'flex', padding: '6px 18px', gap: 5, alignItems: 'center', overflowX: 'auto' }}>
          <button
            onClick={() => switchTab('alerts')}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 11,
              color: activeTab === 'alerts' ? C.teal : C.dim,
              background: activeTab === 'alerts' ? 'rgba(0,212,188,.07)' : 'transparent',
              border: `1px solid ${activeTab === 'alerts' ? 'rgba(0,212,188,.3)' : 'transparent'}`,
              fontWeight: activeTab === 'alerts' ? 500 : 400,
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            Active Alerts <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: 'rgba(255,92,108,.15)', color: C.red }}>5</span>
          </button>
          <button
            onClick={() => switchTab('sepsis')}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 11,
              color: activeTab === 'sepsis' ? C.teal : C.dim,
              background: activeTab === 'sepsis' ? 'rgba(0,212,188,.07)' : 'transparent',
              border: `1px solid ${activeTab === 'sepsis' ? 'rgba(0,212,188,.3)' : 'transparent'}`,
              fontWeight: activeTab === 'sepsis' ? 500 : 400,
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            SEP-1 Bundle <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: 'rgba(245,166,35,.15)', color: C.amber }}>57%</span>
          </button>
          <button
            onClick={() => switchTab('drugs')}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 11,
              color: activeTab === 'drugs' ? C.teal : C.dim,
              background: activeTab === 'drugs' ? 'rgba(0,212,188,.07)' : 'transparent',
              border: `1px solid ${activeTab === 'drugs' ? 'rgba(0,212,188,.3)' : 'transparent'}`,
              fontWeight: activeTab === 'drugs' ? 500 : 400,
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            Drug Interactions <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: 'rgba(255,92,108,.15)', color: C.red }}>2</span>
          </button>
          <button
            onClick={() => switchTab('rules')}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 11,
              color: activeTab === 'rules' ? C.teal : C.dim,
              background: activeTab === 'rules' ? 'rgba(0,212,188,.07)' : 'transparent',
              border: `1px solid ${activeTab === 'rules' ? 'rgba(0,212,188,.3)' : 'transparent'}`,
              fontWeight: activeTab === 'rules' ? 500 : 400,
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            Rule Manager <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: 'rgba(0,212,188,.12)', color: C.teal }}>12</span>
          </button>
          <button
            onClick={() => switchTab('history')}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 11,
              color: activeTab === 'history' ? C.teal : C.dim,
              background: activeTab === 'history' ? 'rgba(0,212,188,.07)' : 'transparent',
              border: `1px solid ${activeTab === 'history' ? 'rgba(0,212,188,.3)' : 'transparent'}`,
              fontWeight: activeTab === 'history' ? 500 : 400,
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            Alert History <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: 'rgba(74,144,217,.15)', color: C.blue }}>24</span>
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prevTab} style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontFamily: "'DM Sans', sans-serif" }}>
              ← Back
            </button>
            <button onClick={nextTab} style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, background: C.teal, color: '#000', border: `1px solid ${C.teal}`, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Guideline Modal */}
      {showGuidelineModal && currentGuideline && (
        <div onClick={() => setShowGuidelineModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(5,15,30,.88)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: 500, maxWidth: '95vw', maxHeight: '82vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.bright, fontWeight: 700 }}>{currentGuideline.title}</div>
              <button onClick={() => setShowGuidelineModal(false)} style={{ cursor: 'pointer', color: C.dim, fontSize: 18, background: 'none', border: 'none' }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{currentGuideline.body}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tickerMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}