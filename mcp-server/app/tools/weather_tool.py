from typing import Dict, Any
import httpx
from ..services.activity_service import ActivityService

_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

def get_weather(city: str) -> Dict[str, Any]:
    """
    Fetch current live weather conditions for a specified city using Open-Meteo.
    
    Args:
        city: City name (e.g. 'Seattle', 'London', 'Tokyo', 'San Francisco', 'Bengaluru')
    """
    clean_city = city.strip()
    if not clean_city:
        return {"status": "error", "error": "City name cannot be empty"}

    try:
        # Step 1: Geocode city name
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={clean_city}&count=1&language=en&format=json"
        with httpx.Client(timeout=5.0) as client:
            geo_res = client.get(geo_url)
            geo_data = geo_res.json()
            results = geo_data.get("results")
            if not results:
                return {
                    "status": "error",
                    "error": f"City '{clean_city}' could not be located in geocoding database."
                }

            loc = results[0]
            lat = loc["latitude"]
            lon = loc["longitude"]
            city_name = loc.get("name", clean_city)
            country = loc.get("country", "")
            admin = loc.get("admin1", "")

            # Step 2: Query weather
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto"
            weather_res = client.get(weather_url)
            weather_data = weather_res.json()
            current = weather_data.get("current", {})

            temp_c = current.get("temperature_2m", 0.0)
            temp_f = round(temp_c * 9 / 5 + 32, 1)
            code = current.get("weather_code", 0)
            condition = _WEATHER_CODES.get(code, "Clear")
            humidity = current.get("relative_humidity_2m", 0)
            wind = current.get("wind_speed_10m", 0.0)
            feels_c = current.get("apparent_temperature", temp_c)
            feels_f = round(feels_c * 9 / 5 + 32, 1)

            res = {
                "status": "success",
                "city": city_name,
                "region": f"{admin}, {country}".strip(", "),
                "coordinates": {"latitude": lat, "longitude": lon},
                "temperature": {
                    "celsius": temp_c,
                    "fahrenheit": temp_f
                },
                "feels_like": {
                    "celsius": feels_c,
                    "fahrenheit": feels_f
                },
                "condition": condition,
                "humidity_percent": humidity,
                "wind_speed_kmh": wind,
                "timestamp": current.get("time", "")
            }

            ActivityService.log_activity(
                activity_type="tool_call",
                status="success",
                details=f"Retrieved weather for {city_name}: {condition}, {temp_c}°C ({temp_f}°F).",
                tool_name="get_weather"
            )
            return res

    except Exception as e:
        ActivityService.log_activity(
            activity_type="tool_call",
            status="failure",
            details=f"Live weather lookup failed for '{clean_city}': {str(e)}",
            tool_name="get_weather"
        )
        return {
            "status": "error",
            "city": clean_city,
            "error": f"Live weather lookup failed (network or provider issue): {str(e)}"
        }
