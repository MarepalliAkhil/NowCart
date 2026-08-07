import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, Heart, Star, Sparkles, ArrowRightLeft, ShieldCheck, Flame, Tag, Package } from 'lucide-react';
import { Product } from '../types';
import { useNowCartStore } from '../store/useNowCartStore';

interface ProductCardProps {
  product: Product;
  onOpenModal?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenModal }) => {
  const navigate = useNavigate();
  const addToCart = useNowCartStore((state) => state.addToCart);
  const toggleWishlist = useNowCartStore((state) => state.toggleWishlist);
  const isWishlisted = useNowCartStore((state) => state.isWishlisted(product.product_id));
  const addRecentlyViewed = useNowCartStore((state) => state.addRecentlyViewed);

  const [isComparing, setIsComparing] = useState(false);

  const discountPct =
    product.original_price && product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 20;

  const handleCardClick = () => {
    addRecentlyViewed(product);
    navigate(`/product/${product.product_id}`);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addRecentlyViewed(product);
    if (onOpenModal) {
      onOpenModal(product);
    } else {
      navigate(`/product/${product.product_id}`);
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsComparing((prev) => !prev);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="group card-luxury rounded-[20px] overflow-hidden cursor-pointer flex flex-col justify-between relative h-full bg-white border border-subtle"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-bone">
        <motion.img
          src={product.image_url}
          alt={product.prod_name || product.product_id}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Muted Gold Sale Badge */}
        {discountPct > 0 && (
          <div className="absolute top-3.5 left-3.5 z-10">
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-gold text-white rounded-full shadow-sm">
              {discountPct}% OFF
            </span>
          </div>
        )}

        {/* Confidence Badge */}
        {product.confidence_score && (
          <div className="absolute bottom-3.5 left-3.5 z-10">
            <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/95 backdrop-blur text-ink rounded-full border border-subtle shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-plum" />
              {product.confidence_score}% Match
            </span>
          </div>
        )}

        {/* Wishlist Heart */}
        <motion.button
          onClick={handleWishlistClick}
          whileTap={{ scale: 0.75 }}
          animate={{ scale: isWishlisted ? [1, 1.25, 1] : 1 }}
          transition={{ duration: 0.25 }}
          className={`absolute top-3.5 right-3.5 z-10 p-2.5 rounded-full transition-colors shadow-sm ${
            isWishlisted
              ? 'bg-error text-white'
              : 'bg-white/90 hover:bg-white text-ink hover:text-error'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </motion.button>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-ink/15 backdrop-blur-[2px] z-10">
          <button
            onClick={handleQuickViewClick}
            className="flex items-center gap-2 px-4 py-2 bg-white text-ink rounded-full text-xs font-extrabold shadow-xl hover:bg-plum hover:text-white transition-all transform group-hover:scale-105"
          >
            <Eye className="w-4 h-4" /> Quick View
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-extrabold uppercase tracking-wider text-muted">
              {product.brand || 'NowCart Select'}
            </span>
            <div className="flex items-center gap-1 text-ink font-bold">
              <Star className="w-3.5 h-3.5 fill-gold text-gold shrink-0" />
              <span>{product.rating || 4.8}</span>
            </div>
          </div>

          <h3 className="font-bold text-sm text-ink group-hover:text-plum transition-colors line-clamp-1">
            {product.prod_name}
          </h3>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base font-black text-ink font-mono">
              ${product.price?.toFixed(2)}
            </span>
            {product.original_price && (
              <span className="text-xs font-medium text-muted line-through font-mono">
                ${product.original_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* AI Recommendation Badge */}
        {product.ai_badge ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-subtle bg-bone text-ink text-[11px] font-bold shadow-xs">
            {product.ai_badge.type === 'trending' && <Flame className="w-3.5 h-3.5 text-gold shrink-0" />}
            {product.ai_badge.type === 'loved' && <Star className="w-3.5 h-3.5 text-gold shrink-0" />}
            {product.ai_badge.type === 'outfit' && <Tag className="w-3.5 h-3.5 text-plum shrink-0" />}
            {product.ai_badge.type === 'new' && <Package className="w-3.5 h-3.5 text-muted shrink-0" />}
            {(!product.ai_badge.type || product.ai_badge.type === 'style') && <Sparkles className="w-3.5 h-3.5 text-plum shrink-0" />}
            <span className="truncate">{product.ai_badge.label || product.reason || 'Picked just for your style'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-plum-light text-plum border border-plum/20 rounded-2xl text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-plum shrink-0" />
            <span className="truncate">{product.reason || 'Picked just for your style'}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-subtle">
          <motion.button
            onClick={handleAddToCartClick}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2.5 bg-ink hover:bg-plum text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
          </motion.button>

          <motion.button
            onClick={handleCompareClick}
            whileTap={{ scale: 0.9 }}
            className={`p-2.5 rounded-2xl border transition-colors ${
              isComparing ? 'bg-plum-light border-plum/30 text-plum' : 'border-subtle text-muted hover:text-ink'
            }`}
            title="Compare item"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
};
