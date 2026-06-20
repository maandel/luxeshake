'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../lib/store/authStore';
import { useToast } from '../../context/ToastContext';

const NAV_ICONS: Record<string, string> = {
  '/luxe-control/dashboard': 'dashboard',
  '/luxe-control/orders': 'receipt_long',
  '/luxe-control/products': 'local_cafe',
  '/luxe-control/delivery': 'delivery_dining',
  '/luxe-control/tickets': 'support_agent',
  '/luxe-control/users': 'manage_accounts',
  '/luxe-control/settings': 'settings',
};

export default function LuxeControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, role, clearAuth } = useAuthStore();
  const { showToast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isLoginRoute = pathname === '/luxe-control';

  useEffect(() => {
    if (isLoginRoute) { setAuthorized(true); return; }
    if (!accessToken) { router.push('/luxe-control'); return; }
    if (!['superadmin', 'manager', 'staff'].includes(role || '')) {
      showToast('Unauthorized access.', 'error');
      clearAuth();
      router.push('/luxe-control');
      return;
    }
    setAuthorized(true);
  }, [accessToken, role, pathname]);

  const handleLogout = () => {
    clearAuth();
    showToast('Signed out of Luxe Control.', 'info');
    router.push('/luxe-control');
  };

  if (!authorized) {
    return (
      <div style={{ background: '#0D0804', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid rgba(212,175,55,0.15)',
          borderTop: '2px solid #d4af37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isLoginRoute) return <>{children}</>;

  const menuItems = [
    { label: 'Dashboard', path: '/luxe-control/dashboard' },
    { label: 'Orders', path: '/luxe-control/orders' },
    { label: 'Drinks & Menu', path: '/luxe-control/products' },
    { label: 'Delivery Areas', path: '/luxe-control/delivery' },
    { label: 'Support Tickets', path: '/luxe-control/tickets' },
  ];

  if (role === 'superadmin') {
    menuItems.push({ label: 'Staff Management', path: '/luxe-control/users' });
    menuItems.push({ label: 'Store Settings', path: '/luxe-control/settings' });
  }

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Admin',
    manager: 'Manager',
    staff: 'Staff',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .lc-layout {
          min-height: 100vh;
          display: flex;
          background: #110804;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Sidebar ── */
        .lc-sidebar {
          width: 256px;
          flex-shrink: 0;
          background: #0D0804;
          border-right: 1px solid rgba(212,175,55,0.1);
          display: flex;
          flex-direction: column;
          padding: 0;
          position: relative;
          overflow: hidden;
        }

        /* Subtle top-to-bottom gradient on sidebar */
        .lc-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(212,175,55,0.03) 0%, transparent 40%);
          pointer-events: none;
        }

        .lc-sidebar-head {
          padding: 2rem 1.5rem 1.5rem;
          border-bottom: 1px solid rgba(212,175,55,0.08);
          position: relative;
          z-index: 1;
        }

        .lc-sidebar-wordmark {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.55rem;
          color: #f2ca50;
          letter-spacing: 0.04em;
          margin-bottom: 0.2rem;
          display: block;
          text-decoration: none;
        }

        .lc-sidebar-system-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(153,144,124,0.55);
        }

        /* ── Nav ── */
        .lc-nav {
          padding: 1.25rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .lc-nav-section-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(153,144,124,0.4);
          padding: 0 0.85rem;
          margin-bottom: 0.4rem;
          margin-top: 0.5rem;
        }

        .lc-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.72rem 0.85rem;
          border-radius: 10px;
          text-decoration: none;
          font-size: 0.875rem;
          color: #99907c;
          font-weight: 400;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          border-left: 2.5px solid transparent;
          margin-left: -1px;
          cursor: pointer;
          background: none;
          border-top: none;
          border-right: none;
          border-bottom: none;
          text-align: left;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
        }

        .lc-nav-item:hover {
          background: rgba(212,175,55,0.06);
          color: #d0c5af;
          border-left-color: rgba(212,175,55,0.3);
        }

        .lc-nav-item.active {
          background: rgba(212,175,55,0.1);
          color: #f2ca50;
          border-left-color: #d4af37;
          font-weight: 500;
        }

        .lc-nav-icon {
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          font-weight: 300;
          line-height: 1;
          flex-shrink: 0;
          transition: font-variation-settings 0.2s;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }

        .lc-nav-item.active .lc-nav-icon {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20;
        }

        /* ── Sidebar Footer ── */
        .lc-sidebar-footer {
          padding: 1.25rem 1.25rem 1.75rem;
          border-top: 1px solid rgba(212,175,55,0.08);
          position: relative;
          z-index: 1;
        }

        .lc-role-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(212,175,55,0.07);
          border: 1px solid rgba(212,175,55,0.18);
          border-radius: 100px;
          padding: 0.3rem 0.7rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #c9963e;
          margin-bottom: 1rem;
          width: 100%;
          justify-content: center;
        }

        .lc-role-dot {
          width: 5px; height: 5px;
          background: #c9963e;
          border-radius: 50%;
        }

        .lc-logout-btn {
          width: 100%;
          background: rgba(139, 58, 42, 0.1);
          border: 1px solid rgba(139, 58, 42, 0.35);
          border-radius: 10px;
          padding: 0.72rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          color: #c8856e;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .lc-logout-btn:hover {
          background: rgba(139, 58, 42, 0.2);
          border-color: rgba(139, 58, 42, 0.6);
          color: #e0967a;
        }

        .lc-logout-icon {
          font-family: 'Material Symbols Outlined';
          font-size: 16px;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }

        /* ── Main content ── */
        .lc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        /* Top bar */
        .lc-topbar {
          height: 60px;
          background: rgba(13, 8, 4, 0.6);
          border-bottom: 1px solid rgba(212,175,55,0.08);
          display: flex;
          align-items: center;
          padding: 0 2rem;
          gap: 1rem;
          flex-shrink: 0;
          backdrop-filter: blur(12px);
        }

        .lc-topbar-breadcrumb {
          font-size: 0.78rem;
          color: #4d4635;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .lc-topbar-breadcrumb span { color: #99907c; }

        .lc-topbar-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .lc-topbar-user {
          font-size: 0.78rem;
          color: #d0c5af;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lc-topbar-avatar {
          width: 46px; height: 46px;
          background: rgba(212,175,55,0.12);
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.05em;
        }

        .lc-content {
          flex: 1;
          padding: 2.5rem 2.5rem;
          overflow-y: auto;
          color: #eae1d4;
        }

        /* Scrollbar */
        .lc-content::-webkit-scrollbar { width: 5px; }
        .lc-content::-webkit-scrollbar-track { background: transparent; }
        .lc-content::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 10px; }

        /* -- Shared Modal/Overlay system -- */
        .order-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13, 8, 4, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }

        .order-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .order-modal {
          background: rgba(22, 12, 8, 0.98);
          border: 1px solid rgba(212, 175, 55, 0.22);
          border-radius: 24px;
          width: 100%;
          box-shadow: 
            0 24px 64px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(212, 175, 55, 0.08);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          overflow: hidden;
          transform: scale(0.95);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          color: #eae1d4;
        }

        .order-overlay.open .order-modal {
          transform: scale(1);
        }

        .order-modal-head {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(22, 12, 8, 0.4);
        }

        .order-modal-head h3 {
          margin: 0;
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: #f2ca50;
          letter-spacing: 0.02em;
        }

        .cart-close {
          background: transparent;
          border: none;
          color: #99907c;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.5rem;
          line-height: 1;
          transition: color 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cart-close:hover {
          color: #f2ca50;
          transform: scale(1.1);
        }

        .order-modal-body {
          padding: 2.5rem;
          overflow-y: auto;
          flex: 1;
        }

        /* Custom scrollbar for order modal body */
        .order-modal-body::-webkit-scrollbar {
          width: 5px;
        }
        .order-modal-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .order-modal-body::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.15);
          border-radius: 10px;
        }

        /* Submit order button inside modal */
        .submit-order-btn {
          width: 100%;
          background: linear-gradient(135deg, #d4af37 0%, #c9963e 100%);
          color: #1A0F0A;
          border: none;
          border-radius: 12px;
          padding: 0.95rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0px 4px 20px rgba(212,175,55,0.3);
          margin-top: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-order-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0px 8px 24px rgba(212,175,55,0.45);
        }

        .submit-order-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-order-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Select wraps and dropdowns */
        .fulfillment-select-wrap, .area-select-wrap {
          position: relative;
          width: 100%;
        }

        .fulfillment-select-wrap::after, .area-select-wrap::after {
          content: '▼';
          font-size: 0.6rem;
          color: #99907c;
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .fulfillment-select, .area-select {
          width: 100%;
          background: rgba(13, 8, 4, 0.8) !important;
          border: 1px solid rgba(212, 175, 55, 0.15) !important;
          border-radius: 12px !important;
          padding: 0.85rem 1.25rem !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.85rem !important;
          color: #eae1d4 !important;
          outline: none !important;
          appearance: none !important;
          -webkit-appearance: none;
          cursor: pointer;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .fulfillment-select:focus, .area-select:focus {
          border-color: rgba(212, 175, 55, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08) !important;
        }

        .fulfillment-select option, .area-select option {
          background: #16120b;
          color: #eae1d4;
        }

        /* Order summary styling in modals */
        .order-summary {
          background: rgba(212, 175, 55, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.12);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .order-summary-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #99907c;
          display: block;
          margin-bottom: 0.85rem;
        }

        .order-sum-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #eae1d4;
          margin-bottom: 0.5rem;
        }

        .order-sum-total {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(212, 175, 55, 0.15);
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          font-size: 0.95rem;
        }

        .order-sum-total strong {
          color: #f2ca50;
        }
      `}</style>

      <div className="lc-layout">
        {/* ── Sidebar ── */}
        <aside className="lc-sidebar">
          <div className="lc-sidebar-head">
            <Link href="/luxe-control/dashboard" className="lc-sidebar-wordmark">
              LuxeControl
            </Link>
            <div className="lc-sidebar-system-label">Management System</div>
          </div>

          <nav className="lc-nav">
            <div className="lc-nav-section-label">Navigation</div>
            {menuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`lc-nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="lc-nav-icon">{NAV_ICONS[item.path] || 'chevron_right'}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="lc-sidebar-footer">
            {/* Moved to topbar */}
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main className="lc-main">
          <div className="lc-topbar">
            <div className="lc-topbar-breadcrumb">
              <span style={{ color: '#4d4635' }}>LuxeControl</span>
              <span style={{ color: '#4d4635' }}>/</span>
              <span>{menuItems.find(m => pathname.startsWith(m.path))?.label || 'Dashboard'}</span>
            </div>
            <div className="lc-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
              <div
                className="lc-topbar-user"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <div className="lc-topbar-avatar" style={{ transition: 'all 0.2s', transform: dropdownOpen ? 'scale(1.05)' : 'scale(1)', borderColor: dropdownOpen ? '#f2ca50' : 'rgba(212, 175, 55, 0.4)' }}>
                  {(role || '').slice(0, 2).toUpperCase()}
                </div>
              </div>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  background: 'rgba(26, 12, 8, 0.95)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 50,
                  backdropFilter: 'blur(10px)'
                }}>
                  <div className="lc-role-chip" style={{ margin: 0, padding: '0.6rem 0.8rem', justifyContent: 'center' }}>
                    <div className="lc-role-dot" />
                    {roleLabel[role || ''] || role}
                  </div>
                  <button onClick={handleLogout} className="lc-logout-btn" style={{ margin: 0, padding: '0.6rem 0.8rem', width: '100%', background: 'rgba(212, 175, 55, 0.05)', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <span className="lc-logout-icon" style={{ fontSize: '1.1rem' }}>logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lc-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
