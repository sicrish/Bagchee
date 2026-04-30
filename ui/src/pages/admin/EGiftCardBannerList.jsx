import React, { useState, useEffect } from 'react';
import {
    Plus, Download, Printer, Search, RotateCw,
    Edit, Trash2, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Loader2, Monitor, Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';
import {useConfirm} from '../../context/ConfirmContext.jsx'

const EGiftCardBannerList = () => {
    const navigate = useNavigate();
      const {confirm}=useConfirm()
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
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
    const fetchBanners = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                isActive: filters.active,
                order: filters.order
            };

            // 🟢 API Endpoint updated for E-Gift Card Banners
            const res = await axios.get(`${API_URL}/e-gift-card-banner/list`, { params });

            if (res.data.status) {
                setBanners(res.data.data);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load banner list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
        // eslint-disable-next-line
    }, [pagination.page, pagination.limit]);

    // --- 2. DELETE HANDLER ---
    const handleDelete = async (id) => {
        if (!(await confirm())) return;
        const toastId = toast.loading("Deleting...");
        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.delete(`${API_URL}/e-gift-card-banner/delete/${id}`);
            if (res.data.status) {
                toast.success("Banner deleted successfully!", { id: toastId });
                fetchBanners();
            }
        } catch (error) {
            toast.error("Delete failed", { id: toastId });
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const clearFilters = () => {
        setFilters({ active: '', order: '' });
        setTimeout(() => fetchBanners(), 100);
    };

    // --- 3. EXPORT DATA ---
    const handleExport = async () => {
        setExporting(true);
        const toastId = toast.loading("Exporting data...");

        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.get(`${API_URL}/e-gift-card-banner/list`, {
                params: { ...filters, limit: 'all' }
            });

            if (res.data.status && res.data.data.length > 0) {
                const exportData = res.data.data.map(item => ({
                    "ID": item.id || item._id,
                    "Desktop Image": item.desktopImage || 'N/A',
                    "Mobile Image": item.mobileImage || 'N/A',
                    "Active": item.isActive ? "Yes" : "No",
                    "Order": item.order || 0,
                    "Created At": new Date(item.createdAt).toLocaleDateString()
                }));

                await exportToExcel(exportData, "EGiftCardBanners", "gift_card_banners");
                toast.success("Export complete!", { id: toastId });
            } else {
                toast.error("No data to export", { id: toastId });
            }
        } catch (error) {
            toast.error("Export failed", { id: toastId });
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById("printable-table-area");
        if (!printContent) return;
        const originalBody = document.body.innerHTML;
        document.body.innerHTML = `<div style="padding: 20px;"><h1>E-Gift Card Banners Report</h1>${printContent.innerHTML}</div>`;
        window.print();
        document.body.innerHTML = originalBody;
        window.location.reload();
    };

    const getImageUrl = (imgName) => {
        if (!imgName) return "https://placehold.co/150x80?text=No+Img";
        if (imgName.startsWith("http")) return imgName;
        const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '');
        return `${API_BASE}/${imgName.replace(/^\//, '')}`;
    };

    return (
        <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

            {/* --- TOP TOOLBAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <button
                    onClick={() => navigate('/admin/add-e-gift-card-banner')}
                    className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
                >
                    <Plus size={14} className="text-primary" /> Add Gift Card Banner
                </button>

                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <button onClick={handleExport} disabled={exporting} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
                        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="text-accent" />}
                        Export
                    </button>
                    <button onClick={handlePrint} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
                        <Printer size={14} className="text-green-600" /> Print
                    </button>
                    <button onClick={clearFilters} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
                        Clear
                    </button>
                    <button onClick={fetchBanners} className="bg-primary text-white p-2 rounded hover:bg-primary-hover shadow-sm">
                        <Search size={16} />
                    </button>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm" id="printable-table-area">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse text-sm">
                        <thead>
                            <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider">
                                <th className="p-3 text-left w-16 border-r border-white/20">#</th>
                                <th className="p-3 text-left border-r border-white/20">
                                    <div className="flex items-center gap-2"><Monitor size={14} /> Desktop View</div>
                                </th>
                                <th className="p-3 text-left border-r border-white/20">
                                    <div className="flex items-center gap-2"><Smartphone size={14} /> Mobile View</div>
                                </th>
                                <th className="p-3 text-left border-r border-white/20 w-32">Status</th>
                                <th className="p-3 text-left border-r border-white/20 w-24">Order</th>
                                <th className="p-3 text-center w-32 hide-on-print">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-cream-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-text-muted font-bold">
                                        <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin text-primary" /> Fetching Banners...</div>
                                    </td>
                                </tr>
                            ) : banners.length > 0 ? (
                                banners.map((item, index) => (
                                    <tr key={item.id || item._id} className="hover:bg-primary-50 transition-colors">
                                        <td className="p-3 border-r border-cream-50 font-bold">{index + 1}</td>

                                        {/* Desktop Preview */}
                                        <td className="p-2 border-r border-cream-50">
                                            <div className="w-32 h-14 bg-gray-100 rounded border overflow-hidden shadow-sm">
                                                <img src={getImageUrl(item.desktopImage)} alt="Desktop" className="w-full h-full object-cover" />
                                            </div>
                                        </td>

                                        {/* Mobile Preview */}
                                        <td className="p-2 border-r border-cream-50">
                                            <div className="w-14 h-16 bg-gray-100 rounded border overflow-hidden shadow-sm mx-auto md:mx-0">
                                                <img src={getImageUrl(item.mobileImage)} alt="Mobile" className="w-full h-full object-cover" />
                                            </div>
                                        </td>

                                        <td className="p-3 border-r border-cream-50">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.isActive ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </td>
                                        <td className="p-3 border-r border-cream-50 font-medium">{item.order || 0}</td>

                                        <td className="p-3 text-center hide-on-print">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => navigate(`/admin/edit-e-gift-card-banner/${item.id || item._id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"><Edit size={14} /></button>
                                                <button onClick={() => handleDelete(item.id || item._id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-10 text-center text-text-muted italic">No banners found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-cream-50 flex justify-between items-center">
                    <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                        Total {banners.length} Banners Listed
                    </div>
                    <div className="flex items-center gap-1">
                        <button disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} className="p-1.5 border rounded hover:text-primary disabled:opacity-50"><ChevronLeft size={16} /></button>
                        <div className="px-3 py-1 border rounded text-xs font-bold bg-cream-50">{pagination.page}</div>
                        <button onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} className="p-1.5 border rounded hover:text-primary"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .hide-on-print { display: none !important; }
                    #printable-table-area { border: none !important; }
                }
            `}</style>
        </div>
    );
};

export default EGiftCardBannerList;