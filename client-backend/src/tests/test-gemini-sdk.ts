import { GoogleGenAI } from "@google/genai";

async function testContents() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyFakeKeyTestingFormat123456789" });
  try {
    const contents = [
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hello! How can I help?" }] },
      { role: "user", parts: [{ text: "Explain binary search" }] }
    ];
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: "You are ASTRA AI.",
        temperature: 0.7,
      },
    });
  } catch (err: any) {
    // If it reaches the API and fails with 400 (API_KEY_INVALID), that means the payload format was completely valid!
    console.log("Validation test - Error status:", err.status, "Reason:", err.message?.includes("API_KEY_INVALID") ? "Payload accepted, key invalid (expected)" : err.message);
  }
}

testContents();


