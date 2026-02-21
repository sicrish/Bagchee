import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Settings, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const PublishersList = () => {
  const navigate = useNavigate();
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🟢 1. Filtering State for all columns
  const [filters, setFilters] = useState({
    id: "",
    title: "",
    category: "",
    company: "",
    place: "",
    email: "",
    show: ""
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const fetchPublishers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/publishers/list`); 
      if (res.data.status) {
        setPublishers(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load publishers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, []);

  // 🟢 2. Advanced Filtering Logic
  const filteredPublishers = useMemo(() => {
    return publishers.filter((pub, index) => {
      const displayId = (index + 1).toString();
      const catTitle = (pub.category?.categorytitle || "").toLowerCase();
      
      return (
        displayId.includes(filters.id) &&
        (pub.title || "").toLowerCase().includes(filters.title.toLowerCase()) &&
        catTitle.includes(filters.category.toLowerCase()) &&
        (pub.company || "").toLowerCase().includes(filters.company.toLowerCase()) &&
        (pub.place || "").toLowerCase().includes(filters.place.toLowerCase()) &&
        (pub.email || "").toLowerCase().includes(filters.email.toLowerCase()) &&
        (pub.show || "").toLowerCase().includes(filters.show.toLowerCase())
      );
    });
  }, [publishers, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ id: "", title: "", category: "", company: "", place: "", email: "", show: "" });
    fetchPublishers();
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await axios.delete(`${API_BASE_URL}/publishers/delete/${id}`); 
      if (res.data.status) {
        toast.success("Publisher deleted successfully!", { id: toastId });
        fetchPublishers(); 
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filterInputClass = "w-full rounded p-1 text-[10px] outline-none bg-white/90 focus:bg-white text-text-main font-montserrat border border-transparent focus:border-primary transition-all";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-publishers')} 
          className="w-full md:w-auto bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Publishers
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button onClick={clearFilters} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all">
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchPublishers} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1800px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20 w-16">Image</th>
                <th className="p-3 text-left border-r border-white/20">Title</th>
                <th className="p-3 text-left border-r border-white/20">Category</th>
                <th className="p-3 text-left border-r border-white/20">Company</th>
                <th className="p-3 text-left border-r border-white/20">Address</th>
                <th className="p-3 text-left border-r border-white/20">Place</th>
                <th className="p-3 text-left border-r border-white/20">Email</th>
                <th className="p-3 text-left border-r border-white/20">Phone</th>
                <th className="p-3 text-left border-r border-white/20">Fax</th>
                <th className="p-3 text-left border-r border-white/20">Slug</th>
                <th className="p-3 text-left border-r border-white/20">Date</th>
                <th className="p-3 text-left border-r border-white/20 w-16">Show</th>
                <th className="p-3 text-left border-r border-white/20 w-16">Order</th>
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
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"><input name="title" value={filters.title} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Title" /></td>
                <td className="p-2 border-r border-white/20"><input name="category" value={filters.category} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Category" /></td>
                <td className="p-2 border-r border-white/20"><input name="company" value={filters.company} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Company" /></td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"><input name="place" value={filters.place} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Place" /></td>
                <td className="p-2 border-r border-white/20"><input name="email" value={filters.email} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Email" /></td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 border-r border-white/20"><input name="show" value={filters.show} onChange={handleFilterChange} type="text" className={filterInputClass} placeholder="Show" /></td>
                <td className="p-2 border-r border-white/20"></td>
                <td className="p-2 text-center">
                  <button onClick={fetchPublishers} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="15" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-primary" /> Loading Publishers...
                    </div>
                  </td>
                </tr>
              ) : filteredPublishers.length > 0 ? (
                filteredPublishers.map((pub, index) => (
                  <tr key={pub._id} className="hover:bg-primary-50 transition-colors text-[12px]">
                    <td className="p-3 border-r border-cream-50">
                        <div className="flex items-center gap-5 px-1">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                          <span className="text-text-muted text-[10px] font-bold w-full text-center">{index + 1}</span>
                        </div>
                    </td>

                    <td className="p-3 border-r border-cream-50 text-center">
                      <div className="w-8 h-8 mx-auto bg-cream-100 rounded border border-cream-200 flex items-center justify-center overflow-hidden">
                        {pub.image ? (
                          <img 
                            src={pub.image.startsWith('http') ? pub.image : `${API_BASE_URL}${pub.image}`} 
                            alt="pub" 
                            className="object-cover w-full h-full" 
                          />
                        ) : <Settings size={14} className="text-cream-300"/>}
                      </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{pub.title}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold">
                        {pub.category?.categorytitle || "N/A"}
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{pub.company || '-'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main max-w-xs truncate">{pub.address || '-'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{pub.place || '-'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{pub.email || '-'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{pub.phone || '-'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{pub.fax || '-'}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main italic text-[10px]">{pub.slug}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main">{formatDate(pub.date)}</td>
                    <td className="p-3 border-r border-cream-50 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pub.show === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {pub.show || 'No'}
                      </span>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-bold text-center">{pub.order || 0}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/edit-publishers/${pub._id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(pub._id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="15" className="p-10 text-center text-text-muted italic">No publishers found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
            Displaying {filteredPublishers.length} of {publishers.length} items
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronsLeft size={16}/></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronLeft size={16}/></button>
            <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden">
              <input type="text" value="1" readOnly className="w-8 text-center text-xs border-none p-1.5 font-bold bg-cream-50 text-text-main" />
            </div>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronRight size={16}/></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary transition-all"><ChevronsRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishersList;