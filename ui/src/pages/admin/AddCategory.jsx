import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw, TriangleAlert, Upload, Check, ChevronDown, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useQuery, useMutation } from '@tanstack/react-query'; // 🟢 React Query added
import { validateImageFiles } from '../../utils/fileValidator'; // 🟢 Image Validator added

const AddCategory = () => {
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    slug: '',
    parentId: '',
    categoryTitle: '',
    active: 'inactive',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    productType: '',
  });

  // 🟢 React Query: Fetch Parent Categories (Fast & Cached)
  const { data: parentCategories = [] } = useQuery({
    queryKey: ['parentCategories'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`);
      if (response.data.status) {
        return response.data.data || response.data.categories || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // 🟢 React Query: Mutation for submitting form
  const saveCategoryMutation = useMutation({
    mutationFn: async (submitData) => {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/category/save`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }
  });

  // Preview Generation & Memory Cleanup
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  // Remove Image Logic
  const removeImage = useCallback(() => {
    setImage(null);
    setPreview(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  }, []);

  // 🟢 Image Handler with Validation
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateImageFiles(file)) {
      setImage(file);
    } else {
      e.target.value = ""; // Clear input if validation fails
      setPreview(null);
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let updatedData = { ...prev, [name]: value };

      if (name === 'categoryTitle') {
        const newSlug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        updatedData.slug = newSlug;
        if (!prev.metaTitle) updatedData.metaTitle = value;
      }
      return updatedData;
    });
  }, [parentCategories]);

  // 🟢 Form Submission using useMutation
  const handleSubmit = (e, actionType) => {
    e.preventDefault();

    if (!formData.categoryTitle || !formData.slug) {
      return toast.error("Category Title and Slug are required!");
    }

    const toastId = toast.loading("Saving category...");

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (image) {
      data.append('categoryicon', image);
    }

    saveCategoryMutation.mutate(data, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success(resData.msg || "Category Saved Successfully!", { id: toastId });

          if (actionType === 'back') {
            navigate('/admin/categories');
          } else {
            setFormData({
              slug: '', parentId: '', categoryTitle: '', active: 'inactive',
              metaTitle: '', metaKeywords: '', metaDescription: '', productType: '',
            });
            removeImage();
          }
        } else {
           toast.error(resData.msg || "Failed to save category", { id: toastId });
        }
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.msg || "Failed to connect to server";
        toast.error(errorMsg, { id: toastId });
      }
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen font-body p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-gray-100 max-w-5xl mx-auto overflow-hidden">
        <div className="bg-primary px-6 py-4 border-b border-primary-dark flex justify-between items-center">
          <h2 className="font-bold text-white font-display text-lg tracking-wide">Add Category</h2>
        </div>

        <form className="p-6 md:p-10 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormRow label="Category title *">
            <input type="text" name="categoryTitle" value={formData.categoryTitle} onChange={handleChange} className="theme-input" placeholder="e.g., History & Fiction" />
          </FormRow>

          <FormRow label="Slug *">
            <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="theme-input" placeholder="e.g., book-category-slug" />
          </FormRow>

          <FormRow label="Parent Category">
            <div className="relative">
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="theme-input appearance-none bg-white cursor-pointer"
              >
                <option value="">Select Parent id</option>
                {parentCategories && parentCategories.length > 0 ? (
                  parentCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title || "Unnamed Category"}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading categories...</option>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
            </div>
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

          <FormRow label="Meta title">
            <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="theme-input" />
          </FormRow>

          <FormRow label="Meta keywords">
            <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} className="theme-input" />
          </FormRow>

          <FormRow label="Meta description">
            <input type="text" name="metaDescription" value={formData.metaDescription} onChange={handleChange} className="theme-input" />
          </FormRow>

         

          {/* 🟢 Category Image with Validation and Preview */}
          <FormRow label="Category Image">
            <div className="flex items-start gap-4">
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
                  
                  {preview && (
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white p-0.5">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

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

          <div className="pt-8 flex flex-wrap justify-center gap-4 border-t border-gray-100 mt-8 font-montserrat">
            <button
              type="button"
              disabled={saveCategoryMutation.isPending}
              onClick={(e) => handleSubmit(e, 'stay')}
              className={`flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded shadow-lg shadow-primary/30 transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider ${saveCategoryMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {saveCategoryMutation.isPending ? 'Processing...' : <><Check size={18} strokeWidth={3} /> Save</>}
            </button>

            <button
              type="button"
              disabled={saveCategoryMutation.isPending}
              onClick={(e) => handleSubmit(e, 'back')}
              className="flex items-center gap-2 bg-text-main hover:bg-black text-white px-6 py-2.5 rounded shadow-md transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider">
              <RotateCcw size={16} /> Save and go back
            </button>

            <button type="button" disabled={saveCategoryMutation.isPending} onClick={() => navigate('/admin/categories')} className="flex items-center gap-2 bg-white border border-gray-300 text-text-muted hover:text-red-500 hover:border-red-500 px-6 py-2.5 rounded shadow-sm transition-all text-sm font-bold uppercase tracking-wider disabled:opacity-70">
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