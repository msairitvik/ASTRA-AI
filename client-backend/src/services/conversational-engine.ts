export interface EngineResponse {
  text: string;
  suggestedFollowUps?: string[];
  topicContext?: string;
}

export class ConversationalEngine {
  /**
   * Main entry point for conversational replies when cloud LLM is offline or unconfigured.
   */
  public static handle(
    input: string,
    history: Array<{ role: string; content: string }> = []
  ): EngineResponse {
    const raw = input.trim();
    const clean = raw.toLowerCase().replace(/[!.,?~😊😂👋]/g, " ").replace(/\s+/g, " ").trim();
    const lower = raw.toLowerCase();

    // Extract recent topic & context from history
    const recentTopic = this.detectTopicFromHistory(history);
    const lastAssistantMsg = this.getLastAssistantMessage(history);
    const rememberedName = this.extractNameFromHistory(history);

    // 1. Personal Introductions (e.g. "myself ritvik.what about you??", "I'm Ritvik", "my name is Alex")
    const introResponse = this.handleIntroduction(raw, clean, lower, lastAssistantMsg);
    if (introResponse) {
      return introResponse;
    }

    // 2. Status & Wellbeing Replies (e.g. "i am fine", "im good, what about you?", "doing well", "feeling tired")
    const statusResponse = this.handleStatusAndWellbeing(clean, lower, lastAssistantMsg, rememberedName);
    if (statusResponse) {
      return statusResponse;
    }

    // 3. Standalone Reciprocal Questions (e.g. "what about you??", "wbu", "how about you?", "and you?")
    const reciprocalResponse = this.handleReciprocalQuestion(clean, rememberedName);
    if (reciprocalResponse) {
      return reciprocalResponse;
    }

    // 4. Greetings (handles Hello, Helloo, Hiii, Heyy, Good morning, etc.)
    if (this.isGreeting(clean)) {
      return this.handleGreeting(clean, rememberedName);
    }

    // 5. Casual Conversation, Humor & Banter
    const casualResponse = this.handleCasual(clean, lower, rememberedName);
    if (casualResponse) {
      return casualResponse;
    }

    // 6. Acknowledgements, Agreements & Closings ("ok", "cool", "bye", "see you")
    const ackResponse = this.handleAcknowledgementsAndClosings(clean, rememberedName);
    if (ackResponse) {
      return ackResponse;
    }

    // 7. Multi-turn Follow-up handling (e.g. "Give me an example", "Now in Java", "Explain the while loop")
    const followUp = this.handleContextualFollowUp(lower, recentTopic);
    if (followUp) {
      return followUp;
    }

    // 8. Educational, Technical & Science Topics (Recursion, Binary Search, Quantum, etc.)
    const techResponse = this.handleTechnicalAndScience(lower);
    if (techResponse) {
      return techResponse;
    }

    // 9. Advice, Brainstorming & Writing (AI in college, project ideas, daily schedule, email)
    const creativeResponse = this.handleCreativeAndAdvice(lower);
    if (creativeResponse) {
      return creativeResponse;
    }

    // 10. General Knowledge Questions (e.g., "Why is the sky blue?")
    if (lower.includes("sky blue") || lower.includes("why is the sky")) {
      return {
        text:
          `### ☀️ **Why the Sky is Blue: Rayleigh Scattering**\n\n` +
          `Sunlight looks white to our eyes, but it is composed of all the colors of the rainbow, each with a different wavelength.\n\n` +
          `1. **Light Wavelengths:** Red and orange light have long, lazy wavelengths, while blue and violet light have much shorter, smaller wavelengths.\n` +
          `2. **Atmospheric Scattering:** When sunlight enters Earth's atmosphere, it collides with gas molecules (mostly nitrogen and oxygen).\n` +
          `3. **Rayleigh Scattering:** Because blue light travels in smaller, shorter waves, it is scattered in all directions by these gases far more efficiently than other colors.\n\n` +
          `*Why not violet?* Although violet light is scattered even more than blue, human eyes are much more sensitive to blue light, and the sun emits significantly more blue light than violet. That's why the daytime sky appears bright blue!`,
        suggestedFollowUps: ["Why is the sunset red?", "How does a rainbow form?", "Tell me another science fact"],
        topicContext: "physics_sky_blue",
      };
    }

    // 11. Everyday Statements & Thoughts (Exams, Work, Programming Interests)
    const statementResponse = this.handleHumanStatements(lower, clean, rememberedName);
    if (statementResponse) {
      return statementResponse;
    }

    // 12. Conversational Open-Ended Fallback (Human-like, Natural, NO robotic "interesting question" / NO "offline mode" spam)
    return this.handleNaturalFallback(raw, clean, lower, rememberedName);
  }

