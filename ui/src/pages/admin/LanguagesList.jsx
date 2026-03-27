import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const LanguagesList = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  // 🟢 1. Pagination States (Backend Match)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);


  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    id: "",
    title: "",
    order: ""
  });

  // 🟢 2. Working Fetch Logic (Backend Integration)
  const fetchLanguages = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      // Pagination parameters for backend
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      const res = await axios.get(`${API_BASE_URL}/languages/list?${params.toString()}`);

      if (res.data.status) {
        if (isExport) return res.data.data;

        setLanguages(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load languages");
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  // Trigger fetch when page or limit changes
  useEffect(() => {
    fetchLanguages();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchLanguages();
  }, []);


  // 🟢 3. Excel Export logic
  const handleExport = async () => {
    const toastId = toast.loading("Preparing Excel file...");
    try {
      const allData = await fetchLanguages(true);
      if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

      const dataToExport = allData.map((lang, index) => ({
        "Sr No": index + 1,
        "Language Title": lang.title || "-",
        "Display Order": lang.order || 0,
        "Created At": new Date(lang.createdAt).toLocaleDateString('en-GB')
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Languages");
      XLSX.writeFile(workbook, `Languages_Report_${Date.now()}.xlsx`);
      toast.success("Excel downloaded! 📊", { id: toastId });
    } catch (error) { toast.error("Export failed", { id: toastId }); }
  };

  // 🟢 2. Print Function
  const handlePrint = () => {
    if (filteredLanguages.length === 0) return toast.error("No data to print");
    window.print();
  };

  // 🟢 2. Filtering Logic (Memoized for performance)
  const filteredLanguages = useMemo(() => {
    return languages.filter((lang, index) => {
      const displayId = (index + 1).toString();
      const matchesId = displayId.includes(filters.id);
      const matchesTitle = (lang.title || "").toLowerCase().includes(filters.title.toLowerCase());
      const matchesOrder = (lang.order || "").toString().includes(filters.order);

      return matchesId && matchesTitle && matchesOrder;
    });
  }, [languages, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", title: "", order: "" });
    fetchLanguages();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this language?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/languages/delete/${id}`);
      if (res.data.status) {
        toast.success("Language deleted successfully!", { id: toastId });
        fetchLanguages();
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const filterInputClass = "w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main font-montserrat border border-transparent focus:border-primary transition-all";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* 🟢 Print Optimization Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          button, input, select, .no-print, th:last-child, td:last-child { display: none !important; }
          .bg-cream-50 { background: white !important; }
          table { width: 100% !important; border: 1px solid #ddd !important; }
          thead { background-color: #008DDA !important; -webkit-print-color-adjust: exact; }
          thead th { color: white !important; }
        }
      `}} />

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/admin/add-languages')}
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Languages
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={handleExport} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button onClick={handlePrint} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
            onClick={clearFilters}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchLanguages} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20 w-32">Order</th>
                <th className="p-3 text-center w-32">Actions</th>
              </tr>

              {/* 🟢 Updated Filter Row with Bindings */}
              <tr className="bg-primary border-b border-cream-200">
                <td className="p-2 border-r border-white/20">
                  <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer shrink-0" />
                    <input
                      name="id"
                      value={filters.id}
                      onChange={handleFilterChange}
                      type="text"
                      className={filterInputClass}
                      placeholder="ID"
                    />
                  </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input
                    name="title"
                    value={filters.title}
                    onChange={handleFilterChange}
                    type="text"
                    className={filterInputClass}
                    placeholder="Filter Title"
                  />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input
                    name="order"
                    value={filters.order}
                    onChange={handleFilterChange}
                    type="text"
                    className={filterInputClass}
                    placeholder="Filter Order"
                  />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchLanguages} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-primary" /> Loading Languages...
                    </div>
                  </td>
                </tr>
              ) : filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang, index) => (
                  <tr key={lang.id} className="hover:bg-primary-50 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50">
                      <div className="flex items-center gap-5 px-1">
                        <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                        <span className="text-text-muted text-[10px] font-bold w-full text-center">{index + 1}</span>
                      </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{lang.title}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold">{lang.ord || 0}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-languages/${lang.id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(lang.id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-text-muted italic font-montserrat">No languages found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        {/* --- FOOTER / PAGINATION --- */}
        <div className="mt-4 p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm rounded-xl no-print">

          {/* 1. Show Entries Dropdown */}
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Limit badalne par wapas pehle page par jayein
              }}
              className="border border-cream-200 rounded px-2 py-1 outline-none focus:border-primary bg-cream-50 text-xs text-primary font-bold cursor-pointer shadow-sm transition-all active:scale-95"
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
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 bg-white transition-all shadow-sm"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 bg-white transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Current Page Display */}
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">
              {currentPage}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 bg-white transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 bg-white transition-all shadow-sm"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagesList;