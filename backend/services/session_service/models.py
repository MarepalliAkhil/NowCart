from typing import List, Optional
from pydantic import BaseModel, Field


class SessionEvent(BaseModel):
    product_id: str = Field(..., description="Unique product article_id")
    event_type: str = Field(
        ..., description="Type of event: 'view' (0), 'click' (1), 'cart' (2), 'purchase' (3)"
    )


class IntentVectorRequest(BaseModel):
    events: List[SessionEvent] = Field(..., description="Sequential list of events in current session in chronological order")
    user_id: Optional[str] = Field(default=None, description="Optional user ID for long-term preference blending")


class IntentVectorResponse(BaseModel):
    intent_vector: List[float] = Field(..., description="256-dimensional real-time session intent vector")
    latency_ms: float = Field(..., description="Inference latency in milliseconds")
