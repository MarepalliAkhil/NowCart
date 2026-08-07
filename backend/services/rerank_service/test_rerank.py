import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.services.rerank_service.models import CandidateItem
from backend.services.rerank_service.diversity import enforce_diversity_cap


class TestRerankDiversityGuardrail(unittest.TestCase):
    """
    Unit test verifying that the diversity guardrail strictly limits any single
    product category to a maximum of 35% of the recommendation list.
    """

    def test_diversity_cap_enforcement(self):
        # Build 100 candidate items skewed 90% towards 'Ladieswear'
        candidates = []
        
        # 90 items of 'Ladieswear'
        for i in range(90):
            candidates.append(
                CandidateItem(
                    product_id=f"LADIES_{i}",
                    retrieval_score=0.9 - (i * 0.005),
                    category="Ladieswear",
                    price=29.99,
                    popularity=0.8,
                    freshness=0.9
                )
            )
            
        # 15 items distributed across 5 other categories (3 items each)
        other_categories = ["Menswear", "Kidswear", "Sportswear", "Accessories", "Home"]
        for cat in other_categories:
            for i in range(3):
                candidates.append(
                    CandidateItem(
                        product_id=f"{cat.upper()}_{i}",
                        retrieval_score=0.8 - (i * 0.02),
                        category=cat,
                        price=34.99,
                        popularity=0.7,
                        freshness=0.8
                    )
                )

        # Pair candidates with arbitrary descending score rankings
        scored_items = [(cand, cand.retrieval_score) for cand in candidates]

        # Apply diversity cap enforcing 35% category limit for target_size=20
        target_size = 20
        max_pct = 0.35
        
        diverse_list = enforce_diversity_cap(scored_items, max_pct=max_pct, target_size=target_size)

        # Count occurrences of each category in the output
        category_counts = {}
        for cand, _ in diverse_list:
            cat = cand.category.lower()
            category_counts[cat] = category_counts.get(cat, 0) + 1

        print("\n" + "=" * 60)
        print("          DIVERSITY CAP UNIT TEST REPORT")
        print("=" * 60)
        print(f"Total input candidates  : {len(candidates)}")
        print(f"Ladieswear input fraction: 90%")
        print(f"Target recommendation size: {target_size}")
        print(f"Final output size       : {len(diverse_list)}")
        print("-" * 60)
        for cat, count in category_counts.items():
            pct = (count / len(diverse_list)) * 100
            print(f"Category: {cat:<12} | Count: {count:<2} | Percentage: {pct:.1f}%")
            self.assertTrue(
                pct <= (max_pct * 100) + 1.0, # Allow small floating-point roundoff margin
                f"Category '{cat}' exceeded the max limit of {max_pct*100}%"
            )
        print("=" * 60 + "\n")


if __name__ == "__main__":
    unittest.main()
