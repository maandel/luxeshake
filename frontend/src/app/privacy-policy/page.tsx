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

export default function PrivacyPolicyPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .policy-page { min-height: 100vh; background: #1A0F0A; font-family: 'DM Sans', sans-serif; color: #eae1d4; }
        .policy-header {
          background: rgba(26,12,8,0.95);
          border-bottom: 1px solid rgba(212,175,55,0.12);
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 max(5vw,1.5rem);
          position: sticky; top: 0; z-index: 50;
          backdrop-filter: blur(20px);
        }
        .policy-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.3rem; color: #f2ca50;
          letter-spacing: 0.2em; text-transform: uppercase;
          text-decoration: none; transition: color 0.2s;
        }
        .policy-logo:hover { color: #fff8e7; }
        .policy-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(212,175,55,0.7);
          text-decoration: none;
          padding: 0.5rem 1rem; border: 1px solid rgba(212,175,55,0.2);
          border-radius: 9px; transition: all 0.2s;
        }
        .policy-back:hover { color: #f2ca50; border-color: rgba(212,175,55,0.5); background: rgba(212,175,55,0.06); }
        .policy-hero {
          padding: 5rem max(5vw,1.5rem) 3rem;
          max-width: 860px; margin: 0 auto;
        }
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
        .policy-updated {
          font-size: 0.78rem; color: #4d4635; margin-bottom: 3rem;
        }
        .policy-divider {
          width: 48px; height: 1px;
          background: linear-gradient(90deg, #d4af37, transparent);
          margin-bottom: 3rem;
        }
        .policy-body { max-width: 860px; margin: 0 auto; padding: 0 max(5vw,1.5rem) 6rem; }
        .policy-footer-links {
          display: flex; gap: 1.5rem; flex-wrap: wrap;
          padding: 2.5rem max(5vw,1.5rem);
          border-top: 1px solid rgba(212,175,55,0.08);
          max-width: 860px; margin: 0 auto;
          font-size: 0.8rem;
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
          <h1 className="policy-title">Privacy <em>Policy</em></h1>
          <p className="policy-updated">Last updated: June 2025</p>
          <div className="policy-divider" />
        </div>

        <div className="policy-body">

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>1. Introduction</h2>
            <p style={P_STYLES}>
              Welcome to LuxeShake Artisanal Creamery ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or place an order with us.
            </p>
            <p style={P_STYLES}>
              If you have questions or concerns about this policy, please contact us at <a href="mailto:hello@luxeshake.com" style={{ color: '#d4af37', textDecoration: 'none' }}>hello@luxeshake.com</a>.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>2. Information We Collect</h2>
            <p style={P_STYLES}>We collect information you provide directly to us, including:</p>
            <ul style={UL_STYLES}>
              <li><strong style={{ color: '#eae1d4' }}>Personal Identifiers:</strong> Name, email address, phone number</li>
              <li><strong style={{ color: '#eae1d4' }}>Order Information:</strong> Items ordered, delivery address, special instructions</li>
              <li><strong style={{ color: '#eae1d4' }}>Payment Information:</strong> We do not store card details — all payments are processed by secure third-party providers</li>
              <li><strong style={{ color: '#eae1d4' }}>Usage Data:</strong> Browser type, pages visited, time spent on site, referral source</li>
            </ul>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>3. How We Use Your Information</h2>
            <p style={P_STYLES}>We use the collected information to:</p>
            <ul style={UL_STYLES}>
              <li>Process and fulfil your orders</li>
              <li>Send you order confirmations, updates, and receipts</li>
              <li>Respond to your comments, questions, and complaints</li>
              <li>Improve our website, products, and customer experience</li>
              <li>Send promotional communications (you may opt out at any time)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>4. Information Sharing</h2>
            <p style={P_STYLES}>
              We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and conducting our business, subject to strict confidentiality agreements. These include:
            </p>
            <ul style={UL_STYLES}>
              <li>Payment processors (e.g., Paystack, Flutterwave)</li>
              <li>Delivery partners for order fulfilment</li>
              <li>Analytics providers (anonymised data only)</li>
            </ul>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>5. Data Security</h2>
            <p style={P_STYLES}>
              We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>6. Cookies</h2>
            <p style={P_STYLES}>
              We use session cookies to maintain your login state and shopping cart. We also use analytics cookies to understand how visitors interact with our website. You can disable cookies in your browser settings, though this may affect some functionality.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>7. Your Rights</h2>
            <p style={P_STYLES}>You have the right to:</p>
            <ul style={UL_STYLES}>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
            <p style={{ ...P_STYLES, marginTop: '0.75rem' }}>
              To exercise any of these rights, email us at <a href="mailto:hello@luxeshake.com" style={{ color: '#d4af37', textDecoration: 'none' }}>hello@luxeshake.com</a>.
            </p>
          </div>

          <div style={SECTION_STYLES}>
            <h2 style={H2_STYLES}>8. Changes to This Policy</h2>
            <p style={P_STYLES}>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page with an updated date. Your continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </div>

        </div>

        <div className="policy-footer-links">
          <Link href="/terms-of-service">Terms of Service</Link>
          <Link href="/sustainability">Sustainability</Link>
          <Link href="/">Back to Home</Link>
        </div>
        
        <GlobalFooter style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', zIndex: 10 }} />
      </div>
    </>
  );
}
