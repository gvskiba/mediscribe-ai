import React from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * v2 Icon Sidebar — 7 app-level icons only.
 * NO chart-section icons (SOAP, Orders, Discharge, MDM, etc.)
 */
const APP_ICONS = [
  { icon: '🏠', label: 'Home',      path: '/' },
  { icon: '📊', label: 'Dashboard', path: '/Dashboard' },
  { icon: '👥', label: 'Patients',  path: '/PatientDashboard' },
  { icon: '🔄', label: 'Shift',     path: '/Shift' },
  { icon: '💊', label: 'Drugs',     path: '/DrugsBugs' },
  { icon: '🧮', label: 'Calc',      path: '/Calculators' },
];

export default function AppSidebar({ user }) {
  const location = useLocation();

  const pageAbbr = (() => {
    const seg = location.pathname.replace('/', '').replace(/([A-Z])/g, ' $1').trim();
    return (seg.slice(0, 1) + (seg.split(' ')[1]?.[0] || seg[1] || '')).toUpperCase() || 'Nx';
  })();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 56,
      background: '#040d19', borderRight: '1px solid #1a3555',
      display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 300,
    }}>
      {/* Logo box */}
      <div style={{
        width: '100%', height: 48, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid #1a3555',
      }}>
        <Link to="/" style={{
          width: 30, height: 30, background: '#3b9eff', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700,
          color: 'white', textDecoration: 'none',
        }}>{pageAbbr}</Link>
      </div>

      {/* App icons */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 2, overflowY: 'auto' }}>
        {APP_ICONS.map(item => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              style={{
                width: 42, height: 42,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, borderRadius: 6, textDecoration: 'none', transition: 'all 0.15s',
                fontSize: 16, color: active ? '#3b9eff' : '#4a6a8a',
                background: active ? 'rgba(59,158,255,0.1)' : 'transparent',
                border: `1px solid ${active ? 'rgba(59,158,255,0.3)' : 'transparent'}`,
              }}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: 8, lineHeight: 1, whiteSpace: 'nowrap', color: 'inherit' }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Settings pinned bottom */}
      <div style={{ padding: '8px 0', borderTop: '1px solid #1a3555', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Link
          to="/AppSettings"
          title="Settings"
          style={{
            width: 42, height: 42,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, borderRadius: 6, textDecoration: 'none', transition: 'all 0.15s',
            fontSize: 16, color: location.pathname === '/AppSettings' ? '#3b9eff' : '#4a6a8a',
            background: location.pathname === '/AppSettings' ? 'rgba(59,158,255,0.1)' : 'transparent',
            border: `1px solid ${location.pathname === '/AppSettings' ? 'rgba(59,158,255,0.3)' : 'transparent'}`,
          }}
        >
          <span>⚙️</span>
          <span style={{ fontSize: 8, lineHeight: 1, color: 'inherit' }}>Settings</span>
        </Link>
      </div>
    </div>
  );
}