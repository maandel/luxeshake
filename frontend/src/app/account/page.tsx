'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store/authStore';
import { useToast } from '../../context/ToastContext';
import GlobalFooter from '../../components/GlobalFooter';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

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
  fulfillment_type: string;
  delivery_area_name: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  items?: OrderItem[];
}

interface TicketMessage {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  messages?: TicketMessage[];
}

type Tab = 'overview' | 'orders' | 'tickets' | 'profile';

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  completed: { bg: 'rgba(129, 199, 132, 0.12)', color: '#81C784', border: '1px solid rgba(129, 199, 132, 0.25)' },
  delivered: { bg: 'rgba(129, 199, 132, 0.12)', color: '#81C784', border: '1px solid rgba(129, 199, 132, 0.25)' },
  pending: { bg: 'rgba(212, 175, 55, 0.08)', color: '#eae1d4', border: '1px solid rgba(212, 175, 55, 0.15)' },
  confirmed: { bg: 'rgba(255, 183, 77, 0.12)', color: '#ffb74d', border: '1px solid rgba(255, 183, 77, 0.25)' },
  preparing: { bg: 'rgba(255, 183, 77, 0.12)', color: '#ffb74d', border: '1px solid rgba(255, 183, 77, 0.25)' },
  processing: { bg: 'rgba(255, 183, 77, 0.12)', color: '#ffb74d', border: '1px solid rgba(255, 183, 77, 0.25)' },
  out_for_delivery: { bg: 'rgba(255, 183, 77, 0.12)', color: '#ffb74d', border: '1px solid rgba(255, 183, 77, 0.25)' },
  cancelled: { bg: 'rgba(229, 115, 115, 0.12)', color: '#e57373', border: '1px solid rgba(229, 115, 115, 0.25)' },
  paid: { bg: 'rgba(129, 199, 132, 0.12)', color: '#81C784', border: '1px solid rgba(129, 199, 132, 0.25)' },
  unpaid: { bg: 'rgba(229, 115, 115, 0.12)', color: '#e57373', border: '1px solid rgba(229, 115, 115, 0.25)' },
  open: { bg: 'rgba(212, 175, 55, 0.08)', color: '#f2ca50', border: '1px solid rgba(212, 175, 55, 0.2)' },
  closed: { bg: 'rgba(229, 115, 115, 0.12)', color: '#e57373', border: '1px solid rgba(229, 115, 115, 0.25)' },
};

function getStatusStyle(status: string) {
  return STATUS_COLORS[status.toLowerCase()] || { bg: 'rgba(153,144,124,0.15)', color: '#99907c', border: '1px solid rgba(153,144,124,0.25)' };
}

