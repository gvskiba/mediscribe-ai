// NotryaPatientBar.jsx — Compact patient context strip for all hub pages
// Reads patientId from URL params, fetches Patient entity, renders one-line bar

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", red:"#ff4444",
};

function esiColor(esi) {
  return { 1: T.red, 2: T.orange, 3: T.gold, 4: "#3dffa0", 5: T.txt4 }[esi] || T.txt4;
}

function EsiBadge({ esi }) {
  const c = esiColor(esi);
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700,
      color: c, background: `${c}1a`, border: `1px solid ${c}44`,
      borderRadius: 4, padding: "1px 6px", flexShrink: 0,
    }}>
      ESI {esi}
    </span>
  );
}

function SmallBtn({ label, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "3px 10px", borderRadius: 6,
        background: `linear-gradient(135deg,${accent}22,${accent}0a)`,
        border: `1px solid ${accent}55`,
        color: accent,
        fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 10,
        cursor: "pointer", letterSpacing: 0.3, whiteSpace: "nowrap",
        transition: "opacity .15s", flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

export default function NotryaPatientBar() {
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patientId");
    if (!patientId) return;

    base44.entities.Patient.filter({ id: patientId }, "-created_date", 1)
      .then(results => {
        if (results && results.length > 0) setPatient(results[0]);
      })
      .catch(() => null);
  }, []);

  if (!patient) return null;

  const goTo = (page) => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patientId");
    window.location.href = `/${page}${patientId ? `?patientId=${patientId}` : ""}`;
  };

  const dot = (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4,
      flexShrink: 0, userSelect: "none",
    }}>·</span>
  );

  return (
    <div style={{
      height: 40, flexShrink: 0,
      background: "rgba(0,229,192,0.06)",
      borderBottom: "1px solid rgba(0,229,192,0.25)",
      display: "flex", alignItems: "center",
      padding: "0 20px", gap: 16,
    }}>
      {/* Room badge */}
      {patient.room && (
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(26,53,85,0.5)",
          borderRadius: 5, padding: "2px 8px", flexShrink: 0,
        }}>
          {patient.room}
        </span>
      )}

      {/* Name */}
      <span style={{
        fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 13,
        color: T.txt, flexShrink: 0, whiteSpace: "nowrap",
        maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {patient.name}
      </span>

      {/* Age / Sex */}
      {(patient.age || patient.sex) && (
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.txt3, flexShrink: 0,
        }}>
          {patient.age}{patient.sex}
        </span>
      )}

      {patient.cc && dot}

      {/* Chief Complaint */}
      {patient.cc && (
        <span style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
          color: T.gold, flexShrink: 0, whiteSpace: "nowrap",
          maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {patient.cc}
        </span>
      )}

      {patient.esi && dot}

      {/* ESI Badge */}
      {patient.esi && <EsiBadge esi={patient.esi} />}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Back to Census */}
      <SmallBtn
        label="← Census"
        accent={T.txt4}
        onClick={() => { window.location.href = "/CommandCenter"; }}
      />

      {/* Quick Note */}
      <SmallBtn
        label="Quick Note"
        accent={T.teal}
        onClick={() => goTo("QuickNote")}
      />
    </div>
  );
}