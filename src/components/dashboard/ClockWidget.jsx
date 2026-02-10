import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import { Button } from "@/components/ui/button";

const AnalogClock = ({ time }) => {
  const hours = time.hours() % 12;
  const minutes = time.minutes();
  const seconds = time.seconds();

  const secondDegrees = (seconds / 60) * 360;
  const minuteDegrees = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hourDegrees = (hours / 12) * 360 + (minutes / 60) * 30;

  const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="relative w-full aspect-square max-w-xs mx-auto">
      <div className="absolute inset-0 rounded-full border-8 border-slate-300 bg-gradient-to-br from-white to-slate-50 shadow-lg flex items-center justify-center">
        {/* Hour numbers */}
        {numbers.map((num) => {
          const angle = (num === 12 ? 0 : num * 30) * (Math.PI / 180);
          const radius = 85;
          const x = 50 + radius * Math.sin(angle);
          const y = 50 - radius * Math.cos(angle);

          return (
            <div
              key={num}
              className="absolute w-6 h-6 flex items-center justify-center text-sm font-semibold text-slate-900"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {num}
            </div>
          );
        })}

        {/* Hour markers for non-number positions */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`marker-${i}`}
            className="absolute w-1 h-3 bg-slate-300 rounded-full"
            style={{
              left: "50%",
              top: "5%",
              transformOrigin: "center 95%",
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}

        {/* Center dot outer ring */}
        <div className="absolute w-5 h-5 bg-slate-100 rounded-full z-20" />

        {/* Hour hand */}
        <div
          className="absolute w-2.5 h-16 bg-slate-900 rounded-full origin-bottom left-1/2 bottom-1/2"
          style={{ transform: `translateX(-50%) rotateZ(${hourDegrees}deg)` }}
        />

        {/* Minute hand */}
        <div
          className="absolute w-1.5 h-24 bg-slate-700 rounded-full origin-bottom left-1/2 bottom-1/2"
          style={{ transform: `translateX(-50%) rotateZ(${minuteDegrees}deg)` }}
        />

        {/* Second hand */}
        <div
          className="absolute w-0.5 h-28 bg-blue-500 origin-bottom left-1/2 bottom-1/2"
          style={{ transform: `translateX(-50%) rotateZ(${secondDegrees}deg)` }}
        />

        {/* Center dot */}
        <div className="absolute w-3 h-3 bg-slate-900 rounded-full z-30" />
      </div>
    </div>
  );
};

const MinimalClock = ({ time }) => {
  return (
    <div className="text-center">
      <div className="text-5xl font-light text-slate-900 font-mono tracking-tight mb-1">
        {time.format("HH:mm")}
      </div>
      <div className="text-xs text-slate-400 tracking-widest uppercase">
        {time.format("A")}
      </div>
    </div>
  );
};

const BinaryClockCell = ({ value }) => {
  return (
    <div className="flex gap-0.5">
      {[3, 2, 1, 0].map((bit) => (
        <div
          key={bit}
          className={`w-3 h-3 rounded-sm ${
            (value >> bit) & 1 ? "bg-blue-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
};

const BinaryClock = ({ time }) => {
  const h = time.hours();
  const m = time.minutes();
  const s = time.seconds();

  return (
    <div className="flex flex-col gap-3 items-center">
      <div className="flex gap-4">
        <BinaryClockCell value={Math.floor(h / 10)} />
        <BinaryClockCell value={h % 10} />
      </div>
      <div className="flex gap-4">
        <BinaryClockCell value={Math.floor(m / 10)} />
        <BinaryClockCell value={m % 10} />
      </div>
      <div className="flex gap-4">
        <BinaryClockCell value={Math.floor(s / 10)} />
        <BinaryClockCell value={s % 10} />
      </div>
      <div className="text-xs text-slate-400 mt-2">
        {time.format("HH:mm:ss")}
      </div>
    </div>
  );
};

export default function ClockWidget() {
  const [time, setTime] = useState(moment());
  const [calendarDate, setCalendarDate] = useState(moment());
  const [clockFace, setClockFace] = useState("digital");

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
      {/* Clock Styles Selector */}
      <div className="flex gap-2 justify-center">
        {[
          { id: "digital", label: "Digital" },
          { id: "analog", label: "Analog" },
          { id: "minimal", label: "Minimal" },
          { id: "binary", label: "Binary" },
        ].map((style) => (
          <Button
            key={style.id}
            variant={clockFace === style.id ? "default" : "outline"}
            size="sm"
            onClick={() => setClockFace(style.id)}
            className="text-xs"
          >
            {style.label}
          </Button>
        ))}
      </div>

      {/* Clock Display */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center justify-center">
        {clockFace === "digital" && (
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
        )}
        {clockFace === "analog" && <AnalogClock time={time} />}
        {clockFace === "minimal" && <MinimalClock time={time} />}
        {clockFace === "binary" && <BinaryClock time={time} />}
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