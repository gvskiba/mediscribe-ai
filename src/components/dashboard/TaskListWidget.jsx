import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function TaskListWidget() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review patient notes", completed: false, priority: "high" },
    { id: 2, title: "Update clinical guidelines", completed: false, priority: "medium" },
    { id: 3, title: "Complete documentation training", completed: true, priority: "low" },
  ]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { 
      id: Date.now(), 
      title: newTask, 
      completed: false, 
      priority: newPriority 
    }]);
    setNewTask("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const priorityColors = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300"
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-4">
      {/* Add Task Form */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          className="flex-1"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button onClick={addTask} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <Badge variant="outline" className="text-xs">
          {activeTasks.length} active
        </Badge>
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
          {completedTasks.length} completed
        </Badge>
      </div>

      {/* Active Tasks */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activeTasks.length > 0 ? (
          activeTasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
              <Checkbox 
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
              </div>
              <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                {task.priority}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTask(task.id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500">All tasks completed!</p>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold text-slate-500 mb-2">Completed</p>
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 p-2 mb-1">
                <Checkbox checked={true} onCheckedChange={() => toggleTask(task.id)} />
                <p className="text-sm text-slate-500 line-through flex-1">{task.title}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                  className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}