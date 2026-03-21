import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientChartTab({ patientName, demo, cc, vitals, medications, allergies, pmhSelected, surgHx, famHx, socHx, rosState, peState }) {
  const navigate = useNavigate();

  const handleOpenChart = () => {
    // Navigate to full patient chart
    navigate('/patientchart');
  };

  return (
    <div>
      <div className="npi-sec-title">📊 Patient Chart</div>
      <div className="npi-sec-sub">Quick access to comprehensive patient chart view</div>

      <div className="npi-sum-block">
        <div className="npi-sum-block-title"><span>👤</span> Current Patient</div>
        <table className="npi-sum-table"><tbody>
          <tr><td>Name</td><td>{patientName}</td></tr>
          <tr><td>Age / Sex</td><td>{demo.age || '—'} · {demo.sex || '—'}</td></tr>
          <tr><td>DOB</td><td>{demo.dob || '—'}</td></tr>
          <tr><td>MRN</td><td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{demo.mrn || '—'}</td></tr>
        </tbody></table>
      </div>

      <div className="npi-sum-block">
        <div className="npi-sum-block-title"><span>🗣️</span> Chief Complaint</div>
        <table className="npi-sum-table"><tbody>
          <tr><td>CC</td><td>{cc.text || '—'}</td></tr>
          {cc.onset && <tr><td>Onset</td><td>{cc.onset}</td></tr>}
          {cc.duration && <tr><td>Duration</td><td>{cc.duration}</td></tr>}
          {cc.severity && <tr><td>Severity</td><td>{cc.severity}/10</td></tr>}
        </tbody></table>
      </div>

      <div className="npi-sum-block">
        <div className="npi-sum-block-title"><span>📊</span> Vital Signs</div>
        <table className="npi-sum-table"><tbody>
          <tr><td>BP</td><td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{vitals.bp || '—'} mmHg</td></tr>
          <tr><td>HR</td><td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{vitals.hr || '—'} bpm</td></tr>
          <tr><td>SpO₂</td><td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{vitals.spo2 || '—'}%</td></tr>
          <tr><td>Temp</td><td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{vitals.temp || '—'}°C</td></tr>
          <tr><td>GCS</td><td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{vitals.gcs || '—'}/15</td></tr>
        </tbody></table>
      </div>

      <div className="npi-sum-block">
        <div className="npi-sum-block-title"><span>💊</span> Medications & Allergies</div>
        <table className="npi-sum-table"><tbody>
          <tr><td>Medications</td><td>{medications.length ? medications.join(', ') : '—'}</td></tr>
          <tr><td>Allergies</td><td style={{ color: allergies.length ? 'var(--coral)' : 'inherit' }}>{allergies.length ? allergies.join(', ') : 'NKDA'}</td></tr>
        </tbody></table>
      </div>

      <div className="npi-sum-btns">
        <button className="npi-sum-studio-btn" onClick={handleOpenChart}>📊 Open Full Patient Chart →</button>
        <button className="npi-sum-studio-btn" style={{ borderColor: 'var(--teal)', color: 'var(--teal)', background: 'rgba(0,229,192,.06)' }}>📝 Create SOAP Note</button>
      </div>
    </div>
  );
}