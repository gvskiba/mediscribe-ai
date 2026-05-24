// useAsyncFHIRJob.js
// Manages the Health Gorilla async $everything lifecycle:
//   1. GET $everything with Prefer: respond-async
//   2. Extract Location header → poll URL
//   3. Poll with exponential backoff until 200 or timeout
// Place at: @/hooks/useAsyncFHIRJob.js

import { useState, useRef, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────
const HG_SANDBOX     = "https://sandbox.healthgorilla.com";
const MAX_POLL_MS    = 90_000;   // Hard timeout: 90 seconds
const INIT_INTERVAL  = 3_000;   // First poll after 3 s
const MAX_INTERVAL   = 15_000;  // Cap at 15 s per HG exponential backoff guidance
const BACKOFF_FACTOR = 1.5;

// ── Status vocabulary ──────────────────────────────────────────────────────────
export const JOB_STATUS = {
  IDLE:       "idle",
  SUBMITTING: "submitting",  // Initial request in flight
  POLLING:    "polling",     // Waiting on RequestResult URL
  COMPLETE:   "complete",    // 200 received, bundle available
  ERROR:      "error",       // Network / API error
  TIMEOUT:    "timeout",     // Exceeded MAX_POLL_MS
  CANCELLED:  "cancelled",   // User cancelled mid-poll
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAsyncFHIRJob() {
  const [status,    setStatus]    = useState(JOB_STATUS.IDLE);
  const [bundle,    setBundle]    = useState(null);
  const [pollUrl,   setPollUrl]   = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [log,       setLog]       = useState([]);
  const [error,     setError]     = useState(null);

  const cancelledRef = useRef(false);
  const startRef     = useRef(null);
  const timerRef     = useRef(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addLog = useCallback((msg, level = "info") => {
    setLog((prev) => [...prev, { ts: Date.now(), msg, level }]);
  }, []);

  const startTicker = useCallback(() => {
    timerRef.current = setInterval(
      () => setElapsedMs(Date.now() - startRef.current),
      400
    );
  }, []);

  const stopTicker = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── cancel ───────────────────────────────────────────────────────────────────
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stopTicker();
    setStatus(JOB_STATUS.CANCELLED);
    addLog("Query cancelled by user.", "warn");
  }, [stopTicker, addLog]);

  // ── reset ────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    cancelledRef.current = true;
    stopTicker();
    setStatus(JOB_STATUS.IDLE);
    setBundle(null);
    setPollUrl(null);
    setPollCount(0);
    setElapsedMs(0);
    setLog([]);
    setError(null);
  }, [stopTicker]);

  // ── submit ───────────────────────────────────────────────────────────────────
  const submit = useCallback(async (token, patientId) => {
    cancelledRef.current = false;
    startRef.current = Date.now();

    // Reset
    setStatus(JOB_STATUS.SUBMITTING);
    setBundle(null);
    setPollUrl(null);
    setPollCount(0);
    setElapsedMs(0);
    setLog([]);
    setError(null);
    startTicker();

    addLog(`Submitting async $everything — patient ID: ${patientId}`);

    try {
      // ── Step 1: kick off async job ───────────────────────────────────────────
      const kickoff = await fetch(
        `${HG_SANDBOX}/fhir/R4/Patient/${patientId}/$everything`,
        {
          method: "GET",
          headers: {
            Authorization:  `Bearer ${token}`,
            Accept:         "application/fhir+json",
            Prefer:         "respond-async",
          },
        }
      );

      if (cancelledRef.current) return;

      // HG may respond synchronously for small record sets — handle gracefully
      if (kickoff.status === 200) {
        const syncBundle = await kickoff.json();
        const count = syncBundle?.entry?.length ?? 0;
        addLog(`Synchronous response — ${count} resource(s) returned.`, "success");
        stopTicker();
        setElapsedMs(Date.now() - startRef.current);
        setBundle(syncBundle);
        setStatus(JOB_STATUS.COMPLETE);
        return;
      }

      if (kickoff.status !== 202) {
        const body = await kickoff.json().catch(() => ({}));
        const msg  = body?.issue?.[0]?.diagnostics ?? "Unknown server error";
        throw new Error(`Kickoff failed (HTTP ${kickoff.status}): ${msg}`);
      }

      // ── Step 2: extract poll URL ─────────────────────────────────────────────
      const location =
        kickoff.headers.get("location") ||
        kickoff.headers.get("content-location");

      if (!location) {
        throw new Error(
          "Server accepted request (202) but returned no Location header. " +
          "Verify your Health Gorilla credentials support async $everything."
        );
      }

      const jobId = location.split("/").pop();
      setPollUrl(location);
      setStatus(JOB_STATUS.POLLING);
      addLog(`Job accepted. ID: ${jobId}`);
      addLog("Polling Carequality & CommonWell networks...");

      // ── Step 3: poll with exponential backoff ────────────────────────────────
      let interval = INIT_INTERVAL;
      let count    = 0;

      while (true) {
        if (cancelledRef.current) return;

        const elapsed = Date.now() - startRef.current;
        if (elapsed >= MAX_POLL_MS) {
          throw new Error(
            "Query timed out after 90 s. The patient may have extensive records — " +
            "consider using the P360 async retrieval endpoint for large record sets."
          );
        }

        await delay(interval);
        if (cancelledRef.current) return;

        count++;
        setPollCount(count);

        const pollRes = await fetch(location, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept:        "application/fhir+json",
          },
        });

        if (cancelledRef.current) return;

        // ── Complete ───────────────────────────────────────────────────────────
        if (pollRes.status === 200) {
          const finalBundle = await pollRes.json();
          const rCount = finalBundle?.entry?.length ?? 0;
          stopTicker();
          setElapsedMs(Date.now() - startRef.current);
          addLog(
            `Complete — ${rCount} resource(s) received in ` +
              `${((Date.now() - startRef.current) / 1000).toFixed(1)} s.`,
            "success"
          );
          setBundle(finalBundle);
          setStatus(JOB_STATUS.COMPLETE);
          return;
        }

        // ── Still processing ───────────────────────────────────────────────────
        if (pollRes.status === 202) {
          const xProgress = pollRes.headers.get("x-progress");
          const retryAfter = parseInt(pollRes.headers.get("retry-after") ?? "0", 10) * 1000;

          addLog(
            `Poll #${count} — still processing` +
              (xProgress ? `: ${xProgress}` : "") +
              ` (${Math.round((Date.now() - startRef.current) / 1000)} s elapsed)`
          );

          // Respect Retry-After if server provides it, else use backoff
          interval = retryAfter > 0
            ? Math.min(retryAfter, MAX_INTERVAL)
            : Math.min(interval * BACKOFF_FACTOR, MAX_INTERVAL);
          continue;
        }

        // ── Error response ─────────────────────────────────────────────────────
        const errBody = await pollRes.json().catch(() => ({}));
        const errMsg  = errBody?.issue?.[0]?.diagnostics ?? "Poll returned unexpected status";
        throw new Error(`Poll error (HTTP ${pollRes.status}): ${errMsg}`);
      }
    } catch (e) {
      if (cancelledRef.current) return;
      stopTicker();
      setElapsedMs(Date.now() - startRef.current);
      const isTimeout = e.message.toLowerCase().includes("timed out");
      setStatus(isTimeout ? JOB_STATUS.TIMEOUT : JOB_STATUS.ERROR);
      setError(e.message);
      addLog(e.message, "error");
    }
  }, [addLog, startTicker, stopTicker]);

  return {
    // State
    status, bundle, pollUrl, pollCount, elapsedMs, log, error,
    // Derived
    isActive: [JOB_STATUS.SUBMITTING, JOB_STATUS.POLLING].includes(status),
    isDone:   status === JOB_STATUS.COMPLETE,
    isFailed: [JOB_STATUS.ERROR, JOB_STATUS.TIMEOUT].includes(status),
    progressPct: status === JOB_STATUS.COMPLETE
      ? 100
      : Math.round(95 * (1 - Math.exp(-elapsedMs / 28000))),
    // Actions
    submit, cancel, reset,
  };
}