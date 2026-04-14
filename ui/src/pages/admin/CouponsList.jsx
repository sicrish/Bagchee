'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, Ticket, Copy, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';


const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const CouponsList = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // 🔍 Filter States
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCode, setSearchCode] = useState("");

  // 🟢 2. Fetch Coupons Logic (With Pagination Params)
  const fetchCoupons = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      const res = await axios.get(`${API_BASE_URL}/coupons/list?${params.toString()}`);
      if (res.data.status) {
        if (isExport) return res.data.data;
        setCoupons(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      toast.error("Failed to load coupons");
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  // 🟢 3. Excel Export Logic (Fully Synced with Backend & Model)
  const handleExport = async () => {
    const toastId = toast.loading("Preparing coupons data...");
    try {
      // 1. Backend se poora data fetch karein (Bypassing pagination)
      const allData = await fetchCoupons(true);

      if (!allData || allData.length === 0) {
        toast.error("No data found to export", { id: toastId });
        return;
      }

      // 2. Data Mapping (Model fields ke hisaab se)
      const dataToExport = allData.map((c, i) => ({
        "Sr No": i + 1,
        "Coupon Title": c.title || "N/A",
        "Code": c.code,
        "Discount Type": c.fix_amount === 'active' ? "Fixed Amount" : "Percentage", // Model logic
        "Discount Value": c.amount || 0, // Model mein 'amount' field hai
        "Min. Purchase": c.minimum_buy || 0,
        "Valid From": formatDate(c.valid_from),
        "Expiry Date": formatDate(c.valid_to),
        "Status": c.active === 'active' ? "Active" : "Inactive"
      }));

      // 3. Create Workbook
      await exportToExcel(dataToExport, "Coupons", "Coupons_Report");
      toast.success("Excel exported successfully! 📊", { id: toastId });
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Export failed", { id: toastId });
    }
  };


  // 🔴 2. Delete Logic with Confirmation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this coupon?")) return;

    const toastId = toast.loading("Processing deletion...");
    try {
      const res = await axios.delete(`${API_BASE_URL}/coupons/delete/${id}`);
      if (res.data.status) {
        toast.success("Coupon removed from system! ✨", { id: toastId });
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Operation failed", { id: toastId });
    }
  };

  // 📋 3. Copy to Clipboard Utility
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Code "${text}" copied!`, {
      icon: '📋',
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  // 🔍 4. Live Filtering Logic
  const filteredCoupons = useMemo(() => {
    return coupons.filter(item =>
      (item.title?.toLowerCase().includes(searchTitle.toLowerCase())) &&
      (item.code?.toLowerCase().includes(searchCode.toLowerCase()))
    );
  }, [coupons, searchTitle, searchCode]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const filterInputClass = "w-full rounded px-2 py-1 text-[11px] outline-none bg-white/90 focus:bg-white text-text-main font-semibold shadow-inner border-none placeholder:text-gray-400";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

<style dangerouslySetInnerHTML={{ __html: `
  @media print {
    /* 1. Faltu cheezein hide karo (Buttons, Search Inputs, Pagination Dropdown) */
    button, 
    input, 
    select, 
    .no-print, 
    .group-hover\\:opacity-100,
    aside, 
    nav {
      display: none !important;
    }

    /* 2. Background aur Shadows reset karo taaki ink bache aur saaf dikhe */
    body {
      background: white !important;
      color: black !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .bg-cream-50, .bg-white {
      background: white !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* 3. Table ko poori width do aur borders set karo */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: auto !important;
    }

    th, td {
      border: 1px solid #eee !important; /* Halka border paper par sundar lagta hai */
      padding: 8px !important;
      font-size: 10px !important; /* Halka chota font taaki data kategi nahi */
      color: black !important;
    }

    /* 4. Table Header ko rang do (Taaki professional report lage) */
    thead {
      display: table-header-group !important; /* Har page par header repeat hoga */
      background-color: #008DDA !important; /* Aapka primary blue color */
      -webkit-print-color-adjust: exact; /* Browser ko color force karne ke liye */
    }

    thead th {
      color: white !important;
      text-transform: uppercase;
    }

    /* 5. Column Hide (Actions wala column print mein nahi chahiye hota) */
    th:last-child, td:last-child {
      display: none !important;
    }
    
    /* 6. Page setup */
    @page {
      margin: 1cm;
      size: auto;
    }
  }
`}} />


      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => navigate('/admin/add-coupons')}
            className="bg-primary text-white hover:brightness-110 px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
          >
            <Plus size={16} /> Add Coupon
          </button>
          <button className="bg-white border border-cream-300 text-text-main px-5 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm hover:bg-gray-50 transition-all">
            Send Coupons
          </button>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={fetchCoupons} className="bg-white border border-cream-300 p-2.5 rounded-lg text-primary hover:bg-gray-50 transition-all shadow-sm group">
            <RotateCw size={16} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          {/* --- Export Button --- */}
          <button
            onClick={handleExport}
            className="bg-white border border-cream-300 text-gray-600 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95 no-print"
          >
            <Download size={14} className="text-accent" /> Export
          </button>

          {/* --- Print Button --- */}
          <button
            onClick={() => window.print()}
            className="bg-white border border-cream-300 text-gray-600 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95 no-print"
          >
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
            onClick={() => { setSearchTitle(""); setSearchCode(""); }}
            className="bg-white border border-cream-300 text-gray-500 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-gray-50 transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              {/* Header Titles */}
              <tr className="bg-primary text-white font-montserrat font-bold uppercase tracking-widest text-[10px]">
                <th className="p-4 text-center w-24 border-r border-white/10">Ref.</th>
                <th className="p-4 text-left border-r border-white/10">Coupon Information</th>
                <th className="p-4 text-left border-r border-white/10">Access Code</th>
                <th className="p-4 text-left border-r border-white/10">Valid From</th>
                <th className="p-4 text-left border-r border-white/10">Expiry Date</th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>

              {/* Filter Row */}
              <tr className="bg-primary/95 border-t border-white/10">
                <td className="p-2 border-r border-white/10">
                  <div className="flex justify-center items-center h-full">
                    <input type="checkbox" className="h-4 w-4 rounded accent-accent bg-white cursor-pointer" />
                  </div>
                </td>
                <td className="p-2 border-r border-white/10">
                  <input
                    type="text"
                    className={filterInputClass}
                    placeholder="Search Title..."
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                  />
                </td>
                <td className="p-2 border-r border-white/10">
                  <input
                    type="text"
                    className={filterInputClass}
                    placeholder="Search Code..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                  />
                </td>
                <td className="p-2 border-r border-white/10"></td>
                <td className="p-2 border-r border-white/10"></td>
                <td className="p-2 text-center text-white/50"><Search size={14} className="inline" /></td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-montserrat">Syncing with server...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCoupons.length > 0 ? (
                filteredCoupons.map((coupon, index) => {
                  const isExpired = coupon.valid_to && new Date(coupon.valid_to) < new Date();

                  return (
                    <tr key={coupon.id || coupon._id} className="hover:bg-primary/5 transition-colors group">
                      <td className="p-4 border-r border-gray-50 text-center font-mono text-xs text-gray-400">
                        {index + 1}
                      </td>
                      <td className="p-4 border-r border-gray-50">
                        <div className="flex flex-col">
                          <span className="text-text-main font-bold tracking-tight">{coupon.title}</span>
                          {isExpired && <span className="text-[8px] font-black text-red-500 uppercase">Expired</span>}
                        </div>
                      </td>
                      <td className="p-4 border-r border-gray-50">
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider border border-primary/10 hover:bg-primary hover:text-white transition-all group/btn"
                        >
                          {coupon.code}
                          <Copy size={10} className="opacity-40 group-hover/btn:opacity-100" />
                        </button>
                      </td>
                      <td className="p-4 border-r border-gray-50 text-gray-600 font-medium text-xs italic">{formatDate(coupon.valid_from)}</td>
                      <td className="p-4 border-r border-gray-50 text-gray-600 font-medium text-xs italic">{formatDate(coupon.valid_to)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/admin/edit-coupons/${coupon.id || coupon._id}`)}
                            className="p-2 bg-white border border-gray-200 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id || coupon._id)}
                            className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Ticket size={48} className="mb-2 text-gray-300" />
                      <p className="text-sm font-bold text-gray-500 italic font-montserrat">No results found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm">
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-cream-200 rounded px-2 py-1 focus:border-primary bg-cream-50 text-xs text-primary font-bold cursor-pointer">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-text-muted uppercase text-[10px] tracking-wide">entries</span>
          </div>

          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
            Displaying {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90"><ChevronLeft size={16} /></button>
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">{currentPage}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponsList;