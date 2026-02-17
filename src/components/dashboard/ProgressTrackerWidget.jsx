import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, TrendingUp, Target, Award } from "lucide-react";

export default function ProgressTrackerWidget() {
  const [projects, setProjects] = useState([
    { id: 1, name: "Clinical Documentation Review", progress: 75, goal: 100, unit: "notes" },
    { id: 2, name: "Guidelines Implementation", progress: 45, goal: 60, unit: "items" },
    { id: 3, name: "Patient Care Quality Metrics", progress: 88, goal: 100, unit: "%" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", goal: "", unit: "items" });

  const handleAddProject = () => {
    if (!newProject.name || !newProject.goal) return;
    setProjects([...projects, {
      id: Date.now(),
      name: newProject.name,
      progress: 0,
      goal: parseInt(newProject.goal),
      unit: newProject.unit
    }]);
    setNewProject({ name: "", goal: "", unit: "items" });
    setDialogOpen(false);
  };

  const updateProgress = (id, delta) => {
    setProjects(projects.map(p => {
      if (p.id === id) {
        const newProgress = Math.max(0, Math.min(p.goal, p.progress + delta));
        return { ...p, progress: newProgress };
      }
      return p;
    }));
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 30) return "bg-yellow-500";
    return "bg-slate-400";
  };

  const getStatusBadge = (percentage) => {
    if (percentage === 100) return <Badge className="bg-green-100 text-green-800 border-green-300">Complete</Badge>;
    if (percentage >= 75) return <Badge className="bg-blue-100 text-blue-800 border-blue-300">On Track</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">In Progress</Badge>;
    return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Started</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-slate-700">Active Projects</h4>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Project name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Goal (target number)"
                value={newProject.goal}
                onChange={(e) => setNewProject({ ...newProject, goal: e.target.value })}
              />
              <select
                value={newProject.unit}
                onChange={(e) => setNewProject({ ...newProject, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="items">Items</option>
                <option value="notes">Notes</option>
                <option value="%">Percentage</option>
                <option value="hours">Hours</option>
              </select>
              <Button onClick={handleAddProject} className="w-full">
                Add Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {projects.map(project => {
          const percentage = Math.round((project.progress / project.goal) * 100);
          return (
            <div key={project.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-slate-900">{project.name}</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    {project.progress} / {project.goal} {project.unit}
                  </p>
                </div>
                {getStatusBadge(percentage)}
              </div>
              
              <Progress value={percentage} className={`h-2 mb-3 ${getProgressColor(percentage)}`} />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <TrendingUp className="w-3 h-3" />
                  {percentage}%
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateProgress(project.id, -1)}
                    className="h-6 px-2 text-xs"
                  >
                    -1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateProgress(project.id, 1)}
                    className="h-6 px-2 text-xs"
                  >
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateProgress(project.id, 5)}
                    className="h-6 px-2 text-xs"
                  >
                    +5
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.filter(p => (p.progress / p.goal) === 1).length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <Award className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800 font-medium">
            {projects.filter(p => (p.progress / p.goal) === 1).length} project(s) completed!
          </p>
        </div>
      )}
    </div>
  );
}