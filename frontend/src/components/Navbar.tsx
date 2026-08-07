import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Bell, Cpu, Sparkles, X, ArrowRight, Flame, History, ChevronDown } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const products = useNowCartStore((state) => state.products);
  const cart = useNowCartStore((state) => state.cart);
  const wishlistIds = useNowCartStore((state) => state.wishlistIds);
  const toggleDevPanel = useNowCartStore((state) => state.toggleDevPanel);
  const updateSessionIntent = useNowCartStore((state) => state.updateSessionIntent);

  const [searchInput, setSearchInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistIds.size;

  const categories = [
    { name: 'Women', desc: 'Silk Dresses, Tops & Skirts' },
    { name: 'Men', desc: 'Chinos, Denim Jackets & Shirts' },
    { name: 'Kids', desc: 'Overalls, Sweaters & Active Sets' },
    { name: 'Footwear', desc: 'Chelsea Boots, Air Max & Sneakers' },
    { name: 'Accessories', desc: 'Utility Totes, Wallets & Watches' },
    { name: 'Electronics', desc: 'AirPods Max, Smartwatches & Gear' },
  ];

  const recentSearches = ['floral dress', 'chino trousers', 'denim jacket', 'boots'];
  const trendingSearches = ['Summer Silk Dress', 'Leather Chelsea Boots', 'Canvas Utility Tote', 'AirPods Max'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      updateSessionIntent(`Search: "${searchInput.trim()}"`, 450, 0.945, `Search query "${searchInput.trim()}" parsed using complexity router.`);
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    setSearchInput(query);
    updateSessionIntent(`Search: "${query}"`, 450, 0.945, `Search query "${query}" selected from suggestions.`);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setIsSearchOpen(false);
  };

  const handleSelectCategory = (catName: string) => {
    updateSessionIntent(`Browsing Category: ${catName}`, 420, 0.930, `Category list filtered for ${catName}.`);
    navigate(`/category/${encodeURIComponent(catName)}`);
    setIsCategoryOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 bg-bone border-b border-subtle h-[80px] flex items-center transition-shadow duration-200 ${isScrolled ? 'shadow-sm' : 'shadow-none'}`}>
      <div className="max-content-width w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-full">
          
          {/* Logo & Category Links */}
          <div className="flex items-center gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center text-white group-hover:bg-plum transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-ink font-sans">
                  Now<span className="text-plum">Cart</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gold-light text-gold rounded-full border border-gold/30">
                  AI Live
                </span>
              </div>
            </Link>

            <div ref={categoryRef} className="relative hidden xl:block">
              <button
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ink hover:text-plum transition-colors py-2"
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>

              <AnimatePresence>
                {isCategoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white border border-subtle rounded-3xl shadow-2xl p-3 z-50 space-y-1"
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleSelectCategory(cat.name)}
                        className="w-full text-left p-3 hover:bg-plum-light/50 rounded-2xl transition-colors group"
                      >
                        <div className="text-xs font-bold text-ink group-hover:text-plum">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">{cat.desc}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search products, brands, or natural queries (e.g., 'summer silk dress')..."
                  value={searchInput}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border border-subtle rounded-full text-xs font-medium text-ink placeholder-muted focus:outline-none focus:border-plum focus:ring-1 focus:ring-plum/20 transition-all"
                />
                <Search className="w-4 h-4 text-muted absolute left-4" />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-3.5 text-muted hover:text-ink"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-subtle rounded-3xl shadow-2xl p-6 z-50 space-y-4"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                      <History className="w-3.5 h-3.5 text-muted" /> Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestionClick(s)}
                          className="px-3 py-1.5 bg-bone hover:bg-plum-light hover:text-plum text-ink text-xs font-semibold rounded-full transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                      <Flame className="w-3.5 h-3.5 text-gold" /> Trending Right Now
                    </div>
                    <div className="space-y-1">
                      {trendingSearches.map((t) => (
                        <button
                          key={t}
                          onClick={() => handleSuggestionClick(t)}
                          className="w-full text-left px-3 py-2 text-xs text-ink font-medium hover:bg-bone hover:text-plum rounded-xl flex items-center justify-between transition-colors"
                        >
                          <span>{t}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {products.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                        Suggested Catalog Items
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {products.slice(0, 2).map((p) => (
                          <div
                            key={p.product_id}
                            onClick={() => {
                              navigate(`/product/${p.product_id}`);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center gap-2.5 p-2 bg-bone hover:bg-plum-light/50 rounded-xl cursor-pointer transition-colors"
                          >
                            <img src={p.image_url} alt={p.prod_name} className="w-10 h-10 object-cover rounded-lg" />
                            <div className="overflow-hidden">
                              <h5 className="text-[11px] font-bold text-ink truncate">{p.prod_name}</h5>
                              <span className="text-[10px] font-bold text-plum">${p.price?.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.button
              onClick={toggleDevPanel}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-plum-light hover:bg-plum-light/80 text-plum border border-plum/20 rounded-full text-xs font-extrabold transition-all shadow-sm"
              title="Open Live AI Reasoning Panel"
            >
              <Cpu className="w-4 h-4 text-plum animate-pulse" />
              <span>AI Panel</span>
            </motion.button>

            <Link to="/wishlist">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="p-2.5 text-ink hover:text-error hover:bg-bone rounded-full relative transition-colors"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white rounded-full text-[10px] font-black flex items-center justify-center shadow">
                    {wishlistCount}
                  </span>
                )}
              </motion.div>
            </Link>

            <div className="p-2.5 text-ink hover:text-plum hover:bg-bone rounded-full relative transition-colors hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-plum rounded-full" />
            </div>

            <Link to="/cart">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="p-2.5 text-ink hover:text-plum hover:bg-bone rounded-full relative transition-colors"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    className="absolute top-1 right-1 w-4 h-4 bg-plum text-white rounded-full text-[10px] font-black flex items-center justify-center shadow"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </motion.div>
            </Link>

            <div className="w-9 h-9 rounded-full bg-ink text-white font-extrabold text-xs flex items-center justify-center shadow-md cursor-pointer">
              NC
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
