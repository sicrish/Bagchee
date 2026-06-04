// Shared rule for partial-order invoicing (#5 — June 2026).
//
// When an admin marks an out-of-print line item as "cancelled", that item is excluded
// from the customer-facing invoice, the payment page, and EVERY charge path
// (Razorpay / PayPal) so the customer pays only for the available titles.
//
// This is the single source of truth — imported by the order / razorpay / paypal / email
// controllers and the invoice PDF generator so the amount shown to the customer and the
// amount actually charged can never drift apart.

export const CANCELLED_STATUS = 'cancelled';

// An item is "cancelled" when its per-item status equals 'cancelled' (case-insensitive).
export const isCancelledItem = (item) =>
    String(item?.status ?? '').trim().toLowerCase() === CANCELLED_STATUS;

// Line items the customer actually pays for / sees.
export const activeItems = (items = []) => (items || []).filter((it) => !isCancelledItem(it));

// Line items that have been cancelled (out of print).
export const cancelledItems = (items = []) => (items || []).filter(isCancelledItem);

// Gross value (price × qty) of a list of line items, rounded to 2 dp.
const sumItems = (items = []) =>
    Math.round((items || []).reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0) * 100) / 100;

// Total book count of a list of line items (every OrderItem is a physical book —
// gift cards are NOT stored as order items, they go through a separate path).
const bookCount = (items = []) =>
    (items || []).reduce((n, it) => n + (Number(it.quantity) || 1), 0);

// ---------------------------------------------------------------------------
// Tiered shipping (Expedited / Express) — recompute on partial invoicing.
//
// Expedited & Express shipping are priced in QUANTITY BANDS (not per book and not a
// flat rate). When a book is cancelled the remaining shipment may fall into a lower
// band, so the customer should be charged that lower band's rate.
//
// ⚠️ KEEP IN SYNC with the frontend table in ui/src/pages/website/Cart.jsx
//    (SHIPPING_TIERS — Express = option id 5, Expedited = option id 3). If a tier
//    price changes there, change it here too.
// ---------------------------------------------------------------------------
const EXPRESS_TIERS = [ // Express (3-5 Business Days) — option id 5
    { min: 1,   max: 2,        usd: 50 },
    { min: 3,   max: 6,        usd: 80 },
    { min: 7,   max: 11,       usd: 110 },
    { min: 12,  max: 15,       usd: 150 },
    { min: 16,  max: 20,       usd: 200 },
    { min: 21,  max: 25,       usd: 280 },
    { min: 26,  max: 36,       usd: 350 },
    { min: 37,  max: 50,       usd: 435 },
    { min: 51,  max: 100,      usd: 550 },
    { min: 101, max: Infinity, usd: 730 },
];
const EXPEDITED_TIERS = [ // Expedited (8-12 Business Days) — option id 3
    { min: 1,   max: 2,        usd: 20 },
    { min: 3,   max: 6,        usd: 35 },
    { min: 7,   max: 11,       usd: 50 },
    { min: 12,  max: 15,       usd: 80 },
    { min: 16,  max: 20,       usd: 120 },
    { min: 21,  max: 25,       usd: 150 },
    { min: 26,  max: 36,       usd: 175 },
    { min: 37,  max: 50,       usd: 222 },
    { min: 51,  max: 100,      usd: 280 },
    { min: 101, max: Infinity, usd: 400 },
];

// Which tier table applies to this order, from its stored shippingType string.
// Mirrors the keyword detection in order.controller.saveOrder. Standard / free
// shipping returns null (never recomputed). Check 'expedited' before 'express'.
const tierTableFor = (order) => {
    const t = String(order?.shippingType ?? '').toLowerCase();
    if (t.includes('expedited')) return EXPEDITED_TIERS;
    if (t.includes('express')) return EXPRESS_TIERS;
    return null;
};

// Band rate (USD) for a given book count. 0 books = 0; above the table = top band.
const tierUsd = (tiers, books) => {
    if (books <= 0) return 0;
    const band = tiers.find((b) => books >= b.min && books <= b.max);
    return band ? band.usd : tiers[tiers.length - 1].usd;
};

// Shipping the customer should actually be charged after any cancellations.
//
// For Expedited / Express orders we re-band the shipping for the REMAINING (active)
// books and scale the stored shippingCost by newBand / originalBand. Scaling by the
// ratio (rather than recomputing an absolute USD figure) keeps EUR / GBP orders correct
// without exchange rates and is robust to any manual shippingCost edit by the admin.
//
// Returns the original shippingCost UNCHANGED when: there is no shipping cost, the order
// isn't Expedited/Express (standard/free is flat — never re-banded), or nothing was
// cancelled so the book count is unchanged. So non-partial orders are never affected.
export const payableShipping = (order) => {
    const shipping = Number(order?.shippingCost) || 0;
    if (shipping <= 0) return 0;

    const tiers = tierTableFor(order);
    if (!tiers) return shipping; // standard / free shipping — untouched

    const allBooks = bookCount(order?.items);
    const remainingBooks = bookCount(activeItems(order?.items));
    if (remainingBooks >= allBooks) return shipping; // nothing cancelled

    const origUsd = tierUsd(tiers, allBooks);
    if (origUsd <= 0) return shipping; // guard divide-by-zero
    const newUsd = tierUsd(tiers, remainingBooks);

    const scaled = Math.round(shipping * (newUsd / origUsd) * 100) / 100;
    return Math.max(0, Math.min(shipping, scaled)); // can only ever lower the charge
};

// Amount to charge / display: the order's stored total minus any cancelled lines AND
// minus any shipping that no longer applies once those lines are gone. order.total already
// includes every line + the original (full) shipping that was on the order when it was
// placed, so subtracting the cancelled lines' gross and the dropped shipping gives the
// remaining balance. Never below 0.
export const payableTotal = (order) => {
    const cancelledSum = sumItems(cancelledItems(order?.items));
    const shippingReduction = Math.max(0, (Number(order?.shippingCost) || 0) - payableShipping(order));
    const remaining = (Number(order?.total) || 0) - cancelledSum - shippingReduction;
    return Math.max(0, Math.round(remaining * 100) / 100);
};
