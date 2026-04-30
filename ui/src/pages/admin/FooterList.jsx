import React, { useState, useEffect } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, LayoutPanelTop, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';
import {useConfirm} from '../../context/ConfirmContext.jsx'

const API_BASE_URL = process.env.REACT_APP_API_URL;

const FooterList = () => {
  const navigate = useNavigate();
    const {confirm}=useConfirm()
  // States
  const [footerColumns, setFooterColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter State
  const [filters, setFilters] = useState({
    name: "",
    title: "",
    subtitle: ""
  });

  // --- 1. FETCH DATA ---
  const fetchFooterData = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);
      
      if (filters.name) params.append("name", filters.name);
      if (filters.title) params.append("title", filters.title);

      const res = await axios.get(`${API_BASE_URL}/footer/list?${params.toString()}`);

      if (res.data.status) {
        if (isExport) return res.data.data;
        setFooterColumns(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load footer data");
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterData();
  }, [currentPage, itemsPerPage]);

  // --- 2. DELETE HANDLER ---
  const handleDelete = async (id) => {
        if (!(await confirm())) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await axios.delete(`${API_BASE_URL}/footer/delete/${id}`);
      if (res.data.status) {
        toast.success("Deleted successfully!", { id: toastId });
        fetchFooterData();
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  // --- 3. EXCEL EXPORT ---
  const handleExport = async () => {
    const toastId = toast.loading("Exporting Footer Data...");
    try {
      const allData = await fetchFooterData(true);
      if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

      await exportToExcel(allData, "FooterColumns", "Footer_Report");
      toast.success("Excel downloaded!", { id: toastId });
    } catch (error) { toast.error("Export failed", { id: toastId }); }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ name: "", title: "", subtitle: "" });
    fetchFooterData();
  };

  const filterInputClass = "w-full rounded border border-transparent focus:border-white/50 p-2 text-xs outline-none bg-white/20 text-white placeholder-white/60 font-montserrat transition-all";

  return (
    <div className="bg-cream-50 min-h-screen p-3 md:p-6 font-body text-text-main">
      
      {/* 🟢 Print Optimization Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          button, input, select, .no-print, th:last-child, td:last-child { display: none !important; }
          .bg-cream-50 { background: white !important; }
          table { width: 100% !important; border: 1px solid #eee !important; }
          thead { background-color: #008DDA !important; -webkit-print-color-adjust: exact; }
          thead th { color: white !important; }
        }
      `}} />

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 no-print">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <h1 className="text-xl font-montserrat font-bold text-primary flex items-center gap-2">
                <LayoutPanelTop size={24} /> Footer Management
            </h1>
            <button 
                onClick={() => navigate('/admin/add-footer')} 
                className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
                <Plus size={14} /> Add New Column
            </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2 w-full lg:w-auto">
          <button onClick={handleExport} className="bg-white border border-cream-200 text-text-main px-3 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button onClick={() => window.print()} className="bg-white border border-cream-200 text-text-main px-3 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button onClick={clearFilters} className="bg-white border border-cream-200 text-text-main px-3 py-1.5 rounded shadow-sm hover:text-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
            Clear filters
          </button>
          <button onClick={() => fetchFooterData()} className="bg-primary text-white p-2 rounded hover:bg-primary-hover shadow-md active:scale-90">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl border border-cream-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              {/* Labels Header */}
              <tr className="bg-primary text-white font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 text-left border-r border-white/10 w-[20%]">Name</th>
                <th className="p-4 text-left border-r border-white/10 w-[30%]">Title</th>
                <th className="p-4 text-left border-r border-white/10 w-[35%]">Subtitle</th>
                <th className="p-4 text-center w-[15%]">Actions</th>
              </tr>

              {/* Filter Inputs Header */}
              <tr className="bg-[#008DDA] border-b border-cream-200 no-print">
                <td className="p-2 border-r border-white/10">
                  <input name="name" value={filters.name} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Name" />
                </td>
                <td className="p-2 border-r border-white/10">
                  <input name="title" value={filters.title} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Title" />
                </td>
                <td className="p-2 border-r border-white/10">
                  <input name="subtitle" value={filters.subtitle} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Subtitle" />
                </td>
                <td className="p-2 text-center bg-[#007bbd]">
                   <button onClick={() => fetchFooterData()} className="text-white hover:rotate-180 transition-all duration-500 p-1">
                     <RotateCw size={18} />
                   </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-16 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                  </td>
                </tr>
              ) : footerColumns.length > 0 ? (
                footerColumns.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-primary/5 transition-colors text-[13px]">
                    <td className="p-4 border-r border-cream-50 font-medium whitespace-nowrap text-text-main">
                      {item.name}
                    </td>
                    <td className="p-4 border-r border-cream-50 font-semibold uppercase text-text-main">
                      {item.title || "-"}
                    </td>
                    <td className="p-4 border-r border-cream-50 text-text-muted">
                      {item.subtitle || "-"}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/edit-footer/${item.id || item._id}`)}
                          className="p-2 bg-cream-50 border border-cream-200 rounded-lg text-text-muted hover:text-primary hover:bg-white transition-all active:scale-90 shadow-sm"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item._id)}
                          className="p-2 bg-cream-50 border border-cream-200 rounded-lg text-text-muted hover:text-red-600 hover:bg-white transition-all active:scale-90 shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-text-muted italic font-montserrat">
                    No footer columns configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-4 bg-gray-50 border-t border-cream-200 flex flex-col sm:flex-row justify-between items-center gap-4 no-print font-montserrat">
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-cream-300 rounded-lg px-2 py-1 outline-none focus:border-primary bg-white text-xs text-primary font-bold shadow-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>

              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">
            Displaying {footerColumns.length} Configuration Columns
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 border border-cream-200 rounded-lg bg-white text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 shadow-sm"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-cream-200 rounded-lg bg-white text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 shadow-sm"><ChevronLeft size={16} /></button>
            
            <div className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-md mx-1">
              {currentPage}
            </div>

            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border border-cream-200 rounded-lg bg-white text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 shadow-sm"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 border border-cream-200 rounded-lg bg-white text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 shadow-sm"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>

      <style>{`
        .theme-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 14px; outline: none; transition: all 0.2s ease; background: white; color: #1a202c; }
        .theme-input:focus { border-color: #008DDA; box-shadow: 0 0 0 4px rgba(0, 141, 218, 0.1); }
      `}</style>
    </div>
  );
};

export default FooterList;