'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, RotateCcw, X, Loader2, Plus, 
  UserPlus, Eye, EyeOff, Image as ImageIcon, Upload 
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig'; 
import toast from 'react-hot-toast';

const AddUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // 🟢 All fields as per your request (Blank start)
  const initialFormState = {
    username: '',
    email: '',
    password: '', 
    status: 1, 
    firstname: '',
    lastname: '',
    company: '',
    phone: '',
    membership: 'inactive',
    membershipStart: '',
    membershipEnd: '',
    isGuest: 'inactive', 
    image: null
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      // 🖼️ Create URL for instant preview
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearDate = (fieldName) => {
    setFormData({ ...formData, [fieldName]: '' });
  };

  // 🟢 Submit Logic (Create User)
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();

    // 💡 Essential Validations
    if (!formData.username || !formData.email) {
        return toast.error("Username and Email are mandatory!");
    }
    if(!formData.password || formData.password.length < 6) {
        return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    const toastId = toast.loading("Creating new user account...");

    try {
      const data = new FormData();
      
      // 1. Appending all text fields from formData
      Object.keys(formData).forEach(key => {
        if (key !== 'image' && formData[key] !== '') {
            data.append(key, formData[key]);
        }
      });
      
      // 🧠 SMART LOGIC: Merge names for backend consistency
      const fullName = `${formData.firstname} ${formData.lastname}`.trim();
      data.append('name', fullName); 

      // 2. Appending Image
      if (formData.image) {
        data.append('profileImage', formData.image);
      }

      // 🚀 API POST CALL
      const res = await axiosInstance.post(`/user/register`, data);

      if (res.data.status) {
        toast.success("User created successfully! ✨", { id: toastId });
        
        if (actionType === 'back') {
            navigate('/admin/users');
        } else {
            // Reset form for "Add Another" flow
            setFormData(initialFormState);
            setImagePreview(null);
        }
      }
    } catch (error) {
      console.error(error);
      
const errorMsg = error.response?.data?.msg || error.response?.data?.message || "Creation failed";

      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // UI Styling Helpers
  const labelClass = "col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2 tracking-tight";
  const inputContainer = "col-span-12 md:col-span-9";
  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-4 focus:ring-primary/10 font-body";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-4 shadow-md flex items-center justify-between text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <UserPlus size={22} />
            <h1 className="text-lg font-bold uppercase tracking-wider font-display">
              Add New User
            </h1>
        </div>
        <button onClick={() => navigate('/admin/users')} className="hover:rotate-90 transition-transform"><X size={24}/></button>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 mt-6">
        <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-2xl border border-cream-200 shadow-xl overflow-hidden">
          
          <div className="bg-cream-100/50 px-8 py-4 border-b border-cream-200 flex items-center gap-2">
             <div className="w-1.5 h-4 bg-primary rounded-full"></div>
             <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] font-montserrat text-text-muted">Account Credentials</h2>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            
            {/* Username & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username*</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className={inputClass} placeholder="Unique username" />
                </div>
                <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Secure Password*</label>
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className={inputClass} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-primary transition-colors">
                            {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-12 gap-4 items-center pt-4">
              <label className={labelClass}>Email Address*</label>
              <div className={inputContainer}>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="user@example.com" />
              </div>
            </div>

            {/* Active Status (Radio) */}
            <div className="grid grid-cols-12 gap-4 items-start pt-4 border-t border-gray-50">
              <label className={labelClass}>Active Status</label>
              <div className={`${inputContainer} flex gap-6 pt-1`}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="status" checked={parseInt(formData.status) === 1} onChange={() => setFormData({...formData, status: 1})} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-semibold group-hover:text-green-600 transition-colors">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="status" checked={parseInt(formData.status) === 0} onChange={() => setFormData({...formData, status: 0})} className="w-4 h-4 accent-red-600" />
                  <span className="text-sm font-semibold group-hover:text-red-600 transition-colors">Inactive</span>
                </label>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">First Name</label>
                    <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Last Name</label>
                    <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} className={inputClass} />
                </div>
            </div>

            {/* Company & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Company</label>
                    <input type="text" name="company" value={formData.company} onChange={handleChange} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
            </div>

            {/* Membership Details */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">Membership Configuration</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <label className="col-span-12 md:col-span-3 text-[11px] font-bold text-gray-500 uppercase pt-2">Plan Type</label>
                    <div className="col-span-12 md:col-span-9 flex gap-6 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="membership" value="active" checked={formData.membership === 'active'} onChange={handleChange} className="w-4 h-4 accent-primary" />
                            <span className="text-sm font-medium">Active Member</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="membership" value="inactive" checked={formData.membership === 'inactive'} onChange={handleChange} className="w-4 h-4 accent-primary" />
                            <span className="text-sm font-medium">Non-Member</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Member Since</label>
                        <div className="relative">
                            <input type="date" name="membershipStart" value={formData.membershipStart} onChange={handleChange} className={inputClass} />
                            <button type="button" onClick={() => clearDate('membershipStart')} className="text-[9px] font-bold text-primary absolute right-3 -bottom-5 hover:underline">CLEAR DATE</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Member Until</label>
                        <div className="relative">
                            <input type="date" name="membershipEnd" value={formData.membershipEnd} onChange={handleChange} className={inputClass} />
                            <button type="button" onClick={() => clearDate('membershipEnd')} className="text-[9px] font-bold text-primary absolute right-3 -bottom-5 hover:underline">CLEAR DATE</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Is Guest Status */}
            <div className="grid grid-cols-12 gap-4 items-start pt-4 border-t border-gray-50">
              <label className={labelClass}>Is Guest Account?</label>
              <div className={`${inputContainer} flex gap-6 pt-1`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isGuest" value="active" checked={formData.isGuest === 'active'} onChange={handleChange} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Guest User</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isGuest" value="inactive" checked={formData.isGuest === 'inactive'} onChange={handleChange} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Registered User</span>
                </label>
              </div>
            </div>

            {/* Image Preview & Upload */}
            <div className="grid grid-cols-12 gap-4 items-center border-t border-gray-50 pt-8">
              <label className={labelClass}>User Avatar</label>
              <div className={inputContainer}>
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl border-2 border-primary/10 overflow-hidden bg-gray-50 flex items-center justify-center shadow-inner">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                            <ImageIcon className="text-gray-300" size={32} />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input type="file" id="user_img" className="hidden" onChange={handleFileChange} accept="image/*" />
                        <label htmlFor="user_img" className="bg-white border border-gray-300 px-5 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-95">
                          <Upload size={14} className="text-primary"/> Select Photo
                        </label>
                        {formData.image && (
                            <span className="text-[10px] text-green-600 font-bold animate-pulse">
                                Selected: {formData.image.name}
                            </span>
                        )}
                    </div>
                </div>
              </div>
            </div>

            {/* Final Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-12 border-t mt-12">
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-10 py-3 rounded-xl font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Check size={18} className="text-green-600"/>} 
                Save 
              </button>
              
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-primary text-white hover:bg-primary-dark px-10 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <Plus size={18} /> 
                Save and Return
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/users')} 
                className="w-full sm:w-auto bg-white border border-red-100 text-red-500 hover:bg-red-50 px-10 py-3 rounded-xl font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <X size={18} /> cancel
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;