import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Keyboard navigation hook for PE body-system grids.
 * 
 * Controls:
 *   ↑ / ↓        — navigate findings within active system
 *   ← / →        — switch system (prev / next)
 *   Letter key   — jump to system by its `key` property
 *   Space        — toggle finding (null → normal → abnormal → null)
 *   Enter        — mark focused finding as normal
 *   X            — mark focused finding as abnormal
 *   ⌘ + Enter    — mark entire system normal
 *   ⌘ + Shift + N — mark all systems normal
 *   Escape       — blur / exit keyboard mode
 */
export function useBodySystemKeyboard({
  systems = [],
  onFindingAction,   // (action: 'toggle'|'normal'|'abnormal', sysId, findingId) => void
  onSystemNormal,    // (sysId) => void
  onAllNormal,       // () => void
}) {
  const [activeSystemIdx,  setActiveSystemIdx]  = useState(0);
  const [activeFindingIdx, setActiveFindingIdx] = useState(-1);
  const [isFocused,        setIsFocused]        = useState(false);
  const panelRef = useRef(null);

  // Jump to system by letter key
  const goToSystem = useCallback((letter) => {
    const idx = systems.findIndex(s => s.key?.toUpperCase() === letter.toUpperCase());
    if (idx >= 0) {
      setActiveSystemIdx(idx);
      setActiveFindingIdx(-1);
    }
  }, [systems]);

  const handleKeyDown = useCallback((e) => {
    if (!isFocused) return;

    const mod  = e.metaKey || e.ctrlKey;
    const sys  = systems[activeSystemIdx];
    const findings = sys?.findings || [];
    const total    = findings.length;

    // Escape → exit focus
    if (e.key === "Escape") {
      setIsFocused(false);
      setActiveFindingIdx(-1);
      panelRef.current?.blur();
      return;
    }

    // ⌘⇧N → all normal
    if (mod && e.shiftKey && e.key.toUpperCase() === "N") {
      e.preventDefault();
      onAllNormal?.();
      return;
    }

    // ⌘ + Enter → mark current system normal
    if (mod && e.key === "Enter") {
      e.preventDefault();
      onSystemNormal?.(sys?.id);
      return;
    }

    // ← / → → switch system
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveSystemIdx(i => Math.max(0, i - 1));
      setActiveFindingIdx(-1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveSystemIdx(i => Math.min(systems.length - 1, i + 1));
      setActiveFindingIdx(-1);
      return;
    }

    // ↑ / ↓ → navigate findings
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveFindingIdx(i => Math.min(total - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveFindingIdx(i => Math.max(0, i > 0 ? i - 1 : 0));
      return;
    }

    // Actions on focused finding
    if (activeFindingIdx >= 0 && activeFindingIdx < total) {
      const fid = findings[activeFindingIdx]?.id;
      if (!fid) return;

      if (e.key === " ") {
        e.preventDefault();
        onFindingAction?.("toggle", sys.id, fid);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onFindingAction?.("normal", sys.id, fid);
        return;
      }
      if (e.key.toUpperCase() === "X") {
        e.preventDefault();
        onFindingAction?.("abnormal", sys.id, fid);
        return;
      }
    }

    // Single letter → jump to system (only when not typing in textarea/input)
    if (
      e.key.length === 1 &&
      /^[A-Za-z]$/.test(e.key) &&
      !mod &&
      !["INPUT", "TEXTAREA"].includes(e.target.tagName)
    ) {
      goToSystem(e.key);
    }
  }, [isFocused, activeSystemIdx, activeFindingIdx, systems, onFindingAction, onSystemNormal, onAllNormal, goToSystem]);

  // Attach listener to window while focused
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const panelProps = {
    ref: panelRef,
    tabIndex: 0,
    onFocus: () => setIsFocused(true),
    onBlur:  (e) => {
      // Stay focused if focus moves to a child element
      if (!panelRef.current?.contains(e.relatedTarget)) {
        setIsFocused(false);
        setActiveFindingIdx(-1);
      }
    },
    style: { outline: "none" },
  };

  return {
    activeSystemIdx,
    setActiveSystemIdx,
    activeFindingIdx,
    setActiveFindingIdx,
    isFocused,
    panelProps,
    goToSystem,
  };
}