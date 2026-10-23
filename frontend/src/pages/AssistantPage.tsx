import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Orb } from "../components/Orb";
import { ToolResultCard } from "../components/ToolResultCard";
import { ChatMessage, OrbState, Conversation, ConversationDetail } from "../types";
import { api } from "../services/api";
import { useSpeech } from "../hooks/useSpeech";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  AlertCircle,
  Terminal,
  History,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
} from "lucide-react";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "Hello! I am **ASTRA AI**, your general-purpose personal assistant.\n\nI can help you with everyday questions, live weather, timezones, safe calculations, tasks, notes, and practical actions through my **Model Context Protocol** tools. What would you like to do?",
    source: "builtin_engine",
    suggestedFollowUps: [
      "What time is it in India?",
      "What's the weather in Seattle?",
      "Calculate 125 * 8 + 50",
      "Show my tasks",
    ],
    timestamp: new Date().toISOString(),
  },
];

export const AssistantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice Hook
  const {
    isListening,
    isSpeaking,
    speechSupported,
    speechError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech({
    onTranscript: (liveText) => {
      setInput(liveText);
    },
  });

  // Calculate dynamic orb state
  const orbState: OrbState = isListening
    ? "listening"
    : isLoading
    ? "processing"
    : isSpeaking
    ? "speaking"
    : "idle";

  // Load conversations on mount
  const refreshConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (e) {
      console.warn("Could not load conversations:", e);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, []);

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle URL starter prompt
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam && !isLoading) {
      handleSend(promptParam);
    }
  }, [searchParams]);

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const detail: ConversationDetail = await api.getConversation(convId);
      setActiveConvId(detail.id);

      if (detail.messages && detail.messages.length > 0) {
        const formattedMessages: ChatMessage[] = detail.messages.map((m) => {
          let toolCallObj = undefined;
          if (m.tool_call) {
            try {
              const parsed = typeof m.tool_call === "string" ? JSON.parse(m.tool_call) : m.tool_call;
              let parsedResult = undefined;
              if (m.tool_result) {
                try {
                  parsedResult = typeof m.tool_result === "string" ? JSON.parse(m.tool_result) : m.tool_result;
                } catch {
                  parsedResult = m.tool_result;
                }
              }
              toolCallObj = {
                name: parsed.name || "mcp_tool",
                arguments: parsed.args || {},
                result: parsedResult,
                executionTimeMs: 0,
                success: true,
              };
            } catch (e) {
              console.warn("Failed parsing tool call metadata:", e);
            }
          }

          return {
            id: m.id,
            role: m.role,
            content: m.content,
            source: toolCallObj ? "mcp_tool" : "builtin_engine",
            toolCall: toolCallObj,
            timestamp: m.created_at,
          };
        });
        setMessages(formattedMessages);
      } else {
        setMessages(INITIAL_MESSAGES);
      }
      setShowHistory(false);
    } catch (err: any) {
      console.error("Failed to load conversation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      // Prepare recent context for multi-turn
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.sendMessage(
        messageContent,
        activeConvId || undefined,
        clientTimezone,
        undefined,
        historyPayload
      );

      if (response.conversationId) {
        setActiveConvId(response.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: "assistant-" + Date.now(),
        role: "assistant",
        content: response.message,
        source: response.source,
        providerName: response.providerName,
        toolCall: response.toolCall,
        suggestedFollowUps: response.suggestedFollowUps,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh conversations list in background
      refreshConversations();

      // Speak aloud if auto-speak is enabled
      if (autoSpeak && response.message) {
        speak(response.message);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "error-" + Date.now(),
        role: "assistant",
        content: `⚠️ **Connection Error:** Could not complete request. Ensure both the Python MCP Server and Client Backend are running.\n\n\`${err?.message || err}\``,
        source: "builtin_engine",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages(INITIAL_MESSAGES);
    if (isSpeaking) stopSpeaking();
    setShowHistory(false);
  };

  const toggleToolExpanded = (msgId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this saved conversation?")) {
      try {
        await api.deleteConversation(id);
        if (activeConvId === id) {
          handleNewChat();
        }
        refreshConversations();
      } catch (err) {
        console.error("Could not delete conversation:", err);
      }
    }
  };

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitleInput(conv.title);
  };

  const handleSaveRename = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!editTitleInput.trim()) return;
    try {
      await api.renameConversation(id, editTitleInput.trim());
      setEditingConvId(null);
      refreshConversations();
    } catch (err) {
      console.error("Could not rename conversation:", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5.5rem)] max-w-6xl mx-auto gap-4 relative">
      {/* Slide-out / Collapsible Conversation History Drawer */}
      {showHistory && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setShowHistory(false)}
        />
      )}

      <div
        className={`${
          showHistory ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none"
        } ${
          showHistory ? "w-72" : "w-0"
        } fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto transition-all duration-300 flex-shrink-0 bg-astra-surface/95 lg:bg-astra-surface/80 backdrop-blur-xl border-r border-astra-border p-4 flex flex-col justify-between overflow-hidden shadow-2xl lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Header of Drawer */}
          <div className="flex items-center justify-between pb-3 border-b border-astra-border/80">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <History className="w-4 h-4 text-astra-cyan" />
              <span>Conversation History</span>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 rounded-lg text-astra-muted hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-astra-violet to-astra-purple text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-glow-violet hover:opacity-95 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Conversation</span>
          </button>

          {/* Conversations List */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-1.5 pr-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-astra-muted">
                No saved conversations yet.
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConvId === conv.id;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => !isEditing && loadConversation(conv.id)}
                    className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? "bg-astra-violet/20 border-astra-violet/40 text-white"
                        : "bg-white/5 border-white/5 text-astra-lavender hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          className="w-full bg-black/40 border border-astra-violet/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveRename(e, conv.id)}
                          className="p-1 rounded bg-astra-violet text-white hover:bg-astra-purple"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs font-medium truncate">
                          <span className="truncate pr-2">{conv.title}</span>
                          <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => handleStartRename(e, conv)}
                              className="p-1 rounded hover:bg-white/10 text-astra-muted hover:text-white"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv.id)}
                              className="p-1 rounded hover:bg-rose-500/20 text-astra-muted hover:text-rose-300"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[10px] text-astra-muted mt-1">
                          {new Date(conv.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Assistant Chat Container */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Bar with Orb and Controls */}
        <div className="flex items-center justify-between pb-3 px-2 border-b border-astra-border/60">
          <div className="flex items-center gap-3">
            <Orb state={orbState} size="sm" showBadge={false} />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>ASTRA Assistant</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-astra-violet/20 text-astra-lavender border border-astra-violet/30">
                  Live MCP
                </span>
              </div>
              <div className="text-[11px] text-astra-muted">
                {orbState === "listening" && "Listening to your voice..."}
                {orbState === "processing" && "Processing request..."}
                {orbState === "speaking" && "Speaking response..."}
                {orbState === "idle" && "Ready for requests"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* History Drawer Toggle Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                showHistory
                  ? "bg-astra-violet/20 text-white border-astra-violet/40"
                  : "bg-white/5 text-astra-muted border-white/10 hover:text-white"
              }`}
              title="Toggle Conversation History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History ({conversations.length})</span>
            </button>

            {/* Auto Speak Toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                autoSpeak
                  ? "bg-astra-teal/20 text-astra-teal border-astra-teal/40"
                  : "bg-white/5 text-astra-muted border-white/10 hover:text-white"
              }`}
              title="Toggle read responses aloud automatically"
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Auto-Speech</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-astra-muted hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
              title="Start fresh conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{speechError}</span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const isExpanded = !!expandedTools[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-astra-muted">
                  <span>{isUser ? "You" : msg.providerName || "ASTRA AI"}</span>
                  {msg.source === "mcp_tool" && (
                    <span className="inline-flex items-center gap-1 text-astra-cyan font-mono text-[10px]">
                      <Terminal className="w-2.5 h-2.5" /> MCP Tool
                    </span>
                  )}
                  <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-gradient-to-r from-astra-violet to-astra-purple text-white rounded-tr-none font-medium"
                      : "bg-astra-surface/90 border border-white/10 text-astra-white rounded-tl-none"
                  }`}
                >
                  {/* Clean Natural Text Content */}
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.content}
                  </div>

                  {/* Discreet MCP Tool Execution Drawer (Collapsed by default) */}
                  {msg.toolCall && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <button
                        onClick={() => toggleToolExpanded(msg.id)}
                        className="flex items-center gap-1.5 text-xs font-mono text-astra-lavender hover:text-white transition-colors"
                      >
                        <Terminal className="w-3 h-3 text-astra-cyan" />
                        <span>MCP Tool: {msg.toolCall.name}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-astra-muted" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-astra-muted" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2">
                          <ToolResultCard toolCall={msg.toolCall} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Controls for Assistant Messages */}
                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-astra-muted opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2">
                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                          title="Copy message text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Read Aloud */}
                        <button
                          onClick={() => speak(msg.content)}
                          className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                          title="Speak response aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Speak</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-astra-muted font-mono">
                        {msg.source === "mcp_tool" ? "Protocol 2025-11-25" : "ASTRA Core"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggested Follow-up Prompts */}
                {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                    {msg.suggestedFollowUps.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt)}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-astra-lavender hover:bg-astra-violet/20 hover:border-astra-violet/40 hover:text-white transition-all text-left"
                      >
                        {prompt} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-start space-y-1">
              <div className="text-[11px] text-astra-muted px-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-astra-cyan animate-spin" />
                <span>Thinking...</span>
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-astra-surface/90 border border-white/10 text-sm text-astra-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-astra-cyan animate-ping" />
                <span className="w-2 h-2 rounded-full bg-astra-violet animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-astra-purple animate-bounce" />
                <span className="text-xs font-mono ml-2">Executing query...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer Input Bar */}
        <div className="pt-2 pb-1 border-t border-astra-border/60">
          <div className="relative rounded-2xl bg-astra-surface border border-white/10 focus-within:border-astra-violet/60 focus-within:ring-1 focus-within:ring-astra-violet/60 shadow-lg p-2 transition-all">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening... speak now"
                  : "Ask ASTRA AI anything..."
              }
              className="w-full bg-transparent text-sm text-white placeholder-astra-muted focus:outline-none resize-none px-2 py-1 max-h-32"
            />

            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-2 text-xs text-astra-muted">
                {/* Mic Speech Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs ${
                      isListening
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse"
                        : "bg-white/5 border-white/10 text-astra-muted hover:text-white hover:bg-white/10"
                    }`}
                    title={isListening ? "Stop listening" : "Click to speak with microphone"}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 text-rose-400" />
                        <span className="text-[11px] font-medium hidden sm:inline">Listening...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span className="text-[11px] hidden sm:inline">Voice</span>
                      </>
                    )}
                  </button>
                )}

                <span className="text-[11px] text-astra-muted hidden md:inline">
                  Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px] font-mono">Enter ↵</kbd> to send
                </span>
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`px-4 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all ${
                  input.trim() && !isLoading
                    ? "bg-gradient-to-r from-astra-violet to-astra-purple text-white shadow-glow-violet hover:opacity-95"
                    : "bg-white/5 text-astra-muted cursor-not-allowed"
                }`}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
