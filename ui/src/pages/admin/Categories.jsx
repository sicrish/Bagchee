import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Printer, Download, Edit, Trash2,
    RotateCcw, Filter, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';

const Categories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🟢 1. Pagination States Add Karein
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // --- Filter States (One for each column as per image) ---
    const [filters, setFilters] = useState({
        id: "",
        title: "",
        slug: "",
        parentSlug: "",
        metaTitle: "",
        productType: "",
        newsletter: "",
        order: ""
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    // 🟢 1. Fetch Categories
    const fetchCategories = async (isExport = false) => {
        if (!isExport) setLoading(true);
        try {
            const API_URL = process.env.REACT_APP_API_URL;

            // Agar export mode hai toh limit bypass karein, warna pagination use karein
            const url = isExport
                ? `${API_URL}/category/fetch?limit=100000`
                : `${API_URL}/category/fetch?page=${currentPage}&limit=${itemsPerPage}`;

            const response = await axios.get(url);
            if (response.data.status) {
                if (isExport) return response.data.data; // Export ke liye data return karo
                setCategories(response.data.data);
                setTotalPages(response.data.totalPages || 1);
                setTotalItems(response.data.total || response.data.data.length);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load categories");
        } finally {
            if (!isExport) setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [currentPage, itemsPerPage]);


    // 🟢 3. Excel Export Logic (Matched with Model)
    const handleExport = async () => {
        const toastId = toast.loading("Fetching data for export...");
        try {
            const allData = await fetchCategories(true);
            if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

            const dataToExport = allData.map((cat, index) => ({
                "Sr No": index + 1,
                "Category ID": cat.oldid || cat._id,
                "Title": cat.categorytitle,
                "Slug": cat.slug,
                "Parent Slug": cat.parentslug || "Root",
                "Meta Title": cat.metatitle || "-",
                "Product Type": cat.producttype || "Book",
                "Newsletter": cat.newslettercategory || "No",
                "Order": cat.newsletterorder || 0
            }));

            await exportToExcel(dataToExport, "Categories", "Categories_Report");
            toast.success("Excel exported successfully! 📊", { id: toastId });
        } catch (error) {
            toast.error("Export failed", { id: toastId });
        }
    };

    // 🟢 4. Print Logic
    const handlePrint = () => {
        window.print();
    };


    // 🔴 2. Delete Logic
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;

        const toastId = toast.loading("Processing...");
        try {
            const response = await axios.delete(`${API_BASE_URL}/category/delete/${id}`);
            if (response.data.status) {
                toast.success("Category deleted successfully", { id: toastId });
                fetchCategories();
            }
        } catch (error) {
            toast.error("Delete failed", { id: toastId });
        }
    };

    // 🔍 3. Handle Filter Change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // 🔍 4. Filter Logic
    const filteredCategories = useMemo(() => {
        return categories.filter(item => {
            // Safe check for null values before lowercase
            const id = (item.id || item.categoryId || item.id || item._id || "").toString().toLowerCase();
            const title = (item.categorytitle || item.title || "").toLowerCase();
            const slug = (item.slug || "").toLowerCase();
            const parent = (item.parentslug || "").toLowerCase();
            const meta = (item.metatitle || "").toLowerCase();
            const type = (item.producttype || "").toLowerCase();
            const newsletter = (item.newslettercategory || "").toLowerCase();
            const order = (item.newslettercategoryorder || item.order || "0").toString();

            return (
                id.includes(filters.id.toLowerCase()) &&
                title.includes(filters.title.toLowerCase()) &&
                slug.includes(filters.slug.toLowerCase()) &&
                parent.includes(filters.parentSlug.toLowerCase()) &&
                meta.includes(filters.metaTitle.toLowerCase()) &&
                type.includes(filters.productType.toLowerCase()) &&
                newsletter.includes(filters.newsletter.toLowerCase()) &&
                order.includes(filters.order)
            );
        });
    }, [categories, filters]);

    // Common Input Class for Filters
    const filterInputClass = "w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none focus:border-[#0096cc] focus:ring-1 focus:ring-[#0096cc]/20 transition-all";

    return (
        <div className="bg-gray-50 min-h-screen font-body p-4 md:p-6">

            {/* --- TOP ACTIONS BAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">

                {/* Left: Add Button */}
                <button
                    onClick={() => navigate('/admin/add-category')}
                    className="bg-[#f8f9fa] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center gap-2 font-bold text-xs uppercase transition-all"
                >
                    <Plus size={16} className="text-red-600" /> Add Categories
                </button>

                {/* Right: Actions */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <button onClick={handleExport} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-bold">
                        <Download size={14} className="text-orange-500" /> Export
                    </button>
                    <button onClick={handlePrint} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-bold">
                        <Printer size={14} className="text-green-600" /> Print
                    </button>
                    <button
                        onClick={() => setFilters({
                            id: "", title: "", slug: "", parentSlug: "", metaTitle: "", productType: "", newsletter: "", order: ""
                        })}
                        className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white text-xs font-bold"
                    >
                        Clear filters
                    </button>

                    {/* Global Search */}
                    <div className="flex">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="border border-r-0 border-gray-300 rounded-l px-3 py-1.5 text-xs outline-none focus:border-[#0096cc]"
                        />
                        <button className="bg-[#0096cc] text-white px-3 py-1.5 rounded-r hover:bg-[#007bb5]">
                            <Search size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse">

                    {/* 1. Header Row (Blue) */}
                    <thead>
                        <tr className="bg-[#0096cc] text-white text-[11px] font-bold uppercase tracking-tight">
                            <th className="p-3 text-center border-r border-white/20 w-10">
                                <input type="checkbox" className="accent-white" />
                            </th>
                            <th className="p-3 text-left border-r border-white/20">Category id</th>
                            <th className="p-3 text-left border-r border-white/20">Category title</th>
                            <th className="p-3 text-left border-r border-white/20">Slug</th>
                            <th className="p-3 text-left border-r border-white/20">Parents slug</th>
                            <th className="p-3 text-left border-r border-white/20">Meta title</th>
                            <th className="p-3 text-left border-r border-white/20">Product type</th>
                            <th className="p-3 text-left border-r border-white/20">Newsletter category</th>
                            <th className="p-3 text-left border-r border-white/20">Newsletter category order</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>

                        {/* 2. Filter Row (White with Inputs) */}
                        <tr className="bg-white border-b border-gray-200">
                            <td className="p-2 border-r border-gray-200 text-center">
                                <input type="checkbox" className="accent-[#0096cc]" />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="id" value={filters.id} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="title" value={filters.title} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="slug" value={filters.slug} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="parentSlug" value={filters.parentSlug} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="metaTitle" value={filters.metaTitle} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="productType" value={filters.productType} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="newsletter" value={filters.newsletter} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                                <input name="order" value={filters.order} onChange={handleFilterChange} className={filterInputClass} />
                            </td>
                            <td className="p-2 text-center bg-gray-50">
                                <button onClick={fetchCategories} className="text-[#0096cc] hover:rotate-180 transition-transform duration-300">
                                    <RotateCcw size={16} />
                                </button>
                            </td>
                        </tr>
                    </thead>

                    {/* 3. Data Body */}
                    <tbody className="divide-y divide-gray-200 text-[#333] text-[12px]">
                        {loading ? (
                            <tr>
                                <td colSpan="10" className="p-10 text-center">
                                    <div className="flex justify-center items-center gap-2 text-gray-500">
                                        <Loader2 className="animate-spin text-[#0096cc]" size={24} /> Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredCategories.length > 0 ? (
                            filteredCategories.map((item, index) => (
                                <tr key={item.id || item._id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-3 border-r border-gray-200 text-center">
                                        <input type="checkbox" className="accent-[#0096cc]" />
                                    </td>

                                    {/* ID (Using Index + 1 or actual ID if short) */}
                                    <td className="p-3 border-r border-gray-200">{index + 1}</td>

                                    <td className="p-3 border-r border-gray-200 font-medium">
                                        {item.categorytitle || item.title}
                                    </td>

                                    <td className="p-3 border-r border-gray-200">{item.slug}</td>

                                    <td className="p-3 border-r border-gray-200 text-gray-500">
                                        {item.parentslug || item.parentSlug|| "root-category"}
                                    </td>

                                    <td className="p-3 border-r border-gray-200 text-gray-500">
                                        {item.metaTitle ||item.metatitle || item.categorytitle}
                                    </td>

                                    <td className="p-3 border-r border-gray-200">
                                        {item.producttype || "Books"}
                                    </td>

                                    <td className="p-3 border-r border-gray-200">
                                        {item.newslettercategory || "No"}
                                    </td>

                                    <td className="p-3 border-r border-gray-200">
                                        {item.newslettercategoryorder || "0"}
                                    </td>

                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/edit-category/${item.id || item._id}`)}
                                                className="p-1.5 bg-gray-100 border border-gray-300 rounded text-gray-600 hover:bg-white hover:text-[#0096cc] transition-all shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id || item._id)}
                                                className="p-1.5 bg-gray-100 border border-gray-300 rounded text-red-500 hover:bg-white hover:border-red-200 transition-all shadow-sm"
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
                                <td colSpan="10" className="p-8 text-center text-gray-400 italic">
                                    No categories found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- FOOTER / PAGINATION --- */}
            {/* --- FOOTER / PAGINATION --- */}
            <div className="mt-4 p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm">

                {/* 1. Show Entries Dropdown */}
                <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
                    <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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

                    {/* Current Page Indicator */}
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
    );
};

export default Categories;