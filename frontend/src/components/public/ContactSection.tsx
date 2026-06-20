'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('other');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');

  const [loading, setLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const { showToast } = useToast();

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [orderIdFocused, setOrderIdFocused] = useState(false);
  const [subjectFocused, setSubjectFocused] = useState(false);
  const [messageFocused, setMessageFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    if (message.length < 20) {
      showToast('Message must be at least 20 characters long.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        submitter_name: name,
        submitter_email: email,
        submitter_phone: phone || null,
        category: category,
        subject: subject,
        message: message,
      };

      if (orderId.trim()) {
        payload.order_id = orderId.trim();
      }

      const resp = await api.post('/complaints/contact', payload);
      setTicketNumber(resp.data.ticket_number);
      showToast('Ticket submitted successfully!', 'success');

      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setOrderId('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit support ticket. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .contact-sec {
          padding: 6rem 0;
          background: #1A0F0A;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          border-top: 1px solid rgba(212,175,55,0.08);
        }

        /* Ambient Blobs */
        .contact-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .contact-blob-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%);
          top: -50px;
          left: -100px;
        }
        .contact-blob-2 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(139,58,42,0.06) 0%, transparent 70%);
          bottom: -50px;
          right: -100px;
        }

        .contact-container {
          max-width: 650px;
          margin: 0 auto;
          padding: 0 max(5vw, 1.5rem);
          position: relative;
          z-index: 2;
          box-sizing: border-box;
        }

        .contact-header {
          text-align: center;
          margin-bottom: 2.75rem;
        }

        .contact-s-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #d4af37;
          margin-bottom: 0.55rem;
          display: block;
        }

        .contact-s-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: clamp(2rem, 4vw, 2.6rem);
          font-weight: 400;
          color: #eae1d4;
          margin: 0;
          line-height: 1.2;
        }

        .contact-s-title em {
          color: #f2ca50;
          font-style: italic;
        }

        .contact-divider {
          width: 36px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          margin: 1.15rem auto;
        }

        .contact-s-body {
          font-size: 0.9rem;
          color: #99907c;
          line-height: 1.65;
          max-width: 480px;
          margin: 0 auto;
        }

        /* Form Card */
        .contact-card {
          background: rgba(36, 22, 17, 0.75);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 24px;
          padding: 2.25rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4);
          box-sizing: border-box;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 576px) {
          .contact-grid.split {
            grid-template-columns: 1fr 1fr;
          }
        }

        .contact-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .contact-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(212, 175, 55, 0.7);
        }

        .contact-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .contact-input-icon {
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

        .contact-input {
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

        .contact-input::placeholder {
          color: rgba(153, 144, 124, 0.4);
        }

        .contact-input:focus {
          border-color: rgba(212, 175, 55, 0.5);
          background: rgba(13, 8, 4, 0.75);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
        }

        .contact-input-wrap.focused .contact-input-icon {
          color: #d4af37;
        }

        select.contact-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.15rem center;
          padding-right: 2.75rem;
          cursor: pointer;
        }

        textarea.contact-input {
          resize: none;
          height: 110px;
        }

        /* Submit Button */
        .contact-btn-submit {
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
          margin-top: 1.5rem;
        }

        .contact-btn-submit:hover:not(:disabled) {
          background: #f2ca50;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(212, 175, 55, 0.45);
        }

        .contact-btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .contact-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Success Panel */
        .contact-success-panel {
          text-align: center;
          padding: 1rem 0;
        }

        .contact-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid #d4af37;
          color: #d4af37;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-family: 'Material Symbols Outlined';
          font-size: 28px;
          line-height: 1;
        }

        .contact-success-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.6rem;
          color: #f2ca50;
          margin-bottom: 0.75rem;
        }

        .contact-success-desc {
          font-size: 0.9rem;
          color: #eae1d4;
          line-height: 1.65;
          margin-bottom: 1.5rem;
        }

        .contact-ticket-box {
          background: rgba(212, 175, 55, 0.04);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 14px;
          padding: 1.25rem;
          margin-bottom: 2rem;
        }

        .contact-ticket-number {
          font-size: 1.65rem;
          font-weight: 700;
          color: #f2ca50;
          letter-spacing: 0.05em;
          font-family: monospace;
          display: block;
          margin-top: 0.5rem;
        }

        .contact-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: transparent;
          color: #99907c;
          border: 1px solid rgba(153, 144, 124, 0.3);
          border-radius: 12px;
          padding: 0.85rem 1.75rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .contact-btn-secondary:hover {
          border-color: rgba(212, 175, 55, 0.45);
          color: #f2ca50;
          background: rgba(212, 175, 55, 0.04);
        }

        .contact-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(26, 15, 10, 0.2);
          border-top-color: #1A0F0A;
          border-radius: 50%;
          animation: contactSpin 0.75s linear infinite;
        }

        @keyframes contactSpin { to { transform: rotate(360deg); } }
      `}</style>

      <section className="contact-sec" id="contact">
        <div className="contact-blob contact-blob-1" />
        <div className="contact-blob contact-blob-2" />

        <div className="contact-container">
          {/* Header */}
          <div className="contact-header">
            <span className="contact-s-label">Support Center</span>
            <h2 className="contact-s-title">Have a <em>Complaint</em>?</h2>
            <div className="contact-divider" />
            <p className="contact-s-body">
              Submit your feedback or complaint regarding quality, delivery, or payments. Our team will review and reply within 24 hours.
            </p>
          </div>

          {/* Form / Success Card */}
          <div className="contact-card">
            {ticketNumber ? (
              <div className="contact-success-panel">
                <div className="contact-success-icon">check</div>
                <h3 className="contact-success-title">Ticket Submitted!</h3>
                <p className="contact-success-desc">
                  Your ticket has been logged in our system. You can use the ticket number below to track replies at any time.
                </p>

                <div className="contact-ticket-box">
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#99907c' }}>Ticket Tracking Number</span>
                  <span className="contact-ticket-number">{ticketNumber}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                  <Link href="/track-complaint" className="contact-btn-submit" style={{ textDecoration: 'none', width: '100%', maxWidth: '320px', marginTop: 0 }}>
                    Track This Ticket
                  </Link>
                  <button onClick={() => setTicketNumber(null)} className="contact-btn-secondary" style={{ width: '100%', maxWidth: '320px' }}>
                    Submit Another Ticket
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="contact-grid">

                  {/* Name and Email */}
                  <div className="contact-grid split">
                    <div className="contact-field">
                      <label htmlFor="contact_name" className="contact-label">Full Name *</label>
                      <div className={`contact-input-wrap${nameFocused ? ' focused' : ''}`}>
                        <span className="contact-input-icon">person</span>
                        <input
                          id="contact_name"
                          name="submitter_name"
                          type="text"
                          className="contact-input"
                          placeholder="Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onFocus={() => setNameFocused(true)}
                          onBlur={() => setNameFocused(false)}
                          required
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact_email" className="contact-label">Email Address *</label>
                      <div className={`contact-input-wrap${emailFocused ? ' focused' : ''}`}>
                        <span className="contact-input-icon">mail</span>
                        <input
                          id="contact_email"
                          name="submitter_email"
                          type="email"
                          className="contact-input"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone and Category */}
                  <div className="contact-grid split">
                    <div className="contact-field">
                      <label htmlFor="contact_phone" className="contact-label">Phone Number</label>
                      <div className={`contact-input-wrap${phoneFocused ? ' focused' : ''}`}>
                        <span className="contact-input-icon">phone</span>
                        <input
                          id="contact_phone"
                          name="submitter_phone"
                          type="text"
                          className="contact-input"
                          placeholder="e.g. 07012345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          onFocus={() => setPhoneFocused(true)}
                          onBlur={() => setPhoneFocused(false)}
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact_category" className="contact-label">Category *</label>
                      <div className="contact-input-wrap">
                        <span className="contact-input-icon">category</span>
                        <select
                          id="contact_category"
                          name="category"
                          className="contact-input"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="other">Other / General</option>
                          <option value="delivery">Delivery Issue</option>
                          <option value="payment">Payment Issue</option>
                          <option value="product_quality">Product Quality</option>
                          <option value="wrong_order">Wrong Order</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Order ID */}
                  <div className="contact-field">
                    <label htmlFor="contact_order_id" className="contact-label">Order ID</label>
                    <div className={`contact-input-wrap${orderIdFocused ? ' focused' : ''}`}>
                      <span className="contact-input-icon">receipt</span>
                      <input
                        id="contact_order_id"
                        name="order_id"
                        type="text"
                        className="contact-input"
                        placeholder="Order ID"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        onFocus={() => setOrderIdFocused(true)}
                        onBlur={() => setOrderIdFocused(false)}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="contact-field">
                    <label htmlFor="contact_subject" className="contact-label">Subject *</label>
                    <div className={`contact-input-wrap${subjectFocused ? ' focused' : ''}`}>
                      <span className="contact-input-icon">title</span>
                      <input
                        id="contact_subject"
                        name="subject"
                        type="text"
                        className="contact-input"
                        placeholder="Brief summary of the issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        onFocus={() => setSubjectFocused(true)}
                        onBlur={() => setSubjectFocused(false)}
                        required
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="contact-field">
                    <label htmlFor="contact_message" className="contact-label">Message Description * (min 20 chars)</label>
                    <div className={`contact-input-wrap${messageFocused ? ' focused' : ''}`}>
                      <span className="contact-input-icon" style={{ top: '1rem' }}>chat_bubble</span>
                      <textarea
                        id="contact_message"
                        name="message"
                        className="contact-input"
                        placeholder="Describe your issue in details..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onFocus={() => setMessageFocused(true)}
                        onBlur={() => setMessageFocused(false)}
                        required
                      ></textarea>
                    </div>
                  </div>

                </div>

                <button type="submit" className="contact-btn-submit" disabled={loading}>
                  {loading && <span className="contact-spinner"></span>}
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactSection;
