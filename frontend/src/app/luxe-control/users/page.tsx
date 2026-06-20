'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store/authStore';
import { useToast } from '../../../context/ToastContext';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { role } = useAuthStore();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Matrix description state
  const [selectedPermission, setSelectedPermission] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (role !== 'superadmin') return;
    setLoading(true);
    try {
      const resp = await api.get('/admin/users?page=1&page_size=100');
      setUsers(resp.data || []);
    } catch (err: any) {
      showToast('Failed to load users list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      showToast('Please complete all fields.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/users', {
        email,
        full_name: fullName,
        password
      });
      showToast('Admin user created successfully with default Staff role.', 'success');
      setEmail('');
      setFullName('');
      setPassword('');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${id}/role?role=${newRole}`);
      showToast(`User role updated to ${newRole}.`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast('Failed to update role.', 'error');
    }
  };

  const handleToggleActivation = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/deactivate`);
      showToast('User activation state toggled.', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast('Operation failed.', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showToast('User permanently deleted.', 'info');
      fetchUsers();
    } catch (err: any) {
      showToast('Deletion failed.', 'error');
    }
  };

  const permissionsList = [
    { key: 'order_create', label: 'Place Orders', desc: 'Allows placing orders and selecting fulfillment options (delivery or pickup).', customer: true, staff: true, manager: true, superadmin: true },
    { key: 'support_ticket', label: 'Submit Ticket', desc: 'Allows opening support tickets for order disputes or generic issues.', customer: true, staff: true, manager: true, superadmin: true },
    { key: 'order_status', label: 'Process Fulfillments', desc: 'Allows changing order fulfillment status (accepting, preparing, dispatching, completing).', customer: false, staff: true, manager: true, superadmin: true },
    { key: 'complaint_reply', label: 'Reply to Tickets', desc: 'Allows reading support tickets, writing replies, and adding internal notes.', customer: false, staff: true, manager: true, superadmin: true },
    { key: 'view_financials', label: 'View Financial Analytics', desc: 'Allows viewing total revenue, daily sales charts, transaction history, and exporting CSV audits.', customer: false, staff: false, manager: true, superadmin: true },
    { key: 'manage_catalog', label: 'Edit Drinks Catalog', desc: 'Allows creating, modifying, and deactivating categories and menu products.', customer: false, staff: false, manager: true, superadmin: true },
    { key: 'delivery_fees', label: 'Configure Delivery Zones', desc: 'Allows adding delivery locations and adjusting dispatch area fees.', customer: false, staff: false, manager: true, superadmin: true },
    { key: 'assign_staff', label: 'Assign Tickets to Staff', desc: 'Allows assigning complaints desk tickets to specific staff/managers for resolution.', customer: false, staff: false, manager: false, superadmin: true },
    { key: 'manage_staff', label: 'Provision Staff Credentials', desc: 'Allows creating admin accounts, updating access roles, and toggling active status.', customer: false, staff: false, manager: false, superadmin: true }
  ];

  if (role !== 'superadmin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(139, 58, 42, 0.15)', border: '1px solid #8B3A2A', borderRadius: '12px' }}>
        <h3 style={{ color: '#E57373', fontFamily: 'Cormorant Garamond', fontSize: '1.6rem' }}>Access Restrained</h3>
        <p style={{ color: 'var(--text-body)', marginTop: '0.5rem' }}>Only the system Superadmin has permissions to manage administrator credentials.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
            Staff Credentials
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Provision administrative accounts and configure role-based permissions matrix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveSubTab('users')}
            className={activeSubTab === 'users' ? 'size-opt active' : 'size-opt'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Manage Accounts
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={activeSubTab === 'matrix' ? 'size-opt active' : 'size-opt'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Permissions Matrix
          </button>
        </div>
      </div>

      <div className="gold-rule"></div>

      {activeSubTab === 'users' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button onClick={() => setShowModal(true)} className="btn-gold" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem' }}>
              + Provision New Admin
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
              <span className="spinner" style={{ width: '30px', height: '30px' }}></span>
            </div>
          ) : users.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No users found.</p>
          ) : (
            <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                      <th style={{ padding: '0.8rem 0.5rem' }}>Full Name</th>
                      <th style={{ padding: '0.8rem 0.5rem' }}>Email</th>
                      <th style={{ padding: '0.8rem 0.5rem' }}>Role Access</th>
                      <th style={{ padding: '0.8rem 0.5rem' }}>Status</th>
                      <th style={{ padding: '0.8rem 0.5rem' }}>Created</th>
                      <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 500 }}>{u.full_name}</td>
                        <td style={{ padding: '0.8rem 0.5rem' }}>{u.email}</td>
                        <td style={{ padding: '0.8rem 0.5rem' }}>
                          <div className="fulfillment-select-wrap" style={{ width: '140px' }}>
                            <select
                              className="fulfillment-select"
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              style={{ padding: '0.4rem 1.8rem 0.4rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              <option value="customer">Customer</option>
                              <option value="staff">Staff</option>
                              <option value="manager">Manager</option>
                              <option value="superadmin">Superadmin</option>
                            </select>
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 0.5rem' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '100px',
                            fontSize: '0.7rem',
                            background: u.is_active ? 'rgba(46, 125, 50, 0.2)' : 'rgba(139, 58, 42, 0.2)',
                            color: u.is_active ? '#81C784' : '#E57373'
                          }}>
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td style={{ padding: '0.8rem 0.5rem', color: 'var(--text-muted)' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.8rem 0.5rem' }}>
                          <button onClick={() => handleToggleActivation(u.id)} className="btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', marginRight: '0.5rem' }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="confirm-cancel-btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ROLES & PERMISSIONS MATRIX PANEL */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>
          <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: 'var(--gold-lt)', marginBottom: '1rem' }}>Role Access Level Matrix</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                    <th style={{ padding: '0.8rem 0.5rem', textAlign: 'left' }}>System Privilege</th>
                    <th style={{ padding: '0.8rem 0.5rem' }}>Customer</th>
                    <th style={{ padding: '0.8rem 0.5rem' }}>Staff</th>
                    <th style={{ padding: '0.8rem 0.5rem' }}>Manager</th>
                    <th style={{ padding: '0.8rem 0.5rem' }}>Superadmin</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsList.map((p) => (
                    <tr
                      key={p.key}
                      style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)', cursor: 'pointer' }}
                      onClick={() => setSelectedPermission(p.key)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(201,150,62,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.8rem 0.5rem', textAlign: 'left', fontWeight: 500, color: 'var(--cream)' }}>
                        {p.label} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ⓘ</span>
                      </td>
                      <td style={{ padding: '0.8rem 0.5rem', color: p.customer ? '#81C784' : '#E57373' }}>{p.customer ? '✓' : '✕'}</td>
                      <td style={{ padding: '0.8rem 0.5rem', color: p.staff ? '#81C784' : '#E57373' }}>{p.staff ? '✓' : '✕'}</td>
                      <td style={{ padding: '0.8rem 0.5rem', color: p.manager ? '#81C784' : '#E57373' }}>{p.manager ? '✓' : '✕'}</td>
                      <td style={{ padding: '0.8rem 0.5rem', color: p.superadmin ? '#81C784' : '#E57373' }}>{p.superadmin ? '✓' : '✕'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details pane */}
          <div style={{ background: 'rgba(26, 12, 8, 0.4)', border: '1px solid rgba(201, 150, 62, 0.12)', borderRadius: '16px', padding: '1.5rem' }}>
            <h4 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.25rem', color: 'var(--gold-lt)', marginBottom: '0.8rem' }}>Privilege Details</h4>
            
            {selectedPermission ? (
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '0.5rem' }}>
                  {permissionsList.find(p => p.key === selectedPermission)?.label}
                </strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: '1.6' }}>
                  {permissionsList.find(p => p.key === selectedPermission)?.desc}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click on any system privilege in the matrix table to view its security scope details.</p>
            )}
          </div>
        </div>
      )}

      {/* CREATION FORM DIALOG */}
      {showModal && (
        <div className="order-overlay open" style={{ zIndex: 900 }}>
          <div className="order-modal" style={{ maxWidth: '450px' }}>
            <div className="order-modal-head">
              <h3>Provision Admin Account</h3>
              <button onClick={() => setShowModal(false)} className="cart-close">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="order-modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-order-btn" disabled={saving}>
                {saving && <span className="spinner"></span>}
                Provision Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
