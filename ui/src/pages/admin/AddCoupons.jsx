import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query'; // 🟢 React Query Import kiya

const AddCoupons = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: '',
    valid_from: '',
    valid_to: '',
    active: 'inactive',
    fix_amount: 'inactive',
    amount: '',
    minimum_buy: '',
    title: '',
    price_over_only: '',
    new_customer_only: 'inactive',
    members_only: 'inactive',
    next_order_only: 'inactive',
    bestseller_only: 'inactive',
    recommended_only: 'inactive',
    new_arrivals_only: 'inactive',
    get_third_free: 'inactive',
    categories: ''
  });

  // 🚀 OPTIMIZATION 1: Fetch Categories with React Query for Caching & Speed
  const { data: categoryList = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categoriesListDropdown'],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/category/fetch`);
      if (res.data.status) {
        return res.data.data || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (Speed Boost)
    onError: (error) => {
      console.error("Category Fetch Error:", error);
      toast.error("Failed to load categories");
    }
  });

  // 🚀 OPTIMIZATION 2: Save Coupon with React Query Mutation
  const saveCouponMutation = useMutation({
    mutationFn: async (submitData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/coupons/save`, submitData);
      return res.data;
    }
  });

  // useCallback taaki inputs type karte waqt lag na ho
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    if (!formData.code || !formData.title) return toast.error("Code and Title are required!");

    const toastId = toast.loading("Saving coupon...");

    saveCouponMutation.mutate(formData, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Coupon added successfully! 🎫", { id: toastId });
          if (actionType === 'back') {
            navigate('/admin/coupons');
          } else {
            // Reset form completely if staying on page
            setFormData({
              code: '', valid_from: '', valid_to: '', active: 'inactive',
              fix_amount: 'inactive', amount: '', minimum_buy: '', title: '',
              price_over_only: '', new_customer_only: 'inactive', members_only: 'inactive',
              next_order_only: 'inactive', bestseller_only: 'inactive', recommended_only: 'inactive',
              new_arrivals_only: 'inactive', get_third_free: 'inactive', categories: ''
            });
          }
        } else {
          toast.error(resData.msg || "Failed to save", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
      }
    });
  };

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Coupons
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Coupon Configuration</h2>
          </div>

          <div className="p-8 space-y-5">
            {/* Code */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Code*</label>
              <div className="col-span-9">
                <input name="code" value={formData.code} onChange={handleChange} className="theme-input w-full uppercase" placeholder="e.g. SAVE50" />
              </div>
            </div>

            {/* Valid From */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Valid from</label>
              <div className="col-span-9">
                <input type="date" name="valid_from" value={formData.valid_from} onChange={handleChange} className="theme-input w-full" />
                <button type="button" onClick={() => setFormData({...formData, valid_from: ''})} className="text-[10px] text-primary mt-1 font-bold">Clear (mm-dd-yyyy)</button>
              </div>
            </div>

            {/* Valid To */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Valid to</label>
              <div className="col-span-9">
                <input type="date" name="valid_to" value={formData.valid_to} onChange={handleChange} className="theme-input w-full" />
                <button type="button" onClick={() => setFormData({...formData, valid_to: ''})} className="text-[10px] text-primary mt-1 font-bold">Clear (mm-dd-yyyy)</button>
              </div>
            </div>

            {/* 🟢 TOP RADIO BUTTONS (Fixed Bug) */}
            {[
              { label: "Active", name: "active" },
              { label: "Fix amount", name: "fix_amount" }
            ].map((field) => (
              <div key={field.name} className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">{field.label}</label>
                <div className="col-span-9 flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={field.name} value="active" checked={formData[field.name] === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={field.name} value="inactive" checked={formData[field.name] === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive
                  </label>
                </div>
              </div>
            ))}

            {/* Amount */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Amount</label>
              <div className="col-span-9">
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="theme-input w-full" placeholder="0.00" />
              </div>
            </div>

            {/* Minimum Buy */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Minimum buy</label>
              <div className="col-span-9">
                <input type="number" name="minimum_buy" value={formData.minimum_buy} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            {/* Title */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Title*</label>
              <div className="col-span-9">
                <input name="title" value={formData.title} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            {/* Price Over Only */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Price over only</label>
              <div className="col-span-9">
                <input type="number" name="price_over_only" value={formData.price_over_only} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            {/* 🟢 BOTTOM RADIO BUTTONS (Fixed Bug) */}
            {[
              { label: "New customer only", name: "new_customer_only" },
              { label: "Members only", name: "members_only" },
              { label: "Next order only", name: "next_order_only" },
              { label: "Bestseller only", name: "bestseller_only" },
              { label: "Recommended only", name: "recommended_only" },
              { label: "New arrivals only", name: "new_arrivals_only" },
              { label: "Get third free", name: "get_third_free" }
            ].map((field) => (
              <div key={field.name} className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">{field.label}</label>
                <div className="col-span-9 flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={field.name} value="active" checked={formData[field.name] === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={field.name} value="inactive" checked={formData[field.name] === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive
                  </label>
                </div>
              </div>
            ))}

           {/* 🟢 DYNAMIC CATEGORY DROPDOWN */}
           <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Categories</label>
              <div className="col-span-9">
                <select name="categories" value={formData.categories} onChange={handleChange} className="theme-input w-full" disabled={isCategoriesLoading}>
                  <option value="">{isCategoriesLoading ? "Loading Categories..." : "Select Categories"}</option>
                  {categoryList.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.categorytitle} {/* Show Title, Value is ID */}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            {/* 🟢 Buttons are disabled dynamically if saving is in progress */}
            <div className="flex justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={saveCouponMutation.isPending} className="bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md active:scale-95 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-70">
                {saveCouponMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Save
              </button>
              
              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={saveCouponMutation.isPending} className="bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md active:scale-95 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-70">
                <RotateCcw size={14}/> Save and go back to list
              </button>

              <button type="button" onClick={() => navigate('/admin/coupons')} disabled={saveCouponMutation.isPending} className="bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm hover:bg-cream-50 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70">
                <X size={14} className="text-red-600" /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .theme-input { 
          border: 1px solid #e6decd; 
          border-radius: 4px; 
          padding: 8px 14px; 
          font-size: 13px; 
          outline: none; 
          transition: all 0.2s ease-in-out; 
          background: #fffdf5;
          font-family: 'Roboto', sans-serif;
        }
        .theme-input:focus { 
          border-color: #008DDA; 
          box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.15); 
          background: white;
        }
      `}</style>
    </div>
  );
};

export default AddCoupons;