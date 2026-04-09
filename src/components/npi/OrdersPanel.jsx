import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ─── TIER HELPERS ─────────────────────────────────────────────────────────────
const TIER_COLOR = { STAT: "var(--npi-coral)", URGENT: "var(--npi-orange)", ROUTINE: "var(--npi-txt4)" };
const TIER_BG    = { STAT: "rgba(255,107,107,.12)", URGENT: "rgba(255,159,67,.12)", ROUTINE: "rgba(255,255,255,.05)" };
const TIER_BD    = { STAT: "rgba(255,107,107,.28)", URGENT: "rgba(255,159,67,.28)", ROUTINE: "rgba(255,255,255,.1)"  };
const TIER_BAR   = { STAT: "var(--npi-coral)", URGENT: "var(--npi-orange)", ROUTINE: "rgba(255,255,255,.15)"         };

// ─── TIER BADGE ───────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  return (
    <span style={{
      display:"inline-flex", padding:"1px 7px", borderRadius:20, fontSize:9,
      fontWeight:700, letterSpacing:.5, whiteSpace:"nowrap",
      background: TIER_BG[tier]  || TIER_BG.ROUTINE,
      color:      TIER_COLOR[tier] || TIER_COLOR.ROUTINE,
      border:     `1px solid ${TIER_BD[tier] || TIER_BD.ROUTINE}`,
    }}>{tier}</span>
  );
}

