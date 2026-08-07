"""
Text Embedding Pipeline using SentenceTransformers (all-MiniLM-L6-v2) for NowCart.
"""

import logging
from typing import List, Union
import numpy as np

logger = logging.getLogger("nowcart.text_embedder")


class ProductTextEmbedder:
    """
    Generates text embeddings for product titles, descriptions, and attributes.
    Primary model: sentence-transformers/all-MiniLM-L6-v2 (384-dimensional output).
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2", embedding_dim: int = 384):
        self.model_name = model_name
        self.embedding_dim = embedding_dim
        self.model = None
        self._init_model()

    def _init_model(self):
        """Initializes SentenceTransformer or fallback model."""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformer model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer '{self.model_name}': {e}. Using fallback deterministic encoder.")
            self.model = None

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Embeds a list of text strings into an (N, embedding_dim) numpy matrix.
        """
        if not texts:
            return np.empty((0, self.embedding_dim), dtype=np.float32)

        if self.model is not None:
            embeddings = self.model.encode(
                texts,
                batch_size=32,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True,
            )
            return embeddings.astype(np.float32)

        # Fallback pseudo-random deterministic embedding if model download is blocked
        logger.info(f"Generating fallback text embeddings ({len(texts)}, {self.embedding_dim})")
        embeddings = []
        for text in texts:
            seed = sum(ord(c) for c in text) % (2**31 - 1)
            rng = np.random.RandomState(seed)
            vec = rng.randn(self.embedding_dim).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec)

        return np.vstack(embeddings)
