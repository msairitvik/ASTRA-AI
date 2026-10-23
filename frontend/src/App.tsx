import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

import { LandingPage } from "./pages/LandingPage";
import { AssistantPage } from "./pages/AssistantPage";
import { ExplorePage } from "./pages/ExplorePage";
import { ToolsPage } from "./pages/ToolsPage";
import { TasksPage } from "./pages/TasksPage";
import { NotesPage } from "./pages/NotesPage";
import { ActivityPage } from "./pages/ActivityPage";
import { SettingsPage } from "./pages/SettingsPage";
import { api } from "./services/api";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Welcome to ASTRA AI",
    subtitle: "Alexa+-inspired general purpose assistant with real Model Context Protocol integration",
  },
  "/chat": {
    title: "AI Assistant",
    subtitle: "Conversational intelligence powered by live MCP Streamable HTTP tools",
  },
  "/explore": {
    title: "Explore Capabilities",
    subtitle: "Discover interactive tools, equations, reminders, and starter prompts",
  },
  "/tools": {
    title: "Model Context Protocol Tools",
    subtitle: "21 discoverable tools running over Streamable HTTP protocol version 2025-11-25+",
  },
  "/tasks": {
    title: "Tasks & Priorities",
    subtitle: "Persistent personal productivity synchronized across chat and SQLite",
  },
  "/notes": {
    title: "Notes & Knowledge",
    subtitle: "Structured personal notes, documentation, and conversation summaries",
  },
  "/activity": {
    title: "Activity & Analytics",
    subtitle: "Verified audit trail of tool invocations and productivity metrics",
  },
  "/settings": {
    title: "System Settings",
    subtitle: "Preferences, appearance, voice options, and connection monitoring",
  },
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mcpConnected, setMcpConnected] = useState(true);

  // Check MCP connection periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await api.getStatus();
        setMcpConnected(status.mcp.connected);
      } catch {
        setMcpConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 12000);
    return () => clearInterval(interval);
  }, []);

  const meta = PAGE_META[location.pathname] || {
    title: "ASTRA AI",
    subtitle: "Intelligent Assistant",
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`min-h-screen bg-astra-navy flex flex-col ${isDarkMode ? "dark text-astra-white" : "light text-slate-900 bg-slate-50"}`}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mcpConnected={mcpConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        {/* Sticky Header */}
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={meta.title}
          subtitle={meta.subtitle}
          isSpeaking={isSpeaking}
          onStopSpeaking={handleStopSpeaking}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          mcpConnected={mcpConnected}
        />

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<AssistantPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  isDarkMode={isDarkMode}
                  onToggleTheme={handleToggleTheme}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
