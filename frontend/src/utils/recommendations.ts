import { Product, CartItem } from '../types';

export interface RecommendedItem {
  product: Product;
  reason: string;
  pairedWithItem: Product;
}

// Sub-category complementary mapping rules for deterministic styling & tech pairings
const STYLING_COMPLEMENTS_MAP: Record<string, string[]> = {
  // Fashion - Women
  'Dresses': ['Footwear', 'Accessories', 'Outerwear', 'Bags'],
  'Tops': ['Trousers', 'Skirts', 'Outerwear', 'Accessories', 'Footwear'],
  'Trousers': ['Tops', 'Footwear', 'Belts', 'Accessories'],
  'Outerwear': ['Tops', 'Trousers', 'Footwear', 'Accessories'],

  // Fashion - Men
  'Shirts': ['Chinos', 'Footwear', 'Jackets', 'Accessories'],
  'Chinos': ['Shirts', 'Footwear', 'Belts', 'Accessories'],
  'Jackets': ['Shirts', 'Footwear', 'Trousers'],

  // Footwear & Accessories
  'Boots': ['Dresses', 'Trousers', 'Outerwear', 'Bags'],
  'Sneakers': ['T-Shirts', 'Jeans', 'Hoodies', 'Bags'],
  'Bags': ['Dresses', 'Tops', 'Outerwear', 'Footwear'],
  'Belts': ['Trousers', 'Chinos', 'Shirts'],

  // Electronics & Tech Complements
  'Chargers': ['Cables', 'Cases', 'Electronics', 'Accessories'],
  'Audio': ['Cases', 'Chargers', 'Cables', 'Electronics'],
  'Cases': ['Chargers', 'Audio', 'Cables', 'Electronics'],
  'Cables': ['Chargers', 'Audio', 'Electronics'],
  'Gadgets': ['Chargers', 'Cables', 'Electronics'],
};

// Fallback category complements if sub_category is unmapped
const CATEGORY_COMPLEMENTS_MAP: Record<string, string[]> = {
  Women: ['Footwear', 'Accessories'],
  Men: ['Footwear', 'Accessories'],
  Footwear: ['Accessories', 'Women', 'Men'],
  Accessories: ['Women', 'Men', 'Footwear'],
  Electronics: ['Electronics', 'Accessories'],
  Kids: ['Footwear', 'Accessories'],
};

/**
 * Deterministic recommendation engine matching cart items to complementary products.
 * - Uses sub_category / style tags to find genuine styling & tech complements.
 * - Recency-weighted: Most recently added cart item drives primary recommendations;
 *   second-most-recent cart item fills secondary recommendation slots.
 * - Strictly excludes any item already in cart.
 * - No duplicates within the returned recommendation list.
 * - Generates explicit, two-sided explainability reason strings:
 *   e.g. "${recommended.prod_name} pairs well with your ${cartItem.prod_name}"
 */
export function getCartCrossSellRecommendations(
  cart: CartItem[],
  allProducts: Product[],
  limit: number = 6
): RecommendedItem[] {
  if (!cart || cart.length === 0 || !allProducts || allProducts.length === 0) {
    return [];
  }

  const cartProductIds = new Set(cart.map((item) => item.product.product_id));
  const availableProducts = allProducts.filter((p) => !cartProductIds.has(p.product_id));

  // Recency order: most recently added cart item is last in cart array -> reverse it
  const recentCartItems = [...cart].reverse().map((item) => item.product);

  const primaryCartItem = recentCartItems[0];
  const secondaryCartItem = recentCartItems.length > 1 ? recentCartItems[1] : null;

  const results: RecommendedItem[] = [];
  const selectedProductIds = new Set<string>();

  const getTargetCategories = (item: Product): string[] => {
    if (item.sub_category && STYLING_COMPLEMENTS_MAP[item.sub_category]) {
      return STYLING_COMPLEMENTS_MAP[item.sub_category];
    }
    return CATEGORY_COMPLEMENTS_MAP[item.category] || ['Accessories', 'Footwear'];
  };

  const addComplementsForCartItem = (cartItem: Product, maxCount: number) => {
    const targetComplements = getTargetCategories(cartItem);

    // Deterministic ranking: score candidates based on complement match rank, rating, and ID
    const rankedCandidates = availableProducts
      .filter((p) => !selectedProductIds.has(p.product_id))
      .map((p) => {
        let matchScore = 0;

        // Sub-category or top-level category match
        if (p.sub_category && targetComplements.includes(p.sub_category)) {
          matchScore += 100 - targetComplements.indexOf(p.sub_category) * 15;
        } else if (targetComplements.includes(p.category)) {
          matchScore += 60 - targetComplements.indexOf(p.category) * 10;
        }

        // Add rating tiebreaker
        matchScore += (p.rating || 4.5) * 2;

        return { product: p, score: matchScore };
      })
      .filter((item) => item.score > 10)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.product.product_id.localeCompare(b.product.product_id); // Deterministic tiebreaker
      });

    let added = 0;
    for (const { product: candidate } of rankedCandidates) {
      if (added >= maxCount) break;

      selectedProductIds.add(candidate.product_id);

      const cartName = cartItem.prod_name || cartItem.category;
      const recName = candidate.prod_name || candidate.category;

      const reason = `${recName} pairs well with your ${cartName}`;

      results.push({
        product: candidate,
        reason,
        pairedWithItem: cartItem,
      });

      added++;
    }
  };

  // Primary cart item complements
  if (primaryCartItem) {
    const primaryQuota = secondaryCartItem ? Math.ceil(limit * 0.6) : limit;
    addComplementsForCartItem(primaryCartItem, primaryQuota);
  }

  // Secondary cart item complements (if multiple items in cart)
  if (secondaryCartItem && results.length < limit) {
    addComplementsForCartItem(secondaryCartItem, limit - results.length);
  }

  return results.slice(0, limit);
}
