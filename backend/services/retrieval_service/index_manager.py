"""
Faiss Vector Index Manager for NowCart Retrieval Service.
Handles loading embeddings, building/updating Faiss IndexFlatIP, and executing ANN queries.
"""

import os
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np

logger = logging.getLogger("nowcart.retrieval.index_manager")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
DEFAULT_PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")


class VectorIndexManager:
    """
    Manages in-memory product vector index using Faiss IndexFlatIP (or numpy dot product fallback).
    """

    def __init__(self, data_dir: Optional[str] = None, embedding_dim: int = 256):
        self.data_dir = data_dir if data_dir else DEFAULT_PROCESSED_DIR
        self.embedding_dim = embedding_dim
        self.index = None
        self.use_faiss = False
        self.embeddings: Optional[np.ndarray] = None
        self.article_ids: List[str] = []
        self.id_to_index: Dict[str, int] = {}
        self.metadata_store: Dict[str, Dict[str, Any]] = {}
        
        self.load_index()

    def load_index(self):
        """Loads processed product embeddings and initializes Faiss/NumPy vector index."""
        parquet_path = os.path.join(self.data_dir, "product_embeddings.parquet")
        npy_path = os.path.join(self.data_dir, "product_embeddings.npy")
        meta_path = os.path.join(self.data_dir, "product_index_meta.json")

        if not os.path.exists(parquet_path) and not os.path.exists(npy_path):
            logger.warning(
                f"Embedding files not found in {self.data_dir}. Initializing empty vector index."
            )
            self._init_empty_index()
            return

        logger.info(f"Loading product embeddings from {self.data_dir}...")
        
        # Load metadata catalog dataframe
        if os.path.exists(parquet_path):
            df = pd.read_parquet(parquet_path)
            for idx, row in df.iterrows():
                aid = str(row["article_id"])
                meta = row.to_dict()
                if "embedding" in meta:
                    del meta["embedding"]
                self.metadata_store[aid] = meta

        # Load embedding matrix
        if os.path.exists(npy_path):
            self.embeddings = np.load(npy_path).astype(np.float32)
        elif "embedding" in df.columns:
            self.embeddings = np.array(df["embedding"].tolist(), dtype=np.float32)

        if self.embeddings is not None and len(self.embeddings) > 0:
            self.embedding_dim = self.embeddings.shape[1]
            
            # Normalize vectors to unit length for inner product / cosine similarity
            norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self.embeddings = self.embeddings / norms

            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    meta = json.load(f)
                    self.article_ids = [str(aid) for aid in meta.get("article_ids", [])]
                    self.id_to_index = {str(k): int(v) for k, v in meta.get("id_to_index", {}).items()}
            else:
                self.article_ids = list(self.metadata_store.keys())
                self.id_to_index = {aid: i for i, aid in enumerate(self.article_ids)}

            self._build_faiss_index()
        else:
            self._init_empty_index()

    def _init_empty_index(self):
        """Initializes empty vector index structures."""
        self.embeddings = np.empty((0, self.embedding_dim), dtype=np.float32)
        self.article_ids = []
        self.id_to_index = {}
        self.metadata_store = {}
        self._build_faiss_index()

    def _build_faiss_index(self):
        """Builds Faiss IndexFlatIP index or sets numpy fallback."""
        try:
            import faiss
            self.index = faiss.IndexFlatIP(self.embedding_dim)
            if len(self.embeddings) > 0:
                self.index.add(self.embeddings)
            self.use_faiss = True
            logger.info(f"Initialized Faiss IndexFlatIP with {len(self.embeddings)} vectors.")
        except Exception as e:
            logger.info(f"Faiss not available ({e}). Using NumPy inner-product vector search.")
            self.use_faiss = False

    def search(
        self, query_vector: np.ndarray, top_k: int = 10
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """
        Searches top-K nearest neighbors for a normalized query vector.
        Returns list of (article_id, similarity_score, metadata).
        """
        if len(self.article_ids) == 0:
            return []

        # Ensure query_vector is 2D float32 and unit-normalized
        query_vector = np.array(query_vector, dtype=np.float32).reshape(1, -1)
        if query_vector.shape[1] != self.embedding_dim:
            raise ValueError(
                f"Query vector dimension mismatch. Expected {self.embedding_dim}, got {query_vector.shape[1]}"
            )

        norm = np.linalg.norm(query_vector)
        if norm > 0:
            query_vector = query_vector / norm

        top_k = min(top_k, len(self.article_ids))

        if self.use_faiss and self.index is not None:
            scores, indices = self.index.search(query_vector, top_k)
            scores = scores[0]
            indices = indices[0]
        else:
            # NumPy fallback dot product search
            sims = np.dot(self.embeddings, query_vector.T).flatten()
            indices = np.argsort(-sims)[:top_k]
            scores = sims[indices]

        results = []
        for idx, score in zip(indices, scores):
            if idx < 0 or idx >= len(self.article_ids):
                continue
            aid = self.article_ids[idx]
            meta = self.metadata_store.get(aid, {})
            results.append((aid, float(score), meta))

        return results

    def add_product(
        self, product_id: str, vector: np.ndarray, metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Adds a new product vector + metadata to the index at runtime.
        Returns total count of indexed products.
        """
        vec = np.array(vector, dtype=np.float32).reshape(1, -1)
        if vec.shape[1] != self.embedding_dim:
            raise ValueError(
                f"Product vector dimension mismatch. Expected {self.embedding_dim}, got {vec.shape[1]}"
            )

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        idx = len(self.article_ids)
        self.article_ids.append(str(product_id))
        self.id_to_index[str(product_id)] = idx
        self.metadata_store[str(product_id)] = metadata or {"article_id": str(product_id)}

        if len(self.embeddings) == 0:
            self.embeddings = vec
        else:
            self.embeddings = np.vstack([self.embeddings, vec])

        if self.use_faiss and self.index is not None:
            self.index.add(vec)

        logger.info(f"Added product {product_id} to vector index. Total indexed: {len(self.article_ids)}")
        return len(self.article_ids)


# Singleton instance
index_manager = VectorIndexManager()
