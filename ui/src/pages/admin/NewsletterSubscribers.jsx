import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const NewsletterSubscribers = () => {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 1. Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    id: "",
    email: "",
    categories: ""
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // 🟢 2. Fetch Logic
  const fetchSubscribers = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      const res = await axios.get(`${API_BASE_URL}/newsletter-subs/list?${params.toString()}`);
      if (res.data.status) {
        if (isExport) return res.data.data;
        setSubscribers(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      toast.error("Failed to load subscribers");
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [currentPage, itemsPerPage]);

  // 🟢 3. Excel Export Logic
  const handleExport = async () => {
    const toastId = toast.loading("Preparing Excel file...");
    try {
      const allData = await fetchSubscribers(true);
      if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

      const dataToExport = allData.map((item, i) => ({
        "Sr No": i + 1,
        "Email": item.email,
        "First Name": item.firstname || "-",
        "Last Name": item.lastname || "-",
        "Categories": Array.isArray(item.categories) ? item.categories.join(", ") : item.categories,
        "Subscribed Date": new Date(item.createdAt).toLocaleDateString('en-GB')
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Subscribers");
      XLSX.writeFile(workbook, `Newsletter_Subscribers_${Date.now()}.xlsx`);
      toast.success("Excel exported successfully! 📊", { id: toastId });
    } catch (error) { toast.error("Export failed", { id: toastId }); }
  };

  const handlePrint = () => window.print();

  // 🟢 3. Filter Logic (Array Fix Included)
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((item) => {
      const displayId = (item.id || item.id || "").toString();
      const email = (item.email || "").toLowerCase();

      // Fix for Categories Array
      let categoryStr = "";
      if (Array.isArray(item.categories)) {
        categoryStr = item.categories.join(" ");
      } else if (item.categories) {
        categoryStr = item.categories.toString();
      }

      const categories = categoryStr.toLowerCase();

      return (
        displayId.includes(filters.id) &&
        email.includes(filters.email.toLowerCase()) &&
        categories.includes(filters.categories.toLowerCase())
      );
    });
  }, [subscribers, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", email: "", categories: "" });
    fetchSubscribers();
  };

  const handleDelete = async (id) => {
    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/newsletter-subs/delete/${id}`);
      if (res.data.status) {
        toast.success("Subscriber deleted successfully!", { id: toastId });
        fetchSubscribers();
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const filterInputClass = "w-full rounded-[4px] px-2 py-1.5 text-xs outline-none text-gray-700 font-montserrat shadow-inner focus:ring-2 focus:ring-blue-300";

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">

        {/* Left Actions */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => navigate('/admin/add-newsletter-subscriber')}
            className="bg-[#f8f9fa] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
          >
            <Plus size={14} className="text-red-600" /> Add Newsletter subscribers
          </button>

          <button
            className="bg-[#e9ecef] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
          >
            <Mail size={14} className="text-gray-600" /> Send Newsletters
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={handleExport} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-orange-500" /> Export
          </button>
          <button onClick={handlePrint} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
            onClick={clearFilters}
            className="bg-[#f8f9fa] border border-gray-300 text-gray-500 px-4 py-1.5 rounded shadow-sm hover:text-red-500 hover:border-red-200 flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchSubscribers} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Email</th>
                <th className="p-3 text-left border-r border-white/20">Categories</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              <tr className="bg-primary border-b border-gray-200">
                <td className="p-2 border-r border-white/20">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded accent-white cursor-pointer shrink-0 opacity-50" />
                    <input name="id" value={filters.id} onChange={handleFilterChange} type="text" className={filterInputClass} />
                  </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="email" value={filters.email} onChange={handleFilterChange} type="text" className={filterInputClass} />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="categories" value={filters.categories} onChange={handleFilterChange} type="text" className={filterInputClass} />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchSubscribers} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-500 font-bold">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-primary" /> Loading Subscribers...
                    </div>
                  </td>
                </tr>
              ) : filteredSubscribers.length > 0 ? (
                filteredSubscribers.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-[13px] group">

                    <td className="p-3 border-r border-gray-100">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0 border-gray-300" />
                        {/* Display simple Index + 1 for clean look, or item.id */}
                        <span className="text-gray-500 text-xs font-mono">{index + 1}</span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-100 text-gray-700 font-medium">
                      {item.email}
                    </td>

                    <td className="p-3 border-r border-gray-100 text-gray-600">
                      {Array.isArray(item.categories) ? item.categories.join(", ") : item.categories}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/edit-newsletter-subscriber/${item.id}`)}
                          className="p-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500 hover:bg-white hover:text-primary hover:border-primary transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500 hover:bg-white hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-400 italic font-montserrat">No matching subscribers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- 🟢 RESTORED FOOTER (Exact Style as Categories) --- */}
        {/* --- 🟢 UPDATED FOOTER (Exact Style & Theme Match) --- */}
        <div className="p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm no-print">

          {/* 1. Show Entries Dropdown */}
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-cream-200 rounded px-2 py-1 outline-none focus:border-primary bg-cream-50 text-xs text-primary font-bold cursor-pointer transition-all shadow-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-text-muted uppercase text-[10px] tracking-wide">entries</span>
          </div>

          {/* 2. Display Info */}
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
            Displaying {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </div>

          {/* 3. Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Current Page Indicator */}
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">
              {currentPage}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewsletterSubscribers;