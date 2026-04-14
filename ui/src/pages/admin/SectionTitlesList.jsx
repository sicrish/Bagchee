'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download, Printer, Search, RotateCw, Plus,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Settings, Loader2, Save, LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const SectionTitlesList = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // ट्रैक करेगा कि डेटा बदला है या नहीं

  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    section: "",
    title: "",
    tagline: ""
  });


  const handleTaglineChange = (index, newValue) => {
    const updatedSections = [...sections];
    updatedSections[index].tagline = newValue;
    setSections(updatedSections);
    setIsDirty(true);
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/home-sections/list`);
      if (res.data.status) {
        setSections(res.data.data);
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load home sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // 🟢 2. Inline Title Change logic (Update in Local State)
  const handleTitleChange = (index, newValue) => {
    const updatedSections = [...sections];
    updatedSections[index].title = newValue;
    setSections(updatedSections);
    setIsDirty(true);
  };

  // 🟢 3. Bulk Save Logic
  const handleBulkSave = async () => {
    if (!isDirty) return toast.error("No changes detected to save!");
    setSaveLoading(true);
    const toastId = toast.loading("Updating sections...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Sends the entire sections array including updated taglines
      const res = await axios.post(`${API_URL}/home-sections/bulk-update`, { sections });
      if (res.data.status) {
        toast.success("All sections updated! ✨", { id: toastId });
        setIsDirty(false);
      }
    } catch (error) {
      toast.error("Failed to save changes", { id: toastId });
    } finally {
      setSaveLoading(false);
    }
  };

 // 🟢 4. Delete Logic
 const handleDelete = async (id) => {
  const toastId = toast.loading("Deleting...");
  try {
    const API_URL = process.env.REACT_APP_API_URL;
    const res = await axios.delete(`${API_URL}/home-sections/delete/${id}`);
    if (res.data.status) {
      toast.success("Deleted successfully!", { id: toastId });
      fetchSections(); // Refresh list
    }
  } catch (error) {
    toast.error("Delete failed", { id: toastId });
  }
};

  // 🟢 5. Filtering Logic
  const filteredSections = useMemo(() => {
    return sections.filter((item) => {
      return (
        (item.section || "").toLowerCase().includes(filters.section.toLowerCase()) &&
        (item.title || "").toLowerCase().includes(filters.title.toLowerCase()) &&
        (item.tagline || "").toLowerCase().includes(filters.tagline.toLowerCase()) // 🟢 Filter logic
      );
    });
  }, [sections, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ section: "", title: "", tagline: "" });
  };

  const filterInputClass = "w-full rounded p-1 text-[11px] outline-none text-text-main border border-transparent focus:border-white/50 bg-white/20 placeholder-white/50 text-white font-body";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main pb-20">

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* ➕ ADD SECTION BUTTON */}
          <button 
            onClick={() => navigate('/admin/add-home-section')} 
            className="bg-primary text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus size={16} /> Add Section
          </button>

          {/* 💾 SAVE CHANGES BUTTON (Only shows when data changes) */}
          {isDirty && (
            <button 
              onClick={handleBulkSave}
              disabled={saveLoading}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-bold text-xs uppercase hover:bg-green-700 active:scale-95 transition-all animate-pulse"
            >
              {saveLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              Save All Changes
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-1.5 rounded-xl shadow-sm hover:bg-gray-50 flex items-center gap-2 text-xs font-bold transition-colors">
            <Download size={14} className="text-orange-400" /> Export
          </button>
          <button 
            onClick={clearFilters}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-1.5 rounded-xl shadow-sm hover:text-red-500 transition-all flex items-center gap-2 text-xs font-bold uppercase"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchSections} className="bg-primary text-white p-2 rounded-xl hover:brightness-110 transition-all shadow-sm group">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xl animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-bold uppercase tracking-widest text-[10px] font-display">
                <th className="p-4 text-left border-r border-white/20 w-1/3">Section Category</th>
                <th className="p-4 text-left border-r border-white/20">Title (Editable)</th>
                <th className="p-4 text-left border-r border-white/20 w-1/3">Tagline (Editable)</th> 
                <th className="p-4 text-center w-32">Actions</th>
              </tr>

              {/* 🟢 Filter Row */}
              <tr className="bg-primary border-b border-gray-200">
                <td className="p-2 border-r border-white/20">
                  <input name="section" value={filters.section} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Section..." />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="title" value={filters.title} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Title..." />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="tagline" value={filters.tagline} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Filter Tagline..." />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchSections} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-20 text-center">
                    <Loader2 className="animate-spin text-primary inline-block mb-2" size={32} />
                    <p className="text-xs font-bold text-gray-400 uppercase">Loading Sections...</p>
                  </td>
                </tr>
              ) : filteredSections.length > 0 ? (
                filteredSections.map((item, index) => (
                  <tr key={item.id || item._id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-4 border-r text-gray-500 font-mono text-xs font-bold uppercase tracking-tighter">
                      {item.section}
                    </td>
                    <td className="p-3 border-r">
                      {/* 🟢 Editable Title Input */}
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={(e) => handleTitleChange(index, e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[14px] font-bold text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                      />
                    </td>
                    {/* 🟢 Tagline Input */}
                    <td className="p-3 border-r">
                      <input 
                        type="text" 
                        value={item.tagline || ""} 
                        onChange={(e) => handleTaglineChange(index, e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[13px] text-blue-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                        placeholder="Enter Tagline..."
                      />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => navigate(`/admin/edit-home-section/${item.id || item._id}`)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Full Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
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
                  <td colSpan="3" className="p-20 text-center text-gray-400 italic font-bold">No matching sections found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-primary/5 border-t border-cream-200 flex items-center gap-2">
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                Direct Inline Edit Enabled | Total Records: {filteredSections.length}
             </span>
        </div>
      </div>
    </div>
  );
};

export default SectionTitlesList;