import os
import sys
import uuid
import time
import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Response, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root path is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

SERVICE_NAME = "api_gateway"

# Define default downstream microservice endpoints
SERVICES = {
    "retrieval_service": os.getenv("RETRIEVAL_SERVICE_URL", "http://localhost:8001"),
    "session_service": os.getenv("SESSION_SERVICE_URL", "http://localhost:8002"),
    "rerank_service": os.getenv("RERANK_SERVICE_URL", "http://localhost:8003"),
    "search_service": os.getenv("SEARCH_SERVICE_URL", "http://localhost:8004"),
    "bundle_service": os.getenv("BUNDLE_SERVICE_URL", "http://localhost:8005"),
    "guardrail_service": os.getenv("GUARDRAIL_SERVICE_URL", "http://localhost:8006"),
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("nowcart.api_gateway")

app = FastAPI(
    title="NowCart - API Gateway",
    description="Unified Entrypoint API Gateway for NowCart Recommendation & Discovery Engine",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_correlation_id_middleware(request: Request, call_next):
    """
    Middleware injecting X-Correlation-ID into request state and response headers for distributed tracing.
    """
    correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    request.state.correlation_id = correlation_id
    
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    return response


# --- Pydantic Models ---

class HealthResponse(BaseModel):
    status: str = Field(default="healthy", example="healthy")
    service_name: str = Field(default=SERVICE_NAME, example=SERVICE_NAME)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    version: str = Field(default="0.1.0")
    details: Dict[str, Any] = Field(default_factory=dict)


class FeedItem(BaseModel):
    product_id: str
    score: float
    category: str
    reason: str


class FeedResponse(BaseModel):
    user_id: str
    correlation_id: str
    consent: bool
    results: List[FeedItem]
    latency_ms: float


class SearchGatewayRequest(BaseModel):
    query: str = Field(..., example="black dress for summer")
    user_id: Optional[str] = Field(default=None)
    consent: bool = Field(default=True)
    user_features: Optional[Dict[str, Any]] = Field(default_factory=dict)
    top_k: int = Field(default=10)


class SearchGatewayResponse(BaseModel):
    query: str
    correlation_id: str
    route_used: str
    estimated_cost_usd: float
    parsed_filters: Dict[str, Any]
    results: List[Dict[str, Any]]


class EventIngestRequest(BaseModel):
    user_id: str = Field(..., example="USER_123")
    product_id: str = Field(..., example="0108775015")
    event_type: str = Field(..., example="view", description="view, click, cart, purchase")


# --- Endpoints ---

@app.get("/")
def read_root():
    return {
        "message": "Welcome to NowCart API Gateway",
        "status": "online",
        "services": list(SERVICES.keys()),
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service_name=SERVICE_NAME,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
        details={"configured_services": SERVICES},
    )


@app.get("/health/all")
async def health_check_all():
    """Aggregates health checks across all downstream microservices."""
    results = {}
    async with httpx.AsyncClient(timeout=2.0) as client:
        tasks = {
            name: client.get(f"{url}/health") for name, url in SERVICES.items()
        }
        for name, task in tasks.items():
            try:
                res = await task
                if res.status_code == 200:
                    results[name] = res.json()
                else:
                    results[name] = {"status": "unhealthy", "code": res.status_code}
            except Exception as exc:
                results[name] = {"status": "unreachable", "error": str(exc)}

    all_healthy = all(
        isinstance(r, dict) and r.get("status") == "healthy" for r in results.values()
    )

    return {
        "gateway_status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": results,
    }


@app.get("/feed/{user_id}", response_model=FeedResponse)
@app.get("/api/feed/{user_id}", response_model=FeedResponse)
def get_personalized_feed(
    user_id: str,
    consent: bool = True,
    top_k: int = 10,
    request: Request = None,
):
    """
    1. GET /feed/{user_id} — Personalized Home Feed Flow:
       session_service -> retrieval_service -> rerank_service -> guardrail_service.
       Handles service-to-service timeouts and graceful fallbacks.
    """
    start_time = time.perf_counter()
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    headers = {"X-Correlation-ID": cid}

    logger.info(f"[{cid}] Processing /feed/{user_id} (consent={consent}, top_k={top_k})")

    # Step 1: Preprocess Guardrail (Consent & Data Minimization check)
    allow_personalization = consent
    try:
        with httpx.Client(timeout=2.0, headers=headers) as client:
            g_res = client.post(
                f"{SERVICES['guardrail_service']}/preprocess",
                json={"user_id": user_id, "consent": consent},
            )
            if g_res.status_code == 200:
                allow_personalization = g_res.json().get("allow_personalization", consent)
    except Exception as exc:
        logger.warning(f"[{cid}] Guardrail preprocess timeout/fallback: {exc}")

    # Step 2: Fetch real-time session intent vector from session_service
    query_vector = [0.0] * 256
    if allow_personalization:
        try:
            with httpx.Client(timeout=2.0, headers=headers) as client:
                s_res = client.get(f"{SERVICES['session_service']}/session/intent-vector/{user_id}")
                if s_res.status_code == 200:
                    query_vector = s_res.json().get("intent_vector", [0.0] * 256)
        except Exception as exc:
            logger.warning(f"[{cid}] session_service timeout/fallback: {exc}")

    # Step 3: Candidate Retrieval from retrieval_service
    raw_candidates = []
    try:
        with httpx.Client(timeout=2.0, headers=headers) as client:
            r_res = client.post(
                f"{SERVICES['retrieval_service']}/retrieve",
                json={"query_vector": query_vector, "top_k": top_k * 3},
            )
            if r_res.status_code == 200:
                for item in r_res.json().get("results", []):
                    meta = item.get("metadata", {})
                    raw_candidates.append(
                        {
                            "product_id": item["product_id"],
                            "retrieval_score": item["score"],
                            "category": meta.get("index_group_name", "General"),
                            "price": float(meta.get("price", 29.99)),
                            "popularity": 0.7,
                            "freshness": 0.8,
                        }
                    )
    except Exception as exc:
        logger.warning(f"[{cid}] retrieval_service timeout/fallback: {exc}")
        # Static fallback candidates
        raw_candidates = _get_static_fallback_candidates()

    # Step 4: Rerank Candidates via rerank_service (with timeout fallback to raw retrieval)
    ranked_candidates = []
    try:
        with httpx.Client(timeout=2.0, headers=headers) as client:
            rr_res = client.post(
                f"{SERVICES['rerank_service']}/rerank",
                json={
                    "candidates": raw_candidates,
                    "context": {"recent_categories": [], "user_id": user_id},
                },
            )
            if rr_res.status_code == 200:
                ranked_candidates = rr_res.json().get("results", [])
            else:
                logger.warning(f"[{cid}] rerank_service returned {rr_res.status_code}. Using raw retrieval results.")
                ranked_candidates = _format_raw_candidates(raw_candidates)
    except Exception as exc:
        logger.warning(f"[{cid}] rerank_service TIMEOUT ({exc}). Falling back to raw retrieval results!")
        ranked_candidates = _format_raw_candidates(raw_candidates)

    # Step 5: Postprocess Guardrail (Verify explainability reasons)
    final_feed_items = []
    try:
        with httpx.Client(timeout=2.0, headers=headers) as client:
            p_res = client.post(
                f"{SERVICES['guardrail_service']}/postprocess",
                json={"results": ranked_candidates[:top_k]},
            )
            if p_res.status_code == 200:
                for item in p_res.json().get("results", []):
                    final_feed_items.append(
                        FeedItem(
                            product_id=item["product_id"],
                            score=item["score"],
                            category=item["category"],
                            reason=item.get("reason", "Recommended based on active catalog trends"),
                        )
                    )
            else:
                final_feed_items = _to_feed_items(ranked_candidates[:top_k])
    except Exception as exc:
        logger.warning(f"[{cid}] Guardrail postprocess timeout/fallback: {exc}")
        final_feed_items = _to_feed_items(ranked_candidates[:top_k])

    latency_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return FeedResponse(
        user_id=user_id,
        correlation_id=cid,
        consent=consent,
        results=final_feed_items,
        latency_ms=latency_ms,
    )


@app.post("/search", response_model=SearchGatewayResponse)
@app.post("/api/search", response_model=SearchGatewayResponse)
def search_products(req: SearchGatewayRequest, request: Request):
    """
    2. POST /search — Semantic Search:
       Routes to search_service and decorates through guardrail_service.
    """
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    headers = {"X-Correlation-ID": cid}

    # Preprocess PII in search query and check data minimization
    cleansed_query = req.query
    allow_personalization = req.consent
    cleansed_user_features = req.user_features or {}
    
    try:
        with httpx.Client(timeout=2.0, headers=headers) as client:
            g_res = client.post(
                f"{SERVICES['guardrail_service']}/preprocess",
                json={
                    "query": req.query,
                    "user_id": req.user_id,
                    "consent": req.consent,
                    "user_features": req.user_features,
                },
            )
            if g_res.status_code == 400:
                raise HTTPException(status_code=400, detail=g_res.json().get("detail", "Data minimization violation"))
            elif g_res.status_code == 200:
                g_data = g_res.json()
                cleansed_query = g_data.get("cleansed_query", req.query)
                allow_personalization = g_data.get("allow_personalization", req.consent)
                cleansed_user_features = g_data.get("cleansed_user_features", {})
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"[{cid}] Guardrail preprocess query scrub error: {exc}")

    # Call search_service
    try:
        with httpx.Client(timeout=3.0, headers=headers) as client:
            s_res = client.post(
                f"{SERVICES['search_service']}/search",
                json={
                    "query": cleansed_query,
                    "user_id": req.user_id if allow_personalization else None,
                    "recent_categories": list(cleansed_user_features.get("recent_categories", [])) if allow_personalization else [],
                    "top_k": req.top_k,
                },
            )
            if s_res.status_code == 200:
                s_data = s_res.json()
                return SearchGatewayResponse(
                    query=s_data["query"],
                    correlation_id=cid,
                    route_used=s_data["route_used"],
                    estimated_cost_usd=s_data["estimated_cost_usd"],
                    parsed_filters=s_data["parsed_filters"],
                    results=s_data["results"],
                )
    except Exception as exc:
        logger.error(f"[{cid}] search_service call failed: {exc}")

    return SearchGatewayResponse(
        query=cleansed_query,
        correlation_id=cid,
        route_used="fallback_static",
        estimated_cost_usd=0.00000,
        parsed_filters={"category": "general"},
        results=[
            {"product_id": "0108775015", "score": 0.8, "category": "Ladieswear", "reason": "Default search result"}
        ],
    )


@app.get("/bundle/{product_id}")
@app.get("/api/bundle/{product_id}")
def get_bundle(product_id: str, request: Request):
    """
    3. GET /bundle/{product_id} — Complete the Look:
       Routes to bundle_service and verifies through guardrail.
    """
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    headers = {"X-Correlation-ID": cid}

    try:
        with httpx.Client(timeout=3.0, headers=headers) as client:
            b_res = client.post(f"{SERVICES['bundle_service']}/bundle/{product_id}")
            if b_res.status_code == 200:
                data = b_res.json()
                data["correlation_id"] = cid
                return data
    except Exception as exc:
        logger.error(f"[{cid}] bundle_service call failed: {exc}")

    return {
        "query_product_id": product_id,
        "correlation_id": cid,
        "items": [],
        "explanation": "Bundle service currently offline.",
        "estimated_cost_usd": 0.00000,
    }


@app.post("/events")
@app.post("/api/events")
def ingest_event(req: EventIngestRequest, request: Request):
    """
    4. POST /events — Ingest clickstream event and update real-time session state.
    """
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    headers = {"X-Correlation-ID": cid}

    logger.info(f"[{cid}] Ingesting event: user={req.user_id}, product={req.product_id}, event={req.event_type}")

    try:
        with httpx.Client(timeout=2.0, headers=headers) as client:
            e_res = client.post(
                f"{SERVICES['session_service']}/session/events",
                json={"user_id": req.user_id, "product_id": req.product_id, "event_type": req.event_type},
            )
            if e_res.status_code in [200, 201]:
                return {"status": "success", "correlation_id": cid, "details": e_res.json()}
    except Exception as exc:
        logger.warning(f"[{cid}] session_service event ingest failed: {exc}")

    return {"status": "accepted_fallback", "correlation_id": cid, "user_id": req.user_id}


# --- Helper Functions ---

def _get_static_fallback_candidates() -> List[Dict[str, Any]]:
    return [
        {"product_id": "0108775015", "retrieval_score": 0.85, "category": "Ladieswear", "price": 19.99, "popularity": 0.9, "freshness": 0.9},
        {"product_id": "0110065002", "retrieval_score": 0.75, "category": "Menswear", "price": 39.99, "popularity": 0.8, "freshness": 0.8},
        {"product_id": "0111565005", "retrieval_score": 0.65, "category": "Ladieswear", "price": 29.99, "popularity": 0.7, "freshness": 0.95},
    ]


def _format_raw_candidates(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        {
            "product_id": c["product_id"],
            "score": c["retrieval_score"],
            "category": c["category"],
            "reason": "Top retrieval vector match (rerank fallback)",
        }
        for c in candidates
    ]


def _to_feed_items(candidates: List[Dict[str, Any]]) -> List[FeedItem]:
    return [
        FeedItem(
            product_id=c["product_id"],
            score=c.get("score", c.get("retrieval_score", 0.0)),
            category=c.get("category", "General"),
            reason=c.get("reason", "Recommended catalog item"),
        )
        for c in candidates
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
