import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Users, Mail, Loader2, ArrowLeft, FileText, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

// ─── Pre-built Email Templates ───
const EMAIL_TEMPLATES = [
  {
    name: 'Blank',
    subject: '',
    body: ''
  },
  {
    name: 'Coupon / Promo Code',
    subject: 'Exclusive Offer Just for You!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:28px; margin-bottom:5px;">MEMBER ONLY <span style="color:#e53935;">OFFER</span></h1>
  <div style="background:#e53935; border-radius:12px; padding:30px; margin:20px auto; max-width:480px; color:#fff;">
    <p style="font-size:22px; font-weight:bold; margin:0;">CELEBRATE</p>
    <p style="font-size:16px; margin:5px 0;">our new collection and get</p>
    <p style="font-size:52px; font-weight:bold; margin:10px 0; font-style:italic;">10% off</p>
    <p style="font-size:16px; margin-top:15px;">Use promo code</p>
    <p style="display:inline-block; border:2px dashed #fff; padding:8px 24px; font-size:24px; font-weight:bold; letter-spacing:3px; margin:8px 0;">BAGCHEE10</p>
    <p style="font-size:16px; margin-top:8px;">at checkout</p>
  </div>
  <p style="color:#666; font-size:13px; margin-top:15px;">Valid for a limited time only. Cannot be combined with other offers.</p>
</div>`
  },
  {
    name: 'New Arrivals',
    subject: 'New Arrivals This Week at Bagchee!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:28px; margin-bottom:10px;">New Arrivals</h1>
  <p style="color:#666; font-size:15px; line-height:1.6; max-width:480px; margin:0 auto 25px;">
    Discover our latest collection of handpicked Indian books. From timeless classics to contemporary masterpieces, find your next great read.
  </p>
  <div style="background:#f8f4eb; border-radius:12px; padding:25px; margin:0 auto; max-width:480px;">
    <p style="font-size:18px; color:#0B2F3A; font-weight:bold; margin:0 0 8px;">This Week's Highlights</p>
    <p style="color:#666; font-size:14px; margin:0;">Browse our freshly added titles across Religion & Spirituality, History, Art & Architecture, and more.</p>
  </div>
  <div style="margin-top:25px;">
    <a href="https://ui-production-cf27.up.railway.app/new-arrivals" style="display:inline-block; background:#008DDA; color:#fff; text-decoration:none; padding:14px 36px; font-size:15px; font-weight:bold; border-radius:8px;">Browse New Arrivals</a>
  </div>
</div>`
  },
  {
    name: 'Sale / Discount',
    subject: 'Sale Today - Up to 25% Off at Bagchee!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#e53935; font-size:36px; font-weight:bold; margin-bottom:5px;">SALE TODAY</h1>
  <p style="color:#0B2F3A; font-size:20px; margin:0 0 20px;">Up to <strong>25% OFF</strong> on selected titles</p>
  <div style="background:linear-gradient(135deg, #e53935, #c62828); border-radius:12px; padding:30px; margin:0 auto; max-width:480px; color:#fff;">
    <p style="font-size:48px; font-weight:bold; margin:0;">25% OFF</p>
    <p style="font-size:16px; margin:10px 0 0;">on hundreds of books across all categories</p>
  </div>
  <div style="margin-top:25px;">
    <a href="https://ui-production-cf27.up.railway.app/sale" style="display:inline-block; background:#e53935; color:#fff; text-decoration:none; padding:14px 36px; font-size:15px; font-weight:bold; border-radius:8px;">Shop the Sale</a>
  </div>
  <p style="color:#999; font-size:12px; margin-top:20px;">Offer valid while stocks last. Free delivery worldwide on orders over $50.</p>
</div>`
  },
  {
    name: 'Membership',
    subject: 'Join Bagchee Membership - Save 10% Every Day!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:28px; margin-bottom:10px;">Bagchee Membership</h1>
  <p style="color:#666; font-size:15px; line-height:1.6; max-width:480px; margin:0 auto 25px;">
    Become a Bagchee member and enjoy exclusive benefits on every purchase.
  </p>
  <div style="background:#008DDA; border-radius:12px; padding:30px; margin:0 auto; max-width:480px; color:#fff;">
    <p style="font-size:42px; font-weight:bold; margin:0;">10% OFF</p>
    <p style="font-size:18px; margin:8px 0;">on every order, every day</p>
    <p style="font-size:14px; opacity:0.9; margin-top:15px;">Plus free priority shipping, early access to new arrivals, and exclusive member-only deals.</p>
  </div>
  <div style="margin-top:25px;">
    <a href="https://ui-production-cf27.up.railway.app/membership" style="display:inline-block; background:#008DDA; color:#fff; text-decoration:none; padding:14px 36px; font-size:15px; font-weight:bold; border-radius:8px;">Become a Member</a>
  </div>
</div>`
  },
  {
    name: 'Newsletter / Weekly Update',
    subject: 'Your Weekly Book Digest from Bagchee',
    body: `<div style="padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:24px; text-align:center; margin-bottom:20px;">Your Weekly Book Digest</h1>
  <p style="color:#666; font-size:15px; line-height:1.7;">
    Dear Reader,
  </p>
  <p style="color:#666; font-size:15px; line-height:1.7;">
    Here's what's new at Bagchee this week. We've added exciting new titles and have some special recommendations just for you.
  </p>
  <div style="border-left:4px solid #008DDA; padding:15px 20px; background:#f0f8ff; margin:20px 0; border-radius:0 8px 8px 0;">
    <p style="color:#0B2F3A; font-weight:bold; margin:0 0 5px;">Editor's Pick of the Week</p>
    <p style="color:#666; font-size:14px; margin:0;">Add your recommended book title and description here.</p>
  </div>
  <p style="color:#666; font-size:15px; line-height:1.7;">
    Happy reading!<br/>
    <strong>The Bagchee Team</strong>
  </p>
</div>`
  }
];

