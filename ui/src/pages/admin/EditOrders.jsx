import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Plus, Trash2, Printer, Mail,Search  } from 'lucide-react';
import JoditEditor from '../../components/admin/LazyJoditEditor';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

const EditOrders = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se Order ID lene ke liye
  const editor = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Dropdown Data
  const [customers, setCustomers] = useState([]);
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
  const [addProductIdInput, setAddProductIdInput] = useState('');

  const [commentContent, setCommentContent] = useState('');

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

        // Parallel requests: Dropdowns + Single Order Data
        const [custRes, prodRes, coupRes, orderRes, payRes, shipRes, courierRes, statusRes] = await Promise.all([
          axios.get(`${API_URL}/user/fetch`),
          axios.get(`${API_URL}/product/fetch`),
          axios.get(`${API_URL}/coupons/active`),
          axios.get(`${API_URL}/orders/get/${id}`),
          axios.get(`${API_URL}/payments/list`),
          axios.get(`${API_URL}/shipping-options/list`),
          axios.get(`${API_URL}/couriers/list`),      // 🟢 Courier API
          axios.get(`${API_URL}/order-status/list`)
        ]);

        // Set Dropdowns
        if (custRes.data.status) setCustomers(custRes.data.data);
        if (prodRes.data.status) setProductsList(prodRes.data.data);
        if (coupRes.data.status) setCoupons(coupRes.data.data);
        if (payRes.data.status) setPaymentMethods(payRes.data.data);
        if (shipRes.data.status) setShippingOptions(shipRes.data.data);
        if (courierRes.data.status) setCourierList(courierRes.data.data); // 🟢 Set Courier
        if (statusRes.data.status) setOrderStatuses(statusRes.data.data);

        // Set Order Data (Auto-fill)
        if (orderRes.data.status) {
          const data = orderRes.data.data;

          // Date Format Fix for datetime-local
          const formattedDate = data.createdAt ? new Date(data.createdAt).toISOString().slice(0, 16) : '';

          setFormData({
            order_number: data.orderNumber || data.order_number || '',
            created_at: formattedDate,
            customer_id: data.customerId || '',
            payment_type: data.paymentType || data.payment_type || '',
            shipping_type: data.shippingType || data.shipping_type || '',

            total: data.total || '',
            shipping_cost: data.shippingCost || data.shipping_cost || '',
            currency: data.currency || '',

            status: data.status || 'Not yet ordered',
            membership: data.membership || 'No',
            membership_discount: data.membershipDiscount || data.membership_discount || '',
            coupon_id: data.couponId || data.coupon_id || '',

            //shipping
            shipping_email: data.shippingEmail || '',
            shipping_first_name: data.shippingFirstName || '',
            shipping_last_name: data.shippingLastName || '',
            shipping_address_1: data.shippingAddress1 || '',
            shipping_address_2: data.shippingAddress2 || '',
            shipping_company: data.shippingCompany || '',
            shipping_country: data.shippingCountry || 'India',
            shipping_state_region: data.shippingState || '',
            shipping_city: data.shippingCity || '',
            shipping_postcode: data.shippingPostcode || '',
            shipping_phone: data.shippingPhone || '',

            //billing
            billing_first_name: data.billingFirstName || '',
            billing_last_name: data.billingLastName || '',
            billing_address_1: data.billingAddress1 || '',
            billing_address_2: data.billingAddress2 || '',
            billing_company: data.billingCompany || '',
            billing_country: data.billingCountry || 'India',
            billing_state_region: data.billingState || '',
            billing_city: data.billingCity || '',
            billing_postcode: data.billingPostcode || '',
            billing_phone: data.billingPhone || '',

            // Bottom
            payment_status: data.paymentStatus || data.payment_status || '',
            transaction_id: data.transactionId || data.transaction_id || ''
          });

          setOrderProducts(data.items || data.products || []);
          setCommentContent(data.comment || '');
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
    const newRow = {
      name: product.title,
      price: product.price || 0,
      quantity: 1,
      status: orderStatuses.length > 0 ? orderStatuses[0].name : 'Pending',
      courier: '', tracking_id: '', return_note: '', cancel_note: ''
    };
    setOrderProducts(prev => {
      const updated = [...prev, newRow];
      calculateGrandTotal(updated, formData.shipping_cost);
      return updated;
    });
    setSearchQuery("");
    setIsDropdownOpen(false);
  };


  // 1. Calculation Engine
  const calculateGrandTotal = (products, shipping) => {
    const subtotal = products.reduce((acc, item) => {
      const p = Number(item.price) || 0;
      const q = Number(item.quantity) || 0;
      return acc + (p * q);
    }, 0);
    const shipCost = Number(shipping) || 0;
    const finalTotal = subtotal + shipCost;
    setFormData(prev => ({ ...prev, total: finalTotal.toFixed(2) }));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'shipping_cost') calculateGrandTotal(orderProducts, value);
      return updated;
    });
  };

  // --- Product Table Logic ---
  const addProductRow = () => {
    const foundProd = productsList.find(p => p.id === addProductIdInput || p.bagcheeId === addProductIdInput || p.sku === addProductIdInput);

    const newRow = {
      name: foundProd ? foundProd.title : '',
      price: foundProd ? foundProd.price : '',
      quantity: 1,
      status: '',
      courier: '',
      tracking_id: '',
      return_note: '',
      cancel_note: ''
    };

    setOrderProducts([...orderProducts, newRow]);
    setAddProductIdInput('');
  };

  const removeProductRow = (index) => {
    const list = [...orderProducts];
    list.splice(index, 1);
    setOrderProducts(list);
  };

  const handleProductChange = (index, field, value) => {
    const list = [...orderProducts];
    list[index][field] = value;
    setOrderProducts(list);
    if (field === 'price' || field === 'quantity') {
      calculateGrandTotal(list, formData.shipping_cost);
    }
  };

  // --- Submit Logic (Update) ---
  const handleSendShippedEmail = async () => {
    const toastId = toast.loading("Sending shipped email...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/orders/${id}/send-shipped-email`);
      if (res.data.status) toast.success(res.data.msg, { id: toastId });
      else toast.error(res.data.msg || "Failed to send email", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to send email", { id: toastId });
    }
  };

  const handleSendStatusEmail = async () => {
    const toastId = toast.loading("Sending status email...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/orders/${id}/send-status-email`);
      if (res.data.status) toast.success(res.data.msg, { id: toastId });
      else toast.error(res.data.msg || "Failed to send email", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to send email", { id: toastId });
    }
  };

  const handlePrintInvoice = () => {
    const invoiceWindow = window.open('', '_blank');
    const items = orderProducts.map(item => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.name || item.product?.title || 'Item'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(item.price || 0).toFixed(2)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('');

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${formData.order_number}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #008DDA; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 700; color: #008DDA; }
          .logo span { font-size: 12px; color: #666; display: block; font-weight: 400; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { margin: 0; font-size: 24px; color: #333; }
          .invoice-title p { margin: 4px 0 0; color: #666; font-size: 13px; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .details-block { font-size: 13px; line-height: 1.8; }
          .details-block strong { color: #008DDA; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #008DDA; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
          th:nth-child(2) { text-align: center; }
          .totals { text-align: right; margin-top: 10px; font-size: 14px; }
          .totals .row { display: flex; justify-content: flex-end; gap: 30px; padding: 4px 0; }
          .totals .grand { font-size: 18px; font-weight: 700; color: #008DDA; border-top: 2px solid #008DDA; padding-top: 8px; margin-top: 8px; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Bagchee<span>Books That Stick</span></div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p>Order #${formData.order_number}</p>
            <p>${formData.created_at ? new Date(formData.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
          </div>
        </div>

        <div class="details">
          <div class="details-block">
            <strong>Ship To</strong><br/>
            ${formData.shipping_first_name} ${formData.shipping_last_name}<br/>
            ${formData.shipping_address_1}${formData.shipping_address_2 ? ', ' + formData.shipping_address_2 : ''}<br/>
            ${formData.shipping_city}, ${formData.shipping_state_region} ${formData.shipping_postcode}<br/>
            ${formData.shipping_country}<br/>
            ${formData.shipping_phone ? 'Phone: ' + formData.shipping_phone : ''}
          </div>
          <div class="details-block">
            <strong>Bill To</strong><br/>
            ${formData.billing_first_name} ${formData.billing_last_name}<br/>
            ${formData.billing_address_1}${formData.billing_address_2 ? ', ' + formData.billing_address_2 : ''}<br/>
            ${formData.billing_city}, ${formData.billing_state_region} ${formData.billing_postcode}<br/>
            ${formData.billing_country}<br/>
            ${formData.billing_phone ? 'Phone: ' + formData.billing_phone : ''}
          </div>
          <div class="details-block">
            <strong>Order Info</strong><br/>
            Status: ${formData.status}<br/>
            Payment: ${formData.payment_type || '-'}<br/>
            Payment Status: ${formData.payment_status || '-'}<br/>
            ${formData.transaction_id ? 'Transaction: ' + formData.transaction_id : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Shipping:</span> <span>${formData.currency || 'INR'} ${Number(formData.shipping_cost || 0).toFixed(2)}</span></div>
          <div class="row grand"><span>Grand Total:</span> <span>${formData.currency || 'INR'} ${Number(formData.total || 0).toFixed(2)}</span></div>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Bagchee. All rights reserved. | Indore, India</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.customer_id) return toast.error("Customer is required!");


    setLoading(true);
    const toastId = toast.loading("Updating order...");

    try {
      const payload = {
        ...formData,
        coupon_id: formData.coupon_id === "" ? null : formData.coupon_id,
        customer_id: formData.customer_id,
        shipping_details: {
          email: formData.shipping_email,
          first_name: formData.shipping_first_name,
          last_name: formData.shipping_last_name,
          address_1: formData.shipping_address_1,
          address_2: formData.shipping_address_2,
          company: formData.shipping_company,
          country: formData.shipping_country,
          state_region: formData.shipping_state_region,
          city: formData.shipping_city,
          postcode: formData.shipping_postcode,
          phone: formData.shipping_phone,
        },
        billing_details: {
          first_name: formData.billing_first_name,
          last_name: formData.billing_last_name,
          address_1: formData.billing_address_1,
          address_2: formData.billing_address_2,
          company: formData.billing_company,
          country: formData.billing_country,
          state_region: formData.billing_state_region,
          city: formData.billing_city,
          postcode: formData.billing_postcode,
          phone: formData.billing_phone,
        },
        products: orderProducts,
        comment: commentContent
      };

      const API_URL = process.env.REACT_APP_API_URL;
      // PATCH request for update
      const res = await axios.patch(`${API_URL}/orders/update/${id}`, payload);

      if (res.data.status) {
        toast.success("Order updated successfully! 📦", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/orders');
        }
      }
    } catch (error) {
      console.error("Frontend Error Log:", error.response?.data);
      toast.error(error.response?.data?.msg || "Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Jodit Config
  const config = useMemo(() => ({
    readonly: false,
    height: 200,
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

  if (fetching) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-20">

      {/* 🔵 Header */}
      <div className="bg-primary sticky top-0 z-50 px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">Edit Orders</h1>
      </div>

      <div className="max-w-[95%] mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200 flex justify-between items-center">
            <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">Order Details</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate('/admin/orders')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
          </div>

          <div className="p-8 space-y-3">

            {/* # Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>#</label>
              <div className="col-span-9"><input type="text" name="order_number" value={formData.order_number} onChange={handleChange} className={inputClass} /></div>
            </div>

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
                <select name="customer_id" value={formData.customer_id} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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

                  {/* 🟢 DYNAMIC OPTIONS FROM BACKEND */}
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.title}>
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

                  {/* 🟢 DYNAMIC SHIPPING OPTIONS FROM BACKEND */}
                  {shippingOptions.length > 0 ? (
                    shippingOptions.map((opt) => (
                      <option key={opt.id} value={opt.title}>
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
          {orderProducts.map((row, index) => (
            <tr key={index}>
              <td className="border p-1"><input type="text" value={row.name} onChange={(e) => handleProductChange(index, 'name', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1"><input type="number" value={row.price} onChange={(e) => handleProductChange(index, 'price', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1"><input type="number" value={row.quantity} onChange={(e) => handleProductChange(index, 'quantity', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border-b p-1">
                <select value={row.status} onChange={(e) => handleProductChange(index, 'status', e.target.value)} className="w-full outline-none bg-transparent text-[10px]">
                  <option value="">Status</option>
                  {orderStatuses.map((st) => <option key={st.id} value={st.name}>{st.name}</option>)}
                </select>
              </td>
              <td className="border-b p-1">
                <select value={row.courier} onChange={(e) => handleProductChange(index, 'courier', e.target.value)} className="w-full outline-none bg-transparent text-[10px]">
                  <option value="">Select Courier</option>
                  {courierList.map((c) => <option key={c.id} value={c.title}>{c.title}</option>)}
                </select>
              </td>
              <td className="border p-1"><input type="text" value={row.tracking_id} onChange={(e) => handleProductChange(index, 'tracking_id', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1"><input type="text" value={row.return_note} onChange={(e) => handleProductChange(index, 'return_note', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1"><input type="text" value={row.cancel_note} onChange={(e) => handleProductChange(index, 'cancel_note', e.target.value)} className="w-full outline-none bg-transparent" /></td>
              <td className="border p-1 text-center"><button type="button" onClick={() => removeProductRow(index)}><Trash2 size={12} className="text-red-500" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

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
              <div key={prod.id} onClick={() => handleSelectProduct(prod)} className="px-4 py-2 hover:bg-primary/10 cursor-pointer border-b border-gray-100 flex flex-col">
                <p className="text-[11px] font-bold text-gray-800 uppercase">{prod.title}</p>
                <span className="text-[9px] text-primary">Price: ₹{prod.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    
  </div> {/* 🟢 col-span-9 Wrapper End */}
</div> {/* 🟢 Main Grid End */}
            {/* Financials & Status */}
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
                <select name="status" value={formData.status} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Status</option>
                  {orderStatuses.map((st) => (
                    <option key={st.id} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </div>
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
                  {coupons.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
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
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
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
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
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

            {/* --- COMMENT --- */}
            <div className="grid grid-cols-12 gap-4 items-start mt-6">
              <label className={labelClass}>Comment</label>
              <div className="col-span-9 border border-gray-300 rounded overflow-hidden shadow-sm">
                <JoditEditor ref={editor} value={commentContent} config={config} onBlur={newContent => setCommentContent(newContent)} />
              </div>
            </div>

            {/* Bottom Fields */}
            <div className="grid grid-cols-12 gap-4 items-center mt-4">
              <label className={labelClass}>Payment status</label>
              <div className="col-span-9"><input type="text" name="payment_status" value={formData.payment_status} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Transaction id</label>
              <div className="col-span-9"><input type="text" name="transaction_id" value={formData.transaction_id} onChange={handleChange} className={inputClass} /></div>
            </div>

            {/* Notification & Invoice Buttons */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Notification email</label>
              <div className="col-span-9 flex gap-2">
                <button type="button" onClick={handleSendShippedEmail} className="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1 text-text-muted">
                  <Mail size={12} /> Send order shipped email
                </button>
                <button type="button" onClick={handleSendStatusEmail} className="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1 text-text-muted">
                  <Mail size={12} /> Send order status email
                </button>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Invoice</label>
              <div className="col-span-9">
                <button type="button" onClick={handlePrintInvoice} className="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1 text-text-muted">
                  <Printer size={12} /> Print invoice
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

              <button type="button" onClick={() => navigate('/admin/orders')} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
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