import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useAutoSave({
  data,
  entityName,
  entityId,
  onSave,
  interval = 30000, // 30 seconds default
  enabled = true,
}) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(data));
  const isSavingRef = useRef(false);

  const performSave = useCallback(async () => {
    if (!enabled || !data || !entityId || isSavingRef.current) {
      return;
    }

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) {
      return;
    }

    isSavingRef.current = true;
    try {
      if (onSave) {
        await onSave(data);
      }
      lastSavedRef.current = currentData;
      queryClient.invalidateQueries({ queryKey: [entityName, entityId] });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, entityId, onSave, queryClient, entityName, enabled]);

  useEffect(() => {
    if (!enabled || !entityId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, interval);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, interval, enabled, entityId, performSave]);

  // Perform final save before unmount
  useEffect(() => {
    return () => {
      if (lastSavedRef.current !== JSON.stringify(data) && enabled && entityId) {
        performSave();
      }
    };
  }, []);

  return { isSaving: isSavingRef.current };
}