import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function PayPalReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const done = useRef(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (done.current) return;
        done.current = true;

        const token = searchParams.get('token'); // PayPal order ID
        const cancelled = searchParams.get('cancelled'); // set by cancel_url redirect

        if (cancelled || !token) {
            toast.error("Payment cancelled. Your order is saved — you can retry from My Orders.");
            navigate('/account/orders', { replace: true });
            return;
        }

        const pending = (() => {
            try { return JSON.parse(sessionStorage.getItem('paypal_pending') || '{}'); }
            catch { return {}; }
        })();

        if (!pending.orderId) {
            setErrorMsg("Session expired — your order is saved. If payment was deducted, contact support.");
            return;
        }

        const capture = async () => {
            try {
                const auth = JSON.parse(localStorage.getItem('auth') || '{}');
                const token_jwt = auth?.token;

                // Deferred-payment customers arrive without a JWT — use token-based capture
                const useTokenCapture = !token_jwt && pending.paymentToken;
                const endpoint = useTokenCapture ? '/paypal/capture-by-token' : '/paypal/capture-order';
                const body = useTokenCapture
                    ? { token, orderId: pending.orderId, paymentToken: pending.paymentToken }
                    : { token, orderId: pending.orderId };

                const res = await axios.post(
                    `${API_BASE_URL}${endpoint}`,
                    body,
                    { headers: token_jwt ? { Authorization: `Bearer ${token_jwt}` } : {} }
                );

                if (res.data?.status) {
                    sessionStorage.removeItem('paypal_pending');
                    toast.success("Payment successful!");

                    // Fetch full order data so the receipt page can render everything
                    let orderDetails = { id: pending.orderId, orderNumber: pending.orderNumber };
                    try {
                        const orderRes = await axios.get(
                            `${API_BASE_URL}/orders/get/${pending.orderId}`,
                            { headers: token_jwt ? { Authorization: `Bearer ${token_jwt}` } : {} }
                        );
                        if (orderRes.data?.status && orderRes.data?.data) {
                            orderDetails = orderRes.data.data;
                        }
                    } catch (_) { /* fall back to minimal data */ }

                    navigate('/order-receipt', {
                        state: { orderDetails, paymentConfirmed: true },
                        replace: true,
                    });
                } else {
                    setErrorMsg(res.data?.msg || "Payment capture failed. Please contact support.");
                }
            } catch (err) {
                setErrorMsg(err.response?.data?.msg || "Something went wrong. Please contact support.");
            }
        };

        capture();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (errorMsg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
                <p className="text-red-600 text-lg font-semibold mb-4">{errorMsg}</p>
                <p className="text-gray-600 mb-6">Your order has been saved. If payment was deducted, please email us at <a href="mailto:admin@bagchee.com" className="underline">admin@bagchee.com</a> with your order number.</p>
                <a href="/account/orders" className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800">View My Orders</a>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-700 font-medium">Confirming your payment, please wait…</p>
        </div>
    );
}
