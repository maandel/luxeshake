'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-chocolate-deep dark:bg-cacao-black w-full py-section-gap border-t border-outline-variant/30">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-gutter max-w-container-max mx-auto gap-8">
        <div className="flex flex-col gap-4 items-center md:items-start">
          <div className="font-headline-sm text-headline-sm text-cream-silk uppercase tracking-widest">
            LuxeShake
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs text-center md:text-left">
            The world&apos;s most indulgent artisanal creamery experience.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 font-body-md text-body-md">
          <Link href="#" className="text-on-surface-variant hover:text-gold-leaf transition-colors">Privacy Policy</Link>
          <Link href="#" className="text-on-surface-variant hover:text-gold-leaf transition-colors">Terms of Service</Link>
          <Link href="#" className="text-on-surface-variant hover:text-gold-leaf transition-colors">Sustainability</Link>
          <Link href="#" className="text-on-surface-variant hover:text-gold-leaf transition-colors">Careers</Link>
        </div>
        
        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:text-gold-leaf hover:border-gold-leaf rounded-full transition-all">
            <span className="material-symbols-outlined text-sm">share</span>
          </a>
          <a href="#" className="w-10 h-10 flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:text-gold-leaf hover:border-gold-leaf rounded-full transition-all">
            <span className="material-symbols-outlined text-sm">public</span>
          </a>
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant/50">
          © {new Date().getFullYear()} LuxeShake Artisanal Creamery. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
