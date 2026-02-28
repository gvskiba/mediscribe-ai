import { useState, useEffect } from "react";
import { Download, Upload, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

const config = {
  colors: {
    background: "#080b10",
    surface: "#0e1320",
    surface_2: "#141b2d",
    card: "#111826",
    border: "#1a2236",
    border_active: "#243048",
    text: "#dde2ef",
    muted: "#4e5a78",
    dim: "#2d3a56",
    accent: "#00cca3",
    accent_dim: "#00332a"
  },
  layout: {
    header_height_px: 52,
    sidebar_width_px: 180,
    min_height_px: 560,
    border_radius_px: 12,
    max_pills_per_day: 4
  },
  shift_types: [
    { id: "day", label: "Day", icon: "🌅", color: "#38bdf8", bg: "#0c2a3a", hours: 12 },
    { id: "night", label: "Night", icon: "🌙", color: "#818cf8", bg: "#1a1840", hours: 12 },
    { id: "call", label: "On-Call", icon: "📟", color: "#fb923c", bg: "#2a1800", hours: 24 },
    { id: "split", label: "Split", icon: "⚡", color: "#00cca3", bg: "#00332a", hours: 12 },
    { id: "admin", label: "Admin", icon: "🗂", color: "#34d399", bg: "#002a1a", hours: 8 },
    { id: "cme", label: "CME", icon: "📚", color: "#facc15", bg: "#1f1800", hours: 8 },
    { id: "pto", label: "PTO", icon: "🏖", color: "#f472b6", bg: "#2a0f1e", hours: 0 },
    { id: "sick", label: "Sick", icon: "🤒", color: "#94a3b8", bg: "#1a1f2a", hours: 0 }
  ],
  departments: [
    { id: "all", label: "All Departments" },
    { id: "ed", label: "Emergency Dept." },
    { id: "icu", label: "ICU / Critical Care" },
    { id: "hosp", label: "Hospitalist" },
    { id: "or", label: "OR / Surgery" },
    { id: "ob", label: "OB / Labor & Delivery" },
    { id: "clinic", label: "Outpatient Clinic" },
    { id: "tele", label: "Telemedicine" },
    { id: "other", label: "Other" }
  ],
  months: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],
  days_of_week: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};

