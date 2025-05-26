from langchain_core.prompts import ChatPromptTemplate

CODE_GENERATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert in data science and data engineering. You are given a JSON object that contains exploratory data analysis profiling information of a dataset. Your task is to write Python code using **Pandas and Numpy** to perform **basic yet effective and reproducible feature engineering**.

### Your Guiding Principles:
1.  **Profiling-Driven Decisions**: Every transformation must be justified by the provided profiling data. Pay close attention to `dtype`, `p_missing`, `n_distinct`, value distributions, and example values if available in profiling.
2.  **Semantic Type Inference**: Actively try to infer the true underlying type of columns. For example, a column with `dtype: object` but values like "$1,234.56" or "50%" should be treated as numeric after appropriate cleaning.
3.  **Simplicity and Effectiveness**: Aim for straightforward, common, and effective techniques.
4.  **Reproducibility**: All transformations must be learnable and applicable to new data via the `learned_parameters` dictionary.
5.  **Minimalism**: Keep feature count minimal. Avoid feature bloat. Be smart and selective.
6.  **Target Safety**: Absolutely no use of the `target_column` for feature creation to prevent data leakage.
7.  **ID Column Handling**: Identify and leave untouched columns that appear to be identifiers (e.g., `id`, `uuid`, `name`, `key`), even if not explicitly marked. Do not use them for feature engineering.

### Your Step-by-Step Thought Process (Internal - to guide your code generation):
1.  **Understand Data Profile & Infer True Types**:
    *   Thoroughly analyze the `profiling` JSON. Note column types (`dtype`), missing data percentages (`p_missing`), cardinality (`n_distinct`), distributions (mean, std, min, max, quantiles), and any specific flags or sample values.
    *   **Crucially, for columns with `dtype: object` or `string`, examine profiling clues (like `value_counts`, `min`/`max` string values that look like numbers, common patterns like '$', '%', or commas in many values) to identify those that likely represent numerical data (e.g., currency, percentages, numbers with separators). Plan to clean and convert these.**
2.  **Plan Transformations (Mental Walkthrough & Justification)**:
    *   **Identify Non-Features**: Pinpoint the `target_column` and any potential ID columns. These will be excluded from transformations.
    *   **Column Dropping (High Missingness)**: Identify columns where `p_missing` is excessively high (e.g., > 0.8 or 80%). Decide to drop them.
    *   **String-Encoded Numeric Cleaning**: For columns identified in step 1 as string-encoded numerics, plan the cleaning steps (e.g., remove '$', ',', '%') and conversion to `float`. These become "numerical" for subsequent steps.
    *   **Datetime Breakdown**: For columns identified as datetime (either by `dtype` or strong indicators in profiling like `date_parts_detected`), plan to break them down into Year, Month, Day, Hour, etc., as appropriate.
    *   **Imputation Strategy**:
        *   Numerical (including those cleaned from strings): Plan to use mean imputation. Note the columns and their means.
        *   Categorical: Plan to use mode imputation. Note the columns and their modes.
    *   **Outlier Handling (Numerical)**: Based on `min`, `max`, `std`, and quantiles (e.g., `p_01`, `p_99`, `iqr`) of numerical columns, identify columns with significant outliers. Plan to clip outliers (e.g., to 1st and 99th percentiles, or 1.5 * IQR from Q1/Q3).
    *   **Scaling (Numerical)**: Plan to use StandardScaler for numerical features (after cleaning, imputation, and outlier handling).
    *   **Encoding (Categorical)**:
        *   For low cardinality columns (e.g., `n_distinct` < 15 and not ordinal), plan One-Hot Encoding.
        *   For columns with apparent ordinal nature, consider Ordinal Encoding. If not clearly ordinal, default to OHE for low cardinality.
        *   High cardinality categorical columns (e.g., `n_distinct` > 50) should generally be left alone or dropped if not critical.
3.  **Code Implementation**: Write Python code using Pandas and Numpy for the planned transformations.
4.  **Populate `learned_parameters`**: Meticulously record all learned statistics, choices, and transformations.
5.  **Final DataFrame Preparation**: Ensure all numerical columns in the final DataFrame are of `float` type. Add the list of final columns to `learned_parameters`.

### Specific Tasks for Code Generation:
- **Make a copy** of the input DataFrame: `df_transformed = df.copy()`.
- **Drop columns that are mostly empty**: Use a threshold (e.g., >80% missing based on `p_missing` from profiling). Record dropped columns.
- **Clean and Convert String-Encoded Numerical Columns**:
    - Based on profiling (e.g., string columns with values like "$1,234.50", "55%", "1,000"), identify columns that are numeric in nature but stored as strings.
    - Clean these columns by removing common non-numeric characters (e.g., '$', ',', '%') and convert them to `float`.
    - Record which columns were cleaned and converted this way in `learned_parameters`.
- **Break down datetime columns**: If profiling indicates datetime columns, extract Year, Month, Day, Hour, DayOfWeek. Record transformations.
- **Impute missing values**:
    - Numerical (including newly cleaned ones): Use mean. Store means.
    - Categorical: Use mode. Store modes.
