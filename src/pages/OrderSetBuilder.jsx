import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { G, CONDITIONS, CAT_CFG, PRI_CFG } from "../components/orderset/orderSetData";
import ConditionSidebar from "../components/orderset/ConditionSidebar";
import CategorySection from "../components/orderset/CategorySection";
import OrderSummaryPanel from "../components/orderset/OrderSummaryPanel";
import SignModal from "../components/orderset/SignModal";
import SaveTemplateModal from "../components/orderset/SaveTemplateModal";
import PatientContextPanel from "../components/orderset/PatientContextPanel";
import RecommendationEngine from "../components/orderset/RecommendationEngine";
import SmartSuggestionsPanel from "../components/orderset/SmartSuggestionsPanel";
import { getDependentOrders } from "../components/orderset/orderLogicEngine";
import { Search, X, CheckSquare, Square, Filter } from "lucide-react";

const FILTERS = ["all", "selected", "required", "modified", "high_alert"];

export default function OrderSetBuilder() {
  const [user, setUser] = useState(null);
  const [activeConditionId, setActiveConditionId] = useState("chf");
  const [orders, setOrders] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [showSignModal, setShowSignModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [signedSets, setSignedSets] = useState([]);
  const [patientData, setPatientData] = useState({});
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());

  // Load user + templates
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.InstitutionTemplate.filter({ is_active: true })
      .then(setCustomTemplates).catch(() => {});
    base44.entities.SignedOrderSet.list("-created_date", 20)
      .then(setSignedSets).catch(() => {});
  }, []);

  // Load condition orders when condition changes
  useEffect(() => {
    if (!activeConditionId) return;

    if (activeConditionId.startsWith("custom:")) {
      const templateId = activeConditionId.replace("custom:", "");
      const t = customTemplates.find(t => t.id === templateId);
      if (t) {
        setOrders(t.orders.map(o => ({ ...o, selected: o.selected ?? true, modified: false })));
      }
    } else {
      const cond = CONDITIONS[activeConditionId];
      if (cond) {
        setOrders(cond.orders.map(o => ({ ...o, selected: true, modified: false })));
        auditLog("loaded", { condition_id: activeConditionId, condition_name: cond.name });
      }
    }
    setSearch("");
    setFilterMode("all");
  }, [activeConditionId, customTemplates]);

  async function auditLog(action, details = {}) {
    if (!user) return;
    base44.entities.OrderSetAuditLog.create({
      action, user_id: user.id, details,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  function toast(msg, color = G.teal) {
    setToastMsg({ msg, color });
    setTimeout(() => setToastMsg(null), 3500);
  }

  function handleToggle(orderId) {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, selected: !o.selected } : o);
      // Check for smart suggestions when toggling ON
      const toggledOrder = updated.find(o => o.id === orderId);
      if (toggledOrder?.selected) {
        updateSmartSuggestions(updated);
      }
      return updated;
    });
  }

  function updateSmartSuggestions(currentOrders) {
    const selectedOrders = currentOrders.filter(o => o.selected);
    const suggestions = getDependentOrders(selectedOrders);
    
    // Filter out already selected orders and dismissed suggestions
    const existingIds = new Set(currentOrders.map(o => o.id));
    const newSuggestions = suggestions.filter(s => 
      !existingIds.has(s.id) && !dismissedSuggestions.has(s.id)
    );
    
    setSmartSuggestions(newSuggestions);
  }

  function handleEdit(orderId, newDetail) {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, detail: newDetail, modified: true } : o
    ));
    auditLog("modified", { order_id: orderId });
  }

  function handleRemove(orderId) {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }

  function handleAddCustom(cat, name, detail) {
    const newOrder = {
      id: `custom-${Date.now()}`, cat, name, detail,
      priority: "routine", required: false,
      selected: true, custom_added: true, modified: false,
    };
    setOrders(prev => {
      const updated = [...prev, newOrder];
      updateSmartSuggestions(updated);
      return updated;
    });
    auditLog("custom_added", { cat, name });
  }

  function handleAddSuggestion(suggestion) {
    const newOrder = {
      ...suggestion,
      id: `smart-${Date.now()}`,
      selected: true,
      smart_suggested: true,
      modified: false,
    };
    setOrders(prev => [...prev, newOrder]);
    setSmartSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    auditLog("smart_suggestion_added", { name: suggestion.name });
    toast(`✓ Added: ${suggestion.name}`, G.purple);
  }

  function handleDismissSuggestion(suggestionId) {
    setSmartSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  }

  function handleAddRecommendations(recommendedOrders) {
    const newOrders = recommendedOrders.map((r, i) => ({
      id: `rec-${Date.now()}-${i}`,
      ...r,
      selected: true,
      recommendation_based: true,
      modified: false,
    }));
    setOrders(prev => [...prev, ...newOrders]);
    auditLog("recommendations_added", { count: newOrders.length });
    toast(`✓ Added ${newOrders.length} recommended order${newOrders.length !== 1 ? "s" : ""}`, G.teal);
  }

  function handleSelectAll() {
    setOrders(prev => prev.map(o => ({ ...o, selected: true })));
  }
  function handleDeselectAll() {
    setOrders(prev => prev.map(o => ({ ...o, selected: false })));
  }

  async function handleAISuggest() {
    const cond = CONDITIONS[activeConditionId];
    if (!cond) return toast("Select a condition first", G.amber);
    setAiLoading(true);
    try {
      const existingNames = orders.map(o => `${o.name}: ${o.detail.slice(0, 80)}`).join("\n");
      const prompt = `You are Notrya AI, a clinical decision support assistant embedded in an order set builder.

A physician has loaded the '${cond.name}' order set.

Current orders already in the set:
${existingNames}

Based on ${cond.guideline}, suggest 3–5 additional orders that may be missing or should be considered.

Respond ONLY with valid JSON array (no markdown, no backticks):
[
  {
    "cat": "admit|vitals|diet|fluids|labs|meds|imaging|consults|nursing",
    "name": "Order name",
    "detail": "Full order detail with dose/frequency/rationale",
    "priority": "routine|urgent|stat",
    "guideline": "Guideline citation"
  }
]`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      let suggestions = [];
      try {
        const clean = (typeof result === "string" ? result : JSON.stringify(result))
          .replace(/```json|```/g, "").trim();
        suggestions = JSON.parse(clean);
      } catch {
        toast("AI response parsing error — retry", G.amber);
        setAiLoading(false);
        return;
      }
      const newOrders = suggestions.map((s, i) => ({
        id: `ai-${Date.now()}-${i}`,
        cat: s.cat || "nursing",
        name: s.name || "AI Suggested Order",
        detail: s.detail || "",
        priority: s.priority || "routine",
        guideline: s.guideline || "",
        required: false, selected: false,
        ai_suggested: true, modified: false,
      }));
      setOrders(prev => [...prev, ...newOrders]);
      auditLog("ai_suggested", { count: newOrders.length, condition: activeConditionId });
      toast(`✦ AI added ${newOrders.length} suggested orders`, G.purple);
    } catch {
      toast("AI service unavailable — please retry", G.red);
    }
    setAiLoading(false);
  }

  async function handleSign(signatureNote) {
    const selected = orders.filter(o => o.selected);
    const cond = CONDITIONS[activeConditionId];
    try {
      const record = await base44.entities.SignedOrderSet.create({
        condition_id: activeConditionId,
        condition_name: cond?.name || activeConditionId,
        signed_by: user?.id || "",
        signer_name: user?.full_name || "Physician",
        signed_at: new Date().toISOString(),
        signature_note: signatureNote,
        orders: selected,
        total_orders: selected.length,
        stat_count: selected.filter(o => o.priority === "stat").length,
        urgent_count: selected.filter(o => o.priority === "urgent").length,
        status: "signed",
      });
      setSignedSets(prev => [record, ...prev]);
      auditLog("signed", { condition_id: activeConditionId, total_orders: selected.length, signature_note: signatureNote });
      setShowSignModal(false);
      toast(`✦ ${selected.length} orders signed successfully`, G.teal);
    } catch {
      toast("Signing failed — please retry", G.red);
    }
  }

  async function handleSaveTemplate(name, subtitle) {
    const cond = CONDITIONS[activeConditionId];
    try {
      const t = await base44.entities.InstitutionTemplate.create({
        name, subtitle,
        icon: cond?.icon || "📋",
        specialty: cond?.specialty || "",
        guideline: cond?.guideline || "Institution Custom Template",
        acuity: cond?.acuity || "routine",
        tags: cond?.tags || [],
        orders: orders.filter(o => o.selected),
        base_condition_id: activeConditionId,
        is_active: true,
      });
      setCustomTemplates(prev => [...prev, t]);
      auditLog("template_saved", { name, condition_id: activeConditionId });
      toast(`Template "${name}" saved`, G.gold);
    } catch {
      toast("Save failed — please retry", G.red);
    }
  }

  // Active condition
  const activeCondition = useMemo(() => {
    if (!activeConditionId) return null;
    if (activeConditionId.startsWith("custom:")) {
      const id = activeConditionId.replace("custom:", "");
      return customTemplates.find(t => t.id === id) || null;
    }
    return CONDITIONS[activeConditionId] || null;
  }, [activeConditionId, customTemplates]);

  // Filtered + searched orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (filterMode === "selected")   filtered = filtered.filter(o => o.selected);
    if (filterMode === "required")   filtered = filtered.filter(o => o.required);
    if (filterMode === "modified")   filtered = filtered.filter(o => o.modified);
    if (filterMode === "high_alert") filtered = filtered.filter(o => o.high_alert);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o =>
        o.name?.toLowerCase().includes(q) || o.detail?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [orders, filterMode, search]);

  // Group by category
  const ordersByCategory = useMemo(() => {
    const groups = {};
    for (const o of filteredOrders) {
      if (!groups[o.cat]) groups[o.cat] = [];
      groups[o.cat].push(o);
    }
    return groups;
  }, [filteredOrders]);

  const catOrder = ["admit","vitals","diet","fluids","labs","meds","imaging","consults","nursing"];
  const totalSelected = orders.filter(o => o.selected).length;

  return (
    <div style={{
      fontFamily: "DM Sans, system-ui, sans-serif",
      background: G.navy, height: "100vh", color: G.text,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}`}</style>

      {/* ── Top Nav ── */}
      <div style={{
        height: 54, flexShrink: 0, background: `rgba(11,29,53,.95)`,
        borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center",
        padding: "0 20px", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: G.bright, lineHeight: 1.2 }}>Order Set Builder</div>
            <div style={{ fontSize: 10, color: G.dim }}>Evidence-Based Clinical Order Sets · Notrya AI</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Signed count */}
        {signedSets.length > 0 && (
          <div style={{ padding: "4px 12px", background: "rgba(0,212,188,.08)", border: `1px solid rgba(0,212,188,.25)`, borderRadius: 20, fontSize: 11, color: G.teal, fontWeight: 700 }}>
            ✓ {signedSets.length} signed set{signedSets.length !== 1 ? "s" : ""}
          </div>
        )}

        {activeCondition && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(22,45,79,.7)", border: `1px solid ${G.border}`, borderRadius: 9 }}>
            <span style={{ fontSize: 16 }}>{activeCondition.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.bright }}>{activeCondition.name}</div>
              <div style={{ fontSize: 10, color: G.dim }}>
                {totalSelected} selected · {PRI_CFG[activeCondition.acuity]?.label || ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Three-column body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* LEFT: Condition Sidebar */}
        <ConditionSidebar
          conditions={CONDITIONS}
          customTemplates={customTemplates}
          activeId={activeConditionId}
          onSelect={id => setActiveConditionId(id)}
        />

        {/* CENTER: Order Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Condition header */}
          {activeCondition && (
            <div style={{
              padding: "14px 20px 12px", flexShrink: 0,
              background: "rgba(11,29,53,.5)", borderBottom: `1px solid ${G.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 24 }}>{activeCondition.icon}</span>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: G.bright, fontFamily: "serif" }}>
                        {activeCondition.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: G.dim }}>{activeCondition.subtitle}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: G.purple, background: "rgba(155,109,255,.1)", border: "1px solid rgba(155,109,255,.25)", borderRadius: 6, padding: "2px 8px" }}>
                      📖 {activeCondition.guideline}
                    </span>
                    {(activeCondition.tags || []).map(tag => (
                      <span key={tag} style={{ fontSize: 9.5, color: G.muted, background: "rgba(74,114,153,.15)", border: `1px solid ${G.border}`, borderRadius: 20, padding: "1px 8px" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search + filter bar */}
          <div style={{
            padding: "10px 16px", flexShrink: 0,
            borderBottom: `1px solid rgba(30,58,95,.4)`,
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.dim }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders…"
                style={{
                  width: "100%", background: "rgba(11,29,53,.6)", border: `1px solid ${G.border}`,
                  borderRadius: 8, padding: "7px 10px 7px 30px", fontFamily: "inherit", fontSize: 12,
                  color: G.bright, outline: "none",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: G.dim }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter modes */}
            <div style={{ display: "flex", gap: 4 }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilterMode(f)}
                  style={{
                    padding: "5px 10px", borderRadius: 7, fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                    background: filterMode === f ? "rgba(0,212,188,.12)" : "transparent",
                    border: `1px solid ${filterMode === f ? "rgba(0,212,188,.35)" : G.border}`,
                    color: filterMode === f ? G.teal : G.dim, cursor: "pointer", transition: "all .1s",
                  }}
                >
                  {f.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Bulk buttons */}
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={handleSelectAll} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "transparent", border: `1px solid ${G.border}`, color: G.dim, fontSize: 11, cursor: "pointer" }}>
                <CheckSquare size={12} /> All
              </button>
              <button onClick={handleDeselectAll} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "transparent", border: `1px solid ${G.border}`, color: G.dim, fontSize: 11, cursor: "pointer" }}>
                <Square size={12} /> None
              </button>
            </div>

            {/* Stats pill */}
            <div style={{ padding: "4px 10px", background: "rgba(0,212,188,.06)", border: `1px solid rgba(0,212,188,.2)`, borderRadius: 20, fontSize: 11, color: G.teal, fontWeight: 700, whiteSpace: "nowrap" }}>
              {filteredOrders.length} showing · {totalSelected} selected
            </div>
          </div>

          {/* Order list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
            {/* Patient context + recommendations */}
            <PatientContextPanel onPatientDataChange={setPatientData} />
            <RecommendationEngine
              patientData={patientData}
              existingOrderNames={orders.map(o => o.name)}
              onAddRecommendations={handleAddRecommendations}
            />
            
            {/* Smart Suggestions Panel */}
            <SmartSuggestionsPanel
              suggestions={smartSuggestions}
              onAddSuggestion={handleAddSuggestion}
              onDismiss={handleDismissSuggestion}
            />

            {catOrder.map(cat => {
              const catOrders = ordersByCategory[cat];
              if (!catOrders?.length) return null;
              return (
                <CategorySection
                  key={cat}
                  cat={cat}
                  orders={catOrders}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onRemove={handleRemove}
                  onAddCustom={handleAddCustom}
                />
              );
            })}
            {filteredOrders.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: G.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: G.dim }}>No orders match your filter</div>
                <button onClick={() => { setSearch(""); setFilterMode("all"); }} style={{ marginTop: 10, background: "none", border: `1px solid ${G.border}`, borderRadius: 7, padding: "6px 14px", color: G.dim, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Summary Panel */}
        <OrderSummaryPanel
          condition={activeCondition}
          orders={orders}
          user={user}
          aiLoading={aiLoading}
          onAISuggest={handleAISuggest}
          onSignClick={() => setShowSignModal(true)}
          onSaveTemplate={() => setShowSaveModal(true)}
        />
      </div>

      {/* Modals */}
      {showSignModal && (
        <SignModal
          condition={activeCondition}
          orders={orders}
          user={user}
          onSign={handleSign}
          onClose={() => setShowSignModal(false)}
        />
      )}
      {showSaveModal && (
        <SaveTemplateModal
          condition={activeCondition}
          orders={orders}
          onSave={handleSaveTemplate}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          background: G.panel, border: `1px solid ${G.border}`,
          borderLeft: `3px solid ${toastMsg.color}`,
          borderRadius: 10, padding: "11px 16px",
          fontSize: 12.5, fontWeight: 600, color: G.bright,
          boxShadow: "0 8px 28px rgba(0,0,0,.45)",
        }}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}