import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root workspace .env, client-backend .env, or process cwd
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const config = {
  port: parseInt(process.env.CLIENT_BACKEND_PORT || "3001", 10),
  host: process.env.CLIENT_BACKEND_HOST || "127.0.0.1",
  mcpServerUrl: process.env.MCP_SERVER_URL || "http://127.0.0.1:8000/mcp",
  dbPath: process.env.ASTRA_DB_PATH || path.resolve(__dirname, "../../../data/astra.db"),
  aiProvider: (process.env.AI_PROVIDER as "gemini" | "auto" | "ollama" | "openai" | "builtin") || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  ollamaHost: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "qwen3:0.6b",
  corsOrigins: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
};

// Global provider health tracker for transparency in /api/status and Settings
export const providerHealth = {
  configured: Boolean(config.geminiApiKey),
  activeProvider: config.geminiApiKey
    ? `Google Gemini (${config.geminiModel})`
    : config.openaiApiKey
    ? `OpenAI (${config.openaiModel})`
    : config.aiProvider === "ollama"
    ? `Local Ollama (${config.ollamaModel})`
    : `Google Gemini (${config.geminiModel}) [Awaiting GEMINI_API_KEY]`,
  model: config.geminiApiKey ? config.geminiModel : config.openaiApiKey ? config.openaiModel : (config.ollamaModel || config.geminiModel),
  mode: (config.geminiApiKey ? "gemini" : config.openaiApiKey ? "openai" : config.aiProvider === "ollama" ? "ollama" : "gemini") as "gemini" | "openai" | "ollama" | "local_engine",
  lastCallSuccess: null as boolean | null,
  lastError: null as string | null,
  lastErrorType: null as "quota_exceeded" | "invalid_key" | "network_error" | "unconfigured" | "unknown" | "none" | null,
  lastCallTime: null as string | null,
};
