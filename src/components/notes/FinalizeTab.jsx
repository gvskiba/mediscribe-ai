import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Loader2 } from "lucide-react";

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amended: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function FinalizeTab({ note, finalizeMutation, exportingFormat, exportNote }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Review & Export</h2><p className="text-xs text-slate-400 mt-0.5">Finalize, review, and export your clinical note</p></div>
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-sm font-semibold text-slate-800">Note Status</span>
            <Badge className={`text-xs ${statusColors[note.status || "draft"]}`}>{note.status || "draft"}</Badge>
          </div>
          <div className="flex gap-1.5">
            <Button onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending || note.status === "finalized"} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs h-7">
              {finalizeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {note.status === "finalized" ? "Finalized" : "Finalize"}
            </Button>
            <Button onClick={() => exportNote('pdf')} disabled={exportingFormat === 'pdf'} size="sm" variant="outline" className="gap-1 text-xs h-7">
              {exportingFormat === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}PDF
            </Button>
            <Button onClick={() => exportNote('text')} disabled={exportingFormat === 'text'} size="sm" variant="outline" className="gap-1 text-xs h-7">
              {exportingFormat === 'text' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}Text
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Note Preview</span></div>
        <div className="p-4 space-y-3">
          {[{label:"CC",val:note.chief_complaint},{label:"HPI",val:note.history_of_present_illness},{label:"Assessment",val:note.assessment},{label:"Plan",val:note.plan}].filter(x=>x.val).map(({label,val}) => (
            <div key={label}><p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p><p className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{val}</p></div>
          ))}
          {note.diagnoses?.length > 0 && <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Diagnoses</p><div className="flex flex-wrap gap-1.5">{note.diagnoses.map((d,i) => <Badge key={i} className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">{d}</Badge>)}</div></div>}
        </div>
      </div>
    </div>
  );
}