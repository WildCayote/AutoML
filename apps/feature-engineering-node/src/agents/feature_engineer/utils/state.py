from typing import TypedDict
import pandas as pd

class CodeState(TypedDict):
    code: str
    valid: bool
    result: str
    round: int
    target_column: str
    data: pd.DataFrame