  // =========================================================================
  // 1. Personal Introductions & Name Extraction
  // =========================================================================
  private static handleIntroduction(
    raw: string,
    clean: string,
    lower: string,
    lastAssistantMsg: string
  ): EngineResponse | null {
    // Matches: "myself ritvik", "mysrlf ritvik", "my self ritvik", "i am ritvik", "im ritvik", "i'm ritvik", "my name is ritvik", "call me ritvik"
    const introMatch = raw.match(
      /\b(?:myself|mysrlf|my\s*self|i\s*am|i'm|im|my\s*name\s*is|this\s*is|call\s*me)\s+([a-zA-Z]{2,20})\b/i
    );

    if (introMatch) {
      const extractedName = introMatch[1].charAt(0).toUpperCase() + introMatch[1].slice(1).toLowerCase();

      // Avoid false positives like "myself fine", "im good", "im tired"
      const nonNames = ["fine", "good", "great", "well", "okay", "bored", "tired", "sad", "here", "just", "doing", "ready", "happy"];
      if (nonNames.includes(extractedName.toLowerCase())) {
        return null;
      }

      const hasReciprocal = /(?:what\s+about\s+(?:you|u)|how\s+about\s+(?:you|u)|wbu|hbu|and\s+you|who\s+are\s+you)/i.test(lower);

      if (hasReciprocal) {
        return {
          text: `Nice to meet you, **${extractedName}**! 😊\n\nAs for me, I'm **ASTRA AI**—your personal assistant. I'm doing great and happy to chat with you today! How's your day going so far?`,
          suggestedFollowUps: [
            "Tell me something interesting",
            "What can you do?",
            "Help me organize my day",
          ],
          topicContext: `user_name:${extractedName}`,
        };
      }

      return {
        text: `Nice to meet you, **${extractedName}**! 😊 I'm **ASTRA AI**, your personal assistant. How can I help you today?`,
        suggestedFollowUps: [
          "Tell me something interesting",
          "What can you do?",
          "How are you doing today?",
        ],
        topicContext: `user_name:${extractedName}`,
      };
    }


    return null;
  }

  // =========================================================================
  // 2. Status & Wellbeing Replies (e.g. "i am fine", "im good, what about you?")
  // =========================================================================
  private static handleStatusAndWellbeing(
    clean: string,
    lower: string,
    lastAssistantMsg: string,
    name?: string
  ): EngineResponse | null {
    const hasReciprocal = /(?:what\s+about\s+(?:you|u)|how\s+about\s+(?:you|u)|wbu|hbu|and\s+you)/i.test(lower);

    // Positive / Fine patterns: "i am fine", "im fine", "doing fine", "i'm good", "im good", "doing well", "pretty good", "all good", "great", "not bad"
    const isFine =
      /\b(i\s*am\s*fine|im\s*fine|i'm\s*fine|doing\s*fine|fine|all\s*good|pretty\s*good|doing\s*well|i\s*am\s*good|im\s*good|i'm\s*good|doing\s*great|i\s*am\s*great|im\s*great|not\s*bad|doing\s*okay|im\s*okay|i\s*am\s*okay)\b/i.test(
        lower
      ) ||
      clean === "fine" ||
      clean === "good" ||
      clean === "great" ||
      clean === "doing good" ||
      clean === "doing fine";

    if (isFine) {
      const nameTag = name ? `, ${name}` : "";

      if (hasReciprocal) {
        return {
          text: `Glad to hear you're doing well${nameTag}! 😊 I'm doing great too, thanks for asking. What's on your mind today?`,
          suggestedFollowUps: [
            "Tell me something interesting",
            "Suggest some project ideas",
            "What time is it in India?",
          ],
        };
      }

      return {
        text: `Glad to hear that${nameTag}! 😊 What are you up to today?`,
        suggestedFollowUps: [
          "Tell me something interesting",
          "Help me organize my day",
          "Suggest some project ideas",
        ],
      };
    }

    // Negative / Tired patterns: "tired", "exhausted", "feeling down", "stressed", "rough day"
    const isDownOrTired = /\b(tired|exhausted|feeling\s*down|not\s*so\s*good|stressed|rough\s*day|sad|not\s*great)\b/i.test(lower);
    if (isDownOrTired) {
      const nameTag = name ? ` ${name}` : "";
      return {
        text: `I'm sorry to hear that${nameTag}. Take it easy and give yourself some space to relax today. If there's anything I can help take off your plate or if you just want a distraction, I'm right here for you.`,
        suggestedFollowUps: [
          "Tell me a joke",
          "Tell me something interesting",
          "Help me organize tomorrow",
        ],
      };
    }


    return null;
  }

  // =========================================================================
  // 3. Standalone Reciprocal Questions ("what about you??", "wbu", "how about you?")
  // =========================================================================
  private static handleReciprocalQuestion(clean: string, name?: string): EngineResponse | null {
    if (
      clean === "what about you" ||
      clean === "what about u" ||
      clean === "how about you" ||
      clean === "how about u" ||
      clean === "wbu" ||
      clean === "hbu" ||
      clean === "and you" ||
      clean === "and u"
    ) {
      const nameTag = name ? ` ${name}` : "";
      return {
        text: `I'm doing great${nameTag}, thanks for asking! Ready to help with code, ideas, live info, or whatever is on your mind. How has your day been treating you?`,
        suggestedFollowUps: [
          "Tell me something interesting",
          "Explain recursion in C++",
          "Show my tasks",
        ],
      };
    }

    return null;
  }

  // =========================================================================
  // 4. Greetings
  // =========================================================================
  private static isGreeting(clean: string): boolean {
    if (/^h+e+l+l+o+$/i.test(clean)) return true;
    if (/^h+i+$/i.test(clean)) return true;
    if (/^h+e+y+$/i.test(clean)) return true;
    if (/^h+e+y+a+$/i.test(clean)) return true;
    if (/^y+o+$/i.test(clean)) return true;
    if (/^greetings?$/i.test(clean)) return true;
    if (/^howdy$/i.test(clean)) return true;
    if (/^(good\s+(morning|afternoon|evening|day)|morning|evening)$/i.test(clean)) return true;
    if (/^(hi|hello|hey|yo)\s+astra$/i.test(clean)) return true;
    if (/^what'?s\s+up$/i.test(clean)) return true;
    return false;
  }

  private static handleGreeting(clean: string, name?: string): EngineResponse {
    const nameTag = name ? ` ${name}` : "";

    if (clean.includes("morning")) {
      return {
        text: `Good morning${nameTag}! ☀️ I hope you're having a productive and wonderful start to your day. How can I help you today?`,
        suggestedFollowUps: ["Help me organize my day", "Show my tasks", "What's the weather in Seattle?"],
      };
    }
    if (clean.includes("evening")) {
      return {
        text: `Good evening${nameTag}! 🌆 Hope your day went smoothly. How can I assist you tonight?`,
        suggestedFollowUps: ["Show my tasks", "Tell me something interesting", "What time is it in Tokyo?"],
      };
    }

    const casualGreetings = [
      `Hello${nameTag}! 😊 How are you doing today?`,
      `Hi there${nameTag}! Great to chat with you. What's on your mind today?`,
      `Hey${nameTag}! 😊 How's everything going? What can we work on together?`,
      `Hello${nameTag}! Always a pleasure. How are you?`,
    ];
    const chosen = casualGreetings[Math.floor(Math.random() * casualGreetings.length)];

    return {
      text: chosen,
      suggestedFollowUps: [
        "I'm doing well, what about you?",
        "Tell me something interesting",
        "Explain recursion in C++",
        "What time is it in India?",
      ],
    };
  }

  // =========================================================================
  // 5. Casual Conversation, Humor & Banter
  // =========================================================================
  private static handleCasual(clean: string, lower: string, name?: string): EngineResponse | null {
    // "How are you?"
    if (
      clean.includes("how are you") ||
      clean.includes("how r u") ||
      clean.includes("hows it going") ||
      clean.includes("how do you do")
    ) {
      const nameTag = name ? ` ${name}` : "";
      return {
        text: `I'm doing great${nameTag}, thanks for asking! 😊 Ready to help with code, concepts, planning, or just to chat. How is your day going so far?`,
        suggestedFollowUps: [
          "I'm doing great, what about you?",
          "I'm feeling a bit bored",
          "Tell me something interesting",
        ],
      };
    }

    // "I'm bored"
    if (lower.includes("bored") || clean === "im bored" || clean === "i am bored") {
      return {
        text:
          `Boredom is just your brain asking for an adventure! 😄 Here are a few things we could do:\n\n` +
          `1. **Fascinating Tech:** Dive into how quantum computers work or explore how neural networks learn.\n` +
          `2. **Brainstorming:** Plan an exciting coding project or hackathon idea.\n` +
          `3. **Mind-Bending Facts:** Explore bizarre science mysteries like black holes or deep-sea biology.\n` +
          `4. **Coding Challenge:** Tackle a clean algorithm in C++, Java, or Python.\n\n` +
          `What sounds fun right now?`,
        suggestedFollowUps: [
          "Tell me something interesting",
          "Suggest some project ideas",
          "Explain quantum computing",
          "Tell me a joke",
        ],
      };
    }

    // "Nothing much"
    if (clean === "nothing much" || clean === "not much" || clean === "nm") {
      return {
        text: "Sometimes having nothing much going on is the best kind of day! A chance to unwind. Are you working on any personal projects lately, or just taking it easy?",
        suggestedFollowUps: [
          "Suggest some project ideas",
          "Tell me something interesting",
          "Explain binary search",
        ],
      };
    }

    // Laughter / Humor
    if (clean.includes("haha") || clean.includes("lol") || clean.includes("lmao") || clean.includes("hehe") || lower.includes("😂") || lower.includes("🤣")) {
      return {
        text: "Glad that brought a smile to your face! 😄 Always here to keep things fun. What should we look into next?",
        suggestedFollowUps: ["Tell me another joke", "Tell me something interesting", "Explain recursion in C++"],
      };
    }

    // Compliments
    if (clean.includes("you are funny") || clean.includes("youre funny") || clean.includes("you are cool") || clean.includes("youre cool")) {
      return {
        text: "Thank you! I appreciate that. A little humor makes building and learning a lot more enjoyable. 😊",
        suggestedFollowUps: ["Tell me a joke", "Tell me something interesting", "Help me plan my day"],
      };
    }

    // Gratitude
    if (clean.includes("thank you") || clean === "thanks" || clean === "thx" || clean === "thank u") {
      return {
        text: "You're very welcome! Always happy to help. Let me know whenever you need anything else.",
        suggestedFollowUps: ["Show my tasks", "Tell me something interesting", "What time is it in Tokyo?"],
      };
    }

    // Identity / About
    if (
      clean.includes("who are you") ||
      clean.includes("what are you") ||
      clean.includes("what is your name") ||
      clean.includes("whats your name")
    ) {
      return {
        text:
          `I am **ASTRA AI**, your intelligent personal assistant.\n\n` +
          `I'm designed to help you with everyday questions, learn programming concepts (C++, Java, Python, React, databases), brainstorm ideas, perform calculations, fetch live weather and timezones, and organize your tasks and notes through verified Model Context Protocol tools.\n\n` +
          `How can I help you today?`,
        suggestedFollowUps: ["What can you do?", "Explain binary search", "What's the weather in Seattle?"],
      };
    }

    // Jokes
    if (clean.includes("tell me a joke") || clean.includes("make me laugh") || clean === "joke") {
      const jokes = [
        "Why do programmers prefer dark mode?\n\n*Because light attracts bugs!* 🐛",
        "There are 10 types of people in the world:\n\n*Those who understand binary, and those who don't.* 🤓",
        "Why did the developer go broke?\n\n*Because they used up all their cache!* 💸",
        "A SQL query walks into a bar, walks up to two tables and asks:\n\n*\"Can I join you?\"* 🍻",
      ];
      return {
        text: jokes[Math.floor(Math.random() * jokes.length)],
        suggestedFollowUps: ["Tell me another joke", "Tell me something interesting", "Explain binary search"],
      };
    }

    // Interesting facts
    if (clean.includes("something interesting") || clean.includes("interesting fact") || clean === "tell me a fact" || clean === "fact") {
      const facts = [
        `### 🌌 **The Scale of Space & Neutron Stars**\n\nNeutron stars are so dense that a single sugar-cube-sized amount of neutron-star material would weigh approximately **1 billion tons** on Earth—roughly the weight of Mount Everest!`,
        `### 🍯 **Timeless Honey**\n\nArchaeologists excavating ancient Egyptian tombs have found pots of honey that are over **3,000 years old**—and still perfectly edible. Because of its low moisture content and natural acidity, bacteria cannot survive in it.`,
        `### 🐙 **Octopus Decentralized Brains**\n\nAn octopus has **three hearts**, blue blood, and **nine brains**! There is a central brain between its eyes, but each of its eight arms has its own mini-brain capable of acting and feeling independently.`,
        `### 💻 **The First Computer Bug**\n\nIn 1947, computer pioneer Grace Hopper recorded the first actual computer bug in the Mark II computer logbook: a real moth trapped between relays that disrupted the electrical circuits!`,
      ];
      return {
        text: facts[Math.floor(Math.random() * facts.length)],
        suggestedFollowUps: ["Tell me another interesting fact", "Explain quantum computing", "Explain recursion in C++"],
      };
    }


    return null;
  }

  // =========================================================================
  // 6. Acknowledgements & Closings ("ok", "cool", "bye", "see you")
  // =========================================================================
  private static handleAcknowledgementsAndClosings(clean: string, name?: string): EngineResponse | null {
    const acks = ["ok", "okay", "k", "sure", "alright", "got it", "understood", "cool", "nice", "yep", "yeah", "yes", "sounds good", "perfect", "right", "exactly"];
    if (acks.includes(clean)) {
      const nameTag = name ? ` ${name}` : "";
      return {
        text: `Sounds good${nameTag}! Let me know what you'd like to explore or work on next. 👍`,
        suggestedFollowUps: [
          "Tell me something interesting",
          "Explain recursion in C++",
          "Show my tasks",
        ],
      };
    }

    // Closings: bye, goodbye, cya, see you, good night
    if (
      clean.includes("good night") ||
      clean === "gn" ||
      clean.includes("sleep well")
    ) {
      return {
        text: `Good night! 🌙 Sleep well and have a restful night. Talk to you later!`,
        suggestedFollowUps: ["Show my tasks for tomorrow", "Help me organize tomorrow"],
      };
    }

    if (
      clean === "bye" ||
      clean === "goodbye" ||
      clean === "see you" ||
      clean === "see ya" ||
      clean === "cya" ||
      clean === "talk to you later" ||
      clean === "ttyl" ||
      clean === "take care"
    ) {
      const nameTag = name ? ` ${name}` : "";
      return {
        text: `Goodbye${nameTag}! Take care and have a wonderful day ahead! 👋`,
      };
    }


    return null;
  }

  // =========================================================================
  // 7. Multi-Turn Follow-Ups ("Give me an example", "Now in Java", etc.)
  // =========================================================================
  private static handleContextualFollowUp(
    lower: string,
    topic: string
  ): EngineResponse | null {
    // Follow-up: "Give me an example", "Show me an example"
    if (lower.includes("give me an example") || lower.includes("show an example") || lower === "example" || lower === "an example") {
      if (topic === "binary_search") {
        return {
          text:
            `### 🔢 **Binary Search Step-by-Step Walkthrough**\n\n` +
            `Suppose we want to find the number **23** in this sorted array of 10 elements:\n` +
            `\`\`\`text\n` +
            `Index:  [0]  [1]  [2]  [3]  [4]   [5]   [6]   [7]   [8]   [9]\n` +
            `Value:   2    5    8   12   16    23    38    56    72    91\n` +
            `\`\`\`\n\n` +
            `**Step 1:** \`low = 0\`, \`high = 9\`\n` +
            `• \`mid = (0 + 9) / 2 = 4\` → Value is \`16\`.\n` +
            `• Is \`23 == 16\`? No. \`23 > 16\`, so target must be in the right half!\n` +
            `• Move \`low = mid + 1 = 5\`.\n\n` +
            `**Step 2:** \`low = 5\`, \`high = 9\`\n` +
            `• \`mid = (5 + 9) / 2 = 7\` → Value is \`56\`.\n` +
            `• Is \`23 == 56\`? No. \`23 < 56\`, so target is in the left sub-portion!\n` +
            `• Move \`high = mid - 1 = 6\`.\n\n` +
            `**Step 3:** \`low = 5\`, \`high = 6\`\n` +
            `• \`mid = (5 + 6) / 2 = 5\` → Value is \`23\`.\n` +
            `• \`23 == 23\`! **Match found at index 5 in just 3 steps!** (Linear search would have taken 6 steps).`,
          suggestedFollowUps: [
            "Now give me the code in C++",
            "Now give me the code in Java",
            "Explain the while loop in that code",
          ],
          topicContext: "binary_search",
        };
      }

      if (topic === "recursion") {
        return {
          text:
            `### 🪜 **Recursive Call Stack Trace Example**\n\n` +
            `Let's trace how \`factorial(4)\` executes on the computer's memory call stack:\n\n` +
            `\`\`\`text\n` +
            `Step 1 (Push): factorial(4) = 4 * factorial(3)   [Stack depth 1]\n` +
            `Step 2 (Push): factorial(3) = 3 * factorial(2)   [Stack depth 2]\n` +
            `Step 3 (Push): factorial(2) = 2 * factorial(1)   [Stack depth 3]\n` +
            `Step 4 (Push): factorial(1) -> hits base case! Returns 1.\n` +
            `-----------------------------------------------------------\n` +
            `Step 5 (Pop):  factorial(2) receives 1 -> returns 2 * 1 = 2\n` +
            `Step 6 (Pop):  factorial(3) receives 2 -> returns 3 * 2 = 6\n` +
            `Step 7 (Pop):  factorial(4) receives 6 -> returns 4 * 6 = 24\n` +
            `\`\`\`\n\n` +
            `The call stack expands downwards until the base case is hit, then unwinds upward carrying the values back!`,
          suggestedFollowUps: [
            "Now give me the code in C++",
            "Now give me the code in Java",
            "What happens if there is no base case?",
          ],
          topicContext: "recursion",
        };
      }
    }

    // Follow-up: "Now give me the code in C++"
    if (lower.includes("code in c++") || lower.includes("in c++") || (lower.includes("c++") && lower.includes("code"))) {
      if (topic === "binary_search") {
        return {
          text:
            `### 💻 **Binary Search Implementation in C++**\n\n` +
            `\`\`\`cpp\n` +
            `#include <iostream>\n` +
            `#include <vector>\n\n` +
            `int binarySearch(const std::vector<int>& arr, int target) {\n` +
            `    int low = 0;\n` +
            `    int high = arr.size() - 1;\n\n` +
            `    while (low <= high) {\n` +
            `        int mid = low + (high - low) / 2; // Prevents overflow\n\n` +
            `        if (arr[mid] == target) {\n` +
            `            return mid; // Target found\n` +
            `        } else if (arr[mid] < target) {\n` +
            `            low = mid + 1; // Search right half\n` +
            `        } else {\n` +
            `            high = mid - 1; // Search left half\n` +
            `        }\n` +
            `    }\n` +
            `    return -1; // Target not found\n` +
            `}\n\n` +
            `int main() {\n` +
            `    std::vector<int> numbers = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};\n` +
            `    int target = 23;\n` +
            `    int result = binarySearch(numbers, target);\n\n` +
            `    if (result != -1)\n` +
            `        std::cout << "Element found at index " << result << std::endl;\n` +
            `    else\n` +
            `        std::cout << "Element not found" << std::endl;\n` +
            `    return 0;\n` +
            `}\n` +
            `\`\`\``,
          suggestedFollowUps: [
            "Explain the while loop in that code",
            "Now give me the code in Java",
            "What is the time complexity?",
          ],
          topicContext: "binary_search",
        };
      }

      if (topic === "recursion") {
        return {
          text:
            `### 💻 **Recursive Factorial & Fibonacci in C++**\n\n` +
            `\`\`\`cpp\n` +
            `#include <iostream>\n\n` +
            `int factorial(int n) {\n` +
            `    if (n <= 1) return 1; // Base case\n` +
            `    return n * factorial(n - 1); // Recursive call\n` +
            `}\n\n` +
            `int main() {\n` +
            `    std::cout << "Factorial of 5: " << factorial(5) << std::endl; // 120\n` +
            `    return 0;\n` +
            `}\n` +
            `\`\`\``,
          suggestedFollowUps: ["Now give me the code in Java", "Explain stack overflow"],
          topicContext: "recursion",
        };
      }
    }

    // Follow-up: "Now give me the code in Java"
    if (lower.includes("code in java") || lower.includes("in java") || (lower.includes("java") && lower.includes("code"))) {
      if (topic === "binary_search") {
        return {
          text:
            `### ☕ **Binary Search Implementation in Java**\n\n` +
            `\`\`\`java\n` +
            `public class BinarySearch {\n` +
            `    public static int search(int[] arr, int target) {\n` +
            `        int low = 0;\n` +
            `        int high = arr.length - 1;\n\n` +
            `        while (low <= high) {\n` +
            `            int mid = low + (high - low) / 2;\n` +
            `            if (arr[mid] == target) {\n` +
            `                return mid;\n` +
            `            } else if (arr[mid] < target) {\n` +
            `                low = mid + 1;\n` +
            `            } else {\n` +
            `                high = mid - 1;\n` +
            `            }\n` +
            `        }\n` +
            `        return -1;\n` +
            `    }\n\n` +
            `    public static void main(String[] args) {\n` +
            `        int[] numbers = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};\n` +
            `        System.out.println("Index of 23: " + search(numbers, 23));\n` +
            `    }\n` +
            `}\n` +
            `\`\`\``,
          suggestedFollowUps: [
            "Explain the while loop in that code",
            "Now give me the code in Python",
          ],
          topicContext: "binary_search",
        };
      }
    }

    // Follow-up: "Explain the while loop in that code"
    if (lower.includes("while loop") || lower.includes("explain the loop")) {
      return {
        text:
          `### 🔄 **Deconstructing the \`while (low <= high)\` Loop**\n\n` +
          `The \`while (low <= high)\` loop is the heart of Binary Search. Here is exactly how it functions:\n\n` +
          `1. **Loop Invariant (\`low <= high\`):**\n` +
          `   As long as \`low\` is less than or equal to \`high\`, there is still at least one valid element in our search boundary to inspect.\n\n` +
          `2. **Safe Midpoint Calculation (\`mid = low + (high - low) / 2\`):**\n` +
          `   In languages with 32-bit signed integers (C++, Java), calculating \`(low + high) / 2\` can cause **integer overflow** if the sum exceeds $2^{31}-1$. The formula \`low + (high - low) / 2\` is mathematically identical but completely immune to overflow!\n\n` +
          `3. **Halving the Range:**\n` +
          `   • If \`arr[mid] < target\`: We know all elements from \`low\` through \`mid\` are too small, so \`low = mid + 1\`.\n` +
          `   • If \`arr[mid] > target\`: We know all elements from \`mid\` through \`high\` are too large, so \`high = mid - 1\`.\n\n` +
          `4. **Termination:**\n` +
          `   If the target exists, \`arr[mid] == target\` triggers an early return. If the target does not exist, pointers cross (\`low > high\`), gracefully exiting and returning \`-1\`.`,
        suggestedFollowUps: [
          "Now give me the code in Java",
          "What is the difference between recursion and iteration?",
        ],
        topicContext: "binary_search",
      };
    }

    // Follow-up: "Which one is best for beginners?", "Which one should I watch?", "Which is best?"
    if (
      lower.includes("which one is best") ||
      lower.includes("which one should i") ||
      lower.includes("which is best") ||
      lower.includes("which is better") ||
      lower.includes("which one do you recommend")
    ) {
      if (topic === "entertainment_movies") {
        return {
          text:
            `For a universally captivating starting film, I strongly recommend **The Shawshank Redemption**! It's emotionally resonant, beautifully paced, and consistently held as one of the greatest movies ever made with a legendary rating.\n\n` +
            `If you're in the mood for high-concept sci-fi and spectacle instead, go straight for **Inception**!`,
          suggestedFollowUps: ["Tell me about Inception", "Recommend more movies", "Show my tasks"],
          topicContext: "entertainment_movies",
        };
      }

      if (topic === "programming_projects_beginner") {
        return {
          text:
            `For a beginner, the absolute best project to start with is **Project #3: Task & Priority Manager**!\n\n` +
            `• **Why:** It teaches you the core building blocks of all software development (CRUD operations, data structures, and database persistence) without having to wrestle with external API rate limits or network issues.\n` +
            `• **Next Step:** Once you have a working task manager, tackle the Weather Dashboard to master asynchronous HTTP requests!`,
          suggestedFollowUps: ["How do I structure the task manager?", "Suggest another project", "Create task: Build task manager"],
          topicContext: "programming_projects_beginner",
        };
      }

      return {
        text:
          `Starting with the simplest option that gives you immediate visual feedback is always the best approach! It lets you build confidence, grasp the core fundamentals, and iterate quickly from there.`,
        suggestedFollowUps: ["Suggest some project ideas", "Explain recursion in C++", "Show my tasks"],
      };
    }

    return null;
  }

  // =========================================================================
  // 8. Technical and Science Topics
  // =========================================================================
  private static handleTechnicalAndScience(lower: string): EngineResponse | null {
    if (lower.includes("recursion") || lower.includes("recursive")) {
      return {
        text:
          `### 🔄 **Recursion in Computer Science**\n\n` +
          `**Recursion** is a programming technique where a function solves a problem by calling itself with smaller inputs, until it reaches a terminating state called the **base case**.\n\n` +
          `#### The Two Pillars of Recursion:\n` +
          `1. **Base Case:** The condition where the function stops calling itself and returns a direct value. Without this, you trigger a *stack overflow*.\n` +
          `2. **Recursive Step:** The part where the function calls itself, breaking the problem down closer to the base case.\n\n` +
          `#### Example: Factorial in C++\n` +
          `\`\`\`cpp\n` +
          `#include <iostream>\n\n` +
          `long long factorial(int n) {\n` +
          `    if (n <= 1) return 1; // Base case\n` +
          `    return n * factorial(n - 1); // Recursive call\n` +
          `}\n\n` +
          `int main() {\n` +
          `    std::cout << "5! = " << factorial(5) << std::endl; // Output: 120\n` +
          `    return 0;\n` +
          `}\n` +
          `\`\`\``,
        suggestedFollowUps: [
          "Give me an example",
          "Now give me the code in Java",
          "What is the difference between recursion and iteration?",
        ],
        topicContext: "recursion",
      };
    }

    if (lower.includes("binary search")) {
      return {
        text:
          `### 🔍 **Binary Search: The Logarithmic Search Algorithm**\n\n` +
          `**Binary Search** is an efficient divide-and-conquer algorithm for finding an element in a **sorted array**. Instead of checking elements one-by-one ($O(n)$ linear search), binary search halves the search space at each step, achieving **$O(\\log n)$** time complexity.\n\n` +
          `#### How It Works:\n` +
          `1. Maintain two pointers: \`low\` (start) and \`high\` (end).\n` +
          `2. Calculate the middle index: \`mid = low + (high - low) / 2\`.\n` +
          `3. If \`array[mid] == target\`, you found it!\n` +
          `4. If \`target < array[mid]\`, eliminate the right half: \`high = mid - 1\`.\n` +
          `5. If \`target > array[mid]\`, eliminate the left half: \`low = mid + 1\`.\n` +
          `6. Repeat while \`low <= high\`. If pointers cross, the target is not in the array.`,
        suggestedFollowUps: [
          "Give me an example",
          "Now give me the code in C++",
          "Explain the while loop in that code",
        ],
        topicContext: "binary_search",
      };
    }

    if (lower.includes("quantum computing") || lower.includes("quantum")) {
      return {
        text:
          `### ⚛️ **Quantum Computing in Simple Terms**\n\n` +
          `Classical computers (like laptops and phones) process information in **bits** that are strictly either **0** or **1**—like a light switch that is either OFF or ON.\n\n` +
          `A quantum computer uses **qubits** (quantum bits). Thanks to quantum physics, qubits have two extraordinary properties:\n\n` +
          `1. **Superposition:** A qubit can exist in a superposition of both states simultaneously (like a spinning coin before it lands).\n` +
          `2. **Entanglement:** Multiple qubits can be entangled, meaning the state of one instantly correlates with another, no matter how far apart they are.\n\n` +
          `This allows quantum computers to process massive combinations in parallel, revolutionizing molecular simulation, materials science, and cryptography.`,
        suggestedFollowUps: [
          "Give me an example",
          "What is quantum entanglement?",
          "Can quantum computers replace classical computers?",
        ],
        topicContext: "quantum_computing",
      };
    }

    if (lower.includes("machine learning") || (lower.includes("what is ai") && !lower.includes("astra"))) {
      return {
        text:
          `### 🧠 **Machine Learning Explained**\n\n` +
          `In traditional programming: **Data + Rules = Answers**.\n\n` +
          `In **Machine Learning (ML)**: **Data + Answers = Rules**. Algorithms learn patterns directly from datasets to make accurate predictions without being hand-coded.\n\n` +
          `1. **Supervised:** Trained on labeled examples (e.g. spam detection, price prediction).\n` +
          `2. **Unsupervised:** Discovers hidden structures in raw data (e.g. customer clustering).\n` +
          `3. **Reinforcement:** An agent learns through rewards and penalties (e.g. robotics, game playing).`,
        suggestedFollowUps: [
          "Suggest some project ideas",
          "What do you think about learning AI in college?",
        ],
        topicContext: "machine_learning",
      };
    }


    return null;
  }

  // =========================================================================
  // 9. Advice, Brainstorming & Writing
  // =========================================================================
  private static handleCreativeAndAdvice(lower: string): EngineResponse | null {
    if (lower.includes("learning ai in college") || lower.includes("ai in college") || lower.includes("study ai")) {
      return {
        text:
          `### 🎓 **Is Learning AI in College Worth It? A Balanced Perspective**\n\n` +
          `Studying Artificial Intelligence during college is one of the highest-leverage investments you can make, provided you balance **academic foundations** with **hands-on building**.\n\n` +
          `#### Key Advantages:\n` +
          `1. **Mathematical Foundations:** Mastering Linear Algebra, Probability, and Optimization gives you an edge over engineers who only know how to call APIs.\n` +
          `2. **Systems Fundamentals:** Understanding OS, Compilers, and Distributed Systems enables you to build high-performance pipelines.\n` +
          `3. **Peer Community:** Opportunities to collaborate in labs and compete in hackathons.\n\n` +
          `*Recommendation:* Use college for theory, algorithms, and systems; and build personal side-projects with modern protocols like MCP to stay on the bleeding edge!`,
        suggestedFollowUps: [
          "Suggest some project ideas",
          "What math do I need for Machine Learning?",
        ],
      };
    }

    if (
      lower.includes("project idea") ||
      lower.includes("project ideas") ||
      lower.includes("programming project") ||
      lower.includes("coding project") ||
      lower.includes("suggest some project")
    ) {
      return {
        text:
          `### 🚀 **Top Beginner-Friendly Programming Project Ideas**\n\n` +
          `1. **Personal AI Assistant / Chatbot with Tool Integrations (Full-Stack)**\n` +
          `   • **Why it's great:** Teaches client-server architecture, REST APIs, JSON data contracts, and state management.\n` +
          `   • **Stack:** React/TypeScript frontend + Node.js or Python backend.\n\n` +
          `2. **Interactive Weather & Air Quality Dashboard**\n` +
          `   • **Why it's great:** Hands-on practice fetching public REST APIs, handling async promises, and charting forecasts.\n` +
          `   • **Stack:** Vanilla JS or React + Open-Meteo API.\n\n` +
          `3. **Task & Priority Manager with Local Persistence**\n` +
          `   • **Why it's great:** Teaches CRUD operations, database schemas, filtering, and priority sorting.\n` +
          `   • **Stack:** Python + SQLite or TypeScript + Express.\n\n` +
          `4. **Markdown Notes & Fast Search Engine**\n` +
          `   • **Why it's great:** Teaches string parsing, keyword indexing, and responsive UI components.\n\n` +
          `*Which of these sounds most exciting to you? I can help you plan the architecture step-by-step!*`,
        suggestedFollowUps: [
          "Which one is best for beginners?",
          "Explain how to build the personal assistant",
          "Create task: Start personal project",
        ],
        topicContext: "programming_projects_beginner",
      };
    }

    if ((lower.includes("ram") && lower.includes("storage")) || lower.includes("ram vs storage")) {
      return {
        text:
          `### 💾 **RAM vs. Storage: Key Differences Explained**\n\n` +
          `While both RAM and storage hold computer data, they serve completely different purposes:\n\n` +
          `1. **RAM (Random Access Memory) — Working Memory:**\n` +
          `   • **Purpose:** Holds the operating system, running apps, and active data currently in use by the CPU.\n` +
          `   • **Volatility:** **Volatile** — all data is erased immediately when the system shuts down or restarts.\n` +
          `   • **Speed:** Extremely fast (nanosecond latencies / tens of gigabytes per second).\n` +
          `   • **Typical Size:** **8 GB to 64 GB** on modern personal computers.\n\n` +
          `2. **Storage (SSD / Hard Drive) — Long-Term Memory:**\n` +
          `   • **Purpose:** Permanently preserves your documents, photos, installed programs, and operating system files.\n` +
          `   • **Volatility:** **Non-Volatile** — your files remain saved safely even without electrical power.\n` +
          `   • **Speed:** Slower than RAM (Fast NVMe SSDs reach ~3–7 GB/s; mechanical HDDs reach ~150 MB/s).\n` +
          `   • **Typical Size:** **512 GB to 4 TB** on modern systems.\n\n` +
          `💡 **The Desk Analogy:** Think of **RAM** like your desk surface (where you place the books and papers you are actively reading right now) and **Storage** like your filing cabinet (where you keep everything stored away safely when you're done).`,
        suggestedFollowUps: [
          "Explain how a CPU works",
          "What is virtual memory?",
          "Suggest some project ideas",
        ],
        topicContext: "computer_architecture_ram_storage",
      };
    }

    if (lower.includes("how the internet works") || lower.includes("how does the internet work")) {
      return {
        text:
          `### 🌐 **How the Internet Works in Simple Terms**\n\n` +
          `The Internet is a global network of interconnected computers communicating via standardized protocols (TCP/IP).\n\n` +
          `Here is what happens in milliseconds when you request a website:\n\n` +
          `1. **DNS Lookup:** Your browser checks a Domain Name System (DNS) server to translate \`example.com\` into its physical IP address (e.g. \`93.184.216.34\`).\n` +
          `2. **TCP/TLS Handshake:** Your computer establishes an encrypted, reliable connection with the host server.\n` +
          `3. **HTTP Request:** Your browser sends an HTTP request asking for the HTML, CSS, images, and code.\n` +
          `4. **Packet Routing:** The server divides data into small **packets** that travel across fiber-optic cables and routers to reach your device.\n` +
          `5. **Rendering:** Your browser reassembles the packets and paints the interactive webpage on your screen!`,
        suggestedFollowUps: [
          "What is an IP address?",
          "Explain DNS in simple terms",
          "What is the difference between an API and a REST API?",
        ],
        topicContext: "networking_internet_basics",
      };
    }

    if ((lower.includes("api") && lower.includes("rest api")) || lower.includes("difference between an api and a rest api")) {
      return {
        text:
          `### 🔌 **API vs. REST API: Key Differences**\n\n` +
          `1. **What is an API (Application Programming Interface)?**\n` +
          `   • An API is a general concept: any interface allowing software components to interact without knowing internal mechanics.\n` +
          `   • *Examples:* Java Collections API, Windows Win32 API, or browser \`fetch\` API.\n\n` +
          `2. **What is a REST API?**\n` +
          `   • A **REST API** (Representational State Transfer) is a specific architectural style for web services over HTTP.\n` +
          `   • It uses standard HTTP verbs: **GET** (read), **POST** (create), **PUT/PATCH** (update), **DELETE** (remove).\n` +
          `   • It is **stateless** (each request contains all context needed) and typically formats data in **JSON**.\n\n` +
          `💡 **Summary:** *All REST APIs are APIs, but not all APIs are REST APIs!* REST is simply one popular standard for web APIs.`,
        suggestedFollowUps: [
          "Give me complete code for a simple REST API",
          "Explain how the internet works",
          "Explain recursion in C++",
        ],
        topicContext: "software_architecture_api_rest",
      };
    }

    if (
      lower.includes("movies to watch") ||
      lower.includes("suggest some movies") ||
      lower.includes("recommend movies") ||
      lower.includes("suggest me some movies") ||
      lower.includes("movie recommendations") ||
      ((lower.includes("movie") || lower.includes("movies") || lower.includes("film")) && (lower.includes("recommend") || lower.includes("suggest") || lower.includes("watch")))
    ) {
      return this.handleMovieRecommendations(lower);
    }

    if (lower.includes("organize my day") || lower.includes("plan my day") || lower.includes("daily schedule")) {
      return {
        text:
          `### 📅 **High-Performance Daily Productivity Architecture**\n\n` +
          `### 🌅 **Morning Block (08:30 - 11:30): Deep Work**\n` +
          `• Tackle your single hardest, highest-leverage task first when focus is sharpest.\n\n` +
          `### ☀️ **Midday Block (11:30 - 14:00): Collaboration & Maintenance**\n` +
          `• Lunch, team check-ins, answering urgent emails, and administrative items.\n\n` +
          `### 🌆 **Afternoon Block (14:00 - 17:30): Execution & Polish**\n` +
          `• Secondary tasks, code reviews, writing tests, and running builds.\n\n` +
          `*Would you like me to add your top priority as a task right now?*`,
        suggestedFollowUps: [
          "Create task: Morning deep work session",
          "Show my tasks",
          "Show productivity summary",
        ],
      };
    }

    if (lower.includes("birthday message") || lower.includes("birthday wish") || lower.includes("happy birthday")) {
      return {
        text:
          `Here are a couple of birthday message ideas:\n\n` +
          `**Warm & Heartfelt:**\n` +
          `> "Happy Birthday! 🎉 Wishing you a year ahead filled with joy, great health, and exciting new adventures. Thank you for always bringing so much positivity into every room you walk into!"\n\n` +
          `**Short & Energetic:**\n` +
          `> "Happy Birthday! 🎂 Hope your day is filled with celebration, good food, and everything you wished for. Cheers to another fantastic year!"`,
        suggestedFollowUps: ["Make it funnier", "Write an email template"],
      };
    }


    return null;
  }

  // =========================================================================
  // 11. Human Statements, Thoughts & Everyday Topics
  // =========================================================================
  private static handleHumanStatements(lower: string, clean: string, name?: string): EngineResponse | null {
    const nameTag = name ? ` ${name}` : "";

    // Exams & Studying
    if (lower.includes("exam") || lower.includes("test next week") || lower.includes("studying for")) {
      return {
        text: `Exams can definitely bring some pressure, but with the right pacing and a clear plan, you've got this${nameTag}! Would you like help breaking topics down, reviewing core concepts, or creating a study schedule?`,
        suggestedFollowUps: ["Help me organize my day", "Explain binary search", "Create task: Study session"],
      };
    }

    // Work / Busy Day
    if (lower.includes("busy day") || lower.includes("long day") || lower.includes("lot of work")) {
      return {
        text: `Sounds like you've had a demanding day${nameTag}! Make sure to take some time to decompress, hydrate, and get a good rest tonight.`,
        suggestedFollowUps: ["Tell me a joke", "Tell me something interesting", "Show my tasks"],
      };
    }

    // Programming Passion
    if (lower.includes("like programming") || lower.includes("love coding") || lower.includes("like coding")) {
      return {
        text: `That's awesome${nameTag}! Programming is such an empowering skill—it lets you turn abstract ideas into real, functional tools. What languages or projects have you been enjoying the most?`,
        suggestedFollowUps: ["Suggest some project ideas", "Explain recursion in C++", "Explain binary search"],
      };
    }


    return null;
  }

  // =========================================================================
  // 12. Natural Fallback (NO "interesting question", NO "offline mode" spam)
  // =========================================================================
  private static handleNaturalFallback(
    raw: string,
    clean: string,
    lower: string,
    name?: string
  ): EngineResponse {
    const nameTag = name ? `, ${name}` : "";

    // If it looks like a question
    if (raw.includes("?") || /^(what|why|how|who|where|when|can|do|is|are|should)\b/i.test(clean)) {
      return {
        text:
          `That's a thoughtful point${nameTag}! I'm here and ready to dive deeper into it with you.\n\n` +
          `Tell me a bit more about what you're thinking, or let me know if you'd like to explore related concepts, code, or practical tools!`,
        suggestedFollowUps: [
          "Tell me something interesting",
          "Explain recursion in C++",
          "Suggest some project ideas",
        ],
      };
    }

    // For statements and general remarks
    return {
      text:
        `I hear you${nameTag}! That makes sense. What's on your mind next—would you like to explore a tech topic, chat some more, or work on tasks?`,
      suggestedFollowUps: [
        "Tell me something interesting",
        "Suggest some project ideas",
        "How are you doing today?",
      ],
    };
  }

  // =========================================================================
  // Context Helpers
  // =========================================================================
  private static detectTopicFromHistory(history: Array<{ role: string; content: string }>): string {
    const recent = history.slice(-6);
    for (let i = recent.length - 1; i >= 0; i--) {
      const text = recent[i].content.toLowerCase();
      if (text.includes("movie") || text.includes("movies") || text.includes("shawshank") || text.includes("inception")) return "entertainment_movies";
      if (text.includes("project idea") || text.includes("programming project") || text.includes("beginner-friendly")) return "programming_projects_beginner";
      if (text.includes("binary search")) return "binary_search";
      if (text.includes("recursion") || text.includes("recursive")) return "recursion";
      if (text.includes("quantum computing") || text.includes("quantum")) return "quantum_computing";
      if (text.includes("machine learning")) return "machine_learning";
      if (text.includes("ram") && text.includes("storage")) return "ram_storage";
    }
    return "general";
  }

  private static getLastAssistantMessage(history: Array<{ role: string; content: string }>): string {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "assistant") {
        return history[i].content;
      }
    }
    return "";
  }

