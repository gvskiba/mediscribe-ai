import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Shared keyboard navigation hook for PE and ROS body-system panels.
 *
 * Controls:
 *   ↑ / ↓          — navigate findings within active system
 *   ← / →          — switch system (prev / next)
 *   Letter key      — jump to system by its `key` property
 *   Space           — toggle finding (null → normal → abnormal → null)
 *   Enter           — mark focused finding as normal (absent for ROS)
 *   X               — mark focused finding as abnormal (present for ROS)
 *   ⌘ + Enter       — mark entire active system normal
 *   ⌘ + Shift + N   — mark all systems normal
 *   Escape          — exit keyboard mode
 */
export function useBodySystemKeyboard({
  systems = [],
  onFindingAction,  // (action: 'toggle'|'normal'|'abnormal', sysId, findingId) => void
  onSystemNormal,   // (sysId) => void
  onAllNormal,      // () => void
}) {
  const [activeSystemIdx,  setActiveSystemIdx]  = useState(0);
  const [activeFindingIdx, setActiveFindingIdx] = useState(-1);
  const [isFocused,        setIsFocused]        = useState(false);
  const panelRef = useRef(null);

  const goToSystem = useCallback((letter) => {
    const idx = systems.findIndex(s => s.key?.toUpperCase() === letter.toUpperCase());
    if (idx >= 0) {
      setActiveSystemIdx(idx);
      setActiveFindingIdx(-1);
    }
  }, [systems]);

  const handleKeyDown = useCallback((e) => {
    if (!isFocused) return;

    const mod      = e.metaKey || e.ctrlKey;
    const sys      = systems[activeSystemIdx];
    const findings = sys?.findings || sys?.symptoms || [];
    const total    = findings.length;

    if (e.key === "Escape") {
      setIsFocused(false);
      setActiveFindingIdx(-1);
      panelRef.current?.blur();
      return;
    }

    if (mod && e.shiftKey && e.key.toUpperCase() === "N") {
      e.preventDefault();
      onAllNormal?.();
      return;
    }

    if (mod && e.key === "Enter") {
      e.preventDefault();
      onSystemNormal?.(sys?.id);
      return;
    }

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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveFindingIdx(i => Math.min(total - 1, i < 0 ? 0 : i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveFindingIdx(i => Math.max(0, i <= 0 ? 0 : i - 1));
      return;
    }

    if (activeFindingIdx >= 0 && activeFindingIdx < total) {
      const fid = findings[activeFindingIdx]?.id;
      if (fid) {
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
        if (e.key.toUpperCase() === "X" && !mod) {
          e.preventDefault();
          onFindingAction?.("abnormal", sys.id, fid);
          return;
        }
      }
    }

    // Single letter jump — only when not in an input/textarea
    if (
      e.key.length === 1 &&
      /^[A-Za-z]$/.test(e.key) &&
      !mod &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
    ) {
      goToSystem(e.key);
    }
  }, [isFocused, activeSystemIdx, activeFindingIdx, systems, onFindingAction, onSystemNormal, onAllNormal, goToSystem]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const panelProps = {
    ref: panelRef,
    tabIndex: 0,
    onFocus: () => setIsFocused(true),
    onBlur: (e) => {
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