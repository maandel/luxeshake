'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { api, fetcher } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store/authStore';
import { useToast } from '../../../context/ToastContext';

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_note: string | null;
  fulfillment_type: string;
  delivery_area_name: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  items?: OrderItem[];
  driver_phone?: string | null;
}

const getStatusLabel = (status: string, fulfillmentType: string) => {
  const s = status.toLowerCase();
  if (s === 'processing') return 'Preparing';
  if (fulfillmentType === 'pickup') {
    if (s === 'out_for_delivery') return 'Ready for Pickup';
    if (s === 'delivered') return 'Picked Up';
  } else {
    if (s === 'out_for_delivery') return 'Out for Delivery';
    if (s === 'delivered') return 'Delivered';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function AdminOrdersPage() {
  const { role } = useAuthStore();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  const url = filterStatus 
    ? `/admin/orders?page=${page}&page_size=20&status=${filterStatus}`
    : `/admin/orders?page=${page}&page_size=20`;

  const { data, isLoading, mutate } = useSWR(url, fetcher);
  const orders: Order[] = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const loading = isLoading;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [driverPhone, setDriverPhone] = useState('');

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setDriverPhone(order.driver_phone || '');
    setLoadingDetail(true);
    try {
      const resp = await api.get(`/admin/orders/${order.id}`);
      setSelectedOrder(resp.data);
      setDriverPhone(resp.data.driver_phone || '');
    } catch (err: any) {
      showToast('Failed to fetch order details.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    if (newStatus === 'out_for_delivery' && selectedOrder.fulfillment_type === 'delivery' && !driverPhone.trim()) {
      showToast("Please enter the driver's phone number before dispatching.", 'error');
      return;
    }
    setUpdatingStatus(true);
    try {
      const resp = await api.patch(`/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        driver_phone: selectedOrder.fulfillment_type === 'delivery' ? driverPhone : null
      });
      showToast(`Order status updated to ${getStatusLabel(newStatus, selectedOrder.fulfillment_type)}.`, 'success');
      setSelectedOrder(resp.data);
      // Refresh order list instantly
      mutate();
    } catch (err: any) {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
            Manage Orders
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Process customer drinks and fulfill delivery options.
          </p>
        </div>

        {/* Filters */}
        <div className="fulfillment-select-wrap" style={{ width: '200px' }}>
          <select
            className="fulfillment-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Preparing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="gold-rule"></div>

      {loading ? (
        <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Order Number</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Customer</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Phone</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Fulfillment</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Payment</th>
                  {role !== 'staff' && <th style={{ padding: '0.8rem 0.5rem' }}>Total</th>}
                  <th style={{ padding: '0.8rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((n) => (
                  <tr key={n} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '80px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '110px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '90px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '70px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '50px', height: '20px', borderRadius: '12px' }} /></td>
                    {role !== 'staff' && <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '65px', height: '16px' }} /></td>}
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '85px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '130px', height: '28px', borderRadius: '6px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No orders found.</p>
      ) : (
        <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Order Number</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Customer</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Phone</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Fulfillment</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Payment</th>
                  {role !== 'staff' && <th style={{ padding: '0.8rem 0.5rem' }}>Total</th>}
                  <th style={{ padding: '0.8rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 500 }}>{o.order_number}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{o.customer_first_name} {o.customer_last_name}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{o.customer_phone}</td>
                    <td style={{ padding: '0.8rem 0.5rem', textTransform: 'capitalize' }}>{o.fulfillment_type}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        background: o.status === 'completed' || o.status === 'delivered' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(201, 150, 62, 0.15)',
                        color: o.status === 'completed' || o.status === 'delivered' ? '#81C784' : 'var(--gold-lt)'
                      }}>
                        {getStatusLabel(o.status, o.fulfillment_type)}
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
                    {role !== 'staff' && (
                      <td style={{ padding: '0.8rem 0.5rem', color: 'var(--gold-lt)' }}>
                        ₦{o.total.toLocaleString()}
                      </td>
                    )}
                    <td style={{ padding: '0.8rem 0.5rem', color: 'var(--text-muted)' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <button onClick={() => handleViewOrder(o)} className="btn-gold" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>
                        Process
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="qty-btn" style={{ width: 'auto', padding: '0 0.8rem', borderRadius: '4px' }}>Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="qty-btn" style={{ width: 'auto', padding: '0 0.8rem', borderRadius: '4px' }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DRAWER */}
      {selectedOrder && (
        <div className="order-overlay open" style={{ zIndex: 900 }}>
          <div className="order-modal" style={{ maxWidth: '600px' }}>
            <div className="order-modal-head">
              <h3>Process Order: {selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="cart-close">✕</button>
            </div>
            <div className="order-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Status Update Form */}
              <div style={{ background: 'rgba(201, 150, 62, 0.05)', border: '1px solid rgba(201, 150, 62, 0.2)', borderRadius: '12px', padding: '1rem' }}>
                <span className="order-summary-title">Update Status</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="fulfillment-select-wrap" style={{ flex: 1 }}>
                      <select
                        className="fulfillment-select"
                        value={selectedOrder.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={updatingStatus || (selectedOrder.payment_status !== 'paid' && selectedOrder.status === 'cancelled')}
                      >
                        {selectedOrder.payment_status !== 'paid' ? (
                          <>
                            <option value="pending">Pending (Unpaid)</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        ) : (
                          <>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Preparing</option>
                            <option value="out_for_delivery">
                              {selectedOrder.fulfillment_type === 'pickup' ? 'Ready for Pickup' : 'Out for Delivery'}
                            </option>
                            <option value="delivered">
                              {selectedOrder.fulfillment_type === 'pickup' ? 'Picked Up' : 'Delivered'}
                            </option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        )}
                      </select>
                    </div>
                    {updatingStatus && <span className="spinner"></span>}
                  </div>

                  {selectedOrder.payment_status !== 'paid' && (
                    <div style={{ color: '#E57373', fontSize: '0.78rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '15px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>lock</span>
                      Fulfillment locked. Order must be paid before processing.
                    </div>
                  )}

                  {selectedOrder.fulfillment_type === 'delivery' && (
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                        Driver's Phone Number (required for dispatch)
                      </label>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          background: 'rgba(13,8,4,0.6)',
                          border: '1px solid rgba(201,150,62,0.3)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          color: '#eae1d4',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="e.g. +234 801 234 5678"
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                  <strong style={{ color: 'var(--cream)', display: 'block' }}>{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                  <strong style={{ color: 'var(--cream)', display: 'block' }}>{selectedOrder.customer_phone}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Fulfillment:</span>
                  <strong style={{ color: 'var(--cream)', display: 'block', textTransform: 'capitalize' }}>{selectedOrder.fulfillment_type}</strong>
                </div>
                {selectedOrder.fulfillment_type === 'delivery' && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Area:</span>
                    <strong style={{ color: 'var(--cream)', display: 'block' }}>{selectedOrder.delivery_area_name}</strong>
                  </div>
                )}
              </div>

              {selectedOrder.customer_note && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer Note:</span>
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-body)', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', marginTop: '0.2rem' }}>
                    "{selectedOrder.customer_note}"
                  </p>
                </div>
              )}

              {/* Order items */}
              <div style={{ borderTop: '1px solid rgba(201, 150, 62, 0.15)', paddingTop: '1rem' }}>
                <span className="order-summary-title" style={{ marginBottom: '0.8rem', display: 'block' }}>Items list</span>
                {loadingDetail ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <span className="spinner"></span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{item.product_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({item.size})</span> x {item.quantity}</span>
                        {role !== 'staff' && <strong style={{ color: 'var(--gold-lt)' }}>₦{item.line_total.toLocaleString()}</strong>}
                      </div>
                    ))}

                    {role !== 'staff' && (
                      <div style={{ borderTop: '1px solid rgba(201,150,62,0.15)', marginTop: '0.8rem', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                          <span>₦{selectedOrder.subtotal.toLocaleString()}</span>
                        </div>
                        {selectedOrder.fulfillment_type === 'delivery' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Delivery Fee</span>
                            <span>₦{selectedOrder.delivery_fee.toLocaleString()}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, color: 'var(--gold-lt)', marginTop: '0.2rem' }}>
                          <span>Total Amount</span>
                          <span>₦{selectedOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
