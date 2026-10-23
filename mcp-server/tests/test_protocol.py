import pytest
import anyio
import time
import threading
import json
import os
from pathlib import Path

# Ensure test DB
test_db_path = str(Path(__file__).parent / "test_protocol_astra.db")
os.environ["ASTRA_DB_PATH"] = test_db_path

from app.server import server
from app.services.db import init_db
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

TEST_HOST = "127.0.0.1"
TEST_PORT = 8995
TEST_PATH = "/mcp"
TEST_URL = f"http://{TEST_HOST}:{TEST_PORT}{TEST_PATH}"

@pytest.fixture(scope="module")
def run_mcp_server():
    init_db(seed_if_empty=True)
    def _run():
        server.run(
            transport="streamable-http",
            host=TEST_HOST,
            port=TEST_PORT,
            streamable_http_path=TEST_PATH
        )

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    time.sleep(2.0)
    yield
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass

@pytest.mark.anyio
async def test_mcp_protocol_negotiation_and_tools(run_mcp_server):
    async with streamable_http_client(TEST_URL) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            # 1. Initialization and protocol negotiation
            init_res = await session.initialize()
            assert init_res is not None
            assert init_res.server_info.name == "ASTRA AI Assistant"
            assert init_res.protocol_version in ["2025-11-25", "2026-07-28"]

            # 2. Tool discovery
            tools_res = await session.list_tools()
            tool_names = [t.name for t in tools_res.tools]
            assert "get_current_datetime" in tool_names
            assert "calculate" in tool_names
            assert "create_task" in tool_names
            assert "list_tasks" in tool_names
            assert "complete_task" in tool_names
            assert "create_note" in tool_names
            assert "search_notes" in tool_names
            assert "get_productivity_summary" in tool_names
            assert "convert_units" in tool_names
            assert "get_weather" in tool_names

            # 3. Call get_current_datetime
            dt_call = await session.call_tool("get_current_datetime", {"timezone_str": "UTC"})
            assert len(dt_call.content) > 0
            dt_data = json.loads(dt_call.content[0].text)
            assert "iso" in dt_data
            assert dt_data["timezone"] == "UTC"

            # 4. Call calculate
            calc_call = await session.call_tool("calculate", {"expression": "25 * 4 + 10"})
            assert len(calc_call.content) > 0
            calc_data = json.loads(calc_call.content[0].text)
            assert calc_data["status"] == "success"
            assert calc_data["result"] == 110

            # 5. Call create_task
            task_call = await session.call_tool("create_task", {
                "title": "Protocol verified task",
                "priority": "high",
                "category": "qa"
            })
            assert len(task_call.content) > 0
            task_data = json.loads(task_call.content[0].text)
            assert task_data["status"] == "success"
            created_task = task_data["task"]
            task_id = created_task["id"]

            # 6. Call list_tasks
            list_call = await session.call_tool("list_tasks", {"priority": "high"})
            list_data = json.loads(list_call.content[0].text)
            assert list_data["status"] == "success"
            assert any(t["id"] == task_id for t in list_data["tasks"])

            # 7. Call complete_task
            comp_call = await session.call_tool("complete_task", {"task_id": task_id})
            comp_data = json.loads(comp_call.content[0].text)
            assert comp_data["status"] == "success"
            assert comp_data["task"]["status"] == "completed"

            # 8. Call productivity summary
            prod_call = await session.call_tool("get_productivity_summary", {})
            prod_data = json.loads(prod_call.content[0].text)
            assert prod_data["status"] == "success"
            assert prod_data["summary"]["total_tasks"] > 0
