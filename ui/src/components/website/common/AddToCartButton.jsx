import React from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import toast from 'react-hot-toast';

const AddToCartButton = ({ product, className = '', showText = true, isIconOnly = false, variant = 'default' }) => {
  const { cart, addToCart, updateQuantity } = useCart();

  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }
    addToCart(product);
    toast.success("Added to Cart");
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, 'inc');
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, 'dec');
  };

  // Compact variant for product cards
  if (variant === 'compact') {
    if (quantity > 0) {
      return (
        <div className={`flex items-center justify-between bg-primary text-white rounded-md overflow-hidden shadow-sm ${className}`} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleDecrement}
            className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center"
          >
            <Minus size={16} />
          </button>
          <span className="px-2 font-bold text-sm">{quantity}</span>
          <button
            onClick={handleIncrement}
            disabled={quantity >= (product.stock || 10)}
            className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`flex items-center justify-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-all duration-200 font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm ${className}`}
      >
        <ShoppingCart size={18} className="flex-shrink-0" />
        <span>{isOutOfStock ? 'Out of Stock' : 'Add'}</span>
      </button>
    );
  }

  if (quantity > 0) {
    return (
      <div className={`flex items-center bg-primary text-white rounded-md overflow-hidden shadow-sm ${className}`} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDecrement}
          className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center"
        >
          <Minus size={16} />
        </button>
        <span className="px-2 font-bold min-w-[20px] text-center text-sm">{quantity}</span>
        <button
          onClick={handleIncrement}
          disabled={quantity >= (product.stock || 10)}
          className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  if (isIconOnly) {
    return (
      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`p-2 rounded-full bg-primary/10 hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
      >
        <ShoppingCart size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={isOutOfStock}
      className={`flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${className}`}
    >
      <ShoppingCart size={18} />
      {showText && <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>}
    </button>
  );
};

export default AddToCartButton;
