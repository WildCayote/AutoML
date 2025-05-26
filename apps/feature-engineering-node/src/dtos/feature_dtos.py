from pydantic import BaseModel
from typing import Literal
from fastapi import UploadFile, File

class FeatureRequestDTO(BaseModel):
    task: Literal["regression", "classification"]
    target_column: str
