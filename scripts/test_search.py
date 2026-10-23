import httpx
import re
import urllib.parse
import html

def test_search(query: str, max_results: int = 5):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    
    try:
        resp = httpx.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query},
            headers=headers,
            timeout=10.0,
            follow_redirects=True
        )
        if resp.status_code != 200:
            return []
            
        raw = resp.text
        results = []
        
        # Match each web-result div
        blocks = re.findall(r'<div class="[^"]*web-result[^"]*"[^>]*>(.*?)<div class="clear"></div>', raw, re.DOTALL)
        for b in blocks:
            # Title & URL
            t_match = re.search(r'<h2 class="result__title">\s*<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', b, re.DOTALL)
            # Snippet
            s_match = re.search(r'<a class="result__snippet"[^>]*>(.*?)</a>', b, re.DOTALL)
            
            if t_match:
                raw_url = t_match.group(1)
                raw_title = t_match.group(2)
                raw_snippet = s_match.group(1) if s_match else ""
                
                clean_title = html.unescape(re.sub(r'<[^>]+>', '', raw_title)).strip()
                clean_snippet = html.unescape(re.sub(r'<[^>]+>', '', raw_snippet)).strip()
                
                # Unwrap duckduckgo redirect if present
                actual_url = raw_url
                if "uddg=" in raw_url:
                    parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
                    if "uddg" in parsed:
                        actual_url = parsed["uddg"][0]
                elif raw_url.startswith("//"):
                    actual_url = "https:" + raw_url
                    
                results.append({
                    "title": clean_title,
                    "url": actual_url,
                    "snippet": clean_snippet
                })
                
                if len(results) >= max_results:
                    break
                    
        return results
    except Exception as e:
        print("Search error:", e)
        return []

if __name__ == "__main__":
    res = test_search("latest AI news", 5)
    print(f"Extracted {len(res)} results:")
    for i, r in enumerate(res, 1):
        print(f"[{i}] {r['title']}")
        print(f"    URL: {r['url']}")
        print(f"    Snippet: {r['snippet']}")
