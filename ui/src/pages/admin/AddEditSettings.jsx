import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Save } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditSettings = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Agar ID hai toh Update mode, nahi toh Add mode
    const isEdit = Boolean(id);
    const editor = useRef(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);

    // 🟢 State for all fields from Image 1 & 2
    const [formData, setFormData] = useState({
        sale_threshold: '',           // [cite: 5]
        bestseller_threshold: '',     // [cite: 8]
        member_discount: '',          // [cite: 12]
        membership_cost: '',          // [cite: 15]
        membership_cost_eur: '',      // [cite: 18]
        membership_cart_price: '',    // [cite: 22]
        new_arrival_time: '',         // [cite: 26]
        free_shipping_over: '',       // [cite: 29]
        order_accepted_promo: '',     // [cite: 32]
        show_promo_over_usd: '',      // [cite: 34]
        show_promo_over_eur: '',      // [cite: 38]
        show_promo_over_inr: '',      // [cite: 41]
        topbar_promotion: 'Yes',      // [cite: 43]
        account_number: '',           // [cite: 46]
        swift_code: '',               // [cite: 47]
        beneficiary_name: '',         // [cite: 57]
        bank_name: '',                // [cite: 59]
        emails_copy: ''               // [cite: 60]
    });

    const [topbarPromoText, setTopbarPromoText] = useState('');
    const [specialTopicsText, setSpecialTopicsText] = useState(''); // 🟢 New field for Special Topics

    // 🟢 1. Initialize Data for Edit Mode
    useEffect(() => {
        if (isEdit) {
            const fetchData = async () => {
                try {
                    const API_URL = process.env.REACT_APP_API_URL;
                    const res = await axios.get(`${API_URL}/settings/get/${id}`);
                    if (res.data.status) {
                        const d = res.data.data;
                        setFormData({ ...d });
                        setTopbarPromoText(d.topbar_promotion_text || '');
                        setSpecialTopicsText(d.special_topics || ''); // 🟢 Load Special Topics
                    }
                } catch (error) {
                    toast.error("Failed to load settings data");
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchData();
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🟢 2. Handle Submit (Add or Update)
    const handleSubmit = async (e, actionType) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading(isEdit ? "Updating settings..." : "Saving settings...");

        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const payload = { 
                ...formData, 
                topbar_promotion_text: topbarPromoText,
                special_topics: specialTopicsText // 🟢 Include Special Topics
            };

            let res;
            if (isEdit) {
                res = await axios.put(`${API_URL}/settings/update/${id}`, payload);
            } else {
                res = await axios.post(`${API_URL}/settings/save`, payload);
            }

            if (res.data.status) {
                toast.success(isEdit ? "Settings updated!" : "Settings saved!", { id: toastId });
                if (actionType === 'back') navigate('/admin/settings');
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Operation failed", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const config = useMemo(() => ({
        readonly: false,
        height: 300,
        theme: "default",
        placeholder: 'Enter topbar promotion text...',
        buttons: ['source', '|', 'bold', 'italic', 'underline', '|', 'font', 'fontsize', 'brush', 'align', 'undo', 'redo']
    }), []);

    // Tailwind Config Styles
    const inputClass = "w-full border border-gray-300 rounded-[4px] px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
    const labelClass = "col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

    if (initialLoading) return <div className="min-h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={32} /></div>;

    return (
        <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">

            {/* 🔵 Header Section */}
            <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between text-white font-display font-bold uppercase tracking-widest">
                {isEdit ? 'Edit Settings' : 'Add Settings'}
            </div>

            <div className="max-w-5xl mx-auto p-6 mt-4">
                <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

                    <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
                        <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Configuration Form</h2>
                    </div>

                    <div className="p-8 space-y-6">

                        {/* Fields from Image 1 (Single Column Layout) */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Sale threshold</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="sale_threshold" value={formData.sale_threshold} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Bestseller threshold</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="bestseller_threshold" value={formData.bestseller_threshold} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Member discount (%)</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="member_discount" value={formData.member_discount} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Membership cost</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="membership_cost" value={formData.membership_cost} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Membership cost eur</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="membership_cost_eur" value={formData.membership_cost_eur} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Membership cart price inr</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="membership_cart_price" value={formData.membership_cart_price} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Now arrival time</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="new_arrival_time" value={formData.new_arrival_time} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Free shipping over</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="free_shipping_over" value={formData.free_shipping_over} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        {/* --- 🟢 NEW FIELD: Order Accepted Promo  --- */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Order accepted promo</label>
                            <div className="col-span-12 md:col-span-9">
                                <select
                                    name="order_accepted_promo"
                                    value={formData.order_accepted_promo}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value="">Select Order accepted promo</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Show promo over usd</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="show_promo_over_usd" value={formData.show_promo_over_usd} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Show promo over eur</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="show_promo_over_eur" value={formData.show_promo_over_eur} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Show promo over inr</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="show_promo_over_inr" value={formData.show_promo_over_inr} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Topbar promotion</label>
                            <div className="col-span-12 md:col-span-9">
                                <select name="topbar_promotion" value={formData.topbar_promotion} onChange={handleChange} className={inputClass}>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>

                        {/* Rich Text Editor Section */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-6">
                            <label className={labelClass}>Topbar promotion text</label>
                            <div className="col-span-12 md:col-span-9 border rounded-md overflow-hidden shadow-sm">
                                <JoditEditor
                                    ref={editor}
                                    value={topbarPromoText}
                                    config={config}
                                    onBlur={c => setTopbarPromoText(c)}
                                />
                            </div>
                        </div>

                        {/* 🟢 NEW FIELD: Special Topics Rich Text Editor */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-6">
                            <label className={labelClass}>Special Topics</label>
                            <div className="col-span-12 md:col-span-9 border rounded-md overflow-hidden shadow-sm">
                                <JoditEditor
                                    value={specialTopicsText}
                                    config={{
                                        ...config,
                                        placeholder: 'Enter special topics content for categories page...'
                                    }}
                                    onBlur={c => setSpecialTopicsText(c)}
                                />
                                <p className="text-[10px] text-blue-500 mt-2 px-2 font-bold uppercase">
                                    This content will be displayed on the "Browse All Categories" page
                                </p>
                            </div>
                        </div>

                        {/* Fields from Image 2 */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Account number</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="account_number" value={formData.account_number} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Swift code</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="swift_code" value={formData.swift_code} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Benificery name</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="beneficiary_name" value={formData.beneficiary_name} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Bank name</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="bank_name" value={formData.bank_name} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-start">
                            <label className={labelClass}>Emails copy</label>
                            <div className="col-span-12 md:col-span-9">
                                <input name="emails_copy" value={formData.emails_copy} onChange={handleChange} className={inputClass} placeholder="malaykbagchee@gmail.com,email@bagchee.com" />
                                <p className="text-[10px] text-red-500 mt-1 font-bold  uppercase ">Separate the emails with comma</p>
                            </div>
                        </div>

                        {/* --- ACTION BUTTONS (As per Image 2 footer) --- */}
                        <div className="flex flex-wrap justify-center items-center gap-4 pt-8 border-t mt-10">
                            <button
                                type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={loading}
                                className="bg-white border border-gray-300 px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="text-green-600" />}
                                Update changes
                            </button>

                            <button
                                type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={loading}
                                className="bg-white border border-gray-300 px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={14} className="text-primary" />
                                Update and go back to list
                            </button>

                            <button
                                type="button" onClick={() => navigate('/admin/settings')}
                                className="bg-white border border-gray-300 px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                <X size={14} className="text-red-600" />
                                Cancel
                            </button>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSettings;