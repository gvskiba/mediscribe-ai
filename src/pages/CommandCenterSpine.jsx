import { useEffect, useRef, useState, useCallback } from "react";
import PatientBanner from "@/components/PatientBanner";

/*
  CommandCenterSpine — upload #1: a wiring test harness, not the real UI.

  Purpose: prove the one-screen rule works before any styled surface exists.
  Press o n l i a h v p t to summon surfaces over the board. Press Esc to peel
  layers back to the bare board. Click the scratch field and type: letters must
  NOT fire commands, and the first Esc should only blur the field.

  Intentionally unstyled. The navy/teal/gold surfaces come later.
  Base44-safe: single file, default export, no Router/localStorage/form/alert.
*/

const SURFACE_KEYS = {
  o: "orders",
  n: "note",
  l: "labs",
  i: "imaging",
  a: "allergies",
  h: "hub",
  v: "vitals",
  p: "patient",
  t: "triage",
};

const SURFACE_META = {
  orders: { label: "Orders", tier: "half-sheet" },
  note: { label: "Note", tier: "dock" },
  labs: { label: "Labs", tier: "popover" },
  imaging: { label: "Imaging", tier: "popover" },
  allergies: { label: "Allergies detail", tier: "popover" },
  hub: { label: "Clinical Hub", tier: "takeover" },
  vitals: { label: "Vitals trend", tier: "popover" },
  patient: { label: "Patient info", tier: "popover" },
  triage: { label: "Nurse triage note", tier: "popover" },
};

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

function useCommandKeys({ onCommand, onEscape, onPalette, enabled = true }) {
  const cb = useRef({ onCommand, onEscape, onPalette });
  cb.current = { onCommand, onEscape, onPalette };

  useEffect(() => {
    if (!enabled) return undefined;
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (cb.current.onPalette) cb.current.onPalette();
        return;
      }
      if (e.key === "Escape") {
        if (isEditable(document.activeElement)) {
          document.activeElement.blur();
          return;
        }
        if (cb.current.onEscape) cb.current.onEscape();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(document.activeElement)) return;
      const surface = SURFACE_KEYS[e.key.toLowerCase()];
      if (surface) {
        e.preventDefault();
        if (cb.current.onCommand) cb.current.onCommand(surface, e);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

const S = {
  shell: { minHeight: "100vh", background: "#0b1220", color: "#e6edf6", fontFamily: "monospace", position: "relative" },
  banner: { display: "flex", gap: 16, alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #1e2a3d", background: "#0f1830", position: "sticky", top: 0, zIndex: 5 },
  chip: { padding: "3px 8px", borderRadius: 6, background: "#3a1d22", color: "#ffb4b4", fontSize: 12 },
  glance: { fontSize: 12, color: "#9fb3c8" },
  board: { padding: 20 },
  legend: { marginTop: 16, padding: 12, border: "1px solid #1e2a3d", borderRadius: 8, fontSize: 12, lineHeight: 1.8, color: "#9fb3c8" },
  scratch: { marginTop: 16, width: 280, padding: 8, background: "#0f1830", border: "1px solid #2a3a52", color: "#e6edf6", borderRadius: 6 },
  overlayBackdrop: { position: "fixed", inset: 0, background: "rgba(2,6,16,0.45)", zIndex: 10 },
  popover: { position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 360, padding: 18, background: "#101b33", border: "1px solid #2a3a52", borderRadius: 10, zIndex: 11 },
  halfsheet: { position: "fixed", top: 0, right: 0, bottom: 0, width: "42%", padding: 18, background: "#101b33", borderLeft: "1px solid #2a3a52", zIndex: 11 },
  dock: { position: "fixed", top: 0, right: 0, bottom: 0, width: 360, padding: 18, background: "#0f1830", borderLeft: "1px solid #2a3a52", zIndex: 9 },
  takeover: { position: "fixed", inset: 24, padding: 24, background: "#101b33", border: "1px solid #2a3a52", borderRadius: 12, zIndex: 12 },
  palette: { position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)", width: 460, padding: 16, background: "#101b33", border: "1px solid #2a3a52", borderRadius: 10, zIndex: 20 },
  closeBtn: { marginTop: 14, padding: "6px 10px", background: "#1b2740", color: "#e6edf6", border: "1px solid #2a3a52", borderRadius: 6, cursor: "pointer" },
  hint: { marginTop: 8, fontSize: 11, color: "#6b7f96" },
};

function SurfacePanel({ surface, onClose }) {
  const meta = SURFACE_META[surface] || { label: surface, tier: "popover" };
  const boxStyle =
    meta.tier === "dock" ? S.dock :
    meta.tier === "half-sheet" ? S.halfsheet :
    meta.tier === "takeover" ? S.takeover : S.popover;
  return (
    <div style={boxStyle}>
      <div style={{ fontSize: 16, marginBottom: 6 }}>{meta.label}</div>
      <div style={{ fontSize: 12, color: "#7fd1c9" }}>tier: {meta.tier}</div>
      <div style={S.hint}>Stub only. Esc returns to the board.</div>
      <button style={S.closeBtn} onClick={onClose}>Close</button>
    </div>
  );
}

export default function CommandCenterSpine() {
  const [activeSurface, setActiveSurface] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleCommand = useCallback((surface) => {
    if (surface === "note") {
      setNoteOpen((open) => !open);
      return;
    }
    setActiveSurface(surface);
  }, []);

  const returnToBoard = useCallback(() => {
    if (paletteOpen) { setPaletteOpen(false); return; }
    if (activeSurface) { setActiveSurface(null); return; }
    if (noteOpen) { setNoteOpen(false); return; }
  }, [paletteOpen, activeSurface, noteOpen]);

  useCommandKeys({
    onCommand: handleCommand,
    onEscape: returnToBoard,
    onPalette: () => setPaletteOpen(true),
  });

  const showBackdrop = !!activeSurface || paletteOpen;

  return (
    <div style={S.shell}>
      <PatientBanner embedded onOpenAllergies={() => setActiveSurface("allergies")} onOpenVitals={() => setActiveSurface("vitals")} />

      <div style={S.board}>
        <div style={{ fontSize: 18 }}>CommandCenter board (placeholder)</div>
        <input style={S.scratch} placeholder="scratch field - type here to test the focus guard" />
        <div style={S.legend}>
          o orders (half-sheet) &nbsp; n note (dock) &nbsp; l labs &nbsp; i imaging<br />
          a allergies &nbsp; v vitals &nbsp; p patient &nbsp; t triage (popovers)<br />
          h hub (takeover) &nbsp; Cmd/Ctrl+K palette &nbsp; Esc back to board
        </div>
      </div>

      {showBackdrop && <div style={S.overlayBackdrop} onClick={returnToBoard} />}

      {noteOpen && <SurfacePanel surface="note" onClose={() => setNoteOpen(false)} />}

      {activeSurface && <SurfacePanel surface={activeSurface} onClose={returnToBoard} />}

      {paletteOpen && (
        <div style={S.palette}>
          <div style={{ fontSize: 15, marginBottom: 8 }}>Command palette (stub)</div>
          <div style={S.hint}>Type to jump anywhere. Esc to close.</div>
          <button style={S.closeBtn} onClick={() => setPaletteOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}