import { FeedResponse, SearchResponse, BundleResponse, Product } from '../types';

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

export const PRODUCT_CATALOG_META: Record<
  string,
  {
    name: string;
    brand: string;
    price: number;
    original_price: number;
    rating: number;
    reviews: number;
    image: string;
    gallery: string[];
    sizes: string[];
    colors: string[];
    description: string;
    badge: { type: 'style' | 'trending' | 'loved' | 'outfit' | 'new'; label: string };
  }
> = {
  '0108775015': {
    name: 'Ribbed Contour Strap Top',
    brand: 'H&M Studio',
    price: 19.99,
    original_price: 29.99,
    rating: 4.8,
    reviews: 184,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Black', 'White', 'Beige'],
    description: 'A form-fitting contour strap top crafted from breathable organic ribbed cotton blend. Tailored for effortless everyday layering.',
    badge: { type: 'style', label: 'Picked just for your style' },
  },
  '0108775044': {
    name: 'Essential Layering Top (2-Pack)',
    brand: 'Uniqlo Airism',
    price: 29.99,
    original_price: 39.99,
    rating: 4.7,
    reviews: 96,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Heather Gray'],
    description: 'Ultra-lightweight moisture-wicking essential tops designed for thermal comfort and seamless stretch fit.',
    badge: { type: 'outfit', label: 'Complements your recent picks' },
  },
  '0110065001': {
    name: 'OP Ribbed Heavyweight T-Shirt',
    brand: 'Zara Man',
    price: 24.99,
    original_price: 34.99,
    rating: 4.9,
    reviews: 312,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Off-White', 'Black', 'Navy'],
    description: 'Constructed from 240 GSM heavy combed jersey cotton with a structured boxy vintage silhouette.',
    badge: { type: 'trending', label: 'Trending right now' },
  },
  '0110065002': {
    name: 'Slim Fit Tailored Chino Trousers',
    brand: "Levi's Premium",
    price: 49.99,
    original_price: 69.99,
    rating: 4.6,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['30x32', '32x32', '34x32', '36x32'],
    colors: ['Khaki', 'Navy', 'Olive'],
    description: 'Modern slim chinos featuring 4-way stretch flex weave cotton, reinforced pockets, and tailored ankle tapering.',
    badge: { type: 'loved', label: 'People similar to you loved this' },
  },
  '0111565001': {
    name: 'Oversized Vintage Denim Trucker Jacket',
    brand: 'Zara Denim',
    price: 79.99,
    original_price: 109.99,
    rating: 4.9,
    reviews: 428,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Washed Blue', 'Black Denim'],
    description: 'Classic trucker silhouette in 100% rigid vintage washed denim with drop shoulders and metallic button closures.',
    badge: { type: 'new', label: 'You might love this piece' },
  },
  '0111565005': {
    name: 'Floral Summer Evening Silk Dress',
    brand: 'Mango Select',
    price: 69.99,
    original_price: 99.99,
    rating: 5.0,
    reviews: 512,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Floral Print', 'Emerald Green'],
    description: 'Elegantly draped midi dress in lightweight botanical silk print, featuring an asymmetrical hem and subtle cowl neck.',
    badge: { type: 'style', label: 'Picked just for your style' },
  },
  '0112000001': {
    name: 'Artisan Leather Chelsea Boots',
    brand: 'Clarks Originals',
    price: 119.99,
    original_price: 159.99,
    rating: 4.8,
    reviews: 189,
    image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['8', '9', '10', '11'],
    colors: ['Chestnut Brown', 'Jet Black'],
    description: 'Hand-burnished full-grain leather boots with flexible elastic side goring and durable crepe rubber sole.',
    badge: { type: 'trending', label: 'Trending right now' },
  },
  '0112000008': {
    name: 'Heavyweight Canvas Utility Tote Bag',
    brand: 'Nike Sportswear',
    price: 34.99,
    original_price: 49.99,
    rating: 4.7,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    ],
    sizes: ['One Size'],
    colors: ['Natural Canvas', 'Olive Drab'],
    description: 'Reinforced 18oz duck canvas tote featuring dual shoulder straps, interior laptop sleeve, and water-resistant coating.',
    badge: { type: 'outfit', label: 'Complete your outfit' },
  },
};

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80';

export function enrichProductData(item: Product, idx: number = 0): Product {
  const meta = PRODUCT_CATALOG_META[item.product_id] || {
    name: item.prod_name || `NowCart Select ${item.product_id.slice(-4)}`,
    brand: 'NowCart Collection',
    price: item.price || 39.99,
    original_price: (item.price || 39.99) * 1.3,
    rating: 4.8,
    reviews: 140,
    image: DEFAULT_FALLBACK_IMAGE,
    gallery: [DEFAULT_FALLBACK_IMAGE],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White'],
    description: 'Premium quality apparel designed with sustainable fabrics and tailored precision.',
    badge: { type: 'style', label: 'Picked just for your style' },
  };

  const calcConfidence = Math.min(99.4, Math.max(88.0, 98.6 - idx * 1.8));

  return {
    ...item,
    prod_name: meta.name,
    brand: meta.brand,
    price: meta.price,
    original_price: meta.original_price,
    rating: meta.rating,
    reviews_count: meta.reviews,
    confidence_score: Number(calcConfidence.toFixed(1)),
    image_url: meta.image,
    gallery: meta.gallery,
    sizes: meta.sizes,
    colors: meta.colors,
    description: meta.description,
    ai_badge: meta.badge,
    in_stock: true,
  };
}

export async function fetchFeed(userId: string, consent: boolean = true, topK: number = 10): Promise<FeedResponse> {
  const res = await fetch(`${GATEWAY_URL}/feed/${userId}?consent=${consent}&top_k=${topK}`);
  if (!res.ok) {
    throw new Error(`Feed fetch failed with status ${res.status}`);
  }
  const data: FeedResponse = await res.json();
  return {
    ...data,
    results: data.results.map((item, i) => enrichProductData(item, i)),
  };
}

export async function searchProducts(query: string, consent: boolean = true, topK: number = 10): Promise<SearchResponse> {
  const res = await fetch(`${GATEWAY_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, consent, top_k: topK }),
  });
  if (!res.ok) {
    throw new Error(`Search request failed with status ${res.status}`);
  }
  const data: SearchResponse = await res.json();
  return {
    ...data,
    results: data.results.map((item, i) => enrichProductData(item, i)),
  };
}

export async function fetchBundle(productId: string): Promise<BundleResponse> {
  const res = await fetch(`${GATEWAY_URL}/bundle/${productId}`);
  if (!res.ok) {
    throw new Error(`Bundle request failed with status ${res.status}`);
  }
  const data: BundleResponse = await res.json();
  return {
    ...data,
    items: data.items.map((item) => {
      const meta = PRODUCT_CATALOG_META[item.product_id] || {
        name: item.prod_name,
        price: 39.99,
        image: DEFAULT_FALLBACK_IMAGE,
      };
      return {
        ...item,
        price: meta.price,
        image_url: meta.image,
      };
    }),
  };
}

export async function sendClickstreamEvent(userId: string, productId: string, eventType: string): Promise<void> {
  await fetch(`${GATEWAY_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, product_id: productId, event_type: eventType }),
  });
}
