import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

export default function CalendarWidget() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([
    { id: 1, date: new Date(), title: "Team Meeting", time: "10:00 AM", type: "meeting" },
    { id: 2, date: new Date(Date.now() + 86400000), title: "Note Review Deadline", time: "3:00 PM", type: "deadline" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "", type: "meeting" });

  const handleAddEvent = () => {
    if (!newEvent.title) return;
    setEvents([...events, { 
      id: Date.now(), 
      date: date, 
      title: newEvent.title, 
      time: newEvent.time,
      type: newEvent.type 
    }]);
    setNewEvent({ title: "", time: "", type: "meeting" });
    setDialogOpen(false);
  };

  const selectedDateEvents = events.filter(
    event => format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-lg border"
      />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">
            {format(date, 'MMMM d, yyyy')}
          </h4>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-3 h-3 mr-1" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="appointment">Appointment</option>
                </select>
                <Button onClick={handleAddEvent} className="w-full">
                  Add Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {selectedDateEvents.length > 0 ? (
          <div className="space-y-2">
            {selectedDateEvents.map(event => (
              <div key={event.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">{event.time}</p>
                </div>
                <Badge variant={event.type === 'deadline' ? 'destructive' : 'default'} className="text-xs">
                  {event.type}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No events scheduled</p>
        )}
      </div>
    </div>
  );
}