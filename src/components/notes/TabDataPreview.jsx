import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layers, Copy, Check } from "lucide-react";

export default function TabDataPreview({ tabId, note }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getTabData = () => {
    const tabDataMap = {
      'hpi_intake': {
        title: 'HPI & Intake Data',
        fields: [
          { label: 'Raw Patient Data', value: note.raw_note },
          { label: 'Chief Complaint', value: note.chief_complaint },
          { label: 'History of Present Illness', value: note.history_of_present_illness },
        ]
      },
      'chief_complaint': {
        title: 'Chief Complaint',
        fields: [
          { label: 'Chief Complaint', value: note.chief_complaint },
          { label: 'Vital Signs', value: note.vital_signs ? JSON.stringify(note.vital_signs, null, 2) : null },
        ]
      },
      'review_of_systems': {
        title: 'Review of Systems',
        fields: [
          { label: 'Review of Systems', value: note.review_of_systems },
        ]
      },
      'physical_exam': {
        title: 'Physical Examination',
        fields: [
          { label: 'Physical Exam', value: note.physical_exam },
        ]
      },
      'analysis': {
        title: 'Clinical Analysis',
        fields: [
          { label: 'Assessment', value: note.assessment },
          { label: 'Clinical Impression', value: note.clinical_impression },
        ]
      },
      'initial_impression': {
        title: 'Initial Impression',
        fields: [
          { label: 'Chief Complaint', value: note.chief_complaint },
          { label: 'Assessment', value: note.assessment },
        ]
      },
      'calculators': {
        title: 'Medical Calculators',
        fields: [
          { label: 'MDM', value: note.mdm },
        ]
      },
      'laboratory': {
        title: 'Laboratory Data',
        fields: [
          { label: 'Assessment', value: note.assessment },
        ]
      },
      'imaging_recommendations': {
        title: 'Imaging Recommendations',
        fields: [
          { label: 'Assessment', value: note.assessment },
        ]
      },
      'imaging': {
        title: 'Result Analysis',
        fields: [
          { label: 'Assessment', value: note.assessment },
        ]
      },
      'mdm': {
        title: 'Medical Decision Making',
        fields: [
          { label: 'MDM', value: note.mdm },
          { label: 'Medical History', value: note.medical_history },
        ]
      },
      'diagnoses': {
        title: 'Diagnoses',
        fields: [
          { label: 'Diagnoses', value: note.diagnoses?.join('\n') },
          { label: 'Assessment', value: note.assessment },
        ]
      },
      'plan': {
        title: 'Treatment Plan',
        fields: [
          { label: 'Plan', value: note.plan },
        ]
      },
      'treatments': {
        title: 'Medications',
        fields: [
          { label: 'Medications', value: note.medications?.join('\n') },
          { label: 'Plan', value: note.plan },
        ]
      },
      'procedures': {
        title: 'Procedures',
        fields: [
          { label: 'Plan', value: note.plan },
        ]
      },
      'guidelines': {
        title: 'Guidelines',
        fields: [
          { label: 'Plan', value: note.plan },
          { label: 'Linked Guidelines', value: note.linked_guidelines ? JSON.stringify(note.linked_guidelines, null, 2) : null },
        ]
      },
      'final_impression': {
        title: 'Final Clinical Impression',
        fields: [
          { label: 'Clinical Impression', value: note.clinical_impression },
          { label: 'Diagnoses', value: note.diagnoses?.join('\n') },
        ]
      },
      'clinical': {
        title: 'Clinical Note',
        fields: [
          { label: 'Chief Complaint', value: note.chief_complaint },
          { label: 'History of Present Illness', value: note.history_of_present_illness },
          { label: 'Review of Systems', value: note.review_of_systems },
          { label: 'Physical Exam', value: note.physical_exam },
          { label: 'Assessment', value: note.assessment },
          { label: 'Diagnoses', value: note.diagnoses?.join('\n') },
          { label: 'Plan', value: note.plan },
          { label: 'Medications', value: note.medications?.join('\n') },
        ]
      },
      'summary': {
        title: 'Summary',
        fields: [
          { label: 'Summary', value: note.summary },
        ]
      },
      'patient_education': {
        title: 'Patient Education',
        fields: [
          { label: 'Plan', value: note.plan },
        ]
      },
      'research': {
        title: 'Research',
        fields: [
          { label: 'Plan', value: note.plan },
        ]
      },
      'ai_assistant': {
        title: 'AI Assistant',
        fields: [
          { label: 'Raw Note', value: note.raw_note },
        ]
      },
      'finalize': {
        title: 'Finalize',
        fields: [
          { label: 'Status', value: note.status },
          { label: 'Summary', value: note.summary },
        ]
      },
    };

    return tabDataMap[tabId] || { title: 'Tab Data', fields: [] };
  };

  const handleCopy = () => {
    const tabData = getTabData();
    const textContent = tabData.fields
      .filter(f => f.value)
      .map(f => `${f.label}:\n${f.value}\n`)
      .join('\n');
    
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabData = getTabData();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-0 hover:gap-2 transition-all duration-200 w-9 hover:w-auto overflow-hidden border border-purple-300 hover:bg-purple-50 hover:border-purple-400 text-purple-600 rounded-lg px-2.5 py-2 font-medium text-sm shadow-sm bg-white"
        title="Preview Tab"
      >
        <Eye className="w-4 h-4 flex-shrink-0" />
        <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-200">Preview Tab</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                {tabData.title}
              </span>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-600" /> Copied</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy</>
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {tabData.fields.filter(f => f.value).length > 0 ? (
              tabData.fields.filter(f => f.value).map((field, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{field.label}</h4>
                  <div className="bg-white rounded p-3 border border-slate-200">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {field.value}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No data available for this tab yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}