from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CandidateItem(BaseModel):
    product_id: str = Field(..., description="Unique product article_id")
    retrieval_score: float = Field(..., description="ANN retrieval match score")
    category: str = Field(..., description="Product index group or category name")
    price: float = Field(default=9.99, description="Product selling price")
    popularity: float = Field(default=0.5, description="Historical product click/purchase rate")
    freshness: float = Field(default=1.0, description="Freshness ratio (1.0 = brand new, 0.0 = old catalog item)")


class UserSessionContext(BaseModel):
    recent_categories: List[str] = Field(
        default_factory=list, description="List of categories user has browsed in current session"
    )
    user_id: Optional[str] = Field(default=None, description="Optional user ID")


class RerankRequest(BaseModel):
    candidates: List[CandidateItem] = Field(..., description="List of 200-500 candidate items from retrieval service")
    context: UserSessionContext = Field(..., description="Active user and session metadata context")


class RerankedItem(BaseModel):
    product_id: str = Field(..., description="Product article_id")
    rerank_score: float = Field(..., description="Calculated reranking model score")
    category: str = Field(..., description="Product category")
    reason: str = Field(..., description="Machine-readable explainability reason")


class RerankResponse(BaseModel):
    results: List[RerankedItem] = Field(..., description="Final ranked and diversity-capped recommendation list")
    latency_ms: float = Field(..., description="Inference latency in milliseconds")
