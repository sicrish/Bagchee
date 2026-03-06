import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Save, RotateCcw, Plus, Search, Check, X, Upload, Eye, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import 'react-quill/dist/quill.snow.css';
import axios from '../../utils/axiosConfig';
import { useQuery, useMutation } from '@tanstack/react-query'; // 🟢 React Query
import { validateImageFiles } from '../../utils/fileValidator'; // 🟢 Image Validator

const AddBook = () => {
    const navigate = useNavigate();
    const editor = useRef(null);

    const [imageFile, setImageFile] = useState(null);
    const [categories, setCategories] = useState([]);

    const [preview, setPreview] = useState(null);
    const [tocImageFile, setTocImageFile] = useState(null);
    const [tocPreview, setTocPreview] = useState(null);

    // 🟢 NEW: Multi-Image States (TOC, Related, Sample)
    const [tocImagesList, setTocImagesList] = useState([]);
    const [relatedImagesList, setRelatedImagesList] = useState([]);
    const [sampleImagesList, setSampleImagesList] = useState([]);

    // States for editors
    const [synopsis, setSynopsis] = useState('');
    const [criticsNote, setCriticsNote] = useState('');
    const [searchText, setSearchText] = useState('');
    const [categorySearch, setCategorySearch] = useState(""); 
    
    const [isLeadingOpen, setIsLeadingOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    
    const [languages, setLanguages] = useState([]);
    const [languageSearch, setLanguageSearch] = useState("");
    const [leadingSearch, setLeadingSearch] = useState("");
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    
    const [tags, setTags] = useState([]);
    const [tagSearch, setTagSearch] = useState("");
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    
    const [authors, setAuthors] = useState([]);
    const [authorSearch, setAuthorSearch] = useState("");
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
    
    const [formats, setFormats] = useState([]);
    const [formatSearch, setFormatSearch] = useState("");
    const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
    
    const [seriesList, setSeriesList] = useState([]);
    const [seriesSearch, setSeriesSearch] = useState("");
    const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);
    
    const [publishers, setPublishers] = useState([]);
    const [publisherSearch, setPublisherSearch] = useState("");
    const [isPublisherDropdownOpen, setIsPublisherDropdownOpen] = useState(false);
    
    const [relatedSearchQuery, setRelatedSearchQuery] = useState("");
    const [relatedSearchResults, setRelatedSearchResults] = useState([]);
    const [isRelatedDropdownOpen, setIsRelatedDropdownOpen] = useState(false);
    const [isRelatedSearching, setIsRelatedSearching] = useState(false);
    const [selectedRelatedItems, setSelectedRelatedItems] = useState([]);

    // 🟢 Author Panel States
    const [isAuthorPanelOpen, setIsAuthorPanelOpen] = useState(false);
    const [newAuthorData, setNewAuthorData] = useState({ first_name: '', last_name: '', origin: '' });
    const [newAuthorProfile, setNewAuthorProfile] = useState('');
    const [newAuthorImage, setNewAuthorImage] = useState(null);

    // 🟢 Series Quick Add States
    const [isSeriesPanelOpen, setIsSeriesPanelOpen] = useState(false);
    const [newSeriesData, setNewSeriesData] = useState({ title: '' });

    // 🟢 User Input Date
    const [userSelectedDate, setUserSelectedDate] = useState(''); 
    const [arrivalDays, setArrivalDays] = useState(30); 

    // 🟢 Publisher Quick Add States
    const [isPubPanelOpen, setIsPubPanelOpen] = useState(false);
    const [newPubImage, setNewPubImage] = useState(null);
    const [newPubPreview, setNewPubPreview] = useState(null);
    const [newPubData, setNewPubData] = useState({
        category: '', title: '', company: '', address: '', place: '',
        email: '', phone: '', fax: '', date: '', order: '',
        show: '', slug: '', ship_in_days: ''
    });

    const [formData, setFormData] = useState({
        title: '',
        leading_category: '',
        product_categories: [],
        product_languages: [],
        product_tags: [],
        product_formats: [], 
        related_products: '',
        authors_search: '',
        authors: [],
        volume: '',
        edition: '',
        isbn10: '',
        isbn13: '',
        total_pages: '',
        weight: '',
        price: '', 
        real_price: '',
        inr_price: '',
        discount: '',
        bagchee_id: '',
        stock: 'active',
        availability: '',
        notes: '',
        meta_title: '',
        meta_keywords: '',
        meta_description: '',
        active: 'active',
        recommended: 'inactive',
        upcoming: 'inactive',
        upcoming_date: '',
        new_release: 'inactive',
        exclusive: 'inactive',
        series: '',
        series_number: '',
        publisher: '',
        ship_days: '',
        deliver_days: '',
        pub_date: '',
        source: '',
        rating: '',
        rated_times: '',
        new_release_until: ''
    });

    // =======================================================================
    // 🚀 OPTIMIZATION 1: REACT QUERY - Fetching 8 APIs together in cache
    // =======================================================================
    const { data: masterData, isLoading: isMasterLoading } = useQuery({
        queryKey: ['addBookMasterData'],
        queryFn: async () => {
            const API_URL = process.env.REACT_APP_API_URL;
            const [catRes, langRes, tagRes, authRes, fmtRes, serRes, pubRes, setRes] = await Promise.all([
                axios.get(`${API_URL}/category/fetch`),
                axios.get(`${API_URL}/languages/list`),
                axios.get(`${API_URL}/tags/list`),
                axios.get(`${API_URL}/authors/list`),
                axios.get(`${API_URL}/formats/list`),
                axios.get(`${API_URL}/series/list`),
                axios.get(`${API_URL}/publishers/list`),
                axios.get(`${API_URL}/settings/list`)
            ]);

            return {
                categories: catRes.data.data || [],
                languages: langRes.data.data || [],
                tags: tagRes.data.data || [],
                authors: authRes.data.data || [],
                formats: fmtRes.data.data || [],
                series: serRes.data.data || [],
                publishers: pubRes.data.data || [],
                arrivalDays: (setRes.data.status && setRes.data.data.length > 0) ? (setRes.data.data[0].new_arrival_time || 30) : 30
            };
        },
        staleTime: 1000 * 60 * 10 // 10 minutes cache
    });

    // Populate state from cache
    useEffect(() => {
        if (masterData) {
            setCategories(masterData.categories);
            setLanguages(masterData.languages);
            setTags(masterData.tags);
            setAuthors(masterData.authors);
            setFormats(masterData.formats);
            setSeriesList(masterData.series);
            setPublishers(masterData.publishers);
            setArrivalDays(masterData.arrivalDays);
        }
    }, [masterData]);

    // =======================================================================
    // 🚀 OPTIMIZATION 2: REACT QUERY MUTATIONS (Main + Quick Adds)
    // =======================================================================
    const saveBookMutation = useMutation({
        mutationFn: async (submitData) => {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/product/save`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        }
    });

    const saveAuthorMutation = useMutation({
        mutationFn: async (data) => {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/authors/save`, data);
            return res.data;
        }
    });

    const savePublisherMutation = useMutation({
        mutationFn: async (data) => {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/publishers/save`, data);
            return res.data;
        }
    });

    const saveSeriesMutation = useMutation({
        mutationFn: async (data) => {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/series/save`, data);
            return res.data;
        }
    });

    // 🟢 MAGIC CALCULATION
    useEffect(() => {
        if (formData.new_release === 'active' && userSelectedDate) {
            const startDate = new Date(userSelectedDate);
            startDate.setDate(startDate.getDate() + Number(arrivalDays));
            const finalDate = startDate.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, new_release_until: finalDate }));
        }
    }, [userSelectedDate, formData.new_release, arrivalDays]);

    const getCalculatedDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + Number(arrivalDays));
        return date.toISOString().split('T')[0];
    };

    const handleNewReleaseChange = (e) => {
        const val = e.target.value;
        if (val === 'active') {
            const dateToSet = userSelectedDate || getCalculatedDate();
            setFormData({ ...formData, new_release: 'active', new_release_until: dateToSet });
            setUserSelectedDate(dateToSet);
        } else {
            setFormData({ ...formData, new_release: 'inactive', new_release_until: '' });
            setUserSelectedDate('');
        }
    };

    // 🟢 Quick Save Author (React Query)
    const handleQuickAuthorSave = (e) => {
        e.preventDefault();
        if (!newAuthorData.first_name) return toast.error("First name is required!");

        const toastId = toast.loading("Saving new author...");
        const data = new FormData();
        data.append('first_name', newAuthorData.first_name);
        data.append('last_name', newAuthorData.last_name);
        data.append('origin', newAuthorData.origin);
        data.append('profile', newAuthorProfile);
        if (newAuthorImage) data.append('picture', newAuthorImage);

        saveAuthorMutation.mutate(data, {
            onSuccess: (res) => {
                if (res.status) {
                    toast.success("Author added & linked!", { id: toastId });
                    const savedAuthor = res.data;
                    setAuthors(prev => [...prev, savedAuthor]);
                    setFormData(prev => ({ ...prev, authors: [...prev.authors, savedAuthor._id] }));
                    setIsAuthorPanelOpen(false);
                    setNewAuthorData({ first_name: '', last_name: '', origin: '' });
                    setNewAuthorProfile('');
                    setNewAuthorImage(null);
                } else {
                    toast.error("Failed to save", { id: toastId });
                }
            },
            onError: () => toast.error("Failed to save author", { id: toastId })
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }; 
    
    const handleCheckboxChange = (field, value) => {
        setFormData((prev) => {
            const currentList = prev[field] || [];
            if (currentList.includes(value)) {
                return { ...prev, [field]: currentList.filter((item) => item !== value) };
            } else {
                return { ...prev, [field]: [...currentList, value] };
            }
        });
    };

    // 🟢 Quick Save Publisher (React Query)
    const handleQuickPubSave = (e) => {
        e.preventDefault();
        if (!newPubData.title || !newPubData.category) {
            return toast.error("Title and Category are required!");
        }

        const toastId = toast.loading("Saving publisher...");
        const data = new FormData();
        Object.keys(newPubData).forEach(key => {
            if (key === 'date' && !newPubData[key]) return;
            data.append(key, newPubData[key]);
        });
        if (newPubImage) data.append('image', newPubImage);

        savePublisherMutation.mutate(data, {
            onSuccess: (res) => {
                if (res.status) {
                    toast.success("Publisher added & linked!", { id: toastId });
                    const savedPub = res.data;
                    setPublishers(prev => [...prev, savedPub]);
                    setFormData(prev => ({ ...prev, publisher: savedPub._id }));
                    setIsPubPanelOpen(false);
                    setNewPubData({ category: '', title: '', company: '', address: '', place: '', email: '', phone: '', fax: '', date: '', order: '', show: '', slug: '', ship_in_days: '' });
                    setNewPubImage(null);
                    setNewPubPreview(null);
                }
            },
            onError: () => toast.error("Save failed", { id: toastId })
        });
    };

    // 🟢 Quick Save Series (React Query)
    const handleQuickSeriesSave = (e) => {
        e.preventDefault();
        if (!newSeriesData.title) return toast.error("Series title is required!");

        const toastId = toast.loading("Saving new series...");
        saveSeriesMutation.mutate(newSeriesData, {
            onSuccess: (res) => {
                if (res.status) {
                    toast.success("Series added & linked! 📚", { id: toastId });
                    const savedSeries = res.data;
                    setSeriesList(prev => [...prev, savedSeries]);
                    setFormData(prev => ({ ...prev, series: savedSeries._id, series_number: "1" }));
                    setIsSeriesPanelOpen(false);
                    setNewSeriesData({ title: '' });
                }
            },
            onError: () => toast.error("Failed to save series", { id: toastId })
        });
    };

    // Helpers to Add/Remove dynamic image rows
    const addImageRow = (setter) => {
        setter(prev => [...prev, { id: Date.now(), file: null, order: prev.length + 1 }]);
    };

    const removeImageRow = (setter, id) => {
        setter(prev => prev.filter(item => item.id !== id));
    };

    // 🚀 OPTIMIZATION 3: Validation in Dynamic Array Images
    const handleDynamicImageChange = (setter, id, file, e) => {
        if (!file) return;
        if (validateImageFiles(file)) {
            setter(prev => prev.map(item => item.id === id ? { ...item, file: file } : item));
        } else {
            if(e) e.target.value = "";
        }
    };

    const handleDynamicOrderChange = (setter, id, order) => {
        setter(prev => prev.map(item => item.id === id ? { ...item, order: order } : item));
    };

    // 🟢 Main Form Submit (React Query)
    const handleSubmit = (e, actionType) => {
        e.preventDefault();
        
        if (!formData.title || !formData.price) return toast.error("Title and Price are required!");
        if (!formData.leading_category) return toast.error("Please select a Category!");

        const toastId = toast.loading("Saving book details...");
        const data = new FormData();

        data.append('title', formData.title);
        data.append('price', formData.price);
        data.append('real_price', formData.real_price || '');
        data.append('inr_price', formData.inr_price);
        data.append('discount', formData.discount || '');
        data.append('isbn13', formData.isbn13 || '');
        data.append('isbn10', formData.isbn10 || '');
        data.append('leading_category', formData.leading_category);
        data.append('language', formData.language || 'English');
        data.append('pages', formData.total_pages || ''); 
        data.append('weight', formData.weight || '');
        data.append('edition', formData.edition || '');
        data.append('volume', formData.volume || '');
        
        data.append('active', formData.active);
        data.append('recommended', formData.recommended);
        data.append('upcoming', formData.upcoming);
        data.append('upcoming_date', formData.upcoming_date || '')
        data.append('new_release', formData.new_release);
        data.append('new_release_until', formData.new_release_until || '');
        data.append('exclusive', formData.exclusive);
        data.append('stock', formData.stock); 
        data.append('availability', formData.availability || '');
        data.append('notes', formData.notes || '');
        data.append('ship_days', formData.ship_days || '');
        data.append('deliver_days', formData.deliver_days || '');
        data.append('pub_date', formData.pub_date || '');
        data.append('source', formData.source || '');
        data.append('rating', formData.rating || '');
        data.append('rated_times', formData.rated_times || '');
        data.append('related_products', formData.related_products || '');

        if (formData.authors && formData.authors.length > 0) {
            const firstAuthorId = formData.authors[0]; 
            data.append('author', firstAuthorId);     
            data.append('author_id', firstAuthorId);  
            data.append('authors', JSON.stringify(formData.authors));
        }

        if (formData.product_categories) data.append('product_categories', JSON.stringify(formData.product_categories));
        if (formData.product_languages) data.append('product_languages', JSON.stringify(formData.product_languages));
        if (formData.product_tags) data.append('product_tags', JSON.stringify(formData.product_tags));
        if (formData.product_formats) data.append('product_formats', JSON.stringify(formData.product_formats));

        data.append('bagchee_id', formData.bagchee_id || '');
        if (formData.series) data.append('series', formData.series);
        if (formData.series_number) data.append('series_number', formData.series_number);
        if (formData.publisher) data.append('publisher', formData.publisher);

        data.append('meta_title', formData.meta_title || '');
        data.append('meta_description', formData.meta_description || '');
        data.append('meta_keywords', formData.meta_keywords || '');
        data.append('synopsis', synopsis || '');
        data.append('critics_note', criticsNote || '');
        data.append('search_text', searchText || '');

        if (imageFile) data.append('default_image', imageFile);
        if (tocImageFile) data.append('toc_image', tocImageFile);

        tocImagesList.forEach(item => {
            if (item.file) {
                data.append(`toc_images`, item.file);
                data.append(`toc_images_order`, item.order);
            }
        });

        relatedImagesList.forEach(item => {
            if (item.file) {
                data.append(`related_images`, item.file);
                data.append(`related_images_order`, item.order);
            }
        });

        sampleImagesList.forEach(item => {
            if (item.file) {
                data.append(`sample_images`, item.file);
                data.append(`sample_images_order`, item.order);
            }
        });

        saveBookMutation.mutate(data, {
            onSuccess: (response) => {
                if (response.status) {
                    toast.success("Book Added Successfully!", { id: toastId });
                    if (actionType === 'back') {
                        navigate('/admin/books');
                    } else {
                        // Reset all fields manually to stay on page
                        window.location.reload(); 
                    }
                } else {
                    toast.error(response.msg || "Error saving book", { id: toastId });
                }
            },
            onError: (error) => {
                const errorMsg = error.response?.data?.message || error.response?.data?.msg || "Failed to save book";
                toast.error(errorMsg, { id: toastId });
            }
        });
    };

    const config = useMemo(() => ({
        readonly: false,
        placeholder: 'Start typing here...',
        toolbarSticky: false,
        theme: "default",
        buttons: [
            'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
            'superscript', 'subscript', '|', 'brush', 'eraser', '|',
            'ul', 'ol', '|', 'outdent', 'indent', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'image', 'table', 'link', '|', 'align', 'undo', 'redo', '|',
            'hr', 'eraser', 'fullsize', 'print', 'about'
        ],
        height: 350,
    }), []);

    const handleSeriesSelect = (series) => {
        setFormData(prev => ({
            ...prev,
            series: series._id,
            series_number: series.total_books ? (series.total_books + 1).toString() : "1"
        }));
        setIsSeriesDropdownOpen(false);
        setSeriesSearch("");
    };

    const handlePublisherSelect = (pub) => {
        setFormData(prev => ({ ...prev, publisher: pub._id }));
        setIsPublisherDropdownOpen(false);
        setPublisherSearch(""); 
    };

    // Related Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (relatedSearchQuery.length > 2 && isRelatedDropdownOpen) {
                setIsRelatedSearching(true);
                try {
                    const API_URL = process.env.REACT_APP_API_URL;
                    const res = await axios.get(`${API_URL}/product/fetch?keyword=${relatedSearchQuery}&limit=10`);
                    if (res.data.status) setRelatedSearchResults(res.data.data);
                } catch (error) { console.error(error); }
                finally { setIsRelatedSearching(false); }
            } else { setRelatedSearchResults([]); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [relatedSearchQuery, isRelatedDropdownOpen]);

    const handleAddRelatedProduct = (product) => {
        const idToAdd = product.bagchee_id || product._id;
        if (selectedRelatedItems.find(item => item.id === idToAdd)) return toast.error("Already linked!");
        const updatedList = [...selectedRelatedItems, { id: idToAdd, title: product.title }];
        setSelectedRelatedItems(updatedList);
        const idsString = updatedList.map(item => item.id).join(',');
        setFormData(prev => ({ ...prev, related_products: idsString }));
        toast.success("Linked!");
        setRelatedSearchQuery("");
        setIsRelatedDropdownOpen(false);
    };

    const handleRemoveRelatedProduct = (idToRemove) => {
        const updatedList = selectedRelatedItems.filter(item => item.id !== idToRemove);
        setSelectedRelatedItems(updatedList);
        const idsString = updatedList.map(item => item.id).join(',');
        setFormData(prev => ({ ...prev, related_products: idsString }));
    };

    useEffect(() => {
        const { title, isbn10, isbn13 } = formData; 
        const activeIsbn = isbn13 ? isbn13 : (isbn10 ? isbn10 : '');
        const autoMetaTitle = title ? `${title} ${activeIsbn ? `, ${activeIsbn}` : ''}` : '';
        const autoMetaDesc = title ? (activeIsbn ? `${activeIsbn}, ${title}` : title) : '';

        setFormData(prev => ({
            ...prev,
            meta_title: autoMetaTitle,
            meta_description: autoMetaDesc
        }));
    }, [formData.title, formData.isbn10, formData.isbn13]);

    useEffect(() => {
        if (!imageFile) { setPreview(null); return; }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const removeImage = () => {
        setImageFile(null);
        document.getElementById('default_image_input').value = "";
    };

    useEffect(() => {
        if (!tocImageFile) { setTocPreview(null); return; }
        const objectUrl = URL.createObjectURL(tocImageFile);
        setTocPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [tocImageFile]);

    const removeTocImage = () => {
        setTocImageFile(null);
        document.getElementById('toc_image_input').value = "";
    };

    const selectedLeadingCategory = categories.find(c => c._id === formData.leading_category);

    return (
        <div className="bg-gray-50 min-h-screen font-body text-text-main">
            {/* --- TOP HEADER BAR --- */}
            <div className="bg-primary  text-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-lg font-bold text-gray-700 uppercase tracking-tight">Add Books</h1>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 space-y-6">
                        
                        {/* Master Loader UI */}
                        {isMasterLoading && (
                            <div className="text-center text-primary font-bold text-sm py-4 animate-pulse">
                                Loading application data...
                            </div>
                        )}

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Title*</label>
                            <div className="col-span-9">
                                <input name="title" type="text" onChange={handleChange} className="theme-input w-full" placeholder="Enter book title" />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Leading category*</label>
                            <div className="col-span-9 relative"> 
                                <div onClick={() => setIsLeadingOpen(!isLeadingOpen)} className="theme-input w-1/2 cursor-pointer flex justify-between items-center bg-white border border-gray-300 rounded p-2 text-sm">
                                    <span className={selectedLeadingCategory ? "text-gray-700" : "text-gray-400"}>
                                        {selectedLeadingCategory ? selectedLeadingCategory.categorytitle : "Select category"}
                                    </span>
                                    <span className="text-gray-400 text-[10px]">▼</span>
                                </div>
                                {isLeadingOpen && (
                                    <div className="absolute z-50 mt-1 w-1/2 bg-white border border-gray-300 rounded shadow-lg max-h-60 flex flex-col">
                                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                                            <input type="text" placeholder="Search..." value={leadingSearch} onChange={(e) => setLeadingSearch(e.target.value)} className="w-full text-xs p-1.5 border border-gray-200 rounded focus:border-primary outline-none" autoFocus />
                                        </div>
                                        <div className="overflow-y-auto">
                                            {categories.filter(cat => cat.categorytitle.toLowerCase().includes(leadingSearch.toLowerCase())).map((cat) => (
                                                <div key={cat._id} onClick={() => { setFormData({ ...formData, leading_category: cat._id }); setIsLeadingOpen(false); setLeadingSearch(""); }} className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.leading_category === cat._id ? "bg-blue-50 text-primary font-bold" : "text-gray-600"}`}>
                                                    {cat.categorytitle}
                                                </div>
                                            ))}
                                            {categories.filter(cat => cat.categorytitle.toLowerCase().includes(leadingSearch.toLowerCase())).length === 0 && (
                                                <div className="p-3 text-xs text-gray-400 text-center">No category found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product categories</label>
                            <div className="col-span-9 relative"> 
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
                                    {formData.product_categories && formData.product_categories.length > 0 ? (
                                        formData.product_categories.map((catId) => {
                                            const category = categories.find(c => c._id === catId);
                                            return category ? (
                                                <span key={catId} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                    {category.categorytitle}
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('product_categories', catId); }} className="hover:text-red-500">×</button>
                                                </span>
                                            ) : null;
                                        })
                                    ) : <span className="text-gray-400 text-xs">Select categories...</span>}
                                    <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                </div>
                                {isCategoryDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                            <input type="text" placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300">
                                            {categories.filter((cat) => cat.categorytitle.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => {
                                                const isSelected = formData.product_categories.includes(cat._id);
                                                return (
                                                    <div key={cat.categorytitle} onClick={() => handleCheckboxChange('product_categories', cat._id)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span className={`text-gray-700 ${isSelected ? 'font-bold text-primary' : ''}`}>{cat.categorytitle}</span>
                                                    </div>
                                                );
                                            })}
                                            {categories.filter(cat => cat.categorytitle.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                                                <div className="p-3 text-xs text-gray-400 text-center">No categories found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {isCategoryDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product languages</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}>
                                    {formData.product_languages && formData.product_languages.length > 0 ? (
                                        formData.product_languages.map((selectedLang, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                {selectedLang}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('product_languages', selectedLang); }} className="hover:text-red-500">×</button>
                                            </span>
                                        ))
                                    ) : <span className="text-gray-400 text-xs">Select languages...</span>}
                                    <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                </div>
                                {isLanguageDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                            <input type="text" placeholder="Search languages..." value={languageSearch} onChange={(e) => setLanguageSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300">
                                            {languages.filter((lang) => { const name = lang.title || lang; return name.toLowerCase().includes(languageSearch.toLowerCase()); }).map((lang, idx) => {
                                                const name = lang.title || lang;
                                                const isSelected = formData.product_languages && formData.product_languages.includes(name);
                                                return (
                                                    <div key={idx} onClick={() => handleCheckboxChange('product_languages', name)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span className={`text-gray-700 ${isSelected ? 'font-bold text-primary' : ''}`}>{name}</span>
                                                    </div>
                                                );
                                            })}
                                            {languages.filter(l => (l.title || l).toLowerCase().includes(languageSearch.toLowerCase())).length === 0 && (
                                                <div className="p-3 text-xs text-gray-400 text-center">No language found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {isLanguageDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsLanguageDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product tags</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}>
                                    {formData.product_tags && formData.product_tags.length > 0 ? (
                                        formData.product_tags.map((selectedTag, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                {selectedTag}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('product_tags', selectedTag); }} className="hover:text-red-500">×</button>
                                            </span>
                                        ))
                                    ) : <span className="text-gray-400 text-xs">Select tags...</span>}
                                    <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                </div>
                                {isTagDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                            <input type="text" placeholder="Search tags..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300">
                                            {tags.filter((tag) => { const name = tag.title || tag; return name.toLowerCase().includes(tagSearch.toLowerCase()); }).map((tag, idx) => {
                                                const name = tag.title || tag;
                                                const isSelected = formData.product_tags && formData.product_tags.includes(name);
                                                return (
                                                    <div key={idx} onClick={() => handleCheckboxChange('product_tags', name)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span className={`text-gray-700 ${isSelected ? 'font-bold text-primary' : ''}`}>{name}</span>
                                                    </div>
                                                );
                                            })}
                                            {tags.filter(t => (t.title || t).toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                                                <div className="p-3 text-xs text-gray-400 text-center">No tag found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {isTagDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsTagDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Related products</label>
                            <div className="col-span-9 space-y-3">
                                {selectedRelatedItems.length > 0 && (
                                    <div className="space-y-1">
                                        {selectedRelatedItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                                <span className="text-xs text-gray-700 font-medium">{item.title} <span className="text-gray-400">({item.id})</span></span>
                                                <button type="button" onClick={() => handleRemoveRelatedProduct(item.id)} className="text-red-500 hover:text-red-700 font-bold px-2">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <input type="text" value={relatedSearchQuery} onChange={(e) => { setRelatedSearchQuery(e.target.value); setIsRelatedDropdownOpen(true); }} onFocus={() => setIsRelatedDropdownOpen(true)} placeholder="Search product by isbn or title or id" className="theme-input w-full" />
                                    {isRelatedDropdownOpen && relatedSearchQuery.length > 2 && (
                                        <div className="absolute z-50 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
                                            {relatedSearchResults.length > 0 ? relatedSearchResults.map(prod => (
                                                <div key={prod._id} onClick={() => handleAddRelatedProduct(prod)} className="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer">
                                                    <span className="text-sm font-bold block">{prod.title}</span>
                                                    <span className="text-[10px] text-gray-500">ID: {prod.bagchee_id || prod._id}</span>
                                                </div>
                                            )) : <div className="p-3 text-xs text-gray-400 text-center">No products found</div>}
                                        </div>
                                    )}
                                    {isRelatedDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsRelatedDropdownOpen(false)}></div>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-6">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Authors</label>
                            <div className="col-span-9 space-y-3">
                                <div className="relative">
                                    <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}>
                                        {formData.authors && formData.authors.length > 0 ? (
                                            formData.authors.map((authId) => {
                                                const author = authors.find(a => a._id === authId);
                                                const authorName = author ? `${author.first_name} ${author.last_name}` : "Unknown Author";
                                                return (
                                                    <span key={authId} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                        {authorName}
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('authors', authId); }} className="hover:text-red-500">×</button>
                                                    </span>
                                                );
                                            })
                                        ) : <span className="text-gray-400 text-xs">Select authors...</span>}
                                        <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                    </div>
                                    {isAuthorDropdownOpen && (
                                        <div className="absolute z-[100] top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                                <input type="text" placeholder="Search authors..." value={authorSearch} onChange={(e) => setAuthorSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white" autoFocus />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                                {authors.filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(authorSearch.toLowerCase())).map((auth) => {
                                                    const isSelected = formData.authors.includes(auth._id);
                                                    return (
                                                        <div key={auth._id} onClick={() => handleCheckboxChange('authors', auth._id)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50 font-bold text-primary' : ''}`}>
                                                            <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                            <span>{auth.first_name} {auth.last_name}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {isAuthorDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsAuthorDropdownOpen(false)}></div>}
                                </div>
                                <div className="flex justify-start">
                                    <button type="button" onClick={() => setIsAuthorPanelOpen(!isAuthorPanelOpen)} className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2">
                                        {isAuthorPanelOpen ? <X size={14} /> : <Plus size={14} />} Add new author
                                    </button>
                                </div>
                                {isAuthorPanelOpen && (
                                    <div className="p-6 bg-cream-50/50 border-2 border-primary/10 rounded-xl space-y-5 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                                            <Plus size={16} strokeWidth={3} />
                                            <h3 className="text-xs font-bold uppercase font-montserrat tracking-wider">Quick Author Registration</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">First Name*</label>
                                                <input type="text" value={newAuthorData.first_name} onChange={(e) => setNewAuthorData({ ...newAuthorData, first_name: e.target.value })} className="theme-input w-full bg-white" placeholder="First Name" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Last Name</label>
                                                <input type="text" value={newAuthorData.last_name} onChange={(e) => setNewAuthorData({ ...newAuthorData, last_name: e.target.value })} className="theme-input w-full bg-white" placeholder="Last Name" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Author Picture</label>
                                                <div className="flex items-center gap-3">
                                                    {/* 🟢 IMAGE VALIDATION APPLIED HERE */}
                                                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded text-[10px] font-bold uppercase hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        <Upload size={14} className="inline mr-2" /> {newAuthorImage ? "Change file" : "Upload Picture"}
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if(!file) return;
                                                            if(validateImageFiles(file)) {
                                                                setNewAuthorImage(file);
                                                            } else {
                                                                e.target.value = "";
                                                            }
                                                        }} />
                                                    </label>
                                                    {newAuthorImage && <span className="text-[10px] text-green-600 font-bold italic">{newAuthorImage.name}</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Origin</label>
                                                <input type="text" value={newAuthorData.origin} onChange={(e) => setNewAuthorData({ ...newAuthorData, origin: e.target.value })} className="theme-input w-full bg-white" placeholder="e.g. India" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Author Profile</label>
                                            <div className="bg-white rounded border shadow-sm overflow-hidden">
                                                <JoditEditor value={newAuthorProfile} config={{ height: 200, placeholder: 'Write author profile details...' }} onBlur={c => setNewAuthorProfile(c)} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                                            <button type="button" onClick={() => setIsAuthorPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600 px-4 transition-colors">Discard</button>
                                            <button type="button" disabled={saveAuthorMutation.isPending} onClick={handleQuickAuthorSave} className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all">
                                                {saveAuthorMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save & Link Author
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 text-gray-400">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-tight">Ordered items</label>
                            <div className="col-span-9">
                                <input type="text" disabled readOnly value="No orders yet" className="theme-input w-full bg-gray-50 cursor-not-allowed border-dashed" />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product formats</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}>
                                    {formData.product_formats && formData.product_formats.length > 0 ? (
                                        formData.product_formats.map((fmtName, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                {fmtName}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('product_formats', fmtName); }} className="hover:text-red-500">×</button>
                                            </span>
                                        ))
                                    ) : <span className="text-gray-400 text-xs">Select formats...</span>}
                                    <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                </div>
                                {isFormatDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                            <input type="text" placeholder="Search formats..." value={formatSearch} onChange={(e) => setFormatSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300">
                                            {formats.filter((fmt) => { const name = fmt.title || fmt; return name.toLowerCase().includes(formatSearch.toLowerCase()); }).map((fmt, idx) => {
                                                const name = fmt.title || fmt;
                                                const isSelected = formData.product_formats && formData.product_formats.includes(name);
                                                return (
                                                    <div key={idx} onClick={() => handleCheckboxChange('product_formats', name)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span className={`text-gray-700 ${isSelected ? 'font-bold text-primary' : ''}`}>{name}</span>
                                                    </div>
                                                );
                                            })}
                                            {formats.filter(f => (f.title || f).toLowerCase().includes(formatSearch.toLowerCase())).length === 0 && (
                                                <div className="p-3 text-xs text-gray-400 text-center">No format found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {isFormatDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsFormatDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Volume</label>
                            <div className="col-span-9"><input name="volume" type="text" onChange={handleChange} className="theme-input w-full md:w-1/3" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Edition</label>
                            <div className="col-span-9"><input name="edition" type="text" onChange={handleChange} className="theme-input w-full md:w-1/3" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Isbn 10</label>
                            <div className="col-span-9"><input name="isbn10" type="text" onChange={handleChange} className="theme-input w-full md:w-1/2" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Isbn 13</label>
                            <div className="col-span-9"><input name="isbn13" type="text" onChange={handleChange} className="theme-input w-full md:w-1/2" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Total pages</label>
                            <div className="col-span-9"><input name="total_pages" type="number" onChange={handleChange} className="theme-input w-32" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Weight</label>
                            <div className="col-span-9"><input name="weight" type="text" onChange={handleChange} className="theme-input w-32" placeholder="e.g. 500g" /></div>
                        </div>

                        {/* 🟢 IMAGE VALIDATION 1: DEFAULT IMAGE */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Default image</label>
                            <div className="col-span-9">
                                <input
                                    type="file" id="default_image_input" className="hidden" accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(!file) return;
                                        if(validateImageFiles(file)) {
                                            setImageFile(file);
                                        } else {
                                            e.target.value = "";
                                        }
                                    }}
                                />
                                <div className="flex items-start gap-4">
                                    <label htmlFor="default_image_input" className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-3 rounded-lg text-[11px] font-bold uppercase hover:bg-gray-50 hover:border-blue-400 transition-all shadow-sm flex flex-col items-center gap-1 text-gray-500 min-w-[100px]">
                                        <Upload size={18} className="text-gray-400" /><span>Upload</span>
                                    </label>
                                    {preview && (
                                        <div className="relative group">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col justify-center ml-2">
                                                <button onClick={removeImage} type="button" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors" title="Remove image"><X size={12} /></button>
                                            </div>
                                        </div>
                                    )}
                                    {imageFile && (
                                        <div className="flex flex-col justify-center h-16">
                                            <span className="text-[11px] font-bold text-gray-700 truncate max-w-[150px]">{imageFile.name}</span>
                                            <span className="text-[9px] text-gray-400">{(imageFile.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 🟢 IMAGE VALIDATION 2: DEFAULT TOC IMAGE */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Default toc image</label>
                            <div className="col-span-9 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    {tocPreview && (
                                        <div className="relative group">
                                            <img src={tocPreview} alt="TOC Preview" className="w-16 h-20 object-cover border rounded shadow-sm" />
                                            <button type="button" onClick={removeTocImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110"><X size={10} /></button>
                                        </div>
                                    )}
                                    <input
                                        type="file" id="toc_image_input" className="hidden" accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if(!file) return;
                                            if(validateImageFiles(file)) {
                                                setTocImageFile(file);
                                            } else {
                                                e.target.value = "";
                                            }
                                        }}
                                    />
                                    <label htmlFor="toc_image_input" className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2">
                                        <Upload size={14} /> {tocPreview ? "Change" : "Upload"}
                                    </label>
                                    {tocImageFile && (
                                        <div className="flex flex-col justify-center h-16">
                                            <span className="text-[11px] font-bold text-gray-700 truncate max-w-[150px]">{tocImageFile.name}</span>
                                            <span className="text-[9px] text-gray-400">{(tocImageFile.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 🟢 IMAGE VALIDATION 3: MULTIPLE TOC IMAGES */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Add toc images</label>
                            <div className="md:col-span-9 space-y-3">
                                {tocImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {item.file ? <img src={URL.createObjectURL(item.file)} alt="preview" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input
                                                type="file" id={`toc_upload_${item.id}`} className="hidden" accept="image/*"
                                                onChange={(e) => handleDynamicImageChange(setTocImagesList, item.id, e.target.files[0], e)}
                                            />
                                            <label htmlFor={`toc_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-primary hover:text-primary transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : "Upload Image"}
                                            </label>
                                            {item.file && <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">{item.file.name}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <input type="number" value={item.order} onChange={(e) => handleDynamicOrderChange(setTocImagesList, item.id, e.target.value)} className="theme-input w-16 text-center text-xs" placeholder="Ord" />
                                            <button type="button" onClick={() => removeImageRow(setTocImagesList, item.id)} className="bg-red-100 text-red-500 p-2 rounded hover:bg-red-200 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addImageRow(setTocImagesList)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-all shadow-sm"><Plus size={14} /> Add additional toc image</button>
                            </div>
                        </div>

                        {/* 🟢 IMAGE VALIDATION 4: MULTIPLE RELATED IMAGES */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Related images</label>
                            <div className="md:col-span-9 space-y-3">
                                {relatedImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {item.file ? <img src={URL.createObjectURL(item.file)} alt="preview" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input
                                                type="file" id={`rel_upload_${item.id}`} className="hidden" accept="image/*"
                                                onChange={(e) => handleDynamicImageChange(setRelatedImagesList, item.id, e.target.files[0], e)}
                                            />
                                            <label htmlFor={`rel_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-primary hover:text-primary transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : "Upload Image"}
                                            </label>
                                            {item.file && <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">{item.file.name}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <input type="number" value={item.order} onChange={(e) => handleDynamicOrderChange(setRelatedImagesList, item.id, e.target.value)} className="theme-input w-16 text-center text-xs" placeholder="Ord" />
                                            <button type="button" onClick={() => removeImageRow(setRelatedImagesList, item.id)} className="bg-red-100 text-red-500 p-2 rounded hover:bg-red-200 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addImageRow(setRelatedImagesList)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-all shadow-sm"><Plus size={14} /> Add related image</button>
                            </div>
                        </div>

                        {/* 🟢 IMAGE VALIDATION 5: MULTIPLE SAMPLE IMAGES */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Sample images</label>
                            <div className="md:col-span-9 space-y-3">
                                {sampleImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {item.file ? <img src={URL.createObjectURL(item.file)} alt="preview" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input
                                                type="file" id={`samp_upload_${item.id}`} className="hidden" accept="image/*"
                                                onChange={(e) => handleDynamicImageChange(setSampleImagesList, item.id, e.target.files[0], e)}
                                            />
                                            <label htmlFor={`samp_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-primary hover:text-primary transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : "Upload Image"}
                                            </label>
                                            {item.file && <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">{item.file.name}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <input type="number" value={item.order} onChange={(e) => handleDynamicOrderChange(setSampleImagesList, item.id, e.target.value)} className="theme-input w-16 text-center text-xs" placeholder="Ord" />
                                            <button type="button" onClick={() => removeImageRow(setSampleImagesList, item.id)} className="bg-red-100 text-red-500 p-2 rounded hover:bg-red-200 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addImageRow(setSampleImagesList)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-all shadow-sm"><Plus size={14} /> Add sample image</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Pub date</label>
                            <div className="col-span-9 space-y-1">
                                <input name="pub_date" type="text" onChange={handleChange} className="theme-input w-full md:w-1/3" placeholder="yyyy-mm-dd" />
                                <button type="button" className="block text-primary text-[10px] font-bold hover:underline">Clear (yyyy-mm-dd)</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Source</label>
                            <div className="col-span-9"><input name="source" type="text" onChange={handleChange} className="theme-input w-full" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Bagchee id</label>
                            <div className="col-span-9 flex gap-2">
                                <input name="bagchee_id" type="text" value="Auto-generated (BB + ID)" readOnly className="theme-input w-full bg-gray-100 text-gray-500 cursor-not-allowed" />
                                <button type="button" disabled className="bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold uppercase text-gray-400 cursor-not-allowed shadow-sm whitespace-nowrap">Product page</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Rating</label>
                            <div className="col-span-9">
                                <select name="rating" onChange={handleChange} className="theme-input w-32">
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Rated times</label>
                            <div className="col-span-9"><input name="rated_times" type="number" onChange={handleChange} className="theme-input w-32" /></div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Series</label>
                            <div className="col-span-9 space-y-3">
                                <div className="relative">
                                    <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex justify-between items-center hover:border-primary transition-colors theme-input w-full md:w-1/2" onClick={() => setIsSeriesDropdownOpen(!isSeriesDropdownOpen)}>
                                        <span className={formData.series ? "text-gray-700 font-medium" : "text-gray-400 text-sm"}>{formData.series ? (seriesList.find(s => s._id === formData.series)?.title || "Unknown Series") : "Select Series"}</span>
                                        <span className="text-gray-400 text-[10px]">▼</span>
                                    </div>
                                    {isSeriesDropdownOpen && (
                                        <div className="absolute z-20 top-full left-0 w-full md:w-1/2 bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <input type="text" placeholder="Search series..." value={seriesSearch} onChange={(e) => setSeriesSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none" autoFocus />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                                {seriesList.filter(s => s.title.toLowerCase().includes(seriesSearch.toLowerCase())).map(s => (
                                                    <div key={s._id} onClick={() => handleSeriesSelect(s)} className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.series === s._id ? "bg-blue-50 text-primary font-bold" : "text-gray-600"}`}>{s.title}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {isSeriesDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsSeriesDropdownOpen(false)}></div>}
                                </div>
                                <div className="flex justify-start">
                                    <button type="button" onClick={() => setIsSeriesPanelOpen(!isSeriesPanelOpen)} className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2">
                                        {isSeriesPanelOpen ? <X size={14} /> : <Plus size={14} />} Add new series
                                    </button>
                                </div>
                                {isSeriesPanelOpen && (
                                    <div className="p-5 bg-cream-50/50 border-2 border-primary/10 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                                            <Plus size={16} strokeWidth={3} />
                                            <h3 className="text-xs font-bold uppercase font-montserrat tracking-wider">Quick Series Registration</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Series Title*</label>
                                            <input type="text" value={newSeriesData.title} onChange={(e) => setNewSeriesData({ title: e.target.value })} className="theme-input w-full bg-white" placeholder="e.g. Harry Potter" />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button type="button" onClick={() => setIsSeriesPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600 px-4 transition-colors">Discard</button>
                                            <button type="button" disabled={saveSeriesMutation.isPending} onClick={handleQuickSeriesSave} className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all">
                                                {saveSeriesMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save & Link Series
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Series number</label>
                            <div className="col-span-9">
                                <input name="series_number" type="number" value={formData.series_number || ""} onChange={handleChange} className="theme-input w-full md:w-1/3" placeholder="e.g. 1, 2, 3" />
                                <p className="text-[10px] text-gray-400 mt-1">Automatically suggested based on series count (editable).</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Price*</label>
                            <div className="col-span-9"><input name="price" type="number" onChange={handleChange} className="theme-input w-full md:w-1/3" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Real price</label>
                            <div className="col-span-9"><input name="real_price" type="number" onChange={handleChange} className="theme-input w-full md:w-1/3" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Inr price</label>
                            <div className="col-span-9"><input name="inr_price" type="number" onChange={handleChange} className="theme-input w-full md:w-1/3" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Discount</label>
                            <div className="col-span-9"><input name="discount" type="number" onChange={handleChange} className="theme-input w-32" placeholder="%" /></div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-1">Stock</label>
                            <div className="col-span-9 space-y-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="stock" value="active" onChange={handleChange} className="accent-primary" defaultChecked /> active</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="stock" value="inactive" onChange={handleChange} className="accent-primary" /> inactive</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Availability</label>
                            <div className="col-span-9"><input name="availability" type="text" onChange={handleChange} className="theme-input w-full" /></div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Synopsis</label>
                            <div className="col-span-9 border rounded-md overflow-hidden shadow-sm">
                                <JoditEditor ref={editor} value={synopsis} config={config} onBlur={newContent => setSynopsis(newContent)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">From the critics</label>
                            <div className="col-span-9 border rounded-md overflow-hidden shadow-sm">
                                <JoditEditor value={criticsNote} config={config} onBlur={newContent => setCriticsNote(newContent)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 mt-6">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Notes</label>
                            <div className="col-span-9"><input name="notes" type="text" onChange={handleChange} className="theme-input w-full" /></div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Publisher</label>
                            <div className="col-span-9 space-y-3">
                                <div className="relative">
                                    <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex justify-between items-center hover:border-primary transition-colors theme-input w-full md:w-1/2" onClick={() => setIsPublisherDropdownOpen(!isPublisherDropdownOpen)}>
                                        <span className={formData.publisher ? "text-gray-700 font-medium" : "text-gray-400 text-sm"}>{formData.publisher ? (publishers.find(p => p._id === formData.publisher)?.name || publishers.find(p => p._id === formData.publisher)?.title || "Unknown Publisher") : "Select Publisher"}</span>
                                        <ChevronDown size={14} className="text-gray-400" />
                                    </div>
                                    {isPublisherDropdownOpen && (
                                        <div className="absolute z-20 top-full left-0 w-full md:w-1/2 bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="p-2 border-b bg-gray-50">
                                                <input type="text" placeholder="Search..." value={publisherSearch} onChange={(e) => setPublisherSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border rounded outline-none" autoFocus />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {publishers.filter(p => (p.name || p.title || "").toLowerCase().includes(publisherSearch.toLowerCase())).map(p => (
                                                    <div key={p._id} onClick={() => handlePublisherSelect(p)} className="px-3 py-2 text-sm hover:bg-primary/5 cursor-pointer">{p.name || p.title}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-start">
                                    <button type="button" onClick={() => setIsPubPanelOpen(!isPubPanelOpen)} className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2">
                                        {isPubPanelOpen ? <X size={14} /> : <Plus size={14} />} Add new publisher
                                    </button>
                                </div>
                                {isPubPanelOpen && (
                                    <div className="mt-4 p-6 bg-cream-50/50 border-2 border-primary/10 rounded-xl space-y-4 animate-in slide-in-from-top-2 max-h-[600px] overflow-y-auto custom-scrollbar shadow-inner">
                                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2 mb-2">
                                            <Plus size={16} strokeWidth={3} />
                                            <h3 className="text-xs font-bold uppercase font-montserrat">Quick Publisher Registration</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Category*</label>
                                                <select value={newPubData.category} onChange={(e) => setNewPubData({ ...newPubData, category: e.target.value })} className="theme-input w-full bg-white text-xs">
                                                    <option value="">Select Category</option>
                                                    {categories.map(c => <option key={c._id} value={c._id}>{c.categorytitle}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Title*</label>
                                                <input type="text" value={newPubData.title} onChange={(e) => { const val = e.target.value; setNewPubData({ ...newPubData, title: val, slug: val.toLowerCase().replace(/\s+/g, '-') }); }} className="theme-input w-full bg-white text-xs" placeholder="Publisher Title" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                                                <input type="email" value={newPubData.email} onChange={(e) => setNewPubData({ ...newPubData, email: e.target.value })} className="theme-input w-full bg-white text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Image</label>
                                                <div className="flex items-center gap-2">
                                                    {/* 🟢 IMAGE VALIDATION APPLIED HERE */}
                                                    <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-gray-50 flex items-center gap-1 shadow-sm">
                                                        <Upload size={12} /> {newPubImage ? "Changed" : "Upload"}
                                                        <input type="file" className="hidden" onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if(!file) return;
                                                            if(validateImageFiles(file)) {
                                                                setNewPubImage(file);
                                                                setNewPubPreview(URL.createObjectURL(file));
                                                            } else {
                                                                e.target.value = "";
                                                            }
                                                        }} />
                                                    </label>
                                                    {newPubPreview && <img src={newPubPreview} className="h-8 w-8 object-contain rounded border bg-white" alt="prev" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <input type="text" placeholder="Address" value={newPubData.address} onChange={(e) => setNewPubData({ ...newPubData, address: e.target.value })} className="theme-input w-full bg-white text-xs" />
                                            <div className="grid grid-cols-3 gap-2">
                                                <input type="text" placeholder="Place" value={newPubData.place} onChange={(e) => setNewPubData({ ...newPubData, place: e.target.value })} className="theme-input text-xs" />
                                                <input type="text" placeholder="Phone" value={newPubData.phone} onChange={(e) => setNewPubData({ ...newPubData, phone: e.target.value })} className="theme-input text-xs" />
                                                <input type="number" placeholder="Order" value={newPubData.order} onChange={(e) => setNewPubData({ ...newPubData, order: e.target.value })} className="theme-input text-xs" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                                            <button type="button" onClick={() => setIsPubPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 px-4">Discard</button>
                                            <button type="button" disabled={savePublisherMutation.isPending} onClick={handleQuickPubSave} className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 disabled:opacity-50">
                                                {savePublisherMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save & Link Publisher
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Meta title</label>
                            <div className="col-span-9"><input name="meta_title" type="text" value={formData.meta_title || ''} onChange={handleChange} className="theme-input w-full" placeholder="Auto-generated from Title & ISBN" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Meta keywords</label>
                            <div className="col-span-9"><input name="meta_keywords" type="text" onChange={handleChange} className="theme-input w-full" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Meta description</label>
                            <div className="col-span-9"><input name="meta_description" type="text" onChange={handleChange} value={formData.meta_description || ''} className="theme-input w-full " placeholder="Auto-generated description..." /></div>
                        </div>

                        {[ { label: "Active", name: "active" }, { label: "Recommended", name: "recommended" } ].map((item) => (
                            <div key={item.name} className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                                <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">{item.label}</label>
                                <div className="col-span-9 flex gap-6">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name={item.name} value="active" checked={formData[item.name] === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active</label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name={item.name} value="inactive" checked={formData[item.name] === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive</label>
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4 mt-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-1 font-montserrat">Upcoming</label>
                            <div className="col-span-9">
                                <div className="flex gap-6 mb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body"><input type="radio" name="upcoming" value="active" onChange={handleChange} checked={formData.upcoming === "active"} className="accent-primary w-4 h-4" /> active</label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body"><input type="radio" name="upcoming" value="inactive" onChange={(e) => { handleChange(e); setFormData(prev => ({ ...prev, upcoming_date: '' })); }} checked={formData.upcoming === "inactive"} className="accent-primary w-4 h-4" /> inactive</label>
                                </div>
                                {formData.upcoming === 'active' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300 p-3 bg-orange-50/50 rounded border border-orange-100 mt-2">
                                        <label className="block text-[10px] text-orange-600 font-bold mb-1 font-montserrat uppercase">Expected Launch Date</label>
                                        <div className="flex items-center gap-3">
                                            <input type="date" name="upcoming_date" value={formData.upcoming_date} onChange={handleChange} className="theme-input w-40 border-orange-200 focus:border-orange-400 focus:ring-orange-100" />
                                            <span className="text-gray-400 text-[11px] italic font-body">* This book will be highlighted as 'Pre-Order' or 'Coming Soon'</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-1">New release</label>
                            <div className="col-span-9">
                                <div className="flex gap-6 mb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="new_release" value="active" onChange={(e) => { handleNewReleaseChange(e); if (!userSelectedDate) setUserSelectedDate(new Date().toISOString().split('T')[0]); }} checked={formData.new_release === "active"} className="accent-primary w-4 h-4" /> active</label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="new_release" value="inactive" onChange={handleNewReleaseChange} checked={formData.new_release === "inactive"} className="accent-primary w-4 h-4" /> inactive</label>
                                </div>
                                {formData.new_release === 'active' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300 p-3 bg-blue-50/50 rounded border border-blue-100">
                                        <label className="block text-[10px] text-primary font-bold mb-1">SELECT START DATE</label>
                                        <div className="flex items-center gap-3">
                                            <input type="date" value={userSelectedDate} onChange={(e) => setUserSelectedDate(e.target.value)} className="theme-input w-40 border-primary/50" />
                                            <span className="text-gray-400 text-xs font-bold">+ {arrivalDays} Days (Settings)</span>
                                        </div>
                                        <div className="mt-2 text-[11px] text-gray-500">Will stay in "New Arrivals" until: <span className="font-bold text-black bg-yellow-100 px-1 rounded">{formData.new_release_until || '...'}</span></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight font-montserrat">Exclusive</label>
                            <div className="col-span-9 flex gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-body"><input type="radio" name="exclusive" value="active" checked={formData.exclusive === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-body"><input type="radio" name="exclusive" value="inactive" checked={formData.exclusive === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Ship in days</label>
                            <div className="col-span-9">
                                <select name="ship_days" onChange={handleChange} className="theme-input w-48">
                                    <option value="">Select Days</option>
                                    {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} Days</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Deliver in days</label>
                            <div className="col-span-9">
                                <select name="deliver_days" onChange={handleChange} className="theme-input w-48">
                                    <option value="">Select Days</option>
                                    {[1, 2, 3, 4, 5, 7, 10, 15].map(d => <option key={d} value={d}>{d} Days</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Search text</label>
                            <div className="col-span-9 border rounded-md overflow-hidden shadow-sm">
                                <JoditEditor value={searchText} config={config} onBlur={newContent => setSearchText(newContent)} />
                            </div>
                        </div>

                        {/* --- FINAL ACTION BUTTONS --- */}
                        <div className="flex justify-center items-center gap-4 pt-10 pb-6 border-t mt-8">
                            <button onClick={(e) => handleSubmit(e, 'stay')} disabled={saveBookMutation.isPending} type="button" className="flex items-center bg-primary text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                                {saveBookMutation.isPending ? "Processing..." : <><Check size={16} className="inline mr-2" /> Save</>}
                            </button>
                            <button onClick={(e) => handleSubmit(e, 'back')} type="button" disabled={saveBookMutation.isPending} className="flex items-center bg-gray-800 text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50">
                                Save and go back to list
                            </button>
                            <button type="button" disabled={saveBookMutation.isPending} onClick={() => navigate('/admin/books')} className="flex items-center bg-white border border-gray-300 text-gray-600 px-8 py-2.5 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50">
                                <X size={16} className="mr-2" /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
            .theme-input { 
            border: 1px solid #d1d5db; 
            border-radius: 4px; 
            padding: 8px 12px; 
            font-size: 13px; 
            outline: none; 
            transition: border-color 0.2s; 
            }
            .theme-input:focus { 
            border-color: #008DDA; 
            box-shadow: 0 0 0 2px rgba(0, 141, 218, 0.1); 
            }
        `}</style>
        </div>
    );
};

export default AddBook;