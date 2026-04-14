import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Check, Loader2, ChevronDown, Upload, XCircle, X } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query'; // 🟢 React Query added
import { validateImageFiles } from '../../utils/fileValidator'; // 🟢 Image Validator added

const EditCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // 🟢 Input control ke liye
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // 🟢 Server wali purani image
    const [localPreview, setLocalPreview] = useState(null); // 🟢 Nayi select ki hui image ka preview

    const API_URL = process.env.REACT_APP_API_URL;

    // 🟢 Backend Model ke exact naming ke hisaab se state (16 Fields)
    const [formData, setFormData] = useState({
        slug: '',
        parentslug: '',
        mainmodule: '',
        oldid: '',
        parentid: '',
        categorytitle: '',
        active: 'active',
        lft: '',
        rght: '',
        level: '',
        metatitle: '',
        metakeywords: '',
        metadescription: '',
        producttype: '',
        newslettercategory: 'No',
        newsletterorder: '',
        categoryiconname: '' // Purani image path ke liye
    });

    // 🟢 React Query 1: Dropdown ke liye sabhi categories fetch karein (Cached)
    const { data: parentCategories = [] } = useQuery({
        queryKey: ['allCategoriesDropdown'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/category/fetch`);
            if (res.data.status) {
                return res.data.data || [];
            }
            return [];
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    // 🟢 React Query 2: Jis category ko edit karna hai, uska data fetch karein
    const { isLoading: loadingCategory } = useQuery({
        queryKey: ['categoryDetail', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await axios.get(`${API_URL}/category/fetch?_id=${id}`);
            if (res.data.status && res.data.data) {
                const fetchedData = res.data.data;
                
                setFormData({
                    slug: fetchedData.slug || '',
                    parentslug: fetchedData.parentSlug || fetchedData.parentslug || '',
                    mainmodule: fetchedData.mainModule || fetchedData.mainmodule || '',
                    oldid: fetchedData.oldId || fetchedData.oldid || '',
                    parentid: fetchedData.parentId || fetchedData.parentid || '',
                    categorytitle: fetchedData.title || fetchedData.categorytitle || '',
                    active: fetchedData.active ? 'active' : 'inactive',
                    lft: fetchedData.lft || '',
                    rght: fetchedData.rght || '',
                    level: fetchedData.level || '',
                    metatitle: fetchedData.metaTitle || fetchedData.metatitle || '',
                    metakeywords: fetchedData.metaKeywords || fetchedData.metakeywords || '',
                    metadescription: fetchedData.metaDesc || fetchedData.metadescription || '',
                    producttype: fetchedData.productType || fetchedData.producttype || '',
                    newslettercategory: fetchedData.newsletterCategory ? 'Yes' : (fetchedData.newslettercategory || 'No'),
                    newsletterorder: fetchedData.newsletterOrder || fetchedData.newsletterorder || '',
                    categoryiconname: fetchedData.image || fetchedData.categoryiconname || ''
                });

                // Agar purani image (icon) hai toh preview me dikhao
                const iconPath = fetchedData.image || fetchedData.categoryiconname;
                if (iconPath) {
                    setPreviewImage(`${API_URL}${iconPath}`);
                }
                return fetchedData;
            }
            throw new Error("Category not found");
        },
        enabled: !!id, // Jab id ho tabhi chalaye
        onError: (err) => {
            console.error(err);
            toast.error("Data loading failed");
            navigate('/admin/categories');
        }
    });

    // 🟢 Memory cleanup for local preview
    useEffect(() => {
        return () => {
            if (localPreview) URL.revokeObjectURL(localPreview);
        };
    }, [localPreview]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
    
        setFormData((prev) => {
            let updatedData = { ...prev, [name]: value };
    
            if (name === 'categorytitle') {
                const newSlug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                updatedData.slug = newSlug;
    
                if (prev.parentid && prev.parentid !== 'root') {
                    const parent = parentCategories.find(cat => String(cat.id || cat._id) === String(prev.parentid));
                    if (parent) {
                        const basePath = (parent.parentslug && parent.parentslug !== 'root-category') 
                            ? parent.parentslug 
                            : parent.slug;
                        updatedData.parentslug = `${basePath}/${newSlug}`;
                    }
                } else {
                    updatedData.parentslug = 'root-category';
                }
            }
    
            if (name === 'parentid') {
                const selectedParent = parentCategories.find(cat => String(cat.id || cat._id) === String(value));
                
                if (selectedParent) {
                    updatedData.level = (Number(selectedParent.level) || 0) + 1;
                    const currentSlug = updatedData.slug || prev.slug || '';
                    
                    const basePath = (selectedParent.parentslug && selectedParent.parentslug !== 'root-category')
                        ? selectedParent.parentslug
                        : selectedParent.slug;
    
                    updatedData.parentslug = currentSlug 
                        ? `${basePath}/${currentSlug}` 
                        : basePath;
                } else {
                    updatedData.parentslug = 'root-category';
                    updatedData.level = 0;
                }
            }
    
            return updatedData;
        });
    }, [parentCategories]);

    // 🟢 Image Handler with Validation & Local Preview
    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (validateImageFiles(file)) {
            setSelectedFile(file);
            setLocalPreview(URL.createObjectURL(file)); // Naya temporary URL banaya
        } else {
            e.target.value = ""; 
            setLocalPreview(null);
        }
    }, []);

    // 🟢 Remove NEW Image Logic (Purani image wapas layega)
    const handleRemoveImage = useCallback(() => {
        setSelectedFile(null);
        if (localPreview) {
            URL.revokeObjectURL(localPreview); // Memory free
        }
        setLocalPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Form input clear
        }
    }, [localPreview]);

    // 🟢 React Query: Mutation for submitting form
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
        
        if (!formData.categorytitle || !formData.slug) {
            return toast.error("Category Title and Slug are required!");
        }

        const data = new FormData();
        data.append('_id', id);

        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        if (selectedFile) {
            data.append('categoryicon', selectedFile); 
        }

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

    if (loadingCategory) return <div className="h-screen flex items-center justify-center font-bold text-primary"><Loader2 className="animate-spin mr-2" /> Loading Category Data...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-roboto">
            <div className="bg-white rounded shadow border border-gray-200 max-w-5xl mx-auto overflow-hidden">
                <div className="bg-primary p-4 text-white font-bold uppercase tracking-wider flex justify-between items-center">
                    <span>Edit Category: {formData.categorytitle}</span>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-4">
                    <FormRow label="Slug *">
                        <input name="slug" value={formData.slug} onChange={handleChange} className="theme-input" required />
                    </FormRow>

                    <FormRow label="Parents slug">
                        <input name="parentslug" value={formData.parentslug} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Main module">
                        <input name="mainmodule" value={formData.mainmodule} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Old id">
                        <input name="oldid" value={formData.oldid} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Parent id">
                        <div className="relative">
                            <select name="parentid" value={formData.parentid} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer w-full">
                                <option value="">Select Parent</option>
                                <option value="root">Root Category</option>
                                {parentCategories.filter(c => String(c.id || c._id) !== String(id)).map((cat) => (
                                    <option key={cat.id || cat._id} value={cat.id || cat._id}>
                                        {cat.title || cat.categorytitle || cat.categoryTitle || "Unnamed Category"}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
                        </div>
                    </FormRow>

                    <FormRow label="Category Title *">
                        <input name="categorytitle" value={formData.categorytitle} onChange={handleChange} className="theme-input font-bold" required />
                    </FormRow>

                    <FormRow label="Active">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" name="active" value="active" checked={formData.active === "active"} onChange={handleChange} /> active
                            </label>
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" name="active" value="inactive" checked={formData.active === "inactive"} onChange={handleChange} /> inactive
                            </label>
                        </div>
                    </FormRow>

                    <FormRow label="Lft">
                        <input type="number" name="lft" value={formData.lft} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Rght">
                        <input type="number" name="rght" value={formData.rght} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Level">
                        <input type="number" name="level" value={formData.level} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Meta title">
                        <input name="metatitle" value={formData.metatitle} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Meta keywords">
                        <input name="metakeywords" value={formData.metakeywords} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <FormRow label="Meta description">
                        <textarea name="metadescription" value={formData.metadescription} onChange={handleChange} className="theme-input h-20 py-2" />
                    </FormRow>

                    <FormRow label="Product type">
                        <div className="relative">
                            <select name="producttype" value={formData.producttype} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer w-full">
                                <option value="">Select Product type</option>
                                <option value="book">Book</option>
                                <option value="cd">CD/DVD</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
                        </div>
                    </FormRow>

                    {/* 🟢 SMART PREVIEW AND UPLOAD LOGIC */}
                    <FormRow label="Category Image">
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col gap-2 justify-center min-h-[64px]">
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                                        <Upload size={14} />
                                        {localPreview || previewImage ? "Change Image" : "Upload Image"}
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                        />
                                    </label>
                                </div>
                            </div>
                            
                            {/* Premium Image Preview (Local ya Server) */}
                            {(localPreview || previewImage) && (
                                <div className="relative inline-block w-20 h-20 border border-gray-200 rounded-md shadow-sm p-1 bg-white group">
                                    <img
                                        src={localPreview || previewImage}
                                        alt="Category Preview"
                                        className="w-full h-full object-contain rounded-sm"
                                    />
                                    
                                    {/* Delete Cross Button (Sirf Nayi file select hone par) */}
                                    {localPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full shadow-md text-white hover:bg-red-700 hover:scale-110 transition-all z-10"
                                            title="Remove new image"
                                        >
                                            <X size={16} className="m-0.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Server Icon Name Fallback text if needed */}
                            {formData.categoryiconname && !localPreview && !previewImage && (
                                <span className="text-[10px] text-gray-500 mt-2">Current File: {formData.categoryiconname}</span>
                            )}
                        </div>
                    </FormRow>

                    <FormRow label="Newsletter category">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" name="newslettercategory" value="Yes" checked={formData.newslettercategory === "Yes"} onChange={handleChange} /> Yes
                            </label>
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" name="newslettercategory" value="No" checked={formData.newslettercategory === "No"} onChange={handleChange} /> No
                            </label>
                        </div>
                    </FormRow>

                    <FormRow label="Newsletter Order">
                        <input type="number" name="newsletterorder" value={formData.newsletterorder} onChange={handleChange} className="theme-input" />
                    </FormRow>

                    <div className="flex justify-center gap-4 pt-6 border-t mt-6">
                        <button 
                            type="submit" 
                            disabled={updateCategoryMutation.isPending} 
                            className="bg-primary text-white px-10 py-2.5 rounded font-bold text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-opacity-90 disabled:opacity-50 transition-all"
                        >
                            {updateCategoryMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />} 
                            Update Category
                        </button>
                        <button 
                            type="button" 
                            disabled={updateCategoryMutation.isPending} 
                            onClick={() => navigate('/admin/categories')} 
                            className="bg-gray-800 text-white px-10 py-2.5 rounded font-bold text-xs uppercase flex items-center gap-2 shadow-md hover:bg-black transition-all"
                        >
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
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
                } 
                .theme-input:focus { 
                    border-color: #008DDA; 
                    box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.1); 
                }
            `}</style>
        </div>
    );
};

// Form Row Component
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