from datetime import datetime, timezone
from typing import Dict, Any
from ..services.activity_service import ActivityService

TIMEZONE_ALIASES = {
    "india": "Asia/Kolkata",
    "indian": "Asia/Kolkata",
    "ist": "Asia/Kolkata",
    "delhi": "Asia/Kolkata",
    "mumbai": "Asia/Kolkata",
    "bengaluru": "Asia/Kolkata",
    "bangalore": "Asia/Kolkata",
    "kolkata": "Asia/Kolkata",
    "hyderabad": "Asia/Kolkata",
    "tokyo": "Asia/Tokyo",
    "japan": "Asia/Tokyo",
    "jst": "Asia/Tokyo",
    "london": "Europe/London",
    "uk": "Europe/London",
    "england": "Europe/London",
    "gmt": "GMT",
    "bst": "Europe/London",
    "new york": "America/New_York",
    "new_york": "America/New_York",
    "nyc": "America/New_York",
    "est": "America/New_York",
    "edt": "America/New_York",
    "california": "America/Los_Angeles",
    "los angeles": "America/Los_Angeles",
    "los_angeles": "America/Los_Angeles",
    "san francisco": "America/Los_Angeles",
    "san_francisco": "America/Los_Angeles",
    "pst": "America/Los_Angeles",
    "pdt": "America/Los_Angeles",
    "seattle": "America/Los_Angeles",
    "chicago": "America/Chicago",
    "cst": "America/Chicago",
    "paris": "Europe/Paris",
    "france": "Europe/Paris",
    "berlin": "Europe/Berlin",
    "germany": "Europe/Berlin",
    "sydney": "Australia/Sydney",
    "australia": "Australia/Sydney",
    "melbourne": "Australia/Melbourne",
    "dubai": "Asia/Dubai",
    "uae": "Asia/Dubai",
    "singapore": "Asia/Singapore",
    "toronto": "America/Toronto",
    "canada": "America/Toronto",
    "beijing": "Asia/Shanghai",
    "china": "Asia/Shanghai",
}

def get_current_datetime(timezone_str: str = "UTC") -> Dict[str, Any]:
    """
    Return the current date, time, timezone, and epoch timestamp.
    
    Args:
        timezone_str: Valid IANA timezone name or common country/city name (e.g. 'Asia/Kolkata', 'India', 'Tokyo', 'London')
    """
    raw_tz = timezone_str.strip() if timezone_str else "UTC"
    tz_key = raw_tz.lower().replace(" ", "_")
    
    clean_tz = TIMEZONE_ALIASES.get(raw_tz.lower(), TIMEZONE_ALIASES.get(tz_key, raw_tz))
    tz = None

    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo(clean_tz)
    except Exception:
        try:
            import zoneinfo
            # Try title casing (e.g. Europe/London)
            tz = zoneinfo.ZoneInfo(clean_tz.title())
        except Exception:
            tz = timezone.utc
            clean_tz = "UTC"

    now = datetime.now(tz)
    res = {
        "iso": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "time_12h": now.strftime("%I:%M %p").lstrip("0"),
        "day_of_week": now.strftime("%A"),
        "timezone": clean_tz,
        "utc_offset": now.strftime("%z"),
        "unix_timestamp": int(now.timestamp()),
        "readable": now.strftime("%A, %B %d, %Y at %I:%M:%S %p %Z"),
        "conversational": f"{now.strftime('%I:%M %p').lstrip('0')} on {now.strftime('%A, %B %d, %Y')} ({clean_tz})"
    }

    ActivityService.log_activity(
        activity_type="tool_call",
        status="success",
        details=f"Retrieved current datetime for timezone '{clean_tz}': {res['readable']}.",
        tool_name="get_current_datetime"
    )

    return res
