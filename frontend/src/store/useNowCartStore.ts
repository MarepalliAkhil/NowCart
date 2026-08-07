import { create } from 'zustand';
import { Product, CartItem } from '../types';
import { MOCK_PRODUCTS } from '../data/productsData';

interface AiSessionState {
  sessionIntent: string;
  retrievalCandidates: number;
  rerankScore: number;
  isColdStart: boolean;
  latencyMs: number;
  topRagExplanation: string;
  dpdpConsent: boolean;
}

interface NowCartStore {
  // Catalog & Products
  products: Product[];
  
  // Cart State & Actions
  cart: CartItem[];
  addToCart: (product: Product, size?: string, color?: string, qty?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Wishlist State & Actions
  wishlistIds: Set<string>;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;

  // Recently Viewed State & Actions
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;

  // AI Session & Dev Panel State
  aiSession: AiSessionState;
  isDevPanelOpen: boolean;
  toggleDevPanel: () => void;
  toggleColdStart: () => void;
  toggleDpdpConsent: () => void;

  // Live Intent Update Helpers
  updateSessionIntent: (intent: string, candidates?: number, score?: number, explanation?: string) => void;
}

export const useNowCartStore = create<NowCartStore>((set, get) => ({
  products: MOCK_PRODUCTS,

  // --------------------------------------------------
  // CART STATE & ACTIONS
  // --------------------------------------------------
  cart: [],

  addToCart: (product, size = 'M', color = 'Default', qty = 1) => {
    set((state) => {
      const existingIndex = state.cart.findIndex((item) => item.product.product_id === product.product_id);
      if (existingIndex > -1) {
        const updated = [...state.cart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return { cart: updated };
      }
      return {
        cart: [...state.cart, { product, quantity: qty, selectedSize: size, selectedColor: color }],
      };
    });

    // Auto-update AI Session Intent on Cart additions
    const explanation = `Selected "${product.prod_name}" by ${product.brand || 'NowCart'} for cart. Re-ranking personalized recommendations in ${product.category}.`;
    get().updateSessionIntent(
      `Intent Shift: Added ${product.prod_name} to cart`,
      480,
      0.965,
      explanation
    );
  },

  updateCartQuantity: (productId, quantity) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.product_id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.product_id !== productId),
    }));
  },

  clearCart: () => set({ cart: [] }),

  // --------------------------------------------------
  // WISHLIST STATE & ACTIONS
  // --------------------------------------------------
  wishlistIds: new Set<string>(['W001', 'M001', 'F001']),

  toggleWishlist: (product) => {
    set((state) => {
      const next = new Set(state.wishlistIds);
      if (next.has(product.product_id)) {
        next.delete(product.product_id);
      } else {
        next.add(product.product_id);
      }
      return { wishlistIds: next };
    });
  },

  isWishlisted: (productId) => get().wishlistIds.has(productId),

  // --------------------------------------------------
  // RECENTLY VIEWED
  // --------------------------------------------------
  recentlyViewed: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[10], MOCK_PRODUCTS[30]],

  addRecentlyViewed: (product) => {
    set((state) => {
      const filtered = state.recentlyViewed.filter((p) => p.product_id !== product.product_id);
      return { recentlyViewed: [product, ...filtered].slice(0, 8) };
    });

    const explanation = `Shopper inspecting "${product.prod_name}" by ${product.brand || 'NowCart'}. Candidates aligned for ${product.category}.`;
    get().updateSessionIntent(
      `Browsing: ${product.category} — ${product.prod_name}`,
      460,
      product.score || 0.94,
      explanation
    );
  },

  // --------------------------------------------------
  // AI SESSION & DEV PANEL
  // --------------------------------------------------
  aiSession: {
    sessionIntent: 'Browsing: Casual Summer Wear & Silk Dresses',
    retrievalCandidates: 480,
    rerankScore: 0.962,
    isColdStart: false,
    latencyMs: 14.2,
    topRagExplanation: 'To style the Floral Summer Dress, we paired it with canvas utility tote bag and Chelsea boots from our complementary product graph.',
    dpdpConsent: true,
  },

  isDevPanelOpen: false,

  toggleDevPanel: () => set((state) => ({ isDevPanelOpen: !state.isDevPanelOpen })),

  toggleColdStart: () =>
    set((state) => ({
      aiSession: { ...state.aiSession, isColdStart: !state.aiSession.isColdStart },
    })),

  toggleDpdpConsent: () =>
    set((state) => ({
      aiSession: { ...state.aiSession, dpdpConsent: !state.aiSession.dpdpConsent },
    })),


  updateSessionIntent: (intent, candidates = 480, score = 0.95, explanation) => {
    const randomLatency = Number((11.5 + Math.random() * 4.5).toFixed(1));
    set((state) => ({
      aiSession: {
        ...state.aiSession,
        sessionIntent: intent,
        retrievalCandidates: candidates,
        rerankScore: score,
        latencyMs: randomLatency,
        topRagExplanation: explanation || state.aiSession.topRagExplanation,
      },
    }));
  },
}));
