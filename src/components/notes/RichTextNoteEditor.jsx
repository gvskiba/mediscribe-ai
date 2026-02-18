import React, { useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const formats = [
  "header",
  "bold", "italic", "underline", "strike",
  "list", "bullet", "indent",
  "blockquote", "code-block",
  "link", "image",
  "color", "background"
];

export default function RichTextNoteEditor({ value, onChange, onBlur, placeholder }) {
  const quillRef = useRef(null);

  const imageHandler = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          toast.info("Uploading image...");
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", file_url);
          quill.setSelection(range.index + 1);
          
          toast.success("Image uploaded");
        } catch (error) {
          console.error("Image upload failed:", error);
          toast.error("Failed to upload image");
        }
      }
    };
  };

  const modules = React.useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        [{ color: [] }, { background: [] }],
        ["clean"]
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 14px;
          min-height: 300px;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background: #f8fafc;
          border-color: #e2e8f0;
        }
        .rich-text-editor .ql-editor {
          min-height: 300px;
          background: #f8fafc;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #475569;
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: #475569;
        }
        .rich-text-editor .ql-snow .ql-picker-label {
          color: #475569;
        }
        .rich-text-editor .ql-editor code {
          background: #1e293b;
          color: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        .rich-text-editor .ql-editor pre.ql-syntax {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Monaco', 'Courier New', monospace;
          border: 2px solid #334155;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 12px 0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          margin: 12px 0;
          color: #475569;
          font-style: italic;
        }
        .rich-text-editor .ql-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Type or paste clinical notes here..."}
      />
    </div>
  );
}