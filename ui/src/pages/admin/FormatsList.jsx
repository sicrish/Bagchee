import React, { useState, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query added

const FormatsList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🟢 1. Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // 🟢 2. Filtering States
  const [filters, setFilters] = useState({
    id: "",
    title: "",
    status: "",
    category: "",
    order: ""
  });

  // 🚀 OPTIMIZATION 1: Fetch Data using React Query
  const fetchFormats = async ({ queryKey }) => {
    const [_key, page, limit] = queryKey;
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);

    const API_URL = process.env.REACT_APP_API_URL;
    const res = await axios.get(`${API_URL}/formats/list?${params.toString()}`); 
    if (!res.data.status) throw new Error("Failed to load formats");
    return res.data;
  };

  const { data: queryData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['formatsList', currentPage, itemsPerPage],
    queryFn: fetchFormats,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });

  // Extract Data from Query
  const formats = queryData?.data || [];
  const totalPages = queryData?.totalPages || 1;
  const totalItems = queryData?.total || 0;

  // 🚀 OPTIMIZATION 2: Delete Mutation
  const deleteFormatMutation = useMutation({
    mutationFn: async (id) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/formats/delete/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success("Format deleted successfully!");
        // Table ko instantly refresh karega background me
        queryClient.invalidateQueries({ queryKey: ['formatsList'] }); 
      }
    },
    onError: () => {
      toast.error("Delete failed");
    }
  });

  // 🟢 3. Excel Export logic (Unchanged functionally, separated fetching)
  const handleExport = async () => {
    const toastId = toast.loading("Preparing Excel file...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/formats/list?page=1&limit=100000`); 
      const allData = res.data.data;

      if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

      const dataToExport = allData.map((f, i) => ({
        "Sr No": i + 1,
        "Format Title": f.title,
        "Status": f.active || "inactive",
        "Category": f.category_name,
        "Display Order": f.order || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Formats");
      XLSX.writeFile(workbook, `Formats_Report_${Date.now()}.xlsx`);
      toast.success("Excel downloaded! 📊", { id: toastId });
    } catch (error) { 
      toast.error("Export failed", { id: toastId }); 
    }
  };

  const handlePrint = () => window.print();

  // 🟢 4. Filtering Logic (Performance Optimized)
  const filteredFormats = useMemo(() => {
    return formats.filter((format, index) => {
      // Calculate display index correctly based on pagination
      const displayId = ((currentPage - 1) * itemsPerPage + index + 1).toString();
      
      const matchesId = displayId.includes(filters.id);
      const matchesTitle = (format.title || "").toLowerCase().includes(filters.title.toLowerCase());
      const matchesStatus = (format.active || "active").toLowerCase().includes(filters.status.toLowerCase());
      const matchesCategory = (format.category_name || "N/A").toLowerCase().includes(filters.category.toLowerCase());
      const matchesOrder = (format.order || "0").toString().includes(filters.order);

      return matchesId && matchesTitle && matchesStatus && matchesCategory && matchesOrder;
    });
  }, [formats, filters, currentPage, itemsPerPage]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", title: "", status: "", category: "", order: "" });
    setCurrentPage(1);
    refetch(); // Force a fresh background fetch
  };

  const handleDelete = (id) => {
    if(!window.confirm("Are you sure you want to delete this format?")) return;
    deleteFormatMutation.mutate(id);
  };

  const filterInputClass = "w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main font-montserrat border border-transparent focus:border-primary transition-all";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-formats')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Formats
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={handleExport}  className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
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
            <button onClick={() => refetch()} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm relative">
        
        {/* Top subtle progress bar while background fetching */}
        {isFetching && !isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-1/3"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20">Active</th>
                <th className="p-3 text-left border-r border-white/20">Category</th>
                <th className="p-3 text-left border-r border-white/20 w-32">Order</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* 🟢 Filter Row with dynamic handlers */}
              <tr className="bg-primary border-b border-cream-200 align-top">
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
                  <input name="status" value={filters.status} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Status" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="category" value={filters.category} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Category" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="order" value={filters.order} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Order" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => refetch()} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-primary" /> Loading Formats...
                    </div>
                  </td>
                </tr>
              ) : filteredFormats.length > 0 ? (
                filteredFormats.map((format, index) => (
                  <tr key={format.id} className="hover:bg-primary-50 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50">
                        <div className="flex items-center gap-5 px-1">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                          <span className="text-text-muted text-[10px] font-bold w-full text-center">
                             {(currentPage - 1) * itemsPerPage + index + 1}
                          </span>
                        </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{format.title}</td>
                    <td className="p-3 border-r border-cream-50">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${format.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {format.active ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold ">{format.categoryId || 'N/A'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold text-center">{format.ord || '0'}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-formats/${format.id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95">
                           <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(format.id)} disabled={deleteFormatMutation.isPending} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95 disabled:opacity-50">
                           <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-text-muted italic font-montserrat">No formats found matching your filters.</td>
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
              className="border border-cream-200 rounded px-2 py-1 focus:border-primary bg-cream-50 text-xs text-primary font-bold outline-none"
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
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded hover:text-primary disabled:opacity-30 active:scale-90"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded hover:text-primary disabled:opacity-30 active:scale-90"><ChevronLeft size={16} /></button>
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">{currentPage}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded hover:text-primary disabled:opacity-30 active:scale-90"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded hover:text-primary disabled:opacity-30 active:scale-90"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormatsList;