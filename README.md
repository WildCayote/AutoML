# AutoML Platform

The **AutoML Platform** is an advanced machine learning system designed to automate the process of building, training, and deploying machine learning models. It aims to simplify the model creation process, enabling both experienced data scientists and beginners to build high-quality models with minimal manual intervention.

This platform is structured as a microservice architecture managed within a mono repository, providing scalability and flexibility. Each microservice operates independently but integrates seamlessly within the system.

## Key Features

- **Automated Model Training**: Automatically trains machine learning models based on the input data and predefined configurations.
- **Model Selection**: Automatically selects the best-performing model based on evaluation metrics.
- **Data Preprocessing**: Handles data cleaning, feature engineering, and transformation.
- **Real-Time Insights**: Provides real-time predictions and insights through a user-friendly interface.
- **Scalability**: Designed to scale horizontally with microservices architecture.

## Contributors

This project is brought to you by the following contributors:

- Dawit Getahun Mengistu
- Mariam Yohannes Gustavo
- Metsakal Zeleke Eneyew
- Naol Taye
- Tinsae Shemalise Yared

## Getting Started

The project uses [uv](https://github.com/astral-sh/uv) for dependency and environment management.

### Prerequisites

- [`uv`](https://github.com/astral-sh/uv) installed
- Use uv to install python version 3.11 or above

#### UV setup

To set up the development environment:

1. Initialize a virtual environment using uv:

    ```uv venv --python 3.12```
2. Synchronize the environment:

    ```uv sync```
3. Add the pre-commit package:

    ```uv add pre-commit```
4. Run pre-commit to check all files:

    ```uv run pre-commit run --all-files```

### 🛠️ Setup

Follow these steps to set up the project after cloning:

#### 1. Clone the repository

```bash
git clone https://github.com/WildCayote/AutoML.git
cd AutoML
```

#### 2. Create the virtual environment (automatically uses the correct Python version)

```bash
uv venv
```

> This reads `.python-version` and installs the correct Python version if needed.

#### 3. To run Pre-commit

```bash
uv run pre-commit run --all-files
```

#### 4. Special Command to Log into the user-be database

```bash
docker exec -it apps-db-1 psql -h localhost -p 5432 -U {POSTGRES_USER} -d {POSTGRES_DB}
```

then enter your password from `{POSTGRES_PASSWORD}` in your `.env` file.

## Documentation

The full documentation for the AutoML platform, including setup guides, technical documentation, and API references, is available [here](https://wildcayote.github.io/AutoML/). Not fully complete yet!

## License

Copyright © 2024 AutoML Platform Team – Dawit Getahun Mengistu, Mariam Yohannes Gustavo, Metsakal Zeleke Eneyew, Naol Taye, Tinsae Shemalise Yared - All rights reserved.

## Acknowledgements

- [MkDocs](https://mkdocs.org/) for generating documentation.
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) for the theme.
