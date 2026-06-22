'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import GlobalFooter from '../../../components/GlobalFooter';

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
  fulfillment_type: string;
  delivery_area_name: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  items?: OrderItem[];
  customer_note?: string;
  driver_phone?: string | null;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params?.orderId as string;
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [pickupAddress, setPickupAddress] = useState('LuxeShake Lounge, Enugu, Nigeria');
  const [pickupPhone, setPickupPhone] = useState('+234 812 345 6789');

  useEffect(() => {
    api.get('/store-settings')
      .then(resp => {
        if (resp.data) {
          setPickupAddress(resp.data.pickup_address);
          setPickupPhone(resp.data.pickup_phone);
        }
      })
      .catch(() => {});
  }, []);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/orders/track/${orderNumber}`);
      setOrder(resp.data);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Order tracking number not found.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  // Helper to map status to step indicator index
  const getStatusIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'processing': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <>
        <style>{`
          .track-loading-screen {
            min-height: 100vh;
            background: #1A0F0A;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .track-spinner-ring {
            width: 44px;
            height: 44px;
            border: 3px solid rgba(212, 175, 55, 0.15);
            border-top-color: #d4af37;
            border-radius: 50%;
            animation: trackSpin 0.8s linear infinite;
          }
          @keyframes trackSpin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="track-loading-screen">
          <div className="track-spinner-ring" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
          .track-error-screen {
            min-height: 100vh;
            background: #1A0F0A;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
            font-family: 'DM Sans', sans-serif;
          }
          .track-error-card {
            background: rgba(36, 22, 17, 0.75);
            border: 1px solid rgba(212, 175, 55, 0.15);
            border-radius: 28px;
            padding: 3.5rem 2.5rem;
            max-width: 480px;
            width: 100%;
            backdrop-filter: blur(24px);
            box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          }
          .track-error-title {
            font-family: 'Libre Caslon Text', serif;
            font-size: 2.2rem;
            color: #f2ca50;
            margin: 0 0 0.75rem;
          }
          .track-error-desc {
            color: #eae1d4;
            font-size: 0.95rem;
            line-height: 1.6;
            margin: 0 0 2.25rem;
          }
          .track-btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: #d4af37;
            color: #1A0F0A;
            border: none;
            border-radius: 14px;
            padding: 0.95rem 2rem;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            text-decoration: none;
            box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
            transition: all 0.25s ease;
          }
          .track-btn-primary:hover {
            background: #f2ca50;
            transform: translateY(-2px);
            box-shadow: 0 8px 28px rgba(212, 175, 55, 0.45);
          }
        `}</style>
        <div className="track-error-screen">
          <div className="track-error-card">
            <h2 className="track-error-title">Order Not Found</h2>
            <p className="track-error-desc">
              We couldn't locate any order with the tracking number: <strong style={{ color: '#f2ca50' }}>{orderNumber}</strong>. Please check the spelling and try again.
            </p>
            <Link href="/track" className="track-btn-primary">
              Try Another Number
            </Link>
          </div>
        </div>
      </>
    );
  }

  const currentStep = getStatusIndex(order.status);

  const steps = order.fulfillment_type === 'pickup' ? [
    { label: 'Received', desc: 'Awaiting validation' },
    { label: 'Confirmed', desc: 'Order accepted' },
    { label: 'Preparing', desc: 'Mixing your luxury milkshake' },
    { label: 'Ready for Pickup', desc: 'Ready for you to pick up' },
    { label: 'Picked Up', desc: 'Enjoy your luxury sip!' }
  ] : [
    { label: 'Received', desc: 'Awaiting validation' },
    { label: 'Confirmed', desc: 'Order accepted' },
    { label: 'Preparing', desc: 'Mixing your luxury milkshake' },
    { label: 'Dispatched', desc: order.driver_phone ? `Driver: ${order.driver_phone}` : 'On its way to you' },
    { label: 'Delivered', desc: 'Enjoy your luxury sip!' }
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .track-detail-page {
          min-height: 100vh;
          background: #1A0F0A;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient blobs */
        .track-blob-1 {
          position: absolute;
          top: -120px;
          left: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .track-blob-2 {
          position: absolute;
          bottom: -100px;
          right: -80px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .track-header {
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

        .track-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.3rem;
          color: #f2ca50;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
        }
        .track-logo:hover { color: #fff8e7; }

        .track-back-btn {
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
        .track-back-btn:hover {
          color: #f2ca50;
          border-color: rgba(212,175,55,0.5);
          background: rgba(212,175,55,0.06);
        }

        /* Container */
        .track-detail-container {
          flex: 1;
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem max(5vw, 1.5rem);
          box-sizing: border-box;
        }

        /* Card */
        .track-detail-card {
          background: rgba(36, 22, 17, 0.75);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 28px;
          padding: 3rem 2.5rem;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.06);
        }

        /* Title Area */
        .track-title-section {
          text-align: center;
          margin-bottom: 2.75rem;
        }

        .track-card-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #d4af37;
          margin-bottom: 0.6rem;
        }

        .track-card-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 400;
          color: #eae1d4;
          line-height: 1.2;
          margin: 0 0 0.6rem;
        }

        .track-card-title em {
          color: #f2ca50;
          font-style: italic;
        }

        .track-divider {
          width: 36px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          margin: 0 auto 1.25rem;
        }

        .track-card-subtitle {
          font-size: 0.85rem;
          color: #99907c;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        /* Badges */
        .track-payment-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.65rem;
          border-radius: 100px;
          line-height: 1;
        }
        .track-payment-badge.paid {
          background: rgba(129, 199, 132, 0.12);
          color: #81c784;
          border: 1px solid rgba(129, 199, 132, 0.25);
        }
        .track-payment-badge.unpaid {
          background: rgba(229, 115, 115, 0.12);
          color: #e57373;
          border: 1px solid rgba(229, 115, 115, 0.25);
        }

        .track-fulfillment-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.65rem;
          border-radius: 100px;
          line-height: 1;
          background: rgba(212, 175, 55, 0.08);
          color: #eae1d4;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }

        /* Stepper */
        .track-stepper-container {
          position: relative;
          margin-bottom: 3.5rem;
          padding: 1.5rem 0;
        }
        
        .track-stepper-line {
          position: absolute;
          top: 31px;
          left: 8%;
          right: 8%;
          height: 2px;
          background: rgba(212, 175, 55, 0.15);
          z-index: 1;
        }
        
        .track-stepper-progress {
          height: 100%;
          background: #d4af37;
          box-shadow: 0 0 8px #d4af37;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .track-steps-list {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 2;
          width: 100%;
        }
        
        .track-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          text-align: center;
          position: relative;
          min-width: 60px;
        }
        
        .track-step-node {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          transition: all 0.3s ease;
          z-index: 2;
        }
        
        .track-step-node.completed {
          background: #d4af37;
          border: 2px solid #d4af37;
          color: #1A0F0A;
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.3);
        }
        
        .track-step-node.active {
          background: #1A0F0A;
          border: 2px solid #f2ca50;
          color: #f2ca50;
          box-shadow: 0 0 18px rgba(242, 202, 80, 0.5);
        }
        
        .track-step-node.upcoming {
          background: #150C08;
          border: 2px solid rgba(212, 175, 55, 0.15);
          color: #99907c;
        }
        
        .track-step-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 0.75rem;
          letter-spacing: 0.02em;
          transition: color 0.3s;
        }
        .track-step-label.active { color: #f2ca50; }
        .track-step-label.completed { color: #eae1d4; }
        .track-step-label.upcoming { color: #99907c; }
        
        .track-step-desc {
          font-size: 0.65rem;
          color: #99907c;
          margin-top: 0.25rem;
          line-height: 1.3;
          padding: 0 0.5rem;
          max-width: 130px;
        }

        @media (max-width: 600px) {
          .track-step-desc {
            display: none;
          }
          .track-step-label {
            font-size: 0.7rem;
          }
          .track-step-node {
            width: 28px;
            height: 28px;
            font-size: 0.7rem;
          }
          .track-stepper-line {
            top: 28px;
          }
        }

        /* Cancellation Card */
        .track-cancellation-card {
          background: rgba(239, 154, 154, 0.05);
          border: 1px solid rgba(239, 154, 154, 0.25);
          border-radius: 20px;
          padding: 2.25rem;
          text-align: center;
          margin-bottom: 2.5rem;
          box-shadow: 0 12px 40px rgba(239, 154, 154, 0.05);
        }
        .track-cancellation-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.6rem;
          color: #ef9a9a;
          margin: 0 0 0.5rem;
        }
        .track-cancellation-desc {
          color: #99907c;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        /* Details Grid */
        .track-details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 2.5rem;
        }
        @media (min-width: 768px) {
          .track-details-grid {
            grid-template-columns: 1.1fr 0.9fr;
            align-items: start;
          }
        }

        .track-sub-card {
          background: rgba(13, 8, 4, 0.45);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 20px;
          padding: 1.75rem;
          box-sizing: border-box;
        }

        .track-sub-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.25rem;
          color: #f2ca50;
          margin: 0 0 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .track-info-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .track-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
        }

        .track-info-label {
          color: #99907c;
        }

        .track-info-val {
          color: #eae1d4;
          font-weight: 500;
        }

        .track-note-box {
          background: rgba(212, 175, 55, 0.04);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 14px;
          padding: 1.15rem 1.4rem;
        }

        /* Items List */
        .track-items-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .track-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.06);
        }
        .track-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .track-item-name {
          color: #eae1d4;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .track-item-price {
          color: #f2ca50;
          font-weight: 600;
          font-size: 0.95rem;
        }

        /* Size Badges */
        .track-size-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
          line-height: 1;
        }
        .track-size-badge.small {
          background: rgba(153, 144, 124, 0.15);
          color: #eae1d4;
          border: 1px solid rgba(153, 144, 124, 0.25);
        }
        .track-size-badge.big {
          background: rgba(212, 175, 55, 0.12);
          color: #f2ca50;
          border: 1px solid rgba(212, 175, 55, 0.25);
        }

        /* Cost Table */
        .track-price-table {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px solid rgba(212, 175, 55, 0.12);
          padding-top: 1.25rem;
          margin-top: 0.5rem;
        }

        .track-price-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #99907c;
        }

        .track-price-row.total {
          border-top: 1px solid rgba(212, 175, 55, 0.12);
          padding-top: 1rem;
          margin-top: 0.25rem;
          font-size: 1.1rem;
          font-family: 'Libre Caslon Text', serif;
          color: #eae1d4;
        }

        .track-price-row.total .track-price-val {
          color: #f2ca50;
          font-weight: 700;
        }

        /* Buttons & Footer */
        .track-footer-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          margin-top: 3.5rem;
          text-align: center;
        }

        .track-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #d4af37;
          color: #1A0F0A;
          border: none;
          border-radius: 14px;
          padding: 0.95rem 2.25rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
          transition: all 0.25s ease;
        }
        .track-btn-primary:hover {
          background: #f2ca50;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(212, 175, 55, 0.45);
        }

        .track-help-text {
          font-size: 0.85rem;
          color: #99907c;
          line-height: 1.5;
          margin: 0;
        }

        .track-help-text a {
          color: #d4af37;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .track-help-text a:hover {
          color: #f2ca50;
        }
      `}</style>

      <div className="track-detail-page">
        <div className="track-blob-1" />
        <div className="track-blob-2" />

        {/* Header */}
        <header className="track-header">
          <Link href="/" className="track-logo">LuxeShake</Link>
          <Link href="/track" className="track-back-btn">
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>arrow_back</span>
            Track Another
          </Link>
        </header>

        {/* Content */}
        <main className="track-detail-container">
          <div className="track-detail-card">
            
            {/* Header info */}
            <div className="track-title-section">
              <span className="track-card-label">Live Order Status</span>
              <h1 className="track-card-title">Order <em>#{order.order_number}</em></h1>
              <div className="track-divider" />
              <div className="track-card-subtitle">
                <span className="track-fulfillment-badge">{order.fulfillment_type}</span>
                <span className={`track-payment-badge ${order.payment_status === 'paid' ? 'paid' : 'unpaid'}`}>
                  {order.payment_status}
                </span>
              </div>
            </div>

            {/* Stepper progress layout */}
            {order.status === 'cancelled' ? (
              <div className="track-cancellation-card">
                <h3 className="track-cancellation-title">Order Cancelled</h3>
                <p className="track-cancellation-desc">
                  This order has been cancelled by LuxeShake. If you have been debited, your refund is being processed. For any questions, please contact our support team.
                </p>
              </div>
            ) : (
              <div className="track-stepper-container">
                {/* Connector line */}
                <div className="track-stepper-line">
                  <div 
                    className="track-stepper-progress"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                {/* Steps */}
                <div className="track-steps-list">
                  {steps.map((st, i) => {
                    const isActive = i <= currentStep;
                    const isCurrent = i === currentStep;
                    const statusClass = isCurrent ? 'active' : isActive ? 'completed' : 'upcoming';

                    return (
                      <div key={st.label} className="track-step-item">
                        <div className={`track-step-node ${statusClass}`}>
                          {isActive ? '✓' : i + 1}
                        </div>
                        <span className={`track-step-label ${statusClass}`}>{st.label}</span>
                        <span className="track-step-desc">{st.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Side-by-side grids */}
            <div className="track-details-grid">
              
              {/* Left card: Fulfillment details */}
              <div className="track-sub-card">
                <h2 className="track-sub-title">
                  <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '18px', fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>local_shipping</span>
                  Fulfillment
                </h2>

                <div className="track-info-list">
                  <div className="track-info-row">
                    <span className="track-info-label">Customer Name</span>
                    <span className="track-info-val">{order.customer_first_name} {order.customer_last_name}</span>
                  </div>
                  <div className="track-info-row">
                    <span className="track-info-label">Phone</span>
                    <span className="track-info-val">{order.customer_phone}</span>
                  </div>
                  <div className="track-info-row">
                    <span className="track-info-label">Email</span>
                    <span className="track-info-val">{order.customer_email}</span>
                  </div>
                  <div className="track-info-row">
                    <span className="track-info-label">Method</span>
                    <span className="track-info-val" style={{ textTransform: 'capitalize' }}>{order.fulfillment_type}</span>
                  </div>
                  {order.fulfillment_type === 'delivery' && (
                    <>
                      <div className="track-info-row">
                        <span className="track-info-label">Delivery Location</span>
                        <span className="track-info-val">{order.delivery_area_name}</span>
                      </div>
                      {order.driver_phone && (
                        <div className="track-info-row">
                          <span className="track-info-label">Driver Phone</span>
                          <span className="track-info-val">{order.driver_phone}</span>
                        </div>
                      )}
                    </>
                  )}
                  {order.fulfillment_type === 'pickup' && (
                    <>
                      <div className="track-info-row">
                        <span className="track-info-label">Pickup Location</span>
                        <span className="track-info-val">{pickupAddress}</span>
                      </div>
                      <div className="track-info-row">
                        <span className="track-info-label">Pickup Phone</span>
                        <span className="track-info-val">{pickupPhone}</span>
                      </div>
                    </>
                  )}

                  {order.customer_note && (
                    <div className="track-note-box" style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#d4af37', marginBottom: '0.45rem' }}>
                        <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>notes</span>
                        {order.fulfillment_type === 'delivery' ? 'Delivery Address & Notes' : 'Special Instructions'}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#eae1d4', lineHeight: 1.5 }}>
                        {order.customer_note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right card: Items & Billing summary */}
              <div className="track-sub-card">
                <h2 className="track-sub-title">
                  <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '18px', fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>receipt_long</span>
                  Items Ordered
                </h2>

                <div className="track-items-list">
                  {order.items?.map((item) => (
                    <div key={item.id} className="track-item-row">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span className="track-item-name">{item.product_name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`track-size-badge ${item.size === 'small' ? 'small' : 'big'}`}>
                            {item.size === 'small' ? 'Small' : 'Large'}
                          </span>
                          <span style={{ color: '#99907c', fontSize: '0.78rem' }}>
                            Qty: <strong style={{ color: '#eae1d4' }}>{item.quantity}</strong>
                          </span>
                        </div>
                      </div>
                      <strong className="track-item-price">₦{item.line_total.toLocaleString()}</strong>
                    </div>
                  ))}

                  <div className="track-price-table">
                    <div className="track-price-row">
                      <span className="track-price-label">Subtotal</span>
                      <span className="track-price-val">₦{order.subtotal.toLocaleString()}</span>
                    </div>
                    {order.fulfillment_type === 'delivery' && (
                      <div className="track-price-row">
                        <span className="track-price-label">Delivery Fee</span>
                        <span className="track-price-val">₦{order.delivery_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="track-price-row total">
                      <span className="track-price-label">Total Amount</span>
                      <strong className="track-price-val">₦{order.total.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer / Actions */}
            <div className="track-footer-actions">
              <Link href="/" className="track-btn-primary">
                Return Home
              </Link>
              <p className="track-help-text">
                Need assistance with this order? <Link href="/#contact">Contact Support</Link> or{' '}
                <Link href="/track-complaint">Track Complaint</Link>.
              </p>
            </div>

          </div>
        </main>
        
        <GlobalFooter style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', zIndex: 10 }} />
      </div>
    </>
  );
}
