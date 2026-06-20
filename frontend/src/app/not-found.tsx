'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      background: 'var(--brown-deep)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      textAlign: 'center'
    }}>
      <span className="s-label">Error 404</span>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '3.5rem',
        color: 'var(--gold-lt)',
        fontWeight: 700,
        lineHeight: 1.2,
        margin: '1rem 0'
      }}>
        Page <em>Not Found</em>
      </h1>
      <div className="gold-rule" style={{ margin: '1.5rem auto' }}></div>
      <p style={{
        color: 'var(--text-body)',
        fontSize: '1rem',
        maxWidth: '460px',
        lineHeight: '1.8',
        marginBottom: '2.5rem'
      }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let us guide you back to our premium milkshake selection.
      </p>

      <Link href="/" className="btn-gold" style={{ textDecoration: 'none' }}>
        Back to Homepage
      </Link>
    </div>
  );
}
