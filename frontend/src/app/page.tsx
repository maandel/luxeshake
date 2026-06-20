'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/authStore';
import { useToast } from '../context/ToastContext';
import { useCartStore } from '../lib/store/cartStore';
import { api } from '../lib/api';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

const CartDrawer = dynamic(() => import('../components/public/CartDrawer'), {
  ssr: false,
});
const ContactSection = dynamic(() => import('../components/public/ContactSection'), {
  loading: () => <div className="skeleton" style={{ height: '400px', width: '100%', borderRadius: '24px' }} />,
  ssr: false,
});
import CartFAB from '../components/public/CartFAB';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  tag: string;
  small_price: number;
  big_price: number;
  image_url?: string;
  image_path?: string;
}

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

const MOCK: Product[] = [
  { id: '1', name: 'Classic Chocolate', description: 'Rich, velvety chocolate topped with fresh whipped cream and chocolate shavings.', category: 'Signature Shakes', tag: 'Signature', small_price: 2000, big_price: 3000, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600' },
  { id: '2', name: 'Strawberry Dream', description: 'Sweet, ripe strawberries blended with fresh milk and premium vanilla ice cream.', category: 'Signature Shakes', tag: 'Classic', small_price: 2000, big_price: 3000, image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=600' },
  { id: '3', name: 'Banana Cream', description: 'Creamy banana shake blended with rich vanilla ice cream and a touch of honey.', category: 'Seasonal Pairings', tag: 'Seasonal', small_price: 2000, big_price: 3000, image_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=600' },
  { id: '4', name: 'Vanilla Classic', description: 'Smooth, timeless vanilla shake made from authentic Madagascar vanilla beans.', category: 'Signature Shakes', tag: 'Classic', small_price: 2000, big_price: 3000, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600' },
  { id: '5', name: 'Mixed Fruit Smoothie', description: 'A healthy blend of strawberries, blueberries, bananas, and yogurt.', category: 'Apothecary', tag: 'Wellness', small_price: 2000, big_price: 3000, image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=600' },
  { id: '6', name: 'Beetroot Elixir', description: 'Organic beetroot with fresh ginger, lemon, and apples for a daily detox.', category: 'Apothecary', tag: 'Detox', small_price: 2000, big_price: 3000, image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600' },
];

function ProductCard({ product }: { product: Product }) {
  const [size, setSize] = useState<'small' | 'big'>('small');
  const [added, setAdded] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  const { showToast } = useToast();

  const price = size === 'small' ? product.small_price : product.big_price;
  const image = product.image_path ? `${BACKEND}${product.image_path}` : (product.image_url || 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600');

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, size, price });
    showToast(`${product.name} (${size === 'small' ? 'Sm' : 'Lg'}) added to order!`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div style={{
      background: 'rgba(36,22,17,0.7)',
      border: '1px solid rgba(212,175,55,0.12)',
      borderRadius: '20px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.35)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img src={image} alt={product.name} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,15,10,0.85) 0%, rgba(26,15,10,0.1) 50%, transparent 100%)' }} />
        {product.tag && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(26,15,10,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '6px', padding: '3px 10px', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d4af37' }}>
            {product.tag}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px' }}>
          <div style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '1.05rem', color: '#eae1d4', lineHeight: 1.2, marginBottom: '4px' }}>{product.name}</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f2ca50' }}>₦{price.toLocaleString()}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.1rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.85rem' }}>
        <p style={{ fontSize: '0.82rem', color: '#99907c', lineHeight: 1.6, flex: 1, margin: 0 }}>
          {product.description}
        </p>

        {/* Size toggle */}
        <div style={{ display: 'flex', background: 'rgba(13,8,4,0.5)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '10px', padding: '3px', gap: '3px' }}>
          {(['small', 'big'] as const).map(s => (
            <button key={s} onClick={() => setSize(s)} style={{
              flex: 1, padding: '7px 0', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: size === s ? '#d4af37' : 'transparent',
              color: size === s ? '#1A0F0A' : '#99907c',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {s === 'small' ? `Sm · ₦${product.small_price.toLocaleString()}` : `Lg · ₦${product.big_price.toLocaleString()}`}
            </button>
          ))}
        </div>

        {/* Add button */}
        <button onClick={handleAdd} style={{
          width: '100%', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer',
          background: added ? 'rgba(46,125,50,0.25)' : 'rgba(212,175,55,0.12)',
          color: added ? '#81C784' : '#d4af37',
          border: `1px solid ${added ? 'rgba(46,125,50,0.4)' : 'rgba(212,175,55,0.25)'}`,
          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          transition: 'all 0.25s',
          boxShadow: added ? 'none' : '0 0 0 0 transparent',
        }}
          onMouseEnter={e => { if (!added) { (e.currentTarget as HTMLButtonElement).style.background = '#d4af37'; (e.currentTarget as HTMLButtonElement).style.color = '#1A0F0A'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(212,175,55,0.3)'; } }}
          onMouseLeave={e => { if (!added) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#d4af37'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; } }}
        >
          <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>
            {added ? 'check_circle' : 'add_shopping_cart'}
          </span>
          {added ? 'Added to Order' : 'Add to Order'}
        </button>
      </div>
    </div>
  );
}

function CatalogSection({ onOpenCart }: { onOpenCart: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    api.get('/products')
      .then(r => setProducts(r.data?.length ? r.data : MOCK))
      .catch(() => setProducts(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Menu'));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filtered = useMemo(() =>
    activeCategory === 'All' ? products : products.filter(p => (p.category || 'Menu') === activeCategory),
    [products, activeCategory]
  );

  return (
    <section id="menu" style={{ padding: '6rem 0', background: 'linear-gradient(180deg, #1A0F0A 0%, #160c08 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 max(5vw, 1.5rem)' }}>

        {/* Section header */}
        <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4af37' }}>
            Artisanal Catalog
          </div>
          <h2 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: '#eae1d4', margin: 0, lineHeight: 1.15 }}>
            The <em style={{ color: '#f2ca50', fontStyle: 'italic' }}>Menu</em>
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#99907c', maxWidth: '480px', lineHeight: 1.7, margin: 0 }}>
            Curated collections of our finest offerings. Select your size and add directly to your order.
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '0.5rem 1.25rem', borderRadius: '100px', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'DM Sans', sans-serif",
              background: activeCategory === cat ? '#d4af37' : 'rgba(212,175,55,0.08)',
              color: activeCategory === cat ? '#1A0F0A' : '#d4af37',
              border: `1px solid ${activeCategory === cat ? 'transparent' : 'rgba(212,175,55,0.2)'}`,
              transition: 'all 0.2s',
              boxShadow: activeCategory === cat ? '0 4px 16px rgba(212,175,55,0.25)' : 'none',
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem', color: '#99907c', fontSize: '0.9rem' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'spaSpinMenu 0.8s linear infinite' }} />
            Preparing the menu...
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', color: '#4d4635', padding: '4rem', fontSize: '0.9rem' }}>
                No items in this collection.
              </p>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spaSpinMenu { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

function SpaNavbar({ onOpenCart, cartCount }: { onOpenCart: () => void; cartCount: number }) {
  const { isAuthenticated, role, clearAuth } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = ['superadmin', 'manager', 'staff'].includes(role || '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { }
    clearAuth();
    showToast('Logged out.', 'info');
    router.push('/');
    setMobileOpen(false);
  };

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .spa-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 72px;
          display: flex; align-items: center;
          padding: 0 max(5vw, 1.5rem);
          font-family: 'DM Sans', sans-serif;
          transition: background 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease;
        }
        .spa-nav.scrolled {
          background: rgba(22,12,8,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 1px 0 rgba(212,175,55,0.1);
        }

        .spa-nav-inner {
          max-width: 1200px; margin: 0 auto; width: 100%;
          display: flex; align-items: center; gap: 0;
        }

        /* Logo */
        .spa-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.3rem; color: #f2ca50;
          letter-spacing: 0.2em; text-transform: uppercase;
          text-decoration: none; flex-shrink: 0;
          transition: color 0.2s;
        }
        .spa-logo:hover { color: #fff8e7; }

        /* Center links — desktop */
        .spa-center {
          display: none; align-items: center; gap: 2rem;
          flex: 1; justify-content: center;
        }
        @media (min-width: 900px) { .spa-center { display: flex; } }

        .spa-nav-link {
          font-size: 0.82rem; font-weight: 500; letter-spacing: 0.04em;
          color: rgba(234,225,212,0.65); text-decoration: none;
          position: relative; padding-bottom: 2px;
          transition: color 0.2s; cursor: pointer; background: none; border: none;
          font-family: 'DM Sans', sans-serif;
        }
        .spa-nav-link::after {
          content: ''; position: absolute; left: 0; bottom: -2px;
          width: 0; height: 1px; background: #d4af37; transition: width 0.3s;
        }
        .spa-nav-link:hover { color: #eae1d4; }
        .spa-nav-link:hover::after { width: 100%; }

        /* Right cluster */
        .spa-right {
          display: flex; align-items: center; gap: 0.65rem;
          flex-shrink: 0; margin-left: auto;
        }

        /* Auth pills — desktop */
        .spa-auth { display: none; align-items: center; gap: 0.5rem; }
        @media (min-width: 900px) { .spa-auth { display: flex; } }

        .spa-auth-link {
          font-size: 0.78rem; font-weight: 500;
          color: rgba(234,225,212,0.65); text-decoration: none;
          padding: 0.45rem 0.9rem; border-radius: 9px;
          border: 1px solid transparent;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .spa-auth-link:hover {
          color: #eae1d4;
          border-color: rgba(153,144,124,0.25);
          background: rgba(153,144,124,0.06);
        }

        .spa-signup-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; cursor: pointer;
          padding: 0.5rem 1.1rem; border-radius: 10px;
          background: rgba(212,175,55,0.12); color: #d4af37;
          border: 1px solid rgba(212,175,55,0.3);
          text-decoration: none; white-space: nowrap;
          transition: all 0.2s;
          display: none;
        }
        @media (min-width: 900px) { .spa-signup-btn { display: inline-flex; align-items: center; gap: 0.3rem; } }
        .spa-signup-btn:hover {
          background: rgba(212,175,55,0.2);
          border-color: rgba(212,175,55,0.55);
          color: #f2ca50;
        }

        /* Cart button */
        .spa-cart-btn {
          position: relative; background: none; border: none;
          cursor: pointer; padding: 0.3rem;
          color: rgba(234,225,212,0.65);
          font-family: 'Material Symbols Outlined';
          font-size: 22px; line-height: 1;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          transition: color 0.2s, transform 0.2s;
        }
        .spa-cart-btn:hover { color: #f2ca50; transform: scale(1.1); }
        .spa-cart-badge {
          position: absolute; top: -2px; right: -2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #d4af37; color: #1A0F0A;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.55rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          letter-spacing: 0;
        }

        /* Order Now CTA */
        .spa-cta {
          display: none;
          background: #d4af37; color: #1A0F0A;
          border-radius: 10px; padding: 0.55rem 1.2rem;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          border: none; cursor: pointer; white-space: nowrap;
          box-shadow: 0 4px 16px rgba(212,175,55,0.3);
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }
        @media (min-width: 900px) { .spa-cta { display: block; } }
        .spa-cta:hover { background: #f2ca50; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(212,175,55,0.4); }

        /* Hamburger */
        .spa-hamburger {
          background: none; border: none; cursor: pointer; padding: 0.3rem;
          color: rgba(234,225,212,0.65);
          font-family: 'Material Symbols Outlined'; font-size: 24px; line-height: 1;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        @media (min-width: 900px) { .spa-hamburger { display: none; } }
        .spa-hamburger:hover { color: #f2ca50; }

        /* Mobile drawer */
        .spa-drawer {
          position: fixed; top: 72px; left: 0; right: 0;
          background: rgba(18,10,6,0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(212,175,55,0.1);
          padding: 1.5rem max(5vw, 1.5rem) 2rem;
          display: flex; flex-direction: column; gap: 0;
          z-index: 99;
          transform: translateY(-8px); opacity: 0; pointer-events: none;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }
        .spa-drawer.open { transform: translateY(0); opacity: 1; pointer-events: auto; }

        .spa-drawer-link {
          font-size: 1rem; color: rgba(234,225,212,0.7);
          padding: 0.9rem 0; border-bottom: 1px solid rgba(212,175,55,0.07);
          text-decoration: none; cursor: pointer; background: none;
          border-left: none; border-right: none; border-top: none;
          font-family: 'DM Sans', sans-serif; text-align: left; width: 100%;
          transition: color 0.2s;
        }
        .spa-drawer-link:hover { color: #f2ca50; }
        .spa-drawer-link:last-child { border-bottom: none; }

        .spa-drawer-sep { height: 1px; background: rgba(212,175,55,0.1); margin: 0.75rem 0; }

        .spa-drawer-cta {
          display: block; margin-top: 1.25rem;
          background: #d4af37; color: #1A0F0A; border: none;
          border-radius: 12px; padding: 0.95rem 1.5rem;
          font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          text-align: center; text-decoration: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(212,175,55,0.3);
          transition: background 0.2s;
        }
        .spa-drawer-cta:hover { background: #f2ca50; }
      `}</style>

      <nav className={`spa-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="spa-nav-inner">
          <a href="#home" onClick={e => { e.preventDefault(); scrollTo('home'); }} className="spa-logo">LuxeShake</a>

          {/* Center links */}
          <div className="spa-center">
            <button className="spa-nav-link" onClick={() => scrollTo('about')}>Our Story</button>
            <button className="spa-nav-link" onClick={() => scrollTo('menu')}>The Menu</button>
            <button className="spa-nav-link" onClick={() => scrollTo('locations')}>Locations</button>
            <button className="spa-nav-link" onClick={() => scrollTo('contact')}>Contact</button>
            <Link href="/track" className="spa-nav-link">Track Order</Link>
          </div>

          {/* Right cluster */}
          <div className="spa-right">
            {/* Auth — desktop */}
            <div className="spa-auth">
              {isAuthenticated ? (
                <>
                  <Link href={isAdmin ? '/luxe-control/dashboard' : '/account'} className="spa-auth-link">
                    {isAdmin ? 'Dashboard' : 'My Account'}
                  </Link>
                  <button onClick={handleLogout} className="spa-auth-link" style={{ cursor: 'pointer', background: 'none', border: '1px solid transparent', color: 'rgba(234,225,212,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 500, borderRadius: '9px', padding: '0.45rem 0.9rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E57373'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,58,42,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(234,225,212,0.5)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="spa-auth-link">Log In</Link>
                  <Link href="/register" className="spa-signup-btn">
                    <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>person_add</span>
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Cart */}
            <button onClick={onOpenCart} className="spa-cart-btn" aria-label="Open cart">
              shopping_bag
              {cartCount > 0 && <span className="spa-cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
            </button>

            {/* Order Now */}
            <button className="spa-cta" onClick={() => scrollTo('menu')}>Order Now</button>

            {/* Hamburger */}
            <button className="spa-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? 'close' : 'menu'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`spa-drawer${mobileOpen ? ' open' : ''}`}>
        <button className="spa-drawer-link" onClick={() => scrollTo('about')}>Our Story</button>
        <button className="spa-drawer-link" onClick={() => scrollTo('menu')}>The Menu</button>
        <button className="spa-drawer-link" onClick={() => scrollTo('locations')}>Locations</button>
        <button className="spa-drawer-link" onClick={() => scrollTo('contact')}>Contact & Complaints</button>
        <Link href="/track" className="spa-drawer-link" onClick={() => setMobileOpen(false)}>Track Order</Link>
        <div className="spa-drawer-sep" />
        {isAuthenticated ? (
          <>
            <Link href={isAdmin ? '/luxe-control/dashboard' : '/account'} className="spa-drawer-link" onClick={() => setMobileOpen(false)}>
              {isAdmin ? 'Dashboard' : 'My Account'}
            </Link>
            <button className="spa-drawer-link" onClick={handleLogout} style={{ color: 'rgba(200,133,110,0.8)' }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="spa-drawer-link" onClick={() => setMobileOpen(false)}>Log In</Link>
            <Link href="/register" className="spa-drawer-link" onClick={() => setMobileOpen(false)} style={{ color: '#d4af37' }}>Sign Up</Link>
          </>
        )}
        <button className="spa-drawer-cta" onClick={() => scrollTo('menu')}>Order Now</button>
      </div>
    </>
  );
}

function HeroSection({ onScrollToMenu }: { onScrollToMenu: () => void }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <section id="home" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      {/* Background Image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: '#000' }}>
        <img
          src="https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=1800&auto=format&fit=crop"
          alt="LuxeShake Hero"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '75% center', position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        {/* Gradient Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(26,15,10,0.95) 0%, rgba(26,15,10,0.65) 55%, rgba(26,15,10,0.2) 100%)', zIndex: 1 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '6rem max(5vw, 1.5rem) 4rem', width: '100%' }}>
        <motion.div style={{ maxWidth: '650px' }} variants={containerVariants} initial="hidden" animate="visible">

          <motion.h1 variants={itemVariants} style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 400, color: '#eae1d4', lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Luxury in <em style={{ background: 'linear-gradient(to right, #f2ca50, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic', paddingRight: '0.1em' }}>Every</em><br />Sip &amp; Bite.
          </motion.h1>

          <motion.p variants={itemVariants} style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', color: 'rgba(234,225,212,0.8)', lineHeight: 1.8, marginBottom: '3rem', fontFamily: "'DM Sans', sans-serif", maxWidth: '500px', fontWeight: 300 }}>
            Hand-crafted with organic dairy, rare ingredients, and gourmet snacks.
          </motion.p>

          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <motion.button
              onClick={onScrollToMenu}
              style={{
                background: 'linear-gradient(135deg, #f2ca50 0%, #d4af37 100%)', color: '#1A0F0A', border: 'none', borderRadius: '14px',
                padding: '1.2rem 2.5rem', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 8px 32px rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', overflow: 'hidden'
              }}
              whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(212,175,55,0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '18px', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>local_cafe</span>
              Explore Our Menu
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'rgba(255,255,255,0.03)', color: '#eae1d4', border: '1px solid rgba(234,225,212,0.2)', borderRadius: '14px',
                padding: '1.2rem 2.5rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", backdropFilter: 'blur(10px)',
              }}
              whileHover={{ backgroundColor: 'rgba(212,175,55,0.1)', borderColor: 'rgba(212,175,55,0.5)', color: '#f2ca50' }}
              whileTap={{ scale: 0.98 }}
            >
              Our Story
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{ position: 'absolute', bottom: '2.5rem', left: '50%', x: '-50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', zIndex: 2 }}
        onClick={onScrollToMenu}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <motion.div
          style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.6), transparent)' }}
          animate={{ backgroundPosition: ['0% -60px', '0% 60px'] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', fontFamily: "'DM Sans', sans-serif" }}>Scroll</span>
      </motion.div>
    </section>
  );
}

function AnimatedStat({ value, suffix, label }: { value: number, suffix: string, label: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: "easeOut" });
    }
  }, [isInView, count, value]);

  return (
    <div ref={ref}>
      <div style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '1.75rem', color: '#f2ca50', lineHeight: 1, display: 'flex', alignItems: 'baseline' }}>
        <motion.span>{rounded}</motion.span>{suffix}
      </div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6d634d', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <section id="about" style={{ padding: '8rem 0', background: '#1A0F0A', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 max(5vw, 1.5rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '5rem', alignItems: 'center' }}>
        
        {/* Collage Container */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', height: '550px', width: '100%', maxWidth: '550px', margin: '0 auto' }}
        >
          {/* Glowing Aura */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />
          
          {/* Main Polaroid */}
          <motion.div 
            style={{ position: 'absolute', top: '15%', left: '0', width: '60%', height: '65%', zIndex: 2, rotate: -4 }}
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <motion.div 
              style={{ width: '100%', height: '100%', background: '#fdfbf7', padding: '12px', paddingBottom: '45px', borderRadius: '4px', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 20 }}
            >
              <img src="https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800" alt="Craftsmanship" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '0', width: '100%', textAlign: 'center', fontFamily: "'Libre Caslon Text', serif", fontSize: '0.8rem', color: '#1A0F0A' }}>The Recipe</div>
            </motion.div>
          </motion.div>

          {/* Secondary Polaroid */}
          <motion.div 
            style={{ position: 'absolute', top: '5%', right: '5%', width: '50%', height: '55%', zIndex: 1, rotate: 6 }}
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          >
            <motion.div 
              style={{ width: '100%', height: '100%', background: '#fdfbf7', padding: '10px', paddingBottom: '35px', borderRadius: '4px', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', filter: 'brightness(0.9)' }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 20, filter: 'brightness(1)' }}
            >
              <img src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=800" alt="Ingredients" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
          </motion.div>

          {/* Tertiary Polaroid */}
          <motion.div 
            style={{ position: 'absolute', bottom: '5%', right: '15%', width: '55%', height: '50%', zIndex: 3, rotate: -6 }}
            animate={{ y: [0, -18, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
          >
            <motion.div 
              style={{ width: '100%', height: '100%', background: '#fdfbf7', padding: '12px', paddingBottom: '40px', borderRadius: '4px', boxShadow: '0 35px 70px rgba(0,0,0,0.9)' }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 20 }}
            >
              <img src="https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=800" alt="Process" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '0', width: '100%', textAlign: 'center', fontFamily: "'Libre Caslon Text', serif", fontSize: '0.8rem', color: '#1A0F0A' }}>The Pour</div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.015)', padding: '3rem 2.5rem', borderRadius: '24px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4af37', fontFamily: "'DM Sans', sans-serif" }}>
            Our Craft
          </div>
          <h2 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 400, color: '#eae1d4', margin: 0, lineHeight: 1.1 }}>
            The Art of <em style={{ background: 'linear-gradient(to right, #f2ca50, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic', paddingRight: '0.1em' }}>the Shake</em>
          </h2>
          <div style={{ width: '36px', height: '2px', background: 'linear-gradient(90deg, #d4af37, transparent)' }} />
          <p style={{ fontSize: '1rem', color: 'rgba(234,225,212,0.8)', lineHeight: 1.8, margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
            We believe indulgence should be an experience of absolute refinement. Our milkshakes are not simply blended — they are orchestrated from the finest single-origin cacao and cream sourced from heirloom-breed cows.
          </p>
          <p style={{ fontSize: '1rem', color: 'rgba(234,225,212,0.8)', lineHeight: 1.8, margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
            Every signature pour is a testament to our commitment to artisanal quality. Small-batch production ensures every drop maintains the velvety texture that defines the LuxeShake legacy.
          </p>
          <div style={{ display: 'flex', gap: '3rem', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
            <AnimatedStat value={100} suffix="%" label="Natural Dairy" />
            <AnimatedStat value={3} suffix=" min" label="Per Batch" />
            <AnimatedStat value={6} suffix="+" label="Collections" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LocationsSection() {
  const [address, setAddress] = useState('New Haven, Enugu');
  const [deliveryZones, setDeliveryZones] = useState('New Haven · GRA · Trans-Ekulu · Independence Layout');

  useEffect(() => {
    api.get('/store-settings')
      .then((resp) => {
        if (resp.data && resp.data.pickup_address) {
          setAddress(resp.data.pickup_address);
        }
      })
      .catch(() => { });

    api.get('/delivery-areas')
      .then((resp) => {
        if (resp.data && resp.data.length > 0) {
          const activeAreas = resp.data
            .filter((area: any) => area.is_active)
            .map((area: any) => area.name);
          if (activeAreas.length > 0) {
            setDeliveryZones(activeAreas.join(' · '));
          }
        }
      })
      .catch(() => { });
  }, []);

  return (
    <section id="locations" style={{ padding: '7rem 0', background: '#160c08', borderTop: '1px solid rgba(212,175,55,0.08)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 max(5vw, 1.5rem)', textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4af37', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" }}>Find Us</div>
        <h2 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: '#eae1d4', marginBottom: '1rem' }}>Our Locations</h2>
        <p style={{ fontSize: '0.9rem', color: '#99907c', maxWidth: '400px', margin: '0 auto 3.5rem', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
          Visit us in person or order for delivery within Enugu, Nigeria.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
          {[
            { name: 'LuxeShake', address: address, hours: 'Mon–Sun 9am – 7pm', icon: 'store' },
            { name: 'Delivery Zones', address: 'Enugu, Nigeria', hours: 'Mon–Sun 9am – 7pm', icon: 'delivery_dining' },
          ].map(loc => (
            <div key={loc.name} style={{ background: 'rgba(36,22,17,0.6)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '20px', padding: '2rem', textAlign: 'left', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.1)'}
            >
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '28px', color: '#d4af37', display: 'block', marginBottom: '1.25rem', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 28" }}>{loc.icon}</span>
              <div style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '1.1rem', color: '#eae1d4', marginBottom: '0.5rem' }}>{loc.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#99907c', lineHeight: 1.6, marginBottom: '0.5rem', fontFamily: "'DM Sans', sans-serif" }}>{loc.address}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#d4af37', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>{loc.hours}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpaFooter({ onScrollToMenu }: { onScrollToMenu: () => void }) {
  return (
    <footer style={{ background: '#0D0804', borderTop: '1px solid rgba(212,175,55,0.08)', padding: '4rem max(5vw, 1.5rem) 2.5rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(212,175,55,0.08)', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '1.3rem', color: '#f2ca50', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>LuxeShake</div>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d4635', marginBottom: '1rem' }}>Explore</div>
            {[
              { label: 'Our Story', id: 'about' },
              { label: 'Menu', id: 'menu' },
              { label: 'Locations', id: 'locations' },
              { label: 'Contact & Feedback', id: 'contact' }
            ].map(l => (
              <button key={l.label} onClick={() => { document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' }); }} style={{ display: 'block', fontSize: '0.85rem', color: '#99907c', marginBottom: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#d4af37'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#99907c'}
              >{l.label}</button>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d4635', marginBottom: '1rem' }}>Account</div>
            {[['Log In', '/login'], ['Sign Up', '/register'], ['My Account', '/account'], ['Track Order', '/track']].map(([l, href]) => (
              <Link key={l} href={href} style={{ display: 'block', fontSize: '0.85rem', color: '#99907c', marginBottom: '0.6rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#d4af37'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#99907c'}
              >{l}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d4635', marginBottom: '1rem' }}>Legal</div>
            {[['Privacy Policy', '/privacy-policy'], ['Terms of Service', '/terms-of-service']].map(([l, href]) => (
              <Link key={l} href={href} style={{ display: 'block', fontSize: '0.85rem', color: '#99907c', marginBottom: '0.6rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#d4af37'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#99907c'}
              >{l}</Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#99907c', margin: 0 }}>© {new Date().getFullYear()} LuxeShake. All rights reserved.</p>
          <p style={{ fontSize: '0.75rem', color: '#99907c', margin: 0 }}>Powered by <a href="https://mandell.tech" target="_blank" rel="noopener noreferrer" style={{ color: '#d4af37', textDecoration: 'none' }}>MandelTech</a>.</p>
          <button onClick={onScrollToMenu} style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '9px', padding: '0.5rem 1.1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4af37', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.16)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,0.2)'; }}
          >↑ Order Now</button>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();
  const cartItems = useCartStore(s => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const scrollToMenu = () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div style={{ background: '#1A0F0A', minHeight: '100vh', color: '#eae1d4' }}>
      <SpaNavbar onOpenCart={() => setIsCartOpen(true)} cartCount={cartCount} />
      <HeroSection onScrollToMenu={scrollToMenu} />
      <AboutSection />
      <CatalogSection onOpenCart={() => setIsCartOpen(true)} />
      <LocationsSection />
      <ContactSection />
      <SpaFooter onScrollToMenu={scrollToMenu} />

      <CartFAB onClick={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} />
    </div>
  );
}
