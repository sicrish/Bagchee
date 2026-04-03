import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Users, Mail, Loader2, ArrowLeft, FileText, FlaskConical, Clock, Trash2, Package, X, PlusCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import JoditEditor from '../../components/admin/LazyJoditEditor';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../../utils/imageUrl';

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

const AUDIENCE_OPTIONS = [
  { key: 'subscribers', label: 'All subscribers' },
  { key: 'members', label: 'All members' },
  { key: 'purchasers', label: 'All with purchase' },
  { key: 'categories', label: 'Categories subscribers' },
  { key: 'specific', label: 'Selected subscribers' },
];

const SendEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editor = useRef(null);
  const preselectedEmails = location.state?.selectedEmails || [];

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Blank');
  const [audience, setAudience] = useState(preselectedEmails.length > 0 ? ['specific'] : ['subscribers']);
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);

  // Product picker
  const [productIdsInput, setProductIdsInput] = useState('');
  const [pickedProducts, setPickedProducts] = useState([]);
  const [productFetchLoading, setProductFetchLoading] = useState(false);

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
    if (audience.length === 0) {
      setRecipientCount(0);
      return;
    }
    const fetchCount = async () => {
      setCountLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/email-campaign/recipients-count?audience=${audience.join(',')}`);
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

  // Fetch scheduled emails
  useEffect(() => {
    const fetchScheduled = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/email-campaign/scheduled`);
        if (res.data.status) {
          setScheduledEmails(res.data.data);
        }
      } catch {
        // ignore
      }
    };
    fetchScheduled();
  }, [API_BASE_URL]);

  const toggleAudience = (key) => {
    setAudience(prev =>
      prev.includes(key)
        ? prev.filter(a => a !== key)
        : [...prev, key]
    );
  };

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

  const handleSend = async () => {
    if (!subject.trim()) return toast.error('Please enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Please compose an email body.');
    if (audience.length === 0) return toast.error('Please select at least one audience.');
    if (recipientCount === 0) return toast.error('No recipients found for selected audience.');

    // If sendAt is set, schedule instead of sending immediately
    if (sendAt) {
      const sendAtDate = new Date(sendAt);
      if (sendAtDate <= new Date()) {
        return toast.error('Scheduled time must be in the future.');
      }

      const confirmed = window.confirm(
        `Schedule this email for ${sendAtDate.toLocaleString()}?\n\nSubject: ${subject}\nRecipients: ~${recipientCount.toLocaleString()}`
      );
      if (!confirmed) return;

      setLoading(true);
      const toastId = toast.loading('Scheduling campaign...');

      try {
        const res = await axios.post(`${API_BASE_URL}/email-campaign/schedule`, {
          subject: subject.trim(),
          body,
          audience,
          sendAt: sendAtDate.toISOString(),
          ...(audience.includes('specific') && { specificEmails: preselectedEmails })
        });

        if (res.data.status) {
          toast.success(res.data.msg, { id: toastId });
          setSubject('');
          setBody('');
          setSendAt('');
          // Refresh scheduled list
          const listRes = await axios.get(`${API_BASE_URL}/email-campaign/scheduled`);
          if (listRes.data.status) setScheduledEmails(listRes.data.data);
        } else {
          toast.error(res.data.msg || 'Failed to schedule', { id: toastId });
        }
      } catch (error) {
        toast.error(error.response?.data?.msg || 'Failed to schedule campaign', { id: toastId });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Send immediately
    const confirmed = window.confirm(
      `Send this email to ~${recipientCount.toLocaleString()} recipient(s) NOW?\n\nSubject: ${subject}`
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading(`Sending to ${recipientCount.toLocaleString()} recipients...`);

    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send`, {
        subject: subject.trim(),
        body,
        audience,
        ...(audience.includes('specific') && { specificEmails: preselectedEmails })
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

  const handleCancelScheduled = async (id) => {
    if (!window.confirm('Cancel this scheduled email?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/email-campaign/scheduled/${id}`);
      if (res.data.status) {
        toast.success('Scheduled email cancelled.');
        setScheduledEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e));
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to cancel');
    }
  };

  // Product picker handlers
  const handleFetchProducts = async () => {
    const raw = productIdsInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (raw.length === 0) return toast.error('Paste at least one product ID.');
    setProductFetchLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/products-preview`, { ids: raw });
      if (res.data.status) {
        const found = res.data.data;
        if (found.length === 0) return toast.error('No products found for those IDs.');
        // merge, avoid duplicates
        setPickedProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...found.filter(p => !existingIds.has(p.id))];
        });
        const notFound = raw.filter(id =>
          !found.some(p => p.bagcheeId === id || p.isbn13 === id || p.isbn10 === id)
        );
        if (notFound.length > 0) toast(`${found.length} found, ${notFound.length} not found: ${notFound.join(', ')}`, { icon: '⚠️' });
        else toast.success(`${found.length} product(s) loaded.`);
        setProductIdsInput('');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to fetch products.');
    } finally {
      setProductFetchLoading(false);
    }
  };

  const handleRemovePickedProduct = (id) => {
    setPickedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleInsertProductCards = () => {
    if (pickedProducts.length === 0) return toast.error('No products to insert.');
    const cards = pickedProducts.map(p => {
      const imgSrc = getProductImageUrl(p);
      const price = p.inrPrice ? `₹${p.inrPrice}` : (p.price ? `$${p.price}` : '');
      return `
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:540px;margin:0 auto 20px;border:1px solid #e6decd;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    ${imgSrc ? `<td style="width:90px;vertical-align:top;padding:12px;">
      <img src="${imgSrc}" alt="${p.title}" width="80" style="display:block;border-radius:4px;object-fit:cover;" />
    </td>` : ''}
    <td style="vertical-align:top;padding:12px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0B2F3A;">${p.title}</p>
      <p style="margin:0 0 8px;font-size:12px;color:#4A6fa5;">ID: ${p.bagcheeId}</p>
      ${price ? `<p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#008DDA;">${price}</p>` : ''}
      <a href="${process.env.REACT_APP_FRONTEND_URL || '#'}/books/${p.bagcheeId}" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:8px 18px;font-size:13px;font-weight:bold;border-radius:6px;">View Book</a>
    </td>
  </tr>
</table>`;
    }).join('\n');

    setBody(prev => (prev && prev !== '<p><br></p>' ? prev + '\n' + cards : cards));
    toast.success(`${pickedProducts.length} product card(s) inserted into email.`);
  };

  // Get min datetime for the picker (now + 5 min)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    sending: 'bg-blue-100 text-blue-700',
    sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

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

        {/* Product Picker */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">
            <Package size={13} className="inline mr-1 -mt-0.5" /> Product Picker
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Paste product IDs (Bagchee ID or ISBN), one per line or comma-separated. Fetched products will be inserted as cards into the email body.</p>

          <div className="flex gap-3 mb-3">
            <textarea
              value={productIdsInput}
              onChange={(e) => setProductIdsInput(e.target.value)}
              placeholder={"BB1234\nBB5678\n9780123456789"}
              rows={3}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono resize-none"
            />
            <button
              onClick={handleFetchProducts}
              disabled={productFetchLoading}
              className="self-start bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-sm whitespace-nowrap"
            >
              {productFetchLoading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
              Fetch
            </button>
          </div>

          {pickedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {pickedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-cream-50 border border-cream-200 rounded-lg">
                    {getProductImageUrl(p) && (
                      <img
                        src={getProductImageUrl(p)}
                        alt={p.title}
                        className="w-10 h-14 object-cover rounded shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main truncate">{p.title}</p>
                      <p className="text-[10px] text-primary font-mono">{p.bagcheeId}</p>
                      {(p.inrPrice || p.price) && (
                        <p className="text-[10px] font-bold text-gray-500">{p.inrPrice ? `₹${p.inrPrice}` : `$${p.price}`}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePickedProduct(p.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleInsertProductCards}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-montserrat font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <PlusCircle size={15} /> Insert {pickedProducts.length} Product Card{pickedProducts.length > 1 ? 's' : ''} into Email
              </button>
            </>
          )}
        </div>

        {/* Audience Selector — Checkboxes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3 block">
            Select Audience
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AUDIENCE_OPTIONS.map((opt) => {
              const checked = audience.includes(opt.key);
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    checked
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAudience(opt.key)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Users size={16} className={checked ? 'text-primary' : 'text-gray-400'} />
                    <span className={`text-sm font-bold font-montserrat ${checked ? 'text-primary' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Selected subscribers info */}
          {audience.includes('specific') && preselectedEmails.length > 0 && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs font-bold text-primary font-montserrat mb-1">{preselectedEmails.length} subscriber(s) selected from list:</p>
              <p className="text-[11px] text-gray-500 font-mono break-all">{preselectedEmails.slice(0, 5).join(', ')}{preselectedEmails.length > 5 ? ` +${preselectedEmails.length - 5} more` : ''}</p>
            </div>
          )}

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

        {/* Send At (Scheduler) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            <Clock size={13} className="inline mr-1 -mt-0.5" /> Send At (Optional)
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Leave empty to send immediately, or pick a date/time to schedule</p>
          <input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            min={getMinDateTime()}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat"
          />
          {sendAt && (
            <button
              onClick={() => setSendAt('')}
              className="ml-3 text-xs text-red-500 hover:text-red-700 font-montserrat font-bold"
            >
              Clear
            </button>
          )}
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
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg shadow-md font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> {sendAt ? 'Scheduling...' : 'Sending...'}</>
            ) : sendAt ? (
              <><Clock size={16} /> Schedule Campaign</>
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

        {/* Scheduled Emails Table */}
        {scheduledEmails.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-8">
            <h2 className="text-sm font-bold text-gray-700 font-montserrat mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Scheduled & Recent Campaigns
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Subject</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Send At</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Status</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Result</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat"></th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledEmails.map((email) => (
                    <tr key={email.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-montserrat text-gray-700 max-w-[200px] truncate">
                        {email.subject}
                      </td>
                      <td className="py-3 pr-4 font-montserrat text-gray-500 text-xs whitespace-nowrap">
                        {new Date(email.sendAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full font-montserrat ${statusColors[email.status] || 'bg-gray-100 text-gray-500'}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-montserrat text-xs text-gray-500">
                        {email.status === 'sent' ? `${email.sent} sent, ${email.failed} failed` : '-'}
                      </td>
                      <td className="py-3">
                        {email.status === 'pending' && (
                          <button
                            onClick={() => handleCancelScheduled(email.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Cancel"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendEmail;
