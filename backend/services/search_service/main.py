import time
import os
import sys
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project path is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.services.search_service.models import (
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    ParsedFilters,
)
from backend.services.search_service.query_parser import QueryParser
from ml.embeddings.text_embedder import ProductTextEmbedder

SERVICE_NAME = "search_service"

app = FastAPI(
    title="NowCart - Search Service",
    description="Semantic Search, Query Parsing & Downstream Orchestration Microservice",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
query_parser = None
text_embedder = None

RETRIEVAL_URL = os.getenv("RETRIEVAL_SERVICE_URL", "http://localhost:8001")
RERANK_URL = os.getenv("RERANK_SERVICE_URL", "http://localhost:8003")
DOCS_COST_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../docs/cost_per_inference.md"))


@app.on_event("startup")
def load_resources():
    global query_parser, text_embedder
    query_parser = QueryParser()
    text_embedder = ProductTextEmbedder()


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", example="healthy")
    service_name: str = Field(default=SERVICE_NAME, example=SERVICE_NAME)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    version: str = Field(default="0.1.0")


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to NowCart {SERVICE_NAME}",
        "status": "online",
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service_name=SERVICE_NAME,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
    )


@app.post("/search", response_model=SearchResponse)
def search_products(req: SearchRequest):
    """
    Orchestrates: Query Parsing -> Text Embedding -> Retrieval Service -> Rerank Service.
    """
    # 1. Route by query complexity & parse
    filters, route, cost = query_parser.parse(req.query)

    # Log query routing & cost to docs/cost_per_inference.md
    log_query_cost_to_docs(req.query, route, cost)

    # 2. Embed query text into 256-d vector (using first 256 dimensions of MiniLM)
    raw_emb = text_embedder.embed_texts([req.query])[0][:256]
    # L2 normalize
    norm = np_norm(raw_emb)
    query_vector = (raw_emb / norm if norm > 0 else raw_emb).tolist()

    # 3. Retrieve candidates from retrieval_service
    candidates = []
    try:
        with httpx.Client(timeout=3.0) as client:
            ret_res = client.post(
                f"{RETRIEVAL_URL}/retrieve",
                json={"query_vector": query_vector, "top_k": req.top_k * 3},
            )
            if ret_res.status_code == 200:
                ret_data = ret_res.json()
                # Map to rerank CandidateItem format
                for item in ret_data.get("results", []):
                    meta = item.get("metadata", {})
                    candidates.append(
                        {
                            "product_id": item["product_id"],
                            "retrieval_score": item["score"],
                            "category": meta.get("index_group_name", "General"),
                            "price": float(meta.get("price", 29.99)),
                            "popularity": 0.6,
                            "freshness": 0.8,
                        }
                    )
    except Exception as e:
        # Fallback simulated retrieval candidates if service is offline
        candidates = _get_mock_retrieval_candidates(filters)

    # 4. Rerank candidates using rerank_service
    reranked_results = []
    if candidates:
        try:
            with httpx.Client(timeout=3.0) as client:
                rr_res = client.post(
                    f"{RERANK_URL}/rerank",
                    json={
                        "candidates": candidates[:100],
                        "context": {
                            "recent_categories": req.recent_categories,
                            "user_id": req.user_id,
                        },
                    },
                )
                if rr_res.status_code == 200:
                    rr_data = rr_res.json()
                    for item in rr_data.get("results", []):
                        reranked_results.append(
                            SearchResultItem(
                                product_id=item["product_id"],
                                score=item["rerank_score"],
                                category=item["category"],
                                reason=item["reason"],
                            )
                        )
        except Exception:
            # Fallback local rerank if service is offline
            for i, c in enumerate(candidates[: req.top_k]):
                reranked_results.append(
                    SearchResultItem(
                        product_id=c["product_id"],
                        score=c["retrieval_score"],
                        category=c["category"],
                        reason="Matches your search terms",
                    )
                )
    else:
        reranked_results = []

    return SearchResponse(
        query=req.query,
        route_used=route,
        estimated_cost_usd=cost,
        parsed_filters=filters,
        results=reranked_results[: req.top_k],
    )


def log_query_cost_to_docs(query: str, route: str, cost: float):
    """Appends query classification routing info to docs/cost_per_inference.md."""
    if not os.path.exists(DOCS_COST_FILE):
        return
    log_line = f"\n- **Query**: \"{query}\" | **Route**: `{route}` | **Est. Cost**: `${cost:.5f}` | **Timestamp**: {datetime.now(timezone.utc).isoformat()}"
    try:
        with open(DOCS_COST_FILE, "a", encoding="utf-8") as f:
            f.write(log_line)
    except Exception:
        pass


def np_norm(vec):
    import numpy as np
    return float(np.linalg.norm(vec))


def _get_mock_retrieval_candidates(filters: ParsedFilters) -> List[Dict[str, Any]]:
    # Mock fallback candidates
    candidates = []
    categories = [filters.category] if filters.category else ["Ladieswear", "Menswear"]
    color = filters.color if filters.color else "black"

    for i in range(15):
        candidates.append(
            {
                "product_id": f"011006500{i}",
                "retrieval_score": 0.85 - (i * 0.02),
                "category": categories[0],
                "price": 29.99,
                "popularity": 0.7,
                "freshness": 0.9,
            }
        )
    return candidates


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)
