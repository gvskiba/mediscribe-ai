import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { OfflineStorage } from './OfflineSync';

export function useOfflineNote(noteId) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    loadNote();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [noteId]);

  const loadNote = async () => {
    if (!noteId) {
      setLoading(false);
      return;
    }

    try {
      // Try to load from API first
      if (navigator.onLine) {
        const data = await base44.entities.ClinicalNote.get(noteId);
        setNote(data);
        // Save to offline storage
        OfflineStorage.saveNote(data);
      } else {
        // Load from offline storage
        const offlineData = OfflineStorage.getNote(noteId);
        setNote(offlineData);
      }
    } catch (error) {
      console.error('Failed to load note:', error);
      // Fallback to offline storage
      const offlineData = OfflineStorage.getNote(noteId);
      setNote(offlineData);
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (updates) => {
    const updatedNote = { ...note, ...updates };
    setNote(updatedNote);

    // Save to offline storage immediately
    OfflineStorage.saveNote(updatedNote);

    if (navigator.onLine) {
      try {
        await base44.entities.ClinicalNote.update(noteId, updates);
      } catch (error) {
        console.error('Failed to update note online:', error);
        // Queue for sync
        OfflineStorage.queueChange('update', updates, noteId);
      }
    } else {
      // Queue for sync when online
      OfflineStorage.queueChange('update', updates, noteId);
    }
  };

  const createNote = async (noteData) => {
    const tempId = `temp_${Date.now()}`;
    const newNote = { ...noteData, id: tempId };
    
    setNote(newNote);
    OfflineStorage.saveNote(newNote);

    if (navigator.onLine) {
      try {
        const created = await base44.entities.ClinicalNote.create(noteData);
        setNote(created);
        OfflineStorage.saveNote(created);
        return created;
      } catch (error) {
        console.error('Failed to create note online:', error);
        OfflineStorage.queueChange('create', noteData);
        return newNote;
      }
    } else {
      OfflineStorage.queueChange('create', noteData);
      return newNote;
    }
  };

  return {
    note,
    loading,
    isOffline,
    updateNote,
    createNote,
    refreshNote: loadNote,
  };
}