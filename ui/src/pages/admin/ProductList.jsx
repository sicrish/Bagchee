import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Printer, Download, Edit, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 🟢 Import useParams
import axios from '../../utils/axiosConfig';

import toast from 'react-hot-toast';

const ProductList = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default as per your requirement
  const [totalItems, setTotalItems] = useState(0);

  // 🟢 1. Main Search (Top Bar)
  const [searchTerm, setSearchTerm] = useState("");
 

  // 🟢 2. Column Filters State (Table Header)
  // Sabhi filters ke liye ek hi state object
  const [filters, setFilters] = useState({
    id: "",
    title: "",
    bagchee_id: "",
    price: "",
    meta_title: "",
    isbn10: "",
    isbn13: "",
    product_type: ""
  });

  const category = "book";
  const pageTitle = "Books list";

  const fetchProducts = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const params = new URLSearchParams();
      params.append("product_type", "book");
      params.append("showAll", "true");

      // Pagination Params (Export ke waqt limit bypass karega)
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      if (searchTerm) params.append("keyword", searchTerm);
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const url = `${API_URL}/product/fetch?${params.toString()}`;
      const response = await axios.get(url);
      
      if (response.data.status) {
        if (isExport) return response.data.data; // Export ke liye data return karo
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      if (!isExport) setProducts([]);
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  // Jab bhi Page ya Limit (Show entries) badle, data fetch ho
  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage]);

  // --- HANDLERS ---

  // 🟢 Handle Filter Inputs Change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchProducts();
  };

  // Enter Key Handler for ALL inputs
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchProducts();
    }
  };

  // 🟢 Clear Filters Function
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      id: "", title: "", bagchee_id: "", price: "",
      meta_title: "", isbn10: "", isbn13: "", product_type: ""
    });
    // State update hone me time lagta hai, isliye thoda delay dekar reload karein
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

 // 🟢 Export with Full Data Fetch
 const handleExport = async () => {
  const toastId = toast.loading("Preparing full data for export...");
  try {
    const allData = await fetchProducts(true); // Special call for full data
    
    if (!allData || allData.length === 0) {
      toast.error("No data to export", { id: toastId });
      return;
    }

    const headers = ["ID", "Title", "Bagchee ID", "Price", "ISBN 10", "ISBN 13", "Type"];
    const csvContent = [
      headers.join(","),
      ...allData.map(item => {
        // Fix: ISBN ke aage \t (Tab) jodne se Excel usey Number nahi Text treat karega
        // Isse 9781234567890 poora dikhega, 9.78E+12 nahi banega.
        const isbn10 = item.isbn10 ? `\t${item.isbn10}` : "-";
        const isbn13 = item.isbn13 ? `\t${item.isbn13}` : "-";
        const title = `"${(item.title || "").replace(/"/g, '""')}"`;
        const meta = `"${(item.metaTitle || item.meta_title || "").replace(/"/g, '""')}"`;

        return [
          item.id || item._id,
          title,
          item.bagcheeId || item.bagchee_id || `BB${item.id}`,
          item.realPrice || item.priceForeign || item.real_price || 0,
          meta,
          isbn10,
          isbn13,
          item.productType || item.product_type || "Book"
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `full_books_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Full data exported! 📊", { id: toastId });
  } catch (error) {
    toast.error("Export failed", { id: toastId });
  }
};

  // 🟢 1. Updated handlePrint Logic
  const handlePrint = () => {
    // Print window open karne se pehle agar aap loading state handle karna chahein toh kar sakte hain
    if (products.length === 0) {
      toast.error("No data to print!");
      return;
    }
    window.print();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirm delete?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/product/delete/${id}`);
      toast.success("Deleted", { id: toastId });
      fetchProducts();
    } catch (error) { toast.error("Failed", { id: toastId }); }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-body p-4 md:p-6">

{/* 🟢 Print optimization styles */}
<style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide Toolbar, Filters, Pagination, and Action columns */
          button, input, select, .print\\:hidden, 
          thead.print\\:hidden, th:last-child, td:last-child {
            display: none !important;
          }
          /* Reset background and padding for paper */
          body { background: white !important; padding: 0 !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; font-size: 10px !important; }
          thead { background-color: #0096cc !important; color: white !important; -webkit-print-color-adjust: exact; }
          /* Show page title on print */
          .print-header { display: block !important; text-align: center; margin-bottom: 20px; }
        }
        @media screen { .print-header { display: none; } }
      `}} />

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-xl font-bold text-gray-700 uppercase md:hidden">{pageTitle}</h1>

        <button
          onClick={() => navigate('/admin/add-book')}
          className="bg-[#f8f9fa] border border-gray-300 text-gray-700 hover:bg-white px-4 py-1.5 rounded shadow-sm flex items-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add {category || 'Product'}
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExport} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-bold">
            <Download size={14} className="text-yellow-600" /> Export
          </button>
          <button
            onClick={handlePrint} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-bold">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
         onClick={handleClearFilters}
            className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-bold"
          >
            Clear filters
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Search title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-3 pr-10 py-1.5 border border-gray-300 rounded focus:border-primary text-xs w-48 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={handleSearch} className="absolute right-0 top-0 h-full w-8 bg-[#0096cc] text-white rounded-r flex items-center justify-center hover:bg-primary-dark transition-colors">
              <Search size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead className="bg-[#0096cc] text-white">
              <tr>
                <th className="p-3 text-center border-r border-white/20 w-12 text-xs font-bold uppercase">#</th>
                <th className="p-3 text-left border-r border-white/20 text-xs font-bold uppercase">Title</th>
                <th className="p-3 text-left border-r border-white/20 text-xs font-bold uppercase">Bagchee id</th>
                <th className="p-3 text-left border-r border-white/20 text-xs font-bold uppercase">Real price</th>
                <th className="p-3 text-left border-r border-white/20 text-xs font-bold uppercase">Meta title</th>
                <th className="p-3 text-left border-r border-white/20 text-xs font-bold uppercase">Isbn 10</th>
                <th className="p-3 text-left border-r border-white/20 text-xs font-bold uppercase">Isbn 13</th>
                <th className="p-3 text-left border-r border-white/20 text-xs font-bold uppercase">Product type</th>
                <th className="p-3 text-center text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>

            {/* Inline Filter Row */}
          <thead className="bg-white border-b border-gray-200 print:hidden">
              <tr>
                {/* 1. ID Input */}
                <th className="p-2 border-r text-center bg-[#f8f9fa]">
                   <input
                     name="id"
                     type="text"
                     placeholder="#"
                     value={filters.id}
                     onChange={handleFilterChange}
                     onKeyDown={handleKeyDown}
                     className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary text-center"
                   />
                </th>
                
                {/* 2. Title Input */}
                <th className="p-2 border-r">
                    <input 
                        name="title" 
                        value={filters.title} 
                        onChange={handleFilterChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary" 
                    />
                </th>
                
                {/* 3. Bagchee ID Input */}
                <th className="p-2 border-r">
                    <input 
                        name="bagchee_id" 
                        value={filters.bagchee_id} 
                        onChange={handleFilterChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary" 
                    />
                </th>
                
                {/* 4. Price Input */}
                <th className="p-2 border-r">
                    <input 
                        name="price" 
                        value={filters.price} 
                        onChange={handleFilterChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary" 
                    />
                </th>

                {/* 5. Meta Title Input */}
                <th className="p-2 border-r">
                    <input 
                        name="meta_title" 
                        value={filters.meta_title} 
                        onChange={handleFilterChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary" 
                    />
                </th>

                {/* 6. ISBN 10 Input */}
                <th className="p-2 border-r">
                    <input 
                        name="isbn10" 
                        value={filters.isbn10} 
                        onChange={handleFilterChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary" 
                    />
                </th>

                {/* 7. ISBN 13 Input */}
                <th className="p-2 border-r">
                    <input 
                        name="isbn13" 
                        value={filters.isbn13} 
                        onChange={handleFilterChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary" 
                    />
                </th>

                {/* 8. Product Type Input */}
                <th className="p-2 border-r">
                    <input 
                        name="product_type" 
                        value={filters.product_type} 
                        onChange={handleFilterChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full border border-gray-200 p-1 text-[11px] rounded outline-none focus:border-primary" 
                    />
                </th>

                {/* Filter Trigger Button */}
                <th className="p-2 text-center bg-[#f8f9fa]">
                    <button onClick={handleSearch} className="hover:bg-gray-200 p-1 rounded transition cursor-pointer">
                        <Filter size={14} className="mx-auto text-gray-500" />
                    </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-10 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-primary" /> Loading {category || 'Products'}...
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((item, index) => (
                  <tr key={item.id || item._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-2.5 border-r text-center text-sm text-gray-600">{item.id || item._id}</td>
                    <td className="p-2.5 border-r text-sm font-bold text-[#333]">{item.title}</td>
                    <td className="p-2.5 border-r text-sm text-gray-600 font-semibold">{item.bagcheeId || item.bagchee_id || `BB${item.id}`}</td>
                    <td className="p-2.5 border-r text-sm text-gray-600 font-bold">{Number(item.realPrice || item.priceForeign || item.real_price || 0).toFixed(2)}</td>
                    <td className="p-2.5 border-r text-sm text-gray-500 max-w-xs truncate">{item.metaTitle || item.meta_title || '-'}</td>
                    <td className="p-2.5 border-r text-sm text-gray-500">{item.isbn10 || '-'}</td>
                    <td className="p-2.5 border-r text-sm text-gray-500">{item.isbn13 || '-'}</td>
                    <td className="p-2.5 border-r text-sm font-bold text-[#0096cc] uppercase">{item.productType || item.product_type || 'Books'}</td>
                    <td className="p-2.5">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/edit-book/${item.id || item._id}`)}
                          className="p-1.5 bg-gray-100 border rounded text-gray-600 hover:bg-white transition-all shadow-sm"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item._id)}
                          className="p-1.5 bg-gray-100 border rounded text-red-500 hover:bg-white transition-all shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-10 text-center font-bold text-gray-400 italic">
                    No products found in "{category}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER --- */}
        {/* --- FOOTER / PAGINATION --- */}
