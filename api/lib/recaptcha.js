// Google reCAPTCHA v3 server-side verification.
//
// Graceful degradation: if RECAPTCHA_SECRET is not set in the environment, this
// returns { ok: true, skipped: true } so the newsletter flow keeps working on
// the other defenses (honeypot + time-trap + rate limit + double opt-in) until
// the key is added. Once RECAPTCHA_SECRET is present, a low score / failure is
// rejected.
//
// v3 returns a `score` in [0,1] (1 = very likely human). 0.5 is Google's
// suggested default threshold.

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_THRESHOLD = 0.5;

export const verifyRecaptcha = async (token, remoteIp) => {
    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) return { ok: true, skipped: true };          // not configured yet
    if (!token)  return { ok: false, reason: 'missing-token' };

    const threshold = Number(process.env.RECAPTCHA_MIN_SCORE) || DEFAULT_THRESHOLD;

    try {
        const body = new URLSearchParams({ secret, response: token });
        if (remoteIp) body.append('remoteip', remoteIp);

        const res = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();

        // v3 always has a score; v2 has no score (treat as pass when success).
        const scoreOk = data.score === undefined || data.score >= threshold;
        return {
            ok: Boolean(data.success) && scoreOk,
            score: data.score,
            reason: data.success ? (scoreOk ? null : 'low-score') : 'verify-failed',
            errors: data['error-codes'],
        };
    } catch (err) {
        // Network/timeout talking to Google — fail OPEN so we never block real
        // subscribers on a Google outage (the other layers still apply).
        return { ok: true, degraded: true, reason: 'verify-error' };
    }
};
