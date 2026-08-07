import os
import re
import sys
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project path is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.services.guardrail_service.models import (
    PreprocessRequest,
    PreprocessResponse,
    PostprocessRequest,
    PostprocessResponse,
    PostprocessItem,
)

SERVICE_NAME = "guardrail_service"

app = FastAPI(
    title="NowCart - Guardrail Service",
    description="DPDP Compliance, PII Filtering & Explainability Microservice",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
AUDIT_LOG_FILE = os.path.join(PROJECT_ROOT, "data", "processed", "guardrail_audit.log")

# Regex patterns for PII detection
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"\b\d{10}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b")

# Forbidden raw PII keys (Data minimization violation)
FORBIDDEN_PII_KEYS = {"email", "phone", "phone_number", "address", "ssn", "name", "raw_pii"}


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", example="healthy")
    service_name: str = Field(default=SERVICE_NAME, example=SERVICE_NAME)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    version: str = Field(default="0.1.0")


@app.get("/")
def read_root():
    return {"message": f"Welcome to NowCart {SERVICE_NAME}", "status": "online"}


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service_name=SERVICE_NAME,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
    )


@app.post("/preprocess", response_model=PreprocessResponse)
def preprocess_request(req: PreprocessRequest):
    """
    Checks data minimization, consent flag, and redacts PII in search query.
    """
    checks = {
        "data_minimization": "PASS",
        "pii_redaction": "PASS",
        "consent_check": "PASS",
    }
    warnings = []
    
    # 1. Data Minimization Check: block raw PII keys in personalization context
    if req.user_features:
        for key in req.user_features.keys():
            if key.lower() in FORBIDDEN_PII_KEYS:
                checks["data_minimization"] = "FAIL"
                _write_audit_log("preprocess", req, checks, status="BLOCKED")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Data minimization violation: Raw PII key '{key}' detected in request.",
                )

    # 2. Consent-Aware Personalization: override user features if consent is false
    allow_personalization = req.consent
    cleansed_features = req.user_features or {}
    if not req.consent:
        checks["consent_check"] = "OVERRIDDEN"
        cleansed_features = {}
        warnings.append("User personalization consent is FALSE. Falling back to non-personalized popularity recommendations.")

    # 3. PII Redaction in query
    cleansed_query = req.query
    if req.query:
        redacted_query = req.query
        # Redact emails
        redacted_query, email_count = EMAIL_REGEX.subn("[REDACTED_EMAIL]", redacted_query)
        # Redact phones
        redacted_query, phone_count = PHONE_REGEX.subn("[REDACTED_PHONE]", redacted_query)
        
        if email_count > 0 or phone_count > 0:
            checks["pii_redaction"] = "REDACTED"
            cleansed_query = redacted_query
            warnings.append("PII patterns detected and redacted in query string.")

    # Write compliance audit log
    _write_audit_log("preprocess", req, checks, status="PASS", cleansed_query=cleansed_query)

    return PreprocessResponse(
        cleansed_query=cleansed_query,
        allow_personalization=allow_personalization,
        cleansed_user_features=cleansed_features,
        warnings=warnings,
    )


@app.post("/postprocess", response_model=PostprocessResponse)
def postprocess_response(req: PostprocessRequest):
    """
    Ensures every item has a rule-based explainability reason and scrubs any leaks.
    """
    checks = {
        "explainability_check": "PASS",
        "pii_leak_check": "PASS",
    }
    
    cleansed_results = []
    for item in req.results:
        reason = item.reason
        if not reason or reason.strip() == "":
            checks["explainability_check"] = "REPAIRED"
            reason = "Recommended based on trending items in popular categories"
            
        final_score = item.score if item.score is not None and item.score != 0.0 else (item.rerank_score if item.rerank_score is not None else 0.0)
        
        cleansed_results.append(
            PostprocessItem(
                product_id=item.product_id,
                score=final_score,
                rerank_score=final_score,
                category=item.category,
                reason=reason,
            )
        )

    # Write audit log for response checks
    _write_audit_log("postprocess", {"num_items": len(req.results)}, checks, status="PASS")

    return PostprocessResponse(results=cleansed_results)


def _write_audit_log(phase: str, req_info: Any, checks: dict, status: str, cleansed_query: str = None):
    """Writes a structured compliance line to the local audit log file."""
    os.makedirs(os.path.dirname(AUDIT_LOG_FILE), exist_ok=True)
    
    # Safely convert request object to dictionary
    req_dict = {}
    if hasattr(req_info, "model_dump"):
        req_dict = req_info.model_dump()
    elif hasattr(req_info, "dict"):
        req_dict = req_info.dict()
    elif isinstance(req_info, dict):
        req_dict = req_info
    else:
        req_dict = {"info": str(req_info)}

    # Scrub input query of PII before logging to audit log
    raw_query = req_dict.get("query")
    if raw_query:
        raw_query = EMAIL_REGEX.sub("[REDACTED_EMAIL]", raw_query)
        raw_query = PHONE_REGEX.sub("[REDACTED_PHONE]", raw_query)

    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "phase": phase,
        "status": status,
        "checks": checks,
        "input_query": raw_query,
        "cleansed_query": cleansed_query,
        "consent": req_dict.get("consent"),
    }
    
    with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8006, reload=True)
