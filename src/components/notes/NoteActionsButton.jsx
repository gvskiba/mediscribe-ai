import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { FileText, ChevronDown, Clock, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NoteActionsButton({ currentPage }) {
  const [openNoteId, setOpenNoteId] = useState(null);

  useEffect(() => {
    const noteId = localStorage.getItem('currentOpenNote');
    setOpenNoteId(noteId);
  }, []);

  const { data: recentNotes, isLoading } = useQuery({
    queryKey: ['recentNotes'],
    queryFn: () => base44.entities.ClinicalNote.list('-updated_date', 5),
    refetchInterval: 30000,
  });

  const handleNewNote = async () => {
    const newNote = await base44.entities.ClinicalNote.create({
      raw_note: "",
      patient_name: "New Patient",
      status: "draft"
    });
    window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
  };

  const showReturnButton = currentPage !== 'NoteDetail' && openNoteId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold text-sm transition-all shadow-sm">
          <FileText className="w-4 h-4" />
          Notes
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* New Note */}
        <DropdownMenuItem
          onClick={handleNewNote}
          className="flex items-center gap-2 p-3 cursor-pointer font-semibold text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Note
        </DropdownMenuItem>

        {/* Return to Open Note */}
        {showReturnButton && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.location.href = createPageUrl(`NoteDetail?id=${openNoteId}`)}
              className="flex items-center gap-2 p-3 cursor-pointer text-blue-600 hover:text-blue-700"
            >
              <ArrowRight className="w-4 h-4" />
              Return to Open Note
            </DropdownMenuItem>
          </>
        )}

        {/* Recent Notes */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Recent Notes
        </DropdownMenuLabel>
        {isLoading ? (
          <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
        ) : recentNotes && recentNotes.length > 0 ? (
          <>
            {recentNotes.map((note) => (
              <DropdownMenuItem
                key={note.id}
                onClick={() => window.location.href = createPageUrl(`NoteDetail?id=${note.id}`)}
                className="flex flex-col items-start gap-0.5 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-sm truncate flex-1">
                    {note.patient_name || "Unnamed Patient"}
                  </span>
                </div>
                {note.chief_complaint && (
                  <p className="text-xs text-slate-500 truncate w-full ml-5">
                    {note.chief_complaint}
                  </p>
                )}
                <span className="text-xs text-slate-400 ml-5">
                  {format(new Date(note.updated_date), "MMM d, h:mm a")}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.location.href = createPageUrl('NotesLibrary')}
              className="text-center justify-center text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              View All Notes
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-4 text-center text-sm text-slate-500">No notes yet</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}