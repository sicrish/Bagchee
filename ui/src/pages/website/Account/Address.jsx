'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Phone, Edit, Trash2, Home, Briefcase, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../../utils/axiosConfig';
import AccountLayout from '../../../layouts/AccountLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Address = () => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState({ name: 'Guest', id: null });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState(null);

  // Form Initial State
  const initialFormState = {
    type: 'Home',
    name: '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Load User from LocalStorage
  useEffect(() => {
    const authData = localStorage.getItem("auth");
    if (authData) {
      const parsedData = JSON.parse(authData);
      const userData = parsedData.userDetails;
      setUser(userData); 
    }
  }, []);

  // 🟢 1. FETCH ADDRESSES (useQuery)
  const { data: addresses = [], isLoading: isFetching } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/user/get-addresses?userId=${user.id}`);
      return res.data.addresses || [];
    },
    enabled: !!user?.id, // Jab tak user ID na ho, tab tak fetch na kare
  });

  // 🟢 2. SAVE/UPDATE ADDRESS (useMutation)
  const saveMutation = useMutation({
    mutationFn: async (newAddress) => {
      // Agar editing hai, toh pehle purana delete karke naya add (Vahi logic jo aapne diya tha)
      if (isEditing) {
        await axios.post(`${API_BASE_URL}/user/delete-address`, {
          userId: user.id,
          addressId: currentAddressId
        });
      }
      const res = await axios.post(`${API_BASE_URL}/user/add-address`, {
        userId: user.id,
        ...newAddress
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses', user?.id]); // Refresh list
      toast.success(isEditing ? "Address updated successfully!" : "New address added!");
      setShowModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Something went wrong");
    }
  });

  // 🟢 3. DELETE ADDRESS (useMutation)
  const deleteMutation = useMutation({
    mutationFn: async (addressId) => {
      const res = await axios.post(`${API_BASE_URL}/user/delete-address`, {
        userId: user.id,
        addressId: addressId
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses', user?.id]); // Refresh list
      toast.success("Address deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete address");
    }
  });

  const handleAddNew = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (addr) => {
    setFormData(addr);
    setIsEditing(true);
    setCurrentAddressId(addr._id);
    setShowModal(true);
  };

  const handleDelete = (addressId) => {
    if(!window.confirm("Are you sure you want to delete this address?")) return;
    deleteMutation.mutate(addressId);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <AccountLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Addresses
            </h1>
            <p className="text-gray-600">Manage your shipping addresses</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-medium shadow-md"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Address</span>
          </button>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {!isFetching && addresses.length === 0 && (
            <div className="col-span-2 bg-cream-100 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={40} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No addresses saved yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first shipping address to get started
              </p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                <Plus size={20} />
                Add Your First Address
              </button>
            </div>
          )}

          {addresses.map((addr) => (
            <div
              key={addr._id}
              className="bg-cream-100 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
            >
              <div className="bg-cream-200/40 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  {addr.type === "Home" ? (
                    <Home size={16} className="text-primary" />
                  ) : (
                    <Briefcase size={16} className="text-primary" />
                  )}
                  {addr.type}
                </h3>
                {addr.isDefault && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Check size={12} /> Default
                  </span>
                )}
              </div>

              <div className="p-6 flex-grow space-y-4 text-sm">
                <p className="font-bold text-lg text-gray-900">{addr.name}</p>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <MapPin
                      size={18}
                      className="shrink-0 text-primary mt-0.5"
                    />
                    <div>
                      <span className="block text-gray-700">
                        {addr.houseNo}, {addr.street}
                      </span>
                      {addr.landmark && (
                        <span className="block text-sm text-gray-500 italic mt-0.5">
                          ({addr.landmark})
                        </span>
                      )}
                      <p className="text-gray-700 mt-1">
                        {addr.city}, {addr.state} -{" "}
                        <span className="font-bold">{addr.pincode}</span>
                      </p>
                      <p className="uppercase text-xs tracking-wider text-gray-400 pt-1">
                        {addr.country}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <Phone size={16} className="text-primary" />
                  <span className="font-bold text-gray-900">{addr.phone}</span>
                </p>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-3 bg-cream-100">
                <button
                  onClick={() => handleEdit(addr)}
                  className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(addr._id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                >
                  <Trash2 size={16} /> {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal - Add/Edit Address */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="bg-primary px-6 py-4 flex justify-between items-center text-white sticky top-0">
              <h3 className="font-bold text-lg tracking-wide">
                {isEditing ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="hover:bg-white/20 p-1 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Address Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary bg-gray-50"
                  >
                    <option>Home</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    House / Flat No.
                  </label>
                  <input
                    type="text"
                    name="houseNo"
                    value={formData.houseNo}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Street / Area
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-gray-600 font-bold text-sm uppercase hover:bg-gray-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase rounded shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {saveMutation.isPending
                    ? "Saving..."
                    : isEditing
                      ? "Update Address"
                      : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default Address;