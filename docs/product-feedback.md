# Product Feedback Draft: Model Context Protocol (MCP) & Alexa+ Developer Experience

**Author:** ASTRA AI Development Team  
**Event:** Amazon Build, Ship, Shape Hackathon (Alexa+ Track)  
**Status:** DRAFT (Not yet submitted)  

---

## 1. Executive Summary

Building ASTRA AI using the official Model Context Protocol (MCP) SDKs (`mcp 2.3.0` in Python and `@modelcontextprotocol/sdk 1.32.1` in TypeScript) was a rewarding and technically rigorous experience. The protocol's transition toward **Streamable HTTP** as a first-class citizen alongside legacy SSE and stdio represents a massive leap forward for production web assistants.

Below is our detailed, constructive feedback based on building and testing a full three-tier application.

---

## 2. Strengths & Positive Highlights

1. **Streamable HTTP Decoupling:**
   - The `/mcp` Streamable HTTP transport allows self-hosted Python servers and Node.js clients to communicate over standard HTTP infrastructure without requiring complex persistent bidirectional socket tunnels.
   - Session management (`Session-Id` tracking) works reliably once established.

2. **Schema Introspection:**
   - Automatic Pydantic model serialization into JSON Schema for `tools/list` provides exceptional developer ergonomics in Python. The resulting schemas mapped directly to our UI parameter inspectors.

3. **Multi-Language Parity:**
   - Having official SDKs in both Python and TypeScript enabled us to keep our heavy utility tools in Python while building our frontend API gateway in TypeScript.

---

## 3. Areas for Improvement & Actionable Recommendations

### Recommendation 1: Streamable HTTP Client Documentation & Examples
- **Issue:** In the official documentation, most examples still focus heavily on `StdioServerParameters` or legacy SSE (`/sse` endpoint with separate message posting).
- **Recommendation:** Provide complete, standalone client-server examples for `StreamableHTTPClientTransport` connecting to `MCPServer.streamable_http_app()`. Clarify the exact expected headers (`Content-Type: application/json` vs `text/event-stream`).

### Recommendation 2: Windows Timezone (`tzdata`) Dependency Handling
- **Issue:** On Windows installations, Python's `zoneinfo` module raises `ZoneInfoNotFoundError` when `tzdata` is not explicitly packaged, causing timezone tools to fail silently or crash.
- **Recommendation:** Document `tzdata` as a recommended dependency in Python MCP starter kits targeting cross-platform developers.

### Recommendation 3: Protocol Negotiation Diagnostics
- **Issue:** When protocol version negotiation fails or encounters mismatched specification years (e.g. `2025-11-25` vs `2026-07-28`), the client error message can be generic (`Server returned an error response`).
- **Recommendation:** Include the client-requested and server-supported version numbers directly in the handshake error message to accelerate protocol debugging.

---

## 4. Overall Impression

The Model Context Protocol provides an open, interoperable foundation that avoids proprietary assistant silos. With expanded documentation around Streamable HTTP, it has the potential to become the universal standard for intelligent agent integrations.
