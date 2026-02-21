'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Download, Printer, Search, RotateCw,
    Edit, Trash2, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Loader2, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const CouriersList = () => {
    const navigate = useNavigate();
    const [couriers, setCouriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState(""); // Filter by Title

    // 🟢 1. Fetch Couriers
    const fetchCouriers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/couriers/list`);
            if (res.data.status) {
                setCouriers(res.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to load couriers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCouriers();
    }, []);

    // 🔴 2. Delete Logic with Confirmation
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this courier partner?")) return;

        const toastId = toast.loading("Processing deletion...");
        try {
            const res = await axios.delete(`${API_BASE_URL}/couriers/delete/${id}`);
            if (res.data.status) {
                toast.success("Partner removed successfully!", { id: toastId });
                fetchCouriers();
            }
        } catch (error) {
            toast.error("Operation failed", { id: toastId });
        }
    };

    // 🔍 3. Live Filtering Logic
    const filteredCouriers = useMemo(() => {
        return couriers.filter(item => 
            item.title.toLowerCase().includes(filterText.toLowerCase())
        );
    }, [couriers, filterText]);

    const filterInputClass = "w-full rounded border-none px-2 py-1 text-[11px] outline-none bg-white/90 focus:bg-white text-text-main font-semibold placeholder:text-gray-400 shadow-inner";

    return (
        <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
            
            {/* Header Area */}
            <div className="flex items-center gap-2 mb-6">
                <Truck className="text-primary" size={24} />
                <h1 className="text-xl font-bold uppercase tracking-tight font-display">Courier Partners</h1>
            </div>

            {/* --- TOP TOOLBAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/add-couriers')}
                    className="w-full md:w-auto bg-primary text-white hover:brightness-110 px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
                >
                    <Plus size={16} /> Add New Partner
                </button>

                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <button onClick={() => { setFilterText(""); fetchCouriers(); }} className="bg-white border border-cream-300 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all">
                        Reset
                    </button>
                    <div className="flex items-center bg-white border border-cream-300 rounded-lg overflow-hidden px-3 focus-within:border-primary transition-all">
                        <Search size={14} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Global search..." 
                            className="p-2 text-xs outline-none w-40"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse text-sm">
                        <thead>
                            <tr className="bg-primary text-white font-montserrat font-bold uppercase tracking-widest text-[10px]">
                                <th className="p-4 text-center w-20">No.</th>
                                <th className="p-4 text-left">Partner Name</th>
                                <th className="p-4 text-left w-40">Service Status</th>
                                <th className="p-4 text-center w-32">Actions</th>
                            </tr>
                            {/* Inner Filter Row */}
                            <tr className="bg-primary/95 border-t border-white/10">
                                <td className="p-2 border-r border-white/10">
                                     <div className="flex items-center gap-2 px-2">
                                        <input type="checkbox" className="h-4 w-4 rounded accent-accent" />
                                     </div>
                                </td>
                                <td className="p-2 border-r border-white/10">
                                    <input 
                                        type="text" 
                                        className={filterInputClass} 
                                        placeholder="Search by name..." 
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                    />
                                </td>
                                <td className="p-2 border-r border-white/10 text-center">
                                    <span className="text-[9px] text-white/60 font-bold uppercase">Auto-filter</span>
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={fetchCouriers} className="text-white hover:rotate-180 transition-transform duration-700 p-1">
                                        <RotateCw size={14} />
                                    </button>
                                </td>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-primary" size={32} />
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing with server...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCouriers.length > 0 ? (
                                filteredCouriers.map((item, index) => (
                                    <tr key={item._id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="p-4 text-center border-r border-gray-50">
                                            <span className="text-gray-400 font-mono text-xs">{index + 1}</span>
                                        </td>
                                        <td className="p-4 text-text-main font-bold tracking-tight">
                                            {item.title}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                                                item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/admin/edit-couriers/${item._id}`)}
                                                    className="p-2 bg-white border border-gray-200 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    title="Edit Partner"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    title="Delete Partner"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Truck size={48} className="mb-2 text-gray-300" />
                                            <p className="text-sm font-bold text-gray-500 italic">No courier partners match your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CouriersList;