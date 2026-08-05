import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Plus, Trash2, Printer, Mail, Search, Copy, AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import CustomerSelect from '../../components/admin/CustomerSelect.jsx';

// ── Item-level cancel statuses ────────────────────────────────────────────────
// 'cancelled' = out of print; 'cancelled - other' = cancelled for any other reason
// (customer request by email etc. — Aug 2026). Both are struck through and excluded
// from the invoice, the payment link and every charge path.
// ⚠️ MUST mirror isCancelledItem in api/lib/orderTotals.js (the backend authority).
const CANCELLED_ITEM_STATUSES = ['cancelled', 'cancelled - other'];
const isCancelledItemStatus = (s) => CANCELLED_ITEM_STATUSES.includes(String(s ?? '').trim().toLowerCase());

// ── Tiered shipping (Expedited / Express) re-rate for partial invoicing (#5) ──
// When out-of-print line items are cancelled, Expedited/Express shipping is re-banded
// for the REMAINING books (it's priced in quantity bands, not per book). This mirrors
// payableShipping() in api/lib/orderTotals.js so the admin's live preview matches what
// the backend will actually charge. ⚠️ KEEP IN SYNC with that file and the source table
// in ui/src/pages/website/Cart.jsx (SHIPPING_TIERS — Express id 5, Expedited id 3).
const SHIP_TIERS = {
  express:   [[1,2,50],[3,6,80],[7,11,110],[12,15,150],[16,20,200],[21,25,280],[26,36,350],[37,50,435],[51,100,550],[101,Infinity,730]],
  expedited: [[1,2,20],[3,6,35],[7,11,50], [12,15,80], [16,20,120],[21,25,150],[26,36,175],[37,50,222],[51,100,280],[101,Infinity,400]],
};
const tierTableForType = (shippingType) => {
  const t = String(shippingType || '').trim().toLowerCase();
  if (t.includes('expedited')) return SHIP_TIERS.expedited;
  if (t.includes('express')) return SHIP_TIERS.express;
  // The live Express option is titled "3-5 Days Worldwide Delivery" — no keyword to match on.
  if (t === '3-5 days worldwide delivery') return SHIP_TIERS.express;
  return null;
};
const tierUsdFor = (tiers, books) => {
  if (books <= 0) return 0;
  const band = tiers.find(([min, max]) => books >= min && books <= max);
  return band ? band[2] : tiers[tiers.length - 1][2];
};
const countBooks = (arr = []) => arr.reduce((n, it) => n + (Number(it.quantity) || 1), 0);
// Shipping the customer will actually be charged after cancellations. Returns the
// original cost unchanged for standard/free shipping or when nothing is cancelled.
const previewPayableShipping = (shippingCost, shippingType, items = []) => {
  const shipping = Number(shippingCost) || 0;
  if (shipping <= 0) return 0;
  const tiers = tierTableForType(shippingType);
  if (!tiers) return shipping;
  const allBooks = countBooks(items);
  const remaining = countBooks(items.filter((p) => !isCancelledItemStatus(p.status)));
  if (remaining >= allBooks) return shipping;
  const origUsd = tierUsdFor(tiers, allBooks);
  if (origUsd <= 0) return shipping;
  const newUsd = tierUsdFor(tiers, remaining);
  const scaled = Math.round(shipping * (newUsd / origUsd) * 100) / 100;
  return Math.max(0, Math.min(shipping, scaled));
};

// ── Free-shipping rule mirror (5-Aug-2026) ────────────────────────────────────
// Editing the items table (quantity, price, add / remove, cancel a title) moves the
// order's money: standard shipping is re-tested against the free-shipping threshold for
// the remaining books, and the Total follows. This mirrors api/lib/shippingRule.js +
// updateOrder so the form previews exactly what the save will store. The rule itself
// ({ tiered, matched, baseCost, freeMin }, all in the ORDER's currency) is served with
// the order by the admin endpoint — never guessed here.
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const lineSum = (items = []) => round2(items.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.quantity) || 1), 0));
const activeLineSum = (items = []) => lineSum(items.filter((p) => !isCancelledItemStatus(p.status)));
const standardShippingFor = (rule, subtotal) => {
  if (!rule || rule.tiered || !rule.matched || !(Number(rule.baseCost) > 0)) return null;
  if (Number(subtotal) <= 0) return 0;
  return Number(subtotal) >= Number(rule.freeMin) ? 0 : Number(rule.baseCost);
};
const near = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) < 0.005;

