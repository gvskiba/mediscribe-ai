import React, { useState } from 'react';
import { AlertCircle, TrendingUp, Pill, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CSS = `
.pdmp-panel {
  background: linear-gradient(135deg, #0a1e36 0%, #081628 100%);
  border: 1.5px solid #1a3555;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  color: #e8f0fe;
  font-size: 12px;
}

.pdmp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1a3555;
}

.pdmp-title {
  font-weight: 700;
  font-size: 13px;
  color: #e8f0fe;
  flex: 1;
}

.pdmp-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.pdmp-status.none {
  background: rgba(0, 229, 192, 0.1);
  color: #00e5c0;
}

.pdmp-status.low {
  background: rgba(245, 200, 66, 0.1);
  color: #f5c842;
}

.pdmp-status.moderate {
  background: rgba(255, 159, 67, 0.1);
  color: #ff9f43;
}

.pdmp-status.high {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.pdmp-alert {
  background: rgba(255, 107, 107, 0.06);
  border: 1px solid rgba(255, 107, 107, 0.25);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}

.pdmp-alert.high {
  border-color: rgba(255, 107, 107, 0.5);
  background: rgba(255, 107, 107, 0.08);
}

.pdmp-alert.moderate {
  border-color: rgba(255, 159, 67, 0.4);
  background: rgba(255, 159, 67, 0.06);
}

.pdmp-alert-icon {
  display: inline-block;
  margin-right: 5px;
  font-size: 13px;
}

.pdmp-alert-text {
  color: #e8f0fe;
  line-height: 1.5;
  font-size: 11px;
}

.pdmp-risk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.pdmp-risk-card {
  background: rgba(26, 53, 85, 0.5);
  border: 1px solid #1a3555;
  border-radius: 6px;
  padding: 8px;
}

.pdmp-risk-label {
  font-size: 10px;
  color: #8aaccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
  font-weight: 600;
}

.pdmp-risk-value {
  font-size: 13px;
  font-weight: 700;
  color: #e8f0fe;
}

.pdmp-risk-value.high {
  color: #ff6b6b;
}

.pdmp-risk-value.moderate {
  color: #ff9f43;
}

.pdmp-risk-value.low {
  color: #f5c842;
}

.pdmp-rx-list {
  background: rgba(4, 13, 26, 0.6);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 10px;
  max-height: 150px;
  overflow-y: auto;
}

.pdmp-rx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 10px;
  border-bottom: 1px solid rgba(26, 53, 85, 0.5);
  color: #8aaccc;
}

.pdmp-rx-item:last-child {
  border-bottom: none;
}

.pdmp-rx-drug {
  font-weight: 600;
  color: #e8f0fe;
}

.pdmp-rx-prescriber {
  font-size: 9px;
  color: #4a6a8a;
}

.pdmp-rx-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #4a6a8a;
}

.pdmp-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.pdmp-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #1a3555;
  background: rgba(26, 53, 85, 0.6);
  color: #8aaccc;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'DM Sans', sans-serif;
}

.pdmp-btn:hover {
  border-color: #3b9eff;
  color: #3b9eff;
  background: rgba(59, 158, 255, 0.08);
}

.pdmp-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8aaccc;
  font-size: 11px;
}

.pdmp-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #3b9eff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

export default function PDMPAlertPanel({ patientName, patientDob, patientId, state = 'TX', onClose }) {
  const [pdmpData, setPdmpData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRx, setExpandedRx] = useState(false);

  const queryPDMP = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('queryPDMP', {
        patientName: patientName || 'Unknown',
        patientDob: patientDob || '',
        patientId: patientId || '',
        state: state || 'TX',
      });

      if (response.data.success) {
        setPdmpData(response.data.pdmpQuery);
        toast.success('PDMP query completed');
      } else {
        setError(response.data.error || 'PDMP query failed');
        toast.error('PDMP query failed');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      toast.error(`PDMP Error: ${msg}`);
    }
    setLoading(false);
  };

  if (!pdmpData && !loading) {
    return (
      <div className="pdmp-panel">
        <style>{CSS}</style>
        <div className="pdmp-header">
          <Pill style={{ width: 16, height: 16 }} />
          <div className="pdmp-title">PDMP Controlled Substance Check</div>
        </div>
        <div style={{ fontSize: 11, color: '#8aaccc', marginBottom: 10 }}>
          Query state PDMP for controlled substance history, doctor shopping patterns, and opioid interactions.
        </div>
        <button
          className="pdmp-btn"
          onClick={queryPDMP}
          style={{ width: '100%', marginTop: 0 }}
        >
          🔍 Query PDMP for {patientName || 'Patient'}
        </button>
        {error && <div style={{ color: '#ff6b6b', marginTop: 8, fontSize: 11 }}>⚠️ {error}</div>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pdmp-panel">
        <style>{CSS}</style>
        <div className="pdmp-loading">
          <div className="pdmp-spinner" />
          Querying PDMP database...
        </div>
      </div>
    );
  }

  if (!pdmpData) return null;

  const analysis = pdmpData;
  const hasAlerts = pdmpData.doctor_shopping_risk !== 'none' || 
                    pdmpData.opioid_overlap_risk !== 'none' || 
                    pdmpData.benzodiazepine_opioid_combo;

  return (
    <div className="pdmp-panel">
      <style>{CSS}</style>
      
      <div className="pdmp-header">
        {hasAlerts ? (
          <AlertTriangle style={{ width: 18, height: 18, color: '#ff6b6b' }} />
        ) : (
          <CheckCircle2 style={{ width: 18, height: 18, color: '#00e5c0' }} />
        )}
        <div className="pdmp-title">PDMP Controlled Substance History</div>
        <div className="pdmp-status" style={{ marginLeft: 'auto' }}>
          ✓ Queried
        </div>
      </div>

      {/* Doctor Shopping Alert */}
      {pdmpData.doctor_shopping_risk !== 'none' && (
        <div className={`pdmp-alert ${pdmpData.doctor_shopping_risk}`}>
          <div className="pdmp-alert-icon">⚠️</div>
          <div className="pdmp-alert-text">
            <strong>Doctor Shopping Risk:</strong> {pdmpData.doctor_shopping_details}
          </div>
        </div>
      )}

      {/* Opioid Overlap Alert */}
      {pdmpData.opioid_overlap_risk !== 'none' && (
        <div className={`pdmp-alert ${pdmpData.opioid_overlap_risk}`}>
          <div className="pdmp-alert-icon">⚠️</div>
          <div className="pdmp-alert-text">
            <strong>Concurrent Opioid Risk:</strong> {pdmpData.opioid_overlap_details}
          </div>
        </div>
      )}

      {/* Benzodiazepine-Opioid Combo Alert */}
      {pdmpData.benzodiazepine_opioid_combo && (
        <div className="pdmp-alert high">
          <div className="pdmp-alert-icon">🚨</div>
          <div className="pdmp-alert-text">
            <strong>Critical Alert:</strong> Patient has concurrent benzodiazepine and opioid prescriptions. Extreme overdose risk.
          </div>
        </div>
      )}

      {/* Risk Summary Cards */}
      <div className="pdmp-risk-grid">
        <div className="pdmp-risk-card">
          <div className="pdmp-risk-label">Doctor Shopping</div>
          <div className={`pdmp-risk-value ${pdmpData.doctor_shopping_risk}`}>
            {pdmpData.doctor_shopping_risk.toUpperCase()}
          </div>
        </div>
        <div className="pdmp-risk-card">
          <div className="pdmp-risk-label">Opioid Overlap</div>
          <div className={`pdmp-risk-value ${pdmpData.opioid_overlap_risk}`}>
            {pdmpData.opioid_overlap_risk.toUpperCase()}
          </div>
        </div>
        <div className="pdmp-risk-card">
          <div className="pdmp-risk-label">Total MME (30d)</div>
          <div className="pdmp-risk-value">{pdmpData.total_mme_past_30_days || 0} MME</div>
        </div>
        <div className="pdmp-risk-card">
          <div className="pdmp-risk-label">Prescriptions</div>
          <div className="pdmp-risk-value">{pdmpData.controlled_prescriptions?.length || 0}</div>
        </div>
      </div>

      {/* Prescription History */}
      {pdmpData.controlled_prescriptions?.length > 0 && (
        <>
          <button
            onClick={() => setExpandedRx(!expandedRx)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3b9eff',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 8,
              padding: 0,
            }}
          >
            {expandedRx ? '▼' : '▶'} Recent Controlled Prescriptions ({pdmpData.controlled_prescriptions.length})
          </button>
          {expandedRx && (
            <div className="pdmp-rx-list">
              {pdmpData.controlled_prescriptions.map((rx, i) => (
                <div key={i} className="pdmp-rx-item">
                  <div>
                    <div className="pdmp-rx-drug">{rx.drug_name}</div>
                    <div className="pdmp-rx-prescriber">Dr. {rx.prescriber_name?.split(' ').pop() || 'Unknown'}</div>
                  </div>
                  <div className="pdmp-rx-date">{rx.date_filled}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="pdmp-actions">
        <button className="pdmp-btn" onClick={queryPDMP}>
          🔄 Refresh
        </button>
        <button
          className="pdmp-btn"
          onClick={() => {
            if (pdmpData.flagged_for_review) {
              toast.info('This query is flagged for clinical review');
            }
          }}
        >
          {pdmpData.flagged_for_review ? '🚩 Flagged' : '✓ Clear'}
        </button>
        {onClose && (
          <button className="pdmp-btn" onClick={onClose}>
            ✕ Close
          </button>
        )}
      </div>

      <div style={{ fontSize: 9, color: '#4a6a8a', marginTop: 8 }}>
        ℹ️ Queried {new Date(pdmpData.queried_at).toLocaleString()} • State: {pdmpData.state}
      </div>
    </div>
  );
}