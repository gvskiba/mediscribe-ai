import { useState, useEffect, useRef } from "react";
import { runCDSRules } from "@/lib/cdsRules";

const CSS_ID = "cds-sidebar-css";

if (!document.getElementById(CSS_ID)) {
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = `
.cds-sidebar{
  width:220px;flex-shrink:0;
  background:rgba(5,10,20,.96);
  border-left:1px solid #1a3555;
  display:flex;flex-direction:column;
  overflow:hidden;
  transition:width .25s ease;
}
.cds-sidebar.collapsed{width:32px;}
.cds-sidebar-hdr{
  padding:8px 8px 6px;
  border-bottom:1px solid #1a3555;
  display:flex;align-items:center;gap:6px;
  flex-shrink:0;cursor:pointer;user-select:none;
  min-height:36px;
}
.cds-sidebar-hdr:hover{background:rgba(14,37,68,.5);}
.cds-hdr-icon{font-size:13px;flex-shrink:0;}
.cds-hdr-label{
  font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;
  letter-spacing:1.5px;text-transform:uppercase;color:#5a82a8;
  flex:1;white-space:nowrap;overflow:hidden;
}
.cds-hdr-badge{
  min-width:16px;height:16px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;
  padding:0 4px;flex-shrink:0;
}
.cds-hdr-badge.has-crit{background:rgba(255,68,68,.2);color:#ff4444;border:1px solid rgba(255,68,68,.35);animation:cds-pulse 2s ease-in-out infinite;}
.cds-hdr-badge.has-warn{background:rgba(245,200,66,.15);color:#f5c842;border:1px solid rgba(245,200,66,.25);}
.cds-hdr-badge.clear{background:rgba(0,229,192,.1);color:#00e5c0;border:1px solid rgba(0,229,192,.2);}
@keyframes cds-pulse{0%,100%{opacity:1}50%{opacity:.4}}
.cds-toggle{
  width:20px;height:20px;border-radius:4px;border:1px solid #1a3555;
  background:#0e2544;color:#5a82a8;font-size:10px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:all .13s;
}
.cds-toggle:hover{border-color:#2a4f7a;color:#b8d4f0;}
.cds-body{flex:1;overflow-y:auto;padding:6px 6px 12px;display:flex;flex-direction:column;gap:4px;}
.cds-body::-webkit-scrollbar{width:3px;}
.cds-body::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px;}
.cds-alert{
  border-radius:6px;padding:7px 8px;cursor:pointer;
  border-left:3px solid transparent;transition:all .13s;
  border:1px solid transparent;
}
.cds-alert.critical{
  background:rgba(255,68,68,.07);
  border-color:rgba(255,68,68,.25);
  border-left-color:#ff4444;
}
.cds-alert.critical:hover{background:rgba(255,68,68,.12);}
.cds-alert.warning{
  background:rgba(245,200,66,.05);
  border-color:rgba(245,200,66,.2);
  border-left-color:#f5c842;
}
.cds-alert.warning:hover{background:rgba(245,200,66,.1);}
.cds-alert.info{
  background:rgba(59,158,255,.05);
  border-color:rgba(59,158,255,.15);
  border-left-color:#3b9eff;
}
.cds-alert.info:hover{background:rgba(59,158,255,.1);}
.cds-alert-cat{
  font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;
  letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;
  display:flex;align-items:center;gap:4px;
}
.cds-alert-cat.critical{color:#ff4444;}
.cds-alert-cat.warning{color:#f5c842;}
.cds-alert-cat.info{color:#3b9eff;}
.cds-alert-title{
  font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;
  color:#f2f7ff;line-height:1.3;margin-bottom:0;
}
.cds-alert-detail{
  font-family:'DM Sans',sans-serif;font-size:10px;color:#82aece;
  line-height:1.5;margin-top:4px;
  display:none;
}
.cds-alert.expanded .cds-alert-detail{display:block;}
.cds-alert-chevron{font-size:9px;color:#5a82a8;margin-left:auto;flex-shrink:0;}
.cds-clear{
  text-align:center;padding:24px 12px;
  font-family:'DM Sans',sans-serif;font-size:11px;color:#2a4f7a;
}
.cds-clear-ico{font-size:22px;opacity:.4;margin-bottom:6px;}
.cds-sep{height:1px;background:#1a3555;margin:2px 0;flex-shrink:0;}
.cds-cat-group-lbl{
  font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;
  letter-spacing:1.5px;text-transform:uppercase;color:#2a4f7a;
  padding:6px 2px 2px;
}
.cds-collapsed-badges{
  flex:1;display:flex;flex-direction:column;align-items:center;
  gap:4px;padding:8px 0;overflow:hidden;
}
.cds-micro-badge{
  width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:700;font-family:'JetBrains Mono',monospace;
}
.cds-micro-badge.critical{background:rgba(255,68,68,.2);color:#ff4444;}
.cds-micro-badge.warning{background:rgba(245,200,66,.15);color:#f5c842;}
.cds-micro-badge.info{background:rgba(59,158,255,.12);color:#3b9eff;}
`;
  document.head.appendChild(s);
}

