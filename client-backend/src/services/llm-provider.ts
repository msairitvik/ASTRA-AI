import { GoogleGenAI } from "@google/genai";
import { config, providerHealth } from "../config/index.js";

export interface ChatHistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMResult {
  success: boolean;
  text?: string;
  providerName?: string;
  errorType?: "quota_exceeded" | "invalid_key" | "network_error" | "unconfigured" | "unknown";
  errorMsg?: string;
}

const ASTRA_SYSTEM_PROMPT = `You are ASTRA AI, an intelligent, conversational, warm, articulate, and reliable personal AI assistant inspired by Alexa and ChatGPT.
Your name is strictly ASTRA AI. Never claim to be the user or adopt the user's personal name.
You excel at casual conversation, deep explanations in computer science (C++, Java, Python, React, Spring Boot, databases, debugging), mathematics, science, everyday topics, storytelling, humor, and practical problem-solving.

Core behavioral guidelines:
1. Always respond naturally, directly, and conversationally. Match the user's tone.
2. For simple greetings or casual chatter, give a warm, brief reply. Never dump a menu of features.
3. For technical questions, provide clear explanations with well-structured examples and code.
4. When follow-up questions are asked, refer back to the context established in prior turns.
5. If a tool result is provided to you, interpret and summarize it naturally and warmly for the user. Do not output raw JSON or internal protocol terms.
6. When recommending movies, books, or real-world media, provide accurate release years, genres, and brief context without fabricating facts. If asked for more, suggest distinct titles not previously recommended.
7. Format your responses with clean GitHub-flavored Markdown (bolding, code blocks, lists where appropriate).
8. Be helpful, polite, and human-friendly without pretending to be a biological human.`;

export class LLMProviderService {
  public static async generateResponse(
    prompt: string,
    history: ChatHistoryMessage[] = [],
    toolContext?: string
  ): Promise<LLMResult> {
    const provider = config.aiProvider || "gemini";

    // 1. Explicitly configured for Gemini (Default Primary)
    if (provider === "gemini") {
      if (config.geminiApiKey) {
        return this.callGemini(prompt, history, toolContext);
      }
      // Missing API key honest reporting
      providerHealth.configured = false;
      providerHealth.lastError = "GEMINI_API_KEY is not configured in server environment.";
      providerHealth.lastErrorType = "unconfigured";
      return {
        success: false,
        errorType: "unconfigured",
        providerName: `Google Gemini (${config.geminiModel}) [Unconfigured]`,
        errorMsg:
          "Google Gemini is configured as ASTRA's primary AI provider, but `GEMINI_API_KEY` is not set.\n\n" +
          "• Get your API key: https://aistudio.google.com/app/apikey\n" +
          "• Set in .env: GEMINI_API_KEY=your_api_key_here\n" +
          "• (Optional) To use local Ollama offline: set AI_PROVIDER=ollama in .env",
      };
    }

    // 2. Explicitly configured for OpenAI
    if (provider === "openai") {
      if (config.openaiApiKey) {
        return this.callOpenAI(prompt, history, toolContext);
      }
      return {
        success: false,
        errorType: "unconfigured",
        providerName: `OpenAI (${config.openaiModel}) [Unconfigured]`,
        errorMsg: "OPENAI_API_KEY is not configured in .env.",
      };
    }

    // 3. Explicitly configured for Ollama
    if (provider === "ollama") {
      return this.callOllama(prompt, history, toolContext);
    }

    // 4. Auto Mode: Gemini Primary -> OpenAI -> Local Ollama Fallback -> Built-in Core Fallback
    if (provider === "auto") {
      // Primary: Google Gemini
      if (config.geminiApiKey) {
        const res = await this.callGemini(prompt, history, toolContext);
        if (res.success) return res;
        // If Gemini had a quota or invalid key error, report it honestly
        if (res.errorType === "quota_exceeded" || res.errorType === "invalid_key") {
          return res;
        }
      }

      // Secondary: OpenAI
      if (config.openaiApiKey) {
        const res = await this.callOpenAI(prompt, history, toolContext);
        if (res.success) return res;
      }

      // Tertiary: Local Ollama (only if genuinely available)
      try {
        const check = await fetch(`${config.ollamaHost.replace(/\/$/, "")}/api/tags`, {
          signal: AbortSignal.timeout(1500),
        });
        if (check.ok) {
          const res = await this.callOllama(prompt, history, toolContext);
          if (res.success) return res;
        }
      } catch {
        // Ollama not reachable, fall through
      }
    }

    // Built-in Core Fallback
    providerHealth.configured = false;
    providerHealth.activeProvider = "ASTRA Core Engine";
    providerHealth.mode = "local_engine";
    return {
      success: false,
      errorType: "unconfigured",
      errorMsg: "No cloud or local LLM available in environment.",
    };
  }

