from fastapi import FastAPI
from routes.feature_routes import router as feature_router
from consumer import start_consumer
import asyncio

app = FastAPI(title="Feature Engineering API with RabbitMQ")

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, start_consumer)

app.include_router(feature_router, prefix="/features", tags=["Feature Engineering"])
