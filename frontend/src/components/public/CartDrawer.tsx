/* eslint-disable @next/next/no-img-element */
'use client';


import React from 'react';
import { useCartStore } from '../../lib/store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const { items, updateQty, removeItem, getSubtotal } = useCartStore();

  return (
    <>
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 bg-cacao-black/70 backdrop-blur-sm z-[600] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-chocolate-deep border-l border-gold-leaf/20 z-[700] flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gold-leaf/15 shrink-0">
          <h3 className="font-headline-md text-headline-sm text-cream-silk">Your Order</h3>
          <button className="text-on-surface-variant hover:text-gold-leaf transition-colors p-1" onClick={onClose} aria-label="Close Cart">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl opacity-30 block mx-auto mb-4">shopping_bag</span>
              <p>Your cart is empty.</p>
              <button
                onClick={onClose}
                className="mt-6 border border-outline-variant text-on-surface-variant hover:border-gold-leaf hover:text-gold-leaf px-6 py-2 font-label-caps rounded transition-all"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="grid grid-cols-[60px_1fr_auto] gap-4 items-center py-3 border-b border-gold-leaf/10">
                  <div className="w-[60px] h-[60px] rounded-lg overflow-hidden border border-gold-leaf/15 shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=200"
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-cream-silk mb-1">{item.name}</h4>
                    <p className="text-xs text-text-muted mb-1">Size: {item.size.toUpperCase()}</p>
                    <span className="text-sm text-gold-leaf font-medium">₦{item.price * item.qty}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <button className="w-6 h-6 rounded-full bg-gold-leaf/15 border border-gold-leaf/25 text-gold-leaf flex items-center justify-center hover:bg-gold-leaf/30 transition-colors" onClick={() => updateQty(item.id, item.size, -1)}>
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                      <span className="text-sm text-cream-silk min-w-[1.2rem] text-center">{item.qty}</span>
                      <button className="w-6 h-6 rounded-full bg-gold-leaf/15 border border-gold-leaf/25 text-gold-leaf flex items-center justify-center hover:bg-gold-leaf/30 transition-colors" onClick={() => updateQty(item.id, item.size, 1)}>
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>
                  </div>
                  <button
                    className="self-start text-on-surface-variant hover:text-error transition-colors p-1"
                    onClick={() => removeItem(item.id, item.size)}
                    aria-label="Remove Item"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gold-leaf/15 shrink-0 bg-cacao-black/40">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-on-surface-variant uppercase tracking-widest">Subtotal</span>
              <strong className="font-headline-md text-headline-sm text-gold-leaf">₦{getSubtotal()}</strong>
            </div>
            <button className="w-full bg-gold-leaf text-cacao-black px-8 py-4 font-label-caps rounded primary-glow hover:scale-105 transition-transform" onClick={onCheckout}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
