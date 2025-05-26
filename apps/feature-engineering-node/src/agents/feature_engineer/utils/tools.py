from typing import Tuple
import pandas as pd

def extract_code(raw_code: str) -> str:
    return raw_code.replace('`', '').replace('python', '')

def check_code(code: str, data: pd.DataFrame, target_column: str) -> Tuple[bool, str]:
    import traceback
    namespace = {}
    try:
        exec(code, namespace)
        result = namespace['feature_engineering'](data, target_column)
        return True, result
    except Exception:
        error_message = traceback.format_exc()
        return False, error_message