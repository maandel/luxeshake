'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store/authStore';
import { useToast } from '../../context/ToastContext';
import GlobalFooter from '../../components/GlobalFooter';
import { useMachine } from '@xstate/react';
import { authMachine } from '../../machines/authMachine';
import { isAxiosError } from 'axios';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleBtnReady, setGoogleBtnReady] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [state, send] = useMachine(authMachine);
  const loading = state.matches('loading');
  const success = state.matches('success');

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { showToast } = useToast();

  const handleGoogleResponse = async (credentialResponse: { credential: string }) => {
    setGoogleLoading(true);
    try {
      const parts = credentialResponse.credential.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const { email, sub: google_id, name } = payload;
      const resp = await api.post('/auth/google', { email, google_id, name });
      setAuth(resp.data.access_token, resp.data.role);
      showToast('Account created with Google!', 'success');
      router.push('/account');
    } catch (err: unknown) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : null;
      showToast(detail || 'Google sign-up failed. Please try again.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogleBtn = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          shape: 'rectangular',
          theme: 'filled_black',
          text: 'signup_with',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 400,
        });
        setGoogleBtnReady(true);
      }
    };

    if (window.google) {
      initGoogleBtn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleBtn;
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      showToast('Please fill out all fields.', 'error'); return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error'); return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return;
    }
    send({ type: 'SUBMIT', email });
    try {
      await api.post('/auth/register', { email, full_name: name, password });
      send({ type: 'SUCCESS' });
      showToast('Registration successful! Please check your email.', 'success');
    } catch (err: unknown) {
      const errorMsg = isAxiosError(err) ? err.response?.data?.detail : 'Registration failed. Try again.';
      send({ type: 'ERROR', error: errorMsg || 'Error' });
      showToast(errorMsg || 'Registration failed. Try again.', 'error');
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      showToast('A new verification link has been sent to your email.', 'success');
    } catch (err: unknown) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : null;
      showToast(detail || 'Failed to send verification link.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .auth-root {
          min-height: 100vh;
          display: flex;
          background: #1A0F0A;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-brand {
          display: none;
          flex: 1;
          position: relative;
          background: linear-gradient(160deg, #1A0F0A 0%, #2a1208 50%, #1A0F0A 100%);
          overflow: hidden;
          padding: 3rem;
          flex-direction: column;
          justify-content: space-between;
        }
        @media (min-width: 900px) { .auth-brand { display: flex; } }

        .auth-brand-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .auth-brand-blob-1 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%);
          top: 10%; right: -60px;
          animation: blobFloat 9s ease-in-out infinite;
        }
        .auth-brand-blob-2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(139,58,42,0.22) 0%, transparent 70%);
          bottom: 15%; left: -40px;
          animation: blobFloat 11s ease-in-out infinite reverse;
        }
        @keyframes blobFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }

        .auth-brand-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.6rem;
          color: #f2ca50;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          position: relative;
          z-index: 1;
        }

        .auth-brand-content { position: relative; z-index: 1; }

        .auth-brand-eyebrow {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #d4af37;
          margin-bottom: 1rem;
        }

        .auth-brand-headline {
          font-family: 'Libre Caslon Text', serif;
          font-size: clamp(2.2rem, 3.5vw, 3.5rem);
          font-weight: 400;
          line-height: 1.15;
          color: #eae1d4;
          margin-bottom: 1.5rem;
        }
        .auth-brand-headline em { color: #f2ca50; font-style: italic; }

        .auth-brand-rule {
          width: 48px; height: 1px;
          background: linear-gradient(90deg, #d4af37, transparent);
          margin-bottom: 1.25rem;
        }

        .auth-brand-sub {
          font-size: 0.95rem;
          color: #d0c5af;
          line-height: 1.7;
          max-width: 340px;
        }

        .auth-brand-perks {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .auth-brand-perk {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.82rem;
          color: #d0c5af;
        }
        .auth-brand-perk-dot {
          width: 6px; height: 6px;
          background: #d4af37;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .auth-brand-footer {
          position: relative;
          z-index: 1;
          font-size: 0.7rem;
          color: rgba(208,197,175,0.4);
          letter-spacing: 0.05em;
        }

        .auth-form-panel {
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.5rem 2rem;
          background: rgba(26, 15, 10, 0.95);
          position: relative;
          overflow-y: auto;
        }
        @media (min-width: 900px) {
          .auth-form-panel {
            background: linear-gradient(180deg, rgba(36,22,17,0.98) 0%, rgba(26,15,10,0.98) 100%);
            border-left: 1px solid rgba(212,175,55,0.12);
          }
        }

        .auth-mobile-logo {
          display: block;
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.4rem;
          color: #f2ca50;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          margin-bottom: 2rem;
          text-align: center;
        }
        @media (min-width: 900px) { .auth-mobile-logo { display: none; } }

        .auth-form-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 2rem;
          font-weight: 400;
          color: #eae1d4;
          margin-bottom: 0.4rem;
        }

        .auth-form-subtitle {
          font-size: 0.85rem;
          color: #99907c;
          margin-bottom: 0.25rem;
        }

        .auth-gold-rule {
          width: 40px; height: 1px;
          background: linear-gradient(90deg, #d4af37, transparent);
          margin: 1.25rem 0 2rem;
        }

        .auth-field { margin-bottom: 1.1rem; }

        .auth-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #d0c5af;
          margin-bottom: 0.5rem;
        }

        .auth-input-wrap { position: relative; }

        .auth-input {
          width: 100%;
          background: rgba(17, 8, 4, 0.7);
          border: 1px solid rgba(153,144,124,0.3);
          border-radius: 16px;
          padding: 0.85rem 1.1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          color: #eae1d4;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(153,144,124,0.5); }
        .auth-input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.1), inset 0 0 12px rgba(212,175,55,0.04);
        }

        .auth-input-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #99907c;
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
          padding: 0;
          transition: color 0.2s;
        }
        .auth-input-toggle:hover { color: #d4af37; }

        .auth-btn-primary {
          width: 100%;
          background: #d4af37;
          color: #1A0F0A;
          border: none;
          border-radius: 16px;
          padding: 0.95rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-shadow: 0px 4px 20px rgba(212,175,55,0.3);
          margin-top: 0.75rem;
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: #f2ca50;
          transform: translateY(-1px);
          box-shadow: 0px 8px 28px rgba(212,175,55,0.4);
        }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-link {
          color: #d4af37;
          text-decoration: none;
          transition: color 0.2s;
          border-bottom: 1px solid rgba(212,175,55,0.3);
          padding-bottom: 1px;
        }
        .auth-link:hover { color: #f2ca50; border-bottom-color: #f2ca50; }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }
        .auth-divider-line { flex: 1; height: 1px; background: rgba(153,144,124,0.2); }
        .auth-divider-text {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #99907c;
          white-space: nowrap;
        }

        .auth-footer-note {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.82rem;
          color: #99907c;
        }

        .auth-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(26,15,10,0.3);
          border-top-color: #1A0F0A;
          border-radius: 50%;
          animation: authSpin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes authSpin { to { transform: rotate(360deg); } }

        /* ── Email Verified Success State ── */
        .auth-success-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2rem 0;
        }
        .auth-success-icon {
          width: 80px; height: 80px;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          margin-bottom: 1.75rem;
          animation: pulseGold 2.5s ease-in-out infinite;
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.2); }
          50% { box-shadow: 0 0 0 12px rgba(212,175,55,0); }
        }
        .auth-success-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.75rem;
          color: #eae1d4;
          margin-bottom: 0.75rem;
        }
        .auth-success-text {
          font-size: 0.9rem;
          color: #d0c5af;
          line-height: 1.7;
          max-width: 320px;
          margin-bottom: 2rem;
        }
        .auth-success-text strong { color: #f2ca50; }
        .auth-btn-go-login {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #d4af37;
          color: #1A0F0A;
          text-decoration: none;
          border-radius: 16px;
          padding: 0.9rem 2rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 0px 4px 20px rgba(212,175,55,0.3);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .auth-btn-go-login:hover {
          background: #f2ca50;
          transform: translateY(-1px);
          box-shadow: 0px 8px 28px rgba(212,175,55,0.4);
        }
      `}</style>

      <div className="auth-root">
        {/* ── Left brand panel ── */}
        <div className="auth-brand">
          <div className="auth-brand-blob auth-brand-blob-1" />
          <div className="auth-brand-blob auth-brand-blob-2" />

          <Link href="/" className="auth-brand-logo">LuxeShake</Link>

          <div className="auth-brand-content">
            <div className="auth-brand-eyebrow">New Member</div>
            <h1 className="auth-brand-headline">
              Join the<br />circle of<br /><em>Indulgence</em>
            </h1>
            <div className="auth-brand-rule" />
            <p className="auth-brand-sub">
              Become part of an exclusive community that savors every sip. A world of curated luxury awaits.
            </p>
            <div className="auth-brand-perks">
              <div className="auth-brand-perk">
                <div className="auth-brand-perk-dot" />
                <span>Track your orders in real time</span>
              </div>
              <div className="auth-brand-perk">
                <div className="auth-brand-perk-dot" />
                <span>Access exclusive member preferences</span>
              </div>
              <div className="auth-brand-perk">
                <div className="auth-brand-perk-dot" />
                <span>Priority concierge support desk</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">© {new Date().getFullYear()} LuxeShake. All rights reserved.</div>
        </div>

        {/* ── Right form panel ── */}
        <div className="auth-form-panel">
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <Link href="/" className="auth-mobile-logo">LuxeShake</Link>

            <div style={{ display: success ? 'block' : 'none' }}>
              <div className="auth-success-wrap">
                <div className="auth-success-icon">✉️</div>
                <h2 className="auth-success-title">Verify Your Email</h2>
                <p className="auth-success-text">
                  We&apos;ve sent a verification link to <strong>{email}</strong>. Click the link in the email to activate your account.
                </p>
                <Link href="/login" className="auth-btn-go-login">
                  Go to Login →
                </Link>
                <div style={{ marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    style={{ background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Didn&apos;t receive the email? Resend Link
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: success ? 'none' : 'block' }}>
              <h2 className="auth-form-title">Create Account</h2>
              <p className="auth-form-subtitle">Join and start your luxury experience</p>
              <div className="auth-gold-rule" />

              {/* Google first */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', minHeight: '44px', width: '100%', position: 'relative' }}>
                  <div
                    ref={googleBtnRef}
                    style={{
                      width: '100%',
                      opacity: (googleBtnReady && !googleLoading) ? 1 : 0,
                      pointerEvents: (googleBtnReady && !googleLoading) ? 'auto' : 'none',
                      position: (googleBtnReady && !googleLoading) ? 'relative' : 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />

                  {(!googleBtnReady || googleLoading) && (
                    <div style={{
                      width: '100%',
                      height: '44px',
                      background: '#131314',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      color: '#eae1d4',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}>
                      <span className="auth-spinner" style={{ borderTopColor: '#d4af37', borderColor: 'rgba(212,175,55,0.2)', width: '16px', height: '16px' }} />
                      {googleLoading ? 'Connecting with Google...' : 'Loading Google...'}
                    </div>
                  )}
                </div>
              </div>

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">Or register with email</span>
                <div className="auth-divider-line" />
              </div>

              <form onSubmit={handleRegister} method="POST" action="">
                <div className="auth-field">
                  <label htmlFor="reg-name" className="auth-label">Full Name</label>
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    className="auth-input"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-email" className="auth-label">Email Address</label>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-password" className="auth-label">Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="auth-input"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: '3rem' }}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-confirm-password" className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="reg-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      className="auth-input"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '3rem' }}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-btn-primary" disabled={loading || googleLoading}>
                  {loading && <span className="auth-spinner" />}
                  Create Account
                </button>

                <p className="auth-footer-note">
                  Already have an account?{' '}
                  <Link href="/login" className="auth-link">Sign in</Link>
                </p>
              </form>
            </div>
          </div>
          <GlobalFooter style={{ marginTop: 'auto', paddingTop: '3rem' }} />
        </div>
      </div>
    </>
  );
}
