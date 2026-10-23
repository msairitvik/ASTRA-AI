import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Activity, ProductivitySummary } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Activity as ActivityIcon,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  Filter,
} from "lucide-react";

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<ProductivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getActivity(
        100,
        filterType === "all" ? undefined : filterType
      );
      setActivities(data.activities || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error("Failed to load activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType]);

  // Chart data for Task Status
  const chartData = [
    { name: "Completed", value: summary?.completed_tasks || 0, color: "#10b981" },
    { name: "Pending", value: summary?.pending_tasks || 0, color: "#22d3ee" },
    { name: "In Progress", value: summary?.in_progress_tasks || 0, color: "#a855f7" },
    { name: "Overdue", value: summary?.overdue_tasks || 0, color: "#f43f5e" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-astra-cyan/10 text-astra-cyan border border-astra-cyan/20 mb-2">
            <ActivityIcon className="w-3.5 h-3.5" />
            <span>Audit Trail & Metrics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Activity & Execution Logs
          </h1>
          <p className="text-sm text-astra-muted">
            Inspect verified protocol activity, tool invocations, and live productivity analytics recorded into persistent storage.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-astra-cyan" : ""}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Analytics Visualizations */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart: Task Distribution */}
          <div className="p-5 rounded-2xl bg-astra-surface/80 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-astra-violet" />
                <span>Task Distribution</span>
              </span>
              <span className="text-xs font-mono text-astra-muted">
                {summary.total_tasks} Total
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#0D1127",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-astra-muted">No task data yet</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-astra-muted">{d.name}:</span>
                  <span className="font-bold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completion Rate KPI Card */}
          <div className="p-5 rounded-2xl bg-astra-surface/80 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Completion Rate
              </div>
              <p className="text-xs text-astra-muted">
                Calculated live from persistent task repository.
              </p>
            </div>

            <div className="my-4 text-center">
              <div className="text-5xl font-extrabold bg-gradient-to-r from-astra-cyan via-astra-lavender to-astra-violet bg-clip-text text-transparent">
                {summary.completion_rate_percent}%
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-400">
                {summary.completed_tasks} of {summary.total_tasks} tasks completed
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-astra-cyan to-astra-violet h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(summary.completion_rate_percent, 100)}%` }}
              />
            </div>
          </div>

          {/* Operational Health Card */}
          <div className="p-5 rounded-2xl bg-astra-surface/80 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protocol Health</span>
              </div>
              <p className="text-xs text-astra-muted">
                System telemetry and verified state metrics.
              </p>
            </div>

            <div className="space-y-3 my-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-astra-muted">Logged Operations</span>
                <span className="text-white font-bold">{summary.recent_activity_count}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-astra-muted">Stored Notes</span>
                <span className="text-astra-cyan font-bold">{summary.total_notes}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-astra-muted">Transport</span>
                <span className="text-emerald-400 font-bold">Streamable HTTP</span>
              </div>
            </div>

            <div className="text-[10px] text-astra-muted font-mono text-center">
              Persistence: SQLite (WAL enabled)
            </div>
          </div>
        </div>
      )}

      {/* Filter and Log Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-astra-surface/60 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-astra-muted flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter Log:
            </span>

            {[
              { id: "all", label: "All Activity" },
              { id: "tool_call", label: "Tool Executions" },
              { id: "system", label: "System Events" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterType === f.id
                    ? "bg-astra-violet text-white"
                    : "bg-white/5 text-astra-muted hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-astra-muted hidden sm:inline">
            Showing {activities.length} event(s)
          </span>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-2xl border border-white/10 bg-astra-surface/80 overflow-hidden shadow-sm">
          <div className="divide-y divide-white/5">
            {activities.map((act) => {
              const isTool = act.type === "tool_call";
              const isSuccess = act.status === "success";

              return (
                <div
                  key={act.id}
                  className="p-4 hover:bg-white/[0.02] transition-colors flex items-start justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                        isSuccess
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isTool ? (
                        <Terminal className="w-4 h-4" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {act.tool_name ? (
                          <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {act.tool_name}
                          </span>
                        ) : (
                          <span className="font-semibold text-white uppercase text-[10px] tracking-wider bg-white/5 px-2 py-0.5 rounded">
                            {act.type}
                          </span>
                        )}

                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            isSuccess
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          {act.status}
                        </span>
                      </div>

                      <p className="text-astra-lavender text-xs leading-relaxed">
                        {act.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-astra-muted flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3 text-astra-muted/70" />
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && !loading && (
              <div className="text-center py-12 text-astra-muted text-xs">
                No activity logs found for the selected filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
