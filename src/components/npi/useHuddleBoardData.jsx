// useHuddleBoardData.js
// Custom hook that bridges the NPI encounter state into the shape expected
// by HuddleBoard's PatientSummary schema.
//
// Usage:
//   const { patients, updatePatient } = useHuddleBoardData();
//
// Reads from the NPI session store (base44 entities) and normalises each
// active encounter into the HuddleBoard PatientSummary shape:
//   { id, room, status, esiLevel, demo, cc, vitals,
//     disposition, lastAssessedAt, admitDecisionAt, doorTime,
//     pendingTasks, pendingOrders, provider, assignedNurse, flagged }
//
// Also exports helper `patientToHuddleRow` for one-off conversion.

import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

// ── Normalise a raw encounter record → HuddleBoard row ────────────────────────
export function patientToHuddleRow(enc) {
  if (!enc) return null;

  // Status: boarded if admit decision was made; waiting if no room yet; else roomed
  const status =
    enc.admitDecisionAt ? "boarded"
    : !enc.room         ? "waiting"
    : "roomed";

  // Pending orders — derived from orders array if present, otherwise from counters
  const pendingOrders = enc.pendingOrders || {
    labs:    (enc.orders || []).filter(o => o.category === "lab"     && o.status === "pending").length,
    meds:    (enc.orders || []).filter(o => o.category === "med"     && o.status === "pending").length,
    imaging: (enc.orders || []).filter(o => o.category === "imaging" && o.status === "pending").length,
  };

  // Pending tasks — accept either pre-shaped array or derive from checklist
  const pendingTasks = (enc.pendingTasks || []).map(t => ({
    id:    t.id    || t.label,
    label: t.label || t.id,
    type:  t.type  || "other",
  }));

  return {
    id:              enc.id,
    room:            enc.room || enc.registration?.room || null,
    status,
    esiLevel:        parseInt(enc.esiLevel || enc.triage?.esiLevel || 5),
    demo: {
      age: enc.demo?.age || enc.patient_age || null,
      sex: enc.demo?.sex || enc.patient_gender || null,
    },
    cc: {
      text: enc.cc?.text || enc.chief_complaint || null,
    },
    vitals: {
      hr:   enc.vitals?.hr   || null,
      bp:   enc.vitals?.bp   || null,
      spo2: enc.vitals?.spo2 || null,
      rr:   enc.vitals?.rr   || null,
      temp: enc.vitals?.temp || null,
    },
    disposition:     enc.disposition || "pending",
    lastAssessedAt:  enc.lastAssessedAt  ? new Date(enc.lastAssessedAt).getTime()  : null,
    admitDecisionAt: enc.admitDecisionAt ? new Date(enc.admitDecisionAt).getTime() : null,
    doorTime:        enc.doorTime        ? new Date(enc.doorTime).getTime()
                   : enc.created_date    ? new Date(enc.created_date).getTime()
                   : null,
    pendingTasks,
    pendingOrders,
    provider:        enc.provider || enc.attending || null,
    assignedNurse:   enc.assignedNurse || enc.nurse || null,
    flagged:         Boolean(enc.flagged),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useHuddleBoardData({
  pollIntervalMs = 30000,   // re-fetch every 30 seconds
  entityName     = "encounters", // base44 entity to read from
} = {}) {
  const [patients,    setPatients]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const timerRef = useRef(null);

  // ── Fetch + normalise ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      // Only fetch active encounters (not archived / discharged)
      const raw = await base44.entities[entityName].filter(
        { archived: false },
        "-created_date",
        100
      );
      const rows = (raw || [])
        .map(enc => patientToHuddleRow(enc))
        .filter(Boolean);
      setPatients(rows);
      setLastFetchAt(Date.now());
      setError(null);
    } catch (err) {
      setError(err?.message || "Failed to load encounter data");
    } finally {
      setLoading(false);
    }
  }, [entityName]);

  // ── Poll ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, pollIntervalMs);
    return () => clearInterval(timerRef.current);
  }, [fetchData, pollIntervalMs]);

  // ── Manual update (optimistic) ─────────────────────────────────────────────
  // Allows HuddleBoard to push a flag toggle or reassessment stamp back without
  // waiting for the next poll cycle.
  const updatePatient = useCallback((id, patch) => {
    setPatients(prev =>
      prev.map(p => p.id === id ? { ...p, ...patch } : p)
    );
  }, []);

  // ── Mark reassessed (stamps lastAssessedAt = now) ──────────────────────────
  const markReassessed = useCallback(async (id) => {
    const now = new Date().toISOString();
    updatePatient(id, { lastAssessedAt: Date.now() });
    try {
      await base44.entities[entityName].update(id, { lastAssessedAt: now });
    } catch {
      // silent — optimistic update already applied
    }
  }, [entityName, updatePatient]);

  // ── Set admit decision time ────────────────────────────────────────────────
  const markAdmitDecision = useCallback(async (id) => {
    const now = new Date().toISOString();
    updatePatient(id, { admitDecisionAt: Date.now(), status: "boarded", disposition: "boarded" });
    try {
      await base44.entities[entityName].update(id, { admitDecisionAt: now, disposition: "boarded" });
    } catch {
      // silent
    }
  }, [entityName, updatePatient]);

  return {
    patients,
    loading,
    error,
    lastFetchAt,
    refetch: fetchData,
    updatePatient,
    markReassessed,
    markAdmitDecision,
  };
}

export default useHuddleBoardData;