import { useEffect, useRef, useState, useCallback } from "react";
import {
  T, SURFACE_KEYS, isEditable, useCommandKeys,
  COLUMNS, PATIENTS, ORDER,
  AcuityBadge, StatusPill, AllergyChip,
} from "@/components/ccsKit";
import {
  SurfaceStub, OrdersSurface, NoteDock, TriageSurface,
  LabsSurface, ImagingSurface, AllergyDetailSurface, VitalsSurface, PatientSurface,
  HubTakeover,
} from "@/components/ccsSurfaces";

/*
  CommandCenterSpine - build 8: component split.

  The monolith is now three files: ccsKit (tokens/data/atoms/geometry), this
  page (the always-on banner + board frame and the orchestration), and
  ccsSurfaces (the overlays). Two behaviors are baked in here:

    1. Patient-freeze. Each stack entry captures the patient id at summon time;
       surfaces render that frozen patient, and board selection is locked while
       any surface is open. No wrong-patient drift.
    2. Consume-Esc contract. The escape handler offers Esc to the top surface
       first (surfaceEsc ref). If the surface consumes it (the hub backing out
       of a sub-view), the stack is not popped; otherwise it peels one layer.

  Base44-safe: straight quotes only, ASCII only, no Router/localStorage/form/alert.
*/

function PatientCard({ p, selected, onSelect, locked }) {
  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: "left",
        width: "100%",
        cursor: locked ? "default" : "pointer",
        background: selected ? T.cardHi : T.card,
        border: "1px solid " + (selected ? T.borderHi : T.border),
        boxShadow: selected ? "0 0 0 1px " + T.borderHi + ", 0 6px 18px rgba(0,0,0,0.35)" : "none",
        borderRadius: 10,
        padding: 11,
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AcuityBadge esi={p.esi} />
        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.teal, minWidth: 26 }}>{p.room}</span>
        <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.bright, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: T.sans, fontSize: 12, color: T.txt, flex: 1 }}>{p.cc}</span>
        <StatusPill status={p.status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.dim, fontFamily: T.mono, fontSize: 10.5 }}>
        <span>{p.age}{p.sex}</span>
        <span>MRN {p.mrn}</span>
        <span style={{ marginLeft: "auto", color: p.wait > 120 ? T.orange : T.faint }}>{p.wait}m</span>
      </div>
    </button>
  );
}

/* ---------------------------------------- banner: the always-on layer (never summoned, never dismissed) */

function Banner({ patient, clock }) {
  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 18px",
        background: T.panel,
        borderBottom: "1px solid " + T.border,
        zIndex: 50,
      }}
    >
      {/* mark + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(0,229,192,0.18), rgba(245,200,66,0.12))",
            border: "1px solid " + T.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: T.serif,
            fontWeight: 900,
            fontSize: 15,
            color: T.gold,
            letterSpacing: "-0.02em",
          }}
        >
          LX
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 15, color: T.bright, lineHeight: 1 }}>Command Center</div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginTop: 2 }}>SPINE / FRAME TEST</div>
        </div>
      </div>

      <div style={{ width: 1, height: 34, background: T.border, flexShrink: 0 }} />

      {/* selected patient identity */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
        {patient ? (
          <>
            <AcuityBadge esi={patient.esi} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 16, color: T.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {patient.name}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, padding: "1px 7px", borderRadius: 5, border: "1px solid " + T.border }}>
                  {patient.room}
                </span>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, marginTop: 2 }}>
                {patient.age}{patient.sex} &nbsp;/&nbsp; MRN {patient.mrn} &nbsp;/&nbsp; {patient.cc}
              </div>
            </div>
          </>
        ) : (
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>
            No patient selected. Click a card or use the arrow keys.
          </span>
        )}
      </div>

      {/* always-visible allergy chip - the Epic fix lives here */}
      {patient && <AllergyChip allergies={patient.allergies} />}

      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, flexShrink: 0, marginLeft: 4 }}>{clock}</span>
    </header>
  );
}

/* ---------------------------------------- board: three columns of cards ---------------------------------------- */

