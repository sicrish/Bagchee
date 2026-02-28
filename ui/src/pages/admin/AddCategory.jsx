import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   RotateCcw, TriangleAlert, Upload, Check, ChevronDown, Maximize2,X
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';


const AddCategory = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(false);
   const [image, setImage] = useState(null);

   const [parentCategories, setParentCategories] = useState([]);




   // 🟢 NEW: Preview State
   const [preview, setPreview] = useState(null);

   // 🟢 NEW: Auto-generate preview whenever 'image' state changes
   useEffect(() => {
      if (!image) {
         setPreview(null);
         return;
      }

      const objectUrl = URL.createObjectURL(image);
      setPreview(objectUrl);

      // Free memory when component unmounts or image changes
      return () => URL.revokeObjectURL(objectUrl);
   }, [image]);

   // 🟢 NEW: Remove Image Function
   const removeImage = () => {
      setImage(null);
      // Input value reset karne ke liye (optional but good practice)
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
   };

   // Form State
   const [formData, setFormData] = useState({
      slug: '',
      parentsSlug: '',
      mainModule: '',
      oldId: '',
      parentId: '',
      categoryTitle: '',
      active: 'inactive',
      lft: '',
      rght: '',
      level: '',
      metaTitle: '',
      metaKeywords: '',
      metaDescription: '',
      productType: '',
      newsletter: 'no',
      newsletterCategoryOrder: ''
   });


   useEffect(() => {
      const fetchParentCategories = async () => {
         try {
            console.log("Fetching Parent Categories...");

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`);

            console.log("API Response:", response.data);
            if (response.data.status) {
               const list = response.data.data || response.data.categories;
               console.log("Setting Parent List:", list); // 🔍 Check 3
               setParentCategories(list || []);
            }
         } catch (error) {
            console.error("Error fetching parent categories:", error);
            // Optional: toast.error("Could not load parent categories");
         }
      };

      fetchParentCategories();
   }, []);

   const handleChange = (e) => {
      const { name, value } = e.target;
  
      setFormData((prev) => {
          let updatedData = { ...prev, [name]: value };
  
          // 🟢 Case 1: Category Title change hone par slug banana
          if (name === 'categoryTitle') {
              const newSlug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
              updatedData.slug = newSlug;
              if (!prev.metaTitle) updatedData.metaTitle = value;
  
              // Agar Parent selected hai toh path update karein
              if (prev.parentId) {
                  const parent = parentCategories.find(cat => cat._id === prev.parentId);
                  if (parent) {
                      // YAHAN FIX HAI: Backend key 'parentslug' check karein
                      const parentFullRoute = parent.parentslug || parent.parentsSlug; 
                      const basePath = (parentFullRoute && parentFullRoute !== 'root-category') 
                          ? parentFullRoute 
                          : parent.slug;
                      updatedData.parentsSlug = `${basePath}/${newSlug}`;
                  }
              }
          }
  
          // 🟢 Case 2: Parent ID select hone par pura rasta banana
          if (name === 'parentId') {
              const selectedParent = parentCategories.find(cat => cat._id === value);
              if (selectedParent) {
                  updatedData.level = (Number(selectedParent.level) || 0) + 1;
                  const currentSlug = updatedData.slug || prev.slug || '';
  
                  // YAHAN FIX HAI: Parent ka pura rasta 'parentslug' se nikaalein
                  // Agar parentslug available hai, toh wahi base hai, warna parent.slug base hai
                  const parentFullRoute = selectedParent.parentslug || selectedParent.parentsSlug;
                  const basePath = (parentFullRoute && parentFullRoute !== 'root-category')
                      ? parentFullRoute
                      : selectedParent.slug;
  
                  // Final Path: ParentPath + CurrentSlug
                  updatedData.parentsSlug = currentSlug 
                      ? `${basePath}/${currentSlug}` 
                      : basePath;
              } else {
                  updatedData.parentsSlug = 'root-category';
                  updatedData.level = 0;
              }
          }
          return updatedData;
      });
  };

   const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) setImage(file);
   };

   // 🟢 ACTUAL API CALL IMPLEMENTATION
   const handleSubmit = async (e, actionType) => {
      e.preventDefault();

      if (!formData.categoryTitle || !formData.slug) {
         return toast.error("Category Title and Slug are required!");
      }

      setLoading(true);
      const toastId = toast.loading("Saving category to Cloudinary...");

      try {
         const data = new FormData();

         Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
         });

         // Backend key 'categoryicon' matches Controller
         if (image) {
            data.append('categoryicon', image);
         }

         // 🟢 Using Dynamic URL from .env
         const response = await axios.post(`${process.env.REACT_APP_API_URL}/category/save`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });

         if (response.data.status) {
            toast.success(response.data.msg || "Category Saved Successfully!", { id: toastId });

            if (actionType === 'back') {
               navigate('/admin/categories');
            } else {
               setFormData({
                  slug: '', parentsSlug: '', mainModule: '', oldId: '', parentId: '',
                  categoryTitle: '', active: 'inactive', lft: '', rght: '', level: '',
                  metaTitle: '', metaKeywords: '', metaDescription: '', productType: '',
                  newsletter: 'no', newsletterCategoryOrder: ''
               });
               setImage(null);
            }
         }
      } catch (error) {
         console.error("Submit Error:", error);
         const errorMsg = error.response?.data?.msg || "Failed to connect to server";
         toast.error(errorMsg, { id: toastId });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="bg-gray-50 min-h-screen font-body p-4 md:p-8">

         <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-gray-100 max-w-5xl mx-auto overflow-hidden">

            <div className="bg-primary px-6 py-4 border-b border-primary-dark flex justify-between items-center">
               <h2 className="font-bold text-white font-display text-lg tracking-wide">Add Category</h2>

            </div>

            <form className="p-6 md:p-10 space-y-6" onSubmit={(e) => e.preventDefault()}>

               <FormRow label="Slug *">
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="theme-input" placeholder="e.g., book-category-slug" />
               </FormRow>

               <FormRow label="Parents slug">
                  <input type="text" name="parentsSlug" value={formData.parentsSlug} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Main module">
                  <input type="text" name="mainModule" value={formData.mainModule} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Old id">
                  <input type="text" name="oldId" value={formData.oldId} onChange={handleChange} className="theme-input" />
               </FormRow>

               {/* 🟢 UPDATED PARENT ID DROPDOWN */}

               <FormRow label="Parent id">
                  <div className="relative">
                     <select
                        name="parentId"
                        value={formData.parentId}
                        onChange={handleChange}
                        className="theme-input appearance-none bg-white cursor-pointer"
                     >
                        <option value="">Select Parent id</option>


                        {/* Mapping Logic Updated */}
                        {parentCategories && parentCategories.length > 0 ? (
                           parentCategories.map((category) => (
                              <option key={category._id} value={category._id}>
                                 {/* Backend keys try karein */}
                                 {category.categorytitle || category.categoryTitle || category.title || "Unnamed Category"}
                              </option>
                           ))
                        ) : (
                           <option disabled>Loading...</option>
                        )}
                     </select>

                     {/* Dropdown Arrow Icon */}
                     <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
                  </div>
               </FormRow>

               <FormRow label="Category title *">
                  <input type="text" name="categoryTitle" value={formData.categoryTitle} onChange={handleChange} className="theme-input" placeholder="e.g., History & Fiction" />
               </FormRow>

               <FormRow label="Active">
                  <div className="flex flex-col gap-3 pt-2">
                     {['active', 'inactive'].map((status) => (
                        <label key={status} className="flex items-center gap-3 text-sm text-text-main font-medium cursor-pointer group capitalize font-montserrat">
                           <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.active === status ? 'border-primary' : 'border-gray-400'}`}>
                              {formData.active === status && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                           </div>
                           <input type="radio" name="active" value={status} checked={formData.active === status} onChange={handleChange} className="hidden" />
                           <span className="group-hover:text-primary transition-colors">{status}</span>
                        </label>
                     ))}
                  </div>
               </FormRow>

               <FormRow label="Lft">
                  <input type="text" name="lft" value={formData.lft} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Rght">
                  <input type="text" name="rght" value={formData.rght} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Level">
                  <input type="text" name="level" value={formData.level} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Meta title">
                  <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Meta keywords">
                  <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Meta description">
                  <input type="text" name="metaDescription" value={formData.metaDescription} onChange={handleChange} className="theme-input" />
               </FormRow>

               <FormRow label="Product type">
                  <div className="relative">
                     <select name="productType" value={formData.productType} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer">
                        <option value="">Select Product type</option>
                        <option value="book">Book</option>

                     </select>
                     <ChevronDown size={14} className="absolute right-3 top-3.5 text-text-muted pointer-events-none" />
                  </div>
               </FormRow>

               <FormRow label="Category Image">
             <div className="flex items-start gap-4">
                 
                 

                 {/* 2. Upload Button & Status */}
                 <div className="flex flex-col gap-2 justify-center h-16">
                     <div className="flex items-center gap-3">
                         <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                            <Upload size={14} />
                            {image ? "Change" : "Upload"}
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={handleImageChange} 
                                accept="image/*" 
                            />
                         </label>
                         {/* 1. Preview Thumbnail */}
                 {preview && (
                    <div className="relative group shrink-0">
                        <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <img 
                                src={preview} 
                                alt="Preview" 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        {/* Remove Button */}
                        <button 
                            type="button" 
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                        >
                            <X size={12} />
                        </button>
                    </div>
                 )}

                         {/* File Name Display */}
                         {image && (
                             <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded">
                                <span className="text-[10px] text-primary font-bold max-w-[150px] truncate">{image.name}</span>
                                <Check size={12} className="text-green-600" />
                             </div>
                         )}
                     </div>
                 </div>
             </div>
          </FormRow>

               <FormRow label="Newsletter category">
                  <div className="flex flex-col gap-3 pt-2">
                     {['yes', 'no'].map((opt) => (
                        <label key={opt} className="flex items-center gap-3 text-sm text-text-main font-medium cursor-pointer group uppercase font-montserrat">
                           <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.newsletter === opt ? 'border-primary' : 'border-gray-400'}`}>
                              {formData.newsletter === opt && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                           </div>
                           <input type="radio" name="newsletter" value={opt} checked={formData.newsletter === opt} onChange={handleChange} className="hidden" />
                           <span className="group-hover:text-primary transition-colors">{opt}</span>
                        </label>
                     ))}
                  </div>
               </FormRow>

               <FormRow label="Newsletter category order">
                  <input type="text" name="newsletterCategoryOrder" value={formData.newsletterCategoryOrder} onChange={handleChange} className="theme-input" />
               </FormRow>

               <div className="pt-8 flex flex-wrap justify-center gap-4 border-t border-gray-100 mt-8 font-montserrat">
                  <button
                     type="button"
                     disabled={loading}
                     onClick={(e) => handleSubmit(e, 'stay')}
                     className={`flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded shadow-lg shadow-primary/30 transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                     {loading ? 'Processing...' : <><Check size={18} strokeWidth={3} /> Save</>}
                  </button>

                  <button
                     type="button"
                     disabled={loading}
                     onClick={(e) => handleSubmit(e, 'back')}
                     className="flex items-center gap-2 bg-text-main hover:bg-black text-white px-6 py-2.5 rounded shadow-md transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider">
                     <RotateCcw size={16} /> Save and go back
                  </button>

                  <button type="button" onClick={() => navigate('/admin/categories')} className="flex items-center gap-2 bg-white border border-gray-300 text-text-muted hover:text-red-500 hover:border-red-500 px-6 py-2.5 rounded shadow-sm transition-all text-sm font-bold uppercase tracking-wider">
                     <TriangleAlert size={16} /> Cancel
                  </button>
               </div>

            </form>
         </div>

         <style>{`
        .theme-input {
           width: 100%;
           border: 1px solid #e5e7eb;
           border-radius: 6px;
           padding: 10px 12px;
           font-size: 0.9rem;
           color: #1f2937;
           transition: all 0.2s;
           font-family: 'Roboto', sans-serif;
        }
        .theme-input:focus {
           border-color: #008DDA; 
           box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.1);
           outline: none;
        }
      `}</style>
      </div>
   );
};

const FormRow = ({ label, children }) => (
   <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-5 last:border-0">
      <div className="col-span-12 md:col-span-3 text-left md:text-right pt-2.5">
         <label className="text-xs font-bold text-text-muted uppercase tracking-wider font-montserrat">{label}</label>
      </div>
      <div className="col-span-12 md:col-span-9">
         {children}
      </div>
   </div>
);

export default AddCategory;