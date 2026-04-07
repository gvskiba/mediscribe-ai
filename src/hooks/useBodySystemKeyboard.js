import { useState, useCallback, useRef } from 'react';

/**
 * useBodySystemKeyboard
 * Shared keyboard navigation hook for PETab and ROSTab.
 *
 * Keyboard map (when panel is focused):
 *   ↑ / ↓              Navigate findings within the active system
 *   ← / →              Jump to previous / next system
 *   Letter key          Jump to system by its assigned shortcut key (when no finding focused)
 *   Space               Toggle finding state: null → normal → abnormal → null
 *   Enter               Mark focused finding normal — OR mark whole system normal if none focused
 *   X                   Mark focused finding abnormal (reports, for ROS)
 *   Tab / Shift+Tab     Next / previous finding
 *   ⌘/Ctrl + Enter      Mark whole system normal regardless of focus
 *   ⌘/Ctrl + Shift + N  Mark ALL systems normal
 *   Escape              Deselect focused finding → blur panel
 */
export function useBodySystemKeyboard({
  systems,
  onFindingAction,   // (action: 'toggle'|'normal'|'abnormal', systemId, findingId) => void
  onSystemNormal,    // (systemId) => void
  onAllNormal,       // () => void
}) {
  const [activeSystemIdx, setActiveSystemIdx] = useState(0);
  const [activeFindingIdx, setActiveFindingIdx] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const panelRef = useRef(null);

  const goToSystem = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, systems.length - 1));
    setActiveSystemIdx(clamped);
    setActiveFindingIdx(-1);
  }, [systems.length]);

  const handleKeyDown = useCallback((e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    const mod = e.metaKey || e.ctrlKey;
    const sys = systems[activeSystemIdx];
    const items = sys?.findings || sys?.symptoms || [];
    const hasFinding = activeFindingIdx >= 0 && activeFindingIdx < items.length;

    // ── Global mod shortcuts ──────────────────────────────────────────────
    if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault(); onAllNormal?.(); return;
    }
    if (mod && e.key === 'Enter') {
      e.preventDefault(); if (sys) onSystemNormal?.(sys.id); return;
    }
    if (mod) return; // pass all other mod combos through

    // ── Navigation & actions ──────────────────────────────────────────────
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault(); goToSystem(activeSystemIdx - 1); break;

      case 'ArrowRight':
        e.preventDefault(); goToSystem(activeSystemIdx + 1); break;

      case 'ArrowUp':
        e.preventDefault();
        if (items.length > 0)
          setActiveFindingIdx(i => (i <= 0 ? 0 : i - 1));
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (items.length > 0)
          setActiveFindingIdx(i => Math.min(items.length - 1, i < 0 ? 0 : i + 1));
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
        if (hasFinding) {
          setActiveFindingIdx(-1);
        } else {
          setIsFocused(false);
          panelRef.current?.blur();
        }
        break;

      case ' ':
      case 'Spacebar':
        if (hasFinding) {
          e.preventDefault();
          onFindingAction?.('toggle', sys.id, items[activeFindingIdx].id);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (hasFinding) {
          onFindingAction?.('normal', sys.id, items[activeFindingIdx].id);
        } else if (sys) {
          onSystemNormal?.(sys.id);
        }
        break;

      case 'x':
      case 'X':
        if (hasFinding) {
          e.preventDefault();
          onFindingAction?.('abnormal', sys.id, items[activeFindingIdx].id);
        }
        break;

      default:
        // Single-letter system jump — only fires when no finding is focused
        if (/^[A-Za-z]$/.test(e.key) && !hasFinding) {
          const found = systems.findIndex(s => s.key === e.key.toUpperCase());
          if (found >= 0) { e.preventDefault(); goToSystem(found); }
        }
        break;
    }
  }, [activeSystemIdx, activeFindingIdx, systems, goToSystem, onFindingAction, onSystemNormal, onAllNormal]);

  // Spread onto the panel wrapper div
  const panelProps = {
    ref: panelRef,
    tabIndex: 0,
    style: { outline: 'none' },
    onFocus: () => setIsFocused(true),
    onBlur: (e) => {
      if (!panelRef.current?.contains(e.relatedTarget)) {
        setIsFocused(false);
        setActiveFindingIdx(-1);
      }
    },
    onKeyDown: handleKeyDown,
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