function Board({ selectedId, onSelect, locked }) {
  return (
    <main style={{ flex: 1, minHeight: 0, display: "flex", gap: 12, padding: 14, overflow: "hidden" }}>
      {COLUMNS.map((col) => {
        const rows = PATIENTS.filter((p) => p.col === col.id);
        return (
          <section
            key={col.id}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              background: T.panel,
              border: "1px solid " + T.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "11px 14px",
                borderBottom: "1px solid " + T.border,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 14, color: T.bright }}>{col.title}</span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal }}>{rows.length}</span>
              <span style={{ fontFamily: T.sans, fontSize: 11, color: T.dim, marginLeft: "auto" }}>{col.sub}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 10 }}>
              {rows.map((p) => (
                <PatientCard key={p.id} p={p} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} locked={locked} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

function HintBar() {
  const keys = ["o orders", "n note", "l labs", "i imaging", "a allergies", "h hub", "v vitals", "p patient", "t triage"];
  return (
    <footer
      style={{
        flexShrink: 0,
        height: 30,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 16px",
        background: T.panel,
        borderTop: "1px solid " + T.border,
        overflow: "hidden",
      }}
    >
      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, letterSpacing: "0.06em" }}>SUMMON</span>
      {keys.map((k) => (
        <span key={k} style={{ fontFamily: T.mono, fontSize: 10.5, color: T.dim, whiteSpace: "nowrap" }}>{k}</span>
      ))}
      <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>Esc back / Cmd or Ctrl + K palette</span>
    </footer>
  );
}

/* ---------------------------------------- page ---------------------------------------- */

export default function CommandCenterSpine() {
  const [selectedId, setSelectedId] = useState(ORDER[0] || null);
  const [stack, setStack] = useState([]);
  const [palette, setPalette] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setClock(hh + ":" + mm);
    }
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  const patient = PATIENTS.find((p) => p.id === selectedId) || null;

  // selectedRef lets summon read the live patient without re-creating itself.
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  // The top surface may register an Esc consumer here. If it returns true, the
  // Esc was handled internally (e.g. the hub backing out of a sub-view) and the
  // stack is NOT popped. Flat surfaces never register, so they close normally.
  const surfaceEsc = useRef(null);
  const bindEscape = useCallback((fn) => { surfaceEsc.current = fn; }, []);

  const locked = stack.length > 0; // board selection is frozen while a surface is open

  // summon freezes the patient onto the stack entry at open time.
  const summon = useCallback((id) => {
    setStack((s) => (s.length && s[s.length - 1].id === id ? s : s.concat({ id, patientId: selectedRef.current })));
  }, []);

  const navSelect = useCallback((dir) => {
    if (stack.length > 0) return; // arrows drive the board only when no surface is up
    setSelectedId((cur) => {
      const i = ORDER.indexOf(cur);
      const next = i < 0 ? 0 : Math.max(0, Math.min(ORDER.length - 1, i + dir));
      return ORDER[next];
    });
  }, [stack.length]);

  const escape = useCallback(() => {
    const el = typeof document !== "undefined" ? document.activeElement : null;
    if (isEditable(el)) {
      el.blur(); // focus guard: first Esc keeps your place in a field
      return;
    }
    if (palette) {
      setPalette(false);
      return;
    }
    if (surfaceEsc.current && surfaceEsc.current()) return; // top surface consumed the Esc
    setStack((s) => s.slice(0, -1)); // peel one layer back toward the board
  }, [palette]);

  useCommandKeys({
    onSurface: summon,
    onEscape: escape,
    onPalette: () => setPalette((v) => !v),
    onNav: navSelect,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, display: "flex", flexDirection: "column", fontFamily: T.sans }}>
      <Banner patient={patient} clock={clock} />
      <Board selectedId={selectedId} onSelect={(id) => { if (!locked) setSelectedId(id); }} locked={locked} />
      <HintBar />

      {/* summoned surfaces overlay the frame; each renders its FROZEN patient */}
      {stack.map((entry, depth) => {
        const id = entry.id;
        const isTop = depth === stack.length - 1;
        const fp = PATIENTS.find((p) => p.id === entry.patientId) || null;
        const close = () => setStack((s) => s.filter((_, idx) => idx !== depth));
        if (id === "orders") {
          return <OrdersSurface key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "note") {
          return <NoteDock key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "triage") {
          return <TriageSurface key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "labs") {
          return <LabsSurface key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "imaging") {
          return <ImagingSurface key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "allergies") {
          return <AllergyDetailSurface key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "vitals") {
          return <VitalsSurface key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "patient") {
          return <PatientSurface key={id + "-" + depth} patient={fp} depth={depth} onClose={close} />;
        }
        if (id === "hub") {
          return <HubTakeover key={id + "-" + depth} patient={fp} depth={depth} onClose={close} isTop={isTop} bindEscape={bindEscape} />;
        }
        return <SurfaceStub key={id + "-" + depth} id={id} patient={fp} depth={depth} onClose={close} />;
      })}

      {palette && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,15,30,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "14vh" }}>
          <div style={{ width: "min(560px, 90vw)", background: T.card, border: "1px solid " + T.borderHi, borderRadius: 14, boxShadow: "0 24px 70px rgba(0,0,0,0.6)", padding: 18 }}>
            <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright, marginBottom: 6 }}>Command Palette</div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, marginBottom: 12 }}>Stub. Esc to close.</div>
            <button onClick={() => setPalette(false)} style={{ cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.txt, fontFamily: T.sans, fontSize: 13, padding: "7px 14px" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}