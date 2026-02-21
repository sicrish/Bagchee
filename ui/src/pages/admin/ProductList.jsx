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

  // --- FETCH PRODUCTS ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;

      // Query Params Builder (Sahi tarika URL banane ka)
      const params = new URLSearchParams();
      params.append("product_type", "book"); // Default type
      params.append("showAll", "true");
      // 🟢 Add Main Search
      if (searchTerm) params.append("keyword", searchTerm);

      // 🟢 Add Column Filters (Loop through filters state)
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          // Backend check: Backend ko 'id' chahiye ya '_id'? Hum input name bhej rahe hain.
          params.append(key, filters[key]);
        }
      });

      const url = `${API_URL}/product/fetch?${params.toString()}`;

      // 🔍 DEBUGGING: Console me dekhein ki URL sahi ban raha hai ya nahi
      console.log("Fetching URL:", url);

      const response = await axios.get(url);
      if (response.data.status) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // --- EXPORT & PRINT ---
  const handleExport = () => {
    if (products.length === 0) { toast.error("No data!"); return; }
    const headers = ["ID", "Title", "Bagchee ID", "Price", "Meta Title", "ISBN 10", "ISBN 13", "Type"];
    const csvContent = [
      headers.join(","),
      ...products.map(item => [
        item._id, `"${item.title.replace(/"/g, '""')}"`, item.bagchee_id || "",
        item.priceForeign || item.real_price || 0, `"${(item.meta_title || "").replace(/"/g, '""')}"`,
        item.isbn10 || "", item.isbn13 || "", item.product_type || "Book"
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", "books_export.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handlePrint = () => window.print();

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
                  <tr key={item._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-2.5 border-r text-center text-sm text-gray-600">{item.bagchee_id || item._id}</td>
                    <td className="p-2.5 border-r text-sm font-bold text-[#333]">{item.title}</td>
                    <td className="p-2.5 border-r text-sm text-gray-600 font-semibold">{`BB${item._id}`}</td>
                    <td className="p-2.5 border-r text-sm text-gray-600 font-bold">{Number(item.priceForeign || item.real_price || 0).toFixed(2)}</td>
                    <td className="p-2.5 border-r text-sm text-gray-500 max-w-xs truncate">{item.meta_title || '-'}</td>
                    <td className="p-2.5 border-r text-sm text-gray-500">{item.isbn10 || '-'}</td>
                    <td className="p-2.5 border-r text-sm text-gray-500">{item.isbn13 || '-'}</td>
                    <td className="p-2.5 border-r text-sm font-bold text-[#0096cc] uppercase">{item.product_type || 'Books'}</td>
                    <td className="p-2.5">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/edit-book/${item._id}`)}
                          className="p-1.5 bg-gray-100 border rounded text-gray-600 hover:bg-white transition-all shadow-sm"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
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
        <div className="p-3 bg-white border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Show</span>
            <select className="border border-gray-300 rounded text-xs p-1 focus:border-primary outline-none">
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-[11px] font-bold text-gray-500 uppercase">entries</span>
          </div>

          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
            Displaying {products.length} items
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-primary"><ChevronsLeft size={14} /></button>
            <button className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-primary"><ChevronLeft size={14} /></button>
            <button className="w-8 h-8 flex items-center justify-center bg-[#0096cc] text-white text-xs font-bold rounded shadow-sm">1</button>
            <button className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-primary"><ChevronRight size={14} /></button>
            <button className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-primary"><ChevronsRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;