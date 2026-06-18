import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imagePublicId: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  googleDriveFileId: string | null;
  category?: any;
}

interface CartContextType {
  cartItems: Product[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Load cart on init
  useEffect(() => {
    const storedCart = localStorage.getItem('vectorbox_cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (err) {
        console.error('Error parsing stored cart:', err);
      }
    }
  }, []);

  const saveCart = (items: Product[]) => {
    setCartItems(items);
    localStorage.setItem('vectorbox_cart', JSON.stringify(items));
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product: Product) => {
    if (cartItems.some((item) => item.id === product.id)) {
      openCart(); // Just open the cart if it's already there
      return;
    }
    const newItems = [...cartItems, product];
    saveCart(newItems);
    openCart(); // Auto-open cart drawer
  };

  const removeFromCart = (productId: string) => {
    const newItems = cartItems.filter((item) => item.id !== productId);
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.id === productId);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);
  const cartCount = cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
