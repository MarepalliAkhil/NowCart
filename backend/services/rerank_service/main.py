import time
import os
import sys
from datetime import datetime, timezone
from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.services.rerank_service.models import (
    RerankRequest,
    RerankResponse,
    RerankedItem,
)
from backend.services.rerank_service.ranker import LightGBMReranker
from backend.services.rerank_service.diversity import enforce_diversity_cap

SERVICE_NAME = "rerank_service"

app = FastAPI(
    title="NowCart - Rerank Service",
    description="Lightweight LightGBM Reranker & Diversity Guardrail Microservice",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model singleton
reranker = None


@app.on_event("startup")
def load_rerank_resources():
    global reranker
    reranker = LightGBMReranker()


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", example="healthy")
    service_name: str = Field(default=SERVICE_NAME, example=SERVICE_NAME)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    version: str = Field(default="0.1.0")
    model_loaded: bool = Field(default=False)


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to NowCart {SERVICE_NAME}",
        "status": "online",
        "model_loaded": reranker is not None,
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service_name=SERVICE_NAME,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
        model_loaded=reranker is not None,
    )


@app.post("/rerank", response_model=RerankResponse)
def rerank_recommendations(req: RerankRequest):
    """
    Reranks candidate products using LightGBM and applies a strict 35% category diversity cap.
    """
    if not req.candidates:
        return RerankResponse(results=[], latency_ms=0.0)

    start_time = time.perf_counter()

    # Step 1: Score candidates using LightGBM ranker
    try:
        scores = reranker.score_candidates(req.candidates, req.context)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reranking model prediction failed: {str(exc)}",
        )

    # Pair candidates with their predicted scores
    scored_items = list(zip(req.candidates, scores))

    # Step 2: Apply diversity guardrail (strictly enforces 35% cap per category)
    # Default target size = 20 or input length if smaller
    target_size = min(len(req.candidates), 20)
    diverse_scored_items = enforce_diversity_cap(scored_items, max_pct=0.35, target_size=target_size)

    # Step 3: Format outputs and generate explainability reasons
    results = []
    recent_cats = set(c.lower() for c in req.context.recent_categories)

    for cand, score in diverse_scored_items:
        # Determine explanation reason
        if cand.category.lower() in recent_cats:
            reason = f"Matches your active session interest in category '{cand.category}'"
        elif cand.popularity > 0.7:
            reason = "Trending item frequently bought by other shoppers"
        elif cand.freshness > 0.8:
            reason = "Newly listed product you might like"
        else:
            reason = f"Personalized match based on historical preferences"

        results.append(
            RerankedItem(
                product_id=cand.product_id,
                rerank_score=round(score, 5),
                category=cand.category,
                reason=reason,
            )
        )

    latency_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return RerankResponse(results=results, latency_ms=latency_ms)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