function ShiftLegend() {
  return (
    <div style={{ background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "8px", padding: "12px" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: config.colors.text, marginBottom: "8px" }}>Shift Types</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {config.shift_types.map((type) => (
          <div key={type.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
            <span style={{ fontSize: "14px" }}>{type.icon}</span>
            <span style={{ color: config.colors.text }}>{type.label}</span>
            {type.hours > 0 && <span style={{ color: config.colors.muted, marginLeft: "auto" }}>{type.hours}h</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyStats({ shifts, selectedDept }) {
  const filtered = selectedDept === "all" ? shifts : shifts.filter(s => s.dept === selectedDept);
  const totalHours = filtered.reduce((sum, s) => sum + (s.hours || 0), 0);
  const totalShifts = filtered.length;
  const uniqueDates = new Set(filtered.map(s => s.date)).size;
  const targetHours = 160;
  const progress = Math.round((totalHours / targetHours) * 100);

  return (
    <div style={{ background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "8px", padding: "12px" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: config.colors.text, marginBottom: "12px" }}>This Month</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
          <span style={{ color: config.colors.muted }}>Total Shifts</span>
          <span style={{ color: config.colors.text, fontWeight: 600 }}>{totalShifts}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
          <span style={{ color: config.colors.muted }}>Total Hours</span>
          <span style={{ color: config.colors.accent, fontWeight: 600 }}>{totalHours}h</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
          <span style={{ color: config.colors.muted }}>Days Worked</span>
          <span style={{ color: config.colors.text, fontWeight: 600 }}>{uniqueDates}</span>
        </div>
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
            <span style={{ color: config.colors.muted }}>Progress</span>
            <span style={{ color: config.colors.text }}>{progress}%</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: config.colors.dim, borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", background: config.colors.accent, transition: "width 0.3s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftModal({ isOpen, onClose, onSave, selectedDate, editingShift, selectedType }) {
  const [formData, setFormData] = useState(editingShift || {
    type: selectedType || "day",
    title: "",
    date: selectedDate,
    dept: "all",
    start: "",
    end: "",
    hours: 0,
    location: "",
    notes: ""
  });

  useEffect(() => {
    if (editingShift) {
      setFormData(editingShift);
    } else if (selectedDate) {
      const shiftType = config.shift_types.find(t => t.id === (selectedType || "day"));
      setFormData({
        type: selectedType || "day",
        title: "",
        date: selectedDate,
        dept: "all",
        start: "",
        end: "",
        hours: shiftType?.hours || 0,
        location: "",
        notes: ""
      });
    }
  }, [editingShift, selectedDate, selectedType]);

  const handleSave = () => {
    if (!formData.date || !formData.type) return;
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 50
    }} onClick={onClose}>
      <div style={{
        background: config.colors.surface, border: `1px solid ${config.colors.border}`,
        borderRadius: "12px", padding: "20px", width: "90%", maxWidth: "500px"
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: config.colors.text, margin: 0 }}>
            {editingShift ? "Edit Shift" : "New Shift"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: config.colors.text, cursor: "pointer" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "16px" }}>
          {config.shift_types.map((type) => (
            <button
              key={type.id}
              onClick={() => setFormData({ ...formData, type: type.id })}
              style={{
                padding: "10px", background: formData.type === type.id ? type.bg : config.colors.dim,
                border: `1px solid ${formData.type === type.id ? type.color : config.colors.border}`,
                borderRadius: "6px", cursor: "pointer", color: config.colors.text, fontSize: "11px",
                fontWeight: 600, transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "16px", marginBottom: "2px" }}>{type.icon}</div>
              {type.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>Date</label>
            <input
              type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>Title (optional)</label>
            <input
              type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Custom label"
              style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>Start</label>
              <input
                type="time" value={formData.start} onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>End</label>
              <input
                type="time" value={formData.end} onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "12px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>Department</label>
            <select value={formData.dept} onChange={(e) => setFormData({ ...formData, dept: e.target.value })} style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "12px" }}>
              {config.departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>Location (optional)</label>
            <input
              type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Unit or floor"
              style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: config.colors.muted, display: "block", marginBottom: "4px" }}>Notes (optional)</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Coverage details..."
              style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "12px", minHeight: "60px", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button onClick={handleSave} style={{ flex: 1, padding: "10px", background: config.colors.accent, color: config.colors.background, border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
              Save Shift
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", background: config.colors.dim, color: config.colors.text, border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [editingShift, setEditingShift] = useState(null);

  // Load shifts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("prov_shifts");
    if (stored) {
      try {
        setShifts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load shifts:", e);
      }
    }
  }, []);

  // Save shifts to localStorage
  useEffect(() => {
    localStorage.setItem("prov_shifts", JSON.stringify(shifts));
  }, [shifts]);

  const handleAddShift = (shiftData) => {
    if (editingShift) {
      setShifts(shifts.map(s => s.id === editingShift.id ? { ...shiftData, id: editingShift.id } : s));
    } else {
      setShifts([...shifts, { ...shiftData, id: Date.now().toString() }]);
    }
    setShowModal(false);
    setEditingShift(null);
    setSelectedDate(null);
    setSelectedType(null);
  };

  const handleDeleteShift = (id) => {
    setShifts(shifts.filter(s => s.id !== id));
  };

  const openModalForDate = (date, type = null) => {
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedType(type);
    setEditingShift(null);
    setShowModal(true);
  };

  const openModalForShift = (shift) => {
    setEditingShift(shift);
    setSelectedDate(shift.date);
    setShowModal(true);
  };

  const getShiftsForDate = (dateStr) => {
    return shifts.filter(s => s.date === dateStr && (selectedDept === "all" || s.dept === selectedDept));
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthDays = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const todayDate = today.getDate();

  return (
    <div style={{ background: config.colors.background, width: "100vw", height: "100vh", color: config.colors.text, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Compact Header */}
      <div style={{ height: "52px", background: config.colors.surface, borderBottom: `1px solid ${config.colors.border}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>🩺 Provider Shift Calendar</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} style={{ background: "none", border: "none", color: config.colors.text, cursor: "pointer", padding: "4px 8px" }}>
            ‹
          </button>
          <button onClick={() => setCurrentDate(new Date())} style={{ padding: "4px 12px", background: "transparent", border: `1px solid ${config.colors.border}`, borderRadius: "4px", color: config.colors.text, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
            TODAY
          </button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} style={{ background: "none", border: "none", color: config.colors.text, cursor: "pointer", padding: "4px 8px" }}>
            ›
          </button>
          <div style={{ fontSize: "14px", fontWeight: 600, minWidth: "120px", textAlign: "center" }}>
            {config.months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { const ics = generateICS(shifts); download(ics, "provider-shifts.ics"); }} style={{ padding: "6px 10px", background: config.colors.dim, border: `1px solid ${config.colors.border}`, borderRadius: "4px", color: config.colors.text, cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>
            📥 IMPORT
          </button>
          <button onClick={() => { const ics = generateICS(shifts); download(ics, "provider-shifts.ics"); }} style={{ padding: "6px 10px", background: config.colors.dim, border: `1px solid ${config.colors.border}`, borderRadius: "4px", color: config.colors.text, cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>
            📤 EXPORT
          </button>
          <button onClick={() => openModalForDate(new Date())} style={{ padding: "6px 10px", background: config.colors.accent, border: "none", borderRadius: "4px", color: config.colors.background, fontWeight: 600, cursor: "pointer", fontSize: "11px" }}>
            ✚ ADD SHIFT
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: "168px", background: config.colors.surface, borderRight: `1px solid ${config.colors.border}`, padding: "16px", overflowY: "auto", fontSize: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: config.colors.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Shift Types</div>
          <ShiftLegend />
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${config.colors.border}` }} />
          <div style={{ fontSize: "10px", fontWeight: 700, color: config.colors.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>This Month</div>
          <MonthlyStats shifts={shifts} selectedDept={selectedDept} />
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${config.colors.border}` }} />
          <div style={{ fontSize: "10px", fontWeight: 700, color: config.colors.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Department</div>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ width: "100%", padding: "6px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "4px", color: config.colors.text, fontSize: "11px" }}>
            {config.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Calendar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "12px" }}>
            {config.days_of_week.map((day) => (
              <div key={day} style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: config.colors.muted, paddingBottom: "8px", borderBottom: `1px solid ${config.colors.border}` }}>
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: "1", background: config.colors.dim, borderRadius: "8px" }} />
            ))}
            {Array(monthDays).fill(null).map((_, i) => {
              const date = i + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
              const dayShifts = getShiftsForDate(dateStr);
              const isToday = isCurrentMonth && date === todayDate;

              return (
                <div
                  key={date}
                  onClick={() => openModalForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), date))}
                  style={{
                    aspectRatio: "1", background: isToday ? config.colors.accent_dim : config.colors.surface_2,
                    border: `1px solid ${isToday ? config.colors.accent : config.colors.border}`,
                    borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex",
                    flexDirection: "column", transition: "all 0.2s", position: "relative"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = config.colors.accent}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = isToday ? config.colors.accent : config.colors.border}
                >
                  <div style={{ fontSize: "13px", fontWeight: 700, color: isToday ? config.colors.accent : config.colors.text, marginBottom: "4px" }}>
                    {date}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflow: "hidden" }}>
                    {dayShifts.slice(0, config.layout.max_pills_per_day).map((shift) => {
                      const shiftType = config.shift_types.find(t => t.id === shift.type);
                      return (
                        <div
                          key={shift.id}
                          onClick={(e) => { e.stopPropagation(); openModalForShift(shift); }}
                          style={{
                            fontSize: "9px", padding: "2px 4px", background: shiftType.bg,
                            border: `1px solid ${shiftType.color}`, borderRadius: "3px", color: shiftType.color,
                            fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                          }}
                        >
                          {shiftType.icon} {shift.title || shiftType.label}
                        </div>
                      );
                    })}
                    {dayShifts.length > config.layout.max_pills_per_day && (
                      <div style={{ fontSize: "8px", color: config.colors.muted }}>+{dayShifts.length - config.layout.max_pills_per_day}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      <ShiftModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingShift(null); }}
        onSave={handleAddShift}
        selectedDate={selectedDate}
        editingShift={editingShift}
        selectedType={selectedType}
      />
    </div>
  );
}

function generateICS(shifts) {
  let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Provider Shift Calendar//EN\nCALSCALE:GREGORIAN\n`;
  shifts.forEach((shift) => {
    const shiftType = config.shift_types.find(t => t.id === shift.type);
    const dtstart = shift.date.replace(/-/g, "") + (shift.start ? shift.start.replace(":", "") : "000000");
    const dtend = shift.date.replace(/-/g, "") + (shift.end ? shift.end.replace(":", "") : "235959");
    const summary = `${shiftType.icon} ${shift.title || shiftType.label}`;
    const description = [shift.notes, `Department: ${shift.dept}`, `Hours: ${shift.hours}`].filter(Boolean).join("\n");
    ics += `BEGIN:VEVENT\nUID:${shift.id}@providershiftcal\nDTSTART:${dtstart}\nDTEND:${dtend}\nSUMMARY:${summary}\nDESCRIPTION:${description}\nLOCATION:${shift.location || ""}\nEND:VEVENT\n`;
  });
  ics += "END:VCALENDAR";
  return ics;
}

function download(content, filename) {
  const link = document.createElement("a");
  link.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
  link.download = filename;
  link.click();
}

function handleImportICS(file, shifts, setShifts) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const ics = e.target.result;
    const events = ics.split("BEGIN:VEVENT");
    const imported = events.slice(1).map((evt) => {
      const match = (regex, str) => str.match(regex)?.[1] || "";
      const summary = match(/SUMMARY:(.+)/i, evt);
      const dtstart = match(/DTSTART:(\d{8})/i, evt);
      const location = match(/LOCATION:(.+)/i, evt);
      const description = match(/DESCRIPTION:(.+)/i, evt);

      if (!dtstart) return null;

      const year = dtstart.substring(0, 4);
      const month = dtstart.substring(4, 6);
      const day = dtstart.substring(6, 8);

      return {
        id: Date.now().toString() + Math.random(),
        type: "day",
        title: summary.split(" ").slice(1).join(" "),
        date: `${year}-${month}-${day}`,
        dept: "other",
        hours: 8,
        location: location,
        notes: description,
        start: "",
        end: ""
      };
    }).filter(Boolean);

    setShifts([...shifts, ...imported]);
  };
  reader.readAsText(file);
}