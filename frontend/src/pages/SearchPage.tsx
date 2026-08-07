import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { Product } from '../types';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const products = useNowCartStore((state) => state.products);

  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);

  const brands = ['All', 'Zara Woman', 'Zara Denim', 'Zara Man', 'H&M Studio', 'Uniqlo Airism', "Levi's Premium", 'Nike Sportswear', 'Clarks Originals', 'Apple'];
  const categoriesList = ['All', 'Women', 'Men', 'Kids', 'Footwear', 'Accessories', 'Electronics'];

  // Step 1: Filter active catalog based on search query, category, brand, and max price
  let filtered = products.filter((p) => {
    if (query) {
      const qLower = query.toLowerCase();
      const matchName = p.prod_name?.toLowerCase().includes(qLower);
      const matchBrand = p.brand?.toLowerCase().includes(qLower);
      const matchCategory = p.category.toLowerCase().includes(qLower);
      const matchDesc = p.description?.toLowerCase().includes(qLower);
      if (!matchName && !matchBrand && !matchCategory && !matchDesc) return false;
    }
    if (selectedCategoryFilter !== 'All' && p.category !== selectedCategoryFilter) return false;
    if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;
    if ((p.price || 0) > maxPrice) return false;
    return true;
  });

  if (filtered.length === 0) {
    filtered = products.slice(0, 8);
  }

  // Step 2: In-memory sort on the filtered list creating a new array copy
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === 'price-high') {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'newest') {
      return b.product_id.localeCompare(a.product_id);
    }
    // Default: Popularity / Recommendation score
    const scoreA = a.confidence_score || a.score || 0;
    const scoreB = b.confidence_score || b.score || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-8 animate-fade-in py-4">
      
      <div className="bg-white border border-subtle rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-plum" />
            <h1 className="text-xl font-black text-ink font-sans">
              {query ? `Search Results for "${query}"` : 'Explore All Catalog Items'}
            </h1>
          </div>

          {query && (
            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-1 text-xs text-plum font-bold hover:underline"
            >
              <X className="w-4 h-4" /> Clear Search Query
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mt-4 text-xs font-semibold">
          <span className="text-muted">Query Router:</span>
          <span className="px-3 py-1 bg-plum-light text-plum border border-plum/20 rounded-full font-mono font-bold">
            {query.split(' ').length <= 3 ? 'cheap_rule_based' : 'llm_query_understanding'}
          </span>

          <span className="text-muted ml-2">Parsing Cost:</span>
          <span className="px-3 py-1 bg-gold-light text-gold border border-gold/30 rounded-full font-mono font-bold">
            ${query.split(' ').length <= 3 ? '0.00000' : '0.00018'} USD
          </span>

          {selectedBrand !== 'All' && (
            <span className="px-3 py-1 bg-ink text-white rounded-full flex items-center gap-1">
              Brand: {selectedBrand}
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedBrand('All')} />
            </span>
          )}

          {selectedCategoryFilter !== 'All' && (
            <span className="px-3 py-1 bg-plum text-white rounded-full flex items-center gap-1">
              Category: {selectedCategoryFilter}
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedCategoryFilter('All')} />
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-6 shrink-0">
          <div className="bg-white border border-subtle rounded-3xl p-6 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <h3 className="font-extrabold text-sm text-ink flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-plum" /> Filters
              </h3>
              <button
                onClick={() => {
                  setSelectedBrand('All');
                  setSelectedCategoryFilter('All');
                  setMaxPrice(200);
                }}
                className="text-xs text-plum font-bold hover:underline"
              >
                Reset
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">Category</label>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full bg-bone border border-subtle text-ink text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
              >
                {categoriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Max Price: <span className="font-mono text-plum font-extrabold">${maxPrice}</span>
              </label>
              <input
                type="range"
                min="15"
                max="600"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-plum"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">Brand</label>
              <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      selectedBrand === b
                        ? 'bg-plum-light text-plum font-bold border border-plum/20'
                        : 'text-muted hover:bg-bone'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Results Grid with Styled In-Memory Sort Dropdown */}
        <main className="flex-1 space-y-6">
          <div className="flex items-center justify-between bg-white border border-subtle rounded-2xl px-5 py-3 shadow-sm text-xs font-semibold text-ink">
            <span>Showing <strong>{sorted.length}</strong> items</span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
              <span>Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-bone border border-subtle text-ink font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-plum focus:ring-1 focus:ring-plum/20 transition-all cursor-pointer"
              >
                <option value="popularity">Popularity (Default)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sorted.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onOpenModal={(p) => setSelectedModalProduct(p)}
              />
            ))}
          </div>

        </main>
      </div>

      <ProductModal
        product={selectedModalProduct}
        onClose={() => setSelectedModalProduct(null)}
      />
    </div>
  );
};
