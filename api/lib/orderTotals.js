// Shared rule for partial-order invoicing (#5 — June 2026).
//
// When an admin cancels a line item — 'cancelled' (out of print) or 'cancelled - other'
// (cancelled for any other reason, e.g. on the customer's request — Aug 2026) — that item
// is excluded from the customer-facing invoice, the payment page, and EVERY charge path
// (Razorpay / PayPal) so the customer pays only for the remaining titles.
//
// This is the single source of truth — imported by the order / razorpay / paypal / email
// controllers and the invoice PDF generator so the amount shown to the customer and the
// amount actually charged can never drift apart.

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const CANCELLED_STATUS = 'cancelled';               // out of print
export const CANCELLED_OTHER_STATUS = 'cancelled - other'; // any other cancellation reason

// Explicit value set — deliberately NOT a prefix match, so no legacy status string can
// ever silently join the money path. Legacy numeric ids (e.g. '5' = the order_statuses
// "Cancelled" row on migrated items) stay excluded from this on purpose.
// ⚠️ KEEP IN SYNC with the frontend mirrors (EditOrders.jsx / Account/OrderStatus.jsx).
const CANCELLED_STATUSES = new Set([CANCELLED_STATUS, CANCELLED_OTHER_STATUS]);

// An item is "cancelled" when its per-item status is one of the cancel values (case-insensitive).
export const isCancelledItem = (item) =>
    CANCELLED_STATUSES.has(String(item?.status ?? '').trim().toLowerCase());

// Line items the customer actually pays for / sees.
export const activeItems = (items = []) => (items || []).filter((it) => !isCancelledItem(it));

// Line items that have been cancelled (out of print or otherwise).
export const cancelledItems = (items = []) => (items || []).filter(isCancelledItem);

// Gross value (price × qty) of a list of line items, rounded to 2 dp.
export const sumItems = (items = []) =>
    Math.round((items || []).reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0) * 100) / 100;

// Total book count of a list of line items (every OrderItem is a physical book —
// gift cards are NOT stored as order items, they go through a separate path).
export const bookCount = (items = []) =>
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

// Titles of tiered options that carry no 'express' / 'expedited' keyword. The live Express
// option (shipping id 5) is titled "3-5 Days Worldwide Delivery", so keyword detection alone
// silently treated it as flat standard shipping. ⚠️ KEEP IN SYNC with TIERED_OPTION_IDS
// (ids 3 + 5) in lib/shippingRule.js, ui/src/pages/website/Cart.jsx and Checkout.jsx.
const TIERED_TITLES = new Map([
    ['3-5 days worldwide delivery', EXPRESS_TIERS],
]);

// Which tier table applies to a shippingType string. Standard / free shipping returns null
// (never re-banded). Check 'expedited' before 'express'.
const tierTableForType = (shippingType) => {
    const t = String(shippingType ?? '').trim().toLowerCase();
    if (t.includes('expedited')) return EXPEDITED_TIERS;
    if (t.includes('express')) return EXPRESS_TIERS;
    return TIERED_TITLES.get(t) || null;
};
const tierTableFor = (order) => tierTableForType(order?.shippingType);

// Band rate (USD) for a given book count. 0 books = 0; above the table = top band.
const tierUsd = (tiers, books) => {
    if (books <= 0) return 0;
    const band = tiers.find((b) => books >= b.min && books <= b.max);
    return band ? band.usd : tiers[tiers.length - 1].usd;
};

// Is this an Expedited / Express option? ⚠️ The band VALUES above no longer price anything
// (see payableShipping) — the tables survive purely so a tiered option can be recognised,
// because Expedited / Express are never free at any cart value.
export const isTieredShipping = (shippingType) => !!tierTableForType(shippingType);

// Shipping the customer should actually be charged after any cancellations.
//
// ⚠️ Every shipping option — Standard, Expedited and Express alike — is a FLAT admin-defined
// price per currency. The storefront has priced them that way since 2026-06-05 (`4b12a23`),
// when the hardcoded SHIPPING_TIERS tables were removed from Cart.jsx / Checkout.jsx in favour
// of `shippingPriceFor(option, currency)` — which takes no quantity at all. So the number of
// books does NOT change what shipping costs, and reducing or cancelling books must never
// re-price it. (Until 2026-08-06 this function still ratio-scaled Expedited/Express by the
// quantity bands below; the bands had stopped governing price two months earlier, so the
// re-scale invented a discount that no rule backed — Expedited $15 became $8.57 when an order
// went from 4 books to 1. It had never fired in production before because no tiered order had
// ever had an item cancelled.)
//
// The bands survive ONLY as a way to recognise a tiered option (`isTieredShipping`), which
// still matters because Expedited/Express are never free at any cart value.
//
// The one case that does change the charge: the order HAD books and every one of them has been
// cancelled → nothing left to ship. ⚠️ An order that never had any line items (e.g. a
// membership-only order such as prod #17476) keeps its stored shipping — "all cancelled" and
// "never had any" are different things, and conflating them silently rewrites legacy orders.
export const payableShipping = (order) => {
    const shipping = Number(order?.shippingCost) || 0;
    if (shipping <= 0) return 0;
    if (!tierTableFor(order)) return shipping; // standard / free shipping — untouched
    if (bookCount(order?.items) <= 0) return shipping; // never had books — leave it alone
    return bookCount(activeItems(order?.items)) > 0 ? shipping : 0;
};

