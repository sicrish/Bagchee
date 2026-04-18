import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';

const ShippingOptionsList = () => {
  const navigate = useNavigate();
  const [shippingOptions, setShippingOptions] = useState([]);
  const [loading, setLoading] = useState(true);


  // 🟢 1. Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  
  // 🟢 1. Filtering State
  const [filters, setFilters] = useState({
    id: "",
    title: "",
    usd: "",
    eur: "",
    status: "",
    order: ""
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const fetchShippingOptions = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      const res = await axios.get(`${API_BASE_URL}/shipping-options/list?${params.toString()}`); 
      if (res.data.status) {
        if (isExport) return res.data.data;
        setShippingOptions(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      toast.error("Failed to load options");
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingOptions();
  }, [currentPage, itemsPerPage]);

  // 🟢 3. Excel Export Logic
  const handleExport = async () => {
    const toastId = toast.loading("Preparing Excel file...");
    try {
      const allData = await fetchShippingOptions(true);
      if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

      const dataToExport = allData.map((item, i) => ({
        "Sr No": i + 1,
        "Option Title": item.title,
        "USD": item.priceUsd,
        "EUR": item.priceEur,
        "Active": item.is_active ? "Yes" : "No",
        "Order": item.order || 0
      }));

      await exportToExcel(dataToExport, "ShippingOptions", "Shipping_Options");
      toast.success("Excel exported successfully! 📊", { id: toastId });
    } catch (error) { toast.error("Export failed", { id: toastId }); }
  };

  const handlePrint = () => window.print();

  // 🟢 2. Filtering Logic (Memoized for performance)
  const filteredOptions = useMemo(() => {
    return shippingOptions.filter((item, index) => {
      const displayId = (index + 1).toString();
      const statusText = item.is_active ? "yes" : "no";

      return (
        displayId.includes(filters.id) &&
        (item.title || "").toLowerCase().includes(filters.title.toLowerCase()) &&
        (item.priceUsd || "0").toString().includes(filters.usd) &&
        (item.priceEur || "0").toString().includes(filters.eur) &&
        statusText.includes(filters.status.toLowerCase()) &&
        (item.order !== undefined ? item.order : "0").toString().includes(filters.order)
      );
    });
  }, [shippingOptions, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", title: "", usd: "", eur: "", status: "", order: "" });
    fetchShippingOptions();
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this shipping option?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/shipping-options/delete/${id}`); 
      if (res.data.status) {
        toast.success("Shipping option deleted successfully!", { id: toastId });
        fetchShippingOptions(); 
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const filterInputClass = "w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main font-montserrat border border-transparent focus:border-primary transition-all";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-shipping-options')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Shipping options
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
            <button onClick={fetchShippingOptions} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20 w-28">Price usd</th>
                <th className="p-3 text-left border-r border-white/20 w-28">Price eur</th>
                <th className="p-3 text-left border-r border-white/20 w-24">Active</th>
                <th className="p-3 text-left border-r border-white/20 w-20">Order</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* 🟢 Filter Row with dynamic handlers */}
              <tr className="bg-primary border-b border-cream-200">
                <td className="p-2 border-r border-white/20">
                  <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer shrink-0" />
                    <input name="id" value={filters.id} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="ID" />
                  </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="title" value={filters.title} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Title" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="usd" value={filters.usd} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter USD" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="eur" value={filters.eur} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter EUR" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="status" value={filters.status} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Status" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="order" value={filters.order} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Order" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchShippingOptions} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-primary" /> Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((item, index) => (
                  <tr key={item.id || item._id} className="hover:bg-primary-50 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50">
                        <div className="flex items-center gap-5 px-1">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                          <span className="text-text-muted text-xs font-bold w-full text-center">{index + 1}</span>
                        </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{item.title}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{item.priceUsd || '0'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{item.priceEur || '0'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">
                        <span className={item.is_active ? 'text-green-600 font-bold' : 'text-text-muted'}>
                            {item.is_active ? 'Yes' : 'No'}
                        </span>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{item.order !== undefined ? item.order : '0'}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-shipping-options/${item.id || item._id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id || item._id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-text-muted italic font-montserrat">No options found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm no-print">
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
              className="border border-cream-200 rounded px-2 py-1 focus:border-primary bg-cream-50 text-xs text-primary font-bold cursor-pointer"
            >
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
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronLeft size={16} /></button>
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">{currentPage}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingOptionsList;