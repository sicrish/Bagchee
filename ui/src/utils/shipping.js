// Single source of truth for a shipping option's price in the customer's currency.
// (29-June) Shipping is a FIXED admin-defined amount per currency, read straight from the
// ShippingOption record (priceUsd / priceEur / priceGbp / priceInr) — NOT an exchange-rate
// conversion. The cart, both checkout panels, the order total and the server-side PayPal
// charge all read this same value, so they always agree (no FX drift on the shipping line).
//
// Returns the raw per-currency amount (0 when unset — the caller renders that as "Free").
// Free-shipping-over-threshold and tiered-option rules are applied by the caller.
export const shippingPriceFor = (option, currency) => {
  if (!option) return 0;
  const num = (v) => Math.max(0, Number(v) || 0);
  switch (currency) {
    case 'EUR': return num(option.priceEur ?? option.price_eur);
    case 'GBP': return num(option.priceGbp ?? option.price_gbp);
    case 'INR': return num(option.priceInr ?? option.price_inr);
    default:    return num(option.priceUsd ?? option.price_usd); // USD + any unknown code
  }
};

export default shippingPriceFor;
