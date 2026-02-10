import React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CodeFeedbackTracker from "./CodeFeedbackTracker";

export default function ICD10CodeDisplay({ 
  code, 
  description, 
  diagnosis, 
  confidence,
  onCopyCode,
  onSubmitFeedback
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
    onCopyCode?.(code);
  };

  const confidenceColor = {
    high: "bg-green-100 text-green-800 border-green-200",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-orange-100 text-orange-800 border-orange-200"
  }[confidence] || "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <div className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {diagnosis && (
            <p className="text-xs text-slate-600 mb-1">
              <strong>Diagnosis:</strong> {diagnosis}
            </p>
          )}
          <p className="text-lg font-mono font-bold text-blue-700">{code}</p>
          <p className="text-sm text-slate-700 mt-1">{description}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="flex-shrink-0 gap-1.5"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {confidence && (
        <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${confidenceColor}`}>
          Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-slate-200">
        <CodeFeedbackTracker
          code={code}
          description={description}
          onSubmitFeedback={onSubmitFeedback}
        />
      </div>
    </div>
  );
}