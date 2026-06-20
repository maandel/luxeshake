import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  size: 'small' | 'big';
  price: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: string, size: 'small' | 'big') => void;
  updateQty: (id: string, size: 'small' | 'big', delta: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (newItem) => set((state) => {
    const existingIndex = state.items.findIndex(
      (item) => item.id === newItem.id && item.size === newItem.size
    );
    if (existingIndex > -1) {
      const updatedItems = [...state.items];
      updatedItems[existingIndex].qty += 1;
      return { items: updatedItems };
    }
    return { items: [...state.items, { ...newItem, qty: 1 }] };
  }),
  removeItem: (id, size) => set((state) => ({
    items: state.items.filter((item) => !(item.id === id && item.size === size))
  })),
  updateQty: (id, size, delta) => set((state) => {
    const updatedItems = state.items
      .map((item) => {
        if (item.id === id && item.size === size) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      });
    return { items: updatedItems };
  }),
  clearCart: () => set({ items: [] }),
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.qty, 0);
  },
  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  }
}));
