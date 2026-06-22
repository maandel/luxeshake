'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import GlobalFooter from '../../components/GlobalFooter';

interface TicketMessage {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  submitter_name: string;
  submitter_email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  messages?: TicketMessage[];
}

export default function TrackComplaintPage() {
  const { showToast } = useToast();
  const [ticketNumber, setTicketNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);

  const [ticketFocused, setTicketFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber || !email) {
      showToast('Please fill out all fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      const resp = await api.get(`/complaints/track-ticket`, {
        params: { ticket_number: ticketNumber.trim(), email: email.trim() }
      });
      setTicket(resp.data);
      showToast('Ticket found.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Ticket not found or email mismatch.', 'error');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .complaint-page {
          min-height: 100vh;
          background: #1A0F0A;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient Blobs */
        .complaint-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .complaint-blob-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%);
          top: -100px;
          left: -150px;
        }
        .complaint-blob-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139,58,42,0.08) 0%, transparent 70%);
          bottom: 10%;
          right: -100px;
        }

        /* Header */
        .complaint-header {
          background: rgba(26, 12, 8, 0.95);
          border-bottom: 1px solid rgba(212,175,55,0.12);
          padding: 0 max(5vw, 1.5rem);
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .complaint-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.3rem;
          color: #f2ca50;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
        }
        .complaint-logo:hover { color: #fff8e7; }

        .complaint-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.7);
          text-decoration: none;
          padding: 0.5rem 1rem;
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 9px;
          transition: all 0.2s;
        }
        .complaint-back-btn:hover {
          color: #f2ca50;
          border-color: rgba(212,175,55,0.5);
          background: rgba(212,175,55,0.06);
        }

        /* Main Container */
        .complaint-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.5rem max(5vw, 1.5rem);
          position: relative;
          z-index: 2;
          box-sizing: border-box;
        }

        /* Card */
        .complaint-card {
          background: rgba(36, 22, 17, 0.75);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 28px;
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 650px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.06);
          box-sizing: border-box;
        }

        .complaint-card-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #d4af37;
          text-align: center;
          margin-bottom: 0.6rem;
        }

        .complaint-card-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: clamp(1.75rem, 4vw, 2.2rem);
          font-weight: 400;
          color: #eae1d4;
          text-align: center;
          line-height: 1.2;
          margin: 0 0 0.6rem;
        }

        .complaint-card-title em {
          color: #f2ca50;
          font-style: italic;
        }

        .complaint-divider {
          width: 36px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          margin: 0 auto 2rem;
        }

        /* Form */
        .complaint-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .complaint-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .complaint-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(212, 175, 55, 0.7);
        }

        .complaint-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .complaint-input-icon {
          position: absolute;
          left: 1rem;
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          color: rgba(212, 175, 55, 0.5);
          pointer-events: none;
          transition: color 0.2s;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
          line-height: 1;
        }

        .complaint-input {
          width: 100%;
          background: rgba(13, 8, 4, 0.55);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 12px;
          padding: 0.85rem 1rem 0.85rem 2.75rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          color: #eae1d4;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
          box-sizing: border-box;
        }

        .complaint-input::placeholder {
          color: rgba(153, 144, 124, 0.4);
        }

        .complaint-input:focus {
          border-color: rgba(212, 175, 55, 0.5);
          background: rgba(13, 8, 4, 0.75);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
        }

        .complaint-input-wrap.focused .complaint-input-icon {
          color: #d4af37;
        }

        .complaint-btn-submit {
          width: 100%;
          background: #d4af37;
          color: #1A0F0A;
          border: none;
          border-radius: 12px;
          padding: 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
          transition: all 0.25s ease;
          margin-top: 1rem;
        }

        .complaint-btn-submit:hover:not(:disabled) {
          background: #f2ca50;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(212, 175, 55, 0.45);
        }

        .complaint-btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .complaint-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .complaint-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(26, 15, 10, 0.2);
          border-top-color: #1A0F0A;
          border-radius: 50%;
          animation: complaintSpin 0.75s linear infinite;
        }

        @keyframes complaintSpin { to { transform: rotate(360deg); } }

        /* Ticket details layout */
        .ticket-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(212, 175, 55, 0.12);
          padding-bottom: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .ticket-num-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.6rem;
          color: #f2ca50;
          margin: 0.15rem 0 0;
        }

        /* Status & Priority Badges */
        .ticket-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.65rem;
          border-radius: 100px;
          line-height: 1;
        }
        .ticket-badge.open {
          background: rgba(212, 175, 55, 0.08);
          color: #eae1d4;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        .ticket-badge.in-progress {
          background: rgba(255, 183, 77, 0.12);
          color: #ffb74d;
          border: 1px solid rgba(255, 183, 77, 0.25);
        }
        .ticket-badge.resolved {
          background: rgba(129, 199, 132, 0.12);
          color: #81c784;
          border: 1px solid rgba(129, 199, 132, 0.25);
        }
        .ticket-badge.closed {
          background: rgba(229, 115, 115, 0.12);
          color: #e57373;
          border: 1px solid rgba(229, 115, 115, 0.25);
        }

        .ticket-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          background: rgba(13, 8, 4, 0.45);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .ticket-meta-label {
          color: #99907c;
          font-size: 0.78rem;
          display: block;
          margin-bottom: 0.25rem;
        }

        .ticket-meta-val {
          color: #eae1d4;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .ticket-subject-box {
          margin-bottom: 1.75rem;
        }

        /* Message Thread */
        .ticket-thread {
          background: rgba(13, 8, 4, 0.55);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          max-height: 350px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ticket-thread::-webkit-scrollbar {
          width: 4px;
        }
        .ticket-thread::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2);
          border-radius: 10px;
        }

        .message-bubble {
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.06);
        }
        .message-bubble:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          margin-bottom: 0.5rem;
        }

        .message-sender {
          color: #f2ca50;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .message-date {
          color: #99907c;
        }

        .message-body {
          font-size: 0.88rem;
          color: #eae1d4;
          line-height: 1.55;
          margin: 0;
          white-space: pre-wrap;
        }

        .ticket-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: transparent;
          color: #99907c;
          border: 1px solid rgba(153, 144, 124, 0.3);
          border-radius: 9px;
          padding: 0.45rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .ticket-btn-secondary:hover {
          border-color: rgba(212, 175, 55, 0.45);
          color: #f2ca50;
          background: rgba(212, 175, 55, 0.04);
        }
      `}</style>

      <div className="complaint-page">
        <div className="complaint-blob complaint-blob-1" />
        <div className="complaint-blob complaint-blob-2" />

        {/* Header */}
        <header className="complaint-header">
          <Link href="/" className="complaint-logo">LuxeShake</Link>
          <Link href="/" className="complaint-back-btn">
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>arrow_back</span>
            Back Home
          </Link>
        </header>

        {/* Container */}
        <main className="complaint-container">
          <div className="complaint-card">
            
            {!ticket ? (
              /* ─── Search Mode ─── */
              <>
                <div className="complaint-card-label">Support Center</div>
                <h1 className="complaint-card-title">Track <em>Ticket</em></h1>
                <div className="complaint-divider" />
                
                <form onSubmit={handleTrack} className="complaint-form" noValidate>
                  <div className="complaint-field">
                    <label className="complaint-label">Ticket Number *</label>
                    <div className={`complaint-input-wrap${ticketFocused ? ' focused' : ''}`}>
                      <span className="complaint-input-icon">tag</span>
                      <input
                        type="text"
                        className="complaint-input"
                        placeholder="e.g. TKT-000001"
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value)}
                        onFocus={() => setTicketFocused(true)}
                        onBlur={() => setTicketFocused(false)}
                        required
                      />
                    </div>
                  </div>

                  <div className="complaint-field">
                    <label className="complaint-label">Email Address *</label>
                    <div className={`complaint-input-wrap${emailFocused ? ' focused' : ''}`}>
                      <span className="complaint-input-icon">mail</span>
                      <input
                        type="email"
                        className="complaint-input"
                        placeholder="e.g. customer@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="complaint-btn-submit" disabled={loading}>
                    {loading && <span className="complaint-spinner"></span>}
                    Track Complaint Ticket
                  </button>
                </form>
              </>
            ) : (
              /* ─── Ticket Details Mode ─── */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="ticket-header-row">
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d4af37' }}>Support Ticket</span>
                    <h3 className="ticket-num-title">{ticket.ticket_number}</h3>
                  </div>
                  <button onClick={() => setTicket(null)} className="ticket-btn-secondary">
                    Search Another
                  </button>
                </div>

                {/* Metadata */}
                <div className="ticket-grid">
                  <div>
                    <span className="ticket-meta-label">Ticket Status</span>
                    <span className={`ticket-badge ${ticket.status}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div>
                    <span className="ticket-meta-label">Priority Level</span>
                    <span className="ticket-meta-val" style={{ textTransform: 'capitalize' }}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div>
                    <span className="ticket-meta-label">Category</span>
                    <span className="ticket-meta-val" style={{ textTransform: 'capitalize' }}>
                      {ticket.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="ticket-meta-label">Submitted On</span>
                    <span className="ticket-meta-val">
                      {new Date(ticket.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>

                {/* Subject Block */}
                <div className="ticket-subject-box">
                  <span className="ticket-meta-label" style={{ marginBottom: '0.35rem' }}>Subject Line</span>
                  <strong style={{ fontSize: '1.15rem', color: '#eae1d4', fontFamily: "'Libre Caslon Text', serif", fontWeight: 400 }}>
                    {ticket.subject}
                  </strong>
                </div>

                {/* Messages Thread */}
                <div className="ticket-thread">
                  {/* Original Complaint Message */}
                  <div className="message-bubble">
                    <div className="message-header">
                      <span className="message-sender">{ticket.submitter_name} (Customer)</span>
                      <span className="message-date">
                        {new Date(ticket.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="message-body">{ticket.message}</p>
                  </div>

                  {/* Replies List */}
                  {ticket.messages?.map((m) => (
                    <div key={m.id} className="message-bubble">
                      <div className="message-header">
                        <span className="message-sender" style={{ color: m.sender_name.includes('Admin') || m.sender_name.includes('Staff') ? '#d4af37' : '#eae1d4' }}>
                          {m.sender_name}
                        </span>
                        <span className="message-date">
                          {new Date(m.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="message-body">{m.message}</p>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        </main>
        
        <GlobalFooter style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', zIndex: 10 }} />
      </div>
    </>
  );
}
