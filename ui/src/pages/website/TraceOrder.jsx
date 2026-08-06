'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import { Search, ShoppingBag, Mail, ArrowRight, Fingerprint, RefreshCw, ShieldCheck, Lock, Check, Package, ChevronLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { encryptData } from '../../utils/encryption.js';
import Logo from '../../components/common/Logo.jsx';

const TraceOrder = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'guest' ? 'guest' : 'returning');
    const [tracedOrder, setTracedOrder] = useState(null);

    // --- Captcha Logic ---
    const [captchaCode, setCaptchaCode] = useState("");
    const [userCaptchaInput, setUserCaptchaInput] = useState("");

    const generateCaptcha = useCallback(() => {
        const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setCaptchaCode(result);
        setUserCaptchaInput("");
    }, []);

    useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);

    // States
    const [orderId, setOrderId] = useState("");
    const [shippingEmail, setShippingEmail] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    // 🟢 React Query: Guest Track Mutation
    const trackOrderMutation = useMutation({
        mutationFn: async (trackData) => {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/orders/guest-track`, trackData);
            return res.data;
        },
        onSuccess: (data) => {
            if (data.status) {
                setTracedOrder(data.data);
            } else {
                toast.error(data.msg || "Order not found.");
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.msg || "Order not found. Please check your details.");
        }
    });

    // 🟢 React Query: Login Mutation
    const loginMutation = useMutation({
        mutationFn: async (loginData) => {
            const encryptedPayload = encryptData(loginData);
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/login`, { data: encryptedPayload });
            return res.data;
        },
        onSuccess: (data) => {
            if (data.status) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("auth", JSON.stringify(data));
                toast.success("Welcome back!");
                navigate(data.userDetails?.role === 'admin' ? '/admin' : '/account/orders');
            } else {
                toast.error(data.msg);
                generateCaptcha();
            }
        }
    });

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (userCaptchaInput.toUpperCase() !== captchaCode) {
            toast.error("Invalid Captcha Code!");
            generateCaptcha();
            return;
        }
        loginMutation.mutate({ email, password, rememberMe });
    };

    const handleGuestTrack = (e) => {
        e.preventDefault();
        trackOrderMutation.mutate({ orderId, email: shippingEmail });
    };

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 pb-12 overflow-x-hidden w-full">

            {/* Logo — same as Login page */}
            <div className="flex justify-center mb-6">
                <Link
                    to="/"
                    className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 block cursor-pointer"
                >
                    <Logo className="h-12 w-auto text-white" />
                </Link>
            </div>

            <h2 className="text-3xl text-text-main mb-8 uppercase tracking-wide font-display animate-fadeInLeft">
                Trace Order
            </h2>

            {/* Card */}
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-cream-200 overflow-hidden animate-fadeInUp">

                {/* ─── FIXED TABS ─── */}
                <div className="flex border-b border-gray-100 bg-gray-50/50 font-montserrat">
                    <button
                        onClick={() => setActiveTab('returning')}
                        className={`flex-1 py-4 md:py-6 text-[11px] md:text-sm font-bold uppercase tracking-normal md:tracking-widest transition-all duration-300 flex items-center justify-center gap-2
${activeTab === 'returning' ? 'bg-white text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-text-main hover:bg-gray-100'}`}
                    >
                        <Fingerprint size={18} /> Returning Customer
                    </button>
                    <button
                        onClick={() => setActiveTab('guest')}
                        className={`flex-1 py-4 md:py-6 text-[11px] md:text-sm font-bold uppercase tracking-normal md:tracking-widest transition-all duration-300 flex items-center justify-center gap-2
${activeTab === 'guest' ? 'bg-white text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-text-main hover:bg-gray-100'}`}
                    >
                        <Search size={18} /> Guest Order Look Up
                    </button>
                </div>

                {/* 🟢 DYNAMIC CONTENT AREA with min-height to prevent jumping */}
                <div className="p-6 md:p-10 min-h-[520px] flex flex-col justify-center">
                    {activeTab === 'returning' ? (
                        /* --- LOGIN FORM --- */
                        <form className="space-y-6 max-w-lg mx-auto w-full" onSubmit={handleLoginSubmit}>
                            <input
                                type="email" required placeholder="Email Address"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-4 outline-none transition-all placeholder-gray-500"
                            />

                            <input
                                type="password" required placeholder="Password"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-4 outline-none transition-all placeholder-gray-500"
                            />

                            {/* CAPTCHA */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-green-500" /> Security Verification
                                    </span>
                                    <button type="button" onClick={generateCaptcha} className="text-primary hover:rotate-180 transition-transform duration-500">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                    <div className="bg-white px-4 sm:px-6 py-3 rounded-lg border-2 border-dashed border-primary/20 select-none pointer-events-none text-center min-w-[120px]">
                                        <span className="text-xl font-black tracking-[0.3em] italic text-primary font-display line-through opacity-70">
                                            {captchaCode}
                                        </span>
                                    </div>
                                    <input
                                        type="text" required placeholder="Code"
                                        value={userCaptchaInput} onChange={(e) => setUserCaptchaInput(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none uppercase font-bold text-center tracking-widest text-text-main"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                                            className="peer h-4 w-4 appearance-none rounded border border-gray-300 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                        />
                                        <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                    </div>
                                    <span className="ml-2 text-sm text-text-muted group-hover:text-primary transition-colors">Remember me</span>
                                </label>
                                <Link to="/forgot-password" size={12} className="text-sm font-bold text-primary hover:text-primary-dark font-montserrat">
                                    Forget Password
                                </Link>
                            </div>

                            <div className="flex justify-center pt-2">
                                <button
                                    type="submit"
                                    disabled={loginMutation.isPending}
                                    className={`px-12 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat w-full sm:w-auto ${loginMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loginMutation.isPending ? 'SIGNING IN...' : 'SIGN IN'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* --- GUEST TRACKING FORM --- */
                        <form className="space-y-8 max-w-lg mx-auto w-full" onSubmit={handleGuestTrack}>
                            <div className="relative group">
                                <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text" required placeholder="Order Number"
                                    value={orderId} onChange={(e) => setOrderId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block outline-none transition-all placeholder-gray-500"
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="email" required placeholder="Shipping Email Address"
                                    value={shippingEmail} onChange={(e) => setShippingEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block outline-none transition-all placeholder-gray-500"
                                />
                            </div>
                            <div className="flex justify-center pt-6">
                                <button
                                    type="submit"
                                    disabled={trackOrderMutation.isPending}
                                    className="px-12 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat w-full sm:w-auto"
                                >
                                    {trackOrderMutation.isPending ? 'SEARCHING...' : 'VIEW ORDER STATUS'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* --- GUEST ORDER RESULT --- */}
            {tracedOrder && (
                <div className="max-w-3xl w-full mt-6 bg-white rounded-2xl shadow-2xl border border-cream-200 overflow-hidden animate-fadeInUp">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            <h3 className="font-bold text-xs text-text-main uppercase tracking-widest font-montserrat">
                                Order #{tracedOrder.orderNumber || tracedOrder.id}
                            </h3>
                        </div>
                        <button
                            onClick={() => setTracedOrder(null)}
                            className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 font-bold"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex flex-wrap gap-3 text-xs font-bold">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                                Status: {tracedOrder.status}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                                Payment: {tracedOrder.paymentStatus}
                            </span>
                            {tracedOrder.currency && (
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                                    {tracedOrder.currency}
                                </span>
                            )}
                        </div>
                        {(() => {
                            // Cancelled lines (out of print / other) are excluded from the charge but
                            // still LISTED — struck through, with the reason — because a customer who
                            // simply stops seeing books he ordered assumes they went missing (order
                            // 17675). Only the money ignores them. A membership bought with the order
                            // is not a line item — shown as one. The total is `payableTotal` from the
                            // API, never the raw stored total: that still carries the cancelled books
                            // and would over-state the bill.
                            const cancelled = (s) => ['cancelled', 'cancelled - other']
                                .includes(String(s ?? '').trim().toLowerCase());
                            // 'cancelled' is out of print; 'cancelled - other' is any other reason.
                            // The raw value never reaches the customer — only this friendly label.
                            const cancelLabel = (s) => (String(s ?? '').trim().toLowerCase() === 'cancelled'
                                ? 'Out of print' : 'Cancelled');
                            const cur = tracedOrder.currency || 'USD';
                            const money = (n) => `${Number(n || 0).toFixed(2)}`;
                            const allLines = tracedOrder.items || [];
                            const lines = allLines.filter((it) => !cancelled(it.status));
                            const fee = Math.max(0, Number(tracedOrder.membershipFee ?? tracedOrder.membership_fee) || 0);
                            const memberDiscount = Math.max(0, Number(tracedOrder.payableMembershipDiscount) || 0);
                            const shipping = Math.max(0, Number(
                                tracedOrder.payableShipping ?? tracedOrder.shippingCost ?? tracedOrder.shipping_cost) || 0);
                            const itemsTotal = lines.reduce(
                                (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
                            const grand = tracedOrder.payableTotal != null
                                ? Number(tracedOrder.payableTotal) : Number(tracedOrder.total || 0);
                            const cancelledCount = allLines.length - lines.length;
                            const row = (label, value, cls = 'text-text-main') => (
                                <div className="flex justify-between items-center py-1 text-sm">
                                    <span className="text-gray-500">{label}</span>
                                    <span className={`font-bold ${cls}`}>{value}</span>
                                </div>
                            );
                            return (
                                <>
                                    <div className="divide-y divide-gray-50">
                                        {allLines.map((item, i) => {
                                            const isCut = cancelled(item.status);
                                            return (
                                                <div key={i} className="flex justify-between items-center py-3">
                                                    <div>
                                                        <p className={`text-sm font-bold ${isCut ? 'text-red-600 line-through' : 'text-text-main'}`}>
                                                            {item.name}
                                                        </p>
                                                        {isCut ? (
                                                            <p className="text-[10px] font-black text-red-600 uppercase tracking-wide mt-0.5">
                                                                {cancelLabel(item.status)} — not charged
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                                        )}
                                                    </div>
                                                    <span className={`text-sm font-black ${isCut ? 'text-red-600 line-through' : 'text-text-main'}`}>
                                                        {money(item.price)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {fee > 0 && (
                                            <div className="flex justify-between items-center py-3">
                                                <div>
                                                    <p className="text-sm font-bold text-text-main">Bagchee Membership (1 Year)</p>
                                                    <p className="text-xs text-gray-400">Qty: 1</p>
                                                </div>
                                                <span className="text-sm font-black text-text-main">{money(fee)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-gray-100">
                                        {lines.length > 0 && row('Items total', money(itemsTotal + fee))}
                                        {memberDiscount > 0 && row('Membership discount', `−${money(memberDiscount)}`, 'text-red-600')}
                                        {lines.length > 0 && (shipping > 0
                                            ? row('Shipping', money(shipping))
                                            : row('Shipping', 'FREE', 'text-green-600'))}
                                        <div className="pt-2 mt-1 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-sm font-black text-text-main uppercase tracking-wide">Total</span>
                                            <span className="text-xl font-black text-primary">
                                                {money(grand)} {cur}
                                            </span>
                                        </div>
                                        {cancelledCount > 0 && (
                                            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
                                                The {cancelledCount === 1 ? 'title' : 'titles'} crossed out above {cancelledCount === 1 ? 'is' : 'are'} no
                                                longer available, so {cancelledCount === 1 ? 'it has' : 'they have'} been removed from your order.
                                                You have <strong>not</strong> been charged for {cancelledCount === 1 ? 'it' : 'them'} — the total above
                                                covers the remaining items only.
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                        {tracedOrder.status === 'payment pending' && tracedOrder.paymentLink && (
                            <a
                                href={tracedOrder.paymentLink}
                                className="block w-full text-center bg-primary text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-primary-dark transition-all shadow-md mt-2"
                            >
                                Complete Payment →
                            </a>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default TraceOrder;