  private static async callGemini(
    prompt: string,
    history: ChatHistoryMessage[] = [],
    toolContext?: string
  ): Promise<LLMResult> {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      providerHealth.configured = false;
      providerHealth.lastError = "GEMINI_API_KEY is not configured in server environment.";
      providerHealth.lastErrorType = "unconfigured";
      return {
        success: false,
        errorType: "unconfigured",
        errorMsg: "Google Gemini API key is missing. Please set GEMINI_API_KEY in .env.",
      };
    }

    const primaryModel = config.geminiModel || "gemini-3.1-flash-lite";
    const fallbackModel = "gemini-flash-lite-latest";

    // Format multi-turn history into Google Gen AI contents array
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    // Map history to contents (up to 12 recent messages)
    const recentHistory = history.slice(-12);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    // Add toolContext if provided (e.g. from DuckDuckGo search or movie recommendations)
    let userMessageText = prompt;
    if (toolContext) {
      userMessageText = `User Request: "${prompt}"\n\nVerified Real-Time Search & Factual Data:\n${toolContext}\n\nPlease synthesize a clear, conversational, factual response based on this verified data. When recommending movies, provide accurate release years, genres, and avoid fabricating movie facts. When citing web sources, use clickable markdown links [Source Title](URL).`;
    }

    contents.push({
      role: "user",
      parts: [{ text: userMessageText }],
    });

