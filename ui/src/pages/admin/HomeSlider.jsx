import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2, Monitor, Smartphone // 🟢 Added Icons
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig'; 
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';

const HomeSlider = () => {
  const navigate = useNavigate();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false); 

  // Filters State
  const [filters, setFilters] = useState({
    link: '',
    active: '',
    order: ''
  });

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0
  });

  // --- 1. FETCH DATA ---
  const fetchSliders = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        link: filters.link,
        isActive: filters.active,
        order: filters.order
      };

      const res = await axios.get(`${API_URL}/home-slider/list`, { params });
      
      if (res.data.status) {
        // 🟢 CONSOLE 1: Check actual data coming from API
        setSliders(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
    // eslint-disable-next-line
  }, [pagination.page, pagination.limit]); 

  // --- 2. DELETE HANDLER ---
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this slider?")) return;

    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/home-slider/delete/${id}`);
      if (res.data.status) {
        toast.success("Deleted successfully!", { id: toastId });
        fetchSliders(); 
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ link: '', active: '', order: '' });
    setTimeout(() => fetchSliders(), 100); 
  };

  // --- 3. EXPORT DATA ---
  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading("Exporting all data...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/home-slider/list`, { 
        params: { ...filters, limit: 'all' } 
      });

      if (res.data.status && res.data.data.length > 0) {
        const exportData = res.data.data.map(item => ({
          "ID": item._id,
          "Desktop Image": item.desktopImage || 'N/A', // 🟢 Updated Key
          "Mobile Image": item.mobileImage || 'N/A',   // 🟢 Updated Key
          "Link": item.link || 'N/A',
          "Active": item.isActive ? "Yes" : "No",
          "Order": item.order || 0,
          "Created At": new Date(item.createdAt).toLocaleDateString()
        }));

        await exportToExcel(exportData, "Home Sliders", "home_sliders");
        toast.success("Export complete!", { id: toastId });
      } else {
        toast.error("No data to export", { id: toastId });
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Export failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // --- 4. PRINT ---
  const handlePrint = () => {
    const printContent = document.getElementById("printable-table-area");
    if (!printContent) return;

    const originalStyle = printContent.style.overflow;
    printContent.style.overflow = "visible"; 

    const originalBody = document.body.innerHTML;
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1 style="text-align:center;">Home Sliders Report</h1>
        ${printContent.innerHTML}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalBody;
    printContent.style.overflow = originalStyle;
    window.location.reload(); 
  };

 // 🟢 CONSOLE 2 & Helper: Construct and Debug Image URLs
 const getImageUrl = (imgName) => {
    if (!imgName) return "https://placehold.co/100x40?text=No+Img";
    if (imgName.startsWith("http")) return imgName;
    
    const API_BASE = process.env.REACT_APP_API_URL;
    const fullUrl = `${API_BASE}/${imgName.replace(/^\//, '')}`;
    
    // Sirf development me url debug karne ke liye:
    // console.log("🖼️ Final Image URL:", fullUrl); 
    
    return fullUrl;
  };
  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-home-slider')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Slider
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={handleExport} 
            disabled={exporting}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="text-accent" />}
            {exporting ? "Exporting..." : "Export"}
          </button>

          <button onClick={handlePrint} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>

          <button onClick={clearFilters} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
            Clear filters
          </button>
          
          <div className="relative flex items-center">
            <button onClick={fetchSliders} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm" id="printable-table-area">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider">
                <th className="p-3 text-center w-16 border-r border-white/20 hide-on-print">
                    <input type="checkbox" className="h-4 w-4 rounded accent-white cursor-pointer" />
                </th>
                <th className="p-3 text-left border-r border-white/20 w-16">#</th>
                
                {/* 🟢 Updated Header with Icons */}
                <th className="p-3 text-left border-r border-white/20">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><Monitor size={14}/> Desktop</span>
                        <span className="opacity-50">/</span>
                        <span className="flex items-center gap-1"><Smartphone size={14}/> Mobile</span>
                    </div>
                </th> 
                
                <th className="p-3 text-left border-r border-white/20">Link</th>
                <th className="p-3 text-left border-r border-white/20 w-32">Active</th>
                <th className="p-3 text-left border-r border-white/20 w-24">Order</th>
                <th className="p-3 text-center w-32 hide-on-print">Actions</th>
              </tr>

              {/* Filter Row */}
              <tr className="bg-primary border-b border-cream-200 hide-on-print">
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"></td> 
                <td className="p-2 border-r border-white/20">
                    <input type="text" name="link" value={filters.link} onChange={handleFilterChange} className="w-full rounded p-1 text-xs outline-none bg-white/90 text-text-main" placeholder="Filter Link" />
                </td>
                <td className="p-2 border-r border-white/20">
                    <input type="text" name="active" value={filters.active} onChange={handleFilterChange} className="w-full rounded p-1 text-xs outline-none bg-white/90 text-text-main" placeholder="Yes/No" />
                </td>
                <td className="p-2 border-r border-white/20">
                    <input type="text" name="order" value={filters.order} onChange={handleFilterChange} className="w-full rounded p-1 text-xs outline-none bg-white/90 text-text-main" placeholder="Order" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchSliders} className="text-white hover:rotate-180 transition-transform duration-500"><RotateCw size={16} /></button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin text-primary" /> Loading Data...</div>
                  </td>
                </tr>
              ) : sliders.length > 0 ? (
                sliders.map((item, index) => (
   
   <tr key={item._id} className="hover:bg-primary-50 transition-colors">
                    <td className="p-3 border-r border-cream-50 text-center hide-on-print"><input type="checkbox" className="h-4 w-4 accent-primary" /></td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{index + 1}</td>

                    {/* 🟢 IMAGES COLUMN */}
                    <td className="p-2 border-r border-cream-50 text-text-main">
                        <div className="flex gap-4 items-center">
                           {/* Desktop */}
                           <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden shadow-sm relative group cursor-pointer">
                                <img src={getImageUrl(item.desktopImage)} alt="Desktop" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/100x40?text=No+Img"; }} />
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-[9px] font-bold">Desktop</div>
                           </div>

                           {/* Mobile */}
                           <div className="w-8 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden shadow-sm relative group cursor-pointer">
                                <img src={getImageUrl(item.mobileImage)} alt="Mobile" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/40x40?text=No+Img"; }} />
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-[8px] font-bold">Mob</div>
                           </div>
                        </div>
                    </td>

                    <td className="p-3 border-r border-cream-50 text-text-main font-medium truncate max-w-[200px]">{item.link || '-'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.isActive ? "YES" : "NO"}</span>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{item.order || 0}</td>
                    
                    <td className="p-3 text-center hide-on-print">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-home-slider/${item._id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item._id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="p-10 text-center text-text-muted italic">No sliders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted font-bold">
            <span>Show</span>
            <select className="border border-cream-200 rounded p-1 text-xs" value={pagination.limit} onChange={(e) => setPagination({...pagination, limit: Number(e.target.value), page: 1})}>
              <option value="25">25</option><option value="50">50</option><option value="100">100</option>
            </select>
            <span>entries</span>
          </div>
          <div className="text-[11px] font-bold text-text-muted uppercase">Displaying {sliders.length} items</div>
          <div className="flex items-center gap-1">
            <button disabled={pagination.page === 1} onClick={() => setPagination({...pagination, page: 1})} className="p-1.5 border rounded hover:text-primary disabled:opacity-50"><ChevronsLeft size={16}/></button>
            <button disabled={pagination.page === 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})} className="p-1.5 border rounded hover:text-primary disabled:opacity-50"><ChevronLeft size={16}/></button>
            <div className="flex items-center mx-1 border rounded overflow-hidden"><input type="text" value={pagination.page} readOnly className="w-8 text-center text-xs border-none p-1.5 font-bold bg-cream-50" /></div>
            <button onClick={() => setPagination({...pagination, page: pagination.page + 1})} className="p-1.5 border rounded hover:text-primary"><ChevronRight size={16}/></button>
            <button className="p-1.5 border rounded hover:text-primary"><ChevronsRight size={16}/></button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
            .hide-on-print { display: none !important; }
            .bg-cream-50 { background-color: white !important; }
            body { background-color: white !important; }
            #printable-table-area { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default HomeSlider;