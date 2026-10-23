import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Task } from "../types";
import {
  CheckSquare,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle,
  Filter,
  Check,
  Tag,
} from "lucide-react";

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"due" | "created">("due");

  // Create Task Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newCategory, setNewCategory] = useState("general");
  const [newDueDate, setNewDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks({
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
      });
      setTasks(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await api.createTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        category: newCategory.trim() || "general",
        due_date: newDueDate ? new Date(newDueDate).toISOString() : undefined,
      });

      setTasks((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewTitle("");
      setNewDesc("");
      setNewPriority("medium");
      setNewCategory("general");
      setNewDueDate("");
    } catch (err: any) {
      alert(err?.message || "Error creating task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      const updated = await api.completeTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) {
      alert(err?.message || "Error completing task");
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete task "${title}"?`)) return;
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err?.message || "Error deleting task");
    }
  };

  // Metrics computation
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const now = new Date().toISOString();
  const overdueCount = tasks.filter((t) => t.status !== "completed" && t.due_date && t.due_date < now).length;

  // Sorting
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === "due") {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const priorityBadges = {
    urgent: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    medium: "bg-astra-violet/15 text-astra-lavender border-astra-violet/30",
    low: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-astra-violet/10 text-astra-lavender border border-astra-violet/20 mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-astra-cyan" />
            <span>SQLite-Backed Productivity Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Tasks & Priorities
          </h1>
          <p className="text-sm text-astra-muted">
            Manage your daily objectives. Actions here and requests made through the assistant synchronize directly via MCP tools.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-astra-violet to-astra-purple text-white font-semibold text-xs flex items-center gap-2 shadow-glow-violet hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] uppercase font-semibold text-astra-muted">Total Tasks</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] uppercase font-semibold text-emerald-400">Completed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] uppercase font-semibold text-astra-cyan">Pending</div>
          <div className="text-2xl font-bold text-astra-cyan mt-1">{pendingCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] uppercase font-semibold text-rose-400">Overdue</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{overdueCount}</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl bg-astra-surface/60 border border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-astra-muted flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {["all", "pending", "in_progress", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === st
                  ? "bg-astra-violet text-white"
                  : "bg-white/5 text-astra-muted hover:text-white"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-astra-card border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-astra-card border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="due">Sort by Due Date</option>
            <option value="created">Sort by Created Date</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const isCompleted = task.status === "completed";
          const isOverdue = !isCompleted && task.due_date && task.due_date < now;

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-4 ${
                isCompleted
                  ? "bg-astra-surface/40 border-white/5 opacity-70"
                  : isOverdue
                  ? "bg-astra-surface/90 border-rose-500/30 hover:border-rose-500/50"
                  : "bg-astra-surface/90 border-white/10 hover:border-astra-violet/40"
              }`}
            >
              {/* Checkbox and Details */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-white/20 hover:border-astra-cyan text-transparent hover:text-astra-cyan/50"
                  }`}
                  title={isCompleted ? "Completed" : "Click to mark completed"}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isCompleted ? "line-through text-astra-muted" : "text-white"
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        priorityBadges[task.priority] || priorityBadges.medium
                      }`}
                    >
                      {task.priority}
                    </span>

                    {/* Category */}
                    {task.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-astra-muted flex items-center gap-1 font-mono">
                        <Tag className="w-2.5 h-2.5" />
                        {task.category}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-astra-muted leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-astra-muted pt-1">
                    {task.due_date && (
                      <span
                        className={`flex items-center gap-1 ${
                          isOverdue ? "text-rose-400 font-semibold" : ""
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        {isOverdue && <span className="text-[10px] uppercase font-bold">(Overdue)</span>}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[10px] font-mono text-astra-muted/70">
                      <span>ID: {task.id.slice(0, 8)}...</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDeleteTask(task.id, task.title)}
                  className="p-1.5 rounded-lg text-astra-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {sortedTasks.length === 0 && !loading && (
          <div className="text-center py-16 bg-astra-surface/40 rounded-2xl border border-white/5 space-y-3">
            <CheckSquare className="w-8 h-8 text-astra-muted mx-auto opacity-50" />
            <div className="text-sm font-semibold text-white">No tasks match your filters</div>
            <p className="text-xs text-astra-muted max-w-sm mx-auto">
              Create a new task above or ask ASTRA in the chat: *"Create task: Ship Alexa+ hackathon project"*.
            </p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-astra-surface border border-white/15 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-astra-cyan" />
                <span>Create New Task</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-astra-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-astra-lavender font-semibold mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify Streamable HTTP protocol version"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-sm"
                />
              </div>

              <div>
                <label className="block text-astra-lavender font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details or acceptance criteria..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-astra-lavender font-semibold mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-astra-lavender font-semibold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. hackathon, work, dev"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-astra-lavender font-semibold mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-astra-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-astra-violet to-astra-purple text-white font-semibold shadow-glow-violet hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Create Task via MCP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
