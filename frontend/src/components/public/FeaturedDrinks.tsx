'use client';

import React from 'react';
import Link from 'next/link';

export const FeaturedDrinks: React.FC = () => {
  return (
    <section className="py-section-gap bg-cacao-black relative" id="featured">
      {/* Background Texture */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#C5A028 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>
      
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="font-label-caps text-gold-leaf block mb-4">Sweet &amp; Savory Pairings</span>
            <h2 className="font-headline-md text-headline-md text-cream-silk">The Signature Collection</h2>
          </div>
          <Link href="/menu" className="text-gold-leaf border-b border-gold-leaf/30 pb-1 hover:border-gold-leaf transition-all">
            View All Delicacies
          </Link>
        </div>
        
        {/* Bento-ish Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Chocolate Card */}
          <div className="group relative flex flex-col bg-chocolate-deep overflow-hidden">
            <div className="aspect-[3/4] relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 z-10"></div>
              <img 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                alt="Midnight Truffle" 
                src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=400&auto=format&fit=crop"
              />
            </div>
            <div className="p-8 flex flex-col items-center text-center">
              <span className="font-label-caps text-[10px] text-gold-leaf/60 mb-2">BOLD &amp; INTENSE</span>
              <h3 className="font-headline-sm text-headline-sm text-cream-silk mb-4">Midnight Truffle</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">70% Tanzanian Cacao, vanilla bean froth, and hand-shaved truffle bark.</p>
              <Link href="/menu" className="w-full py-4 bg-transparent border border-gold-leaf/30 text-gold-leaf font-label-caps group-hover:bg-gold-leaf group-hover:text-cacao-black transition-all text-center block">
                Order in Menu
              </Link>
            </div>
          </div>
          
          {/* Strawberry Card */}
          <div className="group relative flex flex-col bg-chocolate-deep overflow-hidden transform md:translate-y-12">
            <div className="aspect-[3/4] relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 z-10"></div>
              <img 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                alt="Wild Velvet" 
                src="https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=400&auto=format&fit=crop"
              />
            </div>
            <div className="p-8 flex flex-col items-center text-center">
              <span className="font-label-caps text-[10px] text-gold-leaf/60 mb-2">FRESH &amp; REFINED</span>
              <h3 className="font-headline-sm text-headline-sm text-cream-silk mb-4">Wild Velvet</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">Macerated alpine strawberries, Madagascar vanilla, and clotted cream.</p>
              <Link href="/menu" className="w-full py-4 bg-transparent border border-gold-leaf/30 text-gold-leaf font-label-caps group-hover:bg-gold-leaf group-hover:text-cacao-black transition-all text-center block">
                Order in Menu
              </Link>
            </div>
          </div>
          
          {/* Banana Card */}
          <div className="group relative flex flex-col bg-chocolate-deep overflow-hidden">
            <div className="aspect-[3/4] relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 z-10"></div>
              <img 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                alt="Gilded Banana" 
                src="https://images.unsplash.com/photo-1586985289906-406988974504?q=80&w=400&auto=format&fit=crop"
              />
            </div>
            <div className="p-8 flex flex-col items-center text-center">
              <span className="font-label-caps text-[10px] text-gold-leaf/60 mb-2">SMOOTH &amp; CARAMELIZED</span>
              <h3 className="font-headline-sm text-headline-sm text-cream-silk mb-4">Gilded Banana</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">Fire-roasted banana, salted amber caramel, and honeycomb clusters.</p>
              <Link href="/menu" className="w-full py-4 bg-transparent border border-gold-leaf/30 text-gold-leaf font-label-caps group-hover:bg-gold-leaf group-hover:text-cacao-black transition-all text-center block">
                Order in Menu
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default FeaturedDrinks;
