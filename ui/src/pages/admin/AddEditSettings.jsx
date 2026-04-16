import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 Added React Query

const EditSettings = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Agar ID hai toh Update mode, nahi toh Add mode
    const isEdit = Boolean(id);
    const editor = useRef(null);
    const queryClient = useQueryClient(); // 🟢 Cache manage karne ke liye

    // 🟢 Flag to prevent data overwrite when typing
    const [isDataInitialized, setIsDataInitialized] = useState(false);

    // 🟢 State for all fields from Image 1 & 2
    const [formData, setFormData] = useState({
        sale_threshold: '',
        bestseller_threshold: '',
        member_discount: '',
        membership_cost: '',
        membership_cost_eur: '',
        membership_cart_price: '',
        new_arrival_time: '',
        free_shipping_over: '',
        order_accepted_promo: '',
        show_promo_over_usd: '',
        show_promo_over_eur: '',
        topbar_promotion: 'Yes',
        account_number: '',
        swift_code: '',
        beneficiary_name: '',
        bank_name: '',
        emails_copy: '',
        // Payment gateway mode
        payment_gateway_mode: 'deferred',
        // Per-currency wire transfer bank details
        bank_name_usd: '', bank_iban_usd: '', bank_bic_usd: '', bank_owner_usd: '',
        bank_name_eur: '', bank_iban_eur: '', bank_bic_eur: '', bank_owner_eur: '',
        bank_name_gbp: '', bank_iban_gbp: '', bank_bic_gbp: '', bank_owner_gbp: '',
    });

    const [topbarPromoText, setTopbarPromoText] = useState('');
    
    // 🚀 OPTIMIZATION 1: Fetch Existing Data with useQuery
    const { data: settingsData, isLoading: fetching, isError: settingsError } = useQuery({
        queryKey: ['settingsDetails', id],
        queryFn: async () => {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.get(`${API_URL}/settings/get/${id}`);
            if (!res.data.status) throw new Error("Failed to load settings data");
            return res.data.data;
        },
        enabled: isEdit, // Run only if editing an existing ID
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
        refetchOnWindowFocus: false, // Prevent background overwrite
    });

    // 🟢 1. Initialize Data ONLY ONCE
    useEffect(() => {
        if (isEdit && settingsData && !isDataInitialized) {
            setFormData({
                sale_threshold: settingsData.saleThreshold ?? settingsData.sale_threshold ?? '',
                bestseller_threshold: settingsData.bestSellerThreshold ?? settingsData.bestseller_threshold ?? '',
                member_discount: settingsData.memberDiscount ?? settingsData.member_discount ?? '',
                membership_cost: settingsData.membershipCartPrice ?? settingsData.membership_cost ?? '',
                membership_cost_eur: settingsData.membershipCartPriceEur ?? settingsData.membership_cost_eur ?? '',
                membership_cart_price: settingsData.membershipCartPriceInr ?? settingsData.membership_cart_price ?? '',
                new_arrival_time: settingsData.new_arrival_time || '',
                free_shipping_over: settingsData.freeShippingOver ?? settingsData.free_shipping_over ?? '',
                order_accepted_promo: settingsData.order_accepted_promo || '',
                show_promo_over_usd: settingsData.show_promo_over_usd || '',
                show_promo_over_eur: settingsData.show_promo_over_eur || '',
                topbar_promotion: (settingsData.topbarPromotion === true || settingsData.topbar_promotion === 'Yes') ? 'Yes' : 'No',
                account_number: settingsData.account_number || settingsData.bankIban || '',
                swift_code: settingsData.swift_code || settingsData.bankBic || '',
                beneficiary_name: settingsData.beneficiary_name || settingsData.bankOwner || '',
                bank_name: settingsData.bank_name || settingsData.bankName || '',
                emails_copy: settingsData.emails_copy || settingsData.emailsCopy || '',
                payment_gateway_mode: settingsData.paymentGatewayMode || settingsData.payment_gateway_mode || 'deferred',
                bank_name_usd: settingsData.bankNameUsd || '',
                bank_iban_usd: settingsData.bankIbanUsd || '',
                bank_bic_usd: settingsData.bankBicUsd || '',
                bank_owner_usd: settingsData.bankOwnerUsd || '',
                bank_name_eur: settingsData.bankNameEur || '',
                bank_iban_eur: settingsData.bankIbanEur || '',
                bank_bic_eur: settingsData.bankBicEur || '',
                bank_owner_eur: settingsData.bankOwnerEur || '',
                bank_name_gbp: settingsData.bankNameGbp || '',
                bank_iban_gbp: settingsData.bankIbanGbp || '',
                bank_bic_gbp: settingsData.bankBicGbp || '',
                bank_owner_gbp: settingsData.bankOwnerGbp || '',
            });
            setTopbarPromoText(settingsData.topbar_promotion_text || settingsData.topbarPromotionText || '');
           
            
            setIsDataInitialized(true); // Lock it!
        }
    }, [isEdit, settingsData, isDataInitialized]);

    // Fast handler using useCallback
    const handleChange = useCallback((e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    // 🚀 OPTIMIZATION 2: Update/Save Mutation
    const saveSettingsMutation = useMutation({
        mutationFn: async (payload) => {
            const API_URL = process.env.REACT_APP_API_URL;
            if (isEdit) {
                // Settings backend mostly uses PATCH, maintaining consistency
                const res = await axios.put(`${API_URL}/settings/update/${id}`, payload);
                return res.data;
            } else {
                const res = await axios.post(`${API_URL}/settings/save`, payload);
                return res.data;
            }
        }
    });

    // 🟢 2. Handle Submit
    const handleSubmit = (e, actionType) => {
        e.preventDefault();
        const toastId = toast.loading(isEdit ? "Updating settings..." : "Saving settings...");

        const payload = { 
            ...formData, 
            topbar_promotion_text: topbarPromoText,
           
        };

        saveSettingsMutation.mutate(payload, {
            onSuccess: (resData) => {
                if (resData.status) {
                    toast.success(isEdit ? "Settings updated!" : "Settings saved!", { id: toastId });
                    
                    if (isEdit) {
                        // Clear old cache so next time we get fresh data
                        queryClient.invalidateQueries({ queryKey: ['settingsDetails', id] });
                    }

                    if (actionType === 'back') {
                        navigate('/admin/settings');
                    }
                } else {
                    toast.error(resData.msg || "Operation failed", { id: toastId });
                }
            },
            onError: (error) => {
                toast.error(error.response?.data?.msg || "Operation failed", { id: toastId });
            }
        });
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

    // 🟢 Loader Full Screen for Edit Mode
    if (isEdit && (fetching || !isDataInitialized)) {
        return <div className="min-h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

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

                        {/* --- 🟢 Order Accepted Promo  --- */}
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

                        {/* ── Payment Gateway Mode ── */}
                        <div className="col-span-12 pt-6 pb-2">
                            <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest font-montserrat border-b border-gray-100 pb-2">
                                Credit Card / PayPal — Payment Mode
                            </h3>
                        </div>
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                            <label className={labelClass}>Payment gateway mode</label>
                            <div className="col-span-12 md:col-span-9 space-y-1">
                                <select name="payment_gateway_mode" value={formData.payment_gateway_mode} onChange={handleChange} className={inputClass}>
                                    <option value="deferred">Deferred Payment (admin reviews first, then sends payment link)</option>
                                    <option value="direct">Direct to Gateway (customer pays immediately)</option>
                                </select>
                                <p className="text-[10px] text-gray-400 font-semibold">
                                    Individual users can override this via the "Direct Payment Gateway" checkbox on their profile.
                                </p>
                            </div>
                        </div>

                        {/* ── Wire Transfer Bank Details ── */}
                        <div className="col-span-12 pt-6 pb-2">
                            <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest font-montserrat border-b border-gray-100 pb-2">
                                Wire Transfer Bank Details
                            </h3>
                        </div>

                        {/* USD */}
                        <div className="col-span-12 pb-1">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">USD (US Dollar)</p>
                        </div>
                        {[['bank_name_usd','Bank name'],['bank_iban_usd','Account / IBAN'],['bank_bic_usd','Swift / BIC'],['bank_owner_usd','Beneficiary name']].map(([name, label]) => (
                            <div key={name} className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                                <label className={labelClass}>{label}</label>
                                <div className="col-span-12 md:col-span-9">
                                    <input name={name} value={formData[name]} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        ))}

                        {/* EUR */}
                        <div className="col-span-12 pb-1 pt-4">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">EUR (Euro)</p>
                        </div>
                        {[['bank_name_eur','Bank name'],['bank_iban_eur','Account / IBAN'],['bank_bic_eur','Swift / BIC'],['bank_owner_eur','Beneficiary name']].map(([name, label]) => (
                            <div key={name} className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                                <label className={labelClass}>{label}</label>
                                <div className="col-span-12 md:col-span-9">
                                    <input name={name} value={formData[name]} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        ))}

                        {/* GBP */}
                        <div className="col-span-12 pb-1 pt-4">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">GBP (British Pound)</p>
                        </div>
                        {[['bank_name_gbp','Bank name'],['bank_iban_gbp','Account / IBAN'],['bank_bic_gbp','Swift / BIC'],['bank_owner_gbp','Beneficiary name']].map(([name, label]) => (
                            <div key={name} className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
                                <label className={labelClass}>{label}</label>
                                <div className="col-span-12 md:col-span-9">
                                    <input name={name} value={formData[name]} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        ))}

                        {/* --- ACTION BUTTONS --- */}
                        <div className="flex flex-wrap justify-center items-center gap-4 pt-8 border-t mt-10">
                            <button
                                type="button" 
                                onClick={(e) => handleSubmit(e, 'stay')} 
                                disabled={saveSettingsMutation.isPending}
                                className="bg-white border border-gray-300 px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saveSettingsMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="text-green-600" />}
                                Update changes
                            </button>

                            <button
                                type="button" 
                                onClick={(e) => handleSubmit(e, 'back')} 
                                disabled={saveSettingsMutation.isPending}
                                className="bg-white border border-gray-300 px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saveSettingsMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} className="text-primary" />}
                                Update and go back to list
                            </button>

                            <button
                                type="button" 
                                onClick={() => navigate('/admin/settings')}
                                disabled={saveSettingsMutation.isPending}
                                className="bg-white border border-gray-300 px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
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