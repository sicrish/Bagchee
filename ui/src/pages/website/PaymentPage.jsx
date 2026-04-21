import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Package, Loader2, AlertTriangle } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { CurrencyContext } from '../../context/CurrencyContext';
import logoImg from '../../assets/images/common/logo.png';

const PaymentPage = () => {
  const { orderId, token } = useParams();
  const { symbols } = useContext(CurrencyContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/orders/pay/${orderId}/${token}`);
        if (res.data?.status) {
          setOrder(res.data.data);
        } else {
          setError(res.data?.msg || 'Invalid or expired payment link.');
        }
      } catch (err) {
        setError(err.response?.data?.msg || 'This payment link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, token, API_BASE_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8] px-4">
        <div className="text-center bg-white border border-gray-200 rounded-xl p-10 shadow-sm max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-main mb-2 font-display">Invalid Payment Link</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/" className="text-primary font-bold hover:underline text-sm">Back to Home</Link>
        </div>
      </div>
    );
  }

  const currencySymbol = symbols[order?.currency] || '$';
  const items = order?.items || order?.products || [];

  const paymentType = (order?.paymentType || order?.payment_type || '').toLowerCase();
  const isStripe  = paymentType.includes('stripe') || paymentType.includes('credit card') || paymentType.includes('debit card');
  const isPayPal  = paymentType.includes('paypal');

  const gatewayLabel   = isStripe ? 'Stripe'  : isPayPal ? 'PayPal'  : 'Secure Gateway';
  const gatewayDesc    = isStripe
    ? 'You will be redirected to a secure Stripe payment page.'
    : isPayPal
      ? 'You will be redirected to a secure PayPal payment page. PayPal allows you to pay with a credit or debit card without creating or logging into a PayPal account.'
      : 'You will be redirected to a secure payment page to complete your order.';
  const buttonLabel    = isStripe ? 'Continue to Stripe'  : isPayPal ? 'Continue to PayPal'  : 'Continue to Pay';
  const buttonBg       = isStripe ? 'bg-[#635BFF] hover:bg-[#4f49cc]' : isPayPal ? 'bg-[#0070BA] hover:bg-[#005ea6]' : 'bg-primary hover:bg-primary-dark';

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-body">

      {/* ─── HEADER — matches checkout page ─── */}
      <header className="bg-gradient-to-r from-primary to-primary-dark shadow-sm sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-center">
          <Link to="/" className="flex items-center group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border-2 border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-white flex items-center justify-center shadow-xl">
                <img
                  src={logoImg}
                  alt="Bagchee"
                  className="w-8 h-8 lg:w-10 lg:h-10 object-contain"
                  style={{ filter: 'brightness(0) saturate(100%) invert(45%) sepia(89%) saturate(2448%) hue-rotate(165deg) brightness(95%) contrast(101%)' }}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl lg:text-2xl font-semibold text-white tracking-wider uppercase font-montserrat">Bagchee</span>
                <span className="text-[8px] lg:text-[9px] font-medium tracking-[0.2em] text-white/80 uppercase font-montserrat">Books That Stick</span>
              </div>
            </div>
          </Link>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Page heading */}
          <div className="text-center mb-8">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Secure Payment</p>
            <h1 className="text-3xl font-display font-bold text-text-main">Complete Your Payment</h1>
            <p className="text-gray-500 text-sm mt-2">
              Order <span className="font-bold text-text-main">#{order?.orderNumber || order?.order_number}</span>
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h3 className="font-bold text-xs text-text-main uppercase tracking-widest font-montserrat">Order Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-main line-clamp-1">{item.name || item.title}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-black text-text-main shrink-0">
                    {currencySymbol}{Number(item.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-black text-text-main uppercase tracking-wide">Total</span>
                <span className="text-xl font-black text-primary">
                  {currencySymbol}{Number(order?.total || 0).toFixed(2)} {order?.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Payment gateway section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-base font-bold text-text-main mb-2 font-display">Secure Payment Gateway</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-md mx-auto">
              {gatewayDesc}
            </p>
            <a
              href={order?.paymentLink || '#'}
              className={`inline-flex items-center gap-2 ${buttonBg} text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-md`}
            >
              {buttonLabel}
            </a>
            <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-wider">
              256-bit SSL encrypted · Secure transaction
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
