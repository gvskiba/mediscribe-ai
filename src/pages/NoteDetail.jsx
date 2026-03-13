import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import NoteEditorTabs from "../components/notes/NoteEditorTabs";



export default function NoteDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("id");
  const urlTab = urlParams.get("tab");

export default function NoteDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("id");
  const urlTab = urlParams.get("tab");

export default function NoteDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("id");
  const urlTab = urlParams.get("tab");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Note not found</h2>
        <Link to={createPageUrl("NotesLibrary")} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Back to Notes Library
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#050f1e", fontFamily: "DM Sans, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NoteEditorTabs note={note} noteId={noteId} initialTab={urlTab || "patient_intake"} />
    </div>
  );
}