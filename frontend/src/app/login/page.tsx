'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store/authStore';
import { useToast } from '../../context/ToastContext';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleBtnReady, setGoogleBtnReady] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { showToast } = useToast();

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
          text: 'signin_with',
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
  }, []);

  const handleGoogleResponse = async (credentialResponse: any) => {
    setGoogleLoading(true);
    try {
      const parts = credentialResponse.credential.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const { email, sub: google_id, name } = payload;
      const resp = await api.post('/auth/google', { email, google_id, name });
      setAuth(resp.data.access_token, resp.data.role);
      showToast('Signed in with Google!', 'success');
      if (['superadmin', 'manager', 'staff'].includes(resp.data.role)) {
        router.push('/luxe-control/dashboard');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Google sign-in failed. Please try again.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { showToast('Please fill out all fields.', 'error'); return; }
    setLoading(true);
    try {
      const resp = await api.post('/auth/login', { email, password });
      showToast('Login successful!', 'success');
      const targetUrl = ['superadmin', 'manager', 'staff'].includes(resp.data.role)
        ? '/luxe-control/dashboard'
        : '/account';
      setTimeout(() => {
        setAuth(resp.data.access_token, resp.data.role);
        router.push(targetUrl);
      }, 800);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Incorrect email or password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { showToast('Please enter your email.', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password-request', { email });
      setOtpSent(true);
      showToast('6-digit OTP code sent to your email.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Request failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) { showToast('Please enter a valid 6-digit OTP.', 'error'); return; }
    setLoading(true);
    try {
      const resp = await api.post('/auth/forgot-password-verify', { email, otp: otpCode });
      setResetToken(resp.data.reset_token);
      showToast('OTP verified. Set your new password.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password-reset', { token: resetToken, new_password: newPassword });
      showToast('Password reset! You can now log in.', 'success');
      setShowForgot(false); setOtpSent(false); setResetToken(null);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Reset failed.', 'error');
    } finally {
      setLoading(false);
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

        /* ── Brand Panel (left) ── */
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
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%);
          top: -80px; left: -100px;
          animation: blobFloat 8s ease-in-out infinite;
        }
        .auth-brand-blob-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(139,58,42,0.25) 0%, transparent 70%);
          bottom: 80px; right: -60px;
          animation: blobFloat 10s ease-in-out infinite reverse;
        }
        @keyframes blobFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
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

        .auth-brand-content {
          position: relative;
          z-index: 1;
        }

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
        .auth-brand-headline em {
          color: #f2ca50;
          font-style: italic;
        }

        .auth-brand-rule {
          width: 48px;
          height: 1px;
          background: linear-gradient(90deg, #d4af37, transparent);
          margin-bottom: 1.25rem;
        }

        .auth-brand-sub {
          font-size: 0.95rem;
          color: #d0c5af;
          line-height: 1.7;
          max-width: 340px;
        }

        .auth-brand-footer {
          position: relative;
          z-index: 1;
          font-size: 0.7rem;
          color: rgba(208,197,175,0.4);
          letter-spacing: 0.05em;
        }

        /* ── Form Panel (right) ── */
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
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, #d4af37, transparent);
          margin: 1.25rem 0 2rem;
        }

        /* ── Inputs ── */
        .auth-field {
          margin-bottom: 1.25rem;
        }
        .auth-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #d0c5af;
          margin-bottom: 0.5rem;
        }
        .auth-input-wrap {
          position: relative;
        }
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

        /* ── OTP Input ── */
        .auth-otp-input {
          text-align: center;
          font-size: 2rem;
          letter-spacing: 0.4em;
          font-weight: 600;
          color: #f2ca50;
        }

        /* ── Primary CTA ── */
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
          margin-top: 0.5rem;
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: #f2ca50;
          transform: translateY(-1px);
          box-shadow: 0px 8px 28px rgba(212,175,55,0.4);
        }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Secondary / Ghost button ── */
        .auth-btn-ghost {
          width: 100%;
          background: transparent;
          color: #d0c5af;
          border: 1px solid rgba(153,144,124,0.3);
          border-radius: 16px;
          padding: 0.85rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          margin-top: 0.75rem;
        }
        .auth-btn-ghost:hover {
          border-color: rgba(212,175,55,0.5);
          color: #f2ca50;
          background: rgba(212,175,55,0.04);
        }

        /* ── Inline text link ── */
        .auth-link {
          color: #d4af37;
          text-decoration: none;
          transition: color 0.2s;
          border-bottom: 1px solid rgba(212,175,55,0.3);
          padding-bottom: 1px;
        }
        .auth-link:hover { color: #f2ca50; border-bottom-color: #f2ca50; }

        .auth-forgot-btn {
          background: none;
          border: none;
          color: #99907c;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .auth-forgot-btn:hover { color: #d4af37; }

        /* ── Divider ── */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }
        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(153,144,124,0.2);
        }
        .auth-divider-text {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #99907c;
          white-space: nowrap;
        }

        /* ── Footer note ── */
        .auth-footer-note {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.82rem;
          color: #99907c;
        }

        /* ── Spinner ── */
        .auth-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(26,15,10,0.3);
          border-top-color: #1A0F0A;
          border-radius: 50%;
          animation: authSpin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes authSpin { to { transform: rotate(360deg); } }

        /* ── OTP Step ── */
        .auth-info-box {
          background: rgba(212,175,55,0.06);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 12px;
          padding: 0.85rem 1rem;
          font-size: 0.82rem;
          color: #d0c5af;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .auth-info-box strong { color: #f2ca50; }
      `}</style>

      <div className="auth-root">
        {/* ── Left brand panel ── */}
        <div className="auth-brand">
          <div className="auth-brand-blob auth-brand-blob-1" />
          <div className="auth-brand-blob auth-brand-blob-2" />

          <Link href="/" className="auth-brand-logo">LuxeShake</Link>

          <div className="auth-brand-content">
            <div className="auth-brand-eyebrow">Member Portal</div>
            <h1 className="auth-brand-headline">
              Welcome<br />back to<br /><em>Luxury</em>
            </h1>
            <div className="auth-brand-rule" />
            <p className="auth-brand-sub">
              Sign in to access your order history.
            </p>
          </div>

          <div className="auth-brand-footer">© {new Date().getFullYear()} LuxeShake. All rights reserved.</div>
        </div>

        {/* ── Right form panel ── */}
        <div className="auth-form-panel">
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <Link href="/" className="auth-mobile-logo">LuxeShake</Link>

            {!showForgot ? (
              <>
                <h2 className="auth-form-title">Sign In</h2>
                <p className="auth-form-subtitle">Enter your credentials to continue</p>
                <div className="auth-gold-rule" />

                <form onSubmit={handleLogin} method="POST" action="">
                  <div className="auth-field">
                    <label htmlFor="user-email" className="auth-label">Email Address</label>
                    <div className="auth-input-wrap">
                      <input
                        id="user-email"
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
                  </div>

                  <div className="auth-field">
                    <label htmlFor="user-password" className="auth-label">Password</label>
                    <div className="auth-input-wrap">
                      <input
                        id="user-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="auth-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: '3rem' }}
                        required
                        autoComplete="current-password"
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

                  <div style={{ textAlign: 'right', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
                    <button type="button" className="auth-forgot-btn" onClick={() => setShowForgot(true)}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className="auth-btn-primary" disabled={loading || googleLoading}>
                    {loading && <span className="auth-spinner" />}
                    Log In
                  </button>
                </form>

                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">Or continue with</span>
                  <div className="auth-divider-line" />
                </div>

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

                <p className="auth-footer-note">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="auth-link">Create one</Link>
                </p>
              </>
            ) : (
              <>
                <h2 className="auth-form-title">
                  {!otpSent ? 'Reset Password' : !resetToken ? 'Verify Code' : 'New Password'}
                </h2>
                <p className="auth-form-subtitle">
                  {!otpSent ? 'We\'ll send a verification code to your email' : !resetToken ? `Code sent to ${email}` : 'Choose a strong new password'}
                </p>
                <div className="auth-gold-rule" />

                {!otpSent ? (
                  <form onSubmit={handleForgotRequest}>
                    <div className="auth-field">
                      <label className="auth-label">Email Address</label>
                      <input
                        type="email"
                        className="auth-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="auth-btn-primary" disabled={loading}>
                      {loading && <span className="auth-spinner" />}
                      Send Verification Code
                    </button>
                    <button type="button" className="auth-btn-ghost" onClick={() => setShowForgot(false)}>
                      ← Back to Login
                    </button>
                  </form>
                ) : !resetToken ? (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="auth-info-box">
                      Check your inbox at <strong>{email}</strong> for a 6-digit code. It may take a moment to arrive.
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Verification Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        className={`auth-input auth-otp-input`}
                        placeholder="— — — — — —"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                    <button type="submit" className="auth-btn-primary" disabled={loading}>
                      {loading && <span className="auth-spinner" />}
                      Verify Code
                    </button>
                    <button type="button" className="auth-btn-ghost" onClick={() => setOtpSent(false)}>
                      ← Change Email
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <div className="auth-field">
                      <label className="auth-label">New Password</label>
                      <input
                        type="password"
                        className="auth-input"
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="auth-btn-primary" disabled={loading}>
                      {loading && <span className="auth-spinner" />}
                      Reset Password
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
