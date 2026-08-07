import time
import os
import sys
from datetime import datetime, timezone
from typing import List, Optional
import numpy as np
import pandas as pd
import torch
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project path is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.services.session_service.models import (
    IntentVectorRequest,
    IntentVectorResponse,
    SessionEvent,
)
from ml.session_model.model import SessionIntentGRU

SERVICE_NAME = "session_service"

app = FastAPI(
    title="NowCart - Session Service",
    description="Real-Time Session Intent Tracking Microservice",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store session model and product embedding store
session_model = None
product_embedding_store = {}
id_to_index = {}

# Event type mapping: view (0), click (1), cart (2), purchase (3)
EVENT_TYPE_MAPPING = {"view": 0, "click": 1, "cart": 2, "purchase": 3}


@app.on_event("startup")
def load_session_resources():
    global session_model, product_embedding_store, id_to_index

    # Initialize and load session GRU model checkpoint
    session_model = SessionIntentGRU()
    checkpoint_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../ml/session_model/checkpoints/session_gru.pt")
    )
    if os.path.exists(checkpoint_path):
        try:
            session_model.load_state_dict(torch.load(checkpoint_path, map_location=torch.device("cpu")))
            session_model.eval()
            print(f"Successfully loaded session intent model checkpoint from {checkpoint_path}")
        except Exception as e:
            print(f"Error loading session intent model checkpoint: {e}. Using initialized weights.")
    else:
        print(f"Session intent model checkpoint not found at {checkpoint_path}. Using initialized weights.")

    # Load product embedding table to resolve product IDs to 256-d vectors
    parquet_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../data/processed/product_embeddings.parquet")
    )
    if os.path.exists(parquet_path):
        try:
            df = pd.read_parquet(parquet_path)
            for _, row in df.iterrows():
                aid = str(row["article_id"])
                emb = list(row["embedding"])
                product_embedding_store[aid] = emb
            print(f"Loaded {len(product_embedding_store)} product embeddings for ID lookup.")
        except Exception as e:
            print(f"Error loading product embedding parquet: {e}")
    else:
        print(f"Product embedding parquet not found at {parquet_path}. Using fallback embeddings on lookup.")


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", example="healthy")
    service_name: str = Field(default=SERVICE_NAME, example=SERVICE_NAME)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    version: str = Field(default="0.1.0")
    model_loaded: bool = Field(default=False)
    total_cached_embeddings: int = Field(default=0)


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to NowCart {SERVICE_NAME}",
        "status": "online",
        "model_loaded": session_model is not None,
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service_name=SERVICE_NAME,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
        model_loaded=session_model is not None,
        total_cached_embeddings=len(product_embedding_store),
    )


@app.post("/session/intent-vector", response_model=IntentVectorResponse)
def get_session_intent_vector(req: IntentVectorRequest):
    """
    Computes real-time 256-d session intent vector for a chronological sequence of session events.
    """
    if not req.events:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session event sequence cannot be empty.",
        )

    start_time = time.perf_counter()

    seq_products = []
    seq_events = []

    for event in req.events:
        # 1. Resolve product embedding vector (256-d)
        pid = str(event.product_id)
        if pid in product_embedding_store:
            vector = product_embedding_store[pid]
        else:
            # Fallback deterministic pseudo-random vector for unindexed product
            seed = sum(ord(c) for c in pid) % (2**31 - 1)
            rng = np.random.RandomState(seed)
            raw_vec = rng.randn(256)
            norm = np.linalg.norm(raw_vec)
            vector = (raw_vec / norm if norm > 0 else raw_vec).tolist()

        seq_products.append(vector)

        # 2. Resolve event type index
        etype = event.event_type.lower()
        eidx = EVENT_TYPE_MAPPING.get(etype, 0) # default to view (0)
        seq_events.append(eidx)

    # Convert to PyTorch tensors (batch_size=1)
    prod_embeddings_tensor = torch.tensor(np.array([seq_products]), dtype=torch.float32) # (1, seq_len, 256)
    event_types_tensor = torch.tensor([seq_events], dtype=torch.long) # (1, seq_len)

    # Perform sequential model inference
    try:
        with torch.no_grad():
            intent_vec_tensor = session_model(prod_embeddings_tensor, event_types_tensor)
            intent_vector = intent_vec_tensor.squeeze(0).numpy().tolist()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session model inference failed: {str(exc)}",
        )

    latency_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return IntentVectorResponse(
        intent_vector=intent_vector,
        latency_ms=latency_ms,
    )

class IngestEventRequest(BaseModel):
    user_id: str
    product_id: str
    event_type: str


# In-memory store for active user session sequences
USER_SESSIONS: Dict[str, List[SessionEvent]] = {}


@app.post("/session/events", status_code=status.HTTP_201_CREATED)
def ingest_session_event(req: IngestEventRequest):
    """
    Ingests clickstream events to build up the chronological session sequence in memory.
    """
    uid = req.user_id
    if uid not in USER_SESSIONS:
        USER_SESSIONS[uid] = []
        
    event = SessionEvent(product_id=req.product_id, event_type=req.event_type)
    USER_SESSIONS[uid].append(event)
    
    # Cap session sequence to last 10 events to ensure speed
    if len(USER_SESSIONS[uid]) > 10:
        USER_SESSIONS[uid] = USER_SESSIONS[uid][-10:]
        
    return {
        "status": "success",
        "user_id": uid,
        "session_length": len(USER_SESSIONS[uid])
    }


@app.get("/session/intent-vector/{user_id}", response_model=IntentVectorResponse)
def get_user_session_intent(user_id: str):
    """
    Retrieves real-time session intent vector for the accumulated sequence of user events.
    """
    events = USER_SESSIONS.get(user_id, [])
    if not events:
        # Default fallback: return zero vector if no events registered yet
        return IntentVectorResponse(
            intent_vector=[0.0] * 256,
            latency_ms=0.0
        )
        
    # Reuse core vector computation logic
    req = IntentVectorRequest(events=events, user_id=user_id)
    return get_session_intent_vector(req)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
