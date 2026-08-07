import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { CategoryBar } from '../components/CategoryBar';
import { Product } from '../types';

export const CategoryPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const categoryName = name ? decodeURIComponent(name) : 'Women';

  const products = useNowCartStore((state) => state.products);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);

  const categoryProducts = products.filter(
    (p) => p.category.toLowerCase() === categoryName.toLowerCase()
  );

  let filtered = categoryProducts.filter((p) => {
    if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;
    if ((p.price || 0) > maxPrice) return false;
    return true;
  });

  if (filtered.length === 0) {
    filtered = categoryProducts;
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

  const brands = ['All', ...Array.from(new Set(categoryProducts.map((p) => p.brand || 'NowCart')))];

  return (
    <div className="space-y-8 py-4 animate-fade-in">
      
      <CategoryBar
        selectedCategory={categoryName}
        onSelectCategory={(cat) => (window.location.href = `/category/${encodeURIComponent(cat)}`)}
      />

      <div className="bg-white border border-subtle rounded-3xl p-8 shadow-sm">
        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-plum-light text-plum rounded-full border border-plum/20">
          CATEGORY STOREFRONT
        </span>
        <h1 className="text-3xl font-black text-ink tracking-tight font-sans mt-2">
          {categoryName} Collection
        </h1>
        <p className="text-xs text-muted font-medium mt-1">
          Showing {sorted.length} curated pieces ranked for your style
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        <aside className="w-full lg:w-64 space-y-6 shrink-0">
          <div className="bg-white border border-subtle rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <h3 className="font-extrabold text-sm text-ink flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-plum" /> Category Filters
              </h3>
              <button
                onClick={() => {
                  setSelectedBrand('All');
                  setMaxPrice(200);
                }}
                className="text-xs text-plum font-bold hover:underline"
              >
                Reset
              </button>
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
              <div className="space-y-1">
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
