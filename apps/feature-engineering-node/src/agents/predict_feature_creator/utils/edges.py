from langgraph.graph import END
from .state import CodeState

def needs_correction(state: CodeState) -> str:
    if not state["valid"] and state["round"] < 5:
        return "correct"
    return END