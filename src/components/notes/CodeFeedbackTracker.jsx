import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

export default function CodeFeedbackTracker({ code, description, onSubmitFeedback }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("accurate");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType) {
      toast.error("Please select a feedback type");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitFeedback({
        code,
        description,
        feedbackType,
        comment,
        timestamp: new Date().toISOString()
      });

      toast.success("Feedback submitted successfully");
      setShowFeedback(false);
      setFeedbackType("accurate");
      setComment("");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (!showFeedback) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFeedback(true)}
          className="gap-1.5 text-xs border-slate-300 hover:bg-slate-100"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Feedback
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Validate Code Accuracy</p>
        <button
          onClick={() => setShowFeedback(false)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="accurate" id="accurate" />
            <Label htmlFor="accurate" className="flex items-center gap-2 cursor-pointer text-sm">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              This code is accurate
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="incorrect" id="incorrect" />
            <Label htmlFor="incorrect" className="flex items-center gap-2 cursor-pointer text-sm">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              This code is incorrect
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="incomplete" id="incomplete" />
            <Label htmlFor="incomplete" className="flex items-center gap-2 cursor-pointer text-sm">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              Code needs more specificity
            </Label>
          </div>
        </div>
      </RadioGroup>

      <Textarea
        placeholder="Add any corrections or additional notes (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="text-sm resize-none h-20"
      />

      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFeedback(false)}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
}