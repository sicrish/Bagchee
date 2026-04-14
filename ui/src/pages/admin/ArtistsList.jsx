'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Settings, Loader2, User 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const ArtistsList = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 Filter States for Live Search
  const [searchFirstName, setSearchFirstName] = useState("");
  const [searchLastName, setSearchLastName] = useState("");

  // 🟢 1. Fetch Artists from Backend
  const fetchArtists = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/artists/list`);
      if (res.data.status) {
        setArtists(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error(error.response?.data?.msg || "Failed to load artists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  // 🔴 2. Delete Artist Logic with Confirmation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this artist profile?")) return;

    const toastId = toast.loading("Processing deletion...");
    try {
      const res = await axios.delete(`${API_BASE_URL}/artists/delete/${id}`);
      if (res.data.status) {
        toast.success("Artist removed successfully! ✨", { id: toastId });
        fetchArtists(); 
      }
    } catch (error) {
      toast.error("Operation failed", { id: toastId });
    }
  };

  // 🔍 3. Live Filtering Logic (Local Memory Filter)
  const filteredArtists = useMemo(() => {
    return artists.filter(artist => 
      artist.first_name?.toLowerCase().includes(searchFirstName.toLowerCase()) &&
      artist.last_name?.toLowerCase().includes(searchLastName.toLowerCase())
    );
  }, [artists, searchFirstName, searchLastName]);

  const filterInputClass = "w-full rounded p-1 text-[11px] outline-none bg-white/90 focus:bg-white text-text-main font-semibold shadow-inner border-none placeholder:text-gray-400";

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/add-artist')} 
          className="w-full md:w-auto bg-primary text-white hover:brightness-110 px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={16} /> Add New Artist
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={fetchArtists} className="bg-white border border-cream-300 p-2.5 rounded-lg text-primary hover:bg-gray-50 transition-all shadow-sm group">
             <RotateCw size={16} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          <button className="bg-white border border-cream-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm hover:bg-gray-50">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button 
            onClick={() => {setSearchFirstName(""); setSearchLastName(""); fetchArtists();}}
            className="bg-white border border-cream-300 text-gray-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:text-red-500 transition-all"
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
              {/* Main Header Strip: bg-primary (#008DDA) */}
              <tr className="bg-primary text-white font-montserrat font-bold uppercase tracking-widest text-[10px]">
                <th className="p-4 text-center w-24 border-r border-white/10">No.</th>
                <th className="p-4 text-left border-r border-white/10">First Name</th>
                <th className="p-4 text-left border-r border-white/10">Last Name</th>
                <th className="p-4 text-center w-32">Actions</th>
              </tr>

              {/* 🟢 Professional Filter Row */}
              <tr className="bg-primary/95 border-t border-white/10">
                <td className="p-2 border-r border-white/10">
                  <div className="flex justify-center items-center h-full gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded accent-accent bg-white cursor-pointer" />
                    <span className="text-[10px] font-bold text-white/70">ID</span>
                  </div>
                </td>
                <td className="p-2 border-r border-white/10">
                  <input 
                    type="text" 
                    className={filterInputClass} 
                    placeholder="Filter First Name..." 
                    value={searchFirstName}
                    onChange={(e) => setSearchFirstName(e.target.value)}
                  />
                </td>
                <td className="p-2 border-r border-white/10">
                  <input 
                    type="text" 
                    className={filterInputClass} 
                    placeholder="Filter Last Name..." 
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
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-montserrat">Syncing with database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredArtists.length > 0 ? (
                filteredArtists.map((artist, index) => (
                  <tr key={artist.id || artist._id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-4 border-r border-gray-50 text-center font-mono text-xs text-gray-400">
                        {index + 1}
                    </td>
                    <td className="p-4 border-r border-gray-50 text-text-main font-bold tracking-tight uppercase">
                        {artist.first_name}
                    </td>
                    <td className="p-4 border-r border-gray-50 text-text-main font-bold tracking-tight uppercase">
                        {artist.last_name}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/admin/edit-artist/${artist.id || artist._id}`)} 
                          className="p-2 bg-white border border-gray-200 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(artist.id || artist._id)}
                          className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete Artist"
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
                        <User size={48} className="mb-2 text-gray-300" />
                        <p className="text-sm font-bold text-gray-500 italic font-montserrat">No artists found in system records.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FOOTER / PAGINATION --- */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 px-2">
          <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Records Found: {filteredArtists.length}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-text-muted font-bold">
                <span>View</span>
                <select className="border border-cream-300 rounded px-1 py-0.5 outline-none bg-white text-primary">
                  <option>25</option><option>50</option><option>100</option>
                </select>
              </div>
          </div>

          <div className="flex items-center gap-1">
             <button className="p-1.5 rounded border border-cream-300 bg-white text-gray-400 hover:text-primary transition-colors"><ChevronLeft size={16}/></button>
             <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded shadow-md">1</span>
             <button className="p-1.5 rounded border border-cream-300 bg-white text-gray-400 hover:text-primary transition-colors"><ChevronRight size={16}/></button>
             <button className="ml-2 p-1.5 rounded border border-cream-300 bg-white text-gray-400 hover:bg-cream-100 transition-all"><Settings size={16}/></button>
          </div>
      </div>
    </div>
  );
};

export default ArtistsList;