import math
from typing import List, Tuple, Dict, Any
from backend.services.rerank_service.models import CandidateItem

def enforce_diversity_cap(
    scored_items: List[Tuple[CandidateItem, float]], 
    max_pct: float = 0.35,
    target_size: int = 20
) -> List[Tuple[CandidateItem, float]]:
    """
    Deterministic greedy re-ranking post-processing.
    Enforces that no single product category exceeds 35% of the final output list.
    Discards items that violate the cap.
    """
    if not scored_items:
        return []

    # Sort candidates by score descending
    sorted_candidates = sorted(scored_items, key=lambda x: x[1], reverse=True)
    
    # Adjust target size if input is smaller
    actual_target = min(len(scored_items), target_size)
    if actual_target == 0:
        return []
        
    selected: List[Tuple[CandidateItem, float]] = []
    category_counts: Dict[str, int] = {}
    
    # Calculate absolute maximum allowed items per category
    # max_allowed = floor(max_pct * actual_target)
    # Guarantee at least 1 item for very small lists
    max_allowed = max(1, math.floor(max_pct * actual_target))
    
    for item, score in sorted_candidates:
        if len(selected) >= actual_target:
            break
            
        cat = item.category.lower()
        count = category_counts.get(cat, 0)
        
        if count < max_allowed:
            selected.append((item, score))
            category_counts[cat] = count + 1
            
    return selected
