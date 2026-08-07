import logging
from typing import List, Tuple
import numpy as np
import pandas as pd
import lightgbm as lgb
from backend.services.rerank_service.models import CandidateItem, UserSessionContext

logger = logging.getLogger("nowcart.rerank.ranker")


class LightGBMReranker:
    """
    Lightweight gradient-boosted tree ranker using LightGBM.
    Scores candidates based on retrieval score, popularity, price, category match, and freshness.
    """

    def __init__(self):
        self.model = None
        self._train_initial_model()

    def _train_initial_model(self):
        """Trains a lightweight LightGBM model on synthetic click/no-click events."""
        logger.info("Initializing and training LightGBM reranking model...")

        # Generate synthetic training features:
        # F1: retrieval_score (0.0 to 1.0)
        # F2: popularity (0.0 to 1.0)
        # F3: price (5.0 to 150.0)
        # F4: category_match (0 or 1)
        # F5: freshness (0.0 to 1.0)
        size = 2000
        retrieval_score = np.random.uniform(0.1, 0.9, size)
        popularity = np.random.uniform(0.0, 1.0, size)
        price = np.random.uniform(5.0, 150.0, size)
        category_match = np.random.binomial(1, 0.3, size)
        freshness = np.random.uniform(0.1, 1.0, size)

        X = pd.DataFrame(
            {
                "retrieval_score": retrieval_score,
                "popularity": popularity,
                "price": price,
                "category_match": category_match,
                "freshness": freshness,
            }
        )

        # Labels: probability of click is higher if match is true and retrieval score is high
        prob = torch_like_sigmoid(
            (retrieval_score * 2.0)
            + (category_match * 1.5)
            + (popularity * 0.5)
            + (freshness * 0.3)
            - 2.0
        )
        y = np.random.binomial(1, prob)

        # Train a light, low-depth LightGBM model
        dataset = lgb.Dataset(X, label=y)
        params = {
            "objective": "binary",
            "metric": "auc",
            "verbosity": -1,
            "max_depth": 4,
            "num_leaves": 8,
            "learning_rate": 0.1,
            "min_data_in_leaf": 20,
        }
        self.model = lgb.train(params, dataset, num_boost_round=30)
        logger.info("LightGBM model training complete.")

    def score_candidates(
        self, candidates: List[CandidateItem], context: UserSessionContext
    ) -> List[float]:
        """
        Calculates click probabilities for candidates using LightGBM model.
        """
        if not candidates:
            return []

        recent_cats = set(c.lower() for c in context.recent_categories)

        # Construct evaluation features
        feature_list = []
        for c in candidates:
            cat_match = 1 if c.category.lower() in recent_cats else 0
            feature_list.append(
                {
                    "retrieval_score": c.retrieval_score,
                    "popularity": c.popularity,
                    "price": c.price,
                    "category_match": cat_match,
                    "freshness": c.freshness,
                }
            )

        df_eval = pd.DataFrame(feature_list)
        scores = self.model.predict(df_eval)
        return scores.tolist()


def torch_like_sigmoid(x):
    return 1 / (1 + np.exp(-x))
