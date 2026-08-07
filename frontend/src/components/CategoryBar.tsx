import React from 'react';
import { motion } from 'framer-motion';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CATEGORIES = [
  'All',
  'Women',
  'Men',
  'Kids',
  'Footwear',
  'Accessories',
  'Electronics',
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-4 mb-8">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
        return (
          <motion.button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold tracking-wider transition-all shrink-0 border ${
              isSelected
                ? 'bg-ink text-white border-ink shadow-md'
                : 'bg-white text-ink border-subtle hover:border-plum hover:text-plum'
            }`}
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
};
