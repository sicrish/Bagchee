import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Upload, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';

import toast from 'react-hot-toast';

const EditActor = () => {
    const { id } = useParams(); // URL se ID nikalne ke liye
    const navigate = useNavigate();
    const editor = useRef(null);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        origin: '',
    });

    const [profile, setProfile] = useState('');

    // 🟢 Step 1: Existing Data Load karein
    useEffect(() => {
        const fetchActorData = async () => {
            try {
                const API_URL = process.env.REACT_APP_API_URL;
                const res = await axios.get(`${API_URL}/actors/get/${id}`);

                if (res.data.status) {
                    const actor = res.data.data;
                    setFormData({
                        first_name: actor.firstName || '',
                        last_name: actor.lastName || '',
                        origin: actor.origin || '',
                    });
                    setProfile(actor.profile || '');
                    if (actor.picture) {

                        setPreviewImage(`${API_URL}${actor.picture}`);
                    } // Backend image URL
                }
            } catch (error) {
                console.error(error);
                toast.error("Error loading actor data");
                navigate('/admin/actors');
            } finally {
                setFetching(false);
            }
        };
        if (id) fetchActorData();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🟢 Step 2: Update Logic
    const handleSubmit = async (e, actionType) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Updating actor...");

        try {
            const data = new FormData();
            data.append('first_name', formData.first_name);
            data.append('last_name', formData.last_name);
            data.append('origin', formData.origin);
            data.append('profile', profile);

            if (imageFile) {
                data.append('picture', imageFile);
            }

            const API_URL = process.env.REACT_APP_API_URL;
            // UPDATE ke liye Patch method
            const res = await axios.patch(`${API_URL}/actors/update/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.status) {
                toast.success("Actor Updated Successfully! ✨", { id: toastId });
                if (actionType === 'back') {
                    navigate('/admin/actors');
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Update failed", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const config = useMemo(() => ({
        readonly: false,
        height: 300,
        theme: "default",
        placeholder: 'Edit actor profile details...',
        buttons: [
            'source', 'save', 'print', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
            'superscript', 'subscript', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
        ],
    }), []);

    if (fetching) return (
        <div className="h-screen flex justify-center items-center bg-cream-50">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    return (
        <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">

            {/* 🔵 Header Bar: bg-primary (#008DDA) */}
            <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
                <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
                    Edit Actor: <span className="text-cream-200">{formData.first_name}</span>
                </h1>
            </div>

            <div className="max-w-6xl mx-auto p-6 mt-4">
                <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

                    <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
                        <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Update Information</h2>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* First Name */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">First name*</label>
                            <div className="col-span-9">
                                <input name="first_name" value={formData.first_name} onChange={handleChange} className="theme-input w-full" />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Last name</label>
                            <div className="col-span-9">
                                <input name="last_name" value={formData.last_name} onChange={handleChange} className="theme-input w-full" />
                            </div>
                        </div>

                        {/* Picture Upload & Preview */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Picture</label>
                            <div className="col-span-9 flex items-center gap-6">

                                {/* 🟢 SMART PREVIEW LOGIC */}
                                {(imageFile || previewImage) && (
                                    <div className="relative group">
                                        <img
                                            // 🟢 FIX: Agar nayi file chuni hai to uska temporary preview dikhao, warna database wali photo
                                            src={imageFile ? URL.createObjectURL(imageFile) : previewImage}
                                            alt="Actor Preview"
                                            className="w-16 h-16 object-cover rounded border border-cream-200 shadow-sm transition-transform hover:scale-105"
                                            // 💡 Memory Leak se bachne ke liye cleanup
                                            onLoad={() => { if (imageFile) URL.revokeObjectURL(URL.createObjectURL(imageFile)) }}
                                        />

                                        {/* Agar naya selection cancel karna ho */}
                                        {imageFile && (
                                            <button
                                                type="button"
                                                onClick={() => setImageFile(null)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md active:scale-90"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <input
                                        type="file"
                                        id="picture"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) setImageFile(file);
                                        }}
                                        accept="image/*"
                                    />

                                    <div className="flex items-center gap-3">
                                        <label
                                            htmlFor="picture"
                                            className="cursor-pointer bg-cream-100 border border-cream-200 px-4 py-1.5 rounded text-[11px] font-bold uppercase hover:bg-cream-200 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap active:scale-95"
                                        >
                                            <Upload size={14} />
                                            {previewImage || imageFile ? "Change picture" : "Upload picture"}
                                        </label>
                                    </div>

                                    {/* Nayi file ka naam dikhane ke liye badge */}
                                    {imageFile && (
                                        <div className="flex items-center gap-1 text-primary font-bold animate-pulse">
                                            <Check size={12} />
                                            <span className="text-[10px] italic truncate max-w-[120px]">{imageFile.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Origin */}
                        <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                            <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Origin</label>
                            <div className="col-span-9">
                                <input name="origin" value={formData.origin} onChange={handleChange} className="theme-input w-full" />
                            </div>
                        </div>

                        {/* Profile Editor */}
                        <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-6">
                            <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Profile</label>
                            <div className="col-span-9 border rounded-md overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/10">
                                <JoditEditor ref={editor} value={profile} config={config} onBlur={c => setProfile(c)} />
                            </div>
                        </div>

                        {/* --- ACTION BUTTONS --- */}
                        <div className="flex justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
                            <button onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Update changes
                            </button>

                            <button onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                                <RotateCcw size={14} /> Update & go back to list
                            </button>

                            <button type="button" onClick={() => navigate('/admin/actors')} className="bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm hover:bg-cream-50 active:scale-95 transition-all flex items-center gap-2">
                                <X size={14} className="text-red-600" /> Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                .theme-input { 
                    border: 1px solid #e6decd; 
                    border-radius: 4px; 
                    padding: 8px 14px; 
                    font-size: 13px; 
                    outline: none; 
                    transition: all 0.2s ease-in-out; 
                    background: #fffdf5;
                    font-family: 'Roboto', sans-serif;
                }
                .theme-input:focus { 
                    border-color: #008DDA; 
                    box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.15); 
                    background: white;
                }
            `}</style>
        </div>
    );
};

export default EditActor;