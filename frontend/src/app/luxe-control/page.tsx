'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store/authStore';
import { useToast } from '../../context/ToastContext';
import GlobalFooter from '../../components/GlobalFooter';

export default function LuxeControlLoginPage() {
  const router = useRouter();
  const { accessToken, role, setAuth, clearAuth } = useAuthStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessToken && ['superadmin', 'manager', 'staff'].includes(role || '')) {
      router.push('/luxe-control/dashboard');
    }
  }, [accessToken, role]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { showToast('Please fill out all fields.', 'error'); return; }
    setLoading(true);
    try {
      const resp = await api.post('/auth/login', { email, password });
      const userRole = resp.data.role;
      if (!['superadmin', 'manager', 'staff'].includes(userRole)) {
        showToast('Access denied. Customer accounts cannot access the admin panel.', 'error');
        clearAuth();
        return;
      }
      showToast('Welcome back to Luxe Control.', 'success');
      setTimeout(() => {
        setAuth(resp.data.access_token, userRole);
        router.push('/luxe-control/dashboard');
      }, 800);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Incorrect credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .lc-root {
          min-height: 100vh;
          background: #0D0804;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Ambient background decorations */
        .lc-bg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .lc-bg-blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%);
          top: -200px; left: -200px;
        }
        .lc-bg-blob-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(139,58,42,0.1) 0%, transparent 70%);
          bottom: -100px; right: -100px;
        }

        /* Subtle grid overlay */
        .lc-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .lc-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: rgba(22, 12, 8, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          /* Animated gold border */
          border: 1px solid rgba(212,175,55,0.25);
          box-shadow:
            0 0 0 1px rgba(212,175,55,0.05),
            0 24px 64px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(212,175,55,0.08);
        }

        .lc-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 25px;
          background: linear-gradient(135deg,
            rgba(212,175,55,0.35) 0%,
            transparent 40%,
            transparent 60%,
            rgba(212,175,55,0.15) 100%
          );
          z-index: -1;
          opacity: 0.6;
        }

        .lc-top {
          text-align: center;
          margin-bottom: 2.25rem;
        }

        .lc-system-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(212,175,55,0.08);
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 100px;
          padding: 0.3rem 0.85rem;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #d4af37;
          margin-bottom: 1.5rem;
        }
        .lc-system-badge-dot {
          width: 5px; height: 5px;
          background: #d4af37;
          border-radius: 50%;
          animation: lcPulse 2s ease-in-out infinite;
        }
        @keyframes lcPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .lc-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 2.2rem;
          font-weight: 400;
          color: #f2ca50;
          letter-spacing: 0.05em;
          margin-bottom: 0.3rem;
          line-height: 1;
        }

        .lc-logo-sub {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(153,144,124,0.7);
        }

        .lc-rule {
          width: 36px; height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          margin: 1.5rem auto;
        }

        /* Form */
        .lc-field { margin-bottom: 1.2rem; }

        .lc-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #99907c;
          margin-bottom: 0.5rem;
        }

        .lc-input-wrap { position: relative; }

        .lc-input {
          width: 100%;
          background: rgba(13, 8, 4, 0.8);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 12px;
          padding: 0.9rem 1.1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #eae1d4;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          box-sizing: border-box;
        }
        .lc-input::placeholder { color: rgba(153,144,124,0.4); }
        .lc-input:focus {
          border-color: rgba(212,175,55,0.5);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.08), inset 0 0 16px rgba(212,175,55,0.03);
        }

        .lc-input-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #4d4635;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
          transition: color 0.2s;
        }
        .lc-input-toggle:hover { color: #d4af37; }

        .lc-btn {
          width: 100%;
          background: linear-gradient(135deg, #d4af37 0%, #c9963e 100%);
          color: #0D0804;
          border: none;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0px 4px 24px rgba(212,175,55,0.35);
          margin-top: 1.75rem;
        }
        .lc-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0px 8px 32px rgba(212,175,55,0.45);
        }
        .lc-btn:active:not(:disabled) { transform: translateY(0); }
        .lc-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .lc-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(13,8,4,0.25);
          border-top-color: #0D0804;
          border-radius: 50%;
          animation: lcSpin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes lcSpin { to { transform: rotate(360deg); } }

        .lc-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.72rem;
          color: rgba(153,144,124,0.45);
          line-height: 1.6;
        }
        .lc-footer a {
          color: rgba(212,175,55,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .lc-footer a:hover { color: #d4af37; }
      `}</style>

      <div className="lc-root">
        <div className="lc-bg-blob lc-bg-blob-1" />
        <div className="lc-bg-blob lc-bg-blob-2" />

        <div className="lc-card">
          <div className="lc-top">
            <div className="lc-system-badge">
              <div className="lc-system-badge-dot" />
              Internal System
            </div>
            <h1 className="lc-logo">LuxeControl</h1>
            <div className="lc-logo-sub">Administration Panel</div>
            <div className="lc-rule" />
          </div>

          <form onSubmit={handleAdminLogin} method="POST" action="">
            <div className="lc-field">
              <label htmlFor="admin-email" className="lc-label">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                name="email"
                className="lc-input"
                placeholder="admin@luxeshake.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="lc-field">
              <label htmlFor="admin-password" className="lc-label">Password</label>
              <div className="lc-input-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="lc-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '3rem' }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lc-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="lc-btn" disabled={loading}>
              {loading && <span className="lc-spinner" />}
              Authenticate
            </button>
          </form>

          <div className="lc-footer">
            Restricted access — authorised personnel only.<br />
            <a href="/login">← Return to Customer Portal</a>
          </div>
        </div>

        <GlobalFooter style={{ marginTop: 'auto', paddingTop: '2rem', zIndex: 1 }} />
      </div>
    </>
  );
}
