'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Pencil, User, Camera, X, Key } from 'lucide-react';
import axios from '../../../utils/axiosConfig'; // Aapka optimized axios use kiya hai
import toast from 'react-hot-toast';
import AccountLayout from '../../../layouts/AccountLayout';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Profile Row Component (No Changes)
const ProfileRow = ({ label, value, isInput = false, name, type = "text", onChange, icon: Icon, readOnly = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`group flex flex-col md:flex-row items-start md:items-center justify-between py-5 border-b border-gray-100 last:border-0 px-2 transition-all gap-3 md:gap-0 ${!readOnly ? 'hover:bg-gray-50 rounded-lg cursor-pointer' : ''}`}
  >
    <div className="w-full md:w-1/3">
      <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
        {label}
      </span>
    </div>

    <div className="w-full md:w-2/3 flex items-center justify-between gap-4">
      <div className="flex-grow">
        {isInput ? (
          <input 
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={`Enter ${label}`}
            className={`w-full bg-transparent outline-none text-base font-medium text-gray-900 placeholder-gray-300 py-1 ${readOnly ? 'cursor-not-allowed text-gray-400' : 'focus:text-primary transition-colors'}`}
          />
        ) : (
          <span className="text-base font-medium text-gray-900 truncate block py-1">{value}</span>
        )}
      </div>

      {Icon && !readOnly && (
        <div className="text-gray-400 group-hover:text-primary transition-colors p-2 bg-gray-100 rounded-full group-hover:bg-primary-50 shrink-0">
           <Icon size={16} />
        </div>
      )}
    </div>
  </div>
);

// Password Modal Component (React Query useMutation added)
const PasswordModal = ({ isOpen, onClose, userId }) => {
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '' });

  // 🟢 Password Change Mutation
  const passwordMutation = useMutation({
    mutationFn: async (payload) => {
      const url = `${API_BASE_URL}/user/change-password`;
      const res = await axios.post(url, payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success("Password Changed Successfully!");
        setPassData({ oldPassword: '', newPassword: '' });
        onClose();
      } else {
        toast.error(data.msg);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Password update failed");
    }
  });

  if (!isOpen) return null;

  const handleChange = (e) => setPassData({ ...passData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    passwordMutation.mutate({ userId, ...passData });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-cream-100 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Key size={20} className="text-primary" /> Change Password
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Password</label>
            <input type="password" name="oldPassword" value={passData.oldPassword} onChange={handleChange} className="w-full mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-primary" placeholder="Enter old password" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Password</label>
            <input type="password" name="newPassword" value={passData.newPassword} onChange={handleChange} className="w-full mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-primary" placeholder="Enter new password" required />
          </div>
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold uppercase tracking-wider mt-4 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            {passwordMutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Main Profile Component
const Profile = () => {
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false); 

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userId: ''
  });

  // Load User Data (No changes)
  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("auth"));
    if (auth && auth.userDetails) {
      const nameParts = auth.userDetails.name ? auth.userDetails.name.split(" ") : ["", ""];
      setUserData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: auth.userDetails.email || "",
        phone: auth.userDetails.phone || "",
        userId: auth.userDetails.id
      });

      if (auth.userDetails.profileImage && auth.userDetails.profileImage !== "") {
        const imgPath = auth.userDetails.profileImage;
        const finalUrl = imgPath.startsWith('http') ? imgPath : `${API_BASE_URL}${imgPath}`;
        setImagePreview(finalUrl);
      }
    }
  }, []);

  // 🟢 Profile Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (formData) => {
      const authData = JSON.parse(localStorage.getItem("auth"));
      const url = `${API_BASE_URL}/user/update`;
      const res = await axios.patch(url, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authData?.token}` 
        }
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success("Profile Updated Successfully!");
        
        // LocalStorage update
        const oldAuth = JSON.parse(localStorage.getItem("auth"));
        if(oldAuth) {
            oldAuth.userDetails = { ...oldAuth.userDetails, ...data.user };
            localStorage.setItem("auth", JSON.stringify(oldAuth));
        }

        // Global Cache refresh karein taaki Header me naya naam/photo dikhe
        queryClient.invalidateQueries(['user-profile']); 
      } else {
        toast.error(data.msg);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Update failed");
    }
  });

  const handleChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('userId', userData.userId);
    formData.append('name', `${userData.firstName} ${userData.lastName}`);
    formData.append('phone', userData.phone);
    if (selectedFile) formData.append('profileImage', selectedFile);

    updateMutation.mutate(formData);
  };

  return (
    <AccountLayout>
      <div className="max-w-4xl mx-auto font-montserrat">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>

        <form onSubmit={handleUpdate} className="bg-cream-100 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8 bg-cream-100 border-b border-gray-200">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative ring-2 ring-gray-100">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-400" />
                )}
              </div>
              <label htmlFor="file-upload" className="absolute bottom-1 right-1 bg-primary hover:bg-primary-dark text-white p-2 rounded-full shadow-lg cursor-pointer transition-all hover:scale-110 border-2 border-white">
                <Camera size={16} />
              </label>
              <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
              <p className="text-sm text-gray-600 mt-1 mb-2">Upload a high-quality photo.</p>
              <p className="text-xs font-bold tracking-wide">
                {selectedFile ? <span className="text-primary">Photo Selected</span> : <span className="text-gray-400">No file chosen</span>}
              </p>
            </div>
          </div>

          <div className="px-5 md:px-10 py-6">
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <User size={14} /> Personal Details
            </h2>

            <ProfileRow label="First Name" isInput={true} name="firstName" value={userData.firstName} onChange={handleChange} icon={Pencil} />
            <ProfileRow label="Last Name" isInput={true} name="lastName" value={userData.lastName} onChange={handleChange} icon={Pencil} />
            <ProfileRow label="Phone" isInput={true} name="phone" type="tel" value={userData.phone} onChange={handleChange} icon={Pencil} />

            <div className="my-8 border-t border-dashed border-gray-200"></div>

            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Key size={14} /> Account Security
            </h2>

            <ProfileRow label="Email" isInput={true} value={userData.email} readOnly={true} />

            <div onClick={() => setShowPasswordModal(true)} className="group flex flex-col md:flex-row items-start md:items-center justify-between py-5 border-b border-gray-100 px-2 transition-all gap-3 md:gap-0 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="w-full md:w-1/3"><span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Password</span></div>
              <div className="w-full md:w-2/3 flex items-center justify-between gap-4">
                <span className="text-base font-medium text-gray-900">••••••••</span>
                <div className="text-gray-400 group-hover:text-primary transition-colors p-2 bg-gray-100 rounded-full group-hover:bg-primary-50"><Pencil size={16} /></div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 md:py-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-end gap-3 bg-gray-50">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full md:w-auto bg-primary hover:bg-primary-hover text-white px-10 py-3 rounded-lg text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <PasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} userId={userData.userId} />
    </AccountLayout>
  );
};

export default Profile;