import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap, Sparkles, Layers, Grid2x2, Leaf, Footprints } from 'lucide-react';
import { BrandInfo } from '../types';

export const POPULAR_BRANDS: BrandInfo[] = [
  {
    id: 'b1',
    name: 'Nike Sportswear',
    logoIcon: 'Zap',
    category: 'Athletic & Activewear',
    tagline: 'Just Do It — Precision Tech Apparel',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b2',
    name: 'Zara Woman',
    logoIcon: 'Sparkles',
    category: 'High-Street Fashion',
    tagline: 'Runway Trends & Contemporary Tailoring',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b3',
    name: "Levi's Denim",
    logoIcon: 'Layers',
    category: 'Heritage Denim',
    tagline: 'Original 501s & Crafted Truckers',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b4',
    name: 'H&M Studio',
    logoIcon: 'Grid2x2',
    category: 'Modern Essentials',
    tagline: 'Sustainable Silhouettes & Everyday Fits',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b5',
    name: 'Uniqlo Airism',
    logoIcon: 'Leaf',
    category: 'Minimalist LifeWear',
    tagline: 'Engineered Thermal Comfort & Stretch',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b6',
    name: 'Clarks Originals',
    logoIcon: 'Footprints',
    category: 'Artisan Footwear',
    tagline: 'Full-Grain Leather Chelsea Boots & Crepe Soles',
    image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80',
  },
];

const LOGO_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Zap,
  Sparkles,
  Layers,
  Grid2x2,
  Leaf,
  Footprints,
};

interface BrandGridProps {
  onSelectBrand: (brandName: string) => void;
}

export const BrandGrid: React.FC<BrandGridProps> = ({ onSelectBrand }) => {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gold-light text-gold rounded-full border border-gold/30">
            OFFICIAL STORES
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-sans mt-2">
            Popular Global Brands
          </h2>
          <p className="text-xs text-muted font-medium mt-1">
            Handpicked designer labels and official catalog storefronts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {POPULAR_BRANDS.map((brand) => {
          const LogoIcon = LOGO_ICONS[brand.logoIcon] || Sparkles;
          return (
            <motion.div
              key={brand.id}
              onClick={() => onSelectBrand(brand.name)}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="group relative h-64 rounded-[24px] overflow-hidden cursor-pointer shadow-sm border border-subtle"
            >
              <img
                src={brand.image}
                alt={brand.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

              <div className="absolute inset-0 p-6 flex flex-col justify-between text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                    <LogoIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="p-2 bg-white/20 backdrop-blur rounded-full group-hover:bg-plum transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold-light">
                    {brand.category}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1 group-hover:text-gold-light transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 line-clamp-1">{brand.tagline}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
