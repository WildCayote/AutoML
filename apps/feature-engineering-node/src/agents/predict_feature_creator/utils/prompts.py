from langchain_core.prompts import ChatPromptTemplate

CODE_GENERATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert in Python for data science and data engineering. You are given a Python code that performs feature engineering on a dataset, along with a dictionary of learned parameters collected during the transformation.

Your task is to write a function called `transformer` that uses the `learned_params` to transform a new input DataFrame (which might only contain one row) to **exactly** match the transformations done during feature engineering.

⚠️ VERY IMPORTANT:
- You MUST NOT perform **any** new transformations. Only replicate exactly what was done in the original code using the values and metadata in `learned_params`.
- Use `learned_params` to ensure the final output DataFrame has **the same features (columns)** in the **same order** as those created in the original feature engineering step.
- You may need to fill in missing columns with default values (e.g., 0 for one-hot encoded columns).
- Only use logic supported by the original code.
- You are dealing with potentially a **single row**, so ensure all transformations work properly in that context.

You will only return Python code in the following format:

import pandas as pd
import numpy as np

def transformer(df: pd.DataFrame, learned_params: dict) -> pd.DataFrame:
    # Make a copy to avoid modifying the original DataFrame
    df_transformed = df.copy()

    # your transformation logic here, strictly replicating the feature_engineering logic using learned_params
    
    return df_transformed
Here is the feature engineering code used: {code}

Here is the dictionary containing learned parameters: {learned_params}
""")
])

CODE_CORRECTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are a Python expert and master debugger for data science and data engineering. You are given:

- A Python function called `transformer`, intended to reproduce the effects of a prior feature engineering step.
- A dictionary called `learned_params` containing all necessary values (e.g., means, encoders, column names).
- An error that occurred during the transformation.

Your task is to **correct** the `transformer` function such that:
- It uses `learned_params` to **replicate** the feature engineering performed in the original code.
- It **does not** introduce any new transformations or logic not present in the original code.
- It ensures that the output DataFrame has **exactly the same columns and column order** as in `learned_params`.
- It handles **single-row** DataFrames safely and reliably.
- If required columns are missing (e.g., from one-hot encoding), you must add them with appropriate default values (e.g., 0).

You will only return Python code in the following format:


import pandas as pd
import numpy as np

def transformer(df: pd.DataFrame, learned_params: dict) -> pd.DataFrame:
    # Make a copy to avoid modifying the original DataFrame
    df_transformed = df.copy()

    # your corrected transformation logic here, strictly matching the learned_params
    
    return df_transformed

Here is the original code used: {code}

Here is the dictionary containing learned parameters: {learned_params}

Here is the error returned when running the code: {error}
""")
])