  private static extractNameFromHistory(history: Array<{ role: string; content: string }>): string | undefined {
    // Scan history for previous introduction: "myself [name]", "my name is [name]", "i am [name]"
    for (const msg of history) {
      if (msg.role === "user") {
        const match = msg.content.match(/\b(?:myself|mysrlf|my\s*self|my\s*name\s*is|i\s*am|i'm|im|call\s*me)\s+([a-zA-Z]{2,20})\b/i);
        if (match) {
          const candidate = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          const nonNames = ["fine", "good", "great", "well", "okay", "bored", "tired", "sad", "here", "just", "doing"];
          if (!nonNames.includes(candidate.toLowerCase())) {
            return candidate;
          }
        }
      }
    }
    return undefined;
  }

  public static handleMovieRecommendations(
    input: string,
    history: Array<{ role: string; content: string }> = [],
    explicitExclusions: string[] = []
  ): EngineResponse {
    const lower = input.toLowerCase();
    const historyText = history.map((m) => m.content).join(" ").toLowerCase();

    // Check if previous batch was already given
    const alreadyRecommendedInception =
      historyText.includes("inception") ||
      historyText.includes("interstellar") ||
      explicitExclusions.some((e) => e.toLowerCase().includes("inception") || e.toLowerCase().includes("interstellar"));

    if (alreadyRecommendedInception || lower.includes("more") || lower.includes("other") || lower.includes("another")) {
      return {
        text:
          `Here are more distinct, critically acclaimed movie recommendations:\n\n` +
          `1. **Sci-Fi & Thought-Provoking:**\n` +
          `   • **Arrival (2016):** A profound tale of linguistics, time perception, and global unity directed by Denis Villeneuve.\n` +
          `   • **Dune (2021):** A breathtaking visual masterpiece following Paul Atreides across the desert planet Arrakis.\n\n` +
          `2. **Mystery & Psychological Thriller:**\n` +
          `   • **The Prestige (2006):** Christopher Nolan's obsession-fueled battle between two 19th-century stage magicians.\n` +
          `   • **Parasite (2019):** Bong Joon-ho's razor-sharp, Oscar-winning social thriller about class struggle.\n\n` +
          `3. **Inspirational & High-Energy Drama:**\n` +
          `   • **Whiplash (2014):** An electrifying showdown between an ambitious young jazz drummer and his ruthless instructor.\n` +
          `   • **Everything Everywhere All at Once (2022):** A wild, heartwarming multiversal adventure celebrating family and love.\n\n` +
          `*Would you like more recommendations in any specific genre (e.g., animated, comedy, horror)?*`,
        suggestedFollowUps: [
          "Which one is best for beginners?",
          "Recommend animated masterpieces",
          "Suggest comedy movies",
        ],
        topicContext: "entertainment_movies",
      };
    }

    return {
      text:
        `Here are some top movie recommendations across great genres:\n\n` +
        `1. **Sci-Fi & Mind-Bending:**\n` +
        `   • **Interstellar (2014):** A journey through a wormhole exploring human survival, time dilation, and deep emotional bonds.\n` +
        `   • **Inception (2010):** A heist thriller set within the architecture of shared subconscious dreams.\n\n` +
        `2. **Drama & Hope:**\n` +
        `   • **The Shawshank Redemption (1994):** An uplifting story of resilience, friendship, and patience inside Shawshank Prison.\n` +
        `   • **Good Will Hunting (1997):** A touching story of a genius janitor finding mentorship and emotional healing.\n\n` +
        `3. **Action & Crime Thriller:**\n` +
        `   • **The Dark Knight (2008):** Christopher Nolan's legendary crime epic featuring the unforgettable Joker.\n\n` +
        `*Do you have a specific genre preference (sci-fi, thriller, comedy, or drama)? Let me know and I can tailor more picks for you!*`,
      suggestedFollowUps: [
        "Which one is best for beginners?",
        "Suggest some sci-fi thrillers",
        "Recommend some feel-good movies",
      ],
      topicContext: "entertainment_movies",
    };
  }
}
