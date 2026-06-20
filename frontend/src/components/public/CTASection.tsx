'use client';

import React from 'react';

export const CTASection: React.FC = () => {
  return (
    <section className="py-section-gap">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
        <div className="glass-card p-12 md:p-24 flex flex-col items-center text-center relative overflow-hidden rounded-xl">
          {/* Ornamental Corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-gold-leaf/40"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-gold-leaf/40"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-gold-leaf/40"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-gold-leaf/40"></div>
          
          <h2 className="font-display-lg-mobile md:font-headline-md text-cream-silk mb-6">Join the Inner Circle</h2>
          <p className="font-body-lg text-body-lg text-cream-silk/70 mb-10 max-w-xl">
            Subscribe for exclusive access to seasonal flavors, private tasting events, and the story behind every sip.
          </p>
          
          <div className="flex flex-col md:flex-row w-full max-w-md gap-4">
            <input 
              className="flex-grow bg-cacao-black border border-outline-variant/30 text-cream-silk px-6 py-4 rounded focus:border-gold-leaf focus:ring-0 transition-colors" 
              placeholder="Your email address" 
              type="email"
            />
            <button className="bg-gold-leaf text-cacao-black px-8 py-4 font-label-caps rounded primary-glow hover:scale-105 transition-transform">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
