"""
Main FastAPI Application Entry Point.
Configures CORS middleware, exception handlers, and mounts API router.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router as api_router
from src.logger import logger

def create_app() -> FastAPI:
    """Initializes and configures the FastAPI instance."""
    app = FastAPI(
        title="Customer Churn Prediction & LTV Engine API",
        description="Production microservice for real-time customer churn risk scoring and Customer Lifetime Value (LTV) prediction.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # Enable CORS for cross-origin dashboard requests
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount routes
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/", tags=["Root"])
    def root():
        return {
            "message": "Welcome to Customer Churn Prediction & LTV Engine API",
            "docs": "/docs",
            "health": "/api/v1/health"
        }

    logger.info("FastAPI Application initialized successfully.")
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.app:app", host="0.0.0.0", port=8000, reload=True)
