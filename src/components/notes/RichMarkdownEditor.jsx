import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Edit2, Bold, Italic, List, ListOrdered, Minus } from "lucide-react";

const TOOLBAR = [
  { label: "B", title: "Bold", wrap: ["**", "**"], icon: Bold },
  { label: "I", title: "Italic", wrap: ["_", "_"], icon: Italic },
  { label: "—", title: "Separator", icon: null, separator: true },
  { label: "•", title: "Bullet list", prefix: "- ", icon: List },
  { label: "1.", title: "Numbered list", prefix: "1. ", icon: ListOrdered },
  { label: "—", title: "Horizontal rule", insert: "\n---\n", icon: Minus },
];

export default function RichMarkdownEditor({ value, onChange, placeholder, minRows = 4, className }) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);

  const applyFormat = (item) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    let newValue, newCursor;

    if (item.insert) {
      newValue = value.slice(0, start) + item.insert + value.slice(end);
      newCursor = start + item.insert.length;
    } else if (item.wrap) {
      const [before, after] = item.wrap;
      newValue = value.slice(0, start) + before + selected + after + value.slice(end);
      newCursor = start + before.length + selected.length + after.length;
    } else if (item.prefix) {
      // Apply to each line in selection
      const lines = value.slice(start, end || start).split("\n");
      const prefixed = lines.map(l => item.prefix + l).join("\n");
      newValue = value.slice(0, start) + prefixed + value.slice(end);
      newCursor = start + prefixed.length;
    }

    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
        {TOOLBAR.map((item, i) =>
          item.separator ? (
            <div key={i} className="w-px h-4 bg-slate-200 mx-1" />
          ) : (
            <button
              key={i}
              type="button"
              title={item.title}
              onClick={() => applyFormat(item)}
              disabled={preview}
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-30 transition-colors"
            >
              {item.icon ? <item.icon className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{item.label}</span>}
            </button>
          )
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            preview ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          }`}
        >
          {preview ? <Edit2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div className="px-3 py-2 min-h-[100px] text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-400 italic">{placeholder || "Nothing to preview."}</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className={`w-full px-3 py-2 text-sm resize-y border-0 outline-none bg-white font-mono leading-relaxed ${className || ""}`}
          style={{ minHeight: `${minRows * 1.75}rem` }}
        />
      )}
    </div>
  );
}