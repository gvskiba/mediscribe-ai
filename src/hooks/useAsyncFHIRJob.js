import { useState, useRef, useCallback } from "react";

export const JOB_STATUS = {
  IDLE:     "idle",
  PENDING:  "pending",
  POLLING:  "polling",
  COMPLETE: "complete",
  ERROR:    "error",
};

const HG_SANDBOX = "https://sandbox.healthgorilla.com";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // 2 min max

export function useAsyncFHIRJob() {
  const [status,   setStatus]   = useState(JOB_STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [message,  setMessage]  = useState("");
  const [bundle,   setBundle]   = useState(null);
  const [error,    setError]    = useState(null);
  const pollRef  = useRef(null);
  const pollCount = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStatus(JOB_STATUS.IDLE);
    setProgress(0);
    setMessage("");
    setBundle(null);
    setError(null);
    pollCount.current = 0;
  }, [stopPolling]);

  const submit = useCallback(async (token, patientId) => {
    setStatus(JOB_STATUS.PENDING);
    setMessage("Submitting $everything request...");
    setProgress(5);

    // Submit async $everything job
    const submitRes = await fetch(
      `${HG_SANDBOX}/fhir/R4/Patient/${patientId}/$everything?_async=true`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/fhir+json", Prefer: "respond-async" } }
    );

    // 202 Accepted → check Content-Location for polling URL
    if (submitRes.status !== 202 && submitRes.status !== 200) {
      throw new Error(`$everything request failed: HTTP ${submitRes.status}`);
    }

    // If sync response (200), parse immediately
    if (submitRes.status === 200) {
      const syncBundle = await submitRes.json();
      setBundle(syncBundle);
      setStatus(JOB_STATUS.COMPLETE);
      setProgress(100);
      setMessage("Complete");
      return;
    }

    const pollUrl = submitRes.headers.get("Content-Location");
    if (!pollUrl) throw new Error("No Content-Location header in async response.");

    setStatus(JOB_STATUS.POLLING);
    setMessage("Polling for results...");
    setProgress(15);
    pollCount.current = 0;

    pollRef.current = setInterval(async () => {
      pollCount.current += 1;
      const pct = Math.min(15 + (pollCount.current / MAX_POLLS) * 80, 92);
      setProgress(Math.round(pct));

      if (pollCount.current >= MAX_POLLS) {
        stopPolling();
        setStatus(JOB_STATUS.ERROR);
        setError("Polling timed out after 2 minutes. Please retry.");
        return;
      }

      try {
        const pollRes = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/fhir+json" },
        });

        if (pollRes.status === 202) {
          // Still processing
          const retryAfter = pollRes.headers.get("Retry-After");
          setMessage(`Still processing… (${pollCount.current} polls, ~${retryAfter ?? "3"}s retry)`);
          return;
        }

        if (pollRes.status === 200) {
          stopPolling();
          const result = await pollRes.json();
          // Result may be an NDJSON manifest or a direct Bundle
          if (result.resourceType === "Bundle") {
            setBundle(result);
          } else if (result.output) {
            // Bulk export manifest — fetch each file and merge into a Bundle
            const entries = [];
            for (const out of result.output) {
              const fileRes = await fetch(out.url, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/fhir+ndjson" },
              });
              const text = await fileRes.text();
              text.trim().split("\n").filter(Boolean).forEach(line => {
                try { entries.push({ resource: JSON.parse(line) }); } catch {}
              });
            }
            setBundle({ resourceType: "Bundle", entry: entries });
          }
          setStatus(JOB_STATUS.COMPLETE);
          setProgress(100);
          setMessage("Complete");
          return;
        }

        // Any other status is an error
        stopPolling();
        setStatus(JOB_STATUS.ERROR);
        setError(`Unexpected poll status: HTTP ${pollRes.status}`);
      } catch (e) {
        stopPolling();
        setStatus(JOB_STATUS.ERROR);
        setError(`Poll error: ${e.message}`);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  return {
    status,
    progress,
    message,
    bundle,
    error,
    isActive: status === JOB_STATUS.PENDING || status === JOB_STATUS.POLLING,
    submit,
    reset,
  };
}