import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bdhi: "#2a4f7a", blue: "#3b9eff", teal: "#00e5c0",
  gold: "#f5c842", coral: "#ff6b6b", orange: "#ff9f43", purple: "#9b6dff",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
};

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: T.gold,   bg: "rgba(245,200,66,.12)",  border: "rgba(245,200,66,.4)",  icon: "⏳" },
  active:    { label: "Active",    color: T.teal,   bg: "rgba(0,229,192,.1)",    border: "rgba(0,229,192,.4)",   icon: "▶️" },
  completed: { label: "Completed", color: T.blue,   bg: "rgba(59,158,255,.1)",   border: "rgba(59,158,255,.35)", icon: "✅" },
  cancelled: { label: "Cancelled", color: T.coral,  bg: "rgba(255,107,107,.1)",  border: "rgba(255,107,107,.35)",icon: "🚫" },
  on_hold:   { label: "On Hold",   color: T.orange, bg: "rgba(255,159,67,.1)",   border: "rgba(255,159,67,.35)", icon: "⏸️" },
};

const PRIORITY_CONFIG = {
  stat:    { label: "STAT",    color: T.coral,  bg: "rgba(255,107,107,.15)" },
  urgent:  { label: "Urgent",  color: T.orange, bg: "rgba(255,159,67,.12)" },
  routine: { label: "Routine", color: T.txt3,   bg: "rgba(74,106,138,.15)" },
};

const TYPE_ICONS = {
  lab: "🧬", imaging: "📷", medication: "💊", procedure: "✂️", consult: "📞", other: "📋",
};

