import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Check, Loader2, ChevronDown } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [parentCategories, setParentCategories] = useState([]);

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

    useEffect(() => {
        const getData = async () => {
            try {
                // 1. Sabhi categories fetch karein dropdown ke liye
                const allCatsRes = await axios.get(`${API_URL}/category/fetch`);
                if (allCatsRes.data.status) {
                    setParentCategories(allCatsRes.data.data || []);
                }

                // 2. Specific category fetch karein edit ke liye
                const res = await axios.get(`${API_URL}/category/fetch?_id=${id}`);
                if (res.data.status && res.data.data) {
                    const fetchedData = res.data.data; // Kyunki single object aa raha hai fetch controller se
                    
                    setFormData({
                        slug: fetchedData.slug || '',
                        parentslug: fetchedData.parentslug || '',
                        mainmodule: fetchedData.mainmodule || '',
                        oldid: fetchedData.oldid || '',
                        parentid: fetchedData.parentid || '',
                        categorytitle: fetchedData.categorytitle || '',
                        active: fetchedData.active || 'active',
                        lft: fetchedData.lft || '',
                        rght: fetchedData.rght || '',
                        level: fetchedData.level || '',
                        metatitle: fetchedData.metatitle || '',
                        metakeywords: fetchedData.metakeywords || '',
                        metadescription: fetchedData.metadescription || '',
                        producttype: fetchedData.producttype || '',
                        newslettercategory: fetchedData.newslettercategory || 'No',
                        newsletterorder: fetchedData.newsletterorder || '',
                        categoryiconname: fetchedData.categoryiconname || ''
                    });
                }
            } catch (err) {
                console.error(err);
                toast.error("Data loading failed");
            } finally {
                setLoading(false);
            }
        };
        if (id) getData();
    }, [id, API_URL]);

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        setFormData((prev) => {
            let updatedData = { ...prev, [name]: value };
    
            // 🟢 Case 1: Jab Category Title edit karein (Slug aur Path update logic)
            if (name === 'categorytitle') {
                const newSlug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                updatedData.slug = newSlug;
    
                // Agar Parent selected hai toh path update karein
                if (prev.parentid && prev.parentid !== 'root') {
                    const parent = parentCategories.find(cat => cat._id === prev.parentid);
                    if (parent) {
                        // Parent ka backend vala path ('parentslug') base banayein
                        const basePath = (parent.parentslug && parent.parentslug !== 'root-category') 
                            ? parent.parentslug 
                            : parent.slug;
                        updatedData.parentslug = `${basePath}/${newSlug}`;
                    }
                } else {
                    updatedData.parentslug = 'root-category';
                }
            }
    
            // 🟢 Case 2: Jab Parent badlein (Hierarchy update logic)
            if (name === 'parentid') {
                const selectedParent = parentCategories.find(cat => cat._id === value);
                
                if (selectedParent) {
                    // Level set karein (Parent Level + 1)
                    updatedData.level = (Number(selectedParent.level) || 0) + 1;
                    
                    const currentSlug = updatedData.slug || prev.slug || '';
                    
                    // Parent ka pura rasta base banayein
                    const basePath = (selectedParent.parentslug && selectedParent.parentslug !== 'root-category')
                        ? selectedParent.parentslug
                        : selectedParent.slug;
    
                    // Final Path = ParentPath + CurrentSlug
                    updatedData.parentslug = currentSlug 
                        ? `${basePath}/${currentSlug}` 
                        : basePath;
                } else {
                    // Agar 'Root Category' select kiya
                    updatedData.parentslug = 'root-category';
                    updatedData.level = 0;
                }
            }
    
            return updatedData;
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        const data = new FormData();
        
        // Backend requirement ke hisaab se _id append karein
        data.append('_id', id);

        // Sabhi fields ko backend model keys ke hisaab se append karein
        Object.keys(formData).forEach(key => {
            // categoryiconname ko file upload ke waqt skip kar sakte hain agar naya file select hua ho
            data.append(key, formData[key]);
        });

        // Nayi image append karein agar select ki gayi hai
        if (selectedFile) {
            data.append('categoryicon', selectedFile); 
        }

        try {
            const res = await axios.post(`${API_URL}/category/update`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.status) {
                toast.success("Category Updated Successfully!");
                navigate('/admin/categories');
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || "Update failed");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold">Loading Category Data...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-roboto">
            <div className="bg-white rounded shadow border border-gray-200 max-w-5xl mx-auto overflow-hidden">
                <div className="bg-primary p-4 text-white font-bold uppercase tracking-wider flex justify-between items-center">
                    <span>Edit Category: {formData.categorytitle}</span>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-4">
                    {/* Form Rows for all 16 fields */}
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
                        <select name="parentid" value={formData.parentid} onChange={handleChange} className="theme-input bg-white cursor-pointer">
                            <option value="">Select Parent</option>
                            <option value="root">Root Category</option>
                            {parentCategories.filter(c => c._id !== id).map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.categorytitle}
                                </option>
                            ))}
                        </select>
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
                        <select name="producttype" value={formData.producttype} onChange={handleChange} className="theme-input bg-white cursor-pointer">
                            <option value="">Select Product type</option>
                            <option value="book">Book</option>
                            <option value="cd">CD/DVD</option>
                        </select>
                    </FormRow>

                    <FormRow label="Category Image">
                        <div className="flex items-center gap-4">
                            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" accept="image/*" />
                            {formData.categoryiconname && !selectedFile && (
                                <div className="flex flex-col items-center">
                                    <img 
                                        src={`${API_URL}${formData.categoryiconname}`} 
                                        className="h-12 w-12 object-cover border rounded shadow-sm" 
                                        alt="current icon" 
                                        onError={(e) => e.target.style.display='none'}
                                    />
                                    <span className="text-[9px] text-gray-400">Current Icon</span>
                                </div>
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
                            disabled={updating} 
                            className="bg-primary text-white px-10 py-2.5 rounded font-bold text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-opacity-90 disabled:opacity-50 transition-all"
                        >
                            {updating ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />} 
                            Update Category
                        </button>
                        <button 
                            type="button" 
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

// Form Row Component for structured layout
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