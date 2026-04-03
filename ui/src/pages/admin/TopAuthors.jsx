import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Settings, Loader2, BookOpen, Quote as QuoteIcon, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel';

const TopAuthors = () => {
  const navigate = useNavigate();
  
  // --- Data States ---
  const [authors, setAuthors] = useState([]); 
  const [totalRecords, setTotalRecords] = useState(0); 
  const [loading, setLoading] = useState(true);
  
  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // --- Filter States ---
  const [filters, setFilters] = useState({
    authorName: "",
    active: "",
  });

  // 🟢 1. FETCH LOGIC (With Populate Support)
  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const params = {
        authorName: filters.authorName,
        active: filters.active,
        page: currentPage,
        limit: itemsPerPage,
         
      };

      const res = await axios.get(`${API_URL}/top-authors/list`, { params }); 
      
      if (res.data.status) {
        setAuthors(res.data.data); 
        setTotalRecords(res.data.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error.response?.data || error.message);
      // toast.error("Failed to load featured authors");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters.authorName, filters.active]); 

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  // 🟢 2. Handlers
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuthors();
  };

  const clearFilters = () => {
    setFilters({ authorName: "", active: "" });
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {

    try {
      const res = await axios.delete(`${process.env.REACT_APP_API_URL}/top-authors/delete/${id}`); 
      if (res.data.status) {
        toast.success("Featured author removed!");
        fetchAuthors(); 
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // 🟢 3. Export to Excel (Updated with Quotes and Roles)
  const handleExport = async () => {
    const exportData = authors.map((item) => ({
      "Order": item.order,
      "Author": `${item.authorData?.firstName || ''} ${item.authorData?.lastName || ''}`.trim(),
      "Book": item.bookId?.title || "N/A",
      "Award/Role": item.role || "N/A",
      "Quote": item.quote || "N/A", // 🟢 Backend sync
      "Status": item.active ? "Active" : "Inactive"
    }));
    await exportToExcel(exportData, "Top Authors", "Top_Authors_Complete_Report");
  };

  const filterInputClass = "w-full rounded-[4px] px-2 py-1 text-[11px] outline-none text-gray-700 font-montserrat shadow-inner focus:ring-1 focus:ring-blue-300 transition-all bg-white/20 placeholder:text-white/60";

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-top-author')} 
          className="bg-primary text-white px-6 py-2 rounded shadow-md flex items-center gap-2 font-montserrat font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus size={16} /> Add Featured Author
        </button>

        <div className="flex gap-2">
          <button onClick={handleExport} className="bg-white border border-gray-300 text-gray-600 px-4 py-1.5 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 text-xs font-bold font-montserrat">
            <Download size={14} className="text-blue-500" /> Export
          </button>
          <button onClick={clearFilters} className="bg-white border border-gray-300 text-gray-400 px-4 py-1.5 rounded shadow-sm hover:text-red-500 flex items-center gap-2 text-xs font-bold font-montserrat">
            Reset
          </button>
          <button onClick={handleSearch} className="bg-primary text-white p-2 rounded hover:bg-primary-hover shadow-sm">
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold text-[11px] uppercase tracking-wider">
                <th className="p-4 text-center w-16 border-r border-white/10">Order</th>
                <th className="p-4 text-left border-r border-white/10 w-64">Author & Award</th> 
                <th className="p-4 text-left border-r border-white/10 w-64">Featured Book</th>
                <th className="p-4 text-left border-r border-white/10">Quote</th> {/* 🟢 New Column */}
                <th className="p-4 text-center w-24 border-r border-white/10">Status</th>
                <th className="p-4 text-center w-28">Actions</th>
              </tr>

              <tr className="bg-primary/95">
                <td className="p-2 border-r border-white/10"></td>
                <td className="p-2 border-r border-white/10">
                  <input name="authorName" value={filters.authorName} onChange={handleFilterChange} className={filterInputClass} placeholder="Search Author..." />
                </td>
                <td className="p-2 border-r border-white/10"></td>
                <td className="p-2 border-r border-white/10"></td> {/* Quote Filter empty for now */}
                <td className="p-2 border-r border-white/10">
                  <select name="active" value={filters.active} onChange={handleFilterChange} className={filterInputClass}>
                     <option value="">All</option>
                     <option value="true">Active</option>
                     <option value="false">InActive</option>
                  </select>
                </td>
                <td className="p-2 text-center text-white">
                  <RotateCw size={14} className="mx-auto cursor-pointer" onClick={fetchAuthors}/>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 font-body">
              {loading ? (
                <tr><td colSpan="6" className="p-16 text-center"><Loader2 className="animate-spin inline text-primary mr-2" /> Syncing with backend...</td></tr>
              ) : authors.length > 0 ? (
                authors.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="p-4 text-center border-r border-gray-50 font-black text-primary text-base">
                       {item.order}
                    </td>
                    
                    <td className="p-4 border-r border-gray-50">
                      <div className="flex items-center gap-3">
                        <img
                          src={`${process.env.REACT_APP_API_URL}${item.authorData?.picture}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-cream-200 p-0.5"
                          alt=""
                        />
                        <div>
                          <p className="font-bold text-text-main text-sm">{item.authorData?.firstName} {item.authorData?.lastName}</p>
                          <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-tight">
                            <Award size={10} /> {item.role || 'No Award Linked'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 border-r border-gray-50">
                       <div className="flex items-center gap-2">
                          <img src={`${process.env.REACT_APP_API_URL}${item.bookData?.defaultImage}`} className="w-8 h-12 object-cover rounded shadow-sm border border-cream-200" alt="" />
                          <span className="text-xs font-medium text-gray-600 line-clamp-2">{item.bookData?.title || "No Book Linked"}</span>
                       </div>
                    </td>

                    {/* 🟢 QUOTE COLUMN */}
                    <td className="p-4 border-r border-gray-50 text-xs italic text-gray-500 max-w-xs">
                       <div className="flex gap-2">
                          <QuoteIcon size={12} className="text-cream-200 shrink-0" />
                          <p className="line-clamp-3">{item.quote || 'No quote added yet.'}</p>
                       </div>
                    </td>

                    <td className="p-4 border-r border-gray-50 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {item.active ? "Active" : "InActive"}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => navigate(`/admin/edit-top-author/${item.id}`)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="p-20 text-center text-gray-400 italic">Featured author list empty. Add from backend.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopAuthors;