"""
Multimodal Fusion & Linear Projection Layer for NowCart.
Combines text & image embeddings and projects them to a unified fixed dimension (256-d).
"""

import os
import logging
from typing import Optional
import numpy as np

logger = logging.getLogger("nowcart.fusion_projector")


class EmbeddingFusionProjector:
    """
    Concatenates text (384-d) and image (512-d) embeddings and projects
    them into a unified L2-normalized 256-dimensional product embedding vector.
    """

    def __init__(
        self,
        text_dim: int = 384,
        image_dim: int = 512,
        output_dim: int = 256,
        seed: int = 42,
        weights_path: Optional[str] = None,
    ):
        self.text_dim = text_dim
        self.image_dim = image_dim
        self.combined_dim = text_dim + image_dim
        self.output_dim = output_dim
        self.seed = seed
        self.weights_path = weights_path
        self.projection_matrix = None
        self.bias = None
        self._init_projection_matrix()

    def _init_projection_matrix(self):
        """Initializes or loads linear projection weights."""
        if self.weights_path and os.path.exists(self.weights_path):
            logger.info(f"Loading fusion projection matrix from {self.weights_path}")
            data = np.load(self.weights_path)
            self.projection_matrix = data["W"]
            self.bias = data.get("b", np.zeros(self.output_dim, dtype=np.float32))
        else:
            logger.info(f"Initializing orthogonal projection matrix ({self.combined_dim} -> {self.output_dim})")
            rng = np.random.RandomState(self.seed)
            # Xavier/Glorot initialization for smooth projection
            limit = np.sqrt(6.0 / (self.combined_dim + self.output_dim))
            self.projection_matrix = rng.uniform(
                -limit, limit, (self.combined_dim, self.output_dim)
            ).astype(np.float32)
            self.bias = np.zeros(self.output_dim, dtype=np.float32)

    def save_weights(self, save_path: str):
        """Saves projection matrix to disk for inference / cold-start consistency."""
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        np.savez(save_path, W=self.projection_matrix, b=self.bias)
        logger.info(f"Saved fusion projection matrix to {save_path}")

    def fuse_and_project(
        self, text_embeddings: np.ndarray, image_embeddings: np.ndarray
    ) -> np.ndarray:
        """
        Concatenates L2-normalized text and image embeddings, applies linear projection,
        and returns unit L2-normalized unified product embeddings (N, output_dim).
        """
        n_samples = len(text_embeddings)
        if n_samples == 0:
            return np.empty((0, self.output_dim), dtype=np.float32)

        # L2 normalize individual modalities
        text_norm = np.linalg.norm(text_embeddings, axis=1, keepdims=True)
        text_norm[text_norm == 0] = 1.0
        text_normed = text_embeddings / text_norm

        image_norm = np.linalg.norm(image_embeddings, axis=1, keepdims=True)
        image_norm[image_norm == 0] = 1.0
        image_normed = image_embeddings / image_norm

        # Concatenate modalities (N, 896)
        combined = np.hstack([text_normed, image_normed])

        # Linear projection (N, 896) @ (896, 256) -> (N, 256)
        projected = np.matmul(combined, self.projection_matrix) + self.bias

        # Final L2 normalization
        proj_norm = np.linalg.norm(projected, axis=1, keepdims=True)
        proj_norm[proj_norm == 0] = 1.0
        unified_embeddings = projected / proj_norm

        return unified_embeddings.astype(np.float32)
