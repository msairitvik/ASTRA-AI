import html
import logging
import re
import urllib.parse
from typing import Dict, Any, List
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("astra.tools.search")

def web_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Search the live web for recent information, news, documentation, or facts.
    Returns extracted search results with verified titles, destination URLs, and snippets.
    """
    # 7. Input validation
    if not isinstance(query, str) or not query.strip():
        return {
            "status": "error",
            "error": "Search query must be a non-empty string.",
            "count": 0,
            "results": []
        }

    clean_query = query.strip()
    if len(clean_query) > 400:
        clean_query = clean_query[:400]

    # 8. Clamp max_results between 1 and 10
    try:
        limit = int(max_results)
        limit = max(1, min(limit, 10))
    except (ValueError, TypeError):
        limit = 5

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.7",
    }

    # 11. Logging without leaking sensitive data
    logger.info(f"Executing web_search for query: {clean_query[:50]}... (limit={limit})")

    # 9 & 13. HTTP request with bounded timeout (8.0s)
    try:
        response = httpx.post(
            "https://html.duckduckgo.com/html/",
            data={"q": clean_query},
            headers=headers,
            timeout=8.0,
            follow_redirects=True
        )

        if response.status_code == 429:
            logger.warning("DuckDuckGo returned HTTP 429 (Rate Limited).")
            return {
                "status": "error",
                "error": "Web search rate limit reached. Please try again in a few moments.",
                "count": 0,
                "results": []
            }

        if response.status_code != 200:
            logger.warning(f"DuckDuckGo returned HTTP {response.status_code}")
            return {
                "status": "error",
                "error": f"Search provider returned status code {response.status_code}.",
                "count": 0,
                "results": []
            }

    except httpx.TimeoutException:
        logger.warning(f"DuckDuckGo search timed out after 8.0s for query '{clean_query[:30]}'")
        return {
            "status": "error",
            "error": "Web search request timed out.",
            "count": 0,
            "results": []
        }
    except Exception as e:
        logger.error(f"DuckDuckGo search connection error: {e}")
        return {
            "status": "error",
            "error": "Failed to connect to search provider.",
            "count": 0,
            "results": []
        }

    # 1. Robust HTML DOM parsing with BeautifulSoup
    try:
        soup = BeautifulSoup(response.text, "html.parser")
    except Exception as e:
        logger.error(f"HTML parsing failure: {e}")
        return {
            "status": "error",
            "error": "Unable to parse search results.",
            "count": 0,
            "results": []
        }

    results: List[Dict[str, str]] = []
    result_containers = soup.select("div.web-result")

    for container in result_containers:
        # Extract title and raw URL
        a_title = container.select_one("a.result__a")
        if not a_title:
            continue

        raw_title = a_title.get_text(strip=True)
        raw_url = a_title.get("href", "")

        # 6. Extract and clean snippet text
        a_snippet = container.select_one("a.result__snippet")
        raw_snippet = a_snippet.get_text(strip=True) if a_snippet else ""

        clean_title = html.unescape(raw_title).strip()
        clean_snippet = html.unescape(raw_snippet).strip()

        # 4. Safe URL decoding and redirect unwrapping
        actual_url = raw_url
        if "uddg=" in raw_url:
            try:
                parsed_query = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
                if "uddg" in parsed_query and parsed_query["uddg"]:
                    actual_url = urllib.parse.unquote(parsed_query["uddg"][0])
            except Exception:
                actual_url = raw_url
        elif raw_url.startswith("//"):
            actual_url = "https:" + raw_url

        # 5. Validate extracted URL (must be valid HTTP/HTTPS)
        if not (actual_url.startswith("http://") or actual_url.startswith("https://")):
            continue

        # Ignore DuckDuckGo internal advertising or search loop links
        if "duckduckgo.com" in actual_url and ("uddg=" in raw_url or "/y.js" in actual_url):
            continue

        results.append({
            "title": clean_title,
            "url": actual_url,
            "snippet": clean_snippet
        })

        if len(results) >= limit:
            break

    # 10. Honest result reporting
    return {
        "status": "success",
        "query": clean_query,
        "count": len(results),
        "results": results
    }
