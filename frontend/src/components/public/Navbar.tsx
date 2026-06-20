'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/authStore';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

interface NavbarProps {
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, role, clearAuth } = useAuthStore();
  const { showToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = ['superadmin', 'manager', 'staff'].includes(role || '');
  const isMenuPage = pathname === '/menu';

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* still clear */ }
    clearAuth();
    showToast('You have been logged out.', 'info');
    router.push('/');
    setMobileOpen(false);
  };

  const NAV_LINKS = [
    { label: 'Our Story', href: '/#about' },
    { label: 'The Menu', href: '/menu' },
    { label: 'Locations', href: '/#locations' },
    { label: 'Contact', href: '/#contact' },
    { label: 'Track Order', href: '/track' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .nav-bar {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 50;
          background: rgba(26, 15, 10, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(212,175,55,0.1);
          font-family: 'DM Sans', sans-serif;
        }

        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 max(5vw, 1.5rem);
          gap: 2rem;
        }

        /* ── Logo ── */
        .nav-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.3rem;
          color: #f2ca50;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .nav-logo:hover { color: #fff8e7; }

        /* ── Center links ── */
        .nav-links {
          display: none;
          align-items: center;
          gap: 2.25rem;
          flex: 1;
          justify-content: center;
        }
        @media (min-width: 768px) { .nav-links { display: flex; } }

        .nav-link {
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(234,225,212,0.7);
          text-decoration: none;
          letter-spacing: 0.04em;
          position: relative;
          transition: color 0.2s;
          padding-bottom: 2px;
          white-space: nowrap;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0;
          height: 1px;
          background: #d4af37;
          transition: width 0.3s ease;
        }
        .nav-link:hover { color: #eae1d4; }
        .nav-link:hover::after { width: 100%; }
        .nav-link.active { color: #f2ca50; }
        .nav-link.active::after { width: 100%; }

        /* ── Trailing actions ── */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
          flex-shrink: 0;
        }

        /* Auth link */
        .nav-auth-link {
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(234,225,212,0.65);
          text-decoration: none;
          transition: color 0.2s;
          display: none;
          white-space: nowrap;
        }
        @media (min-width: 768px) { .nav-auth-link { display: block; } }
        .nav-auth-link:hover { color: #f2ca50; }

        .nav-auth-btn {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(234,225,212,0.65);
          cursor: pointer;
          transition: color 0.2s;
          display: none;
          white-space: nowrap;
          padding: 0;
        }
        @media (min-width: 768px) { .nav-auth-btn { display: block; } }
        .nav-auth-btn:hover { color: #E57373; }

        /* Cart icon */
        .nav-cart-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #d4af37;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.3rem;
          transition: transform 0.2s, color 0.2s;
          font-family: 'Material Symbols Outlined';
          font-size: 22px;
          font-weight: 300;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .nav-cart-btn:hover { transform: scale(1.1); color: #f2ca50; }

        /* Order Now CTA */
        .nav-cta {
          display: none;
          background: #d4af37;
          color: #1A0F0A;
          text-decoration: none;
          border-radius: 10px;
          padding: 0.55rem 1.15rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          box-shadow: 0px 4px 16px rgba(212,175,55,0.3);
          white-space: nowrap;
        }
        @media (min-width: 768px) { .nav-cta { display: inline-block; } }
        .nav-cta:hover {
          background: #f2ca50;
          transform: translateY(-1px);
          box-shadow: 0px 6px 22px rgba(212,175,55,0.4);
        }
        .nav-cta:active { transform: translateY(0); }

        /* Mobile hamburger */
        .nav-hamburger {
          background: none;
          border: none;
          color: #d4af37;
          cursor: pointer;
          font-family: 'Material Symbols Outlined';
          font-size: 24px;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          padding: 0.2rem;
          display: flex;
          align-items: center;
        }
        @media (min-width: 768px) { .nav-hamburger { display: none; } }

        /* Mobile drawer */
        .nav-mobile-drawer {
          position: fixed;
          top: 72px;
          left: 0;
          right: 0;
          background: rgba(22, 12, 8, 0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(212,175,55,0.1);
          padding: 1.5rem max(5vw, 1.5rem) 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          z-index: 49;
          transform: translateY(-8px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }
        .nav-mobile-drawer.open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        .nav-mobile-link {
          font-size: 1rem;
          color: rgba(234,225,212,0.75);
          text-decoration: none;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(212,175,55,0.06);
          transition: color 0.2s;
          font-weight: 400;
        }
        .nav-mobile-link:hover { color: #f2ca50; }
        .nav-mobile-link:last-child { border-bottom: none; }

        .nav-mobile-divider {
          height: 1px;
          background: rgba(212,175,55,0.08);
          margin: 0.75rem 0;
        }

        .nav-mobile-auth-btn {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 400;
          color: rgba(234,225,212,0.75);
          cursor: pointer;
          text-align: left;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(212,175,55,0.06);
          transition: color 0.2s;
          width: 100%;
        }
        .nav-mobile-auth-btn:hover { color: #E57373; }

        .nav-mobile-cta {
          display: block;
          margin-top: 1rem;
          background: #d4af37;
          color: #1A0F0A;
          text-decoration: none;
          border-radius: 12px;
          padding: 0.9rem 1.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-align: center;
          box-shadow: 0 4px 16px rgba(212,175,55,0.3);
          transition: background 0.2s;
        }
        .nav-mobile-cta:hover { background: #f2ca50; }
      `}</style>

      {/* ── Main navbar ── */}
      <nav className="nav-bar">
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo" onClick={() => setMobileOpen(false)}>
            LuxeShake
          </Link>

          {/* Center nav links — desktop only */}
          <div className="nav-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${pathname === link.href ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Trailing actions */}
          <div className="nav-actions">
            {/* Auth state — desktop */}
            {isAuthenticated ? (
              <>
                <Link
                  href={isAdmin ? '/luxe-control/dashboard' : '/account'}
                  className="nav-auth-link"
                >
                  {isAdmin ? 'Dashboard' : 'My Account'}
                </Link>
                <button onClick={handleLogout} className="nav-auth-btn">
                  Log Out
                </button>
              </>
            ) : (
              <Link href="/login" className="nav-auth-link">
                Log In
              </Link>
            )}

            {/* Cart icon */}
            {onOpenCart && (
              <button onClick={onOpenCart} className="nav-cart-btn" aria-label="Open cart">
                shopping_bag
              </button>
            )}

            {/* Order Now CTA — hidden on /menu (already there) */}
            {!isMenuPage && (
              <Link href="/menu" className="nav-cta">
                Order Now
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="nav-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? 'close' : 'menu'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <div className={`nav-mobile-drawer${mobileOpen ? ' open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        <div className="nav-mobile-divider" />

        {isAuthenticated ? (
          <>
            <Link
              href={isAdmin ? '/luxe-control/dashboard' : '/account'}
              className="nav-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {isAdmin ? 'Dashboard' : 'My Account'}
            </Link>
            <button className="nav-mobile-auth-btn" onClick={handleLogout}>
              Log Out
            </button>
          </>
        ) : (
          <Link href="/login" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Log In
          </Link>
        )}

        {!isMenuPage && (
          <Link href="/menu" className="nav-mobile-cta" onClick={() => setMobileOpen(false)}>
            Order Now
          </Link>
        )}
      </div>
    </>
  );
};

export default Navbar;
