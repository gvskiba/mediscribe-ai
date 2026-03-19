import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ROS_SYSTEMS, PE_SYSTEMS } from "./npiData";

export default function SummaryTab({ demo, cc, vitals, medications, allergies, pmhSelected, surgHx, famHx, socHx, rosState, rosSymptoms, peState, peFindings, patientName, onSave, onGenerateNote }) {
  const navigate = useNavigate();

  const summary = useMemo(() => {
    const pmhList = Object.entries(pmhSelected).filter(([, v]) => v > 0).map(([k]) => k);
    const rosNorm = ROS_SYSTEMS.filter(s => rosState[s.id] === 1);
    const rosAbn = ROS_SYSTEMS.filter(s => rosState[s.id] === 2);
    const peNorm = PE_SYSTEMS.filter(s => peState[s.id] === 1);
    const peAbn = PE_SYSTEMS.filter(s => peState[s.id] === 2);
    return { pmhList, rosNorm, rosAbn, peNorm, peAbn };
  }, [pmhSelected, rosState, peState]);

  const { pmhList, rosNorm, rosAbn, peNorm, peAbn } = summary;

  return (
    <div>
      <div className="npi-sec-title">📋 Patient Summary</div>
      <div className="npi-sec-sub">Review all entered information before saving to Clinical Note Studio</div>

      <div className="npi-sum-block">
        <div className="npi-sum-block-title"><span>👤</span> Patient</div>
        <table className="npi-sum-table"><tbody>
          <tr><td>Name</td><td>{patientName}</td></tr>
          <tr><td>Age / Sex</td><td>{demo.age || '—'} · {demo.sex || '—'}</td></tr>
          <tr><td>DOB</td><td>{demo.dob || '—'}</td></tr>
          <tr><td>MRN</td><td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{demo.mrn || '—'}</td></tr>
        </tbody></table>
      </div>

      <div className="npi-sum-block">
        <div className="npi-sum-block-title"><span>🗣️</span> Chief Complaint & HPI</div>
        <table className="npi-sum-table"><tbody>
          <tr><td>CC</td><td>{cc.text || '—'}</td></tr>
          {cc.onset && <tr><td>Onset</td><td>{cc.onset}</td></tr>}
          {cc.duration && <tr><td>Duration</td><td>{cc.duration}</td></tr>}
          {cc.severity && <tr><td>Severity</td><td>{cc.severity}/10</td></tr>}
          {cc.quality && <tr><td>Quality</td><td>{cc.quality}</td></tr>}
          {cc.hpi && <tr><td>HPI</td><td>{cc.hpi}</td></tr>}
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
        <div className="npi-sum-block-title"><span>💊</span> Medications & History</div>
        <table className="npi-sum-table"><tbody>
          <tr><td>Medications</td><td>{medications.length ? medications.join(', ') : '—'}</td></tr>
          <tr><td>Allergies</td><td style={{ color: allergies.length ? 'var(--coral)' : 'inherit' }}>{allergies.length ? allergies.join(', ') : 'NKDA'}</td></tr>
          <tr><td>PMH</td><td>{pmhList.length ? pmhList.join(', ') : '—'}</td></tr>
          {surgHx && <tr><td>Surgical Hx</td><td>{surgHx}</td></tr>}
          {famHx && <tr><td>Family Hx</td><td>{famHx}</td></tr>}
          {socHx && <tr><td>Social Hx</td><td>{socHx}</td></tr>}
        </tbody></table>
      </div>

      {(rosNorm.length > 0 || rosAbn.length > 0) && (
        <div className="npi-sum-block">
          <div className="npi-sum-block-title"><span>🔍</span> Review of Systems</div>
          {rosAbn.length > 0 && <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Positive Findings</div>
            {rosAbn.map(s => <div key={s.id} style={{ marginBottom: 5 }}><span className="npi-ros-item abn">✗ {s.name}</span>{rosSymptoms[s.id]?.length ? ' — ' + rosSymptoms[s.id].join(', ') : ''}</div>)}
          </div>}
          {rosNorm.length > 0 && <div>
            <div style={{ fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Negative Systems</div>
            <div>{rosNorm.map(s => <span key={s.id} className="npi-ros-item norm">✓ {s.name}</span>)}</div>
          </div>}
        </div>
      )}

      {(peNorm.length > 0 || peAbn.length > 0) && (
        <div className="npi-sum-block">
          <div className="npi-sum-block-title"><span>🩺</span> Physical Examination</div>
          {peAbn.length > 0 && <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Abnormal Findings</div>
            {peAbn.map(s => <div key={s.id} style={{ marginBottom: 5 }}><span className="npi-ros-item abn">✗ {s.name}</span> — <span style={{ fontSize: 11, color: 'var(--txt2)' }}>{peFindings[s.id]}</span></div>)}
          </div>}
          {peNorm.length > 0 && <div>
            <div style={{ fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Normal Systems</div>
            <div>{peNorm.map(s => <span key={s.id} className="npi-ros-item norm">✓ {s.name}</span>)}</div>
          </div>}
        </div>
      )}

      <div className="npi-sum-btns">
        <button className="npi-sum-studio-btn" onClick={onSave}>📝 Save & Open in Studio →</button>
        <button className="npi-sum-generate-btn" onClick={onGenerateNote}>✨ AI Generate Note</button>
        <button className="npi-sum-studio-btn" style={{ borderColor: 'var(--teal)', color: 'var(--teal)', background: 'rgba(0,229,192,.06)' }} onClick={() => navigate('/ERPlanBuilder')}>🩺 Open ER Plan Builder →</button>
      </div>
    </div>
  );
}