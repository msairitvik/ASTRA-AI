import { mcpClientManager } from "../mcp-client/client.js";
import { IntentRouter, ParsedIntent } from "./intent-router.js";
import { config } from "../config/index.js";
import { LLMProviderService } from "./llm-provider.js";
import type { ChatHistoryMessage } from "./llm-provider.js";
import { ConversationalEngine } from "./conversational-engine.js";

export type { ChatHistoryMessage };

export interface ChatResponse {
  conversationId: string;
  message: string;
  source: "mcp_tool" | "llm_provider" | "builtin_engine";
  providerName?: string;
  toolCall?: {
    name: string;
    arguments: Record<string, any>;
    result: any;
    executionTimeMs: number;
    success: boolean;
  };
  suggestedFollowUps?: string[];
  dataPayload?: any;
}

export class AssistantService {
  public static async processMessage(
    userMessage: string,
    conversationId?: string,
    clientTimezone?: string,
    clientLocation?: string,
    history: ChatHistoryMessage[] = []
  ): Promise<ChatResponse> {
    const trimmed = userMessage.trim();

    // 1. Ensure conversation exists in SQLite
    let activeConvId: string = conversationId || "";
    if (!activeConvId) {
      const convOutcome = await mcpClientManager.callTool("create_conversation", {
        title: trimmed.length > 30 ? trimmed.slice(0, 30) + "..." : trimmed,
      });
      activeConvId = (convOutcome.result?.conversation?.id as string) || ("conv-" + Date.now());
    }

    // Populate effective history either from provided array or by retrieving persisted messages from SQLite
    let effectiveHistory: ChatHistoryMessage[] = [...history];
    if (effectiveHistory.length === 0 && conversationId) {
      try {
        const convRes = await mcpClientManager.callTool("get_conversation", { conversation_id: conversationId });
        const existingMsgs = convRes.result?.conversation?.messages || [];
        effectiveHistory = existingMsgs
          .filter((m: any) => m.role === "user" || m.role === "assistant" || m.role === "system")
          .map((m: any) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content as string,
          }));
      } catch (e) {
        // Safe fallback
      }
    }

    // 2. Persist incoming user message to SQLite
    try {
      await mcpClientManager.callTool("add_message", {
        conversation_id: activeConvId,
        role: "user",
        content: trimmed,
      });
    } catch (e) {
      console.warn("[AssistantService] Could not persist user message:", e);
    }

    if (!trimmed) {
      const emptyReply = "Hello! How can I help you today?";
      return {
        conversationId: activeConvId,
        message: emptyReply,
        source: "builtin_engine",
        providerName: "ASTRA Core",
        suggestedFollowUps: ["Tell me something interesting", "What time is it in India?", "Show my tasks"],
      };
    }

    // 3. Route Intent with client timezone
    const intent: ParsedIntent = IntentRouter.route(trimmed, clientTimezone);

    // 3.5 Personal Introductions & Status/Wellbeing Responses
    // Personal rapport anchors ("Myself Ritvik. What about you?", "I am fine", "how are you")
    const directEng = ConversationalEngine.handle(trimmed, effectiveHistory);
    if (
      directEng.topicContext?.startsWith("user_name:") ||
      /glad to hear/i.test(directEng.text) ||
      /thanks for asking/i.test(directEng.text)
    ) {
      // If Gemini is configured, allow it to generate the live personalized response
      if (config.geminiApiKey) {
        let contextNote = "";
        if (directEng.topicContext?.startsWith("user_name:")) {
          const userName = directEng.topicContext.replace("user_name:", "").trim();
          contextNote = `The user introduced their name as ${userName}. Greet them warmly by name, confirm your identity is ASTRA AI, and answer any reciprocal questions they asked.`;
        }
        const llm = await LLMProviderService.generateResponse(trimmed, effectiveHistory, contextNote);
        if (llm.success && llm.text) {
          await this.persistAssistantMessage(activeConvId, llm.text);
          return {
            conversationId: activeConvId,
            message: llm.text,
            source: "llm_provider",
            providerName: llm.providerName,
            suggestedFollowUps: directEng.suggestedFollowUps || ["Tell me something interesting", "How should I organize my day?", "What time is it?"],
          };
        }
      }

      await this.persistAssistantMessage(activeConvId, directEng.text);
      return {
        conversationId: activeConvId,
        message: directEng.text,
        source: "builtin_engine",
        providerName: "ASTRA Core",
        suggestedFollowUps: directEng.suggestedFollowUps,
      };
    }

    // 4. Handle GREETINGS
    if (intent.type === "GREETING") {
      // When Gemini is configured as primary, strictly route through Gemini without silent fallbacks
      if (config.aiProvider === "gemini" && config.geminiApiKey) {
        const llm = await LLMProviderService.generateResponse(trimmed, effectiveHistory);
        if (llm.success && llm.text) {
          await this.persistAssistantMessage(activeConvId, llm.text);
          return {
            conversationId: activeConvId,
            message: llm.text,
            source: "llm_provider",
            providerName: llm.providerName,
            suggestedFollowUps: ["Tell me something interesting", "How should I organize my day?", "What time is it?"],
          };
        } else {
          const honestMsg = `⚠️ **${llm.providerName || "Google Gemini"} Error**: ${llm.errorMsg || "Request failed"}`;
          await this.persistAssistantMessage(activeConvId, honestMsg);
          return {
            conversationId: activeConvId,
            message: honestMsg,
            source: "llm_provider",
            providerName: llm.providerName || "Google Gemini",
            suggestedFollowUps: ["Check system status", "What time is it in India?", "Show my tasks"],
          };
        }
      }

      // If OpenAI is configured in auto mode
      if (config.openaiApiKey) {
        const llm = await LLMProviderService.generateResponse(trimmed, effectiveHistory);
        if (llm.success && llm.text) {
          await this.persistAssistantMessage(activeConvId, llm.text);
          return {
            conversationId: activeConvId,
            message: llm.text,
            source: "llm_provider",
            providerName: llm.providerName,
            suggestedFollowUps: ["Tell me something interesting", "How should I organize my day?", "What time is it?"],
          };
        }
      }

      const engineGreeting = ConversationalEngine.handle(trimmed, effectiveHistory);
      await this.persistAssistantMessage(activeConvId, engineGreeting.text);
      return {
        conversationId: activeConvId,
        message: engineGreeting.text,
        source: "builtin_engine",
        providerName: "ASTRA Core",
        suggestedFollowUps: engineGreeting.suggestedFollowUps,
      };
    }

    // 5. Handle EXPLICIT HELP REQUESTS
    if (intent.type === "HELP") {
      const helpReply =
        `I am **ASTRA AI**, your general-purpose personal assistant. Here is what I can help you with:\n\n` +
        `• 💬 **Conversations & Learning:** Discuss ideas, explain programming (C++, Java, Python, React), science concepts, and brainstorming.\n` +
        `• ⏱️ **World Time & Dates:** *"What time is it in India?"*, *"Time in Tokyo"*, *"What is today's date?"*\n` +
        `• 🌤️ **Live Weather:** *"What's the weather in Seattle?"*, *"Weather in Lucknow"*\n` +
        `• 🔢 **Calculations & Math:** *"Calculate 245 * 38"*, *"Calculate sqrt(144) * 25"*\n` +
        `• 📌 **Tasks & Priorities:** *"Create task: Finish report"*, *"Remind me to study tomorrow"*, *"Show my tasks"*\n` +
        `• 📝 **Notes & Knowledge:** *"Save note: Project roadmap"*, *"Search notes for architecture"*\n` +
        `• 🔄 **Unit Conversions:** *"Convert 10 miles to km"*, *"Convert 100 celsius to fahrenheit"*\n` +
        `• 📊 **Productivity Metrics:** *"Show my productivity summary"*\n\n` +
        `Feel free to ask a question, start a conversation, or request an action!`;

      await this.persistAssistantMessage(activeConvId, helpReply);
      return {
        conversationId: activeConvId,
        message: helpReply,
        source: "builtin_engine",
        providerName: "ASTRA Core",
        suggestedFollowUps: [
          "Tell me something interesting",
          "What time is it in India?",
          "Explain recursion in C++",
          "Show my tasks",
        ],
      };
    }

    // 5.5 Handle Movie Recommendations (Factual, Verified Search, Exclude Previously Recommended)
    if (this.isMovieRecommendationRequest(trimmed)) {
      const excludedMovies = this.extractRecommendedMoviesFromHistory(effectiveHistory);

      // If Gemini or cloud LLM is configured, search for verified movie data and synthesize via Gemini
      if (config.geminiApiKey || config.openaiApiKey) {
        try {
          const searchQuery = trimmed.toLowerCase().includes("sci-fi")
            ? "top critically acclaimed sci-fi movies to watch"
            : "top critically acclaimed movies recommendations";
          const searchRes = await mcpClientManager.callTool("web_search", {
            query: searchQuery,
            max_results: 5,
          });

          let toolContext = `Verified Real-World Search Data on Movies:\n${JSON.stringify(searchRes.result?.results || [])}\n\n`;
          if (excludedMovies.length > 0) {
            toolContext += `Previously Recommended Movies in this conversation (DO NOT recommend these again, suggest fresh, distinct titles): [${excludedMovies.join(", ")}].\n`;
          }
          toolContext += `Please recommend 4-5 high-quality, verified movies with accurate release years, genres, and a brief factual premise. Do not fabricate release years or movie facts.`;

          const llm = await LLMProviderService.generateResponse(trimmed, effectiveHistory, toolContext);
          if (llm.success && llm.text) {
            await this.persistAssistantMessage(activeConvId, llm.text);
            return {
              conversationId: activeConvId,
              message: llm.text,
              source: "llm_provider",
              providerName: llm.providerName,
              suggestedFollowUps: [
                "Which one is best for beginners?",
                "Suggest some sci-fi thrillers",
                "Recommend more movies",
              ],
            };
          }
        } catch (e) {
          console.warn("[AssistantService] Movie recommendation search/synthesis error:", e);
        }
      }

      // Offline / Local Engine fallback for movie recommendations
      const movieReply = ConversationalEngine.handleMovieRecommendations(trimmed, effectiveHistory, excludedMovies);
      await this.persistAssistantMessage(activeConvId, movieReply.text);
      return {
        conversationId: activeConvId,
        message: movieReply.text,
        source: "builtin_engine",
        providerName: "ASTRA Core",
        suggestedFollowUps: movieReply.suggestedFollowUps,
      };
    }

    // 6. Handle Practical Tool Execution via MCP
    if (intent.toolName && intent.toolArgs) {
      if (intent.toolName === "get_weather" && intent.toolArgs.city === "current_location") {
        if (clientLocation) {
          intent.toolArgs.city = clientLocation;
        } else {
          const askLocReply = "Which city would you like the weather forecast for? (For example: Seattle, Lucknow, Mumbai, or Tokyo).";
          await this.persistAssistantMessage(activeConvId, askLocReply);
          return {
            conversationId: activeConvId,
            message: askLocReply,
            source: "builtin_engine",
            suggestedFollowUps: ["Weather in Seattle", "Weather in Lucknow", "Weather in Tokyo"],
          };
        }
      }

      const toolRes = await mcpClientManager.callTool(intent.toolName, intent.toolArgs);

      const chatResponse = this.formatToolResponse(
        activeConvId,
        intent.toolName,
        intent.toolArgs,
        toolRes.result,
        toolRes.executionTimeMs,
        toolRes.success,
        toolRes.error
      );

      // For web_search (or when cloud LLM is configured), synthesize an organic response
      const shouldSynthesize = intent.toolName === "web_search" || ((config.geminiApiKey || config.openaiApiKey) && intent.toolName !== "calculate" && intent.toolName !== "get_current_datetime");
      if (shouldSynthesize && toolRes.success) {
        try {
          const toolSynthesis = await LLMProviderService.generateResponse(
            trimmed,
            effectiveHistory,
            JSON.stringify(toolRes.result)
          );
          if (toolSynthesis.success && toolSynthesis.text) {
            chatResponse.message = toolSynthesis.text;
            chatResponse.source = "llm_provider";
            chatResponse.providerName = toolSynthesis.providerName;
          }
        } catch {
          // Fall back gracefully to baseline formatted response
        }
      }

      await this.persistAssistantMessage(
        activeConvId,
        chatResponse.message,
        chatResponse.toolCall ? { name: intent.toolName, args: intent.toolArgs } : undefined,
        chatResponse.toolCall?.result
      );

      return chatResponse;
    }

    // 7. General Conversational / Knowledge / Educational / Brainstorming
    // Attempt configured general-purpose LLM (Gemini -> OpenAI -> Local Ollama)
    const llmResult = await LLMProviderService.generateResponse(trimmed, effectiveHistory);
    if (llmResult.success && llmResult.text) {
      await this.persistAssistantMessage(activeConvId, llmResult.text);
      return {
        conversationId: activeConvId,
        message: llmResult.text,
        source: "llm_provider",
        providerName: llmResult.providerName,
        suggestedFollowUps: [
          "Tell me more",
          "Give me an example",
          "Save this as a note",
          "Suggest some project ideas",
        ],
      };
    }

    // When AI_PROVIDER is explicitly 'gemini', do not silently fall back to ASTRA Core on error
    if (config.aiProvider === "gemini" && llmResult.errorType) {
      const honestMsg = `⚠️ **${llmResult.providerName || "Google Gemini"} Error**: ${llmResult.errorMsg}`;
      await this.persistAssistantMessage(activeConvId, honestMsg);
      return {
        conversationId: activeConvId,
        message: honestMsg,
        source: "llm_provider",
        providerName: llmResult.providerName || "Google Gemini",
        suggestedFollowUps: ["Check system status", "What time is it in India?", "Show my tasks"],
      };
    }

    // In auto mode, if quota was exceeded or key was invalid, report honest error
    if (llmResult.errorType === "quota_exceeded" || llmResult.errorType === "invalid_key") {
      const honestMsg = `⚠️ **${llmResult.providerName || "Google Gemini"} Error**: ${llmResult.errorMsg}`;
      await this.persistAssistantMessage(activeConvId, honestMsg);
      return {
        conversationId: activeConvId,
        message: honestMsg,
        source: "llm_provider",
        providerName: llmResult.providerName,
        suggestedFollowUps: ["Check system status", "What time is it in India?", "Show my tasks"],
      };
    }

    // 8. Built-in Conversational & Knowledge Engine (Offline / Local / Zero-Key Mode)
    const engineReply = ConversationalEngine.handle(trimmed, effectiveHistory);
    await this.persistAssistantMessage(activeConvId, engineReply.text);

    return {
      conversationId: activeConvId,
      message: engineReply.text,
      source: "builtin_engine",
      providerName: "ASTRA Core",
      suggestedFollowUps: engineReply.suggestedFollowUps,
    };
  }

  private static async persistAssistantMessage(
    conversationId: string,
    content: string,
    toolCall?: any,
    toolResult?: any
  ) {
    try {
      await mcpClientManager.callTool("add_message", {
        conversation_id: conversationId,
        role: "assistant",
        content,
        tool_calls: toolCall ? JSON.stringify(toolCall) : "",
        tool_results: toolResult ? JSON.stringify(toolResult) : "",
      });
    } catch (e) {
      console.warn("[AssistantService] Could not persist assistant message:", e);
    }
  }

  private static formatToolResponse(
    conversationId: string,
    toolName: string,
    toolArgs: Record<string, any>,
    result: any,
    executionTimeMs: number,
    success: boolean,
    error?: string
  ): ChatResponse {
    let message = "";
    let followUps: string[] = [];

    if (!success || error) {
      return {
        conversationId,
        message: `I encountered an issue executing that tool: ${error || "Unknown protocol execution error"}`,
        source: "mcp_tool",
        toolCall: {
          name: toolName,
          arguments: toolArgs,
          result: { error: error || "Operation failed" },
          executionTimeMs,
          success: false,
        },
      };
    }

    switch (toolName) {
      case "get_current_datetime": {
        const time12 = result?.time_12h || result?.time;
        const day = result?.day_of_week;
        const date = result?.date;
        const tz = result?.timezone || "UTC";

        let friendlyTz = tz;
        if (tz === "Asia/Kolkata") friendlyTz = "India (IST)";
        else if (tz === "Asia/Tokyo") friendlyTz = "Tokyo (JST)";
        else if (tz === "Europe/London") friendlyTz = "London (GMT/BST)";
        else if (tz === "America/New_York") friendlyTz = "New York (EST/EDT)";
        else if (tz === "America/Los_Angeles") friendlyTz = "California / Pacific (PST/PDT)";

        message = `The current time in **${friendlyTz}** is **${time12}** on **${day}, ${date}**.`;
        followUps = ["What's the weather in " + friendlyTz.split(" ")[0] + "?", "Show my tasks", "What is today's date?"];
        break;
      }

      case "calculate": {
        const rawRes = result?.result ?? result?.raw_result;
        const formattedRes = typeof rawRes === "number" ? Number(rawRes).toLocaleString() : rawRes;
        message = `The result of \`${result?.expression || toolArgs.expression}\` is **${formattedRes}**.`;
        followUps = ["Convert units", "Show my tasks", "What time is it?"];
        break;
      }

      case "create_task": {
        const task = result?.task || {};
        const prio = task.priority ? task.priority.toUpperCase() : "MEDIUM";
        message = `✅ I've added **${task.title}** to your tasks with **${prio}** priority.`;
        followUps = ["Show all tasks", "Complete this task", "Show productivity summary"];
        break;
      }

      case "list_tasks": {
        const tasks = result?.tasks || [];
        const count = result?.count ?? tasks.length;
        if (count === 0) {
          message = `You currently have no tasks matching that filter. Would you like to create one?`;
        } else {
          message = `Here are your current tasks (${count} total):\n\n`;
          tasks.slice(0, 8).forEach((t: any) => {
            const statusIcon = t.status === "completed" ? "✅" : "• [ ]";
            const prioBadge = t.priority === "urgent" ? "🔥 Urgent" : t.priority === "high" ? "⚠️ High" : "";
            message += `${statusIcon} **${t.title}** ${prioBadge ? `(${prioBadge})` : ""}\n`;
          });
          if (tasks.length > 8) {
            message += `\n*...and ${tasks.length - 8} more tasks on your Tasks page.*`;
          }
        }
        followUps = ["Show my productivity summary", "Add a new task"];
        break;
      }

      case "complete_task": {
        const task = result?.task || {};
        message = `🎉 I've marked **${task.title || "the task"}** as completed. Your productivity summary has been updated.`;
        followUps = ["Show remaining tasks", "Check productivity summary"];
        break;
      }

      case "create_note": {
        const note = result?.note || {};
        message = `📝 I've saved that as a note: **${note.title}** under category \`${note.category}\`.`;
        followUps = ["Show all notes", "Create another note", "Search notes"];
        break;
      }

      case "search_notes": {
        const notes = result?.notes || [];
        const q = toolArgs.query || "";
        if (notes.length === 0) {
          message = `I searched your notes for "${q}", but found no matching entries.`;
        } else {
          message = `Found **${notes.length}** note(s) matching "${q}":\n\n`;
          notes.forEach((n: any) => {
            message += `• **${n.title}** (${n.category})\n  ${n.content.slice(0, 100)}${n.content.length > 100 ? "..." : ""}\n`;
          });
        }
        followUps = ["Show all notes", "Create a note"];
        break;
      }

      case "get_productivity_summary": {
        const s = result?.summary || {};
        message =
          `Here is your productivity overview:\n\n` +
          `• **Completion Rate:** **${s.completion_rate_percent}%**\n` +
          `• **Total Tasks:** ${s.total_tasks} (${s.completed_tasks} completed, ${s.pending_tasks} pending)\n` +
          `• **Overdue:** ${s.overdue_tasks}\n` +
          `• **Saved Notes:** ${s.total_notes}\n` +
          `• **Recent Activities Logged:** ${s.recent_activity_count}`;
        followUps = ["Show my tasks", "Create task: Review priorities"];
        break;
      }

      case "get_weather": {
        const temp = result?.temperature;
        const condition = result?.condition;
        const city = result?.city;
        const region = result?.region;
        const wind = result?.wind_speed_kmh;
        const humidity = result?.humidity_percent;

        message = `Here is the current weather in **${city}**${region ? ` (${region})` : ""}: **${condition}**, **${temp?.celsius}°C** (${temp?.fahrenheit}°F), with **${humidity}%** humidity and winds at **${wind} km/h**.`;
        followUps = ["Weather in another city", "Show my tasks", "What time is it in " + city + "?"];
        break;
      }

      case "convert_units": {
        message = `**${result.input_value} ${result.from_unit}** is equal to **${result.result} ${result.to_unit}**.`;
        followUps = ["Convert another unit", "Calculate an equation"];
        break;
      }

      case "web_search": {
        const results = result?.results || [];
        const q = result?.query || toolArgs?.query || "";
        if (results.length === 0) {
          message = `I searched the web for **"${q}"**, but did not find any recent articles.`;
        } else {
          message = `Here are the latest search results for **"${q}"**:\n\n`;
          results.forEach((r: any, idx: number) => {
            const cleanTitle = r.title || "Source Link";
            const cleanSnippet = r.snippet ? `\n  ${r.snippet}` : "";
            message += `${idx + 1}. [${cleanTitle}](${r.url})${cleanSnippet}\n\n`;
          });
          message += `*Source URLs retrieved live via ASTRA Web Search.*`;
        }
        followUps = ["Tell me more about this", "Summarize the key points", "Search another topic"];
        break;
      }

      default: {
        message = `Completed ${toolName} successfully.`;
        break;
      }
    }

    return {
      conversationId,
      message,
      source: "mcp_tool",
      toolCall: {
        name: toolName,
        arguments: toolArgs,
        result,
        executionTimeMs,
        success: true,
      },
      suggestedFollowUps: followUps,
      dataPayload: result,
    };
  }

  private static isMovieRecommendationRequest(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes("movies to watch") ||
      lower.includes("suggest some movies") ||
      lower.includes("recommend movies") ||
      lower.includes("suggest me some movies") ||
      lower.includes("movie recommendations") ||
      ((lower.includes("movie") || lower.includes("movies") || lower.includes("film") || lower.includes("films")) &&
        (lower.includes("recommend") || lower.includes("suggest") || lower.includes("watch") || lower.includes("good") || lower.includes("best") || lower.includes("more") || lower.includes("other")))
    );
  }

  private static extractRecommendedMoviesFromHistory(history: ChatHistoryMessage[]): string[] {
    const titles: Set<string> = new Set();
    const knownMovies = [
      "Inception", "Interstellar", "Spirited Away", "Spider-Man: Into the Spider-Verse",
      "Knives Out", "The Dark Knight", "Dune", "Arrival", "Oppenheimer", "The Prestige",
      "Everything Everywhere All at Once", "Whiplash", "Parasite", "The Matrix",
      "Blade Runner 2049", "The Martian", "The Shawshank Redemption", "Good Will Hunting",
      "Pulp Fiction", "Forrest Gump", "Fight Club", "Goodfellas", "Gladiator", "The Departed", "Memento"
    ];

    for (const msg of history) {
      if (msg.role === "assistant") {
        for (const m of knownMovies) {
          if (msg.content.toLowerCase().includes(m.toLowerCase())) {
            titles.add(m);
          }
        }
        const boldMatches = msg.content.match(/\*\*([A-Za-z0-9\s:,'-]+)\*\*/g) || [];
        for (const b of boldMatches) {
          const clean = b.replace(/\*\*/g, "").trim();
          if (clean.length > 2 && clean.length < 40 && !clean.includes("Genre") && !clean.includes("Director") && !clean.includes("Year") && !clean.includes("Rating") && !clean.includes("Movies") && !clean.includes("Recommendations")) {
            titles.add(clean);
          }
        }
      }
    }
    return Array.from(titles);
  }
}
