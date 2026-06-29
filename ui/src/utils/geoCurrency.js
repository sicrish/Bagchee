// Maps an ISO 3166-1 alpha-2 country code (from the /geo endpoint — Cloudflare's
// cf-ipcountry header or the geoip-lite fallback) to the default storefront currency a
// first-time visitor should see. Decided 29-June with the client:
//   • India            → INR  (existing rule; India is also geo-restricted elsewhere)
//   • United Kingdom   → GBP
//   • EU + EEA states  → EUR
//   • everywhere else  → USD  (US, Canada, all of the Americas, Asia, Africa, Oceania, …)
//
// A visitor can still switch currency from the header; their choice is remembered
// (CurrencyContext + localStorage 'bagchee_currency_manual') and overrides this default.

// 27 EU members + the 3 non-EU EEA states (Norway, Iceland, Liechtenstein).
// 'EL' is included alongside 'GR' because Greece appears as either code in some datasets.
const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'EL', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', // EU 27
  'NO', 'IS', 'LI', // EEA (non-EU)
]);

export const countryToCurrency = (code) => {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return 'USD';
  if (c === 'IN') return 'INR';
  if (c === 'GB' || c === 'UK') return 'GBP';
  if (EUR_COUNTRIES.has(c)) return 'EUR';
  return 'USD';
};

export default countryToCurrency;
