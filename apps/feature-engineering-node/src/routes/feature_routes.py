from fastapi import APIRouter, UploadFile, File, Form
from services.feature_service import process_feature_engineering
import json

router = APIRouter()

@router.post("/process/")
async def process_features(
    csv_file: UploadFile = File(...),
    profiling_file: UploadFile = File(...),
    task: str = Form(...),
    target_column: str = Form(...)
):
    # Read and decode files
    csv_data = await csv_file.read()
    profiling_data = await profiling_file.read()
    
    return process_feature_engineering(csv_data, profiling_data, target_column, task)
