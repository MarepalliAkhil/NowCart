import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products: Product[];
  onOpenModal: (p: Product) => void;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  subtitle,
  badge,
  products,
  onOpenModal,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-plum-light text-plum rounded-full border border-plum/20">
                {badge}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-sans">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs text-muted font-medium mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-3 rounded-full border transition-all shadow-sm ${
              canScrollLeft
                ? 'bg-white border-subtle hover:bg-plum-light hover:text-plum text-ink shadow-sm cursor-pointer'
                : 'bg-bone border-subtle text-muted cursor-not-allowed opacity-50'
            }`}
            title="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-3 rounded-full border transition-all shadow-sm ${
              canScrollRight
                ? 'bg-white border-subtle hover:bg-plum-light hover:text-plum text-ink shadow-sm cursor-pointer'
                : 'bg-bone border-subtle text-muted cursor-not-allowed opacity-50'
            }`}
            title="Scroll Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-stretch gap-6 overflow-x-auto no-scrollbar py-3 -mx-2 px-2"
      >
        {products.map((product) => (
          <div key={product.product_id} className="w-[280px] sm:w-[300px] shrink-0">
            <ProductCard product={product} onOpenModal={onOpenModal} />
          </div>
        ))}
      </div>
    </section>
  );
};
