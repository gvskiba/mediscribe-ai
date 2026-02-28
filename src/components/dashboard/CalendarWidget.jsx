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
      

    </div>
  );
}