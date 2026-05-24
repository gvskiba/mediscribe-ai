import { JOB_STATUS } from "@/hooks/useAsyncFHIRJob";

const C = {
  teal: "#1D9E75", warn: "#E8A838", danger: "#E05252",
  border: "rgba(29,158,117,0.15)", muted: "#6B8BAE", dim: "#3D5A7A",
  white: "#E8EDF4",
};

export default function FHIRPollingProgress({ job, onRetry, onDismiss }) {
  const { status, progress, message, error } = job;

  const isActive  = status === JOB_STATUS.PENDING || status === JOB_STATUS.POLLING;
  const isError   = status === JOB_STATUS.ERROR;
  const isDone    = status === JOB_STATUS.COMPLETE;

  const barColor  = isError ? C.danger : isDone ? C.teal : C.teal;
  const iconColor = isError ? C.danger : isDone ? C.teal : C.warn;

  return (
    <div style={{
      background: "rgba(10,22,40,0.7)", border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "14px 16px",
    }}>
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 16, color: iconColor }}>
          {isError ? "⚠" : isDone ? "✓" : "⟳"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 2 }}>
            {isError ? "Query failed" : isDone ? "Records loaded" : "Async FHIR query in progress"}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {isError ? error : message}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
          color: isError ? C.danger : isDone ? C.teal : C.warn,
        }}>{progress}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          height: "100%", width: `${progress}%`, borderRadius: 2,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          transition: isActive ? "width 0.6s ease" : "none",
        }}/>
      </div>

      {/* Action row */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {isError && onRetry && (
          <div onClick={onRetry} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: C.teal, color: "#fff", cursor: "pointer",
          }}>Retry</div>
        )}
        {(isError || isDone) && onDismiss && (
          <div onClick={onDismiss} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: "transparent", color: C.muted,
            border: `1px solid ${C.border}`, cursor: "pointer",
          }}>Dismiss</div>
        )}
        {isActive && (
          <div style={{ fontSize: 11, color: C.dim, alignSelf: "center" }}>
            This runs async — no timeout risk
          </div>
        )}
      </div>
    </div>
  );
}