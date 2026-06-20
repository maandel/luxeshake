'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store/authStore';
import { useToast } from '../../../context/ToastContext';

interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
  sort_order: number;
  is_active: boolean;
}

export default function AdminDeliveryPage() {
  const { role } = useAuthStore();
  const { showToast } = useToast();

  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaFee, setAreaFee] = useState(0);
  const [areaSortOrder, setAreaSortOrder] = useState(0);
  const [areaActive, setAreaActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/delivery-areas');
      setAreas(resp.data || []);
    } catch (err: any) {
      showToast('Failed to load delivery zones.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const openNewArea = () => {
    setEditingArea(null);
    setAreaName('');
    setAreaFee(0);
    setAreaSortOrder(areas.length);
    setAreaActive(true);
    setShowModal(true);
  };

  const openEditArea = (a: DeliveryArea) => {
    setEditingArea(a);
    setAreaName(a.name);
    setAreaFee(a.fee);
    setAreaSortOrder(a.sort_order);
    setAreaActive(a.is_active);
    setShowModal(true);
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName) {
      showToast('Area name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: areaName,
        fee: areaFee,
        sort_order: areaSortOrder,
        is_active: areaActive
      };

      if (editingArea) {
        await api.put(`/admin/delivery-areas/${editingArea.id}`, payload);
        showToast('Delivery zone updated.', 'success');
      } else {
        await api.post('/admin/delivery-areas', payload);
        showToast('Delivery zone created.', 'success');
      }
      setShowModal(false);
      fetchAreas();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save delivery zone.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this delivery zone?')) return;
    try {
      await api.delete(`/admin/delivery-areas/${id}`);
      showToast('Delivery zone deactivated.', 'info');
      fetchAreas();
    } catch (err: any) {
      showToast('Deactivation failed.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
            Delivery Zones & Fees
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Set delivery dispatch fees for different locations in Enugu, Nigeria.
          </p>
        </div>

        <button onClick={openNewArea} className="btn-gold" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem' }}>
          + Add Delivery Zone
        </button>
      </div>

      <div className="gold-rule"></div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <span className="spinner" style={{ width: '30px', height: '30px' }}></span>
        </div>
      ) : areas.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No delivery zones configured.</p>
      ) : (
        <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Zone Name</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Delivery Fee (₦)</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Sort order</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Active status</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 500 }}>{a.name}</td>
                    <td style={{ padding: '0.8rem 0.5rem', color: 'var(--gold-lt)' }}>₦{a.fee.toLocaleString()}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{a.sort_order}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        background: a.is_active ? 'rgba(46, 125, 50, 0.2)' : 'rgba(139, 58, 42, 0.2)',
                        color: a.is_active ? '#81C784' : '#E57373'
                      }}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <button onClick={() => openEditArea(a)} className="btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', marginRight: '0.5rem' }}>
                        Edit
                      </button>
                      {a.is_active && (
                        <button onClick={() => handleDeleteArea(a.id)} className="confirm-cancel-btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIALOG FORM */}
      {showModal && (
        <div className="order-overlay open" style={{ zIndex: 900 }}>
          <div className="order-modal" style={{ maxWidth: '450px' }}>
            <div className="order-modal-head">
              <h3>{editingArea ? 'Edit Delivery Zone' : 'Create Delivery Zone'}</h3>
              <button onClick={() => setShowModal(false)} className="cart-close">✕</button>
            </div>
            <form onSubmit={handleSaveArea} className="order-modal-body">
              <div className="form-group">
                <label className="form-label">Zone Name (e.g. Independence Layout)</label>
                <input
                  type="text"
                  className="form-input"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Delivery Fee (₦)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={areaFee}
                    onChange={(e) => setAreaFee(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={areaSortOrder}
                    onChange={(e) => setAreaSortOrder(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="areaActiveCheckbox"
                  checked={areaActive}
                  onChange={(e) => setAreaActive(e.target.checked)}
                />
                <label htmlFor="areaActiveCheckbox" style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>
                  Active zone (visible at checkout selection)
                </label>
              </div>

              <button type="submit" className="submit-order-btn" disabled={saving}>
                {saving && <span className="spinner"></span>}
                {editingArea ? 'Save Delivery Zone' : 'Create Delivery Zone'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
