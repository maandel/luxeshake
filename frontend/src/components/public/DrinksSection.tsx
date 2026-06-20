'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DrinkCard } from './DrinkCard';
import { api } from '../../lib/api';

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

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Chocolate Milkshake',
    description: 'Indulge in our rich, velvety chocolate milkshake topped with fresh whipped cream and chocolate shavings.',
    category: 'Signature Shakes',
    tag: 'Signature',
    small_price: 2000,
    big_price: 3000,
    image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=400'
  },
  {
    id: '2',
    name: 'Strawberry Milkshake',
    description: 'A classic favorite made with sweet, ripe strawberries blended with fresh milk and premium ice cream.',
    category: 'Signature Shakes',
    tag: 'Classic',
    small_price: 2000,
    big_price: 3000,
    image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=400'
  },
  {
    id: '3',
    name: 'Banana Cream Milkshake',
    description: 'Creamy banana shake blended to perfection with rich vanilla ice cream and a touch of sweet honey.',
    category: 'Seasonal Pairings',
    tag: 'Seasonal',
    small_price: 2000,
    big_price: 3000,
    image_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=400'
  },
  {
    id: '4',
    name: 'Vanilla Classic Milkshake',
    description: 'Smooth, creamy, and timeless vanilla shake made from authentic Madagascar vanilla beans.',
    category: 'Signature Shakes',
    tag: 'Classic',
    small_price: 2000,
    big_price: 3000,
    image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=400'
  },
  {
    id: '5',
    name: 'Mixed Fruit Smoothie',
    description: 'A healthy, refreshing blend of strawberries, blueberries, bananas, and yogurt.',
    category: 'Apothecary',
    tag: 'Wellness',
    small_price: 2000,
    big_price: 3000,
    image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=400'
  },
  {
    id: '6',
    name: 'Beetroot Drink',
    description: 'Organic beetroot juice blended with fresh ginger, lemon, and apples for a daily detox.',
    category: 'Apothecary',
    tag: 'Detox',
    small_price: 2000,
    big_price: 3000,
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=400'
  }
];

export const DrinksSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All Collections');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const resp = await api.get('/products');
        if (resp.data && resp.data.length > 0) {
          setProducts(resp.data);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch (err) {
        console.warn('API connection failed. Loading static products.', err);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Other Menu Items'));
    return ['All Collections', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All Collections') return products;
    return products.filter(p => (p.category || 'Other Menu Items') === activeCategory);
  }, [products, activeCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-gold-leaf/30 border-t-gold-leaf rounded-full animate-spin mb-4"></div>
        <p className="font-body-md text-on-surface-variant">Preparing Luxury Menu...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-12 border-b border-gold-leaf/20 pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full font-label-caps transition-colors ${
              activeCategory === cat
                ? 'bg-gold-leaf text-cacao-black'
                : 'border border-gold-leaf/30 text-gold-leaf hover:bg-gold-leaf/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <DrinkCard key={product.id} product={product} />
        ))}
        {filteredProducts.length === 0 && (
          <p className="col-span-full text-center py-12 text-on-surface-variant font-body-md">
            No items available in this collection.
          </p>
        )}
      </div>
    </>
  );
};

export default DrinksSection;
