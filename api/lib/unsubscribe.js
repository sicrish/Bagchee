// Single source of truth for the newsletter unsubscribe link + token.
//
// The newsletter router is mounted at `/newsletter-subs` (see api/app.js) and is proxied
// under `/api` in production (the frontend build sets REACT_APP_API_URL=https://www.bagchee.com/api,
// see deploy.sh), so the public unsubscribe endpoint is:
//
//     <FRONTEND_URL>/api/newsletter-subs/unsubscribe?email=…&token=…
//
// ⚠️ Historically every email pointed at `/api/newsletter/unsubscribe` (missing `-subs`),
// which 404s — so unsubscribe never worked. Build links ONLY through this helper so the
// path and the HMAC token can never drift from the route handler again.
import crypto from 'crypto';

const frontendBase = () =>
    (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();

// HMAC of the lowercased email — proves the link was issued by us (no DB lookup needed).
// Generation (here) and verification (unsubscribeNewsletter) MUST use this same function.
export const unsubscribeToken = (email) =>
    crypto
        .createHmac('sha256', process.env.ENCRYPTION_SECRET || 'bagchee-unsub-secret')
        .update(String(email || '').toLowerCase())
        .digest('hex');

// Fully-qualified, tokenised unsubscribe URL for a recipient.
export const unsubscribeUrl = (email) =>
    `${frontendBase()}/api/newsletter-subs/unsubscribe` +
    `?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`;
