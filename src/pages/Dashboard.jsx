import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { FileText, BookOpen, Calculator, Layers, FileCode, X, Plus, GripVertical, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MedicalNewsSection from "../components/dashboard/MedicalNewsSection";
import RecentNotesWidget from "../components/dashboard/RecentNotesWidget";
import RecentGuidelinesWidget from "../components/dashboard/RecentGuidelinesWidget";
import QuickStatsWidget from "../components/dashboard/QuickStatsWidget";
import ClockWidget from "../components/dashboard/ClockWidget";
import CalendarWidget from "../components/dashboard/CalendarWidget";
import TaskListWidget from "../components/dashboard/TaskListWidget";
import ProgressTrackerWidget from "../components/dashboard/ProgressTrackerWidget";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const quickLinks = [
  {
    title: "Notes",
    description: "View and manage clinical notes",
    icon: FileText,
    page: "NotesLibrary",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    title: "Templates",
    description: "Manage note templates",
    icon: FileCode,
    page: "NoteTemplates",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    title: "Snippets",
    description: "Quick text snippets",
    icon: Layers,
    page: "Snippets",
    gradient: "from-emerald-500 to-emerald-600"
  },
  {
    title: "Guidelines",
    description: "Evidence-based clinical guidelines",
    icon: BookOpen,
    page: "Guidelines",
    gradient: "from-indigo-500 to-indigo-600"
  },
  {
    title: "Calculators",
    description: "Medical calculators and tools",
    icon: Calculator,
    page: "Calculators",
    gradient: "from-cyan-500 to-cyan-600"
  }
];

const availableWidgets = [
  { id: "quicklinks", name: "Quick Links", component: "QuickLinks" },
  { id: "stats", name: "Quick Stats", component: "QuickStats" },
  { id: "clock", name: "Clock", component: "Clock" },
  { id: "recentnotes", name: "Recent Notes", component: "RecentNotes" },
  { id: "recentguidelines", name: "Recent Guidelines", component: "RecentGuidelines" },
  { id: "news", name: "Medical News", component: "MedicalNews" },
  { id: "calendar", name: "Calendar", component: "Calendar" },
  { id: "tasklist", name: "Task List", component: "TaskList" },
  { id: "progress", name: "Progress Tracker", component: "ProgressTracker" }
];

export default function Dashboard() {
  const [userPreferences, setUserPreferences] = React.useState(null);
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [layout, setLayout] = useState("2x2");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication and load user preferences on mount
  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const user = await base44.auth.me();
        setIsAuthenticated(true);
        
        const prefs = user?.preferences || {
          dashboard_layout: "2x2",
          active_widgets: ["quicklinks", "recentnotes"]
        };
        setUserPreferences(prefs);
        setLayout(prefs.dashboard_layout);
        setActiveWidgets(prefs.active_widgets || ["quicklinks", "recentnotes"]);
      } catch (error) {
        // Not authenticated
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const toggleWidget = (widgetId) => {
    setActiveWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const layoutConfigs = {
    "2x2": { cols: 2, name: "2x2 Grid" },
    "3x3": { cols: 3, name: "3x3 Grid" },
    "horizontal": { cols: 1, name: "Horizontal Stack" }
  };

  const removeWidget = (widgetId) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
  };

  const savePreferences = async () => {
    try {
      await base44.auth.updateMe({
        preferences: {
          ...userPreferences,
          dashboard_layout: layout,
          active_widgets: activeWidgets
        }
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const newWidgets = Array.from(activeWidgets);
    const [removed] = newWidgets.splice(source.index, 1);
    newWidgets.splice(destination.index, 0, removed);
    setActiveWidgets(newWidgets);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to access your clinical dashboard and notes.</p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
         <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
         <p className="text-slate-600 mt-1">Your clinical workspace</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Manage Widgets
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Manage Dashboard Widgets</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Layout</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(layoutConfigs).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={layout === key ? "default" : "outline"}
                          className="text-xs h-9"
                          onClick={() => handleLayoutChange(key)}
                        >
                          {config.name}
                        </Button>
                      ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3">Widgets</p>
                  {availableWidgets.map(widget => (
                    <div key={widget.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-900">{widget.name}</p>
                        <p className="text-xs text-slate-500">
                          {activeWidgets.includes(widget.id) ? "Currently active" : "Currently hidden"}
                        </p>
                      </div>
                      <input 
                         type="checkbox"
                         checked={activeWidgets.includes(widget.id)}
                         onChange={(e) => {
                           e.stopPropagation();
                           toggleWidget(widget.id);
                         }}
                         onClick={(e) => e.stopPropagation()}
                         className="rounded w-4 h-4 cursor-pointer"
                       />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setManageDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  savePreferences();
                  setManageDialogOpen(false);
                }} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </div>
              </DialogContent>
              </Dialog>
              </div>
              </motion.div>

      {/* Widgets Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" type="WIDGET">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ 
                display: "grid", 
                gridTemplateColumns: `repeat(${layoutConfigs[layout].cols}, minmax(0, 1fr))`,
                gap: "1.5rem",
                width: "100%",
                backgroundColor: snapshot.isDraggingOver ? "rgba(59, 130, 246, 0.05)" : "transparent",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                transition: "background-color 0.2s",
              }}
            >
              <AnimatePresence>
                {activeWidgets.map((widgetId, index) => {
                  const widget = availableWidgets.find(w => w.id === widgetId);
                  if (!widget) return null;
                  
                  return (
                    <Draggable key={widgetId} draggableId={widgetId} index={index}>
                      {(provided, snapshot) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${
                            snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
                          }`}
                        >
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50 cursor-grab active:cursor-grabbing" {...provided.dragHandleProps}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      {widget.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWidget(widgetId)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-6">
                  {widgetId === "quicklinks" && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        {quickLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.page}
                              to={createPageUrl(link.page)}
                              className="group h-full"
                            >
                              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-lg hover:from-blue-50 hover:to-blue-100 transition-all duration-300 h-full flex flex-col items-center text-center group-hover:-translate-y-1">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                                  <Icon className="w-7 h-7 text-white" />
                                </div>
                                
                                <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                                  {link.title}
                                </h3>
                                
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {link.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {widgetId === "stats" && <QuickStatsWidget />}

                  {widgetId === "clock" && <ClockWidget />}

                  {widgetId === "recentnotes" && <RecentNotesWidget />}

                  {widgetId === "recentguidelines" && <RecentGuidelinesWidget />}

                  {widgetId === "news" && (
                    <MedicalNewsSection compact />
                  )}

                  {widgetId === "calendar" && <CalendarWidget />}

                  {widgetId === "tasklist" && <TaskListWidget />}

                  {widgetId === "progress" && <ProgressTrackerWidget />}
                </div>
                        </motion.div>
                      )}
                    </Draggable>
                  );
                })}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {activeWidgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No widgets added</h3>
          <p className="text-slate-500 mb-4">Add widgets to customize your dashboard</p>
        </motion.div>
      )}
    </div>
  );
}