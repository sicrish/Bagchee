// Free-shipping rule applied to an EXISTING order (5-Aug-2026).
//
// At checkout, `saveOrder` waives shipping on standard (non-tiered) orders whose USD item
// subtotal reaches the free-shipping threshold. When an admin later edits the order — cancels
// an out-of-print title, drops a quantity, removes a book — the remaining books can fall back
// under that threshold, so shipping has to be charged again (and vice-versa).
//
// This module resolves the two numbers that decision needs, IN THE ORDER'S OWN CURRENCY:
//   • baseCost — what the order's chosen shipping option costs (the amount to charge when the
//                order no longer qualifies for free shipping)
//   • freeMin  — the free-shipping threshold
// `order.shippingType` stores the option's TITLE (there is no shippingOptionId column), so the
// option is matched by title. Legacy orders whose type no longer exists in the shipping table
// resolve to `matched:false` and are then left completely alone — their money never moves.
//
// Only `updateOrder` (admin save) uses this: the recomputed shipping is PERSISTED on the order,
// so every downstream consumer (payableTotal → invoice, emails, PayPal, the /pay page, the
// customer's My Account) picks it up through the existing helpers with no changes.

import prisma from './prisma.js';
import { isTieredShipping } from './orderTotals.js';
import { getUsdConversionRate } from './exchangeRates.js';

// Currencies whose order amounts were FX-converted from USD at checkout (mirrors
// FX_CONVERTIBLE in order.controller.saveOrder). INR orders store USD numbers labelled
// INR, so their threshold stays the plain USD one.
const FX_CONVERTIBLE = new Set(['EUR', 'GBP']);

// Same hardcoded threshold saveOrder enforces (and Cart.jsx / Checkout.jsx display), in USD.
export const FREE_SHIPPING_MIN_USD = 50;

// Expedited (3) + Express (5) are quantity-banded and NEVER free, at any cart value.
// Mirrors TIERED_OPTION_IDS in ui/src/pages/website/Cart.jsx + Checkout.jsx. Needed as well
// as the title keywords because the live Express option is titled "3-5 Days Worldwide
// Delivery" — no 'express' in it, so keyword detection alone let it qualify for free shipping.
export const TIERED_OPTION_IDS = new Set([3, 5]);
export const isTieredOption = (opt, shippingType) =>
    isTieredShipping(shippingType) || (!!opt && TIERED_OPTION_IDS.has(opt.id));

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const priceForCurrency = (opt, currency) => {
    if (!opt) return 0;
    if (currency === 'EUR') return Number(opt.priceEur) || 0;
    if (currency === 'GBP') return Number(opt.priceGbp) || 0;
    return Number(opt.priceUsd) || 0; // USD / INR / anything else
};

// Resolve the free-shipping rule for one order. Async (one indexed lookup on a 3-row table
// + the cached FX rate) — call it once per admin save, not per render.
export const resolveShippingRule = async (order) => {
    const currency     = order?.currency || 'USD';
    const shippingType = String(order?.shippingType || '').trim();

    const opt = shippingType
        ? await prisma.shippingOption.findFirst({ where: { title: { equals: shippingType, mode: 'insensitive' } } })
        : null;

    // Expedited / Express are priced in quantity bands, not by the free-shipping rule.
    if (isTieredOption(opt, shippingType)) return { tiered: true, matched: true, currency, baseCost: 0, freeMin: 0 };

    const rate = FX_CONVERTIBLE.has(currency) ? await getUsdConversionRate(currency) : 1;

    return {
        tiered:   false,
        matched:  !!opt,
        currency,
        baseCost: round2(priceForCurrency(opt, currency)),
        freeMin:  round2(FREE_SHIPPING_MIN_USD * rate),
    };
};

// What shipping SHOULD cost for a given items subtotal under the rule.
// Returns null when the rule can't be applied (tiered order, unknown option, zero-price
// option) — callers must then leave the stored shipping cost untouched.
export const standardShippingFor = (rule, subtotal) => {
    if (!rule || rule.tiered || !rule.matched || rule.baseCost <= 0) return null;
    if (Number(subtotal) <= 0) return 0;               // nothing left to ship
    return Number(subtotal) >= rule.freeMin ? 0 : rule.baseCost;
};
