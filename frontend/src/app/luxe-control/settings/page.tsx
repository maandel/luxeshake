'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store/authStore';
import { useToast } from '../../../context/ToastContext';

export default function SuperadminSettingsPage() {
  const { role } = useAuthStore();
  const { showToast } = useToast();

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/store-settings');
      if (resp.data) {
        setPickupAddress(resp.data.pickup_address || '');
        setPickupPhone(resp.data.pickup_phone || '');
      }
    } catch (err: any) {
      showToast('Failed to load store settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress.trim() || !pickupPhone.trim()) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/store-settings', {
        pickup_address: pickupAddress,
        pickup_phone: pickupPhone,
      });
      showToast('Store settings updated successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to update store settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (role !== 'superadmin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e57373' }}>
        <h3>Access Denied</h3>
        <p>Only the Super Admin is authorized to edit the store settings configuration.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <span className="spinner" style={{ width: '30px', height: '30px' }}></span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
          Store settings
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          Configure dynamic locations and phone contacts for store collection orders.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: '2rem' }}></div>

      <form onSubmit={handleSave} style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#99907c', marginBottom: '0.6rem' }}>
            Store Pickup Location (Address)
          </label>
          <textarea
            style={{
              width: '100%',
              background: 'rgba(13,8,4,0.6)',
              border: '1px solid rgba(201,150,62,0.22)',
              borderRadius: '12px',
              padding: '0.9rem 1.1rem',
              color: '#eae1d4',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              outline: 'none',
              minHeight: '100px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder="e.g. LuxeShake Boutique, 12 Presidential Road, Enugu, Nigeria"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#99907c', marginBottom: '0.6rem' }}>
            Pickup Coordinate Phone Number
          </label>
          <input
            type="text"
            style={{
              width: '100%',
              background: 'rgba(13,8,4,0.6)',
              border: '1px solid rgba(201,150,62,0.22)',
              borderRadius: '12px',
              padding: '0.9rem 1.1rem',
              color: '#eae1d4',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            placeholder="e.g. +234 812 345 6789"
            value={pickupPhone}
            onChange={(e) => setPickupPhone(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-gold" style={{ alignSelf: 'flex-start', padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }} disabled={saving}>
          {saving && <span className="spinner" />}
          Save Configuration
        </button>

      </form>
    </div>
  );
}
