import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Ticket, Loader2, Users, ArrowLeft, Eye, X,
  Mail, ShoppingBag, Star
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const RECIPIENT_OPTIONS = [
  {
    value: 'manual',
    label: 'Specific Emails',
    icon: Mail,
    desc: 'Enter email addresses manually',
  },
  {
    value: 'all',
    label: 'All Customers',
    icon: Users,
    desc: 'All registered non-guest users',
  },
  {
    value: 'ordered',
    label: 'Customers with Orders',
    icon: ShoppingBag,
    desc: 'Users who have placed at least one order',
  },
  {
    value: 'members',
    label: 'Members Only',
    icon: Star,
    desc: 'Active Bagchee members',
  },
];

const buildPreviewHtml = (coupon, emailContent) => {
  const validTill = coupon?.validTo
    ? new Date(coupon.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  return `
    <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:#F7EEDD;padding:40px 0;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);border:1px solid #e6decd;">
        <div style="background-color:#008DDA;padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Bagchee</h1>
          <p style="color:#fff;margin-top:5px;opacity:0.9;font-size:13px;">Your Favorite Bookstore</p>
        </div>
        <div style="padding:10px 30px 30px;">
          ${emailContent || '<p style="color:#888;font-style:italic;">No content written yet.</p>'}
        </div>
        <div style="background:#fffdf5;padding:16px 30px;text-align:center;border-top:1px solid #e6decd;">
          <p style="font-size:13px;color:#4A6fa5;margin:0;">
            Use code <strong style="color:#008DDA;letter-spacing:2px;font-size:16px;">${coupon?.code || '—'}</strong> at checkout.
          </p>
          <p style="font-size:12px;color:#888;margin:6px 0 0;">Valid till ${validTill}</p>
          <a href="https://bagchee.com" style="display:inline-block;margin-top:14px;background:#008DDA;color:#fff;text-decoration:none;padding:10px 28px;font-size:13px;font-weight:bold;border-radius:6px;">Shop Now</a>
          <p style="font-size:11px;color:#9ca3af;margin-top:16px;margin-bottom:0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

const PreviewModal = ({ coupon, emailContent, onClose, onConfirmSend, sending }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
      {/* Modal header */}
      <div className="flex items-center justify-between p-5 border-b border-cream-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-primary" />
          <h3 className="font-display font-bold text-base text-text-main uppercase tracking-wide">Email Preview</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Preview content */}
      <div className="p-4">
        <p className="text-xs text-text-muted italic mb-3 font-montserrat text-center">
          This is how the email will appear to recipients.
        </p>
        <div
          className="border border-gray-200 rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: buildPreviewHtml(coupon, emailContent) }}
        />
      </div>

      {/* Modal footer */}
      <div className="flex items-center justify-end gap-3 p-5 border-t border-cream-200 sticky bottom-0 bg-white">
        <button
          onClick={onClose}
          className="px-6 py-2.5 border border-cream-200 rounded text-[11px] font-bold uppercase font-montserrat text-text-muted hover:bg-cream-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onConfirmSend}
          disabled={sending}
          className="bg-primary text-white px-8 py-2.5 rounded font-bold text-[11px] uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 font-montserrat disabled:opacity-60"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? 'Sending…' : 'Confirm & Send'}
        </button>
      </div>
    </div>
  </div>
);

const SendCoupon = () => {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    couponId: '',
    recipientType: 'manual',
    emails: '',
    emailContent: '',
  });

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

  const selectedCoupon = coupons.find(c => String(c.id) === String(formData.couponId)) || null;

  const validateForm = () => {
    if (!formData.couponId) { toast.error('Please select a coupon.'); return false; }
    if (!formData.emailContent.replace(/<[^>]*>/g, '').trim()) { toast.error('Email content cannot be empty.'); return false; }
    if (formData.recipientType === 'manual' && !formData.emails.trim()) { toast.error('Enter at least one customer email.'); return false; }
    return true;
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowPreview(true);
  };

  const handleSend = async () => {
    setSending(true);
    const toastId = toast.loading('Sending emails…');
    try {
      const res = await axios.post(`${API_BASE_URL}/coupons/send`, {
        couponId: formData.couponId,
        recipientType: formData.recipientType,
        emails: formData.emails,
        emailContent: formData.emailContent,
      });
      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        setShowPreview(false);
        setFormData({ couponId: '', recipientType: 'manual', emails: '', emailContent: '' });
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
    <>
      {showPreview && (
        <PreviewModal
          coupon={selectedCoupon}
          emailContent={formData.emailContent}
          onClose={() => setShowPreview(false)}
          onConfirmSend={handleSend}
          sending={sending}
        />
      )}

      <div className="bg-cream-50 min-h-screen font-body text-text-main pb-16">

        {/* Header */}
        <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Ticket size={20} />
            <h1 className="text-base font-bold uppercase tracking-slick font-display">Send Coupon</h1>
          </div>
          <button
            onClick={() => navigate('/admin/coupons')}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-montserrat font-bold uppercase transition-all"
          >
            <ArrowLeft size={14} /> Back to Coupons
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-6 mt-4">
          <form onSubmit={handlePreview} className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

            <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Coupon Email Configuration</h2>
            </div>

            <div className="p-8 space-y-6">

              {/* Coupon Dropdown */}
              <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-5">
                <label className={labelClass}>Coupon *</label>
                <div className="col-span-12 md:col-span-9">
                  <select
                    value={formData.couponId}
                    onChange={(e) => setFormData({ ...formData, couponId: e.target.value })}
                    className={`${inputClass} appearance-none cursor-pointer font-bold text-primary`}
                    disabled={loadingCoupons}
                    required
                  >
                    <option value="">{loadingCoupons ? 'Loading coupons…' : '— Select a Coupon —'}</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title ? `${c.title} (${c.code})` : c.code}
                      </option>
                    ))}
                  </select>
                  {selectedCoupon && (
                    <p className="text-[10px] text-gray-400 mt-1.5 italic">
                      Code: <strong className="text-primary">{selectedCoupon.code}</strong>
                      {selectedCoupon.validTo && ` · Valid till ${new Date(selectedCoupon.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Recipient Type */}
              <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-5">
                <label className={`${labelClass} mt-0`}>Recipients *</label>
                <div className="col-span-12 md:col-span-9">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RECIPIENT_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
                      const active = formData.recipientType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData({ ...formData, recipientType: value, emails: '' })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all duration-200 ${
                            active
                              ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                              : 'border-cream-200 bg-cream-50 text-text-muted hover:border-primary/40 hover:text-primary/70'
                          }`}
                        >
                          <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                          <span className="text-[10px] font-bold uppercase font-montserrat leading-tight">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    {RECIPIENT_OPTIONS.find(o => o.value === formData.recipientType)?.desc}
                  </p>
                </div>
              </div>

              {/* Manual Emails — shown only when recipient type is manual */}
              {formData.recipientType === 'manual' && (
                <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-5">
                  <label className={labelClass}>Email addresses *</label>
                  <div className="col-span-12 md:col-span-9">
                    <p className="text-[10px] text-gray-400 mb-1.5 italic">Separate multiple addresses with a comma</p>
                    <textarea
                      value={formData.emails}
                      onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="customer1@example.com, customer2@example.com"
                    />
                  </div>
                </div>
              )}

              {/* Email Content */}
              <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-5">
                <label className={labelClass}>Email content *</label>
                <div className="col-span-12 md:col-span-9">
                  <div className="border border-[#e6decd] rounded overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={formData.emailContent}
                      onChange={(val) => setFormData({ ...formData, emailContent: val })}
                      modules={quillModules}
                      className="bg-white"
                      style={{ minHeight: '220px' }}
                      placeholder="Write your email message here…"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 italic">
                    The coupon code and validity will be appended automatically in the email footer.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-primary text-white px-10 py-3 rounded font-bold text-[11px] uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 font-montserrat"
                >
                  <Eye size={15} /> Preview & Send
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SendCoupon;
