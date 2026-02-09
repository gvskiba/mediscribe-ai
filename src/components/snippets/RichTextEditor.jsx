import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean']
  ]
};

export default function RichTextEditor({ value, onChange, placeholder }) {
  const [checking, setChecking] = useState(false);
  const [corrections, setCorrections] = useState([]);
  const [showGrammar, setShowGrammar] = useState(false);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', file_url);
        quill.setSelection(index + 1);
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const checkGrammar = async () => {
    if (!value || value.length < 10) {
      toast.error("Please write some text first");
      return;
    }

    setChecking(true);
    try {
      const plainText = value.replace(/<[^>]*>/g, '');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this medical text for grammar, spelling, and clarity issues. Provide specific corrections with suggestions.

Text: "${plainText}"

For each issue found, provide:
1. The incorrect phrase
2. The correction
3. Explanation of the issue type (grammar, spelling, clarity, medical terminology)`,
        response_json_schema: {
          type: "object",
          properties: {
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  incorrect: { type: "string" },
                  correction: { type: "string" },
                  type: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            overall_quality: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setCorrections(result.issues || []);
      setShowGrammar(true);
      
      if (result.issues?.length === 0) {
        toast.success("No issues found - great writing!");
      } else {
        toast.info(`Found ${result.issues?.length || 0} issues to review`);
      }
    } catch (error) {
      toast.error("Failed to check grammar");
    } finally {
      setChecking(false);
    }
  };

  const applyCorrection = (correction) => {
    const newValue = value.replace(
      new RegExp(correction.incorrect, 'gi'),
      correction.correction
    );
    onChange(newValue);
    setCorrections(corrections.filter(c => c !== correction));
    toast.success("Correction applied");
  };

  return (
    <div className="space-y-3">
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
          className="bg-white"
        />
        <style>{`
          .ql-container { border-top: 1px solid #e2e8f0; }
          .ql-editor { min-height: 150px; color: #1f2937; }
          .ql-toolbar { border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
          .ql-toolbar.ql-snow .ql-picker-label { color: #475569; }
          .ql-toolbar.ql-snow .ql-stroke { stroke: #64748b; }
          .ql-toolbar.ql-snow .ql-fill { fill: #64748b; }
          .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options { background: white; }
          .ql-snow .ql-stroke { stroke-width: 1.5; }
          .ql-snow a { color: #2563eb; }
        `}</style>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <ImageIcon className="w-4 h-4" /> Add Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={checkGrammar}
          disabled={checking}
          className="gap-2"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Checking...
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" /> Check Grammar
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {showGrammar && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              {corrections.length === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Perfect!
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" /> {corrections.length} Issue{corrections.length !== 1 ? 's' : ''}
                </>
              )}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrammar(false)}
              className="text-xs"
            >
              ✕
            </Button>
          </div>

          {corrections.map((correction, idx) => (
            <div key={idx} className="bg-white rounded p-3 border border-blue-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    <span className="line-through text-red-600">{correction.incorrect}</span>
                    <span className="text-green-600 ml-2">→ {correction.correction}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{correction.explanation}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">{correction.type}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyCorrection(correction)}
                  className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}