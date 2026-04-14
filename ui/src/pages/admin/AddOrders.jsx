import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Plus, Trash2, Printer, Mail, Search } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

const AddOrders = () => {
  const navigate = useNavigate();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);

  // Dropdown Data
  const [customers, setCustomers] = useState([]);
  const [productsList, setProductsList] = useState([]); // All products for reference if needed
  const [coupons, setCoupons] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);

  // Search States (Aapke HomeSaleForm se liya gaya)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [courierList, setCourierList] = useState([]);

  



  // Product Rows
  const [orderProducts, setOrderProducts] = useState([
    { name: '', price: '', quantity: 1, status: '', courier: '', tracking_id: '', return_note: '', cancel_note: '' }
  ]);
  const [addProductIdInput, setAddProductIdInput] = useState('');

  const [commentContent, setCommentContent] = useState('');

  // Huge Form State to match all fields in image
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
    status: 'Not yet ordered',
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
    shipping_state_region: '', // Exact name
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
    billing_state_region: '', // Exact name
    billing_city: '',
    billing_postcode: '',
    billing_phone: '',

    // Bottom Fields
    payment_status: '',
    transaction_id: ''
  });


  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && isDropdownOpen) {
        setIsSearching(true);
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          const res = await axios.get(`${API_URL}/home-sale-products/search-inventory?q=${searchQuery}`);
          if (res.data.status) setSearchResults(res.data.data);
        } catch (error) {
          console.error("Search Error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isDropdownOpen]);



  // 1. Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const [custRes, prodRes, coupRes, payRes, shipRes, courierRes, statusRes] = await Promise.all([
          axios.get(`${API_URL}/user/fetch`),
          axios.get(`${API_URL}/product/fetch`),
          axios.get(`${API_URL}/coupons/active`),
          axios.get(`${API_URL}/payments/list`),
          axios.get(`${API_URL}/shipping-options/list`),
          axios.get(`${API_URL}/couriers/list`),
          axios.get(`${API_URL}/order-status/list`)
        ]);
        // 🔍 DEBUGGING CONSOLE LOGS
        // console.log("Customers:", custRes.data);
        // console.log("Payments:", payRes.data);

        if (custRes.data.status) setCustomers(custRes.data.data);
        if (prodRes.data.status) setProductsList(prodRes.data.data);
        if (coupRes.data.status) setCoupons(coupRes.data.data);
        if (payRes.data.status) setPaymentMethods(payRes.data.data);
        if (shipRes.data.status) setShippingOptions(shipRes.data.data);
        if (courierRes.data.status) setCourierList(courierRes.data.data);
        if (statusRes.data.status) setOrderStatuses(statusRes.data.data);

      } catch (error) {
        console.error("Data fetch error", error);
      }
    };
    fetchData();
  }, []);





  const handleSelectProduct = (product) => {
    const newRow = {
      product_id: product.id || product._id,
      name: product.title,
      price: product.price || 0,
      inr_price: product.inr_price || 0,
      real_price:product.real_price||0,
      quantity: 1,
      status: 'Pending', // Default Status
      courier: '',
      tracking_id: '',
      return_note: '',
      cancel_note: '',
      image: product.default_image || ''
    };
    setOrderProducts(prev => {
      let updatedList;
      
      // 🟢 Logic: Agar sirf 1 row hai aur wo khali hai, toh replace karo
      if (prev.length === 1 && prev[0].name === '') {
        updatedList = [newRow];
      } else {
        // 🟢 Warna purani list mein naya product piche add kar do
        updatedList = [...prev, newRow];
      }

      
      return updatedList;
    });
    setSearchQuery(""); // Input reset
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 1. Pehle form data ko update karo
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };


      return updatedData;
    });
  };

  // --- Product Table Logic ---
  const addProductRow = () => {
    // Logic to find product by ID if entered, else empty row
    const foundProd = productsList.find(p => p._id === addProductIdInput || p.sku === addProductIdInput);

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
    setAddProductIdInput(''); // Clear input
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
   
  };

  // --- Submit Logic ---
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.customer_id) return toast.error("Customer is required!");

    const validProducts = orderProducts.filter(p => p.name && p.name.trim() !== "");

    if (validProducts.length === 0) {
        return toast.error("At least one product with a name is required!");
    }
    setLoading(true);
    const toastId = toast.loading("Saving order...");

    try {
      const payload = {
        ...formData,
        coupon_id: formData.coupon_id === "" ? null : formData.coupon_id,
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
        products: validProducts,
        comment: commentContent
      };

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/orders/save`, payload);

      if (res.data.status) {
        toast.success("Order created successfully! 📦", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/orders');
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.msg || "Something went wrong while saving";
      toast.error(errorMessage, { id: toastId });
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

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-20">

      {/* 🔵 Header */}
      <div className="bg-primary  px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">Add Orders</h1>
      </div>

      <div className="max-w-[95%] mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200 flex justify-between items-center">
            <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">Order Details</h2>
            <div className="flex gap-2">
              <button type="button" className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
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
                <button type="button" className="text-[10px] text-blue-500 hover:underline">Clear (yyyy-mm-dd) hh:mm:ss</button>
              </div>
            </div>

            {/* Customer */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Customer</label>
              <div className="col-span-9">
                <select name="customer_id" value={formData.customer_id} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id || c.id || c._id} value={c.id || c.id || c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Payment Type */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Payment type</label>
              <div className="col-span-9">
                <select name="payment_type" value={formData.payment_type} onChange={handleChange} className={dropdownClass}>
                  <option value="">Select Payment type</option>
                  {/* 🟢 Dynamic Payment Options */}
                  {paymentMethods.map((pm) => (
                    <option key={pm.id || pm.id || pm._id} value={pm.title}>
                      {pm.title}
                    </option>
                  ))}
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

                  {/* 🟢 DYNAMIC SHIPPING OPTIONS */}
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

              {/* Yahan humne overflow-x-auto ko sirf table ke wrap tak rakha hai */}
              <div className="col-span-9">
                <div className="overflow-x-auto border border-gray-300 rounded-sm">
                  <table className="w-full border-collapse text-[10px] min-w-[900px]">
                    <thead className="bg-gray-50 text-text-muted font-montserrat font-bold">
                      <tr>
                        <th className="border-b p-2 text-left min-w-[200px]">Name</th>
                        <th className="border-b p-2 w-20">Price</th>
                        <th className="border-b p-2 w-16">Quantity</th>
                        <th className="border-b p-2 w-24">Status</th>
                        <th className="border-b p-2 w-24">Courier</th>
                        <th className="border-b p-2 w-24">Tracking id</th>
                        <th className="border-b p-2 w-24">Return note</th>
                        <th className="border-b p-2 w-24">Cancel note</th>
                        <th className="border-b p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderProducts.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border-b p-1"><input type="text" value={row.name} onChange={(e) => handleProductChange(index, 'name', e.target.value)} className="w-full outline-none bg-transparent" /></td>
                          <td className="border-b p-1"><input type="number" value={row.price} onChange={(e) => handleProductChange(index, 'price', e.target.value)} className="w-full outline-none bg-transparent" /></td>
                          <td className="border-b p-1"><input type="number" value={row.quantity} onChange={(e) => handleProductChange(index, 'quantity', e.target.value)} className="w-full outline-none bg-transparent" /></td>
                          <td className="border-b p-1">
                            <select
                              value={row.status}
                              onChange={(e) => handleProductChange(index, 'status', e.target.value)}
                              className="w-full outline-none bg-transparent text-[10px]"
                            >
                              <option value="">Select Status</option>
                              {/* 🟢 Dynamic Row Status Options */}
                              {orderStatuses.map((st) => (
                                <option key={st.id || st.id || st._id} value={st.name}>
                                  {st.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border-b p-1">
                            <select
                              value={row.courier}
                              onChange={(e) => handleProductChange(index, 'courier', e.target.value)}
                              className="w-full outline-none bg-transparent text-[10px]"
                            >
                              <option value="">Select Courier</option>
                              {courierList.map((c) => (
                                <option key={c.id || c.id || c._id} value={c.title}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border-b p-1"><input type="text" value={row.tracking_id} onChange={(e) => handleProductChange(index, 'tracking_id', e.target.value)} className="w-full outline-none bg-transparent" /></td>
                          <td className="border-b p-1"><input type="text" value={row.return_note} onChange={(e) => handleProductChange(index, 'return_note', e.target.value)} className="w-full outline-none bg-transparent" /></td>
                          <td className="border-b p-1"><input type="text" value={row.cancel_note} onChange={(e) => handleProductChange(index, 'cancel_note', e.target.value)} className="w-full outline-none bg-transparent" /></td>
                          <td className="border-b p-1 text-center"><button type="button" onClick={() => removeProductRow(index)}><Trash2 size={12} className="text-red-500" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 🟢 Search Section Fix: Isko table ke overflow div se bahar rakha hai */}
                <div className="mt-4 relative">
                  <div className="relative w-full md:w-1/2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs outline-none focus:border-primary pr-8"
                        placeholder="Search Title, ID or ISBN..."
                        autoComplete="off"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {isSearching ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <Search size={14} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* 🟢 Side Search Results (Z-index high and floating) */}
                    {isDropdownOpen && searchResults.length > 0 && (
                      <div className="fixed sm:absolute left-0 sm:left-full top-full sm:top-0 sm:ml-4 w-full sm:w-72 bg-white border border-gray-300 rounded shadow-2xl z-[9999] max-h-80 overflow-y-auto mt-2 sm:mt-0 animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-primary text-white text-[10px] px-3 py-1.5 font-bold uppercase sticky top-0 flex justify-between items-center">
                          <span>Search Results ({searchResults.length})</span>
                          <X size={12} className="cursor-pointer" onClick={() => setIsDropdownOpen(false)} />
                        </div>
                        {searchResults.map((prod) => (
                          <div
                            key={prod.id || prod.id || prod._id}
                            onClick={() => handleSelectProduct(prod)}
                            className="px-4 py-2.5 hover:bg-primary-50 cursor-pointer border-b border-gray-100 flex flex-col group transition-colors"
                          >
                            <p className="text-[11px] font-bold text-gray-800 group-hover:text-primary line-clamp-2 uppercase">{prod.title}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-primary bg-primary/10 px-1.5 rounded font-mono font-bold">{prod.bagchee_id}</span>

                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financials & Status */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Total</label>
              <div className="col-span-9"><input type="text" name="total" value={formData.total} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Shipping cost</label>
              <div className="col-span-9"><input type="number" name="shipping_cost" value={formData.shipping_cost} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Currency</label>
              <div className="col-span-9"><input type="text" name="currency" value={formData.currency} onChange={handleChange} className={inputClass} /></div>
            </div>
            {/* Main Order Status */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Status</label>
              <div className="col-span-9">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={dropdownClass}
                >
                  <option value="">Select Status</option>

                  {/* 🟢 DYNAMIC STATUS OPTIONS FROM BACKEND */}
                  {orderStatuses.length > 0 ? (
                    orderStatuses.map((st) => (
                      <option key={st.id || st.id || st._id} value={st.name}>
                        {st.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading statuses...</option>
                  )}
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
                  {coupons.map(c => <option key={c.id || c.id || c._id} value={c.id || c.id || c._id}>{c.code}</option>)}
                </select>
              </div>
            </div>

            {/* --- SHIPPING DETAILS (11 Fields) --- */}
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

            {/* --- BILLING DETAILS (11 Fields) --- */}
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

            {/* --- COMMENT (Rich Text) --- */}
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
                <button type="button" className="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1 text-text-muted">
                  <Mail size={12} /> Send order shipped email
                </button>
                <button type="button" className="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1 text-text-muted">
                  <Mail size={12} /> Send order status email
                </button>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Invoice</label>
              <div className="col-span-9">
                <button type="button" className="bg-gray-100 border border-gray-300 px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1 text-text-muted">
                  <Printer size={12} /> Print invoice
                </button>
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} className="text-green-600" />} Save
              </button>

              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
                <RotateCcw size={16} className="text-primary" /> Save and go back to list
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

export default AddOrders;