import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Beaker, ImageIcon, ClipboardList, Edit3, X } from "lucide-react";
import { motion } from "framer-motion";

const typeConfig = {
  lab: { icon: Beaker, color: "teal", label: "Lab Panel", headerClass: "from-teal-500 to-cyan-500", badgeClass: "bg-teal-100 text-teal-800" },
  imaging: { icon: ImageIcon, color: "purple", label: "Imaging Study", headerClass: "from-purple-500 to-indigo-500", badgeClass: "bg-purple-100 text-purple-800" },
  action: { icon: ClipboardList, color: "violet", label: "Follow-up Action", headerClass: "from-violet-500 to-purple-500", badgeClass: "bg-violet-100 text-violet-800" },
};

function OrderItem({ item, type, checked, onToggle, editingId, editingText, onStartEdit, onEditChange, onSaveEdit }) {
  const cfg = typeConfig[type] || typeConfig.action;
  const Icon = cfg.icon;
  const isEditing = editingId === item.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
        checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Textarea
            autoFocus
            value={editingText}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSaveEdit(); } }}
            className="text-sm min-h-[60px] w-full"
          />
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            {item.detail && <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>}
            {item.rationale && <p className="text-xs text-slate-600 mt-1 italic">Rationale: {item.rationale}</p>}
          </>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {item.urgency && (
          <Badge className={`text-xs border ${
            item.urgency === "stat" ? "bg-red-100 text-red-700 border-red-300" :
            item.urgency === "urgent" ? "bg-amber-100 text-amber-700 border-amber-300" :
            "bg-slate-100 text-slate-600 border-slate-300"
          }`}>{item.urgency}</Badge>
        )}
        {!isEditing && (
          <button
            onClick={() => onStartEdit(item.id, item.label)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Edit before adding"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function OrderReviewModal({ open, onClose, orders, type, onConfirm }) {
  const [selected, setSelected] = useState(() => new Set(orders.map(o => o.id)));
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editedLabels, setEditedLabels] = useState({});
  const [noteText, setNoteText] = useState("");

  const cfg = typeConfig[type] || typeConfig.action;
  const Icon = cfg.icon;

  const toggleItem = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map(o => o.id)));
    }
  };

  const handleConfirm = () => {
    const confirmedOrders = orders
      .filter(o => selected.has(o.id))
      .map(o => ({ ...o, label: editedLabels[o.id] || o.label }));
    onConfirm(confirmedOrders, noteText.trim());
    onClose();
  };

  const previewText = orders
    .filter(o => selected.has(o.id))
    .map(o => `• ${editedLabels[o.id] || o.label}${o.detail ? ` (${o.detail})` : ""}`)
    .join("\n");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.headerClass} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            Review & Confirm {cfg.label}s
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Select all */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggleAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {selected.size === orders.length ? "Deselect all" : "Select all"}
            </button>
            <span className="text-xs text-slate-500">{selected.size}/{orders.length} selected</span>
          </div>

          {/* Order items */}
          <div className="space-y-2">
            {orders.map((order) => (
              <OrderItem
                key={order.id}
                item={order}
                type={type}
                checked={selected.has(order.id)}
                onToggle={() => toggleItem(order.id)}
                editingId={editingId}
                editingText={editingText}
                onStartEdit={(id, label) => { setEditingId(id); setEditingText(editedLabels[id] || label); }}
                onEditChange={setEditingText}
                onSaveEdit={() => {
                  if (editingText.trim()) {
                    setEditedLabels(prev => ({ ...prev, [editingId]: editingText.trim() }));
                  }
                  setEditingId(null);
                }}
              />
            ))}
          </div>

          {/* Optional note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Additional notes (optional)
            </label>
            <Textarea
              placeholder="Add any clinical notes or indications to include with these orders..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="text-sm min-h-[70px]"
            />
          </div>

          {/* Plan preview */}
          {previewText && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Will be added to Plan:</p>
              <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">{previewText}{noteText ? `\n\nNote: ${noteText}` : ""}</pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className={`flex-1 bg-gradient-to-r ${cfg.headerClass} hover:opacity-90 text-white gap-2`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Add {selected.size} to Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}