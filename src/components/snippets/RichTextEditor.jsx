import React from "react";
import ReactQuill from "react-quill";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Type } from "lucide-react";
import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ 'header': [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ]
};

export default function RichTextEditor({ value, onChange, placeholder }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="bg-white"
      />
      <style>{`
        .ql-container { border-top: 1px solid #e2e8f0; }
        .ql-editor { min-height: 150px; }
        .ql-toolbar { border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .ql-toolbar.ql-snow .ql-picker-label { color: #475569; }
        .ql-toolbar.ql-snow .ql-stroke { stroke: #64748b; }
        .ql-toolbar.ql-snow .ql-fill { fill: #64748b; }
        .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options { background: white; }
      `}</style>
    </div>
  );
}