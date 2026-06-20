'use client';

import React from 'react';
import { useCartStore } from '../../lib/store/cartStore';

interface CartFABProps {
  onClick: () => void;
}

export const CartFAB: React.FC<CartFABProps> = ({ onClick }) => {
  const itemCount = useCartStore((state) => state.getItemCount());

  if (itemCount === 0) return null; // Only show if there are items, or maybe always show? The previous implementation had a dynamic badge.

  return (
    <div className="fixed bottom-8 right-8 z-[60] group">
      {itemCount > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-cream-silk text-cacao-black rounded-full flex items-center justify-center font-bold text-xs shadow-lg transform group-hover:scale-110 transition-transform">
          {itemCount}
        </div>
      )}
      <button 
        onClick={onClick}
        className="w-16 h-16 bg-gold-leaf text-cacao-black rounded-full shadow-2xl flex items-center justify-center gold-glow hover:scale-110 transition-all duration-300 active:scale-95"
        aria-label="Open Cart"
      >
        <span className="material-symbols-outlined text-3xl">shopping_cart</span>
      </button>
      {/* Tooltip */}
      <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-chocolate-deep border border-gold-leaf/30 px-4 py-2 rounded text-gold-leaf font-label-caps opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        View Cart
      </div>
    </div>
  );
};

export default CartFAB;
