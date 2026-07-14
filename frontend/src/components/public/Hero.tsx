'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ArrowDown } from 'lucide-react';
import { WebGLHero } from './WebGLHero';

export const Hero: React.FC = () => {
  return (
    <section className="relative h-screen flex items-center overflow-hidden pt-20" id="home">
      <div className="absolute inset-0 z-0 bg-cacao-black">
        <WebGLHero />
        <div className="absolute inset-0 bg-gradient-to-r from-cacao-black/90 via-cacao-black/40 to-transparent z-10 pointer-events-none"></div>
      </div>
      
      <div className="relative z-20 max-w-container-max mx-auto px-margin-mobile md:px-gutter w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-gold-leaf/10 border border-gold-leaf/20 text-gold-leaf font-label-caps">
            <Star size={14} className="text-gold-leaf" />
            Premium Quality
          </div>
          
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-cream-silk mb-8"> 
            Luxury in <span className="italic text-gold-leaf">Every</span> Sip &amp; Bite. 
          </h1>
          
          <p className="font-body-lg text-body-lg text-cream-silk/70 mb-10 max-w-lg">
            Indulge in our artisanal creamery where ritual meets refreshment. Hand-crafted with organic dairy, rare ingredients, and gourmet snacks for the discerning palate.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/menu" className="bg-gold-leaf text-cacao-black px-10 py-4 rounded font-label-caps text-sm tracking-[0.2em] primary-glow hover:scale-105 transition-all text-center">
              Explore Drinks
            </Link>
            <Link href="#about" className="border border-gold-leaf/50 text-gold-leaf px-10 py-4 rounded font-label-caps text-sm tracking-[0.2em] hover:bg-gold-leaf/5 transition-all text-center">
              Our Story
            </Link>
          </div>
        </div>
      </div>
      
      {/* Floating Badge decoration */}
      <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-2 animate-bounce pointer-events-none z-20">
        <div className="w-16 h-16 rounded-full border-2 border-gold-leaf flex items-center justify-center">
          <ArrowDown size={24} className="text-gold-leaf" />
        </div>
        <span className="font-label-caps text-[10px] text-gold-leaf/50 uppercase">Discover more</span>
      </div>
    </section>
  );
};

export default Hero;
