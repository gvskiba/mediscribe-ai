import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "", description: "" });

  const { data: events = [] } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: () => base44.entities.CalendarEvent.list(),
  });

  const handleAddEvent = async () => {
    if (!newEvent.title) return;
    await base44.entities.CalendarEvent.create({
      title: newEvent.title,
      date: format(date, "yyyy-MM-dd"),
      time: newEvent.time,
      description: newEvent.description,
    });
    setNewEvent({ title: "", time: "", description: "" });
    setDialogOpen(false);
  };

  const selectedDateEvents = events.filter(
    event => format(new Date(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
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
                <Textarea
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
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
                  {event.description && <p className="text-xs text-slate-600 mt-1">{event.description}</p>}
                </div>
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