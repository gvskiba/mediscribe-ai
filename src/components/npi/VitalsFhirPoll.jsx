import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const FHIR_CODE_MAP = {
  '8867-4':  'hr',
  '8480-6':  'bp',
  '9279-1':  'rr',
  '2708-6':  'spo2',
  '59408-5': 'spo2',
  '8310-5':  'temp',
  '8302-2':  'height',
  '29463-7': 'weight',
  '9269-2':  'gcs',
};

function mapFhirObservations(observations) {
  const result = {};
  observations.forEach(obs => {
    const code = obs.code?.coding?.[0]?.code;
    const key  = FHIR_CODE_MAP[code];
    if (!key) return;
    if (key === 'bp') {
      const sys = obs.component?.find(c => c.code?.coding?.[0]?.code === '8480-6')?.valueQuantity?.value;
      const dia = obs.component?.find(c => c.code?.coding?.[0]?.code === '8462-4')?.valueQuantity?.value;
      if (sys && dia) result.bp = `${sys}/${dia}`;
    } else {
      const val = obs.valueQuantity?.value;
      if (val !== undefined) result[key] = String(val);
    }
  });
  return result;
}

export default function VitalsFhirPoll({ vitals, setVitals, onToast, patientMrn, patientFhirId }) {
  const [loading,   setLoading]   = useState(false);
  const [lastPoll,  setLastPoll]  = useState(null);

  const poll = useCallback(async () => {
    const fhirBase = window.__FHIR_BASE_URL__ || '';
    if (!fhirBase) {
      onToast?.('No FHIR server configured', 'error');
      return;
    }
    const id = patientFhirId || patientMrn;
    if (!id) {
      onToast?.('No patient ID for FHIR lookup', 'error');
      return;
    }
    setLoading(true);
    const url = `${fhirBase}/Observation?patient=${id}&category=vital-signs&_sort=-date&_count=20`;
    const res  = await fetch(url, { headers: { Accept: 'application/fhir+json' } });
    const bundle = await res.json();
    const observations = (bundle.entry || []).map(e => e.resource);
    const mapped = mapFhirObservations(observations);
    if (Object.keys(mapped).length === 0) {
      onToast?.('No vitals found in FHIR', 'error');
    } else {
      setVitals(prev => ({ ...prev, ...mapped }));
      setLastPoll(new Date());
      onToast?.(`Vitals updated from FHIR (${Object.keys(mapped).length} values)`, 'success');
    }
    setLoading(false);
  }, [patientFhirId, patientMrn, setVitals, onToast]);

  // Don't render if no FHIR base configured
  if (typeof window !== 'undefined' && !window.__FHIR_BASE_URL__) return null;

  return (
    <button
      onClick={poll}
      disabled={loading}
      title={lastPoll ? `Last polled: ${lastPoll.toLocaleTimeString()}` : 'Pull vitals from FHIR'}
      style={{ padding:'5px 14px', borderRadius:7, background:'rgba(155,109,255,.1)', border:'1px solid rgba(155,109,255,.3)', color:'var(--npi-purple)', fontSize:12, fontWeight:600, cursor: loading ? 'wait' : 'pointer', display:'flex', alignItems:'center', gap:6, opacity: loading ? .7 : 1 }}>
      {loading ? '⟳ Polling…' : '⚡ FHIR'}
      {lastPoll && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-txt4)' }}>
          {lastPoll.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
        </span>
      )}
    </button>
  );
}