const STATUS_TRANSITIONS = {
  pending:   ["active", "cancelled"],
  active:    ["completed", "on_hold", "cancelled"],
  on_hold:   ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

const FILTER_TABS = [
  { key: "all",       label: "All Orders" },
  { key: "pending",   label: "Pending" },
  { key: "active",    label: "Active" },
  { key: "on_hold",   label: "On Hold" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
.od-wrap { min-height: 100vh; background: #050f1e; color: #e8f0fe; font-family: 'DM Sans', sans-serif; padding: 24px; }
.od-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.od-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #e8f0fe; }
.od-subtitle { font-size: 12px; color: #4a6a8a; margin-top: 2px; }
.od-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
.od-stat-card { background: #0b1e36; border: 1px solid #1a3555; border-radius: 10px; padding: 12px 18px; display: flex; align-items: center; gap: 10px; min-width: 120px; }
.od-stat-icon { font-size: 20px; }
.od-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; line-height: 1; }
.od-stat-lbl { font-size: 10px; color: #4a6a8a; text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }
.od-controls { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.od-search { background: #0e2544; border: 1px solid #1a3555; border-radius: 8px; padding: 8px 14px; color: #e8f0fe; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; width: 240px; transition: border-color .2s; }
.od-search:focus { border-color: #2a4f7a; }
.od-search::placeholder { color: #2e4a6a; }
.od-select { background: #0e2544; border: 1px solid #1a3555; border-radius: 8px; padding: 8px 12px; color: #8aaccc; font-family: 'DM Sans', sans-serif; font-size: 12px; outline: none; cursor: pointer; }
.od-tabs { display: flex; gap: 4px; overflow-x: auto; background: #081628; border: 1px solid #1a3555; border-radius: 10px; padding: 4px; margin-bottom: 16px; }
.od-tab { padding: 7px 16px; border-radius: 7px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; white-space: nowrap; transition: all .2s; background: transparent; color: #4a6a8a; font-family: 'DM Sans', sans-serif; }
.od-tab:hover { background: #0e2544; color: #8aaccc; }
.od-tab.active { background: rgba(59,158,255,.12); border-color: rgba(59,158,255,.3); color: #3b9eff; font-weight: 600; }
.od-tab .count { font-family: 'JetBrains Mono', monospace; font-size: 10px; margin-left: 5px; background: rgba(59,158,255,.2); border-radius: 10px; padding: 1px 6px; }
.od-grid { display: grid; grid-template-columns: 1fr 340px; gap: 16px; }
.od-orders-list { display: flex; flex-direction: column; gap: 8px; }
.od-order-card { background: #081628; border: 1px solid #1a3555; border-radius: 10px; padding: 14px 16px; transition: border-color .2s; }
.od-order-card:hover { border-color: #2a4f7a; }
.od-order-top { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.od-order-icon { width: 34px; height: 34px; border-radius: 8px; background: #0e2544; border: 1px solid #1a3555; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.od-order-info { flex: 1; min-width: 0; }
.od-order-name { font-size: 14px; font-weight: 600; color: #e8f0fe; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.od-order-meta { font-size: 11px; color: #4a6a8a; margin-top: 2px; }
.od-order-badges { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
.od-badge { font-size: 10px; font-family: 'JetBrains Mono', monospace; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
.od-order-detail { font-size: 12px; color: #8aaccc; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(26,53,85,.5); line-height: 1.5; }
.od-order-actions { display: flex; gap: 6px; margin-top: 8px; }
.od-action-btn { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid; font-family: 'DM Sans', sans-serif; transition: all .2s; }
.od-action-btn:hover { filter: brightness(1.2); }
.od-empty { text-align: center; padding: 48px 20px; color: #4a6a8a; }
.od-empty-icon { font-size: 36px; margin-bottom: 10px; }
.od-sidebar { display: flex; flex-direction: column; gap: 12px; }
.od-patient-card { background: #081628; border: 1px solid #1a3555; border-radius: 10px; padding: 14px; }
.od-patient-name { font-size: 13px; font-weight: 700; color: #e8f0fe; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.od-patient-order-row { display: flex; align-items: center; gap: 7px; padding: 5px 0; border-bottom: 1px solid rgba(26,53,85,.4); font-size: 11px; color: #8aaccc; }
.od-patient-order-row:last-child { border-bottom: none; }
.od-section-label { font-size: 10px; color: #2e4a6a; text-transform: uppercase; letter-spacing: .07em; font-weight: 700; margin-bottom: 8px; }
.od-loading { display: flex; align-items: center; justify-content: center; padding: 60px; gap: 10px; color: #4a6a8a; font-size: 13px; }
.od-spinner { width: 20px; height: 20px; border: 2px solid #1a3555; border-top-color: #3b9eff; border-radius: 50%; animation: od-spin .8s linear infinite; }
@keyframes od-spin { to { transform: rotate(360deg); } }
.od-new-btn { background: #00e5c0; color: #050f1e; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: filter .2s; }
.od-new-btn:hover { filter: brightness(1.15); }
.od-modal-scrim { position: fixed; inset: 0; background: rgba(3,8,16,.7); backdrop-filter: blur(3px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.od-modal { background: #081628; border: 1px solid #1a3555; border-radius: 14px; padding: 24px; width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
.od-modal-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #e8f0fe; margin-bottom: 18px; }
.od-field { margin-bottom: 14px; }
.od-label { font-size: 10px; color: #4a6a8a; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; display: block; margin-bottom: 5px; }
.od-input { width: 100%; background: #0e2544; border: 1px solid #1a3555; border-radius: 7px; padding: 8px 12px; color: #e8f0fe; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color .2s; }
.od-input:focus { border-color: #2a4f7a; }
.od-input::placeholder { color: #2e4a6a; }
.od-modal-actions { display: flex; gap: 8px; margin-top: 18px; }
.od-cancel-btn { flex: 1; background: #0e2544; border: 1px solid #1a3555; border-radius: 7px; padding: 9px; color: #8aaccc; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; }
.od-submit-btn { flex: 2; background: #00e5c0; border: none; border-radius: 7px; padding: 9px; color: #050f1e; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: filter .2s; }
.od-submit-btn:hover { filter: brightness(1.1); }
`;

const BLANK_FORM = {
  order_name: "", order_type: "lab", status: "pending", priority: "routine",
  patient_name: "", patient_id: "", indication: "", details: "", ordered_by: "",
};

export default function OrderDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    const data = await base44.entities.ClinicalOrder.list("-created_date", 200);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const filtered = orders.filter(o => {
    const matchTab  = filterTab === "all" || o.status === filterTab;
    const matchType = typeFilter === "all" || o.order_type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (o.order_name||"").toLowerCase().includes(q) || (o.patient_name||"").toLowerCase().includes(q) || (o.indication||"").toLowerCase().includes(q);
    return matchTab && matchType && matchSearch;
  });

  const countByStatus = (s) => orders.filter(o => o.status === s).length;

  const updateStatus = async (order, newStatus) => {
    setUpdatingId(order.id);
    await base44.entities.ClinicalOrder.update(order.id, { status: newStatus });
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    setUpdatingId(null);
  };

  const handleCreate = async () => {
    if (!form.order_name || !form.order_type) return;
    setSaving(true);
    const created = await base44.entities.ClinicalOrder.create({
      ...form,
      ordered_at: new Date().toISOString(),
    });
    setOrders(prev => [created, ...prev]);
    setShowModal(false);
    setForm(BLANK_FORM);
    setSaving(false);
  };

  // Group active+pending orders by patient for sidebar
  const byPatient = {};
  orders.filter(o => o.status === "pending" || o.status === "active").forEach(o => {
    const key = o.patient_name || o.patient_id || "Unknown Patient";
    if (!byPatient[key]) byPatient[key] = [];
    byPatient[key].push(o);
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="od-wrap">
        {/* Header */}
        <div className="od-header">
          <div>
            <div className="od-title">🗂 Order Dashboard</div>
            <div className="od-subtitle">Centralized view of all clinical orders · Real-time status management</div>
          </div>
          <button className="od-new-btn" onClick={() => setShowModal(true)}>+ New Order</button>
        </div>

        {/* Stats */}
        <div className="od-stats">
          {[
            { key: "pending",   icon: "⏳", label: "Pending" },
            { key: "active",    icon: "▶️", label: "Active" },
            { key: "on_hold",   icon: "⏸️", label: "On Hold" },
            { key: "completed", icon: "✅", label: "Completed" },
            { key: "cancelled", icon: "🚫", label: "Cancelled" },
          ].map(s => {
            const cfg = STATUS_CONFIG[s.key];
            return (
              <div key={s.key} className="od-stat-card" style={{ borderColor: cfg.border, cursor: "pointer" }} onClick={() => setFilterTab(s.key)}>
                <span className="od-stat-icon">{s.icon}</span>
                <div>
                  <div className="od-stat-val" style={{ color: cfg.color }}>{countByStatus(s.key)}</div>
                  <div className="od-stat-lbl">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="od-controls">
          <input className="od-search" placeholder="🔍 Search orders, patients…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="od-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="lab">🧬 Lab</option>
            <option value="imaging">📷 Imaging</option>
            <option value="medication">💊 Medication</option>
            <option value="procedure">✂️ Procedure</option>
            <option value="consult">📞 Consult</option>
            <option value="other">📋 Other</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="od-tabs">
          {FILTER_TABS.map(t => (
            <button key={t.key} className={`od-tab${filterTab === t.key ? " active" : ""}`} onClick={() => setFilterTab(t.key)}>
              {t.label}
              <span className="count">{t.key === "all" ? orders.length : countByStatus(t.key)}</span>
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="od-grid">
          {/* Orders List */}
          <div className="od-orders-list">
            {loading ? (
              <div className="od-loading"><div className="od-spinner" /> Loading orders…</div>
            ) : filtered.length === 0 ? (
              <div className="od-empty">
                <div className="od-empty-icon">📭</div>
                <div>No orders found</div>
                <div style={{ fontSize: 12, marginTop: 6, color: T.txt4 }}>Try adjusting filters or create a new order</div>
              </div>
            ) : filtered.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const pc = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.routine;
              const transitions = STATUS_TRANSITIONS[order.status] || [];
              return (
                <div key={order.id} className="od-order-card">
                  <div className="od-order-top">
                    <div className="od-order-icon">{TYPE_ICONS[order.order_type] || "📋"}</div>
                    <div className="od-order-info">
                      <div className="od-order-name">{order.order_name}</div>
                      <div className="od-order-meta">
                        {order.patient_name && <span>👤 {order.patient_name} · </span>}
                        <span>{new Date(order.ordered_at || order.created_date).toLocaleString()}</span>
                        {order.ordered_by && <span> · Dr. {order.ordered_by}</span>}
                      </div>
                      <div className="od-order-badges">
                        <span className="od-badge" style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>{sc.icon} {sc.label}</span>
                        <span className="od-badge" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.color}30` }}>{pc.label}</span>
                        {order.order_type && <span className="od-badge" style={{ background: "rgba(155,109,255,.1)", color: T.purple, border: "1px solid rgba(155,109,255,.3)", textTransform: "capitalize" }}>{order.order_type}</span>}
                      </div>
                    </div>
                  </div>
                  {(order.indication || order.details) && (
                    <div className="od-order-detail">
                      {order.indication && <div><strong style={{ color: T.txt3 }}>Indication:</strong> {order.indication}</div>}
                      {order.details && <div style={{ marginTop: 3 }}><strong style={{ color: T.txt3 }}>Details:</strong> {order.details}</div>}
                    </div>
                  )}
                  {transitions.length > 0 && (
                    <div className="od-order-actions">
                      {updatingId === order.id ? (
                        <span style={{ fontSize: 12, color: T.txt3 }}>Updating…</span>
                      ) : transitions.map(next => {
                        const nc = STATUS_CONFIG[next];
                        return (
                          <button key={next} className="od-action-btn"
                            style={{ background: nc.bg, borderColor: nc.border, color: nc.color }}
                            onClick={() => updateStatus(order, next)}>
                            {nc.icon} Mark {nc.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar — Patient Summary */}
          <div className="od-sidebar">
            <div className="od-patient-card">
              <div className="od-section-label">📋 Upcoming Tasks by Patient</div>
              {Object.keys(byPatient).length === 0 ? (
                <div style={{ fontSize: 12, color: T.txt4, textAlign: "center", padding: "16px 0" }}>No active or pending orders</div>
              ) : Object.entries(byPatient).map(([name, pts]) => (
                <div key={name} style={{ marginBottom: 12 }}>
                  <div className="od-patient-name">
                    <span>👤</span>{name}
                    <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", background: "rgba(59,158,255,.15)", color: T.blue, border: "1px solid rgba(59,158,255,.3)", borderRadius: 20, padding: "1px 7px" }}>{pts.length}</span>
                  </div>
                  {pts.slice(0, 5).map(o => {
                    const sc = STATUS_CONFIG[o.status];
                    return (
                      <div key={o.id} className="od-patient-order-row">
                        <span>{TYPE_ICONS[o.order_type] || "📋"}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.order_name}</span>
                        <span style={{ fontSize: 9, color: sc.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, flexShrink: 0 }}>{sc.label}</span>
                      </div>
                    );
                  })}
                  {pts.length > 5 && <div style={{ fontSize: 10, color: T.txt4, paddingTop: 4 }}>+{pts.length - 5} more</div>}
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="od-patient-card">
              <div className="od-section-label">📊 Order Type Breakdown</div>
              {["lab","imaging","medication","procedure","consult","other"].map(type => {
                const count = orders.filter(o => o.order_type === type).length;
                if (!count) return null;
                const pct = Math.round((count / orders.length) * 100);
                return (
                  <div key={type} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.txt2, marginBottom: 3 }}>
                      <span>{TYPE_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T.txt }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: T.up, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: T.blue, borderRadius: 2, transition: "width .4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      {showModal && (
        <div className="od-modal-scrim" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="od-modal">
            <div className="od-modal-title">📋 New Clinical Order</div>
            {[
              { key: "order_name",   label: "Order Name *",      type: "text",   ph: "e.g. CBC, Chest X-Ray, Metoprolol…" },
              { key: "patient_name", label: "Patient Name",       type: "text",   ph: "Patient full name" },
              { key: "patient_id",   label: "Patient MRN / ID",   type: "text",   ph: "MRN or identifier" },
              { key: "ordered_by",   label: "Ordered By",         type: "text",   ph: "Physician name" },
              { key: "indication",   label: "Indication",         type: "text",   ph: "Clinical reason…" },
              { key: "details",      label: "Details / Dose / Instructions", type: "textarea", ph: "Additional details…" },
            ].map(f => (
              <div key={f.key} className="od-field">
                <label className="od-label">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea className="od-input" rows={3} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ resize: "vertical" }} />
                ) : (
                  <input className="od-input" type="text" placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { key: "order_type", label: "Type", opts: ["lab","imaging","medication","procedure","consult","other"] },
                { key: "status",     label: "Status", opts: ["pending","active","on_hold"] },
                { key: "priority",   label: "Priority", opts: ["stat","urgent","routine"] },
              ].map(s => (
                <div key={s.key} className="od-field" style={{ marginBottom: 0 }}>
                  <label className="od-label">{s.label}</label>
                  <select className="od-input" value={form[s.key]} onChange={e => setForm(p => ({ ...p, [s.key]: e.target.value }))}>
                    {s.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="od-modal-actions">
              <button className="od-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="od-submit-btn" onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "✓ Create Order"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}