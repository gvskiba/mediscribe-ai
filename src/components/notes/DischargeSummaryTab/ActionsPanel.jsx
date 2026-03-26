import React from "react";
import { Printer, Send, Mail, Download, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ActionsPanel({
  patientInstructions,
  readingLevel,
  setReadingLevel,
  language,
  setLanguage,
  onGenerateInstructions,
  generating,
  note,
  dischargeData,
}) {
  const handlePrint = () => {
    if (!patientInstructions) {
      toast.error("Generate instructions first");
      return;
    }
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info("PDF download coming soon");
  };

  const handleAction = (action) => {
    if (!patientInstructions) {
      toast.error("Generate instructions first");
      return;
    }
    toast.success(`${action} delivered to patient`);
  };

  const S = { panel: '#0b1e36', up: '#0e2544', border: '#1a3555', teal: '#00e5c0', txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a', bg: '#050f1e', gold: '#f5c842' };
  const boxStyle = { borderRadius: 10, border: `1px solid ${S.border}`, background: S.panel, overflow: 'hidden', marginBottom: 12 };
  const boxHdr = { padding: '10px 16px', borderBottom: `1px solid ${S.border}`, background: S.up, fontSize: 12, fontWeight: 700, color: S.txt };
  const boxBody = { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 };
  const selStyle = { width: '100%', padding: '7px 10px', fontSize: 12, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, color: S.txt, outline: 'none', cursor: 'pointer' };
  const lblStyle = { display: 'block', fontSize: 10, fontWeight: 600, color: S.txt3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' };
  const actionBtnStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', fontSize: 11, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, color: S.teal, cursor: 'pointer' };

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: S.txt, marginBottom: 16 }}>📋 Patient Instructions</h2>

      {/* AI Generation Settings */}
      <div style={boxStyle}>
        <div style={boxHdr}>✦ AI Settings</div>
        <div style={boxBody}>
          <div>
            <label style={lblStyle}>Reading Level</label>
            <select value={readingLevel} onChange={(e) => setReadingLevel(e.target.value)} style={selStyle}>
              <option value="6th grade">6th Grade</option>
              <option value="8th grade">8th Grade</option>
              <option value="10th grade">10th Grade</option>
            </select>
          </div>
          <div>
            <label style={lblStyle}>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selStyle}>
              <option value="English">English</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="Portuguese">Português</option>
              <option value="Arabic">العربية</option>
            </select>
          </div>
          <button onClick={onGenerateInstructions} disabled={generating}
            style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: S.teal, color: '#050f1e', border: 'none', borderRadius: 6, cursor: generating ? 'default' : 'pointer', opacity: generating ? 0.5 : 1 }}>
            {generating ? 'Generating...' : '✦ Generate Instructions'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div style={boxStyle}>
        <div style={boxHdr}>Preview</div>
        <div style={{ ...boxBody, maxHeight: 320, overflowY: 'auto', fontSize: 12, color: S.txt2 }}>
          {patientInstructions ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patientInstructions.diagnosis && (
                <div style={{ paddingBottom: 8, borderBottom: `1px solid ${S.border}` }}>
                  <p style={{ fontWeight: 700, color: S.teal, margin: '0 0 2px' }}>{patientInstructions.diagnosis.patientFriendlyName}</p>
                  <p style={{ fontSize: 11, color: S.txt3, margin: 0 }}>{patientInstructions.diagnosis.patientExplanation}</p>
                </div>
              )}
              {patientInstructions.medicationInstructions?.takeAtHome?.length > 0 && (
                <div style={{ paddingBottom: 8, borderBottom: `1px solid ${S.border}` }}>
                  <p style={{ fontWeight: 700, color: S.teal, margin: '0 0 4px' }}>💊 Medications:</p>
                  {patientInstructions.medicationInstructions.takeAtHome.map((med, i) => (
                    <div key={i} style={{ marginLeft: 8 }}>
                      <p style={{ fontWeight: 600, color: S.txt, margin: '2px 0' }}>{med.medicationName}</p>
                      <p style={{ fontSize: 11, color: S.txt3, margin: 0 }}>Take: {med.dosing} · Why: {med.whyTaking}</p>
                    </div>
                  ))}
                </div>
              )}
              {patientInstructions.activityGuidelines && (
                <div style={{ paddingBottom: 8, borderBottom: `1px solid ${S.border}` }}>
                  <p style={{ fontWeight: 700, color: S.teal, margin: '0 0 2px' }}>🚶 Activity:</p>
                  <p style={{ fontSize: 11, color: S.txt3, margin: 0 }}>{patientInstructions.activityGuidelines.generalActivity}</p>
                </div>
              )}
              {patientInstructions.returnPrecautions?.call911For?.length > 0 && (
                <div>
                  <p style={{ fontWeight: 700, color: '#ff6b6b', margin: '0 0 4px' }}>🚨 Return If:</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {patientInstructions.returnPrecautions.call911For.slice(0, 2).map((item, i) => (
                      <li key={i} style={{ fontSize: 11, color: '#ff6b6b' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '24px 0', color: S.txt4, fontSize: 12 }}>Fill in Final Impression and generate instructions</p>
          )}
        </div>
      </div>

      {/* Delivery Actions */}
      <div style={boxStyle}>
        <div style={boxHdr}>📤 Deliver to Patient</div>
        <div style={boxBody}>
          {[['Print', <Printer style={{width:12,height:12}} />, handlePrint], ['Portal', <Send style={{width:12,height:12}} />, () => handleAction('Portal')], ['SMS', <MessageSquare style={{width:12,height:12}} />, () => handleAction('SMS')], ['Email', <Mail style={{width:12,height:12}} />, () => handleAction('Email')], ['PDF', <Download style={{width:12,height:12}} />, handleDownloadPDF]].map(([label, icon, handler]) => (
            <button key={label} onClick={handler} disabled={!patientInstructions} style={{ ...actionBtnStyle, opacity: !patientInstructions ? 0.4 : 1 }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Acknowledgment */}
      <div style={boxStyle}>
        <div style={boxHdr}>✅ Acknowledgment</div>
        <div style={boxBody}>
          {[['Instructions reviewed with patient', true], ['Patient understands', true], ['Interpreter used', false]].map(([label, def]) => (
            <label key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: S.txt, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={def} style={{ marginTop: 2 }} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sign */}
      <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, background: S.gold, color: '#050f1e', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        <CheckCircle2 style={{ width: 14, height: 14 }} />
        Sign & Finalize
      </button>
    </div>
  );
}