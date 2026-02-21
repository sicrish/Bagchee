import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  Settings as SettingsIcon, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const SettingsList = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 1. Filtering States (Based on your screenshot fields)
  const [filters, setFilters] = useState({
    sale_threshold: "",
    bestseller_threshold: "",
    membership_cost: "",
    new_arrival_time: "",
    free_shipping_over: "",
    topbar_promotion: ""
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/settings/list`);
      if (res.data.status) {
        setSettings(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);


  const handleDelete = async (id) => {


    const toastId = toast.loading("Deleting setting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/settings/delete/${id}`);
      if (res.data.status) {
        toast.success("Setting removed successfully!", { id: toastId });
        fetchSettings(); // Refresh list after delete
      }
    } catch (error) {
      toast.error("Deletion failed. Try again.", { id: toastId });
    }
  };


  // 🟢 2. Filtering Logic
  const filteredSettings = useMemo(() => {
    return settings.filter((item) => {
      return (
        item.sale_threshold?.toString().includes(filters.sale_threshold) &&
        item.bestseller_threshold?.toString().includes(filters.bestseller_threshold) &&
        item.membership_cost?.toString().includes(filters.membership_cost) &&
        item.new_arrival_time?.toString().includes(filters.new_arrival_time) &&
        item.free_shipping_over?.toString().includes(filters.free_shipping_over) &&
        (item.topbar_promotion || "").toLowerCase().includes(filters.topbar_promotion.toLowerCase())
      );
    });
  }, [settings, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      sale_threshold: "", bestseller_threshold: "", membership_cost: "",
      new_arrival_time: "", free_shipping_over: "", topbar_promotion: ""
    });
  };

  const inputClass = "w-full rounded-[4px] px-2 py-1.5 text-[11px] outline-none text-text-main border border-transparent focus:border-white/50 bg-white/20 placeholder:text-white/50 text-white font-body font-medium";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        {/* Added the Add Button as requested */}
        <button
          onClick={() => navigate('/admin/add-setting')}
          className="bg-white border border-gray-200 text-text-main hover:bg-gray-50 px-6 py-2.5 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-all"
        >
          <Plus size={16} className="text-red-500" /> Add New Setting
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-gray-200 text-text-main px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 text-[10px] font-bold font-montserrat uppercase">
            <Download size={14} className="text-orange-400" /> Export
          </button>
          <button className="bg-white border border-gray-200 text-text-main px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 text-[10px] font-bold font-montserrat uppercase">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
            onClick={clearFilters}
            className="bg-white border border-gray-200 text-text-main px-4 py-2 rounded shadow-sm hover:text-primary flex items-center gap-2 text-[10px] font-bold font-montserrat uppercase"
          >
            Clear filters
          </button>
          <button onClick={fetchSettings} className="bg-primary text-white p-2.5 rounded hover:bg-primary-dark transition-colors shadow-md active:rotate-180 duration-500">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl border border-cream-200 overflow-hidden shadow-xl shadow-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-widest text-[10px]">
                <th className="p-4 text-left border-r border-white/10 w-32">Sale Threshold</th>
                <th className="p-4 text-left border-r border-white/10 w-32">Bestseller Threshold</th>
                <th className="p-4 text-left border-r border-white/10 w-32">Membership Cost</th>
                <th className="p-4 text-left border-r border-white/10 w-32">New Arrival Time</th>
                <th className="p-4 text-left border-r border-white/10 w-32">Free Shipping Over</th>
                <th className="p-4 text-left border-r border-white/10 w-32">Topbar Promo</th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>

              {/* 🟢 Filter Row */}
              <tr className="bg-primary/95 border-b border-gray-200">
                <td className="p-2 border-r border-white/10"><input name="sale_threshold" value={filters.sale_threshold} onChange={handleFilterChange} type="text" className={inputClass} placeholder="Filter..." /></td>
                <td className="p-2 border-r border-white/10"><input name="bestseller_threshold" value={filters.bestseller_threshold} onChange={handleFilterChange} type="text" className={inputClass} placeholder="Filter..." /></td>
                <td className="p-2 border-r border-white/10"><input name="membership_cost" value={filters.membership_cost} onChange={handleFilterChange} type="text" className={inputClass} placeholder="Filter..." /></td>
                <td className="p-2 border-r border-white/10"><input name="new_arrival_time" value={filters.new_arrival_time} onChange={handleFilterChange} type="text" className={inputClass} placeholder="Filter..." /></td>
                <td className="p-2 border-r border-white/10"><input name="free_shipping_over" value={filters.free_shipping_over} onChange={handleFilterChange} type="text" className={inputClass} placeholder="Filter..." /></td>
                <td className="p-2 border-r border-white/10"><input name="topbar_promotion" value={filters.topbar_promotion} onChange={handleFilterChange} type="text" className={inputClass} placeholder="Yes/No..." /></td>
                <td className="p-2 text-center">
                  <button onClick={fetchSettings} className="text-white hover:scale-110 transition-transform"><RotateCw size={16} /></button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-100 font-body">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-20 text-center text-text-muted font-bold animate-pulse">
                    <Loader2 className="animate-spin text-primary inline mr-3" size={24} /> Loading Configuration...
                  </td>
                </tr>
              ) : filteredSettings.length > 0 ? (
                filteredSettings.map((item) => (
                  <tr key={item._id} className="hover:bg-primary/5 transition-colors text-[13px] group">
                    <td className="p-4 border-r border-cream-50 font-bold text-primary">{item.sale_threshold}%</td>
                    <td className="p-4 border-r border-cream-50">{item.bestseller_threshold} Orders</td>
                    <td className="p-4 border-r border-cream-50 font-medium">${item.membership_cost}</td>
                    <td className="p-4 border-r border-cream-50">{item.new_arrival_time} Days</td>
                    <td className="p-4 border-r border-cream-50 font-medium">${item.free_shipping_over}</td>
                    <td className="p-4 border-r border-cream-50">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.topbar_promotion === 'Yes' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {item.topbar_promotion}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/edit-setting/${item._id}`)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)} 
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-20 text-center text-text-muted italic">No settings found in the system.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 bg-cream-50 border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
            Configuration Records: {filteredSettings.length}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-cream-200 rounded-lg bg-white text-text-muted hover:text-primary transition-all"><ChevronLeft size={18} /></button>
            <span className="px-4 py-1 text-xs font-bold text-primary bg-white border border-cream-200 rounded-md">1</span>
            <button className="p-2 border border-cream-200 rounded-lg bg-white text-text-muted hover:text-primary transition-all"><ChevronRight size={18} /></button>
            <div className="ml-4 p-2 border border-cream-200 rounded-lg bg-white text-text-muted hover:rotate-90 transition-all duration-500 cursor-pointer">
              <SettingsIcon size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsList;