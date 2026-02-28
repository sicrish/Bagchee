import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Save, RotateCcw, Plus, Search, Check, X, Upload, Eye, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import 'react-quill/dist/quill.snow.css';
import axios from '../../utils/axiosConfig';

const EditBook = () => {
    const { id } = useParams(); // URL se ID nikalne ke liye
    const navigate = useNavigate();
    const editor = useRef(null);

    const [loading, setLoading] = useState(false);

    // Image States
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null); // Local preview (New Upload)
    const [serverImage, setServerImage] = useState(null); // Database Image

    // Add after existing image states
    const [tocImageFile, setTocImageFile] = useState(null);
    const [tocPreview, setTocPreview] = useState(null);

    // 🟢 NEW: Multi-Image States (TOC, Related, Sample)
    const [tocImagesList, setTocImagesList] = useState([]);
    const [relatedImagesList, setRelatedImagesList] = useState([]);
    const [sampleImagesList, setSampleImagesList] = useState([]);

    // Rich Text States
    const [synopsis, setSynopsis] = useState('');
    const [criticsNote, setCriticsNote] = useState('');
    const [searchText, setSearchText] = useState('');

    // --- LIST DATA STATES (Dropdowns ke liye) ---
    const [categories, setCategories] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [formats, setFormats] = useState([]);
    const [seriesList, setSeriesList] = useState([]);
    const [publishers, setPublishers] = useState([]);

    // --- SEARCH & TOGGLE STATES (UI Logic) ---
    const [leadingSearch, setLeadingSearch] = useState("");
    const [isLeadingOpen, setIsLeadingOpen] = useState(false);

    const [categorySearch, setCategorySearch] = useState("");
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const [languageSearch, setLanguageSearch] = useState("");
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

    const [tagSearch, setTagSearch] = useState("");
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

    const [authorSearch, setAuthorSearch] = useState("");
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);

    const [formatSearch, setFormatSearch] = useState("");
    const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

    const [seriesSearch, setSeriesSearch] = useState("");
    const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);

    const [publisherSearch, setPublisherSearch] = useState("");
    const [isPublisherDropdownOpen, setIsPublisherDropdownOpen] = useState(false);
    // 🟢 NEW: Related Products Search States
    const [relatedSearchQuery, setRelatedSearchQuery] = useState("");
    const [relatedSearchResults, setRelatedSearchResults] = useState([]);
    const [isRelatedDropdownOpen, setIsRelatedDropdownOpen] = useState(false);
    const [isRelatedSearching, setIsRelatedSearching] = useState(false);
    const [selectedRelatedItems, setSelectedRelatedItems] = useState([]);

    const [isAuthorPanelOpen, setIsAuthorPanelOpen] = useState(false);
    const [newAuthorData, setNewAuthorData] = useState({ first_name: '', last_name: '', origin: '' });
    const [newAuthorProfile, setNewAuthorProfile] = useState('');
    const [newAuthorImage, setNewAuthorImage] = useState(null);
    const [isAuthorSaving, setIsAuthorSaving] = useState(false);

    // 🟢 Series Quick Add States for Edit Page
    const [isSeriesPanelOpen, setIsSeriesPanelOpen] = useState(false);
    const [newSeriesData, setNewSeriesData] = useState({ title: '' });
    const [isSeriesSaving, setIsSeriesSaving] = useState(false);

    // 🟢 Publisher Quick Add States for Edit Page
    const [isPubPanelOpen, setIsPubPanelOpen] = useState(false);
    const [isPubSaving, setIsPubSaving] = useState(false);
    const [newPubImage, setNewPubImage] = useState(null);
    const [newPubPreview, setNewPubPreview] = useState(null);
    const [newPubData, setNewPubData] = useState({
        category: '', title: '', company: '', address: '', place: '',
        email: '', phone: '', order: '', slug: ''
    });

    const [userSelectedDate, setUserSelectedDate] = useState('');
    const [arrivalDays, setArrivalDays] = useState(30);


    // --- MAIN FORM STATE ---
    const [formData, setFormData] = useState({
        title: '',

        leading_category: '',
        product_categories: [],
        product_languages: [],
        product_tags: [],
        product_formats: [],
        related_products: '',
        authors: [],
        volume: '',
        edition: '',
        isbn10: '',
        isbn13: '',
        total_pages: '',
        weight: '',
        price: '',
        real_price: '',
        bagchee_id: '',
        inr_price: '',
        discount: '',
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
        series: '',
        series_number: '',
        publisher: '',
        ship_days: '',
        deliver_days: '',
        pub_date: '',
        source: '',
        rating: '',
        rated_times: '',
        toc_image: '',
        new_release_until: '',
        ordered_items_count: 0,
    });
    // 🟢 1. Search Effect (Debounced)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (relatedSearchQuery.length > 2 && isRelatedDropdownOpen) {
                setIsRelatedSearching(true);
                try {
                    const API_URL = process.env.REACT_APP_API_URL;
                    const res = await axios.get(`${API_URL}/product/fetch?keyword=${relatedSearchQuery}&limit=10`);
                    if (res.data.status) {
                        setRelatedSearchResults(res.data.data);
                    }
                } catch (error) {
                    console.error("Related Search Error:", error);
                } finally {
                    setIsRelatedSearching(false);
                }
            } else {
                setRelatedSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [relatedSearchQuery, isRelatedDropdownOpen]);

    // 🟢 2. Add Handler (Updates Display List + FormData String)
    const handleAddRelatedProduct = (product) => {
        const idToAdd = product.bagchee_id || product._id;
        const titleToAdd = product.title;

        // Duplicate Check
        if (selectedRelatedItems.find(item => item.id === idToAdd)) {
            return toast.error("Product already linked!");
        }

        // Update Display List
        const updatedList = [...selectedRelatedItems, { id: idToAdd, title: titleToAdd }];
        setSelectedRelatedItems(updatedList);

        // Update Backend String (Comma Separated)
        const idsString = updatedList.map(item => item.id).join(',');
        setFormData(prev => ({ ...prev, related_products: idsString }));

        toast.success("Product Added!");
        setRelatedSearchQuery("");
        setIsRelatedDropdownOpen(false);
    };

    // 🟢 3. Remove Handler
    const handleRemoveRelatedProduct = (idToRemove) => {
        const updatedList = selectedRelatedItems.filter(item => item.id !== idToRemove);
        setSelectedRelatedItems(updatedList);

        const idsString = updatedList.map(item => item.id).join(',');
        setFormData(prev => ({ ...prev, related_products: idsString }));
    };


    // 1. Fetch Lists & Book Data
    useEffect(() => {
        const fetchData = async () => {
            const API_URL = process.env.REACT_APP_API_URL;

            try {
                // A. Fetch All Lists (Dropdowns)
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
                console.log("📂 Categories Loaded (Sample):", catRes.data.data?.[0]);
                if (catRes.data.status) setCategories(catRes.data.data || []);
                if (langRes.data.status) setLanguages(langRes.data.data || []);
                if (tagRes.data.status) setTags(tagRes.data.data || []);
                if (authRes.data.status) setAuthors(authRes.data.data || []);
                if (fmtRes.data.status) setFormats(fmtRes.data.data || []);
                if (serRes.data.status) setSeriesList(serRes.data.data || []);
                if (pubRes.data.status) setPublishers(pubRes.data.data || []);
                if (setRes.data.status && setRes.data.data.length > 0) {
                    setArrivalDays(setRes.data.data[0].new_arrival_time || 30);
                }


                // B. Fetch Book Data (Edit Logic)
                const response = await axios.get(`${API_URL}/product/get/${id}`);
                console.log("🔥 FULL API RESPONSE:", response.data);

                // Backend 'data' key bhej raha hai
                const book = response.data.data || response.data.book;

                if (response.data.status && book) {
                    console.log("🧐 DEBUG FIELDS:", {
                        categoryId_Type: typeof book.categoryId,
                        categoryId_Value: book.categoryId,
                        RealPrice: book.real_price,

                        MetaTitle_Old: book.meta_title,
                        MetaTitle_New: book.metaTitle,
                        Raw_Image: book.producticonname || book.default_image
                    });
                    // Mapping Logic...
                    const extractedCatId = book.categoryId
                        ? (typeof book.categoryId === 'object' ? book.categoryId._id : book.categoryId)
                        : '';

                    console.log("🎯 Extracted Category ID:", extractedCatId);
                    // 🟢 MAPPING BACKEND (CamelCase) -> FRONTEND STATE
                    setFormData({
                        title: book.title || '',
                        product_type: book.product_type || 'book', // Default logic
                        bagchee_id: book.bagchee_id || '',
                        // Category Object se ID nikalna
                        leading_category: book.categoryId
                            ? (typeof book.categoryId === 'object' ? book.categoryId._id : book.categoryId)
                            : (book.product_categories?.[0] || ''),




                        // Arrays logic
                        product_categories: book.product_categories || [],
                        product_languages: book.product_languages || (book.language ? [book.language] : []),
                        product_tags: book.product_tags || [],
                        product_formats: book.product_formats || (book.binding ? [book.binding] : []),

                        // Author logic (String "arya" ko array me convert)
                        authors: book.authors ? book.authors : (book.author ? [book.author] : []),

                        series: book.series ? (typeof book.series === 'object' ? book.series._id : book.series) : '',
                        publisher: book.publisher || '',

                        volume: book.volume || '',
                        edition: book.edition || '',
                        isbn10: book.isbn10 || '',
                        isbn13: book.isbn13 || book.isbn || '', // Mapping Fix

                        total_pages: book.pages || '',
                        weight: book.weight || '',

                        price: book.price || '',
                        real_price: book.real_price || book.priceForeign || '', // Mapping Fix
                        inr_price: book.price || '',
                        discount: book.discount || '',

                        stock: typeof book.stock === 'number' ? (book.stock > 0 ? 'active' : 'inactive') : (book.stock || 'active'),
                        availability: book.availability ? Number(book.availability) : 0,
                        notes: book.notes || '',
                        // 🟢 FIX 1: Series Number (String conversion for input binding)
                        series_number: (book.series_number !== undefined && book.series_number !== null) ? String(book.series_number) : '',

                        // SEO Mapping (CamelCase -> SnakeCase)
                        meta_title: book.meta_title || '',
                        meta_keywords: book.meta_keywords || '',
                        meta_description: book.meta_description || '',

                        // Flags Mapping
                        active: book.isActive ? 'active' : 'inactive',
                        recommended: book.isRecommended ? 'active' : 'inactive',
                        upcoming: (book.upcoming || book.Upcoming) ? 'active' : 'inactive',
                        upcoming_date: book.upcoming_date ? new Date(book.upcoming_date).toISOString().split('T')[0] : '',
                        new_release: book.isNewRelease ? 'active' : 'inactive',
                        new_release_until: book.new_release_until ? new Date(book.new_release_until).toISOString().split('T')[0] : '',
                        exclusive: book.isExclusive ? 'active' : 'inactive',

                        // Extra Fields Mapping
                        ship_days: book.ship_days || book.shipDays || "3",
                        deliver_days: book.deliver_days || book.deliverDays || "7",
                        pub_date: book.pub_date || '',
                        source: book.source || '',
                        rating: book.rating || '',
                        rated_times: book.rated_times || '',
                        toc_image: book.toc_image || book.tocImage || '',
                        new_release_until: book.new_release_until || '',
                        ordered_items_count: book.soldCount || 0, //
                    });


                    // 🟢 UI specific helper states ko backend date se fill karein
                    if (book.new_release_until) {
                        const formattedDate = new Date(book.new_release_until).toISOString().split('T')[0];
                        setUserSelectedDate(formattedDate); // Ise date input mein dikhane ke liye
                    }


                    // 🟢 FIX: Related Products Loading Logic
                    if (book.related_products) {
                        const ids = book.related_products.split(',').map(s => s.trim()).filter(Boolean);
                        if (ids.length > 0) {
                            const fetchTitles = async () => {
                                try {
                                    const promises = ids.map(async (prodId) => {
                                        try {
                                            const res = await axios.get(`${API_URL}/product/fetch?keyword=${prodId}&limit=1`);
                                            const foundBook = res.data.data?.[0];
                                            return { id: prodId, title: foundBook ? foundBook.title : prodId };
                                        } catch { return { id: prodId, title: prodId }; }
                                    });
                                    const resolvedItems = await Promise.all(promises);
                                    setSelectedRelatedItems(resolvedItems);
                                } catch (e) { console.error(e); }
                            };
                            fetchTitles();
                        }
                    }

                    if (book.toc_images && book.toc_images.length > 0) {
                        setTocImagesList(book.toc_images.map((img) => ({
                            id: img._id,
                            image: img.image, // Path like "/uploads/..."
                            order: img.order,
                            file: null
                        })));
                    }
                    if (book.toc_image) {
                        let cleanTocPath = book.toc_image.replace(/\\/g, '/');
                        // URL fix logic
                        if (!cleanTocPath.startsWith('http')) {
                            const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
                            cleanTocPath = `${baseUrl}${cleanTocPath.startsWith('/') ? '' : '/'}${cleanTocPath}`;
                        }
                        console.log("Setting TOC Preview:", cleanTocPath);
                        setTocPreview(cleanTocPath); // ✅ Isse purani image dikhegi
                    }

                    if (book.related_images && book.related_images.length > 0) {
                        setRelatedImagesList(book.related_images.map((img) => ({
                            id: img._id,
                            image: img.image,
                            order: img.order,
                            file: null
                        })));
                    }

                    if (book.sample_images && book.sample_images.length > 0) {
                        setSampleImagesList(book.sample_images.map((img) => ({
                            id: img._id,
                            image: img.image,
                            order: img.order,
                            file: null
                        })));
                    }

                    if (book.new_release_until) {
                        const backendDate = new Date(book.new_release_until).toISOString().split('T')[0];
                        setUserSelectedDate(backendDate);
                    }


                    // Rich Text Mapping
                    setSynopsis(book.synopsis || book.description || '');
                    setCriticsNote(book.criticsNote || book.critics_note || '');
                    setSearchText(book.aboutAuthorText || book.search_text || '');

                    // Image Mapping ('producticonname' is from backend)
                    const imgRaw = book.default_image || book.producticonname;
                    console.log("🖼️ Raw Image from DB:", imgRaw);
                    if (imgRaw) {
                        // Agar image path me 'http' nahi hai, to backend URL add karein
                        // NOTE: Ensure API_URL doesn't have double slash issues
                        let cleanPath = imgRaw.replace(/\\/g, '/'); // Windows backslash fix
                        if (!cleanPath.startsWith('http')) {
                            // Agar API_URL '/api' par khatam hota hai, to use hata kar base URL banayein
                            // Example: http://localhost:5000/api -> http://localhost:5000
                            const baseUrl = API_URL.replace('/api', '');
                            cleanPath = `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
                        }
                        console.log("Setting Preview Image:", cleanPath);
                        setServerImage(cleanPath);
                    }
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load data.");
            }
        };

        if (id) fetchData();
    }, [id]);


    // 🟢 SPECIAL HANDLER: Matched with Add Page Logic
    const handleNewReleaseChange = (e) => {
        const val = e.target.value;
        if (val === 'active') {
            // Agar Edit mode mein backend se date aayi hai toh use rakhein, 
            // warna aaj + arrivalDays calculate karein
            const dateToSet = userSelectedDate || getCalculatedDate();

            setFormData(prev => ({ ...prev, new_release: 'active', new_release_until: dateToSet }));
            setUserSelectedDate(dateToSet);
        } else {
            setFormData(prev => ({ ...prev, new_release: 'inactive', new_release_until: '' }));
            setUserSelectedDate('');
        }
    };


    //add publisher
    const handleQuickPubSave = async (e) => {
        e.preventDefault();
        if (!newPubData.title || !newPubData.category) {
            return toast.error("Title and Category are required!");
        }

        setIsPubSaving(true);
        const toastId = toast.loading("Saving publisher...");

        try {
            const data = new FormData();
            Object.keys(newPubData).forEach(key => {
                data.append(key, newPubData[key]);
            });
            if (newPubImage) data.append('image', newPubImage);

            const res = await axios.post(`${process.env.REACT_APP_API_URL}/publishers/save`, data);

            if (res.data.status) {
                const savedPub = res.data.data;
                // List update karein dropdown ke liye
                setPublishers(prev => [...prev, savedPub]);
                // Main form data mein select karein
                setFormData(prev => ({ ...prev, publisher: savedPub._id }));

                toast.success("Publisher added and linked!", { id: toastId });
                setIsPubPanelOpen(false);
                // Reset form
                setNewPubData({ category: '', title: '', company: '', address: '', place: '', email: '', phone: '', order: '', slug: '' });
                setNewPubImage(null);
                setNewPubPreview(null);
            }
        } catch (error) {
            toast.error("Failed to save publisher", { id: toastId });
        } finally {
            setIsPubSaving(false);
        }
    };



    //add series
    const handleQuickSeriesSave = async (e) => {
        e.preventDefault();
        if (!newSeriesData.title) return toast.error("Series title is required!");

        setIsSeriesSaving(true);
        const toastId = toast.loading("Saving series...");

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/series/save`, newSeriesData);

            if (res.data.status) {
                const savedSeries = res.data.data;
                setSeriesList(prev => [...prev, savedSeries]);
                setFormData(prev => ({ ...prev, series: savedSeries._id, series_number: "1" }));

                toast.success("Series added!", { id: toastId });
                setIsSeriesPanelOpen(false);
                setNewSeriesData({ title: '' });
            }
        } catch (error) {
            toast.error("Failed to save series", { id: toastId });
        } finally {
            setIsSeriesSaving(false);
        }
    };


    //add author
    const handleQuickAuthorSave = async (e) => {
        e.preventDefault();

        // Validation
        if (!newAuthorData.first_name) {
            return toast.error("First name is required for new author!");
        }

        setIsAuthorSaving(true);
        const toastId = toast.loading("Creating & Linking Author...");

        try {
            const data = new FormData();
            data.append('first_name', newAuthorData.first_name);
            data.append('last_name', newAuthorData.last_name);
            data.append('origin', newAuthorData.origin);
            data.append('profile', newAuthorProfile);
            if (newAuthorImage) data.append('picture', newAuthorImage);

            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.post(`${API_URL}/authors/save`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.status) {
                toast.success("New author added and selected!", { id: toastId });

                const savedAuthor = res.data.data;

                // 1. Authors ki dropdown list ko update karein taaki naya author wahan dikhe
                setAuthors(prev => [...prev, savedAuthor]);

                // 2. FormData mein is naye author ki ID ko add karein (Select karein)
                setFormData(prev => ({
                    ...prev,
                    authors: [...prev.authors, savedAuthor._id]
                }));

                // 3. Form band karein aur reset karein
                setIsAuthorPanelOpen(false);
                setNewAuthorData({ first_name: '', last_name: '', origin: '' });
                setNewAuthorProfile('');
                setNewAuthorImage(null);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.msg || "Failed to create author", { id: toastId });
        } finally {
            setIsAuthorSaving(false);
        }
    };



    // 🟢 MAGIC CALCULATION: Jab user Start Date badle (Edit mode mein bhi kaam karega)
    useEffect(() => {
        if (formData.new_release === 'active' && userSelectedDate) {
            const startDate = new Date(userSelectedDate);
            // Magic: Settings wale din jodo (arrivalDays settings se aa raha hai)
            startDate.setDate(startDate.getDate() + Number(arrivalDays));

            const finalDate = startDate.toISOString().split('T')[0];

            // Backend ke liye format update karein
            setFormData(prev => ({ ...prev, new_release_until: finalDate }));
        }
    }, [userSelectedDate, formData.new_release, arrivalDays]);
    const getCalculatedDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + Number(arrivalDays));
        return date.toISOString().split('T')[0];
    };


    // 3. Auto SEO (Only runs when editing fields)
    useEffect(() => {
        if (!formData.meta_title && !formData.meta_description && formData.title) {
            const { title, isbn10, isbn13 } = formData;
            const activeIsbn = isbn13 ? isbn13 : (isbn10 ? isbn10 : '');
            // Uncomment logic below if you want live updates
            // const autoTitle = `${title} ${activeIsbn ? `- ${activeIsbn}` : ''}`;
            // setFormData(prev => ({ ...prev, meta_title: autoTitle }));
        }
    }, [formData.title, formData.isbn10, formData.isbn13]);




    // Handlers
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

    // Helper Functions for Dropdowns
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

    // Image Preview Logic
    useEffect(() => {
        if (!imageFile) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const removeImage = () => {
        setImageFile(null); // Clear new upload
        setServerImage(null); // Clear server image
        document.getElementById('default_image_input').value = "";
    };

    // Jodit Config
    const config = useMemo(() => ({
        readonly: false,
        placeholder: 'Start typing here...',
        toolbarSticky: false,
        height: 350,
    }), []);

    // Get Title Helper for Display
    const selectedLeadingCategory = categories.find(c => c._id === formData.leading_category);

    // --- SUBMIT LOGIC ---
    const handleSubmit = async (e, actionType) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Updating book...");

        try {
            const data = new FormData();

            // Manual Appends
            data.append('title', formData.title);

            data.append('price', formData.price);
            data.append('special_price', formData.special_price || '');
            data.append('real_price', formData.real_price || '');
            data.append('inr_price', formData.inr_price || '');
            data.append('discount', formData.discount || '');
            data.append('isbn13', formData.isbn13 || '');
            data.append('isbn10', formData.isbn10 || '');
            data.append('pages', formData.total_pages || '');
            data.append('weight', formData.weight || '');
            data.append('edition', formData.edition || '');
            data.append('volume', formData.volume || '');
            data.append('stock', formData.stock);
            data.append('availability', formData.availability || '');
            data.append('notes', formData.notes || '');
            data.append('bagchee_id', formData.bagchee_id || '');
            data.append('related_products', formData.related_products || '');
            if (formData.leading_category) data.append('leading_category', formData.leading_category);
            if (formData.series) data.append('series', formData.series);
            if (formData.series_number) data.append('series_number', formData.series_number);
            if (formData.publisher) data.append('publisher', formData.publisher);

            // Authors Logic
            if (formData.authors && formData.authors.length > 0) {
                const firstAuthor = formData.authors[0];
                data.append('author', firstAuthor); // Send ID or Name
                data.append('author_id', firstAuthor);
                data.append('authors', JSON.stringify(formData.authors));
            }

            // Arrays
            if (formData.product_categories) data.append('product_categories', JSON.stringify(formData.product_categories));
            if (formData.product_languages) data.append('product_languages', JSON.stringify(formData.product_languages));
            if (formData.product_tags) data.append('product_tags', JSON.stringify(formData.product_tags));
            if (formData.product_formats) data.append('product_formats', JSON.stringify(formData.product_formats));

            // SEO & Rich Text
            data.append('meta_title', formData.meta_title || '');
            data.append('meta_description', formData.meta_description || '');
            data.append('meta_keywords', formData.meta_keywords || '');
            data.append('synopsis', synopsis || '');
            data.append('critics_note', criticsNote || '');
            data.append('search_text', searchText || '');

            // Flags
            data.append('active', formData.active);
            data.append('recommended', formData.recommended);
            data.append('upcoming', formData.upcoming);
            data.append('upcoming_date', formData.upcoming_date || '');
            data.append('new_release', formData.new_release);
            data.append('new_release_until', formData.new_release_until || '');
            data.append('exclusive', formData.exclusive);
            data.append('ship_days', formData.ship_days || '');
            data.append('deliver_days', formData.deliver_days || '');
            data.append('pub_date', formData.pub_date || '');
            data.append('source', formData.source || '');
            data.append('rating', formData.rating || '');
            data.append('rated_times', formData.rated_times || '');
            data.append('toc_image', formData.toc_image || '');

            // Image
            if (imageFile) {
                data.append('default_image', imageFile);
            }

            // 🟢 NEW: Append TOC Image if selected
            if (tocImageFile) {
                data.append('toc_image', tocImageFile);
            }

            // 🟢 NEW: Append TOC Images List
            tocImagesList.forEach((item, index) => {
                if (item.file) {
                    data.append(`toc_images`, item.file);
                    data.append(`toc_images_order`, item.order);
                }
            });

            // 🟢 NEW: Append Related Images List
            relatedImagesList.forEach((item, index) => {
                if (item.file) {
                    data.append(`related_images`, item.file);
                    data.append(`related_images_order`, item.order);
                }
            });

            // 🟢 NEW: Append Sample Images List
            sampleImagesList.forEach((item, index) => {
                if (item.file) {
                    data.append(`sample_images`, item.file);
                    data.append(`sample_images_order`, item.order);
                }
            });
            const API_URL = process.env.REACT_APP_API_URL;
            // 🟢 Using PATCH for Update logic
            const response = await axios.patch(`${API_URL}/product/update/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.status) {
                toast.success("Updated Successfully!", { id: toastId });
                if (actionType === 'back') {
                    navigate('/admin/books');
                }
            } else {
                toast.error(response.data.msg || "Update failed", { id: toastId });
            }
            console.log("response edit book", response.data)

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.msg || "Update failed", { id: toastId });
        } finally {
            setLoading(false);
        }

    };

    // 🟢 NEW: Helper to Add a new row
    const addImageRow = (setter) => {
        setter(prev => [...prev, { id: Date.now(), file: null, order: prev.length + 1 }]);
    };

    // 🟢 NEW: Helper to Remove a row
    const removeImageRow = (setter, id) => {
        setter(prev => prev.filter(item => item.id !== id));
    };

    // 🟢 NEW: Helper to Handle File Selection for dynamic rows
    const handleDynamicImageChange = (setter, id, file) => {
        setter(prev => prev.map(item => item.id === id ? { ...item, file: file } : item));
    };

    // 🟢 NEW: Helper to Handle Order Change
    const handleDynamicOrderChange = (setter, id, order) => {
        setter(prev => prev.map(item => item.id === id ? { ...item, order: order } : item));
    };

    // 🟢 NEW: Helper to remove TOC image
    const removeTocImage = () => {
        setTocImageFile(null);
        document.getElementById('toc_image_input').value = "";
    };

    // Add TOC image preview effect
    useEffect(() => {
        if (!tocImageFile) {
            setTocPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(tocImageFile);
        setTocPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [tocImageFile]);


    return (
        <div className="bg-gray-50 min-h-screen font-body text-text-main">
            {/* --- TOP HEADER BAR --- */}
            <div className="bg-primary text-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-lg font-bold text-gray-700 uppercase tracking-tight">Edit Book</h1>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 space-y-6">


                        {/* 🟢 BAGCHEE ID SECTION */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Bagchee id</label>
                            <div className="col-span-9 flex gap-2">
                                <input
                                    name="bagchee_id"
                                    type="text"
                                    value={formData.bagchee_id}
                                    onChange={handleChange}
                                    className="theme-input w-full"
                                    placeholder="Enter Bagchee ID"
                                />
                                <button
                                    type="button"
                                    onClick={() => formData.bagchee_id && window.open(`/product/${formData.bagchee_id}`, '_blank')}
                                    className="bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm whitespace-nowrap"
                                >
                                    Product page
                                </button>
                            </div>
                        </div>


                        {/* 1. Title */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Title*</label>
                            <div className="col-span-9">
                                <input name="title" type="text" value={formData.title} onChange={handleChange} className="theme-input w-full" />
                            </div>
                        </div>



                        {/* 3. Leading Category (Searchable) */}
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
                                        </div>
                                    </div>
                                )}
                                {isLeadingOpen && <div className="fixed inset-0 z-10" onClick={() => setIsLeadingOpen(false)}></div>}
                            </div>
                        </div>

                        {/* 4. Product Categories (Multi-Select) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product categories</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
                                    {formData.product_categories.length > 0 ? (
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
                                            <input type="text" placeholder="Search..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            {categories.filter((cat) => cat.categorytitle.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => {
                                                const isSelected = formData.product_categories.includes(cat._id);
                                                return (
                                                    <div key={cat._id} onClick={() => handleCheckboxChange('product_categories', cat._id)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span className={`text-gray-700 ${isSelected ? 'font-bold text-primary' : ''}`}>{cat.categorytitle}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {isCategoryDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        {/* 5. Languages (Multi-Select) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product Languages</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}>
                                    {formData.product_languages.length > 0 ? (
                                        formData.product_languages.map((lang, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                {lang}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('product_languages', lang); }} className="hover:text-red-500">×</button>
                                            </span>
                                        ))
                                    ) : <span className="text-gray-400 text-xs">Select languages...</span>}
                                    <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                </div>
                                {isLanguageDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                            <input type="text" placeholder="Search..." value={languageSearch} onChange={(e) => setLanguageSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            {languages.filter(l => (l.title || l).toLowerCase().includes(languageSearch.toLowerCase())).map((lang, idx) => {
                                                const name = lang.title || lang;
                                                const isSelected = formData.product_languages.includes(name);
                                                return (
                                                    <div key={idx} onClick={() => handleCheckboxChange('product_languages', name)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span>{name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                )}
                                {isLanguageDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsLanguageDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        {/* 6. Tags (Multi-Select) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product Tags</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}>
                                    {formData.product_tags.length > 0 ? (
                                        formData.product_tags.map((tag, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                {tag}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('product_tags', tag); }} className="hover:text-red-500">×</button>
                                            </span>
                                        ))
                                    ) : <span className="text-gray-400 text-xs">Select tags...</span>}
                                    <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                </div>
                                {isTagDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                            <input type="text" placeholder="Search..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            {tags.filter(t => (t.title || t).toLowerCase().includes(tagSearch.toLowerCase())).map((tag, idx) => {
                                                const name = tag.title || tag;
                                                const isSelected = formData.product_tags.includes(name);
                                                return (
                                                    <div key={idx} onClick={() => handleCheckboxChange('product_tags', name)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span>{name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                )}
                                {isTagDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsTagDropdownOpen(false)}></div>}
                            </div>
                        </div>


                        {/* 🟢 8. Related Products (Sequence Corrected) */}
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
                                    <input type="text" value={relatedSearchQuery} onChange={(e) => { setRelatedSearchQuery(e.target.value); setIsRelatedDropdownOpen(true); }} onFocus={() => setIsRelatedDropdownOpen(true)} placeholder="Search product to link..." className="theme-input w-full" />
                                    {isRelatedSearching && <Loader2 size={16} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
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
                        {/* 7. Authors Section (Aligned & Color Matched for Edit) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-6">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">
                                Authors
                            </label>

                            <div className="col-span-9 space-y-3">
                                {/* 1. Main Searchable Dropdown */}
                                <div className="relative">
                                    <div
                                        className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors"
                                        onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}
                                    >
                                        {formData.authors && formData.authors.length > 0 ? (
                                            formData.authors.map((authId, idx) => {
                                                const author = authors.find(a => a._id === authId);
                                                const authorName = author ? `${author.first_name} ${author.last_name}` : authId;
                                                return (
                                                    <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                        {authorName}
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('authors', authId); }} className="hover:text-red-500">×</button>
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="text-gray-400 text-xs">Select authors...</span>
                                        )}
                                        <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                    </div>

                                    {/* Dropdown Items (Search & List) */}
                                    {isAuthorDropdownOpen && (
                                        <div className="absolute z-[100] top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <input
                                                    type="text"
                                                    placeholder="Search authors..."
                                                    value={authorSearch}
                                                    onChange={(e) => setAuthorSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                                {authors.filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(authorSearch.toLowerCase())).map((auth) => {
                                                    const isSelected = formData.authors.includes(auth._id);
                                                    return (
                                                        <div key={auth._id} onClick={() => handleCheckboxChange('authors', auth._id)} className={`flex items-center justify-between p-2 text-sm rounded hover:bg-blue-50 cursor-pointer ${isSelected ? 'bg-blue-50 font-bold text-primary' : ''}`}>
                                                            <span>{auth.first_name} {auth.last_name}</span>
                                                            {isSelected && <Check size={14} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {isAuthorDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsAuthorDropdownOpen(false)}></div>}
                                </div>

                                {/* 2. THE ADD BUTTON (Properly Aligned in col-span-9) */}
                                <div className="flex justify-start">
                                    <button
                                        type="button"
                                        onClick={() => setIsAuthorPanelOpen(!isAuthorPanelOpen)}
                                        className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2 transition-all"
                                    >
                                        {isAuthorPanelOpen ? <X size={14} /> : <Plus size={14} />}
                                        Add new author
                                    </button>
                                </div>

                                {/* 3. Expandable Form Panel (Matched Colors) */}
                                {isAuthorPanelOpen && (
                                    <div className="p-6 bg-cream-50/50 border-2 border-primary/10 rounded-xl space-y-5 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                                            <Plus size={16} strokeWidth={3} />
                                            <h3 className="text-xs font-bold uppercase font-montserrat tracking-wider">Quick Author Registration</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">First Name*</label>
                                                <input type="text" value={newAuthorData.first_name} onChange={(e) => setNewAuthorData({ ...newAuthorData, first_name: e.target.value })} className="theme-input w-full bg-white text-xs" placeholder="First Name" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Last Name</label>
                                                <input type="text" value={newAuthorData.last_name} onChange={(e) => setNewAuthorData({ ...newAuthorData, last_name: e.target.value })} className="theme-input w-full bg-white text-xs" placeholder="Last Name" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Author Picture</label>
                                                <div className="flex items-center gap-3">
                                                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded text-[10px] font-bold uppercase hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        <Upload size={14} className="inline mr-2" /> {newAuthorImage ? "Selected" : "Upload Picture"}
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewAuthorImage(e.target.files[0])} />
                                                    </label>
                                                    {newAuthorImage && <span className="text-[10px] text-green-600 font-bold italic truncate max-w-[150px]">{newAuthorImage.name}</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Origin</label>
                                                <input type="text" value={newAuthorData.origin} onChange={(e) => setNewAuthorData({ ...newAuthorData, origin: e.target.value })} className="theme-input w-full bg-white text-xs" placeholder="e.g. India" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Author Profile</label>
                                            <div className="bg-white rounded border shadow-sm overflow-hidden">
                                                <JoditEditor
                                                    value={newAuthorProfile}
                                                    config={{ height: 200, placeholder: 'Biography details...' }}
                                                    onBlur={c => setNewAuthorProfile(c)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                                            <button type="button" onClick={() => setIsAuthorPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600 px-4 transition-colors">Discard</button>
                                            <button
                                                type="button"
                                                disabled={isAuthorSaving}
                                                onClick={handleQuickAuthorSave}
                                                className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
                                            >
                                                {isAuthorSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                Save & Link Author
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- 🟢 7.5 Ordered Items Section (Read-only) --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 text-gray-400">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                Ordered items
                            </label>
                            <div className="col-span-9">
                                <div className="relative w-full md:w-1/2">
                                    <input
                                        type="text"
                                        disabled
                                        readOnly
                                        value={formData.ordered_items_count > 0 ? `${formData.ordered_items_count} Orders Total` : "No orders yet"}
                                        className="theme-input w-full bg-gray-50 cursor-not-allowed border-dashed text-gray-400"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Check size={12} className="text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* 8. Formats (Multi-Select) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product formats</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}>
                                    {formData.product_formats.length > 0 ? (
                                        formData.product_formats.map((fmt, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                {fmt}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('product_formats', fmt); }} className="hover:text-red-500">×</button>
                                            </span>
                                        ))
                                    ) : <span className="text-gray-400 text-xs">Select formats...</span>}
                                    <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                </div>
                                {isFormatDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                            <input type="text" placeholder="Search..." value={formatSearch} onChange={(e) => setFormatSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            {formats.filter(f => (f.title || f).toLowerCase().includes(formatSearch.toLowerCase())).map((fmt, idx) => {
                                                const name = fmt.title || fmt;
                                                const isSelected = formData.product_formats.includes(name);
                                                return (
                                                    <div key={idx} onClick={() => handleCheckboxChange('product_formats', name)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span>{name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                )}
                                {isFormatDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsFormatDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        {/* Physical / Identifiers / Prices */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Volume</label><div className="col-span-9"><input name="volume" value={formData.volume} onChange={handleChange} className="theme-input w-full md:w-1/3" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Edition</label><div className="col-span-9"><input name="edition" value={formData.edition} onChange={handleChange} className="theme-input w-full md:w-1/3" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">ISBN 10</label><div className="col-span-9"><input name="isbn10" value={formData.isbn10} onChange={handleChange} className="theme-input w-full md:w-1/2" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">ISBN 13</label><div className="col-span-9"><input name="isbn13" value={formData.isbn13} onChange={handleChange} className="theme-input w-full md:w-1/2" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Total Pages</label><div className="col-span-9"><input name="total_pages" type="number" value={formData.total_pages} onChange={handleChange} className="theme-input w-32" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Weight</label><div className="col-span-9"><input name="weight" value={formData.weight} onChange={handleChange} className="theme-input w-32" /></div></div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Default image</label>
                            <div className="col-span-9 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    {(preview || serverImage) && (
                                        <div className="relative group">
                                            <img
                                                src={preview || serverImage}
                                                alt="Cover"
                                                className="w-16 h-20 object-cover border rounded shadow-sm"
                                            />
                                            <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110">
                                                <X size={10} />
                                            </button>
                                        </div>
                                    )}
                                    <input type="file" id="default_image_input" className="hidden" accept="image/*" onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setImageFile(e.target.files[0]);
                                            setServerImage(null);
                                        }
                                    }} />
                                    <label htmlFor="default_image_input" className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2">
                                        <Upload size={14} /> {preview || serverImage ? "Change" : "Upload"}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 🟢 FIXED: DEFAULT TOC IMAGE (Same UI as Default Image) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">
                                Default toc image
                            </label>
                            <div className="col-span-9 flex flex-col gap-3">
                                <div className="flex items-center gap-3">

                                    {/* PREVIEW AREA */}
                                    {tocPreview && (
                                        <div className="relative group">
                                            {/* Image Thumbnail */}
                                            <img
                                                src={tocPreview}
                                                alt="TOC Preview"
                                                className="w-16 h-20 object-cover border rounded shadow-sm"
                                            />

                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={removeTocImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    )}

                                    {/* HIDDEN INPUT */}
                                    <input
                                        type="file"
                                        id="toc_image_input"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setTocImageFile(e.target.files[0]);
                                            }
                                        }}
                                    />

                                    {/* UPLOAD BUTTON */}
                                    <label
                                        htmlFor="toc_image_input"
                                        className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                                    >
                                        <Upload size={14} /> {tocPreview ? "Change" : "Upload"}
                                    </label>

                                    {/* File Info (Optional - Sirf tab dikhega jab nayi file select hogi) */}
                                    {tocImageFile && (
                                        <div className="flex flex-col justify-center h-16">
                                            <span className="text-[11px] font-bold text-gray-700 truncate max-w-[150px]">
                                                {tocImageFile.name}
                                            </span>
                                            <span className="text-[9px] text-gray-400">
                                                {(tocImageFile.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* 🟢 RESPONSIVE TOC IMAGES (Server + Local Preview) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Add toc images</label>
                            <div className="md:col-span-9 space-y-3">
                                {tocImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">

                                        {/* PREVIEW BOX */}
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {(item.file || item.image) ? (
                                                <img
                                                    src={item.file
                                                        ? URL.createObjectURL(item.file) // Local Preview
                                                        : `${process.env.REACT_APP_API_URL}${item.image}` // Server Preview
                                                    }
                                                    alt="preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>

                                        {/* UPLOAD BUTTON */}
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input
                                                type="file"
                                                id={`toc_upload_${item.id}`}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleDynamicImageChange(setTocImagesList, item.id, e.target.files[0])}
                                            />
                                            <label htmlFor={`toc_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-primary hover:text-primary transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : (item.image ? "Replace" : "Upload")}
                                            </label>

                                            {/* Filename or Server Path check */}
                                            <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">
                                                {item.file ? item.file.name : (item.image ? "Existing Image" : "No image selected")}
                                            </span>
                                        </div>

                                        {/* CONTROLS */}
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <input type="number" value={item.order} onChange={(e) => handleDynamicOrderChange(setTocImagesList, item.id, e.target.value)} className="theme-input w-16 text-center text-xs" placeholder="Ord" />
                                            <button type="button" onClick={() => removeImageRow(setTocImagesList, item.id)} className="bg-red-100 text-red-500 p-2 rounded hover:bg-red-200 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addImageRow(setTocImagesList)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-all shadow-sm">
                                    <Plus size={14} /> Add additional toc image
                                </button>
                            </div>
                        </div>

                        {/* 🟢 RESPONSIVE RELATED IMAGES */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Related images</label>
                            <div className="md:col-span-9 space-y-3">
                                {relatedImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {(item.file || item.image) ? (
                                                <img
                                                    src={item.file ? URL.createObjectURL(item.file) : `${process.env.REACT_APP_API_URL}${item.image}`}
                                                    alt="preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>

                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input type="file" id={`rel_upload_${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleDynamicImageChange(setRelatedImagesList, item.id, e.target.files[0])} />
                                            <label htmlFor={`rel_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-primary hover:text-primary transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : (item.image ? "Replace" : "Upload")}
                                            </label>
                                            <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">
                                                {item.file ? item.file.name : (item.image ? "Existing Image" : "No image selected")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <input type="number" value={item.order} onChange={(e) => handleDynamicOrderChange(setRelatedImagesList, item.id, e.target.value)} className="theme-input w-16 text-center text-xs" placeholder="Ord" />
                                            <button type="button" onClick={() => removeImageRow(setRelatedImagesList, item.id)} className="bg-red-100 text-red-500 p-2 rounded hover:bg-red-200 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addImageRow(setRelatedImagesList)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-all shadow-sm">
                                    <Plus size={14} /> Add related image
                                </button>
                            </div>
                        </div>

                        {/* 🟢 RESPONSIVE SAMPLE IMAGES */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-2">Sample images</label>
                            <div className="md:col-span-9 space-y-3">
                                {sampleImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {(item.file || item.image) ? (
                                                <img
                                                    src={item.file ? URL.createObjectURL(item.file) : `${process.env.REACT_APP_API_URL}${item.image}`}
                                                    alt="preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>

                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input type="file" id={`samp_upload_${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleDynamicImageChange(setSampleImagesList, item.id, e.target.files[0])} />
                                            <label htmlFor={`samp_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-primary hover:text-primary transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : (item.image ? "Replace" : "Upload")}
                                            </label>
                                            <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">
                                                {item.file ? item.file.name : (item.image ? "Existing Image" : "No image selected")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <input type="number" value={item.order} onChange={(e) => handleDynamicOrderChange(setSampleImagesList, item.id, e.target.value)} className="theme-input w-16 text-center text-xs" placeholder="Ord" />
                                            <button type="button" onClick={() => removeImageRow(setSampleImagesList, item.id)} className="bg-red-100 text-red-500 p-2 rounded hover:bg-red-200 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addImageRow(setSampleImagesList)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-all shadow-sm">
                                    <Plus size={14} /> Add sample image
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Pub Date</label><div className="col-span-9"><input name="pub_date" value={formData.pub_date} onChange={handleChange} className="theme-input w-full md:w-1/3" /></div></div>

                        {/* --- 🟢 11. Source Section (AddBook se copy kiya hua) --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Source
                            </label>
                            <div className="col-span-9">
                                <input
                                    name="source"
                                    type="text"
                                    value={formData.source}
                                    onChange={handleChange}
                                    className="theme-input w-full"
                                    placeholder="Enter source details"
                                />
                            </div>
                        </div>


                        {/* --- 11. Rating Section (Consistency with AddBook) --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Rating
                            </label>
                            <div className="col-span-9">
                                <select
                                    name="rating"
                                    value={formData.rating || ""}
                                    onChange={handleChange}
                                    className="theme-input w-32 bg-white"
                                >
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <option key={num} value={num}>{num} Stars</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* --- 11.5 Rated Times Section --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Rated times
                            </label>
                            <div className="col-span-9">
                                <input
                                    name="rated_times"
                                    type="number"
                                    value={formData.rated_times || ""}
                                    onChange={handleChange}
                                    className="theme-input w-32"
                                    placeholder="0"
                                />

                            </div>
                        </div>

                        {/* 12. Series Section (Fixed Alignment & Quick Add for Edit) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">
                                Series
                            </label>

                            <div className="col-span-9 space-y-3">
                                {/* A. Series Dropdown Input */}
                                <div className="relative">
                                    <div
                                        className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex justify-between items-center hover:border-primary transition-colors theme-input w-full md:w-1/2"
                                        onClick={() => setIsSeriesDropdownOpen(!isSeriesDropdownOpen)}
                                    >
                                        <span className={formData.series ? "text-gray-700 font-medium" : "text-gray-400 text-sm"}>
                                            {formData.series
                                                ? (seriesList.find(s => s._id === formData.series)?.title || "Unknown Series")
                                                : "Select Series"
                                            }
                                        </span>
                                        <span className="text-gray-400 text-[10px]"><ChevronDown size={14} /></span>
                                    </div>

                                    {/* Dropdown Menu Body */}
                                    {isSeriesDropdownOpen && (
                                        <div className="absolute z-20 top-full left-0 w-full md:w-1/2 bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <input
                                                    type="text"
                                                    placeholder="Search series..."
                                                    value={seriesSearch}
                                                    onChange={(e) => setSeriesSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                                {seriesList.filter(s => s.title.toLowerCase().includes(seriesSearch.toLowerCase())).map(s => (
                                                    <div
                                                        key={s._id}
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, series: s._id }));
                                                            setIsSeriesDropdownOpen(false);
                                                        }}
                                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.series === s._id ? "bg-blue-50 text-primary font-bold" : "text-gray-600"}`}
                                                    >
                                                        {s.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {isSeriesDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsSeriesDropdownOpen(false)}></div>}
                                </div>

                                {/* B. ADD NEW SERIES BUTTON (Aligned under Dropdown) */}
                                <div className="flex justify-start">
                                    <button
                                        type="button"
                                        onClick={() => setIsSeriesPanelOpen(!isSeriesPanelOpen)}
                                        className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2 transition-all"
                                    >
                                        {isSeriesPanelOpen ? <X size={14} /> : <Plus size={14} />}
                                        Add new series
                                    </button>
                                </div>

                                {/* C. Expandable Series Form (Visible on Click) */}
                                {isSeriesPanelOpen && (
                                    <div className="p-5 bg-cream-50/50 border-2 border-primary/10 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                                            <Plus size={16} strokeWidth={3} />
                                            <h3 className="text-xs font-bold uppercase font-montserrat tracking-wider">Quick Series Registration</h3>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Series Title*</label>
                                            <input
                                                type="text"
                                                value={newSeriesData.title}
                                                onChange={(e) => setNewSeriesData({ title: e.target.value })}
                                                className="theme-input w-full bg-white text-xs"
                                                placeholder="e.g. Harry Potter"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button type="button" onClick={() => setIsSeriesPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600 px-4 transition-colors">Discard</button>
                                            <button
                                                type="button"
                                                disabled={isSeriesSaving}
                                                onClick={handleQuickSeriesSave}
                                                className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
                                            >
                                                {isSeriesSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                Save & Link Series
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Series Number (Niche wali row) */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Series number
                            </label>
                            <div className="col-span-9">
                                <input
                                    name="series_number"
                                    type="number"
                                    value={formData.series_number || ""}
                                    onChange={handleChange}
                                    className="theme-input w-full md:w-1/3"
                                    placeholder="e.g. 1"
                                />
                            </div>
                        </div>


                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Price*</label><div className="col-span-9"><input name="price" type="number" value={formData.price} onChange={handleChange} className="theme-input w-32" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Real Price</label><div className="col-span-9"><input name="real_price" type="number" value={formData.real_price} onChange={handleChange} className="theme-input w-32" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">INR Price</label><div className="col-span-9"><input name="inr_price" type="number" value={formData.inr_price} onChange={handleChange} className="theme-input w-32" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Discount (%)</label><div className="col-span-9"><input name="discount" type="number" value={formData.discount} onChange={handleChange} className="theme-input w-32" /></div></div>
                        {/* --- 🟢 14. Stock status (active/inactive) --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Stock status
                            </label>
                            <div className="col-span-9 flex gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="stock"
                                        value="active"
                                        checked={formData.stock === 'active'}
                                        onChange={handleChange}
                                        className="accent-primary w-4 h-4"
                                    />
                                    active
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="stock"
                                        value="inactive"
                                        checked={formData.stock === 'inactive'}
                                        onChange={handleChange}
                                        className="accent-primary w-4 h-4"
                                    />
                                    inactive
                                </label>
                            </div>
                        </div>

                        {/* --- 🟢 15. Availability (Quantity Number) --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Availability (Quantity)
                            </label>
                            <div className="col-span-9">
                                <input
                                    name="availability"
                                    type="number"
                                    value={formData.availability}
                                    onChange={handleChange}
                                    className="theme-input w-32"
                                    placeholder="Enter quantity"
                                />
                                <span className="ml-2 text-[10px] text-gray-400 font-medium italic">
                                    *How many units are in stock?
                                </span>
                            </div>
                        </div>

                        {/* Rich Text Editors */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Synopsis</label>
                            <div className="col-span-9 border rounded overflow-hidden"><JoditEditor ref={editor} value={synopsis} config={config} onBlur={newContent => setSynopsis(newContent)} /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Critics Note</label>
                            <div className="col-span-9 border rounded overflow-hidden"><JoditEditor value={criticsNote} config={config} onBlur={newContent => setCriticsNote(newContent)} /></div>
                        </div>

                        {/* --- 🟢 18. Notes Section (AddBook consistency) --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 mt-6">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Notes
                            </label>
                            <div className="col-span-9">
                                <input
                                    name="notes"
                                    type="text"
                                    value={formData.notes || ""}
                                    onChange={handleChange}
                                    className="theme-input w-full"
                                    placeholder="Internal notes or extra info"
                                />
                            </div>
                        </div>

                        {/* 13. Publisher Section (Professional Expandable UI for Edit) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">
                                Publisher
                            </label>

                            <div className="col-span-9 space-y-3">
                                {/* A. Dropdown Selection */}
                                <div className="relative">
                                    <div
                                        className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex justify-between items-center hover:border-primary transition-colors theme-input w-full md:w-1/2"
                                        onClick={() => setIsPublisherDropdownOpen(!isPublisherDropdownOpen)}
                                    >
                                        <span className={formData.publisher ? "text-gray-700 font-medium" : "text-gray-400 text-sm"}>
                                            {formData.publisher
                                                ? (publishers.find(p => p._id === formData.publisher)?.name || publishers.find(p => p._id === formData.publisher)?.title || "Unknown Publisher")
                                                : "Select Publisher"
                                            }
                                        </span>
                                        <ChevronDown size={14} className="text-gray-400" />
                                    </div>

                                    {isPublisherDropdownOpen && (
                                        <div className="absolute z-[100] top-full left-0 w-full md:w-1/2 bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="p-2 border-b bg-gray-50">
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={publisherSearch}
                                                    onChange={(e) => setPublisherSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-xs p-1.5 border rounded outline-none bg-white"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {publishers.filter(p => (p.name || p.title || "").toLowerCase().includes(publisherSearch.toLowerCase())).map(p => (
                                                    <div
                                                        key={p._id}
                                                        onClick={() => handlePublisherSelect(p)}
                                                        className="px-3 py-2 text-sm hover:bg-primary/5 cursor-pointer text-gray-600 hover:text-primary transition-colors"
                                                    >
                                                        {p.name || p.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {isPublisherDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsPublisherDropdownOpen(false)}></div>}
                                </div>

                                {/* B. Add New Button (Aligned) */}
                                <div className="flex justify-start">
                                    <button
                                        type="button"
                                        onClick={() => setIsPubPanelOpen(!isPubPanelOpen)}
                                        className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2 transition-all"
                                    >
                                        {isPubPanelOpen ? <X size={14} /> : <Plus size={14} />}
                                        Add new publisher
                                    </button>
                                </div>

                                {/* C. Expandable Form Panel (MNC Style) */}
                                {isPubPanelOpen && (
                                    <div className="mt-4 p-6 bg-cream-50/50 border-2 border-primary/10 rounded-xl space-y-4 animate-in slide-in-from-top-2 shadow-inner">
                                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                                            <Plus size={16} strokeWidth={3} />
                                            <h3 className="text-xs font-bold uppercase font-montserrat">Quick Publisher Registration</h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Category*</label>
                                                <select
                                                    value={newPubData.category}
                                                    onChange={(e) => setNewPubData({ ...newPubData, category: e.target.value })}
                                                    className="theme-input w-full bg-white text-xs"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(c => <option key={c._id} value={c._id}>{c.categorytitle}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Title*</label>
                                                <input
                                                    type="text"
                                                    value={newPubData.title}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNewPubData({ ...newPubData, title: val, slug: val.toLowerCase().replace(/\s+/g, '-') });
                                                    }}
                                                    className="theme-input w-full bg-white text-xs"
                                                    placeholder="Publisher Name"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Logo/Image</label>
                                                <div className="flex items-center gap-2">
                                                    <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-all">
                                                        <Upload size={12} /> {newPubImage ? "Selected" : "Upload"}
                                                        <input type="file" className="hidden" onChange={(e) => {
                                                            setNewPubImage(e.target.files[0]);
                                                            setNewPubPreview(URL.createObjectURL(e.target.files[0]));
                                                        }} />
                                                    </label>
                                                    {newPubPreview && <img src={newPubPreview} className="h-8 w-8 object-contain rounded border bg-white" alt="preview" />}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                                                <input type="email" value={newPubData.email} onChange={(e) => setNewPubData({ ...newPubData, email: e.target.value })} className="theme-input w-full bg-white text-xs" placeholder="email@pub.com" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <input type="text" placeholder="Place" value={newPubData.place} onChange={(e) => setNewPubData({ ...newPubData, place: e.target.value })} className="theme-input text-xs" />
                                            <input type="text" placeholder="Phone" value={newPubData.phone} onChange={(e) => setNewPubData({ ...newPubData, phone: e.target.value })} className="theme-input text-xs" />
                                            <input type="number" placeholder="Order" value={newPubData.order} onChange={(e) => setNewPubData({ ...newPubData, order: e.target.value })} className="theme-input text-xs" />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                                            <button type="button" onClick={() => setIsPubPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 px-4 transition-colors hover:text-gray-600">Discard</button>
                                            <button
                                                type="button"
                                                disabled={isPubSaving}
                                                onClick={handleQuickPubSave}
                                                className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
                                            >
                                                {isPubSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                Save & Link Publisher
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SEO Section (Auto-Filled) */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Meta Title</label>
                            <div className="col-span-9"><input name="meta_title" value={formData.meta_title} onChange={handleChange} className="theme-input w-full" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Meta Keywords</label>
                            <div className="col-span-9"><input name="meta_keywords" value={formData.meta_keywords} onChange={handleChange} className="theme-input w-full" /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Meta Description</label>
                            <div className="col-span-9"><textarea name="meta_description" value={formData.meta_description} onChange={handleChange} className="theme-input w-full h-24 p-2 resize-none" /></div>
                        </div>

                        {/* Binary Flags */}
                        {[{ label: "Active", name: "active" }, { label: "Recommended", name: "recommended" }].map((item) => (
                            <div key={item.name} className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                                <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">{item.label}</label>
                                <div className="col-span-9 flex gap-6">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name={item.name} value="active" checked={formData[item.name] === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active</label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name={item.name} value="inactive" checked={formData[item.name] === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive</label>
                                </div>
                            </div>
                        ))}


                        {/* 🟢 19B. New Release (Start Date Logic - Matched with Add Page) */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-1 font-montserrat">
                                New release
                            </label>
                            <div className="col-span-9">
                                <div className="flex gap-6 mb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body">
                                        <input
                                            type="radio"
                                            name="new_release"
                                            value="active"
                                            onChange={handleNewReleaseChange}
                                            checked={formData.new_release === "active"}
                                            className="accent-primary w-4 h-4"
                                        /> active
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body">
                                        <input
                                            type="radio"
                                            name="new_release"
                                            value="inactive"
                                            onChange={handleNewReleaseChange}
                                            checked={formData.new_release === "inactive"}
                                            className="accent-primary w-4 h-4"
                                        /> inactive
                                    </label>
                                </div>

                                {/* 🗓️ Dropdown: Sirf tab dikhega jab Active ho */}
                                {formData.new_release === 'active' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300 p-3 bg-blue-50/50 rounded border border-blue-100">
                                        <label className="block text-[10px] text-primary font-bold mb-1 uppercase font-montserrat">
                                            Select Start Date
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="date"
                                                value={userSelectedDate}
                                                onChange={(e) => setUserSelectedDate(e.target.value)}
                                                className="theme-input w-40 border-primary/50 bg-white"
                                            />
                                            <span className="text-gray-400 text-[11px] font-bold">
                                                + {arrivalDays} Days (From Settings)
                                            </span>
                                        </div>

                                        {/* Result Display: Matched with Add Page Style */}
                                        <div className="mt-2 text-[11px] text-gray-500 font-montserrat">
                                            Book will be in "New Arrivals" until:{" "}
                                            <span className="font-bold text-black bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200">
                                                {formData.new_release_until || '...'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 🟢 19C. Upcoming Section - Theme Matched */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4 mt-4 font-montserrat">
                            <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-tight pt-1">
                                Upcoming Book
                            </label>
                            <div className="col-span-9">
                                <div className="flex gap-6 mb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body text-text-main">
                                        <input
                                            type="radio"
                                            name="upcoming"
                                            value="active"
                                            onChange={handleChange}
                                            checked={formData.upcoming === "active"}
                                            className="accent-primary w-4 h-4"
                                        /> active
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body text-text-main">
                                        <input
                                            type="radio"
                                            name="upcoming"
                                            value="inactive"
                                            onChange={(e) => {
                                                handleChange(e);
                                                setFormData(prev => ({ ...prev, upcoming_date: '' }));
                                            }}
                                            checked={formData.upcoming === "inactive"}
                                            className="accent-primary w-4 h-4"
                                        /> inactive
                                    </label>
                                </div>

                                {/* 🗓️ Dynamic Launch Date Input */}
                                {formData.upcoming === 'active' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300 p-3 bg-accent/10 rounded border border-accent/30 mt-2">
                                        <label className="block text-[10px] text-text-main font-bold mb-1 uppercase tracking-wider">
                                            Expected Launch Date
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="date"
                                                name="upcoming_date"
                                                value={formData.upcoming_date}
                                                onChange={handleChange}
                                                className="theme-input w-40 border-gray-300 focus:border-primary bg-white"
                                            />
                                            <span className="text-text-muted text-[11px] italic font-body">
                                                * Currently set for launch on: {formData.upcoming_date || 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 🟢 Exclusive Section (New Release ke turant baad) */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Exclusive
                            </label>
                            <div className="col-span-9 flex gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-body">
                                    <input
                                        type="radio"
                                        name="exclusive"
                                        value="active"
                                        onChange={handleChange}
                                        checked={formData.exclusive === "active"}
                                        className="accent-primary w-4 h-4"
                                    /> active
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-body">
                                    <input
                                        type="radio"
                                        name="exclusive"
                                        value="inactive"
                                        onChange={handleChange}
                                        checked={formData.exclusive === "inactive"}
                                        className="accent-primary w-4 h-4"
                                    /> inactive
                                </label>
                            </div>
                        </div>


                        {/* Shipping */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Ship Days</label><div className="col-span-9"><select name="ship_days" value={formData.ship_days} onChange={handleChange} className="theme-input w-48"><option value="">Select</option>{[1, 2, 3, 4, 5, 7].map(d => <option key={d} value={d}>{d}</option>)}</select></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Deliver Days</label><div className="col-span-9"><select name="deliver_days" value={formData.deliver_days} onChange={handleChange} className="theme-input w-48"><option value="">Select</option>{[1, 2, 3, 4, 5, 7].map(d => <option key={d} value={d}>{d}</option>)}</select></div></div>

                        {/* Search Text */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Search Text</label>
                            <div className="col-span-9 border rounded overflow-hidden"><JoditEditor value={searchText} config={config} onBlur={newContent => setSearchText(newContent)} /></div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-center gap-4 pt-10 pb-6 border-t mt-8">
                            <button onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="flex items-center bg-primary text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:brightness-110">
                                {loading ? "Updating..." : <><Check size={16} className="mr-2" /> Update</>}
                            </button>
                            <button onClick={(e) => handleSubmit(e, 'back')} className="flex items-center bg-gray-800 text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:bg-gray-900">
                                Update & Back
                            </button>
                            <button onClick={() => navigate('/admin/books')} className="flex items-center bg-white border border-gray-300 text-gray-600 px-8 py-2.5 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50">
                                <X size={16} className="mr-2" /> Cancel
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                .theme-input { border: 1px solid #d1d5db; border-radius: 4px; padding: 8px 12px; font-size: 13px; outline: none; transition: border-color 0.2s; }
                .theme-input:focus { border-color: #008DDA; box-shadow: 0 0 0 2px rgba(0, 141, 218, 0.1); }
            `}</style>
        </div>
    );
};

export default EditBook;