const getStatusLabel = (status: string, fulfillmentType: string) => {
  const s = status.toLowerCase();
  if (s === 'processing' || s === 'preparing') return 'Preparing';
  if (fulfillmentType === 'pickup') {
    if (s === 'out_for_delivery') return 'Ready for Pickup';
    if (s === 'delivered') return 'Picked Up';
  } else {
    if (s === 'out_for_delivery') return 'Out for Delivery';
    if (s === 'delivered') return 'Delivered';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function AccountPage() {
  const router = useRouter();
  const { accessToken, role, setAuth, clearAuth } = useAuthStore();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('wrong_order');
  const [ticketMessage, setTicketMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const initializeAuthAndProfile = async () => {
      let currentToken = accessToken;

      if (!currentToken) {
        try {
          const resp = await api.post('/auth/refresh');
          const { access_token, role: newRole } = resp.data;
          setAuth(access_token, newRole);
          currentToken = access_token;
        } catch (refreshErr) {
          clearAuth();
          router.push('/login');
          return;
        }
      }

      if (!currentToken) {
        clearAuth();
        router.push('/login');
        return;
      }

      // Fetch profile
      try {
        setLoadingProfile(true);
        const resp = await api.get('/users/me');
        setProfile(resp.data);
        setFullName(resp.data.full_name);
        setEmail(resp.data.email);
      } catch (profileErr) {
        showToast('Session expired. Please log in again.', 'error');
        clearAuth();
        router.push('/login');
      } finally {
        setLoadingProfile(false);
      }
    };

    initializeAuthAndProfile();
  }, [accessToken]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const resp = await api.get('/orders/my-orders?page=1&page_size=20');
      setOrders(resp.data.items || []);
    } catch { showToast('Failed to load orders.', 'error'); }
    finally { setLoadingOrders(false); }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const resp = await api.get('/complaints/my-tickets?page=1&page_size=20');
      setTickets(resp.data.items || []);
    } catch { showToast('Failed to load tickets.', 'error'); }
    finally { setLoadingTickets(false); }
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'tickets') fetchTickets();
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) { showToast('Please fill out all fields.', 'error'); return; }
    setUpdatingProfile(true);
    try {
      const resp = await api.put('/users/me', { full_name: fullName, email });
      setProfile(resp.data);
      showToast('Profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally { setUpdatingProfile(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) { showToast('Please enter both passwords.', 'error'); return; }
    if (newPassword.length < 8) { showToast('New password must be at least 8 characters.', 'error'); return; }
    setUpdatingPassword(true);
    try {
      await api.put('/users/me/password', { old_password: oldPassword, new_password: newPassword });
      showToast('Password updated successfully.', 'success');
      setOldPassword(''); setNewPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Incorrect old password.', 'error');
    } finally { setUpdatingPassword(false); }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) { showToast('Please complete all fields.', 'error'); return; }

    if (ticketMessage.trim().length < 20) {
      showToast('Details description must be at least 20 characters long.', 'error');
      return;
    }

    setCreatingTicket(true);
    try {
      await api.post('/complaints/tickets', { subject: ticketSubject, category: ticketCategory, message: ticketMessage });
      showToast('Support ticket created.', 'success');
      setTicketSubject(''); setTicketMessage(''); setTicketCategory('wrong_order'); setShowCreateTicket(false);
      fetchTickets();
    } catch { showToast('Failed to create ticket.', 'error'); }
    finally { setCreatingTicket(false); }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingTicketDetail(true);
    try {
      const resp = await api.get(`/complaints/my-tickets/${ticket.id}`);
      setSelectedTicket(resp.data);
    } catch { showToast('Failed to load ticket details.', 'error'); }
    finally { setLoadingTicketDetail(false); }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const resp = await api.post(`/complaints/my-tickets/${selectedTicket.id}/reply`, { message: replyText });
      setSelectedTicket(resp.data);
      setReplyText('');
      showToast('Reply sent.', 'success');
      fetchTickets();
    } catch { showToast('Failed to send reply.', 'error'); }
    finally { setSendingReply(false); }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingOrderDetail(true);
    try {
      const resp = await api.get(`/orders/my-orders/${order.id}`);
      setSelectedOrder(resp.data);
    } catch { showToast('Failed to load order details.', 'error'); }
    finally { setLoadingOrderDetail(false); }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    }
    clearAuth();
    showToast('Logged out successfully.', 'info');
    router.push('/');
  };

  if (loadingProfile) {
    return (
      <div style={{ background: '#1A0F0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid rgba(212,175,55,0.15)',
          borderTop: '2px solid #d4af37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const TAB_ICONS: Record<Tab, string> = {
    overview: 'person',
    orders: 'receipt_long',
    tickets: 'support_agent',
    profile: 'manage_accounts',
  };

  const TAB_LABELS: Record<Tab, string> = {
    overview: 'Overview',
    orders: 'Order History',
    tickets: 'Support',
    profile: 'Settings',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .acc-layout {
          min-height: 100vh;
          display: flex;
          background: #110804;
          font-family: 'DM Sans', sans-serif;
          color: #eae1d4;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .acc-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: #0D0804;
          border-right: 1px solid rgba(212,175,55,0.1);
          display: flex;
          flex-direction: column;
          padding: 0;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease;
          z-index: 100;
        }

        .acc-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(212,175,55,0.03) 0%, transparent 40%);
          pointer-events: none;
        }

        .acc-sidebar-head {
          padding: 2rem 1.5rem 1.5rem;
          border-bottom: 1px solid rgba(212,175,55,0.08);
          position: relative;
          z-index: 1;
        }

        .acc-sidebar-wordmark {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.55rem;
          color: #f2ca50;
          letter-spacing: 0.04em;
          margin-bottom: 0.25rem;
          display: block;
          text-decoration: none;
        }

        .acc-sidebar-system-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(153,144,124,0.55);
        }

        .acc-user-card {
          padding: 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(212,175,55,0.08);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .acc-avatar {
          width: 44px; height: 44px;
          background: rgba(212,175,55,0.1);
          border: 1.5px solid rgba(212,175,55,0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: #f2ca50;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .acc-user-name {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.05rem;
          color: #eae1d4;
          line-height: 1.2;
        }
        .acc-user-meta {
          font-size: 0.72rem;
          color: #99907c;
          margin-top: 0.15rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 150px;
        }

        /* Nav links */
        .acc-nav {
          padding: 1.25rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .acc-nav-section-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(153,144,124,0.4);
          padding: 0 0.85rem;
          margin-bottom: 0.5rem;
        }

        .acc-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.72rem 0.85rem;
          border-radius: 10px;
          text-decoration: none;
          font-size: 0.875rem;
          color: #99907c;
          font-weight: 400;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          border-left: 2.5px solid transparent;
          margin-left: -1px;
          cursor: pointer;
          background: none;
          border-top: none;
          border-right: none;
          border-bottom: none;
          text-align: left;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
        }

        .acc-nav-item:hover {
          background: rgba(212,175,55,0.06);
          color: #d0c5af;
          border-left-color: rgba(212,175,55,0.3);
        }

        .acc-nav-item.active {
          background: rgba(212,175,55,0.1);
          color: #f2ca50;
          border-left-color: #d4af37;
          font-weight: 500;
        }

        .acc-nav-icon {
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          font-weight: 300;
          line-height: 1;
          flex-shrink: 0;
          transition: font-variation-settings 0.2s;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }

        .acc-nav-item.active .acc-nav-icon {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20;
        }

        /* Sidebar Footer */
        .acc-sidebar-footer {
          padding: 1.25rem 1.25rem 1.75rem;
          border-top: 1px solid rgba(212,175,55,0.08);
          position: relative;
          z-index: 1;
        }

        .acc-role-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(212,175,55,0.07);
          border: 1px solid rgba(212,175,55,0.18);
          border-radius: 100px;
          padding: 0.3rem 0.7rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #c9963e;
          margin-bottom: 1rem;
          width: 100%;
          justify-content: center;
        }

        .acc-role-dot {
          width: 5px; height: 5px;
          background: #c9963e;
          border-radius: 50%;
        }

        .acc-logout-btn {
          width: 100%;
          background: rgba(139, 58, 42, 0.1);
          border: 1px solid rgba(139, 58, 42, 0.35);
          border-radius: 10px;
          padding: 0.72rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          color: #c8856e;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .acc-logout-btn:hover {
          background: rgba(139, 58, 42, 0.2);
          border-color: rgba(139, 58, 42, 0.6);
          color: #e0967a;
        }

        .acc-logout-icon {
          font-family: 'Material Symbols Outlined';
          font-size: 16px;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }

        /* ── Main content ── */
        .acc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        /* Top bar */
        .acc-topbar {
          height: 60px;
          background: rgba(13, 8, 4, 0.6);
          border-bottom: 1px solid rgba(212,175,55,0.08);
          display: flex;
          align-items: center;
          padding: 0 2rem;
          gap: 1rem;
          flex-shrink: 0;
          backdrop-filter: blur(12px);
        }

        .acc-topbar-breadcrumb {
          font-size: 0.78rem;
          color: #4d4635;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .acc-topbar-breadcrumb span { color: #99907c; }

        .acc-topbar-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .acc-topbar-user {
          font-size: 0.78rem;
          color: #d0c5af;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .acc-topbar-avatar {
          width: 46px; height: 46px;
          background: rgba(212,175,55,0.12);
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.05em;
        }

        .acc-content {
          flex: 1;
          padding: 2.5rem;
          overflow-y: auto;
        }

        /* Hamburger button (mobile) */
        .acc-hamburger {
          display: none;
          background: none;
          border: none;
          color: #f2ca50;
          cursor: pointer;
          font-size: 24px;
          padding: 0;
          flex-shrink: 0;
          line-height: 1;
        }

        /* Sidebar overlay (mobile) */
        .acc-sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 90;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .acc-sidebar-overlay.open { display: block; }

        /* Close button inside sidebar header (mobile only) */
        .acc-sidebar-close {
          display: none;
          background: none;
          border: none;
          color: #99907c;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .acc-sidebar-close:hover { color: #f2ca50; }

        @media (max-width: 1024px) {
          .acc-main {
            width: 100%;
            max-width: 100vw;
          }
          .acc-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            width: 280px;
            transform: translateX(-100%);
            flex: 0 0 0;
            min-width: 0;
          }
          .acc-sidebar.open { transform: translateX(0); }
          .acc-hamburger { display: block; }
          .acc-sidebar-close { display: block; }
          .acc-topbar { padding: 0 1rem; }
          .acc-content { padding: 1.5rem 1rem; }
        }

        /* Mobile pill-tabs — hidden, replaced by drawer */
        .acc-mobile-tabs { display: none !important; }
        .acc-mobile-tab.active {
          background: rgba(212,175,55,0.12);
          border-color: #d4af37;
          color: #f2ca50;
        }

        /* ── Panel Styles ── */
        .acc-panel-card {
          background: rgba(36, 22, 17, 0.45);
          border: 1px solid rgba(212, 175, 55, 0.12);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.3);
        }

        .acc-panel-header {
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: rgba(26, 12, 8, 0.2);
        }

        .acc-panel-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.45rem;
          font-weight: 400;
          color: #eae1d4;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .acc-panel-title span {
          color: #d4af37;
          font-family: 'Material Symbols Outlined';
          font-size: 20px;
          font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }

        .acc-panel-body {
          padding: 2rem;
        }

        /* Stats Grid */
        .acc-overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.25rem;
        }

        .acc-stat-card {
          background: rgba(13, 8, 4, 0.5);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          transition: border-color 0.2s;
        }
        .acc-stat-card:hover {
          border-color: rgba(212, 175, 55, 0.2);
        }

        .acc-stat-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(212, 175, 55, 0.7);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .acc-stat-label span {
          font-family: 'Material Symbols Outlined';
          font-size: 14px;
          color: #d4af37;
        }

        .acc-stat-value {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.75rem;
          color: #f2ca50;
          line-height: 1.1;
          margin-bottom: 0.25rem;
        }

        .acc-stat-sub {
          font-size: 0.78rem;
          color: #99907c;
        }

        /* ── Tables & Badges ── */
        .acc-table-container {
          overflow-x: auto;
        }

        .acc-table {
          width: 100%;
          border-collapse: collapse;
        }

        .acc-table th {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #99907c;
          padding: 0.85rem 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(212, 175, 55, 0.12);
        }

        .acc-table td {
          padding: 1.1rem 1rem;
          font-size: 0.88rem;
          color: #eae1d4;
          border-bottom: 1px solid rgba(212, 175, 55, 0.06);
          vertical-align: middle;
        }

        .acc-table tr:hover td {
          background: rgba(212, 175, 55, 0.02);
        }

        .acc-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.22rem 0.65rem;
          border-radius: 100px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          line-height: 1;
        }

        /* ── Ticket Cards ── */
        .acc-tickets-stack {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .acc-ticket-card {
          background: rgba(13, 8, 4, 0.4);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
        }

        .acc-ticket-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          background: rgba(13, 8, 4, 0.6);
          transform: translateX(4px);
        }

        .acc-ticket-number {
          font-size: 0.68rem;
          color: #d4af37;
          margin-bottom: 0.3rem;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .acc-ticket-subject {
          font-size: 0.95rem;
          color: #eae1d4;
          font-weight: 600;
        }

        .acc-ticket-meta {
          font-size: 0.75rem;
          color: #99907c;
          margin-top: 0.35rem;
        }

        /* Forms in panel */
        .acc-form-section {
          background: rgba(13, 8, 4, 0.35);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 18px;
          padding: 2rem;
          margin-bottom: 1.75rem;
        }
        .acc-form-section:last-child {
          margin-bottom: 0;
        }

        .acc-form-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.25rem;
          color: #f2ca50;
          margin: 0 0 1.5rem;
        }

        .acc-field {
          margin-bottom: 1.25rem;
        }

        .acc-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(212, 175, 55, 0.7);
          margin-bottom: 0.5rem;
        }

        .acc-input {
          width: 100%;
          background: rgba(13, 8, 4, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 12px;
          padding: 0.85rem 1.1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          color: #eae1d4;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          box-sizing: border-box;
        }

        .acc-input:focus {
          border-color: rgba(212, 175, 55, 0.45);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
        }

        select.acc-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.15rem center;
          padding-right: 2.75rem;
          cursor: pointer;
        }
        textarea.acc-input {
          resize: none;
          height: 120px;
        }

        /* Buttons */
        .acc-btn-gold {
          background: #d4af37;
          color: #1A0F0A;
          border: none;
          border-radius: 12px;
          padding: 0.72rem 1.35rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.25);
          text-decoration: none;
        }

        .acc-btn-gold:hover:not(:disabled) {
          background: #f2ca50;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
        }

        .acc-btn-outline {
          background: transparent;
          color: #eae1d4;
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 12px;
          padding: 0.72rem 1.35rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          text-decoration: none;
        }
        .acc-btn-outline:hover {
          border-color: rgba(212, 175, 55, 0.55);
          color: #f2ca50;
          background: rgba(212, 175, 55, 0.03);
        }

        .acc-submit-btn {
          background: #d4af37;
          color: #1A0F0A;
          border: none;
          border-radius: 12px;
          padding: 0.85rem 1.65rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.25);
        }
        .acc-submit-btn:hover:not(:disabled) {
          background: #f2ca50;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(212, 175, 55, 0.35);
        }
        .acc-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Modals & Threads ── */
        .acc-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13,8,4,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .acc-modal {
          background: rgba(26,12,8,0.98);
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 24px;
          width: 100%;
          max-width: 580px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7);
          animation: accSlideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes accSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .acc-modal-head {
          padding: 1.75rem 2rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.12);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          background: rgba(26, 12, 8, 0.3);
        }

        .acc-modal-head-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.35rem;
          color: #f2ca50;
        }

        .acc-modal-head-meta {
          font-size: 0.72rem;
          color: #99907c;
          margin-top: 0.25rem;
        }

        .acc-modal-close {
          width: 32px; height: 32px;
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 8px;
          color: #99907c;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .acc-modal-close:hover {
          background: rgba(212, 175, 55, 0.12);
          color: #eae1d4;
          border-color: rgba(212, 175, 55, 0.3);
        }

        .acc-modal-body {
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .acc-modal-body::-webkit-scrollbar { width: 4px; }
        .acc-modal-body::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 10px; }

        .acc-modal-section {
          background: rgba(13, 8, 4, 0.45);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .acc-thread {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .acc-message {
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.06);
        }
        .acc-message:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .acc-message-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          margin-bottom: 0.45rem;
        }

        .acc-message-meta strong {
          color: #d4af37;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .acc-message-meta span {
          color: #99907c;
        }

        .acc-message-text {
          font-size: 0.88rem;
          color: #eae1d4;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .acc-order-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .acc-order-detail-item label {
          display: block;
          color: #99907c;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }

        .acc-order-detail-item strong {
          color: #eae1d4;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: capitalize;
        }

        .acc-items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .acc-order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: #eae1d4;
        }

        .acc-order-item-name {
          font-weight: 500;
        }

        .acc-order-item-size {
          color: #99907c;
          font-size: 0.75rem;
          margin-left: 0.4rem;
        }

        .acc-order-item-price {
          color: #f2ca50;
          font-weight: 600;
        }

        .acc-order-totals {
          border-top: 1px solid rgba(212, 175, 55, 0.12);
          padding-top: 1rem;
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-size: 0.85rem;
        }

        .acc-total-row {
          display: flex;
          justify-content: space-between;
          color: #99907c;
        }

        .acc-total-row.grand {
          color: #f2ca50;
          font-weight: 700;
          font-size: 1.05rem;
          font-family: 'Libre Caslon Text', serif;
        }

        /* Spinner elements */
        .acc-loading-spin {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(212, 175, 55, 0.15);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: accSpin 0.8s linear infinite;
        }

        .acc-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .acc-empty-text {
          color: #99907c;
          font-size: 0.95rem;
          margin-top: 0.75rem;
          line-height: 1.5;
        }
      `}</style>

      <div className="acc-layout">

        {/* ── Sidebar Overlay (mobile) ── */}
        <div
          className={`acc-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── Left Sidebar Navigation ── */}
        <aside className={`acc-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="acc-sidebar-head" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <Link href="/" className="acc-sidebar-wordmark">LuxeShake</Link>
                <div className="acc-sidebar-system-label">Member Portal</div>
              </div>
              <button className="acc-sidebar-close" onClick={() => setSidebarOpen(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
          </div>

          <div className="acc-user-card">
            <div className="acc-avatar">
              {profile ? getInitials(profile.full_name) : '?'}
            </div>
            <div>
              <div className="acc-user-name">{profile?.full_name}</div>
              <div className="acc-user-meta">{profile?.email}</div>
            </div>
          </div>

          <nav className="acc-nav">
            <div className="acc-nav-section-label">Navigation</div>
            {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
              <button
                key={tab}
                className={`acc-nav-item${activeTab === tab ? ' active' : ''}`}
                onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
              >
                <span className="acc-nav-icon">{TAB_ICONS[tab]}</span>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </nav>

          <div className="acc-sidebar-footer">
            {/* Moved to topbar */}
          </div>
        </aside>

        {/* ── Right Dashboard Panel ── */}
        <main className="acc-main">

          {/* Top Breadcrumbs Header bar */}
          <div className="acc-topbar">
            <button className="acc-hamburger" onClick={() => setSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="acc-topbar-breadcrumb">
              <span>Member Portal</span>
              <span>/</span>
              <span style={{ color: '#eae1d4' }}>{TAB_LABELS[activeTab]}</span>
            </div>
            <div className="acc-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
              {['superadmin', 'manager', 'staff'].includes(role || '') && (
                <Link href="/luxe-control/dashboard" className="acc-btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.75rem' }}>
                  <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>admin_panel_settings</span>
                  Admin Panel
                </Link>
              )}

              <div
                className="acc-topbar-user"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <div className="acc-topbar-avatar" style={{ transition: 'all 0.2s', transform: dropdownOpen ? 'scale(1.05)' : 'scale(1)', borderColor: dropdownOpen ? '#f2ca50' : 'rgba(212, 175, 55, 0.4)' }}>
                  {profile ? getInitials(profile.full_name) : '?'}
                </div>
              </div>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  background: 'rgba(26, 12, 8, 0.95)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 50,
                  backdropFilter: 'blur(10px)'
                }}>
                  <div className="acc-role-chip" style={{ margin: 0, padding: '0.6rem 0.8rem', justifyContent: 'center' }}>
                    <div className="acc-role-dot" />
                    {role === 'customer' ? 'VALUED MEMBER' : 'ADMIN ACCESS'}
                  </div>
                  <button onClick={handleLogout} className="acc-logout-btn" style={{ margin: 0, padding: '0.6rem 0.8rem', width: '100%', background: 'rgba(212, 175, 55, 0.05)', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <span className="acc-logout-icon" style={{ fontSize: '1.1rem' }}>logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Tab-selector */}
          <div className="acc-mobile-tabs">
            {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
              <button
                key={tab}
                className={`acc-mobile-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Main scrollable content view */}
          <div className="acc-content">
            <div className="acc-panel-card">

              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'overview' && (
                <>
                  <div className="acc-panel-header">
                    <h2 className="acc-panel-title">
                      <span>person</span>
                      Account Overview
                    </h2>
                  </div>

                  <div className="acc-panel-body">
                    <div className="acc-overview-grid">
                      <div className="acc-stat-card">
                        <div className="acc-stat-label">
                          <span>account_circle</span>
                          Member Name
                        </div>
                        <div className="acc-stat-value">{profile?.full_name}</div>
                        <div className="acc-stat-sub">{profile?.email}</div>
                      </div>

                      <div className="acc-stat-card">
                        <div className="acc-stat-label">
                          <span>verified</span>
                          Member Status
                        </div>
                        <div className="acc-stat-value" style={{ color: '#81C784' }}>Active</div>
                        <div className="acc-stat-sub">Validated Customer profile</div>
                      </div>
                    </div>

                    <div className="acc-form-section">
                      <h3 className="acc-form-title">Quick Actions</h3>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="acc-btn-gold" onClick={() => setActiveTab('orders')}>
                          <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px' }}>receipt_long</span>
                          View Orders
                        </button>
                        <button className="acc-btn-outline" onClick={() => setActiveTab('tickets')}>
                          <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px' }}>support_agent</span>
                          Support Desk
                        </button>
                        <Link href="/menu" className="acc-btn-outline">
                          <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px' }}>local_cafe</span>
                          Order Again
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── ORDERS TAB ── */}
              {activeTab === 'orders' && (
                <>
                  <div className="acc-panel-header">
                    <h2 className="acc-panel-title">
                      <span>receipt_long</span>
                      Order History
                    </h2>
                  </div>

                  <div className="acc-panel-body" style={{ padding: orders.length === 0 && !loadingOrders ? '2rem' : '1rem' }}>
                    {loadingOrders ? (
                      <div className="acc-table-container">
                        <table className="acc-table">
                          <thead>
                            <tr>
                              <th>Order Code</th>
                              <th>Fulfillment</th>
                              <th>Status</th>
                              <th>Payment</th>
                              <th>Total Paid</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3].map((n) => (
                              <tr key={n}>
                                <td><div className="skeleton" style={{ width: '80px', height: '16px' }} /></td>
                                <td><div className="skeleton" style={{ width: '70px', height: '16px' }} /></td>
                                <td><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }} /></td>
                                <td><div className="skeleton" style={{ width: '50px', height: '20px', borderRadius: '12px' }} /></td>
                                <td><div className="skeleton" style={{ width: '70px', height: '16px' }} /></td>
                                <td><div className="skeleton" style={{ width: '120px', height: '28px', borderRadius: '6px' }} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="acc-center">
                        <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '44px', color: '#4d4635', display: 'block', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>receipt_long</span>
                        <div className="acc-empty-text">No order logs found. Ready for your first luxury milkshake?</div>
                        <Link href="/menu" className="acc-btn-gold" style={{ marginTop: '1.75rem' }}>Explore drinks menu</Link>
                      </div>
                    ) : (
                      <div className="acc-table-container">
                        <table className="acc-table">
                          <thead>
                            <tr>
                              <th>Order Code</th>
                              <th>Fulfillment</th>
                              <th>Status</th>
                              <th>Payment</th>
                              <th>Total Paid</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o) => {
                              const sts = getStatusStyle(o.status);
                              const pts = getStatusStyle(o.payment_status);
                              return (
                                <tr key={o.id}>
                                  <td><strong>{o.order_number}</strong></td>
                                  <td style={{ textTransform: 'capitalize' }}>{o.fulfillment_type}</td>
                                  <td>
                                    <span className="acc-badge" style={{ background: sts.bg, color: sts.color, border: sts.border }}>
                                      {getStatusLabel(o.status, o.fulfillment_type)}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="acc-badge" style={{ background: pts.bg, color: pts.color, border: pts.border }}>
                                      {o.payment_status}
                                    </span>
                                  </td>
                                  <td><strong style={{ color: '#f2ca50' }}>₦{o.total.toLocaleString()}</strong></td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      <button onClick={() => handleViewOrder(o)} className="acc-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.72rem' }}>
                                        Details
                                      </button>
                                      <Link href={`/track/${o.order_number}`} className="acc-btn-gold" style={{ padding: '0.4rem 0.9rem', fontSize: '0.72rem' }}>
                                        Track
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── TICKETS TAB ── */}
              {activeTab === 'tickets' && (
                <>
                  <div className="acc-panel-header">
                    <h2 className="acc-panel-title">
                      <span>support_agent</span>
                      Support Tickets
                    </h2>
                    <button
                      className={showCreateTicket ? 'acc-btn-outline' : 'acc-btn-gold'}
                      onClick={() => setShowCreateTicket(!showCreateTicket)}
                      style={{ padding: '0.55rem 1.15rem', fontSize: '0.75rem' }}
                    >
                      {showCreateTicket ? 'Cancel' : '+ New Ticket'}
                    </button>
                  </div>

                  <div className="acc-panel-body">
                    {showCreateTicket ? (
                      <form onSubmit={handleCreateTicket} className="acc-form-section" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                        <div className="acc-field">
                          <label className="acc-label">Category</label>
                          <select className="acc-input" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                            <option value="wrong_order">Order Issue</option>
                            <option value="payment">Payment Issue</option>
                            <option value="delivery">Delivery Delay</option>
                            <option value="other">General Feedback</option>
                          </select>
                        </div>

                        <div className="acc-field">
                          <label className="acc-label">Subject *</label>
                          <input
                            type="text"
                            className="acc-input"
                            placeholder="Briefly describe your issue"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                            required
                          />
                        </div>

                        <div className="acc-field">
                          <label className="acc-label">Details * (min 20 characters)</label>
                          <textarea
                            className="acc-input"
                            placeholder="Provide details about the issue so we can help you promptly..."
                            value={ticketMessage}
                            onChange={(e) => setTicketMessage(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" className="acc-submit-btn" disabled={creatingTicket}>
                          {creatingTicket && <span className="acc-spinner" />}
                          Submit Ticket
                        </button>
                      </form>
                    ) : loadingTickets ? (
                      <div className="acc-tickets-stack">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="acc-ticket-card" style={{ cursor: 'default' }}>
                            <div style={{ flex: 1 }}>
                              <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
                              <div className="skeleton" style={{ width: '60%', height: '18px', marginBottom: '8px' }} />
                              <div className="skeleton" style={{ width: '80px', height: '12px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '12px' }} />
                          </div>
                        ))}
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="acc-center">
                        <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '44px', color: '#4d4635', display: 'block', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>support_agent</span>
                        <div className="acc-empty-text">No support logs. Need assistance? Submit a ticket and our concierge team will respond shortly.</div>
                      </div>
                    ) : (
                      <div className="acc-tickets-stack">
                        {tickets.map((t) => {
                          const ts = getStatusStyle(t.status);
                          return (
                            <div key={t.id} className="acc-ticket-card" onClick={() => handleViewTicket(t)}>
                              <div>
                                <div className="acc-ticket-number">{t.ticket_number} · {t.category}</div>
                                <div className="acc-ticket-subject">{t.subject}</div>
                                <div className="acc-ticket-meta">{new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                              </div>
                              <span className="acc-badge" style={{ background: ts.bg, color: ts.color, border: ts.border, flexShrink: 0 }}>
                                {t.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── PROFILE / SETTINGS TAB ── */}
              {activeTab === 'profile' && (
                <>
                  <div className="acc-panel-header">
                    <h2 className="acc-panel-title">
                      <span>manage_accounts</span>
                      Account Settings
                    </h2>
                  </div>

                  <div className="acc-panel-body">
                    <div className="acc-form-section">
                      <h3 className="acc-form-title">Profile Information</h3>
                      <form onSubmit={handleUpdateProfile}>
                        <div className="acc-field">
                          <label className="acc-label">Full Name</label>
                          <input type="text" className="acc-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                        <div className="acc-field">
                          <label className="acc-label">Email Address</label>
                          <input type="email" className="acc-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <button type="submit" className="acc-submit-btn" disabled={updatingProfile}>
                          {updatingProfile && <span className="acc-spinner" />}
                          Save Changes
                        </button>
                      </form>
                    </div>

                    <div className="acc-form-section">
                      <h3 className="acc-form-title">Change Password</h3>
                      <form onSubmit={handleChangePassword}>
                        <div className="acc-field">
                          <label className="acc-label">Current Password</label>
                          <input type="password" className="acc-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                        </div>
                        <div className="acc-field">
                          <label className="acc-label">New Password</label>
                          <input type="password" className="acc-input" placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="acc-submit-btn" disabled={updatingPassword}>
                          {updatingPassword && <span className="acc-spinner" />}
                          Update Password
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </main>

        {/* ── Ticket Detail Modal overlay ── */}
        {selectedTicket && (
          <div className="acc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTicket(null); }}>
            <div className="acc-modal">
              <div className="acc-modal-head">
                <div>
                  <div className="acc-modal-head-title">{selectedTicket.subject}</div>
                  <div className="acc-modal-head-meta">{selectedTicket.ticket_number} · {selectedTicket.category}</div>
                </div>
                <button className="acc-modal-close" onClick={() => setSelectedTicket(null)}>✕</button>
              </div>
              <div className="acc-modal-body">
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {['status', 'priority'].map((key) => {
                    const val = (selectedTicket as any)[key];
                    const st = getStatusStyle(val);
                    return (
                      <span key={key} className="acc-badge" style={{ background: st.bg, color: st.color, border: st.border }}>
                        {key}: {val}
                      </span>
                    );
                  })}
                </div>

                <div className="acc-modal-section">
                  {loadingTicketDetail ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem' }}><div className="acc-loading-spin" style={{ margin: '0 auto' }} /></div>
                  ) : (
                    <div className="acc-thread">
                      <div className="acc-message">
                        <div className="acc-message-meta">
                          <strong>{profile?.full_name} (You)</strong>
                          <span>{new Date(selectedTicket.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div className="acc-message-text">{(selectedTicket as any).message || 'No description provided.'}</div>
                      </div>
                      {selectedTicket.messages?.map((m) => (
                        <div key={m.id} className="acc-message">
                          <div className="acc-message-meta">
                            <strong style={{ color: m.sender_name.includes('Admin') || m.sender_name.includes('Staff') ? '#d4af37' : '#eae1d4' }}>
                              {m.sender_name}
                            </strong>
                            <span>{new Date(m.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                          <div className="acc-message-text">{m.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedTicket.status !== 'closed' && (
                  <form onSubmit={handleSendReply} className="acc-field" style={{ margin: 0 }}>
                    <label className="acc-label">Your Response</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <textarea
                        className="acc-input"
                        placeholder="Write your response here..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        required
                        style={{ height: '90px' }}
                      />
                      <button type="submit" className="acc-submit-btn" disabled={sendingReply}>
                        {sendingReply && <span className="acc-spinner" />}
                        Send Reply
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Order Detail Modal overlay ── */}
        {selectedOrder && (
          <div className="acc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
            <div className="acc-modal">
              <div className="acc-modal-head">
                <div>
                  <div className="acc-modal-head-title">Order {selectedOrder.order_number}</div>
                  <div className="acc-modal-head-meta">{new Date(selectedOrder.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
                <button className="acc-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
              <div className="acc-modal-body">
                <div className="acc-order-detail-grid">
                  <div className="acc-order-detail-item">
                    <label>Order Status</label>
                    <span className="acc-badge" style={{ ...getStatusStyle(selectedOrder.status) }}>
                      {getStatusLabel(selectedOrder.status, selectedOrder.fulfillment_type)}
                    </span>
                  </div>
                  <div className="acc-order-detail-item">
                    <label>Payment</label>
                    <span className="acc-badge" style={{ ...getStatusStyle(selectedOrder.payment_status) }}>
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                  <div className="acc-order-detail-item">
                    <label>Fulfillment</label>
                    <strong>{selectedOrder.fulfillment_type}</strong>
                  </div>
                  {selectedOrder.delivery_area_name && (
                    <div className="acc-order-detail-item">
                      <label>Delivery Area</label>
                      <strong>{selectedOrder.delivery_area_name}</strong>
                    </div>
                  )}
                </div>

                <div className="acc-modal-section">
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#99907c', marginBottom: '1.25rem' }}>
                    Items Ordered
                  </div>
                  {loadingOrderDetail ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem' }}><div className="acc-loading-spin" style={{ margin: '0 auto' }} /></div>
                  ) : (
                    <>
                      <div className="acc-items-list">
                        {selectedOrder.items?.map((item) => (
                          <div key={item.id} className="acc-order-item">
                            <span className="acc-order-item-name">
                              {item.product_name}
                              <span className="acc-order-item-size">({item.size === 'small' ? 'Small' : 'Large'})</span>
                              {' '}× {item.quantity}
                            </span>
                            <span className="acc-order-item-price">₦{item.line_total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="acc-order-totals">
                        <div className="acc-total-row">
                          <span>Subtotal</span>
                          <span>₦{selectedOrder.subtotal.toLocaleString()}</span>
                        </div>
                        {selectedOrder.fulfillment_type === 'delivery' && (
                          <div className="acc-total-row">
                            <span>Delivery Fee</span>
                            <span>₦{selectedOrder.delivery_fee.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="acc-total-row grand">
                          <span>Total Paid</span>
                          <span>₦{selectedOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <GlobalFooter style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', zIndex: 10 }} />
      </main>
    </div>
    </>
  );
}
