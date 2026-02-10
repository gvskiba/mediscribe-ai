import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

export default function ClockWidget() {
  const [time, setTime] = useState(moment());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(moment());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative w-32 h-32"
      >
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50">
          <Clock className="w-12 h-12 text-blue-600" />
        </div>
      </motion.div>

      <div className="text-center">
        <div className="text-4xl font-bold text-slate-900 tracking-tight font-mono">
          {time.format("HH:mm:ss")}
        </div>
        <div className="text-sm text-slate-500 mt-2">
          {time.format("dddd, MMMM D, YYYY")}
        </div>
      </div>
    </div>
  );
}