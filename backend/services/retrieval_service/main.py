import time
import os
import sys
from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.services.retrieval_service.models import (
    RetrieveRequest,
    RetrieveResponse,
    ScoredProduct,
    ColdStartRetrieveRequest,
    AddProductRequest,
    AddProductResponse,
)
from backend.services.retrieval_service.index_manager import VectorIndexManager

SERVICE_NAME = "retrieval_service"

app = FastAPI(
    title="NowCart - Retrieval Service",
    description="Faiss/ANN Candidate Vector Retrieval Microservice",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Vector Index Singleton
index_manager = VectorIndexManager()


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", example="healthy")
    service_name: str = Field(default=SERVICE_NAME, example=SERVICE_NAME)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    version: str = Field(default="0.1.0")
    total_indexed_products: int = Field(default=0)


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to NowCart {SERVICE_NAME}",
        "status": "online",
        "total_indexed": len(index_manager.article_ids),
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service_name=SERVICE_NAME,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
        total_indexed_products=len(index_manager.article_ids),
    )


@app.post("/retrieve", response_model=RetrieveResponse)
def retrieve_candidates(req: RetrieveRequest):
    """
    Retrieves Top-K nearest candidate products for a given query vector or existing product_id.
    """
    start_time = time.perf_counter()

    query_vec = req.query_vector

    # If query_product_id provided, look up its vector
    if query_vec is None:
        if req.query_product_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either query_vector or query_product_id must be provided.",
            )
        if req.query_product_id not in index_manager.id_to_index:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID '{req.query_product_id}' not found in vector index.",
            )
        idx = index_manager.id_to_index[req.query_product_id]
        query_vec = index_manager.embeddings[idx].tolist()

    try:
        raw_results = index_manager.search(query_vec, top_k=req.top_k)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    scored_products = [
        ScoredProduct(
            product_id=aid,
            score=round(score, 5),
            rank=i + 1,
            metadata=meta,
        )
        for i, (aid, score, meta) in enumerate(raw_results)
    ]

    latency_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return RetrieveResponse(
        query_product_id=req.query_product_id,
        top_k=req.top_k,
        results=scored_products,
        latency_ms=latency_ms,
    )


@app.post("/retrieve/cold-start-item", response_model=RetrieveResponse)
def retrieve_cold_start_item(req: ColdStartRetrieveRequest):
    """
    Retrieves nearest neighbors for an unindexed NEW product purely by content similarity vector.
    Proves cold-start retrieval capability without modifying index.
    """
    start_time = time.perf_counter()

    try:
        raw_results = index_manager.search(req.new_product_embedding, top_k=req.top_k)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    scored_products = [
        ScoredProduct(
            product_id=aid,
            score=round(score, 5),
            rank=i + 1,
            metadata=meta,
        )
        for i, (aid, score, meta) in enumerate(raw_results)
    ]

    latency_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return RetrieveResponse(
        query_product_id=f"COLD_START_{req.new_product_name}",
        top_k=req.top_k,
        results=scored_products,
        latency_ms=latency_ms,
    )


@app.post("/index/add", response_model=AddProductResponse)
def add_product_to_index(req: AddProductRequest):
    """
    Adds a new product embedding and metadata to the vector index at runtime.
    """
    try:
        total = index_manager.add_product(
            product_id=req.product_id,
            vector=req.embedding,
            metadata=req.metadata,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    return AddProductResponse(
        status="success",
        product_id=req.product_id,
        total_indexed_products=total,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
