'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isForced, setIsForced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const resp = await api.get('/users/me');
        if (resp.data?.must_reset_password) {
          setIsForced(true);
        }
      } catch (err: any) {
        showToast('Failed to retrieve user status.', 'error');
      } finally {
        setLoading(false);
      }
    };
    checkUserStatus();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all fields.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put('/users/me/password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      showToast('Password updated successfully. Access granted.', 'success');
      // Use window.location.href to force full layout refetch/re-evaluation
      window.location.href = '/luxe-control/dashboard';
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to change password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <span className="spinner" style={{ width: '30px', height: '30px' }}></span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ marginBottom: '2rem', textAlign: isForced ? 'center' : 'left' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
          {isForced ? 'Password Reset Required' : 'Change Password'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          {isForced 
            ? 'An administrator has reset your password. You must update it before you can access the dashboard.' 
            : 'Keep your administration panel account secure by updating your credentials regularly.'}
        </p>
      </div>

      {isForced && (
        <div style={{
          background: 'rgba(139, 58, 42, 0.15)',
          border: '1px solid #8B3A2A',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#E57373',
          fontSize: '0.85rem',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          <strong>Security Notice:</strong> All other panel functionalities are locked until you successfully configure a new credentials set.
        </div>
      )}

      <form onSubmit={handlePasswordChange} style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#99907c', marginBottom: '0.6rem' }}>
            Current / Temporary Password
          </label>
          <input
            type="password"
            className="form-input"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#99907c', marginBottom: '0.6rem' }}>
            New Password
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#99907c', marginBottom: '0.6rem' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="Min. 8 characters"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-gold" style={{ padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginTop: '0.5rem' }} disabled={saving}>
          {saving && <span className="spinner" style={{ width: '14px', height: '14px' }} />}
          Update Password
        </button>

      </form>
    </div>
  );
}
