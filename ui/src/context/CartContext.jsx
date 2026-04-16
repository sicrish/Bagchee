import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

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

  // Helper: consistent ID regardless of Prisma (id) vs legacy (_id)
  const getProductId = (p) => p.id || p._id;

  // 1. Add to Cart
  const addToCart = (product, quantity = 1, selectedSize = null, selectedColor = null) => {
    const pid = getProductId(product);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => getProductId(item) === pid);

      if (existingItem) {
        return prevCart.map((item) =>
          getProductId(item) === pid
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity, selectedSize, selectedColor }];
      }
    });
  };

  // 2. Remove from Cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => getProductId(item) !== productId));
  };

  // 3. Update Quantity (+ / -)
  const updateQuantity = (productId, type) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (getProductId(item) === productId) {
          const newQty = type === 'inc' ? item.quantity + 1 : item.quantity - 1;
          if (newQty < 1) {
            // If quantity would be less than 1, remove the item instead
            return null; // Will be filtered out
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item !== null); // Remove null items
    });
  };

  // 4. Clear Cart (After successful order) - sab extras bhi clear ho
  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setAppliedShipping(null);
    setMembershipAdded(false);
    localStorage.removeItem('cartItems');
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('appliedShipping');
    localStorage.removeItem('membershipAdded');
  };

  // --- WISHLIST FUNCTIONS ---

  // 1. Toggle Wishlist (Add/Remove)
  const toggleWishlist = (product) => {
    const pid = getProductId(product);
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.find((item) => getProductId(item) === pid);
      if (exists) {
        return prevWishlist.filter((item) => getProductId(item) !== pid);
      } else {
        return [...prevWishlist, product];
      }
    });
  };

  // 2. Check if in Wishlist (UI ke liye - Heart icon red karne ke liye)
  const isInWishlist = (productId) => {
    return wishlist.some((item) => getProductId(item) === productId);
  };

  // --- CALCULATIONS (Subtotal, Item Count) ---
  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider value={{
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
      // 🟢 New extras
      appliedCoupon,
      setAppliedCoupon,
      appliedShipping,
      setAppliedShipping,
      membershipAdded,
      setMembershipAdded,
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook taaki baar baar useContext na likhna pade
export const useCart = () => useContext(CartContext);
