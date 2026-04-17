import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig'; 
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';

const HomeBestSeller = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false); 

  // Filters State
  const [filters, setFilters] = useState({
    productId: '',
    title: '',
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
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        productId: filters.productId,
        title: filters.title,
        isActive: filters.active,
        order: filters.order
      };

      const res = await axios.get(`${API_URL}/home-best-seller/list`, { params });
      
      if (res.data.status) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [pagination.page, pagination.limit]); 

  // --- 2. DELETE HANDLER ---
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this item?")) return;

    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/home-best-seller/delete/${id}`);
      if (res.data.status) {
        toast.success("Deleted successfully!", { id: toastId });
        fetchProducts(); 
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ productId: '', title: '', active: '', order: '' });
    setTimeout(() => fetchProducts(), 100); 
  };

  // --- 3. EXPORT DATA ---
  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading("Exporting all data...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/home-best-seller/list`, { 
        params: { ...filters, limit: 'all' } 
      });

      if (res.data.status && res.data.data.length > 0) {
        const exportData = res.data.data.map(item => ({
          "Product ID": item.product?.bagchee_id || item.productId || 'N/A',
          "Title": item.product?.title || item.title || 'N/A',
          "Active": item.isActive ? "Yes" : "No",
          "Order": item.order || 0,
          "Created At": new Date(item.createdAt).toLocaleDateString()
        }));

        await exportToExcel(exportData, "Best Sellers", "home_best_sellers");
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

  // --- 4. 🖨️ PRINT FUNCTIONALITY (Updated) ---
  const handlePrint = () => {
    const printContent = document.getElementById("printable-table-area");
    if (!printContent) return;

    // 1. Temporary overflow fix for printing long tables
    const originalStyle = printContent.style.overflow;
    printContent.style.overflow = "visible"; 

    // 2. Save current page state
    const originalBody = document.body.innerHTML;
    
    // 3. Create a clean print layout
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1 style="text-align:center; margin-bottom: 10px; color: #333;">Home Best Sellers Report</h1>
        <p style="text-align:center; font-size: 12px; color: #666; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
            Generated on: ${new Date().toLocaleString()}
        </p>
        ${printContent.innerHTML}
      </div>
    `;

    // 4. Trigger Print
    window.print();

    // 5. Restore original page (Reload is safest for React event listeners)
    document.body.innerHTML = originalBody;
    printContent.style.overflow = originalStyle;
    window.location.reload(); 
  };

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-home-best-seller')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Best Seller
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

          {/* 🖨️ Print Button */}
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
            <button onClick={fetchProducts} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE (Print Area) --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm" id="printable-table-area">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider">
                {/* 🟢 Hide on Print */}
                <th className="p-3 text-center w-16 border-r border-white/20 hide-on-print">
                    <input type="checkbox" className="h-4 w-4 rounded accent-white cursor-pointer" />
                </th>
                <th className="p-3 text-left border-r border-white/20">Product Id</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20 w-24">Source</th>
                <th className="p-3 text-left border-r border-white/20 w-32">Active</th>
                <th className="p-3 text-left border-r border-white/20 w-24">Order</th>
                {/* 🟢 Hide on Print */}
                <th className="p-3 text-center w-32 hide-on-print">Actions</th>
              </tr>

              {/* Filter Row - 🟢 Hide on Print */}
              <tr className="bg-primary border-b border-cream-200 hide-on-print">
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20">
                    <input
                      type="text" name="productId" value={filters.productId} onChange={handleFilterChange}
                      className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" placeholder="Filter ID"
                    />
                </td>
                <td className="p-2 border-r border-white/20">
                    <input
                      type="text" name="title" value={filters.title} onChange={handleFilterChange}
                      className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" placeholder="Filter Title"
                    />
                </td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20">
                    <input
                      type="text" name="active" value={filters.active} onChange={handleFilterChange}
                      className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" placeholder="Yes/No"
                    />
                </td>
                <td className="p-2 border-r border-white/20">
                    <input
                      type="text" name="order" value={filters.order} onChange={handleFilterChange}
                      className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" placeholder="Order"
                    />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchProducts} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-primary" /> Loading Data...
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((item, index) => {
                  const prodId = item.product?.bagchee_id || item.productId || 'N/A';
                  const prodTitle = item.product?.title || item.title || 'N/A';
                  const isAuto = item.source === 'auto';

                  return (
                    <tr key={item.id || item._id} className="hover:bg-primary-50 transition-colors">
                      {/* 🟢 Hide on Print */}
                      <td className="p-3 border-r border-cream-50 text-center hide-on-print">
                          <input type="checkbox" disabled={isAuto} className="h-4 w-4 rounded accent-primary cursor-pointer disabled:opacity-40" />
                      </td>
                      <td className="p-3 border-r border-cream-50 text-text-main font-medium">
                          {prodId}
                      </td>
                      <td className="p-3 border-r border-cream-50 text-text-main font-medium">
                          {prodTitle}
                      </td>
                      <td className="p-3 border-r border-cream-50 text-text-main">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${isAuto ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                              {isAuto ? `AUTO (${item.soldCount || 0} sold)` : 'MANUAL'}
                          </span>
                      </td>
                      <td className="p-3 border-r border-cream-50 text-text-main">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {item.isActive ? "YES" : "NO"}
                          </span>
                      </td>
                      <td className="p-3 border-r border-cream-50 text-text-main">
                          {item.order || 0}
                      </td>
                      {/* 🟢 Hide on Print */}
                      <td className="p-3 text-center hide-on-print">
                        {isAuto ? (
                          <span className="text-[10px] text-text-muted italic">Auto — not editable</span>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/edit-home-best-seller/${item.id || item._id}`)}
                              className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id || item._id)}
                              className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-text-muted italic">No Best Seller products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted font-montserrat font-bold">
            <span>Show</span>
            <select 
                className="border border-cream-200 rounded p-1 outline-none focus:border-primary text-xs bg-white text-text-main"
                value={pagination.limit}
                onChange={(e) => setPagination({...pagination, limit: Number(e.target.value), page: 1})}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter font-montserrat">
            Displaying {products.length} items
          </div>

          <div className="flex items-center gap-1">
            <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination({...pagination, page: 1})}
                className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-50 transition-all"
            >
                <ChevronsLeft size={16}/>
            </button>
            <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-50 transition-all"
            >
                <ChevronLeft size={16}/>
            </button>
            
            <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden">
              <input type="text" value={pagination.page} readOnly className="w-8 text-center text-xs border-none p-1.5 focus:ring-0 text-text-main font-bold bg-cream-50" />
            </div>

            <button 
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"
            >
                <ChevronRight size={16}/>
            </button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronsRight size={16}/></button>
          </div>
        </div>
      </div>

      {/* 🛠️ Print CSS */}
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

export default HomeBestSeller;