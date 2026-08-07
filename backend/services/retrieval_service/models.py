"""
Pydantic Request & Response Models for NowCart Retrieval Service.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RetrieveRequest(BaseModel):
    query_vector: Optional[List[float]] = Field(
        default=None,
        description="256-dimensional query vector. If not provided, query_product_id must be supplied.",
    )
    query_product_id: Optional[str] = Field(
        default=None,
        description="Existing product ID to use as query vector source.",
    )
    top_k: int = Field(default=10, ge=1, le=100, description="Number of nearest neighbors to retrieve")


class ScoredProduct(BaseModel):
    product_id: str = Field(..., description="Unique product article_id")
    score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    rank: int = Field(..., description="Recommendation rank index (1-based)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Product catalog metadata")


class RetrieveResponse(BaseModel):
    query_product_id: Optional[str] = Field(default=None)
    top_k: int
    results: List[ScoredProduct]
    latency_ms: float = Field(..., description="End-to-end vector search latency in milliseconds")


class ColdStartRetrieveRequest(BaseModel):
    new_product_embedding: List[float] = Field(
        ..., description="256-dimensional embedding vector for unindexed new product"
    )
    new_product_name: Optional[str] = Field(default="Unindexed Cold-Start Product")
    top_k: int = Field(default=10, ge=1, le=100)


class AddProductRequest(BaseModel):
    product_id: str = Field(..., description="New product article ID to add to index")
    embedding: List[float] = Field(..., description="256-dimensional embedding vector")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Product metadata dictionary"
    )


class AddProductResponse(BaseModel):
    status: str = Field(default="success")
    product_id: str
    total_indexed_products: int
