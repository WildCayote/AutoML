from typing import TypedDict
import pandas as pd

class CodeState(TypedDict):
    code: str
    valid: bool
    result: str
    round: int
    data: pd.DataFrame
    learned_params: dict
