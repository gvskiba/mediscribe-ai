import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

export default function ClockWidget() {
  const [time, setTime] = useState(moment());
  const [calendarDate, setCalendarDate] = useState(moment());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(moment());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getDaysInMonth = (date) => {
    const firstDay = date.clone().startOf("month");
    const lastDay = date.clone().endOf("month");
    const daysArray = [];
    let currentDay = firstDay.clone().day(0);

    while (currentDay.isBefore(lastDay) || currentDay.isSame(lastDay)) {
      daysArray.push(currentDay.clone());
      currentDay.add(1, "day");
    }
    return daysArray;
  };

  const days = getDaysInMonth(calendarDate);
  const isToday = (day) => day.isSame(moment(), "day");
  const isCurrentMonth = (day) => day.isSame(calendarDate, "month");

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Digital Clock */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-6xl font-bold text-slate-900 font-mono tracking-tighter">
            {time.format("HH:mm")}
          </div>
          <div className="text-sm font-medium text-slate-500 tracking-wide">
            {time.format("dddd")}
          </div>
          <div className="text-xs text-slate-400">
            {time.format("MMMM D, YYYY")}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1 flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {calendarDate.format("MMMM YYYY")}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCalendarDate(calendarDate.clone().subtract(1, "month"))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCalendarDate(moment())}
              className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCalendarDate(calendarDate.clone().add(1, "month"))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {days.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setCalendarDate(day)}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isToday(day)
                    ? "bg-blue-600 text-white shadow-md hover:shadow-lg hover:bg-blue-700"
                    : isCurrentMonth(day)
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-300 hover:bg-slate-50"
                }
              `}
            >
              {day.date()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}