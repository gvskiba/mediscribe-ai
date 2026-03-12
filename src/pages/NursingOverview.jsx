import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, Heart, Droplet, Thermometer, Wind } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function NursingOverview() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock patient data across multiple rooms
  const patients = [
    {
      room: 'TR-1',
      name: 'Margaret Sullivan',
      age: 67,
      diagnosis: 'Chest pain, r/o NSTEMI',
      status: 'critical',
      vitals: {
        current: { hr: 96, bp: '98/66', spo2: 97, temp: 98.7, rr: 17 },
        trend: [
          { time: '08:30', hr: 108, sbp: 88, dbp: 60, spo2: 94, temp: 98.6, rr: 20 },
          { time: '09:00', hr: 102, sbp: 92, dbp: 64, spo2: 96, temp: 98.8, rr: 18 },
          { time: '09:30', hr: 96, sbp: 98, dbp: 66, spo2: 97, temp: 98.7, rr: 17 },
        ]
      },
      alerts: [
        { type: 'critical', message: 'Troponin elevated: 0.22 ng/mL', time: '09:15' },
        { type: 'urgent', message: 'Hypotensive on admission', time: '08:30' }
      ],
      orders: [
        { type: 'medication', text: 'Heparin protocol - initiate', status: 'overdue', dueTime: '09:00' },
        { type: 'lab', text: 'Troponin serial (repeat)', status: 'pending', dueTime: '11:14' }
      ]
    },
    {
      room: 'TR-2',
      name: 'James Chen',
      age: 54,
      diagnosis: 'Sepsis, pneumonia',
      status: 'critical',
      vitals: {
        current: { hr: 118, bp: '92/58', spo2: 91, temp: 102.3, rr: 24 },
        trend: [
          { time: '08:00', hr: 122, sbp: 88, dbp: 54, spo2: 89, temp: 102.8, rr: 26 },
          { time: '08:30', hr: 120, sbp: 90, dbp: 56, spo2: 90, temp: 102.5, rr: 25 },
          { time: '09:00', hr: 118, sbp: 92, dbp: 58, spo2: 91, temp: 102.3, rr: 24 },
        ]
      },
      alerts: [
        { type: 'critical', message: 'Sepsis criteria met - qSOFA 3', time: '08:05' },
        { type: 'critical', message: 'Lactate 4.2 mmol/L', time: '08:20' }
      ],
      orders: [
        { type: 'medication', text: 'Vancomycin 1g IV - dose 2', status: 'overdue', dueTime: '08:45' },
        { type: 'lab', text: 'Blood cultures x2', status: 'completed', dueTime: '08:10' }
      ]
    },
    {
      room: 'TR-3',
      name: 'Linda Martinez',
      age: 42,
      diagnosis: 'DKA',
      status: 'stable',
      vitals: {
        current: { hr: 88, bp: '118/76', spo2: 98, temp: 98.2, rr: 16 },
        trend: [
          { time: '07:30', hr: 98, sbp: 108, dbp: 70, spo2: 97, temp: 98.4, rr: 18 },
          { time: '08:00', hr: 92, sbp: 114, dbp: 74, spo2: 98, temp: 98.3, rr: 17 },
          { time: '08:30', hr: 88, sbp: 118, dbp: 76, spo2: 98, temp: 98.2, rr: 16 },
        ]
      },
      alerts: [],
      orders: [
        { type: 'lab', text: 'Glucose finger stick q1h', status: 'pending', dueTime: '09:30' },
        { type: 'medication', text: 'Insulin drip - continue', status: 'active', dueTime: 'ongoing' }
      ]
    },
    {
      room: 'TR-4',
      name: 'Robert Kim',
      age: 71,
      diagnosis: 'GI bleed',
      status: 'urgent',
      vitals: {
        current: { hr: 104, bp: '106/64', spo2: 95, temp: 97.8, rr: 18 },
        trend: [
          { time: '08:15', hr: 110, sbp: 102, dbp: 60, spo2: 94, temp: 97.9, rr: 19 },
          { time: '08:45', hr: 106, sbp: 104, dbp: 62, spo2: 95, temp: 97.8, rr: 18 },
          { time: '09:15', hr: 104, sbp: 106, dbp: 64, spo2: 95, temp: 97.8, rr: 18 },
        ]
      },
      alerts: [
        { type: 'urgent', message: 'Hgb 7.2 g/dL - transfusion threshold', time: '08:40' }
      ],
      orders: [
        { type: 'blood', text: 'PRBC 2 units - type & cross', status: 'pending', dueTime: '09:45' },
        { type: 'procedure', text: 'GI consult - urgent EGD', status: 'pending', dueTime: '10:00' }
      ]
    }
  ];

  const filteredPatients = selectedRoom === 'all' 
    ? patients 
    : patients.filter(p => p.room === selectedRoom);

  const statusColors = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
    urgent: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
    stable: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' }
  };

  const getTrendIcon = (data, field) => {
    if (data.length < 2) return <Minus className="w-4 h-4 text-slate-500" />;
    const first = field === 'sbp' ? data[0].sbp : data[0][field];
    const last = field === 'sbp' ? data[data.length - 1].sbp : data[data.length - 1][field];
    if (last > first) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (last < first) return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    return <Minus className="w-4 h-4 text-slate-500" />;
  };

  const totalCritical = patients.reduce((sum, p) => sum + p.alerts.filter(a => a.type === 'critical').length, 0);
  const totalOverdue = patients.reduce((sum, p) => sum + p.orders.filter(o => o.status === 'overdue').length, 0);
  const totalPending = patients.reduce((sum, p) => sum + p.orders.filter(o => o.status === 'pending').length, 0);

  return (
    <div className="min-h-screen bg-[#050f1e] text-slate-200 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nursing Overview Dashboard</h1>
            <p className="text-slate-400 text-sm">Real-time patient monitoring across all rooms</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 mb-1">Total Patients</div>
                <div className="text-3xl font-bold text-white">{patients.length}</div>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-red-300 mb-1">Critical Alerts</div>
                <div className="text-3xl font-bold text-red-400">{totalCritical}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 mb-1">Overdue Orders</div>
                <div className="text-3xl font-bold text-amber-400">{totalOverdue}</div>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-300 mb-1">Pending Orders</div>
                <div className="text-3xl font-bold text-blue-400">{totalPending}</div>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Room Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setSelectedRoom('all')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            selectedRoom === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          All Rooms
        </button>
        {patients.map(p => (
          <button
            key={p.room}
            onClick={() => setSelectedRoom(p.room)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedRoom === p.room
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {p.room}
          </button>
        ))}
      </div>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPatients.map(patient => {
          const colors = statusColors[patient.status];
          return (
            <div
              key={patient.room}
              className={`bg-slate-800/50 border ${colors.border} rounded-2xl overflow-hidden`}
            >
              {/* Patient Header */}
              <div className={`${colors.bg} border-b ${colors.border} p-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                      <span className="font-mono text-sm font-bold text-white">{patient.room}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors.text} bg-slate-900/50`}>
                        {patient.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{patient.name}</h3>
                    <p className="text-xs text-slate-400">{patient.age}y • {patient.diagnosis}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Current Vitals</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-center">
                        <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
                        <div className="text-xs font-mono font-bold text-white">{patient.vitals.current.hr}</div>
                      </div>
                      <div className="text-center">
                        <Activity className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <div className="text-xs font-mono font-bold text-white">{patient.vitals.current.bp}</div>
                      </div>
                      <div className="text-center">
                        <Wind className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <div className="text-xs font-mono font-bold text-white">{patient.vitals.current.spo2}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                {patient.alerts.length > 0 && (
                  <div className="space-y-1">
                    {patient.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                          alert.type === 'critical'
                            ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                            : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span className="flex-1 font-semibold">{alert.message}</span>
                        <span className="font-mono text-xs opacity-75">{alert.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vital Sign Trends */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Vital Sign Trends
                </h4>
                
                {/* HR Chart */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Heart Rate (bpm)</span>
                    {getTrendIcon(patient.vitals.trend, 'hr')}
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={patient.vitals.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '10px' }} />
                      <YAxis domain={[60, 140]} stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Line type="monotone" dataKey="hr" stroke="#f87171" strokeWidth={2} dot={{ fill: '#dc2626' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* BP Chart */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Blood Pressure (mmHg)</span>
                    {getTrendIcon(patient.vitals.trend, 'sbp')}
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={patient.vitals.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '10px' }} />
                      <YAxis domain={[40, 180]} stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Line type="monotone" dataKey="sbp" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                      <Line type="monotone" dataKey="dbp" stroke="#34d399" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* SpO2 Chart */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">SpO₂ (%)</span>
                    {getTrendIcon(patient.vitals.trend, 'spo2')}
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={patient.vitals.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '10px' }} />
                      <YAxis domain={[85, 100]} stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Line type="monotone" dataKey="spo2" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Orders */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Orders Status
                  </h5>
                  <div className="space-y-2">
                    {patient.orders.map((order, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                          order.status === 'overdue'
                            ? 'bg-red-500/20 border border-red-500/40'
                            : order.status === 'pending'
                            ? 'bg-blue-500/20 border border-blue-500/40'
                            : order.status === 'completed'
                            ? 'bg-emerald-500/20 border border-emerald-500/40'
                            : 'bg-slate-700/50 border border-slate-600'
                        }`}
                      >
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            order.status === 'overdue' ? 'text-red-300' :
                            order.status === 'pending' ? 'text-blue-300' :
                            order.status === 'completed' ? 'text-emerald-300' :
                            'text-slate-300'
                          }`}>
                            {order.text}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                            order.status === 'overdue' ? 'bg-red-500 text-white' :
                            order.status === 'pending' ? 'bg-blue-500 text-white' :
                            order.status === 'completed' ? 'bg-emerald-500 text-white' :
                            'bg-slate-600 text-slate-300'
                          }`}>
                            {order.status.toUpperCase()}
                          </div>
                          <div className="font-mono text-xs text-slate-400 mt-0.5">{order.dueTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}