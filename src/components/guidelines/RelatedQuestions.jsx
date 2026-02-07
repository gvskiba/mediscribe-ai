import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function RelatedQuestions({ questions, onSelectQuestion }) {
  if (!questions || questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 mt-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-slate-900">Related Questions</h4>
      </div>
      <div className="space-y-2">
        {questions.map((question, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(question)}
            className="w-full text-left text-sm bg-white hover:bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 transition-colors text-slate-700 hover:text-blue-700"
          >
            {question}
          </button>
        ))}
      </div>
    </motion.div>
  );
}