'use client';

import React from 'react';
import Link from 'next/link';
import GlobalFooter from '../../components/GlobalFooter';

const SECTION_STYLES = {
  background: 'rgba(36,22,17,0.55)',
  border: '1px solid rgba(212,175,55,0.12)',
  borderRadius: '20px',
  padding: '2rem 2.25rem',
  marginBottom: '1.5rem',
};

const H2_STYLES: React.CSSProperties = {
  fontFamily: "'Libre Caslon Text', serif",
  fontSize: '1.25rem',
  color: '#eae1d4',
  marginBottom: '0.85rem',
  fontWeight: 400,
};

const P_STYLES: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#99907c',
  lineHeight: 1.75,
  margin: '0 0 0.75rem',
};

const UL_STYLES: React.CSSProperties = {
  paddingLeft: '1.5rem',
  fontSize: '0.9rem',
  color: '#99907c',
  lineHeight: 1.75,
  margin: '0.5rem 0',
};

export default function TermsOfServicePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .policy-page { min-height: 100vh; background: #1A0F0A; font-family: 'DM Sans', sans-serif; color: #eae1d4; }
        .policy-header {
          background: rgba(26,12,8,0.95);
          border-bottom: 1px solid rgba(212,175,55,0.12);
          height: 72px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 max(5vw,1.5rem);
          position: sticky; top: 0; z-index: 50; backdrop-filter: blur(20px);
        }
        .policy-logo {
          font-family: 'Libre Caslon Text', serif; font-size: 1.3rem; color: #f2ca50;
          letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; transition: color 0.2s;
        }
        .policy-logo:hover { color: #fff8e7; }
        .policy-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(212,175,55,0.7); text-decoration: none;
          padding: 0.5rem 1rem; border: 1px solid rgba(212,175,55,0.2); border-radius: 9px; transition: all 0.2s;
        }
        .policy-back:hover { color: #f2ca50; border-color: rgba(212,175,55,0.5); background: rgba(212,175,55,0.06); }
        .policy-hero { padding: 5rem max(5vw,1.5rem) 3rem; max-width: 860px; margin: 0 auto; }
        .policy-label {
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; color: #d4af37; margin-bottom: 0.75rem;
        }
        .policy-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: clamp(2rem,4vw,2.8rem); font-weight: 400;
          color: #eae1d4; line-height: 1.2; margin: 0 0 0.5rem;
        }
        .policy-title em { color: #f2ca50; font-style: italic; }
        .policy-updated { font-size: 0.78rem; color: #4d4635; margin-bottom: 3rem; }
        .policy-divider { width: 48px; height: 1px; background: linear-gradient(90deg, #d4af37, transparent); margin-bottom: 3rem; }
        .policy-body { max-width: 860px; margin: 0 auto; padding: 0 max(5vw,1.5rem) 6rem; }
        .policy-footer-links {
          display: flex; gap: 1.5rem; flex-wrap: wrap;
          padding: 2.5rem max(5vw,1.5rem);
          border-top: 1px solid rgba(212,175,55,0.08);
          max-width: 860px; margin: 0 auto; font-size: 0.8rem;
        }
        .policy-footer-links a { color: rgba(212,175,55,0.6); text-decoration: none; transition: color 0.2s; }
        .policy-footer-links a:hover { color: #f2ca50; }
      `}</style>

      <div className="policy-page">
        <header className="policy-header">
          <Link href="/" className="policy-logo">LuxeShake</Link>
          <Link href="/" className="policy-back">
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px', lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>arrow_back</span>
            Back Home
          </Link>
        </header>

        <div className="policy-hero">
          <div className="policy-label">Legal</div>
          <h1 className="policy-title">Terms of <em>Service</em></h1>
          <p className="policy-updated">Last updated: June 2025</p>
          <div className="policy-divider" />
        </div>

        <div className="policy-body">

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>1. Acceptance of Terms</h2>
            <p style={P_STYLES}>
              By accessing or using the LuxeShake website, mobile application, or any of our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, you may not use our services.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>2. Our Services</h2>
            <p style={P_STYLES}>
              LuxeShake Artisanal Creamery provides artisanal milkshakes, smoothies, and gourmet snacks through our physical location and online ordering platform. We offer both in-store pickup and delivery services within Enugu, Nigeria.
            </p>
            <p style={P_STYLES}>
              We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>3. Orders and Payments</h2>
            <ul style={UL_STYLES}>
              <li>All prices are listed in Nigerian Naira (₦) and are inclusive of applicable taxes</li>
              <li>Orders are confirmed only upon successful payment processing</li>
              <li>We reserve the right to refuse or cancel orders at our discretion</li>
              <li>Delivery fees are calculated based on your selected delivery zone</li>
              <li>Payment must be completed before order preparation begins</li>
            </ul>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>4. Cancellations & Refunds</h2>
            <p style={P_STYLES}>
              Due to the perishable and freshly prepared nature of our products:
            </p>
            <ul style={UL_STYLES}>
              <li>Orders cannot be cancelled once preparation has begun</li>
              <li>Cancellation requests must be submitted within 5 minutes of placing an order</li>
              <li>Refunds for eligible cancellations will be processed within 5–10 business days</li>
              <li>If your order arrives in an unsatisfactory condition, please contact us within 30 minutes of delivery with photographic evidence for a resolution</li>
            </ul>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>5. Allergen Information</h2>
            <p style={P_STYLES}>
              Our products contain dairy and may contain nuts, gluten, eggs, and other allergens. Customers with food allergies or dietary restrictions are responsible for reviewing ingredient information before ordering. LuxeShake is not liable for allergic reactions resulting from failure to disclose known allergies.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>6. User Accounts</h2>
            <p style={P_STYLES}>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. LuxeShake reserves the right to suspend accounts that violate these terms.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>7. Intellectual Property</h2>
            <p style={P_STYLES}>
              All content on this website, including text, graphics, logos, images, and software, is the property of LuxeShake Artisanal Creamery and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>8. Limitation of Liability</h2>
            <p style={P_STYLES}>
              To the maximum extent permitted by law, LuxeShake shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability to you for any claim shall not exceed the amount you paid for the specific order giving rise to the claim.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>9. Governing Law</h2>
            <p style={P_STYLES}>
              These Terms of Service are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Enugu State, Nigeria.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>10. Contact Us</h2>
            <p style={P_STYLES}>
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:hello@luxeshake.com" style={{ color: '#d4af37', textDecoration: 'none' }}>hello@luxeshake.com</a>{' '}
              or visit us at our New Haven, Enugu location.
            </p>
          </div>

        </div>

        <div className="policy-footer-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/sustainability">Sustainability</Link>
          <Link href="/">Back to Home</Link>
        </div>
        
        <GlobalFooter style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', zIndex: 10 }} />
      </div>
    </>
  );
}
