import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const MetaTagsList = () => {
  const navigate = useNavigate();
  
  // --- States ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🟢 Backend Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0
  });

  // 🟢 Filter State (Matches Screenshot Columns)
  const [filters, setFilters] = useState({
    pageUrl: "",   // 'Page' column
    title: "",     // 'Title' column
    metaTitle: ""  // 'Meta title' column
  });

  // 🟢 1. Main Fetch Logic (Backend Pagination)
  const fetchMetaTags = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      
      // Backend ko Page, Limit aur Filters bhej rahe hain
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const res = await axios.get(`${API_URL}/meta-tags/list`, { params });
      
      if (res.data.status) {
        setData(res.data.data); // Sirf current page ka data
        setPagination(prev => ({
          ...prev,
          total: res.data.total || 0 // Total count from DB
        }));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load meta tags");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]); // Re-run when page/limit changes

  // Initial Load
  useEffect(() => {
    fetchMetaTags();
  }, [fetchMetaTags]);

  // 🟢 2. Handlers
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Search on Enter Key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
      fetchMetaTags();
    }
  };

  // Refresh Button Logic
  const handleRefresh = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchMetaTags();
  };

  const clearFilters = () => {
    setFilters({ pageUrl: "", title: "", metaTitle: "" });
    setPagination(prev => ({ ...prev, page: 1 }));
    // State update async hoti hai, isliye timeout use kiya taaki turant naye filters le le
    setTimeout(() => fetchMetaTags(), 0); 
  };

  // 🟢 3. Consolidated Data Fetcher for Export & Print
  // Ye function alag se banaya hai taaki Export aur Print dono isey use kar sakein
  const fetchAllDataForReports = async () => {
    const toastId = toast.loading("Generating report data...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Limit high set karke saara data mangwa rahe hain
      const params = { ...filters, page: 1, limit: 100000 }; 
      const res = await axios.get(`${API_URL}/meta-tags/list`, { params });
      
      if (res.data.status && res.data.data) {
        toast.dismiss(toastId);
        return res.data.data;
      }
      return [];
    } catch (error) {
      toast.error("Failed to fetch report data", { id: toastId });
      return [];
    }
  };

  // Export Logic (Uses Consolidated Fetcher)
  const handleExport = async () => {
    const allData = await fetchAllDataForReports();
    if (!allData.length) return;

    const exportData = allData.map((item, index) => ({
      "#": index + 1,
      "Page": item.pageUrl,
      "Title": item.title,
      "Meta Title": item.metaTitle
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MetaTags");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, `MetaTags_List.xlsx`);
    toast.success("Export successful!");
  };

  // Print Logic (Uses Consolidated Fetcher)
  const handlePrint = async () => {
    const allData = await fetchAllDataForReports();
    if (!allData.length) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Meta Tags List</title>');
    printWindow.document.write('<style>table{width:100%;border-collapse:collapse;font-family:sans-serif;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;} th{background-color:#f2f2f2;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Meta Tags Report</h2>');
    
    let tableHtml = '<table><thead><tr><th>#</th><th>Page</th><th>Title</th><th>Meta Title</th></tr></thead><tbody>';
    allData.forEach((item, index) => {
      tableHtml += `<tr>
        <td>${index + 1}</td>
        <td>${item.pageUrl}</td>
        <td>${item.title}</td>
        <td>${item.metaTitle}</td>
      </tr>`;
    });
    tableHtml += '</tbody></table></body></html>';
    
    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this meta tag?")) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/meta-tags/delete/${id}`); 
      if (res.data.status) {
        toast.success("Deleted successfully!");
        fetchMetaTags(); // Reload current page
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // --- Pagination Calculation Helpers ---
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  const filterInputClass = "w-full rounded-[4px] px-2 py-1.5 text-xs outline-none text-gray-700 font-montserrat shadow-inner focus:ring-2 focus:ring-blue-300 transition-all";

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        
        {/* Left Actions */}
        <button 
          onClick={() => navigate('/admin/add-meta-tag')} 
          className="bg-[#f8f9fa] border border-gray-300 text-gray-700 hover:bg-white px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Meta Tag
        </button>

        {/* Right Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={handleExport} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-orange-500" /> Export
          </button>
          <button onClick={handlePrint} className="bg-[#f8f9fa] border border-gray-300 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-white flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button 
            onClick={clearFilters}
            className="bg-[#f8f9fa] border border-gray-300 text-gray-500 px-4 py-1.5 rounded shadow-sm hover:text-red-500 hover:border-red-200 flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={handleRefresh} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              {/* Header Titles */}
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold text-[11px]">
                <th className="p-3 text-center w-20 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Page</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20">Meta title</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* Filter Inputs */}
              <tr className="bg-primary border-b border-gray-200">
                <td className="p-2 border-r border-white/20">
                   {/* Checkbox only, no ID search usually needed for Meta */}
                   <div className="flex justify-center">
                      <input type="checkbox" className="h-4 w-4 rounded accent-white cursor-pointer opacity-50" />
                   </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="pageUrl" value={filters.pageUrl} onChange={handleFilterChange} onKeyDown={handleKeyDown} className={filterInputClass} placeholder="Filter Page" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="title" value={filters.title} onChange={handleFilterChange} onKeyDown={handleKeyDown} className={filterInputClass} placeholder="Filter Title" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input name="metaTitle" value={filters.metaTitle} onChange={handleFilterChange} onKeyDown={handleKeyDown} className={filterInputClass} placeholder="Filter Meta Title" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={handleRefresh} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 font-bold">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-primary" /> Loading Data...
                    </div>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item._id} className="hover:bg-blue-50/30 transition-colors text-[13px] group">
                    
                    <td className="p-3 border-r border-gray-100">
                        <div className="flex items-center gap-4 justify-center">
                            <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer border-gray-300" />
                            {/* Continuous Index Logic: (Page-1)*Limit + Index + 1 */}
                            <span className="text-gray-500 text-xs font-mono">
                                {(pagination.page - 1) * pagination.limit + index + 1}
                            </span>
                        </div>
                    </td>

                    <td className="p-3 border-r border-gray-100 text-gray-700 font-medium">
                        {item.pageUrl}
                    </td>

                    <td className="p-3 border-r border-gray-100 text-gray-600">
                         {item.title}
                    </td>

                    <td className="p-3 border-r border-gray-100 text-gray-600">
                         {item.metaTitle}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => navigate(`/admin/edit-meta-tag/${item._id}`)} 
                            className="p-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500 hover:bg-white hover:text-primary hover:border-primary transition-all shadow-sm"
                            title="Edit"
                        >
                            <Edit size={14} />
                        </button>
                        <button 
                            onClick={() => handleDelete(item._id)} 
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
                  <td colSpan="5" className="p-10 text-center text-gray-400 italic font-montserrat">No matching records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- BACKEND PAGINATION FOOTER --- */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat">
          <div className="text-[11px] text-gray-500 flex items-center gap-2">
             <span className="font-bold uppercase">Show</span>
             <select 
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                className="border border-gray-300 rounded p-1 focus:border-primary outline-none bg-white"
             >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
             </select>
             <span className="font-bold uppercase">entries</span>
          </div>
          
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Displaying {pagination.total > 0 ? startRecord : 0} to {endRecord} of {pagination.total} Items
          </div>

          <div className="flex items-center gap-1">
            <button 
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                disabled={pagination.page === 1}
                className="p-1.5 border border-gray-300 bg-white rounded text-gray-400 hover:text-primary disabled:opacity-50 transition-all"
            >
                <ChevronsLeft size={16}/>
            </button>
            <button 
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="p-1.5 border border-gray-300 bg-white rounded text-gray-400 hover:text-primary disabled:opacity-50 transition-all"
            >
                <ChevronLeft size={16}/>
            </button>
            
            {/* Page Indicator */}
            <div className="w-8 h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-sm">
                {pagination.page}
            </div>

            <button 
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                disabled={pagination.page === totalPages || totalPages === 0}
                className="p-1.5 border border-gray-300 bg-white rounded text-gray-400 hover:text-primary disabled:opacity-50 transition-all"
            >
                <ChevronRight size={16}/>
            </button>
            <button 
                onClick={() => setPagination(prev => ({ ...prev, page: totalPages }))}
                disabled={pagination.page === totalPages || totalPages === 0}
                className="p-1.5 border border-gray-300 bg-white rounded text-gray-400 hover:text-primary disabled:opacity-50 transition-all"
            >
                <ChevronsRight size={16}/>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MetaTagsList;