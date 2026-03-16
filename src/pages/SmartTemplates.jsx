import { Navigate } from "react-router-dom";

// SmartTemplates redirects to NoteTemplates
export default function SmartTemplates() {
  return <Navigate to="/NoteTemplates" replace />;
}