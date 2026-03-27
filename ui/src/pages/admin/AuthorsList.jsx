'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const AuthorsList = () => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default entries
  const [totalItems, setTotalItems] = useState(0);

  // 🔍 Filter States for Live Search
  const [searchFirstName, setSearchFirstName] = useState("");
  const [searchLastName, setSearchLastName] = useState("");


  // 🟢 2. Working Fetch Function
  const fetchAuthors = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      // Pagination logic
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      // Search Logic
      if (searchFirstName || searchLastName) {
        params.append("q", `${searchFirstName} ${searchLastName}`.trim());
      }

      const res = await axios.get(`${API_BASE_URL}/authors/list?${params.toString()}`);
      if (res.data.status) {
        if (isExport) return res.data.data;
        setAuthors(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      if (!isExport) setAuthors([]);
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchAuthors();
  }, []);


  // 🟢 3. Excel Export Logic
  const handleExport = async () => {
    const toastId = toast.loading("Preparing authors data...");
    try {
      const allData = await fetchAuthors(true);
      if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

      const dataToExport = allData.map((a, i) => ({
        "Sr No": i + 1,
        "First Name": a.firstName,
        "Last Name": a.lastName,
        "Origin": a.origin || "-",
        "Profile Bio": a.profile?.replace(/<[^>]*>?/gm, '') || "-" // HTML tags remove
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Authors");
      XLSX.writeFile(workbook, `Authors_Report_${Date.now()}.xlsx`);
      toast.success("Export successful! 📊", { id: toastId });
    } catch (error) {
      toast.error("Export failed", { id: toastId });
    }
  };

  const handlePrint = () => window.print();


  // 🔴 2. Delete Author Logic with Confirmation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this author?")) return;

    const toastId = toast.loading("Processing deletion...");
    try {
      const res = await axios.delete(`${API_BASE_URL}/authors/delete/${id}`);
      if (res.data.status) {
        toast.success("Author removed successfully! ✨", { id: toastId });
        fetchAuthors();
      }
    } catch (error) {
      toast.error("Operation failed", { id: toastId });
    }
  };

  // 🔍 3. Live Filtering Logic (MNC Level Optimization)
  const filteredAuthors = useMemo(() => {
    return authors.filter(author =>
      author.firstName?.toLowerCase().includes(searchFirstName.toLowerCase()) &&
      author.lastName?.toLowerCase().includes(searchLastName.toLowerCase())
    );
  }, [authors, searchFirstName, searchLastName]);

  const filterInputClass = "w-full rounded p-1 text-[11px] outline-none bg-white/90 focus:bg-white text-text-main font-semibold shadow-inner border-none placeholder:text-gray-400";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/add-authors')}
          className="w-full md:w-auto bg-primary text-white hover:brightness-110 px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={16} /> Add New Author
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={fetchAuthors} className="bg-white border border-cream-300 p-2 rounded-lg text-primary hover:bg-gray-50 transition-all shadow-sm group">
            <RotateCw size={16} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          <button onClick={handleExport} className="bg-white border border-cream-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm hover:bg-gray-50">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button onClick={handlePrint} className="bg-white border border-cream-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm hover:bg-gray-50">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
            onClick={() => { setSearchFirstName(""); setSearchLastName(""); fetchAuthors(); }}
            className="bg-white border border-cream-300 text-gray-500 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter hover:text-red-500 transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xl animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              {/* Main Header Strip */}
              <tr className="bg-primary text-white font-montserrat font-bold uppercase tracking-widest text-[10px]">
                <th className="p-4 text-center w-24 border-r border-white/10">Ref.</th>
                <th className="p-4 text-left border-r border-white/10">First Name</th>
                <th className="p-4 text-left border-r border-white/10">Last Name</th>
                <th className="p-4 text-center w-32">Actions</th>
              </tr>

              {/* 🟢 Professional Filter Row */}
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
                    placeholder="Search first name..."
                    value={searchFirstName}
                    onChange={(e) => setSearchFirstName(e.target.value)}
                  />
                </td>
                <td className="p-2 border-r border-white/10">
                  <input
                    type="text"
                    className={filterInputClass}
                    placeholder="Search last name..."
                    value={searchLastName}
                    onChange={(e) => setSearchLastName(e.target.value)}
                  />
                </td>
                <td className="p-2 text-center text-white/50">
                  <Search size={14} className="inline" />
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing with database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAuthors.length > 0 ? (
                filteredAuthors.map((author, index) => (
                  <tr key={author.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-4 border-r border-gray-50 text-center font-mono text-xs text-gray-400">
                      {index + 1}
                    </td>
                    <td className="p-4 border-r border-gray-50 text-text-main font-bold tracking-tight uppercase">
                      {author.firstName}
                    </td>
                    <td className="p-4 border-r border-gray-50 text-text-main font-bold tracking-tight uppercase">
                      {author.lastName}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/edit-author/${author.id}`)}
                          className="p-2 bg-white border border-gray-200 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                          title="Edit Author"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(author.id)}
                          className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete Author"
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
                      <UserCircle size={48} className="mb-2 text-gray-300" />
                      <p className="text-sm font-bold text-gray-500 italic font-montserrat">No authors match your current search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FOOTER / PAGINATION --- */}
      <div className="mt-6 p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm rounded-xl">

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
          Displaying {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} authors
        </div>

        {/* 3. Navigation Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 bg-white"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 bg-white"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md mx-1">
            {currentPage}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 bg-white"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 transition-all active:scale-90 bg-white"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorsList;