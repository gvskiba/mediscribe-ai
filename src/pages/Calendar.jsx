import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, X, Clock, MapPin, Share2, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday } from "date-fns";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  teal2: "#00a896",
  amber: "#f5a623",
  red: "#ff5c6c",
  purple: "#9b6dff",
};

const CalendarEventEntity = "GuidelineQuery"; // Using existing entity for storing events

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    time: "09:00",
    description: "",
  });
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: () => base44.entities.CalendarEvent.list(),
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.CalendarEvent.create(eventData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const getEventsForDate = (date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleAddEvent = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setFormData({ title: "", time: "09:00", description: "" });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) return;

    const eventData = {
      title: formData.title,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: formData.time,
      description: formData.description,
      color: T.teal,
    };

    if (editingEvent) {
      await updateEventMutation.mutateAsync({ id: editingEvent.id, data: eventData });
    } else {
      await createEventMutation.mutateAsync(eventData);
    }
    setShowEventModal(false);
  };

  const handleDeleteEvent = async (id) => {
    await deleteEventMutation.mutateAsync(id);
  };

  const generateICalURL = () => {
    let ical = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MedNu//Calendar//EN\n";
    events.forEach((event) => {
      const [hours, minutes] = event.time.split(":");
      const eventDate = new Date(event.date);
      eventDate.setHours(parseInt(hours), parseInt(minutes));
      const dtstart = format(eventDate, "yyyyMMdd'T'HHmmss");
      ical += `BEGIN:VEVENT\nDTSTART:${dtstart}\nSUMMARY:${event.title}\nDESCRIPTION:${
        event.description || ""
      }\nEND:VEVENT\n`;
    });
    ical += "END:VCALENDAR";
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(ical);
  };

  const generateGoogleCalendarURL = (event) => {
    const [hours, minutes] = event.time.split(":");
    const eventDate = new Date(event.date);
    eventDate.setHours(parseInt(hours), parseInt(minutes));
    const startTime = format(eventDate, "yyyyMMdd'T'HHmmss");
    const endTime = format(new Date(eventDate.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${startTime}/${endTime}&details=${encodeURIComponent(
      event.description || ""
    )}`;
  };

  const generateAppleCalendarURL = (event) => {
    const [hours, minutes] = event.time.split(":");
    const eventDate = new Date(event.date);
    eventDate.setHours(parseInt(hours), parseInt(minutes));
    return `webcal://calendar.apple.com/?event=${encodeURIComponent(
      event.title
    )}&dates=${format(eventDate, "yyyyMMdd'T'HHmmss")}`;
  };

  const downloadICalendar = () => {
    const ical = generateICalURL().split(",")[1];
    const link = document.createElement("a");
    link.href = generateICalURL();
    link.download = "calendar.ics";
    link.click();
  };

  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= new Date();
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div style={{ background: T.navy, minHeight: "100vh", padding: "20px", color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Calendar className="w-6 h-6" style={{ color: T.teal }} />
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: T.bright, margin: 0 }}>
            Calendar
          </h1>
        </div>

        {/* Export Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button
            onClick={downloadICalendar}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              background: T.edge,
              border: `1px solid ${T.border}`,
              borderRadius: "8px",
              color: T.text,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.teal)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
          >
            <Download className="w-3 h-3" />
            Download .ics
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Calendar Grid */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "16px" }}>
          {/* Month Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              style={{
                background: "transparent",
                border: "none",
                color: T.teal,
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ← Prev
            </button>
            <div style={{ fontSize: "16px", fontWeight: 700, color: T.bright }}>
              {format(currentDate, "MMMM yyyy")}
            </div>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              style={{
                background: "transparent",
                border: "none",
                color: T.teal,
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Next →
            </button>
          </div>

          {/* Day Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "12px" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: T.dim }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {daysInMonth.map((day, idx) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => isCurrentMonth && handleAddEvent(day)}
                  style={{
                    padding: "8px",
                    background: isCurrentDay ? T.teal : isCurrentMonth ? T.edge : T.slate,
                    border: `1px solid ${isCurrentDay ? T.teal : T.border}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    minHeight: "60px",
                    position: "relative",
                    opacity: isCurrentMonth ? 1 : 0.5,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (isCurrentMonth) e.currentTarget.style.borderColor = T.teal;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isCurrentDay ? T.teal : T.border;
                  }}
                >
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isCurrentDay ? T.navy : T.text,
                    marginBottom: "4px",
                  }}>
                    {format(day, "d")}
                  </div>
                  {dayEvents.length > 0 && (
                    <div style={{
                      fontSize: "8px",
                      color: T.dim,
                      lineHeight: 1.2,
                    }}>
                      {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: T.bright, marginBottom: "16px" }}>
            Upcoming Events
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "500px", overflowY: "auto" }}>
            {upcomingEvents.length === 0 ? (
              <div style={{ color: T.dim, fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
                No upcoming events
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedDate(event.date);
                    setEditingEvent(event);
                    setFormData({ title: event.title, time: event.time, description: event.description });
                    setShowEventModal(true);
                  }}
                  style={{
                    padding: "12px",
                    background: T.edge,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.teal;
                    e.currentTarget.style.background = T.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.background = T.edge;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: event.color,
                        marginTop: "4px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "10px", color: T.muted, marginBottom: "3px" }}>
                        {format(event.date, "MMM dd")} • {event.time}
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: T.bright, marginBottom: "4px" }}>
                        {event.title}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: "10px", color: T.dim }}>{event.description}</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: T.red,
                        cursor: "pointer",
                        padding: "4px",
                        transition: "all 0.2s",
                        fontSize: "16px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      title="Delete event"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowEventModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: "12px",
              padding: "20px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: T.bright, margin: 0 }}>
                {editingEvent ? "Edit Event" : "New Event"}
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.text,
                  cursor: "pointer",
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: T.dim, display: "block", marginBottom: "4px" }}>
                  Date
                </label>
                <div style={{ fontSize: "13px", color: T.text }}>
                  {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: T.dim, display: "block", marginBottom: "4px" }}>
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: T.edge,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    color: T.text,
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: T.dim, display: "block", marginBottom: "4px" }}>
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: T.edge,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    color: T.text,
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: T.dim, display: "block", marginBottom: "4px" }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add notes..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: T.edge,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    color: T.text,
                    fontSize: "13px",
                    boxSizing: "border-box",
                    minHeight: "80px",
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  onClick={handleSaveEvent}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
                    border: "none",
                    borderRadius: "8px",
                    color: T.navy,
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Save Event
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: T.edge,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    color: T.text,
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.teal)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}