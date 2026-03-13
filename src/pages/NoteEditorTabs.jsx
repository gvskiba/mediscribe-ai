import React from "react";
import NoteEditorTabs from "../components/notes/NoteEditorTabs";

export default function NoteEditorTabsPage() {
  return (
    <div style={{ background: "#050f1e", fontFamily: "DM Sans, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NoteEditorTabs noteId={null} initialTab="clinical_note" />
    </div>
  );
}