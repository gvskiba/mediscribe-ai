import React from "react";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExtractionConfidenceIndicator({ confidence, fieldName }) {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const getConfidenceLevel = (score) => {
    if (score >= 0.8) return { level: "high", label: "High", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 0.6) return { level: "medium", label: "Medium", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "low", label: "Low", color: "text-red-600", bg: "bg-red-50" };
  };

  const { level, label, color } = getConfidenceLevel(confidence);

  const Icon = level === "high" ? CheckCircle2 : level === "medium" ? HelpCircle : AlertCircle;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("w-4 h-4", color)} />
      <span className={cn("text-xs font-medium", color)}>
        {label} confidence ({Math.round(confidence * 100)}%)
      </span>
    </div>
  );
}