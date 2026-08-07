import re
from typing import Tuple
from backend.services.search_service.models import ParsedFilters

# Dictionary of common colors and categories in our catalog
COLORS = ["black", "white", "navy", "blue", "red", "yellow", "pink", "beige", "brown", "natural"]
CATEGORIES = ["top", "t-shirt", "trousers", "jacket", "dress", "boots", "bag", "chino", "shirt", "jersey"]
ATTRIBUTES = ["slim", "oversized", "floral", "denim", "leather", "canvas", "summer", "wedding", "formal"]


class QueryParser:
    """
    Query Parser that routes queries by complexity:
    - Simple queries (<= 3 words) -> Cheap Rule-Based Parser.
    - Complex queries (> 3 words) -> Complex Semantics Model / Simulated LLM.
    """

    def parse(self, query: str) -> Tuple[ParsedFilters, str, float]:
        query_clean = query.strip().lower()
        words = query_clean.split()

        if len(words) <= 3:
            # Route: Cheap Rule-Based Parser
            filters, cost = self._parse_rule_based(query_clean)
            return filters, "cheap_rule_based", cost
        else:
            # Route: Complex Semantics Model / Simulated LLM
            filters, cost = self._parse_llm_based(query_clean)
            return filters, "llm_query_understanding", cost

    def _parse_rule_based(self, query: str) -> Tuple[ParsedFilters, float]:
        extracted_color = None
        extracted_category = None
        extracted_attrs = []

        # Simple keyword matching
        for color in COLORS:
            if re.search(r"\b" + color + r"\b", query):
                extracted_color = color
                break

        for cat in CATEGORIES:
            if re.search(r"\b" + cat + r"\b", query):
                extracted_category = cat
                break

        for attr in ATTRIBUTES:
            if re.search(r"\b" + attr + r"\b", query):
                extracted_attrs.append(attr)

        filters = ParsedFilters(
            category=extracted_category,
            color=extracted_color,
            attributes=extracted_attrs,
        )
        # Cost is exactly $0 for cheap local parsing
        return filters, 0.00000

    def _parse_llm_based(self, query: str) -> Tuple[ParsedFilters, float]:
        # Simulates a lightweight LLM call or structural semantic parser
        extracted_color = None
        extracted_category = None
        extracted_attrs = []

        # 1. Identify color
        for color in COLORS:
            if color in query:
                extracted_color = color
                break

        # 2. Identify category
        for cat in CATEGORIES:
            if cat in query:
                extracted_category = cat
                break

        # 3. Identify attributes (like 'summer', 'wedding', 'formal')
        for attr in ATTRIBUTES:
            if attr in query:
                extracted_attrs.append(attr)

        # Handle complex queries like "dress for a summer wedding" -> extract wedding/summer context
        if "wedding" in query or "party" in query:
            extracted_attrs.append("formal")
        if "summer" in query or "beach" in query:
            extracted_attrs.append("summer")

        filters = ParsedFilters(
            category=extracted_category,
            color=extracted_color,
            attributes=list(set(extracted_attrs)),
        )

        # Estimated cost for a small LLM call:
        # e.g., 60 input tokens, 20 output tokens on a model costing $1.5/M input and $4.5/M output
        # Cost = (60 * 1.5e-6) + (20 * 4.5e-6) = 0.00009 + 0.00009 = 0.00018 USD
        estimated_cost = 0.00018
        return filters, estimated_cost
