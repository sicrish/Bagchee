import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';

// Create Context
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // --- STATE ---
  // Initial state LocalStorage se uthayenge taaki refresh par data na ude
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('wishlistItems');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  // 🟢 Cart ke saath persist hone wale extras
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    const saved = localStorage.getItem('appliedCoupon');
    return saved ? JSON.parse(saved) : null;
  });

  const [appliedShipping, setAppliedShipping] = useState(() => {
    const saved = localStorage.getItem('appliedShipping');
    return saved ? JSON.parse(saved) : null;
  });

  const [membershipAdded, setMembershipAdded] = useState(() => {
    return localStorage.getItem('membershipAdded') === 'true';
  });

  // --- PERSIST TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (appliedShipping) {
      localStorage.setItem('appliedShipping', JSON.stringify(appliedShipping));
    } else {
      localStorage.removeItem('appliedShipping');
    }
  }, [appliedShipping]);

  useEffect(() => {
    localStorage.setItem('membershipAdded', membershipAdded ? 'true' : 'false');
  }, [membershipAdded]);

  // --- CART FUNCTIONS ---

  // 1. Add to Cart
  const addToCart = useCallback((product, quantity = 1, selectedSize = null, selectedColor = null) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity, selectedSize, selectedColor }];
      }
    });
  }, []);

  // 2. Remove from Cart
  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  // 3. Update Quantity (+ / -)
  const updateQuantity = useCallback((productId, type) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === productId) {
          const newQty = type === 'inc' ? item.quantity + 1 : item.quantity - 1;
          if (newQty < 1) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item !== null);
    });
  }, []);

  // 4. Clear Cart (After successful order)
  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
    setAppliedShipping(null);
    setMembershipAdded(false);
    localStorage.removeItem('cartItems');
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('appliedShipping');
    localStorage.removeItem('membershipAdded');
  }, []);

  // --- WISHLIST FUNCTIONS ---

  // 1. Toggle Wishlist (Add/Remove)
  const toggleWishlist = useCallback((product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.find((item) => item.id === product.id);
      if (exists) {
        return prevWishlist.filter((item) => item.id !== product.id);
      } else {
        return [...prevWishlist, product];
      }
    });
  }, []);

  // 2. Check if in Wishlist
  const isInWishlist = useCallback((productId) => {
    return wishlist.some((item) => item.id === productId);
  }, [wishlist]);

  // --- CALCULATIONS (Subtotal, Item Count) ---
  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const wishlistCount = wishlist.length;

  const contextValue = useMemo(() => ({
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    isInWishlist,
    cartItemCount,
    cartTotal,
    wishlistCount,
    appliedCoupon,
    setAppliedCoupon,
    appliedShipping,
    setAppliedShipping,
    membershipAdded,
    setMembershipAdded,
  }), [cart, wishlist, addToCart, removeFromCart, updateQuantity, clearCart,
       toggleWishlist, isInWishlist, cartItemCount, cartTotal, wishlistCount,
       appliedCoupon, appliedShipping, membershipAdded]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook taaki baar baar useContext na likhna pade
export const useCart = () => useContext(CartContext);
