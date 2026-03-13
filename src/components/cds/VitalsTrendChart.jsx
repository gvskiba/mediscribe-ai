import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function VitalsTrendChart({ C }) {
  const [selectedVital, setSelectedVital] = useState('lactate');
  const [predictiveScore, setPredictiveScore] = useState(null);
  const [loading, setLoading] = useState(false);

  // Historical data (last 24 hours)
  const vitalData = {
    lactate: [
      { time: '00:00', value: 2.1, threshold: 2.0 },
      { time: '02:00', value: 2.4, threshold: 2.0 },
      { time: '04:00', value: 2.8, threshold: 2.0 },
      { time: '06:00', value: 3.3, threshold: 2.0 },
      { time: '06:50', value: 4.2, threshold: 2.0, current: true },
      { time: '08:00', value: null, predicted: 4.8, threshold: 2.0 },
      { time: '10:00', value: null, predicted: 5.2, threshold: 2.0 }
    ],
    map: [
      { time: '00:00', value: 78, threshold: 65 },
      { time: '02:00', value: 72, threshold: 65 },
      { time: '04:00', value: 68, threshold: 65 },
      { time: '06:00', value: 62, threshold: 65 },
      { time: '06:50', value: 55, threshold: 65, current: true },
      { time: '08:00', value: null, predicted: 52, threshold: 65 },
      { time: '10:00', value: null, predicted: 48, threshold: 65 }
    ],
    hr: [
      { time: '00:00', value: 92, threshold: 100 },
      { time: '02:00', value: 98, threshold: 100 },
      { time: '04:00', value: 105, threshold: 100 },
      { time: '06:00', value: 112, threshold: 100 },
      { time: '06:50', value: 118, threshold: 100, current: true },
      { time: '08:00', value: null, predicted: 122, threshold: 100 },
      { time: '10:00', value: null, predicted: 126, threshold: 100 }
    ]
  };

  const vitalConfigs = {
    lactate: { 
      label: 'Lactate (mmol/L)', 
      color: C.red, 
      threshold: 2.0, 
      thresholdLabel: 'Sepsis Threshold',
      unit: 'mmol/L',
      riskDirection: 'above'
    },
    map: { 
      label: 'MAP (mmHg)', 
      color: C.amber, 
      threshold: 65, 
      thresholdLabel: 'Target MAP',
      unit: 'mmHg',
      riskDirection: 'below'
    },
    hr: { 
      label: 'Heart Rate (bpm)', 
      color: C.purple, 
      threshold: 100, 
      thresholdLabel: 'Tachycardia Threshold',
      unit: 'bpm',
      riskDirection: 'above'
    }
  };

  const calculateRiskScore = () => {
    setLoading(true);
    // Simulate AI analysis
    setTimeout(() => {
      const config = vitalConfigs[selectedVital];
      const data = vitalData[selectedVital];
      const currentValue = data.find(d => d.current)?.value;
      const predictedValue = data.find(d => d.predicted)?.predicted;
      
      let score = 0;
      let trend = '';
      let warning = '';

      if (selectedVital === 'lactate') {
        const increase = predictedValue - currentValue;
        score = Math.min(95, 60 + (increase / currentValue * 100));
        trend = 'Rising';
        warning = score > 80 ? 'High risk of organ dysfunction within 2 hours' : 'Moderate risk - monitor closely';
      } else if (selectedVital === 'map') {
        const decrease = currentValue - predictedValue;
        score = Math.min(95, 55 + (decrease / currentValue * 120));
        trend = 'Declining';
        warning = score > 80 ? 'Severe hypotension imminent - vasopressor escalation needed' : 'Continued decline expected';
      } else if (selectedVital === 'hr') {
        const increase = predictedValue - currentValue;
        score = Math.min(95, 50 + (increase / currentValue * 150));
        trend = 'Accelerating';
        warning = score > 75 ? 'Compensatory tachycardia failing - cardiac workload critical' : 'Trending toward instability';
      }

      setPredictiveScore({
        score: Math.round(score),
        trend,
        warning,
        timeToAlert: score > 80 ? '1-2 hours' : '2-4 hours'
      });
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    calculateRiskScore();
  }, [selectedVital]);

  const config = vitalConfigs[selectedVital];
  const data = vitalData[selectedVital];

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 11, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: C.bright, marginBottom: 4 }}>
            📈 Vital Trends & Predictive Analytics
          </div>
          <div style={{ fontSize: 10, color: C.dim }}>AI-powered deterioration forecasting · 24-hour window</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.keys(vitalConfigs).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedVital(key)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                background: selectedVital === key ? vitalConfigs[key].color : 'transparent',
                color: selectedVital === key ? '#000' : C.dim,
                border: `1px solid ${selectedVital === key ? vitalConfigs[key].color : C.border}`,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s'
              }}
            >
              {key === 'lactate' ? 'Lactate' : key === 'map' ? 'MAP' : 'HR'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#0a1a2e', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke={C.dim} 
              style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <YAxis 
              stroke={C.dim} 
              style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <Tooltip 
              contentStyle={{ 
                background: C.panel, 
                border: `1px solid ${C.border}`, 
                borderRadius: 6,
                fontSize: 11,
                fontFamily: "'DM Sans', sans-serif"
              }}
              labelStyle={{ color: C.bright, fontWeight: 600 }}
            />
            <Legend 
              wrapperStyle={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
            />
            <ReferenceLine 
              y={config.threshold} 
              stroke={config.color} 
              strokeDasharray="5 5" 
              label={{ value: config.thresholdLabel, fill: config.color, fontSize: 10 }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={config.color} 
              strokeWidth={2.5} 
              dot={{ fill: config.color, r: 4 }}
              activeDot={{ r: 6 }}
              name="Actual"
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke={C.purple} 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={{ fill: C.purple, r: 3 }}
              name="AI Predicted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Predictive Risk Panel */}
      {predictiveScore && (
        <div style={{ background: 'linear-gradient(135deg, rgba(155,109,255,.08), rgba(0,212,188,.05))', border: `1px solid ${predictiveScore.score > 80 ? 'rgba(255,92,108,.35)' : 'rgba(155,109,255,.25)'}`, borderRadius: 9, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Risk Score */}
            <div style={{ textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Risk Score</div>
              <div style={{ 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: 36, 
                fontWeight: 700, 
                color: predictiveScore.score > 80 ? C.red : predictiveScore.score > 60 ? C.amber : C.blue,
                lineHeight: 1
              }}>
                {predictiveScore.score}
              </div>
              <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>/ 100</div>
              <div style={{ marginTop: 8, height: 4, background: '#162d4f', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${predictiveScore.score}%`, 
                  height: '100%', 
                  background: predictiveScore.score > 80 ? `linear-gradient(90deg, ${C.amber}, ${C.red})` : `linear-gradient(90deg, ${C.blue}, ${C.purple})`,
                  borderRadius: 2,
                  transition: 'width 1s ease'
                }} />
              </div>
            </div>

            {/* Prediction Details */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {predictiveScore.score > 80 ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: C.red }} />
                ) : (
                  <TrendingUp className="w-4 h-4" style={{ color: predictiveScore.trend === 'Declining' ? C.amber : C.purple }} />
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: C.bright }}>
                  {predictiveScore.trend} Trend Detected
                </span>
                <span style={{ 
                  fontSize: 9, 
                  fontFamily: "'JetBrains Mono', monospace", 
                  fontWeight: 700, 
                  padding: '2px 7px', 
                  borderRadius: 4, 
                  background: predictiveScore.score > 80 ? 'rgba(255,92,108,.15)' : 'rgba(155,109,255,.12)',
                  color: predictiveScore.score > 80 ? C.red : C.purple,
                  textTransform: 'uppercase'
                }}>
                  {predictiveScore.score > 80 ? 'HIGH RISK' : predictiveScore.score > 60 ? 'MODERATE' : 'LOW RISK'}
                </span>
              </div>
              
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>
                <strong style={{ color: predictiveScore.score > 80 ? C.red : C.purple }}>⚠ Prediction:</strong> {predictiveScore.warning}
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: C.dim }}>
                <div>
                  <span style={{ color: C.text }}>Time to Alert:</span> 
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: predictiveScore.score > 80 ? C.red : C.amber, fontWeight: 600, marginLeft: 4 }}>
                    {predictiveScore.timeToAlert}
                  </span>
                </div>
                <div>
                  <span style={{ color: C.text }}>Confidence:</span> 
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.teal, fontWeight: 600, marginLeft: 4 }}>
                    {predictiveScore.score > 75 ? '87%' : '82%'}
                  </span>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  Model: <span style={{ color: C.purple, fontWeight: 500 }}>SOFA + AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, color: C.purple }}>
          <div style={{ width: 14, height: 14, border: '2px solid rgba(155,109,255,.2)', borderTopColor: C.purple, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 8 }} />
          Calculating predictive score...
        </div>
      )}
    </div>
  );
}