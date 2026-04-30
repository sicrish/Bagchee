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

const ProductTypesList = () => {
  const navigate = useNavigate();
    const {confirm}=useConfirm()
  // 🟢 State for data
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    name: "",
    folder: ""
  });

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/product-types/list`);
      
      if (res.data.status) {
        setProductTypes(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load product types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  // 🟢 2. Filtering Logic (Real-time)
  const filteredTypes = useMemo(() => {
    return productTypes.filter(item => {
      return (
        (item.name || "").toLowerCase().includes(filters.name.toLowerCase()) &&
        (item.imageFolder || item.image_folder || "").toLowerCase().includes(filters.folder.toLowerCase())
      );
    });
  }, [productTypes, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ name: "", folder: "" });
    fetchProductTypes();
  };

  const handleDelete = async (id) => {
        if (!(await confirm())) return;
    try {
        const API_URL = process.env.REACT_APP_API_URL;
        await axios.delete(`${API_URL}/product-types/delete/${id}`);
        toast.success("Deleted successfully");
        fetchProductTypes(); 
    } catch (error) {
        toast.error("Delete failed");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-sans text-gray-700">
      
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/add-product-type')} 
          className="w-full md:w-auto bg-white border border-gray-300 text-primary hover:bg-blue-50 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={16} className="text-red-500" /> Add Products Types
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-gray-300 text-gray-600 px-4 py-1.5 rounded shadow-sm hover:bg-gray-100 flex items-center gap-2 text-xs font-bold transition-colors">
            <Download size={14} className="text-orange-400" /> Export
          </button>
          <button className="bg-white border border-gray-300 text-gray-600 px-4 py-1.5 rounded shadow-sm hover:bg-gray-100 flex items-center gap-2 text-xs font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button 
            onClick={clearFilters}
            className="bg-white border border-gray-300 text-gray-600 px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchProductTypes} className="bg-primary text-white p-2 rounded hover:bg-opacity-90 transition-colors">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-bold uppercase tracking-wider">
                <th className="p-3 text-center w-16 border-r border-white/10">#</th>
                <th className="p-3 text-left border-r border-white/10">Name</th>
                <th className="p-3 text-left border-r border-white/10">Image folder</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>
              {/* 🟢 Filter Row */}
              <tr className="bg-[#0096C7] border-b border-gray-200">
                <td className="p-2 border-r border-white/20 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input 
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    type="text" 
                    className="w-full border-none rounded p-1 text-xs focus:ring-0 outline-none bg-white/90" 
                    placeholder="Filter Name" 
                  />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input 
                    name="folder"
                    value={filters.folder}
                    onChange={handleFilterChange}
                    type="text" 
                    className="w-full border-none rounded p-1 text-xs focus:ring-0 outline-none bg-white/90" 
                    placeholder="Filter Folder" 
                  />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchProductTypes} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-primary" /> Loading data...
                    </div>
                  </td>
                </tr>
              ) : filteredTypes.length > 0 ? (
                filteredTypes.map((item, index) => (
                  <tr key={item.id || item._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 border-r text-center">
                        <span className="text-gray-400 font-bold text-xs">{index + 1}</span>
                    </td>
                    <td className="p-3 border-r font-medium text-gray-800">{item.name}</td>
                    <td className="p-3 border-r text-gray-600 font-mono text-xs">{item.imageFolder || item.image_folder}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-product-type/${item.id || item._id}`)} className="p-1.5 border border-gray-200 rounded text-gray-500 hover:text-primary hover:border-primary transition-all"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item.id || item._id)} className="p-1.5 border border-gray-200 rounded text-gray-500 hover:text-red-500 hover:border-red-500 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400 italic">No matching product types found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-tight">
            Displaying {filteredTypes.length} of {productTypes.length} items
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 border border-gray-200 rounded hover:bg-blue-50 text-gray-400 hover:text-primary"><ChevronLeft size={16}/></button>
            <div className="flex items-center mx-2 border rounded overflow-hidden">
              <input type="text" value="1" readOnly className="w-10 text-center text-sm border-none p-1 bg-gray-50" />
            </div>
            <button className="p-2 border border-gray-200 rounded hover:bg-blue-50 text-gray-400 hover:text-primary"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTypesList;