import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Settings, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const ActorsList = () => {
  const navigate = useNavigate();
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchActors = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/actors/list`); 
      if (res.data.status) {
        setActors(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load actors list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActors();
  }, []);

  const handleDelete = async (id) => {
   
      const toastId = toast.loading("Deleting...");
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.delete(`${API_URL}/actors/delete/${id}`);
        if (res.data.status) {
          toast.success("Actor deleted successfully!", { id: toastId });
          fetchActors(); 
        }
      } catch (error) {
        toast.error("Delete failed", { id: toastId });
      }
    
  };

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-actor')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Actors
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button 
            onClick={() => {setSearchTerm(""); fetchActors();}}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchActors} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              {/* Main Header Row */}
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider">
                <th className="p-3 text-center w-24 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">First name</th>
                <th className="p-3 text-left border-r border-white/20">Last name</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>

              {/* Filter Row - 🟢 Input Box Implement Kiya Gaya Hai */}
              <tr className="bg-primary border-b border-cream-200">
                <td className="p-2 border-r border-white/20">
                  <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer shrink-0" />
                    <input 
                      type="text" 
                      className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" 
                      placeholder="ID"
                    />
                  </div>
                </td>
                <td className="p-2 border-r border-white/20">
                  <input type="text" className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" placeholder="Search..." />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input type="text" className="w-full rounded p-1 text-xs outline-none bg-white/90 focus:bg-white text-text-main" placeholder="Search..." />
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchActors} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                       <Loader2 className="animate-spin text-primary" /> Loading Actors...
                    </div>
                  </td>
                </tr>
              ) : actors.length > 0 ? (
                actors.map((actor, index) => (
                  <tr key={actor.id || actor._id} className="hover:bg-primary-50 transition-colors">
                    {/* 🟢 Body Alignment match with Filter Header */}
                    <td className="p-3 border-r border-cream-50">
                       <div className="flex items-center gap-5 px-1">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0" />
                          <span className="text-text-muted text-xs font-bold w-full text-center">{index + 1}</span>
                       </div>
                    </td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{actor.first_name}</td>
                    <td className="p-3 border-r border-cream-50 text-text-main font-medium">{actor.last_name}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => navigate(`/admin/edit-actor/${actor.id || actor._id}`)} 
                          className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(actor.id || actor._id)}
                          className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-text-muted italic">No actors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ... Footer Logic Remains Same ... */}
        <div className="p-4 bg-white border-t border-cream-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted font-montserrat font-bold">
            <span>Show</span>
            <select className="border border-cream-200 rounded p-1 outline-none focus:border-primary text-xs bg-white text-text-main">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter font-montserrat">
            Displaying {actors.length} items
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronsLeft size={16}/></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronLeft size={16}/></button>
            <div className="flex items-center mx-1 border border-cream-200 rounded overflow-hidden">
              <input type="text" value="1" readOnly className="w-8 text-center text-xs border-none p-1.5 focus:ring-0 text-text-main font-bold bg-cream-50" />
            </div>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronRight size={16}/></button>
            <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all"><ChevronsRight size={16}/></button>
            
            <div className="ml-2">
              <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:bg-cream-50">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorsList;