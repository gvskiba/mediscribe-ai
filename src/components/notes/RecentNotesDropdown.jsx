import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Clock, FileText, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RecentNotesDropdown() {
  const { data: recentNotes, isLoading } = useQuery({
    queryKey: ['recentNotes'],
    queryFn: async () => {
      const notes = await base44.entities.ClinicalNote.list('-updated_date', 5);
      return notes;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 text-sm">
          <Clock className="w-4 h-4" />
          Recent Notes
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Recently Updated Notes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
        ) : recentNotes && recentNotes.length > 0 ? (
          <>
            {recentNotes.map((note) => (
              <DropdownMenuItem
                key={note.id}
                onClick={() => window.location.href = createPageUrl(`NoteDetail?id=${note.id}`)}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-sm truncate flex-1">
                    {note.patient_name || "Unnamed Patient"}
                  </span>
                </div>
                {note.chief_complaint && (
                  <p className="text-xs text-slate-600 truncate w-full ml-6">
                    {note.chief_complaint}
                  </p>
                )}
                <span className="text-xs text-slate-500 ml-6">
                  {format(new Date(note.updated_date), "MMM d, h:mm a")}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.location.href = createPageUrl('NotesLibrary')}
              className="text-center justify-center text-blue-600 font-medium"
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