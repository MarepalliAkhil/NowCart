import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, Star } from 'lucide-react';
import { Product } from '../types';
import { useNowCartStore } from '../store/useNowCartStore';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  userId?: string;
  onAddToCart?: (p: Product, size?: string, color?: string, qty?: number) => void;
  onToggleWishlist?: (p: Product) => void;
  isWishlisted?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
}) => {
  const storeAddToCart = useNowCartStore((state) => state.addToCart);
  const storeToggleWishlist = useNowCartStore((state) => state.toggleWishlist);
  const storeIsWishlisted = useNowCartStore((state) => (product ? state.isWishlisted(product.product_id) : false));

  if (!product) return null;

  const handleAddToCart = () => {
    storeAddToCart(product, 'M', 'Black', 1);
    onClose();
  };

  const handleToggleWishlist = () => {
    storeToggleWishlist(product);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative z-10 w-full max-w-4xl bg-white border border-subtle rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 bg-bone hover:bg-subtle text-ink rounded-full transition-colors"
            title="Close quick view"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-bone border border-subtle relative">
              <img
                src={product.image_url}
                alt={product.prod_name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 px-3 py-1 bg-white/95 backdrop-blur text-plum text-[10px] font-mono font-bold rounded-full border border-subtle shadow-xs">
                {product.confidence_score}% Match
              </span>
            </div>

            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-plum tracking-wider">
                  {product.brand || 'NowCart'}
                </span>
                <h2 className="text-2xl font-black text-ink font-sans">{product.prod_name}</h2>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-ink text-xs font-bold">
                    <Star className="w-4 h-4 fill-gold text-gold shrink-0" />
                    <span>{product.rating || 4.8}</span>
                  </div>
                  <span className="text-subtle">&bull;</span>
                  <span className="text-xs text-muted font-medium">{product.reviews_count || 120} verified reviews</span>
                </div>

                <div className="p-4 bg-bone rounded-2xl border border-subtle flex items-baseline gap-3">
                  <span className="text-2xl font-black text-ink font-mono">${product.price?.toFixed(2)}</span>
                  {product.original_price && (
                    <span className="text-xs text-muted line-through font-mono">${product.original_price.toFixed(2)}</span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed">{product.description}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-subtle">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 bg-plum hover:bg-plum-hover text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-plum/20 transition-all hover:scale-102"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      storeIsWishlisted ? 'bg-rose-50 border-rose-200 text-error' : 'border-subtle text-ink hover:bg-bone'
                    }`}
                    title={storeIsWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${storeIsWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
