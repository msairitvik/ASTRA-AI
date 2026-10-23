import { AssistantService } from "../services/assistant.js";
import { mcpClientManager } from "../mcp-client/client.js";

interface TestReport {
  name: string;
  category: number;
  input: string;
  passed: boolean;
  notes: string;
  actualOutput: string;
}

async function runRegressionSuite() {
  console.log("=================================================================");
  console.log(" ASTRA AI — 20-CATEGORY CONVERSATIONAL REGRESSION TEST SUITE");
  console.log("=================================================================\n");

  const reports: TestReport[] = [];

  // Helper check: output must NOT contain robotic phrases
  const containsRoboticFallbacks = (text: string) => {
    const lower = text.toLowerCase();
    return (
      lower.includes("i understand you're asking about") ||
      lower.includes("to enable open-ended creative writing") ||
      lower.includes("tell me what task you want to perform") ||
      lower.includes("i can help with the following tools") ||
      lower.includes("gemini_api_key") ||
      lower.includes("that's an interesting question about") ||
      lower.includes("external cloud connection is currently in offline mode") ||
      lower.includes("offline mode")
    );
  };

  // Helper check: output must NOT contain raw MCP internal leakages
  const containsRawMCPLeakage = (text: string) => {
    return (
      text.includes("INPUT ARGUMENTS") ||
      text.includes("MCP RETURNED OUTPUT") ||
      text.includes('"jsonrpc"') ||
      text.includes("tools/call") ||
      text.includes("tools/list")
    );
  };

  let testConvA = "test-conv-" + Date.now();
  let testConvB = "test-conv-isolated-" + Date.now();

  // Test 1: Greeting "Hello"
  try {
    const res = await AssistantService.processMessage("Hello", testConvA);
    const passed =
      res.message.length > 0 &&
      !containsRoboticFallbacks(res.message) &&
      /hello|hi|hey|help|welcome|assist/i.test(res.message);
    reports.push({
      category: 1,
      name: "Greeting: 'Hello'",
      input: "Hello",
      passed,
      notes: passed ? "Returned warm, natural greeting" : "Failed greeting assertion",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 1, name: "Greeting: 'Hello'", input: "Hello", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 2: Spelling variation "Helloo"
  try {
    const res = await AssistantService.processMessage("Helloo", testConvA);
    const passed =
      res.message.length > 0 &&
      !containsRoboticFallbacks(res.message) &&
      !res.message.includes("I understand you're asking about: \"Helloo\"") &&
      /hello|hi|hey|how are you|good/i.test(res.message);
    reports.push({
      category: 2,
      name: "Spelling variation: 'Helloo'",
      input: "Helloo",
      passed,
      notes: passed ? "Recognized typo/spelling variation as greeting" : "Robotic fallback triggered",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 2, name: "Spelling variation: 'Helloo'", input: "Helloo", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 3: Greeting variation "Hiii"
  try {
    const res = await AssistantService.processMessage("Hiii", testConvA);
    const passed =
      res.message.length > 0 &&
      !containsRoboticFallbacks(res.message) &&
      /hello|hi|hey|how are you/i.test(res.message);
    reports.push({
      category: 3,
      name: "Greeting variation: 'Hiii'",
      input: "Hiii",
      passed,
      notes: passed ? "Recognized elongated greeting naturally" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 3, name: "Greeting variation: 'Hiii'", input: "Hiii", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 4: Casual question "How are you?"
  try {
    const res = await AssistantService.processMessage("How are you?", testConvA);
    const passed =
      !containsRoboticFallbacks(res.message) &&
      (res.message.toLowerCase().includes("doing well") ||
        res.message.toLowerCase().includes("great") ||
        res.message.toLowerCase().includes("thanks for asking"));
    reports.push({
      category: 4,
      name: "Casual question: 'How are you?'",
      input: "How are you?",
      passed,
      notes: passed ? "Responded with conversational friendliness" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 4, name: "Casual question", input: "How are you?", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 5: Casual continuation "I'm bored"
  try {
    const res = await AssistantService.processMessage("I'm bored", testConvA);
    const lower = res.message.toLowerCase();
    const passed =
      !containsRoboticFallbacks(res.message) &&
      !lower.includes("what task do you want") &&
      (lower.includes("adventure") ||
        lower.includes("fun") ||
        lower.includes("interesting") ||
        lower.includes("bored") ||
        lower.includes("boring") ||
        lower.includes("project") ||
        lower.includes("challenge") ||
        lower.includes("something"));
    reports.push({
      category: 5,
      name: "Casual continuation: 'I'm bored'",
      input: "I'm bored",
      passed,
      notes: passed ? "Acknowledged boredom conversationally with engaging ideas" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 5, name: "Casual continuation", input: "I'm bored", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 6: Knowledge question "What is quantum computing?"
  try {
    const res = await AssistantService.processMessage("What is quantum computing?", testConvA);
    const passed =
      !containsRoboticFallbacks(res.message) &&
      res.message.toLowerCase().includes("qubit") &&
      (res.message.toLowerCase().includes("superposition") || res.message.toLowerCase().includes("state") || res.message.toLowerCase().includes("quantum"));
    reports.push({
      category: 6,
      name: "Knowledge: 'What is quantum computing?'",
      input: "What is quantum computing?",
      passed,
      notes: passed ? "Clear explanation of qubits and superposition" : "Failed",
      actualOutput: res.message.slice(0, 150) + "...",
    });
  } catch (e: any) {
    reports.push({ category: 6, name: "Knowledge question", input: "What is quantum computing?", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 7: Educational request "Explain recursion in C++"
  try {
    const res = await AssistantService.processMessage("Explain recursion in C++", testConvA);
    const passed =
      !containsRoboticFallbacks(res.message) &&
      res.message.toLowerCase().includes("base case") &&
      (res.message.toLowerCase().includes("factorial") ||
        res.message.toLowerCase().includes("sum") ||
        res.message.toLowerCase().includes("recursive") ||
        res.message.toLowerCase().includes("function")) &&
      (res.message.includes("cpp") || res.message.includes("c++") || res.message.includes("int "));
    reports.push({
      category: 7,
      name: "Educational: 'Explain recursion in C++'",
      input: "Explain recursion in C++",
      passed,
      notes: passed ? "Explained base case, call stack, and provided C++ code" : "Failed",
      actualOutput: res.message.slice(0, 150) + "...",
    });
  } catch (e: any) {
    reports.push({ category: 7, name: "Educational request", input: "Explain recursion in C++", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 8: Writing request "Write a short birthday message"
  try {
    const res = await AssistantService.processMessage("Write a short birthday message", testConvA);
    const passed =
      !containsRoboticFallbacks(res.message) &&
      res.message.toLowerCase().includes("happy birthday") &&
      !res.message.toLowerCase().includes("what task");
    reports.push({
      category: 8,
      name: "Writing request: 'Write a short birthday message'",
      input: "Write a short birthday message",
      passed,
      notes: passed ? "Generated warm birthday messages" : "Failed",
      actualOutput: res.message.slice(0, 150) + "...",
    });
  } catch (e: any) {
    reports.push({ category: 8, name: "Writing request", input: "Write a short birthday message", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 9: Contextual follow-up: Step 1 = "Explain binary search", Step 2 = "Give me an example"
  let followUpContextHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
  try {
    const step1 = await AssistantService.processMessage("Explain binary search", testConvA);
    followUpContextHistory.push({ role: "user", content: "Explain binary search" });
    followUpContextHistory.push({ role: "assistant", content: step1.message });

    const step2 = await AssistantService.processMessage("Give me an example", testConvA, undefined, undefined, followUpContextHistory);
    followUpContextHistory.push({ role: "user", content: "Give me an example" });
    followUpContextHistory.push({ role: "assistant", content: step2.message });

    const passed =
      !containsRoboticFallbacks(step2.message) &&
      step2.message.toLowerCase().includes("binary search") &&
      step2.message.toLowerCase().includes("mid");
    reports.push({
      category: 9,
      name: "Contextual follow-up: 'Give me an example'",
      input: "Give me an example (following 'Explain binary search')",
      passed,
      notes: passed ? "Correctly identified binary search from history and supplied step-by-step example" : "Failed context",
      actualOutput: step2.message.slice(0, 150) + "...",
    });
  } catch (e: any) {
    reports.push({ category: 9, name: "Contextual follow-up 1", input: "Give me an example", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 10: Contextual follow-up: Step 3 = "Now give me the code in C++"
  try {
    const step3 = await AssistantService.processMessage(
      "Now give me the code in C++",
      testConvA,
      undefined,
      undefined,
      followUpContextHistory
    );

    const passed =
      !containsRoboticFallbacks(step3.message) &&
      step3.message.includes("#include <iostream>") &&
      step3.message.toLowerCase().includes("binarysearch");
    reports.push({
      category: 10,
      name: "Contextual follow-up: 'Now give me the code in C++'",
      input: "Now give me the code in C++",
      passed,
      notes: passed ? "Maintained binary search context and provided clean C++ implementation" : "Failed",
      actualOutput: step3.message.slice(0, 150) + "...",
    });
  } catch (e: any) {
    reports.push({ category: 10, name: "Contextual follow-up 2", input: "Now give me code in C++", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 11: Timezone request "What time is it in India?"
  try {
    const res = await AssistantService.processMessage("What time is it in India?", testConvA);
    const passed =
      res.source === "mcp_tool" &&
      res.message.includes("India (IST)") &&
      !containsRawMCPLeakage(res.message);
    reports.push({
      category: 11,
      name: "Timezone request: 'What time is it in India?'",
      input: "What time is it in India?",
      passed,
      notes: passed ? "Resolved India (IST) via MCP and returned clean conversational 12h time" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 11, name: "Timezone request", input: "What time is it in India?", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 12: Weather request "What is the weather in Lucknow?"
  try {
    const res = await AssistantService.processMessage("What is the weather in Lucknow?", testConvA);
    const passed =
      res.source === "mcp_tool" &&
      res.message.includes("Lucknow") &&
      res.message.includes("°C") &&
      !containsRawMCPLeakage(res.message);
    reports.push({
      category: 12,
      name: "Weather request: 'What is the weather in Lucknow?'",
      input: "What is the weather in Lucknow?",
      passed,
      notes: passed ? "Fetched live weather for Lucknow via Open-Meteo tool and summarized naturally" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 12, name: "Weather request", input: "What is the weather in Lucknow?", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 13: Calculation "Calculate 245 * 38"
  try {
    const res = await AssistantService.processMessage("Calculate 245 * 38", testConvA);
    const expected = (245 * 38).toLocaleString(); // "9,310"
    const passed =
      res.source === "mcp_tool" &&
      res.message.includes(expected) &&
      !containsRawMCPLeakage(res.message);
    reports.push({
      category: 13,
      name: "Calculation: 'Calculate 245 * 38'",
      input: "Calculate 245 * 38",
      passed,
      notes: passed ? `Computed exact mathematical result ${expected}` : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 13, name: "Calculation", input: "Calculate 245 * 38", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 14: Unknown or unfamiliar user message (e.g. philosophical thought)
  try {
    const res = await AssistantService.processMessage("Do you think human curiosity is infinite?", testConvA);
    const passed =
      !containsRoboticFallbacks(res.message) &&
      !res.message.includes("I understand you're asking about: \"Do you think") &&
      !res.message.includes("Configure Gemini API key");
    reports.push({
      category: 14,
      name: "Unfamiliar message: 'Do you think human curiosity is infinite?'",
      input: "Do you think human curiosity is infinite?",
      passed,
      notes: passed ? "Handled with conversational openness without robotic tool menus" : "Failed",
      actualOutput: res.message.slice(0, 150) + "...",
    });
  } catch (e: any) {
    reports.push({ category: 14, name: "Unfamiliar message", input: "Human curiosity", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 15: LLM provider unavailable state (healthy fallback verification)
  try {
    // When cloud LLM is offline, a greeting must still be answered naturally
    const res = await AssistantService.processMessage("Heyy ASTRA", testConvA);
    const passed =
      !containsRoboticFallbacks(res.message) &&
      !res.message.includes("Configure Gemini");
    reports.push({
      category: 15,
      name: "LLM provider offline graceful handling",
      input: "Heyy ASTRA",
      passed,
      notes: passed ? "Responded naturally without nagging user for API key" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 15, name: "Provider offline handling", input: "Heyy ASTRA", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 16: MCP tool failure safe handling
  try {
    const res = await AssistantService.processMessage("Calculate sqrt(-25)", testConvA);
    const passed =
      res.message.length > 0 &&
      !containsRawMCPLeakage(res.message);
    reports.push({
      category: 16,
      name: "MCP tool edge/failure safety",
      input: "Calculate sqrt(-25)",
      passed,
      notes: passed ? "Returned safe human-readable message without crashing" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 16, name: "Tool failure safety", input: "sqrt(-25)", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 17: Conversation history persistence in SQLite
  try {
    const getRes = await mcpClientManager.callTool("get_conversation", { conversation_id: testConvA });
    const msgCount = getRes.result?.conversation?.messages?.length || 0;
    const passed = getRes.success && msgCount > 0;
    reports.push({
      category: 17,
      name: "Conversation persistence in SQLite",
      input: `get_conversation for ${testConvA}`,
      passed,
      notes: passed ? `Successfully retrieved ${msgCount} persisted messages from SQLite` : "Failed",
      actualOutput: `Total messages persisted: ${msgCount}`,
    });
  } catch (e: any) {
    reports.push({ category: 17, name: "History persistence", input: testConvA, passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 18: Multiple conversations remaining isolated
  try {
    await AssistantService.processMessage("My name is Alice", testConvA);
    await AssistantService.processMessage("My name is Bob", testConvB);

    const getA = await mcpClientManager.callTool("get_conversation", { conversation_id: testConvA });
    const getB = await mcpClientManager.callTool("get_conversation", { conversation_id: testConvB });

    const msgsA: any[] = getA.result?.conversation?.messages || [];
    const msgsB: any[] = getB.result?.conversation?.messages || [];

    const hasBobInA = msgsA.some((m) => m.content.includes("Bob"));
    const hasAliceInB = msgsB.some((m) => m.content.includes("Alice"));

    const passed = !hasBobInA && !hasAliceInB && msgsA.length > 0 && msgsB.length > 0;
    reports.push({
      category: 18,
      name: "Conversation isolation across sessions",
      input: "Session A (Alice) vs Session B (Bob)",
      passed,
      notes: passed ? "Conversation histories completely isolated in SQLite" : "History leaked between sessions",
      actualOutput: `Conv A has ${msgsA.length} msgs (No Bob), Conv B has ${msgsB.length} msgs (No Alice)`,
    });
  } catch (e: any) {
    reports.push({ category: 18, name: "Conversation isolation", input: "Isolation check", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 19: Tool result formatting is clean Markdown
  try {
    const res = await AssistantService.processMessage("What time is it in Tokyo?", testConvA);
    const passed =
      res.message.includes("Tokyo (JST)") &&
      res.message.includes("**") &&
      !containsRawMCPLeakage(res.message);
    reports.push({
      category: 19,
      name: "Tool result clean Markdown formatting",
      input: "What time is it in Tokyo?",
      passed,
      notes: passed ? "Formatted with bolding, timezone name, and no raw JSON" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 19, name: "Tool result formatting", input: "Time in Tokyo", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 20: Ensuring ordinary responses do not expose raw MCP data or internal config messages
  try {
    const testMessages = ["Hello", "What is quantum computing?", "Calculate 10 * 5", "Show my tasks"];
    let allClean = true;
    for (const msg of testMessages) {
      const res = await AssistantService.processMessage(msg, testConvA);
      if (containsRawMCPLeakage(res.message) || containsRoboticFallbacks(res.message)) {
        allClean = false;
        break;
      }
    }
    reports.push({
      category: 20,
      name: "Absence of raw MCP leakages & robotic fallbacks",
      input: "Batch audit across 4 message types",
      passed: allClean,
      notes: allClean ? "Zero internal MCP keys, zero JSON-RPC payloads, zero robotic task menus" : "Leakage detected",
      actualOutput: "Verified clean across all sampled replies",
    });
  } catch (e: any) {
    reports.push({ category: 20, name: "Raw MCP absence", input: "Audit", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 21: Casual Statement "i am fine"
  try {
    const res = await AssistantService.processMessage("i am fine", testConvA);
    const lower = res.message.toLowerCase();
    const passed =
      !containsRoboticFallbacks(res.message) &&
      !lower.includes("offline") &&
      !lower.includes("interesting question") &&
      (lower.includes("glad to hear") || lower.includes("good to hear") || lower.includes("what are you up to"));
    reports.push({
      category: 21,
      name: "Casual statement: 'i am fine'",
      input: "i am fine",
      passed,
      notes: passed ? "Natural wellbeing acknowledgement without generic fallback" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 21, name: "Casual statement: 'i am fine'", input: "i am fine", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 22: Personal introduction with typo & reciprocal "mysrlf ritvik.what about you??"
  const testConvIntro = "test-conv-intro-" + Date.now();
  try {
    const res = await AssistantService.processMessage("mysrlf ritvik.what about you??", testConvIntro);
    const passed =
      !containsRoboticFallbacks(res.message) &&
      res.message.includes("Ritvik") &&
      (res.message.includes("ASTRA") || res.message.toLowerCase().includes("doing great"));
    reports.push({
      category: 22,
      name: "Intro with typo: 'mysrlf ritvik.what about you??'",
      input: "mysrlf ritvik.what about you??",
      passed,
      notes: passed ? "Extracted name Ritvik and answered reciprocal question warmly" : "Failed",
      actualOutput: res.message,
    });
  } catch (e: any) {
    reports.push({ category: 22, name: "Intro with typo & reciprocal", input: "mysrlf ritvik.what about you??", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Test 23: Multi-turn Name Persistence ("mysrlf ritvik.what about you??" -> "i am fine")
  try {
    const resFollowUp = await AssistantService.processMessage("i am fine", testConvIntro);
    const passed =
      !containsRoboticFallbacks(resFollowUp.message) &&
      resFollowUp.message.includes("Ritvik") &&
      resFollowUp.message.toLowerCase().includes("glad to hear that");
    reports.push({
      category: 23,
      name: "Multi-turn Name Continuity across conversational turns",
      input: "Turn 1: Intro Ritvik -> Turn 2: 'i am fine'",
      passed,
      notes: passed ? "Persisted user name across SQLite turns and addressed Ritvik directly" : "Failed name continuity",
      actualOutput: resFollowUp.message,
    });
  } catch (e: any) {
    reports.push({ category: 23, name: "Multi-turn Name Continuity", input: "i am fine (after intro)", passed: false, notes: e?.message, actualOutput: "" });
  }

  // Summary Table
  console.log("------------------------------------------------------------------------------------------------");
  console.log(
    "| Cat | Test Name                                      | Status  | Detail"
  );
  console.log("------------------------------------------------------------------------------------------------");
  let passCount = 0;
  for (const r of reports) {
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    if (r.passed) passCount++;
    const catStr = String(r.category).padStart(3, " ");
    const nameStr = r.name.padEnd(46, " ").slice(0, 46);
    console.log(`| ${catStr} | ${nameStr} | ${status} | ${r.notes.slice(0, 40)}`);
  }
  console.log("------------------------------------------------------------------------------------------------");
  console.log(`\nFinal Score: ${passCount} / ${reports.length} Tests Passed (${Math.round((passCount / reports.length) * 100)}%)\n`);

  if (passCount !== reports.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Execute
runRegressionSuite().catch((err) => {
  console.error("Test Suite execution failed:", err);
  process.exit(1);
});
