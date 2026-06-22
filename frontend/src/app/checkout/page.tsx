'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../lib/store/cartStore';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuthStore } from '../../lib/store/authStore';
import GlobalFooter from '../../components/GlobalFooter';

interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { showToast } = useToast();
  const { accessToken } = useAuthStore();

  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success' | 'failed'>('form');
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('luxeshake_pending_order_id');
      if (stored) {
        setExistingOrderId(stored);
      }
    }
  }, []);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [note, setNote] = useState('');

  const [pickupAddress, setPickupAddress] = useState('LuxeShake Lounge, Enugu, Nigeria');
  const [pickupPhone, setPickupPhone] = useState('+234 812 345 6789');

  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState(0);

  useEffect(() => {
    if (items.length === 0 && step !== 'success') {
      showToast('Your cart is empty. Redirecting to menu...', 'info');
      router.push('/menu');
    }
  }, [items.length, step, router, showToast]);

  useEffect(() => {
    (async () => {
      const areasResp = await api.get('/delivery-areas');
      setDeliveryAreas(areasResp.data || []);

      try {
        const settingsResp = await api.get('/store-settings');
        if (settingsResp.data) {
          setPickupAddress(settingsResp.data.pickup_address);
          setPickupPhone(settingsResp.data.pickup_phone);
        }
      } catch (e) {
      }
    })().catch(() => {
      setDeliveryAreas([
        { id: '1', name: 'New Haven', fee: 2000 },
        { id: '2', name: 'Independence Layout', fee: 2000 },
        { id: '3', name: 'GRA', fee: 2500 },
        { id: '4', name: 'Trans-Ekulu', fee: 2500 }
      ]);
    });
  }, []);

  useEffect(() => {
    if (accessToken) {
      api.get('/users/me')
        .then((resp) => {
          const user = resp.data;
          if (user.full_name) {
            const parts = user.full_name.trim().split(/\s+/);
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }
          if (user.email) {
            setEmail(user.email);
          }
        })
        .catch((err) => {
          console.error('Error fetching profile details for checkout:', err);
        });
    }
  }, [accessToken]);

  const subtotal = getSubtotal();
  const selectedArea = deliveryAreas.find((a) => a.id === selectedAreaId);
  const deliveryFee = fulfillment === 'delivery' && selectedArea ? selectedArea.fee : 0;
  const total = subtotal + deliveryFee;

  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email || !phone) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    if (phone.length < 7) {
      showToast('Phone number must be at least 7 digits.', 'error');
      return;
    }
    if (fulfillment === 'delivery' && !selectedAreaId) {
      showToast('Please select a delivery area.', 'error');
      return;
    }
    if (fulfillment === 'delivery' && !note.trim()) {
      showToast('Please provide your delivery address in the instructions box.', 'error');
      return;
    }
    setStep('confirm');
  };

  const handleInitializePayment = async () => {
    setStep('processing');
    setLoading(true);
    try {
      const orderPayload = {
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_email: email,
        customer_phone: phone,
        customer_note: note || null,
        fulfillment_type: fulfillment,
        delivery_area_id: fulfillment === 'delivery' ? selectedAreaId : null,
        items: items.map((item) => ({
          product_id: item.id,
          size: item.size,
          quantity: item.qty
        })),
        existing_order_id: existingOrderId
      };

      const orderResp = await api.post('/orders', orderPayload);
      const placedOrder = orderResp.data;

      localStorage.setItem('luxeshake_pending_order_id', placedOrder.id);
      setExistingOrderId(placedOrder.id);
      setOrderNumber(placedOrder.order_number);

      const payResp = await api.post('/payments/initialize', {
        order_id: placedOrder.id
      });

      const payData = payResp.data;

      if (payData.reference.startsWith('mock') || payData.authorization_url?.includes('mock')) {
        await handleVerifyPayment(payData.reference);
        return;
      }

      if (typeof window !== 'undefined' && !(window as any).PaystackPop) {
        showToast('Payment gateway is still loading. Please wait a moment and try again.', 'info');
        setLoading(false);
        setStep('confirm');
        return;
      }

      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_mock_public_key',
        email: email,
        amount: total * 100,
        ref: payData.reference,
        callback: (response: any) => {
          showToast('Payment successful. Verifying...', 'info');
          handleVerifyPayment(response.reference);
        },
        onClose: () => {
          setLoading(false);
          setStep('confirm');
          showToast('Payment popup closed.', 'info');
        }
      });
      handler.openIframe();
    } catch (err: any) {
      console.error('Checkout error details:', err);
      setLoading(false);

      if (err.response?.data?.detail === 'Order has already been paid') {
        localStorage.removeItem('luxeshake_pending_order_id');
        setExistingOrderId(null);
        setFinalTotal(total);
        clearCart();
        setStep('success');
        showToast('This order has already been paid and confirmed!', 'success');
        return;
      }

      setStep('failed');
      showToast(err.response?.data?.detail || 'Checkout process failed. Please try again.', 'error');
    }
  };

  const handleVerifyPayment = async (reference: string) => {
    try {
      const resp = await api.get(`/payments/verify/${reference}`);
      if (resp.data.status === 'success') {
        localStorage.removeItem('luxeshake_pending_order_id');
        setExistingOrderId(null);
        setFinalTotal(total);
        setStep('success');
        clearCart();
        showToast('Payment received!', 'success');
      } else {
        setStep('failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 'success') {
    return null;
  }

  const renderStateContent = () => {
    if (step === 'processing') {
      return (
        <div className="checkout-state-panel">
          <div className="state-spinner" />
          <h2 className="checkout-title" style={{ color: '#f2ca50' }}>Connecting to Gateway</h2>
          <p className="checkout-subtitle" style={{ maxWidth: '320px', margin: '0.5rem auto' }}>
            Preparing your secure checkout experience. Please do not close or refresh this page.
          </p>
        </div>
      );
    }

    if (step === 'success') {
      return (
        <div className="checkout-state-panel">
          <div className="checkout-state-icon success">check</div>
          <h2 className="checkout-title" style={{ color: '#f2ca50' }}>Order Confirmed!</h2>
          <p className="checkout-subtitle" style={{ fontSize: '1rem', color: '#eae1d4', margin: '0.75rem 0 1.5rem' }}>
            Thank you, {firstName}. Your payment of <strong>₦{finalTotal.toLocaleString()}</strong> has been secured.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0 auto 2.25rem', width: '100%', maxWidth: '400px' }}>
            <div className="checkout-info-box" style={{ textAlign: 'left' }}>
              <strong className="checkout-label" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.65rem' }}>Order Tracking Code</strong>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f2ca50', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                {orderNumber}
              </span>
              <p style={{ fontSize: '0.8rem', color: '#99907c', margin: '0.75rem 0 0', lineHeight: 1.4 }}>
                Please save this order number. You can use it at any time in our <strong>Track Order</strong> portal to check delivery progress.
              </p>
            </div>

            <div className="checkout-info-box" style={{ textAlign: 'left' }}>
              <p style={{ margin: 0 }}>
                A confirmation receipt has been sent to <strong>{email}</strong>. We will reach out to you at <strong>{phone}</strong> regarding fulfillment.
              </p>
            </div>
          </div>

          <Link href="/" className="checkout-btn-primary" style={{ width: '100%', maxWidth: '400px', textDecoration: 'none' }}>
            Return Home
          </Link>
        </div>
      );
    }

    if (step === 'failed') {
      return (
        <div className="checkout-state-panel">
          <div className="checkout-state-icon failed">close</div>
          <h2 className="checkout-title" style={{ color: '#ef9a9a' }}>Transaction Failed</h2>
          <p className="checkout-subtitle" style={{ maxWidth: '340px', margin: '0.5rem auto 2.5rem' }}>
            Your transaction was declined or canceled. No charges were made to your account.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
            <button className="checkout-btn-primary" onClick={handleInitializePayment}>
              Try Again
            </button>
            <button className="checkout-btn-secondary" onClick={() => setStep('confirm')}>
              Back to Confirmation
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .checkout-root {
          min-height: 100vh;
          background: #1A0F0A;
          font-family: 'DM Sans', sans-serif;
          color: #eae1d4;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient Blobs */
        .checkout-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .checkout-blob-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%);
          top: -100px;
          left: -150px;
        }
        .checkout-blob-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139,58,42,0.08) 0%, transparent 70%);
          bottom: 10%;
          right: -100px;
        }

        /* Header */
        .checkout-header {
          background: rgba(26, 15, 10, 0.95);
          border-bottom: 1px solid rgba(212, 175, 55, 0.12);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 40;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 max(5vw, 1.5rem);
        }
        .checkout-logo {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.35rem;
          color: #f2ca50;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
        }
        .checkout-logo:hover { color: #fff8e7; }
        .checkout-back-link {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.7);
          text-decoration: none;
          padding: 0.55rem 1.15rem;
          border: 1px solid rgba(212,175,55,0.20);
          border-radius: 9px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .checkout-back-link:hover {
          color: #f2ca50;
          border-color: rgba(212,175,55,0.55);
          background: rgba(212,175,55,0.06);
        }

        /* Main Split Layout */
        .checkout-container {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 3rem max(5vw, 1.5rem);
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        @media (min-width: 992px) {
          .checkout-container {
            grid-template-columns: 1.5fr 1fr;
            align-items: start;
          }
        }

        /* Panels */
        .checkout-panel-left {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .checkout-panel-right {
          position: sticky;
          top: 96px;
        }

        .checkout-card {
          background: rgba(36, 22, 17, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.12);
          border-radius: 24px;
          padding: 2.25rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
        }

        .checkout-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.8rem;
          font-weight: 400;
          color: #eae1d4;
          margin-bottom: 0.5rem;
        }
        .checkout-subtitle {
          font-size: 0.85rem;
          color: #99907c;
          margin-bottom: 1.5rem;
        }
        .checkout-gold-line {
          width: 44px;
          height: 1px;
          background: linear-gradient(90deg, #d4af37, transparent);
          margin-bottom: 2rem;
        }

        /* Sections */
        .checkout-sec-title {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.15rem;
          color: #eae1d4;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .checkout-sec-title span {
          color: #d4af37;
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }

        /* Inputs */
        .checkout-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 576px) {
          .checkout-form-grid.split {
            grid-template-columns: 1fr 1fr;
          }
        }

        .checkout-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .checkout-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(212, 175, 55, 0.7);
        }
        .checkout-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .checkout-input-icon {
          position: absolute;
          left: 1rem;
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          color: rgba(212, 175, 55, 0.5);
          pointer-events: none;
          transition: color 0.2s;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }
        .checkout-input {
          width: 100%;
          background: rgba(13, 8, 4, 0.55);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 14px;
          padding: 0.85rem 1rem 0.85rem 2.75rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          color: #eae1d4;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
          box-sizing: border-box;
        }
        .checkout-input::placeholder { color: rgba(153, 144, 124, 0.4); }
        .checkout-input:focus {
          border-color: rgba(212, 175, 55, 0.5);
          background: rgba(13, 8, 4, 0.75);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
        }
        .checkout-input-wrap.focused .checkout-input-icon {
          color: #d4af37;
        }

        /* Dropdowns & Selects */
        select.checkout-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.15rem center;
          padding-right: 2.75rem;
          cursor: pointer;
        }
        textarea.checkout-input {
          resize: none;
          height: 100px;
        }

        /* Segmented Toggles */
        .checkout-toggle-group {
          display: flex;
          background: rgba(13, 8, 4, 0.5);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 14px;
          padding: 0.25rem;
          gap: 0.25rem;
        }
        .checkout-toggle-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 0.75rem;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #99907c;
          cursor: pointer;
          transition: all 0.25s;
          text-align: center;
        }
        .checkout-toggle-btn.active {
          background: rgba(212, 175, 55, 0.12);
          color: #f2ca50;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* Pickup details info box */
        .checkout-info-box {
          background: rgba(212, 175, 55, 0.04);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 14px;
          padding: 1.15rem 1.4rem;
          font-size: 0.85rem;
          color: #99907c;
          line-height: 1.6;
        }
        .checkout-info-box strong {
          color: #f2ca50;
        }

        /* Order Summary Items List */
        .summary-items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 240px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
          padding-right: 0.25rem;
        }
        .summary-items-list::-webkit-scrollbar {
          width: 4px;
        }
        .summary-items-list::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2);
          border-radius: 10px;
        }
        .summary-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.88rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.06);
        }
        .summary-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .summary-item-name {
          color: #eae1d4;
          font-weight: 500;
        }
        .summary-item-qty {
          color: #99907c;
          font-size: 0.75rem;
          margin-left: 0.5rem;
        }
        .summary-item-price {
          color: #f2ca50;
          font-weight: 600;
        }

        /* Cost Table */
        .summary-price-table {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px solid rgba(212, 175, 55, 0.12);
          padding-top: 1.25rem;
          margin-top: 0.5rem;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #99907c;
        }
        .price-row.total {
          border-top: 1px solid rgba(212, 175, 55, 0.12);
          padding-top: 1rem;
          margin-top: 0.25rem;
          font-size: 1.1rem;
          font-family: 'Libre Caslon Text', serif;
          color: #eae1d4;
        }
        .price-row.total .price-val {
          color: #f2ca50;
          font-weight: 700;
        }

        /* Buttons */
        .checkout-btn-primary {
          width: 100%;
          background: #d4af37;
          color: #1A0F0A;
          border: none;
          border-radius: 14px;
          padding: 1.05rem;
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
        .checkout-btn-primary:hover:not(:disabled) {
          background: #f2ca50;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(212, 175, 55, 0.45);
        }
        .checkout-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .checkout-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .checkout-btn-secondary {
          width: 100%;
          background: transparent;
          color: #99907c;
          border: 1px solid rgba(153, 144, 124, 0.3);
          border-radius: 14px;
          padding: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .checkout-btn-secondary:hover {
          border-color: rgba(212, 175, 55, 0.45);
          color: #f2ca50;
          background: rgba(212, 175, 55, 0.04);
        }

        /* Review Details summary block */
        .confirm-details-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          background: rgba(13, 8, 4, 0.4);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .confirm-detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
        }
        .confirm-detail-label { color: #99907c; }
        .confirm-detail-val { color: #eae1d4; text-align: right; }

        /* Animation States (Success / Failed / Processing) */
        .checkout-state-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 1rem;
        }
        .checkout-state-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.75rem;
          font-family: 'Material Symbols Outlined';
          font-size: 32px;
          line-height: 1;
        }
        .checkout-state-icon.success {
          background: rgba(212, 175, 55, 0.1);
          border: 2px solid #d4af37;
          color: #d4af37;
        }
        .checkout-state-icon.failed {
          background: rgba(239, 154, 154, 0.1);
          border: 2px solid #ef9a9a;
          color: #ef9a9a;
        }
        .state-spinner {
          width: 54px;
          height: 54px;
          border: 3px solid rgba(212, 175, 55, 0.15);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: stateSpin 0.75s linear infinite;
          margin-bottom: 2rem;
        }
        @keyframes stateSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="checkout-root">
        <div className="checkout-blob checkout-blob-1" />
        <div className="checkout-blob checkout-blob-2" />

        {/* Focused Header */}
        <header className="checkout-header">
          <Link href="/" className="checkout-logo">LuxeShake</Link>
          <Link href="/menu" className="checkout-back-link">
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '15px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>arrow_back</span>
            Back to Menu
          </Link>
        </header>

        {/* Main Body */}
        <main className="checkout-container">
          {step === 'processing' || step === 'success' || step === 'failed' ? (
            // Full card layout for single panel state
            <div className="checkout-card" style={{ maxWidth: '600px', width: '100%', margin: '2rem auto' }}>
              {renderStateContent()}
            </div>
          ) : (
            <>
              {/* Left Column: Form Forms / Review Info */}
              <div className="checkout-panel-left">
                {step === 'form' && (
                  <div className="checkout-card">
                    <h1 className="checkout-title">Secure Checkout</h1>
                    <p className="checkout-subtitle">Fill in your delivery details and notes below</p>
                    <div className="checkout-gold-line" />

                    <form onSubmit={handleNextToConfirm} className="checkout-form-grid" noValidate>

                      {/* Personal Info */}
                      <h2 className="checkout-sec-title">
                        <span>person</span> Personal Details
                      </h2>
                      <div className="checkout-form-grid split">
                        <div className="checkout-field">
                          <label className="checkout-label">First Name *</label>
                          <div className={`checkout-input-wrap${firstNameFocused ? ' focused' : ''}`}>
                            <span className="checkout-input-icon">person</span>
                            <input
                              type="text"
                              className="checkout-input"
                              placeholder="First Name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              onFocus={() => setFirstNameFocused(true)}
                              onBlur={() => setFirstNameFocused(false)}
                              readOnly={!!accessToken && !!firstName}
                              style={accessToken && firstName ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                              required
                            />
                          </div>
                        </div>

                        <div className="checkout-field">
                          <label className="checkout-label">Last Name</label>
                          <div className={`checkout-input-wrap${lastNameFocused ? ' focused' : ''}`}>
                            <span className="checkout-input-icon">person</span>
                            <input
                              type="text"
                              className="checkout-input"
                              placeholder="Last Name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              onFocus={() => setLastNameFocused(true)}
                              onBlur={() => setLastNameFocused(false)}
                              readOnly={!!accessToken && !!lastName}
                              style={accessToken && lastName ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="checkout-form-grid split">
                        <div className="checkout-field">
                          <label className="checkout-label">Email Address *</label>
                          <div className={`checkout-input-wrap${emailFocused ? ' focused' : ''}`}>
                            <span className="checkout-input-icon">mail</span>
                            <input
                              type="email"
                              className="checkout-input"
                              placeholder="Email Address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setEmailFocused(true)}
                              onBlur={() => setEmailFocused(false)}
                              readOnly={!!accessToken && !!email}
                              style={accessToken && email ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                              required
                            />
                          </div>
                        </div>

                        <div className="checkout-field">
                          <label className="checkout-label">Phone Number *</label>
                          <div className={`checkout-input-wrap${phoneFocused ? ' focused' : ''}`}>
                            <span className="checkout-input-icon">call</span>
                            <input
                              type="tel"
                              className="checkout-input"
                              placeholder="e.g. +2348030000000"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              onFocus={() => setPhoneFocused(true)}
                              onBlur={() => setPhoneFocused(false)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fulfillment Options */}
                      <h2 className="checkout-sec-title" style={{ marginTop: '1rem' }}>
                        <span>local_shipping</span> Fulfillment Options
                      </h2>
                      <div className="checkout-toggle-group">
                        <button
                          type="button"
                          className={`checkout-toggle-btn${fulfillment === 'delivery' ? ' active' : ''}`}
                          onClick={() => setFulfillment('delivery')}
                        >
                          Delivery
                        </button>
                        <button
                          type="button"
                          className={`checkout-toggle-btn${fulfillment === 'pickup' ? ' active' : ''}`}
                          onClick={() => setFulfillment('pickup')}
                        >
                          Store Pickup
                        </button>
                      </div>

                      {fulfillment === 'delivery' ? (
                        <div className="checkout-field">
                          <label className="checkout-label">Delivery Region *</label>
                          <div className="checkout-input-wrap">
                            <span className="checkout-input-icon">map</span>
                            <select
                              className="checkout-input"
                              value={selectedAreaId}
                              onChange={(e) => setSelectedAreaId(e.target.value)}
                              required
                            >
                              <option value="">Select Delivery Location...</option>
                              {deliveryAreas.map((area) => (
                                <option key={area.id} value={area.id}>
                                  {area.name} (+₦{area.fee.toLocaleString()})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="checkout-info-box">
                          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>LuxeShake Pick-up</strong>
                          You will pick up your order at our location: <strong>{pickupAddress}</strong> (Contact: <strong>{pickupPhone}</strong>).
                          <br />Fulfillment hours: <strong>9:00 AM - 7:00 PM</strong> daily.
                        </div>
                      )}

                      {/* Notes / Address */}
                      <div className="checkout-field" style={{ marginTop: '1rem' }}>
                        <label className="checkout-label">
                          {fulfillment === 'delivery' ? 'Delivery Address & Directions *' : 'Pickup notes & special requests'}
                        </label>
                        <div className={`checkout-input-wrap${noteFocused ? ' focused' : ''}`}>
                          <span className="checkout-input-icon" style={{ alignSelf: 'flex-start', marginTop: '0.85rem' }}>chat</span>
                          <textarea
                            className="checkout-input"
                            placeholder={fulfillment === 'delivery' ? 'Please specify your exact street address, apartment number, and delivery landmarks...' : 'Add any additional notes (e.g. specific pickup time or instructions)...'}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            onFocus={() => setNoteFocused(true)}
                            onBlur={() => setNoteFocused(false)}
                          />
                        </div>
                      </div>

                      <button type="submit" className="checkout-btn-primary">
                        Review Details
                      </button>

                    </form>
                  </div>
                )}

                {step === 'confirm' && (
                  <div className="checkout-card">
                    <h1 className="checkout-title">Review Order Details</h1>
                    <p className="checkout-subtitle">Please verify your details before submitting payment</p>
                    <div className="checkout-gold-line" />

                    <div className="confirm-details-list">
                      <div className="confirm-detail-row">
                        <span className="confirm-detail-label">Name</span>
                        <span className="confirm-detail-val">{firstName} {lastName}</span>
                      </div>
                      <div className="confirm-detail-row">
                        <span className="confirm-detail-label">Email</span>
                        <span className="confirm-detail-val">{email}</span>
                      </div>
                      <div className="confirm-detail-row">
                        <span className="confirm-detail-label">Phone</span>
                        <span className="confirm-detail-val">{phone}</span>
                      </div>
                      <div className="confirm-detail-row">
                        <span className="confirm-detail-label">Fulfillment</span>
                        <span className="confirm-detail-val" style={{ textTransform: 'capitalize' }}>
                          {fulfillment} {fulfillment === 'delivery' && selectedArea && ` - ${selectedArea.name}`}
                        </span>
                      </div>
                      <div className="confirm-detail-row" style={{ flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(212,175,55,0.06)', paddingTop: '0.75rem' }}>
                        <span className="confirm-detail-label" style={{ textAlign: 'left' }}>
                          {fulfillment === 'delivery' ? 'Delivery Address' : 'Fulfillment Notes'}
                        </span>
                        <span className="confirm-detail-val" style={{ textAlign: 'left', color: '#99907c', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                          {note || 'None'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.75rem' }}>
                      <button className="checkout-btn-primary" onClick={handleInitializePayment}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 20", lineHeight: 1 }}>lock</span>
                        Pay Securely via Paystack
                      </button>
                      <button className="checkout-btn-secondary" onClick={() => setStep('form')}>
                        Edit Details
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Sticky Summary Card */}
              <div className="checkout-panel-right">
                <div className="checkout-card">
                  <h2 className="checkout-sec-title">
                    <span>receipt_long</span> Order Summary
                  </h2>

                  {/* Items List */}
                  <div className="summary-items-list">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="summary-item-row">
                        <div>
                          <span className="summary-item-name">{item.name}</span>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem' }}>
                            <span style={{ fontSize: '0.62rem', background: 'rgba(212,175,55,0.1)', color: '#d4af37', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                              {item.size}
                            </span>
                            <span className="summary-item-qty">x {item.qty}</span>
                          </div>
                        </div>
                        <span className="summary-item-price">₦{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="summary-price-table">
                    <div className="price-row">
                      <span>Subtotal</span>
                      <span style={{ color: '#eae1d4' }}>₦{subtotal.toLocaleString()}</span>
                    </div>

                    {fulfillment === 'delivery' && (
                      <div className="price-row">
                        <span>Delivery Fee</span>
                        <span style={{ color: '#eae1d4' }}>₦{deliveryFee.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="price-row total">
                      <span>Total</span>
                      <span className="price-val">₦{total.toLocaleString()}</span>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </main>
        
        <GlobalFooter style={{ marginTop: 'auto', paddingTop: '3rem', paddingBottom: '1rem', zIndex: 10 }} />
      </div>
    </>
  );
}
