# Amazon Developer Hackathon — ASTRA AI Submission Checklist

**Track:** Alexa+ Track (Build, Ship, Shape)  
**Submission Portal:** Devpost  

---

## 1. Pre-Submission Verification Checklist

- [x] **Self-Hosted MCP Server:** Implemented using official Python SDK (`mcp 2.3.0`).
- [x] **Streamable HTTP Transport:** Tested and verified at `http://127.0.0.1:8000/mcp`.
- [x] **Protocol Specification:** Verified compliant with `2025-11-25` and modern protocol negotiation.
- [x] **Tool Discovery:** 15 tools discovered dynamically via `tools/list`.
- [x] **Tool Invocation:** Verified via `tools/call` with structured outputs.
- [x] **Official Client SDK:** TypeScript BFF connects via `@modelcontextprotocol/sdk`.
- [x] **Frontend Polish:** React 18 + Vite + Tailwind CSS with animated AI Orb and responsive design.
- [x] **Data Persistence:** SQLite database preserves tasks, notes, and activity across restarts.
- [x] **Automated Tests:** 100% pytest test suites passing for tools and protocol.
- [x] **Clean Repository:** No secrets, API keys, or private credentials committed.

---

## 2. Devpost Submission Text Draft

### Project Title
**ASTRA AI — Your World. One Intelligent Assistant.**

### Elevator Pitch (Short Description)
An independent Alexa+-inspired multi-page AI assistant web application powered by a self-hosted Model Context Protocol (MCP) server over Streamable HTTP, featuring dynamic voice interaction, personal productivity, and real-time tool execution.

### What it does
ASTRA AI delivers a general-purpose conversational assistant experience that helps users with everyday queries, mathematics, personal organization, notes, and live public information. It connects to an autonomous, self-hosted Model Context Protocol server exposing 15 verified tools—including AST-safe calculations, world timezones, live atmospheric weather via Open-Meteo, unit conversions, and persistent task/note management.

### How we built it
- **Python MCP Server:** Powered by `mcp 2.3.0` and Starlette ASGI serving Streamable HTTP at `/mcp`.
- **Node.js Client BFF:** Built with Express, TypeScript, and `@modelcontextprotocol/sdk` to manage sessions, negotiate protocol versions, and route user intents.
- **React Frontend:** Developed with React 18, Vite, Tailwind CSS, Lucide icons, and Recharts, featuring a signature luminous animated AI Orb reflecting idle, listening, processing, and speaking states.
- **Persistence Layer:** Robust SQLite database configured in WAL mode ensuring instant synchronization across chat interactions and dashboard pages.

### Challenges we ran into
Implementing the newest MCP Streamable HTTP transport standard (spec version 2025-11-25) required resolving session state headers and task group initialization within ASGI lifespans. We also engineered a safe AST parser to allow mathematical expressions without arbitrary code execution vulnerabilities.

### Accomplishments that we're proud of
- Achieving 100% protocol compliance verified by automated client test suites.
- Building a responsive, multi-page application with 8 functional pages and real-time data persistence.
- Zero mandatory paid API keys: runs completely on local hardware with transparent fallbacks.

---

## 3. Remaining Manual Actions for the User

1. **Record Video Demonstration:** Use the script in `docs/demo-script.md` to record a screencast under 3 minutes.
2. **Upload Demo Video:** Upload to YouTube (Public or Unlisted) or Vimeo.
3. **Push to GitHub:** Push this workspace to your public or hackathon-shared GitHub repository.
4. **Submit on Devpost:**
   - Link your GitHub repository.
   - Paste the video URL.
   - Copy the submission text from above.
   - Select the **Alexa+** track.
