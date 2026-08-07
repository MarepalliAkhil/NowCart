"""
Nearest Neighbors Visualizer & Sanity Check Script for NowCart Product Embeddings.

Given a target product_id, retrieves and formats top-5 visually/semantically similar products.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("nowcart.visualize")


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DEFAULT_PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")


class NearestNeighborVisualizer:
    """Sanity-check visualizer for multimodal product embeddings."""

    def __init__(self, processed_data_dir: Optional[str] = None):
        self.processed_data_dir = processed_data_dir if processed_data_dir else DEFAULT_PROCESSED_DIR
        self.parquet_path = os.path.join(self.processed_data_dir, "product_embeddings.parquet")
        self.npy_path = os.path.join(self.processed_data_dir, "product_embeddings.npy")
        self.meta_path = os.path.join(self.processed_data_dir, "product_index_meta.json")

    def find_nearest_neighbors(
        self, product_id: Optional[str] = None, top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Retrieves top_k nearest neighbors for a target product.
        """
        if not os.path.exists(self.parquet_path) or not os.path.exists(self.npy_path):
            raise FileNotFoundError(
                "Processed embeddings not found. Please run 'python -m ml.embeddings.pipeline' first."
            )

        df = pd.read_parquet(self.parquet_path)
        embeddings = np.load(self.npy_path)

        with open(self.meta_path, "r") as f:
            metadata = json.load(f)

        id_to_index = metadata["id_to_index"]

        # Default to first product if product_id is not specified or not found
        if not product_id or str(product_id) not in id_to_index:
            product_id = metadata["article_ids"][0]
            logger.info(f"Target product_id not provided or found. Defaulting to first product: {product_id}")

        query_idx = id_to_index[str(product_id)]
        query_vec = embeddings[query_idx]
        query_item = df.iloc[query_idx].to_dict()

        # Cosine similarity calculation (since embeddings are L2 normalized, dot product = cosine sim)
        similarities = np.dot(embeddings, query_vec)

        # Sort indices in descending order (excluding query item itself)
        sorted_indices = np.argsort(-similarities)
        neighbor_indices = [idx for idx in sorted_indices if idx != query_idx][:top_k]

        recommendations = []
        for rank, idx in enumerate(neighbor_indices, 1):
            item = df.iloc[idx].to_dict()
            item["similarity_score"] = float(similarities[idx])
            item["rank"] = rank
            recommendations.append(item)

        return {
            "query_product": query_item,
            "top_k_recommendations": recommendations,
        }

    def print_recommendations(self, product_id: Optional[str] = None, top_k: int = 5):
        """Prints a clean ASCII table of the nearest neighbor recommendation results."""
        results = self.find_nearest_neighbors(product_id, top_k)
        q = results["query_product"]

        print("\n" + "=" * 80)
        print("                 NOWCART NEAREST-NEIGHBOR SANITY CHECK")
        print("=" * 80)
        print(f"QUERY PRODUCT ID  : {q.get('article_id')}")
        print(f"Name              : {q.get('prod_name')}")
        print(f"Type              : {q.get('product_type_name')} | Color: {q.get('colour_group_name')}")
        print(f"Category/Group    : {q.get('index_group_name')} - {q.get('garment_group_name')}")
        print(f"Description       : {q.get('detail_desc')}")
        print("-" * 80)
        print(f"TOP {top_k} SIMILAR RECOMMENDED PRODUCTS:")
        print("-" * 80)

        for rec in results["top_k_recommendations"]:
            sim = rec["similarity_score"]
            print(
                f"[{rec['rank']}] Score: {sim:.4f} | ID: {rec['article_id']} | "
                f"Name: {rec['prod_name']} ({rec['colour_group_name']} {rec['product_type_name']})"
            )
            print(f"    Category   : {rec['index_group_name']} -> {rec['garment_group_name']}")
            print(f"    Description: {rec['detail_desc']}")
            print()
        print("=" * 80 + "\n")


if __name__ == "__main__":
    visualizer = NearestNeighborVisualizer()
    visualizer.print_recommendations(top_k=5)
