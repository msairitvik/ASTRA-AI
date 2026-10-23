# ASTRA AI — Hackathon Video Demonstration Script

**Target Duration:** < 3 minutes (Approx. 2 minutes 45 seconds)  
**Hackathon:** Amazon Build, Ship, Shape — Alexa+ Track  
**Presenter:** Project Creator  

---

### [0:00 - 0:25] Opening Hook & Identity
**Visual:** Screen recording opens on ASTRA AI Landing Page (`http://localhost:5173`). The glowing AI Orb floats smoothly in the center of the screen in its idle state.
**Audio / Narration:**
> *"Welcome! This is ASTRA AI — 'Your world. One intelligent assistant.' Built for the Amazon Developer Hackathon's Alexa+ track, ASTRA AI is a general-purpose conversational assistant designed to help with everyday organization, calculations, and live utilities through a real, self-hosted Model Context Protocol server over Streamable HTTP."*

---

### [0:25 - 0:55] The Conversational Assistant & Orb Reaction
**Visual:** Click "Open Assistant" to navigate to `/chat`. Click the microphone button (or type). Orb immediately transitions into the vibrant cyan pulsing **Listening** state.
**Query:** *"What is the weather in Seattle right now?"*
**Visual:** Orb shifts into the spinning purple **Thinking** state. The assistant renders the reply along with the verified `get_weather` MCP tool pill. The assistant speaks the response aloud while the Orb ripples in the teal **Speaking** state.
**Audio / Narration:**
> *"Notice the dynamic AI energy orb: it visually reflects when ASTRA is listening, executing a protocol query, and speaking. Instead of hardcoded strings or mock animations, this weather response was retrieved in real-time through an official MCP tool using Streamable HTTP."*

---

### [0:55 - 1:35] Math Calculation & Knowledge Capture
**Visual:** Click on the suggested prompt or type:
**Query:** *"Calculate sqrt(144) * 25 + 50"*
**Visual:** Assistant executes `calculate` in 8ms and returns 350. Click the tool card's dropdown arrow to show the raw JSON-RPC arguments and output.
**Audio / Narration:**
> *"Calculations run through a safe AST math evaluator that blocks arbitrary code execution. We can inspect the exact JSON-RPC request and response payload directly in the UI."*

---

### [1:35 - 2:15] Productivity & Unified Persistent State
**Visual:** Type: *"Create task: Ship Alexa+ hackathon project with urgent priority"*.
**Visual:** Assistant confirms task creation with UUID. Navigate to the **Tasks & Priorities** page (`/tasks`).
**Visual:** The new task is immediately visible with its 'URGENT' badge. Click the checkmark to mark it completed. The completed count increases, and the completion rate in the Productivity Summary recalculates live.
**Audio / Narration:**
> *"When ASTRA AI creates or completes a task, it modifies our persistent SQLite repository. Navigating to the Tasks dashboard, the task is already synchronized. Completing it updates our productivity metrics across the entire application in real time."*

---

### [2:15 - 2:40] MCP Tools Directory & Verification
**Visual:** Navigate to the **MCP Tools** page (`/tools`).
**Visual:** Show the 15 discovered tools. Click "Test Tool" on `get_current_datetime`, execute it, and show the round-trip latency (e.g. 12ms).
**Audio / Narration:**
> *"On the Tools page, every capability is dynamically discovered using the official `tools/list` protocol method. We can test any tool in real time and see verified compliance with MCP specification version 2025-11-25."*

---

### [2:40 - 2:50] Closing
**Visual:** Return to the Landing Page or Settings page showing the green "Streamable HTTP Verified" indicator.
**Audio / Narration:**
> *"ASTRA AI proves that the Model Context Protocol enables powerful, modular, and privacy-respecting assistants. Thank you for watching!"*