const EditOrders = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se Order ID lene ke liye
  const editor = useRef(null);

  // ─── Search-result context carried from the Orders list ───────────────────
  // Lets us (a) return to the exact same search-result page and (b) walk
  // Prev/Next through those results from this detail page.
  const [searchParams] = useSearchParams();
  const listSearch = searchParams.get('search') || '';
  const listPage   = Number(searchParams.get('page'))  || 1;
  const listLimit  = Number(searchParams.get('limit')) || 10;

  // Query string that takes us back to the list view we came from
  const backToListQs = (() => {
    const p = new URLSearchParams();
    if (listSearch) p.set('search', listSearch);
    if (listPage > 1) p.set('page', String(listPage));
    if (listLimit !== 10) p.set('limit', String(listLimit));
    const s = p.toString();
    return s ? `?${s}` : '';
  })();

  // Prev/Next neighbours within the current search results
  const [orderNav, setOrderNav] = useState({ prev: null, next: null, hasPrevPage: false, hasNextPage: false, posLabel: '' });
  const canPrev = !!orderNav.prev || orderNav.hasPrevPage;
  const canNext = !!orderNav.next || orderNav.hasNextPage;

  // Figure out the previous/next order relative to this one, using the same
  // paginated /orders/list query the list page used (so it matches exactly).
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const searchParam = listSearch ? `&search=${encodeURIComponent(listSearch)}` : '';
        const res = await axios.get(`${API_URL}/orders/list?page=${listPage}&limit=${listLimit}${searchParam}`);
        if (cancelled || !res.data?.status) return;
        const pageOrders = res.data.data || [];
        const total      = res.data.total || 0;
        const totalPages = res.data.totalPages || 1;
        const idx = pageOrders.findIndex(o => String(o.id) === String(id));
        if (idx === -1) {
          setOrderNav({ prev: null, next: null, hasPrevPage: false, hasNextPage: false, posLabel: '' });
          return;
        }
        const globalPos = (listPage - 1) * listLimit + idx + 1; // 1-based across all results
        setOrderNav({
          prev: idx > 0 ? { id: pageOrders[idx - 1].id, page: listPage } : null,
          next: idx < pageOrders.length - 1 ? { id: pageOrders[idx + 1].id, page: listPage } : null,
          hasPrevPage: idx === 0 && listPage > 1,                       // first row → roll to prev page
          hasNextPage: idx === pageOrders.length - 1 && listPage < totalPages, // last row → roll to next page
          posLabel: total ? `${globalPos} of ${total}` : '',
        });
      } catch (_) {
        if (!cancelled) setOrderNav({ prev: null, next: null, hasPrevPage: false, hasNextPage: false, posLabel: '' });
      }
    })();
    return () => { cancelled = true; };
  }, [id, listSearch, listPage, listLimit]);

  // Navigate to an order, preserving the search context (and updating page when we
  // cross a result-page boundary so "Back to results" stays in sync).
  const navToOrder = (oid, pg) => {
    const p = new URLSearchParams();
    if (listSearch) p.set('search', listSearch);
    if (pg > 1) p.set('page', String(pg));
    if (listLimit !== 10) p.set('limit', String(listLimit));
    const qs = p.toString();
    navigate(`/admin/edit-orders/${oid}${qs ? `?${qs}` : ''}`);
    window.scrollTo({ top: 0 });
  };

  const goToNeighbor = async (dir) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const searchParam = listSearch ? `&search=${encodeURIComponent(listSearch)}` : '';
      if (dir === 'prev') {
        if (orderNav.prev) return navToOrder(orderNav.prev.id, orderNav.prev.page);
        if (orderNav.hasPrevPage) {
          const r = await axios.get(`${API_URL}/orders/list?page=${listPage - 1}&limit=${listLimit}${searchParam}`);
          const arr = r.data?.data || [];
          if (arr.length) navToOrder(arr[arr.length - 1].id, listPage - 1);
        }
      } else {
        if (orderNav.next) return navToOrder(orderNav.next.id, orderNav.next.page);
        if (orderNav.hasNextPage) {
          const r = await axios.get(`${API_URL}/orders/list?page=${listPage + 1}&limit=${listLimit}${searchParam}`);
          const arr = r.data?.data || [];
          if (arr.length) navToOrder(arr[0].id, listPage + 1);
        }
      }
    } catch (_) { /* non-fatal — button just won't move */ }
  };

  // Comprehensive countries list
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", 
    "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", 
    "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", 
    "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", 
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", 
    "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", 
    "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", 
    "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", 
    "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", 
    "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", 
    "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", 
    "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", 
    "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", 
    "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", "Palau", 
    "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", 
    "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", 
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", 
    "Solomon Islands", "Somalia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Suriname", 
    "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", 
    "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", 
    "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", 
    "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

  const emailEditor = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [approving, setApproving] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  // Where the customer placed the order from (empty on orders older than 16-July)
  const [customerOrigin, setCustomerOrigin] = useState({ ip: '', country: '' });
  // Block Customer modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockChecks, setBlockChecks] = useState({ email: true, ip: true, country: false });
  const [blockNote, setBlockNote] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailingInvoice, setEmailingInvoice] = useState(false);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');

  // Notification Email modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailType, setEmailType] = useState('confirmation');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Dropdown Data
  const [customerLabel, setCustomerLabel] = useState(''); // display name for the selected customer
  const [guestLabel, setGuestLabel] = useState('');       // "Guest Customer — …" for guest-checkout orders (no user record)
  const [productsList, setProductsList] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [courierList, setCourierList] = useState([]); // 🟢 New
  const [orderStatuses, setOrderStatuses] = useState([]); // 🟢 New


  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Product Rows
  const [orderProducts, setOrderProducts] = useState([]);
  const [removedItemIds, setRemovedItemIds] = useState([]); // existing item ids deleted from the table, applied on save
  const [addProductIdInput, setAddProductIdInput] = useState('');

  // Money preview (5-Aug): the order's free-shipping rule + the amounts it was loaded with.
  // Every recompute is a DELTA from this baseline (never a re-derivation of the total), so
  // gift cards, wallet deductions, coupon and membership amounts inside it stay intact.
  const [shippingRule, setShippingRule] = useState(null);
  const baselineRef = useRef(null); // { items, total, shipping, shippingType, paid }
  const [cancelRequestedAt, setCancelRequestedAt] = useState(null);

  const [commentContent, setCommentContent] = useState('');
  const [customerComment, setCustomerComment] = useState('');

  // Huge Form State (Same as AddOrders)
  const [formData, setFormData] = useState({
    order_number: '',
    created_at: '',
    customer_id: '',
    payment_type: '',
    shipping_type: '',

    // Financials
    total: '',
    shipping_cost: '',
    currency: '',

    // Status & Membership
    status: '',
    shipped_at: '',
    estimated_delivery: '',
    membership: 'No',
    membership_discount: '',
    coupon_id: '',

    // Shipping Details (11 Fields)
    shipping_email: '',
    shipping_first_name: '',
    shipping_last_name: '',
    shipping_address_1: '',
    shipping_address_2: '',
    shipping_company: '',
    shipping_country: '',
    shipping_state_region: '',
    shipping_city: '',
    shipping_postcode: '',
    shipping_phone: '',

    // Billing Details (11 Fields)
    billing_first_name: '',
    billing_last_name: '',
    billing_address_1: '',
    billing_address_2: '',
    billing_company: '',
    billing_country: '',
    billing_state_region: '',
    billing_city: '',
    billing_postcode: '',
    billing_phone: '',

    // Bottom Fields
    payment_status: '',
    transaction_id: ''
  });

  // 1. Fetch Initial Data + Order Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;

        // Use Promise.allSettled so one failing dropdown doesn't break everything
        const [prodRes, coupRes, orderRes, payRes, shipRes, courierRes, statusRes] = await Promise.allSettled([
          axios.get(`${API_URL}/product/fetch`),
          axios.get(`${API_URL}/coupons/active`),
          axios.get(`${API_URL}/orders/admin/get/${id}`),  // admin-specific route
          axios.get(`${API_URL}/payments/list?limit=100`),
          axios.get(`${API_URL}/shipping-options/list`),
          axios.get(`${API_URL}/couriers/list`),
          axios.get(`${API_URL}/order-status/list?limit=1000`)
        ]);

        // Set Dropdowns (only if request succeeded)
        if (prodRes.status === 'fulfilled' && prodRes.value.data.status) setProductsList(prodRes.value.data.data);
        if (coupRes.status === 'fulfilled' && coupRes.value.data.status) setCoupons(coupRes.value.data.data);
        if (payRes.status === 'fulfilled' && payRes.value.data.status) setPaymentMethods(payRes.value.data.data);
        if (shipRes.status === 'fulfilled' && shipRes.value.data.status) setShippingOptions(shipRes.value.data.data);
        if (courierRes.status === 'fulfilled' && courierRes.value.data.status) setCourierList(courierRes.value.data.data);
        if (statusRes.status === 'fulfilled' && statusRes.value.data.status) setOrderStatuses(statusRes.value.data.data);

        // Set Order Data — map Prisma camelCase fields
        if (orderRes.status === 'fulfilled' && orderRes.value.data.status) {
          const d = orderRes.value.data.data;

          // Label for the already-selected customer (typeahead shows this until changed)
          setCustomerLabel(
            d.customer?.name
            || [d.shippingFirstName, d.shippingLastName].filter(Boolean).join(' ')
            || d.shippingEmail || d.customer?.email || ''
          );

          // Guest-checkout orders have no user record (customerId null) — there's nothing to
          // search for in the customer box, which previously blocked saving. Surface them as
          // "Guest Customer" (with the shipping name/email if any) so the order stays saveable.
          const isGuest = !(d.customerId || d.customer?.id || d.customer_id);
          const guestWho = [d.shippingFirstName, d.shippingLastName].filter(Boolean).join(' ') || d.shippingEmail || '';
          setGuestLabel(isGuest ? ('Guest Customer' + (guestWho ? ` — ${guestWho}` : '')) : '');

          const formattedDate = d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 16) : '';

          setFormData({
            order_number: d.orderNumber || d.order_number || '',
            created_at: formattedDate,
            customer_id: d.customerId || d.customer?.id || d.customer_id || '',
            payment_type: d.paymentType || d.payment_type || '',
            shipping_type: d.shippingType || d.shipping_type || '',

            total: d.total || '',
            shipping_cost: d.shippingCost ?? d.shipping_cost ?? '',
            currency: d.currency || '',

            status: d.status || 'Not yet ordered',
            shipped_at: d.shippedAt ? new Date(d.shippedAt).toISOString().split('T')[0] : '',
            estimated_delivery: d.estimatedDelivery ? new Date(d.estimatedDelivery).toISOString().split('T')[0] : '',
            membership: d.membership || 'No',
            membership_discount: d.membershipDiscount ?? d.membership_discount ?? '',
            coupon_id: d.couponId || d.coupon?.id || d.coupon_id || '',
            coupon_discount: d.couponDiscount ?? d.coupon_discount ?? 0,

            // Shipping (Prisma flat camelCase fields with fallback from nested objects)
            shipping_email:        d.shippingEmail       || d.shipping_details?.email || '',
            shipping_first_name:   d.shippingFirstName   || d.shipping_details?.firstName || '',
            shipping_last_name:    d.shippingLastName     || d.shipping_details?.lastName || '',
            shipping_address_1:    d.shippingAddress1     || d.shipping_details?.address1 || '',
            shipping_address_2:    d.shippingAddress2     || d.shipping_details?.address2 || '',
            shipping_company:      d.shippingCompany      || d.shipping_details?.company || '',
            // No 'India' fallback: an unset country must LOOK unset, not like a fact —
            // a false 'India' here is what hid the Switzerland bug (16-July, order 17655).
            shipping_country:      d.shippingCountry      || d.shipping_details?.country || '',
            shipping_state_region: d.shippingState        || d.shipping_details?.state || '',
            shipping_city:         d.shippingCity         || d.shipping_details?.city || '',
            shipping_postcode:     d.shippingPostcode     || d.shipping_details?.postcode || '',
            shipping_phone:        d.shippingPhone        || d.shipping_details?.phone || '',

            // Billing (Prisma flat camelCase fields with fallback from nested objects)
            billing_first_name:   d.billingFirstName  || d.billing_details?.firstName || '',
            billing_last_name:    d.billingLastName    || d.billing_details?.lastName || '',
            billing_address_1:    d.billingAddress1    || d.billing_details?.address1 || '',
            billing_address_2:    d.billingAddress2    || d.billing_details?.address2 || '',
            billing_company:      d.billingCompany     || d.billing_details?.company || '',
            billing_country:      d.billingCountry     || d.billing_details?.country || '',
            billing_state_region: d.billingState       || d.billing_details?.state || '',
            billing_city:         d.billingCity        || d.billing_details?.city || '',
            billing_postcode:     d.billingPostcode    || d.billing_details?.postcode || '',
            billing_phone:        d.billingPhone       || d.billing_details?.phone || '',

            payment_status: d.paymentStatus  || d.payment_status  || '',
            transaction_id: d.transactionId  || d.transaction_id  || ''
          });

          setOrderProducts(d.items || d.products || []);
          setShippingRule(d.shippingRule || null);
          setCancelRequestedAt(d.cancelRequestedAt || d.cancel_requested_at || null);
          baselineRef.current = {
            items: (d.items || d.products || []).map((it) => ({ price: it.price, quantity: it.quantity, status: it.status })),
            total: Number(d.total) || 0,
            shipping: Number(d.shippingCost ?? d.shipping_cost) || 0,
            shippingType: d.shippingType || d.shipping_type || '',
            status: d.status || '',
            // An order that is already paid keeps its recorded amounts — the server won't
            // move them either (`total` is the record of what the customer was charged).
            paid: ['paid', 'completed', 'refunded'].includes(String(d.paymentStatus || d.payment_status || '').toLowerCase()),
          };
          // Orders whose books were cancelled / edited before this rule existed still carry the
          // stale shipping. Run one pass now so the Total the admin sees on open is the one
          // Update will store — instead of only correcting itself after they touch something.
          applyMoneyPreview(d.items || d.products || [], undefined, {
            rule: d.shippingRule || null,
            shippingType: d.shippingType || d.shipping_type || '',
          });
          setCommentContent(d.comment || '');
          setCustomerComment(d.customerComment || d.customer_comment || '');
          setPaymentLink(d.paymentLink || d.payment_link || '');
          setPurchaseOrderNumber(d.purchaseOrderNumber || d.purchase_order_number || '');
          setCustomerOrigin({
            ip: d.customerIp || d.customer_ip || '',
            country: d.customerCountry || d.customer_country || '',
          });
        } else if (orderRes.status === 'rejected') {
          toast.error("Failed to load order data");
        } else {
          toast.error("Order not found");
        }

      } catch (error) {
        console.error("Data fetch error", error);
        toast.error("Failed to load order data");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);


  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && isDropdownOpen) {
        setIsSearching(true);
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/home-sale-products/search-inventory?q=${searchQuery}`);
          if (res.data.status) setSearchResults(res.data.data);
        } catch (error) { console.error("Search Error:", error); }
        finally { setIsSearching(false); }
      } else { setSearchResults([]); }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isDropdownOpen]);

  const handleSelectProduct = (product) => {
    // /order-status/list is name-sorted, so [0] is 'Cancelled' — a terrible default for a
    // freshly added row (it would render as "Cancelled (out of print)"). Start blank; the
    // admin picks the real status.
    // Default to the selling price when it undercuts MRP — same rule saveOrder charges by.
    const mrp = Number(product.price) || 0;
    const real = Number(product.realPrice) || 0;
    const newRow = {
      productId: product.id,          // updateOrder CREATEs id-less rows from this on save
      bagcheeId: product.bagcheeId,   // lets the name link open the book page
      name: product.title,
      image: product.defaultImage || '',
      price: real > 0 && real < mrp ? real : mrp,
      quantity: 1,
      status: '',
      courierId: '', trackingCode: '', returnNote: '', cancelNote: ''
    };
    const updated = [...orderProducts, newRow];
    setOrderProducts(updated);
    applyMoneyPreview(updated);
    setSearchQuery("");
    setIsDropdownOpen(false);
  };




  // Recompute Total (and standard shipping) after an items-table or shipping-cost edit.
  // Mirrors the money follow-through in api/controller/order.controller.updateOrder:
  //   total  = loaded total + (items now − items at load) + (shipping now − shipping at load)
  //   shipping = free-shipping rule re-applied to the REMAINING (non-cancelled) books,
  //              unless the admin typed their own figure or changed the shipping method.
  // Always a delta from the loaded baseline, so it's idempotent while typing.
  const applyMoneyPreview = (nextProducts, typedShipping, opts = {}) => {
    const b = baselineRef.current;
    if (!b || b.paid) return;
    // `rule` / `shippingType` can be passed in when the order has just loaded and the
    // matching state hasn't been committed yet.
    const rule = opts.rule !== undefined ? opts.rule : shippingRule;

    const prevShipping = b.shipping;
    const adminSet = typedShipping !== undefined && !near(Number(typedShipping) || 0, prevShipping);
    const typeChanged = (opts.shippingType ?? formData.shipping_type ?? '') !== (b.shippingType || '');
    let shipping = adminSet ? Math.max(0, Number(typedShipping) || 0) : prevShipping;

    if (!adminSet && !typeChanged) {
      if (rule?.tiered) {
        const tiers = tierTableForType(b.shippingType);
        const oldBand = tiers ? tierUsdFor(tiers, countBooks(b.items)) : 0;
        const newBand = tiers ? tierUsdFor(tiers, countBooks(nextProducts)) : 0;
        if (prevShipping > 0 && oldBand > 0 && newBand !== oldBand)
          shipping = round2(prevShipping * (newBand / oldBand));
      } else {
        // The stored cost counts as rule-managed when it matches what the rule gives for
        // either the remaining books or the full original set (an order cancelled before
        // this change still carries the free shipping it earned from the full set).
        const ruleActiveBefore = standardShippingFor(rule, activeLineSum(b.items));
        const ruleAllBefore    = standardShippingFor(rule, lineSum(b.items));
        if (ruleActiveBefore !== null && (near(prevShipping, ruleActiveBefore) || near(prevShipping, ruleAllBefore))) {
          const want = standardShippingFor(rule, activeLineSum(nextProducts));
          if (want !== null) shipping = want;
        }
      }
    }

    const total = Math.max(0, round2(b.total + (lineSum(nextProducts) - lineSum(b.items)) + (shipping - prevShipping)));
    setFormData(prev => ({
      ...prev,
      total: total.toFixed(2),
      // While the admin is typing in the shipping box, leave their raw text alone.
      ...(typedShipping === undefined ? { shipping_cost: shipping.toFixed(2) } : {}),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
    // Shipping is part of the order total — keep the Total in step with a manual edit.
    if (name === 'shipping_cost') applyMoneyPreview(orderProducts, value);
  };

  // --- Product Table Logic ---
  const addProductRow = () => {
    const foundProd = productsList.find(p => p._id === addProductIdInput || p.sku === addProductIdInput);

    const newRow = {
      name: foundProd ? foundProd.title : '',
      price: foundProd ? foundProd.price : '',
      quantity: 1,
      status: '',
      courierId: '',
      trackingCode: '',
      returnNote: '',
      cancelNote: ''
    };

    const updated = [...orderProducts, newRow];
    setOrderProducts(updated);
    applyMoneyPreview(updated);
    setAddProductIdInput('');
  };

  const removeProductRow = (index) => {
    // Existing rows must also be deleted server-side on save (previously they were only
    // removed from local state and reappeared on reload). New unsaved rows just vanish.
    const row = orderProducts[index];
    if (row?.id) setRemovedItemIds((prev) => [...prev, row.id]);
    const list = [...orderProducts];
    list.splice(index, 1);
    setOrderProducts(list);
    applyMoneyPreview(list);
  };

  const handleProductChange = (index, field, value) => {
    const list = orderProducts.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    setOrderProducts(list);
    // Price / quantity / cancelling a title all move the order's money.
    if (['price', 'quantity', 'status'].includes(field)) applyMoneyPreview(list);
  };

  const handleProductClick = (product) => {
    console.log("DEBUG - Product data:", product);
    
    // Check if product has nested product object
    const nestedProduct = product.product || product;
    console.log("DEBUG - Nested product:", nestedProduct);
    
    // Get bagceeId and title from nested product
    const bagceeId = nestedProduct.bagcheeId || nestedProduct.bagcee_id;
    const title = nestedProduct.title || nestedProduct.name;
    
    console.log("DEBUG - Using:", {
      bagceeId,
      title
    });
    
    if (bagceeId && title) {
      // Create URL like /books/BB139675/early-north-india-and-its-coinage
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      const url = `/books/${bagceeId}/${slug}`;
      console.log("DEBUG - Opening URL:", url);
      window.open(url, '_blank');
    } else {
      console.log("DEBUG - Missing bagceeId or title");
      toast.error('Product details not available');
    }
  };

  // --- Submit Logic (Update) ---
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    // Guest-checkout orders legitimately have no customer record — only block when it's not a guest.
    if (!formData.customer_id && !guestLabel) return toast.error("Customer is required!");


    setLoading(true);
    const toastId = toast.loading("Updating order...");

    try {
      const payload = {
        // Scalar order fields (snake_case variants handled by controller)
        status:          formData.status,
        payment_status:  formData.payment_status,
        transaction_id:  formData.transaction_id,
        total:           formData.total,
        shipping_cost:   formData.shipping_cost,
        currency:        formData.currency,
        payment_type:    formData.payment_type,
        shipping_type:   formData.shipping_type,
        membership:      formData.membership,
        membershipDiscount: formData.membership_discount,
        estimated_delivery: formData.estimated_delivery,
        shippedAt:       formData.shipped_at || null,
        comment:         commentContent,

        // Shipping address — camelCase required by controller
        shippingEmail:       formData.shipping_email,
        shippingFirstName:   formData.shipping_first_name,
        shippingLastName:    formData.shipping_last_name,
        shippingAddress1:    formData.shipping_address_1,
        shippingAddress2:    formData.shipping_address_2,
        shippingCompany:     formData.shipping_company,
        shippingCountry:     formData.shipping_country,
        shippingState:       formData.shipping_state_region,
        shippingCity:        formData.shipping_city,
        shippingPostcode:    formData.shipping_postcode,
        shippingPhone:       formData.shipping_phone,

        // Billing address — camelCase required by controller
        billingFirstName:  formData.billing_first_name,
        billingLastName:   formData.billing_last_name,
        billingAddress1:   formData.billing_address_1,
        billingAddress2:   formData.billing_address_2,
        billingCompany:    formData.billing_company,
        billingCountry:    formData.billing_country,
        billingState:      formData.billing_state_region,
        billingCity:       formData.billing_city,
        billingPostcode:   formData.billing_postcode,
        billingPhone:      formData.billing_phone,

        // Items — controller reads req.body.items with camelCase sub-fields.
        // Rows without an id are new (Search Book to Add) and get created server-side;
        // removed_item_ids are existing rows the admin deleted from the table.
        items: orderProducts,
        removed_item_ids: removedItemIds,
      };

      const API_URL = process.env.REACT_APP_API_URL;
      // PATCH request for update
      const res = await axios.patch(`${API_URL}/orders/update/${id}`, payload);

      if (res.data.status) {
        toast.success("Order updated successfully! 📦", { id: toastId });
        // Sync from the server's fresh copy: new rows get their DB ids (so saving again
        // can't re-create them), deletions clear, a mark-Paid auto-advance ('In Progress'
        // on the order + items) shows immediately, and Total / Shipping show the amounts
        // the server actually stored after the items-driven recompute.
        const fresh = res.data.data;
        const wasCancelled = String(baselineRef.current?.status || '').toLowerCase() === 'cancelled';
        if (fresh) {
          setOrderProducts(fresh.items || []);
          setRemovedItemIds([]);
          if (fresh.shippingRule) setShippingRule(fresh.shippingRule);
          setFormData((prev) => ({
            ...prev,
            status: fresh.status ?? prev.status,
            payment_status: fresh.paymentStatus ?? prev.payment_status,
            total: fresh.total != null ? Number(fresh.total).toFixed(2) : prev.total,
            shipping_cost: fresh.shippingCost != null ? Number(fresh.shippingCost).toFixed(2) : prev.shipping_cost,
          }));
          // New baseline — further edits are deltas from what is now stored.
          baselineRef.current = {
            items: (fresh.items || []).map((it) => ({ price: it.price, quantity: it.quantity, status: it.status })),
            total: Number(fresh.total) || 0,
            shipping: Number(fresh.shippingCost) || 0,
            shippingType: fresh.shippingType || '',
            status: fresh.status || '',
            paid: ['paid', 'completed', 'refunded'].includes(String(fresh.paymentStatus || '').toLowerCase()),
          };
        }
        if (actionType === 'back') {
          navigate(`/admin/orders${backToListQs}`);
          return;
        }
        // Order just moved to Cancelled → offer the cancellation email straight away
        // (pre-filled "as per your request" when the customer asked for it).
        if (!wasCancelled && String(fresh?.status || '').toLowerCase() === 'cancelled') {
          openCancelEmailModal(!!(fresh?.cancelRequestedAt || cancelRequestedAt));
        }
      }
    } catch (error) {
      console.error("Frontend Error Log:", error.response?.data);
      toast.error(error.response?.data?.msg || "Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = async () => {
    try {
      const token = localStorage.getItem('token') || (() => {
        try { return JSON.parse(localStorage.getItem('auth') || '{}').token; } catch { return null; }
      })();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/orders/${id}/invoice`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) { toast.error('Failed to generate invoice'); return; }
      const html = await res.text();
      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
    } catch {
      toast.error('Failed to generate invoice');
    }
  };

  // Email the invoice (PDF attached) to the customer's order email.
  const handleEmailInvoice = async () => {
    if (!window.confirm('Email this invoice (PDF) to the customer?')) return;
    setEmailingInvoice(true);
    const toastId = toast.loading('Sending invoice to customer…');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/orders/${id}/send-invoice`);
      if (res.data.status) {
        toast.success(res.data.msg || 'Invoice emailed to customer', { id: toastId });
      } else {
        toast.error(res.data.msg || 'Failed to send invoice', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send invoice', { id: toastId });
    } finally {
      setEmailingInvoice(false);
    }
  };

  // Approve deferred order — generates payment link only. Email must be sent manually after testing.
  const handleApproveOrder = async () => {
    if (!window.confirm('Approve this order? A payment link will be generated — you must test it first before sending to the customer.')) return;
    setApproving(true);
    const toastId = toast.loading('Approving order...');
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/orders/${id}/approve`);
      if (res.data.status) {
        toast.success('Order approved! Copy & test the link below, then click "Send Email to Customer".', { id: toastId, duration: 6000 });
        setFormData(prev => ({ ...prev, status: 'payment pending' }));
        setPaymentLink(res.data.data?.paymentLink || '');
      } else {
        toast.error(res.data.msg || 'Approval failed', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Approval failed', { id: toastId });
    } finally {
      setApproving(false);
    }
  };

  // Resend payment link email
  const handleResendPaymentLink = async () => {
    if (!window.confirm('Resend payment link email to the customer?')) return;
    setResending(true);
    const toastId = toast.loading('Resending payment link...');
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/orders/${id}/resend-payment-link`);
      if (res.data.status) {
        toast.success('Payment link resent successfully!', { id: toastId });
      } else {
        toast.error(res.data.msg || 'Failed to resend', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to resend', { id: toastId });
    } finally {
      setResending(false);
    }
  };

  const openShippedEmailModal = () => {
    const firstName = formData.shipping_first_name || '';
    const lastName  = formData.shipping_last_name  || '';
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Valued Customer';
    const orderNum  = formData.order_number || id;
    const trackingRows = orderProducts.map(p => {
      const courier = courierList.find(c => String(c.id || c._id) === String(p.courierId));
      const courierName = courier?.title || 'N/A';
      return `<li><strong>${p.name || 'Item'}</strong> &mdash; Courier: ${courierName}, Tracking: ${p.trackingCode || 'N/A'}</li>`;
    }).join('');

    const isGuest = !formData.customer_id;
    const trackPackageUrl = isGuest
      ? `${process.env.REACT_APP_FRONTEND_URL || 'https://www.bagchee.com'}/trace-order?tab=guest`
      : `${process.env.REACT_APP_FRONTEND_URL || 'https://www.bagchee.com'}/trace-order`;

    const estDeliveryLine = (formData.shipped_at && formData.estimated_delivery)
      ? `<p><strong>Estimated Delivery Date:</strong> ${new Date(formData.estimated_delivery).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>`
      : '';

    setEmailType('shipped');
    setEmailSubject(`Your Bagchee Order #${orderNum} Has Been Shipped!`);
    setEmailBody(`<p>Dear ${customerName},</p>
<p>Great news! Your Bagchee order <strong>#${orderNum}</strong> has been shipped.</p>
<p><strong>Tracking Details:</strong><ul>${trackingRows}</ul></p>
${estDeliveryLine}
<p><a href="${trackPackageUrl}" style="display:inline-block;background-color:#008DDA;color:#ffffff;text-decoration:none;padding:10px 24px;font-size:14px;font-weight:700;border-radius:6px;">Track Package</a></p>
<p>Please use the above tracking information to monitor your shipment. If you have any questions, please contact us.</p>
<p>Best regards,<br><strong>Bagchee Team</strong></p>`);
    setEmailModalOpen(true);
  };

  const openStatusEmailModal = () => {
    const firstName = formData.shipping_first_name || '';
    const lastName  = formData.shipping_last_name  || '';
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Valued Customer';
    const orderNum  = formData.order_number || id;
    const statusRows = orderProducts.map(p =>
      `<li><strong>${p.name || 'Item'}</strong>: ${p.status || 'Processing'}</li>`
    ).join('');
    setEmailType('status');
    setEmailSubject(`Update on Your Bagchee Order #${orderNum}`);
    setEmailBody(`<p>Dear ${customerName},</p>
<p>Here is the current status of your Bagchee order <strong>#${orderNum}</strong>:</p>
<ul>${statusRows}</ul>
<p>We will keep you updated as your order progresses. For any queries, please contact our support team.</p>
<p>Best regards,<br><strong>Bagchee Team</strong></p>`);
    setEmailModalOpen(true);
  };

  const openDelayEmailModal = () => {
    const firstName = formData.shipping_first_name || '';
    const lastName  = formData.shipping_last_name  || '';
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Valued Customer';
    const orderNum  = formData.order_number || id;
    const isGuest = !formData.customer_id;
    const base = process.env.REACT_APP_FRONTEND_URL || 'https://www.bagchee.com';
    const orderStatusUrl = isGuest ? `${base}/trace-order?tab=guest` : `${base}/trace-order`;
    const contactUrl = `${base}/contact-us`;
    setEmailType('delay');
    setEmailSubject(`Update on Your Bagchee Order #${orderNum} — Slight Delay`);
    setEmailBody(`<p>Hello ${firstName || customerName},</p>
<p>We are writing to inform you that your recent order, <strong>#${orderNum}</strong>, is running slightly behind schedule.</p>
<p>Unfortunately, we have encountered some unexpected logistical issues within our supply chain/carrier network.</p>
<p>We sincerely apologize for this inconvenience. We understand how important it is to receive your items on time, and our team is working closely with our logistics partners to get your order to you as quickly and safely as possible.</p>
<p>We will send you another email with a tracking link as soon as your package is on the move. In the meantime, you can continue to check your order status here: <a href="${orderStatusUrl}" style="color:#008DDA;font-weight:bold;">Order Status</a>.</p>
<p>Thank you so much for your patience and for your business. If you have any immediate questions or concerns, please feel free to <a href="${contactUrl}" style="color:#008DDA;font-weight:bold;">contact us</a>.</p>
<p>Best regards,<br><strong>The Bagchee Team</strong></p>`);
    setEmailModalOpen(true);
  };

  // Block Customer (16-July): writes blocklist entries — saveOrder then rejects any
  // order matching the blocked email / IP / country (guest or logged in).
  const handleBlockCustomer = async () => {
    const API_URL = process.env.REACT_APP_API_URL;
    const targets = [];
    if (blockChecks.email && formData.shipping_email) targets.push({ kind: 'email', value: formData.shipping_email });
    if (blockChecks.ip && customerOrigin.ip) targets.push({ kind: 'ip', value: customerOrigin.ip });
    if (blockChecks.country && customerOrigin.country) targets.push({ kind: 'country', value: customerOrigin.country });
    if (!targets.length) { toast.error('Select at least one thing to block'); return; }
    setBlocking(true);
    try {
      for (const t of targets) {
        await axios.post(`${API_URL}/blocklist/create`, { ...t, note: blockNote || `Blocked from order #${formData.order_number || id}` });
      }
      toast.success(`Blocked ${targets.map(t => `${t.kind} ${t.value}`).join(', ')}`);
      setShowBlockModal(false);
      setBlockNote('');
    } catch (e) {
      toast.error(e.response?.data?.msg || 'Failed to add block');
    } finally {
      setBlocking(false);
    }
  };

  // Cancellation email. Two openings: the toolbar button, and automatically after a save
  // that sets the order status to Cancelled. When the CUSTOMER asked for the cancellation
  // (Cancel Order in My Account) the wording confirms it was done on their request instead
  // of apologising for a stock issue.
  const openCancelEmailModal = (onRequest = !!cancelRequestedAt) => {
    const firstName = formData.shipping_first_name || '';
    const lastName  = formData.shipping_last_name  || '';
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Valued Customer';
    const orderNum  = formData.order_number || id;
    setEmailType('cancel');
    setEmailSubject(`Your Bagchee Order #${orderNum} Has Been Cancelled`);
    setEmailBody(onRequest
      ? `<p>Hello ${customerName},</p>
<p>As per your request, we have cancelled your order <strong>#${orderNum}</strong>.</p>
<p>If your order includes a payment, a refund will be issued within <strong>2&ndash;4 business days</strong> to your original payment method.</p>
<p>We're sorry to see this order go and we hope to serve you again soon. If there is anything we can help with, please write to us at <a href="mailto:email@bagchee.com" style="color:#008DDA;font-weight:bold;">email@bagchee.com</a>.</p>
<p>Best,<br><strong>The Bagchee Team</strong></p>`
      : `<p>Hello ${customerName},</p>
<p>We're sorry to inform you that due to a stock issue, we had to cancel your order, <strong>#${orderNum}</strong>. We apologize for any inconvenience this may cause and want to assure you that we're here to help.</p>
<p>If your order includes a payment, a refund will be issued within <strong>2&ndash;4 business days</strong> to your original payment method.</p>
<p>We know this is disappointing, and we want to make it right. As a small token of our apology, here is a special offer for your next purchase:</p>
<div style="text-align:center;margin:18px 0;">
  <p style="font-size:18px;font-weight:800;color:#0B2F3A;margin:0 0 8px;">15% discount on your next order!</p>
  <div style="display:inline-block;border:2px dashed #f59e0b;border-radius:8px;padding:8px 24px;"><span style="font-size:22px;font-weight:900;letter-spacing:2px;color:#0B2F3A;font-family:monospace;">BAGCHEE15</span></div>
</div>
<p>We hope to serve you better next time. Please don't hesitate to reach out to us with any questions or concerns via email <a href="mailto:email@bagchee.com" style="color:#008DDA;font-weight:bold;">email@bagchee.com</a>.</p>
<p>Best,<br><strong>The Bagchee Team</strong></p>`);
    setEmailModalOpen(true);
  };

  const openEmailModal = () => {
    setEmailType('confirmation');
    const firstName = formData.shipping_first_name || '';
    const lastName  = formData.shipping_last_name  || '';
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Valued Customer';
    const orderNum  = formData.order_number || id;
    const currency  = formData.currency || 'USD';
    const dueDate   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    // Exclude cancelled line items (out of print / other) so the email shows only payable titles (#5)
    const activeProducts = orderProducts.filter(p => !isCancelledItemStatus(p.status));
    const itemRows  = activeProducts.map(p =>
      `<li>${p.name || p.product?.title || 'Item'} &times; ${p.quantity || 1} &mdash; ${currency} ${Number(p.price || 0).toFixed(2)}</li>`
    ).join('');
    const cancelledSum = orderProducts
      .filter(p => isCancelledItemStatus(p.status))
      .reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.quantity) || 1), 0);
    // Re-rate Expedited/Express shipping for the remaining books (matches backend payable)
    const shippingDrop = Math.max(0, (Number(formData.shipping_cost) || 0)
      - previewPayableShipping(formData.shipping_cost, formData.shipping_type, orderProducts));
    const total = `${currency} ${Math.max(0, (Number(formData.total) || 0) - cancelledSum - shippingDrop).toFixed(2)}`;

    const paymentType = (formData.payment_type || '').toLowerCase();
    const isWireTransfer = paymentType.includes('wire') || paymentType.includes('bank transfer') || paymentType.includes('western union');

    if (isWireTransfer) {
      // Find payment method: exact title match first, then fuzzy fallback
      const wireMethod = paymentMethods.find(pm => pm.title === formData.payment_type)
        || paymentMethods.find(pm => {
          const t = (pm.title || '').toLowerCase();
          return t.includes('wire') || t.includes('bank transfer') || t.includes('western union');
        });
      const bankDetails = wireMethod?.additionalText || '[Bank details not found — please check admin payment settings]';

      setEmailSubject(`Action Required: Payment Information for Bagchee Order #${orderNum}`);
      setEmailBody(`<p>Hi ${firstName || customerName},</p>
<p>Thank you for your purchase with Bagchee! We're excited to confirm your order.</p>
<p><strong>Order Summary:</strong></p>
<p><strong>Order Number:</strong> #${orderNum}<br>
<strong>Items:</strong><ul>${itemRows}</ul>
<strong>Total Amount:</strong> ${total}<br>
<strong>Due:</strong> ${dueDate}</p>
<p><strong>Payment Instructions:</strong></p>
${bankDetails}
<p><em>Note: Please use your order number (#${orderNum}) as the reference for your transfer.</em></p>
<p>We will notify you when your order is processed.</p>
<p>Please contact customer support for any questions or concerns.</p>
<p>Best regards,<br><strong>Bagchee</strong></p>`);
    } else {
      const link = paymentLink || '[Payment link will be sent separately]';
      setEmailSubject(`Action Required: Payment Link for Bagchee Order ${orderNum}`);
      setEmailBody(`<p>Dear ${customerName},</p>
<p>Thank you for your order! We have received and approved your following order request.</p>
<p><strong>Order Number:</strong> ${orderNum}<br>
<strong>Items:</strong><ul>${itemRows}</ul>
<strong>Total Outstanding Balance:</strong> ${total}<br>
<strong>Due Date:</strong> ${dueDate}</p>
<p>Please click the link below to complete your payment:<br>
<a href="${link}" style="color:#008DDA;font-weight:bold;">${link}</a></p>
<p><em>Note: Your order will be processed immediately upon receipt of this payment.</em></p>
<p>Thanks,<br><strong>Bagchee Team</strong></p>`);
    }
    setEmailModalOpen(true);
  };

  const handleSendConfirmationEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return toast.error('Subject and body are required');
    setSendingEmail(true);
    const toastId = toast.loading('Sending email...');
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/orders/${id}/send-confirmation-email`, {
        subject: emailSubject,
        body: emailBody
      });
      if (res.data.status) {
        toast.success('Email sent successfully!', { id: toastId });
        setEmailModalOpen(false);
      } else {
        toast.error(res.data.msg || 'Failed to send', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send email', { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };

  // Jodit Config
  const config = useMemo(() => ({
    readonly: false,
    height: 350,
    minHeight: 200,
    toolbar: true,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    buttons: ['bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'font', 'fontsize', '|', 'align', 'undo', 'redo']
  }), []);

  // Styles
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";
  const inputClass = "w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body text-text-main";
  const dropdownClass = "w-1/3 border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 text-gray-600";

  // Options for the main order-status <select>. /order-status/list omits the code-generated
  // "Approval pending" status, and orders store the pending statuses lowercase ('payment
  // pending') while the DB option is 'Payment pending' — a case mismatch that left the box
  // blank. So: ensure both pending statuses exist (case-insensitive de-dupe keeps the DB
  // list authoritative), inject the order's current status only if still unlisted, and bind
  // the <select> to whichever option matches the stored status case-INsensitively.
  const statusOptions = useMemo(() => {
    const out = [];
    const seen = new Set();
    const add = (value, label) => {
      if (!value) return;
      const key = String(value).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ value, label: label || value });
    };
    orderStatuses.forEach((st) => add(st.name));
    add('approval pending', 'Approval Pending');
    add('payment pending', 'Payment Pending');
    add(formData.status, formData.status); // current status, only if no case-insensitive match above
    return out;
  }, [orderStatuses, formData.status]);

  // The stored status ('payment pending') may differ only in case from its option
  // ('Payment pending'); match case-insensitively so the box shows it instead of blank.
  const selectedStatusValue =
    (statusOptions.find((o) => o.value.toLowerCase() === String(formData.status || '').toLowerCase()) || {}).value
    ?? formData.status;

  // Item statuses in the wild: canonical names ('Shipped'), case variants ('in progress',
  // the payment captures' 'In Progress'), legacy numeric order_statuses ids migrated from
  // the old site ('3', '1', '5'…), and 'Pending' from admin-created orders. The per-item
  // <select> binds by exact string, so every one of those rendered as a BLANK box. Resolve
  // each row's stored status to the option it should display; non-canonical values get an
  // injected <option> whose value IS the raw stored status, so nothing is rewritten in the
  // DB unless the admin actually picks a different status.
  const itemStatusBinding = (raw) => {
    const s = String(raw ?? '').trim();
    if (!s) return { value: '' };
    if (s.toLowerCase() === 'cancelled') return { value: 'cancelled' };
    if (s.toLowerCase() === 'cancelled - other') return { value: 'cancelled - other' };
    if (/^\d+$/.test(s)) {
      const byId = orderStatuses.find((st) => String(st.id ?? st._id) === s);
      return { value: s, extraOption: { value: s, label: byId ? byId.name : s } };
    }
    const byName = orderStatuses.find((st) => String(st.name).toLowerCase() === s.toLowerCase());
    if (byName) return { value: byName.name };
    return { value: s, extraOption: { value: s, label: s } };
  };

  if (fetching) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-20">

      {/* 🔵 Header */}
      <div className="bg-primary sticky top-0 z-50 px-6 py-3 shadow-md flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">Edit Orders</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/orders${backToListQs}`)}
            className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            title="Back to the orders list"
          >
            <ArrowLeft size={13} /> {listSearch ? `Back to "${listSearch}" results` : 'Back to orders'}
          </button>
          {(canPrev || canNext) && (
            <div className="flex items-center gap-1 bg-white/10 rounded px-1 py-0.5">
              <button
                type="button"
                onClick={() => goToNeighbor('prev')}
                disabled={!canPrev}
                className="text-white px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous order in results"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              {orderNav.posLabel && <span className="text-white/80 text-[10px] font-bold px-1 tabular-nums">{orderNav.posLabel}</span>}
              <button
                type="button"
                onClick={() => goToNeighbor('next')}
                disabled={!canNext}
                className="text-white px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next order in results"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Block Customer Modal (16-July) ─── */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={() => setShowBlockModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-2 font-montserrat">
                <Ban size={14} /> Block Customer
              </h3>
              <button type="button" onClick={() => setShowBlockModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Blocked customers can never place an order again (guest or logged in) — they get a generic
                "contact customer support" error at checkout. Manage all blocks under <b>Blocked Customers</b> in the admin menu.
              </p>
              <label className={`flex items-start gap-2.5 text-xs ${formData.shipping_email ? 'cursor-pointer' : 'opacity-40'}`}>
                <input type="checkbox" className="mt-0.5" disabled={!formData.shipping_email}
                  checked={blockChecks.email && !!formData.shipping_email}
                  onChange={(e) => setBlockChecks((p) => ({ ...p, email: e.target.checked }))} />
                <span><b>Email</b><br /><span className="font-mono text-gray-600">{formData.shipping_email || 'no email on this order'}</span></span>
              </label>
              <label className={`flex items-start gap-2.5 text-xs ${customerOrigin.ip ? 'cursor-pointer' : 'opacity-40'}`}>
                <input type="checkbox" className="mt-0.5" disabled={!customerOrigin.ip}
                  checked={blockChecks.ip && !!customerOrigin.ip}
                  onChange={(e) => setBlockChecks((p) => ({ ...p, ip: e.target.checked }))} />
                <span><b>IP address</b><br /><span className="font-mono text-gray-600">{customerOrigin.ip || 'not recorded (order predates IP capture)'}</span></span>
              </label>
              <label className={`flex items-start gap-2.5 text-xs ${customerOrigin.country ? 'cursor-pointer' : 'opacity-40'}`}>
                <input type="checkbox" className="mt-0.5" disabled={!customerOrigin.country}
                  checked={blockChecks.country && !!customerOrigin.country}
                  onChange={(e) => setBlockChecks((p) => ({ ...p, country: e.target.checked }))} />
                <span><b>Entire country</b> <span className="font-mono text-gray-600">{customerOrigin.country || '—'}</span><br />
                <span className="text-red-500">Blocks EVERY customer ordering from this country — use with care.</span></span>
              </label>
              <input type="text" value={blockNote} onChange={(e) => setBlockNote(e.target.value)}
                placeholder={`Note (default: Blocked from order #${formData.order_number || id})`}
                className="w-full border border-gray-200 rounded px-3 py-2 text-xs" />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-600">Cancel</button>
                <button type="button" onClick={handleBlockCustomer} disabled={blocking}
                  className="px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 disabled:opacity-50">
                  {blocking ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Order Confirmation Email Modal ─── */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-sm font-bold uppercase tracking-wider font-montserrat text-text-main">
                {emailType === 'shipped' ? 'Order Shipped Email' : emailType === 'status' ? 'Order Status Email' : emailType === 'delay' ? 'Shipping Delay Notification' : emailType === 'cancel' ? 'Cancel Order Email' : 'Order Confirmation Email'}
              </h2>
              <button type="button" onClick={() => setEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
              {/* Body */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Email Body</label>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <JoditEditor
                    ref={emailEditor}
                    value={emailBody}
                    config={config}
                    onBlur={newContent => setEmailBody(newContent)}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-5 py-2 rounded text-[11px] font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendConfirmationEmail}
                disabled={sendingEmail}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                {sendingEmail ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                Send Mail
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[95%] mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">Order Details</h2>
              {customerOrigin.ip && (
                <span className="text-[10px] text-gray-400 font-mono" title="Where the customer placed this order from">
                  placed from {customerOrigin.ip}{customerOrigin.country ? ` · ${customerOrigin.country}` : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {formData.status === 'approval pending' && (
                <button
                  type="button"
                  onClick={handleApproveOrder}
                  disabled={approving}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {approving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Approve & Generate Link
                </button>
              )}
              <button
                type="button"
                onClick={openEmailModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Mail size={12} /> Order Confirmation Email
              </button>
              <button
                type="button"
                onClick={openShippedEmailModal}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Mail size={12} /> Order Shipped Email
              </button>
              <button
                type="button"
                onClick={openStatusEmailModal}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Mail size={12} /> Order Status Email
              </button>
              <button
                type="button"
                onClick={openDelayEmailModal}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Mail size={12} /> Shipping Delay Notification
              </button>
              <button
                type="button"
                onClick={() => openCancelEmailModal()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Mail size={12} /> Cancel Order Email
              </button>
              <button
                type="button"
                onClick={() => setShowBlockModal(true)}
                className="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                title="Stop this customer from placing any future orders"
              >
                <Ban size={12} /> Block Customer
              </button>
              <button type="button" onClick={() => navigate(`/admin/orders${backToListQs}`)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
          </div>

          <div className="p-8 space-y-3">

            {/* --- CUSTOMER COMMENT (read-only — left by the buyer at checkout; surfaced prominently in red so it's seen on open) --- */}
            {customerComment && customerComment.trim() && (
              <div className="flex items-start gap-3 bg-red-50 border-2 border-red-400 rounded-lg p-4 shadow-sm">
                <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-700 font-montserrat mb-1">Customer Comment</p>
                  <p className="text-sm font-semibold text-red-700 whitespace-pre-wrap break-words">{customerComment}</p>
                  <p className="text-[10px] text-red-400 mt-1">Left by the customer at checkout — read-only.</p>
                </div>
              </div>
            )}

            {/* --- CANCELLATION REQUEST (customer pressed "Cancel Order" in My Account) --- */}
            {cancelRequestedAt && String(formData.status || '').toLowerCase() !== 'cancelled' && (
              <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-sm">
                <Ban size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 font-montserrat mb-1">Cancellation Requested</p>
                  <p className="text-sm font-semibold text-amber-800">
                    The customer asked to cancel this order on {new Date(cancelRequestedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
                  </p>
                  <p className="text-[10px] text-amber-600 mt-1">Set Status to <strong>Cancelled</strong> and click Update — the cancellation email opens automatically.</p>
                </div>
              </div>
            )}

            {/* # Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>#</label>
              <div className="col-span-9"><input type="text" name="order_number" value={formData.order_number} onChange={handleChange} className={inputClass} /></div>
            </div>

            {/* Payment Link (shown when order has payment pending / deferred flow) */}
            {paymentLink && (() => {
              const isValidLink = paymentLink.startsWith('https://bagchee.com/pay/') || paymentLink.startsWith('https://www.bagchee.com/pay/');
              return (
                <div className="grid grid-cols-12 gap-4 items-start">
                  <label className={labelClass}>Payment link</label>
                  <div className="col-span-9 flex flex-col gap-2">
                    {!isValidLink && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 text-[11px] font-semibold px-3 py-2 rounded">
                        <AlertTriangle size={13} />
                        This link looks broken — do NOT send it to the customer. Use "Resend" to generate a fresh one.
                      </div>
                    )}
                    <div className={`flex items-center gap-2 rounded px-3 py-2 border ${isValidLink ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-300'}`}>
                      <a href={paymentLink} target="_blank" rel="noreferrer" className={`text-[12px] font-bold hover:underline break-all flex-1 ${isValidLink ? 'text-primary' : 'text-red-600'}`}>{paymentLink}</a>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(paymentLink); toast.success('Link copied!'); }}
                        className="shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all"
                        title="Copy link"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResendPaymentLink}
                        disabled={resending}
                        className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {resending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                        Send Email to Customer
                      </button>
                      <p className="text-[10px] text-gray-400">⚠️ Copy &amp; test the link first — only send when you've confirmed it works.</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Purchase Order Number (if applicable) */}
            {purchaseOrderNumber && (
              <div className="grid grid-cols-12 gap-4 items-center">
                <label className={labelClass}>PO number</label>
                <div className="col-span-9">
                  <span className="text-[13px] font-bold text-text-main">{purchaseOrderNumber}</span>
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Created at</label>
              <div className="col-span-9 flex items-center gap-2">
                <input type="datetime-local" name="created_at" value={formData.created_at} onChange={handleChange} className={`${inputClass} w-1/3`} />
              </div>
            </div>

            {/* Customer */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Customer</label>
              <div className="col-span-9">
                <CustomerSelect
                  value={formData.customer_id}
                  initialLabel={customerLabel}
                  guestLabel={guestLabel}
                  onChange={(cid) => setFormData(prev => ({ ...prev, customer_id: cid }))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Payment Type */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Payment type</label>
              <div className="col-span-9">
                <select
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleChange}
                  className={dropdownClass}
                >
                  <option value="">Select Payment type</option>

                  {/* Legacy payment types ("Check or money order", "Western Union", trailing-space
                      variants…) aren't in the payments table — inject the raw stored value so the
                      select doesn't render blank (same pattern as the per-item status resolver). */}
                  {formData.payment_type && !paymentMethods.some(pm => pm.title === formData.payment_type) && (
                    <option value={formData.payment_type}>{formData.payment_type}</option>
                  )}

                  {/* 🟢 DYNAMIC OPTIONS FROM BACKEND */}
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((pm) => (
                      <option key={pm.id || pm.id || pm._id} value={pm.title}>
                        {pm.title}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading payments...</option>
                  )}
                </select>
              </div>
            </div>

            {/* Shipping Type */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping type</label>
              <div className="col-span-9">
                <select
                  name="shipping_type"
                  value={formData.shipping_type}
                  onChange={handleChange}
                  className={dropdownClass}
                >
                  <option value="">Select Shipping type</option>

                  {/* ~93% of orders carry old-site shipping titles ("12-15 Days Free Worldwide
                      Shipping", "6-16 Days Standard…") that aren't among today's options — inject
                      the raw stored value so the select doesn't render blank. */}
                  {formData.shipping_type && !shippingOptions.some(opt => opt.title === formData.shipping_type) && (
                    <option value={formData.shipping_type}>{formData.shipping_type}</option>
                  )}

                  {/* 🟢 DYNAMIC SHIPPING OPTIONS FROM BACKEND */}
                  {shippingOptions.length > 0 ? (
                    shippingOptions.map((opt) => (
                      <option key={opt.id || opt.id || opt._id} value={opt.title}>
                        {opt.title}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading shipping options...</option>
                  )}
                </select>
              </div>
            </div>

          {/* --- PRODUCTS TABLE --- */}
<div className="grid grid-cols-12 gap-4 items-start mt-4">
  <label className={labelClass}>Products</label>
  <div className="col-span-9"> {/* 🟢 Main wrapper */}
    
    {/* Scrollable Table Div */}
    <div className="overflow-x-auto border border-gray-300 rounded-sm">
      <table className="w-full border-collapse border border-gray-300 text-[10px] min-w-[900px]">
        <thead className="bg-gray-50 text-text-muted font-montserrat font-bold">
          <tr>
            <th className="border p-2 text-left min-w-[200px]">Name</th>
            <th className="border p-2 w-20">Price</th>
            <th className="border p-2 w-16">Quantity</th>
            <th className="border p-2 w-24">Status</th>
            <th className="border p-2 w-24">Courier</th>
            <th className="border p-2 w-24">Tracking id</th>
            <th className="border p-2 w-24">Return note</th>
            <th className="border p-2 w-24">Cancel note</th>
            <th className="border p-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {orderProducts.map((row, index) => {
            // Strikethrough + "excluded" badge only for the two cancel values — that is what
            // the backend's isCancelledItem actually excludes from the invoice/charge. A legacy
            // numeric '5' displays as "Cancelled" in the select but is NOT excluded, so it
            // must not carry the badge.
            const isCancelledRow = isCancelledItemStatus(row.status);
            const statusBind = itemStatusBinding(row.status);
            return (
            <tr key={index}>
              <td className="border p-1">
                <div
                  className={`cursor-pointer px-1 py-0.5 rounded transition-colors ${isCancelledRow ? 'text-gray-400 line-through hover:bg-gray-50' : 'text-blue-600 hover:text-blue-800 underline hover:bg-blue-50'}`}
                  onClick={() => handleProductClick(row)}
                  title="Click to view product details"
                >
                  {row.name || row.product?.title || row.title || '—'}
                </div>
                {isCancelledRow && (
                  <span className="inline-block mt-0.5 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1">Excluded from invoice &amp; payment</span>
                )}
              </td>
              <td className="border p-1"><input type="number" value={row.price} onChange={(e) => handleProductChange(index, 'price', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1"><input type="number" value={row.quantity} onChange={(e) => handleProductChange(index, 'quantity', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border-b p-1">
                <select value={statusBind.value} onChange={(e) => handleProductChange(index, 'status', e.target.value)} className={`w-full outline-none bg-transparent text-[10px] ${isCancelledRow ? 'text-red-600 font-bold' : ''}`}>
                  <option value="">Status</option>
                  <option value="cancelled">Cancelled (out of print)</option>
                  <option value="cancelled - other">Cancelled</option>
                  {statusBind.extraOption && <option value={statusBind.extraOption.value}>{statusBind.extraOption.label}</option>}
                  {orderStatuses.filter((st) => String(st.name).toLowerCase() !== 'cancelled').map((st) => <option key={st.id || st._id} value={st.name}>{st.name}</option>)}
                </select>
              </td>
              <td className="border-b p-1">
                <select value={row.courierId || ''} onChange={(e) => handleProductChange(index, 'courierId', e.target.value)} className="w-full outline-none bg-transparent text-[10px]">
                  <option value="">Select Courier</option>
                  {courierList.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
                </select>
              </td>
              <td className="border p-1"><input type="text" value={row.trackingCode || ''} onChange={(e) => handleProductChange(index, 'trackingCode', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1"><input type="text" value={row.returnNote || ''} onChange={(e) => handleProductChange(index, 'returnNote', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1"><input type="text" value={row.cancelNote || ''} onChange={(e) => handleProductChange(index, 'cancelNote', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1 text-center"><button type="button" onClick={() => removeProductRow(index)}><Trash2 size={12} className="text-red-500" /></button></td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Live money preview: what the customer will be charged + what this edit changed (#5, 5-Aug) */}
    {(() => {
      const b = baselineRef.current;
      const cur = formData.currency || 'USD';
      const cancelledSum = orderProducts
        .filter(p => isCancelledItemStatus(p.status))
        .reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.quantity) || 1), 0);
      const fullShipping = Number(formData.shipping_cost) || 0;
      const newShipping  = previewPayableShipping(formData.shipping_cost, formData.shipping_type, orderProducts);
      const shippingDrop = Math.max(0, fullShipping - newShipping);
      const payablePreview = Math.max(0, (Number(formData.total) || 0) - cancelledSum - shippingDrop);

      // Did this edit move the stored numbers? (items / shipping / total vs what was loaded)
      const totalChanged    = b && !near(Number(formData.total) || 0, b.total);
      const shippingChanged = b && !near(fullShipping, b.shipping);
      if (cancelledSum <= 0 && !totalChanged && !shippingChanged) return null;

      return (
        <div className="mt-3 text-[11px] bg-amber-50 border border-amber-200 rounded p-2 text-amber-800 leading-relaxed">
          {cancelledSum > 0 && (
            <>
              <strong>Cancelled items are excluded.</strong> The customer&apos;s invoice &amp; payment link will charge{' '}
              <strong>{cur} {payablePreview.toFixed(2)}</strong> instead of the full order total {cur} {Number(formData.total || 0).toFixed(2)}.
              {shippingDrop > 0 && (
                <> Shipping is re-rated for the remaining books: <strong>{cur} {fullShipping.toFixed(2)} → {cur} {newShipping.toFixed(2)}</strong>.</>
              )}{' '}
            </>
          )}
          {shippingChanged && (
            <>
              Shipping {fullShipping > b.shipping ? 'added' : 'updated'}: <strong>{cur} {b.shipping.toFixed(2)} → {cur} {fullShipping.toFixed(2)}</strong>
              {fullShipping > b.shipping && shippingRule?.freeMin > 0
                ? ` — the remaining books are under the ${cur} ${Number(shippingRule.freeMin).toFixed(2)} free-shipping threshold.`
                : '.'}{' '}
            </>
          )}
          {totalChanged && (
            <>Order total: <strong>{cur} {b.total.toFixed(2)} → {cur} {Number(formData.total || 0).toFixed(2)}</strong>.{' '}</>
          )}
          Click <strong>Update</strong> before sending the payment link or invoice so the change takes effect.
        </div>
      );
    })()}

    {/* 🟢 Search Box Block (Overflow div se bahar, par col-span-9 ke andar) */}
    <div className="mt-4 relative" onClick={(e) => e.stopPropagation()}>
      <div className="relative w-full md:w-1/2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs outline-none focus:border-primary pr-8"
            placeholder="Search Book to Add..."
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isSearching ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <Search size={14} className="text-gray-400" />}
          </div>
        </div>

        {/* Floating Search Results */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute left-0 top-full w-full bg-white border border-gray-300 rounded shadow-2xl z-[9999] max-h-60 overflow-y-auto mt-1">
            {searchResults.map((prod) => (
              <div key={prod.id || prod.id || prod._id} onClick={() => handleSelectProduct(prod)} className="px-4 py-2 hover:bg-primary/10 cursor-pointer border-b border-gray-100 flex flex-col">
                <p className="text-[11px] font-bold text-gray-800 uppercase">{prod.title}</p>
                <span className="text-[9px] text-primary">Price: ${prod.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    
  </div> {/* 🟢 col-span-9 Wrapper End */}
</div> {/* 🟢 Main Grid End */}
            {/* Financials & Status */}
            {Number(formData.coupon_discount) > 0 && (
              <div className="grid grid-cols-12 gap-4 items-center">
                <label className={labelClass}>Coupon discount</label>
                <div className="col-span-9 text-[13px] font-bold text-green-600">
                  &minus;{formData.currency || 'USD'} {Number(formData.coupon_discount).toFixed(2)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Total</label>
              <div className="col-span-9"><input type="text" name="total" value={formData.total} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping cost</label>
              <div className="col-span-9"><input type="text" name="shipping_cost" value={formData.shipping_cost} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Currency</label>
              <div className="col-span-9"><input type="text" name="currency" value={formData.currency} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Status</label>
              <div className="col-span-9">
                <select name="status" value={selectedStatusValue} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Status</option>
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipped Date</label>
              <div className="col-span-9"><input type="date" name="shipped_at" value={formData.shipped_at} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Est. Delivery Date</label>
              <div className="col-span-9"><input type="date" name="estimated_delivery" value={formData.estimated_delivery} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Membership</label>
              <div className="col-span-9">
                <select name="membership" value={formData.membership} onChange={handleChange} className={`${dropdownClass} w-1/4`}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Membership discount</label>
              <div className="col-span-9"><input type="text" name="membership_discount" value={formData.membership_discount} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Coupon id</label>
              <div className="col-span-9">
                <select name="coupon_id" value={formData.coupon_id} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Coupon id</option>
                  {coupons.map(c => <option key={c.id || c.id || c._id} value={c.id || c.id || c._id}>{c.code}</option>)}
                </select>
              </div>
            </div>

            {/* --- SHIPPING DETAILS --- */}
            <div className="grid grid-cols-12 gap-4 items-center mt-6">
              <label className={labelClass}>Shipping email</label>
              <div className="col-span-9"><input type="email" name="shipping_email" value={formData.shipping_email} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping first name</label>
              <div className="col-span-9"><input type="text" name="shipping_first_name" value={formData.shipping_first_name} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping last name</label>
              <div className="col-span-9"><input type="text" name="shipping_last_name" value={formData.shipping_last_name} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping address</label>
              <div className="col-span-9"><input type="text" name="shipping_address_1" value={formData.shipping_address_1} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping address 2</label>
              <div className="col-span-9"><input type="text" name="shipping_address_2" value={formData.shipping_address_2} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping company</label>
              <div className="col-span-9"><input type="text" name="shipping_company" value={formData.shipping_company} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping country</label>
              <div className="col-span-9">
                <select name="shipping_country" value={formData.shipping_country} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Shipping country</option>
                  {/* Old/migrated orders may store a country not in the predefined list — show it so it never renders blank */}
                  {formData.shipping_country && !countries.includes(formData.shipping_country) && (
                    <option value={formData.shipping_country}>{formData.shipping_country}</option>
                  )}
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping state/region</label>
              <div className="col-span-9"><input type="text" name="shipping_state_region" value={formData.shipping_state_region} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping city</label>
              <div className="col-span-9"><input type="text" name="shipping_city" value={formData.shipping_city} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping postcode</label>
              <div className="col-span-9"><input type="text" name="shipping_postcode" value={formData.shipping_postcode} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping phone</label>
              <div className="col-span-9"><input type="text" name="shipping_phone" value={formData.shipping_phone} onChange={handleChange} className={inputClass} /></div>
            </div>

            {/* --- BILLING DETAILS --- */}
            <div className="grid grid-cols-12 gap-4 items-center mt-6">
              <label className={labelClass}>Billing first name</label>
              <div className="col-span-9"><input type="text" name="billing_first_name" value={formData.billing_first_name} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing last name</label>
              <div className="col-span-9"><input type="text" name="billing_last_name" value={formData.billing_last_name} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing address</label>
              <div className="col-span-9"><input type="text" name="billing_address_1" value={formData.billing_address_1} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing address 2</label>
              <div className="col-span-9"><input type="text" name="billing_address_2" value={formData.billing_address_2} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing company</label>
              <div className="col-span-9"><input type="text" name="billing_company" value={formData.billing_company} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing country</label>
              <div className="col-span-9">
                <select name="billing_country" value={formData.billing_country} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Billing country</option>
                  {/* Old/migrated orders may store a country not in the predefined list — show it so it never renders blank */}
                  {formData.billing_country && !countries.includes(formData.billing_country) && (
                    <option value={formData.billing_country}>{formData.billing_country}</option>
                  )}
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing state/region</label>
              <div className="col-span-9"><input type="text" name="billing_state_region" value={formData.billing_state_region} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing city</label>
              <div className="col-span-9"><input type="text" name="billing_city" value={formData.billing_city} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing postcode</label>
              <div className="col-span-9"><input type="text" name="billing_postcode" value={formData.billing_postcode} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Billing phone</label>
              <div className="col-span-9"><input type="text" name="billing_phone" value={formData.billing_phone} onChange={handleChange} className={inputClass} /></div>
            </div>

            {/* --- COMMENT (admin's editable note — customer's checkout comment is shown in red at the top) --- */}
            <div className="grid grid-cols-12 gap-4 items-start mt-6">
              <label className="col-span-12 sm:col-span-3 text-left sm:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Comment</label>
              <div className="col-span-12 sm:col-span-9 border border-gray-300 rounded overflow-hidden shadow-sm min-h-[200px]">
                <JoditEditor ref={editor} value={commentContent} config={config} onBlur={newContent => setCommentContent(newContent)} />
              </div>
            </div>

            {/* Bottom Fields */}
            <div className="grid grid-cols-12 gap-4 items-center mt-4">
              <label className={labelClass}>Payment status</label>
              <div className="col-span-9">
                <select name="payment_status" value={formData.payment_status} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Payment Status</option>
                  {/* Migrated orders hold legacy PayPal statuses ("Completed", "Reversed",
                      "Denied", case variants) — inject the raw value so it doesn't render blank.
                      Picking a canonical option below rewrites it on save, which is fine. */}
                  {formData.payment_status && !['pending', 'paid', 'failed', 'refunded'].includes(formData.payment_status) && (
                    <option value={formData.payment_status}>{formData.payment_status}</option>
                  )}
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <p className="text-[10px] text-text-muted mt-1 ml-1">Marking <strong>Paid</strong> on a pay-later order (wire / UNESCO) moves it to <strong>In Progress</strong> in the customer's account. Purchase Orders are Net-30 — marking Paid only updates the payment status; set the order status yourself.</p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Transaction id</label>
              <div className="col-span-9"><input type="text" name="transaction_id" value={formData.transaction_id} onChange={handleChange} className={inputClass} /></div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Invoice</label>
              <div className="col-span-9 flex flex-wrap gap-2">
                <button type="button" onClick={handlePrintInvoice} className="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1 text-text-muted">
                  <Printer size={12} /> Print / Download Invoice
                </button>
                <button type="button" onClick={handleEmailInvoice} disabled={emailingInvoice} className="bg-primary/10 border border-primary/30 text-primary px-3 py-1 rounded text-[11px] font-bold hover:bg-primary/20 flex items-center gap-1 disabled:opacity-50">
                  <Mail size={12} /> {emailingInvoice ? 'Sending…' : 'Email Invoice to Customer'}
                </button>
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} className="text-green-600" />} Update
              </button>

              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
                <RotateCcw size={16} className="text-primary" /> Update & go back
              </button>

              <button type="button" onClick={() => navigate(`/admin/orders${backToListQs}`)} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
                <X size={16} className="text-red-600" /> Cancel
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrders;