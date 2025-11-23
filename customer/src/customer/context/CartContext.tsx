import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  addOns?: { name: string; price: number }[];
  instructions?: string;
}

export interface OrderDetails {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  tableNumber?: string;
  whatsappNumber?: string;
  splitBill?: boolean;
  splitCount?: number;
  status?: 'placed' | 'preparing' | 'cooking' | 'ready' | 'served';
  orderId?: string;
}

interface CartContextType {
  cart: CartItem[];
  orderDetails: OrderDetails | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  setWhatsAppNumber: (number: string) => void;
  setSplitBill: (split: boolean, count?: number) => void;
  setOrderDetails: (details: OrderDetails) => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDetails, setOrderDetailsState] = useState<OrderDetails | null>(null);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => 
        i.id === item.id && 
        i.variant === item.variant && 
        JSON.stringify(i.addOns) === JSON.stringify(item.addOns)
      );
      
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === existingItem.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      
      return [...prevCart, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const updateInstructions = (itemId: string, instructions: string) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, instructions } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const addOnsTotal = item.addOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0;
      return total + (item.price + addOnsTotal) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const setWhatsAppNumber = (number: string) => {
    setOrderDetailsState((prev) => ({
      ...(prev || { items: [], subtotal: 0, tax: 0, discount: 0, total: 0 }),
      whatsappNumber: number,
    }));
  };

  const setSplitBill = (split: boolean, count?: number) => {
    setOrderDetailsState((prev) => ({
      ...(prev || { items: [], subtotal: 0, tax: 0, discount: 0, total: 0 }),
      splitBill: split,
      splitCount: count,
    }));
  };

  const setOrderDetails = (details: OrderDetails) => {
    setOrderDetailsState(details);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        orderDetails,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateInstructions,
        clearCart,
        setWhatsAppNumber,
        setSplitBill,
        setOrderDetails,
        getCartTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
