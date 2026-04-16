// useHuddleBoardData.js
// Service layer hook for HuddleBoard.
//
// Accepts a single Base44-specific dependency — patientFetcher — and handles
// everything else: polling, visibility-aware pausing, stale detection, error
// recovery, and mapping raw encounter data to the PatientSummary shape.
//
// Integration (two lines once Base44 query API is known):
//   import { useHuddleBoardData } from "@/components/npi/useHuddleBoardData";
//   const { patients, isLoading, fetchError, isStale, lastFetchedAt, refresh }
//     = useHuddleBoardData({
//         patientFetcher: () => base44.query("encounters").where("status","active").get(),
//       });
//   // Pass to board:
//   <HuddleBoard patients={patients} isLoading={isLoading} fetchError={fetchError}
//     isStale={isStale} lastFetchedAt={lastFetchedAt} onRefresh={refresh} />
//
// Without patientFetcher the hook returns empty patients (HuddleBoard falls
// back to MOCK_PATIENTS), making it safe to drop in before the query is wired.
//
// ── PatientSummary shape (what HuddleBoard expects) ────────────────────────────
// {
//   id             string    — unique encounter / patient ID
//   room           string    — bed/room identifier (null if waiting)
//   status         string    — "waiting" | "roomed" | "boarded"
//   esiLevel       number    — 1–5
//   demo           object    — { age, sex, firstName, lastName, mrn }
//   cc             object    — { text }
//   vitals         object    — { hr, bp, spo2, rr, temp }
//   disposition    string    — "pending"|"admit"|"boarded"|"obs"|"discharge"|"transfer"|"ama"|"lwbs"
//   lastAssessedAt ms|null   — timestamp of last documented reassessment
//   admitDecisionAt ms|null  — timestamp when admit decision was made
//   doorTime       ms|null   — timestamp of patient arrival
//   pendingTasks   array     — [{ id, label, type }]
//   pendingOrders  object    — { labs, meds, imaging }
//   provider       string    — attending physician name
//   assignedNurse  string    — assigned RN name
//   flagged        bool      — pre-flagged for huddle
// }
//
// ── Raw encounter field map (defaults, all overridable) ────────────────────────
// The default mapper reads these fields from the raw encounter object.
// Provide a custom fieldMap to adapt to your schema, or provide mapEncounter
// to replace the entire mapping function.
//
// Default field names (raw → PatientSummary):
//   id             : "id" | "encounterId" | "encounter_id"
//   room           : "room" | "bed" | "bedAssignment" | "location" | "roomNumber"
//   status         : "status" | "patientStatus" | "boardStatus"
//   esiLevel       : "esiLevel" | "esi" | "acuity" | "triageAcuity"
//   doorTime       : "doorTime" | "arrivalTime" | "createdAt" | "registrationTime"
//   lastAssessedAt : "lastAssessedAt" | "lastReassessment" | "lastChartActivity"
//   admitDecisionAt: "admitDecisionAt" | "admitDecision" | "admitTime"
//   provider       : "provider" | "attendingPhysician" | "physician" | "assignedProvider"
//   assignedNurse  : "assignedNurse" | "nurse" | "primaryNurse"
//   disposition    : "disposition" | "dispStatus" | "plannedDisposition"
//   flagged        : "flagged" | "huddleFlag" | "isFlagged"

import { useState, useEffect, useCallback, useRef } from "react";

// ── Default poll interval ─────────────────────────────────────────────────────
const DEFAULT_POLL_MS   = 30_000;  // 30 seconds
const STALE_MULTIPLIER  = 2.0;     // stale after 2× poll interval

// ── Field resolution helper ───────────────────────────────────────────────────
// Tries each candidate key in order, returns first defined non-null value.
function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj != null && k in obj && obj[k] != null) return obj[k];
  }
  return undefined;
}

// ── Timestamp normaliser ──────────────────────────────────────────────────────
// Accepts ms number, ISO string, or Date — returns ms number | null
function toMs(val) {
  if (!val) return null;
  if (typeof val === "number") return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}

// ── Status resolver ───────────────────────────────────────────────────────────
// Maps common raw status values to the three canonical statuses HuddleBoard uses
function resolveStatus(raw, room) {
  const s = (raw || "").toString().toLowerCase();
  if (s.includes("wait") || s.includes("triage") || s.includes("lobby") || !room)
    return "waiting";
  if (s.includes("board") || s.includes("admit_hold") || s.includes("holding"))
    return "boarded";
  return "roomed";
}

// ── Disposition normaliser ────────────────────────────────────────────────────
const DISP_MAP = {
  admit:"admit", admitted:"admit", admission:"admit",
  boarded:"boarded", holding:"boarded", boarding:"boarded",
  obs:"obs", observation:"obs",
  discharge:"discharge", dc:"discharge", discharged:"discharge",
  transfer:"transfer", transferred:"transfer",
  ama:"ama", lwbs:"lwbs",
};
function resolveDisposition(raw) {
  if (!raw) return "pending";
  return DISP_MAP[(raw||"").toString().toLowerCase().replace(/\s/g,"")] || "pending";
}

