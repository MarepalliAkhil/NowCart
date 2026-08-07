import os
from pydantic import BaseModel


class BaseServiceConfig(BaseModel):
    service_name: str = "nowcart_service"
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    port: int = 8000
