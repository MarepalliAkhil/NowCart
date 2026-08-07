from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PreprocessRequest(BaseModel):
    query: Optional[str] = Field(default=None, description="Raw search query string")
    user_id: Optional[str] = Field(default=None, description="Optional user ID")
    consent: bool = Field(default=True, description="User consent flag for personalization")
    user_features: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="User feature dictionary used for personalization"
    )


class PreprocessResponse(BaseModel):
    cleansed_query: Optional[str] = Field(default=None)
    allow_personalization: bool = Field(default=True)
    cleansed_user_features: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


class PostprocessItem(BaseModel):
    product_id: str
    score: Optional[float] = Field(default=0.0)
    rerank_score: Optional[float] = Field(default=0.0)
    category: str
    reason: Optional[str] = Field(default=None)


class PostprocessRequest(BaseModel):
    results: List[PostprocessItem] = Field(..., description="Ranked list of products from rerank service")


class PostprocessResponse(BaseModel):
    results: List[PostprocessItem] = Field(..., description="Postprocessed results with verified explanations")