// ---------------------------------------------------------------------------
// Membership (Aug 2026)
//
// A membership bought with an order is money on the order that is NOT a line item: the fee
// lives in `order.membershipFee` and the member discount — a percentage of (items + fee) —
// in `order.membershipDiscount`, both in the order's own currency.
//
// ⚠️ The discount applies to the BOOKS only — the membership fee itself is not discounted
// (client's rule, 2026-08-06). The stored discount is therefore always
// `settings.member_discount`% of the order's CURRENT full item set, and updateOrder keeps it
// that way when an admin edits the items. Cancelling a line takes that line's share of the
// discount with it, which is a pure active/all ratio — no base convention, no exchange rates,
// so EUR/GBP orders stay correct.
//
// ⚠️ LEGACY DATA GUARD. Migrated orders stored the member-discount PERCENTAGE — a bare `10` —
// in `membershipDiscount` rather than a currency amount: 2,720 prod rows, every one created
// on or before 2026-05-12. Real per-order amounts have only been written since the membership
// money model shipped on 2026-06-30 (commit `0d99f51`). So the column is read as money only
// for orders from that date onwards, or for any order carrying a membership fee (which only
// the current code can produce). Legacy orders keep exactly today's behaviour: their number
// never enters payableTotal and is never rescaled by an admin edit. An order payload without
// `createdAt` falls back to the fee test, which still covers every membership PURCHASE.
// ---------------------------------------------------------------------------
const MEMBERSHIP_MONEY_FROM = new Date('2026-06-30T00:00:00Z').getTime();

export const membershipFeeOf = (order) => Math.max(0, Number(order?.membershipFee) || 0);

export const hasMembershipMoney = (order) => {
    if (membershipFeeOf(order) > 0) return true;
    const created = order?.createdAt ? new Date(order.createdAt).getTime() : NaN;
    return Number.isFinite(created) && created >= MEMBERSHIP_MONEY_FROM;
};

// The member discount as a real currency amount (0 for legacy percentage rows).
export const membershipDiscountOf = (order) =>
    hasMembershipMoney(order) ? Math.max(0, Number(order?.membershipDiscount) || 0) : 0;

// The member discount for a given set of books at a given percentage. Used by updateOrder to
// re-derive the stored amount after an admin edits the items.
export const memberDiscountFor = (items, pct) =>
    round2(sumItems(items) * (Number(pct) || 0) / 100);

// Member discount the customer actually keeps once cancelled lines are excluded: the stored
// amount scaled by the share of the books that survive. A pure ratio, so it is correct
// whatever percentage produced the stored number.
export const payableMembershipDiscount = (order) => {
    const disc = membershipDiscountOf(order);
    if (disc <= 0) return 0;
    const all = sumItems(order?.items);
    if (all <= 0) return 0; // the fee alone carries no discount
    const payable = round2(disc * (sumItems(activeItems(order?.items)) / all));
    return Math.max(0, Math.min(disc, payable)); // never more than was granted
};

// A membership shown as a line in the items table. Renderers only — NEVER push this into
// `order.items`, or sumItems()/payableTotal() would count the fee twice.
export const MEMBERSHIP_LINE_NAME = 'Bagchee Membership (1 Year)';
export const membershipLine = (order) => {
    const fee = hasMembershipMoney(order) ? membershipFeeOf(order) : 0;
    return fee > 0 ? { name: MEMBERSHIP_LINE_NAME, price: fee, quantity: 1, isMembership: true } : null;
};

// Amount to charge / display: the order's stored total minus any cancelled lines AND
// minus any shipping that no longer applies once those lines are gone. order.total already
// includes every line + the original (full) shipping that was on the order when it was
// placed, so subtracting the cancelled lines' gross and the dropped shipping gives the
// remaining balance. Never below 0.
export const payableTotal = (order) => {
    const cancelledSum = sumItems(cancelledItems(order?.items));
    const shippingReduction = Math.max(0, (Number(order?.shippingCost) || 0) - payableShipping(order));
    // Cancelling a line also cancels the share of the member discount that line earned. The
    // discount is inside `order.total` as a subtraction, so that share has to be added back —
    // otherwise the customer keeps a discount on books they are no longer being charged for.
    // 0 whenever nothing is cancelled, there is no membership, or the order is a legacy row,
    // so every existing order's payable amount is bit-for-bit unchanged.
    const discountReduction = Math.max(0, round2(membershipDiscountOf(order) - payableMembershipDiscount(order)));
    const remaining = (Number(order?.total) || 0) - cancelledSum - shippingReduction + discountReduction;
    return Math.max(0, round2(remaining));
};
