import pandas as pd
import json
from agents.feature_engineer.agent import feature_engineer
from agents.predict_feature_creator.agent import predict_feature_creator
from agents.feature_engineer.utils.tools import check_code as check_feature_code
from agents.predict_feature_creator.utils.tools import check_code as check_predict_code
import os

def process_feature_engineering(csv_data, profiling_data, target_column, task):
    test_data = pd.read_csv(pd.compat.StringIO(csv_data.decode()))
    test_profiling = json.loads(profiling_data)

    # Invoke Feature Engineering Agent
    result = feature_engineer.invoke({
        "data": test_data,
        "profiling": test_profiling,
        "target_column": target_column,
        "task": task,
    })
    feature_engineering_code = result['code']

    # Validate and apply feature code
    valid, result = check_feature_code(feature_engineering_code, test_data, target_column)
    if not valid:
        return {"error": "Invalid feature engineering code"}
    feature_transformed_data, learned_params = result

    # Predict Transformation Code
    sample_input = test_data.head(5)
    result = predict_feature_creator.invoke({
        "data": sample_input,
        "learned_params": learned_params,
        "code": feature_engineering_code,
    })
    feature_transformation_code = result['code']

    valid, resulting_data = check_predict_code(feature_transformation_code, sample_input, learned_params)

    # Save outputs
    os.makedirs("files", exist_ok=True)
    with open("files/feature_engineering_code.py", "w") as f:
        f.write(feature_engineering_code)
    with open("files/feature_transformation_code.py", "w") as f:
        f.write(feature_transformation_code)
    with open("files/learned_params.json", "w") as f:
        json.dump(learned_params, f, indent=4)
    feature_transformed_data.to_csv("files/feature_transformed_data.csv", index=False)
    resulting_data.to_csv("files/resulting_data.csv", index=False)

    return {
        "message": "Feature engineering completed",
        "columns_feature_engineering": feature_transformed_data.columns.tolist(),
        "columns_prediction": resulting_data.columns.tolist()
    }
