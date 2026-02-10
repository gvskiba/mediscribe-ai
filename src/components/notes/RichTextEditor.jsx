import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { FileText, Link as LinkIcon } from "lucide-react";

const modules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ header: [2, 3, false] }],
  ],
};

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Click to edit...",
  onInsertTemplate,
  diagnoses = []
}) {
  const [showDiagnosisLinks, setShowDiagnosisLinks] = useState(false);
  const editorRef = useRef(null);

  const handleInsertDiagnosis = (diagnosis) => {
    const quill = editorRef.current?.getEditor();
    if (quill) {
      const selection = quill.getSelection();
      const index = selection ? selection.index : quill.getLength();
      quill.insertText(index, `[${diagnosis}]`, { link: `diagnosis:${diagnosis}` });
      quill.setSelection(index + diagnosis.length + 2);
      setShowDiagnosisLinks(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-slate-300 overflow-hidden">
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={value || ""}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
          className="rounded-none text-sm"
        />
      </div>

      {diagnoses.length > 0 && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDiagnosisLinks(!showDiagnosisLinks)}
            className="gap-2 border-blue-300 hover:bg-blue-50"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Link Diagnoses
          </Button>
          {onInsertTemplate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onInsertTemplate()}
              className="gap-2 border-purple-300 hover:bg-purple-50"
            >
              <FileText className="w-3.5 h-3.5" />
              Quick Templates
            </Button>
          )}
        </div>
      )}

      {showDiagnosisLinks && diagnoses.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-900 mb-2">Link diagnosis to text:</p>
          <div className="flex flex-wrap gap-2">
            {diagnoses.map((dx, idx) => (
              <button
                key={idx}
                onClick={() => handleInsertDiagnosis(dx)}
                className="text-xs bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                {dx}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}