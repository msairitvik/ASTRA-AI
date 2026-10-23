export type IntentType =
  | "GREETING"
  | "HELP"
  | "TIME_DATE"
  | "CALCULATE"
  | "CREATE_TASK"
  | "LIST_TASKS"
  | "COMPLETE_TASK"
  | "CREATE_NOTE"
  | "SEARCH_NOTES"
  | "PRODUCTIVITY"
  | "WEATHER"
  | "CONVERT_UNITS"
  | "WEB_SEARCH"
  | "CONVERSATIONAL";

export interface ParsedIntent {
  type: IntentType;
  toolName?: string;
  toolArgs?: Record<string, any>;
  confidence: number;
}

const TIMEZONE_MAP: Record<string, string> = {
  india: "Asia/Kolkata",
  indian: "Asia/Kolkata",
  ist: "Asia/Kolkata",
  delhi: "Asia/Kolkata",
  mumbai: "Asia/Kolkata",
  bengaluru: "Asia/Kolkata",
  bangalore: "Asia/Kolkata",
  kolkata: "Asia/Kolkata",
  hyderabad: "Asia/Kolkata",
  chennai: "Asia/Kolkata",
  vizianagaram: "Asia/Kolkata",
  visakhapatnam: "Asia/Kolkata",
  lucknow: "Asia/Kolkata",
  tokyo: "Asia/Tokyo",
  japan: "Asia/Tokyo",
  jst: "Asia/Tokyo",
  london: "Europe/London",
  uk: "Europe/London",
  england: "Europe/London",
  gmt: "GMT",
  bst: "Europe/London",
  "new york": "America/New_York",
  new_york: "America/New_York",
  nyc: "America/New_York",
  est: "America/New_York",
  edt: "America/New_York",
  california: "America/Los_Angeles",
  "los angeles": "America/Los_Angeles",
  "san francisco": "America/Los_Angeles",
  pst: "America/Los_Angeles",
  pdt: "America/Los_Angeles",
  seattle: "America/Los_Angeles",
  chicago: "America/Chicago",
  cst: "America/Chicago",
  paris: "Europe/Paris",
  france: "Europe/Paris",
  berlin: "Europe/Berlin",
  germany: "Europe/Berlin",
  sydney: "Australia/Sydney",
  australia: "Australia/Sydney",
  melbourne: "Australia/Melbourne",
  dubai: "Asia/Dubai",
  uae: "Asia/Dubai",
  singapore: "Asia/Singapore",
  toronto: "America/Toronto",
  canada: "America/Toronto",
};