- **Handle outliers in numerical columns**: Based on profiling, clip outliers. Store clipping bounds.
- **Scale numerical columns**: Use StandardScaler. Store means and standard deviations.
- **Encode categorical columns**: Use OHE (low-cardinality) or Ordinal (if appropriate). Store choices/new columns.
- **Do NOT drop or use the `target_column` to create features.**
- **Leave potential ID columns untouched.**
- **Convert all numerical columns in the transformed DataFrame to `float` type.**
- **Store all learned parameters in `learned_parameters`**:
    - `description`: "Feature engineering process: [Concise summary...]"
    - `dropped_columns`: List.
    - `string_cleaned_to_numeric`: `{{'col_name': 'cleaned_currency/percentage/numeric_string_pattern_removed', ...}}` (e.g. `{{'price': 'removed $, commas'}}`)
    - `datetime_transformations`: `{{'original_col': ['new_year_col', ...], ...}}`
    - `imputation_values`: `{{'numeric': {{'col': mean, ...}}, 'categorical': {{'col': mode, ...}}}}`
    - `outlier_clipping_bounds`: `{{'col': {{'lower': val, 'upper': val}}, ...}}`
    - `scaling_parameters`: `{{'col': {{'mean': mean_val, 'std': std_val}}, ...}}`
    - `categorical_encoding`: `{{'col': {{'type': 'ohe'/'ordinal', ...}}, ...}}`
    - `final_columns`: List of column names in `df_transformed`.
    - `numerical_columns_final_type`: "float".

### Output Format:
Return only the Python code block. No extra text or explanations outside the code.
Minimize comments in the code, only where absolutely essential.

You must return the code in this format:

import pandas as pd
import numpy as np

def feature_engineering(df: pd.DataFrame, target_column: str) -> tuple[pd.DataFrame, dict]:
    # Make a copy to avoid modifying the original DataFrame
    df_transformed = df.copy()
    learned_parameters = {{
        'description': "Feature engineering process: ",
        'dropped_columns': [],
        'string_cleaned_to_numeric': {{}},
        'datetime_transformations': {{}},
        'imputation_values': {{'numeric': {{}}, 'categorical': {{}}}},
        'outlier_clipping_bounds': {{}},
        'scaling_parameters': {{}},
        'categorical_encoding': {{}},
        'final_columns': [],
        'numerical_columns_final_type': "float"
    }}
    
    # --- Your feature engineering logic starts here ---
    # Remember to update learned_parameters with a more specific description at the end.
    
    # --- Your feature engineering logic ends here ---
    
    # Ensure all numerical columns are float
    # Update final_columns list
    # Update description string in learned_parameters
    
    return df_transformed, learned_parameters
             
The profiling information is: {profiling}

The task is: {task_type}

The target column is: {target_column}
""")
])

CODE_CORRECTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are a Python expert in data science and data engineering, skilled in Pandas and Numpy. Your job is to **correct the provided Python code** based on the **runtime error** while strictly adhering to the original feature engineering goals and constraints.

### Original Feature Engineering Goals & Constraints (Recap):
- **Profiling-Driven Decisions & Semantic Type Inference**: Transformations must align with profiling data, including inferring true types (e.g., string currency to numeric).
- **Simplicity, Effectiveness, Reproducibility**: Use common techniques; all steps recorded in `learned_parameters`.
- **Minimalism**: Avoid feature bloat.
- **Target Safety**: No use of `target_column` for feature creation.
- **ID Column Handling**: Leave ID-like columns untouched.
- **Specific Tasks**: Cleaning string-numerics, scaling numerical, encoding categorical, outlier handling (clipping), imputing missing (mean/mode), datetime breakdown, dropping mostly empty columns.
- **`learned_parameters` Structure**: Maintain the detailed structure for `learned_parameters` (including `string_cleaned_to_numeric`).
- **Numerical Column Type**: Final numerical columns in DataFrame must be `float`.

### Your Correction Thought Process (Internal - to guide your code correction):
1.  **Understand the Error**: Analyze the runtime error message and traceback.
2.  **Review Original Code & Profiling Context**: Identify the problematic code section. Consider if the error stems from a misinterpretation of data characteristics (e.g., failed string-to-numeric conversion, unexpected dtype after cleaning, unseen category).
3.  **Hypothesize Root Cause & Solution**: Formulate a clear hypothesis and a precise fix.
4.  **Implement Correction Safely**: Modify the code. Ensure the fix doesn't introduce new issues or violate original constraints (e.g., if a string-to-numeric conversion fails robustly, how should it be handled? Maybe try-except and log, or impute with a special value if conversion is impossible for some rows).
5.  **Verify `learned_parameters`**: Ensure `learned_parameters` is correctly populated/updated.
6.  **Maintain Consistency**: The corrected code must still perform all intended feature engineering steps.

### Task:
- Analyze the `original code` and the `runtime error`.
- Provide the corrected Python code.
- Ensure the `learned_parameters` dictionary is accurately populated.
- The corrected code must adhere to all original instructions.
- Return only the Python code block.

You must return the corrected code in this format:

import pandas as pd
import numpy as np

def feature_engineering(df: pd.DataFrame, target_column: str) -> tuple[pd.DataFrame, dict]:
    # Make a copy to avoid modifying the original DataFrame
    df_transformed = df.copy()
    # Initialize learned_parameters as it would have been in the original intent
    learned_parameters = {{
        'description': "Feature engineering process: ", # To be updated
        'dropped_columns': [],
        'string_cleaned_to_numeric': {{}},
        'datetime_transformations': {{}},
        'imputation_values': {{'numeric': {{}}, 'categorical': {{}}}},
        'outlier_clipping_bounds': {{}},
        'scaling_parameters': {{}},
        'categorical_encoding': {{}},
        'final_columns': [],
        'numerical_columns_final_type': "float"
    }}

    # --- Corrected feature engineering logic starts here ---
    
    # --- Corrected feature engineering logic ends here ---
    
    # Ensure all numerical columns are float
    # Update final_columns list
    # Update description string in learned_parameters
    
    return df_transformed, learned_parameters

Here is the original code: {code}

Here is the runtime error: {error}
""")
])