// ── Default encounter mapper ──────────────────────────────────────────────────
// Maps a raw encounter object → PatientSummary.
// fieldMap overrides individual field names; mapEncounter replaces entirely.
export function defaultMapEncounter(raw, fieldMap = {}) {
  const f = (defaultKeys) => {
    const override = fieldMap[defaultKeys[0]];
    const keys = override ? [override, ...defaultKeys] : defaultKeys;
    return pick(raw, ...keys);
  };

  // ── Identity ──────────────────────────────────────────────────────────────
  const id   = f(["id","encounterId","encounter_id"]) || String(Math.random());
  const room = f(["room","bed","bedAssignment","location","roomNumber"]) || null;

  // ── Status ────────────────────────────────────────────────────────────────
  const rawStatus  = f(["status","patientStatus","boardStatus"]);
  const status     = resolveStatus(rawStatus, room);

  // ── Acuity ────────────────────────────────────────────────────────────────
  const esiLevel   = parseInt(f(["esiLevel","esi","acuity","triageAcuity"])||"3", 10);

  // ── Demographics — handle nested or flat schemas ──────────────────────────
  const demoObj    = f(["demographics","patient","demo","patientInfo"]) || raw;
  const age        = parseInt(pick(demoObj,"age","patientAge","ageYears")||"", 10) || null;
  const sex        = pick(demoObj,"sex","gender","patientSex","patientGender") || "";
  const firstName  = pick(demoObj,"firstName","first_name","givenName","fname") || "";
  const lastName   = pick(demoObj,"lastName","last_name","familyName","lname") || "";
  const mrn        = pick(demoObj,"mrn","MRN","patientId","patient_id","medicalRecordNumber") || "";

  // ── Chief complaint ───────────────────────────────────────────────────────
  const ccText     = pick(raw,"chiefComplaint","cc","complaint","chief_complaint",
                           "chiefComplaintText","presentingComplaint") || "";

  // ── Vitals — handle nested or flat ───────────────────────────────────────
  const vObj  = f(["vitals","latestVitals","currentVitals","recentVitals"]) || raw;
  const hr    = String(pick(vObj,"hr","heartRate","pulse","heart_rate")||"");
  const bp    = pick(vObj,"bp","bloodPressure","blood_pressure","BP") || "";
  const spo2  = String(pick(vObj,"spo2","spO2","oxygenSaturation","o2sat")||"");
  const rr    = String(pick(vObj,"rr","respiratoryRate","resp_rate")||"");
  const temp  = String(pick(vObj,"temp","temperature","bodyTemp")|"");

  // ── Timestamps ────────────────────────────────────────────────────────────
  const doorTime        = toMs(f(["doorTime","arrivalTime","createdAt","registrationTime","arrival"]));
  const lastAssessedAt  = toMs(f(["lastAssessedAt","lastReassessment","lastChartActivity","reassessmentTime"]));
  const admitDecisionAt = toMs(f(["admitDecisionAt","admitDecision","admitTime","admitDecisionTime"]));

  // ── Disposition ───────────────────────────────────────────────────────────
  const disposition = resolveDisposition(f(["disposition","dispStatus","plannedDisposition","patientDisposition"]));

  // ── Provider / nurse ──────────────────────────────────────────────────────
  const provider     = pick(raw,"provider","attendingPhysician","physician","assignedProvider","attending","providerName") || "";
  const assignedNurse = pick(raw,"assignedNurse","nurse","primaryNurse","rn","nurseAssigned") || "";

  // ── Tasks / orders ────────────────────────────────────────────────────────
  // Tasks may be a nested array or a count object
  const rawTasks = f(["pendingTasks","tasks","openOrders","pendingItems"]);
  const pendingTasks = Array.isArray(rawTasks)
    ? rawTasks.map(t => ({
        id:    t.id || t.taskId || String(Math.random()),
        label: t.label || t.name || t.description || String(t),
        type:  t.type || t.taskType || "other",
      }))
    : [];

  const rawOrders = f(["pendingOrders","orders","orderCounts"]);
  const pendingOrders = {
    labs:    parseInt(pick(rawOrders||raw,"labs","labOrders","pendingLabs")||"0",10)    || 0,
    meds:    parseInt(pick(rawOrders||raw,"meds","medications","pendingMeds")||"0",10)  || 0,
    imaging: parseInt(pick(rawOrders||raw,"imaging","radiology","pendingImaging")||"0",10) || 0,
  };

  // ── Flagged ───────────────────────────────────────────────────────────────
  const flagged = Boolean(f(["flagged","huddleFlag","isFlagged","flag"]));

  return {
    id, room, status: resolveStatus(rawStatus, room),
    esiLevel: isNaN(esiLevel) ? 3 : Math.max(1, Math.min(5, esiLevel)),
    demo: { age, sex, firstName, lastName, mrn },
    cc: { text: ccText },
    vitals: { hr, bp, spo2, rr, temp },
    disposition: status === "boarded" ? "boarded" : disposition,
    lastAssessedAt, admitDecisionAt, doorTime,
    pendingTasks, pendingOrders,
    provider, assignedNurse, flagged,
  };
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useHuddleBoardData({
  patientFetcher = null,      // async () => RawEncounter[] — the only Base44-specific piece
  pollIntervalMs = DEFAULT_POLL_MS,
  fieldMap       = {},         // overrides for individual raw field names
  mapEncounter   = null,       // replace default mapper entirely: (raw) => PatientSummary
  onError        = null,       // (err: Error) => void — optional error callback
} = {}) {
  const [patients,       setPatients]       = useState([]);
  const [isLoading,      setIsLoading]      = useState(false);   // true only on first fetch (no data yet)
  const [isFetching,     setIsFetching]     = useState(false);   // true on any active request
  const [fetchError,     setFetchError]     = useState(null);    // string | null
  const [lastFetchedAt,  setLastFetchedAt]  = useState(null);    // ms timestamp | null
  const [isPaused,       setIsPaused]       = useState(false);

  const isPausedRef      = useRef(false);
  const hasDataRef       = useRef(false);
  const intervalRef      = useRef(null);
  const abortRef         = useRef(null);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const doFetch = useCallback(async () => {
    if (!patientFetcher || isPausedRef.current) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetching(true);
    if (!hasDataRef.current) setIsLoading(true);

    try {
      const raw = await patientFetcher({ signal: controller.signal });
      if (controller.signal.aborted) return;

      if (!Array.isArray(raw)) {
        throw new Error(`patientFetcher must return an array (received ${typeof raw})`);
      }

      const mapper = mapEncounter || ((r) => defaultMapEncounter(r, fieldMap));
      const mapped = raw.map(r => {
        try {
          return mapper(r);
        } catch (mapErr) {
          console.warn("[useHuddleBoardData] Mapper failed for encounter:", r, mapErr);
          return null;
        }
      }).filter(Boolean);

      setPatients(mapped);
      setFetchError(null);
      setLastFetchedAt(Date.now());
      hasDataRef.current = true;
    } catch (err) {
      if (err.name === "AbortError") return;
      const msg = err?.message || "Failed to fetch patient data";
      setFetchError(msg);
      onError?.(err);
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [patientFetcher, fieldMap, mapEncounter, onError]);

  // ── Start / stop polling ──────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    clearInterval(intervalRef.current);
    if (!patientFetcher) return;
    intervalRef.current = setInterval(doFetch, pollIntervalMs);
  }, [doFetch, patientFetcher, pollIntervalMs]);

  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  // ── Manual controls ───────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    doFetch();
  }, [doFetch]);

  const pausePolling = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
    stopPolling();
  }, [stopPolling]);

  const resumePolling = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
    doFetch();
    startPolling();
  }, [doFetch, startPolling]);

  // ── Mount: initial fetch + start polling ──────────────────────────────────
  useEffect(() => {
    if (!patientFetcher) return;
    doFetch();
    startPolling();
    return () => {
      stopPolling();
      abortRef.current?.abort();
    };
  }, [patientFetcher]); // intentionally omit doFetch/startPolling — stable refs

  // ── Page Visibility API — pause polling when tab is hidden ────────────────
  useEffect(() => {
    if (!patientFetcher) return;
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Re-fetch immediately on tab focus if data might be stale
        const staleMs = pollIntervalMs * STALE_MULTIPLIER;
        const msSinceFetch = lastFetchedAt ? Date.now() - lastFetchedAt : Infinity;
        if (!isPausedRef.current) {
          if (msSinceFetch > staleMs) doFetch();
          startPolling();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [patientFetcher, doFetch, startPolling, stopPolling, pollIntervalMs, lastFetchedAt]);

  // ── Window focus — re-fetch if stale ─────────────────────────────────────
  useEffect(() => {
    if (!patientFetcher) return;
    const onFocus = () => {
      const staleMs = pollIntervalMs * STALE_MULTIPLIER;
      const msSinceFetch = lastFetchedAt ? Date.now() - lastFetchedAt : Infinity;
      if (!isPausedRef.current && msSinceFetch > staleMs) {
        doFetch();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [patientFetcher, doFetch, pollIntervalMs, lastFetchedAt]);

  // ── Stale detection ───────────────────────────────────────────────────────
  const staleMs = pollIntervalMs * STALE_MULTIPLIER;
  const isStale = Boolean(
    patientFetcher &&
    lastFetchedAt &&
    (Date.now() - lastFetchedAt) > staleMs
  );

  return {
    patients,       // PatientSummary[] — pass directly to HuddleBoard
    isLoading,      // true only on first load (no data rendered yet)
    isFetching,     // true on any active request (including background polls)
    fetchError,     // string | null
    isStale,        // true when data is older than 2× poll interval
    lastFetchedAt,  // ms timestamp | null
    refresh,        // () => void — trigger immediate re-fetch
    pausePolling,   // () => void
    resumePolling,  // () => void
    isPaused,       // bool
  };
}

// ── Named exports for testing and direct use ─────────────────────────────────
export { defaultMapEncounter, resolveStatus, resolveDisposition, toMs };