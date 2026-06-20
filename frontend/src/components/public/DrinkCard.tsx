'use client';

import React, { useState } from 'react';
import { useCartStore } from '../../lib/store/cartStore';
import { useToast } from '../../context/ToastContext';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  tag: string;
  small_price: number;
  big_price: number;
  image_url?: string;
  image_path?: string;
}

interface DrinkCardProps {
  product: Product;
}

export const DrinkCard: React.FC<DrinkCardProps> = ({ product }) => {
  const [size, setSize] = useState<'small' | 'big'>('small');
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();

  const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
  const price = size === 'small' ? product.small_price : product.big_price;
  const image = product.image_path 
    ? `${BACKEND_URL}${product.image_path}` 
    : (product.image_url || 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=400');

  const handleAddToOrder = () => {
    addItem({
      id: product.id,
      name: product.name,
      size: size,
      price: price,
    });
    
    showToast(`Added ${product.name} (${size.toUpperCase()}) to cart!`, 'success');
  };

  return (
    <div className="glass-card rounded-lg overflow-hidden group flex flex-col border border-gold-leaf/10 shadow-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
      <div className="aspect-square relative overflow-hidden">
        <img 
          alt={product.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
          src={image}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cacao-black/90 via-transparent to-transparent"></div>
        {product.tag && (
          <div className="absolute top-4 left-4 bg-cacao-black/60 backdrop-blur px-3 py-1 font-label-caps text-[10px] text-cream-silk border border-gold-leaf/20 uppercase tracking-widest">
            {product.tag}
          </div>
        )}
        <div className="absolute bottom-6 left-6 right-6">
          <h3 className="font-headline-sm text-cream-silk mb-1">{product.name}</h3>
          <span className="font-label-caps text-gold-leaf">₦{price.toLocaleString()}</span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow justify-between gap-6">
        <p className="font-body-md text-on-surface-variant text-sm line-clamp-3">
          {product.description}
        </p>
        
        <div>
          <div className="flex gap-2 mb-4 bg-cacao-black/50 p-1 rounded border border-gold-leaf/20">
            <button
              onClick={() => setSize('small')}
              className={`flex-1 py-1.5 font-label-caps text-[10px] transition-colors rounded ${size === 'small' ? 'bg-gold-leaf text-cacao-black' : 'text-cream-silk/60 hover:text-cream-silk'}`}
            >
              Small
            </button>
            <button
              onClick={() => setSize('big')}
              className={`flex-1 py-1.5 font-label-caps text-[10px] transition-colors rounded ${size === 'big' ? 'bg-gold-leaf text-cacao-black' : 'text-cream-silk/60 hover:text-cream-silk'}`}
            >
              Large
            </button>
          </div>
          <button 
            onClick={handleAddToOrder} 
            className="w-full py-3 bg-transparent border border-gold-leaf/30 text-gold-leaf font-label-caps hover:bg-gold-leaf hover:text-cacao-black transition-all rounded"
          >
            Add to Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrinkCard;
