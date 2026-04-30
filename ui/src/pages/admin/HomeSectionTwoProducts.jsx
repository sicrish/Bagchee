import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Settings, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {useConfirm} from '../../context/ConfirmContext.jsx'

const HomeSectionTwoProducts = () => {
  const navigate = useNavigate();
    const {confirm}=useConfirm()
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    productId: "",
    title: "",
    active: "",
    order: ""
  });

  const fetchSectionProducts = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      
      // 🟢 API URL for Section 2
      const res = await axios.get(`${API_URL}/home-sections/products/section-two/list`); 
      
      if (res.data.status) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load Section 2 products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectionProducts();
  }, []);

  // 🟢 Enhanced Filtering Logic (Handles Populated Product IDs)
  const filteredData = useMemo(() => {
    return products.filter((item) => {
      // Safe check: agar productId object hai to ._id lo, nahi to direct string
      const pId = typeof item.productId === 'object' ? item.productId?._id : item.productId;

      return (
        (pId || "").toString().includes(filters.productId) &&
        (item.title || "").toLowerCase().includes(filters.title.toLowerCase()) &&
        (item.active || "").toLowerCase().includes(filters.active.toLowerCase()) &&
        (item.order || "").toString().includes(filters.order)
      );
    });
  }, [products, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDelete = async (id) => {
        if (!(await confirm())) return;
    const toastId = toast.loading("Removing...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // 🟢 Fix: Correct Delete URL (Removed copy-paste error 'section-one')
      const res = await axios.delete(`${API_URL}/home-sections/products/delete/${id}`);
      
      if (res.data.status) {
        toast.success("Removed successfully!", { id: toastId });
        fetchSectionProducts(); 
      }
    } catch (error) {
      toast.error("Operation failed", { id: toastId });
    }
  };

  const filterInputClass = "w-full rounded p-1 text-[11px] outline-none text-text-main border border-transparent focus:border-white/50 bg-white/20 placeholder-white/50 text-white font-body";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 font-montserrat">
        <button 
          onClick={() => navigate('/admin/add-home-section-2-product')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Home section 2 products
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button 
            onClick={() => {setFilters({productId: "", title: "", active: "", order: ""}); fetchSectionProducts();}}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary flex items-center gap-2 text-xs font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchSectionProducts} className="bg-primary text-white p-2 rounded hover:brightness-110 transition-all shadow-sm">
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
              {/* Header Titles */}
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">
                   <input type="checkbox" className="accent-white h-4 w-4 rounded cursor-pointer" />
                </th>
                <th className="p-3 text-left border-r border-white/20">Product id</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20">Active</th>
                <th className="p-3 text-left border-r border-white/20">Order</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* Filter Row */}
              <tr className="bg-primary border-b border-cream-200">
                <td className="p-2 border-r border-white/20 text-center">
                   <div className="w-full flex justify-center">
                     <input type="checkbox" className="accent-primary bg-white h-4 w-4 shrink-0" />
                   </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="productId" value={filters.productId} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="ID" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="title" value={filters.title} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Search Title..." />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="active" value={filters.active} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Yes/No" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="order" value={filters.order} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Sort" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchSectionProducts} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50 font-body">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center font-bold">
                    <Loader2 className="animate-spin text-primary inline mr-2" /> Loading Products...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-primary/5 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50 text-center">
                       <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                    </td>
                    
                    {/* 🟢 Fix: Handle Product ID safely (Object vs String) */}
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">
                        {typeof item.productId === 'object' ? item.productId?._id : item.productId}
                    </td>

                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{item.title}</td>
                    <td className="p-3 border-r border-cream-50 font-bold text-text-muted">{item.active}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{item.order}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          // 🟢 Fix: Correct Edit Route
                          onClick={() => navigate(`/admin/edit-home-section-1/${item.id || item._id}`)} 
                          className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary transition-all shadow-sm"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id || item._id)}
                          className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 transition-all shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-text-muted italic">No products found in Section 2.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat">
          <div className="flex items-center gap-2 text-sm text-text-muted font-bold">
            <span>Show</span>
            <select className="border border-cream-200 rounded p-1 outline-none text-xs bg-white text-text-main">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
            Displaying 1 to {filteredData.length} of {products.length} items
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronsLeft size={16}/></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronLeft size={16}/></button>
            <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden">
              <input type="text" value="1" readOnly className="w-8 text-center text-xs border-none p-1.5 font-bold bg-cream-50 text-text-main" />
            </div>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronRight size={16}/></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronsRight size={16}/></button>
            <div className="ml-2">
              <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:bg-cream-50 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSectionTwoProducts;