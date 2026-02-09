import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SectionLibrary from "../components/templates/SectionLibrary";

export default function TemplateSectionsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to={createPageUrl("NoteTemplates")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Templates
      </Link>

      <SectionLibrary />
    </div>
  );
}