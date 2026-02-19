import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft } from "lucide-react";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DraggableNotificationButtons() {
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [prefs, setPrefs] = useState({
    fab_enabled: true,
    fab_position_arrow: { left: 20, top: 120 },
    fab_position_plus: { left: 20, top: 180 },
    fab_color_arrow: "blue",
    fab_color_plus: "green",
    fab_size: "large"
  });
  const [isDragging, setIsDragging] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const savedNoteId = localStorage.getItem("currentOpenNote");
    setCurrentNoteId(savedNoteId);
    
    // Load user preferences
    base44.auth.me().then(u => {
      setPrefs(prev => ({
        ...prev,
        ...(u?.preferences || {})
      }));
    }).catch(() => {
      // Keep defaults if auth fails
    });
  }, []);

  const handleCreateNote = async () => {
    try {
      const newNote = await base44.entities.ClinicalNote.create({
        raw_note: "",
        patient_name: "New Patient",
        status: "draft"
      });
      window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
    } catch (error) {
      toast.error("Failed to create new note");
    }
  };

  const handleReturnToNote = () => {
    if (currentNoteId) {
      window.location.href = createPageUrl(`NoteDetail?id=${currentNoteId}`);
    } else {
      toast.error("No open note found");
    }
  };

  const handleMouseDown = (e, buttonType) => {
    e.preventDefault();
    setIsDragging(buttonType);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !prefs) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const posKey = isDragging === 'arrow' ? 'fab_position_arrow' : 'fab_position_plus';
    const currentPos = prefs[posKey];
    
    const newLeft = Math.max(0, Math.min(window.innerWidth - 56, currentPos.left + deltaX));
    const newTop = Math.max(0, Math.min(window.innerHeight - 56, currentPos.top + deltaY));
    
    setPrefs(p => ({
      ...p,
      [posKey]: { left: newLeft, top: newTop }
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async () => {
    if (isDragging && prefs) {
      setIsDragging(null);
      await base44.auth.updateMe({ preferences: prefs });
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!prefs || !prefs.fab_enabled) return null;

  const sizeClasses = {
    small: { container: "w-12 h-12", inner: "w-10 h-10", icon: "w-5 h-5" },
    medium: { container: "w-13 h-13", inner: "w-11 h-11", icon: "w-5 h-5" },
    large: { container: "w-14 h-14", inner: "w-12 h-12", icon: "w-6 h-6" }
  };

  const colorGradients = {
    blue: "linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)",
    green: "linear-gradient(135deg, #86efac 0%, #4ade80 50%, #22c55e 100%)",
    purple: "linear-gradient(135deg, #d8b4fe 0%, #c084fc 50%, #a855f7 100%)",
    orange: "linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #f97316 100%)",
    red: "linear-gradient(135deg, #fca5a5 0%, #f87171 50%, #ef4444 100%)",
    indigo: "linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 50%, #818cf8 100%)",
  };

  const colorShadows = {
    blue: "0 4px 24px 0 rgba(59,130,246,0.25)",
    green: "0 4px 24px 0 rgba(34,197,94,0.25)",
    purple: "0 4px 24px 0 rgba(168,85,247,0.25)",
    orange: "0 4px 24px 0 rgba(249,115,22,0.25)",
    red: "0 4px 24px 0 rgba(239,68,68,0.25)",
    indigo: "0 4px 24px 0 rgba(129,140,248,0.25)",
  };

  const sizes = sizeClasses[prefs.fab_size];

  return (
    <div className="fixed z-40 pointer-events-none">
      <style>{`
        .fab-button { pointer-events: auto; }
      `}</style>
      {/* Return to Note Button */}
      {currentNoteId && (
        <motion.button
          onMouseDown={(e) => handleMouseDown(e, 'arrow')}
          onClick={handleReturnToNote}
          whileHover={{ scale: isDragging ? 1 : 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`${sizes.container} rounded-full bg-white shadow-xl border-2 border-transparent flex items-center justify-center transition-all ${isDragging === 'arrow' ? 'cursor-grab' : 'cursor-pointer'}`}
          style={{
            background: "white",
            boxShadow: colorShadows[prefs.fab_color_arrow] + ", 0 1.5px 6px 0 rgba(99,102,241,0.15)",
          }}
          title="Return to open note (drag to move)"
        >
          <div
            className={`${sizes.inner} rounded-full flex items-center justify-center`}
            style={{
              background: colorGradients[prefs.fab_color_arrow],
              boxShadow: "inset 0 1px 3px rgba(255,255,255,0.5), 0 0 0 2px rgba(59,130,246,0.4)",
            }}
          >
            <ArrowLeft className={`${sizes.icon} text-white drop-shadow`} />
          </div>
        </motion.button>
      )}

      {/* Create New Note Button */}
      <motion.button
        onMouseDown={(e) => handleMouseDown(e, 'plus')}
        onClick={handleCreateNote}
        whileHover={{ scale: isDragging ? 1 : 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`${sizes.container} rounded-full bg-white shadow-xl border-2 border-transparent flex items-center justify-center transition-all ${isDragging === 'plus' ? 'cursor-grab' : 'cursor-pointer'}`}
        style={{
          background: "white",
          boxShadow: colorShadows[prefs.fab_color_plus] + ", 0 1.5px 6px 0 rgba(99,102,241,0.15)",
        }}
        title="Create new note (drag to move)"
      >
        <div
          className={`${sizes.inner} rounded-full flex items-center justify-center`}
          style={{
            background: colorGradients[prefs.fab_color_plus],
            boxShadow: "inset 0 1px 3px rgba(255,255,255,0.5), 0 0 0 2px rgba(34,197,94,0.4)",
          }}
        >
          <Plus className={`${sizes.icon} text-white drop-shadow`} />
        </div>
      </motion.button>
    </div>
  );
}