const SendEmail = () => {
  const navigate = useNavigate();
  const editor = useRef(null);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Blank');
  const [audience, setAudience] = useState('subscribers');
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const editorConfig = useMemo(() => ({
    height: 400,
    placeholder: 'Compose your email content here...',
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'link', '|',
      'align', '|',
      'hr', 'table', '|',
      'undo', 'redo', '|',
      'fullsize'
    ],
    removeButtons: ['file', 'video'],
    showXPathInStatusbar: false,
    toolbarAdaptive: false,
  }), []);

  // Fetch recipient count when audience changes
  useEffect(() => {
    const fetchCount = async () => {
      setCountLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/email-campaign/recipients-count?audience=${audience}`);
        if (res.data.status) {
          setRecipientCount(res.data.count);
        }
      } catch {
        setRecipientCount(0);
      } finally {
        setCountLoading(false);
      }
    };
    fetchCount();
  }, [audience, API_BASE_URL]);

  // Load template into editor
  const handleLoadTemplate = () => {
    const tmpl = EMAIL_TEMPLATES.find(t => t.name === selectedTemplate);
    if (!tmpl) return;
    if (tmpl.name === 'Blank') {
      setSubject('');
      setBody('');
      return;
    }
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    toast.success(`"${tmpl.name}" template loaded`);
  };

  // Send test email
  const handleSendTest = async () => {
    if (!testEmail.trim()) return toast.error('Please enter a test email address.');
    if (!subject.trim()) return toast.error('Please enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Please compose an email body.');

    setTestLoading(true);
    const toastId = toast.loading(`Sending test to ${testEmail}...`);

    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send-test`, {
        subject: subject.trim(),
        body,
        testEmail: testEmail.trim()
      });

      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
      } else {
        toast.error(res.data.msg || 'Failed to send test', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send test email', { id: toastId });
    } finally {
      setTestLoading(false);
    }
  };

  // Send campaign
  const handleSend = async () => {
    if (!subject.trim()) return toast.error('Please enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Please compose an email body.');
    if (recipientCount === 0) return toast.error('No recipients found for selected audience.');

    const confirmed = window.confirm(
      `Send this email to ${recipientCount.toLocaleString()} recipient(s) (${audience})?\n\nSubject: ${subject}`
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading(`Sending to ${recipientCount.toLocaleString()} recipients...`);

    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send`, {
        subject: subject.trim(),
        body,
        audience
      });

      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        setSubject('');
        setBody('');
      } else {
        toast.error(res.data.msg || 'Failed to send', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send campaign', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const audienceOptions = [
    { value: 'subscribers', label: 'Newsletter Subscribers', desc: 'People who subscribed to newsletter' },
    { value: 'customers', label: 'Registered Customers', desc: 'All registered users on the platform' },
    { value: 'all', label: 'Everyone', desc: 'Both subscribers and customers (deduplicated)' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/newsletter-subs')}
          className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
            <Mail size={22} className="text-primary" /> Send Email Campaign
          </h1>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">Compose and send emails to your audience</p>
        </div>
      </div>

      <div className="max-w-4xl">

        {/* Email Template Selector */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            <FileText size={13} className="inline mr-1 -mt-0.5" /> Email Template
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat bg-white cursor-pointer"
            >
              {EMAIL_TEMPLATES.map((tmpl) => (
                <option key={tmpl.name} value={tmpl.name}>{tmpl.name}</option>
              ))}
            </select>
            <button
              onClick={handleLoadTemplate}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm transition-all active:scale-95 shadow-sm"
            >
              Load
            </button>
          </div>
        </div>

        {/* Audience Selector */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3 block">
            Select Audience
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {audienceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAudience(opt.value)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${audience === opt.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className={audience === opt.value ? 'text-primary' : 'text-gray-400'} />
                  <span className={`text-sm font-bold font-montserrat ${audience === opt.value ? 'text-primary' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Recipient Count Badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-montserrat">Recipients:</span>
            {countLoading ? (
              <Loader2 size={14} className="animate-spin text-primary" />
            ) : (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full font-montserrat">
                {recipientCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Subject Line */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. New Arrivals This Week at Bagchee!"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat"
          />
        </div>

        {/* Email Body Editor */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Content
          </label>
          <div className="border rounded-lg overflow-hidden">
            <JoditEditor
              ref={editor}
              value={body}
              config={editorConfig}
              onBlur={(newContent) => setBody(newContent)}
            />
          </div>
        </div>

        {/* Test Email */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            <FlaskConical size={13} className="inline mr-1 -mt-0.5" /> Test Email
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Send a preview to yourself before sending to all recipients</p>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test email address"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat"
            />
            <button
              onClick={handleSendTest}
              disabled={testLoading}
              className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
            >
              {testLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Sending...</>
              ) : (
                <><FlaskConical size={14} /> Send Test</>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg shadow-md font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Sending...</>
            ) : (
              <><Send size={16} /> Send Campaign</>
            )}
          </button>

          <button
            onClick={() => navigate('/admin/newsletter-subs')}
            className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-montserrat font-bold text-sm transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmail;
