import ast
import math
import operator
from typing import Dict, Any, Union
from ..services.activity_service import ActivityService

_SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_SAFE_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "exp": math.exp,
    "ceil": math.ceil,
    "floor": math.floor,
    "factorial": math.factorial,
}

_SAFE_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
}

def _eval_node(node: ast.AST) -> Union[int, float]:
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant type: {type(node.value)}")

    if isinstance(node, ast.Name):
        if node.id in _SAFE_CONSTANTS:
            return _SAFE_CONSTANTS[node.id]
        raise ValueError(f"Variable or identifier '{node.id}' is not recognized or permitted")

    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type in _SAFE_OPERATORS:
            return _SAFE_OPERATORS[op_type](_eval_node(node.operand))
        raise ValueError(f"Unsupported unary operator: {op_type}")

    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type in _SAFE_OPERATORS:
            left = _eval_node(node.left)
            right = _eval_node(node.right)
            if op_type == ast.Div and right == 0:
                raise ZeroDivisionError("Division by zero is undefined")
            if op_type == ast.Pow and (abs(left) > 1000 or abs(right) > 1000):
                raise ValueError("Exponents exceeding magnitude 1000 are blocked for safety")
            return _SAFE_OPERATORS[op_type](left, right)
        raise ValueError(f"Unsupported binary operator: {op_type}")

    if isinstance(node, ast.Call):
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name in _SAFE_FUNCTIONS:
                args = [_eval_node(arg) for arg in node.args]
                return _SAFE_FUNCTIONS[func_name](*args)
            raise ValueError(f"Function '{func_name}' is not in the permitted math whitelist")
        raise ValueError("Dynamic or nested function calls are not permitted")

    raise ValueError(f"Unsupported expression construct: {type(node).__name__}")

def calculate(expression: str) -> Dict[str, Any]:
    """
    Safely evaluate a mathematical expression without arbitrary code execution.
    
    Args:
        expression: Math formula (e.g. '2 + 2', 'sqrt(144) * 3', 'sin(pi / 2)', '100 * (1 + 0.05)**5')
    """
    clean_expr = expression.strip()
    if not clean_expr:
        return {
            "status": "error",
            "expression": expression,
            "error": "Expression cannot be empty"
        }

    try:
        parsed = ast.parse(clean_expr, mode="eval")
        result = _eval_node(parsed.body)
        
        # Format neatly
        if isinstance(result, float) and result.is_integer():
            formatted = int(result)
        elif isinstance(result, float):
            formatted = round(result, 6)
        else:
            formatted = result

        ActivityService.log_activity(
            activity_type="tool_call",
            status="success",
            details=f"Calculated '{clean_expr}' = {formatted}.",
            tool_name="calculate"
        )

        return {
            "status": "success",
            "expression": clean_expr,
            "result": formatted,
            "raw_result": result,
            "type": type(result).__name__
        }
    except Exception as e:
        ActivityService.log_activity(
            activity_type="tool_call",
            status="failure",
            details=f"Calculation error for '{clean_expr}': {str(e)}.",
            tool_name="calculate"
        )
        return {
            "status": "error",
            "expression": clean_expr,
            "error": str(e)
        }
