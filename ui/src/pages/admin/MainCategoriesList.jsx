import React, { useState, useEffect,useMemo } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  Settings, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

// 🔄 Change: Component Name Updated to avoid conflict
const MainCategoriesList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for filters matching the image columns
  const [filters, setFilters] = useState({
    title: "",
    link: "",
    active: "",
    order: "",
    image: ""
  });
  const API_URL = process.env.REACT_APP_API_URL;
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Backend route same rakha hai, agar change karna ho to bataiyega
      const res = await axios.get(`${API_URL}/main-categories/list`);
      if (res.data.status) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load main categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

// 🟢 2. Crash-Proof Helper
const safeString = (value) => (value || "").toString().toLowerCase();

const filteredData = useMemo(() => {
  if (!categories) return [];
  return categories.filter((item) => {
    return (
      safeString(item.title).includes(safeString(filters.title)) &&
      safeString(item.link).includes(safeString(filters.link)) &&
      safeString(item.active).includes(safeString(filters.active)) &&
      safeString(item.order).includes(safeString(filters.order)) &&
      safeString(item.image).includes(safeString(filters.image))
    );
  });
}, [categories, filters]);

  const handleDelete = async (id) => {


    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/main-categories/delete/${id}`);
      if (res.data.status) {
        toast.success("Category deleted successfully!", { id: toastId });
        fetchCategories();
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // 🟢 Image URL Helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/\\/g, '/'); // Fix Windows paths
    if (cleanPath.startsWith('http')) return cleanPath; // External link
    // Ensure path starts with /
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${API_URL}${finalPath}`;
  };

  const filterInputClass = "w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main placeholder-gray-400";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button
          // 🔄 Updated Navigation Path
          onClick={() => navigate('/admin/add-main-category')}
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Main Category
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
            onClick={() => {
              setFilters({ title: "", link: "", active: "", order: "" });
              fetchCategories();
            }}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchCategories} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
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
              {/* Header Row */}
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider">
                <th className="p-3 text-center w-12 border-r border-white/20">
                  <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer" />
                </th>
                <th className="p-3 text-left border-r border-white/20">Image</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20">Link</th>
                <th className="p-3 text-left border-r border-white/20">Active</th>
                <th className="p-3 text-left border-r border-white/20">Order</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* Filter Row */}
              <tr className="bg-primary border-b border-cream-200">
                <td className="p-2 border-r border-white/20 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input
                    name="image"
                    value={filters.image}
                    onChange={handleFilterChange}
                    type="text"
                    className={filterInputClass}
                    placeholder="Search img..."
                  />
                </td>

               
                <td className="p-2 border-r border-white/20">
                  <input name="title" value={filters.title} onChange={handleFilterChange} type="text" className={filterInputClass} />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="link" value={filters.link} onChange={handleFilterChange} type="text" className={filterInputClass} />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="active" value={filters.active} onChange={handleFilterChange} type="text" className={filterInputClass} />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="order" value={filters.order} onChange={handleFilterChange} type="text" className={filterInputClass} />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchCategories} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50 font-body">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-text-muted font-bold"><div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin text-primary" size={20} /> Loading...</div></td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-primary/5 transition-colors text-[13px]">
                    <td className="p-3 border-r border-cream-50 text-center"><input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer" /></td>
                    
                    <td className="p-3 border-r border-cream-50">
                      <div className="w-16 h-10 rounded overflow-hidden border border-cream-200 bg-gray-50 flex items-center justify-center relative group">
                        {item.image ? (
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            onError={(e) => {
                              console.error("Image Load Error:", e.target.src);
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/150?text=Err";
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-gray-400">No Img</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{item.title}</td>
                    <td className="p-3 border-r border-cream-50 text-text-muted font-mono text-xs">{item.link}</td>
                    <td className="p-3 border-r border-cream-50 text-xs font-bold">{item.active === 'Yes' || item.active === true ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Yes</span> : <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">No</span>}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{item.order}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-main-category/${item._id}`)} className="p-1.5 bg-white border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item._id)} className="p-1.5 bg-white border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="p-10 text-center text-text-muted italic">No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted font-montserrat font-bold">
            <span>Show</span>
            <select className="border border-cream-200 rounded p-1 outline-none focus:border-primary text-xs bg-white text-text-main">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter font-montserrat">
            Displaying {categories.length} items
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronLeft size={16} /></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronLeft size={16} /></button>
            <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden">
              <input type="text" value="1" readOnly className="w-8 text-center text-xs border-none p-1.5 focus:ring-0 text-text-main font-bold bg-cream-50" />
            </div>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronRight size={16} /></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronRight size={16} /></button>

            <div className="ml-2">
              <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:bg-cream-50">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainCategoriesList;