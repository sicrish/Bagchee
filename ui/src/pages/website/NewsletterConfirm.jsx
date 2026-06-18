import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';

const API_URL = process.env.REACT_APP_API_URL;

const NewsletterConfirm = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [message, setMessage] = useState('');
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;     // guard against StrictMode double-invoke
        ran.current = true;

        if (!token) {
            setStatus('error');
            setMessage('This confirmation link is invalid.');
            return;
        }
        (async () => {
            try {
                const res = await axios.post(`${API_URL}/newsletter-subs/confirm`, { token });
                if (res.data?.status) {
                    setStatus('success');
                    setMessage(res.data.msg || 'Your subscription is confirmed.');
                } else {
                    setStatus('error');
                    setMessage(res.data?.msg || 'We could not confirm your subscription.');
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.msg || 'This confirmation link has expired or is invalid.');
            }
        })();
    }, [token]);

    return (
        <div className="min-h-[60vh] bg-cream-50 flex items-center justify-center px-4 py-16 font-body">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-cream-200 p-8 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="animate-spin text-primary mx-auto mb-5" size={40} />
                        <h1 className="text-xl font-display text-text-main">Confirming your subscription…</h1>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 className="text-green-600" size={34} />
                        </div>
                        <h1 className="text-2xl font-display text-text-main mb-3">You're subscribed! 🎉</h1>
                        <p className="text-text-muted text-sm leading-relaxed mb-6">{message}</p>
                        <Link to="/" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors">
                            Start Exploring
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <XCircle className="text-red-500" size={34} />
                        </div>
                        <h1 className="text-2xl font-display text-text-main mb-3">Link not valid</h1>
                        <p className="text-text-muted text-sm leading-relaxed mb-6">{message}</p>
                        <Link to="/newsletter/subscribe" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors">
                            Subscribe again
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default NewsletterConfirm;
