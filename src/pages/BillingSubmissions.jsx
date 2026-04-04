import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("bs-fonts")) return;
  const l = document.createElement("link"); l.id = "bs-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "bs-css";
  s.textContent = `*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}@keyframes bsFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}select option{background:#07101e}`;
  document.head.appendChild(s);
})();

const T = {
  bg: "#04080f", txt: "#f0f4ff", txt2: "#a5b8d8", txt3: "#5a7490", txt4: "#2e4060",
  border: "rgba(255,255,255,0.08)", borderHi: "rgba(255,255,255,0.16)",
  teal: "#2dd4bf", gold: "#fbbf24", coral: "#f87171", purple: "#a78bfa", green: "#34d399",
  glass1: "rgba(255,255,255,0.04)", glass2: "rgba(255,255,255,0.07)",
  shine: "inset 0 1px 0 rgba(255,255,255,0.11)",
};

const STATUS_COLORS = { draft: T.txt3, submitted: T.teal, approved: T.green, denied: T.coral };
const STATUS_ICONS = { draft: "📝", submitted: "📤", approved: "✅", denied: "❌" };

function AmbientBg() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", top: "-10%", left: "15%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: "40%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.09) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", bottom: "-5%", left: "30%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 65%)" }} />
    </div>
  );
}

function GPanel({ children, style = {}, accent }) {
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg, ${accent}0a, rgba(255,255,255,0.05))` : T.glass2,
      backdropFilter: "blur(32px) saturate(160%)", WebkitBackdropFilter: "blur(32px) saturate(160%)",
      border: `1px solid ${accent ? accent + "30" : T.border}`, borderRadius: 18, position: "relative", overflow: "hidden",
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), ${T.shine}`, ...style,
    }}>
      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function Chip({ label, color }) {
  const c = color || T.teal;
  return (
    <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: ".05em", padding: "2px 8px", borderRadius: 20, background: `${c}18`, border: `1px solid ${c}35`, color: c, whiteSpace: "nowrap" }}>{label}</span>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", color: T.txt, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", transition: "border-color .2s" }}
        onFocus={e => { e.target.style.borderColor = `${T.teal}55`; }}
        onBlur={e => { e.target.style.borderColor = T.border; }} />
    </div>
  );
}

