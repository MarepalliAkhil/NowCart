from typing import List, Optional
from pydantic import BaseModel, Field


class BundleItem(BaseModel):
    product_id: str = Field(..., description="Complementary product article_id")
    prod_name: str = Field(..., description="Product name")
    category: str = Field(..., description="Product category")


class BundleResponse(BaseModel):
    query_product_id: str = Field(..., description="Product ID the bundle is built for")
    items: List[BundleItem] = Field(..., description="3-4 selected complementary products")
    explanation: str = Field(..., description="LLM generated styling explanation for this bundle")
    estimated_cost_usd: float = Field(..., description="Estimated cost of the LLM call")
