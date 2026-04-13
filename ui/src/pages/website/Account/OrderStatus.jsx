'use client';

import React, { useState, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Info, Package, CheckCircle2, Loader2, FileText, LifeBuoy,
    Eye, Mail, ChevronDown, ClipboardCheck, Truck, MapPin, Receipt, XCircle,
    PauseCircle, RefreshCcw, Box, ExternalLink, Calendar, AlertTriangle, Ban
} from 'lucide-react';
import { CurrencyContext } from '../../../context/CurrencyContext';
import AccountLayout from '../../../layouts/AccountLayout';
import axios from '../../../utils/axiosConfig';
import toast from 'react-hot-toast';

const OrderStatus = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { formatPrice } = useContext(CurrencyContext);

    const [order, setOrder] = useState(location.state?.orderData || null);
    const [cancelling, setCancelling] = useState(false);
    const [showInvoiceMenu, setShowInvoiceMenu] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    if (!order) {
        navigate('/account/orders');
        return null;
    }

    // ── Field helpers (Prisma camelCase + old snake_case fallbacks) ──────────
    const items      = order.items || order.products || [];
    const orderNum   = order.orderNumber || order.order_number || order._id?.slice(-8)?.toUpperCase() || orderId;
    const placedAt   = order.createdAt   || order.created_at;
    const shippedAt  = order.shippedAt   || order.shipped_at;
    const estDelivery = order.estimatedDelivery || order.estimated_delivery;
    const orderStatus = (order.status || '').toLowerCase();
    const payStatus   = order.paymentStatus || order.payment_status || '';

    const shippingName = order.shippingFirstName
        ? `${order.shippingFirstName} ${order.shippingLastName}`.trim()
        : order.shipping_details
            ? `${order.shipping_details.first_name || ''} ${order.shipping_details.last_name || ''}`.trim()
            : '';
    const shippingAddr1 = order.shippingAddress1 || order.shipping_details?.address_1 || '';
    const shippingCity  = order.shippingCity  || order.shipping_details?.city || '';
    const shippingState = order.shippingState || order.shipping_details?.state_region || '';
    const shippingPost  = order.shippingPostcode || order.shipping_details?.postcode || '';
    const shippingPhone = order.shippingPhone || order.shipping_details?.phone || '';

    // ── Helpers ───────────────────────────────────────────────────────────────
    const formatAmount = (amount, currencyCode) => {
        const num = Number(amount || 0);
        return currencyCode
            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(num)
            : formatPrice(num);
    };

    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // ── Status config ─────────────────────────────────────────────────────────
    const getStatusConfig = (statusString) => {
        const s = (statusString || '').toLowerCase().trim();
        switch (s) {
            case 'delivered':
            case 'completed':
                return { step: 3, color: 'text-green-600', bgPill: 'bg-green-50 border-green-200', icon: MapPin, label: 'Delivered' };
            case 'shipped':
            case 'partially shipped':
            case 'in transit':
                return { step: 2, color: 'text-blue-600', bgPill: 'bg-blue-50 border-blue-200', icon: Truck, label: 'Shipped' };
            case 'confirmed':
            case 'in progress':
            case 'new':
            case 'processing':
                return { step: 1, color: 'text-primary', bgPill: 'bg-primary-50 border-primary-100', icon: ClipboardCheck, label: 'Confirmed' };
            case 'cancelled':
            case 'google cancelled':
                return { step: -1, color: 'text-red-600', bgPill: 'bg-red-50 border-red-100', icon: XCircle, label: 'Cancelled' };
            case 'on hold':
            case 'payment pending':
            case 'approval pending':
                return { step: -1, color: 'text-amber-600', bgPill: 'bg-amber-50 border-amber-100', icon: PauseCircle, label: s === 'approval pending' ? 'Approval Pending' : 'On Hold' };
            case 'returned':
                return { step: -1, color: 'text-orange-600', bgPill: 'bg-orange-50 border-orange-100', icon: RefreshCcw, label: 'Returned' };
            default:
                return { step: 0, color: 'text-gray-500', bgPill: 'bg-gray-100 border-gray-200', icon: Box, label: statusString || 'Pending' };
        }
    };

    const orderConfig = getStatusConfig(orderStatus);

    // ── Can cancel? (blocked once shipped or beyond) ──────────────────────────
    const SHIPPED_STATUSES = ['shipped', 'partially shipped', 'in transit', 'delivered', 'completed', 'cancelled'];
    const canCancel = !SHIPPED_STATUSES.includes(orderStatus);

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
        setCancelling(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/orders/${order.id || orderId}/cancel`);
            if (res.data.status) {
                toast.success('Order cancelled successfully.');
                setOrder(res.data.data);
            } else {
                toast.error(res.data.msg || 'Could not cancel order.');
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to cancel order.');
        } finally {
            setCancelling(false);
        }
    };

    // ── Payment status badge colour ───────────────────────────────────────────
    const payBadgeClass = () => {
        const s = payStatus.toLowerCase();
        if (s === 'paid') return 'bg-green-50 text-green-700 border-green-200';
        if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
        if (s === 'failed' || s === 'refunded') return 'bg-red-50 text-red-700 border-red-100';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    // ── Before/after ship divider ─────────────────────────────────────────────
    const isShippedOrBeyond = orderConfig.step >= 2;

    return (
        <AccountLayout>
            <div className="max-w-5xl mx-auto">

                {/* Back */}
                <Link to="/account/orders" className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Orders
                </Link>

                {/* ── ORDER HEADER ────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
                    <div>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Order</p>
                        <h1 className="text-2xl font-display font-bold text-text-main tracking-wide">#{orderNum}</h1>
                        {placedAt && (
                            <p className="text-xs text-text-muted mt-1">Placed on {formatDate(placedAt)}</p>
                        )}
                    </div>

                    {/* Status + Payment status badges */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border ${orderConfig.bgPill} ${orderConfig.color}`}>
                            <orderConfig.icon size={13} />
                            {orderConfig.label}
                        </span>
                        {payStatus && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border ${payBadgeClass()}`}>
                                Payment: {payStatus}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── TWO-COLUMN LAYOUT ───────────────────────────────────────── */}
                <div className="bg-cream-100 rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="flex flex-col md:flex-row">

                        {/* LEFT: Shipping address + dates */}
                        <div className="flex-1 p-6 md:p-8 space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2 h-5 bg-primary rounded-full"></div>
                                    <h3 className="text-sm font-display font-bold text-text-main uppercase tracking-slick">Shipping Address</h3>
                                </div>
                                {shippingName || shippingAddr1 ? (
                                    <div className="bg-white/70 p-4 rounded-xl border border-white/50 shadow-sm text-sm space-y-1.5 text-text-muted">
                                        {shippingName && <p className="font-bold text-text-main text-base">{shippingName}</p>}
                                        {shippingAddr1 && <p>{shippingAddr1}</p>}
                                        {(shippingCity || shippingState) && <p>{[shippingCity, shippingState, shippingPost].filter(Boolean).join(', ')}</p>}
                                        {shippingPhone && <p className="pt-1 border-t border-gray-200/60 font-medium">Phone: <span className="text-primary font-bold">{shippingPhone}</span></p>}
                                    </div>
                                ) : (
                                    <p className="text-text-muted italic text-sm">Address not available</p>
                                )}
                            </div>

                            {/* ── BEFORE / AFTER SHIP DIVISION ────────────────── */}
                            {isShippedOrBeyond ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-blue-200"></div>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-2">Shipped</span>
                                        <div className="h-px flex-1 bg-blue-200"></div>
                                    </div>
                                    {shippedAt && (
                                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <Truck size={16} className="text-blue-500 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Order Shipped</p>
                                                <p className="text-sm font-bold text-blue-700">{formatDate(shippedAt)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {estDelivery && (
                                        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                                            <Calendar size={16} className="text-green-500 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Estimated Delivery</p>
                                                <p className="text-sm font-bold text-green-700">{formatDate(estDelivery)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gray-200"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Pre-Shipment</span>
                                        <div className="h-px flex-1 bg-gray-200"></div>
                                    </div>
                                    {estDelivery && (
                                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                            <Calendar size={16} className="text-amber-500 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Estimated Delivery</p>
                                                <p className="text-sm font-bold text-amber-700">{formatDate(estDelivery)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {!estDelivery && (
                                        <p className="text-xs text-gray-400 italic px-1">Estimated delivery will appear once your order ships.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Action panel */}
                        <div className="w-full md:w-72 bg-white/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-gray-200 p-6 flex flex-col gap-3">

                            {/* Payment Status badge (right panel) */}
                            {payStatus && (
                                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wide ${payBadgeClass()}`}>
                                    <span>Payment Status</span>
                                    <span>{payStatus}</span>
                                </div>
                            )}

                            {/* Invoice */}
                            <div className={`rounded-xl bg-cream-50 transition-all duration-300 ${showInvoiceMenu ? 'border border-primary shadow-md' : 'border border-gray-200 hover:border-primary hover:shadow-md'}`}>
                                <button onClick={() => setShowInvoiceMenu(!showInvoiceMenu)} className="w-full flex items-center justify-between p-3.5 group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full shadow-sm flex shrink-0 items-center justify-center transition-colors ${showInvoiceMenu ? 'bg-primary text-white' : 'bg-white text-text-muted group-hover:bg-primary group-hover:text-white'}`}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <span className={`font-bold text-sm font-montserrat ${showInvoiceMenu ? 'text-primary' : 'text-text-main'}`}>Invoice</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-primary shrink-0 transition-transform duration-300 ${showInvoiceMenu ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`overflow-hidden transition-all duration-400 ease-in-out px-3.5 ${showInvoiceMenu ? 'max-h-[200px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                                        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary-50 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all">
                                            <Eye className="w-3.5 h-3.5" /> VIEW
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs hover:bg-secondary hover:text-white transition-all">
                                            <Mail className="w-3.5 h-3.5" /> EMAIL
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Help */}
                            <Link to="/help" className="group flex items-center justify-between p-3.5 rounded-xl bg-cream-50 border border-gray-200 hover:border-secondary hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-text-muted group-hover:bg-secondary group-hover:text-white transition-colors">
                                        <LifeBuoy className="w-4 h-4" />
                                    </div>
                                    <span className="text-text-main font-bold text-sm font-montserrat">Need Help?</span>
                                </div>
                            </Link>

                            {/* Cancel Order */}
                            {canCancel ? (
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="group flex items-center justify-between p-3.5 rounded-xl bg-cream-50 border border-gray-200 hover:border-red-400 hover:shadow-md transition-all disabled:opacity-60"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-white shadow-sm flex shrink-0 items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                        </div>
                                        <span className="text-red-500 font-bold text-sm font-montserrat group-hover:text-red-600">
                                            {cancelling ? 'Cancelling...' : 'Cancel Order'}
                                        </span>
                                    </div>
                                </button>
                            ) : (
                                orderStatus !== 'cancelled' && (
                                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 opacity-50 cursor-not-allowed">
                                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-400">
                                            <Ban className="w-4 h-4" />
                                        </div>
                                        <span className="text-gray-400 font-bold text-sm font-montserrat">Cannot Cancel</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* ── ITEMS CARD ───────────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] p-3 md:p-4 shadow-lg shadow-gray-200/40 border border-gray-100 mb-10">

                    <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
                        <div className="w-11 h-11 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                            <Receipt size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-black text-text-main">Package Details</h3>
                            <p className="text-xs font-bold text-text-muted tracking-widest uppercase">Your Order Items</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        {items.map((item, idx) => {
                            const activeStatus = item.status || order.status || 'pending';
                            const config = getStatusConfig(activeStatus);
                            const itemIsShipped = config.step >= 2;

                            // Tracking link
                            const trackingCode = item.trackingCode || item.tracking_code || item.tracking_id || '';
                            const trackingPage = item.courier?.trackingPage || item.tracking_page || '';
                            const trackingUrl  = trackingPage && trackingCode
                                ? trackingPage.replace('{code}', trackingCode).replace('%s', trackingCode)
                                : trackingCode.startsWith('http') ? trackingCode : null;

                            const productImg = item.product?.defaultImage || item.product?.default_image || item.image || item.product_id?.default_image || '';
                            const productName = item.name || item.product?.title || item.product_id?.title || 'Item';
                            const courierName = item.courier?.title || item.courierName || '';

                            return (
                                <div key={idx} className={`rounded-[1.5rem] p-5 md:p-7 border relative group overflow-hidden ${config.step === -1 ? 'bg-red-50/40 border-red-100' : 'bg-slate-50/60 border-gray-100'}`}>

                                    {/* Top: product info + status badge */}
                                    <div className="flex flex-col md:flex-row justify-between gap-5 mb-6">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-20 h-28 bg-white rounded-2xl shadow-sm shrink-0 overflow-hidden border border-gray-100 p-2">
                                                {productImg ? (
                                                    <img src={productImg} alt={productName} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={26} /></div>
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Item {idx + 1}</span>
                                                <h4 className="text-base font-bold text-text-main mb-1 leading-snug line-clamp-2 font-montserrat">{productName}</h4>
                                                <p className="font-black text-text-main text-lg">{formatAmount(item.price, order.currency)}</p>
                                                {item.quantity > 1 && <p className="text-xs text-text-muted mt-0.5">Qty: {item.quantity}</p>}

                                                {/* Courier + Track Package */}
                                                {(courierName || trackingCode) && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {courierName && (
                                                            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-text-muted">
                                                                <Truck size={11} /> {courierName}
                                                            </span>
                                                        )}
                                                        {trackingCode && (
                                                            trackingUrl ? (
                                                                <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 bg-primary-50 border border-primary-100 px-3 py-1 rounded-lg text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-colors">
                                                                    <ExternalLink size={11} /> Track Package
                                                                </a>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 bg-cream-50 border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-text-muted">
                                                                    TRK: {trackingCode}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status badge — includes payment status */}
                                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                                            <span className={`px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-widest border flex items-center gap-1.5 ${config.bgPill} ${config.color}`}>
                                                <config.icon size={13} /> {activeStatus}
                                            </span>
                                            {payStatus && (
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${payBadgeClass()}`}>
                                                    {payStatus}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── BEFORE / AFTER SHIP DIVISION (per item) ── */}
                                    {itemIsShipped && (shippedAt || estDelivery) && (
                                        <div className="mb-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="h-px flex-1 bg-blue-200"></div>
                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest px-1">Shipment Info</span>
                                                <div className="h-px flex-1 bg-blue-200"></div>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {shippedAt && (
                                                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                                                        <Truck size={13} className="text-blue-500" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Shipped</p>
                                                            <p className="text-xs font-bold text-blue-700">{formatDate(shippedAt)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {estDelivery && (
                                                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                                                        <Calendar size={13} className="text-green-500" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Est. Delivery</p>
                                                            <p className="text-xs font-bold text-green-700">{formatDate(estDelivery)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    {config.step === -1 ? (
                                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${config.bgPill}`}>
                                            <config.icon className={config.color} size={22} />
                                            <div>
                                                <p className={`text-sm font-bold ${config.color}`}>This item is {activeStatus}.</p>
                                                {(item.cancelNote || item.cancel_note || item.returnNote || item.return_note) && (
                                                    <p className="text-xs mt-1 text-gray-600">Reason: {item.cancelNote || item.cancel_note || item.returnNote || item.return_note}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative pt-6 px-2 md:px-6">
                                            <div className="absolute left-[10%] right-[10%] top-11 h-3 bg-gray-200/60 rounded-full"></div>
                                            <div
                                                className="absolute left-[10%] top-11 h-3 bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,141,218,0.3)]"
                                                style={{ width: `${config.step >= 3 ? 80 : config.step >= 2 ? 40 : 0}%` }}
                                            ></div>
                                            <div className="flex items-center justify-between relative">
                                                {[
                                                    { step: 1, icon: ClipboardCheck, label: 'Confirmed', activeColor: 'bg-primary shadow-primary/40 ring-primary-50' },
                                                    { step: 2, icon: Truck, label: 'Shipped', activeColor: 'bg-blue-500 shadow-blue-400/40 ring-blue-50' },
                                                    { step: 3, icon: MapPin, label: 'Delivered', activeColor: 'bg-green-500 shadow-green-500/40 ring-green-50' },
                                                ].map(({ step, icon: Icon, label, activeColor }) => (
                                                    <div key={step} className="flex flex-col items-center gap-3 w-24">
                                                        <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${config.step >= step ? `${activeColor} text-white shadow-lg ring-4 scale-110` : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                                                            <Icon size={22} strokeWidth={2} />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest text-center ${config.step >= step ? 'text-text-main' : 'text-gray-400'}`}>{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer totals */}
                    <div className="mt-4 bg-white rounded-[1.5rem] p-5 border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-text-muted">
                                <Info size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Order Placed</p>
                                <p className="text-sm font-black text-text-main">{formatDate(placedAt) || '—'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Amount</p>
                            <p className="text-2xl font-black text-primary">
                                {formatAmount((order.total || 0) + (order.shippingCost || order.shipping_cost || 0), order.currency)}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </AccountLayout>
    );
};

export default OrderStatus;