function Toast({ msg, type }) {
  const color = type === "success" ? T.green : type === "error" ? T.coral : T.teal;
  return (
    <div style={{ padding: "10px 18px", borderRadius: 12, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(28px)", border: `1px solid ${color}30`, color, fontFamily: "'DM Sans',sans-serif", fontSize: 13, boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${color}20`, animation: "bsFade .25s ease", whiteSpace: "nowrap" }}>
      {msg}
    </div>
  );
}

export default function BillingSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [providerName, setProviderName] = useState("");
  const [dateOfService, setDateOfService] = useState(new Date().toISOString().split("T")[0]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");

  // Cart from AutoCoder localStorage
  const [cart, setCart] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("notrya_autocoder_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    base44.entities.BillingSubmission.list("-created_date", 50)
      .then(data => setSubmissions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3400);
  }, []);

  const handleSubmit = async () => {
    if (!providerName.trim() || !dateOfService || !patientId.trim()) {
      toast("Please fill in all required fields", "error"); return;
    }
    if (cart.length === 0) {
      toast("No codes in cart — go to AutoCoder to add codes first", "error"); return;
    }
    setSaving(true);
    const totalRvu = cart.filter(c => c.rvu).reduce((s, c) => s + (c.rvu || 0), 0);
    const icd10Count = cart.filter(c => c.type === "ICD-10").length;
    const cptCount = cart.filter(c => c.type === "CPT").length;
    try {
      const record = await base44.entities.BillingSubmission.create({
        provider_name: providerName.trim(),
        date_of_service: dateOfService,
        patient_id: patientId.trim(),
        codes: cart,
        total_rvu: Math.round(totalRvu * 100) / 100,
        icd10_count: icd10Count,
        cpt_count: cptCount,
        notes: notes.trim(),
        status: "submitted",
      });
      setSubmissions(p => [record, ...p]);
      toast(`Submission created — ${cart.length} codes`, "success");
      setPatientId(""); setNotes("");
      // Clear cart from localStorage
      localStorage.removeItem("notrya_autocoder_cart");
      setCart([]);
    } catch { toast("Failed to save submission", "error"); }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    await base44.entities.BillingSubmission.update(id, { status });
    setSubmissions(p => p.map(s => s.id === id ? { ...s, status } : s));
    toast(`Status updated to ${status}`, "success");
  };

  const exportSubmission = (sub) => {
    const lines = [
      `BILLING SUBMISSION EXPORT`,
      `Provider: ${sub.provider_name}`,
      `Date of Service: ${sub.date_of_service}`,
      `Patient ID: ${sub.patient_id}`,
      `Status: ${sub.status}`,
      `Submitted: ${new Date(sub.created_date).toLocaleDateString()}`,
      ``,
      `ICD-10 DIAGNOSES (${sub.icd10_count || 0}):`,
      ...(sub.codes || []).filter(c => c.type === "ICD-10").map(c => `  ${c.code}  ${c.desc}`),
      ``,
      `CPT CODES (${sub.cpt_count || 0}):`,
      ...(sub.codes || []).filter(c => c.type === "CPT").map(c => `  ${c.code}  ${c.desc}${c.rvu ? ` (${c.rvu} RVU)` : ""}`),
      ``,
      `Total wRVU: ${sub.total_rvu || 0}`,
      sub.notes ? `\nNotes: ${sub.notes}` : "",
    ].filter(l => l !== undefined).join("\n");
    navigator.clipboard.writeText(lines).then(() => toast("Copied to clipboard", "success"));
  };

  const filtered = filterStatus === "all" ? submissions : submissions.filter(s => s.status === filterStatus);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #04080f 0%, #07101e 50%, #04080f 100%)`, fontFamily: "'DM Sans',sans-serif", position: "relative", color: T.txt }}>
      <AmbientBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, animation: "bsFade .35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <button onClick={() => navigate("/AutoCoder")} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid rgba(255,255,255,0.12)`, background: "rgba(255,255,255,0.05)", color: T.txt3, backdropFilter: "blur(12px)" }}
              onMouseEnter={e => { e.currentTarget.style.color = T.txt2; e.currentTarget.style.borderColor = T.teal + "44"; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.txt3; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
              ← AutoCoder
            </button>
            <button onClick={() => navigate("/hub")} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid rgba(255,255,255,0.12)`, background: "rgba(255,255,255,0.05)", color: T.txt3, backdropFilter: "blur(12px)" }}
              onMouseEnter={e => { e.currentTarget.style.color = T.txt2; e.currentTarget.style.borderColor = T.purple + "44"; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.txt3; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
              ← Hub
            </button>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, background: `linear-gradient(90deg, #f0f4ff, ${T.teal} 60%, ${T.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, lineHeight: 1.15 }}>Billing Submissions</h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.txt3, margin: "6px 0 0" }}>Capture code cart · Track submissions · Export for billing</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr)", gap: 20, alignItems: "start" }}>

          {/* LEFT — Submission Form */}
          <div style={{ animation: "bsFade .4s ease" }}>
            <GPanel accent={T.teal} style={{ padding: "22px 24px" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "18px 18px 0 0", background: `linear-gradient(90deg,transparent,${T.teal}70,transparent)` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${T.teal}18`, border: `1px solid ${T.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📤</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: T.txt }}>New Submission</div>
                  <div style={{ fontSize: 11, color: T.txt3 }}>Attach cart codes to patient encounter</div>
                </div>
              </div>

              {/* Cart preview */}
              <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: 11, background: cart.length > 0 ? `${T.teal}08` : T.glass1, border: `1px solid ${cart.length > 0 ? T.teal + "30" : T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: cart.length > 0 ? 8 : 0 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: cart.length > 0 ? T.teal : T.txt4, textTransform: "uppercase", letterSpacing: 2 }}>AutoCoder Cart</span>
                  <Chip label={`${cart.length} codes`} color={cart.length > 0 ? T.teal : T.txt3} />
                </div>
                {cart.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.txt4, marginTop: 4 }}>No codes in cart — <span style={{ color: T.teal, cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/AutoCoder")}>go to AutoCoder</span> to add codes</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                    {cart.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: c.type === "ICD-10" ? T.teal : T.gold, minWidth: 66 }}>{c.code}</span>
                        <span style={{ color: T.txt3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.desc}</span>
                        <Chip label={c.type} color={c.type === "ICD-10" ? T.teal : T.gold} />
                      </div>
                    ))}
                  </div>
                )}
                {cart.filter(c => c.rvu).length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.purple }}>
                    Total wRVU: <strong>{cart.filter(c => c.rvu).reduce((s, c) => s + (c.rvu || 0), 0).toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <InputField label="Provider Name *" value={providerName} onChange={setProviderName} placeholder="Dr. Jane Smith" />
                <InputField label="Date of Service *" value={dateOfService} onChange={setDateOfService} type="date" />
                <InputField label="Patient ID / MRN *" value={patientId} onChange={setPatientId} placeholder="e.g. PT-4-471-8820" />
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Notes (optional)</div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Coding flags, payer notes, special circumstances…" rows={3}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", color: T.txt, fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: "none", resize: "vertical", lineHeight: 1.55 }}
                    onFocus={e => { e.target.style.borderColor = `${T.teal}55`; }}
                    onBlur={e => { e.target.style.borderColor = T.border; }} />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={saving}
                style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 12, cursor: saving ? "wait" : "pointer", fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, border: `1px solid ${T.teal}55`, background: saving ? `rgba(45,212,191,0.06)` : `linear-gradient(135deg,${T.teal}cc,${T.teal}88)`, color: saving ? T.txt3 : "#fff", transition: "all .2s", boxShadow: saving ? "none" : `0 4px 18px ${T.teal}30` }}>
                {saving ? "⏳ Saving…" : "📤 Submit for Billing"}
              </button>
            </GPanel>
          </div>

          {/* RIGHT — History */}
          <div style={{ animation: "bsFade .45s ease" }}>
            <GPanel style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${T.purple}18`, border: `1px solid ${T.purple}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: T.txt }}>Submission History</div>
                    <div style={{ fontSize: 11, color: T.txt3 }}>{submissions.length} total submission{submissions.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["all", "submitted", "approved", "denied", "draft"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all .15s", background: filterStatus === s ? `${STATUS_COLORS[s] || T.purple}18` : "rgba(255,255,255,0.04)", border: `1px solid ${filterStatus === s ? (STATUS_COLORS[s] || T.purple) + "45" : "rgba(255,255,255,0.09)"}`, color: filterStatus === s ? (STATUS_COLORS[s] || T.purple) : T.txt3 }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: T.txt3, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Loading submissions…</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>📋</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: T.txt2, marginBottom: 6 }}>No submissions yet</div>
                  <div style={{ fontSize: 12, color: T.txt3 }}>Fill in the form to create your first billing submission</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 580, overflowY: "auto", paddingRight: 4 }}>
                  {filtered.map(sub => {
                    const isOpen = expandedId === sub.id;
                    const statusColor = STATUS_COLORS[sub.status] || T.txt3;
                    return (
                      <div key={sub.id} style={{ borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${isOpen ? statusColor + "35" : T.border}`, overflow: "hidden", transition: "border-color .2s" }}>
                        {/* Row */}
                        <div onClick={() => setExpandedId(isOpen ? null : sub.id)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: `${statusColor}14`, border: `1px solid ${statusColor}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                            {STATUS_ICONS[sub.status] || "📝"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                              <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: T.txt }}>{sub.provider_name}</span>
                              <Chip label={sub.status} color={statusColor} />
                              {sub.icd10_count > 0 && <Chip label={`${sub.icd10_count} ICD-10`} color={T.teal} />}
                              {sub.cpt_count > 0 && <Chip label={`${sub.cpt_count} CPT`} color={T.gold} />}
                              {sub.total_rvu > 0 && <Chip label={`${sub.total_rvu} RVU`} color={T.purple} />}
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.txt3 }}>
                              {sub.patient_id} · {sub.date_of_service} · {new Date(sub.created_date).toLocaleDateString()}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: T.txt4, flexShrink: 0, transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                        </div>

                        {/* Expanded */}
                        {isOpen && (
                          <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}`, animation: "bsFade .2s ease" }}>
                            {/* Codes */}
                            {(sub.codes || []).length > 0 && (
                              <div style={{ marginTop: 12, marginBottom: 12 }}>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.txt4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 7 }}>Codes</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  {sub.codes.map((c, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: c.type === "ICD-10" ? T.teal : T.gold, minWidth: 70 }}>{c.code}</span>
                                      <span style={{ fontSize: 12, color: T.txt2, flex: 1 }}>{c.desc}</span>
                                      {c.rvu && <Chip label={`${c.rvu} RVU`} color={T.purple} />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {sub.notes && (
                              <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: `${T.gold}08`, border: `1px solid ${T.gold}25`, fontSize: 12, color: T.txt2, fontStyle: "italic" }}>
                                <span style={{ color: T.gold, fontWeight: 700, fontStyle: "normal", marginRight: 6 }}>Note:</span>{sub.notes}
                              </div>
                            )}
                            {/* Actions */}
                            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: T.txt4, fontFamily: "'JetBrains Mono',monospace", marginRight: 4 }}>Status:</span>
                              {["submitted", "approved", "denied", "draft"].map(s => (
                                <button key={s} onClick={() => updateStatus(sub.id, s)} disabled={sub.status === s}
                                  style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: sub.status === s ? "default" : "pointer", opacity: sub.status === s ? 0.4 : 1, background: `${STATUS_COLORS[s]}14`, border: `1px solid ${STATUS_COLORS[s]}30`, color: STATUS_COLORS[s] }}>
                                  {STATUS_ICONS[s]} {s}
                                </button>
                              ))}
                              <div style={{ marginLeft: "auto" }}>
                                <button onClick={() => exportSubmission(sub)}
                                  style={{ padding: "5px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`, color: T.txt2 }}>
                                  📋 Copy Export
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </GPanel>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div style={{ position: "fixed", bottom: 22, right: 22, display: "flex", flexDirection: "column", gap: 7, zIndex: 200 }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </div>
  );
}