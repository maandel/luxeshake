'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useCartStore } from '../../lib/store/cartStore';
import { api } from '../../lib/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../context/ToastContext';

interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose }) => {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { showToast } = useToast();

  const [step, setStep] = useState<'form' | 'confirm' | 'payment' | 'processing' | 'success' | 'failed'>('form');
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);

  // Form inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [note, setNote] = useState('');
  const [pickupAddress, setPickupAddress] = useState('LuxeShake Boutique, 12 Presidential Road, Enugu, Nigeria');
  const [pickupPhone, setPickupPhone] = useState('+234 812 345 6789');

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paystackReference, setPaystackReference] = useState<string | null>(null);

  // Load delivery areas on mount
  useEffect(() => {
    if (isOpen) {
      api.get('/delivery-areas')
        .then((resp) => setDeliveryAreas(resp.data))
        .catch(() => {
          // Fallback static delivery areas if backend is offline
          setDeliveryAreas([
            { id: '1', name: 'New Haven', fee: 2000 },
            { id: '2', name: 'Independence Layout', fee: 2000 },
            { id: '3', name: 'GRA', fee: 2500 },
            { id: '4', name: 'Trans-Ekulu', fee: 2500 }
          ]);
        });

      api.get('/store-settings')
        .then((resp) => {
          if (resp.data) {
            setPickupAddress(resp.data.pickup_address);
            setPickupPhone(resp.data.pickup_phone);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    setStep('confirm');
  };

  const handleInitializePayment = async () => {
    setStep('processing');
    setLoading(true);
    try {
      // 1. Place order on backend first
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
        }))
      };

      const orderResp = await api.post('/orders', orderPayload);
      const placedOrder = orderResp.data;
      setOrderId(placedOrder.id);
      setOrderNumber(placedOrder.order_number);

      // 2. Initialize Paystack Transaction
      const payResp = await api.post('/payments/initialize', {
        order_id: placedOrder.id
      });

      const payData = payResp.data;
      setPaystackReference(payData.reference);

      // If Mock keys are active, verify immediately
      if (payData.reference.startsWith('mock') || payData.authorization_url?.includes('mock')) {
        await handleVerifyPayment(payData.reference);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== 'undefined' && !(window as any).PaystackPop) {
        showToast('Payment gateway is still loading. Please wait a split second and try again.', 'info');
        setLoading(false);
        setStep('confirm');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_mock_public_key',
        email: email,
        amount: total * 100, // in kobo
        ref: payData.reference,
        callback: (response: { reference: string }) => {
          showToast('Payment successful. Verifying...', 'info');
          handleVerifyPayment(response.reference);
        },
        onClose: () => {
          setLoading(false);
          setStep('payment');
          showToast('Payment popup closed.', 'info');
        }
      });
      handler.openIframe();
    } catch (err: unknown) {
      console.error('Checkout error detail:', err);
      setLoading(false);
      setStep('failed');
      const detail = isAxiosError(err) ? err.response?.data?.detail : null;
      showToast(detail || 'Checkout process failed. Please try again.', 'error');
    }
  };

  const handleVerifyPayment = async (reference: string) => {
    try {
      const resp = await api.get(`/payments/verify/${reference}`);
      if (resp.data.status === 'success') {
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

  const handleCloseSuccess = () => {
    setStep('form');
    // Clear inputs
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSelectedAreaId('');
    setNote('');
    onClose();
  };

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <div className="order-overlay open" onClick={step === 'processing' ? undefined : onClose} aria-hidden={!isOpen}>
        <div className="order-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
          <div className="order-modal-head">
            <h3 id="order-modal-title">{step === 'success' ? 'Order Success' : step === 'failed' ? 'Order Failed' : 'Checkout'}</h3>
            {step !== 'processing' && step !== 'success' && (
              <button className="cart-close" onClick={onClose} aria-label="Close Checkout Modal">
                ✕
              </button>
            )}
          </div>

          <div className="order-modal-body">
            {/* Step 1: Form Inputs */}
            {step === 'form' && (
              <form onSubmit={handleNextToConfirm}>
                {/* Summary */}
                <div className="order-summary">
                  <div className="order-summary-title">Order Summary</div>
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="order-sum-item">
                      <span>{item.name} ({item.size.toUpperCase()}) x {item.qty}</span>
                      <span>₦{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div className="order-sum-total">
                    <span>Subtotal</span>
                    <strong>₦{subtotal}</strong>
                  </div>
                </div>

                {/* Form fields */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal_first_name" className="form-label">First Name *</label>
                    <input
                      id="modal_first_name"
                      name="first_name"
                      type="text"
                      className="form-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal_last_name" className="form-label">Last Name</label>
                    <input
                      id="modal_last_name"
                      name="last_name"
                      type="text"
                      className="form-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal_email" className="form-label">Email Address *</label>
                    <input
                      id="modal_email"
                      name="email"
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal_phone" className="form-label">Phone Number *</label>
                    <input
                      id="modal_phone"
                      name="phone"
                      type="text"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modal_fulfillment" className="form-label">Fulfillment Option</label>
                  <div className="fulfillment-select-wrap">
                    <select
                      id="modal_fulfillment"
                      name="fulfillment"
                      className="fulfillment-select"
                      value={fulfillment}
                      onChange={(e) => setFulfillment(e.target.value as 'delivery' | 'pickup')}
                    >
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                    </select>
                  </div>
                </div>

                {fulfillment === 'delivery' ? (
                  <div className="form-group">
                    <label htmlFor="modal_delivery_area" className="form-label">Delivery Location *</label>
                    <div className="area-select-wrap">
                      <select
                        id="modal_delivery_area"
                        name="delivery_area"
                        className="area-select"
                        value={selectedAreaId}
                        onChange={(e) => setSelectedAreaId(e.target.value)}
                        required
                      >
                        <option value="">Select Delivery Area...</option>
                        {deliveryAreas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name} (₦{area.fee})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="pickup-info show">
                    <div className="pickup-info-title">Pickup Spot</div>
                    <div className="pickup-location-item">
                      <strong>LuxeShake Boutique</strong>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#eae1d4' }}>{pickupAddress}</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#99907c' }}>Phone: {pickupPhone}</p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="modal_note" className="form-label">Order Notes (Optional)</label>
                  <textarea
                    id="modal_note"
                    name="note"
                    className="form-input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="E.g. Extra whipped cream, no chocolate syrup..."
                  />
                </div>

                <button type="submit" className="submit-order-btn">
                  Review Order →
                </button>
              </form>
            )}

            {/* Step 2: Confirm */}
            {step === 'confirm' && (
              <div>
                <div className="confirm-title">Confirm Your Order Details</div>
                <div className="confirm-detail-grid">
                  <div className="confirm-detail-item">
                    <span>Name</span>
                    <strong>{firstName} {lastName}</strong>
                  </div>
                  <div className="confirm-detail-item">
                    <span>Email</span>
                    <strong>{email}</strong>
                  </div>
                  <div className="confirm-detail-item">
                    <span>Phone</span>
                    <strong>{phone}</strong>
                  </div>
                  <div className="confirm-detail-item">
                    <span>Fulfillment</span>
                    <strong>{fulfillment.toUpperCase()} {fulfillment === 'delivery' && `(${selectedArea?.name})`}</strong>
                  </div>
                </div>

                {note && (
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{note}</p>
                  </div>
                )}

                <div className="order-summary" style={{ marginTop: '1.5rem' }}>
                  <div className="order-summary-title">Cost Summary</div>
                  <div className="order-sum-item">
                    <span>Subtotal</span>
                    <span>₦{subtotal}</span>
                  </div>
                  {fulfillment === 'delivery' && (
                    <div className="order-sum-item">
                      <span>Delivery Fee</span>
                      <span>₦{deliveryFee}</span>
                    </div>
                  )}
                  <div className="order-sum-total confirm-grand">
                    <span>Total Cost</span>
                    <strong>₦{total}</strong>
                  </div>
                </div>

                <div className="confirm-actions">
                  <button className="confirm-btn btn-gold" onClick={handleInitializePayment}>
                    Proceed to Payment
                  </button>
                  <button className="confirm-cancel-btn" onClick={() => setStep('form')}>
                    ← Back and Edit
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Processing */}
            {step === 'processing' && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="pay-spinner"></div>
                <h4 style={{ marginTop: '1.5rem', color: 'var(--cream-soft)' }}>Initializing Payment Gateway</h4>
                <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Processing payment security for order of ₦{total}...
                </p>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <span style={{ fontSize: '3.5rem' }}>🎉</span>
                <h4 style={{ color: 'var(--gold-lt)', margin: '1rem 0', fontFamily: 'Cormorant Garamond', fontSize: '1.8rem' }}>
                  Payment Successful!
                </h4>
                <p style={{ color: 'var(--cream)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Thank you, {firstName}! Your payment of <strong>₦{total}</strong> has been received. 
                  Order Number: <strong style={{ color: 'var(--gold-lt)' }}>{orderNumber}</strong>.
                </p>
                <div className="verify-box">
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>
                    A full order confirmation and invoice has been sent to <strong>{email}</strong>. 
                    We will contact you on <strong>{phone}</strong> to coordinate details.
                  </p>
                </div>
                <button className="btn-gold" style={{ marginTop: '2rem', border: 'none' }} onClick={handleCloseSuccess}>
                  Close &amp; Order More Drinks
                </button>
              </div>
            )}

            {/* Step 6: Failed */}
            {step === 'failed' && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <span style={{ fontSize: '3.5rem' }}>✕</span>
                <h4 style={{ color: '#E53935', margin: '1rem 0', fontFamily: 'Cormorant Garamond', fontSize: '1.8rem' }}>
                  Payment Failed
                </h4>
                <p style={{ color: 'var(--cream)', fontSize: '0.9rem' }}>
                  Something went wrong with the transaction. Your card was not charged.
                </p>
                <div className="confirm-actions" style={{ marginTop: '2rem' }}>
                  <button className="confirm-btn btn-gold" onClick={handleInitializePayment}>
                    Try Again
                  </button>
                  <button className="confirm-cancel-btn" onClick={() => setStep('confirm')}>
                    Back to Confirmation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default OrderModal;
