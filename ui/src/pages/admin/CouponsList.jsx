'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2, Ticket, Copy, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const CouponsList = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 Filter States
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCode, setSearchCode] = useState("");

  // 🟢 1. Fetch Coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/coupons/list`);
      if (res.data.status) {
        setCoupons(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // 🔴 2. Delete Logic with Confirmation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this coupon?")) return;

    const toastId = toast.loading("Processing deletion...");
    try {
      const res = await axios.delete(`${API_BASE_URL}/coupons/delete/${id}`);
      if (res.data.status) {
        toast.success("Coupon removed from system! ✨", { id: toastId });
        fetchCoupons(); 
      }
    } catch (error) {
      toast.error("Operation failed", { id: toastId });
    }
  };

  // 📋 3. Copy to Clipboard Utility
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Code "${text}" copied!`, {
      icon: '📋',
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  // 🔍 4. Live Filtering Logic
  const filteredCoupons = useMemo(() => {
    return coupons.filter(item => 
      (item.title?.toLowerCase().includes(searchTitle.toLowerCase())) &&
      (item.code?.toLowerCase().includes(searchCode.toLowerCase()))
    );
  }, [coupons, searchTitle, searchCode]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const filterInputClass = "w-full rounded px-2 py-1 text-[11px] outline-none bg-white/90 focus:bg-white text-text-main font-semibold shadow-inner border-none placeholder:text-gray-400";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => navigate('/admin/add-coupons')} 
            className="bg-primary text-white hover:brightness-110 px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
          >
            <Plus size={16} /> Add Coupon
          </button>
          <button className="bg-white border border-cream-300 text-text-main px-5 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm hover:bg-gray-50 transition-all">
            Send Coupons
          </button>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={fetchCoupons} className="bg-white border border-cream-300 p-2.5 rounded-lg text-primary hover:bg-gray-50 transition-all shadow-sm group">
             <RotateCw size={16} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          <button 
            onClick={() => {setSearchTitle(""); setSearchCode("");}} 
            className="bg-white border border-cream-300 text-gray-500 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-gray-50 transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              {/* Header Titles */}
              <tr className="bg-primary text-white font-montserrat font-bold uppercase tracking-widest text-[10px]">
                <th className="p-4 text-center w-24 border-r border-white/10">Ref.</th>
                <th className="p-4 text-left border-r border-white/10">Coupon Information</th>
                <th className="p-4 text-left border-r border-white/10">Access Code</th>
                <th className="p-4 text-left border-r border-white/10">Valid From</th>
                <th className="p-4 text-left border-r border-white/10">Expiry Date</th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>

              {/* Filter Row */}
              <tr className="bg-primary/95 border-t border-white/10">
                <td className="p-2 border-r border-white/10">
                  <div className="flex justify-center items-center h-full">
                    <input type="checkbox" className="h-4 w-4 rounded accent-accent bg-white cursor-pointer" />
                  </div>
                </td>
                <td className="p-2 border-r border-white/10">
                  <input 
                    type="text" 
                    className={filterInputClass} 
                    placeholder="Search Title..." 
                    value={searchTitle} 
                    onChange={(e) => setSearchTitle(e.target.value)} 
                  />
                </td>
                <td className="p-2 border-r border-white/10">
                  <input 
                    type="text" 
                    className={filterInputClass} 
                    placeholder="Search Code..." 
                    value={searchCode} 
                    onChange={(e) => setSearchCode(e.target.value)} 
                  />
                </td>
                <td className="p-2 border-r border-white/10"></td>
                <td className="p-2 border-r border-white/10"></td>
                <td className="p-2 text-center text-white/50"><Search size={14} className="inline"/></td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-montserrat">Syncing with server...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCoupons.length > 0 ? (
                filteredCoupons.map((coupon, index) => {
                  const isExpired = coupon.valid_to && new Date(coupon.valid_to) < new Date();
                  
                  return (
                    <tr key={coupon._id} className="hover:bg-primary/5 transition-colors group">
                      <td className="p-4 border-r border-gray-50 text-center font-mono text-xs text-gray-400">
                          {index + 1}
                      </td>
                      <td className="p-4 border-r border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-text-main font-bold tracking-tight">{coupon.title}</span>
                            {isExpired && <span className="text-[8px] font-black text-red-500 uppercase">Expired</span>}
                          </div>
                      </td>
                      <td className="p-4 border-r border-gray-50">
                          <button 
                            onClick={() => copyToClipboard(coupon.code)}
                            className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider border border-primary/10 hover:bg-primary hover:text-white transition-all group/btn"
                          >
                              {coupon.code}
                              <Copy size={10} className="opacity-40 group-hover/btn:opacity-100" />
                          </button>
                      </td>
                      <td className="p-4 border-r border-gray-50 text-gray-600 font-medium text-xs italic">{formatDate(coupon.valid_from)}</td>
                      <td className="p-4 border-r border-gray-50 text-gray-600 font-medium text-xs italic">{formatDate(coupon.valid_to)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => navigate(`/admin/edit-coupons/${coupon._id}`)} 
                            className="p-2 bg-white border border-gray-200 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(coupon._id)} 
                            className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                        <Ticket size={48} className="mb-2 text-gray-300" />
                        <p className="text-sm font-bold text-gray-500 italic font-montserrat">No results found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- CUSTOM FOOTER --- */}
        <div className="p-4 bg-gray-50/50 border-t border-cream-200 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Total Record(s): {filteredCoupons.length}
            </span>
            <div className="flex gap-1">
                <button className="p-1 rounded hover:bg-white transition-colors text-gray-400"><ChevronsLeft size={16}/></button>
                <button className="p-1 rounded hover:bg-white transition-colors text-gray-400"><ChevronLeft size={16}/></button>
                <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded shadow-sm">1</span>
                <button className="p-1 rounded hover:bg-white transition-colors text-gray-400"><ChevronRight size={16}/></button>
                <button className="p-1 rounded hover:bg-white transition-colors text-gray-400"><ChevronsRight size={16}/></button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CouponsList;