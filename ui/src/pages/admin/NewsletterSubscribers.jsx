import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, Mail,
  Filter, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { dedupeByTitle } from '../../utils/categoryUtils';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel.js';
import { useConfirm } from '../../context/ConfirmContext.jsx';

const NewsletterSubscribers = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState({ id: '', email: '' });
  const searchDebounceRef = useRef(null);

  // Category tree filter
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [appliedCategoryFilters, setAppliedCategoryFilters] = useState([]);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [expandedMainCats, setExpandedMainCats] = useState({});
  const [catLoading, setCatLoading] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // Fetch categories for the filter tree
  useEffect(() => {
    const loadCategories = async () => {
      setCatLoading(true);
      try {
        const [mainRes, subRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/category/fetch?withProducts=true`),
          axios.get(`${API_BASE_URL}/subcategory/fetch`)
        ]);
        if (mainRes.data.status) {
          const cats = dedupeByTitle(mainRes.data.data || []);
          setMainCategories(cats);
          const allExpanded = {};
          cats.forEach(c => { allExpanded[c.id] = true; });
          setExpandedMainCats(allExpanded);
        }
        if (subRes.data.status) setSubCategories(subRes.data.data || []);
      } catch {
        // ignore
      } finally {
        setCatLoading(false);
      }
    };
    loadCategories();
  }, [API_BASE_URL]);

  // Subcategories grouped by main category id
  const subsByMainCat = useMemo(() => {
    const map = {};
    subCategories.forEach(s => {
      if (!map[s.categoryId]) map[s.categoryId] = [];
      map[s.categoryId].push(s);
    });
    return map;
  }, [subCategories]);

  const fetchSubscribers = async (isExport = false, catOverride = null, searchOverride = undefined) => {
    if (!isExport) setLoading(true);
    try {
      const cats = catOverride !== null ? catOverride : appliedCategoryFilters;
      const searchVal = searchOverride !== undefined ? searchOverride : filters.email;
      const params = new URLSearchParams();
      params.append('page', isExport ? 1 : currentPage);
      params.append('limit', isExport ? 100000 : itemsPerPage);
      if (cats.length > 0) params.append('categories', cats.join(','));
      if (searchVal) params.append('search', searchVal);

      const res = await axios.get(`${API_BASE_URL}/newsletter-subs/list?${params.toString()}`);
      if (res.data.status) {
        if (isExport) return res.data.data;
        setSubscribers(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch {
      toast.error('Failed to load subscribers');
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, appliedCategoryFilters]);

  const handleApplyCategoryFilter = () => {
    setAppliedCategoryFilters([...selectedCategoryFilters]);
    setCurrentPage(1);
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategoryFilters([]);
    setAppliedCategoryFilters([]);
    setCurrentPage(1);
  };

  const toggleCategoryItem = (name) => {
    setSelectedCategoryFilters(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const toggleMainCatExpand = (id) => {
    setExpandedMainCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = async () => {
    const toastId = toast.loading('Preparing Excel file...');
    try {
      const allData = await fetchSubscribers(true);
      if (!allData || allData.length === 0) return toast.error('No data', { id: toastId });

      const dataToExport = allData.map((item, i) => ({
        'Sr No': i + 1,
        'Email': item.email,
        'First Name': item.firstName || item.firstname || '-',
        'Last Name': item.lastName || item.lastname || '-',
        'Categories': Array.isArray(item.categories) ? item.categories.join(', ') : (item.categories || ''),
        'Subscribed Date': new Date(item.createdAt).toLocaleDateString('en-GB')
      }));

      await exportToExcel(dataToExport, 'Subscribers', 'Newsletter_Subscribers');
      toast.success('Excel exported successfully!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    }
  };

  const handlePrint = () => window.print();

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((item) => {
      const displayId = (item.id || '').toString();
      return displayId.includes(filters.id);
    });
  }, [subscribers, filters.id]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setCurrentPage(1);
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        fetchSubscribers(false, null, value);
      }, 400);
    }
  };

  const clearFilters = () => {
    setFilters({ id: '', email: '' });
    fetchSubscribers(false, null, '');
  };

  const handleDelete = async (id) => {
    if (!(await confirm())) return;
    const toastId = toast.loading('Deleting...');
    try {
      const res = await axios.delete(`${API_BASE_URL}/newsletter-subs/delete/${id}`);
      if (res.data.status) {
        toast.success('Subscriber deleted successfully!', { id: toastId });
        fetchSubscribers();
      }
    } catch {
      toast.error('Delete failed', { id: toastId });
    }
  };

  const filterInputClass = 'w-full rounded-[4px] px-2 py-1.5 text-xs outline-none text-gray-700 font-montserrat shadow-inner focus:ring-2 focus:ring-blue-300';

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => navigate('/admin/add-newsletter-subscriber')}
            className="bg-[#f8f9fa] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
          >
            <Plus size={14} className="text-red-600" /> Add Newsletter subscribers
          </button>
          <button
            onClick={() => navigate('/admin/send-email')}
            className="bg-[#e9ecef] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
          >
            <Mail size={14} className="text-gray-600" /> Send Newsletters
          </button>
          <button
            onClick={() => navigate('/admin/newsletter-report')}
            className="bg-[#e9ecef] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
          >
            <RotateCw size={14} className="text-blue-600" /> Reports
          </button>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setCategoryPanelOpen(v => !v)}
            className={`border px-4 py-1.5 rounded shadow-sm flex items-center gap-2 text-xs font-montserrat font-bold transition-colors ${appliedCategoryFilters.length > 0 ? 'bg-primary text-white border-primary' : 'bg-[#f8f9fa] border-gray-300 text-gray-700 hover:bg-white'}`}
          >
            <Filter size={14} /> Filter by Category
            {appliedCategoryFilters.length > 0 && (
              <span className="bg-white text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">{appliedCategoryFilters.length}</span>
            )}
          </button>
          <button onClick={handleExport} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-orange-500" /> Export
          </button>
          <button onClick={handlePrint} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button onClick={clearFilters} className="bg-[#f8f9fa] border border-gray-300 text-gray-500 px-4 py-1.5 rounded shadow-sm hover:text-red-500 hover:border-red-200 flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
            Clear filters
          </button>
          <div className="relative flex items-center">
            <input
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              type="text"
              placeholder="Search subscribers by email…"
              className="border border-gray-300 border-r-0 rounded-l px-3 py-1.5 text-xs outline-none focus:border-primary w-44 md:w-60"
            />
            <button onClick={() => fetchSubscribers()} className="bg-primary text-white p-2 rounded-r hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER PANEL */}
      {categoryPanelOpen && (
        <div className="bg-white rounded border border-gray-200 shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide font-montserrat flex items-center gap-2">
              <Filter size={13} /> Filter Subscribers by Category / Sub-Category
            </h3>
            <button onClick={() => setCategoryPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="p-4">
            {catLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <Loader2 size={16} className="animate-spin" /> Loading categories...
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={catSearchQuery}
                    onChange={(e) => setCatSearchQuery(e.target.value)}
                    placeholder="Search categories & subcategories..."
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-primary font-montserrat"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                  {mainCategories.filter(cat => {
                    const catName = (cat.title || cat.categorytitle || '').toLowerCase();
                    const q = catSearchQuery.toLowerCase();
                    if (!q) return true;
                    if (catName.includes(q)) return true;
                    return (subsByMainCat[cat.id] || []).some(s => (s.name || s.subcategoryname || '').toLowerCase().includes(q));
                  }).map(cat => {
                    const catName = cat.title || cat.categorytitle || '';
                    const allSubs = subsByMainCat[cat.id] || [];
                    const subs = allSubs.filter(s =>
                      !catSearchQuery || (s.name || s.subcategoryname || '').toLowerCase().includes(catSearchQuery.toLowerCase()) || catName.toLowerCase().includes(catSearchQuery.toLowerCase())
                    );
                    const isExpanded = expandedMainCats[cat.id] || !!catSearchQuery;
                    const isMainChecked = selectedCategoryFilters.includes(catName);
                    return (
                      <div key={cat.id} className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isMainChecked}
                              onChange={() => toggleCategoryItem(catName)}
                              className="accent-primary h-3.5 w-3.5 shrink-0"
                            />
                            <span className="text-xs font-bold text-gray-700 truncate font-montserrat">{catName}</span>
                          </label>
                          {allSubs.length > 0 && !catSearchQuery && (
                            <button onClick={() => toggleMainCatExpand(cat.id)} className="ml-1 text-gray-400 hover:text-primary shrink-0">
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>
                        {isExpanded && subs.length > 0 && (
                          <div className="px-3 py-2 space-y-1.5 border-t border-gray-100">
                            {subs.map(sub => {
                              const subName = sub.name || sub.subcategoryname || '';
                              const isSubChecked = selectedCategoryFilters.includes(subName);
                              return (
                                <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSubChecked}
                                    onChange={() => toggleCategoryItem(subName)}
                                    className="accent-primary h-3 w-3 shrink-0"
                                  />
                                  <span className="text-[11px] text-gray-600 truncate font-montserrat">{subName}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedCategoryFilters.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedCategoryFilters.map(c => (
                      <span key={c} className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1 font-montserrat">
                        {c}
                        <button onClick={() => toggleCategoryItem(c)} className="hover:text-red-500 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleApplyCategoryFilter}
                    className="bg-primary text-white px-5 py-2 rounded font-montserrat font-bold text-xs uppercase shadow-sm hover:bg-primary-hover transition-all active:scale-95"
                  >
                    <Search size={12} className="inline mr-1.5 -mt-0.5" /> Search
                  </button>
                  {appliedCategoryFilters.length > 0 && (
                    <button
                      onClick={handleClearCategoryFilter}
                      className="bg-white border border-gray-300 text-gray-600 px-5 py-2 rounded font-montserrat font-bold text-xs uppercase shadow-sm hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Clear Filter
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedCategoryFilters(mainCategories.map(c => c.title || c.categorytitle || '')); }}
                    className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-montserrat font-bold text-xs uppercase shadow-sm hover:bg-gray-50 transition-all"
                  >
                    Select All
                  </button>
                </div>

                {appliedCategoryFilters.length > 0 && (
                  <p className="mt-2 text-[11px] text-primary font-montserrat font-bold">
                    Showing subscribers from: {appliedCategoryFilters.join(', ')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Email</th>
                <th className="p-3 text-left border-r border-white/20">Categories</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>
              <tr className="bg-primary border-b border-gray-200">
                <td className="p-2 border-r border-white/20">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded accent-white cursor-pointer shrink-0 opacity-50" />
                    <input name="id" value={filters.id} onChange={handleFilterChange} type="text" className={filterInputClass} />
                  </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="email" value={filters.email} onChange={handleFilterChange} type="text" className={filterInputClass} />
                </td>
                <td className="p-2 border-r border-white/20">
                  <span className="text-[10px] text-white/60 font-montserrat italic">Use "Filter by Category" panel above</span>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => fetchSubscribers()} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-500 font-bold">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-primary" /> Loading Subscribers...
                    </div>
                  </td>
                </tr>
              ) : filteredSubscribers.length > 0 ? (
                filteredSubscribers.map((item, index) => (
                  <tr key={item.id || item._id} className="hover:bg-blue-50/30 transition-colors text-[13px] group">
                    <td className="p-3 border-r border-gray-100">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0 border-gray-300" />
                        <span className="text-gray-500 text-xs font-mono">{index + 1}</span>
                      </div>
                    </td>
                    <td className="p-3 border-r border-gray-100 text-gray-700 font-medium">{item.email}</td>
                    <td className="p-3 border-r border-gray-100 text-gray-600">
                      {Array.isArray(item.categories) ? item.categories.join(', ') : item.categories}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/edit-newsletter-subscriber/${item.id || item._id}`)}
                          className="p-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500 hover:bg-white hover:text-primary hover:border-primary transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item._id)}
                          className="p-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500 hover:bg-white hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
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
                  <td colSpan="4" className="p-10 text-center text-gray-400 italic font-montserrat">No matching subscribers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm no-print">
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-cream-200 rounded px-2 py-1 outline-none focus:border-primary bg-cream-50 text-xs text-primary font-bold cursor-pointer transition-all shadow-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-text-muted uppercase text-[10px] tracking-wide">entries</span>
          </div>
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
            Displaying {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"><ChevronLeft size={16} /></button>
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">{currentPage}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm transition-all"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSubscribers;
