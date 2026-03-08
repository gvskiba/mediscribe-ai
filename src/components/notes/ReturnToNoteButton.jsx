import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

export default function ReturnToNoteButton({ currentPage }) {
  const [openNoteId, setOpenNoteId] = useState(null);

  useEffect(() => {
    const noteId = localStorage.getItem('currentOpenNote');
    setOpenNoteId(noteId);
  }, []);

  // Don't show on ClinicalNoteStudio or NoteDetail page
  if (currentPage === 'ClinicalNoteStudio' || currentPage === 'NoteDetail' || !openNoteId) {
    return null;
  }

  return (
    <Link to={createPageUrl(`ClinicalNoteStudio?id=${openNoteId}`)}>
      <Button
        variant="outline"
        className="gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 shadow-sm"
      >
        <FileText className="w-4 h-4" />
        Return to Open Note
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Link>
  );
}