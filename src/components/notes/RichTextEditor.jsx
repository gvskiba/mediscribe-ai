import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

const MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["clean"],
  ],
};

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "code-block",
  "list",
  "bullet",
  "align",
];

export default function RichTextEditor({
  value = "",
  onChange,
  onSave,
  placeholder = "Enter clinical note...",
  loading = false,
  showSaveButton = true,
  readOnly = false,
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(value);
        toast.success("Note saved");
      } catch (error) {
        toast.error("Failed to save note");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleReset = () => {
    if (onChange) {
      onChange("");
      toast.info("Note cleared");
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <ReactQuill
          value={value}
          onChange={onChange}
          modules={readOnly ? {} : MODULES}
          formats={readOnly ? [] : FORMATS}
          placeholder={placeholder}
          readOnly={readOnly}
          className="min-h-[300px] [&_.ql-container]:text-sm [&_.ql-editor]:p-4"
        />
      </div>

      {showSaveButton && !readOnly && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!value || loading || isSaving}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Clear
          </Button>
          <Button
            onClick={handleSave}
            disabled={!value || loading || isSaving}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {isSaving ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}