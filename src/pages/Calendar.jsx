import { useState, useEffect } from "react";
import { Download, Upload, Plus, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

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
    <div style={{ background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "8px", padding: "14px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: config.colors.text, marginBottom: "10px" }}>Shift Types</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {config.shift_types.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              const today = new Date();
              const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            }}
            style={{
              display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: config.colors.text,
              background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            <span style={{ fontSize: "16px" }}>{type.icon}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{type.label}</span>
            {type.hours > 0 && <span style={{ color: config.colors.muted, fontSize: "10px" }}>{type.hours}h</span>}
          </button>
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
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState(null);
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
    setShowQuickAdd(false);
    setEditingShift(null);
    setSelectedDate(null);
    setSelectedType(null);
  };

  const handleDeleteShift = (id) => {
    setShifts(shifts.filter(s => s.id !== id));
  };

  const handleQuickAdd = (type) => {
    const shiftType = config.shift_types.find(t => t.id === type);
    const newShift = {
      id: Date.now().toString(),
      type: type,
      title: "",
      date: quickAddDate,
      dept: "all",
      start: shiftType.start || "",
      end: shiftType.end || "",
      hours: shiftType.hours,
      location: "",
      notes: ""
    };
    setShifts([...shifts, newShift]);
    setShowQuickAdd(false);
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
    <div style={{ background: config.colors.background, minHeight: "100vh", color: config.colors.text, display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: "200px", background: config.colors.surface, borderRight: `1px solid ${config.colors.border}`, padding: "16px", overflowY: "auto" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>🩺 Provider Shifts</div>
        <ShiftLegend />
        <div style={{ marginTop: "16px" }} />
        <MonthlyStats shifts={shifts} selectedDept={selectedDept} />
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: config.colors.text, marginBottom: "8px" }}>Department</div>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ width: "100%", padding: "8px", background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, fontSize: "11px" }}>
            {config.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} style={{ background: "none", border: "none", color: config.colors.accent, cursor: "pointer" }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
              {config.months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} style={{ background: "none", border: "none", color: config.colors.accent, cursor: "pointer" }}>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} style={{ marginLeft: "16px", padding: "6px 12px", background: config.colors.dim, border: "none", borderRadius: "6px", color: config.colors.text, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              Today
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => { const ics = generateICS(shifts); download(ics, "provider-shifts.ics"); }} style={{ padding: "8px 12px", background: config.colors.dim, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
              <Download className="w-4 h-4" /> Export
            </button>
            <label style={{ padding: "8px 12px", background: config.colors.dim, border: `1px solid ${config.colors.border}`, borderRadius: "6px", color: config.colors.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".ics,.ical" onChange={(e) => handleImportICS(e.target.files?.[0], shifts, setShifts)} style={{ display: "none" }} />
            </label>
            <button onClick={() => openModalForDate(new Date())} style={{ padding: "8px 12px", background: config.colors.accent, border: "none", borderRadius: "6px", color: config.colors.background, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
              <Plus className="w-4 h-4" /> Add Shift
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ background: config.colors.card, border: `1px solid ${config.colors.border}`, borderRadius: config.layout.border_radius_px, padding: "20px" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {config.days_of_week.map((day) => (
              <div key={day} style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, color: config.colors.muted, paddingBottom: "12px", borderBottom: `2px solid ${config.colors.dim}` }}>
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
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
                  onContextMenu={(e) => { e.preventDefault(); setQuickAddDate(dateStr); setShowQuickAdd(true); }}
                  style={{
                    aspectRatio: "1", background: isToday ? config.colors.accent_dim : config.colors.surface_2,
                    border: `1px solid ${isToday ? config.colors.accent : config.colors.border}`,
                    borderRadius: config.layout.border_radius_px, padding: "10px", cursor: "pointer", display: "flex",
                    flexDirection: "column", transition: "all 0.2s", position: "relative", overflow: "hidden"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = config.colors.accent}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = isToday ? config.colors.accent : config.colors.border}
                >
                  <div style={{ fontSize: "14px", fontWeight: 700, color: isToday ? config.colors.accent : config.colors.text, marginBottom: "6px" }}>
                    {date}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, overflow: "hidden" }}>
                    {dayShifts.slice(0, config.layout.max_pills_per_day).map((shift) => {
                      const shiftType = config.shift_types.find(t => t.id === shift.type);
                      return (
                        <div
                          key={shift.id}
                          onClick={(e) => { e.stopPropagation(); openModalForShift(shift); }}
                          style={{
                            fontSize: "10px", padding: "3px 6px", background: shiftType.bg,
                            border: `1px solid ${shiftType.color}`, borderRadius: "4px", color: shiftType.color,
                            fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            cursor: "pointer", transition: "all 0.15s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          title={shift.notes}
                        >
                          {shiftType.icon} {shift.title || shiftType.label}
                        </div>
                      );
                    })}
                    {dayShifts.length > config.layout.max_pills_per_day && (
                      <div style={{ fontSize: "9px", color: config.colors.muted, fontWeight: 500 }}>
                        +{dayShifts.length - config.layout.max_pills_per_day} more
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setQuickAddDate(dateStr); setShowQuickAdd(true); }}
                    style={{
                      position: "absolute", bottom: "6px", right: "6px", width: "20px", height: "20px",
                      background: config.colors.accent, border: "none", borderRadius: "4px", 
                      color: config.colors.background, cursor: "pointer", fontSize: "12px", display: "flex",
                      alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    +
                  </button>
                </div>
              );
            })}
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

      {/* Quick Add Tray */}
      {showQuickAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 40
        }} onClick={() => setShowQuickAdd(false)}>
          <div style={{
            background: config.colors.surface, border: `1px solid ${config.colors.border}`,
            borderRadius: "12px", padding: "20px", maxWidth: "480px", width: "90%"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: config.colors.text, marginBottom: "12px" }}>
              Quick Add Shift
            </div>
            <p style={{ fontSize: "12px", color: config.colors.muted, marginBottom: "16px" }}>
              Click a shift type to add it, or choose "Custom shift details…" for more options.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
              {config.shift_types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleQuickAdd(type.id)}
                  style={{
                    padding: "12px", background: type.bg, border: `1px solid ${type.color}`,
                    borderRadius: "6px", color: config.colors.text, cursor: "pointer", display: "flex",
                    flexDirection: "column", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = type.color;
                    e.currentTarget.style.color = config.colors.background;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = type.bg;
                    e.currentTarget.style.color = config.colors.text;
                  }}
                >
                  <div style={{ fontSize: "16px" }}>{type.icon}</div>
                  <div>{type.label}</div>
                  {type.hours > 0 && <div style={{ fontSize: "9px", opacity: "0.7" }}>{type.hours}h</div>}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowQuickAdd(false); openModalForDate(new Date(quickAddDate)); }}
              style={{
                width: "100%", padding: "10px", background: config.colors.dim, border: `1px solid ${config.colors.border}`,
                borderRadius: "6px", color: config.colors.text, cursor: "pointer", fontSize: "12px", fontWeight: 600
              }}
            >
              Custom shift details…
            </button>
          </div>
        </div>
      )}
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