'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the SPA homepage and scroll to the menu section
    router.replace('/#menu');
    // Give the page a moment to mount then scroll
    setTimeout(() => {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#1A0F0A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ textAlign: 'center', color: '#99907c', fontSize: '0.9rem' }}>
        <div style={{
          width: '28px', height: '28px',
          border: '2px solid rgba(212,175,55,0.2)',
          borderTopColor: '#d4af37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem'
        }} />
        Loading menu...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
