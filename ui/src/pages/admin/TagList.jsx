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

const TagsList = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 1. Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // 🟢 Filtering States
  const [searchTerm, setSearchTerm] = useState(""); // For Title
  const [idSearch, setIdSearch] = useState("");    // For Index/ID

  const fetchTags = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      const res = await axios.get(`${API_BASE_URL}/tags/list?${params.toString()}`);
      if (res.data.status) {
        if (isExport) return res.data.data;
        setTags(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load tags");
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [currentPage, itemsPerPage]);


// 🟢 3. Excel Export logic
const handleExport = async () => {
  const toastId = toast.loading("Preparing Excel file...");
  try {
    const allData = await fetchTags(true);
    if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

    const dataToExport = allData.map((tag, index) => ({
      "Sr No": index + 1,
      "Tag Title": tag.title || "-",
      "Created At": new Date(tag.createdAt).toLocaleDateString('en-GB')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tags");
    XLSX.writeFile(workbook, `Tags_Report_${Date.now()}.xlsx`);
    toast.success("Excel exported successfully! 📊", { id: toastId });
  } catch (error) { toast.error("Export failed", { id: toastId }); }
};

const handlePrint = () => window.print();


  // 🟢 Filtering Logic (Performance Optimized)
  const filteredTags = useMemo(() => {
    return tags.filter((tag, index) => {
      const displayId = (index + 1).toString();
      const matchesId = displayId.includes(idSearch);
      const matchesTitle = (tag.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesId && matchesTitle;
    });
  }, [tags, searchTerm, idSearch]);

  const clearFilters = () => {
    setSearchTerm("");
    setIdSearch("");
    fetchTags();
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this tag?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/tags/delete/${id}`); 
      if (res.data.status) {
        toast.success("Tag deleted successfully!", { id: toastId });
        fetchTags(); 
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-tags')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Tags
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
            <button onClick={fetchTags} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
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
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* 🟢 Filter Row with value binding */}
              <tr className="bg-primary border-b border-cream-200">
                <td className="p-2 border-r border-white/20">
                  <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer shrink-0" />
                    <input 
                      type="text" 
                      value={idSearch}
                      onChange={(e) => setIdSearch(e.target.value)}
                      className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" 
                      placeholder="ID"
                    />
                  </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main font-montserrat" 
                    placeholder="Search Tag Title..." 
                  />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchTags} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-primary" /> Loading Tags...
                    </div>
                  </td>
                </tr>
              ) : filteredTags.length > 0 ? (
                filteredTags.map((tag, index) => (
                  <tr key={tag._id} className="hover:bg-primary-50 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50">
                       <div className="flex items-center gap-5 px-1">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                          <span className="text-text-muted text-xs font-bold w-full text-center">{index + 1}</span>
                       </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{tag.title}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-tags/${tag._id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(tag._id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-text-muted italic font-montserrat">No tags found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm no-print">
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-cream-200 rounded px-2 py-1 outline-none focus:border-primary bg-cream-50 text-xs text-primary font-bold cursor-pointer">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>

            </select>
            <span className="text-text-muted uppercase text-[10px] tracking-wide">entries</span>
          </div>
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Displaying {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronLeft size={16} /></button>
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md mx-1">{currentPage}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsList;