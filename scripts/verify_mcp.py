#!/usr/bin/env python3
"""
ASTRA AI - Official MCP Protocol Verification Script
Verifies:
1. Streamable HTTP connection to /mcp
2. MCP Initialization and Protocol Negotiation (spec version 2025-11-25 or later)
3. Tool Discovery via tools/list
4. Tool Invocations via tools/call with structured outputs
"""

import sys
import os
import json
import argparse
from datetime import datetime, timezone

try:
    import anyio
    from mcp.client.session import ClientSession
    from mcp.client.streamable_http import streamable_http_client
except ImportError:
    print("Error: 'mcp' or 'anyio' packages not found. Run pip install -r mcp-server/requirements.txt")
    sys.exit(1)

def print_header(text: str):
    print("\n" + "=" * 65)
    print(f" {text}")
    print("=" * 65)

async def verify(server_url: str):
    print_header("ASTRA AI - MCP PROTOCOL VERIFICATION SUITE")
    print(f"Target MCP Endpoint : {server_url}")
    print(f"Timestamp           : {datetime.now(timezone.utc).isoformat()}")

    results = {
        "endpoint": server_url,
        "negotiated_protocol_version": None,
        "server_info": None,
        "tools_discovered": [],
        "tools_tested": {},
        "all_passed": False
    }

    try:
        async with streamable_http_client(server_url) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                # 1. Initialize Handshake
                print("\n[Step 1/4] Performing MCP Initialization Handshake...")
                init_res = await session.initialize()
                results["negotiated_protocol_version"] = init_res.protocol_version
                results["server_info"] = {
                    "name": init_res.server_info.name,
                    "version": init_res.server_info.version
                }
                print(f"  --> Status: SUCCESS")
                print(f"  --> Negotiated Protocol Version: {init_res.protocol_version}")
                print(f"  --> Server Info: {init_res.server_info.name}")

                # 2. Tool Discovery
                print("\n[Step 2/4] Discovering Tools (tools/list)...")
                tools_res = await session.list_tools()
                for tool in tools_res.tools:
                    results["tools_discovered"].append({
                        "name": tool.name,
                        "description": tool.description
                    })
                    print(f"  * {tool.name.ljust(26)} : {tool.description[:60]}...")
                print(f"  --> Total Tools Discovered: {len(results['tools_discovered'])}")

                # 3. Baseline Tool Invocations
                print("\n[Step 3/4] Invoking Baseline MCP Tools (tools/call)...")

                # Test 1: get_current_datetime
                print("  -> Calling 'get_current_datetime'...")
                dt_call = await session.call_tool("get_current_datetime", {"timezone_str": "UTC"})
                dt_text = dt_call.content[0].text if dt_call.content else "{}"
                dt_json = json.loads(dt_text)
                results["tools_tested"]["get_current_datetime"] = {
                    "status": "PASS" if "iso" in dt_json else "FAIL",
                    "output": dt_json
                }
                print(f"     Result: {dt_json.get('readable', dt_text)}")

                # Test 2: calculate
                print("  -> Calling 'calculate' (expression: '12 * 12 + 56')...")
                calc_call = await session.call_tool("calculate", {"expression": "12 * 12 + 56"})
                calc_text = calc_call.content[0].text if calc_call.content else "{}"
                calc_json = json.loads(calc_text)
                results["tools_tested"]["calculate"] = {
                    "status": "PASS" if calc_json.get("result") == 200 else "FAIL",
                    "output": calc_json
                }
                print(f"     Result: {calc_json.get('result')}")

                # Test 3: create_task
                print("  -> Calling 'create_task'...")
                task_call = await session.call_tool("create_task", {
                    "title": "Protocol Verification Task",
                    "priority": "urgent",
                    "category": "verification"
                })
                task_text = task_call.content[0].text if task_call.content else "{}"
                task_json = json.loads(task_text)
                task_id = task_json.get("task", {}).get("id")
                results["tools_tested"]["create_task"] = {
                    "status": "PASS" if task_id else "FAIL",
                    "output": task_json
                }
                print(f"     Created Task ID: {task_id}")

                # Test 4: complete_task
                if task_id:
                    print(f"  -> Calling 'complete_task' (ID: {task_id})...")
                    comp_call = await session.call_tool("complete_task", {"task_id": task_id})
                    comp_text = comp_call.content[0].text if comp_call.content else "{}"
                    comp_json = json.loads(comp_text)
                    results["tools_tested"]["complete_task"] = {
                        "status": "PASS" if comp_json.get("status") == "success" else "FAIL",
                        "output": comp_json
                    }
                    print(f"     Status: {comp_json.get('task', {}).get('status')}")

                # Test 5: get_productivity_summary
                print("  -> Calling 'get_productivity_summary'...")
                prod_call = await session.call_tool("get_productivity_summary", {})
                prod_text = prod_call.content[0].text if prod_call.content else "{}"
                prod_json = json.loads(prod_text)
                results["tools_tested"]["get_productivity_summary"] = {
                    "status": "PASS" if prod_json.get("status") == "success" else "FAIL",
                    "output": prod_json.get("summary")
                }
                print(f"     Completion Rate: {prod_json.get('summary', {}).get('completion_rate_percent')}%")

                # Test 6: convert_units
                print("  -> Calling 'convert_units' (10 miles to km)...")
                unit_call = await session.call_tool("convert_units", {
                    "value": 10.0,
                    "from_unit": "miles",
                    "to_unit": "km"
                })
                unit_text = unit_call.content[0].text if unit_call.content else "{}"
                unit_json = json.loads(unit_text)
                results["tools_tested"]["convert_units"] = {
                    "status": "PASS" if unit_json.get("status") == "success" else "FAIL",
                    "output": unit_json
                }
                print(f"     Result: 10 miles = {unit_json.get('result')} km")

                # 4. Summary Verdict
                print_header("VERIFICATION SUMMARY")
                all_tools_pass = all(v["status"] == "PASS" for v in results["tools_tested"].values())
                proto_valid = results["negotiated_protocol_version"] in ["2025-11-25", "2026-07-28"]
                
                results["all_passed"] = all_tools_pass and proto_valid

                print(f"Protocol Negotiation : {'PASSED' if proto_valid else 'FAILED'} (Version: {results['negotiated_protocol_version']})")
                print(f"Streamable HTTP      : PASSED")
                print(f"Tools Discovery      : PASSED ({len(results['tools_discovered'])} tools found)")
                print(f"Tools Execution      : {'PASSED' if all_tools_pass else 'FAILED'} ({len(results['tools_tested'])} tools tested)")
                print(f"\nFinal Verdict        : {'[COMPLIANT - READY FOR SUBMISSION]' if results['all_passed'] else '[FAILED]'}")
                print("=" * 65 + "\n")

                return results
    except Exception as e:
        print(f"\n[FATAL ERROR] Verification failed: {str(e)}")
        results["error"] = str(e)
        return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ASTRA AI MCP Protocol Verifier")
    parser.add_argument("--url", default="http://127.0.0.1:8000/mcp", help="Target MCP Streamable HTTP endpoint")
    parser.add_argument("--json", action="store_true", help="Output verification results in JSON")
    args = parser.parse_args()

    outcome = anyio.run(verify, args.url)
    if args.json:
        print(json.dumps(outcome, indent=2))
    
    if not outcome.get("all_passed", False):
        sys.exit(1)
    sys.exit(0)
