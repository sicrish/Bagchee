import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Check, Loader2, ChevronDown, Upload, X } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { validateImageFiles } from '../../utils/fileValidator';

const EditCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);   // existing server image
    const [localPreview, setLocalPreview] = useState(null);   // newly selected image

    const API_URL = process.env.REACT_APP_API_URL;

    const [formData, setFormData] = useState({
        slug: '',
        parentId: '',
        categoryTitle: '',
        active: 'active',
        metaTitle: '',
        metaKeywords: '',
        metaDescription: '',
        productType: '',
    });

    // Fetch all categories for parent dropdown
    const { data: parentCategories = [] } = useQuery({
        queryKey: ['allCategoriesDropdown'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/category/fetch`);
            return res.data.status ? (res.data.data || []) : [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // Fetch this category's data
    const { isLoading: loadingCategory } = useQuery({
        queryKey: ['categoryDetail', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await axios.get(`${API_URL}/category/fetch?id=${id}`);
            if (res.data.status && res.data.data) {
                const d = res.data.data;
                setFormData({
                    slug: d.slug || '',
                    parentId: d.parentId ? String(d.parentId) : '',
                    categoryTitle: d.title || '',
                    active: d.active ? 'active' : 'inactive',
                    metaTitle: d.metaTitle || '',
                    metaKeywords: d.metaKeywords || '',
                    metaDescription: d.metaDesc || '',
                    productType: d.productType != null ? String(d.productType) : '',
                });
                if (d.image) setPreviewImage(`${API_URL}${d.image}`);
                return d;
            }
            throw new Error("Category not found");
        },
        enabled: !!id,
        onError: () => {
            toast.error("Failed to load category");
            navigate('/admin/categories');
        }
    });

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'categoryTitle') {
                const newSlug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                updated.slug = newSlug;
            }
            return updated;
        });
    }, []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (validateImageFiles(file)) {
            setSelectedFile(file);
            setLocalPreview(URL.createObjectURL(file));
        } else {
            e.target.value = "";
            setLocalPreview(null);
        }
    }, []);

    const handleRemoveImage = useCallback(() => {
        setSelectedFile(null);
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [localPreview]);

    const updateCategoryMutation = useMutation({
        mutationFn: async (submitData) => {
            const res = await axios.post(`${API_URL}/category/update`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        }
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        if (!formData.categoryTitle || !formData.slug) {
            return toast.error("Category Title and Slug are required!");
        }

        const data = new FormData();
        data.append('id', id);
        data.append('categorytitle', formData.categoryTitle);
        data.append('slug', formData.slug);
        data.append('parentId', formData.parentId || '');
        data.append('active', formData.active);
        data.append('metaTitle', formData.metaTitle);
        data.append('metaKeywords', formData.metaKeywords);
        data.append('metaDescription', formData.metaDescription);
        data.append('productType', formData.productType || 0);
        if (selectedFile) data.append('categoryicon', selectedFile);

        const toastId = toast.loading("Updating Category...");
        updateCategoryMutation.mutate(data, {
            onSuccess: (resData) => {
                if (resData.status) {
                    toast.success("Category Updated Successfully!", { id: toastId });
                    navigate('/admin/categories');
                } else {
                    toast.error(resData.msg || "Update failed", { id: toastId });
                }
            },
            onError: (err) => {
                toast.error(err.response?.data?.msg || "Update failed", { id: toastId });
            }
        });
    };

    if (loadingCategory) return (
        <div className="h-screen flex items-center justify-center font-bold text-primary">
            <Loader2 className="animate-spin mr-2" /> Loading Category Data...
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-roboto">
            <div className="bg-white rounded shadow border border-gray-200 max-w-5xl mx-auto overflow-hidden">
                <div className="bg-primary p-4 text-white font-bold uppercase tracking-wider">
                    Edit Category: {formData.categoryTitle}
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-4">
                    <FormRow label="Category Title *">
                        <input name="categoryTitle" value={formData.categoryTitle} onChange={handleChange} className="theme-input font-bold" required />
                    </FormRow>

                    <FormRow label="Slug *">
                        <input name="slug" value={formData.slug} onChange={handleChange} className="theme-input" required />
                    </FormRow>

                    <FormRow label="Parent Category">
                        <div className="relative">
                            <select name="parentId" value={formData.parentId} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer w-full">
                                <option value="">Root Category</option>
                                {parentCategories.filter(c => String(c.id) !== id).map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.title || "Unnamed Category"}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
                        </div>
                    </FormRow>

                    <FormRow label="Active">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" name="active" value="active" checked={formData.active === "active"} onChange={handleChange} /> Active
                            </label>
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" name="active" value="inactive" checked={formData.active === "inactive"} onChange={handleChange} /> Inactive
                            </label>
                        </div>
                    </FormRow>

                    <FormRow label="Product Type">
                        <div className="relative">
                            <select name="productType" value={formData.productType} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer w-full">
                                <option value="0">Default (0)</option>
                                <option value="1">Books (1)</option>
                                <option value="2">Music/CD (2)</option>
                                <option value="3">DVD/Video (3)</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
                        </div>
                    </FormRow>

                    <FormRow label="Meta Title">
                        <input name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Meta Keywords">
                        <input name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Meta Description">
                        <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} className="theme-input h-20 py-2" />
                    </FormRow>

                    <FormRow label="Category Image">
                        <div className="flex items-start gap-4">
                            <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                                <Upload size={14} />
                                {localPreview || previewImage ? "Change Image" : "Upload Image"}
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                            </label>

                            {(localPreview || previewImage) && (
                                <div className="relative inline-block w-20 h-20 border border-gray-200 rounded-md shadow-sm p-1 bg-white">
                                    <img src={localPreview || previewImage} alt="Category" className="w-full h-full object-contain rounded-sm" />
                                    {localPreview && (
                                        <button type="button" onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full shadow-md text-white hover:bg-red-700 transition-all">
                                            <X size={16} className="m-0.5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </FormRow>

                    <div className="flex justify-center gap-4 pt-6 border-t mt-6">
                        <button type="submit" disabled={updateCategoryMutation.isPending}
                            className="bg-primary text-white px-10 py-2.5 rounded font-bold text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-opacity-90 disabled:opacity-50 transition-all">
                            {updateCategoryMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                            Update Category
                        </button>
                        <button type="button" disabled={updateCategoryMutation.isPending} onClick={() => navigate('/admin/categories')}
                            className="bg-gray-800 text-white px-10 py-2.5 rounded font-bold text-xs uppercase flex items-center gap-2 shadow-md hover:bg-black transition-all">
                            <RotateCcw size={16} /> Cancel
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .theme-input {
                    width: 100%;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 10px 14px;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .theme-input:focus {
                    border-color: #008DDA;
                    box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.1);
                }
            `}</style>
        </div>
    );
};

const FormRow = ({ label, children }) => (
    <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
        <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {label}
        </label>
        <div className="col-span-12 md:col-span-8 lg:col-span-7">
            {children}
        </div>
    </div>
);

export default EditCategory;
