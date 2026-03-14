import { useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const STORAGE_KEY = "offline_notes";
const SYNC_DEBOUNCE_MS = 2000;

export function useOfflineNoteSync(noteId, noteData, queryClient) {
  const syncTimeoutRef = useRef(null);
  const lastSyncRef = useRef(null);
  const isOnlineRef = useRef(navigator.onLine);

  // Save to local storage
  const saveToLocalStorage = useCallback((data) => {
    if (!noteId) return;
    
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      stored[noteId] = {
        data,
        timestamp: Date.now(),
        synced: false,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error("Failed to save to local storage:", error);
    }
  }, [noteId]);

  // Sync to server
  const syncToServer = useCallback(async (data) => {
    if (!noteId || !navigator.onLine) return false;

    try {
      await base44.entities.ClinicalNote.update(noteId, data);
      
      // Mark as synced in local storage
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (stored[noteId]) {
        stored[noteId].synced = true;
        stored[noteId].lastSync = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }
      
      lastSyncRef.current = Date.now();
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["studioNote", noteId] });
      
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      return false;
    }
  }, [noteId, queryClient]);

  // Debounced sync
  const debouncedSync = useCallback((data) => {
    saveToLocalStorage(data);
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (navigator.onLine) {
        syncToServer(data);
      }
    }, SYNC_DEBOUNCE_MS);
  }, [saveToLocalStorage, syncToServer]);

  // Load from local storage on mount
  useEffect(() => {
    if (!noteId) return;

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const localNote = stored[noteId];
      
      if (localNote && !localNote.synced) {
        // We have unsynced local changes
        if (!navigator.onLine) {
          toast.info("Offline mode: Changes will sync when online");
        } else {
          // Try to sync immediately
          syncToServer(localNote.data).then(success => {
            if (success) {
              toast.success("Local changes synced");
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to load from local storage:", error);
    }
  }, [noteId, syncToServer]);

  // Online/offline event handlers
  useEffect(() => {
    const handleOnline = async () => {
      isOnlineRef.current = true;
      toast.success("Back online - syncing changes...");
      
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        
        // Sync all unsynced notes
        for (const [id, noteInfo] of Object.entries(stored)) {
          if (!noteInfo.synced) {
            const success = await syncToServer(noteInfo.data);
            if (success) {
              stored[id].synced = true;
              stored[id].lastSync = Date.now();
            }
          }
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        toast.success("All changes synced");
      } catch (error) {
        toast.error("Sync failed: " + error.message);
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      toast.warning("Working offline - changes will sync when online");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncToServer]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveNote: debouncedSync,
    isOnline: isOnlineRef.current,
    lastSync: lastSyncRef.current,
  };
}

// Utility to get unsynced notes count
export function getUnsyncedNotesCount() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return Object.values(stored).filter(n => !n.synced).length;
  } catch {
    return 0;
  }
}

// Utility to clear synced notes from storage
export function clearSyncedNotes() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const unsynced = Object.fromEntries(
      Object.entries(stored).filter(([_, note]) => !note.synced)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unsynced));
  } catch (error) {
    console.error("Failed to clear synced notes:", error);
  }
}