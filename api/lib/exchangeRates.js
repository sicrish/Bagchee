// Server-side USD→foreign exchange rates, used to settle orders in the customer's
// currency (EUR / GBP) so the PayPal charge, invoice, email and admin view all match
// what the customer saw at checkout. The frontend (CurrencyContext) uses the same
// exchangerate-api.com source, so display and charge stay within rate-drift of each other.
//
// Rates are cached in memory so checkout never blocks on the FX API, and we fall back to
// sane defaults (matching the frontend's defaults) if the API key is missing or the call fails.

let cache = { rates: null, ts: 0 };
const TTL = 6 * 60 * 60 * 1000; // 6 hours
const FALLBACK = { USD: 1, EUR: 0.92, GBP: 0.78 };

async function loadRates() {
    if (cache.rates && Date.now() - cache.ts < TTL) return cache.rates;

    const key = process.env.EXCHANGE_RATE_API_KEY;
    if (key) {
        try {
            const r = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`);
            const d = await r.json();
            if (r.ok && d?.conversion_rates) {
                cache = { rates: d.conversion_rates, ts: Date.now() };
                return cache.rates;
            }
        } catch {
            /* fall through to fallback */
        }
    }
    // Cache the fallback briefly too, so a missing/broken key doesn't hammer the API every order.
    cache = { rates: { ...FALLBACK }, ts: Date.now() };
    return cache.rates;
}

// USD→`currency` multiplier. Returns 1 for USD or anything unknown so callers are always safe.
export async function getUsdConversionRate(currency) {
    if (!currency || currency === 'USD') return 1;
    const rates = await loadRates();
    const rate = Number(rates?.[currency]);
    return rate > 0 ? rate : (FALLBACK[currency] || 1);
}
