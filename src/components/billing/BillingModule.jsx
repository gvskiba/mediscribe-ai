import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Eye, Plus } from "lucide-react";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
};

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontFamily: "Playfair Display,serif", fontSize: 20, fontWeight: 700, color: T.bright }}>
          {title}
        </span>
      </div>
      {subtitle && <p style={{ fontSize: 13, color: T.dim, lineHeight: 1.6, marginLeft: 34 }}>{subtitle}</p>}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    patientName: "",
    patientId: "",
    providerName: "",
    facility: "Emergency Department",
    cptCodes: [{ code: "", description: "", rvu: 0, units: 1 }],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("createInvoiceFromProcedure", data),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName || formData.cptCodes.some((c) => !c.code)) return;

    createMutation.mutate({
      procedureId: "manual",
      cptCodes: formData.cptCodes,
      patientName: formData.patientName,
      patientId: formData.patientId,
      providerName: formData.providerName,
      facility: formData.facility,
    });
  };

  const addCptCode = () => {
    setFormData({
      ...formData,
      cptCodes: [...formData.cptCodes, { code: "", description: "", rvu: 0, units: 1 }],
    });
  };

  const removeCptCode = (index) => {
    setFormData({
      ...formData,
      cptCodes: formData.cptCodes.filter((_, i) => i !== index),
    });
  };

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 13, padding: 24, marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 20 }}>Create Invoice</h3>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
              Patient Name *
            </label>
            <input
              type="text"
              required
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              style={{
                width: "100%",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                color: T.bright,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
              Patient ID
            </label>
            <input
              type="text"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              style={{
                width: "100%",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                color: T.bright,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
              Provider
            </label>
            <input
              type="text"
              value={formData.providerName}
              onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
              style={{
                width: "100%",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                color: T.bright,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5 }}>
              Facility
            </label>
            <input
              type="text"
              value={formData.facility}
              onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
              style={{
                width: "100%",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                color: T.bright,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.bright, marginBottom: 12 }}>CPT Codes</div>
          {formData.cptCodes.map((cpt, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 80px auto", gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="CPT Code"
                value={cpt.code}
                onChange={(e) => {
                  const updated = [...formData.cptCodes];
                  updated[idx].code = e.target.value;
                  setFormData({ ...formData, cptCodes: updated });
                }}
                style={{
                  background: T.edge,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  color: T.bright,
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
              <input
                type="text"
                placeholder="Description"
                value={cpt.description}
                onChange={(e) => {
                  const updated = [...formData.cptCodes];
                  updated[idx].description = e.target.value;
                  setFormData({ ...formData, cptCodes: updated });
                }}
                style={{
                  background: T.edge,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  color: T.bright,
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
              <input
                type="number"
                placeholder="RVU"
                value={cpt.rvu}
                onChange={(e) => {
                  const updated = [...formData.cptCodes];
                  updated[idx].rvu = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, cptCodes: updated });
                }}
                style={{
                  background: T.edge,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  color: T.bright,
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
              <input
                type="number"
                placeholder="Units"
                min="1"
                value={cpt.units}
                onChange={(e) => {
                  const updated = [...formData.cptCodes];
                  updated[idx].units = parseInt(e.target.value) || 1;
                  setFormData({ ...formData, cptCodes: updated });
                }}
                style={{
                  background: T.edge,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  color: T.bright,
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => removeCptCode(idx)}
                style={{ background: "transparent", border: "none", color: T.red, cursor: "pointer", fontSize: 12 }}>
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCptCode}
            style={{
              padding: "6px 12px",
              background: "rgba(0,212,188,0.1)",
              color: T.teal,
              border: `1px solid rgba(0,212,188,0.25)`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}>
            + Add CPT Code
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={createMutation.isPending}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg,#00d4bc,#00a896)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 6,
              border: "none",
              cursor: createMutation.isPending ? "not-allowed" : "pointer",
              opacity: createMutation.isPending ? 0.6 : 1,
            }}>
            {createMutation.isPending ? "Creating..." : "Create Invoice"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: T.dim,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BillingModule() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Invoice.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const exportCSV = (invoice) => {
    const rows = [
      ["Invoice Number", invoice.invoice_number],
      ["Patient", invoice.patient_name],
      ["Date", invoice.procedure_date],
      ["Provider", invoice.provider_name],
      ["Facility", invoice.facility],
      [""],
      ["CPT Code", "Description", "Units", "RVU", "Charge"],
      ...invoice.cpt_codes.map((c) => [c.code, c.description, c.units, c.rvu, c.base_charge]),
      [""],
      ["Total RVU", "", "", invoice.total_rvu],
      ["Total Charge", "", "", "", `$${invoice.total_charge.toFixed(2)}`],
    ];

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = (invoice) => {
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColors = {
    draft: { bg: "rgba(245,166,35,0.1)", fg: T.amber },
    submitted: { bg: "rgba(155,109,255,0.1)", fg: "#9b6dff" },
    paid: { bg: "rgba(46,204,113,0.1)", fg: T.green },
    denied: { bg: "rgba(255,92,108,0.1)", fg: T.red },
  };

  return (
    <div id="billing-module" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 40, marginBottom: 40 }}>
      <SectionHeader icon="💳" title="Billing Module" subtitle="Manage invoices and export billing records." />

      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg,#00d4bc,#00a896)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          <Plus size={16} /> Create Invoice
        </button>
      ) : (
        <CreateInvoiceModal onClose={() => setShowCreateForm(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["invoices"] })} />
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", color: T.dim, padding: "20px" }}>Loading invoices…</div>
      ) : invoices.length === 0 ? (
        <div style={{ textAlign: "center", color: T.dim, padding: "40px 20px", background: T.panel, borderRadius: 10 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>💳</div>
          <div style={{ fontWeight: 600, color: T.text, marginBottom: 6 }}>No invoices yet</div>
          <div style={{ fontSize: 12 }}>Create your first invoice to get started.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                gap: 16,
                alignItems: "center",
              }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>{invoice.invoice_number}</div>
                <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>{invoice.patient_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: T.text }}>
                  <strong>${invoice.total_charge.toFixed(2)}</strong> / {invoice.total_rvu} RVU
                </div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{invoice.procedure_date}</div>
              </div>
              <div>
                <select
                  value={invoice.status}
                  onChange={(e) => updateStatusMutation.mutate({ id: invoice.id, status: e.target.value })}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: statusColors[invoice.status]?.bg,
                    color: statusColors[invoice.status]?.fg,
                    border: `1px solid ${statusColors[invoice.status]?.fg}`,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="paid">Paid</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => exportCSV(invoice)}
                  title="Export as CSV"
                  style={{
                    padding: "6px 10px",
                    background: "rgba(0,212,188,0.1)",
                    color: T.teal,
                    border: `1px solid rgba(0,212,188,0.25)`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                  }}>
                  <Download size={14} />
                </button>
                <button
                  onClick={() => exportJSON(invoice)}
                  title="Export as JSON"
                  style={{
                    padding: "6px 10px",
                    background: "rgba(155,109,255,0.1)",
                    color: "#9b6dff",
                    border: "1px solid rgba(155,109,255,0.25)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                  }}>
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(invoice.id)}
                  title="Delete invoice"
                  style={{
                    padding: "6px 10px",
                    background: "rgba(255,92,108,0.1)",
                    color: T.red,
                    border: `1px solid rgba(255,92,108,0.25)`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                  }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}