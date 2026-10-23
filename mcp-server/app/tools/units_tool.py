from typing import Dict, Any
from ..services.activity_service import ActivityService

_LENGTH_FACTORS = {
    "m": 1.0,
    "meter": 1.0,
    "meters": 1.0,
    "km": 1000.0,
    "kilometer": 1000.0,
    "kilometers": 1000.0,
    "cm": 0.01,
    "centimeter": 0.01,
    "mm": 0.001,
    "millimeter": 0.001,
    "mi": 1609.344,
    "mile": 1609.344,
    "miles": 1609.344,
    "yd": 0.9144,
    "yard": 0.9144,
    "yards": 0.9144,
    "ft": 0.3048,
    "foot": 0.3048,
    "feet": 0.3048,
    "in": 0.0254,
    "inch": 0.0254,
    "inches": 0.0254,
}

_MASS_FACTORS = {
    "kg": 1.0,
    "kilogram": 1.0,
    "kilograms": 1.0,
    "g": 0.001,
    "gram": 0.001,
    "grams": 0.001,
    "mg": 0.000001,
    "milligram": 0.000001,
    "lb": 0.45359237,
    "lbs": 0.45359237,
    "pound": 0.45359237,
    "pounds": 0.45359237,
    "oz": 0.028349523,
    "ounce": 0.028349523,
    "ounces": 0.028349523,
}

_DATA_FACTORS = {
    "b": 1.0,
    "byte": 1.0,
    "bytes": 1.0,
    "kb": 1024.0,
    "kilobyte": 1024.0,
    "mb": 1024.0 ** 2,
    "megabyte": 1024.0 ** 2,
    "gb": 1024.0 ** 3,
    "gigabyte": 1024.0 ** 3,
    "tb": 1024.0 ** 4,
    "terabyte": 1024.0 ** 4,
}

def convert_units(value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
    """
    Convert numbers between units of length, weight, temperature, or digital storage.

    Args:
        value: Numeric value to convert
        from_unit: Source unit (e.g. 'miles', 'km', 'celsius', 'fahrenheit', 'kg', 'lbs', 'gb', 'mb')
        to_unit: Target unit
    """
    f_u = from_unit.strip().lower()
    t_u = to_unit.strip().lower()

    try:
        # Check temperature
        temp_units = {"c": "c", "celsius": "c", "f": "f", "fahrenheit": "f", "k": "k", "kelvin": "k"}
        if f_u in temp_units and t_u in temp_units:
            src = temp_units[f_u]
            dst = temp_units[t_u]
            # Convert to Celsius first
            if src == "c":
                c = value
            elif src == "f":
                c = (value - 32) * 5 / 9
            else: # k
                c = value - 273.15

            # Convert from Celsius to dst
            if dst == "c":
                res = c
            elif dst == "f":
                res = (c * 9 / 5) + 32
            else: # k
                res = c + 273.15

            converted = round(res, 4)
            ActivityService.log_activity(
                activity_type="tool_call",
                status="success",
                details=f"Converted temperature: {value} {from_unit} = {converted} {to_unit}.",
                tool_name="convert_units"
            )
            return {
                "status": "success",
                "category": "temperature",
                "input_value": value,
                "from_unit": from_unit,
                "to_unit": to_unit,
                "result": converted
            }

        # Check length
        if f_u in _LENGTH_FACTORS and t_u in _LENGTH_FACTORS:
            meters = value * _LENGTH_FACTORS[f_u]
            res = meters / _LENGTH_FACTORS[t_u]
            converted = round(res, 6)
            return {
                "status": "success",
                "category": "length",
                "input_value": value,
                "from_unit": from_unit,
                "to_unit": to_unit,
                "result": converted
            }

        # Check mass
        if f_u in _MASS_FACTORS and t_u in _MASS_FACTORS:
            kg = value * _MASS_FACTORS[f_u]
            res = kg / _MASS_FACTORS[t_u]
            converted = round(res, 6)
            return {
                "status": "success",
                "category": "mass",
                "input_value": value,
                "from_unit": from_unit,
                "to_unit": to_unit,
                "result": converted
            }

        # Check data storage
        if f_u in _DATA_FACTORS and t_u in _DATA_FACTORS:
            bytes_val = value * _DATA_FACTORS[f_u]
            res = bytes_val / _DATA_FACTORS[t_u]
            converted = round(res, 6)
            return {
                "status": "success",
                "category": "digital_storage",
                "input_value": value,
                "from_unit": from_unit,
                "to_unit": to_unit,
                "result": converted
            }

        return {
            "status": "error",
            "error": f"Cannot convert between '{from_unit}' and '{to_unit}'. Incompatible or unsupported units."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
