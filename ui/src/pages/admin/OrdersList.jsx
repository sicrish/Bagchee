import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';


const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default 10 entries

  const [globalSearch, setGlobalSearch] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const searchDebounceRef = useRef(null);

  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    id: "",
    date: "",
    type: "",
    customer: "",
    total: "",
    status: "",
    payment_status: ""
  });

  const fetchOrders = async (exportMode = false, searchOverride = undefined) => {
    if (!exportMode) setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const searchTerm = searchOverride !== undefined ? searchOverride : globalSearch;
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

      const url = exportMode
        ? `${API_URL}/orders/list?limit=100000${searchParam}`
        : `${API_URL}/orders/list?page=${currentPage}&limit=${itemsPerPage}${searchParam}`;

      const res = await axios.get(url);
      if (res.data.status) {
        if (exportMode) return res.data.data;
        setOrders(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalOrders(res.data.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load orders");
    } finally {
      if (!exportMode) setLoading(false);
    }
  };

  // Refetch when page or items-per-page changes
  useEffect(() => {
    fetchOrders();
  }, [currentPage, itemsPerPage]);

  // Debounced search — fires 400ms after user stops typing
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setGlobalSearch(val);
    setCurrentPage(1);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchOrders(false, val);
    }, 400);
  };

  // Jab entries change hon, toh wapas page 1 par chale jayein
  const handleEntriesChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Column-level filters applied client-side on the server-returned page
  const filteredOrders = useMemo(() => {
    return orders.filter((order, index) => {
      const orderNum  = (order.orderNumber || order.order_number || "").toString().toLowerCase();
      const displayId = (order.id || index + 1).toString().toLowerCase();
      const custName  = (order.customer?.name || order.customer_id?.name || "").toLowerCase();

      return (
        displayId.includes(filters.id.toLowerCase()) &&
        (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB').includes(filters.date) : true) &&
        (order.paymentType || order.payment_type || "").toLowerCase().includes(filters.type.toLowerCase()) &&
        custName.includes(filters.customer.toLowerCase()) &&
        (order.total || 0).toString().includes(filters.total) &&
        (order.status || "").toLowerCase().includes(filters.status.toLowerCase()) &&
        (order.paymentStatus || order.payment_status || "").toLowerCase().includes(filters.payment_status.toLowerCase())
      );
    });
  }, [orders, filters]);


  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", date: "", type: "", customer: "", total: "", status: "", payment_status: "" });
    setGlobalSearch("");
    setCurrentPage(1);
    fetchOrders(false, "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/orders/delete/${id}`);
      if (res.data.status) {
        toast.success("Order deleted successfully!", { id: toastId });
        fetchOrders();
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };


// 🟢 1. FULL DATA EXCEL EXPORT LOGIC
const handleExport = async () => {
  const toastId = toast.loading("Fetching all order details for export...");
  try {
    const API_URL = process.env.REACT_APP_API_URL;
    
    // Backend se poora data mangwayein (Pagination bypass)
    const res = await axios.get(`${API_URL}/orders/list?limit=100000`);

    if (res.data.status && res.data.data) {
      const allOrders = res.data.data;

      if (allOrders.length === 0) {
        toast.error("No data found to export", { id: toastId });
        return;
      }

      // 2. Mapping logic — Prisma returns flat camelCase fields
      const dataToExport = allOrders.map((order, index) => {
        const productDetails = (order.items || order.products || []).map(p =>
          `${p.name} (Price: ${p.price}, Qty: ${p.quantity}, Status: ${p.status || 'N/A'})`
        ).join(" | ") || "-";

        return {
          "Sr No": index + 1,
          "Order Number": order.orderNumber || order.order_number || "-",
          "Order Date": formatDate(order.createdAt),
          "Order Status": order.status || "pending",

          // --- Financials ---
          "Currency": order.currency || "USD",
          "Total Amount": Number(order.total || 0).toFixed(2),
          "Shipping Cost": Number(order.shippingCost ?? order.shipping_cost ?? 0).toFixed(2),
          "Membership": order.membership || "No",
          "Membership Discount": Number(order.membershipDiscount ?? order.membership_discount ?? 0).toFixed(2),

          // --- Payment Info ---
          "Payment Type": order.paymentType || order.payment_type || "-",
          "Payment Status": order.paymentStatus || order.payment_status || "pending",
          "Transaction ID": order.transactionId || order.transaction_id || "-",

          // --- Customer Info ---
          "Customer Name": order.customer?.name || order.customer_id?.name || "Unknown",
          "Customer Email": order.customer?.email || order.customer_id?.email || "-",

          // --- Shipping Details (flat camelCase from Prisma) ---
          "Ship Email": order.shippingEmail || "-",
          "Ship First Name": order.shippingFirstName || "-",
          "Ship Last Name": order.shippingLastName || "-",
          "Ship Address 1": order.shippingAddress1 || "-",
          "Ship Address 2": order.shippingAddress2 || "-",
          "Ship Company": order.shippingCompany || "-",
          "Ship Country": order.shippingCountry || "-",
          "Ship State/Region": order.shippingState || "-",
          "Ship City": order.shippingCity || "-",
          "Ship Postcode": order.shippingPostcode || "-",
          "Ship Phone": order.shippingPhone || "-",

          // --- Billing Details (flat camelCase from Prisma) ---
          "Bill First Name": order.billingFirstName || "-",
          "Bill Last Name": order.billingLastName || "-",
          "Bill Address 1": order.billingAddress1 || "-",
          "Bill Address 2": order.billingAddress2 || "-",
          "Bill Company": order.billingCompany || "-",
          "Bill Country": order.billingCountry || "-",
          "Bill State/Region": order.billingState || "-",
          "Bill City": order.billingCity || "-",
          "Bill Postcode": order.billingPostcode || "-",
          "Bill Phone": order.billingPhone || "-",

          // --- Products & Comments ---
          "Products Detail (Name, Price, Qty)": productDetails,
          "Admin Comment": order.comment?.replace(/<[^>]*>?/gm, '') || "-"
        };
      });

      // 3. XLSX Workbook Creation
      await exportToExcel(dataToExport, "Detailed Orders", "Detailed_Orders_Export");
      
      toast.success("Detailed export successful! 📊", { id: toastId });
    }
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Detailed export failed!", { id: toastId });
  }
};


  // 🟢 2. PRINT LOGIC (Browser print functionality)
  const handlePrint = () => {
    if (filteredOrders.length === 0) return toast.error("No data to print");
    window.print();
  };



  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filterInputClass = "w-full rounded p-1 text-[10px] outline-none bg-white/90 focus:bg-white text-text-main font-montserrat border border-transparent focus:border-primary transition-all";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/admin/add-orders')}
          className="w-full md:w-auto bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Orders
        </button>

        <div className="relative flex-1 max-w-md group">
          <input
            type="text"
            value={globalSearch}
            onChange={handleSearchChange}
            placeholder="Search by book name, keyword, order#, customer, email..."
            className="w-full bg-white border border-cream-200 rounded-md pl-10 pr-10 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm font-body text-text-main transition-all placeholder:text-text-muted/50"
          />

          {/* 🟢 Search Icon - text-text-muted color use kiya hai */}
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors"
            size={16}
          />

          {/* 🟢 Clear Button (X) - aapki config ke red-600 color ke saath */}
          {globalSearch && (
            <button
              type="button"
              onClick={() => { setGlobalSearch(""); setCurrentPage(1); fetchOrders(false, ""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-600 transition-colors p-0.5 rounded-full hover:bg-red-50"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExport}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button
            onClick={handlePrint} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button onClick={clearFilters} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchOrders} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Created at</th>
                <th className="p-3 text-left border-r border-white/20">Payment type</th>
                <th className="p-3 text-left border-r border-white/20">Customer</th>
                <th className="p-3 text-left border-r border-white/20 w-28">Total</th>
                <th className="p-3 text-left border-r border-white/20">Status</th>
                <th className="p-3 text-left border-r border-white/20">Payment status</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* 🟢 Filter Row */}
              <tr className="bg-primary border-b border-cream-200 align-top">
                <td className="p-2 border-r border-white/20 text-center">
                  <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer shrink-0" />
                    <input name="id" value={filters.id} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="ID" />
                  </div>
                </td>
                <td className="p-2 border-r border-white/20"><input name="date" value={filters.date} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="DD/MM/YYYY" /></td>
                <td className="p-2 border-r border-white/20"><input name="type" value={filters.type} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Type" /></td>
                <td className="p-2 border-r border-white/20"><input name="customer" value={filters.customer} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Customer" /></td>
                <td className="p-2 border-r border-white/20"><input name="total" value={filters.total} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Amount" /></td>
                <td className="p-2 border-r border-white/20"><input name="status" value={filters.status} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Status" /></td>
                <td className="p-2 border-r border-white/20"><input name="payment_status" value={filters.payment_status} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Payment" /></td>
                <td className="p-2 text-center">
                  <button onClick={fetchOrders} className="text-white hover:rotate-180 transition-transform duration-500"><RotateCw size={16} /></button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin text-primary" /> Loading Orders...</div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => {
                  const orderId   = order.id || order._id;
                  const orderNum  = order.orderNumber || order.order_number || orderId;
                  const custName  = order.customer?.name || order.customer_id?.name || "Unknown Customer";
                  const payType   = order.paymentType || order.payment_type || '-';
                  const payStatus = order.paymentStatus || order.payment_status || 'Pending';
                  const statusVal = order.status || 'Pending';
                  // Highlight matching items when searching by product
                  const matchedItems = globalSearch
                    ? (order.items || []).filter(i => i.name?.toLowerCase().includes(globalSearch.toLowerCase()))
                    : [];
                  return (
                  <tr key={orderId} className="hover:bg-primary-50 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50">
                      <div className="flex items-center gap-5 px-1">
                        <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                        <span className="text-text-muted text-[10px] font-bold w-full text-center">{orderNum}</span>
                      </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{formatDate(order.createdAt)}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main uppercase text-[11px]">{payType}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold">
                      <div>{custName}</div>
                      {matchedItems.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {matchedItems.map((item, i) => (
                            <span key={i} className="inline-block bg-yellow-100 text-yellow-800 text-[9px] font-bold px-1.5 py-0.5 rounded mr-1">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold">{Number(order.total || 0).toFixed(2)}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusVal.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {statusVal}
                      </span>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{payStatus}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-orders/${orderId}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(orderId)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-text-muted italic font-montserrat">No orders found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-4 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4">

          {/* 🟢 LEFT: SHOW ENTRIES DROPDOWN */}
          <div className="flex items-center gap-2 text-[12px] font-montserrat font-bold text-text-main order-2 md:order-1">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={handleEntriesChange}
              className="border border-cream-200 rounded px-2 py-1 outline-none focus:border-primary bg-cream-50 text-xs transition-all cursor-pointer font-bold text-primary shadow-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          {/* 🟢 CENTER: DISPLAY INFO */}
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter font-montserrat order-1 md:order-2">
            {globalSearch
              ? `${totalOrders} result${totalOrders === 1 ? '' : 's'} for "${globalSearch}"`
              : `Displaying ${filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to ${Math.min(currentPage * itemsPerPage, totalOrders)} of ${totalOrders} items`
            }
          </div>

          {/* 🟢 RIGHT: NAVIGATION CONTROLS */}
          <div className="flex items-center gap-1 order-3">
            {/* Jump to First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number Box */}
            <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden shadow-inner">
              <input
                type="text"
                value={currentPage}
                readOnly
                className="w-10 text-center text-xs border-none p-1.5 font-bold bg-cream-50 text-primary font-montserrat"
              />
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
            >
              <ChevronRight size={16} />
            </button>

            {/* Jump to Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersList;