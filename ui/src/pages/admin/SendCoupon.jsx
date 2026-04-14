import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Ticket, Loader2, Users, ArrowLeft } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const SendCoupon = () => {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    couponId: '',
    emails: '',
    emailContent: '',
    sendToAll: false,
  });

  // Fetch all coupons for the dropdown
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/coupons/list?limit=200`);
        if (res.data.status) setCoupons(res.data.data || []);
      } catch {
        toast.error('Failed to load coupons');
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.couponId) return toast.error('Please select a coupon.');
    if (!formData.emailContent.replace(/<[^>]*>/g, '').trim()) return toast.error('Email content cannot be empty.');
    if (!formData.sendToAll && !formData.emails.trim()) return toast.error('Enter customer emails or check "Send to all".');

    setSending(true);
    const toastId = toast.loading('Sending emails...');
    try {
      const res = await axios.post(`${API_BASE_URL}/coupons/send`, {
        couponId: formData.couponId,
        emails: formData.emails,
        emailContent: formData.emailContent,
        sendToAll: formData.sendToAll,
      });
      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        setFormData({ couponId: '', emails: '', emailContent: '', sendToAll: false });
      } else {
        toast.error(res.data.msg || 'Failed to send', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Server Error', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const inputClass = `w-full border border-[#e6decd] rounded-[4px] px-3.5 py-2.5 text-[13px] outline-none transition-all bg-[#fffdf5] focus:bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,141,218,0.15)] font-body`;
  const labelClass = 'col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2.5';

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-16">

      {/* Header */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Ticket size={20} />
          <h1 className="text-base font-bold uppercase tracking-slick font-display">Send Coupon</h1>
        </div>
        <button onClick={() => navigate('/admin/coupons')} className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-montserrat font-bold uppercase transition-all">
          <ArrowLeft size={14} /> Back to Coupons
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 mt-4">
        <form onSubmit={handleSend} className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Coupon Email Configuration</h2>
          </div>

          <div className="p-8 space-y-6">

            {/* Coupon Dropdown */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-5">
              <label className={labelClass}>Coupons *</label>
              <div className="col-span-12 md:col-span-9">
                <select
                  value={formData.couponId}
                  onChange={(e) => setFormData({ ...formData, couponId: e.target.value })}
                  className={`${inputClass} appearance-none cursor-pointer font-bold text-primary`}
                  disabled={loadingCoupons}
                  required
                >
                  <option value="">{loadingCoupons ? 'Loading coupons...' : '-- Select a Coupon --'}</option>
                  {coupons.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title ? `${c.title} (${c.code})` : c.code}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1.5 italic">The coupon code will be included automatically in the email footer.</p>
              </div>
            </div>

            {/* Customer Emails */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-5">
              <label className={labelClass}>Customer email</label>
              <div className="col-span-12 md:col-span-9">
                <p className="text-[10px] text-gray-400 mb-1.5 italic">Note: Separate multiple customers with comma</p>
                <textarea
                  value={formData.emails}
                  onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                  disabled={formData.sendToAll}
                  rows={3}
                  className={`${inputClass} resize-none ${formData.sendToAll ? 'opacity-40 cursor-not-allowed' : ''}`}
                  placeholder="customer1@example.com, customer2@example.com"
                />
              </div>
            </div>

            {/* Email Content - Rich Text Editor */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-5">
              <label className={labelClass}>Email content</label>
              <div className="col-span-12 md:col-span-9">
                <div className="border border-[#e6decd] rounded overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.emailContent}
                    onChange={(val) => setFormData({ ...formData, emailContent: val })}
                    modules={quillModules}
                    className="bg-white"
                    style={{ minHeight: '220px' }}
                    placeholder="Write your email message here..."
                  />
                </div>
              </div>
            </div>

            {/* Send to all */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-5">
              <label className={labelClass}>Send to all customers</label>
              <div className="col-span-12 md:col-span-9 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendToAll"
                  checked={formData.sendToAll}
                  onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked, emails: '' })}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <label htmlFor="sendToAll" className="text-[13px] text-text-main cursor-pointer select-none flex items-center gap-2">
                  <Users size={14} className="text-primary" /> Send to all registered customers
                </label>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={sending}
                className="bg-primary text-white px-12 py-3 rounded font-bold text-[11px] uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 font-montserrat disabled:opacity-60"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default SendCoupon;