<div className="p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm">
  
  {/* 1. Show Entries Dropdown */}
  <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
    <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
    <select 
      value={itemsPerPage}
      onChange={(e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
      }}
      className="border border-cream-200 rounded px-2 py-1 outline-none focus:border-primary bg-cream-50 text-xs text-primary font-bold transition-all cursor-pointer shadow-sm active:scale-95"
    >
      <option value={10}>10</option>
      <option value={25}>25</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
    </select>
    <span className="text-text-muted uppercase text-[10px] tracking-wide">entries</span>
  </div>

  {/* 2. Display Info */}
  <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
    Displaying {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
  </div>

  {/* 3. Pagination Navigation Controls */}
  <div className="flex items-center gap-1">
    {/* First Page */}
    <button 
      onClick={() => setCurrentPage(1)}
      disabled={currentPage === 1}
      className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 bg-white"
    >
      <ChevronsLeft size={16} />
    </button>
    
    {/* Previous Page */}
    <button 
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 bg-white"
    >
      <ChevronLeft size={16} />
    </button>

    {/* Current Page Number Display */}
    <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">
      {currentPage}
    </div>

    {/* Next Page */}
    <button 
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
      className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 bg-white"
    >
      <ChevronRight size={16} />
    </button>

    {/* Last Page */}
    <button 
      onClick={() => setCurrentPage(totalPages)}
      disabled={currentPage === totalPages}
      className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 bg-white"
    >
      <ChevronsRight size={16} />
    </button>
  </div>
</div>
      </div>
    </div>
  );
};

export default ProductList;