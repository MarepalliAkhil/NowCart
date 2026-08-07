"""
End-to-End Product Embedding Pipeline Execution & Export for NowCart.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

from ml.embeddings.dataset_loader import HMDatasetLoader
from ml.embeddings.text_embedder import ProductTextEmbedder
from ml.embeddings.image_embedder import ProductImageEmbedder
from ml.embeddings.fusion_projector import EmbeddingFusionProjector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("nowcart.pipeline")


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DEFAULT_RAW_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
DEFAULT_PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")


class ProductEmbeddingPipeline:
    """
    Modular End-to-End Product Embedding Pipeline.
    Loads product data, generates text & image embeddings, fuses & projects them into 256-d vectors,
    and exports artifacts ready for Parquet storage & Faiss ANN index creation.
    """

    def __init__(
        self,
        raw_data_dir: Optional[str] = None,
        processed_data_dir: Optional[str] = None,
        output_dim: int = 256,
    ):
        self.raw_data_dir = raw_data_dir if raw_data_dir else DEFAULT_RAW_DIR
        self.processed_data_dir = processed_data_dir if processed_data_dir else DEFAULT_PROCESSED_DIR
        self.output_dim = output_dim

        self.loader = HMDatasetLoader(self.raw_data_dir, self.processed_data_dir)
        self.text_embedder = ProductTextEmbedder()
        self.image_embedder = ProductImageEmbedder()
        self.projector = EmbeddingFusionProjector(
            text_dim=self.text_embedder.embedding_dim,
            image_dim=self.image_embedder.embedding_dim,
            output_dim=output_dim,
            weights_path=os.path.join(self.processed_data_dir, "fusion_projection.npz"),
        )

    def run(self, limit: Optional[int] = None) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Executes full embedding pipeline.
        Returns:
            df (pd.DataFrame): DataFrame containing product metadata + embeddings.
            embeddings (np.ndarray): (N, 256) float32 matrix of unified product vectors.
        """
        logger.info("--- Starting NowCart Product Embedding Pipeline ---")

        # Step 1: Load product data
        df = self.loader.load_articles(limit=limit)
        logger.info(f"Step 1 Complete: Loaded {len(df)} products.")

        # Step 2: Generate text embeddings
        texts = df["text_representation"].tolist()
        logger.info("Step 2: Generating text embeddings...")
        text_embeddings = self.text_embedder.embed_texts(texts)

        # Step 3: Generate image embeddings
        image_paths = df["image_path"].tolist()
        logger.info("Step 3: Generating image embeddings...")
        image_embeddings = self.image_embedder.embed_images(image_paths)

        # Step 4: Multimodal fusion & projection
        logger.info(f"Step 4: Fusing and projecting to unified {self.output_dim}-d vectors...")
        unified_embeddings = self.projector.fuse_and_project(text_embeddings, image_embeddings)

        # Save projection matrix weights for future cold-start inferences
        self.projector.save_weights(os.path.join(self.processed_data_dir, "fusion_projection.npz"))

        # Step 5: Save outputs (Parquet, NumPy, JSON index metadata, Faiss index)
        self._export_artifacts(df, unified_embeddings)

        logger.info("--- Pipeline Completed Successfully ---")
        return df, unified_embeddings

    def _export_artifacts(self, df: pd.DataFrame, embeddings: np.ndarray):
        """Exports parquet dataframe, numpy matrix, metadata index, and Faiss binary index."""
        os.makedirs(self.processed_data_dir, exist_ok=True)

        # 5a: Save to Parquet
        df_parquet = df.copy()
        df_parquet["embedding"] = [vec.tolist() for vec in embeddings]
        parquet_path = os.path.join(self.processed_data_dir, "product_embeddings.parquet")
        df_parquet.to_parquet(parquet_path, index=False)
        logger.info(f"Exported Parquet table: {parquet_path}")

        # 5b: Save raw NumPy array
        npy_path = os.path.join(self.processed_data_dir, "product_embeddings.npy")
        np.save(npy_path, embeddings)
        logger.info(f"Exported NumPy matrix: {npy_path}")

        # 5c: Save index metadata mapping JSON
        metadata = {
            "num_products": len(df),
            "embedding_dim": embeddings.shape[1],
            "article_ids": df["article_id"].tolist(),
            "id_to_index": {str(aid): i for i, aid in enumerate(df["article_id"])},
        }
        json_path = os.path.join(self.processed_data_dir, "product_index_meta.json")
        with open(json_path, "w") as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"Exported index metadata: {json_path}")

        # 5d: Save Faiss index format if installed, else fallback binary
        self._save_faiss_index(embeddings)

    def _save_faiss_index(self, embeddings: np.ndarray):
        """Builds and saves Faiss index or cosine index binary."""
        faiss_path = os.path.join(self.processed_data_dir, "product_faiss.index")
        try:
            import faiss
            dim = embeddings.shape[1]
            index = faiss.IndexFlatIP(dim)  # Inner Product / Cosine similarity (unit vectors)
            index.add(embeddings.astype(np.float32))
            faiss.write_index(index, faiss_path)
            logger.info(f"Exported Faiss Index: {faiss_path}")
        except Exception as e:
            logger.info(f"Faiss library not installed ({e}). Saving raw array index to {faiss_path}")
            np.save(faiss_path, embeddings)


if __name__ == "__main__":
    pipeline = ProductEmbeddingPipeline()
    pipeline.run()
