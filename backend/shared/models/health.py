from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy", description="Status of the service")
    service_name: str = Field(..., example="retrieval_service", description="Name of the service")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of healthcheck execution",
    )
    version: str = Field(default="0.1.0", description="Service semantic version")
    details: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Additional health diagnostics details"
    )
