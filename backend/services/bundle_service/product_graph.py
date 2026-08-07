import os
import logging
from typing import List, Dict, Any
import pandas as pd

logger = logging.getLogger("nowcart.bundle.product_graph")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
PARQUET_PATH = os.path.join(PROJECT_ROOT, "data", "processed", "hm_articles_sample.parquet")

# Predefined co-purchase/complementary graph edges (representing also_bought/also_viewed pairs)
STATIC_GRAPH_EDGES = {
    "0108775015": ["0110065002", "0112000008", "0111565001", "0112000001"], # strap top -> chino, tote bag, denim jacket, boots
    "0111565005": ["0112000008", "0112000001", "0108775015"],             # summer dress -> tote bag, boots, strap top
    "0110065002": ["0110065001", "0112000001", "0112000008"],             # chinos -> t-shirt, boots, tote bag
    "0110065001": ["0110065002", "0111565001", "0112000001"],             # t-shirt -> chinos, denim jacket, boots
}


class ProductGraph:
    """
    Simulated Product graph representing H&M complementary metadata
    and Amazon reviews co-purchase relationships.
    """

    def __init__(self):
        self.catalog: Dict[str, Dict[str, Any]] = {}
        self._load_catalog()

    def _load_catalog(self):
        if os.path.exists(PARQUET_PATH):
            try:
                df = pd.read_parquet(PARQUET_PATH)
                for _, row in df.iterrows():
                    aid = str(row["article_id"])
                    self.catalog[aid] = {
                        "product_id": aid,
                        "prod_name": row["prod_name"],
                        "category": row["index_group_name"],
                    }
                logger.info(f"ProductGraph loaded {len(self.catalog)} items from catalog.")
            except Exception as e:
                logger.warning(f"Error loading catalog in ProductGraph: {e}")
        
        # Ensure fallback hardcoded entries if parquet loader fails
        if not self.catalog:
            self.catalog = {
                "0108775015": {"product_id": "0108775015", "prod_name": "Strap top", "category": "Ladieswear"},
                "0108775044": {"product_id": "0108775044", "prod_name": "Strap top (pack of 2)", "category": "Ladieswear"},
                "0110065001": {"product_id": "0110065001", "prod_name": "OP T-shirt (Ribbed)", "category": "Menswear"},
                "0110065002": {"product_id": "0110065002", "prod_name": "Slim Fit Chino Trousers", "category": "Menswear"},
                "0111565001": {"product_id": "0111565001", "prod_name": "Oversized Denim Jacket", "category": "Divided"},
                "0111565005": {"product_id": "0111565005", "prod_name": "Floral Summer Dress", "category": "Ladieswear"},
                "0112000001": {"product_id": "0112000001", "prod_name": "Leather Chelsea Boots", "category": "Menswear"},
                "0112000008": {"product_id": "0112000008", "prod_name": "Canvas Tote Bag", "category": "Ladieswear"},
            }

    def get_candidate_complements(self, product_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves real candidate complementary products from the graph.
        Guarantees that the candidates actually exist in our catalog.
        """
        pid = str(product_id)
        candidate_ids = STATIC_GRAPH_EDGES.get(pid, [])

        # If no explicit edges exist, fallback to general category-based pairing rules
        if not candidate_ids and pid in self.catalog:
            item_cat = self.catalog[pid]["category"].lower()
            # Category match rules
            for aid, details in self.catalog.items():
                if aid == pid:
                    continue
                # If target is Ladieswear, recommend Divided jacket, accessories or shoes
                if item_cat == "ladieswear" and details["category"].lower() in ["divided", "menswear"]:
                    candidate_ids.append(aid)
                # If target is Menswear, recommend footwear or accessories
                elif item_cat == "menswear" and details["category"].lower() in ["accessories", "divided", "ladieswear"]:
                    candidate_ids.append(aid)

        # Map IDs to actual product metadata
        complements = []
        for cid in candidate_ids:
            if cid in self.catalog:
                complements.append(self.catalog[cid])

        # Return unique candidate list
        unique_complements = []
        seen = set()
        for item in complements:
            if item["product_id"] not in seen:
                seen.add(item["product_id"])
                unique_complements.append(item)

        return unique_complements
