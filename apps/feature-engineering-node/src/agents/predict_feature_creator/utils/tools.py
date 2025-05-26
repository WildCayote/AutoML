from typing import Tuple
import pandas as pd

def extract_code(raw_code: str) -> str:
    return raw_code.replace('`', '').replace('python', '')

def check_code(code: str, data: pd.DataFrame, learned_params: dict) -> Tuple[bool, str]:
    import traceback
    namespace = {}
    try:
        exec(code, namespace)
        result = namespace['transformer'](data, learned_params)
        if (result.shape[0] != data.shape[0]):
            raise Exception(f"Output shape mismatch or insufficient columns! The result has a shape of {result.shape} while the input data has a shape of {data.shape}.")
        return True, result
    except Exception:
        error_message = traceback.format_exc()
        return False, error_message