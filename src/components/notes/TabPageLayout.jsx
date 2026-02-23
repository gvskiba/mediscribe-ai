import React from "react";
import { ArrowLeft } from "lucide-react";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

/**
 * Shared layout wrapper for all NoteDetail tab pages.
 * Provides consistent padding, max-width, page title, and nav footer.
 */
export default function TabPageLayout({
  title,
  subtitle,
  tabId,
  note,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  onUpdate,
  isFirstTab,
  isLastTab,
  handleBack,
  handleNext,
  children,
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      {/* Page Header */}
      {title && (
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {children}

      {/* Footer Nav */}
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2">
          <TabDataPreview tabId={tabId} note={note} />
          {templates !== undefined ? (
            <ClinicalNotePreviewButton
              note={note}
              templates={templates}
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
              onUpdate={onUpdate}
            />
          ) : (
            <ClinicalNotePreviewButton note={note} />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab?.() && (
            <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />Back
            </button>
          )}
          {!isLastTab?.() && (
            <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}