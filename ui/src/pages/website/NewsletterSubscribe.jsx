import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Mail, Check, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { preloadRecaptcha, getRecaptchaToken, recaptchaEnabled } from '../../utils/recaptcha';

const API_URL = process.env.REACT_APP_API_URL;

const NewsletterSubscribe = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const initialEmail = location.state?.email || searchParams.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    const [categories, setCategories] = useState([]);
    const [selected, setSelected] = useState(() => new Set());
    const [loadingCats, setLoadingCats] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Honeypot (bots fill it, humans never see it) + render time (time-trap).
    const [honeypot, setHoneypot] = useState('');
    const renderedAt = useRef(Date.now());

    useEffect(() => { preloadRecaptcha(); }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await axios.get(`${API_URL}/newsletter-subs/categories`);
                if (alive && res.data?.status) setCategories(res.data.data || []);
            } catch {
                /* page still works without categories */
            } finally {
                if (alive) setLoadingCats(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const allSelected = useMemo(
        () => categories.length > 0 && selected.size === categories.length,
        [categories, selected]
    );

    const toggle = (title) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(title) ? next.delete(title) : next.add(title);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(categories.map((c) => c.title)));
    };

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const clean = email.trim();
        if (!emailRe.test(clean)) return toast.error('Please enter a valid email address.');
        if (submitting) return;

        setSubmitting(true);
        try {
            const recaptchaToken = await getRecaptchaToken('newsletter');
            const res = await axios.post(`${API_URL}/newsletter-subs/subscribe`, {
                email: clean,
                categories: [...selected],
                recaptchaToken,
                website: honeypot,           // honeypot
                t: renderedAt.current,       // time-trap
            });
            if (res.data?.status) {
                setDone(true);
            } else {
                toast.error(res.data?.msg || 'Could not subscribe. Please try again.');
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Server error. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-[60vh] bg-cream-50 flex items-center justify-center px-4 py-16 font-body">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-cream-200 p-8 text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Mail className="text-green-600" size={30} />
                    </div>
                    <h1 className="text-2xl font-display text-text-main mb-3">Almost there!</h1>
                    <p className="text-text-muted text-sm leading-relaxed mb-2">
                        We've sent a confirmation link to <span className="font-semibold text-text-main">{email.trim()}</span>.
                    </p>
                    <p className="text-text-muted text-sm leading-relaxed mb-6">
                        Please open that email and click <span className="font-semibold">"Confirm my subscription"</span> to start
                        receiving updates. (Check your spam folder if it isn't in your inbox.)
                    </p>
                    <Link to="/" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] bg-cream-50 flex items-center justify-center px-4 py-12 font-body">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg border border-cream-200 overflow-hidden">
                <div className="bg-primary px-6 sm:px-8 py-6 text-white">
                    <h1 className="text-2xl sm:text-3xl font-display">Subscribe to our Newsletter</h1>
                    <p className="text-white/80 text-sm mt-1">Pick the subjects you love — we'll only send what you care about.</p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-7">
                    {/* Email */}
                    <label className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-2">Your email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full border border-cream-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-6"
                        required
                    />

                    {/* Honeypot — visually hidden, off-screen, not announced to AT. */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', height: 0, width: 0, overflow: 'hidden' }}>
                        <label>Website
                            <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                        </label>
                    </div>

                    {/* Categories */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Your interests <span className="font-normal normal-case">(optional)</span></span>
                        {categories.length > 0 && (
                            <button type="button" onClick={toggleAll} className="text-xs font-semibold text-primary hover:underline">
                                {allSelected ? 'Clear all' : 'Select all'}
                            </button>
                        )}
                    </div>

                    {loadingCats ? (
                        <div className="flex items-center gap-2 text-text-muted text-sm py-6 justify-center">
                            <Loader2 className="animate-spin" size={18} /> Loading subjects…
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="text-text-muted text-sm mb-4">You'll receive our general updates.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                            {categories.map((cat) => {
                                const isOn = selected.has(cat.title);
                                return (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => toggle(cat.title)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                                            isOn ? 'border-primary bg-primary/5 text-text-main' : 'border-cream-200 hover:border-cream-200 text-text-muted'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${isOn ? 'bg-primary border-primary' : 'border-cream-200'}`}>
                                            {isOn && <Check size={13} className="text-white" />}
                                        </span>
                                        {cat.title}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-primary-dark transition-all active:scale-[0.99] disabled:opacity-60"
                    >
                        {submitting ? <><Loader2 className="animate-spin" size={18} /> Submitting…</> : <><CheckCircle2 size={18} /> Confirm subscription</>}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted mt-4 text-center">
                        <ShieldCheck size={13} /> We'll email you a link to confirm. You can unsubscribe anytime.
                    </p>
                    {recaptchaEnabled() && (
                        <p className="text-[10px] text-text-muted/70 mt-2 text-center leading-snug">
                            This site is protected by reCAPTCHA and the Google{' '}
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a> and{' '}
                            <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Terms of Service</a> apply.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default NewsletterSubscribe;
