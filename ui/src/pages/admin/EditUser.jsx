import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Plus, Trash2, Edit, MapPin, Phone, Home, Briefcase, Image as ImageIcon } from 'lucide-react';
import axios from '../../utils/axiosConfig'; 
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 🟢 Main User Form State
  const [formData, setFormData] = useState({
    registrationDate: '', 
    username: '',
    email: '',
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
  });

  // 🟢 Address State Management
  const [addresses, setAddresses] = useState([]); 
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState(null);
  
  // Detailed Address Form (Matches User Dashboard)
  const initialAddressState = {
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
  const [addressForm, setAddressForm] = useState(initialAddressState);

  // Image Preview Logic
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  // ==========================
  // 1. FETCH USER DATA
  // ==========================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/user/get/${id}`);
        
        if (res.data.status) {
          const data = res.data.data;
          
          let fName = data.firstname || "";
          let lName = data.lastname || "";
          if (!fName && data.name) {
             const parts = data.name.split(" ");
             fName = parts[0];
             lName = parts.slice(1).join(" ");
          }

          const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : "";

          setFormData({
            registrationDate: data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A",
            username: data.username || "", 
            email: data.email || "",
            status: data.status, 
            firstname: fName,
            lastname: lName,
            company: data.company || "",
            phone: data.phone || "",
            membership: data.membership || "inactive",
            membershipStart: formatDate(data.membershipStart),
            membershipEnd: formatDate(data.membershipEnd),
            isGuest: data.isGuest || "inactive",
            image: null
          });
          
          if (data.profileImage) {

            const finalUrl = `${API_BASE_URL}${data.profileImage}`;
            setImagePreview(finalUrl);
        } else {
            setImagePreview(null);
        }
          setAddresses(data.address || []); // Addresses Load
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to fetch user details");
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, [id]);

  // ==========================
  // 🟢 ADDRESS HANDLERS
  // ==========================

  const openAddModal = () => {
    setAddressForm(initialAddressState);
    setIsEditingAddress(false);
    setShowAddressModal(true);
  };

  const openEditModal = (addr) => {
    setAddressForm({
        type: addr.type || 'Home',
        name: addr.name || '',
        houseNo: addr.houseNo || '',
        street: addr.street || '',
        landmark: addr.landmark || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        country: addr.country || 'India',
        phone: addr.phone || ''
    });
    setCurrentAddressId(addr._id);
    setIsEditingAddress(true);
    setShowAddressModal(true);
  };

  const handleAddressFormChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  // SAVE ADDRESS (Logic: If Edit -> Delete Old & Add New)
  const handleSaveAddress = async (e) => {
    e.preventDefault(); // Prevent form refresh
    if (!addressForm.city || !addressForm.state || !addressForm.houseNo) {
        return toast.error("Please fill required fields");
    }

    try {
        const toastId = toast.loading(isEditingAddress ? "Updating Address..." : "Adding Address...");

        // 1. Agar Edit hai, to purana delete karo
        if (isEditingAddress) {
            await axios.post(`${API_BASE_URL}/user/delete-address`, { userId: id, addressId: currentAddressId });
        }

        // 2. Naya Add karo
        const res = await axios.post('/user/add-address', {
            userId: id,
            ...addressForm
        });

        if (res.data.status) {
            setAddresses(res.data.addresses); // Update UI
            toast.success(isEditingAddress ? "Address Updated!" : "Address Added!", { id: toastId });
            setShowAddressModal(false);
        }
    } catch (error) {
        console.error(error);
        toast.dismiss();
        toast.error(error.response?.data?.msg || "Failed to save address");
    }
  };

  // DELETE ADDRESS
  const handleDeleteAddress = async (addressId) => {
    
    try {
        const res = await axios.post(`${API_BASE_URL}/user/delete-address`, { userId: id, addressId });
        if(res.data.status) {
            setAddresses(res.data.addresses);
            toast.success("Address Deleted");
        }
    } catch (error) {
        toast.error("Delete failed");
    }
  };

  // ==========================
  // MAIN FORM HANDLERS
  // ==========================
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
        //image preview
        setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleDeleteImage = () => {
    setExistingImage(null);
    setFormData({ ...formData, image: null });
    toast("Image removed. Upload a new one.", { icon: '🗑️' });
  };

  const clearDate = (fieldName) => setFormData({ ...formData, [fieldName]: '' });

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Updating user...");

    const token = localStorage.getItem('token');
    if (!token) {
        setLoading(false);
        toast.dismiss(toastId);
        return toast.error("No Login Token Found!");
    }

    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('email', formData.email);
      data.append('status', formData.status);
      data.append('company', formData.company);
      data.append('phone', formData.phone);
      
      const fullName = `${formData.firstname} ${formData.lastname}`.trim();
      data.append('name', fullName); 
      data.append('firstname', formData.firstname);
      data.append('lastname', formData.lastname);

      data.append('membership', formData.membership);
      data.append('isGuest', formData.isGuest);
      if(formData.membershipStart) data.append('membershipStart', formData.membershipStart);
      if(formData.membershipEnd) data.append('membershipEnd', formData.membershipEnd);

      if (formData.image) data.append('profileImage', formData.image);

      const res = await axios.patch(`${API_BASE_URL}/user/update/${id}`, data);

      if (res.data.status) {
        toast.success("User updated successfully!", { id: toastId });
        if (actionType === 'back') navigate('/admin/users');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Update failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";
  const inputContainer = "col-span-12 md:col-span-9";
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";

  if (fetching) return <div className="h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={40}/></div>;

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* Header */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit User
        </h1>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               User Information
             </h2>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* Registration Date */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Registration date</label>
              <div className={inputContainer}>
                <span className="text-[13px] font-bold text-text-main">{formData.registrationDate}</span>
              </div>
            </div>

            {/* Username */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Username</label>
              <div className={inputContainer}>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Email</label>
              <div className={inputContainer}>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Active Status */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Active</label>
              <div className={`${inputContainer} pt-0 md:pt-2 space-y-2`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" checked={parseInt(formData.status) === 1} onChange={() => setFormData({...formData, status: 1})} className="accent-primary" />
                  <span className="text-sm">active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" checked={parseInt(formData.status) === 0} onChange={() => setFormData({...formData, status: 0})} className="accent-primary" />
                  <span className="text-sm">inactive</span>
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Firstname</label>
              <div className={inputContainer}>
                <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Lastname</label>
              <div className={inputContainer}>
                <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Company</label>
              <div className={inputContainer}>
                <input type="text" name="company" value={formData.company} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Phone</label>
              <div className={inputContainer}>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 🟢 ADDRESSES SECTION (Redesigned) */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Addresses</label>
              <div className={inputContainer}>
                
                {/* List Addresses */}
                <div className="space-y-3 mb-3">
                  {addresses.length > 0 ? (
                    addresses.map((addr, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm hover:border-primary/30 transition-colors">
                        <div className="text-[12px] text-text-main font-montserrat">
                          <div className="flex items-center gap-2 mb-1">
                             {addr.type === 'Home' ? <Home size={14} className="text-primary"/> : <Briefcase size={14} className="text-primary"/>}
                             <span className="font-bold uppercase tracking-wider text-[10px] bg-primary/10 px-2 py-0.5 rounded text-primary">{addr.type}</span>
                          </div>
                          <p className="font-bold text-[13px]">{addr.name}</p>
                          <p className="text-gray-600 leading-relaxed">
                            {addr.houseNo}, {addr.street} {addr.landmark ? `(${addr.landmark})` : ''}
                          </p>
                          <p className="text-gray-600">
                            {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-gray-500 font-medium">
                             <Phone size={10} /> {addr.phone}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 self-end sm:self-center">
                          <button type="button" onClick={() => openEditModal(addr)} className="p-2 bg-white border border-gray-200 rounded text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all" title="Edit Address">
                              <Edit size={14} />
                          </button>
                          <button type="button" onClick={() => handleDeleteAddress(addr._id)} className="p-2 bg-white border border-gray-200 rounded text-red-500 hover:bg-red-50 hover:border-red-200 transition-all" title="Delete Address">
                              <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic border border-dashed border-gray-300 p-4 rounded text-center">No addresses found for this user.</p>
                  )}
                </div>

                {/* Add Button */}
                <button 
                  type="button" 
                  onClick={openAddModal}
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-text-main px-4 py-2 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors shadow-sm w-fit"
                >
                  <Plus size={14} /> Add New Address
                </button>
              </div>
            </div>

            {/* Membership */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Membership</label>
              <div className={`${inputContainer} pt-0 md:pt-2 space-y-2`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="membership" checked={formData.membership === 'active'} onChange={() => setFormData({...formData, membership: 'active'})} className="accent-primary" />
                  <span className="text-sm">active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="membership" checked={formData.membership === 'inactive'} onChange={() => setFormData({...formData, membership: 'inactive'})} className="accent-primary" />
                  <span className="text-sm">inactive</span>
                </label>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Membership start</label>
              <div className={inputContainer}>
                <input type="date" name="membershipStart" value={formData.membershipStart} onChange={handleChange} className={inputClass} />
                <button type="button" onClick={() => clearDate('membershipStart')} className="text-[11px] text-primary hover:underline mt-1 block">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <label className={labelClass}>Membership end</label>
              <div className={inputContainer}>
                <input type="date" name="membershipEnd" value={formData.membershipEnd} onChange={handleChange} className={inputClass} />
                <button type="button" onClick={() => clearDate('membershipEnd')} className="text-[11px] text-primary hover:underline mt-1 block">Clear</button>
              </div>
            </div>

            {/* Is Guest */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Is guest</label>
              <div className={`${inputContainer} pt-0 md:pt-2 space-y-2`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isGuest" checked={formData.isGuest === 'active'} onChange={() => setFormData({...formData, isGuest: 'active'})} className="accent-primary" />
                  <span className="text-sm">active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isGuest" checked={formData.isGuest === 'inactive'} onChange={() => setFormData({...formData, isGuest: 'inactive'})} className="accent-primary" />
                  <span className="text-sm">inactive</span>
                </label>
              </div>
            </div>

            {/* Image Upload */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Image</label>
              <div className={inputContainer}>
                {imagePreview ? (
                  <div className="flex gap-4 p-3 border border-gray-100 rounded bg-gray-50/50">
                    <div className="w-24 h-24 border border-gray-300 rounded bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      <img src={imagePreview} alt="User" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/100x100?text=No+Image"; }} />
                    </div>
                    <div className="flex flex-col justify-center space-y-2">
                      <button type="button" onClick={handleDeleteImage} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-[11px] font-bold uppercase flex items-center gap-2 transition-all w-fit shadow-sm">
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <ImageIcon size={24} className="text-gray-400 mb-2"/>
                      <label className="cursor-pointer">
                        <span className="bg-primary text-white px-4 py-2 rounded text-xs font-bold shadow-sm">Choose File</span>
                        <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                      </label>
                      <span className="text-[10px] text-gray-400 mt-2">{formData.image ? formData.image.name : 'JPG, PNG, WEBP'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} <span className="font-bold">Update changes</span>
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm">
                <RotateCcw size={16} className="text-primary"/> <span className="font-bold">Update & Go Back</span>
              </button>
              <button type="button" onClick={() => navigate('/admin/users')} className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm">
                <X size={16} className="text-red-600" /> <span className="font-bold">Cancel</span>
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* 🟢 FULL ADDRESS MODAL POPUP */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden font-body">
            
            <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold font-display text-lg tracking-wide uppercase">
                {isEditingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-6 md:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Row 1: Type & Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address Type</label>
                    <select name="type" value={addressForm.type} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary bg-gray-50 outline-none">
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input type="text" name="name" value={addressForm.name} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" required placeholder="Receiver Name"/>
                </div>
              </div>

              {/* Row 2: House & Street */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">House / Flat No.</label>
                    <input type="text" name="houseNo" value={addressForm.houseNo} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" required placeholder="e.g. Flat 101" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street / Gali No.</label>
                    <input type="text" name="street" value={addressForm.street} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" required placeholder="e.g. MG Road" />
                </div>
              </div>

              {/* Row 3: Landmark & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Landmark</label>
                    <input type="text" name="landmark" value={addressForm.landmark} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" placeholder="Near Park" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City *</label>
                    <input type="text" name="city" value={addressForm.city} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" required />
                </div>
              </div>

              {/* Row 4: State, Pincode, Phone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State *</label>
                    <input type="text" name="state" value={addressForm.state} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pincode *</label>
                    <input type="text" name="pincode" value={addressForm.pincode} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                    <input type="text" name="phone" value={addressForm.phone} onChange={handleAddressFormChange} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary outline-none" />
                </div>
              </div>

            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setShowAddressModal(false)} className="px-6 py-2.5 text-gray-500 font-bold text-sm uppercase hover:bg-gray-100 rounded transition-colors">Cancel</button>
              <button onClick={handleSaveAddress} className="px-8 py-2.5 bg-primary hover:bg-green-700 text-white font-bold text-sm uppercase rounded shadow-lg transition-all transform active:scale-95 flex items-center gap-2">
                <Check size={16} /> {isEditingAddress ? 'Update Address' : 'Save Address'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default EditUser;