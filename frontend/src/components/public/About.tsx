'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const About: React.FC = () => {
  return (
    <section className="py-section-gap bg-surface relative overflow-hidden" id="about">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter grid md:grid-cols-2 gap-16 items-center">
        <div className="relative group">
          <div className="absolute -inset-4 border border-gold-leaf/20 translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500"></div>
          <div className="relative aspect-video overflow-hidden shadow-2xl">
            <Image 
              alt="Craftsmanship detail" 
              className="object-cover transform group-hover:scale-110 transition-transform duration-700" 
              src="https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop"
              fill
            />
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <h2 className="font-headline-md text-headline-md text-gold-leaf">The Art of the Shake</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body-md text-on-surface-variant">
            <p>
              We believe that indulgence should be an experience of absolute refinement. Our milkshakes are not simply blended; they are orchestrated from the finest single-origin cacao and cream sourced from heirloom-breed cows.
            </p>
            <p>
              Every signature pour is a testament to our commitment to artisanal quality. We prioritize small-batch production to ensure every drop maintains the velvety texture that defines the LuxeShake legacy.
            </p>
          </div>
          <div className="pt-4">
            <Link href="#manifesto" className="inline-flex items-center gap-3 text-gold-leaf font-label-caps group">
              Read Our Manifesto
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
