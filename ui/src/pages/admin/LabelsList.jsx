import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const LabelsList = () => {
  const navigate = useNavigate();
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    id: "",
    title: "",
    status: "",
    order: ""
  });

  const fetchLabels = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/labels/list`); 
      if (res.data.status) {
        setLabels(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load labels list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  // 🟢 2. Filtering Logic (Memoized)
  const filteredLabels = useMemo(() => {
    return labels.filter((item, index) => {
      const displayId = (index + 1).toString();
      return (
        displayId.includes(filters.id) &&
        (item.title || "").toLowerCase().includes(filters.title.toLowerCase()) &&
        (item.status || "active").toLowerCase().includes(filters.status.toLowerCase()) &&
        (item.order || "0").toString().includes(filters.order)
      );
    });
  }, [labels, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", title: "", status: "", order: "" });
    fetchLabels();
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/labels/delete/${id}`); 
      if (res.data.status) {
        toast.success("Label deleted successfully!", { id: toastId });
        fetchLabels(); 
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
          onClick={() => navigate('/admin/add-labels')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Labels
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button 
            onClick={clearFilters}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchLabels} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20 w-32">Active</th>
                <th className="p-3 text-left border-r border-white/20 w-32">Order</th>
                <th className="p-3 text-center w-32">Actions</th>
              </tr>

              {/* 🟢 Filter Row with Bindings */}
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
                  <input name="status" value={filters.status} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="active/..." />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="order" value={filters.order} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Order" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchLabels} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-primary" /> Loading Labels...
                    </div>
                  </td>
                </tr>
              ) : filteredLabels.length > 0 ? (
                filteredLabels.map((item, index) => (
                  <tr key={item._id} className="hover:bg-primary-50 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50">
                        <div className="flex items-center gap-5 px-1">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                          <span className="text-text-muted text-[10px] font-bold w-full text-center">{index + 1}</span>
                        </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{item.title}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold text-center">{item.order || 0}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-labels/${item._id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item._id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-text-muted italic font-montserrat">No matching labels found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
            Displaying {filteredLabels.length} of {labels.length} items
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronLeft size={16}/></button>
            <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden">
              <input type="text" value="1" readOnly className="w-8 text-center text-xs border-none p-1.5 font-bold bg-cream-50 text-text-main" />
            </div>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelsList;