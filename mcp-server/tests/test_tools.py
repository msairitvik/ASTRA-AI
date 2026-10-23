import pytest
import os
from pathlib import Path

# Set temporary DB for testing
test_db_path = str(Path(__file__).parent / "test_astra.db")
os.environ["ASTRA_DB_PATH"] = test_db_path

from app.services.db import init_db, reset_all_data
from app.tools.datetime_tool import get_current_datetime
from app.tools.calc_tool import calculate
from app.tools.tasks_tool import create_task, list_tasks, complete_task, delete_task
from app.tools.notes_tool import create_note, list_notes, search_notes, delete_note
from app.tools.productivity_tool import get_productivity_summary
from app.tools.units_tool import convert_units

@pytest.fixture(autouse=True)
def setup_db():
    init_db(seed_if_empty=False)
    yield
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass

def test_datetime_tool():
    res = get_current_datetime("UTC")
    assert "iso" in res
    assert "date" in res
    assert res["timezone"] == "UTC"

    # Test timezone fallback on invalid tz
    fallback = get_current_datetime("Invalid/NonExistent_Zone_123")
    assert "UTC" in fallback["timezone"]

def test_calculate_tool():
    # Simple arithmetic
    res = calculate("2 + 2 * 10")
    assert res["status"] == "success"
    assert res["result"] == 22

    # Math function
    res2 = calculate("sqrt(144) + 6")
    assert res2["status"] == "success"
    assert res2["result"] == 18

    # Division by zero safety
    res_div = calculate("10 / 0")
    assert res_div["status"] == "error"
    assert "zero" in res_div["error"].lower()

    # Blocked arbitrary code execution
    res_unsafe = calculate("__import__('os').system('dir')")
    assert res_unsafe["status"] == "error"

def test_task_lifecycle():
    # Create task
    c_res = create_task(title="Build hackathon demo", priority="urgent", category="dev")
    assert c_res["status"] == "success"
    task = c_res["task"]
    assert task["title"] == "Build hackathon demo"
    assert task["status"] == "pending"
    task_id = task["id"]

    # List tasks
    l_res = list_tasks(priority="urgent")
    assert l_res["status"] == "success"
    assert any(t["id"] == task_id for t in l_res["tasks"])

    # Complete task
    comp_res = complete_task(task_id)
    assert comp_res["status"] == "success"
    assert comp_res["task"]["status"] == "completed"
    assert comp_res["task"]["completed_at"] is not None

    # Complete non-existent task
    err_comp = complete_task("non-existent-uuid-1234")
    assert err_comp["status"] == "error"

    # Delete task
    del_res = delete_task(task_id)
    assert del_res["status"] == "success"

def test_note_lifecycle():
    # Create note
    c_res = create_note(title="Meeting Notes", content="Discuss Alexa+ track criteria", category="work", tags="mcp,hackathon")
    assert c_res["status"] == "success"
    note = c_res["note"]
    note_id = note["id"]

    # Search notes
    s_res = search_notes(query="Alexa+")
    assert s_res["status"] == "success"
    assert len(s_res["notes"]) >= 1

    # Delete note
    d_res = delete_note(note_id)
    assert d_res["status"] == "success"

def test_productivity_summary():
    create_task(title="Task A", priority="high")
    create_task(title="Task B", priority="medium")
    summary_res = get_productivity_summary()
    assert summary_res["status"] == "success"
    summary = summary_res["summary"]
    assert summary["total_tasks"] >= 2
    assert "completion_rate_percent" in summary

def test_unit_conversion():
    # Length
    l_res = convert_units(5.0, "km", "miles")
    assert l_res["status"] == "success"
    assert round(l_res["result"], 2) == 3.11

    # Temperature
    t_res = convert_units(100.0, "celsius", "fahrenheit")
    assert t_res["status"] == "success"
    assert t_res["result"] == 212.0

    # Digital storage
    d_res = convert_units(1.0, "gb", "mb")
    assert d_res["status"] == "success"
    assert d_res["result"] == 1024.0
