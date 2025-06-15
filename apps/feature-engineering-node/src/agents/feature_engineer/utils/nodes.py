from langchain_openai import ChatOpenAI
from .state import CodeState
from .tools import extract_code, check_code

def generate_code(code_generator: ChatOpenAI, state: CodeState) -> CodeState:
    print("🟢 Node: generate_code")

    raw = code_generator.invoke({
        "profiling": state["profiling"],
        "task_type": state["task_type"],
        "target_column": state["target_column"]
    })
    print(f"Target Column: {state['target_column']}")
    code = extract_code(raw)
    valid, result = check_code(code, state["data"], state["target_column"])
    print(f"Generated Code Valid: {valid}")
    return {"code": code, "valid": valid, "result": result, "round": 0}

def correct_code(code_corrector: ChatOpenAI, state: CodeState) -> CodeState:
    round_num = state["round"] + 1
    print(f"🟠 Node: correct_code | Round {round_num}")
    print(f"❌ Error: {state['result']}")

    raw = code_corrector.invoke({
        "code": state["code"],
        "error": state["result"],
        "profiling": state["profiling"],
    })
    code = extract_code(raw)
    valid, result = check_code(code, state["data"], state["target_column"])
    print(f"Correction Valid: {valid}")
    return {"code": code, "valid": valid, "result": result, "round": round_num}