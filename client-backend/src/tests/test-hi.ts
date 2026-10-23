import { LLMProviderService } from "../services/llm-provider.js";
import { config } from "../config/index.js";

async function test() {
  console.log("Config geminiApiKey present:", Boolean(config.geminiApiKey));
  console.log("Config aiProvider:", config.aiProvider);
  console.log("Config geminiModel:", config.geminiModel);
  const res = await LLMProviderService.generateResponse("Hi");
  console.log("LLMResult:", res);
}

test();