const SEV_ICON = { critical: "🚨", warning: "⚠️", info: "ℹ️" };

export default function CDSAlertsSidebar({ medications, allergies, vitals, pmhSelected, age, cc }) {
  const [alerts,    setAlerts]    = useState([]);
  const [expanded,  setExpanded]  = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const debounceRef = useRef(null);

  // Re-run rules whenever inputs change, debounced 400ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = runCDSRules({ medications, allergies, vitals, pmhSelected, age, cc });
      setAlerts(result);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [
    medications.length,
    allergies.length,
    vitals.hr, vitals.bp, vitals.spo2, vitals.rr, vitals.temp, vitals.gcs,
    JSON.stringify(pmhSelected),
    age,
    cc,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAlert = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const critCount = alerts.filter(a => a.severity === "critical").length;
  const warnCount = alerts.filter(a => a.severity === "warning").length;
  const totalCount = alerts.length;

  const badgeClass = critCount > 0 ? "has-crit" : warnCount > 0 ? "has-warn" : "clear";
  const badgeText  = totalCount > 0 ? String(totalCount) : "✓";

  // Group by category
  const groups = {};
  alerts.forEach(a => { (groups[a.category] = groups[a.category] || []).push(a); });

  return (
    <aside className={`cds-sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Header */}
      <div className="cds-sidebar-hdr" onClick={() => setCollapsed(c => !c)}>
        <span className="cds-hdr-icon">🧠</span>
        {!collapsed && <span className="cds-hdr-label">CDS Alerts</span>}
        <span className={`cds-hdr-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      {/* Collapsed micro-view */}
      {collapsed && (
        <div className="cds-collapsed-badges">
          {critCount > 0 && <div className="cds-micro-badge critical">{critCount}</div>}
          {warnCount > 0 && <div className="cds-micro-badge warning">{warnCount}</div>}
          {alerts.filter(a=>a.severity==="info").length > 0 && (
            <div className="cds-micro-badge info">{alerts.filter(a=>a.severity==="info").length}</div>
          )}
        </div>
      )}

      {/* Expanded body */}
      {!collapsed && (
        <div className="cds-body">
          {alerts.length === 0 ? (
            <div className="cds-clear">
              <div className="cds-clear-ico">✅</div>
              No active alerts
            </div>
          ) : (
            Object.entries(groups).map(([cat, items]) => (
              <div key={cat}>
                <div className="cds-cat-group-lbl">{cat}</div>
                {items.map(alert => (
                  <div
                    key={alert.id}
                    className={`cds-alert ${alert.severity}${expanded[alert.id] ? " expanded" : ""}`}
                    onClick={() => toggleAlert(alert.id)}
                  >
                    <div className={`cds-alert-cat ${alert.severity}`}>
                      <span>{SEV_ICON[alert.severity]}</span>
                      {alert.severity.toUpperCase()}
                      <span className="cds-alert-chevron" style={{ marginLeft:"auto" }}>
                        {expanded[alert.id] ? "▴" : "▾"}
                      </span>
                    </div>
                    <div className="cds-alert-title">{alert.title}</div>
                    <div className="cds-alert-detail">{alert.detail}</div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}