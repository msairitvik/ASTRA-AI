import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Clock,
  Calculator,
  CheckSquare,
  FileText,
  CloudSun,
  Scale,
  Brain,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface CapabilityExample {
  title: string;
  prompt: string;
  description: string;
  category: string;
  icon: any;
  toolUsed?: string;
}

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const capabilities: CapabilityExample[] = [
    // Productivity & Organization
    {
      title: "Organize My Daily Schedule",
      prompt: "Help me organize my day.",
      description: "Get a high-performance deep work and recovery plan tailored for productivity.",
      category: "productivity",
      icon: CheckSquare,
      toolUsed: "Astra Core",
    },
    {
      title: "Create High-Priority Task",
      prompt: "Create task: Finalize quarterly project presentation with urgent priority",
      description: "Instantly create and save a task in the persistent SQLite database via MCP.",
      category: "productivity",
      icon: CheckSquare,
      toolUsed: "create_task",
    },
    {
      title: "Review Pending Tasks",
      prompt: "Show all my pending tasks",
      description: "Query and filter stored tasks sorted by status and priority.",
      category: "productivity",
      icon: CheckSquare,
      toolUsed: "list_tasks",
    },
    {
      title: "Productivity Analytics",
      prompt: "Show my productivity summary",
      description: "Calculate real-time completion rates, task counts, and overdue metrics.",
      category: "productivity",
      icon: CheckSquare,
      toolUsed: "get_productivity_summary",
    },

    // Calculations & Math
    {
      title: "Evaluate Mathematical Formula",
      prompt: "Calculate sqrt(144) * 25 + 50",
      description: "Safely evaluate arithmetic, powers, and roots using the AST math engine.",
      category: "calculations",
      icon: Calculator,
      toolUsed: "calculate",
    },
    {
      title: "Compound Calculation",
      prompt: "Calculate 1000 * (1 + 0.08)**5",
      description: "Calculate compound growth, exponential formulas, and trigonometric functions.",
      category: "calculations",
      icon: Calculator,
      toolUsed: "calculate",
    },
    {
      title: "Unit Conversion: Distance",
      prompt: "Convert 26.2 miles to km",
      description: "Perform accurate distance and length conversions.",
      category: "calculations",
      icon: Scale,
      toolUsed: "convert_units",
    },
    {
      title: "Unit Conversion: Temperature",
      prompt: "Convert 100 celsius to fahrenheit",
      description: "Convert between Celsius, Fahrenheit, and Kelvin scales.",
      category: "calculations",
      icon: Scale,
      toolUsed: "convert_units",
    },

    // Everyday Help & Live Information
    {
      title: "Live City Weather",
      prompt: "What is the weather in Seattle?",
      description: "Fetch live temperature, condition, humidity, and wind using Open-Meteo.",
      category: "live_info",
      icon: CloudSun,
      toolUsed: "get_weather",
    },
    {
      title: "World Time and Timezones",
      prompt: "What time is it in Tokyo?",
      description: "Check accurate current time, weekday, and offset across any IANA timezone.",
      category: "live_info",
      icon: Clock,
      toolUsed: "get_current_datetime",
    },
    {
      title: "Local Current Time",
      prompt: "What is the current time and date?",
      description: "Retrieve ISO timestamp, epoch, and formatted readable date.",
      category: "live_info",
      icon: Clock,
      toolUsed: "get_current_datetime",
    },

    // Notes & Knowledge
    {
      title: "Capture Architecture Note",
      prompt: "Save note: Model Context Protocol specifies Streamable HTTP transport at /mcp with session state.",
      description: "Persist knowledge entries into the SQLite repository with automatic categorization.",
      category: "notes",
      icon: FileText,
      toolUsed: "create_note",
    },
    {
      title: "Search Knowledge Base",
      prompt: "Search notes for MCP",
      description: "Fast keyword retrieval across titles, bodies, and tags in stored notes.",
      category: "notes",
      icon: Search,
      toolUsed: "search_notes",
    },

    // Learning & Explanations
    {
      title: "Explain Quantum Computing",
      prompt: "Explain quantum computing in simple language",
      description: "Understand superposition and quantum entanglement without confusing jargon.",
      category: "learning",
      icon: Brain,
      toolUsed: "Astra Core",
    },
    {
      title: "Project Launch Checklist",
      prompt: "Create a checklist for my project launch",
      description: "Generate structured pre-launch checklists for product delivery.",
      category: "learning",
      icon: Sparkles,
      toolUsed: "Astra Core",
    },
  ];

  const categories = [
    { id: "all", label: "All Capabilities" },
    { id: "productivity", label: "Productivity & Tasks" },
    { id: "calculations", label: "Math & Calculations" },
    { id: "live_info", label: "Live Info & Weather" },
    { id: "notes", label: "Notes & Data" },
    { id: "learning", label: "Learning & Writing" },
  ];

  const filtered = capabilities.filter((cap) => {
    const matchesCategory = selectedCategory === "all" || cap.category === selectedCategory;
    const matchesSearch =
      cap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLaunchPrompt = (prompt: string) => {
    navigate(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-astra-violet/10 text-astra-lavender border border-astra-violet/20">
          <Compass className="w-3.5 h-3.5 text-astra-cyan" />
          <span>Interactive Assistant Capabilities</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Explore ASTRA AI
        </h1>
        <p className="text-sm text-astra-muted max-w-2xl">
          Discover everything your assistant can do. Every example below is backed
          by real tools on our self-hosted Model Context Protocol server. Click any card to test it live.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? "bg-astra-violet text-white shadow-glow-violet"
                  : "bg-astra-surface/80 text-astra-muted hover:text-white border border-white/5 hover:border-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-astra-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-astra-surface/80 border border-white/10 text-xs text-white placeholder-astra-muted focus:outline-none focus:border-astra-violet/50"
          />
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => handleLaunchPrompt(item.prompt)}
              className="p-5 rounded-2xl bg-astra-surface/70 border border-white/10 hover:border-astra-violet/50 hover:bg-astra-surface transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-astra-violet/10 border border-astra-violet/20 flex items-center justify-center text-astra-violet group-hover:text-astra-cyan transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  {item.toolUsed && (
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-astra-muted border border-white/5">
                      {item.toolUsed}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-astra-cyan transition-colors mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-astra-muted leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {/* Launch prompt pill */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-astra-lavender">
                <span className="truncate italic max-w-[85%] text-[11px]">
                  "{item.prompt}"
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-astra-cyan group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-astra-muted">
          No capabilities found matching "{searchQuery}".
        </div>
      )}
    </div>
  );
};
