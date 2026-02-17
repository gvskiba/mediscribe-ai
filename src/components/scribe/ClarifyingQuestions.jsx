import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";

export default function ClarifyingQuestions({ questions, onAnswersSubmit }) {
  const [answers, setAnswers] = useState({});

  const handleSubmit = () => {
    onAnswersSubmit(answers);
  };

  if (!questions || questions.length === 0) return null;

  return (
    <Card className="p-6 space-y-4 bg-amber-50 border-amber-200">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-slate-900">Clarifying Questions</h3>
      </div>
      <p className="text-sm text-slate-600">
        Please answer these questions to ensure note accuracy:
      </p>

      <div className="space-y-4">
        {questions.map((question, idx) => (
          <div key={idx} className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              {idx + 1}. {question}
            </label>
            <Textarea
              placeholder="Your answer..."
              value={answers[idx] || ""}
              onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
              className="bg-white"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
      >
        <Send className="w-4 h-4" />
        Submit Answers
      </Button>
    </Card>
  );
}