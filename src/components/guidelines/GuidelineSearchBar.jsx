import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, Sparkles, Upload, X, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const EXAMPLE_QUESTIONS = [
  "What is the first-line treatment for newly diagnosed type 2 diabetes?",
  "When should anticoagulation be started in atrial fibrillation?",
  "What are the current BP targets for patients with CKD?",
  "Recommended statin therapy for primary prevention in diabetics?",
  "Indications for PCI vs CABG in multivessel coronary disease?",
];

export default function GuidelineSearchBar({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleSubmit = () => {
    if (!question.trim()) return;
    onSubmit(question, attachedFiles);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachedFiles(prev => [...prev, { name: file.name, url: file_url }]);
    } catch (error) {
      alert("Failed to upload file: " + error.message);
    }
    setUploadingFile(false);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ask a Clinical Question</h2>
            <p className="text-sm text-slate-500">Get evidence-based answers from clinical guidelines.</p>
          </div>
        </div>

        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., What are the ACC/AHA guidelines for management of heart failure with reduced ejection fraction?"
          className="min-h-[100px] rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 resize-none text-sm"
        />

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs text-purple-700">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="text-purple-400 hover:text-purple-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-3">
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.txt,.csv,.xlsx"
              disabled={uploadingFile || isLoading}
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-2 cursor-pointer"
                disabled={uploadingFile || isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('file-upload').click();
                }}
              >
                {uploadingFile ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Attach Lab/Report</>
                )}
              </Button>
            </label>
          </div>
          <div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !question.trim()}
              className="bg-purple-600 hover:bg-purple-700 rounded-xl gap-2 px-6 shadow-lg shadow-purple-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching Evidence...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Search Guidelines
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-5 pt-2 border-t border-slate-50">
        <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Try asking</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuestion(q)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-colors border border-slate-100 hover:border-purple-200"
            >
              {q.length > 50 ? q.slice(0, 50) + "…" : q}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}