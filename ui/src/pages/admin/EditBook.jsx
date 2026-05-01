import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Save, RotateCcw, Plus, Search, Check, X, Upload, Eye, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import 'react-quill/dist/quill.snow.css';
import axios from '../../utils/axiosConfig';
import { useQuery, useMutation } from '@tanstack/react-query';
import { validateImageFiles } from '../../utils/fileValidator';

const EditBook = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const editor = useRef(null);

    // Image States
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [serverImage, setServerImage] = useState(null);

    const [tocImageFile, setTocImageFile] = useState(null);
    const [tocPreview, setTocPreview] = useState(null);

    const [tocImagesList, setTocImagesList] = useState([]);
    const [relatedImagesList, setRelatedImagesList] = useState([]);
    const [sampleImagesList, setSampleImagesList] = useState([]);

    // Rich Text States
    const [synopsis, setSynopsis] = useState('');
    const [criticsNote, setCriticsNote] = useState('');
    const [searchText, setSearchText] = useState('');

    // --- LIST DATA STATES ---
    const [categories, setCategories] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [formats, setFormats] = useState([]);
    const [seriesList, setSeriesList] = useState([]);
    const [publishers, setPublishers] = useState([]);

    // --- SEARCH & TOGGLE STATES ---
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
    const [authorSearchResults, setAuthorSearchResults] = useState([]);
    const [authorSearchLoading, setAuthorSearchLoading] = useState(false);
    const [selectedAuthorsCache, setSelectedAuthorsCache] = useState({});
    const [formatSearch, setFormatSearch] = useState("");
    const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
    const [seriesSearch, setSeriesSearch] = useState("");
    const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);
    const [publisherSearch, setPublisherSearch] = useState("");
    const [isPublisherDropdownOpen, setIsPublisherDropdownOpen] = useState(false);

    // Related Products Search States
    const [relatedSearchQuery, setRelatedSearchQuery] = useState("");
    const [relatedSearchResults, setRelatedSearchResults] = useState([]);
    const [isRelatedDropdownOpen, setIsRelatedDropdownOpen] = useState(false);
    const [isRelatedSearching, setIsRelatedSearching] = useState(false);
    const [selectedRelatedItems, setSelectedRelatedItems] = useState([]);

    // Quick Add States
    const [isAuthorPanelOpen, setIsAuthorPanelOpen] = useState(false);
    const [newAuthorData, setNewAuthorData] = useState({ first_name: '', last_name: '', origin: '' });
    const [newAuthorProfile, setNewAuthorProfile] = useState('');
    const [newAuthorImage, setNewAuthorImage] = useState(null);

    const [isSeriesPanelOpen, setIsSeriesPanelOpen] = useState(false);
    const [newSeriesData, setNewSeriesData] = useState({ title: '' });

    const [isPubPanelOpen, setIsPubPanelOpen] = useState(false);
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
        product_type: 'book',
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
        series: [],
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
        exclusive: 'inactive',
        exclusive_for: 'all',
        pages_desc: '',
    });

    // =======================================================================
    // 🚀 OPTIMIZATION 1: REACT QUERY - Fetching Data
    // =======================================================================
    const { data: pageData, isLoading: isMasterLoading } = useQuery({
        queryKey: ['editBookData', id],
        queryFn: async () => {
            const API_URL = process.env.REACT_APP_API_URL;
            const [catRes, langRes, tagRes, authRes, fmtRes, serRes, pubRes, setRes, bookRes] = await Promise.all([
                axios.get(`${API_URL}/category/fetch`),
                axios.get(`${API_URL}/languages/list`),
                axios.get(`${API_URL}/tags/list`),
                Promise.resolve({ data: { data: [] } }),
                axios.get(`${API_URL}/formats/list`),
                axios.get(`${API_URL}/series/list?limit=1000`),
                axios.get(`${API_URL}/publishers/list?limit=1000`),
                axios.get(`${API_URL}/settings/list`),
                axios.get(`${API_URL}/product/get/${id}`)
            ]);

            const book = bookRes.data.data || bookRes.data.book;
            if (!bookRes.data.status || !book) throw new Error("Failed to load book data");

            return {
                categories: catRes.data.data || [],
                languages: langRes.data.data || [],
                tags: tagRes.data.data || [],
                authors: [],
                formats: fmtRes.data.data || [],
                series: serRes.data.data || [],
                publishers: pubRes.data.data || [],
                arrivalDays: (setRes.data.status && setRes.data.data.length > 0) ? (setRes.data.data[0].new_arrival_time || 30) : 30,
                bookData: book
            };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 10
    });

    // Populate all states from fetched cache
    useEffect(() => {
        if (pageData) {
            const { categories, languages, tags, authors, formats, series, publishers, arrivalDays, bookData: book } = pageData;
            const API_URL = process.env.REACT_APP_API_URL;

            setCategories(categories);
            setLanguages(languages);
            setTags(tags);
            setAuthors(authors);
            setFormats(formats);
            // Ensure book's own series is in the list even if it falls outside the fetched 1000
            const bookSeries = pageData?.bookData?.series;
            const mergedSeries = bookSeries && !series.some(s => s.id === bookSeries.id)
                ? [bookSeries, ...series]
                : series;
            setSeriesList(mergedSeries);
            setPublishers(publishers);
            setArrivalDays(arrivalDays);

            // 🔍 DEBUG: Publisher check
            // console.log("=== PUBLISHER DEBUG ===");
            // console.log("1. Book publisher object:", book.publisher);
            // console.log("2. Book publisherId:", book.publisherId);
            // console.log("3. Publishers list (first 3):", publishers.slice(0, 3));
            // console.log("4. Publisher ID jo store hoga:", book.publisher ? String(book.publisher.id || book.publisher._id || book.publisher) : String(book.publisherId || ''));

            setFormData({
                title: book.title || '',
                product_type: book.productType || book.product_type || 'book',
                bagchee_id: book.bagcheeId || book.bagchee_id || '',
                leading_category: book.leadingCategoryId || book.categoryId || '',
                // junction arrays → extract IDs
                product_categories: book.categories
                    ? book.categories.map(c => c.categoryId || c.category?.id).filter(Boolean)
                    : (book.product_categories || []),
                product_languages: book.languages
                    ? book.languages.map(l => l.language?.title || l.title).filter(Boolean)
                    : (book.product_languages || (book.language ? [book.language] : [])),
                product_tags: book.tags
                    ? book.tags.map(t => t.tag?.title || t.title).filter(Boolean)
                    : (book.product_tags || []),
                product_formats: book.formats
                    ? book.formats.map(f => f.format?.title || f.title).filter(Boolean)
                    : (book.product_formats || (book.binding ? [book.binding] : [])),
                // junction → author IDs only (prevents "Objects not valid as React child" crash)
                authors: book.authors
                    ? book.authors.map(a => a.authorId || a.author?.id).filter(Boolean)
                    : (book.author ? [book.author] : []),
                // series is a direct relation (single object) or null
                series: book.series
                    ? [book.series.id || book.series._id]
                    : [],
                publisher: book.publisher ? String(book.publisher.id) : String(book.publisherId || ''),
                volume: book.volume || '',
                edition: book.edition || '',
                isbn10: book.isbn10 || '',
                isbn13: book.isbn13 || book.isbn || '',
                total_pages: book.pagesDesc || book.pages_desc || ((book.pages !== undefined && book.pages !== null) ? String(book.pages) : ''),
                weight: book.weight || '',
                price: book.price || '',
                real_price: book.realPrice || book.real_price || book.priceForeign || '',
                inr_price: book.inrPrice || book.price || '',
                discount: book.discount || '',
                stock: book.stock || 'active',
                availability: book.availability ? Number(book.availability) : 0,
                notes: book.notes || '',
                series_number: (book.seriesNumber !== undefined && book.seriesNumber !== null) ? String(book.seriesNumber) : (book.series_number ? String(book.series_number) : ''),
                meta_title: book.metaTitle || book.meta_title || '',
                meta_keywords: book.metaKeywords || book.meta_keywords || '',
                meta_description: book.metaDescription || book.meta_description || '',
                active: book.isActive ? 'active' : 'inactive',
                recommended: book.isRecommended ? 'active' : 'inactive',
                upcoming: book.upcoming ? 'active' : 'inactive',
                upcoming_date: (book.upcomingDate || book.upcoming_date) ? new Date(book.upcomingDate || book.upcoming_date).toISOString().split('T')[0] : '',
                new_release: book.isNewRelease ? 'active' : 'inactive',
                new_release_until: (book.newReleaseUntil || book.new_release_until) ? new Date(book.newReleaseUntil || book.new_release_until).toISOString().split('T')[0] : '',
                exclusive: book.isExclusive ? 'active' : 'inactive',
                exclusive_for: book.exclusiveFor || book.exclusive_for || 'all',
                pages_desc: book.pagesDesc || book.pages_desc || '',
                ship_days: book.shipDays !== undefined ? String(book.shipDays) : (book.ship_days !== undefined ? String(book.ship_days) : ''),
                deliver_days: book.deliverDays !== undefined ? String(book.deliverDays) : (book.deliver_days !== undefined ? String(book.deliver_days) : ''),
                pub_date: book.pubDate || book.pub_date || '',
                source: book.source || '',
                rating: book.rating || '',
                rated_times: book.ratedTimes || book.rated_times || '',
                toc_image: book.tocImage || book.toc_image || '',
                ordered_items_count: book.soldCount || 0,
            });

            // console.log("5. formData.publisher set to:", book.publisher ? String(book.publisher.id || book.publisher._id || book.publisher) : String(book.publisherId || ''));

            if (book.newReleaseUntil || book.new_release_until) {
                setUserSelectedDate(new Date(book.newReleaseUntil || book.new_release_until).toISOString().split('T')[0]);
            }

            const tocImgs = book.tocImages || book.toc_images;
            const relImgs = book.images || book.related_images;
            const sampImgs = book.sampleImages || book.sample_images;
            if (tocImgs && tocImgs.length > 0) setTocImagesList(tocImgs.map((img) => ({ id: img.id || img._id, image: img.file || img.image || img.url, order: img.ord ?? img.order ?? 0, file: null })));
            if (relImgs && relImgs.length > 0) setRelatedImagesList(relImgs.map((img) => ({ id: img.id || img._id, image: img.file || img.image || img.url, order: img.ord ?? img.order ?? 0, file: null })));
            if (sampImgs && sampImgs.length > 0) setSampleImagesList(sampImgs.map((img) => ({ id: img.id || img._id, image: img.file || img.image || img.url, order: img.ord ?? img.order ?? 0, file: null })));

            const tocImagePath = book.tocImage || book.toc_image;
            if (tocImagePath) {
                let cleanTocPath = tocImagePath.replace(/\\/g, '/');
                if (!cleanTocPath.startsWith('http')) {
                    const baseUrl = API_URL.replace('/api', '') || 'http://localhost:5000';
                    cleanTocPath = `${baseUrl}${cleanTocPath.startsWith('/') ? '' : '/'}${cleanTocPath}`;
                }
                setTocPreview(cleanTocPath);
            }

            const imgRaw = book.defaultImage || book.default_image || book.producticonname;
            if (imgRaw) {
                let cleanPath = imgRaw.replace(/\\/g, '/');
                if (!cleanPath.startsWith('http')) {
                    const baseUrl = API_URL.replace('/api', '');
                    cleanPath = `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
                }
                setServerImage(cleanPath);
            }

            if (book.authors) {
                const cache = {};
                book.authors.forEach(a => {
                    const id = a.authorId || a.author?.id;
                    const name = a.author?.fullName || `${a.author?.firstName || ''} ${a.author?.lastName || ''}`.trim();
                    if (id && name) cache[String(id)] = name;
                });
                setSelectedAuthorsCache(cache);
            }

            setSynopsis(book.synopsis || book.description || '');
            setCriticsNote(book.criticsNote || book.critics_note || '');
            setSearchText(book.searchText || book.search_text || '');

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
        }
    }, [pageData]);

    // =======================================================================
    // 🚀 OPTIMIZATION 2: REACT QUERY MUTATIONS
    // =======================================================================
    const updateBookMutation = useMutation({
        mutationFn: async (submitData) => {
            const res = await axios.patch(`${process.env.REACT_APP_API_URL}/product/update/${id}`, submitData);
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


    // Related Search Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (authorSearch.length > 1 && isAuthorDropdownOpen) {
                setAuthorSearchLoading(true);
                try {
                    const API_URL = process.env.REACT_APP_API_URL;
                    const res = await axios.get(`${API_URL}/authors/list?q=${encodeURIComponent(authorSearch)}&limit=20`);
                    if (res.data.status) setAuthorSearchResults(res.data.data || []);
                } catch { setAuthorSearchResults([]); }
                finally { setAuthorSearchLoading(false); }
            } else {
                setAuthorSearchResults([]);
            }
        }, 350);
        return () => clearTimeout(delayDebounceFn);
    }, [authorSearch, isAuthorDropdownOpen]);

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

    const handleAddRelatedProduct = (product) => {
        const idToAdd = product.bagchee_id || product._id;
        const titleToAdd = product.title;
        if (selectedRelatedItems.find(item => item.id === idToAdd)) {
            return toast.error("Product already linked!");
        }
        const updatedList = [...selectedRelatedItems, { id: idToAdd, title: titleToAdd }];
        setSelectedRelatedItems(updatedList);
        const idsString = updatedList.map(item => item.id).join(',');
        setFormData(prev => ({ ...prev, related_products: idsString }));
        toast.success("Product Added!");
        setRelatedSearchQuery("");
        setIsRelatedDropdownOpen(false);
    };

    const handleRemoveRelatedProduct = (idToRemove) => {
        const updatedList = selectedRelatedItems.filter(item => item.id !== idToRemove);
        setSelectedRelatedItems(updatedList);
        const idsString = updatedList.map(item => item.id).join(',');
        setFormData(prev => ({ ...prev, related_products: idsString }));
    };

    // Calculate Dates
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
        if (e.target.value === 'active') {
            const dateToSet = userSelectedDate || getCalculatedDate();
            setFormData(prev => ({ ...prev, new_release: 'active', new_release_until: dateToSet }));
            setUserSelectedDate(dateToSet);
        } else {
            setFormData(prev => ({ ...prev, new_release: 'inactive', new_release_until: '' }));
            setUserSelectedDate('');
        }
    };

    // Quick Adds
    const handleQuickAuthorSave = async (e) => {
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
                    toast.success("Author added!", { id: toastId });
                    setAuthors(prev => [...prev, res.data]);
                    setFormData(prev => ({ ...prev, authors: [...prev.authors, res.data._id] }));
                    setIsAuthorPanelOpen(false);
                    setNewAuthorData({ first_name: '', last_name: '', origin: '' });
                    setNewAuthorProfile('');
                    setNewAuthorImage(null);
                } else toast.error("Failed", { id: toastId });
            },
            onError: () => toast.error("Failed", { id: toastId })
        });
    };

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            let updatedData = { ...prev, [name]: value }; // <-- YAHAN PURANA LOGIC HAI

            if (name === 'price' || name === 'discount') { // <-- YAHAN NAYA LOGIC HAI
                const priceVal = Number(updatedData.price) || 0;
                const discountVal = Number(updatedData.discount) || 0;

                if (priceVal > 0) {
                    if (discountVal > 0) {
                        updatedData.real_price = Math.round(priceVal - (priceVal * discountVal) / 100);
                    } else {
                        updatedData.real_price = priceVal;
                    }
                }
            }
            return updatedData; // <-- YAHAN DATA WAPAS BHEJ RAHE HAIN
        });
    }, []);

    const handleCheckboxChange = (field, value) => {
        setFormData((prev) => {
            const currentList = prev[field] || [];
            return { ...prev, [field]: currentList.includes(value) ? currentList.filter(i => i !== value) : [...currentList, value] };
        });
    };

    const handleQuickPubSave = async (e) => {
        e.preventDefault();
        if (!newPubData.title || !newPubData.category) return toast.error("Title and Category are required!");
        const toastId = toast.loading("Saving publisher...");
        const data = new FormData();
        Object.keys(newPubData).forEach(k => { if (!(k === 'date' && !newPubData[k])) data.append(k, newPubData[k]); });
        if (newPubImage) data.append('image', newPubImage);

        savePublisherMutation.mutate(data, {
            onSuccess: (res) => {
                if (res.status) {
                    toast.success("Publisher added!", { id: toastId });
                    setPublishers(prev => [...prev, res.data]);
                    setFormData(prev => ({ ...prev, publisher: String(res.data.id || data._id) }));
                    setIsPubPanelOpen(false);
                    setNewPubData({ category: '', title: '', company: '', address: '', place: '', email: '', phone: '', order: '', slug: '' });
                    setNewPubImage(null);
                    setNewPubPreview(null);
                }
            },
            onError: () => toast.error("Failed", { id: toastId })
        });
    };

    const handleQuickSeriesSave = async (e) => {
        e.preventDefault();
        if (!newSeriesData.title) return toast.error("Series title is required!");
        const toastId = toast.loading("Saving series...");
        saveSeriesMutation.mutate(newSeriesData, {
            onSuccess: (res) => {
                if (res.status) {
                    setSeriesList(prev => [...prev, res.data]);
                    setFormData(prev => ({ ...prev, series: res.data.id || res.data._id, series_number: "1" }));
                    toast.success("Series added!", { id: toastId });
                    setIsSeriesPanelOpen(false);
                    setNewSeriesData({ title: '' });
                }
            },
            onError: () => toast.error("Failed", { id: toastId })
        });
    };

    // Dynamic Row Helpers
    const addImageRow = (setter) => setter(prev => [...prev, { id: Date.now(), file: null, order: prev.length + 1 }]);
    const removeImageRow = (setter, id) => setter(prev => prev.filter(item => item.id !== id));
    const handleDynamicImageChange = (setter, id, file, e) => {
        if (!file) return;
        if (validateImageFiles(file)) setter(prev => prev.map(item => item.id === id ? { ...item, file: file } : item));
        else if (e) e.target.value = "";
    };
    const handleDynamicOrderChange = (setter, id, order) => setter(prev => prev.map(item => item.id === id ? { ...item, order: order } : item));

    // --- MAIN SUBMIT ---
    const handleSubmit = async (e, actionType) => {
        e.preventDefault();
        const toastId = toast.loading("Updating book...");

        try {
            const data = new FormData();

            data.append('product_type', formData.product_type || 'book');
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
            if (formData.series && formData.series.length > 0) {
                const firstSeries = formData.series[0];
                if (firstSeries) data.append('series', String(firstSeries));
            }
            if (formData.series_number) data.append('series_number', formData.series_number);
            if (formData.publisher) data.append('publisher', formData.publisher);

            if (formData.authors && formData.authors.length > 0) {
                const firstAuthor = formData.authors[0];
                data.append('author', firstAuthor);
                data.append('author_id', firstAuthor);
                data.append('authors', JSON.stringify(formData.authors));
            }

            if (formData.product_categories) data.append('product_categories', JSON.stringify(formData.product_categories));
            if (formData.product_languages) data.append('product_languages', JSON.stringify(formData.product_languages));
            if (formData.product_tags) data.append('product_tags', JSON.stringify(formData.product_tags));
            if (formData.product_formats) data.append('product_formats', JSON.stringify(formData.product_formats));

            data.append('meta_title', formData.meta_title || '');
            data.append('meta_description', formData.meta_description || '');
            data.append('meta_keywords', formData.meta_keywords || '');
            data.append('synopsis', synopsis || '');
            data.append('critics_note', criticsNote || '');
            data.append('search_text', searchText || '');

            data.append('active', formData.active);
            data.append('recommended', formData.recommended);
            data.append('upcoming', formData.upcoming);
            data.append('upcoming_date', formData.upcoming_date || '');
            data.append('new_release', formData.new_release);
            data.append('new_release_until', formData.new_release_until || '');
            data.append('exclusive', formData.exclusive);
            data.append('exclusive_for', formData.exclusive_for || 'all');
            data.append('pages_desc', formData.total_pages || '');
            data.append('ship_days', formData.ship_days || '');
            data.append('deliver_days', formData.deliver_days || '');
            data.append('pub_date', formData.pub_date || '');
            data.append('source', formData.source || '');
            data.append('rating', formData.rating || '');
            data.append('rated_times', formData.rated_times || '');
            data.append('toc_image', formData.toc_image || '');

            if (imageFile) data.append('default_image', imageFile);
            if (tocImageFile) data.append('toc_image', tocImageFile);

            tocImagesList.forEach(item => { if (item.file) { data.append(`toc_images`, item.file); data.append(`toc_images_order`, item.order); } });
            relatedImagesList.forEach(item => { if (item.file) { data.append(`related_images`, item.file); data.append(`related_images_order`, item.order); } });
            sampleImagesList.forEach(item => { if (item.file) { data.append(`sample_images`, item.file); data.append(`sample_images_order`, item.order); } });

            updateBookMutation.mutate(data, {
                onSuccess: (res) => {
                    if (res.status) {
                        toast.success("Updated Successfully!", { id: toastId });
                        if (actionType === 'back') navigate('/admin/books');
                        else window.location.reload();
                    } else toast.error(res.msg || "Update failed", { id: toastId });
                },
                onError: (err) => toast.error(err.response?.data?.msg || "Update failed", { id: toastId })
            });
        } catch (error) {
            toast.error("Failed to update", { id: toastId });
        }
    };

    const config = useMemo(() => ({ readonly: false, placeholder: 'Start typing...', toolbarSticky: false, height: 350 }), []);

    const handleSeriesSelect = (selectedSeries) => {
        setFormData(prev => {
            // Ensure karein ki series hamesha array format mein ho
            const currentSeries = Array.isArray(prev.series) ? prev.series : [];

            // Duplicate check: Agar ID pehle se hai to error dikhao
            const seriesId = selectedSeries.id || selectedSeries._id;
            if (currentSeries.includes(seriesId)) {
                toast.error("This series is already added!");
                return prev;
            }

            return {
                ...prev,
                series: [...currentSeries, seriesId],
                // Pehli baar select hone par number suggest karega
                series_number: prev.series_number || (selectedSeries.total_books ? (selectedSeries.total_books + 1).toString() : "1")
            };
        });
        setIsSeriesDropdownOpen(false);
        setSeriesSearch("");
    };

    const handlePublisherSelect = (pub) => {
        setFormData(prev => ({ ...prev, publisher: String(pub.id || pub._id) }));
        setIsPublisherDropdownOpen(false); setPublisherSearch("");
    };

    // Previews Logic
    useEffect(() => {
        if (!imageFile) { setPreview(null); return; }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const removeImage = () => { setImageFile(null); setServerImage(null); const input = document.getElementById('default_image_input'); if (input) input.value = ""; };

    useEffect(() => {
        if (!tocImageFile) { setTocPreview(null); return; }
        const objectUrl = URL.createObjectURL(tocImageFile);
        setTocPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [tocImageFile]);

    const removeTocImage = () => { setTocImageFile(null); const input = document.getElementById('toc_image_input'); if (input) input.value = ""; };

    const selectedLeadingCategory = categories.find(c => (c.id || c._id) === formData.leading_category);

    return (
        <div className="bg-gray-50 min-h-screen font-body text-text-main">
            <div className="bg-primary text-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-lg font-bold text-gray-700 uppercase tracking-tight">Edit Book</h1>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 space-y-6">

                        {isMasterLoading && (
                            <div className="text-center text-primary font-bold text-sm py-4 animate-pulse">
                                Loading book details & references...
                            </div>
                        )}

                        {/* --- 🟢 Bagchee ID & Product Page Button --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Bagchee id</label>
                            <div className="col-span-9 flex gap-2">
                                <input
                                    name="bagchee_id"
                                    type="text"
                                    value={formData.bagchee_id || "Loading..."}
                                    readOnly
                                    className="theme-input w-full bg-gray-100 text-gray-800 cursor-not-allowed font-bold"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.title) {
                                            toast.error("Please wait for the book details to load.");
                                            return;
                                        }
                                        // Title se URL ke liye slug banate hain (e.g. "My Book" -> "my-book")
                                        const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                        const productId = formData.bagchee_id || id;

                                        // Naye tab me book ka page open karega
                                        window.open(`/books/${productId}/${slug}`, '_blank');
                                    }}
                                    className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded text-[11px] font-bold uppercase hover:bg-primary hover:text-white transition-all shadow-sm whitespace-nowrap"
                                >
                                    Product page
                                </button>
                            </div>
                        </div>
                        {/* ----------------------------------------- */}

                        {/* 1. Title */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Title*</label>
                            <div className="col-span-9">
                                <input name="title" type="text" value={formData.title} onChange={handleChange} className="theme-input w-full" />
                            </div>
                        </div>

                        {/* 2. Leading Category */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Leading category*</label>
                            <div className="col-span-9 relative">
                                <div onClick={() => setIsLeadingOpen(!isLeadingOpen)} className="theme-input w-1/2 cursor-pointer flex justify-between items-center bg-white border border-gray-300 rounded p-2 text-sm">
                                    <span className={selectedLeadingCategory ? "text-gray-700" : "text-gray-400"}>{selectedLeadingCategory ? (selectedLeadingCategory.title || selectedLeadingCategory.categorytitle) : "Select category"}</span>
                                    <span className="text-gray-400 text-[10px]">▼</span>
                                </div>
                                {isLeadingOpen && (
                                    <div className="absolute z-50 mt-1 w-1/2 bg-white border border-gray-300 rounded shadow-lg max-h-60 flex flex-col">
                                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                                            <input type="text" placeholder="Search..." value={leadingSearch} onChange={(e) => setLeadingSearch(e.target.value)} className="w-full text-xs p-1.5 border border-gray-200 rounded focus:border-primary outline-none" autoFocus />
                                        </div>
                                        <div className="overflow-y-auto">
                                            {categories.filter(cat => (cat.title || cat.categorytitle || '').toLowerCase().includes(leadingSearch.toLowerCase())).map((cat) => (
                                                <div key={cat.id || cat._id} onClick={() => { setFormData({ ...formData, leading_category: cat.id || cat._id }); setIsLeadingOpen(false); setLeadingSearch(""); }} className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.leading_category === (cat.id || cat._id) ? "bg-blue-50 text-primary font-bold" : "text-gray-600"}`}>
                                                    {cat.title || cat.categorytitle}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {isLeadingOpen && <div className="fixed inset-0 z-10" onClick={() => setIsLeadingOpen(false)}></div>}
                            </div>
                        </div>

                        {/* 3. Product Categories */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Product categories</label>
                            <div className="col-span-9 relative">
                                <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
                                    {formData.product_categories.length > 0 ? (
                                        formData.product_categories.map((catId) => {
                                            const category = categories.find(c => (c.id || c._id) === catId);
                                            return category ? (
                                                <span key={catId} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                    {category.title || category.categorytitle}
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
                                        <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                            {categories.filter((cat) => (cat.title || cat.categorytitle || '').toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => {
                                                const isSelected = formData.product_categories.includes(cat.id || cat._id);
                                                return (
                                                    <div key={cat.id || cat.id || cat._id} onClick={() => handleCheckboxChange('product_categories', cat.id || cat._id)} className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input type="checkbox" checked={isSelected} readOnly className="accent-primary h-4 w-4 pointer-events-none" />
                                                        <span className={`text-gray-700 ${isSelected ? 'font-bold text-primary' : ''}`}>{cat.title || cat.categorytitle}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {isCategoryDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)}></div>}
                            </div>
                        </div>

                        {/* 4. Product Languages */}
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

                        {/* 5. Product Tags */}
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

                        {/* 6. Related Products */}
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
                                                <div key={prod.id || prod.id || prod._id} onClick={() => handleAddRelatedProduct(prod)} className="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer">
                                                    <span className="text-sm font-bold block">{prod.title}</span>
                                                    <span className="text-[10px] text-gray-500">ID: {prod.bagchee_id || prod.id || prod._id}</span>
                                                </div>
                                            )) : <div className="p-3 text-xs text-gray-400 text-center">No products found</div>}
                                        </div>
                                    )}
                                    {isRelatedDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsRelatedDropdownOpen(false)}></div>}
                                </div>
                            </div>
                        </div>

                        {/* 7. Authors */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-6">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Authors</label>
                            <div className="col-span-9 space-y-3">
                                <div className="relative">
                                    <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors" onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}>
                                        {formData.authors.length > 0 ? (
                                            formData.authors.map((authId, idx) => {
                                                const authorName = selectedAuthorsCache[String(authId)] || `Author #${authId}`;
                                                return (
                                                    <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                        {authorName}
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleCheckboxChange('authors', authId); }} className="hover:text-red-500">×</button>
                                                    </span>
                                                );
                                            })
                                        ) : <span className="text-gray-400 text-xs">Select authors...</span>}
                                        <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                    </div>
                                    {isAuthorDropdownOpen && (
                                        <div className="absolute z-[100] top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t">
                                                <input type="text" placeholder="Search authors..." value={authorSearch} onChange={(e) => setAuthorSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none bg-white" autoFocus />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                                {authorSearchLoading ? (
                                                    <div className="p-3 text-xs text-gray-400 text-center">Searching...</div>
                                                ) : authorSearch.length < 2 ? (
                                                    <div className="p-3 text-xs text-gray-400 text-center">Type at least 2 characters to search</div>
                                                ) : authorSearchResults.length === 0 ? (
                                                    <div className="p-3 text-xs text-gray-400 text-center">No authors found</div>
                                                ) : authorSearchResults.map((auth) => {
                                                    const isSelected = formData.authors.includes(auth.id);
                                                    const name = auth.fullName || `${auth.firstName || ''} ${auth.lastName || ''}`.trim();
                                                    return (
                                                        <div key={auth.id} onClick={() => {
                                                            handleCheckboxChange('authors', auth.id);
                                                            setSelectedAuthorsCache(prev => ({ ...prev, [String(auth.id)]: name }));
                                                        }} className={`flex items-center justify-between p-2 text-sm rounded hover:bg-blue-50 cursor-pointer ${isSelected ? 'bg-blue-50 font-bold text-primary' : ''}`}>
                                                            <span>{name}</span>
                                                            {isSelected && <Check size={14} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {isAuthorDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsAuthorDropdownOpen(false)}></div>}
                                </div>
                                <div className="flex justify-start">
                                    <button type="button" onClick={() => setIsAuthorPanelOpen(!isAuthorPanelOpen)} className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2 transition-all">
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
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">First Name*</label><input type="text" value={newAuthorData.first_name} onChange={(e) => setNewAuthorData({ ...newAuthorData, first_name: e.target.value })} className="theme-input w-full bg-white text-xs" /></div>
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Last Name</label><input type="text" value={newAuthorData.last_name} onChange={(e) => setNewAuthorData({ ...newAuthorData, last_name: e.target.value })} className="theme-input w-full bg-white text-xs" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Author Picture</label>
                                                <div className="flex items-center gap-3">
                                                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded text-[10px] font-bold uppercase hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        <Upload size={14} className="inline mr-2" /> {newAuthorImage ? "Selected" : "Upload Picture"}
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (!file) return;
                                                            if (validateImageFiles(file)) setNewAuthorImage(file);
                                                            else e.target.value = "";
                                                        }} />
                                                    </label>
                                                    {newAuthorImage && <span className="text-[10px] text-green-600 font-bold italic truncate max-w-[150px]">{newAuthorImage.name}</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Origin</label><input type="text" value={newAuthorData.origin} onChange={(e) => setNewAuthorData({ ...newAuthorData, origin: e.target.value })} className="theme-input w-full bg-white text-xs" /></div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Author Profile</label>
                                            <div className="bg-white rounded border shadow-sm overflow-hidden"><JoditEditor value={newAuthorProfile} config={{ height: 200 }} onBlur={c => setNewAuthorProfile(c)} /></div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                                            <button type="button" onClick={() => setIsAuthorPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600 px-4 transition-colors">Discard</button>
                                            <button type="button" disabled={saveAuthorMutation.isPending} onClick={handleQuickAuthorSave} className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50">
                                                {saveAuthorMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save & Link Author
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 8. Ordered Items */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 text-gray-400">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-tight">Ordered items</label>
                            <div className="col-span-9">
                                <div className="relative w-full md:w-1/2">
                                    <input type="text" disabled readOnly value={formData.ordered_items_count > 0 ? `${formData.ordered_items_count} Orders Total` : "No orders yet"} className="theme-input w-full bg-gray-50 cursor-not-allowed border-dashed text-gray-400" />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2"><Check size={12} className="text-gray-300" /></div>
                                </div>
                            </div>
                        </div>

                        {/* 9. Product Formats */}
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
                                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col">
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

                        {/* 10. Dimensions */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Volume</label><div className="col-span-9"><input name="volume" value={formData.volume} onChange={handleChange} className="theme-input w-full md:w-1/3" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Edition</label><div className="col-span-9"><input name="edition" value={formData.edition} onChange={handleChange} className="theme-input w-full md:w-1/3" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">ISBN 10</label><div className="col-span-9"><input name="isbn10" value={formData.isbn10} onChange={handleChange} className="theme-input w-full md:w-1/2" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">ISBN 13</label><div className="col-span-9"><input name="isbn13" value={formData.isbn13} onChange={handleChange} className="theme-input w-full md:w-1/2" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Total Pages</label><div className="col-span-9"><input name="total_pages" type="text" value={formData.total_pages || ""} onChange={handleChange} className="theme-input w-full" placeholder="e.g. 219 or 219p., (6)col. pls., 29cm." /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Weight</label><div className="col-span-9"><input name="weight" value={formData.weight} onChange={handleChange} className="theme-input w-32" /></div></div>

                        {/* 11. IMAGES SECTIONS */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Default image</label>
                            <div className="col-span-9">
                                <input type="file" id="default_image_input" className="hidden" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (validateImageFiles(file)) { setImageFile(file); setServerImage(null); }
                                    else e.target.value = "";
                                }} />
                                <div className="flex items-start gap-4">
                                    <label htmlFor="default_image_input" className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-3 rounded-lg text-[11px] font-bold uppercase hover:bg-gray-50 transition-all flex flex-col items-center gap-1 text-gray-500 min-w-[100px]">
                                        <Upload size={18} /><span>Upload</span>
                                    </label>
                                    {(preview || serverImage) && (
                                        <div className="relative group">
                                            <div className="w-16 h-20 rounded-lg overflow-hidden border shadow-sm relative">
                                                <img src={preview || serverImage} alt="Cover" className="w-full h-full object-cover" />
                                            </div>
                                            <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110"><X size={10} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Default toc image</label>
                            <div className="col-span-9 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    {tocPreview && (
                                        <div className="relative group">
                                            <img src={tocPreview} alt="TOC Preview" className="w-16 h-20 object-cover border rounded shadow-sm" />
                                            <button type="button" onClick={removeTocImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110"><X size={10} /></button>
                                        </div>
                                    )}
                                    <input type="file" id="toc_image_input" className="hidden" accept="image/*" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (validateImageFiles(file)) setTocImageFile(file);
                                        else e.target.value = "";
                                    }} />
                                    <label htmlFor="toc_image_input" className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:bg-gray-50 transition-all flex items-center gap-2">
                                        <Upload size={14} /> {tocPreview ? "Change" : "Upload"}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Add toc images</label>
                            <div className="md:col-span-9 space-y-3">
                                {tocImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {(item.file || item.image) ? (
                                                <img src={item.file ? URL.createObjectURL(item.file) : `${process.env.REACT_APP_API_URL}${item.image}`} alt="preview" className="w-full h-full object-cover" />
                                            ) : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input type="file" id={`toc_upload_${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleDynamicImageChange(setTocImagesList, item.id, e.target.files[0], e)} />
                                            <label htmlFor={`toc_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-gray-50 transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : (item.image ? "Replace" : "Upload")}
                                            </label>
                                            <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">{item.file ? item.file.name : (item.image ? "Existing Image" : "No image selected")}</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <input type="number" value={item.order} onChange={(e) => handleDynamicOrderChange(setTocImagesList, item.id, e.target.value)} className="theme-input w-16 text-center text-xs" placeholder="Ord" />
                                            <button type="button" onClick={() => removeImageRow(setTocImagesList, item.id)} className="bg-red-100 text-red-500 p-2 rounded hover:bg-red-200 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addImageRow(setTocImagesList)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-all shadow-sm"><Plus size={14} /> Add toc image</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Related images</label>
                            <div className="md:col-span-9 space-y-3">
                                {relatedImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {(item.file || item.image) ? (
                                                <img src={item.file ? URL.createObjectURL(item.file) : `${process.env.REACT_APP_API_URL}${item.image}`} alt="preview" className="w-full h-full object-cover" />
                                            ) : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input type="file" id={`rel_upload_${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleDynamicImageChange(setRelatedImagesList, item.id, e.target.files[0], e)} />
                                            <label htmlFor={`rel_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-gray-50 transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : (item.image ? "Replace" : "Upload")}
                                            </label>
                                            <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">{item.file ? item.file.name : (item.image ? "Existing Image" : "No image selected")}</span>
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

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Sample images</label>
                            <div className="md:col-span-9 space-y-3">
                                {sampleImagesList.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 border p-3 rounded bg-gray-50">
                                        <div className="w-full sm:w-14 h-14 border bg-white flex-shrink-0 overflow-hidden rounded relative">
                                            {(item.file || item.image) ? (
                                                <img src={item.file ? URL.createObjectURL(item.file) : `${process.env.REACT_APP_API_URL}${item.image}`} alt="preview" className="w-full h-full object-cover" />
                                            ) : <div className="flex items-center justify-center h-full bg-gray-100 text-[9px] text-gray-400">No Img</div>}
                                        </div>
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <input type="file" id={`samp_upload_${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleDynamicImageChange(setSampleImagesList, item.id, e.target.files[0], e)} />
                                            <label htmlFor={`samp_upload_${item.id}`} className="cursor-pointer bg-white border border-dashed border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-gray-50 transition-all inline-flex items-center gap-2">
                                                <Upload size={12} /> {item.file ? "Change" : (item.image ? "Replace" : "Upload")}
                                            </label>
                                            <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px] mx-auto sm:mx-0">{item.file ? item.file.name : (item.image ? "Existing Image" : "No image selected")}</span>
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

                        {/* 12. Pub Date, Source, Ratings */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Pub date</label>
                            <div className="col-span-9 space-y-1">
                                <input
                                    name="pub_date"
                                    type="date"
                                    value={formData.pub_date || ''}
                                    onChange={handleChange}
                                    className="theme-input w-full md:w-1/3 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, pub_date: '' })}
                                    className="block text-primary text-[10px] font-bold hover:underline mt-1"
                                >
                                    Clear Date
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Source</label><div className="col-span-9"><input name="source" type="text" value={formData.source} onChange={handleChange} className="theme-input w-full" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Rating</label>
                            <div className="col-span-9">
                                <select name="rating" value={formData.rating || ""} onChange={handleChange} className="theme-input w-32 bg-white">
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} Stars</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Rated times</label><div className="col-span-9"><input name="rated_times" type="number" value={formData.rated_times || ""} onChange={handleChange} className="theme-input w-32" /></div></div>

                        {/* 13. Series Section */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Series</label>
                            <div className="col-span-9 space-y-3">
                                <div className="relative">
                                    {/* Selected Series Display (Clickable to open dropdown) */}
                                    <div
                                        className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors theme-input w-full md:w-1/2"
                                        onClick={() => setIsSeriesDropdownOpen(!isSeriesDropdownOpen)}
                                    >
                                        {formData.series && formData.series.length > 0 ? (
                                            formData.series.map((serId) => {
                                                // list mein se series ka naam dhoondhna
                                                const seriesObj = seriesList.find(s => (s.id || s._id) === serId);
                                                return seriesObj ? (
                                                    <span key={serId} className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                                                        {seriesObj.title}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCheckboxChange('series', serId);
                                                            }}
                                                            className="hover:text-red-500 font-bold ml-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-gray-400 text-sm">Select one or more series...</span>
                                        )}
                                        <div className="ml-auto text-gray-400 text-[10px]">▼</div>
                                    </div>

                                    {/* Dropdown Menu */}
                                    {isSeriesDropdownOpen && (
                                        <div className="absolute z-50 top-full left-0 w-full md:w-1/2 bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <input
                                                    type="text"
                                                    placeholder="Search series..."
                                                    value={seriesSearch}
                                                    onChange={(e) => setSeriesSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-xs p-1.5 border border-gray-200 rounded focus:border-primary outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                                {seriesList.filter(s => s.title.toLowerCase().includes(seriesSearch.toLowerCase())).map(s => {

                                                    const isSelected = Array.isArray(formData.series) && formData.series.includes(s.id || s._id);
                                                    return (
                                                        <div
                                                            key={s.id || s.id || s._id}
                                                            onClick={() => handleSeriesSelect(s)}
                                                            className={`px-3 py-2 text-sm cursor-pointer rounded hover:bg-blue-50 flex justify-between items-center ${isSelected ? "bg-blue-50 text-primary font-bold" : "text-gray-600"}`}
                                                        >
                                                            {s.title}
                                                            {isSelected && <Check size={14} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {/* Background click to close dropdown */}
                                    {isSeriesDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsSeriesDropdownOpen(false)}></div>}
                                </div>

                                <div className="flex justify-start">
                                    <button type="button" onClick={() => setIsSeriesPanelOpen(!isSeriesPanelOpen)} className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded text-[11px] font-bold uppercase text-gray-700 hover:bg-gray-200 shadow-sm flex items-center gap-2">
                                        {isSeriesPanelOpen ? <X size={14} /> : <Plus size={14} />} Add new series
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Series number</label><div className="col-span-9"><input name="series_number" type="number" value={formData.series_number || ""} onChange={handleChange} className="theme-input w-full md:w-1/3" /></div></div>
                        {/* 14. Pricing, Stock & Rich Text */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Price*</label>
                            <div className="col-span-9">
                                <input name="price" type="number" value={formData.price || ""} onChange={handleChange} className="theme-input w-32" />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Real Price</label>
                            <div className="col-span-9">
                                <input
                                    name="real_price"
                                    type="number"
                                    value={formData.real_price || ""}
                                    onChange={handleChange}
                                    className="theme-input w-32 bg-gray-50 cursor-not-allowed"
                                    readOnly
                                    title="Auto-calculated based on discount"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Discount (%)</label>
                            <div className="col-span-9">
                                <input name="discount" type="number" value={formData.discount || ""} onChange={handleChange} className="theme-input w-32" placeholder="%" />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-1">Stock status</label>
                            <div className="col-span-9 flex gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="stock" value="active" checked={formData.stock === 'active'} onChange={handleChange} className="accent-primary w-4 h-4" /> active</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="stock" value="inactive" checked={formData.stock === 'inactive'} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Availability (Quantity)</label>
                            <div className="col-span-9">
                                <input name="availability" type="number" value={formData.availability} onChange={handleChange} className="theme-input w-32" placeholder="Enter quantity" />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Synopsis</label>
                            <div className="col-span-9 border rounded overflow-hidden"><JoditEditor ref={editor} value={synopsis} config={config} onBlur={newContent => setSynopsis(newContent)} /></div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Critics Note</label>
                            <div className="col-span-9 border rounded overflow-hidden"><JoditEditor value={criticsNote} config={config} onBlur={newContent => setCriticsNote(newContent)} /></div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 mt-6">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Notes</label>
                            <div className="col-span-9"><input name="notes" type="text" value={formData.notes || ""} onChange={handleChange} className="theme-input w-full" placeholder="Internal notes or extra info" /></div>
                        </div>

                        {/* 15. Publisher Section */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-3">Publisher</label>
                            <div className="col-span-9 space-y-3">
                                <div className="relative">
                                    {/* DEBUG */}
                                    {/* {console.log("6. publishers state:", publishers)} */}
                                    {/* {console.log("7. formData.publisher:", formData.publisher)} */}
                                    {/* {console.log("8. find result:", publishers.find(p => String(p.id) === String(formData.publisher)))} */}
                                    {/* {console.log("9. First publisher object FULL:", JSON.stringify(publishers[0]))} */}
                                    <div className="border border-gray-300 rounded p-2 bg-white cursor-pointer min-h-[38px] flex justify-between items-center hover:border-primary transition-colors theme-input w-full md:w-1/2" onClick={() => setIsPublisherDropdownOpen(!isPublisherDropdownOpen)}>
                                        <span className={formData.publisher ? "text-gray-700 font-medium" : "text-gray-400 text-sm"}>
                                            {formData.publisher
                                                ? (() => {
                                                    const publisher = publishers.find(p => String(p.id) === String(formData.publisher));
                                                    return publisher ? publisher.title : "Unknown Publisher";
                                                })()
                                                : "Select Publisher"
                                            }
                                        </span>
                                        <ChevronDown size={14} className="text-gray-400" />
                                    </div>
                                    {isPublisherDropdownOpen && (
                                        <div className="absolute z-[100] top-full left-0 w-full md:w-1/2 bg-white border border-gray-300 rounded shadow-lg mt-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="p-2 border-b bg-gray-50">
                                                <input type="text" placeholder="Search..." value={publisherSearch} onChange={(e) => setPublisherSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full text-xs p-1.5 border rounded outline-none bg-white" autoFocus />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {publishers.filter(p => (p.title || "").toLowerCase().includes(publisherSearch.toLowerCase())).map(p => (
                                                    <div key={p.id || p.id || p._id} onClick={() => handlePublisherSelect(p)} className="px-3 py-2 text-sm hover:bg-primary/5 cursor-pointer text-gray-600 hover:text-primary transition-colors">{p.title}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {isPublisherDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsPublisherDropdownOpen(false)}></div>}
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
                                                    {categories.map(c => <option key={c.id || c.id || c._id} value={c.id || c.id || c._id}>{c.title || c.categorytitle}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Title*</label>
                                                <input type="text" value={newPubData.title} onChange={(e) => { const val = e.target.value; setNewPubData({ ...newPubData, title: val, slug: val.toLowerCase().replace(/\s+/g, '-') }); }} className="theme-input w-full bg-white text-xs" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label><input type="email" value={newPubData.email} onChange={(e) => setNewPubData({ ...newPubData, email: e.target.value })} className="theme-input w-full bg-white text-xs" /></div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Image</label>
                                                <div className="flex items-center gap-2">
                                                    <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-all">
                                                        <Upload size={12} /> {newPubImage ? "Changed" : "Upload"}
                                                        <input type="file" className="hidden" onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (!file) return;
                                                            if (validateImageFiles(file)) { setNewPubImage(file); setNewPubPreview(URL.createObjectURL(file)); }
                                                            else e.target.value = "";
                                                        }} />
                                                    </label>
                                                    {newPubPreview && <img src={newPubPreview} className="h-8 w-8 object-contain rounded border bg-white" alt="preview" />}
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
                                            <button type="button" onClick={() => setIsPubPanelOpen(false)} className="text-[10px] font-bold uppercase text-gray-400 px-4 hover:text-gray-600">Discard</button>
                                            <button type="button" disabled={savePublisherMutation.isPending} onClick={handleQuickPubSave} className="bg-primary text-white px-6 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50">
                                                {savePublisherMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save & Link Publisher
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 16. Meta Data */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Meta Title</label><div className="col-span-9"><input name="meta_title" value={formData.meta_title || ''} onChange={handleChange} className="theme-input w-full" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Meta Keywords</label><div className="col-span-9"><input name="meta_keywords" value={formData.meta_keywords || ''} onChange={handleChange} className="theme-input w-full" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Meta Description</label><div className="col-span-9"><textarea name="meta_description" value={formData.meta_description || ''} onChange={handleChange} className="theme-input w-full h-24 p-2 resize-none" /></div></div>

                        {/* 17. Flags */}
                        {[{ label: "Active", name: "active" }, { label: "Recommended", name: "recommended" }].map((item) => (
                            <div key={item.name} className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                                <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">{item.label}</label>
                                <div className="col-span-9 flex gap-6">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name={item.name} value="active" checked={formData[item.name] === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active</label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name={item.name} value="inactive" checked={formData[item.name] === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive</label>
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4 mt-4 font-montserrat">
                            <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-tight pt-1">Upcoming Book</label>
                            <div className="col-span-9">
                                <div className="flex gap-6 mb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body text-text-main"><input type="radio" name="upcoming" value="active" onChange={handleChange} checked={formData.upcoming === "active"} className="accent-primary w-4 h-4" /> active</label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body text-text-main"><input type="radio" name="upcoming" value="inactive" onChange={(e) => { handleChange(e); setFormData(prev => ({ ...prev, upcoming_date: '' })); }} checked={formData.upcoming === "inactive"} className="accent-primary w-4 h-4" /> inactive</label>
                                </div>
                                {formData.upcoming === 'active' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300 p-3 bg-accent/10 rounded border border-accent/30 mt-2">
                                        <label className="block text-[10px] text-text-main font-bold mb-1 uppercase tracking-wider">Expected Launch Date</label>
                                        <div className="flex items-center gap-3">
                                            <input type="date" name="upcoming_date" value={formData.upcoming_date} onChange={handleChange} className="theme-input w-40 border-gray-300 focus:border-primary bg-white" />
                                            <span className="text-text-muted text-[11px] italic font-body">* Currently set for launch on: {formData.upcoming_date || 'Not set'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-4 mt-4 font-montserrat">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight pt-1">New release</label>
                            <div className="col-span-9">
                                <div className="flex gap-6 mb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body text-text-main">
                                        <input type="radio" name="new_release" value="active" onChange={handleNewReleaseChange} checked={formData.new_release === "active"} className="accent-primary w-4 h-4" /> active
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-body text-text-main">
                                        <input type="radio" name="new_release" value="inactive" onChange={handleNewReleaseChange} checked={formData.new_release === "inactive"} className="accent-primary w-4 h-4" /> inactive
                                    </label>
                                </div>
                                {formData.new_release === 'active' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300 p-3 bg-blue-50/50 rounded border border-blue-100">
                                        <label className="block text-[10px] text-primary font-bold mb-1 uppercase">SELECT START DATE</label>
                                        <div className="flex items-center gap-3">
                                            <input type="date" value={userSelectedDate} onChange={(e) => setUserSelectedDate(e.target.value)} className="theme-input w-40 border-primary/50 bg-white" />
                                            <span className="text-gray-400 text-xs font-bold">+ {arrivalDays} Days (Settings)</span>
                                        </div>
                                        <div className="mt-2 text-[11px] text-gray-500 font-body">Book will be in "New Arrivals" until: <span className="font-bold text-black bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200">{formData.new_release_until || '...'}</span></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Exclusive</label>
                            <div className="col-span-9 flex gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-body"><input type="radio" name="exclusive" value="active" checked={formData.exclusive === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-body"><input type="radio" name="exclusive" value="inactive" checked={formData.exclusive === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive</label>
                            </div>
                        </div>

                        {formData.exclusive === 'active' && (
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Exclusive For</label>
                            <div className="col-span-9">
                                <select name="exclusive_for" value={formData.exclusive_for} onChange={handleChange} className="theme-input w-56">
                                    <option value="all">All Customers</option>
                                    <option value="ordered">Ordered Customers Only</option>
                                    <option value="members">Bagchee Members Only</option>
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">Controls who can see this exclusive title</p>
                            </div>
                        </div>
                        )}

                        {/* 18. Ship & Search */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Ship Days</label><div className="col-span-9"><input type="number" name="ship_days" value={formData.ship_days || ''} onChange={handleChange} className="theme-input w-32" placeholder="e.g. 7" min="0" /></div></div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4"><label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase">Deliver Days</label><div className="col-span-9"><input type="number" name="deliver_days" value={formData.deliver_days || ''} onChange={handleChange} className="theme-input w-32" placeholder="e.g. 5" min="0" /></div></div>

                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-12">
                            <label className="col-span-3 text-right text-[11px] font-bold text-gray-500 uppercase pt-2">Search Text</label>
                            <div className="col-span-9 border rounded overflow-hidden"><JoditEditor value={searchText} config={config} onBlur={newContent => setSearchText(newContent)} /></div>
                        </div>

                        {/* --- 19. FINAL ACTION BUTTONS --- */}
                        <div className="flex justify-center gap-4 pt-10 pb-6 border-t mt-8">
                            <button onClick={(e) => handleSubmit(e, 'stay')} disabled={updateBookMutation.isPending} className="flex items-center bg-primary text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50">
                                {updateBookMutation.isPending ? "Updating..." : <><Check size={16} className="mr-2" /> Update</>}
                            </button>
                            <button onClick={(e) => handleSubmit(e, 'back')} disabled={updateBookMutation.isPending} className="flex items-center bg-gray-800 text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:bg-gray-900 active:scale-95 disabled:opacity-50">
                                Update & Back
                            </button>
                            <button onClick={() => navigate('/admin/books')} disabled={updateBookMutation.isPending} className="flex items-center bg-white border border-gray-300 text-gray-600 px-8 py-2.5 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-50">
                                <X size={16} className="mr-2" /> Cancel
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                .theme-input { border: 1px solid #d1d5db; border-radius: 4px; padding: 8px 12px; font-size: 13px; outline: none; transition: border-color 0.2s; }
                .theme-input:focus { border-color: #008DDA; box-shadow: 0 0 0 2px rgba(0, 141, 218, 0.1); }

                /* 🟢 NAYI CSS: Number input ke up-down arrows (spinners) hatane ke liye */
                /* Chrome, Safari, Edge, Opera ke liye */
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                /* Firefox ke liye */
                input[type="number"] {
                  -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
};

export default EditBook;