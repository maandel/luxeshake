'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/public/Navbar';
import GlobalFooter from '@/components/GlobalFooter';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage('Your email has been verified successfully.');
      } catch (err: any) {
        setStatus('error');
        const detail = err.response?.data?.detail;
        setMessage(detail || 'The verification link is invalid or has expired.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <>
      <Navbar />
      <main style={{
        background: '#0D0804',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'DM Sans', sans-serif",
        color: '#eae1d4'
      }}>
        <div style={{
          background: 'rgba(22, 12, 8, 0.4)',
          border: '1px solid rgba(212, 175, 55, 0.12)',
          borderRadius: '16px',
          padding: '3rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          {status === 'loading' && (
            <>
              <div style={{
                width: '40px', height: '40px', margin: '0 auto 1.5rem',
                border: '2px solid rgba(212,175,55,0.15)', borderTop: '2px solid #d4af37',
                borderRadius: '50%', animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <h2 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '1.5rem', marginBottom: '1rem', color: '#d4af37' }}>
                Verifying Email...
              </h2>
              <p style={{ color: '#99907c' }}>Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#2ecc71', marginBottom: '1rem' }}>
                check_circle
              </span>
              <h2 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '1.5rem', marginBottom: '1rem', color: '#eae1d4' }}>
                Verification Successful!
              </h2>
              <p style={{ color: '#99907c', marginBottom: '2rem' }}>{message}</p>
              <button 
                onClick={() => router.push('/login')}
                style={{
                  background: '#d4af37', color: '#0d0804', border: 'none', padding: '0.75rem 2rem',
                  borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                  width: '100%'
                }}
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#e74c3c', marginBottom: '1rem' }}>
                error
              </span>
              <h2 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '1.5rem', marginBottom: '1rem', color: '#eae1d4' }}>
                Verification Failed
              </h2>
              <p style={{ color: '#99907c', marginBottom: '2rem' }}>{message}</p>
              <button 
                onClick={() => router.push('/login')}
                style={{
                  background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', 
                  padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', 
                  cursor: 'pointer', width: '100%'
                }}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
