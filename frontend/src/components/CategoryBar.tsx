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
            className="px-5 py-2.5 rounded-full text-xs font-extrabold tracking-wider transition-all shrink-0 border shadow-xs"
            style={
              isSelected
                ? { backgroundColor: '#6E2A3A', color: '#FFFFFF', borderColor: '#6E2A3A' }
                : { backgroundColor: '#FFFFFF', color: '#1C1B19', borderColor: '#E7E2DB' }
            }
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
};
