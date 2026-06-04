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

// Amount to charge / display: the order's stored total minus any cancelled lines.
// order.total already includes every line that was on the order when it was placed, so
// subtracting the cancelled lines' gross gives the remaining balance. Never below 0.
export const payableTotal = (order) => {
    const cancelledSum = sumItems(cancelledItems(order?.items));
    const remaining = (Number(order?.total) || 0) - cancelledSum;
    return Math.max(0, Math.round(remaining * 100) / 100);
};
