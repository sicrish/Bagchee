import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';

import { 
  BookText, Loader2
} from 'lucide-react';

const Products = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 React Standard API URL
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // 🟢 Fetch Data from Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/product-types/list`);
        
        if (res.data.status) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching product types:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-gray-500 font-bold text-sm">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 md:p-10 font-body">
      
      {/* --- WELCOME HEADER --- */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-text-main font-display tracking-tight">
            Hello, admin!
          </h1>
          <p className="text-gray-500 mt-2">Manage your product categories below.</p>
        </div>
      
      </div>

      {/* --- PRODUCT GRID --- */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl">
          {categories.map((item) => (
            <div 
              key={item.id || item._id} 
              onClick={() => navigate(`/admin/${item.image_folder}`)} 
              className="bg-white rounded-2xl p-6 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-xl transition-all cursor-pointer group"
            >
              {/* 🔴 FIXED ICON BOX: Only Book icon remains */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-300 shrink-0">
                <BookText size={40} />
              </div>

              {/* 🔵 TEXT CONTENT */}
              <div className="overflow-hidden">
                <h3 className="text-lg md:text-xl font-bold text-text-muted font-montserrat tracking-wide group-hover:text-primary transition-colors uppercase truncate">
                  {item.name}
                </h3>
                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  {item.bagchee_prefix || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 font-bold">No product categories found.</p>
          <button onClick={() => navigate('/admin/add-product-type')} className="mt-4 text-primary hover:underline font-bold text-sm">
            + Add First Category
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;