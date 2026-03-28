import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Check, Loader2, ChevronDown, Upload, X, TriangleAlert } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { validateImageFiles } from '../../utils/fileValidator';

const EditCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [localPreview, setLocalPreview] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL;

    const [formData, setFormData] = useState({
        slug: '',
        parentSlug: '',
        mainModule: '',
        oldId: '',
        parentId: '',
        categoryTitle: '',
        active: 'active',
        lft: '',
        rght: '',
        level: '',
        metaTitle: '',
        metaKeywords: '',
        metaDescription: '',
        newsletterCategory: 'no',
        newsletterOrder: '',
        productType: '',
    });

    const { data: parentCategories = [] } = useQuery({
        queryKey: ['allCategoriesDropdown'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/category/fetch`);
            return res.data.status ? (res.data.data || []) : [];
        },
        staleTime: 1000 * 60 * 5,
    });

    const { isLoading: loadingCategory } = useQuery({
        queryKey: ['categoryDetail', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await axios.get(`${API_URL}/category/fetch?id=${id}`);
            if (res.data.status && res.data.data) {
                const d = res.data.data;
                setFormData({
                    slug: d.slug || '',
                    parentSlug: d.parentSlug || '',
                    mainModule: d.mainModule || '',
                    oldId: d.oldId || '',
                    parentId: d.parentId ? String(d.parentId) : '',
                    categoryTitle: d.title || '',
                    active: d.active ? 'active' : 'inactive',
                    lft: d.lft != null ? String(d.lft) : '',
                    rght: d.rght != null ? String(d.rght) : '',
                    level: d.level != null ? String(d.level) : '',
                    metaTitle: d.metaTitle || '',
                    metaKeywords: d.metaKeywords || '',
                    metaDescription: d.metaDesc || '',
                    newsletterCategory: d.newsletterCategory ? 'yes' : 'no',
                    newsletterOrder: d.newsletterOrder != null ? String(d.newsletterOrder) : '',
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

    const handleUpdate = (e, actionType) => {
        e.preventDefault();
        if (!formData.categoryTitle || !formData.slug) {
            return toast.error("Category Title and Slug are required!");
        }

        const data = new FormData();
        data.append('id', id);
        data.append('categoryTitle', formData.categoryTitle);
        data.append('slug', formData.slug);
        data.append('parentSlug', formData.parentSlug);
        data.append('mainModule', formData.mainModule);
        data.append('oldId', formData.oldId);
        data.append('parentId', formData.parentId || '');
        data.append('active', formData.active);
        data.append('lft', formData.lft);
        data.append('rght', formData.rght);
        data.append('level', formData.level);
        data.append('metaTitle', formData.metaTitle);
        data.append('metaKeywords', formData.metaKeywords);
        data.append('metaDescription', formData.metaDescription);
        data.append('newsletterCategory', formData.newsletterCategory);
        data.append('newsletterOrder', formData.newsletterOrder);
        data.append('productType', formData.productType || 0);
        if (selectedFile) data.append('categoryicon', selectedFile);

        const toastId = toast.loading("Updating Category...");
        updateCategoryMutation.mutate(data, {
            onSuccess: (resData) => {
                if (resData.status) {
                    toast.success("Category Updated Successfully!", { id: toastId });
                    if (actionType === 'back') {
                        navigate('/admin/categories');
                    }
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
        <div className="bg-gray-50 min-h-screen font-body p-4 md:p-8">
            <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-gray-100 max-w-5xl mx-auto overflow-hidden">
                <div className="bg-primary px-6 py-4 border-b border-primary-dark flex justify-between items-center">
                    <h2 className="font-bold text-white font-display text-lg tracking-wide">Edit Category</h2>
                </div>

                <form className="p-6 md:p-10 space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <FormRow label="Slug *">
                        <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="theme-input" placeholder="e.g., book-category-slug" />
                    </FormRow>

                    <FormRow label="Parents Slug">
                        <input type="text" name="parentSlug" value={formData.parentSlug} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Main Module">
                        <input type="text" name="mainModule" value={formData.mainModule} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Old ID">
                        <input type="text" name="oldId" value={formData.oldId} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Parent ID">
                        <div className="relative">
                            <select name="parentId" value={formData.parentId} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer w-full">
                                <option value="">Select Parent id</option>
                                {parentCategories.filter(c => String(c.id) !== id).map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.title || "Unnamed Category"}
                                    </option>
                                ))}
                            </select>
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

                    {/* Category Image */}
                    <FormRow label="Category Image">
                        <div className="flex items-start gap-4">
                            <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                                <Upload size={14} />
                                {localPreview || previewImage ? "Change" : "Upload"}
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                            </label>

                            {(localPreview || previewImage) && (
                                <div className="relative inline-block w-16 h-16 border border-gray-200 rounded-lg shadow-sm p-0.5 bg-white overflow-hidden">
                                    <img src={localPreview || previewImage} alt="Category" className="w-full h-full object-contain rounded-md" />
                                    {localPreview && (
                                        <button type="button" onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full shadow-md text-white hover:bg-red-700 transition-all">
                                            <X size={14} className="m-0.5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </FormRow>

                    <FormRow label="Newsletter Category">
                        <div className="flex flex-col gap-3 pt-2">
                            {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }].map((opt) => (
                                <label key={opt.value} className="flex items-center gap-3 text-sm text-text-main font-medium cursor-pointer group font-montserrat">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.newsletterCategory === opt.value ? 'border-primary' : 'border-gray-400'}`}>
                                        {formData.newsletterCategory === opt.value && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                                    </div>
                                    <input type="radio" name="newsletterCategory" value={opt.value} checked={formData.newsletterCategory === opt.value} onChange={handleChange} className="hidden" />
                                    <span className="group-hover:text-primary transition-colors">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </FormRow>

                    <FormRow label="Newsletter Category Order">
                        <input type="text" name="newsletterOrder" value={formData.newsletterOrder} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <div className="pt-8 flex flex-wrap justify-center gap-4 border-t border-gray-100 mt-8 font-montserrat">
                        <button
                            type="button"
                            disabled={updateCategoryMutation.isPending}
                            onClick={(e) => handleUpdate(e, 'stay')}
                            className={`flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded shadow-lg shadow-primary/30 transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider ${updateCategoryMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {updateCategoryMutation.isPending ? 'Processing...' : <><Check size={18} strokeWidth={3} /> Save</>}
                        </button>

                        <button
                            type="button"
                            disabled={updateCategoryMutation.isPending}
                            onClick={(e) => handleUpdate(e, 'back')}
                            className="flex items-center gap-2 bg-text-main hover:bg-black text-white px-6 py-2.5 rounded shadow-md transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider">
                            <RotateCcw size={16} /> Save and go back
                        </button>

                        <button type="button" disabled={updateCategoryMutation.isPending} onClick={() => navigate('/admin/categories')} className="flex items-center gap-2 bg-white border border-gray-300 text-text-muted hover:text-red-500 hover:border-red-500 px-6 py-2.5 rounded shadow-sm transition-all text-sm font-bold uppercase tracking-wider disabled:opacity-70">
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

export default EditCategory;
