import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products: Product[];
  onOpenModal?: (p: Product) => void;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  subtitle,
  badge,
  products,
  onOpenModal,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="mb-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 rounded-full">
                {badge}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-sans">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs text-gray-500 font-medium mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-full text-gray-700 shadow-sm transition-colors"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-full text-gray-700 shadow-sm transition-colors"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-stretch gap-6 overflow-x-auto no-scrollbar py-2 -mx-2 px-2"
      >
        {products.map((product) => (
          <div key={product.product_id} className="w-[260px] sm:w-[280px] shrink-0">
            <ProductCard
              product={product}
              onOpenModal={onOpenModal}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
