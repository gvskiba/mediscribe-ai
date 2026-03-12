import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

const STORAGE_KEYS = {
  PENDING_NOTES: 'notrya_pending_notes',
  OFFLINE_NOTES: 'notrya_offline_notes',
  OFFLINE_PATIENTS: 'notrya_offline_patients',
  LAST_SYNC: 'notrya_last_sync',
};

export default function OfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Check pending changes on mount
    updatePendingCount();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored - syncing changes...");
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline - changes will be saved locally");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_NOTES') {
          syncPendingChanges();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = () => {
    try {
      const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_NOTES) || '[]');
      setPendingCount(pending.length);
    } catch (e) {
      console.error('Failed to update pending count:', e);
    }
  };

  const syncPendingChanges = async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_NOTES) || '[]');
      
      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      const synced = [];
      const failed = [];

      for (const item of pending) {
        try {
          if (item.action === 'create') {
            await base44.entities.ClinicalNote.create(item.data);
          } else if (item.action === 'update') {
            await base44.entities.ClinicalNote.update(item.id, item.data);
          } else if (item.action === 'delete') {
            await base44.entities.ClinicalNote.delete(item.id);
          }
          synced.push(item);
        } catch (error) {
          console.error('Sync failed for item:', item, error);
          failed.push(item);
        }
      }

      // Update localStorage with only failed items
      localStorage.setItem(STORAGE_KEYS.PENDING_NOTES, JSON.stringify(failed));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      updatePendingCount();
      
      if (synced.length > 0) {
        toast.success(`Synced ${synced.length} change${synced.length > 1 ? 's' : ''}`);
      }
      
      if (failed.length > 0) {
        toast.error(`${failed.length} change${failed.length > 1 ? 's' : ''} failed to sync`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync changes');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!pendingCount && isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      borderRadius: 10,
      background: isOnline ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 92, 108, 0.1)',
      border: `1px solid ${isOnline ? 'rgba(46, 204, 113, 0.3)' : 'rgba(255, 92, 108, 0.3)'}`,
      backdropFilter: 'blur(10px)',
      fontSize: 12,
      fontWeight: 700,
      color: isOnline ? '#2ecc71' : '#ff5c6c',
    }}>
      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span>
        {isOnline 
          ? pendingCount > 0 
            ? `Syncing ${pendingCount} change${pendingCount > 1 ? 's' : ''}...` 
            : 'Online'
          : 'Offline Mode'}
      </span>
      {isSyncing && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {pendingCount > 0 && isOnline && !isSyncing && (
        <button
          onClick={syncPendingChanges}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: '#2ecc71',
            border: 'none',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: 4
          }}
        >
          Sync Now
        </button>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper functions to save/load offline data
export const OfflineStorage = {
  // Save note to offline storage
  saveNote: (note) => {
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_NOTES) || '{}');
      notes[note.id] = { ...note, _offline_timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.OFFLINE_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save note offline:', e);
    }
  },

  // Get note from offline storage
  getNote: (id) => {
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_NOTES) || '{}');
      return notes[id] || null;
    } catch (e) {
      console.error('Failed to get note offline:', e);
      return null;
    }
  },

  // Get all offline notes
  getAllNotes: () => {
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_NOTES) || '{}');
      return Object.values(notes);
    } catch (e) {
      console.error('Failed to get all notes offline:', e);
      return [];
    }
  },

  // Queue a change for sync
  queueChange: (action, data, id = null) => {
    try {
      const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_NOTES) || '[]');
      pending.push({
        action,
        data,
        id,
        timestamp: Date.now(),
      });
      localStorage.setItem(STORAGE_KEYS.PENDING_NOTES, JSON.stringify(pending));
    } catch (e) {
      console.error('Failed to queue change:', e);
    }
  },

  // Save patient data offline
  savePatient: (patient) => {
    try {
      const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_PATIENTS) || '{}');
      patients[patient.id] = { ...patient, _offline_timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.OFFLINE_PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to save patient offline:', e);
    }
  },

  // Get patient from offline storage
  getPatient: (id) => {
    try {
      const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_PATIENTS) || '{}');
      return patients[id] || null;
    } catch (e) {
      console.error('Failed to get patient offline:', e);
      return null;
    }
  },

  // Clear all offline data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};