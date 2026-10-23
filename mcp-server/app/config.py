import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = os.environ.get("ASTRA_DB_PATH", str(DATA_DIR / "astra.db"))
MCP_HOST = os.environ.get("MCP_HOST", "127.0.0.1")
MCP_PORT = int(os.environ.get("MCP_PORT", "8000"))
MCP_PATH = os.environ.get("MCP_PATH", "/mcp")
DEFAULT_TIMEZONE = os.environ.get("DEFAULT_TIMEZONE", "UTC")
SERVER_NAME = "ASTRA AI MCP Server"
SERVER_VERSION = "1.0.0"
