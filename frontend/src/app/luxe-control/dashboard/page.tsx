'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store/authStore';
import { useToast } from '../../../context/ToastContext';

interface RecentOrder {
  id: string;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  fulfillment_type: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface AnalyticsSummary {
  today_revenue: number;
  today_orders: number;
  pending_orders: number;
  paid_orders: number;
  recent_orders: RecentOrder[];
}

export default function AdminDashboardPage() {
  const { role } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchDashboardData = async () => {
    if (role === 'staff') {
      setLoading(false);
      return; // Staff doesn't have access to analytics endpoint
    }

    try {
      setLoading(true);
      const resp = await api.get('/admin/analytics/summary');
      setSummary(resp.data);
    } catch (err: any) {
      showToast('Failed to load analytics summary.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const resp = await api.get('/admin/analytics/export', { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `luxeshake_orders_${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      showToast('CSV Exported successfully.', 'success');
    } catch (err: any) {
      showToast('Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ width: '30px', height: '30px' }}></span>
      </div>
    );
  }

  // Staff View: Simple layout without financial metrics
  if (role === 'staff') {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
            Staff Workspace
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            LuxeShake Fulfillment & Complaints processing desk.
          </p>
          <div className="gold-rule"></div>
        </div>

        <div style={{ background: 'rgba(201, 150, 62, 0.05)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '2.5rem', marginTop: '2rem' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', color: 'var(--gold-lt)', marginBottom: '0.8rem' }}>Welcome to the Operations Console</h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '600px', marginBottom: '2rem' }}>
            As a staff member, your focus is managing active order fulfillment stages (preparing, dispatching) and resolving customer complaints. Financial summaries and reports are restricted to managers.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/luxe-control/orders" className="btn-gold" style={{ textDecoration: 'none' }}>
              Manage Orders
            </Link>
            <Link href="/luxe-control/tickets" className="btn-outline" style={{ textDecoration: 'none' }}>
              Complaints Desk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Manager & Superadmin View: Full analytics details
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
            LuxeControl Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Live operation metrics and financial summaries.
          </p>
        </div>
        
        <button onClick={handleExportCSV} className="btn-outline" disabled={exporting}>
          {exporting && <span className="spinner"></span>}
          Export Orders CSV
        </button>
      </div>

      <div className="gold-rule"></div>

      {/* Stats Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'rgba(26,12,8,0.4)', border: '1px solid rgba(201, 150, 62, 0.12)', borderRadius: '12px', padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Revenue</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--gold-lt)', fontFamily: 'Cormorant Garamond', marginTop: '0.5rem' }}>
            ₦{summary?.today_revenue.toLocaleString() || '0'}
          </strong>
        </div>

        <div style={{ background: 'rgba(26,12,8,0.4)', border: '1px solid rgba(201, 150, 62, 0.12)', borderRadius: '12px', padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Orders</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--cream)', fontFamily: 'Cormorant Garamond', marginTop: '0.5rem' }}>
            {summary?.today_orders || '0'}
          </strong>
        </div>

        <div style={{ background: 'rgba(26,12,8,0.4)', border: '1px solid rgba(201, 150, 62, 0.12)', borderRadius: '12px', padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Orders</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--gold)', fontFamily: 'Cormorant Garamond', marginTop: '0.5rem' }}>
            {summary?.pending_orders || '0'}
          </strong>
        </div>

        <div style={{ background: 'rgba(26,12,8,0.4)', border: '1px solid rgba(201, 150, 62, 0.12)', borderRadius: '12px', padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Paid Orders</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#81C784', fontFamily: 'Cormorant Garamond', marginTop: '0.5rem' }}>
            {summary?.paid_orders || '0'}
          </strong>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.8rem' }}>
        <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: 'var(--gold-lt)', marginBottom: '1.2rem' }}>
          Recent Transactions & Orders
        </h3>

        {summary?.recent_orders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No orders placed recently.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Order Number</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Customer</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Fulfillment</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Payment Status</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Amount</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recent_orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 500 }}>{o.order_number}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{o.customer_first_name} {o.customer_last_name}</td>
                    <td style={{ padding: '0.8rem 0.5rem', textTransform: 'capitalize' }}>{o.fulfillment_type}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        background: o.status === 'completed' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(201, 150, 62, 0.15)',
                        color: o.status === 'completed' ? '#81C784' : 'var(--gold-lt)'
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        background: o.payment_status === 'paid' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(139, 58, 42, 0.2)',
                        color: o.payment_status === 'paid' ? '#81C784' : '#E57373'
                      }}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem', color: 'var(--gold-lt)' }}>₦{o.total.toLocaleString()}</td>
                    <td style={{ padding: '0.8rem 0.5rem', color: 'var(--text-muted)' }}>
                      {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
