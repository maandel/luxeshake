'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your order number.');
      return;
    }
    setError('');
    router.push(`/track/${trimmed}`);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .track-page {
          min-height: 100vh;
          background: #1A0F0A;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
        }

        /* Header */
        .track-header {
          background: rgba(26, 12, 8, 0.95);
          border-bottom: 1px solid rgba(212,175,55,0.12);
          padding: 0 max(5vw, 1.5rem);
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .track-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.3rem;
          color: #f2ca50;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
        }
        .track-logo:hover { color: #fff8e7; }

        .track-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.7);
          text-decoration: none;
          padding: 0.5rem 1rem;
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 9px;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .track-back-btn:hover {
          color: #f2ca50;
          border-color: rgba(212,175,55,0.5);
          background: rgba(212,175,55,0.06);
        }

        /* Hero / Card */
        .track-hero {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem max(5vw, 1.5rem);
          position: relative;
          overflow: hidden;
        }

        /* Ambient blobs */
        .track-blob-1 {
          position: absolute;
          top: -120px;
          left: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .track-blob-2 {
          position: absolute;
          bottom: -100px;
          right: -80px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .track-card {
          position: relative;
          z-index: 2;
          background: rgba(36, 22, 17, 0.75);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 28px;
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 520px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.06);
          animation: trackFadeUp 0.6s ease both;
        }

        @keyframes trackFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .track-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.75rem;
        }

        .track-card-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #d4af37;
          text-align: center;
          margin-bottom: 0.6rem;
        }

        .track-card-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: clamp(1.75rem, 4vw, 2.4rem);
          font-weight: 400;
          color: #eae1d4;
          text-align: center;
          line-height: 1.2;
          margin: 0 0 0.6rem;
        }

        .track-card-title em {
          color: #f2ca50;
          font-style: italic;
        }

        .track-card-desc {
          font-size: 0.88rem;
          color: #99907c;
          text-align: center;
          line-height: 1.6;
          margin: 0 0 2.25rem;
        }

        /* Divider */
        .track-divider {
          width: 36px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          margin: 0 auto 2rem;
        }

        /* Form */
        .track-form { display: flex; flex-direction: column; gap: 1rem; }

        .track-field {
          position: relative;
        }

        .track-field-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.7);
          margin-bottom: 0.5rem;
        }

        .track-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .track-input-icon {
          position: absolute;
          left: 1rem;
          font-family: 'Material Symbols Outlined';
          font-size: 20px;
          color: rgba(212,175,55,0.5);
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          pointer-events: none;
          transition: color 0.2s;
          line-height: 1;
        }

        .track-input {
          width: 100%;
          background: rgba(13,8,4,0.6);
          border: 1px solid rgba(212,175,55,0.18);
          border-radius: 14px;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1rem;
          font-weight: 600;
          color: #eae1d4;
          letter-spacing: 0.1em;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
          box-sizing: border-box;
        }
        .track-input::placeholder {
          color: rgba(153,144,124,0.4);
          font-weight: 400;
          letter-spacing: 0;
        }
        .track-input:focus {
          border-color: rgba(212,175,55,0.55);
          background: rgba(13,8,4,0.8);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.1), 0 4px 20px rgba(0,0,0,0.3);
        }

        .track-input-wrap.focused .track-input-icon {
          color: rgba(212,175,55,0.8);
        }

        .track-error {
          font-size: 0.75rem;
          color: #ef9a9a;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.35rem;
          animation: trackShake 0.35s ease;
        }

        @keyframes trackShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }

        .track-submit-btn {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 14px;
          background: #d4af37;
          color: #1A0F0A;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          box-shadow: 0 4px 20px rgba(212,175,55,0.35);
          transition: all 0.2s;
        }
        .track-submit-btn:hover {
          background: #f2ca50;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(212,175,55,0.45);
        }
        .track-submit-btn:active { transform: translateY(0); }

        /* Info chips */
        .track-chips {
          display: flex;
          gap: 0.75rem;
          margin-top: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .track-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #99907c;
          background: rgba(212,175,55,0.05);
          border: 1px solid rgba(212,175,55,0.1);
          border-radius: 100px;
          padding: 0.4rem 0.9rem;
        }

        .track-chip span {
          font-family: 'Material Symbols Outlined';
          font-size: 14px;
          color: rgba(212,175,55,0.6);
          line-height: 1;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }

        /* Footer note */
        .track-footer-note {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.78rem;
          color: #4d4635;
        }

        .track-footer-note a {
          color: rgba(212,175,55,0.6);
          text-decoration: none;
          transition: color 0.2s;
        }
        .track-footer-note a:hover { color: #f2ca50; }
      `}</style>

      <div className="track-page">
        {/* Header */}
        <header className="track-header">
          <Link href="/" className="track-logo">LuxeShake</Link>
          <Link href="/" className="track-back-btn">
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>arrow_back</span>
            Back Home
          </Link>
        </header>

        {/* Main */}
        <main className="track-hero">
          <div className="track-blob-1" />
          <div className="track-blob-2" />

          <div className="track-card">
            {/* Icon */}
            <div className="track-icon-wrap">
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '30px', color: '#d4af37', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 40", lineHeight: 1 }}>
                package_2
              </span>
            </div>

            {/* Copy */}
            <div className="track-card-label">Live Order Tracker</div>
            <h1 className="track-card-title">
              Track Your <em>Order</em>
            </h1>
            <div className="track-divider" />
            <p className="track-card-desc">
              Enter the order number from your confirmation email or receipt to see real-time status updates.
            </p>

            {/* Form */}
            <form className="track-form" onSubmit={handleSubmit} noValidate>
              <div className="track-field">
                <label className="track-field-label" htmlFor="order-number-input">
                  Order Number
                </label>
                <div className={`track-input-wrap${focused ? ' focused' : ''}`}>
                  <span className="track-input-icon">tag</span>
                  <input
                    id="order-number-input"
                    type="text"
                    className="track-input"
                    placeholder="e.g. LS-20240001"
                    value={orderNumber}
                    onChange={e => { setOrderNumber(e.target.value); setError(''); }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                {error && (
                  <p className="track-error" role="alert">
                    <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '14px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>error</span>
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" className="track-submit-btn">
                <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '18px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>search</span>
                Track My Order
              </button>
            </form>

            {/* Info chips */}
            <div className="track-chips">
              <span className="track-chip">
                <span>schedule</span> Real-time updates
              </span>
              <span className="track-chip">
                <span>lock</span> No login required
              </span>
              <span className="track-chip">
                <span>notifications</span> Live status
              </span>
            </div>

            {/* Footer note */}
            <p className="track-footer-note">
              Need help? <Link href="/">Contact us</Link> or{' '}
              <Link href="/track-complaint">track a complaint</Link>.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
