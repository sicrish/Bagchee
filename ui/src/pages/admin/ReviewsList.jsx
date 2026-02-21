import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Download, Printer, Search, RotateCw,
    Edit, Trash2, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const ReviewsList = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🟢 1. Filtering States
    const [filters, setFilters] = useState({
        id: "",
        itemId: "",
        name: "",
        review: "",
        rating: "",
        status: "",
        date: ""
    });

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.get(`${API_URL}/reviews/list`);
            if (res.data.status) {
                setReviews(res.data.data);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load reviews list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // 🟢 2. Filtering Logic
    const filteredReviews = useMemo(() => {
        return reviews.filter((item, index) => {
            const displayId = (index + 1).toString();
            const itemIdStr = item.itemId?._id || "";
            const statusText = item.isActive ? "active" : "inactive";
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : "";

            return (
                displayId.includes(filters.id) &&
                itemIdStr.toLowerCase().includes(filters.itemId.toLowerCase()) &&
                (item.name || "").toLowerCase().includes(filters.name.toLowerCase()) &&
                (item.review || "").toLowerCase().includes(filters.review.toLowerCase()) &&
                (item.rating || "").toString().includes(filters.rating) &&
                statusText.includes(filters.status.toLowerCase()) &&
                dateStr.includes(filters.date)
            );
        });
    }, [reviews, filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const clearFilters = () => {
        setFilters({ id: "", itemId: "", name: "", review: "", rating: "", status: "", date: "" });
        fetchReviews();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        const toastId = toast.loading("Deleting...");
        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.delete(`${API_URL}/reviews/delete/${id}`);
            if (res.data.status) {
                toast.success("Review deleted successfully!", { id: toastId });
                fetchReviews();
            }
        } catch (error) {
            toast.error("Delete failed", { id: toastId });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return (
            <div className="flex flex-col text-[11px]">
                <span>{date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                <span>{date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        );
    };

    const renderItemInfo = (review) => {
        const itemData = review.itemId;
        if (itemData && itemData.title) {
            return (
                <div className="flex flex-col">
                    <span className="font-bold text-primary text-[12px]">{itemData.title}</span>
                    <span className="text-[10px] text-gray-400 font-mono truncate w-20">{itemData._id}</span>
                </div>
            );
        }
        if (itemData && itemData._id) {
            return <span className="font-mono text-[10px]">{itemData._id}</span>;
        }
        return <span className="text-gray-400 italic">-</span>;
    };

    const filterInputClass = "w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main font-montserrat border border-transparent focus:border-primary transition-all";

    return (
        <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

            {/* --- TOP TOOLBAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <button
                    onClick={() => navigate('/admin/add-reviews')}
                    className="w-full md:w-auto bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
                >
                    <Plus size={14} className="text-red-600" /> Add Reviews
                </button>

                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
                        <Download size={14} className="text-accent" /> Export
                    </button>
                    <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
                        <Printer size={14} className="text-green-600" /> Print
                    </button>
                    <button
                        onClick={clearFilters}
                        className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
                    >
                        Clear filters
                    </button>
                    <div className="relative flex items-center">
                        <button onClick={fetchReviews} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
                            <Search size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse text-sm">
                        <thead>
                            <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                                <th className="p-3 text-center w-20 border-r border-white/20">#</th>
                                <th className="p-3 text-left border-r border-white/20 w-24">Item info</th>
                                <th className="p-3 text-left border-r border-white/20 w-40">User Name</th>
                                <th className="p-3 text-left border-r border-white/20">Review</th>
                                <th className="p-3 text-center border-r border-white/20 w-20">Rating</th>
                                <th className="p-3 text-center border-r border-white/20 w-20">Status</th>
                                <th className="p-3 text-left border-r border-white/20 w-32">Created at</th>
                                <th className="p-3 text-center w-24">Actions</th>
                            </tr>

                            {/* 🟢 Filter Row */}
                            <tr className="bg-primary border-b border-cream-200">
                                <td className="p-2 border-r border-white/20">
                                    <div className="flex items-center gap-2 px-1">
                                        <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer shrink-0" />
                                        <input name="id" value={filters.id} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="ID" />
                                    </div>
                                </td>
                                <td className="p-2 border-r border-white/20">
                                    <input name="itemId" value={filters.itemId} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Item ID" />
                                </td>
                                <td className="p-2 border-r border-white/20">
                                    <input name="name" value={filters.name} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Name" />
                                </td>
                                <td className="p-2 border-r border-white/20">
                                    <input name="review" value={filters.review} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Review" />
                                </td>
                                <td className="p-2 border-r border-white/20">
                                    <input name="rating" value={filters.rating} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Rating" />
                                </td>
                                <td className="p-2 border-r border-white/20">
                                    <input name="status" value={filters.status} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Status" />
                                </td>
                                <td className="p-2 border-r border-white/20">
                                    <input name="date" value={filters.date} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="DD/MM/YYYY" />
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={fetchReviews} className="text-white hover:rotate-180 transition-transform duration-500">
                                        <RotateCw size={16} />
                                    </button>
                                </td>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-cream-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-text-muted font-bold">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="animate-spin text-primary" /> Loading Reviews...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReviews.length > 0 ? (
                                filteredReviews.map((item, index) => (
                                    <tr key={item._id} className="hover:bg-primary-50 transition-colors text-[13px]">
                                        <td className="p-3 border-r border-cream-50">
                                            <div className="flex items-center gap-3 px-1">
                                                <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                                                <span className="text-text-muted text-xs font-bold w-full text-center">{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 border-r border-cream-50 text-text-main">
                                            {renderItemInfo(item)}
                                        </td>
                                        <td className="p-3 border-r border-cream-50 text-text-main font-medium">{item.name}</td>
                                        <td className="p-3 border-r border-cream-50 text-text-main text-[11px] leading-relaxed max-w-xs">
                                            {item.review ? (item.review.length > 80 ? `${item.review.substring(0, 80)}...` : item.review) : '-'}
                                        </td>
                                        <td className="p-3 border-r border-cream-50 text-text-main text-center font-bold ">
                                            {item.rating || '0'} ★
                                        </td>
                                        <td className="p-3 border-r border-cream-50 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-3 border-r border-cream-50 text-text-main">
                                            {formatDate(item.createdAt)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/edit-reviews/${item._id}`)}
                                                    className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-text-muted italic font-montserrat">No reviews found matching filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- FOOTER / PAGINATION --- */}
                <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat">
                    <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
                        Displaying {filteredReviews.length} of {reviews.length} items
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronLeft size={16} /></button>
                        <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden">
                            <input type="text" value="1" readOnly className="w-8 text-center text-xs border-none p-1.5 font-bold bg-cream-50 text-text-main" />
                        </div>
                        <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewsList;