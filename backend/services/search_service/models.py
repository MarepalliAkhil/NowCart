from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., example="black dress for a summer wedding", description="Natural language search query")
    top_k: int = Field(default=10, ge=1, le=100)
    user_id: Optional[str] = Field(default=None)
    recent_categories: List[str] = Field(default_factory=list)


class ParsedFilters(BaseModel):
    category: Optional[str] = Field(default=None, description="Extracted product category")
    color: Optional[str] = Field(default=None, description="Extracted product color")
    attributes: List[str] = Field(default_factory=list, description="Extracted key attributes or styles")


class SearchResultItem(BaseModel):
    product_id: str
    score: float
    category: str
    reason: str


class SearchResponse(BaseModel):
    query: str
    route_used: str = Field(..., description="Query classification path: 'cheap_rule_based' or 'llm_query_understanding'")
    estimated_cost_usd: float = Field(..., description="Estimated query parsing cost in USD")
    parsed_filters: ParsedFilters
    results: List[SearchResultItem]
