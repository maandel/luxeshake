import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="order-overlay open" style={{ zIndex: 9999 }}>
      <div className="order-modal" style={{ maxWidth: '400px', padding: '0' }}>
        <div className="order-modal-head">
          <h3 style={{ color: isDangerous ? '#E57373' : 'var(--gold-lt)' }}>{title}</h3>
          <button onClick={onCancel} className="cart-close">✕</button>
        </div>
        <div className="order-modal-body" style={{ padding: '1.5rem 2rem' }}>
          <p style={{ color: 'var(--cream)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={onCancel}
              className="btn-outline"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', width: 'auto' }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={isDangerous ? 'confirm-cancel-btn' : 'btn-gold'}
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', width: 'auto' }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
