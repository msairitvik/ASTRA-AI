# ASTRA AI

> **Your world. One intelligent assistant.**

[![Model Context Protocol](https://img.shields.io/badge/MCP-2025--11--25%2B-blueviolet.svg)](https://modelcontextprotocol.io)
[![Transport](https://img.shields.io/badge/Transport-Streamable%20HTTP-cyan.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Hackathon-Amazon%20Build%2C%20Ship%2C%20Shape-orange.svg)](#hackathon-context)

ASTRA AI is a complete, multi-page, general-purpose AI assistant web application inspired by the conversational capabilities and product experience of **Alexa+**. Built for the **Amazon Developer Hackathon (Alexa+ Track)**, ASTRA AI demonstrates genuine **Model Context Protocol (MCP)** integration over **Streamable HTTP** with a self-hosted Python server, a TypeScript BFF client, and a responsive React frontend.

---

## 🌟 Key Capabilities

- **Real Streamable HTTP MCP Server:** Fully compliant with MCP specification version `2025-11-25` or later, running on the official `mcp 2.3.0` Python SDK at `/mcp`.
- **15 Discoverable MCP Tools:** Dynamically registered and discovered via `tools/list`, including world timezones, safe AST math, task management, notes, live weather, unit conversions, and productivity analytics.
- **Signature AI Energy Orb:** Distinctive CSS/SVG animated visual core with four active states: `idle`, `listening`, `processing`, and `speaking`.
- **Integrated Voice Capabilities:** Hands-free voice input via the Web Speech API and spoken speech synthesis with auto-speech controls and graceful offline fallbacks.
- **Unified SQLite Persistence:** Changes made in chat immediately synchronize with dedicated **Tasks**, **Notes**, and **Activity** dashboard pages.
- **Zero Mandatory Paid Keys:** Operates 100% locally with transparent built-in intelligence and an optional cloud LLM provider adapter (Gemini / OpenAI).

---

## 🏛️ System Architecture

ASTRA AI is organized as a decoupled, modular three-tier architecture:

```
ASTRA-AI/
├── frontend/               # React 18 + Vite + Tailwind CSS + Recharts
│   └── src/
│       ├── components/     # Dynamic Orb, ToolResultCard, Sidebar, Header
│       ├── pages/          # 8 Pages: Landing, Chat, Explore, Tools, Tasks, Notes, Activity, Settings
│       ├── hooks/          # Web Speech voice & speech synthesis hook
│       └── services/       # Typed REST API client
├── client-backend/         # Node.js + Express + TypeScript BFF
│   └── src/
│       ├── mcp-client/     # Official @modelcontextprotocol/sdk Client
│       ├── routes/         # REST endpoints (/api/chat, /api/tools, /api/tasks, etc.)
│       └── services/       # Intent router and assistant service
├── mcp-server/             # Python 3.14 + Official MCP Python SDK (mcp 2.3.0)
│   └── app/
│       ├── server.py       # Streamable HTTP MCP server at /mcp
│       ├── tools/          # 15 MCP tool handlers
│       └── services/       # SQLite repository and WAL connection manager
├── data/                   # Persistent SQLite database (astra.db)
├── scripts/                # Verification and startup scripts
└── docs/                   # Architecture, demo script, feedback, and checklist
```

---

## 🚀 Quick Start on Windows

### Prerequisites
- **Python 3.11+** (Tested on Python 3.14)
- **Node.js 18+** (Tested on Node.js v24)
- **Git**

---

### Method 1: One-Click Startup Script (PowerShell)

Open PowerShell in the project root directory:

```powershell
.\scripts\run_dev.ps1
```

This script automatically initializes the Python virtual environment, installs dependencies, builds TypeScript code, and starts the three application tiers.

---

### Method 2: Manual Terminal Startup (Recommended for Beginners)

Open **three separate terminal windows** from the project root (`c:\Users\Sai Ritvik\OneDrive\Desktop\Alexa+`):

#### Terminal 1: Start Python MCP Server
```powershell
# Activate virtual environment
.\.venv\Scripts\activate

# Set pythonpath and start server
$env:PYTHONPATH="mcp-server"
python -m mcp-server.app.server
```
*Server starts at `http://127.0.0.1:8000/mcp` with Streamable HTTP transport.*

#### Terminal 2: Start Client Backend (BFF)
```powershell
cd client-backend
npm run dev
```
*Backend starts at `http://127.0.0.1:3001` and connects to the MCP Server.*

#### Terminal 3: Start React Frontend
```powershell
cd frontend
npm run dev
```
*Frontend opens at `http://127.0.0.1:5173`.*

---

## 🔍 Protocol Verification

ASTRA AI includes an automated verification script that connects as an official MCP client, negotiates the protocol, discovers tools, and executes baseline tool calls:

```powershell
.\.venv\Scripts\python.exe scripts/verify_mcp.py --url http://127.0.0.1:8000/mcp
```

### Running Backend Unit & Protocol Tests
```powershell
$env:PYTHONPATH="mcp-server"
.\.venv\Scripts\pytest.exe -v mcp-server/tests/test_tools.py
.\.venv\Scripts\pytest.exe -v mcp-server/tests/test_protocol.py
```
*(All 7 test suites pass with 100% success).*

---

## 🛠️ Registered MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_current_datetime` | `timezone_str: str` | Return accurate timezone-aware date, time, and epoch. |
| `calculate` | `expression: str` | Safe AST formula evaluation (arithmetic, roots, trig, powers). |
| `create_task` | `title, description, priority, due_date, category` | Create and save task in persistent SQLite. |
| `list_tasks` | `status, priority, category` | Query tasks with optional filters. |
| `complete_task` | `task_id: str` | Mark task as completed with audit logging. |
| `delete_task` | `task_id: str` | Permanently delete a task. |
| `create_note` | `title, content, category, tags` | Persist notes into the knowledge base. |
| `search_notes` | `query, category` | Full-text search across titles, contents, and tags. |
| `list_notes` | `category: str` | Retrieve all notes by category. |
| `delete_note` | `note_id: str` | Permanently delete a note. |
| `get_productivity_summary` | *(none)* | Live completion rates and active task analytics. |
| `get_weather` | `city: str` | Live global weather forecast via Open-Meteo API. |
| `convert_units` | `value, from_unit, to_unit` | Length, weight, temperature, and storage conversion. |
| `get_activity_logs` | `limit, filter_type` | Retrieve verified audit trail of all operations. |
| `reset_demo_data` | *(none)* | Restores initial clean seed data for hackathon evaluation. |

---

## 📄 Hackathon Transparency Notice

ASTRA AI is an independent project created for the **Amazon Build, Ship, Shape Hackathon (Alexa+ Track)**. It is inspired by the conversational and product experience of Alexa+ but is not endorsed by or affiliated with Amazon's proprietary preview environment. All Model Context Protocol implementations use public, open specifications and official SDKs.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
