import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FileText, Package, ArrowRight, Tag, Copy, ShoppingBag, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { CurrencyContext } from "../../context/CurrencyContext";
import toast from "react-hot-toast";

const OrderReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice, symbols, currency } = useContext(CurrencyContext);
  const rawOrder = location.state?.orderDetails;
  const bankDetails = location.state?.bankDetails || null;

  // Normalize camelCase (Prisma) + snake_case / nested (legacy) shapes into one object.
  const sd = rawOrder?.shipping_details || {};
  const order = rawOrder && {
    ...rawOrder,
    orderNumber:       rawOrder.orderNumber       || rawOrder.order_number || '',
    shippingFirstName: rawOrder.shippingFirstName || sd.first_name || sd.firstName || '',
    shippingLastName:  rawOrder.shippingLastName  || sd.last_name  || sd.lastName  || '',
    shippingAddress1:  rawOrder.shippingAddress1  || sd.address_1  || sd.address1  || sd.address || '',
    shippingCity:      rawOrder.shippingCity      || sd.city       || '',
    shippingState:     rawOrder.shippingState     || sd.state_region || sd.state   || '',
    shippingPostcode:  rawOrder.shippingPostcode  || sd.postcode   || sd.pincode   || '',
    shippingPhone:     rawOrder.shippingPhone     || sd.phone      || '',
    paymentType:       rawOrder.paymentType       || rawOrder.payment_type || '',
    shippingCost:      Number(rawOrder.shippingCost ?? rawOrder.shipping_cost ?? 0),
    total:             Number(rawOrder.total ?? 0),
    items:             rawOrder.items || rawOrder.products || [],
  };

  const orderStatus = (order?.status || '').toLowerCase();
  const isApprovalPending = orderStatus === 'approval pending';
  const isWireTransfer = orderStatus === 'payment pending' && (() => {
    const t = (order?.paymentType || order?.payment_type || '').toLowerCase();
    return t.includes('wire') || t.includes('bank transfer');
  })();
  const isPurchaseOrder = (() => {
    const t = (order?.paymentType || order?.payment_type || '').toLowerCase();
    return t.includes('purchase order');
  })();

  // Bank details for the order's currency
  const orderCurrency = (order?.currency || currency || 'USD').toUpperCase();
  const currencyBankDetails = bankDetails
    ? (bankDetails[orderCurrency.toLowerCase()] || null)
    : null;

  const BASE_URL = process.env.REACT_APP_API_URL || "";

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="text-center p-8 bg-white border rounded-xl shadow-sm">
        <p className="text-gray-500 mb-4 font-montserrat">No order details found.</p>
        <Link to="/" className="text-primary font-bold hover:underline">Back to Home</Link>
      </div>
    </div>
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Coupon copied!");
  };

  const getFullImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150x200?text=Book";
    return path.startsWith('http') ? path : `${BASE_URL}${path}`;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-12 px-4 font-body">
      <div className="max-w-6xl mx-auto">

        {/* ─── BREADCRUMB ─── */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8 font-montserrat">
          <Link to="/"><span>Home</span></Link>
          <ChevronRight size={10} />
          <span className="text-text-main">Order Receipt</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ════ LEFT COLUMN: RECEIPT DETAILS ════ */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="text-primary w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    {isApprovalPending ? 'Order Received!' : isPurchaseOrder ? 'Order Confirmed!' : 'Order Receipt Generated'}
                  </p>
                  <h1 className="text-3xl font-display font-bold text-text-main">
                    {isApprovalPending
                      ? `Thank You, ${order.shippingFirstName || 'Customer'}!`
                      : `Review Your Order, ${order.shippingFirstName || 'Customer'}!`}
                  </h1>
                </div>
              </div>

              {/* ─── Deferred CC/PayPal notice ─── */}
              {isApprovalPending && (
                <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-bold text-blue-800 mb-1 uppercase tracking-wide">Payment Pending Review</p>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Our team will review your order within <strong>2–12 hours</strong>. Once approved, you will receive a
                    secure payment link via email to complete the purchase.
                  </p>
                </div>
              )}

              {/* ─── Wire Transfer bank details ─── */}
              {isWireTransfer && (
                <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-wide">Wire Transfer Instructions</p>
                  <p className="text-sm text-amber-700 mb-4">
                    Please transfer the total amount to the bank account below. Use your order number
                    <strong> {order.orderNumber}</strong> as the payment reference.
                  </p>
                  {currencyBankDetails && (currencyBankDetails.name || currencyBankDetails.iban) ? (
                    <div className="space-y-2 text-sm font-body">
                      {currencyBankDetails.owner && <div className="flex gap-2"><span className="font-bold text-amber-900 w-36 shrink-0">Beneficiary:</span><span className="text-amber-800">{currencyBankDetails.owner}</span></div>}
                      {currencyBankDetails.name  && <div className="flex gap-2"><span className="font-bold text-amber-900 w-36 shrink-0">Bank Name:</span><span className="text-amber-800">{currencyBankDetails.name}</span></div>}
                      {currencyBankDetails.iban  && <div className="flex gap-2"><span className="font-bold text-amber-900 w-36 shrink-0">Account / IBAN:</span><span className="text-amber-800 font-mono">{currencyBankDetails.iban}</span></div>}
                      {currencyBankDetails.bic   && <div className="flex gap-2"><span className="font-bold text-amber-900 w-36 shrink-0">Swift / BIC:</span><span className="text-amber-800 font-mono">{currencyBankDetails.bic}</span></div>}
                      <div className="flex gap-2"><span className="font-bold text-amber-900 w-36 shrink-0">Currency:</span><span className="text-amber-800">{orderCurrency}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">Bank details will be sent to your email shortly.</p>
                  )}
                </div>
              )}

              <div className="space-y-8">
                {/* Receipt Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Order ID</p>
                    <p className="text-sm font-bold text-text-main">#{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Date</p>
                    <p className="text-sm font-bold text-text-main">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                    <p className="text-[10px] font-black bg-accent/20 text-orange-600 px-2 py-0.5 rounded-full inline-block">PENDING PAYMENT</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Amount</p>
                    <p className="text-sm font-black text-primary">{formatPrice(order.total)}</p>
                  </div>
                </div>

                {/* Address & Payment Info */}
                <div className="grid md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} /> Shipping Address
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed bg-white border border-gray-50 p-4 rounded-lg shadow-sm">
                      <span className="font-bold text-text-main block mb-1">
                        {order.shippingFirstName} {order.shippingLastName}
                      </span>
                      {order.shippingAddress1}<br />
                      {order.shippingCity}, {order.shippingState} {order.shippingPostcode}<br />
                      <span className="text-xs font-medium text-gray-400">{order.shippingPhone}</span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} /> Payment Method
                    </h4>
                    <div className="p-4 bg-white border border-gray-50 rounded-lg shadow-sm">
                      <p className="text-sm font-bold text-text-main">{order.paymentType}</p>
                      <p className="text-[10px] text-green-600 font-bold mt-1 uppercase italic tracking-tighter">Secure Transaction</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Action buttons (context-aware) ─── */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                {/* Deferred: no payment button, just go to orders */}
                {isApprovalPending && (
                  <Link to="/account/orders" className="flex-1 bg-primary text-white py-4 rounded-lg font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                    View My Orders <ArrowRight size={16} />
                  </Link>
                )}
                {/* Wire transfer: go to orders */}
                {isWireTransfer && (
                  <Link to="/account/orders" className="flex-1 bg-primary text-white py-4 rounded-lg font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                    View My Orders <ArrowRight size={16} />
                  </Link>
                )}
                {/* Purchase Order or COD: confirmation, go to orders */}
                {(isPurchaseOrder || (!isApprovalPending && !isWireTransfer)) && (
                  <Link to="/account/orders" className="flex-1 bg-text-main text-white py-4 rounded-lg font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                    View My Orders <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: YOUR ORDER SUMMARY ════ */}
          <div className="lg:col-span-1 space-y-6">

            {/* 🟢 SPECIAL COUPON BOX (Shifted to Top) */}
            <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl p-6 relative overflow-hidden animate-fadeIn">
              <div className="relative z-10">
                <h3 className="text-primary font-display font-bold text-base mb-1">Exclusive Discount!</h3>
                <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">
                  Thank you for choosing us. Use this code for <span className="font-bold text-text-main">10% OFF</span> on your next purchase.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-primary/30 px-3 py-2 rounded-lg font-display font-bold text-primary text-base tracking-widest shadow-sm text-center">
                    SAVE10
                  </div>
                  <button onClick={() => copyToClipboard("SAVE10")} className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shrink-0">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
              <Tag className="absolute -right-6 -bottom-6 w-24 h-24 text-primary/5 -rotate-12" />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-24 overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between font-montserrat">
                <h3 className="font-bold text-xs text-text-main flex items-center gap-2 uppercase tracking-widest">
                  <ShoppingBag size={16} className="text-primary" /> Your Order
                </h3>
                <span className="bg-text-main text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {order.items?.length}
                </span>
              </div>
              <div className="p-5">
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="w-14 h-18 bg-gray-50 border border-gray-100 rounded overflow-hidden shrink-0">
                        <img
                          src={getFullImageUrl(item.image || item.product?.defaultImage || item.product_id?.default_image)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt="product"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Quantity: {item.quantity}</p>
                        <p className="text-sm font-black text-text-main mt-1"> {symbols[order.currency] || symbols[currency]}
                          {Number(item.price).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 font-montserrat">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-text-main">
                      {symbols[order.currency] || symbols[currency]}
                      {(order.total - order.shippingCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Shipping</span>
                    <span className="text-text-main">{order.shippingCost === 0
                      ? "FREE"
                      : `${symbols[order.currency] || symbols[currency]}${order.shippingCost.toFixed(2)}`
                    }</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-sm font-black text-text-main uppercase tracking-[0.1em]">Total Pay</span>
                    <div className="text-right leading-none">
                      <span className="text-2xl font-black text-primary">{symbols[order.currency] || symbols[currency]}
                        {order.total.toLocaleString('en-US', {
                          minimumFractionDigits: 2
                        })}</span>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">{order.currency} </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;