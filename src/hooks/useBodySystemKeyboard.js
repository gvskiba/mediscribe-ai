import { useState, useCallback, useRef } from 'react';

/**
 * useBodySystemKeyboard
 * Shared keyboard navigation hook for PETab and ROSTab.
 *
 * Keyboard map (when panel is focused):
 *   ↑ / ↓              Navigate findings within the active system
 *   ← / →              Jump to prev / next VISIBLE system
 *   Letter key          Jump to system by shortcut key (visible systems only)
 *   1–9                 Directly toggle the Nth finding in the current system
 *   Space               Toggle focused finding: null → normal → abnormal → null
 *   Enter               Mark focused finding normal, or whole system normal if none focused
 *   X                   Mark focused finding abnormal / present
 *   Tab / Shift+Tab     Next / previous finding
 *   ⌘/Ctrl + Enter      Mark whole system normal regardless of focus
 *   ⌘/Ctrl + Shift + N  Mark ALL systems normal/negative
 *   ⌘/Ctrl + F          Toggle focused ↔ full mode
 *   ⌘/Ctrl + R          Trigger remainder negative/normal action
 *   ⌘/Ctrl + V          Switch to visual mode (PE only)
 *   Escape              Deselect focused finding → blur panel
 */
export function useBodySystemKeyboard({
  systems,
  visibleSystems,   // optional — filtered subset shown in focused mode
  onFindingAction,  // (action, systemId, findingId) => void
  onSystemNormal,   // (systemId) => void
  onAllNormal,      // () => void
  onModeToggle,     // () => void  — ⌘F
  onRemainder,      // () => void  — ⌘R
  onVisualMode,     // () => void  — ⌘V (PE only)
}) {
  const [activeSystemIdx,  setActiveSystemIdx]  = useState(0);
  const [activeFindingIdx, setActiveFindingIdx] = useState(-1);
  const [isFocused,        setIsFocused]        = useState(false);
  const panelRef = useRef(null);

  // Navigate to a system by its index in the FULL systems array
  const goToSystem = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, systems.length - 1));
    setActiveSystemIdx(clamped);
    setActiveFindingIdx(-1);
  }, [systems.length]);

  // Navigate within the visible set (←/→)
  // Resolves back to the full-array index so activeSystemIdx stays canonical.
  const navigateVisible = useCallback((direction) => {
    const nav = visibleSystems || systems;
    const currentId = systems[activeSystemIdx]?.id;
    const navIdx = nav.findIndex(s => s.id === currentId);
    const nextNavIdx = navIdx + direction;
    if (nextNavIdx < 0 || nextNavIdx >= nav.length) return;
    const targetIdx = systems.findIndex(s => s.id === nav[nextNavIdx].id);
    if (targetIdx >= 0) { setActiveSystemIdx(targetIdx); setActiveFindingIdx(-1); }
  }, [activeSystemIdx, systems, visibleSystems]);

  const handleKeyDown = useCallback((e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    const mod   = e.metaKey || e.ctrlKey;
    const sys   = systems[activeSystemIdx];
    const items = sys?.findings || sys?.symptoms || [];
    const hasFinding = activeFindingIdx >= 0 && activeFindingIdx < items.length;

    // ── Mod shortcuts ─────────────────────────────────────────────────────────
    if (mod) {
      if (e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); onAllNormal?.();            return; }
      if (e.key === 'Enter')                          { e.preventDefault(); onSystemNormal?.(sys?.id); return; }
      if (e.key === 'f' || e.key === 'F')             { e.preventDefault(); onModeToggle?.();          return; }
      if (e.key === 'r' || e.key === 'R')             { e.preventDefault(); onRemainder?.();           return; }
      if (e.key === 'v' || e.key === 'V')             { e.preventDefault(); onVisualMode?.();          return; }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); navigateVisible(-1); break;
      case 'ArrowRight': e.preventDefault(); navigateVisible(1);  break;

      case 'ArrowUp':
        e.preventDefault();
        if (items.length > 0) setActiveFindingIdx(i => i <= 0 ? 0 : i - 1);
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (items.length > 0) setActiveFindingIdx(i => Math.min(items.length - 1, i < 0 ? 0 : i + 1));
        break;

      case 'Tab':
        if (items.length > 0) {
          e.preventDefault();
          setActiveFindingIdx(i => e.shiftKey
            ? Math.max(0, i <= 0 ? 0 : i - 1)
            : Math.min(items.length - 1, i < 0 ? 0 : i + 1));
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (hasFinding) { setActiveFindingIdx(-1); }
        else            { setIsFocused(false); panelRef.current?.blur(); }
        break;

      case ' ':
      case 'Spacebar':
        if (hasFinding) { e.preventDefault(); onFindingAction?.('toggle', sys.id, items[activeFindingIdx].id); }
        break;

      case 'Enter':
        e.preventDefault();
        if (hasFinding) onFindingAction?.('normal',   sys.id, items[activeFindingIdx].id);
        else if (sys)   onSystemNormal?.(sys.id);
        break;

      case 'x': case 'X':
        if (hasFinding) { e.preventDefault(); onFindingAction?.('abnormal', sys.id, items[activeFindingIdx].id); }
        break;

      default: {
        // 1–9: directly toggle the Nth finding without navigating to it first
        if (/^[1-9]$/.test(e.key) && sys) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < items.length) {
            e.preventDefault();
            setActiveFindingIdx(idx);
            onFindingAction?.('toggle', sys.id, items[idx].id);
          }
          break;
        }
        // Letter: jump to system — searches visible set only in focused mode
        if (/^[A-Za-z]$/.test(e.key) && !hasFinding) {
          const nav   = visibleSystems || systems;
          const found = nav.findIndex(s => s.key === e.key.toUpperCase());
          if (found >= 0) {
            e.preventDefault();
            const targetIdx = systems.findIndex(s => s.id === nav[found].id);
            if (targetIdx >= 0) goToSystem(targetIdx);
          }
        }
        break;
      }
    }
  }, [
    activeSystemIdx, activeFindingIdx,
    systems, visibleSystems,
    navigateVisible, goToSystem,
    onFindingAction, onSystemNormal, onAllNormal,
    onModeToggle, onRemainder, onVisualMode,
  ]);

  const panelProps = {
    ref: panelRef,
    tabIndex: 0,
    style: { outline: 'none' },
    onFocus:   () => setIsFocused(true),
    onBlur:    (e) => {
      if (!panelRef.current?.contains(e.relatedTarget)) {
        setIsFocused(false);
        setActiveFindingIdx(-1);
      }
    },
    onKeyDown: handleKeyDown,
  };

  // Expose programmatic focus so tabs can auto-activate on mount
  const focus = useCallback(() => { panelRef.current?.focus(); }, []);

  return {
    activeSystemIdx, setActiveSystemIdx,
    activeFindingIdx, setActiveFindingIdx,
    isFocused, panelProps, goToSystem, focus,
  };
}