// ─── ORDERS PANEL ─────────────────────────────────────────────────────────────
// Two-column layout: left (56%) = AI bundle + search + chips
//                   right (44%) = live order queue + sign CTA
//
// Design: urgency-first grouping (Kuperman 2003), confirm-over-browse (Bates et al.),
// vertical scanning, queue as primary workspace.
export default function OrdersPanel({ patientName, allergies, chiefComplaint, patientAge, patientSex }) {
  const [bundle,   setBundle]   = useState(null);
  const [checked,  setChecked]  = useState(new Set());
  const [queue,    setQueue]    = useState([]);
  const [signed,   setSigned]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [busySign, setBusySign] = useState(false);
  const [search,   setSearch]   = useState("");

  useEffect(() => { if (chiefComplaint) generateBundle(); }, []); // eslint-disable-line

  const generateBundle = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine clinical decision support AI.
Patient: ${patientName}, age ${patientAge || "unknown"}, sex ${patientSex || "unknown"}.
Chief complaint: "${chiefComplaint || "not specified"}".
Allergies: ${allergies.length ? allergies.join(", ") : "NKDA"}.
Generate an evidence-based ED order bundle. Return ONLY valid JSON:
{"diagnosis":"Brief working dx","confidence":85,"suppressed":["reason for any omitted items"],
"orders":[{"id":"o1","name":"Order name","detail":"Brief dose/detail","tier":"STAT","category":"lab"}]}
tier: STAT | URGENT | ROUTINE. category: lab|imaging|medication|procedure|consult|monitoring.
Include 6-10 orders. suppressed: strings explaining duplicate/omitted orders.`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnosis:  { type: "string" },
            confidence: { type: "number" },
            suppressed: { type: "array", items: { type: "string" } },
            orders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id:       { type: "string" }, name:     { type: "string" },
                  detail:   { type: "string" }, tier:     { type: "string" },
                  category: { type: "string" },
                },
              },
            },
          },
        },
      });
      const parsed = typeof result === "object" ? result : JSON.parse(String(result).replace(/```json|```/g, "").trim());
      setBundle(parsed);
      setChecked(new Set((parsed.orders || []).filter(o => o.tier === "STAT").map(o => o.id)));
    } catch { toast.error("Could not generate order bundle."); }
    finally { setLoading(false); }
  };

  const toggleCheck = (id) =>
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const addChecked = () => {
    if (!bundle) return;
    const toAdd = bundle.orders.filter(o => checked.has(o.id) && !queue.find(q => q.id === o.id));
    if (!toAdd.length) { toast.info("All checked orders already in queue."); return; }
    setQueue(prev => [...prev, ...toAdd]);
    setSigned(false);
    toast.success(`${toAdd.length} order${toAdd.length !== 1 ? "s" : ""} added to queue.`);
  };

  const addChip = (name) => {
    const id = `chip-${name}`;
    if (queue.find(q => q.id === id)) { toast.info(`${name} already in queue.`); return; }
    setQueue(prev => [...prev, { id, name, detail: "Manual add", tier: "ROUTINE", category: "lab" }]);
    setSigned(false);
    toast.success(`${name} added to queue.`);
  };

  const signQueue = () => {
    setBusySign(true);
    setTimeout(() => {
      setSigned(true);
      setBusySign(false);
      toast.success(`${queue.length} order${queue.length !== 1 ? "s" : ""} signed.`);
    }, 500);
  };

  const CHIPS = ["CBC", "CMP", "Coags", "Lactate", "BNP", "Lipase", "UA", "CXR", "CT head", "Bedside US"];
  const visibleChips = search ? CHIPS.filter(c => c.toLowerCase().includes(search.toLowerCase())) : CHIPS;
  const statN    = queue.filter(o => o.tier === "STAT").length;
  const urgentN  = queue.filter(o => o.tier === "URGENT").length;
  const routineN = queue.filter(o => o.tier === "ROUTINE").length;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"56% 44%", height:"100%", background:"var(--npi-bg)" }}>

      {/* ── LEFT: Build orders ─────────────────────────────────────────────── */}
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto", borderRight:"1px solid var(--npi-bd)" }}>

        {/* AI Bundle hero card */}
        <div style={{ background:"rgba(0,229,192,.03)", border:"1px solid rgba(0,229,192,.22)", borderRadius:10, padding:14 }}>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" }}>
            <span className="ord-ai-pill">✦ AI Bundle</span>
            {bundle && (
              <span style={{ fontSize:20, fontWeight:800, color:"var(--npi-teal)", fontFamily:"'JetBrains Mono',monospace" }}>
                {bundle.confidence}%
              </span>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--npi-txt)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {loading ? "Analyzing…" : bundle?.diagnosis || chiefComplaint || "Enter a chief complaint"}
              </div>
              {!loading && chiefComplaint && (
                <div style={{ fontSize:10, color:"var(--npi-txt4)", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{chiefComplaint}</div>
              )}
            </div>
            <button onClick={addChecked} disabled={!bundle || loading || !checked.size} className="ord-btn-teal">
              + Add checked ({checked.size})
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 0", color:"var(--npi-txt4)", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--npi-teal)", animation:"npi-ai-pulse 1.4s ease-in-out infinite" }} />
              Generating order bundle from chief complaint…
            </div>
          )}

          {/* No CC state */}
          {!loading && !bundle && (
            <div style={{ padding:"10px 0", color:"var(--npi-txt4)", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
              {chiefComplaint
                ? <button className="ord-btn-ghost" onClick={generateBundle}>✦ Generate bundle</button>
                : "Enter a chief complaint in Register to generate an AI order bundle."}
            </div>
          )}

          {/* Urgency-tiered order list */}
          {bundle && ["STAT", "URGENT", "ROUTINE"].map(tier => {
            const orders = bundle.orders.filter(o => o.tier === tier);
            if (!orders.length) return null;
            return (
              <div key={tier}>
                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"9px 0 5px" }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:TIER_COLOR[tier], fontFamily:"'JetBrains Mono',monospace" }}>{tier}</span>
                  <div style={{ flex:1, height:1, background:"rgba(255,255,255,.07)" }} />
                  <span style={{ fontSize:9, color:TIER_COLOR[tier], opacity:.5, fontFamily:"'JetBrains Mono',monospace" }}>{orders.length}</span>
                </div>
                {orders.map(ord => {
                  const on = checked.has(ord.id);
                  return (
                    <div key={ord.id} className="ord-row" onClick={() => toggleCheck(ord.id)}>
                      <div className={`ord-chk${on ? " on" : ""}`}>
                        {on && <span style={{ color:"var(--npi-bg)", fontSize:9, fontWeight:700, lineHeight:1 }}>✓</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:"var(--npi-txt)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ord.name}</div>
                        <div style={{ fontSize:10, color:"var(--npi-txt4)", marginTop:1 }}>{ord.detail}</div>
                      </div>
                      <TierBadge tier={ord.tier} />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Duplicate suppression note (gold) */}
          {bundle?.suppressed?.length > 0 && (
            <div style={{ background:"rgba(245,200,66,.07)", border:"1px solid rgba(245,200,66,.18)", borderRadius:7, padding:"7px 10px", fontSize:10, color:"rgba(245,200,66,.82)", display:"flex", gap:6, alignItems:"flex-start", marginTop:8 }}>
              <span style={{ flexShrink:0 }}>⚑</span>
              <span>{bundle.suppressed.join(" · ")}</span>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div>
          <div className="ord-slbl">Add orders</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:9, padding:"8px 11px" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.3"/><line x1="8.8" y1="8.8" x2="12" y2="12" stroke="rgba(255,255,255,.3)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search labs, meds, imaging, procedures, consults…"
              style={{ background:"none", border:"none", outline:"none", color:"var(--npi-txt)", fontSize:12, flex:1, fontFamily:"'DM Sans',sans-serif" }}
            />
            <span style={{ fontSize:10, color:"rgba(255,255,255,.25)", background:"rgba(255,255,255,.07)", padding:"2px 6px", borderRadius:4, fontFamily:"'JetBrains Mono',monospace" }}>⌘K</span>
          </div>
        </div>

        {/* Quick-add chips */}
        <div>
          <div className="ord-slbl">Common add-ons</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {visibleChips.map(c => (
              <button key={c} className="ord-chip" onClick={() => addChip(c)}>{c}</button>
            ))}
            {search && !visibleChips.length && (
              <button className="ord-chip" onClick={() => { addChip(search); setSearch(""); }}>+ Add "{search}"</button>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Order queue ─────────────────────────────────────────────── */}
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:2 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--npi-txt)", fontFamily:"'Playfair Display',serif" }}>Order queue</div>
            <div style={{ fontSize:11, color:"var(--npi-txt4)", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>
              {queue.length === 0 ? "No orders yet"
                : signed ? `${queue.length} orders · all signed`
                : `${queue.length} order${queue.length !== 1 ? "s" : ""} · ${queue.length} pending signature`}
            </div>
          </div>
          {queue.length > 0 && !signed && (
            <button className="ord-btn-teal" onClick={signQueue} disabled={busySign}>
              {busySign ? "Signing…" : `Sign all (${queue.length})`}
            </button>
          )}
        </div>

        {/* Stats row */}
        {queue.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { n: statN,    l: "STAT",    c: "var(--npi-coral)"  },
              { n: urgentN,  l: "Urgent",  c: "var(--npi-orange)" },
              { n: routineN, l: "Routine", c: "var(--npi-txt4)"   },
            ].map(s => (
              <div key={s.l} style={{ background:"rgba(255,255,255,.04)", borderRadius:7, padding:"8px 10px", textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:700, color:s.c, fontFamily:"'JetBrains Mono',monospace" }}>{s.n}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", marginTop:1, fontFamily:"'DM Sans',sans-serif" }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {queue.length === 0 && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:"var(--npi-txt4)", textAlign:"center", padding:32 }}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect x="5" y="9" width="28" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
              <rect x="5" y="17" width="22" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
              <rect x="5" y="25" width="26" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
            </svg>
            <div style={{ fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>No orders in queue</div>
            <div style={{ fontSize:10, fontFamily:"'DM Sans',sans-serif", maxWidth:200 }}>Check items in the bundle and click Add checked</div>
          </div>
        )}

        {/* Queue items */}
        {queue.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {queue.map(ord => (
              <div key={ord.id} style={{
                padding:"10px 12px",
                background: signed ? "rgba(0,229,192,.04)" : "rgba(255,255,255,.03)",
                border: `1px solid ${signed ? "rgba(0,229,192,.15)" : "rgba(255,255,255,.07)"}`,
                borderLeft: `3px solid ${TIER_BAR[ord.tier] || TIER_BAR.ROUTINE}`,
                borderRadius: "0 9px 9px 0",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--npi-txt)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ord.name}</span>
                  <TierBadge tier={ord.tier} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background: signed ? "var(--npi-teal)" : "var(--npi-orange)", flexShrink:0 }} />
                  <span style={{ fontSize:10, color: signed ? "rgba(0,229,192,.7)" : "rgba(255,149,64,.7)", fontFamily:"'DM Sans',sans-serif" }}>
                    {signed ? `Signed · ${ord.detail || "Active"}` : "Awaiting signature"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sign CTA */}
        {queue.length > 0 && !signed && (
          <div style={{ background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)", borderRadius:10, padding:14, textAlign:"center", marginTop:"auto" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginBottom:9, fontFamily:"'DM Sans',sans-serif" }}>
              {queue.length} order{queue.length !== 1 ? "s" : ""} awaiting your signature
            </div>
            <button onClick={signQueue} disabled={busySign}
              style={{ width:"100%", background:"var(--npi-teal)", color:"var(--npi-bg)", border:"none", borderRadius:8, padding:9, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", opacity: busySign ? .6 : 1 }}>
              {busySign ? "Signing…" : "Sign orders"}
            </button>
          </div>
        )}

        {/* Signed confirmation */}
        {signed && (
          <div style={{ background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)", borderRadius:10, padding:14, textAlign:"center", marginTop:"auto" }}>
            <div style={{ fontSize:12, color:"var(--npi-teal)", fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
              ✓ {queue.length} orders signed — all active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}