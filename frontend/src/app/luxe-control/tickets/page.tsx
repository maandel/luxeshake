'use client';

import React, { useEffect, useState } from 'react';
import { api, fetcher } from '../../../lib/api';
import useSWR from 'swr';
import { useAuthStore } from '../../../lib/store/authStore';
import { useToast } from '../../../context/ToastContext';

interface TicketMessage {
  id: string;
  sender_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  messages?: TicketMessage[];
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function AdminTicketsPage() {
  const { role } = useAuthStore();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  let ticketsUrl = `/admin/complaints?page=${page}&page_size=20`;
  if (filterStatus) ticketsUrl += `&status=${filterStatus}`;
  if (filterCategory) ticketsUrl += `&category=${encodeURIComponent(filterCategory)}`;
  if (filterPriority) ticketsUrl += `&priority=${filterPriority}`;

  const { data: ticketsData, isLoading: loading, mutate: mutateTickets } = useSWR(ticketsUrl, fetcher);
  const tickets: SupportTicket[] = ticketsData?.items || [];
  const totalPages = ticketsData?.total_pages || 1;

  const staffUrl = role === 'superadmin' ? '/admin/users?page=1&page_size=100' : null;
  const { data: staffData } = useSWR(staffUrl, fetcher);
  const staffUsers: AdminUser[] = React.useMemo(() => {
    return staffData?.items?.filter((u: AdminUser) => ['superadmin', 'manager', 'staff'].includes(u.role)) || [];
  }, [staffData]);

  const handleViewTicket = async (t: SupportTicket) => {
    setSelectedTicket(t);
    setLoadingDetail(true);
    setReplyText('');
    setIsInternal(false);
    setAssigneeId(t.assigned_to || '');
    try {
      const resp = await api.get(`/admin/complaints/${t.id}`);
      setSelectedTicket(resp.data);
    } catch (err: any) {
      showToast('Failed to load ticket thread.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const resp = await api.post(`/admin/complaints/${selectedTicket.id}/reply`, {
        message: replyText,
        is_internal: isInternal
      });
      setSelectedTicket(resp.data);
      setReplyText('');
      showToast('Reply sent.', 'success');
      mutateTickets();
    } catch (err: any) {
      showToast('Failed to send reply.', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatusAndPriority = async (statusVal: string, priorityVal?: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const resp = await api.patch(`/admin/complaints/${selectedTicket.id}/status`, {
        status: statusVal,
        priority: priorityVal || selectedTicket.priority
      });
      setSelectedTicket(resp.data);
      showToast('Ticket state updated.', 'success');
      mutateTickets();
    } catch (err: any) {
      showToast('Failed to update ticket state.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket || !assigneeId) return;
    setAssigning(true);
    try {
      const resp = await api.patch(`/admin/complaints/${selectedTicket.id}/assign`, {
        assigned_to: assigneeId
      });
      setSelectedTicket(resp.data);
      showToast('Ticket assigned successfully.', 'success');
      mutateTickets();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Assignment failed.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
            Complaints Desk
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Process and resolve guest and customer support tickets.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <div className="fulfillment-select-wrap" style={{ width: '150px' }}>
            <select className="fulfillment-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="fulfillment-select-wrap" style={{ width: '150px' }}>
            <select className="fulfillment-select" value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="gold-rule"></div>

      {loading ? (
        <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Ticket Number</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Submitter</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Subject</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Priority</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((n) => (
                  <tr key={n} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '80px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <div className="skeleton" style={{ width: '110px', height: '14px', marginBottom: '4px' }} />
                      <div className="skeleton" style={{ width: '140px', height: '12px' }} />
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '160px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '80px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '85px', height: '16px' }} /></td>
                    <td style={{ padding: '0.8rem 0.5rem' }}><div className="skeleton" style={{ width: '80px', height: '28px', borderRadius: '6px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No support tickets found.</p>
      ) : (
        <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Ticket Number</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Submitter</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Subject</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Priority</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 500 }}>{t.ticket_number}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <div style={{ fontWeight: 500 }}>{t.submitter_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.submitter_email}</div>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{t.subject}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{t.category}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        background: t.priority === 'high' ? 'rgba(139, 58, 42, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: t.priority === 'high' ? '#E57373' : 'var(--cream)'
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        background: t.status === 'closed' ? 'rgba(139, 58, 42, 0.2)' : 'rgba(201, 150, 62, 0.15)',
                        color: t.status === 'closed' ? '#E57373' : 'var(--gold-lt)'
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem', color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <button onClick={() => handleViewTicket(t)} className="btn-gold" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="qty-btn" style={{ width: 'auto', padding: '0 0.8rem', borderRadius: '4px' }}>Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="qty-btn" style={{ width: 'auto', padding: '0 0.8rem', borderRadius: '4px' }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET THREAD MODAL DRAWER */}
      {selectedTicket && (
        <div className="order-overlay open" style={{ zIndex: 900 }}>
          <div className="order-modal" style={{ maxWidth: '1100px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="order-modal-head">
              <h3>Ticket: {selectedTicket.ticket_number}</h3>
              <button onClick={() => setSelectedTicket(null)} className="cart-close">✕</button>
            </div>

            <div className="order-modal-body" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', padding: 0, overflow: 'hidden' }}>

              {/* LEFT COLUMN: Metadata & Actions */}
              <div style={{ background: 'rgba(13,8,4,0.4)', padding: '2rem', overflowY: 'auto', borderRight: '1px solid rgba(212,175,55,0.1)' }}>

                {/* Sender Details */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: 'var(--gold-lt)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', marginTop: 0 }}>Customer Info</h4>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--cream)', display: 'block', fontSize: '1.05rem', marginBottom: '0.3rem' }}>{selectedTicket.submitter_name}</strong>
                    <div style={{ color: 'var(--text-muted)' }}>{selectedTicket.submitter_email}</div>
                    {selectedTicket.submitter_phone && (
                      <div style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>{selectedTicket.submitter_phone}</div>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <h4 style={{ color: 'var(--gold-lt)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', marginTop: 0 }}>Subject</h4>
                  <strong style={{ color: 'var(--cream)', fontSize: '1rem', lineHeight: '1.4' }}>{selectedTicket.subject}</strong>
                </div>

                {/* State Updates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(212,175,55,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.1)' }}>
                  <div>
                    <label className="form-label">Update Status</label>
                    <div className="fulfillment-select-wrap">
                      <select
                        className="fulfillment-select"
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatusAndPriority(e.target.value)}
                        disabled={updatingStatus}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <div className="fulfillment-select-wrap">
                      <select
                        className="fulfillment-select"
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdateStatusAndPriority(selectedTicket.status, e.target.value)}
                        disabled={updatingStatus}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {role === 'superadmin' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="form-label">Assign Staff</label>
                      <div className="fulfillment-select-wrap" style={{ marginBottom: '0.8rem' }}>
                        <select
                          className="fulfillment-select"
                          value={assigneeId}
                          onChange={(e) => setAssigneeId(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {staffUsers.map((su) => (
                            <option key={su.id} value={su.id}>{su.full_name} ({su.role})</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={handleAssignTicket} className="btn-gold" style={{ width: '100%', padding: '0.8rem', fontSize: '0.8rem' }} disabled={assigning}>
                        Save Assignment
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Chat Thread & Reply */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                {/* Message Thread Area */}
                <div style={{ flex: 1, padding: '2rem 2rem 1rem 1rem', overflowY: 'auto' }}>
                  {loadingDetail ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <span className="spinner"></span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Original Complaint message */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gold-lt)', marginBottom: '1rem', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '0.8rem' }}>
                          <strong>{selectedTicket.submitter_name} (Originator)</strong>
                          <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--cream)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {selectedTicket.message}
                        </p>
                      </div>

                      {/* Replies */}
                      {selectedTicket.messages?.map((m) => {
                        const isStaff = m.sender_name !== selectedTicket.submitter_name;
                        return (
                          <div key={m.id} style={{
                            background: m.is_internal ? 'rgba(139, 58, 42, 0.15)' : (isStaff ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)'),
                            border: `1px solid ${m.is_internal ? 'rgba(139, 58, 42, 0.3)' : (isStaff ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)')}`,
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginLeft: isStaff ? '2rem' : '0',
                            marginRight: isStaff ? '0' : '2rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: m.is_internal ? '#e0967a' : (isStaff ? '#f2ca50' : 'var(--gold-lt)'), marginBottom: '1rem', borderBottom: `1px solid ${m.is_internal ? 'rgba(139, 58, 42, 0.2)' : 'rgba(212,175,55,0.1)'}`, paddingBottom: '0.8rem' }}>
                              <strong>
                                {m.sender_name}
                                {isStaff && <span style={{ opacity: 0.7, fontWeight: 400 }}> (Staff)</span>}
                                {m.is_internal && <span style={{ marginLeft: '0.5rem', background: '#8b3a2a', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', letterSpacing: '0.1em' }}>INTERNAL NOTE</span>}
                              </strong>
                              <span>{new Date(m.created_at).toLocaleString()}</span>
                            </div>
                            <p style={{ fontSize: '0.95rem', color: 'var(--cream)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                              {m.message}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Reply Form Area */}
                {selectedTicket.status !== 'closed' && (
                  <div style={{ padding: '1rem 2rem 2rem 1rem', borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(13,8,4,0.6)' }}>
                    <form onSubmit={handleSendReply}>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <textarea
                          className="form-input"
                          placeholder="Type your response here..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          style={{ width: '100%', minHeight: '200px', resize: 'vertical', fontSize: '0.95rem' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                          <input
                            type="checkbox"
                            id="internalReplyCheckbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                          />
                          <label htmlFor="internalReplyCheckbox" style={{ fontSize: '0.85rem', color: 'var(--cream)', cursor: 'pointer' }}>
                            Internal Note <span style={{ color: 'var(--text-muted)' }}>(Hidden from customer)</span>
                          </label>
                        </div>

                        <button type="submit" className="submit-order-btn" style={{ width: 'auto', margin: 0, padding: '0.8rem 2.5rem' }} disabled={sendingReply}>
                          {sendingReply && <span className="spinner"></span>}
                          Send Reply
                        </button>
                      </div>
                    </form>
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