export class IntentRouter {
  public static route(input: string, clientTimezone?: string): ParsedIntent {
    const text = input.trim();
    const clean = text.replace(/[!.,?~😊👋]/g, "").trim().toLowerCase();
    const lower = text.toLowerCase();

    // 1. Greetings (Flexible regex matching hello, helloo, hi, hiii, hey, heyy, good morning, etc.)
    if (this.isGreeting(clean)) {
      return {
        type: "GREETING",
        confidence: 0.98,
      };
    }

    // 2. Explicit Help & Capabilities Requests
    if (
      lower === "help" ||
      lower === "help me" ||
      lower.includes("what can you do") ||
      lower.includes("what are your capabilities") ||
      lower.includes("what are your features") ||
      lower.includes("how do i use this") ||
      lower.includes("show capabilities") ||
      lower.includes("list capabilities") ||
      lower === "what are your tools"
    ) {
      return {
        type: "HELP",
        confidence: 0.95,
      };
    }

    // 3. Time & Date Requests
    // Examples: "I wanted the time in India", "What time is it in Tokyo", "time in India", "what is the date", "what time is it?"
    const timeMatch = lower.match(
      /(?:what(?:'s| is) the (?:current )?time|what time is it|time|current time|tell me the time|i wanted the time|can you tell me the time|what is (?:today's )?date|what date is it|what day is (?:it|today))(?:\s+(?:in|for|at|of)\s+([a-zA-Z\s_]+))?/i
    ) || lower.match(/(?:time in|time at|time for)\s+([a-zA-Z\s_]+)/i);

    if (
      timeMatch ||
      lower.includes("what time is it") ||
      lower.includes("what's the time") ||
      lower.includes("current time") ||
      lower === "what is today's date" ||
      lower === "what is the date"
    ) {
      let rawLoc = (timeMatch && timeMatch[1]) ? timeMatch[1].trim().replace(/[?.!]/g, "") : "";

      // Also check if sentence ends with "in [Location]"
      if (!rawLoc) {
        const inMatch = lower.match(/\b(?:in|at|for)\s+([a-zA-Z\s_]+)[?.!]*$/i);
        if (inMatch) {
          rawLoc = inMatch[1].trim().replace(/[?.!]/g, "");
        }
      }

      let tz = clientTimezone || "Asia/Kolkata";
      if (rawLoc) {
        const mapped = TIMEZONE_MAP[rawLoc.toLowerCase()];
        if (mapped) {
          tz = mapped;
        } else if (rawLoc.includes("/")) {
          tz = rawLoc;
        } else {
          tz = rawLoc;
        }
      }

      return {
        type: "TIME_DATE",
        toolName: "get_current_datetime",
        toolArgs: { timezone_str: tz },
        confidence: 0.95,
      };
    }

    // 4. Weather Intent
    // Examples: "What is the weather in Seattle", "weather in Lucknow", "how's the weather in London", "weather of Mumbai", "is it raining in Tokyo"
    const weatherMatch =
      lower.match(/(?:what(?:'s| is) the weather(?: like)? in|forecast for|weather in|weather of|weather at|how is the weather in|how's the weather in|temperature in|is it raining in)\s+([a-zA-Z\s]+)/i) ||
      lower.match(/^([a-zA-Z\s]+)\s+weather[?.!]*$/i);

    if (weatherMatch && weatherMatch[1]) {
      const city = weatherMatch[1].trim().replace(/[?.!]/g, "");
      return {
        type: "WEATHER",
        toolName: "get_weather",
        toolArgs: { city },
        confidence: 0.95,
      };
    }

    // Special weather query: "What's the weather here?" or "weather today"
    if (lower.includes("weather here") || lower === "weather" || lower === "what's the weather" || lower === "how is the weather") {
      return {
        type: "WEATHER",
        toolName: "get_weather",
        toolArgs: { city: "current_location" },
        confidence: 0.85,
      };
    }

    // 5. Unit Conversion Intent
    // Examples: "convert 10 miles to km", "convert 100 celsius to fahrenheit", "convert 500 mb to gb"
    const convertMatch = lower.match(/convert\s+([0-9.]+)\s*([a-zA-Z]+)\s+(?:to|in|into)\s+([a-zA-Z]+)/i);
    if (convertMatch) {
      const value = parseFloat(convertMatch[1]);
      const fromUnit = convertMatch[2];
      const toUnit = convertMatch[3];
      return {
        type: "CONVERT_UNITS",
        toolName: "convert_units",
        toolArgs: { value, from_unit: fromUnit, to_unit: toUnit },
        confidence: 0.95,
      };
    }

    // 6. Mathematical Calculation Intent
    // Examples: "calculate 25 * 4 + 10", "calculate 245 * 38", "what is 15 * 15", "what is sqrt(144) * 25"
    const isPureMathExpr = /^[\d\s+\-*/^().,%]+$/.test(lower) && /\d/.test(lower) && /[+\-*/^%]/.test(lower);
    const hasMathOperatorsAndNumbers =
      (/\d|\bpi\b|\be\b/.test(lower)) &&
      (/[+\-*/^%]|\bsqrt\b|\bsin\b|\bcos\b|\btan\b|\babs\b|square root/i.test(lower));

    if (
      lower.startsWith("calculate ") ||
      lower.startsWith("evaluate ") ||
      isPureMathExpr ||
      ((lower.startsWith("what is ") || lower.startsWith("what's ")) && hasMathOperatorsAndNumbers)
    ) {
      let expr = text
        .replace(/^calculate\s+/i, "")
        .replace(/^evaluate\s+/i, "")
        .replace(/^what is\s+/i, "")
        .replace(/^what's\s+/i, "")
        .replace(/[?]/g, "")
        .trim();

      expr = expr.replace(/square root of\s*(\d+)/i, "sqrt($1)");

      if (expr.length > 0) {
        return {
          type: "CALCULATE",
          toolName: "calculate",
          toolArgs: { expression: expr },
          confidence: 0.92,
        };
      }
    }

    // 7. Productivity Summary Intent
    if (
      lower.includes("productivity summary") ||
      lower.includes("how am i doing with my tasks") ||
      lower.includes("my task statistics") ||
      lower.includes("my progress") ||
      lower.includes("completion rate") ||
      lower.includes("productivity overview")
    ) {
      return {
        type: "PRODUCTIVITY",
        toolName: "get_productivity_summary",
        toolArgs: {},
        confidence: 0.95,
      };
    }

    // 8. Complete Task Intent
    const completeMatch = lower.match(/(?:complete|finish|mark done|mark complete)\s+(?:task\s+)?([a-zA-Z0-9-]+)/i);
    if (completeMatch && !lower.includes("create") && !lower.includes("add")) {
      const taskId = completeMatch[1].trim();
      return {
        type: "COMPLETE_TASK",
        toolName: "complete_task",
        toolArgs: { task_id: taskId },
        confidence: 0.88,
      };
    }

    // 8.5 Web Search Intent (when user asks for latest news, search query, or current developments)
    const isSearchExplicit = /^(?:search\s+(?:the\s+web\s+)?for|web\s+search(?::|\s+for)?|look\s+up|google)\s+(.+)/i.exec(text);
    const hasNewsKeywords = /\b(latest|recent|breaking)\b.*?\b(news|developments|headlines|updates)\b/i.test(text);

    if (isSearchExplicit) {
      const q = isSearchExplicit[1].trim();
      return {
        type: "WEB_SEARCH",
        toolName: "web_search",
        toolArgs: { query: q, max_results: 5 },
        confidence: 0.95,
      };
    }

    if (hasNewsKeywords) {
      let searchTopic = text.replace(/^(?:tell\s+me\s+)?(?:the\s+)?/i, "").replace(/[?.!]+$/, "").trim();
      return {
        type: "WEB_SEARCH",
        toolName: "web_search",
        toolArgs: { query: searchTopic, max_results: 5 },
        confidence: 0.94,
      };
    }

    // 9. Create Task Intent
    // Examples: "create task: Review budget", "add task: Call dentist", "remind me to study tomorrow"
    const taskCreateMatch =
      lower.match(/(?:create|add|new)\s+(?:a\s+)?task(?::|\s+to|\s+called|\s+titled)?\s+(.+)/i) ||
      lower.match(/(?:remind me to)\s+(.+)/i);

    if (taskCreateMatch) {
      let rawTitle = taskCreateMatch[1].trim();
      let priority = "medium";
      let category = "general";
      let dueDate = "";

      if (lower.includes("urgent") || lower.includes("asap")) priority = "urgent";
      else if (lower.includes("high priority") || lower.includes("important")) priority = "high";
      else if (lower.includes("low priority")) priority = "low";

      rawTitle = rawTitle.replace(/(with\s+)?(urgent|high|low|medium)\s+priority/i, "").trim();

      return {
        type: "CREATE_TASK",
        toolName: "create_task",
        toolArgs: {
          title: rawTitle,
          description: "",
          priority,
          due_date: dueDate,
          category,
        },
        confidence: 0.9,
      };
    }

    // 10. List Tasks Intent
    if (
      lower.includes("list tasks") ||
      lower.includes("show my tasks") ||
      lower.includes("what are my tasks") ||
      lower.includes("what tasks do i have") ||
      lower.includes("pending tasks") ||
      lower.includes("show tasks")
    ) {
      let status = "";
      if (lower.includes("pending")) status = "pending";
      else if (lower.includes("completed") || lower.includes("done")) status = "completed";

      return {
        type: "LIST_TASKS",
        toolName: "list_tasks",
        toolArgs: { status },
        confidence: 0.9,
      };
    }

    // 11. Create Note Intent
    const noteCreateMatch = lower.match(/(?:create|save|take|new)\s+(?:a\s+)?note(?::|\s+titled|\s+about)?\s+(.+)/i);
    if (noteCreateMatch) {
      const noteParts = noteCreateMatch[1].split(/:\s*|body:\s*|content:\s*/i);
      const title = noteParts[0].trim();
      const content = noteParts.length > 1 ? noteParts.slice(1).join(" ").trim() : title;

      return {
        type: "CREATE_NOTE",
        toolName: "create_note",
        toolArgs: {
          title,
          content,
          category: "general",
          tags: "assistant",
        },
        confidence: 0.9,
      };
    }

    // 12. Search Notes Intent
    const searchNoteMatch = lower.match(/(?:search|find|lookup)\s+(?:notes?\s+(?:for|about)?\s+)?(.+)/i);
    if (searchNoteMatch && (lower.includes("note") || lower.includes("notes"))) {
      const query = searchNoteMatch[1].replace(/notes?\s+(?:for|about)?/i, "").trim();
      return {
        type: "SEARCH_NOTES",
        toolName: "search_notes",
        toolArgs: { query },
        confidence: 0.85,
      };
    }

    // Default: General Conversation, Learning, Technical Q&A, Opinions, Writing
    return {
      type: "CONVERSATIONAL",
      confidence: 0.5,
    };
  }

  private static isGreeting(clean: string): boolean {
    if (/^h+e+l+l+o+$/i.test(clean)) return true;
    if (/^h+i+$/i.test(clean)) return true;
    if (/^h+e+y+$/i.test(clean)) return true;
    if (/^y+o+$/i.test(clean)) return true;
    if (/^greetings?$/i.test(clean)) return true;
    if (/^howdy$/i.test(clean)) return true;
    if (/^(good\s+(morning|afternoon|evening|day)|morning|evening)$/i.test(clean)) return true;
    if (/^(hi|hello|hey|yo)\s+astra$/i.test(clean)) return true;
    if (/^what'?s\s+up$/i.test(clean)) return true;
    return false;
  }
}
