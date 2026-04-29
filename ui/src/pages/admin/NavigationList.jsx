import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Settings, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';
import {useConfirm} from '../../context/ConfirmContext.jsx'

const NavigationList = () => {
  const navigate = useNavigate();
  const {confirm}=useConfirm()
  const [navigationItems, setNavigationItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    id: "",
    item: "",
    link: "",
    dropdown: "",
    active: "",
    order: ""
  });

  const fetchNavigations = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/navigation/list`); 
      if (res.data.status) {
        setNavigationItems(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load navigation items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigations();
  }, []);


// 🟢 1. Excel Export Function
const handleExport = async () => {
  if (navigationItems.length === 0) return toast.error("No data to export");

  // Excel ke liye data prepare karein
  const dataToExport = navigationItems.map((nav, index) => ({
    "Sr No": index + 1,
    "Item Name": nav.item || nav.name,
    "Link URL": nav.itemLink || nav.link,
    "Dropdown Status": nav.hasDropdown !== undefined ? (nav.hasDropdown ? 'Yes' : 'No') : nav.dropdown,
    "Status (Active)": nav.active ? 'Active' : 'Inactive',
    "Display Order": nav.ord ?? nav.order
  }));

  await exportToExcel(dataToExport, "Navigations", "Navigation_Report");
  toast.success("Excel exported successfully! 📊");
};

// 🟢 2. Print Function
const handlePrint = () => {
  if (filteredNavs.length === 0) return toast.error("No data to print");
  window.print();
};



  // 🟢 2. Filtering Logic (Optimized)
  const filteredNavs = useMemo(() => {
    return navigationItems.filter((nav, index) => {
      const displayId = (index + 1).toString();
      const itemName = nav.name || nav.item || "";
      const statusValue = String(nav.active !== undefined ? (nav.active ? 'active' : 'inactive') : (nav.status ?? ""));
      return (
        displayId.includes(filters.id) &&
        itemName.toLowerCase().includes(filters.item.toLowerCase()) &&
        (nav.itemLink || nav.link || "").toLowerCase().includes(filters.link.toLowerCase()) &&
        String(nav.hasDropdown ?? nav.dropdown ?? "").toLowerCase().includes(filters.dropdown.toLowerCase()) &&
        statusValue.toLowerCase().includes(filters.active.toLowerCase()) &&
        (nav.ord ?? nav.order ?? "0").toString().includes(filters.order)
      );
    });
  }, [navigationItems, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", item: "", link: "", dropdown: "", active: "", order: "" });
    fetchNavigations();
  };

  const handleDelete = async (id) => {
    if (!(await confirm())) return;
    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/navigation/delete/${id}`);
      if (res.data.status) {
        toast.success("Deleted successfully!", { id: toastId });
        fetchNavigations(); 
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const filterInputClass = "w-full rounded p-1 text-[11px] outline-none text-text-main border border-transparent focus:border-white/50 bg-white/20 placeholder-white/50 text-white";

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-sans text-gray-700">
      
      <style dangerouslySetInnerHTML={{ __html: `
      @media print {
        button, input, select, .no-print, .actions-column, th:last-child, td:last-child {
          display: none !important;
        }
        table { width: 100% !important; border: 1px solid #000 !important; }
        th, td { border: 1px solid #000 !important; padding: 8px !important; color: black !important; }
        thead { background-color: #0096cc !important; -webkit-print-color-adjust: exact; }
      }
    `}} />
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-navigation')} 
          className="bg-[#f8f9fa] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center gap-2 font-bold text-xs uppercase active:scale-95 transition-all"
        >
          <Plus size={14} className="text-red-600" /> Add Navigation
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={handleExport} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-bold transition-colors">
            <Download size={14} className="text-orange-400" /> Export
          </button>
          <button onClick={handlePrint} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button 
            onClick={clearFilters}
            className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:text-primary flex items-center gap-2 text-xs font-bold"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchNavigations} className="bg-[#0096cc] text-white p-2 rounded hover:bg-opacity-90 transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#0096cc] text-white border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Item</th>
                <th className="p-3 text-left border-r border-white/20">Link</th>
                <th className="p-3 text-left border-r border-white/20">Dropdown</th>
                <th className="p-3 text-left border-r border-white/20">Active</th>
                <th className="p-3 text-left border-r border-white/20 w-20">Order</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* 🟢 Filter Row with Binding */}
              <tr className="bg-[#0096cc] border-b border-gray-200">
                <td className="p-2 border-r border-white/20 text-center">
                   <div className="flex items-center gap-2 px-1">
                      <input type="checkbox" className="accent-primary bg-white h-4 w-4 shrink-0" />
                      <input name="id" value={filters.id} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="ID" />
                   </div>
                </td>
                <td className="p-2 border-r border-white/20"><input name="item" value={filters.item} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Item" /></td>
                <td className="p-2 border-r border-white/20"><input name="link" value={filters.link} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Link" /></td>
                <td className="p-2 border-r border-white/20"><input name="dropdown" value={filters.dropdown} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="active/..." /></td>
                <td className="p-2 border-r border-white/20"><input name="active" value={filters.active} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="active/..." /></td>
                <td className="p-2 border-r border-white/20"><input name="order" value={filters.order} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Order" /></td>
                <td className="p-2 text-center">
                  <button onClick={fetchNavigations} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 font-body">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500 font-bold">
                    <Loader2 className="animate-spin text-primary inline mr-2" /> Loading Navigations...
                  </td>
                </tr>
              ) : filteredNavs.length > 0 ? (
                filteredNavs.map((nav, index) => (
                  
                  <tr key={nav.id} className="hover:bg-blue-50/30 transition-colors text-[13px]">
                    <td className="p-3 border-r text-center">
                        <div className="flex items-center gap-5 px-1">
                          <input type="checkbox" className="h-4 w-4 rounded accent-[#0096cc] cursor-pointer shrink-0" />
                          <span className="text-gray-400 font-bold text-xs w-full text-center">{index + 1}</span>
                        </div>
                    </td>
                    <td className="p-3 border-r text-gray-700 font-medium">
                        {nav.name || nav.item}
                    </td>
                    <td className="p-3 border-r text-gray-500 italic text-xs">{nav.itemLink || nav.link}</td>
                    <td className={`p-3 border-r font-bold text-xs ${(nav.hasDropdown ?? nav.dropdown === 'active') ? 'text-primary' : 'text-gray-400'}`}>
                        {nav.hasDropdown !== undefined ? (nav.hasDropdown ? 'Yes' : 'No') : (nav.dropdown || '-')}
                    </td>
                    <td className={`p-3 border-r font-bold text-xs ${nav.active ? 'text-green-600' : 'text-red-400'}`}>
                        {nav.active ? 'Active' : 'Inactive'}
                    </td>
                    <td className="p-3 border-r text-gray-600 text-center font-bold">{nav.ord ?? nav.order}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-navigation/${nav.id}`)} className="p-1.5 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:text-[#0096cc] transition-all"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(nav.id)} className="p-1.5 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400 italic">No matching navigation items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-4 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
            Displaying {filteredNavs.length} of {navigationItems.length} items
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-[#0096cc] transition-all"><ChevronLeft size={16}/></button>
            <div className="flex items-center mx-1 border rounded overflow-hidden">
              <input type="text" value="1" readOnly className="w-8 text-center text-xs border-none p-1.5 bg-gray-50 text-gray-600 font-bold" />
            </div>
            <button className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-[#0096cc] transition-all"><ChevronRight size={16}/></button>
            <div className="ml-2">
              <button className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-100 transition-colors"><Settings size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationList;