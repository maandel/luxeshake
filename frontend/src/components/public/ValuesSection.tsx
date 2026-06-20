'use client';

import React from 'react';

export const ValuesSection: React.FC = () => {
  return (
    <section className="values" id="values">
      <div className="values-bg-text">LUXESHAKE</div>
      <div className="container">
        <div className="values-header">
          <span className="s-label">Our Philosophy</span>
          <h2 className="s-title">
            The <em>Luxe</em> Standard
          </h2>
          <div className="gold-rule"></div>
        </div>

        <div className="values-grid">
          {/* Card 1: Premium Quality */}
          <div className="v-card">
            <span className="v-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9963E" strokeWidth="1.5">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
              </svg>
            </span>
            <h3 className="v-title">Premium Quality</h3>
            <ul className="v-points">
              <li>100% full-cream fresh milk dairy</li>
              <li>Hand-picked fresh strawberries &amp; fruits</li>
              <li>Imported Madagascar vanilla &amp; cocoa</li>
            </ul>
            <div className="v-note">✦ NO ARTIFICIAL ADDITIVES</div>
          </div>

          {/* Card 2: Luxury Experience */}
          <div className="v-card">
            <span className="v-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9963E" strokeWidth="1.5">
                <path d="M6 3h12l4 6-10 13L2 9Z" />
                <path d="M11 3 8 9l3 13" />
                <path d="M13 3l3 6-3 13" />
                <path d="M2 9h20" />
              </svg>
            </span>
            <h3 className="v-title">Luxury Experience</h3>
            <ul className="v-points">
              <li>Premium double-walled gold-rimmed cups</li>
              <li>Chilled thermal delivery packaging</li>
              <li>Exquisite flavors for sophisticated palates</li>
            </ul>
            <div className="v-note">✦ ELITE CRAFTSMANSHIP</div>
          </div>

          {/* Card 3: Satisfaction */}
          <div className="v-card">
            <span className="v-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9963E" strokeWidth="1.5">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </span>
            <h3 className="v-title">Satisfaction</h3>
            <ul className="v-points">
              <li>Rich, thick, and perfectly sweet textures</li>
              <li>Prompt, polite delivery agents</li>
              <li>Instant replacement for fulfillment issues</li>
            </ul>
            <div className="v-note">✦ CUSTOMER-CENTRIC PRINCIPLES</div>
          </div>

          {/* Card 4: Consistency */}
          <div className="v-card">
            <span className="v-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9963E" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </span>
            <h3 className="v-title">Consistency</h3>
            <ul className="v-points">
              <li>Identical flavor profile with each order</li>
              <li>Strict recipe weights and parameters</li>
              <li>Meticulous production line inspection</li>
            </ul>
            <div className="v-note">✦ FLAWLESS EXECUTION</div>
          </div>

          {/* Card 5: Aesthetic Appeal */}
          <div className="v-card">
            <span className="v-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9963E" strokeWidth="1.5">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </span>
            <h3 className="v-title">Aesthetic Appeal</h3>
            <ul className="v-points">
              <li>Stunning visual layers and dressings</li>
              <li>Beautiful, eco-friendly gold accents</li>
              <li>Camera-ready creations for social posts</li>
            </ul>
            <div className="v-note">✦ ARTISTIC DESIGNS</div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default ValuesSection;