    try {
      const ai = new GoogleGenAI({ apiKey });

      const callModelWithTimeout = async (modelName: string, timeoutMs: number = 35000) => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini API request timed out after ${Math.round(timeoutMs / 1000)} seconds.`)), timeoutMs)
        );
        const reqPromise = ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: ASTRA_SYSTEM_PROMPT,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });
        return Promise.race([reqPromise, timeoutPromise]);
      };

      let activeModel = primaryModel;
      let response: any;

      try {
        response = await callModelWithTimeout(activeModel, 35000);
      } catch (err: any) {
        // If primary model returned 404 (sunsetted), 503 (high demand), 429, or timed out, retry with fallback
        const isRetryable =
          err?.status === 404 ||
          err?.status === 503 ||
          err?.status === 429 ||
          err?.message?.includes("not found") ||
          err?.message?.includes("no longer available") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("quota") ||
          err?.message?.includes("RESOURCE_EXHAUSTED") ||
          err?.message?.includes("timed out") ||
          err?.message?.includes("unavailable");

        if (isRetryable && activeModel !== fallbackModel) {
          console.warn(`[LLMProviderService] Model ${activeModel} failed (${err?.status || err?.message?.slice(0, 50)}). Retrying with fallback ${fallbackModel}...`);
          activeModel = fallbackModel;
          response = await callModelWithTimeout(activeModel, 35000);
        } else {
          throw err;
        }
      }

      const text = response?.text;
      if (!text || typeof text !== "string") {
        throw new Error("No text candidate returned from Google Gemini.");
      }

      providerHealth.configured = true;
      providerHealth.activeProvider = `Google Gemini (${activeModel})`;
      providerHealth.model = activeModel;
      providerHealth.mode = "gemini";
      providerHealth.lastCallSuccess = true;
      providerHealth.lastCallTime = new Date().toISOString();
      providerHealth.lastError = null;
      providerHealth.lastErrorType = "none";

      return {
        success: true,
        text: text.trim(),
        providerName: `Google Gemini (${activeModel})`,
      };
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      const status = e?.status;

      providerHealth.lastCallSuccess = false;
      providerHealth.lastCallTime = new Date().toISOString();
      providerHealth.lastError = errMsg;

      if (status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("resource_exhausted")) {
        providerHealth.lastErrorType = "quota_exceeded";
        return {
          success: false,
          errorType: "quota_exceeded",
          providerName: `Google Gemini (${primaryModel})`,
          errorMsg: `Google Gemini quota exhausted: ${errMsg}`,
        };
      } else if (
        status === 400 ||
        status === 401 ||
        status === 403 ||
        errMsg.includes("API_KEY_INVALID") ||
        errMsg.toLowerCase().includes("api key not valid")
      ) {
        providerHealth.lastErrorType = "invalid_key";
        return {
          success: false,
          errorType: "invalid_key",
          providerName: `Google Gemini (${primaryModel})`,
          errorMsg: `Invalid Google Gemini API key: ${errMsg}`,
        };
      } else if (errMsg.includes("timed out")) {
        providerHealth.lastErrorType = "network_error";
        return {
          success: false,
          errorType: "network_error",
          providerName: `Google Gemini (${primaryModel})`,
          errorMsg: errMsg,
        };
      } else {
        providerHealth.lastErrorType = "network_error";
        return {
          success: false,
          errorType: "network_error",
          providerName: `Google Gemini (${primaryModel})`,
          errorMsg: `Google Gemini request failed: ${errMsg}`,
        };
      }
    }
  }

  private static async callOpenAI(
    prompt: string,
    history: ChatHistoryMessage[] = [],
    toolContext?: string
  ): Promise<LLMResult> {
    const apiKey = config.openaiApiKey;
    const model = config.openaiModel || "gpt-4o-mini";

    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: ASTRA_SYSTEM_PROMPT },
      ];

      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        });
      }

      let userContent = prompt;
      if (toolContext) {
        userContent = `User Query: "${prompt}"\n\nVerified Tool Execution Data:\n${toolContext}\n\nPlease synthesize a clear, conversational answer based on this verified data. If citing web sources or news, include clickable markdown links [Source Title](URL).`;
      }

      messages.push({ role: "user", content: userContent });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody: any = await response.json().catch(() => ({}));
        const status = response.status;
        const errMsg = errorBody?.error?.message || response.statusText;

        providerHealth.lastCallSuccess = false;
        providerHealth.lastCallTime = new Date().toISOString();
        providerHealth.lastError = errMsg;

        if (status === 429) {
          providerHealth.lastErrorType = "quota_exceeded";
          return { success: false, errorType: "quota_exceeded", errorMsg: errMsg };
        } else if (status === 401 || status === 403) {
          providerHealth.lastErrorType = "invalid_key";
          return { success: false, errorType: "invalid_key", errorMsg: errMsg };
        } else {
          providerHealth.lastErrorType = "network_error";
          return { success: false, errorType: "network_error", errorMsg: errMsg };
        }
      }

      const data: any = await response.json();
      const reply = data?.choices?.[0]?.message?.content;

      if (!reply) throw new Error("No text content returned from OpenAI choice.");

      providerHealth.lastCallSuccess = true;
      providerHealth.lastCallTime = new Date().toISOString();
      providerHealth.lastError = null;
      providerHealth.lastErrorType = "none";

      return {
        success: true,
        text: reply.trim(),
        providerName: `OpenAI (${model})`,
      };
    } catch (e: any) {
      providerHealth.lastCallSuccess = false;
      providerHealth.lastCallTime = new Date().toISOString();
      providerHealth.lastError = e?.message || String(e);

      return {
        success: false,
        errorType: "network_error",
        errorMsg: e?.message || String(e),
      };
    }
  }

  private static async callOllama(
    prompt: string,
    history: ChatHistoryMessage[] = [],
    toolContext?: string
  ): Promise<LLMResult> {
    const host = config.ollamaHost.replace(/\/$/, "");
    const model = config.ollamaModel || "qwen3:0.6b";

    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: ASTRA_SYSTEM_PROMPT },
      ];

      const recentHistory = history.slice(-4);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        });
      }

      let userContent = prompt;
      if (toolContext) {
        userContent = `User Query: "${prompt}"\n\nVerified Tool Execution Data:\n${toolContext}\n\nPlease synthesize a clear, conversational answer based on this verified data. If citing web sources or news, include clickable markdown links [Source Title](URL).`;
      }

      messages.push({ role: "user", content: userContent });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25-second timeout

      const response = await fetch(`${host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 1024,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        providerHealth.lastCallSuccess = false;
        providerHealth.lastCallTime = new Date().toISOString();
        providerHealth.lastError = `Ollama HTTP ${response.status}: ${errText}`;
        providerHealth.lastErrorType = "network_error";

        return {
          success: false,
          errorType: "network_error",
          errorMsg: `Ollama HTTP ${response.status}`,
        };
      }

      const data: any = await response.json();
      let reply: string = data?.message?.content || "";

      // Remove thinking blocks if present (e.g. <think>...</think>)
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      if (!reply) {
        throw new Error("No response content from Ollama model.");
      }

      providerHealth.lastCallSuccess = true;
      providerHealth.lastCallTime = new Date().toISOString();
      providerHealth.lastError = null;
      providerHealth.lastErrorType = "none";
      providerHealth.activeProvider = `Ollama (${model})`;
      providerHealth.mode = "ollama";

      return {
        success: true,
        text: reply,
        providerName: `Local Ollama (${model})`,
      };
    } catch (e: any) {
      providerHealth.lastCallSuccess = false;
      providerHealth.lastCallTime = new Date().toISOString();
      providerHealth.lastError = e?.message || String(e);
      providerHealth.lastErrorType = "network_error";

      return {
        success: false,
        errorType: "network_error",
        errorMsg: e?.message || String(e),
      };
    }
  }
}
