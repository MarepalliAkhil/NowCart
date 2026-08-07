import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Tag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.product.price || 39.99) * item.quantity, 0);
  const discountAmount = couponApplied ? subtotal * 0.1 : 0;
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 || items.length === 0 ? 0 : 5.99;
  const total = Math.max(0, subtotal - discountAmount + tax + shipping);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'NOWCART10') {
      setCouponApplied(true);
    } else {
      alert('Invalid coupon code. Try using NOWCART10 for 10% off!');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 font-sans">Shopping Cart</h3>
                  <p className="text-xs text-gray-400 font-medium">{items.length} unique items</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-gray-300" />
                  <p className="text-sm font-semibold">Your shopping cart is empty.</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.product.product_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl"
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.prod_name}
                      className="w-16 h-16 object-cover rounded-xl shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.product.prod_name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Size: {item.selectedSize || 'M'} | Color: {item.selectedColor || 'Black'}
                      </p>
                      <span className="text-xs font-black text-blue-600 font-mono mt-1 block">
                        ${(item.product.price || 39.99).toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-200">
                      <button
                        onClick={() => onUpdateQuantity(item.product.product_id, Math.max(1, item.quantity - 1))}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900 px-1"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold font-mono text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.product_id, item.quantity + 1)}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900 px-1"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.product_id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Summary & Coupon */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. NOWCART10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl uppercase font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                    <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold"
                  >
                    Apply
                  </button>
                </form>

                {couponApplied && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 10% Discount Applied! Saved ${discountAmount.toFixed(2)}
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-gray-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>

                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Savings</span>
                      <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Estimated Shipping</span>
                    <span className="font-mono">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black text-gray-900">
                    <span>Total</span>
                    <span className="font-mono text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                <motion.button
                  onClick={onCheckout}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-102"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
