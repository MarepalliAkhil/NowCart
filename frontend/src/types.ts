export interface Product {
  product_id: string;
  prod_name?: string;
  brand?: string;
  score: number;
  confidence_score?: number;
  category: string;
  sub_category?: string;
  reason: string;
  ai_badge?: {
    type: 'style' | 'trending' | 'loved' | 'outfit' | 'new';
    label: string;
  };
  price?: number;
  original_price?: number;
  rating?: number;
  reviews_count?: number;
  image_url?: string;
  gallery?: string[];
  sizes?: string[];
  colors?: string[];
  description?: string;
  in_stock?: boolean;
}

export interface BrandInfo {
  id: string;
  name: string;
  logoIcon: string;
  category: string;
  tagline: string;
  image: string;
}

export interface FeedResponse {
  user_id: string;
  correlation_id: string;
  consent: boolean;
  results: Product[];
  latency_ms: number;
}

export interface ParsedFilters {
  category?: string;
  color?: string;
  attributes?: string[];
}

export interface SearchResponse {
  query: string;
  correlation_id: string;
  route_used: string;
  estimated_cost_usd: number;
  parsed_filters: ParsedFilters;
  results: Product[];
}

export interface BundleItem {
  product_id: string;
  prod_name: string;
  category: string;
  price?: number;
  image_url?: string;
}

export interface BundleResponse {
  query_product_id: string;
  correlation_id: string;
  items: BundleItem[];
  explanation: string;
  estimated_cost_usd: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface FilterState {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  inStockOnly: boolean;
  sortBy: 'relevance' | 'price-low' | 'price-high' | 'rating';
}

export interface ServiceHealth {
  name: string;
  port: number;
  description: string;
  status: 'healthy' | 'unhealthy' | 'checking' | 'error';
  timestamp?: string;
  version?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
