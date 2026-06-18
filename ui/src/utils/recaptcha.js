// Google reCAPTCHA v3 loader. Invisible — no user interaction.
// If REACT_APP_RECAPTCHA_SITE_KEY is not set at build time, every call resolves
// to "" and the app keeps working on the server-side anti-spam layers
// (honeypot + time-trap + rate limit + double opt-in).

const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

export const recaptchaEnabled = () => Boolean(SITE_KEY);

const loadScript = () =>
    new Promise((resolve) => {
        if (!SITE_KEY) return resolve(null);
        if (window.grecaptcha) return resolve(window.grecaptcha);

        const existing = document.querySelector('script[data-recaptcha]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.grecaptcha || null));
            existing.addEventListener('error', () => resolve(null));
            return;
        }
        const s = document.createElement('script');
        s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
        s.async = true;
        s.defer = true;
        s.setAttribute('data-recaptcha', '1');
        s.onload = () => resolve(window.grecaptcha || null);
        s.onerror = () => resolve(null);
        document.head.appendChild(s);
    });

// Preload the script (call on page mount so the token is ready by submit time).
export const preloadRecaptcha = () => { loadScript(); };

// Returns a fresh token for the given action, or "" if reCAPTCHA isn't configured.
export const getRecaptchaToken = async (action = 'submit') => {
    if (!SITE_KEY) return '';
    try {
        const g = await loadScript();
        if (!g) return '';
        await new Promise((res) => g.ready(res));
        return await g.execute(SITE_KEY, { action });
    } catch {
        return '';
    }
};
