import pytest
from unittest.mock import patch, MagicMock
import httpx
from app.tools.search_tool import web_search

def test_web_search_invalid_inputs():
    # Empty query
    res = web_search("")
    assert res["status"] == "error"
    assert res["count"] == 0
    assert len(res["results"]) == 0

    # Whitespace query
    res2 = web_search("   \n\t  ")
    assert res2["status"] == "error"

    # Non-string query
    res3 = web_search(None) # type: ignore
    assert res3["status"] == "error"

def test_web_search_max_results_clamping():
    # When max_results is <= 0, clamp to 1
    # When max_results is > 10, clamp to 10
    sample_html = """
    <html><body>
    """ + "".join([
        f'<div class="web-result"><h2 class="result__title"><a class="result__a" href="https://example{i}.com">Title {i}</a></h2><a class="result__snippet">Snippet {i}</a></div>'
        for i in range(15)
    ]) + "</body></html>"

    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = sample_html
        mock_post.return_value = mock_resp

        # Test clamp to 1
        res = web_search("test query", max_results=0)
        assert res["status"] == "success"
        assert len(res["results"]) == 1

        # Test clamp to 10
        res2 = web_search("test query", max_results=50)
        assert res2["status"] == "success"
        assert len(res2["results"]) == 10

def test_web_search_uddg_redirect_unwrapping():
    sample_html = """
    <html><body>
    <div class="web-result">
      <h2 class="result__title">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fopenai.com%2Fblog&rut=123">OpenAI Blog</a>
      </h2>
      <a class="result__snippet">Latest developments and news from OpenAI.</a>
    </div>
    </body></html>
    """
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = sample_html
        mock_post.return_value = mock_resp

        res = web_search("openai", max_results=5)
        assert res["status"] == "success"
        assert len(res["results"]) == 1
        item = res["results"][0]
        assert item["title"] == "OpenAI Blog"
        assert item["url"] == "https://openai.com/blog"
        assert "Latest developments" in item["snippet"]

def test_web_search_direct_url_and_protocol_relative():
    sample_html = """
    <html><body>
    <div class="web-result">
      <h2 class="result__title">
        <a class="result__a" href="//en.wikipedia.org/wiki/Artificial_intelligence">AI Wikipedia</a>
      </h2>
      <a class="result__snippet">Overview of artificial intelligence.</a>
    </div>
    </body></html>
    """
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = sample_html
        mock_post.return_value = mock_resp

        res = web_search("ai wikipedia")
        assert res["status"] == "success"
        assert len(res["results"]) == 1
        assert res["results"][0]["url"] == "https://en.wikipedia.org/wiki/Artificial_intelligence"

def test_web_search_missing_snippet():
    sample_html = """
    <html><body>
    <div class="web-result">
      <h2 class="result__title">
        <a class="result__a" href="https://example.com/no-snippet">Title Only</a>
      </h2>
    </div>
    </body></html>
    """
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = sample_html
        mock_post.return_value = mock_resp

        res = web_search("test")
        assert res["status"] == "success"
        assert len(res["results"]) == 1
        assert res["results"][0]["snippet"] == ""

def test_web_search_malformed_html():
    sample_html = "<div><a href='unclosed"
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = sample_html
        mock_post.return_value = mock_resp

        res = web_search("test")
        assert res["status"] == "success"
        assert res["results"] == []

def test_web_search_rate_limited_429():
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_post.return_value = mock_resp

        res = web_search("test query")
        assert res["status"] == "error"
        assert "rate limit" in res["error"].lower()
        assert res["count"] == 0

def test_web_search_http_500():
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_post.return_value = mock_resp

        res = web_search("test query")
        assert res["status"] == "error"
        assert "500" in res["error"]

def test_web_search_timeout():
    with patch("httpx.post") as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Search timed out")

        res = web_search("test query")
        assert res["status"] == "error"
        assert "timed out" in res["error"].lower()

def test_web_search_connection_error():
    with patch("httpx.post") as mock_post:
        mock_post.side_effect = httpx.ConnectError("Connection refused")

        res = web_search("test query")
        assert res["status"] == "error"
        assert "failed to connect" in res["error"].lower()

def test_web_search_live_query():
    # Real live integration test with actual network request
    res = web_search("latest Python release", max_results=3)
    # If network is online, verify real structure
    if res["status"] == "success" and res["count"] > 0:
        assert len(res["results"]) <= 3
        first = res["results"][0]
        assert first["url"].startswith("http")
        assert len(first["title"]) > 0
